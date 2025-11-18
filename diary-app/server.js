require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const matter = require('gray-matter');
const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files with cache busting
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Initialize OpenAI with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Initialize SQLite database
const db = new sqlite3.Database('./diary.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE,
    title TEXT,
    content TEXT,
    frontmatter TEXT,
    last_modified DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    response TEXT,
    files_referenced TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Knowledge base tables
  db.run(`CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    relationships TEXT,
    context TEXT,
    last_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    status TEXT,
    description TEXT,
    people_involved TEXT,
    last_updated DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT UNIQUE,
    related_files TEXT,
    summary TEXT,
    last_updated DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Life area specific indexes
  db.run(`CREATE TABLE IF NOT EXISTS wealth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    amount TEXT,
    description TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    activity TEXT,
    description TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_name TEXT,
    relationship_type TEXT,
    interaction TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS career (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    activity TEXT,
    description TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS mindset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    thought TEXT,
    description TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    goal TEXT,
    status TEXT,
    description TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_name TEXT,
    frequency TEXT,
    description TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS mental_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    description TEXT,
    context TEXT,
    date_mentioned DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Diary repository path
const DIARY_PATH = process.env.DIARY_PATH ? path.resolve(process.env.DIARY_PATH) : path.join(__dirname, '..');

// Index all markdown files
async function indexFiles() {
  console.log('Indexing diary files...');
  
  function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, fileList);
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }
  
  const markdownFiles = walkDir(DIARY_PATH);
  
  for (const filePath of markdownFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      const stats = fs.statSync(filePath);
      
      const relativePath = path.relative(DIARY_PATH, filePath);
      const title = frontmatter.title || path.basename(filePath, '.md');
      
      db.run(
        `INSERT OR REPLACE INTO files (path, title, content, frontmatter, last_modified) 
         VALUES (?, ?, ?, ?, ?)`,
        [relativePath, title, markdownContent, JSON.stringify(frontmatter), stats.mtime.toISOString()]
      );
    } catch (error) {
      console.error(`Error indexing ${filePath}:`, error);
    }
  }
  
  console.log(`Indexed ${markdownFiles.length} files`);
}

// Build knowledge base from indexed files
async function buildKnowledgeBase() {
  console.log('Building knowledge base...');
  
  // Get all files
  const files = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM files', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  // Extract people
  const peopleSet = new Set();
  const peopleContext = {};
  
  files.forEach(file => {
    const content = file.content.toLowerCase();
    
    // Look for people patterns (very precise)
    const peoplePatterns = [
      /call with ([^,\n]+)/gi,
      /meeting with ([^,\n]+)/gi,
    ];
    
    // Comprehensive skip list for non-people
    const skipTerms = [
      // Projects and systems
      'project', 'system', 'management', 'database', 'email', 'marketing',
      'registration', 'club', 'university', 'college', 'proposal', 'best.so',
      'cashews', 'logo', 'design', 'white giant', 'annamalai', 'cursor',
      'youtuber', 'productivity', 'business', 'agency', 'minutes', 'meeting',
      'kananvisa.com', 'algorithmshift.ai', 'kanan.co', 'kapil groups',
      'karuna exam', 'karuna club', 'karuna database', 'envission books',
      'rasvihar email', 'yuukke gifting', 'snh cashews', 'smh cashews',
      'e-commerce website', 'tech stack', 'git env', 'on machine',
      'pasted image', 'steph-france.png', 'cursor meetup', 'date 16/09/25',
      'invalid date', 'the laws of human nature', 'the aladdin factor',
      '11-09-2025', '11, september', '17, september', '19, september',
      'tasks brief', 'gokul call', 'braindump', 'brief', 'crm', 'about',
      'teachers i like', 'reading-list', 'completed projects', 'projects',
      'reminders', 'areas', 'resources', 'templates', 'archives',
      'attachments', 'copilot-custom-prompts', 'cursor meetup',
      'domain names', 'on machine b', 'proposal for best.so',
      'why you should buy', '10 compelling reasons',
      // Places and organizations
      'rajabhogam', 'pallikkaranai', 'chidambaram', 'jaisalmer', 'rajasthan',
      'chennai', 'tamil nadu', 'vadodara', 'madhavaram', 'coimbatore',
      // Technical terms
      'klaviyo', 'make.com', 'gamma', 'obsidian', 'tasks', 'queries',
      'popup', 'forms', 'tracking', 'replies', 'workflow', 'integration',
      'calendar', 'research', 'competitors', 'campaign', 'performance',
      'ad campaign', 'budgeting', 'software', 'banana', 'image', 'inspiration',
      'github', 'picotrex', 'aesthetic', 'visual', 'brand', 'guidelines',
      'vibe', 'report', 'feedback', 'invoice', 'payment', 'settlement',
      'outstanding', 'follow up', 'check back', 'months', 'process', 'status',
      'regroup', 'workshop', 'ivan', 'kdp', 'book', 'titles', 'launch',
      'pending', 'review', 'approval', 'platform', 'esp', 'omnisend',
      'sample', 'email', 'designs', 'sent', 'get back', 'clear', 'actionable',
      'next', 'changes', 'respective', 'documents', 'naming', 'separate',
      'gamma.app', 'docs', 'development', 'proposal', 'ek5mtp4s076g4jp',
      'client', 'need', 'today', 'created', 'website', 'proposal',
      'llm', 'ai', 'seo', 'strategy', 'comprehensive', 'scope',
      'implementation', 'team', 'assembly', 'tool', 'setup',
      // File names and dates
      '20250911094325.png', '20250911094336.png', '20250911094640.png',
      '20250917111939.png', 'steph-france.png', '20250911094640.png',
      '16-09-25 12-05-31', 'date 16/09/25 time:12:03:03',
      '11-09-2025, thursday', '11, september, 2025 (thursday)',
      '15, september, 2025 (monday)', '14, september, 2025 (sunday)',
      '17, september, 2025 (wednesday)', '19, september, 2025 (friday)',
      '20, september, 2025 (saturday)', '22, september, 2025 (monday)',
      '24, september, 2025 (wednesday)', '25, september, 2025 (thursday)',
      '26, september, 2025 (friday)', '27, september, 2025 (saturday)',
      // Generic terms
      'what have i learned about myself', 'cursor meetup', 'no 1',
      'ask it to understand', 'code first', 'summarise', 'make changes',
      'linting rules', 'eslint', 'favorite model', 'possible to',
      'application production ready', 'how to make', 'production ready'
    ];
    
    peoplePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1] || match[0];
        if (name && name.length > 2 && name.length < 50) {
          // Check if it's actually a person (not a project/organization)
          const isPerson = !skipTerms.some(term => 
            name.toLowerCase().includes(term) || 
            term.includes(name.toLowerCase())
          );
          
          // Additional checks for actual people
          const hasPersonIndicators = 
            name.includes(' ') || // Has first and last name
            content.includes(`with ${name}`) || // "with [name]"
            content.includes(`${name} came`) || // "[name] came"
            content.includes(`${name} and`) || // "[name] and"
            content.includes(`family`) && name.length < 20; // Family context
          
          if (isPerson && hasPersonIndicators) {
            peopleSet.add(name);
            if (!peopleContext[name]) {
              peopleContext[name] = [];
            }
            peopleContext[name].push({
              file: file.title,
              context: content.substring(Math.max(0, match.index - 100), match.index + 100)
            });
          }
        }
      }
    });
  });
  
  // Manual list of actual people (to ensure we get the real ones)
  const actualPeople = [
    'prabodh jain', 'gokulakrishnan d', 'ravinder ramalingam', 'charlie morgan',
    'andrew huberman', 'steph france', 'josh kaufman', 'jack canfield',
    'subashini', 'satyavathi', 'gayathri', 'vasantha athai', 'thirunavukkarasu mama',
    'saravanan/hemnath', 'revathy', 'thuriya', 'kumar mama', 'karthik kanan',
    'prabhu krishnamoorthy', 'karan maheshwari', 'shankar prabhu j', 'kapil maheshwari'
  ];
  
  // Add actual people to the set and find their context
  actualPeople.forEach(person => {
    peopleSet.add(person);
    if (!peopleContext[person]) {
      peopleContext[person] = [];
    }
    
    // Find context for this person in all files
    files.forEach(file => {
      const content = file.content.toLowerCase();
      const personLower = person.toLowerCase();
      
      if (content.includes(personLower)) {
        const index = content.indexOf(personLower);
        const context = file.content.substring(Math.max(0, index - 200), index + 200);
        peopleContext[person].push({
          file: file.title,
          context: context
        });
      }
    });
  });
  
  // Store people in database
  for (const person of peopleSet) {
    const context = peopleContext[person] || [];
    db.run(
      `INSERT OR REPLACE INTO people (name, context, last_mentioned) VALUES (?, ?, ?)`,
      [person, JSON.stringify(context), new Date().toISOString()]
    );
  }
  
  // Extract projects
  const projectsSet = new Set();
  const projectContext = {};
  
  files.forEach(file => {
    const content = file.content.toLowerCase();
    
    // Look for project patterns
    const projectPatterns = [
      /\[\[([^\]]+ project[^\]]*)\]\]/gi,
      /\[\[([^\]]+ project)\]\]/gi,
      /project[:\s]+([^,\n]+)/gi,
    ];
    
    projectPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const project = match[1] || match[0];
        if (project && project.length > 3 && project.length < 100) {
          projectsSet.add(project);
          if (!projectContext[project]) {
            projectContext[project] = [];
          }
          projectContext[project].push({
            file: file.title,
            context: content.substring(Math.max(0, match.index - 100), match.index + 100)
          });
        }
      }
    });
  });
  
  // Store projects in database
  for (const project of projectsSet) {
    const context = projectContext[project] || [];
    db.run(
      `INSERT OR REPLACE INTO projects (name, description, last_updated) VALUES (?, ?, ?)`,
      [project, JSON.stringify(context), new Date().toISOString()]
    );
  }
  
  console.log(`Knowledge base built: ${peopleSet.size} people, ${projectsSet.size} projects`);
}

// Build specific life area indexes
async function buildLifeAreaIndexes() {
  console.log('Building life area indexes...');
  
  // Get all files
  const files = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM files', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  // Wealth patterns
  const wealthPatterns = [
    { pattern: /(\$[\d,]+|\d+[\d,]*\s*(?:dollars?|usd|rs\.?|rupees?|inr))/gi, category: 'money' },
    { pattern: /(budget|budgeting|expense|income|salary|payment|invoice|bill)/gi, category: 'financial' },
    { pattern: /(investment|invest|stock|portfolio|savings|bank)/gi, category: 'investment' },
    { pattern: /(debt|loan|credit|mortgage)/gi, category: 'debt' }
  ];
  
  // Health patterns
  const healthPatterns = [
    { pattern: /(exercise|workout|gym|running|walking|yoga|fitness)/gi, category: 'exercise' },
    { pattern: /(diet|food|meal|eating|nutrition|calorie)/gi, category: 'nutrition' },
    { pattern: /(sleep|rest|tired|energy|fatigue)/gi, category: 'sleep' },
    { pattern: /(doctor|medical|health|illness|sick|medicine)/gi, category: 'medical' },
    { pattern: /(stress|anxiety|mental|therapy|counseling)/gi, category: 'mental_health' }
  ];
  
  // Relationship patterns
  const relationshipPatterns = [
    { pattern: /(family|mother|father|sister|brother|parent)/gi, type: 'family' },
    { pattern: /(friend|buddy|colleague|co-worker)/gi, type: 'friend' },
    { pattern: /(client|customer|business)/gi, type: 'professional' },
    { pattern: /(partner|boyfriend|girlfriend|spouse|wife|husband)/gi, type: 'romantic' }
  ];
  
  // Career patterns
  const careerPatterns = [
    { pattern: /(work|job|career|profession|employment)/gi, category: 'work' },
    { pattern: /(project|task|deadline|meeting|presentation)/gi, category: 'projects' },
    { pattern: /(skill|learn|study|course|training)/gi, category: 'learning' },
    { pattern: /(promotion|raise|salary|bonus)/gi, category: 'advancement' }
  ];
  
  // Mindset patterns
  const mindsetPatterns = [
    { pattern: /(goal|objective|target|aim|purpose)/gi, category: 'goals' },
    { pattern: /(habit|routine|daily|weekly|monthly)/gi, category: 'habits' },
    { pattern: /(belief|value|principle|philosophy)/gi, category: 'values' },
    { pattern: /(challenge|difficulty|problem|obstacle)/gi, category: 'challenges' },
    { pattern: /(success|achievement|accomplishment|win)/gi, category: 'success' }
  ];
  
  // Process each file for life area content
  files.forEach(file => {
    const content = file.content.toLowerCase();
    const title = file.title;
    
    // Extract wealth information
    wealthPatterns.forEach(({ pattern, category }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO wealth (category, amount, context, date_mentioned) VALUES (?, ?, ?, ?)`,
          [category, match[0], context, file.last_modified]
        );
      }
    });
    
    // Extract health information
    healthPatterns.forEach(({ pattern, category }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO health (category, activity, context, date_mentioned) VALUES (?, ?, ?, ?)`,
          [category, match[0], context, file.last_modified]
        );
      }
    });
    
    // Extract relationship information
    relationshipPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO relationships (relationship_type, interaction, context, date_mentioned) VALUES (?, ?, ?, ?)`,
          [type, match[0], context, file.last_modified]
        );
      }
    });
    
    // Extract career information
    careerPatterns.forEach(({ pattern, category }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO career (category, activity, context, date_mentioned) VALUES (?, ?, ?, ?)`,
          [category, match[0], context, file.last_modified]
        );
      }
    });
    
    // Extract mindset information
    mindsetPatterns.forEach(({ pattern, category }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO mindset (category, thought, context, date_mentioned) VALUES (?, ?, ?, ?)`,
          [category, match[0], context, file.last_modified]
        );
      }
    });
    
    // Extract goals (look for specific goal patterns)
    const goalPatterns = [
      /(?:goal|objective|target)[:\s]+([^.\n]+)/gi,
      /(?:want to|plan to|hope to|aim to)\s+([^.\n]+)/gi,
      /(?:daily goal|weekly goal|monthly goal)[:\s]+([^.\n]+)/gi
    ];
    
    goalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const goal = match[1] || match[0];
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO goals (goal, context, date_mentioned) VALUES (?, ?, ?)`,
          [goal, context, file.last_modified]
        );
      }
    });
    
    // Extract habits (look for habit patterns)
    const habitPatterns = [
      /(?:habit|routine)[:\s]+([^.\n]+)/gi,
      /(?:daily|weekly|monthly)[:\s]+([^.\n]+)/gi,
      /(?:always|usually|often|regularly)\s+([^.\n]+)/gi
    ];
    
    habitPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const habit = match[1] || match[0];
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO habits (habit_name, context, date_mentioned) VALUES (?, ?, ?)`,
          [habit, context, file.last_modified]
        );
      }
    });
    
    // Extract mental models (look for specific patterns)
    const mentalModelPatterns = [
      /(?:mental model|framework|principle|concept)[:\s]+([^.\n]+)/gi,
      /(?:think|believe|understand|realize)\s+that\s+([^.\n]+)/gi,
      /(?:key insight|learning|takeaway)[:\s]+([^.\n]+)/gi
    ];
    
    mentalModelPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const model = match[1] || match[0];
        const context = file.content.substring(Math.max(0, match.index - 100), match.index + 100);
        db.run(
          `INSERT INTO mental_models (model_name, context, date_mentioned) VALUES (?, ?, ?)`,
          [model, context, file.last_modified]
        );
      }
    });
  });
  
  console.log('Life area indexes built successfully');
}

// Watch for file changes
const watcher = chokidar.watch(DIARY_PATH, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

watcher.on('change', (filePath) => {
  if (filePath.endsWith('.md')) {
    console.log(`File changed: ${filePath}`);
    indexFiles();
  }
});

// API Routes

// Get all files
app.get('/api/files', (req, res) => {
  db.all('SELECT * FROM files ORDER BY last_modified DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get specific file
app.get('/api/files/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM files WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.json(row);
  });
});

// Search files
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  if (!query) {
    res.json([]);
    return;
  }
  
  db.all(
    `SELECT * FROM files 
     WHERE title LIKE ? OR content LIKE ? 
     ORDER BY last_modified DESC`,
    [`%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Chat with AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Get relevant files based on message
    const relevantFiles = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM files 
         WHERE title LIKE ? OR content LIKE ? 
         ORDER BY last_modified DESC 
         LIMIT 8`,
        [`%${message}%`, `%${message}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Create context from relevant files
    let context = "You are an AI assistant helping with a personal diary. Here's relevant context:\n\n";
    
    relevantFiles.forEach(file => {
      context += `--- ${file.title} (${file.path}) ---\n`;
      context += file.content.substring(0, 1000) + '\n\n';
    });
    
    // Use knowledge base for better context
    if (message.toLowerCase().includes('people') || message.toLowerCase().includes('person') || message.toLowerCase().includes('who')) {
      const people = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM people ORDER BY last_mentioned DESC LIMIT 10', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      if (people.length > 0) {
        context += "\n--- People in Your Life (from Knowledge Base) ---\n";
        people.forEach(person => {
          context += `Person: ${person.name}\n`;
          if (person.context) {
            const contexts = JSON.parse(person.context);
            contexts.slice(0, 2).forEach(ctx => {
              context += `  - From ${ctx.file}: ${ctx.context}\n`;
            });
          }
          context += '\n';
        });
      }
    }
    
    if (message.toLowerCase().includes('project') || message.toLowerCase().includes('work')) {
      const projects = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM projects ORDER BY last_updated DESC LIMIT 8', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      if (projects.length > 0) {
        context += "\n--- Your Projects (from Knowledge Base) ---\n";
        projects.forEach(project => {
          context += `Project: ${project.name}\n`;
          if (project.description) {
            const contexts = JSON.parse(project.description);
            contexts.slice(0, 2).forEach(ctx => {
              context += `  - From ${ctx.file}: ${ctx.context}\n`;
            });
          }
          context += '\n';
        });
      }
    }
    
    // Add life area context based on query
    if (message.toLowerCase().includes('wealth') || message.toLowerCase().includes('money') || message.toLowerCase().includes('financial')) {
      const wealth = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM wealth ORDER BY date_mentioned DESC LIMIT 5', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      if (wealth.length > 0) {
        context += "\n--- Wealth & Financial Context ---\n";
        wealth.forEach(item => {
        context += `${item.category}: ${item.amount}\n`;
        context += `  Context: ${item.context}\n\n`;
        });
      }
    }
    
    if (message.toLowerCase().includes('health') || message.toLowerCase().includes('exercise') || message.toLowerCase().includes('diet')) {
      const health = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM health ORDER BY date_mentioned DESC LIMIT 5', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      if (health.length > 0) {
        context += "\n--- Health & Wellness Context ---\n";
        health.forEach(item => {
          context += `${item.category}: ${item.activity}\n`;
          context += `  Context: ${item.context}\n\n`;
        });
      }
    }
    
    if (message.toLowerCase().includes('goal') || message.toLowerCase().includes('objective') || message.toLowerCase().includes('target')) {
      const goals = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM goals ORDER BY date_mentioned DESC LIMIT 5', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      if (goals.length > 0) {
        context += "\n--- Goals & Objectives ---\n";
        goals.forEach(goal => {
          context += `Goal: ${goal.goal}\n`;
          context += `  Context: ${goal.context}\n\n`;
        });
      }
    }
    
    if (message.toLowerCase().includes('habit') || message.toLowerCase().includes('routine') || message.toLowerCase().includes('daily')) {
      const habits = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM habits ORDER BY date_mentioned DESC LIMIT 5', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      if (habits.length > 0) {
        context += "\n--- Habits & Routines ---\n";
        habits.forEach(habit => {
          context += `Habit: ${habit.habit_name}\n`;
          context += `  Context: ${habit.context}\n\n`;
        });
      }
    }
    
    // Add behavioral patterns and goals context
    const patternsFile = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM files WHERE path LIKE ?',
        ['%Behavioral Patterns%'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (patternsFile) {
      context += `--- Behavioral Patterns ---\n`;
      context += patternsFile.content.substring(0, 500) + '\n\n';
    }
    
    const goalsFile = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM files WHERE path LIKE ?',
        ['%goals.md%'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (goalsFile) {
      context += `--- Current Goals ---\n`;
      context += goalsFile.content.substring(0, 500) + '\n\n';
    }
    
    context += `\nUser Question: ${message}\n\nPlease provide a helpful response based on the diary content. Reference specific files when relevant.`;
    
    // Get AI response - try multiple free models in sequence
    const freeModels = [
      "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemini-flash-1.5:free", 
      "microsoft/phi-3-mini-128k-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "huggingface/zephyr-7b-beta:free"
    ];
    
    let completion;
    let modelUsed = null;
    
    for (const model of freeModels) {
      try {
        console.log(`Trying free model: ${model}`);
        completion = await openai.chat.completions.create({
          model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for a personal diary. Be supportive, insightful, and reference specific diary entries when relevant. Help with self-reflection, goal tracking, and understanding patterns. IMPORTANT: When asked about PEOPLE, use the specific names and context provided in the knowledge base. Include actual details from diary entries like dates, activities, relationships, and interactions. Be concrete and specific rather than generic. For family members, mention their names and the specific context from diary entries. Format your responses in clean, readable text without markdown formatting. Use simple line breaks and bullet points (•) instead of markdown syntax. Make responses conversational and easy to read on mobile."
        },
        {
          role: "user",
          content: context
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
        modelUsed = model;
        console.log(`Successfully used free model: ${model}`);
        break; // Exit the loop if successful
      } catch (error) {
        console.log(`Free model ${model} failed:`, error.message);
        // Continue to next model
      }
    }
    
    // If all free models failed, use a simple fallback response
    if (!completion) {
      console.log('All free models failed, using fallback response');
      const fallbackResponse = `I'm having trouble connecting to AI models right now. Based on your diary content, I can see you have ${context.length > 1000 ? 'extensive' : 'some'} entries about your goals, projects, and personal development. 

Your diary shows focus on:
• Character development and empathy practice
• Professional projects and client work  
• Personal relationships and family connections
• Health and wellness patterns

Would you like me to try again, or would you prefer to ask a more specific question about your diary content?`;
      
      // Save fallback response to chat history
      db.run(
        'INSERT INTO chat_history (message, response, files_referenced) VALUES (?, ?, ?)',
        [message, fallbackResponse, JSON.stringify(relevantFiles.map(f => f.path))]
      );
      
      return res.json({
        response: fallbackResponse,
        files: relevantFiles,
        model: 'fallback'
      });
    }
    
    const response = completion.choices[0].message.content;
    
    // Check if response is empty or too short
    if (!response || response.trim().length < 10) {
      console.log(`Model ${modelUsed} returned empty response, using fallback`);
      const fallbackResponse = `I'm having trouble getting a proper response from the AI model right now. Based on your diary content, I can see you have extensive entries about your goals, projects, and personal development. 

Your diary shows focus on:
• Character development and empathy practice
• Professional projects and client work  
• Personal relationships and family connections
• Health and wellness patterns

Would you like me to try again, or would you prefer to ask a more specific question about your diary content?`;
      
      // Save fallback response to chat history
      db.run(
        'INSERT INTO chat_history (message, response, files_referenced) VALUES (?, ?, ?)',
        [message, fallbackResponse, JSON.stringify(relevantFiles.map(f => f.path))]
      );
      
      return res.json({
        response: fallbackResponse,
        relevantFiles: relevantFiles.map(f => ({
          id: f.id,
          title: f.title,
          path: f.path,
          excerpt: f.content.substring(0, 200) + '...'
        })),
        model: 'fallback-empty-response'
      });
    }
    
    // Save to chat history
    db.run(
      'INSERT INTO chat_history (message, response, files_referenced) VALUES (?, ?, ?)',
      [message, response, JSON.stringify(relevantFiles.map(f => ({ id: f.id, title: f.title, path: f.path })))]
    );
    
    res.json({
      response,
      relevantFiles: relevantFiles.map(f => ({
        id: f.id,
        title: f.title,
        path: f.path,
        excerpt: f.content.substring(0, 200) + '...'
      })),
      model: modelUsed
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Get chat history
app.get('/api/chat/history', (req, res) => {
  db.all('SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT 50', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get knowledge base
app.get('/api/knowledge/people', (req, res) => {
  db.all('SELECT * FROM people ORDER BY last_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/knowledge/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY last_updated DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Life area API endpoints
app.get('/api/life-areas/wealth', (req, res) => {
  db.all('SELECT * FROM wealth ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/life-areas/health', (req, res) => {
  db.all('SELECT * FROM health ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/life-areas/relationships', (req, res) => {
  db.all('SELECT * FROM relationships ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/life-areas/career', (req, res) => {
  db.all('SELECT * FROM career ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/life-areas/mindset', (req, res) => {
  db.all('SELECT * FROM mindset ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/life-areas/goals', (req, res) => {
  db.all('SELECT * FROM goals ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/life-areas/habits', (req, res) => {
  db.all('SELECT * FROM habits ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/life-areas/mental-models', (req, res) => {
  db.all('SELECT * FROM mental_models ORDER BY date_mentioned DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
async function startServer() {
  await indexFiles();
  await buildKnowledgeBase();
  await buildLifeAreaIndexes();
  
  // Schedule daily re-indexing and knowledge base updates
  cron.schedule('0 2 * * *', () => {
    console.log('Running daily file re-indexing and knowledge base update...');
    indexFiles().then(() => buildKnowledgeBase()).then(() => buildLifeAreaIndexes());
  });
  
  app.listen(PORT, () => {
    console.log(`Diary AI App running on http://localhost:${PORT}`);
    console.log('Open this URL on your Android phone to use the app');
    console.log('Knowledge base initialized with people, projects, and life areas');
  });
}

startServer().catch(console.error);

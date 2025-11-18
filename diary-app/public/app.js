// Diary AI App - Main JavaScript
// Following Erik Kennedy's UI heuristics and Dan Mall's design principles

class DiaryApp {
  constructor() {
    this.currentView = 'home';
    this.chatHistory = [];
    this.files = [];
    this.isLoading = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadRecentFiles();
    this.setupPWA();
  }

  setupEventListeners() {
    // Menu toggle
    document.querySelector('.menu-btn').addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Back button
    document.querySelector('.back-btn').addEventListener('click', () => {
      this.showHome();
    });

    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const label = e.currentTarget.querySelector('.nav-label').textContent.toLowerCase();
        if (label === 'home') this.showHome();
        if (label === 'chat') this.showChat();
        if (label === 'notes') this.showFiles();
        if (label === 'profile') this.showProfile();
      });
    });

    // Chat functionality
    document.getElementById('sendBtn').addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.performSearch();
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // File search
    document.getElementById('filesSearch').addEventListener('input', (e) => {
      this.filterFiles(e.target.value);
    });

    document.getElementById('filesFilter').addEventListener('change', (e) => {
      this.filterFilesByType(e.target.value);
    });

    // Modal functionality
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('fileModal').addEventListener('click', (e) => {
      if (e.target.id === 'fileModal') {
        this.closeModal();
      }
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const menuBtn = document.getElementById('menuBtn');
      
      if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
  }

  showHome() {
    this.switchView('home');
    this.currentView = 'home';
    this.updateNavigation('home');
    this.closeSidebar();
  }

  showChat() {
    this.switchView('chat');
    this.currentView = 'chat';
    this.updateNavigation('chat');
    this.closeSidebar();
  }

  showFiles() {
    this.switchView('files');
    this.currentView = 'files';
    this.updateNavigation('notes');
    this.loadFiles();
    this.closeSidebar();
  }

  showProfile() {
    this.switchView('profile');
    this.currentView = 'profile';
    this.updateNavigation('profile');
    this.closeSidebar();
  }

  showSearch() {
    this.switchView('search');
    this.currentView = 'search';
    this.closeSidebar();
  }

  updateNavigation(activeTab) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Find the nav item that corresponds to the active tab
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const label = item.querySelector('.nav-label').textContent.toLowerCase();
      if (label === activeTab) {
        item.classList.add('active');
      }
    });
  }

  switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });

    // Show selected view
    document.getElementById(`${viewName}View`).classList.add('active');
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || this.isLoading) return;

    // Clear input and disable send button
    input.value = '';
    this.setLoading(true);

    // Add user message to chat
    this.addMessage(message, 'user');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add AI response to chat
      this.addMessage(data.response, 'assistant', data.relevantFiles);
      
    } catch (error) {
      console.error('Chat error:', error);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
      this.setLoading(false);
    }
  }

  addMessage(content, sender, fileReferences = []) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Convert markdown to clean HTML for AI responses
    if (sender === 'assistant') {
      messageContent.innerHTML = this.formatAIResponse(content);
    } else {
      messageContent.textContent = content;
    }

    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString();

    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);

    // Add file references if any
    if (fileReferences && fileReferences.length > 0) {
      fileReferences.forEach(file => {
        const fileRef = document.createElement('div');
        fileRef.className = 'file-reference';
        fileRef.innerHTML = `
          <h4>📄 ${file.title}</h4>
          <p>${file.excerpt}</p>
          <div class="file-path">${file.path}</div>
        `;
        fileRef.addEventListener('click', () => {
          this.viewFile(file.id);
        });
        messageDiv.appendChild(fileRef);
      });
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Store in chat history
    this.chatHistory.push({
      content,
      sender,
      timestamp: new Date(),
      fileReferences
    });
  }

  setLoading(loading) {
    this.isLoading = loading;
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (loading) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
      chatInput.disabled = true;
    } else {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  async loadFiles() {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to load files');
      
      this.files = await response.json();
      this.renderFiles(this.files);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }

  renderFiles(files) {
    const filesList = document.getElementById('filesList');
    filesList.innerHTML = '';

    if (files.length === 0) {
      filesList.innerHTML = '<div class="loading">No files found</div>';
      return;
    }

    files.forEach(file => {
      const fileCard = document.createElement('div');
      fileCard.className = 'file-card';
      fileCard.innerHTML = `
        <h3>${file.title}</h3>
        <p>${file.content.substring(0, 150)}...</p>
        <div class="file-meta">${new Date(file.last_modified).toLocaleDateString()}</div>
      `;
      
      fileCard.addEventListener('click', () => {
        this.viewFile(file.id);
      });
      
      filesList.appendChild(fileCard);
    });
  }

  filterFiles(query) {
    if (!query) {
      this.renderFiles(this.files);
      return;
    }

    const filtered = this.files.filter(file => 
      file.title.toLowerCase().includes(query.toLowerCase()) ||
      file.content.toLowerCase().includes(query.toLowerCase())
    );
    
    this.renderFiles(filtered);
  }

  filterFilesByType(type) {
    if (type === 'all') {
      this.renderFiles(this.files);
      return;
    }

    const filtered = this.files.filter(file => {
      const path = file.path.toLowerCase();
      switch (type) {
        case 'daily':
          return path.includes('daily') || path.includes('notes');
        case 'projects':
          return path.includes('projects');
        case 'goals':
          return path.includes('goals') || path.includes('behavioral');
        default:
          return true;
      }
    });
    
    this.renderFiles(filtered);
  }

  async performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      this.renderSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  renderSearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="loading">No results found</div>';
      return;
    }

    results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.innerHTML = `
        <h3>${result.title}</h3>
        <p>${result.content.substring(0, 200)}...</p>
        <div class="file-meta">${new Date(result.last_modified).toLocaleDateString()}</div>
      `;
      
      resultItem.addEventListener('click', () => {
        this.viewFile(result.id);
      });
      
      resultsContainer.appendChild(resultItem);
    });
  }

  async viewFile(fileId) {
    try {
      const response = await fetch(`/api/files/${fileId}`);
      if (!response.ok) throw new Error('File not found');
      
      const file = await response.json();
      this.showFileModal(file);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  }

  showFileModal(file) {
    const modal = document.getElementById('fileModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    title.textContent = file.title;
    
    // Convert markdown to HTML (basic conversion)
    const htmlContent = this.markdownToHtml(file.content);
    content.innerHTML = htmlContent;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('fileModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }

  formatAIResponse(content) {
    // Clean up AI responses to be more readable
    return content
      // Remove markdown headers and make them bold
      .replace(/^### (.*$)/gim, '<div style="font-weight: 600; margin: 16px 0 8px 0; color: #1f2937;">$1</div>')
      .replace(/^## (.*$)/gim, '<div style="font-weight: 600; margin: 20px 0 10px 0; color: #1f2937; font-size: 1.1em;">$1</div>')
      .replace(/^# (.*$)/gim, '<div style="font-weight: 700; margin: 24px 0 12px 0; color: #1f2937; font-size: 1.2em;">$1</div>')
      
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Convert italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Convert bullet points to clean list items
      .replace(/^- (.*$)/gim, '<div style="margin: 8px 0; padding-left: 16px; position: relative;">• $1</div>')
      
      // Convert numbered lists
      .replace(/^\d+\. (.*$)/gim, '<div style="margin: 8px 0; padding-left: 16px;">$1</div>')
      
      // Convert code blocks
      .replace(/`(.*?)`/g, '<span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</span>')
      
      // Convert line breaks to proper paragraphs
      .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6;">')
      
      // Wrap in paragraph tags
      .replace(/^(?!<[d|s|e])/gm, '<p style="margin: 12px 0; line-height: 1.6;">')
      .replace(/(?<!>)$/gm, '</p>')
      
      // Clean up any double paragraph tags
      .replace(/<\/p><p[^>]*>/g, '<br><br>')
      .replace(/<p[^>]*><\/p>/g, '');
  }

  markdownToHtml(markdown) {
    // Basic markdown to HTML conversion for file content
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|l])/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>');
  }

  async loadRecentFiles() {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) return;
      
      const files = await response.json();
      const recentFiles = files.slice(0, 5);
      
      const container = document.getElementById('recentFiles');
      container.innerHTML = '';
      
      recentFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'recent-file-item';
        fileItem.textContent = file.title;
        fileItem.addEventListener('click', () => {
          this.viewFile(file.id);
          this.closeSidebar();
        });
        container.appendChild(fileItem);
      });
    } catch (error) {
      console.error('Error loading recent files:', error);
    }
  }

  setupPWA() {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Handle install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button or notification
      this.showInstallPrompt(deferredPrompt);
    });
  }

  showInstallPrompt(deferredPrompt) {
    // You can add a custom install button here
    console.log('App can be installed');
  }

  startNewChat() {
    // Clear current chat messages
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <h2>Welcome to your Diary AI Assistant</h2>
        <p>Ask me anything about your diary, goals, projects, or behavioral patterns. I can help you reflect, find information, and track your progress.</p>
        <div class="suggested-questions">
          <button class="suggestion-btn" onclick="askQuestion('What are my current goals?')">What are my current goals?</button>
          <button class="suggestion-btn" onclick="askQuestion('Show me my behavioral patterns')">Show me my behavioral patterns</button>
          <button class="suggestion-btn" onclick="askQuestion('What projects am I working on?')">What projects am I working on?</button>
          <button class="suggestion-btn" onclick="askQuestion('Help me reflect on my progress')">Help me reflect on my progress</button>
        </div>
      </div>
    `;

    // Clear chat history
    this.chatHistory = [];

    // Clear input field
    const chatInput = document.getElementById('chatInput');
    chatInput.value = '';
    chatInput.focus();

    // Show a brief confirmation
    this.showNotification('New chat session started!');
  }

  showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-primary);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      box-shadow: var(--shadow-lg);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Utility functions
function askQuestion(question) {
  const chatInput = document.getElementById('chatInput');
  chatInput.value = question;
  app.sendMessage();
}

// Global functions for HTML onclick handlers
function showHome() {
  window.app.showHome();
}

function showChat() {
  window.app.showChat();
}

function showFiles() {
  window.app.showFiles();
}

function showProfile() {
  window.app.showProfile();
}

function showSearch() {
  window.app.showSearch();
}

function askQuestion(question) {
  window.app.askQuestion(question);
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new DiaryApp();
  window.app = app; // Make it globally accessible
});

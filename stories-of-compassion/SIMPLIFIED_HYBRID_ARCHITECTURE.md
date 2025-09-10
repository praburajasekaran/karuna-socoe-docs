# Karuna Exam System - Simplified Hybrid Architecture

## **🎯 Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                SIMPLIFIED HYBRID ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   WordPress Admin   │    │   Node.js Exam Microservice    │ │
│  │   ┌───────────────┐ │    │   ┌───────────────────────────┐ │ │
│  │   │ School Mgmt   │ │    │   │ Student Authentication   │ │ │
│  │   │ Student Mgmt  │ │    │   │ Exam Delivery           │ │ │
│  │   │ Question Mgmt │ │    │   │ Auto-Save System        │ │ │
│  │   │ Reports       │ │    │   │ Session Management      │ │ │
│  │   │ Certificates  │ │    │   │ Offline Support         │ │ │
│  │   │ Email System  │ │    │   └───────────────────────────┘ │ │
│  │   └───────────────┘ │    └─────────────────────────────────┘ │
│  └─────────────────────┘                                        │
│           │                                │                    │
│           └────────────────┬───────────────┘                    │
│                           │                                     │
│                    ┌──────▼──────┐                             │
│                    │ MySQL       │                             │
│                    │ Database    │                             │
│                    │ + Redis     │                             │
│                    └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## **🛠️ Technology Stack**

### **WordPress Admin Interface**
- **Framework**: WordPress 6.4+ with custom admin plugin
- **Purpose**: Management interface for administrators and schools
- **Users**: ~10-20 concurrent admin users (low load)
- **Responsibilities**:
  - School management and registration
  - Student bulk upload and management
  - Question bank creation and editing
  - Report generation and analytics
  - Certificate generation and distribution
  - Email workflow management

### **Node.js Exam Microservice**
- **Framework**: Node.js 18 + Express + TypeScript
- **Purpose**: High-performance exam delivery
- **Users**: Up to 500 concurrent students
- **Responsibilities**:
  - Student authentication
  - Exam session management
  - Question delivery
  - Auto-save functionality
  - Answer collection
  - Basic result calculation

### **Shared Database**
- **Primary**: MySQL 8.0 with optimized configuration
- **Cache**: Redis 6.2 for sessions and auto-save data
- **Storage**: Local file system + Google Drive backup

## **📋 Detailed Component Design**

### **1. WordPress Admin Plugin Architecture**

```php
<?php
// karuna-exam-admin/
├── karuna-exam-admin.php              // Main plugin file
├── includes/
│   ├── class-admin-core.php           // Core admin functionality
│   ├── class-school-manager.php       // School CRUD operations
│   ├── class-student-manager.php      // Student management
│   ├── class-question-manager.php     // Question bank management
│   ├── class-report-generator.php     // Reports and analytics
│   ├── class-certificate-generator.php // PDF certificate creation
│   ├── class-email-workflow.php       // 6-email system
│   └── class-api-bridge.php           // Bridge to Node.js API
├── admin/
│   ├── dashboard.php                  // Main dashboard
│   ├── schools.php                    // School management interface
│   ├── students.php                   // Student management interface
│   ├── questions.php                  // Question bank interface
│   ├── reports.php                    // Analytics and reports
│   └── settings.php                   // Plugin settings
├── assets/
│   ├── css/admin.css                  // Admin styles
│   └── js/admin.js                    // Admin JavaScript
└── templates/
    ├── certificate-template.php       // Certificate PDF template
    └── email-templates/               // Email templates
```

### **2. Node.js Microservice Architecture**

```typescript
// karuna-exam-api/
├── src/
│   ├── app.ts                         // Express app setup
│   ├── server.ts                      // Server startup
│   ├── config/
│   │   ├── database.ts                // Database configuration
│   │   ├── redis.ts                   // Redis configuration
│   │   └── security.ts                // Security settings
│   ├── controllers/
│   │   ├── auth.controller.ts         // Authentication
│   │   ├── exam.controller.ts         // Exam management
│   │   └── autosave.controller.ts     // Auto-save functionality
│   ├── services/
│   │   ├── auth.service.ts            // Authentication logic
│   │   ├── exam.service.ts            // Exam business logic
│   │   ├── autosave.service.ts        // Auto-save logic
│   │   └── database.service.ts        // Database operations
│   ├── middleware/
│   │   ├── auth.middleware.ts         // Authentication middleware
│   │   ├── validation.middleware.ts   // Input validation
│   │   ├── rateLimit.middleware.ts    // Rate limiting
│   │   └── security.middleware.ts     // Security headers
│   ├── models/
│   │   ├── student.model.ts           // Student data model
│   │   ├── exam.model.ts              // Exam data model
│   │   └── session.model.ts           // Session data model
│   └── utils/
│       ├── encryption.util.ts         // Data encryption
│       ├── validation.util.ts         // Input validation
│       └── logger.util.ts             // Logging utility
├── tests/
│   ├── unit/                          // Unit tests
│   ├── integration/                   // Integration tests
│   └── load/                          // Load tests
├── docker/
│   ├── Dockerfile                     // Docker configuration
│   └── docker-compose.yml             // Local development
└── package.json                       // Dependencies
```

## **🔗 System Integration**

### **1. Data Flow Architecture**

```
ADMIN WORKFLOW:
WordPress Admin → MySQL Database ← Node.js API reads

STUDENT WORKFLOW:
Student → Node.js API → MySQL Database
                    ↓
               Redis Cache (sessions/auto-save)

REPORTING WORKFLOW:
MySQL Database → WordPress Admin → Reports/Certificates
```

### **2. API Integration Points**

```typescript
// WordPress to Node.js Communication
class WordPressAPIBridge {
    private apiBaseUrl = 'http://localhost:3001/api/v1';
    private apiKey = process.env.NODEJS_API_KEY;

    async syncStudentData(students: StudentData[]): Promise<boolean> {
        const response = await fetch(`${this.apiBaseUrl}/admin/sync-students`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ students })
        });
        return response.ok;
    }

    async getExamResults(): Promise<ExamResult[]> {
        const response = await fetch(`${this.apiBaseUrl}/admin/results`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return await response.json();
    }
}
```

### **3. Shared Database Schema**

```sql
-- Core Tables (managed by WordPress)
CREATE TABLE wp_karuna_schools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    pin_code VARCHAR(10),
    region VARCHAR(100),
    total_students INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE wp_karuna_students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    kc_number_encrypted TEXT NOT NULL,
    name_encrypted TEXT NOT NULL,
    roll_number_encrypted TEXT NOT NULL,
    exam_attempted BOOLEAN DEFAULT FALSE,
    exam_completed_at TIMESTAMP NULL,
    score INT DEFAULT NULL,
    passed BOOLEAN DEFAULT FALSE,
    certificate_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES wp_karuna_schools(id),
    INDEX idx_school_id (school_id),
    INDEX idx_exam_attempted (exam_attempted)
);

CREATE TABLE wp_karuna_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    explanation TEXT,
    story_reference VARCHAR(255),
    difficulty_level INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Tables (managed by Node.js)
CREATE TABLE wp_karuna_exam_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    questions_order JSON NOT NULL,
    current_question_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES wp_karuna_students(id),
    INDEX idx_student_id (student_id),
    INDEX idx_session_token (session_token),
    INDEX idx_is_active (is_active)
);

CREATE TABLE wp_karuna_student_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer CHAR(1),
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent INT DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES wp_karuna_exam_sessions(id),
    FOREIGN KEY (question_id) REFERENCES wp_karuna_questions(id),
    UNIQUE KEY unique_session_question (session_id, question_id),
    INDEX idx_session_id (session_id)
);

-- Auto-save Table (managed by Node.js)
CREATE TABLE wp_karuna_autosave_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer CHAR(1),
    time_spent INT DEFAULT 0,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_synced BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES wp_karuna_exam_sessions(id),
    UNIQUE KEY unique_session_question_save (session_id, question_id),
    INDEX idx_session_id (session_id),
    INDEX idx_is_synced (is_synced)
);
```

## **🔒 Security Implementation**

### **1. Authentication & Authorization**

```typescript
// JWT-based authentication shared between systems
interface JWTPayload {
    studentId: number;
    kcNumber: string;
    schoolId: number;
    sessionId: string;
    iat: number;
    exp: number;
}

class AuthService {
    private static readonly JWT_SECRET = process.env.JWT_SECRET;
    private static readonly JWT_EXPIRES_IN = '7d';

    static generateToken(student: StudentData): string {
        const payload: JWTPayload = {
            studentId: student.id,
            kcNumber: student.kcNumber,
            schoolId: student.schoolId,
            sessionId: uuidv4(),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        };
        return jwt.sign(payload, this.JWT_SECRET);
    }

    static verifyToken(token: string): JWTPayload | null {
        try {
            return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
        } catch {
            return null;
        }
    }
}
```

### **2. Data Encryption**

```typescript
// AES-256-GCM encryption for sensitive data
class EncryptionService {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly KEY_LENGTH = 32;
    private static readonly IV_LENGTH = 16;
    private static readonly TAG_LENGTH = 16;

    static encrypt(text: string): EncryptedData {
        const key = crypto.scryptSync(process.env.ENCRYPTION_PASSWORD, 'salt', this.KEY_LENGTH);
        const iv = crypto.randomBytes(this.IV_LENGTH);
        const cipher = crypto.createCipher(this.ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    static decrypt(encryptedData: EncryptedData): string {
        const key = crypto.scryptSync(process.env.ENCRYPTION_PASSWORD, 'salt', this.KEY_LENGTH);
        const decipher = crypto.createDecipher(
            this.ALGORITHM, 
            key, 
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
}
```

### **3. Rate Limiting & Security Headers**

```typescript
// Multi-layer security middleware
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting configuration
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per IP per 15 minutes
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const examRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per IP
    message: 'Rate limit exceeded',
});

// Security headers
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' }
});
```

## **⚡ Performance Optimization**

### **1. Database Connection Pooling**

```typescript
// Optimized MySQL connection pool
import mysql from 'mysql2/promise';

class DatabaseService {
    private static instance: DatabaseService;
    private pool: mysql.Pool;

    private constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 25, // 5% of max concurrent users
            queueLimit: 50,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            idleTimeout: 300000,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false
        });
    }

    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    async execute(query: string, params: any[] = []): Promise<any> {
        try {
            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Database query failed:', error);
            throw new Error('Database operation failed');
        }
    }
}
```

### **2. Redis Caching Strategy**

```typescript
// Redis configuration for sessions and auto-save
import Redis from 'ioredis';

class CacheService {
    private redis: Redis;

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
        });
    }

    // Session management
    async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<void> {
        await this.redis.setex(`session:${sessionId}`, ttl, JSON.stringify(sessionData));
    }

    async getSession(sessionId: string): Promise<any | null> {
        const data = await this.redis.get(`session:${sessionId}`);
        return data ? JSON.parse(data) : null;
    }

    // Auto-save data caching
    async setAutoSaveData(sessionId: string, questionId: number, answerData: any): Promise<void> {
        await this.redis.hset(
            `autosave:${sessionId}`, 
            questionId.toString(), 
            JSON.stringify(answerData)
        );
        await this.redis.expire(`autosave:${sessionId}`, 604800); // 7 days
    }

    async getAutoSaveData(sessionId: string): Promise<Record<string, any>> {
        const data = await this.redis.hgetall(`autosave:${sessionId}`);
        const result: Record<string, any> = {};
        
        for (const [questionId, answerData] of Object.entries(data)) {
            result[questionId] = JSON.parse(answerData);
        }
        
        return result;
    }
}
```

### **3. Auto-Save Optimization**

```typescript
// Batched auto-save implementation
class AutoSaveService {
    private batchQueue: Map<string, AutoSaveData[]> = new Map();
    private batchTimer: NodeJS.Timeout | null = null;
    private readonly BATCH_SIZE = 10;
    private readonly BATCH_TIMEOUT = 5000; // 5 seconds

    async queueAutoSave(sessionId: string, answerData: AutoSaveData): Promise<void> {
        // Add to batch queue
        if (!this.batchQueue.has(sessionId)) {
            this.batchQueue.set(sessionId, []);
        }
        
        const sessionQueue = this.batchQueue.get(sessionId)!;
        
        // Remove existing answer for same question
        const existingIndex = sessionQueue.findIndex(
            item => item.questionId === answerData.questionId
        );
        if (existingIndex >= 0) {
            sessionQueue[existingIndex] = answerData;
        } else {
            sessionQueue.push(answerData);
        }

        // Cache immediately in Redis
        await this.cacheService.setAutoSaveData(
            sessionId, 
            answerData.questionId, 
            answerData
        );

        // Process batch if size reached
        if (sessionQueue.length >= this.BATCH_SIZE) {
            await this.processBatch(sessionId);
        } else {
            // Set timer for batch processing
            this.scheduleBatchProcessing();
        }
    }

    private async processBatch(sessionId: string): Promise<void> {
        const sessionQueue = this.batchQueue.get(sessionId);
        if (!sessionQueue || sessionQueue.length === 0) return;

        try {
            // Batch insert to database
            await this.databaseService.batchInsertAutoSave(sessionId, sessionQueue);
            
            // Clear processed items
            this.batchQueue.set(sessionId, []);
            
            console.log(`Processed batch of ${sessionQueue.length} auto-saves for session ${sessionId}`);
        } catch (error) {
            console.error('Batch processing failed:', error);
            // Items remain in queue for retry
        }
    }

    private scheduleBatchProcessing(): void {
        if (this.batchTimer) return;

        this.batchTimer = setTimeout(async () => {
            // Process all pending batches
            for (const sessionId of this.batchQueue.keys()) {
                await this.processBatch(sessionId);
            }
            this.batchTimer = null;
        }, this.BATCH_TIMEOUT);
    }
}
```

## **🧪 Testing Strategy**

### **1. Unit Testing Setup**

```typescript
// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.d.ts',
        '!src/tests/**/*',
    ],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75
        }
    },
    testMatch: [
        '<rootDir>/tests/unit/**/*.test.ts'
    ]
};
```

### **2. Integration Testing**

```typescript
// tests/integration/exam.flow.test.ts
describe('Complete Exam Flow Integration', () => {
    let app: Express;
    let database: DatabaseService;
    let cache: CacheService;

    beforeAll(async () => {
        app = createTestApp();
        database = DatabaseService.getInstance();
        cache = new CacheService();
        await setupTestDatabase();
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    it('should handle complete student exam flow', async () => {
        // 1. Student login
        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                kcNumber: 'TEST123',
                name: 'Test Student',
                rollNumber: 'R001'
            })
            .expect(200);

        const { token, sessionId } = loginResponse.body;

        // 2. Start exam
        const startResponse = await request(app)
            .post('/api/v1/exam/start')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(startResponse.body.questions).toHaveLength(30);

        // 3. Answer questions with auto-save
        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/api/v1/exam/auto-save')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    questionId: i + 1,
                    selectedAnswer: 'A',
                    timeSpent: 30
                })
                .expect(200);
        }

        // 4. Verify auto-save data
        const autoSaveData = await cache.getAutoSaveData(sessionId);
        expect(Object.keys(autoSaveData)).toHaveLength(5);

        // 5. Complete exam
        await request(app)
            .post('/api/v1/exam/complete')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        // 6. Verify results in database
        const results = await database.execute(
            'SELECT * FROM wp_karuna_student_answers WHERE session_id = ?',
            [sessionId]
        );
        expect(results).toHaveLength(5);
    });
});
```

### **3. Load Testing**

```typescript
// tests/load/concurrent-users.test.ts
import { check } from 'k6';
import http from 'k6/http';

export let options = {
    stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 200 },  // Ramp up to 200 users
        { duration: '5m', target: 500 },  // Peak at 500 users
        { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'], // 95% under 1s
        http_req_failed: ['rate<0.05'],    // Error rate under 5%
    },
};

export default function () {
    // Student login
    const loginPayload = {
        kcNumber: `KC${Math.floor(Math.random() * 10000)}`,
        name: 'Load Test Student',
        rollNumber: `R${Math.floor(Math.random() * 1000)}`
    };

    const loginResponse = http.post(
        'http://localhost:3001/api/v1/auth/login',
        JSON.stringify(loginPayload),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );

    check(loginResponse, {
        'login successful': (r) => r.status === 200,
        'login response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (loginResponse.status === 200) {
        const { token } = JSON.parse(loginResponse.body);

        // Start exam
        const examResponse = http.post(
            'http://localhost:3001/api/v1/exam/start',
            null,
            {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
            }
        );

        check(examResponse, {
            'exam start successful': (r) => r.status === 200,
            'exam start response time < 1s': (r) => r.timings.duration < 1000,
        });

        // Simulate auto-save
        for (let i = 1; i <= 10; i++) {
            const autoSaveResponse = http.post(
                'http://localhost:3001/api/v1/exam/auto-save',
                JSON.stringify({
                    questionId: i,
                    selectedAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
                    timeSpent: Math.floor(Math.random() * 60) + 30
                }),
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    },
                }
            );

            check(autoSaveResponse, {
                'auto-save successful': (r) => r.status === 200,
                'auto-save response time < 200ms': (r) => r.timings.duration < 200,
            });
        }
    }
}
```

## **🚀 Deployment Configuration**

### **1. Docker Setup**

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: karuna_exam
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    command: >
      --innodb-buffer-pool-size=512M
      --innodb-log-file-size=128M
      --max-connections=200
      --query-cache-size=32M

  redis:
    image: redis:6.2-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  exam-api:
    build: ./karuna-exam-api
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: karuna_exam
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_PASSWORD: ${ENCRYPTION_PASSWORD}
    depends_on:
      - mysql
      - redis
    ports:
      - "3001:3001"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  wordpress:
    image: wordpress:6.4-php8.1-apache
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_USER: ${DB_USER}
      WORDPRESS_DB_PASSWORD: ${DB_PASSWORD}
      WORDPRESS_DB_NAME: karuna_exam
      WORDPRESS_TABLE_PREFIX: wp_
    volumes:
      - wordpress_data:/var/www/html
      - ./karuna-exam-admin:/var/www/html/wp-content/plugins/karuna-exam-admin
    depends_on:
      - mysql
    ports:
      - "8080:80"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - exam-api
      - wordpress
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
  wordpress_data:
```

### **2. Nginx Configuration**

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream exam_api {
        server exam-api:3001;
    }

    upstream wordpress_admin {
        server wordpress:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=2r/s;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name karunainternational.org www.karunainternational.org;
        return 301 https://$server_name$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name karunainternational.org www.karunainternational.org;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

        # Student Exam API
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://exam_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;
        }

        # WordPress Admin
        location /admin/ {
            limit_req zone=admin_limit burst=10 nodelay;
            proxy_pass http://wordpress_admin/wp-admin/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WordPress content
        location / {
            proxy_pass http://wordpress_admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## **💰 Updated Cost Breakdown**

### **Development Cost: ₹1,20,000 (8-9 weeks)**

```
Week 1-2: WordPress Admin Plugin (₹30,000)
- School management interface
- Student management with Excel upload
- Question bank management
- Basic reporting interface

Week 3-4: Node.js Exam API (₹35,000)
- Authentication system
- Exam delivery API
- Auto-save functionality
- Session management

Week 5-6: Integration & Security (₹25,000)
- WordPress-Node.js integration
- Security implementation
- Data encryption
- API authentication

Week 7: Testing & Optimization (₹15,000)
- Unit and integration testing
- Load testing with 500 users
- Performance optimization
- Security testing

Week 8-9: Deployment & Go-Live (₹15,000)
- Docker containerization
- Production deployment
- Performance tuning
- Final testing and launch
```

### **Infrastructure Cost**

```
Development Environment: ₹2,000/month
- VPS (2GB RAM, 2 CPU cores)
- Basic monitoring

Production Environment (Exam Period): ₹6,000/month
- VPS (8GB RAM, 4 CPU cores)
- Redis managed service
- SSL certificate
- Enhanced monitoring
- Backup storage

Post-Exam: ₹1,500/month
- Minimal VPS (2GB RAM, 1 CPU core)
- Data retention
- Basic monitoring
```

### **Total Project Cost**
- **Development**: ₹1,20,000
- **Infrastructure (First Year)**: ₹18,000
- **Support**: ₹20,000
- **Total First Year**: ₹1,58,000

## **📋 Implementation Timeline**

### **Phase 1: Foundation (Weeks 1-2)**
- [ ] WordPress admin plugin structure
- [ ] Database schema creation
- [ ] Basic school management interface
- [ ] Student management with Excel upload
- [ ] Question bank management

### **Phase 2: Core API (Weeks 3-4)**
- [ ] Node.js API setup with TypeScript
- [ ] Student authentication system
- [ ] Exam session management
- [ ] Question delivery API
- [ ] Basic auto-save functionality

### **Phase 3: Integration (Weeks 5-6)**
- [ ] WordPress-Node.js API bridge
- [ ] Data encryption implementation
- [ ] Security middleware setup
- [ ] Session synchronization
- [ ] Advanced auto-save with batching

### **Phase 4: Testing (Week 7)**
- [ ] Unit test coverage (75%+)
- [ ] Integration testing
- [ ] Load testing (500 concurrent users)
- [ ] Security penetration testing
- [ ] Performance optimization

### **Phase 5: Deployment (Weeks 8-9)**
- [ ] Docker containerization
- [ ] Production environment setup
- [ ] CI/CD pipeline configuration
- [ ] Monitoring and alerting setup
- [ ] Go-live and performance tuning

## **✅ Success Criteria**

### **Performance Targets**
- [ ] Support 500 concurrent users
- [ ] API response time < 500ms (95th percentile)
- [ ] Auto-save success rate > 99.5%
- [ ] System uptime > 99.9% during exam period
- [ ] Zero data loss guarantee

### **Security Requirements**
- [ ] All sensitive data encrypted at rest
- [ ] HTTPS enforced across all endpoints
- [ ] Rate limiting implemented
- [ ] Input validation and sanitization
- [ ] Comprehensive audit logging

### **User Experience**
- [ ] Seamless auto-save and resume functionality
- [ ] Mobile-responsive exam interface
- [ ] Intuitive WordPress admin interface
- [ ] Email workflow automation
- [ ] Real-time progress tracking

This simplified hybrid architecture provides the optimal balance of performance, security, and maintainability while staying within your budget and timeline constraints. The separation of concerns between WordPress (admin) and Node.js (exam delivery) ensures each component can be optimized for its specific use case.

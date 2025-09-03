# GEO Platform - Product Requirements Document (PRD)
## Node.js + MySQL Version

## 1. Product Overview

### 1.1 Product Name
**GEO Analytics Platform** - AI Search Engine Optimization SaaS

### 1.2 Product Vision
Build a comprehensive platform that helps businesses optimize their content for AI-powered search engines (ChatGPT, Google Gemini, Perplexity AI), enabling them to maintain and improve visibility in the AI-first search ecosystem.

### 1.3 Target Users
- **Primary**: B2B SaaS companies (10-500 employees)
- **Secondary**: E-commerce businesses
- **Tertiary**: Digital marketing agencies

### 1.4 Success Metrics
- Monthly Recurring Revenue (MRR) > $50,000 within 6 months
- Active Users: 100+ paying customers within 3 months
- User Retention: >90% monthly retention rate
- NPS Score: >50

## 2. Technical Architecture

### 2.1 System Architecture
```
┌─────────────────────────────────────────────┐
│         Frontend (React + TypeScript)       │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      API Gateway (Express.js + JWT)         │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         Backend Services (Node.js)          │
├─────────────────────────────────────────────┤
│  • Auth Service    • Scan Service           │
│  • Content Service • Tracking Service       │
│  • Report Service  • Notification Service   │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      Data Layer (MySQL + Redis)             │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│    External Services (AI APIs, Crawlers)    │
└─────────────────────────────────────────────┘
```

### 2.2 Tech Stack Requirements
```yaml
Frontend:
  framework: React 18+
  language: TypeScript
  ui_library: Ant Design Pro
  state_management: Redux Toolkit
  charts: Recharts
  build_tool: Vite
  styling: Tailwind CSS

Backend:
  runtime: Node.js 20 LTS
  framework: Express.js
  language: TypeScript
  orm: Sequelize / TypeORM / Prisma
  validation: Joi / Zod
  authentication: Passport.js + JWT
  queue: Bull (Redis-based)
  websocket: Socket.io
  file_upload: Multer
  email: Nodemailer
  scheduling: node-cron
  logging: Winston
  testing: Jest + Supertest

Database:
  primary: MySQL 8.0+
  cache: Redis 7+
  search: Elasticsearch (optional)
  
Infrastructure:
  containerization: Docker
  orchestration: Docker Compose / Kubernetes
  cloud: AWS / GCP / Azure
  monitoring: PM2 / New Relic
  ci_cd: GitHub Actions / GitLab CI
```

## 3. Database Design (MySQL)

### 3.1 Core Database Schema

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS geo_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE geo_platform;

-- Users table
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  company VARCHAR(255),
  role ENUM('admin', 'manager', 'user', 'viewer') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Organizations table (for multi-tenant support)
CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  plan ENUM('free', 'starter', 'professional', 'enterprise') DEFAULT 'free',
  credits INT DEFAULT 100,
  max_users INT DEFAULT 5,
  max_websites INT DEFAULT 3,
  settings JSON,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_plan (plan)
) ENGINE=InnoDB;

-- User-Organization relationship
CREATE TABLE user_organizations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_org (user_id, organization_id),
  INDEX idx_user (user_id),
  INDEX idx_org (organization_id)
) ENGINE=InnoDB;

-- Websites table
CREATE TABLE websites (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  url VARCHAR(500) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  settings JSON,
  robots_txt_status ENUM('allowed', 'blocked', 'partial', 'unknown') DEFAULT 'unknown',
  last_scan_at TIMESTAMP NULL,
  scan_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_url (organization_id, url),
  INDEX idx_org (organization_id),
  INDEX idx_domain (domain),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Scans table
CREATE TABLE scans (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  website_id CHAR(36) NOT NULL,
  scan_type ENUM('quick', 'standard', 'deep') DEFAULT 'standard',
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  progress INT DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  error_message TEXT,
  results JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  INDEX idx_website (website_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB;

-- Scan metrics table
CREATE TABLE scan_metrics (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  scan_id CHAR(36) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10, 2),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
  INDEX idx_scan (scan_id),
  INDEX idx_type (metric_type)
) ENGINE=InnoDB;

-- Content table
CREATE TABLE content (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  website_id CHAR(36) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  title VARCHAR(500),
  meta_description TEXT,
  content_type ENUM('page', 'post', 'product', 'faq') DEFAULT 'page',
  original_content LONGTEXT,
  optimized_content LONGTEXT,
  geo_score DECIMAL(5, 2),
  word_count INT,
  reading_time INT,
  has_schema BOOLEAN DEFAULT FALSE,
  schema_types JSON,
  last_updated DATE,
  optimization_status ENUM('pending', 'optimized', 'needs_update') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  INDEX idx_website (website_id),
  INDEX idx_score (geo_score),
  INDEX idx_status (optimization_status),
  FULLTEXT idx_content (title, meta_description)
) ENGINE=InnoDB;

-- Keywords table
CREATE TABLE keywords (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  search_volume INT,
  difficulty DECIMAL(5, 2),
  cpc DECIMAL(10, 2),
  intent ENUM('informational', 'commercial', 'transactional', 'navigational'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_keyword (organization_id, keyword),
  INDEX idx_org (organization_id),
  INDEX idx_keyword (keyword)
) ENGINE=InnoDB;

-- AI tracking results
CREATE TABLE ai_tracking_results (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  website_id CHAR(36) NOT NULL,
  keyword_id CHAR(36),
  platform ENUM('chatgpt', 'gemini', 'perplexity', 'claude') NOT NULL,
  query TEXT NOT NULL,
  is_mentioned BOOLEAN DEFAULT FALSE,
  is_cited BOOLEAN DEFAULT FALSE,
  citation_position INT,
  snippet TEXT,
  full_response LONGTEXT,
  competitor_mentions JSON,
  tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE SET NULL,
  INDEX idx_website (website_id),
  INDEX idx_keyword (keyword_id),
  INDEX idx_platform (platform),
  INDEX idx_tracked (tracked_at DESC)
) ENGINE=InnoDB;

-- Competitors table
CREATE TABLE competitors (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_analyzed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_competitor (organization_id, domain),
  INDEX idx_org (organization_id),
  INDEX idx_domain (domain)
) ENGINE=InnoDB;

-- Reports table
CREATE TABLE reports (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  report_type ENUM('weekly', 'monthly', 'custom') NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status ENUM('pending', 'generating', 'completed', 'failed') DEFAULT 'pending',
  file_path VARCHAR(500),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_org (organization_id),
  INDEX idx_type (report_type),
  INDEX idx_status (status),
  INDEX idx_date (date_from, date_to)
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB;

-- API keys table
CREATE TABLE api_keys (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_key (key_hash),
  INDEX idx_org (organization_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Audit logs table
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  organization_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id CHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_org (organization_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB;
```

### 3.2 Database Optimization Queries

```sql
-- Add partitioning for large tables (tracking results)
ALTER TABLE ai_tracking_results
PARTITION BY RANGE (YEAR(tracked_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- Create views for common queries
CREATE VIEW website_overview AS
SELECT 
  w.id,
  w.name,
  w.url,
  w.domain,
  o.name as organization_name,
  COUNT(DISTINCT c.id) as content_count,
  AVG(c.geo_score) as avg_geo_score,
  MAX(s.completed_at) as last_scan_date
FROM websites w
JOIN organizations o ON w.organization_id = o.id
LEFT JOIN content c ON w.id = c.website_id
LEFT JOIN scans s ON w.id = s.website_id AND s.status = 'completed'
GROUP BY w.id;

-- Create stored procedure for tracking metrics
DELIMITER //
CREATE PROCEDURE GetAIVisibilityMetrics(
  IN p_website_id CHAR(36),
  IN p_date_from DATE,
  IN p_date_to DATE
)
BEGIN
  SELECT 
    platform,
    COUNT(*) as total_queries,
    SUM(is_mentioned) as mentions,
    SUM(is_cited) as citations,
    AVG(citation_position) as avg_position,
    (SUM(is_mentioned) / COUNT(*)) * 100 as mention_rate,
    (SUM(is_cited) / COUNT(*)) * 100 as citation_rate
  FROM ai_tracking_results
  WHERE website_id = p_website_id
    AND DATE(tracked_at) BETWEEN p_date_from AND p_date_to
  GROUP BY platform;
END //
DELIMITER ;
```

## 4. Backend API Implementation (Node.js)

### 4.1 Project Structure

```
geo-platform-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── constants.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── website.controller.ts
│   │   ├── scan.controller.ts
│   │   ├── content.controller.ts
│   │   ├── tracking.controller.ts
│   │   └── report.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── organization.model.ts
│   │   ├── website.model.ts
│   │   ├── scan.model.ts
│   │   └── content.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── website.routes.ts
│   │   ├── scan.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── crawler.service.ts
│   │   ├── ai.service.ts
│   │   ├── optimization.service.ts
│   │   └── email.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── workers/
│   │   ├── scan.worker.ts
│   │   ├── tracking.worker.ts
│   │   └── report.worker.ts
│   ├── types/
│   │   └── index.d.ts
│   └── app.ts
├── tests/
├── .env.example
├── package.json
├── tsconfig.json
└── server.ts
```

### 4.2 Core Implementation Files

#### 4.2.1 Database Configuration (src/config/database.ts)

```typescript
import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: mysql2,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'geo_platform',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  timezone: '+00:00'
});

export default sequelize;
```

#### 4.2.2 User Model (src/models/user.model.ts)

```typescript
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  fullName?: string;
  company?: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'isActive' | 'emailVerified'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public fullName?: string;
  public company?: string;
  public role!: 'admin' | 'manager' | 'user' | 'viewer';
  public isActive!: boolean;
  public emailVerified!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    fullName: {
      type: DataTypes.STRING(255),
      field: 'full_name'
    },
    company: {
      type: DataTypes.STRING(255)
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'user', 'viewer'),
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      }
    }
  }
);

export default User;
```

#### 4.2.3 Express App Setup (src/app.ts)

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error.middleware';
import routes from './routes';
import sequelize from './config/database';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression and logging
    this.app.use(compression());
    this.app.use(morgan('combined'));
  }

  private initializeRoutes(): void {
    this.app.use('/api/v1', routes);
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
      }
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      process.exit(1);
    }
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}

export default App;
```

#### 4.2.4 Authentication Controller (src/controllers/auth.controller.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, fullName, company } = req.body;
      
      const user = await this.authService.register({
        email,
        password,
        fullName,
        company
      });

      const token = this.generateToken(user.id);
      
      res.status(201).json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const { user, token } = await this.authService.login(email, password);
      
      res.json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      const { user, token } = await this.authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  };

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
  }
}
```

#### 4.2.5 Scan Service with Queue (src/services/scan.service.ts)

```typescript
import Bull from 'bull';
import { Website, Scan } from '../models';
import { CrawlerService } from './crawler.service';
import { AIAnalysisService } from './ai.service';
import { logger } from '../utils/logger';

export class ScanService {
  private scanQueue: Bull.Queue;
  private crawlerService: CrawlerService;
  private aiService: AIAnalysisService;

  constructor() {
    this.scanQueue = new Bull('scan-queue', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    
    this.crawlerService = new CrawlerService();
    this.aiService = new AIAnalysisService();
    
    this.setupQueueProcessors();
  }

  private setupQueueProcessors(): void {
    this.scanQueue.process('website-scan', async (job) => {
      const { scanId, websiteId, scanType } = job.data;
      
      try {
        // Update scan status
        await Scan.update(
          { status: 'running', startedAt: new Date() },
          { where: { id: scanId } }
        );

        // Step 1: Crawl website
        const crawlData = await this.crawlerService.crawlWebsite(websiteId);
        await job.progress(30);

        // Step 2: Analyze content
        const contentAnalysis = await this.aiService.analyzeContent(crawlData);
        await job.progress(60);

        // Step 3: Check AI visibility
        const visibilityData = await this.aiService.checkVisibility(websiteId);
        await job.progress(90);

        // Step 4: Generate recommendations
        const recommendations = await this.generateRecommendations(
          crawlData,
          contentAnalysis,
          visibilityData
        );

        // Save results
        const results = {
          crawlData,
          contentAnalysis,
          visibilityData,
          recommendations,
          score: this.calculateGEOScore(contentAnalysis)
        };

        await Scan.update(
          {
            status: 'completed',
            completedAt: new Date(),
            results: JSON.stringify(results)
          },
          { where: { id: scanId } }
        );

        return results;
      } catch (error) {
        logger.error('Scan failed:', error);
        
        await Scan.update(
          {
            status: 'failed',
            errorMessage: error.message
          },
          { where: { id: scanId } }
        );
        
        throw error;
      }
    });
  }

  public async initiateScan(websiteId: string, scanType: string = 'standard'): Promise<string> {
    // Create scan record
    const scan = await Scan.create({
      websiteId,
      scanType,
      status: 'pending'
    });

    // Add to queue
    await this.scanQueue.add('website-scan', {
      scanId: scan.id,
      websiteId,
      scanType
    });

    return scan.id;
  }

  private calculateGEOScore(analysis: any): number {
    // Implement GEO scoring algorithm
    let score = 0;
    
    // Content factors (40%)
    score += analysis.contentDepth * 0.1;
    score += analysis.structureQuality * 0.1;
    score += analysis.schemaCompleteness * 0.1;
    score += analysis.freshness * 0.1;
    
    // Technical factors (30%)
    score += analysis.crawlability * 0.15;
    score += analysis.siteSpeed * 0.15;
    
    // Authority factors (30%)
    score += analysis.citations * 0.15;
    score += analysis.expertise * 0.15;
    
    return Math.min(100, Math.round(score));
  }

  private async generateRecommendations(
    crawlData: any,
    contentAnalysis: any,
    visibilityData: any
  ): Promise<any[]> {
    const recommendations = [];

    // Technical recommendations
    if (!crawlData.robotsTxt.allowsAIBots) {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        issue: 'AI bots blocked in robots.txt',
        solution: 'Add User-agent entries for GPTBot, ChatGPT-User, and PerplexityBot'
      });
    }

    // Content recommendations
    if (contentAnalysis.avgContentLength < 1500) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        issue: 'Content depth insufficient',
        solution: 'Increase content length to 1500+ words for better AI comprehension'
      });
    }

    // Schema recommendations
    if (contentAnalysis.schemaCompleteness < 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'schema',
        issue: 'Missing structured data',
        solution: 'Implement FAQ, Article, and Organization schema markup'
      });
    }

    return recommendations;
  }
}
```

## 5. API Endpoints Specification

### 5.1 Authentication Endpoints

```yaml
# Authentication
POST   /api/v1/auth/register
  body:
    email: string
    password: string
    fullName: string
    company: string
  response:
    user: User
    token: string

POST   /api/v1/auth/login
  body:
    email: string
    password: string
  response:
    user: User
    token: string

POST   /api/v1/auth/refresh
  body:
    refreshToken: string
  response:
    token: string

POST   /api/v1/auth/logout
  headers:
    Authorization: Bearer <token>
  response:
    message: string

POST   /api/v1/auth/forgot-password
  body:
    email: string
  response:
    message: string

POST   /api/v1/auth/reset-password
  body:
    token: string
    password: string
  response:
    message: string
```

### 5.2 Core API Endpoints

```yaml
# Websites
GET    /api/v1/websites
  query:
    page: number
    limit: number
    search: string
  response:
    websites: Website[]
    pagination: Pagination

POST   /api/v1/websites
  body:
    url: string
    name: string
    scanFrequency: string
  response:
    website: Website

GET    /api/v1/websites/:id
  response:
    website: Website
    metrics: Metrics

PUT    /api/v1/websites/:id
  body:
    name: string
    settings: object
  response:
    website: Website

DELETE /api/v1/websites/:id
  response:
    message: string

# Scanning
POST   /api/v1/scan
  body:
    websiteId: string
    scanType: 'quick' | 'standard' | 'deep'
  response:
    scanId: string
    estimatedTime: number

GET    /api/v1/scan/:id
  response:
    scan: Scan
    progress: number

GET    /api/v1/scan/:id/results
  response:
    results: ScanResults

# Content Optimization
POST   /api/v1/content/analyze
  body:
    content: string
    targetKeywords: string[]
  response:
    score: number
    suggestions: Suggestion[]

POST   /api/v1/content/optimize
  body:
    contentId: string
    applyOptimizations: string[]
  response:
    optimizedContent: string
    improvements: Improvement[]

# AI Tracking
GET    /api/v1/tracking/mentions
  query:
    websiteId: string
    platform: string
    dateFrom: string
    dateTo: string
  response:
    mentions: Mention[]
    summary: Summary

POST   /api/v1/tracking/keywords
  body:
    keywords: string[]
  response:
    message: string

# Reports
GET    /api/v1/reports
  query:
    type: string
    dateFrom: string
    dateTo: string
  response:
    reports: Report[]

POST   /api/v1/reports/generate
  body:
    type: 'weekly' | 'monthly' | 'custom'
    websiteIds: string[]
    dateRange: DateRange
  response:
    reportId: string
    status: string

GET    /api/v1/reports/:id/download
  response:
    file: Buffer
```

## 6. Environment Configuration

### 6.1 Environment Variables (.env)

```bash
# Application
NODE_ENV=production
PORT=8000
API_VERSION=v1
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=geo_platform
DB_USER=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=10

# External APIs
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
GOOGLE_API_KEY=AIza...

# Crawler Settings
CRAWLER_USER_AGENT=GEO-Platform-Bot/1.0
CRAWLER_RATE_LIMIT=10
CRAWLER_TIMEOUT=30000

# Email (SendGrid)
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@geoplatform.com
EMAIL_FROM_NAME=GEO Platform

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=geo-platform-assets

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
NEW_RELIC_LICENSE_KEY=...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 7. Testing Strategy

### 7.1 Unit Test Example (tests/services/scan.service.test.ts)

```typescript
import { ScanService } from '../../src/services/scan.service';
import { Website, Scan } from '../../src/models';

jest.mock('../../src/models');

describe('ScanService', () => {
  let scanService: ScanService;

  beforeEach(() => {
    scanService = new ScanService();
    jest.clearAllMocks();
  });

  describe('initiateScan', () => {
    it('should create a scan and return scanId', async () => {
      const mockScan = {
        id: 'scan-123',
        websiteId: 'website-123',
        scanType: 'standard',
        status: 'pending'
      };

      (Scan.create as jest.Mock).mockResolvedValue(mockScan);

      const scanId = await scanService.initiateScan('website-123', 'standard');

      expect(scanId).toBe('scan-123');
      expect(Scan.create).toHaveBeenCalledWith({
        websiteId: 'website-123',
        scanType: 'standard',
        status: 'pending'
      });
    });
  });

  describe('calculateGEOScore', () => {
    it('should calculate score based on analysis factors', () => {
      const analysis = {
        contentDepth: 80,
        structureQuality: 70,
        schemaCompleteness: 90,
        freshness: 85,
        crawlability: 95,
        siteSpeed: 88,
        citations: 75,
        expertise: 82
      };

      const score = scanService['calculateGEOScore'](analysis);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
```

### 7.2 Integration Test Example

```typescript
import request from 'supertest';
import app from '../../src/app';
import sequelize from '../../src/config/database';

describe('Website API Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create test user and get token
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        fullName: 'Test User'
      });
    
    authToken = response.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/websites', () => {
    it('should create a new website', async () => {
      const response = await request(app)
        .post('/api/v1/websites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com',
          name: 'Example Website'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.website).toHaveProperty('id');
      expect(response.body.data.website.url).toBe('https://example.com');
    });
  });
});
```

## 8. Deployment Configuration

### 8.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 8000

CMD ["node", "dist/server.js"]
```

### 8.2 Docker Compose

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: geo_platform
      MYSQL_USER: geouser
      MYSQL_PASSWORD: geopassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    restart: always
    ports:
      - "8000:8000"
    depends_on:
      - mysql
      - redis
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: geo_platform
      DB_USER: geouser
      DB_PASSWORD: geopassword
      REDIS_HOST: redis
      REDIS_PORT: 6379
    volumes:
      - ./uploads:/app/uploads

volumes:
  mysql_data:
  redis_data:
```

## 9. Package.json Configuration

```json
{
  "name": "geo-platform-backend",
  "version": "1.0.0",
  "description": "GEO Platform - AI Search Engine Optimization SaaS",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo",
    "seed": "sequelize-cli db:seed:all"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "mysql2": "^3.6.5",
    "sequelize": "^6.35.2",
    "sequelize-typescript": "^2.1.6",
    "redis": "^4.6.11",
    "bull": "^4.11.5",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "joi": "^17.11.0",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2",
    "cheerio": "^1.0.0-rc.12",
    "puppeteer": "^21.6.1",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.7",
    "@sendgrid/mail": "^8.1.0",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.6.0",
    "winston": "^3.11.0",
    "stripe": "^14.10.0",
    "openai": "^4.24.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/morgan": "^1.9.9",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/passport": "^1.0.16",
    "@types/passport-jwt": "^4.0.0",
    "@types/multer": "^1.4.11",
    "@types/node-cron": "^3.0.11",
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## 10. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Node.js project with TypeScript
- [ ] Configure MySQL database and create schema
- [ ] Implement user authentication system
- [ ] Set up Redis for caching and queues
- [ ] Create basic CRUD operations for websites

### Phase 2: Core Features (Week 3-4)
- [ ] Implement website crawler service
- [ ] Build content analysis engine
- [ ] Create GEO scoring algorithm
- [ ] Develop scan queue system with Bull
- [ ] Implement real-time progress tracking

### Phase 3: AI Integration (Week 5-6)
- [ ] Integrate ChatGPT API
- [ ] Integrate Perplexity API
- [ ] Integrate Google Gemini API
- [ ] Build AI visibility tracker
- [ ] Create recommendation engine

### Phase 4: Optimization Tools (Week 7-8)
- [ ] Build content optimizer
- [ ] Implement schema generator
- [ ] Create FAQ builder
- [ ] Develop competitor analysis
- [ ] Build report generation system

### Phase 5: Polish & Deploy (Week 9-10)
- [ ] Add comprehensive error handling
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Write API documentation
- [ ] Deploy to production

## 11. Monitoring & Maintenance

### 11.1 Health Checks

```typescript
// src/utils/healthcheck.ts
export const healthCheck = {
  database: async () => {
    try {
      await sequelize.authenticate();
      return { status: 'healthy', message: 'Database connected' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  },
  
  redis: async () => {
    try {
      await redisClient.ping();
      return { status: 'healthy', message: 'Redis connected' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  },
  
  queue: async () => {
    const queueHealth = await scanQueue.getJobCounts();
    return {
      status: 'healthy',
      jobs: queueHealth
    };
  }
};
```

### 11.2 Performance Monitoring

```typescript
// PM2 ecosystem config
module.exports = {
  apps: [{
    name: 'geo-platform',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

This PRD provides a complete specification for building the GEO Platform using Node.js and MySQL. It includes all necessary components for Claude Code to implement the system effectively.
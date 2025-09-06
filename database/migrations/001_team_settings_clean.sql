-- Team Management & Settings Tables Migration (Clean Version)
-- This migration adds tables needed for team management, invitations, activity logs, and settings

-- Drop tables if they exist to start fresh (be careful in production!)
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS organization_settings;
DROP TABLE IF EXISTS integrations;

-- Table for managing team invitations
CREATE TABLE invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organizationId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('owner','admin','editor','viewer') DEFAULT 'viewer',
  token VARCHAR(255) UNIQUE NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  invitedBy CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','expired','cancelled') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_organization (organizationId),
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_status (status),
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invitedBy) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table for activity and audit logs
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  organizationId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (userId),
  INDEX idx_organization (organizationId),
  INDEX idx_action (action),
  INDEX idx_created (createdAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table for user-specific settings and preferences
CREATE TABLE user_settings (
  userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PRIMARY KEY,
  notificationPreferences JSON,
  uiPreferences JSON,
  securitySettings JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table for organization-wide settings
CREATE TABLE organization_settings (
  organizationId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PRIMARY KEY,
  companyInfo JSON,
  preferences JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table for third-party integrations (for future use)
CREATE TABLE integrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organizationId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  type VARCHAR(50) NOT NULL,
  status ENUM('connected','disconnected','error') DEFAULT 'disconnected',
  credentials JSON,
  settings JSON,
  connectedAt TIMESTAMP NULL,
  lastSyncAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_organization (organizationId),
  INDEX idx_type (type),
  INDEX idx_status (status),
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add columns to users table if they don't exist
-- Note: password_hash and last_login_at already exist
ALTER TABLE users ADD COLUMN twoFactorSecret VARCHAR(255) AFTER password_hash;
ALTER TABLE users ADD COLUMN twoFactorEnabled BOOLEAN DEFAULT FALSE AFTER twoFactorSecret;
ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) AFTER password_hash;

-- Copy existing password_hash to passwordHash
UPDATE users SET passwordHash = password_hash WHERE passwordHash IS NULL OR passwordHash = '';

-- Check if status column exists in user_organizations, if not add it
ALTER TABLE user_organizations ADD COLUMN status ENUM('active','inactive','suspended') DEFAULT 'active' AFTER role;

-- Insert default organization settings for existing organizations
INSERT IGNORE INTO organization_settings (organizationId, companyInfo, preferences)
SELECT 
  id,
  JSON_OBJECT(
    'name', name,
    'timezone', 'Asia/Taipei',
    'language', 'zh-TW',
    'currency', 'TWD'
  ),
  JSON_OBJECT(
    'autoDataSync', true,
    'dataRetentionMonths', 12,
    'defaultReportFormat', 'pdf'
  )
FROM organizations;

-- Insert default user settings for existing users
INSERT IGNORE INTO user_settings (userId, notificationPreferences, uiPreferences, securitySettings)
SELECT 
  id,
  JSON_OBJECT(
    'email', JSON_OBJECT(
      'seoAlerts', true,
      'rankingChanges', true,
      'weeklyReports', false,
      'monthlyReports', true
    ),
    'push', JSON_OBJECT(
      'realTimeAlerts', false,
      'taskReminders', true
    )
  ),
  JSON_OBJECT(
    'appearance', JSON_OBJECT(
      'theme', 'dark',
      'compactMode', false,
      'animations', true,
      'language', 'zh-TW'
    ),
    'dashboard', JSON_OBJECT(
      'defaultView', 'overview',
      'itemsPerPage', 10
    )
  ),
  JSON_OBJECT(
    'twoFactorEnabled', false,
    'sessionTimeout', 86400
  )
FROM users;
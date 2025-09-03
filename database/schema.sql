-- GEO Platform Database Schema
-- Database: exchange_geo

CREATE DATABASE IF NOT EXISTS exchange_geo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE exchange_geo;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)   ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 DEFAULT CHARSET=utf8mb4;

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
)   ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE ai_tracking_results_archive (
  id CHAR(36) NOT NULL,
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
  tracked_at DATETIME NOT NULL,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, tracked_at),  -- 複合主鍵包含分區鍵
  INDEX idx_id (id),  -- 單獨的 id 索引保持查詢效能
  INDEX idx_website (website_id),
  INDEX idx_keyword (keyword_id),
  INDEX idx_platform (platform),
  INDEX idx_tracked (tracked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
PARTITION BY RANGE COLUMNS(tracked_at) (
  PARTITION p2024_q1 VALUES LESS THAN ('2024-04-01'),
  PARTITION p2024_q2 VALUES LESS THAN ('2024-07-01'),
  PARTITION p2024_q3 VALUES LESS THAN ('2024-10-01'),
  PARTITION p2024_q4 VALUES LESS THAN ('2025-01-01'),
  PARTITION p2025_q1 VALUES LESS THAN ('2025-04-01'),
  PARTITION p2025_q2 VALUES LESS THAN ('2025-07-01'),
  PARTITION p2025_q3 VALUES LESS THAN ('2025-10-01'),
  PARTITION p2025_q4 VALUES LESS THAN ('2026-01-01'),
  PARTITION p2026 VALUES LESS THAN ('2027-01-01'),
  PARTITION pmax VALUES LESS THAN (MAXVALUE)
);

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optimization tasks table (for tracking one-click optimization jobs)
CREATE TABLE optimization_tasks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  website_id CHAR(36) NOT NULL,
  task_type ENUM('schema_injection', 'content_optimization', 'meta_update', 'faq_generation') NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  priority INT DEFAULT 5,
  input_data JSON,
  result_data JSON,
  error_message TEXT,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  INDEX idx_website (website_id),
  INDEX idx_status (status),
  INDEX idx_type (task_type),
  INDEX idx_priority (priority)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Integration settings table (for CMS/plugin integrations)
CREATE TABLE integration_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  website_id CHAR(36),
  integration_type ENUM('wordpress', 'shopify', 'wix', 'api', 'javascript') NOT NULL,
  integration_level ENUM('no_integration', 'javascript', 'plugin', 'api', 'full_integration') DEFAULT 'no_integration',
  credentials JSON,
  settings JSON,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  INDEX idx_org (organization_id),
  INDEX idx_website (website_id),
  INDEX idx_type (integration_type)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


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
GROUP BY w.id, w.name, w.url, w.domain, o.name;

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

-- Insert initial data
INSERT INTO organizations (id, name, slug, plan) VALUES 
(UUID(), 'Default Organization', 'default', 'free');

-- Create indexes for better performance
CREATE INDEX idx_content_optimization ON content(optimization_status, geo_score);
CREATE INDEX idx_scan_website_status ON scans(website_id, status, created_at);
CREATE INDEX idx_ai_tracking_composite ON ai_tracking_results(website_id, platform, tracked_at);
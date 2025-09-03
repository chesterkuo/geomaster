

CREATE DATABASE IF NOT EXISTS exchange_geo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE exchange_geo;


CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE user_organizations (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_org (user_id, organization_id),
  INDEX idx_user (user_id),
  INDEX idx_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE websites (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE keywords (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE scans (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE content (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE competitors (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scan_metrics (
  id CHAR(36) PRIMARY KEY,
  scan_id CHAR(36) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10, 2),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
  INDEX idx_scan (scan_id),
  INDEX idx_type (metric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reports (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE api_keys (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


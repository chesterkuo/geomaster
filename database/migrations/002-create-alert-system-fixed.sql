-- Phase 2.1 - Real-time AI Mention Alerts and Notifications
-- Database Migration: Create Alert System Tables (Fixed for MySQL 8.0)

-- Alert configurations table - stores user-defined alert rules
CREATE TABLE alert_configurations (
  id CHAR(36) NOT NULL DEFAULT (uuid()) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  website_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  alert_type ENUM('mention_spike', 'visibility_drop', 'competitor_outrank', 'score_change', 'new_mention', 'sentiment_change') NOT NULL,
  conditions JSON NOT NULL,
  notification_channels JSON,
  is_active BOOLEAN DEFAULT TRUE,
  cooldown_minutes INT DEFAULT 60,
  last_triggered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_organization (organization_id),
  INDEX idx_website (website_id),
  INDEX idx_type_active (alert_type, is_active),
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Alert history table - logs triggered alerts
CREATE TABLE alert_history (
  id CHAR(36) NOT NULL DEFAULT (uuid()) PRIMARY KEY,
  alert_config_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  website_id CHAR(36),
  alert_type ENUM('mention_spike', 'visibility_drop', 'competitor_outrank', 'score_change', 'new_mention', 'sentiment_change') NOT NULL,
  trigger_data JSON NOT NULL,
  notification_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  notification_channels JSON,
  error_message TEXT,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified_at TIMESTAMP NULL,
  
  INDEX idx_alert_config (alert_config_id),
  INDEX idx_organization (organization_id),
  INDEX idx_website (website_id),
  INDEX idx_triggered_at (triggered_at DESC),
  INDEX idx_type_status (alert_type, notification_status),
  
  FOREIGN KEY (alert_config_id) REFERENCES alert_configurations(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Notification templates table - customizable notification templates
CREATE TABLE notification_templates (
  id CHAR(36) NOT NULL DEFAULT (uuid()) PRIMARY KEY,
  organization_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  alert_type ENUM('mention_spike', 'visibility_drop', 'competitor_outrank', 'score_change', 'new_mention', 'sentiment_change') NOT NULL,
  template_type ENUM('email', 'slack', 'webhook', 'in_app') NOT NULL,
  template_content JSON NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_organization (organization_id),
  INDEX idx_type (alert_type, template_type),
  INDEX idx_default (is_default),
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Webhook endpoints table - external webhook configurations
CREATE TABLE webhook_endpoints (
  id CHAR(36) NOT NULL DEFAULT (uuid()) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret_key VARCHAR(255),
  headers JSON,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_organization (organization_id),
  INDEX idx_active (is_active),
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Real-time metrics tracking - for threshold detection
CREATE TABLE metrics_snapshots (
  id CHAR(36) NOT NULL DEFAULT (uuid()) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  website_id CHAR(36) NOT NULL,
  metric_type ENUM('mention_count', 'sentiment_score', 'visibility_percentage', 'geo_score', 'competitor_rank') NOT NULL,
  platform ENUM('chatgpt', 'gemini', 'perplexity', 'claude', 'all') DEFAULT 'all',
  time_window ENUM('1h', '1d', '7d', '30d') NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  previous_value DECIMAL(10,4),
  change_percentage DECIMAL(6,2),
  snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_organization (organization_id),
  INDEX idx_website_metric (website_id, metric_type, platform),
  INDEX idx_snapshot_time (snapshot_at DESC),
  INDEX idx_metric_lookup (organization_id, website_id, metric_type, time_window),
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add indexes for performance optimization
CREATE INDEX idx_ai_tracking_alert_lookup ON ai_tracking_results (website_id, platform, tracked_at DESC, is_mentioned);
CREATE INDEX idx_website_last_scan ON websites (organization_id, last_scan_at DESC);
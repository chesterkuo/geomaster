-- Phase 2.1 - Real-time AI Mention Alerts and Notifications
-- Database Migration: Create Alert System Tables

-- Alert configurations table - stores user-defined alert rules
CREATE TABLE alert_configurations (
  id CHAR(36) NOT NULL DEFAULT (uuid()) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  website_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  alert_type ENUM('mention_spike', 'visibility_drop', 'competitor_outrank', 'score_change', 'new_mention', 'sentiment_change') NOT NULL,
  conditions JSON NOT NULL,
  notification_channels JSON DEFAULT '["email"]',
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
  notification_channels JSON DEFAULT '[]',
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
  headers JSON DEFAULT '{}',
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

-- Default notification templates - insert predefined templates
INSERT INTO notification_templates (id, name, alert_type, template_type, template_content, is_default) VALUES
-- Email templates
(uuid(), 'Default Mention Spike Email', 'mention_spike', 'email', 
 '{"subject": "🚀 AI Mention Spike Alert - {{website_name}}", "body": "Your website {{website_name}} has experienced a significant spike in AI mentions!\n\nCurrent mentions: {{current_value}}\nPrevious period: {{previous_value}}\nIncrease: {{change_percentage}}%\n\nPlatforms affected: {{affected_platforms}}\n\nView details: {{dashboard_url}}"}', 
 TRUE),

(uuid(), 'Default Visibility Drop Email', 'visibility_drop', 'email',
 '{"subject": "⚠️ AI Visibility Drop Alert - {{website_name}}", "body": "Your website {{website_name}} visibility has dropped significantly.\n\nCurrent visibility: {{current_value}}%\nPrevious period: {{previous_value}}%\nDecrease: {{change_percentage}}%\n\nRecommendations:\n- Review recent content changes\n- Check for technical issues\n- Analyze competitor activity\n\nView details: {{dashboard_url}}"}',
 TRUE),

(uuid(), 'Default New Mention Email', 'new_mention', 'email',
 '{"subject": "💬 New AI Mention - {{website_name}}", "body": "Your website {{website_name}} was mentioned in a new AI response!\n\nPlatform: {{platform}}\nQuery: {{query}}\nContext: {{mention_context}}\nSentiment: {{sentiment}}\n\nView full details: {{dashboard_url}}"}',
 TRUE),

-- Slack templates
(uuid(), 'Default Mention Spike Slack', 'mention_spike', 'slack',
 '{"text": "🚀 Mention spike detected for {{website_name}}: {{current_value}} mentions ({{change_percentage}}% increase)", "blocks": [{"type": "section", "text": {"type": "mrkdwn", "text": "*AI Mention Spike Alert*\n*Website:* {{website_name}}\n*Current mentions:* {{current_value}}\n*Increase:* {{change_percentage}}%\n*Platforms:* {{affected_platforms}}"}}]}',
 TRUE);

-- Add indexes for performance optimization
CREATE INDEX idx_ai_tracking_alert_lookup ON ai_tracking_results (website_id, platform, tracked_at DESC, is_mentioned);
CREATE INDEX idx_website_last_scan ON websites (organization_id, last_scan_at DESC);
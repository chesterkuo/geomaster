-- AI Search Extension - Add missing tables for enhanced API support
-- Run this migration to add tracking settings and platform settings tables

USE exchange_geo;

-- Add tracking_settings table for managing tracking configuration
CREATE TABLE IF NOT EXISTS tracking_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tracking_frequency ENUM('hourly', 'daily', 'weekly') NOT NULL DEFAULT 'daily',
  platforms JSON NOT NULL DEFAULT ('["chatgpt", "gemini", "perplexity", "claude"]'),
  alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  alert_threshold INT NOT NULL DEFAULT 5,
  alert_emails JSON NOT NULL DEFAULT ('[]'),
  settings JSON NOT NULL DEFAULT ('{}'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_tracking_settings (organization_id),
  INDEX idx_org_tracking (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add platform_settings table for individual platform configurations
CREATE TABLE IF NOT EXISTS platform_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NOT NULL,
  platform ENUM('chatgpt', 'gemini', 'perplexity', 'claude') NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  settings JSON NOT NULL DEFAULT ('{}'),
  api_key VARCHAR(500),
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_platform (organization_id, platform),
  INDEX idx_org_platform (organization_id),
  INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Check if keywords table needs to be updated (it should already exist from schema.sql)
-- Add any missing indexes for keywords table
CREATE INDEX IF NOT EXISTS idx_keyword_intent ON keywords(intent);
CREATE INDEX IF NOT EXISTS idx_keyword_search_volume ON keywords(search_volume);

-- Check if competitors table needs to be updated (it should already exist from schema.sql)  
-- Add any missing indexes for competitors table
CREATE INDEX IF NOT EXISTS idx_competitor_active ON competitors(is_active);
CREATE INDEX IF NOT EXISTS idx_competitor_analyzed ON competitors(last_analyzed_at);

-- Add new indexes for better performance on AI tracking
CREATE INDEX IF NOT EXISTS idx_ai_tracking_platform_mentioned ON ai_tracking_results(platform, is_mentioned, tracked_at);
CREATE INDEX IF NOT EXISTS idx_ai_tracking_platform_cited ON ai_tracking_results(platform, is_cited, tracked_at);

-- Add sample tracking settings for existing organizations
INSERT IGNORE INTO tracking_settings (id, organization_id, tracking_enabled, tracking_frequency, platforms, alerts_enabled, alert_threshold, alert_emails, settings)
SELECT 
  UUID() as id,
  id as organization_id,
  TRUE as tracking_enabled,
  'daily' as tracking_frequency,
  '["chatgpt", "gemini", "perplexity", "claude"]' as platforms,
  FALSE as alerts_enabled,
  5 as alert_threshold,
  '[]' as alert_emails,
  '{}' as settings
FROM organizations;

-- Add default platform settings for existing organizations
INSERT IGNORE INTO platform_settings (id, organization_id, platform, enabled, settings)
SELECT 
  UUID() as id,
  org.id as organization_id,
  platform_list.platform,
  TRUE as enabled,
  '{}' as settings
FROM organizations org
CROSS JOIN (
  SELECT 'chatgpt' as platform
  UNION SELECT 'gemini'
  UNION SELECT 'perplexity'
  UNION SELECT 'claude'
) as platform_list;

-- Add procedures for better tracking analytics
DELIMITER //

-- Enhanced procedure for AI visibility metrics with competitor data
DROP PROCEDURE IF EXISTS GetEnhancedAIVisibilityMetrics //
CREATE PROCEDURE GetEnhancedAIVisibilityMetrics(
  IN p_website_id CHAR(36),
  IN p_date_from DATE,
  IN p_date_to DATE
)
BEGIN
  -- Main visibility metrics
  SELECT 
    platform,
    COUNT(*) as total_queries,
    SUM(is_mentioned) as mentions,
    SUM(is_cited) as citations,
    AVG(citation_position) as avg_position,
    (SUM(is_mentioned) / COUNT(*)) * 100 as mention_rate,
    (SUM(is_cited) / COUNT(*)) * 100 as citation_rate,
    COUNT(DISTINCT DATE(tracked_at)) as tracking_days
  FROM ai_tracking_results
  WHERE website_id = p_website_id
    AND DATE(tracked_at) BETWEEN p_date_from AND p_date_to
  GROUP BY platform
  ORDER BY mention_rate DESC;
  
  -- Competitor mentions analysis
  SELECT 
    platform,
    JSON_EXTRACT(competitor_mentions, '$[*].domain') as competitor_domains,
    COUNT(*) as queries_with_competitors,
    AVG(JSON_LENGTH(competitor_mentions)) as avg_competitors_per_query
  FROM ai_tracking_results
  WHERE website_id = p_website_id
    AND DATE(tracked_at) BETWEEN p_date_from AND p_date_to
    AND competitor_mentions IS NOT NULL
    AND JSON_LENGTH(competitor_mentions) > 0
  GROUP BY platform;
END //

DELIMITER ;

-- Create view for keyword performance tracking
CREATE OR REPLACE VIEW keyword_performance AS
SELECT 
  k.id as keyword_id,
  k.keyword,
  k.intent,
  k.search_volume,
  k.difficulty,
  k.organization_id,
  COUNT(atr.id) as total_tracking_queries,
  SUM(atr.is_mentioned) as total_mentions,
  SUM(atr.is_cited) as total_citations,
  (SUM(atr.is_mentioned) / NULLIF(COUNT(atr.id), 0)) * 100 as mention_rate,
  (SUM(atr.is_cited) / NULLIF(COUNT(atr.id), 0)) * 100 as citation_rate,
  AVG(atr.citation_position) as avg_citation_position,
  MAX(atr.tracked_at) as last_tracked
FROM keywords k
LEFT JOIN ai_tracking_results atr ON k.id = atr.keyword_id
GROUP BY k.id, k.keyword, k.intent, k.search_volume, k.difficulty, k.organization_id;

-- Create view for competitor analysis dashboard
CREATE OR REPLACE VIEW competitor_dashboard AS
SELECT 
  c.id as competitor_id,
  c.name,
  c.domain,
  c.organization_id,
  c.is_active,
  c.last_analyzed_at,
  -- Count mentions in competitor_mentions JSON field
  COALESCE(mention_stats.total_mentions, 0) as total_mentions,
  COALESCE(mention_stats.platforms_mentioned, 0) as platforms_mentioned,
  COALESCE(mention_stats.last_mention_date, NULL) as last_mention_date
FROM competitors c
LEFT JOIN (
  SELECT 
    JSON_UNQUOTE(JSON_EXTRACT(competitor_mentions, '$[*].domain')) as domain,
    COUNT(*) as total_mentions,
    COUNT(DISTINCT platform) as platforms_mentioned,
    MAX(tracked_at) as last_mention_date
  FROM ai_tracking_results 
  WHERE competitor_mentions IS NOT NULL 
    AND JSON_LENGTH(competitor_mentions) > 0
  GROUP BY JSON_UNQUOTE(JSON_EXTRACT(competitor_mentions, '$[*].domain'))
) mention_stats ON c.domain = mention_stats.domain;

-- Success message
SELECT 'AI Search extension tables and procedures created successfully' as status;
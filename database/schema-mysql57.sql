-- ============================================================================
-- GEO Platform Database Schema - MySQL 5.7 Compatible Version
-- ============================================================================
-- Generated: 2025-09-06
-- MySQL Version: 5.7+
-- Charset: utf8mb4 with utf8mb4_unicode_ci collation
-- Features: JSON support, optimized indexes, proper constraints
-- ============================================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, AUTOCOMMIT=0;

-- ============================================================================
-- Core User and Organization Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS `organizations` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `plan` enum('free','starter','professional','enterprise') DEFAULT 'free',
  `credits` int DEFAULT '1000',
  `max_users` int DEFAULT '3',
  `max_websites` int DEFAULT '1',
  `settings` text DEFAULT NULL COMMENT 'JSON formatted settings',
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `subscription_status` enum('active','cancelled','past_due','unpaid') DEFAULT NULL,
  `subscription_current_period_start` timestamp NULL DEFAULT NULL,
  `subscription_current_period_end` timestamp NULL DEFAULT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_plan` (`plan`),
  KEY `idx_active` (`is_active`),
  KEY `idx_stripe_customer` (`stripe_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multi-tenant organizations';

CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `passwordHash` varchar(255) DEFAULT NULL,
  `twoFactorSecret` varchar(255) DEFAULT NULL,
  `isTwoFactorEnabled` tinyint(1) DEFAULT '0',
  `full_name` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `role` enum('admin','user','viewer') DEFAULT 'user',
  `avatar_url` varchar(500) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `refresh_token_version` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_active` (`is_active`),
  KEY `idx_last_login` (`last_login_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts';

CREATE TABLE IF NOT EXISTS `user_organizations` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `role` enum('owner','admin','member') DEFAULT 'member',
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `permissions` text DEFAULT NULL COMMENT 'JSON formatted permissions',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_org` (`user_id`,`organization_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_role_status` (`role`,`status`),
  CONSTRAINT `user_organizations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_organizations_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User-organization relationships';

-- ============================================================================
-- Website and Content Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS `websites` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `url` varchar(500) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `industry` varchar(100) DEFAULT NULL,
  `country` varchar(2) DEFAULT NULL,
  `language` varchar(10) DEFAULT 'en',
  `timezone` varchar(50) DEFAULT 'UTC',
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_method` enum('file','meta','dns') DEFAULT NULL,
  `verification_token` varchar(100) DEFAULT NULL,
  `last_scan_at` timestamp NULL DEFAULT NULL,
  `last_crawl_at` timestamp NULL DEFAULT NULL,
  `crawl_status` enum('pending','running','completed','failed') DEFAULT 'pending',
  `is_active` tinyint(1) DEFAULT '1',
  `settings` text DEFAULT NULL COMMENT 'JSON formatted settings',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_url` (`organization_id`,`url`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_domain` (`domain`),
  KEY `idx_active` (`is_active`),
  KEY `idx_verified` (`is_verified`),
  KEY `idx_last_scan` (`last_scan_at`),
  CONSTRAINT `websites_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracked websites';

CREATE TABLE IF NOT EXISTS `content` (
  `id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `title` varchar(500) DEFAULT NULL,
  `meta_description` text,
  `content_hash` varchar(64) DEFAULT NULL,
  `word_count` int DEFAULT '0',
  `geo_score` decimal(5,2) DEFAULT '0.00',
  `readability_score` decimal(5,2) DEFAULT '0.00',
  `optimization_status` enum('pending','optimized','failed') DEFAULT 'pending',
  `optimization_suggestions` text DEFAULT NULL COMMENT 'JSON formatted suggestions',
  `structured_data` text DEFAULT NULL COMMENT 'JSON-LD structured data',
  `last_optimized_at` timestamp NULL DEFAULT NULL,
  `last_crawled_at` timestamp NULL DEFAULT NULL,
  `is_indexed` tinyint(1) DEFAULT '0',
  `http_status` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_website_url` (`website_id`,`url`(255)),
  KEY `idx_website` (`website_id`),
  KEY `idx_score` (`geo_score`),
  KEY `idx_status` (`optimization_status`),
  KEY `idx_content_optimization` (`optimization_status`,`geo_score`),
  FULLTEXT KEY `idx_content_search` (`title`,`meta_description`),
  CONSTRAINT `content_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Website content and optimization data';

-- ============================================================================
-- Keywords and Competitor Management  
-- ============================================================================

CREATE TABLE IF NOT EXISTS `keywords` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `keyword` varchar(255) NOT NULL,
  `search_volume` int DEFAULT NULL,
  `difficulty` decimal(5,2) DEFAULT NULL,
  `intent` enum('informational','commercial','navigational','transactional') DEFAULT 'informational',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_keyword` (`organization_id`,`keyword`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_keyword` (`keyword`),
  KEY `idx_intent` (`intent`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `keywords_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Keyword management';

CREATE TABLE IF NOT EXISTS `competitors` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_url` varchar(500) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `industry` varchar(100) DEFAULT NULL,
  `country` varchar(2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_analyzed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_competitor` (`organization_id`,`domain`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_domain` (`domain`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `competitors_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Competitor tracking';

-- ============================================================================
-- AI Tracking and Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS `ai_tracking_results` (
  `id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `keyword_id` char(36) DEFAULT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude') NOT NULL,
  `query` text NOT NULL,
  `is_mentioned` tinyint(1) DEFAULT '0',
  `is_cited` tinyint(1) DEFAULT '0',
  `citation_position` int DEFAULT NULL,
  `snippet` text,
  `full_response` longtext,
  `competitor_mentions` text DEFAULT NULL COMMENT 'JSON formatted competitor data',
  `sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `tracked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_keyword` (`keyword_id`),
  KEY `idx_platform` (`platform`),
  KEY `idx_tracked` (`tracked_at` DESC),
  KEY `idx_mentioned` (`is_mentioned`,`is_cited`),
  KEY `idx_ai_tracking_composite` (`website_id`,`platform`,`tracked_at`),
  CONSTRAINT `ai_tracking_results_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_tracking_results_ibfk_2` FOREIGN KEY (`keyword_id`) REFERENCES `keywords` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI platform tracking results';

-- Archive table with date-based partitioning (MySQL 5.7 compatible)
CREATE TABLE IF NOT EXISTS `ai_tracking_results_archive` (
  `id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `keyword_id` char(36) DEFAULT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude') NOT NULL,
  `query` text NOT NULL,
  `is_mentioned` tinyint(1) DEFAULT '0',
  `is_cited` tinyint(1) DEFAULT '0',
  `citation_position` int DEFAULT NULL,
  `snippet` text,
  `full_response` longtext,
  `competitor_mentions` text DEFAULT NULL COMMENT 'JSON formatted competitor data',
  `sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
  `tracked_at` datetime NOT NULL,
  `archived_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`tracked_at`),
  KEY `idx_id` (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_keyword` (`keyword_id`),
  KEY `idx_platform` (`platform`),
  KEY `idx_tracked` (`tracked_at`),
  KEY `idx_archived` (`archived_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Archived AI tracking results'
PARTITION BY RANGE (YEAR(tracked_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p2027 VALUES LESS THAN (2028),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- ============================================================================
-- Scanning and Analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS `scans` (
  `id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `scan_type` enum('quick','standard','deep') DEFAULT 'standard',
  `status` enum('pending','running','completed','failed') DEFAULT 'pending',
  `progress` int DEFAULT '0',
  `geo_score` decimal(5,2) DEFAULT NULL,
  `technical_score` decimal(5,2) DEFAULT NULL,
  `content_score` decimal(5,2) DEFAULT NULL,
  `ai_visibility_score` decimal(5,2) DEFAULT NULL,
  `issues_found` int DEFAULT '0',
  `suggestions_count` int DEFAULT '0',
  `scan_duration` int DEFAULT NULL COMMENT 'Duration in seconds',
  `results` text DEFAULT NULL COMMENT 'JSON formatted scan results',
  `error_message` text,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at` DESC),
  KEY `idx_geo_score` (`geo_score`),
  KEY `idx_scan_website_status` (`website_id`,`status`,`created_at`),
  CONSTRAINT `scans_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Website scans and analysis';

CREATE TABLE IF NOT EXISTS `scan_metrics` (
  `id` char(36) NOT NULL,
  `scan_id` char(36) NOT NULL,
  `metric_type` varchar(100) NOT NULL,
  `metric_value` decimal(10,2) DEFAULT NULL,
  `details` text DEFAULT NULL COMMENT 'JSON formatted metric details',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_scan` (`scan_id`),
  KEY `idx_type` (`metric_type`),
  KEY `idx_value` (`metric_value`),
  CONSTRAINT `scan_metrics_ibfk_1` FOREIGN KEY (`scan_id`) REFERENCES `scans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detailed scan metrics';

-- ============================================================================
-- Analytics and Reporting
-- ============================================================================

CREATE TABLE IF NOT EXISTS `analytics_snapshots` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `snapshot_type` enum('daily','weekly','monthly') NOT NULL,
  `metrics` text NOT NULL COMMENT 'JSON formatted metrics data',
  `period_start` timestamp NULL DEFAULT NULL,
  `period_end` timestamp NULL DEFAULT NULL,
  `total_mentions` int DEFAULT '0',
  `total_citations` int DEFAULT '0',
  `avg_sentiment_score` decimal(5,2) DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_snapshot_type` (`organization_id`,`snapshot_type`),
  KEY `idx_website_generated_at` (`website_id`,`generated_at`),
  KEY `idx_period` (`period_start`,`period_end`),
  CONSTRAINT `analytics_snapshots_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `analytics_snapshots_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Analytics snapshots for reporting';

CREATE TABLE IF NOT EXISTS `keyword_research` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `keyword` varchar(255) NOT NULL,
  `search_volume` int DEFAULT '0',
  `difficulty_score` decimal(3,2) DEFAULT '0.00',
  `competition_level` enum('low','medium','high') DEFAULT 'medium',
  `cpc` decimal(6,2) DEFAULT NULL,
  `trend_data` text DEFAULT NULL COMMENT 'JSON formatted trend data',
  `related_keywords` text DEFAULT NULL COMMENT 'JSON formatted related keywords',
  `research_date` date NOT NULL,
  `data_source` enum('google','semrush','ahrefs','manual') DEFAULT 'manual',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_keyword` (`organization_id`,`keyword`),
  KEY `idx_keyword_research_date` (`keyword`,`research_date`),
  KEY `idx_difficulty_score` (`difficulty_score`),
  KEY `idx_competition_level` (`competition_level`),
  CONSTRAINT `keyword_research_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Keyword research data';

CREATE TABLE IF NOT EXISTS `competitor_benchmarks` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `competitor_id` char(36) NOT NULL,
  `ai_visibility_score` decimal(5,2) DEFAULT '0.00',
  `mention_frequency` int DEFAULT '0',
  `citation_rate` decimal(5,2) DEFAULT '0.00',
  `sentiment_score` decimal(5,2) DEFAULT '0.00',
  `market_share_estimate` decimal(5,2) DEFAULT '0.00',
  `competitive_gap` decimal(5,2) DEFAULT '0.00',
  `strengths` text DEFAULT NULL COMMENT 'JSON formatted strengths',
  `weaknesses` text DEFAULT NULL COMMENT 'JSON formatted weaknesses',
  `opportunities` text DEFAULT NULL COMMENT 'JSON formatted opportunities',
  `threats` text DEFAULT NULL COMMENT 'JSON formatted threats',
  `market_position` enum('leader','challenger','follower','niche') DEFAULT 'follower',
  `analyzed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_website_competitor_analysis` (`website_id`,`competitor_id`,`analyzed_at`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_website_analyzed_at` (`website_id`,`analyzed_at`),
  KEY `idx_market_position` (`market_position`),
  KEY `competitor_id` (`competitor_id`),
  CONSTRAINT `competitor_benchmarks_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `competitor_benchmarks_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `competitor_benchmarks_ibfk_3` FOREIGN KEY (`competitor_id`) REFERENCES `competitors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Competitor benchmark analysis';

-- ============================================================================
-- Alert System
-- ============================================================================

CREATE TABLE IF NOT EXISTS `alert_configurations` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `alert_type` enum('mention_spike','visibility_drop','score_change','competitor_alert') NOT NULL,
  `conditions` text NOT NULL COMMENT 'JSON formatted alert conditions',
  `is_active` tinyint(1) DEFAULT '1',
  `website_id` char(36) DEFAULT NULL,
  `description` text,
  `notification_channels` text DEFAULT NULL COMMENT 'JSON formatted notification settings',
  `cooldown_minutes` int DEFAULT '60',
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `last_triggered_at` timestamp NULL DEFAULT NULL,
  `trigger_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_alert_type` (`alert_type`),
  CONSTRAINT `alert_configurations_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alert_configurations_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Alert configuration rules';

CREATE TABLE IF NOT EXISTS `alert_history` (
  `id` char(36) NOT NULL,
  `alert_config_id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) DEFAULT NULL,
  `alert_type` enum('mention_spike','visibility_drop','score_change','competitor_alert') NOT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `title` varchar(255) NOT NULL,
  `message` text,
  `trigger_data` text DEFAULT NULL COMMENT 'JSON formatted trigger data',
  `notification_status` enum('pending','sent','failed') DEFAULT 'pending',
  `notification_channels` text DEFAULT NULL COMMENT 'JSON formatted notification results',
  `error_message` text,
  `triggered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notified_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_alert_config` (`alert_config_id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_triggered_at` (`triggered_at` DESC),
  KEY `idx_status` (`notification_status`),
  CONSTRAINT `alert_history_ibfk_1` FOREIGN KEY (`alert_config_id`) REFERENCES `alert_configurations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alert_history_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Alert trigger history';

-- ============================================================================
-- Reports and Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS `report_templates` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `report_type` enum('competitor_benchmark','market_position','swot_analysis','keyword_analysis','custom') NOT NULL,
  `template_config` text NOT NULL COMMENT 'JSON formatted template configuration',
  `sections` text DEFAULT NULL COMMENT 'JSON formatted report sections',
  `styling` text DEFAULT NULL COMMENT 'JSON formatted styling options',
  `is_public` tinyint(1) DEFAULT '0',
  `is_system_default` tinyint(1) DEFAULT '0',
  `usage_count` int DEFAULT '0',
  `version` varchar(10) DEFAULT '1.0',
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_type` (`organization_id`,`report_type`),
  KEY `idx_public_templates` (`is_public`,`is_system_default`),
  KEY `idx_usage_count` (`usage_count`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `report_templates_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `report_templates_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Report templates';

CREATE TABLE IF NOT EXISTS `generated_reports` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `template_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `report_type` enum('competitor_benchmark','market_position','swot_analysis','keyword_analysis','custom') NOT NULL,
  `format` enum('pdf','excel','html','json') DEFAULT 'pdf',
  `status` enum('generating','completed','failed') DEFAULT 'generating',
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `download_count` int DEFAULT '0',
  `report_data` longtext COMMENT 'JSON formatted report content',
  `generation_params` text DEFAULT NULL COMMENT 'JSON formatted generation parameters',
  `error_message` text,
  `expires_at` timestamp NULL DEFAULT NULL,
  `generated_by` char(36) DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_template` (`template_id`),
  KEY `idx_status` (`status`),
  KEY `idx_generated_at` (`generated_at` DESC),
  KEY `idx_generated_by` (`generated_by`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `generated_reports_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `generated_reports_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `report_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `generated_reports_ibfk_3` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Generated reports';

-- ============================================================================
-- Settings and Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS `user_settings` (
  `userId` char(36) NOT NULL,
  `notificationPreferences` text DEFAULT NULL COMMENT 'JSON formatted notification preferences',
  `uiPreferences` text DEFAULT NULL COMMENT 'JSON formatted UI preferences',
  `securitySettings` text DEFAULT NULL COMMENT 'JSON formatted security settings',
  `apiSettings` text DEFAULT NULL COMMENT 'JSON formatted API settings',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User preferences and settings';

CREATE TABLE IF NOT EXISTS `organization_settings` (
  `organizationId` char(36) NOT NULL,
  `companyInfo` text DEFAULT NULL COMMENT 'JSON formatted company information',
  `preferences` text DEFAULT NULL COMMENT 'JSON formatted organization preferences',
  `billingSettings` text DEFAULT NULL COMMENT 'JSON formatted billing settings',
  `integrationSettings` text DEFAULT NULL COMMENT 'JSON formatted integration settings',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`organizationId`),
  CONSTRAINT `organization_settings_ibfk_1` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Organization settings';

CREATE TABLE IF NOT EXISTS `tracking_settings` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `tracking_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `tracking_frequency` enum('hourly','daily','weekly') NOT NULL DEFAULT 'daily',
  `platforms` text NOT NULL DEFAULT '[\"chatgpt\",\"gemini\",\"perplexity\",\"claude\"]' COMMENT 'JSON formatted platform list',
  `keywords_limit` int DEFAULT '100',
  `competitors_limit` int DEFAULT '10',
  `alerts_enabled` tinyint(1) DEFAULT '1',
  `data_retention_days` int DEFAULT '365',
  `auto_archiving` tinyint(1) DEFAULT '1',
  `quality_filters` text DEFAULT NULL COMMENT 'JSON formatted quality filters',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_tracking_settings` (`organization_id`),
  KEY `idx_org_tracking` (`organization_id`),
  CONSTRAINT `tracking_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracking configuration settings';

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude') NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `settings` text NOT NULL DEFAULT '{}' COMMENT 'JSON formatted platform-specific settings',
  `rate_limit` int DEFAULT '100',
  `priority` int DEFAULT '1',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `success_rate` decimal(5,2) DEFAULT '100.00',
  `avg_response_time` int DEFAULT NULL COMMENT 'Average response time in milliseconds',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_platform` (`organization_id`,`platform`),
  KEY `idx_org_platform` (`organization_id`),
  KEY `idx_platform` (`platform`),
  KEY `idx_enabled` (`enabled`),
  CONSTRAINT `platform_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI platform settings';

-- ============================================================================
-- Team Management and Invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS `invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('owner','admin','editor','viewer') DEFAULT 'viewer',
  `token` varchar(255) NOT NULL,
  `status` enum('pending','accepted','expired','revoked') DEFAULT 'pending',
  `invitedBy` char(36) NOT NULL,
  `acceptedBy` char(36) DEFAULT NULL,
  `acceptedAt` timestamp NULL DEFAULT NULL,
  `expiresAt` timestamp NOT NULL,
  `metadata` text DEFAULT NULL COMMENT 'JSON formatted invitation metadata',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_email_pending` (`organizationId`,`email`,`status`),
  KEY `idx_organization` (`organizationId`),
  KEY `idx_email` (`email`),
  KEY `idx_token` (`token`),
  KEY `idx_status` (`status`),
  KEY `invitedBy` (`invitedBy`),
  CONSTRAINT `invitations_ibfk_1` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invitations_ibfk_2` FOREIGN KEY (`invitedBy`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Team member invitations';

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` char(36) DEFAULT NULL,
  `organizationId` char(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text,
  `metadata` text DEFAULT NULL COMMENT 'JSON formatted activity metadata',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`userId`),
  KEY `idx_organization` (`organizationId`),
  KEY `idx_action` (`action`),
  KEY `idx_created` (`createdAt` DESC),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Organization activity logs';

-- ============================================================================
-- System Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `key_hash` varchar(255) NOT NULL,
  `key_prefix` varchar(20) NOT NULL COMMENT 'First 8 characters for identification',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `usage_count` bigint DEFAULT '0',
  `rate_limit` int DEFAULT '1000',
  `permissions` text DEFAULT NULL COMMENT 'JSON formatted permissions',
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key_hash`),
  UNIQUE KEY `unique_prefix` (`key_prefix`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `api_keys_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_keys_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API key management';

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `type` enum('info','warning','error','success','alert') DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `message` text,
  `action_url` varchar(500) DEFAULT NULL,
  `action_text` varchar(100) DEFAULT NULL,
  `metadata` text DEFAULT NULL COMMENT 'JSON formatted notification data',
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `category` varchar(50) DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`),
  KEY `idx_created` (`created_at` DESC),
  KEY `idx_priority` (`priority`),
  KEY `idx_category` (`category`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User notifications';

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `organization_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `old_values` text DEFAULT NULL COMMENT 'JSON formatted old values',
  `new_values` text DEFAULT NULL COMMENT 'JSON formatted new values',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'low',
  `status` enum('success','failure','warning') DEFAULT 'success',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_created` (`created_at` DESC),
  KEY `idx_action` (`action`),
  KEY `idx_severity` (`severity`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Security and compliance audit trail';

-- ============================================================================
-- Metrics and Optimization Tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS `metrics_snapshots` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `metric_type` enum('mention_count','sentiment_score','visibility_percentage','geo_score') NOT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude','all') DEFAULT 'all',
  `time_window` enum('1h','1d','7d','30d') NOT NULL,
  `metric_value` decimal(10,4) NOT NULL,
  `previous_value` decimal(10,4) DEFAULT NULL,
  `change_percentage` decimal(6,2) DEFAULT NULL,
  `metadata` text DEFAULT NULL COMMENT 'JSON formatted additional metrics',
  `snapshot_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_website` (`organization_id`,`website_id`),
  KEY `idx_metric_type_platform` (`metric_type`,`platform`),
  KEY `idx_snapshot_at` (`snapshot_at` DESC),
  KEY `idx_time_window` (`time_window`),
  CONSTRAINT `metrics_snapshots_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `metrics_snapshots_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Real-time metrics snapshots';

CREATE TABLE IF NOT EXISTS `optimization_tasks` (
  `id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `task_type` enum('schema_injection','content_optimization','meta_update','faq_generation','sitemap_update') NOT NULL,
  `status` enum('pending','running','completed','failed') DEFAULT 'pending',
  `priority` int DEFAULT '5',
  `progress` int DEFAULT '0',
  `task_config` text DEFAULT NULL COMMENT 'JSON formatted task configuration',
  `results` text DEFAULT NULL COMMENT 'JSON formatted optimization results',
  `error_message` text,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `estimated_duration` int DEFAULT NULL COMMENT 'Estimated duration in seconds',
  `actual_duration` int DEFAULT NULL COMMENT 'Actual duration in seconds',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`task_type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_scheduled` (`scheduled_at`),
  CONSTRAINT `optimization_tasks_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Content optimization tasks';

-- ============================================================================
-- Integration and External Services
-- ============================================================================

CREATE TABLE IF NOT EXISTS `integrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` char(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` enum('connected','disconnected','error','pending') DEFAULT 'disconnected',
  `credentials` text DEFAULT NULL COMMENT 'JSON formatted encrypted credentials',
  `settings` text DEFAULT NULL COMMENT 'JSON formatted integration settings',
  `last_sync_at` timestamp NULL DEFAULT NULL,
  `sync_status` enum('success','failed','partial') DEFAULT NULL,
  `error_message` text,
  `webhook_url` varchar(500) DEFAULT NULL,
  `webhook_secret` varchar(100) DEFAULT NULL,
  `rate_limit` int DEFAULT '100',
  `usage_count` bigint DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_type` (`organizationId`,`type`),
  KEY `idx_organization` (`organizationId`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `integrations_ibfk_1` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='External service integrations';

-- ============================================================================
-- Views for Reporting and Analytics
-- ============================================================================

CREATE OR REPLACE VIEW `website_overview` AS 
SELECT 
    w.`id`,
    w.`name`,
    w.`url`,
    w.`domain`,
    o.`name` AS `organization_name`,
    COUNT(DISTINCT c.`id`) AS `content_count`,
    ROUND(AVG(c.`geo_score`), 2) AS `avg_geo_score`,
    MAX(s.`completed_at`) AS `last_scan_date`,
    COUNT(DISTINCT atr.`id`) AS `total_mentions`,
    ROUND(AVG(CASE WHEN atr.`is_mentioned` = 1 THEN 1 ELSE 0 END) * 100, 2) AS `mention_rate`
FROM `websites` w 
JOIN `organizations` o ON w.`organization_id` = o.`id`
LEFT JOIN `content` c ON w.`id` = c.`website_id`
LEFT JOIN `scans` s ON w.`id` = s.`website_id` AND s.`status` = 'completed'
LEFT JOIN `ai_tracking_results` atr ON w.`id` = atr.`website_id` 
    AND atr.`tracked_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)
WHERE w.`is_active` = 1
GROUP BY w.`id`, w.`name`, w.`url`, w.`domain`, o.`name`;

-- ============================================================================
-- Triggers for Audit Logging (MySQL 5.7 compatible)
-- ============================================================================

DELIMITER $$

-- Trigger for user changes
CREATE TRIGGER `users_audit_insert` AFTER INSERT ON `users`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `new_values`, `created_at`)
    VALUES (UUID(), NEW.`id`, 'CREATE', 'user', NEW.`id`, 
            JSON_OBJECT('email', NEW.`email`, 'full_name', NEW.`full_name`, 'role', NEW.`role`), 
            NOW());
END$$

CREATE TRIGGER `users_audit_update` AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `created_at`)
    VALUES (UUID(), NEW.`id`, 'UPDATE', 'user', NEW.`id`,
            JSON_OBJECT('email', OLD.`email`, 'full_name', OLD.`full_name`, 'role', OLD.`role`),
            JSON_OBJECT('email', NEW.`email`, 'full_name', NEW.`full_name`, 'role', NEW.`role`),
            NOW());
END$$

-- Trigger for organization changes
CREATE TRIGGER `organizations_audit_insert` AFTER INSERT ON `organizations`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`id`, `organization_id`, `action`, `entity_type`, `entity_id`, `new_values`, `created_at`)
    VALUES (UUID(), NEW.`id`, 'CREATE', 'organization', NEW.`id`,
            JSON_OBJECT('name', NEW.`name`, 'plan', NEW.`plan`, 'slug', NEW.`slug`),
            NOW());
END$$

DELIMITER ;

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX `idx_tracking_website_platform_date` ON `ai_tracking_results` (`website_id`, `platform`, `tracked_at` DESC);
CREATE INDEX `idx_content_website_score` ON `content` (`website_id`, `geo_score` DESC);
CREATE INDEX `idx_scans_website_status_date` ON `scans` (`website_id`, `status`, `created_at` DESC);
CREATE INDEX `idx_alerts_org_active` ON `alert_configurations` (`organization_id`, `is_active`);
CREATE INDEX `idx_metrics_org_website_type` ON `metrics_snapshots` (`organization_id`, `website_id`, `metric_type`);

-- Full-text search indexes
ALTER TABLE `content` ADD FULLTEXT(`title`, `meta_description`);
ALTER TABLE `competitors` ADD FULLTEXT(`name`, `description`);

-- ============================================================================
-- Initial Data and Default Settings
-- ============================================================================

-- Insert default report templates
INSERT IGNORE INTO `report_templates` (`id`, `name`, `report_type`, `template_config`, `is_public`, `is_system_default`, `created_at`) VALUES
(UUID(), 'Basic Competitor Analysis', 'competitor_benchmark', '{"sections":["overview","metrics","recommendations"],"metrics":["ai_visibility","mention_frequency","sentiment"],"format":"pdf"}', 1, 1, NOW()),
(UUID(), 'Market Position Report', 'market_position', '{"sections":["market_overview","position_analysis","opportunities"],"timeframe":"30d","format":"pdf"}', 1, 1, NOW()),
(UUID(), 'SWOT Analysis Template', 'swot_analysis', '{"sections":["strengths","weaknesses","opportunities","threats"],"include_charts":true,"format":"pdf"}', 1, 1, NOW()),
(UUID(), 'Keyword Performance Report', 'keyword_analysis', '{"sections":["keyword_overview","performance_trends","recommendations"],"platforms":["chatgpt","gemini","perplexity","claude"],"format":"pdf"}', 1, 1, NOW());

-- ============================================================================
-- Restore Settings
-- ============================================================================

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
COMMIT;

-- ============================================================================
-- Schema Validation Queries
-- ============================================================================

-- Verify table count
-- SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = DATABASE();

-- Verify foreign key constraints
-- SELECT COUNT(*) as constraint_count FROM information_schema.key_column_usage WHERE constraint_schema = DATABASE() AND referenced_table_name IS NOT NULL;

-- Verify indexes
-- SELECT table_name, index_name, column_name FROM information_schema.statistics WHERE table_schema = DATABASE() ORDER BY table_name, index_name;

-- ============================================================================
-- End of Schema
-- ============================================================================
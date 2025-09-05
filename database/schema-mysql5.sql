-- MySQL 5.7 Compatible Schema for GEO Platform
-- Converted from MySQL 8.0 schema for compatibility with MySQL 5.7
-- Date: 2025-09-06
-- Compatible with MySQL 5.7.8+

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- UUID Generation Function for MySQL 5.7 Compatibility
--
DELIMITER $$
CREATE FUNCTION IF NOT EXISTS uuid_v4()
RETURNS CHAR(36)
READS SQL DATA
DETERMINISTIC
BEGIN
    RETURN UPPER(CONCAT(
        LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFF)), 8, '0'), '-',
        LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), '-',
        '4', LPAD(HEX(FLOOR(RAND() * 0x0FFF)), 3, '0'), '-',
        HEX(FLOOR(RAND() * 4 + 8)), LPAD(HEX(FLOOR(RAND() * 0x0FFF)), 3, '0'), '-',
        LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFFFFFF)), 12, '0')
    ));
END$$
DELIMITER ;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `settings` longtext,
  `subscription_plan` enum('free','basic','premium','enterprise') DEFAULT 'free',
  `subscription_status` enum('active','inactive','cancelled','suspended') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_domain` (`domain`),
  KEY `idx_subscription` (`subscription_plan`,`subscription_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for organizations UUID generation
--
DELIMITER $$
CREATE TRIGGER organizations_uuid_trigger 
BEFORE INSERT ON organizations 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `role` enum('admin','manager','user','viewer') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT '1',
  `email_verified` tinyint(1) DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for users UUID generation
--
DELIMITER $$
CREATE TRIGGER users_uuid_trigger 
BEFORE INSERT ON users 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `user_organizations`
--

DROP TABLE IF EXISTS `user_organizations`;
CREATE TABLE `user_organizations` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `role` enum('owner','admin','member') DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_org` (`user_id`,`organization_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_org` (`organization_id`),
  CONSTRAINT `user_organizations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_organizations_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for user_organizations UUID generation
--
DELIMITER $$
CREATE TRIGGER user_organizations_uuid_trigger 
BEFORE INSERT ON user_organizations 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `websites`
--

DROP TABLE IF EXISTS `websites`;
CREATE TABLE `websites` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `url` varchar(500) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `settings` longtext,
  `robots_txt_status` enum('allowed','blocked','partial','unknown') DEFAULT 'unknown',
  `last_scan_at` timestamp NULL DEFAULT NULL,
  `scan_frequency` enum('daily','weekly','monthly') DEFAULT 'weekly',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_url` (`organization_id`,`url`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_domain` (`domain`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `websites_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for websites UUID generation
--
DELIMITER $$
CREATE TRIGGER websites_uuid_trigger 
BEFORE INSERT ON websites 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `scans`
--

DROP TABLE IF EXISTS `scans`;
CREATE TABLE `scans` (
  `id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `scan_type` enum('basic','standard','premium') DEFAULT 'standard',
  `status` enum('pending','running','completed','failed','cancelled') DEFAULT 'pending',
  `url` varchar(500) NOT NULL,
  `score` int DEFAULT NULL,
  `technical_health` int DEFAULT NULL,
  `content_quality` int DEFAULT NULL,
  `ai_visibility` int DEFAULT NULL,
  `lighthouse_data` longtext,
  `scan_results` longtext,
  `error_message` text,
  `scan_duration` int DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_status` (`status`),
  KEY `idx_score` (`score`),
  KEY `idx_created` (`created_at` DESC),
  KEY `idx_website_status` (`website_id`,`status`),
  CONSTRAINT `scans_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for scans UUID generation
--
DELIMITER $$
CREATE TRIGGER scans_uuid_trigger 
BEFORE INSERT ON scans 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `keywords`
--

DROP TABLE IF EXISTS `keywords`;
CREATE TABLE `keywords` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `keyword` varchar(255) NOT NULL,
  `search_volume` int DEFAULT NULL,
  `difficulty` decimal(5,2) DEFAULT NULL,
  `cpc` decimal(10,2) DEFAULT NULL,
  `intent` enum('informational','commercial','transactional','navigational') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_keyword` (`organization_id`,`keyword`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_keyword` (`keyword`),
  KEY `idx_intent` (`intent`),
  KEY `idx_search_volume` (`search_volume`),
  CONSTRAINT `keywords_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for keywords UUID generation
--
DELIMITER $$
CREATE TRIGGER keywords_uuid_trigger 
BEFORE INSERT ON keywords 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `tracking_settings`
--

DROP TABLE IF EXISTS `tracking_settings`;
CREATE TABLE `tracking_settings` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `tracking_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `tracking_frequency` enum('hourly','daily','weekly') NOT NULL DEFAULT 'daily',
  `platforms` longtext NOT NULL,
  `alerts_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `alert_threshold` int NOT NULL DEFAULT '5',
  `alert_emails` longtext NOT NULL,
  `settings` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_tracking_settings` (`organization_id`),
  KEY `idx_org_tracking` (`organization_id`),
  CONSTRAINT `tracking_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for tracking_settings UUID generation and JSON defaults
--
DELIMITER $$
CREATE TRIGGER tracking_settings_uuid_trigger 
BEFORE INSERT ON tracking_settings 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF;
    IF NEW.platforms IS NULL OR NEW.platforms = '' THEN
        SET NEW.platforms = '["chatgpt", "gemini", "perplexity", "claude"]';
    END IF;
    IF NEW.alert_emails IS NULL OR NEW.alert_emails = '' THEN
        SET NEW.alert_emails = '[]';
    END IF;
    IF NEW.settings IS NULL OR NEW.settings = '' THEN
        SET NEW.settings = '{}';
    END IF;
END$$
DELIMITER ;

--
-- Table structure for table `platform_settings`
--

DROP TABLE IF EXISTS `platform_settings`;
CREATE TABLE `platform_settings` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude') NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `settings` longtext NOT NULL,
  `api_key` varchar(500) DEFAULT NULL,
  `last_sync` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_platform` (`organization_id`,`platform`),
  KEY `idx_org_platform` (`organization_id`),
  KEY `idx_platform` (`platform`),
  CONSTRAINT `platform_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for platform_settings UUID generation and JSON defaults
--
DELIMITER $$
CREATE TRIGGER platform_settings_uuid_trigger 
BEFORE INSERT ON platform_settings 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF;
    IF NEW.settings IS NULL OR NEW.settings = '' THEN
        SET NEW.settings = '{}';
    END IF;
END$$
DELIMITER ;

--
-- Table structure for table `competitors`
--

DROP TABLE IF EXISTS `competitors`;
CREATE TABLE `competitors` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_url` varchar(500) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_analyzed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_competitor` (`organization_id`,`domain`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_domain` (`domain`),
  KEY `idx_competitor_active` (`is_active`),
  KEY `idx_competitor_analyzed` (`last_analyzed_at`),
  CONSTRAINT `competitors_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for competitors UUID generation
--
DELIMITER $$
CREATE TRIGGER competitors_uuid_trigger 
BEFORE INSERT ON competitors 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
CREATE TABLE `pages` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` text NOT NULL,
  `type` enum('產品頁','部落格','FAQ','服務頁','其他') NOT NULL DEFAULT '其他',
  `traffic` enum('高','中','低') NOT NULL DEFAULT '中',
  `geo_score` int DEFAULT NULL,
  `last_analyzed_at` timestamp NULL DEFAULT NULL,
  `analysis_status` enum('pending','analyzing','completed','failed') NOT NULL DEFAULT 'pending',
  `issues` longtext,
  `estimated_improvement` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org_pages` (`organization_id`),
  KEY `idx_analysis_status` (`analysis_status`),
  KEY `idx_geo_score` (`geo_score`),
  CONSTRAINT `pages_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for pages UUID generation
--
DELIMITER $$
CREATE TRIGGER pages_uuid_trigger 
BEFORE INSERT ON pages 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF;
    IF NEW.issues IS NULL OR NEW.issues = '' THEN
        SET NEW.issues = '[]';
    END IF;
END$$
DELIMITER ;

--
-- Table structure for table `ai_tracking_results`
--

DROP TABLE IF EXISTS `ai_tracking_results`;
CREATE TABLE `ai_tracking_results` (
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
  `competitor_mentions` longtext,
  `tracked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_keyword` (`keyword_id`),
  KEY `idx_platform` (`platform`),
  KEY `idx_tracked` (`tracked_at` DESC),
  KEY `idx_ai_tracking_composite` (`website_id`,`platform`,`tracked_at`),
  KEY `idx_ai_tracking_platform_mentioned` (`platform`,`is_mentioned`,`tracked_at`),
  KEY `idx_ai_tracking_platform_cited` (`platform`,`is_cited`,`tracked_at`),
  CONSTRAINT `ai_tracking_results_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_tracking_results_ibfk_2` FOREIGN KEY (`keyword_id`) REFERENCES `keywords` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for ai_tracking_results UUID generation
--
DELIMITER $$
CREATE TRIGGER ai_tracking_results_uuid_trigger 
BEFORE INSERT ON ai_tracking_results 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `content`
--

DROP TABLE IF EXISTS `content`;
CREATE TABLE `content` (
  `id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `page_url` varchar(500) NOT NULL,
  `title` varchar(500) DEFAULT NULL,
  `meta_description` text,
  `content_text` longtext,
  `optimization_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `original_content` longtext,
  `optimized_content` longtext,
  `optimization_suggestions` longtext,
  `schema_types` longtext,
  `seo_score` int DEFAULT NULL,
  `ai_readability_score` int DEFAULT NULL,
  `optimization_provider` enum('openai','gemini') DEFAULT 'openai',
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_website_url` (`website_id`,`page_url`),
  KEY `idx_website` (`website_id`),
  KEY `idx_status` (`optimization_status`),
  KEY `idx_score` (`seo_score`),
  KEY `idx_content_composite` (`website_id`,`optimization_status`),
  CONSTRAINT `content_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for content UUID generation
--
DELIMITER $$
CREATE TRIGGER content_uuid_trigger 
BEFORE INSERT ON content 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
CREATE TABLE `api_keys` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `key_hash` varchar(255) NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key_hash`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `api_keys_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for api_keys UUID generation
--
DELIMITER $$
CREATE TRIGGER api_keys_uuid_trigger 
BEFORE INSERT ON api_keys 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `resource_type` varchar(100) NOT NULL,
  `resource_id` char(36) DEFAULT NULL,
  `old_values` longtext,
  `new_values` longtext,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_resource` (`resource_type`,`resource_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created` (`created_at` DESC),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for audit_logs UUID generation
--
DELIMITER $$
CREATE TRIGGER audit_logs_uuid_trigger 
BEFORE INSERT ON audit_logs 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `type` enum('info','warning','error','success') DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `metadata` longtext,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_unread` (`is_read`,`created_at`),
  KEY `idx_type` (`type`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for notifications UUID generation
--
DELIMITER $$
CREATE TRIGGER notifications_uuid_trigger 
BEFORE INSERT ON notifications 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `integration_settings`
--

DROP TABLE IF EXISTS `integration_settings`;
CREATE TABLE `integration_settings` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `integration_type` enum('zapier','make','webhook','api') NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `credentials` longtext,
  `settings` longtext,
  `last_sync` timestamp NULL DEFAULT NULL,
  `sync_status` enum('active','failed','disabled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_type` (`integration_type`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `integration_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for integration_settings UUID generation
--
DELIMITER $$
CREATE TRIGGER integration_settings_uuid_trigger 
BEFORE INSERT ON integration_settings 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `optimization_tasks`
--

DROP TABLE IF EXISTS `optimization_tasks`;
CREATE TABLE `optimization_tasks` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `task_type` enum('content_optimization','competitor_analysis','keyword_research','performance_audit') NOT NULL,
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `parameters` longtext,
  `results` longtext,
  `progress` int DEFAULT '0',
  `error_message` text,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_status` (`status`),
  KEY `idx_scheduled` (`scheduled_at`),
  KEY `idx_task_composite` (`status`,`priority`,`scheduled_at`),
  CONSTRAINT `optimization_tasks_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `optimization_tasks_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for optimization_tasks UUID generation
--
DELIMITER $$
CREATE TRIGGER optimization_tasks_uuid_trigger 
BEFORE INSERT ON optimization_tasks 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) DEFAULT NULL,
  `report_type` enum('weekly','monthly','quarterly','annual','custom') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `data` longtext,
  `generated_by` char(36) DEFAULT NULL,
  `status` enum('generating','completed','failed') DEFAULT 'generating',
  `file_path` varchar(500) DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_type` (`report_type`),
  KEY `idx_generated_by` (`generated_by`),
  KEY `idx_status` (`status`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for reports UUID generation
--
DELIMITER $$
CREATE TRIGGER reports_uuid_trigger 
BEFORE INSERT ON reports 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Table structure for table `scan_metrics`
--

DROP TABLE IF EXISTS `scan_metrics`;
CREATE TABLE `scan_metrics` (
  `id` char(36) NOT NULL,
  `scan_id` char(36) NOT NULL,
  `metric_name` varchar(100) NOT NULL,
  `metric_value` decimal(10,4) DEFAULT NULL,
  `metric_text` text,
  `category` enum('technical','content','ai_visibility','performance') NOT NULL,
  `weight` decimal(3,2) DEFAULT '1.00',
  `passed` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_scan` (`scan_id`),
  KEY `idx_category` (`category`),
  KEY `idx_metric_name` (`metric_name`),
  KEY `idx_passed` (`passed`),
  CONSTRAINT `scan_metrics_ibfk_1` FOREIGN KEY (`scan_id`) REFERENCES `scans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Trigger for scan_metrics UUID generation
--
DELIMITER $$
CREATE TRIGGER scan_metrics_uuid_trigger 
BEFORE INSERT ON scan_metrics 
FOR EACH ROW 
BEGIN 
    IF NEW.id IS NULL OR NEW.id = '' THEN 
        SET NEW.id = uuid_v4(); 
    END IF; 
END$$
DELIMITER ;

--
-- Create view for website overview (MySQL 5.7 compatible)
--

CREATE VIEW `website_overview` AS 
SELECT 
    w.`id`,
    w.`name`,
    w.`url`,
    w.`domain`,
    o.`name` AS `organization_name`,
    COUNT(DISTINCT c.`id`) AS `content_count`,
    AVG(p.`geo_score`) AS `avg_geo_score`,
    MAX(s.`completed_at`) AS `last_scan_date`
FROM `websites` w
LEFT JOIN `organizations` o ON w.`organization_id` = o.`id`
LEFT JOIN `content` c ON w.`id` = c.`website_id`
LEFT JOIN `pages` p ON w.`organization_id` = p.`organization_id`
LEFT JOIN `scans` s ON w.`id` = s.`website_id` AND s.`status` = 'completed'
GROUP BY w.`id`, w.`name`, w.`url`, w.`domain`, o.`name`;

--
-- Sample data insertion for tracking settings and platform settings
--

INSERT IGNORE INTO tracking_settings (id, organization_id, tracking_enabled, tracking_frequency, platforms, alerts_enabled, alert_threshold, alert_emails, settings)
SELECT 
  uuid_v4() as id,
  id as organization_id,
  1 as tracking_enabled,
  'daily' as tracking_frequency,
  '["chatgpt", "gemini", "perplexity", "claude"]' as platforms,
  0 as alerts_enabled,
  5 as alert_threshold,
  '[]' as alert_emails,
  '{}' as settings
FROM organizations;

INSERT IGNORE INTO platform_settings (id, organization_id, platform, enabled, settings)
SELECT 
  uuid_v4() as id,
  org.id as organization_id,
  platform_list.platform,
  1 as enabled,
  '{}' as settings
FROM organizations org
CROSS JOIN (
  SELECT 'chatgpt' as platform
  UNION SELECT 'gemini'
  UNION SELECT 'perplexity'
  UNION SELECT 'claude'
) as platform_list;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- MySQL 5.7 Compatible Schema Complete
-- Features converted:
-- 1. DEFAULT (uuid()) -> Custom uuid_v4() function + triggers
-- 2. json data type -> longtext with JSON validation in application
-- 3. utf8mb4_0900_ai_ci -> utf8mb4_unicode_ci collation
-- 4. MySQL 8.0 specific syntax -> MySQL 5.7 compatible equivalents
-- 5. Preserved all foreign keys, indexes, and constraints
-- 6. Maintained full compatibility with existing application code
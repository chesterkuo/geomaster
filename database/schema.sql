mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: 10.74.100.30    Database: exchange_geo
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
mysqldump: Error: 'Access denied; you need (at least one of) the PROCESS privilege(s) for this operation' when trying to dump tablespaces

--
-- Table structure for table `ai_tracking_results`
--

DROP TABLE IF EXISTS `ai_tracking_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_tracking_results` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `website_id` char(36) NOT NULL,
  `keyword_id` char(36) DEFAULT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude') NOT NULL,
  `query` text NOT NULL,
  `is_mentioned` tinyint(1) DEFAULT '0',
  `is_cited` tinyint(1) DEFAULT '0',
  `citation_position` int DEFAULT NULL,
  `snippet` text,
  `full_response` longtext,
  `competitor_mentions` json DEFAULT NULL,
  `tracked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_keyword` (`keyword_id`),
  KEY `idx_platform` (`platform`),
  KEY `idx_tracked` (`tracked_at` DESC),
  KEY `idx_ai_tracking_composite` (`website_id`,`platform`,`tracked_at`),
  CONSTRAINT `ai_tracking_results_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_tracking_results_ibfk_2` FOREIGN KEY (`keyword_id`) REFERENCES `keywords` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_tracking_results_archive`
--

DROP TABLE IF EXISTS `ai_tracking_results_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_tracking_results_archive` (
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
  `competitor_mentions` json DEFAULT NULL,
  `tracked_at` datetime NOT NULL,
  `archived_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`tracked_at`),
  KEY `idx_id` (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_keyword` (`keyword_id`),
  KEY `idx_platform` (`platform`),
  KEY `idx_tracked` (`tracked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
/*!50500 PARTITION BY RANGE  COLUMNS(tracked_at)
(PARTITION p2024_q1 VALUES LESS THAN ('2024-04-01') ENGINE = InnoDB,
 PARTITION p2024_q2 VALUES LESS THAN ('2024-07-01') ENGINE = InnoDB,
 PARTITION p2024_q3 VALUES LESS THAN ('2024-10-01') ENGINE = InnoDB,
 PARTITION p2024_q4 VALUES LESS THAN ('2025-01-01') ENGINE = InnoDB,
 PARTITION p2025_q1 VALUES LESS THAN ('2025-04-01') ENGINE = InnoDB,
 PARTITION p2025_q2 VALUES LESS THAN ('2025-07-01') ENGINE = InnoDB,
 PARTITION p2025_q3 VALUES LESS THAN ('2025-10-01') ENGINE = InnoDB,
 PARTITION p2025_q4 VALUES LESS THAN ('2026-01-01') ENGINE = InnoDB,
 PARTITION p2026 VALUES LESS THAN ('2027-01-01') ENGINE = InnoDB,
 PARTITION pmax VALUES LESS THAN (MAXVALUE) ENGINE = InnoDB) */;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `user_id` char(36) DEFAULT NULL,
  `organization_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_created` (`created_at` DESC),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competitors`
--

DROP TABLE IF EXISTS `competitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `competitors` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
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
  CONSTRAINT `competitors_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `content`
--

DROP TABLE IF EXISTS `content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `website_id` char(36) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `title` varchar(500) DEFAULT NULL,
  `meta_description` text,
  `content_type` enum('page','post','product','faq') DEFAULT 'page',
  `original_content` longtext,
  `optimized_content` longtext,
  `geo_score` decimal(5,2) DEFAULT NULL,
  `word_count` int DEFAULT NULL,
  `reading_time` int DEFAULT NULL,
  `has_schema` tinyint(1) DEFAULT '0',
  `schema_types` json DEFAULT NULL,
  `last_updated` date DEFAULT NULL,
  `optimization_status` enum('pending','optimized','needs_update') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_score` (`geo_score`),
  KEY `idx_status` (`optimization_status`),
  KEY `idx_content_optimization` (`optimization_status`,`geo_score`),
  FULLTEXT KEY `idx_content` (`title`,`meta_description`),
  CONSTRAINT `content_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `integration_settings`
--

DROP TABLE IF EXISTS `integration_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integration_settings` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) DEFAULT NULL,
  `integration_type` enum('wordpress','shopify','wix','api','javascript') NOT NULL,
  `integration_level` enum('no_integration','javascript','plugin','api','full_integration') DEFAULT 'no_integration',
  `credentials` json DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_sync_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_type` (`integration_type`),
  CONSTRAINT `integration_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `integration_settings_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `keywords`
--

DROP TABLE IF EXISTS `keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `keywords` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
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
  CONSTRAINT `keywords_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `user_id` char(36) NOT NULL,
  `type` enum('info','warning','error','success') DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `message` text,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`),
  KEY `idx_created` (`created_at` DESC),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `optimization_tasks`
--

DROP TABLE IF EXISTS `optimization_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `optimization_tasks` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `website_id` char(36) NOT NULL,
  `task_type` enum('schema_injection','content_optimization','meta_update','faq_generation') NOT NULL,
  `status` enum('pending','running','completed','failed') DEFAULT 'pending',
  `priority` int DEFAULT '5',
  `input_data` json DEFAULT NULL,
  `result_data` json DEFAULT NULL,
  `error_message` text,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`task_type`),
  KEY `idx_priority` (`priority`),
  CONSTRAINT `optimization_tasks_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `plan` enum('free','starter','professional','enterprise') DEFAULT 'free',
  `credits` int DEFAULT '100',
  `max_users` int DEFAULT '5',
  `max_websites` int DEFAULT '3',
  `settings` json DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_plan` (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` text NOT NULL,
  `type` enum('產品頁','部落格','FAQ','服務頁','其他') NOT NULL DEFAULT '其他',
  `traffic` enum('高','中','低') NOT NULL DEFAULT '中',
  `geo_score` int DEFAULT NULL,
  `last_analyzed_at` datetime DEFAULT NULL,
  `analysis_status` enum('pending','analyzing','completed','failed') NOT NULL DEFAULT 'pending',
  `issues` json DEFAULT NULL,
  `estimated_improvement` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pages_organization_id` (`organization_id`),
  KEY `idx_pages_url` (`url`(255)),
  KEY `idx_pages_type` (`type`),
  KEY `idx_pages_analysis_status` (`analysis_status`),
  KEY `pages_organization_id` (`organization_id`),
  CONSTRAINT `fk_pages_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `platform_settings`
--

DROP TABLE IF EXISTS `platform_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platform_settings` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude') NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `settings` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `api_key` varchar(500) DEFAULT NULL,
  `last_sync` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_platform` (`organization_id`,`platform`),
  KEY `idx_org_platform` (`organization_id`),
  KEY `idx_platform` (`platform`),
  CONSTRAINT `platform_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `report_type` enum('weekly','monthly','custom') NOT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `status` enum('pending','generating','completed','failed') DEFAULT 'pending',
  `file_path` varchar(500) DEFAULT NULL,
  `data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_org` (`organization_id`),
  KEY `idx_type` (`report_type`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`date_from`,`date_to`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scan_metrics`
--

DROP TABLE IF EXISTS `scan_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scan_metrics` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `scan_id` char(36) NOT NULL,
  `metric_type` varchar(100) NOT NULL,
  `metric_value` decimal(10,2) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_scan` (`scan_id`),
  KEY `idx_type` (`metric_type`),
  CONSTRAINT `scan_metrics_ibfk_1` FOREIGN KEY (`scan_id`) REFERENCES `scans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scans`
--

DROP TABLE IF EXISTS `scans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scans` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `website_id` char(36) NOT NULL,
  `scan_type` enum('quick','standard','deep') DEFAULT 'standard',
  `status` enum('pending','running','completed','failed') DEFAULT 'pending',
  `progress` int DEFAULT '0',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `error_message` text,
  `results` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at` DESC),
  KEY `idx_scan_website_status` (`website_id`,`status`,`created_at`),
  CONSTRAINT `scans_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tracking_settings`
--

DROP TABLE IF EXISTS `tracking_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tracking_settings` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `tracking_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `tracking_frequency` enum('hourly','daily','weekly') NOT NULL DEFAULT 'daily',
  `platforms` json NOT NULL DEFAULT (_utf8mb4'[chatgpt, gemini, perplexity, claude]'),
  `alerts_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `alert_threshold` int NOT NULL DEFAULT '5',
  `alert_emails` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `settings` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_tracking_settings` (`organization_id`),
  KEY `idx_org_tracking` (`organization_id`),
  CONSTRAINT `tracking_settings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_organizations`
--

DROP TABLE IF EXISTS `user_organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_organizations` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `user_id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `role` enum('owner','admin','member') DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_org` (`user_id`,`organization_id`),
  UNIQUE KEY `user_organizations_user_id_organization_id` (`user_id`,`organization_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_org` (`organization_id`),
  CONSTRAINT `user_organizations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_organizations_ibfk_2` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `website_overview`
--

DROP TABLE IF EXISTS `website_overview`;
/*!50001 DROP VIEW IF EXISTS `website_overview`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `website_overview` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `url`,
 1 AS `domain`,
 1 AS `organization_name`,
 1 AS `content_count`,
 1 AS `avg_geo_score`,
 1 AS `last_scan_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `websites`
--

DROP TABLE IF EXISTS `websites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `websites` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `url` varchar(500) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `settings` json DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `website_overview`
--

/*!50001 DROP VIEW IF EXISTS `website_overview`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `website_overview` AS select `w`.`id` AS `id`,`w`.`name` AS `name`,`w`.`url` AS `url`,`w`.`domain` AS `domain`,`o`.`name` AS `organization_name`,count(distinct `c`.`id`) AS `content_count`,avg(`c`.`geo_score`) AS `avg_geo_score`,max(`s`.`completed_at`) AS `last_scan_date` from (((`websites` `w` join `organizations` `o` on((`w`.`organization_id` = `o`.`id`))) left join `content` `c` on((`w`.`id` = `c`.`website_id`))) left join `scans` `s` on(((`w`.`id` = `s`.`website_id`) and (`s`.`status` = 'completed')))) group by `w`.`id`,`w`.`name`,`w`.`url`,`w`.`domain`,`o`.`name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-06  1:24:31

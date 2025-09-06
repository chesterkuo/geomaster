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

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `organizationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text,
  `metadata` json DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`userId`),
  KEY `idx_organization` (`organizationId`),
  KEY `idx_action` (`action`),
  KEY `idx_created` (`createdAt`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Table structure for table `alert_configurations`
--

DROP TABLE IF EXISTS `alert_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alert_configurations` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `alert_type` enum('mention_spike','visibility_drop','score_change') NOT NULL,
  `conditions` json NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `website_id` char(36) DEFAULT NULL,
  `description` text,
  `notification_channels` json DEFAULT NULL,
  `cooldown_minutes` int DEFAULT '60',
  `last_triggered_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alert_history`
--

DROP TABLE IF EXISTS `alert_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alert_history` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `alert_config_id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) DEFAULT NULL,
  `alert_type` enum('mention_spike','visibility_drop','score_change') NOT NULL,
  `trigger_data` json NOT NULL,
  `notification_status` enum('pending','sent','failed') DEFAULT 'pending',
  `notification_channels` json DEFAULT NULL,
  `error_message` text,
  `triggered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `analytics_snapshots`
--

DROP TABLE IF EXISTS `analytics_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_snapshots` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `snapshot_type` enum('daily','weekly','monthly') NOT NULL,
  `metrics` json NOT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_snapshot_type` (`organization_id`,`snapshot_type`),
  KEY `idx_website_generated_at` (`website_id`,`generated_at`),
  CONSTRAINT `analytics_snapshots_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `analytics_snapshots_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
-- Table structure for table `competitor_benchmarks`
--

DROP TABLE IF EXISTS `competitor_benchmarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `competitor_benchmarks` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `competitor_id` char(36) NOT NULL,
  `ai_visibility_score` decimal(5,2) DEFAULT '0.00',
  `mention_frequency` int DEFAULT '0',
  `sentiment_analysis` json DEFAULT NULL,
  `top_keywords` json DEFAULT NULL,
  `content_gaps` json DEFAULT NULL,
  `technical_comparison` json DEFAULT NULL,
  `market_position` enum('leading','competitive','lagging') DEFAULT 'competitive',
  `recommendations` text,
  `analyzed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_competitor` (`organization_id`,`competitor_id`),
  KEY `idx_website_analyzed_at` (`website_id`,`analyzed_at`),
  KEY `idx_market_position` (`market_position`),
  KEY `competitor_id` (`competitor_id`),
  CONSTRAINT `competitor_benchmarks_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `competitor_benchmarks_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `competitor_benchmarks_ibfk_3` FOREIGN KEY (`competitor_id`) REFERENCES `competitors` (`id`) ON DELETE CASCADE
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
-- Table structure for table `generated_reports`
--

DROP TABLE IF EXISTS `generated_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generated_reports` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `template_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `report_type` enum('competitor_benchmark','market_position','swot_analysis','keyword_analysis','custom') NOT NULL,
  `parameters` json DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_format` enum('pdf','excel','csv','json') NOT NULL,
  `file_size` int DEFAULT '0',
  `status` enum('generating','completed','failed') DEFAULT 'generating',
  `generated_by` char(36) DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_type` (`organization_id`,`report_type`),
  KEY `idx_status_generated_at` (`status`,`generated_at`),
  KEY `idx_generated_by` (`generated_by`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `generated_reports_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `generated_reports_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `report_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `generated_reports_ibfk_3` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
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
-- Table structure for table `integrations`
--

DROP TABLE IF EXISTS `integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` enum('connected','disconnected','error') DEFAULT 'disconnected',
  `credentials` json DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `connectedAt` timestamp NULL DEFAULT NULL,
  `lastSyncAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization` (`organizationId`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `integrations_ibfk_1` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invitations`
--

DROP TABLE IF EXISTS `invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('owner','admin','editor','viewer') DEFAULT 'viewer',
  `token` varchar(255) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `invitedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `message` text,
  `status` enum('pending','accepted','expired','cancelled') DEFAULT 'pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_organization` (`organizationId`),
  KEY `idx_email` (`email`),
  KEY `idx_token` (`token`),
  KEY `idx_status` (`status`),
  KEY `invitedBy` (`invitedBy`),
  CONSTRAINT `invitations_ibfk_1` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invitations_ibfk_2` FOREIGN KEY (`invitedBy`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `keyword_rankings`
--

DROP TABLE IF EXISTS `keyword_rankings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `keyword_rankings` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `keyword_id` char(36) NOT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude','copilot','meta','poe') NOT NULL,
  `ranking_position` int DEFAULT '0',
  `visibility_score` decimal(5,2) DEFAULT '0.00',
  `mentions_count` int DEFAULT '0',
  `tracked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website_keyword` (`website_id`,`keyword_id`),
  KEY `idx_keyword_platform` (`keyword_id`,`platform`),
  KEY `idx_tracked_at` (`tracked_at`),
  KEY `idx_ranking_position` (`ranking_position`),
  KEY `organization_id` (`organization_id`),
  CONSTRAINT `keyword_rankings_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `keyword_rankings_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `keyword_rankings_ibfk_3` FOREIGN KEY (`keyword_id`) REFERENCES `keyword_research` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `keyword_research`
--

DROP TABLE IF EXISTS `keyword_research`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `keyword_research` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `keyword` varchar(255) NOT NULL,
  `search_volume` int DEFAULT '0',
  `difficulty_score` decimal(3,2) DEFAULT '0.00',
  `cpc_estimate` decimal(8,2) DEFAULT '0.00',
  `related_keywords` json DEFAULT NULL,
  `competition_level` enum('low','medium','high') DEFAULT 'medium',
  `research_date` date NOT NULL,
  `data_source` varchar(100) DEFAULT 'internal',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_keyword` (`organization_id`,`keyword`),
  KEY `idx_keyword_research_date` (`keyword`,`research_date`),
  KEY `idx_difficulty_score` (`difficulty_score`),
  KEY `idx_competition_level` (`competition_level`),
  CONSTRAINT `keyword_research_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
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
-- Table structure for table `metrics_snapshots`
--

DROP TABLE IF EXISTS `metrics_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metrics_snapshots` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `metric_type` enum('mention_count','sentiment_score','visibility_percentage','geo_score') NOT NULL,
  `platform` enum('chatgpt','gemini','perplexity','claude','all') DEFAULT 'all',
  `time_window` enum('1h','1d','7d','30d') NOT NULL,
  `metric_value` decimal(10,4) NOT NULL,
  `previous_value` decimal(10,4) DEFAULT NULL,
  `change_percentage` decimal(6,2) DEFAULT NULL,
  `snapshot_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
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
-- Table structure for table `organization_settings`
--

DROP TABLE IF EXISTS `organization_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_settings` (
  `organizationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `companyInfo` json DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`organizationId`),
  CONSTRAINT `organization_settings_ibfk_1` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
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
  `website` varchar(255) DEFAULT NULL,
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
-- Table structure for table `report_templates`
--

DROP TABLE IF EXISTS `report_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_templates` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `report_type` enum('competitor_benchmark','market_position','swot_analysis','keyword_analysis','custom') NOT NULL,
  `template_config` json NOT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `is_system_default` tinyint(1) DEFAULT '0',
  `usage_count` int DEFAULT '0',
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
  `status` enum('active','inactive','suspended') DEFAULT 'active',
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
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `notificationPreferences` json DEFAULT NULL,
  `uiPreferences` json DEFAULT NULL,
  `securitySettings` json DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  `passwordHash` varchar(255) DEFAULT NULL,
  `twoFactorSecret` varchar(255) DEFAULT NULL,
  `twoFactorEnabled` tinyint(1) DEFAULT '0',
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
-- Dumping routines for database 'exchange_geo'
--

-- insufficient privileges to SHOW CREATE PROCEDURE `GetAIVisibilityMetrics`
-- does exchange_geo have permissions on mysql.proc?


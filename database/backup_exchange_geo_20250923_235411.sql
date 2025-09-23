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
-- Table structure for table `ab_events`
--

DROP TABLE IF EXISTS `ab_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ab_events` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `experiment_id` char(36) NOT NULL,
  `variant_id` char(36) NOT NULL,
  `user_identifier` varchar(255) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `event_data` json DEFAULT NULL,
  `metric_value` decimal(15,6) DEFAULT NULL,
  `occurred_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_experiment_variant` (`experiment_id`,`variant_id`),
  KEY `idx_user_event` (`user_identifier`,`event_type`),
  KEY `idx_occurred_at` (`occurred_at`),
  KEY `ab_events_ibfk_2` (`variant_id`),
  CONSTRAINT `ab_events_ibfk_1` FOREIGN KEY (`experiment_id`) REFERENCES `ab_experiments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_events_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `ab_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ab_events`
--

LOCK TABLES `ab_events` WRITE;
/*!40000 ALTER TABLE `ab_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `ab_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ab_experiments`
--

DROP TABLE IF EXISTS `ab_experiments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ab_experiments` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `experiment_type` enum('content_optimization','seo_strategy','ui_design','keyword_targeting') NOT NULL,
  `hypothesis` text NOT NULL,
  `success_metric` varchar(100) NOT NULL,
  `target_metric_value` decimal(10,4) DEFAULT NULL,
  `significance_level` decimal(4,3) DEFAULT '0.050',
  `minimum_sample_size` int DEFAULT '1000',
  `traffic_allocation` decimal(4,3) DEFAULT '0.500',
  `status` enum('draft','running','paused','completed','cancelled') DEFAULT 'draft',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `expected_duration_days` int DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_website` (`organization_id`,`website_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`experiment_type`),
  KEY `idx_dates` (`start_date`,`end_date`),
  KEY `idx_created_by` (`created_by`),
  KEY `ab_experiments_ibfk_2` (`website_id`),
  CONSTRAINT `ab_experiments_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_experiments_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_experiments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ab_experiments`
--

LOCK TABLES `ab_experiments` WRITE;
/*!40000 ALTER TABLE `ab_experiments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ab_experiments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ab_results`
--

DROP TABLE IF EXISTS `ab_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ab_results` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `experiment_id` char(36) NOT NULL,
  `variant_id` char(36) NOT NULL,
  `metric_name` varchar(100) NOT NULL,
  `metric_value` decimal(15,6) NOT NULL,
  `sample_size` int NOT NULL,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_experiment_variant_metric_date` (`experiment_id`,`variant_id`,`metric_name`,`date`),
  KEY `idx_experiment_variant` (`experiment_id`,`variant_id`),
  KEY `idx_metric_date` (`metric_name`,`date`),
  KEY `ab_results_ibfk_2` (`variant_id`),
  CONSTRAINT `ab_results_ibfk_1` FOREIGN KEY (`experiment_id`) REFERENCES `ab_experiments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_results_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `ab_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ab_results`
--

LOCK TABLES `ab_results` WRITE;
/*!40000 ALTER TABLE `ab_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `ab_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ab_statistical_analysis`
--

DROP TABLE IF EXISTS `ab_statistical_analysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ab_statistical_analysis` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `experiment_id` char(36) NOT NULL,
  `analysis_type` enum('t_test','chi_square','bayesian') NOT NULL,
  `control_variant_id` char(36) NOT NULL,
  `treatment_variant_id` char(36) NOT NULL,
  `metric_name` varchar(100) NOT NULL,
  `control_mean` decimal(15,6) DEFAULT NULL,
  `treatment_mean` decimal(15,6) DEFAULT NULL,
  `control_std_dev` decimal(15,6) DEFAULT NULL,
  `treatment_std_dev` decimal(15,6) DEFAULT NULL,
  `effect_size` decimal(10,6) DEFAULT NULL,
  `p_value` decimal(10,8) DEFAULT NULL,
  `confidence_interval_lower` decimal(15,6) DEFAULT NULL,
  `confidence_interval_upper` decimal(15,6) DEFAULT NULL,
  `is_statistically_significant` tinyint(1) DEFAULT '0',
  `probability_to_be_best` decimal(5,4) DEFAULT NULL,
  `calculated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_experiment_metric` (`experiment_id`,`metric_name`),
  KEY `idx_variants` (`control_variant_id`,`treatment_variant_id`),
  KEY `idx_significance` (`is_statistically_significant`),
  KEY `ab_statistical_analysis_ibfk_3` (`treatment_variant_id`),
  CONSTRAINT `ab_statistical_analysis_ibfk_1` FOREIGN KEY (`experiment_id`) REFERENCES `ab_experiments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_statistical_analysis_ibfk_2` FOREIGN KEY (`control_variant_id`) REFERENCES `ab_variants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_statistical_analysis_ibfk_3` FOREIGN KEY (`treatment_variant_id`) REFERENCES `ab_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ab_statistical_analysis`
--

LOCK TABLES `ab_statistical_analysis` WRITE;
/*!40000 ALTER TABLE `ab_statistical_analysis` DISABLE KEYS */;
/*!40000 ALTER TABLE `ab_statistical_analysis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ab_user_assignments`
--

DROP TABLE IF EXISTS `ab_user_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ab_user_assignments` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `experiment_id` char(36) NOT NULL,
  `variant_id` char(36) NOT NULL,
  `user_identifier` varchar(255) NOT NULL,
  `user_segment_id` char(36) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `first_exposure_at` timestamp NULL DEFAULT NULL,
  `conversion_events` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_experiment_user` (`experiment_id`,`user_identifier`),
  KEY `idx_variant_user` (`variant_id`,`user_identifier`),
  KEY `idx_segment` (`user_segment_id`),
  KEY `idx_assigned_at` (`assigned_at`),
  CONSTRAINT `ab_user_assignments_ibfk_1` FOREIGN KEY (`experiment_id`) REFERENCES `ab_experiments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_user_assignments_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `ab_variants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_user_assignments_ibfk_3` FOREIGN KEY (`user_segment_id`) REFERENCES `ab_user_segments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ab_user_assignments`
--

LOCK TABLES `ab_user_assignments` WRITE;
/*!40000 ALTER TABLE `ab_user_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ab_user_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ab_user_segments`
--

DROP TABLE IF EXISTS `ab_user_segments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ab_user_segments` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `segment_criteria` json NOT NULL,
  `estimated_size` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `ab_user_segments_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ab_user_segments`
--

LOCK TABLES `ab_user_segments` WRITE;
/*!40000 ALTER TABLE `ab_user_segments` DISABLE KEYS */;
INSERT INTO `ab_user_segments` VALUES ('0718ee15-3ce8-42f7-81cf-00276367553c','f2042266-b143-4167-9d63-5a744b0f4607','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',9782,1,'2025-09-07 06:38:19','2025-09-07 06:38:19'),('11e726c0-fa01-449a-950c-5b7a9380f57e','7f24b33b-cf82-4c62-833f-863cc148d806','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',5521,1,'2025-09-07 06:31:46','2025-09-07 06:31:46'),('277611b4-341b-4e15-a923-8956d4682c10','11c744dd-2972-4543-ba27-757722097880','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',4925,1,'2025-09-07 06:05:47','2025-09-07 06:05:47'),('6f27b17a-1f69-4fcd-9491-88c3ac881a81','5842a90e-cfcc-441f-ac14-986d60bb5d6d','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',1510,1,'2025-09-07 06:29:37','2025-09-07 06:29:37'),('75ade354-772d-469d-b2d2-1e27044fa13d','4b903874-a95a-430a-a58e-1eeee4d14248','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',10884,1,'2025-09-07 06:34:59','2025-09-07 06:34:59'),('825abca2-4509-4b5e-b00d-8f9e415ccc87','2d43925b-32af-4080-b1d2-f42f3bfa8ab3','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',1941,1,'2025-09-07 06:27:59','2025-09-07 06:27:59'),('83027239-7a05-4b8c-af85-81a25e05ad30','aa9b3ff9-a867-4f9a-afce-00fc7e6ab0bc','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',6923,1,'2025-09-07 06:27:10','2025-09-07 06:27:10'),('8e74a862-f66f-41c7-9bde-8784615a004d','8f3b4cec-5d15-4a2a-9e7f-020026bd29d6','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',4998,1,'2025-09-07 06:33:11','2025-09-07 06:33:11'),('d0cfcb55-c17f-4f98-8404-141bc9dd2dc5','3e135802-038d-4896-805b-b5cebd29edba','Test Segment','Test user segment','{\"location\": \"US\", \"deviceType\": \"desktop\"}',2781,1,'2025-09-07 06:56:22','2025-09-07 06:56:22');
/*!40000 ALTER TABLE `ab_user_segments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ab_variants`
--

DROP TABLE IF EXISTS `ab_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ab_variants` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `experiment_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `variant_type` enum('control','treatment') NOT NULL,
  `traffic_percentage` decimal(5,2) DEFAULT '50.00',
  `configuration` json NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_experiment` (`experiment_id`),
  KEY `idx_type` (`variant_type`),
  CONSTRAINT `ab_variants_ibfk_1` FOREIGN KEY (`experiment_id`) REFERENCES `ab_experiments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ab_variants`
--

LOCK TABLES `ab_variants` WRITE;
/*!40000 ALTER TABLE `ab_variants` DISABLE KEYS */;
/*!40000 ALTER TABLE `ab_variants` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','settings.organization.update','Updated organization settings','127.0.0.1','axios/1.11.0','{\"updates\": [\"name\", \"timezone\", \"dateFormat\", \"language\"]}','2025-09-06 06:33:49'),(2,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','security.password.change','Password changed successfully','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:33:49'),(3,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','settings.preferences.update','Updated user preferences','127.0.0.1','axios/1.11.0','{\"updates\": [\"theme\", \"language\", \"notifications\", \"dashboardLayout\"]}','2025-09-06 06:33:49'),(4,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','security.2fa.enable','Started 2FA setup process','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:33:49'),(5,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:33:49'),(6,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:33:49'),(7,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:33:49'),(8,'bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:33:49'),(9,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','settings.organization.update','Updated organization settings','127.0.0.1','axios/1.11.0','{\"updates\": [\"name\", \"timezone\", \"dateFormat\", \"language\"]}','2025-09-06 06:36:53'),(10,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','security.password.change','Password changed successfully','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:36:53'),(11,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','settings.preferences.update','Updated user preferences','127.0.0.1','axios/1.11.0','{\"updates\": [\"theme\", \"language\", \"notifications\", \"dashboardLayout\"]}','2025-09-06 06:36:54'),(12,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','security.2fa.enable','Started 2FA setup process','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:36:54'),(13,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:36:54'),(14,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:36:54'),(15,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:36:54'),(16,'ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:36:54'),(17,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','settings.organization.update','Updated organization settings','127.0.0.1','axios/1.11.0','{\"updates\": [\"name\", \"timezone\", \"dateFormat\", \"language\"]}','2025-09-06 06:38:59'),(18,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','security.password.change','Password changed successfully','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:38:59'),(19,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','settings.preferences.update','Updated user preferences','127.0.0.1','axios/1.11.0','{\"updates\": [\"theme\", \"language\", \"notifications\", \"dashboardLayout\"]}','2025-09-06 06:38:59'),(20,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','security.2fa.enable','Started 2FA setup process','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:38:59'),(21,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:38:59'),(22,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:38:59'),(23,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:38:59'),(24,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:38:59'),(25,'464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','team.invitation.send','Sent invitation to invite_1757140739134@example.com with role viewer','127.0.0.1','axios/1.11.0','{\"role\": \"viewer\", \"email\": \"invite_1757140739134@example.com\", \"invitationId\": 0}','2025-09-06 06:38:59'),(26,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','settings.organization.update','Updated organization settings','127.0.0.1','axios/1.11.0','{\"updates\": [\"name\", \"timezone\", \"dateFormat\", \"language\"]}','2025-09-06 06:40:32'),(27,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','security.password.change','Password changed successfully','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:40:32'),(28,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','settings.preferences.update','Updated user preferences','127.0.0.1','axios/1.11.0','{\"updates\": [\"theme\", \"language\", \"notifications\", \"dashboardLayout\"]}','2025-09-06 06:40:32'),(29,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','security.2fa.enable','Started 2FA setup process','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:40:32'),(30,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:40:32'),(31,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:40:32'),(32,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:40:32'),(33,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:40:32'),(34,'af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','team.invitation.send','Sent invitation to invite_1757140832098@example.com with role viewer','127.0.0.1','axios/1.11.0','{\"role\": \"viewer\", \"email\": \"invite_1757140832098@example.com\", \"invitationId\": 2}','2025-09-06 06:40:32'),(35,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','settings.organization.update','Updated organization settings','127.0.0.1','axios/1.11.0','{\"updates\": [\"name\", \"timezone\", \"dateFormat\", \"language\"]}','2025-09-06 06:42:53'),(36,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','security.password.change','Password changed successfully','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:42:53'),(37,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','settings.preferences.update','Updated user preferences','127.0.0.1','axios/1.11.0','{\"updates\": [\"theme\", \"language\", \"notifications\", \"dashboardLayout\"]}','2025-09-06 06:42:53'),(38,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','security.2fa.enable','Started 2FA setup process','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:42:53'),(39,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:42:53'),(40,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:42:53'),(41,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:42:53'),(42,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:42:53'),(43,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','team.invitation.send','Sent invitation to invite_1757140972778@example.com with role viewer','127.0.0.1','axios/1.11.0','{\"role\": \"viewer\", \"email\": \"invite_1757140972778@example.com\", \"invitationId\": 3}','2025-09-06 06:42:53'),(44,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','team.invitation.resend','Resent invitation to invite_1757140972778@example.com','127.0.0.1','axios/1.11.0','{\"email\": \"invite_1757140972778@example.com\", \"invitationId\": \"3\"}','2025-09-06 06:42:53'),(45,'81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','team.invitation.cancel','Cancelled invitation to invite_1757140972778@example.com','127.0.0.1','axios/1.11.0','{\"email\": \"invite_1757140972778@example.com\", \"invitationId\": \"3\"}','2025-09-06 06:42:53'),(46,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','settings.organization.update','Updated organization settings','127.0.0.1','axios/1.11.0','{\"updates\": [\"name\", \"timezone\", \"dateFormat\", \"language\"]}','2025-09-06 06:50:59'),(47,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','security.password.change','Password changed successfully','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:51:00'),(48,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','settings.preferences.update','Updated user preferences','127.0.0.1','axios/1.11.0','{\"updates\": [\"theme\", \"language\", \"notifications\", \"dashboardLayout\"]}','2025-09-06 06:51:00'),(49,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','security.2fa.enable','Started 2FA setup process','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:51:00'),(50,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:51:00'),(51,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:51:00'),(52,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:51:00'),(53,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:51:00'),(54,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','team.invitation.send','Sent invitation to invite_1757141459533@example.com with role viewer','127.0.0.1','axios/1.11.0','{\"role\": \"viewer\", \"email\": \"invite_1757141459533@example.com\", \"invitationId\": 4}','2025-09-06 06:51:00'),(55,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','team.invitation.resend','Resent invitation to invite_1757141459533@example.com','127.0.0.1','axios/1.11.0','{\"email\": \"invite_1757141459533@example.com\", \"invitationId\": \"4\"}','2025-09-06 06:51:00'),(56,'c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','team.invitation.cancel','Cancelled invitation to invite_1757141459533@example.com','127.0.0.1','axios/1.11.0','{\"email\": \"invite_1757141459533@example.com\", \"invitationId\": \"4\"}','2025-09-06 06:51:00'),(57,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','settings.organization.update','Updated organization settings','127.0.0.1','axios/1.11.0','{\"updates\": [\"name\", \"timezone\", \"dateFormat\", \"language\"]}','2025-09-06 06:59:34'),(58,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','security.password.change','Password changed successfully','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:59:34'),(59,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','settings.preferences.update','Updated user preferences','127.0.0.1','axios/1.11.0','{\"updates\": [\"theme\", \"language\", \"notifications\", \"dashboardLayout\"]}','2025-09-06 06:59:34'),(60,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','security.2fa.enable','Started 2FA setup process','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:59:34'),(61,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:59:34'),(62,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:59:34'),(63,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:59:34'),(64,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','team.members.list','Viewed team members list','127.0.0.1','axios/1.11.0',NULL,'2025-09-06 06:59:34'),(65,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','team.invitation.send','Sent invitation to invite_1757141973871@example.com with role viewer','127.0.0.1','axios/1.11.0','{\"role\": \"viewer\", \"email\": \"invite_1757141973871@example.com\", \"invitationId\": 5}','2025-09-06 06:59:34'),(66,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','team.invitation.resend','Resent invitation to invite_1757141973871@example.com','127.0.0.1','axios/1.11.0','{\"email\": \"invite_1757141973871@example.com\", \"invitationId\": \"5\"}','2025-09-06 06:59:34'),(67,'29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','team.invitation.cancel','Cancelled invitation to invite_1757141973871@example.com','127.0.0.1','axios/1.11.0','{\"email\": \"invite_1757141973871@example.com\", \"invitationId\": \"5\"}','2025-09-06 06:59:34'),(68,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-08 16:42:12'),(69,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-08 16:50:34'),(70,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.preferences.update','Updated user preferences','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"theme\", \"compactMode\", \"animations\", \"language\", \"defaultView\", \"itemsPerPage\"]}','2025-09-08 16:56:28'),(71,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.organization.update','Updated organization settings','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"name\", \"website\", \"timezone\", \"language\", \"currency\", \"autoDataSync\", \"dataRetentionMonths\", \"defaultReportFormat\"]}','2025-09-10 16:32:35'),(72,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.organization.update','Updated organization settings','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"name\", \"website\", \"timezone\", \"language\", \"currency\", \"autoDataSync\", \"dataRetentionMonths\", \"defaultReportFormat\"]}','2025-09-10 16:48:20'),(73,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.organization.update','Updated organization settings','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"name\", \"website\", \"timezone\", \"language\", \"currency\", \"autoDataSync\", \"dataRetentionMonths\", \"defaultReportFormat\"]}','2025-09-10 16:54:26'),(74,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.preferences.update','Updated user preferences','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"theme\", \"compactMode\", \"animations\", \"language\", \"defaultView\", \"itemsPerPage\"]}','2025-09-10 16:54:39'),(75,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.preferences.update','Updated user preferences','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"theme\", \"compactMode\", \"animations\", \"language\", \"defaultView\", \"itemsPerPage\"]}','2025-09-10 16:55:03'),(76,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.organization.update','Updated organization settings','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"name\", \"website\", \"timezone\", \"language\", \"currency\", \"autoDataSync\", \"dataRetentionMonths\", \"defaultReportFormat\"]}','2025-09-10 16:55:14'),(77,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 16:55:42'),(78,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 16:55:53'),(79,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 16:55:57'),(80,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 16:56:40'),(81,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 17:00:25'),(82,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 17:02:28'),(83,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.invitation.send','Sent invitation to chester.kuo@gmail.com with role admin','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"role\": \"admin\", \"email\": \"chester.kuo@gmail.com\", \"invitationId\": 6}','2025-09-10 17:15:31'),(84,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 17:20:05'),(85,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-10 17:47:33'),(86,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.preferences.update','Updated user preferences','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"theme\", \"compactMode\", \"animations\", \"language\", \"defaultView\", \"itemsPerPage\"]}','2025-09-11 01:20:00'),(87,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','settings.preferences.update','Updated user preferences','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"updates\": [\"theme\", \"compactMode\", \"animations\", \"language\", \"defaultView\", \"itemsPerPage\"]}','2025-09-11 01:20:12'),(88,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-11 01:20:32'),(89,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.invitation.resend','Resent invitation to chester.kuo@gmail.com','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','{\"email\": \"chester.kuo@gmail.com\", \"invitationId\": \"6\"}','2025-09-11 01:20:55'),(90,'90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','team.members.list','Viewed team members list','10.8.74.135','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'2025-09-11 02:51:21');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `ai_tracking_results`
--

LOCK TABLES `ai_tracking_results` WRITE;
/*!40000 ALTER TABLE `ai_tracking_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_tracking_results` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `ai_tracking_results_archive`
--

LOCK TABLES `ai_tracking_results_archive` WRITE;
/*!40000 ALTER TABLE `ai_tracking_results_archive` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_tracking_results_archive` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `alert_configurations`
--

LOCK TABLES `alert_configurations` WRITE;
/*!40000 ALTER TABLE `alert_configurations` DISABLE KEYS */;
INSERT INTO `alert_configurations` VALUES ('272d471e-d084-4d18-a9e1-caa940c020b4','15a98c53-5bdc-49fd-bc36-a2c3b7d80a94','Test Alert 1757182919328','mention_spike','[{\"value\": 50, \"metric\": \"mention_count\", \"operator\": \"greater_than\", \"timeWindow\": \"1h\"}]',1,'2025-09-06 18:21:59','0635234c-e45b-4ddd-b08a-41ccc5e65764','Verification alert created at 2025-09-06T18:21:59.328Z','[\"email\"]',60,NULL,'2025-09-06 18:21:59');
/*!40000 ALTER TABLE `alert_configurations` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `alert_history`
--

LOCK TABLES `alert_history` WRITE;
/*!40000 ALTER TABLE `alert_history` DISABLE KEYS */;
INSERT INTO `alert_history` VALUES ('2831480a-c5cd-4fae-a401-7f7074d1a739','9330cbb1-b81f-4edf-91e3-ec4e09dcc216','9e827c28-36b7-48d1-af14-644bfbc7bef3','0c230066-2a6b-49ce-80a2-f45a10cb11c8','mention_spike','{\"metric\": \"mention_count\", \"threshold\": 10, \"currentValue\": 15.5, \"previousValue\": 0, \"changePercentage\": 0}','pending','[\"email\"]',NULL,'2025-09-06 14:04:56',NULL),('e5af670d-86f8-4aee-a62e-c5c6975fc87e','ecc7fe8a-5f89-4f96-b6dd-151fb6dc6d56','6bcb5fd7-c4ae-46e8-9a85-6a76e006e81f','77b5352d-e86c-4cbb-9f88-471d9f0effbc','mention_spike','{\"metric\": \"mention_count\", \"threshold\": 10, \"currentValue\": 15.5, \"previousValue\": 0, \"changePercentage\": 0}','pending','[\"email\"]',NULL,'2025-09-06 13:55:55',NULL);
/*!40000 ALTER TABLE `alert_history` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `analytics_snapshots`
--

LOCK TABLES `analytics_snapshots` WRITE;
/*!40000 ALTER TABLE `analytics_snapshots` DISABLE KEYS */;
INSERT INTO `analytics_snapshots` VALUES ('086005f6-cc10-4715-8a7f-5ed54cc7a42b','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-07 06:49:27','2025-09-07 06:49:27','2025-09-07 06:49:27'),('1d556810-995c-4939-82ff-f35c8e327c4d','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-07 06:53:12','2025-09-07 06:53:12','2025-09-07 06:53:12'),('2a68bd30-9645-46de-9da5-b68e2070828b','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-06 11:44:03','2025-09-06 11:44:03','2025-09-06 11:44:03'),('45496fe1-5c87-4ca2-927c-e33689bccb02','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-07 06:47:57','2025-09-07 06:47:57','2025-09-07 06:47:57'),('7b5cee41-60e8-45ca-a5b5-902b404651d4','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-06 12:15:21','2025-09-06 12:15:21','2025-09-06 12:15:21'),('98deecb4-645b-4a02-a0ed-04ad0f86aabf','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-06 11:43:40','2025-09-06 11:43:40','2025-09-06 11:43:40'),('abe1b14a-01a1-42ed-8faa-97746325ce01','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-06 12:05:27','2025-09-06 12:05:27','2025-09-06 12:05:27'),('addaf850-d4d6-42ba-8d51-53fc2627736c','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-06 12:08:13','2025-09-06 12:08:13','2025-09-06 12:08:13'),('e3e5401a-083b-441a-b98a-0c836f540429','b0a50730-02c4-4028-8d11-8ad4b033de80','764d5cbe-6a3d-42d5-a099-bfd002967a79','daily','{\"trendData\": {\"visibilityTrend\": \"stable\", \"changePercentage\": 0}, \"topKeywords\": [], \"totalMentions\": 0, \"averageRanking\": 0, \"aiVisibilityScore\": 0, \"platformBreakdown\": {}, \"competitorComparison\": {\"betterThan\": 0, \"marketPosition\": \"unknown\", \"totalCompetitors\": 0}}','2025-09-06 11:58:29','2025-09-06 11:58:29','2025-09-06 11:58:29');
/*!40000 ALTER TABLE `analytics_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automation_workflows`
--

DROP TABLE IF EXISTS `automation_workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automation_workflows` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `trigger_event` varchar(100) NOT NULL,
  `trigger_conditions` json DEFAULT NULL,
  `actions` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `is_active` tinyint(1) DEFAULT '1',
  `execution_count` int DEFAULT '0',
  `last_executed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_trigger` (`trigger_event`),
  KEY `idx_active` (`is_active`),
  KEY `idx_workflows_trigger_active` (`trigger_event`,`is_active`),
  CONSTRAINT `automation_workflows_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_workflows`
--

LOCK TABLES `automation_workflows` WRITE;
/*!40000 ALTER TABLE `automation_workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `automation_workflows` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `competitor_benchmarks`
--

LOCK TABLES `competitor_benchmarks` WRITE;
/*!40000 ALTER TABLE `competitor_benchmarks` DISABLE KEYS */;
/*!40000 ALTER TABLE `competitor_benchmarks` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `competitors`
--

LOCK TABLES `competitors` WRITE;
/*!40000 ALTER TABLE `competitors` DISABLE KEYS */;
INSERT INTO `competitors` VALUES ('33785f6a-6722-44ce-b3ce-1c3719d8856c','b0a50730-02c4-4028-8d11-8ad4b033de80','https://www.ygrgames.com/','www.ygrgames.com','https://www.ygrgames.com/',1,NULL,'2025-09-23 10:38:15','2025-09-23 10:38:15'),('fee11b48-fe3f-4bfa-ace6-5a3283e8dcee','8209b96f-2055-4b90-b62b-6000e7b94c85','https://www.ygrgames.com/','www.ygrgames.com','https://www.ygrgames.com/',1,NULL,'2025-09-23 11:31:28','2025-09-23 11:31:28');
/*!40000 ALTER TABLE `competitors` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `content`
--

LOCK TABLES `content` WRITE;
/*!40000 ALTER TABLE `content` DISABLE KEYS */;
/*!40000 ALTER TABLE `content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_performance_patterns`
--

DROP TABLE IF EXISTS `content_performance_patterns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content_performance_patterns` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `website_id` char(36) NOT NULL,
  `content_id` char(36) DEFAULT NULL,
  `pattern_type` enum('high_performer','low_performer','trending','declining') NOT NULL,
  `features` json NOT NULL,
  `performance_metrics` json NOT NULL,
  `time_period_days` int NOT NULL,
  `identified_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website_pattern` (`website_id`,`pattern_type`),
  KEY `idx_content` (`content_id`),
  KEY `idx_identified_at` (`identified_at`),
  CONSTRAINT `content_performance_patterns_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `content_performance_patterns_ibfk_2` FOREIGN KEY (`content_id`) REFERENCES `content` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_performance_patterns`
--

LOCK TABLES `content_performance_patterns` WRITE;
/*!40000 ALTER TABLE `content_performance_patterns` DISABLE KEYS */;
/*!40000 ALTER TABLE `content_performance_patterns` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `generated_reports`
--

LOCK TABLES `generated_reports` WRITE;
/*!40000 ALTER TABLE `generated_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `generated_reports` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `integration_settings`
--

LOCK TABLES `integration_settings` WRITE;
/*!40000 ALTER TABLE `integration_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `integration_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integration_usage_stats`
--

DROP TABLE IF EXISTS `integration_usage_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integration_usage_stats` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `integration_id` char(36) NOT NULL,
  `date` date NOT NULL,
  `api_calls` int DEFAULT '0',
  `successful_calls` int DEFAULT '0',
  `failed_calls` int DEFAULT '0',
  `data_transferred_mb` decimal(10,2) DEFAULT '0.00',
  `average_response_time_ms` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_integration_date` (`organization_id`,`integration_id`,`date`),
  KEY `idx_organization_date` (`organization_id`,`date`),
  KEY `idx_integration_date` (`integration_id`,`date`),
  CONSTRAINT `integration_usage_stats_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `integration_usage_stats_ibfk_2` FOREIGN KEY (`integration_id`) REFERENCES `third_party_integrations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integration_usage_stats`
--

LOCK TABLES `integration_usage_stats` WRITE;
/*!40000 ALTER TABLE `integration_usage_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `integration_usage_stats` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `integrations`
--

LOCK TABLES `integrations` WRITE;
/*!40000 ALTER TABLE `integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrations` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitations`
--

LOCK TABLES `invitations` WRITE;
/*!40000 ALTER TABLE `invitations` DISABLE KEYS */;
INSERT INTO `invitations` VALUES (1,'45459b41-614e-4dc1-aff2-f67d31f8dc60','invite_1757140739134@example.com','viewer','7fa7462014fd6e8a5fd747378979f524790364c618f8942316defccbd0fb82c4','2025-09-13 14:38:59','464b7b14-1cff-4348-af7e-9c1194991df7','Welcome to our test team!','pending','2025-09-06 06:38:59','2025-09-06 06:38:59'),(2,'240c75c1-d7ff-4364-888e-1948c4531d98','invite_1757140832098@example.com','viewer','a55b61ca40a550273ca2015d4d46867b3f3e321e2412e7d6ca174a6c9fbe6c8b','2025-09-13 14:40:32','af7640fb-fc37-49ef-8f52-b3cadca1f84e','Welcome to our test team!','pending','2025-09-06 06:40:32','2025-09-06 06:40:32'),(3,'9f6cc575-4f28-4ffb-bd59-da47d19b418d','invite_1757140972778@example.com','viewer','fed77d907afa8625683c8c3514bd60a799eeb417e20838a38362128fb1bc2a8d','2025-09-13 14:42:53','81215d27-2f2d-45fb-90ff-0c59163ec3fc','Welcome to our test team!','cancelled','2025-09-06 06:42:53','2025-09-06 06:42:53'),(4,'fa37d9e3-bba0-4db9-ae58-ffbd228a2045','invite_1757141459533@example.com','viewer','1a3b6f54a64856273b87e6ca604ec2e641a593b4fe526b1d6846e15ea7c945a1','2025-09-13 14:51:00','c149b961-9cf0-40b8-8b8f-7da623202148','Welcome to our test team!','cancelled','2025-09-06 06:51:00','2025-09-06 06:51:00'),(5,'3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','invite_1757141973871@example.com','viewer','cb89c3b78298f71058e618de81333b2430690be0a16d92c90693584858ed6032','2025-09-13 14:59:34','29c9680d-6958-4a6c-951d-069abd906d7b','Welcome to our test team!','cancelled','2025-09-06 06:59:34','2025-09-06 06:59:34'),(6,'b0a50730-02c4-4028-8d11-8ad4b033de80','chester.kuo@gmail.com','admin','14fcdbad5975741201dc6ca76f7853ebde889323c827032be895b05fec81721e','2025-09-18 09:20:55','90626a44-5d32-4704-a4ac-6e3cb71ef5ce','welcome','pending','2025-09-10 17:15:31','2025-09-11 01:20:55');
/*!40000 ALTER TABLE `invitations` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `keyword_rankings`
--

LOCK TABLES `keyword_rankings` WRITE;
/*!40000 ALTER TABLE `keyword_rankings` DISABLE KEYS */;
/*!40000 ALTER TABLE `keyword_rankings` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `keyword_research`
--

LOCK TABLES `keyword_research` WRITE;
/*!40000 ALTER TABLE `keyword_research` DISABLE KEYS */;
/*!40000 ALTER TABLE `keyword_research` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `keywords`
--

LOCK TABLES `keywords` WRITE;
/*!40000 ALTER TABLE `keywords` DISABLE KEYS */;
INSERT INTO `keywords` VALUES ('10645eae-b4bc-4139-b912-bc6c3178d586','54f95a97-8403-466f-bc98-8f1803452b09','ai optimization test',1000,45.50,2.50,'commercial','2025-09-08 15:53:16','2025-09-08 15:53:16'),('1e01d1d3-dcec-47d2-8755-4d7561b94307','25d494be-2ec4-415c-a7de-6fc4ead58005','test seo keyword',1000,25.50,1.50,'commercial','2025-09-11 00:46:04','2025-09-11 00:46:04'),('2fd1e358-45d6-4b2c-83a6-999e8ffb85ed','b0a50730-02c4-4028-8d11-8ad4b033de80','ygr games',NULL,NULL,NULL,'commercial','2025-09-23 10:38:10','2025-09-23 10:38:10'),('3dafd8d4-6213-4174-8e78-49e788c62d94','b04e30d1-e9ad-4f33-80e3-749331f1004f','test seo keyword',1000,25.50,1.50,'commercial','2025-09-11 00:33:20','2025-09-11 00:33:20'),('6754a13c-c2da-45ec-885b-1a9d7d115ee6','15a98c53-5bdc-49fd-bc36-a2c3b7d80a94','test-keyword-1757182918722',9018,48.00,3.16,'informational','2025-09-06 18:21:58','2025-09-06 18:21:58'),('6883874b-bbba-4d11-bf65-ea42e0dc24e3','d768b339-0831-4c3e-8024-7306a354a270','ai optimization test',1000,45.50,2.50,'commercial','2025-09-11 00:14:06','2025-09-11 00:14:06'),('6a4618bd-45b2-4b2e-83f8-828271f83557','7cb07309-d54a-401d-8643-c2c2a9236ac8','test seo keyword',1000,25.50,1.50,'commercial','2025-09-11 00:38:07','2025-09-11 00:38:07'),('a2e15650-82b5-476b-90be-f989b104b60f','8209b96f-2055-4b90-b62b-6000e7b94c85','ygr games',NULL,NULL,NULL,'commercial','2025-09-23 11:31:20','2025-09-23 11:31:20'),('a2e70f8a-a14b-427d-81d1-7e0dba55575a','0a8444ea-0981-4648-af15-3a722545d2b8','test seo keyword',1000,25.50,1.50,'commercial','2025-09-11 00:49:18','2025-09-11 00:49:18'),('acc2fc04-68e0-4242-9bfc-ee74c2b720e0','7461f0c7-7aca-402f-baf0-1f316827d9a9','ai optimization test',1000,45.50,2.50,'commercial','2025-09-08 15:53:22','2025-09-08 15:53:22'),('bd87d1e0-7f9a-4e14-bd17-83cec7806298','fbb9753d-4f22-4e6f-b0b2-5b85a681c5c7','test seo keyword',1000,25.50,1.50,'commercial','2025-09-11 00:37:00','2025-09-11 00:37:00'),('c4cc08ab-7342-45f0-a42a-89d976f9e48d','470932b6-f68e-41b5-9908-e1cd68604fbf','ai optimization test',1000,45.50,2.50,'commercial','2025-09-11 00:51:13','2025-09-11 00:51:13'),('d2da0ff4-ccdf-441d-8f33-cf16f2889968','4350d885-7186-40f5-94be-0f19d1a5e159','test seo keyword',1000,25.50,1.50,'commercial','2025-09-11 00:47:29','2025-09-11 00:47:29'),('d50d655f-7dcb-40df-be0d-cada958a3d5a','7736ac05-edd2-4e1c-ad1b-45ecdfce9473','test seo keyword',1000,25.50,1.50,'commercial','2025-09-11 00:35:25','2025-09-11 00:35:25');
/*!40000 ALTER TABLE `keywords` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `metrics_snapshots`
--

LOCK TABLES `metrics_snapshots` WRITE;
/*!40000 ALTER TABLE `metrics_snapshots` DISABLE KEYS */;
INSERT INTO `metrics_snapshots` VALUES ('4b661686-82d2-4ecb-b4aa-fee5723907f8','b78fe594-3193-456d-a02c-543cec76fd93','008eafe6-2701-411d-9f65-ad2c2e669414','mention_count','all','1d',15.5000,NULL,NULL,'2025-09-06 13:39:47'),('6a278886-f4e6-4f5a-a0f0-0245582bff10','ff170e07-c99f-446f-a941-275380ecc4c3','faff036c-7ea1-455c-bc45-4f6301cf144e','mention_count','all','1d',15.5000,NULL,NULL,'2025-09-06 13:06:55'),('8bde0711-94ee-4072-befe-fd47c78d5c89','f8567f0e-b5fe-4ecd-94b0-5df6943e78c0','2818afb7-8119-4b52-8520-cdef794e9c8c','mention_count','all','1d',15.5000,NULL,NULL,'2025-09-06 13:48:34'),('a24256ef-34bc-4e4a-980d-34d486ba672f','6bcb5fd7-c4ae-46e8-9a85-6a76e006e81f','77b5352d-e86c-4cbb-9f88-471d9f0effbc','mention_count','all','1d',15.5000,NULL,NULL,'2025-09-06 13:55:55'),('ecaea679-be99-463b-b18c-091f14298ee5','9e827c28-36b7-48d1-af14-644bfbc7bef3','0c230066-2a6b-49ce-80a2-f45a10cb11c8','mention_count','all','1d',15.5000,NULL,NULL,'2025-09-06 14:04:56'),('ecb6fc59-6a73-4828-8379-e42d49cb8f38','47ce3765-9c1d-41d6-bebb-c4dc799ccc53','7601e239-e421-4086-9905-27f155830a21','mention_count','all','1d',15.5000,NULL,NULL,'2025-09-06 13:43:25'),('fdff2c82-93d2-4661-8967-d86ffbb0e670','4d7c851a-2b46-49f4-800d-e1c3f3655f3f','825d3f4f-c5c3-4ad0-b30b-bdf6ec1e35d4','mention_count','all','1d',15.5000,NULL,NULL,'2025-09-06 13:53:44');
/*!40000 ALTER TABLE `metrics_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ml_models`
--

DROP TABLE IF EXISTS `ml_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ml_models` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `model_type` enum('content_optimization','competitor_analysis','keyword_prediction','trend_forecast') NOT NULL,
  `version` varchar(50) NOT NULL,
  `algorithm` varchar(100) NOT NULL,
  `training_data_size` int DEFAULT '0',
  `accuracy_score` decimal(5,4) DEFAULT NULL,
  `precision_score` decimal(5,4) DEFAULT NULL,
  `recall_score` decimal(5,4) DEFAULT NULL,
  `f1_score` decimal(5,4) DEFAULT NULL,
  `model_file_path` varchar(500) DEFAULT NULL,
  `hyperparameters` json DEFAULT NULL,
  `feature_weights` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `trained_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_model_version` (`name`,`version`),
  KEY `idx_type_active` (`model_type`,`is_active`),
  KEY `idx_accuracy` (`accuracy_score` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ml_models`
--

LOCK TABLES `ml_models` WRITE;
/*!40000 ALTER TABLE `ml_models` DISABLE KEYS */;
INSERT INTO `ml_models` VALUES ('843c3e91-8b50-11f0-b652-000c292a4471','ContentOptimizer','content_optimization','1.0','Random Forest',0,NULL,NULL,NULL,NULL,NULL,'{\"max_depth\": 10, \"n_estimators\": 100, \"random_state\": 42}',NULL,1,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18'),('843c4246-8b50-11f0-b652-000c292a4471','CompetitorAnalyzer','competitor_analysis','1.0','Gradient Boosting',0,NULL,NULL,NULL,NULL,NULL,'{\"max_depth\": 8, \"n_estimators\": 200, \"learning_rate\": 0.1}',NULL,1,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18'),('843c445d-8b50-11f0-b652-000c292a4471','KeywordPredictor','keyword_prediction','1.0','Neural Network',0,NULL,NULL,NULL,NULL,NULL,'{\"activation\": \"relu\", \"dropout_rate\": 0.3, \"hidden_layers\": [128, 64, 32]}',NULL,1,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18'),('843c45e6-8b50-11f0-b652-000c292a4471','TrendForecaster','trend_forecast','1.0','LSTM',0,NULL,NULL,NULL,NULL,NULL,'{\"epochs\": 100, \"lstm_units\": 50, \"sequence_length\": 30}',NULL,1,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18');
/*!40000 ALTER TABLE `ml_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ml_optimization_suggestions`
--

DROP TABLE IF EXISTS `ml_optimization_suggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ml_optimization_suggestions` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `website_id` char(36) NOT NULL,
  `model_id` char(36) NOT NULL,
  `suggestion_type` enum('content','technical','ai_visibility','keyword_strategy','competitor_gap') NOT NULL,
  `confidence_score` decimal(5,4) NOT NULL,
  `priority_score` decimal(5,4) NOT NULL,
  `estimated_impact` json NOT NULL,
  `suggestion_data` json NOT NULL,
  `implementation_difficulty` enum('easy','medium','hard') NOT NULL,
  `estimated_time_hours` int DEFAULT NULL,
  `status` enum('new','reviewing','accepted','implemented','rejected') DEFAULT 'new',
  `feedback` text,
  `implemented_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_website` (`organization_id`,`website_id`),
  KEY `idx_model_type` (`model_id`,`suggestion_type`),
  KEY `idx_confidence_priority` (`confidence_score` DESC,`priority_score` DESC),
  KEY `idx_status` (`status`),
  KEY `ml_optimization_suggestions_ibfk_2` (`website_id`),
  CONSTRAINT `ml_optimization_suggestions_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ml_optimization_suggestions_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ml_optimization_suggestions_ibfk_3` FOREIGN KEY (`model_id`) REFERENCES `ml_models` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ml_optimization_suggestions`
--

LOCK TABLES `ml_optimization_suggestions` WRITE;
/*!40000 ALTER TABLE `ml_optimization_suggestions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ml_optimization_suggestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ml_suggestion_feedback`
--

DROP TABLE IF EXISTS `ml_suggestion_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ml_suggestion_feedback` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `suggestion_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `feedback_type` enum('helpful','not_helpful','implemented','rejected') NOT NULL,
  `rating` int DEFAULT NULL,
  `comment` text,
  `implementation_result` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_suggestion` (`suggestion_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_feedback_type` (`feedback_type`),
  CONSTRAINT `ml_suggestion_feedback_ibfk_1` FOREIGN KEY (`suggestion_id`) REFERENCES `ml_optimization_suggestions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ml_suggestion_feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ml_suggestion_feedback_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ml_suggestion_feedback`
--

LOCK TABLES `ml_suggestion_feedback` WRITE;
/*!40000 ALTER TABLE `ml_suggestion_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `ml_suggestion_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ml_training_data`
--

DROP TABLE IF EXISTS `ml_training_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ml_training_data` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `model_id` char(36) NOT NULL,
  `data_type` enum('feature_vector','label','metadata') NOT NULL,
  `source_entity_type` varchar(50) NOT NULL,
  `source_entity_id` char(36) NOT NULL,
  `feature_data` json NOT NULL,
  `label_value` decimal(10,6) DEFAULT NULL,
  `weight` decimal(8,6) DEFAULT '1.000000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_model_type` (`model_id`,`data_type`),
  KEY `idx_source_entity` (`source_entity_type`,`source_entity_id`),
  CONSTRAINT `ml_training_data_ibfk_1` FOREIGN KEY (`model_id`) REFERENCES `ml_models` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ml_training_data`
--

LOCK TABLES `ml_training_data` WRITE;
/*!40000 ALTER TABLE `ml_training_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `ml_training_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ml_training_jobs`
--

DROP TABLE IF EXISTS `ml_training_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ml_training_jobs` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `model_id` char(36) NOT NULL,
  `job_type` enum('initial_training','retraining','incremental_update') NOT NULL,
  `training_config` json NOT NULL,
  `status` enum('queued','running','completed','failed') DEFAULT 'queued',
  `progress_percentage` decimal(5,2) DEFAULT '0.00',
  `training_metrics` json DEFAULT NULL,
  `error_message` text,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_model_status` (`model_id`,`status`),
  KEY `idx_job_type` (`job_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `ml_training_jobs_ibfk_1` FOREIGN KEY (`model_id`) REFERENCES `ml_models` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ml_training_jobs`
--

LOCK TABLES `ml_training_jobs` WRITE;
/*!40000 ALTER TABLE `ml_training_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ml_training_jobs` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `optimization_strategy_templates`
--

DROP TABLE IF EXISTS `optimization_strategy_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `optimization_strategy_templates` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `category` enum('content','technical','seo','ai_visibility') NOT NULL,
  `description` text,
  `template_config` json NOT NULL,
  `success_metrics` json NOT NULL,
  `estimated_impact` json DEFAULT NULL,
  `difficulty_level` enum('easy','medium','hard') NOT NULL,
  `is_public` tinyint(1) DEFAULT '1',
  `usage_count` int DEFAULT '0',
  `average_success_rate` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_difficulty` (`difficulty_level`),
  KEY `idx_public` (`is_public`),
  KEY `idx_success_rate` (`average_success_rate` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `optimization_strategy_templates`
--

LOCK TABLES `optimization_strategy_templates` WRITE;
/*!40000 ALTER TABLE `optimization_strategy_templates` DISABLE KEYS */;
INSERT INTO `optimization_strategy_templates` VALUES ('845b269a-8b50-11f0-b652-000c292a4471','Meta Description Optimization','seo','A/B test different meta descriptions to improve click-through rates','{\"metrics\": [\"ctr\", \"impressions\"], \"variations\": [\"original\", \"benefit_focused\", \"question_based\"]}','[\"click_through_rate\", \"organic_impressions\"]',NULL,'easy',1,0,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18'),('845b2b47-8b50-11f0-b652-000c292a4471','H1 Title Optimization','content','Test different H1 titles for improved engagement and SEO performance','{\"metrics\": [\"engagement\", \"bounce_rate\"], \"variations\": [\"keyword_focused\", \"benefit_focused\", \"emotional\"]}','[\"time_on_page\", \"bounce_rate\", \"geo_score\"]',NULL,'easy',1,0,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18'),('845b2f03-8b50-11f0-b652-000c292a4471','Schema Markup Implementation','technical','Compare pages with and without structured data implementation','{\"metrics\": [\"visibility\", \"ctr\"], \"variations\": [\"no_schema\", \"basic_schema\", \"rich_schema\"]}','[\"ai_visibility_score\", \"featured_snippets\", \"click_through_rate\"]',NULL,'medium',1,0,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18'),('845b309b-8b50-11f0-b652-000c292a4471','AI-Optimized Content Structure','ai_visibility','Test different content structures optimized for AI search engines','{\"metrics\": [\"ai_mentions\", \"visibility\"], \"variations\": [\"traditional\", \"faq_enhanced\", \"ai_optimized\"]}','[\"ai_mention_frequency\", \"visibility_score\", \"citation_rate\"]',NULL,'hard',1,0,NULL,'2025-09-06 18:37:18','2025-09-06 18:37:18');
/*!40000 ALTER TABLE `optimization_strategy_templates` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `optimization_tasks`
--

LOCK TABLES `optimization_tasks` WRITE;
/*!40000 ALTER TABLE `optimization_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `optimization_tasks` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `organization_settings`
--

LOCK TABLES `organization_settings` WRITE;
/*!40000 ALTER TABLE `organization_settings` DISABLE KEYS */;
INSERT INTO `organization_settings` VALUES ('00c5f985-8caa-4aec-9719-565530aa0513','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('05c02e6d-321a-44a6-a2a3-efca3e7603fa','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('13ebd03d-be1a-44b2-b809-ddae4ffdda40','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('16f13c9c-18d6-4728-9b6f-687eddbdbd08','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('19334578-e269-4962-b0f1-d57dff32a367','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('1e0af5b2-f15d-4a53-866e-254db4057189','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('240c75c1-d7ff-4364-888e-1948c4531d98','{\"name\": \"Updated Test Organization\", \"website\": null, \"currency\": \"TWD\", \"language\": \"en\", \"timezone\": \"America/New_York\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:40:32','2025-09-06 06:40:32'),('24b45569-f971-4545-a9ff-0f24a96124d3','{\"name\": \"Gemini Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','{\"name\": \"Updated Test Organization\", \"website\": null, \"currency\": \"TWD\", \"language\": \"en\", \"timezone\": \"America/New_York\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:59:34','2025-09-06 06:59:34'),('36d3cabf-67c0-4bee-9d2c-f29940ca664f','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('379fdae6-a56f-47a9-a1e1-9eb685c6829c','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('4300d634-7682-415e-8fb5-9f2ef182f81c','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('43b6d36e-0626-4579-ac4d-c0ba059a7f61','{\"name\": \"Test Organization\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('43d3437e-dbdb-41a8-9af8-af3decca11b0','{\"name\": \"Gemini Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('45459b41-614e-4dc1-aff2-f67d31f8dc60','{\"name\": \"Updated Test Organization\", \"website\": null, \"currency\": \"TWD\", \"language\": \"en\", \"timezone\": \"America/New_York\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:38:59','2025-09-06 06:38:59'),('45c5b7b6-b455-433a-9f09-d2f703b54f6f','{\"name\": \"測試公司\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('48131a8f-a392-48b8-99b5-b3ca860d272f','{\"name\": \"Team Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('5c7abf6d-f042-427f-9596-5b1334456284','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('5cbe0a3c-88ef-11f0-b652-000c292a4471','{\"name\": \"Default Organization\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('60cbfdb3-5682-4d7d-b667-43a50bc7a0b9','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('6516c31c-abb0-4ebf-992b-559ce64a4c1e','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('700d5529-2fbe-4194-88e7-3320bab0f249','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('703dd915-ca93-414c-8b60-d0ee57310140','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('70cb1b1f-39ce-41d6-8e2c-a581b2059ffc','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('83beb62b-13db-4f34-8c38-8c908c6254ef','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('84b192cf-d346-4341-a91b-23ece0dde801','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('85d0177d-e089-4a64-9622-bfe8723a4413','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('8b84d4ce-c647-406d-880b-a7f2826b6a03','{\"name\": \"Updated Test Organization\", \"website\": null, \"currency\": \"TWD\", \"language\": \"en\", \"timezone\": \"America/New_York\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:36:53','2025-09-06 06:36:53'),('8f02b73b-c82f-4543-b1e2-d1e0bf3991e8','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('9471d616-1b40-41c7-9cd3-92f8ebaf505d','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('9bb441cb-e308-4d59-89b9-11f2d0c81f1a','{\"name\": \"測試公司\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('9cedfefc-613d-48e5-8c0b-a85c21836882','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('9d61634a-e20d-4b4c-a7ca-389f60eb744e','{\"name\": \"Test Organization\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('9f05e49a-4388-4ff6-90a6-58a5c55ef03f','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('9f6cc575-4f28-4ffb-bd59-da47d19b418d','{\"name\": \"Updated Test Organization\", \"website\": null, \"currency\": \"TWD\", \"language\": \"en\", \"timezone\": \"America/New_York\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:42:53','2025-09-06 06:42:53'),('a81bde18-ec4a-4f15-8910-97edafebc723','{\"name\": \"Team Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('b0a50730-02c4-4028-8d11-8ad4b033de80','{\"name\": \"Blitzgame\", \"website\": \"https://blitzgame.app\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-10 16:55:14'),('b93664af-42b4-4efe-af44-b906fc556446','{\"name\": \"Updated Test Organization\", \"website\": null, \"currency\": \"TWD\", \"language\": \"en\", \"timezone\": \"America/New_York\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:33:49','2025-09-06 06:33:49'),('be571007-aa78-48a1-9178-00113255dc10','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('be75c6bb-8896-4e80-af31-f51d333ef100','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('c2af9065-226d-47b0-bbc8-4962f50a640d','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('c9d565e7-01a3-486b-99a1-9c2f8cde4e00','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('ce638fcf-cde0-4c6e-89a4-0acc4d620cb0','{\"name\": \"Team Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('d3e4ec9a-8b35-4d4c-89e5-22a0aacc9a2b','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('d5f31059-58df-4992-b7a7-5997f8d8e6e2','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('dbf73d35-123c-4794-80e1-4309d741a14d','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('deb0b9ca-6b02-47a5-a187-2123413ebc9a','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('dfdff618-2f0b-414d-bcee-2156241b6bc2','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('e7d33256-71d7-48cf-b817-7c2086d3b23a','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('e897630b-ce74-4ca9-b167-2e664c2a94b4','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('e962f076-a039-4337-8043-ffe5072e3f93','{\"name\": \"Team Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('edef9495-5f4c-4201-b87f-6b74e8199ec9','{\"name\": \"Test Co\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('fa37d9e3-bba0-4db9-ae58-ffbd228a2045','{\"name\": \"Updated Test Organization\", \"website\": null, \"currency\": \"TWD\", \"language\": \"en\", \"timezone\": \"America/New_York\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:50:59','2025-09-06 06:50:59'),('fea653e4-74c1-4aa7-ac7c-6301cd4c53de','{\"name\": \"Test Company\", \"currency\": \"TWD\", \"language\": \"zh-TW\", \"timezone\": \"Asia/Taipei\"}','{\"autoDataSync\": true, \"dataRetentionMonths\": 12, \"defaultReportFormat\": \"pdf\"}','2025-09-06 06:01:15','2025-09-06 06:01:15');
/*!40000 ALTER TABLE `organization_settings` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES ('00c5f985-8caa-4aec-9719-565530aa0513','Test Company',NULL,'testcompany5395','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:17:05','2025-09-03 18:17:05'),('0333eda6-fd27-4a6c-8ff1-67e604fb53c3','Test Organization',NULL,'testorganization5652','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:01:25','2025-09-06 06:01:25'),('05c02e6d-321a-44a6-a2a3-efca3e7603fa','Test Company',NULL,'testcompany3744','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:19:53','2025-09-03 18:19:53'),('0a8444ea-0981-4648-af15-3a722545d2b8','Keywords Test Company',NULL,'keywordstestcompany8807','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:49:18','2025-09-11 00:49:18'),('0bbd60f2-957d-490c-ade1-9d56b4efa3d2','Test Organization',NULL,'testorganization4923','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:59:34','2025-09-06 06:59:34'),('0fb3020f-3e76-4ecf-a219-b06ac8ae8ec3','Debug Company',NULL,'debugcompany9736','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:36:59','2025-09-07 06:36:59'),('11c744dd-2972-4543-ba27-757722097880','Phase 3 Complete Testing',NULL,'phase3completetesting6673','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:05:46','2025-09-07 06:05:46'),('13ebd03d-be1a-44b2-b809-ddae4ffdda40','Test Company',NULL,'testcompany6436','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:18:56','2025-09-03 18:18:56'),('15a98c53-5bdc-49fd-bc36-a2c3b7d80a94','Test Verification Company',NULL,'testverificationcompany7539','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:21:57','2025-09-06 18:21:57'),('16f13c9c-18d6-4728-9b6f-687eddbdbd08','Test Company',NULL,'testcompany5313','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 17:35:35','2025-09-04 17:35:35'),('181d6bce-e424-42f5-8965-ec4add0972c5','Analytics Test Company',NULL,'analyticstestcompany7104','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:49:27','2025-09-07 06:49:27'),('19334578-e269-4962-b0f1-d57dff32a367','Test Company',NULL,'testcompany6461','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 14:55:46','2025-09-04 14:55:46'),('19f5e1b5-65ce-4a7a-9838-2c7c9640eac6','Test Company',NULL,'testcompany5157','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 12:26:45','2025-09-06 12:26:45'),('1a8add54-9e40-48b7-8022-62edc0586d1c','Test Organization',NULL,'testorganization4334','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:36:54','2025-09-06 06:36:54'),('1d69dd19-d609-4828-bd3f-4845c1ed17c6','Test Organization',NULL,'testorganization0532','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:51:00','2025-09-06 06:51:00'),('1e0af5b2-f15d-4a53-866e-254db4057189','Test Company',NULL,'testcompany5600','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:22:05','2025-09-03 18:22:05'),('23faa13a-ec60-4054-8169-070ea49588f8','Test Organization',NULL,'testorganization9687','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:33:49','2025-09-06 06:33:49'),('240c75c1-d7ff-4364-888e-1948c4531d98','Updated Test Organization',NULL,'testorganization2161','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:40:32','2025-09-06 06:40:32'),('24b45569-f971-4545-a9ff-0f24a96124d3','Gemini Test Company',NULL,'geminitestcompany0959','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 17:06:20','2025-09-05 17:06:20'),('25d494be-2ec4-415c-a7de-6fc4ead58005','Keywords Test Company',NULL,'keywordstestcompany4429','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:46:04','2025-09-11 00:46:04'),('2d43925b-32af-4080-b1d2-f42f3bfa8ab3','Phase 3 Complete Testing',NULL,'phase3completetesting8841','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:27:58','2025-09-07 06:27:58'),('2d762e9a-cb46-4d76-a71a-02f3b43c8075','Test Verification Company',NULL,'testverificationcompany4852','free',99,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:16:44','2025-09-06 18:16:47'),('2df8b135-c364-4dd4-8635-994f3bf9434b','Alert Dashboard Company',NULL,'alertdashboardcompany6205','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:17:46','2025-09-06 11:17:46'),('2ea67652-5682-40c9-b02b-6714ad110b7a','Analytics Test Company',NULL,'analyticstestcompany2679','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 12:05:22','2025-09-06 12:05:22'),('2ef8d08a-ec59-473d-8c8b-dfac906c3b18','Alert Dashboard Company',NULL,'alertdashboardcompany9005','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:03:09','2025-09-06 11:03:09'),('30dce324-cd9e-4110-9ac6-c4b5a613462e','Analytics Test Company',NULL,'analyticstestcompany4099','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:58:24','2025-09-06 11:58:24'),('33ec2916-a81d-4c25-91fe-beb59a3a4e4a','Test Organization',NULL,'testorganization2333','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:25:02','2025-09-06 06:25:02'),('3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','Updated Test Organization',NULL,'testorganization3970','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:59:33','2025-09-06 06:59:34'),('36d3cabf-67c0-4bee-9d2c-f29940ca664f','Test Company',NULL,'testcompany1938','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 17:47:01','2025-09-05 17:47:01'),('379fdae6-a56f-47a9-a1e1-9eb685c6829c','Test Company',NULL,'testcompany4634','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 16:56:24','2025-09-05 16:56:24'),('3bbc0c65-0ac5-4455-9b8f-04c13c22d2f0','Alert Test Company',NULL,'alerttestcompany9216','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:09:09','2025-09-06 11:09:09'),('3c063da7-fad1-4cee-9761-bdfc80f93862','Alert Test Company',NULL,'alerttestcompany2867','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:09:22','2025-09-06 11:09:22'),('3e135802-038d-4896-805b-b5cebd29edba','Phase 3 Complete Testing',NULL,'phase3completetesting1883','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:56:21','2025-09-07 06:56:21'),('3e70d8f1-c13c-4817-9157-f0dc556d2ecc','Alert Dashboard Company',NULL,'alertdashboardcompany3724','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:12:33','2025-09-06 11:12:33'),('4300d634-7682-415e-8fb5-9f2ef182f81c','Test Company',NULL,'testcompany9524','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:19:39','2025-09-03 18:19:39'),('4350d885-7186-40f5-94be-0f19d1a5e159','Keywords Test Company',NULL,'keywordstestcompany9668','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:47:29','2025-09-11 00:47:29'),('43b6d36e-0626-4579-ac4d-c0ba059a7f61','Test Organization',NULL,'testorganization3244','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 05:54:33','2025-09-06 05:54:33'),('43d3437e-dbdb-41a8-9af8-af3decca11b0','Gemini Test Company',NULL,'geminitestcompany8741','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 17:06:48','2025-09-05 17:06:48'),('45459b41-614e-4dc1-aff2-f67d31f8dc60','Updated Test Organization',NULL,'testorganization9199','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:38:59','2025-09-06 06:38:59'),('458fad51-9d00-4903-a676-50460532c5a6','Debug Company',NULL,'debugcompany1754','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:36:11','2025-09-07 06:36:11'),('45c5b7b6-b455-433a-9f09-d2f703b54f6f','測試公司',NULL,'0252','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:17:10','2025-09-03 18:17:10'),('470932b6-f68e-41b5-9908-e1cd68604fbf','Test Company',NULL,'testcompany1920','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:51:11','2025-09-11 00:51:11'),('47ce3765-9c1d-41d6-bebb-c4dc799ccc53','Phase 2.3 Test User\'s Organization',NULL,'phase23testuser5418','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 13:43:25','2025-09-06 13:43:25'),('48131a8f-a392-48b8-99b5-b3ca860d272f','Team Test Company',NULL,'teamtestcompany6878','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 19:09:56','2025-09-05 19:09:56'),('483185f2-24f7-44bc-8492-40cd63650f89','Phase 3 Testing Company',NULL,'phase3testingcompany5537','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 05:36:35','2025-09-07 05:36:35'),('4b903874-a95a-430a-a58e-1eeee4d14248','Phase 3 Complete Testing',NULL,'phase3completetesting9331','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:34:59','2025-09-07 06:34:59'),('4d7c851a-2b46-49f4-800d-e1c3f3655f3f','Phase 2.3 Test User\'s Organization',NULL,'phase23testuser4211','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 13:53:44','2025-09-06 13:53:44'),('4f8be47e-648d-453e-9452-cd716de98377','Alert Dashboard Company',NULL,'alertdashboardcompany1435','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:14:31','2025-09-06 11:14:31'),('54f95a97-8403-466f-bc98-8f1803452b09','Test Company',NULL,'testcompany4826','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-08 15:53:14','2025-09-08 15:53:14'),('5842a90e-cfcc-441f-ac14-986d60bb5d6d','Phase 3 Complete Testing',NULL,'phase3completetesting7567','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:29:37','2025-09-07 06:29:37'),('5849c106-fccf-4df8-bfa0-67c1cac76cd1','Test Organization',NULL,'testorganization3798','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:42:53','2025-09-06 06:42:53'),('5adcdf92-2c59-4bfd-ab54-ad57117a21aa','Analytics Test Company',NULL,'analyticstestcompany8711','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:43:38','2025-09-06 11:43:38'),('5b830272-cfe7-4aca-9410-380257662cea','Alert Dashboard Company',NULL,'alertdashboardcompany2711','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:09:02','2025-09-06 11:09:02'),('5c7abf6d-f042-427f-9596-5b1334456284','Test Company',NULL,'testcompany7327','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 17:44:07','2025-09-05 17:44:07'),('5cba89ce-0cb3-4de6-b049-3a656fd1d90b','Test Verification Company',NULL,'testverificationcompany0587','free',99,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:27:10','2025-09-06 18:27:14'),('5cbe0a3c-88ef-11f0-b652-000c292a4471','Default Organization',NULL,'default','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 17:56:48','2025-09-03 17:56:48'),('60cbfdb3-5682-4d7d-b667-43a50bc7a0b9','Test Company',NULL,'testcompany7892','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:29:17','2025-09-03 18:29:17'),('6516c31c-abb0-4ebf-992b-559ce64a4c1e','Test Company',NULL,'testcompany4171','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:28:44','2025-09-03 18:28:44'),('6bcb5fd7-c4ae-46e8-9a85-6a76e006e81f','Phase 2.3 Test User\'s Organization',NULL,'phase23testuser5229','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 13:55:55','2025-09-06 13:55:55'),('6ef04076-e8f8-4651-9284-a971b7dd3830','Debug Company',NULL,'debugcompany9824','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:37:19','2025-09-07 06:37:19'),('700d5529-2fbe-4194-88e7-3320bab0f249','Test Company',NULL,'testcompany2482','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:12:02','2025-09-03 18:12:02'),('703dd915-ca93-414c-8b60-d0ee57310140','Test Company',NULL,'testcompany0924','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:19:00','2025-09-03 18:19:00'),('70cb1b1f-39ce-41d6-8e2c-a581b2059ffc','Test Company',NULL,'testcompany1412','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:09:31','2025-09-03 18:09:31'),('715c0d5d-b373-46e5-b34c-dd90cdf464fd','Test User\'s Organization',NULL,'testuser4540','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 14:03:14','2025-09-06 14:03:14'),('741defbb-7ac3-496f-9ee7-c1cf634fb755','Analytics Test Company',NULL,'analyticstestcompany3239','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:44:03','2025-09-06 11:44:03'),('7461f0c7-7aca-402f-baf0-1f316827d9a9','Test Company',NULL,'testcompany1127','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-08 15:53:21','2025-09-08 15:53:21'),('76753607-8159-4387-ad20-c2b25bc3b9fd','Test Verification Company',NULL,'testverificationcompany8734','free',99,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:13:18','2025-09-06 18:13:21'),('7736ac05-edd2-4e1c-ad1b-45ecdfce9473','Keywords Test Company',NULL,'keywordstestcompany5395','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:35:25','2025-09-11 00:35:25'),('777f4666-ebf8-4d4c-ac29-dd83cceef52e','Test Verification Company',NULL,'testverificationcompany8975','free',99,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:17:18','2025-09-06 18:17:21'),('7cb07309-d54a-401d-8643-c2c2a9236ac8','Keywords Test Company',NULL,'keywordstestcompany7142','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:38:07','2025-09-11 00:38:07'),('7f21f5f7-ec60-43ba-a7f5-94ab25da5130','Analytics Test Company',NULL,'analyticstestcompany8376','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 12:08:08','2025-09-06 12:08:08'),('7f24b33b-cf82-4c62-833f-863cc148d806','Phase 3 Complete Testing',NULL,'phase3completetesting6041','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:31:46','2025-09-07 06:31:46'),('8209b96f-2055-4b90-b62b-6000e7b94c85','Test Company',NULL,'testcompany5701','free',99,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:58:35','2025-09-23 15:30:55'),('83beb62b-13db-4f34-8c38-8c908c6254ef','Test Company',NULL,'testcompany7242','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 07:47:17','2025-09-04 07:47:17'),('84b192cf-d346-4341-a91b-23ece0dde801','Test Company',NULL,'testcompany5663','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:20:15','2025-09-03 18:20:15'),('858b5266-95aa-4659-a311-f9908e07d54e','Test Organization',NULL,'testorganization5163','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:01:25','2025-09-06 06:01:25'),('85d0177d-e089-4a64-9622-bfe8723a4413','Test Company',NULL,'testcompany4364','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:08:24','2025-09-03 18:08:24'),('8b84d4ce-c647-406d-880b-a7f2826b6a03','Updated Test Organization',NULL,'testorganization3475','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:36:53','2025-09-06 06:36:53'),('8f02b73b-c82f-4543-b1e2-d1e0bf3991e8','Test Company',NULL,'testcompany3453','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 07:45:43','2025-09-04 07:45:43'),('8f3b4cec-5d15-4a2a-9e7f-020026bd29d6','Phase 3 Complete Testing',NULL,'phase3completetesting1088','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:33:11','2025-09-07 06:33:11'),('9471d616-1b40-41c7-9cd3-92f8ebaf505d','Test Company',NULL,'testcompany5626','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:07:55','2025-09-03 18:07:55'),('9580c8a2-3dfa-488b-badd-f123fee48580','Test Organization',NULL,'testorganization3179','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:25:03','2025-09-06 06:25:03'),('96d2c4ae-a6ea-49ce-beea-74fcb677a8e6','Test Company',NULL,'testcompany5186','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 10:58:05','2025-09-06 10:58:05'),('99e6221d-9970-4804-96ef-b3962e4cc39d','Test Organization',NULL,'testorganization3087','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:40:33','2025-09-06 06:40:33'),('9bb441cb-e308-4d59-89b9-11f2d0c81f1a','測試公司',NULL,'8076','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:17:48','2025-09-03 18:17:48'),('9bb53ab2-8ad7-45fb-97ff-531b97444256','Test Organization',NULL,'testorganization0313','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:18:50','2025-09-06 06:18:50'),('9cedfefc-613d-48e5-8c0b-a85c21836882','Test Company',NULL,'testcompany1377','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:11:01','2025-09-03 18:11:01'),('9d61634a-e20d-4b4c-a7ca-389f60eb744e','Test Organization',NULL,'testorganization3846','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 05:54:33','2025-09-06 05:54:33'),('9e827c28-36b7-48d1-af14-644bfbc7bef3','Phase 2.3 Test User\'s Organization',NULL,'phase23testuser6310','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 14:04:56','2025-09-06 14:04:56'),('9f05e49a-4388-4ff6-90a6-58a5c55ef03f','Test Company',NULL,'testcompany5777','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 07:48:05','2025-09-04 07:48:05'),('9f6cc575-4f28-4ffb-bd59-da47d19b418d','Updated Test Organization',NULL,'testorganization2848','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:42:52','2025-09-06 06:42:53'),('a34c8fce-5762-4a50-a80d-2e3a548cc252','Analytics Test Company',NULL,'analyticstestcompany7250','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 12:06:37','2025-09-06 12:06:37'),('a81bde18-ec4a-4f15-8910-97edafebc723','Team Test Company',NULL,'teamtestcompany2760','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 19:11:12','2025-09-05 19:11:12'),('aa9b3ff9-a867-4f9a-afce-00fc7e6ab0bc','Phase 3 Complete Testing',NULL,'phase3completetesting0459','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:27:10','2025-09-07 06:27:10'),('aed7314d-f140-42b7-98a4-400753ad81c5','Alert Dashboard Company',NULL,'alertdashboardcompany6001','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:03:36','2025-09-06 11:03:36'),('b04e30d1-e9ad-4f33-80e3-749331f1004f','Keywords Test Company',NULL,'keywordstestcompany0002','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:33:20','2025-09-11 00:33:20'),('b0a50730-02c4-4028-8d11-8ad4b033de80','Blitzgame','https://blitzgame.app','democompany4707','free',99,5,10,NULL,NULL,NULL,NULL,'2025-09-03 20:43:04','2025-09-16 03:26:14'),('b1126468-8976-4027-aa2e-dfd3c7fb14cd','Test Verification Company',NULL,'testverificationcompany2131','free',99,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:15:52','2025-09-06 18:15:55'),('b78fe594-3193-456d-a02c-543cec76fd93','Phase 2.3 Test User\'s Organization',NULL,'phase23testuser6597','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 13:39:46','2025-09-06 13:39:46'),('b93664af-42b4-4efe-af44-b906fc556446','Updated Test Organization',NULL,'testorganization8841','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:33:48','2025-09-06 06:33:49'),('ba959b78-8ee9-448d-9f5e-ad3b34b4b27b','Analytics Test Company',NULL,'analyticstestcompany1525','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 12:15:21','2025-09-06 12:15:21'),('ba985bcd-46ca-4814-b9fb-399605a6c966','Analytics Test Company',NULL,'analyticstestcompany1625','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:53:11','2025-09-07 06:53:11'),('bb053649-b276-4e6f-ac66-ee29f3963777','Alert Dashboard Company',NULL,'alertdashboardcompany3252','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:04:43','2025-09-06 11:04:43'),('be571007-aa78-48a1-9178-00113255dc10','Test Company',NULL,'testcompany8493','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:15:38','2025-09-03 18:15:38'),('be75c6bb-8896-4e80-af31-f51d333ef100','Test Company',NULL,'testcompany9327','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 17:43:09','2025-09-05 17:43:09'),('c03e8beb-575b-47c0-aa9f-7783aa159141','Alert Test Company',NULL,'alerttestcompany7940','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 10:59:27','2025-09-06 10:59:27'),('c2af9065-226d-47b0-bbc8-4962f50a640d','Test Company',NULL,'testcompany8905','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:29:58','2025-09-03 18:29:58'),('c50b60ae-d9a5-4f6a-a0d9-3f3f044afca0','Phase 3 Testing Company',NULL,'phase3testingcompany4200','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:43:14','2025-09-06 18:43:14'),('c6f7b9f2-54c0-4f67-93ce-0de4e4545979','Test Organization',NULL,'testorganization0074','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:39:00','2025-09-06 06:39:00'),('c9d565e7-01a3-486b-99a1-9c2f8cde4e00','Test Company',NULL,'testcompany1721','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 17:08:11','2025-09-05 17:08:11'),('cb02ce00-ef45-44a9-9aa2-b4c64aab75e8','Test Company',NULL,'testcompany6656','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 15:58:46','2025-09-06 15:58:46'),('cd872861-7f9d-488e-a0a1-56663651f5d7','Analytics Test Company',NULL,'analyticstestcompany8103','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:55:58','2025-09-06 11:55:58'),('cd9cf6b9-fffc-4f4f-a376-301558479349','Analytics Test Company',NULL,'analyticstestcompany6726','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:47:56','2025-09-07 06:47:56'),('ce638fcf-cde0-4c6e-89a4-0acc4d620cb0','Team Test Company',NULL,'teamtestcompany0671','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 19:09:10','2025-09-05 19:09:10'),('d3e4ec9a-8b35-4d4c-89e5-22a0aacc9a2b','Test Company',NULL,'testcompany4773','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 10:58:24','2025-09-05 10:58:24'),('d5f31059-58df-4992-b7a7-5997f8d8e6e2','Test Company',NULL,'testcompany2636','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:11:42','2025-09-03 18:11:42'),('d768b339-0831-4c3e-8024-7306a354a270','Test Company',NULL,'testcompany5239','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:14:05','2025-09-11 00:14:05'),('dbdc3403-b6d2-419b-aa1a-c5dd39e00f81','Test Organization',NULL,'testorganization9437','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:18:49','2025-09-06 06:18:49'),('dbf73d35-123c-4794-80e1-4309d741a14d','Test Company',NULL,'testcompany9828','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 17:35:09','2025-09-04 17:35:09'),('deb0b9ca-6b02-47a5-a187-2123413ebc9a','Test Company',NULL,'testcompany8247','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 07:45:38','2025-09-04 07:45:38'),('df41d2ab-95e1-42de-9e97-8cf7ee26d376','Phase 3 Testing Company',NULL,'phase3testingcompany4074','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 05:37:44','2025-09-07 05:37:44'),('dfdff618-2f0b-414d-bcee-2156241b6bc2','Test Company',NULL,'testcompany5310','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-04 07:41:55','2025-09-04 07:41:55'),('e7d33256-71d7-48cf-b817-7c2086d3b23a','Test Company',NULL,'testcompany4067','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 18:04:04','2025-09-05 18:04:04'),('e897630b-ce74-4ca9-b167-2e664c2a94b4','Test Company',NULL,'testcompany7956','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:22:37','2025-09-03 18:22:37'),('e929fc48-59c4-4804-98f4-8272a38c4111','Test Company',NULL,'testcompany0566','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-08 15:53:10','2025-09-08 15:53:10'),('e962f076-a039-4337-8043-ffe5072e3f93','Team Test Company',NULL,'teamtestcompany4871','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 19:17:14','2025-09-05 19:17:14'),('edef9495-5f4c-4201-b87f-6b74e8199ec9','Test Co',NULL,'testco5321','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-05 19:10:25','2025-09-05 19:10:25'),('eedf11f7-e526-4063-a184-4295559a1849','Debug Test Company',NULL,'debugtestcompany8446','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:57:58','2025-09-06 11:57:58'),('f10c5c67-5e74-4c7f-a964-d4223dd77fe9','Test Verification Company',NULL,'testverificationcompany4373','free',99,5,3,NULL,NULL,NULL,NULL,'2025-09-06 18:20:04','2025-09-06 18:20:07'),('f2042266-b143-4167-9d63-5a744b0f4607','Phase 3 Complete Testing',NULL,'phase3completetesting9185','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:38:19','2025-09-07 06:38:19'),('f8567f0e-b5fe-4ecd-94b0-5df6943e78c0','Phase 2.3 Test User\'s Organization',NULL,'phase23testuser3593','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 13:48:33','2025-09-06 13:48:33'),('f8e338fc-0d39-4fd6-abd5-d0c975643034','Alert Test Company',NULL,'alerttestcompany8617','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 10:59:48','2025-09-06 10:59:48'),('fa37d9e3-bba0-4db9-ae58-ffbd228a2045','Updated Test Organization',NULL,'testorganization9604','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 06:50:59','2025-09-06 06:50:59'),('fa77c85c-6756-4318-b016-f5ea620a4df1','Test Company',NULL,'testcompany3806','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:44:23','2025-09-06 11:44:23'),('fb1ae0f6-6b29-4801-af32-936bc68057cc','Debug Company',NULL,'debugcompany2192','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 06:38:02','2025-09-07 06:38:02'),('fbb9753d-4f22-4e6f-b0b2-5b85a681c5c7','Keywords Test Company',NULL,'keywordstestcompany9841','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-11 00:36:59','2025-09-11 00:36:59'),('fc553199-25d2-4b66-aecd-dbf4916a0a9e','Alert Dashboard Company',NULL,'alertdashboardcompany0494','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:11:20','2025-09-06 11:11:20'),('fdd9ecaf-3387-487e-9729-5901d377fe9b','Alert Test Company',NULL,'alerttestcompany4637','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:02:14','2025-09-06 11:02:14'),('fe7d180c-6dfa-439a-83e8-554c76d18f87','Phase 3 Complete Testing',NULL,'phase3completetesting8400','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-07 05:57:58','2025-09-07 05:57:58'),('fe7f5f64-c96b-45d1-984f-80b3bb3e84d5','Alert Dashboard Company',NULL,'alertdashboardcompany3268','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 11:02:53','2025-09-06 11:02:53'),('fea653e4-74c1-4aa7-ac7c-6301cd4c53de','Test Company',NULL,'testcompany9789','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-03 18:23:29','2025-09-03 18:23:29'),('ff170e07-c99f-446f-a941-275380ecc4c3','Phase 2.3 Test User\'s Organization',NULL,'phase23testuser5405','free',100,5,3,NULL,NULL,NULL,NULL,'2025-09-06 13:06:55','2025-09-06 13:06:55');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT INTO `pages` VALUES ('46e1f507-e230-4e55-ab37-71945dd5f2a8','b0a50730-02c4-4028-8d11-8ad4b033de80','Game list','https://blitzgame.app/games','產品頁','中',53,'2025-09-15 17:33:53','completed',NULL,29,'2025-09-15 16:49:57','2025-09-15 17:33:53'),('f9851d39-3131-4299-959a-a7d87e2bd83b','b0a50730-02c4-4028-8d11-8ad4b033de80','community','https://figma.com/community','部落格','中',57,'2025-09-05 17:52:02','completed','[\"Failed to scrape website: Request failed with status code 403\"]',23,'2025-09-05 10:31:57','2025-09-05 17:52:02');
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `platform_settings`
--

LOCK TABLES `platform_settings` WRITE;
/*!40000 ALTER TABLE `platform_settings` DISABLE KEYS */;
INSERT INTO `platform_settings` VALUES ('08002f2a-fc5e-45d9-957b-cd01f9d43eae','96d2c4ae-a6ea-49ce-beea-74fcb677a8e6','perplexity',1,'{}',NULL,NULL,'2025-09-06 10:58:06','2025-09-06 10:58:06'),('0a48827f-e59d-4137-bf59-df5f92208bf9','4350d885-7186-40f5-94be-0f19d1a5e159','claude',1,'{}',NULL,NULL,'2025-09-11 00:47:29','2025-09-11 00:47:29'),('0ab3cd36-572e-4fd6-b68c-549b126aab0f','be75c6bb-8896-4e80-af31-f51d333ef100','gemini',1,'{}',NULL,NULL,'2025-09-05 17:43:17','2025-09-05 17:43:17'),('0bbda572-65b1-4d8f-90c3-056535d2084e','19f5e1b5-65ce-4a7a-9838-2c7c9640eac6','claude',1,'{}',NULL,NULL,'2025-09-06 12:26:46','2025-09-06 12:26:46'),('1570758a-6a61-4692-9255-2736339847d2','379fdae6-a56f-47a9-a1e1-9eb685c6829c','perplexity',1,'{}',NULL,NULL,'2025-09-05 16:56:26','2025-09-05 16:56:26'),('1767b1f5-f6ad-478d-a95e-bf2ea63d295a','fbb9753d-4f22-4e6f-b0b2-5b85a681c5c7','chatgpt',1,'{\"priority\": \"high\", \"updatedBy\": \"39561542-059d-4fc0-809e-58b1c6d33f9b\", \"requestLimit\": 100, \"lastConfigUpdate\": \"2025-09-11T00:37:00.138Z\", \"organizationPlan\": \"free\"}',NULL,'2025-09-11 00:37:00','2025-09-11 00:37:00','2025-09-11 00:37:00'),('1948dcf8-d898-4cb8-bee7-88bdfbd98f0c','c9d565e7-01a3-486b-99a1-9c2f8cde4e00','gemini',1,'{}',NULL,NULL,'2025-09-05 17:08:13','2025-09-05 17:08:13'),('1c0ba157-d945-47a7-ab85-c54e9723b340','be75c6bb-8896-4e80-af31-f51d333ef100','chatgpt',1,'{\"priority\": \"high\", \"maxQueries\": 100}',NULL,NULL,'2025-09-05 17:43:17','2025-09-05 17:43:18'),('1eba3134-3bcb-4aeb-8a8c-f1e2f9a47dc8','8209b96f-2055-4b90-b62b-6000e7b94c85','chatgpt',0,'{\"priority\": \"high\", \"updatedBy\": \"379033b5-d5b2-4c86-bc8b-55fe3b9b4192\", \"maxQueries\": 100, \"lastConfigUpdate\": \"2025-09-11T00:58:37.905Z\", \"organizationPlan\": \"free\"}',NULL,'2025-09-11 00:58:37','2025-09-11 00:58:37','2025-09-23 15:42:45'),('222d8aa7-bdd0-4653-8c79-30feeb4c5104','e7d33256-71d7-48cf-b817-7c2086d3b23a','gemini',1,'{}',NULL,NULL,'2025-09-05 18:04:05','2025-09-05 18:04:05'),('23c44bc5-2a4d-4688-bd70-cd9faceeb437','96d2c4ae-a6ea-49ce-beea-74fcb677a8e6','claude',1,'{}',NULL,NULL,'2025-09-06 10:58:06','2025-09-06 10:58:06'),('2fb26156-7a2e-428e-a05b-970a0363243e','470932b6-f68e-41b5-9908-e1cd68604fbf','chatgpt',1,'{\"priority\": \"high\", \"updatedBy\": \"d1856834-040c-428f-815d-1d54c3531bf5\", \"maxQueries\": 100, \"lastConfigUpdate\": \"2025-09-11T00:51:13.612Z\", \"organizationPlan\": \"free\"}',NULL,'2025-09-11 00:51:13','2025-09-11 00:51:13','2025-09-11 00:51:13'),('33d75546-8a48-11f0-b652-000c292a4471','00c5f985-8caa-4aec-9719-565530aa0513','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d75b5e-8a48-11f0-b652-000c292a4471','00c5f985-8caa-4aec-9719-565530aa0513','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d75e37-8a48-11f0-b652-000c292a4471','00c5f985-8caa-4aec-9719-565530aa0513','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d75fcd-8a48-11f0-b652-000c292a4471','00c5f985-8caa-4aec-9719-565530aa0513','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d76178-8a48-11f0-b652-000c292a4471','05c02e6d-321a-44a6-a2a3-efca3e7603fa','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d762e5-8a48-11f0-b652-000c292a4471','05c02e6d-321a-44a6-a2a3-efca3e7603fa','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7643c-8a48-11f0-b652-000c292a4471','05c02e6d-321a-44a6-a2a3-efca3e7603fa','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7658d-8a48-11f0-b652-000c292a4471','05c02e6d-321a-44a6-a2a3-efca3e7603fa','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d76700-8a48-11f0-b652-000c292a4471','13ebd03d-be1a-44b2-b809-ddae4ffdda40','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7684f-8a48-11f0-b652-000c292a4471','13ebd03d-be1a-44b2-b809-ddae4ffdda40','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d769a5-8a48-11f0-b652-000c292a4471','13ebd03d-be1a-44b2-b809-ddae4ffdda40','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d76aff-8a48-11f0-b652-000c292a4471','13ebd03d-be1a-44b2-b809-ddae4ffdda40','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d76c69-8a48-11f0-b652-000c292a4471','16f13c9c-18d6-4728-9b6f-687eddbdbd08','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d76dbf-8a48-11f0-b652-000c292a4471','16f13c9c-18d6-4728-9b6f-687eddbdbd08','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d76f0d-8a48-11f0-b652-000c292a4471','16f13c9c-18d6-4728-9b6f-687eddbdbd08','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77062-8a48-11f0-b652-000c292a4471','16f13c9c-18d6-4728-9b6f-687eddbdbd08','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d771d1-8a48-11f0-b652-000c292a4471','19334578-e269-4962-b0f1-d57dff32a367','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7732c-8a48-11f0-b652-000c292a4471','19334578-e269-4962-b0f1-d57dff32a367','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77488-8a48-11f0-b652-000c292a4471','19334578-e269-4962-b0f1-d57dff32a367','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d775d7-8a48-11f0-b652-000c292a4471','19334578-e269-4962-b0f1-d57dff32a367','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77741-8a48-11f0-b652-000c292a4471','1e0af5b2-f15d-4a53-866e-254db4057189','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77892-8a48-11f0-b652-000c292a4471','1e0af5b2-f15d-4a53-866e-254db4057189','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d779ef-8a48-11f0-b652-000c292a4471','1e0af5b2-f15d-4a53-866e-254db4057189','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77b44-8a48-11f0-b652-000c292a4471','1e0af5b2-f15d-4a53-866e-254db4057189','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77cb2-8a48-11f0-b652-000c292a4471','4300d634-7682-415e-8fb5-9f2ef182f81c','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77dfe-8a48-11f0-b652-000c292a4471','4300d634-7682-415e-8fb5-9f2ef182f81c','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d77f51-8a48-11f0-b652-000c292a4471','4300d634-7682-415e-8fb5-9f2ef182f81c','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d780a4-8a48-11f0-b652-000c292a4471','4300d634-7682-415e-8fb5-9f2ef182f81c','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d78217-8a48-11f0-b652-000c292a4471','45c5b7b6-b455-433a-9f09-d2f703b54f6f','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d78364-8a48-11f0-b652-000c292a4471','45c5b7b6-b455-433a-9f09-d2f703b54f6f','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d784bc-8a48-11f0-b652-000c292a4471','45c5b7b6-b455-433a-9f09-d2f703b54f6f','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d78615-8a48-11f0-b652-000c292a4471','45c5b7b6-b455-433a-9f09-d2f703b54f6f','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d787b6-8a48-11f0-b652-000c292a4471','5cbe0a3c-88ef-11f0-b652-000c292a4471','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d78952-8a48-11f0-b652-000c292a4471','5cbe0a3c-88ef-11f0-b652-000c292a4471','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d78b22-8a48-11f0-b652-000c292a4471','5cbe0a3c-88ef-11f0-b652-000c292a4471','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d78d4c-8a48-11f0-b652-000c292a4471','5cbe0a3c-88ef-11f0-b652-000c292a4471','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d78eec-8a48-11f0-b652-000c292a4471','60cbfdb3-5682-4d7d-b667-43a50bc7a0b9','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7904c-8a48-11f0-b652-000c292a4471','60cbfdb3-5682-4d7d-b667-43a50bc7a0b9','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d791b0-8a48-11f0-b652-000c292a4471','60cbfdb3-5682-4d7d-b667-43a50bc7a0b9','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79308-8a48-11f0-b652-000c292a4471','60cbfdb3-5682-4d7d-b667-43a50bc7a0b9','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79479-8a48-11f0-b652-000c292a4471','6516c31c-abb0-4ebf-992b-559ce64a4c1e','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d795cb-8a48-11f0-b652-000c292a4471','6516c31c-abb0-4ebf-992b-559ce64a4c1e','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79723-8a48-11f0-b652-000c292a4471','6516c31c-abb0-4ebf-992b-559ce64a4c1e','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7987b-8a48-11f0-b652-000c292a4471','6516c31c-abb0-4ebf-992b-559ce64a4c1e','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79a04-8a48-11f0-b652-000c292a4471','700d5529-2fbe-4194-88e7-3320bab0f249','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79b58-8a48-11f0-b652-000c292a4471','700d5529-2fbe-4194-88e7-3320bab0f249','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79cb1-8a48-11f0-b652-000c292a4471','700d5529-2fbe-4194-88e7-3320bab0f249','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79e0d-8a48-11f0-b652-000c292a4471','700d5529-2fbe-4194-88e7-3320bab0f249','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d79f77-8a48-11f0-b652-000c292a4471','703dd915-ca93-414c-8b60-d0ee57310140','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7a0d2-8a48-11f0-b652-000c292a4471','703dd915-ca93-414c-8b60-d0ee57310140','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7a2b8-8a48-11f0-b652-000c292a4471','703dd915-ca93-414c-8b60-d0ee57310140','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7a417-8a48-11f0-b652-000c292a4471','703dd915-ca93-414c-8b60-d0ee57310140','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7a58f-8a48-11f0-b652-000c292a4471','70cb1b1f-39ce-41d6-8e2c-a581b2059ffc','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7a6f4-8a48-11f0-b652-000c292a4471','70cb1b1f-39ce-41d6-8e2c-a581b2059ffc','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7a85a-8a48-11f0-b652-000c292a4471','70cb1b1f-39ce-41d6-8e2c-a581b2059ffc','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7a9be-8a48-11f0-b652-000c292a4471','70cb1b1f-39ce-41d6-8e2c-a581b2059ffc','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ab38-8a48-11f0-b652-000c292a4471','83beb62b-13db-4f34-8c38-8c908c6254ef','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ac87-8a48-11f0-b652-000c292a4471','83beb62b-13db-4f34-8c38-8c908c6254ef','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ade0-8a48-11f0-b652-000c292a4471','83beb62b-13db-4f34-8c38-8c908c6254ef','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7af3d-8a48-11f0-b652-000c292a4471','83beb62b-13db-4f34-8c38-8c908c6254ef','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7b0b4-8a48-11f0-b652-000c292a4471','84b192cf-d346-4341-a91b-23ece0dde801','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7b209-8a48-11f0-b652-000c292a4471','84b192cf-d346-4341-a91b-23ece0dde801','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7b362-8a48-11f0-b652-000c292a4471','84b192cf-d346-4341-a91b-23ece0dde801','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7b4c1-8a48-11f0-b652-000c292a4471','84b192cf-d346-4341-a91b-23ece0dde801','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7b632-8a48-11f0-b652-000c292a4471','85d0177d-e089-4a64-9622-bfe8723a4413','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7b798-8a48-11f0-b652-000c292a4471','85d0177d-e089-4a64-9622-bfe8723a4413','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7b8fe-8a48-11f0-b652-000c292a4471','85d0177d-e089-4a64-9622-bfe8723a4413','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ba57-8a48-11f0-b652-000c292a4471','85d0177d-e089-4a64-9622-bfe8723a4413','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7bbc9-8a48-11f0-b652-000c292a4471','8f02b73b-c82f-4543-b1e2-d1e0bf3991e8','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7bd24-8a48-11f0-b652-000c292a4471','8f02b73b-c82f-4543-b1e2-d1e0bf3991e8','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7be8c-8a48-11f0-b652-000c292a4471','8f02b73b-c82f-4543-b1e2-d1e0bf3991e8','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7bfe9-8a48-11f0-b652-000c292a4471','8f02b73b-c82f-4543-b1e2-d1e0bf3991e8','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7c15f-8a48-11f0-b652-000c292a4471','9471d616-1b40-41c7-9cd3-92f8ebaf505d','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7c2b2-8a48-11f0-b652-000c292a4471','9471d616-1b40-41c7-9cd3-92f8ebaf505d','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7c40e-8a48-11f0-b652-000c292a4471','9471d616-1b40-41c7-9cd3-92f8ebaf505d','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7c568-8a48-11f0-b652-000c292a4471','9471d616-1b40-41c7-9cd3-92f8ebaf505d','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7c6e5-8a48-11f0-b652-000c292a4471','9bb441cb-e308-4d59-89b9-11f2d0c81f1a','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7c906-8a48-11f0-b652-000c292a4471','9bb441cb-e308-4d59-89b9-11f2d0c81f1a','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ca6b-8a48-11f0-b652-000c292a4471','9bb441cb-e308-4d59-89b9-11f2d0c81f1a','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7cbcc-8a48-11f0-b652-000c292a4471','9bb441cb-e308-4d59-89b9-11f2d0c81f1a','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7cd41-8a48-11f0-b652-000c292a4471','9cedfefc-613d-48e5-8c0b-a85c21836882','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ce9e-8a48-11f0-b652-000c292a4471','9cedfefc-613d-48e5-8c0b-a85c21836882','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7cffb-8a48-11f0-b652-000c292a4471','9cedfefc-613d-48e5-8c0b-a85c21836882','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7d152-8a48-11f0-b652-000c292a4471','9cedfefc-613d-48e5-8c0b-a85c21836882','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7d2c3-8a48-11f0-b652-000c292a4471','9f05e49a-4388-4ff6-90a6-58a5c55ef03f','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7d421-8a48-11f0-b652-000c292a4471','9f05e49a-4388-4ff6-90a6-58a5c55ef03f','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7d586-8a48-11f0-b652-000c292a4471','9f05e49a-4388-4ff6-90a6-58a5c55ef03f','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7d74d-8a48-11f0-b652-000c292a4471','9f05e49a-4388-4ff6-90a6-58a5c55ef03f','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7d8d5-8a48-11f0-b652-000c292a4471','b0a50730-02c4-4028-8d11-8ad4b033de80','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-16 05:04:55'),('33d7da33-8a48-11f0-b652-000c292a4471','b0a50730-02c4-4028-8d11-8ad4b033de80','perplexity',0,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-16 05:04:55'),('33d7db90-8a48-11f0-b652-000c292a4471','b0a50730-02c4-4028-8d11-8ad4b033de80','gemini',0,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-16 05:04:55'),('33d7dcf0-8a48-11f0-b652-000c292a4471','b0a50730-02c4-4028-8d11-8ad4b033de80','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-16 05:04:55'),('33d7de6d-8a48-11f0-b652-000c292a4471','be571007-aa78-48a1-9178-00113255dc10','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7dfc4-8a48-11f0-b652-000c292a4471','be571007-aa78-48a1-9178-00113255dc10','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7e11f-8a48-11f0-b652-000c292a4471','be571007-aa78-48a1-9178-00113255dc10','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7e27e-8a48-11f0-b652-000c292a4471','be571007-aa78-48a1-9178-00113255dc10','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7e3eb-8a48-11f0-b652-000c292a4471','c2af9065-226d-47b0-bbc8-4962f50a640d','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7e552-8a48-11f0-b652-000c292a4471','c2af9065-226d-47b0-bbc8-4962f50a640d','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7e6b1-8a48-11f0-b652-000c292a4471','c2af9065-226d-47b0-bbc8-4962f50a640d','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7e806-8a48-11f0-b652-000c292a4471','c2af9065-226d-47b0-bbc8-4962f50a640d','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7e978-8a48-11f0-b652-000c292a4471','d3e4ec9a-8b35-4d4c-89e5-22a0aacc9a2b','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ead4-8a48-11f0-b652-000c292a4471','d3e4ec9a-8b35-4d4c-89e5-22a0aacc9a2b','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ec3c-8a48-11f0-b652-000c292a4471','d3e4ec9a-8b35-4d4c-89e5-22a0aacc9a2b','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ed99-8a48-11f0-b652-000c292a4471','d3e4ec9a-8b35-4d4c-89e5-22a0aacc9a2b','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ef11-8a48-11f0-b652-000c292a4471','d5f31059-58df-4992-b7a7-5997f8d8e6e2','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7f067-8a48-11f0-b652-000c292a4471','d5f31059-58df-4992-b7a7-5997f8d8e6e2','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7f1c7-8a48-11f0-b652-000c292a4471','d5f31059-58df-4992-b7a7-5997f8d8e6e2','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7f38d-8a48-11f0-b652-000c292a4471','d5f31059-58df-4992-b7a7-5997f8d8e6e2','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7f516-8a48-11f0-b652-000c292a4471','dbf73d35-123c-4794-80e1-4309d741a14d','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7f673-8a48-11f0-b652-000c292a4471','dbf73d35-123c-4794-80e1-4309d741a14d','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7f7cf-8a48-11f0-b652-000c292a4471','dbf73d35-123c-4794-80e1-4309d741a14d','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7f92c-8a48-11f0-b652-000c292a4471','dbf73d35-123c-4794-80e1-4309d741a14d','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7fa99-8a48-11f0-b652-000c292a4471','deb0b9ca-6b02-47a5-a187-2123413ebc9a','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7fbf5-8a48-11f0-b652-000c292a4471','deb0b9ca-6b02-47a5-a187-2123413ebc9a','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7fd96-8a48-11f0-b652-000c292a4471','deb0b9ca-6b02-47a5-a187-2123413ebc9a','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d7ff0b-8a48-11f0-b652-000c292a4471','deb0b9ca-6b02-47a5-a187-2123413ebc9a','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80082-8a48-11f0-b652-000c292a4471','dfdff618-2f0b-414d-bcee-2156241b6bc2','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d801e1-8a48-11f0-b652-000c292a4471','dfdff618-2f0b-414d-bcee-2156241b6bc2','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d8034a-8a48-11f0-b652-000c292a4471','dfdff618-2f0b-414d-bcee-2156241b6bc2','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d804ab-8a48-11f0-b652-000c292a4471','dfdff618-2f0b-414d-bcee-2156241b6bc2','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80625-8a48-11f0-b652-000c292a4471','e897630b-ce74-4ca9-b167-2e664c2a94b4','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80779-8a48-11f0-b652-000c292a4471','e897630b-ce74-4ca9-b167-2e664c2a94b4','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d808d7-8a48-11f0-b652-000c292a4471','e897630b-ce74-4ca9-b167-2e664c2a94b4','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80a3b-8a48-11f0-b652-000c292a4471','e897630b-ce74-4ca9-b167-2e664c2a94b4','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80bb8-8a48-11f0-b652-000c292a4471','fea653e4-74c1-4aa7-ac7c-6301cd4c53de','claude',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80d13-8a48-11f0-b652-000c292a4471','fea653e4-74c1-4aa7-ac7c-6301cd4c53de','perplexity',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80e6f-8a48-11f0-b652-000c292a4471','fea653e4-74c1-4aa7-ac7c-6301cd4c53de','gemini',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('33d80fce-8a48-11f0-b652-000c292a4471','fea653e4-74c1-4aa7-ac7c-6301cd4c53de','chatgpt',1,'{}',NULL,NULL,'2025-09-05 11:05:16','2025-09-05 11:05:16'),('37c75cec-de91-48b8-b966-bad9fe6e1e9b','fa77c85c-6756-4318-b016-f5ea620a4df1','chatgpt',1,'{\"priority\": \"high\", \"maxQueries\": 100}',NULL,NULL,'2025-09-06 11:44:25','2025-09-06 11:44:25'),('3e76a42e-4bfa-4678-aa7b-7ee0598c5d9f','0a8444ea-0981-4648-af15-3a722545d2b8','claude',1,'{}',NULL,NULL,'2025-09-11 00:49:19','2025-09-11 00:49:19'),('420ce40c-afec-4218-acc7-c1ad34e7f097','e7d33256-71d7-48cf-b817-7c2086d3b23a','chatgpt',1,'{\"priority\": \"high\", \"maxQueries\": 100}',NULL,NULL,'2025-09-05 18:04:05','2025-09-05 18:04:05'),('43c1cd6e-7ca9-4100-865f-473755448663','0a8444ea-0981-4648-af15-3a722545d2b8','chatgpt',1,'{\"priority\": \"high\", \"updatedBy\": \"87ea071c-2a27-49c2-9b2b-661a3506055c\", \"requestLimit\": 100, \"lastConfigUpdate\": \"2025-09-11T00:49:19.102Z\", \"organizationPlan\": \"free\"}',NULL,'2025-09-11 00:49:19','2025-09-11 00:49:19','2025-09-11 00:49:19'),('4939c55e-db12-4467-a1cb-b6005dd98324','8209b96f-2055-4b90-b62b-6000e7b94c85','claude',0,'{\"organizationPlan\": \"free\", \"maxRequestsPerDay\": 30, \"createdAutomatically\": true}',NULL,NULL,'2025-09-11 00:58:37','2025-09-23 15:42:45'),('4a4b20df-2b55-4787-8b1d-d9b58b884749','7cb07309-d54a-401d-8643-c2c2a9236ac8','claude',1,'{}',NULL,NULL,'2025-09-11 00:38:07','2025-09-11 00:38:07'),('60c495db-bef5-4cb9-8da2-2af3c991e4a0','96d2c4ae-a6ea-49ce-beea-74fcb677a8e6','chatgpt',1,'{\"priority\": \"high\", \"maxQueries\": 100}',NULL,NULL,'2025-09-06 10:58:06','2025-09-06 10:58:06'),('689dfd3c-7e81-4a46-99df-c005234cd7cc','470932b6-f68e-41b5-9908-e1cd68604fbf','claude',0,'{\"organizationPlan\": \"free\", \"maxRequestsPerDay\": 30, \"createdAutomatically\": true}',NULL,NULL,'2025-09-11 00:51:13','2025-09-11 00:51:13'),('74e677de-6298-4e2f-8ece-fd84dda8a849','19f5e1b5-65ce-4a7a-9838-2c7c9640eac6','gemini',1,'{}',NULL,NULL,'2025-09-06 12:26:46','2025-09-06 12:26:46'),('756c43e2-ce81-40c6-8979-b17f6d0db14f','19f5e1b5-65ce-4a7a-9838-2c7c9640eac6','chatgpt',1,'{\"priority\": \"high\", \"maxQueries\": 100}',NULL,NULL,'2025-09-06 12:26:46','2025-09-06 12:26:46'),('759ff982-1cb1-408a-bef2-47c43f993694','7cb07309-d54a-401d-8643-c2c2a9236ac8','chatgpt',1,'{\"priority\": \"high\", \"updatedBy\": \"d8ec404d-07f9-4717-b722-fdab85b17321\", \"requestLimit\": 100, \"lastConfigUpdate\": \"2025-09-11T00:38:07.433Z\", \"organizationPlan\": \"free\"}',NULL,'2025-09-11 00:38:07','2025-09-11 00:38:07','2025-09-11 00:38:07'),('774896ec-60d7-499a-b7c5-50185331738e','c9d565e7-01a3-486b-99a1-9c2f8cde4e00','perplexity',1,'{}',NULL,NULL,'2025-09-05 17:08:13','2025-09-05 17:08:13'),('7c656cfd-e6f3-4d16-993f-ae1b0776ba27','96d2c4ae-a6ea-49ce-beea-74fcb677a8e6','gemini',1,'{}',NULL,NULL,'2025-09-06 10:58:06','2025-09-06 10:58:06'),('8f40d64e-c0e0-42af-b42c-7fd01851b43f','c9d565e7-01a3-486b-99a1-9c2f8cde4e00','chatgpt',1,'{\"priority\": \"high\", \"maxQueries\": 100}',NULL,NULL,'2025-09-05 17:08:13','2025-09-05 17:08:13'),('9081e375-fcfc-4d15-be95-c0baf2f049c8','25d494be-2ec4-415c-a7de-6fc4ead58005','chatgpt',1,'{\"priority\": \"high\", \"updatedBy\": \"c4735160-68fc-4dda-b62b-888d31144a60\", \"requestLimit\": 100, \"lastConfigUpdate\": \"2025-09-11T00:46:04.743Z\", \"organizationPlan\": \"free\"}',NULL,'2025-09-11 00:46:04','2025-09-11 00:46:04','2025-09-11 00:46:04'),('92b112d2-18ee-4960-a6c8-027004c20e1d','8209b96f-2055-4b90-b62b-6000e7b94c85','gemini',1,'{}',NULL,NULL,'2025-09-11 00:58:37','2025-09-23 15:42:45'),('ad11cb99-24a9-4bd5-8843-8dcf5d0bdf94','379fdae6-a56f-47a9-a1e1-9eb685c6829c','chatgpt',1,'{\"priority\": \"high\", \"maxQueries\": 100}',NULL,NULL,'2025-09-05 16:56:26','2025-09-05 16:56:26'),('b1baed22-eac2-4cfc-aec7-88d131453ada','e7d33256-71d7-48cf-b817-7c2086d3b23a','claude',1,'{}',NULL,NULL,'2025-09-05 18:04:05','2025-09-05 18:04:05'),('b817c1f3-b883-4df1-b540-bf038de5af6f','19f5e1b5-65ce-4a7a-9838-2c7c9640eac6','perplexity',1,'{}',NULL,NULL,'2025-09-06 12:26:46','2025-09-06 12:26:46'),('b91c0ea2-cda2-4863-ba19-c148b6876dad','fa77c85c-6756-4318-b016-f5ea620a4df1','gemini',1,'{}',NULL,NULL,'2025-09-06 11:44:25','2025-09-06 11:44:25'),('bd03c942-3694-4fa6-b7b1-dd5be0bda7b1','25d494be-2ec4-415c-a7de-6fc4ead58005','claude',1,'{}',NULL,NULL,'2025-09-11 00:46:04','2025-09-11 00:46:04'),('c43cea5e-cb1a-4ff4-a37f-af0c9653b0c5','fa77c85c-6756-4318-b016-f5ea620a4df1','claude',1,'{}',NULL,NULL,'2025-09-06 11:44:25','2025-09-06 11:44:25'),('cf42898d-8685-4834-b854-51b7489b6661','4350d885-7186-40f5-94be-0f19d1a5e159','chatgpt',1,'{\"priority\": \"high\", \"updatedBy\": \"8d99f2bb-f358-4745-bf77-13715288459f\", \"requestLimit\": 100, \"lastConfigUpdate\": \"2025-09-11T00:47:29.952Z\", \"organizationPlan\": \"free\"}',NULL,'2025-09-11 00:47:29','2025-09-11 00:47:29','2025-09-11 00:47:29'),('cfabcf36-bca1-4440-bfcf-12d159d3ce50','470932b6-f68e-41b5-9908-e1cd68604fbf','gemini',1,'{}',NULL,NULL,'2025-09-11 00:51:13','2025-09-11 00:51:13'),('d3637dd4-3d3b-4d6e-ab06-aba14a8115ca','be75c6bb-8896-4e80-af31-f51d333ef100','perplexity',1,'{}',NULL,NULL,'2025-09-05 17:43:17','2025-09-05 17:43:17'),('d698e9e3-2f5a-44c2-9ccc-ba1aaa2fdd08','379fdae6-a56f-47a9-a1e1-9eb685c6829c','gemini',1,'{}',NULL,NULL,'2025-09-05 16:56:26','2025-09-05 16:56:26'),('d7beb4f6-6da2-4ed1-8556-fd68151baf45','fa77c85c-6756-4318-b016-f5ea620a4df1','perplexity',1,'{}',NULL,NULL,'2025-09-06 11:44:25','2025-09-06 11:44:25'),('dab325e6-c86d-47a2-91a0-69043ed3dff6','e7d33256-71d7-48cf-b817-7c2086d3b23a','perplexity',1,'{}',NULL,NULL,'2025-09-05 18:04:05','2025-09-05 18:04:05'),('dc404a97-62bf-4c85-9801-b5adce9990ea','379fdae6-a56f-47a9-a1e1-9eb685c6829c','claude',1,'{}',NULL,NULL,'2025-09-05 16:56:26','2025-09-05 16:56:26'),('e7768251-7f36-426c-9e23-34145ee178e7','fbb9753d-4f22-4e6f-b0b2-5b85a681c5c7','claude',1,'{}',NULL,NULL,'2025-09-11 00:37:00','2025-09-11 00:37:00'),('e8e536f2-4692-4f76-ab24-0ed29d0776a5','be75c6bb-8896-4e80-af31-f51d333ef100','claude',1,'{}',NULL,NULL,'2025-09-05 17:43:17','2025-09-05 17:43:17'),('f2ebd841-4e30-4982-9862-1142c4712cdd','c9d565e7-01a3-486b-99a1-9c2f8cde4e00','claude',1,'{}',NULL,NULL,'2025-09-05 17:08:13','2025-09-05 17:08:13');
/*!40000 ALTER TABLE `platform_settings` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `report_templates`
--

LOCK TABLES `report_templates` WRITE;
/*!40000 ALTER TABLE `report_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_templates` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `scan_metrics`
--

LOCK TABLES `scan_metrics` WRITE;
/*!40000 ALTER TABLE `scan_metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `scan_metrics` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `scans`
--

LOCK TABLES `scans` WRITE;
/*!40000 ALTER TABLE `scans` DISABLE KEYS */;
INSERT INTO `scans` VALUES ('749161c8-595c-434d-9497-c9a4894af592','764d5cbe-6a3d-42d5-a099-bfd002967a79','standard','completed',100,'2025-09-04 17:28:39','2025-09-04 17:28:43',NULL,'{\"url\": \"https://figma.com\", \"score\": 80, \"preview\": {\"aiVisibility\": 65, \"contentQuality\": 88, \"technicalHealth\": 85}, \"summary\": {\"status\": \"good\", \"message\": \"figma.com 在 AI 搜索中表現良好，但仍有優化空間。\", \"keyIssues\": [\"描述過長 (172 字元)\", \"Performance分數: 65/100, LCP: 3.5s\", \"Accessibility分數: 75/100\", \"CLS: 0.15, FCP: 2.5s\"]}, \"aiVisibility\": {\"items\": [{\"name\": \"Schema 標記\", \"score\": 20, \"detail\": \"未發現結構化資料標記\", \"status\": \"critical\", \"recommendation\": \"加入 JSON-LD 結構化資料以提升 AI 可見度\"}, {\"name\": \"社群媒體標記\", \"score\": 100, \"detail\": \"完整的社群標記 (15 個)\", \"status\": \"good\"}, {\"name\": \"FAQ 內容\", \"score\": 50, \"detail\": \"未發現 FAQ 或問答內容\", \"status\": \"warning\", \"recommendation\": \"加入常見問題解答以提升 AI 查詢回應\"}, {\"name\": \"內容可讀性\", \"score\": 90, \"detail\": \"句子長度適中 (平均 13 字/句)\", \"status\": \"good\"}], \"score\": 65, \"weight\": 30}, \"contentQuality\": {\"items\": [{\"name\": \"標題結構\", \"score\": 100, \"detail\": \"良好的標題結構 (H1:1, H2:9, H3:11)\", \"status\": \"good\"}, {\"name\": \"內容長度\", \"score\": 70, \"detail\": \"內容偏短 (約 531 字)\", \"status\": \"warning\", \"recommendation\": \"建議增加更多有價值的內容\"}, {\"name\": \"圖片優化\", \"score\": 80, \"detail\": \"89% 圖片有 Alt 文字 (56/63)\", \"status\": \"warning\", \"recommendation\": \"為所有圖片加入描述性的 Alt 文字\"}, {\"name\": \"內部連結\", \"score\": 100, \"detail\": \"有適量的連結 (75 個)\", \"status\": \"good\"}], \"score\": 88, \"weight\": 30}, \"upgradeReasons\": [\"獲得 30+ 項技術指標詳細分析\", \"查看具體競爭對手表現比較\", \"獲得個人化優化執行計劃\", \"追蹤改善進度和成效監控\"], \"technicalHealth\": {\"items\": [{\"name\": \"robots.txt 配置\", \"score\": 100, \"detail\": \"已允許搜尋引擎爬取\", \"status\": \"good\"}, {\"name\": \"HTTPS 安全連線\", \"score\": 100, \"detail\": \"使用安全的 HTTPS 連線\", \"status\": \"good\"}, {\"name\": \"行動裝置優化\", \"score\": 100, \"detail\": \"已設定 viewport meta 標籤\", \"status\": \"good\"}, {\"name\": \"頁面標題\", \"score\": 100, \"detail\": \"標題長度適中 (46 字元)\", \"status\": \"good\"}, {\"name\": \"Meta 描述\", \"score\": 70, \"detail\": \"描述過長 (172 字元)\", \"status\": \"warning\", \"recommendation\": \"描述建議長度 120-160 字元\"}, {\"name\": \"頁面載入速度\", \"score\": 65, \"detail\": \"Performance分數: 65/100, LCP: 3.5s\", \"status\": \"warning\", \"recommendation\": \"建議優化圖片、減少JavaScript和CSS檔案大小\"}, {\"name\": \"無障礙設計\", \"score\": 75, \"detail\": \"Accessibility分數: 75/100\", \"status\": \"warning\", \"recommendation\": \"改善顏色對比度、添加Alt文字、確保鍵盤導航\"}, {\"name\": \"Core Web Vitals\", \"score\": 70, \"detail\": \"CLS: 0.15, FCP: 2.5s\", \"status\": \"warning\", \"recommendation\": \"優化布局穩定性和最大內容繪製時間\"}], \"score\": 85, \"weight\": 40}}','2025-09-04 17:28:39'),('75681be2-875d-4647-9f6e-b1e74bbcd6ff','472d82cb-5242-4e44-954b-8a1065e998ec','standard','completed',100,'2025-09-23 15:30:55','2025-09-23 15:30:55',NULL,'{\"url\": \"https://blitzgame.app\", \"score\": 64, \"preview\": {\"aiVisibility\": 60, \"contentQuality\": 48, \"technicalHealth\": 80}, \"summary\": {\"status\": \"warning\", \"message\": \"blitzgame.app 存在一些影響 AI 可見度的問題需要改善。\", \"keyIssues\": [\"標題過短 (14 字元)\", \"描述過長 (282 字元)\", \"Performance分數: 65/100, LCP: 3.5s\", \"Accessibility分數: 75/100\"]}, \"aiVisibility\": {\"items\": [{\"name\": \"Schema 標記\", \"score\": 20, \"detail\": \"未發現結構化資料標記\", \"status\": \"critical\", \"recommendation\": \"加入 JSON-LD 結構化資料以提升 AI 可見度\"}, {\"name\": \"社群媒體標記\", \"score\": 100, \"detail\": \"完整的社群標記 (7 個)\", \"status\": \"good\"}, {\"name\": \"FAQ 內容\", \"score\": 50, \"detail\": \"未發現 FAQ 或問答內容\", \"status\": \"warning\", \"recommendation\": \"加入常見問題解答以提升 AI 查詢回應\"}, {\"name\": \"內容可讀性\", \"score\": 70, \"detail\": \"句子過短 (平均 7 字/句)\", \"status\": \"warning\", \"recommendation\": \"適度增加句子內容深度\"}], \"score\": 60, \"weight\": 30}, \"contentQuality\": {\"items\": [{\"name\": \"標題結構\", \"score\": 20, \"detail\": \"缺少 H1 主標題\", \"status\": \"critical\", \"recommendation\": \"每個頁面都應該有一個 H1 標題\"}, {\"name\": \"內容長度\", \"score\": 30, \"detail\": \"內容過短 (約 58 字)\", \"status\": \"critical\", \"recommendation\": \"建議內容長度至少 300 字以上\"}, {\"name\": \"圖片優化\", \"score\": 80, \"detail\": \"頁面沒有圖片\", \"status\": \"warning\"}, {\"name\": \"內部連結\", \"score\": 60, \"detail\": \"頁面沒有連結\", \"status\": \"warning\", \"recommendation\": \"加入相關的內部連結\"}], \"score\": 48, \"weight\": 30}, \"upgradeReasons\": [\"獲得 30+ 項技術指標詳細分析\", \"查看具體競爭對手表現比較\", \"獲得個人化優化執行計劃\", \"追蹤改善進度和成效監控\"], \"technicalHealth\": {\"items\": [{\"name\": \"robots.txt 配置\", \"score\": 100, \"detail\": \"已允許搜尋引擎爬取\", \"status\": \"good\"}, {\"name\": \"HTTPS 安全連線\", \"score\": 100, \"detail\": \"使用安全的 HTTPS 連線\", \"status\": \"good\"}, {\"name\": \"行動裝置優化\", \"score\": 100, \"detail\": \"已設定 viewport meta 標籤\", \"status\": \"good\"}, {\"name\": \"頁面標題\", \"score\": 60, \"detail\": \"標題過短 (14 字元)\", \"status\": \"warning\", \"recommendation\": \"標題建議長度 30-60 字元\"}, {\"name\": \"Meta 描述\", \"score\": 70, \"detail\": \"描述過長 (282 字元)\", \"status\": \"warning\", \"recommendation\": \"描述建議長度 120-160 字元\"}, {\"name\": \"頁面載入速度\", \"score\": 65, \"detail\": \"Performance分數: 65/100, LCP: 3.5s\", \"status\": \"warning\", \"recommendation\": \"建議優化圖片、減少JavaScript和CSS檔案大小\"}, {\"name\": \"無障礙設計\", \"score\": 75, \"detail\": \"Accessibility分數: 75/100\", \"status\": \"warning\", \"recommendation\": \"改善顏色對比度、添加Alt文字、確保鍵盤導航\"}, {\"name\": \"Core Web Vitals\", \"score\": 70, \"detail\": \"CLS: 0.15, FCP: 2.5s\", \"status\": \"warning\", \"recommendation\": \"優化布局穩定性和最大內容繪製時間\"}], \"score\": 80, \"weight\": 40}}','2025-09-23 15:30:55'),('83055ad1-f153-4fee-88d7-5cb9d5f18aec','764d5cbe-6a3d-42d5-a099-bfd002967a79','standard','completed',100,'2025-09-05 09:09:02','2025-09-05 09:09:05',NULL,'{\"url\": \"https://figma.com\", \"score\": 80, \"preview\": {\"aiVisibility\": 65, \"contentQuality\": 88, \"technicalHealth\": 85}, \"summary\": {\"status\": \"good\", \"message\": \"figma.com 在 AI 搜索中表現良好，但仍有優化空間。\", \"keyIssues\": [\"描述過長 (172 字元)\", \"Performance分數: 65/100, LCP: 3.5s\", \"Accessibility分數: 75/100\", \"CLS: 0.15, FCP: 2.5s\"]}, \"aiVisibility\": {\"items\": [{\"name\": \"Schema 標記\", \"score\": 20, \"detail\": \"未發現結構化資料標記\", \"status\": \"critical\", \"recommendation\": \"加入 JSON-LD 結構化資料以提升 AI 可見度\"}, {\"name\": \"社群媒體標記\", \"score\": 100, \"detail\": \"完整的社群標記 (15 個)\", \"status\": \"good\"}, {\"name\": \"FAQ 內容\", \"score\": 50, \"detail\": \"未發現 FAQ 或問答內容\", \"status\": \"warning\", \"recommendation\": \"加入常見問題解答以提升 AI 查詢回應\"}, {\"name\": \"內容可讀性\", \"score\": 90, \"detail\": \"句子長度適中 (平均 13 字/句)\", \"status\": \"good\"}], \"score\": 65, \"weight\": 30}, \"contentQuality\": {\"items\": [{\"name\": \"標題結構\", \"score\": 100, \"detail\": \"良好的標題結構 (H1:1, H2:9, H3:11)\", \"status\": \"good\"}, {\"name\": \"內容長度\", \"score\": 70, \"detail\": \"內容偏短 (約 531 字)\", \"status\": \"warning\", \"recommendation\": \"建議增加更多有價值的內容\"}, {\"name\": \"圖片優化\", \"score\": 80, \"detail\": \"89% 圖片有 Alt 文字 (56/63)\", \"status\": \"warning\", \"recommendation\": \"為所有圖片加入描述性的 Alt 文字\"}, {\"name\": \"內部連結\", \"score\": 100, \"detail\": \"有適量的連結 (75 個)\", \"status\": \"good\"}], \"score\": 88, \"weight\": 30}, \"upgradeReasons\": [\"獲得 30+ 項技術指標詳細分析\", \"查看具體競爭對手表現比較\", \"獲得個人化優化執行計劃\", \"追蹤改善進度和成效監控\"], \"technicalHealth\": {\"items\": [{\"name\": \"robots.txt 配置\", \"score\": 100, \"detail\": \"已允許搜尋引擎爬取\", \"status\": \"good\"}, {\"name\": \"HTTPS 安全連線\", \"score\": 100, \"detail\": \"使用安全的 HTTPS 連線\", \"status\": \"good\"}, {\"name\": \"行動裝置優化\", \"score\": 100, \"detail\": \"已設定 viewport meta 標籤\", \"status\": \"good\"}, {\"name\": \"頁面標題\", \"score\": 100, \"detail\": \"標題長度適中 (46 字元)\", \"status\": \"good\"}, {\"name\": \"Meta 描述\", \"score\": 70, \"detail\": \"描述過長 (172 字元)\", \"status\": \"warning\", \"recommendation\": \"描述建議長度 120-160 字元\"}, {\"name\": \"頁面載入速度\", \"score\": 65, \"detail\": \"Performance分數: 65/100, LCP: 3.5s\", \"status\": \"warning\", \"recommendation\": \"建議優化圖片、減少JavaScript和CSS檔案大小\"}, {\"name\": \"無障礙設計\", \"score\": 75, \"detail\": \"Accessibility分數: 75/100\", \"status\": \"warning\", \"recommendation\": \"改善顏色對比度、添加Alt文字、確保鍵盤導航\"}, {\"name\": \"Core Web Vitals\", \"score\": 70, \"detail\": \"CLS: 0.15, FCP: 2.5s\", \"status\": \"warning\", \"recommendation\": \"優化布局穩定性和最大內容繪製時間\"}], \"score\": 85, \"weight\": 40}}','2025-09-05 09:09:02'),('e3d033fb-7b0e-4ece-ad1a-c3789d9cbf49','d39f35c9-4c43-4ce8-8f3b-ae29f32ea21b','standard','completed',100,'2025-09-15 15:58:26','2025-09-15 15:58:27',NULL,'{\"url\": \"https://blitzgame.app\", \"score\": 64, \"preview\": {\"aiVisibility\": 60, \"contentQuality\": 48, \"technicalHealth\": 80}, \"summary\": {\"status\": \"warning\", \"message\": \"blitzgame.app 存在一些影響 AI 可見度的問題需要改善。\", \"keyIssues\": [\"標題過短 (14 字元)\", \"描述過長 (282 字元)\", \"Performance分數: 65/100, LCP: 3.5s\", \"Accessibility分數: 75/100\"]}, \"aiVisibility\": {\"items\": [{\"name\": \"Schema 標記\", \"score\": 20, \"detail\": \"未發現結構化資料標記\", \"status\": \"critical\", \"recommendation\": \"加入 JSON-LD 結構化資料以提升 AI 可見度\"}, {\"name\": \"社群媒體標記\", \"score\": 100, \"detail\": \"完整的社群標記 (7 個)\", \"status\": \"good\"}, {\"name\": \"FAQ 內容\", \"score\": 50, \"detail\": \"未發現 FAQ 或問答內容\", \"status\": \"warning\", \"recommendation\": \"加入常見問題解答以提升 AI 查詢回應\"}, {\"name\": \"內容可讀性\", \"score\": 70, \"detail\": \"句子過短 (平均 7 字/句)\", \"status\": \"warning\", \"recommendation\": \"適度增加句子內容深度\"}], \"score\": 60, \"weight\": 30}, \"contentQuality\": {\"items\": [{\"name\": \"標題結構\", \"score\": 20, \"detail\": \"缺少 H1 主標題\", \"status\": \"critical\", \"recommendation\": \"每個頁面都應該有一個 H1 標題\"}, {\"name\": \"內容長度\", \"score\": 30, \"detail\": \"內容過短 (約 58 字)\", \"status\": \"critical\", \"recommendation\": \"建議內容長度至少 300 字以上\"}, {\"name\": \"圖片優化\", \"score\": 80, \"detail\": \"頁面沒有圖片\", \"status\": \"warning\"}, {\"name\": \"內部連結\", \"score\": 60, \"detail\": \"頁面沒有連結\", \"status\": \"warning\", \"recommendation\": \"加入相關的內部連結\"}], \"score\": 48, \"weight\": 30}, \"upgradeReasons\": [\"獲得 30+ 項技術指標詳細分析\", \"查看具體競爭對手表現比較\", \"獲得個人化優化執行計劃\", \"追蹤改善進度和成效監控\"], \"technicalHealth\": {\"items\": [{\"name\": \"robots.txt 配置\", \"score\": 100, \"detail\": \"已允許搜尋引擎爬取\", \"status\": \"good\"}, {\"name\": \"HTTPS 安全連線\", \"score\": 100, \"detail\": \"使用安全的 HTTPS 連線\", \"status\": \"good\"}, {\"name\": \"行動裝置優化\", \"score\": 100, \"detail\": \"已設定 viewport meta 標籤\", \"status\": \"good\"}, {\"name\": \"頁面標題\", \"score\": 60, \"detail\": \"標題過短 (14 字元)\", \"status\": \"warning\", \"recommendation\": \"標題建議長度 30-60 字元\"}, {\"name\": \"Meta 描述\", \"score\": 70, \"detail\": \"描述過長 (282 字元)\", \"status\": \"warning\", \"recommendation\": \"描述建議長度 120-160 字元\"}, {\"name\": \"頁面載入速度\", \"score\": 65, \"detail\": \"Performance分數: 65/100, LCP: 3.5s\", \"status\": \"warning\", \"recommendation\": \"建議優化圖片、減少JavaScript和CSS檔案大小\"}, {\"name\": \"無障礙設計\", \"score\": 75, \"detail\": \"Accessibility分數: 75/100\", \"status\": \"warning\", \"recommendation\": \"改善顏色對比度、添加Alt文字、確保鍵盤導航\"}, {\"name\": \"Core Web Vitals\", \"score\": 70, \"detail\": \"CLS: 0.15, FCP: 2.5s\", \"status\": \"warning\", \"recommendation\": \"優化布局穩定性和最大內容繪製時間\"}], \"score\": 80, \"weight\": 40}}','2025-09-15 15:58:26');
/*!40000 ALTER TABLE `scans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `third_party_integrations`
--

DROP TABLE IF EXISTS `third_party_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `third_party_integrations` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `integration_type` enum('zapier','make','slack','teams','discord','telegram','email') NOT NULL,
  `name` varchar(255) NOT NULL,
  `config` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `credentials` json DEFAULT NULL,
  `webhook_url` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_sync_at` timestamp NULL DEFAULT NULL,
  `sync_status` enum('success','error','pending') DEFAULT 'pending',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_organization_type` (`organization_id`,`integration_type`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `third_party_integrations_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `third_party_integrations`
--

LOCK TABLES `third_party_integrations` WRITE;
/*!40000 ALTER TABLE `third_party_integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `third_party_integrations` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `tracking_settings`
--

LOCK TABLES `tracking_settings` WRITE;
/*!40000 ALTER TABLE `tracking_settings` DISABLE KEYS */;
INSERT INTO `tracking_settings` VALUES ('18c71cd9-5282-46e0-9606-cb111e474f6f','8209b96f-2055-4b90-b62b-6000e7b94c85',1,'hourly','[\"gemini\"]',0,5,'[]','{\"updatedBy\": \"379033b5-d5b2-4c86-bc8b-55fe3b9b4192\", \"lastAccessed\": \"2025-09-23T15:44:19.746Z\", \"websiteCount\": 2, \"planLimitations\": {\"maxPlatforms\": 2, \"maxAlertEmails\": 1}, \"lastConfigUpdate\": \"2025-09-23T15:42:45.428Z\"}','2025-09-23 11:18:43','2025-09-23 15:44:19'),('dda0f03c-3c4f-4564-b220-eed37cedc6d4','b0a50730-02c4-4028-8d11-8ad4b033de80',1,'hourly','[\"chatgpt\", \"claude\"]',0,5,'[]','{\"updatedBy\": \"90626a44-5d32-4704-a4ac-6e3cb71ef5ce\", \"lastAccessed\": \"2025-09-23T11:29:50.009Z\", \"websiteCount\": 6, \"planLimitations\": {\"maxPlatforms\": 2, \"maxAlertEmails\": 1}, \"lastConfigUpdate\": \"2025-09-23T10:38:29.615Z\"}','2025-09-23 10:29:15','2025-09-23 11:29:50');
/*!40000 ALTER TABLE `tracking_settings` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `user_organizations`
--

LOCK TABLES `user_organizations` WRITE;
/*!40000 ALTER TABLE `user_organizations` DISABLE KEYS */;
INSERT INTO `user_organizations` VALUES ('0862c8a6-35c7-4159-a122-5cee28d08b1f','ce73c890-d0fe-41ef-8866-d190e850b598','fe7d180c-6dfa-439a-83e8-554c76d18f87','owner','active','2025-09-07 05:57:58'),('0b246cd0-73f7-4ca7-a6b0-87ae6fef89d4','e546cc57-5930-4632-ad0e-1011f65f15a1','83beb62b-13db-4f34-8c38-8c908c6254ef','owner','active','2025-09-04 07:47:17'),('0b71d891-12d1-4e29-a892-f1fb6d9a21c2','bce62a38-d1bb-4e41-8bb8-027d60d03566','47ce3765-9c1d-41d6-bebb-c4dc799ccc53','owner','active','2025-09-06 13:43:25'),('136aea28-4dbe-4392-b8aa-18806fe7e523','caacab5c-28ac-462a-8fef-99fa440c5173','7f24b33b-cf82-4c62-833f-863cc148d806','owner','active','2025-09-07 06:31:46'),('1461e7ca-7be8-452e-bc6b-8d48ab9a5836','3e94ae9b-c07a-430d-8222-9950902608c4','703dd915-ca93-414c-8b60-d0ee57310140','owner','active','2025-09-03 18:19:01'),('14c75a17-8fba-4621-866e-bc1327352550','560b2cdf-5a3b-4f84-9e4b-a4de8355bf51','edef9495-5f4c-4201-b87f-6b74e8199ec9','owner','active','2025-09-05 19:10:25'),('151400c1-6d5e-4020-8465-90dc3148a968','48782049-269f-4ff6-8a51-a1d8f3a554ce','c6f7b9f2-54c0-4f67-93ce-0de4e4545979','owner','active','2025-09-06 06:39:00'),('16f0d5b3-11a5-4f9c-8768-470469d47820','5a62d8c4-796b-4ae8-a556-4e449ec05d91','8f3b4cec-5d15-4a2a-9e7f-020026bd29d6','owner','active','2025-09-07 06:33:11'),('17ea498d-9593-46cf-a23a-4b8d685940a1','bd5d8331-1634-48e0-9a49-3b2811bcfa53','b93664af-42b4-4efe-af44-b906fc556446','owner','active','2025-09-06 06:33:48'),('17fb2536-ce44-4551-bb9f-32865a515960','819ec580-0bd3-42aa-a866-ced1833bcc13','181d6bce-e424-42f5-8965-ec4add0972c5','owner','active','2025-09-07 06:49:27'),('1a542bfe-8260-47f8-9ba2-9f7b0a3358dc','96167e5d-39cd-4227-b078-e39b6e47b196','4d7c851a-2b46-49f4-800d-e1c3f3655f3f','owner','active','2025-09-06 13:53:44'),('1bfe3ba4-b4b7-42c8-9f11-e6ec296b0901','ba8b29f1-5c01-4425-ba76-40a210bc1ba8','379fdae6-a56f-47a9-a1e1-9eb685c6829c','owner','active','2025-09-05 16:56:24'),('1c44fa44-10c4-4c43-ad98-68d9325ad47c','6549ed39-eb0e-49b5-88e7-78f3fa3a31cc','9d61634a-e20d-4b4c-a7ca-389f60eb744e','owner','active','2025-09-06 05:54:33'),('1e92dcad-f1ad-40ee-869f-6ff08d40beb2','2b444d7f-2982-4d51-9a5b-eee70bcbf34b','4300d634-7682-415e-8fb5-9f2ef182f81c','owner','active','2025-09-03 18:19:39'),('21baed28-c677-4897-9de7-d6cd73f7eebe','36cb5c76-bc09-4b5d-9142-977fc5d8a1fa','16f13c9c-18d6-4728-9b6f-687eddbdbd08','owner','active','2025-09-04 17:35:35'),('247af0ef-1b28-4c3b-879e-6c4b3b84a53e','5486d07b-3fbf-484f-abcc-2fc8009f39dc','43b6d36e-0626-4579-ac4d-c0ba059a7f61','owner','active','2025-09-06 05:54:33'),('24cb9e14-29e3-4a3f-b34f-effa25255e10','51198fd4-f924-44fe-a533-7f720d3045d0','84b192cf-d346-4341-a91b-23ece0dde801','owner','active','2025-09-03 18:20:15'),('24f56af4-7b6a-4a54-8c53-c14379b8e9e1','6afaf587-06fb-4a2a-b7d3-4845eb079186','f10c5c67-5e74-4c7f-a964-d4223dd77fe9','owner','active','2025-09-06 18:20:04'),('25fc7e5e-289b-46df-bac1-729321830ed0','5d1fa775-a1ae-457d-af79-88889573c199','0333eda6-fd27-4a6c-8ff1-67e604fb53c3','owner','active','2025-09-06 06:01:25'),('2ac26443-fe94-422f-92aa-2f426c678329','1b6b1e7b-121b-4c10-80d1-d808c60040f2','aed7314d-f140-42b7-98a4-400753ad81c5','owner','active','2025-09-06 11:03:36'),('2cca34bb-0b69-427a-863c-02c704097971','8a6d3b6c-4bec-46a2-9d9f-10b4462876ae','5c7abf6d-f042-427f-9596-5b1334456284','owner','active','2025-09-05 17:44:07'),('2efabdcf-6e8f-443d-b09b-9ea63dc149ca','c8a8053a-4011-4ccd-88b4-8e5ec70d7d58','19334578-e269-4962-b0f1-d57dff32a367','owner','active','2025-09-04 14:55:46'),('30372451-1ca9-43f1-939f-dfa9b47a09da','344eefac-6a1b-4184-b786-18f51b79250d','7461f0c7-7aca-402f-baf0-1f316827d9a9','owner','active','2025-09-08 15:53:21'),('30473599-f18a-4c13-99e7-4b5b3a052c64','944b5522-1bbc-4bc4-b929-dd996d8ce81c','c2af9065-226d-47b0-bbc8-4962f50a640d','owner','active','2025-09-03 18:29:59'),('33de4547-6570-4b7f-8b40-70a8d572c5c4','a6e1cf32-9817-4cd3-88ba-104bc916d2ab','2df8b135-c364-4dd4-8635-994f3bf9434b','owner','active','2025-09-06 11:17:46'),('34a72d74-258c-4e7f-91c7-962b21e15882','001d6844-827f-4dba-8de9-1c599837ce16','ff170e07-c99f-446f-a941-275380ecc4c3','owner','active','2025-09-06 13:06:55'),('34f08197-3924-4427-95e1-6abdce9a07ea','1394ef08-8a23-40df-9d7b-f2c11f740f2e','36d3cabf-67c0-4bee-9d2c-f29940ca664f','owner','active','2025-09-05 17:47:02'),('37e6db6a-a063-47ac-889e-ff1c8ade8b1c','423abbbf-d4ef-4744-a1bf-61f3575b3bbf','ba959b78-8ee9-448d-9f5e-ad3b34b4b27b','owner','active','2025-09-06 12:15:21'),('3833c4b2-4350-4925-becf-31cbbe013fe8','d959b8ea-410e-4700-81e1-fcfdd929d6ee','b04e30d1-e9ad-4f33-80e3-749331f1004f','owner','active','2025-09-11 00:33:20'),('399b20b0-a772-4876-8fc7-23025d784b77','a2a747a9-f2fc-49ba-8c1b-54c29c1f876b','0bbd60f2-957d-490c-ade1-9d56b4efa3d2','owner','active','2025-09-06 06:59:35'),('3cf2cbfe-0684-427f-88b7-9467e7df97f8','464b7b14-1cff-4348-af7e-9c1194991df7','45459b41-614e-4dc1-aff2-f67d31f8dc60','owner','active','2025-09-06 06:38:59'),('3e632ac1-1824-4a27-a6de-db9c996e4bff','0fa9d605-36fc-49e2-be76-274ee1c8d242','7736ac05-edd2-4e1c-ad1b-45ecdfce9473','owner','active','2025-09-11 00:35:25'),('3e771c1a-878b-4cda-8e53-b560f77400a7','1bf839e3-4e24-448f-a159-c272291413e9','2d762e9a-cb46-4d76-a71a-02f3b43c8075','owner','active','2025-09-06 18:16:44'),('3f15cd9a-0e67-40a3-998b-9103db0ac031','2ab9f10f-feff-4acc-bed7-76f3e3ed2975','8f02b73b-c82f-4543-b1e2-d1e0bf3991e8','owner','active','2025-09-04 07:45:43'),('405ec312-c02a-4947-bcee-9e297411e017','82fdf17c-3fcf-4873-9890-d088bf29cf8b','f2042266-b143-4167-9d63-5a744b0f4607','owner','active','2025-09-07 06:38:19'),('4103d12e-06de-4010-b96e-25e1d24726b2','17f8c7be-20da-48a1-a7a7-3ad747bd5e60','99e6221d-9970-4804-96ef-b3962e4cc39d','owner','active','2025-09-06 06:40:33'),('429c83bb-e89b-4adb-ba1a-7b047e6ce661','43a16659-65c8-430a-8c84-22c5d88803be','5adcdf92-2c59-4bfd-ab54-ad57117a21aa','owner','active','2025-09-06 11:43:38'),('444f6ad0-1283-4346-b4dc-4ad6647f7717','de70342a-5a3c-45b5-ac36-c36bccb4f921','2ef8d08a-ec59-473d-8c8b-dfac906c3b18','owner','active','2025-09-06 11:03:09'),('44cacfb1-dc4b-4665-aa31-09f875818f36','c248f150-8ec8-4686-8aa7-42b0e95c5f4a','a34c8fce-5762-4a50-a80d-2e3a548cc252','owner','active','2025-09-06 12:06:37'),('45e79c6a-cc6b-4d14-b0cc-7f69afb16ff0','cb41b39a-73b2-4a1c-a2dc-80a6dc95d9c3','dfdff618-2f0b-414d-bcee-2156241b6bc2','owner','active','2025-09-04 07:41:55'),('4c7a0083-6a76-456f-b26c-58fedfb7331d','81470143-a844-4b98-9793-f86f85efb697','3e70d8f1-c13c-4817-9157-f0dc556d2ecc','owner','active','2025-09-06 11:12:33'),('4ce4d2de-93dd-46e9-b661-e9bcf63c298a','87ea071c-2a27-49c2-9b2b-661a3506055c','0a8444ea-0981-4648-af15-3a722545d2b8','owner','active','2025-09-11 00:49:18'),('4e22903f-6c95-467e-aa2d-7f459ed29e96','5c732a66-70cb-4b24-9153-049c7fbbc13b','a81bde18-ec4a-4f15-8910-97edafebc723','owner','active','2025-09-05 19:11:12'),('4edd9fef-fbc8-4300-953a-de8cad24a228','b9f6db5a-e1ca-4667-b00b-d17134b7c99b','5b830272-cfe7-4aca-9410-380257662cea','owner','active','2025-09-06 11:09:02'),('5189d5f0-e44a-4254-9390-df6a4120f29d','76d52ca4-d7c3-4249-befe-40fd006e77ce','858b5266-95aa-4659-a311-f9908e07d54e','owner','active','2025-09-06 06:01:25'),('530ecf33-63cb-49eb-9a51-ba20c6f151d9','ec212b7d-31f1-4abb-a380-4bf0f185b04a','23faa13a-ec60-4054-8169-070ea49588f8','owner','active','2025-09-06 06:33:49'),('57b65886-0de8-443c-95b1-516fbd5384fe','785472f7-cb10-48ce-97bf-23f786941fdd','cd9cf6b9-fffc-4f4f-a376-301558479349','owner','active','2025-09-07 06:47:56'),('58675a4e-b92d-4fb6-9cd3-ce4e53fbf2f2','cabbbf33-7686-4de4-91e2-61f8c0cd6874','e929fc48-59c4-4804-98f4-8272a38c4111','owner','active','2025-09-08 15:53:10'),('59f11c0a-531a-435b-a817-0a9c52c7dc19','78ef81da-4776-4331-add0-009c2c95b8b5','6516c31c-abb0-4ebf-992b-559ce64a4c1e','owner','active','2025-09-03 18:28:44'),('5fe1a583-405e-42d5-8041-44d8c794c36d','ab12fce7-5be6-4e97-a050-2cef50024ccd','33ec2916-a81d-4c25-91fe-beb59a3a4e4a','owner','active','2025-09-06 06:25:02'),('61b2c513-5573-41f4-8374-842c343ab06e','122d5e43-fc15-43e2-bd88-79791642b2f5','5842a90e-cfcc-441f-ac14-986d60bb5d6d','owner','active','2025-09-07 06:29:37'),('6c6572a1-b4ae-48c7-8da3-d48a6542d08b','b61b8546-9e9c-4e11-ba3c-be0625e74d53','7f21f5f7-ec60-43ba-a7f5-94ab25da5130','owner','active','2025-09-06 12:08:08'),('6c8ef862-bb25-4bc1-9773-47454ca82526','67426110-01ea-42e1-a166-b8ec5c72a3b8','45c5b7b6-b455-433a-9f09-d2f703b54f6f','owner','active','2025-09-03 18:17:10'),('6d036351-340e-4fa4-97b5-ee526cac3545','afb95c49-e4c5-4143-8b29-5b3b90f6f412','b1126468-8976-4027-aa2e-dfd3c7fb14cd','owner','active','2025-09-06 18:15:52'),('6d94c43f-6186-431d-b92b-6548e4c0634c','b1f4ad60-af3e-4042-9c28-48aca038480b','6ef04076-e8f8-4651-9284-a971b7dd3830','owner','active','2025-09-07 06:37:19'),('6e29eb2f-796a-471f-9df3-aa761eadd3dd','97bd23ba-b82c-418a-b370-dd628933d552','54f95a97-8403-466f-bc98-8f1803452b09','owner','active','2025-09-08 15:53:14'),('6ee9ab60-0190-489e-af30-fe31dcc9bd7a','c874a5d9-6999-41e3-9623-e6cb8dba4dd4','d3e4ec9a-8b35-4d4c-89e5-22a0aacc9a2b','owner','active','2025-09-05 10:58:24'),('6f3db2c4-e923-48e1-a80f-95bb464f127b','fb0137e1-40c4-4437-b9aa-ab2022ab86dd','b78fe594-3193-456d-a02c-543cec76fd93','owner','active','2025-09-06 13:39:46'),('70184dcd-5c55-4228-956e-a92fea5dcd41','39561542-059d-4fc0-809e-58b1c6d33f9b','fbb9753d-4f22-4e6f-b0b2-5b85a681c5c7','owner','active','2025-09-11 00:36:59'),('71470ba1-eb3e-4ea2-aba1-217a49d3b0ad','7b4d400e-6dca-4a15-b3de-066d208867c2','bb053649-b276-4e6f-ac66-ee29f3963777','owner','active','2025-09-06 11:04:43'),('74caa4b7-d3a3-4f21-8bef-bde532aeea3d','9712f7c0-0b83-4ca1-8304-b2b9aa212fcc','aa9b3ff9-a867-4f9a-afce-00fc7e6ab0bc','owner','active','2025-09-07 06:27:10'),('76474f55-3379-4e91-a74b-bcb21ca508f0','016db8d0-2d0a-469d-9a0f-4fbca1cb1dbf','c50b60ae-d9a5-4f6a-a0d9-3f3f044afca0','owner','active','2025-09-06 18:43:14'),('76cf84c5-68d4-4610-af1b-1486a3f08efd','afe57ef4-2fae-4fc6-951c-bf4532e4b353','fb1ae0f6-6b29-4801-af32-936bc68057cc','owner','active','2025-09-07 06:38:02'),('797418a0-3026-462d-be39-fa122dbfb62d','4de4e78a-67cb-4b00-8987-b99a77d431f8','fc553199-25d2-4b66-aecd-dbf4916a0a9e','owner','active','2025-09-06 11:11:20'),('7d673110-a04a-4dcf-a45b-4213f0fb43b5','1605ea35-d390-47f2-817f-ae6039fe6187','96d2c4ae-a6ea-49ce-beea-74fcb677a8e6','owner','active','2025-09-06 10:58:05'),('7faf807d-ee7c-45ca-ac09-289d0ce9385c','12db6e73-95b2-4ab8-abad-5372d5c81790','9bb441cb-e308-4d59-89b9-11f2d0c81f1a','owner','active','2025-09-03 18:17:48'),('832d5913-94fd-4675-92d6-62b89c7b7813','aee43025-85bd-4b35-85e5-27c58ad8ba12','d768b339-0831-4c3e-8024-7306a354a270','owner','active','2025-09-11 00:14:05'),('835786e4-484f-4d8d-af68-00b1eef57b96','ea3310c3-163d-4d3a-a4db-52c74bcfd393','76753607-8159-4387-ad20-c2b25bc3b9fd','owner','active','2025-09-06 18:13:18'),('873adfce-6081-420d-bd55-48d06bc5a096','8e27019f-1777-4627-9061-ddc58500ec1c','15a98c53-5bdc-49fd-bc36-a2c3b7d80a94','owner','active','2025-09-06 18:21:57'),('87e65bf3-0a52-4a63-91ea-196d948774fe','c480cb1f-8d8f-4177-bf3e-8d7bf121b96f','deb0b9ca-6b02-47a5-a187-2123413ebc9a','owner','active','2025-09-04 07:45:38'),('8a831b5f-06b4-483a-ae43-5d2c01c6a279','ab403c4f-e5c5-4236-aee9-c222990766d7','e897630b-ce74-4ca9-b167-2e664c2a94b4','owner','active','2025-09-03 18:22:38'),('8b95395a-4f05-4355-bfe3-3a8df20aef8f','ba8b08cb-5b71-4648-9339-94bfa59ec4b1','df41d2ab-95e1-42de-9e97-8cf7ee26d376','owner','active','2025-09-07 05:37:44'),('8ee21106-bdb0-41bc-a4ba-ddcb9a59127f','5b757f6f-968f-4c3b-9575-20816af984bc','3c063da7-fad1-4cee-9761-bdfc80f93862','owner','active','2025-09-06 11:09:22'),('8ee7fa70-0ac6-4776-b993-3a2551466f63','938af19a-9024-4bbd-b02d-d4604b5828ea','48131a8f-a392-48b8-99b5-b3ca860d272f','owner','active','2025-09-05 19:09:57'),('958244ae-deb4-4c2f-a11e-494df05bbdef','164618fb-a8be-452c-b99d-045515842572','fdd9ecaf-3387-487e-9729-5901d377fe9b','owner','active','2025-09-06 11:02:14'),('974e97d9-5f20-4a67-b0ef-beed2dc9ed6c','c8e9ba6d-ebcb-4441-b805-f4e352f8cdb5','f8e338fc-0d39-4fd6-abd5-d0c975643034','owner','active','2025-09-06 10:59:48'),('97c12d97-1e37-4e60-886d-237d63f87adc','c4735160-68fc-4dda-b62b-888d31144a60','25d494be-2ec4-415c-a7de-6fc4ead58005','owner','active','2025-09-11 00:46:04'),('9943367a-827d-4cf5-b2bd-1687adaa4258','0185d488-468f-4ae5-82ac-e6eac948d41e','2d43925b-32af-4080-b1d2-f42f3bfa8ab3','owner','active','2025-09-07 06:27:58'),('99534441-12a2-43bf-894f-5a057a1be9af','0eb6c162-aa95-4941-b817-4aa4df6db91b','1d69dd19-d609-4828-bd3f-4845c1ed17c6','owner','active','2025-09-06 06:51:00'),('999f8b86-5328-421d-bdf8-bf68c2a0059e','f66b82d2-bd59-487e-94d1-f41c5df94d2a','9580c8a2-3dfa-488b-badd-f123fee48580','owner','active','2025-09-06 06:25:03'),('99c10303-464c-4ce8-9401-1c7746b36e1c','02587def-51a9-4579-ac3f-bdcdf8ae21bd','05c02e6d-321a-44a6-a2a3-efca3e7603fa','owner','active','2025-09-03 18:19:53'),('9af0f21b-c4ce-4156-912a-13e5a7435469','ae34187c-5f07-474f-98ec-d84e7a021639','8b84d4ce-c647-406d-880b-a7f2826b6a03','owner','active','2025-09-06 06:36:53'),('9bc7fda4-3bd2-45e0-aef7-f216c0e62dba','29c9680d-6958-4a6c-951d-069abd906d7b','3531b1d5-1c4f-44d6-ae98-ba7ba4beed38','owner','active','2025-09-06 06:59:34'),('9d7ee85a-d562-4ad3-9858-424b288ccc28','3c6c2c52-14b7-4f8d-852d-ed206dd4f29f','dbf73d35-123c-4794-80e1-4309d741a14d','owner','active','2025-09-04 17:35:09'),('a2af6182-fe16-413e-8dc3-ae3edc28e8e5','1ba8faec-3ea0-4791-9075-138927b04056','e962f076-a039-4337-8043-ffe5072e3f93','owner','active','2025-09-05 19:17:14'),('a35eded4-e90c-4395-8efd-796ead343f97','15eec598-eca1-428e-bbd3-25a24e0e1793','fa77c85c-6756-4318-b016-f5ea620a4df1','owner','active','2025-09-06 11:44:23'),('a3da6c4e-c212-4fd5-8537-643e95e6edfb','cc6b703e-dff6-4c11-a5d1-416670c238ef','43d3437e-dbdb-41a8-9af8-af3decca11b0','owner','active','2025-09-05 17:06:48'),('a5bba38a-624f-45c7-8623-62a423a2e0f5','144f0b5e-ddf6-41fc-96a8-f513d139d7cc','dbdc3403-b6d2-419b-aa1a-c5dd39e00f81','owner','active','2025-09-06 06:18:49'),('a631c6de-fafd-40d8-8ae4-a7374673fadf','f3ef38c5-c0a4-452d-b8ad-007ab052c651','4b903874-a95a-430a-a58e-1eeee4d14248','owner','active','2025-09-07 06:34:59'),('a689b4ac-2826-4fa5-a4ff-5199397345e0','5c28e02f-d1a9-470b-bff8-ad5d4b865928','00c5f985-8caa-4aec-9719-565530aa0513','owner','active','2025-09-03 18:17:05'),('a69911c6-96dc-459c-9933-2c4ad733571f','697dc14c-9375-4267-8fb4-e179cb2f5fb0','9bb53ab2-8ad7-45fb-97ff-531b97444256','owner','active','2025-09-06 06:18:50'),('aa083a21-c121-4bbb-acf4-925db9386b81','a53adb3b-5f63-4cf7-a9a2-b26a8572975c','0fb3020f-3e76-4ecf-a219-b06ac8ae8ec3','owner','active','2025-09-07 06:36:59'),('aa13111a-28cc-4dcc-9387-4e8c029df6dc','2cc66ccc-2d81-4d12-996f-538b17842960','715c0d5d-b373-46e5-b34c-dd90cdf464fd','owner','active','2025-09-06 14:03:14'),('ac776ca8-6370-4f5c-875c-be77ff1e5b08','87a1c42f-d6b0-4d4b-8c4f-3fa9babc5728','4f8be47e-648d-453e-9452-cd716de98377','owner','active','2025-09-06 11:14:31'),('af2c09c4-09ea-4d4a-89e2-6d122d90bcbe','d8ec404d-07f9-4717-b722-fdab85b17321','7cb07309-d54a-401d-8643-c2c2a9236ac8','owner','active','2025-09-11 00:38:07'),('affcc82e-cd22-44e3-9d96-16395ccfe40d','81215d27-2f2d-45fb-90ff-0c59163ec3fc','9f6cc575-4f28-4ffb-bd59-da47d19b418d','owner','active','2025-09-06 06:42:52'),('b01d9ca8-82ff-43ef-98fe-05decd70f00b','3bb4a71d-c691-454f-9b71-0f82fac21a75','458fad51-9d00-4903-a676-50460532c5a6','owner','active','2025-09-07 06:36:11'),('b080c667-2a41-470e-9e91-e11a2dd15b37','8d99f2bb-f358-4745-bf77-13715288459f','4350d885-7186-40f5-94be-0f19d1a5e159','owner','active','2025-09-11 00:47:29'),('b0df9368-0586-4d19-9b78-a2009fe3f83b','501ac4f8-4f4a-43e6-bfdd-26d661a479ce','6bcb5fd7-c4ae-46e8-9a85-6a76e006e81f','owner','active','2025-09-06 13:55:55'),('b4fa5fc2-a0d3-4ec5-bced-2a73a894de1c','4c9ac8ea-60ec-4579-88b5-fae59574760b','3bbc0c65-0ac5-4455-9b8f-04c13c22d2f0','owner','active','2025-09-06 11:09:09'),('b7607f8e-f4fb-4056-84af-27bed53e7da2','cbd64192-b853-40b6-a499-95707e0778b4','ce638fcf-cde0-4c6e-89a4-0acc4d620cb0','owner','active','2025-09-05 19:09:10'),('b7b0340f-6389-4d17-b9ea-9c16c455d9a8','1c11e730-2e5f-44b1-808b-9f9a09b1f8e1','c03e8beb-575b-47c0-aa9f-7783aa159141','owner','active','2025-09-06 10:59:28'),('b86b9308-1d9f-4267-a00e-7251c6262e90','52c2954a-4836-4099-8c21-ab98f449dd7d','ba985bcd-46ca-4814-b9fb-399605a6c966','owner','active','2025-09-07 06:53:11'),('b8be0801-a8c4-4692-b2f5-ae4ad77bd1a6','58b53d52-2327-4d19-a105-b9789a6fe010','11c744dd-2972-4543-ba27-757722097880','owner','active','2025-09-07 06:05:46'),('bd18db52-2937-48a0-b30f-0df5fad26d39','0b17f950-75d7-4efb-b9a3-1e962d4ae9b7','24b45569-f971-4545-a9ff-0f24a96124d3','owner','active','2025-09-05 17:06:21'),('bdd965b3-a28d-481c-bb09-e80355bdaa36','5d0e1ecd-e62c-448b-beaf-6e5e2a939561','c9d565e7-01a3-486b-99a1-9c2f8cde4e00','owner','active','2025-09-05 17:08:11'),('c1ffff44-e7c9-4f74-9e1a-c8aafbcf6df0','8b6ba523-810e-4eac-93c3-be083a4e99a5','483185f2-24f7-44bc-8492-40cd63650f89','owner','active','2025-09-07 05:36:35'),('cb3c5f3b-c8b9-45d9-a13a-204c8a939709','3a9592e3-ddec-4699-80fd-7f5f469a22ff','1e0af5b2-f15d-4a53-866e-254db4057189','owner','active','2025-09-03 18:22:05'),('cd38aca1-4f94-4772-8561-172cdebbfdaf','f58aae1e-5c16-4a17-b1ef-fd45bb956143','be571007-aa78-48a1-9178-00113255dc10','owner','active','2025-09-03 18:15:38'),('cf2a9556-0180-450f-b616-aa7c4b6e7b2d','21d3f9f6-ff71-4352-bbef-a12322e6462f','3e135802-038d-4896-805b-b5cebd29edba','owner','active','2025-09-07 06:56:21'),('d00af7ac-2fef-4e9e-8306-64a0cece4af1','a082ac3f-71bc-495e-8a9f-20ce0401a8ec','9f05e49a-4388-4ff6-90a6-58a5c55ef03f','owner','active','2025-09-04 07:48:05'),('d1f1a370-55f2-4417-b2ef-ae21a626686c','f72feeb6-24f1-4d03-9f26-8799aea23598','f8567f0e-b5fe-4ecd-94b0-5df6943e78c0','owner','active','2025-09-06 13:48:33'),('d1f87ff1-3fbc-4305-a7d0-cb85ab552f54','b4baa554-3b8e-47f0-9a58-2fc79d90a1f3','fea653e4-74c1-4aa7-ac7c-6301cd4c53de','owner','active','2025-09-03 18:23:29'),('d3722820-dcb5-400f-ac22-c8789823f572','94f50c03-be21-4290-8756-8695505ca97b','5849c106-fccf-4df8-bfa0-67c1cac76cd1','owner','active','2025-09-06 06:42:53'),('d42379f8-da18-4074-a306-66ecc6e4edc9','1db0365a-4302-4285-b320-93c9ac1fadd4','777f4666-ebf8-4d4c-ac29-dd83cceef52e','owner','active','2025-09-06 18:17:19'),('d5cab681-3f8c-43b3-9fb5-d9b62c21af56','30933757-9a7b-40c5-a212-b752c0824911','1a8add54-9e40-48b7-8022-62edc0586d1c','owner','active','2025-09-06 06:36:54'),('d76737a4-ec98-4401-9dc5-008c77955a5c','0f47d91c-f56e-4aa9-ac1a-e87b62b27a55','13ebd03d-be1a-44b2-b809-ddae4ffdda40','owner','active','2025-09-03 18:18:56'),('dc933e47-43cb-4ae9-bd1a-0f9cb1e89446','94643905-9483-46eb-baa4-8e991e20c6b8','2ea67652-5682-40c9-b02b-6714ad110b7a','owner','active','2025-09-06 12:05:22'),('ddfd9883-8b88-4a5a-a957-1e9442a2906c','d1856834-040c-428f-815d-1d54c3531bf5','470932b6-f68e-41b5-9908-e1cd68604fbf','owner','active','2025-09-11 00:51:12'),('dee7971e-b86c-4177-83fd-67e8c4b64e57','379033b5-d5b2-4c86-bc8b-55fe3b9b4192','8209b96f-2055-4b90-b62b-6000e7b94c85','owner','active','2025-09-11 00:58:35'),('e238b3e8-6c79-4a1f-9a62-26b6d5e58d22','9d553c83-28a1-4755-a476-a9b2cf08792b','5cba89ce-0cb3-4de6-b049-3a656fd1d90b','owner','active','2025-09-06 18:27:10'),('e642cfb5-b6b8-43ba-9b0a-dbd2bdf43f78','8179427a-6bdb-4250-a393-1424bb0a124e','e7d33256-71d7-48cf-b817-7c2086d3b23a','owner','active','2025-09-05 18:04:04'),('ea846da5-0f97-46b2-84ac-e62ac6c527fb','ef6503d1-6a22-42b2-8057-eb6a2c991b91','9e827c28-36b7-48d1-af14-644bfbc7bef3','owner','active','2025-09-06 14:04:56'),('ec4a13bd-2b69-4ad0-8631-856ca962c68e','007f0833-cd98-46db-a7fe-a44bc6fc7934','19f5e1b5-65ce-4a7a-9838-2c7c9640eac6','owner','active','2025-09-06 12:26:45'),('edb13001-fcbd-4baf-9c16-8440ebbdcf81','a167e95c-ef25-45c5-aa0b-3e160951e3a7','cd872861-7f9d-488e-a0a1-56663651f5d7','owner','active','2025-09-06 11:55:58'),('eded18a7-e71e-4cc6-a240-e5ef76f2e023','c7a80915-acaf-4509-935e-0480c8290070','fe7f5f64-c96b-45d1-984f-80b3bb3e84d5','owner','active','2025-09-06 11:02:53'),('f09299c6-439e-452c-89f4-762a289507f8','d3551597-fde7-4d57-8753-af7d4cf2a517','30dce324-cd9e-4110-9ac6-c4b5a613462e','owner','active','2025-09-06 11:58:24'),('f172edc7-dd1c-470f-853b-e9a9f2694b70','06180edc-926a-4cdc-b724-41a3145325be','60cbfdb3-5682-4d7d-b667-43a50bc7a0b9','owner','active','2025-09-03 18:29:18'),('f1a59f81-feb8-483a-940d-b1245d748fd8','90626a44-5d32-4704-a4ac-6e3cb71ef5ce','b0a50730-02c4-4028-8d11-8ad4b033de80','owner','active','2025-09-03 20:43:04'),('f5a8fe78-327c-425f-a984-f47af0669696','8c33286d-9332-4b8c-99d6-3882b460154d','741defbb-7ac3-496f-9ee7-c1cf634fb755','owner','active','2025-09-06 11:44:03'),('faffabb6-1707-481a-b2b0-b0c29558fb2a','c2712040-e601-419b-a491-955dfaef6bf2','cb02ce00-ef45-44a9-9aa2-b4c64aab75e8','owner','active','2025-09-06 15:58:46'),('fbce04af-46b9-4a73-b580-515675bc337f','af7640fb-fc37-49ef-8f52-b3cadca1f84e','240c75c1-d7ff-4364-888e-1948c4531d98','owner','active','2025-09-06 06:40:32'),('fd679b6d-c727-40bd-a8b6-1180f44fa963','c8a63fd4-3a93-433b-86f6-f8b25de3fd30','be75c6bb-8896-4e80-af31-f51d333ef100','owner','active','2025-09-05 17:43:09'),('fdecbcad-5040-45bf-b923-1e70dc2845b5','e8ea9c71-5d12-4426-b464-cd7ec84132f6','eedf11f7-e526-4063-a184-4295559a1849','owner','active','2025-09-06 11:57:58'),('fe91c98f-ce97-4cec-a4ee-cba190aff32d','c149b961-9cf0-40b8-8b8f-7da623202148','fa37d9e3-bba0-4db9-ae58-ffbd228a2045','owner','active','2025-09-06 06:50:59');
/*!40000 ALTER TABLE `user_organizations` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
INSERT INTO `user_settings` VALUES ('02587def-51a9-4579-ac3f-bdcdf8ae21bd','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('06180edc-926a-4cdc-b724-41a3145325be','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('0b17f950-75d7-4efb-b9a3-1e962d4ae9b7','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('0f47d91c-f56e-4aa9-ac1a-e87b62b27a55','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('12db6e73-95b2-4ab8-abad-5372d5c81790','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('1394ef08-8a23-40df-9d7b-f2c11f740f2e','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('1ba8faec-3ea0-4791-9075-138927b04056','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('29c9680d-6958-4a6c-951d-069abd906d7b',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"GFJDYRJSN5NSYRR7HQ2UQ7KJGNCS4TD5KR3VEZ2YH5JDY5BGKZXA\", \"twoFactorBackupCodes\": \"[\\\"4QD2AN\\\",\\\"5RMT6Q\\\",\\\"NWAXUU\\\",\\\"0TJAH6\\\",\\\"VGANED\\\",\\\"5ZLS56\\\",\\\"IEBP8D\\\",\\\"RGWZLZ\\\",\\\"OF29XP\\\",\\\"O4D1V4\\\"]\"}','2025-09-06 06:59:34','2025-09-06 06:59:34'),('2ab9f10f-feff-4acc-bed7-76f3e3ed2975','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('2b444d7f-2982-4d51-9a5b-eee70bcbf34b','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('36cb5c76-bc09-4b5d-9142-977fc5d8a1fa','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('3a9592e3-ddec-4699-80fd-7f5f469a22ff','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('3c6c2c52-14b7-4f8d-852d-ed206dd4f29f','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('3e94ae9b-c07a-430d-8222-9950902608c4','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('464b7b14-1cff-4348-af7e-9c1194991df7',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"IM7GSSDUNQVFMZ3WLJVS4N2WGJKT6P3MIFLEGT3JF44X2KLMGRVQ\", \"twoFactorBackupCodes\": \"[\\\"X58CPA\\\",\\\"ENOVWI\\\",\\\"B0LAVB\\\",\\\"26GRQ7\\\",\\\"DCZTWO\\\",\\\"D9GXXY\\\",\\\"0TZIFO\\\",\\\"8XT7VN\\\",\\\"FE85E9\\\",\\\"WB4TQ8\\\"]\"}','2025-09-06 06:38:59','2025-09-06 06:38:59'),('48bf9f7b-d73e-4668-b5ee-424939e45192','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('4f3db3f8-0858-4aee-800d-b05d7a2a889d','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('51198fd4-f924-44fe-a533-7f720d3045d0','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('5486d07b-3fbf-484f-abcc-2fc8009f39dc','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('560b2cdf-5a3b-4f84-9e4b-a4de8355bf51','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('5c28e02f-d1a9-470b-bff8-ad5d4b865928','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('5c732a66-70cb-4b24-9153-049c7fbbc13b','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('5d0e1ecd-e62c-448b-beaf-6e5e2a939561','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('6549ed39-eb0e-49b5-88e7-78f3fa3a31cc','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('67426110-01ea-42e1-a166-b8ec5c72a3b8','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('7496981c-856b-4721-992f-8115b5f9cfa9','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('78ef81da-4776-4331-add0-009c2c95b8b5','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('81215d27-2f2d-45fb-90ff-0c59163ec3fc',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"OY7EKSKHIUUG2ULGOETEO5KLJARWG5BEOVXHIU26IQ2TCMDOHRRA\", \"twoFactorBackupCodes\": \"[\\\"FKXBJV\\\",\\\"T5YWYE\\\",\\\"NFM0QI\\\",\\\"KY0C5K\\\",\\\"55T3F3\\\",\\\"C2F7ZJ\\\",\\\"JZ7NOY\\\",\\\"H3BU64\\\",\\\"CS247S\\\",\\\"B7Z7SH\\\"]\"}','2025-09-06 06:42:53','2025-09-06 06:42:53'),('8179427a-6bdb-4250-a393-1424bb0a124e','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('8764f549-d705-43c7-a001-924c67223a3f','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('8a6d3b6c-4bec-46a2-9d9f-10b4462876ae','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('90626a44-5d32-4704-a4ac-6e3cb71ef5ce','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"light\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-11 01:20:12'),('938af19a-9024-4bbd-b02d-d4604b5828ea','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('944b5522-1bbc-4bc4-b929-dd996d8ce81c','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('9707cdc9-d24a-408c-98b1-0b0d53e069bd','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('a082ac3f-71bc-495e-8a9f-20ce0401a8ec','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('ab12fce7-5be6-4e97-a050-2cef50024ccd',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"ONHUYYKTJ5LUOXTFLNAV4SSDNY5CC4LYGAUGMN2YHAYSYOJIMQVA\", \"twoFactorBackupCodes\": \"[\\\"X2MLXY\\\",\\\"BM77H6\\\",\\\"BONCNN\\\",\\\"LQHQWV\\\",\\\"4Y35WD\\\",\\\"HWZSRF\\\",\\\"V5ZRCM\\\",\\\"3R2XSO\\\",\\\"8QUHTD\\\",\\\"7CRT1D\\\"]\"}','2025-09-06 06:25:02','2025-09-06 06:25:03'),('ab403c4f-e5c5-4236-aee9-c222990766d7','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('ae34187c-5f07-474f-98ec-d84e7a021639',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"N5ITCMLSJQVDERKYOZ5GCJSGHYZHE5J6PVVXE3SIMZBFGKKHKRGQ\", \"twoFactorBackupCodes\": \"[\\\"T53XIW\\\",\\\"OIZZCJ\\\",\\\"VRFVP8\\\",\\\"XB2NG4\\\",\\\"PXEQXL\\\",\\\"MTG14F\\\",\\\"7W9PJU\\\",\\\"J9IFJG\\\",\\\"ZGIXZT\\\",\\\"TE3CRV\\\"]\"}','2025-09-06 06:36:54','2025-09-06 06:36:54'),('af7640fb-fc37-49ef-8f52-b3cadca1f84e',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"OBXUQIZXPJXTOT3CK5NXI3KSHJ3HMSJXFBCGGMRPIERXCRD5HFIQ\", \"twoFactorBackupCodes\": \"[\\\"EQ7VVH\\\",\\\"B3BD5Z\\\",\\\"J7QAGI\\\",\\\"6C4TNJ\\\",\\\"ECEJE8\\\",\\\"MN9QOQ\\\",\\\"CTQQ2A\\\",\\\"PWP0LJ\\\",\\\"5VWPIE\\\",\\\"AAGF2P\\\"]\"}','2025-09-06 06:40:32','2025-09-06 06:40:32'),('b4baa554-3b8e-47f0-9a58-2fc79d90a1f3','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('ba8b29f1-5c01-4425-ba76-40a210bc1ba8','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('bd5d8331-1634-48e0-9a49-3b2811bcfa53',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"NF5GWRRXLNTUSZKKJRHGE6LXIBZWE5L3JMTGYJCPOZ5SQ4KDNNOQ\", \"twoFactorBackupCodes\": \"[\\\"0F6QTE\\\",\\\"L91DU3\\\",\\\"W0EFZN\\\",\\\"NOOFYH\\\",\\\"9IEAAP\\\",\\\"I5HPPL\\\",\\\"AU7RAU\\\",\\\"1B3OSZ\\\",\\\"XS4TZY\\\",\\\"7Z17BD\\\"]\"}','2025-09-06 06:33:49','2025-09-06 06:33:49'),('c149b961-9cf0-40b8-8b8f-7da623202148',NULL,'{\"dashboard\": {\"chartColors\": [\"#3b82f6\", \"#10b981\", \"#f59e0b\"], \"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"en\", \"animations\": true, \"compactMode\": false}}','{\"twoFactorSecret\": \"NEQV4UZ3HB5WYPRRGZ3GMNJJNBHVWRDTF4THWQDON5PE64CQPM7A\", \"twoFactorBackupCodes\": \"[\\\"NXWJJ8\\\",\\\"J05Q0B\\\",\\\"PC61NT\\\",\\\"OZD4BT\\\",\\\"AGLFJJ\\\",\\\"M5DNFJ\\\",\\\"FE0GRF\\\",\\\"T9MFC3\\\",\\\"R6GRJQ\\\",\\\"JF5V3V\\\"]\"}','2025-09-06 06:51:00','2025-09-06 06:51:00'),('c480cb1f-8d8f-4177-bf3e-8d7bf121b96f','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('c874a5d9-6999-41e3-9623-e6cb8dba4dd4','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('c8a63fd4-3a93-433b-86f6-f8b25de3fd30','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('c8a8053a-4011-4ccd-88b4-8e5ec70d7d58','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('cb41b39a-73b2-4a1c-a2dc-80a6dc95d9c3','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('cbd64192-b853-40b6-a499-95707e0778b4','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('cc6b703e-dff6-4c11-a5d1-416670c238ef','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('d5e20474-e563-4da4-a875-30e7cead8f18','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('e546cc57-5930-4632-ad0e-1011f65f15a1','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15'),('f58aae1e-5c16-4a17-b1ef-fd45bb956143','{\"push\": {\"taskReminders\": true, \"realTimeAlerts\": false}, \"email\": {\"seoAlerts\": true, \"weeklyReports\": false, \"monthlyReports\": true, \"rankingChanges\": true}}','{\"dashboard\": {\"defaultView\": \"overview\", \"itemsPerPage\": 10}, \"appearance\": {\"theme\": \"dark\", \"language\": \"zh-TW\", \"animations\": true, \"compactMode\": false}}','{\"sessionTimeout\": 86400, \"twoFactorEnabled\": false}','2025-09-06 06:01:15','2025-09-06 06:01:15');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('001d6844-827f-4dba-8de9-1c599837ce16','test_phase23_1757164015337@example.com','$2a$10$mazrClzQGoafinoz.XmU5exSx4GE5xrqwMn8t9TcVpAJmj/RkjuXe',NULL,NULL,0,'Phase 2.3 Test User',NULL,'admin',1,0,NULL,'2025-09-06 13:06:55','2025-09-06 13:06:55'),('007f0833-cd98-46db-a7fe-a44bc6fc7934','test_1757161605095@example.com','$2a$10$V.LYMOeYr4TdamCyb43ZwOiD/3o6DrdziLbRW0hqYU4OPgRvDVsQ2',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-06 12:26:45','2025-09-06 12:26:45','2025-09-06 12:26:45'),('016db8d0-2d0a-469d-9a0f-4fbca1cb1dbf','phase3-test-1757184194145@example.com','$2a$10$izzxHERKwPq5fAr2c/SHlOGxHOE2VN7KVmjqhdH1fKWN7vZublERK',NULL,NULL,0,'Phase 3 Test User','Phase 3 Testing Company','admin',1,0,'2025-09-06 18:43:14','2025-09-06 18:43:14','2025-09-06 18:43:14'),('0185d488-468f-4ae5-82ac-e6eac948d41e','phase3-complete-1757226478815@example.com','$2a$10$Sw/CzULRrL6nn7gU9E6Cre28Ksq2..P3h6LyO0pp3OCDwVy5xZmkq',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:27:59','2025-09-07 06:27:58','2025-09-07 06:27:59'),('02587def-51a9-4579-ac3f-bdcdf8ae21bd','test_1756923593689@example.com','$2a$10$30li594CwLJGhWglIhq7S.j4A62/9aEIJoW2RplEiP.a7wu6QeVjK','$2a$10$30li594CwLJGhWglIhq7S.j4A62/9aEIJoW2RplEiP.a7wu6QeVjK',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:19:53','2025-09-03 18:19:53','2025-09-06 06:01:15'),('06180edc-926a-4cdc-b724-41a3145325be','test_1756924157821@example.com','$2a$10$Y4J0FCCMZd6UIGMMtxxP/.aNsLIuvwKZU1wT6Ekc3k6dTmluH6.um','$2a$10$Y4J0FCCMZd6UIGMMtxxP/.aNsLIuvwKZU1wT6Ekc3k6dTmluH6.um',NULL,0,'更新後的測試用戶','更新後的測試公司','admin',1,0,'2025-09-03 18:29:18','2025-09-03 18:29:17','2025-09-06 06:01:15'),('0b17f950-75d7-4efb-b9a3-1e962d4ae9b7','gemini_test_1757091980932@example.com','$2a$10$bAFg//uEfhNWe/n.6tPy3e6PGIfUEO8RVipS9rAR8NwKtUNwjzpr6','$2a$10$bAFg//uEfhNWe/n.6tPy3e6PGIfUEO8RVipS9rAR8NwKtUNwjzpr6',NULL,0,'Gemini Test User','Gemini Test Company','admin',1,0,'2025-09-05 17:06:21','2025-09-05 17:06:20','2025-09-06 06:01:15'),('0eb6c162-aa95-4941-b817-4aa4df6db91b','test_viewer_1757141460528@example.com','$2a$10$rjZdjLojZcNLbalUOL0hCekNijmdYHDfilZCR8Ejj5.mGmo5HBvVK',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:51:00','2025-09-06 06:51:00'),('0f47d91c-f56e-4aa9-ac1a-e87b62b27a55','test_1756923536397@example.com','$2a$10$RUs8hL4tPjzAv1VJhl0Gn.oOjn24IEMuNKrbIywZ68YN0LU4lSMom','$2a$10$RUs8hL4tPjzAv1VJhl0Gn.oOjn24IEMuNKrbIywZ68YN0LU4lSMom',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:18:56','2025-09-03 18:18:56','2025-09-06 06:01:15'),('0fa9d605-36fc-49e2-be76-274ee1c8d242','test_keywords_1757550925348@example.com','$2a$10$x1m.DG.ReFaCo5B2M7lTjee5np7hr5zAjd3wIlsEJoQJB8DLwackO',NULL,NULL,0,'Keywords Test User','Keywords Test Company','admin',1,0,NULL,'2025-09-11 00:35:25','2025-09-11 00:35:25'),('122d5e43-fc15-43e2-bd88-79791642b2f5','phase3-complete-1757226577544@example.com','$2a$10$tsnC3Y1MGrQKKgV.B/WFzOXYtgUr/zf6X96qep5GV4nPymLusV8b6',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:29:37','2025-09-07 06:29:37','2025-09-07 06:29:37'),('12db6e73-95b2-4ab8-abad-5372d5c81790','test_1756923468034@example.com','$2a$10$MOeVfScZAIefX9FIKxcwt.yNgUYihamOCssZkGbuwxSNcew4bgHla','$2a$10$MOeVfScZAIefX9FIKxcwt.yNgUYihamOCssZkGbuwxSNcew4bgHla',NULL,0,'測試用戶','測試公司','admin',1,0,'2025-09-03 18:17:48','2025-09-03 18:17:48','2025-09-06 06:01:15'),('1394ef08-8a23-40df-9d7b-f2c11f740f2e','gemini_test_1757094421895@example.com','$2a$10$hdeE1.PfaSgIp44W6Ot0QufuhXBNRDLmNx4Go1hGbWWUVeMRRVCoG','$2a$10$hdeE1.PfaSgIp44W6Ot0QufuhXBNRDLmNx4Go1hGbWWUVeMRRVCoG',NULL,0,'Gemini Test User','Test Company','admin',1,0,NULL,'2025-09-05 17:47:01','2025-09-06 06:01:15'),('144f0b5e-ddf6-41fc-96a8-f513d139d7cc','test_team_1757139529370@example.com','$2b$10$lMCOn8MU/rD2YHVo6fuMXu1iEAjBAiCZMfB7ypcMgUHnZMJIOXPzm',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:18:49','2025-09-06 06:18:49','2025-09-06 06:18:49'),('15eec598-eca1-428e-bbd3-25a24e0e1793','test_1757159063775@example.com','$2a$10$xdrgNP5sTJ/qPVW03a7bkudUrqgZBQ3C6IVc5NbtCcuNMiVT3Jr1C',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-06 11:44:24','2025-09-06 11:44:23','2025-09-06 11:44:24'),('1605ea35-d390-47f2-817f-ae6039fe6187','test_1757156285130@example.com','$2a$10$Y6UY.7Qghr4o8HJwIDb9wOznPTsqROii3n8kzeRXqYI5c62zgDXty',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-06 10:58:05','2025-09-06 10:58:05','2025-09-06 10:58:05'),('164618fb-a8be-452c-b99d-045515842572','test_user_alert@example.com','$2a$10$p.nsovFtb6heTSMN8T2WaujvL6k7H9tCXDIXePytPVZB6R28DLqri',NULL,NULL,0,'Alert Test User','Alert Test Company','admin',1,0,NULL,'2025-09-06 11:02:14','2025-09-06 11:02:14'),('17f8c7be-20da-48a1-a7a7-3ad747bd5e60','test_viewer_1757140833084@example.com','$2a$10$7n/HR.FaGEvqCTCKLzMlIenDuFTf0QqOrCzYx6jEqcz/Om90INqg.',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:40:33','2025-09-06 06:40:33'),('1b6b1e7b-121b-4c10-80d1-d808c60040f2','alert_dashboard_1757156615979@example.com','$2a$10$DFAI8JaGPoDcPD2TaABorO1AwMsQGhWr2eif7LqTSsmGQWzfRVoW6',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:03:36','2025-09-06 11:03:36'),('1ba8faec-3ea0-4791-9075-138927b04056','test_team_1757099834824@example.com','$2a$10$.vZNQFrpKew9DXTjcCiLhetsFUZ4EY5DosMiIHOkFGuRl93Ys.qo2','$2a$10$.vZNQFrpKew9DXTjcCiLhetsFUZ4EY5DosMiIHOkFGuRl93Ys.qo2',NULL,0,'Team Test User','Team Test Company','admin',1,0,'2025-09-05 19:17:15','2025-09-05 19:17:14','2025-09-06 06:01:15'),('1bf839e3-4e24-448f-a159-c272291413e9','test_verification_1757182603947@example.com','$2a$10$DBS3ttt4GHzKXvs2JRsc2eZbIrmUFtgXm5sf/LHGAh29sAEZr8Mk.',NULL,NULL,0,'Data Verification Test User','Test Verification Company','admin',1,0,NULL,'2025-09-06 18:16:44','2025-09-06 18:16:44'),('1c11e730-2e5f-44b1-808b-9f9a09b1f8e1','alert_test_1757156367899@example.com','$2a$10$rESVyp5fsvcNql6Fu3mh/.b1Bqkxjzi9l4Hz8P.T7o4DJczVdUvx.',NULL,NULL,0,'Alert Test User','Alert Test Company','admin',1,0,NULL,'2025-09-06 10:59:27','2025-09-06 10:59:27'),('1db0365a-4302-4285-b320-93c9ac1fadd4','test_verification_1757182638423@example.com','$2a$10$KHLqFjo4Cvd3qcrp4jt0LunYMmXfg39Kxq.XKTbL2HAG8sg.Hp1Q2',NULL,NULL,0,'Data Verification Test User','Test Verification Company','admin',1,0,NULL,'2025-09-06 18:17:18','2025-09-06 18:17:18'),('21d3f9f6-ff71-4352-bbef-a12322e6462f','phase3-complete-1757228181862@example.com','$2a$10$T8YupwXb7SM8rTpgu5fQ.e7w1rls7BFOIU7Y6r7JZ6Yg/ug3ztbHK',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:56:22','2025-09-07 06:56:21','2025-09-07 06:56:22'),('29c9680d-6958-4a6c-951d-069abd906d7b','test_team_1757141973871@example.com','$2b$10$e2SCB/hA6BCke.fqHQSzWOsC.RffbzM0LhmtumZl9SEhc3jM7oPMO',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:59:34','2025-09-06 06:59:33','2025-09-06 06:59:34'),('2ab9f10f-feff-4acc-bed7-76f3e3ed2975','test_1756971943400@example.com','$2a$10$zSHHqPxC4sLSu9/bjEohy.Y6sg6oHYUJz2PPpZaM3Q23h6GtBUWdC','$2a$10$zSHHqPxC4sLSu9/bjEohy.Y6sg6oHYUJz2PPpZaM3Q23h6GtBUWdC',NULL,0,'更新後的測試用戶','更新後的測試公司','admin',1,0,'2025-09-04 07:45:43','2025-09-04 07:45:43','2025-09-06 06:01:15'),('2b444d7f-2982-4d51-9a5b-eee70bcbf34b','test_1756923579443@example.com','$2a$10$Vbwyk399Z6P6rfBaVek/M.1ZFBdyPmZm92gBlZRDASSsmkUGAYmt2','$2a$10$Vbwyk399Z6P6rfBaVek/M.1ZFBdyPmZm92gBlZRDASSsmkUGAYmt2',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:19:39','2025-09-03 18:19:39','2025-09-06 06:01:15'),('2cc66ccc-2d81-4d12-996f-538b17842960','testuser_1757167394506@example.com','$2a$10$bD5EZptnhEo.DSGDrg.eUO7BIYzEARkJgHF3eNwrGj/2ArHk/iJvS',NULL,NULL,0,'Test User',NULL,'admin',1,0,'2025-09-06 14:03:14','2025-09-06 14:03:14','2025-09-06 14:03:14'),('30933757-9a7b-40c5-a212-b752c0824911','test_viewer_1757140614330@example.com','$2a$10$W1efCqJfP7rPPTEgrNjSGeZYehDv5FZAPnG.EeRmZ0.MzmZvdYid2',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:36:54','2025-09-06 06:36:54'),('344eefac-6a1b-4184-b786-18f51b79250d','test_1757346801063@example.com','$2a$10$UrTYKAnLo6K7.y/yDwv0M.Yf3DwSHwXy963FSXrKu7HUwTjXygPvi',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-08 15:53:21','2025-09-08 15:53:21','2025-09-08 15:53:21'),('36cb5c76-bc09-4b5d-9142-977fc5d8a1fa','test_1757007335267@example.com','$2a$10$mfCUqCLRk5ad4dH0KoE/iejTsVmweF72iOGL7g/bAKzYe0a9EFmqq','$2a$10$mfCUqCLRk5ad4dH0KoE/iejTsVmweF72iOGL7g/bAKzYe0a9EFmqq',NULL,0,'更新後的測試用戶','更新後的測試公司','admin',1,0,'2025-09-04 17:35:35','2025-09-04 17:35:35','2025-09-06 06:01:15'),('379033b5-d5b2-4c86-bc8b-55fe3b9b4192','test_1757552315631@example.com','$2a$10$DHmPOu.8wfHL.UnLHlnPJO.ZzG57VHtr6mYrlfEOOAHP0aIeFMUoe',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-23 15:44:19','2025-09-11 00:58:35','2025-09-23 15:44:19'),('39561542-059d-4fc0-809e-58b1c6d33f9b','test_keywords_1757551019791@example.com','$2a$10$rH3gDzGMeMWF5tfXwFSuo.xG0/vM.EnauqzW/Qg/hM9GLAyDt9LgC',NULL,NULL,0,'Keywords Test User','Keywords Test Company','admin',1,0,NULL,'2025-09-11 00:36:59','2025-09-11 00:36:59'),('3a9592e3-ddec-4699-80fd-7f5f469a22ff','test_1756923725520@example.com','$2a$10$/n7jshvoJNye3potLNrNaOxNYnHkuZ0lI2WPLV09.UAuaO4kdU2Wm','$2a$10$/n7jshvoJNye3potLNrNaOxNYnHkuZ0lI2WPLV09.UAuaO4kdU2Wm',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:22:05','2025-09-03 18:22:05','2025-09-06 06:01:15'),('3bb4a71d-c691-454f-9b71-0f82fac21a75','debug-webhook-1757226971726@test.com','$2a$10$4S22KDbrhcuQMAp9zYLJJOcfhrYLr6K3JkxA9OXIPtQjqcRkoXdhq',NULL,NULL,0,'Webhook Debug Test','Debug Company','admin',1,0,'2025-09-07 06:36:11','2025-09-07 06:36:11','2025-09-07 06:36:11'),('3c6c2c52-14b7-4f8d-852d-ed206dd4f29f','test_1757007308026@example.com','$2a$10$kp4UYKovp9zGei9DV.v7qOSSCQ6jQFsX7R9kOHR/TqQPgNWaTKhcG','$2a$10$kp4UYKovp9zGei9DV.v7qOSSCQ6jQFsX7R9kOHR/TqQPgNWaTKhcG',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-04 17:35:10','2025-09-04 17:35:09','2025-09-06 06:01:15'),('3e94ae9b-c07a-430d-8222-9950902608c4','test_1756923540889@example.com','$2a$10$uXBBNTSYjpsNFQ.eSm8On.Wb9NwVjV7FJbzAA4jPRyeQHlDRcFcAu','$2a$10$uXBBNTSYjpsNFQ.eSm8On.Wb9NwVjV7FJbzAA4jPRyeQHlDRcFcAu',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:19:01','2025-09-03 18:19:00','2025-09-06 06:01:15'),('423abbbf-d4ef-4744-a1bf-61f3575b3bbf','test_analytics_1757160921496@example.com','$2a$10$11gmf7RbfUtHaGJ1eJd5GuQoFOK2EtbSRv1e.oZRW2t..B8LDxgwq',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 12:15:21','2025-09-06 12:15:21'),('43a16659-65c8-430a-8c84-22c5d88803be','test_analytics_1757159017814@example.com','$2a$10$sHNezZDVqOW.KvG0h5RR2.YcGQmkfnKoFamM5XM.c4ZQ7UTr/qnY6',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 11:43:38','2025-09-06 11:43:38'),('464b7b14-1cff-4348-af7e-9c1194991df7','test_team_1757140739134@example.com','$2b$10$x8SXhG2tWS20DUmV86RnJOm.MXWdeM4aed1O5yb7dKdI6nZnXfuWG',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:38:59','2025-09-06 06:38:59','2025-09-06 06:38:59'),('48782049-269f-4ff6-8a51-a1d8f3a554ce','test_viewer_1757140740071@example.com','$2a$10$db2CVAknkLlUM/bxD/OQ4ed1HFJBlG4otXxiabFVJHv7z2A76sIKy',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:39:00','2025-09-06 06:39:00'),('48bf9f7b-d73e-4668-b5ee-424939e45192','test_1756923102594@example.com','$2a$10$8ZEMPrpPNjaAshMPgw8bue9/iOVVOZBUmVtxatXzi6YNkpTA.TMYG','$2a$10$8ZEMPrpPNjaAshMPgw8bue9/iOVVOZBUmVtxatXzi6YNkpTA.TMYG',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:11:42','2025-09-03 18:11:42','2025-09-06 06:01:15'),('4c9ac8ea-60ec-4579-88b5-fae59574760b','alert_test_1757156949186@example.com','$2a$10$owYC9Y1/wxYdVPbdt5Wio.a9qTb7nkF2YM/QXK2nrAyXeKTEBg04K',NULL,NULL,0,'Alert Test User','Alert Test Company','admin',1,0,NULL,'2025-09-06 11:09:09','2025-09-06 11:09:09'),('4de4e78a-67cb-4b00-8987-b99a77d431f8','alert_dashboard_1757157080470@example.com','$2a$10$ur8Fi4sDtShCvYuGZYjjY.zGkhi0PaCTZ2TQKUH0Pfc.pXYC.xHLu',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:11:20','2025-09-06 11:11:20'),('4f3db3f8-0858-4aee-800d-b05d7a2a889d','test_1756923061308@example.com','$2a$10$rRA4pB2cCN3WJA98/KZrZupxyddpktcsD4GkzmlOHlCiNQJbmbrNu','$2a$10$rRA4pB2cCN3WJA98/KZrZupxyddpktcsD4GkzmlOHlCiNQJbmbrNu',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:11:01','2025-09-03 18:11:01','2025-09-06 06:01:15'),('501ac4f8-4f4a-43e6-bfdd-26d661a479ce','test_phase23_1757166955153@example.com','$2a$10$2/2EAJbT90YHjub1fcJyDeG0T.n6AllIOt8CBeoDv76UnLU9WG31i',NULL,NULL,0,'Phase 2.3 Test User',NULL,'admin',1,0,NULL,'2025-09-06 13:55:55','2025-09-06 13:55:55'),('51198fd4-f924-44fe-a533-7f720d3045d0','test_1756923615581@example.com','$2a$10$IRwZQ4IdeDT6ebq7DpYac.s5b3KXt3W/WIuUmYQgi8EUgpFiIQpDS','$2a$10$IRwZQ4IdeDT6ebq7DpYac.s5b3KXt3W/WIuUmYQgi8EUgpFiIQpDS',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:20:15','2025-09-03 18:20:15','2025-09-06 06:01:15'),('52c2954a-4836-4099-8c21-ab98f449dd7d','test_analytics_1757227991587@example.com','$2a$10$OZulwXm2kMRvR2Xn1YB3zOPmU/LsVgFhJJ2ng408gyEr6OSHH4ipK',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-07 06:53:11','2025-09-07 06:53:11'),('5486d07b-3fbf-484f-abcc-2fc8009f39dc','test_team_1757138073185@example.com','$2a$10$9hfv7RFJ/ourGCHKwWiKfuEKiSa18/EVNDaM.nNzZ477fkg6ydSo.','$2a$10$9hfv7RFJ/ourGCHKwWiKfuEKiSa18/EVNDaM.nNzZ477fkg6ydSo.',NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 05:54:33','2025-09-06 05:54:33','2025-09-06 06:01:15'),('560b2cdf-5a3b-4f84-9e4b-a4de8355bf51','teamtest@example.com','$2a$10$0CgKpP//Wj78vsj3Zi4BzO3z223i42WeXSTKEI0zAdp8lU.ruYAfG','$2a$10$0CgKpP//Wj78vsj3Zi4BzO3z223i42WeXSTKEI0zAdp8lU.ruYAfG',NULL,0,'Team Test','Test Co','admin',1,0,'2025-09-05 19:10:32','2025-09-05 19:10:25','2025-09-06 06:01:15'),('58b53d52-2327-4d19-a105-b9789a6fe010','phase3-complete-1757225146638@example.com','$2a$10$aAP.vSg6HKo0eYkdRo6.duX/9bhud1aBX0q/aO0TkYm3P9D61oF5y',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:05:46','2025-09-07 06:05:46','2025-09-07 06:05:46'),('5a62d8c4-796b-4ae8-a556-4e449ec05d91','phase3-complete-1757226791042@example.com','$2a$10$zEc8B/SxbILgFGBXOFF4O.HSQzlwih5aomoovj4iyPEvczSXzSwi6',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:33:11','2025-09-07 06:33:11','2025-09-07 06:33:11'),('5b757f6f-968f-4c3b-9575-20816af984bc','alert_test_1757156962825@example.com','$2a$10$eRMOg8G/FzFKfaKt8cDFNeIAfqDH.fOYcsU4zF6nR1FKPaGPIQHdi',NULL,NULL,0,'Alert Test User','Alert Test Company','admin',1,0,NULL,'2025-09-06 11:09:22','2025-09-06 11:09:22'),('5c28e02f-d1a9-470b-bff8-ad5d4b865928','test_1756923425356@example.com','$2a$10$VgPQmBRggfwidyICZ7U2Buy1JCah35C4qsDOX9fie59/.faKqiDRK','$2a$10$VgPQmBRggfwidyICZ7U2Buy1JCah35C4qsDOX9fie59/.faKqiDRK',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:17:05','2025-09-03 18:17:05','2025-09-06 06:01:15'),('5c732a66-70cb-4b24-9153-049c7fbbc13b','test_team_1757099472725@example.com','$2a$10$of1BWQNQZSgbKa7PDU/ygO.kv5pfiSs.f0iJc8OIpQSUtaw.ob3Ya','$2a$10$of1BWQNQZSgbKa7PDU/ygO.kv5pfiSs.f0iJc8OIpQSUtaw.ob3Ya',NULL,0,'Team Test User','Team Test Company','admin',1,0,'2025-09-05 19:11:12','2025-09-05 19:11:12','2025-09-06 06:01:15'),('5d0e1ecd-e62c-448b-beaf-6e5e2a939561','test_1757092091680@example.com','$2a$10$F36mxtlQltSTU5lqy9zvxOSpd42EwUiE7fueRjPGXSLKlrZBp7C56','$2a$10$F36mxtlQltSTU5lqy9zvxOSpd42EwUiE7fueRjPGXSLKlrZBp7C56',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-05 17:08:11','2025-09-05 17:08:11','2025-09-06 06:01:15'),('5d1fa775-a1ae-457d-af79-88889573c199','test_viewer_1757138485649@example.com','$2a$10$lfDtZgCwy2EZQq5QSRFjs.MV3yzXwOUJ/U3.6nVQAg.ON2pAy1tXO',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:01:25','2025-09-06 06:01:25'),('6549ed39-eb0e-49b5-88e7-78f3fa3a31cc','test_viewer_1757138073843@example.com','$2a$10$j.1CDhOBkw.eXx/5v4YdPOUD/UHc0fs6ofVmptndY3HTcALPxgZPi','$2a$10$j.1CDhOBkw.eXx/5v4YdPOUD/UHc0fs6ofVmptndY3HTcALPxgZPi',NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 05:54:33','2025-09-06 06:01:15'),('67426110-01ea-42e1-a166-b8ec5c72a3b8','test_1756923430210@example.com','$2a$10$JsWwgZCqUmAtsjwdpxs8QOnYa75LNSAOFBK7nUoH3irwq7xIQT.cC','$2a$10$JsWwgZCqUmAtsjwdpxs8QOnYa75LNSAOFBK7nUoH3irwq7xIQT.cC',NULL,0,'測試用戶','測試公司','admin',1,0,'2025-09-03 18:17:10','2025-09-03 18:17:10','2025-09-06 06:01:15'),('697dc14c-9375-4267-8fb4-e179cb2f5fb0','test_viewer_1757139530307@example.com','$2a$10$sllHozqc4rkqQJGlQRVuzuq7s.L1UgqUnlogEpQV4EqDy1bqEqQWO',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:18:50','2025-09-06 06:18:50'),('6afaf587-06fb-4a2a-b7d3-4845eb079186','test_verification_1757182803437@example.com','$2a$10$wGWe06uOJ/NvW15yTjcAvuFqerkfsVgTwny89le0wO4DqJgGrNTLm',NULL,NULL,0,'Data Verification Test User','Test Verification Company','admin',1,0,NULL,'2025-09-06 18:20:04','2025-09-06 18:20:04'),('7496981c-856b-4721-992f-8115b5f9cfa9','test@example.com','$2a$10$Je4h21MS9e2qJUtVAPlCW.CuGKRfaZJUfOMxjZ8tJogkSNAPT5GRK','$2a$10$Je4h21MS9e2qJUtVAPlCW.CuGKRfaZJUfOMxjZ8tJogkSNAPT5GRK',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-23 11:18:31','2025-09-03 18:07:55','2025-09-23 11:18:31'),('76d52ca4-d7c3-4249-befe-40fd006e77ce','test_team_1757138485116@example.com','$2a$10$KzFVgfVRiHBXGxKK1NGGDuNOKuhDbfZQrgTYj0R4QooqXai7F2fGK',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:01:25','2025-09-06 06:01:25','2025-09-06 06:01:25'),('785472f7-cb10-48ce-97bf-23f786941fdd','test_analytics_1757227676702@example.com','$2a$10$IvKAmtzPOJNwssp/jSrWAOWmwHNxaR4qX38puXBY9xFefQ1BHjoby',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-07 06:47:56','2025-09-07 06:47:56'),('78ef81da-4776-4331-add0-009c2c95b8b5','test_1756924124088@example.com','$2a$10$cq783UdlsGWV/UVCCyGF9OrnChOMdvEyy.r6D7NUx/oDwITvVl/Nq','$2a$10$cq783UdlsGWV/UVCCyGF9OrnChOMdvEyy.r6D7NUx/oDwITvVl/Nq',NULL,0,'更新後的測試用戶','更新後的測試公司','admin',1,0,'2025-09-03 18:28:44','2025-09-03 18:28:44','2025-09-06 06:01:15'),('7b4d400e-6dca-4a15-b3de-066d208867c2','alert_dashboard_1757156683209@example.com','$2a$10$AE9u0lGI63L5tV6fCbxBXetd.bVeeFSSfGHr0J1M2ZZtzw8iaY1bi',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:04:43','2025-09-06 11:04:43'),('81215d27-2f2d-45fb-90ff-0c59163ec3fc','test_team_1757140972778@example.com','$2b$10$bUvt7jwHEyziXg9DfWl9x.n4UZNkJMFA1.3s6dY.Yhvtr5Hp9moCe',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:42:53','2025-09-06 06:42:52','2025-09-06 06:42:53'),('81470143-a844-4b98-9793-f86f85efb697','alert_dashboard_1757157153700@example.com','$2a$10$KYiVosItge32S1FRfigEau.0Iut/oZGlxGlot8PrNDfHYn4eD4lt2',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:12:33','2025-09-06 11:12:33'),('8179427a-6bdb-4250-a393-1424bb0a124e','test_1757095444011@example.com','$2a$10$akhGLgNIQgoSb8ckHWoKPeV0EoHB2tIYOCo5VaOeNdDbGNt8momXC','$2a$10$akhGLgNIQgoSb8ckHWoKPeV0EoHB2tIYOCo5VaOeNdDbGNt8momXC',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-05 18:04:04','2025-09-05 18:04:04','2025-09-06 06:01:15'),('819ec580-0bd3-42aa-a866-ced1833bcc13','test_analytics_1757227767075@example.com','$2a$10$g6oNnRpmLQdOMvDkecHMJuW2DWaQh7Bd0hxdR8SyOrPq1TL04/MzC',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-07 06:49:27','2025-09-07 06:49:27'),('82fdf17c-3fcf-4873-9890-d088bf29cf8b','phase3-complete-1757227099154@example.com','$2a$10$Fxrqnwv1kWUTse3IXQjuCeP.xAq.ejooe7LfuqGD/FMKumGy34Ac6',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:38:19','2025-09-07 06:38:19','2025-09-07 06:38:19'),('8764f549-d705-43c7-a001-924c67223a3f','test_1756922971327@example.com','$2a$10$3v/0T38hbyKJwjstyJ5/AOujClMw5haE/P21SUmldsIbpY8B8lrf2','$2a$10$3v/0T38hbyKJwjstyJ5/AOujClMw5haE/P21SUmldsIbpY8B8lrf2',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:09:31','2025-09-03 18:09:31','2025-09-06 06:01:15'),('87a1c42f-d6b0-4d4b-8c4f-3fa9babc5728','alert_dashboard_1757157271384@example.com','$2a$10$x4cvQibj9fmhRVfEmiZb2uPCWUKS2GZy7JKlMnMYPixeVgfBsvE7a',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:14:31','2025-09-06 11:14:31'),('87ea071c-2a27-49c2-9b2b-661a3506055c','test_keywords_1757551758759@example.com','$2a$10$kCrRT/7/PMmvO3DzlddHf.jeaO87HXMhkxspKypYopHTY3TlBIebe',NULL,NULL,0,'Keywords Test User','Keywords Test Company','admin',1,0,NULL,'2025-09-11 00:49:18','2025-09-11 00:49:18'),('8a6d3b6c-4bec-46a2-9d9f-10b4462876ae','gemini_test_1757094247299@example.com','$2a$10$h.vRYRtBqgZzrPrKy5jHRuNjKYTXXy/wbavjn5MJks3uuzaL8aZEW','$2a$10$h.vRYRtBqgZzrPrKy5jHRuNjKYTXXy/wbavjn5MJks3uuzaL8aZEW',NULL,0,'Gemini Test User','Test Company','admin',1,0,NULL,'2025-09-05 17:44:07','2025-09-06 06:01:15'),('8b6ba523-810e-4eac-93c3-be083a4e99a5','phase3-test-1757223395494@example.com','$2a$10$1Rzm.pPHtfyKg21q2ni.ge6NwvvhIPqaDlrVbJ5Qia3pxAr3G7m.2',NULL,NULL,0,'Phase 3 Test User','Phase 3 Testing Company','admin',1,0,'2025-09-07 05:36:35','2025-09-07 05:36:35','2025-09-07 05:36:35'),('8c33286d-9332-4b8c-99d6-3882b460154d','test_analytics_1757159043209@example.com','$2a$10$jtGDepoYTXr9S1XYso3xwuYYv1urEoMz3T2FRtdOSvKpv0/dr1CHe',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 11:44:03','2025-09-06 11:44:03'),('8d99f2bb-f358-4745-bf77-13715288459f','test_keywords_1757551649616@example.com','$2a$10$Ucm6bchd.X9Rkl2WZPuYUO5H8zeFanuM71mYeNQ4JZuPmpRt.SmQu',NULL,NULL,0,'Keywords Test User','Keywords Test Company','admin',1,0,NULL,'2025-09-11 00:47:29','2025-09-11 00:47:29'),('8e27019f-1777-4627-9061-ddc58500ec1c','test_verification_1757182916718@example.com','$2a$10$OrBoXl2YqVkeIXKGVaspLecGewlXcIVtLYIfjfkFb5caavGy5Ycba',NULL,NULL,0,'Data Verification Test User','Test Verification Company','admin',1,0,NULL,'2025-09-06 18:21:57','2025-09-06 18:21:57'),('90626a44-5d32-4704-a4ac-6e3cb71ef5ce','demo@example.com','$2a$10$Z8xf/YJsGZYxa7Yf2EIfru/nyXZcGVS.Zmvi2obBpnLGFuM.H4PDe','$2a$10$Z8xf/YJsGZYxa7Yf2EIfru/nyXZcGVS.Zmvi2obBpnLGFuM.H4PDe',NULL,0,'Blitzgame admin','Demo Company','admin',1,0,'2025-09-23 10:34:44','2025-09-03 20:43:04','2025-09-23 10:34:44'),('938af19a-9024-4bbd-b02d-d4604b5828ea','test_team_1757099396832@example.com','$2a$10$UiazJZCT/JFIThwUcZZaJOtxJrJPGU0OuRwBeS8AFn8dr2b8zxDg6','$2a$10$UiazJZCT/JFIThwUcZZaJOtxJrJPGU0OuRwBeS8AFn8dr2b8zxDg6',NULL,0,'Team Test User','Team Test Company','admin',1,0,'2025-09-05 19:09:57','2025-09-05 19:09:56','2025-09-06 06:01:15'),('944b5522-1bbc-4bc4-b929-dd996d8ce81c','test_1756924198859@example.com','$2a$10$HRA0rOGPrpGDHEa0Htsws.YdgvR09q0rTlVTAnRqooNIdiPcDXFEy','$2a$10$HRA0rOGPrpGDHEa0Htsws.YdgvR09q0rTlVTAnRqooNIdiPcDXFEy',NULL,0,'更新後的測試用戶','更新後的測試公司','admin',1,0,'2025-09-03 18:29:59','2025-09-03 18:29:58','2025-09-06 06:01:15'),('94643905-9483-46eb-baa4-8e991e20c6b8','test_analytics_1757160321794@example.com','$2a$10$wrS9s1MA.mmna7shGnYfx.zqXqcGqgsVzI41IhWu3R0HK/9iM6rIO',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 12:05:22','2025-09-06 12:05:22'),('94f50c03-be21-4290-8756-8695505ca97b','test_viewer_1757140973795@example.com','$2a$10$X5Bff.6F.6dtwi432gY9QOt3TqA1NAaVwB0c3BSk0veX0xIVIX3iK',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:42:53','2025-09-06 06:42:53'),('96167e5d-39cd-4227-b078-e39b6e47b196','test_phase23_1757166824134@example.com','$2a$10$fsESf4fyXoABYhEM8p2Fceux0YbXIqowViVHA5hD0leHE2tFbVEma',NULL,NULL,0,'Phase 2.3 Test User',NULL,'admin',1,0,NULL,'2025-09-06 13:53:44','2025-09-06 13:53:44'),('9707cdc9-d24a-408c-98b1-0b0d53e069bd','test_1756922904324@example.com','$2a$10$JQ2TSg1GL8S.0sKmQmBiRenJ3y09yVz4I.POFnUnUKr402Fzs3Dv.','$2a$10$JQ2TSg1GL8S.0sKmQmBiRenJ3y09yVz4I.POFnUnUKr402Fzs3Dv.',NULL,0,'Test User','Test Company','admin',1,0,NULL,'2025-09-03 18:08:24','2025-09-06 06:01:15'),('9712f7c0-0b83-4ca1-8304-b2b9aa212fcc','phase3-complete-1757226430411@example.com','$2a$10$WBEh0UYYCs2GutMz5idgeO/EIysMpqELMDRS3sH0qZXQeQXR1.Txa',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:27:10','2025-09-07 06:27:10','2025-09-07 06:27:10'),('97bd23ba-b82c-418a-b370-dd628933d552','test_1757346794788@example.com','$2a$10$Yt4Knd3JZajQNpO3vmvT/OwmqmRlPCTe13cNcQLVKkvEmRxNwBosy',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-08 15:53:15','2025-09-08 15:53:14','2025-09-08 15:53:15'),('9d553c83-28a1-4755-a476-a9b2cf08792b','test_verification_1757183230560@example.com','$2a$10$Aon/l5KqISWm5GLq/j72wO2BbEk.Sn30iqVHBqr6tporBmExX5IvC',NULL,NULL,0,'Data Verification Test User','Test Verification Company','admin',1,0,NULL,'2025-09-06 18:27:10','2025-09-06 18:27:10'),('a082ac3f-71bc-495e-8a9f-20ce0401a8ec','test_1756972084308@example.com','$2a$10$Lcl84Fvx26qmupIVJfN63OUUl9PWOyS/o0PqmZN7wFgqkpHzlCUse','$2a$10$Lcl84Fvx26qmupIVJfN63OUUl9PWOyS/o0PqmZN7wFgqkpHzlCUse',NULL,0,'更新後的測試用戶','更新後的測試公司','admin',1,0,'2025-09-04 07:48:06','2025-09-04 07:48:05','2025-09-06 06:01:15'),('a167e95c-ef25-45c5-aa0b-3e160951e3a7','test_analytics_1757159758058@example.com','$2a$10$PJCpALufP8F/l3.vkUHi4.O.Fdi./E/kQqMmqmy2.TR3kjanILyQS',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 11:55:58','2025-09-06 11:55:58'),('a2a747a9-f2fc-49ba-8c1b-54c29c1f876b','test_viewer_1757141974920@example.com','$2a$10$FMf/NnlCXMhau6c4WkPJt.UuqiKgx/7NJk/b0VwQCJJN0TBeyvDa2',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:59:34','2025-09-06 06:59:34'),('a53adb3b-5f63-4cf7-a9a2-b26a8572975c','debug-webhook-1757227019706@test.com','$2a$10$55mBOPxBan8c6BrBXo9i0uk.2KJtXdBeSQog5vVMA3Xv28GoEN4ku',NULL,NULL,0,'Webhook Debug Test','Debug Company','admin',1,0,'2025-09-07 06:36:59','2025-09-07 06:36:59','2025-09-07 06:36:59'),('a6e1cf32-9817-4cd3-88ba-104bc916d2ab','alert_dashboard_1757157466174@example.com','$2a$10$//n419W2yx5Ld82XrZsFPe5DLgQrCZIFs3Jqs0foGoPpkeTDjt.86',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:17:46','2025-09-06 11:17:46'),('ab12fce7-5be6-4e97-a050-2cef50024ccd','test_team_1757139902270@example.com','$2b$10$DaEkhZui7HSJiZS./mpKb.lsE0Mth/3WlBCWYP1xzXH1R7dL4HJIy',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:25:02','2025-09-06 06:25:02','2025-09-06 06:25:02'),('ab403c4f-e5c5-4236-aee9-c222990766d7','test_1756923757908@example.com','$2a$10$azqo9o0invQKZfFup0Yj3.knYWIkS7OA80J95Px4wEVHg.BEurpNC','$2a$10$azqo9o0invQKZfFup0Yj3.knYWIkS7OA80J95Px4wEVHg.BEurpNC',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:22:38','2025-09-03 18:22:37','2025-09-06 06:01:15'),('ae34187c-5f07-474f-98ec-d84e7a021639','test_team_1757140613403@example.com','$2b$10$49rP2msWZ.2j7goTjKvY2u5dOWJyI//UefPsXTRXHFePd5xf7zi1.',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:36:53','2025-09-06 06:36:53','2025-09-06 06:36:53'),('aee43025-85bd-4b35-85e5-27c58ad8ba12','test_1757549645196@example.com','$2a$10$dOkiVfwmgYjcqJp.RvCBj.HFIHQP06Lao3b1ZmHkUzqTYWdO6wn5S',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-11 00:14:05','2025-09-11 00:14:05','2025-09-11 00:14:05'),('af7640fb-fc37-49ef-8f52-b3cadca1f84e','test_team_1757140832098@example.com','$2b$10$N8ur9.fFXEHWIv65bGod4.bJjstIvG7N8Eq0He7WG8YaQIyIYVo9O',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:40:32','2025-09-06 06:40:32','2025-09-06 06:40:32'),('afb95c49-e4c5-4143-8b29-5b3b90f6f412','test_verification_1757182551257@example.com','$2a$10$B3hgO2PGTJYjeXDl8g/NXOlhxYOJNxqN6baMaRYyZYLokOpHWun3S',NULL,NULL,0,'Data Verification Test User','Test Verification Company','admin',1,0,NULL,'2025-09-06 18:15:52','2025-09-06 18:15:52'),('afe57ef4-2fae-4fc6-951c-bf4532e4b353','debug-webhook-1757227082142@test.com','$2a$10$WyNuvaqMtk9gjfEqf0GCNunV9R1MUlEAPmg5hfiJtlmwyMNa3lGL2',NULL,NULL,0,'Webhook Debug Test','Debug Company','admin',1,0,'2025-09-07 06:38:02','2025-09-07 06:38:02','2025-09-07 06:38:02'),('b1f4ad60-af3e-4042-9c28-48aca038480b','debug-webhook-1757227039772@test.com','$2a$10$BC6NadduzKbkUgBROFgipOM6YqSH1sVZD2ovl7LwfLZy2IWDfSGHS',NULL,NULL,0,'Webhook Debug Test','Debug Company','admin',1,0,'2025-09-07 06:37:20','2025-09-07 06:37:19','2025-09-07 06:37:20'),('b4baa554-3b8e-47f0-9a58-2fc79d90a1f3','test_1756923809744@example.com','$2a$10$u/8z7oTH.u/URVVsdJUdAelx1SCJNthVribNmt2IULALH1yMxg9.K','$2a$10$u/8z7oTH.u/URVVsdJUdAelx1SCJNthVribNmt2IULALH1yMxg9.K',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:23:29','2025-09-03 18:23:29','2025-09-06 06:01:15'),('b61b8546-9e9c-4e11-ba3c-be0625e74d53','test_analytics_1757160487543@example.com','$2a$10$cyYtHeQX/1f7YV4bx8nUMOhk3QrP.lbsPZliiyT109MQeGks3Xgpi',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 12:08:08','2025-09-06 12:08:08'),('b9f6db5a-e1ca-4667-b00b-d17134b7c99b','alert_dashboard_1757156942674@example.com','$2a$10$vB1ZzgaivdPRFGIUvSxOHeqk8kl40kxhj5Lf9WyrsL81ytZXgUfc.',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:09:02','2025-09-06 11:09:02'),('ba8b08cb-5b71-4648-9339-94bfa59ec4b1','phase3-test-1757223464045@example.com','$2a$10$QNVrjKFV6qVayH/HM/mBGeSiKb2VCaa3gOMAI2MZlQwIYohXvUHPy',NULL,NULL,0,'Phase 3 Test User','Phase 3 Testing Company','admin',1,0,'2025-09-07 05:37:44','2025-09-07 05:37:44','2025-09-07 05:37:44'),('ba8b29f1-5c01-4425-ba76-40a210bc1ba8','test_1757091384583@example.com','$2a$10$gqOg815BhTVGpl07mHTsqeM0v0arjlwbkblFJA.eEempUyGiqbjJ6','$2a$10$gqOg815BhTVGpl07mHTsqeM0v0arjlwbkblFJA.eEempUyGiqbjJ6',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-05 16:56:24','2025-09-05 16:56:24','2025-09-06 06:01:15'),('bce62a38-d1bb-4e41-8bb8-027d60d03566','test_phase23_1757166205350@example.com','$2a$10$CCoAWvCMBxo6GUQpwWHAtezVkFX..nZiwwL9OdtKW5AXq11rOJF26',NULL,NULL,0,'Phase 2.3 Test User',NULL,'admin',1,0,NULL,'2025-09-06 13:43:25','2025-09-06 13:43:25'),('bd5d8331-1634-48e0-9a49-3b2811bcfa53','test_team_1757140428780@example.com','$2b$10$5kwXJWIZCZwUDUCLCsuYEue0KlWCFI5Tn61lMpvBThesSzV6R0Gfm',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:33:49','2025-09-06 06:33:48','2025-09-06 06:33:49'),('c149b961-9cf0-40b8-8b8f-7da623202148','test_team_1757141459533@example.com','$2b$10$CDcdCRVNLe20YMDZ.dR4AuFvbQCzEF9qJ//p1a1eRJXp2Pu2CfGl6',NULL,NULL,0,'Team Settings Test User','Test Organization','admin',1,0,'2025-09-06 06:50:59','2025-09-06 06:50:59','2025-09-06 06:51:00'),('c248f150-8ec8-4686-8aa7-42b0e95c5f4a','test_analytics_1757160396417@example.com','$2a$10$IRDyUa0cxDLxoJ6.82RjgOEMYtA1a0OMJnQF9LdhnUgXEC3OhyThW',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 12:06:37','2025-09-06 12:06:37'),('c2712040-e601-419b-a491-955dfaef6bf2','test_1757174325189@example.com','$2a$10$VbGlP5D8GfkUWecMt4Dlden4r5vL8JcglHkQWNu2oYZl.n3yrWexW',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-06 15:58:47','2025-09-06 15:58:46','2025-09-06 15:58:47'),('c4735160-68fc-4dda-b62b-888d31144a60','test_keywords_1757551564384@example.com','$2a$10$axq54FiTqgpO3vOcCHgG7.FFIsgUgTkmCb1pZDQWF0pw2irk7vpju',NULL,NULL,0,'Keywords Test User','Keywords Test Company','admin',1,0,NULL,'2025-09-11 00:46:04','2025-09-11 00:46:04'),('c480cb1f-8d8f-4177-bf3e-8d7bf121b96f','test_1756971936780@example.com','$2a$10$xMwuYc0.WEUEfvV7C8U4UugJ8w8LH0iWuzDlfodSjdHupeAryaDmy','$2a$10$xMwuYc0.WEUEfvV7C8U4UugJ8w8LH0iWuzDlfodSjdHupeAryaDmy',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-04 07:45:38','2025-09-04 07:45:38','2025-09-06 06:01:15'),('c7a80915-acaf-4509-935e-0480c8290070','alert_dashboard_1757156573243@example.com','$2a$10$RlIdXY2DtMBgXWGX4K4R3ulL8yca3uA345orY6DETJn5eU5W5vWLK',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:02:53','2025-09-06 11:02:53'),('c874a5d9-6999-41e3-9623-e6cb8dba4dd4','test_1757069904706@example.com','$2a$10$V2CAn.RSkayD0jwGxNIVjOO3BBu7.v/hlUxV3RxemZRKbA2OM4YGS','$2a$10$V2CAn.RSkayD0jwGxNIVjOO3BBu7.v/hlUxV3RxemZRKbA2OM4YGS',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-05 10:58:25','2025-09-05 10:58:24','2025-09-06 06:01:15'),('c8a63fd4-3a93-433b-86f6-f8b25de3fd30','test_1757094187280@example.com','$2a$10$cQpcqn1hNdiTM6.VKE1rO.LwvVgNc.qygwAX9i.MLmcXVBzWm7kIK','$2a$10$cQpcqn1hNdiTM6.VKE1rO.LwvVgNc.qygwAX9i.MLmcXVBzWm7kIK',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-05 17:43:10','2025-09-05 17:43:09','2025-09-06 06:01:15'),('c8a8053a-4011-4ccd-88b4-8e5ec70d7d58','testuser@example.com','$2a$10$9LMfgK20KMykIWCi3rcPqOsksrcHeTi1xtUQxTkLRw2ZTplQnWZ9G','$2a$10$9LMfgK20KMykIWCi3rcPqOsksrcHeTi1xtUQxTkLRw2ZTplQnWZ9G',NULL,0,'Test User','Test Company','admin',1,0,NULL,'2025-09-04 14:55:46','2025-09-06 06:01:15'),('c8e9ba6d-ebcb-4441-b805-f4e352f8cdb5','alert_test_1757156388586@example.com','$2a$10$yr/jDeGRTMAGI77eZ2IOJOJb5x4ViGnGxtluDXU3lHyjmtjoHNEey',NULL,NULL,0,'Alert Test User','Alert Test Company','admin',1,0,NULL,'2025-09-06 10:59:48','2025-09-06 10:59:48'),('caacab5c-28ac-462a-8fef-99fa440c5173','phase3-complete-1757226706003@example.com','$2a$10$02RUZFKR9DXkNBQtHID6QOSrZ0iCAHG1djcwFmMIbWoTVieGIz7ua',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:31:46','2025-09-07 06:31:46','2025-09-07 06:31:46'),('cabbbf33-7686-4de4-91e2-61f8c0cd6874','test_1757346790523@example.com','$2a$10$cV/x8tUrTKRGYHm60xhD3u9yximVAFAmujBYMUDpiiEtDFJar2JXa',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-08 15:53:10','2025-09-08 15:53:10','2025-09-08 15:53:10'),('cb41b39a-73b2-4a1c-a2dc-80a6dc95d9c3','test_1756971713828@example.com','$2a$10$WlCXB6N5YVN1utnktrO1bOpnLb6X9jAEWeM2WA1xl.0mzcoylZDyy','$2a$10$WlCXB6N5YVN1utnktrO1bOpnLb6X9jAEWeM2WA1xl.0mzcoylZDyy',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-04 07:41:55','2025-09-04 07:41:55','2025-09-06 06:01:15'),('cbd64192-b853-40b6-a499-95707e0778b4','test_team_1757099350626@example.com','$2a$10$Ua7RebaU.ginGX8NilOOk.lv91aH0v42d4nT1yXMvlz91HK8AwjVy','$2a$10$Ua7RebaU.ginGX8NilOOk.lv91aH0v42d4nT1yXMvlz91HK8AwjVy',NULL,0,'Team Test User','Team Test Company','admin',1,0,'2025-09-05 19:09:10','2025-09-05 19:09:10','2025-09-06 06:01:15'),('cc6b703e-dff6-4c11-a5d1-416670c238ef','gemini_test_1757092008722@example.com','$2a$10$FU08S89kGY1xhxK1c9NoIu8xjeWKAt8cZ3eYxSyCOk2JPhrOyt6ZO','$2a$10$FU08S89kGY1xhxK1c9NoIu8xjeWKAt8cZ3eYxSyCOk2JPhrOyt6ZO',NULL,0,'Gemini Test User','Gemini Test Company','admin',1,0,'2025-09-05 17:06:49','2025-09-05 17:06:48','2025-09-06 06:01:15'),('ce73c890-d0fe-41ef-8866-d190e850b598','phase3-complete-1757224678352@example.com','$2a$10$59X9EXwTezimB2FGKFvTP.kiTSqihfnv5LUAeaw7CcoN/jEPrINx2',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 05:57:58','2025-09-07 05:57:58','2025-09-07 05:57:58'),('d1856834-040c-428f-815d-1d54c3531bf5','test_1757551871883@example.com','$2a$10$KfZzlmRwSDfNyUt7SFcvcewzsH1mJMwEUiUd36Xhk.MwkaLtm3XI.',NULL,NULL,0,'Test User','Test Company','admin',1,0,'2025-09-11 00:51:12','2025-09-11 00:51:11','2025-09-11 00:51:12'),('d3551597-fde7-4d57-8753-af7d4cf2a517','test_analytics_1757159903265@example.com','$2a$10$Tw8yUzo/YuV6IcIBHiP9WuUvZSP0hCIcwR0k/uvCSYKzxgSp22OTO',NULL,NULL,0,'Analytics Test User','Analytics Test Company','admin',1,0,NULL,'2025-09-06 11:58:24','2025-09-06 11:58:24'),('d5e20474-e563-4da4-a875-30e7cead8f18','test_1756923122449@example.com','$2a$10$oYc60MZPJybiHKcMloU6XewAQDNjJWOg13hERJO6a8D5TZxgmg6Zy','$2a$10$oYc60MZPJybiHKcMloU6XewAQDNjJWOg13hERJO6a8D5TZxgmg6Zy',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:12:02','2025-09-03 18:12:02','2025-09-06 06:01:15'),('d8ec404d-07f9-4717-b722-fdab85b17321','test_keywords_1757551087091@example.com','$2a$10$MrBZ.abp8Gg5oif7AXsCyekrzA/uxaVbnfHFQrW9exCjv4HmaIFoy',NULL,NULL,0,'Keywords Test User','Keywords Test Company','admin',1,0,NULL,'2025-09-11 00:38:07','2025-09-11 00:38:07'),('d959b8ea-410e-4700-81e1-fcfdd929d6ee','test_keywords_1757550799978@example.com','$2a$10$Gy7mYwtf3u9omJchhqy24u0GPZQEQBSemTI11SSVxBwCCne5.eLNC',NULL,NULL,0,'Keywords Test User','Keywords Test Company','admin',1,0,NULL,'2025-09-11 00:33:20','2025-09-11 00:33:20'),('de70342a-5a3c-45b5-ac36-c36bccb4f921','alert_dashboard_1757156588983@example.com','$2a$10$kZiRJg6dEUz6/ruBuPH9qevwC2g0E.5Aht7KZku6nzBlqMdQmlKfy',NULL,NULL,0,'Alert Dashboard Test','Alert Dashboard Company','admin',1,0,NULL,'2025-09-06 11:03:09','2025-09-06 11:03:09'),('e546cc57-5930-4632-ad0e-1011f65f15a1','test_1756972035709@example.com','$2a$10$hMf5EFQUJe39v584ystyPOjSLavm1J5P22G26WYzxux5u9ncLJJG.','$2a$10$hMf5EFQUJe39v584ystyPOjSLavm1J5P22G26WYzxux5u9ncLJJG.',NULL,0,'更新後的測試用戶','更新後的測試公司','admin',1,0,'2025-09-04 07:47:17','2025-09-04 07:47:17','2025-09-06 06:01:15'),('e8ea9c71-5d12-4426-b464-cd7ec84132f6','debug_test_1757159877@example.com','$2a$10$xNtsHGJh4o/aZoOoS0/HVeqUFJ97PbxzSQOOpHsYMRybvlsgSrHC2',NULL,NULL,0,'Debug Test User','Debug Test Company','admin',1,0,NULL,'2025-09-06 11:57:58','2025-09-06 11:57:58'),('ea3310c3-163d-4d3a-a4db-52c74bcfd393','test_verification_1757182397832@example.com','$2a$10$vdHLGnLbGhgpqOVGaIce/OkkRCbiruz4OMc5runCZE7lNanmOPWvi',NULL,NULL,0,'Data Verification Test User','Test Verification Company','admin',1,0,NULL,'2025-09-06 18:13:18','2025-09-06 18:13:18'),('ec212b7d-31f1-4abb-a380-4bf0f185b04a','test_viewer_1757140429683@example.com','$2a$10$nlUCoU/FU4rK15PxAflg1ev4NiwWj.b4FEVvzxtGVJk0HGWi.1SP2',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:33:49','2025-09-06 06:33:49'),('ef6503d1-6a22-42b2-8057-eb6a2c991b91','test_phase23_1757167496267@example.com','$2a$10$409MIh0uZHS51o2Vln7PD.NnxxpUUlO8acxqqaJWr2bdiRB1jAKIG',NULL,NULL,0,'Phase 2.3 Test User',NULL,'admin',1,0,NULL,'2025-09-06 14:04:56','2025-09-06 14:04:56'),('f3ef38c5-c0a4-452d-b8ad-007ab052c651','phase3-complete-1757226899303@example.com','$2a$10$339ixY1LRF9nvn8bQCVJhedXL5XoUsnaEAMqHiPKTQYG1H/HpFpAe',NULL,NULL,0,'Phase 3 Complete Test User','Phase 3 Complete Testing','admin',1,0,'2025-09-07 06:34:59','2025-09-07 06:34:59','2025-09-07 06:34:59'),('f58aae1e-5c16-4a17-b1ef-fd45bb956143','test_1756923338432@example.com','$2a$10$YXF.AUhupOml7BcqSsOlteSPwRojZ3y35S4eSc8fy6DGI0L/tZNlq','$2a$10$YXF.AUhupOml7BcqSsOlteSPwRojZ3y35S4eSc8fy6DGI0L/tZNlq',NULL,0,'Test User','Test Company','admin',1,0,'2025-09-03 18:15:38','2025-09-03 18:15:38','2025-09-06 06:01:15'),('f66b82d2-bd59-487e-94d1-f41c5df94d2a','test_viewer_1757139903176@example.com','$2a$10$heQu6X3Y8IocejSoesm.P.3pGEcW3H1s/e0XS9xuXIgD/1/05ilqe',NULL,NULL,0,'Viewer User','Test Organization','admin',1,0,NULL,'2025-09-06 06:25:03','2025-09-06 06:25:03'),('f72feeb6-24f1-4d03-9f26-8799aea23598','test_phase23_1757166513519@example.com','$2a$10$haXfqRQkEYlPi1b79XqYS.6KYSEX.Lp9nZ0Nax5KvICM1hq3vt6Ha',NULL,NULL,0,'Phase 2.3 Test User',NULL,'admin',1,0,NULL,'2025-09-06 13:48:33','2025-09-06 13:48:33'),('fb0137e1-40c4-4437-b9aa-ab2022ab86dd','test_phase23_1757165986528@example.com','$2a$10$rpfrlM1qwaFUyj00930c9eLJQThu72IM0W2jkDPcQ4VUQLEDxgIqe',NULL,NULL,0,'Phase 2.3 Test User',NULL,'admin',1,0,NULL,'2025-09-06 13:39:46','2025-09-06 13:39:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook_deliveries`
--

DROP TABLE IF EXISTS `webhook_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_deliveries` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `webhook_id` char(36) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `payload` json NOT NULL,
  `response_status` int DEFAULT NULL,
  `response_body` text,
  `response_headers` json DEFAULT NULL,
  `delivery_time_ms` int DEFAULT NULL,
  `attempts` int DEFAULT '1',
  `delivered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `next_retry_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','delivered','failed','retry') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `idx_webhook` (`webhook_id`),
  KEY `idx_status` (`status`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_delivered_at` (`delivered_at`),
  KEY `idx_webhook_deliveries_retry` (`status`,`next_retry_at`),
  CONSTRAINT `webhook_deliveries_ibfk_1` FOREIGN KEY (`webhook_id`) REFERENCES `webhooks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook_deliveries`
--

LOCK TABLES `webhook_deliveries` WRITE;
/*!40000 ALTER TABLE `webhook_deliveries` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhooks`
--

DROP TABLE IF EXISTS `webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhooks` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `secret` varchar(255) DEFAULT NULL,
  `events` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `is_active` tinyint(1) DEFAULT '1',
  `headers` json DEFAULT NULL,
  `retry_attempts` int DEFAULT '3',
  `timeout_seconds` int DEFAULT '30',
  `last_triggered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_deliveries` int DEFAULT '0',
  `successful_deliveries` int DEFAULT '0',
  `failed_deliveries` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_organization` (`organization_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `webhooks_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhooks`
--

LOCK TABLES `webhooks` WRITE;
/*!40000 ALTER TABLE `webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhooks` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `websites`
--

LOCK TABLES `websites` WRITE;
/*!40000 ALTER TABLE `websites` DISABLE KEYS */;
INSERT INTO `websites` VALUES ('25f970d4-770b-4aa8-a5a0-f5ec0d8e7c9b','b0a50730-02c4-4028-8d11-8ad4b033de80','https://stackoverflow.com','stackoverflow.com','stackoverflow.com',NULL,NULL,'unknown',NULL,'weekly',1,'2025-09-11 02:47:21','2025-09-11 02:47:21'),('370db663-2edd-44d1-a046-bba0224691a3','b0a50730-02c4-4028-8d11-8ad4b033de80','https://github.com','github.com','github.com',NULL,NULL,'unknown',NULL,'weekly',1,'2025-09-11 02:47:12','2025-09-11 02:47:12'),('472d82cb-5242-4e44-954b-8a1065e998ec','8209b96f-2055-4b90-b62b-6000e7b94c85','https://blitzgame.app','blitzgame.app','blitzgame.app',NULL,NULL,'unknown','2025-09-23 15:30:55','weekly',1,'2025-09-23 15:30:55','2025-09-23 15:30:55'),('6d2d32f9-b180-4c12-8f4c-4ce106ce9d26','b0a50730-02c4-4028-8d11-8ad4b033de80','https://boxtradex.io','boxtradex.io','BOXTRADEX',NULL,NULL,'unknown',NULL,'daily',1,'2025-09-16 03:27:07','2025-09-16 03:27:07'),('764d5cbe-6a3d-42d5-a099-bfd002967a79','b0a50730-02c4-4028-8d11-8ad4b033de80','https://figma.com','figma.com','figma.com',NULL,NULL,'unknown',NULL,'weekly',1,'2025-09-04 14:57:44','2025-09-04 14:57:44'),('8880af43-1b47-42b1-9af5-17e5b4cf443a','8209b96f-2055-4b90-b62b-6000e7b94c85','https://example.com','example.com','AI测试网站','AI追踪功能测试网站',NULL,'unknown',NULL,'weekly',1,'2025-09-23 11:17:37','2025-09-23 11:17:37'),('d39f35c9-4c43-4ce8-8f3b-ae29f32ea21b','b0a50730-02c4-4028-8d11-8ad4b033de80','https://blitzgame.app','blitzgame.app','blitzgame.app',NULL,NULL,'unknown','2025-09-15 15:58:27','weekly',1,'2025-09-15 15:58:26','2025-09-15 15:58:27'),('e69999e6-c884-4c24-b629-46f5c08e14bf','b0a50730-02c4-4028-8d11-8ad4b033de80','https://blitzgame.site','blitzgame.site','Blitzgame site',NULL,NULL,'unknown',NULL,'daily',1,'2025-09-16 02:52:39','2025-09-16 02:52:39');
/*!40000 ALTER TABLE `websites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_executions`
--

DROP TABLE IF EXISTS `workflow_executions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_executions` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `workflow_id` char(36) NOT NULL,
  `trigger_data` json NOT NULL,
  `execution_status` enum('success','failed','partial') NOT NULL,
  `actions_executed` json DEFAULT NULL,
  `error_details` json DEFAULT NULL,
  `execution_time_ms` int DEFAULT NULL,
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workflow` (`workflow_id`),
  KEY `idx_status` (`execution_status`),
  KEY `idx_executed_at` (`executed_at`),
  KEY `idx_executions_workflow_date` (`workflow_id`,`executed_at`),
  CONSTRAINT `workflow_executions_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `automation_workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_executions`
--

LOCK TABLES `workflow_executions` WRITE;
/*!40000 ALTER TABLE `workflow_executions` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflow_executions` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2025-09-23 23:54:11

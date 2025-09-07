<?php
/**
 * Database operations for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * GEO Platform Database Class
 */
class GEO_Platform_Database {
    
    /**
     * Get table names with WordPress prefix
     */
    public static function get_table_names() {
        global $wpdb;
        
        return array(
            'websites' => $wpdb->prefix . 'geo_platform_websites',
            'analytics' => $wpdb->prefix . 'geo_platform_analytics',
            'reports' => $wpdb->prefix . 'geo_platform_reports'
        );
    }
    
    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;
        
        $tables = self::get_table_names();
        $charset_collate = $wpdb->get_charset_collate();
        
        // Websites table
        $sql_websites = "CREATE TABLE IF NOT EXISTS {$tables['websites']} (
            id int(11) NOT NULL AUTO_INCREMENT,
            website_id varchar(50) NOT NULL,
            domain varchar(255) NOT NULL,
            name varchar(255) NOT NULL,
            status varchar(50) DEFAULT 'active',
            last_sync datetime DEFAULT NULL,
            sync_status varchar(50) DEFAULT 'pending',
            settings longtext DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY website_id (website_id),
            KEY domain (domain),
            KEY status (status),
            KEY last_sync (last_sync)
        ) $charset_collate;";
        
        // Analytics table
        $sql_analytics = "CREATE TABLE IF NOT EXISTS {$tables['analytics']} (
            id int(11) NOT NULL AUTO_INCREMENT,
            website_id varchar(50) NOT NULL,
            metric_type varchar(100) NOT NULL,
            metric_value longtext NOT NULL,
            period varchar(20) NOT NULL DEFAULT '30',
            date_recorded date NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY website_id (website_id),
            KEY metric_type (metric_type),
            KEY date_recorded (date_recorded),
            KEY period (period)
        ) $charset_collate;";
        
        // Reports table
        $sql_reports = "CREATE TABLE IF NOT EXISTS {$tables['reports']} (
            id int(11) NOT NULL AUTO_INCREMENT,
            website_id varchar(50) DEFAULT NULL,
            report_type varchar(100) NOT NULL,
            report_name varchar(255) NOT NULL,
            parameters longtext DEFAULT NULL,
            status varchar(50) DEFAULT 'pending',
            file_url varchar(500) DEFAULT NULL,
            file_path varchar(500) DEFAULT NULL,
            generated_at datetime DEFAULT NULL,
            expires_at datetime DEFAULT NULL,
            created_by int(11) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY website_id (website_id),
            KEY report_type (report_type),
            KEY status (status),
            KEY created_by (created_by),
            KEY generated_at (generated_at)
        ) $charset_collate;";
        
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        
        dbDelta($sql_websites);
        dbDelta($sql_analytics);
        dbDelta($sql_reports);
        
        // Update database version
        update_option('geo_platform_db_version', GEO_PLATFORM_VERSION);
    }
    
    /**
     * Drop database tables
     */
    public static function drop_tables() {
        global $wpdb;
        
        $tables = self::get_table_names();
        
        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$table}");
        }
        
        delete_option('geo_platform_db_version');
    }
    
    /**
     * Save website data
     * 
     * @param array $website_data Website data from API
     * @return int|false Website ID or false on failure
     */
    public static function save_website($website_data) {
        global $wpdb;
        
        $tables = self::get_table_names();
        
        $data = array(
            'website_id' => sanitize_text_field($website_data['id']),
            'domain' => sanitize_text_field($website_data['domain']),
            'name' => sanitize_text_field($website_data['name']),
            'status' => sanitize_text_field($website_data['status'] ?? 'active'),
            'last_sync' => current_time('mysql'),
            'sync_status' => 'synced',
            'settings' => json_encode($website_data['settings'] ?? array()),
            'updated_at' => current_time('mysql')
        );
        
        // Check if website exists
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$tables['websites']} WHERE website_id = %s",
            $data['website_id']
        ));
        
        if ($existing) {
            // Update existing
            $result = $wpdb->update(
                $tables['websites'],
                $data,
                array('website_id' => $data['website_id'])
            );
            return $result !== false ? $existing : false;
        } else {
            // Insert new
            $data['created_at'] = current_time('mysql');
            $result = $wpdb->insert($tables['websites'], $data);
            return $result ? $wpdb->insert_id : false;
        }
    }
    
    /**
     * Get websites
     * 
     * @param array $args Query arguments
     * @return array
     */
    public static function get_websites($args = array()) {
        global $wpdb;
        
        $tables = self::get_table_names();
        $defaults = array(
            'status' => 'all',
            'limit' => 20,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC'
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $where = "1=1";
        $where_values = array();
        
        if ($args['status'] !== 'all') {
            $where .= " AND status = %s";
            $where_values[] = $args['status'];
        }
        
        $orderby = in_array($args['orderby'], array('name', 'domain', 'status', 'last_sync', 'created_at')) 
            ? $args['orderby'] : 'created_at';
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';
        
        $limit = absint($args['limit']);
        $offset = absint($args['offset']);
        
        $sql = "SELECT * FROM {$tables['websites']} WHERE {$where} ORDER BY {$orderby} {$order} LIMIT %d OFFSET %d";
        $where_values[] = $limit;
        $where_values[] = $offset;
        
        if (!empty($where_values)) {
            $sql = $wpdb->prepare($sql, $where_values);
        }
        
        return $wpdb->get_results($sql, ARRAY_A);
    }
    
    /**
     * Save analytics data
     * 
     * @param array $analytics_data Analytics data from API
     * @return int|false Number of rows inserted or false on failure
     */
    public static function save_analytics($analytics_data) {
        global $wpdb;
        
        $tables = self::get_table_names();
        $inserted = 0;
        
        foreach ($analytics_data as $data) {
            $record = array(
                'website_id' => sanitize_text_field($data['website_id']),
                'metric_type' => sanitize_text_field($data['metric_type']),
                'metric_value' => json_encode($data['metric_value']),
                'period' => sanitize_text_field($data['period'] ?? '30'),
                'date_recorded' => sanitize_text_field($data['date_recorded']),
                'created_at' => current_time('mysql')
            );
            
            $result = $wpdb->insert($tables['analytics'], $record);
            if ($result) {
                $inserted++;
            }
        }
        
        return $inserted > 0 ? $inserted : false;
    }
    
    /**
     * Get analytics data
     * 
     * @param array $args Query arguments
     * @return array
     */
    public static function get_analytics($args = array()) {
        global $wpdb;
        
        $tables = self::get_table_names();
        $defaults = array(
            'website_id' => null,
            'metric_type' => null,
            'period' => '30',
            'date_from' => null,
            'date_to' => null,
            'limit' => 100,
            'orderby' => 'date_recorded',
            'order' => 'DESC'
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $where = "1=1";
        $where_values = array();
        
        if ($args['website_id']) {
            $where .= " AND website_id = %s";
            $where_values[] = $args['website_id'];
        }
        
        if ($args['metric_type']) {
            $where .= " AND metric_type = %s";
            $where_values[] = $args['metric_type'];
        }
        
        if ($args['period']) {
            $where .= " AND period = %s";
            $where_values[] = $args['period'];
        }
        
        if ($args['date_from']) {
            $where .= " AND date_recorded >= %s";
            $where_values[] = $args['date_from'];
        }
        
        if ($args['date_to']) {
            $where .= " AND date_recorded <= %s";
            $where_values[] = $args['date_to'];
        }
        
        $orderby = in_array($args['orderby'], array('date_recorded', 'metric_type', 'created_at')) 
            ? $args['orderby'] : 'date_recorded';
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';
        
        $limit = absint($args['limit']);
        
        $sql = "SELECT * FROM {$tables['analytics']} WHERE {$where} ORDER BY {$orderby} {$order} LIMIT %d";
        $where_values[] = $limit;
        
        $sql = $wpdb->prepare($sql, $where_values);
        
        return $wpdb->get_results($sql, ARRAY_A);
    }
    
    /**
     * Save report
     * 
     * @param array $report_data Report data
     * @return int|false Report ID or false on failure
     */
    public static function save_report($report_data) {
        global $wpdb;
        
        $tables = self::get_table_names();
        
        $data = array(
            'website_id' => sanitize_text_field($report_data['website_id'] ?? null),
            'report_type' => sanitize_text_field($report_data['report_type']),
            'report_name' => sanitize_text_field($report_data['report_name']),
            'parameters' => json_encode($report_data['parameters'] ?? array()),
            'status' => sanitize_text_field($report_data['status'] ?? 'pending'),
            'file_url' => esc_url_raw($report_data['file_url'] ?? null),
            'file_path' => sanitize_text_field($report_data['file_path'] ?? null),
            'generated_at' => $report_data['generated_at'] ? sanitize_text_field($report_data['generated_at']) : null,
            'expires_at' => $report_data['expires_at'] ? sanitize_text_field($report_data['expires_at']) : null,
            'created_by' => get_current_user_id(),
            'created_at' => current_time('mysql')
        );
        
        $result = $wpdb->insert($tables['reports'], $data);
        return $result ? $wpdb->insert_id : false;
    }
    
    /**
     * Get reports
     * 
     * @param array $args Query arguments
     * @return array
     */
    public static function get_reports($args = array()) {
        global $wpdb;
        
        $tables = self::get_table_names();
        $defaults = array(
            'website_id' => null,
            'report_type' => null,
            'status' => 'all',
            'created_by' => null,
            'limit' => 20,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC'
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $where = "1=1";
        $where_values = array();
        
        if ($args['website_id']) {
            $where .= " AND website_id = %s";
            $where_values[] = $args['website_id'];
        }
        
        if ($args['report_type']) {
            $where .= " AND report_type = %s";
            $where_values[] = $args['report_type'];
        }
        
        if ($args['status'] !== 'all') {
            $where .= " AND status = %s";
            $where_values[] = $args['status'];
        }
        
        if ($args['created_by']) {
            $where .= " AND created_by = %d";
            $where_values[] = $args['created_by'];
        }
        
        $orderby = in_array($args['orderby'], array('report_name', 'report_type', 'status', 'created_at', 'generated_at')) 
            ? $args['orderby'] : 'created_at';
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';
        
        $limit = absint($args['limit']);
        $offset = absint($args['offset']);
        
        $sql = "SELECT r.*, u.display_name as created_by_name 
                FROM {$tables['reports']} r 
                LEFT JOIN {$wpdb->users} u ON r.created_by = u.ID 
                WHERE {$where} 
                ORDER BY {$orderby} {$order} 
                LIMIT %d OFFSET %d";
        
        $where_values[] = $limit;
        $where_values[] = $offset;
        
        $sql = $wpdb->prepare($sql, $where_values);
        
        return $wpdb->get_results($sql, ARRAY_A);
    }
    
    /**
     * Update report status
     * 
     * @param int $report_id Report ID
     * @param array $data Data to update
     * @return bool
     */
    public static function update_report($report_id, $data) {
        global $wpdb;
        
        $tables = self::get_table_names();
        
        $update_data = array();
        $allowed_fields = array('status', 'file_url', 'file_path', 'generated_at', 'expires_at');
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowed_fields)) {
                $update_data[$key] = $value;
            }
        }
        
        if (empty($update_data)) {
            return false;
        }
        
        $update_data['updated_at'] = current_time('mysql');
        
        $result = $wpdb->update(
            $tables['reports'],
            $update_data,
            array('id' => absint($report_id))
        );
        
        return $result !== false;
    }
    
    /**
     * Clean up expired reports
     * 
     * @return int Number of reports cleaned up
     */
    public static function cleanup_expired_reports() {
        global $wpdb;
        
        $tables = self::get_table_names();
        
        $result = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tables['reports']} WHERE expires_at IS NOT NULL AND expires_at < %s",
            current_time('mysql')
        ));
        
        return $result ?: 0;
    }
}
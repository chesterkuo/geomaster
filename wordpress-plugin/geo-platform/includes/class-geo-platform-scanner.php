<?php
/**
 * GEO Platform Scanner Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform_Scanner {
    
    /**
     * API handler
     */
    private $api;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->api = new GEO_Platform_API();
    }
    
    /**
     * Scan current site
     */
    public function scan_current_site($scan_type = 'standard') {
        $url = home_url();
        
        // Create or get website
        $website = $this->api->create_website($url);
        if (!$website) {
            return array(
                'success' => false,
                'message' => __('Failed to create website record', 'geo-platform')
            );
        }
        
        // Start scan
        $scan = $this->api->scan_website($website['id']);
        if (!$scan) {
            return array(
                'success' => false,
                'message' => __('Failed to start scan', 'geo-platform')
            );
        }
        
        // Store scan locally
        $this->store_scan_locally($scan['id'], $url);
        
        // Wait for scan to complete (with timeout)
        $max_attempts = 30;
        $attempt = 0;
        
        while ($attempt < $max_attempts) {
            sleep(2); // Wait 2 seconds between checks
            
            $results = $this->api->get_scan_results($scan['id']);
            
            if ($results && $results['status'] === 'completed') {
                // Store results locally
                $this->update_scan_results($scan['id'], $results);
                
                // Update plugin settings with scores
                $this->update_geo_scores($results);
                
                return array(
                    'success' => true,
                    'data' => $results
                );
            } elseif ($results && $results['status'] === 'failed') {
                return array(
                    'success' => false,
                    'message' => __('Scan failed', 'geo-platform')
                );
            }
            
            $attempt++;
        }
        
        return array(
            'success' => false,
            'message' => __('Scan timeout', 'geo-platform')
        );
    }
    
    /**
     * Scan specific URL
     */
    public function scan_url($url) {
        // Get optimization suggestions directly
        $suggestions = $this->api->get_optimization_suggestions($url);
        
        if (!$suggestions) {
            return array(
                'success' => false,
                'message' => __('Failed to get optimization suggestions', 'geo-platform')
            );
        }
        
        // Store scan results
        $this->store_url_scan($url, $suggestions);
        
        return array(
            'success' => true,
            'data' => $suggestions
        );
    }
    
    /**
     * Scan post/page
     */
    public function scan_post($post_id) {
        $url = get_permalink($post_id);
        
        if (!$url) {
            return array(
                'success' => false,
                'message' => __('Invalid post ID', 'geo-platform')
            );
        }
        
        $result = $this->scan_url($url);
        
        if ($result['success']) {
            // Store post-specific metadata
            update_post_meta($post_id, '_geo_platform_score', $result['data']['geoScore']);
            update_post_meta($post_id, '_geo_platform_suggestions', $result['data']['suggestions']);
            update_post_meta($post_id, '_geo_platform_last_scan', current_time('mysql'));
        }
        
        return $result;
    }
    
    /**
     * REST API handler for scanning
     */
    public function rest_scan_site($request) {
        $scan_type = $request->get_param('scan_type') ?: 'standard';
        return $this->scan_current_site($scan_type);
    }
    
    /**
     * Store scan locally
     */
    private function store_scan_locally($scan_id, $url) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_scans';
        
        $wpdb->insert($table, array(
            'scan_id' => $scan_id,
            'url' => $url,
            'scan_date' => current_time('mysql')
        ));
    }
    
    /**
     * Update scan results
     */
    private function update_scan_results($scan_id, $results) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_scans';
        
        $update_data = array(
            'geo_score' => isset($results['geoScore']) ? $results['geoScore'] : 0,
            'technical_health' => isset($results['scores']['technicalHealth']) ? $results['scores']['technicalHealth'] : 0,
            'content_quality' => isset($results['scores']['contentQuality']) ? $results['scores']['contentQuality'] : 0,
            'ai_visibility' => isset($results['scores']['aiVisibility']) ? $results['scores']['aiVisibility'] : 0,
            'suggestions' => isset($results['suggestions']) ? json_encode($results['suggestions']) : ''
        );
        
        $wpdb->update(
            $table,
            $update_data,
            array('scan_id' => $scan_id)
        );
    }
    
    /**
     * Store URL scan
     */
    private function store_url_scan($url, $results) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_scans';
        
        $wpdb->insert($table, array(
            'scan_id' => wp_generate_uuid4(),
            'url' => $url,
            'geo_score' => isset($results['geoScore']) ? $results['geoScore'] : 0,
            'technical_health' => isset($results['scores']['technicalHealth']) ? $results['scores']['technicalHealth'] : 0,
            'content_quality' => isset($results['scores']['contentQuality']) ? $results['scores']['contentQuality'] : 0,
            'ai_visibility' => isset($results['scores']['aiVisibility']) ? $results['scores']['aiVisibility'] : 0,
            'suggestions' => isset($results['suggestions']) ? json_encode($results['suggestions']) : '',
            'scan_date' => current_time('mysql')
        ));
    }
    
    /**
     * Update GEO scores in settings
     */
    private function update_geo_scores($results) {
        $settings = get_option('geo_platform_settings');
        
        $settings['geo_score'] = isset($results['geoScore']) ? $results['geoScore'] : 0;
        $settings['last_scan'] = current_time('mysql');
        
        // Update AI visibility scores (mock data for now)
        if (isset($results['scores']['aiVisibility'])) {
            $ai_score = $results['scores']['aiVisibility'];
            $settings['ai_visibility'] = array(
                'chatgpt' => round($ai_score * 0.9),
                'gemini' => round($ai_score * 0.85),
                'perplexity' => round($ai_score * 0.8),
                'claude' => round($ai_score * 0.75)
            );
        }
        
        update_option('geo_platform_settings', $settings);
    }
    
    /**
     * Get scan by ID
     */
    public function get_scan($scan_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_scans';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d OR scan_id = %s",
            $scan_id,
            $scan_id
        ), ARRAY_A);
    }
    
    /**
     * Get recent scans
     */
    public function get_recent_scans($limit = 10) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_scans';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table ORDER BY scan_date DESC LIMIT %d",
            $limit
        ), ARRAY_A);
    }
}
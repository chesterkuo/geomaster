<?php
/**
 * GEO Platform Tracker Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform_Tracker {
    
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
     * Log bot visit
     */
    public function log_bot_visit($platform, $uri) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_tracking';
        
        // Store bot visit
        $wpdb->insert($table, array(
            'platform' => $platform,
            'keyword' => $uri,
            'mention_count' => 1,
            'tracked_date' => current_time('mysql')
        ));
        
        // Update daily stats
        $this->update_daily_stats($platform);
    }
    
    /**
     * Get tracking data
     */
    public function get_tracking_data($days = 30) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_tracking';
        
        $date_limit = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        
        // Get platform summary
        $platform_data = $wpdb->get_results($wpdb->prepare(
            "SELECT platform, COUNT(*) as count, MAX(tracked_date) as last_seen
             FROM $table
             WHERE tracked_date >= %s
             GROUP BY platform",
            $date_limit
        ), ARRAY_A);
        
        // Get keyword/page data
        $keyword_data = $wpdb->get_results($wpdb->prepare(
            "SELECT keyword, SUM(mention_count) as mentions, 
                    GROUP_CONCAT(DISTINCT platform) as platforms
             FROM $table
             WHERE tracked_date >= %s
             GROUP BY keyword
             ORDER BY mentions DESC
             LIMIT 20",
            $date_limit
        ), ARRAY_A);
        
        // Get trends
        $trends = $wpdb->get_results($wpdb->prepare(
            "SELECT DATE(tracked_date) as date, platform, COUNT(*) as count
             FROM $table
             WHERE tracked_date >= %s
             GROUP BY DATE(tracked_date), platform
             ORDER BY date DESC",
            $date_limit
        ), ARRAY_A);
        
        return array(
            'platforms' => $platform_data,
            'keywords' => $keyword_data,
            'trends' => $trends
        );
    }
    
    /**
     * Update daily stats
     */
    private function update_daily_stats($platform) {
        $stats_key = 'geo_platform_daily_stats_' . date('Y-m-d');
        $stats = get_transient($stats_key);
        
        if (!$stats) {
            $stats = array(
                'chatgpt' => 0,
                'gemini' => 0,
                'perplexity' => 0,
                'claude' => 0
            );
        }
        
        if (isset($stats[$platform])) {
            $stats[$platform]++;
        }
        
        set_transient($stats_key, $stats, DAY_IN_SECONDS);
    }
    
    /**
     * Track mention
     */
    public function track_mention($platform, $keyword, $sentiment = 'neutral', $is_cited = false, $position = null) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_tracking';
        
        $wpdb->insert($table, array(
            'platform' => $platform,
            'keyword' => $keyword,
            'mention_count' => 1,
            'sentiment' => $sentiment,
            'citation_position' => $position,
            'tracked_date' => current_time('mysql')
        ));
    }
    
    /**
     * Sync with API
     */
    public function sync_with_api() {
        $settings = get_option('geo_platform_settings');
        
        if (empty($settings['api_key'])) {
            return false;
        }
        
        // Get website
        $website = $this->api->create_website();
        if (!$website) {
            return false;
        }
        
        // Get mentions from API
        $mentions = $this->api->get_ai_mentions($website['id']);
        
        if ($mentions && isset($mentions['mentions'])) {
            foreach ($mentions['mentions'] as $mention) {
                $this->track_mention(
                    $mention['platform'],
                    $mention['query'],
                    $mention['sentiment'],
                    $mention['isCited'],
                    $mention['citationPosition']
                );
            }
        }
        
        // Get visibility trends
        $trends = $this->api->get_visibility_trends($website['id']);
        
        if ($trends) {
            // Update settings with latest visibility scores
            $settings = get_option('geo_platform_settings');
            
            if (isset($trends['summary'])) {
                // Update AI visibility scores based on trends
                $latest = end($trends['trends']);
                if ($latest) {
                    $settings['ai_visibility'] = array(
                        'chatgpt' => isset($latest['chatgpt']) ? $latest['chatgpt'] : 0,
                        'gemini' => isset($latest['gemini']) ? $latest['gemini'] : 0,
                        'perplexity' => isset($latest['perplexity']) ? $latest['perplexity'] : 0,
                        'claude' => isset($latest['claude']) ? $latest['claude'] : 0
                    );
                    
                    update_option('geo_platform_settings', $settings);
                }
            }
        }
        
        return true;
    }
    
    /**
     * REST API handler for getting tracking data
     */
    public function rest_get_tracking_data($request) {
        $days = $request->get_param('days') ?: 30;
        
        return array(
            'success' => true,
            'data' => $this->get_tracking_data($days)
        );
    }
    
    /**
     * Get platform statistics
     */
    public function get_platform_stats() {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_tracking';
        
        $stats = $wpdb->get_results(
            "SELECT platform, 
                    COUNT(*) as total_visits,
                    COUNT(DISTINCT keyword) as unique_pages,
                    AVG(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) * 100 as positive_rate,
                    AVG(CASE WHEN citation_position IS NOT NULL THEN 1 ELSE 0 END) * 100 as citation_rate
             FROM $table
             GROUP BY platform",
            ARRAY_A
        );
        
        return $stats;
    }
    
    /**
     * Get top performing content
     */
    public function get_top_content($limit = 10) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_tracking';
        
        $top_content = $wpdb->get_results($wpdb->prepare(
            "SELECT keyword as url,
                    COUNT(*) as total_mentions,
                    COUNT(DISTINCT platform) as platform_count,
                    AVG(CASE WHEN sentiment = 'positive' THEN 1 
                             WHEN sentiment = 'negative' THEN -1 
                             ELSE 0 END) as avg_sentiment
             FROM $table
             GROUP BY keyword
             ORDER BY total_mentions DESC
             LIMIT %d",
            $limit
        ), ARRAY_A);
        
        // Add post titles for URLs
        foreach ($top_content as &$content) {
            $post_id = url_to_postid($content['url']);
            if ($post_id) {
                $content['title'] = get_the_title($post_id);
            } else {
                $content['title'] = $content['url'];
            }
        }
        
        return $top_content;
    }
}
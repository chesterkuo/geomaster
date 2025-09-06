<?php
/**
 * GEO Platform API Integration Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform_API {
    
    /**
     * API base URL
     */
    private $api_base;
    
    /**
     * API credentials
     */
    private $api_key;
    private $organization_id;
    private $access_token;
    private $refresh_token;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->api_base = GEO_PLATFORM_API_BASE;
        
        $settings = get_option('geo_platform_settings');
        $this->api_key = isset($settings['api_key']) ? $settings['api_key'] : '';
        $this->organization_id = isset($settings['organization_id']) ? $settings['organization_id'] : '';
        $this->access_token = get_transient('geo_platform_access_token');
        $this->refresh_token = get_option('geo_platform_refresh_token');
    }
    
    /**
     * Authenticate with the API
     */
    public function authenticate($email = null, $password = null) {
        // If credentials provided, use them
        if ($email && $password) {
            $response = $this->make_request('POST', '/auth/login', array(
                'email' => $email,
                'password' => $password
            ), false);
            
            if ($response && isset($response['data']['accessToken'])) {
                // Store tokens
                set_transient('geo_platform_access_token', $response['data']['accessToken'], 3600);
                update_option('geo_platform_refresh_token', $response['data']['refreshToken']);
                
                // Store organization ID
                if (isset($response['data']['user']['organizationId'])) {
                    $settings = get_option('geo_platform_settings');
                    $settings['organization_id'] = $response['data']['user']['organizationId'];
                    update_option('geo_platform_settings', $settings);
                    $this->organization_id = $response['data']['user']['organizationId'];
                }
                
                $this->access_token = $response['data']['accessToken'];
                return true;
            }
        }
        // Try to refresh token if expired
        elseif (!$this->access_token && $this->refresh_token) {
            return $this->refresh_access_token();
        }
        
        return false;
    }
    
    /**
     * Refresh access token
     */
    private function refresh_access_token() {
        $response = $this->make_request('POST', '/auth/refresh', array(
            'refreshToken' => $this->refresh_token
        ), false);
        
        if ($response && isset($response['data']['accessToken'])) {
            set_transient('geo_platform_access_token', $response['data']['accessToken'], 3600);
            $this->access_token = $response['data']['accessToken'];
            return true;
        }
        
        return false;
    }
    
    /**
     * Make API request
     */
    public function make_request($method, $endpoint, $data = null, $auth_required = true) {
        $url = $this->api_base . $endpoint;
        
        $args = array(
            'method' => $method,
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json'
            )
        );
        
        // Add authentication headers
        if ($auth_required) {
            if (!$this->access_token) {
                $this->authenticate();
            }
            
            $args['headers']['Authorization'] = 'Bearer ' . $this->access_token;
            
            if ($this->organization_id) {
                $args['headers']['X-Organization-ID'] = $this->organization_id;
            }
        }
        
        // Add data for POST/PUT requests
        if ($data && in_array($method, array('POST', 'PUT', 'PATCH'))) {
            $args['body'] = json_encode($data);
        }
        
        // Add query parameters for GET requests
        if ($data && $method === 'GET') {
            $url = add_query_arg($data, $url);
        }
        
        // Make the request
        $response = wp_remote_request($url, $args);
        
        // Handle errors
        if (is_wp_error($response)) {
            error_log('GEO Platform API Error: ' . $response->get_error_message());
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $status_code = wp_remote_retrieve_response_code($response);
        
        // Handle 401 - try to refresh token
        if ($status_code === 401 && $auth_required) {
            if ($this->refresh_access_token()) {
                // Retry the request with new token
                $args['headers']['Authorization'] = 'Bearer ' . $this->access_token;
                $response = wp_remote_request($url, $args);
                $body = wp_remote_retrieve_body($response);
                $status_code = wp_remote_retrieve_response_code($response);
            }
        }
        
        // Parse JSON response
        $decoded = json_decode($body, true);
        
        if ($status_code >= 200 && $status_code < 300) {
            return $decoded;
        } else {
            error_log('GEO Platform API Error: ' . $body);
            return false;
        }
    }
    
    /**
     * Create or get website
     */
    public function create_website($url = null) {
        if (!$url) {
            $url = home_url();
        }
        
        // First, check if website exists
        $websites = $this->make_request('GET', '/websites');
        
        if ($websites && isset($websites['data'])) {
            foreach ($websites['data'] as $website) {
                if ($website['url'] === $url) {
                    return $website;
                }
            }
        }
        
        // Create new website
        $response = $this->make_request('POST', '/websites', array(
            'url' => $url,
            'name' => get_bloginfo('name'),
            'description' => get_bloginfo('description')
        ));
        
        return $response ? $response['data'] : false;
    }
    
    /**
     * Start website scan
     */
    public function scan_website($website_id = null, $url = null) {
        if (!$website_id && !$url) {
            $url = home_url();
        }
        
        // If no website ID, create/get website first
        if (!$website_id) {
            $website = $this->create_website($url);
            if (!$website) {
                return false;
            }
            $website_id = $website['id'];
        }
        
        // Start scan
        $response = $this->make_request('POST', '/scans', array(
            'websiteId' => $website_id,
            'scanType' => 'standard'
        ));
        
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get scan results
     */
    public function get_scan_results($scan_id) {
        $response = $this->make_request('GET', '/scans/' . $scan_id);
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get optimization suggestions
     */
    public function get_optimization_suggestions($url, $provider = 'openai') {
        $response = $this->make_request('POST', '/content/optimization-suggestions', array(
            'url' => $url,
            'provider' => $provider
        ));
        
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get AI tracking mentions
     */
    public function get_ai_mentions($website_id, $platform = null, $date_range = '30d') {
        $params = array(
            'websiteId' => $website_id,
            'dateRange' => $date_range
        );
        
        if ($platform) {
            $params['platform'] = $platform;
        }
        
        $response = $this->make_request('GET', '/tracking/mentions', $params);
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get visibility trends
     */
    public function get_visibility_trends($website_id, $period = '30d') {
        $response = $this->make_request('GET', '/tracking/visibility-trends', array(
            'websiteId' => $website_id,
            'period' => $period
        ));
        
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get dashboard stats
     */
    public function get_dashboard_stats() {
        $response = $this->make_request('GET', '/dashboard/stats');
        return $response ? $response['data'] : false;
    }
    
    /**
     * Create keyword
     */
    public function create_keyword($keyword, $intent = null) {
        $data = array(
            'keyword' => $keyword
        );
        
        if ($intent) {
            $data['intent'] = $intent;
        }
        
        $response = $this->make_request('POST', '/keywords', $data);
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get keywords
     */
    public function get_keywords($page = 1, $limit = 20, $search = null) {
        $params = array(
            'page' => $page,
            'limit' => $limit
        );
        
        if ($search) {
            $params['search'] = $search;
        }
        
        $response = $this->make_request('GET', '/keywords', $params);
        return $response ? $response['data'] : false;
    }
    
    /**
     * Update tracking settings
     */
    public function update_tracking_settings($settings) {
        $response = $this->make_request('PUT', '/tracking/settings', $settings);
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get competitors
     */
    public function get_competitors() {
        $response = $this->make_request('GET', '/competition/competitors');
        return $response ? $response['data'] : false;
    }
    
    /**
     * Add competitor
     */
    public function add_competitor($website_url, $name) {
        $response = $this->make_request('POST', '/competition/competitors', array(
            'websiteUrl' => $website_url,
            'name' => $name
        ));
        
        return $response ? $response['data'] : false;
    }
    
    /**
     * Get competitive analysis
     */
    public function get_competitive_analysis($website_id, $competitor_ids = array()) {
        $response = $this->make_request('GET', '/competition/analysis', array(
            'websiteId' => $website_id,
            'competitorIds' => $competitor_ids
        ));
        
        return $response ? $response['data'] : false;
    }
    
    /**
     * Test API connection
     */
    public function test_connection() {
        $response = $this->make_request('GET', '/health', null, false);
        return $response && isset($response['success']) && $response['success'] === true;
    }
}
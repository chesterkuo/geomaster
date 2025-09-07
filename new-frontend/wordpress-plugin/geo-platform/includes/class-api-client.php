<?php
/**
 * API Client for GEO Platform integration
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * GEO Platform API Client Class
 */
class GEO_Platform_API_Client {
    
    /**
     * API base URL
     * 
     * @var string
     */
    private $api_url;
    
    /**
     * API key
     * 
     * @var string
     */
    private $api_key;
    
    /**
     * Request timeout
     * 
     * @var int
     */
    private $timeout = 30;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->api_url = get_option('geo_platform_api_url', 'https://api.geo-platform.com');
        $this->api_key = get_option('geo_platform_api_key', '');
    }
    
    /**
     * Test API connection
     * 
     * @param string $api_key Optional API key to test
     * @param string $api_url Optional API URL to test
     * @return array
     */
    public function test_connection($api_key = null, $api_url = null) {
        $test_key = $api_key ?: $this->api_key;
        $test_url = $api_url ?: $this->api_url;
        
        if (empty($test_key)) {
            return array(
                'success' => false,
                'message' => __('API key is required', 'geo-platform')
            );
        }
        
        $response = $this->make_request('GET', '/auth/verify', array(), $test_key, $test_url);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200 && isset($body['success']) && $body['success']) {
            return array(
                'success' => true,
                'message' => __('Connection successful', 'geo-platform'),
                'data' => $body
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Connection failed', 'geo-platform')
        );
    }
    
    /**
     * Get websites from API
     * 
     * @return array
     */
    public function get_websites() {
        $response = $this->make_request('GET', '/websites');
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200) {
            return array(
                'success' => true,
                'data' => $body['data'] ?? array()
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Failed to fetch websites', 'geo-platform')
        );
    }
    
    /**
     * Sync websites with API
     * 
     * @return array
     */
    public function sync_websites() {
        $websites_result = $this->get_websites();
        
        if (!$websites_result['success']) {
            return $websites_result;
        }
        
        $websites = $websites_result['data'];
        $synced_count = 0;
        
        foreach ($websites as $website) {
            $result = GEO_Platform_Database::save_website($website);
            if ($result) {
                $synced_count++;
            }
        }
        
        return array(
            'success' => true,
            'message' => sprintf(
                _n('Synced %d website', 'Synced %d websites', $synced_count, 'geo-platform'),
                $synced_count
            ),
            'count' => $synced_count
        );
    }
    
    /**
     * Get analytics data
     * 
     * @param string $period Time period (7, 30, 90 days)
     * @param array $metrics Metrics to retrieve
     * @return array
     */
    public function get_analytics($period = '30', $metrics = array()) {
        $params = array(
            'period' => $period
        );
        
        if (!empty($metrics)) {
            $params['metrics'] = implode(',', $metrics);
        }
        
        $response = $this->make_request('GET', '/analytics', $params);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200) {
            return array(
                'success' => true,
                'data' => $body['data'] ?? array()
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Failed to fetch analytics', 'geo-platform')
        );
    }
    
    /**
     * Generate report
     * 
     * @param string $type Report type
     * @param array $parameters Report parameters
     * @return array
     */
    public function generate_report($type, $parameters = array()) {
        $data = array_merge(array('type' => $type), $parameters);
        
        $response = $this->make_request('POST', '/reports/generate', $data);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200 || $status_code === 201) {
            return array(
                'success' => true,
                'data' => $body['data'] ?? array(),
                'message' => __('Report generated successfully', 'geo-platform')
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Failed to generate report', 'geo-platform')
        );
    }
    
    /**
     * Analyze URL or content
     * 
     * @param string $url URL to analyze
     * @param string $content Content to analyze (optional)
     * @return array
     */
    public function analyze_content($url, $content = '') {
        $data = array(
            'url' => $url,
            'content' => $content
        );
        
        $response = $this->make_request('POST', '/analyze', $data);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200) {
            return array(
                'success' => true,
                'data' => $body['data'] ?? array()
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Analysis failed', 'geo-platform')
        );
    }
    
    /**
     * Get keyword rankings
     * 
     * @param array $keywords Keywords to check
     * @param string $website_id Website ID
     * @return array
     */
    public function get_keyword_rankings($keywords, $website_id = null) {
        $data = array(
            'keywords' => $keywords
        );
        
        if ($website_id) {
            $data['website_id'] = $website_id;
        }
        
        $response = $this->make_request('POST', '/keywords/rankings', $data);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200) {
            return array(
                'success' => true,
                'data' => $body['data'] ?? array()
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Failed to fetch keyword rankings', 'geo-platform')
        );
    }
    
    /**
     * Submit sitemap for analysis
     * 
     * @param string $sitemap_url Sitemap URL
     * @return array
     */
    public function submit_sitemap($sitemap_url) {
        $data = array(
            'sitemap_url' => $sitemap_url
        );
        
        $response = $this->make_request('POST', '/sitemaps/submit', $data);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200 || $status_code === 201) {
            return array(
                'success' => true,
                'data' => $body['data'] ?? array(),
                'message' => __('Sitemap submitted successfully', 'geo-platform')
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Failed to submit sitemap', 'geo-platform')
        );
    }
    
    /**
     * Get audit results
     * 
     * @param string $website_id Website ID
     * @return array
     */
    public function get_audit_results($website_id = null) {
        $params = array();
        if ($website_id) {
            $params['website_id'] = $website_id;
        }
        
        $response = $this->make_request('GET', '/audit/results', $params);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($status_code === 200) {
            return array(
                'success' => true,
                'data' => $body['data'] ?? array()
            );
        }
        
        return array(
            'success' => false,
            'message' => $body['message'] ?? __('Failed to fetch audit results', 'geo-platform')
        );
    }
    
    /**
     * Make HTTP request to API
     * 
     * @param string $method HTTP method
     * @param string $endpoint API endpoint
     * @param array $data Request data
     * @param string $api_key Optional API key override
     * @param string $api_url Optional API URL override
     * @return array|WP_Error
     */
    private function make_request($method, $endpoint, $data = array(), $api_key = null, $api_url = null) {
        $url = ($api_url ?: $this->api_url) . $endpoint;
        $key = $api_key ?: $this->api_key;
        
        $headers = array(
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
            'User-Agent' => 'WordPress GEO Platform Plugin/' . GEO_PLATFORM_VERSION
        );
        
        $args = array(
            'method' => $method,
            'headers' => $headers,
            'timeout' => $this->timeout,
            'sslverify' => true
        );
        
        if ($method === 'POST' || $method === 'PUT') {
            $args['body'] = json_encode($data);
        } else if (!empty($data)) {
            $url = add_query_arg($data, $url);
        }
        
        // Debug logging
        if (get_option('geo_platform_debug_mode', false)) {
            error_log('GEO Platform API Request: ' . $method . ' ' . $url);
            if (!empty($data)) {
                error_log('GEO Platform API Data: ' . json_encode($data));
            }
        }
        
        $response = wp_remote_request($url, $args);
        
        // Debug logging
        if (get_option('geo_platform_debug_mode', false)) {
            if (is_wp_error($response)) {
                error_log('GEO Platform API Error: ' . $response->get_error_message());
            } else {
                error_log('GEO Platform API Response: ' . wp_remote_retrieve_response_code($response));
            }
        }
        
        return $response;
    }
}
<?php
/**
 * Plugin Name: GEO Platform Integration
 * Plugin URI: https://geo-platform.com
 * Description: Complete WordPress integration for GEO Platform SEO tools. Provides dashboard analytics, website management, automated SEO analysis, and comprehensive reporting features.
 * Version: 1.0.0
 * Author: GEO Platform Team
 * Author URI: https://geo-platform.com
 * Text Domain: geo-platform
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Network: false
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GEO_PLATFORM_VERSION', '1.0.0');
define('GEO_PLATFORM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GEO_PLATFORM_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GEO_PLATFORM_PLUGIN_FILE', __FILE__);
define('GEO_PLATFORM_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('GEO_PLATFORM_TEXT_DOMAIN', 'geo-platform');

/**
 * Main GEO Platform Plugin Class
 */
class GEO_Platform_Plugin {
    
    /**
     * Plugin instance
     * 
     * @var GEO_Platform_Plugin
     */
    private static $instance = null;
    
    /**
     * Admin instance
     * 
     * @var GEO_Platform_Admin
     */
    public $admin;
    
    /**
     * Dashboard widget instance
     * 
     * @var GEO_Platform_Dashboard_Widget
     */
    public $dashboard_widget;
    
    /**
     * API client instance
     * 
     * @var GEO_Platform_API_Client
     */
    public $api_client;
    
    /**
     * Get plugin instance
     * 
     * @return GEO_Platform_Plugin
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->load_dependencies();
        $this->init_components();
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        add_action('init', array($this, 'init'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        
        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        register_uninstall_hook(__FILE__, array('GEO_Platform_Plugin', 'uninstall'));
        
        // AJAX hooks
        add_action('wp_ajax_geo_platform_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_geo_platform_sync_websites', array($this, 'ajax_sync_websites'));
        add_action('wp_ajax_geo_platform_get_analytics', array($this, 'ajax_get_analytics'));
        add_action('wp_ajax_geo_platform_generate_report', array($this, 'ajax_generate_report'));
    }
    
    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-api-client.php';
        require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-database.php';
        require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-admin.php';
        require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-dashboard-widget.php';
        require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-shortcodes.php';
        require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-post-integration.php';
    }
    
    /**
     * Initialize plugin components
     */
    private function init_components() {
        $this->api_client = new GEO_Platform_API_Client();
        
        if (is_admin()) {
            $this->admin = new GEO_Platform_Admin();
            $this->dashboard_widget = new GEO_Platform_Dashboard_Widget();
        }
        
        // Initialize shortcodes
        new GEO_Platform_Shortcodes();
        
        // Initialize post integration
        new GEO_Platform_Post_Integration();
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Initialize database tables
        GEO_Platform_Database::create_tables();
        
        // Load plugin textdomain for translations
        $this->load_textdomain();
    }
    
    /**
     * Initialize admin functionality
     */
    public function admin_init() {
        // Admin-specific initialization
        if (is_admin()) {
            // Register settings
            $this->register_settings();
        }
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            GEO_PLATFORM_TEXT_DOMAIN,
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }
    
    /**
     * Register plugin settings
     */
    private function register_settings() {
        // API Settings
        register_setting('geo_platform_settings', 'geo_platform_api_key');
        register_setting('geo_platform_settings', 'geo_platform_api_url');
        register_setting('geo_platform_settings', 'geo_platform_sync_frequency');
        register_setting('geo_platform_settings', 'geo_platform_enable_notifications');
        register_setting('geo_platform_settings', 'geo_platform_debug_mode');
        
        // Website Settings
        register_setting('geo_platform_websites', 'geo_platform_connected_websites');
        register_setting('geo_platform_websites', 'geo_platform_auto_sync');
        
        // Analytics Settings
        register_setting('geo_platform_analytics', 'geo_platform_analytics_period');
        register_setting('geo_platform_analytics', 'geo_platform_metrics_display');
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        GEO_Platform_Database::create_tables();
        
        // Set default options
        $this->set_default_options();
        
        // Schedule cron events
        if (!wp_next_scheduled('geo_platform_sync_websites')) {
            wp_schedule_event(time(), 'hourly', 'geo_platform_sync_websites');
        }
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('geo_platform_sync_websites');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin uninstall
     */
    public static function uninstall() {
        // Remove database tables
        GEO_Platform_Database::drop_tables();
        
        // Remove all plugin options
        delete_option('geo_platform_api_key');
        delete_option('geo_platform_api_url');
        delete_option('geo_platform_sync_frequency');
        delete_option('geo_platform_enable_notifications');
        delete_option('geo_platform_debug_mode');
        delete_option('geo_platform_connected_websites');
        delete_option('geo_platform_auto_sync');
        delete_option('geo_platform_analytics_period');
        delete_option('geo_platform_metrics_display');
        
        // Clear any cached data
        wp_cache_flush();
    }
    
    /**
     * Set default plugin options
     */
    private function set_default_options() {
        add_option('geo_platform_api_url', 'https://api.geo-platform.com');
        add_option('geo_platform_sync_frequency', 'hourly');
        add_option('geo_platform_enable_notifications', true);
        add_option('geo_platform_debug_mode', false);
        add_option('geo_platform_auto_sync', true);
        add_option('geo_platform_analytics_period', '30');
        add_option('geo_platform_metrics_display', array('rankings', 'traffic', 'keywords'));
    }
    
    /**
     * AJAX: Test API connection
     */
    public function ajax_test_connection() {
        check_ajax_referer('geo_platform_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Insufficient permissions', 'geo-platform'));
        }
        
        $api_key = sanitize_text_field($_POST['api_key']);
        $api_url = esc_url_raw($_POST['api_url']);
        
        $result = $this->api_client->test_connection($api_key, $api_url);
        
        wp_send_json($result);
    }
    
    /**
     * AJAX: Sync websites
     */
    public function ajax_sync_websites() {
        check_ajax_referer('geo_platform_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Insufficient permissions', 'geo-platform'));
        }
        
        $result = $this->api_client->sync_websites();
        
        wp_send_json($result);
    }
    
    /**
     * AJAX: Get analytics data
     */
    public function ajax_get_analytics() {
        check_ajax_referer('geo_platform_admin', 'nonce');
        
        if (!current_user_can('read')) {
            wp_die(__('Insufficient permissions', 'geo-platform'));
        }
        
        $period = sanitize_text_field($_POST['period'] ?? '30');
        $metrics = array_map('sanitize_text_field', $_POST['metrics'] ?? array());
        
        $result = $this->api_client->get_analytics($period, $metrics);
        
        wp_send_json($result);
    }
    
    /**
     * AJAX: Generate report
     */
    public function ajax_generate_report() {
        check_ajax_referer('geo_platform_admin', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_die(__('Insufficient permissions', 'geo-platform'));
        }
        
        $report_type = sanitize_text_field($_POST['report_type']);
        $parameters = array_map('sanitize_text_field', $_POST['parameters'] ?? array());
        
        $result = $this->api_client->generate_report($report_type, $parameters);
        
        wp_send_json($result);
    }
}

// Initialize the plugin
function geo_platform_init() {
    return GEO_Platform_Plugin::get_instance();
}

// Start the plugin
geo_platform_init();
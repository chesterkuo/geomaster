<?php
/**
 * Admin functionality for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * GEO Platform Admin Class
 */
class GEO_Platform_Admin {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('admin_init', array($this, 'init_settings'));
        add_action('admin_notices', array($this, 'admin_notices'));
        add_filter('plugin_action_links_' . GEO_PLATFORM_PLUGIN_BASENAME, array($this, 'add_action_links'));
    }
    
    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        // Main menu page
        add_menu_page(
            __('GEO Platform', 'geo-platform'),
            __('GEO Platform', 'geo-platform'),
            'manage_options',
            'geo-platform',
            array($this, 'dashboard_page'),
            'dashicons-chart-area',
            30
        );
        
        // Dashboard (same as main menu)
        add_submenu_page(
            'geo-platform',
            __('Dashboard', 'geo-platform'),
            __('Dashboard', 'geo-platform'),
            'manage_options',
            'geo-platform',
            array($this, 'dashboard_page')
        );
        
        // Settings page
        add_submenu_page(
            'geo-platform',
            __('Settings', 'geo-platform'),
            __('Settings', 'geo-platform'),
            'manage_options',
            'geo-platform-settings',
            array($this, 'settings_page')
        );
        
        // Websites page
        add_submenu_page(
            'geo-platform',
            __('Websites', 'geo-platform'),
            __('Websites', 'geo-platform'),
            'manage_options',
            'geo-platform-websites',
            array($this, 'websites_page')
        );
        
        // Analytics page
        add_submenu_page(
            'geo-platform',
            __('Analytics', 'geo-platform'),
            __('Analytics', 'geo-platform'),
            'read',
            'geo-platform-analytics',
            array($this, 'analytics_page')
        );
        
        // Reports page
        add_submenu_page(
            'geo-platform',
            __('Reports', 'geo-platform'),
            __('Reports', 'geo-platform'),
            'edit_posts',
            'geo-platform-reports',
            array($this, 'reports_page')
        );
        
        // Tools page
        add_submenu_page(
            'geo-platform',
            __('Tools', 'geo-platform'),
            __('Tools', 'geo-platform'),
            'manage_options',
            'geo-platform-tools',
            array($this, 'tools_page')
        );
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our plugin pages
        if (strpos($hook, 'geo-platform') === false) {
            return;
        }
        
        // Enqueue WordPress admin styles and scripts
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_media();
        
        // Plugin admin CSS
        wp_enqueue_style(
            'geo-platform-admin',
            GEO_PLATFORM_PLUGIN_URL . 'admin/css/admin.css',
            array(),
            GEO_PLATFORM_VERSION
        );
        
        // Plugin admin JavaScript
        wp_enqueue_script(
            'geo-platform-admin',
            GEO_PLATFORM_PLUGIN_URL . 'admin/js/admin.js',
            array('jquery', 'wp-color-picker'),
            GEO_PLATFORM_VERSION,
            true
        );
        
        // Localize script
        wp_localize_script('geo-platform-admin', 'geo_platform_admin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('geo_platform_admin'),
            'strings' => array(
                'testing_connection' => __('Testing connection...', 'geo-platform'),
                'connection_success' => __('Connection successful!', 'geo-platform'),
                'connection_failed' => __('Connection failed. Please check your API credentials.', 'geo-platform'),
                'syncing_websites' => __('Syncing websites...', 'geo-platform'),
                'sync_success' => __('Websites synced successfully!', 'geo-platform'),
                'sync_failed' => __('Sync failed. Please try again.', 'geo-platform'),
                'generating_report' => __('Generating report...', 'geo-platform'),
                'report_success' => __('Report generated successfully!', 'geo-platform'),
                'report_failed' => __('Report generation failed. Please try again.', 'geo-platform'),
            )
        ));
    }
    
    /**
     * Initialize settings
     */
    public function init_settings() {
        // Settings sections
        add_settings_section(
            'geo_platform_api_settings',
            __('API Configuration', 'geo-platform'),
            array($this, 'api_settings_callback'),
            'geo_platform_settings'
        );
        
        add_settings_section(
            'geo_platform_sync_settings',
            __('Sync Settings', 'geo-platform'),
            array($this, 'sync_settings_callback'),
            'geo_platform_settings'
        );
        
        add_settings_section(
            'geo_platform_notification_settings',
            __('Notifications', 'geo-platform'),
            array($this, 'notification_settings_callback'),
            'geo_platform_settings'
        );
        
        // API Settings fields
        add_settings_field(
            'geo_platform_api_key',
            __('API Key', 'geo-platform'),
            array($this, 'api_key_field'),
            'geo_platform_settings',
            'geo_platform_api_settings'
        );
        
        add_settings_field(
            'geo_platform_api_url',
            __('API URL', 'geo-platform'),
            array($this, 'api_url_field'),
            'geo_platform_settings',
            'geo_platform_api_settings'
        );
        
        // Sync Settings fields
        add_settings_field(
            'geo_platform_sync_frequency',
            __('Sync Frequency', 'geo-platform'),
            array($this, 'sync_frequency_field'),
            'geo_platform_settings',
            'geo_platform_sync_settings'
        );
        
        add_settings_field(
            'geo_platform_auto_sync',
            __('Auto Sync New Posts', 'geo-platform'),
            array($this, 'auto_sync_field'),
            'geo_platform_settings',
            'geo_platform_sync_settings'
        );
        
        // Notification fields
        add_settings_field(
            'geo_platform_enable_notifications',
            __('Enable Notifications', 'geo-platform'),
            array($this, 'enable_notifications_field'),
            'geo_platform_settings',
            'geo_platform_notification_settings'
        );
        
        add_settings_field(
            'geo_platform_debug_mode',
            __('Debug Mode', 'geo-platform'),
            array($this, 'debug_mode_field'),
            'geo_platform_settings',
            'geo_platform_notification_settings'
        );
    }
    
    /**
     * Add plugin action links
     */
    public function add_action_links($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=geo-platform-settings') . '">' . __('Settings', 'geo-platform') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
    
    /**
     * Display admin notices
     */
    public function admin_notices() {
        $api_key = get_option('geo_platform_api_key');
        $current_screen = get_current_screen();
        
        // Show setup notice if API key is not configured
        if (empty($api_key) && strpos($current_screen->id, 'geo-platform') !== false) {
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p><strong>' . __('GEO Platform:', 'geo-platform') . '</strong> ';
            echo sprintf(
                __('Please configure your API key in the <a href="%s">settings page</a> to start using GEO Platform features.', 'geo-platform'),
                admin_url('admin.php?page=geo-platform-settings')
            );
            echo '</p>';
            echo '</div>';
        }
    }
    
    /**
     * Dashboard page
     */
    public function dashboard_page() {
        include GEO_PLATFORM_PLUGIN_DIR . 'admin/pages/dashboard.php';
    }
    
    /**
     * Settings page
     */
    public function settings_page() {
        include GEO_PLATFORM_PLUGIN_DIR . 'admin/pages/settings.php';
    }
    
    /**
     * Websites page
     */
    public function websites_page() {
        include GEO_PLATFORM_PLUGIN_DIR . 'admin/pages/websites.php';
    }
    
    /**
     * Analytics page
     */
    public function analytics_page() {
        include GEO_PLATFORM_PLUGIN_DIR . 'admin/pages/analytics.php';
    }
    
    /**
     * Reports page
     */
    public function reports_page() {
        include GEO_PLATFORM_PLUGIN_DIR . 'admin/pages/reports.php';
    }
    
    /**
     * Tools page
     */
    public function tools_page() {
        include GEO_PLATFORM_PLUGIN_DIR . 'admin/pages/tools.php';
    }
    
    /**
     * Settings callbacks
     */
    public function api_settings_callback() {
        echo '<p>' . __('Configure your GEO Platform API connection.', 'geo-platform') . '</p>';
    }
    
    public function sync_settings_callback() {
        echo '<p>' . __('Control how and when data is synchronized.', 'geo-platform') . '</p>';
    }
    
    public function notification_settings_callback() {
        echo '<p>' . __('Manage notifications and debug settings.', 'geo-platform') . '</p>';
    }
    
    /**
     * Settings fields
     */
    public function api_key_field() {
        $api_key = get_option('geo_platform_api_key', '');
        echo '<input type="password" id="geo_platform_api_key" name="geo_platform_api_key" value="' . esc_attr($api_key) . '" class="regular-text" />';
        echo '<button type="button" id="test-connection" class="button button-secondary" style="margin-left: 10px;">' . __('Test Connection', 'geo-platform') . '</button>';
        echo '<div id="connection-result" style="margin-top: 10px;"></div>';
    }
    
    public function api_url_field() {
        $api_url = get_option('geo_platform_api_url', 'https://api.geo-platform.com');
        echo '<input type="url" id="geo_platform_api_url" name="geo_platform_api_url" value="' . esc_attr($api_url) . '" class="regular-text" />';
        echo '<p class="description">' . __('Default: https://api.geo-platform.com', 'geo-platform') . '</p>';
    }
    
    public function sync_frequency_field() {
        $frequency = get_option('geo_platform_sync_frequency', 'hourly');
        $options = array(
            'hourly' => __('Hourly', 'geo-platform'),
            'twicedaily' => __('Twice Daily', 'geo-platform'),
            'daily' => __('Daily', 'geo-platform'),
            'weekly' => __('Weekly', 'geo-platform')
        );
        
        echo '<select id="geo_platform_sync_frequency" name="geo_platform_sync_frequency">';
        foreach ($options as $value => $label) {
            echo '<option value="' . esc_attr($value) . '"' . selected($frequency, $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
    }
    
    public function auto_sync_field() {
        $auto_sync = get_option('geo_platform_auto_sync', true);
        echo '<label><input type="checkbox" id="geo_platform_auto_sync" name="geo_platform_auto_sync" value="1"' . checked($auto_sync, true, false) . ' /> ';
        echo __('Automatically sync new posts and pages with GEO Platform', 'geo-platform') . '</label>';
    }
    
    public function enable_notifications_field() {
        $enabled = get_option('geo_platform_enable_notifications', true);
        echo '<label><input type="checkbox" id="geo_platform_enable_notifications" name="geo_platform_enable_notifications" value="1"' . checked($enabled, true, false) . ' /> ';
        echo __('Enable email notifications for sync status and reports', 'geo-platform') . '</label>';
    }
    
    public function debug_mode_field() {
        $debug = get_option('geo_platform_debug_mode', false);
        echo '<label><input type="checkbox" id="geo_platform_debug_mode" name="geo_platform_debug_mode" value="1"' . checked($debug, true, false) . ' /> ';
        echo __('Enable debug logging (for troubleshooting)', 'geo-platform') . '</label>';
    }
}
<?php
/**
 * Plugin Name: GEO Platform - AI Search Engine Optimization
 * Plugin URI: https://geo-platform.com/wordpress-plugin
 * Description: Optimize your WordPress site for AI-driven search engines (ChatGPT, Google Gemini, Perplexity, Claude) with real-time tracking and analytics
 * Version: 1.0.0
 * Author: GEO Platform Team
 * Author URI: https://geo-platform.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: geo-platform
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GEO_PLATFORM_VERSION', '1.0.0');
define('GEO_PLATFORM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GEO_PLATFORM_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GEO_PLATFORM_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('GEO_PLATFORM_API_BASE', 'https://api-geo.blitzgame.site/api/v1');

// Include required files
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform.php';
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform-api.php';
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform-admin.php';
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform-scanner.php';
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform-optimizer.php';
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform-tracker.php';
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform-widget.php';
require_once GEO_PLATFORM_PLUGIN_DIR . 'includes/class-geo-platform-shortcodes.php';

/**
 * Plugin activation hook
 */
function geo_platform_activate() {
    // Create database tables
    geo_platform_create_tables();
    
    // Set default options
    $default_options = array(
        'api_key' => '',
        'organization_id' => '',
        'tracking_enabled' => true,
        'auto_optimize' => false,
        'scan_frequency' => 'weekly',
        'last_scan' => '',
        'geo_score' => 0,
        'ai_visibility' => array(
            'chatgpt' => 0,
            'gemini' => 0,
            'perplexity' => 0,
            'claude' => 0
        )
    );
    
    add_option('geo_platform_settings', $default_options);
    
    // Schedule cron jobs
    if (!wp_next_scheduled('geo_platform_scheduled_scan')) {
        wp_schedule_event(time(), 'weekly', 'geo_platform_scheduled_scan');
    }
    
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'geo_platform_activate');

/**
 * Plugin deactivation hook
 */
function geo_platform_deactivate() {
    // Clear scheduled events
    wp_clear_scheduled_hook('geo_platform_scheduled_scan');
    
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'geo_platform_deactivate');

/**
 * Plugin uninstall hook
 */
function geo_platform_uninstall() {
    // Remove options
    delete_option('geo_platform_settings');
    delete_option('geo_platform_scan_history');
    
    // Drop custom tables
    global $wpdb;
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}geo_platform_scans");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}geo_platform_optimizations");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}geo_platform_tracking");
}
register_uninstall_hook(__FILE__, 'geo_platform_uninstall');

/**
 * Create database tables
 */
function geo_platform_create_tables() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    
    // Scans table
    $table_scans = $wpdb->prefix . 'geo_platform_scans';
    $sql_scans = "CREATE TABLE IF NOT EXISTS $table_scans (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        scan_id varchar(36) NOT NULL,
        url varchar(255) NOT NULL,
        geo_score int(3) DEFAULT 0,
        technical_health int(3) DEFAULT 0,
        content_quality int(3) DEFAULT 0,
        ai_visibility int(3) DEFAULT 0,
        suggestions longtext,
        scan_date datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY scan_id (scan_id),
        KEY url (url)
    ) $charset_collate;";
    
    // Optimizations table
    $table_optimizations = $wpdb->prefix . 'geo_platform_optimizations';
    $sql_optimizations = "CREATE TABLE IF NOT EXISTS $table_optimizations (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        post_id bigint(20) NOT NULL,
        optimization_type varchar(50) NOT NULL,
        original_value longtext,
        optimized_value longtext,
        status varchar(20) DEFAULT 'pending',
        applied_date datetime DEFAULT NULL,
        PRIMARY KEY (id),
        KEY post_id (post_id),
        KEY status (status)
    ) $charset_collate;";
    
    // Tracking table
    $table_tracking = $wpdb->prefix . 'geo_platform_tracking';
    $sql_tracking = "CREATE TABLE IF NOT EXISTS $table_tracking (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        platform varchar(20) NOT NULL,
        keyword varchar(255) NOT NULL,
        mention_count int(11) DEFAULT 0,
        citation_position int(11) DEFAULT NULL,
        sentiment varchar(20) DEFAULT 'neutral',
        tracked_date datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY platform (platform),
        KEY keyword (keyword),
        KEY tracked_date (tracked_date)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql_scans);
    dbDelta($sql_optimizations);
    dbDelta($sql_tracking);
}

/**
 * Initialize the plugin
 */
function geo_platform_init() {
    // Load text domain for translations
    load_plugin_textdomain('geo-platform', false, dirname(plugin_basename(__FILE__)) . '/languages');
    
    // Initialize main plugin class
    $geo_platform = new GEO_Platform();
    $geo_platform->init();
}
add_action('plugins_loaded', 'geo_platform_init');

/**
 * Add plugin action links
 */
function geo_platform_action_links($links) {
    $settings_link = '<a href="' . admin_url('admin.php?page=geo-platform') . '">' . __('Settings', 'geo-platform') . '</a>';
    $pro_link = '<a href="https://geo-platform.com/upgrade" target="_blank" style="color: #00a32a; font-weight: bold;">' . __('Upgrade to Pro', 'geo-platform') . '</a>';
    
    array_unshift($links, $settings_link);
    $links[] = $pro_link;
    
    return $links;
}
add_filter('plugin_action_links_' . GEO_PLATFORM_PLUGIN_BASENAME, 'geo_platform_action_links');

/**
 * Enqueue plugin assets
 */
function geo_platform_enqueue_scripts() {
    // Admin styles
    if (is_admin()) {
        wp_enqueue_style(
            'geo-platform-admin',
            GEO_PLATFORM_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            GEO_PLATFORM_VERSION
        );
        
        wp_enqueue_script(
            'geo-platform-admin',
            GEO_PLATFORM_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'wp-api'),
            GEO_PLATFORM_VERSION,
            true
        );
        
        // Localize script
        wp_localize_script('geo-platform-admin', 'geo_platform', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'api_base' => GEO_PLATFORM_API_BASE,
            'nonce' => wp_create_nonce('geo_platform_nonce'),
            'strings' => array(
                'scanning' => __('Scanning...', 'geo-platform'),
                'optimizing' => __('Optimizing...', 'geo-platform'),
                'success' => __('Success!', 'geo-platform'),
                'error' => __('An error occurred. Please try again.', 'geo-platform'),
                'confirm_optimize' => __('Are you sure you want to apply these optimizations?', 'geo-platform')
            )
        ));
    }
    
    // Frontend styles (if needed)
    if (!is_admin() && get_option('geo_platform_settings')['tracking_enabled']) {
        wp_enqueue_script(
            'geo-platform-tracker',
            GEO_PLATFORM_PLUGIN_URL . 'assets/js/tracker.js',
            array(),
            GEO_PLATFORM_VERSION,
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'geo_platform_enqueue_scripts');
add_action('admin_enqueue_scripts', 'geo_platform_enqueue_scripts');

/**
 * AJAX handlers for admin operations
 */
add_action('wp_ajax_geo_platform_scan_site', 'geo_platform_ajax_scan_site');
function geo_platform_ajax_scan_site() {
    check_ajax_referer('geo_platform_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_die(__('Insufficient permissions', 'geo-platform'));
    }
    
    $scanner = new GEO_Platform_Scanner();
    $result = $scanner->scan_current_site();
    
    wp_send_json($result);
}

add_action('wp_ajax_geo_platform_optimize_content', 'geo_platform_ajax_optimize_content');
function geo_platform_ajax_optimize_content() {
    check_ajax_referer('geo_platform_nonce', 'nonce');
    
    if (!current_user_can('edit_posts')) {
        wp_die(__('Insufficient permissions', 'geo-platform'));
    }
    
    $post_id = intval($_POST['post_id']);
    $optimization_type = sanitize_text_field($_POST['type']);
    
    $optimizer = new GEO_Platform_Optimizer();
    $result = $optimizer->optimize_post($post_id, $optimization_type);
    
    wp_send_json($result);
}

add_action('wp_ajax_geo_platform_get_tracking_data', 'geo_platform_ajax_get_tracking_data');
function geo_platform_ajax_get_tracking_data() {
    check_ajax_referer('geo_platform_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_die(__('Insufficient permissions', 'geo-platform'));
    }
    
    $tracker = new GEO_Platform_Tracker();
    $data = $tracker->get_tracking_data();
    
    wp_send_json($data);
}

/**
 * Add custom meta boxes for post/page optimization
 */
add_action('add_meta_boxes', 'geo_platform_add_meta_boxes');
function geo_platform_add_meta_boxes() {
    $post_types = array('post', 'page');
    
    foreach ($post_types as $post_type) {
        add_meta_box(
            'geo_platform_optimization',
            __('GEO Platform - AI Optimization', 'geo-platform'),
            'geo_platform_optimization_meta_box',
            $post_type,
            'side',
            'high'
        );
    }
}

function geo_platform_optimization_meta_box($post) {
    $optimizer = new GEO_Platform_Optimizer();
    $score = $optimizer->get_post_geo_score($post->ID);
    $suggestions = $optimizer->get_post_suggestions($post->ID);
    ?>
    <div class="geo-platform-meta-box">
        <div class="geo-score-display">
            <h4><?php _e('GEO Score', 'geo-platform'); ?></h4>
            <div class="score-circle" data-score="<?php echo $score; ?>">
                <span class="score-value"><?php echo $score; ?></span>
                <span class="score-label">/100</span>
            </div>
        </div>
        
        <?php if (!empty($suggestions)): ?>
        <div class="geo-suggestions">
            <h4><?php _e('Optimization Suggestions', 'geo-platform'); ?></h4>
            <ul>
                <?php foreach ($suggestions as $suggestion): ?>
                <li><?php echo esc_html($suggestion); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>
        
        <div class="geo-actions">
            <button type="button" class="button button-primary geo-scan-post" data-post-id="<?php echo $post->ID; ?>">
                <?php _e('Scan for AI Optimization', 'geo-platform'); ?>
            </button>
            <button type="button" class="button geo-auto-optimize" data-post-id="<?php echo $post->ID; ?>">
                <?php _e('Auto-Optimize', 'geo-platform'); ?>
            </button>
        </div>
    </div>
    <?php
}

/**
 * Add dashboard widget
 */
add_action('wp_dashboard_setup', 'geo_platform_add_dashboard_widget');
function geo_platform_add_dashboard_widget() {
    wp_add_dashboard_widget(
        'geo_platform_dashboard',
        __('GEO Platform - AI Search Visibility', 'geo-platform'),
        'geo_platform_dashboard_widget'
    );
}

function geo_platform_dashboard_widget() {
    $settings = get_option('geo_platform_settings');
    $geo_score = $settings['geo_score'];
    $ai_visibility = $settings['ai_visibility'];
    ?>
    <div class="geo-platform-dashboard">
        <div class="geo-overview">
            <div class="geo-score">
                <h4><?php _e('Overall GEO Score', 'geo-platform'); ?></h4>
                <span class="score-large"><?php echo $geo_score; ?>/100</span>
            </div>
            <div class="ai-visibility">
                <h4><?php _e('AI Platform Visibility', 'geo-platform'); ?></h4>
                <ul>
                    <li>ChatGPT: <strong><?php echo $ai_visibility['chatgpt']; ?>%</strong></li>
                    <li>Google Gemini: <strong><?php echo $ai_visibility['gemini']; ?>%</strong></li>
                    <li>Perplexity: <strong><?php echo $ai_visibility['perplexity']; ?>%</strong></li>
                    <li>Claude: <strong><?php echo $ai_visibility['claude']; ?>%</strong></li>
                </ul>
            </div>
        </div>
        <div class="geo-actions">
            <a href="<?php echo admin_url('admin.php?page=geo-platform'); ?>" class="button button-primary">
                <?php _e('View Full Report', 'geo-platform'); ?>
            </a>
            <a href="<?php echo admin_url('admin.php?page=geo-platform-scan'); ?>" class="button">
                <?php _e('Run New Scan', 'geo-platform'); ?>
            </a>
        </div>
    </div>
    <?php
}

/**
 * Schedule cron job for automatic scanning
 */
add_action('geo_platform_scheduled_scan', 'geo_platform_run_scheduled_scan');
function geo_platform_run_scheduled_scan() {
    $settings = get_option('geo_platform_settings');
    
    if ($settings['tracking_enabled']) {
        $scanner = new GEO_Platform_Scanner();
        $scanner->scan_current_site();
        
        // Update last scan time
        $settings['last_scan'] = current_time('mysql');
        update_option('geo_platform_settings', $settings);
    }
}
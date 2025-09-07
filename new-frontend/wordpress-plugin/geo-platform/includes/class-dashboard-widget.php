<?php
/**
 * Dashboard Widget for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * GEO Platform Dashboard Widget Class
 */
class GEO_Platform_Dashboard_Widget {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('wp_dashboard_setup', array($this, 'add_dashboard_widget'));
    }
    
    /**
     * Add dashboard widget
     */
    public function add_dashboard_widget() {
        wp_add_dashboard_widget(
            'geo_platform_dashboard_widget',
            __('GEO Platform Overview', 'geo-platform'),
            array($this, 'dashboard_widget_content'),
            array($this, 'dashboard_widget_config')
        );
    }
    
    /**
     * Dashboard widget content
     */
    public function dashboard_widget_content() {
        $api_key = get_option('geo_platform_api_key', '');
        
        if (empty($api_key)) {
            echo '<div class="geo-platform-widget-notice">';
            echo '<p><strong>' . __('GEO Platform not configured', 'geo-platform') . '</strong></p>';
            echo '<p>' . __('Configure your API settings to start tracking your SEO performance.', 'geo-platform') . '</p>';
            echo '<a href="' . admin_url('admin.php?page=geo-platform-settings') . '" class="button button-primary">' . __('Configure Now', 'geo-platform') . '</a>';
            echo '</div>';
            return;
        }
        
        // Get basic stats
        $websites_count = count(GEO_Platform_Database::get_websites(array('limit' => 100)));
        $reports_count = count(GEO_Platform_Database::get_reports(array('limit' => 100)));
        
        // Try to get recent analytics
        $api_client = new GEO_Platform_API_Client();
        $analytics_result = $api_client->get_analytics('7', array('rankings', 'traffic'));
        $recent_analytics = $analytics_result['success'] ? $analytics_result['data'] : array();
        
        ?>
        <div class="geo-platform-widget-content">
            <div class="widget-stats">
                <div class="stat-item">
                    <div class="stat-number"><?php echo esc_html($websites_count); ?></div>
                    <div class="stat-label"><?php esc_html_e('Websites', 'geo-platform'); ?></div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-number"><?php echo esc_html($reports_count); ?></div>
                    <div class="stat-label"><?php esc_html_e('Reports', 'geo-platform'); ?></div>
                </div>
                
                <?php if (!empty($recent_analytics['rankings'])): ?>
                <div class="stat-item">
                    <div class="stat-number"><?php echo esc_html(number_format($recent_analytics['rankings']['average'], 1)); ?></div>
                    <div class="stat-label"><?php esc_html_e('Avg Ranking', 'geo-platform'); ?></div>
                </div>
                <?php endif; ?>
            </div>
            
            <?php if (!empty($recent_analytics)): ?>
            <div class="widget-analytics">
                <h4><?php esc_html_e('Last 7 Days', 'geo-platform'); ?></h4>
                
                <?php if (isset($recent_analytics['traffic'])): ?>
                <div class="analytics-item">
                    <span class="analytics-label"><?php esc_html_e('Total Traffic:', 'geo-platform'); ?></span>
                    <span class="analytics-value"><?php echo esc_html(number_format($recent_analytics['traffic']['total'])); ?></span>
                </div>
                <?php endif; ?>
                
                <?php if (isset($recent_analytics['keywords'])): ?>
                <div class="analytics-item">
                    <span class="analytics-label"><?php esc_html_e('Keywords Tracked:', 'geo-platform'); ?></span>
                    <span class="analytics-value"><?php echo esc_html(number_format($recent_analytics['keywords']['count'])); ?></span>
                </div>
                <?php endif; ?>
            </div>
            <?php endif; ?>
            
            <div class="widget-actions">
                <a href="<?php echo admin_url('admin.php?page=geo-platform'); ?>" class="button button-primary button-small">
                    <?php esc_html_e('View Dashboard', 'geo-platform'); ?>
                </a>
                
                <a href="<?php echo admin_url('admin.php?page=geo-platform-analytics'); ?>" class="button button-secondary button-small">
                    <?php esc_html_e('Analytics', 'geo-platform'); ?>
                </a>
            </div>
        </div>
        
        <style>
        .geo-platform-widget-content .widget-stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .geo-platform-widget-content .stat-item {
            text-align: center;
        }
        
        .geo-platform-widget-content .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #2271b1;
            line-height: 1;
        }
        
        .geo-platform-widget-content .stat-label {
            font-size: 12px;
            color: #646970;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }
        
        .geo-platform-widget-content .widget-analytics {
            margin-bottom: 15px;
        }
        
        .geo-platform-widget-content .widget-analytics h4 {
            margin: 0 0 10px 0;
            font-size: 13px;
            color: #1d2327;
        }
        
        .geo-platform-widget-content .analytics-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 13px;
        }
        
        .geo-platform-widget-content .analytics-label {
            color: #646970;
        }
        
        .geo-platform-widget-content .analytics-value {
            font-weight: 600;
            color: #2271b1;
        }
        
        .geo-platform-widget-content .widget-actions {
            display: flex;
            gap: 8px;
        }
        
        .geo-platform-widget-notice {
            text-align: center;
            padding: 20px 10px;
        }
        
        .geo-platform-widget-notice p {
            margin-bottom: 10px;
        }
        </style>
        <?php
    }
    
    /**
     * Dashboard widget configuration
     */
    public function dashboard_widget_config() {
        if (isset($_POST['geo_platform_widget_submit'])) {
            update_user_meta(get_current_user_id(), 'geo_platform_widget_show_analytics', isset($_POST['show_analytics']));
        }
        
        $show_analytics = get_user_meta(get_current_user_id(), 'geo_platform_widget_show_analytics', true);
        
        ?>
        <p>
            <label>
                <input type="checkbox" name="show_analytics" value="1" <?php checked($show_analytics, true); ?> />
                <?php esc_html_e('Show analytics data', 'geo-platform'); ?>
            </label>
        </p>
        
        <input type="hidden" name="geo_platform_widget_submit" value="1" />
        <?php
    }
}
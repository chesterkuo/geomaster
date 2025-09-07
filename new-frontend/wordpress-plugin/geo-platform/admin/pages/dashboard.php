<?php
/**
 * Dashboard page for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get API client instance
$api_client = new GEO_Platform_API_Client();

// Check API connection status
$api_key = get_option('geo_platform_api_key', '');
$connection_status = array('connected' => false, 'message' => __('Not configured', 'geo-platform'));

if (!empty($api_key)) {
    $test_result = $api_client->test_connection();
    $connection_status = array(
        'connected' => $test_result['success'],
        'message' => $test_result['message']
    );
}

// Get basic stats
$websites_count = count(GEO_Platform_Database::get_websites(array('limit' => 1000)));
$reports_count = count(GEO_Platform_Database::get_reports(array('limit' => 1000)));
$recent_reports = GEO_Platform_Database::get_reports(array('limit' => 5));

// Get recent analytics if connected
$recent_analytics = array();
if ($connection_status['connected']) {
    $analytics_result = $api_client->get_analytics('7', array('rankings', 'traffic'));
    if ($analytics_result['success']) {
        $recent_analytics = $analytics_result['data'];
    }
}
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <!-- Connection Status Card -->
    <div class="geo-platform-dashboard-cards">
        <div class="geo-platform-card geo-platform-connection-status <?php echo $connection_status['connected'] ? 'connected' : 'disconnected'; ?>">
            <div class="geo-platform-card-header">
                <h3><span class="dashicons <?php echo $connection_status['connected'] ? 'dashicons-yes-alt' : 'dashicons-dismiss'; ?>"></span>
                <?php esc_html_e('API Connection', 'geo-platform'); ?></h3>
            </div>
            <div class="geo-platform-card-body">
                <p class="connection-message"><?php echo esc_html($connection_status['message']); ?></p>
                <?php if (!$connection_status['connected']): ?>
                    <p><a href="<?php echo admin_url('admin.php?page=geo-platform-settings'); ?>" class="button button-primary">
                        <?php esc_html_e('Configure API Settings', 'geo-platform'); ?>
                    </a></p>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Quick Stats Cards -->
        <div class="geo-platform-card">
            <div class="geo-platform-card-header">
                <h3><span class="dashicons dashicons-admin-site-alt3"></span>
                <?php esc_html_e('Connected Websites', 'geo-platform'); ?></h3>
            </div>
            <div class="geo-platform-card-body">
                <div class="geo-platform-stat-number"><?php echo esc_html($websites_count); ?></div>
                <p><a href="<?php echo admin_url('admin.php?page=geo-platform-websites'); ?>">
                    <?php esc_html_e('Manage Websites', 'geo-platform'); ?>
                </a></p>
            </div>
        </div>
        
        <div class="geo-platform-card">
            <div class="geo-platform-card-header">
                <h3><span class="dashicons dashicons-chart-area"></span>
                <?php esc_html_e('Generated Reports', 'geo-platform'); ?></h3>
            </div>
            <div class="geo-platform-card-body">
                <div class="geo-platform-stat-number"><?php echo esc_html($reports_count); ?></div>
                <p><a href="<?php echo admin_url('admin.php?page=geo-platform-reports'); ?>">
                    <?php esc_html_e('View All Reports', 'geo-platform'); ?>
                </a></p>
            </div>
        </div>
    </div>
    
    <!-- Main Dashboard Content -->
    <div class="geo-platform-dashboard-main">
        <div class="geo-platform-dashboard-left">
            
            <!-- Quick Actions -->
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-admin-tools"></span>
                    <?php esc_html_e('Quick Actions', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <div class="geo-platform-quick-actions">
                        <?php if ($connection_status['connected']): ?>
                            <button type="button" id="sync-websites" class="button button-secondary">
                                <span class="dashicons dashicons-update"></span>
                                <?php esc_html_e('Sync Websites', 'geo-platform'); ?>
                            </button>
                            
                            <button type="button" id="generate-quick-report" class="button button-secondary">
                                <span class="dashicons dashicons-media-document"></span>
                                <?php esc_html_e('Generate Quick Report', 'geo-platform'); ?>
                            </button>
                            
                            <a href="<?php echo admin_url('admin.php?page=geo-platform-analytics'); ?>" class="button button-secondary">
                                <span class="dashicons dashicons-chart-line"></span>
                                <?php esc_html_e('View Analytics', 'geo-platform'); ?>
                            </a>
                        <?php else: ?>
                            <p class="description"><?php esc_html_e('Configure API connection to enable quick actions.', 'geo-platform'); ?></p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <!-- Recent Analytics -->
            <?php if ($connection_status['connected'] && !empty($recent_analytics)): ?>
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-chart-bar"></span>
                    <?php esc_html_e('Recent Analytics (Last 7 Days)', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <div class="geo-platform-analytics-preview">
                        <?php if (isset($recent_analytics['rankings'])): ?>
                            <div class="analytics-metric">
                                <strong><?php esc_html_e('Average Ranking:', 'geo-platform'); ?></strong>
                                <span class="metric-value"><?php echo esc_html(number_format($recent_analytics['rankings']['average'], 1)); ?></span>
                            </div>
                        <?php endif; ?>
                        
                        <?php if (isset($recent_analytics['traffic'])): ?>
                            <div class="analytics-metric">
                                <strong><?php esc_html_e('Total Traffic:', 'geo-platform'); ?></strong>
                                <span class="metric-value"><?php echo esc_html(number_format($recent_analytics['traffic']['total'])); ?></span>
                            </div>
                        <?php endif; ?>
                        
                        <?php if (isset($recent_analytics['keywords'])): ?>
                            <div class="analytics-metric">
                                <strong><?php esc_html_e('Tracked Keywords:', 'geo-platform'); ?></strong>
                                <span class="metric-value"><?php echo esc_html(number_format($recent_analytics['keywords']['count'])); ?></span>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <p class="analytics-link">
                        <a href="<?php echo admin_url('admin.php?page=geo-platform-analytics'); ?>">
                            <?php esc_html_e('View Detailed Analytics', 'geo-platform'); ?> &rarr;
                        </a>
                    </p>
                </div>
            </div>
            <?php endif; ?>
            
        </div>
        
        <div class="geo-platform-dashboard-right">
            
            <!-- Recent Reports -->
            <?php if (!empty($recent_reports)): ?>
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-media-document"></span>
                    <?php esc_html_e('Recent Reports', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <div class="geo-platform-reports-list">
                        <?php foreach ($recent_reports as $report): ?>
                            <div class="report-item">
                                <div class="report-info">
                                    <strong class="report-name"><?php echo esc_html($report['report_name']); ?></strong>
                                    <span class="report-type"><?php echo esc_html(ucfirst($report['report_type'])); ?></span>
                                    <span class="report-status status-<?php echo esc_attr($report['status']); ?>">
                                        <?php echo esc_html(ucfirst($report['status'])); ?>
                                    </span>
                                </div>
                                <div class="report-date">
                                    <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($report['created_at']))); ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    
                    <p class="reports-link">
                        <a href="<?php echo admin_url('admin.php?page=geo-platform-reports'); ?>">
                            <?php esc_html_e('View All Reports', 'geo-platform'); ?> &rarr;
                        </a>
                    </p>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- System Status -->
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-admin-generic"></span>
                    <?php esc_html_e('System Status', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <div class="geo-platform-system-status">
                        <div class="status-item">
                            <span class="status-label"><?php esc_html_e('Plugin Version:', 'geo-platform'); ?></span>
                            <span class="status-value"><?php echo esc_html(GEO_PLATFORM_VERSION); ?></span>
                        </div>
                        
                        <div class="status-item">
                            <span class="status-label"><?php esc_html_e('WordPress Version:', 'geo-platform'); ?></span>
                            <span class="status-value"><?php echo esc_html(get_bloginfo('version')); ?></span>
                        </div>
                        
                        <div class="status-item">
                            <span class="status-label"><?php esc_html_e('PHP Version:', 'geo-platform'); ?></span>
                            <span class="status-value"><?php echo esc_html(phpversion()); ?></span>
                        </div>
                        
                        <div class="status-item">
                            <span class="status-label"><?php esc_html_e('Database Tables:', 'geo-platform'); ?></span>
                            <span class="status-value status-ok"><?php esc_html_e('OK', 'geo-platform'); ?></span>
                        </div>
                        
                        <div class="status-item">
                            <span class="status-label"><?php esc_html_e('Sync Frequency:', 'geo-platform'); ?></span>
                            <span class="status-value"><?php echo esc_html(ucfirst(get_option('geo_platform_sync_frequency', 'hourly'))); ?></span>
                        </div>
                        
                        <div class="status-item">
                            <span class="status-label"><?php esc_html_e('Debug Mode:', 'geo-platform'); ?></span>
                            <span class="status-value">
                                <?php echo get_option('geo_platform_debug_mode', false) ? 
                                    esc_html__('Enabled', 'geo-platform') : 
                                    esc_html__('Disabled', 'geo-platform'); ?>
                            </span>
                        </div>
                    </div>
                    
                    <p class="system-link">
                        <a href="<?php echo admin_url('admin.php?page=geo-platform-tools'); ?>">
                            <?php esc_html_e('System Tools', 'geo-platform'); ?> &rarr;
                        </a>
                    </p>
                </div>
            </div>
            
            <!-- Help & Resources -->
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-sos"></span>
                    <?php esc_html_e('Help & Resources', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <div class="geo-platform-help-links">
                        <a href="https://geo-platform.com/docs" target="_blank" class="help-link">
                            <span class="dashicons dashicons-book"></span>
                            <?php esc_html_e('Documentation', 'geo-platform'); ?>
                        </a>
                        
                        <a href="https://geo-platform.com/support" target="_blank" class="help-link">
                            <span class="dashicons dashicons-admin-comments"></span>
                            <?php esc_html_e('Support Forum', 'geo-platform'); ?>
                        </a>
                        
                        <a href="https://geo-platform.com/api-docs" target="_blank" class="help-link">
                            <span class="dashicons dashicons-admin-links"></span>
                            <?php esc_html_e('API Documentation', 'geo-platform'); ?>
                        </a>
                        
                        <a href="mailto:support@geo-platform.com" class="help-link">
                            <span class="dashicons dashicons-email"></span>
                            <?php esc_html_e('Contact Support', 'geo-platform'); ?>
                        </a>
                    </div>
                </div>
            </div>
            
        </div>
    </div>
</div>

<!-- Action Results Modal -->
<div id="geo-platform-modal" class="geo-platform-modal" style="display: none;">
    <div class="geo-platform-modal-content">
        <span class="geo-platform-modal-close">&times;</span>
        <h2 id="modal-title"></h2>
        <div id="modal-body"></div>
        <div class="modal-actions">
            <button type="button" class="button button-primary" id="modal-ok"><?php esc_html_e('OK', 'geo-platform'); ?></button>
        </div>
    </div>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    
    // Sync websites
    $('#sync-websites').on('click', function() {
        var $button = $(this);
        var originalText = $button.text();
        
        $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> ' + geo_platform_admin.strings.syncing_websites);
        
        $.ajax({
            url: geo_platform_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'geo_platform_sync_websites',
                nonce: geo_platform_admin.nonce
            },
            success: function(response) {
                if (response.success) {
                    showModal(geo_platform_admin.strings.sync_success, response.data.message);
                    // Reload page after 2 seconds
                    setTimeout(function() {
                        location.reload();
                    }, 2000);
                } else {
                    showModal(geo_platform_admin.strings.sync_failed, response.data.message);
                }
            },
            error: function() {
                showModal(geo_platform_admin.strings.sync_failed, '<?php echo esc_js(__("An unexpected error occurred.", "geo-platform")); ?>');
            },
            complete: function() {
                $button.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Generate quick report
    $('#generate-quick-report').on('click', function() {
        var $button = $(this);
        var originalText = $button.text();
        
        $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> ' + geo_platform_admin.strings.generating_report);
        
        $.ajax({
            url: geo_platform_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'geo_platform_generate_report',
                nonce: geo_platform_admin.nonce,
                report_type: 'quick_overview',
                parameters: {
                    name: 'Quick Overview Report - ' + new Date().toLocaleDateString()
                }
            },
            success: function(response) {
                if (response.success) {
                    showModal(geo_platform_admin.strings.report_success, response.data.message);
                } else {
                    showModal(geo_platform_admin.strings.report_failed, response.data.message);
                }
            },
            error: function() {
                showModal(geo_platform_admin.strings.report_failed, '<?php echo esc_js(__("An unexpected error occurred.", "geo-platform")); ?>');
            },
            complete: function() {
                $button.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Modal functions
    function showModal(title, message) {
        $('#modal-title').text(title);
        $('#modal-body').html('<p>' + message + '</p>');
        $('#geo-platform-modal').show();
    }
    
    // Close modal
    $('.geo-platform-modal-close, #modal-ok').on('click', function() {
        $('#geo-platform-modal').hide();
    });
    
    // Close modal on outside click
    $(window).on('click', function(event) {
        if (event.target.id === 'geo-platform-modal') {
            $('#geo-platform-modal').hide();
        }
    });
    
});
</script>
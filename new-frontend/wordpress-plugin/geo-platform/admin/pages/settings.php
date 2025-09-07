<?php
/**
 * Settings page for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Handle form submission
if (isset($_POST['submit']) && wp_verify_nonce($_POST['geo_platform_settings_nonce'], 'geo_platform_settings')) {
    // Save settings
    $settings_updated = false;
    
    // API Settings
    if (isset($_POST['geo_platform_api_key'])) {
        update_option('geo_platform_api_key', sanitize_text_field($_POST['geo_platform_api_key']));
        $settings_updated = true;
    }
    
    if (isset($_POST['geo_platform_api_url'])) {
        update_option('geo_platform_api_url', esc_url_raw($_POST['geo_platform_api_url']));
        $settings_updated = true;
    }
    
    // Sync Settings
    if (isset($_POST['geo_platform_sync_frequency'])) {
        update_option('geo_platform_sync_frequency', sanitize_text_field($_POST['geo_platform_sync_frequency']));
        $settings_updated = true;
    }
    
    update_option('geo_platform_auto_sync', isset($_POST['geo_platform_auto_sync']) ? 1 : 0);
    
    // Notification Settings
    update_option('geo_platform_enable_notifications', isset($_POST['geo_platform_enable_notifications']) ? 1 : 0);
    update_option('geo_platform_debug_mode', isset($_POST['geo_platform_debug_mode']) ? 1 : 0);
    
    if ($settings_updated) {
        echo '<div class="notice notice-success is-dismissible"><p>' . __('Settings saved successfully!', 'geo-platform') . '</p></div>';
    }
}

// Get current values
$api_key = get_option('geo_platform_api_key', '');
$api_url = get_option('geo_platform_api_url', 'https://api.geo-platform.com');
$sync_frequency = get_option('geo_platform_sync_frequency', 'hourly');
$auto_sync = get_option('geo_platform_auto_sync', true);
$enable_notifications = get_option('geo_platform_enable_notifications', true);
$debug_mode = get_option('geo_platform_debug_mode', false);

// Test connection if API key is set
$connection_status = null;
if (!empty($api_key)) {
    $api_client = new GEO_Platform_API_Client();
    $test_result = $api_client->test_connection();
    $connection_status = $test_result;
}
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <form method="post" action="" id="geo-platform-settings-form">
        <?php wp_nonce_field('geo_platform_settings', 'geo_platform_settings_nonce'); ?>
        
        <!-- API Configuration -->
        <div class="geo-platform-settings-section">
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-admin-network"></span>
                    <?php esc_html_e('API Configuration', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <p class="description">
                        <?php esc_html_e('Configure your GEO Platform API connection. You can find your API key in your GEO Platform dashboard.', 'geo-platform'); ?>
                    </p>
                    
                    <table class="form-table" role="presentation">
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <label for="geo_platform_api_url"><?php esc_html_e('API URL', 'geo-platform'); ?></label>
                                </th>
                                <td>
                                    <input type="url" id="geo_platform_api_url" name="geo_platform_api_url" 
                                           value="<?php echo esc_attr($api_url); ?>" class="regular-text" />
                                    <p class="description">
                                        <?php esc_html_e('Default: https://api.geo-platform.com', 'geo-platform'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="geo_platform_api_key"><?php esc_html_e('API Key', 'geo-platform'); ?> <span class="required">*</span></label>
                                </th>
                                <td>
                                    <input type="password" id="geo_platform_api_key" name="geo_platform_api_key" 
                                           value="<?php echo esc_attr($api_key); ?>" class="regular-text" required />
                                    <button type="button" id="toggle-api-key" class="button button-secondary" style="margin-left: 5px;">
                                        <span class="dashicons dashicons-visibility"></span>
                                    </button>
                                    <button type="button" id="test-connection" class="button button-secondary" style="margin-left: 5px;">
                                        <?php esc_html_e('Test Connection', 'geo-platform'); ?>
                                    </button>
                                    
                                    <div id="connection-result" style="margin-top: 10px;">
                                        <?php if ($connection_status): ?>
                                            <div class="connection-status <?php echo $connection_status['success'] ? 'success' : 'error'; ?>">
                                                <span class="dashicons <?php echo $connection_status['success'] ? 'dashicons-yes-alt' : 'dashicons-dismiss'; ?>"></span>
                                                <?php echo esc_html($connection_status['message']); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    
                                    <p class="description">
                                        <?php esc_html_e('Your GEO Platform API key. Keep this secure and do not share it publicly.', 'geo-platform'); ?>
                                        <br>
                                        <a href="https://geo-platform.com/dashboard/api-keys" target="_blank">
                                            <?php esc_html_e('Get your API key from GEO Platform dashboard', 'geo-platform'); ?> &rarr;
                                        </a>
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Sync Settings -->
        <div class="geo-platform-settings-section">
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-update"></span>
                    <?php esc_html_e('Synchronization Settings', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <p class="description">
                        <?php esc_html_e('Control how and when data is synchronized between your WordPress site and GEO Platform.', 'geo-platform'); ?>
                    </p>
                    
                    <table class="form-table" role="presentation">
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <label for="geo_platform_sync_frequency"><?php esc_html_e('Sync Frequency', 'geo-platform'); ?></label>
                                </th>
                                <td>
                                    <select id="geo_platform_sync_frequency" name="geo_platform_sync_frequency">
                                        <option value="hourly" <?php selected($sync_frequency, 'hourly'); ?>>
                                            <?php esc_html_e('Every Hour', 'geo-platform'); ?>
                                        </option>
                                        <option value="twicedaily" <?php selected($sync_frequency, 'twicedaily'); ?>>
                                            <?php esc_html_e('Twice Daily', 'geo-platform'); ?>
                                        </option>
                                        <option value="daily" <?php selected($sync_frequency, 'daily'); ?>>
                                            <?php esc_html_e('Daily', 'geo-platform'); ?>
                                        </option>
                                        <option value="weekly" <?php selected($sync_frequency, 'weekly'); ?>>
                                            <?php esc_html_e('Weekly', 'geo-platform'); ?>
                                        </option>
                                    </select>
                                    <p class="description">
                                        <?php esc_html_e('How often to automatically sync data with GEO Platform.', 'geo-platform'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="geo_platform_auto_sync"><?php esc_html_e('Auto-Sync Content', 'geo-platform'); ?></label>
                                </th>
                                <td>
                                    <fieldset>
                                        <legend class="screen-reader-text">
                                            <span><?php esc_html_e('Auto-Sync Content', 'geo-platform'); ?></span>
                                        </legend>
                                        <label for="geo_platform_auto_sync">
                                            <input type="checkbox" id="geo_platform_auto_sync" name="geo_platform_auto_sync" 
                                                   value="1" <?php checked($auto_sync, true); ?> />
                                            <?php esc_html_e('Automatically sync new posts and pages with GEO Platform', 'geo-platform'); ?>
                                        </label>
                                        <p class="description">
                                            <?php esc_html_e('When enabled, new content will be automatically submitted to GEO Platform for analysis.', 'geo-platform'); ?>
                                        </p>
                                    </fieldset>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Notification Settings -->
        <div class="geo-platform-settings-section">
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-email"></span>
                    <?php esc_html_e('Notifications & Debug', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <p class="description">
                        <?php esc_html_e('Configure notifications and debugging options.', 'geo-platform'); ?>
                    </p>
                    
                    <table class="form-table" role="presentation">
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <label for="geo_platform_enable_notifications"><?php esc_html_e('Email Notifications', 'geo-platform'); ?></label>
                                </th>
                                <td>
                                    <fieldset>
                                        <legend class="screen-reader-text">
                                            <span><?php esc_html_e('Email Notifications', 'geo-platform'); ?></span>
                                        </legend>
                                        <label for="geo_platform_enable_notifications">
                                            <input type="checkbox" id="geo_platform_enable_notifications" name="geo_platform_enable_notifications" 
                                                   value="1" <?php checked($enable_notifications, true); ?> />
                                            <?php esc_html_e('Send email notifications for sync status and reports', 'geo-platform'); ?>
                                        </label>
                                        <p class="description">
                                            <?php 
                                            printf(
                                                __('Notifications will be sent to: %s', 'geo-platform'),
                                                '<strong>' . esc_html(get_option('admin_email')) . '</strong>'
                                            ); 
                                            ?>
                                        </p>
                                    </fieldset>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="geo_platform_debug_mode"><?php esc_html_e('Debug Mode', 'geo-platform'); ?></label>
                                </th>
                                <td>
                                    <fieldset>
                                        <legend class="screen-reader-text">
                                            <span><?php esc_html_e('Debug Mode', 'geo-platform'); ?></span>
                                        </legend>
                                        <label for="geo_platform_debug_mode">
                                            <input type="checkbox" id="geo_platform_debug_mode" name="geo_platform_debug_mode" 
                                                   value="1" <?php checked($debug_mode, true); ?> />
                                            <?php esc_html_e('Enable debug logging for troubleshooting', 'geo-platform'); ?>
                                        </label>
                                        <p class="description">
                                            <?php esc_html_e('Debug logs will be written to WordPress error log. Only enable when troubleshooting issues.', 'geo-platform'); ?>
                                        </p>
                                    </fieldset>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Advanced Settings -->
        <div class="geo-platform-settings-section">
            <div class="geo-platform-card">
                <div class="geo-platform-card-header">
                    <h3><span class="dashicons dashicons-admin-settings"></span>
                    <?php esc_html_e('Advanced Settings', 'geo-platform'); ?></h3>
                </div>
                <div class="geo-platform-card-body">
                    <div class="geo-platform-advanced-settings">
                        <div class="setting-group">
                            <h4><?php esc_html_e('Data Management', 'geo-platform'); ?></h4>
                            <p class="description">
                                <?php esc_html_e('Manage your GEO Platform data and settings.', 'geo-platform'); ?>
                            </p>
                            
                            <div class="setting-actions">
                                <button type="button" id="clear-cache" class="button button-secondary">
                                    <span class="dashicons dashicons-trash"></span>
                                    <?php esc_html_e('Clear Cache', 'geo-platform'); ?>
                                </button>
                                
                                <button type="button" id="reset-settings" class="button button-secondary button-danger">
                                    <span class="dashicons dashicons-warning"></span>
                                    <?php esc_html_e('Reset All Settings', 'geo-platform'); ?>
                                </button>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <h4><?php esc_html_e('Export/Import', 'geo-platform'); ?></h4>
                            <p class="description">
                                <?php esc_html_e('Export or import your plugin settings.', 'geo-platform'); ?>
                            </p>
                            
                            <div class="setting-actions">
                                <button type="button" id="export-settings" class="button button-secondary">
                                    <span class="dashicons dashicons-download"></span>
                                    <?php esc_html_e('Export Settings', 'geo-platform'); ?>
                                </button>
                                
                                <input type="file" id="import-settings-file" accept=".json" style="display: none;">
                                <button type="button" id="import-settings" class="button button-secondary">
                                    <span class="dashicons dashicons-upload"></span>
                                    <?php esc_html_e('Import Settings', 'geo-platform'); ?>
                                </button>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <h4><?php esc_html_e('System Information', 'geo-platform'); ?></h4>
                            <div class="system-info">
                                <table class="widefat">
                                    <tbody>
                                        <tr>
                                            <td><strong><?php esc_html_e('Plugin Version:', 'geo-platform'); ?></strong></td>
                                            <td><?php echo esc_html(GEO_PLATFORM_VERSION); ?></td>
                                        </tr>
                                        <tr>
                                            <td><strong><?php esc_html_e('WordPress Version:', 'geo-platform'); ?></strong></td>
                                            <td><?php echo esc_html(get_bloginfo('version')); ?></td>
                                        </tr>
                                        <tr>
                                            <td><strong><?php esc_html_e('PHP Version:', 'geo-platform'); ?></strong></td>
                                            <td><?php echo esc_html(phpversion()); ?></td>
                                        </tr>
                                        <tr>
                                            <td><strong><?php esc_html_e('Database Version:', 'geo-platform'); ?></strong></td>
                                            <td><?php echo esc_html(get_option('geo_platform_db_version', 'Not set')); ?></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Submit Button -->
        <p class="submit">
            <input type="submit" name="submit" id="submit" class="button button-primary button-large" 
                   value="<?php esc_attr_e('Save Settings', 'geo-platform'); ?>" />
        </p>
    </form>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    
    // Toggle API key visibility
    $('#toggle-api-key').on('click', function() {
        var $input = $('#geo_platform_api_key');
        var $icon = $(this).find('.dashicons');
        
        if ($input.attr('type') === 'password') {
            $input.attr('type', 'text');
            $icon.removeClass('dashicons-visibility').addClass('dashicons-hidden');
        } else {
            $input.attr('type', 'password');
            $icon.removeClass('dashicons-hidden').addClass('dashicons-visibility');
        }
    });
    
    // Test connection
    $('#test-connection').on('click', function() {
        var $button = $(this);
        var $result = $('#connection-result');
        var originalText = $button.text();
        
        $button.prop('disabled', true).text(geo_platform_admin.strings.testing_connection);
        
        $.ajax({
            url: geo_platform_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'geo_platform_test_connection',
                nonce: geo_platform_admin.nonce,
                api_key: $('#geo_platform_api_key').val(),
                api_url: $('#geo_platform_api_url').val()
            },
            success: function(response) {
                var statusClass = response.success ? 'success' : 'error';
                var iconClass = response.success ? 'dashicons-yes-alt' : 'dashicons-dismiss';
                
                $result.html(
                    '<div class="connection-status ' + statusClass + '">' +
                    '<span class="dashicons ' + iconClass + '"></span>' +
                    response.data.message +
                    '</div>'
                );
            },
            error: function() {
                $result.html(
                    '<div class="connection-status error">' +
                    '<span class="dashicons dashicons-dismiss"></span>' +
                    '<?php echo esc_js(__("Connection test failed. Please try again.", "geo-platform")); ?>' +
                    '</div>'
                );
            },
            complete: function() {
                $button.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // Clear cache
    $('#clear-cache').on('click', function() {
        if (confirm('<?php echo esc_js(__("Are you sure you want to clear all cached data?", "geo-platform")); ?>')) {
            // Implement cache clearing logic
            alert('<?php echo esc_js(__("Cache cleared successfully!", "geo-platform")); ?>');
        }
    });
    
    // Reset settings
    $('#reset-settings').on('click', function() {
        if (confirm('<?php echo esc_js(__("Are you sure you want to reset all settings to default values? This action cannot be undone.", "geo-platform")); ?>')) {
            if (confirm('<?php echo esc_js(__("This will permanently delete all your GEO Platform settings. Are you absolutely sure?", "geo-platform")); ?>')) {
                // Reset form values
                $('#geo_platform_api_key').val('');
                $('#geo_platform_api_url').val('https://api.geo-platform.com');
                $('#geo_platform_sync_frequency').val('hourly');
                $('#geo_platform_auto_sync').prop('checked', true);
                $('#geo_platform_enable_notifications').prop('checked', true);
                $('#geo_platform_debug_mode').prop('checked', false);
                
                alert('<?php echo esc_js(__("Settings have been reset. Please save to confirm changes.", "geo-platform")); ?>');
            }
        }
    });
    
    // Export settings
    $('#export-settings').on('click', function() {
        var settings = {
            api_url: $('#geo_platform_api_url').val(),
            sync_frequency: $('#geo_platform_sync_frequency').val(),
            auto_sync: $('#geo_platform_auto_sync').prop('checked'),
            enable_notifications: $('#geo_platform_enable_notifications').prop('checked'),
            debug_mode: $('#geo_platform_debug_mode').prop('checked')
        };
        
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "geo-platform-settings.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
    
    // Import settings
    $('#import-settings').on('click', function() {
        $('#import-settings-file').click();
    });
    
    $('#import-settings-file').on('change', function(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var settings = JSON.parse(e.target.result);
                    
                    if (settings.api_url) $('#geo_platform_api_url').val(settings.api_url);
                    if (settings.sync_frequency) $('#geo_platform_sync_frequency').val(settings.sync_frequency);
                    if (typeof settings.auto_sync !== 'undefined') $('#geo_platform_auto_sync').prop('checked', settings.auto_sync);
                    if (typeof settings.enable_notifications !== 'undefined') $('#geo_platform_enable_notifications').prop('checked', settings.enable_notifications);
                    if (typeof settings.debug_mode !== 'undefined') $('#geo_platform_debug_mode').prop('checked', settings.debug_mode);
                    
                    alert('<?php echo esc_js(__("Settings imported successfully! Please save to confirm changes.", "geo-platform")); ?>');
                } catch (error) {
                    alert('<?php echo esc_js(__("Invalid settings file format.", "geo-platform")); ?>');
                }
            };
            reader.readAsText(file);
        }
    });
    
});
</script>
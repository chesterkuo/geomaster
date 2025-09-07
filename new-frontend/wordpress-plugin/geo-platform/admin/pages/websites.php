<?php
/**
 * Websites management page for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get websites data
$websites = GEO_Platform_Database::get_websites(array('limit' => 100));
$api_client = new GEO_Platform_API_Client();

// Check if we can connect to API
$api_key = get_option('geo_platform_api_key', '');
$can_sync = !empty($api_key);

// Handle actions
if (isset($_POST['action']) && wp_verify_nonce($_POST['geo_platform_websites_nonce'], 'geo_platform_websites')) {
    if ($_POST['action'] === 'sync_all' && current_user_can('manage_options')) {
        $sync_result = $api_client->sync_websites();
        if ($sync_result['success']) {
            echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($sync_result['message']) . '</p></div>';
            // Refresh websites data
            $websites = GEO_Platform_Database::get_websites(array('limit' => 100));
        } else {
            echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($sync_result['message']) . '</p></div>';
        }
    }
}

// Get sync statistics
$total_websites = count($websites);
$synced_websites = count(array_filter($websites, function($website) {
    return $website['sync_status'] === 'synced';
}));
$active_websites = count(array_filter($websites, function($website) {
    return $website['status'] === 'active';
}));
?>

<div class="wrap">
    <div class="websites-header">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        
        <div class="websites-actions">
            <?php if ($can_sync): ?>
                <form method="post" style="display: inline;">
                    <?php wp_nonce_field('geo_platform_websites', 'geo_platform_websites_nonce'); ?>
                    <input type="hidden" name="action" value="sync_all">
                    <button type="submit" class="button button-primary">
                        <span class="dashicons dashicons-update"></span>
                        <?php esc_html_e('Sync All Websites', 'geo-platform'); ?>
                    </button>
                </form>
                
                <button type="button" id="add-website" class="button button-secondary">
                    <span class="dashicons dashicons-plus"></span>
                    <?php esc_html_e('Add Website', 'geo-platform'); ?>
                </button>
            <?php else: ?>
                <a href="<?php echo admin_url('admin.php?page=geo-platform-settings'); ?>" class="button button-primary">
                    <?php esc_html_e('Configure API Settings', 'geo-platform'); ?>
                </a>
            <?php endif; ?>
            
            <button type="button" class="button button-secondary geo-platform-refresh" data-refresh-type="websites">
                <span class="dashicons dashicons-update"></span>
                <?php esc_html_e('Refresh', 'geo-platform'); ?>
            </button>
        </div>
    </div>
    
    <!-- Websites Statistics -->
    <div class="websites-stats">
        <div class="geo-platform-card">
            <div class="geo-platform-card-body">
                <div class="websites-summary">
                    <div class="summary-stat">
                        <div class="stat-number"><?php echo esc_html($total_websites); ?></div>
                        <div class="stat-label"><?php esc_html_e('Total Websites', 'geo-platform'); ?></div>
                    </div>
                    
                    <div class="summary-stat">
                        <div class="stat-number"><?php echo esc_html($active_websites); ?></div>
                        <div class="stat-label"><?php esc_html_e('Active Websites', 'geo-platform'); ?></div>
                    </div>
                    
                    <div class="summary-stat">
                        <div class="stat-number"><?php echo esc_html($synced_websites); ?></div>
                        <div class="stat-label"><?php esc_html_e('Synced Websites', 'geo-platform'); ?></div>
                    </div>
                    
                    <div class="summary-stat">
                        <div class="stat-number"><?php echo $total_websites > 0 ? esc_html(round(($synced_websites / $total_websites) * 100)) : '0'; ?>%</div>
                        <div class="stat-label"><?php esc_html_e('Sync Rate', 'geo-platform'); ?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <?php if (empty($websites)): ?>
        <!-- Empty State -->
        <div class="geo-platform-card">
            <div class="geo-platform-card-body">
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <span class="dashicons dashicons-admin-site-alt3"></span>
                    </div>
                    <h3><?php esc_html_e('No Websites Found', 'geo-platform'); ?></h3>
                    <p><?php esc_html_e('Get started by adding your first website or syncing with your GEO Platform account.', 'geo-platform'); ?></p>
                    
                    <?php if ($can_sync): ?>
                        <div class="empty-state-actions">
                            <form method="post" style="display: inline;">
                                <?php wp_nonce_field('geo_platform_websites', 'geo_platform_websites_nonce'); ?>
                                <input type="hidden" name="action" value="sync_all">
                                <button type="submit" class="button button-primary">
                                    <span class="dashicons dashicons-update"></span>
                                    <?php esc_html_e('Sync from GEO Platform', 'geo-platform'); ?>
                                </button>
                            </form>
                            
                            <button type="button" id="add-website" class="button button-secondary">
                                <span class="dashicons dashicons-plus"></span>
                                <?php esc_html_e('Add Manually', 'geo-platform'); ?>
                            </button>
                        </div>
                    <?php else: ?>
                        <a href="<?php echo admin_url('admin.php?page=geo-platform-settings'); ?>" class="button button-primary">
                            <?php esc_html_e('Configure API Settings', 'geo-platform'); ?>
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    <?php else: ?>
        <!-- Websites Grid -->
        <div class="websites-grid">
            <?php foreach ($websites as $website): ?>
                <div class="website-card">
                    <div class="website-header">
                        <h3 class="website-domain"><?php echo esc_html($website['domain']); ?></h3>
                        <?php if (!empty($website['name']) && $website['name'] !== $website['domain']): ?>
                            <p class="website-name"><?php echo esc_html($website['name']); ?></p>
                        <?php endif; ?>
                    </div>
                    
                    <div class="website-body">
                        <div class="website-status-row">
                            <span class="website-status status-<?php echo esc_attr($website['status']); ?>">
                                <?php echo esc_html(ucfirst($website['status'])); ?>
                            </span>
                            
                            <span class="sync-status status-<?php echo esc_attr($website['sync_status']); ?>">
                                <?php echo esc_html(ucfirst($website['sync_status'])); ?>
                            </span>
                        </div>
                        
                        <div class="website-meta">
                            <?php if ($website['last_sync']): ?>
                                <div class="meta-item">
                                    <strong><?php esc_html_e('Last Sync:', 'geo-platform'); ?></strong>
                                    <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($website['last_sync']))); ?>
                                </div>
                            <?php endif; ?>
                            
                            <div class="meta-item">
                                <strong><?php esc_html_e('Added:', 'geo-platform'); ?></strong>
                                <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($website['created_at']))); ?>
                            </div>
                            
                            <?php 
                            $settings = json_decode($website['settings'], true);
                            if (!empty($settings)):
                            ?>
                                <div class="meta-item">
                                    <strong><?php esc_html_e('Keywords:', 'geo-platform'); ?></strong>
                                    <?php echo isset($settings['keywords_count']) ? esc_html($settings['keywords_count']) : '0'; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                        
                        <div class="website-actions">
                            <?php if ($can_sync): ?>
                                <button type="button" class="button button-secondary sync-single-website" 
                                        data-website-id="<?php echo esc_attr($website['website_id']); ?>">
                                    <span class="dashicons dashicons-update"></span>
                                    <?php esc_html_e('Sync', 'geo-platform'); ?>
                                </button>
                                
                                <button type="button" class="button button-secondary analyze-website" 
                                        data-website-id="<?php echo esc_attr($website['website_id']); ?>">
                                    <span class="dashicons dashicons-chart-area"></span>
                                    <?php esc_html_e('Analyze', 'geo-platform'); ?>
                                </button>
                            <?php endif; ?>
                            
                            <a href="<?php echo admin_url('admin.php?page=geo-platform-analytics&website=' . urlencode($website['website_id'])); ?>" 
                               class="button button-secondary">
                                <span class="dashicons dashicons-chart-line"></span>
                                <?php esc_html_e('Analytics', 'geo-platform'); ?>
                            </a>
                            
                            <button type="button" class="button button-link-delete delete-website" 
                                    data-website-id="<?php echo esc_attr($website['id']); ?>"
                                    title="<?php esc_attr_e('Delete Website', 'geo-platform'); ?>">
                                <span class="dashicons dashicons-trash"></span>
                            </button>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<!-- Add Website Modal -->
<div id="add-website-modal" class="geo-platform-modal" style="display: none;">
    <div class="geo-platform-modal-content">
        <span class="geo-platform-modal-close">&times;</span>
        <h2><?php esc_html_e('Add Website', 'geo-platform'); ?></h2>
        <form id="add-website-form">
            <div class="form-field">
                <label for="website-domain"><?php esc_html_e('Website Domain', 'geo-platform'); ?> <span class="required">*</span></label>
                <input type="url" id="website-domain" name="domain" placeholder="https://example.com" required>
                <p class="description"><?php esc_html_e('Enter the full URL of the website including http:// or https://', 'geo-platform'); ?></p>
            </div>
            
            <div class="form-field">
                <label for="website-name"><?php esc_html_e('Website Name', 'geo-platform'); ?></label>
                <input type="text" id="website-name" name="name" placeholder="My Website">
                <p class="description"><?php esc_html_e('Optional: A friendly name for this website', 'geo-platform'); ?></p>
            </div>
            
            <div class="form-actions">
                <button type="button" class="button button-secondary" id="cancel-add-website">
                    <?php esc_html_e('Cancel', 'geo-platform'); ?>
                </button>
                <button type="submit" class="button button-primary">
                    <?php esc_html_e('Add Website', 'geo-platform'); ?>
                </button>
            </div>
        </form>
    </div>
</div>

<style>
.websites-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.websites-actions {
    display: flex;
    gap: 10px;
}

.websites-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    text-align: center;
}

.summary-stat .stat-number {
    font-size: 32px;
    font-weight: 700;
    color: #2271b1;
    line-height: 1;
}

.summary-stat .stat-label {
    font-size: 14px;
    color: #646970;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 5px;
}

.website-status-row {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.website-status, .sync-status {
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-active {
    background: #d1e7dd;
    color: #0f5132;
}

.status-inactive {
    background: #f8d7da;
    color: #842029;
}

.status-synced {
    background: #cce5ff;
    color: #004085;
}

.status-pending {
    background: #fff3cd;
    color: #856404;
}

.status-error {
    background: #f8d7da;
    color: #842029;
}

.website-meta {
    margin: 15px 0;
    font-size: 13px;
}

.meta-item {
    margin-bottom: 5px;
}

.website-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.website-actions .button {
    font-size: 12px;
    padding: 4px 8px;
    height: auto;
    line-height: 1.4;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
}

.empty-state-icon .dashicons {
    font-size: 64px;
    width: 64px;
    height: 64px;
    color: #c3c4c7;
    margin-bottom: 20px;
}

.empty-state h3 {
    margin-bottom: 10px;
    color: #1d2327;
}

.empty-state p {
    color: #646970;
    margin-bottom: 20px;
}

.empty-state-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.form-field {
    margin-bottom: 20px;
}

.form-field label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
}

.form-field input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #c3c4c7;
    border-radius: 3px;
    font-size: 14px;
}

.form-field .description {
    margin-top: 5px;
    font-size: 13px;
    color: #646970;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
}

@media (max-width: 782px) {
    .websites-header {
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
    }
    
    .websites-actions {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .websites-summary {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .website-actions {
        justify-content: center;
    }
    
    .empty-state-actions {
        flex-direction: column;
        align-items: center;
    }
}
</style>

<script type="text/javascript">
jQuery(document).ready(function($) {
    
    // Add website modal
    $('#add-website').on('click', function() {
        $('#add-website-modal').show();
    });
    
    $('#cancel-add-website, .geo-platform-modal-close').on('click', function() {
        $('#add-website-modal').hide();
    });
    
    // Add website form submission
    $('#add-website-form').on('submit', function(e) {
        e.preventDefault();
        
        var $form = $(this);
        var $submitBtn = $form.find('button[type="submit"]');
        var originalText = $submitBtn.html();
        
        $submitBtn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Adding...');
        
        $.ajax({
            url: geo_platform_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'geo_platform_add_website',
                nonce: geo_platform_admin.nonce,
                domain: $('#website-domain').val(),
                name: $('#website-name').val()
            },
            success: function(response) {
                if (response.success) {
                    $('#add-website-modal').hide();
                    location.reload(); // Refresh page to show new website
                } else {
                    alert('Failed to add website: ' + (response.data ? response.data.message : 'Unknown error'));
                }
            },
            error: function() {
                alert('Network error occurred while adding website');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Delete website
    $('.delete-website').on('click', function() {
        if (!confirm('Are you sure you want to delete this website? This will remove all associated data.')) {
            return;
        }
        
        var $button = $(this);
        var websiteId = $button.data('website-id');
        var $card = $button.closest('.website-card');
        
        $.ajax({
            url: geo_platform_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'geo_platform_delete_website',
                nonce: geo_platform_admin.nonce,
                website_id: websiteId
            },
            success: function(response) {
                if (response.success) {
                    $card.fadeOut(300, function() {
                        $(this).remove();
                        // Check if no websites left
                        if ($('.website-card').length === 0) {
                            location.reload();
                        }
                    });
                } else {
                    alert('Failed to delete website: ' + (response.data ? response.data.message : 'Unknown error'));
                }
            },
            error: function() {
                alert('Network error occurred while deleting website');
            }
        });
    });
    
});
</script>
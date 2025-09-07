<?php
/**
 * Post Integration for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * GEO Platform Post Integration Class
 */
class GEO_Platform_Post_Integration {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post', array($this, 'save_meta_boxes'));
        add_action('publish_post', array($this, 'analyze_new_post'));
        add_action('publish_page', array($this, 'analyze_new_post'));
        add_filter('manage_posts_columns', array($this, 'add_seo_score_column'));
        add_filter('manage_pages_columns', array($this, 'add_seo_score_column'));
        add_action('manage_posts_custom_column', array($this, 'display_seo_score_column'), 10, 2);
        add_action('manage_pages_custom_column', array($this, 'display_seo_score_column'), 10, 2);
        add_action('admin_enqueue_scripts', array($this, 'enqueue_post_scripts'));
    }
    
    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        $post_types = array('post', 'page');
        
        foreach ($post_types as $post_type) {
            add_meta_box(
                'geo_platform_seo_analysis',
                __('GEO Platform SEO Analysis', 'geo-platform'),
                array($this, 'seo_analysis_meta_box'),
                $post_type,
                'side',
                'default'
            );
        }
    }
    
    /**
     * SEO Analysis meta box
     */
    public function seo_analysis_meta_box($post) {
        wp_nonce_field('geo_platform_post_meta', 'geo_platform_post_meta_nonce');
        
        // Get stored analysis data
        $seo_score = get_post_meta($post->ID, '_geo_platform_seo_score', true);
        $analysis_data = get_post_meta($post->ID, '_geo_platform_analysis_data', true);
        $last_analyzed = get_post_meta($post->ID, '_geo_platform_last_analyzed', true);
        
        $api_key = get_option('geo_platform_api_key', '');
        $can_analyze = !empty($api_key);
        
        ?>
        <div id="geo-platform-seo-analysis">
            <?php if (!$can_analyze): ?>
                <div class="geo-platform-notice">
                    <p><?php esc_html_e('Configure API settings to enable SEO analysis.', 'geo-platform'); ?></p>
                    <a href="<?php echo admin_url('admin.php?page=geo-platform-settings'); ?>" class="button button-secondary button-small">
                        <?php esc_html_e('Settings', 'geo-platform'); ?>
                    </a>
                </div>
            <?php else: ?>
                
                <?php if ($seo_score): ?>
                    <div class="seo-score-display">
                        <div class="score-circle score-<?php echo $seo_score >= 80 ? 'excellent' : ($seo_score >= 60 ? 'good' : ($seo_score >= 40 ? 'fair' : 'poor')); ?>">
                            <span class="score-number"><?php echo esc_html($seo_score); ?></span>
                            <span class="score-label"><?php esc_html_e('SEO Score', 'geo-platform'); ?></span>
                        </div>
                        
                        <?php if ($last_analyzed): ?>
                            <p class="last-analyzed">
                                <?php esc_html_e('Last analyzed:', 'geo-platform'); ?> 
                                <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($last_analyzed))); ?>
                            </p>
                        <?php endif; ?>
                    </div>
                    
                    <?php if ($analysis_data): ?>
                        <div class="seo-recommendations">
                            <h4><?php esc_html_e('Key Recommendations', 'geo-platform'); ?></h4>
                            <?php
                            $data = json_decode($analysis_data, true);
                            if (isset($data['recommendations']) && is_array($data['recommendations'])):
                            ?>
                                <ul class="recommendations-list">
                                    <?php foreach (array_slice($data['recommendations'], 0, 3) as $recommendation): ?>
                                        <li><?php echo esc_html($recommendation); ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <div class="no-analysis">
                        <p><?php esc_html_e('No SEO analysis available for this post.', 'geo-platform'); ?></p>
                    </div>
                <?php endif; ?>
                
                <div class="analysis-actions">
                    <button type="button" id="analyze-post" class="button button-primary button-small" data-post-id="<?php echo esc_attr($post->ID); ?>">
                        <?php esc_html_e('Analyze SEO', 'geo-platform'); ?>
                    </button>
                    
                    <?php if ($seo_score): ?>
                        <button type="button" id="view-full-analysis" class="button button-secondary button-small">
                            <?php esc_html_e('Full Report', 'geo-platform'); ?>
                        </button>
                    <?php endif; ?>
                </div>
                
                <div id="analysis-status" style="margin-top: 10px;"></div>
            <?php endif; ?>
        </div>
        
        <style>
        #geo-platform-seo-analysis .score-circle {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 10px auto;
            text-align: center;
        }
        
        #geo-platform-seo-analysis .score-circle.score-excellent {
            background: linear-gradient(135deg, #00a32a, #4caf50);
            color: white;
        }
        
        #geo-platform-seo-analysis .score-circle.score-good {
            background: linear-gradient(135deg, #00a32a, #8bc34a);
            color: white;
        }
        
        #geo-platform-seo-analysis .score-circle.score-fair {
            background: linear-gradient(135deg, #dba617, #ff9800);
            color: white;
        }
        
        #geo-platform-seo-analysis .score-circle.score-poor {
            background: linear-gradient(135deg, #d63638, #f44336);
            color: white;
        }
        
        #geo-platform-seo-analysis .score-number {
            font-size: 24px;
            font-weight: 700;
            line-height: 1;
        }
        
        #geo-platform-seo-analysis .score-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }
        
        #geo-platform-seo-analysis .last-analyzed {
            font-size: 12px;
            color: #646970;
            text-align: center;
            margin: 10px 0;
        }
        
        #geo-platform-seo-analysis .seo-recommendations {
            margin: 15px 0;
        }
        
        #geo-platform-seo-analysis .seo-recommendations h4 {
            margin: 0 0 8px 0;
            font-size: 13px;
        }
        
        #geo-platform-seo-analysis .recommendations-list {
            margin: 0;
            padding-left: 15px;
        }
        
        #geo-platform-seo-analysis .recommendations-list li {
            font-size: 12px;
            margin-bottom: 5px;
            color: #646970;
        }
        
        #geo-platform-seo-analysis .analysis-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        #geo-platform-seo-analysis .no-analysis {
            text-align: center;
            padding: 20px 10px;
            color: #646970;
        }
        
        #geo-platform-seo-analysis .geo-platform-notice {
            text-align: center;
            padding: 15px 10px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 3px;
        }
        
        #geo-platform-seo-analysis .geo-platform-notice p {
            margin: 0 0 10px 0;
            font-size: 13px;
        }
        </style>
        <?php
    }
    
    /**
     * Save meta boxes
     */
    public function save_meta_boxes($post_id) {
        // Verify nonce
        if (!isset($_POST['geo_platform_post_meta_nonce']) || 
            !wp_verify_nonce($_POST['geo_platform_post_meta_nonce'], 'geo_platform_post_meta')) {
            return;
        }
        
        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        // Auto-analyze if enabled and this is a new publish
        if (get_option('geo_platform_auto_sync', true) && 
            isset($_POST['original_post_status']) && 
            $_POST['original_post_status'] !== 'publish' && 
            get_post_status($post_id) === 'publish') {
            
            $this->analyze_post($post_id);
        }
    }
    
    /**
     * Analyze new post
     */
    public function analyze_new_post($post_id) {
        if (get_option('geo_platform_auto_sync', true)) {
            $this->analyze_post($post_id);
        }
    }
    
    /**
     * Analyze post content
     */
    private function analyze_post($post_id) {
        $post = get_post($post_id);
        if (!$post) return false;
        
        $api_client = new GEO_Platform_API_Client();
        $url = get_permalink($post_id);
        $content = $post->post_content;
        
        $result = $api_client->analyze_content($url, $content);
        
        if ($result['success'] && isset($result['data']['seo_score'])) {
            update_post_meta($post_id, '_geo_platform_seo_score', intval($result['data']['seo_score']));
            update_post_meta($post_id, '_geo_platform_analysis_data', json_encode($result['data']));
            update_post_meta($post_id, '_geo_platform_last_analyzed', current_time('mysql'));
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Add SEO score column to post list
     */
    public function add_seo_score_column($columns) {
        $columns['geo_platform_seo_score'] = __('SEO Score', 'geo-platform');
        return $columns;
    }
    
    /**
     * Display SEO score column content
     */
    public function display_seo_score_column($column, $post_id) {
        if ($column === 'geo_platform_seo_score') {
            $seo_score = get_post_meta($post_id, '_geo_platform_seo_score', true);
            
            if ($seo_score) {
                $score_class = $seo_score >= 80 ? 'excellent' : ($seo_score >= 60 ? 'good' : ($seo_score >= 40 ? 'fair' : 'poor'));
                echo '<span class="seo-score-badge score-' . esc_attr($score_class) . '">' . esc_html($seo_score) . '</span>';
            } else {
                echo '<span class="seo-score-badge score-none">—</span>';
            }
        }
    }
    
    /**
     * Enqueue post editor scripts
     */
    public function enqueue_post_scripts($hook) {
        global $post;
        
        if (!in_array($hook, array('post.php', 'post-new.php', 'edit.php'))) {
            return;
        }
        
        // Add column styles
        if ($hook === 'edit.php') {
            wp_add_inline_style('wp-admin', '
                .seo-score-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    color: white;
                    min-width: 25px;
                    text-align: center;
                }
                .score-excellent { background: #00a32a; }
                .score-good { background: #4caf50; }
                .score-fair { background: #ff9800; }
                .score-poor { background: #d63638; }
                .score-none { background: #646970; color: #fff; }
            ');
        }
        
        // Add meta box scripts
        if (in_array($hook, array('post.php', 'post-new.php')) && $post) {
            wp_add_inline_script('jquery', '
                jQuery(document).ready(function($) {
                    $("#analyze-post").on("click", function() {
                        var $button = $(this);
                        var postId = $button.data("post-id");
                        var $status = $("#analysis-status");
                        var originalText = $button.text();
                        
                        $button.prop("disabled", true).text("Analyzing...");
                        $status.html("<div class=\\"spinner is-active\\" style=\\"float: none; margin: 0;\\"></div>");
                        
                        $.ajax({
                            url: ajaxurl,
                            type: "POST",
                            data: {
                                action: "geo_platform_analyze_post",
                                post_id: postId,
                                nonce: "' . wp_create_nonce('geo_platform_analyze_post') . '"
                            },
                            success: function(response) {
                                if (response.success) {
                                    $status.html("<div style=\\"color: #00a32a;\\">Analysis complete! Refreshing...</div>");
                                    setTimeout(function() {
                                        location.reload();
                                    }, 1500);
                                } else {
                                    $status.html("<div style=\\"color: #d63638;\\">Analysis failed: " + (response.data ? response.data.message : "Unknown error") + "</div>");
                                }
                            },
                            error: function() {
                                $status.html("<div style=\\"color: #d63638;\\">Network error occurred</div>");
                            },
                            complete: function() {
                                $button.prop("disabled", false).text(originalText);
                                setTimeout(function() {
                                    $status.empty();
                                }, 5000);
                            }
                        });
                    });
                    
                    $("#view-full-analysis").on("click", function() {
                        // Open full analysis in modal or new window
                        var postId = $("#analyze-post").data("post-id");
                        window.open("' . admin_url('admin.php?page=geo-platform-analytics&post=') . '" + postId, "_blank");
                    });
                });
            ');
        }
    }
}

// Add AJAX handler for post analysis
add_action('wp_ajax_geo_platform_analyze_post', function() {
    check_ajax_referer('geo_platform_analyze_post', 'nonce');
    
    if (!current_user_can('edit_posts')) {
        wp_die(__('Insufficient permissions', 'geo-platform'));
    }
    
    $post_id = intval($_POST['post_id']);
    $post = get_post($post_id);
    
    if (!$post) {
        wp_send_json_error(array('message' => __('Post not found', 'geo-platform')));
    }
    
    $api_client = new GEO_Platform_API_Client();
    $url = get_permalink($post_id);
    $content = $post->post_content;
    
    $result = $api_client->analyze_content($url, $content);
    
    if ($result['success'] && isset($result['data']['seo_score'])) {
        update_post_meta($post_id, '_geo_platform_seo_score', intval($result['data']['seo_score']));
        update_post_meta($post_id, '_geo_platform_analysis_data', json_encode($result['data']));
        update_post_meta($post_id, '_geo_platform_last_analyzed', current_time('mysql'));
        
        wp_send_json_success(array(
            'message' => __('Analysis completed successfully', 'geo-platform'),
            'seo_score' => $result['data']['seo_score']
        ));
    } else {
        wp_send_json_error(array('message' => $result['message'] ?? __('Analysis failed', 'geo-platform')));
    }
});
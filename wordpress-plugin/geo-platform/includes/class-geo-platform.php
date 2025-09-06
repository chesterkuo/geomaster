<?php
/**
 * Main GEO Platform Plugin Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform {
    
    /**
     * Plugin instance
     */
    private static $instance = null;
    
    /**
     * API handler
     */
    public $api;
    
    /**
     * Admin handler
     */
    public $admin;
    
    /**
     * Scanner handler
     */
    public $scanner;
    
    /**
     * Optimizer handler
     */
    public $optimizer;
    
    /**
     * Tracker handler
     */
    public $tracker;
    
    /**
     * Get singleton instance
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
        $this->init_components();
        $this->init_hooks();
    }
    
    /**
     * Initialize plugin components
     */
    private function init_components() {
        $this->api = new GEO_Platform_API();
        $this->scanner = new GEO_Platform_Scanner();
        $this->optimizer = new GEO_Platform_Optimizer();
        $this->tracker = new GEO_Platform_Tracker();
        
        if (is_admin()) {
            $this->admin = new GEO_Platform_Admin();
        }
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Add custom rewrite rules
        add_action('init', array($this, 'add_rewrite_rules'));
        
        // Add structured data to head
        add_action('wp_head', array($this, 'add_structured_data'));
        
        // Modify content for AI optimization
        add_filter('the_content', array($this, 'optimize_content_output'), 99);
        
        // Add robots.txt modifications
        add_filter('robots_txt', array($this, 'modify_robots_txt'), 10, 2);
        
        // Track search engine bot visits
        add_action('init', array($this, 'track_bot_visits'));
        
        // Auto-optimize new posts
        add_action('save_post', array($this, 'auto_optimize_post'), 10, 3);
        
        // Add REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    /**
     * Initialize the plugin
     */
    public function init() {
        // Check if API credentials are configured
        $settings = get_option('geo_platform_settings');
        if (empty($settings['api_key']) && is_admin()) {
            add_action('admin_notices', array($this, 'show_setup_notice'));
        }
        
        // Initialize shortcodes
        new GEO_Platform_Shortcodes();
        
        // Initialize widgets
        add_action('widgets_init', function() {
            register_widget('GEO_Platform_Widget');
        });
    }
    
    /**
     * Add custom rewrite rules for SEO-friendly URLs
     */
    public function add_rewrite_rules() {
        add_rewrite_rule(
            '^geo-sitemap\.xml$',
            'index.php?geo_sitemap=1',
            'top'
        );
        
        add_rewrite_rule(
            '^geo-robots\.txt$',
            'index.php?geo_robots=1',
            'top'
        );
    }
    
    /**
     * Add structured data to improve AI understanding
     */
    public function add_structured_data() {
        if (is_single() || is_page()) {
            global $post;
            
            $schema = array(
                '@context' => 'https://schema.org',
                '@type' => 'Article',
                'headline' => get_the_title(),
                'description' => get_the_excerpt(),
                'author' => array(
                    '@type' => 'Person',
                    'name' => get_the_author()
                ),
                'datePublished' => get_the_date('c'),
                'dateModified' => get_the_modified_date('c'),
                'publisher' => array(
                    '@type' => 'Organization',
                    'name' => get_bloginfo('name'),
                    'logo' => array(
                        '@type' => 'ImageObject',
                        'url' => get_site_icon_url()
                    )
                )
            );
            
            // Add FAQ schema if FAQ blocks are detected
            $faq_items = $this->extract_faq_items($post->post_content);
            if (!empty($faq_items)) {
                $schema['@type'] = array('Article', 'FAQPage');
                $schema['mainEntity'] = $faq_items;
            }
            
            echo '<script type="application/ld+json">' . json_encode($schema) . '</script>' . "\n";
        }
        
        // Add Organization schema on homepage
        if (is_front_page()) {
            $org_schema = array(
                '@context' => 'https://schema.org',
                '@type' => 'Organization',
                'name' => get_bloginfo('name'),
                'url' => home_url(),
                'description' => get_bloginfo('description'),
                'logo' => get_site_icon_url()
            );
            
            echo '<script type="application/ld+json">' . json_encode($org_schema) . '</script>' . "\n";
        }
    }
    
    /**
     * Optimize content output for AI readability
     */
    public function optimize_content_output($content) {
        $settings = get_option('geo_platform_settings');
        
        if (!$settings['auto_optimize']) {
            return $content;
        }
        
        // Add semantic HTML5 tags
        $content = $this->add_semantic_markup($content);
        
        // Ensure proper heading hierarchy
        $content = $this->fix_heading_hierarchy($content);
        
        // Add AI-friendly metadata
        $content = $this->add_ai_metadata($content);
        
        return $content;
    }
    
    /**
     * Modify robots.txt for AI crawlers
     */
    public function modify_robots_txt($output, $public) {
        if ('1' == $public) {
            $output .= "\n# AI Search Engine Crawlers\n";
            $output .= "User-agent: GPTBot\n";
            $output .= "Allow: /\n\n";
            
            $output .= "User-agent: ChatGPT-User\n";
            $output .= "Allow: /\n\n";
            
            $output .= "User-agent: CCBot\n";
            $output .= "Allow: /\n\n";
            
            $output .= "User-agent: PerplexityBot\n";
            $output .= "Allow: /\n\n";
            
            $output .= "User-agent: Claude-Web\n";
            $output .= "Allow: /\n\n";
            
            // Add sitemap reference
            $output .= "Sitemap: " . home_url('/geo-sitemap.xml') . "\n";
        }
        
        return $output;
    }
    
    /**
     * Track AI bot visits
     */
    public function track_bot_visits() {
        if (!isset($_SERVER['HTTP_USER_AGENT'])) {
            return;
        }
        
        $user_agent = $_SERVER['HTTP_USER_AGENT'];
        $ai_bots = array(
            'GPTBot' => 'chatgpt',
            'ChatGPT-User' => 'chatgpt',
            'CCBot' => 'perplexity',
            'PerplexityBot' => 'perplexity',
            'Claude-Web' => 'claude',
            'Google-Extended' => 'gemini'
        );
        
        foreach ($ai_bots as $bot => $platform) {
            if (stripos($user_agent, $bot) !== false) {
                $this->tracker->log_bot_visit($platform, $_SERVER['REQUEST_URI']);
                break;
            }
        }
    }
    
    /**
     * Auto-optimize post on save
     */
    public function auto_optimize_post($post_id, $post, $update) {
        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (wp_is_post_revision($post_id)) {
            return;
        }
        
        $settings = get_option('geo_platform_settings');
        if (!$settings['auto_optimize']) {
            return;
        }
        
        // Only optimize published posts/pages
        if ($post->post_status !== 'publish') {
            return;
        }
        
        // Run optimization in background
        wp_schedule_single_event(time() + 10, 'geo_platform_optimize_post', array($post_id));
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('geo-platform/v1', '/scan', array(
            'methods' => 'POST',
            'callback' => array($this->scanner, 'rest_scan_site'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('geo-platform/v1', '/optimize/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback' => array($this->optimizer, 'rest_optimize_post'),
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
        
        register_rest_route('geo-platform/v1', '/tracking', array(
            'methods' => 'GET',
            'callback' => array($this->tracker, 'rest_get_tracking_data'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
    }
    
    /**
     * Show setup notice
     */
    public function show_setup_notice() {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p>
                <strong><?php _e('GEO Platform:', 'geo-platform'); ?></strong>
                <?php 
                printf(
                    __('Please <a href="%s">configure your API credentials</a> to start optimizing for AI search engines.', 'geo-platform'),
                    admin_url('admin.php?page=geo-platform-settings')
                );
                ?>
            </p>
        </div>
        <?php
    }
    
    /**
     * Extract FAQ items from content
     */
    private function extract_faq_items($content) {
        $faq_items = array();
        
        // Look for FAQ patterns (Q: A: format or heading + paragraph)
        if (preg_match_all('/<h[2-4][^>]*>(?:Q:|Question:)?\s*([^<]+)<\/h[2-4]>\s*<p>(?:A:|Answer:)?\s*([^<]+)<\/p>/i', $content, $matches)) {
            foreach ($matches[1] as $i => $question) {
                $faq_items[] = array(
                    '@type' => 'Question',
                    'name' => strip_tags($question),
                    'acceptedAnswer' => array(
                        '@type' => 'Answer',
                        'text' => strip_tags($matches[2][$i])
                    )
                );
            }
        }
        
        return $faq_items;
    }
    
    /**
     * Add semantic HTML5 markup
     */
    private function add_semantic_markup($content) {
        // Wrap content sections in article tags
        if (!strpos($content, '<article')) {
            $content = '<article class="geo-optimized-content">' . $content . '</article>';
        }
        
        // Add section tags for major content blocks
        $content = preg_replace('/<h2([^>]*)>/i', '</section><section><h2$1>', $content);
        $content = '<section>' . $content . '</section>';
        $content = str_replace('<section></section>', '', $content);
        
        return $content;
    }
    
    /**
     * Fix heading hierarchy
     */
    private function fix_heading_hierarchy($content) {
        // Ensure H1 is not used in content (should be page title)
        $content = preg_replace('/<h1([^>]*)>(.*?)<\/h1>/i', '<h2$1>$2</h2>', $content);
        
        return $content;
    }
    
    /**
     * Add AI-friendly metadata
     */
    private function add_ai_metadata($content) {
        global $post;
        
        $metadata = sprintf(
            '<div class="geo-ai-metadata" style="display:none;" data-geo-optimized="true" data-post-id="%d" data-last-updated="%s"></div>',
            $post->ID,
            get_the_modified_date('c')
        );
        
        return $content . $metadata;
    }
}
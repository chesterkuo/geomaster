<?php
/**
 * GEO Platform Optimizer Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform_Optimizer {
    
    /**
     * API handler
     */
    private $api;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->api = new GEO_Platform_API();
    }
    
    /**
     * Optimize post
     */
    public function optimize_post($post_id, $optimization_type = 'auto') {
        $post = get_post($post_id);
        
        if (!$post) {
            return array(
                'success' => false,
                'message' => __('Invalid post ID', 'geo-platform')
            );
        }
        
        $url = get_permalink($post_id);
        
        // Get optimization suggestions
        $suggestions = $this->api->get_optimization_suggestions($url);
        
        if (!$suggestions) {
            return array(
                'success' => false,
                'message' => __('Failed to get optimization suggestions', 'geo-platform')
            );
        }
        
        // Apply optimizations based on type
        $optimizations = array();
        
        if ($optimization_type === 'auto' || $optimization_type === 'all') {
            // Auto-apply safe optimizations
            $optimizations = $this->apply_auto_optimizations($post_id, $suggestions);
        } else {
            // Apply specific optimization
            $optimizations = $this->apply_specific_optimization($post_id, $optimization_type, $suggestions);
        }
        
        // Store optimization history
        $this->store_optimization_history($post_id, $optimizations);
        
        return array(
            'success' => true,
            'data' => array(
                'optimizations' => $optimizations,
                'newScore' => isset($suggestions['geoScore']) ? $suggestions['geoScore'] : 0
            )
        );
    }
    
    /**
     * Apply auto optimizations
     */
    private function apply_auto_optimizations($post_id, $suggestions) {
        $applied = array();
        
        // Optimize meta title
        if (isset($suggestions['recommendations']['title'])) {
            $this->optimize_meta_title($post_id, $suggestions['recommendations']['title']);
            $applied[] = 'meta_title';
        }
        
        // Optimize meta description
        if (isset($suggestions['recommendations']['description'])) {
            $this->optimize_meta_description($post_id, $suggestions['recommendations']['description']);
            $applied[] = 'meta_description';
        }
        
        // Add structured data
        if (isset($suggestions['recommendations']['structuredData'])) {
            $this->add_structured_data($post_id, $suggestions['recommendations']['structuredData']);
            $applied[] = 'structured_data';
        }
        
        // Optimize content structure
        if (isset($suggestions['recommendations']['content'])) {
            $this->optimize_content_structure($post_id, $suggestions['recommendations']['content']);
            $applied[] = 'content_structure';
        }
        
        return $applied;
    }
    
    /**
     * Apply specific optimization
     */
    private function apply_specific_optimization($post_id, $type, $suggestions) {
        $applied = array();
        
        switch ($type) {
            case 'meta_title':
                if (isset($suggestions['recommendations']['title'])) {
                    $this->optimize_meta_title($post_id, $suggestions['recommendations']['title']);
                    $applied[] = 'meta_title';
                }
                break;
                
            case 'meta_description':
                if (isset($suggestions['recommendations']['description'])) {
                    $this->optimize_meta_description($post_id, $suggestions['recommendations']['description']);
                    $applied[] = 'meta_description';
                }
                break;
                
            case 'structured_data':
                if (isset($suggestions['recommendations']['structuredData'])) {
                    $this->add_structured_data($post_id, $suggestions['recommendations']['structuredData']);
                    $applied[] = 'structured_data';
                }
                break;
                
            case 'content':
                if (isset($suggestions['recommendations']['content'])) {
                    $this->optimize_content_structure($post_id, $suggestions['recommendations']['content']);
                    $applied[] = 'content_structure';
                }
                break;
                
            case 'faq':
                $this->add_faq_section($post_id);
                $applied[] = 'faq_section';
                break;
        }
        
        return $applied;
    }
    
    /**
     * Optimize meta title
     */
    private function optimize_meta_title($post_id, $recommendation) {
        // Check if SEO plugin is active
        if (defined('WPSEO_VERSION')) {
            // Yoast SEO
            update_post_meta($post_id, '_yoast_wpseo_title', $recommendation);
        } elseif (defined('AIOSEO_VERSION')) {
            // All in One SEO
            $aioseo_meta = get_post_meta($post_id, '_aioseo_title', true);
            update_post_meta($post_id, '_aioseo_title', $recommendation);
        } else {
            // Store in custom meta
            update_post_meta($post_id, '_geo_platform_seo_title', $recommendation);
            
            // Hook to modify title tag
            add_filter('pre_get_document_title', function($title) use ($post_id, $recommendation) {
                if (is_single($post_id) || is_page($post_id)) {
                    return $recommendation;
                }
                return $title;
            });
        }
    }
    
    /**
     * Optimize meta description
     */
    private function optimize_meta_description($post_id, $recommendation) {
        // Check if SEO plugin is active
        if (defined('WPSEO_VERSION')) {
            // Yoast SEO
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $recommendation);
        } elseif (defined('AIOSEO_VERSION')) {
            // All in One SEO
            update_post_meta($post_id, '_aioseo_description', $recommendation);
        } else {
            // Store in custom meta
            update_post_meta($post_id, '_geo_platform_seo_description', $recommendation);
            
            // Hook to add meta description
            add_action('wp_head', function() use ($post_id, $recommendation) {
                if (is_single($post_id) || is_page($post_id)) {
                    echo '<meta name="description" content="' . esc_attr($recommendation) . '">' . "\n";
                }
            });
        }
    }
    
    /**
     * Add structured data
     */
    private function add_structured_data($post_id, $structured_data) {
        update_post_meta($post_id, '_geo_platform_structured_data', json_encode($structured_data));
        
        // Hook to output structured data
        add_action('wp_head', function() use ($post_id, $structured_data) {
            if (is_single($post_id) || is_page($post_id)) {
                echo '<script type="application/ld+json">' . json_encode($structured_data) . '</script>' . "\n";
            }
        });
    }
    
    /**
     * Optimize content structure
     */
    private function optimize_content_structure($post_id, $recommendations) {
        $post = get_post($post_id);
        $content = $post->post_content;
        $updated = false;
        
        // Add FAQ section if recommended
        if (isset($recommendations['addFAQ']) && $recommendations['addFAQ']) {
            $content = $this->add_faq_to_content($content, $post->post_title);
            $updated = true;
        }
        
        // Fix heading hierarchy
        if (isset($recommendations['fixHeadings']) && $recommendations['fixHeadings']) {
            $content = $this->fix_heading_hierarchy_in_content($content);
            $updated = true;
        }
        
        // Add semantic markup
        if (isset($recommendations['addSemanticMarkup']) && $recommendations['addSemanticMarkup']) {
            $content = $this->add_semantic_markup_to_content($content);
            $updated = true;
        }
        
        if ($updated) {
            wp_update_post(array(
                'ID' => $post_id,
                'post_content' => $content
            ));
        }
    }
    
    /**
     * Add FAQ section to content
     */
    private function add_faq_to_content($content, $title) {
        // Generate FAQ based on content
        $faq_html = "\n\n" . '<h2>' . __('Frequently Asked Questions', 'geo-platform') . '</h2>' . "\n";
        
        // Generate sample FAQs based on title
        $faqs = array(
            sprintf(__('What is %s?', 'geo-platform'), $title),
            sprintf(__('How does %s work?', 'geo-platform'), $title),
            sprintf(__('What are the benefits of %s?', 'geo-platform'), $title)
        );
        
        foreach ($faqs as $question) {
            $faq_html .= '<h3>' . $question . '</h3>' . "\n";
            $faq_html .= '<p>' . __('This is a placeholder answer that should be customized.', 'geo-platform') . '</p>' . "\n";
        }
        
        return $content . $faq_html;
    }
    
    /**
     * Fix heading hierarchy in content
     */
    private function fix_heading_hierarchy_in_content($content) {
        // Replace H1 tags with H2 (H1 should be page title)
        $content = preg_replace('/<h1([^>]*)>(.*?)<\/h1>/i', '<h2$1>$2</h2>', $content);
        
        // Ensure proper nesting
        $content = $this->ensure_heading_nesting($content);
        
        return $content;
    }
    
    /**
     * Add semantic markup to content
     */
    private function add_semantic_markup_to_content($content) {
        // Wrap main content in article tag if not present
        if (strpos($content, '<article') === false) {
            $content = '<article class="geo-optimized-content">' . $content . '</article>';
        }
        
        // Add section tags around major content blocks
        $content = preg_replace('/(<h2[^>]*>)/i', '</section><section>$1', $content);
        $content = '<section>' . $content . '</section>';
        $content = str_replace('<section></section>', '', $content);
        
        return $content;
    }
    
    /**
     * Add FAQ section
     */
    private function add_faq_section($post_id) {
        $post = get_post($post_id);
        $content = $post->post_content;
        
        // Check if FAQ already exists
        if (stripos($content, 'frequently asked questions') !== false || 
            stripos($content, 'faq') !== false) {
            return;
        }
        
        // Add FAQ section
        $content = $this->add_faq_to_content($content, $post->post_title);
        
        wp_update_post(array(
            'ID' => $post_id,
            'post_content' => $content
        ));
    }
    
    /**
     * Ensure heading nesting
     */
    private function ensure_heading_nesting($content) {
        // This is a simplified version - in production, use DOM parser
        $lines = explode("\n", $content);
        $current_level = 1;
        $fixed_lines = array();
        
        foreach ($lines as $line) {
            if (preg_match('/<h([1-6])[^>]*>/i', $line, $matches)) {
                $level = intval($matches[1]);
                
                // Ensure we don't skip levels
                if ($level > $current_level + 1) {
                    $line = str_replace('<h' . $level, '<h' . ($current_level + 1), $line);
                    $line = str_replace('</h' . $level, '</h' . ($current_level + 1), $line);
                    $current_level++;
                } else {
                    $current_level = $level;
                }
            }
            
            $fixed_lines[] = $line;
        }
        
        return implode("\n", $fixed_lines);
    }
    
    /**
     * Store optimization history
     */
    private function store_optimization_history($post_id, $optimizations) {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_optimizations';
        
        foreach ($optimizations as $type) {
            $wpdb->insert($table, array(
                'post_id' => $post_id,
                'optimization_type' => $type,
                'status' => 'applied',
                'applied_date' => current_time('mysql')
            ));
        }
    }
    
    /**
     * Get post GEO score
     */
    public function get_post_geo_score($post_id) {
        $score = get_post_meta($post_id, '_geo_platform_score', true);
        return $score ? intval($score) : 0;
    }
    
    /**
     * Get post suggestions
     */
    public function get_post_suggestions($post_id) {
        $suggestions = get_post_meta($post_id, '_geo_platform_suggestions', true);
        return $suggestions ? $suggestions : array();
    }
    
    /**
     * REST API handler for optimization
     */
    public function rest_optimize_post($request) {
        $post_id = $request->get_param('id');
        $type = $request->get_param('type') ?: 'auto';
        
        return $this->optimize_post($post_id, $type);
    }
}
<?php
/**
 * GEO Platform Shortcodes Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform_Shortcodes {
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->register_shortcodes();
    }
    
    /**
     * Register all shortcodes
     */
    private function register_shortcodes() {
        add_shortcode('geo_score', array($this, 'geo_score_shortcode'));
        add_shortcode('geo_ai_visibility', array($this, 'geo_ai_visibility_shortcode'));
        add_shortcode('geo_optimization_tips', array($this, 'geo_optimization_tips_shortcode'));
        add_shortcode('geo_tracking_chart', array($this, 'geo_tracking_chart_shortcode'));
        add_shortcode('geo_faq', array($this, 'geo_faq_shortcode'));
    }
    
    /**
     * GEO Score shortcode
     * Usage: [geo_score]
     */
    public function geo_score_shortcode($atts) {
        $atts = shortcode_atts(array(
            'show_label' => 'true',
            'class' => 'geo-score-inline'
        ), $atts);
        
        $settings = get_option('geo_platform_settings');
        $score = isset($settings['geo_score']) ? $settings['geo_score'] : 0;
        
        $output = '<span class="' . esc_attr($atts['class']) . '">';
        
        if ($atts['show_label'] === 'true') {
            $output .= __('GEO Score: ', 'geo-platform');
        }
        
        $output .= '<strong>' . $score . '/100</strong>';
        $output .= '</span>';
        
        return $output;
    }
    
    /**
     * AI Visibility shortcode
     * Usage: [geo_ai_visibility platform="chatgpt"]
     */
    public function geo_ai_visibility_shortcode($atts) {
        $atts = shortcode_atts(array(
            'platform' => 'all',
            'format' => 'list',
            'class' => 'geo-ai-visibility'
        ), $atts);
        
        $settings = get_option('geo_platform_settings');
        $visibility = isset($settings['ai_visibility']) ? $settings['ai_visibility'] : array();
        
        $platforms = array(
            'chatgpt' => 'ChatGPT',
            'gemini' => 'Google Gemini',
            'perplexity' => 'Perplexity',
            'claude' => 'Claude'
        );
        
        $output = '<div class="' . esc_attr($atts['class']) . '">';
        
        if ($atts['platform'] !== 'all' && isset($visibility[$atts['platform']])) {
            // Show single platform
            $output .= '<span class="geo-platform-single">';
            $output .= $platforms[$atts['platform']] . ': ';
            $output .= '<strong>' . $visibility[$atts['platform']] . '%</strong>';
            $output .= '</span>';
        } else {
            // Show all platforms
            if ($atts['format'] === 'list') {
                $output .= '<ul class="geo-platform-list">';
                foreach ($platforms as $key => $name) {
                    $value = isset($visibility[$key]) ? $visibility[$key] : 0;
                    $output .= '<li>' . $name . ': <strong>' . $value . '%</strong></li>';
                }
                $output .= '</ul>';
            } else {
                // Table format
                $output .= '<table class="geo-platform-table">';
                $output .= '<thead><tr><th>' . __('Platform', 'geo-platform') . '</th><th>' . __('Visibility', 'geo-platform') . '</th></tr></thead>';
                $output .= '<tbody>';
                foreach ($platforms as $key => $name) {
                    $value = isset($visibility[$key]) ? $visibility[$key] : 0;
                    $output .= '<tr><td>' . $name . '</td><td>' . $value . '%</td></tr>';
                }
                $output .= '</tbody></table>';
            }
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Optimization Tips shortcode
     * Usage: [geo_optimization_tips count="5"]
     */
    public function geo_optimization_tips_shortcode($atts) {
        global $post;
        
        $atts = shortcode_atts(array(
            'count' => '5',
            'post_id' => $post ? $post->ID : 0,
            'class' => 'geo-optimization-tips'
        ), $atts);
        
        if (!$atts['post_id']) {
            return '';
        }
        
        $suggestions = get_post_meta($atts['post_id'], '_geo_platform_suggestions', true);
        
        if (empty($suggestions)) {
            return '<p>' . __('No optimization suggestions available. Run a scan to get personalized tips.', 'geo-platform') . '</p>';
        }
        
        $output = '<div class="' . esc_attr($atts['class']) . '">';
        $output .= '<h3>' . __('AI Optimization Tips', 'geo-platform') . '</h3>';
        $output .= '<ul>';
        
        $count = 0;
        foreach ($suggestions as $suggestion) {
            if ($count >= intval($atts['count'])) {
                break;
            }
            $output .= '<li>' . esc_html($suggestion) . '</li>';
            $count++;
        }
        
        $output .= '</ul>';
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Tracking Chart shortcode
     * Usage: [geo_tracking_chart days="30" type="line"]
     */
    public function geo_tracking_chart_shortcode($atts) {
        $atts = shortcode_atts(array(
            'days' => '30',
            'type' => 'line',
            'height' => '300',
            'class' => 'geo-tracking-chart'
        ), $atts);
        
        $tracker = new GEO_Platform_Tracker();
        $data = $tracker->get_tracking_data(intval($atts['days']));
        
        if (empty($data['trends'])) {
            return '<p>' . __('No tracking data available yet.', 'geo-platform') . '</p>';
        }
        
        // Generate unique chart ID
        $chart_id = 'geo-chart-' . uniqid();
        
        $output = '<div class="' . esc_attr($atts['class']) . '">';
        $output .= '<canvas id="' . $chart_id . '" height="' . esc_attr($atts['height']) . '"></canvas>';
        $output .= '<script>
            document.addEventListener("DOMContentLoaded", function() {
                if (typeof Chart !== "undefined") {
                    var ctx = document.getElementById("' . $chart_id . '").getContext("2d");
                    var chartData = ' . json_encode($data['trends']) . ';
                    
                    // Process data for Chart.js
                    var labels = [];
                    var datasets = {};
                    
                    chartData.forEach(function(item) {
                        if (labels.indexOf(item.date) === -1) {
                            labels.push(item.date);
                        }
                        if (!datasets[item.platform]) {
                            datasets[item.platform] = {
                                label: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
                                data: [],
                                borderColor: getColorForPlatform(item.platform),
                                fill: false
                            };
                        }
                        datasets[item.platform].data.push({
                            x: item.date,
                            y: item.count
                        });
                    });
                    
                    var chart = new Chart(ctx, {
                        type: "' . esc_js($atts['type']) . '",
                        data: {
                            labels: labels,
                            datasets: Object.values(datasets)
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                    
                    function getColorForPlatform(platform) {
                        var colors = {
                            chatgpt: "#10a37f",
                            gemini: "#4285f4",
                            perplexity: "#1a73e8",
                            claude: "#8b5cf6"
                        };
                        return colors[platform] || "#666";
                    }
                }
            });
        </script>';
        $output .= '</div>';
        
        // Enqueue Chart.js if not already loaded
        wp_enqueue_script('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', array(), '3.9.1', true);
        
        return $output;
    }
    
    /**
     * FAQ shortcode for AI optimization
     * Usage: [geo_faq questions="3" schema="true"]
     */
    public function geo_faq_shortcode($atts) {
        global $post;
        
        $atts = shortcode_atts(array(
            'questions' => '3',
            'schema' => 'true',
            'class' => 'geo-faq',
            'title' => ''
        ), $atts);
        
        // Generate context-aware FAQ
        $post_title = $atts['title'] ?: ($post ? $post->post_title : get_bloginfo('name'));
        
        $faqs = $this->generate_faq_content($post_title, intval($atts['questions']));
        
        $output = '<div class="' . esc_attr($atts['class']) . '">';
        $output .= '<h2>' . __('Frequently Asked Questions', 'geo-platform') . '</h2>';
        
        $schema_data = array(
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array()
        );
        
        foreach ($faqs as $faq) {
            $output .= '<div class="geo-faq-item">';
            $output .= '<h3 class="geo-faq-question">' . esc_html($faq['question']) . '</h3>';
            $output .= '<div class="geo-faq-answer">' . wp_kses_post($faq['answer']) . '</div>';
            $output .= '</div>';
            
            // Add to schema
            $schema_data['mainEntity'][] = array(
                '@type' => 'Question',
                'name' => $faq['question'],
                'acceptedAnswer' => array(
                    '@type' => 'Answer',
                    'text' => strip_tags($faq['answer'])
                )
            );
        }
        
        $output .= '</div>';
        
        // Add schema markup if enabled
        if ($atts['schema'] === 'true') {
            $output .= '<script type="application/ld+json">' . json_encode($schema_data) . '</script>';
        }
        
        return $output;
    }
    
    /**
     * Generate FAQ content
     */
    private function generate_faq_content($title, $count = 3) {
        $faq_templates = array(
            array(
                'question' => sprintf(__('What is %s?', 'geo-platform'), $title),
                'answer' => sprintf(__('%s is a comprehensive solution designed to help you achieve your goals efficiently and effectively.', 'geo-platform'), $title)
            ),
            array(
                'question' => sprintf(__('How does %s work?', 'geo-platform'), $title),
                'answer' => sprintf(__('%s works by leveraging advanced technology and proven methodologies to deliver optimal results for your needs.', 'geo-platform'), $title)
            ),
            array(
                'question' => sprintf(__('What are the benefits of using %s?', 'geo-platform'), $title),
                'answer' => sprintf(__('The key benefits of %s include improved efficiency, better results, time savings, and enhanced user experience.', 'geo-platform'), $title)
            ),
            array(
                'question' => sprintf(__('Who can benefit from %s?', 'geo-platform'), $title),
                'answer' => sprintf(__('%s is designed for anyone looking to improve their online presence and optimize for AI-driven search engines.', 'geo-platform'), $title)
            ),
            array(
                'question' => sprintf(__('How do I get started with %s?', 'geo-platform'), $title),
                'answer' => sprintf(__('Getting started with %s is easy. Simply follow our step-by-step guide and you\'ll be up and running in no time.', 'geo-platform'), $title)
            )
        );
        
        return array_slice($faq_templates, 0, $count);
    }
}
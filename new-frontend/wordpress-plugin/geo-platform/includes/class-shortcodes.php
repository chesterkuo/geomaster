<?php
/**
 * Shortcodes for GEO Platform plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * GEO Platform Shortcodes Class
 */
class GEO_Platform_Shortcodes {
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->init_shortcodes();
    }
    
    /**
     * Initialize shortcodes
     */
    private function init_shortcodes() {
        add_shortcode('geo_platform_rankings', array($this, 'rankings_shortcode'));
        add_shortcode('geo_platform_analytics', array($this, 'analytics_shortcode'));
        add_shortcode('geo_platform_report', array($this, 'report_shortcode'));
        add_shortcode('geo_platform_seo_score', array($this, 'seo_score_shortcode'));
        add_shortcode('geo_platform_keywords', array($this, 'keywords_shortcode'));
    }
    
    /**
     * Rankings shortcode
     * [geo_platform_rankings website="" limit="5" type="table"]
     */
    public function rankings_shortcode($atts) {
        $atts = shortcode_atts(array(
            'website' => '',
            'limit' => '5',
            'type' => 'table',
            'period' => '30'
        ), $atts, 'geo_platform_rankings');
        
        $api_client = new GEO_Platform_API_Client();
        $rankings = $api_client->get_keyword_rankings(array(), $atts['website']);
        
        if (!$rankings['success']) {
            return '<p class="geo-platform-error">' . __('Failed to load rankings data.', 'geo-platform') . '</p>';
        }
        
        $data = array_slice($rankings['data'], 0, intval($atts['limit']));
        
        if ($atts['type'] === 'list') {
            return $this->render_rankings_list($data);
        }
        
        return $this->render_rankings_table($data);
    }
    
    /**
     * Analytics shortcode
     * [geo_platform_analytics metric="traffic" period="30" chart="true"]
     */
    public function analytics_shortcode($atts) {
        $atts = shortcode_atts(array(
            'metric' => 'traffic',
            'period' => '30',
            'chart' => 'false'
        ), $atts, 'geo_platform_analytics');
        
        $api_client = new GEO_Platform_API_Client();
        $analytics = $api_client->get_analytics($atts['period'], array($atts['metric']));
        
        if (!$analytics['success']) {
            return '<p class="geo-platform-error">' . __('Failed to load analytics data.', 'geo-platform') . '</p>';
        }
        
        $data = $analytics['data'][$atts['metric']] ?? array();
        
        return $this->render_analytics_display($data, $atts);
    }
    
    /**
     * Report shortcode
     * [geo_platform_report id="123"]
     */
    public function report_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => ''
        ), $atts, 'geo_platform_report');
        
        if (empty($atts['id'])) {
            return '<p class="geo-platform-error">' . __('Report ID is required.', 'geo-platform') . '</p>';
        }
        
        $reports = GEO_Platform_Database::get_reports(array(
            'limit' => 1,
            'report_id' => $atts['id']
        ));
        
        if (empty($reports)) {
            return '<p class="geo-platform-error">' . __('Report not found.', 'geo-platform') . '</p>';
        }
        
        $report = $reports[0];
        
        return $this->render_report_display($report);
    }
    
    /**
     * SEO Score shortcode
     * [geo_platform_seo_score url="" show_details="true"]
     */
    public function seo_score_shortcode($atts) {
        $atts = shortcode_atts(array(
            'url' => get_permalink(),
            'show_details' => 'false'
        ), $atts, 'geo_platform_seo_score');
        
        $api_client = new GEO_Platform_API_Client();
        $analysis = $api_client->analyze_content($atts['url']);
        
        if (!$analysis['success']) {
            return '<p class="geo-platform-error">' . __('Failed to analyze URL.', 'geo-platform') . '</p>';
        }
        
        $score = $analysis['data']['seo_score'] ?? 0;
        
        return $this->render_seo_score($score, $analysis['data'], $atts['show_details'] === 'true');
    }
    
    /**
     * Keywords shortcode
     * [geo_platform_keywords website="" limit="10" show_positions="true"]
     */
    public function keywords_shortcode($atts) {
        $atts = shortcode_atts(array(
            'website' => '',
            'limit' => '10',
            'show_positions' => 'true'
        ), $atts, 'geo_platform_keywords');
        
        $analytics = GEO_Platform_Database::get_analytics(array(
            'website_id' => $atts['website'],
            'metric_type' => 'keywords',
            'limit' => intval($atts['limit'])
        ));
        
        if (empty($analytics)) {
            return '<p class="geo-platform-notice">' . __('No keyword data available.', 'geo-platform') . '</p>';
        }
        
        return $this->render_keywords_list($analytics, $atts['show_positions'] === 'true');
    }
    
    /**
     * Render rankings table
     */
    private function render_rankings_table($data) {
        $output = '<div class="geo-platform-rankings-table">';
        $output .= '<table class="geo-platform-table">';
        $output .= '<thead><tr>';
        $output .= '<th>' . __('Keyword', 'geo-platform') . '</th>';
        $output .= '<th>' . __('Position', 'geo-platform') . '</th>';
        $output .= '<th>' . __('Change', 'geo-platform') . '</th>';
        $output .= '</tr></thead><tbody>';
        
        foreach ($data as $ranking) {
            $change = isset($ranking['change']) ? $ranking['change'] : 0;
            $change_class = $change > 0 ? 'positive' : ($change < 0 ? 'negative' : 'neutral');
            
            $output .= '<tr>';
            $output .= '<td>' . esc_html($ranking['keyword']) . '</td>';
            $output .= '<td>' . esc_html($ranking['position']) . '</td>';
            $output .= '<td class="change-' . $change_class . '">' . ($change > 0 ? '+' : '') . $change . '</td>';
            $output .= '</tr>';
        }
        
        $output .= '</tbody></table></div>';
        
        return $output;
    }
    
    /**
     * Render rankings list
     */
    private function render_rankings_list($data) {
        $output = '<div class="geo-platform-rankings-list">';
        $output .= '<ul class="geo-platform-list">';
        
        foreach ($data as $ranking) {
            $output .= '<li>';
            $output .= '<strong>' . esc_html($ranking['keyword']) . '</strong> - ';
            $output .= __('Position', 'geo-platform') . ' ' . esc_html($ranking['position']);
            $output .= '</li>';
        }
        
        $output .= '</ul></div>';
        
        return $output;
    }
    
    /**
     * Render analytics display
     */
    private function render_analytics_display($data, $atts) {
        $output = '<div class="geo-platform-analytics">';
        
        if (isset($data['total'])) {
            $output .= '<div class="analytics-metric">';
            $output .= '<span class="metric-label">' . ucfirst($atts['metric']) . ':</span> ';
            $output .= '<span class="metric-value">' . number_format($data['total']) . '</span>';
            $output .= '</div>';
        }
        
        if (isset($data['change']) && $data['change'] !== 0) {
            $change_class = $data['change'] > 0 ? 'positive' : 'negative';
            $output .= '<div class="analytics-change change-' . $change_class . '">';
            $output .= ($data['change'] > 0 ? '+' : '') . $data['change'] . '% ';
            $output .= __('from previous period', 'geo-platform');
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render report display
     */
    private function render_report_display($report) {
        $output = '<div class="geo-platform-report">';
        $output .= '<h3>' . esc_html($report['report_name']) . '</h3>';
        $output .= '<div class="report-meta">';
        $output .= '<span class="report-type">' . ucfirst($report['report_type']) . '</span> - ';
        $output .= '<span class="report-date">' . date_i18n(get_option('date_format'), strtotime($report['created_at'])) . '</span>';
        $output .= '</div>';
        
        if ($report['status'] === 'completed' && !empty($report['file_url'])) {
            $output .= '<div class="report-actions">';
            $output .= '<a href="' . esc_url($report['file_url']) . '" class="geo-platform-button" target="_blank">';
            $output .= __('Download Report', 'geo-platform') . '</a>';
            $output .= '</div>';
        } else {
            $output .= '<div class="report-status status-' . esc_attr($report['status']) . '">';
            $output .= ucfirst($report['status']);
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render SEO score
     */
    private function render_seo_score($score, $data, $show_details) {
        $score_class = $score >= 80 ? 'excellent' : ($score >= 60 ? 'good' : ($score >= 40 ? 'fair' : 'poor'));
        
        $output = '<div class="geo-platform-seo-score">';
        $output .= '<div class="seo-score-circle score-' . $score_class . '">';
        $output .= '<span class="score-number">' . esc_html($score) . '</span>';
        $output .= '<span class="score-label">' . __('SEO Score', 'geo-platform') . '</span>';
        $output .= '</div>';
        
        if ($show_details && isset($data['recommendations'])) {
            $output .= '<div class="seo-recommendations">';
            $output .= '<h4>' . __('Recommendations', 'geo-platform') . '</h4>';
            $output .= '<ul>';
            foreach ($data['recommendations'] as $recommendation) {
                $output .= '<li>' . esc_html($recommendation) . '</li>';
            }
            $output .= '</ul>';
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render keywords list
     */
    private function render_keywords_list($analytics, $show_positions) {
        $output = '<div class="geo-platform-keywords">';
        $output .= '<ul class="keywords-list">';
        
        foreach ($analytics as $item) {
            $keywords = json_decode($item['metric_value'], true);
            
            if (is_array($keywords)) {
                foreach ($keywords as $keyword) {
                    $output .= '<li class="keyword-item">';
                    $output .= '<span class="keyword-term">' . esc_html($keyword['term']) . '</span>';
                    
                    if ($show_positions && isset($keyword['position'])) {
                        $output .= ' - <span class="keyword-position">#' . esc_html($keyword['position']) . '</span>';
                    }
                    
                    $output .= '</li>';
                }
            }
        }
        
        $output .= '</ul></div>';
        
        return $output;
    }
}
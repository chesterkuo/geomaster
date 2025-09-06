<?php
/**
 * GEO Platform Widget Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform_Widget extends WP_Widget {
    
    /**
     * Constructor
     */
    public function __construct() {
        parent::__construct(
            'geo_platform_widget',
            __('GEO Platform Score', 'geo-platform'),
            array(
                'description' => __('Display your site\'s GEO score and AI visibility', 'geo-platform')
            )
        );
    }
    
    /**
     * Widget frontend output
     */
    public function widget($args, $instance) {
        $title = apply_filters('widget_title', $instance['title']);
        $show_score = isset($instance['show_score']) ? $instance['show_score'] : true;
        $show_platforms = isset($instance['show_platforms']) ? $instance['show_platforms'] : true;
        
        echo $args['before_widget'];
        
        if (!empty($title)) {
            echo $args['before_title'] . $title . $args['after_title'];
        }
        
        $settings = get_option('geo_platform_settings');
        
        ?>
        <div class="geo-platform-widget">
            <?php if ($show_score): ?>
            <div class="geo-widget-score">
                <h4><?php _e('GEO Score', 'geo-platform'); ?></h4>
                <div class="geo-score-display">
                    <span class="geo-score-value"><?php echo isset($settings['geo_score']) ? $settings['geo_score'] : 0; ?></span>
                    <span class="geo-score-max">/100</span>
                </div>
            </div>
            <?php endif; ?>
            
            <?php if ($show_platforms && isset($settings['ai_visibility'])): ?>
            <div class="geo-widget-platforms">
                <h4><?php _e('AI Visibility', 'geo-platform'); ?></h4>
                <ul class="geo-platform-list">
                    <?php
                    $platforms = array(
                        'chatgpt' => 'ChatGPT',
                        'gemini' => 'Google Gemini',
                        'perplexity' => 'Perplexity',
                        'claude' => 'Claude'
                    );
                    
                    foreach ($platforms as $key => $name):
                        $value = isset($settings['ai_visibility'][$key]) ? $settings['ai_visibility'][$key] : 0;
                    ?>
                    <li>
                        <span class="geo-platform-name"><?php echo $name; ?></span>
                        <span class="geo-platform-score"><?php echo $value; ?>%</span>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>
            
            <?php if (isset($settings['last_scan'])): ?>
            <div class="geo-widget-footer">
                <small><?php printf(__('Last scan: %s', 'geo-platform'), date_i18n(get_option('date_format'), strtotime($settings['last_scan']))); ?></small>
            </div>
            <?php endif; ?>
        </div>
        <?php
        
        echo $args['after_widget'];
    }
    
    /**
     * Widget backend form
     */
    public function form($instance) {
        $title = isset($instance['title']) ? $instance['title'] : __('AI Search Visibility', 'geo-platform');
        $show_score = isset($instance['show_score']) ? $instance['show_score'] : true;
        $show_platforms = isset($instance['show_platforms']) ? $instance['show_platforms'] : true;
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>"><?php _e('Title:', 'geo-platform'); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" 
                   name="<?php echo $this->get_field_name('title'); ?>" 
                   type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_score); ?> 
                   id="<?php echo $this->get_field_id('show_score'); ?>" 
                   name="<?php echo $this->get_field_name('show_score'); ?>" value="1">
            <label for="<?php echo $this->get_field_id('show_score'); ?>">
                <?php _e('Show GEO Score', 'geo-platform'); ?>
            </label>
        </p>
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_platforms); ?> 
                   id="<?php echo $this->get_field_id('show_platforms'); ?>" 
                   name="<?php echo $this->get_field_name('show_platforms'); ?>" value="1">
            <label for="<?php echo $this->get_field_id('show_platforms'); ?>">
                <?php _e('Show AI Platform Scores', 'geo-platform'); ?>
            </label>
        </p>
        <?php
    }
    
    /**
     * Update widget settings
     */
    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
        $instance['show_score'] = (!empty($new_instance['show_score'])) ? 1 : 0;
        $instance['show_platforms'] = (!empty($new_instance['show_platforms'])) ? 1 : 0;
        
        return $instance;
    }
}
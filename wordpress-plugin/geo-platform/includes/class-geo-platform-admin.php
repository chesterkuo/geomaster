<?php
/**
 * GEO Platform Admin Interface Class
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class GEO_Platform_Admin {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Add admin menu items
     */
    public function add_admin_menu() {
        // Main menu
        add_menu_page(
            __('GEO Platform', 'geo-platform'),
            __('GEO Platform', 'geo-platform'),
            'manage_options',
            'geo-platform',
            array($this, 'render_dashboard_page'),
            'dashicons-search',
            30
        );
        
        // Dashboard submenu
        add_submenu_page(
            'geo-platform',
            __('Dashboard', 'geo-platform'),
            __('Dashboard', 'geo-platform'),
            'manage_options',
            'geo-platform',
            array($this, 'render_dashboard_page')
        );
        
        // Scan & Analysis submenu
        add_submenu_page(
            'geo-platform',
            __('Scan & Analysis', 'geo-platform'),
            __('Scan & Analysis', 'geo-platform'),
            'manage_options',
            'geo-platform-scan',
            array($this, 'render_scan_page')
        );
        
        // AI Tracking submenu
        add_submenu_page(
            'geo-platform',
            __('AI Tracking', 'geo-platform'),
            __('AI Tracking', 'geo-platform'),
            'manage_options',
            'geo-platform-tracking',
            array($this, 'render_tracking_page')
        );
        
        // Keywords submenu
        add_submenu_page(
            'geo-platform',
            __('Keywords', 'geo-platform'),
            __('Keywords', 'geo-platform'),
            'manage_options',
            'geo-platform-keywords',
            array($this, 'render_keywords_page')
        );
        
        // Competitors submenu
        add_submenu_page(
            'geo-platform',
            __('Competitors', 'geo-platform'),
            __('Competitors', 'geo-platform'),
            'manage_options',
            'geo-platform-competitors',
            array($this, 'render_competitors_page')
        );
        
        // Settings submenu
        add_submenu_page(
            'geo-platform',
            __('Settings', 'geo-platform'),
            __('Settings', 'geo-platform'),
            'manage_options',
            'geo-platform-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('geo_platform_settings', 'geo_platform_settings', array(
            'sanitize_callback' => array($this, 'sanitize_settings')
        ));
        
        // API Settings Section
        add_settings_section(
            'geo_platform_api_section',
            __('API Configuration', 'geo-platform'),
            array($this, 'render_api_section'),
            'geo_platform_settings'
        );
        
        add_settings_field(
            'api_credentials',
            __('API Credentials', 'geo-platform'),
            array($this, 'render_api_credentials_field'),
            'geo_platform_settings',
            'geo_platform_api_section'
        );
        
        // Optimization Settings Section
        add_settings_section(
            'geo_platform_optimization_section',
            __('Optimization Settings', 'geo-platform'),
            array($this, 'render_optimization_section'),
            'geo_platform_settings'
        );
        
        add_settings_field(
            'auto_optimize',
            __('Auto-Optimize', 'geo-platform'),
            array($this, 'render_auto_optimize_field'),
            'geo_platform_settings',
            'geo_platform_optimization_section'
        );
        
        add_settings_field(
            'scan_frequency',
            __('Scan Frequency', 'geo-platform'),
            array($this, 'render_scan_frequency_field'),
            'geo_platform_settings',
            'geo_platform_optimization_section'
        );
        
        // Tracking Settings Section
        add_settings_section(
            'geo_platform_tracking_section',
            __('Tracking Settings', 'geo-platform'),
            array($this, 'render_tracking_section'),
            'geo_platform_settings'
        );
        
        add_settings_field(
            'tracking_enabled',
            __('Enable Tracking', 'geo-platform'),
            array($this, 'render_tracking_enabled_field'),
            'geo_platform_settings',
            'geo_platform_tracking_section'
        );
    }
    
    /**
     * Render dashboard page
     */
    public function render_dashboard_page() {
        $api = new GEO_Platform_API();
        $settings = get_option('geo_platform_settings');
        
        // Get dashboard stats if API is configured
        $stats = null;
        if (!empty($settings['api_key'])) {
            $stats = $api->get_dashboard_stats();
        }
        ?>
        <div class="wrap geo-platform-admin">
            <h1><?php _e('GEO Platform Dashboard', 'geo-platform'); ?></h1>
            
            <?php if (empty($settings['api_key'])): ?>
                <div class="notice notice-warning">
                    <p><?php _e('Please configure your API credentials in the settings to get started.', 'geo-platform'); ?></p>
                    <p><a href="<?php echo admin_url('admin.php?page=geo-platform-settings'); ?>" class="button button-primary"><?php _e('Configure Settings', 'geo-platform'); ?></a></p>
                </div>
            <?php else: ?>
                
                <?php if ($stats): ?>
                <div class="geo-dashboard-grid">
                    <!-- Overview Stats -->
                    <div class="geo-card">
                        <h2><?php _e('Overview', 'geo-platform'); ?></h2>
                        <div class="geo-stats-grid">
                            <div class="geo-stat">
                                <span class="geo-stat-value"><?php echo $settings['geo_score']; ?></span>
                                <span class="geo-stat-label"><?php _e('GEO Score', 'geo-platform'); ?></span>
                            </div>
                            <div class="geo-stat">
                                <span class="geo-stat-value"><?php echo isset($stats['overview']['totalScans']) ? $stats['overview']['totalScans'] : 0; ?></span>
                                <span class="geo-stat-label"><?php _e('Total Scans', 'geo-platform'); ?></span>
                            </div>
                            <div class="geo-stat">
                                <span class="geo-stat-value"><?php echo isset($stats['overview']['totalMentions']) ? $stats['overview']['totalMentions'] : 0; ?></span>
                                <span class="geo-stat-label"><?php _e('AI Mentions', 'geo-platform'); ?></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI Visibility -->
                    <div class="geo-card">
                        <h2><?php _e('AI Platform Visibility', 'geo-platform'); ?></h2>
                        <div class="geo-visibility-chart">
                            <?php 
                            $platforms = array('chatgpt' => 'ChatGPT', 'gemini' => 'Gemini', 'perplexity' => 'Perplexity', 'claude' => 'Claude');
                            foreach ($platforms as $key => $name): 
                                $value = isset($settings['ai_visibility'][$key]) ? $settings['ai_visibility'][$key] : 0;
                            ?>
                            <div class="geo-visibility-item">
                                <span class="geo-platform-name"><?php echo $name; ?></span>
                                <div class="geo-progress-bar">
                                    <div class="geo-progress-fill" style="width: <?php echo $value; ?>%"></div>
                                </div>
                                <span class="geo-platform-value"><?php echo $value; ?>%</span>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="geo-card">
                        <h2><?php _e('Quick Actions', 'geo-platform'); ?></h2>
                        <div class="geo-actions">
                            <a href="<?php echo admin_url('admin.php?page=geo-platform-scan'); ?>" class="button button-primary button-large">
                                <?php _e('Run Site Scan', 'geo-platform'); ?>
                            </a>
                            <a href="<?php echo admin_url('admin.php?page=geo-platform-tracking'); ?>" class="button button-large">
                                <?php _e('View AI Tracking', 'geo-platform'); ?>
                            </a>
                            <a href="<?php echo admin_url('admin.php?page=geo-platform-keywords'); ?>" class="button button-large">
                                <?php _e('Manage Keywords', 'geo-platform'); ?>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Recent Activity -->
                    <?php if (isset($stats['recentActivity']) && !empty($stats['recentActivity'])): ?>
                    <div class="geo-card geo-card-full">
                        <h2><?php _e('Recent Activity', 'geo-platform'); ?></h2>
                        <table class="wp-list-table widefat fixed striped">
                            <thead>
                                <tr>
                                    <th><?php _e('Date', 'geo-platform'); ?></th>
                                    <th><?php _e('Activity', 'geo-platform'); ?></th>
                                    <th><?php _e('Details', 'geo-platform'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach (array_slice($stats['recentActivity'], 0, 5) as $activity): ?>
                                <tr>
                                    <td><?php echo date_i18n(get_option('date_format'), strtotime($activity['date'])); ?></td>
                                    <td><?php echo esc_html($activity['type']); ?></td>
                                    <td><?php echo esc_html($activity['details']); ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    <?php endif; ?>
                </div>
                <?php else: ?>
                    <div class="notice notice-info">
                        <p><?php _e('Loading dashboard data...', 'geo-platform'); ?></p>
                    </div>
                <?php endif; ?>
                
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Render scan page
     */
    public function render_scan_page() {
        ?>
        <div class="wrap geo-platform-admin">
            <h1><?php _e('Site Scan & Analysis', 'geo-platform'); ?></h1>
            
            <div class="geo-scan-container">
                <div class="geo-card">
                    <h2><?php _e('Run New Scan', 'geo-platform'); ?></h2>
                    <p><?php _e('Analyze your website for AI search engine optimization opportunities.', 'geo-platform'); ?></p>
                    
                    <div class="geo-scan-options">
                        <label>
                            <input type="radio" name="scan_type" value="quick" checked>
                            <strong><?php _e('Quick Scan', 'geo-platform'); ?></strong> - <?php _e('Basic analysis (1-2 minutes)', 'geo-platform'); ?>
                        </label>
                        <label>
                            <input type="radio" name="scan_type" value="standard">
                            <strong><?php _e('Standard Scan', 'geo-platform'); ?></strong> - <?php _e('Comprehensive analysis (3-5 minutes)', 'geo-platform'); ?>
                        </label>
                        <label>
                            <input type="radio" name="scan_type" value="deep">
                            <strong><?php _e('Deep Scan', 'geo-platform'); ?></strong> - <?php _e('Full site analysis (10+ minutes)', 'geo-platform'); ?>
                        </label>
                    </div>
                    
                    <button type="button" id="geo-start-scan" class="button button-primary button-large">
                        <?php _e('Start Scan', 'geo-platform'); ?>
                    </button>
                    
                    <div id="geo-scan-progress" style="display:none;">
                        <div class="geo-progress-bar">
                            <div class="geo-progress-fill"></div>
                        </div>
                        <p class="geo-scan-status"></p>
                    </div>
                </div>
                
                <div id="geo-scan-results" style="display:none;">
                    <!-- Results will be populated via JavaScript -->
                </div>
                
                <!-- Scan History -->
                <div class="geo-card">
                    <h2><?php _e('Scan History', 'geo-platform'); ?></h2>
                    <?php $this->render_scan_history(); ?>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render tracking page
     */
    public function render_tracking_page() {
        $api = new GEO_Platform_API();
        $settings = get_option('geo_platform_settings');
        
        // Get website ID
        $website = $api->create_website();
        $website_id = $website ? $website['id'] : null;
        
        // Get tracking data
        $mentions = $website_id ? $api->get_ai_mentions($website_id) : null;
        $trends = $website_id ? $api->get_visibility_trends($website_id) : null;
        ?>
        <div class="wrap geo-platform-admin">
            <h1><?php _e('AI Platform Tracking', 'geo-platform'); ?></h1>
            
            <?php if ($mentions || $trends): ?>
            <div class="geo-tracking-grid">
                <!-- Mentions Summary -->
                <?php if ($mentions && isset($mentions['summary'])): ?>
                <div class="geo-card">
                    <h2><?php _e('AI Mentions Summary', 'geo-platform'); ?></h2>
                    <div class="geo-stats-grid">
                        <div class="geo-stat">
                            <span class="geo-stat-value"><?php echo $mentions['summary']['total']; ?></span>
                            <span class="geo-stat-label"><?php _e('Total Mentions', 'geo-platform'); ?></span>
                        </div>
                        <?php if (isset($mentions['summary']['byPlatform'])): ?>
                        <?php foreach ($mentions['summary']['byPlatform'] as $platform => $count): ?>
                        <div class="geo-stat">
                            <span class="geo-stat-value"><?php echo $count; ?></span>
                            <span class="geo-stat-label"><?php echo ucfirst($platform); ?></span>
                        </div>
                        <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>
                
                <!-- Visibility Trends -->
                <?php if ($trends && isset($trends['trends'])): ?>
                <div class="geo-card geo-card-full">
                    <h2><?php _e('Visibility Trends', 'geo-platform'); ?></h2>
                    <canvas id="geo-visibility-chart"></canvas>
                    <script>
                    // Chart data will be populated here
                    var trendsData = <?php echo json_encode($trends['trends']); ?>;
                    </script>
                </div>
                <?php endif; ?>
                
                <!-- Recent Mentions -->
                <?php if ($mentions && isset($mentions['mentions']) && !empty($mentions['mentions'])): ?>
                <div class="geo-card geo-card-full">
                    <h2><?php _e('Recent AI Mentions', 'geo-platform'); ?></h2>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php _e('Platform', 'geo-platform'); ?></th>
                                <th><?php _e('Query', 'geo-platform'); ?></th>
                                <th><?php _e('Mention', 'geo-platform'); ?></th>
                                <th><?php _e('Sentiment', 'geo-platform'); ?></th>
                                <th><?php _e('Citation', 'geo-platform'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($mentions['mentions'] as $mention): ?>
                            <tr>
                                <td><?php echo ucfirst($mention['platform']); ?></td>
                                <td><?php echo esc_html($mention['query']); ?></td>
                                <td><?php echo esc_html(substr($mention['mention'], 0, 100)) . '...'; ?></td>
                                <td>
                                    <span class="geo-sentiment geo-sentiment-<?php echo $mention['sentiment']; ?>">
                                        <?php echo ucfirst($mention['sentiment']); ?>
                                    </span>
                                </td>
                                <td><?php echo $mention['isCited'] ? __('Yes', 'geo-platform') . ' (#' . $mention['citationPosition'] . ')' : __('No', 'geo-platform'); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php endif; ?>
            </div>
            <?php else: ?>
                <div class="notice notice-info">
                    <p><?php _e('No tracking data available yet. Run a scan to start tracking AI mentions.', 'geo-platform'); ?></p>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Render keywords page
     */
    public function render_keywords_page() {
        $api = new GEO_Platform_API();
        $keywords = $api->get_keywords();
        ?>
        <div class="wrap geo-platform-admin">
            <h1><?php _e('Keyword Management', 'geo-platform'); ?></h1>
            
            <div class="geo-keywords-container">
                <!-- Add New Keyword -->
                <div class="geo-card">
                    <h2><?php _e('Add New Keyword', 'geo-platform'); ?></h2>
                    <form id="geo-add-keyword-form">
                        <table class="form-table">
                            <tr>
                                <th><label for="keyword"><?php _e('Keyword', 'geo-platform'); ?></label></th>
                                <td><input type="text" id="keyword" name="keyword" class="regular-text" required></td>
                            </tr>
                            <tr>
                                <th><label for="intent"><?php _e('Search Intent', 'geo-platform'); ?></label></th>
                                <td>
                                    <select id="intent" name="intent">
                                        <option value="informational"><?php _e('Informational', 'geo-platform'); ?></option>
                                        <option value="commercial"><?php _e('Commercial', 'geo-platform'); ?></option>
                                        <option value="transactional"><?php _e('Transactional', 'geo-platform'); ?></option>
                                        <option value="navigational"><?php _e('Navigational', 'geo-platform'); ?></option>
                                    </select>
                                </td>
                            </tr>
                        </table>
                        <p class="submit">
                            <button type="submit" class="button button-primary"><?php _e('Add Keyword', 'geo-platform'); ?></button>
                        </p>
                    </form>
                </div>
                
                <!-- Keywords List -->
                <div class="geo-card">
                    <h2><?php _e('Your Keywords', 'geo-platform'); ?></h2>
                    <?php if ($keywords && isset($keywords['keywords']) && !empty($keywords['keywords'])): ?>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php _e('Keyword', 'geo-platform'); ?></th>
                                <th><?php _e('Intent', 'geo-platform'); ?></th>
                                <th><?php _e('Search Volume', 'geo-platform'); ?></th>
                                <th><?php _e('Difficulty', 'geo-platform'); ?></th>
                                <th><?php _e('Actions', 'geo-platform'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($keywords['keywords'] as $keyword): ?>
                            <tr>
                                <td><strong><?php echo esc_html($keyword['keyword']); ?></strong></td>
                                <td><?php echo ucfirst($keyword['intent']); ?></td>
                                <td><?php echo isset($keyword['searchVolume']) ? number_format($keyword['searchVolume']) : '-'; ?></td>
                                <td><?php echo isset($keyword['difficulty']) ? $keyword['difficulty'] : '-'; ?></td>
                                <td>
                                    <button class="button button-small geo-delete-keyword" data-id="<?php echo $keyword['id']; ?>">
                                        <?php _e('Delete', 'geo-platform'); ?>
                                    </button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php else: ?>
                        <p><?php _e('No keywords added yet.', 'geo-platform'); ?></p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render competitors page
     */
    public function render_competitors_page() {
        $api = new GEO_Platform_API();
        $competitors = $api->get_competitors();
        ?>
        <div class="wrap geo-platform-admin">
            <h1><?php _e('Competitor Analysis', 'geo-platform'); ?></h1>
            
            <div class="geo-competitors-container">
                <!-- Add Competitor -->
                <div class="geo-card">
                    <h2><?php _e('Add Competitor', 'geo-platform'); ?></h2>
                    <form id="geo-add-competitor-form">
                        <table class="form-table">
                            <tr>
                                <th><label for="competitor_url"><?php _e('Website URL', 'geo-platform'); ?></label></th>
                                <td><input type="url" id="competitor_url" name="website_url" class="regular-text" required></td>
                            </tr>
                            <tr>
                                <th><label for="competitor_name"><?php _e('Competitor Name', 'geo-platform'); ?></label></th>
                                <td><input type="text" id="competitor_name" name="name" class="regular-text" required></td>
                            </tr>
                        </table>
                        <p class="submit">
                            <button type="submit" class="button button-primary"><?php _e('Add Competitor', 'geo-platform'); ?></button>
                        </p>
                    </form>
                </div>
                
                <!-- Competitors List -->
                <div class="geo-card">
                    <h2><?php _e('Your Competitors', 'geo-platform'); ?></h2>
                    <?php if ($competitors && isset($competitors['competitors']) && !empty($competitors['competitors'])): ?>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php _e('Name', 'geo-platform'); ?></th>
                                <th><?php _e('Domain', 'geo-platform'); ?></th>
                                <th><?php _e('GEO Score', 'geo-platform'); ?></th>
                                <th><?php _e('AI Visibility', 'geo-platform'); ?></th>
                                <th><?php _e('Actions', 'geo-platform'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($competitors['competitors'] as $competitor): ?>
                            <tr>
                                <td><strong><?php echo esc_html($competitor['name']); ?></strong></td>
                                <td><?php echo esc_html($competitor['domain']); ?></td>
                                <td><?php echo isset($competitor['geoScore']) ? $competitor['geoScore'] : '-'; ?></td>
                                <td><?php echo isset($competitor['aiVisibility']) ? $competitor['aiVisibility'] . '%' : '-'; ?></td>
                                <td>
                                    <button class="button button-small geo-analyze-competitor" data-id="<?php echo $competitor['id']; ?>">
                                        <?php _e('Analyze', 'geo-platform'); ?>
                                    </button>
                                    <button class="button button-small geo-delete-competitor" data-id="<?php echo $competitor['id']; ?>">
                                        <?php _e('Delete', 'geo-platform'); ?>
                                    </button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php else: ?>
                        <p><?php _e('No competitors added yet.', 'geo-platform'); ?></p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap geo-platform-admin">
            <h1><?php _e('GEO Platform Settings', 'geo-platform'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('geo_platform_settings');
                do_settings_sections('geo_platform_settings');
                submit_button();
                ?>
            </form>
            
            <div class="geo-card">
                <h2><?php _e('API Connection Status', 'geo-platform'); ?></h2>
                <p>
                    <button type="button" id="geo-test-connection" class="button">
                        <?php _e('Test Connection', 'geo-platform'); ?>
                    </button>
                    <span id="geo-connection-status"></span>
                </p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render API section description
     */
    public function render_api_section() {
        echo '<p>' . __('Configure your GEO Platform API credentials to connect with the service.', 'geo-platform') . '</p>';
        echo '<p>' . sprintf(__('Don\'t have an account? <a href="%s" target="_blank">Sign up here</a>', 'geo-platform'), 'https://geo-platform.com/signup') . '</p>';
    }
    
    /**
     * Render API credentials field
     */
    public function render_api_credentials_field() {
        $settings = get_option('geo_platform_settings');
        ?>
        <input type="email" name="geo_platform_settings[api_email]" placeholder="<?php _e('Email', 'geo-platform'); ?>" class="regular-text" value="<?php echo isset($settings['api_email']) ? esc_attr($settings['api_email']) : ''; ?>">
        <input type="password" name="geo_platform_settings[api_password]" placeholder="<?php _e('Password', 'geo-platform'); ?>" class="regular-text">
        <p class="description"><?php _e('Enter your GEO Platform account credentials.', 'geo-platform'); ?></p>
        <?php
    }
    
    /**
     * Render optimization section
     */
    public function render_optimization_section() {
        echo '<p>' . __('Configure automatic optimization settings for your content.', 'geo-platform') . '</p>';
    }
    
    /**
     * Render auto-optimize field
     */
    public function render_auto_optimize_field() {
        $settings = get_option('geo_platform_settings');
        $auto_optimize = isset($settings['auto_optimize']) ? $settings['auto_optimize'] : false;
        ?>
        <label>
            <input type="checkbox" name="geo_platform_settings[auto_optimize]" value="1" <?php checked($auto_optimize, true); ?>>
            <?php _e('Automatically optimize new and updated content for AI search engines', 'geo-platform'); ?>
        </label>
        <?php
    }
    
    /**
     * Render scan frequency field
     */
    public function render_scan_frequency_field() {
        $settings = get_option('geo_platform_settings');
        $frequency = isset($settings['scan_frequency']) ? $settings['scan_frequency'] : 'weekly';
        ?>
        <select name="geo_platform_settings[scan_frequency]">
            <option value="daily" <?php selected($frequency, 'daily'); ?>><?php _e('Daily', 'geo-platform'); ?></option>
            <option value="weekly" <?php selected($frequency, 'weekly'); ?>><?php _e('Weekly', 'geo-platform'); ?></option>
            <option value="monthly" <?php selected($frequency, 'monthly'); ?>><?php _e('Monthly', 'geo-platform'); ?></option>
            <option value="manual" <?php selected($frequency, 'manual'); ?>><?php _e('Manual Only', 'geo-platform'); ?></option>
        </select>
        <p class="description"><?php _e('How often to automatically scan your site for optimization opportunities.', 'geo-platform'); ?></p>
        <?php
    }
    
    /**
     * Render tracking section
     */
    public function render_tracking_section() {
        echo '<p>' . __('Configure AI platform tracking settings.', 'geo-platform') . '</p>';
    }
    
    /**
     * Render tracking enabled field
     */
    public function render_tracking_enabled_field() {
        $settings = get_option('geo_platform_settings');
        $tracking_enabled = isset($settings['tracking_enabled']) ? $settings['tracking_enabled'] : true;
        ?>
        <label>
            <input type="checkbox" name="geo_platform_settings[tracking_enabled]" value="1" <?php checked($tracking_enabled, true); ?>>
            <?php _e('Enable tracking of AI search engine bots and mentions', 'geo-platform'); ?>
        </label>
        <?php
    }
    
    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = array();
        
        // Handle API authentication
        if (isset($input['api_email']) && isset($input['api_password']) && !empty($input['api_password'])) {
            $api = new GEO_Platform_API();
            if ($api->authenticate($input['api_email'], $input['api_password'])) {
                $sanitized['api_key'] = 'authenticated';
                $sanitized['api_email'] = sanitize_email($input['api_email']);
            } else {
                add_settings_error('geo_platform_settings', 'api_auth_failed', __('Failed to authenticate with GEO Platform API. Please check your credentials.', 'geo-platform'));
            }
        } else {
            // Preserve existing API key
            $current = get_option('geo_platform_settings');
            if (isset($current['api_key'])) {
                $sanitized['api_key'] = $current['api_key'];
            }
            if (isset($current['api_email'])) {
                $sanitized['api_email'] = $current['api_email'];
            }
            if (isset($current['organization_id'])) {
                $sanitized['organization_id'] = $current['organization_id'];
            }
        }
        
        // Sanitize other settings
        $sanitized['auto_optimize'] = isset($input['auto_optimize']) ? true : false;
        $sanitized['tracking_enabled'] = isset($input['tracking_enabled']) ? true : false;
        $sanitized['scan_frequency'] = isset($input['scan_frequency']) ? sanitize_text_field($input['scan_frequency']) : 'weekly';
        
        // Preserve existing data
        $current = get_option('geo_platform_settings');
        if (isset($current['geo_score'])) {
            $sanitized['geo_score'] = $current['geo_score'];
        }
        if (isset($current['ai_visibility'])) {
            $sanitized['ai_visibility'] = $current['ai_visibility'];
        }
        
        return $sanitized;
    }
    
    /**
     * Render scan history
     */
    private function render_scan_history() {
        global $wpdb;
        $table = $wpdb->prefix . 'geo_platform_scans';
        $scans = $wpdb->get_results("SELECT * FROM $table ORDER BY scan_date DESC LIMIT 10");
        
        if ($scans) {
            ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Date', 'geo-platform'); ?></th>
                        <th><?php _e('URL', 'geo-platform'); ?></th>
                        <th><?php _e('GEO Score', 'geo-platform'); ?></th>
                        <th><?php _e('Actions', 'geo-platform'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($scans as $scan): ?>
                    <tr>
                        <td><?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($scan->scan_date)); ?></td>
                        <td><?php echo esc_html($scan->url); ?></td>
                        <td>
                            <span class="geo-score-badge geo-score-<?php echo $this->get_score_class($scan->geo_score); ?>">
                                <?php echo $scan->geo_score; ?>/100
                            </span>
                        </td>
                        <td>
                            <button class="button button-small geo-view-scan" data-id="<?php echo $scan->id; ?>">
                                <?php _e('View', 'geo-platform'); ?>
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php
        } else {
            echo '<p>' . __('No scans performed yet.', 'geo-platform') . '</p>';
        }
    }
    
    /**
     * Get score class for styling
     */
    private function get_score_class($score) {
        if ($score >= 85) return 'excellent';
        if ($score >= 70) return 'good';
        if ($score >= 50) return 'warning';
        return 'critical';
    }
}
/**
 * GEO Platform WordPress Plugin - Admin JavaScript
 * 
 * @package GEO_Platform
 * @since 1.0.0
 */

(function($) {
    'use strict';

    /**
     * Main plugin object
     */
    const GeoPlatform = {
        
        /**
         * Initialize the plugin
         */
        init: function() {
            this.bindEvents();
            this.initScoreCircles();
            this.checkConnectionStatus();
        },
        
        /**
         * Bind event handlers
         */
        bindEvents: function() {
            // Scan functionality
            $(document).on('click', '#geo-start-scan', this.startScan);
            $(document).on('click', '.geo-scan-post', this.scanPost);
            $(document).on('click', '.geo-view-scan', this.viewScanResults);
            
            // Optimization functionality
            $(document).on('click', '.geo-auto-optimize', this.autoOptimize);
            $(document).on('click', '.geo-optimize-content', this.optimizeContent);
            
            // Keyword management
            $(document).on('submit', '#geo-add-keyword-form', this.addKeyword);
            $(document).on('click', '.geo-delete-keyword', this.deleteKeyword);
            
            // Competitor management
            $(document).on('submit', '#geo-add-competitor-form', this.addCompetitor);
            $(document).on('click', '.geo-delete-competitor', this.deleteCompetitor);
            $(document).on('click', '.geo-analyze-competitor', this.analyzeCompetitor);
            
            // Settings
            $(document).on('click', '#geo-test-connection', this.testConnection);
            
            // Tracking refresh
            $(document).on('click', '#geo-refresh-tracking', this.refreshTracking);
            
            // Auto-refresh tracking data every 30 seconds
            if ($('.geo-tracking-grid').length) {
                setInterval(this.refreshTrackingData, 30000);
            }
        },
        
        /**
         * Initialize score circles with animation
         */
        initScoreCircles: function() {
            $('.score-circle').each(function() {
                const $circle = $(this);
                const score = parseInt($circle.data('score')) || 0;
                
                $circle.css('--score', score);
                
                // Animate the circle
                $({ score: 0 }).animate({ score: score }, {
                    duration: 1500,
                    easing: 'easeOutCubic',
                    step: function(now) {
                        $circle.css('--score', Math.round(now));
                    }
                });
            });
        },
        
        /**
         * Start site scan
         */
        startScan: function(e) {
            e.preventDefault();
            
            const $button = $(this);
            const $progress = $('#geo-scan-progress');
            const $results = $('#geo-scan-results');
            const scanType = $('input[name="scan_type"]:checked').val() || 'standard';
            
            $button.prop('disabled', true).text(geo_platform.strings.scanning);
            $progress.show();
            $results.hide();
            
            // Update progress bar
            let progress = 0;
            const progressInterval = setInterval(function() {
                progress += Math.random() * 10;
                if (progress > 95) progress = 95;
                
                $progress.find('.geo-progress-fill').css('width', progress + '%');
                $progress.find('.geo-scan-status').text(
                    progress < 30 ? 'Analyzing page structure...' :
                    progress < 60 ? 'Running AI optimization analysis...' :
                    progress < 90 ? 'Generating recommendations...' :
                    'Finalizing results...'
                );
            }, 500);
            
            // Make API request
            $.ajax({
                url: geo_platform.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_scan_site',
                    scan_type: scanType,
                    nonce: geo_platform.nonce
                },
                success: function(response) {
                    clearInterval(progressInterval);
                    $progress.find('.geo-progress-fill').css('width', '100%');
                    
                    setTimeout(function() {
                        $progress.hide();
                        
                        if (response.success) {
                            GeoPlatform.displayScanResults(response.data);
                            GeoPlatform.showNotification('success', 'Scan completed successfully!');
                        } else {
                            GeoPlatform.showNotification('error', response.message || 'Scan failed');
                        }
                        
                        $button.prop('disabled', false).text('Start Scan');
                    }, 1000);
                },
                error: function() {
                    clearInterval(progressInterval);
                    $progress.hide();
                    GeoPlatform.showNotification('error', 'Connection error. Please try again.');
                    $button.prop('disabled', false).text('Start Scan');
                }
            });
        },
        
        /**
         * Scan individual post
         */
        scanPost: function(e) {
            e.preventDefault();
            
            const $button = $(this);
            const postId = $button.data('post-id');
            
            $button.prop('disabled', true).addClass('geo-loading');
            
            $.ajax({
                url: geo_platform.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_scan_post',
                    post_id: postId,
                    nonce: geo_platform.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Update meta box with new data
                        GeoPlatform.updatePostMetaBox(postId, response.data);
                        GeoPlatform.showNotification('success', 'Post scan completed!');
                    } else {
                        GeoPlatform.showNotification('error', response.message || 'Scan failed');
                    }
                    
                    $button.prop('disabled', false).removeClass('geo-loading');
                },
                error: function() {
                    GeoPlatform.showNotification('error', 'Connection error. Please try again.');
                    $button.prop('disabled', false).removeClass('geo-loading');
                }
            });
        },
        
        /**
         * Auto-optimize content
         */
        autoOptimize: function(e) {
            e.preventDefault();
            
            const $button = $(this);
            const postId = $button.data('post-id');
            
            if (!confirm(geo_platform.strings.confirm_optimize)) {
                return;
            }
            
            $button.prop('disabled', true).text(geo_platform.strings.optimizing);
            
            $.ajax({
                url: geo_platform.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_optimize_content',
                    post_id: postId,
                    type: 'auto',
                    nonce: geo_platform.nonce
                },
                success: function(response) {
                    if (response.success) {
                        GeoPlatform.showNotification('success', 'Content optimized successfully!');
                        
                        // Update score display
                        if (response.data.newScore) {
                            const $scoreValue = $('.score-value');
                            $scoreValue.text(response.data.newScore);
                            $scoreValue.closest('.score-circle').data('score', response.data.newScore);
                        }
                        
                        // Refresh page to show changes
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        GeoPlatform.showNotification('error', response.message || 'Optimization failed');
                    }
                    
                    $button.prop('disabled', false).text('Auto-Optimize');
                },
                error: function() {
                    GeoPlatform.showNotification('error', 'Connection error. Please try again.');
                    $button.prop('disabled', false).text('Auto-Optimize');
                }
            });
        },
        
        /**
         * Add keyword
         */
        addKeyword: function(e) {
            e.preventDefault();
            
            const $form = $(this);
            const $button = $form.find('button[type="submit"]');
            const formData = $form.serialize();
            
            $button.prop('disabled', true);
            
            $.ajax({
                url: geo_platform.ajax_url,
                type: 'POST',
                data: formData + '&action=geo_platform_add_keyword&nonce=' + geo_platform.nonce,
                success: function(response) {
                    if (response.success) {
                        GeoPlatform.showNotification('success', 'Keyword added successfully!');
                        $form[0].reset();
                        location.reload(); // Refresh to show new keyword
                    } else {
                        GeoPlatform.showNotification('error', response.message || 'Failed to add keyword');
                    }
                    
                    $button.prop('disabled', false);
                },
                error: function() {
                    GeoPlatform.showNotification('error', 'Connection error. Please try again.');
                    $button.prop('disabled', false);
                }
            });
        },
        
        /**
         * Delete keyword
         */
        deleteKeyword: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this keyword?')) {
                return;
            }
            
            const $button = $(this);
            const keywordId = $button.data('id');
            
            $button.prop('disabled', true);
            
            $.ajax({
                url: geo_platform.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_delete_keyword',
                    keyword_id: keywordId,
                    nonce: geo_platform.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $button.closest('tr').fadeOut(300, function() {
                            $(this).remove();
                        });
                        GeoPlatform.showNotification('success', 'Keyword deleted successfully!');
                    } else {
                        GeoPlatform.showNotification('error', response.message || 'Failed to delete keyword');
                    }
                    
                    $button.prop('disabled', false);
                },
                error: function() {
                    GeoPlatform.showNotification('error', 'Connection error. Please try again.');
                    $button.prop('disabled', false);
                }
            });
        },
        
        /**
         * Test API connection
         */
        testConnection: function(e) {
            e.preventDefault();
            
            const $button = $(this);
            const $status = $('#geo-connection-status');
            
            $button.prop('disabled', true).text('Testing...');
            $status.removeClass('success error').text('Testing connection...');
            
            $.ajax({
                url: geo_platform.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_test_connection',
                    nonce: geo_platform.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $status.addClass('success').text('✓ Connection successful');
                        GeoPlatform.showNotification('success', 'API connection is working correctly!');
                    } else {
                        $status.addClass('error').text('✗ Connection failed');
                        GeoPlatform.showNotification('error', response.message || 'Connection test failed');
                    }
                    
                    $button.prop('disabled', false).text('Test Connection');
                },
                error: function() {
                    $status.addClass('error').text('✗ Connection error');
                    GeoPlatform.showNotification('error', 'Unable to test connection. Please check your settings.');
                    $button.prop('disabled', false).text('Test Connection');
                }
            });
        },
        
        /**
         * Display scan results
         */
        displayScanResults: function(data) {
            const $results = $('#geo-scan-results');
            
            let html = '<div class="geo-card"><h2>Scan Results</h2>';
            
            // Overall score
            html += '<div class="geo-scan-score">';
            html += '<div class="score-circle" data-score="' + (data.geoScore || 0) + '">';
            html += '<span class="score-value">' + (data.geoScore || 0) + '</span>';
            html += '<span class="score-label">/100</span>';
            html += '</div>';
            html += '<h3>Overall GEO Score</h3>';
            html += '</div>';
            
            // Breakdown scores
            if (data.scores) {
                html += '<div class="geo-stats-grid">';
                html += '<div class="geo-stat">';
                html += '<span class="geo-stat-value">' + (data.scores.technicalHealth || 0) + '</span>';
                html += '<span class="geo-stat-label">Technical Health</span>';
                html += '</div>';
                html += '<div class="geo-stat">';
                html += '<span class="geo-stat-value">' + (data.scores.contentQuality || 0) + '</span>';
                html += '<span class="geo-stat-label">Content Quality</span>';
                html += '</div>';
                html += '<div class="geo-stat">';
                html += '<span class="geo-stat-value">' + (data.scores.aiVisibility || 0) + '</span>';
                html += '<span class="geo-stat-label">AI Visibility</span>';
                html += '</div>';
                html += '</div>';
            }
            
            // Suggestions
            if (data.suggestions && data.suggestions.length > 0) {
                html += '<div class="geo-suggestions">';
                html += '<h4>Optimization Suggestions</h4>';
                html += '<ul>';
                data.suggestions.forEach(function(suggestion) {
                    html += '<li>' + suggestion + '</li>';
                });
                html += '</ul>';
                html += '</div>';
            }
            
            html += '</div>';
            
            $results.html(html).show();
            
            // Initialize new score circles
            this.initScoreCircles();
        },
        
        /**
         * Update post meta box
         */
        updatePostMetaBox: function(postId, data) {
            const $metaBox = $('.geo-platform-meta-box');
            
            if ($metaBox.length) {
                // Update score
                const $scoreValue = $metaBox.find('.score-value');
                if ($scoreValue.length && data.geoScore) {
                    $scoreValue.text(data.geoScore);
                    $scoreValue.closest('.score-circle').data('score', data.geoScore);
                }
                
                // Update suggestions
                if (data.suggestions) {
                    let suggestionsHtml = '<ul>';
                    data.suggestions.forEach(function(suggestion) {
                        suggestionsHtml += '<li>' + suggestion + '</li>';
                    });
                    suggestionsHtml += '</ul>';
                    
                    $metaBox.find('.geo-suggestions').html('<h4>Optimization Suggestions</h4>' + suggestionsHtml);
                }
            }
        },
        
        /**
         * Refresh tracking data
         */
        refreshTrackingData: function() {
            $.ajax({
                url: geo_platform.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_get_tracking_data',
                    nonce: geo_platform.nonce
                },
                success: function(response) {
                    if (response.success && response.data) {
                        GeoPlatform.updateTrackingDisplay(response.data);
                    }
                }
            });
        },
        
        /**
         * Update tracking display
         */
        updateTrackingDisplay: function(data) {
            // Update platform visibility
            if (data.platforms) {
                data.platforms.forEach(function(platform) {
                    const $platformValue = $('.geo-platform-value[data-platform="' + platform.platform + '"]');
                    if ($platformValue.length) {
                        $platformValue.text(platform.visibility + '%');
                        
                        const $progressBar = $platformValue.siblings('.geo-progress-bar').find('.geo-progress-fill');
                        $progressBar.css('width', platform.visibility + '%');
                    }
                });
            }
        },
        
        /**
         * Check connection status on page load
         */
        checkConnectionStatus: function() {
            if ($('#geo-connection-status').length) {
                // Auto-check connection when settings page loads
                setTimeout(function() {
                    $('#geo-test-connection').trigger('click');
                }, 1000);
            }
        },
        
        /**
         * Show notification
         */
        showNotification: function(type, message) {
            const className = type === 'success' ? 'notice-success' : 'notice-error';
            
            const $notice = $('<div class="notice ' + className + ' is-dismissible"><p>' + message + '</p></div>');
            
            $('.geo-platform-admin h1').after($notice);
            
            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                $notice.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
            
            // Make dismissible
            $notice.on('click', '.notice-dismiss', function() {
                $notice.fadeOut(300, function() {
                    $(this).remove();
                });
            });
        },
        
        /**
         * Utility: Format number with commas
         */
        formatNumber: function(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },
        
        /**
         * Utility: Get color for platform
         */
        getColorForPlatform: function(platform) {
            const colors = {
                chatgpt: '#10a37f',
                gemini: '#4285f4',
                perplexity: '#1a73e8',
                claude: '#8b5cf6'
            };
            return colors[platform] || '#666';
        }
    };
    
    /**
     * Initialize when document is ready
     */
    $(document).ready(function() {
        GeoPlatform.init();
    });
    
    /**
     * Expose GeoPlatform to global scope for debugging
     */
    window.GeoPlatform = GeoPlatform;
    
})(jQuery);

/**
 * jQuery easing extension
 */
jQuery.extend(jQuery.easing, {
    easeOutCubic: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    }
});
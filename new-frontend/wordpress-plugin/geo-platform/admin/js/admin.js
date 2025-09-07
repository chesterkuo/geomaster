/**
 * GEO Platform Admin JavaScript
 */

(function($) {
    'use strict';
    
    // Global admin object
    var GeoPlatformAdmin = {
        
        init: function() {
            this.bindEvents();
            this.initComponents();
        },
        
        bindEvents: function() {
            // Dashboard events
            $(document).on('click', '#sync-websites', this.syncWebsites);
            $(document).on('click', '#generate-quick-report', this.generateQuickReport);
            
            // Settings events
            $(document).on('click', '#test-connection', this.testConnection);
            $(document).on('click', '#toggle-api-key', this.toggleApiKey);
            
            // Website management events
            $(document).on('click', '.sync-single-website', this.syncSingleWebsite);
            $(document).on('click', '.analyze-website', this.analyzeWebsite);
            
            // Reports events
            $(document).on('click', '.report-type-card', this.selectReportType);
            $(document).on('click', '#generate-report', this.generateCustomReport);
            $(document).on('click', '.download-report', this.downloadReport);
            $(document).on('click', '.delete-report', this.deleteReport);
            
            // Analytics events
            $(document).on('change', '#analytics-period, #analytics-metrics', this.refreshAnalytics);
            $(document).on('click', '#refresh-analytics', this.refreshAnalytics);
            
            // Tools events
            $(document).on('click', '#clear-cache', this.clearCache);
            $(document).on('click', '#reset-settings', this.resetSettings);
            $(document).on('click', '#export-settings', this.exportSettings);
            $(document).on('click', '#import-settings', this.importSettings);
            $(document).on('change', '#import-settings-file', this.handleImportFile);
            
            // Modal events
            $(document).on('click', '.geo-platform-modal-close, #modal-ok', this.closeModal);
            $(window).on('click', this.handleModalOutsideClick);
            
            // General events
            $(document).on('click', '.geo-platform-refresh', this.refreshData);
        },
        
        initComponents: function() {
            // Initialize tooltips
            this.initTooltips();
            
            // Initialize charts if available
            this.initCharts();
            
            // Auto-refresh dashboard data every 5 minutes
            if ($('body').hasClass('toplevel_page_geo-platform')) {
                setInterval(this.refreshDashboardData, 300000); // 5 minutes
            }
        },
        
        // Dashboard Functions
        syncWebsites: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var originalText = $button.html();
            
            GeoPlatformAdmin.setButtonLoading($button, geo_platform_admin.strings.syncing_websites);
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_sync_websites',
                    nonce: geo_platform_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        GeoPlatformAdmin.showModal(
                            geo_platform_admin.strings.sync_success, 
                            response.data.message
                        );
                        
                        // Refresh page after 2 seconds
                        setTimeout(function() {
                            location.reload();
                        }, 2000);
                    } else {
                        GeoPlatformAdmin.showModal(
                            geo_platform_admin.strings.sync_failed, 
                            response.data ? response.data.message : 'Unknown error'
                        );
                    }
                },
                error: function(xhr, status, error) {
                    GeoPlatformAdmin.showModal(
                        geo_platform_admin.strings.sync_failed,
                        'Network error: ' + error
                    );
                },
                complete: function() {
                    GeoPlatformAdmin.resetButton($button, originalText);
                }
            });
        },
        
        generateQuickReport: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var originalText = $button.html();
            
            GeoPlatformAdmin.setButtonLoading($button, geo_platform_admin.strings.generating_report);
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_generate_report',
                    nonce: geo_platform_admin.nonce,
                    report_type: 'quick_overview',
                    parameters: {
                        name: 'Quick Overview Report - ' + new Date().toLocaleDateString()
                    }
                },
                success: function(response) {
                    if (response.success) {
                        GeoPlatformAdmin.showModal(
                            geo_platform_admin.strings.report_success,
                            response.data ? response.data.message : 'Report generated successfully'
                        );
                    } else {
                        GeoPlatformAdmin.showModal(
                            geo_platform_admin.strings.report_failed,
                            response.data ? response.data.message : 'Unknown error'
                        );
                    }
                },
                error: function(xhr, status, error) {
                    GeoPlatformAdmin.showModal(
                        geo_platform_admin.strings.report_failed,
                        'Network error: ' + error
                    );
                },
                complete: function() {
                    GeoPlatformAdmin.resetButton($button, originalText);
                }
            });
        },
        
        // Settings Functions
        testConnection: function(e) {
            e.preventDefault();
            
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
                    var message = response.data ? response.data.message : 'Unknown result';
                    
                    $result.html(
                        '<div class="connection-status ' + statusClass + '">' +
                        '<span class="dashicons ' + iconClass + '"></span>' +
                        message +
                        '</div>'
                    );
                },
                error: function(xhr, status, error) {
                    $result.html(
                        '<div class="connection-status error">' +
                        '<span class="dashicons dashicons-dismiss"></span>' +
                        'Connection test failed: ' + error +
                        '</div>'
                    );
                },
                complete: function() {
                    $button.prop('disabled', false).text(originalText);
                }
            });
        },
        
        toggleApiKey: function(e) {
            e.preventDefault();
            
            var $input = $('#geo_platform_api_key');
            var $icon = $(this).find('.dashicons');
            
            if ($input.attr('type') === 'password') {
                $input.attr('type', 'text');
                $icon.removeClass('dashicons-visibility').addClass('dashicons-hidden');
            } else {
                $input.attr('type', 'password');
                $icon.removeClass('dashicons-hidden').addClass('dashicons-visibility');
            }
        },
        
        // Website Management Functions
        syncSingleWebsite: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var websiteId = $button.data('website-id');
            var originalText = $button.html();
            
            GeoPlatformAdmin.setButtonLoading($button, 'Syncing...');
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_sync_single_website',
                    nonce: geo_platform_admin.nonce,
                    website_id: websiteId
                },
                success: function(response) {
                    if (response.success) {
                        GeoPlatformAdmin.showNotice('success', 'Website synced successfully');
                        // Update website card status
                        $button.closest('.website-card').find('.website-status').text('Synced');
                    } else {
                        GeoPlatformAdmin.showNotice('error', response.data ? response.data.message : 'Sync failed');
                    }
                },
                error: function() {
                    GeoPlatformAdmin.showNotice('error', 'Network error occurred');
                },
                complete: function() {
                    GeoPlatformAdmin.resetButton($button, originalText);
                }
            });
        },
        
        analyzeWebsite: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var websiteId = $button.data('website-id');
            var originalText = $button.html();
            
            GeoPlatformAdmin.setButtonLoading($button, 'Analyzing...');
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_analyze_website',
                    nonce: geo_platform_admin.nonce,
                    website_id: websiteId
                },
                success: function(response) {
                    if (response.success) {
                        // Redirect to analytics page with website filter
                        window.location.href = 'admin.php?page=geo-platform-analytics&website=' + websiteId;
                    } else {
                        GeoPlatformAdmin.showNotice('error', response.data ? response.data.message : 'Analysis failed');
                    }
                },
                error: function() {
                    GeoPlatformAdmin.showNotice('error', 'Network error occurred');
                },
                complete: function() {
                    GeoPlatformAdmin.resetButton($button, originalText);
                }
            });
        },
        
        // Reports Functions
        selectReportType: function(e) {
            e.preventDefault();
            
            $('.report-type-card').removeClass('selected');
            $(this).addClass('selected');
            
            var reportType = $(this).data('report-type');
            $('#selected-report-type').val(reportType);
            
            // Show/hide relevant parameters based on report type
            GeoPlatformAdmin.updateReportParameters(reportType);
        },
        
        updateReportParameters: function(reportType) {
            $('.report-parameter').hide();
            $('.report-parameter[data-report-types*="' + reportType + '"]').show();
        },
        
        generateCustomReport: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var reportType = $('#selected-report-type').val();
            
            if (!reportType) {
                GeoPlatformAdmin.showNotice('warning', 'Please select a report type');
                return;
            }
            
            var originalText = $button.html();
            var parameters = GeoPlatformAdmin.getReportParameters();
            
            GeoPlatformAdmin.setButtonLoading($button, 'Generating Report...');
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_generate_report',
                    nonce: geo_platform_admin.nonce,
                    report_type: reportType,
                    parameters: parameters
                },
                success: function(response) {
                    if (response.success) {
                        GeoPlatformAdmin.showNotice('success', 'Report generation started. You will be notified when complete.');
                        // Refresh reports list after 2 seconds
                        setTimeout(GeoPlatformAdmin.refreshReportsList, 2000);
                    } else {
                        GeoPlatformAdmin.showNotice('error', response.data ? response.data.message : 'Report generation failed');
                    }
                },
                error: function() {
                    GeoPlatformAdmin.showNotice('error', 'Network error occurred');
                },
                complete: function() {
                    GeoPlatformAdmin.resetButton($button, originalText);
                }
            });
        },
        
        getReportParameters: function() {
            var parameters = {};
            
            $('.report-parameter:visible').each(function() {
                var $param = $(this);
                var name = $param.data('parameter');
                var value = $param.find('input, select, textarea').val();
                
                if (value) {
                    parameters[name] = value;
                }
            });
            
            return parameters;
        },
        
        downloadReport: function(e) {
            e.preventDefault();
            
            var reportId = $(this).data('report-id');
            var downloadUrl = $(this).data('download-url');
            
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                GeoPlatformAdmin.showNotice('error', 'Download URL not available');
            }
        },
        
        deleteReport: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                return;
            }
            
            var $button = $(this);
            var reportId = $button.data('report-id');
            var $reportRow = $button.closest('.report-item');
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_delete_report',
                    nonce: geo_platform_admin.nonce,
                    report_id: reportId
                },
                success: function(response) {
                    if (response.success) {
                        $reportRow.fadeOut(300, function() {
                            $(this).remove();
                        });
                        GeoPlatformAdmin.showNotice('success', 'Report deleted successfully');
                    } else {
                        GeoPlatformAdmin.showNotice('error', response.data ? response.data.message : 'Failed to delete report');
                    }
                },
                error: function() {
                    GeoPlatformAdmin.showNotice('error', 'Network error occurred');
                }
            });
        },
        
        // Analytics Functions
        refreshAnalytics: function(e) {
            if (e) e.preventDefault();
            
            var $container = $('.analytics-container');
            var period = $('#analytics-period').val() || '30';
            var metrics = $('#analytics-metrics').val() || [];
            
            $container.addClass('loading');
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_get_analytics',
                    nonce: geo_platform_admin.nonce,
                    period: period,
                    metrics: metrics
                },
                success: function(response) {
                    if (response.success) {
                        GeoPlatformAdmin.updateAnalyticsDisplay(response.data);
                    } else {
                        GeoPlatformAdmin.showNotice('error', response.data ? response.data.message : 'Failed to load analytics');
                    }
                },
                error: function() {
                    GeoPlatformAdmin.showNotice('error', 'Network error occurred');
                },
                complete: function() {
                    $container.removeClass('loading');
                }
            });
        },
        
        updateAnalyticsDisplay: function(data) {
            // Update summary cards
            if (data.summary) {
                Object.keys(data.summary).forEach(function(metric) {
                    var $card = $('.summary-card[data-metric="' + metric + '"]');
                    if ($card.length) {
                        $card.find('.summary-number').text(data.summary[metric].value);
                        
                        var change = data.summary[metric].change;
                        var $changeEl = $card.find('.summary-change');
                        
                        $changeEl.removeClass('change-positive change-negative');
                        if (change > 0) {
                            $changeEl.addClass('change-positive').text('+' + change + '%');
                        } else if (change < 0) {
                            $changeEl.addClass('change-negative').text(change + '%');
                        } else {
                            $changeEl.text('No change');
                        }
                    }
                });
            }
            
            // Update charts if available
            if (typeof GeoPlatformAdmin.updateCharts === 'function') {
                GeoPlatformAdmin.updateCharts(data.charts);
            }
        },
        
        // Tools Functions
        clearCache: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to clear all cached data?')) {
                return;
            }
            
            var $button = $(this);
            var originalText = $button.html();
            
            GeoPlatformAdmin.setButtonLoading($button, 'Clearing Cache...');
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_clear_cache',
                    nonce: geo_platform_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        GeoPlatformAdmin.showNotice('success', 'Cache cleared successfully');
                    } else {
                        GeoPlatformAdmin.showNotice('error', response.data ? response.data.message : 'Failed to clear cache');
                    }
                },
                error: function() {
                    GeoPlatformAdmin.showNotice('error', 'Network error occurred');
                },
                complete: function() {
                    GeoPlatformAdmin.resetButton($button, originalText);
                }
            });
        },
        
        resetSettings: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
                return;
            }
            
            if (!confirm('This will permanently delete all your GEO Platform settings. Are you absolutely sure?')) {
                return;
            }
            
            // Reset form values
            $('#geo_platform_api_key').val('');
            $('#geo_platform_api_url').val('https://api.geo-platform.com');
            $('#geo_platform_sync_frequency').val('hourly');
            $('#geo_platform_auto_sync').prop('checked', true);
            $('#geo_platform_enable_notifications').prop('checked', true);
            $('#geo_platform_debug_mode').prop('checked', false);
            
            GeoPlatformAdmin.showNotice('info', 'Settings have been reset. Please save to confirm changes.');
        },
        
        exportSettings: function(e) {
            e.preventDefault();
            
            var settings = {
                api_url: $('#geo_platform_api_url').val(),
                sync_frequency: $('#geo_platform_sync_frequency').val(),
                auto_sync: $('#geo_platform_auto_sync').prop('checked'),
                enable_notifications: $('#geo_platform_enable_notifications').prop('checked'),
                debug_mode: $('#geo_platform_debug_mode').prop('checked'),
                exported_at: new Date().toISOString()
            };
            
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
            var downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "geo-platform-settings-" + new Date().getTime() + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            GeoPlatformAdmin.showNotice('success', 'Settings exported successfully');
        },
        
        importSettings: function(e) {
            e.preventDefault();
            $('#import-settings-file').click();
        },
        
        handleImportFile: function(e) {
            var file = e.target.files[0];
            if (!file) return;
            
            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var settings = JSON.parse(event.target.result);
                    
                    // Validate and apply settings
                    if (settings.api_url) $('#geo_platform_api_url').val(settings.api_url);
                    if (settings.sync_frequency) $('#geo_platform_sync_frequency').val(settings.sync_frequency);
                    if (typeof settings.auto_sync !== 'undefined') $('#geo_platform_auto_sync').prop('checked', settings.auto_sync);
                    if (typeof settings.enable_notifications !== 'undefined') $('#geo_platform_enable_notifications').prop('checked', settings.enable_notifications);
                    if (typeof settings.debug_mode !== 'undefined') $('#geo_platform_debug_mode').prop('checked', settings.debug_mode);
                    
                    GeoPlatformAdmin.showNotice('success', 'Settings imported successfully! Please save to confirm changes.');
                } catch (error) {
                    GeoPlatformAdmin.showNotice('error', 'Invalid settings file format');
                }
            };
            reader.readAsText(file);
            
            // Clear file input
            $(this).val('');
        },
        
        // Utility Functions
        setButtonLoading: function($button, text) {
            $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> ' + text);
        },
        
        resetButton: function($button, originalText) {
            $button.prop('disabled', false).html(originalText);
        },
        
        showModal: function(title, message) {
            $('#modal-title').text(title);
            $('#modal-body').html('<p>' + message + '</p>');
            $('#geo-platform-modal').show();
        },
        
        closeModal: function(e) {
            e.preventDefault();
            $('#geo-platform-modal').hide();
        },
        
        handleModalOutsideClick: function(e) {
            if (e.target.id === 'geo-platform-modal') {
                $('#geo-platform-modal').hide();
            }
        },
        
        showNotice: function(type, message) {
            var noticeClass = 'notice-' + type;
            var $notice = $('<div class="notice ' + noticeClass + ' is-dismissible"><p>' + message + '</p></div>');
            
            $('.wrap h1').after($notice);
            
            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                $notice.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        },
        
        refreshData: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var dataType = $button.data('refresh-type');
            
            switch (dataType) {
                case 'websites':
                    GeoPlatformAdmin.refreshWebsitesList();
                    break;
                case 'reports':
                    GeoPlatformAdmin.refreshReportsList();
                    break;
                case 'analytics':
                    GeoPlatformAdmin.refreshAnalytics();
                    break;
                default:
                    location.reload();
            }
        },
        
        refreshWebsitesList: function() {
            $('.websites-grid').load(window.location.href + ' .websites-grid > *');
        },
        
        refreshReportsList: function() {
            $('.reports-list').load(window.location.href + ' .reports-list > *');
        },
        
        refreshDashboardData: function() {
            // Only refresh if user is active (to avoid unnecessary requests)
            if (document.hidden) return;
            
            $.ajax({
                url: geo_platform_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'geo_platform_get_dashboard_data',
                    nonce: geo_platform_admin.nonce
                },
                success: function(response) {
                    if (response.success && response.data) {
                        // Update dashboard stats
                        Object.keys(response.data).forEach(function(key) {
                            var $stat = $('.geo-platform-stat-number[data-stat="' + key + '"]');
                            if ($stat.length) {
                                $stat.text(response.data[key]);
                            }
                        });
                    }
                }
            });
        },
        
        initTooltips: function() {
            // Initialize tooltips for help icons
            $('.geo-platform-tooltip').each(function() {
                var $tooltip = $(this);
                var title = $tooltip.attr('title');
                
                if (title) {
                    $tooltip.attr('data-tooltip', title).removeAttr('title');
                }
            });
        },
        
        initCharts: function() {
            // Initialize charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                $('.chart-container[data-chart-type]').each(function() {
                    var $container = $(this);
                    var chartType = $container.data('chart-type');
                    var chartData = $container.data('chart-data');
                    
                    if (chartData) {
                        GeoPlatformAdmin.createChart($container, chartType, chartData);
                    }
                });
            }
        },
        
        createChart: function($container, type, data) {
            var canvas = $container.find('canvas')[0];
            if (!canvas) {
                canvas = $('<canvas>').appendTo($container)[0];
            }
            
            var ctx = canvas.getContext('2d');
            
            new Chart(ctx, {
                type: type,
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    };
    
    // Initialize when document is ready
    $(document).ready(function() {
        GeoPlatformAdmin.init();
    });
    
    // Make admin object globally available
    window.GeoPlatformAdmin = GeoPlatformAdmin;
    
})(jQuery);
#!/usr/bin/env node

/**
 * GEO Platform WordPress Plugin Test Script
 * 
 * This script tests the WordPress plugin functionality by:
 * 1. Verifying plugin file structure
 * 2. Testing API integration
 * 3. Checking database schema
 * 4. Validating shortcodes and hooks
 * 5. Testing admin interface components
 * 
 * @package GEO_Platform
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class WordPressPluginTester {
    constructor() {
        this.pluginPath = './wordpress-plugin/geo-platform';
        this.testResults = [];
        this.config = {
            apiBaseUrl: 'https://api-geo.blitzgame.site/api/v1',
            testTimeout: 30000
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting GEO Platform WordPress Plugin Tests');
        console.log('📡 Target Plugin Path:', this.pluginPath);
        console.log('==================================================\n');

        try {
            await this.testPluginStructure();
            await this.testPluginFiles();
            await this.testDatabaseSchema();
            await this.testShortcodes();
            await this.testHooksAndFilters();
            await this.testAPIIntegration();
            await this.testAdminInterface();
            await this.testSecurityFeatures();
            await this.testWordPressIntegration();
            
            this.printTestSummary();
        } catch (error) {
            this.logError('Fatal error during testing', error);
        }
    }

    /**
     * Test plugin file structure
     */
    async testPluginStructure() {
        const testName = 'Plugin File Structure';
        this.logTest(testName);

        const requiredFiles = [
            'geo-platform.php',
            'README.md',
            'includes/class-geo-platform.php',
            'includes/class-geo-platform-api.php',
            'includes/class-geo-platform-admin.php',
            'includes/class-geo-platform-scanner.php',
            'includes/class-geo-platform-optimizer.php',
            'includes/class-geo-platform-tracker.php',
            'includes/class-geo-platform-widget.php',
            'includes/class-geo-platform-shortcodes.php',
            'assets/css/admin.css',
            'assets/js/admin.js'
        ];

        let missingFiles = [];
        let existingFiles = [];

        for (const file of requiredFiles) {
            const filePath = path.join(this.pluginPath, file);
            if (fs.existsSync(filePath)) {
                existingFiles.push(file);
            } else {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length === 0) {
            this.logSuccess(testName);
            this.logInfo(`✅ All ${requiredFiles.length} required files found`);
        } else {
            this.logFailure(testName);
            this.logError(`❌ Missing files: ${missingFiles.join(', ')}`);
        }

        // Check file sizes
        this.logInfo('\n📁 File Structure Analysis:');
        for (const file of existingFiles) {
            const filePath = path.join(this.pluginPath, file);
            const stats = fs.statSync(filePath);
            this.logInfo(`  ${file}: ${this.formatFileSize(stats.size)}`);
        }
    }

    /**
     * Test plugin files for PHP syntax and WordPress compliance
     */
    async testPluginFiles() {
        const testName = 'Plugin File Validation';
        this.logTest(testName);

        const phpFiles = [
            'geo-platform.php',
            'includes/class-geo-platform.php',
            'includes/class-geo-platform-api.php',
            'includes/class-geo-platform-admin.php',
            'includes/class-geo-platform-scanner.php',
            'includes/class-geo-platform-optimizer.php',
            'includes/class-geo-platform-tracker.php',
            'includes/class-geo-platform-widget.php',
            'includes/class-geo-platform-shortcodes.php'
        ];

        let validFiles = [];
        let invalidFiles = [];

        for (const file of phpFiles) {
            const filePath = path.join(this.pluginPath, file);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for WordPress security practices
                const hasSecurityCheck = content.includes("!defined('ABSPATH')");
                const hasProperPHPTags = content.startsWith('<?php');
                const hasClassDefinition = content.includes('class ');
                const hasProperDocumentation = content.includes('/**');

                const validations = [
                    { name: 'Security Check', passed: hasSecurityCheck },
                    { name: 'PHP Tags', passed: hasProperPHPTags },
                    { name: 'Class Definition', passed: hasClassDefinition },
                    { name: 'Documentation', passed: hasProperDocumentation }
                ];

                const passedValidations = validations.filter(v => v.passed).length;
                
                if (passedValidations === validations.length) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push({
                        file,
                        failed: validations.filter(v => !v.passed).map(v => v.name)
                    });
                }

                this.logInfo(`  ${file}: ${passedValidations}/${validations.length} checks passed`);
            }
        }

        if (invalidFiles.length === 0) {
            this.logSuccess(testName);
            this.logInfo(`✅ All ${phpFiles.length} PHP files passed validation`);
        } else {
            this.logWarning(testName);
            this.logInfo(`⚠️  ${invalidFiles.length} files have validation issues`);
            invalidFiles.forEach(item => {
                this.logError(`   ${item.file}: Failed ${item.failed.join(', ')}`);
            });
        }
    }

    /**
     * Test database schema definitions
     */
    async testDatabaseSchema() {
        const testName = 'Database Schema Validation';
        this.logTest(testName);

        const mainPluginFile = path.join(this.pluginPath, 'geo-platform.php');
        
        if (!fs.existsSync(mainPluginFile)) {
            this.logFailure(testName);
            this.logError('❌ Main plugin file not found');
            return;
        }

        const content = fs.readFileSync(mainPluginFile, 'utf8');

        // Check for database table creation
        const expectedTables = [
            'geo_platform_scans',
            'geo_platform_optimizations', 
            'geo_platform_tracking'
        ];

        let foundTables = [];
        
        for (const table of expectedTables) {
            if (content.includes(table)) {
                foundTables.push(table);
            }
        }

        // Check for proper WordPress database practices
        const hasPrefixUsage = content.includes('$wpdb->prefix');
        const hasCharsetCollate = content.includes('$charset_collate');
        const hasDbDelta = content.includes('dbDelta');

        const dbFeatures = [
            { name: 'Table Prefix Usage', passed: hasPrefixUsage },
            { name: 'Charset Collate', passed: hasCharsetCollate },
            { name: 'dbDelta Function', passed: hasDbDelta }
        ];

        this.logInfo(`📊 Database Schema Analysis:`);
        this.logInfo(`  Tables defined: ${foundTables.length}/${expectedTables.length}`);
        foundTables.forEach(table => this.logInfo(`    ✅ ${table}`));
        
        expectedTables.filter(table => !foundTables.includes(table))
                      .forEach(table => this.logError(`    ❌ ${table} (missing)`));

        dbFeatures.forEach(feature => {
            if (feature.passed) {
                this.logInfo(`    ✅ ${feature.name}`);
            } else {
                this.logError(`    ❌ ${feature.name}`);
            }
        });

        const passedChecks = foundTables.length + dbFeatures.filter(f => f.passed).length;
        const totalChecks = expectedTables.length + dbFeatures.length;

        if (passedChecks === totalChecks) {
            this.logSuccess(testName);
        } else if (passedChecks >= totalChecks * 0.7) {
            this.logWarning(testName);
        } else {
            this.logFailure(testName);
        }
    }

    /**
     * Test shortcodes implementation
     */
    async testShortcodes() {
        const testName = 'Shortcodes Implementation';
        this.logTest(testName);

        const shortcodesFile = path.join(this.pluginPath, 'includes/class-geo-platform-shortcodes.php');
        
        if (!fs.existsSync(shortcodesFile)) {
            this.logFailure(testName);
            this.logError('❌ Shortcodes file not found');
            return;
        }

        const content = fs.readFileSync(shortcodesFile, 'utf8');

        const expectedShortcodes = [
            'geo_score',
            'geo_ai_visibility', 
            'geo_optimization_tips',
            'geo_tracking_chart',
            'geo_faq'
        ];

        let foundShortcodes = [];
        
        for (const shortcode of expectedShortcodes) {
            const shortcodePattern = new RegExp(`add_shortcode\\(['"]${shortcode}['"]`, 'g');
            const functionPattern = new RegExp(`${shortcode}_shortcode`, 'g');
            
            if (shortcodePattern.test(content) || functionPattern.test(content)) {
                foundShortcodes.push(shortcode);
            }
        }

        // Check for proper shortcode practices
        const hasAttributeHandling = content.includes('shortcode_atts');
        const hasSanitization = content.includes('esc_attr') || content.includes('esc_html');
        const hasOutputReturn = content.includes('return $output') || content.includes('return $html');

        this.logInfo(`🎯 Shortcode Analysis:`);
        this.logInfo(`  Shortcodes implemented: ${foundShortcodes.length}/${expectedShortcodes.length}`);
        foundShortcodes.forEach(shortcode => this.logInfo(`    ✅ [${shortcode}]`));
        
        expectedShortcodes.filter(sc => !foundShortcodes.includes(sc))
                          .forEach(sc => this.logError(`    ❌ [${sc}] (missing)`));

        const practices = [
            { name: 'Attribute Handling', passed: hasAttributeHandling },
            { name: 'Output Sanitization', passed: hasSanitization },
            { name: 'Proper Return Values', passed: hasOutputReturn }
        ];

        practices.forEach(practice => {
            if (practice.passed) {
                this.logInfo(`    ✅ ${practice.name}`);
            } else {
                this.logError(`    ❌ ${practice.name}`);
            }
        });

        const passedChecks = foundShortcodes.length + practices.filter(p => p.passed).length;
        const totalChecks = expectedShortcodes.length + practices.length;

        if (passedChecks >= totalChecks * 0.8) {
            this.logSuccess(testName);
        } else if (passedChecks >= totalChecks * 0.6) {
            this.logWarning(testName);
        } else {
            this.logFailure(testName);
        }
    }

    /**
     * Test WordPress hooks and filters
     */
    async testHooksAndFilters() {
        const testName = 'WordPress Hooks & Filters';
        this.logTest(testName);

        const mainFile = path.join(this.pluginPath, 'geo-platform.php');
        const content = fs.readFileSync(mainFile, 'utf8');

        const expectedHooks = [
            'plugins_loaded',
            'wp_enqueue_scripts',
            'admin_enqueue_scripts',
            'add_meta_boxes',
            'wp_dashboard_setup',
            'wp_ajax_',
            'save_post',
            'wp_head',
            'rest_api_init'
        ];

        let foundHooks = [];
        
        for (const hook of expectedHooks) {
            const actionPattern = new RegExp(`add_action\\(['"]${hook}`, 'g');
            const filterPattern = new RegExp(`add_filter\\(['"]${hook}`, 'g');
            const ajaxPattern = hook === 'wp_ajax_' ? /wp_ajax_geo_platform/g : null;
            
            if (actionPattern.test(content) || filterPattern.test(content) || (ajaxPattern && ajaxPattern.test(content))) {
                foundHooks.push(hook);
            }
        }

        // Check for activation/deactivation hooks
        const hasActivationHook = content.includes('register_activation_hook');
        const hasDeactivationHook = content.includes('register_deactivation_hook');
        const hasUninstallHook = content.includes('register_uninstall_hook');

        this.logInfo(`🔗 WordPress Hooks Analysis:`);
        this.logInfo(`  Standard hooks: ${foundHooks.length}/${expectedHooks.length}`);
        foundHooks.forEach(hook => this.logInfo(`    ✅ ${hook}`));

        const lifecycleHooks = [
            { name: 'Activation Hook', passed: hasActivationHook },
            { name: 'Deactivation Hook', passed: hasDeactivationHook },
            { name: 'Uninstall Hook', passed: hasUninstallHook }
        ];

        lifecycleHooks.forEach(hook => {
            if (hook.passed) {
                this.logInfo(`    ✅ ${hook.name}`);
            } else {
                this.logWarning(`    ⚠️  ${hook.name} (recommended)`);
            }
        });

        if (foundHooks.length >= expectedHooks.length * 0.8) {
            this.logSuccess(testName);
        } else if (foundHooks.length >= expectedHooks.length * 0.6) {
            this.logWarning(testName);
        } else {
            this.logFailure(testName);
        }
    }

    /**
     * Test API integration
     */
    async testAPIIntegration() {
        const testName = 'API Integration';
        this.logTest(testName);

        const apiFile = path.join(this.pluginPath, 'includes/class-geo-platform-api.php');
        
        if (!fs.existsSync(apiFile)) {
            this.logFailure(testName);
            this.logError('❌ API class file not found');
            return;
        }

        const content = fs.readFileSync(apiFile, 'utf8');

        // Check for API methods
        const expectedMethods = [
            'authenticate',
            'make_request',
            'scan_website',
            'get_optimization_suggestions',
            'get_ai_mentions',
            'get_visibility_trends',
            'create_keyword',
            'get_competitors'
        ];

        let foundMethods = [];
        
        for (const method of expectedMethods) {
            const methodPattern = new RegExp(`function\\s+${method}`, 'g');
            if (methodPattern.test(content)) {
                foundMethods.push(method);
            }
        }

        // Check for proper API practices
        const hasErrorHandling = content.includes('wp_remote_retrieve_response_code');
        const hasAuthentication = content.includes('Authorization: Bearer');
        const hasTimeout = content.includes('timeout');
        const hasJSONHandling = content.includes('json_decode');

        this.logInfo(`🔌 API Integration Analysis:`);
        this.logInfo(`  API methods: ${foundMethods.length}/${expectedMethods.length}`);
        foundMethods.forEach(method => this.logInfo(`    ✅ ${method}()`));

        const apiPractices = [
            { name: 'Error Handling', passed: hasErrorHandling },
            { name: 'Authentication Headers', passed: hasAuthentication },
            { name: 'Request Timeout', passed: hasTimeout },
            { name: 'JSON Processing', passed: hasJSONHandling }
        ];

        apiPractices.forEach(practice => {
            if (practice.passed) {
                this.logInfo(`    ✅ ${practice.name}`);
            } else {
                this.logError(`    ❌ ${practice.name}`);
            }
        });

        // Test actual API connectivity
        try {
            this.logInfo('\n🔍 Testing API connectivity...');
            const response = await axios.get(`${this.config.apiBaseUrl}/health`, {
                timeout: 5000
            });
            
            if (response.status === 200 && response.data.success) {
                this.logInfo('    ✅ API endpoint is accessible');
            } else {
                this.logWarning('    ⚠️  API endpoint responded but may have issues');
            }
        } catch (error) {
            this.logError('    ❌ API endpoint not accessible:', error.message);
        }

        const passedChecks = foundMethods.length + apiPractices.filter(p => p.passed).length;
        const totalChecks = expectedMethods.length + apiPractices.length;

        if (passedChecks >= totalChecks * 0.8) {
            this.logSuccess(testName);
        } else if (passedChecks >= totalChecks * 0.6) {
            this.logWarning(testName);
        } else {
            this.logFailure(testName);
        }
    }

    /**
     * Test admin interface components
     */
    async testAdminInterface() {
        const testName = 'Admin Interface';
        this.logTest(testName);

        const adminFile = path.join(this.pluginPath, 'includes/class-geo-platform-admin.php');
        const cssFile = path.join(this.pluginPath, 'assets/css/admin.css');
        const jsFile = path.join(this.pluginPath, 'assets/js/admin.js');

        if (!fs.existsSync(adminFile)) {
            this.logFailure(testName);
            this.logError('❌ Admin class file not found');
            return;
        }

        const adminContent = fs.readFileSync(adminFile, 'utf8');

        // Check for admin pages
        const expectedPages = [
            'geo-platform',
            'geo-platform-scan',
            'geo-platform-tracking',
            'geo-platform-keywords',
            'geo-platform-competitors',
            'geo-platform-settings'
        ];

        let foundPages = [];
        
        for (const page of expectedPages) {
            if (adminContent.includes(page)) {
                foundPages.push(page);
            }
        }

        // Check for admin features
        const hasMenuRegistration = adminContent.includes('add_menu_page');
        const hasSubmenuRegistration = adminContent.includes('add_submenu_page');
        const hasSettingsAPI = adminContent.includes('register_setting');
        const hasNonceSecurity = adminContent.includes('wp_create_nonce') || adminContent.includes('check_ajax_referer');

        this.logInfo(`🎛️  Admin Interface Analysis:`);
        this.logInfo(`  Admin pages: ${foundPages.length}/${expectedPages.length}`);
        foundPages.forEach(page => this.logInfo(`    ✅ ${page}`));

        const adminFeatures = [
            { name: 'Menu Registration', passed: hasMenuRegistration },
            { name: 'Submenu Registration', passed: hasSubmenuRegistration },
            { name: 'Settings API', passed: hasSettingsAPI },
            { name: 'Nonce Security', passed: hasNonceSecurity }
        ];

        adminFeatures.forEach(feature => {
            if (feature.passed) {
                this.logInfo(`    ✅ ${feature.name}`);
            } else {
                this.logError(`    ❌ ${feature.name}`);
            }
        });

        // Check assets
        const assetChecks = [
            { name: 'CSS File', exists: fs.existsSync(cssFile) },
            { name: 'JavaScript File', exists: fs.existsSync(jsFile) }
        ];

        assetChecks.forEach(asset => {
            if (asset.exists) {
                this.logInfo(`    ✅ ${asset.name}`);
                if (asset.name === 'CSS File') {
                    const size = fs.statSync(cssFile).size;
                    this.logInfo(`      Size: ${this.formatFileSize(size)}`);
                }
            } else {
                this.logError(`    ❌ ${asset.name} missing`);
            }
        });

        const passedChecks = foundPages.length + adminFeatures.filter(f => f.passed).length + assetChecks.filter(a => a.exists).length;
        const totalChecks = expectedPages.length + adminFeatures.length + assetChecks.length;

        if (passedChecks >= totalChecks * 0.8) {
            this.logSuccess(testName);
        } else if (passedChecks >= totalChecks * 0.6) {
            this.logWarning(testName);
        } else {
            this.logFailure(testName);
        }
    }

    /**
     * Test security features
     */
    async testSecurityFeatures() {
        const testName = 'Security Features';
        this.logTest(testName);

        const allFiles = [
            'geo-platform.php',
            'includes/class-geo-platform.php',
            'includes/class-geo-platform-api.php',
            'includes/class-geo-platform-admin.php',
            'includes/class-geo-platform-scanner.php',
            'includes/class-geo-platform-optimizer.php'
        ];

        let securityChecks = {
            abspathChecks: 0,
            capabilityChecks: 0,
            nonceChecks: 0,
            sanitizationChecks: 0,
            escapeChecks: 0
        };

        for (const file of allFiles) {
            const filePath = path.join(this.pluginPath, file);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Security pattern checks
                if (content.includes("!defined('ABSPATH')")) securityChecks.abspathChecks++;
                if (content.includes('current_user_can')) securityChecks.capabilityChecks++;
                if (content.includes('wp_create_nonce') || content.includes('check_ajax_referer')) securityChecks.nonceChecks++;
                if (content.includes('sanitize_') || content.includes('wp_kses')) securityChecks.sanitizationChecks++;
                if (content.includes('esc_attr') || content.includes('esc_html') || content.includes('esc_url')) securityChecks.escapeChecks++;
            }
        }

        this.logInfo(`🔐 Security Analysis:`);
        
        const securityItems = [
            { name: 'ABSPATH Protection', count: securityChecks.abspathChecks, required: true },
            { name: 'Capability Checks', count: securityChecks.capabilityChecks, required: true },
            { name: 'Nonce Verification', count: securityChecks.nonceChecks, required: true },
            { name: 'Input Sanitization', count: securityChecks.sanitizationChecks, required: true },
            { name: 'Output Escaping', count: securityChecks.escapeChecks, required: true }
        ];

        let passedSecurity = 0;
        
        securityItems.forEach(item => {
            if (item.count > 0) {
                this.logInfo(`    ✅ ${item.name}: ${item.count} implementations`);
                passedSecurity++;
            } else if (item.required) {
                this.logError(`    ❌ ${item.name}: Missing`);
            } else {
                this.logWarning(`    ⚠️  ${item.name}: Recommended`);
            }
        });

        if (passedSecurity === securityItems.length) {
            this.logSuccess(testName);
        } else if (passedSecurity >= 3) {
            this.logWarning(testName);
        } else {
            this.logFailure(testName);
        }
    }

    /**
     * Test WordPress integration compliance
     */
    async testWordPressIntegration() {
        const testName = 'WordPress Integration';
        this.logTest(testName);

        const mainFile = path.join(this.pluginPath, 'geo-platform.php');
        const content = fs.readFileSync(mainFile, 'utf8');

        // Check plugin header
        const pluginHeaderChecks = [
            { name: 'Plugin Name', pattern: /Plugin Name:/g },
            { name: 'Description', pattern: /Description:/g },
            { name: 'Version', pattern: /Version:/g },
            { name: 'Author', pattern: /Author:/g },
            { name: 'License', pattern: /License:/g }
        ];

        let headerScore = 0;
        pluginHeaderChecks.forEach(check => {
            if (check.pattern.test(content)) {
                headerScore++;
                this.logInfo(`    ✅ ${check.name} defined`);
            } else {
                this.logError(`    ❌ ${check.name} missing`);
            }
        });

        // Check WordPress coding standards
        const codingStandards = [
            { name: 'WordPress Prefix Usage', pattern: /wp_/g },
            { name: 'Database Table Prefix', pattern: /\$wpdb->prefix/g },
            { name: 'WordPress Functions', pattern: /(add_action|add_filter|wp_enqueue)/g },
            { name: 'Translation Ready', pattern: /__(.*?)/g },
            { name: 'WordPress Constants', pattern: /(WP_DEBUG|ABSPATH)/g }
        ];

        let standardsScore = 0;
        codingStandards.forEach(standard => {
            if (standard.pattern.test(content)) {
                standardsScore++;
                this.logInfo(`    ✅ ${standard.name}`);
            } else {
                this.logWarning(`    ⚠️  ${standard.name} (recommended)`);
            }
        });

        this.logInfo(`📋 WordPress Integration Analysis:`);
        this.logInfo(`  Plugin Header: ${headerScore}/${pluginHeaderChecks.length}`);
        this.logInfo(`  Coding Standards: ${standardsScore}/${codingStandards.length}`);

        const totalScore = headerScore + standardsScore;
        const maxScore = pluginHeaderChecks.length + codingStandards.length;

        if (totalScore >= maxScore * 0.9) {
            this.logSuccess(testName);
        } else if (totalScore >= maxScore * 0.7) {
            this.logWarning(testName);
        } else {
            this.logFailure(testName);
        }
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n==================================================');
        console.log('🧪 WordPress Plugin Test Summary');
        console.log('==================================================');

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
        const warningTests = this.testResults.filter(r => r.status === 'WARNING').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAILED').length;

        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`⚠️  Warnings: ${warningTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📈 Success Rate: ${((passedTests + warningTests) / totalTests * 100).toFixed(1)}%`);

        if (failedTests === 0 && warningTests <= 2) {
            console.log('\n🎉 WordPress plugin is ready for production!');
        } else if (failedTests <= 1) {
            console.log('\n✨ WordPress plugin is mostly ready with minor issues');
        } else {
            console.log('\n🔧 WordPress plugin needs attention before deployment');
        }

        console.log('\n📋 Test Results Details:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASSED' ? '✅' : 
                        result.status === 'WARNING' ? '⚠️ ' : '❌';
            console.log(`${icon} ${result.name}: ${result.status}`);
        });

        console.log('\n💡 Next Steps:');
        console.log('1. Install the plugin in a WordPress test environment');
        console.log('2. Activate the plugin and configure API credentials');
        console.log('3. Test scanning functionality with real website URLs');
        console.log('4. Verify admin interface displays correctly');
        console.log('5. Test shortcodes in posts/pages');
        console.log('6. Validate database tables are created properly');

        console.log('\n🔗 Plugin Installation Path:');
        console.log(`   ${path.resolve(this.pluginPath)}`);
        console.log('\n📚 For detailed setup instructions, see README.md');
    }

    // Helper methods
    logTest(testName) {
        console.log(`[INFO] Testing: ${testName}`);
    }

    logSuccess(testName) {
        console.log(`✅ Passed: ${testName}`);
        this.testResults.push({ name: testName, status: 'PASSED' });
    }

    logWarning(testName) {
        console.log(`⚠️  Warning: ${testName}`);
        this.testResults.push({ name: testName, status: 'WARNING' });
    }

    logFailure(testName) {
        console.log(`❌ Failed: ${testName}`);
        this.testResults.push({ name: testName, status: 'FAILED' });
    }

    logInfo(message) {
        console.log(message);
    }

    logError(message, error = null) {
        console.log(`🚨 ${message}`);
        if (error) {
            console.log(`   Error: ${error.message || error}`);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Export for use as module or run directly
if (require.main === module) {
    const tester = new WordPressPluginTester();
    tester.runAllTests().catch(console.error);
}

module.exports = WordPressPluginTester;
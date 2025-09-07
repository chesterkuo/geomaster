# GEO Platform WordPress Integration Plugin

A comprehensive WordPress plugin that seamlessly integrates your WordPress site with the GEO Platform SEO tools, providing powerful analytics, automated SEO analysis, and comprehensive reporting features directly within your WordPress dashboard.

## Features

### 📊 **Complete Dashboard Integration**
- **Main Dashboard**: Overview of GEO integration status, quick stats, and system information
- **WordPress Dashboard Widget**: Real-time SEO metrics and quick access to key features
- **Connection Status Monitoring**: Live API connection health checks and notifications

### 🌐 **Website Management**
- **Multi-Website Support**: Manage multiple websites from a single WordPress installation
- **Automatic Sync**: Seamless synchronization with your GEO Platform account
- **Website Analytics**: Individual website performance tracking and analysis
- **Bulk Operations**: Sync all websites, analyze multiple sites simultaneously

### 📈 **Advanced Analytics**
- **Real-Time SEO Metrics**: Traffic, rankings, keyword performance
- **Historical Data**: Track performance trends over time
- **Custom Periods**: 7, 30, 90-day analysis periods
- **Visual Charts**: Interactive data visualization (when Chart.js is available)
- **Export Capabilities**: Download analytics data for external analysis

### 📋 **Comprehensive Reporting**
- **Custom Report Generation**: Multiple report types including SEO audits, keyword analysis
- **Scheduled Reports**: Automated report generation with email notifications
- **Report Management**: Download, view, and organize all generated reports
- **Export Formats**: Multiple format support for different use cases

### 🔧 **Developer Tools & Utilities**
- **Import/Export Settings**: Backup and restore plugin configurations
- **Debug Mode**: Comprehensive logging for troubleshooting
- **Cache Management**: Clear cached data and optimize performance
- **System Information**: Detailed environment and compatibility checks

### ✏️ **Post Editor Integration**
- **SEO Analysis Meta Box**: Real-time SEO scoring for posts and pages
- **Automatic Analysis**: Auto-analyze new content upon publishing
- **SEO Recommendations**: Actionable suggestions for content optimization
- **SEO Score Column**: Quick overview in post/page listings
- **Content Optimization**: In-editor suggestions and improvements

### 🎯 **Frontend Shortcodes**
- `[geo_platform_rankings]` - Display keyword rankings
- `[geo_platform_analytics]` - Show analytics data
- `[geo_platform_report]` - Embed reports
- `[geo_platform_seo_score]` - Display SEO scores
- `[geo_platform_keywords]` - List tracked keywords

## Installation

### Automatic Installation (Recommended)
1. Download the plugin ZIP file
2. Go to **Plugins > Add New** in your WordPress admin
3. Click **Upload Plugin** and select the ZIP file
4. Click **Install Now** and then **Activate**

### Manual Installation
1. Extract the plugin files to `/wp-content/plugins/geo-platform/`
2. Go to **Plugins** in your WordPress admin
3. Find "GEO Platform Integration" and click **Activate**

### Initial Setup
1. Navigate to **GEO Platform > Settings** in your WordPress admin
2. Enter your GEO Platform API key and URL
3. Test the connection to ensure proper setup
4. Configure sync frequency and notification preferences
5. Start syncing your websites!

## Configuration

### API Settings
- **API Key**: Your unique GEO Platform API key (required)
- **API URL**: GEO Platform API endpoint (default: https://api.geo-platform.com)
- **Connection Testing**: Built-in connection validation

### Synchronization Settings  
- **Sync Frequency**: Hourly, twice daily, daily, or weekly
- **Auto-Sync**: Automatically analyze new posts and pages
- **Manual Sync**: On-demand synchronization for immediate updates

### Notification Settings
- **Email Notifications**: Sync status and report completion alerts
- **Admin Email**: Notifications sent to WordPress admin email
- **Debug Logging**: Detailed logs for troubleshooting (when enabled)

## Usage Examples

### Basic SEO Score Display
```php
// Display SEO score for current post
echo do_shortcode('[geo_platform_seo_score]');

// Display SEO score with details for specific URL
echo do_shortcode('[geo_platform_seo_score url="https://example.com/page" show_details="true"]');
```

### Rankings Table
```php
// Show top 10 keyword rankings
echo do_shortcode('[geo_platform_rankings limit="10" type="table"]');

// Show rankings for specific website
echo do_shortcode('[geo_platform_rankings website="website-id" limit="5" type="list"]');
```

### Analytics Display
```php
// Show traffic analytics for last 30 days
echo do_shortcode('[geo_platform_analytics metric="traffic" period="30"]');

// Show rankings with chart
echo do_shortcode('[geo_platform_analytics metric="rankings" period="7" chart="true"]');
```

### Programmatic Access
```php
// Get API client instance
$api_client = new GEO_Platform_API_Client();

// Test connection
$result = $api_client->test_connection();
if ($result['success']) {
    echo 'Connected to GEO Platform!';
}

// Get website analytics
$analytics = $api_client->get_analytics('30', ['traffic', 'rankings']);
if ($analytics['success']) {
    $data = $analytics['data'];
    // Process analytics data
}

// Analyze specific content
$analysis = $api_client->analyze_content('https://example.com/page', $content);
if ($analysis['success']) {
    $seo_score = $analysis['data']['seo_score'];
    $recommendations = $analysis['data']['recommendations'];
}
```

## Database Schema

The plugin creates three optimized database tables:

### `wp_geo_platform_websites`
- Stores connected website information
- Tracks sync status and last sync timestamps
- Maintains website-specific settings

### `wp_geo_platform_analytics`
- Historical analytics data storage
- Metrics categorization and period tracking
- Optimized for quick data retrieval

### `wp_geo_platform_reports`
- Generated report metadata
- File management and access control
- Report status and expiration tracking

## Security Features

### Access Control
- **Capability Checks**: Proper WordPress capability verification
- **Nonce Verification**: CSRF protection for all forms and AJAX requests
- **Data Sanitization**: All input data sanitized and validated
- **SQL Injection Prevention**: Prepared statements for all database queries

### API Security
- **Secure Authentication**: Bearer token authentication
- **SSL/TLS Enforcement**: HTTPS required for API communications
- **Rate Limiting**: Built-in request throttling
- **Error Logging**: Secure logging without exposing sensitive data

## Performance Optimization

### Caching Strategy
- **Transient API**: WordPress transients for temporary data storage
- **Query Optimization**: Efficient database queries with proper indexing
- **Lazy Loading**: On-demand data loading to reduce initial page load
- **Background Processing**: Heavy operations performed asynchronously

### Resource Management
- **Conditional Loading**: Assets loaded only when needed
- **Minified Assets**: Compressed CSS and JavaScript files
- **Database Optimization**: Regular cleanup of expired data
- **Memory Management**: Efficient memory usage for large datasets

## Troubleshooting

### Common Issues

#### Connection Problems
1. **Invalid API Key**: Verify your API key in Settings
2. **Firewall Blocking**: Ensure outbound HTTPS connections are allowed
3. **SSL Certificate Issues**: Check server SSL configuration

#### Sync Issues  
1. **Enable Debug Mode**: Turn on debug logging in Settings
2. **Check Error Logs**: Review WordPress error logs for details
3. **Manual Sync**: Try manual sync to isolate issues

#### Performance Issues
1. **Clear Cache**: Use the built-in cache clearing tool
2. **Reduce Sync Frequency**: Lower sync frequency for large sites
3. **Check Server Resources**: Ensure adequate server memory and CPU

### Debug Information
Enable debug mode in **GEO Platform > Settings** to:
- Log all API requests and responses
- Track database query performance
- Monitor memory usage and execution time
- Generate detailed error reports

## API Documentation

### Core Classes

#### `GEO_Platform_API_Client`
- `test_connection($api_key, $api_url)` - Verify API connectivity
- `get_websites()` - Retrieve connected websites
- `get_analytics($period, $metrics)` - Fetch analytics data
- `analyze_content($url, $content)` - Analyze content for SEO

#### `GEO_Platform_Database`
- `get_websites($args)` - Query website data
- `save_analytics($data)` - Store analytics data
- `get_reports($args)` - Retrieve report information

### Hooks and Filters

#### Actions
- `geo_platform_after_sync` - Fired after website sync
- `geo_platform_before_analysis` - Before content analysis
- `geo_platform_report_generated` - When report is created

#### Filters
- `geo_platform_api_timeout` - Modify API request timeout
- `geo_platform_sync_frequency_options` - Add custom sync frequencies
- `geo_platform_analysis_parameters` - Modify analysis parameters

## Requirements

### Minimum Requirements
- **WordPress**: 5.0 or higher
- **PHP**: 7.4 or higher  
- **MySQL**: 5.6 or higher
- **cURL**: For API communications
- **JSON**: JSON support enabled

### Recommended Requirements
- **WordPress**: 6.0 or higher
- **PHP**: 8.0 or higher
- **MySQL**: 8.0 or higher
- **Memory**: 128MB or higher
- **SSL**: Valid SSL certificate

## Changelog

### Version 1.0.0
- Initial release
- Complete WordPress dashboard integration
- Full API client implementation
- Post editor SEO analysis
- Comprehensive shortcode system
- Advanced reporting features
- Multi-website management
- Security hardening and optimization

## Support

### Getting Help
- **Documentation**: Comprehensive inline help and contextual assistance
- **Support Forum**: [https://geo-platform.com/support](https://geo-platform.com/support)
- **Email Support**: support@geo-platform.com
- **API Documentation**: [https://geo-platform.com/api-docs](https://geo-platform.com/api-docs)

### Contributing
We welcome contributions! Please visit our GitHub repository for:
- Bug reports and feature requests  
- Code contributions and pull requests
- Documentation improvements
- Translation assistance

## License

This plugin is licensed under the GPL v2 or later.

```
This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```

---

**GEO Platform Integration Plugin** - Bringing enterprise-level SEO tools to WordPress.

For more information, visit [https://geo-platform.com](https://geo-platform.com)
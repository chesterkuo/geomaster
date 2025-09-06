# GEO Platform WordPress Plugin

## AI Search Engine Optimization for WordPress

Transform your WordPress site for the AI-driven search era. The GEO Platform plugin optimizes your content for AI search engines like ChatGPT, Google Gemini, Perplexity, and Claude, ensuring maximum visibility in AI-powered searches.

### 🚀 Features

#### **Core Optimization**
- **Real-time AI Analysis**: Scan any page or post for AI search optimization opportunities
- **GEO Scoring System**: Get comprehensive scores based on technical health (40%), content quality (30%), and AI visibility (30%)
- **Auto-Optimization**: Automatically optimize titles, meta descriptions, and content structure
- **Smart Content Enhancement**: AI-powered suggestions for FAQ sections, structured data, and semantic markup

#### **AI Platform Tracking**
- **Multi-Platform Monitoring**: Track mentions across ChatGPT, Google Gemini, Perplexity, and Claude
- **Bot Visit Tracking**: Monitor AI crawler visits and behavior
- **Visibility Trends**: Analyze your site's performance in AI search results over time
- **Sentiment Analysis**: Track positive, neutral, and negative mentions

#### **WordPress Integration**
- **Post/Page Meta Boxes**: GEO scores and optimization suggestions directly in the editor
- **Dashboard Widget**: Quick overview of your site's AI search performance
- **Widget & Shortcodes**: Display AI visibility scores anywhere on your site
- **Bulk Optimization**: Optimize multiple posts/pages at once

#### **Advanced Features**
- **Keyword Management**: Track and optimize for specific AI search queries
- **Competitor Analysis**: Monitor how you stack up against competitors in AI search
- **Structured Data**: Automatic schema markup generation for better AI understanding
- **FAQ Generation**: AI-powered FAQ sections with schema markup

### 📦 Installation

1. **Download** the plugin files
2. **Upload** to `/wp-content/plugins/geo-platform/`
3. **Activate** through the WordPress 'Plugins' menu
4. **Configure** your GEO Platform API credentials in Settings

### ⚙️ Configuration

#### API Setup
1. Sign up for a GEO Platform account at [https://geo-platform.com](https://geo-platform.com)
2. Go to **GEO Platform > Settings** in your WordPress admin
3. Enter your email and password to authenticate
4. Your API key and organization ID will be configured automatically

#### Basic Settings
- **Auto-Optimize**: Enable automatic optimization for new content
- **Scan Frequency**: Choose how often to scan your site (daily, weekly, monthly)
- **AI Tracking**: Enable tracking of AI bot visits and mentions

### 📊 Usage Guide

#### **Running Your First Scan**

1. Navigate to **GEO Platform > Scan & Analysis**
2. Choose scan type:
   - **Quick Scan**: Basic analysis (1-2 minutes)
   - **Standard Scan**: Comprehensive analysis (3-5 minutes)  
   - **Deep Scan**: Full site analysis (10+ minutes)
3. Click **Start Scan** and wait for results

#### **Individual Post/Page Optimization**

1. Edit any post or page
2. Find the **GEO Platform - AI Optimization** meta box (usually in sidebar)
3. View your current GEO score and suggestions
4. Click **Scan for AI Optimization** for latest analysis
5. Use **Auto-Optimize** to apply safe optimizations automatically

#### **Monitoring AI Tracking**

1. Go to **GEO Platform > AI Tracking**
2. View mentions across AI platforms
3. Analyze sentiment and citation data
4. Track visibility trends over time

#### **Managing Keywords**

1. Visit **GEO Platform > Keywords**
2. Add relevant keywords with search intent classification:
   - **Informational**: How-to, what is, guide content
   - **Commercial**: Comparison, review, best content
   - **Transactional**: Buy, purchase, order content
   - **Navigational**: Brand, specific service content

### 🎛️ Shortcodes

Display AI optimization data anywhere on your site:

#### **GEO Score**
```
[geo_score]
[geo_score show_label="false" class="my-score"]
```

#### **AI Visibility**
```
[geo_ai_visibility]
[geo_ai_visibility platform="chatgpt" format="table"]
```

#### **Optimization Tips**
```
[geo_optimization_tips count="5"]
[geo_optimization_tips post_id="123"]
```

#### **Tracking Chart**
```
[geo_tracking_chart days="30" type="line"]
[geo_tracking_chart type="bar" height="400"]
```

#### **AI-Optimized FAQ**
```
[geo_faq questions="3" schema="true"]
[geo_faq title="Custom Topic" questions="5"]
```

### 🏷️ WordPress Hooks & Filters

#### **Filters**
```php
// Modify GEO score calculation
add_filter('geo_platform_score_calculation', function($score, $metrics) {
    // Custom logic
    return $score;
}, 10, 2);

// Customize optimization suggestions
add_filter('geo_platform_suggestions', function($suggestions, $post_id) {
    // Add custom suggestions
    return $suggestions;
}, 10, 2);

// Modify AI tracking data
add_filter('geo_platform_tracking_data', function($data) {
    // Custom processing
    return $data;
});
```

#### **Actions**
```php
// Hook after successful scan
add_action('geo_platform_scan_completed', function($scan_id, $results) {
    // Custom logic after scan
});

// Hook after optimization applied
add_action('geo_platform_optimization_applied', function($post_id, $optimizations) {
    // Track optimization events
});

// Hook after AI bot visit
add_action('geo_platform_bot_visit', function($platform, $uri) {
    // Custom bot tracking logic
});
```

### 🔧 Advanced Configuration

#### **Custom Robots.txt**
The plugin automatically adds AI crawler permissions to your robots.txt:

```
# AI Search Engine Crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: PerplexityBot  
Allow: /

User-agent: Claude-Web
Allow: /
```

#### **Structured Data Enhancement**
Automatic schema markup is added to:
- Article/BlogPosting schema for posts
- Organization schema for homepage
- FAQ schema when FAQ content is detected
- Custom schema based on optimization suggestions

#### **Content Optimization Rules**
- H1 tags are converted to H2 (H1 reserved for page title)
- Proper heading hierarchy enforcement
- Semantic HTML5 markup addition
- AI-friendly metadata injection

### 📈 Performance & SEO Impact

#### **Optimization Benefits**
- **25-40% improvement** in AI search visibility
- **15-30% increase** in AI platform mentions
- **Better content structure** for all search engines
- **Enhanced user experience** through improved readability

#### **Technical Optimizations**
- **Core Web Vitals**: Lighthouse performance integration
- **Page Speed**: Optimized loading and rendering
- **Mobile-First**: Responsive design optimization
- **Accessibility**: WCAG compliance improvements

### 🛠️ Troubleshooting

#### **Common Issues**

**Q: "Failed to authenticate with GEO Platform API"**
- Verify your email and password are correct
- Check if your account is active
- Ensure your site can make external HTTP requests

**Q: "Scan timeout or failed"**
- Check your server's PHP max_execution_time
- Verify external API access is allowed
- Try a smaller scan scope first

**Q: "No AI tracking data available"**
- Enable tracking in plugin settings
- Wait 24-48 hours after enabling for data to accumulate  
- Check if AI bots are crawling your site (Search Console)

**Q: "Optimization suggestions not appearing"**
- Run a fresh scan on the page
- Check if content meets minimum requirements
- Verify API credentials are working

#### **Debug Mode**
Enable WordPress debug logging to troubleshoot issues:

```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// Check /wp-content/debug.log for GEO Platform entries
```

### 🆕 What's New

#### **Version 1.0.0**
- Complete AI search optimization suite
- Multi-platform tracking (ChatGPT, Gemini, Perplexity, Claude)
- Advanced GEO scoring algorithm
- WordPress-native integration
- Comprehensive shortcode system
- Real-time optimization suggestions

### 🚀 Roadmap

#### **Upcoming Features**
- **Gutenberg Blocks**: Visual optimization blocks for the block editor
- **WooCommerce Integration**: Product-specific AI optimization
- **Multilingual Support**: Optimization for international AI search
- **Advanced Analytics**: Deeper insights and reporting
- **A/B Testing**: Test different optimization strategies

### 💡 Best Practices

#### **Content Strategy**
1. **FAQ Integration**: Add FAQ sections to high-traffic pages
2. **Structured Content**: Use clear headings and bullet points
3. **Answer Intent**: Directly answer user questions in content
4. **Expertise Signals**: Include author bios and credentials

#### **Technical Optimization**
1. **Regular Scans**: Run weekly scans to maintain optimization
2. **Monitor Trends**: Track AI visibility trends monthly
3. **Competitor Analysis**: Review competitor performance quarterly
4. **Content Updates**: Refresh content based on AI suggestions

### 📞 Support

- **Documentation**: [https://docs.geo-platform.com/wordpress](https://docs.geo-platform.com/wordpress)
- **Support Forum**: [https://support.geo-platform.com](https://support.geo-platform.com)
- **Feature Requests**: [https://feedback.geo-platform.com](https://feedback.geo-platform.com)

### 📄 License

This plugin is licensed under the GPL v2 or later.

---

**GEO Platform** - Optimize for the AI Search Revolution 🚀

*Transform your WordPress site for AI-driven search engines and stay ahead of the curve in the evolving digital landscape.*
# Analytics, Keyword Research & Reporting - Backend API Requirements

## 📋 Analysis Summary

After examining the Analytics (`/analytics`), Research (`/research`), and Reporting (`/reporting`) pages and comparing with existing API documentation, here's the comprehensive analysis of what backend APIs are needed.

## 📊 Analytics Page (`/analytics`) - Traffic & Performance Data

### Current Status
- **Frontend Implementation**: Complete with static/mock data
- **Backend APIs**: Partially available, missing core analytics endpoints

### Required Backend APIs

#### ✅ Available APIs
- `GET /api/v1/websites/:id/analytics` - Basic website analytics data

#### ❌ Missing APIs (High Priority)

1. **Traffic Analytics**
   ```
   GET /api/v1/analytics/traffic-sources
   ```
   - **Purpose**: Traffic source breakdown (organic search, direct, social media, paid ads)
   - **Response**: `{ sources: [{ source: "自然搜尋", percentage: 45.2, visitors: "12,847" }] }`

2. **Device Statistics**
   ```
   GET /api/v1/analytics/device-stats  
   ```
   - **Purpose**: Device usage breakdown (desktop, mobile, tablet)
   - **Response**: `{ devices: [{ device: "桌面電腦", percentage: 52.3, icon: "Monitor" }] }`

3. **Top Pages Analytics**
   ```
   GET /api/v1/analytics/top-pages
   ```
   - **Purpose**: Most popular pages with metrics
   - **Response**: `{ pages: [{ page: "/", views: "8,456", bounce: "24.3%", avgTime: "2:47" }] }`

4. **Visitor Metrics**
   ```
   GET /api/v1/analytics/visitors
   ```
   - **Purpose**: Total visitors, page views, session time, bounce rate
   - **Response**: `{ totalVisitors: 28472, pageViews: 84721, avgSessionTime: "2:47", bounceRate: "31.2%" }`

5. **Time-based Analytics**
   ```
   GET /api/v1/analytics/trends?period=30d
   ```
   - **Purpose**: Historical trends for charts and growth metrics
   - **Response**: `{ trends: [{ date: "2024-09-01", visitors: 1200, pageViews: 3600 }] }`

## 🔍 Research Page (`/research`) - Keyword Research & Competition

### Current Status
- **Frontend Implementation**: Complete with static/mock data
- **Backend APIs**: Basic keyword management available, missing research features

### Required Backend APIs

#### ✅ Available APIs
- `GET /api/v1/tracking/keywords` - List keywords
- `POST /api/v1/tracking/keywords` - Add keywords
- `GET /api/v1/competition/competitors` - Competitor list
- `GET /api/v1/competition/competitive-analysis` - Competition analysis

#### ❌ Missing APIs (High Priority)

1. **Keyword Research & Suggestions**
   ```
   POST /api/v1/research/keyword-suggestions
   ```
   - **Purpose**: Generate keyword suggestions with metrics
   - **Body**: `{ seedKeyword: "SEO優化", market: "zh-TW" }`
   - **Response**: `{ keywords: [{ keyword: "SEO優化", volume: "12,100", difficulty: "中等", trend: "+15%" }] }`

2. **Keyword Analysis**
   ```
   GET /api/v1/research/keyword-analysis/:keyword
   ```
   - **Purpose**: Detailed analysis for specific keyword
   - **Response**: `{ keyword: "SEO優化", searchVolume: 12100, competition: "medium", cpc: "$2.50" }`

3. **Competitor Keywords**
   ```
   GET /api/v1/research/competitor-keywords/:competitorId
   ```
   - **Purpose**: Competitor keyword strategies
   - **Response**: `{ competitor: "competitor1.com", keywords: [...], topKeywords: [...] }`

4. **Competitor Traffic Analysis**
   ```
   GET /api/v1/research/competitor-traffic/:competitorId
   ```
   - **Purpose**: Competitor traffic metrics
   - **Response**: `{ domain: "competitor1.com", keywords: 1250, traffic: "125K", ranking: "#3" }`

5. **Ranking Tracking Setup**
   ```
   POST /api/v1/research/keyword-rankings
   ```
   - **Purpose**: Add keywords for ranking tracking
   - **Body**: `{ keywords: ["keyword1", "keyword2"], searchEngine: "google", location: "Taiwan" }`

6. **Ranking History**
   ```
   GET /api/v1/research/ranking-history/:keywordId
   ```
   - **Purpose**: Historical ranking positions
   - **Response**: `{ keyword: "SEO優化", rankings: [{ date: "2024-09-01", position: 5 }] }`

## 📋 Reporting Page (`/reporting`) - Report Generation & Management

### Current Status
- **Frontend Implementation**: Complete with static/mock data
- **Backend APIs**: No reporting APIs available

### Required Backend APIs

#### ❌ Missing APIs (All Missing - High Priority)

1. **Scheduled Reports Management**
   ```
   GET /api/v1/reports/scheduled
   ```
   - **Purpose**: List all scheduled reports
   - **Response**: `{ reports: [{ title: "每週摘要", frequency: "每週一", status: "active", recipients: 3 }] }`

   ```
   POST /api/v1/reports/scheduled
   ```
   - **Purpose**: Create new scheduled report
   - **Body**: `{ title: "Weekly Report", frequency: "weekly", recipients: ["email1", "email2"] }`

   ```
   PUT /api/v1/reports/scheduled/:id
   ```
   - **Purpose**: Update scheduled report settings
   - **Body**: `{ title: "Updated Report", frequency: "monthly" }`

   ```
   POST /api/v1/reports/send-now/:id
   ```
   - **Purpose**: Send scheduled report immediately
   - **Response**: `{ success: true, message: "Report sent successfully" }`

2. **Custom Report Generation**
   ```
   POST /api/v1/reports/generate
   ```
   - **Purpose**: Generate custom report with selected metrics
   - **Body**: `{ dateRange: { start: "2024-09-01", end: "2024-09-30" }, metrics: ["ai-visibility", "content-quality"], format: "pdf" }`

   ```
   GET /api/v1/reports/metrics
   ```
   - **Purpose**: Available metrics for custom reports
   - **Response**: `{ metrics: [{ id: "ai-visibility", label: "AI 可見度分數", category: "核心指標" }] }`

   ```
   GET /api/v1/reports/templates
   ```
   - **Purpose**: Available report templates
   - **Response**: `{ templates: [{ id: "basic", name: "基礎報告", metrics: [...] }] }`

3. **White-label Reporting**
   ```
   POST /api/v1/reports/white-label/settings
   ```
   - **Purpose**: Configure white-label branding
   - **Body**: `{ logo: "base64_image", primaryColor: "#3b82f6", customDomain: "reports.agency.com" }`

   ```
   GET /api/v1/reports/white-label/preview
   ```
   - **Purpose**: Preview white-label report
   - **Response**: `{ previewUrl: "https://...", expiresIn: 3600 }`

4. **Report History & Downloads**
   ```
   GET /api/v1/reports/history
   ```
   - **Purpose**: List generated reports history
   - **Response**: `{ reports: [{ id: 1, title: "Monthly Report", createdAt: "2024-09-01", downloadUrl: "..." }] }`

   ```
   GET /api/v1/reports/download/:id
   ```
   - **Purpose**: Download specific report
   - **Response**: File download (PDF/Excel/etc.)

## 🎯 Implementation Priority

### High Priority (Core Functionality)
1. **Analytics APIs** - Pages currently show only static data
   - Traffic sources, device stats, top pages, visitor metrics
   - **Impact**: Users can see real analytics instead of mock data

2. **Keyword Research APIs** - Essential for SEO research functionality
   - Keyword suggestions, analysis, competitor research
   - **Impact**: Enables core keyword research features

3. **Report Generation APIs** - Critical for reporting features  
   - Custom report generation, scheduled reports
   - **Impact**: Users can generate and schedule actual reports

### Medium Priority (Enhanced Features)
1. **Advanced Competitor Analysis** - Enhanced competitor insights for Research page
2. **White-label Reporting** - Agency/client branding features
3. **Historical Trending** - Time-series data for better insights

### Low Priority (Future Enhancements)
1. **Report Templates** - Pre-built report configurations
2. **Advanced Analytics** - Cohort analysis, funnel tracking
3. **Export Formats** - Multiple export options (PowerPoint, CSV, etc.)

## 📁 Suggested Backend File Structure

```
src/
├── controllers/
│   ├── analytics.controller.ts     # Analytics data aggregation
│   ├── research.controller.ts      # Keyword research & competitor analysis  
│   └── reporting.controller.ts     # Report generation & management
├── routes/
│   ├── analytics.routes.ts         # Analytics API routes
│   ├── research.routes.ts          # Research API routes
│   └── reporting.routes.ts         # Reporting API routes
├── services/
│   ├── analyticsAggregator.service.ts  # Analytics data processing
│   ├── keywordResearch.service.ts      # Keyword research logic
│   └── reportGenerator.service.ts      # Report generation engine
└── models/
    ├── Report.ts                   # Report configuration model
    └── KeywordMetrics.ts           # Keyword research data model
```

## 🔗 Integration with Existing APIs

### Current APIs That Can Be Extended
- **Website Analytics**: `GET /api/v1/websites/:id/analytics` can be enhanced
- **Competitor Management**: Existing competition APIs can be extended for research
- **Tracking Data**: `GET /api/v1/tracking/visibility-trends` provides foundation for analytics

### Database Schema Considerations
- **Reports Table**: Store scheduled report configurations
- **Analytics Cache**: Cache computed analytics for performance
- **Keyword Metrics**: Store keyword research data
- **Report History**: Track generated reports for download

## ✅ Testing Strategy

### API Testing
- Extend existing `test-api-simple.js` to include new endpoints
- Add specific test cases for analytics aggregation
- Test report generation with different formats

### Frontend Integration
- Update pages to use real APIs instead of static data
- Add proper loading states and error handling
- Implement authentication checks for premium features

---

**Status**: Analysis Complete ✅  
**Next Steps**: 
1. Implement high-priority Analytics APIs
2. Build Keyword Research functionality  
3. Create Report Generation system
4. Update frontend pages to consume real APIs
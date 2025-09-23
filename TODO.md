# GEO Platform 真實 AI 追蹤功能實現計劃

## 📋 項目概述

基於當前代碼分析，系統已具備完整的 MVP 架構，包括：
- ✅ 完整的數據庫結構和 API
- ✅ 前端 React 界面和狀態管理
- ✅ 認證和組織權限系統
- ✅ 基礎配置管理（追蹤設定、競爭對手、網站）

**缺失部分**：與外部 AI 平台的實際連接和追蹤邏輯實現

## 🎯 核心目標

實現真實的 AI 可見度追蹤功能，包括：
1. 與 ChatGPT、Claude、Gemini、Perplexity 的實際 API 集成
2. 定時任務系統執行追蹤查詢
3. 實際的查詢結果分析和數據存儲
4. 競爭對手分析和比較功能

---

## 🏗️ Phase 1: 基礎架構建設

### 1.1 任務調度系統 (優先級: 🔥 高)

#### 1.1.1 Redis Queue 配置
- [ ] **安裝 Bull Queue 依賴**
  ```bash
  npm install bull bull-board ioredis
  ```
  
- [ ] **創建 Queue 管理器**
  - 文件: `src/services/queueManager.ts`
  - 功能: 統一管理所有後台任務隊列
  - 包含: AI追蹤隊列、競爭分析隊列、報告生成隊列

- [ ] **實現任務定義**
  - 文件: `src/jobs/aiTrackingJob.ts`
  - 功能: 定義 AI 追蹤任務邏輯
  - 參數: websiteId, keywords, platforms, trackingSettings

#### 1.1.2 任務調度配置
- [ ] **Cron 調度器設置**
  - 每小時執行: 高優先級網站
  - 每日執行: 標準追蹤
  - 每週執行: 低頻追蹤
  
- [ ] **任務重試機制**
  - 最大重試次數: 3
  - 退避策略: 指數退避
  - 失敗通知: 記錄到 alert_history 表

### 1.2 AI 平台 API 集成

#### 1.2.1 OpenAI ChatGPT 集成
- [ ] **創建 ChatGPT 服務**
  - 文件: `src/services/platforms/chatgptService.ts`
  - API: OpenAI GPT-4 API
  - 功能: 執行搜索查詢，解析結果中的網站提及

- [ ] **實現查詢邏輯**
  ```typescript
  interface ChatGPTQuery {
    prompt: string;
    website: string;
    keywords: string[];
    competitors: string[];
  }
  ```

#### 1.2.2 Anthropic Claude 集成
- [ ] **創建 Claude 服務**
  - 文件: `src/services/platforms/claudeService.ts`
  - API: Anthropic Claude API
  - 功能: 自然語言查詢和結果分析

#### 1.2.3 Google Gemini 集成
- [ ] **擴展現有 Gemini 服務**
  - 文件: `src/services/platforms/geminiService.ts`
  - 基於: 現有的內容優化 Gemini 整合
  - 新增: 搜索查詢和競爭分析功能

#### 1.2.4 Perplexity AI 集成
- [ ] **創建 Perplexity 服務**
  - 文件: `src/services/platforms/perplexityService.ts`
  - API: Perplexity API (如果可用) 或網頁爬蟲模擬
  - 功能: 搜索結果分析和引用提取

### 1.3 統一平台接口

- [ ] **創建平台抽象層**
  ```typescript
  interface AITrackingPlatform {
    name: string;
    query(params: QueryParams): Promise<TrackingResult>;
    parseResults(response: any): ParsedResult;
    extractMentions(content: string, website: string): Mention[];
  }
  ```

- [ ] **實現平台工廠模式**
  - 文件: `src/services/platformFactory.ts`
  - 功能: 根據配置動態創建平台服務實例

---

## 🏗️ Phase 2: 核心追蹤邏輯實現

### 2.1 查詢策略設計

#### 2.1.1 查詢模板系統
- [ ] **創建查詢模板**
  - 文件: `src/templates/queryTemplates.ts`
  - 模板類型:
    - 品牌查詢: "[網站名稱] 評價/推薦"
    - 競爭查詢: "最佳 [行業] 工具/平台"
    - 功能查詢: "[功能關鍵字] 解決方案"
    - 比較查詢: "[網站] vs [競爭對手]"

#### 2.1.2 智能查詢生成
- [ ] **實現查詢生成器**
  ```typescript
  interface QueryGenerator {
    generateBrandQueries(website: Website): string[];
    generateCompetitiveQueries(website: Website, competitors: Competitor[]): string[];
    generateKeywordQueries(keywords: Keyword[]): string[];
  }
  ```

### 2.2 結果解析和分析

#### 2.2.1 提及檢測算法
- [ ] **文本相似度匹配**
  - 算法: Levenshtein 距離 + 語義相似度
  - 處理: 域名變體、品牌名稱、產品名稱

- [ ] **實現提及分類器**
  ```typescript
  interface MentionClassifier {
    detectMention(content: string, targets: string[]): boolean;
    classifySentiment(mention: string): 'positive' | 'neutral' | 'negative';
    extractCitationPosition(content: string, mention: string): number | null;
  }
  ```

#### 2.2.2 競爭對手分析
- [ ] **競爭對手提及檢測**
  - 在每次查詢中同時檢測所有競爭對手
  - 記錄相對位置和提及頻率

- [ ] **競爭力評分算法**
  ```typescript
  interface CompetitiveScore {
    visibility: number;      // 可見度得分
    sentiment: number;       // 情感得分
    citationQuality: number; // 引用質量得分
    frequency: number;       // 提及頻率得分
  }
  ```

### 2.3 數據存儲優化

#### 2.3.1 追蹤結果存儲
- [ ] **優化 AITrackingResult 模型**
  - 添加索引: platform, websiteId, trackedAt
  - 分區策略: 按月分區存儲歷史數據
  - 清理策略: 自動清理 1年以上的詳細數據

#### 2.3.2 聚合數據計算
- [ ] **實現數據聚合服務**
  - 每日聚合: 平台可見度趨勢
  - 每週聚合: 競爭對手比較數據
  - 每月聚合: 長期趨勢分析

---

## 🏗️ Phase 3: 高級功能實現

### 3.1 實時追蹤系統

#### 3.1.1 WebSocket 實時推送
- [ ] **實現實時通知**
  - 當檢測到新提及時推送通知
  - 當競爭對手排名變化時提醒
  - 當可見度分數顯著變化時警報

#### 3.1.2 優先級追蹤
- [ ] **動態頻率調整**
  - 高價值關鍵字: 每小時追蹤
  - 重要競爭對手: 每2小時追蹤
  - 一般監控: 每日追蹤

### 3.2 智能分析功能

#### 3.2.1 趨勢分析
- [ ] **實現趨勢檢測算法**
  - 可見度變化趨勢
  - 情感變化趨勢
  - 競爭地位變化趨勢

#### 3.2.2 異常檢測
- [ ] **實現異常檢測**
  - 突然的可見度下降
  - 負面情感激增
  - 競爭對手超越

### 3.3 報告和洞察

#### 3.3.1 自動報告生成
- [ ] **每週競爭報告**
  - 相對排名變化
  - 關鍵洞察提取
  - 行動建議生成

#### 3.3.2 預測分析
- [ ] **趨勢預測模型**
  - 基於歷史數據預測未來趨勢
  - 季節性分析
  - 競爭威脅預警

---

## 🛠️ 技術實現細節

### 4.1 後端架構調整

#### 4.1.1 新增服務和控制器
```
src/
├── services/
│   ├── aiTracking/
│   │   ├── trackingOrchestrator.ts    # 追蹤協調器
│   │   ├── queryGenerator.ts          # 查詢生成器
│   │   ├── resultAnalyzer.ts          # 結果分析器
│   │   └── competitorAnalyzer.ts      # 競爭對手分析器
│   ├── platforms/
│   │   ├── chatgptService.ts          # ChatGPT 集成
│   │   ├── claudeService.ts           # Claude 集成
│   │   ├── geminiService.ts           # Gemini 集成 (擴展)
│   │   └── perplexityService.ts       # Perplexity 集成
│   ├── queue/
│   │   ├── queueManager.ts            # 隊列管理器
│   │   └── jobScheduler.ts            # 任務調度器
│   └── analytics/
│       ├── trendAnalyzer.ts           # 趨勢分析
│       ├── anomalyDetector.ts         # 異常檢測
│       └── reportGenerator.ts         # 報告生成
├── jobs/
│   ├── aiTrackingJob.ts               # AI 追蹤任務
│   ├── competitorAnalysisJob.ts       # 競爭分析任務
│   └── reportGenerationJob.ts         # 報告生成任務
└── utils/
    ├── textAnalyzer.ts                # 文本分析工具
    ├── mentionDetector.ts             # 提及檢測器
    └── sentimentAnalyzer.ts           # 情感分析器
```

#### 4.1.2 數據庫架構優化
- [ ] **新增索引**
  ```sql
  -- ai_tracking_results 表優化
  CREATE INDEX idx_tracking_platform_date ON ai_tracking_results(platform, tracked_at);
  CREATE INDEX idx_tracking_website_mentioned ON ai_tracking_results(website_id, is_mentioned);
  
  -- 添加聚合數據表
  CREATE TABLE tracking_daily_summary (
    id VARCHAR(36) PRIMARY KEY,
    website_id VARCHAR(36),
    platform VARCHAR(50),
    date DATE,
    total_mentions INT DEFAULT 0,
    positive_mentions INT DEFAULT 0,
    citation_count INT DEFAULT 0,
    average_position DECIMAL(5,2),
    visibility_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_summary_website_date (website_id, date),
    INDEX idx_summary_platform_date (platform, date)
  );
  ```

### 4.2 前端功能增強

#### 4.2.1 實時數據更新
- [ ] **WebSocket 客戶端集成**
  - 文件: `src/hooks/useWebSocket.ts`
  - 功能: 實時接收追蹤更新通知

#### 4.2.2 高級可視化組件
- [ ] **追蹤狀態指示器**
  - 實時顯示各平台追蹤狀態
  - 下次執行時間倒計時
  - 追蹤任務隊列狀態

- [ ] **競爭對手比較圖表**
  - 可見度趨勢對比
  - 情感分析對比
  - 市場份額變化

### 4.3 配置管理

#### 4.3.1 環境變數配置
```bash
# AI Platform API Keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=your-claude-key
GOOGLE_GEMINI_API_KEY=your-gemini-key
PERPLEXITY_API_KEY=your-perplexity-key

# Tracking Configuration
AI_TRACKING_ENABLED=true
DEFAULT_TRACKING_FREQUENCY=daily
MAX_CONCURRENT_TRACKING_JOBS=5
TRACKING_RATE_LIMIT_PER_MINUTE=10

# Queue Configuration
REDIS_QUEUE_PREFIX=geo_platform_
QUEUE_CLEANUP_RETENTION_DAYS=30
FAILED_JOB_RETENTION_DAYS=7
```

---

## 📋 實施階段和時程

### Stage 1: 基礎設施 (2-3 週)
**優先級: 🔥 最高**
- [x] ~~環境變數控制 SEO 功能顯示~~ (已完成)
- [ ] Redis Queue 系統建立
- [ ] 任務調度基礎架構
- [ ] AI 平台 API 基礎集成

### Stage 2: 核心追蹤功能 (3-4 週)
**優先級: 🔥 高**
- [ ] 查詢模板和生成器
- [ ] 結果解析和分析
- [ ] 基礎追蹤任務實現
- [ ] 數據存儲優化

### Stage 3: 競爭分析功能 (2-3 週)
**優先級: 🟡 中**
- [ ] 競爭對手檢測邏輯
- [ ] 比較分析算法
- [ ] 前端競爭分析界面
- [ ] 競爭報告生成

### Stage 4: 高級功能 (2-3 週)
**優先級: 🟡 中**
- [ ] 實時通知系統
- [ ] 趨勢分析和預測
- [ ] 異常檢測
- [ ] 高級報告功能

### Stage 5: 優化和監控 (1-2 週)
**優先級: 🔵 低**
- [ ] 性能優化
- [ ] 監控和日誌
- [ ] 錯誤處理增強
- [ ] 用戶體驗優化

---

## 🧪 測試策略

### 集成測試
- [ ] **AI 平台連接測試**
  - 每個平台的 API 連接驗證
  - 速率限制處理測試
  - 錯誤恢復測試

### 端到端測試
- [ ] **完整追蹤流程測試**
  - 從配置到結果的完整流程
  - 多平台同時追蹤測試
  - 大數據量處理測試

### 性能測試
- [ ] **併發追蹤測試**
  - 多組織同時追蹤
  - 高頻率追蹤負載測試
  - 內存和 CPU 使用監控

---

## 📊 成功指標

### 技術指標
- [ ] **系統穩定性**
  - 追蹤任務成功率 > 95%
  - 平均響應時間 < 5 秒
  - 系統可用時間 > 99.5%

### 功能指標  
- [ ] **數據質量**
  - 提及檢測準確率 > 90%
  - 情感分析準確率 > 85%
  - 競爭對手檢測覆蓋率 > 95%

### 用戶體驗指標
- [ ] **用戶滿意度**
  - 實時數據更新 < 1分鐘延遲
  - 報告生成時間 < 30秒
  - 用戶界面響應時間 < 2秒

---

## 🚨 風險和緩解策略

### 技術風險
1. **API 速率限制**
   - 緩解: 智能重試機制，多 API 密鑰輪換
   
2. **數據存儲成本**
   - 緩解: 分層存儲策略，歷史數據壓縮

3. **系統性能瓶頸**
   - 緩解: 水平擴展架構，Redis 緩存優化

### 業務風險
1. **AI 平台政策變更**
   - 緩解: 多平台分散策略，備用方案準備

2. **數據準確性問題**
   - 緩解: 多重驗證機制，人工審核流程

---

## 📝 下一步行動

### 立即執行 (本週)
1. [ ] 設置 Redis Queue 基礎架構
2. [ ] 創建 AI 平台服務抽象層
3. [ ] 實現第一個平台（ChatGPT）的基礎集成

### 短期目標 (2週內)
1. [ ] 完成所有 AI 平台的基礎 API 集成
2. [ ] 實現簡單的查詢和結果解析
3. [ ] 建立基礎的任務調度系統

### 中期目標 (1個月內)
1. [ ] 完整的追蹤功能實現
2. [ ] 基礎的競爭對手分析功能
3. [ ] 前端實時數據展示

這個計劃為 GEO Platform 提供了從 MVP 到完整 AI 追蹤功能的詳細實施路線圖，確保系統能夠真正實現對多個 AI 平台的實時監控和競爭分析功能。
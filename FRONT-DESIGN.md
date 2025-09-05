# GEO Platform Frontend 架構設計文件

## 🏗️ 專案概述

GEO Platform 的 new-frontend 是使用現代 React 技術棧構建的 Generative Engine Optimization (GEO) 平台前端應用。該應用專注於 AI 可見度追蹤、內容優化和競爭分析，採用組件化架構、響應式暗色主題設計，並整合了完整的 UI 元件庫。

### 核心功能
- **內容優化分析**: 基於 Google Gemini 和 OpenAI 的 GEO 分數評估
- **AI 可見度追蹤**: 多平台 AI 引擎監控 (ChatGPT, Gemini, Perplexity, Claude)
- **競爭對手分析**: 競爭對手表現追蹤與比較
- **關鍵字研究**: 關鍵字策略規劃與管理
- **實時分析報告**: 詳細的優化建議與執行計劃

### 技術棧
- **框架**: React 18.3.1 + TypeScript 5.8.3
- **構建工具**: Vite 5.4.19
- **路由**: React Router DOM 6.30.1
- **狀態管理**: TanStack Query 5.83.0 (伺服器狀態管理)
- **UI 框架**: 
  - Tailwind CSS 3.4.17 (樣式系統)
  - 50+ Radix UI 元件 (無樣式、可訪問性元件庫)
  - shadcn/ui (設計系統)
- **圖表**: Recharts 2.15.4 (響應式圖表庫)
- **表單**: React Hook Form 7.61.1 + Zod 3.25.76 (表單驗證)
- **圖標**: Lucide React 0.462.0 (現代化圖標庫)
- **通知**: Sonner 1.7.4 (Toast 通知系統)
- **HTTP 客戶端**: Axios 1.11.0 (API 請求處理)

## 📁 目錄結構

```
new-frontend/
├── src/
│   ├── components/           # 元件目錄
│   │   ├── dashboard/        # 儀表板專用元件
│   │   │   ├── DashboardLayout.tsx   # 主要佈局容器
│   │   │   ├── Sidebar.tsx           # 側邊欄導航
│   │   │   ├── DashboardHeader.tsx   # 頂部標題列
│   │   │   ├── MetricsGrid.tsx       # 指標卡片網格
│   │   │   ├── ChartSection.tsx      # 圖表區域
│   │   │   └── TabsSection.tsx       # 標籤區域
│   │   ├── auth/             # 認證相關元件
│   │   │   └── AuthModal.tsx         # 認證模態框
│   │   ├── ui/               # 基礎 UI 元件庫 (50+ 個元件)
│   │   │   ├── button.tsx            # 按鈕元件
│   │   │   ├── card.tsx              # 卡片元件
│   │   │   ├── dialog.tsx            # 對話框元件
│   │   │   ├── input.tsx             # 輸入框元件
│   │   │   ├── select.tsx            # 下拉選擇器
│   │   │   ├── badge.tsx             # 標籤元件
│   │   │   ├── progress.tsx          # 進度條元件
│   │   │   ├── tabs.tsx              # 標籤頁元件
│   │   │   ├── toast.tsx             # 通知元件
│   │   │   ├── chart.tsx             # 圖表元件
│   │   │   └── ... (完整 shadcn/ui 元件庫)
│   │   └── OptimizationResults.tsx  # 優化結果展示元件
│   ├── pages/                # 頁面元件
│   │   ├── Index.tsx         # 儀表板首頁
│   │   ├── Tracking.tsx      # 網站掃描追蹤頁
│   │   ├── Optimization.tsx  # 內容優化分析頁
│   │   ├── AISearch.tsx      # AI 可見度追蹤頁
│   │   ├── Analytics.tsx     # 競爭分析頁
│   │   ├── Research.tsx      # 關鍵字研究頁
│   │   ├── Reporting.tsx     # 報告中心頁
│   │   ├── Team.tsx          # 團隊管理頁
│   │   ├── Settings.tsx      # 系統設定頁
│   │   └── NotFound.tsx      # 404 錯誤頁面
│   ├── lib/                  # 工具函數與 API
│   │   ├── api/              # API 服務層
│   │   │   ├── client.ts     # HTTP 客戶端配置
│   │   │   ├── content.ts    # 內容優化 API
│   │   │   └── aiSearch.ts   # AI 搜尋追蹤 API
│   │   └── utils.ts          # 通用工具函數 (cn 函數)
│   ├── hooks/                # 自定義 React Hooks
│   │   ├── use-mobile.tsx    # 響應式偵測 Hook
│   │   └── use-toast.ts      # Toast 通知 Hook
│   ├── App.tsx               # 主應用元件 (路由配置)
│   ├── main.tsx              # 應用入口點 (React 18)
│   └── index.css             # 全域樣式與設計系統
├── public/                   # 靜態資源目錄
├── vite.config.ts           # Vite 構建工具配置
├── tailwind.config.ts       # Tailwind CSS 配置
├── tsconfig.json            # TypeScript 編譯配置
└── package.json             # 專案依賴與腳本配置
```

## 🎨 設計系統

### 顏色主題

應用採用暗色主題設計，所有顏色使用 HSL 色彩空間定義：

#### 核心顏色
- **背景色**: `220 27% 8%` - 深藍灰色背景
- **前景色**: `210 20% 98%` - 淺色文字
- **卡片色**: `223 25% 10%` - 稍亮的卡片背景
- **邊框色**: `220 27% 15%` - 細微的邊框顏色

#### 品牌顏色
- **主色 (Purple)**: `262 83% 58%` - 紫色，用於主要互動元素
- **GEO Blue**: `213 94% 68%` - 藍色，用於次要元素
- **GEO Green**: `142 76% 36%` - 綠色，用於成功狀態
- **GEO Orange**: `25 95% 53%` - 橙色，用於警告
- **GEO Cyan**: `188 94% 68%` - 青色，用於資訊提示

#### 漸層效果
- **主要漸層**: 紫色到藍色 (135度)
- **卡片漸層**: 深灰漸層，用於卡片背景
- **懸停漸層**: 透明度漸層，用於懸停效果

### 陰影系統
- `shadow-sm`: 小型陰影
- `shadow-md`: 中型陰影
- `shadow-lg`: 大型陰影
- `shadow-glow`: 發光效果，用於強調元素

### 動畫與過渡
- **標準過渡**: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- **快速過渡**: 150ms cubic-bezier(0.4, 0, 0.2, 1)

## 🧩 核心元件

### 1. DashboardLayout
主要佈局容器，管理側邊欄和主內容區域的佈局。

**特性**:
- 響應式側邊欄收合機制
- 固定頭部導航列
- 可滾動的主內容區域
- 動態邊距調整適配
- 暗色主題優化設計

### 2. Sidebar
左側導航欄，包含三個主要功能區塊：

**主要功能** 🏠:
- 儀表板 (Dashboard)
- 網站掃描追蹤 (Tracking) 
- 內容優化分析 (Optimization)
- AI 可見度追蹤 (AI Search)

**分析工具** 📊:
- 競爭對手分析 (Analytics)
- 關鍵字研究 (Research) 
- 報告中心 (Reporting)

**管理設定** ⚙️:
- 團隊管理 (Team)
- 系統設定 (Settings)

**特性**:
- 可收合/展開切換
- 活躍路由高亮顯示
- 漸層升級提示卡片
- 響應式導航適配

### 3. Optimization 頁面
內容優化分析的核心頁面，提供完整的 GEO 分析功能：

**主要功能**:
- 頁面管理：新增、編輯、刪除要分析的頁面
- GEO 分析：整合 Google Gemini 和 OpenAI 進行內容分析  
- 實時狀態：顯示分析進度 (pending/analyzing/completed/failed)
- 篩選系統：按 GEO 分數、流量等級、頁面類型篩選
- 詳細檢視：個別頁面的深度分析結果

**分析指標**:
- GEO 分數評估 (0-100)
- 預估改善潛力
- 問題識別與建議
- 最後分析時間追蹤

### 4. OptimizationResults 元件
優化結果展示的模態對話框元件：

**功能特性**:
- 響應式全屏模態設計
- ESC 鍵關閉支援
- 分數視覺化展示
- 分類優化建議 (技術健康、內容品質、AI 可見度)
- 執行計劃時間軸
- 一鍵複製建議內容
- 報告下載功能

**分析維度**:
- **技術健康** (40%): HTTPS、結構化資料、響應時間
- **內容品質** (30%): 字數、圖片、標題結構
- **AI 可見度** (30%): Meta 描述、FAQ、Schema 標記

### 5. API 服務層
完整的 TypeScript API 服務抽象：

**contentService**:
- 頁面 CRUD 操作 (getPages, addPage, updatePage, deletePage)
- GEO 分析功能 (analyzePage, batchAnalyzePages)
- 優化建議生成 (getOptimizationSuggestions)
- 內容分析服務 (analyzeContent)

**aiSearchService**:
- 關鍵字管理 (CRUD 操作)
- 追蹤配置管理
- 競爭對手分析
- 平台設定管理 (ChatGPT, Gemini, Perplexity, Claude)

### 6. 響應式設計系統
基於 Tailwind CSS 的完整響應式系統：

**斷點設計**:
- `sm`: 640px+ (手機橫屏)
- `md`: 768px+ (平板)
- `lg`: 1024px+ (桌面)
- `xl`: 1280px+ (大螢幕)
- `2xl`: 1536px+ (超大螢幕)

**自適應特性**:
- 側邊欄自動收合
- 卡片網格自適應排列
- 表格水平滾動
- 模態框尺寸調整

## 🔧 路由架構

```typescript
// App.tsx - 路由配置
<Routes>
  <Route path="/" element={<Index />} />                    // 儀表板首頁 - GEO 概覽
  <Route path="/tracking" element={<Tracking />} />         // 網站掃描追蹤
  <Route path="/optimization" element={<Optimization />} /> // 內容優化分析 ⭐
  <Route path="/ai-search" element={<AISearch />} />        // AI 可見度追蹤
  <Route path="/analytics" element={<Analytics />} />       // 競爭對手分析
  <Route path="/research" element={<Research />} />         // 關鍵字策略研究
  <Route path="/reporting" element={<Reporting />} />       // 分析報告中心
  <Route path="/team" element={<Team />} />                 // 團隊協作管理
  <Route path="/settings" element={<Settings />} />         // 系統偏好設定
  <Route path="*" element={<NotFound />} />                // 404 錯誤處理
</Routes>
```

**路由特性**:
- 基於 React Router DOM v6.30.1
- 支援巢狀路由與動態路由
- 404 錯誤頁面處理
- 路由守衛與權限控制 (規劃中)
- SEO 友善的 URL 結構

## 📦 主要依賴

### 核心框架層
- **React 18.3.1**: 現代化 UI 框架，支援並發特性
- **TypeScript 5.8.3**: 靜態類型檢查與 IntelliSense
- **Vite 5.4.19**: 極速開發伺服器與 ESM 構建工具

### UI 元件生態
- **@radix-ui/react-***: 50+ 個無樣式、完全可訪問的 UI 基礎元件
- **shadcn/ui**: 基於 Radix UI 構建的現代化設計系統
- **lucide-react 0.462.0**: 1000+ 個一致性圖標庫
- **class-variance-authority**: 元件變體與條件樣式管理

### 樣式與動畫系統
- **Tailwind CSS 3.4.17**: Utility-first CSS 框架
- **tailwindcss-animate 1.0.7**: CSS 動畫與過渡效果
- **@tailwindcss/typography 0.5.16**: 豐富的文字排版樣式
- **clsx 2.1.1 + tailwind-merge 2.6.0**: 智能類名合併工具

### 資料管理與表單
- **@tanstack/react-query 5.83.0**: 強大的伺服器狀態管理
- **axios 1.11.0**: Promise 基礎的 HTTP 客戶端
- **react-hook-form 7.61.1**: 高效能、最少重渲染的表單庫
- **zod 3.25.76**: TypeScript 優先的 schema 驗證
- **@hookform/resolvers 3.10.0**: 表單驗證器整合層

### 視覺化與互動
- **recharts 2.15.4**: React 響應式圖表庫
- **date-fns 3.6.0**: 現代化 JavaScript 日期處理
- **sonner 1.7.4**: 優雅的 Toast 通知系統
- **cmdk 1.1.1**: 快速命令面板元件
- **embla-carousel-react 8.6.0**: 現代化輪播元件
- **react-resizable-panels 2.1.9**: 可調整大小的面板佈局

### 開發工具鏈
- **@vitejs/plugin-react-swc 3.11.0**: SWC 編譯器整合
- **eslint 9.32.0 + typescript-eslint 8.38.0**: 程式碼品質檢查
- **autoprefixer 10.4.21**: 自動 CSS 前綴
- **lovable-tagger 1.1.9**: 開發輔助標記工具

## 🚀 開發指令

```bash
# 開發模式 (運行在 http://localhost:5173，Vite 預設)
npm run dev

# 生產環境構建 (最佳化輸出)
npm run build

# 開發環境構建 (保留 debug 資訊)
npm run build:dev

# 本地預覽構建結果
npm run preview

# ESLint 程式碼檢查
npm run lint

# 安裝專案依賴
npm install
```

**構建輸出**:
- 生產構建：`dist/` 目錄，包含最佳化的靜態檔案
- 開發構建：保留 source map 與 debug 資訊
- 自動 CSS 最佳化與 dead code elimination
- 現代化 ES 模組輸出格式

## 🌟 設計特點與使用者體驗

### 視覺設計
1. **暗色主題優先**: 深色背景 (`hsl(220 27% 8%)`) 減少眼睛疲勞，適合長時間使用
2. **漸層品牌識別**: 紫色到藍色的 135° 漸層 (`hsl(262 83% 58%)` → `hsl(213 94% 68%)`)
3. **發光效果系統**: `shadow-glow` 用於強調重要互動元素
4. **微動畫交互**: 300ms cubic-bezier 過渡，提升操作反饋

### 使用者體驗
5. **響應式優先**: 從手機到 4K 螢幕的完整適配
6. **直覺式導航**: 側邊欄分類清晰，路由狀態高亮
7. **實時狀態反饋**: Loading、Success、Error 狀態的視覺化呈現
8. **鍵盤支援**: ESC 關閉模態框、Tab 焦點管理

### 技術特性
9. **模組化架構**: 高度可重用的元件系統，便於維護擴展
10. **TypeScript 全覆蓋**: API 介面、元件 Props、狀態管理完全類型化
11. **無障礙設計**: 基於 Radix UI，支援螢幕閱讀器、鍵盤導航
12. **性能最佳化**: TanStack Query 快取、React 18 並發特性、Vite 極速構建

## 🔄 狀態管理架構

### 伺服器狀態管理
- **TanStack Query 5.83.0**: 
  - API 請求快取與同步
  - 樂觀更新與錯誤重試
  - 背景重新驗證
  - 分頁與無限查詢支援

### 表單狀態管理  
- **React Hook Form 7.61.1**:
  - 最少重渲染策略
  - 即時驗證與錯誤處理
  - 與 Zod schema 深度整合
  - 支援複雜表單邏輯

### 本地狀態管理
- **React Built-in Hooks**:
  - `useState`: 元件內部狀態
  - `useReducer`: 複雜狀態邏輯
  - `useContext`: 跨元件資料共享
  - 自定義 Hooks: `use-mobile`、`use-toast`

### 導航狀態管理
- **React Router DOM 6.30.1**:
  - 宣告式路由定義
  - 程序化導航控制
  - 路由參數與查詢字串
  - 巢狀路由支援

### 通知狀態管理
- **Sonner Toast System**:
  - 全域通知狀態
  - 多類型通知 (success, error, info, warning)
  - 自動消失與手動關閉
  - 位置與動畫自定義

## 📱 響應式設計

使用 Tailwind CSS 的響應式前綴：
- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+
- `2xl`: 1536px+

## 🔐 API 整合架構

### 後端 API 整合
**API Base URL**: `https://api-geo.blitzgame.site/api/v1`

### HTTP 客戶端配置
```typescript
// src/lib/api/client.ts - Axios 配置
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 請求攔截器：自動添加認證 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const orgId = localStorage.getItem('organizationId');
  if (orgId) {
    config.headers['X-Organization-ID'] = orgId;
  }
  
  return config;
});
```

### API 服務層架構
- **contentService**: 內容優化相關 API (11 個端點)
- **aiSearchService**: AI 搜尋追蹤相關 API (15 個端點)
- **認證服務**: JWT Token 管理與刷新 (規劃中)
- **組織服務**: 多租戶組織管理 (規劃中)

### 資料流架構
```
🔄 React Component → API Service → HTTP Client → Backend API
                    ↓
📦 TanStack Query ← Response Data ← API Response
```

### 錯誤處理機制
- HTTP 狀態碼統一處理
- API 錯誤訊息本地化
- 網路錯誤自動重試
- 使用者友善的錯誤提示

### 認證與授權
- **JWT Bearer Token**: 使用者身份驗證
- **組織級別控制**: `X-Organization-ID` header
- **Token 自動刷新**: 即將到期時自動更新
- **權限控制**: 基於角色的路由與功能存取 (規劃中)

## 🚀 功能實現狀態

### ✅ 已完成功能
- [x] **完整 UI 設計系統**: 50+ shadcn/ui 元件，暗色主題
- [x] **內容優化模組**: 頁面管理、GEO 分析、Gemini/OpenAI 整合
- [x] **API 服務層**: 完整的 TypeScript API 抽象層
- [x] **響應式佈局**: 手機到桌面的完整適配
- [x] **狀態管理**: TanStack Query + React Hook Form 整合
- [x] **優化結果展示**: 詳細分析報告與執行計劃
- [x] **實時狀態反饋**: Loading/Success/Error 狀態管理
- [x] **Toast 通知系統**: Sonner 整合

### 🔄 開發中功能
- [ ] **使用者認證系統**: JWT 登入/註冊流程
- [ ] **儀表板資料視覺化**: 圖表與指標展示
- [ ] **AI 搜尋追蹤**: 多平台監控介面
- [ ] **競爭對手分析**: 競爭力比較圖表
- [ ] **關鍵字研究工具**: 關鍵字管理與分析

### 📋 規劃中功能
- [ ] **多語言國際化**: i18n 支援 (繁中/英文)
- [ ] **深色/淺色主題切換**: 使用者偏好設定
- [ ] **離線功能支援**: Service Worker + 資料快取
- [ ] **即時通知**: WebSocket 整合
- [ ] **單元測試覆蓋**: Jest + React Testing Library
- [ ] **E2E 測試**: Playwright 整合
- [ ] **SEO 最佳化**: Meta 標籤與 OpenGraph
- [ ] **性能監控**: Web Vitals 追蹤

### 🎯 技術債務與最佳化
- [ ] **程式碼分割**: 路由層級的 lazy loading
- [ ] **Bundle 分析**: 依賴大小最佳化
- [ ] **快取策略**: API 回應快取最佳化
- [ ] **無障礙測試**: axe-core 整合
- [ ] **TypeScript 嚴格模式**: 提升類型安全性
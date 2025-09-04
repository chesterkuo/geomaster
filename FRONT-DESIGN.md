# GEO Platform Frontend 架構設計文件

## 🏗️ 專案概述

GEO Platform 的 new-frontend 是使用現代 React 技術棧構建的 AI 可見度追蹤平台前端應用。該應用採用組件化架構、暗色主題設計，並整合了完整的 UI 元件庫。

### 技術棧
- **框架**: React 18.3.1 + TypeScript 5.8.3
- **構建工具**: Vite 5.4.19
- **路由**: React Router DOM 6.30.1
- **狀態管理**: TanStack Query 5.83.0
- **UI 框架**: 
  - Tailwind CSS 3.4.17 (樣式系統)
  - Radix UI (無樣式元件庫)
  - shadcn/ui (元件庫)
- **圖表**: Recharts 2.15.4
- **表單**: React Hook Form 7.61.1 + Zod 3.25.76
- **圖標**: Lucide React 0.462.0

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
│   │   └── ui/               # 基礎 UI 元件 (50+ 個元件)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ... (shadcn/ui 元件庫)
│   ├── pages/                # 頁面元件
│   │   ├── Index.tsx         # 儀表板首頁
│   │   ├── Tracking.tsx      # 網站掃描頁
│   │   ├── Optimization.tsx  # 內容優化頁
│   │   ├── AISearch.tsx      # AI 可見度追蹤頁
│   │   ├── Analytics.tsx     # 競爭分析頁
│   │   ├── Research.tsx      # 關鍵字研究頁
│   │   ├── Reporting.tsx     # 報告中心頁
│   │   ├── Team.tsx          # 團隊管理頁
│   │   ├── Settings.tsx      # 系統設定頁
│   │   └── NotFound.tsx      # 404 頁面
│   ├── hooks/                # 自定義 Hooks
│   │   ├── use-mobile.tsx    # 響應式偵測
│   │   └── use-toast.ts      # Toast 通知
│   ├── lib/                  # 工具函數
│   │   └── utils.ts          # 通用工具函數 (cn 函數)
│   ├── App.tsx               # 主應用元件
│   ├── main.tsx              # 應用入口
│   └── index.css             # 全域樣式與設計系統
├── public/                   # 靜態資源
├── vite.config.ts           # Vite 配置
├── tailwind.config.ts       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 專案配置
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
- 響應式側邊欄收合
- 固定頭部導航
- 可滾動的內容區域
- 動態邊距調整

### 2. Sidebar
左側導航欄，包含三個主要區塊：

**主要功能**:
- 儀表板
- 網站掃描
- 內容優化
- AI 可見度追蹤

**分析工具**:
- 競爭分析
- 關鍵字研究
- 報告中心

**設定功能**:
- 團隊管理
- 系統設定

**特性**:
- 可收合/展開
- 活躍項目高亮
- 漸層升級提示卡片

### 3. MetricsGrid
顯示關鍵指標的卡片網格，包含：
- AI 可見度分數
- 品牌曝光次數
- 引用排名
- 優化提醒

**特性**:
- 動態圖標顏色
- 趨勢指標（上升/下降）
- 懸停動畫效果
- 響應式網格佈局

### 4. ChartSection
圖表展示區域，使用 Recharts 庫渲染：
- 線圖：顯示趨勢數據
- 環形圖：展示比例分佈

### 5. TabsSection
標籤內容區域，用於分組展示不同類型的資訊。

## 🔧 路由架構

```javascript
<Routes>
  <Route path="/" element={<Index />} />              // 儀表板首頁
  <Route path="/tracking" element={<Tracking />} />   // 網站掃描
  <Route path="/optimization" element={<Optimization />} />  // 內容優化
  <Route path="/ai-search" element={<AISearch />} />  // AI 追蹤
  <Route path="/analytics" element={<Analytics />} /> // 競爭分析
  <Route path="/research" element={<Research />} />   // 關鍵字研究
  <Route path="/reporting" element={<Reporting />} /> // 報告中心
  <Route path="/team" element={<Team />} />          // 團隊管理
  <Route path="/settings" element={<Settings />} />   // 系統設定
  <Route path="*" element={<NotFound />} />          // 404 頁面
</Routes>
```

## 📦 主要依賴

### 核心框架
- **React**: UI 框架
- **TypeScript**: 類型安全
- **Vite**: 快速開發伺服器和構建工具

### UI 元件庫
- **@radix-ui/react-***: 50+ 個無樣式、可訪問的 UI 元件
- **shadcn/ui**: 基於 Radix UI 的元件庫
- **lucide-react**: 現代化圖標庫

### 樣式系統
- **Tailwind CSS**: 實用優先的 CSS 框架
- **tailwindcss-animate**: 動畫擴展
- **class-variance-authority**: 元件變體管理
- **clsx + tailwind-merge**: 類名管理工具

### 資料與表單
- **@tanstack/react-query**: 伺服器狀態管理
- **react-hook-form**: 高性能表單庫
- **zod**: 架構驗證
- **@hookform/resolvers**: 表單驗證整合

### 其他工具
- **recharts**: 圖表庫
- **date-fns**: 日期處理
- **sonner**: Toast 通知
- **cmdk**: 命令選單

## 🚀 開發指令

```bash
# 開發模式 (運行在 http://localhost:8081)
npm run dev

# 生產構建
npm run build

# 開發構建
npm run build:dev

# 預覽構建結果
npm run preview

# 代碼檢查
npm run lint
```

## 🌟 設計特點

1. **暗色主題優先**: 整個應用採用深色設計，減少眼睛疲勞
2. **漸層與發光效果**: 使用紫藍漸層作為品牌識別
3. **微動畫**: 所有互動元素都有細微的過渡動畫
4. **響應式設計**: 適配各種螢幕尺寸
5. **模組化元件**: 高度可重用的元件系統
6. **類型安全**: 完整的 TypeScript 支援
7. **可訪問性**: 基於 Radix UI 的無障礙設計

## 🔄 狀態管理

- **伺服器狀態**: TanStack Query 管理 API 請求和快取
- **表單狀態**: React Hook Form 處理表單邏輯
- **本地狀態**: React useState/useReducer 處理元件狀態
- **路由狀態**: React Router DOM 管理導航狀態

## 📱 響應式設計

使用 Tailwind CSS 的響應式前綴：
- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+
- `2xl`: 1536px+

## 🔐 API 整合準備

前端已準備好與後端 API (https://api-geo.blitzgame.site) 整合：
- TanStack Query 用於資料獲取和快取
- 已配置的 QueryClient
- 支援 JWT 認證 (Bearer Token)
- 組織級別的存取控制 (X-Organization-ID)

## 📝 待辦事項

- [ ] 整合後端 API 端點
- [ ] 實現使用者認證流程
- [ ] 添加資料視覺化元件
- [ ] 完善錯誤處理機制
- [ ] 添加載入狀態指示器
- [ ] 實現多語言支援
- [ ] 添加單元測試
- [ ] 優化 SEO 和性能
# GEO Platform - AI 搜尋引擎優化 SaaS 平台

一個全方位的平台，幫助企業優化其內容以適應 AI 驅動的搜尋引擎（ChatGPT、Google Gemini、Perplexity AI、Claude），使其能夠在 AI 優先的搜尋生態系統中保持並提升可見度。

## 📋 目錄

- [功能特點](#功能特點)
- [系統架構](#系統架構)
- [環境要求](#環境要求)
- [快速開始](#快速開始)
- [詳細安裝指南](#詳細安裝指南)
- [API 文檔](#api-文檔)
- [開發指南](#開發指南)
- [測試](#測試)
- [部署](#部署)
- [故障排除](#故障排除)

## 🚀 功能特點

### 核心功能
- **網站掃描分析**: 全面分析網站內容，提供 AI 優化建議
- **內容優化**: AI 驅動的內容增強，支援一鍵優化
- **AI 可見度追蹤**: 追蹤在 ChatGPT、Gemini、Perplexity 和 Claude 中的提及和引用
- **GEO 評分系統**: 專有的 AI 搜尋優化評分演算法

### 進階工具
- **競爭對手分析**: 監控競爭對手在 AI 平台的可見度
- **關鍵字研究**: AI 專注的關鍵字建議和追蹤
- **報告生成**: 全面的優化報告
- **多租戶支援**: 組織和團隊管理

### 整合等級
- **Level 0**: 手動下載和實施
- **Level 1**: JavaScript 嵌入代碼快速優化
- **Level 2**: WordPress/Shopify 插件
- **Level 3**: 完整 API 整合
- **Level 4**: 完全自動化工作流程整合

## 🏗️ 系統架構

### 後端技術棧 (Node.js + TypeScript)
- **框架**: Express.js with TypeScript
- **資料庫**: MySQL 8.0+ with Sequelize ORM
- **快取**: Redis 用於會話管理和佇列
- **佇列系統**: Bull 用於背景作業處理
- **認證**: JWT with Passport.js
- **AI 整合**: OpenAI GPT-4, Perplexity, Google Gemini APIs

### 前端技術棧 (React + TypeScript)
- **框架**: React 18 with TypeScript
- **建構工具**: Vite
- **樣式**: Tailwind CSS
- **狀態管理**: Redux Toolkit
- **API 客戶端**: Axios with React Query
- **UI 元件**: 自定義元件與 Lucide React 圖標

## 📋 環境要求

- Node.js 18.0.0 或更高版本
- MySQL 8.0 或更高版本
- Redis 7.0 或更高版本（建議但非必須）
- npm 或 yarn 套件管理器

## 🚀 快速開始（15分鐘內啟動）

### 1. 克隆專案
```bash
git clone <repository-url> geo-platform
cd geo-platform
```

### 2. 快速設置腳本
```bash
#!/bin/bash
# GEO Platform 快速設置腳本

# 安裝後端依賴
npm install

# 設置環境變數
cp .env.example .env
echo "⚠️  請編輯 .env 文件，填入您的資料庫和 API 憑證"

# 創建資料庫（需要 MySQL 正在運行）
mysql -u root -p -e "CREATE DATABASE exchange_geo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p exchange_geo < database/schema.sql

# 設置前端
cd frontend
npm install
cd ..

# 啟動開發伺服器
npm run dev &
cd frontend && npm run dev &

echo "✅ GEO Platform 正在啟動！"
echo "🔗 後端: http://localhost:8000"
echo "🔗 前端: http://localhost:3000"
```

## 🛠️ 詳細安裝指南

### 步驟 1: 資料庫配置

#### 選項 A: 本地 MySQL
```bash
# 安裝 MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server

# 安裝 MySQL (macOS with Homebrew)
brew install mysql
brew services start mysql

# 創建資料庫
mysql -u root -p
CREATE DATABASE exchange_geo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'geouser'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON exchange_geo.* TO 'geouser'@'localhost';
FLUSH PRIVILEGES;
exit

# 導入資料庫結構
mysql -u geouser -p exchange_geo < database/schema.sql
```

#### 選項 B: Docker MySQL
```bash
# 使用 Docker 運行 MySQL
docker run --name geo-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=exchange_geo \
  -e MYSQL_USER=geouser \
  -e MYSQL_PASSWORD=geopassword \
  -p 3306:3306 \
  -d mysql:8.0

# 等待容器準備就緒，然後導入結構
sleep 30
docker exec -i geo-mysql mysql -u geouser -pgeopassword exchange_geo < database/schema.sql
```

### 步驟 2: Redis 設置（建議但非必須）

#### 選項 A: 本地 Redis
```bash
# 安裝 Redis (Ubuntu/Debian)
sudo apt install redis-server

# 安裝 Redis (macOS with Homebrew)
brew install redis
brew services start redis

# 測試 Redis
redis-cli ping
```

#### 選項 B: Docker Redis
```bash
docker run --name geo-redis -p 6379:6379 -d redis:7-alpine
```

### 步驟 3: 環境變數配置

```bash
# 複製環境變數範本
cp .env.example .env
```

**最小 .env 配置：**
```bash
# 資料庫（必需）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=exchange_geo
DB_USER=geouser
DB_PASSWORD=geopassword

# 認證（必需）
JWT_SECRET=change-this-to-a-long-random-string-in-production
JWT_REFRESH_SECRET=change-this-to-another-long-random-string

# 基本 API 金鑰（測試時可選）
OPENAI_API_KEY=sk-your-openai-key-here

# 應用程式設定
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Redis（可選）
REDIS_HOST=localhost
REDIS_PORT=6379

# 郵件服務（可選）
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com
```

### 步驟 4: 安裝依賴

#### 後端依賴
```bash
cd geo-platform
npm install
```

#### 前端依賴
```bash
cd frontend
npm install
```

### 步驟 5: 啟動服務

#### 終端 1 - 後端
```bash
cd geo-platform
npm run dev
# 後端 API 將在 http://localhost:8000 運行
```

#### 終端 2 - 前端
```bash
cd geo-platform/frontend
npm run dev
# 前端將在 http://localhost:3000 運行
```

## 🧪 驗證步驟

### 1. 後端健康檢查
```bash
curl http://localhost:8000/health
```
預期回應：
```json
{
  "success": true,
  "message": "GEO Platform API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 資料庫連接測試
```bash
curl http://localhost:8000/api/v1/docs
```
應該返回 API 文檔。

### 3. 前端訪問
訪問 `http://localhost:3000` - 您應該看到登入頁面。

### 4. 創建測試帳戶
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "測試用戶",
    "company": "測試公司"
  }'
```

## 📚 API 文檔

### 認證端點
- `POST /api/v1/auth/register` - 用戶註冊
- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/refresh` - 刷新訪問令牌
- `GET /api/v1/auth/profile` - 獲取用戶資料

### 網站管理
- `GET /api/v1/websites` - 列出網站
- `POST /api/v1/websites` - 創建網站
- `GET /api/v1/websites/:id` - 獲取網站詳情
- `PUT /api/v1/websites/:id` - 更新網站
- `DELETE /api/v1/websites/:id` - 刪除網站

### 掃描與優化
- `POST /api/v1/scans` - 開始網站掃描
- `GET /api/v1/scans/:id` - 獲取掃描狀態
- `POST /api/v1/content/optimize` - 優化內容
- `GET /api/v1/tracking/mentions` - 獲取 AI 提及

完整 API 文檔可在以下位址查看：`http://localhost:8000/api/v1/docs`

## 🔧 開發指南

### 建構專案

#### 後端建構
```bash
npm run build
# TypeScript 將編譯到 dist/ 目錄
```

#### 前端建構
```bash
cd frontend
npm run build
# 生產版本將在 frontend/dist/ 目錄
```

### 程式碼品質檢查
```bash
# 後端 linting
npm run lint
npm run lint:fix

# 前端 linting
cd frontend
npm run lint
```

### 資料庫遷移
```bash
# 創建遷移
npm run migrate:create

# 執行遷移
npm run migrate

# 撤銷最後一次遷移
npm run migrate:undo
```

## 🧪 測試

### 執行 API 測試
```bash
# 執行測試腳本
npm run test:api

# 或使用 Jest 測試
npm test

# 測試覆蓋率
npm run test:coverage
```

### 前端測試
```bash
cd frontend
npm test
```

## 🐳 Docker 部署

### 使用 Docker Compose
```bash
# 啟動所有服務
docker-compose up -d

# 導入資料庫結構
docker exec -i geo-platform_mysql_1 mysql -u geouser -pgeopassword exchange_geo < database/schema.sql

# 檢查服務
docker-compose ps
```

### Docker Compose 服務
- **MySQL**: `localhost:3306`
- **Redis**: `localhost:6379`
- **後端 API**: `localhost:8000`
- **前端**: `localhost:3000`

## 🚀 生產環境部署

### 使用 PM2
```bash
# 安裝 PM2
npm install -g pm2

# 建構專案
npm run build

# 使用 PM2 啟動
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save
pm2 startup
```

### Nginx 配置範例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 後端 API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ⚙️ 配置指南

### 必需的 API 金鑰

#### OpenAI API Key
1. 前往 https://platform.openai.com/api-keys
2. 創建新的密鑰
3. 添加到 `.env`: `OPENAI_API_KEY=sk-...`

#### Perplexity API Key（可選）
1. 前往 https://www.perplexity.ai/settings/api
2. 生成 API 金鑰
3. 添加到 `.env`: `PERPLEXITY_API_KEY=pplx-...`

#### Google API Key（可選）
1. 前往 https://console.developers.google.com/
2. 創建專案並啟用 Generative AI API
3. 添加到 `.env`: `GOOGLE_API_KEY=AIza...`

## 🔍 故障排除

### 常見問題與解決方案

#### 問題：「資料庫連接失敗」
```bash
# 檢查 MySQL 服務
sudo systemctl status mysql

# 手動測試連接
mysql -u geouser -p -h localhost exchange_geo

# 解決方案：確保 MySQL 正在運行且憑證正確
```

#### 問題：「埠 8000 已被使用」
```bash
# 查找使用該埠的進程
lsof -i :8000

# 終止進程
kill -9 <PID>

# 或在 .env 中更改埠
PORT=8001
```

#### 問題：「Redis 連接失敗」
```bash
# 檢查 Redis 服務
redis-cli ping

# 啟動 Redis（如果未運行）
sudo systemctl start redis

# 或暫時禁用 Redis
REDIS_HOST=
```

#### 問題：「API 金鑰無效」
```bash
# 測試 OpenAI 金鑰
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models

# 解決方案：驗證 API 金鑰格式和權限
```

### 性能優化

#### 資料庫優化
```sql
-- 添加索引以提高性能
CREATE INDEX idx_content_website_status ON content(website_id, optimization_status);
CREATE INDEX idx_ai_tracking_website_platform ON ai_tracking_results(website_id, platform, tracked_at);
```

#### Node.js 記憶體設定
```bash
# 對於大型操作，增加記憶體
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## 🔐 安全性

### 認證與授權
- 基於 JWT 的認證與刷新令牌
- 基於角色的訪問控制（Admin、Manager、User、Viewer）
- 組織級別的資料隔離
- API 速率限制

### 資料保護
- 使用 bcrypt 進行密碼雜湊
- 使用 Sequelize ORM 防止 SQL 注入
- 使用 helmet 進行 XSS 保護
- CORS 配置
- 使用 Joi 進行輸入驗證

## 📈 擴展性考慮

### 性能優化
- 資料庫索引優化查詢性能
- Redis 快取頻繁訪問的資料
- 使用 Bull 佇列進行背景作業處理
- CDN 整合靜態資產

### 高可用性
- 資料庫連接池
- 優雅關閉處理
- 使用 PM2 進行進程監控
- 負載均衡支援

## 🤝 貢獻

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

## 🎯 路線圖

### 第一階段（當前）
- ✅ 核心平台功能
- ✅ 基本 AI 追蹤
- ✅ 內容優化
- ✅ 網站掃描

### 第二階段（下一步）
- [ ] 進階競爭對手分析
- [ ] 即時 AI 提及警報
- [ ] 自定義優化模板
- [ ] 批量優化工具

### 第三階段（未來）
- [ ] 機器學習優化建議
- [ ] 進階分析儀表板
- [ ] 第三方整合（Zapier、Make.com）
- [ ] 白標解決方案

## 🆘 支援

### 獲取幫助
- 查看 [Issues](https://github.com/your-org/geo-platform/issues) 頁面
- 在 `/api/v1/docs` 查看 API 文檔
- 檢查應用程式日誌以獲取詳細錯誤訊息

### 聯繫方式
- 技術支援：support@geo-platform.com
- 商業合作：business@geo-platform.com

---

**GEO Platform** - 為 AI 搜尋時代賦能企業 🚀
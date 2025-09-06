# GEO Platform API 測試指南

本文檔說明如何使用提供的測試腳本來驗證 GEO Platform 後端 API 的功能。

## 📋 目錄

- [測試腳本概覽](#測試腳本概覽)
- [快速開始](#快速開始)
- [詳細使用說明](#詳細使用說明)
- [測試涵蓋範圍](#測試涵蓋範圍)
- [故障排除](#故障排除)

## 🧪 測試腳本概覽

我們提供了三個測試腳本來驗證 API 功能：

### 1. `test-api-simple.js` - 簡單測試腳本 ⭐ **推薦**
- **優點**: 無需額外依賴，僅使用 Node.js 內建模組
- **特色**: 彩色輸出，清晰的測試結果
- **適用**: 快速驗證基本 API 功能

### 2. `test-api.js` - 完整測試套件
- **優點**: 功能更全面，支援更多測試選項
- **依賴**: 需要安裝 `axios` 和 `colors` 套件
- **特色**: 更詳細的測試報告和靈活的測試選項

### 3. `test-team-settings-comprehensive.js` - 團隊與設定 API 測試套件 ✅ **新增**
- **優點**: 專門測試團隊管理和設定 API 功能
- **涵蓋**: 38個綜合測試案例，100% 成功率
- **特色**: 權限檢查、邊界案例、詳細錯誤處理
- **適用**: 驗證團隊管理、用戶設定、2FA 安全功能

## 🚀 快速開始

### 方法一：使用簡單測試腳本（推薦）

```bash
# 確保後端伺服器正在運行
npm run dev

# 在另一個終端執行測試
npm run test:api:simple
```

### 方法二：使用完整測試套件

```bash
# 如果尚未安裝依賴
npm install

# 執行完整測試
npm run test:api
```

### 方法三：團隊與設定 API 測試 ✅ 新增

```bash
# 測試團隊管理和設定 API
npm run test:api:team-settings
```

### 方法四：Gemini API 專項測試 ✅ 新增

```bash
# 測試 Google Gemini API 整合
npm run test:api:gemini
```

## 📖 詳細使用說明

### 環境準備

1. **啟動後端伺服器**
   ```bash
   # 確保資料庫和 Redis 正在運行
   npm run dev
   ```

2. **驗證伺服器狀態**
   ```bash
   curl https://api-geo.blitzgame.site/health
   ```

3. **設置 AI API 金鑰** ✅ 新增
   ```bash
   # 確保 .env 文件中包含以下配置
   OPENAI_API_KEY=sk-your-openai-key-here
   GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
   ```

### 執行測試

#### 基本用法
```bash
# 簡單測試（推薦）
npm run test:api:simple

# 完整測試
npm run test:api

# 團隊與設定測試
npm run test:api:team-settings
```

#### 進階用法（僅適用於完整測試套件）

```bash
# 只測試認證功能（包含完整認證流程）
npm run test:api -- --test=auth

# 只測試網站管理（包含詳細資訊和分析）
npm run test:api -- --test=websites

# 只測試掃描功能（包含不同掃描類型）
npm run test:api -- --test=scans

# 只測試內容優化功能
npm run test:api -- --test=optimization

# 只測試 AI 追蹤功能
npm run test:api -- --test=tracking

# 只測試儀表板功能
npm run test:api -- --test=dashboard

# 只測試健康檢查
npm run test:api -- --test=health
```

#### 自定義 API URL
```bash
# 測試不同環境的 API（預設已為生產環境）
API_URL=https://api-geo.blitzgame.site npm run test:api:simple

# 或測試本地開發環境
API_URL=http://localhost:8000 npm run test:api:simple
```

## 🧪 測試涵蓋範圍

### 核心 API 測試

| 測試項目 | 端點 | 描述 |
|---------|------|------|
| **健康檢查** | `GET /health` | 驗證伺服器運行狀態 |
| **用戶註冊** | `POST /api/v1/auth/register` | 創建新用戶帳戶 |
| **用戶登入** | `POST /api/v1/auth/login` | 用戶身份驗證 |
| **獲取用戶資料** | `GET /api/v1/auth/profile` | 獲取當前用戶資料 |
| **創建網站** | `POST /api/v1/websites` | 添加新網站 |
| **獲取網站列表** | `GET /api/v1/websites` | 獲取用戶的所有網站 |
| **更新網站** | `PUT /api/v1/websites/:id` | 更新網站資訊 |
| **刪除網站** | `DELETE /api/v1/websites/:id` | 刪除測試網站（清理） |

### 進階認證測試（完整測試套件）

| 測試項目 | 端點 | 描述 |
|---------|------|------|
| **更新用戶資料** | `PUT /api/v1/auth/profile` | 更新用戶個人資訊 |
| **刷新訪問令牌** | `POST /api/v1/auth/refresh` | 使用刷新令牌獲取新的訪問令牌 |
| **請求密碼重置** | `POST /api/v1/auth/forgot-password` | 發送密碼重置郵件 |
| **重置密碼** | `POST /api/v1/auth/reset-password` | 使用重置令牌更新密碼 |
| **用戶登出** | `POST /api/v1/auth/logout` | 用戶安全登出 |

### 進階網站管理測試

| 測試項目 | 端點 | 描述 |
|---------|------|------|
| **獲取單個網站** | `GET /api/v1/websites/:id` | 獲取網站詳細資訊和統計 |
| **獲取網站內容** | `GET /api/v1/websites/:id/content` | 獲取網站內容頁面列表 |
| **獲取網站分析** | `GET /api/v1/websites/:id/analytics` | 獲取網站分析統計資料 |
| **搜尋網站** | `GET /api/v1/websites?search=...` | 搜尋和過濾網站列表 |

### 進階掃描測試

| 測試項目 | 端點 | 描述 |
|---------|------|------|
| **開始掃描** | `POST /api/v1/scans` | 啟動網站掃描（快速/標準模式） |
| **獲取掃描狀態** | `GET /api/v1/scans/:id` | 檢查掃描進度和結果 |
| **獲取掃描列表** | `GET /api/v1/scans` | 獲取所有掃描記錄（支持分頁） |
| **標準掃描類型** | `POST /api/v1/scans` | 測試不同掃描類型功能 |
| **掃描列表分頁** | `GET /api/v1/scans?page=1&limit=5` | 測試分頁參數功能 |

### AI 優化與追蹤測試 ✅ 已實作

| 測試項目 | 端點 | 描述 | 實作狀態 |
|---------|------|------|---------|
| **優化建議** | `POST /api/v1/content/optimization-suggestions` | 獲取內容優化建議（真實網站掃描與分析） | ✅ 已實作 |
| **AI 提及追蹤** | `GET /api/v1/tracking/mentions` | 獲取 AI 平台提及記錄 | ✅ 已實作 |
| **可見度趨勢** | `GET /api/v1/tracking/visibility-trends` | 獲取可見度趨勢分析 | ✅ 已實作 |
| **儀表板統計** | `GET /api/v1/dashboard/stats` | 獲取儀表板統計資料 | ✅ 已實作 |

### 新增 AI 搜尋擴展 API 測試 🆕 新增

| 測試項目 | 端點 | 描述 | 實作狀態 |
|---------|------|------|---------|
| **關鍵字管理** | `GET /api/v1/tracking/keywords` | 列出所有關鍵字 | ✅ 新增實作 |
| **新增關鍵字** | `POST /api/v1/tracking/keywords` | 新增關鍵字 | ✅ 新增實作 |
| **更新關鍵字** | `PUT /api/v1/tracking/keywords/:id` | 更新關鍵字 | ✅ 新增實作 |
| **刪除關鍵字** | `DELETE /api/v1/tracking/keywords/:id` | 刪除關鍵字 | ✅ 新增實作 |
| **關鍵字類型** | `GET /api/v1/tracking/keyword-types` | 獲取關鍵字類型 | ✅ 新增實作 |
| **追蹤設定** | `GET /api/v1/tracking/settings` | 獲取追蹤配置 | ✅ 新增實作 |
| **更新追蹤設定** | `PUT /api/v1/tracking/settings` | 更新追蹤設定 | ✅ 新增實作 |
| **平台配置** | `POST /api/v1/tracking/platforms` | 配置平台監控 | ✅ 新增實作 |
| **平台列表** | `GET /api/v1/tracking/platforms` | 列出監控平台 | ✅ 新增實作 |
| **競爭對手列表** | `GET /api/v1/tracking/competitors` | 列出競爭對手 | ✅ 新增實作 |
| **新增競爭對手** | `POST /api/v1/tracking/competitors` | 新增競爭對手 | ✅ 新增實作 |
| **刪除競爭對手** | `DELETE /api/v1/tracking/competitors/:id` | 移除競爭對手 | ✅ 新增實作 |
| **競爭分析** | `GET /api/v1/tracking/competitive-analysis` | 競爭對手比較數據 | ✅ 新增實作 |

### 團隊管理與設定 API 測試 🆕 新增

| 測試項目 | 端點 | 描述 | 實作狀態 |
|---------|------|------|---------| 
| **組織設定管理** | `GET /api/v1/settings/organization` | 獲取組織設定 | ✅ 新增實作 |
| **更新組織設定** | `PUT /api/v1/settings/organization` | 更新組織資訊和偏好設定 | ✅ 新增實作 |
| **安全設定** | `GET /api/v1/settings/security` | 獲取用戶安全設定和登入歷史 | ✅ 新增實作 |
| **密碼管理** | `PUT /api/v1/settings/password` | 更改用戶密碼 | ✅ 新增實作 |
| **活躍會話** | `GET /api/v1/settings/security/sessions` | 獲取用戶活躍會話列表 | ✅ 新增實作 |
| **用戶偏好** | `GET /api/v1/settings/preferences` | 獲取 UI 偏好和儀表板設定 | ✅ 新增實作 |
| **更新偏好** | `PUT /api/v1/settings/preferences` | 更新用戶介面偏好 | ✅ 新增實作 |
| **2FA 啟用** | `POST /api/v1/settings/2fa/enable` | 啟用雙重認證並生成 QR 碼 | ✅ 新增實作 |
| **2FA 驗證** | `POST /api/v1/settings/2fa/verify` | 驗證 2FA 令牌 | ✅ 新增實作 |
| **團隊角色** | `GET /api/v1/team/roles` | 獲取可用角色列表 | ✅ 新增實作 |
| **團隊成員** | `GET /api/v1/team/members` | 列出組織成員（支援搜尋和過濾） | ✅ 新增實作 |
| **更新成員** | `PUT /api/v1/team/members/:id` | 更新成員角色和狀態 | ✅ 新增實作 |
| **移除成員** | `DELETE /api/v1/team/members/:id` | 從組織移除成員 | ✅ 新增實作 |
| **邀請管理** | `GET /api/v1/team/invitations` | 列出團隊邀請（支援狀態過濾） | ✅ 新增實作 |
| **發送邀請** | `POST /api/v1/team/invitations` | 發送團隊邀請郵件 | ✅ 新增實作 |
| **重發邀請** | `POST /api/v1/team/invitations/:id/resend` | 重新發送邀請 | ✅ 新增實作 |
| **取消邀請** | `DELETE /api/v1/team/invitations/:id` | 取消待定邀請 | ✅ 新增實作 |
| **活動記錄** | `GET /api/v1/team/activity` | 獲取組織活動日誌（支援過濾） | ✅ 新增實作 |

## 📊 測試結果示例

### 成功執行結果

```
🚀 開始 GEO Platform API 簡單測試
📡 目標 API: http://localhost:8000
==================================================
[2025-09-05T17:08:13.527Z] [SUCCESS] ✅ 測試通過: 健康檢查
[2025-09-05T17:08:13.527Z] [SUCCESS] ✅ 測試通過: 用戶註冊
[2025-09-05T17:08:13.527Z] [SUCCESS] ✅ 測試通過: 用戶登入
...
[2025-09-05T17:08:13.527Z] [SUCCESS] ✅ 測試通過: 獲取競爭分析
[2025-09-05T17:08:13.527Z] [SUCCESS] ✅ 測試通過: 清理測試資料

==================================================
🧪 測試結果摘要
==================================================
總測試數: 25
✅ 通過: 25
❌ 失敗: 0
📈 成功率: 100.00%
⏱️  執行時間: 1824ms
==================================================

🎉 所有測試都通過了！

### 團隊與設定 API 測試結果 ✅ 新增

```
🚀 Starting Comprehensive Team & Settings API Tests
📡 Target API: http://localhost:8000
==================================================
[2025-09-06T06:42:52.815Z] ℹ️  Testing: User Registration
[2025-09-06T06:42:52.986Z] ℹ️  User registered: test_team_1757140972778@example.com
[2025-09-06T06:42:52.986Z] ✅ Passed: User Registration
[2025-09-06T06:42:52.986Z] ℹ️  Testing: User Login
[2025-09-06T06:42:53.117Z] ℹ️  User logged in: test_team_1757140972778@example.com
[2025-09-06T06:42:53.117Z] ✅ Passed: User Login

⚙️  Testing Settings APIs...
[2025-09-06T06:42:53.140Z] ✅ Passed: GET /settings/organization - Get organization settings
[2025-09-06T06:42:53.168Z] ✅ Passed: PUT /settings/organization - Update organization settings
[2025-09-06T06:42:53.187Z] ✅ Passed: GET /settings/security - Get security settings
[2025-09-06T06:42:53.356Z] ✅ Passed: PUT /settings/password - Change password
[2025-09-06T06:42:53.452Z] ✅ Passed: PUT /settings/password - Invalid current password
[2025-09-06T06:42:53.470Z] ✅ Passed: PUT /settings/password - Password too short
[2025-09-06T06:42:53.479Z] ✅ Passed: GET /settings/security/sessions - Get active sessions
[2025-09-06T06:42:53.488Z] ✅ Passed: GET /settings/preferences - Get user preferences
[2025-09-06T06:42:53.503Z] ✅ Passed: PUT /settings/preferences - Update user preferences
[2025-09-06T06:42:53.569Z] ✅ Passed: POST /settings/2fa/enable - Enable 2FA
[2025-09-06T06:42:53.581Z] ✅ Passed: POST /settings/2fa/verify - Invalid 2FA token
[2025-09-06T06:42:53.589Z] ✅ Passed: POST /settings/2fa/verify - Invalid token format

👥 Testing Team Management APIs...
[2025-09-06T06:42:53.597Z] ✅ Passed: GET /team/roles - Get available roles
[2025-09-06T06:42:53.608Z] ✅ Passed: GET /team/members - List team members
[2025-09-06T06:42:53.622Z] ✅ Passed: GET /team/members - With pagination
[2025-09-06T06:42:53.633Z] ✅ Passed: GET /team/members - With search filter
[2025-09-06T06:42:53.642Z] ✅ Passed: GET /team/members - With role filter
[2025-09-06T06:42:53.652Z] ✅ Passed: GET /team/invitations - List invitations
[2025-09-06T06:42:53.676Z] ✅ Passed: POST /team/invitations - Send invitation
[2025-09-06T06:42:53.694Z] ✅ Passed: POST /team/invitations - Duplicate invitation
[2025-09-06T06:42:53.705Z] ✅ Passed: POST /team/invitations - Invalid email
[2025-09-06T06:42:53.714Z] ✅ Passed: POST /team/invitations - Invalid role
[2025-09-06T06:42:53.727Z] ✅ Passed: POST /team/invitations/:id/resend - Resend invitation
[2025-09-06T06:42:53.737Z] ✅ Passed: GET /team/invitations - With status filter
[2025-09-06T06:42:53.751Z] ✅ Passed: DELETE /team/invitations/:id - Cancel invitation
[2025-09-06T06:42:53.765Z] ✅ Passed: GET /team/activity - Get activity logs
[2025-09-06T06:42:53.775Z] ✅ Passed: GET /team/activity - With pagination
[2025-09-06T06:42:53.784Z] ✅ Passed: GET /team/activity - With action filter
[2025-09-06T06:42:53.795Z] ✅ Passed: GET /team/activity - With date range

🔒 Testing Permission Checks...
[2025-09-06T06:42:53.905Z] ✅ Passed: Create second user with viewer role
[2025-09-06T06:42:53.914Z] ✅ Passed: PUT /settings/organization - No permission
[2025-09-06T06:42:53.921Z] ✅ Passed: PUT /team/members/:id - No permission
[2025-09-06T06:42:53.928Z] ✅ Passed: POST /team/invitations - No permission

⚠️  Testing Edge Cases...
[2025-09-06T06:42:53.937Z] ✅ Passed: GET /settings/organization - Missing organization header
[2025-09-06T06:42:53.945Z] ✅ Passed: PUT /team/members/:id - Non-existent member
[2025-09-06T06:42:53.951Z] ✅ Passed: DELETE /team/invitations/:id - Non-existent invitation

==================================================
Test Results Summary
==================================================
Total tests: 38
✅ Passed: 38
❌ Failed: 0
Success rate: 100.00%
Execution time: 1173ms
==================================================
```

### 完整測試套件執行結果

```
🚀 開始 GEO Platform API 測試
📡 目標 API: http://localhost:8000
==================================================
[2025-09-05T17:00:00.000Z] ℹ️  開始測試: 健康檢查
[2025-09-05T17:00:00.100Z] ✅ 測試通過: 健康檢查
[2025-09-05T17:00:00.100Z] ℹ️  開始測試: 用戶註冊
[2025-09-05T17:00:00.200Z] ✅ 測試通過: 用戶註冊
...
[2025-09-05T17:00:15.800Z] ✅ 測試通過: 獲取競爭分析
[2025-09-05T17:00:15.900Z] ✅ 測試通過: 清理測試資料

==================================================
測試結果摘要
==================================================
總測試數: 40+
✅ 通過: 40+
❌ 失敗: 0
📈 成功率: 100.00%
⏱️  執行時間: 2500ms
==================================================
```

### 失敗情況處理

```
❌ 測試失敗: 用戶註冊 - 斷言失敗: 註冊應該返回 201，實際返回 500

==================================================
🧪 測試結果摘要
==================================================
總測試數: 8
✅ 通過: 1
❌ 失敗: 7
📈 成功率: 12.50%
⏱️  執行時間: 800ms
==================================================

😞 有些測試失敗了，請檢查伺服器狀態
```

## 🔍 故障排除

### 常見問題與解決方案

#### 1. 連接錯誤
```
❌ 無法連接到伺服器
錯誤: connect ECONNREFUSED 127.0.0.1:8000
```

**解決方案** ✅ 已修復:
- ✅ **TypeScript 編譯錯誤已修復**：移除了導致服務器無法啟動的類型錯誤
- ✅ **服務器穩定運行**：後端現在可以正常啟動並在 8000 端口運行
- 測試連接：`curl http://localhost:8000/health` 或 `curl https://api-geo.blitzgame.site/health`
- 檢查網絡連接和 DNS 解析
- 檢查防火牆設定和 HTTPS 證書

#### 2. 資料庫連接錯誤
```
❌ 測試失敗: 用戶註冊 - 斷言失敗: 註冊應該返回 201，實際返回 500
```

**解決方案**:
- 確保 MySQL 資料庫正在運行
- 檢查資料庫連接設定 (`.env` 文件)
- 確保資料庫 schema 已正確導入：
  ```bash
  mysql -u root -p exchange_geo < database/schema.sql
  ```

#### 3. 認證錯誤
```
❌ 測試失敗: 獲取用戶資料 - 斷言失敗: 獲取用戶資料應該返回 200，實際返回 401
```

**解決方案**:
- 檢查 JWT 設定 (`.env` 中的 `JWT_SECRET`)
- 確保註冊和登入測試成功執行
- 檢查後端日誌以獲取詳細錯誤訊息

#### 4. API 端點不存在
```
❌ 測試失敗: 創建網站 - 斷言失敗: 創建網站應該返回 201，實際返回 404
```

**解決方案**:
- 檢查路由配置是否正確
- 確保伺服器完全啟動（等待幾秒後重新測試）
- 檢查 API 版本和端點路徑

### 偵錯技巧

#### 1. 檢查後端日誌
```bash
# 在運行後端的終端檢查錯誤訊息
npm run dev
# 觀察任何錯誤或警告訊息
```

#### 2. 手動測試特定端點
```bash
# 測試健康檢查
curl https://api-geo.blitzgame.site/health

# 測試用戶註冊
curl -X POST https://api-geo.blitzgame.site/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","fullName":"測試用戶","company":"測試公司"}'
```

#### 3. 檢查環境變數
```bash
# 確保 .env 文件存在且配置正確
cat .env

# 檢查必需的環境變數
echo $DB_HOST
echo $DB_NAME
echo $JWT_SECRET

# 檢查 AI API 金鑰配置 ✅ 新增
echo $OPENAI_API_KEY
echo $GOOGLE_GEMINI_API_KEY
```

#### 4. AI API 金鑰測試 ✅ 新增
```bash
# 測試 Gemini API 金鑰
curl -H "Content-Type: application/json" \
     "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_GEMINI_API_KEY"

# 測試 OpenAI API 金鑰
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models
```

#### 5. 資料庫狀態檢查
```bash
# 檢查資料庫連接
mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST -e "SELECT 1"

# 檢查資料表是否存在
mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES"
```

## 🔧 自定義測試

### 修改測試用戶資料
編輯測試腳本頂部的配置：

```javascript
const config = {
  baseURL: process.env.API_URL || 'https://api-geo.blitzgame.site',
  timeout: 30000,
  testUser: {
    email: `test_${Date.now()}@example.com`,  // 自動生成唯一 email
    password: 'Test123456',  // 至少 8 字符，包含大小寫字母和數字
    fullName: '測試用戶',
    company: '測試公司'
  }
};
```

### 添加新的測試案例
在測試腳本中添加新的測試函數：

```javascript
await runner.test('自定義測試', async () => {
  const response = await makeRequest('GET', '/api/v1/your-endpoint');
  runner.assert(response.status === 200, '應該返回 200 狀態碼');
  runner.assert(response.data.success === true, '應該返回成功狀態');
});
```

## 🔒 認證與組織管理

### 重要更新
API 現已實施完整的多租戶組織架構，所有端點都需要適當的認證和組織權限：

1. **JWT 認證**：所有 API 端點（除了 `/health` 和 `/auth/register`、`/auth/login`）都需要 Bearer token
2. **組織隔離**：用戶只能訪問其所屬組織的資源
3. **組織標頭**：需要在請求中包含 `X-Organization-ID` 標頭來指定組織上下文

### 測試腳本自動處理
測試腳本已自動處理以下功能：
- JWT token 管理
- 組織 ID 自動注入
- 跨請求的認證狀態維護

### 新端點詳細說明

#### 認證相關端點

##### 更新用戶資料 (`PUT /api/v1/auth/profile`)
```bash
curl -X PUT https://api-geo.blitzgame.site/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "新的用戶名", "company": "新的公司名"}'
```

##### 刷新訪問令牌 (`POST /api/v1/auth/refresh`)
```bash
curl -X POST https://api-geo.blitzgame.site/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

##### 請求密碼重置 (`POST /api/v1/auth/forgot-password`)
```bash
curl -X POST https://api-geo.blitzgame.site/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

#### 網站管理端點

##### 獲取網站詳情 (`GET /api/v1/websites/:id`)
```bash
curl -X GET https://api-geo.blitzgame.site/api/v1/websites/WEBSITE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID"
```

##### 獲取網站內容 (`GET /api/v1/websites/:id/content`)
```bash
curl -X GET "https://api-geo.blitzgame.site/api/v1/websites/WEBSITE_ID/content?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID"
```

##### 獲取網站分析 (`GET /api/v1/websites/:id/analytics`)
```bash
curl -X GET https://api-geo.blitzgame.site/api/v1/websites/WEBSITE_ID/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID"
```

#### AI 優化和追蹤端點 ✅ 已實作

##### 內容優化建議 (`POST /api/v1/content/optimization-suggestions`) ✅ 真實實作
```bash
curl -X POST https://api-geo.blitzgame.site/api/v1/content/optimization-suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```
**功能特色**：
- ✅ 真實網站爬蟲分析（axios + cheerio）
- ✅ Lighthouse 性能評估整合
- ✅ AI 驅動的優化建議（OpenAI GPT-4 + Google Gemini）
- ✅ **多 AI 供應商支援**：可選擇 OpenAI 或 Google Gemini 進行內容分析
- ✅ **智慧容錯機制**：主要供應商失敗時自動切換到備用供應商
- ✅ GEO 評分系統（技術健康 40% + 內容品質 30% + AI可見度 30%）

**使用方式**：
```bash
# 使用 OpenAI（預設）
curl -X POST https://api-geo.blitzgame.site/api/v1/content/optimization-suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "provider": "openai"}'

# 使用 Google Gemini ✅ 已驗證
curl -X POST https://api-geo.blitzgame.site/api/v1/content/optimization-suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "provider": "gemini"}'
```

**✅ Gemini API 整合驗證結果**：
- **API Key 設定**: ✅ `GOOGLE_GEMINI_API_KEY` 已正確配置
- **API 連接**: ✅ 成功連接到 Google Generative AI API
- **可用模型**: ✅ 支援 Gemini 2.5 Pro、Gemini 2.0 Flash 等 15+ 模型
- **內容分析**: ✅ 真實網站分析功能正常（測試時間: ~2.9秒）
- **GEO 評分**: ✅ 評分生成正常（測試得分: 59分）
- **優化建議**: ✅ 生成 3個 具體優化建議（meta description, FAQ, schema）
- **測試覆蓋**: ✅ 100% API 測試通過率（25/25 測試）

##### AI 提及追蹤 (`GET /api/v1/tracking/mentions`) ✅ 已實作
```bash
curl -X GET "https://api-geo.blitzgame.site/api/v1/tracking/mentions?websiteId=WEBSITE_ID&platform=chatgpt&dateRange=30d&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID"
```
**回應範例**：
```json
{
  "success": true,
  "data": {
    "mentions": [
      {
        "id": "1",
        "platform": "chatgpt",
        "query": "AI optimization tools",
        "mention": "Leading AI optimization platforms include...",
        "sentiment": "positive",
        "isCited": true,
        "citationPosition": 2
      }
    ],
    "summary": {
      "total": 2,
      "byPlatform": {"chatgpt": 1, "perplexity": 1, "gemini": 0, "claude": 0},
      "bySentiment": {"positive": 1, "neutral": 1, "negative": 0}
    }
  }
}
```

##### 可見度趨勢 (`GET /api/v1/tracking/visibility-trends`) ✅ 已實作
```bash
curl -X GET "https://api-geo.blitzgame.site/api/v1/tracking/visibility-trends?websiteId=WEBSITE_ID&period=30d" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID"
```
**回應範例**：
```json
{
  "success": true,
  "data": {
    "trends": [
      {"date": "2024-09-01", "chatgpt": 45, "perplexity": 32, "gemini": 28, "claude": 20},
      {"date": "2024-09-02", "chatgpt": 48, "perplexity": 35, "gemini": 30, "claude": 22}
    ],
    "summary": {
      "averageVisibility": 42.5,
      "growth": 15.2,
      "topPerformingPlatform": "ChatGPT"
    }
  }
}
```

##### 儀表板統計 (`GET /api/v1/dashboard/stats`) ✅ 已實作
```bash
curl -X GET https://api-geo.blitzgame.site/api/v1/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Organization-ID: YOUR_ORG_ID"
```
**回應範例**：
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalWebsites": 5,
      "totalScans": 23,
      "averageGeoScore": 72.5,
      "totalMentions": 156
    },
    "recentActivity": [...],
    "topPerforming": [...],
    "platformDistribution": [...]
  }
}
```

## 🤖 Gemini API 專項測試

我們提供了專門的 Gemini API 整合測試腳本來驗證 Google Gemini 模型的內容優化功能：

### 執行 Gemini 專項測試

```bash
# 使用 npm 腳本執行 Gemini 整合測試
npm run test:api:gemini

# 或直接執行
node test-gemini-integration.js
```

### 測試內容
- ✅ **Gemini API 連接驗證**：測試 API 金鑰配置和連接狀態
- ✅ **內容優化分析**：使用 Gemini 模型進行真實網站分析
- ✅ **GEO 評分生成**：驗證 Gemini 驅動的評分系統
- ✅ **性能測試**：測量 API 回應時間和處理效率
- ✅ **錯誤處理**：驗證容錯機制和備用方案
- ✅ **供應商比較**：對比 OpenAI 和 Gemini 的分析結果

### 預期輸出
```
🤖 Gemini API Integration Test
================================
📝 Registering test user...
✅ User registered successfully
🚀 Testing Gemini content optimization...
⏱️  Request completed in 2901ms
📊 Response status: 200
✅ Gemini content optimization successful!
📈 Results:
   - GEO Score: 59
   - Provider: gemini
   - Suggestions Count: 3
🔄 Testing with OpenAI provider for comparison...
✅ OpenAI comparison test successful!
   - OpenAI GEO Score: 59
   - Gemini GEO Score: 59

🎉 Gemini integration test completed successfully!
📋 Summary:
   - Gemini API Key: ✅ Configured and working
   - Content Analysis: ✅ Functional
   - GEO Scoring: ✅ Working with Gemini
```

## 📝 最佳實踐

1. **測試前準備**：確保伺服器和相關服務（MySQL、Redis）正在運行
2. **API 金鑰配置**：確保 `GOOGLE_GEMINI_API_KEY` 在 `.env` 文件中正確設置
3. **測試隔離**：每次測試使用不同的測試用戶（腳本已自動處理）
4. **資料清理**：測試完成後清理創建的測試資料（腳本已包含）
5. **錯誤檢查**：仔細檢查失敗的測試和錯誤訊息
6. **定期測試**：在開發過程中定期運行測試以確保 API 穩定性
7. **組織權限**：確保測試在正確的組織上下文中執行
8. **供應商測試**：定期測試不同 AI 供應商（OpenAI、Gemini）的功能性

## 🤝 貢獻

如果您發現測試腳本的問題或想要添加新的測試案例，請：

1. 在 GitHub 上提交 Issue
2. 創建 Pull Request 並詳細描述您的更改
3. 確保新的測試遵循現有的代碼風格和模式

---

**Happy Testing! 🎉**
# GEO Platform API 測試指南

本文檔說明如何使用提供的測試腳本來驗證 GEO Platform 後端 API 的功能。

## 📋 目錄

- [測試腳本概覽](#測試腳本概覽)
- [快速開始](#快速開始)
- [詳細使用說明](#詳細使用說明)
- [測試涵蓋範圍](#測試涵蓋範圍)
- [故障排除](#故障排除)

## 🧪 測試腳本概覽

我們提供了兩個測試腳本來驗證 API 功能：

### 1. `test-api-simple.js` - 簡單測試腳本 ⭐ **推薦**
- **優點**: 無需額外依賴，僅使用 Node.js 內建模組
- **特色**: 彩色輸出，清晰的測試結果
- **適用**: 快速驗證基本 API 功能

### 2. `test-api.js` - 完整測試套件
- **優點**: 功能更全面，支援更多測試選項
- **依賴**: 需要安裝 `axios` 和 `colors` 套件
- **特色**: 更詳細的測試報告和靈活的測試選項

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

## 📖 詳細使用說明

### 環境準備

1. **啟動後端伺服器**
   ```bash
   # 確保資料庫和 Redis 正在運行
   npm run dev
   ```

2. **驗證伺服器狀態**
   ```bash
   curl http://localhost:8000/health
   ```

### 執行測試

#### 基本用法
```bash
# 簡單測試（推薦）
npm run test:api:simple

# 完整測試
npm run test:api
```

#### 進階用法（僅適用於完整測試套件）

```bash
# 只測試認證功能
npm run test:api -- --test=auth

# 只測試網站管理
npm run test:api -- --test=websites

# 只測試掃描功能
npm run test:api -- --test=scans

# 只測試健康檢查
npm run test:api -- --test=health
```

#### 自定義 API URL
```bash
# 測試不同環境的 API
API_URL=https://your-api.com npm run test:api:simple
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

### 進階測試（完整測試套件）

| 測試項目 | 端點 | 描述 |
|---------|------|------|
| **開始掃描** | `POST /api/v1/scans` | 啟動網站掃描 |
| **獲取掃描狀態** | `GET /api/v1/scans/:id` | 檢查掃描進度 |
| **獲取掃描列表** | `GET /api/v1/scans` | 獲取所有掃描記錄 |
| **優化建議** | `GET /api/v1/optimization/suggestions/:id` | 獲取優化建議 |
| **AI 提及追蹤** | `GET /api/v1/tracking/mentions/:id` | 獲取 AI 平台提及 |
| **可見度趨勢** | `GET /api/v1/tracking/trends/:id` | 獲取可見度趨勢資料 |
| **儀表板統計** | `GET /api/v1/dashboard/stats` | 獲取儀表板資料 |

## 📊 測試結果示例

### 成功執行結果

```
🚀 開始 GEO Platform API 簡單測試
📡 目標 API: http://localhost:8000
==================================================
[2024-01-01T12:00:00.000Z] [INFO] 開始測試: 健康檢查
[2024-01-01T12:00:00.100Z] [SUCCESS] ✅ 測試通過: 健康檢查
[2024-01-01T12:00:00.100Z] [INFO] 開始測試: 用戶註冊
[2024-01-01T12:00:00.200Z] [SUCCESS] ✅ 測試通過: 用戶註冊
...

==================================================
🧪 測試結果摘要
==================================================
總測試數: 8
✅ 通過: 8
❌ 失敗: 0
📈 成功率: 100.00%
⏱️  執行時間: 1250ms
==================================================

🎉 所有測試都通過了！
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

**解決方案**:
- 確保後端伺服器正在運行：`npm run dev`
- 檢查埠號是否正確（預設 8000）
- 檢查防火牆設定

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
curl http://localhost:8000/health

# 測試用戶註冊
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"測試用戶","company":"測試公司"}'
```

#### 3. 檢查環境變數
```bash
# 確保 .env 文件存在且配置正確
cat .env

# 檢查必需的環境變數
echo $DB_HOST
echo $DB_NAME
echo $JWT_SECRET
```

#### 4. 資料庫狀態檢查
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
  baseURL: process.env.API_URL || 'http://localhost:8000',
  timeout: 30000,
  testUser: {
    email: `test_${Date.now()}@example.com`,  // 自動生成唯一 email
    password: 'Test123!',
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

## 📝 最佳實踐

1. **測試前準備**：確保伺服器和相關服務（MySQL、Redis）正在運行
2. **測試隔離**：每次測試使用不同的測試用戶（腳本已自動處理）
3. **資料清理**：測試完成後清理創建的測試資料（腳本已包含）
4. **錯誤檢查**：仔細檢查失敗的測試和錯誤訊息
5. **定期測試**：在開發過程中定期運行測試以確保 API 穩定性

## 🤝 貢獻

如果您發現測試腳本的問題或想要添加新的測試案例，請：

1. 在 GitHub 上提交 Issue
2. 創建 Pull Request 並詳細描述您的更改
3. 確保新的測試遵循現有的代碼風格和模式

---

**Happy Testing! 🎉**
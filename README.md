# 沖繩家族旅遊 2026 (Okinawa Family Trip App)

這是一個專為家族旅遊設計的 Mobile-First 單頁應用程式 (SPA)。它結合了行程管理、即時互動許願池、以及模擬 AI 導遊功能，您可以將其部署至 GitHub Pages 供家人使用。

## 🛠 技術堆疊 (Tech Stack)

*   **核心框架**: React 19 (使用 Hooks: `useState`, `useEffect`)
*   **樣式系統**: Tailwind CSS
*   **後端服務**: Firebase v9 (Firestore, Authentication)
*   **建置工具**: Vite + TypeScript
*   **部署平台**: GitHub Pages (透過 GitHub Actions 自動部署)

---

## 📂 專案結構與路由

本專案採用 **SPA (Single Page Application)** 架構，透過 React State (`activeTab`) 進行視圖切換，提供最流暢的操作體驗。

> [!IMPORTANT]
> **架構更新 (Client-Side)**:
> 本專案已針對 GitHub Pages 進行最佳化，完全採用前端架構。
> *   **Firebase Config**: 直接透過 `import.meta.env` 讀取環境變數。
> *   **Admin 驗證**: 前端直接比對管理員 Email 清單 (`VITE_ADMIN_EMAILS`)。

---

## ✨ 部署教學 (Deployment Guide)

本專案已設定好 GitHub Actions，只要將程式碼推送到 GitHub，即會自動部署。

### 步驟 1: 設定環境變數 (Secrets)

請前往 GitHub 儲存庫的 **Settings** > **Secrets and variables** > **Actions**，點擊 **New repository secret**，新增以下變數：

| Secret Name                         | 說明                    | 範例值                          |
| :---------------------------------- | :---------------------- | :------------------------------ |
| `VITE_FIREBASE_API_KEY`             | Firebase API Key        | `AIzaSy...`                     |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain    | `xxx.firebaseapp.com`           |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase Project ID     | `xxx`                           |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Storage Bucket          | `xxx.appspot.com`               |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID               | `123456...`                     |
| `VITE_FIREBASE_APP_ID`              | App ID                  | `1:123...`                      |
| `VITE_ADMIN_EMAILS`                 | 管理員 Email (逗號分隔) | `admin@gmail.com,mom@gmail.com` |
| `VITE_GEMINI_API_KEY`               | AI API Key (預留功能)   | `AIzaSy...`                     |
| `VITE_TRIP_START_DATE`              | 出發日期                | `2026-07-01T00:00:00+09:00`     |

### 步驟 2: 開啟 GitHub Pages 權限

1.  前往儲存庫的 **Settings** > **Pages**。
2.  在 **Build and deployment** 區塊：
    *   **Source**: 選擇 `GitHub Actions`。
3.  設定完成後，當您推送程式碼至 `main` 分支，GitHub Action 就會自動開始建置並部署。

---

## 💻 本地開發 (Development)

1.  **安裝依賴套件**:
    ```bash
    npm install
    ```

2.  **設定環境變數**:
    複製 `.env.example` 為 `.env`，並填入您的 Firebase 設定。
    ```bash
    cp .env.example .env
    ```

3.  **啟動開發伺服器**:
    ```bash
    npm run dev
    ```

4.  **建置生產版本**:
    ```bash
    npm run build
    ```

---

## ⚠️ 常見問題

### 頁面出現空白或 404？
請檢查 `vite.config.ts` 中的 `base` 設定是否與您的儲存庫名稱一致：
```typescript
base: '/你的儲存庫名稱/',
```

### 無法編輯行程？
請確認您登入的 Google 帳號 Email 是否已加入 `VITE_ADMIN_EMAILS` 環境變數中。

---

## 📝 授權

此專案為個人練習與家族旅遊使用，程式碼可自由修改與擴充。
Happy Traveling! ✈️🌊

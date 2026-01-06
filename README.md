# 沖繩家族旅遊 2026 (Okinawa Family Trip App)

這是一個專為家族旅遊設計的 Mobile-First 單頁應用程式 (SPA)。它結合了行程管理、即時互動許願池、以及模擬 AI 導遊功能，旨在提供一個美觀且實用的旅遊輔助工具。

## 🛠 技術堆疊 (Tech Stack)

*   **核心框架**: React 19 (使用 Hooks: `useState`, `useEffect`, `useRef`)
*   **樣式系統**: Tailwind CSS (本地建置)
*   **圖示庫**: Lucide React
*   **後端服務**: Firebase v9 (Modular SDK)
    *   **Authentication**: Google 登入
    *   **Firestore**: 即時資料庫 (用於許願池同步)
*   **建置工具**: Vite + TypeScript

---

## 📂 專案結構與路由 (Architecture & Routing)

本專案採用 **SPA (Single Page Application)** 架構，不使用傳統 URL 路由切換頁面，而是透過 React State (`activeTab`) 進行視圖切換，以提供最流暢的 App 操作體驗。

| 視圖/路由 (View) | 對應組件 (Component) | 功能描述                    | 權限控管                  |
| :--------------- | :------------------- | :-------------------------- | :------------------------ |
| **Login**        | `<LoginView />`      | 登入畫面                    | 未登入時強制顯示          |
| **Itinerary**    | `<ItineraryView />`  | 每日行程表、時間軸          | 全員可讀 / **管理員可寫** |
| **Wishlist**     | `<WishlistView />`   | 景點許願池 (Firestore)      | **登入者可讀寫**          |
| **Map**          | `<MapView />`        | 景點地圖 (Google Maps/Mock) | 全員可讀                  |
| **Assistant**    | `<AssistantView />`  | AI 智慧導遊對話視窗         | 全員可讀                  |

> [!IMPORTANT]
> **架構變更 (BFF Pattern)**:
> 為了極致的安全，本專案已改為 Backend-for-Frontend 架構。
> *   **Firebase Config**: 前端不包含 Key，改為執行時向 `/.netlify/functions/get-config` 獲取。
> *   **Admin 驗證**: 前端不包含 Email 列表，改為向 `/.netlify/functions/verify-admin` 驗證。

---

## ✨ 目前功能 (Features)

### 1. 核心介面 (UI/UX)
*   **Mobile-First 設計**: 底部導航列 (Tab Bar) 方便單手操作。
*   **視覺風格**: 採用「海洋藍」與「青色」漸層，搭配大量的圓角 (Rounded-xl/3xl)、陰影 (Shadow) 與毛玻璃效果 (Backdrop-blur)，營造現代 iOS App 的質感。
*   **動態 Header**: 顯示當前天氣 (Mock) 與匯率資訊。

### 2. 行程表 (Itinerary)
*   **三天行程切換**: 頂部快速切換 Day 1 / Day 2 / Day 3。
*   **時間軸視圖**: 清晰的時間節點與視覺化的連接線。
*   **活動類型圖示**: 自動根據類型 (吃、住、行、玩) 顯示對應顏色的圖示。
*   **權限控管**:
    *   一般使用者：僅能瀏覽行程。
    *   **管理員**：可點擊現有行程進行「編輯」，或使用懸浮按鈕「新增」行程。

### 3. Firebase 設定 (Firestore Rules)
為了讓許願池功能正常運作，請前往 Firebase Console > Firestore Database > Rules，貼上以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 輔助函式
    function isSignedIn() {
      return request.auth != null;
    }

    // 許願池：只有登入者可讀寫
    match /wishlist/{document=**} {
      allow read, write: if isSignedIn();
    }
  }
}
```

### 4. 許願池 (Wishlist)
*   **即時同步**: 使用 Firestore `onSnapshot` 監聽，家族成員新增願望或投票時，所有人的畫面會即時更新。
*   **投票機制**: 點擊愛心即可投票，列表會自動依照票數高低排序。
*   **無縫體驗**: 透過 Optimistic UI 或快速反饋，讓操作感覺不到延遲。

### 5. AI 導遊 (Assistant)
*   **模擬對話**: 內建關鍵字偵測 (天氣、美食、海邊、伴手禮)，模擬 AI 回覆。
*   **打字機效果**: 模擬 AI 思考延遲 (setTimeout)，提升真實感。

### 6. 地圖 (Map)
*   **UI 佔位符**: 目前為靜態展示介面，包含模擬的「目前位置」浮動卡片與背景動畫。

---

## 💻 本地開發 (Development)

> [!NOTE]
> 請使用 `npm run dev` (已設定為 `netlify dev`) 來啟動，這樣才能同時模擬前端與後端 Functions。

1.  **安裝依賴套件**:
    ```bash
    npm install
    ```

2.  **啟動開發伺服器**:
    ```bash
    npm run dev
    ```

3.  **建置生產版本**:
    ```bash
    npm run build
    ```

---

## 🚀 自動部署 (Deployment)

本專案建議使用 **Netlify** 進行部署。

1.  **新增網站**:
    *   登入 Netlify 並選擇 "Add new site" > "Import an existing project"。
    *   連結您的 GitHub 儲存庫。

2.  **確認設定**:
    *   Netlify 會自動讀取 `netlify.toml` 設定檔。
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
    *   **Functions directory**: `netlify/functions` (自動偵測)

3.  **環境變數**:
    *   請參考下方「重要設定與注意事項」區塊，在 Netlify 設定所有必要的環境變數。

4.  **部署**:
    *   點擊 "Deploy site" 即可。

---

## ⚠️ 重要設定與注意事項 (Configuration)

### 1. 設定管理員權限 (Admin Access)
為了防止行程被誤刪或隨意修改，行程編輯功能僅限「管理員」使用。
請在 `.env` 或 Netlify 環境變數中設定 `VITE_ADMIN_EMAILS`，多個 Email 請以逗號分隔。

```bash
VITE_ADMIN_EMAILS=kevin@example.com,wife@example.com
```

*   如果您的 Email 不在列表中，登入後將**看不到**編輯按鈕與新增按鈕。

### 2. 環境變數設定 (Environment Variables)

為了安全起見，請勿將 API Key 直接提交到版本控制系統。
本專案使用 `.env` 檔案管理敏感資訊。

1.  **複製範本**:
    ```bash
    cp .env.example .env
    ```
2.  **填入數值**: 在 `.env` 中填入您的 Firebase 設定。
3.  **Netlify 部署設定**:
    *   在 Netlify 後台，進入 **Site configuration** > **Environment variables**。
    *   新增上述變數 (如 `VITE_FIREBASE_API_KEY`, `FIREBASE_API_KEY` 等) 與對應數值。
    *   注意：因為採用 BFF 架構，部分 Key 可能需要無 `VITE_` 前綴的版本供 Functions 使用，具體請參考 `netlify.toml` 或 Functions 程式碼。

---

## 🎨 設計理念 (Design Philosophy)

1.  **空氣感 (Airy)**: 使用 `bg-slate-50` 作為底色，避免純白刺眼，卡片間距寬鬆，減少資訊擁擠感。
2.  **明確的視覺階層**:
    *   主要行動 (Primary Action) 使用漸層色 (Gradient)。
    *   次要資訊使用灰色文字 (`text-slate-500`)。
    *   活動類型使用色彩編碼 (橘色=吃, 靛色=住, 藍色=行, 粉色=玩)。
3.  **微互動 (Micro-interactions)**: 按鈕點擊時有 `active:scale-95` 的縮放效果，增加操作的手感。

---

## 🚀 未來擴充藍圖 (Roadmap & Ideas)

如果您想繼續開發此專案，以下是一些建議的方向：

### 短期優化
*   **真實地圖整合**: 將 Map View 替換為 Google Maps Embed API 或 Leaflet (OpenStreetMap)，標記行程中的景點位置。
*   **預算計算機**: 在行程項目中加入「預計花費」欄位，自動計算整趟旅程的總預算。
*   **相簿功能**: 在每一天的行程下方，允許使用者上傳當天拍的照片 (需整合 Firebase Storage)。

### 長期功能
*   **接軌真實 AI**: 將 `AssistantView` 的模擬邏輯替換為呼叫 **Gemini API** 或 **OpenAI API**，讓導遊能真正回答關於沖繩的歷史、交通與導航問題。
*   **PWA 支援**: 加入 `manifest.json` 與 Service Worker，讓家人可以將 App 安裝到手機桌面，並支援離線查看行程 (Offline Support)。
*   **即時匯率**: 串接匯率 API，讓 Header 的匯率資訊變成即時數據。
*   **多人協作編輯**: 開放「建議模式」，讓非管理員也能對行程提出修改建議，由管理員審核。

---

## 📝 授權

此專案為個人練習與家族旅遊使用，程式碼可自由修改與擴充。
Happy Traveling! ✈️🌊

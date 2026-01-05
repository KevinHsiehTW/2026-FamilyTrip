# 沖繩家族旅遊 2024 (Okinawa Family Trip App)

這是一個專為家族旅遊設計的 Mobile-First 單頁應用程式 (SPA)。它結合了行程管理、即時互動許願池、以及模擬 AI 導遊功能，旨在提供一個美觀且實用的旅遊輔助工具。

## 🛠 技術堆疊 (Tech Stack)

*   **核心框架**: React 19 (使用 Hooks: `useState`, `useEffect`, `useRef`)
*   **樣式系統**: Tailwind CSS (利用 CDN 快速載入，無需編譯設定)
*   **圖示庫**: Lucide React
*   **後端服務**: Firebase v9 (Modular SDK)
    *   **Authentication**: Google 登入
    *   **Firestore**: 即時資料庫 (用於許願池同步)
*   **模組載入**: ES Modules (透過 `esm.sh` 載入，無需 Node.js Build Step 即可運行)

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

### 3. 許願池 (Wishlist)
*   **即時同步**: 使用 Firestore `onSnapshot` 監聽，家族成員新增願望或投票時，所有人的畫面會即時更新。
*   **投票機制**: 點擊愛心即可投票，列表會自動依照票數高低排序。
*   **無縫體驗**: 透過 Optimistic UI 或快速反饋，讓操作感覺不到延遲。

### 4. AI 導遊 (Assistant)
*   **模擬對話**: 內建關鍵字偵測 (天氣、美食、海邊、伴手禮)，模擬 AI 回覆。
*   **打字機效果**: 模擬 AI 思考延遲 (setTimeout)，提升真實感。

### 5. 地圖 (Map)
*   **UI 佔位符**: 目前為靜態展示介面，包含模擬的「目前位置」浮動卡片與背景動畫。

---

## ⚠️ 重要設定與注意事項 (Configuration)

### 1. 設定管理員權限 (Admin Access)
為了防止行程被誤刪或隨意修改，行程編輯功能僅限「管理員」使用。
**請務必修改 `App.tsx` 中的設定：**

```typescript
// App.tsx
// TODO: 請將您的 Google Email 加入此陣列
const ADMIN_EMAILS = [
  "your.actual.email@gmail.com", 
  "another.admin@example.com"
];
```

*   如果您的 Email 不在列表中，登入後將**看不到**編輯按鈕與新增按鈕。

### 2. Firebase 連線設定
專案目前使用佔位符，若要啟用「登入」與「許願池」功能，需在 Firebase Console 建立專案並替換設定。

1.  前往 [Firebase Console](https://console.firebase.google.com/)。
2.  建立新專案，啟用 **Authentication** (Google Sign-In) 與 **Firestore Database**。
3.  複製設定檔並貼上至 `firebase.ts`：

```typescript
// firebase.ts
const firebaseConfig = {
  apiKey: "您的_API_KEY",
  authDomain: "您的專案.firebaseapp.com",
  projectId: "您的專案ID",
  // ... 其他設定
};
```

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

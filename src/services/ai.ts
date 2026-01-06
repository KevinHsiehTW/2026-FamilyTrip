import { ItineraryItem } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// using gemini-2.5-flash as verified working
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export const generateTripResponse = async (
    question: string,
    contextData: Record<number, ItineraryItem[]>
): Promise<string> => {
    if (!API_KEY) {
        return "尚未設定 API Key。請確認 .env 設定。";
    }

    // Simplify context for token limit efficiency
    const contextString = JSON.stringify(contextData, null, 2);

    const prompt = `
你是一位專業的沖繩私人導遊 AI。
你擁有以下這次家庭旅遊的詳細行程資料（JSON 格式）：
${contextString}

請根據以上資料回答使用者的問題。
規則：
1. 語氣要親切、熱情，像家人一樣。
2. 如果行程中沒有提到的資訊，請回答「行程中沒有提到」，不要隨意編造，但可以提供一般性的沖繩旅遊建議。
3. 回答盡量簡潔有力，重點清晰。
4. 使用繁體中文 (台灣)。

使用者問題：${question}
`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP Error: ${response.status}`);
        }

        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!answer) {
            throw new Error("No candidates returned from API");
        }

        return answer;

    } catch (error: any) {
        console.error("Gemini AI Error:", error);

        const errorMessage = error?.message || "";
        if (errorMessage.includes("400") || errorMessage.includes("API key")) {
            return "連線失敗：API Key 可能無效。請檢查 .env 檔案中的設定。";
        }
        if (errorMessage.includes("429")) {
            return "連線失敗：請求次數過多 (Quota Exceeded)，請稍後再試。";
        }

        return `抱歉，我現在有點頭暈 (連線錯誤：${errorMessage})，請稍後再試。`;
    }
};

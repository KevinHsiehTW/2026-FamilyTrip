import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

export interface PackingItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface PackingCategory {
    id: string;
    name: string;
    items: PackingItem[];
}

export interface PackingListData {
    updatedAt: number;
    categories: PackingCategory[];
}

const DEFAULT_LIST: PackingCategory[] = [
    {
        id: "cat_docs",
        name: "證件 / 錢包 (最重要的隨身物品)",
        items: [
            { id: "d1", text: "護照：確認效期需 > 6個月", checked: false },
            { id: "d2", text: "台灣駕照：自駕必備，正本也要帶", checked: false },
            { id: "d3", text: "日文譯本：自駕必備", checked: false },
            { id: "d4", text: "交通卡：搭乘電車、超商支付、投販賣機，避免滿手零錢", checked: false },
            { id: "d5", text: "信用卡：確認海外回饋高、免手續費的卡片，建議帶兩張不同發卡組織", checked: false },
            { id: "d6", text: "日幣現金：準備零錢搭車或投販賣機", checked: false },
            { id: "d7", text: "日本行動支付 paypay 設定：iPass Money、玉山行動支付、全支付⚠️，擇一", checked: false },
            { id: "d8", text: "機票行程單：電子/紙本", checked: false },
            { id: "d9", text: "訂房憑證：Airbnb App", checked: false },
            { id: "d10", text: "租車憑證：電子", checked: false },
            { id: "d11", text: "KKday 行程表：電子", checked: false },
            { id: "d12", text: "eSIM", checked: false },
            { id: "d13", text: "台幣現金：回國用", checked: false }
        ]
    },
    {
        id: "cat_elec",
        name: "電子產品 (電池需隨身)",
        items: [
            { id: "e1", text: "手機", checked: false },
            { id: "e2", text: "充電線 & 充電頭：手機、手錶、刮鬍刀等", checked: false },
            { id: "e3", text: "行動電源：充滿電、隨身帶", checked: false },
            { id: "e4", text: "相機", checked: false },
            { id: "e5", text: "記憶卡：確認可用空間", checked: false },
            { id: "e6", text: "筆電、HDMI 轉接線", checked: false },
            { id: "e7", text: "耳機：有線/藍牙", checked: false },
            { id: "e8", text: "刮鬍刀", checked: false }
        ]
    },
    {
        id: "cat_wear",
        name: "衣物 (洋蔥式穿法)",
        items: [
            { id: "c1", text: "換洗衣物 (依天數)", checked: false },
            { id: "c2", text: "睡衣", checked: false },
            { id: "c3", text: "內衣褲 / 襪子：建議多帶一套", checked: false },
            { id: "c4", text: "薄外套：早晚溫差/機上", checked: false },
            { id: "c5", text: "好走的鞋", checked: false },
            { id: "c6", text: "太陽眼鏡：開車南下西曬嚴重", checked: false },
            { id: "c7", text: "禦寒衣物：毛帽、手套、圍巾", checked: false }
        ]
    },
    {
        id: "cat_life",
        name: "生活用品與醫藥",
        items: [
            { id: "l1", text: "牙刷 / 牙膏", checked: false },
            { id: "l2", text: "個人保養品 (洗卸/保濕)", checked: false },
            { id: "l3", text: "防曬乳", checked: false },
            { id: "l4", text: "常備藥品 (感冒/止痛/腸胃)", checked: false },
            { id: "l5", text: "塑膠袋 (裝髒衣/垃圾)", checked: false },
            { id: "l6", text: "雨具 (摺疊傘/雨衣)", checked: false },
            { id: "l7", text: "面紙 / 濕紙巾 / 酒精噴霧", checked: false },
            { id: "l8", text: "牙線", checked: false },
            { id: "l9", text: "口罩", checked: false }
        ]
    },
    {
        id: "cat_todo",
        name: "行前待辦 / 其他",
        items: [
            { id: "t1", text: "倒垃圾 / 關瓦斯 / 關電源", checked: false },
            { id: "t2", text: "預約機場接送", checked: false },
            { id: "t3", text: "投保旅平險＋不便險", checked: false },
            { id: "t4", text: "台灣自動通關流程 (教長輩)", checked: false },
            { id: "t5", text: "VJW (日本入境填寫)", checked: false },
            { id: "t6", text: "設定旅遊定位分享", checked: false },
            { id: "t7", text: "購物行程規劃", checked: false },
            { id: "t8", text: "提前 Check-in", checked: false },
            { id: "t9", text: "確認票券領票位置", checked: false },
            { id: "t10", text: "確認行李打包、行李束帶綁好", checked: false },
        ]
    }
];

export const getUserPackingList = async (userId: string): Promise<PackingListData> => {
    if (!db) return { updatedAt: Date.now(), categories: DEFAULT_LIST };

    try {
        const docRef = doc(db, "packing_lists", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as PackingListData;
        } else {
            // New user, return default (don't save yet to avoid junk, save on first edit)
            return {
                updatedAt: Date.now(),
                categories: DEFAULT_LIST
            };
        }
    } catch (error) {
        console.error("Error fetching packing list:", error);
        return { updatedAt: Date.now(), categories: DEFAULT_LIST };
    }
};

export const saveUserPackingList = async (userId: string, data: PackingListData): Promise<void> => {
    if (!db) return;

    try {
        const docRef = doc(db, "packing_lists", userId);
        await setDoc(docRef, data);
    } catch (error) {
        console.error("Error saving packing list:", error);
        throw error;
    }
};

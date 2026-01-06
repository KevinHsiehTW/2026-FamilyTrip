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
        name: "證件/錢包",
        items: [
            { id: "i1", text: "護照 (效期>6個月)", checked: false },
            { id: "i2", text: "駕照/日文譯本", checked: false },
            { id: "i3", text: "日幣現金", checked: false },
            { id: "i4", text: "信用卡 (海外回饋)", checked: false },
            { id: "i5", text: "機票/訂房憑證", checked: false },
            { id: "i6", text: "網卡/Wifi機", checked: false }
        ]
    },
    {
        id: "cat_elec",
        name: "電子產品",
        items: [
            { id: "i7", text: "手機", checked: false },
            { id: "i8", text: "充電線/頭", checked: false },
            { id: "i9", text: "行動電源", checked: false },
            { id: "i10", text: "相機/記憶卡", checked: false },
            { id: "i11", text: "轉接頭 (日本不用)", checked: false },
            { id: "i12", text: "耳機", checked: false }
        ]
    },
    {
        id: "cat_clothes",
        name: "衣物",
        items: [
            { id: "i13", text: "換洗衣物", checked: false },
            { id: "i14", text: "睡衣", checked: false },
            { id: "i15", text: "內衣褲", checked: false },
            { id: "i16", text: "薄外套 (早晚溫差)", checked: false },
            { id: "i17", text: "好走的鞋", checked: false },
            { id: "i18", text: "泳衣/泳帽 (玩水用)", checked: false }
        ]
    },
    {
        id: "cat_life",
        name: "生活用品",
        items: [
            { id: "i19", text: "牙刷/牙膏", checked: false },
            { id: "i20", text: "個人保養品", checked: false },
            { id: "i21", text: "防曬乳/墨鏡", checked: false },
            { id: "i22", text: "常備藥品", checked: false },
            { id: "i23", text: "塑膠袋 (裝髒衣)", checked: false },
            { id: "i24", text: "雨具 (摺疊傘)", checked: false }
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

import { doc, setDoc, writeBatch, collection } from "firebase/firestore";
import { db } from "../../firebase";

export interface ItineraryItem {
    id: string;
    time: string;
    title: string;
    type: 'food' | 'stay' | 'move' | 'play';
    description: string;
    location?: string;
    cost?: string;
}

export interface DaySchedule {
    day: number;
    date: string;
    items: ItineraryItem[];
}

const INITIAL_DATA: DaySchedule[] = [
    {
        day: 1,
        date: "2026-02-03 (二)",
        items: [
            { id: "d1-1", time: "08:15", title: "高雄起飛 (SL 0390)", type: "move", description: "前往那霸機場，預計 10:50 抵達。手提 7kg / 託運 20kg。" },
            { id: "d1-2", time: "11:30", title: "辦理入境 & 接駁", type: "move", description: "預約 ecbo cloak 或行李運送服務。" },
            { id: "d1-3", time: "12:30", title: "午餐：豬肉蛋飯糰", type: "food", description: "牧志市場店 (Pork Tamago Onigiri)。經典沖繩美食。" },
            { id: "d1-4", time: "14:00", title: "國際通漫遊", type: "play", description: "那霸市區逛街，單軌沿線景點。" },
            { id: "d1-5", time: "15:00", title: "入住：As Bld", type: "stay", description: "住宿 Check-in (那霸市區)。" },
            { id: "d1-6", time: "18:00", title: "晚餐：燒肉大餐", type: "food", description: "慶祝第一晚！(找有非牛/非海鮮選項的店)" },
        ]
    },
    {
        day: 2,
        date: "2026-02-04 (三)",
        items: [
            { id: "d2-1", time: "08:30", title: "租車取車", type: "move", description: "預計租用 2 天 (Day 2-3)。10人需兩台車或中巴。" },
            { id: "d2-2", time: "11:00", title: "午餐：海人食堂", type: "food", description: "讀谷村海鮮丼飯。(需確認非海鮮備案)" },
            { id: "d2-3", time: "14:00", title: "美國村 (American Village)", type: "play", description: "妹妹指定行程！逛街、拍照、異國風情。" },
            { id: "d2-4", time: "18:00", title: "晚餐：中部美食", type: "food", description: "美國村周邊或返回那霸途中。" },
            { id: "d2-5", time: "20:00", title: "返回那霸", type: "move", description: "欣賞夜景後駕車返回市區住宿。" },
        ]
    },
    {
        day: 3,
        date: "2026-02-05 (四)",
        items: [
            { id: "d3-1", time: "08:00", title: "早餐：泊港魚市場", type: "food", description: "Tomari Iyumachi 吃海鮮。(或買早餐車上吃)" },
            { id: "d3-2", time: "10:00", title: "南部自駕：奧武島", type: "play", description: "貓咪之島，必吃天婦羅。" },
            { id: "d3-3", time: "13:00", title: "DMM 水族館 / iias", type: "play", description: "新開幕水族館與購物中心。" },
            { id: "d3-4", time: "15:30", title: "瀨長島 Umikaji Terrace", type: "food", description: "海景鬆餅，近距離看飛機降落。" },
            { id: "d3-5", time: "17:00", title: "還車", type: "move", description: "將油加滿並歸還租車。" },
            { id: "d3-6", time: "18:30", title: "晚餐：超市或市區", type: "food", description: "超市採買 (San-A / Union) 或市區餐廳。" },
        ]
    },
    {
        day: 4,
        date: "2026-02-06 (五)",
        items: [
            { id: "d4-1", time: "08:30", title: "慶良間群島賞鯨", type: "play", description: "KKday 行程 (上午)。記得吃暈船藥！" },
            { id: "d4-2", time: "12:30", title: "午餐：簡單吃", type: "food", description: "市區輕食或便利商店。" },
            { id: "d4-3", time: "14:00", title: "自由活動 / 補貨", type: "play", description: "休息或前往國際通補買伴手禮。" },
            { id: "d4-4", time: "18:00", title: "晚餐：超市巡禮", type: "food", description: "San-A / Union / MaxValu 買好料回住宿吃。" },
        ]
    },
    {
        day: 5,
        date: "2026-02-07 (六)",
        items: [
            { id: "d5-1", time: "08:00", title: "北部一日遊 (KKday)", type: "move", description: "巴士接送，輕鬆玩。不用開車。" },
            { id: "d5-2", time: "10:30", title: "美麗海水族館", type: "play", description: "黑潮之海，鯨鯊餵食秀 (停留 3hr+)。" },
            { id: "d5-3", time: "14:00", title: "古宇利島 & 萬座毛", type: "play", description: "跨海大橋與象鼻岩。" },
            { id: "d5-4", time: "19:00", title: "晚餐：鳥貴族", type: "food", description: "連鎖平價串燒居酒屋，氣氛輕鬆。" },
        ]
    },
    {
        day: 6,
        date: "2026-02-08 (日)",
        items: [
            { id: "d6-1", time: "08:00", title: "整理行李 Check-out", type: "move", description: "10:00 前此退房。" },
            { id: "d6-2", time: "09:00", title: "波上宮", type: "play", description: "海邊神社，祈求平安。" },
            { id: "d6-3", time: "11:00", title: "最後補貨", type: "play", description: "琉貿百貨 (配眼鏡?) 或國際通。" },
            { id: "d6-4", time: "15:30", title: "前往機場", type: "move", description: "預約接送或搭單軌。" },
            { id: "d6-5", time: "17:30", title: "那霸起飛 (CI 133)", type: "move", description: "20:25 抵達高雄。手提 7kg / 託運 23kg (2件)。" },
        ]
    }
];

export const importInitialData = async () => {
    if (!db) throw new Error("Database not initialized");

    const batch = writeBatch(db);

    INITIAL_DATA.forEach((daySchedule) => {
        const docRef = doc(collection(db, "itinerary"), `day_${daySchedule.day}`);
        batch.set(docRef, daySchedule);
    });

    await batch.commit();
    console.log("Itinerary seeded successfully!");
};

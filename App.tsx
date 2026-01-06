import React, { useState, useEffect, useRef } from 'react';
import {
    Map,
    Calendar,
    Heart,
    MessageCircle,
    Sun,
    JapaneseYen,
    Coffee,
    BedDouble,
    Car,
    Camera,
    Send,
    User,
    Bot,
    LogOut,
    Plane,
    CloudSun,
    Plus,
    X,
    Clock,
    Type as TypeIcon,
    AlignLeft,
    Check,
    Save,
    Pencil
} from 'lucide-react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    increment,
    Timestamp
} from 'firebase/firestore';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

// --- TYPES ---

type Tab = 'itinerary' | 'wishlist' | 'map' | 'assistant';

interface ItineraryItem {
    id: number;
    time: string;
    title: string;
    type: 'food' | 'stay' | 'move' | 'play';
    description: string;
}

interface WishlistItem {
    id: string;
    name: string;
    votes: number;
}

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
}

// --- CONFIGURATION ---



// --- MOCK DATA ---

const MOCK_ITINERARY: Record<number, ItineraryItem[]> = {
    1: [
        { id: 1, time: '10:00', title: '抵達那霸機場', type: 'move', description: '前往 OTS 租車公司取車。' },
        { id: 2, time: '12:30', title: '午餐：豬肉蛋飯糰', type: 'food', description: '品嚐機場分店或附近的超人氣飯糰。' },
        { id: 3, time: '14:30', title: '美國村 (American Village)', type: 'play', description: '美濱區逛街購物，感受濃濃美式風情。' },
        { id: 4, time: '17:30', title: '日落海灘', type: 'play', description: '晚餐前在沙灘散步，欣賞美麗夕陽。' },
        { id: 5, time: '19:00', title: '晚餐：牛排 House 88', type: 'food', description: '體驗經典的沖繩美式牛排。' },
        { id: 6, time: '21:00', title: 'Vessel Hotel Campana', type: 'stay', description: '飯店 Check-in 休息，享受海景設施。' },
    ],
    2: [
        { id: 7, time: '09:00', title: '開車前往北部', type: 'move', description: '沿著海岸線前往本部半島。' },
        { id: 8, time: '10:30', title: '美麗海水族館', type: 'play', description: '觀賞著名的鯨鯊與黑潮之海。' },
        { id: 9, time: '13:00', title: '午餐：岸本食堂', type: 'food', description: '品嚐百年老店的沖繩麵 (Okinawa Soba)。' },
        { id: 10, time: '15:00', title: '古宇利大橋', type: 'play', description: '行駛在絕美翡翠綠海面上的跨海大橋。' },
        { id: 11, time: '17:00', title: '名護鳳梨園', type: 'play', description: '搭乘鳳梨造型車，享用鳳梨點心。' },
        { id: 12, time: '19:30', title: '晚餐：阿古豬涮涮鍋', type: 'food', description: '品嚐沖繩特產高級豬肉。' },
    ],
    3: [
        { id: 13, time: '10:00', title: '首里城公園', type: 'play', description: '探訪琉球王國的歷史古蹟。' },
        { id: 14, time: '12:30', title: '國際通', type: 'play', description: '最後採買伴手禮與品嚐街頭小吃。' },
        { id: 15, time: '15:00', title: '瀨長島 Umikaji Terrace', type: 'food', description: '享用海景鬆餅，近距離看飛機起降。' },
        { id: 16, time: '17:00', title: '還車', type: 'move', description: '將油加滿並歸還租車。' },
        { id: 17, time: '19:00', title: '前往機場', type: 'move', description: '搭機返家，結束美好旅程。' },
    ]
};

// --- COMPONENTS ---

// 1. Icon Helper
const ActivityIcon = ({ type }: { type: ItineraryItem['type'] }) => {
    switch (type) {
        case 'food': return <div className="p-2 bg-orange-100 text-orange-500 rounded-full"><Coffee size={18} /></div>;
        case 'stay': return <div className="p-2 bg-indigo-100 text-indigo-500 rounded-full"><BedDouble size={18} /></div>;
        case 'move': return <div className="p-2 bg-blue-100 text-blue-500 rounded-full"><Car size={18} /></div>;
        case 'play': return <div className="p-2 bg-pink-100 text-pink-500 rounded-full"><Camera size={18} /></div>;
    }
};

// 2. Views
const ItineraryView = ({
    itinerary,
    setItinerary,
    isAdmin
}: {
    itinerary: typeof MOCK_ITINERARY,
    setItinerary: React.Dispatch<React.SetStateAction<typeof MOCK_ITINERARY>>,
    isAdmin: boolean
}) => {
    const [day, setDay] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [newItem, setNewItem] = useState<{
        time: string;
        title: string;
        type: ItineraryItem['type'];
        description: string;
    }>({
        time: '12:00',
        title: '',
        type: 'play',
        description: ''
    });

    // Open modal for editing
    const handleEditClick = (item: ItineraryItem) => {
        if (!isAdmin) return;
        setEditingId(item.id);
        setNewItem({
            time: item.time,
            title: item.title,
            type: item.type,
            description: item.description
        });
        setIsModalOpen(true);
    };

    // Open modal for creating
    const handleCreateClick = () => {
        setEditingId(null);
        setNewItem({ time: '12:00', title: '', type: 'play', description: '' });
        setIsModalOpen(true);
    };

    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title.trim()) return;

        let updatedDayItems = [...itinerary[day]];

        if (editingId) {
            // Edit existing
            updatedDayItems = updatedDayItems.map(item =>
                item.id === editingId
                    ? { ...item, ...newItem }
                    : item
            );
        } else {
            // Add new
            const item: ItineraryItem = {
                id: Date.now(),
                ...newItem
            };
            updatedDayItems.push(item);
        }

        // Sort by time string
        updatedDayItems.sort((a, b) => a.time.localeCompare(b.time));

        setItinerary({
            ...itinerary,
            [day]: updatedDayItems
        });

        // Reset and close
        setNewItem({ time: '12:00', title: '', type: 'play', description: '' });
        setEditingId(null);
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col h-full pb-24 relative">
            {/* Day Toggles */}
            <div className="flex justify-center gap-4 p-4 sticky top-0 bg-slate-50/95 backdrop-blur z-10">
                {[1, 2, 3].map((d) => (
                    <button
                        key={d}
                        onClick={() => setDay(d)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${day === d
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-cyan-200'
                            : 'bg-white text-slate-500 hover:bg-slate-100'
                            }`}
                    >
                        第 {d} 天
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="px-6 space-y-6 animate-fade-in overflow-y-auto pb-20">
                {itinerary[day].map((item, idx) => (
                    <div key={item.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className="text-xs font-semibold text-slate-400 mb-1 w-10 text-right">{item.time}</div>
                            <div className="h-full w-0.5 bg-slate-200 group-last:bg-transparent relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 ring-4 ring-slate-50"></div>
                            </div>
                        </div>
                        <div className="flex-1 pb-6">
                            <div
                                onClick={() => isAdmin && handleEditClick(item)}
                                className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start transition-transform duration-200 relative ${isAdmin
                                    ? 'cursor-pointer hover:bg-slate-50 active:scale-95'
                                    : 'cursor-default'
                                    }`}
                            >
                                <ActivityIcon type={item.type} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800">{item.title}</h3>
                                        {isAdmin && <Pencil size={14} className="text-slate-300 ml-2 mt-1 opacity-50" />}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 leading-snug">{item.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Add Button - Only visible to Admins */}
            {isAdmin && (
                <button
                    onClick={handleCreateClick}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-20"
                >
                    <Plus size={28} />
                </button>
            )}

            {/* Add/Edit Item Modal */}
            {isModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">{editingId ? '編輯行程' : `新增第 ${day} 天行程`}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                            {/* Time Input */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <Clock size={14} /> 時間
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={newItem.time}
                                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-cyan-400 outline-none"
                                />
                            </div>

                            {/* Title Input */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <TypeIcon size={14} /> 標題
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="例如：參觀水族館"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-cyan-400 outline-none placeholder:text-slate-300"
                                />
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    活動類型
                                </label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'food', icon: Coffee, label: '吃', color: 'bg-orange-100 text-orange-500' },
                                        { id: 'stay', icon: BedDouble, label: '住', color: 'bg-indigo-100 text-indigo-500' },
                                        { id: 'move', icon: Car, label: '行', color: 'bg-blue-100 text-blue-500' },
                                        { id: 'play', icon: Camera, label: '玩', color: 'bg-pink-100 text-pink-500' },
                                    ].map((typeOption) => (
                                        <button
                                            key={typeOption.id}
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, type: typeOption.id as any })}
                                            className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center transition-all ${newItem.type === typeOption.id
                                                ? `${typeOption.color} ring-2 ring-offset-1 ring-current font-bold`
                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                        >
                                            <typeOption.icon size={20} className="mb-1" />
                                            <span className="text-xs">{typeOption.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description Input */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <AlignLeft size={14} /> 備註 / 說明
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="詳細內容..."
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-cyan-400 outline-none placeholder:text-slate-300 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-200 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {editingId ? <Save size={20} /> : <Check size={20} />}
                                {editingId ? '儲存變更' : '確認新增'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const WishlistView = () => {
    const [wishes, setWishes] = useState<WishlistItem[]>([]);
    const [newWish, setNewWish] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If Firebase is not configured properly, show mock data or empty state
        if (!db) {
            setWishes([
                { id: '1', name: 'Blue Seal 冰淇淋', votes: 12 },
                { id: '2', name: 'TeamLab 未來遊樂園', votes: 8 },
                { id: '3', name: '青之洞窟浮潛', votes: 15 },
            ].sort((a, b) => b.votes - a.votes));
            setLoading(false);
            setError("演示模式：尚未連接資料庫");
            return;
        }

        const q = query(collection(db, "wishlist"), orderBy("votes", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: WishlistItem[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as WishlistItem);
            });
            setWishes(items);
            setLoading(false);
        }, (err) => {
            console.error("Firestore error:", err);
            setError("無法載入許願資料");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddWish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWish.trim()) return;

        if (!db) {
            // Mock add
            const newItem = { id: Date.now().toString(), name: newWish, votes: 1 };
            setWishes(prev => [...prev, newItem].sort((a, b) => b.votes - a.votes));
            setNewWish('');
            return;
        }

        try {
            await addDoc(collection(db, "wishlist"), {
                name: newWish,
                votes: 1,
                createdAt: Timestamp.now()
            });
            setNewWish('');
        } catch (err) {
            console.error("Error adding document: ", err);
            alert("新增失敗，請檢查網路連線。");
        }
    };

    const handleVote = async (id: string, currentVotes: number) => {
        if (!db) {
            // Mock vote
            setWishes(prev => prev.map(w => w.id === id ? { ...w, votes: w.votes + 1 } : w).sort((a, b) => b.votes - a.votes));
            return;
        }

        const wishRef = doc(db, "wishlist", id);
        await updateDoc(wishRef, {
            votes: increment(1)
        });
    };

    return (
        <div className="px-6 pt-4 pb-36 h-full flex flex-col">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 rounded-2xl shadow-lg shadow-pink-200 text-white mb-6">
                <h2 className="text-xl font-bold mb-1">家族許願池</h2>
                <p className="text-pink-100 text-sm opacity-90">投票決定我們下一個想去的地方！</p>
            </div>

            {error && <div className="text-xs text-center text-amber-600 mb-2 bg-amber-50 p-2 rounded">{error}</div>}

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {loading ? (
                    <div className="text-center text-slate-400 mt-10">資料載入中...</div>
                ) : wishes.length === 0 ? (
                    <div className="text-center text-slate-400 mt-10">目前沒有願望，快來新增一個！</div>
                ) : (
                    wishes.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group">
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <button
                                onClick={() => handleVote(item.id, item.votes)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors active:scale-95"
                            >
                                <Heart size={16} className="fill-rose-500" />
                                <span className="font-bold text-sm">{item.votes}</span>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleAddWish} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={newWish}
                    onChange={(e) => setNewWish(e.target.value)}
                    placeholder="你想去哪裡？"
                    className="flex-1 px-4 py-3 rounded-xl border-none shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400 outline-none text-slate-700 bg-white"
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white p-3 rounded-xl shadow-md shadow-blue-200 active:scale-95 transition-transform"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

const MapView = () => (
    <div className="h-full flex flex-col pt-4 px-4 pb-24">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                <Map size={48} className="mb-4 text-cyan-400 opacity-50" />
                <p className="font-medium">地圖功能區塊</p>
                <p className="text-xs mt-2 text-center max-w-[200px]">
                    (此處可整合 Google Maps API 或 Leaflet)
                </p>

                {/* Decorative Fake Map Elements */}
                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-400 rounded-full shadow-lg ring-4 ring-white animate-bounce"></div>
                <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-blue-400 rounded-full shadow-lg ring-4 ring-white"></div>
                <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-green-400 rounded-full shadow-lg ring-4 ring-white"></div>
            </div>

            {/* Floating Card on Map */}
            <div className="absolute bottom-6 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600">
                        <Car size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">目前位置</h4>
                        <p className="text-xs text-slate-500">正在前往美麗海水族館 (預計 45 分鐘)</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const AssistantView = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', text: "嗨！我是你的沖繩 AI 導遊。有任何關於行程的問題都可以問我喔！", sender: 'ai', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user', timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate AI thinking and reply
        setTimeout(() => {
            let replyText = "這聽起來很棒！沖繩真的有很多好玩的地方。";
            const lowerInput = userMsg.text.toLowerCase();

            if (lowerInput.includes('天氣') || lowerInput.includes('weather')) replyText = "那霸目前氣溫 28°C，天氣晴朗。記得多補充水分跟防曬喔！";
            else if (lowerInput.includes('吃') || lowerInput.includes('美食') || lowerInput.includes('food')) replyText = "來到沖繩一定要吃阿古豬、苦瓜炒蛋、塔可飯，還有必吃的飯糰！";
            else if (lowerInput.includes('海') || lowerInput.includes('玩') || lowerInput.includes('beach')) replyText = "翡翠海灘、日落海灘和古宇利海灘都非常推薦喔！";
            else if (lowerInput.includes('買') || lowerInput.includes('伴手禮') || lowerInput.includes('souvenir')) replyText = "紅芋塔、金楚糕、雪鹽餅乾都是必買的伴手禮。";

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: replyText,
                sender: 'ai',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full pt-4 pb-24">
            <div className="flex-1 overflow-y-auto px-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center mr-2 mt-1 shrink-0">
                                <Bot size={16} className="text-cyan-600" />
                            </div>
                        )}
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-tr-sm'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSend} className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="輸入問題..."
                        className="w-full pl-4 pr-12 py-3 rounded-full border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-cyan-400 outline-none shadow-sm"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1.5 p-1.5 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- LOGIN SCREEN ---

const LoginView = ({ onLogin }: { onLogin: () => Promise<void> }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 z-0"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-sm">
                <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3">
                    <Plane className="text-blue-500" size={40} />
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2">沖繩之旅</h1>
                <p className="text-blue-100 mb-8 font-medium">Okinawa Family Trip 2026</p>

                <button
                    onClick={onLogin}
                    className="w-full bg-white text-slate-700 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-50"
                >
                    {/* G Icon */}
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        G
                    </div>
                    使用 Google 帳號登入
                </button>

                <p className="text-white/60 text-xs mt-6">
                    登入以同步您的行程與許願池
                </p>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>('itinerary');
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    const [itineraryData, setItineraryData] = useState(MOCK_ITINERARY);

    // Auth State Listener
    useEffect(() => {
        if (!auth) {
            // Demo Mode
            setAppLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser && currentUser.email) {
                try {
                    const res = await fetch('/.netlify/functions/verify-admin', {
                        method: 'POST',
                        body: JSON.stringify({ email: currentUser.email })
                    });
                    const data = await res.json();
                    setIsAdmin(!!data.isAdmin);
                } catch (e) {
                    console.error("Admin verification failed", e);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            setAppLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        if (!auth || !googleProvider) return;
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
            alert("登入失敗，請稍後再試。");
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
    };

    // Loading Screen
    if (appLoading) {
        return (
            <div className="h-screen w-full bg-slate-50 flex items-center justify-center text-slate-400">
                載入中...
            </div>
        );
    }

    // Not Logged In & Not Demo Mode -> Show Login
    if (!user && auth) {
        return (
            <div className="h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden max-w-md mx-auto shadow-2xl relative">
                <LoginView onLogin={handleGoogleLogin} />
            </div>
        );
    }

    // Header Content
    const renderHeader = () => (
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-xl shadow-blue-100 relative z-20">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">沖繩 Okinawa</h1>
                    <p className="text-cyan-100 font-medium">2026 家族旅遊</p>
                </div>
                <div
                    onClick={handleLogout}
                    className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors overflow-hidden border-2 border-white/30"
                    title="登出"
                >
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <User size={20} />
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="flex gap-3">
                <div className="flex-1 bg-white/10 backdrop-blur border border-white/20 p-3 rounded-xl flex items-center gap-3 text-white">
                    <CloudSun className="text-yellow-300" size={24} />
                    <div>
                        <div className="text-xs opacity-80">那霸市</div>
                        <div className="font-bold text-lg">28°C</div>
                    </div>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur border border-white/20 p-3 rounded-xl flex items-center gap-3 text-white">
                    <JapaneseYen className="text-green-300" size={24} />
                    <div>
                        <div className="text-xs opacity-80">匯率 (日圓)</div>
                        <div className="font-bold text-lg">0.21</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full bg-slate-50 font-sans text-slate-800 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl relative">

            {/* Header is always visible */}
            {renderHeader()}

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden -mt-4 z-10">
                <div className="absolute inset-0 pt-4">
                    {activeTab === 'itinerary' && <ItineraryView itinerary={itineraryData} setItinerary={setItineraryData} isAdmin={isAdmin} />}
                    {activeTab === 'wishlist' && <WishlistView />}
                    {activeTab === 'map' && <MapView />}
                    {activeTab === 'assistant' && <AssistantView />}
                </div>
            </main>

            {/* Bottom Tab Bar */}
            <div className="absolute bottom-6 left-4 right-4 bg-white/90 backdrop-blur-lg border border-white/40 p-2 rounded-2xl shadow-lg shadow-slate-200/50 flex justify-around items-center z-30">
                {[
                    { id: 'itinerary', icon: Calendar, label: '行程' },
                    { id: 'wishlist', icon: Heart, label: '許願' },
                    { id: 'map', icon: Map, label: '地圖' },
                    { id: 'assistant', icon: MessageCircle, label: '導遊' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300 ${activeTab === tab.id
                            ? 'bg-blue-50 text-blue-500 scale-105'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon size={22} className={activeTab === tab.id ? "stroke-[2.5px]" : "stroke-2"} />
                        <span className="text-[10px] font-medium mt-1">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
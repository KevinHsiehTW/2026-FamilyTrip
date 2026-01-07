import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    Pencil,
    MapPin,
    Trash2,
    Link as LinkIcon,
    Minus
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, onSnapshot, Timestamp, increment, arrayUnion, arrayRemove, setDoc } from "firebase/firestore";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import { importInitialData, DaySchedule } from './src/data/seed_itinerary';
import { ItineraryItem, WishlistItem, ChatMessage, Tab } from './src/types';
import { OkinawaMap } from './src/components/OkinawaMap';
import { BentoHeader } from './src/components/BentoHeader';

import { WishlistCard } from './src/components/WishlistCard';
import { ChatInterface } from './src/components/ChatInterface';

// --- CONFIGURATION ---



// --- MOCK DATA REMOVED ---

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
    isAdmin,
    day,
    setDay,
    itineraryData,
    loading
}: {
    isAdmin: boolean;
    day: number;
    setDay: (d: number) => void;
    itineraryData: Record<number, ItineraryItem[]>;
    loading: boolean;
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // State lifted to App component


    const [newItem, setNewItem] = useState<{
        time: string;
        title: string;
        type: ItineraryItem['type'];
        description: string;
        location: string;
        title: string;
        type: ItineraryItem['type'];
        description: string;
        location: string;
        timezone: 'Asia/Taipei' | 'Asia/Tokyo';
        relatedLinks: { title: string; url: string }[];
    }>({
        time: '12:00',
        title: '',
        type: 'play',
        description: '',
        location: '',
        location: '',
        timezone: 'Asia/Tokyo',
        relatedLinks: []
    });

    // Seed Data Handler
    const handleImportData = async () => {
        if (!isAdmin || !confirm("確定要匯入預設行程嗎？這將會覆寫目前的資料庫內容。")) return;
        try {
            await importInitialData();
            alert("行程匯入成功！");
        } catch (error) {
            console.error("Import failed:", error);
            alert("匯入失敗，請檢查權限或網路。");
        }
    };

    // Open modal for editing
    const handleEditClick = (item: ItineraryItem) => {
        if (!isAdmin) return;
        setEditingId(item.id);
        setNewItem({
            time: item.time,
            title: item.title,
            type: item.type,

            description: item.description,
            location: item.location || '',
            timezone: item.timezone || 'Asia/Tokyo',
            relatedLinks: item.relatedLinks || []
        });
        setIsModalOpen(true);
    };

    // Open modal for creating
    const handleCreateClick = () => {
        setEditingId(null);
        setNewItem({ time: '12:00', title: '', type: 'play', description: '', location: '', timezone: 'Asia/Tokyo', relatedLinks: [] });
        setIsModalOpen(true);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title.trim() || !db) return;

        const currentItems = itineraryData[day] || [];
        let updatedItems = [...currentItems];

        if (editingId) {
            // Edit existing
            updatedItems = updatedItems.map(item =>
                item.id === editingId
                    ? { ...item, ...newItem }
                    : item
            );
        } else {
            // Add new
            const item: ItineraryItem = {
                id: Date.now().toString(),
                ...newItem
            };
            updatedItems.push(item);
        }

        // Sort
        updatedItems.sort((a, b) => a.time.localeCompare(b.time));

        console.log("Saving itinerary..."); // Force HMR update

        // Save to Firestore
        try {
            const docRef = doc(db, "itinerary", `day_${day}`);
            // Check if doc exists (normally seeded data exists)
            // But if starting fresh, we might need to set.
            // Using setDoc with merge: true is safer for partial updates, 
            // but here we are updating the entire array to keep order.
            await setDoc(docRef, {
                day: day,
                date: `Day ${day}`, // Placeholder, seed data has better dates
                items: updatedItems
            }, { merge: true });

            // Reset and close
            // Reset and close
            setNewItem({ time: '12:00', title: '', type: 'play', description: '', location: '', timezone: 'Asia/Tokyo', relatedLinks: [] });
            setEditingId(null);
            setEditingId(null);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving itinerary:", error);
            alert("儲存失敗");
        }
    };

    const handleDeleteItem = async () => {
        if (!editingId || !db || !confirm("確定要刪除這個行程嗎？此動作無法復原。")) return;

        const currentItems = itineraryData[day] || [];
        const updatedItems = currentItems.filter(item => item.id !== editingId);

        try {
            const docRef = doc(db, "itinerary", `day_${day}`);
            await setDoc(docRef, {
                day: day,
                date: `Day ${day}`,
                items: updatedItems
            }, { merge: true });

            setNewItem({ time: '12:00', title: '', type: 'play', description: '', location: '', timezone: 'Asia/Tokyo', relatedLinks: [] });
            setEditingId(null);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error deleting itinerary:", error);
            alert("刪除失敗");
        }
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Day Toggles - Fixed at top, horizontal scroll only */}
            <div className="flex-shrink-0 flex justify-start gap-4 p-4 bg-slate-50/95 backdrop-blur z-10 overflow-x-auto no-scrollbar border-b border-slate-100/50">
                {[1, 2, 3, 4, 5, 6].map((d) => (
                    <button
                        key={d}
                        onClick={() => setDay(d)}
                        className={`flex-shrink-0 px-4 h-9 flex items-center justify-center rounded-full text-sm font-bold shadow-sm whitespace-nowrap transition-all active:scale-95 ${day === d
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-cyan-200'
                            : 'bg-white text-slate-500 hover:bg-slate-100'
                            }`}
                    >
                        第 {d} 天
                    </button>
                ))}
            </div>

            {/* Timeline - vertically scrollable */}
            <div className="flex-1 px-6 space-y-6 animate-fade-in overflow-y-auto pb-32 pt-4">
                {loading ? (
                    <div className="text-center text-slate-400 mt-10">讀取行程中...</div>
                ) : (!itineraryData[day] || itineraryData[day].length === 0) ? (
                    <div className="flex flex-col items-center justify-center mt-10 space-y-4">
                        <div className="text-slate-400">尚無行程資料</div>
                        {/* Exposed for debugging/setup */}
                        {isAdmin && (
                            <button
                                onClick={handleImportData}
                                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-200"
                            >
                                匯入預設行程 (Admin)
                            </button>
                        )}
                    </div>
                ) : (
                    itineraryData[day].map((item, idx) => (
                        <div key={item.id} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                                <div className="text-xs font-semibold text-slate-400 mb-1 w-10 text-right flex flex-col items-end">
                                    <span>{item.time}</span>
                                    {item.timezone === 'Asia/Taipei' && (
                                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded transform scale-90 origin-right">TW</span>
                                    )}
                                    {item.timezone === 'Asia/Tokyo' && item.type === 'move' && item.title.includes('起飛') && (
                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded transform scale-90 origin-right">JP</span>
                                    )}
                                </div>
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
                                            <div className="flex gap-2">
                                                {item.location && (
                                                    <a
                                                        href={item.location}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-blue-500 hover:text-blue-600 p-1.5 bg-blue-50 rounded-full"
                                                    >
                                                        <MapPin size={16} />
                                                    </a>
                                                )}
                                                {isAdmin && <Pencil size={14} className="text-slate-300 mt-1 opacity-50" />}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1 leading-snug">{item.description}</p>

                                        {/* Related Links */}
                                        {item.relatedLinks && item.relatedLinks.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {item.relatedLinks.map((link, lIdx) => (
                                                    <a
                                                        key={lIdx}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100"
                                                    >
                                                        <LinkIcon size={12} />
                                                        {link.title}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
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

            {/* Add/Edit Item Modal - Top Aligned Style - Portaled */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm animate-fade-in no-scrollbar">
                    <div className="flex min-h-full items-start justify-center p-4 pt-20">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative animate-slide-up flex flex-col mb-10">
                            <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex justify-between items-center text-white rounded-t-3xl shadow-md">
                                <h3 className="font-bold text-lg">{editingId ? '編輯行程' : `新增第 ${day} 天行程`}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                                {/* Time & Timezone Input */}
                                <div className="flex gap-3">
                                    <div className="flex-1">
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
                                    <div className="w-1/3">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            時區
                                        </label>
                                        <div className="flex bg-slate-100 rounded-xl p-1">
                                            <button
                                                type="button"
                                                onClick={() => setNewItem({ ...newItem, timezone: 'Asia/Tokyo' })}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newItem.timezone !== 'Asia/Taipei' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                                            >
                                                🇯🇵 JP
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewItem({ ...newItem, timezone: 'Asia/Taipei' })}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newItem.timezone === 'Asia/Taipei' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}
                                            >
                                                🇹🇼 TW
                                            </button>
                                        </div>
                                    </div>
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

                                {/* Location Input */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        <MapPin size={14} /> 地點連結 (Google Maps)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://goo.gl/maps/..."
                                        value={newItem.location}
                                        onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-cyan-400 outline-none placeholder:text-slate-300 text-sm"
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

                                {/* Related Links Editor */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        <LinkIcon size={14} /> 相關連結
                                    </label>
                                    <div className="space-y-2">
                                        {newItem.relatedLinks.map((link, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="標題 (例: 部落格)"
                                                    value={link.title}
                                                    onChange={(e) => {
                                                        const updated = [...newItem.relatedLinks];
                                                        updated[idx].title = e.target.value;
                                                        setNewItem({ ...newItem, relatedLinks: updated });
                                                    }}
                                                    className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                                                />
                                                <input
                                                    type="url"
                                                    placeholder="網址 (https://...)"
                                                    value={link.url}
                                                    onChange={(e) => {
                                                        const updated = [...newItem.relatedLinks];
                                                        updated[idx].url = e.target.value;
                                                        setNewItem({ ...newItem, relatedLinks: updated });
                                                    }}
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = newItem.relatedLinks.filter((_, i) => i !== idx);
                                                        setNewItem({ ...newItem, relatedLinks: updated });
                                                    }}
                                                    className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, relatedLinks: [...newItem.relatedLinks, { title: '', url: '' }] })}
                                            className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={14} /> 新增連結
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-2">
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteItem}
                                            className="bg-red-50 text-red-500 p-4 rounded-xl shadow-sm hover:bg-red-100 active:scale-95 transition-all"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {editingId ? <Save size={20} /> : <Check size={20} />}
                                        {editingId ? '儲存變更' : '確認新增'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const WishlistView = ({ user }: { user: FirebaseUser | null }) => {
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
            const newItem: WishlistItem = {
                id: Date.now().toString(),
                name: newWish,
                votes: 1,
                createdBy: user?.uid,
                votedBy: user ? [user.uid] : []
            };
            setWishes(prev => [...prev, newItem].sort((a, b) => b.votes - a.votes));
            setNewWish('');
            return;
        }

        try {
            await addDoc(collection(db, "wishlist"), {
                name: newWish,
                votes: 1,
                createdAt: Timestamp.now(),
                createdBy: user?.uid,
                votedBy: user ? [user.uid] : []
            });
            setNewWish('');
        } catch (err) {
            console.error("Error adding document: ", err);
            alert("新增失敗，請檢查網路連線。");
        }
    };

    const handleVote = async (item: WishlistItem) => {
        if (!db || !user) {
            // Mock vote or alert if no user
            if (!user) { alert("請先登入才能投票！"); return; }
            setWishes(prev => prev.map(w => w.id === item.id ? { ...w, votes: w.votes + 1 } : w).sort((a, b) => b.votes - a.votes));
            return;
        }

        const wishRef = doc(db, "wishlist", item.id);
        const hasVoted = item.votedBy?.includes(user.uid);

        if (hasVoted) {
            // Cancel vote
            await updateDoc(wishRef, {
                votes: increment(-1),
                votedBy: arrayRemove(user.uid)
            });
        } else {
            // Add vote
            await updateDoc(wishRef, {
                votes: increment(1),
                votedBy: arrayUnion(user.uid)
            });
        }
    };

    const handleDelete = async (id: string) => {
        // No confirm() needed here, UI handles double check
        if (!db) return;

        try {
            await deleteDoc(doc(db, "wishlist", id));
        } catch (err) {
            console.error("Error deleting:", err);
            alert("刪除失敗 (您可能不是發布者)");
        }
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
                        <WishlistCard
                            key={item.id}
                            item={item}
                            user={user}
                            onVote={handleVote}
                            onDelete={handleDelete}
                        />
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

const MapView = ({ items }: { items: ItineraryItem[] }) => (
    <div className="h-full flex flex-col pt-4 px-4 pb-24">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-full relative overflow-hidden z-0">
            <OkinawaMap items={items} />
        </div>
    </div>
);



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

    // Lifted State
    const [day, setDay] = useState(1);
    const [itineraryData, setItineraryData] = useState<Record<number, ItineraryItem[]>>({});
    const [dataLoading, setDataLoading] = useState(true);

    // Fetch Itinerary from Firestore (Lifted)
    useEffect(() => {
        if (!db) {
            setDataLoading(false);
            return;
        }

        const q = query(collection(db, "itinerary"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Record<number, ItineraryItem[]> = {};
            snapshot.forEach((doc) => {
                const daySchedule = doc.data() as DaySchedule;
                const sortedItems = (daySchedule.items || []).sort((a, b) => a.time.localeCompare(b.time));
                data[daySchedule.day] = sortedItems;
            });
            setItineraryData(data);
            setDataLoading(false);
        }, (error) => {
            console.error("Error fetching itinerary:", error);
            setDataLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
                const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
                    .split(',')
                    .map((e: string) => e.trim());
                setIsAdmin(adminEmails.includes(currentUser.email));
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
        <div className="h-screen w-full font-sans text-slate-800 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl relative bg-transparent">

            {/* Bento Grid Header */}
            <BentoHeader user={user} onLogin={handleGoogleLogin} onLogout={handleLogout} />

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden mt-2 z-10 flex flex-col rounded-t-3xl bg-slate-50 shadow-inner">
                <div className="flex-1 overflow-hidden relative z-0">
                    {activeTab === 'itinerary' && (
                        <ItineraryView
                            day={day}
                            setDay={setDay}
                            itineraryData={itineraryData}
                            loading={dataLoading}
                            isAdmin={isAdmin}
                        />
                    )}
                    {activeTab === 'wishlist' && <WishlistView user={user} />}
                    {activeTab === 'map' && <MapView items={itineraryData[day] || []} />}
                    {activeTab === 'assistant' && <ChatInterface itineraryData={itineraryData} />}
                </div>
            </main>

            {/* Bottom Dock Navigation */}
            <div className="absolute bottom-6 left-6 right-6 h-20 bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-2xl shadow-slate-300/50 flex justify-between items-center px-6 z-30">
                {[
                    { id: 'itinerary', icon: Calendar, label: '行程' },
                    { id: 'wishlist', icon: Heart, label: '許願' },
                    { id: 'map', icon: Map, label: '地圖' },
                    { id: 'assistant', icon: MessageCircle, label: '導遊' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 active:scale-90 ${activeTab === tab.id
                            ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-200 -translate-y-4'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        <tab.icon size={24} className={activeTab === tab.id ? "stroke-[2.5px]" : "stroke-2"} />
                        {activeTab !== tab.id && <span className="text-[9px] font-bold mt-1 opacity-60">{tab.label}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
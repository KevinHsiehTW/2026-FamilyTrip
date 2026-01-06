import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Backpack, Edit2, Plus, Trash2, Save, Cloud, CloudOff } from 'lucide-react';
import { getUserPackingList, saveUserPackingList, PackingListData, PackingCategory, PackingItem } from '../services/packingList';

interface Props {
    isOpen: boolean;
    userId: string | undefined;
    onClose: () => void;
    onUpdateProgress: (percent: number) => void;
}

export const PackingListModal: React.FC<Props> = ({ isOpen, userId, onClose, onUpdateProgress }) => {
    const [data, setData] = useState<PackingListData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newItemText, setNewItemText] = useState("");
    const [addingToCategory, setAddingToCategory] = useState<string | null>(null); // Category ID

    // Fetch Data
    useEffect(() => {
        if (isOpen && userId) {
            setLoading(true);
            getUserPackingList(userId).then(fetchedData => {
                setData(fetchedData);
                calculateProgress(fetchedData);
                setLoading(false);
            });
        }
    }, [isOpen, userId]);

    // Calculate Progress Helper
    const calculateProgress = (currData: PackingListData) => {
        let total = 0;
        let checked = 0;
        currData.categories.forEach(cat => {
            cat.items.forEach(item => {
                total++;
                if (item.checked) checked++;
            });
        });
        const progress = total === 0 ? 0 : Math.round((checked / total) * 100);
        onUpdateProgress(progress);
    };

    // Actions
    const handleToggleItem = async (catId: string, itemId: string) => {
        if (!data || !userId || isEditing) return; // Prevent toggling while editing to avoid confusion

        const newData = { ...data };
        const cat = newData.categories.find(c => c.id === catId);
        if (cat) {
            const item = cat.items.find(i => i.id === itemId);
            if (item) {
                item.checked = !item.checked;
            }
        }

        setData(newData);
        calculateProgress(newData);

        // Debounce or just save async
        try {
            await saveUserPackingList(userId, newData);
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };

    const handleDeleteItem = (catId: string, itemId: string) => {
        if (!data) return;
        const newData = { ...data };
        const cat = newData.categories.find(c => c.id === catId);
        if (cat) {
            cat.items = cat.items.filter(i => i.id !== itemId);
        }
        setData(newData);
        calculateProgress(newData);
    };

    const handleAddItem = (catId: string) => {
        if (!data || !newItemText.trim()) return;

        const newData = { ...data };
        const cat = newData.categories.find(c => c.id === catId);
        if (cat) {
            cat.items.push({
                id: Date.now().toString(),
                text: newItemText.trim(),
                checked: false
            });
        }

        setData(newData);
        calculateProgress(newData);
        setNewItemText("");
        setAddingToCategory(null);
    };

    const handleSaveEdit = async () => {
        if (!data || !userId) return;
        setSaving(true);
        try {
            await saveUserPackingList(userId, data);
            setIsEditing(false);
        } catch (e) {
            alert("儲存失敗");
        }
        setSaving(false);
    };

    if (!isOpen) return null;

    // Derived State for UI
    let totalItems = 0;
    let checkedCount = 0;
    if (data) {
        data.categories.forEach(cat => {
            cat.items.forEach(item => {
                totalItems++;
                if (item.checked) checkedCount++;
            });
        });
    }
    const progress = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] shadow-2xl flex flex-col relative z-50 animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                            <Backpack size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">
                                {userId ? '個人行李清單' : '訪客清單 (無法儲存)'}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {loading ? '同步中...' : `已準備 ${checkedCount}/${totalItems} (${progress}%)`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {userId && !loading && (
                            <button
                                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                                className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                            >
                                {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100">
                    <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-slate-400 text-sm">
                            <Cloud className="animate-bounce mr-2" /> 載入中...
                        </div>
                    ) : !data ? (
                        <div className="text-center text-red-400 p-4">無法載入資料</div>
                    ) : (
                        data.categories.map((category) => (
                            <div key={category.id}>
                                <div className="flex justify-between items-center mb-3 ml-1 pr-1">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                        {category.name}
                                    </h3>
                                    {isEditing && (
                                        <button
                                            onClick={() => setAddingToCategory(category.id)}
                                            className="text-blue-500 p-1 hover:bg-blue-50 rounded-full"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {category.items.map((item) => {
                                        const isChecked = item.checked;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleToggleItem(category.id, item.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isEditing
                                                        ? 'bg-slate-50 border-dashed border-slate-300'
                                                        : isChecked
                                                            ? 'bg-blue-50/50 border-blue-200 shadow-inner cursor-pointer'
                                                            : 'bg-white border-slate-100 shadow-sm hover:border-blue-200 cursor-pointer'
                                                    }`}
                                            >
                                                {!isEditing && (
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isChecked
                                                            ? 'bg-blue-500 border-blue-500 text-white'
                                                            : 'border-slate-300 bg-white'
                                                        }`}>
                                                        {isChecked && <Check size={14} strokeWidth={3} />}
                                                    </div>
                                                )}

                                                <span className={`text-sm font-medium flex-1 transition-colors ${isChecked && !isEditing ? 'text-blue-700 decoration-blue-300' : 'text-slate-700'
                                                    }`}>
                                                    {item.text}
                                                </span>

                                                {isEditing && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteItem(category.id, item.id);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Add Item Input */}
                                    {addingToCategory === category.id && (
                                        <div className="flex items-center gap-2 p-1 animate-fade-in">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                                placeholder="輸入項目名稱..."
                                                value={newItemText}
                                                onChange={(e) => setNewItemText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddItem(category.id);
                                                    if (e.key === 'Escape') setAddingToCategory(null);
                                                }}
                                            />
                                            <button
                                                onClick={() => handleAddItem(category.id)}
                                                className="bg-blue-500 text-white p-2 rounded-lg"
                                            >
                                                <Check size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {isEditing && (
                    <div className="bg-yellow-50 text-yellow-700 text-xs px-4 py-2 text-center border-t border-yellow-100">
                        編輯模式：可新增或刪除項目，完成請按右上角儲存圖示。
                    </div>
                )}
            </div>
        </div>
    );
};

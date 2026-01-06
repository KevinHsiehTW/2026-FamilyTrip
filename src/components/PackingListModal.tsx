import React, { useState, useEffect } from 'react';
import { X, Check, Backpack } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdateProgress: (percent: number) => void;
}

const DEFAULT_LIST = [
    {
        category: "證件/錢包",
        items: ["護照 (效期>6個月)", "駕照/日文譯本", "日幣現金", "信用卡 (海外回饋)", "機票/訂房憑證", "網卡/Wifi機"]
    },
    {
        category: "電子產品",
        items: ["手機", "充電線/頭", "行動電源", "相機/記憶卡", "轉接頭 (日本不用)", "耳機"]
    },
    {
        category: "衣物",
        items: ["換洗衣物", "睡衣", "內衣褲", "薄外套 (早晚溫差)", "好走的鞋", "泳衣/泳帽 (玩水用)"]
    },
    {
        category: "生活用品",
        items: ["牙刷/牙膏", "個人保養品", "防曬乳/墨鏡", "常備藥品", "塑膠袋 (裝髒衣)", "雨具 (摺疊傘)"]
    }
];

export const PackingListModal: React.FC<Props> = ({ isOpen, onClose, onUpdateProgress }) => {
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    // 初始載入
    useEffect(() => {
        const saved = localStorage.getItem('packing_list_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            setCheckedItems(parsed);
            calculateProgress(parsed);
        } else {
            // First time load, report 0
            onUpdateProgress(0);
        }
    }, []);

    const calculateProgress = (checked: string[]) => {
        const totalItems = DEFAULT_LIST.reduce((acc, cat) => acc + cat.items.length, 0);
        const progress = Math.round((checked.length / totalItems) * 100);
        onUpdateProgress(progress);
    };

    const toggleItem = (item: string) => {
        const newChecked = checkedItems.includes(item)
            ? checkedItems.filter(i => i !== item)
            : [...checkedItems, item];

        setCheckedItems(newChecked);
        localStorage.setItem('packing_list_state', JSON.stringify(newChecked));
        calculateProgress(newChecked);
    };

    if (!isOpen) return null;

    const totalItems = DEFAULT_LIST.reduce((acc, cat) => acc + cat.items.length, 0);
    const progress = Math.round((checkedItems.length / totalItems) * 100);

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
                            <h2 className="font-bold text-slate-800">行李準備清單</h2>
                            <p className="text-xs text-slate-500">
                                已準備 {checkedItems.length}/{totalItems} ({progress}%)
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
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
                    {DEFAULT_LIST.map((category) => (
                        <div key={category.category}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                                {category.category}
                            </h3>
                            <div className="space-y-2">
                                {category.items.map((item) => {
                                    const isChecked = checkedItems.includes(item);
                                    return (
                                        <div
                                            key={item}
                                            onClick={() => toggleItem(item)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer active:scale-98 ${isChecked
                                                    ? 'bg-blue-50/50 border-blue-200 shadow-inner'
                                                    : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isChecked
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'border-slate-300 bg-white'
                                                }`}>
                                                {isChecked && <Check size={14} strokeWidth={3} />}
                                            </div>
                                            <span className={`text-sm font-medium transition-colors ${isChecked ? 'text-blue-700 decoration-blue-300' : 'text-slate-700'
                                                }`}>
                                                {item}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

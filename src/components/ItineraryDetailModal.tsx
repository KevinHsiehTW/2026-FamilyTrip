import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    MapPin,
    Navigation,
    Clock,
    Link as LinkIcon,
    Coffee,
    BedDouble,
    Car,
    Camera
} from 'lucide-react';
import { ItineraryItem } from '../types';

interface ItineraryDetailModalProps {
    item: ItineraryItem;
    onClose: () => void;
}

export const ItineraryDetailModal: React.FC<ItineraryDetailModalProps> = ({ item, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 250); // Wait for animation
    };

    // Theme based on type
    const getTheme = (type: ItineraryItem['type']) => {
        switch (type) {
            case 'food': return { bg: 'from-orange-400 to-red-500', icon: Coffee, shadow: 'shadow-orange-200' };
            case 'stay': return { bg: 'from-indigo-400 to-purple-500', icon: BedDouble, shadow: 'shadow-indigo-200' };
            case 'move': return { bg: 'from-blue-400 to-cyan-500', icon: Car, shadow: 'shadow-blue-200' };
            case 'play': return { bg: 'from-pink-400 to-rose-500', icon: Camera, shadow: 'shadow-pink-200' };
        }
    };

    const theme = getTheme(item.type);
    const Icon = theme.icon;

    if (!item) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh] flex flex-col ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0'}`}
            >
                {/* Header Image / Gradient */}
                <div className={`h-40 bg-gradient-to-br ${theme.bg} rounded-t-3xl relative flex items-center justify-center overflow-hidden shrink-0`}>
                    {/* Decorative Circles */}
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-black/10 rounded-full blur-lg"></div>

                    {/* Main Icon */}
                    <div className="text-white drop-shadow-lg transform scale-150">
                        <Icon size={48} />
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/30 transition-colors backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>

                    {/* Timezone Badge */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        {item.timezone === 'Asia/Taipei' && (
                            <span className="px-3 py-1 bg-white/90 text-red-600 text-xs font-bold rounded-full shadow-sm">🇹🇼 台灣時間</span>
                        )}
                        {item.timezone === 'Asia/Tokyo' && (
                            <span className="px-3 py-1 bg-white/90 text-blue-600 text-xs font-bold rounded-full shadow-sm">🇯🇵 日本時間</span>
                        )}
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 pb-28">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 text-slate-400 font-bold mb-1">
                            <Clock size={16} />
                            <span className="text-lg">{item.time}</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 leading-tight">{item.title}</h2>
                    </div>

                    {/* Location Card */}
                    {item.location && (
                        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <div className={`p-2 rounded-full bg-white text-slate-500 shadow-sm shrink-0`}>
                                <MapPin size={20} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-0.5">Location</div>
                                <div className="text-slate-700 font-medium truncate text-sm">
                                    {item.location}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning/Note for specific types */}
                    {item.type === 'move' && item.title.includes('起飛') && (
                        <div className="mb-6 p-4 bg-amber-50 text-amber-700 rounded-2xl text-sm border border-amber-100 flex gap-3">
                            <div className="p-1 bg-amber-100 rounded text-amber-600 shrink-0 h-fit">!</div>
                            <div>
                                <span className="font-bold block mb-1">搭機提醒</span>
                                請務必提前 2 小時抵達機場辦理登機手續。檢查護照是否隨身攜帶。
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed mb-8">
                        <p className="whitespace-pre-line">{item.description}</p>
                    </div>

                    {/* Related Links Chips/Cards */}
                    {item.relatedLinks && item.relatedLinks.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <LinkIcon size={16} className="text-cyan-500" /> 相關連結
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {item.relatedLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all group bg-white shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-cyan-100 group-hover:text-cyan-600 transition-colors">
                                            <LinkIcon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-700 group-hover:text-cyan-700">{link.title}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-[200px]">{link.url}</div>
                                        </div>
                                        <div className="text-slate-300 group-hover:text-cyan-400">
                                            →
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Footer Action */}
                {item.location && (
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-10">
                        <a
                            href={item.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-bold shadow-xl shadow-slate-200 active:scale-95 transition-all bg-gradient-to-r ${theme.bg}`}
                        >
                            <Navigation size={20} />
                            Google Maps 導航
                        </a>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

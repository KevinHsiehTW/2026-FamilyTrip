import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { CloudSun, User, Plane, CalendarClock, Cloud, Sun, CloudRain, Wind, Backpack } from 'lucide-react';
import { PackingListModal } from './PackingListModal';

interface Props {
    user: FirebaseUser | null;
    onLogin: () => void;
    onLogout: () => void;
}

export const BentoHeader: React.FC<Props> = ({ user, onLogin, onLogout }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number }>({ days: 0, hours: 0 });
    const [weather, setWeather] = useState<{ temp: number, desc: string, icon: string } | null>(null);
    const [isPackingOpen, setIsPackingOpen] = useState(false);
    const [packingProgress, setPackingProgress] = useState(0);

    // Weather Fetching
    useEffect(() => {
        const fetchWeather = async () => {
            const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
            if (!apiKey) return;

            try {
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Naha,JP&units=metric&lang=zh_tw&appid=${apiKey}`);
                if (res.ok) {
                    const data = await res.json();
                    setWeather({
                        temp: Math.round(data.main.temp),
                        desc: data.weather[0].description,
                        icon: data.weather[0].icon
                    });
                }
            } catch (error) {
                console.error("Failed to fetch weather", error);
            }
        };

        fetchWeather();
        // Refresh every 30 mins
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const calculateTimeLeft = () => {
            // Default to JST (+09:00) if not specified
            const tripDateStr = import.meta.env.VITE_TRIP_START_DATE || '2026-07-01T00:00:00+09:00';
            const tripDate = new Date(tripDateStr);
            const now = new Date();
            const difference = tripDate.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                setTimeLeft({ days, hours });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="p-4 pb-0 space-y-3">
            {/* Title Row */}
            <div className="flex justify-between items-center px-1">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Okinawa 2026</h1>
                    <p className="text-xs text-slate-500 font-medium">Family Trip Planning</p>
                </div>
                <div
                    onClick={user ? onLogout : onLogin}
                    className="w-10 h-10 bento-icon-btn bg-white border border-slate-200 shadow-sm text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                        <User size={20} />
                    )}
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Countdown Card (Span 2) */}
                <div className="col-span-2 bento-card p-4 flex items-center justify-between bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-none shadow-blue-200/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <CalendarClock size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-blue-100 font-medium">距離出發還有</div>
                            <div className="text-xl font-bold font-mono tracking-wider">
                                {timeLeft.days} <span className="text-sm font-normal opacity-80">天</span> {timeLeft.hours} <span className="text-sm font-normal opacity-80">小時</span>
                            </div>
                        </div>
                    </div>
                    <Plane size={64} className="opacity-20 -mr-4 -mb-4 rotate-12" />
                </div>

                {/* Weather Card */}
                <div className="bento-card p-3 flex flex-col justify-between h-28 bg-gradient-to-br from-amber-100 to-orange-50 border-orange-100 relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">那霸市</span>
                        {weather ? (
                            <img
                                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                                className="w-8 h-8 -mt-1 -mr-1"
                                alt={weather.desc}
                            />
                        ) : (
                            <CloudSun className="text-orange-400" size={20} />
                        )}
                    </div>
                    <div className="z-10">
                        <div className="text-3xl font-black text-slate-800">
                            {weather ? weather.temp : '--'}
                            <span className="text-lg text-slate-400 font-medium">°C</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {weather ? weather.desc : '尚無資料 (需 API Key)'}
                        </div>
                    </div>
                </div>

                {/* Packing List Card */}
                <div
                    onClick={() => setIsPackingOpen(true)}
                    className="bento-card p-3 flex flex-col justify-between h-28 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 cursor-pointer hover:shadow-md group"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">行李準備</span>
                        <Backpack className="text-indigo-500 group-hover:scale-110 transition-transform" size={20} />
                    </div>

                    <div className="flex items-end gap-2">
                        <div className="text-3xl font-black text-slate-800">{packingProgress}<span className="text-lg text-slate-400 font-medium">%</span></div>

                        {/* Simple Circular Progress Visual */}
                        <div className="w-8 h-8 relative mb-1">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="4"
                                    strokeDasharray={`${packingProgress}, 100`}
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="text-xs text-indigo-400 font-medium">點擊檢查清單</div>
                </div>
            </div>

            <PackingListModal
                isOpen={isPackingOpen}
                userId={user?.uid}
                onClose={() => setIsPackingOpen(false)}
                onUpdateProgress={setPackingProgress}
            />
        </header>
    );
};

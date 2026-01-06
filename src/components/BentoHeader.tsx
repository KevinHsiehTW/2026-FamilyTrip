import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { CloudSun, JapaneseYen, LogOut, User, Plane, CalendarClock } from 'lucide-react';

interface Props {
    user: FirebaseUser | null;
    onLogin: () => void;
    onLogout: () => void;
}

export const BentoHeader: React.FC<Props> = ({ user, onLogin, onLogout }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number }>({ days: 0, hours: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const tripDate = new Date('2026-07-01T00:00:00'); // Example date
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
                <div className="bento-card p-3 flex flex-col justify-between h-28 bg-gradient-to-br from-amber-100 to-orange-50 border-orange-100">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">那霸市</span>
                        <CloudSun className="text-orange-400" size={20} />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-800">28°<span className="text-lg text-slate-400 font-medium">C</span></div>
                        <div className="text-xs text-slate-500 mt-1">晴朗多雲</div>
                    </div>
                </div>

                {/* Rate Card */}
                <div className="bento-card p-3 flex flex-col justify-between h-28 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">日圓匯率</span>
                        <JapaneseYen className="text-emerald-500" size={20} />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-800">0.214</div>
                        <div className="text-xs text-emerald-600 font-medium mt-1">▼ 0.15%</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

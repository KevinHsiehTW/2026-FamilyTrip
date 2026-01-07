import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User as FirebaseUser, updateProfile } from 'firebase/auth';
import { X, Save, User as UserIcon, Loader2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: FirebaseUser;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(user, {
                displayName: displayName
            });
            setMessage({ type: 'success', text: '個人資料更新成功！' });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '更新失敗，請稍後再試。' });
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm animate-fade-in no-scrollbar flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative animate-slide-up flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col items-center mt-2">
                        <div className="w-24 h-24 rounded-full border-4 border-white/30 shadow-lg mb-3 overflow-hidden bg-white/10 flex items-center justify-center">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={40} className="text-white/80" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold">{user.displayName || 'User'}</h2>
                        <p className="text-blue-100 text-sm">{user.email}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            顯示名稱
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="輸入您的暱稱"
                        />
                    </div>

                    <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            User ID
                        </label>
                        <code className="block w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono overflow-hidden text-ellipsis">
                            {user.uid}
                        </code>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || displayName === user.displayName}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        儲存變更
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

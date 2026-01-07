import React, { useState, useEffect } from 'react';
import { Heart, Trash2, AlertTriangle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { WishlistItem } from '../types';

interface Props {
    item: WishlistItem;
    user: FirebaseUser | null;
    onVote: (item: WishlistItem) => void;
    onDelete: (id: string) => void;
}

export const WishlistCard: React.FC<Props> = ({ item, user, onVote, onDelete }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Check if user is owner or voter
    const isVoted = user && item.votedBy?.includes(user.uid);
    const isOwner = user && item.createdBy === user.uid;

    // Auto reset confirm state after 3 seconds
    useEffect(() => {
        if (confirmDelete) {
            const timer = setTimeout(() => setConfirmDelete(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirmDelete]);

    const handleDeleteClick = () => {
        if (confirmDelete) {
            onDelete(item.id);
        } else {
            setConfirmDelete(true);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:shadow-md">
            <div className="flex flex-col">
                <span className={`font-medium transition-colors ${confirmDelete ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.name}
                </span>
                {item.creatorName && (
                    <span className="text-[10px] text-slate-400 font-medium">
                        by {item.creatorName}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-3">
                {isOwner && (
                    <button
                        onClick={handleDeleteClick}
                        className={`
                            relative flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all overflow-hidden
                            ${confirmDelete
                                ? 'bg-red-500 text-white w-24 justify-center shadow-red-200 shadow-md'
                                : 'text-slate-300 hover:text-red-400 w-8 justify-center hover:bg-slate-50'
                            }
                        `}
                    >
                        {confirmDelete ? (
                            <>
                                <AlertTriangle size={14} className="animate-pulse" />
                                <span className="text-xs font-bold whitespace-nowrap">確定？</span>
                            </>
                        ) : (
                            <Trash2 size={16} />
                        )}
                    </button>
                )}

                <button
                    onClick={() => onVote(item)}
                    disabled={confirmDelete}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95 ${isVoted
                        ? 'bg-rose-100 text-rose-500 shadow-inner ring-1 ring-rose-200'
                        : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-400'
                        } ${confirmDelete ? 'opacity-30 pointer-events-none' : ''}`}
                >
                    <Heart size={16} className={`transition-all ${isVoted ? 'fill-rose-500 scale-110' : 'fill-transparent'}`} />
                    <span className="font-bold text-sm">{item.votes}</span>
                </button>
            </div>
        </div>
    );
};

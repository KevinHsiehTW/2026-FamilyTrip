import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc, getDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { User, MessageCircle, Clock, Search, ChevronRight, Bot } from 'lucide-react';

interface ChatSession {
    userId: string;
    userName: string;
    userPhoto: string;
    lastMessage: string;
    lastMessageAt: any;
    updatedAt: any;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
}

export const AdminChatView: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch Chat Sessions
    useEffect(() => {
        if (!db) return;

        const q = query(
            collection(db, "chats"),
            orderBy("updatedAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedSessions: ChatSession[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedSessions.push({
                    userId: doc.id,
                    ...data
                } as ChatSession);
            });
            setSessions(loadedSessions);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Messages for Selected User
    useEffect(() => {
        if (!db || !selectedUserId) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, "chats", selectedUserId, "messages"),
            orderBy("timestamp", "asc"),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedMessages: Message[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedMessages.push({
                    id: doc.id,
                    text: data.text,
                    sender: data.sender,
                    timestamp: data.timestamp?.toMillis() || Date.now()
                });
            });
            setMessages(loadedMessages);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => unsubscribe();
    }, [selectedUserId]);

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-full bg-slate-100 rounded-3xl overflow-hidden shadow-xl border border-slate-200">
            {/* Sidebar: User List */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <MessageCircle size={20} className="text-blue-500" />
                        導遊對話紀錄
                    </h2>
                    <div className="mt-3 relative">
                        <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜尋使用者..."
                            className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-400 text-sm">載入中...</div>
                    ) : sessions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                            <MessageCircle size={32} className="opacity-20" />
                            <p>目前沒有對話紀錄</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.userId}
                                onClick={() => setSelectedUserId(session.userId)}
                                className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${selectedUserId === session.userId ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                                            <User size={12} className="text-slate-500" />
                                        </div>
                                        <span className={`font-bold text-sm ${selectedUserId === session.userId ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {session.userName}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {formatTime(session.lastMessageAt)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {session.lastMessage}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Area: Chat History */}
            <div className="flex-1 flex flex-col bg-slate-50">
                {selectedUserId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                    <User size={20} className="text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">
                                        {sessions.find(s => s.userId === selectedUserId)?.userName}
                                    </h3>
                                    <p className="text-xs text-slate-500">User ID: {selectedUserId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.map((msg) => {
                                const isAi = msg.sender === 'ai';
                                return (
                                    <div key={msg.id} className={`flex gap-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
                                        {isAi && (
                                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 border border-violet-200 mt-1">
                                                <Bot size={16} className="text-violet-600" />
                                            </div>
                                        )}

                                        <div className={`max-w-[70%] space-y-1 ${isAi ? 'items-start' : 'items-end flex flex-col'}`}>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isAi
                                                ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                                : 'bg-blue-500 text-white rounded-tr-none shadow-blue-200'
                                                }`}>
                                                {msg.text.split('\n').map((line, i) => (
                                                    <React.Fragment key={i}>
                                                        {line}
                                                        {i < msg.text.split('\n').length - 1 && <br />}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-slate-300 px-1">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        {!isAi && (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200 mt-1">
                                                <User size={14} className="text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <MessageCircle size={64} className="mb-4 opacity-20" />
                        <p>請從左側選擇一位使用者來查看對話</p>
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, ItineraryItem } from '../types';
import { generateTripResponse } from '../services/ai';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, limit } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface Props {
    itineraryData: Record<number, ItineraryItem[]>;
}

export const ChatInterface: React.FC<Props> = ({ itineraryData }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            text: "嗨！我是你的 AI 導遊。關於這次沖繩行，想知道什麼都可以問我喔！\n你可以問：「哪一天要去水族館？」或「第三天晚餐吃什麼？」",
            sender: 'ai',
            timestamp: Date.now()
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auth Listener
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Firestore Listener
    useEffect(() => {
        if (!db || !user) return;

        // Listen to messages subcollection
        const q = query(
            collection(db, "chats", user.uid, "messages"),
            orderBy("timestamp", "asc"),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) return;

            const loadedMessages: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedMessages.push({
                    id: doc.id,
                    text: data.text,
                    sender: data.sender,
                    timestamp: data.timestamp?.toMillis() || Date.now()
                });
            });

            // Should prompt be included? Maybe check if it exists or just prepend default
            // For now, if we have history, we might not need the default greeting, 
            // OR we always prepend it visually if list is empty? 
            // Let's prepend default if loadedMessages is empty AND we haven't typed anything - actually just verify if we have messages.

            if (loadedMessages.length > 0) {
                setMessages(loadedMessages);
            }
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const text = input.trim();
        setInput("");
        setLoading(true);

        try {
            // 1. Optimistic update (optional, but good for UI responsiveness)
            // But since we have a listener, we might just wait? 
            // Let's add purely for visual snap if listener is slow, but usually listener is fast.
            // Actually, for simplicity and to avoid clutter/duplication with listener, let's rely on listener OR add optimistic and reconcile.
            // Let's just create the firestore docs.

            if (!user || !db) {
                // Fallback for demo/no-auth
                const userMsg: ChatMessage = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
                setMessages(prev => [...prev, userMsg]);

                const aiResponseText = await generateTripResponse(text, itineraryData);
                const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: aiResponseText, sender: 'ai', timestamp: Date.now() };
                setMessages(prev => [...prev, aiMsg]);
                setLoading(false);
                return;
            }

            // 2. Save User Message
            const chatRef = doc(db, "chats", user.uid);
            const messagesRef = collection(chatRef, "messages");

            await addDoc(messagesRef, {
                text,
                sender: 'user',
                timestamp: serverTimestamp()
            });

            // 3. Update Chat Metadata (for Admin View)
            await setDoc(chatRef, {
                userId: user.uid,
                userName: user.displayName || 'Visitor',
                userPhoto: user.photoURL || '',
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            // 4. Call AI
            const aiResponseText = await generateTripResponse(text, itineraryData);

            // 5. Save AI Message
            await addDoc(messagesRef, {
                text: aiResponseText,
                sender: 'ai',
                timestamp: serverTimestamp()
            });

            // Update Metadata again with AI response snippet
            await setDoc(chatRef, {
                lastMessage: `(AI) ${aiResponseText.substring(0, 50)}...`,
                lastMessageAt: serverTimestamp()
            }, { merge: true });

        } catch (error) {
            console.error("Chat Error:", error);
            // Revert or show error could go here
            setMessages(prev => [...prev, { id: 'err', text: "訊息發送失敗，請檢查網路連線。", sender: 'ai', timestamp: Date.now() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-4 shadow-lg text-white flex items-center gap-3 shrink-0">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <Sparkles size={20} className="text-yellow-300" />
                </div>
                <div>
                    <h2 className="font-bold">AI 智慧導遊</h2>
                    <p className="text-xs text-violet-100 opacity-90">Powered by Gemini</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-10 text-sm">
                        開始跟導遊聊聊吧！
                    </div>
                )}

                {messages.map((msg) => {
                    const isAi = msg.sender === 'ai';
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}>
                            {isAi && (
                                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 border border-violet-200">
                                    <Bot size={16} className="text-violet-600" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isAi
                                ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none shadow-blue-200'
                                }`}>
                                {msg.text.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i < msg.text.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </div>
                            {!isAi && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} className="w-full h-full rounded-full object-cover" alt="Me" />
                                    ) : (
                                        <User size={16} className="text-blue-600" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Loading Indicator */}
                {loading && (
                    <div className="flex gap-3 justify-start animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 border border-violet-200">
                            <Sparkles size={16} className="text-violet-400" />
                        </div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 text-slate-400 text-sm flex gap-1 items-center">
                            <span>思考中</span>
                            <span className="animate-bounce delay-75">.</span>
                            <span className="animate-bounce delay-150">.</span>
                            <span className="animate-bounce delay-300">.</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pb-32 bg-slate-50 border-t border-slate-100 shrink-0">
                <form
                    onSubmit={handleSend}
                    className="flex gap-2 bg-white p-2 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-violet-200 transition-all"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="問問導遊..."
                        className="flex-1 bg-transparent px-3 outline-none text-slate-700 placeholder:text-slate-400"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className={`p-3 rounded-xl transition-all ${!input.trim() || loading
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-violet-500 text-white shadow-lg shadow-violet-200 active:scale-95'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

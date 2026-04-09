'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/utils/supabase/client';

interface Conversation {
    id: string;
    title: string;
    updated_at: string;
}

interface OrderIntent {
    companyId: string;
    companyName: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    sector: string;
}

export default function ShareSaathiChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('general');
    const { companies } = useAppStore();
    const { user } = useAuth();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string, toolData?: any }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Chat history state
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // Order intent state
    const [orderIntent, setOrderIntent] = useState<OrderIntent | null>(null);

    // Load conversations list
    useEffect(() => {
        if (!user || !isOpen) return;
        const loadConversations = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('chat_conversations')
                .select('id, title, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(20);
            if (data) setConversations(data);
        };
        loadConversations();
    }, [user, isOpen]);

    const loadConversation = async (convId: string) => {
        const supabase = createClient();
        const { data } = await supabase
            .from('chat_messages')
            .select('id, role, content')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        if (data) {
            setMessages(data.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
            setActiveConversationId(convId);
            setShowHistory(false);
        }
    };

    const startNewConversation = () => {
        setMessages([]);
        setActiveConversationId(null);
        setShowHistory(false);
        setOrderIntent(null);
    };

    const saveMessages = async (userMsg: string, assistantMsg: string) => {
        if (!user) return;
        const supabase = createClient();

        let convId = activeConversationId;
        if (!convId) {
            const title = userMsg.substring(0, 50) + (userMsg.length > 50 ? '...' : '');
            const { data } = await supabase
                .from('chat_conversations')
                .insert({ user_id: user.id, title, company_id: selectedCompanyId === 'general' ? null : selectedCompanyId })
                .select('id')
                .single();
            if (data) {
                convId = data.id;
                setActiveConversationId(convId);
                setConversations(prev => [{ id: convId!, title, updated_at: new Date().toISOString() }, ...prev]);
            }
        }

        if (convId) {
            await supabase.from('chat_messages').insert([
                { conversation_id: convId, role: 'user', content: userMsg },
                { conversation_id: convId, role: 'assistant', content: assistantMsg },
            ]);
            await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
        }
    };

    // Listen for external chat triggers
    useEffect(() => {
        const handleTrigger = (event: any) => {
            const { message, companyId } = event.detail || {};
            setIsOpen(true);
            if (companyId) setSelectedCompanyId(companyId);
            if (message) {
                setInput(message);
                setTimeout(() => {
                    const submitBtn = document.getElementById('chat-submit-btn');
                    submitBtn?.click();
                }, 100);
            }
        };

        window.addEventListener('sharesaathi-chat-trigger', handleTrigger);
        return () => window.removeEventListener('sharesaathi-chat-trigger', handleTrigger);
    }, []);

    // Parse tool results from streamed text
    const parseToolResults = (text: string) => {
        // Check for order intent in the response
        const orderMatch = text.match(/"action"\s*:\s*"ORDER_INTENT"/);
        if (orderMatch) {
            try {
                const jsonMatch = text.match(/\{[^{}]*"orderData"[^{}]*\{[^{}]*\}[^{}]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.orderData) {
                        setOrderIntent(parsed.orderData);
                    }
                }
            } catch { /* ignore parse errors */ }
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setOrderIntent(null);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    userId: user?.id,
                    selectedCompanyId
                }),
            });

            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '' };
            setMessages(prev => [...prev, assistantMsg]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantMsg.content += chunk;

                setMessages(prev =>
                    prev.map(m => m.id === assistantMsg.id ? { ...assistantMsg } : m)
                );
            }

            // Check for tool results in the response
            parseToolResults(assistantMsg.content);

            // Save to DB
            saveMessages(userMsg.content, assistantMsg.content);
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrderConfirm = () => {
        if (!orderIntent) return;
        // Navigate to shares page with order pre-filled
        window.location.href = `/shares/${orderIntent.companyId}?action=${orderIntent.type}&qty=${orderIntent.quantity}`;
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!user) return null;

    return (
        <div className={`fixed z-50 flex flex-col items-end ${isOpen ? 'inset-0 md:inset-auto md:bottom-6 md:right-6' : 'bottom-20 right-4 md:bottom-6 md:right-6'}`}>
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-surface-elevated border-0 md:border border-border rounded-none md:rounded-2xl shadow-2xl w-full h-full md:w-96 md:h-auto md:mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="CpuChipIcon" size={18} variant="solid" className="text-white/90" />
                                <span className="font-bold tracking-tight">ShareX AI</span>
                                <span className="text-[9px] bg-white/20 rounded-full px-2 py-0.5 font-medium">RAG + Tools</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setShowHistory(!showHistory)} className="text-white/80 hover:text-white transition-colors p-1" title="Chat history">
                                    <Icon name="ClockIcon" size={18} />
                                </button>
                                <button onClick={startNewConversation} className="text-white/80 hover:text-white transition-colors p-1" title="New chat">
                                    <Icon name="PlusIcon" size={18} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                                    <Icon name="XMarkIcon" size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-2">
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/50 [&>option]:text-foreground"
                            >
                                <option value="general">General Market / Portfolio</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>Discuss {c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* History sidebar */}
                    {showHistory && (
                        <div className="absolute inset-0 top-[100px] bg-background z-10 overflow-y-auto">
                            <div className="p-3 border-b border-border">
                                <button onClick={startNewConversation} className="w-full text-left px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2">
                                    <Icon name="PlusIcon" size={16} /> New Conversation
                                </button>
                            </div>
                            <div className="divide-y divide-border/50">
                                {conversations.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted">No conversations yet</div>
                                ) : conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => loadConversation(conv.id)}
                                        className={`w-full text-left px-4 py-3 hover:bg-surface transition-colors ${activeConversationId === conv.id ? 'bg-surface' : ''}`}
                                    >
                                        <div className="text-sm font-medium text-foreground truncate">{conv.title}</div>
                                        <div className="text-[10px] text-muted mt-0.5">{new Date(conv.updated_at).toLocaleDateString()}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto min-h-0 md:min-h-[300px] md:max-h-[400px] bg-surface/50 text-sm flex flex-col gap-3">
                        {messages.length === 0 && (
                            <div className="text-center text-muted text-xs my-auto p-4 border border-border border-dashed rounded-xl">
                                Hi {user.name}, I'm ShareX, your pro investing AI. {selectedCompanyId !== 'general' ? `I'm loaded with exclusive insights on ${companies.find(c => c.id === selectedCompanyId)?.name}. Ask me anything.` : "Select a stock to discuss, or ask me about your portfolio."}
                                <div className="mt-3 space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted/70">Try saying:</p>
                                    <button onClick={() => setInput('I want to buy 50 shares of Swiggy')} className="block w-full text-left px-3 py-1.5 rounded-lg bg-surface hover:bg-primary/5 text-xs text-muted hover:text-primary transition-colors border border-border/50">
                                        "I want to buy 50 shares of Swiggy"
                                    </button>
                                    <button onClick={() => setInput('What if NSDL IPOs at 2x valuation?')} className="block w-full text-left px-3 py-1.5 rounded-lg bg-surface hover:bg-primary/5 text-xs text-muted hover:text-primary transition-colors border border-border/50">
                                        "What if NSDL IPOs at 2x valuation?"
                                    </button>
                                    <button onClick={() => setInput('Tell me about HDB Financial')} className="block w-full text-left px-3 py-1.5 rounded-lg bg-surface hover:bg-primary/5 text-xs text-muted hover:text-primary transition-colors border border-border/50">
                                        "Tell me about HDB Financial"
                                    </button>
                                </div>
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl ${m.role === 'user'
                                    ? 'bg-foreground text-background rounded-tr-sm'
                                    : 'bg-surface border border-border shadow-sm rounded-tl-sm text-foreground'
                                    }`}>
                                    <div className="whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert">
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-surface border border-border shadow-sm p-3 rounded-2xl rounded-tl-sm text-muted">
                                    <Icon name="ArrowPathIcon" size={14} className="animate-spin" />
                                </div>
                            </div>
                        )}

                        {/* Order Intent Card */}
                        {orderIntent && (
                            <div className="mx-auto w-full max-w-[90%] p-3 rounded-xl border-2 border-primary/30 bg-primary/5 animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="ShoppingCartIcon" size={16} className="text-primary" />
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Order Ready</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{orderIntent.type.toUpperCase()} {orderIntent.companyName}</p>
                                        <p className="text-xs text-muted">{orderIntent.quantity} shares @ ₹{orderIntent.price.toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm font-bold text-foreground">₹{(orderIntent.quantity * orderIntent.price).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleOrderConfirm}
                                        className="flex-1 bg-primary text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Proceed to Order
                                    </button>
                                    <button
                                        onClick={() => setOrderIntent(null)}
                                        className="px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:bg-surface transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleFormSubmit} className="p-3 bg-surface-elevated border-t border-border flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask ShareX... (try: buy 50 Swiggy shares)"
                            className="flex-1 bg-surface border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                        />
                        <button
                            id="chat-submit-btn"
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[36px]"
                        >
                            <Icon name="PaperAirplaneIcon" size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative overflow-hidden bg-primary text-white shadow-2xl border border-white/10 transition-all duration-500 ease-out flex items-center h-14 ${isOpen
                    ? 'hidden md:flex w-48 px-4 rounded-2xl ring-2 ring-accent/20'
                    : 'w-14 rounded-full md:hover:w-48 px-0'
                    }`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="flex items-center gap-3 w-full justify-start pl-[13px]">
                    <div className="relative shrink-0 flex items-center justify-center">
                        <Icon
                            name="CpuChipIcon"
                            variant="solid"
                            size={28}
                            className={`transition-all duration-500 ${isOpen
                                ? 'text-accent rotate-0 scale-100'
                                : 'text-white group-hover:text-accent group-hover:rotate-12'
                                }`}
                        />
                        {!isOpen && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-primary">
                                <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-75" />
                            </div>
                        )}
                    </div>
                    <span className={`font-bold tracking-widest text-xs transition-all duration-500 whitespace-nowrap ${isOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0'
                        }`}>
                        SHAREX AI
                    </span>
                    {isOpen && (
                        <div className="ml-auto flex items-center shrink-0">
                            <Icon name="XMarkIcon" size={18} className="text-white/40 hover:text-white transition-colors" />
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
// Removed useChat import
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';

export default function ShareSaathiChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('general');
    const { companies } = useAppStore();
    const { user } = useAuth();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [input, setInput] = useState('');

    const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Listen for external chat triggers (e.g. from Dashboard Portfolio button)
    useEffect(() => {
        const handleTrigger = (event: any) => {
            const { message, companyId } = event.detail || {};
            setIsOpen(true);
            if (companyId) setSelectedCompanyId(companyId);
            if (message) {
                // Clear and send if needed, or just set input
                setInput(message);
                // Auto-submit if we want immediate analysis
                setTimeout(() => {
                    const submitBtn = document.getElementById('chat-submit-btn');
                    submitBtn?.click();
                }, 100);
            }
        };

        window.addEventListener('sharesaathi-chat-trigger', handleTrigger);
        return () => window.removeEventListener('sharesaathi-chat-trigger', handleTrigger);
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

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
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!user) return null; // Only show for logged in users

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white border border-border rounded-2xl shadow-2xl w-80 md:w-96 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="CpuChipIcon" size={18} variant="solid" className="text-white/90" />
                                <span className="font-bold tracking-tight">ShareX AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
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

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px] bg-surface/50 text-sm flex flex-col gap-3">
                        {messages.length === 0 && (
                            <div className="text-center text-muted text-xs my-auto p-4 border border-border border-dashed rounded-xl">
                                Hi {user.name}, I'm ShareX, your pro investing AI. {selectedCompanyId !== 'general' ? `I'm loaded with exclusive insights on ${companies.find(c => c.id === selectedCompanyId)?.name}. Ask me anything.` : "Select a stock to discuss, or ask me about your portfolio."}
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl ${m.role === 'user'
                                    ? 'bg-foreground text-background rounded-tr-sm'
                                    : 'bg-white border border-border shadow-sm rounded-tl-sm'
                                    }`}>
                                    <div className="whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert">
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-border shadow-sm p-3 rounded-2xl rounded-tl-sm text-muted">
                                    <Icon name="ArrowPathIcon" size={14} className="animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-border flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask ShareX..."
                            className="flex-1 bg-surface border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
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

            {/* Toggle Button / Expanding Pill */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative overflow-hidden bg-slate-900 text-white shadow-2xl border border-white/10 transition-all duration-500 ease-out flex items-center h-14 ${isOpen
                    ? 'w-48 px-4 rounded-2xl ring-2 ring-primary/20'
                    : 'w-14 rounded-full hover:w-48 px-0'
                    }`}
            >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />

                <div className="flex items-center gap-3 w-full justify-start pl-[13px]">
                    <div className="relative shrink-0 flex items-center justify-center">
                        <Icon
                            name="CpuChipIcon"
                            variant="solid"
                            size={28}
                            className={`transition-all duration-500 ${isOpen
                                ? 'text-primary rotate-0 scale-100'
                                : 'text-white group-hover:text-primary group-hover:rotate-12'
                                }`}
                        />

                        {/* Small Pulsing Indicator - only when closed */}
                        {!isOpen && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-slate-900">
                                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
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

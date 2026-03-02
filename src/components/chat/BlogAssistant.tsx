'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Blog, useAppStore } from '@/lib/store';
import Icon from '@/components/ui/AppIcon';

interface BlogAssistantProps {
    blog: Blog;
}

export default function BlogAssistant({ blog }: BlogAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const { orders, companies } = useAppStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initial greeting
            const greeting = `Hi ${user?.name || 'there'}! I've analyzed this article: "${blog.title}". Ask me what's important for you or how it affects your portfolio.`;
            setMessages([{ id: 'init', role: 'assistant', content: greeting }]);
        }
    }, [isOpen]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // We'll reuse the same chat API but with extra context
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    userId: user?.id,
                    blogContext: {
                        title: blog.title,
                        content: blog.content,
                        excerpt: blog.excerpt
                    }
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

    if (!user) return null; // Only for logged in customers

    return (
        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white/95 backdrop-blur-xl border border-primary/20 rounded-[32px] shadow-2xl w-[380px] mb-6 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-500 scale-100 ring-1 ring-black/5">
                    {/* Header */}
                    <div className="bg-primary p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Icon name="CpuChipIcon" size={20} variant="solid" className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-lg tracking-tight">ShareX Insight</h3>
                                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">AI Market Analyst</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-6 overflow-y-auto min-h-[400px] max-h-[500px] bg-white/50 space-y-4">
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl ${m.role === 'user'
                                    ? 'bg-foreground text-background shadow-xl rounded-tr-sm'
                                    : 'bg-white border border-border shadow-md rounded-tl-sm'
                                    }`}>
                                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-border shadow-sm p-4 rounded-3xl rounded-tl-sm text-muted">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleFormSubmit} className="p-6 bg-white border-t border-border/50 flex gap-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask ShareX about this news..."
                            className="flex-1 bg-surface border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-primary text-white p-3 rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center min-w-[48px]"
                        >
                            <Icon name="PaperAirplaneIcon" size={20} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative h-16 rounded-[24px] shadow-2xl transition-all duration-700 ease-out flex items-center gap-3 overflow-hidden ${isOpen
                    ? 'w-16 bg-white border border-border text-foreground'
                    : 'w-64 bg-slate-900 border border-white/10 text-white hover:w-[270px] hover:bg-black active:scale-95'
                    }`}
            >
                {/* Glow Effect */}
                {!isOpen && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}

                <div className={`shrink-0 flex items-center justify-center transition-all duration-700 ${isOpen ? 'mx-auto' : 'ml-5'}`}>
                    <Icon
                        name="CpuChipIcon"
                        variant="solid"
                        size={28}
                        className={`transition-all duration-700 ${isOpen ? 'text-primary rotate-0' : 'text-primary group-hover:rotate-12 group-hover:scale-110'}`}
                    />
                </div>

                {!isOpen && (
                    <div className="flex flex-col items-start transition-all duration-700">
                        <span className="font-display font-bold text-xs tracking-[0.2em] uppercase whitespace-nowrap">AI Insight Engine</span>
                        <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest whitespace-nowrap">Analyze this article</span>
                    </div>
                )}
            </button>
        </div>
    );
}

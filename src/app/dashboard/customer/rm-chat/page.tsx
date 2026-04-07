'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface Message {
    id: string;
    sender: 'customer' | 'rm';
    text: string;
    timestamp: string;
    read: boolean;
}

const CANNED_RM_RESPONSES: Record<string, string> = {
    'order': "I can see your recent orders. Could you share the specific order ID you're referring to? I'll look into it right away.",
    'payment': "For payment-related queries, please share your transaction reference number. I'll verify the status with our finance team.",
    'demat': "Dematerialization typically takes 15-21 working days. I'll check the current status of your request and update you.",
    'kyc': "I can help with your KYC verification. Please ensure you've uploaded your PAN, Aadhaar, and a recent bank statement.",
    'price': "Unlisted share prices fluctuate based on secondary market demand. I can share the latest indicative pricing for any company you're interested in.",
    'default': "Thank you for reaching out. I'm reviewing your query and will get back to you shortly. Is there anything specific I can help with regarding your portfolio?",
};

function getRmResponse(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('order') || lower.includes('buy') || lower.includes('sell')) return CANNED_RM_RESPONSES['order'];
    if (lower.includes('payment') || lower.includes('pay') || lower.includes('transfer') || lower.includes('utr')) return CANNED_RM_RESPONSES['payment'];
    if (lower.includes('demat') || lower.includes('physical') || lower.includes('certificate')) return CANNED_RM_RESPONSES['demat'];
    if (lower.includes('kyc') || lower.includes('verify') || lower.includes('pan') || lower.includes('aadhaar')) return CANNED_RM_RESPONSES['kyc'];
    if (lower.includes('price') || lower.includes('valuation') || lower.includes('cost')) return CANNED_RM_RESPONSES['price'];
    return CANNED_RM_RESPONSES['default'];
}

export default function RmChatPage() {
    const { user } = useAuth();
    const { users } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [rmOnline, setRmOnline] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCustomerMsgRef = useRef<string>('');

    const assignedRm = users.find(u => u.id === (user as any)?.assignedRmId);
    const rmName = assignedRm?.name || 'Priya Patel';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Determine RM online status based on last RM message timestamp
    const checkRmOnlineStatus = useCallback((msgs: Message[]) => {
        const lastRmMsg = [...msgs].reverse().find(m => m.sender === 'rm');
        if (lastRmMsg) {
            const diff = Date.now() - new Date(lastRmMsg.timestamp).getTime();
            setRmOnline(diff < 5 * 60 * 1000); // online if sent within last 5 minutes
        } else {
            setRmOnline(false);
        }
    }, []);

    // Initialize: fetch or create conversation, load messages, subscribe to realtime
    useEffect(() => {
        if (!user?.id) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;

        const init = async () => {
            // 1. Fetch or create conversation
            let convId: string;

            const { data: existing, error: fetchErr } = await supabase
                .from('chat_conversations')
                .select('id')
                .eq('user_id', user.id)
                .eq('title', 'rm_chat')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (existing?.id) {
                convId = existing.id;
            } else {
                const { data: created, error: createErr } = await supabase
                    .from('chat_conversations')
                    .insert({ user_id: user.id, title: 'rm_chat' })
                    .select('id')
                    .single();

                if (!created?.id) {
                    console.error('Failed to create conversation', createErr);
                    return;
                }
                convId = created.id;
            }

            setConversationId(convId);

            // 2. Load existing messages
            const { data: rows, error: loadErr } = await supabase
                .from('chat_messages')
                .select('id, role, content, created_at')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });

            const loaded: Message[] = (rows || []).map(r => ({
                id: r.id,
                sender: r.role === 'rm' ? 'rm' : 'customer',
                text: r.content,
                timestamp: r.created_at,
                read: true,
            }));

            setMessages(loaded);
            checkRmOnlineStatus(loaded);

            // 3. Subscribe to realtime inserts on chat_messages for this conversation
            channel = supabase
                .channel(`rm-chat-${convId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'chat_messages',
                        filter: `conversation_id=eq.${convId}`,
                    },
                    (payload) => {
                        const row = payload.new as { id: string; role: string; content: string; created_at: string };
                        const newMsg: Message = {
                            id: row.id,
                            sender: row.role === 'rm' ? 'rm' : 'customer',
                            text: row.content,
                            timestamp: row.created_at,
                            read: false,
                        };

                        setMessages(prev => {
                            // Avoid duplicates (we already optimistically added customer messages)
                            if (prev.some(m => m.id === row.id)) return prev;
                            const updated = [...prev, newMsg];
                            return updated;
                        });

                        // If an RM message arrives, clear the fallback timer and update typing
                        if (row.role === 'rm') {
                            if (fallbackTimerRef.current) {
                                clearTimeout(fallbackTimerRef.current);
                                fallbackTimerRef.current = null;
                            }
                            setIsTyping(false);
                            setRmOnline(true);
                        }
                    }
                )
                .subscribe();
        };

        init();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
            }
        };
    }, [user?.id, checkRmOnlineStatus]);

    const sendMessage = async () => {
        if (!input.trim() || !conversationId) return;

        const text = input.trim();
        setInput('');
        setIsTyping(true);
        lastCustomerMsgRef.current = text;

        // Insert customer message into DB
        const { data: inserted, error } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                role: 'customer',
                content: text,
            })
            .select('id, created_at')
            .single();

        if (error) {
            console.error('Failed to send message', error);
            setIsTyping(false);
            return;
        }

        // Optimistically add customer message to local state
        if (inserted) {
            const customerMsg: Message = {
                id: inserted.id,
                sender: 'customer',
                text,
                timestamp: inserted.created_at,
                read: true,
            };
            setMessages(prev => {
                if (prev.some(m => m.id === inserted.id)) return prev;
                return [...prev, customerMsg];
            });
        }

        // Update conversation timestamp
        await supabase
            .from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        // Start 30s fallback timer: if no real RM reply arrives, auto-generate one
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
        }
        fallbackTimerRef.current = setTimeout(async () => {
            const cannedReply = getRmResponse(lastCustomerMsgRef.current);

            const { error: fallbackErr } = await supabase
                .from('chat_messages')
                .insert({
                    conversation_id: conversationId,
                    role: 'rm',
                    content: cannedReply,
                });

            if (fallbackErr) {
                console.error('Failed to insert fallback RM message', fallbackErr);
                // Still clear typing even on error
                setIsTyping(false);
            }
            // The realtime subscription will pick up the insert and add it to messages
            fallbackTimerRef.current = null;
        }, 30000);
    };

    const quickActions = [
        { label: 'Order status', msg: 'What is the status of my recent order?' },
        { label: 'Payment issue', msg: 'I have a payment-related query' },
        { label: 'Demat update', msg: 'Can you check my demat request status?' },
        { label: 'Price enquiry', msg: 'What are the latest prices available?' },
    ];

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">RM Chat</h1>
            </div>

            <Card className="border-border shadow-sm overflow-hidden">
                {/* RM Header */}
                <CardHeader className="border-b border-border bg-white p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                                {rmName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{rmName}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${rmOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                    <span className="text-xs text-muted">
                                        Relationship Manager · {rmOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/dashboard/customer/callback">
                                <Button size="sm" variant="outline" className="text-xs">
                                    <Icon name="PhoneIcon" size={14} className="mr-1" /> Request Call
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="p-0 bg-surface/30">
                    <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] ${msg.sender === 'customer' ? 'order-1' : ''}`}>
                                    {msg.sender === 'rm' && (
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                {rmName.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-semibold text-muted">{rmName}</span>
                                        </div>
                                    )}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                        msg.sender === 'customer'
                                            ? 'bg-primary text-white rounded-br-md'
                                            : 'bg-white border border-border text-foreground rounded-bl-md'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <p className={`text-[10px] text-muted mt-1 ${msg.sender === 'customer' ? 'text-right' : ''}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                        {quickActions.map(qa => (
                            <button
                                key={qa.label}
                                onClick={() => { setInput(qa.msg); inputRef.current?.focus(); }}
                                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                                {qa.label}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border bg-white">
                        <form
                            onSubmit={e => { e.preventDefault(); sendMessage(); }}
                            className="flex gap-2"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                disabled={isTyping}
                            />
                            <Button type="submit" disabled={!input.trim() || isTyping} className="bg-primary text-white hover:bg-primary/90 rounded-xl px-4">
                                <Icon name="PaperAirplaneIcon" size={18} />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';

interface Message {
    id: string;
    sender_role: string;
    sender_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function AgentSupportChat() {
    const { user } = useAuth();
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();

        // Real-time subscription
        if (user) {
            const channel = supabase
                .channel('agent-support')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'agent_support_messages',
                    filter: `agent_id=eq.${user.id}`,
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('agent_support_messages')
            .select('*')
            .eq('agent_id', user.id)
            .order('created_at', { ascending: true })
            .limit(100);

        if (data) {
            setMessages(data);
            // Mark unread admin messages as read
            const unreadIds = data.filter(m => m.sender_role === 'admin' && !m.is_read).map(m => m.id);
            if (unreadIds.length > 0) {
                await supabase.from('agent_support_messages').update({ is_read: true }).in('id', unreadIds);
            }
        } else if (user.id === 'agt_1') {
            setMessages([
                { id: '1', sender_role: 'admin', sender_id: 'admin_1', message: 'Welcome to ShareSaathi Partner Support! How can we help you today?', is_read: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
                { id: '2', sender_role: 'agent', sender_id: 'agt_1', message: 'Hi! I wanted to know when my KYC will be approved?', is_read: true, created_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString() },
                { id: '3', sender_role: 'admin', sender_id: 'admin_1', message: 'Your KYC is currently under review. It usually takes 24-48 hours. We\'ll notify you once it\'s approved!', is_read: true, created_at: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString() },
                { id: '4', sender_role: 'agent', sender_id: 'agt_1', message: 'Thank you! Also, is there a way to generate links in bulk?', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
                { id: '5', sender_role: 'admin', sender_id: 'admin_1', message: 'Yes! You can use the Bulk Link Generation feature in the Marketplace tab. Just click "Bulk Generate" and upload a CSV with client details.', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
            ]);
        }
        setLoading(false);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;

        setSending(true);
        const payload = {
            agent_id: user.id,
            sender_role: 'agent',
            sender_id: user.id,
            message: newMessage.trim(),
        };

        const { error } = await supabase.from('agent_support_messages').insert(payload);

        if (!error || user.id === 'agt_1') {
            if (user.id === 'agt_1') {
                setMessages(prev => [...prev, { ...payload, id: `m_${Date.now()}`, is_read: false, created_at: new Date().toISOString() }]);
                // Simulate admin response after 2 seconds
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: `m_${Date.now() + 1}`,
                        sender_role: 'admin',
                        sender_id: 'admin_1',
                        message: 'Thanks for your message! Our team will respond shortly. Average response time is under 2 hours during business hours (9 AM - 6 PM IST).',
                        is_read: false,
                        created_at: new Date().toISOString(),
                    }]);
                }, 2000);
            }
            setNewMessage('');
        } else {
            alert('Failed to send message: ' + error.message);
        }
        setSending(false);
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const isToday = d.toDateString() === now.toDateString();
        const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();

        if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (isYesterday) return 'Yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group messages by date
    const groupedMessages: { date: string; msgs: Message[] }[] = [];
    messages.forEach(m => {
        const date = new Date(m.created_at).toDateString();
        const last = groupedMessages[groupedMessages.length - 1];
        if (last && last.date === date) {
            last.msgs.push(m);
        } else {
            groupedMessages.push({ date, msgs: [m] });
        }
    });

    return (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
            {/* Header */}
            <div className="p-5 border-b border-border bg-surface/30 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="ChatBubbleLeftRightIcon" size={20} />
                </div>
                <div>
                    <h3 className="font-display font-bold text-foreground">Partner Support</h3>
                    <p className="text-xs text-muted">Chat with our support team. Response time: ~2 hours</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-surface/20">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                        <Icon name="ChatBubbleLeftRightIcon" size={48} className="mx-auto text-muted/30 mb-3" />
                        <p className="text-sm font-medium text-muted">No messages yet</p>
                        <p className="text-xs text-muted/80 mt-1">Start a conversation with our support team</p>
                    </div>
                ) : groupedMessages.map((group, gi) => (
                    <div key={gi}>
                        <div className="flex justify-center my-4">
                            <span className="text-[10px] bg-surface px-3 py-1 rounded-full text-muted font-medium">
                                {new Date(group.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        {group.msgs.map(msg => {
                            const isMe = msg.sender_role === 'agent';
                            return (
                                <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-white border border-border text-foreground rounded-bl-md shadow-sm'}`}>
                                        {!isMe && <p className="text-[10px] font-bold text-primary mb-1">Support Team</p>}
                                        <p className="text-sm leading-relaxed">{msg.message}</p>
                                        <p className={`text-[9px] mt-1.5 ${isMe ? 'text-white/60' : 'text-muted/60'}`}>{formatTime(msg.created_at)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-border bg-white flex items-center gap-3 shrink-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                    disabled={sending}
                />
                <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-primary text-white h-[46px] w-[46px] rounded-xl p-0 shrink-0">
                    <Icon name="PaperAirplaneIcon" size={18} />
                </Button>
            </form>
        </div>
    );
}

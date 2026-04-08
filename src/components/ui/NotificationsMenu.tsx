'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { subscribeToNotifications } from '@/lib/notifications';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    link: string;
    created_at: string;
}

export default function NotificationsMenu() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewPulse, setHasNewPulse] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
    }, [user]);

    // Real-time subscription for new notifications
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToNotifications(user.id, (newNotification) => {
            setNotifications(prev => [newNotification as Notification, ...prev]);
            // Trigger pulse animation on the bell icon
            setHasNewPulse(true);
            setTimeout(() => setHasNewPulse(false), 2000);
        });

        return () => {
            unsubscribe();
        };
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data && !error) {
            setNotifications(data as Notification[]);
        }
    };

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
    };

    const toggleOpen = () => {
        if (!isOpen) {
            fetchNotifications(); // Refresh slightly when opening
        }
        setIsOpen(!isOpen);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={toggleOpen}
                className={`relative p-2 text-muted hover:text-foreground rounded-full hover:bg-surface transition-colors focus:outline-none ${hasNewPulse ? 'animate-pulse' : ''}`}
            >
                <Icon name="BellIcon" size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-surface-elevated shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-elevated rounded-xl shadow-2xl border border-border z-50 overflow-hidden flex flex-col max-h-[80vh] origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-surface/80 backdrop-blur-sm relative z-10">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                    {unreadCount} New
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs text-primary hover:text-primary/80 font-semibold uppercase tracking-wider transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-y-auto flex-1 p-2 bg-surface-elevated relative">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted flex flex-col items-center justify-center min-h-[160px]">
                                <Icon name="BellSlashIcon" size={32} className="mb-3 text-muted/30" />
                                <p className="text-sm font-medium">You're all caught up!</p>
                                <p className="text-xs mt-1 text-muted/80">No new notifications to display.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        className={`group p-4 rounded-xl flex gap-3 transition-all duration-200 cursor-pointer ${notif.is_read ? 'bg-transparent hover:bg-surface' : 'bg-primary/[0.03] hover:bg-primary/[0.06] border border-primary/10'}`}
                                        onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                                    >
                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 transition-opacity ${notif.is_read ? 'opacity-0' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm tracking-tight truncate ${notif.is_read ? 'font-medium text-foreground/80' : 'font-bold text-foreground'}`}>
                                                {notif.title}
                                            </p>
                                            <p className={`text-xs mt-1 line-clamp-2 ${notif.is_read ? 'text-muted/80' : 'text-muted'}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="text-[10px] font-medium text-muted/60 uppercase tracking-wider">{formatTime(notif.created_at)}</span>
                                                {notif.link && (
                                                    <Link 
                                                        href={notif.link} 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!notif.is_read) markAsRead(notif.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 outline-none"
                                                    >
                                                        View Details
                                                        <Icon name="ArrowRightIcon" size={10} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { supabase } from './supabase';

export interface CreateNotification {
    userId: string;
    title: string;
    message: string;
    type: 'order' | 'kyc' | 'escalation' | 'assignment' | 'commission' | 'system';
    link?: string;
}

export async function createNotification(notif: CreateNotification) {
    await supabase.from('notifications').insert([{
        user_id: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        is_read: false,
        link: notif.link || null
    }]);
}

// Batch create notifications for multiple users
export async function notifyUsers(userIds: string[], title: string, message: string, type: CreateNotification['type'], link?: string) {
    const rows = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        link: link || null
    }));
    await supabase.from('notifications').insert(rows);
}

// Subscribe to real-time notifications for a user
export function subscribeToNotifications(userId: string, onNew: (notification: any) => void) {
    const channel = supabase
        .channel(`notifications:${userId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
        }, (payload) => {
            onNew(payload.new);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

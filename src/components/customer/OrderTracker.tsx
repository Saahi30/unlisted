'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

const STAGES = [
    { key: 'requested', label: 'Order Placed', icon: 'ClipboardDocumentCheckIcon', description: 'Your order has been submitted' },
    { key: 'under_process', label: 'Processing', icon: 'ArrowPathIcon', description: 'Payment verified, transfer initiated' },
    { key: 'mail_sent', label: 'Transfer Sent', icon: 'PaperAirplaneIcon', description: 'Share transfer mail dispatched' },
    { key: 'in_holding', label: 'In Holding', icon: 'CheckBadgeIcon', description: 'Shares credited to your account' },
] as const;

interface OrderTrackerProps {
    currentStatus: string;
    statusTimestamps?: Record<string, string>;
    createdAt: string;
}

export default function OrderTracker({ currentStatus, statusTimestamps = {}, createdAt }: OrderTrackerProps) {
    const currentIndex = STAGES.findIndex(s => s.key === currentStatus);

    const getTimestamp = (key: string) => {
        if (key === 'requested' && !statusTimestamps[key]) {
            return createdAt;
        }
        return statusTimestamps[key];
    };

    const formatDate = (ts: string | undefined) => {
        if (!ts) return null;
        const d = new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="py-4">
            {/* Desktop horizontal stepper */}
            <div className="hidden md:flex items-start justify-between relative">
                {/* Connector line */}
                <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border z-0" />
                <div
                    className="absolute top-5 left-[10%] h-0.5 bg-green-500 z-0 transition-all duration-500"
                    style={{ width: `${Math.max(0, currentIndex) * (80 / (STAGES.length - 1))}%` }}
                />

                {STAGES.map((stage, index) => {
                    const isCompleted = index < currentIndex || (index === currentIndex && currentIndex === STAGES.length - 1);
                    const isCurrent = index === currentIndex && currentIndex < STAGES.length - 1;
                    const isPending = index > currentIndex;
                    const timestamp = getTimestamp(stage.key);

                    return (
                        <div key={stage.key} className="flex flex-col items-center z-10 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                isCurrent ? 'bg-primary border-primary text-white animate-pulse' :
                                'bg-background border-border text-muted'
                            }`}>
                                <Icon name={stage.icon} size={18} />
                            </div>
                            <p className={`text-xs font-semibold mt-2 text-center ${
                                isCompleted ? 'text-green-600' :
                                isCurrent ? 'text-primary' :
                                'text-muted'
                            }`}>
                                {stage.label}
                            </p>
                            <p className="text-[10px] text-muted mt-0.5 text-center max-w-[120px]">{stage.description}</p>
                            {timestamp && (
                                <p className="text-[10px] text-muted/70 mt-1 font-mono">{formatDate(timestamp)}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile vertical stepper */}
            <div className="md:hidden space-y-0">
                {STAGES.map((stage, index) => {
                    const isCompleted = index < currentIndex || (index === currentIndex && currentIndex === STAGES.length - 1);
                    const isCurrent = index === currentIndex && currentIndex < STAGES.length - 1;
                    const timestamp = getTimestamp(stage.key);
                    const isLast = index === STAGES.length - 1;

                    return (
                        <div key={stage.key} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                    isCurrent ? 'bg-primary border-primary text-white' :
                                    'bg-background border-border text-muted'
                                }`}>
                                    <Icon name={stage.icon} size={14} />
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 h-8 ${index < currentIndex ? 'bg-green-500' : 'bg-border'}`} />
                                )}
                            </div>
                            <div className="pb-6">
                                <p className={`text-sm font-semibold ${isCompleted ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-muted'}`}>
                                    {stage.label}
                                </p>
                                <p className="text-xs text-muted">{stage.description}</p>
                                {timestamp && <p className="text-[10px] text-muted/70 mt-0.5 font-mono">{formatDate(timestamp)}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

export default function AIDigest() {
    const { orders, leads, users, tickets, rmTargets, commissions, rmActivities } = useAppStore();
    const [refreshKey, setRefreshKey] = useState(0);

    const rms = users.filter(u => u.role === 'rm');
    const formatINR = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    // Generate insights from data
    const generateInsights = () => {
        const insights: { type: 'success' | 'warning' | 'info' | 'danger'; title: string; detail: string }[] = [];

        // Order velocity
        const recentOrders = orders.filter(o => Date.now() - new Date(o.createdAt).getTime() < 7 * 86400000);
        insights.push({ type: 'info', title: `${recentOrders.length} orders this week`, detail: `Total value: ${formatINR(recentOrders.reduce((s, o) => s + o.price * o.quantity, 0))}. ${recentOrders.filter(o => o.status === 'requested').length} still awaiting processing.` });

        // Stale leads
        const staleLeads = leads.filter(l => l.status === 'new' && Date.now() - new Date(l.createdAt).getTime() > 3 * 86400000);
        if (staleLeads.length > 0) {
            insights.push({ type: 'warning', title: `${staleLeads.length} leads untouched for 3+ days`, detail: `Consider reassigning: ${staleLeads.map(l => l.name).join(', ')}` });
        }

        // Escalated tickets
        const escalated = tickets.filter(t => t.status === 'escalated');
        if (escalated.length > 0) {
            insights.push({ type: 'danger', title: `${escalated.length} escalated tickets need attention`, detail: escalated.map(t => `${t.customerName}: ${t.subject}`).join('; ') });
        }

        // RM target achievement
        rms.forEach(rm => {
            const assignedCustomers = users.filter(u => u.assignedRmId === rm.id).map(u => u.id);
            const volume = orders.filter(o => assignedCustomers.includes(o.userId) && o.status === 'in_holding').reduce((s, o) => s + o.price * o.quantity, 0);
            const target = rmTargets[rm.id] || 0;
            const achievement = target > 0 ? (volume / target) * 100 : 0;
            if (achievement >= 80) {
                insights.push({ type: 'success', title: `${rm.name} at ${achievement.toFixed(0)}% of target`, detail: `On track to exceed monthly target of ${formatINR(target)}. Volume: ${formatINR(volume)}.` });
            } else if (achievement < 40 && target > 0) {
                insights.push({ type: 'warning', title: `${rm.name} only at ${achievement.toFixed(0)}% of target`, detail: `Significantly behind. May need coaching or lead redistribution.` });
            }
        });

        // Commission pending
        const pendingComm = commissions.filter(c => c.status === 'pending');
        if (pendingComm.length > 0) {
            const total = pendingComm.reduce((s, c) => s + c.commissionAmount, 0);
            insights.push({ type: 'info', title: `${formatINR(total)} in commissions pending approval`, detail: `${pendingComm.length} entries waiting. Approve to maintain RM motivation.` });
        }

        // Activity gaps
        rms.forEach(rm => {
            const lastAct = rmActivities.filter(a => a.rmId === rm.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            if (lastAct && Date.now() - new Date(lastAct.timestamp).getTime() > 24 * 3600000) {
                insights.push({ type: 'warning', title: `${rm.name} inactive for 24+ hours`, detail: `Last activity: ${lastAct.action} — ${lastAct.details}` });
            }
        });

        // Pipeline health
        const requested = orders.filter(o => o.status === 'requested').length;
        const underProcess = orders.filter(o => o.status === 'under_process').length;
        if (requested > underProcess * 2) {
            insights.push({ type: 'danger', title: 'Pipeline bottleneck detected', detail: `${requested} orders in "Requested" vs only ${underProcess} "Under Process". Orders are stacking up.` });
        }

        return insights;
    };

    const insights = generateInsights();

    const typeStyles = {
        success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'CheckCircleIcon', iconColor: 'text-green-600' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'ExclamationTriangleIcon', iconColor: 'text-amber-600' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'InformationCircleIcon', iconColor: 'text-blue-600' },
        danger: { bg: 'bg-red-50', border: 'border-red-200', icon: 'FireIcon', iconColor: 'text-red-600' },
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-display font-medium text-foreground">AI-Powered Digest</h2>
                    <p className="text-sm text-muted">Smart insights generated from your team's real-time data.</p>
                </div>
                <button onClick={() => setRefreshKey(k => k + 1)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors">
                    <Icon name="ArrowPathIcon" size={16} /> Refresh
                </button>
            </div>

            <div className="space-y-4" key={refreshKey}>
                {insights.length === 0 ? (
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-12 text-center text-muted">
                            <Icon name="SparklesIcon" size={32} className="mx-auto mb-3 opacity-40" />
                            <p>No significant insights right now. Everything looks healthy.</p>
                        </CardContent>
                    </Card>
                ) : insights.map((insight, i) => {
                    const style = typeStyles[insight.type];
                    return (
                        <Card key={i} className={`border shadow-sm ${style.bg} ${style.border}`}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/80 border ${style.border}`}>
                                        <Icon name={style.icon} size={18} className={style.iconColor} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{insight.title}</p>
                                        <p className="text-xs text-muted mt-1">{insight.detail}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </>
    );
}

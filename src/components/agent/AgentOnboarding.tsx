'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';

interface AgentOnboardingProps {
    onComplete: () => void;
    userName: string;
}

const STEPS = [
    {
        title: 'Welcome to ShareSaathi Partner Program!',
        subtitle: 'You are about to become a certified partner agent. Let us walk you through how it works.',
        icon: 'SparklesIcon',
        content: [
            { icon: 'CurrencyRupeeIcon', label: 'Earn Margins', desc: 'Set your own selling price above cost and keep the margin on every sale.' },
            { icon: 'LinkIcon', label: 'Custom Links', desc: 'Generate unique payment links for each client with your custom pricing.' },
            { icon: 'ShieldCheckIcon', label: 'Secure & Verified', desc: 'All transactions are tracked, verified, and compliant with regulations.' },
        ],
    },
    {
        title: 'How It Works',
        subtitle: 'Three simple steps to start earning.',
        icon: 'RocketLaunchIcon',
        content: [
            { icon: 'IdentificationIcon', label: 'Step 1: Complete KYC', desc: 'Submit your PAN, Aadhar, and bank details for verification.' },
            { icon: 'BuildingOfficeIcon', label: 'Step 2: Browse Marketplace', desc: 'View active companies, see your cost price, and pick opportunities.' },
            { icon: 'BanknotesIcon', label: 'Step 3: Generate & Earn', desc: 'Create client payment links, share via WhatsApp, and earn on every sale.' },
        ],
    },
    {
        title: 'Your Partner Dashboard',
        subtitle: 'Everything you need in one place.',
        icon: 'ComputerDesktopIcon',
        content: [
            { icon: 'ChartBarIcon', label: 'Analytics', desc: 'Track conversions, earnings, and performance metrics in real-time.' },
            { icon: 'UsersIcon', label: 'Client CRM', desc: 'Manage your clients, log follow-ups, and track relationships.' },
            { icon: 'TrophyIcon', label: 'Tier System', desc: 'Climb from Bronze to Platinum and unlock bonus commissions & perks.' },
            { icon: 'AcademicCapIcon', label: 'Training', desc: 'Complete modules to improve your skills and earn certificates.' },
        ],
    },
    {
        title: 'Tips for Success',
        subtitle: 'Top agents follow these practices.',
        icon: 'LightBulbIcon',
        content: [
            { icon: 'ChatBubbleLeftRightIcon', label: 'Stay in Touch', desc: 'Regular follow-ups convert 3x more prospects than one-time pitches.' },
            { icon: 'ClockIcon', label: 'Act Fast', desc: 'Share new opportunities within 24 hours of listing for best conversion.' },
            { icon: 'DocumentTextIcon', label: 'Know Your Product', desc: 'Complete all training modules. Knowledgeable agents earn 40% more.' },
            { icon: 'StarIcon', label: 'Build Trust', desc: 'Always be honest about risks. Client trust leads to repeat business.' },
        ],
    },
];

export default function AgentOnboarding({ onComplete, userName }: AgentOnboardingProps) {
    const [step, setStep] = useState(0);
    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-white to-blue-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border">
                {/* Progress */}
                <div className="flex gap-1 p-4 bg-surface/30">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-border'}`} />
                    ))}
                </div>

                <div className="p-8 md:p-10 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                        <Icon name={current.icon} size={32} />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold font-display text-foreground mb-2">
                        {step === 0 ? current.title.replace('!', `, ${userName.split(' ')[0]}!`) : current.title}
                    </h2>
                    <p className="text-muted text-sm mb-8">{current.subtitle}</p>

                    {/* Content Cards */}
                    <div className={`grid gap-4 ${current.content.length > 3 ? 'grid-cols-2' : 'grid-cols-1'} text-left max-w-lg mx-auto`}>
                        {current.content.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-surface/50 border border-border/50 hover:border-primary/20 transition-colors">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Icon name={item.icon} size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-6 border-t border-border bg-surface/20 flex items-center justify-between">
                    <button
                        onClick={() => step > 0 && setStep(step - 1)}
                        className={`text-sm font-medium text-muted hover:text-foreground transition-colors ${step === 0 ? 'invisible' : ''}`}
                    >
                        <Icon name="ArrowLeftIcon" size={14} className="inline mr-1" /> Previous
                    </button>

                    <div className="flex items-center gap-3">
                        <button onClick={onComplete} className="text-xs text-muted hover:text-foreground transition-colors">
                            Skip Tour
                        </button>
                        <Button
                            onClick={() => isLast ? onComplete() : setStep(step + 1)}
                            className="bg-primary text-white font-bold px-8"
                        >
                            {isLast ? 'Get Started' : 'Next'}
                            {!isLast && <Icon name="ArrowRightIcon" size={14} className="ml-1" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

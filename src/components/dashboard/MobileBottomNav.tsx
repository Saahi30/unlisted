'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface MobileBottomNavProps {
    onOpenSidebar: () => void;
}

const navItems = [
    { label: 'Portfolio', href: '/dashboard/customer', icon: 'BriefcaseIcon' },
    { label: 'Orders', href: '/dashboard/customer/orders', icon: 'ClipboardDocumentListIcon' },
    { label: 'Explore', href: '/shares', icon: 'MagnifyingGlassIcon' },
    { label: 'Watchlist', href: '/dashboard/customer/watchlist', icon: 'StarIcon' },
];

export default function MobileBottomNav({ onOpenSidebar }: MobileBottomNavProps) {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pb-safe">
            <div className="flex items-stretch">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-0.5 text-[10px] font-medium transition-colors ${
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted hover:text-foreground'
                            }`}
                        >
                            <Icon name={item.icon} size={20} className={isActive ? 'text-primary' : ''} />
                            {item.label}
                        </Link>
                    );
                })}
                <button
                    onClick={onOpenSidebar}
                    className="flex-1 flex flex-col items-center justify-center min-h-[56px] gap-0.5 text-[10px] font-medium text-muted hover:text-foreground transition-colors"
                >
                    <Icon name="Bars3Icon" size={20} />
                    More
                </button>
            </div>
        </nav>
    );
}

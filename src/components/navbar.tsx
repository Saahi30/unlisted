'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LineChart, Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-700">
                    <LineChart className="h-6 w-6" />
                    <span>EquiTrade</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                    <Link href="/shares" className="hover:text-blue-600 transition-colors">Digital Shares</Link>
                    <Link href="/dashboard/customer/dematerialize" className="hover:text-blue-600 transition-colors font-semibold text-primary">Demat Conversion</Link>
                    <Link href="/about" className="hover:text-blue-600 transition-colors">How it works</Link>
                    <Link href="/dashboard/customer" className="hover:text-blue-600 transition-colors">Customer Portal</Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <Link href="/dashboard/admin" className="text-slate-400 hover:text-slate-900 transition-colors">Admin</Link>
                    <Link href="/dashboard/sales" className="text-slate-400 hover:text-slate-900 transition-colors">Sales/RM</Link>
                    <Link href="/dashboard/transfer" className="text-slate-400 hover:text-slate-900 transition-colors">Operations</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2 items-center">
                        {user ? (
                            <>
                                <span className="text-sm text-slate-600 flex items-center gap-1.5">
                                    <User className="h-4 w-4" />
                                    {user.name}
                                </span>
                                <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
                                    <LogOut className="h-4 w-4" />
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost">Log in</Button>
                                </Link>
                                <Link href="/login">
                                    <Button>Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}

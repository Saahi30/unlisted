'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, UserRole, User } from '@/lib/auth-context';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
export default function LoginPage() {
    const { login, isLoading: contextLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [authLoading, setAuthLoading] = useState(false);
    const [otpStep, setOtpStep] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [otpError, setOtpError] = useState('');

    if (contextLoading) return null;

    // Hardcoded credentials for each role (real auth will be added later)
    const credentials: Record<string, { password: string; role: UserRole }> = {
        'customer@sharesaathi.com': { password: 'customer123', role: 'customer' },
        'sales@sharesaathi.com': { password: 'sales123', role: 'rm' },
        'agent@sharesaathi.com': { password: 'agent123', role: 'agent' },
        'manager@sharesaathi.com': { password: 'manager123', role: 'staffmanager' },
        'admin@sharesaathi.com': { password: 'admin123', role: 'admin' },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setOtpError('');

        if (isLogin) {
            const cred = credentials[form.email.toLowerCase()];
            if (cred && form.password === cred.password) {
                login(cred.role);
            } else {
                setOtpError('Invalid email or password.');
            }
            setAuthLoading(false);
        } else {
            if (!otpStep) {
                setTimeout(() => {
                    setOtpStep(true);
                    setAuthLoading(false);
                }, 800);
                return;
            }

            if (emailOtp !== '111111' || phoneOtp !== '222222') {
                setOtpError("Invalid verification codes. (Use 111111 for Email and 222222 for Phone)");
                setAuthLoading(false);
                return;
            }

            // Sign up just logs in as customer for now
            login('customer');
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <header className="absolute top-0 left-0 right-0 p-6 flex justify-center md:justify-start z-10">
                <Link href="/">
                    <AppLogo size={32} text="ShareSaathi" />
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-md mx-auto">
                <div className="bg-white border border-border rounded-2xl p-8 w-full shadow-xl">
                    {otpError && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg text-center animate-shake">
                            {otpError}
                        </div>
                    )}

                    {!otpStep && (
                        <div className="flex gap-4 mb-8">
                            <button
                                className={`flex-1 pb-3 text-center border-b-2 font-semibold transition-colors ${isLogin ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                                onClick={() => { setIsLogin(true); setOtpError(''); }}
                            >
                                Sign In
                            </button>
                            <button
                                className={`flex-1 pb-3 text-center border-b-2 font-semibold transition-colors ${!isLogin ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                                onClick={() => { setIsLogin(false); setOtpStep(false); setOtpError(''); }}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {otpStep ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon name="ShieldCheckIcon" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-foreground tracking-tight">Two-Factor Verification</h2>
                                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                                    Codes sent to <span className="text-foreground font-semibold">{form.email}</span> & <br />
                                    your phone <span className="text-foreground font-semibold">{form.phone}</span>
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">Email OTP (Mock: 111111)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={emailOtp}
                                        onChange={e => setEmailOtp(e.target.value)}
                                        className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted/20"
                                        placeholder="······"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">Phone OTP (Mock: 222222)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={phoneOtp}
                                        onChange={e => setPhoneOtp(e.target.value)}
                                        className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted/20"
                                        placeholder="······"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={authLoading || emailOtp.length < 6 || phoneOtp.length < 6}
                                    className="w-full bg-primary text-white py-4 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 flex justify-center items-center gap-2 mt-2"
                                >
                                    {authLoading ? 'Confirming...' : 'Verify Codes & Register'}
                                    {!authLoading && <Icon name="CheckCircleIcon" size={18} />}
                                </button>

                                <button
                                    onClick={() => setOtpStep(false)}
                                    className="w-full py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                                >
                                    Change email or phone number
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <>
                                    <div>
                                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1 block">Full Name</label>
                                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-surface/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder="Rahul Sharma" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1 block">Phone Number</label>
                                        <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-surface/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder="+91 9876543210" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1 block">Email Address</label>
                                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-surface/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder="name@company.com" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1 block">Password</label>
                                <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-surface/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder="••••••••" />
                            </div>

                            <button disabled={authLoading} type="submit" className="w-full bg-primary text-white py-3.5 mt-4 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all flex justify-center items-center gap-2">
                                {authLoading ? 'Loading...' : isLogin ? 'Sign In Securely' : 'Send Verification OTP'}
                                {!authLoading && <Icon name="ArrowRightIcon" size={16} />}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-border">
                        <p className="text-xs text-center text-muted font-medium mb-3">TEST CREDENTIALS</p>
                        <div className="space-y-1.5 text-[11px] text-muted">
                            {Object.entries(credentials).map(([email, { role }]) => (
                                <button
                                    key={email}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const cred = credentials[email];
                                        setForm({ ...form, email, password: cred.password });
                                    }}
                                    className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-surface/80 transition-colors text-left"
                                >
                                    <span className="font-medium text-foreground">{role === 'rm' ? 'Sales RM' : role === 'staffmanager' ? 'Manager' : role.charAt(0).toUpperCase() + role.slice(1)}</span>
                                    <span className="font-mono text-muted">{email}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted/60 text-center mt-3">Click a role to auto-fill credentials, then sign in</p>
                    </div>
                </div>
            </main>

            <footer className="p-6 md:p-8 z-10 w-full max-w-screen-xl mx-auto flex flex-col items-center">
                <div className="pt-8 border-t border-border/40 w-full text-[10px] md:text-xs text-muted/50 leading-relaxed text-center">
                    <p>
                        <strong>Disclaimer:</strong> Unlisted shares are not traded on any stock exchange and carry higher risk. 
                        Prices are indicative and may vary. Please conduct your own research or consult a financial advisor before investing.
                    </p>
                </div>
            </footer>
        </div>
    );
}

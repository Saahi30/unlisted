'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

interface CartItem {
    companyId: string;
    companyName: string;
    sector: string;
    price: number;
    quantity: number;
}

export default function CartPage() {
    const { user } = useAuth();
    const { companies } = useAppStore();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showBrowser, setShowBrowser] = useState(true);
    const [checkoutDone, setCheckoutDone] = useState(false);

    const addToCart = (companyId: string) => {
        if (cart.find(c => c.companyId === companyId)) return;
        const company = companies.find(c => c.id === companyId);
        if (!company) return;
        setCart(prev => [...prev, {
            companyId: company.id,
            companyName: company.name,
            sector: company.sector,
            price: company.currentAskPrice,
            quantity: 1,
        }]);
    };

    const removeFromCart = (companyId: string) => {
        setCart(prev => prev.filter(c => c.companyId !== companyId));
    };

    const updateQuantity = (companyId: string, qty: number) => {
        if (qty < 1) return;
        setCart(prev => prev.map(c => c.companyId === companyId ? { ...c, quantity: qty } : c));
    };

    const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    const cartInIds = new Set(cart.map(c => c.companyId));

    const handleCheckout = () => {
        setCheckoutDone(true);
        // In production: create orders for each cart item
    };

    if (checkoutDone) {
        return (
            <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
                <div className="py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <Icon name="CheckCircleIcon" size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-display font-light text-foreground mb-2">Orders Placed!</h2>
                    <p className="text-muted mb-1">{cart.length} companies · ₹{cartTotal.toLocaleString()} total</p>
                    <p className="text-xs text-muted mb-6">Your RM will process these orders and update you on each.</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => { setCart([]); setCheckoutDone(false); }}>New Cart</Button>
                        <Button className="bg-primary text-white hover:bg-primary/90" asChild>
                            <Link href="/dashboard/customer">Back to Portfolio</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Bulk Buy Cart</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Add multiple companies to cart and checkout together.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Browse / Add */}
                <div className="lg:col-span-2">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-white pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-display font-medium text-lg">
                                    {showBrowser ? 'Add Companies' : `Cart (${cart.length})`}
                                </CardTitle>
                                <Button size="sm" variant="outline" onClick={() => setShowBrowser(!showBrowser)} className="text-xs">
                                    {showBrowser ? `View Cart (${cart.length})` : 'Add More'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            {showBrowser ? (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {companies.map(company => {
                                        const inCart = cartInIds.has(company.id);
                                        const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');
                                        return (
                                            <div key={company.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${inCart ? 'border-primary/30 bg-primary/5' : 'border-border bg-white hover:border-border'}`}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-foreground truncate">{company.name}</p>
                                                        <span className="text-[10px] text-muted font-bold uppercase">{company.sector}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted">
                                                        <span>₹{company.currentAskPrice.toLocaleString()}</span>
                                                        <span className={`font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{company.change}</span>
                                                    </div>
                                                </div>
                                                {inCart ? (
                                                    <Button size="sm" variant="outline" onClick={() => removeFromCart(company.id)} className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                                                        <Icon name="XMarkIcon" size={14} className="mr-1" /> Remove
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" onClick={() => addToCart(company.id)} className="bg-primary text-white hover:bg-primary/90 text-xs">
                                                        <Icon name="PlusIcon" size={14} className="mr-1" /> Add
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Cart Items */
                                cart.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Icon name="ShoppingCartIcon" size={32} className="mx-auto text-muted mb-3" />
                                        <p className="text-muted font-medium mb-2">Your cart is empty.</p>
                                        <Button size="sm" variant="outline" onClick={() => setShowBrowser(true)}>Browse Companies</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item.companyId} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-white">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground">{item.companyName}</p>
                                                    <p className="text-xs text-muted">{item.sector} · ₹{item.price.toLocaleString()}/share</p>
                                                </div>

                                                {/* Quantity Control */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => updateQuantity(item.companyId, item.quantity - 1)}
                                                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
                                                    >
                                                        <Icon name="MinusIcon" size={12} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateQuantity(item.companyId, parseInt(e.target.value) || 1)}
                                                        className="w-14 h-7 text-center text-sm font-bold border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-primary/20"
                                                        min={1}
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.companyId, item.quantity + 1)}
                                                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
                                                    >
                                                        <Icon name="PlusIcon" size={12} />
                                                    </button>
                                                </div>

                                                {/* Subtotal */}
                                                <p className="text-sm font-bold text-foreground w-24 text-right shrink-0">
                                                    ₹{(item.price * item.quantity).toLocaleString()}
                                                </p>

                                                <button onClick={() => removeFromCart(item.companyId)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                                                    <Icon name="TrashIcon" size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Order Summary */}
                <div>
                    <Card className="border-border shadow-sm sticky top-8">
                        <CardHeader className="border-b border-border/50 bg-white pb-3">
                            <CardTitle className="font-display font-medium text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {cart.length === 0 ? (
                                <p className="text-sm text-muted text-center py-4">No items in cart.</p>
                            ) : (
                                <>
                                    <div className="space-y-2 mb-4">
                                        {cart.map(item => (
                                            <div key={item.companyId} className="flex items-center justify-between text-sm">
                                                <span className="text-muted truncate mr-2">{item.companyName} × {item.quantity}</span>
                                                <span className="font-medium text-foreground shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-border pt-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">Total</span>
                                            <span className="text-lg font-bold text-primary">₹{cartTotal.toLocaleString()}</span>
                                        </div>
                                        <p className="text-[10px] text-muted mt-1">{cart.length} {cart.length === 1 ? 'company' : 'companies'} · {cart.reduce((s, c) => s + c.quantity, 0)} total shares</p>
                                    </div>
                                    <Button onClick={handleCheckout} className="w-full bg-primary text-white hover:bg-primary/90">
                                        <Icon name="ShoppingCartIcon" size={16} className="mr-2" /> Place All Orders
                                    </Button>
                                    <p className="text-[10px] text-muted text-center mt-2">Payment details will be shared by your RM.</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

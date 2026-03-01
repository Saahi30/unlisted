'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, AlertTriangle, ShieldCheck, Upload, PhoneForwarded, CheckCircle2 } from 'lucide-react';

export default function BuyOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { addOrder, addLead, leads, companies } = useAppStore();
    const company = companies.find(c => c.id === id);

    const [quantity, setQuantity] = useState(100);
    const [paymentOption, setPaymentOption] = useState<'rtgs' | 'rm_connect' | null>('rtgs');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    if (!company) {
        return <div className="p-8">Company not found.</div>;
    }

    const totalValue = quantity * company.currentAskPrice;
    const isAboveThreshold = totalValue > 2500000;

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 0;
        setQuantity(val);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            setTimeout(() => {
                setIsUploading(false);
                setUploadComplete(true);
            }, 1000);
        }
    };

    const handleSubmit = () => {
        const orderId = 'ord_' + Math.random().toString(36).substring(7);
        const orderBase = {
            id: orderId,
            companyId: company.id,
            companyName: company.name,
            isin: 'INE123456789', // Mock ISIN
            userId: 'cust_1',
            quantity: quantity,
            price: company.currentAskPrice,
            totalAmount: totalValue,
            createdAt: new Date().toISOString(),
            type: 'buy' as const
        };

        if (!isAboveThreshold) {
            // Below 25L - Razorpay Integration
            setIsUploading(true); // Reuse uploading state for payment processing
            setTimeout(() => {
                addOrder({
                    ...orderBase,
                    status: 'requested',
                    paymentMethod: 'razorpay',
                    notes: []
                });
                setIsUploading(false);
                finish('Payment via Razorpay successful! Order requested.');
            }, 2000);
        } else {
            // Above 25L handling
            if (paymentOption === 'rtgs') {
                if (!uploadComplete) {
                    alert('Please upload payment proof.');
                    return;
                }
                addOrder({
                    ...orderBase,
                    status: 'under_process',
                    paymentMethod: 'rtgs',
                    txProofUrl: 'mock_uploaded_file.pdf',
                    notes: []
                });

                // Generate Lead for RM and Sales
                addLead({
                    id: 'lead_' + Math.random().toString(36).substring(7),
                    name: "Customer User", // mock
                    email: "customer@preipo.com",
                    phone: "+91 9999999999",
                    assignedRmId: "sls_1",
                    notes: [`Uploaded RTGS proof for ${quantity} shares of ${company.name}`],
                    status: 'new',
                    kycStatus: 'verified',
                    createdAt: new Date().toISOString()
                });
                finish('Payment proof submitted. Your transaction is under process.');

            } else {
                // RM Connect
                addOrder({
                    ...orderBase,
                    status: 'requested',
                    paymentMethod: 'rm_connect',
                    notes: []
                });

                addLead({
                    id: 'lead_' + Math.random().toString(36).substring(7),
                    name: "Customer User", // mock
                    email: "customer@preipo.com",
                    phone: "+91 9999999999",
                    assignedRmId: "sls_1",
                    notes: [`Requested RM connect for buying ${quantity} shares of ${company.name}`],
                    status: 'new',
                    kycStatus: 'verified',
                    createdAt: new Date().toISOString()
                });

                finish('Request sent! A Relationship Manager will contact you shortly.');
            }
        }
    };

    const finish = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => {
            router.push('/dashboard/customer');
        }, 2000);
    };

    if (successMsg) {
        return (
            <div className="container mx-auto px-4 py-24 max-w-xl text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Request Successful</h2>
                <p className="text-slate-600 mb-8">{successMsg}</p>
                <div className="text-sm text-slate-400">Redirecting to your portfolio...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Link href={`/shares/${company.id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Company Details
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Purchase Shares</h1>
                <p className="text-slate-500">Fast, secure, and compliant off-market T+1 settlement.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle>Order Details</CardTitle>
                            <CardDescription>Enter quantity and payment details.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-medium text-slate-900">{company.name}</div>
                                    <div className="text-xs text-slate-500">{company.sector}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">₹{company.currentAskPrice.toLocaleString()} / share</div>
                                    <div className="text-xs text-slate-500">Fixed Offer Price</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-900">Number of Shares (Qty)</label>
                                <Input type="number" min="25" value={quantity} onChange={handleQuantityChange} className="h-12 text-lg" />
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-500">Minimum lot size: 25 shares.</p>
                                    <div className="text-lg font-bold text-blue-700">Total: ₹{totalValue.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                {isAboveThreshold ? (
                                    <div className="space-y-4">
                                        <div className="bg-amber-50 p-4 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-sm">
                                            <AlertTriangle className="h-5 w-5 shrink-0" />
                                            <div>Transactions above ₹25,00,000 require direct bank transfer (RTGS/NEFT) or assistance from a Relationship Manager.</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div
                                                className={`p-4 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors ${paymentOption === 'rtgs' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200'}`}
                                                onClick={() => setPaymentOption('rtgs')}
                                            >
                                                <div className="font-semibold text-slate-900 mb-1">Pay via NEFT/RTGS</div>
                                                <p className="text-xs text-slate-500">Transfer directly to our secure escrow account.</p>
                                            </div>
                                            <div
                                                className={`p-4 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors ${paymentOption === 'rm_connect' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200'}`}
                                                onClick={() => setPaymentOption('rm_connect')}
                                            >
                                                <div className="flex gap-2 items-center font-semibold text-slate-900 mb-1">
                                                    <PhoneForwarded className="h-4 w-4" /> RM Connect
                                                </div>
                                                <p className="text-xs text-slate-500">Our advisor will assist with the high-value transaction.</p>
                                            </div>
                                        </div>

                                        {paymentOption === 'rtgs' && (
                                            <div className="mt-6 space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <h4 className="font-semibold text-sm">Bank Details for Escrow Account</h4>
                                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                                    <span className="text-slate-500">Bank Name</span><span className="font-medium">HDFC Bank Ltd.</span>
                                                    <span className="text-slate-500">Account Name</span><span className="font-medium">Unlisted Shares Escrow</span>
                                                    <span className="text-slate-500">Account No.</span><span className="font-medium font-mono text-blue-700">008272917711</span>
                                                    <span className="text-slate-500">IFSC Code</span><span className="font-medium font-mono">HDFC0000001</span>
                                                </div>

                                                <div className="pt-4 border-t border-slate-200">
                                                    <label className="text-sm font-medium mb-2 block">Upload Transaction Proof (Screenshot / PDF)</label>
                                                    <div className="flex items-center gap-4">
                                                        <Input type="file" onChange={handleFileUpload} className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                                        {isUploading && <span className="text-sm text-slate-500 animate-pulse">Uploading...</span>}
                                                        {uploadComplete && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">Razorpay Payment Gateway</span>
                                                <span className="text-xs text-slate-500">Netbanking, UPI, Cards supported</span>
                                            </div>
                                            <div className="h-8 w-24 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-400 font-bold tracking-widest">[RAZORPAY]</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t border-slate-100 pt-6">
                            <Button
                                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                                onClick={handleSubmit}
                                disabled={isUploading || (isAboveThreshold && paymentOption === 'rtgs' && !uploadComplete)}
                            >
                                {isUploading
                                    ? 'Processing Payment...'
                                    : !isAboveThreshold
                                        ? `Pay ₹${totalValue.toLocaleString()} via Razorpay`
                                        : paymentOption === 'rtgs'
                                            ? `Submit Transfer Proof`
                                            : `Request RM Calling in 5 mins`}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div>
                    <Card className="bg-blue-50 border-blue-100">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base text-blue-900 flex items-center">
                                <ShieldCheck className="mr-2 h-5 w-5" /> Safety & Legal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-800 space-y-4">
                            <p>Unlisted shares are illiquid. There is no official secondary market.</p>
                            <div className="flex gap-2">
                                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                                <span>Platform acts purely as a facilitator and execution broker.</span>
                            </div>
                            <div className="flex gap-2">
                                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                                <span>Funds remain in Escrow till shares are transferred to your Demat.</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, MoreVertical, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DematerializeFormPage() {
    const router = useRouter();
    const { addDematRequest, dematRequests } = useAppStore();
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        folioNumber: '',
        certificateNumbers: '',
        distinctiveFrom: '',
        distinctiveTo: '',
        quantity: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            setFileName(file.name);
            // Simulate upload
            setTimeout(() => {
                setIsUploading(false);
            }, 1000);
        }
    };

    const handleSubmit = () => {
        const requestId = 'dmr_' + Math.random().toString(36).substring(7);
        addDematRequest({
            id: requestId,
            userId: 'cust_1',
            companyName: formData.companyName,
            folioNumber: formData.folioNumber,
            certificateNumbers: formData.certificateNumbers,
            distinctiveFrom: formData.distinctiveFrom,
            distinctiveTo: formData.distinctiveTo,
            quantity: Number(formData.quantity),
            fileName: fileName || 'file_uploaded',
            status: 'initiated',
            createdAt: new Date().toISOString(),
            notes: []
        });

        setSuccessMsg('Your dematerialization request has been successfully submitted. Our team will verify the details and contact you shortly.');

        setTimeout(() => {
            router.push('/dashboard/customer');
        }, 3000);
    };

    if (successMsg) {
        return (
            <div className="container mx-auto px-4 py-24 max-w-xl text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Request Submitted</h2>
                <p className="text-slate-600 mb-8">{successMsg}</p>
                <div className="text-sm text-slate-400">Redirecting to your dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <Link href="/dashboard/customer" className="inline-flex items-center text-sm font-medium text-muted hover:text-primary mb-6 transition-colors">
                <Icon name="ArrowLeftIcon" size={16} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="mb-10">
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Dematerialize Shares</h1>
                <p className="text-muted mt-1">Convert your physical share certificates into electronic format in your Demat account.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="md:col-span-3">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-white">
                            <CardTitle className="font-display font-medium text-lg">Certificate Details</CardTitle>
                            <CardDescription className="text-muted">Please provide the details of the physical shares you hold.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5 bg-white">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-foreground">Company Name</label>
                                <div className="relative">
                                    <Icon name="BuildingOfficeIcon" size={16} className="absolute left-3 top-2.5 text-muted" />
                                    <Input
                                        placeholder="e.g. Tata Technologies Limited"
                                        className="pl-9 border-border placeholder:text-muted/70 bg-surface/30 focus-visible:ring-primary"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-foreground">Folio Number</label>
                                    <Input
                                        placeholder="Enter Folio No."
                                        className="border-border placeholder:text-muted/70 bg-surface/30 focus-visible:ring-primary"
                                        value={formData.folioNumber}
                                        onChange={(e) => setFormData({ ...formData, folioNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-foreground">Certificate Number(s)</label>
                                    <Input
                                        placeholder="e.g. 10245 - 10250"
                                        className="border-border placeholder:text-muted/70 bg-surface/30 focus-visible:ring-primary"
                                        value={formData.certificateNumbers}
                                        onChange={(e) => setFormData({ ...formData, certificateNumbers: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-foreground">Distinctive Numbers (From)</label>
                                    <Input
                                        placeholder="e.g. 5000001"
                                        className="border-border placeholder:text-muted/70 bg-surface/30 focus-visible:ring-primary"
                                        value={formData.distinctiveFrom}
                                        onChange={(e) => setFormData({ ...formData, distinctiveFrom: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-foreground">Distinctive Numbers (To)</label>
                                    <Input
                                        placeholder="e.g. 5001000"
                                        className="border-border placeholder:text-muted/70 bg-surface/30 focus-visible:ring-primary"
                                        value={formData.distinctiveTo}
                                        onChange={(e) => setFormData({ ...formData, distinctiveTo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-foreground">Total Quantity</label>
                                <Input
                                    type="number"
                                    placeholder="Total number of shares"
                                    className="border-border placeholder:text-muted/70 bg-surface/30 focus-visible:ring-primary"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>

                            <div className="pt-6 border-t border-border/50 space-y-4">
                                <h4 className="text-sm font-medium text-foreground">Upload Scanned Copies</h4>
                                <input
                                    type="file"
                                    id="certificates-upload"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.jpg,.png"
                                />
                                <label
                                    htmlFor="certificates-upload"
                                    className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface/30 hover:bg-surface/60 transition-colors cursor-pointer group"
                                >
                                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {isUploading ? (
                                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : fileName ? (
                                            <Icon name="CheckCircleIcon" size={24} className="text-green-500" />
                                        ) : (
                                            <Icon name="DocumentArrowUpIcon" size={24} />
                                        )}
                                    </div>
                                    <h4 className="text-sm font-semibold text-foreground mb-1">
                                        {isUploading ? 'Uploading...' : fileName ? fileName : 'Click to upload certificates'}
                                    </h4>
                                    <p className="text-xs text-muted">
                                        {fileName ? 'Click to change file' : 'Supported formats: PDF, JPG, PNG (Max 5MB)'}
                                    </p>
                                </label>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-surface/30 border-t border-border/50 pt-6 pb-6">
                            <Button
                                disabled={isUploading || !fileName || !formData.companyName}
                                onClick={handleSubmit}
                                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                            >
                                Submit Demat Request
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl p-6 border border-border shadow-sm sticky top-24">
                        <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2 font-display">
                            <Icon name="InformationCircleIcon" size={20} className="text-primary" /> Process Overview
                        </h3>
                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-primary/20 before:via-border before:to-transparent">

                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow font-display shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-sm ring-4 ring-primary/10">
                                    1
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
                                    <h4 className="font-semibold text-foreground text-sm mb-1">Submit Details</h4>
                                    <p className="text-xs text-muted">Fill this online form for verification.</p>
                                </div>
                            </div>

                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-surface border-border text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold font-display text-sm">
                                    2
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-white shadow-sm opacity-60">
                                    <h4 className="font-semibold text-foreground text-sm mb-1">Send DRF</h4>
                                    <p className="text-xs text-muted">Courier Demat Request Form to our office.</p>
                                </div>
                            </div>

                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-surface border-border text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold font-display text-sm">
                                    3
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-white shadow-sm opacity-60">
                                    <h4 className="font-semibold text-foreground text-sm mb-1">Processing</h4>
                                    <p className="text-xs text-muted">Takes 15-30 days with Company RTA.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                            <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                Requires an active NSDL or CDSL Demat account in the exact same name as the physical certificates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Demat Requests Tracking Section */}
            <div className="mt-16 space-y-10">
                <div className="border-t border-border/50 pt-10">
                    <h2 className="text-2xl font-display font-light text-foreground mb-4">Track Your Requests</h2>
                    <p className="text-muted text-sm max-w-2xl mb-8">View the progress of your physical share conversions. Once completed, shares will be visible in your portfolio holdings.</p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Active Requests */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-surface/30 border-b border-border/50">
                            <CardTitle className="text-base font-medium">Active Requests</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {dematRequests.filter(r => r.userId === 'cust_1' && r.status !== 'completed').length === 0 ? (
                                <div className="p-12 text-center text-muted text-sm">No active demat requests.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-surface/50 hover:bg-surface/50">
                                            <TableHead className="pl-6">Company</TableHead>
                                            <TableHead>Folio No.</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="pr-6 text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dematRequests.filter(r => r.userId === 'cust_1' && r.status !== 'completed').map(request => (
                                            <React.Fragment key={request.id}>
                                                <TableRow className="hover:bg-surface/20 cursor-pointer" onClick={() => setSelectedRequestId(selectedRequestId === request.id ? null : request.id)}>
                                                    <TableCell className="pl-6 font-medium text-foreground">{request.companyName}</TableCell>
                                                    <TableCell className="text-muted font-mono text-xs">{request.folioNumber}</TableCell>
                                                    <TableCell>{request.quantity}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${request.status === 'initiated' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                            }`}>
                                                            {request.status.replace('_', ' ')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {selectedRequestId === request.id && (
                                                    <TableRow className="bg-surface/10">
                                                        <TableCell colSpan={5} className="p-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                                <div>
                                                                    <div className="text-xs text-muted font-semibold uppercase mb-1">Certificates</div>
                                                                    <div className="text-foreground">{request.certificateNumbers}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-muted font-semibold uppercase mb-1">Distinctive Range</div>
                                                                    <div className="text-foreground">{request.distinctiveFrom} - {request.distinctiveTo}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-muted font-semibold uppercase mb-1">Supporting Document</div>
                                                                    <div className="flex items-center text-primary group cursor-pointer">
                                                                        <Icon name="DocumentIcon" size={14} className="mr-1" />
                                                                        <span className="underline truncate">{request.fileName}</span>
                                                                        <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resolved Requests */}
                    {dematRequests.filter(r => r.userId === 'cust_1' && r.status === 'completed').length > 0 && (
                        <Card className="border-border shadow-sm overflow-hidden">
                            <CardHeader className="bg-surface/30 border-b border-border/50">
                                <CardTitle className="text-base font-medium">Recently Resolved</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-surface/50 hover:bg-surface/50">
                                            <TableHead className="pl-6">Company</TableHead>
                                            <TableHead>Completion Date</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead className="pr-6 text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dematRequests.filter(r => r.userId === 'cust_1' && r.status === 'completed').map(request => (
                                            <TableRow key={request.id} className="hover:bg-surface/20">
                                                <TableCell className="pl-6 font-medium text-foreground">{request.companyName}</TableCell>
                                                <TableCell className="text-muted">{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>{request.quantity}</TableCell>
                                                <TableCell className="pr-6 text-right text-green-600 font-bold text-[10px] uppercase tracking-widest">
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 border border-green-100">
                                                        <Icon name="CheckCircleIcon" size={12} className="mr-1" />
                                                        Completed
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

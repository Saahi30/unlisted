'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';

interface Document {
    id: string;
    type: string;
    file_name: string;
    file_url: string;
    file_size: number;
    created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
    share_certificate: 'Share Certificate',
    transaction_receipt: 'Transaction Receipt',
    cmr: 'CMR Document',
    pan_card: 'PAN Card',
    other: 'Other',
};

export default function DocumentsSection() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('other');

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (data) setDocuments(data);
            setLoading(false);
        };
        load();
    }, [user]);

    const handleUpload = async (file: File) => {
        if (!user) return;
        setUploading(true);
        const supabase = createClient();

        const filePath = `${user.id}/${uploadType}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);

        if (!uploadError) {
            const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
            const { data: doc } = await supabase.from('documents').insert({
                user_id: user.id,
                type: uploadType,
                file_name: file.name,
                file_url: urlData.publicUrl,
                file_size: file.size,
                uploaded_by: user.id,
            }).select().single();

            if (doc) setDocuments(prev => [doc, ...prev]);
        }
        setUploading(false);
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    if (loading) {
        return <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-display text-lg font-medium">My Documents</CardTitle>
                        <CardDescription className="text-muted">Share certificates, receipts, and verification documents.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <select className="h-9 px-3 border border-border rounded-md text-xs bg-background" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <label className="cursor-pointer">
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white pointer-events-none" disabled={uploading}>
                                <Icon name="ArrowUpTrayIcon" size={14} className="mr-1" />
                                {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </label>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-surface/50 hover:bg-surface/50">
                            <TableHead className="text-muted font-semibold pl-6">File</TableHead>
                            <TableHead className="text-muted font-semibold">Type</TableHead>
                            <TableHead className="text-muted font-semibold">Size</TableHead>
                            <TableHead className="text-muted font-semibold">Date</TableHead>
                            <TableHead className="text-right text-muted font-semibold pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center p-8 text-muted italic">No documents uploaded yet.</TableCell>
                            </TableRow>
                        ) : documents.map(doc => (
                            <TableRow key={doc.id} className="border-border hover:bg-surface/30">
                                <TableCell className="pl-6 font-medium text-foreground">{doc.file_name}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface text-muted border border-border">
                                        {TYPE_LABELS[doc.type] || doc.type}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted text-xs">{formatSize(doc.file_size)}</TableCell>
                                <TableCell className="text-muted text-xs">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button variant="ghost" size="sm" className="text-primary text-[10px] font-bold uppercase tracking-widest" onClick={() => window.open(doc.file_url, '_blank')}>
                                        <Icon name="ArrowDownTrayIcon" size={14} className="mr-1" /> Download
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

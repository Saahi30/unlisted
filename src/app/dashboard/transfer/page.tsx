'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileCheck2, Send, CheckSquare, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function TransferDashboardPage() {
    const { companies, orders } = useAppStore();
    const getCompany = (id: string) => companies.find(c => c.id === id);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 mb-2">
                        Operations & Transfer Dept View
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settlements & DIS Tracking</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-slate-50 border-slate-100">
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-slate-500 mb-1">Pending Off-Market Annexures</div>
                        <div className="text-3xl font-bold text-amber-600 flex items-center"><FileCheck2 className="mr-2 h-6 w-6" /> 8</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-100">
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-slate-500 mb-1">Pending DIS Verification</div>
                        <div className="text-3xl font-bold text-blue-600 flex items-center"><Send className="mr-2 h-6 w-6" /> 3</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-100">
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-slate-500 mb-1">Pending DP Execution</div>
                        <div className="text-3xl font-bold text-slate-600 flex items-center"><Clock className="mr-2 h-6 w-6" /> 5</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-100">
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-slate-500 mb-1">Settled T-1</div>
                        <div className="text-3xl font-bold text-green-600 flex items-center"><CheckSquare className="mr-2 h-6 w-6" /> 14</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transfer Queue</CardTitle>
                    <CardDescription>Deals waiting for document verification or DP execution proof.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Deal ID</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Buyer DP ID / Client ID</TableHead>
                                <TableHead>Documents</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.filter(o => o.status === 'under_process' || o.status === 'requested').map(order => {
                                const comp = getCompany(order.companyId);
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium text-slate-900 text-xs">{order.id.toUpperCase()}</TableCell>
                                        <TableCell>{comp?.name}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">IN301549</div>
                                            <div className="text-xs text-slate-500">12345678</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="text-amber-600 flex items-center gap-1"><FileCheck2 className="w-3 h-3" /> Annexure Pending</span>
                                                <span className="text-amber-600 flex items-center gap-1"><Send className="w-3 h-3" /> DIS Pending</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                                                Verification
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <Button variant="outline" size="sm" className="h-7 text-xs">Verify Docs</Button>
                                                <Button variant="default" size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">Mark Settled</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

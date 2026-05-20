'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, RefreshCw, Save, Info, Globe } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const PRINTER_TYPES = [
    { key: 'Receipt', label: 'Main Receipt Printer' },
    { key: 'KOT', label: 'Kitchen (KOT) Printer' },
    { key: 'Bar', label: 'Bar Printer' },
    { key: 'Label', label: 'Label Printer' }
];

export default function PrinterSettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
    const [bridgeStatus, setBridgeStatus] = useState<'online' | 'offline' | 'loading'>('loading');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost/rapair-management/server/public/api/printer/get_settings');
            const data = await res.json();
            if (data.success) {
                setSettings(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch printer settings:', error);
        }
    };

    const fetchAvailablePrinters = async () => {
        setBridgeStatus('loading');
        // Use 127.0.0.1 first as it is usually faster than 'localhost'
        const endpoints = ['http://127.0.0.1:5001/printers', 'http://localhost:5001/printers'];
        
        for (const url of endpoints) {
            try {
                console.log(`Attempting to connect to printer bridge at ${url}...`);
                const res = await fetch(url, { signal: AbortSignal.timeout(10000) }); // 10s timeout
                const data = await res.json();
                if (data.success) {
                    setAvailablePrinters(data.data.map((p: any) => p.name));
                    setBridgeStatus('online');
                    return;
                }
            } catch (error: any) {
                console.warn(`Printer Bridge Warning at ${url}:`, error.message);
            }
        }
        setBridgeStatus('offline');
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchSettings(), fetchAvailablePrinters()]);
            setLoading(false);
        };
        init();
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch('http://localhost/rapair-management/server/public/api/printer/save_settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_id: 1, // Default for now
                    settings: settings
                })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: "Printer configurations saved successfully." });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        }
    };

    const updateSetting = (type: string, name: string) => {
        setSettings(prev => {
            const existing = prev.find(s => s.printer_type === type);
            if (existing) {
                return prev.map(s => s.printer_type === type ? { ...s, printer_name: name } : s);
            }
            return [...prev, { printer_type: type, printer_name: name, paper_width: '80mm' }];
        });
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Printer className="w-6 h-6" /> Printer Management
                </h1>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-sm ${bridgeStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${bridgeStatus === 'online' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                        Local Bridge: {bridgeStatus.toUpperCase()}
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchAvailablePrinters}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh Printers
                    </Button>
                </div>
            </div>

            {bridgeStatus === 'offline' && (
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        The Local Print Service is not running on this computer. Please start <strong>bizzflow-printer.exe</strong> to scan for printers.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Hardware Mapping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Global Print Method Setting */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b pb-6 mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-600" /> Default Printing Method
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">Choose how receipts are processed by default.</p>
                        </div>
                        <div className="flex gap-2">
                            <Select 
                                value={settings.find(s => s.printer_type === 'PrintingMode')?.printer_name || "Silent"} 
                                onValueChange={(val) => updateSetting('PrintingMode', val)}
                            >
                                <SelectTrigger className="w-full border-2 border-blue-100 bg-blue-50/30">
                                    <SelectValue placeholder="Choose Mode..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Silent">Silent (Instant High-Speed)</SelectItem>
                                    <SelectItem value="Browser">Browser Default (Show Dialog)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {PRINTER_TYPES.map((type) => {
                        const current = settings.find(s => s.printer_type === type.key);
                        return (
                            <div key={type.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b pb-4 last:border-0">
                                <div>
                                    <h3 className="font-medium text-gray-900">{type.label}</h3>
                                    <p className="text-sm text-gray-500">Configure which hardware device handles {type.key} prints.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Select 
                                        value={current?.printer_name || ""} 
                                        onValueChange={(val) => updateSetting(type.key, val)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a printer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePrinters.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 font-bold px-8">
                            <Save className="w-4 h-4 mr-2" /> Save All Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gray-50 border-dashed">
                <CardContent className="p-4 text-sm text-gray-600 flex gap-2">
                    <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                    <p>
                        These settings are stored in the cloud. Any computer using the same Location ID will try to find a local printer with the same name. 
                        Make sure your thermal printers have the same names (e.g. "Receipt-Printer") across all your POS counters.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { Utensils, ShoppingBag, Store, ArrowRight, ChevronLeft, User, LayoutGrid, Clock, FilePlus, History, FileText, Undo2, Banknote, MoreHorizontal, LayoutDashboard, Home, Printer } from "lucide-react";
import { usePOS } from "../context/POSContext";
import { fetchPosDayLedger } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const OrderTypeSelector: React.FC = () => {
    const { 
        orderType,
        setOrderType, 
        orderTypeDialogOpen, 
        setOrderTypeDialogOpen,
        selectedLocation,
        locations,
        tables,
        stewards,
        heldOrders,
        refreshHeldOrders,
        loadPOSBill,
        setSelectedTable,
        setSelectedSteward,
        setLedgerDialogOpen,
        setReturnDialogOpen,
        setRefundDialogOpen,
        setPendingInvoicesDialogOpen,
        setReservationDialogOpen,
        setGuestPrintSelectionOpen,
        setGuestPrintOrderId,
        setDayLedger,
        setLoadingLedger
    } = usePOS();

    const [step, setStep] = useState<'choice' | 'mode' | 'table' | 'steward' | 'held'>('choice');
    const [localTable, setLocalTable] = useState<any>(null);
    const [localSteward, setLocalSteward] = useState<any>("none");
    
    useEffect(() => {
        if (orderTypeDialogOpen) {
            setStep('choice');
        }
    }, [orderTypeDialogOpen]);

    const currentLocation = locations.find(l => String(l.id) === String(selectedLocation));

    const types = [
        {
            id: 'dine_in',
            label: 'Dine In',
            icon: <Utensils className="w-6 h-6" />,
            description: 'Table service',
            color: 'indigo',
            visible: !currentLocation || Boolean(currentLocation.allow_dine_in)
        },
        {
            id: 'take_away',
            label: 'Take Away',
            icon: <ShoppingBag className="w-6 h-6" />,
            description: 'Collection',
            color: 'emerald',
            visible: !currentLocation || Boolean(currentLocation.allow_take_away)
        },
        {
            id: 'retail',
            label: 'Retail',
            icon: <Store className="w-6 h-6" />,
            description: 'Standard sale',
            color: 'amber',
            visible: !currentLocation || Boolean(currentLocation.allow_retail)
        }
    ].filter(t => t.visible);

    const handleSelectMode = (id: any) => {
        if (id === 'dine_in') {
            setStep('table');
        } else {
            setOrderType(id);
            setOrderTypeDialogOpen(false);
            setStep('choice');
        }
    };

    const handleSelectTable = (table: any) => {
        setLocalTable(table);
        setStep('steward');
    };

    const handleFinalizeDineIn = (stewardId: any) => {
        setOrderType('dine_in');
        setSelectedTable(localTable ? String(localTable.id) : null);
        setSelectedSteward(stewardId === 'none' ? null : stewardId);
        setOrderTypeDialogOpen(false);
        setStep('choice'); 
        setLocalTable(null);
        setLocalSteward("none");
    };

    return (
        <Dialog 
            open={orderTypeDialogOpen} 
            onOpenChange={(val) => {
                if (!val && !orderType) return;
                setOrderTypeDialogOpen(val);
                if (!val) setStep('choice');
            }}
        >
            <DialogContent 
                onInteractOutside={(e) => { if (!orderType) e.preventDefault(); }}
                onEscapeKeyDown={(e) => { if (!orderType) e.preventDefault(); }}
                className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col overflow-hidden border-none shadow-2xl rounded-none sm:rounded-[2rem] bg-white dark:bg-slate-950"
            >
                <div className="p-8 pb-4 border-b border-slate-50 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {step !== 'choice' && (
                                    <button 
                                        onClick={() => setStep(step === 'table' ? 'mode' : (step === 'held' || step === 'mode' ? 'choice' : 'table'))}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </button>
                                )}
                                <div>
                                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {step === 'choice' ? "Get Started" : 
                                         step === 'held' ? "Recent Bills" :
                                         step === 'mode' ? "New Order" : 
                                         step === 'table' ? "Select Table" : "Assign Steward"}
                                    </DialogTitle>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                                        {step === 'choice' ? "Choose your transaction type" :
                                         step === 'held' ? "Select a bill to resume" :
                                         step === 'mode' ? "Select service mode" : 
                                         step === 'table' ? "Choose available table" : `Steward for ${localTable?.name}`}
                                    </p>
                                </div>
                            </div>
                            
                            {step === 'choice' && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider">SYSTEM ACTIVE</span>
                                </div>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    {step === 'choice' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setStep('mode')}
                                    className="group relative flex flex-col p-6 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-3xl border-2 border-transparent hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-900 transition-all text-left shadow-sm hover:shadow-xl hover:shadow-indigo-500/10"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-600 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-200 dark:shadow-none">
                                        <FilePlus className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">New Transaction</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Start a fresh bill</p>
                                    </div>
                                    <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                </button>

                                <button
                                    onClick={() => {
                                        setStep('held');
                                        refreshHeldOrders();
                                    }}
                                    className="group relative flex flex-col p-6 bg-orange-50/30 dark:bg-orange-500/5 rounded-3xl border-2 border-transparent hover:border-orange-500 hover:bg-white dark:hover:bg-slate-900 transition-all text-left shadow-sm hover:shadow-xl hover:shadow-orange-500/10"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-500 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-200 dark:shadow-none">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Resume Bill</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Continue held order</p>
                                    </div>
                                    <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                    {heldOrders.length > 0 && (
                                        <span className="absolute top-6 right-6 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                                            {heldOrders.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Management Hub</span>
                                    <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {[
                                        { label: 'ERP Hub', icon: <LayoutDashboard className="w-5 h-5" />, color: 'indigo', action: () => { window.location.href = '../../dashboard'; } },
                                        { label: 'Summary', icon: <FileText className="w-5 h-5" />, color: 'blue', action: async () => { 
                                            setOrderTypeDialogOpen(false); 
                                            setLedgerDialogOpen(true); 
                                            setLoadingLedger(true);
                                            try {
                                                const data = await fetchPosDayLedger(selectedLocation);
                                                setDayLedger(data);
                                            } finally {
                                                setLoadingLedger(false);
                                            }
                                        } },
                                        { label: 'Pending', icon: <FileText className="w-5 h-5" />, color: 'amber', action: () => { setOrderTypeDialogOpen(false); setPendingInvoicesDialogOpen(true); } },
                                        { label: 'Return', icon: <Undo2 className="w-5 h-5" />, color: 'purple', action: () => { setOrderTypeDialogOpen(false); setReturnDialogOpen(true); } },
                                        { label: 'Refund', icon: <Banknote className="w-5 h-5" />, color: 'rose', action: () => { setOrderTypeDialogOpen(false); setRefundDialogOpen(true); } },
                                        { label: 'Reservation', icon: <Home className="w-5 h-5" />, color: 'sky', action: () => { setOrderTypeDialogOpen(false); setReservationDialogOpen(true); } }
                                    ].map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={item.action}
                                            className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                                        >
                                            <div className={`p-3 bg-${item.color}-50 dark:bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400 rounded-xl mb-2 group-hover:scale-110 transition-transform`}>
                                                {item.icon}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'held' && (
                        <div className="grid grid-cols-1 gap-3">
                            {heldOrders.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="relative inline-block mb-4">
                                        <Clock className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-slate-500 dark:text-slate-400">No held bills found</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Bills you put on hold will appear here.</p>
                                    <div className="flex flex-col gap-2 max-w-[200px] mx-auto">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-200 transition-all"
                                            onClick={() => refreshHeldOrders()}
                                        >
                                            Retry Sync
                                        </Button>
                                        <Button variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={() => setStep('choice')}>
                                            Go Back
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                heldOrders.map((order) => (
                                    <button 
                                      key={order.id}
                                      onClick={() => {
                                          loadPOSBill(order.id);
                                          setOrderTypeDialogOpen(false);
                                          setStep('choice');
                                      }}
                                      className="group p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-500 hover:shadow-lg transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                                #{order.id}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{order.customer_name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                                    {order.order_type?.replace('_', ' ')} {order.table_name && `• ${order.table_name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">LKR {Number(order.grand_total).toLocaleString()}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setGuestPrintOrderId(order.id);
                                                            setGuestPrintSelectionOpen(true);
                                                        }}
                                                        className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                                        title="Print Guest Bill"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {step === 'mode' && (
                        <div className="grid grid-cols-1 gap-3">
                            {types.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => handleSelectMode(type.id)}
                                    className="group flex items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all text-left"
                                >
                                    <div className={`p-3 rounded-xl bg-${type.color}-100/50 dark:bg-${type.color}-500/10 text-${type.color}-600 dark:text-${type.color}-400 group-hover:scale-110 transition-transform mr-4`}>
                                        {type.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{type.label}</h3>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{type.description}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'table' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => handleSelectTable({ id: 'none', name: 'No Table' })}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-white transition-all text-left flex items-center gap-3 group"
                            >
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg">
                                    <LayoutGrid className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-500">None / Skip Table</span>
                            </button>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {tables
                                    .filter(t => !selectedLocation || !t.location_id || String(t.location_id) === String(selectedLocation))
                                    .map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleSelectTable(t)}
                                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all group"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                            <LayoutGrid className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full text-center">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'steward' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => handleFinalizeDineIn('none')}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-white transition-all text-left flex items-center gap-3 group"
                            >
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-500">Skip Steward</span>
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {stewards.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleFinalizeDineIn(String(s.id))}
                                        className="flex items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all group"
                                    >
                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold text-xs mr-3">
                                            {s.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.name}</span>
                                        <ArrowRight className="w-4 h-4 ml-auto text-slate-200 group-hover:text-indigo-500" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-900 flex justify-center">
                    <div className="flex gap-1.5">
                        {['choice', 'mode', 'held', 'table', 'steward'].map((s) => (
                            <div 
                                key={s}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    step === s ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                                }`} 
                            />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

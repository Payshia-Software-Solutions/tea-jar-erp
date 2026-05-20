"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquare, 
    X, 
    Send, 
    Bot, 
    Sparkles, 
    TrendingUp, 
    AlertCircle, 
    BarChart3,
    ChevronDown,
    RefreshCw,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    fetchBusinessSnapshot, 
    fetchRevenueForecast,
    fetchInventoryIntelligence,
    fetchSalesAnalysis,
    fetchCustomerInsights,
    fetchFinancialHealth,
    BusinessSnapshot,
    ForecastData 
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

import { getBizFlowAiInsight } from "@/app/actions/ai-actions";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    type?: "data" | "text" | "forecast" | "list";
    data?: any;
}

const QUICK_ACTIONS = [
    { label: "Top Sellers", query: "What are our top selling items?" },
    { label: "VIP Clients", query: "Who are our top customers?" },
    { label: "Finance", query: "How is our financial health?" },
    { label: "Predict Revenue", query: "Revenue forecast for next month" },
    { label: "Fast Stock", query: "Show me fast moving inventory" }
];

export function BizFlowAiAssistant() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [snapshot, setSnapshot] = useState<BusinessSnapshot | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: "1",
                    role: "assistant",
                    content: "Hello! I'm your BizFlow AI Assistant. I can help you with financial reports, revenue forecasting, and inventory insights. How can I assist you today?",
                    timestamp: new Date()
                }
            ]);
            loadInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Completely remove assistant from POS, Print, Receipt, and Invoice pages
    const isPrintPage = pathname?.includes('/cms/pos') || 
                        pathname?.includes('/print') || 
                        pathname?.includes('/receipt') || 
                        pathname?.includes('/invoices');

    if (isPrintPage) {
        return null;
    }

    const loadInitialData = async () => {
        try {
            const data = await fetchBusinessSnapshot();
            setSnapshot(data);
        } catch (e) {
            console.error("AI Assistant data load error", e);
        }
    };

    const handleSend = async (customQuery?: string) => {
        const queryText = customQuery || input;
        if (!queryText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: queryText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customQuery) setInput("");
        setIsLoading(true);

        try {
            const res = await getBizFlowAiInsight(queryText);
            
            const response: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: res.success ? res.answer : (res.error || "I'm sorry, I couldn't process that query."),
                timestamp: new Date()
            };

            setMessages(prev => [...prev, response]);
        } catch (err) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I encountered a connection error. Please make sure the AI service is active.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="z-50 print:hidden">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full h-full sm:w-[400px] sm:h-[650px] z-[60] shadow-2xl sm:rounded-3xl overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-none sm:border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 p-6 sm:p-5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base sm:text-sm">BizFlow Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Online Intelligence</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-10 w-10 sm:h-8 sm:w-8" onClick={() => setIsOpen(false)}>
                                <X className="w-6 h-6 sm:w-5 sm:h-5" />
                            </Button>
                        </div>

                        {/* Quick Stats (Optional) */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
                            <Badge variant="outline" className="bg-white dark:bg-slate-900 text-[9px] font-bold py-1 px-2 gap-1 whitespace-nowrap">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                Revenue: {snapshot?.currency} {snapshot?.month_revenue.toLocaleString()}
                            </Badge>
                            <Badge variant="outline" className="bg-white dark:bg-slate-900 text-[9px] font-bold py-1 px-2 gap-1 whitespace-nowrap">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                Low Stock: {snapshot?.low_stock_alerts}
                            </Badge>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full p-4">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-2.5 sm:p-3 text-[10px] font-medium leading-tight overflow-hidden break-words ${
                                                msg.role === "user" 
                                                ? "bg-[#FFF9E5] text-slate-900 rounded-tr-none shadow-md border border-amber-100 ml-auto" 
                                                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm mr-auto"
                                            }`}>
                                                <div className="prose dark:prose-invert prose-slate max-w-full prose-[8px] 
                                                    prose-p:mb-1.5 prose-p:last:mb-0 prose-p:leading-tight prose-p:break-words
                                                    prose-table:my-2 prose-table:border-collapse prose-table:w-full overflow-x-auto block
                                                    prose-th:bg-slate-50 dark:prose-th:bg-slate-900/50 prose-th:px-1.5 prose-th:py-1 prose-th:text-left prose-th:font-black prose-th:text-[7px] prose-th:uppercase prose-th:tracking-tighter prose-th:text-slate-500
                                                    prose-td:px-1.5 prose-td:py-1 prose-td:border-t prose-td:border-slate-100 dark:prose-td:border-slate-800
                                                    prose-strong:text-black dark:prose-strong:text-white prose-strong:font-black">
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            code({node, className, children, ...props}: any) {
                                                                const isChart = className === 'language-chart';
                                                                if (isChart) {
                                                                    try {
                                                                        // Strip newlines, leading spaces, then parse JSON
                                                                        const rawStr = String(children)
                                                                            .replace(/\n/g, ' ')
                                                                            .replace(/\s+/g, ' ')
                                                                            .trim();
                                                                        const chartData = JSON.parse(rawStr);
                                                                        return <AiChartRenderer config={chartData} />;
                                                                    } catch (e) {
                                                                        return <pre className="text-[7px] opacity-50 overflow-x-auto whitespace-pre-wrap" {...props}>{children}</pre>;
                                                                    }
                                                                }
                                                                return <code className="text-[7px] bg-slate-200 dark:bg-slate-700 px-1 rounded" {...props}>{children}</code>;
                                                            }
                                                        }}
                                                    >
                                                        {msg.content.replace(/\|\|/g, '|')} 
                                                    </ReactMarkdown>
                                                </div>

                                                {msg.type === "list" && msg.data && (
                                                    <div className="mt-2 space-y-1 bg-white/50 dark:bg-slate-900/50 rounded-xl p-1.5 border border-slate-200/50 dark:border-slate-700/50">
                                                        {msg.data.map((item: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-2 text-[8px] py-0.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
                                                                <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                                                                <span className="truncate">{item}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {msg.type === "forecast" && msg.data && (
                                                    <div className="mt-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] text-slate-500 font-bold uppercase">Trend Prediction</span>
                                                            <Badge className={msg.data.trend === 'Upward' ? 'bg-emerald-500/10 text-emerald-600 px-1 py-0 text-[7px]' : 'bg-rose-500/10 text-rose-600 px-1 py-0 text-[7px]'}>
                                                                {msg.data.trend}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-white">
                                                            {snapshot?.currency} {msg.data.predicted_next_month.toLocaleString()}
                                                        </div>
                                                        <div className="text-[8px] text-slate-400">
                                                            Forecasted growth rate: <span className="text-emerald-500">+{msg.data.growth_rate}%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 rounded-tl-none">
                                                <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 sm:p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 pb-8 sm:pb-3">
                            {/* Quick Actions */}
                            <div className="flex gap-1 overflow-x-auto no-scrollbar mb-2 pb-1">
                                {QUICK_ACTIONS.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(action.query)}
                                        className="whitespace-nowrap px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[8px] font-black text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm uppercase tracking-tighter"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <Input
                                    placeholder="Ask anything..."
                                    className="border-none focus-visible:ring-0 text-[10px] font-bold h-8 px-2"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                />
                                <Button size="icon" className="h-8 w-8 rounded-xl shadow-lg shadow-primary/20" onClick={handleSend} disabled={isLoading}>
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <p className="mt-1.5 text-center text-[7px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                Powered by BizFlow Intelligence
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Toggle */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-50 shadow-2xl flex items-center justify-center transition-all ${
                    isOpen 
                    ? "bg-slate-900 text-white rotate-90 hidden sm:flex bottom-6 right-6 w-14 h-14 rounded-2xl" 
                    : "bg-primary text-white shadow-primary/30 right-0 top-1/2 -translate-y-1/2 w-10 h-24 rounded-l-2xl sm:bottom-6 sm:right-6 sm:top-auto sm:translate-y-0 sm:w-14 sm:h-14 sm:rounded-2xl"
                }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];

function AiChartRenderer({ config }: { config: any }) {
    const { type, title, data } = config;

    return (
        <div className="mt-3 mb-2 p-1.5 sm:p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden w-full max-w-full">
            {title && <h3 className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter text-slate-500 mb-2 sm:mb-3">{title}</h3>}
            <div className="h-32 sm:h-40 w-full overflow-hidden relative">
                <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        {type === 'bar' ? (
                            <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" fontSize={7} fontWeight="bold" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <YAxis fontSize={7} fontWeight="bold" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '8px', fontWeight: 'bold', padding: '4px 8px' }}
                                    cursor={{fill: '#f8fafc'}}
                                />
                                <Bar dataKey="value" fill="#4f46e5" radius={[2, 2, 0, 0]} barSize={12}>
                                    {data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : type === 'pie' ? (
                            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <Pie
                                    data={data}
                                    innerRadius={25}
                                    outerRadius={40}
                                    paddingAngle={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '8px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        ) : (
                            <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" fontSize={7} fontWeight="bold" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <YAxis fontSize={7} fontWeight="bold" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '8px', fontWeight: 'bold' }}
                                />
                                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2, fill: '#4f46e5', strokeWidth: 1.5, stroke: '#fff' }} activeDot={{ r: 4, strokeWidth: 0 }} />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

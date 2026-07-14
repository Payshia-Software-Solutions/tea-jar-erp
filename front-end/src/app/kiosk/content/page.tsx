"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api/client";

export default function KioskContentListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api(`/api/part/list?q=${search}`);
      const body = await res.json();
      // Filter parts that have kiosk_module enabled
      const parts = (body.data || []).filter((p: any) => p.kiosk_module !== 'None' && p.kiosk_module);
      setItems(parts);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full max-w-full pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kiosk Content Management</h1>
            <p className="text-muted-foreground text-sm">Manage rich content and videos for items currently enabled on the kiosk.</p>
          </div>
        </div>

        <Card className="rounded-xl shadow-sm border-border overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search kiosk items..." 
                  className="pl-9 bg-white" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No kiosk items found. Enable items in the inventory first.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="py-3 px-4 text-left font-medium">Item Name</th>
                    <th className="py-3 px-4 text-left font-medium">Kiosk Module</th>
                    <th className="py-3 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/10">
                      <td className="py-3 px-4 font-medium">{item.part_name}</td>
                      <td className="py-3 px-4">{item.kiosk_module}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/kiosk/content/${item.id}`)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Manage Content
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

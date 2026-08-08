"use client"

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Search, Loader2, Factory, Edit2, ChevronRight, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { ProductionBOMDialog } from '@/components/production/bom-dialog'

export default function BOMPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [boms, setBoms] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBOM, setSelectedBOM] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api('/api/productionbom/list')
      const data = await res.json()
      if (data.status === 'success') {
        setBoms(data.data || [])
      }
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load BOMs", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = boms.filter(b => 
    (b.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (b.output_part_name || '').toLowerCase().includes(query.toLowerCase())
  )

  const handleEdit = (bom: any) => {
    setSelectedBOM(bom)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedBOM(null)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this BOM?")) return;
    try {
      const res = await api(`/api/productionbom/delete/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        toast({ title: "Success", description: "BOM deleted successfully" });
        void load();
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete BOM", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete BOM", variant: "destructive" });
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bill of Materials</h1>
            <p className="text-muted-foreground mt-1">Manage product recipes and material components.</p>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="w-4 h-4" /> Create BOM
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search BOMs or products..." 
              className="pl-10"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Loading your recipes...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Factory className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">No BOMs found</p>
                  <p className="text-sm">Start by creating your first Bill of Materials.</p>
                </div>
                <Button variant="outline" onClick={handleNew}>Create Now</Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>BOM Name</TableHead>
                    <TableHead>Finished Product</TableHead>
                    <TableHead className="text-center">Components</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((bom) => (
                    <TableRow key={bom.id} className="group hover:bg-muted/10 transition-colors">
                      <TableCell className="font-semibold">{bom.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{bom.output_part_name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            SKU: {bom.output_sku || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {bom.item_count || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={bom.is_active ? 'default' : 'outline'} className={bom.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                          {bom.is_active ? 'Active' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(bom)} className="gap-2">
                            <Edit2 className="w-4 h-4" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(bom.id)} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ProductionBOMDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={load}
        bom={selectedBOM}
      />
    </DashboardLayout>
  )
}

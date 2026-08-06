"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api, fetchParts, PartRow } from '@/lib/api'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface BOMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  bom?: any // if editing
}

export function ProductionBOMDialog({ open, onOpenChange, onSuccess, bom }: BOMDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState<PartRow[]>([])
  
  // Form State
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0')
  const [outputPartId, setOutputPartId] = useState<string>('')
  const [outputQty, setOutputQty] = useState('1')
  const [isActive, setIsActive] = useState(true)
  const [items, setItems] = useState<Array<{ part_id: number; qty: number; part_name?: string }>>([])

  useEffect(() => {
    if (open) {
      void loadParts()
      if (bom) {
        setName(bom.name || '')
        setVersion(bom.version || '1.0')
        setOutputPartId(String(bom.output_part_id || ''))
        setOutputQty(String(bom.output_qty || '1'))
        setIsActive(bom.is_active === 1)
        if (Array.isArray(bom.items)) {
          setItems(bom.items.map((i: any) => ({ 
            part_id: i.part_id, 
            qty: Number(i.qty),
            part_name: i.part_name 
          })))
        }
      } else {
        setName('')
        setVersion('1.0')
        setOutputPartId('')
        setOutputQty('1')
        setIsActive(true)
        setItems([])
      }
    }
  }, [open, bom])

  const loadParts = async () => {
    try {
      const data = await fetchParts('')
      setParts(data)
    } catch (e) {}
  }

  const addItem = () => {
    setItems([...items, { part_id: 0, qty: 1 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !outputPartId || items.length === 0) {
      toast({ title: "Validation Error", description: "Please fill in all required fields and add at least one component.", variant: "destructive" })
      return
    }

    if (items.some(i => !i.part_id || Number(i.qty) <= 0)) {
       toast({ title: "Validation Error", description: "All components must have a valid part and quantity > 0.", variant: "destructive" })
       return
    }

    setLoading(true)
    try {
      const payload = {
        name,
        version,
        output_part_id: Number(outputPartId),
        output_qty: Number(outputQty),
        is_active: isActive ? 1 : 0,
        items: items.map(i => ({ part_id: i.part_id, qty: Number(i.qty) }))
      }

      const url = bom ? `/api/productionbom/update/${bom.id}` : `/api/productionbom/create`
      
      const res = await api(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (data.status === 'success') {
        toast({ title: "Success", description: bom ? "BOM updated" : "BOM created" })
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error(data.message || 'Failed to save BOM')
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Cost Calculations
  const totalBOMCost = items.reduce((sum, item) => {
    const part = parts.find(p => p.id === item.part_id)
    const cost = part?.cost_price ? Number(part.cost_price) : 0
    return sum + (cost * Number(item.qty || 0))
  }, 0)

  const finishedUnitCost = Number(outputQty) > 0 ? totalBOMCost / Number(outputQty) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bom ? 'Edit BOM' : 'Create New BOM'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>BOM Name</Label>
              <Input placeholder="e.g. Standard Recipe" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Version</Label>
              <Input placeholder="1.0" value={version} onChange={e => setVersion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-10 border rounded px-3 bg-muted/20">
                 <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="bom_active" />
                 <Label htmlFor="bom_active" className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Finished Product (Output)</Label>
              <SearchableSelect
                placeholder="Select product..."
                options={parts.map(p => ({ value: String(p.id), label: `${p.part_name} (${p.sku || 'No SKU'})` }))}
                value={outputPartId}
                onValueChange={setOutputPartId}
                disablePortal={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Output Yield Quantity</Label>
              <Input type="number" step="0.001" value={outputQty} onChange={e => setOutputQty(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">Components (Materials)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Component Part</th>
                    <th className="px-4 py-2 text-right w-28">Unit Cost</th>
                    <th className="px-4 py-2 text-left w-24">Qty</th>
                    <th className="px-4 py-2 text-left w-20">Unit</th>
                    <th className="px-4 py-2 text-right w-28">Total Cost</th>
                    <th className="px-4 py-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => {
                    const part = parts.find(p => p.id === item.part_id)
                    const costPrice = part?.cost_price ? Number(part.cost_price) : 0
                    const lineTotal = costPrice * Number(item.qty || 0)

                    return (
                      <tr key={idx} className="hover:bg-muted/10">
                        <td className="p-2">
                          <SearchableSelect
                            placeholder="Search part..."
                            options={parts.map(p => ({ value: String(p.id), label: `${p.part_name} (${p.sku || 'No SKU'})` }))}
                            value={String(item.part_id)}
                            onValueChange={(val) => handleItemChange(idx, 'part_id', Number(val))}
                            disablePortal={true}
                          />
                        </td>
                        <td className="p-2 text-right font-medium">
                          ${costPrice.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number" 
                            step="0.001" 
                            value={item.qty} 
                            onChange={e => handleItemChange(idx, 'qty', e.target.value)} 
                          />
                        </td>
                        <td className="p-2 text-left font-medium text-muted-foreground">
                          {part?.unit || '-'}
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-900 dark:text-white">
                          ${lineTotal.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeItem(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                        No components added. Click "Add Item" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary Card */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-4 bg-muted/40 border rounded-lg gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total BOM Material Cost</span>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  ${totalBOMCost.toFixed(2)}
                </div>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-muted-foreground/20 sm:pl-6 pt-3 sm:pt-0 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output Yield Qty</span>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {Number(outputQty || 1).toFixed(3)}
                </div>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-muted-foreground/20 sm:pl-6 pt-3 sm:pt-0 space-y-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Finished Product Unit Cost</span>
                <div className="text-2xl font-black text-primary">
                  ${finishedUnitCost.toFixed(2)}
                </div>
              </div>
            </div>

          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {bom ? 'Save Changes' : 'Create BOM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


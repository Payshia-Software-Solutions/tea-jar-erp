"use client";

import React from "react";
import { 
  MapPin, 
  User, 
  Plus, 
  Loader2, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Calculator,
  Percent,
  Utensils,
  ShoppingBag,
  Store,
  ArrowRight,
  LayoutGrid,
  PauseCircle,
  Clock,
  RefreshCw,
  Gift,
  Home,
  Printer
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { usePOS } from "../context/POSContext";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { PromotionsDialog } from "@/components/promotions-dialog";

export const SidebarCart: React.FC = () => {
  const {
    cart,
    locations,
    inventory,
    selectedLocation,
    setSelectedLocation,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    addCustomerOpen,
    setAddCustomerOpen,
    addingCustomer,
    newCustomer,
    setNewCustomer,
    handleQuickAddCustomer,
    updateCartLine,
    removeCartLine,
    totals,
    openCheckoutDialog,
    billDiscountValue,
    billDiscountType,
    setBillDiscountDialogOpen,
    vKeyboardEnabled,
    setVKeyboardActiveInput,
    orderType,
    setOrderType,
    setOrderTypeDialogOpen,
    selectedTable,
    selectedSteward,
    tables,
    stewards,
    holdPOSBill,
    heldOrders,
    setHeldOrderId,
    loadPOSBill,
    refreshHeldOrders,
    appliedPromotion,
    setAppliedPromotion,
    setIsPromotionPromptOpen,
    setReservationDialogOpen,
    setGuestPrintSelectionOpen,
    setGuestPrintOrderId
  } = usePOS();

  const [heldOrdersOpen, setHeldOrdersOpen] = React.useState(false);
  const [isPromotionsOpen, setIsPromotionsOpen] = React.useState(false);

  const currentLocationName = locations.find(l => String(l.id) === String(selectedLocation))?.name || "Selected Location";

  return (
    <div className="w-full lg:w-[450px] shrink-0 flex flex-col bg-white dark:bg-card h-full lg:rounded-2xl border-t lg:border border-border lg:shadow-xl overflow-hidden relative">
      
      {/* POS Header: Customer & Location */}
      <div className="p-2 lg:p-4 bg-muted/20 border-b border-border space-y-2 lg:space-y-3 shrink-0">
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-1.5 lg:gap-2">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:block" />
            <div className="flex-1">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-8 lg:h-9 border-0 bg-white dark:bg-slate-900 shadow-sm font-semibold text-xs lg:text-sm">
                  <SelectValue placeholder="Location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Dialog open={heldOrdersOpen} onOpenChange={(open) => {
            setHeldOrdersOpen(open);
            if (open) refreshHeldOrders();
          }}>
              <DialogTrigger asChild>
                  <Button variant="outline" className="h-8 lg:h-9 gap-1 lg:gap-2 px-2 lg:px-3 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-tighter">Held ({heldOrders.length})</span>
                  </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-lg h-[100dvh] sm:h-auto rounded-none sm:rounded-3xl p-0 border-none overflow-hidden shadow-2xl bg-background">
                  <DialogHeader className="p-6 pb-2">
                      <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                          <Clock className="w-6 h-6 text-orange-500" />
                          Held Bills List
                      </DialogTitle>
                  </DialogHeader>
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                      {heldOrders.length === 0 ? (
                          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                              <Clock className="w-12 h-12 opacity-10" />
                              <p className="font-bold italic">No bills on hold for this location.</p>
                          </div>
                      ) : (
                          <div className="grid gap-2 p-2">
                              {Array.isArray(heldOrders) && heldOrders.map((order) => (
                                  <div 
                                    key={order.id} 
                                    className="p-4 rounded-2xl border border-border bg-slate-50 dark:bg-slate-900 hover:border-orange-500 transition-all cursor-pointer group flex justify-between items-center"
                                    onClick={() => {
                                        loadPOSBill(order.id);
                                        setHeldOrdersOpen(false);
                                    }}
                                  >
                                      <div>
                                          <div className="font-black text-lg">#{order.id} - {order.customer_name}</div>
                                          <div className="text-xs text-muted-foreground mt-1 font-bold">LKR {order.grand_total} • {order.items_count} Items</div>
                                          <div className="text-[10px] text-orange-500 mt-1 uppercase font-black">{order.order_type} | {new Date(order.created_at).toLocaleTimeString()}</div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <button 
                                              onClick={(e) => { 
                                                  e.stopPropagation(); 
                                                  setGuestPrintOrderId(order.id);
                                                  setGuestPrintSelectionOpen(true);
                                              }}
                                              className="p-2 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                              title="Print Guest Bill"
                                          >
                                              <Printer className="w-5 h-5" />
                                          </button>
                                          <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0" />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsPromotionsOpen(true)}
            className="h-8 w-8 lg:h-9 lg:w-9 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 shrink-0"
            title="View Active Promotions"
          >
            <Percent className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </Button>
        </div>

        <div className="flex gap-2 items-center text-sm">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:block" />
          <div className="flex-1">
            <SearchableSelect
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              placeholder="Search Customer..."
              options={customers.map(c => ({
                value: String(c.id),
                label: c.name,
                keywords: `${c.name} ${c.phone}`
              }))}
            />
          </div>
          
          <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8 lg:h-9 lg:w-9 shrink-0 shadow-sm"><Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" /></Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-md h-[100dvh] sm:h-auto rounded-none sm:rounded-3xl p-6 bg-background">
              <DialogHeader><DialogTitle>Add Walk-In</DialogTitle></DialogHeader>
              <form onSubmit={handleQuickAddCustomer} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Name</label>
                  <Input 
                    value={newCustomer.name} 
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                    autoFocus 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Phone</label>
                  <Input 
                    value={newCustomer.phone} 
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                    required
                  />
                </div>
                <Button type="submit" disabled={addingCustomer} className="w-full">
                  {addingCustomer ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save & Select"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Order Type Badge (Clickable to change) */}
      {orderType && (
        <>
            <div className="px-4 py-1.5 lg:py-2 flex items-center justify-between bg-indigo-50 dark:bg-indigo-500/5 border-b border-indigo-100 dark:border-indigo-500/10">
                <div className="flex items-center gap-2">
                    <div className={`p-1 lg:p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none`}>
                        {orderType === 'dine_in' ? <Utensils className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> : 
                         orderType === 'take_away' ? <ShoppingBag className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> : 
                         <Store className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
                    </div>
                    <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em] text-indigo-700 dark:text-indigo-400">
                        {orderType?.replace('_', ' ')}
                    </span>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setOrderTypeDialogOpen(true)}
                    className="h-6 lg:h-7 px-2 lg:px-3 rounded-full text-[8px] lg:text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 tracking-tighter"
                >
                    Change
                </Button>
            </div>
            {/* Dine-In Details Row */}
            {orderType === 'dine_in' && (selectedTable || selectedSteward) && (
                <div className="flex px-4 py-1.5 gap-4 bg-indigo-50/50 dark:bg-indigo-500/5 items-center border-b border-indigo-100 dark:border-indigo-500/20 animate-in slide-in-from-top duration-300">
                    {selectedTable && (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <LayoutGrid className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-indigo-500 shrink-0" />
                            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-indigo-800 dark:text-indigo-300 truncate">
                                {tables.find(t => String(t.id) === selectedTable)?.name || 'Table'}
                            </span>
                        </div>
                    )}
                    <div className="w-1 h-1 rounded-full bg-indigo-200 dark:bg-indigo-800 shrink-0" />
                    {selectedSteward && (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <User className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-indigo-500 shrink-0" />
                            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-indigo-800 dark:text-indigo-300 truncate">
                                {stewards.find(s => String(s.id) === selectedSteward)?.name || 'Steward'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </>
      )}

      {/* Cart List */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-2 custom-scrollbar relative">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-white dark:bg-card rounded-xl border border-dashed border-border m-2">
            <ShoppingCart className="w-12 h-12 lg:w-16 lg:h-16 mb-4 opacity-20" />
            <h3 className="font-bold text-foreground italic text-sm lg:text-base">Order Started...</h3>
            <p className="text-[10px] lg:text-sm mt-1">Mode: <span className="uppercase font-black text-indigo-600">{orderType?.replace('_', ' ') || 'None'}</span></p>
            <p className="text-[9px] lg:text-xs mt-4 opacity-70">Search for products on the Menu tab to add them to this bill.</p>
          </div>
        ) : (
          <div className="space-y-1.5 lg:space-y-2">
            {cart.map((item, index) => {
              const isReward = !!item.is_reward;
              
              if (isReward) {
                return (
                  <div key={index} className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-2 lg:p-3 rounded-xl shadow-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-1 opacity-10">
                       <Gift className="w-8 h-8 lg:w-12 lg:h-12 -rotate-12" />
                    </div>
                    <div className="flex justify-between items-start mb-1 lg:mb-2 relative z-10">
                      <div className="flex flex-col gap-0.5 lg:gap-1 pr-2">
                        <div className="font-bold text-xs lg:text-sm leading-tight text-emerald-900 dark:text-emerald-400">
                          {item.description}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 text-[6px] lg:text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                            Free Gift
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 lg:mt-3 relative z-10">
                       <div className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-emerald-700/70 dark:text-emerald-500/70">
                          <span>Qty: {item.quantity}</span>
                          <span className="opacity-50">|</span>
                          <span>{item.item_type}</span>
                       </div>
                       <div className="text-right">
                          <div className="text-[8px] lg:text-[10px] line-through text-muted-foreground opacity-50">LKR {Number(item.unit_price).toLocaleString()}</div>
                          <div className="text-xs lg:text-sm font-black text-emerald-600">LKR 0.00</div>
                       </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className="bg-white dark:bg-card border border-border p-2 lg:p-3 rounded-xl hover:border-primary/30 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-1 lg:mb-2">
                    <div className="font-bold text-xs lg:text-sm leading-tight text-foreground pr-2 line-clamp-2">{item.description}</div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCartLine(index)} 
                      className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 -mt-1 -mr-1"
                    >
                      <Trash2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2 lg:mt-3">
                    {/* Qty Controls */}
                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg border border-border p-0.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-6 h-6 lg:w-7 lg:h-7 rounded-md" 
                        onClick={() => updateCartLine(index, 'quantity', item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                      </Button>
                      <input 
                        type="number"
                        step="any"
                        className="w-10 lg:w-12 text-center text-[10px] lg:text-xs font-black tabular-nums bg-transparent border-none focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.quantity}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value) || 0;
                          const invItem = inventory.find(p => p.id === item.id);
                          if (invItem && invItem.item_type !== 'Service' && invItem.recipe_type !== 'A La Carte') {
                             if (val > invItem.stock_quantity) val = invItem.stock_quantity;
                          }
                          updateCartLine(index, 'quantity', val);
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-6 h-6 lg:w-7 lg:h-7 rounded-md text-primary" 
                        onClick={() => {
                          let val = Number(item.quantity) + 1;
                          const invItem = inventory.find(p => p.id === item.id);
                          if (invItem && invItem.item_type !== 'Service' && invItem.recipe_type !== 'A La Carte') {
                             if (val > invItem.stock_quantity) val = invItem.stock_quantity;
                          }
                          updateCartLine(index, 'quantity', val);
                        }}
                      >
                        <Plus className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      {item.discount > 0 && (
                        <div className="text-[8px] lg:text-[10px] line-through text-muted-foreground opacity-50">LKR {(item.quantity * item.unit_price).toLocaleString()}</div>
                      )}
                      <div className="text-xs lg:text-sm font-black text-foreground">LKR {((item.quantity * item.unit_price) - (item.quantity * item.discount)).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals & Actions */}
      <div className="bg-white dark:bg-card border-t border-border shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
        <div className="p-3 lg:p-4 space-y-1 lg:space-y-2 text-xs lg:text-sm border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal :</span> 
            <span className="font-bold text-foreground font-mono">LKR {totals.subtotal.toLocaleString()}</span>
          </div>

          {totals.lineDiscountTotal > 0 && (
            <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
              <span>Line Discounts :</span> 
              <span className="font-bold">-LKR {totals.lineDiscountTotal.toLocaleString()}</span>
            </div>
          )}

          <button 
             onClick={() => setBillDiscountDialogOpen(true)}
             className={`w-full flex justify-between items-center py-2 lg:py-3 px-3 lg:px-4 rounded-xl border-2 transition-all group ${billDiscountValue > 0 ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' : 'bg-slate-50 border-dashed border-slate-200 dark:bg-slate-950 dark:border-slate-800'}`}
          >
            <div className="flex items-center gap-1.5 lg:gap-2">
                <div className={`p-1 lg:p-1.5 rounded-lg transition-colors ${billDiscountValue > 0 ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:bg-primary group-hover:text-white'}`}>
                    <Percent className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                </div>
                <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${billDiscountValue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500'}`}>
                    {billDiscountValue > 0 ? `Discount (${billDiscountType === 'percentage' ? billDiscountValue + '%' : 'Fixed'})` : 'Apply Discount'}
                </span>
            </div>
            {billDiscountValue > 0 ? (
                <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    -LKR {(billDiscountType === 'percentage' ? (totals.subtotal - totals.lineDiscountTotal) * (billDiscountValue / 100) : billDiscountValue).toLocaleString()}
                </span>
            ) : (
                <Plus className="w-3 h-3 lg:w-4 lg:h-4 text-slate-400 group-hover:text-primary" />
            )}
          </button>
          
          {totals.appliedTaxes.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1">
                {totals.appliedTaxes.map((t, idx) => (
                    <div key={idx} className="flex gap-2 text-[10px] lg:text-[11px] text-blue-600 dark:text-cyan-400">
                        <span>{t.code}:</span> 
                        <span className="font-bold">LKR {t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                ))}
            </div>
          )}

          {appliedPromotion && (
            <div className="flex justify-between items-center py-2 px-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 animate-in fade-in slide-in-from-top-1 duration-300">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Promotion Applied</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{appliedPromotion.name}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="font-black text-amber-600">-LKR {Number(appliedPromotion.discount_value).toLocaleString()}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setIsPromotionPromptOpen(true)}
                      title="Switch Promotion"
                      className="p-1.5 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-md transition-colors text-amber-600"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setAppliedPromotion(null)}
                      title="Remove Promotion"
                      className="p-1.5 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-md transition-colors text-amber-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
        
        <div className="p-4 lg:p-5 flex flex-col gap-3 lg:gap-4 pb-20 lg:pb-5">
          <div className="flex justify-between items-center text-base lg:text-xl">
            <span className="font-black uppercase tracking-tight text-muted-foreground text-xs lg:text-sm">Total</span>
            <span className="font-black text-2xl lg:text-3xl tabular-nums tracking-tighter text-emerald-600 dark:text-emerald-400">
              LKR {totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
            </span>
          </div>

          
          <div className="hidden lg:grid lg:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="lg"
                disabled={cart.length === 0}
                onClick={holdPOSBill}
                className="h-14 lg:h-16 rounded-xl text-[10px] lg:text-[11px] font-black tracking-widest uppercase border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:bg-orange-950/20 dark:border-orange-500/20 dark:text-orange-400"
              >
                Hold & Print Order <PauseCircle className="w-5 h-5 ml-2 opacity-60" />
              </Button>
              <Button 
                size="lg" 
                disabled={cart.length === 0} 
                onClick={openCheckoutDialog}
                className="h-14 lg:h-16 rounded-xl text-[10px] lg:text-[11px] font-black tracking-widest uppercase bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
              >
                Checkout <ShoppingCart className="w-5 h-5 ml-2 opacity-50" />
              </Button>
          </div>
        </div>
      </div>
      <PromotionsDialog 
        open={isPromotionsOpen} 
        onOpenChange={setIsPromotionsOpen} 
        locationId={selectedLocation ? Number(selectedLocation) : null}
        locationName={currentLocationName}
      />
    </div>
  );
};

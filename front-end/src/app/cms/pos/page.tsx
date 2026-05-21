"use client";

import React from "react";
import { POSProvider, usePOS } from "./context/POSContext";
import { InventoryGrid } from "./components/InventoryGrid";
import { SidebarCart } from "./components/SidebarCart";
import { ProductSelectionDialog } from "./components/Dialogs/ProductSelectionDialog";
import { CheckoutDialog } from "./components/Dialogs/CheckoutDialog";
import { ManagementModals } from "./components/Dialogs/ManagementModals";
import { BillDiscountDialog } from "./components/Dialogs/BillDiscountDialog";
import { OrderTypeSelector } from "./components/OrderTypeSelector";
import { PromotionPromptDialog } from "./components/Dialogs/PromotionPromptDialog";
import { VirtualKeyboard } from "./components/VirtualKeyboard";
import { MobilePosNav } from "./components/MobilePosNav";
import { PrintSelectionDialog } from "./components/Dialogs/PrintSelectionDialog";
import { PrintGuestSelectionDialog } from "./components/Dialogs/PrintGuestSelectionDialog";
import { Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { LayoutGrid, ShoppingCart as CartIcon } from "lucide-react";

/**
 * Main Content Component
 * Consumes POSContext and renders the modular layout.
 */
function POSContent() {
  const { 
    loading,
    selectedLocation, 
    setSelectedLocation, 
    locations,
    vKeyboardActiveInput,
    vKeyboardEnabled,
    activeMobileTab,
    setActiveMobileTab,
    cart
  } = usePOS();

  const cartItemCount = cart.reduce((acc, it) => acc + Number(it.quantity), 0);

  // 1. Full-screen Loading State
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Initializing Terminal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden gap-0 w-full bg-slate-100 dark:bg-background transition-all duration-300 ${vKeyboardActiveInput && vKeyboardEnabled ? 'pb-[400px] sm:pb-[350px]' : ''}`}>
      
      {/* Location Enforcement Modal (If no location is set) */}
      <Dialog open={!selectedLocation} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Set Assigned Location</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">Please select your service location to synchronize inventory and sales tracking.</p>
            <Select 
              value={selectedLocation} 
              onValueChange={(val) => {
                setSelectedLocation(val);
              }}
            >
              <SelectTrigger className="h-14 text-lg font-bold rounded-xl border-2 focus:ring-primary">
                <SelectValue placeholder="Identify Terminal Location..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-none">
                {locations
                  .filter(loc => Boolean(loc.is_pos_active))
                  .map(loc => (
                  <SelectItem key={loc.id} value={String(loc.id)} className="font-bold py-3">
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Tabbed View */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
        <Tabs 
          value={activeMobileTab} 
          onValueChange={(val: any) => setActiveMobileTab(val)} 
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-950 border-b border-border p-2">
            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-slate-100 dark:bg-slate-900">
              <TabsTrigger value="shelf" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2">
                <LayoutGrid className="w-4 h-4" />
                Menu
              </TabsTrigger>
              <TabsTrigger value="bill" className="rounded-lg font-black text-[10px] uppercase tracking-widest gap-2">
                <CartIcon className="w-4 h-4" />
                Order
                {cartItemCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-[8px] rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shelf" className="flex-1 mt-0 overflow-hidden">
            <InventoryGrid />
          </TabsContent>
          <TabsContent value="bill" className="flex-1 mt-0 overflow-hidden">
            <SidebarCart />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Side-by-Side View */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="flex-1 h-full overflow-hidden">
          <InventoryGrid />
        </div>
        <div className="w-[450px] h-full overflow-hidden border-l border-border">
          <SidebarCart />
        </div>
      </div>

      <MobilePosNav />
      
      {/* Functional Dialogs & Modals */}
      <ProductSelectionDialog />
      <CheckoutDialog />
      <ManagementModals />
      <BillDiscountDialog />
      <OrderTypeSelector />
      <PromotionPromptDialog />
      <VirtualKeyboard />
      <PrintSelectionDialog />
      <PrintGuestSelectionDialog />
    </div>
  );
}

/**
 * Root POS Page
 * Wraps the application in the POSProvider to manage global POS state.
 */
export default function POSPage() {
  return (
    <POSProvider>
      <POSContent />
    </POSProvider>
  );
}

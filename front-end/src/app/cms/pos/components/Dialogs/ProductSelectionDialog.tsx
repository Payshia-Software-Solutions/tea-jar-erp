"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePOS } from "../../context/POSContext";
import { fetchPartBatches } from "@/lib/api";
import { Loader2, Calendar, Archive, Layers, ArrowRight, Check, Banknote } from "lucide-react";

export const ProductSelectionDialog: React.FC = () => {
  const {
    productModalOpen,
    setProductModalOpen,
    selectedProduct,
    setSelectedProduct,
    addToCartWithQty,
    selectedLocation
  } = usePOS();

  const [modalQty, setModalQty] = useState<string>("1");
  const [modalDiscount, setModalDiscount] = useState<string>("0");
  const [showDiscount, setShowDiscount] = useState(false);
  
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [manualSelections, setManualSelections] = useState<Record<number, number>>({});
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);

  // Reset local state when modal opens with a new product
  useEffect(() => {
    if (productModalOpen) {
      setModalQty("1");
      setModalDiscount("0");
      setShowDiscount(false);
      setBatches([]);
      setManualSelections({});
      
      if (selectedProduct && (selectedProduct.is_fifo || selectedProduct.is_expiry)) {
        setLoadingBatches(true);
        fetchPartBatches(selectedProduct.id, selectedLocation)
          .then(data => setBatches(data || []))
          .catch(() => setBatches([]))
          .finally(() => setLoadingBatches(false));
      }
    }
  }, [productModalOpen, selectedProduct, selectedLocation]);

  const handleNumpadClick = (val: string) => {
    // When using numpad, we reset manual selections to let FIFO take over again
    setManualSelections({});
    if (val === 'C') setModalQty("1");
    else if (val === 'DEL') setModalQty(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    else if (val === '.') setModalQty(prev => prev.includes('.') ? prev : prev + '.');
    else setModalQty(prev => (prev === "0" && val !== '.') ? val : prev + val);
  };

  const handleManualBatchChange = (batchId: number, newQty: number, onHand: number) => {
    const safeQty = Math.max(0, Math.min(newQty, onHand));
    const newManual = { ...manualSelections, [batchId]: safeQty };
    
    // Remove if 0 to keep logic clean
    if (safeQty === 0) delete newManual[batchId];
    
    setManualSelections(newManual);
    
    // Update the main modal quantity to reflect the sum of manual choices
    const total = Object.values(newManual).reduce((a, b) => a + b, 0);
    setModalQty(String(total));
  };

  const confirmAddToCart = useCallback(() => {
    if (!selectedProduct) return;
    const q = parseFloat(modalQty);
    const d = parseFloat(modalDiscount) || 0;
    if (isNaN(q) || q <= 0) return;
    
    // Prepare batch assignments
    let selectedBatches: any[] = [];
    if (Object.keys(manualSelections).length > 0) {
      selectedBatches = Object.entries(manualSelections).map(([id, qty]) => ({
        batch_id: parseInt(id),
        qty: qty
      }));
    } else if (batches.length > 0 && (selectedProduct.is_fifo || selectedProduct.is_expiry)) {
      // Auto-FIFO fallback
      let remaining = q;
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, Number(b.quantity_on_hand));
        if (take > 0) {
          selectedBatches.push({ batch_id: b.id > 0 ? b.id : null, qty: take });
          remaining -= take;
        }
      }
    }
    
    addToCartWithQty(selectedProduct, q, d, selectedBatches.length > 0 ? selectedBatches : undefined);
    setProductModalOpen(false);
    setSelectedProduct(null);
  }, [selectedProduct, modalQty, modalDiscount, addToCartWithQty, setProductModalOpen, setSelectedProduct, manualSelections, batches]);

  // Keyboard Numpad Integration
  useEffect(() => {
    if (!productModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack if user is typing in an input field directly (like batch inputs)
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isDiscountDialogOpen) setIsDiscountDialogOpen(false);
          else if (isAdjustmentOpen) setIsAdjustmentOpen(false);
          else confirmAddToCart();
        }
        return; 
      }

      const key = e.key;
      const isNumber = /^[0-9]$/.test(key);
      const isDelete = key === 'Backspace' || key === 'Delete';
      const isClear = key.toLowerCase() === 'c';
      const isEnter = key === 'Enter';

      if (isDiscountDialogOpen) {
        if (isNumber) { e.preventDefault(); setModalDiscount(prev => prev === "0" ? key : prev + key); }
        else if (isDelete) { e.preventDefault(); setModalDiscount(prev => prev.length > 1 ? prev.slice(0, -1) : "0"); }
        else if (isClear) { e.preventDefault(); setModalDiscount("0"); }
        else if (isEnter) { e.preventDefault(); setIsDiscountDialogOpen(false); }
      } else if (!isAdjustmentOpen) {
        // Main Quantity Logic
        if (isNumber) { e.preventDefault(); handleNumpadClick(key); }
        else if (key === '.') { e.preventDefault(); handleNumpadClick('.'); }
        else if (isDelete) { e.preventDefault(); handleNumpadClick('DEL'); }
        else if (isClear) { e.preventDefault(); handleNumpadClick('C'); }
        else if (isEnter) { e.preventDefault(); confirmAddToCart(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productModalOpen, isAdjustmentOpen, isDiscountDialogOpen, modalQty, modalDiscount, confirmAddToCart]);

  return (
    <Dialog open={productModalOpen} onOpenChange={(open) => {
      if (!open) { 
        setProductModalOpen(false); 
        setSelectedProduct(null); 
        setShowDiscount(false); 
      }
    }}>
      <DialogContent className="w-full sm:max-w-4xl h-[100dvh] sm:h-auto rounded-none sm:rounded-[2.5rem] p-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl">
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto custom-scrollbar">
          {/* Left: Product Info */}
          <div className="w-full md:w-[45%] bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 flex flex-col border-b md:border-b-0 md:border-r border-border relative">
            {selectedProduct && (
              <div className="space-y-6 md:mt-4">
                <DialogHeader className="text-left p-0">
                  <div className="flex gap-2">
                    <Badge variant={selectedProduct.item_type === 'Service' ? 'secondary' : 'outline'} className="mb-2 w-fit text-[9px] font-black tracking-widest uppercase py-0 px-2 h-5 text-foreground bg-white border-2">
                      {selectedProduct.item_type}
                    </Badge>
                    {selectedProduct.recipe_type && selectedProduct.recipe_type !== 'Standard' && (
                      <Badge variant="outline" className={`mb-2 w-fit text-[9px] font-black tracking-widest uppercase py-0 px-2 h-5 border-none shadow-sm ${selectedProduct.recipe_type === 'A La Carte' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
                        {selectedProduct.recipe_type}
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-xl font-black leading-tight text-foreground">{selectedProduct.part_name}</DialogTitle>
                  <p className="text-[11px] text-muted-foreground mt-1 font-bold uppercase tracking-tight">{selectedProduct.sku}</p>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Item Details */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex flex-col p-3 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm">
                       <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Price</span>
                       <span className="text-sm font-black text-foreground">LKR {Number(selectedProduct.price || selectedProduct.cost_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                     </div>
                     {(selectedProduct.brand_name || selectedProduct.brand) && (
                     <div className="flex flex-col p-3 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm">
                       <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Brand</span>
                       <span className="text-sm font-bold text-foreground">{selectedProduct.brand_name || selectedProduct.brand}</span>
                     </div>
                     )}
                     {(selectedProduct.category_name || selectedProduct.category) && (
                     <div className="flex flex-col p-3 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm">
                       <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Category</span>
                       <span className="text-sm font-bold text-foreground">{selectedProduct.category_name || selectedProduct.category}</span>
                     </div>
                     )}
                  </div>

                  {selectedProduct.item_type !== 'Service' && selectedProduct.recipe_type !== 'A La Carte' && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-3">Inventory Status</p>
                      {(() => {
                        // Safety: If we've loaded batches and they show a different total than the product card,
                        // the product card is likely stale. Use the batch sum as the source of truth.
                        const batchTotal = batches.reduce((acc, b) => acc + Number(b.quantity_on_hand), 0);
                        const displayQty = (selectedProduct.is_fifo || selectedProduct.is_expiry)
                          ? ((batches.length > 0 || !loadingBatches) ? batchTotal : (selectedProduct.stock_quantity || 0))
                          : (selectedProduct.stock_quantity || 0);
                        const isOutOfStock = displayQty <= 0;

                        return (
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-border shadow-sm">
                            <div className={`w-2.5 h-2.5 rounded-full ${!isOutOfStock ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                            <div className="flex flex-col">
                              <span className={`text-base font-black tracking-tight leading-none ${!isOutOfStock ? 'text-foreground' : 'text-rose-600'}`}>
                                {Number(displayQty).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {selectedProduct.unit}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Available at this location</span>
                            </div>
                          </div>
                        );
                      })()}

                      {(() => {
                        const batchTotal = batches.reduce((acc, b) => acc + Number(b.quantity_on_hand), 0);
                        const displayQty = (selectedProduct.is_fifo || selectedProduct.is_expiry)
                          ? ((batches.length > 0 || !loadingBatches) ? batchTotal : (selectedProduct.stock_quantity || 0))
                          : (selectedProduct.stock_quantity || 0);
                        if (displayQty <= 0 && selectedProduct.item_type === 'Part') {
                          return (
                            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center gap-3">
                              <Loader2 className="w-5 h-5 text-rose-500 shrink-0" />
                              <p className="text-[11px] leading-tight text-rose-700 dark:text-rose-300 font-black uppercase tracking-tight">
                                Item out of stock. Please check another location.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {selectedProduct.item_type !== 'Service' && selectedProduct.recipe_type !== 'A La Carte' && (selectedProduct.is_fifo || selectedProduct.is_expiry) && (
                    <div className="pt-4 mt-2">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex flex-col">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Batch Selection</p>
                          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-0.5">
                            Current preference
                          </p>
                        </div>
                        {loadingBatches && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                      </div>

                      <div className={`p-4 rounded-[1.5rem] border-2 transition-all ${Object.keys(manualSelections).length > 0 ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20' : 'bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100">
                                {Object.keys(manualSelections).length > 0 ? 'Manual Selection' : 'Auto-FIFO Selection'}
                            </span>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                               {Object.keys(manualSelections).length > 0 ? 'Manual Override Active' : 'Auto-Loadout Details'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {Object.keys(manualSelections).length > 0 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setManualSelections({}); }}
                                    className="px-2 py-1 bg-rose-100 dark:bg-rose-500/10 text-[9px] font-black uppercase text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={() => setIsAdjustmentOpen(true)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-primary hover:text-white transition-all"
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                            {(() => {
                                const isManual = Object.keys(manualSelections).length > 0;
                                let picks: any[] = [];
                                
                                if (isManual) {
                                    picks = Object.entries(manualSelections).map(([id, qty]) => {
                                        const b = batches.find(b => String(b.id) === String(id));
                                        return { name: b?.batch_number === 'UNBATCHED' ? 'General Stock' : b?.batch_number, qty };
                                    });
                                } else {
                                    let remaining = parseInt(modalQty, 10) || 0;
                                    for (const b of batches) {
                                        if (remaining <= 0) break;
                                        const take = Math.min(remaining, Number(b.quantity_on_hand));
                                        if (take > 0) {
                                            picks.push({ name: b.batch_number === 'UNBATCHED' ? 'General Stock' : b.batch_number, qty: take });
                                            remaining -= take;
                                        }
                                    }
                                }

                                if (picks.length === 0) return <span className="text-[10px] text-slate-400 font-bold uppercase">No stock to allocate</span>;
                                return picks.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                        <span className="truncate max-w-[120px]">{p.name || 'Batch'}</span>
                                        <span className="font-black text-slate-900 dark:text-slate-100 shrink-0">{p.qty} {selectedProduct.unit}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                        
                        <button 
                            onClick={() => setIsAdjustmentOpen(true)}
                            className="w-full mt-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-center text-slate-400 hover:text-primary transition-colors border-t border-slate-100 dark:border-slate-800/50"
                        >
                            Change Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Numpad */}
          <div className="w-full md:w-[55%] p-4 md:p-6 flex flex-col bg-white dark:bg-card border-t md:border-t-0 border-border">
            {/* Quantity Display */}
            <div className="mb-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Quantity</label>
              <div className="mt-1.5 h-12 sm:h-14 bg-muted/30 border-2 border-border rounded-xl flex items-center justify-end px-4 shadow-inner focus-within:border-primary transition-colors">
                <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tighter text-foreground">{modalQty}</span>
              </div>
            </div>

            {/* Numpad Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1','2','3','4','5','6','7','8','9','.','0','DEL'].map(val => (
                <Button
                  key={val}
                  variant={val === 'C' || val === 'DEL' ? 'secondary' : 'outline'}
                  className={`h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-2xl shadow-sm ${val !== 'C' && val !== 'DEL' ? 'bg-white hover:bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-primary transition-all' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-none'}`}
                  onClick={() => handleNumpadClick(val)}
                >
                  {val}
                </Button>
              ))}
            </div>

            {/* Discount Summary Button */}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
              <button
                onClick={() => setIsDiscountDialogOpen(true)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${Number(modalDiscount) > 0 ? 'bg-rose-50 border-2 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/20' : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100 dark:bg-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${Number(modalDiscount) > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${Number(modalDiscount) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Line Discount</span>
                    <span className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100">
                        {Number(modalDiscount) > 0 ? `LKR ${Number(modalDiscount).toFixed(2)} Off` : 'None applied'}
                    </span>
                  </div>
                </div>
                <div className="p-1 px-2 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {Number(modalDiscount) > 0 ? 'Change' : 'Add'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 md:p-6 bg-white dark:bg-card border-t border-border shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)] shrink-0">
          <Button 
            size="lg" 
            className="w-full h-16 sm:h-20 rounded-2xl text-lg sm:text-xl font-black tracking-[0.1em] uppercase shadow-2xl bg-primary hover:bg-primary/90 text-white"
            onClick={confirmAddToCart}
            disabled={!selectedProduct || parseFloat(modalQty) <= 0 || (selectedProduct?.item_type !== 'Service' && selectedProduct?.recipe_type !== 'A La Carte' && parseFloat(modalQty) > ((selectedProduct?.is_fifo || selectedProduct?.is_expiry) ? ((batches.length > 0 || !loadingBatches) ? batches.reduce((acc, b) => acc + Number(b.quantity_on_hand), 0) : (selectedProduct?.stock_quantity || 0)) : (selectedProduct?.stock_quantity || 0)))}
          >
            <ShoppingCart className="w-6 h-6 mr-4" /> Add to Shopping Cart
          </Button>
          {selectedProduct && selectedProduct.item_type !== 'Service' && selectedProduct.recipe_type !== 'A La Carte' && parseFloat(modalQty) > ((selectedProduct?.is_fifo || selectedProduct?.is_expiry) ? ((batches.length > 0 || !loadingBatches) ? batches.reduce((acc, b) => acc + Number(b.quantity_on_hand), 0) : (selectedProduct?.stock_quantity || 0)) : (selectedProduct?.stock_quantity || 0)) && (
            <p className="text-center text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 px-4">Cannot exceed available stock</p>
          )}
        </div>
      </DialogContent>

      {/* Batch Adjustment Sub-Dialog */}
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="w-full sm:max-w-2xl h-[100dvh] sm:h-[90vh] p-0 flex flex-col overflow-hidden bg-white dark:bg-slate-950 border-none shadow-2xl rounded-none sm:rounded-[2.5rem]">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Layers className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-2">Adjust Selection</DialogTitle>
                <p className="text-slate-400 text-xs font-semibold tracking-widest pl-1 uppercase">Modify quantities and batch assignments</p>
              </DialogHeader>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Master Quantity Control */}
            <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Quantity</span>
                    <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{modalQty} <span className="text-sm font-bold text-slate-400">{selectedProduct?.unit}</span></span>
                </div>
                <div className="flex items-center bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm h-14">
                  <button 
                    className="w-14 h-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors text-2xl font-black"
                    onClick={() => {
                        const q = parseInt(modalQty, 10) || 0;
                        if (q > 1) {
                            setModalQty(String(q - 1));
                            setManualSelections({}); // Reset manual if overall qty changes via main selector for safety or keep it? 
                            // User request: "adjust the qty and batch selection"
                        }
                    }}
                  >-</button>
                  <input 
                    type="number"
                    step="any"
                    className="w-20 h-full text-center text-xl font-black bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={modalQty}
                    onChange={(e) => {
                        setModalQty(e.target.value);
                        setManualSelections({});
                    }}
                  />
                  <button 
                    className="w-14 h-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors text-2xl font-black"
                    onClick={() => {
                        const q = parseFloat(modalQty) || 0;
                        setModalQty(String(q + 1));
                        setManualSelections({});
                    }}
                  >+</button>
                </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 mb-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Batches</h4>
                 {Object.keys(manualSelections).length > 0 && (
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Manual Overrides Active</span>
                 )}
              </div>
              
              {batches.map((b, idx) => {
                const onHand = Number(b.quantity_on_hand);
                const isManual = Object.keys(manualSelections).length > 0;
                let picked = 0;
                
                if (isManual) {
                  picked = manualSelections[b.id] || 0;
                } else {
                  // Pre-fill calculation for display
                  let remaining = parseInt(modalQty, 10) || 0;
                  for (let i = 0; i <= idx; i++) {
                    const currentBatchOH = Number(batches[i].quantity_on_hand);
                    const take = Math.min(remaining, currentBatchOH);
                    if (i === idx) picked = take;
                    remaining -= take;
                  }
                }

                const isUnbatched = b.batch_number === 'UNBATCHED';
                
                return (
                  <div key={b.id || idx} className={`p-5 rounded-[1.5rem] border-2 transition-all duration-300 ${picked > 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/40' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60 hover:opacity-100'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${picked > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                          <Archive className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black tracking-tight ${isUnbatched ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-100'}`}>
                            {isUnbatched ? 'General Stock' : b.batch_number}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{onHand} available</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm h-10">
                        <button 
                          className="w-10 h-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-colors"
                          onClick={() => handleManualBatchChange(b.id, picked - 1, onHand)}
                        >-</button>
                        <input 
                          type="number"
                          step="any"
                          className="w-12 h-full text-center text-xs font-black bg-transparent focus:outline-none"
                          value={picked || ''}
                          placeholder="0"
                          onChange={(e) => handleManualBatchChange(b.id, parseFloat(e.target.value) || 0, onHand)}
                        />
                        <button 
                          className="w-10 h-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 border-l border-slate-100 dark:border-slate-800 transition-colors"
                          onClick={() => handleManualBatchChange(b.id, picked + 1, onHand)}
                        >+</button>
                      </div>
                    </div>

                    {(b.expiry_date || b.mfg_date) && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-4">
                            {b.expiry_date && (
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    Exp: {b.expiry_date}
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
             <Button 
                onClick={() => setIsAdjustmentOpen(false)}
                className="w-full h-14 rounded-2xl text-lg font-black tracking-widest uppercase shadow-xl bg-slate-900 hover:bg-black text-white"
             >
                <Check className="w-5 h-5 mr-3" /> Confirm Selection
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Adjustment Sub-Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden bg-white dark:bg-slate-950 border-none shadow-2xl rounded-none sm:rounded-[2rem]">
          <div className="bg-rose-600 p-8 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Banknote className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-2 text-white">Line Discount</DialogTitle>
                <p className="text-rose-100 text-xs font-semibold tracking-widest pl-1 uppercase opacity-80">Reduce unit price for this item</p>
              </DialogHeader>
            </div>
          </div>

          <div className="p-8 flex flex-col items-center">
            <div className="w-full mb-8">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Discount Amount (LKR)</label>
              <div className="mt-1.5 h-16 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-end px-6 shadow-inner">
                <span className="text-3xl font-black tabular-nums text-rose-600 tracking-tighter">{modalDiscount}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full mb-8">
              {['1','2','3','4','5','6','7','8','9','C','0','DEL'].map(val => (
                <Button
                  key={val}
                  variant="outline"
                  className={`h-14 text-xl font-black rounded-xl ${val === 'C' || val === 'DEL' ? 'bg-rose-50 text-rose-600 border-none hover:bg-rose-100' : 'bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800'}`}
                  onClick={() => {
                    if (val === 'C') setModalDiscount("0");
                    else if (val === 'DEL') setModalDiscount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
                    else setModalDiscount(prev => prev === "0" ? val : prev + val);
                  }}
                >
                  {val}
                </Button>
              ))}
            </div>

            <div className="flex gap-3 w-full">
                <Button 
                    variant="ghost"
                    onClick={() => { setModalDiscount("0"); setIsDiscountDialogOpen(false); }}
                    className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400"
                >
                    Clear
                </Button>
                <Button 
                    onClick={() => setIsDiscountDialogOpen(false)}
                    className="flex-[2] h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl bg-slate-900 text-white"
                >
                    Apply Discount
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>

  );
};

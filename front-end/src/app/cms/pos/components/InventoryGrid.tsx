"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  RotateCcw, 
  Banknote, 
  History, 
  Store, 
  Info, 
  Sun, 
  Moon, 
  Keyboard, 
  LayoutGrid, 
  RefreshCw,
  Filter,
  LayoutDashboard,
  FileText,
  Barcode,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePOS } from "../context/POSContext";
import { fetchPosDayLedger } from "@/lib/api";

export const InventoryGrid: React.FC = () => {
  const {
    inventory,
    searchQuery,
    setSearchQuery,
    setGuideModalOpen,
    toggleTheme,
    theme,
    setReturnDialogOpen,
    setRefundDialogOpen,
    setLedgerDialogOpen,
    setPendingInvoicesDialogOpen,
    setLoadingLedger,
    setDayLedger,
    selectedLocation,
    setSelectedProduct,
    setProductModalOpen,
    vKeyboardEnabled,
    setVKeyboardEnabled,
    setVKeyboardActiveInput,
    autoAddOnScan,
    setAutoAddOnScan,
    setTableManagementOpen,
    reloadData,
    loading: dataLoading,
    collections,
    selectedCollectionId,
    setSelectedCollectionId,
    posActiveFilters,
    selectedBrandName,
    setSelectedBrandName,
    selectedItemType,
    setSelectedItemType,
    selectedSectionName,
    setSelectedSectionName,
    selectedDepartmentName,
    setSelectedDepartmentName,
    selectedCategoryName,
    setSelectedCategoryName,
    selectedSupplierName,
    setSelectedSupplierName
  } = usePOS();

  const [colSearch, setColSearch] = React.useState("");
  const [selectedRecipeType, setSelectedRecipeType] = useState<string | null>(null);
  
  const [visibleCount, setVisibleCount] = useState(50);
  const observerTarget = useRef(null);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, selectedCollectionId, selectedRecipeType, selectedBrandName, selectedItemType, selectedSectionName, selectedDepartmentName, selectedCategoryName, selectedSupplierName]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 50);
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget.current]);

  const filteredInventory = useMemo(() => {
    let filtered = [...inventory];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.part_name?.toLowerCase().includes(q) || 
        p.sku?.toLowerCase().includes(q) || 
        p.brand?.toLowerCase().includes(q) ||
        p.barcode_number?.toLowerCase().includes(q) ||
        `item-${p.id}`.includes(q)
      );
    }

    // Collection filter
    if (selectedCollectionId !== null) {
      filtered = filtered.filter(p => {
        const cids = Array.isArray(p.collection_ids) ? p.collection_ids : [];
        return cids.includes(selectedCollectionId);
      });
    }

    // Recipe Type filter
    if (selectedRecipeType !== null) {
      filtered = filtered.filter(p => p.recipe_type === selectedRecipeType);
    }

    // Brand filter
    if (selectedBrandName) {
      filtered = filtered.filter(p => (p.brand_name || p.brand) === selectedBrandName);
    }

    // Item Type filter
    if (selectedItemType) {
      filtered = filtered.filter(p => p.item_type === selectedItemType);
    }

    // Section filter
    if (selectedSectionName) {
      filtered = filtered.filter(p => p.section_name === selectedSectionName);
    }

    // Department filter
    if (selectedDepartmentName) {
      filtered = filtered.filter(p => p.department_name === selectedDepartmentName);
    }

    // Category filter
    if (selectedCategoryName) {
      filtered = filtered.filter(p => p.category_name === selectedCategoryName);
    }

    // Supplier filter
    if (selectedSupplierName) {
      filtered = filtered.filter(p => {
        if (!p.suppliers || !Array.isArray(p.suppliers)) return false;
        return p.suppliers.some((s: any) => s.name === selectedSupplierName);
      });
    }

    return filtered;
  }, [
    inventory, searchQuery, selectedCollectionId, selectedRecipeType, 
    selectedBrandName, selectedItemType, selectedSectionName, 
    selectedDepartmentName, selectedCategoryName, selectedSupplierName
  ]);

  const filteredCollections = useMemo(() => {
    if (!colSearch.trim()) return collections;
    const q = colSearch.toLowerCase();
    return collections.filter(c => c.name?.toLowerCase().includes(q));
  }, [collections, colSearch]);

  const uniqueBrands = useMemo(() => {
    const brands = inventory.map(p => p.brand_name || p.brand).filter(Boolean);
    return Array.from(new Set(brands)).sort();
  }, [inventory]);

  const uniqueItemTypes = useMemo(() => {
    const types = inventory.map(p => p.item_type).filter(Boolean);
    return Array.from(new Set(types)).sort();
  }, [inventory]);

  const uniqueSections = useMemo(() => {
    const sections = inventory.map(p => p.section_name).filter(Boolean);
    return Array.from(new Set(sections)).sort();
  }, [inventory]);

  const uniqueDepartments = useMemo(() => {
    const deps = inventory.map(p => p.department_name).filter(Boolean);
    return Array.from(new Set(deps)).sort();
  }, [inventory]);

  const uniqueCategories = useMemo(() => {
    const cats = inventory.map(p => p.category_name).filter(Boolean);
    return Array.from(new Set(cats)).sort();
  }, [inventory]);

  const uniqueSuppliers = useMemo(() => {
    const sups = inventory.flatMap(p => p.suppliers?.map((s: any) => s.name) || []).filter(Boolean);
    return Array.from(new Set(sups)).sort();
  }, [inventory]);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const ActionButtons = ({ isMobileMenu = false }: { isMobileMenu?: boolean }) => {
    const btnClass = isMobileMenu 
       ? "w-full h-12 justify-start gap-4 px-4 rounded-xl font-bold border-none" 
       : "h-10 w-10 shrink-0 bg-transparent border-border";

    return (
        <>
            <Button
              variant="outline"
              size={isMobileMenu ? "default" : "icon"}
              className={`${btnClass} ${!isMobileMenu ? "hover:bg-primary/10 hover:border-primary hover:text-primary" : "bg-primary/10 text-primary"}`}
              onClick={() => window.location.href = '../../dashboard'}
            >
              <LayoutDashboard className="w-5 h-5" />
              {isMobileMenu && <span className="font-black">Back to ERP</span>}
            </Button>

            <Button
              variant="outline"
              size={isMobileMenu ? "default" : "icon"}
              className={`${btnClass} ${!isMobileMenu ? "hover:bg-slate-100 dark:hover:bg-slate-800" : "bg-slate-100 dark:bg-slate-900"}`}
              onClick={reloadData}
              disabled={dataLoading}
            >
              <RefreshCw className={`w-5 h-5 text-slate-500 ${dataLoading ? 'animate-spin' : ''}`} />
              {isMobileMenu && <span>Refresh Data</span>}
            </Button>

            <Button
              variant="outline"
              size={isMobileMenu ? "default" : "icon"}
              className={`${btnClass} border-2 ${vKeyboardEnabled ? 'bg-primary/10 border-primary text-primary shadow-sm' : ''} ${!isMobileMenu && !vKeyboardEnabled ? 'text-slate-500' : ''}`}
              onClick={() => setVKeyboardEnabled(!vKeyboardEnabled)}
            >
              <Keyboard className="w-5 h-5 font-bold" />
              {isMobileMenu && <span>Virtual Keyboard</span>}
            </Button>

            <Button
              variant="outline"
              size={isMobileMenu ? "default" : "icon"}
              className={`${btnClass} border-2 ${autoAddOnScan ? 'bg-primary/10 border-primary text-primary shadow-sm' : ''} ${!isMobileMenu && !autoAddOnScan ? 'text-slate-500' : ''}`}
              onClick={() => setAutoAddOnScan(!autoAddOnScan)}
              title="Scanner: Auto Add to Cart"
            >
              <Barcode className="w-5 h-5 font-bold" />
              {isMobileMenu && <span>Scanner Auto-Add</span>}
            </Button>

            <Button
              variant="outline"
              size={isMobileMenu ? "default" : "icon"}
              className={btnClass}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isMobileMenu && <span>Toggle Theme</span>}
            </Button>

            <Button
              variant="outline"
              className={isMobileMenu ? btnClass + " bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400" : "h-10 px-3 shrink-0 bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 font-bold flex items-center gap-2"}
              onClick={() => setReturnDialogOpen(true)}
            >
              <RotateCcw className="w-4 h-4" /> 
              <span>Returns</span>
            </Button>
            
            <Button
              variant="outline"
              className={isMobileMenu ? btnClass + " bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" : "h-10 px-3 shrink-0 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 font-bold flex items-center gap-2"}
              onClick={() => setRefundDialogOpen(true)}
            >
              <Banknote className="w-4 h-4" /> 
              <span>Refunds</span>
            </Button>

            <Button
              variant="outline"
              className={isMobileMenu ? btnClass + " bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" : "h-10 px-3 shrink-0 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 font-bold flex items-center gap-2"}
              onClick={() => setPendingInvoicesDialogOpen(true)}
            >
              <FileText className="w-4 h-4" /> 
              <span>Pending</span>
            </Button>

            <Button
              variant="outline"
              className={isMobileMenu ? btnClass + " bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400" : "h-10 px-3 shrink-0 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-400 font-bold flex items-center gap-2"}
              onClick={async () => {
                 setLedgerDialogOpen(true);
                 setLoadingLedger(true);
                 try {
                    const data = await fetchPosDayLedger(selectedLocation);
                    setDayLedger(data);
                 } finally {
                    setLoadingLedger(false);
                 }
              }}
            >
              <History className="w-4 h-4" /> 
              <span>Summary</span>
            </Button>
        </>
    );
  };

  return (
    <div className="flex-1 flex h-full bg-slate-50 dark:bg-card border-r border-border overflow-hidden">
      {/* Vertical Collections Sidebar - Hidden on mobile */}
      <div className="w-64 flex flex-col border-r border-border bg-white dark:bg-slate-950 shrink-0 hidden lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 mb-3">
             <LayoutGrid className="w-4 h-4 text-primary" />
             <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Collections</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search groups..." 
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
              className="h-9 pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              onFocus={() => {
                if (vKeyboardEnabled) {
                  setVKeyboardActiveInput({
                    key: "Collection Search",
                    value: colSearch,
                    setter: (val: string) => setColSearch(val)
                  });
                }
              }}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedCollectionId(null);
              setSelectedRecipeType(null);
              setSelectedBrandName(null);
              setSelectedItemType(null);
              setSelectedSectionName(null);
              setSelectedDepartmentName(null);
              setSelectedCategoryName(null);
              setSelectedSupplierName(null);
            }}
            className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${[selectedCollectionId, selectedRecipeType, selectedBrandName, selectedItemType, selectedSectionName, selectedDepartmentName, selectedCategoryName, selectedSupplierName].every(v => v === null) ? 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
          >
            <Filter className={`w-4 h-4 ${[selectedCollectionId, selectedRecipeType, selectedBrandName, selectedItemType, selectedSectionName, selectedDepartmentName, selectedCategoryName, selectedSupplierName].every(v => v === null) ? 'text-white' : 'text-slate-400'}`} />
            All Items
          </Button>
          
          {posActiveFilters?.includes('recipe_types') && (
            <>
              <div className="pt-2 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recipe Types</p>
              </div>
              
              {['Standard', 'A La Carte', 'Recipe'].map(type => (
                <Button
                  key={type}
                  variant="ghost"
                  onClick={() => setSelectedRecipeType(type === selectedRecipeType ? null : type)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedRecipeType === type ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedRecipeType === type ? 'bg-white' : 'bg-amber-400'}`} />
                  <span className="truncate">{type}</span>
                </Button>
              ))}
            </>
          )}

          {posActiveFilters?.includes('collections') && (
            <>
              <div className="pt-4 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collections</p>
              </div>
              
              {filteredCollections.map(col => (
                <Button
                  key={col.id}
                  variant="ghost"
                  onClick={() => setSelectedCollectionId(col.id)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedCollectionId === col.id ? 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedCollectionId === col.id ? 'bg-white' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="truncate">{col.name}</span>
                </Button>
              ))}
              
              {filteredCollections.length === 0 && colSearch && (
                <div className="py-10 text-center px-4">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">No results</p>
                </div>
              )}
            </>
          )}

          {posActiveFilters?.includes('brands') && uniqueBrands.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Brands</p>
              </div>
              
              {uniqueBrands.map((b: any) => (
                <Button
                  key={b}
                  variant="ghost"
                  onClick={() => setSelectedBrandName(b === selectedBrandName ? null : b)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedBrandName === b ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedBrandName === b ? 'bg-white' : 'bg-indigo-400'}`} />
                  <span className="truncate">{b}</span>
                </Button>
              ))}
            </>
          )}

          {posActiveFilters?.includes('item_type') && uniqueItemTypes.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Item Type</p>
              </div>
              
              {uniqueItemTypes.map((t: any) => (
                <Button
                  key={t}
                  variant="ghost"
                  onClick={() => setSelectedItemType(t === selectedItemType ? null : t)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedItemType === t ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20 hover:bg-violet-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedItemType === t ? 'bg-white' : 'bg-violet-400'}`} />
                  <span className="truncate">{t}</span>
                </Button>
              ))}
            </>
          )}

          {posActiveFilters?.includes('sections') && uniqueSections.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sections</p>
              </div>
              
              {uniqueSections.map((s: any) => (
                <Button
                  key={s}
                  variant="ghost"
                  onClick={() => setSelectedSectionName(s === selectedSectionName ? null : s)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedSectionName === s ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedSectionName === s ? 'bg-white' : 'bg-emerald-400'}`} />
                  <span className="truncate">{s}</span>
                </Button>
              ))}
            </>
          )}

          {posActiveFilters?.includes('departments') && uniqueDepartments.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Departments</p>
              </div>
              
              {uniqueDepartments.map((d: any) => (
                <Button
                  key={d}
                  variant="ghost"
                  onClick={() => setSelectedDepartmentName(d === selectedDepartmentName ? null : d)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedDepartmentName === d ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:bg-sky-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedDepartmentName === d ? 'bg-white' : 'bg-sky-400'}`} />
                  <span className="truncate">{d}</span>
                </Button>
              ))}
            </>
          )}

          {posActiveFilters?.includes('categories') && uniqueCategories.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categories</p>
              </div>
              
              {uniqueCategories.map((c: any) => (
                <Button
                  key={c}
                  variant="ghost"
                  onClick={() => setSelectedCategoryName(c === selectedCategoryName ? null : c)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedCategoryName === c ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:bg-rose-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedCategoryName === c ? 'bg-white' : 'bg-rose-400'}`} />
                  <span className="truncate">{c}</span>
                </Button>
              ))}
            </>
          )}

          {posActiveFilters?.includes('suppliers') && uniqueSuppliers.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Suppliers</p>
              </div>
              
              {uniqueSuppliers.map((s: any) => (
                <Button
                  key={s}
                  variant="ghost"
                  onClick={() => setSelectedSupplierName(s === selectedSupplierName ? null : s)}
                  className={`w-full justify-start gap-3 h-11 px-3 font-bold rounded-xl transition-all ${selectedSupplierName === s ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20 hover:bg-fuchsia-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedSupplierName === s ? 'bg-white' : 'bg-fuchsia-400'}`} />
                  <span className="truncate">{s}</span>
                </Button>
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-border bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
             <span>Quick Filter</span>
             <Badge variant="outline" className="text-[9px] px-1 h-4">{filteredCollections.length}</Badge>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar: Search & Actions */}
        <div className="p-3 lg:p-4 bg-white dark:bg-card border-b border-border shadow-sm flex items-center gap-2 lg:gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={window.innerWidth < 640 ? "Search..." : "Scan barcode or search products..."} 
              className="pl-9 lg:pl-10 h-11 lg:h-14 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-inner rounded-xl text-sm lg:text-lg"
              onFocus={() => {
                if (vKeyboardEnabled) {
                  setVKeyboardActiveInput({
                    key: "Product Search",
                    value: searchQuery,
                    setter: (val: string) => setSearchQuery(val)
                  });
                }
              }}
            />
          </div>

          {/* Desktop Actions Row */}
          <div className="hidden md:flex items-center gap-2">
            <ActionButtons />
          </div>

          {/* Mobile Actions Menu */}
          <div className="flex md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
                  <Settings2 className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[280px] p-4 rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-950">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Quick Actions</p>
                    <div className="grid grid-cols-1 gap-2">
                       <ActionButtons isMobileMenu />
                    </div>
                 </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-4 custom-scrollbar">
          {filteredInventory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Search className="w-12 h-12 mb-4 opacity-10" />
              <p className="font-bold uppercase tracking-widest text-[10px]">No records found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-4">
              {filteredInventory.slice(0, visibleCount).map(product => {
                const outOfStock = product.stock_quantity <= 0 && product.item_type !== 'Service' && product.recipe_type !== 'A La Carte';
                return (
                  <div 
                    key={product.id} 
                    onClick={() => !outOfStock && handleProductClick(product)}
                    className={`relative bg-white dark:bg-slate-900 border border-border hover:border-primary hover:shadow-xl transition-all duration-300 rounded-xl lg:rounded-2xl p-3 lg:p-4 flex flex-col justify-between cursor-pointer group ${outOfStock ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2 lg:mb-4">
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={product.item_type === 'Service' ? 'secondary' : 'outline'} className="text-[8px] lg:text-[10px] tracking-widest uppercase px-1 py-0 w-fit">
                          {product.item_type}
                        </Badge>
                        {product.recipe_type && product.recipe_type !== 'Standard' && (
                          <Badge variant="outline" className={`text-[8px] lg:text-[10px] tracking-widest uppercase px-1 py-0 w-fit border-none ${product.recipe_type === 'A La Carte' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                            {product.recipe_type}
                          </Badge>
                        )}
                      </div>
                      {product.item_type !== 'Service' && product.recipe_type !== 'A La Carte' && (
                        <span className={`text-[8px] lg:text-[10px] font-black uppercase ${product.stock_quantity > 5 ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {product.stock_quantity} <span className="hidden lg:inline">Left</span>
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {product.sku && <p className="text-[8px] lg:text-[10px] text-muted-foreground font-mono">{product.sku}</p>}
                        {(product.brand_name || product.brand) && (
                          <span className="text-[8px] lg:text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                            {product.brand_name || product.brand}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors line-clamp-2 text-xs lg:text-sm">{product.part_name}</h4>
                    </div>
                    <div className="mt-2 lg:mt-4 pt-2 lg:pt-4 border-t border-border flex justify-between items-center">
                      <span className="font-black text-sm lg:text-base text-slate-900 dark:text-white tabular-nums">LKR {(product.price || product.cost_price || 0).toLocaleString()}</span>
                      <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {visibleCount < filteredInventory.length && (
            <div ref={observerTarget} className="h-20 w-full flex items-center justify-center mt-4">
               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground opacity-50" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

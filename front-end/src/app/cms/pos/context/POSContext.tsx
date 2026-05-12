"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchParts,
  fetchTaxes,
  fetchLocations,
  fetchCustomers,
  createCustomer,
  fetchCompany,
  createInvoice,
  createPaymentReceipt,
  fetchBanks,
  fetchBankBranches,
  fetchBrands,
  fetchCollections,
  fetchPosDayLedger,
  fetchTables,
  fetchStewards,
  holdPOSOrder,
  loadHeldOrder,
  fetchHeldOrders,
  api as apiHelper
} from "@/lib/api";

interface POSContextType {
  // Data State
  inventory: any[];
  systemTaxes: any[];
  locations: any[];
  customers: any[];
  banks: any[];
  bankBranches: any[];
  collections: any[];
  selectedCollectionId: number | null;
  setSelectedCollectionId: (val: number | null) => void;
  selectedBankId: string | null;
  setSelectedBankId: (val: string | null) => void;
  selectedCardCategory: string; // Any, Credit, Debit
  setSelectedCardCategory: (val: string) => void;
  company: any;
  loading: boolean;
  submitting: boolean;
  setSubmitting: (val: boolean) => void;

  // POS State
  cart: any[];
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (val: string) => void;
  billDiscountValue: number;
  setBillDiscountValue: (val: number) => void;
  billDiscountType: 'flat' | 'percentage';
  setBillDiscountType: (val: 'flat' | 'percentage') => void;
  billDiscountDialogOpen: boolean;
  setBillDiscountDialogOpen: (val: boolean) => void;
  orderType: 'dine_in' | 'take_away' | 'retail' | null;
  setOrderType: (val: 'dine_in' | 'take_away' | 'retail' | null) => void;
  orderTypeDialogOpen: boolean;
  setOrderTypeDialogOpen: (val: boolean) => void;
  selectedTable: string | null;
  setSelectedTable: (val: string | null) => void;
  selectedSteward: string | null;
  setSelectedSteward: (val: string | null) => void;
  tables: any[];
  stewards: any[];
  heldOrderId: number | null;
  setHeldOrderId: (val: number | null) => void;
  heldOrders: any[];
  refreshHeldOrders: () => Promise<void>;

  // Actions
  addToCartWithQty: (product: any, qty: number, discountAmt?: number) => void;
  updateCartLine: (index: number, field: string, value: any) => void;
  removeCartLine: (index: number) => void;
  handleCheckoutProcess: (paymentData: any) => Promise<void>;
  holdPOSBill: () => Promise<void>;
  loadPOSBill: (id: number) => Promise<void>;
  reloadData: () => Promise<void>;
  
  // Totals
  totals: {
    subtotal: number;
    lineDiscountTotal: number;
    taxableAmount: number;
    taxSum: number;
    appliedTaxes: any[];
    grandTotal: number;
  };

  // UI States (Shared)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  
  // Management States
  returnDialogOpen: boolean;
  setReturnDialogOpen: (val: boolean) => void;
  refundDialogOpen: boolean;
  setRefundDialogOpen: (val: boolean) => void;
  ledgerDialogOpen: boolean;
  setLedgerDialogOpen: (val: boolean) => void;
  pendingInvoicesDialogOpen: boolean;
  setPendingInvoicesDialogOpen: (val: boolean) => void;
  activeMobileTab: 'shelf' | 'bill';
  setActiveMobileTab: (tab: 'shelf' | 'bill') => void;

  // Product Selection Modal
  productModalOpen: boolean;
  setProductModalOpen: (val: boolean) => void;
  selectedProduct: any;
  setSelectedProduct: (val: any) => void;

  // Quick Customer Add
  addCustomerOpen: boolean;
  setAddCustomerOpen: (val: boolean) => void;
  addingCustomer: boolean;
  setAddingCustomer: (val: boolean) => void;
  newCustomer: { name: string; phone: string };
  setNewCustomer: (val: { name: string; phone: string }) => void;
  handleQuickAddCustomer: (e: React.FormEvent) => Promise<void>;

  // Checkout Dialog State
  checkoutOpen: boolean;
  setCheckoutOpen: (val: boolean) => void;
  openCheckoutDialog: () => void;
  
  // Day Ledger State
  dayLedger: any;
  setDayLedger: (val: any) => void;
  loadingLedger: boolean;
  setLoadingLedger: (val: boolean) => void;

  // Guide State
  guideModalOpen: boolean;
  setGuideModalOpen: (val: boolean) => void;
  
  // Helper for refreshing data
  refreshInventory: () => Promise<void>;
  refreshCustomers: () => Promise<void>;

  // Virtual Keyboard State
  vKeyboardEnabled: boolean;
  setVKeyboardEnabled: (val: boolean) => void;
  vKeyboardActiveInput: {
    key: string;
    value: string;
    setter: (val: string) => void;
    type?: 'default' | 'numeric';
  } | null;
  setVKeyboardActiveInput: (input: any) => void;
  
  // Promotion State
  eligiblePromotions: any[];
  setEligiblePromotions: (val: any[]) => void;
  isPromotionPromptOpen: boolean;
  setIsPromotionPromptOpen: (val: boolean) => void;
  promotionsPromptDismissed: boolean;
  setPromotionsPromptDismissed: (val: boolean) => void;
  checkoutIntentActive: boolean;
  setCheckoutIntentActive: (val: boolean) => void;
  claimPromotionRewards: (promo: any) => void;
  appliedPromotion: any | null;
  setAppliedPromotion: (val: any | null) => void;
  setTableManagementOpen: (val: boolean) => void;
  setBankBranches: (val: any[]) => void;

  // Print Selection
  printSelectionOpen: boolean;
  setPrintSelectionOpen: (val: boolean) => void;
  lastInvoiceId: number | null;
  setLastInvoiceId: (val: number | null) => void;

  // Reservation Link
  reservationDialogOpen: boolean;
  setReservationDialogOpen: (val: boolean) => void;
  handleAddToReservation: (resId: number, items: any[]) => Promise<void>;
}


const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedCardCategory, setSelectedCardCategory] = useState<string>("Credit");

  // Data Context
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemTaxes, setSystemTaxes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [bankBranches, setBankBranches] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);

  // POS State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedLocation, _setSelectedLocation] = useState<string>("");
  const setSelectedLocation = (val: string) => {
    _setSelectedLocation(val);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('location_id', val);
    }
    // Refresh inventory and tables when location changes
    refreshInventory();
    refreshTablesAndStewards(val);
  };
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);
  const [billDiscountType, setBillDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [billDiscountDialogOpen, setBillDiscountDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away' | 'retail' | null>(null);
  const [orderTypeDialogOpen, setOrderTypeDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedSteward, setSelectedSteward] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [stewards, setStewards] = useState<any[]>([]);
  const [dataRefreshing, setDataRefreshing] = useState(false);

  // Management UI States
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [pendingInvoicesDialogOpen, setPendingInvoicesDialogOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'shelf' | 'bill'>('shelf');

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Quick Customer State
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

  // Checkout State
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Day Ledger State
  const [dayLedger, setDayLedger] = useState<any>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Guide State
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Held Orders State
  const [heldOrderId, setHeldOrderId] = useState<number | null>(null);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);

  // Virtual Keyboard
  const [vKeyboardEnabled, setVKeyboardEnabledState] = useState(false);
  const [vKeyboardActiveInput, setVKeyboardActiveInput] = useState<any>(null);

  const setVKeyboardEnabled = (val: boolean) => {
    setVKeyboardEnabledState(val);
    window?.localStorage?.setItem('v_keyboard_enabled', val ? '1' : '0');
  };

  const [eligiblePromotions, setEligiblePromotions] = useState<any[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<any | null>(null);
  const [isPromotionPromptOpen, setIsPromotionPromptOpen] = useState(false);
  const [promotionsPromptDismissed, setPromotionsPromptDismissed] = useState(false);
  const [checkoutIntentActive, setCheckoutIntentActive] = useState(false);
  const [tableManagementOpen, setTableManagementOpen] = useState(false);
  const lastFootprint = React.useRef("");

  // Print Selection State
  const [printSelectionOpen, setPrintSelectionOpen] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);

  // Reservation State
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);


  const updateAppliedPromotion = (promo: any | null) => {
    // Cleanup old reward items if we are clearing or changing promo
    setCart(prev => prev.filter(i => !i.is_reward));
    setAppliedPromotion(promo);
  };


    const refreshTablesAndStewards = async (locId?: string | number) => {
        const id = locId || selectedLocation;
        if (!id) return;
        
        setDataRefreshing(true);
        try {
            const [tbls, stds] = await Promise.all([
                fetchTables(id as any).catch(e => { console.error("fetchTables error:", e); return []; }),
                fetchStewards(id as any).catch(e => { console.error("fetchStewards error:", e); return []; })
            ]);
            setTables(tbls);
            setStewards(stds);
        } catch (err) {
            console.error("POS Data Refresh Failed:", err);
        } finally {
            setDataRefreshing(false);
        }
    };

    const refreshInventory = async () => {
    try {
      const partsRes = await fetchParts();
      setInventory(partsRes);
    } catch (err) {}
  };

  const refreshCustomers = async () => {
    try {
      const custs = await fetchCustomers();
      setCustomers(custs || []);
    } catch (err) {}
  };

  const refreshHeldOrders = async () => {
    const lid = selectedLocation || window?.localStorage?.getItem('location_id');
    if (!lid) return;
    try {
      const res = await fetchHeldOrders(Number(lid));
      setHeldOrders(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error("Failed to refresh held orders:", err);
      toast({ 
        title: "Sync Error", 
        description: "Could not retrieve held bills. Check your connection.",
        variant: "destructive" 
      });
    }
  };

  const reloadData = async () => {
    setLoading(true);
    try {
      // 1. Refresh background data
      await Promise.all([
        refreshInventory(),
        refreshCustomers(),
        refreshTablesAndStewards(),
        refreshHeldOrders(),
        fetchTaxes('', { all: true }).then(t => setSystemTaxes(t || [])).catch(() => {}),
        fetchCollections(true).then(c => setCollections(c || [])).catch(() => {}),
        fetchCompany().then(c => setCompany(c)).catch(() => {})
      ]);

      // 2. Clear current transaction (New Bill)
      setCart([]);
      setSelectedCustomer("");
      setSelectedTable(null);
      setSelectedSteward(null);
      setOrderType(null);
      setBillDiscountValue(0);
      setHeldOrderId(null);
      
      // 3. Trigger Order Type Selection
      setOrderTypeDialogOpen(true);

      toast({
        title: "POS Reset & Reloaded",
        description: "Inventory updated. Please select an order type for the new bill.",
      });
    } catch (err) {
      toast({
        title: "Reload Failed",
        description: "Could not sync latest data from server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoading(true);
        const [partsRes, taxesRes, locsRes, custsRes, compRes, banksRes, collRes] = await Promise.all([
          fetchParts().catch(() => []),
          fetchTaxes('', { all: true }).catch(() => []),
          fetchLocations().catch(() => []),
          fetchCustomers().catch(() => []),
          fetchCompany().catch(() => null),
          fetchBanks().catch(() => []),
          fetchCollections(true).catch(() => [])
        ]);

        setInventory(partsRes);
        setBanks(banksRes);
        setCollections(collRes);
        
        let enabledIds = new Set<number>();
        if (compRes?.tax_ids_json) {
          try {
            const ids = JSON.parse(compRes.tax_ids_json);
            if (Array.isArray(ids)) enabledIds = new Set(ids);
          } catch {}
        }
        
        const filteredTaxes = (taxesRes || []).filter((t: any) => t.is_active && enabledIds.has(t.id));
        setSystemTaxes(filteredTaxes);
        
        setLocations(locsRes || []);
        setCustomers(custsRes || []);
        setCompany(compRes);

        // Hydrate Location
        const lsLocId = window?.localStorage?.getItem('location_id');
        let activeLocId = "";
        
        if (lsLocId && (locsRes || []).some((l: any) => String(l.id) === lsLocId)) {
          activeLocId = lsLocId;
        } else if (locsRes?.length === 1) {
          activeLocId = String(locsRes[0].id);
        }

        if (activeLocId) {
          _setSelectedLocation(activeLocId);
          // Fetch location-dependent data BEFORE clearing the loading state
          await Promise.all([
            refreshTablesAndStewards(activeLocId),
            fetchHeldOrders(Number(activeLocId))
              .then(res => setHeldOrders(Array.isArray(res) ? res : []))
              .catch(() => {})
          ]);
        }

        // Auto-select first customer as default (Walk-In)
        if (custsRes?.length > 0) {
          setSelectedCustomer(String(custsRes[0].id));
        }

        // Keyboard preference
        const lsKeyboard = window?.localStorage?.getItem('v_keyboard_enabled');
        if (lsKeyboard === '1') setVKeyboardEnabledState(true);

        // Open Order Type Dialog on load
        setOrderTypeDialogOpen(true);

      } catch (err) {
        console.error("POS Initialization Failed:", err);
        toast({ title: "Initialization Error", description: "Failed to load POS context.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadContext();
  }, [toast]);

  useEffect(() => {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  // Automatically enforce the Order Type Selector if no order type is selected 
  // and no other management/action modals are currently blocking the view.
  useEffect(() => {
    if (
        !loading && 
        !orderType && 
        !orderTypeDialogOpen &&
        !returnDialogOpen && 
        !refundDialogOpen && 
        !ledgerDialogOpen && 
        !pendingInvoicesDialogOpen &&
        !guideModalOpen &&
        !checkoutOpen
    ) {
        setOrderTypeDialogOpen(true);
    }
  }, [
    loading, 
    orderType, 
    orderTypeDialogOpen, 
    returnDialogOpen, 
    refundDialogOpen, 
    ledgerDialogOpen, 
    guideModalOpen,
    checkoutOpen
  ]);

  const validatePromotions = async (force: boolean = false) => {
    if (cart.length === 0) {
      setEligiblePromotions([]);
      setAppliedPromotion(null);
      return [];
    }

    const subtotal = cart.reduce((acc, i) => acc + (i.quantity * i.unit_price - i.quantity * i.discount), 0);
    
    try {
      const res = await apiHelper('/api/promotion/validate', {
        method: 'POST',
        body: JSON.stringify({
          items: cart,
          subtotal,
          bank_id: selectedBankId,
          card_category: selectedCardCategory,
          location_id: selectedLocation
        })
      });

      const resData = await res.json();
      const matches = Array.isArray(resData.data) ? resData.data : [];
      
      setEligiblePromotions(matches);
      return matches;
    } catch (error) {
      console.error("Promotion validation failed", error);
      setEligiblePromotions([]);
      return [];
    }
  };

  // Automatic Promotion Recognition Engine
  useEffect(() => {
    if (cart.length === 0) {
      setEligiblePromotions([]);
      setAppliedPromotion(null);
      setPromotionsPromptDismissed(false);
      lastFootprint.current = "";
      return;
    }

    // Check if the cart "footprint" (items/quantities) has changed - EXCLUDING rewards
    const currentFootprint = JSON.stringify(cart.filter(i => !i.is_reward).map(i => ({ id: i.id, q: i.quantity })));
    if (currentFootprint !== lastFootprint.current) {
        setPromotionsPromptDismissed(false);
        lastFootprint.current = currentFootprint;
    }

    // Reset list when cart changes to prevent stale prompts
    setEligiblePromotions([]);

    const timer = setTimeout(() => {
      validatePromotions();
    }, 600);

    return () => clearTimeout(timer);
  }, [cart, appliedPromotion, selectedLocation, selectedBankId, selectedCardCategory]);

  const addToCartWithQty = (product: any, qty: number, discountAmt: number = 0, batches?: any[]) => {
    if (!orderType) {
      setOrderTypeDialogOpen(true);
      toast({ 
        title: "Service Mode Required", 
        description: "Please select Dine-In, Take Away, or Retail to start.",
        variant: "destructive"
      });
      return;
    }
    setCart(prev => {
      // For batch-selected items, we always add a new line to ensure specific lot tracking
      if (batches && batches.length > 0) {
        return [...prev, {
          id: product.id,
          description: product.part_name,
          item_type: product.item_type === "Service" ? "Service" : "Part",
          quantity: qty,
          unit_price: product.price || product.cost_price || 0,
          discount: discountAmt,
          selected_batches: batches
        }];
      }

      const existingLine = prev.find(item => item.id === product.id && item.unit_price === (product.price || product.cost_price || 0) && item.discount === discountAmt && !item.selected_batches);
      if (existingLine) {
        return prev.map(item => item === existingLine ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, {
        id: product.id,
        description: product.part_name,
        item_type: product.item_type === "Service" ? "Service" : "Part",
        quantity: qty,
        unit_price: product.price || product.cost_price || 0,
        discount: discountAmt
      }];
    });
  };

  const updateCartLine = (index: number, field: string, value: any) => {
    setCart(prev => {
      const newCart = [...prev];
      if (field === 'quantity' && value <= 0) return prev;
      newCart[index] = { ...newCart[index], [field]: value };
      return newCart;
    });
  };

  const removeCartLine = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCustomer(true);
    try {
      const c = await createCustomer({ name: newCustomer.name, phone: newCustomer.phone });
      setCustomers(prev => [...prev, c]);
      setSelectedCustomer(String(c.id));
      setAddCustomerOpen(false);
      setNewCustomer({ name: "", phone: "" });
      toast({ title: "Customer Created", description: "Selected automatically." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAddingCustomer(false);
    }
  };

  const openCheckoutDialog = async () => {
    if (cart.length === 0) return;
    if (!selectedLocation) { toast({ title: "Missing Data", description: "Select a location.", variant: "destructive" }); return; }
    
    setCheckoutIntentActive(true);

    // Final Sanity Check for Promotions
    const matches = await validatePromotions(true);
    
    // 1. Check if currently applied promotion is still valid
    if (appliedPromotion) {
        const stillValid = matches.find(p => p.promotion_id === appliedPromotion.promotion_id);
        if (!stillValid) {
            setAppliedPromotion(null);
            setCheckoutIntentActive(false);
            toast({
                title: "Promotion Invalid",
                description: "The applied promotion is no longer valid for the current cart and has been removed.",
                variant: "destructive"
            });
            return; // Exit so the user can see updated totals
        }
    }

    // 2. Check for offers if NONE applied, or if applied was invalid
    // If a promotion is ALREADY applied and valid, we RESPECT the user's choice and proceed.
    if (!appliedPromotion && matches.length > 0) {
        setPromotionsPromptDismissed(false);
        return; 
    }

    setCheckoutIntentActive(false);
    setCheckoutOpen(true);
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let lineDiscountTotal = 0;
    cart.forEach(item => {
      const gross = item.quantity * item.unit_price;
      const discount = item.quantity * item.discount;
      subtotal += gross;
      lineDiscountTotal += discount;
    });
    const billDiscountAmt = billDiscountType === 'percentage' 
      ? (subtotal - lineDiscountTotal) * (billDiscountValue / 100)
      : billDiscountValue;
      
    // Promotions are exclusive (Best Offer Rule)
    const promoDiscountAmt = appliedPromotion ? Number(appliedPromotion.discount_value) : 0;
      
    const taxableAmount = Math.max(0, subtotal - lineDiscountTotal - billDiscountAmt - promoDiscountAmt);
    let currentBase = taxableAmount;
    let taxSum = 0;
    const appliedTaxes: any[] = [];
    const sortedTaxes = [...systemTaxes].sort((a, b) => a.sort_order - b.sort_order);
    sortedTaxes.forEach(tax => {
      const applyTo = tax.apply_on === 'base_plus_previous' ? currentBase : taxableAmount;
      const taxAmt = applyTo * (Number(tax.rate_percent) / 100);
      taxSum += taxAmt;
      appliedTaxes.push({ name: tax.name, code: tax.code, rate_percent: tax.rate_percent, amount: taxAmt });
      if (tax.apply_on === 'base_plus_previous') {
        currentBase += taxAmt;
      }
    });

    // Service Charge from Location Settings (Decoupled from Taxes)
    let serviceChargeAmt = 0;
    const currentLocation = locations.find(l => String(l.id) === String(selectedLocation));
    
    if (orderType === 'dine_in' && currentLocation?.allow_service_charge) {
        const rate = Number(currentLocation.service_charge_rate || 0);
        if (rate > 0) {
            serviceChargeAmt = taxableAmount * (rate / 100);
            appliedTaxes.push({ 
                name: "Service Charge", 
                code: "SC", 
                rate_percent: rate, 
                amount: serviceChargeAmt,
                is_sc: true 
            });
            taxSum += serviceChargeAmt;
        }
    }

    const grandTotal = taxableAmount + taxSum;
    return { subtotal, lineDiscountTotal, billDiscountAmt, promoDiscountAmt, taxableAmount, taxSum, appliedTaxes, grandTotal };
  }, [cart, billDiscountValue, billDiscountType, systemTaxes, orderType, appliedPromotion]);

  const claimPromotionRewards = (promo: any) => {
    if (!promo || !promo.missing_rewards) return;
    
    const reward = promo.missing_rewards;
    const product = inventory.find(p => String(p.id) === String(reward.item_id));
    
    if (product) {
      const newLine = {
        id: product.id,
        description: (product.part_name || product.description) + " (Reward)",
        item_type: product.item_type === "Service" ? "Service" : "Part",
        quantity: reward.qty,
        unit_price: Number(product.price || 0),
        discount: Number(product.price || 0), // 100% discount
        is_reward: true,
        promotion_id: promo.promotion_id
      };
      
      setCart(prev => [...prev.filter(i => !i.is_reward), newLine]);
    }
  };

  const handleCheckoutProcess = async (paymentData: any) => {
    if (!orderType) {
      setOrderTypeDialogOpen(true);
      toast({ title: "Service Mode Required", description: "Select Dine-In, Take Away, or Retail to continue.", variant: "destructive" });
      return;
    }

    if (!selectedCustomer) {
      toast({ title: "Selection Required", description: "Please select a customer to continue.", variant: "destructive" });
      return;
    }

    // This will be called by the CheckoutDialog with the detailed payment info
    setSubmitting(true);
    try {
      const payload = {
        held_order_id: heldOrderId,
        location_id: Number(selectedLocation),
        customer_id: Number(selectedCustomer),
        billing_address: company?.address || "",
        shipping_address: company?.address || "",
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        subtotal: totals.subtotal,
        tax_total: totals.taxSum,
        discount_total: totals.lineDiscountTotal + totals.billDiscountAmt + totals.promoDiscountAmt,
        grand_total: totals.grandTotal,
        order_type: orderType || 'retail',
        table_id: selectedTable ? Number(selectedTable) : null,
        steward_id: selectedSteward ? Number(selectedSteward) : null,
        applied_taxes: totals.appliedTaxes,
        notes: paymentData.notes || "POS Retail Sale",
        applied_promotion_id: appliedPromotion ? appliedPromotion.promotion_id : null,
        applied_promotion_name: appliedPromotion ? appliedPromotion.name : null,
        bank_id: selectedBankId,
        card_category: selectedCardCategory,
        items: cart.map(item => ({
          description: item.description,
          item_type: item.item_type,
          item_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          tax_amount: 0, 
          line_total: (item.quantity * item.unit_price) - (item.quantity * item.discount)
        })),
        payments: paymentData.isSplit ? paymentData.splitPayments.map((p: any) => ({
          method: p.method,
          amount: p.amount,
          cardLast4: p.cardLast4,
          cardType: p.cardType,
          cardAuthCode: p.cardAuthCode,
          bankId: p.bankId,
          cardCategory: p.cardCategory,
          chequeNo: p.chequeNo,
          chequeBankName: p.chequeBankName,
          chequeBranchName: p.chequeBranchName,
          chequeDate: p.chequeDate,
          chequePayee: p.chequePayee
        })) : [{
          method: paymentData.method,
          amount: paymentData.amount,
          cardLast4: paymentData.cardLast4,
          cardType: paymentData.cardType,
          cardAuthCode: paymentData.cardAuthCode,
          bankId: paymentData.bankId || selectedBankId,
          cardCategory: paymentData.cardCategory || selectedCardCategory,
          chequeNo: paymentData.chequeNo,
          chequeBankName: paymentData.chequeBankName,
          chequeBranchName: paymentData.chequeBranchName,
          chequeDate: paymentData.chequeDate,
          chequePayee: paymentData.chequePayee
        }]
      };

      const invoiceRes = await createInvoice(payload);
      const invoiceId = invoiceRes.data.id;
      toast({ title: "Sale Complete", description: "Invoice and payments processed atomically." });
      
      // Update local stock quantities
      await refreshInventory();

      setCart([]);
      setBillDiscountValue(0);
      setBillDiscountType('flat');
      setHeldOrderId(null);
      setOrderType(null);
      setOrderTypeDialogOpen(true);
      refreshHeldOrders();
      if (customers.length > 0) setSelectedCustomer(String(customers[0].id));
      
      // Instead of opening print immediately, open selection dialog
      setLastInvoiceId(invoiceId);
      setPrintSelectionOpen(true);

    } catch (err: any) {
      toast({ title: "Checkout Failed", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const holdPOSBill = async () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Add items before holding.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        held_order_id: heldOrderId,
        location_id: Number(selectedLocation),
        customer_id: Number(selectedCustomer),
        order_type: orderType || 'retail',
        table_id: selectedTable ? Number(selectedTable) : null,
        steward_id: selectedSteward ? Number(selectedSteward) : null,
        subtotal: totals.subtotal,
        tax_total: totals.taxSum,
        discount_total: totals.lineDiscountTotal + (billDiscountType === 'percentage' ? (totals.subtotal - totals.lineDiscountTotal) * (billDiscountValue / 100) : billDiscountValue),
        grand_total: totals.grandTotal,
        notes: "",
        items: cart.map(item => ({
          item_id: item.id,
          description: item.description,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          line_total: (item.quantity * item.unit_price) - (item.quantity * item.discount)
        }))
      };

      const res = await holdPOSOrder(payload);
      if (res.status === 'success') {
        const newId = res.data.id;
        setHeldOrderId(newId);
        toast({ title: "Order Held", description: "Bill saved and KOT sent if new items added." });
        
        // Clear screen for next bill
        setCart([]);
        setHeldOrderId(null);
        setSelectedTable(null);
        setSelectedSteward(null);
        setOrderType(null);
        setBillDiscountValue(0);
        setOrderTypeDialogOpen(true);
        refreshHeldOrders();

        // Print KOT Automatically
        window.open(`/cms/pos/kot/${newId}?autoprint=1`, '_blank');
      }
    } catch (err: any) {
      toast({ title: "Hold Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const loadPOSBill = async (id: number) => {
    setLoading(true);
    try {
      const data = await loadHeldOrder(id);
      if (data) {
        setHeldOrderId(id);
        setOrderType(data.order_type);
        setSelectedTable(data.table_id ? String(data.table_id) : null);
        setSelectedSteward(data.steward_id ? String(data.steward_id) : null);
        setSelectedCustomer(String(data.customer_id));
        
        const restoredCart = data.items.map((it: any) => ({
          id: it.item_id,
          description: it.description,
          item_type: it.item_type,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          discount: Number(it.discount),
          held_item_id: it.id // Track this if needed
        }));
        setCart(restoredCart);
        
        // Re-calculate bill discount if any
        // (For now we assume no bill discount was saved or we handle it via totals)
        setBillDiscountValue(0); 

        toast({ title: "Order Loaded", description: `Recallled Bill #${id}` });
      }
    } catch (err: any) {
      toast({ title: "Load Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToReservation = async (resId: number, items: any[]) => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
        const response = await apiHelper(`/api/hotel/items-bulk/${resId}`, {
            method: "POST",
            body: JSON.stringify({ items: items })
        });
        if (response.ok) {
            toast({ title: "Success", description: "Items added to guest reservation bill." });
            setReservationDialogOpen(false);
        } else {
            const data = await response.json();
            throw new Error(data.message || "Transfer failed");
        }
    } catch (err: any) {
        toast({ title: "Transfer Error", description: err.message, variant: "destructive" });
    } finally {
        setSubmitting(false);
    }
  };

  const value = {
      inventory, systemTaxes, locations, customers, banks, bankBranches, company, loading, submitting, setSubmitting,
      cart, selectedLocation, setSelectedLocation, selectedCustomer, setSelectedCustomer, 
      billDiscountValue, setBillDiscountValue, billDiscountType, setBillDiscountType,
      billDiscountDialogOpen, setBillDiscountDialogOpen,
      orderType, setOrderType, orderTypeDialogOpen, setOrderTypeDialogOpen,
      selectedTable, setSelectedTable, selectedSteward, setSelectedSteward,
      tables, setTables, stewards, setStewards,
      heldOrderId, setHeldOrderId, heldOrders, refreshHeldOrders,
      addToCartWithQty, updateCartLine, removeCartLine, handleCheckoutProcess, holdPOSBill, loadPOSBill, reloadData,
      totals, theme, toggleTheme, searchQuery, setSearchQuery,
      returnDialogOpen, setReturnDialogOpen, refundDialogOpen, setRefundDialogOpen, ledgerDialogOpen, setLedgerDialogOpen,
      pendingInvoicesDialogOpen, setPendingInvoicesDialogOpen,
      activeMobileTab, setActiveMobileTab,
      productModalOpen, setProductModalOpen, selectedProduct, setSelectedProduct,
      addCustomerOpen, setAddCustomerOpen, addingCustomer, setAddingCustomer, newCustomer, setNewCustomer, handleQuickAddCustomer,
      checkoutOpen, setCheckoutOpen, openCheckoutDialog,
      dayLedger, setDayLedger, loadingLedger, setLoadingLedger,
      guideModalOpen, setGuideModalOpen,
      refreshInventory, refreshCustomers,
      vKeyboardEnabled, setVKeyboardEnabled, vKeyboardActiveInput, setVKeyboardActiveInput,
      collections, selectedCollectionId, setSelectedCollectionId,
      selectedBankId, setSelectedBankId, selectedCardCategory, setSelectedCardCategory,
      // Promotion State
      eligiblePromotions, setEligiblePromotions, appliedPromotion, setAppliedPromotion: updateAppliedPromotion, validatePromotions,
      isPromotionPromptOpen, setIsPromotionPromptOpen,
      promotionsPromptDismissed, setPromotionsPromptDismissed,
      checkoutIntentActive, setCheckoutIntentActive,
      claimPromotionRewards,
      setTableManagementOpen,
      setBankBranches,
      printSelectionOpen,
      setPrintSelectionOpen,
      lastInvoiceId,
      setLastInvoiceId,
      reservationDialogOpen,
      setReservationDialogOpen,
      handleAddToReservation
    };
  
    return (
      <POSContext.Provider value={value}>
        {children}
      </POSContext.Provider>
    );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
};

"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { loadHeldOrder, fetchCompany, fetchTaxes } from "@/lib/api";
import { Loader2 } from "lucide-react";

function GuestReceiptContent() {
  const params = useParams();
  const id = Number(params.id);
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === '1';
  const taxInclusive = searchParams.get('tax_inclusive') === '1';

  const [order, setOrder] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderData, companyData, systemTaxesData] = await Promise.all([
          loadHeldOrder(id),
          fetchCompany().catch(() => null),
          fetchTaxes('', { all: true }).catch(() => [])
        ]);

        // Dynamically compute the tax breakdown based on system taxes
        const taxableAmount = Math.max(0, Number(orderData.subtotal || 0) - Number(orderData.discount_total || 0));
        let currentBase = taxableAmount;
        let taxSum = 0;
        const appliedTaxes: any[] = [];
        const sortedTaxes = [...(Array.isArray(systemTaxesData) ? systemTaxesData : [])].sort((a: any, b: any) => a.sort_order - b.sort_order);
        
        sortedTaxes.forEach((tax: any) => {
          const applyTo = tax.apply_on === 'base_plus_previous' ? currentBase : taxableAmount;
          const taxAmt = applyTo * (Number(tax.rate_percent) / 100);
          taxSum += taxAmt;
          appliedTaxes.push({ 
            tax_name: tax.name, 
            tax_code: tax.code, 
            rate_percent: tax.rate_percent, 
            amount: taxAmt 
          });
          currentBase += taxAmt;
        });

        // Attach computed taxes to order data for rendering
        orderData.applied_taxes = appliedTaxes;

        setOrder(orderData);
        setCompany(companyData);
      } catch (error) {
        console.error("Failed to load held order data", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  useEffect(() => {
    if (autoPrint && !loading && order && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, loading, order, id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!order || !order.items || order.items.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-8 text-center">
        <div className="mb-4 text-gray-400">
           <svg className="w-16 h-16 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-700">No Bill Found</h2>
        <p className="text-gray-500 mt-2 max-w-xs">The requested held bill could not be found.</p>
        <button 
          onClick={() => window.close()}
          className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium border border-gray-200"
        >
          Close Window
        </button>
      </div>
    );
  }

  const fmt = (n: number | string) => Number(n).toFixed(2);

  return (
    <>
      {/* Thermal Print CSS */}
      <style>{`
        @page {
          size: 80mm auto;
          margin: 4mm 3mm;
        }
        @media print {
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: white; font-family: 'Courier New', Courier, monospace; }
        .receipt { width: 100%; max-width: 80mm; margin: 0 auto; padding: 4px 0; font-size: 11px; color: #000; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .hr-solid { border: none; border-top: 1px solid #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; margin: 1px 0; }
        .row-item { display: flex; flex-direction: column; margin: 3px 0; }
        .row-item .item-name { font-weight: bold; word-break: break-word; text-transform: uppercase; }
        .row-item .item-detail { display: flex; justify-content: space-between; }
        .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin: 2px 0; }
        .grand-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin: 4px 0; }
        .shop-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; text-transform: uppercase; }
        .tag { font-size: 10px; color: #333; }
        
        .kot-header { background: #222; color: #fff; padding: 8px 10px; margin-bottom: 12px; border-radius: 4px; text-align: center; }
        .kot-title { font-size: 20px; font-weight: 900; letter-spacing: 1px; }

        .preview-wrap { min-height: 100vh; background: #e5e7eb; display: flex; align-items: flex-start; justify-content: center; padding: 24px; }
        .preview-paper { background: white; width: 80mm; padding: 6px 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); min-height: 200px; }
      `}</style>

      {/* Screen Preview Wrapper (hidden on print) */}
      <div className="no-print preview-wrap">
        <div>
          <div className="mb-6 text-center">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">Order Preview</span>
              <h1 className="text-2xl font-black text-gray-900">Guest Receipt</h1>
          </div>
          <div className="preview-paper" id="receipt-preview">
            <div className="receipt">
              <ReceiptBody order={order} company={company} fmt={fmt} taxInclusive={taxInclusive} />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => window.print()}
              style={{ background: '#111827', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}
            >
              🖨 Print Receipt
            </button>
            <button
              onClick={() => window.close()}
              style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '10px 28px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Print-only version (no wrapper) */}
      <div style={{ display: 'none' }} className="print-only">
        <div className="receipt">
          <ReceiptBody order={order} company={company} fmt={fmt} taxInclusive={taxInclusive} />
        </div>
      </div>

      <style>{`
        @media print {
          .preview-wrap { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>
    </>
  );
}

function ReceiptBody({ order, company, fmt, taxInclusive }: any) {
  const totalTaxPercent = (order.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.rate_percent || 0), 0);

  const getShortTaxName = (name: string) => {
    const upper = (name || "").toUpperCase();
    if (upper.includes("SOCIAL SECURITY CONTRIBUTION LEVY")) return "SSCL";
    if (upper.includes("VALUE ADDED TAX")) return "VAT";
    return name;
  };

  return (
    <>
      <div className="center kot-header">
        <div className="kot-title">GUEST RECEIPT</div>
        <div style={{ fontSize: '10px', marginTop: '4px', textTransform: 'uppercase' }}>Proforma Invoice</div>
      </div>

      {/* Store Header */}
      <div className="center" style={{ marginBottom: '8px' }}>
        {company?.name && <div className="shop-name">{company.name}</div>}
        {company?.phone && <div className="tag">Tel: {company.phone}</div>}
        {company?.address && <div className="tag">{company.address}</div>}
      </div>

      <hr className="hr-solid" />

      {/* Order Meta */}
      <div className="row"><span>Bill#</span><span className="bold">{order.id}</span></div>
      <div className="row"><span>Date</span><span>{new Date(order.created_at || Date.now()).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
      <div className="row"><span>Customer</span><span>{order.customer_name || 'Walk-in'}</span></div>
      <div className="row">
        <span>Type</span>
        <span style={{ textTransform: 'capitalize' }}>{order.order_type?.replace('_', ' ') || 'Retail'}</span>
      </div>
      
      {/* Dine-In Extra Meta */}
      {order.order_type === 'dine_in' && (
        <div style={{ marginTop: '2px', padding: '2px 0' }}>
          {order.table_name && <div className="row"><span>Table</span><span className="bold">{order.table_name}</span></div>}
          {order.steward_name && <div className="row"><span>Steward</span><span>{order.steward_name}</span></div>}
        </div>
      )}

      <hr className="hr" />

      {/* Items */}
      <div className="bold" style={{ marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Items</div>
      {(order.items || []).map((item: any, idx: number) => {
        const lineTotal = (Number(item.unit_price) * Number(item.quantity)) - (Number(item.discount) * Number(item.quantity));
        const isFree = lineTotal === 0 && Number(item.quantity) > 0;
        
        let displayUnitPrice = Number(item.unit_price) - Number(item.discount);
        let displayLineTotal = lineTotal;
        
        if (taxInclusive && totalTaxPercent > 0) {
          displayUnitPrice = displayUnitPrice * (1 + totalTaxPercent / 100);
          displayLineTotal = displayLineTotal * (1 + totalTaxPercent / 100);
        }

        const unitDisplay = `@ LKR ${displayUnitPrice.toFixed(2)}`;

        return (
          <div className="row-item" key={idx}>
            <div className="item-name">
              {item.description || item.item_name}
              {isFree && <span style={{ marginLeft: '4px', fontSize: '8px', fontWeight: '900', background: '#000', color: '#fff', padding: '1px 3px', borderRadius: '2px', textTransform: 'uppercase' }}>Gift</span>}
            </div>
            <div className="item-detail">
              <span>{item.quantity} × {unitDisplay}</span>
              <span className="bold">{isFree ? 'LKR 0.00' : `LKR ${fmt(displayLineTotal)}`}</span>
            </div>
          </div>
        );
      })}

      <hr className="hr" />
      
      {/* Totals */}
      {taxInclusive ? (
        <>
          {Number(order.discount_total || 0) > 0 && (
            <div className="row">
              <span>Savings / Discount</span>
              <span className="bold">-LKR {fmt(order.discount_total)}</span>
            </div>
          )}
          <div className="row"><span>Total (Tax Inclusive)</span><span>LKR {fmt(order.grand_total)}</span></div>
        </>
      ) : (
        <>
          <div className="row"><span>Subtotal</span><span>LKR {fmt(order.subtotal || 0)}</span></div>
          {Number(order.discount_total || 0) > 0 && (
            <div className="row">
              <span>Discount</span>
              <span>-LKR {fmt(order.discount_total)}</span>
            </div>
          )}
          {(order.applied_taxes || []).map((tax: any, idx: number) => (
            <div className="row" key={idx}>
              <span>{getShortTaxName(tax.tax_code || tax.tax_name)}{Number(tax.rate_percent) > 0 ? ` (${tax.rate_percent}%)` : ''}</span>
              <span>LKR {fmt(tax.amount || 0)}</span>
            </div>
          ))}
          {/* Note: held orders usually don't have shipping fee explicitly in the UI yet, but just in case */}
          {Number(order.shipping_fee) > 0 && (
            <div className="row">
              <span>Shipping</span>
              <span>LKR {fmt(order.shipping_fee)}</span>
            </div>
          )}
        </>
      )}

      <hr className="hr-solid" />

      <div className="grand-total">
        <span>TOTAL</span>
        <span>LKR {fmt(order.grand_total || 0)}</span>
      </div>

      <hr className="hr" />

      {/* Footer */}
      <div className="center tag" style={{ marginTop: '12px' }}>
        <div style={{ fontWeight: 'bold' }}>This is not a final tax invoice.</div>
        <div style={{ marginTop: '2px' }}>Please present this bill to the cashier.</div>
        <div style={{ marginTop: '10px', fontSize: '9px', letterSpacing: '1px' }}>* * * * * * * * * *</div>
      </div>
    </>
  );
}

export default function GuestReceiptPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <GuestReceiptContent />
    </Suspense>
  );
}

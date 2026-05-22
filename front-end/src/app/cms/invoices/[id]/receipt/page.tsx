"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetchInvoiceDetails, fetchCompany } from "@/lib/api";
import { Loader2 } from "lucide-react";

function ReceiptContent() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === '1';
  const taxInclusive = searchParams.get('tax_inclusive') === '1';

  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoiceData, companyData] = await Promise.all([
          fetchInvoiceDetails(id),
          fetchCompany().catch(() => null)
        ]);
        setInvoice(invoiceData);
        setCompany(companyData);
      } catch (error) {
        console.error("Failed to load receipt data", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  useEffect(() => {
    if (autoPrint && !loading && invoice && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, loading, invoice]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500 font-bold">Invoice not found.</p>
      </div>
    );
  }

  const balance = Number(invoice.grand_total) - Number(invoice.paid_amount || 0);
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
        .row-item .item-name { font-weight: bold; word-break: break-word; }
        .row-item .item-detail { display: flex; justify-content: space-between; }
        .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin: 2px 0; }
        .grand-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin: 4px 0; }
        .shop-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
        .tag { font-size: 10px; color: #333; }
        .paid-badge { display: inline-block; border: 1.5px solid #000; padding: 2px 8px; font-weight: bold; font-size: 13px; letter-spacing: 2px; margin-top: 4px; }
        .preview-wrap { min-height: 100vh; background: #e5e7eb; display: flex; align-items: flex-start; justify-content: center; padding: 24px; }
        .preview-paper { background: white; width: 80mm; padding: 6px 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); min-height: 200px; }
      `}</style>

      {/* Screen Preview Wrapper (hidden on print) */}
      <div className="no-print preview-wrap">
        <div>
          <div className="preview-paper" id="receipt-preview">
            <div className="receipt">
              <ReceiptBody invoice={invoice} company={company} balance={balance} fmt={fmt} taxInclusive={taxInclusive} />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => window.print()}
              style={{ background: '#1d4ed8', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}
            >
              🖨 Print Receipt
            </button>
            <button
              onClick={() => window.close()}
              style={{ background: '#e5e7eb', color: '#111', border: 'none', padding: '10px 28px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Print-only version (no wrapper) */}
      <div style={{ display: 'none' }} className="print-only">
        <div className="receipt">
          <ReceiptBody invoice={invoice} company={company} balance={balance} fmt={fmt} taxInclusive={taxInclusive} />
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

function ReceiptBody({ invoice, company, balance, fmt, taxInclusive }: any) {
  const totalTaxPercent = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.rate_percent || 0), 0);

  const getShortTaxName = (name: string) => {
    const upper = (name || "").toUpperCase();
    if (upper.includes("SOCIAL SECURITY CONTRIBUTION LEVY")) return "SSCL";
    if (upper.includes("VALUE ADDED TAX")) return "VAT";
    return name;
  };

  return (
    <>
      {/* Store Header */}
      <div className="center">
        {company?.name && <div className="shop-name">{company.name}</div>}
        {invoice.location_name && <div className="tag">{invoice.location_name}</div>}
        {company?.phone && <div className="tag">Tel: {company.phone}</div>}
        {company?.address && <div className="tag">{company.address}</div>}
      </div>

      <hr className="hr-solid" />

      {/* Invoice Meta */}
      <div className="row"><span>Invoice#</span><span className="bold">{invoice.invoice_no}</span></div>
      <div className="row"><span>Date</span><span>{new Date(invoice.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
      {invoice.customer_name && <div className="row"><span>Customer</span><span>{invoice.customer_name}</span></div>}
      
      {/* Dine-In Extra Meta */}
      {invoice.order_type === 'dine_in' && (
        <div style={{ marginTop: '2px', padding: '2px 0' }}>
          {invoice.table_name && <div className="row"><span>Table</span><span className="bold">{invoice.table_name}</span></div>}
          {invoice.steward_name && <div className="row"><span>Steward</span><span>{invoice.steward_name}</span></div>}
        </div>
      )}

      <hr className="hr" />

      {/* Items */}
      <div className="bold" style={{ marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Items</div>
      {(invoice.items || []).map((item: any, idx: number) => {
        const lineTotal = Number(item.line_total);
        const isFree = Number(item.discount) >= Number(item.unit_price) && Number(item.unit_price) > 0;
        
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
          {(() => {
            const taxSum = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
            const inferredDiscount = Number(invoice.subtotal) + taxSum - Number(invoice.grand_total);
            const actualDiscount = Number(invoice.discount_total) > 0 ? Number(invoice.discount_total) : (inferredDiscount > 0.01 ? inferredDiscount : 0);
            
            if (actualDiscount > 0 || invoice.applied_promotion_name) {
              return (
                <div className="row">
                  <span>Savings / Discount {invoice.applied_promotion_name ? `(${invoice.applied_promotion_name})` : ''}</span>
                  <span className="bold">-LKR {fmt(actualDiscount)}</span>
                </div>
              );
            }
            return null;
          })()}
          <div className="row"><span>Total (Tax Inclusive)</span><span>LKR {fmt(invoice.grand_total)}</span></div>
          <div className="row tag" style={{ fontSize: '9px', fontStyle: 'italic' }}>
            <span>Includes Total Taxes:</span>
            <span>LKR {fmt((invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0))}</span>
          </div>
        </>
      ) : (
        <>
          <div className="row"><span>Subtotal</span><span>LKR {fmt(invoice.subtotal)}</span></div>
          {(() => {
            const taxSum = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
            const inferredDiscount = Number(invoice.subtotal) + taxSum - Number(invoice.grand_total);
            const actualDiscount = Number(invoice.discount_total) > 0 ? Number(invoice.discount_total) : (inferredDiscount > 0.01 ? inferredDiscount : 0);
            
            if (actualDiscount > 0 || invoice.applied_promotion_name) {
              return (
                <div className="row">
                  <span>Discount {invoice.applied_promotion_name ? `(${invoice.applied_promotion_name})` : ''}</span>
                  <span>-LKR {fmt(actualDiscount)}</span>
                </div>
              );
            }
            return null;
          })()}
          {(invoice.applied_taxes || []).map((tax: any, idx: number) => (
            <div className="row" key={idx}>
              <span>{getShortTaxName(tax.tax_code || tax.tax_name)}{Number(tax.rate_percent) > 0 ? ` (${tax.rate_percent}%)` : ''}</span>
              <span>LKR {fmt(tax.amount)}</span>
            </div>
          ))}
          {Number(invoice.shipping_fee) > 0 && (
            <div className="row">
              <span>Shipping ({invoice.shipping_provider_name || 'Standard'})</span>
              <span>LKR {fmt(invoice.shipping_fee)}</span>
            </div>
          )}
        </>
      )}

      <hr className="hr-solid" />

      <div className="grand-total">
        <span>TOTAL</span>
        <span>LKR {fmt(invoice.grand_total)}</span>
      </div>

      {Number(invoice.paid_amount) > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div className="bold" style={{ fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px', borderBottom: '1px solid #eee' }}>Payment Details</div>
          {(invoice.payments || []).map((p: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              <div className="row">
                <span>{p.payment_method}</span>
                <span className="bold">LKR {fmt(p.amount)}</span>
              </div>
              {(p.payment_method === 'Card' || p.card_bank_name) && (
                <div className="tag" style={{ fontSize: '9px', textAlign: 'right', opacity: 0.8 }}>
                  <div>{p.card_bank_name} {p.card_category ? `(${p.card_category})` : ''}</div>
                  <div>{p.card_type} {p.card_last4 ? `**** ${p.card_last4}` : ''} {p.card_auth_code ? `| Auth: ${p.card_auth_code}` : ''}</div>
                </div>
              )}
              {p.payment_method === 'Cheque' && (
                <div className="tag" style={{ fontSize: '9px', textAlign: 'right', opacity: 0.8 }}>
                  <div>{p.cheque_bank_name} {p.cheque_branch_name ? `(${p.cheque_branch_name})` : ''}</div>
                  <div>No: #{p.cheque_no_last6} | Date: {p.cheque_date}</div>
                </div>
              )}
              {p.reference_no && (
                <div className="tag" style={{ fontSize: '9px', textAlign: 'right', opacity: 0.8 }}>
                  Ref: {p.reference_no}
                </div>
              )}
            </div>
          ))}
          <div className="row" style={{ borderTop: '1px dashed #000', paddingTop: '2px', marginTop: '2px' }}>
            <span>Total Paid</span>
            <span className="bold">LKR {fmt(invoice.paid_amount)}</span>
          </div>
          {balance > 0.005 && <div className="row bold"><span>Balance Due</span><span>LKR {fmt(balance)}</span></div>}
          {balance <= 0.005 && <div className="center" style={{ marginTop: '6px' }}><span className="paid-badge">✓ PAID</span></div>}
        </div>
      )}

      <hr className="hr" />

      {/* Footer */}
      <div className="center tag" style={{ marginTop: '8px' }}>
        <div>Thank you for your purchase!</div>
        <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 'bold' }}>BizFlow ERP System</div>
        <div style={{ marginTop: '2px', fontSize: '8px', opacity: 0.8 }}>Developed by Nebulync.com</div>
        <div style={{ marginTop: '10px', fontSize: '9px', letterSpacing: '1px' }}>* * * * * * * * * *</div>
      </div>
    </>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <ReceiptContent />
    </Suspense>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/useCartStore';
import { CheckCircle2, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import html2canvas from 'html2canvas';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/rapair-management/server';
const LOC_DEFAULT = import.meta.env.VITE_DEFAULT_LOCATION_ID ?? '1';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

export default function Checkout() {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const { items, totalAmount, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess,    setIsSuccess]    = useState(false);
  const [orderNo,      setOrderNo]      = useState('');

  const [form, setForm] = useState({
    name:                '',
    phone:               '',
    roomNumber:          '',
    specialInstructions: '',
  });

  const locationId = new URLSearchParams(window.location.search).get('locationId') ?? LOC_DEFAULT;

  const handleDownloadReceipt = () => {
    const el = document.getElementById('receipt-card');
    if (!el) return;
    html2canvas(el, { scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Receipt-${orderNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="cart-empty">
        <p style={{ fontWeight: 700 }}>{t('cart_empty_text')}</p>
        <Link to={`/${language}/dining`} className="btn-outline">{t('back_to_menu')}</Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="success-screen" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div id="receipt-card" style={{ padding: '40px 24px', background: '#ffffff', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', marginBottom: 24, textAlign: 'center', width: '100%', maxWidth: 420, boxSizing: 'border-box' }}>
            <div className="success-icon" style={{ margin: '0 auto 24px', display: 'flex', justifyContent: 'center', width: 80, height: 80, background: '#ecfdf5', borderRadius: '50%', alignItems: 'center' }}>
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 26, margin: '0 0 12px', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{t('request_received')}</h2>
            
            <div style={{ background: '#f8fafc', padding: '20px 16px', borderRadius: 16, margin: '24px 0', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Order Reference</p>
              <p style={{ margin: 0, fontSize: 'clamp(20px, 6vw, 26px)', color: '#0f172a', fontWeight: 800, fontFamily: 'system-ui, -apple-system, sans-serif', wordBreak: 'break-all', lineHeight: 1.2 }}>{orderNo || 'PENDING'}</p>
            </div>
            
            <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 auto 24px', fontSize: 15, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Thank you, <strong style={{ color: '#0f172a' }}>{form.name}</strong>! Your order for Room{' '}
              <strong style={{ color: '#0f172a' }}>{form.roomNumber}</strong> has been sent. Our staff will process it shortly.
            </p>
            
            <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600, background: '#fef2f2', padding: '12px', borderRadius: 12, border: '1px solid #fecaca' }}>
              ⚠ Please save this reference number or take a screenshot.
            </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 420 }}>
          <button onClick={handleDownloadReceipt} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', width: '100%', height: 56, fontSize: 16, fontWeight: 600, borderRadius: 16, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
            <Download size={20} /> Download Receipt
          </button>

          <Link to={`/${language}/home`} className="btn-outline" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 56, fontSize: 16, fontWeight: 600, borderRadius: 16, border: '2px solid #e2e8f0', color: '#475569', textDecoration: 'none' }}>
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      type:                'room_service_request',
      status:              'pending',
      locationId,
      roomNumber:           form.roomNumber,
      guestName:            form.name,
      phoneNumber:          form.phone,
      specialInstructions:  form.specialInstructions,
      items:                items.map((i) => ({ productId: i.id, qty: i.quantity })),
      totalAmount:          totalAmount(),
    };

    console.log('Kiosk request payload:', payload);

    try {
      const res = await fetch(`${API_URL}/api/kiosk/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'X-API-Key': API_KEY } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit order');
      }

      const responseData = await res.json();
      if (responseData.order_no) {
        setOrderNo(responseData.order_no);
      }

      setIsSuccess(true);
      clearCart();
    } catch (err: any) {
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Link
        to="/cart"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 14, fontWeight: 600, color: 'var(--text-2)',
          textDecoration: 'none', marginBottom: 20,
        }}
      >
        <ArrowLeft size={16} /> Back to cart
      </Link>

      <h1 className="page-title">{t('guest_details')}</h1>
      <p className="page-subtitle">{t('fill_details')}</p>

      {/* Order Summary — shown at top */}
      <div className="order-summary" style={{ marginBottom: 20 }}>
        {items.map((item) => (
          <div key={item.id} className="summary-row">
            <span>{item.name} × {item.quantity}</span>
            <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="summary-row total">
          <span>Total</span>
          <span className="total-price">Rs. {totalAmount().toLocaleString()}</span>
        </div>
      </div>


      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">{t('room_number_req')}</label>
          <input
            type="text"
            className="form-control"
            required
            placeholder="e.g. 101"
            value={form.roomNumber}
            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('guest_name_req')}</label>
          <input
            type="text"
            className="form-control"
            required
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('phone_req')}</label>
          <input
            type="tel"
            className="form-control"
            required
            placeholder="07XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('special_instructions')}</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Any allergies or dietary requirements?"
            value={form.specialInstructions}
            onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginBottom: 48 }}>
          {isSubmitting ? 'Sending Request…' : 'Send Order Request'}
        </button>
      </form>
    </>
  );
}

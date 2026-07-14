import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { ArrowLeft, X, Calendar, Clock, Users, Sparkles, ChevronRight, Download } from 'lucide-react';
import { getDiscountedPrice } from '../store/useCartStore';
import html2canvas from 'html2canvas';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/rapair-management/server';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

export default function ExperienceBooking() {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingNo, setBookingNo] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    room_number: '',
    guest_name: '',
    pax_count: 1,
    preferred_date: today,
    preferred_time: '',
    notes: ''
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const headers: HeadersInit = API_KEY ? { 'X-API-Key': API_KEY } : {};
        const pRes = await fetch(
          `${API_URL}/api/publicitem/get/${slug}?location_id=${localStorage.getItem('kiosk_location_id') || 1}`,
          { headers }
        );
        if (!pRes.ok) throw new Error('Experience not found');
        const pBody = await pRes.json();
        setProduct(pBody.data || pBody);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const handleDownloadReceipt = () => {
    const el = document.getElementById('booking-receipt-card');
    if (!el) return;
    html2canvas(el, { scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Booking-${bookingNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const preferred_date_time = `${form.preferred_date} ${form.preferred_time}:00`;
    const discountPrice = getDiscountedPrice({ ...product, discount_value: Number(product.discount_value || 0) });
    const total_amount = discountPrice * form.pax_count;
    const payload = {
      room_number: form.room_number,
      guest_name: form.guest_name,
      experience_id: product.id,
      pax_count: form.pax_count,
      preferred_date_time,
      total_amount,
      notes: form.notes
    };
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const res = await fetch(`${API_URL}/api/kiosk/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit booking');

      const responseData = await res.json();
      if (responseData.booking_no) {
        setBookingNo(responseData.booking_no);
      }

      setSuccess(true);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>{t('loading_experience')}</p>
      </div>
    );
  }

  if (error || !product) return <div className="error-center" style={{ color: 'red' }}>{error || 'Not found'}</div>;

  const discountPrice = getDiscountedPrice({ ...product, discount_value: Number(product.discount_value || 0) });

  if (success) {
    return (
      <div className="exp-success-page" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div id="booking-receipt-card" style={{ padding: '40px 24px', background: '#ffffff', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', marginBottom: 24, textAlign: 'center', width: '100%', maxWidth: 420, boxSizing: 'border-box' }}>
          <div className="exp-success-icon" style={{ fontSize: 48, marginBottom: 16, display: 'flex', justifyContent: 'center', width: 80, height: 80, background: '#fef3c7', borderRadius: '50%', alignItems: 'center', margin: '0 auto 24px' }}>✨</div>
          <h1 style={{ fontWeight: 800, fontSize: 26, margin: '0 0 12px', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{t('booking_confirmed')}</h1>
          
          <div style={{ background: '#f8fafc', padding: '20px 16px', borderRadius: 16, margin: '24px 0', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Booking Reference</p>
            <p style={{ margin: 0, fontSize: 'clamp(20px, 6vw, 26px)', color: '#0f172a', fontWeight: 800, fontFamily: 'system-ui, -apple-system, sans-serif', wordBreak: 'break-all', lineHeight: 1.2 }}>{bookingNo || 'PENDING'}</p>
          </div>

          <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 auto 16px', fontSize: 15, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {(t('booking_request_for') as string)} <strong style={{ color: '#0f172a' }}>{(t(product.name, { defaultValue: product.name }) as string)}</strong> {(t('has_been_received') as string)}
          </p>
          <p className="exp-success-sub" style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{t('contact_shortly')}</p>

          <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600, background: '#fef2f2', padding: '12px', borderRadius: 12, border: '1px solid #fecaca' }}>
            ⚠ Please save this reference number or take a screenshot.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 420 }}>
          <button onClick={handleDownloadReceipt} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', width: '100%', height: 56, fontSize: 16, fontWeight: 600, borderRadius: 16, boxShadow: '0 4px 14px rgba(17, 24, 39, 0.3)', background: '#111827' }}>
            <Download size={20} /> Download Receipt
          </button>
          <button className="btn-outline" onClick={() => navigate(`/${language}/experiences`)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 56, fontSize: 16, fontWeight: 600, borderRadius: 16, border: '2px solid #e2e8f0', color: '#475569' }}>
            Explore More Experiences
          </button>
        </div>
      </div>
    );
  }

  // The inline booking form (used both in desktop sidebar & modal)
  const renderBookingForm = () => (
    <form onSubmit={handleSubmit} className="exp-booking-form">
      <div className="form-group">
        <label className="form-label">{t('room_number_req')}</label>
        <input className="form-control" required type="text" placeholder="e.g. 101"
          value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">{t('guest_name_req')}</label>
        <input className="form-control" required type="text" placeholder="Your Name"
          value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Date *</label>
          <input className="form-control" required type="date"
            value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="form-group">
          <label className="form-label"><Clock size={13} style={{ display: 'inline', marginRight: 4 }} />Time *</label>
          <input className="form-control" required type="time"
            value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label"><Users size={13} style={{ display: 'inline', marginRight: 4 }} />Persons *</label>
        <input className="form-control" required type="number" min="1"
          value={form.pax_count} onChange={e => setForm({ ...form, pax_count: parseInt(e.target.value) || 1 })} />
      </div>
      <div className="form-group">
        <label className="form-label">{t('special_requests')}</label>
        <textarea className="form-control" rows={3} placeholder="Any special requirements..."
          value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>

      {discountPrice > 0 && (
        <div className="exp-modal-summary">
          <span>{t('estimated_total')}</span>
          <span className="exp-modal-total">Rs. {(discountPrice * form.pax_count).toLocaleString()}</span>
        </div>
      )}

      <button type="submit" className="btn-primary" style={{ height: 52, fontSize: 16, width: '100%', marginTop: 8 }} disabled={submitting}>
        {submitting ? 'Confirming…' : 'Confirm Booking'}
      </button>
    </form>
  );

  return (
    <div className="exp-detail-page">
      {/* Top Header */}
      <div className="exp-detail-header">
        <button className="exp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="exp-detail-header-title">{product.name}</span>
      </div>

      {/* Desktop: side-by-side layout | Mobile: single column */}
      <div className="exp-desktop-layout">

        {/* Left: Content */}
        <div className="exp-content-col">
          {/* Hero */}
          {product.kiosk_video_url ? (
            <div className="exp-hero-video">
              <iframe src={product.kiosk_video_url.replace('watch?v=', 'embed/')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          ) : product.image_url ? (
            <div className="exp-hero-img">
              <img src={product.image_url} alt={product.name} />
            </div>
          ) : (
            <div className="exp-hero-placeholder"><Sparkles size={48} /></div>
          )}

          {/* Title */}
          <div className="exp-detail-body">
            <div className="exp-detail-title-row">
              <div>
                <h1 className="exp-detail-name">{product.name}</h1>
                {product.category_name && (
                  <span className="exp-detail-category">{product.category_name}</span>
                )}
              </div>
            </div>

            {/* Rich HTML Content */}
            {product.kiosk_content_html && (
              <div className="kiosk-html-content exp-html-content"
                dangerouslySetInnerHTML={{ __html: product.kiosk_content_html }} />
            )}

            {/* Mobile bottom spacer */}
            <div className="exp-mobile-spacer" />
          </div>
        </div>

        {/* Right: Desktop booking sidebar */}
        <div className="exp-sidebar-col">
          <div className="exp-sidebar-card">
            <div className="exp-sidebar-price">
              {discountPrice === 0 ? (
                <span className="exp-free-badge">{t('complimentary')}</span>
              ) : (
                <>
                  <span className="exp-sidebar-price-label">{t('from')}</span>
                  <span className="exp-sidebar-price-val">Rs. {discountPrice.toLocaleString()}</span>
                  <span className="exp-sidebar-price-unit">per person</span>
                </>
              )}
            </div>
            {renderBookingForm()}
          </div>
        </div>

      </div>

      {/* Mobile only: Sticky Book Now button */}
      <div className="exp-sticky-book">
        <button className="btn-primary exp-book-btn" onClick={() => setShowModal(true)}>
          {discountPrice === 0
            ? <>{t('book_free')} <ChevronRight size={18} /></>
            : <>{t('book')} · Rs. {discountPrice.toLocaleString()}/person <ChevronRight size={18} /></>
          }
        </button>
      </div>

      {/* Mobile Modal */}
      {showModal && (
        <div className="exp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="exp-modal" onClick={e => e.stopPropagation()}>
            <div className="exp-modal-header">
              <div>
                <h2 className="exp-modal-title">{t('book_experience')}</h2>
                <p className="exp-modal-sub">{product.name}</p>
              </div>
              <button className="exp-modal-close" onClick={() => setShowModal(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="exp-modal-body">
              {renderBookingForm()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

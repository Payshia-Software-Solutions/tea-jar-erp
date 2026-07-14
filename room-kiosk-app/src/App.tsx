import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UtensilsCrossed, ShoppingBag, Home as HomeIcon, Loader2, Globe } from 'lucide-react';
import { useCartStore } from './store/useCartStore';
import { useLanguageStore } from './store/useLanguageStore';
import { useTranslation } from 'react-i18next';
import { useParams, Outlet, Navigate } from 'react-router-dom';

import HomePage from './components/Home';
import Menu from './components/Menu';
import Experiences from './components/Experiences';
import ExperienceBooking from './components/ExperienceBooking';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import CartPanel from './components/CartPanel';
import ProductDetail from './components/ProductDetail';
import LanguageSelect from './components/LanguageSelect';

const API_KEY = import.meta.env.VITE_API_KEY ?? '';

function LanguageSyncWrapper() {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
      setLanguage(lang);
    }
  }, [lang, i18n, setLanguage]);

  return <Outlet />;
}

function AppInner() {
  const { t } = useTranslation();
  const items       = useCartStore((state) => state.items);
  const language    = useLanguageStore((s) => s.language);
  const cartCount   = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const [cartOpen, setCartOpen]       = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [locationName, setLocationName] = useState('Order Products');
  const [kioskSettings, setKioskSettings] = useState<any>(null);
  const location = useLocation();
  const isCheckoutOrCart = location.pathname.includes('/checkout') || location.pathname.includes('/cart');
  const isLangScreen = location.pathname === '/' || /^\/[a-z]{2}$/.test(location.pathname);
  const isHome = location.pathname.endsWith('/home');
  const isExperiences = location.pathname.includes('/experiences');

  // Synchronously update localStorage before initial render so children get the correct value
  const params = new URLSearchParams(window.location.search);
  const resetLoc = params.get('reset');
  if (resetLoc === 'true' || resetLoc === '1') {
    localStorage.removeItem('kiosk_location_id');
    window.location.href = window.location.pathname; // strip query params
    return null; // Don't render until reload
  }

  const urlLoc = params.get('loc') || params.get('locationId');
  if (urlLoc && urlLoc !== localStorage.getItem('kiosk_location_id')) {
    localStorage.setItem('kiosk_location_id', urlLoc);
  }

  const [selectedLocation, setSelectedLocation] = useState(localStorage.getItem('kiosk_location_id'));
  const [locations, setLocations] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (urlLoc) {
      // Optional: clean the URL so the guest doesn't see it
      window.history.replaceState({}, '', window.location.pathname);
      
      // If we are currently rendering children and they depend on a hook that might be stale,
      // forcing a reload ensures all children components reset with the new location.
      window.location.reload();
    } else if (!localStorage.getItem('kiosk_location_id')) {
      // Fetch locations if none selected
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/rapair-management/server';
      fetch(`${API_URL}/api/kiosk/locations`, { headers: { 'X-API-Key': API_KEY } })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLocations(data);
          } else {
            setFetchError(JSON.stringify(data));
          }
        })
        .catch((e) => setFetchError(e.message || String(e)));
    }
  }, [urlLoc]);

  // Fetch location name from API
  useEffect(() => {
    if (!API_KEY) return;
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/rapair-management/server';
    const locId = localStorage.getItem('kiosk_location_id') || import.meta.env.VITE_DEFAULT_LOCATION_ID || '1';
    
    fetch(`${API_URL}/api/publiclocation/settings?location_id=${locId}`, {
      headers: { 'X-API-Key': API_KEY },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((body) => {
        const name = body?.data?.location_name ?? body?.location_name;
        if (name) setLocationName(name);
        if (body?.data?.kiosk_settings) setKioskSettings(body.data.kiosk_settings);
      })
      .catch(() => {});
  }, []);

  const handleLocationSelect = (id: string) => {
    localStorage.setItem('kiosk_location_id', id);
    setSelectedLocation(id);
    window.location.reload(); // reload to apply store/menu hooks fresh
  };

  if (!selectedLocation) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui', minHeight: '100vh', background: '#f9fafb' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, color: '#111827' }}>Select Location</h1>
        <p style={{ color: '#4b5563', marginBottom: 40 }}>Please select the POS-enabled location for this Kiosk.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto' }}>
          {locations.map(l => (
            <button 
              key={l.id} 
              onClick={() => handleLocationSelect(l.id.toString())}
              style={{
                padding: '24px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff',
                fontSize: 18, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                color: '#111827', transition: 'all 0.2s ease'
              }}
            >
              {l.name}
            </button>
          ))}
          {locations.length === 0 && !fetchError && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}><Loader2 size={32} className="animate-spin" color="#9ca3af" /></div>}
          {fetchError && <div style={{ color: 'red', marginTop: 20 }}>Error loading locations: {fetchError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div id="kiosk-shell">
      {/* Header */}
      {!isLangScreen && (
        <header id="kiosk-header">
          <Link to={`/${language}/home`} className="header-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="header-brand-icon">
              <UtensilsCrossed size={18} />
            </div>
            {locationName}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            {/* Professional Language Dropdown */}
            <button
              className="cart-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '8px 16px' }}
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              title="Change Language"
            >
              <Globe size={18} color="#6b7280" />
              <span style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#374151' }}>{language}</span>
            </button>

            {langMenuOpen && (
              <div 
                style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                  background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  border: '1px solid #f3f4f6', overflow: 'hidden', zIndex: 100, width: '180px'
                }}
              >
                {[
                  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
                  { code: 'zh', name: '中文', flag: 'https://flagcdn.com/w40/cn.png' },
                  { code: 'ja', name: '日本語', flag: 'https://flagcdn.com/w40/jp.png' },
                  { code: 'ru', name: 'Русский', flag: 'https://flagcdn.com/w40/ru.png' }
                ].map(l => (
                  <button 
                    key={l.code}
                    onClick={() => {
                      setLangMenuOpen(false);
                      const newPath = location.pathname.replace(/^\/[a-z]{2}/, `/${l.code}`);
                      window.location.href = newPath; // Full reload to ensure all state updates correctly
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px', 
                      padding: '12px 16px', borderBottom: '1px solid #f9fafb',
                      background: language === l.code ? '#fff7ed' : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}><img src={l.flag} alt={l.code} width="24" style={{ borderRadius: "3px" }} /></span>
                    <span style={{ fontSize: '15px', color: '#1f2937', fontWeight: language === l.code ? '600' : '400' }}>{l.name}</span>
                  </button>
                ))}
                <Link 
                  to={`/${language}`} 
                  onClick={() => setLangMenuOpen(false)}
                  style={{
                     display: 'block', padding: '12px 16px', textAlign: 'center', 
                     fontSize: '13px', color: 'var(--primary)', fontWeight: '600',
                     textDecoration: 'none', background: '#f9fafb'
                  }}
                >
                  More Languages...
                </Link>
              </div>
            )}

            {/* Home button on Cart / Checkout pages */}
            {isCheckoutOrCart && (
              <Link
                to={`/${language}/dining`}
                className="cart-btn"
                aria-label="Back to menu"
                title="Back to Menu"
              >
                <HomeIcon size={20} />
              </Link>
            )}

            <button
              className="cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label="View cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Layout: content + side panel on desktop */}
      <div id="kiosk-layout">
        <main id="kiosk-main" className={`${isHome ? 'is-home' : ''} ${cartCount > 0 && !isCheckoutOrCart ? 'has-float-cart' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/en" replace />} />
            <Route path="/:lang" element={<LanguageSyncWrapper />}>
              <Route index element={<LanguageSelect />} />
              <Route path="home" element={<HomePage settings={kioskSettings} />} />
              <Route path="dining" element={<Menu />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="experiences/:slug/book" element={<ExperienceBooking />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="product/:slug" element={<ProductDetail />} />
            </Route>
          </Routes>
        </main>

        {/* Desktop: always-visible side panel */}
        {!isLangScreen && !isHome && !isExperiences && !isCheckoutOrCart && (
          <aside id="kiosk-side-panel">
            <CartPanel onClose={() => setCartOpen(false)} />
          </aside>
        )}
      </div>

      {/* Mobile: floating bucket bar — hidden on checkout/cart pages */}
      {cartCount > 0 && !isCheckoutOrCart && (
        <button
          id="cart-float-bar"
          onClick={() => setCartOpen(true)}
          aria-label="Open cart"
        >
          <div className="cart-float-left">
            <span className="cart-float-count">{cartCount} {t('categories')}{cartCount !== 1 ? 's' : ''}</span>
          </div>
          <span className="cart-float-label">
            <ShoppingBag size={16} /> {t('your_order')}
          </span>
          <span className="cart-float-total">Rs. {totalAmount().toLocaleString()}</span>
        </button>
      )}

      {/* Cart panel (mobile overlay) */}
      {cartOpen && (
        <div id="cart-mobile-overlay">
          <CartPanel onClose={() => setCartOpen(false)} />
        </div>
      )}

      {/* Powered By Footer */}
      <footer className="power-footer">
        Powered by <a href="https://nebulync.com" target="_blank" rel="noopener noreferrer">nebulync.com</a>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;

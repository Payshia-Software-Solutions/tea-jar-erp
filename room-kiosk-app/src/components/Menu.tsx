import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, X, LayoutGrid, List, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { getDiscountedPrice } from '../store/useCartStore';
import type { Product } from '../store/useCartStore';
import ProductModal from './ProductModal';

interface Collection {
  id: number;
  name: string;
}

const API_URL   = import.meta.env.VITE_API_URL   ?? 'http://localhost/rapair-management/server';
const API_KEY   = import.meta.env.VITE_API_KEY   ?? '';
const LOC_DEFAULT = import.meta.env.VITE_DEFAULT_LOCATION_ID ?? '1';

export default function Menu() {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const navigate = useNavigate();

  const [collections, setCollections]         = useState<Collection[]>([]);
  const [products,    setProducts]             = useState<Product[]>([]);
  const [activeCollId, setActiveCollId]        = useState<number | null>(-1);
  const [searchQuery, setSearchQuery]          = useState('');
  const [showCategoriesView, setShowCategoriesView] = useState(false);
  const [viewMode, setViewMode]                = useState<'grid' | 'list'>('grid');
  const [loading,     setLoading]              = useState(true);
  const [error,       setError]                = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct]  = useState<Product | null>(null);

  const locationId = localStorage.getItem('kiosk_location_id') ?? new URLSearchParams(window.location.search).get('locationId') ?? LOC_DEFAULT;

  useEffect(() => {
    const headers: HeadersInit = API_KEY ? { 'X-API-Key': API_KEY } : {};

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        // --- Collections ---
        const cRes = await fetch(`${API_URL}/api/publiccollection/list`, { headers });
        if (cRes.ok) {
          const cBody = await cRes.json();
          const colls: Collection[] = Array.isArray(cBody) ? cBody : (cBody.data ?? []);
          setCollections(colls);
        }

        // --- Products ---
        const pRes = await fetch(
          `${API_URL}/api/publicitem/inventory?location_id=${locationId}`,
          { headers }
        );
        if (!pRes.ok) throw new Error(`API error: ${pRes.status}`);

        const pBody = await pRes.json();
        const rawItems: any[] = Array.isArray(pBody) ? pBody : (pBody.data ?? []);
        
        // Filter out items that are not for Dining
        const diningItems = rawItems.filter(item => item.kiosk_module === 'Dining' || !item.kiosk_module); // Fallback to all if kiosk_module not set

        const mapped: Product[] = diningItems.map((item) => ({
          id:          item.id,
          name:        item.name,
          price:       Number(item.price ?? 0),
          description: item.description ?? item.brand ?? '',
          image:       item.image_url ?? '',
          // category_ids from backend is an array of collection ids
          categoryId:  Array.isArray(item.category_ids) && item.category_ids.length > 0
                         ? Number(item.category_ids[0])
                         : 0,
          collectionIds: Array.isArray(item.category_ids)
                         ? item.category_ids.map(Number)
                         : [],
          slug:        item.slug ?? (item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + item.id),
          discount_type: item.discount_type,
          discount_value: Number(item.discount_value ?? 0),
        }));

        setProducts(mapped);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load menu.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [locationId]);

  // Filter by selected collection
  const filtered = products.filter((p) => {
    // Collection Filter
    if (activeCollId !== null && activeCollId !== -1) {
      const ids = (p as any).collectionIds as number[] ?? [p.categoryId];
      if (!ids.includes(activeCollId)) return false;
    }
    
    // Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });

  // ---- Loading ----
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>{t('loading_menu')}</p>
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <div className="loading-screen">
        <p style={{ color: 'var(--primary)', fontWeight: 700 }}>⚠ {error}</p>
        <p style={{ fontSize: 13 }}>
          Check that your API URL and API Key are correct in <code>.env.local</code>
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button 
          onClick={() => navigate(`/${language}/home`)}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)',
            background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-1)'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>{t('order_products')}</h1>
      </div>
      <p className="page-subtitle">{t('select_items')}</p>

      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t('search_items')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
        
        {collections.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="cat-select-btn" 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{ width: '48px', padding: 0, justifyContent: 'center' }}
              title="Toggle View"
            >
              {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
            </button>
            <button 
              className="cat-select-btn" 
              onClick={() => setShowCategoriesView(!showCategoriesView)}
              style={{ 
                background: showCategoriesView ? 'var(--primary-lt)' : 'var(--surface)',
                borderColor: showCategoriesView ? 'var(--primary)' : 'var(--border)',
                color: showCategoriesView ? 'var(--primary)' : 'var(--text-1)'
              }}
            >
              <Filter size={16} />
              <span className="cat-select-name">
                {showCategoriesView ? t('close') : t('categories')}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {showCategoriesView && searchQuery.trim() === '' ? (
        // Category Grid View
        <div className="category-grid">
          <div className="category-card" onClick={() => { setActiveCollId(-1); setShowCategoriesView(false); }}>
            {t('all')}
          </div>
          {collections.map((c) => (
            <div key={c.id} className="category-card" onClick={() => { setActiveCollId(c.id); setShowCategoriesView(false); }}>
              <h3>{t(c.name, c.name)}</h3>
            </div>
          ))}
        </div>
      ) : (
        // Products View
        <div className="products-view">
          {activeCollId !== -1 && activeCollId !== null && (
            <div className="category-header">
              <button className="back-btn" onClick={() => setActiveCollId(-1)}>
                &larr; {t('show_all')}
              </button>
              <h2>{t(collections.find(c => c.id === activeCollId)?.name || "", collections.find(c => c.id === activeCollId)?.name || "")}</h2>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
              {t('no_items')}
            </div>
          ) : (
            <div className={`product-${viewMode}`}>
              {filtered.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="product-img-wrap">
                    {product.image ? (
                      <img src={product.image} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="product-img-placeholder">🍽️</div>
                    )}
                  </div>

                  <div className="product-content">
                    <div className="product-body">
                      <p className="product-name">{t(product.name, product.name)}</p>
                      {product.description && (
                        <p className="product-desc">{t(product.description, product.description)}</p>
                      )}
                    </div>

                    <div className="product-footer">
                      <div className="product-price">
                        {getDiscountedPrice(product) < product.price ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-3)', fontSize: '13px', marginRight: '6px', fontWeight: 500 }}>
                              Rs. {product.price.toLocaleString()}
                            </span>
                            <br />
                            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Rs. {getDiscountedPrice(product).toLocaleString()}</span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Rs. {product.price.toLocaleString()}</span>
                        )}
                      </div>
                      <button
                        className="add-btn"
                        aria-label={`Add ${t(product.name, product.name)}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}


    </>
  );
}

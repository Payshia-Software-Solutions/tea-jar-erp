import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { getDiscountedPrice } from '../store/useCartStore';
import type { Product } from '../store/useCartStore';

const API_URL   = import.meta.env.VITE_API_URL   ?? 'http://localhost/rapair-management/server';
const API_KEY   = import.meta.env.VITE_API_KEY   ?? '';
const LOC_DEFAULT = import.meta.env.VITE_LOCATION_ID ?? '1';

export default function Experiences() {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const navigate = useNavigate();
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const locationId = localStorage.getItem('kiosk_location_id') ?? new URLSearchParams(window.location.search).get('locationId') ?? LOC_DEFAULT;

  useEffect(() => {
    const headers: HeadersInit = API_KEY ? { 'X-API-Key': API_KEY } : {};

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const pRes = await fetch(
          `${API_URL}/api/publicitem/inventory?location_id=${locationId}`,
          { headers }
        );
        if (!pRes.ok) throw new Error(`API error: ${pRes.status}`);

        const pBody = await pRes.json();
        const rawItems: any[] = Array.isArray(pBody) ? pBody : (pBody.data ?? []);
        
        // Filter out items that are not for Experiences
        const experienceItems = rawItems.filter(item => item.kiosk_module === 'Experience');

        const mapped: Product[] = experienceItems.map((item) => ({
          id:          item.id,
          name:        item.name,
          price:       Number(item.price ?? 0),
          description: item.description ?? item.brand ?? '',
          image:       item.image_url ?? '',
          categoryId:  Array.isArray(item.category_ids) && item.category_ids.length > 0
                         ? Number(item.category_ids[0])
                         : 0,
          slug:        item.slug ?? (item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + item.id),
          discount_type: item.discount_type,
          discount_value: Number(item.discount_value ?? 0),
        }));

        setProducts(mapped);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load experiences.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [locationId]);

  return (
    <div className="product-list-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
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
        <Sparkles className="text-primary" size={28} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('hotel_experiences')}</h1>
      </div>

      {loading && (
        <div className="loading-screen">
          <div className="spinner" />
          <p>{t('loading_experiences')}</p>
        </div>
      )}

      {error && (
        <div className="error-center" style={{ color: 'red' }}>{error}</div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="empty-center" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
          No experiences available at the moment.
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="exp-grid">
          {products.map((product) => {
            const finalPrice = getDiscountedPrice(product);
            return (
              <Link key={product.id} to={`/${language}/experiences/${product.slug}/book`} className="exp-grid-card">
                {/* Image/Placeholder */}
                <div className="exp-grid-img">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="exp-grid-placeholder">✨</div>
                  )}
                  {/* Free badge */}
                  {product.price === 0 && (
                    <span className="exp-grid-free-badge">{t('free')}</span>
                  )}
                </div>

                {/* Info */}
                <div className="exp-grid-info">
                  <h3 className="exp-grid-name">{t(product.name, product.name)}</h3>
                  <p className="exp-grid-desc">
                    {product.description || 'Enjoy this premium experience.'}
                  </p>

                  <div className="exp-grid-footer">
                    <div className="exp-grid-price">
                      {product.price === 0 ? (
                        <span className="exp-grid-compl">{t('complimentary')}</span>
                      ) : finalPrice < product.price ? (
                        <>
                          <span className="exp-grid-old">Rs. {product.price.toLocaleString()}</span>
                          <span className="exp-grid-final">Rs. {finalPrice.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="exp-grid-final">Rs. {product.price.toLocaleString()}</span>
                      )}
                    </div>
                    <span className="exp-grid-book-btn">
                      Book Now <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

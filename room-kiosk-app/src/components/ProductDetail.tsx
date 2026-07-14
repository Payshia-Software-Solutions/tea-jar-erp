import { useParams, Link } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore, getDiscountedPrice } from '../store/useCartStore';
import type { Product } from '../store/useCartStore';

const API_URL   = import.meta.env.VITE_API_URL   ?? 'http://localhost/rapair-management/server';
const API_KEY   = import.meta.env.VITE_API_KEY   ?? '';
const LOC_DEFAULT = import.meta.env.VITE_DEFAULT_LOCATION_ID ?? '1';

export default function ProductDetail() {
  const language = useLanguageStore((state) => state.language);
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(s => s.addItem);
  
  const locationId = new URLSearchParams(window.location.search).get('locationId') ?? LOC_DEFAULT;

  useEffect(() => {
    // In a real app we might fetch the specific product by slug.
    // For now we fetch all inventory and find it.
    const headers: HeadersInit = API_KEY ? { 'X-API-Key': API_KEY } : {};

    async function fetchProduct() {
      try {
        setLoading(true);
        const pRes = await fetch(`${API_URL}/api/publicitem/inventory?location_id=${locationId}`, { headers });
        if (!pRes.ok) throw new Error(`API error: ${pRes.status}`);
        
        const pBody = await pRes.json();
        const rawItems: any[] = Array.isArray(pBody) ? pBody : (pBody.data ?? []);
        
        const mapped: Product[] = rawItems.map((item) => ({
          id:          item.id,
          name:        item.name,
          price:       Number(item.price ?? 0),
          description: item.description ?? item.brand ?? '',
          image:       item.image_url ?? '',
          categoryId:  Array.isArray(item.category_ids) && item.category_ids.length > 0 ? Number(item.category_ids[0]) : 0,
          slug:        item.slug ?? (item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + item.id),
          discount_type: item.discount_type,
          discount_value: Number(item.discount_value ?? 0),
        }));

        const found = mapped.find(p => p.slug === slug);
        if (found) {
          setProduct(found);
        } else {
          setError('Product not found');
        }
      } catch (err: any) {
        setError(err.message ?? 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProduct();
  }, [slug, locationId]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading details…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
        {error || 'Product not found'}
        <br/><br/>
        <Link to={`/${language}/dining`} className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
          Back to Menu
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    for(let i=0; i<quantity; i++) {
      addItem(product);
    }
    // Simple visual feedback
    alert(`${quantity}x ${product.name} added to order!`);
  };

  return (
    <div className="product-detail-page">
      <Link to={`/${language}/dining`} className="back-btn" style={{ marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to Menu
      </Link>

      <div className="product-detail-layout">
        <div className="product-detail-img">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="placeholder">🍽️</div>
          )}
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <div className="pd-price">
            {getDiscountedPrice(product) < product.price ? (
              <>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-3)', fontSize: '18px', marginRight: '12px', fontWeight: 500 }}>
                  Rs. {product.price.toLocaleString()}
                </span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                  Rs. {getDiscountedPrice(product).toLocaleString()}
                </span>
              </>
            ) : (
              `Rs. ${product.price.toLocaleString()}`
            )}
          </div>
          
          <div className="desc">
            <h3>Description</h3>
            <p>{product.description || 'No detailed description available.'}</p>
          </div>

          <div className="action-card">
            <div className="qty-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}><Plus size={18} /></button>
            </div>
            
            <button className="btn-primary" onClick={handleAdd}>
              <ShoppingBag size={18} />
              Add to Order • Rs. {(getDiscountedPrice(product) * quantity).toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

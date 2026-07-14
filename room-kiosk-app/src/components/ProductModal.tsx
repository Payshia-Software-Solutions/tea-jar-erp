import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore, getDiscountedPrice } from '../store/useCartStore';
import type { Product } from '../store/useCartStore';

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Image */}
        <div className="modal-img-wrap">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="modal-img-placeholder">🍽️</div>
          )}
        </div>

        {/* Info */}
        <div className="modal-body">
          <h2 className="modal-title">{product.name}</h2>
          {product.description && (
            <p className="modal-desc">{product.description}</p>
          )}
          
          <Link 
            to={`/product/${product.slug}`} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 6, 
              color: 'var(--primary)', fontSize: 14, fontWeight: 700, 
              textDecoration: 'none', marginBottom: 16 
            }}
          >
            View Full Details <ArrowRight size={14} />
          </Link>

          <p className="modal-price">
            {getDiscountedPrice(product) < product.price ? (
              <>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-3)', fontSize: '14px', marginRight: '8px', fontWeight: 500 }}>
                  Rs. {product.price.toLocaleString()}
                </span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                  Rs. {getDiscountedPrice(product).toLocaleString()}
                </span>
              </>
            ) : (
              `Rs. ${product.price.toLocaleString()}`
            )}
          </p>

          {/* Spacer pushes qty+button to bottom on tall modal */}
          <div className="modal-spacer" />

          {/* Qty Selector */}
          <div className="modal-qty-row">
            <span className="modal-qty-label">Quantity</span>
            <div className="modal-qty-ctrl">
              <button
                className="modal-qty-btn"
                onClick={() => setQty(Math.max(1, qty - 1))}
                aria-label="Decrease"
              >
                <Minus size={16} />
              </button>
              <span className="modal-qty-num">{qty}</span>
              <button
                className="modal-qty-btn add"
                onClick={() => setQty(qty + 1)}
                aria-label="Increase"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Add Button */}
          <button className="modal-add-btn" onClick={handleAdd}>
            <ShoppingBag size={18} />
            Add to Order • Rs. {(getDiscountedPrice(product) * qty).toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}

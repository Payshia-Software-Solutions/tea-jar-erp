import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/useLanguageStore';
import { ShoppingBag, Plus, Minus, X, ArrowRight } from 'lucide-react';
import { useCartStore, getDiscountedPrice } from '../store/useCartStore';

interface Props {
  onClose: () => void;
}

export default function CartPanel({ onClose }: Props) {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const { items, updateQuantity, totalAmount } = useCartStore();

  return (
    <>
      {/* Backdrop (mobile) */}
      <div className="cart-panel-backdrop" onClick={onClose} />

      {/* Panel */}
      <aside className="cart-panel">
        <div className="cart-panel-header">
          <div className="cart-panel-title">
            <ShoppingBag size={20} />
            <span>{t('your_order')}</span>
            {items.length > 0 && (
              <span className="cart-panel-count">{items.reduce((t, i) => t + i.quantity, 0)}</span>
            )}
          </div>
          <button className="cart-panel-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="cart-panel-body">
          {items.length === 0 ? (
            <div className="cart-panel-empty">
              <span>🛒</span>
              <p>{t('cart_empty')}</p>
              <small>{t('tap_to_add')}</small>
            </div>
          ) : (
            <>
              <div className="cart-panel-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-panel-item">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="cart-panel-item-img" />
                      : <div className="cart-panel-item-img cart-panel-item-img-placeholder">🍽️</div>
                    }
                    <div className="cart-panel-item-info">
                      <p className="cart-panel-item-name">{item.name}</p>
                      <p className="cart-panel-item-price">Rs. {(getDiscountedPrice(item) * item.quantity).toLocaleString()}</p>
                    </div>
                    <div className="qty-ctrl">
                      <button
                        className={`qty-btn${item.quantity === 1 ? ' danger' : ''}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        {item.quantity === 1 ? <X size={12} /> : <Minus size={12} />}
                      </button>
                      <span className="qty-num">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        style={{ background: 'var(--primary)', color: '#fff', borderRadius: 6 }}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-panel-footer">
                <div className="cart-panel-total">
                  <span>{t('total')}</span>
                  <span className="cart-panel-total-price">Rs. {totalAmount().toLocaleString()}</span>
                </div>
                <Link to={`/${language}/checkout`} className="btn-primary" onClick={onClose}>{t('checkout')}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

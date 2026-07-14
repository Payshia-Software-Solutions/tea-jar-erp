import { useCartStore, getDiscountedPrice } from '../store/useCartStore';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';

export default function Cart() {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const { items, updateQuantity, totalAmount } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon">
          <Trash2 size={36} />
        </div>
        <h2>{t('cart_empty')}</h2>
        <p>{t('add_items_started')}</p>
        <Link to={`/${language}/dining`} className="btn-outline" style={{ marginTop: 8 }}>{t('browse_menu')}</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">{t('your_order')}</h1>
      <p className="page-subtitle">{items.length} item{items.length !== 1 ? 's' : ''} selected</p>

      <div>
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            {item.image ? (
              <img src={item.image} alt={item.name} className="cart-item-img" />
            ) : (
              <div
                className="cart-item-img"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}
              >
                🍽️
              </div>
            )}

            <div className="cart-item-info">
              <p className="cart-item-name">{item.name}</p>
              <p className="cart-item-price">
                Rs. {(getDiscountedPrice(item) * item.quantity).toLocaleString()}
              </p>
            </div>

            <div className="qty-ctrl">
              <button
                className={`qty-btn${item.quantity === 1 ? ' danger' : ''}`}
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                {item.quantity === 1
                  ? <Trash2 size={14} />
                  : <Minus size={14} />}
              </button>
              <span className="qty-num">{item.quantity}</span>
              <button
                className="qty-btn"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                aria-label="Increase quantity"
                style={{ background: 'var(--primary)', color: '#fff', borderRadius: 8 }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary">
        <div className="summary-row">
          <span>{t('subtotal')}</span>
          <span>Rs. {totalAmount().toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span>{t('tax_included')}</span>
          <span>{t('included')}</span>
        </div>
        <div className="summary-row total">
          <span>{t('total')}</span>
          <span className="total-price">Rs. {totalAmount().toLocaleString()}</span>
        </div>
      </div>

      <Link to={`/${language}/checkout`} className="btn-primary">
        {t('proceed_checkout')}
        <ArrowRight size={18} />
      </Link>
    </>
  );
}

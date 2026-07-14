import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/useLanguageStore';
import { Utensils, Sparkles } from 'lucide-react';

interface HomeProps {
  settings?: any;
}

export default function Home({ settings }: HomeProps) {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  return (
    <div className="home-container">
      <div className="home-overlay">
        <div className="home-content">
          {settings?.logo_url && (
            <div className="home-logo-wrapper">
              <img src={settings.logo_url} alt="Logo" className="home-logo" />
            </div>
          )}
          <h1 className="home-title">{t('welcome')}</h1>
          <p className="home-subtitle">{t('welcome_subtitle')}</p>

          <div className="home-cards">
            <Link to={`/${language}/dining`} className="home-card dining-card">
              <div className="card-icon-wrapper">
                <Utensils size={48} />
              </div>
              <h2>{t('order_products')}</h2>
              <p>{t('dining_subtitle')}</p>
            </Link>

            <Link to={`/${language}/experiences`} className="home-card experience-card">
              <div className="card-icon-wrapper">
                <Sparkles size={48} />
              </div>
              <h2>{t('experiences')}</h2>
              <p>{t('exp_subtitle')}</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

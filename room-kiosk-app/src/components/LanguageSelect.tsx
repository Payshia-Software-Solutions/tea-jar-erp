import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/useLanguageStore';
import { Globe, Search, ChevronDown } from 'lucide-react';

const mainLanguages = [
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'zh', name: '中文', flag: 'https://flagcdn.com/w40/cn.png' },
  { code: 'ja', name: '日本語', flag: 'https://flagcdn.com/w40/jp.png' },
  { code: 'ru', name: 'Русский', flag: 'https://flagcdn.com/w40/ru.png' }
];

const otherLanguages = [
  { code: 'zh', name: '中文 (Chinese)', flag: 'https://flagcdn.com/w40/cn.png' },
  { code: 'es', name: 'Español (Spanish)', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'fr', name: 'Français (French)', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'de', name: 'Deutsch (German)', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'ar', name: 'العربية (Arabic)', flag: 'https://flagcdn.com/w40/sa.png' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: 'https://flagcdn.com/w40/in.png' },
  { code: 'ja', name: '日本語 (Japanese)', flag: 'https://flagcdn.com/w40/jp.png' },
  { code: 'ko', name: '한국어 (Korean)', flag: 'https://flagcdn.com/w40/kr.png' },
  { code: 'it', name: 'Italiano (Italian)', flag: 'https://flagcdn.com/w40/it.png' },
  { code: 'pt', name: 'Português (Portuguese)', flag: 'https://flagcdn.com/w40/pt.png' }
];

export default function LanguageSelect() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    navigate(`/${langCode}/home`);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOtherLanguages = otherLanguages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="lang-screen">
      <div className="lang-container" style={{ paddingBottom: '60px' }}>
        <div className="lang-header">
          <Globe size={48} color="var(--primary)" />
          <h2>{t('welcome')}</h2>
          <p>{t('select_language')}</p>
        </div>

        <div className="lang-grid">
          {mainLanguages.map((lang) => (
            <button
              key={lang.code}
              className="lang-card"
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-flag"><img src={lang.flag} alt={lang.code} width="32" style={{ borderRadius: "4px" }} /></span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 relative" ref={dropdownRef}>
          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-gray-200 absolute"></div>
            <span className="bg-white px-4 text-gray-400 text-sm font-medium relative z-10">{t('select_another')}</span>
          </div>
          
          <button 
            className="w-full mt-6 flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-[var(--primary)] transition-colors bg-gray-50"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="font-semibold text-gray-700 flex items-center gap-2">
              <Globe size={20} className="text-gray-500" />
              More Languages
            </span>
            <ChevronDown size={20} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search languages..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-[240px] overflow-y-auto">
                {filteredOtherLanguages.length > 0 ? (
                  <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {filteredOtherLanguages.map(lang => (
                      <button
                        key={lang.code}
                        className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition-colors text-left w-full group"
                        onClick={() => handleSelect(lang.code)}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform"><img src={lang.flag} alt={lang.code} width="24" style={{ borderRadius: "3px" }} /></span>
                        <span className="font-medium text-gray-700 group-hover:text-[var(--primary)]">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    No languages found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useLanguage } from '../context/LanguageContext';

const LANGS = {
    es: { flag: '🇪🇸', next: 'en', nextLabel: 'Switch to English' },
    en: { flag: '🇬🇧', next: 'es', nextLabel: 'Cambiar a Español' },
};

const LanguageSwitcher = () => {
    const { language, changeLanguage } = useLanguage();
    const current = LANGS[language] ?? LANGS['es'];

    return (
        <button
            id="global-language-switcher"
            onClick={() => changeLanguage(current.next)}
            title={current.nextLabel}
            aria-label={current.nextLabel}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.55rem',
                lineHeight: 1,
                background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
                boxShadow: '0 4px 16px rgba(13,110,253,0.40)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                userSelect: 'none',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.12)';
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(13,110,253,0.55)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,110,253,0.40)';
            }}
            onMouseDown={e => {
                e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={e => {
                e.currentTarget.style.transform = 'scale(1.12)';
            }}
        >
            {current.flag}
        </button>
    );
};

export default LanguageSwitcher;

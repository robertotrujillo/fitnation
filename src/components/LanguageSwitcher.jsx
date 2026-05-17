import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
        i18n.changeLanguage(newLang);
    };

    return (
        <button 
            onClick={toggleLanguage}
            className="btn rounded-circle d-flex align-items-center justify-content-center p-0 shadow-lg"
            style={{ 
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '50px', 
                height: '50px', 
                backgroundColor: '#2ecc71', 
                border: 'none',
                color: '#fff',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                zIndex: 9999
            }}
            title={i18n.language.startsWith('es') ? 'Cambiar a Inglés' : 'Switch to Spanish'}
        >
            <span className="fw-bold" style={{ fontSize: '16px' }}>
                {i18n.language.startsWith('es') ? 'ES' : 'EN'}
            </span>
        </button>
    );
};

export default LanguageSwitcher;

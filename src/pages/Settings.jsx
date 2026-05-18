import React from 'react';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Settings = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { usuario, cerrarSesion } = useAuth();
    const navigate = useNavigate();

    const manejarCerrarSesion = () => {
        cerrarSesion();
        navigate('/login');
    };

    return (
        <div className="client-container min-vh-100 d-flex flex-column">
            <Navbar />

            <div className="container flex-grow-1 py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card shadow-sm border-0 rounded-4">
                            <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 text-center">
                                <h3 className="fw-bold mb-0">{t('settings.title')}</h3>
                            </div>

                            <div className="card-body p-4">
                                <h5 className="text-secondary fw-bold mb-3">{t('settings.appearance')}</h5>

                                <div className="d-flex align-items-center justify-content-between p-3 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>
                                            {theme === 'dark' ? (
                                                <i className="bi bi-moon-stars-fill text-warning"></i>
                                            ) : (
                                                <i className="bi bi-sun-fill text-warning"></i>
                                            )}
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{t('settings.dark_mode')}</h6>
                                            <small className="text-muted">{t('settings.dark_mode_desc')}</small>
                                        </div>
                                    </div>
                                    <div className="form-check form-switch fs-4 mb-0">
                                        <input
                                            className="form-check-input shadow-none"
                                            type="checkbox"
                                            role="switch"
                                            id="themeSwitch"
                                            checked={theme === 'dark'}
                                            onChange={toggleTheme}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                <LanguageSelector t={t} />

                                <hr />

                                <div className="mt-4">
                                    <h5 className="text-secondary fw-bold mb-3">{t('settings.account')}</h5>

                                    <div className="list-group list-group-flush">
                                        <div className="list-group-item px-0 d-flex justify-content-between align-items-center bg-transparent">
                                            <span>{t('settings.email_label')}</span>
                                            <span className="text-muted">{usuario?.email}</span>
                                        </div>
                                        <div className="list-group-item px-0 d-flex justify-content-between align-items-center bg-transparent">
                                            <span>{t('settings.status')}</span>
                                            <span className="badge bg-success">{t('settings.active')}</span>
                                        </div>
                                        <div className="list-group-item px-0 d-flex justify-content-between align-items-center bg-transparent border-bottom-0 pb-0 pt-4 mt-2">
                                            <button onClick={manejarCerrarSesion} className="btn btn-danger w-100 rounded-pill fw-bold shadow-sm">
                                                <i className="bi bi-box-arrow-right me-2"></i> {t('settings.logout')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 text-center">
                                    <Link to="/" className="btn btn-primary px-4 rounded-pill">
                                        {t('settings.back_home')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LANGUAGES = [
    { code: 'es', flag: '🇪🇸', labelKey: 'settings.lang_es' },
    { code: 'en', flag: '🇬🇧', labelKey: 'settings.lang_en' },
];

const LanguageSelector = ({ t }) => {
    const { language, changeLanguage } = useLanguage();

    return (
        <div className="p-3 border rounded-3 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                    🌐
                </div>
                <div>
                    <h6 className="mb-0 fw-bold">{t('settings.language')}</h6>
                    <small className="text-muted">{t('settings.language_desc')}</small>
                </div>
            </div>
            <div className="d-flex gap-2">
                {LANGUAGES.map(({ code, flag, labelKey }) => (
                    <button
                        key={code}
                        id={`lang-btn-${code}`}
                        onClick={() => changeLanguage(code)}
                        className={`btn d-flex align-items-center gap-2 rounded-pill px-3 py-2 fw-semibold flex-grow-1 justify-content-center ${
                            language === code
                                ? 'btn-primary shadow-sm'
                                : 'btn-outline-secondary'
                        }`}
                        style={{ transition: 'all 0.2s ease' }}
                    >
                        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{flag}</span>
                        <span>{t(labelKey)}</span>
                        {language === code && (
                            <i className="bi bi-check-circle-fill ms-1" style={{ fontSize: '0.85rem' }}></i>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Settings;

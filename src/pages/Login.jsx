import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getUserRole } from '../utils/roleUtils';
import { useTranslation } from 'react-i18next';
import './Login.css';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [modoRecuperar, setModoRecuperar] = useState(false);

    const { usuario, iniciarSesion, iniciarSesionGoogle, recuperarContrasena } = useAuth();
    const navigate = useNavigate();

    // Redirigir automáticamente si el usuario ya está autenticado (y para atrapar el login exitoso)
    useEffect(() => {
        if (usuario) {
            const rol = getUserRole(usuario);
            if (rol === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/app', { replace: true });
            }
        }
    }, [usuario, navigate]);

    const manejarGoogleLogin = async () => {
        try {
            const { error } = await iniciarSesionGoogle();
            if (error) throw error;
        } catch (error) {
            console.error("Error COMPLETO de Google Login:", error);
            setError(t('login.error_google') + (error.message || JSON.stringify(error)));
        }
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        if (modoRecuperar) {
            try {
                await recuperarContrasena(email);
                setMensaje(t('login.recover_success'));
                setModoRecuperar(false);
            } catch (error) {
                setError(t('login.recover_error') + (error.message || 'Inténtalo de nuevo'));
            }
            return;
        }

        try {
            await iniciarSesion(email, contrasena);
            // La redirección ocurrirá automáticamente gracias al useEffect de arriba
            // cuando el AuthContext propague el objeto usuario.
        } catch (error) {
            setError(t('login.login_error') + (error.message || 'Credenciales inválidas'));
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-logo">
                        <span className="text-fit">Fit</span><span className="text-nation">Nation</span>
                    </h1>
                    <p className="login-subtitle">{t('login.subtitle')}</p>
                </div>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <div>{error}</div>
                    </div>
                )}
                
                {mensaje && (
                    <div className="alert alert-success d-flex align-items-center" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        <div>{mensaje}</div>
                    </div>
                )}

                <button type="button" className="btn-google" onClick={manejarGoogleLogin}>
                    <i className="bi bi-google"></i> {t('login.continue_google')}
                </button>

                <div className="divider">
                    <span>{t('login.or')}</span>
                </div>

                <form onSubmit={manejarEnvio}>
                    <div className="mb-4">
                        <label className="form-label small fw-bold" style={{ color: 'var(--fn-text-muted)' }}>{t('login.email_label')}</label>
                        <div className="input-group">
                            <span className="input-group-text border-end-0" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)' }}><i className="bi bi-envelope text-primary"></i></span>
                            <input
                                type="email"
                                className="form-control border-start-0 ps-0 shadow-none"
                                style={{ backgroundColor: 'var(--fn-hover)', color: 'var(--fn-text-main)', borderColor: 'var(--fn-border)' }}
                                placeholder={t('login.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {!modoRecuperar && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <label className="form-label small fw-bold mb-0" style={{ color: 'var(--fn-text-muted)' }}>{t('login.password_label')}</label>
                                <button type="button" className="btn btn-link p-0 text-decoration-none small text-muted" onClick={() => setModoRecuperar(true)}>{t('login.forgot_password')}</button>
                            </div>
                            <div className="input-group mt-2">
                                <span className="input-group-text border-end-0" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)' }}><i className="bi bi-lock text-success"></i></span>
                                <input
                                    type={mostrarContrasena ? "text" : "password"}
                                    className="form-control border-start-0 border-end-0 ps-0 shadow-none"
                                    style={{ backgroundColor: 'var(--fn-hover)', color: 'var(--fn-text-main)', borderColor: 'var(--fn-border)' }}
                                    placeholder={t('login.password_placeholder')}
                                    value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    required
                                />
                                <span className="input-group-text border-start-0" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)', cursor: 'pointer' }} onClick={() => setMostrarContrasena(!mostrarContrasena)}>
                                    <i className={`bi ${mostrarContrasena ? "bi-eye-slash" : "bi-eye"} text-muted`}></i>
                                </span>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-login">
                        {modoRecuperar ? t('login.btn_recover') : t('login.btn_login')} <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                    
                    {modoRecuperar && (
                        <div className="mt-3 text-center">
                            <button type="button" className="btn btn-link text-decoration-none text-muted" onClick={() => {setModoRecuperar(false); setError(''); setMensaje('');}}>
                                {t('login.back_to_login')}
                            </button>
                        </div>
                    )}
                </form>

                <div className="mt-4 text-center">
                    <p className="text-muted">
                        {t('login.no_account')} <Link to="/register" className="text-primary text-decoration-none fw-bold">{t('login.register_link')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

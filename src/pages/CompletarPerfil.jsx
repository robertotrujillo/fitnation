import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { servicioPerfil } from '../services/profileService';
import { servicioAutenticacion } from '../services/authService';
import { useTranslation } from 'react-i18next';
import './Login.css'; // Reutilizamos estilos principales de Login/Register para mantener estética

const CompletarPerfil = () => {
    const { t } = useTranslation();
    const { usuario, perfil, recargarPerfil } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [verificando, setVerificando] = useState(false);

    // Si ya tiene username, no debería estar aquí
    if (perfil?.username) {
        return <Navigate to="/app" replace />;
    }

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');
        
        const usernameLimpio = username.trim().toLowerCase();

        if (usernameLimpio.length < 3) {
            setError(t('completarPerfil.username_min'));
            return;
        }
        if (/\s/.test(usernameLimpio)) {
            setError(t('completarPerfil.username_spaces'));
            return;
        }

        setCargando(true);
        setVerificando(true);
        try {
            // Verificar disponibilidad
            const isAvailable = await servicioAutenticacion.checkUsernameAvailability(usernameLimpio);
            if (!isAvailable) {
                setError(t('completarPerfil.username_taken'));
                setCargando(false);
                setVerificando(false);
                return;
            }

            // Si está disponible, actualizamos el perfil
            const { error: updateError } = await servicioPerfil.actualizarPerfil(usuario.id, {
                username: usernameLimpio
            });

            if (updateError) throw updateError;

            // Recargamos en AuthContext localmente
            await recargarPerfil();

            // Redirigir a la app
            navigate('/app');

        } catch (error) {
            console.error("Error al completar perfil:", error);
            setError(t('completarPerfil.error'));
        } finally {
            setCargando(false);
            setVerificando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-logo">
                        <span className="text-fit">Fit</span><span className="text-nation">Nation</span>
                    </h1>
                    <p className="login-subtitle">{t('completarPerfil.subtitle')}</p>
                </div>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={manejarEnvio}>
                    <div className="mb-4">
                        <label className="form-label small fw-bold" style={{ color: 'var(--fn-text-muted)' }}>{t('completarPerfil.username_label')}</label>
                        <div className="input-group">
                            <span className="input-group-text border-end-0 fw-bold" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)', color: 'var(--fn-text-muted)' }}>@</span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0 shadow-none"
                                style={{ backgroundColor: 'var(--fn-hover)', color: 'var(--fn-text-main)', borderColor: 'var(--fn-border)' }}
                                placeholder={t('completarPerfil.username_placeholder')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={cargando}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-login" disabled={cargando}>
                        {cargando ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> {t('completarPerfil.btn_saving')}</>
                        ) : (
                            <>{t('completarPerfil.btn_submit')} <i className="bi bi-check2 ms-2"></i></>
                        )}
                    </button>
                    
                    <div className="text-center mt-3">
                         <span className="small text-muted"><i className="bi bi-info-circle me-1"></i> {t('completarPerfil.hint')}</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompletarPerfil;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Login.css'; // Reutilizamos los estilos del login

const UpdatePassword = () => {
    const { t } = useTranslation();
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [cargando, setCargando] = useState(false);

    const { actualizarContrasena, cerrarSesion } = useAuth();
    const navigate = useNavigate();

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        if (nuevaContrasena.length < 8) {
            setError(t('updatePassword.password_min'));
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            setError(t('updatePassword.password_mismatch'));
            return;
        }

        setCargando(true);
        try {
            await actualizarContrasena(nuevaContrasena);
            setMensaje(t('updatePassword.success'));
            
            setTimeout(async () => {
                await cerrarSesion();
                navigate('/login', { replace: true });
            }, 2000);
        } catch (error) {
            setError(t('updatePassword.error') + error.message);
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-logo">
                        <span className="text-fit">Fit</span><span className="text-nation">Nation</span>
                    </h1>
                    <p className="login-subtitle">{t('updatePassword.subtitle')}</p>
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

                <form onSubmit={manejarEnvio}>
                    <div className="mb-4">
                        <label className="form-label small fw-bold" style={{ color: 'var(--fn-text-muted)' }}>{t('updatePassword.new_password_label')}</label>
                        <div className="input-group">
                            <span className="input-group-text border-end-0" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)' }}><i className="bi bi-lock text-success"></i></span>
                            <input
                                type={mostrarContrasena ? "text" : "password"}
                                className="form-control border-start-0 border-end-0 ps-0 shadow-none"
                                style={{ backgroundColor: 'var(--fn-hover)', color: 'var(--fn-text-main)', borderColor: 'var(--fn-border)' }}
                                placeholder={t('updatePassword.new_password_placeholder')}
                                value={nuevaContrasena}
                                onChange={(e) => setNuevaContrasena(e.target.value)}
                                required
                                disabled={cargando || !!mensaje}
                            />
                            <span className="input-group-text border-start-0" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)', cursor: 'pointer' }} onClick={() => setMostrarContrasena(!mostrarContrasena)}>
                                <i className={`bi ${mostrarContrasena ? "bi-eye-slash" : "bi-eye"} text-muted`}></i>
                            </span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-bold" style={{ color: 'var(--fn-text-muted)' }}>{t('updatePassword.confirm_label')}</label>
                        <div className="input-group">
                            <span className="input-group-text border-end-0" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)' }}><i className="bi bi-lock-fill text-success"></i></span>
                            <input
                                type={mostrarContrasena ? "text" : "password"}
                                className="form-control border-start-0 ps-0 shadow-none"
                                style={{ backgroundColor: 'var(--fn-hover)', color: 'var(--fn-text-main)', borderColor: 'var(--fn-border)' }}
                                placeholder={t('updatePassword.confirm_placeholder')}
                                value={confirmarContrasena}
                                onChange={(e) => setConfirmarContrasena(e.target.value)}
                                required
                                disabled={cargando || !!mensaje}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-login" disabled={cargando || !!mensaje}>
                        {cargando ? t('updatePassword.btn_saving') : t('updatePassword.btn_submit')} <i className="bi bi-check2-circle ms-2"></i>
                    </button>
                    
                    {!cargando && !mensaje && (
                        <div className="mt-3 text-center">
                            <button type="button" className="btn btn-link text-decoration-none text-muted" onClick={async () => { await cerrarSesion(); navigate('/login'); }}>
                                {t('updatePassword.cancel')}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;

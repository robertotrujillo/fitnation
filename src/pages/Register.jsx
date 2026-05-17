import { useState } from 'react';
import { Link } from 'react-router-dom';
import { servicioAutenticacion } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Login.css';

const Register = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nombreUsuario: '',
        fechaNacimiento: ''
    });

    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [cargando, setCargando] = useState(false);

    const { iniciarSesionGoogle } = useAuth(); // Importar iniciarSesionGoogle

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const manejarGoogleLogin = async () => {
        try {
            const { error } = await iniciarSesionGoogle();
            if (error) throw error;
        } catch (error) {
            setError(t('register.error_google') + (error.message || 'Error desconocido'));
        }
    };

    const manejarRegistro = async (e) => {
        e.preventDefault();
        setError('');
        setMensajeExito('');
        setCargando(true);

        const { email, password, confirmPassword, nombreUsuario, fechaNacimiento } = formData;

        if (password.length < 8) {
            setError(t('register.password_min'));
            setCargando(false);
            return;
        }

        // Permitir cualquier caracter especial (no alfanumérico)
        const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError(t('register.password_special'));
            setCargando(false);
            return;
        }

        if (password !== confirmPassword) {
            setError(t('register.password_mismatch'));
            setCargando(false);
            return;
        }

        try {
            // VERIFICACIÓN DE NOMBRE DE USUARIO
            const disponible = await servicioAutenticacion.checkUsernameAvailability(nombreUsuario);
            if (!disponible) {
                setError(t('register.username_taken'));
                setCargando(false);
                return;
            }

            await servicioAutenticacion.registrarUsuario({
                email,
                password,
                nombreUsuario,
                fechaNacimiento
            });

            setMensajeExito(t('register.success'));
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                nombreUsuario: '',
                fechaNacimiento: ''
            });

        } catch (err) {
            console.error("Error original de registro:", err);
            setError(t('register.error') + (err.message || 'Verifica tus datos.'));
        } finally {
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
                    <p className="login-subtitle">{t('register.subtitle')}</p>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {mensajeExito && (
                    <div className="alert alert-success" role="alert">
                        {mensajeExito}
                    </div>
                )}

                <button type="button" className="btn-google" onClick={manejarGoogleLogin}>
                    <i className="bi bi-google"></i> {t('register.continue_google')}
                </button>

                <div className="divider">
                    <span>{t('register.or')}</span>
                </div>

                <form onSubmit={manejarRegistro}>
                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold">{t('register.username_label')}</label>
                        <input
                            type="text"
                            className="form-control"
                            name="nombreUsuario"
                            value={formData.nombreUsuario}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold">{t('register.dob_label')}</label>
                        <input
                            type="date"
                            className="form-control"
                            name="fechaNacimiento"
                            value={formData.fechaNacimiento}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold">{t('register.email_label')}</label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold">{t('register.password_label')}</label>
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-muted small fw-bold">{t('register.confirm_password_label')}</label>
                        <input
                            type="password"
                            className="form-control"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-login" disabled={cargando}>
                        {cargando ? t('register.btn_loading') : t('register.btn_submit')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-muted">
                        {t('register.has_account')} <Link to="/login" className="text-primary text-decoration-none fw-bold">{t('register.login_link')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { servicioPerfil } from '../services/profileService';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
    const { usuario } = useAuth();
    const { t } = useTranslation();

    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const buscadorRef = useRef(null);

    // Cierra el buscador si se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
                setMostrarResultados(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Efecto de búsqueda con debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (busqueda.trim().length >= 2) {
                setBuscando(true);
                const usuarios = await servicioPerfil.buscarUsuarios(busqueda);
                setResultados(usuarios);
                setMostrarResultados(true);
                setBuscando(false);
            } else {
                setResultados([]);
                setMostrarResultados(false);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [busqueda]);

    if (!usuario) return null;

    return (
        <nav className="navbar navbar-expand-lg mb-4 p-3 shadow-sm" style={{ backgroundColor: 'var(--fn-navbar-bg)', borderBottom: '1px solid var(--fn-border)' }}>
            <div className="container">
                <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
                    <span className="text-fit" style={{ color: 'var(--fn-navbar-text)' }}>Fit</span><span className="text-nation" style={{ color: '#2ecc71' }}>Nation</span><img src="/logo.png" alt="FitNation Logo" style={{ height: '45px', marginRight: '10px' }} />
                </Link>

                {/* Buscador central */}
                <div className="mx-auto position-relative d-none d-md-block" style={{ width: '350px' }} ref={buscadorRef}>
                    <div className="input-group">
                        <span className="input-group-text border-end-0 rounded-start-pill" style={{ backgroundColor: 'var(--fn-input-bg)', borderColor: 'var(--fn-input-border)', color: 'var(--fn-text-muted)' }}>
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 rounded-end-pill shadow-none"
                            style={{ backgroundColor: 'var(--fn-input-bg)', borderColor: 'var(--fn-input-border)', color: 'var(--fn-text-main)' }}
                            placeholder={t('navbar.search_placeholder')}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onFocus={() => busqueda.trim().length >= 2 && setMostrarResultados(true)}
                        />
                        {buscando && (
                            <span className="position-absolute end-0 top-50 translate-middle-y me-3 text-primary" style={{ zIndex: 10 }}>
                                <span className="spinner-border spinner-border-sm"></span>
                            </span>
                        )}
                    </div>

                    {/* Resultados del buscador */}
                    {mostrarResultados && resultados.length > 0 && (
                        <div className="position-absolute w-100 border shadow rounded-4 mt-2 overflow-hidden" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto', backgroundColor: 'var(--fn-card-bg)', borderColor: 'var(--fn-border)' }}>
                            {resultados.map((user) => (
                                <Link
                                    to={`/profile/${user.id}`}
                                    key={user.id}
                                    className="d-flex align-items-center p-2 text-decoration-none text-body border-bottom"
                                    style={{ borderColor: 'var(--fn-border)' }}
                                    onClick={() => {
                                        setMostrarResultados(false);
                                        setBusqueda('');
                                    }}
                                >
                                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold' }}>
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="Avatar" className="w-100 h-100 rounded-circle object-fit-cover" />
                                        ) : (
                                            (user.username || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="text-truncate fw-bold">
                                        @{user.username || t('navbar.default_username')}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {mostrarResultados && busqueda.trim().length >= 2 && resultados.length === 0 && !buscando && (
                        <div className="position-absolute w-100 border shadow rounded-4 mt-2 p-3 text-center" style={{ zIndex: 1000, backgroundColor: 'var(--fn-card-bg)', borderColor: 'var(--fn-border)', color: 'var(--fn-text-muted)' }}>
                            {t('navbar.no_users_found')}
                        </div>
                    )}
                </div>

                <div className="d-flex align-items-center gap-3">
                    <Link to="/profile" className="d-flex align-items-center gap-2 text-decoration-none rounded-pill pe-3 p-1" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', transition: 'background-color 0.2s' }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '32px', height: '32px', fontSize: '13px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold' }}>
                            {(usuario?.user_metadata?.nombre_usuario || usuario?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-bold d-none d-md-block" style={{ color: 'var(--fn-navbar-text)', fontSize: '0.9rem' }}>
                            {usuario?.user_metadata?.nombre_usuario || usuario?.email?.split('@')[0]}
                        </span>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

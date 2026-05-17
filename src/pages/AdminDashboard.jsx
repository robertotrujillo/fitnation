import { useState, useEffect } from 'react';
import { servicioPublicaciones } from '../services/postService';
import { servicioPerfil } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { usuario, cerrarSesion } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [publicaciones, setPublicaciones] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [textoNuevoAnuncio, setTextoNuevoAnuncio] = useState('');
    const [eliminandoId, setEliminandoId] = useState(null);

    // Estado para la vista de usuarios
    const [vistaActual, setVistaActual] = useState('panel'); // 'panel' o 'usuarios'
    const [usuarios, setUsuarios] = useState([]);
    const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

    // Estado para las estadísticas
    const [stats, setStats] = useState({
        usuariosActivos: 0,
        nuevosHoy: 0,
        reportesPendientes: 0,
        retosActivos: 0
    });

    useEffect(() => {
        if (vistaActual === 'panel') {
            const cargarDatosPanel = async () => {
                const [dataPubs, dataStats, dataReportes] = await Promise.all([
                    servicioPublicaciones.obtenerPublicaciones(),
                    servicioPerfil.obtenerEstadisticasAdmin(),
                    servicioPublicaciones.obtenerReportesPendientes()
                ]);
                setPublicaciones(dataPubs);
                setStats(dataStats);
                setReportes(dataReportes);
            };
            cargarDatosPanel();
        } else if (vistaActual === 'estadisticas') {
            const cargarStats = async () => {
                const dataStats = await servicioPerfil.obtenerEstadisticasAdmin();
                setStats(dataStats);
            };
            cargarStats();
        } else if (vistaActual === 'usuarios') {
            cargarUsuarios();
        } else if (vistaActual === 'publicaciones') {
            const cargarPubs = async () => {
                const data = await servicioPublicaciones.obtenerPublicaciones();
                setPublicaciones(data);
            };
            cargarPubs();
        }
    }, [vistaActual]);

    const cargarUsuarios = async (busqueda = '') => {
        setCargandoUsuarios(true);
        const data = await servicioPerfil.obtenerUsuariosAdmin(busqueda);
        setUsuarios(data);
        setCargandoUsuarios(false);
    };

    const manejarBusquedaUsuarios = (e) => {
        e.preventDefault();
        cargarUsuarios(busquedaUsuarios);
    };

    const manejarCrearAnuncio = async (e) => {
        e.preventDefault();
        if (!textoNuevoAnuncio.trim()) return;

        const nombreAutor = usuario?.user_metadata?.nombre_usuario || usuario?.email?.split('@')[0] || 'Admin';

        try {
            const nuevaPublicacion = await servicioPublicaciones.crearPublicacion(usuario.id, nombreAutor, `📢 ANUNCIO: ${textoNuevoAnuncio}`);

            if (nuevaPublicacion) {
                const posts = await servicioPublicaciones.obtenerPublicaciones();
                setPublicaciones(posts);
                setTextoNuevoAnuncio('');
            }
        } catch (error) {
            console.error("Error al publicar anuncio:", error);
        }
    };

    const manejarEliminarPublicacion = async (postId, userId, imageUrl, reporteId = null) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta publicación reportada/inapropiada?")) return;

        setEliminandoId(postId);
        try {
            if (reporteId) {
                const exito = await servicioPublicaciones.resolverReporteYPenalizarAdmin(reporteId, userId, postId, imageUrl);
                if (exito) {
                    setPublicaciones(prev => prev.filter(p => p.id !== postId));
                    setReportes(prev => prev.filter(r => r.id !== reporteId));
                    setStats(prev => ({ ...prev, reportesPendientes: Math.max(0, prev.reportesPendientes - 1) }));
                } else {
                    console.warn("No se pudo resolver el reporte y eliminar el post. Revisa los permisos.");
                }
            } else {
                const exito = await servicioPublicaciones.eliminarPublicacionAdmin(postId, imageUrl);
                if (exito) {
                    setPublicaciones(prev => prev.filter(p => p.id !== postId));
                } else {
                    console.warn("No se pudo eliminar el post. Revisa los permisos.");
                }
            }
        } catch (error) {
            console.error("Error al eliminar publicacion:", error);
        } finally {
            setEliminandoId(null);
        }
    };

    const manejarDesestimarReporte = async (reporteId) => {
        try {
            const exito = await servicioPublicaciones.desestimarReporteAdmin(reporteId);
            if (exito) {
                setReportes(prev => prev.filter(r => r.id !== reporteId));
                setStats(prev => ({ ...prev, reportesPendientes: Math.max(0, prev.reportesPendientes - 1) }));
            } else {
                console.warn("Error al descartar el reporte. Asegúrate de tener el perfil de admin.");
            }
        } catch (error) {
            console.error("Error al desestimar reporte:", error);
        }
    };

    const manejarCerrarSesion = () => {
        cerrarSesion();
        navigate('/login');
    };

    return (
        <div className="admin-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <i className="bi bi-trophy-fill text-warning fs-4"></i>
                    <span className="brand-logo">FitNation</span>
                </div>

                <ul className="sidebar-menu">
                    <li className="menu-item">
                        <a href="#" className={`menu-link ${vistaActual === 'panel' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setVistaActual('panel'); }}>
                            <i className="bi bi-speedometer2"></i>
                            <span>Panel Principal</span>
                        </a>
                    </li>
                    <li className="menu-item">
                        <a href="#" className={`menu-link ${vistaActual === 'usuarios' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setVistaActual('usuarios'); }}>
                            <i className="bi bi-people"></i>
                            <span>Usuarios</span>
                        </a>
                    </li>
                    <li className="menu-item">
                        <a href="#" className="menu-link">
                            <i className="bi bi-graph-up"></i>
                            <span>Estadísticas</span>
                        </a>
                    </li>
                    <li className="menu-item">
                        <a href="#" className={`menu-link ${vistaActual === 'publicaciones' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setVistaActual('publicaciones'); }}>
                            <i className="bi bi-newspaper"></i>
                            <span>Publicaciones</span>
                        </a>
                    </li>
                    <li className="menu-item">
                        <a href="#" className="menu-link">
                            <i className="bi bi-award"></i>
                            <span>Logros</span>
                        </a>
                    </li>
                    <li className="menu-item">
                        <a href="#" className={`menu-link ${vistaActual === 'configuracion' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setVistaActual('configuracion'); }}>
                            <i className="bi bi-gear-fill"></i>
                            <span>Configuración</span>
                        </a>
                    </li>
                </ul>

                <div className="logout-btn-wrapper">
                    <button onClick={manejarCerrarSesion} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2" style={{ fontWeight: '600' }}>
                        <i className="bi bi-box-arrow-left"></i> Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {vistaActual === 'panel' && (
                    <>
                        <div className="container-fluid p-0">

                            <div className="page-header mb-4">
                                <h2>Centro de mando de Fitnation</h2>
                                <p>Panel de control de la Comunidad</p>
                            </div>

                            <div className="row g-4 mb-5">
                                <div className="col-md-3">
                                    <div className="stat-card" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <div className="stat-label">USUARIOS REGISTRADOS</div>
                                        <div className="stat-value">{stats.usuariosActivos}</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card" style={{ borderLeftColor: '#0dcaf0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <div className="stat-label text-info">NUEVOS USUARIOS (semanales)</div>
                                        <div className="stat-value">{stats.nuevosHoy}</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card" style={{ borderLeftColor: '#dc3545', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <div className="stat-label text-danger">REPORTES PENDIENTES</div>
                                        <div className="stat-value">{stats.reportesPendientes}</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card" style={{ borderLeftColor: '#ffc107', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <div className="stat-label text-warning">RETOS ACTIVOS</div>
                                        <div className="stat-value">{stats.retosActivos}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card shadow-sm mb-5" style={{ backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                            <div className="card-header border-0 pt-4 px-4" style={{ backgroundColor: 'transparent' }}>
                                <h5 className="card-title fw-bold" style={{ color: 'var(--fn-text-main)' }}>Usuarios registrados</h5>
                            </div>
                            <div className="card-body px-4 pb-4">
                                <div className="chart-container" style={{ height: '150px' }}>
                                    <svg className="chart-svg" viewBox="0 0 1000 150" preserveAspectRatio="none">
                                        <line x1="0" y1="30" x2="1000" y2="30" stroke="#eee" />
                                        <line x1="0" y1="70" x2="1000" y2="70" stroke="#eee" />
                                        <line x1="0" y1="110" x2="1000" y2="110" stroke="#eee" />

                                        <path d="M0,150 L0,100 L250,90 L500,80 L750,55 L1000,50 L1000,150 Z" className="chart-area" fill="rgba(13, 110, 253, 0.1)" />

                                        <polyline points="0,100 250,90 500,80 750,55 1000,50" className="chart-line" />

                                        <circle cx="0" cy="100" className="chart-dot" />
                                        <circle cx="250" cy="90" className="chart-dot" />
                                        <circle cx="500" cy="80" className="chart-dot" />
                                        <circle cx="750" cy="55" className="chart-dot" />
                                        <circle cx="1000" cy="50" className="chart-dot" />
                                    </svg>
                                    <div className="d-flex justify-content-between text-muted small mt-2">
                                        <span>Semana 1</span>
                                        <span>Semana 2</span>
                                        <span>Semana 3</span>
                                        <span>Semana 4</span>
                                        <span>Semana 5</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-5 mb-4 mb-lg-0">
                                <div className="card shadow-sm p-4" style={{ borderRadius: '15px', backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                                    <h5 className="mb-3 fw-bold" style={{ color: 'var(--fn-text-main)' }}><i className="bi bi-megaphone-fill text-primary me-2"></i> Anuncios Globales</h5>
                                    <p className="text-muted small mb-4">Envía una notificación al feed de todos los usuarios de la plataforma.</p>

                                    <form onSubmit={manejarCrearAnuncio}>
                                        <div className="mb-3">
                                            <textarea
                                                className="form-control border-0"
                                                rows="4"
                                                placeholder="Escribe el anuncio para la comunidad..."
                                                value={textoNuevoAnuncio}
                                                onChange={(e) => setTextoNuevoAnuncio(e.target.value)}
                                                style={{ borderRadius: '10px', resize: 'none', backgroundColor: 'var(--fn-input-bg)', color: 'var(--fn-text-main)' }}
                                            ></textarea>
                                        </div>
                                        <button type="submit" className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '10px' }}>
                                            <i className="bi bi-send-fill"></i> Lanzar Anuncio
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="col-lg-7">
                                <div className="card shadow-sm p-4" style={{ borderRadius: '15px', backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="mb-0 fw-bold" style={{ color: 'var(--fn-text-main)' }}><i className="bi bi-shield-lock-fill text-danger me-2"></i> Bandeja de Moderación</h5>
                                        <span className="badge bg-danger rounded-pill">Reportes Pendientes</span>
                                    </div>

                                    <div className="feed-list" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                                        {reportes.length > 0 ? reportes.map(reporte => {
                                            const publicacion = reporte.posts;
                                            if (!publicacion) return null; // Post might have already been deleted

                                            const autorPost = publicacion.nombre_autor || 'Anónimo';
                                            const autorReporte = reporte.reporter?.username || 'Usuario';

                                            return (
                                                <div key={reporte.id} className="feed-item border border-danger border-2 rounded shadow-sm p-3 mb-3" style={{ backgroundColor: 'var(--fn-card-bg)' }}>

                                                    {/* Encabezado del reporte */}
                                                    <div className="mb-3 pb-2 border-bottom border-danger border-opacity-25">
                                                        <div className="d-flex align-items-center mb-1">
                                                            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                                                            <span className="fw-bold text-danger small">Reporte generado por @{autorReporte}</span>
                                                        </div>
                                                        <div className="rounded p-2 small mt-2 border border-secondary border-opacity-25" style={{ backgroundColor: 'var(--fn-input-bg)', color: 'var(--fn-text-main)' }}>
                                                            <span className="fw-bold">Motivo:</span> {reporte.reason}
                                                        </div>
                                                        <div className="text-muted small mt-1 text-end" style={{ fontSize: '0.75rem' }}>
                                                            Fecha del reporte: {new Date(reporte.created_at).toLocaleString()}
                                                        </div>
                                                    </div>

                                                    {/* Contenido del post reportado */}
                                                    <div className="d-flex align-items-start gap-3" style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)' }}>
                                                            {autorPost.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="w-100">
                                                            <span className="fw-bold d-block mb-1" style={{ color: 'var(--fn-text-main)' }}>
                                                                @{autorPost} <span className="text-muted fw-normal ms-1 small">(Autor del post)</span>
                                                            </span>
                                                            <span className="d-block mb-2 text-break" style={{ fontSize: '0.95rem', color: 'var(--fn-text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                                                                {publicacion.texto}
                                                            </span>

                                                            {publicacion.image_url && (
                                                                <div className="rounded overflow-hidden mt-2 d-flex justify-content-center" style={{ maxHeight: '200px', backgroundColor: 'var(--fn-input-bg)' }}>
                                                                    {publicacion.image_url.match(/\.(mp4|webm|ogg)$/i) || publicacion.image_url.includes('.mp4') ? (
                                                                        <video src={publicacion.image_url} controls className="img-fluid" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                                                                    ) : (
                                                                        <img src={publicacion.image_url} alt="Reportado" className="img-fluid" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Acciones */}
                                                    <div className="d-flex gap-2 mt-3 pt-3 border-top justify-content-end">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary fw-bold"
                                                            onClick={() => manejarDesestimarReporte(reporte.id)}
                                                        >
                                                            <i className="bi bi-check-circle-fill me-1"></i> Desestimar Reporte
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger fw-bold shadow-sm"
                                                            onClick={() => manejarEliminarPublicacion(publicacion.id, publicacion.user_id, publicacion.image_url, reporte.id)}
                                                            disabled={eliminandoId === publicacion.id}
                                                        >
                                                            {eliminandoId === publicacion.id ? (
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            ) : (
                                                                <><i className="bi bi-trash3-fill me-1"></i> Eliminar Post</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="text-center text-muted p-5">
                                                <i className="bi bi-shield-check text-success" style={{ fontSize: '4rem' }}></i>
                                                <h5 className="mt-3 fw-bold" style={{ color: 'var(--fn-text-main)' }}>Todo en orden</h5>
                                                <p>No hay reportes pendientes de revisión.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {vistaActual === 'usuarios' && (
                    <div className="container-fluid p-0">
                        <div className="page-header mb-4">
                            <h2>Gestión de Usuarios</h2>
                            <p>Administra los miembros de la comunidad Fitnation</p>
                        </div>

                        <div className="card shadow-sm p-4 mb-4" style={{ borderRadius: '15px', backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                            <form onSubmit={manejarBusquedaUsuarios}>
                                <div className="input-group">
                                    <span className="input-group-text border-0" style={{ backgroundColor: 'var(--fn-input-bg)' }}>
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-0"
                                        placeholder="Buscar por nombre de usuario..."
                                        value={busquedaUsuarios}
                                        onChange={(e) => setBusquedaUsuarios(e.target.value)}
                                        style={{ boxShadow: 'none', backgroundColor: 'var(--fn-input-bg)', color: 'var(--fn-text-main)' }}
                                    />
                                    <button className="btn btn-primary px-4" type="submit" style={{ borderRadius: '0 10px 10px 0' }}>
                                        Buscar
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="card shadow-sm" style={{ borderRadius: '15px', backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0" style={{ color: 'var(--fn-text-main)' }}>
                                    <thead style={{ backgroundColor: 'var(--fn-input-bg)', color: 'var(--fn-text-main)' }}>
                                        <tr>
                                            <th scope="col" className="ps-4 border-0 rounded-start">Usuario</th>
                                            <th scope="col" className="border-0">Nombre Completo</th>
                                            <th scope="col" className="border-0">Biografía</th>
                                            <th scope="col" className="border-0">Fecha de Registro</th>
                                            <th scope="col" className="text-end pe-4 border-0 rounded-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cargandoUsuarios ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Cargando...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : usuarios.length > 0 ? (
                                            usuarios.map(u => (
                                                <tr key={u.id}>
                                                    <td className="ps-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', overflow: 'hidden', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)' }}>
                                                                {u.avatar_url ? (
                                                                    <img src={u.avatar_url} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    u.username?.charAt(0).toUpperCase() || '?'
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0 fw-bold" style={{ color: 'var(--fn-text-main)' }}>@{u.username}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{u.full_name || '-'}</td>
                                                    <td>
                                                        <div className="text-truncate text-muted" style={{ maxWidth: '200px' }}>
                                                            {u.biografia || '-'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Link 
                                                            to={`/profile/${u.id}`} 
                                                            className="btn btn-sm btn-outline-secondary me-2" 
                                                            title="Ver Perfil"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </Link>
                                                        {/* Aquí en el futuro se pueden añadir botones de suspender/eliminar */}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5 text-muted">
                                                    <i className="bi bi-search fs-2 mb-3 d-block"></i>
                                                    No se encontraron usuarios
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {vistaActual === 'publicaciones' && (
                    <div className="container-fluid p-0">
                        <div className="page-header mb-4">
                            <h2>Gestión de Publicaciones</h2>
                            <p>Explora y administra todas las publicaciones de la comunidad</p>
                        </div>

                        <div className="row g-4">
                            {publicaciones.length > 0 ? publicaciones.map(post => {
                                const autorPost = post.nombre_autor || 'Anónimo';
                                return (
                                    <div key={post.id} className="col-12 col-md-6 col-lg-4">
                                        <div className="card h-100 shadow-sm" style={{ borderRadius: '15px', backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                                            <div className="card-body">
                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', overflow: 'hidden', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)' }}>
                                                        {autorPost.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0 fw-bold" style={{ color: 'var(--fn-text-main)' }}>@{autorPost}</h6>
                                                        <small className="text-muted">{new Date(post.created_at).toLocaleDateString()}</small>
                                                    </div>
                                                </div>
                                                
                                                <p className="card-text text-break" style={{ color: 'var(--fn-text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'anywhere', fontSize: '0.95rem' }}>
                                                    {post.texto}
                                                </p>

                                                {post.image_url && (
                                                    <div className="rounded overflow-hidden mb-3 d-flex justify-content-center" style={{ maxHeight: '200px', backgroundColor: 'var(--fn-input-bg)' }}>
                                                        {post.image_url.match(/\.(mp4|webm|ogg)$/i) || post.image_url.includes('.mp4') ? (
                                                            <video src={post.image_url} controls className="img-fluid" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                                                        ) : (
                                                            <img src={post.image_url} alt="Publicación" className="img-fluid" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="card-footer bg-transparent border-top-0 pt-0 pb-3">
                                                <button 
                                                    className="btn btn-outline-danger w-100 fw-bold shadow-sm"
                                                    onClick={() => manejarEliminarPublicacion(post.id, post.user_id, post.image_url)}
                                                    disabled={eliminandoId === post.id}
                                                >
                                                    {eliminandoId === post.id ? (
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <><i className="bi bi-trash3-fill me-2"></i> Eliminar Publicación</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-12 text-center text-muted p-5">
                                    <i className="bi bi-journal-x fs-1 mb-3 d-block"></i>
                                    <h5 className="mt-3 fw-bold" style={{ color: 'var(--fn-text-main)' }}>No hay publicaciones</h5>
                                    <p>Aún no se ha publicado nada en la plataforma.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {vistaActual === 'configuracion' && (
                    <div className="container-fluid p-0">
                        <div className="page-header mb-4">
                            <h2>Configuración</h2>
                            <p>Preferencias del administrador</p>
                        </div>

                        <div className="row justify-content-center mt-5">
                            <div className="col-12 col-md-8 col-lg-6">
                                <div className="card shadow-sm border-0 rounded-4" style={{ backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                                    <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 text-center">
                                        <h3 className="fw-bold mb-0" style={{ color: 'var(--fn-text-main)' }}>Configuración del Panel</h3>
                                    </div>

                                    <div className="card-body p-4">
                                        <h5 className="fw-bold mb-3" style={{ color: 'var(--fn-text-muted)' }}>Apariencia</h5>

                                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-4" style={{ backgroundColor: 'var(--fn-input-bg)', border: '1px solid var(--fn-border)' }}>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>
                                                    {theme === 'dark' ? (
                                                        <i className="bi bi-moon-stars-fill text-warning"></i>
                                                    ) : (
                                                        <i className="bi bi-sun-fill text-warning"></i>
                                                    )}
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 fw-bold" style={{ color: 'var(--fn-text-main)' }}>Modo Oscuro</h6>
                                                    <small style={{ color: 'var(--fn-text-muted)' }}>Ajusta la apariencia visual de FitNation</small>
                                                </div>
                                            </div>
                                            <div className="form-check form-switch fs-4 mb-0">
                                                <input
                                                    className="form-check-input shadow-none"
                                                    type="checkbox"
                                                    role="switch"
                                                    id="themeSwitchAdmin"
                                                    checked={theme === 'dark'}
                                                    onChange={toggleTheme}
                                                    style={{ cursor: 'pointer', backgroundColor: theme === 'dark' ? 'var(--bs-primary)' : '' }}
                                                />
                                            </div>
                                        </div>

                                        <hr style={{ borderColor: 'var(--fn-border)' }} />

                                        <div className="mt-4">
                                            <h5 className="fw-bold mb-3" style={{ color: 'var(--fn-text-muted)' }}>Cuenta</h5>

                                            <div className="list-group list-group-flush">
                                                <div className="list-group-item px-0 d-flex justify-content-between align-items-center bg-transparent" style={{ borderColor: 'var(--fn-border)' }}>
                                                    <span style={{ color: 'var(--fn-text-main)' }}>Email asociado</span>
                                                    <span style={{ color: 'var(--fn-text-muted)' }}>{usuario?.email}</span>
                                                </div>
                                                <div className="list-group-item px-0 d-flex justify-content-between align-items-center bg-transparent" style={{ borderColor: 'var(--fn-border)' }}>
                                                    <span style={{ color: 'var(--fn-text-main)' }}>Estado</span>
                                                    <span className="badge bg-success">Activo (Admin)</span>
                                                </div>
                                                <div className="list-group-item px-0 d-flex justify-content-between align-items-center bg-transparent border-bottom-0 pb-0 pt-4 mt-2">
                                                    <button onClick={manejarCerrarSesion} className="btn btn-danger w-100 rounded-pill fw-bold shadow-sm">
                                                        <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;

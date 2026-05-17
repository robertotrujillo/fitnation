import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { servicioPerfil } from '../services/profileService';
import { servicioPublicaciones } from '../services/postService';
import TextFeed from '../components/profile/TextFeed';
import PhotoGrid from '../components/profile/PhotoGrid';
import EditProfileModal from '../components/profile/EditProfileModal';
import CreatePostModal from '../components/profile/CreatePostModal';
import PhotoViewerModal from '../components/profile/PhotoViewerModal';
import { ReportModal } from '../components/profile/ReportModal';
import { useTranslation } from 'react-i18next';
import './Profile.css';

const Profile = () => {
    const { usuario } = useAuth();
    const { t } = useTranslation();
    const { id: paramId } = useParams();
    const profileId = paramId || usuario?.id;
    const esMiPerfil = !paramId || paramId === usuario?.id;

    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [editando, setEditando] = useState(false);
    const [activeTab, setActiveTab] = useState('fotos'); // 'fotos' o 'textos'
    
    // Estado para publicaciones
    const [publicaciones, setPublicaciones] = useState([]);
    const [publicacionesGuardadas, setPublicacionesGuardadas] = useState([]);

    // Estado para nueva publicación (para el modal)
    const [modalPublicacion, setModalPublicacion] = useState(false);

    // Estados para reportes
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [postAReportar, setPostAReportar] = useState(null);

    // Estado para ver fotos en grande
    const [fotoAmpliada, setFotoAmpliada] = useState(null);

    // Estados para comentarios en el visor de fotos
    const [comentariosVisor, setComentariosVisor] = useState([]);
    const [cargandoComentarios, setCargandoComentarios] = useState(false);
    // Estados para comentarios en posts de texto del perfil
    const [comentariosTextos, setComentariosTextos] = useState({});
    const [comentariosTextosAbiertos, setComentariosTextosAbiertos] = useState({});
    const [nuevosComentariosTextos, setNuevosComentariosTextos] = useState({});
    const [enviandoComentarioTexto, setEnviandoComentarioTexto] = useState({});

    // Estados para seguidores
    const [seguidoresStats, setSeguidoresStats] = useState({ followers: 0, following: 0 });
    const [loSigo, setLoSigo] = useState(false);
    const [cargandoFollow, setCargandoFollow] = useState(false);
    const [mostrarModalUnfollow, setMostrarModalUnfollow] = useState(false);

    // Cargar perfil al montar o cambiar de usuario
    useEffect(() => {
        if (profileId) {
            cargarPerfil();
            cargarPublicaciones();
            cargarFollows();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileId, usuario.id]);

    const cargarFollows = async () => {
        const stats = await servicioPerfil.obtenerContadoresSeguidores(profileId);
        setSeguidoresStats(stats);

        if (!esMiPerfil) {
            const meSigue = await servicioPerfil.verificarSiSigue(usuario.id, profileId);
            setLoSigo(meSigue);
        }
    };

    const cargarPublicaciones = async () => {
        const posts = await servicioPublicaciones.obtenerPublicacionesUsuario(profileId);
        if (posts) {
            // Cargar likes y conteo de comentarios iniciales para cada publicación
            const postsConMetadatos = await Promise.all(posts.map(async (post) => {
                const { count: likesCount } = await servicioPublicaciones.obtenerLikesDePublicacion(post.id);
                const diLike = await servicioPublicaciones.verificarSiDiLike(post.id, usuario.id);
                const loGuarde = await servicioPublicaciones.verificarSiGuardado(post.id, usuario.id);
                const commentsCount = await servicioPublicaciones.obtenerCantidadComentariosDePublicacion(post.id);
                return { ...post, likesCount: likesCount || 0, likedByMe: diLike, savedByMe: loGuarde, commentsCount: commentsCount || 0 };
            }));

            setPublicaciones(postsConMetadatos);
        }

        if (esMiPerfil) {
            const savedPosts = await servicioPublicaciones.obtenerPublicacionesGuardadas(usuario.id);
            if (savedPosts) {
                const savedConMetadatos = await Promise.all(savedPosts.map(async (post) => {
                    const { count: likesCount } = await servicioPublicaciones.obtenerLikesDePublicacion(post.id);
                    const diLike = await servicioPublicaciones.verificarSiDiLike(post.id, usuario.id);
                    const commentsCount = await servicioPublicaciones.obtenerCantidadComentariosDePublicacion(post.id);
                    return { ...post, likesCount: likesCount || 0, likedByMe: diLike, savedByMe: true, commentsCount: commentsCount || 0 };
                }));
                setPublicacionesGuardadas(savedConMetadatos);
            }
        }
    }

    const cargarPerfil = async () => {
        setCargando(true);
        const datos = await servicioPerfil.obtenerPerfil(profileId);

        if (datos) {
            setPerfil(datos);
        }
        setCargando(false);
    };

    const manejarFollowToggle = async () => {
        if (cargandoFollow) return;

        if (loSigo) {
            setMostrarModalUnfollow(true);
        } else {
            setCargandoFollow(true);
            const exito = await servicioPerfil.seguirUsuario(usuario.id, profileId);
            if (exito) {
                setLoSigo(true);
                setSeguidoresStats(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
            setCargandoFollow(false);
        }
    };

    const confirmarUnfollow = async () => {
        setCargandoFollow(true);
        const exito = await servicioPerfil.dejarDeSeguirUsuario(usuario.id, profileId);
        if (exito) {
            setLoSigo(false);
            setSeguidoresStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        }
        setCargandoFollow(false);
        setMostrarModalUnfollow(false);
    };



    const manejarLike = async (postId) => {
        // Encontrar el post actual
        const postIndex = publicaciones.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = publicaciones[postIndex];
        const nuevoEstadoLike = !post.likedByMe;

        // Actualización optimista de la UI
        const nuevasPublicaciones = [...publicaciones];
        nuevasPublicaciones[postIndex] = {
            ...post,
            likedByMe: nuevoEstadoLike,
            likesCount: nuevoEstadoLike ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
        };
        setPublicaciones(nuevasPublicaciones);

        // Si la foto ampliada es esta misma, actualizarla también
        if (fotoAmpliada && fotoAmpliada.id === postId) {
            setFotoAmpliada({
                ...fotoAmpliada,
                likedByMe: nuevoEstadoLike,
                likesCount: nuevoEstadoLike ? fotoAmpliada.likesCount + 1 : Math.max(0, fotoAmpliada.likesCount - 1)
            });
        }

        try {
            if (nuevoEstadoLike) {
                await servicioPublicaciones.darLike(postId, usuario.id);
            } else {
                await servicioPublicaciones.quitarLike(postId, usuario.id);
            }
        } catch (error) {
            console.error("Error al cambiar like:", error);
            // Revertir en caso de error
            setPublicaciones(publicaciones);
            if (fotoAmpliada && fotoAmpliada.id === postId) {
                setFotoAmpliada(post);
            }
        }
    };

    const manejarGuardar = async (postId) => {
        const postIndex = publicaciones.findIndex(p => p.id === postId);
        const savedPostIndex = publicacionesGuardadas.findIndex(p => p.id === postId);

        let targetPost = null;
        let isSaved = false;

        if (postIndex !== -1) {
            targetPost = publicaciones[postIndex];
            isSaved = !targetPost.savedByMe;
        } else if (savedPostIndex !== -1) {
            targetPost = publicacionesGuardadas[savedPostIndex];
            isSaved = !targetPost.savedByMe;
        } else if (fotoAmpliada && fotoAmpliada.id === postId) {
            targetPost = fotoAmpliada;
            isSaved = !targetPost.savedByMe;
        }

        if (!targetPost) return;

        if (postIndex !== -1) {
            const nuevas = [...publicaciones];
            nuevas[postIndex] = { ...targetPost, savedByMe: isSaved };
            setPublicaciones(nuevas);
        }

        if (savedPostIndex !== -1) {
            if (!isSaved) {
                setPublicacionesGuardadas(prev => prev.filter(p => p.id !== postId));
            } else {
                const nuevas = [...publicacionesGuardadas];
                nuevas[savedPostIndex] = { ...targetPost, savedByMe: isSaved };
                setPublicacionesGuardadas(nuevas);
            }
        } else if (isSaved && postIndex !== -1) {
            setPublicacionesGuardadas(prev => [{ ...targetPost, savedByMe: isSaved }, ...prev]);
        }

        if (fotoAmpliada && fotoAmpliada.id === postId) {
            setFotoAmpliada({ ...fotoAmpliada, savedByMe: isSaved });
        }

        try {
            if (isSaved) {
                await servicioPublicaciones.guardarPublicacion(postId, usuario.id);
            } else {
                await servicioPublicaciones.quitarGuardado(postId, usuario.id);
            }
        } catch (error) {
            console.error("Error al cambiar guardado:", error);
        }
    };

    const abrirVisor = async (post) => {
        setFotoAmpliada(post);
        setCargandoComentarios(true);
        setComentariosVisor([]);

        try {
            const comments = await servicioPublicaciones.obtenerComentariosDePublicacion(post.id);
            setComentariosVisor(comments);
        } catch (error) {
            console.error("Error cargando comentarios del visor:", error);
        } finally {
            setCargandoComentarios(false);
        }
    };

    const toggleComentariosTexto = async (postId) => {
        if (comentariosTextosAbiertos[postId]) {
            setComentariosTextosAbiertos(prev => ({ ...prev, [postId]: false }));
            return;
        }

        setComentariosTextosAbiertos(prev => ({ ...prev, [postId]: true }));

        if (!comentariosTextos[postId]) {
            const commentsData = await servicioPublicaciones.obtenerComentariosDePublicacion(postId);
            setComentariosTextos(prev => ({ ...prev, [postId]: commentsData }));
        }
    };

    const manejarEnviarComentarioTexto = async (postId) => {
        const texto = nuevosComentariosTextos[postId];
        if (!texto || !texto.trim() || enviandoComentarioTexto[postId]) return;

        setEnviandoComentarioTexto(prev => ({ ...prev, [postId]: true }));

        try {
            const nuevoComentario = await servicioPublicaciones.agregarComentario(postId, usuario.id, texto);
            if (nuevoComentario) {
                setComentariosTextos(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), nuevoComentario]
                }));
                setNuevosComentariosTextos(prev => ({ ...prev, [postId]: '' }));

                // Actualizar optimísticamente la cuenta de comentarios en el post
                const postIndex = publicaciones.findIndex(p => p.id === postId);
                if (postIndex !== -1) {
                    const nuevasPublicaciones = [...publicaciones];
                    nuevasPublicaciones[postIndex] = {
                        ...nuevasPublicaciones[postIndex],
                        commentsCount: (nuevasPublicaciones[postIndex].commentsCount || 0) + 1
                    };
                    setPublicaciones(nuevasPublicaciones);
                }
            }
        } catch (err) {
            console.error("Error al enviar comentario de texto", err);
        } finally {
            setEnviandoComentarioTexto(prev => ({ ...prev, [postId]: false }));
        }
    };

    const manejarEliminar = async (postId, imageUrl = null) => {
        try {
            const exito = await servicioPublicaciones.eliminarPublicacion(postId, usuario.id, imageUrl);

            if (exito) {
                // Quitarlo de la lista local
                setPublicaciones(prev => prev.filter(p => p.id !== postId));
                // Si la foto estaba ampliada, cerrarla
                if (fotoAmpliada && fotoAmpliada.id === postId) {
                    setFotoAmpliada(null);
                }
            } else {
                alert(t('userHome.delete_error'));
            }
        } catch (err) {
            console.error("Error al eliminar publicacion:", err);
            alert(t('userHome.delete_error_short'));
        }
    };

    const manejarReportar = (postId) => {
        setPostAReportar(postId);
        setReportModalVisible(true);
    };

    const nombreMostrar = perfil?.username || perfil?.raw_user_meta_data?.nombre_usuario || 'Usuario';
    const rol = perfil?.rol || 'cliente';
    const avatarUrl = perfil?.avatar_url;
    const avatarFallback = !avatarUrl ? nombreMostrar.charAt(0).toUpperCase() : null;

    if (cargando) return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: 'var(--fn-bg)' }}>
            <div className="spinner-grow text-primary" role="status">
                <span className="visually-hidden">{t('profile.loading')}</span>
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: 'var(--fn-bg)', minHeight: '100vh' }}>
            <Navbar />

            <div className="profile-container">

                {/* Tarjeta de información del perfil */}
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="cover-photo"></div>
                        <div className="profile-avatar-container">
                            <div className="profile-avatar overflow-hidden d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)' }}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    avatarFallback
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-info">
                        <h2 className="profile-name">{nombreMostrar}</h2>
                        <p className="text-secondary mb-3">@{perfil?.username || 'usuario'}</p>

                        <div className="mb-4">
                            <span className="profile-role-badge">
                                {rol === 'admin_gym' ? t('profile.admin_role') : t('profile.athlete_role')}
                            </span>
                        </div>

                        {/* Biografía */}
                        <div className="profile-bio-section">
                            <p className="profile-bio-text">
                                {perfil?.biografia || t('profile.default_bio')}
                            </p>
                        </div>

                        {/* Estadísticas físicas */}
                        <div className="physical-stats-row">
                            <div className="physical-stat-item">
                                <span className="stat-value-big">
                                    {perfil?.peso || '--'} <span className="stat-unit">kg</span>
                                </span>
                                <span className="stat-label-small">{t('profile.weight')}</span>
                            </div>
                            <div className="vertical-divider"></div>
                            <div className="physical-stat-item">
                                <span className="stat-value-big">
                                    {perfil?.altura || '--'} <span className="stat-unit">cm</span>
                                </span>
                                <span className="stat-label-small">{t('profile.height')}</span>
                            </div>
                        </div>



                        <div className="mt-4 w-100 d-flex justify-content-center">
                            {esMiPerfil ? (
                                <button className="btn btn-dark rounded-pill px-5 py-2 fw-bold shadow-sm w-100" style={{ maxWidth: '300px' }} onClick={() => setEditando(true)}>
                                    {t('profile.edit_profile')}
                                </button>
                            ) : (
                                <button
                                    className={`btn rounded-pill px-5 py-2 fw-bold shadow-sm w-100 ${loSigo ? 'btn-dark' : 'btn-primary text-white'}`}
                                    style={{ maxWidth: '300px' }}
                                    onClick={manejarFollowToggle}
                                    disabled={cargandoFollow}
                                >
                                    {cargandoFollow ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : loSigo ? t('profile.following_btn') : t('profile.follow_btn')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{publicaciones.length}</span>
                            <span className="stat-label">{t('profile.posts')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{seguidoresStats.followers}</span>
                            <span className="stat-label">{t('profile.followers')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{seguidoresStats.following}</span>
                            <span className="stat-label">{t('profile.following_stat')}</span>
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="profile-content-section mt-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="section-title mb-0">{t('profile.publications')}</h5>
                        {esMiPerfil && (
                            <button className="btn btn-outline-primary rounded-pill fw-bold btn-sm shadow-sm px-3" onClick={() => setModalPublicacion(true)}>
                                <i className="bi bi-plus-lg me-1"></i> {t('profile.new_post')}
                            </button>
                        )}
                    </div>
                    <div className="d-flex justify-content-center border-top pt-3 pb-3 mb-2 gap-4">
                        <button
                            className={`btn ${activeTab === 'fotos' ? 'text-primary fw-bold' : 'text-muted'}`}
                            style={{ border: 'none', background: 'transparent', borderBottom: activeTab === 'fotos' ? '2px solid #0d6efd' : '2px solid transparent', borderRadius: '0' }}
                            onClick={() => setActiveTab('fotos')}
                        >
                            <i className="bi bi-grid-3x3 me-2"></i> {t('profile.photos_tab')}
                        </button>
                        <button
                            className={`btn ${activeTab === 'textos' ? 'text-primary fw-bold' : 'text-muted'}`}
                            style={{ border: 'none', background: 'transparent', borderBottom: activeTab === 'textos' ? '2px solid #0d6efd' : '2px solid transparent', borderRadius: '0' }}
                            onClick={() => setActiveTab('textos')}
                        >
                            <i className="bi bi-justify-left me-2"></i> {t('profile.texts_tab')}
                        </button>
                        {esMiPerfil && (
                            <button
                                className={`btn ${activeTab === 'guardados' ? 'text-primary fw-bold' : 'text-muted'}`}
                                style={{ border: 'none', background: 'transparent', borderBottom: activeTab === 'guardados' ? '2px solid #0d6efd' : '2px solid transparent', borderRadius: '0' }}
                                onClick={() => setActiveTab('guardados')}
                            >
                                <i className="bi bi-bookmark-fill me-2"></i> {t('profile.saved_tab')}
                            </button>
                        )}
                    </div>

                    {activeTab === 'fotos' ? (
                        <PhotoGrid
                            publicaciones={publicaciones}
                            abrirVisor={abrirVisor}
                            nombreMostrar={nombreMostrar}
                            esMiPerfil={esMiPerfil}
                            setModalPublicacion={setModalPublicacion}
                            manejarEliminar={manejarEliminar}
                        />
                    ) : activeTab === 'textos' ? (
                        <TextFeed
                            publicaciones={publicaciones}
                            usuario={usuario}
                            nombreMostrar={nombreMostrar}
                            avatarUrl={avatarUrl}
                            avatarFallback={avatarFallback}
                            esMiPerfil={esMiPerfil}
                            setModalPublicacion={setModalPublicacion}
                            manejarLike={manejarLike}
                            toggleComentariosTexto={toggleComentariosTexto}
                            comentariosTextosAbiertos={comentariosTextosAbiertos}
                            comentariosTextos={comentariosTextos}
                            nuevosComentariosTextos={nuevosComentariosTextos}
                            setNuevosComentariosTextos={setNuevosComentariosTextos}
                            manejarEnviarComentarioTexto={manejarEnviarComentarioTexto}
                            enviandoComentarioTexto={enviandoComentarioTexto}
                            manejarEliminarTexto={manejarEliminar}
                            manejarGuardarTexto={manejarGuardar}
                            manejarReportarTexto={manejarReportar}
                        />
                    ) : activeTab === 'guardados' && esMiPerfil ? (
                        <div className="mt-4">
                            {publicacionesGuardadas.length === 0 ? (
                                <div className="text-center p-5 text-muted">
                                    <i className="bi bi-bookmark fs-1"></i>
                                    <p className="mt-2 text-muted">{t('profile.no_saved')}</p>
                                </div>
                            ) : (
                                <>
                                    <h6 className="text-secondary fw-bold mb-3 mt-2 ps-2 border-start border-3 border-primary">{t('profile.saved_photos')}</h6>
                                    <PhotoGrid
                                        publicaciones={publicacionesGuardadas}
                                        abrirVisor={abrirVisor}
                                        nombreMostrar={nombreMostrar}
                                        esMiPerfil={esMiPerfil}
                                        setModalPublicacion={setModalPublicacion}
                                        manejarEliminar={manejarEliminar}
                                    />

                                    <h6 className="text-secondary fw-bold mb-3 mt-5 ps-2 border-start border-3 border-primary">{t('profile.saved_texts')}</h6>
                                    <TextFeed
                                        publicaciones={publicacionesGuardadas}
                                        usuario={usuario}
                                        nombreMostrar={nombreMostrar}
                                        avatarUrl={avatarUrl}
                                        avatarFallback={avatarFallback}
                                        esMiPerfil={esMiPerfil}
                                        setModalPublicacion={setModalPublicacion}
                                        manejarLike={manejarLike}
                                        toggleComentariosTexto={toggleComentariosTexto}
                                        comentariosTextosAbiertos={comentariosTextosAbiertos}
                                        comentariosTextos={comentariosTextos}
                                        nuevosComentariosTextos={nuevosComentariosTextos}
                                        setNuevosComentariosTextos={setNuevosComentariosTextos}
                                        manejarEnviarComentarioTexto={manejarEnviarComentarioTexto}
                                        enviandoComentarioTexto={enviandoComentarioTexto}
                                        manejarEliminarTexto={manejarEliminar}
                                        manejarGuardarTexto={manejarGuardar}
                                        manejarReportarTexto={manejarReportar}
                                    />
                                </>
                            )}
                        </div>
                    ) : null}
                </div>

            </div>

            {/* Modal de edición de perfil */}
            {editando && (
                <EditProfileModal
                    usuario={usuario}
                    perfil={perfil}
                    setPerfil={setPerfil}
                    onClose={() => setEditando(false)}
                />
            )}

            {/* Modal de CREAR PUBLICACIÓN */}
            {modalPublicacion && (
                <CreatePostModal
                    usuario={usuario}
                    perfil={perfil}
                    onClose={() => setModalPublicacion(false)}
                    avatarUrl={avatarUrl}
                    avatarFallback={avatarFallback}
                    onPostCreated={(nueva) => setPublicaciones([nueva, ...publicaciones])}
                />
            )}

            {/* PREMIUM IMAGE VIEWER MODAL */}
            {fotoAmpliada && (
                <PhotoViewerModal
                    fotoAmpliada={fotoAmpliada}
                    setFotoAmpliada={setFotoAmpliada}
                    usuario={usuario}
                    nombreMostrar={nombreMostrar}
                    avatarUrl={avatarUrl}
                    avatarFallback={avatarFallback}
                    manejarLike={manejarLike}
                    comentariosVisor={comentariosVisor}
                    setComentariosVisor={setComentariosVisor}
                    cargandoComentarios={cargandoComentarios}
                    publicaciones={publicaciones}
                    setPublicaciones={setPublicaciones}
                    manejarEliminar={manejarEliminar}
                    manejarGuardar={manejarGuardar}
                    manejarReportar={manejarReportar}
                />
            )}

            {/* Modal de Reporte */}
            {reportModalVisible && postAReportar && (
                <ReportModal
                    postId={postAReportar}
                    reporterId={usuario.id}
                    onClose={() => {
                        setReportModalVisible(false);
                        setPostAReportar(null);
                    }}
                />
            )}

            {/* Modal de Confirmación de Unfollow */}
            {mostrarModalUnfollow && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '350px' }}>
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className="mb-3 mt-2">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="rounded-circle" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="bg-secondary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                                            {avatarFallback}
                                        </div>
                                    )}
                                </div>
                                <h5 className="mb-2 fw-bold" style={{ fontSize: '1.1rem' }}>{t('profile.unfollow_title', { username: perfil?.username || t('profile.default_username') })}</h5>
                                <p className="text-muted mb-4 small" style={{ fontSize: '0.9rem' }}>{t('profile.unfollow_desc')}</p>

                                <button
                                    className="btn btn-danger w-100 rounded-pill fw-bold mb-2 py-2"
                                    onClick={confirmarUnfollow}
                                    disabled={cargandoFollow}
                                >
                                    {cargandoFollow ? <span className="spinner-border spinner-border-sm"></span> : t('profile.unfollow_btn')}
                                </button>
                                <button
                                    className="btn btn-light w-100 rounded-pill fw-bold py-2 border"
                                    onClick={() => setMostrarModalUnfollow(false)}
                                    disabled={cargandoFollow}
                                >
                                    {t('profile.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;

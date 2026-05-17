import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CreatePostArea from '../components/home/CreatePostArea';
import FeedPost from '../components/home/FeedPost';
import { ReportModal } from '../components/profile/ReportModal';
import { servicioPublicaciones } from '../services/postService';
import { servicioPerfil } from '../services/profileService';
import { servicioEntrenamientos } from '../services/workoutService';
import { useAuth } from '../context/AuthContext';
import MuscleProgressModal from '../components/profile/MuscleProgressModal';
import GymMapModal from '../components/home/GymMapModal';
import FitCoachModal from '../components/home/FitCoachModal';
import { useTranslation } from 'react-i18next';
import './UserHome.css';

const UserHome = () => {
    const { usuario } = useAuth();
    const { t } = useTranslation();
    const [publicaciones, setPublicaciones] = useState([]);
    const [textoNuevaPublicacion, setTextoNuevaPublicacion] = useState('');
    const [feedTab, setFeedTab] = useState('para-ti');
    const [siguiendoIds, setSiguiendoIds] = useState([]);
    const [contactos, setContactos] = useState([]);

    const [heatmapData, setHeatmapData] = useState({});
    const [modalEntreno, setModalEntreno] = useState(false);
    const [modalGyms, setModalGyms] = useState(false);
    const [modalCoach, setModalCoach] = useState(false);

    // Estados para subida de fotos
    const [imagenPublicacion, setImagenPublicacion] = useState(null);
    const [previewImagen, setPreviewImagen] = useState(null);
    const [subiendoPublicacion, setSubiendoPublicacion] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [postAReportar, setPostAReportar] = useState(null);
    const fotoInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    const resetFileInputs = () => {
        if (fotoInputRef.current) fotoInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    // Estado para comentarios {postId: [array de comentarios]}
    const [comentarios, setComentarios] = useState({});
    // Estado para saber qué post tiene la sección de comentarios abierta
    const [comentariosAbiertos, setComentariosAbiertos] = useState({});
    // Estado para el texto del nuevo comentario {postId: "texto..."}
    const [nuevosComentarios, setNuevosComentarios] = useState({});
    // Estado de carga al enviar comentario
    const [enviandoComentario, setEnviandoComentario] = useState({});

    const cargarHeatmap = async () => {
        const historial = await servicioEntrenamientos.obtenerHistorial(usuario.id, 30);
        const heatmap = servicioEntrenamientos.calcularHeatmap(historial);
        setHeatmapData(heatmap);
    };

    useEffect(() => {
        const cargarDatos = async () => {
            const data = await servicioPublicaciones.obtenerPublicaciones();

            // Cargar a quién sigo para poder filtrar
            const mSigo = await servicioPerfil.obtenerSiguiendoIds(usuario.id);
            setSiguiendoIds(mSigo);

            // Cargar likes, comentarios y guardados iniciales para cada publicación
            const postsConMetadatos = await Promise.all(data.map(async (post) => {
                const { count: likesCount } = await servicioPublicaciones.obtenerLikesDePublicacion(post.id);
                const diLike = await servicioPublicaciones.verificarSiDiLike(post.id, usuario.id);
                const loGuarde = await servicioPublicaciones.verificarSiGuardado(post.id, usuario.id);
                const commentsCount = await servicioPublicaciones.obtenerCantidadComentariosDePublicacion(post.id);
                return { ...post, likesCount: likesCount || 0, likedByMe: diLike, savedByMe: loGuarde, commentsCount: commentsCount || 0 };
            }));

            setPublicaciones(postsConMetadatos);

            // Cargar los perfiles reales de los contactos (los que sigo)
            if (mSigo.length > 0) {
                const perfilesContactos = await Promise.all(
                    mSigo.map(id => servicioPerfil.obtenerPerfil(id))
                );
                setContactos(perfilesContactos.filter(Boolean));
            }

        };
        cargarDatos();
        cargarHeatmap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario.id]);

    const manejarCrearPublicacion = async (e) => {
        // Permitir envío con click en un botón (el evento no tendría key)
        if (e && e.type === 'keydown' && e.key !== 'Enter') return;
        if (e && e.preventDefault) e.preventDefault();

        if (!textoNuevaPublicacion.trim() && !imagenPublicacion) return;

        setSubiendoPublicacion(true);
        setError('');
        setExito('');

        try {
            let imageUrl = null;
            let filePathUpload = null;

            if (imagenPublicacion) {
                const resultado = await servicioPublicaciones.subirMediaPublicacion(imagenPublicacion, usuario.id);
                if (resultado) {
                    imageUrl = resultado.publicUrl;
                    filePathUpload = resultado.filePath;
                } else {
                    throw new Error("Error al subir la imagen al bucket.");
                }
            }

            const nombreAutor = usuario?.user_metadata?.nombre_usuario || usuario?.email?.split('@')[0] || 'Anónimo';

            const nueva = await servicioPublicaciones.crearPublicacion(
                usuario.id,
                nombreAutor,
                textoNuevaPublicacion,
                imageUrl
            );

            if (nueva) {
                // Agregar autor falseado para que se vea inmediatamente
                const publicacionConAutor = {
                    ...nueva,
                    user: { raw_user_meta_data: { nombre_usuario: nombreAutor } }
                }
                setPublicaciones([publicacionConAutor, ...publicaciones]);
                setTextoNuevaPublicacion('');
                setImagenPublicacion(null);
                setPreviewImagen(null);
                setExito(t('userHome.post_success'));
                setTimeout(() => setExito(''), 3000);
            } else {
                if (filePathUpload) {
                    await servicioPublicaciones.eliminarImagenPublicacion(filePathUpload);
                }
                throw new Error("Error al guardar la publicación en la base de datos.");
            }
        } catch (err) {
            console.error("Error al crear publicacion", err);
            setError(t('userHome.post_error'));
        } finally {
            setSubiendoPublicacion(false);
            resetFileInputs();
        }
    };

    const manejarSeleccionImagen = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const esVideo = archivo.type.startsWith('video/');
        const sizeLimit = esVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB video, 5MB imagen
        if (archivo.size > sizeLimit) {
            setError(esVideo ? t('userHome.video_too_large') : t('userHome.image_too_large'));
            resetFileInputs();
            return;
        }

        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm'];
        const fileName = archivo.name.toLowerCase();
        if (!validExtensions.some(ext => fileName.endsWith(ext))) {
            setError(t('userHome.format_error'));
            resetFileInputs();
            return;
        }

        setImagenPublicacion(archivo);
        setPreviewImagen(URL.createObjectURL(archivo));
        setError('');
    };

    const publicacionesFiltradas = publicaciones.filter((p) => {
        if (feedTab === 'para-ti') {
            return true; // "Para ti" muestra todo
        } else if (feedTab === 'siguiendo') {
            return siguiendoIds.includes(p.user_id); // "Siguiendo" excluye lo propio que no sigas
        }
        return true;
    });

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
        }
    };

    const manejarGuardar = async (postId) => {
        const postIndex = publicaciones.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = publicaciones[postIndex];
        const nuevoEstadoGuardado = !post.savedByMe;

        // Optimistic update
        const nuevasPublicaciones = [...publicaciones];
        nuevasPublicaciones[postIndex] = {
            ...post,
            savedByMe: nuevoEstadoGuardado
        };
        setPublicaciones(nuevasPublicaciones);

        try {
            if (nuevoEstadoGuardado) {
                await servicioPublicaciones.guardarPublicacion(postId, usuario.id);
            } else {
                await servicioPublicaciones.quitarGuardado(postId, usuario.id);
            }
        } catch (error) {
            console.error("Error al cambiar guardado:", error);
            setPublicaciones(publicaciones); // revert
        }
    };

    const toggleComentarios = async (postId) => {
        // Si ya están abiertos, los cerramos
        if (comentariosAbiertos[postId]) {
            setComentariosAbiertos(prev => ({ ...prev, [postId]: false }));
            return;
        }

        // Si los vamos a abrir, primero mostramos el cargando (o vacío)
        setComentariosAbiertos(prev => ({ ...prev, [postId]: true }));

        // Si no los hemos cargado antes, los obtenemos de la BBDD
        if (!comentarios[postId]) {
            const commentsData = await servicioPublicaciones.obtenerComentariosDePublicacion(postId);
            setComentarios(prev => ({ ...prev, [postId]: commentsData }));
        }
    };

    const manejarEnviarComentario = async (postId) => {
        const texto = nuevosComentarios[postId];
        if (!texto || !texto.trim() || enviandoComentario[postId]) return;

        setEnviandoComentario(prev => ({ ...prev, [postId]: true }));

        try {
            const nuevoComentario = await servicioPublicaciones.agregarComentario(postId, usuario.id, texto);
            if (nuevoComentario) {
                // Actualizar la lista de comentarios local
                setComentarios(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), nuevoComentario]
                }));
                // Limpiar el input
                setNuevosComentarios(prev => ({ ...prev, [postId]: '' }));

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
            console.error("Error al enviar comentario", err);
        } finally {
            setEnviandoComentario(prev => ({ ...prev, [postId]: false }));
        }
    };

    const manejarEliminar = async (postId, imageUrl = null) => {
        try {
            // Eliminar del backend (DB y Storage)
            const exito = await servicioPublicaciones.eliminarPublicacion(postId, usuario.id, imageUrl);

            if (exito) {
                // Actualización optimista: quitarlo de la lista local
                setPublicaciones(prev => prev.filter(p => p.id !== postId));
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

    return (
        <div className="client-container">
            <Navbar />

            <div className="home-grid">

                <div className="left-sidebar">
                    <div className="d-flex align-items-center gap-3 mb-4 p-2">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                            {(usuario?.user_metadata?.nombre_usuario || usuario?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-bold">{usuario?.user_metadata?.nombre_usuario || usuario?.email?.split('@')[0] || 'Cliente'}</span>
                    </div>

                    <a href="#" className="sidebar-nav-item">
                        <i className="bi bi-people-fill text-primary"></i> {t('userHome.friends')}
                    </a>
                    <button className="sidebar-nav-item border-0 bg-transparent text-start w-100" onClick={() => setModalEntreno(true)}>
                        <i className="bi bi-fire text-danger"></i> {t('userHome.muscle_progress')}
                    </button>
                    <button className="sidebar-nav-item border-0 bg-transparent text-start w-100" onClick={() => setModalGyms(true)}>
                        <i className="bi bi-geo-alt-fill text-success"></i> {t('userHome.gyms')}
                    </button>
                    <a href="#" className="sidebar-nav-item">
                        <i className="bi bi-calendar-event-fill text-danger"></i> {t('userHome.events')}
                    </a>
                    <a href="#" className="sidebar-nav-item">
                        <i className="bi bi-shop text-info"></i> {t('userHome.gym_shop')}
                    </a>
                    <button className="sidebar-nav-item border-0 bg-transparent text-start w-100" onClick={() => setModalCoach(true)}>
                        <i className="bi bi-robot" style={{ color: '#0d6efd' }}></i> {t('userHome.fitcoach')}
                        <span className="badge bg-primary ms-2 animate-pulse" style={{ fontSize: '0.6rem' }}>IA</span>
                    </button>

                    <div className="border-top my-2"></div>

                    <Link to="/settings" className="sidebar-nav-item text-decoration-none">
                        <i className="bi bi-gear-fill text-secondary"></i> {t('userHome.settings')}
                    </Link>
                </div>

                <div className="feed-column">

                    <CreatePostArea
                        usuario={usuario}
                        textoNuevaPublicacion={textoNuevaPublicacion}
                        setTextoNuevaPublicacion={setTextoNuevaPublicacion}
                        manejarCrearPublicacion={manejarCrearPublicacion}
                        subiendoPublicacion={subiendoPublicacion}
                        error={error}
                        exito={exito}
                        previewImagen={previewImagen}
                        imagenPublicacion={imagenPublicacion}
                        setImagenPublicacion={setImagenPublicacion}
                        setPreviewImagen={setPreviewImagen}
                        resetFileInputs={resetFileInputs}
                        fotoInputRef={fotoInputRef}
                        videoInputRef={videoInputRef}
                        manejarSeleccionImagen={manejarSeleccionImagen}
                    />

                    <div className="d-flex justify-content-center border-bottom mb-4">
                        <button
                            className={`btn fw-bold px-4 py-2 ${feedTab === 'para-ti' ? 'text-primary' : 'text-muted'}`}
                            style={{ border: 'none', background: 'transparent', borderBottom: feedTab === 'para-ti' ? '3px solid #0d6efd' : '3px solid transparent', borderRadius: '0' }}
                            onClick={() => setFeedTab('para-ti')}
                        >
                            {t('userHome.for_you')}
                        </button>
                        <button
                            className={`btn fw-bold px-4 py-2 ${feedTab === 'siguiendo' ? 'text-primary' : 'text-muted'}`}
                            style={{ border: 'none', background: 'transparent', borderBottom: feedTab === 'siguiendo' ? '3px solid #0d6efd' : '3px solid transparent', borderRadius: '0' }}
                            onClick={() => setFeedTab('siguiendo')}
                        >
                            {t('userHome.following')}
                        </button>
                    </div>

                    {Array.isArray(publicacionesFiltradas) && publicacionesFiltradas.length > 0 ? (
                        publicacionesFiltradas.map(publicacion => (
                            <FeedPost
                                key={publicacion.id}
                                publicacion={publicacion}
                                usuario={usuario}
                                manejarLike={manejarLike}
                                toggleComentarios={toggleComentarios}
                                comentariosAbiertos={comentariosAbiertos}
                                comentarios={comentarios}
                                nuevosComentarios={nuevosComentarios}
                                setNuevosComentarios={setNuevosComentarios}
                                enviandoComentario={enviandoComentario}
                                manejarEnviarComentario={manejarEnviarComentario}
                                manejarEliminar={manejarEliminar}
                                manejarGuardar={manejarGuardar}
                                manejarReportar={manejarReportar}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4">
                            <i className="bi bi-inbox fs-1 text-muted"></i>
                            <p className="text-muted mt-2">{t('userHome.no_posts')}</p>
                        </div>
                    )}
                </div>

                <div className="right-sidebar">
                    <h6 className="text-secondary fw-bold mb-3">{t('userHome.advertising')}</h6>
                    <div className="mb-4">
                        <div style={{ height: '150px', background: 'var(--fn-hover)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--fn-border)' }}></div>
                        <small className="fw-bold" style={{ color: 'var(--fn-text-main)' }}>{t('userHome.premium_protein')}</small>
                        <p className="small" style={{ color: 'var(--fn-text-muted)' }}>{t('userHome.premium_desc')}</p>
                    </div>

                    <h6 className="fw-bold mb-3" style={{ color: 'var(--fn-text-muted)' }}>{t('userHome.contacts')}</h6>
                    {contactos.length > 0 ? (
                        contactos.map(contacto => (
                            <Link to={`/profile/${contacto.id}`} key={contacto.id} className="text-decoration-none d-flex align-items-center gap-3 mb-3 p-2 rounded" style={{ cursor: 'pointer', color: 'var(--fn-text-main)' }}>
                                <div className="position-relative">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '36px', height: '36px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold' }}>
                                        {contacto.avatar_url ? (
                                            <img src={contacto.avatar_url} alt="Avatar" className="w-100 h-100 rounded-circle object-fit-cover" />
                                        ) : (
                                            (contacto.username || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="position-absolute bg-success rounded-circle" style={{ width: '10px', height: '10px', bottom: 0, right: 0, border: '2px solid var(--fn-card-bg)' }}></div>
                                </div>
                                <span className="fw-bold small">{contacto.username || 'Usuario'}</span>
                            </Link>
                        ))
                    ) : (
                        <p className="small" style={{ color: 'var(--fn-text-muted)' }}>{t('userHome.no_contacts')}</p>
                    )}
                </div>
            </div>

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

            {modalEntreno && (
                <MuscleProgressModal 
                    usuario={usuario}
                    onClose={() => setModalEntreno(false)}
                    heatmapData={heatmapData}
                    onWorkoutLogged={() => cargarHeatmap()} 
                />
            )}

            {modalGyms && (
                <GymMapModal onClose={() => setModalGyms(false)} />
            )}

            {modalCoach && (
                <FitCoachModal 
                    usuario={usuario} 
                    onClose={() => setModalCoach(false)} 
                />
            )}
        </div >
    );
};

export default UserHome;

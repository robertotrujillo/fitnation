import React, { useState } from 'react';
import { servicioPublicaciones } from '../../services/postService';

const PhotoViewerModal = ({
    fotoAmpliada,
    setFotoAmpliada,
    usuario,
    nombreMostrar,
    avatarUrl,
    avatarFallback,
    manejarLike,
    comentariosVisor,
    setComentariosVisor,
    cargandoComentarios,
    publicaciones,
    setPublicaciones,
    manejarEliminar,
    manejarGuardar,
    manejarReportar
}) => {
    const [nuevoComentarioVisor, setNuevoComentarioVisor] = useState('');
    const [enviandoComentario, setEnviandoComentario] = useState(false);

    const enviarComentarioVisor = async () => {
        if (!nuevoComentarioVisor.trim() || !fotoAmpliada || enviandoComentario) return;

        setEnviandoComentario(true);
        try {
            const nuevo = await servicioPublicaciones.agregarComentario(fotoAmpliada.id, usuario.id, nuevoComentarioVisor);
            if (nuevo) {
                setComentariosVisor([...comentariosVisor, nuevo]);
                setNuevoComentarioVisor('');

                // Actualizar optimísticamente la cuenta de comentarios
                const nuevaCantidad = (fotoAmpliada.commentsCount || 0) + 1;
                setFotoAmpliada({ ...fotoAmpliada, commentsCount: nuevaCantidad });

                const postIndex = publicaciones.findIndex(p => p.id === fotoAmpliada.id);
                if (postIndex !== -1) {
                    const nuevasPublicaciones = [...publicaciones];
                    nuevasPublicaciones[postIndex] = {
                        ...nuevasPublicaciones[postIndex],
                        commentsCount: nuevaCantidad
                    };
                    setPublicaciones(nuevasPublicaciones);
                }
            }
        } catch (error) {
            console.error("Error enviando comentario:", error);
        } finally {
            setEnviandoComentario(false);
        }
    };

    if (!fotoAmpliada) return null;

    return (
        <div
            className="viewer-overlay"
            onClick={() => setFotoAmpliada(null)}
        >
            <button
                className="viewer-close-btn"
                onClick={() => setFotoAmpliada(null)}
            >
                <i className="bi bi-x-lg"></i>
            </button>

            <div
                className="viewer-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="viewer-image-section" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {fotoAmpliada.image_url?.match(/\.(mp4|webm|ogg)$/i) || (fotoAmpliada.image_url?.includes('token=') && fotoAmpliada.image_url?.includes('.mp4')) ? (
                        <video
                            src={fotoAmpliada.image_url}
                            controls
                            autoPlay
                            className="img-fluid"
                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <div
                            className="viewer-image"
                            style={{ backgroundImage: `url(${fotoAmpliada.image_url})` }}
                        ></div>
                    )}
                </div>

                <div className="viewer-details-section">
                    <div className="viewer-header">
                        <div className="viewer-avatar overflow-hidden d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)' }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                avatarFallback
                            )}
                        </div>
                        <div className="viewer-user-info">
                            <h6 className="viewer-username">{nombreMostrar}</h6>
                            <span className="viewer-location">Gimnasio FitNation</span>
                        </div>
                        <div className="dropdown ms-auto">
                            <button className="btn btn-link text-white p-0 text-decoration-none" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="bi bi-three-dots"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                {usuario?.id === fotoAmpliada.user_id && (
                                    <li>
                                        <button
                                            className="dropdown-item text-danger d-flex align-items-center gap-2"
                                            onClick={() => {
                                                if (window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
                                                    if (manejarEliminar) manejarEliminar(fotoAmpliada.id, fotoAmpliada.image_url);
                                                }
                                            }}
                                        >
                                            <i className="bi bi-trash-fill"></i> Eliminar
                                        </button>
                                    </li>
                                )}
                                <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => manejarReportar && manejarReportar(fotoAmpliada.id)}><i className="bi bi-flag"></i> Reportar</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="viewer-comments-area">
                        {fotoAmpliada.texto && (
                            <div className="viewer-comment">
                                <div className="viewer-avatar-small overflow-hidden d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold' }}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        avatarFallback
                                    )}
                                </div>
                                <div className="viewer-comment-content">
                                    <span className="fw-bold me-2">{nombreMostrar}</span>
                                    <span className="text-break-force">{fotoAmpliada.texto}</span>
                                    <div className="viewer-comment-meta mt-1">
                                        <span>{new Date(fotoAmpliada.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Placeholder de comentarios y Lista de comentarios */}
                        {cargandoComentarios ? (
                            <div className="d-flex justify-content-center py-4">
                                <div className="spinner-border text-light" role="status"></div>
                            </div>
                        ) : comentariosVisor.length > 0 ? (
                            <div className="viewer-comments-list" style={{ flex: 1, overflowY: 'auto' }}>
                                {comentariosVisor.map(comentario => (
                                    <div key={comentario.id} className="viewer-comment mb-3">
                                        <div className="viewer-avatar-small overflow-hidden d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold' }}>
                                            {comentario.profiles?.avatar_url ? (
                                                <img src={comentario.profiles.avatar_url} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                (comentario.profiles?.username || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="viewer-comment-content">
                                            <span className="fw-bold me-2">{comentario.profiles?.username || 'Usuario'}</span>
                                            <span className="text-break-force">{comentario.text}</span>
                                            <div className="viewer-comment-meta mt-1">
                                                <span>{new Date(comentario.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="viewer-no-comments">
                                <i className="bi bi-chat-square-text text-muted mb-2 fs-3"></i>
                                <p className="text-muted small">Aún no hay comentarios.</p>
                            </div>
                        )}
                    </div>

                    <div className="viewer-actions-section">
                        <div className="viewer-actions">
                            <button
                                className={`viewer-action-btn ${fotoAmpliada.likedByMe ? 'text-danger' : ''}`}
                                onClick={() => manejarLike(fotoAmpliada.id)}
                                style={{ border: 'none', background: 'transparent' }}
                            >
                                <i className={fotoAmpliada.likedByMe ? "bi bi-heart-fill" : "bi bi-heart"}></i>
                            </button>
                            <button className="viewer-action-btn"><i className="bi bi-chat"></i></button>
                            <button className="viewer-action-btn"><i className="bi bi-send"></i></button>
                            <button
                                className={`viewer-action-btn ms-auto ${fotoAmpliada.savedByMe ? 'text-primary' : ''}`}
                                onClick={() => manejarGuardar && manejarGuardar(fotoAmpliada.id)}
                            >
                                <i className={fotoAmpliada.savedByMe ? "bi bi-bookmark-fill" : "bi bi-bookmark"}></i>
                            </button>
                        </div>
                        <div className="viewer-likes d-flex gap-3">
                            <span>{fotoAmpliada.likesCount || 0} Me gusta</span>
                            {fotoAmpliada.commentsCount > 0 && (
                                <span>{fotoAmpliada.commentsCount} {fotoAmpliada.commentsCount === 1 ? 'comentario' : 'comentarios'}</span>
                            )}
                        </div>
                        <div className="viewer-date">{new Date(fotoAmpliada.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="viewer-add-comment">
                        <i className="bi bi-emoji-smile fs-5 text-white"></i>
                        <input
                            type="text"
                            placeholder="Añade un comentario..."
                            className="viewer-comment-input bg-transparent text-white border-0"
                            style={{ flex: 1, outline: 'none' }}
                            value={nuevoComentarioVisor}
                            onChange={(e) => setNuevoComentarioVisor(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && enviarComentarioVisor()}
                            disabled={enviandoComentario}
                        />
                        <button
                            className="viewer-post-btn text-primary bg-transparent border-0 fw-bold"
                            onClick={enviarComentarioVisor}
                            disabled={!nuevoComentarioVisor.trim() || enviandoComentario}
                        >
                            {enviandoComentario ? 'Publicando' : 'Publicar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoViewerModal;

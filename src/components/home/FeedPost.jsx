import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PostComments from './PostComments';
import { useTranslation } from 'react-i18next';
import { translateText, detectLanguage } from '../../services/translationService';

const FeedPost = ({
    publicacion,
    usuario,
    manejarLike,
    toggleComentarios,
    comentariosAbiertos,
    comentarios,
    nuevosComentarios,
    setNuevosComentarios,
    enviandoComentario,
    manejarEnviarComentario,
    manejarEliminar,
    manejarGuardar,
    manejarReportar
}) => {
    const { t, i18n } = useTranslation();
    const [textoTraducido, setTextoTraducido] = useState(null);
    const [traduciendo, setTraduciendo] = useState(false);
    const [mostrarTraduccion, setMostrarTraduccion] = useState(false);

    const handleTranslate = async () => {
        if (mostrarTraduccion) {
            setMostrarTraduccion(false);
            return;
        }
        if (textoTraducido) {
            setMostrarTraduccion(true);
            return;
        }
        setTraduciendo(true);
        try {
            const sourceLang = detectLanguage(publicacion.texto);
            const targetLang = sourceLang === 'es' ? 'en' : 'es';
            const result = await translateText(publicacion.texto, sourceLang, targetLang);
            setTextoTraducido(result);
            setMostrarTraduccion(true);
        } catch {
            setTextoTraducido(t('feedPost.translation_error'));
            setMostrarTraduccion(true);
        } finally {
            setTraduciendo(false);
        }
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <div className="post-author-info">
                    <Link to={`/profile/${publicacion.user_id}`} className="text-decoration-none d-flex align-items-center gap-2" style={{ color: 'var(--fn-text-main)' }}>
                        <div className="post-avatar">
                            {(publicacion.user?.raw_user_meta_data?.nombre_usuario || publicacion.nombre_autor || publicacion.nombreAutor || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h6 className="author-name mb-0 text-decoration-underline-hover">
                                {publicacion.user?.raw_user_meta_data?.nombre_usuario || publicacion.nombre_autor || publicacion.nombreAutor || t('feedPost.anonymous')}
                            </h6>
                            {/* eslint-disable-next-line react-hooks/purity */}
                            <span className="post-time">{new Date(publicacion.created_at || publicacion.fechaCreacion || Date.now()).toLocaleDateString()}</span>
                        </div>
                    </Link>
                </div>
                {/* Dropdown menu for post actions */}
                <div className="dropdown">
                    <button className="btn btn-link p-0" style={{ color: 'var(--fn-text-muted)' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="bi bi-three-dots fs-5"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}>
                        {/* Only show "Eliminar" if the current user is the author of the post */}
                        {usuario?.id === publicacion.user_id && (
                            <li>
                                <button
                                    className="dropdown-item text-danger d-flex align-items-center gap-2"
                                    onClick={() => {
                                        if (window.confirm(t('feedPost.confirm_delete'))) {
                                            if (manejarEliminar) manejarEliminar(publicacion.id, publicacion.image_url);
                                        }
                                    }}
                                >
                                    <i className="bi bi-trash-fill"></i> {t('feedPost.delete')}
                                </button>
                            </li>
                        )}
                        <li><button className="dropdown-item d-flex align-items-center gap-2 dropdown-item-custom-hover" style={{ color: 'var(--fn-text-main)' }} onClick={() => manejarReportar && manejarReportar(publicacion.id)}><i className="bi bi-flag"></i> {t('feedPost.report')}</button></li>
                    </ul>
                </div>
            </div>

            <div className="post-content">
                {publicacion.texto && (
                    <>
                        <p className="text-break-force">{publicacion.texto}</p>
                        {mostrarTraduccion && textoTraducido && (
                            <p className="text-break-force text-muted fst-italic small mt-1 mb-0">{textoTraducido}</p>
                        )}
                        <button
                            className="btn btn-link btn-sm p-0 text-muted text-decoration-none fw-semibold"
                            onClick={handleTranslate}
                            disabled={traduciendo}
                            style={{ fontSize: '0.8rem' }}
                        >
                            {traduciendo ? t('feedPost.translating') : mostrarTraduccion ? t('feedPost.hide_translation') : t('feedPost.see_translation')}
                        </button>
                    </>
                )}
                {publicacion.image_url && (
                    <div className="post-media-container rounded overflow-hidden mt-2 mb-3 bg-dark d-flex justify-content-center">
                        {publicacion.image_url.match(/\.(mp4|webm|ogg)$/i) || (publicacion.image_url.includes('token=') && publicacion.image_url.includes('.mp4')) ? (
                            <video
                                src={publicacion.image_url}
                                controls
                                className="img-fluid w-100"
                                style={{ maxHeight: '500px', objectFit: 'contain' }}
                                preload="metadata"
                            />
                        ) : (
                            <img src={publicacion.image_url} alt={t('feedPost.post_alt')} loading="lazy" className="img-fluid w-100" style={{ maxHeight: '500px', objectFit: 'contain' }} />
                        )}
                    </div>
                )}
            </div>

            <div className="post-footer">
                <div className="post-stats d-flex justify-content-between text-muted fs-6">
                    <div>
                        {publicacion.likesCount > 0 && (
                            <span><i className="bi bi-hand-thumbs-up-fill text-primary"></i> {publicacion.likesCount}</span>
                        )}
                    </div>
                    <div>
                        {publicacion.commentsCount > 0 && (
                            <span
                                style={{ cursor: 'pointer' }}
                                className="text-decoration-underline-hover ms-3"
                                onClick={() => toggleComentarios(publicacion.id)}
                            >
                                {publicacion.commentsCount} {publicacion.commentsCount === 1 ? t('feedPost.comment') : t('feedPost.comments')}
                            </span>
                        )}
                    </div>
                </div>
                <div className="post-actions">
                    <button
                        className={`post-action-btn ${publicacion.likedByMe ? 'text-primary' : ''}`}
                        onClick={() => manejarLike(publicacion.id)}
                    >
                        <i className={publicacion.likedByMe ? "bi bi-hand-thumbs-up-fill" : "bi bi-hand-thumbs-up"}></i> {t('feedPost.like')}
                    </button>
                    <button
                        className="post-action-btn"
                        onClick={() => toggleComentarios(publicacion.id)}
                    >
                        <i className="bi bi-chat"></i> {t('feedPost.comment_btn')}
                    </button>
                    <button
                        className={`post-action-btn ${publicacion.savedByMe ? 'text-primary' : ''}`}
                        onClick={() => manejarGuardar && manejarGuardar(publicacion.id)}
                    >
                        <i className={publicacion.savedByMe ? "bi bi-bookmark-fill" : "bi bi-bookmark"}></i> {t('feedPost.save')}
                    </button>
                </div>

                <PostComments
                    publicacion={publicacion}
                    usuario={usuario}
                    comentariosAbiertos={comentariosAbiertos}
                    comentarios={comentarios}
                    nuevosComentarios={nuevosComentarios}
                    setNuevosComentarios={setNuevosComentarios}
                    enviandoComentario={enviandoComentario}
                    manejarEnviarComentario={manejarEnviarComentario}
                />
            </div>
        </div>
    );
};

export default FeedPost;

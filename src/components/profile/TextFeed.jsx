import React from 'react';
import { useTranslation } from 'react-i18next';

const TextFeed = ({
    publicaciones,
    usuario,
    nombreMostrar,
    avatarUrl,
    avatarFallback,
    esMiPerfil,
    setModalPublicacion,
    manejarLike,
    toggleComentariosTexto,
    comentariosTextosAbiertos,
    comentariosTextos,
    nuevosComentariosTextos,
    setNuevosComentariosTextos,
    manejarEnviarComentarioTexto,
    enviandoComentarioTexto,
    manejarEliminarTexto,
    manejarGuardarTexto,
    manejarReportarTexto
}) => {
    const { t } = useTranslation();
    const textos = publicaciones.filter(p => !p.image_url);

    return (
        <div className="text-posts-feed mt-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {textos.length > 0 ? (
                textos.map(post => (
                    <div key={post.id} className="card shadow-sm mb-3 border-0 rounded-4">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="rounded-circle" />
                                    ) : (
                                        avatarFallback
                                    )}
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">{nombreMostrar}</h6>
                                    {/* eslint-disable-next-line react-hooks/purity */}
                                    <small className="text-muted">{new Date(post.created_at || post.fechaCreacion || Date.now()).toLocaleDateString()}</small>
                                </div>
                                {/* Dropdown menu for text post actions */}
                                <div className="ms-auto dropdown">
                                    <button className="btn btn-link text-muted p-0 border-0 text-decoration-none" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i className="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                        {esMiPerfil && (
                                            <li>
                                                <button
                                                    className="dropdown-item text-danger d-flex align-items-center gap-2"
                                                    onClick={() => {
                                                        if (window.confirm(t('textFeed.confirm_delete'))) {
                                                            if (manejarEliminarTexto) manejarEliminarTexto(post.id);
                                                        }
                                                    }}
                                                >
                                                    <i className="bi bi-trash-fill"></i> {t('textFeed.delete')}
                                                </button>
                                            </li>
                                        )}
                                        {!esMiPerfil && (
                                            <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => manejarReportarTexto && manejarReportarTexto(post.id)}><i className="bi bi-flag"></i> {t('textFeed.report')}</button></li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <p className="card-text text-break-force">{post.texto}</p>

                            {/* Footer para posts de texto en el perfil */}
                            <div className="d-flex align-items-center mt-3 pt-3 border-top">
                                <button
                                    className={`btn btn-sm ${post.likedByMe ? 'text-primary' : 'text-muted'} me-3 p-0 border-0 bg-transparent`}
                                    onClick={() => manejarLike(post.id)}
                                >
                                    <i className={post.likedByMe ? "bi bi-heart-fill me-1" : "bi bi-heart me-1"}></i>
                                    {post.likesCount > 0 && post.likesCount} {post.likesCount === 1 ? t('textFeed.like') : (post.likesCount === 0 ? t('textFeed.like') : t('textFeed.likes'))}
                                </button>
                                <div className="d-flex align-items-center">
                                    <button
                                        className="btn btn-sm text-muted p-0 border-0 bg-transparent"
                                        onClick={() => toggleComentariosTexto(post.id)}
                                    >
                                        <i className="bi bi-chat me-1"></i> {t('textFeed.comment_btn')}
                                    </button>
                                    <button
                                        className={`btn btn-sm ${post.savedByMe ? 'text-primary' : 'text-muted'} ms-3 p-0 border-0 bg-transparent`}
                                        onClick={() => manejarGuardarTexto && manejarGuardarTexto(post.id)}
                                    >
                                        <i className={post.savedByMe ? "bi bi-bookmark-fill me-1" : "bi bi-bookmark me-1"}></i> {t('textFeed.save')}
                                    </button>
                                    {post.commentsCount > 0 && (
                                        <span
                                            className="text-muted ms-2 px-2 text-decoration-underline-hover"
                                            style={{ fontSize: '0.875rem', cursor: 'pointer' }}
                                            onClick={() => toggleComentariosTexto(post.id)}
                                        >
                                            {post.commentsCount} {post.commentsCount === 1 ? t('textFeed.comment') : t('textFeed.comments')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Sección Expandible de Comentarios en Textos */}
                            {comentariosTextosAbiertos[post.id] && (
                                <div className="mt-3 pt-3 border-top pb-3">
                                    {/* Lista de comentarios */}
                                    <div className="comments-list mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {!comentariosTextos[post.id] ? (
                                            <div className="text-center py-2"><span className="spinner-border spinner-border-sm text-primary"></span></div>
                                        ) : comentariosTextos[post.id].length === 0 ? (
                                            <p className="text-muted small text-center my-2">{t('textFeed.first_comment')}</p>
                                        ) : (
                                            comentariosTextos[post.id].map(comentario => (
                                                <div key={comentario.id} className="d-flex mb-2 align-items-start gap-2">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', fontSize: '12px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)' }}>
                                                        {comentario.profiles?.avatar_url ? (
                                                            <img src={comentario.profiles.avatar_url} alt="Avatar" className="w-100 h-100 rounded-circle object-fit-cover" />
                                                        ) : (
                                                            (comentario.profiles?.username || 'U').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="rounded p-2 px-3 fw-normal" style={{ fontSize: '13px', maxWidth: '85%', backgroundColor: 'var(--fn-hover)', color: 'var(--fn-text-main)' }}>
                                                        <span className="fw-bold me-2">{comentario.profiles?.username || t('textFeed.default_user')}</span>
                                                        <span className="text-break-force">{comentario.text}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Input para nuevo comentario */}
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '36px', height: '36px', fontSize: '14px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold' }}>
                                            {(usuario?.user_metadata?.nombre_usuario || usuario?.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control rounded-pill shadow-none px-4 py-2"
                                                style={{ fontSize: '13px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'var(--fn-input-bg)', color: 'var(--fn-text-main)', border: '1px solid var(--fn-input-border)' }}
                                                placeholder={t('textFeed.comment_placeholder')}
                                                value={nuevosComentariosTextos[post.id] || ''}
                                                onChange={(e) => setNuevosComentariosTextos(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && manejarEnviarComentarioTexto(post.id)}
                                                disabled={enviandoComentarioTexto[post.id]}
                                            />
                                            <button
                                                className="btn text-primary border-0 position-absolute end-0 top-50 translate-middle-y z-1 me-1 p-1 px-2 pb-0"
                                                onClick={() => manejarEnviarComentarioTexto(post.id)}
                                                disabled={!nuevosComentariosTextos[post.id]?.trim() || enviandoComentarioTexto[post.id]}
                                            >
                                                {enviandoComentarioTexto[post.id] ? (
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                ) : (
                                                    <i className="bi bi-send-fill fs-6"></i>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center p-5 text-muted">
                    <i className="bi bi-chat-square-text fs-1"></i>
                    <p className="mt-2 text-muted">{t('textFeed.no_posts')}</p>
                    {esMiPerfil && <button className="btn btn-outline-primary mt-2" onClick={() => setModalPublicacion(true)}>{t('textFeed.create_post')}</button>}
                </div>
            )}
        </div>
    );
};

export default TextFeed;

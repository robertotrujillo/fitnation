import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PostComments = ({
    publicacion,
    usuario,
    comentariosAbiertos,
    comentarios,
    nuevosComentarios,
    setNuevosComentarios,
    enviandoComentario,
    manejarEnviarComentario
}) => {
    const { t } = useTranslation();

    if (!comentariosAbiertos[publicacion.id]) {
        return null;
    }

    return (
        <div className="mt-3 pt-3 border-top pb-3">
            {/* Lista de comentarios */}
            <div className="comments-list mb-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {!comentarios[publicacion.id] ? (
                    <div className="text-center py-2"><span className="spinner-border spinner-border-sm text-primary"></span></div>
                ) : comentarios[publicacion.id].length === 0 ? (
                    <p className="text-muted small text-center my-2">{t('postComments.first_comment')}</p>
                ) : (
                    comentarios[publicacion.id].map(comentario => (
                        <div key={comentario.id} className="d-flex mb-2 align-items-start gap-2">
                            <Link to={`/profile/${comentario.user_id}`} className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-decoration-none" style={{ width: '30px', height: '30px', fontSize: '12px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold' }}>
                                {comentario.profiles?.avatar_url ? (
                                    <img src={comentario.profiles.avatar_url} alt="Avatar" className="w-100 h-100 rounded-circle object-fit-cover" />
                                ) : (
                                    (comentario.profiles?.username || 'U').charAt(0).toUpperCase()
                                )}
                            </Link>
                            <div className="rounded p-2 px-3 fw-normal" style={{ fontSize: '14px', maxWidth: '85%', backgroundColor: 'var(--fn-hover)', color: 'var(--fn-text-main)' }}>
                                <Link to={`/profile/${comentario.user_id}`} className="fw-bold me-2 text-decoration-underline-hover" style={{ color: 'var(--fn-text-main)' }}>
                                    {comentario.profiles?.username || t('postComments.default_user')}
                                </Link>
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
                        className="form-control rounded-pill px-4 py-2 text-body shadow-none"
                        style={{ fontSize: '14px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'var(--fn-input-bg)', color: 'var(--fn-text-main)', border: '1px solid var(--fn-input-border)' }}
                        placeholder={t('postComments.placeholder')}
                        value={nuevosComentarios[publicacion.id] || ''}
                        onChange={(e) => setNuevosComentarios(prev => ({ ...prev, [publicacion.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && manejarEnviarComentario(publicacion.id)}
                        disabled={enviandoComentario[publicacion.id]}
                    />
                    <button
                        className="btn text-primary border-0 position-absolute end-0 top-50 translate-middle-y z-1 me-1 p-1 px-2 pb-0"
                        onClick={() => manejarEnviarComentario(publicacion.id)}
                        disabled={!nuevosComentarios[publicacion.id]?.trim() || enviandoComentario[publicacion.id]}
                    >
                        {enviandoComentario[publicacion.id] ? (
                            <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                            <i className="bi bi-send-fill fs-5"></i>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostComments;

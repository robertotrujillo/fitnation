import React from 'react';
import { useTranslation } from 'react-i18next';

const CreatePostArea = ({
    usuario,
    textoNuevaPublicacion,
    setTextoNuevaPublicacion,
    manejarCrearPublicacion,
    subiendoPublicacion,
    error,
    exito,
    previewImagen,
    imagenPublicacion,
    setImagenPublicacion,
    setPreviewImagen,
    resetFileInputs,
    fotoInputRef,
    videoInputRef,
    manejarSeleccionImagen
}) => {
    const { t } = useTranslation();
    const userName = usuario?.user_metadata?.nombre_usuario || usuario?.email?.split('@')[0];

    return (
        <div className="create-post-card">
            {error && (
                <div className="alert alert-danger px-3 py-2 small mb-3">
                    {error}
                </div>
            )}
            {exito && (
                <div className="alert alert-success px-3 py-2 small mb-3">
                    {exito}
                </div>
            )}
            <div className="d-flex gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', backgroundColor: 'var(--fn-avatar-bg)', border: '1px solid var(--fn-border)', color: 'var(--fn-avatar-text)' }}>
                    {(usuario?.user_metadata?.nombre_usuario || usuario?.email || '?').charAt(0).toUpperCase()}
                </div>
                <input
                    type="text"
                    className="form-control rounded-pill shadow-none"
                    style={{ backgroundColor: 'var(--fn-input-bg)', color: 'var(--fn-text-main)', border: '1px solid var(--fn-input-border)' }}
                    placeholder={t('createPost.placeholder', { name: userName })}
                    value={textoNuevaPublicacion}
                    maxLength={500}
                    onChange={(e) => setTextoNuevaPublicacion(e.target.value)}
                    onKeyDown={manejarCrearPublicacion}
                    disabled={subiendoPublicacion}
                />
            </div>

            {previewImagen && (
                <div className="position-relative mb-3 mt-2 ms-5 border rounded overflow-hidden" style={{ maxWidth: '200px' }}>
                    {imagenPublicacion?.type?.startsWith('video/') ? (
                        <video src={previewImagen} controls className="w-100 object-fit-cover" style={{ maxHeight: '200px' }} />
                    ) : (
                        <img src={previewImagen} alt={t('createPost.preview_alt')} loading="lazy" className="w-100 object-fit-cover" />
                    )}
                    <button
                        className="btn btn-dark btn-sm rounded-circle position-absolute top-0 end-0 m-1 p-1 d-flex"
                        onClick={() => { setImagenPublicacion(null); setPreviewImagen(null); resetFileInputs(); }}
                    >
                        <i className="bi bi-x"></i>
                    </button>
                </div>
            )}

            <div className="action-buttons mt-2 pt-2 d-flex align-items-center position-relative w-100" style={{ borderTop: '1px solid var(--fn-border)' }}>
                <input
                    type="file"
                    ref={fotoInputRef}
                    style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={manejarSeleccionImagen}
                />
                <input
                    type="file"
                    ref={videoInputRef}
                    style={{ display: 'none' }}
                    accept=".mp4,.webm,video/mp4,video/webm"
                    onChange={manejarSeleccionImagen}
                />
                <button
                    className="action-btn text-success border-0 bg-transparent p-2"
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={subiendoPublicacion}
                >
                    <i className="bi bi-images me-1"></i> {t('createPost.photo')}
                </button>
                <button
                    className="action-btn text-danger position-absolute start-50 translate-middle-x border-0 bg-transparent p-2"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={subiendoPublicacion}
                >
                    <i className="bi bi-camera-video-fill me-1"></i> {t('createPost.video')}
                </button>
                <div className="ms-auto d-flex align-items-center gap-3">
                    <span className={`small ${textoNuevaPublicacion?.length >= 500 ? 'text-danger fw-bold' : 'text-muted'}`} style={{fontSize: '0.8rem'}}>
                        {textoNuevaPublicacion?.length || 0}/500
                    </span>
                    <button
                        className="action-btn text-primary border-0 bg-transparent p-2"
                        onClick={manejarCrearPublicacion}
                        disabled={subiendoPublicacion || (!textoNuevaPublicacion.trim() && !imagenPublicacion)}
                    >
                        {subiendoPublicacion ? (
                            <><span className="spinner-border spinner-border-sm me-1"></span> {t('createPost.publishing')}</>
                        ) : (
                            <><i className="bi bi-send-fill"></i> {t('createPost.publish')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostArea;

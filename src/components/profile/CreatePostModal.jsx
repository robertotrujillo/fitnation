import React, { useState, useRef } from 'react';
import { servicioPublicaciones } from '../../services/postService';
import { useTranslation } from 'react-i18next';

const CreatePostModal = ({
    usuario,
    perfil,
    onClose,
    avatarUrl,
    avatarFallback,
    onPostCreated
}) => {
    const { t } = useTranslation();
    const [textoPublicacion, setTextoPublicacion] = useState('');
    const [imagenPublicacion, setImagenPublicacion] = useState(null);
    const [previewImagen, setPreviewImagen] = useState(null);
    const [subiendoPublicacion, setSubiendoPublicacion] = useState(false);
    const [errorModal, setErrorModal] = useState('');
    const [exitoModal, setExitoModal] = useState('');

    const postFileInputRef = useRef(null);
    const videoFileInputRef = useRef(null);

    const resetFileInputs = () => {
        if (postFileInputRef.current) postFileInputRef.current.value = '';
        if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    };

    const manejarSeleccionImagenPublicacion = (e) => {
        setErrorModal('');
        setExitoModal('');
        const archivo = e.target.files[0];
        if (!archivo) return;

        const esVideo = archivo.type.startsWith('video/');
        const sizeLimit = esVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB para video, 5MB para imagen
        if (archivo.size > sizeLimit) {
            setErrorModal(esVideo ? t('createPostModal.video_too_large') : t('createPostModal.image_too_large'));
            resetFileInputs();
            return;
        }

        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm'];
        const fileName = archivo.name.toLowerCase();
        if (!validExtensions.some(ext => fileName.endsWith(ext))) {
            setErrorModal(t('createPostModal.format_error'));
            resetFileInputs();
            return;
        }

        setImagenPublicacion(archivo);
        setPreviewImagen(URL.createObjectURL(archivo));
        setErrorModal('');
    };

    const crearNuevaPublicacion = async () => {
        if (!perfil?.username || perfil.username.trim() === '') {
            setErrorModal(t('createPostModal.username_required'));
            return;
        }

        if (!textoPublicacion.trim() && !imagenPublicacion) {
            setErrorModal(t('createPostModal.content_required'));
            return;
        }

        setSubiendoPublicacion(true);
        setErrorModal('');
        setExitoModal('');

        try {
            let imageUrl = null;
            let filePathUpload = null;

            if (imagenPublicacion) {
                const resultado = await servicioPublicaciones.subirMediaPublicacion(imagenPublicacion, usuario.id);
                if (resultado) {
                    imageUrl = resultado.publicUrl;
                    filePathUpload = resultado.filePath;
                } else {
                    throw new Error(t('createPostModal.error_upload'));
                }
            }

            const nombreAutor = perfil?.username || usuario?.user_metadata?.nombre_usuario || usuario?.email?.split('@')[0] || 'Usuario';

            const nueva = await servicioPublicaciones.crearPublicacion(
                usuario.id,
                nombreAutor,
                textoPublicacion,
                imageUrl
            );

            if (nueva) {
                setExitoModal(t('createPostModal.success'));
                setTextoPublicacion('');
                setImagenPublicacion(null);
                setPreviewImagen(null);
                if (onPostCreated) {
                    onPostCreated(nueva);
                }
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                // Limpieza si falla DB
                if (filePathUpload) {
                    await servicioPublicaciones.eliminarImagenPublicacion(filePathUpload);
                }
                throw new Error(t('createPostModal.error_db'));
            }
        } catch (error) {
            console.error(error);
            if (error.message === 'STATUS_SUSPENDED') {
                setErrorModal(t('createPostModal.error_suspended'));
            } else if (error.message === 'STATUS_BANNED_TEMPORARY') {
                setErrorModal(t('createPostModal.error_banned'));
            } else {
                setErrorModal(t('createPostModal.error_generic') + error.message);
            }
        } finally {
            setSubiendoPublicacion(false);
            resetFileInputs();
        }
    };

    const handleClose = () => {
        setTextoPublicacion('');
        setImagenPublicacion(null);
        setPreviewImagen(null);
        setErrorModal('');
        setExitoModal('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-custom">
                    <h5 className="modal-title">{t('createPostModal.title')}</h5>
                    <button className="btn-close-custom" onClick={handleClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="modal-body-custom">
                    {errorModal && (
                        <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded mb-3" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                            <div>{errorModal}</div>
                        </div>
                    )}
                    {exitoModal && (
                        <div className="alert alert-success d-flex align-items-center py-2 px-3 small rounded mb-3" role="alert">
                            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                            <div>{exitoModal}</div>
                        </div>
                    )}

                    <div className="d-flex gap-3 mb-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden" style={{ width: '40px', height: '40px' }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                avatarFallback
                            )}
                        </div>
                        <div className="w-100">
                            <textarea
                                className="form-control border-0 px-0 fs-5 mb-2"
                                placeholder={t('createPostModal.placeholder')}
                                rows="3"
                                maxLength={500}
                                value={textoPublicacion}
                                onChange={(e) => setTextoPublicacion(e.target.value)}
                                style={{ backgroundColor: 'transparent', color: 'var(--fn-text-main)', resize: 'none', boxShadow: 'none' }}
                            ></textarea>
                            <div className={`text-end small ${textoPublicacion.length >= 500 ? 'text-danger fw-bold' : 'text-muted'}`} style={{ fontSize: '0.85rem' }}>
                                {textoPublicacion.length}/500
                            </div>
                        </div>
                    </div>

                    {/* Vista previa de la imagen */}
                    {previewImagen && (
                        <div className="position-relative mb-3 border rounded shadow-sm overflow-hidden" style={{ maxHeight: '300px' }}>
                            {imagenPublicacion?.type?.startsWith('video/') ? (
                                <video src={previewImagen} controls className="w-100 h-100 object-fit-cover" style={{ maxHeight: '300px' }} />
                            ) : (
                                <img src={previewImagen} alt={t('createPost.preview_alt')} loading="lazy" className="w-100 h-100 object-fit-cover" />
                            )}
                            <button
                                className="btn btn-dark btn-sm rounded-circle position-absolute top-0 end-0 m-2"
                                onClick={() => { setImagenPublicacion(null); setPreviewImagen(null); resetFileInputs(); }}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        </div>
                    )}

                    {/* Opciones de subida */}
                    <div className="d-flex justify-content-between align-items-center border rounded p-3 mb-3" style={{ backgroundColor: 'var(--fn-input-bg)', borderColor: 'var(--fn-border)' }}>
                        <span className="fw-bold small me-auto" style={{ color: 'var(--fn-text-main)' }}>{t('createPostModal.add_to_post')}</span>

                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: '42px', height: '42px', backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}
                                onClick={() => postFileInputRef.current?.click()}
                                title={t('createPostModal.add_photo')}
                            >
                                <i className="bi bi-images text-success fs-5"></i>
                            </button>
                            <button
                                className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: '42px', height: '42px', backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}
                                onClick={() => videoFileInputRef.current?.click()}
                                title={t('createPostModal.add_video')}
                            >
                                <i className="bi bi-camera-video-fill text-danger fs-5"></i>
                            </button>
                        </div>

                        <input
                            type="file"
                            ref={postFileInputRef}
                            style={{ display: 'none' }}
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={manejarSeleccionImagenPublicacion}
                        />
                        <input
                            type="file"
                            ref={videoFileInputRef}
                            style={{ display: 'none' }}
                            accept=".mp4,.webm,video/mp4,video/webm"
                            onChange={manejarSeleccionImagenPublicacion}
                        />
                    </div>

                </div>
                <div className="modal-footer-custom" style={{ backgroundColor: 'var(--fn-card-bg)', borderTop: '1px solid var(--fn-border)' }}>
                    <button
                        className="btn btn-primary w-100 fw-bold rounded-pill shadow-sm py-2"
                        onClick={crearNuevaPublicacion}
                        disabled={subiendoPublicacion || (!textoPublicacion.trim() && !imagenPublicacion)}
                    >
                        {subiendoPublicacion ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> {t('createPostModal.publishing')}</>
                        ) : t('createPostModal.publish')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;

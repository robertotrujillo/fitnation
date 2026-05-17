import { useState, useRef, useEffect } from 'react';
import { servicioPerfil } from '../../services/profileService';
import { useTranslation } from 'react-i18next';

const EditProfileModal = ({
    usuario,
    perfil,
    setPerfil,
    onClose,
    avatarUrl,
    avatarFallback
}) => {
    const { t } = useTranslation();
    // 1. Estados locales exclusivos del Modal
    const [formData, setFormData] = useState({
        username: perfil?.username || '',
        biografia: perfil?.biografia || '',
        peso: perfil?.peso || '',
        altura: perfil?.altura || ''
    });
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState('');
    const [exitoModal, setExitoModal] = useState('');

    const fileInputRef = useRef(null);

    // Sincronizar el form si el perfil cambia o se carga tarde
    useEffect(() => {
        if (perfil) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                username: perfil.username || '',
                biografia: perfil.biografia || '',
                peso: perfil.peso || '',
                altura: perfil.altura || ''
            });
        }
    }, [perfil]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 2. Lógica para guardar la información de texto
    const manejarGuardar = async () => {
        setErrorModal('');
        setExitoModal('');
        setGuardando(true);

        const payload = {
            username: formData.username,
            biografia: formData.biografia,
            peso: formData.peso === '' ? null : Number(formData.peso),
            altura: formData.altura === '' ? null : Number(formData.altura)
        };

        const { data, error } = await servicioPerfil.actualizarPerfil(usuario.id, payload);

        if (!error && data) {
            setPerfil(data); // Actualizamos el estado global en Profile.jsx
            setExitoModal(t('editProfile.success'));
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            console.error(error);
            setErrorModal(t('editProfile.error'));
        }
        setGuardando(false);
    };

    const manejarClickAvatar = () => {
        fileInputRef.current.click();
    };

    // 3. Lógica para manejar el Avatar (Compresión y control de subida intactos)
    const manejarSeleccionArchivo = async (e) => {
        setErrorModal('');
        setExitoModal('');
        const archivo = e.target.files[0];
        if (!archivo) return;

        // Validar tamaño máximo (5MB)
        const sizeLimit = 5 * 1024 * 1024;
        if (archivo.size > sizeLimit) {
            setErrorModal(t('editProfile.file_too_large'));
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Validar que sea un formato de imagen permitido
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const fileName = archivo.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

        const validMsTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const hasValidType = !archivo.type || validMsTypes.includes(archivo.type.toLowerCase());

        if (!hasValidExtension || !hasValidType) {
            setErrorModal(t('editProfile.invalid_format'));
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setGuardando(true);
        const resultadoSubida = await servicioPerfil.subirAvatar(archivo, usuario.id);

        if (resultadoSubida) {
            const { publicUrl, filePath } = resultadoSubida;

            const { data, error } = await servicioPerfil.actualizarPerfil(usuario.id, { avatar_url: publicUrl });
            if (!error && data) {
                setPerfil(data);
                setExitoModal(t('editProfile.avatar_success'));
                setTimeout(() => setExitoModal(''), 2000);
            } else {
                await servicioPerfil.eliminarAvatar(filePath);
                setErrorModal(t('editProfile.avatar_upload_error'));
            }
        } else {
            setErrorModal(t('editProfile.avatar_network_error'));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        setGuardando(false);
    };

    const handleCloseModal = () => {
        onClose();
        setErrorModal('');
        setExitoModal('');
    };

    return (
        <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-custom">
                    <h5 className="modal-title">{t('editProfile.title')}</h5>
                    <button className="btn-close-custom" onClick={handleCloseModal}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body-custom">
                    {errorModal && (
                        <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                            <div>{errorModal}</div>
                        </div>
                    )}
                    {exitoModal && (
                        <div className="alert alert-success d-flex align-items-center py-2 px-3 small rounded" role="alert">
                            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                            <div>{exitoModal}</div>
                        </div>
                    )}

                    {/* Avatar Edit */}
                    <div className="text-center">
                        <div
                            className="edit-avatar-container"
                            onClick={manejarClickAvatar}
                        >
                            <div className="edit-avatar overflow-hidden bg-white d-flex align-items-center justify-content-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    avatarFallback
                                )}
                            </div>
                            <div className="edit-icon-overlay">
                                <i className="bi bi-camera-fill"></i>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={manejarSeleccionArchivo}
                        />
                    </div>

                    {/* Inputs */}
                    <div className="form-floating-custom">
                        <label className="input-label">{t('editProfile.username_label')}</label>
                        <input
                            type="text"
                            className="form-control-custom"
                            name="username"
                            placeholder={t('editProfile.username_placeholder')}
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="row">
                        <div className="col-6">
                            <div className="form-floating-custom">
                                <label className="input-label">{t('editProfile.weight_label')}</label>
                                <input
                                    type="number"
                                    className="form-control-custom text-center"
                                    name="peso"
                                    placeholder="00"
                                    value={formData.peso}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="form-floating-custom">
                                <label className="input-label">{t('editProfile.height_label')}</label>
                                <input
                                    type="number"
                                    className="form-control-custom text-center"
                                    name="altura"
                                    placeholder="000"
                                    value={formData.altura}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-floating-custom">
                        <label className="input-label">{t('editProfile.bio_label')}</label>
                        <textarea
                            className="form-control-custom"
                            rows="3"
                            name="biografia"
                            placeholder={t('editProfile.bio_placeholder')}
                            value={formData.biografia}
                            onChange={handleChange}
                            style={{ resize: 'none' }}
                        ></textarea>
                    </div>

                    <div className="modal-footer-custom">
                        <button className="btn-cancel" onClick={handleCloseModal} disabled={guardando}>
                            {t('editProfile.cancel')}
                        </button>
                        <button className="btn-save" onClick={manejarGuardar} disabled={guardando}>
                            {guardando ? t('editProfile.saving') : t('editProfile.save')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;

import React, { useState } from 'react';
import { servicioPublicaciones } from '../../services/postService';
import { useTranslation } from 'react-i18next';

export function ReportModal({ postId, reporterId, onClose }) {
    const { t } = useTranslation();
    const [motivo, setMotivo] = useState("");
    const [errorModal, setErrorModal] = useState("");
    const [exitoModal, setExitoModal] = useState("");
    const [enviando, setEnviando] = useState(false);

    const enviarReporte = async () => {
        if (!motivo.trim()) {
            setErrorModal(t('reportModal.error_empty'));
            return;
        }

        setEnviando(true);
        setErrorModal("");

        try {
            await servicioPublicaciones.reportarPublicacion(postId, reporterId, motivo.trim());
            setExitoModal(t('reportModal.success'));
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error al reportar:", error);
            setErrorModal(t('reportModal.error'));
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1060 }}>
            <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-custom border-bottom border-secondary pb-3 mb-3">
                    <h5 className="modal-title d-flex align-items-center gap-2 text-danger">
                        <i className="bi bi-flag-fill"></i> {t('reportModal.title')}
                    </h5>
                    <button className="btn-close-custom" onClick={onClose}>
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

                    <div className="mb-4">
                        <label className="form-label text-muted small mb-2">
                            {t('reportModal.label')}
                        </label>
                        <textarea
                            className="form-control-custom focus-ring"
                            rows="3"
                            placeholder={t('reportModal.placeholder')}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            disabled={enviando || exitoModal}
                            style={{ resize: 'none' }}
                        ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button
                            className="btn btn-outline-secondary rounded-pill px-4 fw-semibold"
                            onClick={onClose}
                            disabled={enviando || exitoModal}
                        >
                            {t('reportModal.cancel')}
                        </button>
                        <button
                            className="btn btn-danger rounded-pill px-4 fw-semibold"
                            onClick={enviarReporte}
                            disabled={enviando || exitoModal}
                        >
                            {enviando ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>{t('reportModal.sending')}</>
                            ) : t('reportModal.send')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

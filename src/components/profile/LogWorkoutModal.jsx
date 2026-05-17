import React, { useState } from 'react';
import { servicioEntrenamientos } from '../../services/workoutService';
import { useTranslation } from 'react-i18next';

const LogWorkoutModal = ({ usuario, onClose, onWorkoutLogged }) => {
    const { t } = useTranslation();

    const OPCIONES_MUSCULOS = [
        { id: 'pecho', label: t('logWorkout.chest'), icon: 'bi-square-half' },
        { id: 'espalda', label: t('logWorkout.back'), icon: 'bi-distribute-vertical' },
        { id: 'hombros', label: t('logWorkout.shoulders'), icon: 'bi-arrow-up-circle' },
        { id: 'brazos', label: t('logWorkout.arms'), icon: 'bi-record-circle' },
        { id: 'piernas', label: t('logWorkout.legs'), icon: 'bi-vinyl-fill' },
        { id: 'core', label: t('logWorkout.core'), icon: 'bi-grid-3x3-gap-fill' }
    ];

    const [musculosSeleccionados, setMusculosSeleccionados] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState('');

    const toggleMusculo = (id) => {
        setMusculosSeleccionados(prev => 
            prev.includes(id) 
                ? prev.filter(m => m !== id) 
                : [...prev, id]
        );
    };

    const handleGuardar = async () => {
        if (musculosSeleccionados.length === 0) {
            setErrorModal(t('logWorkout.error_empty'));
            return;
        }

        setGuardando(true);
        setErrorModal('');

        const { data, error } = await servicioEntrenamientos.registrarEntrenamiento(usuario.id, musculosSeleccionados);

        setGuardando(false);

        if (error) {
            setErrorModal(t('logWorkout.error_save'));
        } else {
            if (onWorkoutLogged) onWorkoutLogged(data);
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
            <div className="modal-custom position-relative shadow-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header-custom border-bottom">
                    <h5 className="modal-title fw-bold">
                        <i className="bi bi-fire text-danger me-2"></i> {t('logWorkout.title')}
                    </h5>
                    <button className="btn-close-custom" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body-custom py-4">
                    <p className="text-muted text-center mb-4">{t('logWorkout.question')}</p>

                    {errorModal && (
                        <div className="alert alert-danger py-2 px-3 small rounded mb-3">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorModal}
                        </div>
                    )}

                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {OPCIONES_MUSCULOS.map((musculo) => {
                            const seleccionado = musculosSeleccionados.includes(musculo.id);
                            return (
                                <button
                                    key={musculo.id}
                                    className={`btn rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                                        seleccionado 
                                            ? 'btn-danger text-white shadow-sm' 
                                            : 'btn-outline-secondary'
                                    }`}
                                    onClick={() => toggleMusculo(musculo.id)}
                                >
                                    <i className={`bi ${musculo.icon}`}></i>
                                    {musculo.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="modal-footer-custom border-top bg-light rounded-bottom">
                    <button
                        className="btn btn-danger w-100 fw-bold rounded-pill shadow-sm py-2"
                        onClick={handleGuardar}
                        disabled={guardando || musculosSeleccionados.length === 0}
                    >
                        {guardando ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> {t('logWorkout.saving')}</>
                        ) : t('logWorkout.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogWorkoutModal;

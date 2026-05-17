import React, { useState } from 'react';
import MuscleHeatmap from './MuscleHeatmap';
import LogWorkoutModal from './LogWorkoutModal';
import { useTranslation } from 'react-i18next';

const MuscleProgressModal = ({ usuario, onClose, heatmapData, onWorkoutLogged }) => {
    const { t } = useTranslation();
    const [mostrandoRegistro, setMostrandoRegistro] = useState(false);

    // Si pulsamos "Registrar", abrimos el modal de registro encima
    if (mostrandoRegistro) {
        return (
            <LogWorkoutModal 
                usuario={usuario}
                onClose={() => setMostrandoRegistro(false)}
                onWorkoutLogged={(data) => {
                    if (onWorkoutLogged) onWorkoutLogged(data);
                    setMostrandoRegistro(false);
                }}
            />
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
            <div className="modal-custom position-relative shadow-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header-custom border-bottom">
                    <h5 className="modal-title fw-bold">
                        <i className="bi bi-fire text-danger me-2"></i> {t('muscleProgress.title')}
                    </h5>
                    <button className="btn-close-custom" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body-custom py-2 px-4 d-flex flex-column align-items-center bg-white rounded-bottom" style={{ backgroundColor: 'var(--fn-card-bg)!important' }}>
                    <MuscleHeatmap heatmapData={heatmapData} />
                    
                    <button 
                        className="btn btn-danger w-100 fw-bold rounded-pill shadow mt-3 mb-2 py-2 d-flex justify-content-center align-items-center gap-2"
                        onClick={() => setMostrandoRegistro(true)}
                    >
                        <i className="bi bi-plus-circle-fill"></i> {t('muscleProgress.register_btn')}
                    </button>
                    <p className="small text-muted text-center mt-2 px-3">
                        {t('muscleProgress.desc')}
                        <br/>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            <i className="bi bi-info-circle me-1"></i>
                            {t('muscleProgress.hint')}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MuscleProgressModal;

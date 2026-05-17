import React from 'react';
import GymMap from '../GymMap';
import { useTranslation } from 'react-i18next';

const GymMapModal = ({ onClose }) => {
    const { t } = useTranslation();
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
            <div className="modal-custom position-relative shadow-lg d-flex flex-column" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '800px', height: '80vh' }}>
                <div className="modal-header-custom border-bottom" style={{ flexShrink: 0 }}>
                    <h5 className="modal-title fw-bold">
                        <i className="bi bi-geo-alt-fill text-success me-2"></i> {t('gymMap.title')}
                    </h5>
                    <button className="btn-close-custom" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body-custom flex-grow-1 p-0 bg-white rounded-bottom overflow-hidden" style={{ backgroundColor: 'var(--fn-card-bg)!important', display: 'flex', flexDirection: 'column' }}>
                    <GymMap />
                </div>
            </div>
        </div>
    );
};

export default GymMapModal;

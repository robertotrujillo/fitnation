import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useTranslation } from 'react-i18next';

const FitCoachModal = ({ usuario, onClose }) => {
    const { t } = useTranslation();
    const [mensajes, setMensajes] = useState(() => {
        const guardados = localStorage.getItem('fitcoach_mensajes');
        if (guardados) {
            try {
                return JSON.parse(guardados);
            } catch (e) {
                console.error("Error al parsear mensajes desde localStorage", e);
            }
        }
        return [
            { rol: 'assistant', texto: t('fitCoach.greeting', { name: usuario?.user_metadata?.nombre_usuario || 'Atleta', goal: usuario?.fitness_goal || 'mejorar tu salud' }) }
        ];
    });
    const [input, setInput] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    
    // Guardar mensajes en localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem('fitcoach_mensajes', JSON.stringify(mensajes));
    }, [mensajes]);

    // Referencia para el auto-scroll
    const finMensajesRef = useRef(null);

    // Efecto para bajar el scroll automáticamente
    useEffect(() => {
        if (finMensajesRef.current) {
            finMensajesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mensajes, cargando]);

    const manejarEnvio = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || cargando) return;

        const mensajeUsuario = { rol: 'user', texto: input };
        setMensajes(prev => [...prev, mensajeUsuario]);
        setInput('');
        setCargando(true);

        try {
            // Aseguramos que pasamos los datos que el backend espera
            const userData = {
                username: usuario?.username || usuario?.user_metadata?.nombre_usuario || 'Atleta',
                objetivo: usuario?.fitness_goal || usuario?.biografia || 'mejorar su salud'
            };

            const { data, error: invokeError } = await supabase.functions.invoke('fit-coach', {
                body: { prompt: input, userData }
            });

            if (invokeError) throw invokeError;
            
            // Si el backend devuelve un error específico en el JSON
            if (data.error) {
                console.error("Error de FitCoach (backend):", data.error);
                setMensajes(prev => [...prev, { rol: 'assistant', texto: t('fitCoach.error_internal') }]);
            } else {
                setMensajes(prev => [...prev, { rol: 'assistant', texto: data.reply }]);
            }
        } catch (err) {
            console.error("Error llamando a FitCoach:", err);
            setMensajes(prev => [...prev, { rol: 'assistant', texto: t('fitCoach.error_network') }]);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div 
                className="modal-custom shadow-lg d-flex flex-column position-relative" 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                    maxWidth: '500px', 
                    height: '80vh', 
                    maxHeight: '700px',
                    background: 'var(--fn-card-bg)',
                    borderRadius: '20px',
                    overflow: 'hidden'
                }}
            >
                {/* Header con gradiente similar al Login */}
                <div 
                    className="p-4 text-white d-flex justify-content-between align-items-center"
                    style={{ background: 'linear-gradient(90deg, #0d6efd, #198754)' }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-robot fs-4"></i>
                        <h5 className="mb-0 fw-bold">FitCoach AI</h5>
                    </div>
                    <div>
                        <button 
                            className="btn text-white border-0 p-0 me-3" 
                            onClick={() => setMostrarConfirmacion(true)}
                            title={t('fitCoach.delete_tooltip')}
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                        <button className="btn text-white border-0 p-0" title={t('fitCoach.close_tooltip')} onClick={onClose}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Overlay de Confirmación */}
                {mostrarConfirmacion && (
                    <div 
                        className="position-absolute w-100 h-100 d-flex flex-column justify-content-center align-items-center"
                        style={{ 
                            top: 0, left: 0, 
                            background: 'rgba(0, 0, 0, 0.6)', 
                            backdropFilter: 'blur(5px)',
                            zIndex: 1050 
                        }}
                    >
                        <div 
                            className="bg-white p-4 rounded-4 shadow-lg text-center" 
                            style={{ maxWidth: '80%', transform: 'scale(1)', animation: 'popIn 0.3s ease-out' }}
                        >
                            <i className="bi bi-exclamation-triangle text-warning mb-3 d-block" style={{ fontSize: '3rem' }}></i>
                            <h5 className="fw-bold text-dark mb-2">{t('fitCoach.delete_title')}</h5>
                            <p className="text-secondary small mb-4">{t('fitCoach.delete_desc')}</p>
                            <div className="d-flex gap-3 justify-content-center">
                                <button 
                                    className="btn btn-light rounded-pill px-4 fw-medium border" 
                                    onClick={() => setMostrarConfirmacion(false)}
                                >
                                    {t('fitCoach.cancel')}
                                </button>
                                <button 
                                    className="btn btn-danger rounded-pill px-4 fw-medium" 
                                    onClick={() => {
                                        localStorage.removeItem('fitcoach_mensajes');
                                        setMensajes([{ rol: 'assistant', texto: t('fitCoach.greeting', { name: usuario?.user_metadata?.nombre_usuario || 'Atleta', goal: usuario?.fitness_goal || 'mejorar tu salud' }) }]);
                                        setMostrarConfirmacion(false);
                                    }}
                                >
                                    {t('fitCoach.delete_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Área de Mensajes */}
                <div 
                    className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-3"
                    style={{ background: 'var(--fn-bg)' }}
                >
                    {mensajes.map((m, i) => (
                        <div 
                            key={i} 
                            className={`d-flex ${m.rol === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                            <div 
                                className={`p-3 rounded-4 shadow-sm`}
                                style={{ 
                                    maxWidth: '85%',
                                    backgroundColor: m.rol === 'user' ? '#0d6efd' : 'var(--fn-card-bg)',
                                    color: m.rol === 'user' ? 'white' : 'var(--fn-text-main)',
                                    border: m.rol === 'user' ? 'none' : '1px solid var(--fn-border)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.4'
                                }}
                            >
                                {m.texto}
                            </div>
                        </div>
                    ))}
                    
                    {/* Indicador de "Pensando" */}
                    {cargando && (
                        <div className="d-flex justify-content-start">
                            <div 
                                className="p-3 rounded-4"
                                style={{ backgroundColor: 'var(--fn-card-bg)', border: '1px solid var(--fn-border)' }}
                            >
                                <div className="typing-indicator d-flex gap-1">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={finMensajesRef} />
                </div>

                {/* Input Area */}
                <form 
                    onSubmit={manejarEnvio}
                    className="p-3 border-top"
                    style={{ background: 'var(--fn-card-bg)', borderTopColor: 'var(--fn-border)!important' }}
                >
                    <div className="input-group">
                        <input 
                            type="text" 
                            className="form-control-custom border-0"
                            placeholder={t('fitCoach.placeholder')}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={cargando}
                            style={{ 
                                backgroundColor: 'var(--fn-hover)',
                                borderRadius: '12px 0 0 12px',
                                paddingLeft: '20px'
                            }}
                        />
                        <button 
                            className="btn btn-primary"
                            type="submit"
                            disabled={cargando || !input.trim()}
                            style={{ 
                                background: 'linear-gradient(90deg, #0d6efd, #198754)',
                                border: 'none',
                                borderRadius: '0 12px 12px 0',
                                width: '60px'
                            }}
                        >
                            {cargando ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <i className="bi bi-send-fill text-white"></i>
                            )}
                        </button>
                    </div>
                </form>

                {/* Estilos inline para la animación de escritura */}
                <style>{`
                    .typing-indicator .dot {
                        width: 8px;
                        height: 8px;
                        background: var(--fn-text-muted);
                        border-radius: 50%;
                        display: inline-block;
                        animation: bounce 1.4s infinite ease-in-out both;
                    }
                    .typing-indicator .dot:nth-child(1) { animation-delay: -0.32s; }
                    .typing-indicator .dot:nth-child(2) { animation-delay: -0.16s; }
                    @keyframes bounce {
                        0%, 80%, 100% { transform: scale(0); }
                        40% { transform: scale(1.0); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default FitCoachModal;

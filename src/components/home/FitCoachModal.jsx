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
    const [archivoAdjunto, setArchivoAdjunto] = useState(null);
    
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

    const procesarExcel = (file, isExcel) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                let textContent = "";
                
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const csv = window.XLSX.utils.sheet_to_csv(worksheet);
                    if (csv.trim()) {
                        textContent += `\n--- Hoja: ${sheetName} ---\n${csv}\n`;
                    }
                });

                if (!textContent.trim()) {
                    alert("El archivo Excel parece estar vacío.");
                    return;
                }

                let mimeType = file.type || (file.name.endsWith('.xlsx') 
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    : 'application/vnd.ms-excel');

                setArchivoAdjunto({
                    fileObject: file,
                    name: file.name,
                    mimeType: mimeType,
                    base64: btoa(unescape(encodeURIComponent(textContent))),
                    isText: true,
                    textContent: textContent,
                    previewUrl: null
                });
            } catch (error) {
                console.error("Error al procesar Excel:", error);
                alert("No se pudo leer el archivo Excel. Asegúrate de que no esté dañado.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const manejarSeleccionArchivo = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validaciones (incluyendo formatos Excel .xlsx y .xls)
        const formatosValidos = [
            'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 
            'application/pdf', 'text/plain', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
            'application/vnd.ms-excel'
        ];
        
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
                        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                        file.type === 'application/vnd.ms-excel';

        if (!formatosValidos.includes(file.type) && !isExcel) {
            alert(t('fitCoach.format_error'));
            e.target.value = '';
            return;
        }

        const sizeLimit = 5 * 1024 * 1024; // 5MB
        if (file.size > sizeLimit) {
            alert(t('fitCoach.file_too_large'));
            e.target.value = '';
            return;
        }

        // Si es Excel, cargamos XLSX dinámicamente si no existe y parseamos
        if (isExcel) {
            if (!window.XLSX) {
                const script = document.createElement('script');
                script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
                script.async = true;
                script.onload = () => {
                    procesarExcel(file, isExcel);
                };
                script.onerror = () => {
                    alert("Error al cargar la librería de lectura de Excel. Revisa tu conexión a internet.");
                };
                document.head.appendChild(script);
            } else {
                procesarExcel(file, isExcel);
            }
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');
        const isText = file.type === 'text/plain';

        // Determinar MIME type correcto para Excel si el navegador lo devuelve vacío
        let mimeType = file.type;
        if (!mimeType && isExcel) {
            mimeType = file.name.endsWith('.xlsx') 
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                : 'application/vnd.ms-excel';
        }

        if (isText) {
            const textReader = new FileReader();
            textReader.onload = (event) => {
                const textContent = event.target.result;
                setArchivoAdjunto({
                    fileObject: file,
                    name: file.name,
                    mimeType: mimeType || 'text/plain',
                    base64: btoa(unescape(encodeURIComponent(textContent))),
                    isText: true,
                    textContent,
                    previewUrl: null
                });
            };
            textReader.readAsText(file);
        } else {
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                const base64Data = dataUrl.split(',')[1];
                setArchivoAdjunto({
                    fileObject: file,
                    name: file.name,
                    mimeType: mimeType || 'application/octet-stream',
                    base64: base64Data,
                    isText: false,
                    previewUrl: isImage ? dataUrl : null
                });
            };
            reader.readAsDataURL(file);
        }
        
        e.target.value = '';
    };

    const manejarQuitarArchivo = () => {
        setArchivoAdjunto(null);
    };

    const manejarEnvio = async (e) => {
        if (e) e.preventDefault();
        if ((!input.trim() && !archivoAdjunto) || cargando) return;

        const mensajeUsuario = { 
            rol: 'user', 
            texto: input,
            archivo: archivoAdjunto ? {
                name: archivoAdjunto.name,
                mimeType: archivoAdjunto.mimeType,
                previewUrl: archivoAdjunto.previewUrl,
                size: archivoAdjunto.fileObject.size
            } : null
        };

        setMensajes(prev => [...prev, mensajeUsuario]);
        
        const promptEnvio = input;
        const archivoEnvio = archivoAdjunto;
        setInput('');
        setArchivoAdjunto(null);
        setCargando(true);

        try {
            const userData = {
                username: usuario?.username || usuario?.user_metadata?.nombre_usuario || 'Atleta',
                objetivo: usuario?.fitness_goal || usuario?.biografia || 'mejorar su salud'
            };

            // Para archivos de texto (como TXT o el Excel pre-procesado a texto CSV),
            // lo concatenamos directamente al prompt para que la lectura por la IA sea
            // 100% fiable, inmediata y no dependa de si el usuario ha desplegado la Edge Function
            let promptFinal = promptEnvio;
            if (archivoEnvio && archivoEnvio.isText && archivoEnvio.textContent) {
                promptFinal = `${promptEnvio}\n\n[Contenido del archivo Excel/Texto "${archivoEnvio.name}" extraído y formateado]:\n${archivoEnvio.textContent}`;
            }

            const body = {
                prompt: promptFinal || t('fitCoach.file_attached'),
                userData
            };

            if (archivoEnvio && !archivoEnvio.isText) {
                body.file = {
                    base64: archivoEnvio.base64,
                    mimeType: archivoEnvio.mimeType,
                    name: archivoEnvio.name
                };
            }

            const { data, error: invokeError } = await supabase.functions.invoke('fit-coach', {
                body
            });

            if (invokeError) throw invokeError;
            
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
                                className="d-flex flex-column gap-1"
                                style={{ maxWidth: '85%' }}
                            >
                                {m.archivo && (
                                    <div 
                                        className="p-2 mb-1 rounded-3 shadow-sm d-flex align-items-center gap-2"
                                        style={{ 
                                            backgroundColor: m.rol === 'user' ? '#1864ab' : 'var(--fn-hover)',
                                            color: m.rol === 'user' ? 'white' : 'var(--fn-text-main)',
                                            border: m.rol === 'user' ? 'none' : '1px solid var(--fn-border)',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {m.archivo.previewUrl ? (
                                            <img 
                                                src={m.archivo.previewUrl} 
                                                alt={m.archivo.name} 
                                                className="rounded-2" 
                                                style={{ width: '45px', height: '45px', objectFit: 'cover' }} 
                                            />
                                        ) : (
                                            <div className="rounded-2 bg-black bg-opacity-25 d-flex align-items-center justify-content-center text-white" style={{ width: '45px', height: '45px', fontSize: '1.25rem' }}>
                                                {m.archivo.mimeType === 'application/pdf' ? '📄' : 
                                                 (m.archivo.mimeType?.includes('sheet') || m.archivo.mimeType?.includes('excel') || m.archivo.name.endsWith('.xlsx') || m.archivo.name.endsWith('.xls')) ? '📊' : '📝'}
                                            </div>
                                        )}
                                        <div className="overflow-hidden" style={{ minWidth: '100px' }}>
                                            <span className="d-block text-truncate fw-medium">{m.archivo.name}</span>
                                            <small className="opacity-75">{(m.archivo.size / 1024).toFixed(1)} KB</small>
                                        </div>
                                    </div>
                                )}
                                
                                {m.texto && (
                                    <div 
                                        className={`p-3 rounded-4 shadow-sm`}
                                        style={{ 
                                            backgroundColor: m.rol === 'user' ? '#0d6efd' : 'var(--fn-card-bg)',
                                            color: m.rol === 'user' ? 'white' : 'var(--fn-text-main)',
                                            border: m.rol === 'user' ? 'none' : '1px solid var(--fn-border)',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        {m.texto}
                                    </div>
                                )}
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
                    {/* Visualización del archivo adjunto */}
                    {archivoAdjunto && (
                        <div className="d-flex align-items-center justify-content-between p-2 mb-2 rounded-3 border" style={{ backgroundColor: 'var(--fn-hover)', borderColor: 'var(--fn-border)' }}>
                            <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ maxWidth: '85%' }}>
                                {archivoAdjunto.previewUrl ? (
                                    <img 
                                        src={archivoAdjunto.previewUrl} 
                                        alt="preview" 
                                        className="rounded-2" 
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <div className="rounded-2 bg-secondary d-flex align-items-center justify-content-center text-white" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                                        {archivoAdjunto.mimeType === 'application/pdf' ? '📄' : 
                                         (archivoAdjunto.mimeType?.includes('sheet') || archivoAdjunto.mimeType?.includes('excel') || archivoAdjunto.name.endsWith('.xlsx') || archivoAdjunto.name.endsWith('.xls')) ? '📊' : '📝'}
                                    </div>
                                )}
                                <div className="text-truncate">
                                    <small className="d-block fw-semibold text-truncate" style={{ color: 'var(--fn-text-main)', fontSize: '0.85rem' }}>{archivoAdjunto.name}</small>
                                    <small style={{ color: 'var(--fn-text-muted)', fontSize: '0.75rem' }}>{(archivoAdjunto.fileObject.size / 1024).toFixed(1)} KB</small>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-link text-danger p-0 border-0 bg-transparent" 
                                onClick={manejarQuitarArchivo}
                                style={{ textDecoration: 'none' }}
                            >
                                <i className="bi bi-x-circle-fill fs-5"></i>
                            </button>
                        </div>
                    )}

                    <div className="input-group align-items-center">
                        <label 
                            htmlFor="fitcoach-file-upload" 
                            className="btn btn-outline-secondary border-0 d-flex align-items-center justify-content-center m-0"
                            style={{ 
                                backgroundColor: 'var(--fn-hover)', 
                                borderTopLeftRadius: '12px', 
                                borderBottomLeftRadius: '12px',
                                height: '45px', 
                                width: '45px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            title={t('fitCoach.attach_file')}
                        >
                            <i className="bi bi-paperclip fs-5" style={{ color: 'var(--fn-text-muted)' }}></i>
                            <input 
                                type="file" 
                                id="fitcoach-file-upload" 
                                onChange={manejarSeleccionArchivo} 
                                accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.xlsx,.xls"
                                style={{ display: 'none' }}
                                disabled={cargando}
                            />
                        </label>
                        <input 
                            type="text" 
                            className="form-control border-0"
                            placeholder={t('fitCoach.placeholder')}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={cargando}
                            style={{ 
                                backgroundColor: 'var(--fn-hover)',
                                color: 'var(--fn-text-main)',
                                borderLeft: '1px solid var(--fn-border)',
                                height: '45px',
                                paddingLeft: '15px'
                            }}
                        />
                        <button 
                            className="btn btn-primary d-flex align-items-center justify-content-center"
                            type="submit"
                            disabled={cargando || (!input.trim() && !archivoAdjunto)}
                            style={{ 
                                background: 'linear-gradient(90deg, #0d6efd, #198754)',
                                border: 'none',
                                borderTopRightRadius: '12px',
                                borderBottomRightRadius: '12px',
                                width: '60px',
                                height: '45px'
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

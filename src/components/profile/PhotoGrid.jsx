import React from 'react';
import { useTranslation } from 'react-i18next';

const PhotoGrid = ({
    publicaciones,
    abrirVisor,
    nombreMostrar,
    esMiPerfil,
    setModalPublicacion
}) => {
    const { t } = useTranslation();
    // Filtramos solo las publicaciones que tienen imagen o video
    const fotos = publicaciones.filter(p => p.image_url);

    return (
        <div className="photos-grid">
            {fotos.length > 0 ? (
                fotos.map((post) => (
                    <div
                        key={post.id}
                        className="photo-item position-relative"
                        onClick={() => abrirVisor(post)}
                        style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: '12px' }}
                    >
                        {post.image_url.match(/\.(mp4|webm|ogg)$/i) || (post.image_url.includes('token=') && post.image_url.includes('.mp4')) ? (
                            <>
                                <video
                                    src={post.image_url}
                                    muted
                                    loop
                                    playsInline
                                    autoPlay
                                    onMouseOver={e => e.target.play()}
                                    onMouseOut={e => e.target.pause()}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        aspectRatio: '1/1',
                                        objectFit: 'cover',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                                <div className="position-absolute top-0 end-0 p-2 text-white">
                                    <i className="bi bi-camera-video-fill fs-5" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}></i>
                                </div>
                            </>
                        ) : (
                            <img
                                src={post.image_url}
                                alt={post.texto || t('photoGrid.photo_alt') + nombreMostrar}
                                loading="lazy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    aspectRatio: '1/1',
                                    objectFit: 'cover',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center p-5 text-muted col-12" style={{ gridColumn: '1 / -1' }}>
                    <i className="bi bi-camera fs-1"></i>
                    <p className="mt-2 text-muted">{t('photoGrid.no_photos')}</p>
                    {esMiPerfil && (
                        <button
                            className="btn btn-outline-primary mt-2"
                            onClick={() => setModalPublicacion(true)}
                        >
                            {t('photoGrid.upload_first')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PhotoGrid;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { servicioPerfil } from '../../services/profileService';
import { useTranslation } from 'react-i18next';

const FitFriendsModal = ({ usuario, onClose }) => {
    const { t } = useTranslation();
    const [activaTab, setActivaTab] = useState('amigos'); // amigos, siguiendo, seguidores, descubrir
    const [allUsers, setAllUsers] = useState([]);
    const [followingIds, setFollowingIds] = useState([]);
    const [followerIds, setFollowerIds] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);

    const cargarDatosRelaciones = async () => {
        try {
            setCargando(true);
            // 1. Obtener todos los perfiles de usuario
            const { data: perfiles, error: errPerfiles } = await supabase
                .from('profiles')
                .select('*')
                .order('username', { ascending: true });

            if (errPerfiles) throw errPerfiles;
            setAllUsers(perfiles || []);

            // 2. Obtener a quién sigue el usuario activo
            const { data: siguiendo, error: errSiguiendo } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', usuario.id);

            if (errSiguiendo) throw errSiguiendo;
            setFollowingIds(siguiendo.map(f => f.following_id));

            // 3. Obtener quién sigue al usuario activo
            const { data: seguidores, error: errSeguidores } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', usuario.id);

            if (errSeguidores) throw errSeguidores;
            setFollowerIds(seguidores.map(f => f.follower_id));

        } catch (error) {
            console.error("Error cargando relaciones en FitFriendsModal:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (usuario?.id) {
            cargarDatosRelaciones();
        }
    }, [usuario?.id]);

    // Acciones sociales instantáneas
    const manejarSeguir = async (targetId) => {
        const exito = await servicioPerfil.seguirUsuario(usuario.id, targetId);
        if (exito) {
            setFollowingIds(prev => [...prev, targetId]);
        }
    };

    const manejarDejarDeSeguir = async (targetId) => {
        const exito = await servicioPerfil.dejarDeSeguirUsuario(usuario.id, targetId);
        if (exito) {
            setFollowingIds(prev => prev.filter(id => id !== targetId));
        }
    };

    // Cálculos de relaciones basadas en IDs
    const mutualIds = followerIds.filter(id => followingIds.includes(id));

    // Filtrar los grupos de usuarios
    const amigosMutuos = allUsers.filter(u => u.id !== usuario.id && mutualIds.includes(u.id));
    const siguiendo = allUsers.filter(u => u.id !== usuario.id && followingIds.includes(u.id));
    const seguidores = allUsers.filter(u => u.id !== usuario.id && followerIds.includes(u.id));

    // Filtro de búsqueda aplicable a los resultados
    const filtrarPorBusqueda = (lista) => {
        if (!busqueda.trim()) return lista;
        return lista.filter(u => 
            (u.username || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (u.user_metadata?.nombre_usuario || '').toLowerCase().includes(busqueda.toLowerCase())
        );
    };

    const amigosFiltrados = filtrarPorBusqueda(amigosMutuos);
    const siguiendoFiltrados = filtrarPorBusqueda(siguiendo);
    const seguidoresFiltrados = filtrarPorBusqueda(seguidores);

    // Obtener objetivo en común
    const miObjetivo = usuario?.fitness_goal || usuario?.biografia || '';

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-custom position-relative shadow-lg d-flex flex-column" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '800px', height: '80vh', borderRadius: '16px', border: '1px solid var(--fn-border)' }}>
                
                {/* Cabecera del Modal */}
                <div className="modal-header-custom border-bottom d-flex align-items-center justify-content-between p-3" style={{ flexShrink: 0, backgroundColor: 'var(--fn-navbar-bg)' }}>
                    <h5 className="modal-title fw-bold m-0 d-flex align-items-center" style={{ color: 'var(--fn-text-main)' }}>
                        <i className="bi bi-people-fill text-primary me-2"></i> {t('friends.title')}
                    </h5>
                    <button className="btn-close-custom bg-transparent border-0 fs-5" onClick={onClose} style={{ color: 'var(--fn-text-muted)', cursor: 'pointer' }}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* Subcabecera con Tabs y Buscador */}
                <div className="p-3 border-bottom d-flex flex-column flex-md-row gap-3 justify-content-between align-items-md-center" style={{ backgroundColor: 'var(--fn-bg)' }}>
                    {/* Barra de Tabs */}
                    <div className="d-flex flex-wrap gap-2">
                        <button 
                            className={`btn rounded-pill px-3 py-1 fw-bold border-0 transition-all ${activaTab === 'amigos' ? 'btn-primary' : 'bg-light text-dark'}`}
                            onClick={() => setActivaTab('amigos')}
                            style={{ fontSize: '0.85rem' }}
                        >
                            🏆 {t('friends.tab_friends')} ({amigosMutuos.length})
                        </button>
                        <button 
                            className={`btn rounded-pill px-3 py-1 fw-bold border-0 transition-all ${activaTab === 'siguiendo' ? 'btn-primary' : 'bg-light text-dark'}`}
                            onClick={() => setActivaTab('siguiendo')}
                            style={{ fontSize: '0.85rem' }}
                        >
                            👉 {t('friends.tab_following')} ({siguiendo.length})
                        </button>
                        <button 
                            className={`btn rounded-pill px-3 py-1 fw-bold border-0 transition-all ${activaTab === 'seguidores' ? 'btn-primary' : 'bg-light text-dark'}`}
                            onClick={() => setActivaTab('seguidores')}
                            style={{ fontSize: '0.85rem' }}
                        >
                            👥 {t('friends.tab_followers')} ({seguidores.length})
                        </button>
                    </div>

                    {/* Buscador Rápido */}
                    <div className="position-relative" style={{ width: '100%', maxWidth: '240px' }}>
                        <input
                            type="text"
                            className="form-control rounded-pill pe-5 ps-3"
                            style={{ backgroundColor: 'var(--fn-input-bg)', borderColor: 'var(--fn-input-border)', color: 'var(--fn-text-main)', fontSize: '0.85rem' }}
                            placeholder={t('friends.search_placeholder')}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted" style={{ fontSize: '0.85rem' }}></i>
                    </div>
                </div>

                {/* Cuerpo del Modal */}
                <div className="modal-body-custom flex-grow-1 p-3 overflow-y-auto" style={{ backgroundColor: 'var(--fn-bg)', minHeight: 0 }}>
                    {cargando ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5">
                            <div className="spinner-border text-primary mb-3" role="status"></div>
                            <span className="text-muted small">{t('app.loading')}</span>
                        </div>
                    ) : (
                        <>
                            {/* TAB: MIS AMIGOS */}
                            {activaTab === 'amigos' && (
                                amigosFiltrados.length > 0 ? (
                                    <div className="row row-cols-1 row-cols-md-2 g-3">
                                        {amigosFiltrados.map(user => (
                                            <FriendCard 
                                                key={user.id} 
                                                user={user} 
                                                esMutual={true}
                                                esSiguiendo={true}
                                                miObjetivo={miObjetivo}
                                                onManejarSeguir={manejarSeguir}
                                                onManejarDejarDeSeguir={manejarDejarDeSeguir}
                                                onClose={onClose}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState text={t('friends.no_friends')} icon="bi-people" />
                                )
                            )}

                            {/* TAB: SIGUIENDO */}
                            {activaTab === 'siguiendo' && (
                                siguiendoFiltrados.length > 0 ? (
                                    <div className="row row-cols-1 row-cols-md-2 g-3">
                                        {siguiendoFiltrados.map(user => (
                                            <FriendCard 
                                                key={user.id} 
                                                user={user} 
                                                esMutual={mutualIds.includes(user.id)}
                                                esSiguiendo={true}
                                                miObjetivo={miObjetivo}
                                                onManejarSeguir={manejarSeguir}
                                                onManejarDejarDeSeguir={manejarDejarDeSeguir}
                                                onClose={onClose}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState text={t('friends.no_following')} icon="bi-person-check" />
                                )
                            )}

                            {/* TAB: SEGUIDORES */}
                            {activaTab === 'seguidores' && (
                                seguidoresFiltrados.length > 0 ? (
                                    <div className="row row-cols-1 row-cols-md-2 g-3">
                                        {seguidoresFiltrados.map(user => (
                                            <FriendCard 
                                                key={user.id} 
                                                user={user} 
                                                esMutual={mutualIds.includes(user.id)}
                                                esSiguiendo={followingIds.includes(user.id)}
                                                miObjetivo={miObjetivo}
                                                onManejarSeguir={manejarSeguir}
                                                onManejarDejarDeSeguir={manejarDejarDeSeguir}
                                                onClose={onClose}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState text={t('friends.no_followers')} icon="bi-person-plus" />
                                )
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Sub-componente: Tarjeta de Atleta
const FriendCard = ({ user, esMutual, esSiguiendo, miObjetivo, onManejarSeguir, onManejarDejarDeSeguir, onClose, t }) => {
    // Redirección al perfil cerrando el modal
    const verPerfil = () => {
        onClose();
        window.location.hash = `/profile/${user.id}`; // O href si usas react-router standard
        window.location.pathname = `/profile/${user.id}`;
    };

    // Verificar si comparte el mismo objetivo
    const suObjetivo = user.fitness_goal || user.biografia || '';
    const comparteObjetivo = miObjetivo && suObjetivo && 
        (suObjetivo.toLowerCase().includes(miObjetivo.toLowerCase()) || 
         miObjetivo.toLowerCase().includes(suObjetivo.toLowerCase()) ||
         (miObjetivo.includes('peso') && suObjetivo.includes('peso')) ||
         (miObjetivo.includes('músculo') && suObjetivo.includes('músculo')));

    return (
        <div className="col">
            <div className="card h-100 border p-3 rounded-4 shadow-sm transition-all" style={{ backgroundColor: 'var(--fn-card-bg)', borderColor: 'var(--fn-border)', hover: 'translateY(-2px)' }}>
                <div className="d-flex align-items-center gap-3">
                    {/* Avatar con indicador activo */}
                    <div className="position-relative">
                        <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '56px', height: '56px', backgroundColor: 'var(--fn-avatar-bg)', color: 'var(--fn-avatar-text)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="w-100 h-100 rounded-circle object-fit-cover" />
                            ) : (
                                (user.username || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        {/* Indicador de activo (verde) */}
                        <div className="position-absolute bg-success rounded-circle animate-pulse" style={{ width: '12px', height: '12px', bottom: '2px', right: '2px', border: '2px solid var(--fn-card-bg)', boxShadow: '0 0 0 2px rgba(46, 204, 113, 0.2)' }} title={t('friends.active_now')}></div>
                    </div>

                    {/* Información del Perfil */}
                    <div className="flex-grow-1 min-w-0">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="fw-bold text-truncate" style={{ color: 'var(--fn-text-main)', fontSize: '0.95rem', cursor: 'pointer' }} onClick={verPerfil}>
                                @{user.username || 'atleta'}
                            </span>
                            {esMutual && (
                                <span className="badge bg-success rounded-pill" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                                    {t('friends.mutual_badge')}
                                </span>
                            )}
                        </div>
                        <p className="text-muted small text-truncate m-0 mt-1" style={{ fontSize: '0.8rem' }}>
                            {user.biografia || t('editProfile.bio_placeholder')}
                        </p>

                        {/* Distintivo de objetivo en común */}
                        {comparteObjetivo && (
                            <div className="mt-2">
                                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary py-1 px-2" style={{ fontSize: '0.65rem' }}>
                                    {t('friends.common_goal', { goal: suObjetivo.substring(0, 24) + (suObjetivo.length > 24 ? '...' : '') })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="d-flex gap-2 mt-3 pt-3 border-top" style={{ borderColor: 'var(--fn-border)' }}>
                    <button 
                        className="btn btn-sm flex-grow-1 rounded-pill fw-bold border" 
                        onClick={verPerfil}
                        style={{ backgroundColor: 'transparent', borderColor: 'var(--fn-border)', color: 'var(--fn-text-main)', fontSize: '0.8rem' }}
                    >
                        🔍 {t('friends.view_profile')}
                    </button>
                    {esSiguiendo ? (
                        <button 
                            className="btn btn-sm flex-grow-1 rounded-pill fw-bold border-danger text-danger bg-transparent" 
                            onClick={() => onManejarDejarDeSeguir(user.id)}
                            style={{ fontSize: '0.8rem' }}
                        >
                            ❌ {t('friends.unfollow')}
                        </button>
                    ) : (
                        <button 
                            className="btn btn-sm flex-grow-1 rounded-pill fw-bold btn-primary" 
                            onClick={() => onManejarSeguir(user.id)}
                            style={{ fontSize: '0.8rem' }}
                        >
                            ⚡ {esMutual ? t('friends.follow') : t('friends.follow_back')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Sub-componente: Estado vacío
const EmptyState = ({ text, icon }) => (
    <div className="d-flex flex-column align-items-center justify-content-center text-center p-5 rounded-4 border border-dashed" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--fn-border)' }}>
        <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-muted mb-3" style={{ width: '64px', height: '64px' }}>
            <i className={`bi ${icon} fs-2`}></i>
        </div>
        <p className="text-muted small m-0 fw-medium" style={{ maxWidth: '320px', lineHeight: '1.5' }}>{text}</p>
    </div>
);

export default FitFriendsModal;

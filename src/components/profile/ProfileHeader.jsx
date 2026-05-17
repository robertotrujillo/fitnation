
const ProfileHeader = ({
    avatarUrl,
    avatarFallback,
    nombreMostrar,
    username,
    rol,
    perfil,
    esMiPerfil,
    setEditando,
    loSigo,
    manejarFollowToggle,
    cargandoFollow,
    publicacionesLength,
    seguidoresStats
}) => {
    return (
        <div className="profile-card">
            <div className="profile-header">
                <div className="cover-photo"></div>
                <div className="profile-avatar-container">
                    <div className="profile-avatar overflow-hidden bg-white d-flex align-items-center justify-content-center">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            avatarFallback
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-info">
                <h2 className="profile-name">{nombreMostrar}</h2>
                <p className="text-secondary mb-3">@{username || 'usuario'}</p>

                <div className="mb-4">
                    <span className="profile-role-badge">
                        {rol === 'admin_gym' ? 'Administrador' : 'Atleta FitNation'}
                    </span>
                </div>

                {/* Biografía */}
                <div className="profile-bio-section">
                    <p className="profile-bio-text">
                        {perfil?.biografia || "¡Hola! Soy nuevo en FitNation."}
                    </p>
                </div>

                {/* Estadísticas físicas */}
                <div className="physical-stats-row">
                    <div className="physical-stat-item">
                        <span className="stat-value-big">
                            {perfil?.peso || '--'} <span className="stat-unit">kg</span>
                        </span>
                        <span className="stat-label-small">Peso</span>
                    </div>
                    <div className="vertical-divider"></div>
                    <div className="physical-stat-item">
                        <span className="stat-value-big">
                            {perfil?.altura || '--'} <span className="stat-unit">cm</span>
                        </span>
                        <span className="stat-label-small">Altura</span>
                    </div>
                </div>

                <div className="mt-4">
                    {esMiPerfil ? (
                        <button className="btn btn-dark rounded-pill px-5 py-2 fw-bold shadow-sm" onClick={() => setEditando(true)}>
                            Editar Perfil
                        </button>
                    ) : (
                        <button
                            className={`btn rounded-pill px-5 py-2 fw-bold shadow-sm ${loSigo ? 'btn-dark' : 'btn-primary text-white'}`}
                            onClick={manejarFollowToggle}
                            disabled={cargandoFollow}
                        >
                            {cargandoFollow ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : loSigo ? 'Siguiendo' : 'Seguir'}
                        </button>
                    )}
                </div>
            </div>

            {/* Estadísticas */}
            <div className="profile-stats">
                <div className="stat-item">
                    <span className="stat-value">{publicacionesLength}</span>
                    <span className="stat-label">Posts</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{seguidoresStats.followers}</span>
                    <span className="stat-label">Seguidores</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{seguidoresStats.following}</span>
                    <span className="stat-label">Seguidos</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;

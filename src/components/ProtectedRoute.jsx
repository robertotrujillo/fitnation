import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserRole } from '../utils/roleUtils';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { usuario, perfil } = useAuth();
    const location = useLocation();

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    // Comprobación de Onboarding: obligar a poner username si no lo tienen
    const faltaUsername = !perfil || !perfil.username || perfil.username.trim() === '';
    
    if (faltaUsername) {
         if (location.pathname !== '/completar-perfil') {
              return <Navigate to="/completar-perfil" replace state={{ from: location.pathname }} />;
         }
    }

    const rolUsuario = getUserRole(usuario);

    if (allowedRoles && !allowedRoles.includes(rolUsuario)) {
        return (
            <div className="container mt-5 text-center">
                <h2 className="text-danger">Acceso Denegado</h2>
                <p>No tienes permiso para ver esta sección.</p>
                <Link to="/" className="btn btn-primary">Volver al Inicio</Link>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;

import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserHome from './pages/UserHome';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import CompletarPerfil from './pages/CompletarPerfil';
import UpdatePassword from './pages/UpdatePassword';
import { useAuth } from './context/AuthContext';
import { getUserRole } from './utils/roleUtils';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  const { usuario, cargando } = useAuth();

  // 1. ESCUDO DE CARGA: Si esto no está bien en AuthContext, la app explota.
  if (cargando) return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ backgroundColor: 'var(--fn-bg)', color: 'var(--fn-text-main)' }}>
      <h2 className="mb-4 fw-bold" style={{ letterSpacing: '2px' }}>
        <span className="text-primary">Fit</span><span>Nation</span>
      </h2>
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">{t('app.loading')}</span>
      </div>
      <p className="mt-3 text-muted small fw-medium">{t('app.verifying')}</p>
    </div>
  );

  return (
    <>
      <LanguageSwitcher />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* RUTA DE ONBOARDING: Fundamental para usuarios de Google */}
        <Route path="/completar-perfil" element={
          <ProtectedRoute allowedRoles={['admin', 'cliente']}>
            <CompletarPerfil />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/app" element={
          <ProtectedRoute allowedRoles={['cliente']}>
            <UserHome />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['admin', 'cliente']}>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/profile/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'cliente']}>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['admin', 'cliente']}>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/update-password" element={
          <ProtectedRoute allowedRoles={['admin', 'cliente']}>
            <UpdatePassword />
          </ProtectedRoute>
        } />

        {/* MANEJADOR DE INICIO: Aquí es donde se decide a dónde va el usuario al entrar */}
        <Route path="/" element={<ManejadorRedireccion usuario={usuario} />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

// 2. EL MANEJADOR CORREGIDO
function ManejadorRedireccion({ usuario }) {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // IMPORTANTE: Si el usuario existe pero no tiene username (ej. registro con Google incompleto)
  // lo mandamos SIEMPRE a completar perfil primero.
  if (!usuario.username) {
    return <Navigate to="/completar-perfil" replace />;
  }

  const rol = getUserRole(usuario);

  if (rol === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/app" replace />;
  }
}

export default App;
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import Login from './pages/Login';
import Register from './pages/Register';
import DocenteDashboard from './pages/DocenteDashboard';
import PadreDashboard from './pages/PadreDashboard';
import CoordinadorDashboard from './pages/CoordinadorDashboard';
import PsicologoDashboard from './pages/PsicologoDashboard';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUser(decoded);
    }
  }, []);

  const ProtectedRoute = ({ children, role }) => {
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/login" />;
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/docente/*"
        element={
          <ProtectedRoute role="docente">
            <DocenteDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/padre/*"
        element={
          <ProtectedRoute role="padre">
            <PadreDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinador/*"
        element={
          <ProtectedRoute role="coordinador">
            <CoordinadorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/psicologo/*"
        element={
          <ProtectedRoute role="psicologo">
            <PsicologoDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;

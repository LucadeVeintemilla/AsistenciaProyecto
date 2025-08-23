import { useNavigate } from 'react-router-dom';

const Navbar = ({ title = 'Sistema de Asistencia' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
<nav className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 shadow-md">
<div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-white text-xl sm:text-2xl font-bold drop-shadow-lg">
          {title}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-white text-indigo-700 hover:bg-gray-100 px-4 py-2 rounded font-semibold transition-colors duration-200"
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

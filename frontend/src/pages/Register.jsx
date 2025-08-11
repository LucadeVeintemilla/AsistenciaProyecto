import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const roles = [
  { label: 'Docente', value: 'docente' },
  { label: 'Padre', value: 'padre' },
  { label: 'Coordinador', value: 'coordinador' },
  { label: 'Psicólogo', value: 'psicologo' },
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('docente');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { name, email, password, role });
      alert('Usuario creado. Ahora inicia sesión');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={submitHandler}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Registrar</h2>
        {error && (
          <p className="mb-2 text-red-500 text-sm text-center">{error}</p>
        )}
        <div className="mb-4">
          <label className="block mb-1">Nombre</label>
          <input
            type="text"
            className="w-full border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Rol</label>
          <select
            className="w-full border px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded mb-2"
        >
          Crear cuenta
        </button>
        <p className="text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link className="text-blue-600" to="/login">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

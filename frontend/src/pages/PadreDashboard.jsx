import { useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';
import io from 'socket.io-client';
import api from '../api';

const socket = io('http://localhost:5000');

const statusColors = {
  presente: 'bg-green-500',
  tardanza: 'bg-yellow-400',
  falta: 'bg-red-500',
};

const PadreDashboard = () => {
  const [child, setChild] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // obtener único hijo del padre
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const { id: parentId } = jwtDecode(token);
    api.get('/students').then(({ data }) => {
      const first = data[0];
      if (first) {
        setChild(first);
        loadAttendance(first._id);
      }
    });

    socket.on('prealert', (msg) => {
      setNotifications((prev) => [...prev, msg]);
    });
  }, []);

  const loadAttendance = async (childId) => {
    const { data } = await api.get(`/attendance/student/${childId}`);
    setAttendance(data);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel Padres</h1>
      
      {child && (
        <h2 className="text-xl font-semibold mb-2">Alumno: {child.name}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Asistencia</h2>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((att) => (
                <tr key={att.date} className="border-t">
                  <td>{new Date(att.date).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`inline-block w-4 h-4 rounded-full ${statusColors[att.status]}`}
                    ></span>
                  </td>
                  <td>{att.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Notificaciones</h2>
          <ul>
            {notifications.map((n, idx) => (
              <li key={idx} className="border-b py-2">
                {n.type === 'prealert' && (
                  <p>
                    Prealerta: Su hijo tiene {n.percent.toFixed(1)}% de asistencia
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PadreDashboard;

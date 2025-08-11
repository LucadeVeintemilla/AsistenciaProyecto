import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import io from 'socket.io-client';
import jwtDecode from 'jwt-decode';

const socket = io('http://localhost:5000');

const PsicologoDashboard = () => {
  const token = localStorage.getItem('token');
  const [studentsAtRisk, setStudentsAtRisk] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const notifyParent = async (risk) => {
    try {
      await api.post('/notifications', {
        fromUser: token ? jwtDecode(token).id : undefined,
        toUser: typeof risk.parentId === 'object' ? risk.parentId._id : risk.parentId,
        message: `Su hijo ${risk.name} tiene ${risk.percent.toFixed(1)}% de asistencia`,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Notificación enviada');
    } catch (err) {
      alert('Error al notificar');
    }
  };

  useEffect(() => {
    // cargar riesgo al montar
    api.get('/students').then(async ({ data: studs }) => {
      const risk = [];
      for (const st of studs) {
        const { data: att } = await api.get(`/attendance/student/${st._id}`);
        const total = att.length;
        const present = att.filter((a) => a.status === 'presente').length;
        const percent = total ? (present / total) * 100 : 100;
        if (percent < 70) {
          const parentId = typeof st.parent === 'object' ? st.parent._id : st.parent;
          risk.push({ name: st.name, percent, studentId: st._id, parentId });
        }
      }
      setStudentsAtRisk(risk);
    });
    socket.on('alert', (msg) => {
      setAlerts((prev) => [...prev, msg]);
    });
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar title="Panel Psicólogo" />
      <div className="p-4 max-w-7xl mx-auto">
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel Psicólogo</h1>
      <div className="bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-2">Alertas de Asistencia &lt; 70%</h2>
        <ul className="mb-4">
          {studentsAtRisk.map((r, idx) => (
            <li key={idx} className="border-b py-2">
              {r.name} - {r.percent.toFixed(1)}%
                <button
                  className="ml-2 bg-red-600 text-white px-2 py-1 text-xs rounded"
                  onClick={() => notifyParent(r)}
                >Notificar a padre</button>
            </li>
          ))}
        </ul>
        <ul>
          {alerts.map((a, idx) => (
            <li key={idx} className="border-b py-2">
              Alumno ID {a.student} - {a.percent.toFixed(1)}%
            </li>
          ))}
        </ul>
      </div>
      </div>
      </div>
    </div>
  );
};

export default PsicologoDashboard;

import { useEffect, useState } from 'react';
import api from '../api';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const PsicologoDashboard = () => {
  const [studentsAtRisk, setStudentsAtRisk] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // cargar riesgo al montar
    api.get('/students').then(async ({ data: studs }) => {
      const risk = [];
      for (const st of studs) {
        const { data: att } = await api.get(`/attendance/student/${st._id}`);
        const total = att.length;
        const present = att.filter((a) => a.status === 'presente').length;
        const percent = total ? (present / total) * 100 : 100;
        if (percent < 85) risk.push({ name: st.name, percent });
      }
      setStudentsAtRisk(risk);
    });
    socket.on('alert', (msg) => {
      setAlerts((prev) => [...prev, msg]);
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel Psicólogo</h1>
      <div className="bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-2">Alertas de Asistencia &lt; 85%</h2>
        <ul className="mb-4">
          {studentsAtRisk.map((r, idx) => (
            <li key={idx} className="border-b py-2">
              {r.name} - {r.percent.toFixed(1)}%
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
  );
};

export default PsicologoDashboard;

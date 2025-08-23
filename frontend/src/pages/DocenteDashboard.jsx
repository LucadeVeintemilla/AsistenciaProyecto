import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import ReportModal from '../components/ReportModal';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jwtDecode from 'jwt-decode';
import api from '../api';
import { getISOWeek } from 'date-fns';

const statusColors = {
  presente: 'bg-green-500',
  tardanza: 'bg-yellow-400',
  falta: 'bg-red-500',
};

const DocenteDashboard = () => {
  const openClass = async (clsId) => {
    // reset with saved data (or blank)
    setAttendance(savedAttendance[clsId] || {});
    const { data } = await api.get(`/classes/${clsId}`);
    console.log('Class data from API:', data);
    setSelectedClass(data);
    setShowModal(true);
  };
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [savedAttendance, setSavedAttendance] = useState(() => {
    const stored = localStorage.getItem('savedAttendance');
    return stored ? JSON.parse(stored) : {};
  }); // { classId: attendanceObj }
  const [selectedWeek, setSelectedWeek] = useState('');

  const weekOptions = useMemo(() => {
    const set = new Set(classes.map((cls) => getISOWeek(new Date(cls.start))));
    return Array.from(set).sort((a, b) => a - b);
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (!selectedWeek) return classes;
    return classes.filter((cls) => getISOWeek(new Date(cls.start)) === Number(selectedWeek));
  }, [classes, selectedWeek]);

  // actualizar lista de eventos según semana seleccionada y asistencia guardada
  useEffect(() => {
    setEvents(
      filteredClasses.map((cls) => ({
        id: cls._id,
        title: cls.name,
        start: cls.start,
        end: cls.end,
        extendedProps: { cls },
        backgroundColor: savedAttendance[cls._id] ? '#38bdf8' : '',
      }))
    );
  }, [filteredClasses, savedAttendance]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [attendance, setAttendance] = useState({}); // { studentId: { status, comment } }

    useEffect(() => {
    // whenever savedAttendance changes, recolor events list
    setEvents((prev) =>
      prev.map((ev) =>
        savedAttendance[ev.id]
          ? { ...ev, backgroundColor: '#38bdf8' }
          : ev
      )
    );
  }, [savedAttendance]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const { id } = jwtDecode(token);
    const fetchClasses = async () => {
      const { data } = await api.get(`/classes/teacher/${id}`);
      setClasses(data);
      setEvents((prev) =>
        data.map((cls) => ({
          id: cls._id,
          title: cls.name,
          start: cls.start,
          end: cls.end,
          extendedProps: { cls },
          backgroundColor: savedAttendance[cls._id] ? '#38bdf8' : '',
        }))
      );
    };
    fetchClasses();
  }, []);

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleCommentChange = (studentId, comment) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };

  const [showReport, setShowReport] = useState(false);

  const submitAttendance = async () => {
    if (!selectedClass) return;
    const records = Object.entries(attendance)
    .filter(([, { status }]) => status) // only with selected status
    .map(([student, { status, comment }]) => ({
      student,
      status,
      comment,
    }));
    await api.post('/attendance', {
      classId: selectedClass._id,
      date: new Date(selectedClass.start),
      records,
    });
    // guarda asistencia local para esta clase
  setSavedAttendance((prev) => {
      const updated = { ...prev, [selectedClass._id]: attendance };
      localStorage.setItem('savedAttendance', JSON.stringify(updated));
      return updated;
    });
  // colorear evento en calendario
  setEvents((prev) =>
    prev.map((ev) =>
      ev.id === selectedClass._id
        ? { ...ev, backgroundColor: '#38bdf8' }
        : ev
    )
  );
  alert('Asistencia guardada');
  setShowModal(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar title="Panel Docente" />
      <div className="p-4 max-w-7xl mx-auto">
    
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Panel Docente</h1>
        <button onClick={() => setShowReport(true)} className="bg-emerald-600 text-white px-4 py-2 rounded">Reporte de seguimiento</button>
      </div>
      <div className="flex gap-4">
        <div className="w-2/3 bg-white p-4 shadow rounded mb-4">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={events}
            eventClick={(info) => openClass(info.event.id)}
          />
        </div>
        <div className="w-1/3 bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Mis Clases</h2>
            <div className="mb-2">
              <select className="border p-1" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                <option value="">Todas las semanas</option>
                {weekOptions.map((w) => (
                  <option key={w} value={w}>Semana {w}</option>
                ))}
              </select>
            </div>
          <ul>
            {filteredClasses.map((cls) => (
              <li
                key={cls._id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedClass?._id === cls._id ? 'bg-gray-200' : ''
                }`}
                onClick={() => openClass(cls._id)}
              >
                {cls.name} - {new Date(cls.start).toLocaleDateString('es-ES',{ weekday: 'short' })} {new Date(cls.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </li>
            ))}
          </ul>
        </div>
        {showModal && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-full max-w-lg">
              <h2 className="font-semibold mb-2">{selectedClass.name}</h2>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th className="w-1/4">Estado</th>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClass.students.map((st) => (
                    <tr key={st._id} className="border-t">
                      <td>{st.name}</td>
                      <td>
                        <select
                          className="border p-1"
                          value={attendance[st._id]?.status || ''}
                          onChange={(e) => handleStatusChange(st._id, e.target.value)}
                        >
                          <option value="">--</option>
                          <option value="presente">Asistió</option>
                          <option value="tardanza">Tardanza</option>
                          <option value="falta">Falta</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="border p-1 w-full"
                          value={attendance[st._id]?.comment || ''}
                          onChange={(e) => handleCommentChange(st._id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={submitAttendance}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Guardar Asistencia
              </button>
              
              <button
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
      {showReport && (
          <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} mode="teacher" teacherId={jwtDecode(localStorage.getItem('token')).id} />
        )}
    </div>
    </div>
   );
};

export default DocenteDashboard;

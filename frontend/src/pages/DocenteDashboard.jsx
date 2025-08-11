import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jwtDecode from 'jwt-decode';
import api from '../api';

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
  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [attendance, setAttendance] = useState({}); // { studentId: { status, comment } }
  const [savedAttendance, setSavedAttendance] = useState({}); // { classId: attendanceObj }

    useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const { id } = jwtDecode(token);
    const fetchClasses = async () => {
      const { data } = await api.get(`/classes/teacher/${id}`);
      setClasses(data);
      setEvents(
        data.map((cls) => ({
          id: cls._id,
          title: cls.name,
          start: cls.start,
          end: cls.end,
          extendedProps: { cls },
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
      date: new Date(),
      records,
    });
    // guarda asistencia local para esta clase
  setSavedAttendance((prev) => ({ ...prev, [selectedClass._id]: attendance }));
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel Docente</h1>
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
          <ul>
            {classes.map((cls) => (
              <li
                key={cls._id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedClass?._id === cls._id ? 'bg-gray-200' : ''
                }`}
                onClick={() => openClass(cls._id)}
              >
                {cls.name}
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
                className="mt-2 text-sm text-gray-600 underline"
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocenteDashboard;

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../api';

const CoordinadorDashboard = () => {
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [slotInfo, setSlotInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);

  const fetchStudents = async () => {
    const { data } = await api.get('/students');
    setStudents(data);
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data } = await api.get('/users?role=docente');
      setTeachers(data);
    };
    fetchStudents();
    loadClasses();
    fetchTeachers();
  }, []);

  const loadClasses = async () => {
    const { data } = await api.get('/classes');
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

  const addStudent = async () => {
    await api.post('/students', {
      name,
      parentEmail,
    });
    setName('');
    setParentEmail('');
    fetchStudents();
  };

  const deleteStudent = async (id) => {
    await api.delete(`/students/${id}`);
    fetchStudents();
  };

  const createClass = async () => {
    if (!newClassName || !slotInfo) return;
    try {
      const { data } = await api.post('/classes', {
        name: newClassName,
        teacher: selectedTeacher,
        students: selectedStudents,
        start: slotInfo.start,
        end: slotInfo.end,
      });
      setEvents((prev) => [
        ...prev,
        {
          id: data._id,
          title: data.name,
          start: data.start,
          end: data.end,
          extendedProps: { cls: data },
        },
      ]);
      closeModal();
    } catch (err) {
      alert('Error al crear clase');
    }
  };

  const updateClass = async () => {
    if (!editingClassId) return;
    try {
      const { data } = await api.put(`/classes/${editingClassId}`, {
        name: newClassName,
        teacher: selectedTeacher,
        students: selectedStudents,
      });
      // Update event list
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingClassId
            ? {
                ...ev,
                title: data.name,
                extendedProps: { cls: data },
              }
            : ev
        )
      );
      closeModal();
    } catch (err) {
      alert('Error al actualizar clase');
    }
  };

  const openCreateModal = (info) => {
    setIsEditing(false);
    setEditingClassId(null);
    setNewClassName('');
    setSelectedTeacher('');
    setSelectedStudents([]);
    setSlotInfo(info);
    setShowModal(true);
  };

  const openEditModalFromEvent = (event) => {
    const cls = event.extendedProps.cls;
    setIsEditing(true);
    setEditingClassId(cls._id);
    setNewClassName(cls.name || '');
    // teacher can be populated object or id
    setSelectedTeacher(cls.teacher?._id || cls.teacher || '');
    // students can be populated array or ids
    setSelectedStudents((cls.students || []).map((s) => s?._id || s));
    setSlotInfo(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingClassId(null);
    setNewClassName('');
    setSelectedTeacher('');
    setSelectedStudents([]);
    setSlotInfo(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel Coordinador</h1>

      {/* Agregar alumno */}
      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="font-semibold mb-2">Agregar Alumno</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Nombre"
            className="border p-2 flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Email del Padre"
            className="border p-2 flex-1"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
          />
          <button onClick={addStudent} className="bg-blue-600 text-white px-4">
            Guardar
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="font-semibold mb-2">Calendario Semanal</h2>
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          weekends={false}
          initialView="timeGridWeek"
          selectable
          selectMirror
          events={events}
          select={openCreateModal}
          eventClick={(clickInfo) => openEditModalFromEvent(clickInfo.event)}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">{isEditing ? 'Editar Clase' : 'Nueva Clase'}</h3>
              <div className="mb-3">
                <label className="block mb-1">Nombre de la clase</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Docente</label>
                <select
                  className="border p-2 w-full"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="">Seleccione</option>
                  {teachers.map((t) => (
                    <option value={t._id} key={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Alumnos</label>
                <select
                  multiple
                  className="border p-2 w-full h-32"
                  value={selectedStudents}
                  onChange={(e) =>
                    setSelectedStudents(
                      Array.from(e.target.selectedOptions, (opt) => opt.value)
                    )
                  }
                >
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={isEditing ? updateClass : createClass}
                >
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de alumnos */}
      <div className="bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-2">Alumnos</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Padre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st._id} className="border-t">
                <td>{st.name}</td>
                <td>{st.parent?.email}</td>
                <td>
                  <button
                    onClick={() => deleteStudent(st._id)}
                    className="text-red-600"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoordinadorDashboard;

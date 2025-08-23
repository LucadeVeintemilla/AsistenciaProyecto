import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../api';

const CoordinadorDashboard = () => {
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedExistingClass, setSelectedExistingClass] = useState('');

  const uniqueClasses = useMemo(() => {
    const seen = new Set();
    return classes.filter((c) => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }, [classes]);
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

  const saveStudent = async () => {
    if (editingStudentId) {
      await api.put(`/students/${editingStudentId}`, {
        name,
        parentEmail,
      });
      setEditingStudentId(null);
    } else {
      await api.post('/students', {
        name,
        parentEmail,
      });
    }
    setName('');
    setParentEmail('');
    fetchStudents();
  };

  const deleteStudent = async (id) => {
    await api.delete(`/students/${id}`);
    fetchStudents();
  };

  const startEditStudent = (student) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingStudentId(student._id);
    setName(student.name || '');
    setParentEmail(student.parent?.email ?? '');
  };

  const createClass = async () => {
    if (!slotInfo) return;
    try {
      let clsData;
      if (selectedExistingClass) {
        // crear nueva clase tomando como plantilla la seleccionada
        const template = classes.find((c) => c._id === selectedExistingClass);
        if (!template) return;
        const { data } = await api.post('/classes', {
          name: template.name,
          teacher: template.teacher?._id || template.teacher,
          students: (template.students || []).map((s) => s?._id || s),
          start: slotInfo.start,
          end: slotInfo.end,
        });
        clsData = data;
        setClasses((prev) => [...prev, data]);
      } else {
        if (!newClassName) return;
        const { data } = await api.post('/classes', {
          name: newClassName,
          teacher: selectedTeacher,
          students: selectedStudents,
          start: slotInfo.start,
          end: slotInfo.end,
        });
        clsData = data;
        // actualizar listas
        setClasses((prev) => [...prev, data]);
      }
      // añadir evento
      setEvents((prev) => [
        ...prev,
        {
          id: clsData._id,
          title: clsData.name,
          start: slotInfo.start,
          end: slotInfo.end,
          extendedProps: { cls: clsData },
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
    setSelectedExistingClass('');
    setShowModal(false);
    setIsEditing(false);
    setEditingClassId(null);
    setNewClassName('');
    setSelectedTeacher('');
    setSelectedStudents([]);
    setSlotInfo(null);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar title="Panel Coordinador" />
      <div className="p-4 max-w-7xl mx-auto">
    
      <h1 className="text-2xl font-bold mb-4">Panel Coordinador</h1>

      {/* Agregar / Editar alumno */}
      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="font-semibold mb-2">{editingStudentId ? 'Editar Alumno' : 'Agregar Alumno'}</h2>
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
          <button onClick={saveStudent} className="bg-blue-600 text-white px-4">
            {editingStudentId ? 'Actualizar' : 'Guardar'}
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
              {!isEditing && (
                <div className="mb-3">
                  <label className="block mb-1">Seleccionar clase existente</label>
                  <select
                    className="border p-2 w-full"
                    value={selectedExistingClass}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedExistingClass(val);
                      if (val) {
                        const cls = classes.find((c) => c._id === val);
                        if (cls) {
                          setNewClassName(cls.name);
                          setSelectedTeacher(cls.teacher?._id || cls.teacher || '');
                          setSelectedStudents((cls.students || []).map((s) => s?._id || s));
                        }
                      } else {
                        setNewClassName('');
                        setSelectedTeacher('');
                        setSelectedStudents([]);
                      }
                    }}
                  >
                    <option value="">-- Ninguna --</option>
                    {uniqueClasses.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
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
                    onClick={() => startEditStudent(st)}
                    className="text-blue-600 mr-2"
                  >
                    Editar
                  </button>
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
    </div>
  );
};
export default CoordinadorDashboard;

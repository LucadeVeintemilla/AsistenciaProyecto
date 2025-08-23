import { useEffect, useState } from 'react';
import api from '../api';

const ReportModal = ({ isOpen, onClose, mode, teacherId, studentId }) => {
  if (!isOpen) return null;

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ classId: '', student: '', period: 'week' });
  const [report, setReport] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (mode === 'teacher') {
        const { data: cls } = teacherId ? await api.get(`/classes/teacher/${teacherId}`) : await api.get('/classes');
        setClasses(cls);
        // build student list from classes (unique)
        const unique = new Map();
        cls.forEach((c) => {
          (c.students || []).forEach((s) => unique.set(s._id, s.name));
        });
        setStudents(Array.from(unique, ([id, name]) => ({ _id: id, name })));
      } else if (mode === 'parent' && studentId) {
        // obtener cursos en los que está matriculado el alumno
        const { data: cls } = await api.get('/classes', { params: { student: studentId } });
        // eliminar duplicados por nombre
        const uniqueByName = [];
        const seen = new Set();
        cls.forEach((c) => {
          if (!seen.has(c.name)) {
            seen.add(c.name);
            uniqueByName.push(c);
          }
        });
        setClasses(uniqueByName);
      }
    };
    load();
  }, [mode, teacherId]);

  const fetchReport = async () => {
    
    const endpoint = mode === 'teacher' ? '/reports/teacher' : '/reports/parent';
    // construir params sin incluir filtros vacíos
    const buildParams = () => {
      const base = mode === 'teacher' ? { teacher: teacherId } : { student: studentId };
      if (mode === 'teacher' && filters.student) base.student = filters.student;
      if (filters.classId) base.classId = filters.classId;
      if (filters.period) base.period = filters.period;
      return base;
    };
    const params = buildParams();
    const { data } = await api.get(endpoint, { params });
    setReport(data);
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-2xl max-h-screen overflow-auto">
        <h3 className="text-xl font-semibold mb-4">Reporte de Seguimiento</h3>

        <div className="flex flex-wrap gap-3 mb-4">
          {mode === 'teacher' && (
            <>
              <select
                className="border p-2"
                value={filters.student}
                onChange={(e) => setFilters({ ...filters, student: e.target.value })}
              >
                <option value="">Todos los alumnos</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </>
          )}
          <select
            className="border p-2"
            value={filters.classId}
            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
          >
            <option value="">Todos los cursos</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            className="border p-2"
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="all">Todo</option>
          </select>
          <button className="bg-blue-600 text-white px-4" onClick={fetchReport}>Filtrar</button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Curso</th>
              {mode === 'teacher' && <th>Alumno</th>}
              <th>Presente</th>
              <th>Tardanza</th>
              <th>Falta</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r, idx) => (
              <tr key={idx} className="border-t">
                <td>{r.className}</td>
                {mode === 'teacher' && (
                    <td>{students.find((s) => s._id === r.student)?.name || r.student}</td>
                  )}
                <td>{r.presente}</td>
                <td>{r.tardanza}</td>
                <td>{r.falta}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;

import { useEffect, useState } from 'react';
import { getISOWeek as getWeek } from 'date-fns';
import AttendanceChart from '../components/AttendanceChart';
import Navbar from '../components/Navbar';
import api from '../api';
import io from 'socket.io-client';
import jwtDecode from 'jwt-decode';

const socket = io('http://localhost:5000');

const PsicologoDashboard = () => {
  const token = localStorage.getItem('token');
  const [studentsAtRisk, setStudentsAtRisk] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // filtros y datos para gráfico
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [weekRanges, setWeekRanges] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const [chartWeeks, setChartWeeks] = useState([]);
  const [chartPercentages, setChartPercentages] = useState([]);
  const [chartLabel, setChartLabel] = useState('');

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

  // cargar lista de cursos al montar
  useEffect(() => {
    const loadCourses = async () => {
      const { data } = await api.get('/classes');
      // eliminar duplicados por nombre de clase
      const unique = [];
      const seen = new Set();
      data.forEach((cls) => {
        if (!seen.has(cls.name)) {
          seen.add(cls.name);
          unique.push(cls);
        }
      });
      setCourses(unique);
    };
    loadCourses();
  }, []);

  // actualizar estudiantes cuando cambia curso
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setSelectedStudent('');
      return;
    }
    const cls = courses.find((c) => c._id === selectedCourse);
    setStudents(cls?.students || []);
    setSelectedStudent('');
  }, [selectedCourse, courses]);

  // cargar semanas disponibles cuando se actualiza la lista de estudiantes
  useEffect(() => {
    const loadWeeks = async () => {
      if (!students.length) {
        setWeekRanges([]);
        setSelectedRange(null);
        return;
      }
      const weekSet = new Set();
      for (const st of students) {
        const { data } = await api.get(`/attendance/student/${st._id}`);
        data.forEach((rec) => {
          weekSet.add(getWeek(new Date(rec.date)));
        });
      }
      const sorted = [...weekSet].sort((a, b) => a - b);
      if (!sorted.length) {
        setWeekRanges([]);
        setSelectedRange(null);
        return;
      }
      const ranges = [
        { label: 'Todas', start: sorted[0], end: sorted[sorted.length - 1] },
        ...sorted.map((w) => ({ label: `Semana ${w}`, start: w, end: w })),
      ];
      setWeekRanges(ranges);
      setSelectedRange(ranges[0]);
    };
    loadWeeks();
  }, [students]);

  // recalcular datos del gráfico cuando cambian filtros
  useEffect(() => {
    const calcChart = async () => {
      if (!selectedCourse) return;
      // determine filter mode
      const useDate = dateStart && dateEnd;
      if (!useDate && !selectedRange) return;
      const weeksArr = [];
      const percArr = [];
      if (!useDate) {
        for (let w = selectedRange.start; w <= selectedRange.end; w++) {
          weeksArr.push(w);
          percArr.push(null);
        }
      }

      if (selectedStudent) {
        const { data } = await api.get(`/attendance/student/${selectedStudent}`);
        // filtrar por curso (className) opcional
        const list = useDate
          ? data.filter((d) => {
              const dt = new Date(d.date);
              return dt >= new Date(dateStart) && dt <= new Date(dateEnd);
            })
          : data.filter((d) => {
              const wk = getWeek(new Date(d.date));
              return wk >= selectedRange.start && wk <= selectedRange.end;
            });
        const byWeek = {};
        list.forEach((rec) => {
          const wk = getWeek(new Date(rec.date));
          if (!byWeek[wk]) byWeek[wk] = { total: 0, present: 0 };
          byWeek[wk].total += 1;
          if (rec.status === 'presente') byWeek[wk].present += 1;
        });
        weeksArr.forEach((wk, idx) => {
          const info = byWeek[wk];
          percArr[idx] = info ? (info.present / info.total) * 100 : null;
        });
        setChartLabel(`Alumno seleccionado`);
      } else {
        // promedio curso
        const promises = students.map((st) => api.get(`/attendance/student/${st._id}`));
        const results = await Promise.all(promises);
        const agg = {};
        if (!useDate) weeksArr.forEach((wk) => (agg[wk] = { total: 0, present: 0 }));
        results.forEach(({ data }) => {
          data.forEach((rec) => {
            const dt = new Date(rec.date);
            if (useDate) {
              if (dt < new Date(dateStart) || dt > new Date(dateEnd)) return;
              const wk = getWeek(dt);
              if (!agg[wk]) agg[wk] = { total: 0, present: 0 };
              agg[wk].total += 1;
              if (rec.status === 'presente') agg[wk].present += 1;
            } else {
              const wk = getWeek(dt);
              if (wk < selectedRange.start || wk > selectedRange.end) return;
              agg[wk].total += 1;
              if (rec.status === 'presente') agg[wk].present += 1;
            }
          });
        });
        if (useDate) {
          const allWeeks = Object.keys(agg).sort((a,b)=>a-b);
          allWeeks.forEach((wk) => {
            weeksArr.push(Number(wk));
            const info = agg[wk];
            percArr.push(info.total ? (info.present / info.total) * 100 : null);
          });
        } else {
          weeksArr.forEach((wk, idx) => {
            const info = agg[wk];
            percArr[idx] = info.total ? (info.present / info.total) * 100 : null;
          });
        }
        setChartLabel('Promedio curso');
      }
      setChartWeeks(weeksArr);
      setChartPercentages(percArr);
    };
    calcChart();
  }, [selectedCourse, selectedStudent, selectedRange, students, dateStart, dateEnd]);

  // cargar riesgo de asistencia y escuchar alertas socket
  useEffect(() => {
    const loadRisk = async () => {
      const { data: studs } = await api.get('/students');
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
    };
    loadRisk();
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

          {/* Alertas */}
          <div className="bg-white p-4 shadow rounded mb-8">
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

          {/* Filtros */}
          <div className="bg-white p-4 shadow rounded mb-6 flex flex-wrap gap-4 items-center">
            <select className="border p-2" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Seleccione curso</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select className="border p-2" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} disabled={!students.length}>
              <option value="">{students.length ? 'Todos los alumnos' : 'Seleccione curso'}</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            {/* Fecha inicio */}
            <input type="date" className="border p-2" value={dateStart} onChange={(e)=>{setDateStart(e.target.value); setSelectedRange(null);}} />
            {/* Fecha fin */}
            <input type="date" className="border p-2" value={dateEnd} onChange={(e)=>{setDateEnd(e.target.value); setSelectedRange(null);}} />
            {/* Semana */}
            <select className="border p-2" value={selectedRange?.label || ''} onChange={(e) => setSelectedRange(weekRanges.find((r) => r.label === e.target.value))} disabled={!weekRanges.length || (dateStart && dateEnd)}>
              {weekRanges.map((r) => (
                <option key={r.label} value={r.label}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Gráfico */}
          <div className="bg-white p-4 shadow rounded">
            {chartWeeks.length > 0 ? (
              <AttendanceChart weeks={chartWeeks} percentages={chartPercentages} label={chartLabel} />
            ) : (
              <p className="text-gray-500">Seleccione curso/alumno y rango de semanas para mostrar el gráfico.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsicologoDashboard;

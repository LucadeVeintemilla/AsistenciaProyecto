import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const AttendanceChart = ({ weeks, percentages, label }) => {
  // determine max & min indices
  const maxIdx = percentages.indexOf(Math.max(...percentages));
  const minIdx = percentages.indexOf(Math.min(...percentages));

  const data = {
    labels: weeks.map((w) => `Semana ${w}`),
    datasets: [
      {
        label,
        data: percentages,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.2)',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: (ctx) => {
          const idx = ctx.dataIndex;
          if (idx === maxIdx) return '#16a34a'; // green for max
          if (idx === minIdx) return '#dc2626'; // red for min
          return '#0ea5e9';
        },
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolución de asistencia',
      },
      datalabels: {
        display: (ctx) => {
          const idx = ctx.dataIndex;
          return idx === maxIdx || idx === minIdx;
        },
        formatter: (value) => `${value.toFixed(1)}%`,
        color: (ctx) => (ctx.dataIndex === maxIdx ? '#16a34a' : '#dc2626'),
        align: 'top',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (val) => `${val}%`,
        },
      },
    },
  };

  return <Line options={options} data={data} />;
};

export default AttendanceChart;

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ChartModal({ show, onClose, chartData }) {
  if (!show) return null;
  // chartData: { labels: [], datasets: [{ label, data }] }
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 500, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
        <h3>Gráfico</h3>
        <div style={{ height: 220, width: 400, background: '#e3f2fd', border: '1px solid #90caf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {chartData && chartData.labels && chartData.datasets ? (
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
          ) : (
            <span>Selecione um intervalo de dados numéricos para gerar o gráfico.</span>
          )}
        </div>
        <button style={{ marginTop: 16 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
} 
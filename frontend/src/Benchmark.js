import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import api from './api';
import './Portal.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Benchmark = ({ onClose }) => {
  const [productId, setProductId] = useState('');
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmark = async (runs = 5) => {
    if (!productId) {
      setMessage("⚠️ Please enter a ProductID first!");
      return;
    }

    setIsRunning(true);
    setResults(null);
    setMessage(null);

    try {
      // 1. Kiểm tra sản phẩm có tồn tại và In Stock không
      const checkRes = await api.get(`/api/products/public/${productId}`);
      
      const status = checkRes.data?.Status;

      if (status !== 'instock') {
        setMessage("⚠️ Product is Out of Stock or Not Found. Cannot benchmark.");
        setIsRunning(false);
        return;
      }

      let fastTimes = [];
      let slowTimes = [];

      // 2. Chạy loop test
      for (let i = 0; i < runs; i++) {
        const startFast = performance.now();
        await api.get(`/api/products/public/${productId}`);
        fastTimes.push(performance.now() - startFast);

        const startSlow = performance.now();
        await api.get(`/api/products/public-slow/${productId}`);
        slowTimes.push(performance.now() - startSlow);
      }

      const avgFast = fastTimes.reduce((a, b) => a + b, 0) / runs;
      const avgSlow = slowTimes.reduce((a, b) => a + b, 0) / runs;

      setResults({ fastTimes, slowTimes, avgFast, avgSlow });
      setIsRunning(false);

    } catch (err) {
      console.error(err);
      setMessage("❌ Error: Product ID invalid or Server Error.");
      setIsRunning(false);
    }
  };

  const chartData = results && {
    labels: Array.from({ length: results.fastTimes.length }, (_, i) => `Run ${i + 1}`),
    datasets: [
      {
        label: 'Optimized API (SQL Filter)',
        data: results.fastTimes,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Legacy API (JS Filter)',
        data: results.slowTimes,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Response Time Comparison (ms)' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Time (ms)' } }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '700px', maxWidth: '95%' }}>
        
        {/* HEADER MÀU CAM */}
        <div className="modal-header" style={{ 
            background: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)', 
            margin: '-30px -30px 20px -30px', 
            padding: '20px 30px',
            borderRadius: '12px 12px 0 0',
            borderBottom: 'none'
        }}>
          <div style={{color: 'white'}}>
            <h3 style={{color: 'white', fontSize: '1.5rem', marginBottom: '5px'}}>🚀 API Performance Test</h3>
            <p style={{margin: 0, opacity: 0.9, fontSize: '0.9rem'}}>Compare execution speed between Optimized vs Legacy endpoints</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{color: 'white', opacity: 0.8}}>&times;</button>
        </div>

        {/* INPUT SECTION */}
        <div className="form-row" style={{ alignItems: 'flex-end', gap: '15px', marginBottom: '20px' }}>
          <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
            <label style={{color: '#FF5E62'}}>Target Product ID</label>
            <input
              type="number"
              min="0"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter ID (e.g. 10)"
              style={{ padding: '12px', border: '1px solid #FFCCBC', background: '#FFF5F2' }}
            />
          </div>
          <button 
            className="btn-primary" 
            onClick={() => runBenchmark(5)} 
            disabled={isRunning}
            style={{ 
                background: isRunning ? '#ccc' : 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',
                border: 'none',
                height: '46px',
                minWidth: '150px'
            }}
          >
            {isRunning ? 'Testing...' : '▶ Run Benchmark'}
          </button>
        </div>

        {message && (
          <div style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              background: message.includes('Error') ? '#FFEBEE' : '#FFF3E0', 
              color: message.includes('Error') ? '#C62828' : '#EF6C00',
              marginBottom: '20px',
              fontWeight: 500,
              border: `1px solid ${message.includes('Error') ? '#FFCDD2' : '#FFE0B2'}`
          }}>
            {message}
          </div>
        )}

        {/* RESULTS SECTION */}
        {results && (
          <div className="benchmark-results" style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1, padding: '15px', background: '#E0F2F1', borderRadius: '10px', textAlign: 'center', border: '1px solid #B2DFDB' }}>
                    <div style={{ fontSize: '0.85rem', color: '#00695C', fontWeight: 600 }}>OPTIMIZED API</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#004D40' }}>{results.avgFast.toFixed(2)} <span style={{fontSize:'1rem'}}>ms</span></div>
                </div>
                <div style={{ flex: 1, padding: '15px', background: '#FFEBEE', borderRadius: '10px', textAlign: 'center', border: '1px solid #FFCDD2' }}>
                    <div style={{ fontSize: '0.85rem', color: '#C62828', fontWeight: 600 }}>LEGACY API</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#B71C1C' }}>{results.avgSlow.toFixed(2)} <span style={{fontSize:'1rem'}}>ms</span></div>
                </div>
            </div>
            
            <div style={{ height: '250px' }}>
                <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '20px', borderTop: '1px solid #eee' }}>
          <button 
            className="btn-secondary" 
            onClick={onClose}
            style={{ color: '#555', borderColor: '#ddd' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Benchmark;
import React, { useState } from 'react';
import { PortalLayout } from './Sidebar';
import './Dashboard.css'; 
import Benchmark from './Benchmark'; 
import api from './api';

const Service = () => {
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- 1. XỬ LÝ BACKUP ---
  const handleBackup = async () => {
    if(!window.confirm("Start database backup?")) return;
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await api.post('/api/admin/backup', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert(`Backup Success!\nURL: ${res.data.url}`);
    } catch (error) {
        console.error(error);
        alert("Backup Failed!");
    } finally {
        setLoading(false);
    }
  };

  // --- 2. XỬ LÝ RECOVERY ---
  const handleRecovery = async () => {
    if(!window.confirm("Are you sure? This will overwrite current data with the latest backup.")) return;
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        await api.post('/api/admin/recovery', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Recovery Success!");
    } catch (error) {
        console.error(error);
        alert("Recovery Failed!");
    } finally {
        setLoading(false);
    }
  };

  // --- 3. XỬ LÝ INDEXING (MỚI) ---
  const handleIndexing = async () => {
    if(!window.confirm("Start manual database indexing?")) return;
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        // Gọi API GET /api/index đã tạo ở bước trước
        await api.get('/api/index', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // // Popup thông báo đúng yêu cầu
        // alert("Quá trình Indexing đã được kích hoạt thành công!");
    } catch (error) {
        console.error("Indexing Error:", error);
        alert("Indexing Failed! Check server logs.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <PortalLayout pageTitle="Service Management">
      <div className="main-content-card">
        
        {loading && (
            <div style={{
                marginBottom: '20px', 
                padding: '10px', 
                backgroundColor: '#fff3cd', 
                color: '#856404', 
                borderRadius: '8px',
                border: '1px solid #ffeeba'
            }}>
                ⚙️ Processing request... please wait.
            </div>
        )}

        <div className="dashboard-cards">
          <div className="dashboard-row">
 
            {/* Card 1: BACKUP - Blue */}
            <div className="dash-card card-solid bg-blue">
              <div className="dash-card-content">
                <div className="dash-card-info">
                    <div className="dash-card-label">Data Safety</div>
                    <div className="dash-card-value">Backup</div>
                    <p className="dash-card-desc">Create a secure copy of your database to the cloud.</p>
                    
                    <button className="card-action-btn text-blue" onClick={handleBackup} disabled={loading}>
                        <span>☁️</span> Start Backup
                    </button>
                </div>
                <div className="dash-card-icon-large">
                    <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                </div>
              </div>
            </div>

            {/* Card 2: RECOVERY - Green */}
            <div className="dash-card card-solid bg-green">
              <div className="dash-card-content">
                <div className="dash-card-info">
                    <div className="dash-card-label">Restoration</div>
                    <div className="dash-card-value">Recovery</div>
                    <p className="dash-card-desc">Restore database from the latest cloud backup point.</p>
                    
                    <button className="card-action-btn text-green" onClick={handleRecovery} disabled={loading}>
                        <span>📥</span> Restore Data
                    </button>
                </div>
                <div className="dash-card-icon-large">
                    <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" transform="rotate(180 12 12)"/></svg>
                </div>
              </div>
            </div>

            {/* Card 3: INDEXING (MỚI) - Purple */}
            <div className="dash-card card-solid bg-purple">
              <div className="dash-card-content">
                <div className="dash-card-info">
                    <div className="dash-card-label">Optimization</div>
                    <div className="dash-card-value">Indexing</div>
                    <p className="dash-card-desc">Optimize query speed by refreshing database indexes.</p>
                    
                    <button className="card-action-btn text-purple" onClick={handleIndexing} disabled={loading}>
                        <span>⚡</span> Start Indexing
                    </button>
                </div>
                <div className="dash-card-icon-large">
                   {/* Icon tia sét / database */}
                   <svg viewBox="0 0 24 24">
                        <path d="M7 2v11h3v9l7-12h-4l4-8z"/> 
                   </svg>
                </div>
              </div>
            </div>

            {/* Card 4: BENCHMARK - Orange */}
            <div className="dash-card card-solid bg-orange">
              <div className="dash-card-content">
                <div className="dash-card-info">
                    <div className="dash-card-label">Performance</div>
                    <div className="dash-card-value">Benchmark</div>
                    <p className="dash-card-desc">Compare API response speeds (SQL vs Logic filtering).</p>
                    
                    <button className="card-action-btn text-orange" onClick={() => setShowBenchmark(true)} disabled={loading}>
                        <span>🚀</span> Run Test
                    </button>
                </div>
                <div className="dash-card-icon-large">
                    <svg viewBox="0 0 24 24"><path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/></svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Popup Benchmark */}
        {showBenchmark && (
          <Benchmark onClose={() => setShowBenchmark(false)} />
        )}
      </div>
    </PortalLayout>
  );
};

export default Service;
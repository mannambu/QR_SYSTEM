import React, { useEffect, useState } from 'react';
import { PortalLayout } from './Sidebar';
import './Dashboard.css';
import './Portal.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import api from './api';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const Dashboard = () => {
  const [counts, setCounts] = useState({
    total: 0,
    instock: 0,
    outstock: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    staff: 0,
    admin: 0
  });
  const [trend, setTrend] = useState([]);

  // lấy role từ localStorage
  const role = localStorage.getItem("userRole");

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    api.get('/api/product/count', { headers })
      .then(res => setCounts(prev => ({ ...prev, total: res.data.total })));

    api.get('/api/product/status-count', { headers })
      .then(res => setCounts(prev => ({ ...prev, instock: res.data.instock, outstock: res.data.outstock })));

    api.get('/api/product/approval-count', { headers })
      .then(res => setCounts(prev => ({
        ...prev,
        approved: res.data.approved,
        pending: res.data.pending,
        rejected: res.data.rejected
      })));

    // chỉ gọi API role-count nếu là admin
    if (role === "admin") {
      api.get('/api/users/role-count', { headers })
        .then(res => setCounts(prev => ({ ...prev, staff: res.data.staff, admin: res.data.admin })));
    }

    api.get('/api/product/update-trend', { headers })
      .then(res => setTrend(res.data));
  }, [role]);

  const lineData = {
    labels: trend.map(t => t.date),
    datasets: [
      {
        label: 'Product Updates',
        data: trend.map(t => t.count),
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  return (
    <PortalLayout pageTitle="System Overview">
      <div className="main-content-card">
        
        {/* --- KHU VỰC THẺ SẢN PHẨM (HÀNG 1 - NỀN ĐẬM) --- */}
        <div className="dashboard-cards">
          <div className="dashboard-row">
            
            {/* Card 1: Total Products - SOLID BLUE */}
            <div className="dash-card card-solid bg-blue">
              <div className="dash-card-content">
                <div className="dash-card-info">
                    <div className="dash-card-value">{counts.total}</div>
                    <div className="dash-card-label">Total Products</div>
                </div>
                <div className="dash-card-icon-large">
                    <svg viewBox="0 0 24 24">
                        <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.41 21.94 12.21 22 12 22C11.79 22 11.59 21.94 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.59 2.06 11.79 2 12 2C12.21 2 12.41 2.06 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z" />
                    </svg>
                </div>
              </div>
            </div>

            {/* Card 2: In Stock - SOLID GREEN */}
            <div className="dash-card card-solid bg-green">
              <div className="dash-card-content">
                <div className="dash-card-info">
                    <div className="dash-card-value">{counts.instock}</div>
                    <div className="dash-card-label">In Stock</div>
                </div>
                <div className="dash-card-icon-large">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                </div>
              </div>
            </div>

            {/* Card 3: Out of Stock - SOLID RED */}
            <div className="dash-card card-solid bg-red">
              <div className="dash-card-content">
                <div className="dash-card-info">
                    <div className="dash-card-value">{counts.outstock}</div>
                    <div className="dash-card-label">Out of Stock</div>
                </div>
                <div className="dash-card-icon-large">
                    <svg viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                </div>
              </div>
            </div>

          </div>

          {/* --- KHU VỰC ADMIN (HÀNG 2 & 3 - NỀN TRẮNG) --- */}
          {role === "admin" && (
            <>
              {/* Hàng 2: Trạng thái duyệt */}
              <div className="dashboard-row">
                
                {/* Approved - NỀN TRẮNG, ICON XANH */}
                <div className="dash-card icon-approved">
                  <div className="dash-card-content">
                    <div className="dash-card-info">
                        <div className="dash-card-value">{counts.approved}</div>
                        <div className="dash-card-label">Approved</div>
                    </div>
                    <div className="dash-card-icon-large">
                        <svg viewBox="0 0 24 24"><path d="M9 16.17l-3.88-3.88L4 13.41l5 5 10-10-1.41-1.41z" /></svg>
                    </div>
                  </div>
                </div>
                
                {/* Pending - NỀN TRẮNG, ICON CAM */}
                <div className="dash-card icon-pending">
                  <div className="dash-card-content">
                    <div className="dash-card-info">
                        <div className="dash-card-value">{counts.pending}</div>
                        <div className="dash-card-label">Pending</div>
                    </div>
                    <div className="dash-card-icon-large">
                        <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Rejected - NỀN TRẮNG, ICON ĐỎ */}
                <div className="dash-card icon-rejected">
                  <div className="dash-card-content">
                    <div className="dash-card-info">
                        <div className="dash-card-value">{counts.rejected}</div>
                        <div className="dash-card-label">Rejected</div>
                    </div>
                    <div className="dash-card-icon-large">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hàng 3: Người dùng */}
              <div className="dashboard-row">
                
                {/* Staff - NỀN TRẮNG, ICON TÍM */}
                <div className="dash-card icon-staff">
                  <div className="dash-card-content">
                    <div className="dash-card-info">
                        <div className="dash-card-value">{counts.staff}</div>
                        <div className="dash-card-label">Staff</div>
                    </div>
                    <div className="dash-card-icon-large">
                        <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Admins - NỀN TRẮNG, ICON XANH DƯƠNG */}
                <div className="dash-card icon-admin">
                  <div className="dash-card-content">
                    <div className="dash-card-info">
                        <div className="dash-card-value">{counts.admin}</div>
                        <div className="dash-card-label">Admins</div>
                    </div>
                    <div className="dash-card-icon-large">
                        <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Biểu đồ xu hướng */}
        <div className="trend-chart" style={{marginTop: '30px'}}>
          <h3>Product Update Trend</h3>
          <Line data={lineData} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;
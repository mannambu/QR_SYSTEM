import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Portal.css';

// Hàm lấy thông tin user từ localStorage
const getLoggedInUser = () => {
  const role = localStorage.getItem('userRole');
  const email = localStorage.getItem('userMail');
  const name = localStorage.getItem('userName');

  if (!role || !email) {
    return { role: null, email: null, name: 'Guest' };
  }

  return { name, email, role };
};

// Danh sách menu (role viết thường)
const navItems = [
  { to: "/dashboard", icon: "📈", label: "Dashboard", roles: ["admin", "staff"] },
  { to: "/request-list", icon: "📝", label: "Request List", roles: ["admin", "staff"] },
  { to: "/product-management", icon: "📦", label: "Product Management", roles: ["admin", "staff"] },
  { to: "/service", icon: "👤", label: "Service Management", roles: ["admin"] },
];

const Sidebar = () => {
  const location = useLocation();
  const loggedInUser = getLoggedInUser();
  const userRole = loggedInUser.role ? loggedInUser.role.toLowerCase() : null;
  const userName = loggedInUser.name;
  const userEmail = loggedInUser.email;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Logic hiển thị tên Portal dựa trên role
  const portalTitle = userRole === 'admin' ? 'Admin Portal' : 'Staff Portal';

  return (
    <div className="sidebar">
      <header className="sidebar-header">
        <div className="app-logo"></div>
        
        <div className="brand-container">
           <span className="brand-title">FruitTrace</span>
           <span className="brand-subtitle">{portalTitle}</span>
        </div>
      </header>

      <nav className="nav-menu">
        {navItems.map(item => (
          userRole && item.roles.includes(userRole) && (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${location.pathname.startsWith(item.to) ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        ))}
      </nav>

      <div className="user-section">
        <div className="user-info">
          <div className="user-avatar">{userRole ? userRole.slice(0, 2).toUpperCase() : "??"}</div>
          <div className="user-details">
            <strong>{userName}</strong>
            <span>{userEmail}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">Log Out</button>
      </div>
    </div>
  );
};

export const PortalLayout = ({ children, pageTitle }) => {
  const finalDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="portal-layout">
      <Sidebar />
      <div className="content-area">
        <header className="content-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>{finalDate}</p>
          </div>
          {/* <button className="notification-bell">🔔</button> */}
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};

export default Sidebar;
import React, { useState } from 'react';
import { PortalLayout } from './Sidebar';
import './Portal.css';

// Mock Data (Đầy đủ và chi tiết hơn)
const initialUsers = [
    { 
        id: 1, 
        name: 'Admin User', 
        email: 'admin@example.com', 
        role: 'Admin', 
        status: 'Active', 
        lastLogin: '20-10-2025 14:30', 
        icon: '🛡️', 
        iconClass: 'icon-admin' 
    },
    { 
        id: 2, 
        name: 'Nguyen Van A', 
        email: 'staff1@example.com', 
        role: 'Staff', 
        status: 'Inactive', 
        lastLogin: '20-10-2025 10:15', 
        icon: '🧑', 
        iconClass: 'icon-staff' 
    },
    { 
        id: 3, 
        name: 'Tran Thi B', 
        email: 'staff2@example.com', 
        role: 'Staff', 
        status: 'Active', 
        lastLogin: '20-10-2025 16:45', 
        icon: '👩', 
        iconClass: 'icon-staff' 
    },
];

const UserManagement = () => {
    const [users, setUsers] = useState(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleAction = (id, action) => {
        if (action === 'edit') {
            alert(`Open Edit Form for User ID: ${id} (DEMO)`);
        } else if (action === 'delete') {
            if (window.confirm(`Are you sure you want to delete user ID: ${id}?`)) {
                setUsers(users.filter(u => u.id !== id));
                alert('User deleted (DEMO).');
            }
        }
    };

    const handleAddUser = () => {
        alert('Open Add New User Modal (DEMO)');
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderRoleBadge = (role) => {
        const className = role === 'Admin' ? 'role-admin' : 'role-staff';
        return <span className={`role-badge ${className}`}>{role}</span>;
    };

    const renderStatusBadge = (status) => {
        const className = status === 'Active' ? 'status-active' : 'status-inactive';
        const label = status === 'Active' ? 'Active' : 'Inactive';
        return <span className={`user-status-badge ${className}`}>{label}</span>;
    };

    return (
        <PortalLayout pageTitle="User Management">
            <div className="main-content-card">
                
                {/* Header - Search & Add */}
                <div className="product-header">
                    <div className="search-input-wrap" style={{ maxWidth: '400px', flexGrow: 1 }}>
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            className="search-input"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    
                    <button className="add-user-btn" onClick={handleAddUser}>
                        Add New User <span style={{fontSize: '1.2rem'}}>+</span>
                    </button>
                </div>

                {/* Table List */}
                <table className="user-table">
                    <thead>
                        <tr>
                            <th style={{ width: '25%' }}>Name</th>
                            <th style={{ width: '25%' }}>Email</th>
                            <th style={{ width: '10%' }}>Role</th>
                            <th style={{ width: '10%' }}>Status</th>
                            <th style={{ width: '15%' }}>Last Login</th>
                            <th style={{ width: '15%', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td className="user-name-cell">
                                    <div className={`user-icon-circle ${u.iconClass}`}>
                                        {u.icon}
                                    </div>
                                    {u.name}
                                </td>
                                <td>{u.email}</td>
                                <td>{renderRoleBadge(u.role)}</td>
                                <td>{renderStatusBadge(u.status)}</td>
                                <td>{u.lastLogin}</td>
                                <td className="user-action-buttons" style={{ textAlign: 'center' }}>
                                    <button onClick={() => handleAction(u.id, 'edit')} title="Edit">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleAction(u.id, 'delete')} title="Delete">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && <p style={{textAlign: 'center', color: '#999', padding: '20px'}}>No users found.</p>}
            </div>
        </PortalLayout>
    );
};

export default UserManagement;
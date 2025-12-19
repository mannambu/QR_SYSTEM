import React, { useState, useEffect, useRef } from 'react';
import { PortalLayout } from './Sidebar';
import './Portal.css';
import './RequestList.css'; 
import './ProductView.css'; 
import ProductForm from './ProductForm';
import api from './api';

// --- 1. MODAL CHI TIẾT ---
const RequestDetailModal = ({ request, onClose }) => {
    const [currentProduct, setCurrentProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    const newData = request.product_info || {};

    let reqTypeDisplay = 'Request';
    let typeColor = '#333';
    if(request.type === 'create') { reqTypeDisplay = 'Create Product'; typeColor = 'green'; }
    if(request.type === 'update') { reqTypeDisplay = 'Update Product'; typeColor = '#FF661A'; }
    if(request.type === 'delete') { reqTypeDisplay = 'Delete Product'; typeColor = 'red'; }

    useEffect(() => {
        if (request.product_id && (request.type === 'update' || request.type === 'delete')) {
            setLoading(true);
            api.get(`/api/products/${request.product_id}`)
                .then(res => {
                    setCurrentProduct(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Lỗi tải dữ liệu gốc:", err);
                    setLoading(false);
                });
        }
    }, [request]);

    const renderDiffRow = (label, keyNew, keyOld, type = 'text') => {
        let newVal = newData[keyNew];
        let oldVal = currentProduct ? currentProduct[keyOld] : null;

        let displayNew = newVal;
        let displayOld = oldVal;

        if (type === 'money') {
            if (newVal) displayNew = Number(newVal).toLocaleString() + ' VND';
            if (oldVal) displayOld = Number(oldVal).toLocaleString() + ' VND';
        } else if (type === 'date') {
            if (newVal) displayNew = new Date(newVal).toLocaleDateString('en-US');
            if (oldVal) displayOld = new Date(oldVal).toLocaleDateString('en-US');
        } else if (type === 'status') {
            const mapStatus = (s) => s === 'instock' ? 'In Stock' : (s === 'outstock' ? 'Out of Stock' : s);
            displayNew = mapStatus(newVal);
            displayOld = mapStatus(oldVal);
        }

        let isChanged = false;
        if (request.type === 'update' && currentProduct) {
             if (newVal !== undefined && newVal !== null && String(newVal) !== String(oldVal)) {
                 isChanged = true;
             }
        }

        let finalValue = displayNew;
        if (request.type === 'delete') finalValue = displayOld;
        if (!finalValue && finalValue !== 0) finalValue = '---';

        return (
            <div className="form-row" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '10px' }}>
                <label style={{ minWidth: '150px', fontWeight: '600', color: '#555' }}>{label}:</label>
                <div style={{ flexGrow: 1 }}>
                    <div style={{ 
                        color: isChanged ? '#E74C3C' : '#1A1A1A', 
                        fontWeight: isChanged ? '700' : '500',
                        fontSize: '1rem'
                    }}>
                        {finalValue}
                    </div>
                    {isChanged && (
                        <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '4px' }}>
                            (Current: {displayOld || 'Empty'})
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="modal-overlay">
            <div className="modal vertical-form" style={{ width: '600px', maxWidth: '95%' }}>
                <div className="modal-header">
                    <div>
                        <h3 style={{ margin: 0 }}>Request Details #{request.id}</h3>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: typeColor, marginTop:'5px', display:'block' }}>
                            {reqTypeDisplay}
                        </span>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom:'5px' }}>
                        <span style={{ color: '#666' }}>Requested by:</span>
                        <strong>{request.requested_by}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom:'5px' }}>
                        <span style={{ color: '#666' }}>Date:</span>
                        <span>{request.created_at}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Status:</span>
                        <strong style={{textTransform:'uppercase', color: request.status === 'rejected' ? 'red' : 'green'}}>
                            {request.status}
                        </strong>
                    </div>
                    {request.status === 'rejected' && request.notes && (
                        <div style={{ marginTop: '10px', color: '#E74C3C', fontSize: '0.9rem', borderTop:'1px dashed #ccc', paddingTop:'5px' }}>
                            <strong>Rejection Reason:</strong> {request.notes}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading comparison...</div>
                ) : (
                    <div className="product-info-section">
                        {renderDiffRow("Product Name", "name", "ProductName")}
                        {renderDiffRow("Description", "description", "ProdDescription")}
                        {renderDiffRow("Price", "price", "Price", "money")}
                        {renderDiffRow("Status", "status", "Status", "status")}
                        {renderDiffRow("Farm ID", "farmId", "FarmID")}
                        {renderDiffRow("Planting Date", "plantDate", "PlantDate", "date")}
                        {renderDiffRow("Harvest Date", "harvestDate", "HarvestDate", "date")}
                    </div>
                )}
                
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

// --- 2. COMPONENT CUSTOM DROPDOWN ---
const CustomDropdown = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const selectedLabel = options.find(opt => opt.value === value)?.label;
    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <div className={`dropdown-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span>{selectedLabel}</span><span className="dropdown-arrow">▼</span>
            </div>
            {isOpen && (
                <ul className="dropdown-menu">
                    {options.map((opt) => (
                        <li key={opt.value} className={`dropdown-item ${opt.value === value ? 'selected' : ''}`} onClick={() => { onChange(opt.value); setIsOpen(false); }}>
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const RequestList = () => {
    const [requests, setRequests] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    
    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;
    const [sortField, setSortField] = useState("ApprovalID");
    const [sortOrder, setSortOrder] = useState("desc");
    const userRole = localStorage.getItem('userRole');

    // Filter State
    const [showFilter, setShowFilter] = useState(false);
    const [filterType, setFilterType] = useState("all"); // 'all', 'create', 'update', 'delete'
    const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'pending', 'approved', 'rejected'

    const sortFieldOptions = [ { value: "ApprovalID", label: "ID" }, { value: "CreatedAt", label: "Date" }, { value: "ReqType", label: "Type" } ];
    const sortOrderOptions = [ { value: "asc", label: "Ascending" }, { value: "desc", label: "Descending" } ];

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/api/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const mapped = res.data.map(r => {
                let productData = {};
                try {
                    if (r.Data) {
                        productData = typeof r.Data === 'string' ? JSON.parse(r.Data) : r.Data;
                    }
                } catch (e) { 
                    console.error(`JSON Parse Error for Request #${r.ApprovalID}:`, e);
                }

                return {
                    id: r.ApprovalID,
                    type: r.ReqType,
                    product_id: r.ProductID,
                    status: r.ApprovalStatus,
                    notes: r.Notes,
                    created_at: new Date(r.CreatedAt).toLocaleString('en-US'),
                    requested_by: r.UserName,
                    product_name_display: r.ProductNameDisplay,
                    product_info: productData 
                };
            });
            setRequests(mapped);
        } catch (err) { 
            console.error("Fetch Error:", err); 
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleAction = async (reqId, status) => {
        const notes = status === 'rejected' ? prompt('Enter rejection reason:') : 'Approved via Request List';
        if (status === 'rejected' && notes === null) return;

        try {
            const token = localStorage.getItem('token');
            await api.post(`/api/approvals/${reqId}`, {
                status,
                notes: notes || ''
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Request ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
            fetchRequests();
        } catch (err) {
            console.error(err);
            alert("Error processing request.");
        }
    };

    const renderReqType = (type) => {
        let color = "blue";
        if (type === "create") color = "green"; else if (type === "update") color = "#FF661A"; else if (type === "delete") color = "red";
        return <span style={{fontWeight: 'bold', color}}>{type?.toUpperCase()}</span>;
    };

    const renderStatus = (status, notes) => {
        let className, label = status;
        if (status === 'approved') { className = 'status-approved'; label = 'Approved'; }
        else if (status === 'rejected') { className = 'status-rejected'; label = 'Rejected'; }
        else { className = 'status-pending'; label = 'Pending'; }

        return (
            <div>
                <span className={`status-badge ${className}`}>{label}</span>
                {status === 'rejected' && notes && (
                    <div style={{fontSize: '0.8rem', color: 'red', marginTop: '4px'}}>
                        Reason: {notes}
                    </div>
                )}
            </div>
        );
    };

    const HandleRequest = () => {
        fetchRequests();
    };

    // Filter Logic
    const filteredRequests = requests.filter(req => {
        const matchType = filterType === "all" || req.type === filterType;
        const matchStatus = filterStatus === "all" || req.status === filterStatus;
        return matchType && matchStatus;
    });

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        let valA, valB;
        if (sortField === "ApprovalID") { valA = a.id; valB = b.id; }
        else if (sortField === "CreatedAt") { valA = new Date(a.created_at); valB = new Date(b.created_at); }
        else if (sortField === "ReqType") { valA = a.type || ""; valB = b.type || ""; }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentRequests = sortedRequests.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

    // Reset bộ lọc
    const clearFilter = () => {
        setFilterType("all");
        setFilterStatus("all");
        setShowFilter(false);
    };

    return (
        <PortalLayout pageTitle="Request List">
            <div className="main-content-card">
                <div className="product-header">
                    <h3>{userRole === 'admin' ? 'All Requests History' : 'My Requests'}</h3>
                    <button className="add-product-btn" onClick={() => setIsFormOpen(true)}>
                        Add New Product +
                    </button>
                </div>
                
                <div className="toolbar">
                    <div className="toolbar-left">
                        <span className="sort-label">Sort by:</span>
                        <div className="sort-group">
                            <CustomDropdown options={sortFieldOptions} value={sortField} onChange={setSortField} />
                            <CustomDropdown options={sortOrderOptions} value={sortOrder} onChange={setSortOrder} />
                        </div>
                    </div>
                    <div className="toolbar-right">
                        <button 
                            className="soft-btn round blue" 
                            onClick={() => setShowFilter(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                            </svg>
                            Filter
                        </button>
                    </div>
                </div>

                {/* --- POPUP FILTER UI (CẬP NHẬT GIAO DIỆN) --- */}
                {showFilter && (
                    <div className="modal-overlay">
                        <div className="modal-card" style={{ width: '450px', maxWidth: '95%' }}>
                            <div className="modal-header">
                                <h3>Filter Requests</h3>
                                <button className="modal-close-btn" onClick={() => setShowFilter(false)}>&times;</button>
                            </div>

                            {/* Request Type Filter */}
                            <div className="form-group">
                                <label>Request Type</label>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="typeFilter" checked={filterType==="all"} onChange={() => setFilterType("all")} style={{width:'auto'}} /> All
                                    </label>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="typeFilter" checked={filterType==="create"} onChange={() => setFilterType("create")} style={{width:'auto'}} /> 
                                        <span className="approval-type-badge badge-create">Create</span>
                                    </label>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="typeFilter" checked={filterType==="update"} onChange={() => setFilterType("update")} style={{width:'auto'}} /> 
                                        <span className="approval-type-badge badge-update">Update</span>
                                    </label>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="typeFilter" checked={filterType==="delete"} onChange={() => setFilterType("delete")} style={{width:'auto'}} /> 
                                        <span className="approval-type-badge badge-delete">Delete</span>
                                    </label>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="form-group" style={{marginTop:'20px'}}>
                                <label>Status</label>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="statusFilter" checked={filterStatus==="all"} onChange={() => setFilterStatus("all")} style={{width:'auto'}} /> All
                                    </label>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="statusFilter" checked={filterStatus==="pending"} onChange={() => setFilterStatus("pending")} style={{width:'auto'}} /> 
                                        <span className="status-badge status-pending">Pending</span>
                                    </label>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="statusFilter" checked={filterStatus==="approved"} onChange={() => setFilterStatus("approved")} style={{width:'auto'}} /> 
                                        <span className="status-badge status-approved">Approved</span>
                                    </label>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" name="statusFilter" checked={filterStatus==="rejected"} onChange={() => setFilterStatus("rejected")} style={{width:'auto'}} /> 
                                        <span className="status-badge status-rejected">Rejected</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={clearFilter}>Reset</button>
                                <button className="btn-primary" onClick={()=>setShowFilter(false)}>Apply Filter</button>
                            </div>
                        </div>
                    </div>
                )}

                <table className="product-table">
                    <thead>
                        <tr>
                            <th style={{textAlign: 'center'}}>Type</th>
                            <th>Product Name</th>
                            <th style={{textAlign: 'center'}}>Date</th>
                            <th style={{textAlign: 'center'}}>Status</th>
                            <th style={{textAlign: 'center'}}>Details</th>
                            {userRole === 'admin' && <th style={{textAlign: 'center'}}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {currentRequests.length > 0 ? (
                            currentRequests.map(req => (
                                <tr key={req.id}>
                                    <td style={{textAlign: 'center'}}>{renderReqType(req.type)}</td>
                                    <td>{req.product_name_display || "Unnamed Product"}</td>
                                    <td style={{textAlign: 'center'}}>{req.created_at}</td>
                                    <td style={{textAlign: 'center'}}>{renderStatus(req.status, req.notes)}</td>
                                    <td style={{textAlign: 'center'}}>
                                        <button 
                                            className="icon-action icon-view" 
                                            onClick={() => setSelectedRequest(req)}
                                            title="View Details"
                                        >
                                            🔍
                                        </button>
                                    </td>

                                    {userRole === 'admin' && (
                                        <td style={{textAlign: 'center'}}>
                                            {req.status === 'pending' ? (
                                                <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'approved')} 
                                                        className="icon-action icon-approve"
                                                        title="Approve"
                                                    >
                                                        ✅
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'rejected')} 
                                                        className="icon-action icon-reject"
                                                        title="Reject"
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{color:'#ccc', fontSize:'0.9rem'}}>Processed</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                                    No requests found matching filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div style={{marginTop:"10px", display:"flex", justifyContent:"center", gap:"10px"}}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="soft-btn round small">◀ Prev</button>
                    <span style={{alignSelf:"center"}}>Page {currentPage}/{totalPages || 1}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)} className="soft-btn round small">Next ▶</button>
                </div>
            </div>

            {isFormOpen && (
                <ProductForm onClose={() => setIsFormOpen(false)} onSave={HandleRequest} />
            )}

            {selectedRequest && (
                <RequestDetailModal 
                    request={selectedRequest} 
                    onClose={() => setSelectedRequest(null)} 
                />
            )}
        </PortalLayout>
    );
};

export default RequestList;
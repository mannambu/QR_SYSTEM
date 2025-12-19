import React, { useState, useEffect } from 'react'; 
import { PortalLayout } from './Sidebar';
import './Portal.css';
import api from './api';


// --- Modal Chi Tiết  ---
const ApprovalDetailModal = ({ request, onClose, onAction }) => {
    // Safely access product_info
    const info = request.product_info || {};
    
    // Format loại yêu cầu
    let reqTypeDisplay = 'Request';
    if(request.type === 'create') reqTypeDisplay = 'Create Product';
    if(request.type === 'update') reqTypeDisplay = 'Update Product';
    if(request.type === 'delete') reqTypeDisplay = 'Delete Product';

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'unset';
    }, []);

    const InfoBox = ({ label, value }) => (
        <div className="info-box">
            <div className="info-box-label">{label}</div>
            <div className="info-box-value">{value || '---'}</div>
        </div>
    );
    
    return (
        <div className="modal-overlay">
            <div className="approval-modal-content">
                <div className="modal-header approval-modal-header">
                    <div style={{ flexGrow: 1 }}>
                        <h4 style={{ margin: 0 }}>Request Details</h4>
                        <p className="req-title">ID: {request.id} - {reqTypeDisplay}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="info-group approval-header-box">
                    <InfoBox label="Requested by" value={request.requested_by} />
                    <InfoBox label="Time" value={request.date_time} />
                </div>

                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 20px 0' }}>Product Information</h4>
                <div className="info-group">
                    {/* Ưu tiên hiển thị tên đã xử lý từ danh sách, nếu không có thì tìm trong JSON */}
                    <InfoBox label="Product name" value={request.product_name_display || info.name || info.ProductName} />
                    <InfoBox label="Farm (ID)" value={info.farm || info.FarmID} />
                </div>
                <div className="info-group">
                    <InfoBox label="Expected price" value={info.price ? `${Number(info.price).toLocaleString()} VND` : ''} />
                    <InfoBox label="Type" value={info.type} />
                </div>
                
                {info.description && (
                    <div className="approval-description">
                        <h5>Description</h5>
                        <p>{info.description}</p>
                    </div>
                )}
                
                <div className="approval-modal-actions">
                    <button className="btn-close" onClick={onClose}>Close</button>
                    <button className="btn-reject" onClick={() => onAction(request.id, 'rejected')}>
                        <span style={{fontSize: '1.2em'}}>❌</span> Rejected
                    </button>
                    <button className="btn-approve" onClick={() => onAction(request.id, 'approved')}>
                        <span style={{fontSize: '1.2em'}}>✅</span> Approved
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Component Chính ---
const Approvals = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // --- Logic Fetch Data ---
  const fetchApprovals = async () => {
    try {
        const token = localStorage.getItem('token');
        // Gọi API pending dành cho Admin
        const res = await api.get('/api/approvals/pending', { 
            headers: { Authorization: `Bearer ${token}` }
        });
                
        const mappedData = res.data.map(item => {
            let productData = {};
            try {
                // Parse chuỗi JSON trong cột Data
                productData = item.Data ? JSON.parse(item.Data) : {};
            } catch (e) {
                console.error("Lỗi parse JSON approval:", e);
            }

            return {
                id: item.ApprovalID,
                type: item.RequestType, // create, update, delete
                product_id: item.ProductID,
                // Ưu tiên hiển thị tên Staff nếu backend trả về (đã JOIN bảng User), fallback về ID
                requested_by: item.StaffName || `Staff ID: ${item.RequestedBy}`,
                date_time: new Date(item.CreatedAt).toLocaleString('en-US'),
                status: item.Status,
                product_name_display: item.ProductNameDisplay,
                product_info: productData // Dữ liệu thô để hiển thị chi tiết
            };
        });

        setRequests(mappedData);
    } catch (err) {
        console.error("Lỗi tải danh sách duyệt:", err);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // --- Logic Xử lý Duyệt/Từ chối ---
  const handleAction = async (reqId, status) => {
    const notes = status === 'rejected' ? prompt('Enter rejection reason:') : 'Approved via Admin Portal';
    
    if (status === 'rejected' && notes === null) return; 

    try {
        const token = localStorage.getItem('token');
        
        await api.post(`/api/approvals/${reqId}`, {
            status: status,
            notes: notes || ''
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert(`Request ${status} successfully.`);
        setSelectedRequest(null);
        fetchApprovals(); // Refresh list
    } catch (err) {
        console.error("Lỗi xử lý yêu cầu:", err);
        alert("An error occurred while processing the request. Please try again.");
    }
  };

  const renderBadge = (type) => {
    let className, label;
    switch(type) {
      case 'create': className = 'badge-create'; label = 'Create'; break;
      case 'update': className = 'badge-update'; label = 'Update'; break;
      case 'delete': className = 'badge-delete'; label = 'Delete'; break;
      default: className = ''; label = type;
    }
    return <span className={`approval-type-badge ${className}`}>{label}</span>;
  };

  return (
    <PortalLayout pageTitle="Pending Approvals">
      <div className="main-content-card approval-list">
        {requests.map(req => (
          <div key={req.id} className="approval-item">
            <div className="approval-details-left">
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                {renderBadge(req.type)}
                <span className="approval-req-id">#{req.id}</span>
              </div>
              
              {/* Hiển thị tên sản phẩm */}
              <p className="approval-product-name">
                {req.product_name_display || req.product_info.name || req.product_info.ProductName || "Unnamed Product"}
              </p>
              
              {/* Hiển thị metadata */}
              <p className="approval-metadata">
                Requested by: {req.requested_by} • {req.date_time}
              </p>
            </div>
            
            <button className="view-detail-btn" onClick={() => setSelectedRequest(req)}>
              <span style={{color: '#999'}}>👁</span> View Details
            </button>
          </div>
        ))}
        
        {requests.length === 0 && (
            <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                <p>No pending requests found.</p>
            </div>
        )}
      </div>

      {selectedRequest && (
          <ApprovalDetailModal 
            request={selectedRequest} 
            onClose={() => setSelectedRequest(null)}
            onAction={handleAction}
          />
      )}
    </PortalLayout>
  );
};

export default Approvals;
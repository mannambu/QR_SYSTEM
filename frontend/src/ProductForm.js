import React, { useState, useEffect, useRef } from 'react';
import './Portal.css'; 
import api from './api';

// Hàm helper để format ngày chuẩn YYYY-MM-DD cho input date
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Kiểm tra nếu date không hợp lệ
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const ProductForm = ({ product, onClose, onSave }) => {
  const isEditMode = !!product;
  const fileInputRef = useRef(null);
  
  const initialFormData = {
    name: isEditMode ? (product.ProductName || '') : '',
    description: isEditMode ? (product.ProdDescription || '') : '',
    planting_date: isEditMode && product.PlantDate ? formatDateForInput(product.PlantDate): '',
    price: isEditMode ? (product.Price || 0) : 0,
    farmId: isEditMode ? (product.FarmID || '') : '',
    certIds: isEditMode && product.CertIDs ? product.CertIDs.split(',') : [],
    issueDates: isEditMode && product.IssueDates ? product.IssueDates.split(',') : [],
    harvest_date: isEditMode && product.HarvestDate ? formatDateForInput(product.HarvestDate): '',
    media: isEditMode && product.ImageUrl ? JSON.parse(product.ImageUrl) : null
  };

  const [formData, setFormData] = useState(initialFormData);
  const [farms, setFarms] = useState([]);
  const [certs, setCerts] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(isEditMode ? (product.FarmID || '') : '');
  const [selectedCert, setSelectedCert] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(isEditMode ? (product.Status || 'outstock') : 'instock');
  // const [price, setPrice] = useState(isEditMode ? (product.Price || 0) : 0);
  
  useEffect(() => {
    // load farms
    api.get("/api/farms", {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setFarms(res.data))
    .catch(err => console.error(err));

    // load certifications
    api.get("/api/certifications", {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setCerts(res.data))
    .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // chỉ lấy file đầu tiên
    if (file) {
        setFormData({ ...formData, media: file });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleCertDateChange = (certId, field, value) => {
    if (field === 'issue') {
      setIssueDate(value);
    } else {
      setExpireDate(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Please enter the product name.");
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('plantDate', formData.planting_date);   
    submitData.append('harvestDate', formData.harvest_date);  
    submitData.append('status', selectedStatus);
    submitData.append('farmId', selectedFarm);                
    submitData.append('price', formData.price);               
    // append certs + dates
    if (selectedCert) {
      submitData.append("certId", selectedCert);
      submitData.append("issueDate", issueDate || "");
      submitData.append("expireDate", expireDate|| "");
    };

    submitData.append('media', formData.media);

    const token = localStorage.getItem('token');
    const config = {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data' 
      }
    };

  const apiCall = isEditMode 
        ? api.put(`/api/products/${product.ProductID}`, submitData, config)
        : api.post('/api/products', submitData, config);

    apiCall
        .then((res) => {
            // Hiển thị thông báo chính xác từ Server (Admin: Success, Staff: Pending)
            alert(res.data.msg || "Operation successful!"); 
            
            if (onSave) onSave(); // Gọi hàm reload data ở cha
            onClose(); // Đóng form
        })
        .catch(err => {
            console.error("Lỗi submit:", err);
            alert("Error: " + (err.response?.data?.msg || err.message));
        });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isEditMode ? 'Edit Product' : 'Add Product'}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Tên sản phẩm */}
          <div className="form-group">
            <label>Product Name *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              // required 
              style={{ backgroundColor: '#F7F7F7', border: 'none' }}
            />
          </div>

          {/* Giá sản phẩm */}
          <div className="form-group">
            <label>Price *</label>
            <input 
              type="number" 
              name="price" 
              value={formData.price} 
              onChange={handleChange} 
              // required 
              style={{ backgroundColor: '#F7F7F7', border: 'none' }}
            />
          </div>

          {/* Dropdown Farm */}
          <div className="form-group">
            <label>Farm *</label>
            <select value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)} 
            // required
            >
              <option value="">-- Select Farm --</option>
              {farms.map(f => (
                <option key={f.FarmID} value={f.FarmID}>{f.FarmName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select 
                value={selectedStatus || 'instock'} 
                onChange={e => setSelectedStatus(e.target.value)} 
                // required
            >
                <option value="instock">In Stock</option>
                <option value="outstock">Out of Stock</option>
            </select>
          </div>

          {/* Ngày gieo trồng / thu hoạch */}
          <div className="form-row">
            <div className="form-group">
              <label>Planting Date *</label>
              <input 
                type="date" 
                name="planting_date" 
                value={formData.planting_date} 
                onChange={handleChange} 
                style={{ backgroundColor: '#F7F7F7', border: 'none' }}
              />
            </div>
            <div className="form-group">
              <label>Harvest Date *</label>
              <input 
                type="date" 
                name="harvest_date" 
                value={formData.harvest_date} 
                onChange={handleChange} 
                style={{ backgroundColor: '#F7F7F7', border: 'none' }}
              />
            </div>
          </div>

          {/* Certifications dropdown */}
         <div className="form-group">
            <label>Certification *</label> 
            <select value={selectedCert} onChange={e => setSelectedCert(e.target.value)} 
            // required
            >
              <option value="">-- Select Certification --</option>
              {certs.map(c => (
                <option key={c.CertID} value={c.CertID}>{c.CertName}</option>
              ))}
            </select>
          </div>

          {/* Render IssueDate/ExpireDate cho từng cert */}
          {selectedCert && (
            <div className="form-row">
                <div className="form-group">
                <label>Issue Date</label>
                <input 
                    type="date" 
                    value={issueDate} 
                    onChange={e => setIssueDate(e.target.value)} 
                />
                </div>
                <div className="form-group">
                <label>Expire Date</label>
                <input 
                    type="date" 
                    value={expireDate} 
                    onChange={e => setExpireDate(e.target.value)} 
                />
                </div>
            </div>
            )}

          {/* Mô tả */}
          <div className="form-group">
            <label>Description *</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              style={{ backgroundColor: '#F7F7F7', border: 'none', minHeight: '100px' }}
            />
          </div>

          {/* Hình ảnh/Video */}
          <div className="form-group">
            <label>Product Media (Image/Video)</label>
            <div className="upload-box" onClick={handleUploadClick}>
              <span className="upload-icon">↑</span> 
              <p style={{marginTop: '10px', color: '#666'}}>
                {formData.media && formData.media.length > 0 
                  ? `Selected ${formData.media.length} file(s)` 
                  : "Drag & drop or click to upload"}
              </p>
              <p className="file-info">PNG, JPG, MP4 up to 10MB</p>
            </div>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              style={{ background: 'white', border: '1px solid #ccc', color: '#333' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              style={{ backgroundColor: '#FF661A', color: 'white', border: 'none' }}
            >
              {isEditMode ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
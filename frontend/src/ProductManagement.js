import React, { useState, useEffect, useRef } from 'react';
import { PortalLayout } from './Sidebar';
import './Portal.css';
import './RequestList.css'; 
import ProductForm from './ProductForm';
import ProductView from './ProductView'; 
import api from './api';

// --- COMPONENT CUSTOM DROPDOWN (Giữ nguyên) ---
const CustomDropdown = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label;

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <div className={`dropdown-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span>{selectedLabel}</span>
                <span className="dropdown-arrow">▼</span>
            </div>
            {isOpen && (
                <ul className="dropdown-menu">
                    {options.map((opt) => (
                        <li 
                            key={opt.value} 
                            className={`dropdown-item ${opt.value === value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewProductId, setViewProductId] = useState(null);

  // State Sort
  const [sortField, setSortField] = useState("ProductID");
  const [sortOrder, setSortOrder] = useState("asc");

  // State Filter
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); 
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  // --- 1. THÊM STATE PHÂN TRANG (PAGINATION) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Giới hạn 50 sản phẩm/trang

  const sortFieldOptions = [
      { value: "ProductID", label: "ID" },
      { value: "ProductName", label: "Product Name" },
      { value: "Price", label: "Price" },
      { value: "Status", label: "Status" }
  ];

  const sortOrderOptions = [
      { value: "asc", label: "Ascending" },
      { value: "desc", label: "Descending" }
  ];

  // QR States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrBase64, setQrBase64] = useState(null);
  const [qrProductId, setQrProductId] = useState(null);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/inventory', { 
          headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Lỗi tải kho hàng:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Logic Filter
  const filteredProducts = products.filter(p => {
      const matchStatus = filterStatus === "all" || p.Status === filterStatus;
      const price = Number(p.Price);
      const min = priceRange.min !== "" ? Number(priceRange.min) : 0;
      const max = priceRange.max !== "" ? Number(priceRange.max) : Infinity;
      const matchPrice = price >= min && price <= max;
      return matchStatus && matchPrice;
  });

  // Logic Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'Price') {
          valA = Number(valA);
          valB = Number(valB);
      }
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
  });

  // --- 2. LOGIC TÍNH TOÁN PHÂN TRANG ---
  // Reset về trang 1 khi thay đổi Filter hoặc Sort
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, priceRange, sortField, sortOrder, products]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  // Handlers (Giữ nguyên)
  const handleDeleteRequest = async (id) => {
    if (window.confirm(`Send delete request for product #${id}?`)) {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Delete request sent to approval list.');
        } catch (err) {
            alert("Error sending request.");
        }
    }
  };

  const handleViewQR = async (id) => {
    setQrModalOpen(true);
    setQrProductId(id);
    setQrBase64(null);
    try {
      // Thay axios.get thành api.get
      const res = await api.get(`/api/qr/${id}`);
      setQrBase64(res.data);
    } catch (err) {
      console.error("QR preview error:", err);
      setQrBase64(null);
    }
  };

const handleDownloadQR = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      // BƯỚC 1: Cập nhật/Tạo URL trong Database (PUT)
      await api.put(`/api/products/${id}/qr`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // BƯỚC 2: Lấy dữ liệu ảnh Base64 thực tế (GET)
      // (Vì API PUT chỉ trả về URL text, ta cần gọi GET để lấy hình ảnh)
      const qrRes = await api.get(`/api/qr/${id}`);
      const base64Image = qrRes.data; // Chuỗi dạng "data:image/png;base64,..."

      // Cập nhật lại state để hiển thị trên Modal (nếu cần)
      setQrBase64(base64Image); 

      // BƯỚC 3: Tự động tải ảnh về máy
      const downloadLink = document.createElement("a");
      downloadLink.href = base64Image;
      downloadLink.download = `FruitTrace_Product_${id}.png`; // Tên file khi tải về
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // (Tùy chọn) Vẫn hiện thông báo nhỏ hoặc bỏ đi nếu thấy phiền
      // alert("QR Code downloaded successfully!");

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
         setError("You do not have permission to generate QR codes.");
      } else {
         setError("Cannot generate/download QR code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequest = (product) => {
      setCurrentProduct(product);
      setIsModalOpen(true);
  };

  const clearFilter = () => {
      setFilterStatus("all");
      setPriceRange({ min: "", max: "" });
      setShowFilter(false);
  };

  const handleSaveSuccess = () => {
      fetchInventory(); 
  };

  return (
    <PortalLayout pageTitle="Product Inventory">
      <div className="main-content-card">
        
        <div className="product-header">
            <h3>Current Product List ({sortedProducts.length})</h3>
        </div>

        <div className="toolbar">
            <div className="toolbar-left">
                <span className="sort-label">Sort by:</span>
                <div className="sort-group">
                    <CustomDropdown 
                        options={sortFieldOptions} 
                        value={sortField} 
                        onChange={setSortField} 
                    />
                    <CustomDropdown 
                        options={sortOrderOptions} 
                        value={sortOrder} 
                        onChange={setSortOrder} 
                    />
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

        {/* Modal Filter (Giữ nguyên) */}
        {showFilter && (
            <div className="modal-overlay">
                <div className="modal-card" style={{ width: '500px', maxWidth: '95%' }}>
                    <div className="modal-header">
                        <h3>Filter Products</h3>
                        <button className="modal-close-btn" onClick={() => setShowFilter(false)}>&times;</button>
                    </div>
                    
                    <div className="form-group">
                        <label>Status</label>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="radio" name="statusFilter" checked={filterStatus === "all"} onChange={() => setFilterStatus("all")} style={{ width: 'auto', margin: 0, height: '18px' }} /> 
                                <span>All Status</span>
                            </label>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="radio" name="statusFilter" checked={filterStatus === "instock"} onChange={() => setFilterStatus("instock")} style={{ width: 'auto', margin: 0, height: '18px' }}/> 
                                <span className="status-badge status-instock">In Stock</span>
                            </label>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="radio" name="statusFilter" checked={filterStatus === "outstock"} onChange={() => setFilterStatus("outstock")} style={{ width: 'auto', margin: 0, height: '18px' }}/> 
                                <span className="status-badge status-outstock">Out Stock</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Price Range (VND)</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '5px' }}>
                            <div style={{ flex: 1 }}>
                                <input type="number" placeholder="Min Price (e.g. 10000)" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} />
                            </div>
                            <span style={{ fontWeight: 'bold', color: '#999' }}>—</span>
                            <div style={{ flex: 1 }}>
                                <input type="number" placeholder="Max Price (e.g. 500000)" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={clearFilter}>Reset</button>
                        <button className="btn-primary" onClick={() => setShowFilter(false)}>Apply Filter</button>
                    </div>
                </div>
            </div>
        )}

        {/* Table List */}
        <table className="product-table">
            <thead>
                <tr>
                    <th style={{textAlign: 'center'}}>ID</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th style={{textAlign: 'center'}}>Status</th>
                    <th style={{textAlign: 'center'}}>Details</th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {/* --- 3. SỬ DỤNG currentProducts THAY VÌ sortedProducts --- */}
                {currentProducts.map((p) => (
                    <tr key={p.ProductID}>
                        <td style={{textAlign: 'center', fontWeight: 'bold', color: '#888'}}>#{p.ProductID}</td>
                        <td>{p.ProductName}</td>
                        <td style={{fontWeight: '600'}}>{Number(p.Price).toLocaleString()} VND</td>
                        <td style={{textAlign: 'center'}}>
                             <span className={`status-badge status-${p.Status}`}>
                                {p.Status === 'instock' ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </td>
                        
                        <td style={{textAlign: 'center'}}>
                            <button 
                                className="icon-action icon-view" 
                                onClick={() => setViewProductId(p.ProductID)}
                                title="View Details"
                            >
                                🔍
                            </button>
                        </td>

                        <td style={{textAlign: 'center'}}>
                            <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
                                <button className="icon-action icon-edit" onClick={() => handleEditRequest(p)} title="Request Edit">✏️</button>
                                <button className="icon-action icon-delete" onClick={() => handleDeleteRequest(p.ProductID)} title="Request Delete">🗑️</button>
                                <button className="icon-action icon-qr" onClick={() => handleViewQR(p.ProductID)} title="View QR">📷</button>
                            </div>
                        </td>
                    </tr>
                ))}
                {currentProducts.length === 0 && (
                    <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                            No products found matching filters.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>

        {/* --- 4. THANH ĐIỀU HƯỚNG PHÂN TRANG (MỚI) --- */}
        {sortedProducts.length > 0 && (
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
                <button 
                    disabled={currentPage === 1} 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    className="soft-btn round small"
                    style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                    ◀ Prev
                </button>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
                </span>
                <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    className="soft-btn round small"
                    style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                    Next ▶
                </button>
            </div>
        )}

      </div>

        {isModalOpen && (
            <ProductForm 
                product={currentProduct}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSuccess} 
            />
        )}

        {viewProductId && (
            <ProductView 
                id={viewProductId}
                apiUrl={`/api/products/public/${viewProductId}`}
                onClose={() => setViewProductId(null)}
            />
        )}

        {qrModalOpen && (
        <div className="modal-overlay">
            <div className="modal vertical-form">
            <h2 style={{ textAlign: "center" }}>
                Product QR Code #{qrProductId}
            </h2>

            {qrBase64 ? (
                <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <img
                    src={qrBase64}
                    alt="QR code"
                    width={200}
                    height={200}
                />
                </div> 
                ) : ( 
                <p style={{ textAlign: "center" }}>Loading QR...</p> )
            }

            {error && (
                <p style={{ color: "red", textAlign: "center" }}>
                {error}
                </p>
                )
            }

            <div className="form-actions">
                <button
                className="btn btn-primary"
                onClick={() => handleDownloadQR(qrProductId)}
                disabled={loading || !qrBase64}
                >
                {loading ? "Generating..." : "Download QR"}
                </button>

                <button
                className="btn btn-outline"
                onClick={() => setQrModalOpen(false)}
                >
                Close
                </button>
            </div>
            </div>
        </div>
        )}

    </PortalLayout>
  );
};

export default ProductManagement;
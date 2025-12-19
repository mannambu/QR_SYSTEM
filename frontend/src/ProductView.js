import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductView.css';

const ProductView = ({ id, apiUrl = `/api/products/public/${id}`, onClose }) => {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [responseTime, setResponseTime] = useState(null);

  useEffect(() => {
    if (id) {
      const start = Date.now();
      axios.get(apiUrl)
        .then(res => {
          const end = Date.now();
          setResponseTime(end - start);
          setProduct(res.data);
          setError(null);
        })
        .catch(err => {
          console.error("Error fetching product:", err);
          const end = Date.now();
          setResponseTime(end - start);
          setError("Product not found or has been deleted!");
          setProduct(null);
        });
    }
  }, [id, apiUrl]);

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal vertical-form">
          <h2>Notification</h2>
          <p style={{ color: "red" }}>{error}</p>
          {responseTime !== null && (
            <div className="response-time">⏱ {responseTime} ms</div>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="modal-overlay">
      <div className="modal vertical-form">
        <h2>Product Information</h2>
        <div className="form-row">
          <label>Product Name:</label>
          <div>{product.ProductName}</div>
        </div>
        <div className="form-row">
          <label>Description:</label>
          <div>{product.Description}</div>
        </div>
        <div className="form-row">
          <label>Harvest Date:</label>
          {/* Định dạng ngày theo chuẩn US */}
          <div>{new Date(product.HarvestDate).toLocaleDateString('en-US')}</div>
        </div>
        <div className="form-row">
          <label>Price:</label>
          <div>{product.Price}</div>
        </div>
        <div className="form-row">
          <label>Status:</label>
          <div>{product.Status === 'instock' ? 'In Stock' : 'Out of Stock'}</div>
        </div>

        <h3>Farm Information</h3>
        <div className="form-row">
          <label>Farm Name:</label>
          <div>{product.FarmName}</div>
        </div>
        <div className="form-row">
          <label>Location:</label>
          <div>{product.Location}</div>
        </div>

        <h3>Certifications</h3>
        <div className="form-row">
          <label>Certification Name:</label>
          <div>{product.CertName || "None"}</div>
        </div>
        <div className="form-row">
          <label>Issuer:</label>
          <div>{product.Issuer || "None"}</div>
        </div>
        <div className="form-row">
          <label>Issue Date:</label>
          <div>{product.IssueDate ? new Date(product.IssueDate).toLocaleDateString('en-US') : "None"}</div>
        </div>

        {responseTime !== null && (
          <div className="response-time">⏱ {responseTime} ms</div>
        )}

        <div className="form-actions">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ProductView;
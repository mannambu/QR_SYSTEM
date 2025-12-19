import React, { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import ProductView from "./ProductView";
import "./Scanner.css";

const videoPreviewId = "qr-video-preview";

// Cập nhật màu logo SVG thành #FF661A cho đồng bộ
const FruitLogo = () => (
  <div className="fruit-logo">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.2" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white" />
    </svg>
    <span>FruitTrace</span>
  </div>
);

export default function Scanner() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedIds, setScannedIds] = useState([]); 
  const [useSlowApi, setUseSlowApi] = useState(false); 
  const fileInputRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  const onScanSuccess = (decodedText) => {
    if (decodedText.includes("/product/")) {
      const id = decodedText.split("/product/")[1];
      setScannedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      alert(`Scanned content: ${decodedText}`);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
      }
    } catch (err) {
      console.warn("Lỗi khi dừng camera:", err);
    } finally {
      setIsCameraActive(false);
    }
  };

  const handleStartClick = async () => {
    if (isCameraActive) return;
    try {
      setIsCameraActive(true);
    } catch (err) {
      console.error("Lỗi khi xin quyền camera:", err);
      alert("Cannot open camera. Please grant access permission.");
    }
  };

  const handleStopClick = () => stopCamera();

  const triggerFileUpload = () => fileInputRef.current && fileInputRef.current.click();

  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const fileScanner = new Html5Qrcode("qr-file-preview");
    fileScanner
      .scanFile(file, false)
      .then((result) => {
        onScanSuccess(result);
      })
      .catch((err) => {
        console.error("Lỗi quét file:", err);
        alert("No QR code found in the image or invalid image.");
      })
      .finally(() => {
        fileScanner.clear();
        e.target.value = "";
      });
  };

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        if (html5QrcodeRef.current) {
          await html5QrcodeRef.current.stop().catch(()=>{});
          await html5QrcodeRef.current.clear().catch(()=>{});
          html5QrcodeRef.current = null;
        }

        if (isCameraActive) {
          html5QrcodeRef.current = new Html5Qrcode(videoPreviewId);
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          await html5QrcodeRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              if (!mounted) return;
              onScanSuccess(decodedText);
            },
            () => {}
          );
        }
      } catch (err) {
        console.error("Không thể khởi động camera:", err);
        alert("Cannot open camera. Please check access permissions.");
        setIsCameraActive(false);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(()=>{});
        html5QrcodeRef.current.clear().catch(()=>{});
        html5QrcodeRef.current = null;
      }
    };
  }, [isCameraActive]);

  return (
    <div className="scanner-page">
      <header className="scanner-header">
        <button className="left-pill">QR Scanner</button>
        <div className="center-badge">Modern Traceability</div>
        <div className="right-logo"><FruitLogo /></div>
      </header>

      <main className="scanner-main">
        <h1 className="title">
          SCAN QR CODE <span className="title-highlight">Fast & Easy</span>
        </h1>
        <p className="subtitle">Choose your preferred scanning method - Camera or File Upload</p>
        <div id="qr-file-preview" style={{ display: "none" }} />

        <div className="toggle-api">
          <label>
            <input 
              type="checkbox" 
              checked={useSlowApi} 
              onChange={() => setUseSlowApi(!useSlowApi)} 
            />
            Use Legacy API (Slower)
          </label>
        </div>

        <div className="cards-wrap">
          {/* Camera Card */}
          <div className="card camera-card">
            <div className="card-inner">
              {isCameraActive ? (
                 <div id={videoPreviewId} className="video-container" />
              ) : (
                <div className="card-illustration">
                   {/* Giả lập icon camera bằng SVG hoặc ảnh */}
                   <span style={{fontSize: '3rem'}}>📷</span>
                </div>
              )}
              
              <h3 className="card-title">Tap to Scan</h3>
              <p className="card-desc">Use your device camera to scan QR codes directly in real-time.</p>
              
              {!isCameraActive ? (
                <button className="btn btn-primary" onClick={handleStartClick}>Start Camera</button>
              ) : (
                <button className="btn btn-outline" onClick={handleStopClick}>Stop Camera</button>
              )}
            </div>
          </div>

          {/* Upload Card */}
          <div className="card upload-card">
            <div className="card-inner">
              <div className="upload-box">
                <div className="upload-dashed" onClick={triggerFileUpload} style={{cursor: 'pointer'}}>
                   {/* Giả lập icon upload */}
                   <span style={{fontSize: '2.5rem', color: '#FF661A'}}>⬆️</span>
                </div>
              </div>
              <h3 className="card-title">Upload Image</h3>
              <p className="card-desc">Upload an image containing a QR code from your device gallery.</p>
              
              <button className="btn btn-outline" onClick={triggerFileUpload}>Select Image</button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} style={{ display: "none" }} />
            </div>
          </div>
        </div>
      </main>

      <footer className="scanner-footer">
        <a className="admin-link" href="/login">Login →</a>
      </footer>

      {scannedIds.map((id) => (
        <ProductView 
          key={id} 
          id={id} 
          apiUrl={useSlowApi ? `/api/products/public-slow/${id}` : `/api/products/public/${id}`} 
          onClose={() => setScannedIds((prev) => prev.filter(x => x !== id))} 
        />
      ))}
    </div>
  );
}
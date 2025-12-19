# Fruit Trace - Agricultural Traceability System 🍎🔍

Fruit Trace is a software solution for managing and tracing the origins of agricultural products via QR codes, ensuring transparency from farm to consumer. The system integrates a strict Approval Flow and advanced data management tools.

---

## Table of Contents
- [Introduction](#-introduction)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [System Requirements](#️-system-requirements)
- [Installation & Setup](#-installation--setup)
- [Environment Configuration (.env)](#-environment-configuration-env)
- [Usage Guide](#-usage-guide)
- [Authors](#-authors)

---

## Introduction
The project was developed to **digitize the agricultural management process**, allowing:

- **Consumers**: Scan QR codes to view transparent information (farm details, harvest date, safety certifications).
- **Staff**: Propose new product creations or modifications.
- **Admin**: Approve data change requests, manage users, perform data backups, and optimize the system.

---

## Key Features

### 1. Public Module (End User)
- **QR Scanner**: Scan QR codes directly in the browser or upload images to retrieve product information.
- **Product View**: Displays details: Name, Description, Price, Status (In/Out Stock), Farm info, Certifications (VietGAP, GlobalGAP...).

### 2. Administration Module (Admin & Staff)

#### Authentication & Security
- Role-based Login (JWT Authentication).
- Automatic Refresh Token mechanism.
- Forgot Password (OTP via Email) and Change Password.

#### Dashboard
- General Statistics: Total products, Stock status, Approval status.
- Trend charts for product updates over time.

#### Product Management
- View list, Filter (Status/Price), Sort, Pagination.
- **Staff**: Send requests for Create/Update/Delete products.
- **Admin**: Perform CRUD operations directly.
- **QR Generator**: Generate and download QR code images.

#### Approval System
- Manage data change requests submitted by Staff.
- Admin views details (**Compare Old vs. New Data**) and makes a decision:
  - **Approve**
  - **Reject** (with reason)

#### 🛠 System Administration (Admin Only)
- **User Management**: Add/Remove staff accounts, view user list.
- **Service Management**:
  - **Backup & Recovery**: Backup/Restore MySQL Database to/from Cloudinary.
  - **Indexing**: Manually trigger indexing to accelerate queries.
  - **Benchmark**: Compare API performance (Optimized SQL vs. Raw JS processing).

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (Driver: mysql2)
- **Authentication**: JWT, bcryptjs
- **Email**: Nodemailer (Gmail SMTP)
- **Cloud Storage**: Cloudinary (Backup file storage)
- **Utilities**: QRCode, Multer, Rate-limit

### Frontend
- **Library**: ReactJS (Create React App)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (with Token Interceptors)
- **QR Handling**: html5-qrcode (Scan), qrcode (Generate)
- **Charts**: Chart.js & react-chartjs-2
- **Styling**: CSS Modules, Modern Responsive UI

---

## Project Structure
```
fruit-trace/
├── backend/
│   ├── endpoints/          # API (Login, CRUD, Approval, QR...)
│   ├── services/           # Logic (DB, Mailer, Backup, Auth)
│   ├── uploads/            # Temp folder for uploads/QR
│   └── server.js           # Main Server Entry & Routes
├── frontend/
│   ├── public/             # Static Resources
│   ├── src/
│   │   ├── api.js          # Axios Config & Refresh Token
│   │   ├── [Components].js # Pages: Login, Dashboard, Management...
│   │   ├── [Styles].css    # Corresponding CSS
│   │   └── App.js          # Main Routing & Layout
│   └── package.json
├── database/
│   └── CREATE DATABASE.sql # MySQL Database Initialization Script
└── README.md
```

---

## System Requirements
- **Node.js**: v14 or higher
- **MySQL**: v8.0 or higher
- **Cloudinary Account**: Required for Backup feature
- **Gmail Account**: Required for OTP Email configuration

---

## Installation & Setup

### Step 1: Database Initialization
1. Open MySQL Workbench or phpMyAdmin.
2. Run the `database/CREATE DATABASE.sql` script to create the `qr_agri_3nf` database and tables.
3. Create an **initial Admin account** (Manually insert into the `Users` table).

### Step 2: Backend Setup
```bash
cd backend
npm install
node server.js
```
Server run at **http://localhost:5000**

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm start
```
Application runs at **http://localhost:3000**

---

## Environment Configuration (.env)
Create a .env file in the backend/ directory:

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=qr_agri_3nf
DB_PORT=3306

# JWT Security
JWT_SECRET=your_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here

# Email Service (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (Backup Service)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

---

## Usage Guide
1. Login
Access: **http://localhost:3000/login**
Log in using an Admin or Staff account.

2. For Staff
Go to Product Management → Add / Edit / Delete products.
Fill in information → Save → The request switches to Pending status.
Track status in Request List.

3. For Admin
Go to Request List / Approvals to review requests.
Compare data → Approve or Reject.
Generate & download QR Codes in Product Management.
Perform Backup / Restore / Indexing in Service Management.

---

## Authors
This project was developed by students from Ho Chi Minh City University of Technology (HCMUT) – Faculty of Computer Science and Engineering:

- **Trần Đức Khôi Nguyên** – Backend Development
- **Lý Quốc Hào** – Backend Development
- **Lương Đức Huy** – Database Design
- **Nguyễn Ngọc Minh Hiền** – Frontend & Report
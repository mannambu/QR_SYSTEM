CREATE DATABASE qr_agri_3nf;
USE qr_agri_3nf;

CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Role ENUM('admin', 'staff') NOT NULL
);

CREATE TABLE Farms (
    FarmID INT AUTO_INCREMENT PRIMARY KEY,
    FarmName VARCHAR(255) NOT NULL,
    Address TEXT,
    Owner VARCHAR(255),
    Contact TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Certifications (
    CertID INT AUTO_INCREMENT PRIMARY KEY,
    CertName VARCHAR(100) NOT NULL UNIQUE,
    CertDescription TEXT,
    Issuer VARCHAR(255)
);

CREATE TABLE Products (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    FarmID INT NOT NULL,
    ProductName VARCHAR(255) NOT NULL,
    ProdDescription TEXT,
    Price INT NOT NULL,
    PlantDate DATE,
    HarvestDate DATE,
    QRUrl VARCHAR(255),
    Status ENUM('instock', 'outstock') DEFAULT 'instock',
    CreatedBy INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (FarmID) REFERENCES Farms(FarmID) ON DELETE RESTRICT
);

CREATE TABLE ProductImages (
    ImageID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT NOT NULL,
    ImageUrl TEXT NOT NULL,
    MediaType ENUM('image') DEFAULT 'image',
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);

CREATE TABLE Product_Certifications (
    ProductID INT,
    CertID INT,
    IssueDate DATE,
    ExpireDate DATE,
    PRIMARY KEY (ProductID, CertID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (CertID) REFERENCES Certifications(CertID) ON DELETE CASCADE
);

CREATE TABLE ApprovalRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT,
    RequestType ENUM('create', 'update', 'delete') NOT NULL,
    RequestedBy INT,
    ReviewedBy INT,
    Status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    Notes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ReviewedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Data JSON DEFAULT NULL,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE SET NULL,
    FOREIGN KEY (RequestedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ReviewedBy) REFERENCES Users(UserID)
);
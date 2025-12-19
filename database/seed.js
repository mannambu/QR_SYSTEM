const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
dotenv.config();

async function main() {
  const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: null,
    connectionLimit: 10,
  });

  try {
    const conn = await db.getConnection();
    console.log('MySQL Connected (pool ready)');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err);
    return;
  }

  // Hàm sinh giá trị Price >10000 và tròn trăm
  function generatePrice() {
    const base = faker.number.int({ min: 101, max: 300 }); // 101 → 300
    return base * 100; // tròn trăm
  }

  // Farms
  async function seedFarms(count = 20) {
    for (let i = 0; i < count; i++) {
      await db.query(
        `INSERT INTO Farms (FarmName, Address, Owner, Contact) VALUES (?, ?, ?, ?)`,
        [
          `Trang trại ${faker.word.noun()} ${faker.location.city()}`,
          faker.location.streetAddress(),
          faker.person.fullName(),
          `SĐT: ${faker.phone.number()}`,
        ]
      );
    }
    console.log(`✅ Đã thêm ${count} Farms`);
  }
  // Certifications (chỉ 10 cái)
  async function seedCertifications(count = 10) {
    for (let i = 0; i < count; i++) {
      await db.query(
        `INSERT INTO Certifications (CertName, CertDescription, Issuer) VALUES (?, ?, ?)`,
        [
          `Chứng nhận ${faker.word.noun()}_${i}`,
          faker.lorem.sentence(),
          faker.company.name(),
        ]
      );
    }
    console.log(`✅ Đã thêm ${count} Certifications`);
  }

  // Products + Images + Certifications
  async function seedProducts(count = 1000) {
    const [farms] = await db.query(`SELECT FarmID FROM Farms`);
    const [certs] = await db.query(`SELECT CertID FROM Certifications`);

    for (let i = 0; i < count; i++) {
      const farmId = faker.helpers.arrayElement(farms).FarmID;
      const createdBy = faker.number.int({ min: 1, max: 3 });
      const price = generatePrice();

      // Insert product
      const [result] = await db.query(
        `INSERT INTO Products (FarmID, ProductName, ProdDescription, PlantDate, HarvestDate, Status, CreatedBy, Price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          farmId,
          faker.commerce.productName(),
          faker.commerce.productDescription(),
          faker.date.past().toISOString().split('T')[0],
          faker.date.future().toISOString().split('T')[0],
          faker.helpers.arrayElement(['instock', 'outstock']),
          createdBy,
          price,
        ]
      );

      const productId = result.insertId;

      // Update QRUrl
      const qrUrl = `http://localhost:3000/product/${productId}`;
      await db.query(`UPDATE Products SET QRUrl = ? WHERE ProductID = ?`, [
        qrUrl,
        productId,
      ]);

      // Gán ít nhất 1 ảnh
      await db.query(
        `INSERT INTO ProductImages (ProductID, ImageUrl, MediaType) VALUES (?, ?, ?)`,
        [productId, faker.image.url(), 'image']
      );

      // Gán đúng 1 chứng nhận cho mỗi product
      const certId = faker.helpers.arrayElement(certs).CertID;
      await db.query(
        `INSERT INTO Product_Certifications (ProductID, CertID, IssueDate, ExpireDate) VALUES (?, ?, ?, ?)`,
        [
          productId,
          certId,
          faker.date.past().toISOString().split('T')[0],
          faker.date.future().toISOString().split('T')[0],
        ]
      );
    }
    console.log(
      `✅ Đã thêm ${count} Products với Price >10000, QRUrl chuẩn, Farm, Image, và mỗi Product có đúng 1 Certification`
    );
  }
  async function seedApprovalRequests(count = 2000) {
    const [products] = await db.query(`SELECT ProductID FROM Products`);
    for (let i = 0; i < count; i++) {
      const productId = faker.helpers.arrayElement(products).ProductID;
      const requestedBy = faker.number.int({ min: 1, max: 3 });
      const reviewedBy = 1; // giả sử admin có UserID = 1
      await db.query(
        `INSERT INTO ApprovalRequests (ProductID, RequestType, RequestedBy, ReviewedBy, Status, Notes)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          productId,
          faker.helpers.arrayElement(['create', 'update', 'delete']),
          requestedBy,
          reviewedBy,
          faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
          faker.lorem.sentence(),
        ]
      );
    }
    console.log(`✅ Đã thêm ${count} ApprovalRequests`);
  }

  // Gọi seed tuần tự
  //await seedFarms();
  //await seedCertifications();
  await seedProducts();
  await seedApprovalRequests();

  await db.end();
}

main();
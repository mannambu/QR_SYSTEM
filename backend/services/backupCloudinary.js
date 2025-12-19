const cloudinary = require('cloudinary').v2;
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require('https');
require("dotenv").config();

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Hàm Backup
const backupToCloudinary = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.sql`;
    const filePath = path.join(__dirname, `../uploads/${fileName}`); // Lưu tạm vào folder uploads có sẵn

    // Lấy config khớp với server.js của bạn
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || 3306;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASS; // Chú ý: server.js của bạn dùng DB_PASS
    const database = process.env.DB_NAME;

    console.log("⏳ Đang dump dữ liệu từ Aiven Cloud...");
    
    // --column-statistics=0 là bắt buộc với MySQL 8
const dumpCommand = `mysqldump -h ${host} -P ${port} -u ${user} -p"${password}" --column-statistics=0 --set-gtid-purged=OFF --no-tablespaces ${database} > "${filePath}"`;

    return new Promise((resolve, reject) => {
        exec(dumpCommand, { maxBuffer: 1024 * 1024 * 100 }, async (error) => {
            if (error) {
                console.error("❌ Lỗi Dump:", error.message);
                return reject(error);
            }

            try {
                console.log("☁️ Đang upload lên Cloudinary...");
                const result = await cloudinary.uploader.upload(filePath, {
                    resource_type: 'raw',       
                    folder: 'backup_db_doan',     
                    public_id: fileName,
                    use_filename: true
                });

                // Xóa file tạm
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                
                resolve({ 
                    msg: "Backup thành công", 
                    url: result.secure_url,
                    created_at: new Date() 
                });

            } catch (uploadError) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                reject(uploadError);
            }
        });
    });
};

// 3. Hàm Recovery
const recoverFromCloudinary = async () => {
    console.log("🔍 Đang tìm bản backup mới nhất...");

    const result = await cloudinary.search
        .expression('folder:backup_db_doan AND resource_type:raw')
        .sort_by('created_at', 'desc')
        .max_results(1)
        .execute();

    if (!result.resources || result.resources.length === 0) {
        throw new Error("Không tìm thấy file backup nào!");
    }

    const latestFile = result.resources[0];
    const fileUrl = latestFile.secure_url;
    const downloadPath = path.join(__dirname, `../uploads/restore_temp.sql`);

    console.log(`⬇️ Đang tải về: ${latestFile.public_id}`);

    const file = fs.createWriteStream(downloadPath);
    
    return new Promise((resolve, reject) => {
        https.get(fileUrl, function(response) {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log("📥 Đang import vào Database...");

                    const host = process.env.DB_HOST;
                    const port = process.env.DB_PORT || 3306;
                    const user = process.env.DB_USER;
                    const password = process.env.DB_PASS; // Khớp với server.js
                    const database = process.env.DB_NAME;

                    const restoreCmd = `mysql -h ${host} -P ${port} -u ${user} -p"${password}" ${database} < "${downloadPath}"`;
                    
                    exec(restoreCmd, (err) => {
                        if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
                        
                        if (err) {
                            console.error("❌ Lỗi Restore:", err.message);
                            return reject(err);
                        }
                        resolve("Khôi phục thành công!");
                    });
                });
            });
        }).on('error', (err) => {
            if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
            reject(err);
        });
    });
};

module.exports = { backupToCloudinary, recoverFromCloudinary };
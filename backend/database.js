const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '10.12.2.135',
    user: process.env.DB_USER || 'lyq',
    password: process.env.DB_PASSWORD || 'lyq@xxxxxx',
    database: process.env.DB_NAME || 'fdldb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 查询函数
async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

module.exports = { query };
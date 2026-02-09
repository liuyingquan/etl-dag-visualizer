// 这是一个简单的测试脚本，用于验证数据库连接
const { query } = require('./database');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        
        // 测试连接
        const result = await query('SELECT 1 + 1 AS solution');
        console.log('Database connection successful:', result);
        
        // 检查表是否存在
        const tables = await query('SHOW TABLES');
        console.log('Available tables:', tables);
        
        // 检查每个表的数据量
        for (let table of tables) {
            const tableName = table[`Tables_in_${process.env.DB_NAME || 'etl_system'}`];
            const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`${tableName}: ${countResult[0].count} rows`);
        }
        
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.error('Please check:');
        console.error('1. MySQL is running');
        console.error('2. Database exists: etl_system');
        console.error('3. User credentials in .env file');
        console.error('4. Tables are created');
    }
}

testConnection();
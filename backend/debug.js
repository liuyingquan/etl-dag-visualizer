const { query } = require('./database');

async function debugDatabase() {
    try {
        console.log('=== 数据库调试信息 ===');
        
        // 测试连接
        const result = await query('SELECT 1 + 1 AS solution');
        console.log('1. 数据库连接测试:', result[0].solution === 2 ? '成功' : '失败');
        
        // 检查表和数据
        const tables = [
            'fdl_task_group',
            'fdl_task_map_group',
            'fdl_task_group_relation',
            'fdl_work_last_record',
            'fdl_catalog'
        ];
        
        for (const table of tables) {
            try {
                const count = await query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`2. ${table}: ${count[0].count} 行数据`);
                
                if (count[0].count > 0) {
                    const sample = await query(`SELECT * FROM ${table} LIMIT 1`);
                    console.log(`   示例数据:`, JSON.stringify(sample[0], null, 2).substring(0, 200) + '...');
                }
            } catch (err) {
                console.log(`2. ${table}: 错误 - ${err.message}`);
            }
        }
        
    } catch (error) {
        console.error('调试过程中发生错误:', error);
    }
}

debugDatabase();
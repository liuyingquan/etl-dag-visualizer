// backend/routes/catalog.js
router.get('/tree', async (req, res) => {
  try {
    // 1. 查询目录数据
    const catalogItems = await db.query('SELECT * FROM fdl_catalog ORDER BY sort_index');
    
    // 2. 查询关联的任务信息
    const workInfos = await db.query('SELECT * FROM fdl_work_info');
    const workInfoMap = new Map(workInfos.map(item => [item.resource_id, item]));
    
    // 3. 构建树形结构（逻辑类似前端的buildCatalogTree）
    // ... 树构建逻辑 ...
    
    // 4. 返回树形数据
    res.json({ success: true, tree: treeData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
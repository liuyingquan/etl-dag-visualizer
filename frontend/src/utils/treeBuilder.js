// frontend/src/utils/treeBuilder.js

/**
 * 构建目录树
 * @param {Array} catalogData - 原始目录数据（fdl_catalog）
 * @param {Array} workInfoData - 任务信息数据（fdl_work_info）
 * @returns {Array} 树形结构数组
 */
export function buildCatalogTree(catalogData, workInfoData) {
  // 1. 创建快速查找映射
  const nodeMap = new Map();
  const workInfoMap = new Map(workInfoData.map(item => [item.resource_id, item]));

  // 2. 初始化所有节点，并关联任务信息
  catalogData.forEach(item => {
    const node = {
      id: item.id,
      pid: item.pid,
      name: item.name,
      type: item.catalog_type.toLowerCase(), // 'package'或'entity'
      sortIndex: parseFloat(item.sort_index) || 0,
      resourceId: item.resource_id,
      resourceType: item.resource_type,
      description: item.description || '',
      children: [],
      // 如果是实体节点，关联工作信息
      workInfo: item.resource_type !== 'PACKAGE' && workInfoMap.has(item.resource_id) 
                ? workInfoMap.get(item.resource_id) 
                : null
    };
    nodeMap.set(node.id, node);
  });

  // 3. 构建树形结构
  const rootNodes = [];
  nodeMap.forEach(node => {
    // 处理可能的空pid或根节点标识
    if (!node.pid || node.pid === '_DP_ROOT_CATALOG_' || !nodeMap.has(node.pid)) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.pid);
      if (parent && parent.type === 'package') {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    }
  });

  // 4. 排序：根节点及每层子节点按sort_index排序
  function sortTree(nodes) {
    nodes.sort((a, b) => a.sortIndex - b.sortIndex);
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      }
    });
    return nodes;
  }

  return sortTree(rootNodes);
}

/**
 * 扁平化树（用于搜索、筛选等场景）
 */
export function flattenTree(treeData, result = []) {
  treeData.forEach(node => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, result);
    }
  });
  return result;
}
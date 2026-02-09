const { query } = require('./database');

// 根据任务组名称判断数据层
function getLayerFromName(name) {
    if (!name) return 'other';
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith('ods_')) return 'ods';
    if (lowerName.startsWith('dim_')) return 'dim';
    if (lowerName.startsWith('dwd_')) return 'dwd';
    if (lowerName.startsWith('dws_')) return 'dws';
    if (lowerName.startsWith('ads_')) return 'ads';
    if (lowerName.startsWith('timer_')) return 'timer';
    return 'other';
}

// 获取节点样式
function getNodeStyle(layer, status) {
    // 填充颜色按数据层分类
    const layerColors = {
        'ods': '#E3F2FD',
        'dim': '#E8F5E9',
        'dwd': '#FFF3E0',
        'dws': '#F3E5F5',
        'ads': '#E0F7FA',
        'timer': '#F5F5F5',
        'other': '#FAFAFA'
    };

    // 边框颜色按运行状态
    const statusColors = {
        'SUCCESS': '#4CAF50',
        'RUNNING': '#FFC107',
        'FAILED': '#F44336',
        'NOT_RUN': '#9E9E9E'
    };

    return {
        fill: layerColors[layer] || '#FAFAFA',
        stroke: statusColors[status] || '#9E9E9E',
        lineWidth: 2,
        radius: 4
    };
}

// 构建完整DAG图
async function buildDag() {
    try {
        console.log('开始构建DAG图...');
        
        // 1. 获取所有任务组信息
        const taskGroups = await query(`
            SELECT 
                tg.id,
                tg.name,
                tg.judgement,
                tg.plan_id,
                tg.status,
                MAX(wi.name) as task_name,
                MAX(wi.resource_id) as resource_id,
                MAX(lr.taskStatus) as taskStatus,
                MAX(lr.startTime) as startTime,
                MAX(lr.finishTime) as finishTime
            FROM fdl_task_group tg
            LEFT JOIN fdl_task_map_group tmg ON tg.id = tmg.group_id
            LEFT JOIN fdl_work_info wi ON tmg.id = wi.resource_id
            LEFT JOIN fdl_work_last_record lr ON wi.resource_id = lr.taskId
            WHERE tg.status = 'OPEN'
            GROUP BY tg.id, tg.name, tg.judgement, tg.plan_id, tg.status
        `);

        console.log(`找到 ${taskGroups.length} 个任务组`);

        // 2. 获取任务组关系
        const relations = await query(`
            SELECT * FROM fdl_task_group_relation
        `);

        console.log(`找到 ${relations.length} 个任务关系`);

        // 3. 构建节点
        const nodes = taskGroups.map(group => {
            const layer = getLayerFromName(group.name);
            const status = group.taskStatus || 'NOT_RUN';
            
            return {
                id: group.id,
                label: group.name,
                type: 'task-group',
                layer: layer,
                status: status,
                data: {
                    name: group.name,
                    lastRunTime: group.finishTime ? new Date(parseInt(group.finishTime)).toLocaleString() : '从未运行',
                    startTime: group.startTime,
                    finishTime: group.finishTime,
                    description: group.description || '',
                    judgement: group.judgement ? JSON.parse(group.judgement) : null
                },
                style: getNodeStyle(layer, status)
            };
        });

        // 4. 构建边
        const edges = relations.map(relation => ({
            id: relation.id,
            source: relation.from_id,
            target: relation.to_id,
            type: 'flow'
        }));

        console.log('DAG图构建完成');
        return { nodes, edges };
    } catch (error) {
        console.error('构建DAG图时发生错误:', error);
        throw error;
    }
}

// 获取筛选后的DAG图
async function getFilteredDag(groupId) {
    try {
        console.log(`开始构建筛选的DAG图，任务组ID: ${groupId}`);
        
        // 获取目标任务组的所有上下游关系
        const allRelations = await query(`
            WITH RECURSIVE upstream AS (
                SELECT from_id, to_id FROM fdl_task_group_relation WHERE to_id = ?
                UNION ALL
                SELECT r.from_id, r.to_id 
                FROM fdl_task_group_relation r
                INNER JOIN upstream u ON r.to_id = u.from_id
            ),
            downstream AS (
                SELECT from_id, to_id FROM fdl_task_group_relation WHERE from_id = ?
                UNION ALL
                SELECT r.from_id, r.to_id 
                FROM fdl_task_group_relation r
                INNER JOIN downstream d ON r.from_id = d.to_id
            )
            SELECT DISTINCT from_id, to_id FROM (
                SELECT from_id, to_id FROM upstream
                UNION
                SELECT from_id, to_id FROM downstream
            ) all_relations
        `, [groupId, groupId]);

        // 获取相关任务组ID
        const relatedGroupIds = new Set();
        allRelations.forEach(rel => {
            relatedGroupIds.add(rel.from_id);
            relatedGroupIds.add(rel.to_id);
        });
        relatedGroupIds.add(groupId);

        console.log(`找到 ${relatedGroupIds.size} 个相关任务组`);

        // 获取相关任务组信息
        const idArray = Array.from(relatedGroupIds);
        const placeholders = idArray.map(() => '?').join(',');
        
        const relatedGroups = await query(`
            SELECT 
                tg.id,
                tg.name,
                tg.judgement,
                tg.plan_id,
                tg.status,
                MAX(wi.name) as task_name,
                MAX(wi.resource_id) as resource_id,
                MAX(lr.taskStatus) as taskStatus,
                MAX(lr.startTime) as startTime,
                MAX(lr.finishTime) as finishTime
            FROM fdl_task_group tg
            LEFT JOIN fdl_task_map_group tmg ON tg.id = tmg.group_id
            LEFT JOIN fdl_work_info wi ON tmg.id = wi.resource_id
            LEFT JOIN fdl_work_last_record lr ON wi.resource_id = lr.taskId
            WHERE tg.id IN (${placeholders})
            GROUP BY tg.id, tg.name, tg.judgement, tg.plan_id, tg.status
        `, idArray);

        // 构建节点和边
        const nodes = relatedGroups.map(group => ({
            id: group.id,
            label: group.name,
            type: 'task-group',
            layer: getLayerFromName(group.name),
            status: group.taskStatus || 'NOT_RUN',
            data: {
                name: group.name,
                lastRunTime: group.finishTime ? new Date(parseInt(group.finishTime)).toLocaleString() : '从未运行'
            },
            style: getNodeStyle(getLayerFromName(group.name), group.taskStatus || 'NOT_RUN')
        }));

        const edges = allRelations.map(rel => ({
            id: `edge_${rel.from_id}_${rel.to_id}`,
            source: rel.from_id,
            target: rel.to_id,
            type: 'flow'
        }));

        console.log(`筛选的DAG图构建完成: ${nodes.length} 个节点, ${edges.length} 条边`);
        return { nodes, edges };
    } catch (error) {
        console.error('构建筛选的DAG图时发生错误:', error);
        throw error;
    }
}

// 获取所有任务组列表
async function getTaskGroups() {
    try {
        const groups = await query(`
            SELECT id, name, status FROM fdl_task_group ORDER BY name
        `);
        console.log(`获取到 ${groups.length} 个任务组`);
        return groups;
    } catch (error) {
        console.error('获取任务组列表时发生错误:', error);
        // 返回空数组而不是抛出错误
        return [];
    }
}

// 获取目录树（包含任务）
async function getCatalogTree() {
    try {
        // 1. 获取所有目录项
        const catalogItems = await query(`
            SELECT 
                id,
                name,
                pid,
                resource_id,
                resource_type,
                sort_index,
                description,
                catalog_type
            FROM fdl_catalog 
            ORDER BY sort_index
        `);

        console.log(`获取到 ${catalogItems.length} 个目录项`);

        // 2. 获取所有任务信息
        const tasks = await query(`
            SELECT 
                id,
                name,
                resource_id,
                resource_type,
                description,
                create_time
            FROM fdl_work_info
        `);

        console.log(`获取到 ${tasks.length} 个任务`);

        // 3. 创建任务映射表（按resource_id和resource_type）
        const taskMap = new Map();
        tasks.forEach(task => {
            const key = `${task.resource_id}_${task.resource_type}`;
            taskMap.set(key, {
                id: task.id,
                name: task.name,
                description: task.description,
                create_time: task.create_time,
                type: 'task'
            });
        });

        // 4. 构建目录节点映射表
        const nodeMap = new Map();
        const rootNodes = [];

        // 第一遍：创建所有节点
        catalogItems.forEach(item => {
            const node = {
                id: item.id,
                name: item.name,
                pid: item.pid,
                catalog_type: item.catalog_type,
                resource_id: item.resource_id,
                resource_type: item.resource_type,
                description: item.description,
                sort_index: item.sort_index,
                children: [],
                type: item.catalog_type === 'PACKAGE' ? 'folder' : 'item'
            };

            // 如果是任务类型，查找关联的任务
            if (item.resource_type === 'OFFLINE' && item.resource_id) {
                const taskKey = `${item.resource_id}_${item.resource_type}`;
                const taskInfo = taskMap.get(taskKey);
                if (taskInfo) {
                    node.task = taskInfo;
                    node.type = 'task';
                }
            }

            nodeMap.set(item.id, node);

            // 如果是根节点（pid为null或空）
            if (!item.pid || item.pid === 'null' || item.pid === '') {
                rootNodes.push(node);
            }
        });

        // 第二遍：构建树形结构
        catalogItems.forEach(item => {
            if (item.pid && item.pid !== 'null' && item.pid !== '') {
                const parentNode = nodeMap.get(item.pid);
                if (parentNode) {
                    parentNode.children.push(nodeMap.get(item.id));
                }
            }
        });

        // 对每个节点的子节点按sort_index排序
        const sortChildren = (node) => {
            if (node.children && node.children.length > 0) {
                node.children.sort((a, b) => {
                    // 如果sort_index都是数字，按数字排序
                    if (!isNaN(a.sort_index) && !isNaN(b.sort_index)) {
                        return parseInt(a.sort_index) - parseInt(b.sort_index);
                    }
                    // 否则按字母排序
                    return (a.sort_index || '').localeCompare(b.sort_index || '');
                });
                
                // 递归排序子节点的子节点
                node.children.forEach(child => sortChildren(child));
            }
        };

        rootNodes.forEach(root => sortChildren(root));

        console.log(`构建了 ${rootNodes.length} 个根目录`);
        return rootNodes;
    } catch (error) {
        console.error('获取目录树时发生错误:', error);
        // 返回空数组而不是抛出错误
        return [];
    }
}

// 获取目录下的任务列表（可选功能）
async function getTasksByCatalogId(catalogId) {
    try {
        const tasks = await query(`
            SELECT 
                wi.id,
                wi.name,
                wi.description,
                wi.create_time,
                wi.resource_id,
                wi.resource_type
            FROM fdl_work_info wi
            INNER JOIN fdl_catalog c ON wi.resource_id = c.resource_id 
                AND wi.resource_type = c.resource_type
            WHERE c.id = ? OR c.pid = ?
        `, [catalogId, catalogId]);

        console.log(`获取到目录 ${catalogId} 下的 ${tasks.length} 个任务`);
        return tasks;
    } catch (error) {
        console.error('获取目录任务时发生错误:', error);
        return [];
    }
}

// 导出函数
module.exports = { 
    buildDag, 
    getFilteredDag, 
    getTaskGroups, 
    getCatalogTree,
    getTasksByCatalogId  // 新增
};

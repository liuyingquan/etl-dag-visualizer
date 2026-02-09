<template>
  <div class="app-container">
    <header class="app-header">
      <h1>ETL调度任务依赖关系图</h1>
    </header>
    
    <div class="main-layout">
      <!-- 左侧边栏 -->
      <div class="sidebar">
        <div class="filter-section">
          <h3>任务组筛选</h3>
          <el-select
            v-model="selectedGroup"
            filterable
            placeholder="选择或输入任务组名称"
            @change="onGroupSelect"
            class="group-select"
            :loading="loading"
          >
            <el-option
              v-for="group in taskGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
          
          <div class="legend">
            <h4>图例说明</h4>
            <div class="legend-item">
              <div class="color-box" style="background-color: #E3F2FD;"></div>
              <span>ODS层</span>
            </div>
            <div class="legend-item">
              <div class="color-box" style="background-color: #E8F5E9;"></div>
              <span>DIM层</span>
            </div>
            <div class="legend-item">
              <div class="color-box" style="background-color: #FFF3E0;"></div>
              <span>DWD层</span>
            </div>
            <div class="legend-item">
              <div class="color-box" style="background-color: #F3E5F5;"></div>
              <span>DWS层</span>
            </div>
            <div class="legend-item">
              <div class="color-box" style="background-color: #E0F7FA;"></div>
              <span>ADS层</span>
            </div>
            <div class="legend-item">
              <div class="color-box" style="background-color: #F5F5F5;"></div>
              <span>TIMER</span>
            </div>
          </div>
        </div>
        
        <div class="catalog-section">
          <h3>目录树</h3>
          <el-tree
            :data="catalogTree"
            node-key="id"
            :props="treeProps"
            @node-click="onCatalogClick"
          />
        </div>
      </div>
      
      <!-- 主内容区 -->
      <div class="content-area">
        <div class="toolbar">
          <el-button @click="loadFullDag" :loading="loading">显示全部</el-button>
          <el-button @click="zoomIn">放大</el-button>
          <el-button @click="zoomOut">缩小</el-button>
          <el-button @click="fitView">适应画布</el-button>
          <el-button @click="autoLayout">自动布局</el-button>
          <el-button @click="clearSelection">清除选择</el-button>
        </div>
        
        <div id="dag-container" ref="dagContainer" style="flex: 1; min-height: 0;">
          <div v-if="loading" class="loading-overlay">
            <div class="loading-content">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在加载数据...</span>
            </div>
          </div>
          <div v-if="!loading && dagData.nodes.length === 0" class="empty-state">
            没有数据，请检查后端连接
          </div>
        </div>
      </div>
      
      <!-- 右侧详情面板 -->
      <div class="detail-panel" v-if="selectedNode">
        <h3>任务详情</h3>
        <div class="detail-content">
          <div class="detail-item">
            <label>任务组名称:</label>
            <span>{{ selectedNode.data.name }}</span>
          </div>
          <div class="detail-item">
            <label>最近运行时间:</label>
            <span>{{ selectedNode.data.lastRunTime }}</span>
          </div>
          <div class="detail-item">
            <label>运行状态:</label>
            <span :class="`status-${selectedNode.status}`">
              {{ selectedNode.status }}
            </span>
          </div>
          <div class="detail-item">
            <label>数据层级:</label>
            <span>{{ selectedNode.layer }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import axios from 'axios'
import { Loading } from '@element-plus/icons-vue'

// 使用CDN方式引入G6（避免模块导入问题）
const G6 = window.G6 || {}

// 响应式数据
const dagContainer = ref(null)
const selectedGroup = ref('')
const taskGroups = ref([])
const catalogTree = ref([])
const selectedNode = ref(null)
const loading = ref(false)
const dagData = ref({ nodes: [], edges: [] })
const treeProps = {
  children: 'children',
  label: 'name'
}

// G6实例
let graph = null

// 配置
const layoutConfig = {
  type: 'dagre',
  rankdir: 'LR',
  align: 'UL',
  nodesep: 50,
  ranksep: 70
}

// 初始化G6图
const initGraph = () => {
  if (!dagContainer.value || !G6.Graph) {
    console.error('G6 not loaded or container not found')
    setTimeout(initGraph, 100) // 重试
    return
  }
  
  try {
    // 销毁已有的图
    if (graph) {
      graph.destroy()
    }
    
    graph = new G6.Graph({
      container: dagContainer.value,
      width: dagContainer.value.clientWidth,
      height: dagContainer.value.clientHeight,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node']
      },
      defaultNode: {
        type: 'rect',
        size: [200, 70],
        style: {
          fill: '#fff',
          stroke: '#000',
          lineWidth: 2,
          radius: 6
        },
        labelCfg: {
          style: {
            fill: '#333',
            fontSize: 12,
            fontWeight: 500
          },
          position: 'center'
        }
      },
      defaultEdge: {
        type: 'cubic-horizontal',
        style: {
          stroke: '#999',
          lineWidth: 1,
          endArrow: {
            path: 'M 0,0 L 8,4 L 8,-4 Z',
            fill: '#999'
          }
        },
        labelCfg: {
          autoRotate: true,
          style: {
            fill: '#666',
            fontSize: 10,
            background: {
              fill: '#fff',
              padding: [2, 4, 2, 4],
              radius: 2
            }
          }
        }
      },
      nodeStateStyles: {
        hover: {
          stroke: '#1890ff',
          lineWidth: 3,
          shadowColor: '#1890ff',
          shadowBlur: 10
        },
        selected: {
          stroke: '#1890ff',
          lineWidth: 3
        }
      },
      layout: layoutConfig,
      fitView: true,
      animate: true,
      minZoom: 0.1,
      maxZoom: 3
    })

    // 事件监听
    graph.on('node:mouseenter', (evt) => {
      if (graph && evt.item) {
        graph.setItemState(evt.item, 'hover', true)
      }
    })

    graph.on('node:mouseleave', (evt) => {
      if (graph && evt.item) {
        graph.setItemState(evt.item, 'hover', false)
      }
    })

    graph.on('node:click', (evt) => {
      if (graph && evt.item) {
        // 清除之前选中的节点
        graph.getNodes().forEach(node => {
          graph.setItemState(node, 'selected', false)
        })
        graph.setItemState(evt.item, 'selected', true)
        selectedNode.value = evt.item.getModel()
      }
    })

    graph.on('canvas:click', () => {
      if (graph) {
        graph.getNodes().forEach(node => {
          graph.setItemState(node, 'selected', false)
        })
        selectedNode.value = null
      }
    })

    // 窗口大小调整
    window.addEventListener('resize', handleResize)
    
    console.log('G6 graph initialized successfully')
    
    // 初始加载数据
    loadFullDag()
  } catch (error) {
    console.error('Failed to initialize G6 graph:', error)
  }
}

// 加载完整DAG
const loadFullDag = async () => {
  loading.value = true
  try {
    console.log('Loading full DAG...')
    const response = await axios.get('http://localhost:3000/api/dag')
    console.log('DAG data received:', response.data)
    dagData.value = response.data
    renderGraph(response.data)
  } catch (error) {
    console.error('Failed to load DAG:', error)
    // 使用模拟数据作为后备
    renderGraph(getMockData())
  } finally {
    loading.value = false
  }
}

// 加载筛选后的DAG
const loadFilteredDag = async (groupId) => {
  if (!groupId) return loadFullDag()
  
  loading.value = true
  try {
    console.log('Loading filtered DAG for group:', groupId)
    const response = await axios.get('http://localhost:3000/api/dag/filtered', {
      params: { groupId }
    })
    dagData.value = response.data
    renderGraph(response.data)
  } catch (error) {
    console.error('Failed to load filtered DAG:', error)
    alert('获取筛选数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染图
const renderGraph = (data) => {
  if (!graph || !data) return
  
  try {
    // 准备节点数据
    const nodes = data.nodes.map(node => ({
      id: node.id,
      label: node.label || node.name || node.id,
      size: [200, 70],
      style: node.style || getDefaultNodeStyle(node),
      data: {
        ...node.data,
        name: node.label || node.name || node.id,
        layer: node.layer,
        status: node.status
      }
    }))
    
    // 准备边数据
    const edges = data.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || ''
    }))
    
    console.log(`Rendering ${nodes.length} nodes and ${edges.length} edges`)
    
    graph.data({ nodes, edges })
    graph.render()
    graph.fitView()
    
    // 添加动画效果
    setTimeout(() => {
      if (graph) {
        graph.fitView()
      }
    }, 100)
  } catch (error) {
    console.error('Failed to render graph:', error)
  }
}

// 获取默认节点样式
const getDefaultNodeStyle = (node) => {
  const layerColors = {
    'ods': '#E3F2FD',
    'dim': '#E8F5E9',
    'dwd': '#FFF3E0',
    'dws': '#F3E5F5',
    'ads': '#E0F7FA',
    'timer': '#F5F5F5',
    'other': '#FAFAFA'
  }
  
  const statusColors = {
    'SUCCESS': '#4CAF50',
    'RUNNING': '#FFC107',
    'FAILED': '#F44336',
    'NOT_RUN': '#9E9E9E'
  }
  
  const layer = node.layer || getLayerFromName(node.label || node.name || '')
  const status = node.status || 'NOT_RUN'
  
  return {
    fill: layerColors[layer] || '#FAFAFA',
    stroke: statusColors[status] || '#9E9E9E',
    lineWidth: 2,
    radius: 6,
    cursor: 'pointer'
  }
}

// 根据名称判断数据层
const getLayerFromName = (name) => {
  if (!name) return 'other'
  const lowerName = name.toLowerCase()
  if (lowerName.startsWith('ods_')) return 'ods'
  if (lowerName.startsWith('dim_')) return 'dim'
  if (lowerName.startsWith('dwd_')) return 'dwd'
  if (lowerName.startsWith('dws_')) return 'dws'
  if (lowerName.startsWith('ads_')) return 'ads'
  if (lowerName.startsWith('timer_')) return 'timer'
  return 'other'
}

// 模拟数据
const getMockData = () => {
  const nodes = [
    {
      id: '0019eacd-3078-4bd1-bf41-33218f03e375',
      label: 'ods_mes20_mes_master_materiel_type',
      layer: 'ods',
      status: 'SUCCESS',
      data: {
        name: 'ods_mes20_mes_master_materiel_type',
        lastRunTime: new Date().toLocaleString()
      }
    },
    {
      id: '009525b1-1b29-4f40-994e-8fc1bf797c6c',
      label: 'dwd_pm_online_tcoc',
      layer: 'dwd',
      status: 'RUNNING',
      data: {
        name: 'dwd_pm_online_tcoc',
        lastRunTime: new Date().toLocaleString()
      }
    },
    {
      id: '00bd9837-36f1-4160-9614-cb1fcd85f67a',
      label: 'ods_mes20_db18s2226_t_markbox',
      layer: 'ods',
      status: 'FAILED',
      data: {
        name: 'ods_mes20_db18s2226_t_markbox',
        lastRunTime: new Date().toLocaleString()
      }
    },
    {
      id: '012c63cd-d608-43eb-8052-96b017670298',
      label: 'ods_iot_scada_scada_ct_ct_log_line_day',
      layer: 'ods',
      status: 'SUCCESS',
      data: {
        name: 'ods_iot_scada_scada_ct_ct_log_line_day',
        lastRunTime: new Date().toLocaleString()
      }
    }
  ]
  
  const edges = [
    { id: 'edge1', source: '0019eacd-3078-4bd1-bf41-33218f03e375', target: '009525b1-1b29-4f40-994e-8fc1bf797c6c' },
    { id: 'edge2', source: '00bd9837-36f1-4160-9614-cb1fcd85f67a', target: '009525b1-1b29-4f40-994e-8fc1bf797c6c' },
    { id: 'edge3', source: '009525b1-1b29-4f40-994e-8fc1bf797c6c', target: '012c63cd-d608-43eb-8052-96b017670298' }
  ]
  
  // 添加样式
  nodes.forEach(node => {
    node.style = getDefaultNodeStyle(node)
  })
  
  return { nodes, edges }
}

// 任务组选择事件
const onGroupSelect = (groupId) => {
  if (groupId) {
    loadFilteredDag(groupId)
  } else {
    loadFullDag()
  }
}

// 加载任务组列表
const loadTaskGroups = async () => {
  try {
    console.log('Loading task groups...')
    const response = await axios.get('http://localhost:3000/api/task-groups')
    taskGroups.value = response.data || []
    console.log(`Loaded ${taskGroups.value.length} task groups`)
  } catch (error) {
    console.error('Failed to load task groups:', error)
    // 模拟数据
    taskGroups.value = [
      { id: '0019eacd-3078-4bd1-bf41-33218f03e375', name: 'ods_mes20_mes_master_materiel_type', status: 'OPEN' },
      { id: '009525b1-1b29-4f40-994e-8fc1bf797c6c', name: 'dwd_pm_online_tcoc', status: 'OPEN' },
      { id: '00bd9837-36f1-4160-9614-cb1fcd85f67a', name: 'ods_mes20_db18s2226_t_markbox', status: 'OPEN' },
      { id: '012c63cd-d608-43eb-8052-96b017670298', name: 'ods_iot_scada_scada_ct_ct_log_line_day', status: 'OPEN' }
    ]
  }
}

// 加载目录树
const loadCatalog = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/catalog')
    catalogTree.value = response.data || []
  } catch (error) {
    console.error('Failed to load catalog:', error)
    // 模拟数据
    catalogTree.value = [
      { id: 'cat1', name: 'ods层', catalog_type: 'PACKAGE' },
      { id: 'cat2', name: 'dwd层', catalog_type: 'PACKAGE' },
      { id: 'cat3', name: 'ads层', catalog_type: 'PACKAGE' }
    ]
  }
}

// 目录点击事件
const onCatalogClick = (data) => {
  console.log('Catalog item clicked:', data)
}

// 工具栏功能
const zoomIn = () => {
  if (graph) graph.zoom(1.2, { x: graph.getWidth() / 2, y: graph.getHeight() / 2 })
}

const zoomOut = () => {
  if (graph) graph.zoom(0.8, { x: graph.getWidth() / 2, y: graph.getHeight() / 2 })
}

const fitView = () => {
  if (graph) graph.fitView()
}

const autoLayout = () => {
  if (graph) {
    graph.layout()
    graph.fitView()
  }
}

const clearSelection = () => {
  if (graph) {
    graph.getNodes().forEach(node => {
      graph.setItemState(node, 'selected', false)
    })
    selectedNode.value = null
  }
}

// 窗口大小调整
const handleResize = () => {
  if (graph && dagContainer.value) {
    graph.changeSize(dagContainer.value.clientWidth, dagContainer.value.clientHeight)
  }
}

// 组件挂载
onMounted(() => {
  console.log('App mounted')
  // 等待G6通过CDN加载
  const checkG6 = setInterval(() => {
    if (window.G6 && dagContainer.value) {
      clearInterval(checkG6)
      initGraph()
      loadTaskGroups()
      loadCatalog()
    }
  }, 100)
  
  // 设置超时
  setTimeout(() => {
    if (!graph && dagContainer.value) {
      console.error('G6 failed to load, trying alternative approach')
      initGraph()
      loadTaskGroups()
      loadCatalog()
    }
  }, 3000)
})

// 组件卸载
onUnmounted(() => {
  if (graph) {
    graph.destroy()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-shrink: 0;
  z-index: 1000;
}

.app-header h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 60px);
}

.sidebar {
  width: 280px;
  background: white;
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #e8e8e8;
  flex-shrink: 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.05);
}

.filter-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-section h3,
.catalog-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #262626;
  display: flex;
  align-items: center;
}

.filter-section h3::before,
.catalog-section h3::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: #1890ff;
  margin-right: 8px;
  border-radius: 2px;
}

.group-select {
  width: 100%;
  margin-bottom: 16px;
}

.legend {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.legend h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #595959;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.color-box {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-item span {
  font-size: 13px;
  color: #595959;
}

.catalog-section {
  margin-top: 24px;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  background: #fafafa;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  background: white;
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.toolbar .el-button {
  padding: 8px 16px;
  font-size: 13px;
}

#dag-container {
  flex: 1;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-content .el-icon {
  font-size: 24px;
  color: #1890ff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content span {
  font-size: 14px;
  color: #595959;
}

.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #bfbfbf;
}

.detail-panel {
  width: 320px;
  background: white;
  padding: 16px;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
  flex-shrink: 0;
  box-shadow: -2px 0 8px rgba(0,0,0,0.05);
}

.detail-panel h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #262626;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.detail-content {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.detail-item {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-item label {
  display: block;
  font-weight: 500;
  color: #595959;
  margin-bottom: 6px;
  font-size: 13px;
}

.detail-item span {
  display: block;
  font-size: 14px;
  color: #262626;
  word-break: break-word;
}

.status-SUCCESS {
  color: #52c41a;
  font-weight: 600;
  padding: 2px 8px;
  background: #f6ffed;
  border-radius: 4px;
  display: inline-block;
}

.status-RUNNING {
  color: #faad14;
  font-weight: 600;
  padding: 2px 8px;
  background: #fffbe6;
  border-radius: 4px;
  display: inline-block;
}

.status-FAILED {
  color: #ff4d4f;
  font-weight: 600;
  padding: 2px 8px;
  background: #fff2f0;
  border-radius: 4px;
  display: inline-block;
}

.status-NOT_RUN {
  color: #bfbfbf;
  font-weight: 600;
  padding: 2px 8px;
  background: #fafafa;
  border-radius: 4px;
  display: inline-block;
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar,
.detail-panel::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track,
.detail-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb,
.detail-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover,
.detail-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
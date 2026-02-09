<template>
  <div class="home-container">
    <!-- 左侧目录树 -->
    <div class="sidebar">
      <catalog-tree
        :catalog-data="catalogData"
        :work-info-data="workInfoData"
        @node-selected="handleNodeSelected"
        ref="catalogTree"
      />
    </div>
    
    <!-- 右侧主内容区 -->
    <div class="main-content">
      <!-- 根据选中的节点显示对应DAG图或任务详情 -->
      <div v-if="selectedNode">
        <h3>{{ selectedNode.name }}</h3>
        <p v-if="selectedNode.description">{{ selectedNode.description }}</p>
        
        <!-- 如果是任务节点，显示任务详情 -->
        <div v-if="selectedNode.type === 'entity' && selectedNode.workInfo">
          <task-detail :task-info="selectedNode.workInfo" />
        </div>
        
        <!-- 显示对应的DAG图 -->
        <dag-viewer v-if="selectedNode.resourceId" 
                   :resource-id="selectedNode.resourceId" />
      </div>
      <div v-else class="empty-state">
        请从左侧目录树选择一个节点
      </div>
    </div>
  </div>
</template>

<script>
import CatalogTree from '@/components/CatalogTree.vue';
import TaskDetail from '@/components/TaskDetail.vue';
import DagViewer from '@/components/DagViewer.vue';

export default {
  components: { CatalogTree, TaskDetail, DagViewer },
  data() {
    return {
      catalogData: [],   // 从API或CSV加载
      workInfoData: [],  // 从API或CSV加载
      selectedNode: null
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        // 这里替换为实际的API调用或CSV解析
        // const catalogRes = await axios.get('/api/catalog');
        // const workRes = await axios.get('/api/work-info');
        // this.catalogData = catalogRes.data;
        // this.workInfoData = workRes.data;
        
        // 临时使用模拟数据
        this.catalogData = []; // 你的catalog数据
        this.workInfoData = []; // 你的workInfo数据
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    },
    handleNodeSelected(node) {
      this.selectedNode = node;
      // 可以在这里触发DAG图加载
      console.log('选中节点:', node);
    }
  }
};
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 300px;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
.empty-state {
  text-align: center;
  color: #999;
  margin-top: 100px;
  font-size: 16px;
}
</style>
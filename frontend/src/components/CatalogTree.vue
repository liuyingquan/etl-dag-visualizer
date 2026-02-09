<!-- frontend/src/components/CatalogTree.vue -->
<template>
  <div class="catalog-tree">
    <!-- 搜索框（可选） -->
    <div class="tree-search" v-if="showSearch">
      <input 
        v-model="searchQuery" 
        placeholder="搜索目录或任务..."
        @input="handleSearch"
      />
    </div>
    
    <!-- 树形节点渲染 -->
    <div class="tree-nodes">
      <tree-node
        v-for="node in filteredTree"
        :key="node.id"
        :node="node"
        :level="0"
        @node-click="handleNodeClick"
      />
    </div>
  </div>
</template>

<script>
import TreeNode from './TreeNode.vue';
import { buildCatalogTree, flattenTree } from '@/utils/treeBuilder';

export default {
  name: 'CatalogTree',
  components: { TreeNode },
  props: {
    catalogData: { type: Array, default: () => [] },
    workInfoData: { type: Array, default: () => [] },
    showSearch: { type: Boolean, default: true }
  },
  data() {
    return {
      treeData: [],
      expandedKeys: {}, // 记录展开状态的 { [node.id]: true }
      searchQuery: '',
      originalTree: []
    };
  },
  computed: {
    filteredTree() {
      if (!this.searchQuery.trim()) {
        return this.treeData;
      }
      const query = this.searchQuery.toLowerCase();
      const flattened = flattenTree(this.originalTree);
      const matchedIds = new Set(
        flattened
          .filter(node => 
            node.name.toLowerCase().includes(query) || 
            (node.workInfo && node.workInfo.name.toLowerCase().includes(query))
          )
          .map(node => node.id)
      );
      // 筛选并确保父节点展开以显示匹配的子节点
      return this.filterTree(this.treeData, matchedIds);
    }
  },
  watch: {
    catalogData: {
      immediate: true,
      handler() { this.buildTree(); }
    },
    workInfoData: {
      handler() { this.buildTree(); }
    }
  },
  methods: {
    buildTree() {
      if (this.catalogData.length > 0) {
        this.treeData = buildCatalogTree(this.catalogData, this.workInfoData);
        this.originalTree = JSON.parse(JSON.stringify(this.treeData));
        // 默认展开第一层目录节点
        this.treeData.forEach(node => {
          if (node.type === 'package') {
            this.$set(this.expandedKeys, node.id, true);
          }
        });
      }
    },
    filterTree(nodes, matchedIds) {
      return nodes.filter(node => {
        // 如果节点本身匹配，或者有子节点匹配，则保留
        if (matchedIds.has(node.id)) return true;
        if (node.children) {
          node.children = this.filterTree(node.children, matchedIds);
          return node.children.length > 0;
        }
        return false;
      });
    },
    handleNodeClick(node) {
      this.$emit('node-selected', node);
      // 如果是目录节点，切换展开状态
      if (node.type === 'package') {
        this.$set(this.expandedKeys, node.id, !this.expandedKeys[node.id]);
      }
    },
    handleSearch() {
      // 搜索时自动展开所有节点以便查看结果
      if (this.searchQuery) {
        const allIds = flattenTree(this.originalTree).map(n => n.id);
        allIds.forEach(id => { this.expandedKeys[id] = true; });
      }
    }
  }
};
</script>

<style scoped>
.catalog-tree {
  padding: 12px;
  user-select: none;
}
.tree-search {
  margin-bottom: 12px;
}
.tree-search input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}
</style>
<!-- frontend/src/components/TreeNode.vue -->
<template>
  <div class="tree-node" :style="{ marginLeft: level * 20 + 'px' }">
    <div 
      class="node-content" 
      :class="[node.type, { 'has-children': hasChildren }]"
      @click.stop="handleClick"
    >
      <!-- 展开/收起图标 -->
      <span v-if="hasChildren" class="expand-icon">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="expand-placeholder"></span>
      
      <!-- 节点图标 -->
      <span class="node-icon">
        {{ node.type === 'package' ? '📁' : '📄' }}
      </span>
      
      <!-- 节点名称 -->
      <span class="node-name" :title="node.description">
        {{ node.name }}
      </span>
      
      <!-- 任务类型标签 -->
      <span v-if="node.type === 'entity' && node.workInfo" 
            class="node-badge" :title="node.workInfo.resource_type">
        {{ getResourceTypeLabel(node.workInfo.resource_type) }}
      </span>
    </div>
    
    <!-- 子节点 -->
    <div v-if="hasChildren && isExpanded" class="node-children">
      <tree-node
        v-for="child in sortedChildren"
        :key="child.id"
        :node="child"
        :level="level + 1"
        @node-click="$emit('node-click', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TreeNode',
  props: {
    node: { type: Object, required: true },
    level: { type: Number, default: 0 }
  },
  data() {
    return {
      isExpanded: false
    };
  },
  computed: {
    hasChildren() {
      return this.node.children && this.node.children.length > 0;
    },
    sortedChildren() {
      return this.node.children 
        ? [...this.node.children].sort((a, b) => a.sortIndex - b.sortIndex)
        : [];
    }
  },
  created() {
    // 默认展开状态（可以根据需要从父组件传入）
    this.isExpanded = this.level < 2; // 默认展开前两层
  },
  methods: {
    handleClick() {
      if (this.hasChildren) {
        this.isExpanded = !this.isExpanded;
      }
      this.$emit('node-click', this.node);
    },
    getResourceTypeLabel(type) {
      const labels = {
        'OFFLINE': '离线',
        'DATA_SERVICE_API': 'API',
        'OFFLINE_PIPELINE': '管道',
        'DATA_SERVICE_APP': '应用'
      };
      return labels[type] || type;
    }
  }
};
</script>

<style scoped>
.tree-node {
  margin: 4px 0;
}
.node-content {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.node-content:hover {
  background-color: #f5f5f5;
}
.node-content.entity {
  color: #333;
}
.node-content.package {
  color: #1890ff;
  font-weight: 500;
}
.expand-icon, .expand-placeholder {
  width: 16px;
  text-align: center;
  font-size: 12px;
  color: #999;
}
.expand-placeholder {
  width: 16px;
}
.node-icon {
  margin: 0 6px;
  font-size: 14px;
}
.node-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-badge {
  font-size: 10px;
  padding: 2px 6px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 10px;
  color: #1890ff;
  margin-left: 8px;
  white-space: nowrap;
}
.node-children {
  border-left: 1px dashed #e8e8e8;
  margin-left: 8px;
}
</style>
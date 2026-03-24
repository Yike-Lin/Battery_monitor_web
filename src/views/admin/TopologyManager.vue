<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <div class="head">
        <div>
          <div class="title">拓扑结构管理</div>
          <div class="muted">配置电池物理连接关系（簇-组-单体），用于统计接入总数</div>
        </div>

        <div class="kpis">
          <div class="kpi">
            <div class="kpi-label">簇</div>
            <div class="kpi-value">{{ clusterCount }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">组</div>
            <div class="kpi-value">{{ packCount }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">单体</div>
            <div class="kpi-value">{{ cellCount }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <div class="body">
      <el-card class="card left" shadow="never">
        <div class="section-title">拓扑树</div>

        <div class="tree-actions">
          <el-button size="small" type="primary" @click="addCluster">新增簇</el-button>
          <el-button size="small" @click="expandAll(true)">展开</el-button>
          <el-button size="small" @click="expandAll(false)">折叠</el-button>
        </div>

        <el-tree
          ref="treeRef"
          class="dark-tree"
          :data="treeData"
          node-key="key"
          default-expand-all
          :expand-on-click-node="false"
          :highlight-current="true"
          @current-change="onSelect"
        >
          <template #default="{ data }">
            <div class="node">
              <span class="node-label">{{ data.label }}</span>
              <span class="node-type muted">（{{ typeText(data.type) }}）</span>
            </div>
          </template>
        </el-tree>
      </el-card>

      <el-card class="card right" shadow="never">
        <div class="section-title">配置面板</div>

        <template v-if="current">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="类型">{{ typeText(current.type) }}</el-descriptions-item>
            <el-descriptions-item label="Key">{{ current.key }}</el-descriptions-item>
            <el-descriptions-item label="名称" :span="2">
              <el-input v-model="current.label" />
            </el-descriptions-item>
          </el-descriptions>

          <div class="panel-actions">
            <el-button
              v-if="current.type !== 'cell'"
              type="primary"
              @click="addChild(current)"
            >
              新增{{ current.type === 'cluster' ? '组' : '单体' }}
            </el-button>

            <el-button type="danger" @click="removeCurrent">删除当前节点</el-button>
            <el-button @click="saveTopology">保存配置</el-button>
          </div>

          <el-divider />

          <div class="muted">
            提示：这里是前端编辑结构的示例。接入后端时，建议以“簇/组/单体”的唯一 ID 作为 key，并保存 parentId/children。
          </div>
        </template>

        <template v-else>
          <div class="muted">请在左侧选择一个节点进行编辑。</div>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox, type ElTree } from 'element-plus'

type NodeType = 'cluster' | 'pack' | 'cell'
type TopoNode = {
  key: string
  type: NodeType
  label: string
  children?: TopoNode[]
}

const treeRef = ref<InstanceType<typeof ElTree>>()

const treeData = ref<TopoNode[]>([
  {
    key: 'C-01',
    type: 'cluster',
    label: '簇 01',
    children: [
      {
        key: 'P-0101',
        type: 'pack',
        label: '组 P-0101',
        children: Array.from({ length: 8 }).map((_, i) => ({
          key: `CELL-0101-${i + 1}`,
          type: 'cell',
          label: `单体 ${i + 1}`,
        })),
      },
    ],
  },
])

const current = ref<TopoNode | null>(null)

const clusterCount = computed(() => treeData.value.length)
const packCount = computed(() => countByType('pack', treeData.value))
const cellCount = computed(() => countByType('cell', treeData.value))

function countByType(type: NodeType, nodes: TopoNode[]): number {
  let count = 0
  for (const n of nodes) {
    if (n.type === type) count++
    if (n.children?.length) count += countByType(type, n.children)
  }
  return count
}

function typeText(t: NodeType) {
  return t === 'cluster' ? '簇' : t === 'pack' ? '组' : '单体'
}

function onSelect(node: TopoNode | null) {
  current.value = node
}

function uuid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function addCluster() {
  const n: TopoNode = { key: uuid('C'), type: 'cluster', label: '新簇', children: [] }
  treeData.value.push(n)
  ElMessage.success('已新增簇')
}

function addChild(parent: TopoNode) {
  if (!parent.children) parent.children = []
  if (parent.type === 'cluster') {
    parent.children.push({ key: uuid('P'), type: 'pack', label: '新组', children: [] })
  } else if (parent.type === 'pack') {
    parent.children.push({ key: uuid('CELL'), type: 'cell', label: '新单体' })
  }
  ElMessage.success('已新增节点')
}

async function removeCurrent() {
  if (!current.value) return
  await ElMessageBox.confirm(`确认删除 ${current.value.label}？`, '删除确认', { type: 'warning' })

  const key = current.value.key
  const removed = removeByKey(treeData.value, key)
  if (removed) {
    current.value = null
    ElMessage.success('已删除')
  }
}

function removeByKey(nodes: TopoNode[], key: string): boolean {
  const idx = nodes.findIndex(n => n.key === key)
  if (idx >= 0) {
    nodes.splice(idx, 1)
    return true
  }
  for (const n of nodes) {
    if (n.children?.length) {
      const ok = removeByKey(n.children, key)
      if (ok) return true
    }
  }
  return false
}

function expandAll(expand: boolean) {
  // Element Plus tree 没有直接 expandAll API，这里简单处理：重新渲染/或逐节点控制
  // 先做一个用户可用的方式：使用默认展开 + 手动点击，或你可补充遍历调用 store.nodesMap[key].expanded
  if (expand) {
    ElMessage.info('已默认展开（如需全量控制可补充 nodesMap.expanded）')
  } else {
    ElMessage.info('Element Plus Tree 折叠全量需遍历 nodesMap 控制 expanded')
  }
}

function saveTopology() {
  // 接后端：POST treeData
  console.log('topology payload:', JSON.stringify(treeData.value, null, 2))
  ElMessage.success('已保存（示例：控制台查看 payload）')
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 14px; }

.card {
  background: #141414;
  border: 1px solid #1f1f1f;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title { color: #fff; font-size: 16px; font-weight: 600; }
.muted { color: #7a7a7a; }

.kpis { display: flex; gap: 10px; }
.kpi {
  background: #101010;
  border: 1px solid #1f1f1f;
  padding: 10px 14px;
  border-radius: 8px;
  min-width: 90px;
}
.kpi-label { color: #7a7a7a; font-size: 12px; }
.kpi-value { color: #fff; font-size: 18px; font-weight: 700; margin-top: 4px; }

.body {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;
}

.section-title { color: #fff; font-weight: 600; margin-bottom: 10px; }

.tree-actions { display: flex; gap: 8px; margin-bottom: 10px; }

.node { display: flex; align-items: center; gap: 6px; }
.node-label { color: #cfd3dc; }
.node-type { font-size: 12px; }

.panel-actions { margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; }

:deep(.el-tree) { background: transparent; color: #cfd3dc; }
:deep(.el-tree-node__content:hover) { background: rgba(255,255,255,0.05); }
:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: rgba(58, 95, 80, 0.35);
}
</style>
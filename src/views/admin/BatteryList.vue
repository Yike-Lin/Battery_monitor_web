<template>
    <div class="battery-page">
      <!-- 顶部筛选 + 操作 -->
      <div class="bento-card toolbar-card">
        <div class="card-header">
          <div class="card-title">电池资产管理</div>
          <div class="toolbar-right">
            <el-button size="small" @click="handleReset">重置</el-button>
            <el-button type="primary" size="small" @click="openCreate">
              新增电池
            </el-button>
          </div>
        </div>
  
        <div class="toolbar-body">
          <el-form :inline="true" :model="searchForm" label-width="80">
            <el-form-item label="关键字">
              <el-input
                v-model="searchForm.keyword"
                placeholder="电池名称 / 编号 / 站点"
                clearable
                style="width: 220px"
              />
            </el-form-item>
  
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="全部"
                clearable
                style="width: 140px"
              >
                <el-option label="全部" value="all" />
                <el-option label="在线" value="online" />
                <el-option label="离线" value="offline" />
                <el-option label="告警" value="alarm" />
              </el-select>
            </el-form-item>
  
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
  
      <!-- 列表卡片 -->
      <div class="bento-card list-card">
        <div class="card-header">
          <div class="card-title">
            电池列表
            <span class="sub">共 {{ filteredData.length }} 组</span>
          </div>
          <span class="status-tag">实时同步</span>
        </div>
  
        <div class="apple-table-wrapper">
          <el-table
            :data="pagedData"
            v-loading="loading"
            stripe
            size="small"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="name" label="电池名称" min-width="150" />
            <el-table-column prop="station" label="所属站点" min-width="140" />
            <el-table-column prop="soc" label="SOC(%)" width="90" />
            <el-table-column prop="temperature" label="温度(℃)" width="90" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" effect="dark">
                  {{ renderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="最近上报时间" min-width="170" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="openEdit(row)"
                >
                  编辑
                </el-button>
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
  
          <div class="table-footer">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :page-size="pageSize"
              :current-page="currentPage"
              :total="filteredData.length"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
  
      <!-- 新增 / 编辑 弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogMode === 'create' ? '新增电池' : '编辑电池'"
        width="520px"
      >
        <el-form
          :model="editForm"
          label-width="90px"
          class="dialog-form"
        >
          <el-form-item label="电池名称">
            <el-input v-model="editForm.name" />
          </el-form-item>
          <el-form-item label="所属站点">
            <el-input v-model="editForm.station" />
          </el-form-item>
          <el-form-item label="SOC(%)">
            <el-input-number
              v-model="editForm.soc"
              :min="0"
              :max="100"
            />
          </el-form-item>
          <el-form-item label="温度(℃)">
            <el-input-number
              v-model="editForm.temperature"
              :min="-40"
              :max="120"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="editForm.status">
              <el-option label="在线" value="online" />
              <el-option label="离线" value="offline" />
              <el-option label="告警" value="alarm" />
            </el-select>
          </el-form-item>
        </el-form>
  
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="handleSubmit">
              保 存
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  type BatteryStatus = 'online' | 'offline' | 'alarm'
  
  interface Battery {
    id: number
    name: string
    station: string
    soc: number
    temperature: number
    status: BatteryStatus
    updatedAt: string
  }
  
  // 搜索条件
  const searchForm = reactive({
    keyword: '',
    status: 'all',
  })
  
  // 模拟数据（后面你可以换成后端接口返回的数据）
  const tableData = ref<Battery[]>([
    {
      id: 1,
      name: '电池组-001',
      station: '广州 · 白云站',
      soc: 87,
      temperature: 32.5,
      status: 'online',
      updatedAt: '2025-12-10 10:23:11',
    },
    {
      id: 2,
      name: '电池组-002',
      station: '佛山 · 南海站',
      soc: 45,
      temperature: 40.2,
      status: 'alarm',
      updatedAt: '2025-12-10 10:21:05',
    },
    {
      id: 3,
      name: '电池组-003',
      station: '广州 · 黄埔站',
      soc: 0,
      temperature: 25.0,
      status: 'offline',
      updatedAt: '2025-12-09 22:01:37',
    },
  ])
  
  const loading = ref(false)
  
  const pageSize = 10
  const currentPage = ref(1)
  
  const filteredData = computed(() => {
    const keyword = searchForm.keyword.trim().toLowerCase()
    return tableData.value.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.station.toLowerCase().includes(keyword) ||
        String(item.id).includes(keyword)
  
      const matchStatus =
        searchForm.status === 'all' || item.status === searchForm.status
  
      return matchKeyword && matchStatus
    })
  })
  
  const pagedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredData.value.slice(start, start + pageSize)
  })
  
  const handlePageChange = (page: number) => {
    currentPage.value = page
  }
  
  const handleSearch = () => {
    currentPage.value = 1
  }
  
  const handleReset = () => {
    searchForm.keyword = ''
    searchForm.status = 'all'
    currentPage.value = 1
  }
  
  const getStatusType = (status: BatteryStatus) => {
    if (status === 'online') return 'success'
    if (status === 'offline') return 'info'
    if (status === 'alarm') return 'danger'
    return 'info'
  }
  
  const renderStatusText = (status: BatteryStatus) => {
    if (status === 'online') return '在线'
    if (status === 'offline') return '离线'
    if (status === 'alarm') return '告警'
    return status
  }
  
  // 弹窗相关
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const editForm = reactive<Battery>({
    id: 0,
    name: '',
    station: '',
    soc: 50,
    temperature: 25,
    status: 'online',
    updatedAt: '',
  })
  
  const openCreate = () => {
    dialogMode.value = 'create'
    Object.assign(editForm, {
      id: 0,
      name: '',
      station: '',
      soc: 50,
      temperature: 25,
      status: 'online' as BatteryStatus,
      updatedAt: '',
    })
    dialogVisible.value = true
  }
  
  const openEdit = (row: Battery) => {
    dialogMode.value = 'edit'
    Object.assign(editForm, { ...row })
    dialogVisible.value = true
  }
  
  const handleSubmit = () => {
    if (!editForm.name) {
      ElMessage.warning('请填写电池名称')
      return
    }
  
    if (dialogMode.value === 'create') {
      const newId =
        tableData.value.length > 0
          ? Math.max(...tableData.value.map((i) => i.id)) + 1
          : 1
  
      tableData.value.push({
        ...editForm,
        id: newId,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      ElMessage.success('新增电池成功')
    } else {
      const idx = tableData.value.findIndex((i) => i.id === editForm.id)
      if (idx !== -1) {
        tableData.value[idx] = {
          ...editForm,
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }
        ElMessage.success('保存修改成功')
      }
    }
  
    dialogVisible.value = false
  }
  
  const handleDelete = (row: Battery) => {
    ElMessageBox.confirm(
      `确认删除电池「${row.name}」吗？`,
      '提示',
      {
        type: 'warning',
      },
    )
      .then(() => {
        tableData.value = tableData.value.filter((i) => i.id !== row.id)
        ElMessage.success('删除成功')
      })
      .catch(() => {})
  }
  </script>
  
  <style scoped>
  .battery-page {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  
  /* 工具栏卡片 */
  .toolbar-card {
    padding-bottom: 10px;
  }
  
  .toolbar-body {
    padding: 12px 16px 14px;
  }
  
  /* 列表卡片 */
  .list-card {
    display: flex;
    flex-direction: column;
  }
  
  .card-header .sub {
    font-size: 12px;
    margin-left: 6px;
    color: #86868b;
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .table-footer {
    padding: 10px 8px 6px;
    display: flex;
    justify-content: flex-end;
  }
  
  .dialog-form {
    padding-top: 8px;
  }
  </style>
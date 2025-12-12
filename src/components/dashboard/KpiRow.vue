<!-- 上面四个实时的KPI卡片 -->
<template>
    <div class="grid-row kpi-row">

      <div class="bento-card kpi-card" v-for="item in kpiList" :key="item.key">

        <div class="kpi-icon-bg">
          <span class="dot"></span>
        </div>

        <div class="kpi-content">
          <div class="kpi-label">{{ item.label }}</div>
          <div class="kpi-value-group">
            <span class="kpi-value">{{ item.value }}</span>
            <span class="kpi-unit" v-if="item.unit">{{ item.unit }}</span>
          </div>
          <div class="kpi-sub" :class="{ 'trend-up': item.trend > 0 }">
            {{ item.sub }}
          </div>
        </div>

      </div>
    </div>
  </template>

  <script setup lang="ts">
  interface KpiItem {
    key: string
    label: string
    value: string
    unit?: string
    sub: string
    trend: number
  }

  defineProps<{
    kpiList: KpiItem[]
  }>()
  </script>

  <style scoped>
  .grid-row {
    position: relative;
    gap: 16px;
  }

  .kpi-row {
    height: 115px;
  }

  .bento-card {
    background: rgba(30, 30, 30, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: #f5f5f7;
    transition: border-color 0.2s ease;
  }

  .bento-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }

  .kpi-card {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 26px
  }

  .kpi-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  }

  .kpi-label {
    font-size: 13px;
    color: #86868b;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .kpi-value-group {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .kpi-value {
    font-size: 28px;
    font-weight: 700;
    font-family: "SF Pro Display", -apple-system, sans-serif;
    color: #fff;
  }

  .kpi-unit {
    font-size: 13px;
    color: #86868b;
  }


  .kpi-sub {
    margin-top: 6px;
    font-size: 12px;
    color: #86868b;
  }

  .kpi-icon-bg .dot {
    width: 8px;
    height: 8px;
    background: #0a84ff;
    border-radius: 50%;
    display: block;
    box-shadow: 0 0 10px rgba(10, 132, 255, 0.5);
  }
  </style>

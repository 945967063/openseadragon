<template>
  <div class="app">
    <h1>Vue 3 WebRTC TileSource 示例</h1>
    
    <!-- 配置面板 -->
    <div class="config-panel">
      <h3>连接配置</h3>
      <div class="config-form">
        <div class="form-group">
          <label>WebSocket URL:</label>
          <input v-model="config.wsUrl" type="text" />
        </div>
        <div class="form-group">
          <label>实例 ID:</label>
          <input v-model="config.instanceId" type="text" />
        </div>
        <div class="form-group">
          <label>通道名称:</label>
          <input v-model="config.channelName" type="text" />
        </div>
      </div>
    </div>
    
    <!-- WebRTC TileViewer 组件 -->
    <WebRTCTileViewer
      ref="tileViewer"
      :ws-url="config.wsUrl"
      :instance-id="config.instanceId"
      :channel-name="config.channelName"
      :image-config="imageConfig"
      :viewer-config="viewerConfig"
      :request-timeout="10000"
      :show-controls="true"
      :auto-connect="false"
      @connected="onConnected"
      @disconnected="onDisconnected"
      @error="onError"
      @tile-request="onTileRequest"
      @tile-response="onTileResponse"
      @viewer-ready="onViewerReady"
    />
    
    <!-- 日志面板 -->
    <div class="log-panel">
      <h3>事件日志</h3>
      <div class="log-controls">
        <button @click="clearLogs" class="btn btn-sm">清空日志</button>
        <label>
          <input v-model="autoScroll" type="checkbox" />
          自动滚动
        </label>
      </div>
      <div ref="logContainer" class="log-container">
        <div
          v-for="(log, index) in logs"
          :key="index"
          :class="['log-item', `log-${log.type}`]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, watch } from 'vue'
import WebRTCTileViewer from './WebRTCTileViewer.vue'

// Refs
const tileViewer = ref(null)
const logContainer = ref(null)

// Reactive data
const config = reactive({
  wsUrl: 'ws://192.168.10.204:8810',
  instanceId: '202204071103',
  channelName: 'default_channel'
})

const imageConfig = reactive({
  width: 2048,
  height: 2048,
  tileSize: 256,
  tileOverlap: 0,
  minLevel: 0,
  maxLevel: 6
})

const viewerConfig = reactive({
  showNavigator: true,
  navigatorPosition: 'TOP_RIGHT',
  showRotationControl: false,
  showHomeControl: true,
  showZoomControl: true,
  showFullPageControl: true,
  animationTime: 0.5,
  blendTime: 0.1
})

const logs = ref([])
const autoScroll = ref(true)

// Methods
const addLog = (type, message) => {
  const log = {
    type,
    message,
    time: new Date().toLocaleTimeString()
  }
  
  logs.value.push(log)
  
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value.shift()
  }
  
  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  }
}

const clearLogs = () => {
  logs.value = []
}

// Event handlers
const onConnected = (sdpcRtc) => {
  addLog('success', '✅ SdpcRtc 连接成功')
  console.log('SdpcRtc 连接成功:', sdpcRtc)
}

const onDisconnected = () => {
  addLog('info', '🔌 SdpcRtc 连接已断开')
  console.log('SdpcRtc 连接已断开')
}

const onError = (error) => {
  addLog('error', `❌ 错误: ${error.message}`)
  console.error('WebRTC TileViewer 错误:', error)
}

const onTileRequest = (requestData) => {
  addLog('info', `📤 请求瓦片: L${requestData.Params.Level} X${requestData.Params.X} Y${requestData.Params.Y}`)
  console.log('瓦片请求:', requestData)
}

const onTileResponse = ({ responseData, request }) => {
  const duration = Date.now() - request.timestamp
  if (responseData.responseCode === 200) {
    addLog('success', `📥 瓦片响应成功: ${responseData.requestId} (${duration}ms)`)
  } else {
    addLog('error', `📥 瓦片响应失败: ${responseData.requestId} (${responseData.responseCode})`)
  }
  console.log('瓦片响应:', { responseData, request })
}

const onViewerReady = (viewer) => {
  addLog('success', '🎯 OpenSeadragon Viewer 初始化完成')
  console.log('OpenSeadragon Viewer 准备就绪:', viewer)
}

// 手动控制方法（可以通过按钮调用）
const manualConnect = () => {
  if (tileViewer.value) {
    tileViewer.value.connect()
  }
}

const manualDisconnect = () => {
  if (tileViewer.value) {
    tileViewer.value.disconnect()
  }
}

// 获取统计信息
const getStats = () => {
  if (tileViewer.value) {
    return tileViewer.value.stats
  }
  return null
}

// Watch config changes
watch(() => config.instanceId, (newId) => {
  addLog('info', `🔄 实例ID已更改: ${newId}`)
})

// 初始化日志
addLog('info', '🚀 Vue 3 WebRTC TileSource 示例已加载')
</script>

<style scoped>
.app {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.config-panel {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

.config-panel h3 {
  margin-top: 0;
  color: #495057;
}

.config-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #495057;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.log-panel {
  margin-top: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.log-panel h3 {
  margin: 0;
  padding: 15px 20px;
  background-color: #e9ecef;
  border-bottom: 1px solid #ddd;
  color: #495057;
}

.log-controls {
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #007bff;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn:hover {
  background-color: #0056b3;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.log-controls label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #495057;
}

.log-container {
  height: 300px;
  overflow-y: auto;
  background-color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  padding: 5px 20px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  gap: 10px;
}

.log-item:hover {
  background-color: #f8f9fa;
}

.log-time {
  color: #6c757d;
  min-width: 80px;
  font-weight: bold;
}

.log-message {
  flex: 1;
}

.log-success {
  border-left: 3px solid #28a745;
}

.log-error {
  border-left: 3px solid #dc3545;
  background-color: #fff5f5;
}

.log-info {
  border-left: 3px solid #17a2b8;
}

.log-warning {
  border-left: 3px solid #ffc107;
  background-color: #fffbf0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-form {
    grid-template-columns: 1fr;
  }
  
  .log-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style>

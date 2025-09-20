<template>
  <div class="simple-webrtc-viewer">
    <!-- 简单的控制面板 -->
    <div class="controls">
      <button 
        @click="handleConnect" 
        :disabled="isConnecting || isConnected"
        class="btn"
      >
        {{ isConnecting ? '连接中...' : '连接' }}
      </button>
      
      <button 
        @click="handleDisconnect" 
        :disabled="!isConnected"
        class="btn"
      >
        断开
      </button>
      
      <span class="status" :class="status">
        {{ statusText }}
      </span>
      
      <div class="stats" v-if="isConnected">
        请求: {{ stats.totalRequests }} | 
        成功: {{ stats.successCount }} | 
        失败: {{ stats.errorCount }} |
        成功率: {{ successRate }}%
      </div>
    </div>
    
    <!-- OpenSeadragon 容器 -->
    <div ref="viewerContainer" class="viewer-container"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import useWebRTCTileSource from './useWebRTCTileSource.js'

// Props
const props = defineProps({
  wsUrl: {
    type: String,
    default: 'ws://192.168.10.204:8810'
  },
  instanceId: {
    type: String,
    default: '202204071103'
  },
  channelName: {
    type: String,
    default: 'default_channel'
  },
  autoConnect: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'connected',
  'disconnected',
  'error',
  'viewer-ready'
])

// Refs
const viewerContainer = ref(null)

// 使用 WebRTC TileSource Composable
const {
  viewer,
  webrtcTileSource,
  sdpcRtc,
  isConnecting,
  isConnected,
  connectionError,
  stats,
  status,
  successRate,
  isReady,
  connect,
  disconnect,
  initializeViewer,
  setCallbacks
} = useWebRTCTileSource({
  wsUrl: props.wsUrl,
  instanceId: props.instanceId,
  channelName: props.channelName
})

// 计算属性
const statusText = computed(() => {
  switch (status.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中'
    case 'error': return '连接错误'
    default: return '未连接'
  }
})

// 方法
const handleConnect = async () => {
  try {
    await connect()
    await nextTick()
    
    if (viewerContainer.value) {
      await initializeViewer(viewerContainer.value)
    }
  } catch (error) {
    console.error('连接失败:', error)
  }
}

const handleDisconnect = () => {
  disconnect()
}

// 设置回调
setCallbacks({
  onConnected: (sdpcRtc) => {
    console.log('✅ 连接成功')
    emit('connected', sdpcRtc)
  },
  onDisconnected: () => {
    console.log('🔌 连接断开')
    emit('disconnected')
  },
  onError: (error) => {
    console.error('❌ 错误:', error)
    emit('error', error)
  },
  onTileRequest: (requestData) => {
    console.log('📤 瓦片请求:', requestData.Params)
  },
  onTileResponse: ({ responseData, request }) => {
    const duration = Date.now() - request.timestamp
    console.log(`📥 瓦片响应: ${responseData.requestId} (${duration}ms)`)
  },
  onViewerReady: (viewer) => {
    console.log('🎯 Viewer 准备就绪')
    emit('viewer-ready', viewer)
  }
})

// 生命周期
onMounted(() => {
  if (props.autoConnect) {
    handleConnect()
  }
})

// 暴露给父组件
defineExpose({
  viewer,
  webrtcTileSource,
  sdpcRtc,
  isConnected,
  stats,
  connect: handleConnect,
  disconnect: handleDisconnect
})
</script>

<style scoped>
.simple-webrtc-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status.connected {
  background-color: #d4edda;
  color: #155724;
}

.status.connecting {
  background-color: #fff3cd;
  color: #856404;
}

.status.error {
  background-color: #f8d7da;
  color: #721c24;
}

.status.disconnected {
  background-color: #e2e3e5;
  color: #6c757d;
}

.stats {
  font-size: 12px;
  color: #6c757d;
  margin-left: auto;
}

.viewer-container {
  flex: 1;
  min-height: 400px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats {
    margin-left: 0;
    text-align: center;
  }
}
</style>

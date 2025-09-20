<template>
  <div class="webrtc-tile-viewer">
    <div class="viewer-container">
      <div ref="viewerElement" class="osd-viewer"></div>
    </div>
    
    <div class="controls" v-if="showControls">
      <div class="status" :class="statusClass">
        状态: {{ status }}
      </div>
      
      <div class="connection-controls">
        <button 
          @click="connect" 
          :disabled="isConnecting || isConnected"
          class="btn btn-primary"
        >
          {{ isConnecting ? '连接中...' : '连接' }}
        </button>
        
        <button 
          @click="disconnect" 
          :disabled="!isConnected"
          class="btn btn-secondary"
        >
          断开连接
        </button>
      </div>
      
      <div class="stats" v-if="isConnected">
        <div class="stat-item">
          <span class="label">待处理请求:</span>
          <span class="value">{{ stats.pendingRequests }}</span>
        </div>
        <div class="stat-item">
          <span class="label">总请求数:</span>
          <span class="value">{{ stats.totalRequests }}</span>
        </div>
        <div class="stat-item">
          <span class="label">成功响应:</span>
          <span class="value">{{ stats.successCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">失败响应:</span>
          <span class="value">{{ stats.errorCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">成功率:</span>
          <span class="value">{{ successRate }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import OpenSeadragon from 'openseadragon'

// Props
const props = defineProps({
  // SdpcRtc 配置
  wsUrl: {
    type: String,
    default: 'ws://192.168.10.204:8810'
  },
  instanceId: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  
  // 图像配置
  imageConfig: {
    type: Object,
    default: () => ({
      width: 2048,
      height: 2048,
      tileSize: 256,
      tileOverlap: 0,
      minLevel: 0,
      maxLevel: 6
    })
  },
  
  // OpenSeadragon 配置
  viewerConfig: {
    type: Object,
    default: () => ({
      showNavigator: true,
      navigatorPosition: 'TOP_RIGHT',
      showRotationControl: false,
      showHomeControl: true,
      showZoomControl: true,
      showFullPageControl: true,
      animationTime: 0.5,
      blendTime: 0.1
    })
  },
  
  // 其他配置
  requestTimeout: {
    type: Number,
    default: 10000
  },
  showControls: {
    type: Boolean,
    default: true
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
  'tile-request',
  'tile-response',
  'viewer-ready'
])

// Refs
const viewerElement = ref(null)
const viewer = ref(null)
const webrtcTileSource = ref(null)
const sdpcRtc = ref(null)

// Reactive state
const isConnecting = ref(false)
const isConnected = ref(false)
const status = ref('未连接')

const stats = reactive({
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  pendingRequests: 0
})

// Computed
const statusClass = computed(() => {
  if (isConnected.value) return 'connected'
  if (isConnecting.value) return 'connecting'
  return 'disconnected'
})

const successRate = computed(() => {
  if (stats.totalRequests === 0) return 0
  return ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
})

// 模拟文件存储（实际使用时需要根据您的业务逻辑调整）
const files = reactive({})

// Methods
const connect = async () => {
  if (isConnecting.value || isConnected.value) return
  
  try {
    isConnecting.value = true
    status.value = '连接中...'
    
    // 这里需要替换为真实的 SdpcRtc 实例化
    // 目前使用模拟实现
    sdpcRtc.value = await createSdpcRtcInstance()
    
    // 设置接收回调
    sdpcRtc.value.receiveCallback = handleSdpcRtcMessage
    
    isConnected.value = true
    status.value = '已连接'
    
    // 初始化 OpenSeadragon viewer
    await initializeViewer()
    
    emit('connected', sdpcRtc.value)
    
  } catch (error) {
    console.error('连接失败:', error)
    status.value = '连接失败'
    emit('error', error)
  } finally {
    isConnecting.value = false
  }
}

const disconnect = () => {
  if (!isConnected.value) return
  
  try {
    // 清理 WebRTC TileSource
    if (webrtcTileSource.value) {
      webrtcTileSource.value.clearPendingRequests()
      webrtcTileSource.value = null
    }
    
    // 销毁 OpenSeadragon viewer
    if (viewer.value) {
      viewer.value.destroy()
      viewer.value = null
    }
    
    // 断开 SdpcRtc 连接
    if (sdpcRtc.value) {
      sdpcRtc.value.disconnect?.()
      sdpcRtc.value = null
    }
    
    isConnected.value = false
    status.value = '已断开'
    
    // 重置统计
    Object.assign(stats, {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      pendingRequests: 0
    })
    
    emit('disconnected')
    
  } catch (error) {
    console.error('断开连接时出错:', error)
    emit('error', error)
  }
}

// 创建 SdpcRtc 实例（需要根据实际情况实现）
const createSdpcRtcInstance = async () => {
  // 这里需要替换为真实的 SdpcRtc 实例化代码
  // 例如：
  // const sdpcRtc = new SdpcRtc(
  //   new SdpcRtcConfig(
  //     props.wsUrl,
  //     props.instanceId,
  //     SdpcRtcRole.Sqray
  //   )
  // )
  // await sdpcRtc.connect()
  // return sdpcRtc
  
  // 模拟实现
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        refreshSlice: (channelName, data) => {
          console.log('发送 refreshSlice:', data)
          // 模拟异步响应
          setTimeout(() => {
            const mockResponse = {
              data: JSON.stringify({
                data: {
                  requestId: `GetTile ${data.Params.Level} ${data.Params.X} ${data.Params.Y}`,
                  responseCode: 200,
                  resposeData: generateMockBase64()
                }
              })
            }
            handleSdpcRtcMessage(mockResponse)
          }, 100)
        },
        disconnect: () => console.log('SdpcRtc 断开连接')
      })
    }, 1000)
  })
}

// 处理 SdpcRtc 消息
const handleSdpcRtcMessage = (pack) => {
  try {
    const data = JSON.parse(pack.data)
    
    // 如果有 sliceId，需要读取切片
    if (data.data.sliceId) {
      files[data.data.sliceId] = { name: `tile_${data.data.sliceId}.jpg` }
      // 模拟读取切片完成
      setTimeout(() => {
        if (webrtcTileSource.value) {
          webrtcTileSource.value.handleResponse(data.data)
        }
      }, 50)
    } else if (webrtcTileSource.value) {
      // 直接处理响应
      webrtcTileSource.value.handleResponse(data.data)
    }
  } catch (error) {
    console.error('处理 SdpcRtc 消息失败:', error)
    emit('error', error)
  }
}

// 初始化 OpenSeadragon viewer
const initializeViewer = async () => {
  await nextTick()
  
  if (!viewerElement.value) {
    throw new Error('Viewer element not found')
  }
  
  // 创建 TileSource 配置
  const tileSourceConfig = {
    type: 'webrtc',
    ...props.imageConfig,
    sdpcId: props.instanceId,
    requestTimeout: props.requestTimeout,
    sdpcRtc: sdpcRtc.value,
    channelName: props.channelName,
    onRequest: handleTileRequest,
    onResponse: handleTileResponse,
    onError: handleTileError
  }
  
  // 创建 OpenSeadragon viewer
  viewer.value = OpenSeadragon({
    element: viewerElement.value,
    prefixUrl: '/openseadragon/images/', // 根据您的项目调整路径
    ...props.viewerConfig
  })
  
  // 添加 WebRTC TileSource
  viewer.value.addTiledImage({
    tileSource: tileSourceConfig,
    success: (event) => {
      webrtcTileSource.value = event.item.source
      console.log('WebRTC TileSource 加载成功')
      emit('viewer-ready', viewer.value)
    },
    error: (event) => {
      console.error('WebRTC TileSource 加载失败:', event.message)
      emit('error', new Error('WebRTC TileSource 加载失败: ' + event.message))
    }
  })
}

// 瓦片请求处理
const handleTileRequest = (requestData) => {
  stats.totalRequests++
  emit('tile-request', requestData)
}

// 瓦片响应处理
const handleTileResponse = (responseData, request) => {
  if (responseData.responseCode === 200) {
    stats.successCount++
  } else {
    stats.errorCount++
  }
  
  // 更新待处理请求数
  if (webrtcTileSource.value) {
    stats.pendingRequests = webrtcTileSource.value.getPendingRequestCount()
  }
  
  emit('tile-response', { responseData, request })
}

// 瓦片错误处理
const handleTileError = (error) => {
  stats.errorCount++
  console.error('瓦片错误:', error)
  emit('error', new Error('瓦片错误: ' + error))
}

// 生成模拟 base64 数据
const generateMockBase64 = () => {
  // 简单的模拟实现
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
}

// 定期更新统计信息
let statsInterval = null

// Lifecycle
onMounted(() => {
  // 定期更新待处理请求数
  statsInterval = setInterval(() => {
    if (webrtcTileSource.value) {
      stats.pendingRequests = webrtcTileSource.value.getPendingRequestCount()
    }
  }, 1000)
  
  // 自动连接
  if (props.autoConnect) {
    connect()
  }
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
  disconnect()
})

// Watch props changes
watch(() => props.instanceId, () => {
  if (isConnected.value) {
    disconnect()
  }
})

// 暴露方法给父组件
defineExpose({
  connect,
  disconnect,
  viewer,
  webrtcTileSource,
  sdpcRtc,
  isConnected,
  stats
})
</script>

<style scoped>
.webrtc-tile-viewer {
  display: flex;
  gap: 20px;
  height: 100%;
}

.viewer-container {
  flex: 1;
  min-height: 400px;
}

.osd-viewer {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.controls {
  width: 300px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.status {
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
}

.status.connected {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status.connecting {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.connection-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.stats {
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.label {
  color: #666;
}

.value {
  font-weight: bold;
  color: #333;
}
</style>

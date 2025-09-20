# Vue 3 WebRTC TileSource 集成指南

## 📦 文件说明

- `WebRTCTileViewer.vue` - 完整的 WebRTC TileSource Vue 组件
- `SimpleWebRTCViewer.vue` - 简化版本的 Vue 组件
- `useWebRTCTileSource.js` - Vue 3 Composable，提供响应式状态管理
- `Vue3-Usage-Example.vue` - 完整的使用示例

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install openseadragon
# 或
yarn add openseadragon
```

### 2. 引入 WebRTC TileSource 组件

```javascript
// 确保已引入 webrtc-tilesource.js
import './webrtc-tilesource.js'
```

### 3. 基本使用

#### 方式一：使用完整组件

```vue
<template>
  <div class="app">
    <WebRTCTileViewer
      :ws-url="'ws://192.168.10.204:8810'"
      :instance-id="'202204071103'"
      :channel-name="'default_channel'"
      :auto-connect="true"
      @connected="onConnected"
      @viewer-ready="onViewerReady"
    />
  </div>
</template>

<script setup>
import WebRTCTileViewer from './WebRTCTileViewer.vue'

const onConnected = (sdpcRtc) => {
  console.log('SdpcRtc 连接成功:', sdpcRtc)
}

const onViewerReady = (viewer) => {
  console.log('OpenSeadragon Viewer 准备就绪:', viewer)
}
</script>
```

#### 方式二：使用 Composable

```vue
<template>
  <div class="app">
    <div class="controls">
      <button @click="connect" :disabled="isConnecting || isConnected">
        {{ isConnecting ? '连接中...' : '连接' }}
      </button>
      <button @click="disconnect" :disabled="!isConnected">
        断开连接
      </button>
      <span>状态: {{ status }}</span>
    </div>
    
    <div ref="viewerContainer" class="viewer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import useWebRTCTileSource from './useWebRTCTileSource.js'

const viewerContainer = ref(null)

const {
  isConnecting,
  isConnected,
  status,
  stats,
  connect,
  disconnect,
  initializeViewer,
  setCallbacks
} = useWebRTCTileSource({
  wsUrl: 'ws://192.168.10.204:8810',
  instanceId: '202204071103',
  channelName: 'default_channel'
})

// 设置回调
setCallbacks({
  onConnected: async () => {
    await initializeViewer(viewerContainer.value)
  },
  onError: (error) => {
    console.error('错误:', error)
  }
})
</script>
```

## ⚙️ 组件 Props

### WebRTCTileViewer Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `wsUrl` | String | `'ws://192.168.10.204:8810'` | WebSocket URL |
| `instanceId` | String | 必需 | SdpcRtc 实例ID |
| `channelName` | String | 必需 | SdpcRtc 通道名称 |
| `imageConfig` | Object | 见下方 | 图像配置 |
| `viewerConfig` | Object | 见下方 | OpenSeadragon 配置 |
| `requestTimeout` | Number | `10000` | 请求超时时间(毫秒) |
| `showControls` | Boolean | `true` | 是否显示控制面板 |
| `autoConnect` | Boolean | `false` | 是否自动连接 |

### 默认 imageConfig

```javascript
{
  width: 2048,
  height: 2048,
  tileSize: 256,
  tileOverlap: 0,
  minLevel: 0,
  maxLevel: 6
}
```

### 默认 viewerConfig

```javascript
{
  showNavigator: true,
  navigatorPosition: 'TOP_RIGHT',
  showRotationControl: false,
  showHomeControl: true,
  showZoomControl: true,
  showFullPageControl: true,
  animationTime: 0.5,
  blendTime: 0.1
}
```

## 📡 组件事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `connected` | `sdpcRtc` | SdpcRtc 连接成功 |
| `disconnected` | - | SdpcRtc 连接断开 |
| `error` | `error` | 发生错误 |
| `tile-request` | `requestData` | 发送瓦片请求 |
| `tile-response` | `{responseData, request}` | 收到瓦片响应 |
| `viewer-ready` | `viewer` | OpenSeadragon Viewer 准备就绪 |

## 🔧 Composable API

### useWebRTCTileSource(options)

#### 返回值

```javascript
const {
  // 响应式状态
  viewer,              // OpenSeadragon viewer 实例
  webrtcTileSource,    // WebRTC TileSource 实例
  sdpcRtc,            // SdpcRtc 实例
  isConnecting,       // 是否正在连接
  isConnected,        // 是否已连接
  connectionError,    // 连接错误
  stats,              // 统计信息
  status,             // 连接状态 ('connected'|'connecting'|'error'|'disconnected')
  successRate,        // 成功率
  isReady,            // 是否准备就绪

  // 方法
  connect,            // 连接方法
  disconnect,         // 断开连接方法
  initializeViewer,   // 初始化 viewer 方法
  setCallbacks,       // 设置回调方法
  updateConfig        // 更新配置方法
} = useWebRTCTileSource(options)
```

#### 统计信息 (stats)

```javascript
{
  totalRequests: 0,      // 总请求数
  successCount: 0,       // 成功响应数
  errorCount: 0,         // 失败响应数
  pendingRequests: 0,    // 待处理请求数
  connectionTime: null,  // 连接时间
  lastRequestTime: null, // 最后请求时间
  lastResponseTime: null // 最后响应时间
}
```

## 🔄 集成真实的 SdpcRtc

要集成真实的 SdpcRtc，需要修改 `createSdpcRtcInstance` 方法：

```javascript
// 在 useWebRTCTileSource.js 中
const createSdpcRtcInstance = async () => {
  // 替换为真实的 SdpcRtc 实例化
  const sdpcRtc = new SdpcRtc(
    new SdpcRtcConfig(
      config.wsUrl,
      config.instanceId,
      SdpcRtcRole.Sqray
    )
  )
  
  // 等待连接建立
  await new Promise((resolve, reject) => {
    sdpcRtc.onConnected = resolve
    sdpcRtc.onError = reject
    sdpcRtc.connect()
  })
  
  return sdpcRtc
}
```

## 📝 完整示例

```vue
<template>
  <div class="medical-viewer">
    <h1>医学影像 WebRTC 查看器</h1>
    
    <!-- 配置面板 -->
    <div class="config">
      <input v-model="instanceId" placeholder="实例ID" />
      <input v-model="channelName" placeholder="通道名称" />
    </div>
    
    <!-- WebRTC TileViewer -->
    <WebRTCTileViewer
      ref="tileViewer"
      :instance-id="instanceId"
      :channel-name="channelName"
      :image-config="imageConfig"
      :show-controls="true"
      @connected="handleConnected"
      @error="handleError"
      @tile-response="handleTileResponse"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import WebRTCTileViewer from './WebRTCTileViewer.vue'

const tileViewer = ref(null)
const instanceId = ref('202204071103')
const channelName = ref('medical_channel')

const imageConfig = reactive({
  width: 4096,
  height: 4096,
  tileSize: 512,
  maxLevel: 8
})

const handleConnected = (sdpcRtc) => {
  console.log('医学影像系统连接成功')
}

const handleError = (error) => {
  console.error('连接错误:', error)
  // 显示错误提示
}

const handleTileResponse = ({ responseData, request }) => {
  // 处理瓦片响应，可以添加自定义逻辑
  console.log('瓦片加载完成:', responseData.requestId)
}

// 手动控制
const manualConnect = () => {
  tileViewer.value?.connect()
}

const getViewerStats = () => {
  return tileViewer.value?.stats
}
</script>
```

## 🎯 最佳实践

1. **错误处理**: 始终监听 `error` 事件并提供用户友好的错误提示
2. **加载状态**: 使用 `isConnecting` 状态显示加载指示器
3. **资源清理**: 组件销毁时会自动清理资源，无需手动处理
4. **响应式配置**: 使用 `updateConfig` 方法动态更新配置
5. **性能监控**: 利用 `stats` 对象监控瓦片加载性能

## 🔍 调试技巧

1. 监听所有事件来了解组件状态变化
2. 使用浏览器开发者工具查看 WebRTC 连接状态
3. 检查 `stats` 对象来分析性能问题
4. 使用 `console.log` 在回调函数中输出调试信息

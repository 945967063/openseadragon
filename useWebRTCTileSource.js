/**
 * Vue 3 Composable for WebRTC TileSource
 * 
 * 提供 WebRTC TileSource 的响应式状态管理和方法
 */

import { ref, reactive, computed, onUnmounted } from 'vue'
import OpenSeadragon from 'openseadragon'

export function useWebRTCTileSource(options = {}) {
  // 默认配置
  const defaultConfig = {
    wsUrl: 'ws://192.168.10.204:8810',
    instanceId: '202204071103',
    channelName: 'default_channel',
    requestTimeout: 10000,
    imageConfig: {
      width: 2048,
      height: 2048,
      tileSize: 256,
      tileOverlap: 0,
      minLevel: 0,
      maxLevel: 6
    },
    viewerConfig: {
      showNavigator: true,
      navigatorPosition: 'TOP_RIGHT',
      showRotationControl: false,
      showHomeControl: true,
      showZoomControl: true,
      showFullPageControl: true,
      animationTime: 0.5,
      blendTime: 0.1
    }
  }

  // 合并配置
  const config = reactive({ ...defaultConfig, ...options })

  // 响应式状态
  const viewer = ref(null)
  const webrtcTileSource = ref(null)
  const sdpcRtc = ref(null)
  const isConnecting = ref(false)
  const isConnected = ref(false)
  const connectionError = ref(null)

  // 统计信息
  const stats = reactive({
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    pendingRequests: 0,
    connectionTime: null,
    lastRequestTime: null,
    lastResponseTime: null
  })

  // 事件回调
  const callbacks = reactive({
    onConnected: null,
    onDisconnected: null,
    onError: null,
    onTileRequest: null,
    onTileResponse: null,
    onViewerReady: null
  })

  // 模拟文件存储
  const files = reactive({})

  // 计算属性
  const status = computed(() => {
    if (isConnected.value) return 'connected'
    if (isConnecting.value) return 'connecting'
    if (connectionError.value) return 'error'
    return 'disconnected'
  })

  const successRate = computed(() => {
    if (stats.totalRequests === 0) return 0
    return ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
  })

  const isReady = computed(() => {
    return isConnected.value && viewer.value && webrtcTileSource.value
  })

  // 方法
  const connect = async () => {
    if (isConnecting.value || isConnected.value) return

    try {
      isConnecting.value = true
      connectionError.value = null
      stats.connectionTime = Date.now()

      // 创建 SdpcRtc 实例
      sdpcRtc.value = await createSdpcRtcInstance()
      
      // 设置接收回调
      sdpcRtc.value.receiveCallback = handleSdpcRtcMessage

      isConnected.value = true
      
      // 触发连接成功回调
      if (callbacks.onConnected) {
        callbacks.onConnected(sdpcRtc.value)
      }

      return sdpcRtc.value

    } catch (error) {
      connectionError.value = error
      isConnected.value = false
      
      if (callbacks.onError) {
        callbacks.onError(error)
      }
      
      throw error
    } finally {
      isConnecting.value = false
    }
  }

  const disconnect = () => {
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
      connectionError.value = null

      // 重置统计
      Object.assign(stats, {
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        pendingRequests: 0,
        connectionTime: null,
        lastRequestTime: null,
        lastResponseTime: null
      })

      // 触发断开连接回调
      if (callbacks.onDisconnected) {
        callbacks.onDisconnected()
      }

    } catch (error) {
      if (callbacks.onError) {
        callbacks.onError(error)
      }
      throw error
    }
  }

  const initializeViewer = async (element) => {
    if (!element) {
      throw new Error('Viewer element is required')
    }

    if (!isConnected.value || !sdpcRtc.value) {
      throw new Error('SdpcRtc not connected')
    }

    // 创建 TileSource 配置
    const tileSourceConfig = {
      type: 'webrtc',
      ...config.imageConfig,
      sdpcId: config.instanceId,
      requestTimeout: config.requestTimeout,
      sdpcRtc: sdpcRtc.value,
      channelName: config.channelName,
      onRequest: handleTileRequest,
      onResponse: handleTileResponse,
      onError: handleTileError
    }

    // 创建 OpenSeadragon viewer
    viewer.value = OpenSeadragon({
      element: element,
      prefixUrl: '/openseadragon/images/', // 根据项目调整
      ...config.viewerConfig
    })

    // 添加 WebRTC TileSource
    return new Promise((resolve, reject) => {
      viewer.value.addTiledImage({
        tileSource: tileSourceConfig,
        success: (event) => {
          webrtcTileSource.value = event.item.source
          
          if (callbacks.onViewerReady) {
            callbacks.onViewerReady(viewer.value)
          }
          
          resolve(viewer.value)
        },
        error: (event) => {
          const error = new Error('WebRTC TileSource 加载失败: ' + event.message)
          
          if (callbacks.onError) {
            callbacks.onError(error)
          }
          
          reject(error)
        }
      })
    })
  }

  // 创建 SdpcRtc 实例（需要根据实际情况实现）
  const createSdpcRtcInstance = async () => {
    // 这里需要替换为真实的 SdpcRtc 实例化代码
    // 例如：
    // const sdpcRtc = new SdpcRtc(
    //   new SdpcRtcConfig(
    //     config.wsUrl,
    //     config.instanceId,
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
            }, 50 + Math.random() * 200)
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
      if (callbacks.onError) {
        callbacks.onError(error)
      }
    }
  }

  // 瓦片请求处理
  const handleTileRequest = (requestData) => {
    stats.totalRequests++
    stats.lastRequestTime = Date.now()
    
    if (callbacks.onTileRequest) {
      callbacks.onTileRequest(requestData)
    }
  }

  // 瓦片响应处理
  const handleTileResponse = (responseData, request) => {
    stats.lastResponseTime = Date.now()
    
    if (responseData.responseCode === 200) {
      stats.successCount++
    } else {
      stats.errorCount++
    }

    // 更新待处理请求数
    if (webrtcTileSource.value) {
      stats.pendingRequests = webrtcTileSource.value.getPendingRequestCount()
    }

    if (callbacks.onTileResponse) {
      callbacks.onTileResponse({ responseData, request })
    }
  }

  // 瓦片错误处理
  const handleTileError = (error) => {
    stats.errorCount++
    console.error('瓦片错误:', error)
    
    if (callbacks.onError) {
      callbacks.onError(new Error('瓦片错误: ' + error))
    }
  }

  // 生成模拟 base64 数据
  const generateMockBase64 = () => {
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }

  // 设置回调函数
  const setCallbacks = (newCallbacks) => {
    Object.assign(callbacks, newCallbacks)
  }

  // 更新配置
  const updateConfig = (newConfig) => {
    Object.assign(config, newConfig)
  }

  // 清理资源
  onUnmounted(() => {
    disconnect()
  })

  // 返回响应式状态和方法
  return {
    // 状态
    viewer,
    webrtcTileSource,
    sdpcRtc,
    isConnecting,
    isConnected,
    connectionError,
    stats,
    config,
    status,
    successRate,
    isReady,

    // 方法
    connect,
    disconnect,
    initializeViewer,
    setCallbacks,
    updateConfig,

    // 内部方法（可选暴露）
    handleSdpcRtcMessage,
    handleTileRequest,
    handleTileResponse,
    handleTileError
  }
}

export default useWebRTCTileSource

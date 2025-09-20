# WebRTC TileSource 组件使用指南

## 📦 组件介绍

`webrtc-tilesource.js` 是一个独立的 OpenSeadragon TileSource 组件，专门用于通过 WebRTC 数据通道获取瓦片数据。

## 🚀 快速开始

### 1. 引入组件

```html
<!-- 先引入 OpenSeadragon -->
<script src="build/openseadragon/openseadragon.js"></script>
<!-- 再引入 WebRTC TileSource 组件 -->
<script src="webrtc-tilesource.js"></script>
```

### 2. 基本使用

#### 方式一：使用 SdpcRtc（推荐）

```javascript
// 创建 SdpcRtc 实例
const sdpcRtc = new SdpcRtc(
  new SdpcRtcConfig(
    "ws://192.168.10.204:8810",
    "202204071103",
    SdpcRtcRole.Sqray
  )
);

// 设置接收回调
sdpcRtc.receiveCallback = (pack) => {
  const data = JSON.parse(pack.data);

  // 如果有 sliceId，需要读取切片
  if (data.data.sliceId) {
    sdpcRtc.readSlice(files[data.data.sliceId], data);
  } else if (webrtcTileSource) {
    // 直接处理响应
    webrtcTileSource.handleResponse(data.data);
  }
};

// 配置 TileSource
const tileSourceConfig = {
  type: "webrtc",
  width: 2048,
  height: 2048,
  tileSize: 256,
  minLevel: 0,
  maxLevel: 6,
  sdpcId: "your_instance_id",
  sdpcRtc: sdpcRtc,
  channelName: "your_channel_name",
  onRequest: function (requestData) {
    console.log("发送请求:", requestData);
  },
  onResponse: function (responseData, request) {
    console.log("收到响应:", responseData);
  },
  onError: function (error) {
    console.error("发生错误:", error);
  },
};

// 创建 OpenSeadragon viewer
const viewer = OpenSeadragon({
  id: "viewer-container",
  prefixUrl: "build/openseadragon/images/",
});

// 添加 WebRTC TileSource
let webrtcTileSource = null;
viewer.addTiledImage({
  tileSource: tileSourceConfig,
  success: function (event) {
    webrtcTileSource = event.item.source;
    console.log("WebRTC TileSource 加载成功");
  },
});
```

#### 方式二：使用标准 WebRTC DataChannel

```javascript
// 创建 WebRTC 数据通道
const dataChannel = peerConnection.createDataChannel("tiles");

// 配置 TileSource（保持向后兼容）
const tileSourceConfig = {
  type: "webrtc",
  width: 2048,
  height: 2048,
  tileSize: 256,
  minLevel: 0,
  maxLevel: 6,
  sdpcId: "your_instance_id",
  dataChannel: dataChannel, // 使用标准 DataChannel
  onRequest: function (requestData) {
    console.log("发送请求:", requestData);
  },
  onResponse: function (responseData, request) {
    console.log("收到响应:", responseData);
  },
  onError: function (error) {
    console.error("发生错误:", error);
  },
};
```

## ⚙️ 配置选项

| 参数             | 类型           | 默认值                | 说明                             |
| ---------------- | -------------- | --------------------- | -------------------------------- |
| `type`           | string         | -                     | 必须设置为 'webrtc'              |
| `width`          | number         | 2048                  | 图像宽度                         |
| `height`         | number         | 2048                  | 图像高度                         |
| `tileSize`       | number         | 256                   | 瓦片大小                         |
| `tileOverlap`    | number         | 0                     | 瓦片重叠像素                     |
| `minLevel`       | number         | 0                     | 最小缩放级别                     |
| `maxLevel`       | number         | 6                     | 最大缩放级别                     |
| `sdpcId`         | string         | 'default_instance_id' | 实例 ID                          |
| `requestTimeout` | number         | 10000                 | 请求超时时间(毫秒)               |
| `sdpcRtc`        | Object         | null                  | SdpcRtc 实例（推荐）             |
| `channelName`    | string         | null                  | SdpcRtc 通道名称                 |
| `dataChannel`    | RTCDataChannel | null                  | 标准 WebRTC 数据通道（向后兼容） |
| `onRequest`      | Function       | null                  | 请求发送回调                     |
| `onResponse`     | Function       | null                  | 响应接收回调                     |
| `onError`        | Function       | null                  | 错误处理回调                     |

## 📡 数据格式

### 发送请求格式

```javascript
{
    RequestId: "unique_request_id",
    Method: "GetTile",
    Params: {
        IdNo: "instance_id",
        Level: 1,
        X: 0,
        Y: 0,
        ColorMd5: ""
    }
}
```

### 接收响应格式

```javascript
{
    requestId: "GetTile 1 0 0",
    responseCode: 200,
    resposeData: "/9j/4AAQSKZJRgABAQAAA0ABAAD..." // base64 图片数据
}
```

## 🔧 API 方法

### setSdpcRtc(sdpcRtc, channelName)

设置或更新 SdpcRtc 实例和通道名称

```javascript
webrtcTileSource.setSdpcRtc(sdpcRtcInstance, "channel_name");
```

### handleResponse(responseData)

处理从 SdpcRtc 接收到的响应数据

```javascript
// 在 SdpcRtc 接收回调中调用
sdpcRtc.receiveCallback = (pack) => {
  const data = JSON.parse(pack.data);

  // 如果有 sliceId，需要读取切片
  if (data.data.sliceId) {
    sdpcRtc.readSlice(files[data.data.sliceId], data);
  } else if (webrtcTileSource) {
    // 直接处理响应
    webrtcTileSource.handleResponse(data.data);
  }
};
```

### getPendingRequestCount()

获取当前待处理的请求数量

```javascript
const count = webrtcTileSource.getPendingRequestCount();
```

### clearPendingRequests()

清理所有待处理的请求

```javascript
webrtcTileSource.clearPendingRequests();
```

## 📝 完整示例

```javascript
// 1. 建立 WebRTC 连接
const peerConnection = new RTCPeerConnection();
const dataChannel = peerConnection.createDataChannel("tiles");

// 2. 处理数据通道事件
dataChannel.onopen = function () {
  console.log("数据通道已打开");
};

dataChannel.onmessage = function (event) {
  const responseData = JSON.parse(event.data);
  if (webrtcTileSource) {
    webrtcTileSource.handleResponse(responseData);
  }
};

// 3. 创建 TileSource 配置
const config = {
  type: "webrtc",
  width: 4096,
  height: 4096,
  tileSize: 512,
  maxLevel: 8,
  sdpcId: "my_instance_123",
  dataChannel: dataChannel,
  requestTimeout: 15000,
  onRequest: function (data) {
    console.log("请求:", data.Params);
  },
  onResponse: function (response, request) {
    console.log(
      `响应: ${response.requestId}, 耗时: ${Date.now() - request.timestamp}ms`
    );
  },
  onError: function (error) {
    console.error("错误:", error);
  },
};

// 4. 创建 viewer 并添加 TileSource
const viewer = OpenSeadragon({
  id: "my-viewer",
  prefixUrl: "path/to/openseadragon/images/",
});

let webrtcTileSource = null;

viewer.addTiledImage({
  tileSource: config,
  success: function (event) {
    webrtcTileSource = event.item.source;
    console.log("WebRTC TileSource 初始化完成");
  },
  error: function (event) {
    console.error("TileSource 加载失败:", event.message);
  },
});
```

## 🔍 调试和监控

组件提供了丰富的回调函数用于监控和调试：

```javascript
const config = {
  // ... 其他配置
  onRequest: function (requestData) {
    console.log("📤 发送请求:", {
      method: requestData.Method,
      level: requestData.Params.Level,
      x: requestData.Params.X,
      y: requestData.Params.Y,
      requestId: requestData.RequestId,
    });
  },
  onResponse: function (responseData, request) {
    const duration = Date.now() - request.timestamp;
    console.log("📥 收到响应:", {
      requestId: responseData.requestId,
      responseCode: responseData.responseCode,
      duration: duration + "ms",
      dataSize: responseData.resposeData ? responseData.resposeData.length : 0,
    });
  },
  onError: function (error) {
    console.error("❌ 错误:", error);
  },
};
```

## 🚨 注意事项

1. **数据通道状态**: 确保 WebRTC 数据通道处于 'open' 状态
2. **响应格式**: 响应中的 `requestId` 格式必须是 "GetTile Level X Y"
3. **Base64 处理**: 组件会自动处理 base64 数据的格式转换
4. **错误处理**: 建议实现 `onError` 回调来处理各种错误情况
5. **内存管理**: 在不需要时调用 `clearPendingRequests()` 清理资源

## 📄 文件说明

- `webrtc-tilesource.js` - 核心组件文件
- `webrtc-component-demo.html` - 完整的使用示例
- `WebRTC-Component-Usage.md` - 本使用说明文档

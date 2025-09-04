# WebGL 颜色调节功能

OpenSeadragon 现在支持在使用 WebGL 渲染器时进行实时颜色调节。此功能允许您动态调整伽马、对比度、亮度和 RGB 通道，以改善图像可视化效果。

## 功能特性

- **实时颜色调节** - 使用 WebGL 着色器进行 GPU 加速处理
- **分层控制** - 每个图像层可以有独立的颜色设置
- **全局设置** - 对所有图像应用颜色调节
- **导航器同步** - 导航器会自动同步主视图的颜色调节效果
- **算法匹配** - 与传统 Canvas 2D 颜色处理算法完全一致
- **高性能优化** - GPU 加速处理，响应迅速
- **跨浏览器兼容** - 支持所有 WebGL 兼容的浏览器

## 支持的调节参数

| 参数              | 范围       | 默认值 | 说明                                       |
| ----------------- | ---------- | ------ | ------------------------------------------ |
| 伽马 (Gamma)      | 0.0 - 5.0  | 1.0    | 伽马校正，调整亮度曲线                     |
| 对比度 (Contrast) | -100 - 100 | 0      | 对比度调节，负值降低对比度，正值增强对比度 |
| 亮度 (Brightness) | -255 - 255 | 0      | 亮度调节，负值变暗，正值变亮               |
| 红色通道 (Red)    | -100 - 100 | 0      | 红色通道强度调节                           |
| 绿色通道 (Green)  | -100 - 100 | 0      | 绿色通道强度调节                           |
| 蓝色通道 (Blue)   | -100 - 100 | 0      | 蓝色通道强度调节                           |

## 使用方法

### 前提条件

颜色调节功能需要使用 WebGL 渲染器：

```javascript
const viewer = new OpenSeadragon({
  id: "viewer",
  drawer: "webgl", // 必须启用 WebGL 渲染器
  tileSources: "path/to/your/image.dzi",
});
```

### 全局颜色调节

对查看器中的所有图像应用颜色调节：

```javascript
// 设置颜色调节参数
viewer.drawer.setColorAdjustments({
  gamma: 1.2, // 伽马校正
  contrast: 20, // 增加 20% 对比度
  brightness: 30, // 增加 30 点亮度
  r: 10, // 增强红色通道 10%
  g: 0, // 绿色通道不变
  b: -5, // 减弱蓝色通道 5%
});

// 获取当前调节参数
const adjustments = viewer.drawer.getColorAdjustments();
console.log(adjustments);

// 重置为默认值
viewer.drawer.resetColorAdjustments();
```

### 单个图像层颜色调节

为不同的 TiledImage 图层应用不同的颜色调节：

```javascript
viewer.addHandler("open", function () {
  const tiledImage = viewer.world.getItemAt(0);

  // 为特定图像设置颜色调节
  tiledImage.setColorAdjustments({
    gamma: 0.8, // 降低伽马值
    contrast: 30, // 增加对比度
    brightness: -20, // 降低亮度
  });

  // 获取该图像的调节参数
  const adjustments = tiledImage.getColorAdjustments();

  // 重置为使用渲染器默认值
  tiledImage.resetColorAdjustments();
});
```

### 事件监听

监听颜色调节变化事件：

```javascript
// 全局渲染器事件
viewer.drawer.addHandler("color-adjustments-change", function (event) {
  console.log("渲染器颜色调节已更改:", event.colorAdjustments);
});

// 单个图像事件
tiledImage.addHandler("color-adjustments-change", function (event) {
  console.log("图像颜色调节已更改:", event.colorAdjustments);
});
```

## 实现原理

### 着色器实现

颜色调节在 WebGL 片段着色器中实现，完全匹配传统 Canvas 2D 算法，处理顺序如下：

1. **伽马校正**: 使用幂函数调整亮度曲线，模拟伽马查找表
2. **对比度**: 围绕 128 中点进行线性缩放（而非 0.5）
3. **亮度**: 在 0-255 范围内直接加减像素值
4. **RGB 通道**: 分别调整红、绿、蓝通道强度，使用百分比乘法

这种实现确保了 WebGL 版本与 Canvas 2D 版本产生完全相同的视觉效果。

### 性能考虑

- 颜色调节由 GPU 加速，处理速度极快
- 参数更新会触发查看器重绘
- 导航器会自动同步主视图的颜色调节，无需额外配置
- 建议批量设置多个参数以获得更好性能
- 系统在有颜色调节时自动使用双通道渲染

### 浏览器兼容性

- 需要 WebGL 支持（所有现代浏览器都支持）
- 已在 Chrome、Firefox、Safari 和 Edge 上测试
- 支持 WebGL 的移动浏览器也兼容

## 演示示例

查看交互式演示：`test/demo/webgl-color-adjustment.html`

## API 参考

### WebGLDrawer 方法

#### `setColorAdjustments(adjustments)`

- **adjustments** (Object): 颜色调节参数对象
- 为所有图像设置全局颜色调节

#### `getColorAdjustments()`

- **返回值** (Object): 当前颜色调节参数

#### `resetColorAdjustments()`

- 重置所有颜色调节为默认值

### TiledImage 方法

#### `setColorAdjustments(adjustments)`

- **adjustments** (Object): 颜色调节参数对象
- 为特定图像层设置颜色调节

#### `getColorAdjustments()`

- **返回值** (Object|null): 当前颜色调节参数，如果使用渲染器默认值则返回 null

#### `resetColorAdjustments()`

- 重置为使用渲染器默认颜色调节

## 使用示例

### 基础用法

```javascript
const viewer = new OpenSeadragon({
  id: "viewer",
  drawer: "webgl",
  tileSources: "image.dzi",
});

viewer.addHandler("open", function () {
  // 让图像更亮更有对比度
  viewer.drawer.setColorAdjustments({
    brightness: 40,
    contrast: 25,
  });
});
```

### 交互式控制

```javascript
// 创建滑块进行实时调节
function createBrightnessSlider() {
  const slider = document.getElementById("brightness-slider");
  slider.addEventListener("input", function () {
    const value = parseInt(this.value);
    viewer.drawer.setColorAdjustments({ brightness: value });
  });
}
```

### 多图像不同设置

```javascript
viewer.addHandler("open", function () {
  // 背景图像 - 稍微降低亮度
  const background = viewer.world.getItemAt(0);
  background.setColorAdjustments({
    brightness: -30,
    contrast: -10,
  });

  // 添加覆盖图像并增强颜色
  viewer.addTiledImage({
    tileSource: "overlay.dzi",
    success: function (event) {
      event.item.setColorAdjustments({
        contrast: 40,
        r: 15,
        g: 10,
        b: 5,
      });
    },
  });
});
```

## 常见问题

### 颜色调节不生效

- 确保 WebGL 渲染器已激活：`viewer.drawer.getType() === 'webgl'`
- 检查浏览器 WebGL 支持
- 查看控制台是否有 JavaScript 错误

### 性能问题

- 避免频繁更新（> 60fps）
- 在单次调用中批量设置多个参数
- 考虑对滑块更新进行防抖处理

### 颜色异常

- 检查参数范围（值会自动限制在有效范围内）
- 伽马值小于 1.0 会变亮，大于 1.0 会变暗
- RGB 通道值：负值减弱该颜色，正值增强该颜色

## 预设效果示例

```javascript
// 复古效果
viewer.drawer.setColorAdjustments({
  gamma: 1.2,
  contrast: 15,
  brightness: 20,
  r: 10,
  g: 5,
  b: -5,
});

// 高对比度
viewer.drawer.setColorAdjustments({
  gamma: 0.9,
  contrast: 50,
  brightness: 0,
  r: 0,
  g: 0,
  b: 0,
});

// 暖色调
viewer.drawer.setColorAdjustments({
  gamma: 1.0,
  contrast: 10,
  brightness: 15,
  r: 15,
  g: 5,
  b: -10,
});

// 冷色调
viewer.drawer.setColorAdjustments({
  gamma: 1.0,
  contrast: 10,
  brightness: -10,
  r: -10,
  g: 5,
  b: 15,
});
```

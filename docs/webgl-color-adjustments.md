# WebGL Color Adjustments

OpenSeadragon now supports real-time color adjustments when using the WebGL drawer. This feature allows you to dynamically adjust brightness, contrast, saturation, hue, and gamma correction for improved image visualization.

## Features

- **Real-time color adjustments** using WebGL shaders
- **Per-image layer control** - each TiledImage can have independent color settings
- **Global drawer settings** - apply color adjustments to all images
- **Performance optimized** - GPU-accelerated processing
- **Cross-browser compatible** - works on all WebGL-supported browsers

## Supported Adjustments

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Brightness | -1.0 to 1.0 | 0.0 | Makes image darker (negative) or brighter (positive) |
| Contrast | 0.0 to 2.0 | 1.0 | Adjusts contrast (0.0 = no contrast, 2.0 = high contrast) |
| Saturation | 0.0 to 2.0 | 1.0 | Controls color saturation (0.0 = grayscale, 2.0 = vivid) |
| Hue | -1.0 to 1.0 | 0.0 | Shifts hue (-1.0 = -180°, 1.0 = +180°) |
| Gamma | 0.1 to 3.0 | 1.0 | Gamma correction for brightness curve |

## Usage

### Prerequisites

Color adjustments require the WebGL drawer:

```javascript
const viewer = new OpenSeadragon({
    id: 'viewer',
    drawer: 'webgl', // Required for color adjustments
    tileSources: 'path/to/your/image.dzi'
});
```

### Global Color Adjustments

Apply color adjustments to all images in the viewer:

```javascript
// Set color adjustments
viewer.drawer.setColorAdjustments({
    brightness: 0.2,    // 20% brighter
    contrast: 1.3,      // 30% more contrast
    saturation: 1.1,    // 10% more saturated
    hue: 0.1,          // Slight warm shift
    gamma: 1.2         // Gamma correction
});

// Get current adjustments
const adjustments = viewer.drawer.getColorAdjustments();
console.log(adjustments);

// Reset to defaults
viewer.drawer.resetColorAdjustments();
```

### Per-Image Color Adjustments

Apply different color adjustments to individual TiledImage layers:

```javascript
viewer.addHandler('open', function() {
    const tiledImage = viewer.world.getItemAt(0);
    
    // Set color adjustments for this specific image
    tiledImage.setColorAdjustments({
        brightness: -0.1,   // Slightly darker
        contrast: 1.5,      // Higher contrast
        saturation: 0.8     // Less saturated
    });
    
    // Get adjustments for this image
    const adjustments = tiledImage.getColorAdjustments();
    
    // Reset to use drawer defaults
    tiledImage.resetColorAdjustments();
});
```

### Events

Listen for color adjustment changes:

```javascript
// Global drawer events
viewer.drawer.addHandler('color-adjustments-change', function(event) {
    console.log('Drawer color adjustments changed:', event.colorAdjustments);
});

// Per-image events
tiledImage.addHandler('color-adjustments-change', function(event) {
    console.log('TiledImage color adjustments changed:', event.colorAdjustments);
});
```

## Implementation Details

### Shader Implementation

Color adjustments are implemented in the WebGL fragment shader using:

1. **Brightness**: Simple addition to RGB values
2. **Contrast**: Linear scaling around midpoint (0.5)
3. **Gamma**: Power function for brightness curve adjustment
4. **Saturation & Hue**: RGB to HSV conversion, adjustment, and back to RGB

### Performance Considerations

- Color adjustments are GPU-accelerated and very fast
- Updates trigger a redraw of the viewer
- Batch multiple adjustments in a single call for better performance
- The system automatically uses two-pass rendering when color adjustments are active

### Browser Compatibility

- Requires WebGL support (available in all modern browsers)
- Tested on Chrome, Firefox, Safari, and Edge
- Mobile browsers with WebGL support are also compatible

## Demo

See the interactive demo at `test/demo/webgl-color-adjustment.html` for a complete example with UI controls.

## API Reference

### WebGLDrawer Methods

#### `setColorAdjustments(adjustments)`
- **adjustments** (Object): Color adjustment parameters
- Sets global color adjustments for all images

#### `getColorAdjustments()`
- **Returns** (Object): Current color adjustment values

#### `resetColorAdjustments()`
- Resets all color adjustments to default values

### TiledImage Methods

#### `setColorAdjustments(adjustments)`
- **adjustments** (Object): Color adjustment parameters
- Sets color adjustments for this specific image layer

#### `getColorAdjustments()`
- **Returns** (Object|null): Current color adjustments, or null if using drawer defaults

#### `resetColorAdjustments()`
- Resets to use drawer default color adjustments

## Examples

### Basic Usage

```javascript
const viewer = new OpenSeadragon({
    id: 'viewer',
    drawer: 'webgl',
    tileSources: 'image.dzi'
});

viewer.addHandler('open', function() {
    // Make image brighter and more contrasty
    viewer.drawer.setColorAdjustments({
        brightness: 0.15,
        contrast: 1.25
    });
});
```

### Interactive Controls

```javascript
// Create sliders for real-time adjustment
function createBrightnessSlider() {
    const slider = document.getElementById('brightness-slider');
    slider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        viewer.drawer.setColorAdjustments({ brightness: value });
    });
}
```

### Multiple Images with Different Settings

```javascript
viewer.addHandler('open', function() {
    // Background image - slightly desaturated
    const background = viewer.world.getItemAt(0);
    background.setColorAdjustments({
        saturation: 0.7,
        brightness: -0.1
    });
    
    // Add overlay image with enhanced colors
    viewer.addTiledImage({
        tileSource: 'overlay.dzi',
        success: function(event) {
            event.item.setColorAdjustments({
                saturation: 1.3,
                contrast: 1.2
            });
        }
    });
});
```

## Troubleshooting

### Color adjustments not working
- Ensure WebGL drawer is active: `viewer.drawer.getType() === 'webgl'`
- Check browser WebGL support
- Verify no JavaScript errors in console

### Performance issues
- Avoid frequent updates (> 60fps)
- Batch multiple adjustments in single call
- Consider debouncing slider updates

### Unexpected colors
- Check parameter ranges (values are clamped automatically)
- Gamma values below 1.0 brighten, above 1.0 darken
- Hue values: -1.0 = -180°, 1.0 = +180°

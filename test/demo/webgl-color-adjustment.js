/**
 * OpenSeadragon WebGL Color Adjustment Demo
 * Demonstrates real-time color adjustment using WebGL shaders
 */

// Initialize the viewer
const viewer = window.viewer = new OpenSeadragon({
    id: 'openseadragon',
    prefixUrl: '/build/openseadragon/images/',
    tileSources: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    crossOriginPolicy: 'Anonymous',
    drawer: 'webgl', // Force WebGL drawer
    showNavigator: true,
    navigatorPosition: 'BOTTOM_RIGHT',
    navigatorSizeRatio: 0.15,
    gestureSettingsMouse: {
        clickToZoom: false
    }
});

// Color adjustment state
let colorAdjustments = {
    gamma: 1.0,
    contrast: 0.0,
    brightness: 0.0,
    r: 0.0,
    g: 0.0,
    b: 0.0
};

// Initialize sliders
function initializeSliders() {
    // Gamma slider (0.0 to 5.0)
    $('#gamma-slider').slider({
        min: 0.0,
        max: 5.0,
        step: 0.01,
        value: 1.0,
        slide: function (event, ui) {
            colorAdjustments.gamma = ui.value;
            $('#gamma-value').text(ui.value.toFixed(2));
            updateColorAdjustments();
        }
    });

    // Contrast slider (-100 to 100)
    $('#contrast-slider').slider({
        min: -100,
        max: 100,
        step: 1,
        value: 0,
        slide: function (event, ui) {
            colorAdjustments.contrast = ui.value;
            $('#contrast-value').text(ui.value.toString());
            updateColorAdjustments();
        }
    });

    // Brightness slider (-255 to 255)
    $('#brightness-slider').slider({
        min: -255,
        max: 255,
        step: 1,
        value: 0,
        slide: function (event, ui) {
            colorAdjustments.brightness = ui.value;
            $('#brightness-value').text(ui.value.toString());
            updateColorAdjustments();
        }
    });

    // Red channel slider (-100 to 100)
    $('#r-slider').slider({
        min: -100,
        max: 100,
        step: 1,
        value: 0,
        slide: function (event, ui) {
            colorAdjustments.r = ui.value;
            $('#r-value').text(ui.value.toString());
            updateColorAdjustments();
        }
    });

    // Green channel slider (-100 to 100)
    $('#g-slider').slider({
        min: -100,
        max: 100,
        step: 1,
        value: 0,
        slide: function (event, ui) {
            colorAdjustments.g = ui.value;
            $('#g-value').text(ui.value.toString());
            updateColorAdjustments();
        }
    });

    // Blue channel slider (-100 to 100)
    $('#b-slider').slider({
        min: -100,
        max: 100,
        step: 1,
        value: 0,
        slide: function (event, ui) {
            colorAdjustments.b = ui.value;
            $('#b-value').text(ui.value.toString());
            updateColorAdjustments();
        }
    });
}

// Update color adjustments in the viewer
function updateColorAdjustments() {
    console.log('Attempting to update color adjustments:', colorAdjustments);
    if (viewer.drawer && viewer.drawer.setColorAdjustments) {
        viewer.drawer.setColorAdjustments(colorAdjustments);
        console.log('Color adjustments applied successfully');

        // Verify the values were set
        const currentAdjustments = viewer.drawer.getColorAdjustments();
        console.log('Current adjustments after update:', currentAdjustments);

        // Check if navigator also got the adjustments
        if (viewer.navigator && viewer.navigator.drawer) {
            const navigatorAdjustments = viewer.navigator.drawer.getColorAdjustments();
            console.log('Navigator adjustments:', navigatorAdjustments);
        }
    } else {
        console.warn('Cannot update color adjustments - drawer or method not available');
    }
}

// Reset all adjustments to default values
function resetAdjustments() {
    colorAdjustments = {
        gamma: 1.0,
        contrast: 0.0,
        brightness: 0.0,
        r: 0.0,
        g: 0.0,
        b: 0.0
    };

    // Update sliders
    $('#gamma-slider').slider('value', 1.0);
    $('#gamma-value').text('1.00');

    $('#contrast-slider').slider('value', 0);
    $('#contrast-value').text('0');

    $('#brightness-slider').slider('value', 0);
    $('#brightness-value').text('0');

    $('#r-slider').slider('value', 0);
    $('#r-value').text('0');

    $('#g-slider').slider('value', 0);
    $('#g-value').text('0');

    $('#b-slider').slider('value', 0);
    $('#b-value').text('0');

    updateColorAdjustments();
}

// Apply a preset configuration
function applyPreset() {
    const presets = [
        {
            name: 'Vintage',
            gamma: 1.2,
            contrast: 15,
            brightness: 20,
            r: 10,
            g: 5,
            b: -5
        },
        {
            name: 'High Contrast',
            gamma: 0.9,
            contrast: 50,
            brightness: 0,
            r: 0,
            g: 0,
            b: 0
        },
        {
            name: 'Warm',
            gamma: 1.0,
            contrast: 10,
            brightness: 15,
            r: 15,
            g: 5,
            b: -10
        },
        {
            name: 'Cool',
            gamma: 1.0,
            contrast: 10,
            brightness: -10,
            r: -10,
            g: 5,
            b: 15
        }
    ];

    // Cycle through presets
    const currentPresetIndex = window.currentPresetIndex || 0;
    const preset = presets[currentPresetIndex];
    window.currentPresetIndex = (currentPresetIndex + 1) % presets.length;

    // Apply preset values
    colorAdjustments = Object.assign({}, preset);
    delete colorAdjustments.name;

    // Update sliders
    $('#gamma-slider').slider('value', preset.gamma);
    $('#gamma-value').text(preset.gamma.toFixed(2));

    $('#contrast-slider').slider('value', preset.contrast);
    $('#contrast-value').text(preset.contrast.toString());

    $('#brightness-slider').slider('value', preset.brightness);
    $('#brightness-value').text(preset.brightness.toString());

    $('#r-slider').slider('value', preset.r);
    $('#r-value').text(preset.r.toString());

    $('#g-slider').slider('value', preset.g);
    $('#g-value').text(preset.g.toString());

    $('#b-slider').slider('value', preset.b);
    $('#b-value').text(preset.b.toString());

    updateColorAdjustments();

    // Show preset name briefly
    const presetBtn = $('#preset-btn');
    const originalText = presetBtn.text();
    presetBtn.text(`Applied: ${preset.name}`);
    setTimeout(() => {
        presetBtn.text(originalText);
    }, 2000);
}

// Handle image selection
function handleImageSelection() {
    $('#image-select').on('change', function () {
        const selectedSource = $(this).val();
        viewer.open(selectedSource);
    });
}

// Initialize everything when the page loads
$(document).ready(function () {
    initializeSliders();
    handleImageSelection();

    // Button event handlers
    $('#reset-btn').on('click', resetAdjustments);
    $('#preset-btn').on('click', applyPreset);

    // Wait for viewer to be ready before enabling color adjustments
    viewer.addHandler('open', function () {
        // Small delay to ensure WebGL drawer is fully initialized
        setTimeout(() => {
            if (viewer.drawer && viewer.drawer.getType && viewer.drawer.getType() === 'webgl') {
                console.log('WebGL drawer detected, color adjustments enabled');
                console.log('Drawer methods available:', {
                    setColorAdjustments: typeof viewer.drawer.setColorAdjustments,
                    getColorAdjustments: typeof viewer.drawer.getColorAdjustments,
                    resetColorAdjustments: typeof viewer.drawer.resetColorAdjustments
                });

                // Performance and compatibility check
                performCompatibilityCheck();
                updateColorAdjustments();
            } else {
                console.warn('WebGL drawer not available, color adjustments disabled');
                console.log('Current drawer type:', viewer.drawer ? viewer.drawer.getType() : 'none');
                $('.controls').prepend('<div style="background-color: #e74c3c; color: white; padding: 10px; margin-bottom: 20px; border-radius: 4px;"><strong>Warning:</strong> WebGL drawer not available. Color adjustments require WebGL support.</div>');
            }
        }, 500); // Increased delay to ensure full initialization
    });

    // Performance and compatibility check
    function performCompatibilityCheck() {
        const gl = viewer.drawer._gl;
        if (!gl) {
            console.warn('WebGL context not available');
            return;
        }

        // Check WebGL capabilities
        const info = {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
            maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
        };

        console.log('WebGL Compatibility Info:', info);

        // Performance test: measure time for color adjustment updates
        const startTime = performance.now();
        for (let i = 0; i < 100; i++) {
            viewer.drawer.setColorAdjustments({
                brightness: Math.random() * 0.2 - 0.1,
                contrast: 1.0 + Math.random() * 0.2 - 0.1,
                saturation: 1.0 + Math.random() * 0.2 - 0.1,
                hue: Math.random() * 0.2 - 0.1,
                gamma: 1.0 + Math.random() * 0.2 - 0.1
            });
        }
        const endTime = performance.now();

        // Reset to defaults
        viewer.drawer.resetColorAdjustments();

        const avgTime = (endTime - startTime) / 100;
        console.log(`Performance: Average color adjustment update time: ${avgTime.toFixed(2)}ms`);

        if (avgTime > 5) {
            console.warn('Color adjustment updates are slow, consider reducing update frequency');
        }

        // Add performance info to UI
        $('.info-panel').append(`
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #bdc3c7;">
                <h4>System Info</h4>
                <p><strong>GPU:</strong> ${info.renderer}</p>
                <p><strong>WebGL Version:</strong> ${info.version}</p>
                <p><strong>Performance:</strong> ${avgTime.toFixed(2)}ms avg update time</p>
            </div>
        `);
    }
});

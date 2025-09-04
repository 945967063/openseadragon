/* global QUnit, $, Util, testLog */

(function() {
    let viewer;

    // Only test WebGL drawer since color adjustments are WebGL-specific
    QUnit.module('Color Adjustments - WebGL', {
        beforeEach: function () {
            $('<div id="example"></div>').appendTo("#qunit-fixture");
            testLog.reset();
        },
        afterEach: function () {
            if (viewer){
                viewer.destroy();
            }
            viewer = null;
        }
    });

    // ----------
    const createViewer = function(options) {
        options = options || {};
        // eslint-disable-next-line new-cap
        viewer = OpenSeadragon(OpenSeadragon.extend({
            id:            'example',
            prefixUrl:     '/build/openseadragon/images/',
            springStiffness: 100, // Faster animation = faster tests
            drawer: 'webgl',
        }, options));
    };

    // ----------
    QUnit.test('WebGL drawer color adjustment API exists', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            assert.ok(viewer.drawer, 'Drawer exists');
            assert.equal(viewer.drawer.getType(), 'webgl', 'WebGL drawer is active');
            assert.ok(typeof viewer.drawer.setColorAdjustments === 'function', 'setColorAdjustments method exists');
            assert.ok(typeof viewer.drawer.getColorAdjustments === 'function', 'getColorAdjustments method exists');
            assert.ok(typeof viewer.drawer.resetColorAdjustments === 'function', 'resetColorAdjustments method exists');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('Default color adjustment values', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            const adjustments = viewer.drawer.getColorAdjustments();
            assert.equal(adjustments.brightness, 0.0, 'Default brightness is 0.0');
            assert.equal(adjustments.contrast, 1.0, 'Default contrast is 1.0');
            assert.equal(adjustments.saturation, 1.0, 'Default saturation is 1.0');
            assert.equal(adjustments.hue, 0.0, 'Default hue is 0.0');
            assert.equal(adjustments.gamma, 1.0, 'Default gamma is 1.0');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('Set and get color adjustments', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            const testAdjustments = {
                brightness: 0.5,
                contrast: 1.5,
                saturation: 0.8,
                hue: 0.2,
                gamma: 1.2
            };
            
            viewer.drawer.setColorAdjustments(testAdjustments);
            const retrievedAdjustments = viewer.drawer.getColorAdjustments();
            
            assert.equal(retrievedAdjustments.brightness, 0.5, 'Brightness set correctly');
            assert.equal(retrievedAdjustments.contrast, 1.5, 'Contrast set correctly');
            assert.equal(retrievedAdjustments.saturation, 0.8, 'Saturation set correctly');
            assert.equal(retrievedAdjustments.hue, 0.2, 'Hue set correctly');
            assert.equal(retrievedAdjustments.gamma, 1.2, 'Gamma set correctly');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('Color adjustment value clamping', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            // Test out-of-range values
            viewer.drawer.setColorAdjustments({
                brightness: -2.0, // Should clamp to -1.0
                contrast: 5.0,    // Should clamp to 2.0
                saturation: -1.0, // Should clamp to 0.0
                hue: 2.0,         // Should clamp to 1.0
                gamma: 0.05       // Should clamp to 0.1
            });
            
            const adjustments = viewer.drawer.getColorAdjustments();
            assert.equal(adjustments.brightness, -1.0, 'Brightness clamped to minimum');
            assert.equal(adjustments.contrast, 2.0, 'Contrast clamped to maximum');
            assert.equal(adjustments.saturation, 0.0, 'Saturation clamped to minimum');
            assert.equal(adjustments.hue, 1.0, 'Hue clamped to maximum');
            assert.equal(adjustments.gamma, 0.1, 'Gamma clamped to minimum');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('Reset color adjustments', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            // Set some non-default values
            viewer.drawer.setColorAdjustments({
                brightness: 0.5,
                contrast: 1.5,
                saturation: 0.8,
                hue: 0.2,
                gamma: 1.2
            });
            
            // Reset to defaults
            viewer.drawer.resetColorAdjustments();
            const adjustments = viewer.drawer.getColorAdjustments();
            
            assert.equal(adjustments.brightness, 0.0, 'Brightness reset to default');
            assert.equal(adjustments.contrast, 1.0, 'Contrast reset to default');
            assert.equal(adjustments.saturation, 1.0, 'Saturation reset to default');
            assert.equal(adjustments.hue, 0.0, 'Hue reset to default');
            assert.equal(adjustments.gamma, 1.0, 'Gamma reset to default');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('TiledImage color adjustment API exists', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            const tiledImage = viewer.world.getItemAt(0);
            assert.ok(typeof tiledImage.setColorAdjustments === 'function', 'TiledImage setColorAdjustments method exists');
            assert.ok(typeof tiledImage.getColorAdjustments === 'function', 'TiledImage getColorAdjustments method exists');
            assert.ok(typeof tiledImage.resetColorAdjustments === 'function', 'TiledImage resetColorAdjustments method exists');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('TiledImage color adjustments default to null', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            const tiledImage = viewer.world.getItemAt(0);
            const adjustments = tiledImage.getColorAdjustments();
            assert.equal(adjustments, null, 'TiledImage color adjustments default to null (use drawer defaults)');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('TiledImage color adjustments set and get', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            const tiledImage = viewer.world.getItemAt(0);
            const testAdjustments = {
                brightness: 0.3,
                contrast: 1.2,
                saturation: 0.9,
                hue: 0.1,
                gamma: 1.1
            };
            
            tiledImage.setColorAdjustments(testAdjustments);
            const retrievedAdjustments = tiledImage.getColorAdjustments();
            
            assert.equal(retrievedAdjustments.brightness, 0.3, 'TiledImage brightness set correctly');
            assert.equal(retrievedAdjustments.contrast, 1.2, 'TiledImage contrast set correctly');
            assert.equal(retrievedAdjustments.saturation, 0.9, 'TiledImage saturation set correctly');
            assert.equal(retrievedAdjustments.hue, 0.1, 'TiledImage hue set correctly');
            assert.equal(retrievedAdjustments.gamma, 1.1, 'TiledImage gamma set correctly');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('TiledImage color adjustments reset', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            const tiledImage = viewer.world.getItemAt(0);
            
            // Set some values
            tiledImage.setColorAdjustments({
                brightness: 0.5,
                contrast: 1.5
            });
            
            // Reset
            tiledImage.resetColorAdjustments();
            const adjustments = tiledImage.getColorAdjustments();
            
            assert.equal(adjustments, null, 'TiledImage color adjustments reset to null');
            done();
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    QUnit.test('TiledImage color adjustment events', function(assert) {
        const done = assert.async();
        createViewer();
        
        viewer.addHandler('open', function() {
            const tiledImage = viewer.world.getItemAt(0);
            let eventFired = false;
            
            tiledImage.addHandler('color-adjustments-change', function(event) {
                eventFired = true;
                assert.ok(event.colorAdjustments, 'Event contains color adjustments');
                assert.equal(event.colorAdjustments.brightness, 0.2, 'Event has correct brightness value');
            });
            
            tiledImage.setColorAdjustments({ brightness: 0.2 });
            
            setTimeout(function() {
                assert.ok(eventFired, 'color-adjustments-change event was fired');
                done();
            }, 100);
        });
        
        viewer.open('/test/data/testpattern.dzi');
    });

})();

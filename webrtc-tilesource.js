/**
 * OpenSeadragon WebRTC TileSource Component
 *
 * 用于通过 WebRTC 数据通道获取瓦片数据的 OpenSeadragon TileSource 组件
 *
 * @author Your Name
 * @version 1.0.0
 */

(function (OpenSeadragon) {
    'use strict';

    if (!OpenSeadragon) {
        console.error('OpenSeadragon WebRTC TileSource requires OpenSeadragon');
        return;
    }

    /**
     * WebRTC TileSource 构造函数
     * @param {Object} options 配置选项
     * @param {string} options.sdpcId 实例ID
     * @param {number} [options.requestTimeout=10000] 请求超时时间(毫秒)
     * @param {Object} [options.sdpcRtc] SdpcRtc 实例
     * @param {string} [options.channelName] 通道名称
     * @param {Function} [options.onRequest] 请求发送回调
     * @param {Function} [options.onResponse] 响应接收回调
     * @param {Function} [options.onError] 错误处理回调
     */
    OpenSeadragon.WebRTCTileSource = function (options) {
        OpenSeadragon.TileSource.apply(this, [options]);

        // 基本配置
        this.sdpcId = options.sdpcId || 'default_instance_id';
        this.requestTimeout = options.requestTimeout || 10000;
        this.sdpcRtc = options.sdpcRtc || null;
        this.channelName = options.channelName || null;

        // 回调函数
        this.onRequest = options.onRequest || null;
        this.onResponse = options.onResponse || null;
        this.onError = options.onError || null;

        // 内部状态
        this.pendingRequests = new Map();
        this.requestCounter = 0;
        this.method = {
            GetTile: 'GetTile'
        };
    };

    // 继承 TileSource
    OpenSeadragon.extend(OpenSeadragon.WebRTCTileSource.prototype, OpenSeadragon.TileSource.prototype, {

        /**
         * 判断是否支持该数据源
         */
        supports: function (data, url) {
            return data && data.type === 'webrtc';
        },

        /**
         * 配置瓦片源
         */
        configure: function (data, url, postData) {
            return {
                width: data.width || 2048,
                height: data.height || 2048,
                tileSize: data.tileSize || 256,
                tileOverlap: data.tileOverlap || 0,
                minLevel: data.minLevel || 0,
                maxLevel: data.maxLevel || 6,
                sdpcId: data.sdpcId || this.sdpcId,
                requestTimeout: data.requestTimeout || this.requestTimeout,
                sdpcRtc: data.sdpcRtc || this.sdpcRtc,
                channelName: data.channelName || this.channelName,
                onRequest: data.onRequest || this.onRequest,
                onResponse: data.onResponse || this.onResponse,
                onError: data.onError || this.onError
            };
        },

        /**
         * 获取瓦片URL（实际上是标识符）
         */
        getTileUrl: function (level, x, y) {
            return `webrtc://tile/${level}/${x}/${y}`;
        },

        /**
         * 开始下载瓦片
         */
        downloadTileStart: function (context) {
            if (!this.sdpcRtc || !this.channelName) {
                const error = 'SdpcRtc instance or channel name not available';
                context.fail(error);
                this._triggerError(error);
                return;
            }

            const tileCoords = this._parseTileUrl(context.src);
            if (!tileCoords) {
                const error = 'Invalid tile URL format';
                context.fail(error);
                this._triggerError(error);
                return;
            }

            const { level, x, y } = tileCoords;
            const requestId = this._generateRequestId();

            // 设置超时
            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                const error = `Request timeout: ${requestId}`;
                context.fail(error);
                this._triggerError(error);
            }, this.requestTimeout);

            // 存储请求
            this.pendingRequests.set(requestId, {
                context: context,
                timeoutId: timeoutId,
                level: level,
                x: x,
                y: y,
                timestamp: Date.now()
            });

            // 发送 SdpcRtc 请求
            this._sendSdpcRtcRequest(level, x, y, requestId);
        },

        /**
         * 中止下载
         */
        downloadTileAbort: function (context) {
            for (const [requestId, request] of this.pendingRequests) {
                if (request.context === context) {
                    clearTimeout(request.timeoutId);
                    this.pendingRequests.delete(requestId);
                    break;
                }
            }
        },

        /**
         * 设置 SdpcRtc 实例和通道名称
         */
        setSdpcRtc: function (sdpcRtc, channelName) {
            this.sdpcRtc = sdpcRtc;
            this.channelName = channelName;
        },

        /**
         * 处理 WebRTC 响应
         */
        handleResponse: function (responseData) {
            const { requestId, responseCode, resposeData, error } = responseData;

            // 查找对应的请求
            let foundRequest = null;
            let foundRequestId = null;

            for (const [originalRequestId, request] of this.pendingRequests) {
                const expectedResponseId = `GetTile ${request.level} ${request.x} ${request.y}`;
                if (requestId === expectedResponseId) {
                    foundRequest = request;
                    foundRequestId = originalRequestId;
                    break;
                }
            }

            if (!foundRequest) {
                this._triggerError(`Unknown response: ${requestId}`);
                return;
            }

            clearTimeout(foundRequest.timeoutId);
            this.pendingRequests.delete(foundRequestId);

            // 触发响应回调
            this._triggerResponse(responseData, foundRequest);

            if (responseCode === 200 && resposeData) {
                this._loadImageFromBase64(resposeData, foundRequest.context);
            } else {
                const errorMsg = error || `HTTP ${responseCode}`;
                foundRequest.context.fail(errorMsg);
                this._triggerError(errorMsg);
            }
        },

        /**
         * 获取待处理请求数量
         */
        getPendingRequestCount: function () {
            return this.pendingRequests.size;
        },

        /**
         * 清理所有待处理请求
         */
        clearPendingRequests: function () {
            for (const [requestId, request] of this.pendingRequests) {
                clearTimeout(request.timeoutId);
                request.context.fail('Request cancelled');
            }
            this.pendingRequests.clear();
        },

        // 私有方法
        _parseTileUrl: function (url) {
            const match = url.match(/webrtc:\/\/tile\/(\d+)\/(\d+)\/(\d+)/);
            if (match) {
                return {
                    level: parseInt(match[1]),
                    x: parseInt(match[2]),
                    y: parseInt(match[3])
                };
            }
            return null;
        },

        _generateRequestId: function () {
            return `req_${++this.requestCounter}_${Date.now()}`;
        },

        _sendSdpcRtcRequest: function (level, x, y, requestId) {
            const data = {
                RequestId: requestId,
                Method: this.method.GetTile,
                Params: {
                    IdNo: this.sdpcId,
                    Level: level,
                    X: x,
                    Y: y,
                    ColorMd5: ''
                }
            };

            try {
                // 使用 SdpcRtc 的 refreshSlice 方法发送请求
                this.sdpcRtc.refreshSlice(this.channelName, data);
                this._triggerRequest(data);
            } catch (error) {
                const request = this.pendingRequests.get(requestId);
                if (request) {
                    clearTimeout(request.timeoutId);
                    this.pendingRequests.delete(requestId);
                    request.context.fail(`Send failed: ${error.message}`);
                }
                this._triggerError(`Send failed: ${error.message}`);
            }
        },

        _loadImageFromBase64: function (base64Data, context) {
            const img = new Image();
            img.onload = function () {
                context.finish(img, null, 'image');
            };
            img.onerror = function () {
                const error = 'Failed to load base64 image';
                context.fail(error);
            };

            // 处理 base64 数据
            let imageData = base64Data;
            if (!imageData.startsWith('data:')) {
                imageData = 'data:image/jpeg;base64,' + base64Data;
            }
            img.src = imageData;
        },

        _triggerRequest: function (requestData) {
            if (this.onRequest) {
                this.onRequest(requestData);
            }
        },

        _triggerResponse: function (responseData, request) {
            if (this.onResponse) {
                this.onResponse(responseData, request);
            }
        },

        _triggerError: function (error) {
            if (this.onError) {
                this.onError(error);
            }
        }
    });

})(window.OpenSeadragon);

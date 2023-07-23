"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSharedListeners = void 0;
var constants_1 = require("./constants");
var globals_1 = require("./globals");
var manage_subscribers_1 = require("./manage-subscribers");
var socket_io_1 = require("./socket-io");
var bindMessageHandler = function (webSocketInstance, url, transformer) {
    webSocketInstance.onmessage = function (m) { return __awaiter(void 0, void 0, void 0, function () {
        var message, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!transformer) return [3 /*break*/, 2];
                    return [4 /*yield*/, transformer(m)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = m;
                    _b.label = 3;
                case 3:
                    message = _a;
                    (0, manage_subscribers_1.getSubscribers)(url).forEach(function (subscriber) {
                        if (subscriber.optionsRef.current.onMessage) {
                            subscriber.optionsRef.current.onMessage(message);
                        }
                        if (typeof subscriber.optionsRef.current.filter === 'function' &&
                            subscriber.optionsRef.current.filter(message) !== true) {
                            return;
                        }
                        subscriber.setLastMessage(message);
                    });
                    return [2 /*return*/];
            }
        });
    }); };
};
var bindOpenHandler = function (webSocketInstance, url) {
    webSocketInstance.onopen = function (event) {
        (0, manage_subscribers_1.getSubscribers)(url).forEach(function (subscriber) {
            subscriber.reconnectCount.current = 0;
            if (subscriber.optionsRef.current.onOpen) {
                subscriber.optionsRef.current.onOpen(event);
            }
            subscriber.setReadyState(constants_1.ReadyState.OPEN);
        });
    };
};
var bindCloseHandler = function (webSocketInstance, url) {
    if (webSocketInstance instanceof WebSocket) {
        webSocketInstance.onclose = function (event) {
            (0, manage_subscribers_1.getSubscribers)(url).forEach(function (subscriber) {
                if (subscriber.optionsRef.current.onClose) {
                    subscriber.optionsRef.current.onClose(event);
                }
                subscriber.setReadyState(constants_1.ReadyState.CLOSED);
            });
            delete globals_1.sharedWebSockets[url];
            (0, manage_subscribers_1.getSubscribers)(url).forEach(function (subscriber) {
                var _a;
                if (subscriber.optionsRef.current.shouldReconnect &&
                    subscriber.optionsRef.current.shouldReconnect(event)) {
                    var reconnectAttempts = (_a = subscriber.optionsRef.current.reconnectAttempts) !== null && _a !== void 0 ? _a : constants_1.DEFAULT_RECONNECT_LIMIT;
                    if (subscriber.reconnectCount.current < reconnectAttempts) {
                        var nextReconnectInterval = typeof subscriber.optionsRef.current.reconnectInterval === 'function' ?
                            subscriber.optionsRef.current.reconnectInterval(subscriber.reconnectCount.current) :
                            subscriber.optionsRef.current.reconnectInterval;
                        setTimeout(function () {
                            subscriber.reconnectCount.current++;
                            subscriber.reconnect.current();
                        }, nextReconnectInterval !== null && nextReconnectInterval !== void 0 ? nextReconnectInterval : constants_1.DEFAULT_RECONNECT_INTERVAL_MS);
                    }
                    else {
                        subscriber.optionsRef.current.onReconnectStop && subscriber.optionsRef.current.onReconnectStop(subscriber.optionsRef.current.reconnectAttempts);
                        console.warn("Max reconnect attempts of ".concat(reconnectAttempts, " exceeded"));
                    }
                }
            });
        };
    }
};
var bindErrorHandler = function (webSocketInstance, url) {
    webSocketInstance.onerror = function (error) {
        (0, manage_subscribers_1.getSubscribers)(url).forEach(function (subscriber) {
            if (subscriber.optionsRef.current.onError) {
                subscriber.optionsRef.current.onError(error);
            }
            if (constants_1.isEventSourceSupported && webSocketInstance instanceof EventSource) {
                subscriber.optionsRef.current.onClose && subscriber.optionsRef.current.onClose(__assign(__assign({}, error), { code: 1006, reason: "An error occurred with the EventSource: ".concat(error), wasClean: false }));
                subscriber.setReadyState(constants_1.ReadyState.CLOSED);
            }
        });
        if (constants_1.isEventSourceSupported && webSocketInstance instanceof EventSource) {
            webSocketInstance.close();
        }
    };
};
var attachSharedListeners = function (webSocketInstance, url, optionsRef, sendMessage) {
    var interval;
    if (optionsRef.current.fromSocketIO) {
        interval = (0, socket_io_1.setUpSocketIOPing)(sendMessage);
    }
    bindMessageHandler(webSocketInstance, url, optionsRef.current.messageTransformer);
    bindCloseHandler(webSocketInstance, url);
    bindOpenHandler(webSocketInstance, url);
    bindErrorHandler(webSocketInstance, url);
    return function () {
        if (interval)
            clearInterval(interval);
    };
};
exports.attachSharedListeners = attachSharedListeners;
//# sourceMappingURL=attach-shared-listeners.js.map
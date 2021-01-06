"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var nodecg_1 = require("./nodecg");
var emitter = new events_1.EventEmitter();
/**
 * Wraps the acknowledgement function from sendMessage to
 * check if it has been handled or not.
 * @param ack Acknowledgement function from sendMessage.
 */
function wrapAck(ack) {
    var handled = false;
    var func = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (handled) {
            throw new Error('Already handled');
        }
        handled = true;
        ack.apply(void 0, args);
    };
    Object.defineProperty(func, 'handled', {
        get: function () {
            return handled;
        },
    });
    return func;
}
/**
 * Sends a message that can be listened to by the "listenFor" function.
 * @param name Message name.
 * @param data Data you want to send alongside the message, if any.
 */
function sendMessage(name, data) {
    return new Promise(function (resolve, reject) {
        nodecg_1.get().log.debug("[Events] sendMessage triggered for \"" + name + "\":", JSON.stringify(data));
        emitter.emit(name, data, wrapAck(function (err, data_) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data_);
            }
        }));
    });
}
exports.sendMessage = sendMessage;
/**
 * Listen for a message that is sent by the "sendMessage" function.
 * @param name Message name.
 * @param callback Function that will be called when message received.
 */
function listenFor(name, callback) {
    nodecg_1.get().log.debug("[Events] listenFor added for \"" + name + "\"");
    emitter.on(name, function (data, ack) {
        callback(data, ack);
    });
}
exports.listenFor = listenFor;

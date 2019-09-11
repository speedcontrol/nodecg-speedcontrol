"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var emitter = new events_1.EventEmitter();
/**
 * Sends a message that can be listened to by the "listenFor" function.
 * @param name Message name.
 * @param data Data you want to send alongside the message, if any.
 */
function sendMessage(name, data) {
    return new Promise(function (resolve, reject) {
        emitter.emit(name, data, function (err, data_) {
            if (!err) {
                resolve(data_);
            }
            else {
                reject(err);
            }
        });
    });
}
exports.sendMessage = sendMessage;
/**
 * Listen for a message that is sent by the "sendMessage" function.
 * @param name Message name.
 * @param callback Function that will be called when message received.
 */
function listenFor(name, callback) {
    emitter.on(name, function (data, ack) {
        callback(data, ack);
    });
}
exports.listenFor = listenFor;

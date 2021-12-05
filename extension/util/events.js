"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenFor = exports.sendMessage = void 0;
const events_1 = require("events");
const nodecg_1 = require("./nodecg");
const emitter = new events_1.EventEmitter();
/**
 * Wraps the acknowledgement function from sendMessage to
 * check if it has been handled or not.
 * @param ack Acknowledgement function from sendMessage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapAck(ack) {
    let handled = false;
    const func = (...args) => {
        if (handled) {
            throw new Error('Already handled');
        }
        handled = true;
        ack(...args);
    };
    Object.defineProperty(func, 'handled', {
        get() {
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
    return new Promise((resolve, reject) => {
        (0, nodecg_1.get)().log.debug(`[Events] sendMessage triggered for "${name}":`, JSON.stringify(data));
        emitter.emit(name, data, wrapAck((err, data_) => {
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
    (0, nodecg_1.get)().log.debug(`[Events] listenFor added for "${name}"`);
    emitter.on(name, (data, ack) => {
        callback(data, ack);
    });
}
exports.listenFor = listenFor;

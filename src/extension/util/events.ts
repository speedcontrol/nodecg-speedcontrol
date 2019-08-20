/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventEmitter } from 'events';

const emitter = new EventEmitter();

interface Callback {
  (data: any, ack: Acknowledgement): void;
}

interface Acknowledgement {
  (error: Error | null, data?: any): void;
}

/**
 * Sends a message that can be listened to by the "listenFor" function.
 * @param name Message name.
 * @param data Data you want to send alongside the message, if any.
 */
export function sendMessage(name: string, data?: any): Promise<any> {
  return new Promise((resolve, reject): void => {
    emitter.emit(name, data, (err: Error | null, msg?: any): void => {
      if (!err) {
        resolve(msg);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Listen for a message that is sent by the "sendMessage" function.
 * @param name Message name.
 * @param callback Function that will be called when message received.
 */
export function listenFor(name: string, callback: Callback): void {
  emitter.on(name, (data, ack: Acknowledgement): void => {
    callback(data, ack);
  });
}

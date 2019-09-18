/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventEmitter } from 'events';
import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import { SendMessageAck, SendMessageArgsMap, SendMessageReturnMap } from '../../../types';

const emitter = new EventEmitter();
let nodecg: NodeCG;

/**
 * Sets NodeCG context from index.ts file.
 * @param ctx NodeCG context.
 */
export function setCtx(ctx: NodeCG): void {
  nodecg = ctx;
}

/**
 * Sends a message that can be listened to by the "listenFor" function.
 * @param name Message name.
 * @param data Data you want to send alongside the message, if any.
 */
export function sendMessage<K extends keyof SendMessageArgsMap>(
  name: K,
  data?: SendMessageArgsMap[K],
): Promise<SendMessageReturnMap[K]> {
  return new Promise((resolve, reject): void => {
    nodecg.log.debug(`[events] sendMessage triggered, "${name}":`, JSON.stringify(data));
    emitter.emit(name, data, (err: Error | null, data_?: any) => {
      if (!err) {
        resolve(data_);
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
export function listenFor<K extends keyof SendMessageArgsMap>(
  name: K,
  callback: (data: SendMessageArgsMap[K], ack: SendMessageAck) => void,
): void {
  emitter.on(name, (
    data: SendMessageArgsMap[K], ack: SendMessageAck,
  ) => {
    callback(data, ack);
  });
}

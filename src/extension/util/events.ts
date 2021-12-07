import { SendMessageAck, SendMessageArgsMap, SendMessageReturnMap } from '@nodecg-speedcontrol/types';
import { EventEmitter } from 'events';
import { get as nodecg } from './nodecg';

const emitter = new EventEmitter();

/**
 * Wraps the acknowledgement function from sendMessage to
 * check if it has been handled or not.
 * @param ack Acknowledgement function from sendMessage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapAck(ack: any): any {
  let handled = false;
  const func = (...args: unknown[]): void => {
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
export function sendMessage<K extends keyof SendMessageArgsMap>(
  name: K,
  data?: SendMessageArgsMap[K],
): Promise<SendMessageReturnMap[K]> {
  return new Promise((resolve, reject) => {
    nodecg().log.debug(`[Events] sendMessage triggered for "${name}":`, JSON.stringify(data));
    emitter.emit(name, data, wrapAck((err: Error | null, data_: SendMessageReturnMap[K]) => {
      if (err) {
        reject(err);
      } else {
        resolve(data_);
      }
    }));
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
  nodecg().log.debug(`[Events] listenFor added for "${name}"`);
  emitter.on(name, (data: SendMessageArgsMap[K], ack: SendMessageAck) => {
    callback(data, ack);
  });
}

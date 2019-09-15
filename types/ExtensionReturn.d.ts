import { ListenFor, SendMessage } from './Events';

export interface ExtensionReturn {
  listenFor: ListenFor;
  sendMessage: SendMessage;
}

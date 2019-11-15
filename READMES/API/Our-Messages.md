## Our Own Messaging System

If you are sending messages to this bundle from the context of the extension and would like to be able to use promises to know if what you have done worked, you can use our own messaging system which does not rely on socket.io. For this to work you *must* declare this bundle as a `bundleDependency` in your bundle's manifest. For consistency, you can also use this feature to receive messages too, although currently none of our messages sent out expect a response so this has no advantage.

*[Link to NodeCG documentation for reference.](https://nodecg.com/NodeCG.html#extensions)*

To do this, we expose some functions from our extension code: `sendMessage` and `listenFor`. To make this as easy to work with, we have attempted to mirror the native NodeCG messaging system, therefore you can refer to [that documentation](./NodeCG-Messages.md), make sure you use `sendMessage` and *not* `sendMessageToBundle`, drop any instance of having to specify the bundle name (`'nodecg-speedcontrol'`) and in the case of messages received, use the code examples marked *Example code (promise)*. Currently, `sendMessage` will only return a promise and not a callback, although we highly advise using this method anyway.

### Example code
```javascript
const speedcontrol = nodecg.extensions['nodecg-speedcontrol'];
// Listen for a message.
speedcontrol.listenFor('twitchCommercialStarted', (data) => {
  ...
});
// Send a message.
speedcontrol.sendMessage('changeActiveRun', 'f926048c-3527-4d2f-96f6-680b81bf06e6')
  .then((noTwitchGame) => { ... })
  .catch((err) => { ... })
```

## TypeScript

These are also available typed if you use TypeScript.

*Types available in [./types/ExtensionReturn.d.ts](../../types/ExtensionReturn.d.ts) and [./types/Events.d.ts](../../types/Events.d.ts)*

You can use the `ExtensionReturn` interface to properly type what the extension returns, although due to an issue with NodeCG's own typings (correct as of `1.5.0`), you must convert the expression to `unknown` first:
```typescript
const speedcontrol = nodecg.extensions['nodecg-speedcontrol'] as unknown as ExtensionReturn;
```

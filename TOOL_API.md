# Tool Api

One amazing feature of `connectTool` is the ability to expose an api to the rest of the application including other tools.
Doing so is super easy. Let's assume you have a class named `MyApi`.

```js
connectTool(NAMESPACE, {api: new MyApi()}(Container);
```

Done! Now translationCore and other tools can communicate with your tool.

## The API Lifecycle

Each api has several "lifecycle methods" that you can override to run code at particular times in the process.

* `toolWillConnect`
* `toolWillReceiveProps`
* `stateChanged`
* `stateChangeThrottled` a throttled version of `stateChanged`. This will only execute ever few seconds instead of after every state change.
* `toolWillDisconnect`

## Calling API methods

TODO: write something up

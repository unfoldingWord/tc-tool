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
* `mapDispatchToProps`
* `mapStateToProps`
* `toolWillDisconnect`
* `toolDidCatch`
* `stateChanged`
* `stateChangeThrottled` - same as `stateChanged` but throttled to once a second.


## Calling API methods

TODO: write something up

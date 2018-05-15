# Tool Api

`connectTool` gives you the ability to expose an API to translationCore (tC) and supporting tools.
Doing so is super easy. Let's assume you have a class named `MyApi`.

```js
connectTool('myTool', {api: new MyApi()}(Container);
```

Done! Now tC and other tools can communicate with your tool.

## The API Lifecycle

The tool API lifecycle borrows a lot of constructs from React and Redux. These methods are primarily bound to the React lifecycle of the parent container in tC (for further information see the tC documentation).

When a tool is loaded in tC *all* of the other tools APIs are loaded as well. This gives tools the opportunity to communicate with each other, including retrieving information or delegating tasks.

The tool API has several "lifecycle methods" that you can override to run code at particular times in the process.

### Mounting

These methods are called when a tool is being created.

- `mapDispatchToProps()`
- `mapStateToProps()`

* `toolWillConnect()`

### Updating

An update can be caused by changes to props or state. These methods are called when the container in tC is being re-rendered.

- `mapDispatchToProps()`
- `mapStateToProps()`

* `toolWillReceiveProps()`

### Unmounting

This method is called when a tool is being removed.

* `toolWillDisconnect()`

### Error Handling

This method is called when there is an error in a lifecycle method.

* `toolDidCatch()`

### Other Methods

Each API also provides some other lifecycle methods.

- `stateChanged()`* called every time the state changes
- `stateChangeThrottled()`* same as `stateChanged` but throttled to once a second.

> ***** These lifecycle methods are blocking and will not be re-executed until the previous execution has completed. This works for synchronous and asynchronous (returns a `Promise`) code.
>
> This is especially helpful for I/O operations like saving data to the disk since you will not have to fight race conditions.

## Reference

### mapDispatchToProps()

```js
mapDispatchToProps(dispatch, props)
```

Called before the tool is connected and before receiving props. This allows an API to inject dispatch-bound action creators into it's props.

It should return a dictionary of new items to be added to props.

### mapStateToProps()

```js
mapStateToProps(state, props)
```

Called before the tool is connected and before receiving props. This allows an API to inject additional data into it's props.

It should return a dictionary of new items to be added to props.

### toolWillConnect()

```js
toolWillConnect()
```

Called before the tool mounts in tC.

### toolWillReceiveProps()

```js
toolWillReceiveProps(nextProps)
```

Called when the tool is about to receive new props. 

### toolWillDisconnect()

```js
toolWillDisconnect()
```

Called before the tool dismounted.

### toolDidCatch()

```js
toolDidCatch(error)
```

Called when an error is caught in the tool. If this method is not overridden the error will be logged to the console.

### stateChanged()

```js
stateChanged(nextState, prevState)
```

Called every time the state changes.

* **blocking** - will not execute more than once at a single time. If this method returns a promise it will block until resolved.

### stateChangeThrottled()

```js
stateChangeThrottled
```

Called at most once per second when the state changes.

* **blocking** - will not execute more than once at a single time. If this method returns a promise it will block until resolved.

## Finding an API

A tool's API is made available in several different locations.

### In the tool's Container

A tool's container is given an instance of the API as a prop named `toolAPI`. The is the un-wrapped instance of the tool's API class. Other tools and tC do not have direct access to another tool's API but must instead use an `ApiController` to make requests.

### In other tools

Other tools do not have direct access to other APIs. They are instead given an `ApiController` with which to communicate with the API.

Tools may access an API from another tool from a prop named `tc.tools` which is simply a dictionary of APIs keyed by the tool id. For example, the translationWords tool may access the wordAlignment API in the following manner:

```js
const {tc: {tools: wordAlignment }} = this.props;
```

### In tC

Like other tools, tC is given an `ApiController` with which to communicate with the API.

translationCore has it's own method of accessing tool APIs that is beyond the scope of this document. Please refer to the documentation for tC for further instructions.

## Using an API

> Since tool's are given their own un-wrapped API (not an `ApiController`) they may execute methods on it like any other object.

To access another tool's API you'll need to have it's controller. Once the controller is available there are a number of methods available with which to make requests.

- `trigger(method: string, ...args)`  executes the method if it exists while passing down additional arguments.
- `triggerForced(method: string, ...args)` executes the method while passing down additional arguments or throws an error if it does not exist.
- `triggerBlocking(method: string, callback: func, ...args)` executes a method as blocking while passing down additional arguments.
- `methodExists(method: string)` checks if a method exist
- `assertExists(method: string)` throws an error if the method does not exist

For example, the following code will ask the tool if it's check for verse 1 of chapter 1 in the loaded book has been completed:

```js
const isFinished = api.trigger('getIsVerseFinished', 1, 1);
```


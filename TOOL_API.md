# Tool Api

`connectTool` gives you the ability to expose an API to translationCore (tC) and supporting tools.
Doing so is super easy. Let's assume you have a class named `MyApi`.

```js
connectTool('myTool', {api: new MyApi()}(Container);
```

Done! Now tC and other tools can communicate with your tool.

## The API Lifecycle

The tool API has several "lifecycle methods" that you can override to run code at particular times in the process.

* `toolWillConnect` called before the tool mounts (if it mounts) in tC 
* `toolWillReceiveProps` called when the tool is about to receive new props. 
* `mapDispatchToProps` utility for mapping custom action creators to dispatch and inserting them into props
* `mapStateToProps` utility for using selectors to retrieve data from state and inserting it into props.
* `toolWillDisconnect` called before the tool dismounted (if it was mounted in the first place)
* `toolDidCatch` called when an error is caught in the tool
* `stateChanged` (blocking) called every time the state changes
* `stateChangeThrottled` (blocking) - same as `stateChanged` but throttled to once a second.

> **blocking** lifecycle methods will not be re-executed until the previous execution has completed. This works for synchronous and asynchronous (returns a `Promise`) code.
>
> This is especially helpful for I/O operations like saving data to the disk since you will not have to fight race conditions.


## Finding an API

### From the tool Container

A tool's container is given an instance of the API as a prop named `toolAPI`. The is the un-wrapped instance of the tool's API class. Other tools and tC do not have direct access to another tool's API but must instead use an `ApiController` to make requests.

### From other tools

Other tools do not have direct access to other APIs. They are instead given an `ApiController` with which to communicate with the API.

Tools may access an API from another tool from a prop named `tc.tools` which is simply a dictionary of APIs keyed by the tool id. For example, the translationWords tool may access the wordAlignment API in the following manner:

```js
const {tc: {tools: wordAlignment }} = this.props;
```



### From tC

Like other tools, tC is given an `ApiController` with which to communicate with the API.

translationCore has it's own method of accessing tool APIs that is beyond the scope of this document. Please refer to the documentation for tC for further instructions.



## Using an API

>  Since tool's are given their own un-wrapped API (not an `ApiController`) they may execute methods on it like any other object.

To access another tool's API you'll need to have it's controller. Once the controller is available there are a number of methods available with which to make requests.

* `trigger(method: string, ...args)`  executes the method if it exists while passing down additional arguments.
* `triggerForced(method: string, ...args)` executes the method while passing down additional arguments or throws an error if it does not exist.
* `triggerBlocking(method: string, callback: func, ...args)` executes a method as blocking while passing down additional arguments.
* `methodExists(method: string)` checks if a method exist
* `assertExists(method: string)` throws an error if the method does not exist

For example, the following code will ask the tool if it's check for verse 1 of chapter 1 in the loaded book has been completed:

```js
const isFinished = api.trigger('getIsVerseFinished', 1, 1);
```


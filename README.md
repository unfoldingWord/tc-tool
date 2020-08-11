[![Build Status](https://travis-ci.org/unfoldingWord/tc-tool.svg?branch=master)](https://travis-ci.org/unfoldingWord/tc-tool)
[![codecov](https://codecov.io/gh/unfoldingWord/tc-tool/branch/master/graph/badge.svg)](https://codecov.io/gh/unfoldingWord/tc-tool)

# tC Tool

This module provides an interface for connecting custom apps/tools
to [translationCore](https://github.com/unfoldingWord-dev/translationCore).

Among other things, this module exposes a [HOC](https://reactjs.org/docs/higher-order-components.html) that turns any React component into a tool.

## installation

```bash
npm i tc-tool
```



## Quick Start

To create a tool all you need is a component and a catchy name.

```js
// index.js
import Container from './Container';
import {connectTool} from 'tc-tool';

export default connectTool('awesomeTool')(Container);
```

The above code should be placed in your module's main file (usually `index.js`).

## Advanced Usage

### Locale

Likely the most important feature you'll need to include in your tool is localization. Adding locale is optional but strongly encouraged.

Locale files are structured in [Single Language Format](https://ryandrewjohnson.github.io/react-localize-redux/formatting-translation-data/) and named as `Name-locale_REGION.json` e.g. `English-en_US.json`.
```js
// index.js
import Container from './Container';
import {connectTool} from 'tc-tool';
import path from 'path';

export default connectTool('awesomeTool', {
    localeDir: path.join(__dirname, './locale')
})(Container);
```

Then in your component (or API) you'll have access to localization tools.
```js
// Container.js
class Container extends React.Component {
    render() {
        const {translate, currentLanguage} = this.props;
        return translate('hello'); // returns "Hello" in the correct language
    }
}
```

> **NOTE**: when using locale, if the selected langauge in tC core is not supported by
> the tool, it will first try the system locale as a fallback then finally English.

### Reducer

If you would like to utilize Redux in your tool you can give it to `connectTool`. Then you can use the standard `connect` HOC from `react-redux` to subscribe to the store.

```js
// index.js
import Container from './Container';
import {connectTool} from 'tc-tool';
import reducer from './reducers';

export default connectTool('awesomeTool', {
	reducer: reducer
})(Container);
```

Then your reducer state will be available under `state.tool`.
```js
// Container.js
import connect from 'react-redux';
class Container extends React.Component {
  render() {
    const {myValue} = this.props;
    return myValue;
  }
}

const mapStateToProps = (state) => {
    const {tool: {myValue}} = state;
    return {
        myValue
    };
};
export default connect(mapStateToProps)(Container);
```

### Middleware

The tool already comes configured with the following middleware:

* [redux-promise](https://www.npmjs.com/package/redux-promise)
* [redux-thunk](https://www.npmjs.com/package/redux-thunk)
* [redux-logger](https://www.npmjs.com/package/redux-logger) (when `NODE_ENV=development`)

If you need to add additional middleware you can give it to `connectTool`.

> **NOTE**: middleware will be useless without a reducer for obvious reasons.

```js
// index.js
import Container from './Container';
import {connectTool} from 'tc-tool';
import reducer from './reducers';
import {createLogicMiddleware} from 'redux-logic';

export default connectTool('awesomeTool', {
	reducer,
    middlewares: [createLogicMiddleware()]
})(Container);
```



### Tool API

If other tools need access to functionality or data within this tool you can expose an API.

```js
// index.js
import Container from './Container';
import {connectTool} from 'tc-tool';
import MyApi from './MyApi';

export default connectTool('awesomeTool', {
	api: new MyApi(),
})(Container);
```

For more information about APIs see [Tool API](./TOOL_API.md).

## Other Features

### Error Boundary (Deprecated)

A semi-user-friendly error screen is displayed if an error occurs within the tool. This allows users to navigate to a safe part of the app.

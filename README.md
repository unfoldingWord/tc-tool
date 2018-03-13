[![Build Status](https://travis-ci.org/translationCoreApps/tc-tool.svg?branch=master)](https://travis-ci.org/translationCoreApps/tc-tool)
[![codecov](https://codecov.io/gh/translationCoreApps/tc-tool/branch/master/graph/badge.svg)](https://codecov.io/gh/translationCoreApps/tc-tool)

# tC Tool

This module provides an interface for connecting custom apps/tools
to [translationCore](https://github.com/unfoldingWord-dev/translationCore).

Among other things, this module exposes a [HOC](https://reactjs.org/docs/higher-order-components.html)
that injects some sugar into your tool.

## installation

```bash
npm i tc-tool
```

## Usage

In your tool's index file simply connect the exported component.
Adding a directory from which to load locale is optional but encouraged.

Locale files are structured in [Single Language Format](https://ryandrewjohnson.github.io/react-localize-redux/formatting-translation-data/)
and named as `Name-locale_REGION.json` e.g. `English-en_US.json`.
```js
// index.js
import Container from './Container';
import {connectTool} from 'tc-tool';

const NAMESPACE = 'awesomeTool';
const LOCALE_DIR = path.join(__dirname, './locale');

export default {
  name: NAMESPACE,
  container: connectTool(LOCALE_DIR)(Container)
};
```

Then in your component you'll have access to some awesome tools.
```js
// Container.js
class Container extends React.Component {
    render() {
        const {translate, currentLanguage} = this.props;
        return translate('hello'); // returns "Hello" in the correct language
    }
}
```

> **NOTE** when using locale, if the selected langauge in tC core is not supported by
> the tool, it will first use the system locale as a fallback or else English.

## Injecting a Tool Reducer

If you would like to utilize redux in your tool you can supply a reducer as the second argument
to `connectTool`. Then you can use the standard `connect` HOC from `react-redux` to subscribe to the store.

```js
// index.js
import reducer from './reducers';
...
connectTool(LOCALE_DIR, reducer)(Container)
```

Then your reducer state will be available under `state.tool`.
```js
// Container.js
import connect from 'react-redux';
...

class Container extends React.Component {
  render() {
    const {myValue} =this.props;
    ...
  }
}

const mapStateToProps = (state) => {
  myValue: state.tool.myKey
};
export default connect(mapStateToProps)(Container);
```

## Features

* **state** - Adds a scoped redux store to the component.
* **localization** - Loads the tool locale and provides a translate tool to the component.
* **error boundary** - A semi-user-friendly error screen is displayed if an error occurs. This allows users to navigate to a safe part of the app.

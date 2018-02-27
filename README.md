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
  container: connectTool(NAMESPACE, LOCALE_DIR)(Container)
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

## Advanced Usage

If you need to access the redux store on a sub component and don't want to
pass it down from the parent (which is normally preferred) you'll need to
create a custom connector. You can create this connector and export it from
some global location like your tool's `index.js` file.
 
 Example
 ```js
// index.js
import {createConnect} from 'tc-tool';
const NAMESPACE = 'awesomeTool';

export const connect = createConnect(NAMESPACE);

...


// SubComponent.js
import {connect} from '../index';

class SubComponent extends React.Component {
    render() {
        const {someValue} = this.props;
        ...
    }
}

const mapStateToProps = (state) => {
    someValue: state.some.key
};
export default connect(mapStateToProps)(SubComponent);

```

This custom connect ensures you are attaching to the tool's redux store and not
the default store from tC core.

> **NOTE**: you could technically attach to the redux store in tC core by using
> `connect` from the `react-redux` library. However, this is **strongly** discouraged.
> This practice is not supported and may result in your tool breaking with
> future updates to tC core.

## Features

* **state** - Adds a scoped redux store to the component.
* **localization** - Loads the tool locale and provides a translate tool to the component.
* **error boundary** - A semi-user-friendly error screen is displayed if an error occurs. This allows users to navigate to a safe part of the app.

## TODO:

* add ability to inject custom reducers.
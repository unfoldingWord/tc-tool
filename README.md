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

```js
// Container.js

import {connectTool} from 'tc-tool';
...

const MY_TOOL_ID = 'awesomeTool';
const LOCALE_DIR = path.join(__dirname, './locale');

class Container extends React.Component {
    render() {
        const {translate, currentLanguage} = this.props;
        ...
    }
}

export default connectTool(MY_TOOL_ID, LOCALE_DIR)(Container);

```

If you need to access the redux store on a sub component
you'll need to create a custom connect HOC.
It is suggested to create the tool's custom connect function
in your `Container` component file and export it for use in the rest of the tool.
 
 Example
 ```js
// Container.js
import {createConnect} from 'tc-tool';
const MY_TOOL_ID = 'awesomeTool';

export const connect = createConnect(MY_TOOL_ID);

...


// SubComponent.js
import {connect} from '../Container';

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

## Features

* **state** - Adds a scoped redux store to the component.
* **localization** - Loads the tool locale and provides a translate tool to the component.
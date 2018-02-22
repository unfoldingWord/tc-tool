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
import {connectTool} from 'tc-tool';
...

const MY_TOOL_ID = 'awesomeTool';
const LOCALE_DIR = path.join(__dirname, './locale');

class Container extends React.Component {
    ...
}

export default connectTool(MY_TOOL_ID, LOCALE_DIR)(Container);

```

## Features

* **state** - Adds a scoped redux store to the component.
* **localization** - Loads the tool locale and provides a translate tool to the component.
# tC Tool

This module provides a interface to translationCore.


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
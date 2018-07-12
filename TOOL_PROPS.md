# tC Tool Props

This HOC provides injects a number of useful props into your tool and tool api (if you have one).
There are two groups of props:

* `tc` an object that contain functionality and data provided by translationCore.
* `tool` an object that container functionality and data provided by this HOC.

Example:
```js
const {
  tc,
  tool
} = this.props;
```

For a definition the `tc` prop see the [tC API](https://github.com/unfoldingWord-dev/translationCore/blob/develop/API.md).

The rest of the document will address the contents of the `tool` prop.

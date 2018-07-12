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

## `tool` props

The below props are accessible under the `tool` prop. e.g. to check if the tool has finished loading we can write the following code:
```js
const {
  tool: {isReady}
} = this.props;
if(isReady) {
  alert('The tool is ready');
}
```

### toolDataPathExists
```js
toolDataPathExists(filePath: string): Promise<boolean>
```
Checks if a path exists within the tool's data folder.

### toolDataPathExistsSync
```js
toolDataPathExistsSync(filePath: string): boolean
```
Synchronously checks if a path exists within the tool's data folder.

### deleteToolFile
```js
deleteToolFile(filePath: string): Promise
```
Deletes a file from the tool's data folder.

### readToolData
```js
readToolData(filePath: string): Promise<string>
```
Reads data from the tool's data folder.

### readToolDataSync
```js
readToolDataSync(filePath: string): string
```
Reads data from the tool's data folder synchronously.

### writeToolData
```js
writeToolData(filePath: string, data: string): Promise
```
Writes data to the tool's data folder.

### isReady
```js
boolean
```
Indicates if the tool has finished booting.

### translate (optional)
```js
translate(key: string, args:Object): string
```
The function used for localizing the UI.
This prop will only be available if a local path was provided for the tool.

### currentLanguage (optional)
```js
string
```
The language selected for application localization.
This prop will only be available if a locale path was provided for the tool.

### api (optional)
```js
ToolApi
```
An instance of the tool's public api.
This prop will only be available if an api has been configured for the tool.

### setToolReady (only available in the ToolApi)
```js
setToolReady()
```
Indicates that the tool has finished loading

### setToolLoading (only available in the ToolApi)
```js
setToolLoading()
```
Indicates that the tool is still loading.

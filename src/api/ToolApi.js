/**
 * This class represents a tool's api methods.
 * These api methods will be available to tC and other tools.
 */
export default class ToolApi {

  constructor() {
    this.props = {};
    this.context = {};
  }

  toString() {
    throw new Error('ToolApi.toString was not overridden. This is likely an issue with tc-tool.');
  }
}

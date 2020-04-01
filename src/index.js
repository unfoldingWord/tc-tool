import connectTool from './connectTool';
import { getTranslate, getActiveLanguage } from './state/reducers';
import { configureReduxLogger } from './state/configureReduxLogger';
import { setActiveLocale } from './state/actions/locale';
import ToolApi from './api/ToolApi';
import ApiController from './api/ApiController';

exports.connectTool = connectTool;
exports.getTranslate = getTranslate;
exports.getActiveLanguage = getActiveLanguage;
exports.setActiveLocale = setActiveLocale;
exports.configureReduxLogger = configureReduxLogger;
exports.ToolApi = ToolApi;
exports.ApiLifecycle = ApiController;

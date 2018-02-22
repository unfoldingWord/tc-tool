/**
 * Make logs silent for tests
 * @return {function(): function(*): function(*=)}
 */
export const createLogger = () => {
    return () => next => action => {
        next(action);
    }
};
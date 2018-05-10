export const translate = jest.fn((key) => {
  return key;
});

export const getTranslate = () => {
  return translate;
};

export const localize = jest.fn((component, localeReduxKey) => {
  return component;
});

export const localeReducer = jest.fn(() => ({
  languages: jest.fn(),
  translations: jest.fn(),
  options: jest.fn()
}));

export const getActiveLanguage = jest.fn(() => ({
  code: 'en_US',
  name: 'English'
}));


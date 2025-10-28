module.exports = {
  presets: [
    ['babel-preset-expo', { jsxImportSource: 'nativewind' }]
  ],
  plugins: [],
  env: {
    production: {
      plugins: ['react-native-reanimated/plugin']
    }
  }
};
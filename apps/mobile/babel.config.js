module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Must be listed last. Reanimated 4 ships its worklet transform here;
    // without it every worklet throws "Exception in HostFunction".
    plugins: ['react-native-worklets/plugin'],
  };
};

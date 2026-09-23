// NativeWind's jsxImportSource was removed with the Material 3 redesign.
//
// It routed every JSX element in the app through NativeWind's runtime, which
// mangled `Pressable`'s function-form `style` prop — filled buttons rendered
// with no background at all. Nothing uses `className` any more (the design
// tokens live in `lib/theme` and screens use StyleSheet), so the runtime was
// pure overhead on the entry-level Android this app ships to, plus a live bug.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};

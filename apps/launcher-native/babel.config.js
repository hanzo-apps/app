// Runtime Gui (no optimizing compiler), the same way the web/console consumers
// run it. `babel-preset-expo` is all the launcher needs — it uses only base Gui
// primitives (Stack/Text/Input/ScrollView/Spinner), no compiled-away features.
module.exports = (api) => {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
  }
}

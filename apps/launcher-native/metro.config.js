const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Gui ships platform builds through package `exports` conditions
// (`react-native` / `import`). Metro must honour them to pick the native build.
config.resolver.unstable_enablePackageExports = true

module.exports = config

const {hanzoNative} = require('./lib/HanzoNative')

const colors = {
  accent: hanzoNative.accentColor,
  accentBg: `${hanzoNative.accentColor}88`,
  accentBg2: `${hanzoNative.accentColor}10`,
}

module.exports = colors

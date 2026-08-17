// The WEB implementation of react-native-svg, for the test runtime.
//
// On web this app renders that implementation: `next.config.ts` aliases
// `react-native$` to react-native-web and prepends the web extensions, so an
// icon becomes real <svg>/<path>. Jest reproduces neither, and resolves the
// react-native build instead — whose fabric components require
// `react-native/Libraries/Utilities/codegenNativeComponent`, Flow-typed source
// that no transform here accepts.
//
// So each export is a component that renders the SVG element of the SAME name,
// which is what the web build does. An icon is therefore real DOM in a test and
// can be queried; the alternative on offer was a string, which makes every
// icon component `undefined` and throws only once something renders one.
//
// The first character is lowercased and the rest kept, because that IS the SVG
// name: Svg -> svg, Path -> path, LinearGradient -> linearGradient.
const React = require('react');

const component = (tag) => {
  const C = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement(tag, { ...props, ref }, children),
  );
  C.displayName = tag;
  return C;
};

const made = {};

// A proxy rather than a list: react-native-svg exports ~40 elements and the set
// moves with its version, so naming them here would be a copy that goes stale.
module.exports = new Proxy(
  {},
  {
    get(_, name) {
      if (name === '__esModule') return true;
      if (typeof name !== 'string') return undefined;
      const key = name === 'default' ? 'Svg' : name;
      return (made[key] ||= component(key[0].toLowerCase() + key.slice(1)));
    },
  },
);

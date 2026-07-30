import { createRequire as __cr } from "module"; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/typeof.js
var require_typeof = __commonJS({
  "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/typeof.js"(exports, module) {
    function _typeof2(o) {
      "@babel/helpers - typeof";
      return module.exports = _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof2(o);
    }
    __name(_typeof2, "_typeof");
    module.exports = _typeof2, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/toPrimitive.js
var require_toPrimitive = __commonJS({
  "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/toPrimitive.js"(exports, module) {
    var _typeof2 = require_typeof()["default"];
    function toPrimitive(t, r2) {
      if ("object" != _typeof2(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r2 || "default");
        if ("object" != _typeof2(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r2 ? String : Number)(t);
    }
    __name(toPrimitive, "toPrimitive");
    module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/toPropertyKey.js
var require_toPropertyKey = __commonJS({
  "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/toPropertyKey.js"(exports, module) {
    var _typeof2 = require_typeof()["default"];
    var toPrimitive = require_toPrimitive();
    function toPropertyKey(t) {
      var i = toPrimitive(t, "string");
      return "symbol" == _typeof2(i) ? i : i + "";
    }
    __name(toPropertyKey, "toPropertyKey");
    module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/defineProperty.js
var require_defineProperty = __commonJS({
  "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/defineProperty.js"(exports, module) {
    var toPropertyKey = require_toPropertyKey();
    function _defineProperty(e, r2, t) {
      return (r2 = toPropertyKey(r2)) in e ? Object.defineProperty(e, r2, {
        value: t,
        enumerable: true,
        configurable: true,
        writable: true
      }) : e[r2] = t, e;
    }
    __name(_defineProperty, "_defineProperty");
    module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/objectSpread2.js
var require_objectSpread2 = __commonJS({
  "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/objectSpread2.js"(exports, module) {
    var defineProperty = require_defineProperty();
    function ownKeys(e, r2) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r2 && (o = o.filter(function(r3) {
          return Object.getOwnPropertyDescriptor(e, r3).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    __name(ownKeys, "ownKeys");
    function _objectSpread22(e) {
      for (var r2 = 1; r2 < arguments.length; r2++) {
        var t = null != arguments[r2] ? arguments[r2] : {};
        r2 % 2 ? ownKeys(Object(t), true).forEach(function(r3) {
          defineProperty(e, r3, t[r3]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r3) {
          Object.defineProperty(e, r3, Object.getOwnPropertyDescriptor(t, r3));
        });
      }
      return e;
    }
    __name(_objectSpread22, "_objectSpread2");
    module.exports = _objectSpread22, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/objectWithoutPropertiesLoose.js
var require_objectWithoutPropertiesLoose = __commonJS({
  "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/objectWithoutPropertiesLoose.js"(exports, module) {
    function _objectWithoutPropertiesLoose8(r2, e) {
      if (null == r2) return {};
      var t = {};
      for (var n in r2) if ({}.hasOwnProperty.call(r2, n)) {
        if (-1 !== e.indexOf(n)) continue;
        t[n] = r2[n];
      }
      return t;
    }
    __name(_objectWithoutPropertiesLoose8, "_objectWithoutPropertiesLoose");
    module.exports = _objectWithoutPropertiesLoose8, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// node_modules/.pnpm/@react-native+normalize-colors@0.74.89/node_modules/@react-native/normalize-colors/index.js
var require_normalize_colors = __commonJS({
  "node_modules/.pnpm/@react-native+normalize-colors@0.74.89/node_modules/@react-native/normalize-colors/index.js"(exports, module) {
    "use strict";
    function normalizeColor4(color) {
      if (typeof color === "number") {
        if (color >>> 0 === color && color >= 0 && color <= 4294967295) {
          return color;
        }
        return null;
      }
      if (typeof color !== "string") {
        return null;
      }
      const matchers = getMatchers();
      let match;
      if (match = matchers.hex6.exec(color)) {
        return parseInt(match[1] + "ff", 16) >>> 0;
      }
      const colorFromKeyword = normalizeKeyword(color);
      if (colorFromKeyword != null) {
        return colorFromKeyword;
      }
      if (match = matchers.rgb.exec(color)) {
        return (parse255(match[1]) << 24 | // r
        parse255(match[2]) << 16 | // g
        parse255(match[3]) << 8 | // b
        255) >>> // a
        0;
      }
      if (match = matchers.rgba.exec(color)) {
        if (match[6] !== void 0) {
          return (parse255(match[6]) << 24 | // r
          parse255(match[7]) << 16 | // g
          parse255(match[8]) << 8 | // b
          parse1(match[9])) >>> // a
          0;
        }
        return (parse255(match[2]) << 24 | // r
        parse255(match[3]) << 16 | // g
        parse255(match[4]) << 8 | // b
        parse1(match[5])) >>> // a
        0;
      }
      if (match = matchers.hex3.exec(color)) {
        return parseInt(
          match[1] + match[1] + // r
          match[2] + match[2] + // g
          match[3] + match[3] + // b
          "ff",
          // a
          16
        ) >>> 0;
      }
      if (match = matchers.hex8.exec(color)) {
        return parseInt(match[1], 16) >>> 0;
      }
      if (match = matchers.hex4.exec(color)) {
        return parseInt(
          match[1] + match[1] + // r
          match[2] + match[2] + // g
          match[3] + match[3] + // b
          match[4] + match[4],
          // a
          16
        ) >>> 0;
      }
      if (match = matchers.hsl.exec(color)) {
        return (hslToRgb(
          parse360(match[1]),
          // h
          parsePercentage(match[2]),
          // s
          parsePercentage(match[3])
          // l
        ) | 255) >>> // a
        0;
      }
      if (match = matchers.hsla.exec(color)) {
        if (match[6] !== void 0) {
          return (hslToRgb(
            parse360(match[6]),
            // h
            parsePercentage(match[7]),
            // s
            parsePercentage(match[8])
            // l
          ) | parse1(match[9])) >>> // a
          0;
        }
        return (hslToRgb(
          parse360(match[2]),
          // h
          parsePercentage(match[3]),
          // s
          parsePercentage(match[4])
          // l
        ) | parse1(match[5])) >>> // a
        0;
      }
      if (match = matchers.hwb.exec(color)) {
        return (hwbToRgb(
          parse360(match[1]),
          // h
          parsePercentage(match[2]),
          // w
          parsePercentage(match[3])
          // b
        ) | 255) >>> // a
        0;
      }
      return null;
    }
    __name(normalizeColor4, "normalizeColor");
    function hue2rgb(p, q, t) {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
      return p;
    }
    __name(hue2rgb, "hue2rgb");
    function hslToRgb(h, s, l) {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const r2 = hue2rgb(p, q, h + 1 / 3);
      const g = hue2rgb(p, q, h);
      const b = hue2rgb(p, q, h - 1 / 3);
      return Math.round(r2 * 255) << 24 | Math.round(g * 255) << 16 | Math.round(b * 255) << 8;
    }
    __name(hslToRgb, "hslToRgb");
    function hwbToRgb(h, w2, b) {
      if (w2 + b >= 1) {
        const gray = Math.round(w2 * 255 / (w2 + b));
        return gray << 24 | gray << 16 | gray << 8;
      }
      const red = hue2rgb(0, 1, h + 1 / 3) * (1 - w2 - b) + w2;
      const green = hue2rgb(0, 1, h) * (1 - w2 - b) + w2;
      const blue = hue2rgb(0, 1, h - 1 / 3) * (1 - w2 - b) + w2;
      return Math.round(red * 255) << 24 | Math.round(green * 255) << 16 | Math.round(blue * 255) << 8;
    }
    __name(hwbToRgb, "hwbToRgb");
    var NUMBER = "[-+]?\\d*\\.?\\d+";
    var PERCENTAGE = NUMBER + "%";
    function call(...args) {
      return "\\(\\s*(" + args.join(")\\s*,?\\s*(") + ")\\s*\\)";
    }
    __name(call, "call");
    function callWithSlashSeparator(...args) {
      return "\\(\\s*(" + args.slice(0, args.length - 1).join(")\\s*,?\\s*(") + ")\\s*/\\s*(" + args[args.length - 1] + ")\\s*\\)";
    }
    __name(callWithSlashSeparator, "callWithSlashSeparator");
    function commaSeparatedCall(...args) {
      return "\\(\\s*(" + args.join(")\\s*,\\s*(") + ")\\s*\\)";
    }
    __name(commaSeparatedCall, "commaSeparatedCall");
    var cachedMatchers;
    function getMatchers() {
      if (cachedMatchers === void 0) {
        cachedMatchers = {
          rgb: new RegExp("rgb" + call(NUMBER, NUMBER, NUMBER)),
          rgba: new RegExp(
            "rgba(" + commaSeparatedCall(NUMBER, NUMBER, NUMBER, NUMBER) + "|" + callWithSlashSeparator(NUMBER, NUMBER, NUMBER, NUMBER) + ")"
          ),
          hsl: new RegExp("hsl" + call(NUMBER, PERCENTAGE, PERCENTAGE)),
          hsla: new RegExp(
            "hsla(" + commaSeparatedCall(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) + "|" + callWithSlashSeparator(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) + ")"
          ),
          hwb: new RegExp("hwb" + call(NUMBER, PERCENTAGE, PERCENTAGE)),
          hex3: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
          hex4: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
          hex6: /^#([0-9a-fA-F]{6})$/,
          hex8: /^#([0-9a-fA-F]{8})$/
        };
      }
      return cachedMatchers;
    }
    __name(getMatchers, "getMatchers");
    function parse255(str) {
      const int = parseInt(str, 10);
      if (int < 0) {
        return 0;
      }
      if (int > 255) {
        return 255;
      }
      return int;
    }
    __name(parse255, "parse255");
    function parse360(str) {
      const int = parseFloat(str);
      return (int % 360 + 360) % 360 / 360;
    }
    __name(parse360, "parse360");
    function parse1(str) {
      const num = parseFloat(str);
      if (num < 0) {
        return 0;
      }
      if (num > 1) {
        return 255;
      }
      return Math.round(num * 255);
    }
    __name(parse1, "parse1");
    function parsePercentage(str) {
      const int = parseFloat(str);
      if (int < 0) {
        return 0;
      }
      if (int > 100) {
        return 1;
      }
      return int / 100;
    }
    __name(parsePercentage, "parsePercentage");
    function normalizeKeyword(name) {
      switch (name) {
        case "transparent":
          return 0;
        // http://www.w3.org/TR/css3-color/#svg-color
        case "aliceblue":
          return 4042850303;
        case "antiquewhite":
          return 4209760255;
        case "aqua":
          return 16777215;
        case "aquamarine":
          return 2147472639;
        case "azure":
          return 4043309055;
        case "beige":
          return 4126530815;
        case "bisque":
          return 4293182719;
        case "black":
          return 255;
        case "blanchedalmond":
          return 4293643775;
        case "blue":
          return 65535;
        case "blueviolet":
          return 2318131967;
        case "brown":
          return 2771004159;
        case "burlywood":
          return 3736635391;
        case "burntsienna":
          return 3934150143;
        case "cadetblue":
          return 1604231423;
        case "chartreuse":
          return 2147418367;
        case "chocolate":
          return 3530104575;
        case "coral":
          return 4286533887;
        case "cornflowerblue":
          return 1687547391;
        case "cornsilk":
          return 4294499583;
        case "crimson":
          return 3692313855;
        case "cyan":
          return 16777215;
        case "darkblue":
          return 35839;
        case "darkcyan":
          return 9145343;
        case "darkgoldenrod":
          return 3095792639;
        case "darkgray":
          return 2846468607;
        case "darkgreen":
          return 6553855;
        case "darkgrey":
          return 2846468607;
        case "darkkhaki":
          return 3182914559;
        case "darkmagenta":
          return 2332068863;
        case "darkolivegreen":
          return 1433087999;
        case "darkorange":
          return 4287365375;
        case "darkorchid":
          return 2570243327;
        case "darkred":
          return 2332033279;
        case "darksalmon":
          return 3918953215;
        case "darkseagreen":
          return 2411499519;
        case "darkslateblue":
          return 1211993087;
        case "darkslategray":
          return 793726975;
        case "darkslategrey":
          return 793726975;
        case "darkturquoise":
          return 13554175;
        case "darkviolet":
          return 2483082239;
        case "deeppink":
          return 4279538687;
        case "deepskyblue":
          return 12582911;
        case "dimgray":
          return 1768516095;
        case "dimgrey":
          return 1768516095;
        case "dodgerblue":
          return 512819199;
        case "firebrick":
          return 2988581631;
        case "floralwhite":
          return 4294635775;
        case "forestgreen":
          return 579543807;
        case "fuchsia":
          return 4278255615;
        case "gainsboro":
          return 3705462015;
        case "ghostwhite":
          return 4177068031;
        case "gold":
          return 4292280575;
        case "goldenrod":
          return 3668254975;
        case "gray":
          return 2155905279;
        case "green":
          return 8388863;
        case "greenyellow":
          return 2919182335;
        case "grey":
          return 2155905279;
        case "honeydew":
          return 4043305215;
        case "hotpink":
          return 4285117695;
        case "indianred":
          return 3445382399;
        case "indigo":
          return 1258324735;
        case "ivory":
          return 4294963455;
        case "khaki":
          return 4041641215;
        case "lavender":
          return 3873897215;
        case "lavenderblush":
          return 4293981695;
        case "lawngreen":
          return 2096890111;
        case "lemonchiffon":
          return 4294626815;
        case "lightblue":
          return 2916673279;
        case "lightcoral":
          return 4034953471;
        case "lightcyan":
          return 3774873599;
        case "lightgoldenrodyellow":
          return 4210742015;
        case "lightgray":
          return 3553874943;
        case "lightgreen":
          return 2431553791;
        case "lightgrey":
          return 3553874943;
        case "lightpink":
          return 4290167295;
        case "lightsalmon":
          return 4288707327;
        case "lightseagreen":
          return 548580095;
        case "lightskyblue":
          return 2278488831;
        case "lightslategray":
          return 2005441023;
        case "lightslategrey":
          return 2005441023;
        case "lightsteelblue":
          return 2965692159;
        case "lightyellow":
          return 4294959359;
        case "lime":
          return 16711935;
        case "limegreen":
          return 852308735;
        case "linen":
          return 4210091775;
        case "magenta":
          return 4278255615;
        case "maroon":
          return 2147483903;
        case "mediumaquamarine":
          return 1724754687;
        case "mediumblue":
          return 52735;
        case "mediumorchid":
          return 3126187007;
        case "mediumpurple":
          return 2473647103;
        case "mediumseagreen":
          return 1018393087;
        case "mediumslateblue":
          return 2070474495;
        case "mediumspringgreen":
          return 16423679;
        case "mediumturquoise":
          return 1221709055;
        case "mediumvioletred":
          return 3340076543;
        case "midnightblue":
          return 421097727;
        case "mintcream":
          return 4127193855;
        case "mistyrose":
          return 4293190143;
        case "moccasin":
          return 4293178879;
        case "navajowhite":
          return 4292783615;
        case "navy":
          return 33023;
        case "oldlace":
          return 4260751103;
        case "olive":
          return 2155872511;
        case "olivedrab":
          return 1804477439;
        case "orange":
          return 4289003775;
        case "orangered":
          return 4282712319;
        case "orchid":
          return 3664828159;
        case "palegoldenrod":
          return 4008225535;
        case "palegreen":
          return 2566625535;
        case "paleturquoise":
          return 2951671551;
        case "palevioletred":
          return 3681588223;
        case "papayawhip":
          return 4293907967;
        case "peachpuff":
          return 4292524543;
        case "peru":
          return 3448061951;
        case "pink":
          return 4290825215;
        case "plum":
          return 3718307327;
        case "powderblue":
          return 2967529215;
        case "purple":
          return 2147516671;
        case "rebeccapurple":
          return 1714657791;
        case "red":
          return 4278190335;
        case "rosybrown":
          return 3163525119;
        case "royalblue":
          return 1097458175;
        case "saddlebrown":
          return 2336560127;
        case "salmon":
          return 4202722047;
        case "sandybrown":
          return 4104413439;
        case "seagreen":
          return 780883967;
        case "seashell":
          return 4294307583;
        case "sienna":
          return 2689740287;
        case "silver":
          return 3233857791;
        case "skyblue":
          return 2278484991;
        case "slateblue":
          return 1784335871;
        case "slategray":
          return 1887473919;
        case "slategrey":
          return 1887473919;
        case "snow":
          return 4294638335;
        case "springgreen":
          return 16744447;
        case "steelblue":
          return 1182971135;
        case "tan":
          return 3535047935;
        case "teal":
          return 8421631;
        case "thistle":
          return 3636451583;
        case "tomato":
          return 4284696575;
        case "turquoise":
          return 1088475391;
        case "violet":
          return 4001558271;
        case "wheat":
          return 4125012991;
        case "white":
          return 4294967295;
        case "whitesmoke":
          return 4126537215;
        case "yellow":
          return 4294902015;
        case "yellowgreen":
          return 2597139199;
      }
      return null;
    }
    __name(normalizeKeyword, "normalizeKeyword");
    module.exports = normalizeColor4;
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/capitalizeString.js
var require_capitalizeString = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/capitalizeString.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = capitalizeString;
    function capitalizeString(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    __name(capitalizeString, "capitalizeString");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/prefixProperty.js
var require_prefixProperty = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/prefixProperty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = prefixProperty;
    var _capitalizeString = require_capitalizeString();
    var _capitalizeString2 = _interopRequireDefault(_capitalizeString);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function prefixProperty(prefixProperties, property, style) {
      var requiredPrefixes = prefixProperties[property];
      if (requiredPrefixes && style.hasOwnProperty(property)) {
        var capitalizedProperty = (0, _capitalizeString2.default)(property);
        for (var i = 0; i < requiredPrefixes.length; ++i) {
          var prefixedProperty = requiredPrefixes[i] + capitalizedProperty;
          if (!style[prefixedProperty]) {
            style[prefixedProperty] = style[property];
          }
        }
      }
      return style;
    }
    __name(prefixProperty, "prefixProperty");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/prefixValue.js
var require_prefixValue = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/prefixValue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = prefixValue;
    function prefixValue(plugins, property, value, style, metaData) {
      for (var i = 0, len = plugins.length; i < len; ++i) {
        var processedValue = plugins[i](property, value, style, metaData);
        if (processedValue) {
          return processedValue;
        }
      }
    }
    __name(prefixValue, "prefixValue");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/addNewValuesOnly.js
var require_addNewValuesOnly = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/addNewValuesOnly.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = addNewValuesOnly;
    function addIfNew(list, value) {
      if (list.indexOf(value) === -1) {
        list.push(value);
      }
    }
    __name(addIfNew, "addIfNew");
    function addNewValuesOnly(list, values) {
      if (Array.isArray(values)) {
        for (var i = 0, len = values.length; i < len; ++i) {
          addIfNew(list, values[i]);
        }
      } else {
        addIfNew(list, values);
      }
    }
    __name(addNewValuesOnly, "addNewValuesOnly");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/isObject.js
var require_isObject = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/utils/isObject.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isObject;
    function isObject(value) {
      return value instanceof Object && !Array.isArray(value);
    }
    __name(isObject, "isObject");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/createPrefixer.js
var require_createPrefixer = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/createPrefixer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = createPrefixer2;
    var _prefixProperty = require_prefixProperty();
    var _prefixProperty2 = _interopRequireDefault(_prefixProperty);
    var _prefixValue = require_prefixValue();
    var _prefixValue2 = _interopRequireDefault(_prefixValue);
    var _addNewValuesOnly = require_addNewValuesOnly();
    var _addNewValuesOnly2 = _interopRequireDefault(_addNewValuesOnly);
    var _isObject = require_isObject();
    var _isObject2 = _interopRequireDefault(_isObject);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function createPrefixer2(_ref) {
      var prefixMap = _ref.prefixMap, plugins = _ref.plugins;
      return /* @__PURE__ */ __name(function prefix(style) {
        for (var property in style) {
          var value = style[property];
          if ((0, _isObject2.default)(value)) {
            style[property] = prefix(value);
          } else if (Array.isArray(value)) {
            var combinedValue = [];
            for (var i = 0, len = value.length; i < len; ++i) {
              var processedValue = (0, _prefixValue2.default)(plugins, property, value[i], style, prefixMap);
              (0, _addNewValuesOnly2.default)(combinedValue, processedValue || value[i]);
            }
            if (combinedValue.length > 0) {
              style[property] = combinedValue;
            }
          } else {
            var _processedValue = (0, _prefixValue2.default)(plugins, property, value, style, prefixMap);
            if (_processedValue) {
              style[property] = _processedValue;
            }
            style = (0, _prefixProperty2.default)(prefixMap, property, style);
          }
        }
        return style;
      }, "prefix");
    }
    __name(createPrefixer2, "createPrefixer");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/assignStyle.js
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = /* @__PURE__ */ __name(function _typeof2(obj2) {
      return typeof obj2;
    }, "_typeof");
  } else {
    _typeof = /* @__PURE__ */ __name(function _typeof2(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    }, "_typeof");
  }
  return _typeof(obj);
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
function filterUniqueArray(arr) {
  return arr.filter(function(val, index2) {
    return arr.lastIndexOf(val) === index2;
  });
}
function assignStyle(base) {
  for (var i = 0, len = arguments.length <= 1 ? 0 : arguments.length - 1; i < len; ++i) {
    var style = i + 1 < 1 || arguments.length <= i + 1 ? void 0 : arguments[i + 1];
    for (var property in style) {
      var value = style[property];
      var baseValue = base[property];
      if (baseValue && value) {
        if (Array.isArray(baseValue)) {
          base[property] = filterUniqueArray(baseValue.concat(value));
          continue;
        }
        if (Array.isArray(value)) {
          base[property] = filterUniqueArray([baseValue].concat(_toConsumableArray(value)));
          continue;
        }
        if (_typeof(value) === "object") {
          base[property] = assignStyle({}, baseValue, value);
          continue;
        }
      }
      base[property] = value;
    }
  }
  return base;
}
var init_assignStyle = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/assignStyle.js"() {
    __name(_typeof, "_typeof");
    __name(_toConsumableArray, "_toConsumableArray");
    __name(_nonIterableSpread, "_nonIterableSpread");
    __name(_unsupportedIterableToArray, "_unsupportedIterableToArray");
    __name(_iterableToArray, "_iterableToArray");
    __name(_arrayWithoutHoles, "_arrayWithoutHoles");
    __name(_arrayLikeToArray, "_arrayLikeToArray");
    __name(filterUniqueArray, "filterUniqueArray");
    __name(assignStyle, "assignStyle");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/camelCaseProperty.js
function toUpper(match) {
  return match[1].toUpperCase();
}
function camelCaseProperty(property) {
  if (cache3.hasOwnProperty(property)) {
    return cache3[property];
  }
  var camelProp = property.replace(DASH, toUpper).replace(MS, "ms");
  cache3[property] = camelProp;
  return camelProp;
}
var DASH, MS, cache3;
var init_camelCaseProperty = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/camelCaseProperty.js"() {
    DASH = /-([a-z])/g;
    MS = /^Ms/g;
    cache3 = {};
    __name(toUpper, "toUpper");
    __name(camelCaseProperty, "camelCaseProperty");
  }
});

// node_modules/.pnpm/hyphenate-style-name@1.1.0/node_modules/hyphenate-style-name/index.js
var hyphenate_style_name_exports = {};
__export(hyphenate_style_name_exports, {
  default: () => hyphenate_style_name_default
});
function toHyphenLower2(match) {
  return "-" + match.toLowerCase();
}
function hyphenateStyleName2(name) {
  if (cache4.hasOwnProperty(name)) {
    return cache4[name];
  }
  var hName = name.replace(uppercasePattern2, toHyphenLower2);
  return cache4[name] = msPattern2.test(hName) ? "-" + hName : hName;
}
var uppercasePattern2, msPattern2, cache4, hyphenate_style_name_default;
var init_hyphenate_style_name = __esm({
  "node_modules/.pnpm/hyphenate-style-name@1.1.0/node_modules/hyphenate-style-name/index.js"() {
    uppercasePattern2 = /[A-Z]/g;
    msPattern2 = /^ms-/;
    cache4 = {};
    __name(toHyphenLower2, "toHyphenLower");
    __name(hyphenateStyleName2, "hyphenateStyleName");
    hyphenate_style_name_default = hyphenateStyleName2;
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/hyphenateProperty.js
function hyphenateProperty(property) {
  return hyphenate_style_name_default(property);
}
var init_hyphenateProperty = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/hyphenateProperty.js"() {
    init_hyphenate_style_name();
    __name(hyphenateProperty, "hyphenateProperty");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/cssifyDeclaration.js
function cssifyDeclaration(property, value) {
  return hyphenateProperty(property) + ":" + value;
}
var init_cssifyDeclaration = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/cssifyDeclaration.js"() {
    init_hyphenateProperty();
    __name(cssifyDeclaration, "cssifyDeclaration");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/cssifyObject.js
function cssifyObject(style) {
  var css = "";
  for (var property in style) {
    var value = style[property];
    if (typeof value !== "string" && typeof value !== "number") {
      continue;
    }
    if (css) {
      css += ";";
    }
    css += cssifyDeclaration(property, value);
  }
  return css;
}
var init_cssifyObject = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/cssifyObject.js"() {
    init_cssifyDeclaration();
    __name(cssifyObject, "cssifyObject");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/isPrefixedProperty.js
function isPrefixedProperty(property) {
  return RE.test(property);
}
var RE;
var init_isPrefixedProperty = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/isPrefixedProperty.js"() {
    RE = /^(Webkit|Moz|O|ms)/;
    __name(isPrefixedProperty, "isPrefixedProperty");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/isPrefixedValue.js
function isPrefixedValue(value) {
  return typeof value === "string" && RE2.test(value);
}
var RE2;
var init_isPrefixedValue = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/isPrefixedValue.js"() {
    RE2 = /-webkit-|-moz-|-ms-/;
    __name(isPrefixedValue, "isPrefixedValue");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/isUnitlessProperty.js
function getPrefixedProperty(prefix, property) {
  return prefix + property.charAt(0).toUpperCase() + property.slice(1);
}
function isUnitlessProperty(property) {
  return unitlessProperties.hasOwnProperty(property);
}
var unitlessProperties, prefixedUnitlessProperties, prefixes2, property, j, jLen, i, len, _property;
var init_isUnitlessProperty = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/isUnitlessProperty.js"() {
    init_hyphenateProperty();
    unitlessProperties = {
      borderImageOutset: true,
      borderImageSlice: true,
      borderImageWidth: true,
      fontWeight: true,
      lineHeight: true,
      opacity: true,
      orphans: true,
      tabSize: true,
      widows: true,
      zIndex: true,
      zoom: true,
      // SVG-related properties
      fillOpacity: true,
      floodOpacity: true,
      stopOpacity: true,
      strokeDasharray: true,
      strokeDashoffset: true,
      strokeMiterlimit: true,
      strokeOpacity: true,
      strokeWidth: true
    };
    prefixedUnitlessProperties = ["animationIterationCount", "boxFlex", "boxFlexGroup", "boxOrdinalGroup", "columnCount", "flex", "flexGrow", "flexPositive", "flexShrink", "flexNegative", "flexOrder", "gridColumn", "gridColumnEnd", "gridColumnStart", "gridRow", "gridRowEnd", "gridRowStart", "lineClamp", "order"];
    prefixes2 = ["Webkit", "ms", "Moz", "O"];
    __name(getPrefixedProperty, "getPrefixedProperty");
    for (i = 0, len = prefixedUnitlessProperties.length; i < len; ++i) {
      property = prefixedUnitlessProperties[i];
      unitlessProperties[property] = true;
      for (j = 0, jLen = prefixes2.length; j < jLen; ++j) {
        unitlessProperties[getPrefixedProperty(prefixes2[j], property)] = true;
      }
    }
    for (_property in unitlessProperties) {
      unitlessProperties[hyphenateProperty(_property)] = true;
    }
    __name(isUnitlessProperty, "isUnitlessProperty");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/unprefixProperty.js
function unprefixProperty(property) {
  var propertyWithoutPrefix = property.replace(RE3, "");
  return propertyWithoutPrefix.charAt(0).toLowerCase() + propertyWithoutPrefix.slice(1);
}
var RE3;
var init_unprefixProperty = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/unprefixProperty.js"() {
    RE3 = /^(ms|Webkit|Moz|O)/;
    __name(unprefixProperty, "unprefixProperty");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/normalizeProperty.js
function normalizeProperty(property) {
  return unprefixProperty(camelCaseProperty(property));
}
var init_normalizeProperty = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/normalizeProperty.js"() {
    init_camelCaseProperty();
    init_unprefixProperty();
    __name(normalizeProperty, "normalizeProperty");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/resolveArrayValue.js
function resolveArrayValue(property, value) {
  return value.join(";" + hyphenateProperty(property) + ":");
}
var init_resolveArrayValue = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/resolveArrayValue.js"() {
    init_hyphenateProperty();
    __name(resolveArrayValue, "resolveArrayValue");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/unprefixValue.js
function unprefixValue(value) {
  if (typeof value === "string") {
    return value.replace(RE4, "");
  }
  return value;
}
var RE4;
var init_unprefixValue = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/unprefixValue.js"() {
    RE4 = /(-ms-|-webkit-|-moz-|-o-)/g;
    __name(unprefixValue, "unprefixValue");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/index.js
var es_exports = {};
__export(es_exports, {
  assignStyle: () => assignStyle,
  camelCaseProperty: () => camelCaseProperty,
  cssifyDeclaration: () => cssifyDeclaration,
  cssifyObject: () => cssifyObject,
  hyphenateProperty: () => hyphenateProperty,
  isPrefixedProperty: () => isPrefixedProperty,
  isPrefixedValue: () => isPrefixedValue,
  isUnitlessProperty: () => isUnitlessProperty,
  normalizeProperty: () => normalizeProperty,
  resolveArrayValue: () => resolveArrayValue,
  unprefixProperty: () => unprefixProperty,
  unprefixValue: () => unprefixValue
});
var init_es = __esm({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/es/index.js"() {
    init_assignStyle();
    init_camelCaseProperty();
    init_cssifyDeclaration();
    init_cssifyObject();
    init_hyphenateProperty();
    init_isPrefixedProperty();
    init_isPrefixedValue();
    init_isUnitlessProperty();
    init_normalizeProperty();
    init_resolveArrayValue();
    init_unprefixProperty();
    init_unprefixValue();
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/crossFade.js
var require_crossFade = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/crossFade.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = crossFade2;
    var _cssInJsUtils = (init_es(), __toCommonJS(es_exports));
    var CROSS_FADE_REGEX = /cross-fade\(/g;
    var prefixes4 = ["-webkit-", ""];
    function crossFade2(property, value) {
      if (typeof value === "string" && !(0, _cssInJsUtils.isPrefixedValue)(value) && value.indexOf("cross-fade(") !== -1) {
        return prefixes4.map(function(prefix) {
          return value.replace(CROSS_FADE_REGEX, prefix + "cross-fade(");
        });
      }
    }
    __name(crossFade2, "crossFade");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/lib/isPrefixedValue.js
var require_isPrefixedValue = __commonJS({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/lib/isPrefixedValue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = isPrefixedValue2;
    var RE5 = /-webkit-|-moz-|-ms-/;
    function isPrefixedValue2(value) {
      return typeof value === "string" && RE5.test(value);
    }
    __name(isPrefixedValue2, "isPrefixedValue");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/imageSet.js
var require_imageSet = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/imageSet.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = imageSet2;
    var _isPrefixedValue = require_isPrefixedValue();
    var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    var prefixes4 = ["-webkit-", ""];
    function imageSet2(property, value) {
      if (typeof value === "string" && !(0, _isPrefixedValue2.default)(value) && value.indexOf("image-set(") > -1) {
        return prefixes4.map(function(prefix) {
          return value.replace(/image-set\(/g, prefix + "image-set(");
        });
      }
    }
    __name(imageSet2, "imageSet");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/logical.js
var require_logical = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/logical.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = logical2;
    var alternativeProps = {
      marginBlockStart: ["WebkitMarginBefore"],
      marginBlockEnd: ["WebkitMarginAfter"],
      marginInlineStart: ["WebkitMarginStart", "MozMarginStart"],
      marginInlineEnd: ["WebkitMarginEnd", "MozMarginEnd"],
      paddingBlockStart: ["WebkitPaddingBefore"],
      paddingBlockEnd: ["WebkitPaddingAfter"],
      paddingInlineStart: ["WebkitPaddingStart", "MozPaddingStart"],
      paddingInlineEnd: ["WebkitPaddingEnd", "MozPaddingEnd"],
      borderBlockStart: ["WebkitBorderBefore"],
      borderBlockStartColor: ["WebkitBorderBeforeColor"],
      borderBlockStartStyle: ["WebkitBorderBeforeStyle"],
      borderBlockStartWidth: ["WebkitBorderBeforeWidth"],
      borderBlockEnd: ["WebkitBorderAfter"],
      borderBlockEndColor: ["WebkitBorderAfterColor"],
      borderBlockEndStyle: ["WebkitBorderAfterStyle"],
      borderBlockEndWidth: ["WebkitBorderAfterWidth"],
      borderInlineStart: ["WebkitBorderStart", "MozBorderStart"],
      borderInlineStartColor: ["WebkitBorderStartColor", "MozBorderStartColor"],
      borderInlineStartStyle: ["WebkitBorderStartStyle", "MozBorderStartStyle"],
      borderInlineStartWidth: ["WebkitBorderStartWidth", "MozBorderStartWidth"],
      borderInlineEnd: ["WebkitBorderEnd", "MozBorderEnd"],
      borderInlineEndColor: ["WebkitBorderEndColor", "MozBorderEndColor"],
      borderInlineEndStyle: ["WebkitBorderEndStyle", "MozBorderEndStyle"],
      borderInlineEndWidth: ["WebkitBorderEndWidth", "MozBorderEndWidth"]
    };
    function logical2(property, value, style) {
      if (Object.prototype.hasOwnProperty.call(alternativeProps, property)) {
        var alternativePropList = alternativeProps[property];
        for (var i = 0, len = alternativePropList.length; i < len; ++i) {
          style[alternativePropList[i]] = value;
        }
      }
    }
    __name(logical2, "logical");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/position.js
var require_position = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/position.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = position2;
    function position2(property, value) {
      if (property === "position" && value === "sticky") {
        return ["-webkit-sticky", "sticky"];
      }
    }
    __name(position2, "position");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/sizing.js
var require_sizing = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/sizing.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = sizing2;
    var prefixes4 = ["-webkit-", "-moz-", ""];
    var properties = {
      maxHeight: true,
      maxWidth: true,
      width: true,
      height: true,
      columnWidth: true,
      minWidth: true,
      minHeight: true
    };
    var values = {
      "min-content": true,
      "max-content": true,
      "fill-available": true,
      "fit-content": true,
      "contain-floats": true
    };
    function sizing2(property, value) {
      if (properties.hasOwnProperty(property) && values.hasOwnProperty(value)) {
        return prefixes4.map(function(prefix) {
          return prefix + value;
        });
      }
    }
    __name(sizing2, "sizing");
  }
});

// node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/lib/hyphenateProperty.js
var require_hyphenateProperty = __commonJS({
  "node_modules/.pnpm/css-in-js-utils@3.1.0/node_modules/css-in-js-utils/lib/hyphenateProperty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = hyphenateProperty2;
    var _hyphenateStyleName = (init_hyphenate_style_name(), __toCommonJS(hyphenate_style_name_exports));
    var _hyphenateStyleName2 = _interopRequireDefault(_hyphenateStyleName);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function hyphenateProperty2(property) {
      return (0, _hyphenateStyleName2["default"])(property);
    }
    __name(hyphenateProperty2, "hyphenateProperty");
  }
});

// node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/transition.js
var require_transition = __commonJS({
  "node_modules/.pnpm/inline-style-prefixer@7.0.1/node_modules/inline-style-prefixer/lib/plugins/transition.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = transition2;
    var _hyphenateProperty = require_hyphenateProperty();
    var _hyphenateProperty2 = _interopRequireDefault(_hyphenateProperty);
    var _isPrefixedValue = require_isPrefixedValue();
    var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);
    var _capitalizeString = require_capitalizeString();
    var _capitalizeString2 = _interopRequireDefault(_capitalizeString);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    var properties = {
      transition: true,
      transitionProperty: true,
      WebkitTransition: true,
      WebkitTransitionProperty: true,
      MozTransition: true,
      MozTransitionProperty: true
    };
    var prefixMapping = {
      Webkit: "-webkit-",
      Moz: "-moz-",
      ms: "-ms-"
    };
    function prefixValue(value, propertyPrefixMap) {
      if ((0, _isPrefixedValue2.default)(value)) {
        return value;
      }
      var multipleValues = value.split(/,(?![^()]*(?:\([^()]*\))?\))/g);
      for (var i = 0, len = multipleValues.length; i < len; ++i) {
        var singleValue = multipleValues[i];
        var values = [singleValue];
        for (var property in propertyPrefixMap) {
          var dashCaseProperty = (0, _hyphenateProperty2.default)(property);
          if (singleValue.indexOf(dashCaseProperty) > -1 && dashCaseProperty !== "order") {
            var prefixes4 = propertyPrefixMap[property];
            for (var j = 0, pLen = prefixes4.length; j < pLen; ++j) {
              values.unshift(singleValue.replace(dashCaseProperty, prefixMapping[prefixes4[j]] + dashCaseProperty));
            }
          }
        }
        multipleValues[i] = values.join(",");
      }
      return multipleValues.join(",");
    }
    __name(prefixValue, "prefixValue");
    function transition2(property, value, style, propertyPrefixMap) {
      if (typeof value === "string" && properties.hasOwnProperty(property)) {
        var outputValue = prefixValue(value, propertyPrefixMap);
        var webkitOutput = outputValue.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function(val) {
          return !/-moz-|-ms-/.test(val);
        }).join(",");
        if (property.indexOf("Webkit") > -1) {
          return webkitOutput;
        }
        var mozOutput = outputValue.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function(val) {
          return !/-webkit-|-ms-/.test(val);
        }).join(",");
        if (property.indexOf("Moz") > -1) {
          return mozOutput;
        }
        style["Webkit" + (0, _capitalizeString2.default)(property)] = webkitOutput;
        style["Moz" + (0, _capitalizeString2.default)(property)] = mozOutput;
        return outputValue;
      }
    }
    __name(transition2, "transition");
  }
});

// node_modules/.pnpm/styleq@0.1.3/node_modules/styleq/dist/transform-localize-style.js
var require_transform_localize_style = __commonJS({
  "node_modules/.pnpm/styleq@0.1.3/node_modules/styleq/dist/transform-localize-style.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.localizeStyle = localizeStyle2;
    var cache7 = /* @__PURE__ */ new WeakMap();
    var markerProp = "$$css$localize";
    function compileStyle(style, isRTL2) {
      var compiledStyle = {};
      for (var prop in style) {
        if (prop !== markerProp) {
          var value = style[prop];
          if (Array.isArray(value)) {
            compiledStyle[prop] = isRTL2 ? value[1] : value[0];
          } else {
            compiledStyle[prop] = value;
          }
        }
      }
      return compiledStyle;
    }
    __name(compileStyle, "compileStyle");
    function localizeStyle2(style, isRTL2) {
      if (style[markerProp] != null) {
        var compiledStyleIndex = isRTL2 ? 1 : 0;
        if (cache7.has(style)) {
          var _cachedStyles = cache7.get(style);
          var _compiledStyle = _cachedStyles[compiledStyleIndex];
          if (_compiledStyle == null) {
            _compiledStyle = compileStyle(style, isRTL2);
            _cachedStyles[compiledStyleIndex] = _compiledStyle;
            cache7.set(style, _cachedStyles);
          }
          return _compiledStyle;
        }
        var compiledStyle = compileStyle(style, isRTL2);
        var cachedStyles = new Array(2);
        cachedStyles[compiledStyleIndex] = compiledStyle;
        cache7.set(style, cachedStyles);
        return compiledStyle;
      }
      return style;
    }
    __name(localizeStyle2, "localizeStyle");
  }
});

// node_modules/.pnpm/styleq@0.1.3/node_modules/styleq/transform-localize-style.js
var require_transform_localize_style2 = __commonJS({
  "node_modules/.pnpm/styleq@0.1.3/node_modules/styleq/transform-localize-style.js"(exports, module) {
    module.exports = require_transform_localize_style();
  }
});

// node_modules/.pnpm/styleq@0.1.3/node_modules/styleq/dist/styleq.js
var require_styleq = __commonJS({
  "node_modules/.pnpm/styleq@0.1.3/node_modules/styleq/dist/styleq.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.styleq = void 0;
    var cache7 = /* @__PURE__ */ new WeakMap();
    var compiledKey = "$$css";
    function createStyleq(options) {
      var disableCache;
      var disableMix;
      var transform;
      if (options != null) {
        disableCache = options.disableCache === true;
        disableMix = options.disableMix === true;
        transform = options.transform;
      }
      return /* @__PURE__ */ __name(function styleq3() {
        var definedProperties = [];
        var className = "";
        var inlineStyle = null;
        var nextCache = disableCache ? null : cache7;
        var styles5 = new Array(arguments.length);
        for (var i = 0; i < arguments.length; i++) {
          styles5[i] = arguments[i];
        }
        while (styles5.length > 0) {
          var possibleStyle = styles5.pop();
          if (possibleStyle == null || possibleStyle === false) {
            continue;
          }
          if (Array.isArray(possibleStyle)) {
            for (var _i = 0; _i < possibleStyle.length; _i++) {
              styles5.push(possibleStyle[_i]);
            }
            continue;
          }
          var style = transform != null ? transform(possibleStyle) : possibleStyle;
          if (style.$$css) {
            var classNameChunk = "";
            if (nextCache != null && nextCache.has(style)) {
              var cacheEntry = nextCache.get(style);
              if (cacheEntry != null) {
                classNameChunk = cacheEntry[0];
                definedProperties.push.apply(definedProperties, cacheEntry[1]);
                nextCache = cacheEntry[2];
              }
            } else {
              var definedPropertiesChunk = [];
              for (var prop in style) {
                var value = style[prop];
                if (prop === compiledKey) continue;
                if (typeof value === "string" || value === null) {
                  if (!definedProperties.includes(prop)) {
                    definedProperties.push(prop);
                    if (nextCache != null) {
                      definedPropertiesChunk.push(prop);
                    }
                    if (typeof value === "string") {
                      classNameChunk += classNameChunk ? " " + value : value;
                    }
                  }
                } else {
                  console.error("styleq: ".concat(prop, " typeof ").concat(String(value), ' is not "string" or "null".'));
                }
              }
              if (nextCache != null) {
                var weakMap = /* @__PURE__ */ new WeakMap();
                nextCache.set(style, [classNameChunk, definedPropertiesChunk, weakMap]);
                nextCache = weakMap;
              }
            }
            if (classNameChunk) {
              className = className ? classNameChunk + " " + className : classNameChunk;
            }
          } else {
            if (disableMix) {
              if (inlineStyle == null) {
                inlineStyle = {};
              }
              inlineStyle = Object.assign({}, style, inlineStyle);
            } else {
              var subStyle = null;
              for (var _prop in style) {
                var _value = style[_prop];
                if (_value !== void 0) {
                  if (!definedProperties.includes(_prop)) {
                    if (_value != null) {
                      if (inlineStyle == null) {
                        inlineStyle = {};
                      }
                      if (subStyle == null) {
                        subStyle = {};
                      }
                      subStyle[_prop] = _value;
                    }
                    definedProperties.push(_prop);
                    nextCache = null;
                  }
                }
              }
              if (subStyle != null) {
                inlineStyle = Object.assign(subStyle, inlineStyle);
              }
            }
          }
        }
        var styleProps2 = [className, inlineStyle];
        return styleProps2;
      }, "styleq");
    }
    __name(createStyleq, "createStyleq");
    var styleq2 = createStyleq();
    exports.styleq = styleq2;
    styleq2.factory = createStyleq;
  }
});

// node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/parse.js
var require_parse = __commonJS({
  "node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/parse.js"(exports, module) {
    var openParentheses = "(".charCodeAt(0);
    var closeParentheses = ")".charCodeAt(0);
    var singleQuote = "'".charCodeAt(0);
    var doubleQuote = '"'.charCodeAt(0);
    var backslash = "\\".charCodeAt(0);
    var slash = "/".charCodeAt(0);
    var comma = ",".charCodeAt(0);
    var colon = ":".charCodeAt(0);
    var star = "*".charCodeAt(0);
    var uLower = "u".charCodeAt(0);
    var uUpper = "U".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var isUnicodeRange = /^[a-f0-9?-]+$/i;
    module.exports = function(input) {
      var tokens = [];
      var value = input;
      var next, quote, prev, token, escape, escapePos, whitespacePos, parenthesesOpenPos;
      var pos = 0;
      var code = value.charCodeAt(pos);
      var max2 = value.length;
      var stack = [{ nodes: tokens }];
      var balanced = 0;
      var parent;
      var name = "";
      var before = "";
      var after = "";
      while (pos < max2) {
        if (code <= 32) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          token = value.slice(pos, next);
          prev = tokens[tokens.length - 1];
          if (code === closeParentheses && balanced) {
            after = token;
          } else if (prev && prev.type === "div") {
            prev.after = token;
            prev.sourceEndIndex += token.length;
          } else if (code === comma || code === colon || code === slash && value.charCodeAt(next + 1) !== star && (!parent || parent && parent.type === "function" && parent.value !== "calc")) {
            before = token;
          } else {
            tokens.push({
              type: "space",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        } else if (code === singleQuote || code === doubleQuote) {
          next = pos;
          quote = code === singleQuote ? "'" : '"';
          token = {
            type: "string",
            sourceIndex: pos,
            quote
          };
          do {
            escape = false;
            next = value.indexOf(quote, next + 1);
            if (~next) {
              escapePos = next;
              while (value.charCodeAt(escapePos - 1) === backslash) {
                escapePos -= 1;
                escape = !escape;
              }
            } else {
              value += quote;
              next = value.length - 1;
              token.unclosed = true;
            }
          } while (escape);
          token.value = value.slice(pos + 1, next);
          token.sourceEndIndex = token.unclosed ? next : next + 1;
          tokens.push(token);
          pos = next + 1;
          code = value.charCodeAt(pos);
        } else if (code === slash && value.charCodeAt(pos + 1) === star) {
          next = value.indexOf("*/", pos);
          token = {
            type: "comment",
            sourceIndex: pos,
            sourceEndIndex: next + 2
          };
          if (next === -1) {
            token.unclosed = true;
            next = value.length;
            token.sourceEndIndex = next;
          }
          token.value = value.slice(pos + 2, next);
          tokens.push(token);
          pos = next + 2;
          code = value.charCodeAt(pos);
        } else if ((code === slash || code === star) && parent && parent.type === "function" && parent.value === "calc") {
          token = value[pos];
          tokens.push({
            type: "word",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token
          });
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (code === slash || code === comma || code === colon) {
          token = value[pos];
          tokens.push({
            type: "div",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token,
            before,
            after: ""
          });
          before = "";
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (openParentheses === code) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          parenthesesOpenPos = pos;
          token = {
            type: "function",
            sourceIndex: pos - name.length,
            value: name,
            before: value.slice(parenthesesOpenPos + 1, next)
          };
          pos = next;
          if (name === "url" && code !== singleQuote && code !== doubleQuote) {
            next -= 1;
            do {
              escape = false;
              next = value.indexOf(")", next + 1);
              if (~next) {
                escapePos = next;
                while (value.charCodeAt(escapePos - 1) === backslash) {
                  escapePos -= 1;
                  escape = !escape;
                }
              } else {
                value += ")";
                next = value.length - 1;
                token.unclosed = true;
              }
            } while (escape);
            whitespacePos = next;
            do {
              whitespacePos -= 1;
              code = value.charCodeAt(whitespacePos);
            } while (code <= 32);
            if (parenthesesOpenPos < whitespacePos) {
              if (pos !== whitespacePos + 1) {
                token.nodes = [
                  {
                    type: "word",
                    sourceIndex: pos,
                    sourceEndIndex: whitespacePos + 1,
                    value: value.slice(pos, whitespacePos + 1)
                  }
                ];
              } else {
                token.nodes = [];
              }
              if (token.unclosed && whitespacePos + 1 !== next) {
                token.after = "";
                token.nodes.push({
                  type: "space",
                  sourceIndex: whitespacePos + 1,
                  sourceEndIndex: next,
                  value: value.slice(whitespacePos + 1, next)
                });
              } else {
                token.after = value.slice(whitespacePos + 1, next);
                token.sourceEndIndex = next;
              }
            } else {
              token.after = "";
              token.nodes = [];
            }
            pos = next + 1;
            token.sourceEndIndex = token.unclosed ? next : pos;
            code = value.charCodeAt(pos);
            tokens.push(token);
          } else {
            balanced += 1;
            token.after = "";
            token.sourceEndIndex = pos + 1;
            tokens.push(token);
            stack.push(token);
            tokens = token.nodes = [];
            parent = token;
          }
          name = "";
        } else if (closeParentheses === code && balanced) {
          pos += 1;
          code = value.charCodeAt(pos);
          parent.after = after;
          parent.sourceEndIndex += after.length;
          after = "";
          balanced -= 1;
          stack[stack.length - 1].sourceEndIndex = pos;
          stack.pop();
          parent = stack[balanced];
          tokens = parent.nodes;
        } else {
          next = pos;
          do {
            if (code === backslash) {
              next += 1;
            }
            next += 1;
            code = value.charCodeAt(next);
          } while (next < max2 && !(code <= 32 || code === singleQuote || code === doubleQuote || code === comma || code === colon || code === slash || code === openParentheses || code === star && parent && parent.type === "function" && parent.value === "calc" || code === slash && parent.type === "function" && parent.value === "calc" || code === closeParentheses && balanced));
          token = value.slice(pos, next);
          if (openParentheses === code) {
            name = token;
          } else if ((uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) && plus === token.charCodeAt(1) && isUnicodeRange.test(token.slice(2))) {
            tokens.push({
              type: "unicode-range",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          } else {
            tokens.push({
              type: "word",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        }
      }
      for (pos = stack.length - 1; pos; pos -= 1) {
        stack[pos].unclosed = true;
        stack[pos].sourceEndIndex = value.length;
      }
      return stack[0].nodes;
    };
  }
});

// node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/walk.js
var require_walk = __commonJS({
  "node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/walk.js"(exports, module) {
    module.exports = /* @__PURE__ */ __name(function walk(nodes, cb, bubble) {
      var i, max2, node, result;
      for (i = 0, max2 = nodes.length; i < max2; i += 1) {
        node = nodes[i];
        if (!bubble) {
          result = cb(node, i, nodes);
        }
        if (result !== false && node.type === "function" && Array.isArray(node.nodes)) {
          walk(node.nodes, cb, bubble);
        }
        if (bubble) {
          cb(node, i, nodes);
        }
      }
    }, "walk");
  }
});

// node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/stringify.js"(exports, module) {
    function stringifyNode(node, custom) {
      var type = node.type;
      var value = node.value;
      var buf;
      var customResult;
      if (custom && (customResult = custom(node)) !== void 0) {
        return customResult;
      } else if (type === "word" || type === "space") {
        return value;
      } else if (type === "string") {
        buf = node.quote || "";
        return buf + value + (node.unclosed ? "" : buf);
      } else if (type === "comment") {
        return "/*" + value + (node.unclosed ? "" : "*/");
      } else if (type === "div") {
        return (node.before || "") + value + (node.after || "");
      } else if (Array.isArray(node.nodes)) {
        buf = stringify(node.nodes, custom);
        if (type !== "function") {
          return buf;
        }
        return value + "(" + (node.before || "") + buf + (node.after || "") + (node.unclosed ? "" : ")");
      }
      return value;
    }
    __name(stringifyNode, "stringifyNode");
    function stringify(nodes, custom) {
      var result, i;
      if (Array.isArray(nodes)) {
        result = "";
        for (i = nodes.length - 1; ~i; i -= 1) {
          result = stringifyNode(nodes[i], custom) + result;
        }
        return result;
      }
      return stringifyNode(nodes, custom);
    }
    __name(stringify, "stringify");
    module.exports = stringify;
  }
});

// node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/unit.js
var require_unit = __commonJS({
  "node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/unit.js"(exports, module) {
    var minus = "-".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var dot = ".".charCodeAt(0);
    var exp = "e".charCodeAt(0);
    var EXP = "E".charCodeAt(0);
    function likeNumber(value) {
      var code = value.charCodeAt(0);
      var nextCode;
      if (code === plus || code === minus) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        var nextNextCode = value.charCodeAt(2);
        if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code === dot) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code >= 48 && code <= 57) {
        return true;
      }
      return false;
    }
    __name(likeNumber, "likeNumber");
    module.exports = function(value) {
      var pos = 0;
      var length = value.length;
      var code;
      var nextCode;
      var nextNextCode;
      if (length === 0 || !likeNumber(value)) {
        return false;
      }
      code = value.charCodeAt(pos);
      if (code === plus || code === minus) {
        pos++;
      }
      while (pos < length) {
        code = value.charCodeAt(pos);
        if (code < 48 || code > 57) {
          break;
        }
        pos += 1;
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      if (code === dot && nextCode >= 48 && nextCode <= 57) {
        pos += 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      nextNextCode = value.charCodeAt(pos + 2);
      if ((code === exp || code === EXP) && (nextCode >= 48 && nextCode <= 57 || (nextCode === plus || nextCode === minus) && nextNextCode >= 48 && nextNextCode <= 57)) {
        pos += nextCode === plus || nextCode === minus ? 3 : 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      return {
        number: value.slice(0, pos),
        unit: value.slice(pos)
      };
    };
  }
});

// node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/index.js"(exports, module) {
    var parse = require_parse();
    var walk = require_walk();
    var stringify = require_stringify();
    function ValueParser(value) {
      if (this instanceof ValueParser) {
        this.nodes = parse(value);
        return this;
      }
      return new ValueParser(value);
    }
    __name(ValueParser, "ValueParser");
    ValueParser.prototype.toString = function() {
      return Array.isArray(this.nodes) ? stringify(this.nodes) : "";
    };
    ValueParser.prototype.walk = function(cb, bubble) {
      walk(this.nodes, cb, bubble);
      return this;
    };
    ValueParser.unit = require_unit();
    ValueParser.walk = walk;
    ValueParser.stringify = stringify;
    module.exports = ValueParser;
  }
});

// node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/extends.js
var require_extends = __commonJS({
  "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/extends.js"(exports, module) {
    function _extends4() {
      return module.exports = _extends4 = Object.assign ? Object.assign.bind() : function(n) {
        for (var e = 1; e < arguments.length; e++) {
          var t = arguments[e];
          for (var r2 in t) ({}).hasOwnProperty.call(t, r2) && (n[r2] = t[r2]);
        }
        return n;
      }, module.exports.__esModule = true, module.exports["default"] = module.exports, _extends4.apply(null, arguments);
    }
    __name(_extends4, "_extends");
    module.exports = _extends4, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// node_modules/.pnpm/fbjs@3.0.5/node_modules/fbjs/lib/invariant.js
var require_invariant = __commonJS({
  "node_modules/.pnpm/fbjs@3.0.5/node_modules/fbjs/lib/invariant.js"(exports, module) {
    "use strict";
    var validateFormat = process.env.NODE_ENV !== "production" ? function(format) {
      if (format === void 0) {
        throw new Error("invariant(...): Second argument must be a string.");
      }
    } : function(format) {
    };
    function invariant3(condition, format) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      validateFormat(format);
      if (!condition) {
        var error2;
        if (format === void 0) {
          error2 = new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
        } else {
          var argIndex = 0;
          error2 = new Error(format.replace(/%s/g, function() {
            return String(args[argIndex++]);
          }));
          error2.name = "Invariant Violation";
        }
        error2.framesToPop = 1;
        throw error2;
      }
    }
    __name(invariant3, "invariant");
    module.exports = invariant3;
  }
});

// node_modules/.pnpm/fbjs@3.0.5/node_modules/fbjs/lib/emptyFunction.js
var require_emptyFunction = __commonJS({
  "node_modules/.pnpm/fbjs@3.0.5/node_modules/fbjs/lib/emptyFunction.js"(exports, module) {
    "use strict";
    function makeEmptyFunction(arg) {
      return function() {
        return arg;
      };
    }
    __name(makeEmptyFunction, "makeEmptyFunction");
    var emptyFunction2 = /* @__PURE__ */ __name(function emptyFunction3() {
    }, "emptyFunction");
    emptyFunction2.thatReturns = makeEmptyFunction;
    emptyFunction2.thatReturnsFalse = makeEmptyFunction(false);
    emptyFunction2.thatReturnsTrue = makeEmptyFunction(true);
    emptyFunction2.thatReturnsNull = makeEmptyFunction(null);
    emptyFunction2.thatReturnsThis = function() {
      return this;
    };
    emptyFunction2.thatReturnsArgument = function(arg) {
      return arg;
    };
    module.exports = emptyFunction2;
  }
});

// node_modules/.pnpm/fbjs@3.0.5/node_modules/fbjs/lib/warning.js
var require_warning = __commonJS({
  "node_modules/.pnpm/fbjs@3.0.5/node_modules/fbjs/lib/warning.js"(exports, module) {
    "use strict";
    var emptyFunction2 = require_emptyFunction();
    function printWarning(format) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      var argIndex = 0;
      var message = "Warning: " + format.replace(/%s/g, function() {
        return args[argIndex++];
      });
      if (typeof console !== "undefined") {
        console.error(message);
      }
      try {
        throw new Error(message);
      } catch (x) {
      }
    }
    __name(printWarning, "printWarning");
    var warning2 = process.env.NODE_ENV !== "production" ? function(condition, format) {
      if (format === void 0) {
        throw new Error("`warning(condition, format, ...args)` requires a warning message argument");
      }
      if (!condition) {
        for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }
        printWarning.apply(void 0, [format].concat(args));
      }
    } : emptyFunction2;
    module.exports = warning2;
  }
});

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/aspect-ratio.js
import { jsx as _jsx } from "react/jsx-runtime";

// node_modules/.pnpm/@hanzogui+animate-presence@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nativ_f9401707693c44dcf608757170d9f6b9/node_modules/@hanzogui/animate-presence/dist/esm/AnimatePresence.mjs
import { useInsertionEffect } from "react";

// node_modules/.pnpm/@hanzogui+use-constant@7.3.0_react@19.2.4/node_modules/@hanzogui/use-constant/dist/esm/index.mjs
import * as React from "react";
function useConstant(fn) {
  if (typeof document === "undefined") {
    return React.useMemo(() => fn(), []);
  }
  const ref = React.useRef(void 0);
  if (!ref.current) {
    ref.current = {
      v: fn()
    };
  }
  return ref.current.v;
}
__name(useConstant, "useConstant");

// node_modules/.pnpm/@hanzogui+use-force-update@7.3.0_react@19.2.4/node_modules/@hanzogui/use-force-update/dist/esm/index.mjs
import React2 from "react";
var isServerSide = typeof window === "undefined";
var idFn = /* @__PURE__ */ __name(() => {
}, "idFn");
function useForceUpdate() {
  return isServerSide ? idFn : React2.useReducer((x) => Math.random(), 0)[1];
}
__name(useForceUpdate, "useForceUpdate");

// node_modules/.pnpm/@hanzogui+animate-presence@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nativ_f9401707693c44dcf608757170d9f6b9/node_modules/@hanzogui/animate-presence/dist/esm/AnimatePresence.mjs
import { Children, isValidElement, useContext as useContext2, useMemo as useMemo3, useRef as useRef2, useState } from "react";

// node_modules/.pnpm/@hanzogui+animate-presence@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nativ_f9401707693c44dcf608757170d9f6b9/node_modules/@hanzogui/animate-presence/dist/esm/LayoutGroupContext.mjs
import React3 from "react";
var LayoutGroupContext = React3.createContext({});

// node_modules/.pnpm/@hanzogui+use-presence@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0._c163aef73ca28639ce86336456c1f2e3/node_modules/@hanzogui/use-presence/dist/esm/PresenceContext.mjs
import * as React4 from "react";
import { jsx } from "react/jsx-runtime";
var PresenceContext = React4.createContext(null);
var ResetPresence = /* @__PURE__ */ __name((props) => {
  const parent = React4.useContext(PresenceContext);
  return /* @__PURE__ */ jsx(PresenceContext.Provider, {
    value: props.disable ? parent : null,
    children: props.children
  });
}, "ResetPresence");

// node_modules/.pnpm/@hanzogui+animate-presence@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nativ_f9401707693c44dcf608757170d9f6b9/node_modules/@hanzogui/animate-presence/dist/esm/PresenceChild.mjs
import * as React5 from "react";
import { useId } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var PresenceChild = React5.memo(({
  children,
  initial,
  isPresent,
  onExitComplete,
  exitVariant,
  enterVariant,
  enterExitVariant,
  presenceAffectsLayout,
  custom
}) => {
  const presenceChildren = useConstant(newChildrenMap);
  const id = useId() || "";
  const context3 = React5.useMemo(
    () => {
      return {
        id,
        initial,
        isPresent,
        custom,
        exitVariant,
        enterVariant,
        enterExitVariant,
        onExitComplete: /* @__PURE__ */ __name(() => {
          presenceChildren.set(id, true);
          for (const isComplete of presenceChildren.values()) {
            if (!isComplete) {
              return;
            }
          }
          onExitComplete?.();
        }, "onExitComplete"),
        register: /* @__PURE__ */ __name(() => {
          presenceChildren.set(id, false);
          return () => presenceChildren.delete(id);
        }, "register")
      };
    },
    /**
     * If the presence of a child affects the layout of the components around it,
     * we want to make a new context value to ensure they get re-rendered
     * so they can detect that layout change.
     */
    // @ts-expect-error its ok
    presenceAffectsLayout ? void 0 : [isPresent, exitVariant, enterVariant]
  );
  React5.useMemo(() => {
    presenceChildren.forEach((_, key) => presenceChildren.set(key, false));
  }, [isPresent]);
  React5.useEffect(() => {
    !isPresent && !presenceChildren.size && onExitComplete?.();
  }, [isPresent]);
  return /* @__PURE__ */ jsx2(PresenceContext.Provider, {
    value: context3,
    children
  });
});
function newChildrenMap() {
  return /* @__PURE__ */ new Map();
}
__name(newChildrenMap, "newChildrenMap");

// node_modules/.pnpm/@hanzogui+animate-presence@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nativ_f9401707693c44dcf608757170d9f6b9/node_modules/@hanzogui/animate-presence/dist/esm/AnimatePresence.mjs
import { Fragment, jsx as jsx3 } from "react/jsx-runtime";
var getChildKey = /* @__PURE__ */ __name((child) => {
  return child.key || (() => {
    const ct = child.type;
    const defaultName = ct["displayName"] || ct["name"] || "";
    if (ct && typeof ct === "object" && "staticConfig" in ct) {
      return ct.staticConfig.componentName || defaultName;
    }
    return defaultName;
  })();
}, "getChildKey");
function onlyElements(children) {
  const filtered = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child)) filtered.push(child);
  });
  return filtered;
}
__name(onlyElements, "onlyElements");
var AnimatePresence = /* @__PURE__ */ __name(({
  children,
  enterVariant,
  exitVariant,
  enterExitVariant,
  initial = true,
  onExitComplete,
  exitBeforeEnter,
  mode,
  presenceAffectsLayout = true,
  custom,
  passThrough
}) => {
  const effectiveMode = mode ?? (exitBeforeEnter ? "wait" : "sync");
  const presentChildren = useMemo3(() => onlyElements(children), [children]);
  const presentKeys = presentChildren.map(getChildKey);
  const isInitialRender = useRef2(true);
  const frozenCustomRef = useRef2(/* @__PURE__ */ new Map());
  const pendingPresentChildren = useRef2(presentChildren);
  const exitComplete = useConstant(() => /* @__PURE__ */ new Map());
  const [diffedChildren, setDiffedChildren] = useState(presentChildren);
  const [renderedChildren, setRenderedChildren] = useState(presentChildren);
  const forceRender = useContext2(LayoutGroupContext).forceRender ?? useForceUpdate();
  if (passThrough) {
    return /* @__PURE__ */ jsx3(Fragment, {
      children
    });
  }
  useInsertionEffect(() => {
    isInitialRender.current = false;
    pendingPresentChildren.current = presentChildren;
    for (let i = 0; i < renderedChildren.length; i++) {
      const key = getChildKey(renderedChildren[i]);
      if (!presentKeys.includes(key)) {
        if (exitComplete.get(key) !== true) {
          exitComplete.set(key, false);
        }
      } else {
        exitComplete.delete(key);
        frozenCustomRef.current.delete(key);
      }
    }
  }, [renderedChildren, presentKeys.length, presentKeys.join("-")]);
  if (presentChildren !== diffedChildren) {
    let nextChildren = [...presentChildren];
    for (let i = 0; i < renderedChildren.length; i++) {
      const child = renderedChildren[i];
      const key = getChildKey(child);
      if (!presentKeys.includes(key)) {
        nextChildren.splice(i, 0, child);
        if (!frozenCustomRef.current.has(key)) {
          frozenCustomRef.current.set(key, custom);
        }
      }
    }
    const exitingChildren = renderedChildren.filter((child) => !presentKeys.includes(getChildKey(child)));
    if (effectiveMode === "wait" && exitingChildren.length) {
      nextChildren = exitingChildren;
    }
    setRenderedChildren(onlyElements(nextChildren));
    setDiffedChildren(presentChildren);
    return null;
  }
  return /* @__PURE__ */ jsx3(Fragment, {
    children: renderedChildren.map((child) => {
      const key = getChildKey(child);
      const isPresent = presentChildren === renderedChildren || presentKeys.includes(key);
      const onExit = /* @__PURE__ */ __name(() => {
        if (exitComplete.has(key)) {
          exitComplete.set(key, true);
        } else {
          return;
        }
        let isEveryExitComplete = true;
        exitComplete.forEach((isExitComplete) => {
          if (!isExitComplete) isEveryExitComplete = false;
        });
        if (isEveryExitComplete) {
          forceRender?.();
          setRenderedChildren(pendingPresentChildren.current);
          onExitComplete?.();
        }
      }, "onExit");
      return /* @__PURE__ */ jsx3(PresenceChild, {
        isPresent,
        initial: !isInitialRender.current || initial ? void 0 : false,
        custom: isPresent ? custom : frozenCustomRef.current.get(key) ?? custom,
        presenceAffectsLayout,
        enterExitVariant,
        enterVariant,
        exitVariant,
        onExitComplete: isPresent ? void 0 : onExit,
        children: child
      }, key);
    })
  });
}, "AnimatePresence");
AnimatePresence.displayName = "AnimatePresence";

// node_modules/.pnpm/@hanzogui+helpers@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-conf_6437c43e4aaeab6d38900db4feecd9da/node_modules/@hanzogui/helpers/dist/esm/clamp.mjs
function clamp(value, [min2, max2]) {
  return Math.min(max2, Math.max(min2, value));
}
__name(clamp, "clamp");

// node_modules/.pnpm/@hanzogui+helpers@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-conf_6437c43e4aaeab6d38900db4feecd9da/node_modules/@hanzogui/helpers/dist/esm/composeEventHandlers.mjs
function composeEventHandlers(og, next, {
  checkDefaultPrevented = true
} = {}) {
  if (!og || !next) {
    return next || og || void 0;
  }
  return (event) => {
    og?.(event);
    if (!event || !(checkDefaultPrevented && typeof event === "object" && "defaultPrevented" in event) || // @ts-ignore
    "defaultPrevented" in event && !event.defaultPrevented) {
      return next?.(event);
    }
  };
}
__name(composeEventHandlers, "composeEventHandlers");

// node_modules/.pnpm/@hanzogui+constants@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-co_7bc3e4cf720ad9e65ecee6fc651eff23/node_modules/@hanzogui/constants/dist/esm/constants.mjs
import { useEffect as useEffect2, useLayoutEffect } from "react";
var isWeb = true;
var isBrowser = typeof document !== "undefined";
var isServer = !isBrowser;
var isClient = isBrowser;
var useIsomorphicLayoutEffect = isServer ? useEffect2 : useLayoutEffect;
var isChrome = typeof navigator !== "undefined" && /Chrome/.test(navigator.userAgent || "");
var isWebTouchable = isClient && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
var isTouchable = isWebTouchable;
var isAndroid = process.env.TEST_NATIVE_PLATFORM === "android" || process.env.TEST_NATIVE_PLATFORM === "androidtv";
var isIos = process.env.TEST_NATIVE_PLATFORM === "ios" || process.env.TEST_NATIVE_PLATFORM === "tvos";
var isTV = process.env.TEST_NATIVE_PLATFORM === "androidtv" || process.env.TEST_NATIVE_PLATFORM === "tvos";

// node_modules/.pnpm/@hanzogui+helpers@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-conf_6437c43e4aaeab6d38900db4feecd9da/node_modules/@hanzogui/helpers/dist/esm/withStaticProperties.mjs
var Decorated = /* @__PURE__ */ Symbol();
var withStaticProperties = /* @__PURE__ */ __name((component, staticProps) => {
  Object.assign(component, staticProps);
  component[Decorated] = true;
  return component;
}, "withStaticProperties");

// node_modules/.pnpm/@hanzogui+use-event@7.3.0_react@19.2.4/node_modules/@hanzogui/use-event/dist/esm/useGet.mjs
import * as React6 from "react";
var useIsomorphicInsertionEffect = React6.useInsertionEffect || React6.useLayoutEffect;
function useGet(currentValue, initialValue, forwardToFunction) {
  const curRef = React6.useRef(initialValue ?? currentValue);
  useIsomorphicInsertionEffect(() => {
    curRef.current = currentValue;
  });
  return React6.useCallback(forwardToFunction ? (...args) => curRef.current?.apply(null, args) : () => curRef.current, []);
}
__name(useGet, "useGet");

// node_modules/.pnpm/@hanzogui+use-event@7.3.0_react@19.2.4/node_modules/@hanzogui/use-event/dist/esm/useEvent.mjs
function useEvent(callback) {
  return useGet(callback, defaultValue, true);
}
__name(useEvent, "useEvent");
var defaultValue = /* @__PURE__ */ __name(() => {
  throw new Error("Cannot call an event handler while rendering.");
}, "defaultValue");

// node_modules/.pnpm/@hanzogui+use-controllable-state@7.3.0_react@19.2.4/node_modules/@hanzogui/use-controllable-state/dist/esm/useControllableState.mjs
import * as React7 from "react";

// node_modules/.pnpm/@hanzogui+start-transition@7.3.0_react@19.2.4/node_modules/@hanzogui/start-transition/dist/esm/index.mjs
import { startTransition as reactStartTransition } from "react";
var startTransition = /* @__PURE__ */ __name((callback) => {
  reactStartTransition(callback);
}, "startTransition");

// node_modules/.pnpm/@hanzogui+use-controllable-state@7.3.0_react@19.2.4/node_modules/@hanzogui/use-controllable-state/dist/esm/useControllableState.mjs
var emptyCallbackFn = /* @__PURE__ */ __name((_) => _(), "emptyCallbackFn");
function useControllableState({
  prop,
  defaultProp,
  onChange,
  strategy = "prop-wins",
  preventUpdate,
  transition: transition2
}) {
  const [state4, setState] = React7.useState(prop ?? defaultProp);
  const previous = React7.useRef(state4);
  const propWins = strategy === "prop-wins" && prop !== void 0;
  const value = propWins ? prop : state4;
  const onChangeCb = useEvent(onChange || idFn2);
  const transitionFn = transition2 ? startTransition : emptyCallbackFn;
  React7.useEffect(() => {
    if (prop === void 0) return;
    previous.current = prop;
    transitionFn(() => {
      setState(prop);
    });
  }, [prop]);
  React7.useEffect(() => {
    if (propWins) return;
    if (state4 !== previous.current) {
      previous.current = state4;
      onChangeCb(state4);
    }
  }, [onChangeCb, state4, propWins]);
  const setter = useEvent((next) => {
    if (preventUpdate) return;
    if (propWins) {
      const nextValue = typeof next === "function" ? next(previous.current) : next;
      onChangeCb(nextValue);
    } else {
      transitionFn(() => {
        setState(next);
      });
    }
  });
  return [value, setter];
}
__name(useControllableState, "useControllableState");
var idFn2 = /* @__PURE__ */ __name(() => {
}, "idFn");

// node_modules/.pnpm/@hanzogui+collapsible@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.8_9245ea227f3ecb62ffb02475f6f6bad5/node_modules/@hanzogui/collapsible/dist/esm/Collapsible.mjs
import { View, createStyledContext, styled } from "@hanzogui/web";
import * as React8 from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var COLLAPSIBLE_NAME = "Collapsible";
var {
  Provider: CollapsibleProvider,
  useStyledContext: useCollapsibleContext
} = createStyledContext();
var _Collapsible = React8.forwardRef((props, forwardedRef) => {
  const {
    __scopeCollapsible,
    open: openProp,
    defaultOpen,
    disabled,
    onOpenChange,
    ...collapsibleProps
  } = props;
  const [open = false, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange
  });
  return /* @__PURE__ */ jsx4(CollapsibleProvider, {
    scope: __scopeCollapsible,
    disabled,
    contentId: React8.useId(),
    open,
    onOpenToggle: React8.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
    children: /* @__PURE__ */ jsx4(View, {
      "data-state": getState(open),
      "data-disabled": disabled ? "" : void 0,
      ...collapsibleProps,
      ref: forwardedRef
    })
  });
});
_Collapsible.displayName = COLLAPSIBLE_NAME;
var TRIGGER_NAME = "CollapsibleTrigger";
var CollapsibleTriggerFrame = styled(View, {
  name: TRIGGER_NAME,
  render: "button"
});
var CollapsibleTrigger = CollapsibleTriggerFrame.styleable((props, forwardedRef) => {
  const {
    __scopeCollapsible,
    children,
    ...triggerProps
  } = props;
  const context3 = useCollapsibleContext(__scopeCollapsible);
  return /* @__PURE__ */ jsx4(CollapsibleTriggerFrame, {
    "aria-controls": context3.contentId,
    "aria-expanded": context3.open || false,
    "data-state": getState(context3.open),
    "data-disabled": context3.disabled ? "" : void 0,
    disabled: context3.disabled,
    ...triggerProps,
    ref: forwardedRef,
    onPress: composeEventHandlers(props.onPress, context3.onOpenToggle),
    children: typeof children === "function" ? children({
      open: context3.open
    }) : children
  });
});
CollapsibleTrigger.displayName = TRIGGER_NAME;
var CONTENT_NAME = "CollapsibleContent";
var CollapsibleContentFrame = styled(View, {
  name: CONTENT_NAME
});
var CollapsibleContent = CollapsibleContentFrame.styleable((props, forwardedRef) => {
  const {
    forceMount,
    children,
    // @ts-expect-error
    __scopeCollapsible,
    ...contentProps
  } = props;
  const context3 = useCollapsibleContext(__scopeCollapsible);
  return /* @__PURE__ */ jsx4(AnimatePresence, {
    ...contentProps,
    children: forceMount || context3.open ? /* @__PURE__ */ jsx4(CollapsibleContentFrame, {
      ref: forwardedRef,
      ...contentProps,
      children: /* @__PURE__ */ jsx4(ResetPresence, {
        children
      })
    }) : null
  });
});
CollapsibleContent.displayName = CONTENT_NAME;
function getState(open) {
  return open ? "open" : "closed";
}
__name(getState, "getState");
var Collapsible = withStaticProperties(_Collapsible, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent
});

// node_modules/.pnpm/@hanzogui+compose-refs@7.3.0_react@19.2.4/node_modules/@hanzogui/compose-refs/dist/esm/compose-refs.mjs
import * as React9 from "react";
function setRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ;
    ref.current = value;
  }
}
__name(setRef, "setRef");
function composeRefs(...refs) {
  return (node) => refs.forEach((ref) => setRef(ref, node));
}
__name(composeRefs, "composeRefs");
function useComposedRefs(...refs) {
  return React9.useCallback(composeRefs(...refs), refs);
}
__name(useComposedRefs, "useComposedRefs");

// node_modules/.pnpm/@hanzogui+collection@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83_5f2821c7253b02683cc540302887c33d/node_modules/@hanzogui/collection/dist/esm/Collection.mjs
import { Slot, createStyledContext as createStyledContext2 } from "@hanzogui/core";
import React10 from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
function createCollection(name) {
  const {
    Provider: CollectionProviderImpl,
    useStyledContext: useCollectionContext
  } = createStyledContext2({
    collectionRef: {
      current: void 0
    },
    itemMap: /* @__PURE__ */ new Map()
  }, "Toast");
  const CollectionProvider = /* @__PURE__ */ __name((props) => {
    const {
      scope,
      children
    } = props;
    const ref = React10.useRef(void 0);
    const itemMap = React10.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ jsx5(CollectionProviderImpl, {
      scope,
      itemMap,
      collectionRef: ref,
      children
    });
  }, "CollectionProvider");
  CollectionProvider.displayName = "CollectionProvider";
  const COLLECTION_SLOT_NAME = name + "CollectionSlot";
  const CollectionSlot = React10.forwardRef((props, forwardedRef) => {
    const {
      scope,
      children
    } = props;
    const context3 = useCollectionContext(scope);
    const composedRefs = useComposedRefs(forwardedRef, context3.collectionRef);
    return /* @__PURE__ */ jsx5(Slot, {
      ref: composedRefs,
      children
    });
  });
  CollectionSlot.displayName = COLLECTION_SLOT_NAME;
  const ITEM_SLOT_NAME = name + "CollectionItemSlot";
  const ITEM_DATA_ATTR = "data-collection-item";
  const CollectionItemSlot = React10.forwardRef((props, forwardedRef) => {
    const {
      scope,
      children,
      ...itemData
    } = props;
    const ref = React10.useRef(void 0);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const context3 = useCollectionContext(scope);
    React10.useEffect(() => {
      context3.itemMap.set(ref, {
        ref,
        ...itemData
      });
      return () => void context3.itemMap.delete(ref);
    });
    return /* @__PURE__ */ jsx5(Slot, {
      ...{
        [ITEM_DATA_ATTR]: ""
      },
      ref: composedRefs,
      children
    });
  });
  CollectionItemSlot.displayName = ITEM_SLOT_NAME;
  function useCollection3(scope) {
    const context3 = useCollectionContext(scope);
    const getItems = React10.useCallback(() => {
      if (!isWeb) {
        return [];
      }
      const collectionNode = context3.collectionRef.current;
      if (!collectionNode) return [];
      const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
      const items = Array.from(context3.itemMap.values());
      const orderedItems = items.sort((a, b) => orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current));
      return orderedItems;
    }, [context3.collectionRef, context3.itemMap]);
    return getItems;
  }
  __name(useCollection3, "useCollection");
  return [{
    Provider: CollectionProvider,
    Slot: CollectionSlot,
    ItemSlot: CollectionItemSlot
  }, useCollection3];
}
__name(createCollection, "createCollection");

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/Stacks.mjs
import { View as View2, styled as styled2 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/getElevation.mjs
import { getVariableValue, isAndroid as isAndroid2, isVariable } from "@hanzogui/core";
var getElevation = /* @__PURE__ */ __name((size4, extras) => {
  if (!size4) return;
  const {
    tokens
  } = extras;
  const token = tokens.size[size4];
  const sizeNum = isVariable(token) ? +token.val : size4;
  return getSizedElevation(sizeNum, extras);
}, "getElevation");
var getSizedElevation = /* @__PURE__ */ __name((val, {
  theme,
  tokens
}) => {
  let num = 0;
  if (val === true) {
    const val2 = getVariableValue(tokens.size["true"]);
    if (typeof val2 === "number") {
      num = val2;
    } else {
      num = 10;
    }
  } else {
    num = +val;
  }
  if (num === 0) {
    return;
  }
  const [height, shadowRadius] = [Math.round(num / 4 + 1), Math.round(num / 2 + 2)];
  const shadow = {
    shadowColor: theme.shadowColor,
    shadowRadius,
    shadowOffset: {
      height,
      width: 0
    },
    ...isAndroid2 ? {
      elevationAndroid: 2 * height
    } : {}
  };
  return shadow;
}, "getSizedElevation");

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/Stacks.mjs
var fullscreenStyle = {
  position: "absolute",
  inset: 0
};
var variants = {
  fullscreen: {
    true: fullscreenStyle
  },
  elevation: {
    "...size": getElevation,
    ":number": getElevation
  }
};
var YStack = styled2(View2, {
  flexDirection: "column",
  variants
});
YStack["displayName"] = "YStack";
var XStack = styled2(View2, {
  flexDirection: "row",
  variants
});
XStack["displayName"] = "XStack";
var ZStack = styled2(YStack, {
  position: "relative"
}, {
  neverFlatten: true,
  isZStack: true
});
ZStack["displayName"] = "ZStack";

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/ThemeableStack.mjs
import { styled as styled3 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/variants.mjs
var elevate = {
  true: /* @__PURE__ */ __name((_, extras) => {
    return getElevation(extras.props["size"], extras);
  }, "true")
};
var bordered = /* @__PURE__ */ __name((val, {
  props
}) => {
  return {
    // TODO size it with size in '...size'
    borderWidth: typeof val === "number" ? val : 1,
    borderColor: "$borderColor"
  };
}, "bordered");
var circularStyle = {
  borderRadius: 1e5,
  padding: 0
};
var circular = {
  true: /* @__PURE__ */ __name((_, {
    props,
    tokens
  }) => {
    if (!("size" in props)) {
      return circularStyle;
    }
    const size4 = typeof props.size === "number" ? props.size : tokens.size[props.size];
    return {
      ...circularStyle,
      width: size4,
      height: size4,
      maxWidth: size4,
      maxHeight: size4,
      minWidth: size4,
      minHeight: size4
    };
  }, "true")
};

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/ThemeableStack.mjs
var chromelessStyle = {
  backgroundColor: "transparent",
  borderColor: "transparent",
  shadowColor: "transparent",
  hoverStyle: {
    borderColor: "transparent"
  }
};
var themeableVariants = {
  circular,
  elevate,
  bordered: {
    true: bordered
  },
  transparent: {
    true: {
      backgroundColor: "transparent"
    }
  },
  chromeless: {
    true: chromelessStyle,
    all: {
      ...chromelessStyle,
      hoverStyle: chromelessStyle,
      pressStyle: chromelessStyle,
      focusStyle: chromelessStyle
    }
  }
};
var ThemeableStack = styled3(YStack, {
  variants: themeableVariants
});

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/SizableStack.mjs
import { styled as styled4 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+get-token@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83._f3304b1952a75599b7e26db9baa69cc7/node_modules/@hanzogui/get-token/dist/esm/index.mjs
import { getTokens, isVariable as isVariable2 } from "@hanzogui/web";
var defaultOptions = {
  shift: 0,
  bounds: [0]
};
var getSize = /* @__PURE__ */ __name((size4, options) => {
  return getTokenRelative("size", size4, options);
}, "getSize");
var getSpace = /* @__PURE__ */ __name((space, options) => {
  return getTokenRelative("space", space, options);
}, "getSpace");
var cacheVariables = {};
var cacheWholeVariables = {};
var cacheKeys = {};
var cacheWholeKeys = {};
var stepTokenUpOrDown = /* @__PURE__ */ __name((type, current, options = defaultOptions) => {
  const tokens = getTokens({
    prefixed: true
  })[type];
  if (!(type in cacheVariables)) {
    cacheKeys[type] = [];
    cacheVariables[type] = [];
    cacheWholeKeys[type] = [];
    cacheWholeVariables[type] = [];
    const sorted = Object.keys(tokens).map((k) => tokens[k]).sort((a, b) => a.val - b.val);
    for (const token of sorted) {
      cacheKeys[type].push(token.key);
      cacheVariables[type].push(token);
    }
    const sortedExcludingHalfSteps = sorted.filter((x) => !x.key.endsWith(".5"));
    for (const token of sortedExcludingHalfSteps) {
      cacheWholeKeys[type].push(token.key);
      cacheWholeVariables[type].push(token);
    }
  }
  const isString = typeof current === "string";
  const cache7 = options.excludeHalfSteps ? isString ? cacheWholeKeys : cacheWholeVariables : isString ? cacheKeys : cacheVariables;
  const tokensOrdered = cache7[type];
  const min2 = options.bounds?.[0] ?? 0;
  const max2 = options.bounds?.[1] ?? tokensOrdered.length - 1;
  const currentIndex = tokensOrdered.indexOf(current);
  let shift4 = options.shift || 0;
  if (shift4) {
    if (current === "$true" || isVariable2(current) && current.name === "true") {
      shift4 += shift4 > 0 ? 1 : -1;
    }
  }
  const index2 = Math.min(max2, Math.max(min2, currentIndex + shift4));
  const found = tokensOrdered[index2];
  const result = (typeof found === "string" ? tokens[found] : found) || tokens["$true"];
  return result;
}, "stepTokenUpOrDown");
var getTokenRelative = stepTokenUpOrDown;

// node_modules/.pnpm/@hanzogui+get-button-sized@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nativ_1a3d20dba7c46441b23e10861acf1f10/node_modules/@hanzogui/get-button-sized/dist/esm/index.mjs
var getButtonSized = /* @__PURE__ */ __name((val, {
  tokens,
  props
}) => {
  if (!val || props.circular) {
    return;
  }
  if (typeof val === "number") {
    return {
      paddingHorizontal: val * 0.25,
      height: val,
      borderRadius: props.circular ? 1e5 : val * 0.2
    };
  }
  const xSize = getSpace(val);
  const radiusToken = tokens.radius[val] ?? tokens.radius["$true"];
  return {
    paddingHorizontal: xSize,
    height: val,
    borderRadius: props.circular ? 1e5 : radiusToken
  };
}, "getButtonSized");

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/SizableStack.mjs
var SizableStack = styled4(ThemeableStack, {
  name: "SizableStack",
  variants: {
    unstyled: {
      true: {
        elevate: false,
        bordered: false
      }
    },
    circular,
    elevate,
    bordered: {
      true: bordered
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, extras) => {
        return getButtonSized(val, extras);
      }, "...size")
    }
  }
});

// node_modules/.pnpm/@hanzogui+stacks@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_e57cbd54c7ce9eb86315b95c357c5b6c/node_modules/@hanzogui/stacks/dist/esm/NestingContext.mjs
import React11 from "react";
var ButtonNestingContext = React11.createContext(false);

// node_modules/.pnpm/@hanzogui+get-font-sized@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@_67d1d7ba0caae31433592bd85deb78b8/node_modules/@hanzogui/get-font-sized/dist/esm/index.mjs
import { getTokens as getTokens2, styled as styled5, Text } from "@hanzogui/web";
var getFontSized = /* @__PURE__ */ __name((sizeTokenIn = "$true", {
  font,
  fontFamily,
  props
}) => {
  if (!font) {
    return {
      fontSize: sizeTokenIn
    };
  }
  const sizeToken = sizeTokenIn === "$true" ? getDefaultSizeToken(font) : sizeTokenIn;
  const style = {};
  const fontSize = font.size[sizeToken];
  const lineHeight = font.lineHeight?.[sizeToken];
  const fontWeight = font.weight?.[sizeToken];
  const letterSpacing = font.letterSpacing?.[sizeToken];
  const textTransform = font.transform?.[sizeToken];
  const fontStyle = props.fontStyle ?? font.style?.[sizeToken];
  const color = props.color ?? font.color?.[sizeToken];
  if (fontStyle) style.fontStyle = fontStyle;
  if (textTransform) style.textTransform = textTransform;
  if (fontFamily) style.fontFamily = fontFamily;
  if (fontWeight) style.fontWeight = fontWeight;
  if (letterSpacing) style.letterSpacing = letterSpacing;
  if (fontSize) style.fontSize = fontSize;
  if (lineHeight) style.lineHeight = lineHeight;
  if (color) style.color = color;
  if (process.env.NODE_ENV === "development") {
    if (props["debug"] && props["debug"] === "verbose") {
      console.groupCollapsed("  \u{1F539} getFontSized", sizeTokenIn, sizeToken);
      if (isClient) {
        console.info({
          style,
          props,
          font
        });
      }
      console.groupEnd();
    }
  }
  return style;
}, "getFontSized");
var SizableText = styled5(Text, {
  name: "SizableText",
  fontFamily: "$body",
  variants: {
    size: {
      "...fontSize": getFontSized
    }
  },
  defaultVariants: {
    size: "$true"
  }
});
var cache = /* @__PURE__ */ new WeakMap();
function getDefaultSizeToken(font) {
  if (typeof font === "object" && cache.has(font)) {
    return cache.get(font);
  }
  const tokens = getTokens2();
  const sizeTokens = "$true" in font.size ? font.size : tokens?.size;
  if (!sizeTokens) {
    return Object.keys(font.size)[3];
  }
  const sizeDefault = sizeTokens["$true"];
  const sizeDefaultSpecific = sizeDefault ? Object.keys(sizeTokens).find((x) => x !== "$true" && sizeTokens[x]["val"] === sizeDefault["val"]) : null;
  if (!sizeDefault || !sizeDefaultSpecific) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`No default size is set in your tokens for the "true" key, fonts will be inconsistent.

      Fix this by having consistent tokens across fonts and sizes and setting a true key for your size tokens, or
      set true keys for all your font tokens: "size", "lineHeight", "fontStyle", etc.`);
    }
    return Object.keys(font.size)[3];
  }
  cache.set(font, sizeDefaultSpecific);
  return sizeDefaultSpecific;
}
__name(getDefaultSizeToken, "getDefaultSizeToken");

// node_modules/.pnpm/@hanzogui+text@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_6c285bb93d8c81f82b52e26e599fa380/node_modules/@hanzogui/text/dist/esm/SizableText.mjs
import { Text as Text2, styled as styled6 } from "@hanzogui/web";
var SizableText2 = styled6(Text2, {
  name: "SizableText",
  fontFamily: "$body",
  variants: {
    unstyled: {
      false: {
        size: "$true",
        color: "$color"
      }
    },
    size: getFontSized
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
SizableText2.staticConfig.variants.fontFamily = {
  "...": /* @__PURE__ */ __name((val, extras) => {
    if (val === "inherit") {
      return {
        fontFamily: "inherit"
      };
    }
    const sizeProp = extras.props["size"];
    const fontSizeProp = extras.props["fontSize"];
    const size4 = sizeProp === "$true" && fontSizeProp ? fontSizeProp : extras.props["size"] || "$true";
    return getFontSized(size4, extras);
  }, "...")
};

// node_modules/.pnpm/@hanzogui+text@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_6c285bb93d8c81f82b52e26e599fa380/node_modules/@hanzogui/text/dist/esm/Paragraph.mjs
import { styled as styled7 } from "@hanzogui/web";
var Paragraph = styled7(SizableText2, {
  name: "Paragraph",
  render: "p",
  userSelect: "auto",
  color: "$color",
  size: "$true",
  whiteSpace: "normal"
});

// node_modules/.pnpm/@hanzogui+text@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_6c285bb93d8c81f82b52e26e599fa380/node_modules/@hanzogui/text/dist/esm/Headings.mjs
import { styled as styled8 } from "@hanzogui/web";
var Heading = styled8(Paragraph, {
  render: "span",
  name: "Heading",
  role: "heading",
  fontFamily: "$heading",
  size: "$8",
  margin: 0
});
var H1 = styled8(Heading, {
  name: "H1",
  render: "h1",
  variants: {
    unstyled: {
      false: {
        size: "$10"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1" ? true : false
  }
});
var H2 = styled8(Heading, {
  name: "H2",
  render: "h2",
  variants: {
    unstyled: {
      false: {
        size: "$9"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1" ? true : false
  }
});
var H3 = styled8(Heading, {
  name: "H3",
  render: "h3",
  variants: {
    unstyled: {
      false: {
        size: "$8"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1" ? true : false
  }
});
var H4 = styled8(Heading, {
  name: "H4",
  render: "h4",
  variants: {
    unstyled: {
      false: {
        size: "$7"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1" ? true : false
  }
});
var H5 = styled8(Heading, {
  name: "H5",
  render: "h5",
  variants: {
    unstyled: {
      false: {
        size: "$6"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1" ? true : false
  }
});
var H6 = styled8(Heading, {
  name: "H6",
  render: "h6",
  variants: {
    unstyled: {
      false: {
        size: "$5"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1" ? true : false
  }
});

// node_modules/.pnpm/@hanzogui+text@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_6c285bb93d8c81f82b52e26e599fa380/node_modules/@hanzogui/text/dist/esm/wrapChildrenInText.mjs
import React12 from "react";
import { jsx as jsx6 } from "react/jsx-runtime";
function wrapChildrenInText(TextComponent, propsIn, extraProps) {
  const {
    children,
    textProps,
    size: size4,
    noTextWrap,
    color,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    textAlign,
    fontStyle,
    maxFontSizeMultiplier
  } = propsIn;
  if (noTextWrap || !children) {
    return [children];
  }
  const props = {
    ...extraProps
  };
  if (color) props.color = color;
  if (fontFamily) props.fontFamily = fontFamily;
  if (fontSize) props.fontSize = fontSize;
  if (fontWeight) props.fontWeight = fontWeight;
  if (letterSpacing) props.letterSpacing = letterSpacing;
  if (textAlign) props.textAlign = textAlign;
  if (size4) props.size = size4;
  if (fontStyle) props.fontStyle = fontStyle;
  if (maxFontSizeMultiplier) props.maxFontSizeMultiplier = maxFontSizeMultiplier;
  return React12.Children.toArray(children).map((child, index2) => {
    return typeof child === "string" ? (
      // so "data-disable-theme" is a hack to fix themeInverse, don't ask me why
      /* @__PURE__ */ jsx6(TextComponent, {
        ...props,
        ...textProps,
        children: child
      }, index2)
    ) : child;
  });
}
__name(wrapChildrenInText, "wrapChildrenInText");

// node_modules/.pnpm/@hanzogui+use-direction@7.3.0_react@19.2.4/node_modules/@hanzogui/use-direction/dist/esm/useDirection.mjs
import * as React13 from "react";
import { jsx as jsx7 } from "react/jsx-runtime";
var DirectionContext = React13.createContext(void 0);
function useDirection(localDir) {
  const globalDir = React13.useContext(DirectionContext);
  return localDir || globalDir || "ltr";
}
__name(useDirection, "useDirection");

// node_modules/.pnpm/@hanzogui+adapt@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_4603e1ef29232292f95925b2ea566740/node_modules/@hanzogui/adapt/dist/esm/Adapt.mjs
import { createStyledContext as createStyledContext3, useMedia } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+native@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_6e4c39ba786abbe44bcb808ae0d97777/node_modules/@hanzogui/native/dist/esm/globalState.mjs
function createGlobalState(key, defaultValue2) {
  const GLOBAL_KEY = `__gui_${key}__`;
  function getGlobalState() {
    const g = globalThis;
    if (!g[GLOBAL_KEY]) {
      g[GLOBAL_KEY] = defaultValue2;
    }
    return g[GLOBAL_KEY];
  }
  __name(getGlobalState, "getGlobalState");
  function setGlobalState(newState) {
    ;
    globalThis[GLOBAL_KEY] = newState;
  }
  __name(setGlobalState, "setGlobalState");
  return {
    get: getGlobalState,
    set: setGlobalState
  };
}
__name(createGlobalState, "createGlobalState");

// node_modules/.pnpm/@hanzogui+native@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_6e4c39ba786abbe44bcb808ae0d97777/node_modules/@hanzogui/native/dist/esm/portalState.mjs
var state = createGlobalState(`portal`, {
  enabled: false,
  type: null
});
function getPortal() {
  return {
    get isEnabled() {
      return state.get().enabled;
    },
    get state() {
      return state.get();
    },
    set(newState) {
      state.set(newState);
    }
  };
}
__name(getPortal, "getPortal");

// node_modules/.pnpm/@hanzogui+native@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_6e4c39ba786abbe44bcb808ae0d97777/node_modules/@hanzogui/native/dist/esm/gestureState.mjs
var state2 = createGlobalState(`gesture`, {
  enabled: false,
  Gesture: null,
  GestureDetector: null,
  ScrollView: null
});
var pressGestureDebugId = 0;
var externalPressDebugId = 0;
function getEventPointerId(e) {
  const pointerId = e?.pointerId ?? e?.pointer?.id ?? e?.event?.pointerId ?? e?.event?.pointer?.id ?? e?.nativeEvent?.pointerId ?? e?.nativeEvent?.id ?? e?.event?.nativeEvent?.pointerId ?? e?.event?.nativeEvent?.id ?? null;
  return pointerId == null || Number.isNaN(pointerId) ? null : Number(pointerId);
}
__name(getEventPointerId, "getEventPointerId");
var pressState = {
  owner: null,
  ownerId: null,
  ownerSource: null,
  ownerPointerId: null,
  timestamp: 0
};
function resetPressOwner() {
  pressState.owner = null;
  pressState.ownerId = null;
  pressState.ownerSource = null;
  pressState.ownerPointerId = null;
  pressState.timestamp = 0;
}
__name(resetPressOwner, "resetPressOwner");
function resetStaleOwner(now, debugName) {
  if (now - pressState.timestamp > 2e3) {
    resetPressOwner();
  }
}
__name(resetStaleOwner, "resetStaleOwner");
function claimExternalPressOwnership(debugName) {
  const now = Date.now();
  resetStaleOwner(now, debugName);
  const token = {};
  const ownerId = ++externalPressDebugId;
  pressState.owner = token;
  pressState.ownerId = ownerId;
  pressState.ownerSource = "external";
  pressState.timestamp = now;
  return token;
}
__name(claimExternalPressOwnership, "claimExternalPressOwnership");
function releaseExternalPressOwnership(token, debugName) {
  if (!token || pressState.owner !== token) {
    return;
  }
  resetPressOwner();
}
__name(releaseExternalPressOwnership, "releaseExternalPressOwnership");
function getGestureHandler() {
  return {
    get isEnabled() {
      return state2.get().enabled;
    },
    get state() {
      return state2.get();
    },
    set(updates) {
      Object.assign(state2.get(), updates);
    },
    disable() {
      state2.get().enabled = false;
    },
    createPressGesture(config) {
      const {
        Gesture
      } = state2.get();
      if (!Gesture) return null;
      const longPressDuration = config.delayLongPress ?? 500;
      const myToken = {};
      const myDebugId = ++pressGestureDebugId;
      let didLongPress = false;
      let didPressIn = false;
      let pressInTimer = null;
      const GRACE_PERIOD_MS = process.env.GUI_RNGH_PRESS_DELAY ? +process.env.GUI_RNGH_PRESS_DELAY : 24;
      const tryClaimOwnership = /* @__PURE__ */ __name((e) => {
        const now = Date.now();
        resetStaleOwner(now, config.debugName);
        const currentPointerId = getEventPointerId(e);
        const isSameTouchPointer = currentPointerId == null || pressState.ownerPointerId == null || pressState.ownerPointerId === currentPointerId;
        if (pressState.owner === null || pressState.ownerSource === "internal" && isSameTouchPointer) {
          pressState.owner = myToken;
          pressState.ownerId = myDebugId;
          pressState.ownerSource = "internal";
          pressState.ownerPointerId = currentPointerId;
          pressState.timestamp = now;
        }
        return pressState.owner === myToken;
      }, "tryClaimOwnership");
      const isOwner = /* @__PURE__ */ __name(() => pressState.owner === myToken, "isOwner");
      const releaseOwnership = /* @__PURE__ */ __name(() => {
        if (pressInTimer) {
          clearTimeout(pressInTimer);
          pressInTimer = null;
        }
        if (pressState.owner === myToken) {
          resetPressOwner();
        }
      }, "releaseOwnership");
      const firePressIn = /* @__PURE__ */ __name((e) => {
        if (!didPressIn && isOwner()) {
          didPressIn = true;
          config.onPressIn?.(e);
        }
      }, "firePressIn");
      const schedulePressIn = /* @__PURE__ */ __name((e) => {
        if (pressInTimer) {
          clearTimeout(pressInTimer);
        }
        pressInTimer = setTimeout(() => {
          pressInTimer = null;
          if (isOwner()) {
            firePressIn(e);
          }
        }, GRACE_PERIOD_MS + 1);
      }, "schedulePressIn");
      const tap = Gesture.Tap().runOnJS(true).maxDuration(1e4).onBegin((e) => {
        didLongPress = false;
        didPressIn = false;
        tryClaimOwnership(e);
        schedulePressIn(e);
      }).onEnd((e) => {
        if (isOwner() && !didLongPress) {
          firePressIn(e);
          config.onPress?.(e);
        }
      }).onFinalize((e) => {
        if (isOwner()) {
          config.onPressOut?.(e);
          releaseOwnership();
        } else if (didPressIn) {
          didPressIn = false;
          config.onPressOut?.(e);
        }
      });
      if (config.hitSlop) tap.hitSlop(config.hitSlop);
      if (!config.onLongPress) return tap;
      const longPress = Gesture.LongPress().runOnJS(true).minDuration(longPressDuration).onStart((e) => {
        didLongPress = true;
        if (isOwner()) {
          firePressIn(e);
          config.onLongPress?.(e);
        }
      });
      if (config.hitSlop) longPress.hitSlop(config.hitSlop);
      return Gesture.Exclusive(longPress, tap);
    }
  };
}
__name(getGestureHandler, "getGestureHandler");

// node_modules/.pnpm/@hanzogui+native@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_6e4c39ba786abbe44bcb808ae0d97777/node_modules/@hanzogui/native/dist/esm/zeegoState.mjs
var state3 = createGlobalState(`zeego`, {
  enabled: false,
  DropdownMenu: null,
  ContextMenu: null
});
function getZeego() {
  return {
    get isEnabled() {
      return state3.get().enabled;
    },
    get state() {
      return state3.get();
    },
    set(newState) {
      state3.set(newState);
    }
  };
}
__name(getZeego, "getZeego");

// node_modules/.pnpm/@hanzogui+native@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_6e4c39ba786abbe44bcb808ae0d97777/node_modules/@hanzogui/native/dist/esm/nativeMenuContext.mjs
import { createContext as createContext3 } from "react";
var NativeMenuContext = createContext3(false);

// node_modules/.pnpm/@hanzogui+native@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_6e4c39ba786abbe44bcb808ae0d97777/node_modules/@hanzogui/native/dist/esm/components.mjs
import { Fragment as Fragment2, jsx as jsx8 } from "react/jsx-runtime";
function NativePortalProvider({
  children
}) {
  const state4 = getPortal().state;
  if (state4.type !== "teleport") return /* @__PURE__ */ jsx8(Fragment2, {
    children
  });
  const {
    PortalProvider: PortalProvider2
  } = globalThis.__gui_teleport;
  return /* @__PURE__ */ jsx8(PortalProvider2, {
    children
  });
}
__name(NativePortalProvider, "NativePortalProvider");

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/Portal.mjs
import { GuiRoot, useDidFinishSSR, useThemeName } from "@hanzogui/web";

// node_modules/.pnpm/@hanzogui+z-index-stack@7.3.0_react@19.2.4/node_modules/@hanzogui/z-index-stack/dist/esm/useStackedZIndex.mjs
import { useContext as useContext4, useEffect as useEffect4, useId as useId3, useMemo as useMemo4 } from "react";

// node_modules/.pnpm/@hanzogui+z-index-stack@7.3.0_react@19.2.4/node_modules/@hanzogui/z-index-stack/dist/esm/context.mjs
import { createContext as createContext4 } from "react";
var ZIndexStackContext = createContext4(1);
var ZIndexHardcodedContext = createContext4(void 0);

// node_modules/.pnpm/@hanzogui+z-index-stack@7.3.0_react@19.2.4/node_modules/@hanzogui/z-index-stack/dist/esm/useStackedZIndex.mjs
var ZIndicesByContext = {};
var CurrentPortalZIndices = {};
var useStackedZIndex = /* @__PURE__ */ __name((props) => {
  if (process.env.GUI_STACK_Z_INDEX_GLOBAL) {
    const {
      stackZIndex,
      zIndex: zIndexProp
    } = props;
    const id = useId3();
    const zIndex = useMemo4(() => {
      if (stackZIndex && stackZIndex !== "global" && zIndexProp === void 0) {
        const highest = Object.values(CurrentPortalZIndices).reduce((acc, cur) => Math.max(acc, cur), 0);
        return Math.max(stackZIndex === true ? 1 : stackZIndex, highest + 1);
      }
      return zIndexProp ?? 1e3;
    }, [stackZIndex]);
    useEffect4(() => {
      if (typeof stackZIndex === "number") {
        CurrentPortalZIndices[id] = stackZIndex;
        return () => {
          delete CurrentPortalZIndices[id];
        };
      }
    }, [stackZIndex]);
    return zIndex;
  } else {
    const {
      stackZIndex,
      zIndex: zIndexProp
    } = props;
    const id = useId3();
    const stackingContextLevel = useContext4(ZIndexStackContext);
    const stackLayer = stackZIndex === "global" ? 0 : stackingContextLevel;
    const hardcoded = useContext4(ZIndexHardcodedContext);
    ZIndicesByContext[stackLayer] ||= {};
    const stackContext = ZIndicesByContext[stackLayer];
    const zIndex = useMemo4(() => {
      if (typeof zIndexProp === "number") {
        return zIndexProp;
      }
      if (stackZIndex) {
        if (hardcoded) {
          return hardcoded + 1;
        }
        const entries = Object.values(stackContext);
        const baseForLayer = stackLayer * 5e3;
        const nextLayerBase = (stackLayer + 1) * 5e3;
        const validEntries = entries.filter((z) => z < nextLayerBase);
        const highest = validEntries.length > 0 ? Math.max(...validEntries) : baseForLayer;
        const nextZIndex = highest === baseForLayer ? baseForLayer + 1 : highest + 1;
        return typeof stackZIndex === "number" ? stackZIndex + nextZIndex : nextZIndex;
      }
      return 1;
    }, [stackLayer, zIndexProp, stackZIndex]);
    useEffect4(() => {
      if (stackZIndex) {
        stackContext[id] = zIndex;
        return () => {
          delete stackContext[id];
        };
      }
    }, [zIndex]);
    return zIndex;
  }
}, "useStackedZIndex");

// node_modules/.pnpm/@hanzogui+z-index-stack@7.3.0_react@19.2.4/node_modules/@hanzogui/z-index-stack/dist/esm/StackZIndex.mjs
import { useContext as useContext5 } from "react";
import { jsx as jsx9 } from "react/jsx-runtime";
var StackZIndexContext = /* @__PURE__ */ __name(({
  children,
  zIndex
}) => {
  const existing = useContext5(ZIndexStackContext);
  let content = /* @__PURE__ */ jsx9(ZIndexStackContext.Provider, {
    value: existing + 1,
    children
  });
  if (typeof zIndex !== "undefined") {
    content = /* @__PURE__ */ jsx9(ZIndexHardcodedContext.Provider, {
      value: zIndex,
      children: content
    });
  }
  return content;
}, "StackZIndexContext");

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/Portal.mjs
import * as React14 from "react";
import { createPortal } from "react-dom";

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/helpers.mjs
import { getTokenValue } from "@hanzogui/web";
var getStackedZIndexProps = /* @__PURE__ */ __name((propsIn) => {
  return {
    stackZIndex: propsIn.stackZIndex,
    zIndex: resolveViewZIndex(propsIn.zIndex)
  };
}, "getStackedZIndexProps");
var resolveViewZIndex = /* @__PURE__ */ __name((zIndex) => {
  return typeof zIndex === "undefined" ? void 0 : typeof zIndex === "number" ? zIndex : getTokenValue(zIndex, "zIndex");
}, "resolveViewZIndex");

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/Portal.mjs
import { jsx as jsx10 } from "react/jsx-runtime";
var Portal = React14.memo((propsIn) => {
  const {
    children,
    passThrough,
    style,
    open
  } = propsIn;
  const themeName = useThemeName();
  const didHydrate = useDidFinishSSR();
  const zIndex = useStackedZIndex(getStackedZIndexProps(propsIn));
  if (passThrough) {
    return children;
  }
  if (!didHydrate) {
    return null;
  }
  return createPortal(/* @__PURE__ */ jsx10(GuiRoot, {
    theme: themeName,
    style: {
      zIndex,
      position: "fixed",
      inset: 0,
      contain: "strict",
      pointerEvents: open ? "auto" : "none",
      // prevent mobile browser from scrolling/moving this fixed element
      touchAction: "none",
      display: "flex",
      ...style
    },
    children: /* @__PURE__ */ jsx10(ZIndexHardcodedContext.Provider, {
      value: zIndex,
      children
    })
  }), globalThis.document?.body);
});

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/GorhomPortal.mjs
import React15, { createContext as createContext5, memo as memo3, useCallback as useCallback4, useContext as useContext6, useMemo as useMemo5, useReducer } from "react";

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/constants.mjs
var isTeleportEnabled = /* @__PURE__ */ __name(() => {
  const state4 = getPortal().state;
  return state4.enabled && state4.type === "teleport";
}, "isTeleportEnabled");
var needsPortalRepropagation = /* @__PURE__ */ __name(() => {
  if (isWeb) return false;
  if (isTeleportEnabled()) return false;
  return isAndroid || isIos;
}, "needsPortalRepropagation");
var allPortalHosts = /* @__PURE__ */ new Map();
var portalListeners = {};

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/GorhomPortal.mjs
import { Fragment as Fragment3, jsx as jsx11, jsxs } from "react/jsx-runtime";
var INITIAL_STATE = {};
var registerHost = /* @__PURE__ */ __name((state4, hostName) => {
  if (!(hostName in state4)) state4[hostName] = [];
  return state4;
}, "registerHost");
var deregisterHost = /* @__PURE__ */ __name((state4, hostName) => {
  delete state4[hostName];
  return state4;
}, "deregisterHost");
var addUpdatePortal = /* @__PURE__ */ __name((state4, hostName, portalName, node) => {
  if (!(hostName in state4)) state4 = registerHost(state4, hostName);
  const index2 = state4[hostName].findIndex((item) => item.name === portalName);
  if (index2 !== -1) state4[hostName][index2].node = node;
  else state4[hostName].push({
    name: portalName,
    node
  });
  return state4;
}, "addUpdatePortal");
var removePortal = /* @__PURE__ */ __name((state4, hostName, portalName) => {
  if (!(hostName in state4)) {
    if (process.env.NODE_ENV === "development") console.info(`Failed to remove portal '${portalName}', '${hostName}' was not registered!`);
    return state4;
  }
  const index2 = state4[hostName].findIndex((item) => item.name === portalName);
  if (index2 !== -1) state4[hostName].splice(index2, 1);
  return state4;
}, "removePortal");
var reducer = /* @__PURE__ */ __name((state4, action) => {
  const {
    type
  } = action;
  switch (type) {
    case 0:
      return registerHost({
        ...state4
      }, action.hostName);
    case 1:
      return deregisterHost({
        ...state4
      }, action.hostName);
    case 2:
      return addUpdatePortal({
        ...state4
      }, action.hostName, action.portalName, action.node);
    case 3:
      return removePortal({
        ...state4
      }, action.hostName, action.portalName);
    default:
      return state4;
  }
}, "reducer");
var PortalStateContext = createContext5(null);
var PortalDispatchContext = createContext5(null);
var PortalProviderActiveContext = createContext5(false);
var PortalProviderComponent = /* @__PURE__ */ __name(({
  rootHostName = "root",
  shouldAddRootHost = true,
  children
}) => {
  const isAlreadyInProvider = useContext6(PortalProviderActiveContext);
  if (process.env.NODE_ENV === "development") {
    if (isAlreadyInProvider && shouldAddRootHost) console.warn(`[gui] Nested PortalProvider with shouldAddRootHost detected. This causes hydration mismatches. GuiProvider from 'hanzogui' already includes PortalProvider - remove the explicit PortalProvider wrapper or set shouldAddRootHost={false}.`);
  }
  const [state4, dispatch] = useReducer(reducer, INITIAL_STATE);
  const transitionDispatch = useMemo5(() => {
    const next = /* @__PURE__ */ __name((value) => {
      startTransition(() => {
        dispatch(value);
      });
    }, "next");
    return next;
  }, [dispatch]);
  const portalState = getPortal().state;
  const content = /* @__PURE__ */ jsx11(PortalProviderActiveContext.Provider, {
    value: true,
    children: /* @__PURE__ */ jsx11(PortalDispatchContext.Provider, {
      value: transitionDispatch,
      children: /* @__PURE__ */ jsxs(PortalStateContext.Provider, {
        value: state4,
        children: [children, shouldAddRootHost && /* @__PURE__ */ jsx11(PortalHost, {
          name: rootHostName
        })]
      })
    })
  });
  if (portalState.type === "teleport") return /* @__PURE__ */ jsx11(NativePortalProvider, {
    children: content
  });
  return content;
}, "PortalProviderComponent");
var PortalProvider = memo3(PortalProviderComponent);
PortalProvider.displayName = "PortalProvider";
var PortalHost = memo3(/* @__PURE__ */ __name(function PortalHost2(props) {
  return /* @__PURE__ */ jsx11(PortalHostWeb, {
    ...props
  });
}, "PortalHost2"));
function PortalHostWeb(props) {
  useIsomorphicLayoutEffect(() => {
    return () => {
      allPortalHosts.delete(props.name);
    };
  }, [props.name]);
  return /* @__PURE__ */ jsx11("div", {
    style: {
      display: "contents"
    },
    ref: /* @__PURE__ */ __name((node) => {
      if (node) {
        allPortalHosts.set(props.name, node);
        portalListeners[props.name]?.forEach((x) => x(node));
      }
    }, "ref")
  });
}
__name(PortalHostWeb, "PortalHostWeb");

// node_modules/.pnpm/@hanzogui+portal@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_fd355a0e670b7cce12d1cae66feca756/node_modules/@hanzogui/portal/dist/esm/GorhomPortalItem.mjs
import { GuiRoot as GuiRoot2, useThemeName as useThemeName2 } from "@hanzogui/web";
import { useState as useState3 } from "react";
import { createPortal as createPortal2 } from "react-dom";
import { jsx as jsx12 } from "react/jsx-runtime";
var GorhomPortalItem = /* @__PURE__ */ __name((props) => {
  const theme = useThemeName2();
  if (process.env.NODE_ENV === "development") {
    if (!props.hostName && !props.passThrough) {
      console.warn(`No hostName`);
    }
  }
  const cur = allPortalHosts.get(props.hostName || "");
  const [node, setNode] = useState3(cur);
  useIsomorphicLayoutEffect(() => {
    if (!props.hostName) return;
    const listener = /* @__PURE__ */ __name((newNode) => {
      setNode(newNode);
    }, "listener");
    portalListeners[props.hostName] ||= /* @__PURE__ */ new Set();
    portalListeners[props.hostName].add(listener);
    const existingHost = allPortalHosts.get(props.hostName);
    if (existingHost && existingHost !== node) {
      setNode(existingHost);
    }
    return () => {
      portalListeners[props.hostName]?.delete(listener);
    };
  }, [props.hostName]);
  useIsomorphicLayoutEffect(() => {
    if (cur && cur !== node) {
      setNode(cur);
    }
  }, [cur, node]);
  if (props.passThrough) {
    return props.children;
  }
  const actualNode = node?.isConnected ? node : null;
  if (!actualNode) {
    return null;
  }
  return createPortal2(/* @__PURE__ */ jsx12(GuiRoot2, {
    theme,
    children: props.children
  }), actualNode);
}, "GorhomPortalItem");

// node_modules/.pnpm/@hanzogui+adapt@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_4603e1ef29232292f95925b2ea566740/node_modules/@hanzogui/adapt/dist/esm/Adapt.mjs
import React16, { createContext as createContext6, useContext as useContext7, useId as useId4, useMemo as useMemo6 } from "react";
import { Fragment as Fragment4, jsx as jsx13 } from "react/jsx-runtime";
function createAdaptChildrenStore() {
  let children = null;
  const listeners2 = /* @__PURE__ */ new Set();
  return {
    set(c) {
      children = c;
      for (const l of listeners2) l();
    },
    get: /* @__PURE__ */ __name(() => children, "get"),
    subscribe(callback) {
      listeners2.add(callback);
      return () => listeners2.delete(callback);
    }
  };
}
__name(createAdaptChildrenStore, "createAdaptChildrenStore");
var AdaptChildrenStoreContext = createContext6(null);
var AdaptContext = createStyledContext3({
  Contents: null,
  scopeName: "",
  portalName: "",
  platform: null,
  setPlatform: /* @__PURE__ */ __name((x) => {
  }, "setPlatform"),
  when: null,
  setWhen: /* @__PURE__ */ __name(() => {
  }, "setWhen")
});
var LastAdaptContextScope = createContext6("");
var ProvideAdaptContext = /* @__PURE__ */ __name(({
  children,
  ...context3
}) => {
  const scope = context3.scopeName || "";
  const lastScope = useContext7(LastAdaptContextScope);
  return /* @__PURE__ */ jsx13(LastAdaptContextScope.Provider, {
    value: lastScope || context3.lastScope || "",
    children: /* @__PURE__ */ jsx13(AdaptContext.Provider, {
      scope,
      lastScope: lastScope || context3.lastScope,
      ...context3,
      children
    })
  });
}, "ProvideAdaptContext");
var useAdaptContext = /* @__PURE__ */ __name((scope) => {
  const lastScope = useContext7(LastAdaptContextScope);
  const adaptScope = scope ?? lastScope;
  return AdaptContext.useStyledContext(adaptScope);
}, "useAdaptContext");
var AdaptPortals = /* @__PURE__ */ new Map();
var AdaptParent = /* @__PURE__ */ __name(({
  children,
  Contents,
  scope,
  portal
}) => {
  const id = useId4();
  const portalName = `AdaptPortal${scope}${id}`;
  const childrenStoreRef = React16.useRef(null);
  if (!childrenStoreRef.current) childrenStoreRef.current = createAdaptChildrenStore();
  const isTeleport = false;
  const FinalContents = useMemo6(() => {
    if (Contents) return Contents;
    if (AdaptPortals.has(portalName)) return AdaptPortals.get(portalName);
    const element = /* @__PURE__ */ __name(() => {
      return /* @__PURE__ */ jsx13(PortalHost, {
        name: portalName,
        forwardProps: typeof portal === "boolean" ? void 0 : portal?.forwardProps
      }, id);
    }, "element");
    AdaptPortals.set(portalName, element);
    return element;
  }, [portalName, Contents, isTeleport]);
  useIsomorphicLayoutEffect(() => {
    AdaptPortals.set(portalName, FinalContents);
    return () => {
      AdaptPortals.delete(portalName);
    };
  }, [portalName, isTeleport]);
  const [when, setWhen] = React16.useState(null);
  const [platform2, setPlatform] = React16.useState(null);
  return /* @__PURE__ */ jsx13(AdaptChildrenStoreContext.Provider, {
    value: childrenStoreRef.current,
    children: /* @__PURE__ */ jsx13(LastAdaptContextScope.Provider, {
      value: scope,
      children: /* @__PURE__ */ jsx13(ProvideAdaptContext, {
        Contents: FinalContents,
        when,
        platform: platform2,
        setPlatform,
        setWhen,
        portalName,
        scopeName: scope,
        children
      })
    })
  });
}, "AdaptParent");
var AdaptContents = /* @__PURE__ */ __name(({
  scope,
  ...rest
}) => {
  const context3 = useAdaptContext(scope);
  if (!context3?.Contents) throw new Error(process.env.NODE_ENV === "production" ? `gui.dev/docs/intro/errors#warning-002` : `You're rendering a Gui <Adapt /> component without nesting it inside a parent that is able to adapt.`);
  return React16.createElement(context3.Contents, {
    ...rest,
    key: `stable`
  });
}, "AdaptContents");
AdaptContents.shouldForwardSpace = true;
var Adapt = withStaticProperties(/* @__PURE__ */ __name(function Adapt2(props) {
  const {
    platform: platform2,
    when,
    children,
    scope
  } = props;
  const context3 = useAdaptContext(scope);
  const enabled = useAdaptIsActiveGiven(props);
  useIsomorphicLayoutEffect(() => {
    context3?.setWhen?.(when || enabled);
    context3?.setPlatform?.(platform2 || null);
  }, [when, platform2, enabled, context3.setWhen, context3.setPlatform]);
  useIsomorphicLayoutEffect(() => {
    return () => {
      context3?.setWhen?.(null);
      context3?.setPlatform?.(null);
    };
  }, []);
  let output;
  if (typeof children === "function") {
    const Component = context3?.Contents;
    output = children(Component ? /* @__PURE__ */ jsx13(Component, {}) : null);
  } else output = children;
  return /* @__PURE__ */ jsx13(StackZIndexContext, {
    children: !enabled ? null : output
  });
}, "Adapt2"), {
  Contents: AdaptContents
});
var AdaptPortalContents = /* @__PURE__ */ __name((props) => {
  const isActive = useAdaptIsActive(props.scope);
  const {
    portalName
  } = useAdaptContext(props.scope);
  const childrenStore = useContext7(AdaptChildrenStoreContext);
  if (!isWeb && getPortal().state.type === "teleport" && childrenStore) return /* @__PURE__ */ jsx13(AdaptPortalTeleport, {
    isActive,
    store: childrenStore,
    children: props.children
  });
  return /* @__PURE__ */ jsx13(GorhomPortalItem, {
    passThrough: !isActive,
    hostName: portalName,
    children: props.children
  });
}, "AdaptPortalContents");
function AdaptPortalTeleport({
  isActive,
  store,
  children
}) {
  useIsomorphicLayoutEffect(() => {
    if (!isActive) return;
    store.set(children);
    return () => store.set(null);
  });
  return isActive ? null : /* @__PURE__ */ jsx13(Fragment4, {
    children
  });
}
__name(AdaptPortalTeleport, "AdaptPortalTeleport");
var useAdaptIsActiveGiven = /* @__PURE__ */ __name(({
  when,
  platform: platform2
}) => {
  const media = useMedia();
  if (when == null && platform2 == null) return false;
  if (when === true) return true;
  let enabled = false;
  if (platform2 === "touch") enabled = isTouchable;
  else if (platform2 === "native") enabled = !isWeb;
  else if (platform2 === "web") enabled = isWeb;
  else if (platform2 === "ios") enabled = isIos;
  else if (platform2 === "android") enabled = isAndroid;
  if (platform2 && enabled == false) return false;
  if (when && typeof when === "string") enabled = media[when];
  return enabled;
}, "useAdaptIsActiveGiven");
var useAdaptIsActive = /* @__PURE__ */ __name((scope) => {
  return useAdaptIsActiveGiven(useAdaptContext(scope));
}, "useAdaptIsActive");

// node_modules/.pnpm/@hanzogui+animate@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9__c5ccaf5db84971b443ac8abdf54ad0e0/node_modules/@hanzogui/animate/dist/esm/Animate.mjs
import { startTransition as startTransition2, useEffect as useEffect5, useState as useState4 } from "react";
import { Fragment as Fragment5, jsx as jsx14 } from "react/jsx-runtime";
function Animate({
  children,
  lazyMount,
  type,
  present,
  passThrough,
  ...props
}) {
  const [lazyMounted, setLazyMounted] = useState4(lazyMount ? false : present);
  useEffect5(() => {
    if (passThrough) return;
    if (!lazyMount) return;
    if (!present) return;
    startTransition2(() => {
      setLazyMounted(present);
    });
  }, [lazyMount, present]);
  const mounted = !present ? false : lazyMount ? lazyMounted : present;
  if (type === "presence") {
    if (props.keepChildrenMounted) {
      return /* @__PURE__ */ jsx14(PresenceChild, {
        isPresent: true,
        ...!passThrough && {
          initial: props.initial ? void 0 : false,
          onExitComplete: props.onExitComplete,
          enterVariant: props.enterVariant,
          exitVariant: props.exitVariant,
          enterExitVariant: props.enterExitVariant,
          // BUGFIX: this causes continous re-renders if keepChildrenMounted is true, see HeaderMenu
          // but since we always re-render this component on open changes this should be fine to leave off?
          presenceAffectsLayout: false,
          isPresent: present,
          custom: props.custom
        },
        children
      });
    }
    return /* @__PURE__ */ jsx14(AnimatePresence, {
      passThrough,
      ...props,
      children: mounted || passThrough ? children : null
    });
  }
  return /* @__PURE__ */ jsx14(Fragment5, {
    children
  });
}
__name(Animate, "Animate");

// node_modules/.pnpm/@hanzogui+dialog@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_ad9908d050b6d6627f2727c2758a5b71/node_modules/@hanzogui/dialog/dist/esm/Dialog.mjs
import { createStyledContext as createStyledContext4, getExpandedShorthand, LayoutMeasurementController, styled as styled9, Theme, useThemeName as useThemeName3, View as View4 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+create-context@7.3.0_react@19.2.4/node_modules/@hanzogui/create-context/dist/esm/create-context.mjs
import * as React17 from "react";
import { jsx as jsx15 } from "react/jsx-runtime";
function createContext8(rootComponentName, defaultContext) {
  const Context = React17.createContext(defaultContext);
  function Provider(props) {
    const {
      children,
      ...context3
    } = props;
    const value = React17.useMemo(() => context3, Object.values(context3));
    return /* @__PURE__ */ jsx15(Context.Provider, {
      value,
      children
    });
  }
  __name(Provider, "Provider");
  function useContext26(consumerName) {
    const context3 = React17.useContext(Context);
    if (context3) return context3;
    if (defaultContext !== void 0) return defaultContext;
    throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
  }
  __name(useContext26, "useContext");
  return [Provider, useContext26];
}
__name(createContext8, "createContext");
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext24(rootComponentName, defaultContext) {
    const BaseContext = React17.createContext(defaultContext);
    const index2 = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    function Provider(props) {
      const {
        scope,
        children,
        ...context3
      } = props;
      const Context = scope?.[scopeName]?.[index2] || BaseContext;
      const value = React17.useMemo(() => context3, Object.values(context3));
      return /* @__PURE__ */ jsx15(Context.Provider, {
        value,
        children
      });
    }
    __name(Provider, "Provider");
    function useContext26(consumerName, scope, options) {
      const Context = scope?.[scopeName]?.[index2] || BaseContext;
      const context3 = React17.useContext(Context);
      if (context3) return context3;
      if (defaultContext !== void 0) return defaultContext;
      const missingContextMessage = `\`${consumerName}\` must be used within \`${rootComponentName}\``;
      if (options?.fallback) {
        if (options?.warn !== false) {
          console.warn(missingContextMessage);
        }
        return options.fallback;
      }
      throw new Error(missingContextMessage);
    }
    __name(useContext26, "useContext");
    return [Provider, useContext26];
  }
  __name(createContext24, "createContext2");
  const createScope = /* @__PURE__ */ __name(() => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return React17.createContext(defaultContext);
    });
    return /* @__PURE__ */ __name(function useScope(scope) {
      const contexts = scope?.[scopeName] || scopeContexts;
      return React17.useMemo(() => ({
        [`__scope${scopeName}`]: {
          ...scope,
          [scopeName]: contexts
        }
      }), [scope, contexts]);
    }, "useScope");
  }, "createScope");
  createScope.scopeName = scopeName;
  return [createContext24, composeContextScopes(createScope, ...createContextScopeDeps)];
}
__name(createContextScope, "createContextScope");
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = /* @__PURE__ */ __name(() => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return /* @__PURE__ */ __name(function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, {
        useScope,
        scopeName
      }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return {
          ...nextScopes2,
          ...currentScope
        };
      }, {});
      return React17.useMemo(() => ({
        [`__scope${baseScope.scopeName}`]: nextScopes
      }), [nextScopes]);
    }, "useComposedScopes");
  }, "createScope");
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}
__name(composeContextScopes, "composeContextScopes");

// node_modules/.pnpm/@hanzogui+dismissable@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.8_fd008eccea768e8860c766624ac515f5/node_modules/@hanzogui/dismissable/dist/esm/Dismissable.mjs
import { Slot as Slot2, View as View3, composeEventHandlers as composeEventHandlers2 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+use-callback-ref@7.3.0_react@19.2.4/node_modules/@hanzogui/use-callback-ref/dist/esm/index.mjs
import * as React18 from "react";
function useCallbackRef(callback) {
  const callbackRef = React18.useRef(callback);
  React18.useEffect(() => {
    callbackRef.current = callback;
  });
  return React18.useMemo(() => (...args) => callbackRef.current?.(...args), []);
}
__name(useCallbackRef, "useCallbackRef");

// node_modules/.pnpm/@hanzogui+use-escape-keydown@7.3.0_react@19.2.4/node_modules/@hanzogui/use-escape-keydown/dist/esm/index.mjs
import React19 from "react";
function useEscapeKeydown(onEscapeKeyDownProp, ownerDocument = globalThis?.document) {
  const onEscapeKeyDown = useCallbackRef(onEscapeKeyDownProp);
  React19.useEffect(() => {
    const handleKeyDown = /* @__PURE__ */ __name((event) => {
      if (event.key === "Escape") {
        onEscapeKeyDown(event);
      }
    }, "handleKeyDown");
    ownerDocument.addEventListener(
      "keydown",
      // @ts-expect-error
      handleKeyDown
    );
    return () => {
      ownerDocument.removeEventListener(
        "keydown",
        // @ts-expect-error
        handleKeyDown
      );
    };
  }, [onEscapeKeyDown, ownerDocument]);
}
__name(useEscapeKeydown, "useEscapeKeydown");

// node_modules/.pnpm/@hanzogui+dismissable@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.8_fd008eccea768e8860c766624ac515f5/node_modules/@hanzogui/dismissable/dist/esm/Dismissable.mjs
import * as React20 from "react";
import * as ReactDOM from "react-dom";
import { jsx as jsx16 } from "react/jsx-runtime";
function dispatchDiscreteCustomEvent(target, event) {
  if (target) ReactDOM.flushSync(() => target.dispatchEvent(event));
}
__name(dispatchDiscreteCustomEvent, "dispatchDiscreteCustomEvent");
var DISMISSABLE_LAYER_NAME = "Dismissable";
var CONTEXT_UPDATE = "dismissable.update";
var POINTER_DOWN_OUTSIDE = "dismissable.pointerDownOutside";
var FOCUS_OUTSIDE = "dismissable.focusOutside";
var originalBodyPointerEvents;
var globalLayers = /* @__PURE__ */ new Set();
var layerChangeListeners = /* @__PURE__ */ new Set();
var layersWithPointerEventsDisabledCount = 0;
function notifyLayerChange() {
  for (const listener of layerChangeListeners) {
    listener();
  }
}
__name(notifyLayerChange, "notifyLayerChange");
var DismissableContext = React20.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
});
var Dismissable = React20.forwardRef((props, forwardedRef) => {
  const {
    disableOutsidePointerEvents = false,
    forceUnmount,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    onDismiss,
    asChild,
    children,
    branches: branchesProp,
    ...layerProps
  } = props;
  const Comp = asChild ? Slot2 : View3;
  const context3 = React20.useContext(DismissableContext);
  const [node, setNode] = React20.useState(null);
  const [, force] = React20.useState({});
  const composedRefs = useComposedRefs(forwardedRef, (node2) => setNode(node2));
  const layers = Array.from(context3.layers);
  const [highestLayerWithOutsidePointerEventsDisabled] = [...context3.layersWithOutsidePointerEventsDisabled].slice(-1);
  const highestLayerWithOutsidePointerEventsDisabledIndex = layers.indexOf(highestLayerWithOutsidePointerEventsDisabled);
  const index2 = node ? layers.indexOf(node) : -1;
  const isBodyPointerEventsDisabled = context3.layersWithOutsidePointerEventsDisabled.size > 0;
  const isPointerEventsEnabled = index2 >= highestLayerWithOutsidePointerEventsDisabledIndex;
  const pointerDownOutside = usePointerDownOutside((event) => {
    const target = event.target;
    const branches = branchesProp || context3.branches;
    const isPointerDownOnBranch = [...branches].some((branch) => branch.contains(target));
    if (!isPointerEventsEnabled || isPointerDownOnBranch) return;
    onPointerDownOutside?.(event);
    onInteractOutside?.(event);
    if (!event.defaultPrevented) onDismiss?.();
  });
  const focusOutside = useFocusOutside((event) => {
    const target = event.target;
    const branches = branchesProp || context3.branches;
    const isFocusInBranch = [...branches].some((branch) => branch.contains(target));
    if (isFocusInBranch) return;
    onFocusOutside?.(event);
    onInteractOutside?.(event);
    if (!event.defaultPrevented) onDismiss?.();
  });
  const forceUnmountRef = React20.useRef(forceUnmount);
  React20.useEffect(() => {
    forceUnmountRef.current = forceUnmount;
  }, [forceUnmount]);
  useEscapeKeydown((event) => {
    if (forceUnmountRef.current) return;
    const currentLayers = Array.from(context3.layers);
    const currentIndex = node ? currentLayers.indexOf(node) : -1;
    const isHighestLayer = currentIndex === currentLayers.length - 1;
    if (!isHighestLayer) return;
    onEscapeKeyDown?.(event);
    if (!event.defaultPrevented && onDismiss) {
      event.preventDefault();
      onDismiss();
    }
  });
  React20.useEffect(() => {
    if (!node) return;
    if (forceUnmount) return;
    if (disableOutsidePointerEvents) {
      if (context3.layersWithOutsidePointerEventsDisabled.size === 0) {
        originalBodyPointerEvents = document.body.style.pointerEvents;
        document.body.style.pointerEvents = "none";
      }
      context3.layersWithOutsidePointerEventsDisabled.add(node);
      layersWithPointerEventsDisabledCount++;
    }
    context3.layers.add(node);
    globalLayers.add(node);
    if (disableOutsidePointerEvents || layersWithPointerEventsDisabledCount > 0) {
      dispatchUpdate();
    }
    notifyLayerChange();
    return () => {
      if (disableOutsidePointerEvents) {
        if (context3.layersWithOutsidePointerEventsDisabled.size === 1) {
          document.body.style.pointerEvents = originalBodyPointerEvents;
        }
      }
    };
  }, [node, disableOutsidePointerEvents, forceUnmount, context3]);
  React20.useEffect(() => {
    if (forceUnmount) return;
    return () => {
      if (!node) return;
      const hadPointerEventsDisabled = context3.layersWithOutsidePointerEventsDisabled.has(node);
      context3.layers.delete(node);
      context3.layersWithOutsidePointerEventsDisabled.delete(node);
      globalLayers.delete(node);
      if (layersWithPointerEventsDisabledCount > 0) {
        dispatchUpdate();
      }
      notifyLayerChange();
      if (hadPointerEventsDisabled) {
        layersWithPointerEventsDisabledCount--;
      }
    };
  }, [node, context3, forceUnmount]);
  React20.useEffect(() => {
    const handleUpdate = /* @__PURE__ */ __name(() => {
      if (layersWithPointerEventsDisabledCount > 0) {
        force({});
      }
    }, "handleUpdate");
    document.addEventListener(CONTEXT_UPDATE, handleUpdate);
    return () => document.removeEventListener(CONTEXT_UPDATE, handleUpdate);
  }, []);
  return /* @__PURE__ */ jsx16(Comp, {
    ...layerProps,
    ref: composedRefs,
    ...!asChild && {
      display: "contents"
    },
    pointerEvents: isBodyPointerEventsDisabled ? isPointerEventsEnabled ? "auto" : "none" : void 0,
    onFocusCapture: composeEventHandlers2(props.onFocusCapture, focusOutside.onFocusCapture),
    onBlurCapture: composeEventHandlers2(props.onBlurCapture, focusOutside.onBlurCapture),
    onPointerDownCapture: composeEventHandlers2(props.onPointerDownCapture, pointerDownOutside.onPointerDownCapture),
    children
  });
});
Dismissable.displayName = DISMISSABLE_LAYER_NAME;
var BRANCH_NAME = "DismissableBranch";
var DismissableBranch = React20.forwardRef((props, forwardedRef) => {
  const {
    branches: branchesProp,
    ...rest
  } = props;
  const context3 = React20.useContext(DismissableContext);
  const ref = React20.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  React20.useEffect(() => {
    const node = ref.current;
    if (!(node instanceof HTMLElement)) return;
    const branches = branchesProp || context3.branches;
    if (node && branches) {
      branches.add(node);
      return () => {
        branches.delete(node);
      };
    }
  }, [branchesProp, context3.branches]);
  return /* @__PURE__ */ jsx16(View3, {
    asChild: "except-style",
    ...rest,
    ref: composedRefs
  });
});
DismissableBranch.displayName = BRANCH_NAME;
function usePointerDownOutside(onPointerDownOutside) {
  const handlePointerDownOutside = useEvent(onPointerDownOutside);
  const isPointerInsideReactTreeRef = React20.useRef(false);
  const handleClickRef = React20.useRef(() => {
  });
  React20.useEffect(() => {
    const handlePointerDown = /* @__PURE__ */ __name((event) => {
      if (event.target && !isPointerInsideReactTreeRef.current) {
        let handleAndDispatchPointerDownOutsideEvent = /* @__PURE__ */ __name(function() {
          handleAndDispatchCustomEvent(POINTER_DOWN_OUTSIDE, handlePointerDownOutside, eventDetail, {
            discrete: true
          });
        }, "handleAndDispatchPointerDownOutsideEvent");
        const eventDetail = {
          originalEvent: event
        };
        if (event.pointerType === "touch") {
          document.removeEventListener("click", handleClickRef.current);
          handleClickRef.current = handleAndDispatchPointerDownOutsideEvent;
          document.addEventListener("click", handleClickRef.current, {
            once: true
          });
        } else {
          handleAndDispatchPointerDownOutsideEvent();
        }
      }
      isPointerInsideReactTreeRef.current = false;
    }, "handlePointerDown");
    const timerId = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);
    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("click", handleClickRef.current);
    };
  }, [handlePointerDownOutside]);
  return {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: /* @__PURE__ */ __name(() => {
      isPointerInsideReactTreeRef.current = true;
    }, "onPointerDownCapture")
  };
}
__name(usePointerDownOutside, "usePointerDownOutside");
function useFocusOutside(onFocusOutside) {
  const handleFocusOutside = useEvent(onFocusOutside);
  const isFocusInsideReactTreeRef = React20.useRef(false);
  React20.useEffect(() => {
    const handleFocus = /* @__PURE__ */ __name((event) => {
      if (event.target && !isFocusInsideReactTreeRef.current) {
        const eventDetail = {
          originalEvent: event
        };
        handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handleFocusOutside, eventDetail, {
          discrete: false
        });
      }
    }, "handleFocus");
    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, [handleFocusOutside]);
  return {
    onFocusCapture: /* @__PURE__ */ __name(() => {
      isFocusInsideReactTreeRef.current = true;
    }, "onFocusCapture"),
    onBlurCapture: /* @__PURE__ */ __name(() => {
      isFocusInsideReactTreeRef.current = false;
    }, "onBlurCapture")
  };
}
__name(useFocusOutside, "useFocusOutside");
function dispatchUpdate() {
  const event = new CustomEvent(CONTEXT_UPDATE);
  document.dispatchEvent(event);
}
__name(dispatchUpdate, "dispatchUpdate");
function handleAndDispatchCustomEvent(name, handler, detail, {
  discrete
}) {
  const target = detail.originalEvent.target;
  const event = new CustomEvent(name, {
    bubbles: false,
    cancelable: true,
    detail
  });
  if (handler) target.addEventListener(name, handler, {
    once: true
  });
  if (discrete) {
    dispatchDiscreteCustomEvent(target, event);
  } else {
    target.dispatchEvent(event);
  }
}
__name(handleAndDispatchCustomEvent, "handleAndDispatchCustomEvent");

// node_modules/.pnpm/@hanzogui+use-async@7.3.0_react@19.2.4/node_modules/@hanzogui/use-async/dist/esm/useAsyncEffect.mjs
import { useEffect as useEffect8, useLayoutEffect as useLayoutEffect3 } from "react";

// node_modules/.pnpm/@hanzogui+use-async@7.3.0_react@19.2.4/node_modules/@hanzogui/use-async/dist/esm/errors.mjs
var AbortError = class extends Error {
  static {
    __name(this, "AbortError");
  }
  constructor(message = "") {
    super(message);
    this.name = "AbortError";
  }
};

// node_modules/.pnpm/@hanzogui+use-async@7.3.0_react@19.2.4/node_modules/@hanzogui/use-async/dist/esm/useAsyncEffect.mjs
var DEBUG_LEVEL = 0;
function useAsyncEffect(cb, deps = []) {
  useAsyncEffectOfType(useEffect8, cb, deps);
}
__name(useAsyncEffect, "useAsyncEffect");
function useAsyncEffectOfType(type, cb, deps = []) {
  type(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    try {
      const value = cb(signal, ...deps);
      Promise.resolve(value).then(async (res) => {
        if (res && typeof res === "function") {
          if (signal.aborted) return res();
          signal.addEventListener("abort", res);
        }
      }).catch(handleError);
    } catch (error2) {
      handleError(error2);
    }
    function handleError(error2) {
      if (error2 instanceof AbortError) {
        if (DEBUG_LEVEL > 2) {
          console.info(`\u{1F41B} useAsyncEffect aborted: ${error2.message}`);
        }
        return null;
      }
      if (typeof error2 === "object" && error2.name === "AbortError") {
        return null;
      }
      throw error2;
    }
    __name(handleError, "handleError");
    return () => {
      if (signal.aborted) return;
      controller.abort();
    };
  }, deps);
}
__name(useAsyncEffectOfType, "useAsyncEffectOfType");

// node_modules/.pnpm/@hanzogui+use-async@7.3.0_react@19.2.4/node_modules/@hanzogui/use-async/dist/esm/sleep.mjs
var sleep = /* @__PURE__ */ __name(async (ms, signal) => {
  await new Promise((res) => setTimeout(res, ms));
  if (signal?.aborted) {
    throw new AbortError();
  }
}, "sleep");

// node_modules/.pnpm/@hanzogui+use-async@7.3.0_react@19.2.4/node_modules/@hanzogui/use-async/dist/esm/idle.mjs
var idleCb = typeof requestIdleCallback === "undefined" ? (cb) => setTimeout(cb, 1) : requestIdleCallback;
var idleAsync = /* @__PURE__ */ __name(() => {
  return new Promise((res) => {
    idleCb(res);
  });
}, "idleAsync");
var idle = /* @__PURE__ */ __name(async (signal, options) => {
  const {
    max: max2,
    min: min2,
    fully
  } = options || {};
  const idleFn = fully ? fullyIdle : idleAsync;
  if (max2 && min2 && min2 < max2) {
    await Promise.race([Promise.all([idleFn(), sleep(min2)]), sleep(max2)]);
  } else if (max2) {
    await Promise.race([idleFn(), sleep(max2)]);
  } else if (min2) {
    await Promise.all([idleFn(), sleep(min2)]);
  } else {
    await idleFn();
  }
  if (signal?.aborted) {
    throw new AbortError();
  }
}, "idle");
var fullyIdle = /* @__PURE__ */ __name(async (signal) => {
  while (true) {
    const startTime = Date.now();
    await idle(signal);
    const endTime = Date.now();
    const duration = endTime - startTime;
    if (duration < 15) {
      break;
    }
    if (signal?.aborted) {
      throw new AbortError();
    }
  }
}, "fullyIdle");

// node_modules/.pnpm/@hanzogui+focus-scope@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-_03b3066190b8882daa2204b51b1d34bc/node_modules/@hanzogui/focus-scope/dist/esm/FocusScope.mjs
import * as React22 from "react";

// node_modules/.pnpm/@hanzogui+focus-scope@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-_03b3066190b8882daa2204b51b1d34bc/node_modules/@hanzogui/focus-scope/dist/esm/FocusScopeController.mjs
import * as React21 from "react";
import { jsx as jsx17 } from "react/jsx-runtime";
var FOCUS_SCOPE_CONTROLLER_NAME = "FocusScopeController";
var [createFocusScopeControllerContext, createFocusScopeControllerScope] = createContextScope(FOCUS_SCOPE_CONTROLLER_NAME);
var [FocusScopeControllerProvider, useFocusScopeControllerContext] = createFocusScopeControllerContext(FOCUS_SCOPE_CONTROLLER_NAME);
function FocusScopeController(props) {
  const {
    __scopeFocusScope,
    children,
    enabled,
    loop,
    trapped,
    onMountAutoFocus,
    onUnmountAutoFocus,
    forceUnmount,
    focusOnIdle
  } = props;
  const stableOnMountAutoFocus = useEvent(onMountAutoFocus);
  const stableOnUnmountAutoFocus = useEvent(onUnmountAutoFocus);
  const contextValue = React21.useMemo(() => ({
    enabled,
    loop,
    trapped,
    onMountAutoFocus: stableOnMountAutoFocus,
    onUnmountAutoFocus: stableOnUnmountAutoFocus,
    forceUnmount,
    focusOnIdle
  }), [enabled, loop, trapped, stableOnMountAutoFocus, stableOnUnmountAutoFocus, forceUnmount, focusOnIdle]);
  return /* @__PURE__ */ jsx17(FocusScopeControllerProvider, {
    scope: __scopeFocusScope,
    ...contextValue,
    children
  });
}
__name(FocusScopeController, "FocusScopeController");
var FocusScopeControllerComponent = FocusScopeController;

// node_modules/.pnpm/@hanzogui+focus-scope@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-_03b3066190b8882daa2204b51b1d34bc/node_modules/@hanzogui/focus-scope/dist/esm/FocusScope.mjs
import { Fragment as Fragment6, jsx as jsx18 } from "react/jsx-runtime";
var AUTOFOCUS_ON_MOUNT = "focusScope.autoFocusOnMount";
var AUTOFOCUS_ON_UNMOUNT = "focusScope.autoFocusOnUnmount";
var EVENT_OPTIONS = {
  bubbles: false,
  cancelable: true
};
var FocusScope = React22.forwardRef(/* @__PURE__ */ __name(function FocusScope2({
  __scopeFocusScope,
  ...props
}, forwardedRef) {
  const context3 = useFocusScopeControllerContext("FocusScope", __scopeFocusScope, {
    warn: false,
    fallback: {}
  });
  const mergedProps = {
    ...props,
    enabled: context3.enabled ?? props.enabled,
    loop: context3.loop ?? props.loop,
    trapped: context3.trapped ?? props.trapped,
    onMountAutoFocus: context3.onMountAutoFocus ?? props.onMountAutoFocus,
    onUnmountAutoFocus: context3.onUnmountAutoFocus ?? props.onUnmountAutoFocus,
    forceUnmount: context3.forceUnmount ?? props.forceUnmount,
    focusOnIdle: context3.focusOnIdle ?? props.focusOnIdle
  };
  const childProps = useFocusScope(mergedProps, forwardedRef);
  if (typeof mergedProps.children === "function") {
    return /* @__PURE__ */ jsx18(Fragment6, {
      children: mergedProps.children(childProps)
    });
  }
  return React22.cloneElement(React22.Children.only(mergedProps.children), childProps);
}, "FocusScope2"));
function setupFocusTrap(container, lastFocusedElementRef, focusScope) {
  const controller = new AbortController();
  let rafId2 = null;
  function scheduleRefocus() {
    if (rafId2) return;
    const elementToFocus = lastFocusedElementRef.current;
    rafId2 = requestAnimationFrame(() => {
      rafId2 = null;
      if (focusScope.paused) return;
      if (focusScope.stopped) return;
      if (!container.isConnected) return;
      if (!container.contains(document.activeElement)) {
        focus(elementToFocus);
      }
    });
  }
  __name(scheduleRefocus, "scheduleRefocus");
  function handleFocusIn(event) {
    if (focusScope.paused) return;
    const target = event.target;
    if (container.contains(target)) {
      target?.addEventListener("blur", handleBlur, {
        signal: controller.signal
      });
      lastFocusedElementRef.current = target;
    } else {
      scheduleRefocus();
    }
  }
  __name(handleFocusIn, "handleFocusIn");
  function handleFocusOut(event) {
    controller.abort();
    if (focusScope.paused) return;
    if (!container.contains(event.relatedTarget)) {
      scheduleRefocus();
    }
  }
  __name(handleFocusOut, "handleFocusOut");
  function handleBlur() {
  }
  __name(handleBlur, "handleBlur");
  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("focusout", handleFocusOut);
  return () => {
    if (rafId2) {
      cancelAnimationFrame(rafId2);
      rafId2 = null;
    }
    controller.abort();
    document.removeEventListener("focusin", handleFocusIn);
    document.removeEventListener("focusout", handleFocusOut);
  };
}
__name(setupFocusTrap, "setupFocusTrap");
function useFocusScope(props, forwardedRef) {
  const {
    loop = false,
    enabled = true,
    trapped = false,
    onMountAutoFocus: onMountAutoFocusProp,
    onUnmountAutoFocus: onUnmountAutoFocusProp,
    forceUnmount,
    focusOnIdle = true,
    children,
    ...scopeProps
  } = props;
  const [container, setContainer] = React22.useState(null);
  const containerRef = React22.useRef(null);
  const onMountAutoFocus = useEvent(onMountAutoFocusProp);
  const onUnmountAutoFocus = useEvent(onUnmountAutoFocusProp);
  const lastFocusedElementRef = React22.useRef(null);
  const focusScopeRef = React22.useRef({
    paused: false,
    stopped: false,
    // set to true when cleanup starts, signals trap to stop
    pause() {
      this.paused = true;
    },
    resume() {
      this.paused = false;
    },
    stop() {
      this.stopped = true;
    }
  });
  const focusScope = focusScopeRef.current;
  const trapCleanupRef = React22.useRef(null);
  const setContainerRef = React22.useCallback((node) => {
    if (trapCleanupRef.current) {
      trapCleanupRef.current();
      trapCleanupRef.current = null;
    }
    containerRef.current = node;
    if (isWeb && node && enabled && trapped) {
      trapCleanupRef.current = setupFocusTrap(node, lastFocusedElementRef, focusScopeRef.current);
    }
    setContainer(node);
  }, [enabled, trapped]);
  const composedRefs = useComposedRefs(forwardedRef, setContainerRef);
  useIsomorphicLayoutEffect(() => {
    if (!trapped) {
      focusScope.stopped = true;
      if (trapCleanupRef.current) {
        trapCleanupRef.current();
        trapCleanupRef.current = null;
      }
    }
    return () => {
      if (trapCleanupRef.current) {
        trapCleanupRef.current();
        trapCleanupRef.current = null;
      }
    };
  }, [trapped, focusScope]);
  useAsyncEffect(async (signal) => {
    if (!enabled) return;
    if (!container) return;
    if (forceUnmount) return;
    if (trapped) {
      focusScope.stopped = false;
    }
    focusScopesStack.add(focusScope);
    const previouslyFocusedElement = document.activeElement;
    const hasFocusedCandidate = container.contains(previouslyFocusedElement) && previouslyFocusedElement !== null && !isHidden(previouslyFocusedElement, {
      upTo: container
    });
    if (!hasFocusedCandidate) {
      const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS);
      container.addEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
      container.dispatchEvent(mountEvent);
      if (!mountEvent.defaultPrevented) {
        if (focusOnIdle) {
          await idle(signal, typeof focusOnIdle == "object" ? focusOnIdle : {
            // we can't wait too long or else user can take an action and then we focus
            max: 200,
            min: typeof focusOnIdle == "number" ? focusOnIdle : 16
          });
        }
        const allCandidates = getTabbableCandidates(container);
        const linkedRemoved = removeLinks(allCandidates);
        const visibleCandidates = linkedRemoved.filter((candidate) => !isHidden(candidate, {
          upTo: container
        }));
        focusFirst(visibleCandidates, {
          select: true
        });
        if (visibleCandidates.length > 0) {
          lastFocusedElementRef.current = visibleCandidates[0];
        } else {
          lastFocusedElementRef.current = container;
        }
        if (document.activeElement === previouslyFocusedElement && visibleCandidates.length === 0) {
          focus(container);
        }
      }
    }
    return () => {
      focusScope.stop();
      container.removeEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
      const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS);
      container.addEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
      container.dispatchEvent(unmountEvent);
      if (!unmountEvent.defaultPrevented) {
        const currentFocus = document.activeElement;
        const focusHasMovedOutside = currentFocus && currentFocus !== document.body && currentFocus !== container && !container.contains(currentFocus);
        if (!focusHasMovedOutside) {
          focus(previouslyFocusedElement ?? document.body, {
            select: true
          });
        }
      }
      container.removeEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
      focusScopesStack.remove(focusScope);
    };
  }, [enabled, container, forceUnmount, onMountAutoFocus, onUnmountAutoFocus, focusScope, focusOnIdle]);
  const handleKeyDown = React22.useCallback((event) => {
    if (!trapped) return;
    if (!loop) return;
    if (focusScope.paused) return;
    if (!enabled) return;
    if (!container) return;
    const isTabKey = event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey;
    const focusedElement = document.activeElement;
    if (isTabKey && focusedElement) {
      const [first, last] = getTabbableEdges(container);
      const hasTabbableElementsInside = first && last;
      if (!hasTabbableElementsInside) {
        if (focusedElement === container) event.preventDefault();
      } else {
        if (!event.shiftKey && focusedElement === last) {
          event.preventDefault();
          if (loop) focus(first, {
            select: true
          });
        } else if (event.shiftKey && focusedElement === first) {
          event.preventDefault();
          if (loop) focus(last, {
            select: true
          });
        }
      }
    }
  }, [loop, trapped, focusScope.paused, enabled, container]);
  React22.useEffect(() => {
    if (!container) return;
    if (!trapped) return;
    if (!loop) return;
    if (!enabled) return;
    const handleKeyDownCapture = /* @__PURE__ */ __name((event) => {
      if (event.key === "Tab") {
        handleKeyDown(event);
      }
    }, "handleKeyDownCapture");
    container.addEventListener("keydown", handleKeyDownCapture, true);
    return () => {
      container.removeEventListener("keydown", handleKeyDownCapture, true);
    };
  }, [container, trapped, loop, enabled, handleKeyDown]);
  const existingOnKeyDown = scopeProps.onKeyDown;
  const composedOnKeyDown = React22.useCallback((event) => {
    existingOnKeyDown?.(event);
  }, [existingOnKeyDown]);
  return {
    ...scopeProps,
    ref: composedRefs,
    onKeyDown: composedOnKeyDown
  };
}
__name(useFocusScope, "useFocusScope");
function focusFirst(candidates, {
  select = false
} = {}) {
  const previouslyFocusedElement = document.activeElement;
  for (const candidate of candidates) {
    focus(candidate, {
      select
    });
    if (document.activeElement !== previouslyFocusedElement) return;
  }
}
__name(focusFirst, "focusFirst");
function getTabbableEdges(container) {
  const candidates = getTabbableCandidates(container);
  const first = findVisible(candidates, container);
  const last = findVisible(candidates.reverse(), container);
  return [first, last];
}
__name(getTabbableEdges, "getTabbableEdges");
function getTabbableCandidates(container) {
  const nodes = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: /* @__PURE__ */ __name((node) => {
      const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
      if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
      return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }, "acceptNode")
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}
__name(getTabbableCandidates, "getTabbableCandidates");
function findVisible(elements, container) {
  for (const element of elements) {
    if (!isHidden(element, {
      upTo: container
    })) return element;
  }
}
__name(findVisible, "findVisible");
function isHidden(node, {
  upTo
}) {
  if (getComputedStyle(node).visibility === "hidden") return true;
  while (node) {
    if (upTo !== void 0 && node === upTo) return false;
    if (getComputedStyle(node).display === "none") return true;
    node = node.parentElement;
  }
  return false;
}
__name(isHidden, "isHidden");
function isSelectableInput(element) {
  return element instanceof HTMLInputElement && "select" in element;
}
__name(isSelectableInput, "isSelectableInput");
function focus(element, {
  select = false
} = {}) {
  if (element?.focus) {
    const previouslyFocusedElement = document.activeElement;
    try {
      element.focus({
        preventScroll: true
      });
      if (element !== previouslyFocusedElement && isSelectableInput(element) && select) element.select();
    } catch (error2) {
    }
  }
}
__name(focus, "focus");
var focusScopesStack = createFocusScopesStack();
function createFocusScopesStack() {
  let stack = [];
  return {
    add(focusScope) {
      const activeFocusScope = stack[0];
      if (focusScope !== activeFocusScope) {
        activeFocusScope?.pause();
      }
      stack = arrayRemove(stack, focusScope);
      stack.unshift(focusScope);
    },
    remove(focusScope) {
      stack = arrayRemove(stack, focusScope);
      stack[0]?.resume();
    }
  };
}
__name(createFocusScopesStack, "createFocusScopesStack");
function arrayRemove(array, item) {
  const updatedArray = [...array];
  const index2 = updatedArray.indexOf(item);
  if (index2 !== -1) {
    updatedArray.splice(index2, 1);
  }
  return updatedArray;
}
__name(arrayRemove, "arrayRemove");
function removeLinks(items) {
  return items.filter((item) => item.tagName !== "A");
}
__name(removeLinks, "removeLinks");

// node_modules/.pnpm/@hanzogui+remove-scroll@7.3.0_react@19.2.4/node_modules/@hanzogui/remove-scroll/dist/esm/useDisableScroll.mjs
import { useEffect as useEffect10, useRef as useRef8 } from "react";
var canUseDOM = /* @__PURE__ */ __name(() => typeof window !== "undefined" && !!window.document && !!window.document.createElement, "canUseDOM");
var refCount = 0;
var savedScrollY = 0;
var previousStyles = null;
function isIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isSafari2 = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS && isSafari2;
}
__name(isIOSSafari, "isIOSSafari");
var useDisableBodyScroll = /* @__PURE__ */ __name((enabled) => {
  const wasEnabled = useRef8(false);
  useEffect10(() => {
    if (!canUseDOM()) {
      return;
    }
    if (enabled && !wasEnabled.current) {
      wasEnabled.current = true;
      if (++refCount === 1) {
        const html = document.documentElement;
        const body = document.body;
        savedScrollY = window.scrollY;
        previousStyles = {
          htmlOverflow: html.style.overflow,
          htmlScrollbarGutter: html.style.scrollbarGutter,
          bodyPosition: body.style.position,
          bodyTop: body.style.top,
          bodyWidth: body.style.width,
          bodyOverflow: body.style.overflow,
          bodyOverscrollBehavior: body.style.overscrollBehavior
        };
        html.style.scrollbarGutter = "stable";
        html.style.overflow = "hidden";
        body.style.overscrollBehavior = "none";
        if (isIOSSafari()) {
          body.style.position = "fixed";
          body.style.top = `-${savedScrollY}px`;
          body.style.width = "100%";
          body.style.overflow = "hidden";
        }
      }
    } else if (!enabled && wasEnabled.current) {
      wasEnabled.current = false;
      if (--refCount === 0 && previousStyles) {
        const html = document.documentElement;
        const body = document.body;
        html.style.overflow = previousStyles.htmlOverflow;
        html.style.scrollbarGutter = previousStyles.htmlScrollbarGutter;
        body.style.position = previousStyles.bodyPosition;
        body.style.top = previousStyles.bodyTop;
        body.style.width = previousStyles.bodyWidth;
        body.style.overflow = previousStyles.bodyOverflow;
        body.style.overscrollBehavior = previousStyles.bodyOverscrollBehavior;
        if (savedScrollY > 0) {
          window.scrollTo(0, savedScrollY);
        }
        previousStyles = null;
        savedScrollY = 0;
      }
    }
  }, [enabled]);
  useEffect10(() => {
    return () => {
      if (wasEnabled.current) {
        wasEnabled.current = false;
        if (--refCount === 0 && previousStyles) {
          const html = document.documentElement;
          const body = document.body;
          html.style.overflow = previousStyles.htmlOverflow;
          html.style.scrollbarGutter = previousStyles.htmlScrollbarGutter;
          body.style.position = previousStyles.bodyPosition;
          body.style.top = previousStyles.bodyTop;
          body.style.width = previousStyles.bodyWidth;
          body.style.overflow = previousStyles.bodyOverflow;
          body.style.overscrollBehavior = previousStyles.bodyOverscrollBehavior;
          if (savedScrollY > 0) {
            window.scrollTo(0, savedScrollY);
          }
          previousStyles = null;
          savedScrollY = 0;
        }
      }
    };
  }, []);
}, "useDisableBodyScroll");

// node_modules/.pnpm/@hanzogui+remove-scroll@7.3.0_react@19.2.4/node_modules/@hanzogui/remove-scroll/dist/esm/RemoveScroll.mjs
var RemoveScroll = /* @__PURE__ */ __name((props) => {
  useDisableBodyScroll(Boolean(props.enabled));
  return props.children;
}, "RemoveScroll");

// node_modules/.pnpm/@hanzogui+sheet@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_0d1b651bfdeba460c39f0bd6b3f6f2ab/node_modules/@hanzogui/sheet/dist/esm/SheetController.mjs
import React24, { useId as useId5, useRef as useRef9 } from "react";
import { useEvent as useEvent2 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+sheet@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_0d1b651bfdeba460c39f0bd6b3f6f2ab/node_modules/@hanzogui/sheet/dist/esm/useSheetController.mjs
import React23 from "react";
var SheetControllerContext = React23.createContext(null);

// node_modules/.pnpm/@hanzogui+sheet@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_0d1b651bfdeba460c39f0bd6b3f6f2ab/node_modules/@hanzogui/sheet/dist/esm/SheetController.mjs
import { jsx as jsx19 } from "react/jsx-runtime";
var SheetController = /* @__PURE__ */ __name(({
  children,
  onOpenChange: onOpenChangeProp,
  onAnimationComplete: onAnimationCompleteProp,
  open,
  hidden,
  disableDrag
}) => {
  const onOpenChange = useEvent2(onOpenChangeProp);
  const onAnimationComplete = useEvent2(onAnimationCompleteProp);
  const id = useId5();
  const wasHiddenRef = useRef9(hidden);
  let skipNextAnimation = false;
  if (wasHiddenRef.current && !hidden && open) {
    skipNextAnimation = true;
  }
  wasHiddenRef.current = hidden;
  const memoValue = React24.useMemo(() => ({
    id,
    open,
    hidden,
    disableDrag,
    onOpenChange,
    onAnimationComplete,
    skipNextAnimation
  }), [id, onOpenChange, onAnimationComplete, open, hidden, disableDrag, skipNextAnimation]);
  return /* @__PURE__ */ jsx19(SheetControllerContext.Provider, {
    value: memoValue,
    children
  });
}, "SheetController");

// node_modules/.pnpm/@hanzogui+dialog@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_ad9908d050b6d6627f2727c2758a5b71/node_modules/@hanzogui/dialog/dist/esm/Dialog.mjs
import * as React25 from "react";
import { Fragment as Fragment7, jsx as jsx20, jsxs as jsxs2 } from "react/jsx-runtime";
var DialogContext = createStyledContext4(
  // since we always provide this we can avoid setting here
  {},
  "Dialog__"
);
var {
  useStyledContext: useDialogContext,
  Provider: DialogProvider
} = DialogContext;
var DialogAdaptHiddenContext = React25.createContext(true);
var DialogTriggerFrame = styled9(View4, {
  name: "DialogTrigger"
});
var DialogTrigger = DialogTriggerFrame.styleable(/* @__PURE__ */ __name(function DialogTrigger2(props, forwardedRef) {
  const {
    scope,
    ...triggerProps
  } = props;
  const isInsideButton = React25.useContext(ButtonNestingContext);
  const context3 = useDialogContext(scope);
  const composedTriggerRef = useComposedRefs(forwardedRef, context3.triggerRef);
  return /* @__PURE__ */ jsx20(ButtonNestingContext.Provider, {
    value: true,
    children: /* @__PURE__ */ jsx20(DialogTriggerFrame, {
      render: isInsideButton ? "span" : "button",
      "aria-haspopup": "dialog",
      "aria-expanded": context3.open,
      "aria-controls": context3.contentId,
      "data-state": getState2(context3.open),
      ...triggerProps,
      ref: composedTriggerRef,
      onPress: composeEventHandlers(props.onPress, context3.onOpenToggle)
    })
  });
}, "DialogTrigger2"));
var DialogPortalFrame = styled9(YStack, {
  pointerEvents: "none",
  render: "dialog",
  variants: {
    unstyled: {
      false: {
        alignItems: "center",
        justifyContent: "center",
        fullscreen: true,
        "$platform-web": {
          // undo dialog styles
          borderWidth: 0,
          backgroundColor: "transparent",
          color: "inherit",
          maxInlineSize: "none",
          margin: 0,
          width: "auto",
          height: "auto",
          // ensure always in frame and right height
          maxHeight: "100vh",
          position: "fixed",
          // ensure dialog inherits stacking context from portal wrapper
          zIndex: 1
        }
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var needsRepropagation = needsPortalRepropagation();
var DialogPortalItem = /* @__PURE__ */ __name(({
  context: context3,
  children
}) => {
  const themeName = useThemeName3();
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  const adaptContext = useAdaptContext(context3.adaptScope);
  let content = /* @__PURE__ */ jsx20(Theme, {
    name: themeName,
    children
  });
  if (needsRepropagation) {
    content = /* @__PURE__ */ jsx20(ProvideAdaptContext, {
      ...adaptContext,
      children: /* @__PURE__ */ jsx20(DialogProvider, {
        ...context3,
        children: content
      })
    });
  }
  return isAdapted ? /* @__PURE__ */ jsx20(AdaptPortalContents, {
    scope: context3.adaptScope,
    children: content
  }) : context3.modal ? /* @__PURE__ */ jsx20(GorhomPortalItem, {
    hostName: context3.modal ? "root" : context3.adaptScope,
    children: content
  }) : content;
}, "DialogPortalItem");
var DialogPortal = React25.forwardRef((props, forwardRef29) => {
  const {
    scope,
    forceMount,
    children,
    ...frameProps
  } = props;
  const dialogRef = React25.useRef(null);
  const ref = composeRefs(dialogRef, forwardRef29);
  const context3 = useDialogContext(scope);
  const keepMounted = forceMount || context3.keepChildrenMounted;
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  const [isFullyHidden, setIsFullyHidden] = React25.useState(!context3.open);
  if (context3.open && isFullyHidden) {
    setIsFullyHidden(false);
  }
  const isVisible = context3.open ? true : !isFullyHidden;
  if (isWeb) {
    useIsomorphicLayoutEffect(() => {
      const node = dialogRef.current;
      if (!(node instanceof HTMLDialogElement)) return;
      if (isVisible) {
        node.show?.();
      } else {
        node.close?.();
      }
    }, [isVisible]);
  }
  const onAnimationCompleteRef = React25.useRef(context3.onAnimationComplete);
  onAnimationCompleteRef.current = context3.onAnimationComplete;
  const handleExitComplete = React25.useCallback(() => {
    setIsFullyHidden(true);
    onAnimationCompleteRef.current?.({
      open: false
    });
  }, []);
  React25.useEffect(() => {
    if (context3.open && !isAdapted && onAnimationCompleteRef.current) {
      const tm = setTimeout(() => {
        onAnimationCompleteRef.current?.({
          open: true
        });
      }, 350);
      return () => clearTimeout(tm);
    }
  }, [context3.open, isAdapted]);
  const zIndex = getExpandedShorthand("zIndex", props);
  const contents = /* @__PURE__ */ jsx20(StackZIndexContext, {
    zIndex: resolveViewZIndex(zIndex),
    children: /* @__PURE__ */ jsx20(Animate, {
      type: "presence",
      present: Boolean(context3.open),
      keepChildrenMounted: Boolean(keepMounted),
      onExitComplete: handleExitComplete,
      passThrough: isAdapted,
      children
    })
  });
  const framedContents = isFullyHidden && !keepMounted && !isAdapted ? null : /* @__PURE__ */ jsx20(LayoutMeasurementController, {
    disable: !context3.open,
    children: /* @__PURE__ */ jsx20(DialogPortalFrame, {
      ref,
      ...isWeb && context3.open && {
        "aria-modal": true
      },
      pointerEvents: context3.open ? "auto" : "none",
      ...frameProps,
      className: `_no_backdrop ` + (frameProps.className || ""),
      children: contents
    })
  });
  if (isWeb) {
    return /* @__PURE__ */ jsx20(Portal, {
      zIndex,
      stackZIndex: 1e5,
      passThrough: isAdapted,
      children: /* @__PURE__ */ jsx20(PassthroughTheme, {
        passThrough: isAdapted,
        children: framedContents
      })
    });
  }
  return isAdapted ? framedContents : /* @__PURE__ */ jsx20(DialogPortalItem, {
    context: context3,
    children: framedContents
  });
});
var PassthroughTheme = /* @__PURE__ */ __name(({
  children,
  passThrough
}) => {
  const themeName = useThemeName3();
  return /* @__PURE__ */ jsx20(Theme, {
    passThrough,
    name: themeName,
    forceClassName: true,
    children
  });
}, "PassthroughTheme");
var OVERLAY_NAME = "DialogOverlay";
var DialogOverlayFrame = styled9(YStack, {
  name: OVERLAY_NAME,
  zIndex: 1,
  variants: {
    open: {
      true: {
        pointerEvents: "auto"
      },
      false: {
        pointerEvents: "none"
      }
    },
    unstyled: {
      false: {
        fullscreen: true,
        position: "absolute",
        backgroundColor: "$background",
        pointerEvents: "auto"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var DialogOverlay = DialogOverlayFrame.styleable(/* @__PURE__ */ __name(function DialogOverlay2({
  scope,
  ...props
}, forwardedRef) {
  const context3 = useDialogContext(scope);
  const {
    forceMount = context3.forceMount,
    ...overlayProps
  } = props;
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  if (!forceMount) {
    if (!context3.modal || isAdapted) {
      return null;
    }
  }
  return /* @__PURE__ */ jsx20(DialogOverlayFrame, {
    "data-state": getState2(context3.open),
    pointerEvents: context3.open ? "auto" : "none",
    ...overlayProps,
    ref: forwardedRef
  });
}, "DialogOverlay2"));
var CONTENT_NAME2 = "DialogContent";
var DialogContentFrame = styled9(ThemeableStack, {
  name: CONTENT_NAME2,
  zIndex: 2,
  variants: {
    size: {
      "...size": /* @__PURE__ */ __name((val, extras) => {
        return {};
      }, "...size")
    },
    unstyled: {
      false: {
        position: "relative",
        backgroundColor: "$background",
        borderWidth: 1,
        borderColor: "$borderColor",
        padding: "$true",
        borderRadius: "$true",
        elevate: true,
        // Ensure content receives pointer events (fixes React 19 + display:contents inheritance)
        pointerEvents: "auto"
      }
    }
  },
  defaultVariants: {
    size: "$true",
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var DialogContent = DialogContentFrame.styleable(/* @__PURE__ */ __name(function DialogContent2({
  scope,
  ...props
}, forwardedRef) {
  const context3 = useDialogContext(scope);
  const contents = /* @__PURE__ */ jsx20(Fragment7, {
    children: context3.modal ? /* @__PURE__ */ jsx20(DialogContentModal, {
      context: context3,
      ...props,
      ref: forwardedRef
    }) : /* @__PURE__ */ jsx20(DialogContentNonModal, {
      context: context3,
      ...props,
      ref: forwardedRef
    })
  });
  if (!isWeb || context3.disableRemoveScroll) {
    return contents;
  }
  return /* @__PURE__ */ jsx20(RemoveScroll, {
    enabled: context3.open,
    children: /* @__PURE__ */ jsx20("div", {
      "data-remove-scroll-container": true,
      className: "_dsp_contents",
      children: contents
    })
  });
}, "DialogContent2"));
var DialogContentModal = React25.forwardRef(({
  children,
  context: context3,
  ...props
}, forwardedRef) => {
  const contentRef = React25.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, context3.contentRef, contentRef);
  return /* @__PURE__ */ jsx20(DialogContentImpl, {
    ...props,
    context: context3,
    ref: composedRefs,
    trapFocus: context3.open,
    disableOutsidePointerEvents: true,
    onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
      event.preventDefault();
      context3.triggerRef.current?.focus();
    }),
    onPointerDownOutside: composeEventHandlers(props.onPointerDownOutside, (event) => {
      const originalEvent = event["detail"].originalEvent;
      const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
      const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
      if (isRightClick) event.preventDefault();
    }),
    onFocusOutside: composeEventHandlers(props.onFocusOutside, (event) => event.preventDefault()),
    ...!props.unstyled && {
      outlineStyle: "none"
    },
    children
  });
});
var DialogContentNonModal = React25.forwardRef((props, forwardedRef) => {
  const hasInteractedOutsideRef = React25.useRef(false);
  return /* @__PURE__ */ jsx20(DialogContentImpl, {
    ...props,
    ref: forwardedRef,
    trapFocus: false,
    disableOutsidePointerEvents: false,
    onCloseAutoFocus: /* @__PURE__ */ __name((event) => {
      props.onCloseAutoFocus?.(event);
      if (!event.defaultPrevented) {
        if (!hasInteractedOutsideRef.current) {
          props.context.triggerRef.current?.focus();
        }
        event.preventDefault();
      }
      hasInteractedOutsideRef.current = false;
    }, "onCloseAutoFocus"),
    onInteractOutside: /* @__PURE__ */ __name((event) => {
      props.onInteractOutside?.(event);
      if (!event.defaultPrevented) hasInteractedOutsideRef.current = true;
      const target = event.target;
      const trigger = props.context.triggerRef.current;
      if (!(trigger instanceof HTMLElement)) return;
      const targetIsTrigger = trigger.contains(target);
      if (targetIsTrigger) event.preventDefault();
    }, "onInteractOutside")
  });
});
var DialogContentImpl = React25.forwardRef((props, forwardedRef) => {
  const {
    trapFocus,
    onOpenAutoFocus,
    onCloseAutoFocus,
    disableOutsidePointerEvents,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    context: context3,
    ...contentProps
  } = props;
  const contentRef = React25.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, contentRef);
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  const isAdaptFullyHidden = React25.useContext(DialogAdaptHiddenContext);
  if (isAdapted) {
    if (!context3.open && !context3.keepChildrenMounted && isAdaptFullyHidden) {
      return null;
    }
    return /* @__PURE__ */ jsx20(DialogPortalItem, {
      context: context3,
      children: contentProps.children
    });
  }
  const contents = /* @__PURE__ */ jsx20(DialogContentFrame, {
    ref: composedRefs,
    id: context3.contentId,
    role: "dialog",
    "aria-modal": context3.modal,
    "aria-describedby": context3.descriptionId,
    "aria-labelledby": context3.titleId,
    "data-state": getState2(context3.open),
    pointerEvents: context3.open ? "auto" : "none",
    ...contentProps
  });
  if (!isWeb) {
    return contents;
  }
  return /* @__PURE__ */ jsxs2(Fragment7, {
    children: [/* @__PURE__ */ jsx20(Dismissable, {
      disableOutsidePointerEvents: context3.open && disableOutsidePointerEvents,
      forceUnmount: !context3.open,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss: /* @__PURE__ */ __name(() => context3?.onOpenChange?.(false), "onDismiss"),
      children: /* @__PURE__ */ jsx20(FocusScope, {
        loop: true,
        enabled: context3.open,
        trapped: trapFocus,
        onMountAutoFocus: onOpenAutoFocus,
        forceUnmount: !context3.open,
        onUnmountAutoFocus: onCloseAutoFocus,
        children: contents
      })
    }), process.env.NODE_ENV === "development" && /* @__PURE__ */ jsxs2(Fragment7, {
      children: [/* @__PURE__ */ jsx20(TitleWarning, {
        titleId: context3.titleId
      }), /* @__PURE__ */ jsx20(DescriptionWarning, {
        contentRef,
        descriptionId: context3.descriptionId
      })]
    })]
  });
});
var DialogTitleFrame = styled9(H2, {
  name: "DialogTitle"
});
var DialogTitle = DialogTitleFrame.styleable(/* @__PURE__ */ __name(function DialogTitle2(props, forwardedRef) {
  const {
    scope,
    ...titleProps
  } = props;
  const context3 = useDialogContext(scope);
  return /* @__PURE__ */ jsx20(DialogTitleFrame, {
    id: context3.titleId,
    ...titleProps,
    ref: forwardedRef
  });
}, "DialogTitle2"));
var DialogDescriptionFrame = styled9(Paragraph, {
  name: "DialogDescription"
});
var DialogDescription = DialogDescriptionFrame.styleable(/* @__PURE__ */ __name(function DialogDescription2(props, forwardedRef) {
  const {
    scope,
    ...descriptionProps
  } = props;
  const context3 = useDialogContext(scope);
  return /* @__PURE__ */ jsx20(DialogDescriptionFrame, {
    id: context3.descriptionId,
    ...descriptionProps,
    ref: forwardedRef
  });
}, "DialogDescription2"));
var CLOSE_NAME = "DialogClose";
var DialogCloseFrame = styled9(View4, {
  name: CLOSE_NAME,
  render: "button"
});
var DialogClose = DialogCloseFrame.styleable((props, forwardedRef) => {
  const {
    scope,
    displayWhenAdapted,
    ...closeProps
  } = props;
  const context3 = useDialogContext(scope);
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  const isInsideButton = React25.useContext(ButtonNestingContext);
  if (isAdapted && !displayWhenAdapted) {
    return null;
  }
  return /* @__PURE__ */ jsx20(DialogCloseFrame, {
    "aria-label": "Dialog Close",
    render: isInsideButton ? "span" : "button",
    ...closeProps,
    ref: forwardedRef,
    onPress: composeEventHandlers(props.onPress, () => {
      context3.onOpenChange(false);
    })
  });
});
function getState2(open) {
  return open ? "open" : "closed";
}
__name(getState2, "getState");
var TITLE_WARNING_NAME = "DialogTitleWarning";
var [DialogWarningProvider, useWarningContext] = createContext8(TITLE_WARNING_NAME, {
  contentName: CONTENT_NAME2,
  titleName: "DialogTitle",
  docsSlug: "dialog"
});
var TitleWarning = /* @__PURE__ */ __name(({
  titleId
}) => {
  if (process.env.NODE_ENV === "development") {
    const titleWarningContext = useWarningContext(TITLE_WARNING_NAME);
    const MESSAGE = `\`${titleWarningContext.contentName}\` wants a \`${titleWarningContext.titleName}\` to be accessible. If you want to hide the \`${titleWarningContext.titleName}\`, wrap it with <VisuallyHidden />.`;
    React25.useEffect(() => {
      if (!isWeb) return;
      if (titleId) {
        const hasTitle = document.getElementById(titleId);
        if (!hasTitle) {
          console.warn(MESSAGE);
        }
      }
    }, [MESSAGE, titleId]);
  }
  return null;
}, "TitleWarning");
var DESCRIPTION_WARNING_NAME = "DialogDescriptionWarning";
var DescriptionWarning = /* @__PURE__ */ __name(({
  contentRef,
  descriptionId
}) => {
  if (process.env.NODE_ENV === "development") {
    const descriptionWarningContext = useWarningContext(DESCRIPTION_WARNING_NAME);
    const MESSAGE = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${descriptionWarningContext.contentName}}.`;
    React25.useEffect(() => {
      if (!isWeb) return;
      const contentNode = contentRef.current;
      if (!(contentNode instanceof HTMLElement)) {
        return;
      }
      const describedById = contentNode.getAttribute("aria-describedby");
      if (descriptionId && describedById) {
        const hasDescription = document.getElementById(descriptionId);
        if (!hasDescription) {
          console.warn(MESSAGE);
        }
      }
    }, [MESSAGE, contentRef, descriptionId]);
  }
  return null;
}, "DescriptionWarning");
var Dialog = withStaticProperties(React25.forwardRef(/* @__PURE__ */ __name(function Dialog2(props, ref) {
  const {
    scope = "",
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    modal = true,
    keepChildrenMounted,
    disableRemoveScroll = false,
    onAnimationComplete
  } = props;
  const baseId = React25.useId();
  const dialogId = `Dialog-${scope}-${baseId}`;
  const contentId = `${dialogId}-content`;
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const triggerRef = React25.useRef(null);
  const contentRef = React25.useRef(null);
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange
  });
  const onOpenToggle = React25.useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, [setOpen]);
  const adaptScope = `DialogAdapt${scope}`;
  const context3 = {
    dialogScope: scope,
    adaptScope,
    triggerRef,
    contentRef,
    contentId,
    titleId,
    descriptionId,
    open,
    onOpenChange: setOpen,
    onOpenToggle,
    modal,
    keepChildrenMounted,
    disableRemoveScroll,
    onAnimationComplete
  };
  React25.useImperativeHandle(ref, () => ({
    open: setOpen
  }), [setOpen]);
  return /* @__PURE__ */ jsx20(AdaptParent, {
    scope: adaptScope,
    portal: {
      forwardProps: props
    },
    children: /* @__PURE__ */ jsx20(DialogProvider, {
      scope,
      ...context3,
      children: /* @__PURE__ */ jsx20(DialogSheetController, {
        onOpenChange: setOpen,
        scope,
        children
      })
    })
  });
}, "Dialog2")), {
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
  FocusScope: FocusScopeControllerComponent,
  Adapt
});
var DialogSheetController = /* @__PURE__ */ __name((props) => {
  const context3 = useDialogContext(props.scope);
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  const [isAdaptFullyHidden, setIsAdaptFullyHidden] = React25.useState(!context3.open);
  if (context3.open && isAdaptFullyHidden) {
    setIsAdaptFullyHidden(false);
  }
  const handleSheetAnimationComplete = React25.useCallback(({
    open
  }) => {
    if (!open) {
      setIsAdaptFullyHidden(true);
    }
  }, []);
  return /* @__PURE__ */ jsx20(SheetController, {
    onOpenChange: /* @__PURE__ */ __name((val) => {
      if (isAdapted) {
        props.onOpenChange?.(val);
      }
    }, "onOpenChange"),
    onAnimationComplete: handleSheetAnimationComplete,
    open: context3.open,
    hidden: !isAdapted,
    children: /* @__PURE__ */ jsx20(DialogAdaptHiddenContext.Provider, {
      value: isAdaptFullyHidden,
      children: props.children
    })
  });
}, "DialogSheetController");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/AccessibilityUtil/isDisabled.js
var isDisabled = /* @__PURE__ */ __name((props) => props.disabled || Array.isArray(props.accessibilityStates) && props.accessibilityStates.indexOf("disabled") > -1, "isDisabled");
var isDisabled_default = isDisabled;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/AccessibilityUtil/propsToAriaRole.js
var accessibilityRoleToWebRole = {
  adjustable: "slider",
  button: "button",
  header: "heading",
  image: "img",
  imagebutton: null,
  keyboardkey: null,
  label: null,
  link: "link",
  none: "presentation",
  search: "search",
  summary: "region",
  text: null
};
var propsToAriaRole = /* @__PURE__ */ __name((_ref) => {
  var accessibilityRole = _ref.accessibilityRole, role = _ref.role;
  var _role = role || accessibilityRole;
  if (_role) {
    var inferredRole = accessibilityRoleToWebRole[_role];
    if (inferredRole !== null) {
      return inferredRole || _role;
    }
  }
}, "propsToAriaRole");
var propsToAriaRole_default = propsToAriaRole;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/AccessibilityUtil/propsToAccessibilityComponent.js
var roleComponents = {
  article: "article",
  banner: "header",
  blockquote: "blockquote",
  button: "button",
  code: "code",
  complementary: "aside",
  contentinfo: "footer",
  deletion: "del",
  emphasis: "em",
  figure: "figure",
  insertion: "ins",
  form: "form",
  list: "ul",
  listitem: "li",
  main: "main",
  navigation: "nav",
  paragraph: "p",
  region: "section",
  strong: "strong"
};
var emptyObject = {};
var propsToAccessibilityComponent = /* @__PURE__ */ __name(function propsToAccessibilityComponent2(props) {
  if (props === void 0) {
    props = emptyObject;
  }
  var roleProp = props.role || props.accessibilityRole;
  if (roleProp === "label") {
    return "label";
  }
  var role = propsToAriaRole_default(props);
  if (role) {
    if (role === "heading") {
      var level = props.accessibilityLevel || props["aria-level"];
      if (level != null) {
        return "h" + level;
      }
      return "h1";
    }
    return roleComponents[role];
  }
}, "propsToAccessibilityComponent");
var propsToAccessibilityComponent_default = propsToAccessibilityComponent;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/AccessibilityUtil/index.js
var AccessibilityUtil = {
  isDisabled: isDisabled_default,
  propsToAccessibilityComponent: propsToAccessibilityComponent_default,
  propsToAriaRole: propsToAriaRole_default
};
var AccessibilityUtil_default = AccessibilityUtil;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/createDOMProps/index.js
var import_objectSpread23 = __toESM(require_objectSpread2());
var import_objectWithoutPropertiesLoose3 = __toESM(require_objectWithoutPropertiesLoose());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/index.js
var import_objectSpread22 = __toESM(require_objectSpread2());
var import_objectWithoutPropertiesLoose2 = __toESM(require_objectWithoutPropertiesLoose());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/index.js
var import_objectSpread2 = __toESM(require_objectSpread2());
var import_objectWithoutPropertiesLoose = __toESM(require_objectWithoutPropertiesLoose());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/unitlessNumbers.js
var unitlessNumbers = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexOrder: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  fontWeight: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowGap: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnGap: true,
  gridColumnStart: true,
  lineClamp: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  // SVG-related
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
  // transform types
  scale: true,
  scaleX: true,
  scaleY: true,
  scaleZ: true,
  // RN properties
  shadowOpacity: true
};
var prefixes = ["ms", "Moz", "O", "Webkit"];
var prefixKey = /* @__PURE__ */ __name((prefix, key) => {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}, "prefixKey");
Object.keys(unitlessNumbers).forEach((prop) => {
  prefixes.forEach((prefix) => {
    unitlessNumbers[prefixKey(prefix, prop)] = unitlessNumbers[prop];
  });
});
var unitlessNumbers_default = unitlessNumbers;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/isWebColor/index.js
var isWebColor = /* @__PURE__ */ __name((color) => color === "currentcolor" || color === "currentColor" || color === "inherit" || color.indexOf("var(") === 0, "isWebColor");
var isWebColor_default = isWebColor;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/processColor/index.js
var import_normalize_colors = __toESM(require_normalize_colors());
var processColor = /* @__PURE__ */ __name((color) => {
  if (color === void 0 || color === null) {
    return color;
  }
  var int32Color = (0, import_normalize_colors.default)(color);
  if (int32Color === void 0 || int32Color === null) {
    return void 0;
  }
  int32Color = (int32Color << 24 | int32Color >>> 8) >>> 0;
  return int32Color;
}, "processColor");
var processColor_default = processColor;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/normalizeColor.js
var normalizeColor2 = /* @__PURE__ */ __name(function normalizeColor3(color, opacity) {
  if (opacity === void 0) {
    opacity = 1;
  }
  if (color == null) return;
  if (typeof color === "string" && isWebColor_default(color)) {
    return color;
  }
  var colorInt = processColor_default(color);
  if (colorInt != null) {
    var r2 = colorInt >> 16 & 255;
    var g = colorInt >> 8 & 255;
    var b = colorInt & 255;
    var a = (colorInt >> 24 & 255) / 255;
    var alpha = (a * opacity).toFixed(2);
    return "rgba(" + r2 + "," + g + "," + b + "," + alpha + ")";
  }
}, "normalizeColor");
var normalizeColor_default = normalizeColor2;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/normalizeValueWithProperty.js
var colorProps = {
  backgroundColor: true,
  borderColor: true,
  borderTopColor: true,
  borderRightColor: true,
  borderBottomColor: true,
  borderLeftColor: true,
  color: true,
  shadowColor: true,
  textDecorationColor: true,
  textShadowColor: true
};
function normalizeValueWithProperty(value, property) {
  var returnValue = value;
  if ((property == null || !unitlessNumbers_default[property]) && typeof value === "number") {
    returnValue = value + "px";
  } else if (property != null && colorProps[property]) {
    returnValue = normalizeColor_default(value);
  }
  return returnValue;
}
__name(normalizeValueWithProperty, "normalizeValueWithProperty");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/canUseDom/index.js
var canUseDOM2 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
var canUseDom_default = canUseDOM2;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/createReactDOMStyle.js
var emptyObject2 = {};
var supportsCSS3TextDecoration = !canUseDom_default || window.CSS != null && window.CSS.supports != null && (window.CSS.supports("text-decoration-line", "none") || window.CSS.supports("-webkit-text-decoration-line", "none"));
var MONOSPACE_FONT_STACK = "monospace,monospace";
var SYSTEM_FONT_STACK = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
var STYLE_SHORT_FORM_EXPANSIONS = {
  borderColor: ["borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"],
  borderBlockColor: ["borderTopColor", "borderBottomColor"],
  borderInlineColor: ["borderRightColor", "borderLeftColor"],
  borderRadius: ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"],
  borderStyle: ["borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle"],
  borderBlockStyle: ["borderTopStyle", "borderBottomStyle"],
  borderInlineStyle: ["borderRightStyle", "borderLeftStyle"],
  borderWidth: ["borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"],
  borderBlockWidth: ["borderTopWidth", "borderBottomWidth"],
  borderInlineWidth: ["borderRightWidth", "borderLeftWidth"],
  insetBlock: ["top", "bottom"],
  insetInline: ["left", "right"],
  marginBlock: ["marginTop", "marginBottom"],
  marginInline: ["marginRight", "marginLeft"],
  paddingBlock: ["paddingTop", "paddingBottom"],
  paddingInline: ["paddingRight", "paddingLeft"],
  overflow: ["overflowX", "overflowY"],
  overscrollBehavior: ["overscrollBehaviorX", "overscrollBehaviorY"],
  borderBlockStartColor: ["borderTopColor"],
  borderBlockStartStyle: ["borderTopStyle"],
  borderBlockStartWidth: ["borderTopWidth"],
  borderBlockEndColor: ["borderBottomColor"],
  borderBlockEndStyle: ["borderBottomStyle"],
  borderBlockEndWidth: ["borderBottomWidth"],
  //borderInlineStartColor: ['borderLeftColor'],
  //borderInlineStartStyle: ['borderLeftStyle'],
  //borderInlineStartWidth: ['borderLeftWidth'],
  //borderInlineEndColor: ['borderRightColor'],
  //borderInlineEndStyle: ['borderRightStyle'],
  //borderInlineEndWidth: ['borderRightWidth'],
  borderEndStartRadius: ["borderBottomLeftRadius"],
  borderEndEndRadius: ["borderBottomRightRadius"],
  borderStartStartRadius: ["borderTopLeftRadius"],
  borderStartEndRadius: ["borderTopRightRadius"],
  insetBlockEnd: ["bottom"],
  insetBlockStart: ["top"],
  //insetInlineEnd: ['right'],
  //insetInlineStart: ['left'],
  marginBlockStart: ["marginTop"],
  marginBlockEnd: ["marginBottom"],
  //marginInlineStart: ['marginLeft'],
  //marginInlineEnd: ['marginRight'],
  paddingBlockStart: ["paddingTop"],
  paddingBlockEnd: ["paddingBottom"]
  //paddingInlineStart: ['marginLeft'],
  //paddingInlineEnd: ['marginRight'],
};
var createReactDOMStyle = /* @__PURE__ */ __name((style, isInline) => {
  if (!style) {
    return emptyObject2;
  }
  var resolvedStyle = {};
  var _loop = /* @__PURE__ */ __name(function _loop2() {
    var value = style[prop];
    if (
      // Ignore everything with a null value
      value == null
    ) {
      return "continue";
    }
    if (prop === "backgroundClip") {
      if (value === "text") {
        resolvedStyle.backgroundClip = value;
        resolvedStyle.WebkitBackgroundClip = value;
      }
    } else if (prop === "flex") {
      if (value === -1) {
        resolvedStyle.flexGrow = 0;
        resolvedStyle.flexShrink = 1;
        resolvedStyle.flexBasis = "auto";
      } else {
        resolvedStyle.flex = value;
      }
    } else if (prop === "font") {
      resolvedStyle[prop] = value.replace("System", SYSTEM_FONT_STACK);
    } else if (prop === "fontFamily") {
      if (value.indexOf("System") > -1) {
        var stack = value.split(/,\s*/);
        stack[stack.indexOf("System")] = SYSTEM_FONT_STACK;
        resolvedStyle[prop] = stack.join(",");
      } else if (value === "monospace") {
        resolvedStyle[prop] = MONOSPACE_FONT_STACK;
      } else {
        resolvedStyle[prop] = value;
      }
    } else if (prop === "textDecorationLine") {
      if (!supportsCSS3TextDecoration) {
        resolvedStyle.textDecoration = value;
      } else {
        resolvedStyle.textDecorationLine = value;
      }
    } else if (prop === "writingDirection") {
      resolvedStyle.direction = value;
    } else {
      var _value = normalizeValueWithProperty(style[prop], prop);
      var longFormProperties = STYLE_SHORT_FORM_EXPANSIONS[prop];
      if (isInline && prop === "inset") {
        if (style.insetInline == null) {
          resolvedStyle.left = _value;
          resolvedStyle.right = _value;
        }
        if (style.insetBlock == null) {
          resolvedStyle.top = _value;
          resolvedStyle.bottom = _value;
        }
      } else if (isInline && prop === "margin") {
        if (style.marginInline == null) {
          resolvedStyle.marginLeft = _value;
          resolvedStyle.marginRight = _value;
        }
        if (style.marginBlock == null) {
          resolvedStyle.marginTop = _value;
          resolvedStyle.marginBottom = _value;
        }
      } else if (isInline && prop === "padding") {
        if (style.paddingInline == null) {
          resolvedStyle.paddingLeft = _value;
          resolvedStyle.paddingRight = _value;
        }
        if (style.paddingBlock == null) {
          resolvedStyle.paddingTop = _value;
          resolvedStyle.paddingBottom = _value;
        }
      } else if (longFormProperties) {
        longFormProperties.forEach((longForm, i) => {
          if (style[longForm] == null) {
            resolvedStyle[longForm] = _value;
          }
        });
      } else {
        resolvedStyle[prop] = _value;
      }
    }
  }, "_loop");
  for (var prop in style) {
    var _ret = _loop();
    if (_ret === "continue") continue;
  }
  return resolvedStyle;
}, "createReactDOMStyle");
var createReactDOMStyle_default = createReactDOMStyle;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/hash.js
function murmurhash2_32_gc(str, seed) {
  var l = str.length, h = seed ^ l, i = 0, k;
  while (l >= 4) {
    k = str.charCodeAt(i) & 255 | (str.charCodeAt(++i) & 255) << 8 | (str.charCodeAt(++i) & 255) << 16 | (str.charCodeAt(++i) & 255) << 24;
    k = (k & 65535) * 1540483477 + (((k >>> 16) * 1540483477 & 65535) << 16);
    k ^= k >>> 24;
    k = (k & 65535) * 1540483477 + (((k >>> 16) * 1540483477 & 65535) << 16);
    h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16) ^ k;
    l -= 4;
    ++i;
  }
  switch (l) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 255) << 16;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 255) << 8;
    case 1:
      h ^= str.charCodeAt(i) & 255;
      h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16);
  }
  h ^= h >>> 13;
  h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16);
  h ^= h >>> 15;
  return h >>> 0;
}
__name(murmurhash2_32_gc, "murmurhash2_32_gc");
var hash = /* @__PURE__ */ __name((str) => murmurhash2_32_gc(str, 1).toString(36), "hash");
var hash_default = hash;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/hyphenateStyleName.js
var uppercasePattern = /[A-Z]/g;
var msPattern = /^ms-/;
var cache2 = {};
function toHyphenLower(match) {
  return "-" + match.toLowerCase();
}
__name(toHyphenLower, "toHyphenLower");
function hyphenateStyleName(name) {
  if (name in cache2) {
    return cache2[name];
  }
  var hName = name.replace(uppercasePattern, toHyphenLower);
  return cache2[name] = msPattern.test(hName) ? "-" + hName : hName;
}
__name(hyphenateStyleName, "hyphenateStyleName");
var hyphenateStyleName_default = hyphenateStyleName;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/prefixStyles/index.js
var import_createPrefixer = __toESM(require_createPrefixer());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/prefixStyles/static.js
var import_crossFade = __toESM(require_crossFade());
var import_imageSet = __toESM(require_imageSet());
var import_logical = __toESM(require_logical());
var import_position = __toESM(require_position());
var import_sizing = __toESM(require_sizing());
var import_transition = __toESM(require_transition());
var w = ["Webkit"];
var m = ["Moz"];
var wm = ["Webkit", "Moz"];
var wms = ["Webkit", "ms"];
var wmms = ["Webkit", "Moz", "ms"];
var static_default = {
  plugins: [import_crossFade.default, import_imageSet.default, import_logical.default, import_position.default, import_sizing.default, import_transition.default],
  prefixMap: {
    appearance: wmms,
    userSelect: wm,
    textEmphasisPosition: wms,
    textEmphasis: wms,
    textEmphasisStyle: wms,
    textEmphasisColor: wms,
    boxDecorationBreak: wms,
    clipPath: w,
    maskImage: wms,
    maskMode: wms,
    maskRepeat: wms,
    maskPosition: wms,
    maskClip: wms,
    maskOrigin: wms,
    maskSize: wms,
    maskComposite: wms,
    mask: wms,
    maskBorderSource: wms,
    maskBorderMode: wms,
    maskBorderSlice: wms,
    maskBorderWidth: wms,
    maskBorderOutset: wms,
    maskBorderRepeat: wms,
    maskBorder: wms,
    maskType: wms,
    textDecorationStyle: w,
    textDecorationSkip: w,
    textDecorationLine: w,
    textDecorationColor: w,
    filter: w,
    breakAfter: w,
    breakBefore: w,
    breakInside: w,
    columnCount: w,
    columnFill: w,
    columnGap: w,
    columnRule: w,
    columnRuleColor: w,
    columnRuleStyle: w,
    columnRuleWidth: w,
    columns: w,
    columnSpan: w,
    columnWidth: w,
    backdropFilter: w,
    hyphens: w,
    flowInto: w,
    flowFrom: w,
    regionFragment: w,
    textOrientation: w,
    tabSize: m,
    fontKerning: w,
    textSizeAdjust: w
  }
};

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/prefixStyles/index.js
var prefixAll = (0, import_createPrefixer.default)(static_default);
var prefixStyles_default = prefixAll;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/compiler/index.js
var _excluded = ["animationKeyframes"];
var cache5 = /* @__PURE__ */ new Map();
var emptyObject3 = {};
var classicGroup = 1;
var atomicGroup = 3;
var customGroup = {
  borderColor: 2,
  borderRadius: 2,
  borderStyle: 2,
  borderWidth: 2,
  display: 2,
  flex: 2,
  inset: 2,
  margin: 2,
  overflow: 2,
  overscrollBehavior: 2,
  padding: 2,
  insetBlock: 2.1,
  insetInline: 2.1,
  marginInline: 2.1,
  marginBlock: 2.1,
  paddingInline: 2.1,
  paddingBlock: 2.1,
  borderBlockStartColor: 2.2,
  borderBlockStartStyle: 2.2,
  borderBlockStartWidth: 2.2,
  borderBlockEndColor: 2.2,
  borderBlockEndStyle: 2.2,
  borderBlockEndWidth: 2.2,
  borderInlineStartColor: 2.2,
  borderInlineStartStyle: 2.2,
  borderInlineStartWidth: 2.2,
  borderInlineEndColor: 2.2,
  borderInlineEndStyle: 2.2,
  borderInlineEndWidth: 2.2,
  borderEndStartRadius: 2.2,
  borderEndEndRadius: 2.2,
  borderStartStartRadius: 2.2,
  borderStartEndRadius: 2.2,
  insetBlockEnd: 2.2,
  insetBlockStart: 2.2,
  insetInlineEnd: 2.2,
  insetInlineStart: 2.2,
  marginBlockStart: 2.2,
  marginBlockEnd: 2.2,
  marginInlineStart: 2.2,
  marginInlineEnd: 2.2,
  paddingBlockStart: 2.2,
  paddingBlockEnd: 2.2,
  paddingInlineStart: 2.2,
  paddingInlineEnd: 2.2
};
var borderTopLeftRadius = "borderTopLeftRadius";
var borderTopRightRadius = "borderTopRightRadius";
var borderBottomLeftRadius = "borderBottomLeftRadius";
var borderBottomRightRadius = "borderBottomRightRadius";
var borderLeftColor = "borderLeftColor";
var borderLeftStyle = "borderLeftStyle";
var borderLeftWidth = "borderLeftWidth";
var borderRightColor = "borderRightColor";
var borderRightStyle = "borderRightStyle";
var borderRightWidth = "borderRightWidth";
var right = "right";
var marginLeft = "marginLeft";
var marginRight = "marginRight";
var paddingLeft = "paddingLeft";
var paddingRight = "paddingRight";
var left = "left";
var PROPERTIES_FLIP = {
  [borderTopLeftRadius]: borderTopRightRadius,
  [borderTopRightRadius]: borderTopLeftRadius,
  [borderBottomLeftRadius]: borderBottomRightRadius,
  [borderBottomRightRadius]: borderBottomLeftRadius,
  [borderLeftColor]: borderRightColor,
  [borderLeftStyle]: borderRightStyle,
  [borderLeftWidth]: borderRightWidth,
  [borderRightColor]: borderLeftColor,
  [borderRightStyle]: borderLeftStyle,
  [borderRightWidth]: borderLeftWidth,
  [left]: right,
  [marginLeft]: marginRight,
  [marginRight]: marginLeft,
  [paddingLeft]: paddingRight,
  [paddingRight]: paddingLeft,
  [right]: left
};
var PROPERTIES_I18N = {
  borderStartStartRadius: borderTopLeftRadius,
  borderStartEndRadius: borderTopRightRadius,
  borderEndStartRadius: borderBottomLeftRadius,
  borderEndEndRadius: borderBottomRightRadius,
  borderInlineStartColor: borderLeftColor,
  borderInlineStartStyle: borderLeftStyle,
  borderInlineStartWidth: borderLeftWidth,
  borderInlineEndColor: borderRightColor,
  borderInlineEndStyle: borderRightStyle,
  borderInlineEndWidth: borderRightWidth,
  insetInlineEnd: right,
  insetInlineStart: left,
  marginInlineStart: marginLeft,
  marginInlineEnd: marginRight,
  paddingInlineStart: paddingLeft,
  paddingInlineEnd: paddingRight
};
var PROPERTIES_VALUE = ["clear", "float", "textAlign"];
function atomic(style) {
  var compiledStyle = {
    $$css: true
  };
  var compiledRules = [];
  function atomicCompile(srcProp, prop, value) {
    var valueString = stringifyValueWithProperty(value, prop);
    var cacheKey = prop + valueString;
    var cachedResult2 = cache5.get(cacheKey);
    var identifier;
    if (cachedResult2 != null) {
      identifier = cachedResult2[0];
      compiledRules.push(cachedResult2[1]);
    } else {
      var v = srcProp !== prop ? cacheKey : valueString;
      identifier = createIdentifier("r", srcProp, v);
      var order = customGroup[srcProp] || atomicGroup;
      var rules = createAtomicRules(identifier, prop, value);
      var orderedRules = [rules, order];
      compiledRules.push(orderedRules);
      cache5.set(cacheKey, [identifier, orderedRules]);
    }
    return identifier;
  }
  __name(atomicCompile, "atomicCompile");
  Object.keys(style).sort().forEach((srcProp) => {
    var value = style[srcProp];
    if (value != null) {
      var localizeableValue;
      if (PROPERTIES_VALUE.indexOf(srcProp) > -1) {
        var _left = atomicCompile(srcProp, srcProp, "left");
        var _right = atomicCompile(srcProp, srcProp, "right");
        if (value === "start") {
          localizeableValue = [_left, _right];
        } else if (value === "end") {
          localizeableValue = [_right, _left];
        }
      }
      var propPolyfill = PROPERTIES_I18N[srcProp];
      if (propPolyfill != null) {
        var ltr = atomicCompile(srcProp, propPolyfill, value);
        var rtl = atomicCompile(srcProp, PROPERTIES_FLIP[propPolyfill], value);
        localizeableValue = [ltr, rtl];
      }
      if (srcProp === "transitionProperty") {
        var values = Array.isArray(value) ? value : [value];
        var polyfillIndices = [];
        for (var i = 0; i < values.length; i++) {
          var val = values[i];
          if (typeof val === "string" && PROPERTIES_I18N[val] != null) {
            polyfillIndices.push(i);
          }
        }
        if (polyfillIndices.length > 0) {
          var ltrPolyfillValues = [...values];
          var rtlPolyfillValues = [...values];
          polyfillIndices.forEach((i2) => {
            var ltrVal = ltrPolyfillValues[i2];
            if (typeof ltrVal === "string") {
              var ltrPolyfill = PROPERTIES_I18N[ltrVal];
              var rtlPolyfill = PROPERTIES_FLIP[ltrPolyfill];
              ltrPolyfillValues[i2] = ltrPolyfill;
              rtlPolyfillValues[i2] = rtlPolyfill;
              var _ltr = atomicCompile(srcProp, srcProp, ltrPolyfillValues);
              var _rtl = atomicCompile(srcProp, srcProp, rtlPolyfillValues);
              localizeableValue = [_ltr, _rtl];
            }
          });
        }
      }
      if (localizeableValue == null) {
        localizeableValue = atomicCompile(srcProp, srcProp, value);
      } else {
        compiledStyle["$$css$localize"] = true;
      }
      compiledStyle[srcProp] = localizeableValue;
    }
  });
  return [compiledStyle, compiledRules];
}
__name(atomic, "atomic");
function classic(style, name) {
  var compiledStyle = {
    $$css: true
  };
  var compiledRules = [];
  var animationKeyframes = style.animationKeyframes, rest = (0, import_objectWithoutPropertiesLoose.default)(style, _excluded);
  var identifier = createIdentifier("css", name, JSON.stringify(style));
  var selector = "." + identifier;
  var animationName;
  if (animationKeyframes != null) {
    var _processKeyframesValu = processKeyframesValue(animationKeyframes), animationNames = _processKeyframesValu[0], keyframesRules = _processKeyframesValu[1];
    animationName = animationNames.join(",");
    compiledRules.push(...keyframesRules);
  }
  var block = createDeclarationBlock((0, import_objectSpread2.default)((0, import_objectSpread2.default)({}, rest), {}, {
    animationName
  }));
  compiledRules.push("" + selector + block);
  compiledStyle[identifier] = identifier;
  return [compiledStyle, [[compiledRules, classicGroup]]];
}
__name(classic, "classic");
function inline(originalStyle, isRTL2) {
  var style = originalStyle || emptyObject3;
  var frozenProps = {};
  var nextStyle = {};
  var _loop = /* @__PURE__ */ __name(function _loop2() {
    var originalValue = style[originalProp];
    var prop = originalProp;
    var value = originalValue;
    if (!Object.prototype.hasOwnProperty.call(style, originalProp) || originalValue == null) {
      return "continue";
    }
    if (PROPERTIES_VALUE.indexOf(originalProp) > -1) {
      if (originalValue === "start") {
        value = isRTL2 ? "right" : "left";
      } else if (originalValue === "end") {
        value = isRTL2 ? "left" : "right";
      }
    }
    var propPolyfill = PROPERTIES_I18N[originalProp];
    if (propPolyfill != null) {
      prop = isRTL2 ? PROPERTIES_FLIP[propPolyfill] : propPolyfill;
    }
    if (originalProp === "transitionProperty") {
      var originalValues = Array.isArray(originalValue) ? originalValue : [originalValue];
      originalValues.forEach((val, i) => {
        if (typeof val === "string") {
          var valuePolyfill = PROPERTIES_I18N[val];
          if (valuePolyfill != null) {
            originalValues[i] = isRTL2 ? PROPERTIES_FLIP[valuePolyfill] : valuePolyfill;
            value = originalValues.join(" ");
          }
        }
      });
    }
    if (!frozenProps[prop]) {
      nextStyle[prop] = value;
    }
    if (prop === originalProp) {
      frozenProps[prop] = true;
    }
  }, "_loop");
  for (var originalProp in style) {
    var _ret = _loop();
    if (_ret === "continue") continue;
  }
  return createReactDOMStyle_default(nextStyle, true);
}
__name(inline, "inline");
function stringifyValueWithProperty(value, property) {
  var normalizedValue = normalizeValueWithProperty(value, property);
  return typeof normalizedValue !== "string" ? JSON.stringify(normalizedValue || "") : normalizedValue;
}
__name(stringifyValueWithProperty, "stringifyValueWithProperty");
function createAtomicRules(identifier, property, value) {
  var rules = [];
  var selector = "." + identifier;
  switch (property) {
    case "animationKeyframes": {
      var _processKeyframesValu2 = processKeyframesValue(value), animationNames = _processKeyframesValu2[0], keyframesRules = _processKeyframesValu2[1];
      var block = createDeclarationBlock({
        animationName: animationNames.join(",")
      });
      rules.push("" + selector + block, ...keyframesRules);
      break;
    }
    // Equivalent to using '::placeholder'
    case "placeholderTextColor": {
      var _block = createDeclarationBlock({
        color: value,
        opacity: 1
      });
      rules.push(selector + "::-webkit-input-placeholder" + _block, selector + "::-moz-placeholder" + _block, selector + ":-ms-input-placeholder" + _block, selector + "::placeholder" + _block);
      break;
    }
    // Polyfill for additional 'pointer-events' values
    // See d13f78622b233a0afc0c7a200c0a0792c8ca9e58
    // See https://reactnative.dev/docs/view#pointerevents
    case "pointerEvents": {
      var finalValue = value;
      if (value === "auto") {
        finalValue = "auto!important";
      } else if (value === "none") {
        finalValue = "none!important";
        var _block2 = createDeclarationBlock({
          pointerEvents: "none"
        });
        rules.push(selector + ">* " + _block2);
      } else if (value === "box-none") {
        finalValue = "none!important";
        var _block3 = createDeclarationBlock({
          pointerEvents: "auto"
        });
        rules.push(selector + ">* " + _block3);
      } else if (value === "box-only") {
        finalValue = "auto!important";
        var _block4 = createDeclarationBlock({
          pointerEvents: "none"
        });
        rules.push(selector + ">* " + _block4);
      }
      var _block5 = createDeclarationBlock({
        pointerEvents: finalValue
      });
      rules.push("" + selector + _block5);
      break;
    }
    // Polyfill for draft spec
    // https://drafts.csswg.org/css-scrollbars-1/
    case "scrollbarWidth": {
      if (value === "none") {
        rules.push(selector + "::-webkit-scrollbar{display:none}");
      }
      var _block6 = createDeclarationBlock({
        scrollbarWidth: value
      });
      rules.push("" + selector + _block6);
      break;
    }
    default: {
      var _block7 = createDeclarationBlock({
        [property]: value
      });
      rules.push("" + selector + _block7);
      break;
    }
  }
  return rules;
}
__name(createAtomicRules, "createAtomicRules");
function createDeclarationBlock(style) {
  var domStyle = prefixStyles_default(createReactDOMStyle_default(style));
  var declarationsString = Object.keys(domStyle).map((property) => {
    var value = domStyle[property];
    var prop = hyphenateStyleName_default(property);
    if (Array.isArray(value)) {
      return value.map((v) => prop + ":" + v).join(";");
    } else {
      return prop + ":" + value;
    }
  }).sort().join(";");
  return "{" + declarationsString + ";}";
}
__name(createDeclarationBlock, "createDeclarationBlock");
function createIdentifier(prefix, name, key) {
  var hashedString = hash_default(name + key);
  return process.env.NODE_ENV !== "production" ? prefix + "-" + name + "-" + hashedString : prefix + "-" + hashedString;
}
__name(createIdentifier, "createIdentifier");
function createKeyframes(keyframes) {
  var prefixes4 = ["-webkit-", ""];
  var identifier = createIdentifier("r", "animation", JSON.stringify(keyframes));
  var steps = "{" + Object.keys(keyframes).map((stepName) => {
    var rule = keyframes[stepName];
    var block = createDeclarationBlock(rule);
    return "" + stepName + block;
  }).join("") + "}";
  var rules = prefixes4.map((prefix) => {
    return "@" + prefix + "keyframes " + identifier + steps;
  });
  return [identifier, rules];
}
__name(createKeyframes, "createKeyframes");
function processKeyframesValue(keyframesValue) {
  if (typeof keyframesValue === "number") {
    throw new Error("Invalid CSS keyframes type: " + typeof keyframesValue);
  }
  var animationNames = [];
  var rules = [];
  var value = Array.isArray(keyframesValue) ? keyframesValue : [keyframesValue];
  value.forEach((keyframes) => {
    if (typeof keyframes === "string") {
      animationNames.push(keyframes);
    } else {
      var _createKeyframes = createKeyframes(keyframes), identifier = _createKeyframes[0], keyframesRules = _createKeyframes[1];
      animationNames.push(identifier);
      rules.push(...keyframesRules);
    }
  });
  return [animationNames, rules];
}
__name(processKeyframesValue, "processKeyframesValue");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/dom/createCSSStyleSheet.js
function createCSSStyleSheet(id, rootNode, textContent) {
  if (canUseDom_default) {
    var root = rootNode != null ? rootNode : document;
    var element = root.getElementById(id);
    if (element == null) {
      element = document.createElement("style");
      element.setAttribute("id", id);
      if (typeof textContent === "string") {
        element.appendChild(document.createTextNode(textContent));
      }
      if (root instanceof ShadowRoot) {
        root.insertBefore(element, root.firstChild);
      } else {
        var head = root.head;
        if (head) {
          head.insertBefore(element, head.firstChild);
        }
      }
    }
    return element.sheet;
  } else {
    return null;
  }
}
__name(createCSSStyleSheet, "createCSSStyleSheet");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/dom/createOrderedCSSStyleSheet.js
var slice = Array.prototype.slice;
function createOrderedCSSStyleSheet(sheet2) {
  var groups = {};
  var selectors = {};
  if (sheet2 != null) {
    var group;
    slice.call(sheet2.cssRules).forEach((cssRule, i) => {
      var cssText = cssRule.cssText;
      if (cssText.indexOf("stylesheet-group") > -1) {
        group = decodeGroupRule(cssRule);
        groups[group] = {
          start: i,
          rules: [cssText]
        };
      } else {
        var selectorText = getSelectorText(cssText);
        if (selectorText != null) {
          selectors[selectorText] = true;
          groups[group].rules.push(cssText);
        }
      }
    });
  }
  function sheetInsert(sheet3, group2, text) {
    var orderedGroups = getOrderedGroups(groups);
    var groupIndex = orderedGroups.indexOf(group2);
    var nextGroupIndex = groupIndex + 1;
    var nextGroup = orderedGroups[nextGroupIndex];
    var position2 = nextGroup != null && groups[nextGroup].start != null ? groups[nextGroup].start : sheet3.cssRules.length;
    var isInserted = insertRuleAt(sheet3, text, position2);
    if (isInserted) {
      if (groups[group2].start == null) {
        groups[group2].start = position2;
      }
      for (var i = nextGroupIndex; i < orderedGroups.length; i += 1) {
        var groupNumber = orderedGroups[i];
        var previousStart = groups[groupNumber].start || 0;
        groups[groupNumber].start = previousStart + 1;
      }
    }
    return isInserted;
  }
  __name(sheetInsert, "sheetInsert");
  var OrderedCSSStyleSheet = {
    /**
     * The textContent of the style sheet.
     */
    getTextContent() {
      return getOrderedGroups(groups).map((group2) => {
        var rules = groups[group2].rules;
        var marker = rules.shift();
        rules.sort();
        rules.unshift(marker);
        return rules.join("\n");
      }).join("\n");
    },
    /**
     * Insert a rule into the style sheet
     */
    insert(cssText, groupValue) {
      var group2 = Number(groupValue);
      if (groups[group2] == null) {
        var markerRule = encodeGroupRule(group2);
        groups[group2] = {
          start: null,
          rules: [markerRule]
        };
        if (sheet2 != null) {
          sheetInsert(sheet2, group2, markerRule);
        }
      }
      var selectorText = getSelectorText(cssText);
      if (selectorText != null && selectors[selectorText] == null) {
        selectors[selectorText] = true;
        groups[group2].rules.push(cssText);
        if (sheet2 != null) {
          var isInserted = sheetInsert(sheet2, group2, cssText);
          if (!isInserted) {
            groups[group2].rules.pop();
          }
        }
      }
    }
  };
  return OrderedCSSStyleSheet;
}
__name(createOrderedCSSStyleSheet, "createOrderedCSSStyleSheet");
function encodeGroupRule(group) {
  return '[stylesheet-group="' + group + '"]{}';
}
__name(encodeGroupRule, "encodeGroupRule");
var groupPattern = /["']/g;
function decodeGroupRule(cssRule) {
  return Number(cssRule.selectorText.split(groupPattern)[1]);
}
__name(decodeGroupRule, "decodeGroupRule");
function getOrderedGroups(obj) {
  return Object.keys(obj).map(Number).sort((a, b) => a > b ? 1 : -1);
}
__name(getOrderedGroups, "getOrderedGroups");
var selectorPattern = /\s*([,])\s*/g;
function getSelectorText(cssText) {
  var selector = cssText.split("{")[0].trim();
  return selector !== "" ? selector.replace(selectorPattern, "$1") : null;
}
__name(getSelectorText, "getSelectorText");
function insertRuleAt(root, cssText, position2) {
  try {
    root.insertRule(cssText, position2);
    return true;
  } catch (e) {
    return false;
  }
}
__name(insertRuleAt, "insertRuleAt");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/dom/index.js
var defaultId = "react-native-stylesheet";
var roots = /* @__PURE__ */ new WeakMap();
var sheets = [];
var initialRules = [
  // minimal top-level reset
  "html{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:rgba(0,0,0,0);}",
  "body{margin:0;}",
  // minimal form pseudo-element reset
  "button::-moz-focus-inner,input::-moz-focus-inner{border:0;padding:0;}",
  "input::-webkit-search-cancel-button,input::-webkit-search-decoration,input::-webkit-search-results-button,input::-webkit-search-results-decoration{display:none;}"
];
function createSheet(root, id) {
  if (id === void 0) {
    id = defaultId;
  }
  var sheet2;
  if (canUseDom_default) {
    var rootNode = root != null ? root.getRootNode() : document;
    if (sheets.length === 0) {
      sheet2 = createOrderedCSSStyleSheet(createCSSStyleSheet(id));
      initialRules.forEach((rule) => {
        sheet2.insert(rule, 0);
      });
      roots.set(rootNode, sheets.length);
      sheets.push(sheet2);
    } else {
      var index2 = roots.get(rootNode);
      if (index2 == null) {
        var initialSheet = sheets[0];
        var textContent = initialSheet != null ? initialSheet.getTextContent() : "";
        sheet2 = createOrderedCSSStyleSheet(createCSSStyleSheet(id, rootNode, textContent));
        roots.set(rootNode, sheets.length);
        sheets.push(sheet2);
      } else {
        sheet2 = sheets[index2];
      }
    }
  } else {
    if (sheets.length === 0) {
      sheet2 = createOrderedCSSStyleSheet(createCSSStyleSheet(id));
      initialRules.forEach((rule) => {
        sheet2.insert(rule, 0);
      });
      sheets.push(sheet2);
    } else {
      sheet2 = sheets[0];
    }
  }
  return {
    getTextContent() {
      return sheet2.getTextContent();
    },
    id,
    insert(cssText, groupValue) {
      sheets.forEach((s) => {
        s.insert(cssText, groupValue);
      });
    }
  };
}
__name(createSheet, "createSheet");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/index.js
var import_transform_localize_style = __toESM(require_transform_localize_style2());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/warnOnce/index.js
var warnedKeys = {};
function warnOnce(key, message) {
  if (process.env.NODE_ENV !== "production") {
    if (warnedKeys[key]) {
      return;
    }
    console.warn(message);
    warnedKeys[key] = true;
  }
}
__name(warnOnce, "warnOnce");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/preprocess.js
var emptyObject4 = {};
var defaultOffset = {
  height: 0,
  width: 0
};
var createBoxShadowValue = /* @__PURE__ */ __name((style) => {
  var shadowColor = style.shadowColor, shadowOffset = style.shadowOffset, shadowOpacity = style.shadowOpacity, shadowRadius = style.shadowRadius;
  var _ref = shadowOffset || defaultOffset, height = _ref.height, width = _ref.width;
  var offsetX = normalizeValueWithProperty(width);
  var offsetY = normalizeValueWithProperty(height);
  var blurRadius = normalizeValueWithProperty(shadowRadius || 0);
  var color = normalizeColor_default(shadowColor || "black", shadowOpacity);
  if (color != null && offsetX != null && offsetY != null && blurRadius != null) {
    return offsetX + " " + offsetY + " " + blurRadius + " " + color;
  }
}, "createBoxShadowValue");
var createTextShadowValue = /* @__PURE__ */ __name((style) => {
  var textShadowColor = style.textShadowColor, textShadowOffset = style.textShadowOffset, textShadowRadius = style.textShadowRadius;
  var _ref2 = textShadowOffset || defaultOffset, height = _ref2.height, width = _ref2.width;
  var radius = textShadowRadius || 0;
  var offsetX = normalizeValueWithProperty(width);
  var offsetY = normalizeValueWithProperty(height);
  var blurRadius = normalizeValueWithProperty(radius);
  var color = normalizeValueWithProperty(textShadowColor, "textShadowColor");
  if (color && (height !== 0 || width !== 0 || radius !== 0) && offsetX != null && offsetY != null && blurRadius != null) {
    return offsetX + " " + offsetY + " " + blurRadius + " " + color;
  }
}, "createTextShadowValue");
var mapBoxShadow = /* @__PURE__ */ __name((boxShadow) => {
  if (typeof boxShadow === "string") {
    return boxShadow;
  }
  var offsetX = normalizeValueWithProperty(boxShadow.offsetX) || 0;
  var offsetY = normalizeValueWithProperty(boxShadow.offsetY) || 0;
  var blurRadius = normalizeValueWithProperty(boxShadow.blurRadius) || 0;
  var spreadDistance = normalizeValueWithProperty(boxShadow.spreadDistance) || 0;
  var color = normalizeColor_default(boxShadow.color) || "black";
  var position2 = boxShadow.inset ? "inset " : "";
  return "" + position2 + offsetX + " " + offsetY + " " + blurRadius + " " + spreadDistance + " " + color;
}, "mapBoxShadow");
var createBoxShadowArrayValue = /* @__PURE__ */ __name((value) => {
  return value.map(mapBoxShadow).join(", ");
}, "createBoxShadowArrayValue");
var mapTransform = /* @__PURE__ */ __name((transform) => {
  var type = Object.keys(transform)[0];
  var value = transform[type];
  if (type === "matrix" || type === "matrix3d") {
    return type + "(" + value.join(",") + ")";
  } else {
    var normalizedValue = normalizeValueWithProperty(value, type);
    return type + "(" + normalizedValue + ")";
  }
}, "mapTransform");
var createTransformValue = /* @__PURE__ */ __name((value) => {
  return value.map(mapTransform).join(" ");
}, "createTransformValue");
var createTransformOriginValue = /* @__PURE__ */ __name((value) => {
  return value.map((v) => normalizeValueWithProperty(v)).join(" ");
}, "createTransformOriginValue");
var PROPERTIES_STANDARD = {
  borderBottomEndRadius: "borderEndEndRadius",
  borderBottomStartRadius: "borderEndStartRadius",
  borderTopEndRadius: "borderStartEndRadius",
  borderTopStartRadius: "borderStartStartRadius",
  borderEndColor: "borderInlineEndColor",
  borderEndStyle: "borderInlineEndStyle",
  borderEndWidth: "borderInlineEndWidth",
  borderStartColor: "borderInlineStartColor",
  borderStartStyle: "borderInlineStartStyle",
  borderStartWidth: "borderInlineStartWidth",
  end: "insetInlineEnd",
  marginEnd: "marginInlineEnd",
  marginHorizontal: "marginInline",
  marginStart: "marginInlineStart",
  marginVertical: "marginBlock",
  paddingEnd: "paddingInlineEnd",
  paddingHorizontal: "paddingInline",
  paddingStart: "paddingInlineStart",
  paddingVertical: "paddingBlock",
  start: "insetInlineStart"
};
var ignoredProps = {
  elevation: true,
  overlayColor: true,
  resizeMode: true,
  tintColor: true
};
var preprocess = /* @__PURE__ */ __name(function preprocess2(originalStyle, options) {
  if (options === void 0) {
    options = {};
  }
  var style = originalStyle || emptyObject4;
  var nextStyle = {};
  if (options.shadow === true, style.shadowColor != null || style.shadowOffset != null || style.shadowOpacity != null || style.shadowRadius != null) {
    warnOnce("shadowStyles", '"shadow*" style props are deprecated. Use "boxShadow".');
    var boxShadowValue = createBoxShadowValue(style);
    if (boxShadowValue != null) {
      nextStyle.boxShadow = boxShadowValue;
    }
  }
  if (options.textShadow === true, style.textShadowColor != null || style.textShadowOffset != null || style.textShadowRadius != null) {
    warnOnce("textShadowStyles", '"textShadow*" style props are deprecated. Use "textShadow".');
    var textShadowValue = createTextShadowValue(style);
    if (textShadowValue != null && nextStyle.textShadow == null) {
      var textShadow = style.textShadow;
      var value = textShadow ? textShadow + ", " + textShadowValue : textShadowValue;
      nextStyle.textShadow = value;
    }
  }
  for (var originalProp in style) {
    if (
      // Ignore some React Native styles
      ignoredProps[originalProp] != null || originalProp === "shadowColor" || originalProp === "shadowOffset" || originalProp === "shadowOpacity" || originalProp === "shadowRadius" || originalProp === "textShadowColor" || originalProp === "textShadowOffset" || originalProp === "textShadowRadius"
    ) {
      continue;
    }
    var originalValue = style[originalProp];
    var prop = PROPERTIES_STANDARD[originalProp] || originalProp;
    var _value = originalValue;
    if (!Object.prototype.hasOwnProperty.call(style, originalProp) || prop !== originalProp && style[prop] != null) {
      continue;
    }
    if (prop === "aspectRatio" && typeof _value === "number") {
      nextStyle[prop] = _value.toString();
    } else if (prop === "boxShadow") {
      if (Array.isArray(_value)) {
        _value = createBoxShadowArrayValue(_value);
      }
      var boxShadow = nextStyle.boxShadow;
      nextStyle.boxShadow = boxShadow ? _value + ", " + boxShadow : _value;
    } else if (prop === "fontVariant") {
      if (Array.isArray(_value) && _value.length > 0) {
        _value = _value.join(" ");
      }
      nextStyle[prop] = _value;
    } else if (prop === "textAlignVertical") {
      if (style.verticalAlign == null) {
        nextStyle.verticalAlign = _value === "center" ? "middle" : _value;
      }
    } else if (prop === "transform") {
      if (Array.isArray(_value)) {
        _value = createTransformValue(_value);
      }
      nextStyle.transform = _value;
    } else if (prop === "transformOrigin") {
      if (Array.isArray(_value)) {
        _value = createTransformOriginValue(_value);
      }
      nextStyle.transformOrigin = _value;
    } else {
      nextStyle[prop] = _value;
    }
  }
  return nextStyle;
}, "preprocess");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/index.js
var import_styleq = __toESM(require_styleq());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/validate.js
var import_postcss_value_parser = __toESM(require_lib());
var invalidShortforms = {
  background: true,
  borderBottom: true,
  borderLeft: true,
  borderRight: true,
  borderTop: true,
  font: true,
  grid: true,
  outline: true,
  textDecoration: true
};
var invalidMultiValueShortforms = {
  flex: true,
  margin: true,
  padding: true,
  borderColor: true,
  borderRadius: true,
  borderStyle: true,
  borderWidth: true,
  inset: true,
  insetBlock: true,
  insetInline: true,
  marginBlock: true,
  marginInline: true,
  marginHorizontal: true,
  marginVertical: true,
  paddingBlock: true,
  paddingInline: true,
  paddingHorizontal: true,
  paddingVertical: true,
  overflow: true,
  overscrollBehavior: true,
  backgroundPosition: true
};
function error(message) {
  console.error(message);
}
__name(error, "error");
function validate(obj) {
  for (var k in obj) {
    var prop = k.trim();
    var value = obj[prop];
    var isInvalid = false;
    if (value === null) {
      continue;
    }
    if (typeof value === "string" && value.indexOf("!important") > -1) {
      error('Invalid style declaration "' + prop + ":" + value + '". Values cannot include "!important"');
      isInvalid = true;
    } else {
      var suggestion = "";
      if (prop === "animation" || prop === "animationName") {
        suggestion = 'Did you mean "animationKeyframes"?';
        isInvalid = true;
      } else if (prop === "direction") {
        suggestion = 'Did you mean "writingDirection"?';
        isInvalid = true;
      } else if (invalidShortforms[prop]) {
        suggestion = "Please use long-form properties.";
        isInvalid = true;
      } else if (invalidMultiValueShortforms[prop]) {
        if (typeof value === "string" && (0, import_postcss_value_parser.default)(value).nodes.length > 1) {
          suggestion = 'Value is "' + value + '" but only single values are supported.';
          isInvalid = true;
        }
      }
      if (suggestion !== "") {
        error('Invalid style property of "' + prop + '". ' + suggestion);
      }
    }
    if (isInvalid) {
      delete obj[k];
    }
  }
}
__name(validate, "validate");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/StyleSheet/index.js
var _excluded2 = ["writingDirection"];
var staticStyleMap = /* @__PURE__ */ new WeakMap();
var sheet = createSheet();
var defaultPreprocessOptions = {
  shadow: true,
  textShadow: true
};
function customStyleq(styles5, options) {
  if (options === void 0) {
    options = {};
  }
  var _options = options, writingDirection = _options.writingDirection, preprocessOptions = (0, import_objectWithoutPropertiesLoose2.default)(_options, _excluded2);
  var isRTL2 = writingDirection === "rtl";
  return import_styleq.styleq.factory({
    transform(style) {
      var compiledStyle = staticStyleMap.get(style);
      if (compiledStyle != null) {
        return (0, import_transform_localize_style.localizeStyle)(compiledStyle, isRTL2);
      }
      return preprocess(style, (0, import_objectSpread22.default)((0, import_objectSpread22.default)({}, defaultPreprocessOptions), preprocessOptions));
    }
  })(styles5);
}
__name(customStyleq, "customStyleq");
function insertRules(compiledOrderedRules) {
  compiledOrderedRules.forEach((_ref) => {
    var rules = _ref[0], order = _ref[1];
    if (sheet != null) {
      rules.forEach((rule) => {
        sheet.insert(rule, order);
      });
    }
  });
}
__name(insertRules, "insertRules");
function compileAndInsertAtomic(style) {
  var _atomic = atomic(preprocess(style, defaultPreprocessOptions)), compiledStyle = _atomic[0], compiledOrderedRules = _atomic[1];
  insertRules(compiledOrderedRules);
  return compiledStyle;
}
__name(compileAndInsertAtomic, "compileAndInsertAtomic");
function compileAndInsertReset(style, key) {
  var _classic = classic(style, key), compiledStyle = _classic[0], compiledOrderedRules = _classic[1];
  insertRules(compiledOrderedRules);
  return compiledStyle;
}
__name(compileAndInsertReset, "compileAndInsertReset");
var absoluteFillObject = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
};
var absoluteFill = create({
  x: (0, import_objectSpread22.default)({}, absoluteFillObject)
}).x;
function create(styles5) {
  Object.keys(styles5).forEach((key) => {
    var styleObj = styles5[key];
    if (styleObj != null && styleObj.$$css !== true) {
      var compiledStyles;
      if (key.indexOf("$raw") > -1) {
        compiledStyles = compileAndInsertReset(styleObj, key.split("$raw")[0]);
      } else {
        if (process.env.NODE_ENV !== "production") {
          validate(styleObj);
          styles5[key] = Object.freeze(styleObj);
        }
        compiledStyles = compileAndInsertAtomic(styleObj);
      }
      staticStyleMap.set(styleObj, compiledStyles);
    }
  });
  return styles5;
}
__name(create, "create");
function compose(style1, style2) {
  if (process.env.NODE_ENV !== "production") {
    var len = arguments.length;
    if (len > 2) {
      var readableStyles = [...arguments].map((a) => flatten(a));
      throw new Error("StyleSheet.compose() only accepts 2 arguments, received " + len + ": " + JSON.stringify(readableStyles));
    }
  }
  return [style1, style2];
}
__name(compose, "compose");
function flatten() {
  for (var _len = arguments.length, styles5 = new Array(_len), _key = 0; _key < _len; _key++) {
    styles5[_key] = arguments[_key];
  }
  var flatArray = styles5.flat(Infinity);
  var result = {};
  for (var i = 0; i < flatArray.length; i++) {
    var style = flatArray[i];
    if (style != null && typeof style === "object") {
      Object.assign(result, style);
    }
  }
  return result;
}
__name(flatten, "flatten");
function getSheet() {
  return {
    id: sheet.id,
    textContent: sheet.getTextContent()
  };
}
__name(getSheet, "getSheet");
function StyleSheet(styles5, options) {
  if (options === void 0) {
    options = {};
  }
  var isRTL2 = options.writingDirection === "rtl";
  var styleProps2 = customStyleq(styles5, options);
  if (Array.isArray(styleProps2) && styleProps2[1] != null) {
    styleProps2[1] = inline(styleProps2[1], isRTL2);
  }
  return styleProps2;
}
__name(StyleSheet, "StyleSheet");
StyleSheet.absoluteFill = absoluteFill;
StyleSheet.absoluteFillObject = absoluteFillObject;
StyleSheet.create = create;
StyleSheet.compose = compose;
StyleSheet.flatten = flatten;
StyleSheet.getSheet = getSheet;
StyleSheet.hairlineWidth = 1;
if (canUseDom_default && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.resolveRNStyle = StyleSheet.flatten;
}
var stylesheet = StyleSheet;
var StyleSheet_default = stylesheet;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/createDOMProps/index.js
var _excluded3 = ["aria-activedescendant", "accessibilityActiveDescendant", "aria-atomic", "accessibilityAtomic", "aria-autocomplete", "accessibilityAutoComplete", "aria-busy", "accessibilityBusy", "aria-checked", "accessibilityChecked", "aria-colcount", "accessibilityColumnCount", "aria-colindex", "accessibilityColumnIndex", "aria-colspan", "accessibilityColumnSpan", "aria-controls", "accessibilityControls", "aria-current", "accessibilityCurrent", "aria-describedby", "accessibilityDescribedBy", "aria-details", "accessibilityDetails", "aria-disabled", "accessibilityDisabled", "aria-errormessage", "accessibilityErrorMessage", "aria-expanded", "accessibilityExpanded", "aria-flowto", "accessibilityFlowTo", "aria-haspopup", "accessibilityHasPopup", "aria-hidden", "accessibilityHidden", "aria-invalid", "accessibilityInvalid", "aria-keyshortcuts", "accessibilityKeyShortcuts", "aria-label", "accessibilityLabel", "aria-labelledby", "accessibilityLabelledBy", "aria-level", "accessibilityLevel", "aria-live", "accessibilityLiveRegion", "aria-modal", "accessibilityModal", "aria-multiline", "accessibilityMultiline", "aria-multiselectable", "accessibilityMultiSelectable", "aria-orientation", "accessibilityOrientation", "aria-owns", "accessibilityOwns", "aria-placeholder", "accessibilityPlaceholder", "aria-posinset", "accessibilityPosInSet", "aria-pressed", "accessibilityPressed", "aria-readonly", "accessibilityReadOnly", "aria-required", "accessibilityRequired", "role", "accessibilityRole", "aria-roledescription", "accessibilityRoleDescription", "aria-rowcount", "accessibilityRowCount", "aria-rowindex", "accessibilityRowIndex", "aria-rowspan", "accessibilityRowSpan", "aria-selected", "accessibilitySelected", "aria-setsize", "accessibilitySetSize", "aria-sort", "accessibilitySort", "aria-valuemax", "accessibilityValueMax", "aria-valuemin", "accessibilityValueMin", "aria-valuenow", "accessibilityValueNow", "aria-valuetext", "accessibilityValueText", "dataSet", "focusable", "id", "nativeID", "pointerEvents", "style", "tabIndex", "testID"];
var emptyObject5 = {};
var hasOwnProperty = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;
var uppercasePattern3 = /[A-Z]/g;
function toHyphenLower3(match) {
  return "-" + match.toLowerCase();
}
__name(toHyphenLower3, "toHyphenLower");
function hyphenateString(str) {
  return str.replace(uppercasePattern3, toHyphenLower3);
}
__name(hyphenateString, "hyphenateString");
function processIDRefList(idRefList) {
  return isArray(idRefList) ? idRefList.join(" ") : idRefList;
}
__name(processIDRefList, "processIDRefList");
var pointerEventsStyles = StyleSheet_default.create({
  auto: {
    pointerEvents: "auto"
  },
  "box-none": {
    pointerEvents: "box-none"
  },
  "box-only": {
    pointerEvents: "box-only"
  },
  none: {
    pointerEvents: "none"
  }
});
var createDOMProps = /* @__PURE__ */ __name((elementType, props, options) => {
  if (!props) {
    props = emptyObject5;
  }
  var _props = props, ariaActiveDescendant = _props["aria-activedescendant"], accessibilityActiveDescendant = _props.accessibilityActiveDescendant, ariaAtomic = _props["aria-atomic"], accessibilityAtomic = _props.accessibilityAtomic, ariaAutoComplete = _props["aria-autocomplete"], accessibilityAutoComplete = _props.accessibilityAutoComplete, ariaBusy = _props["aria-busy"], accessibilityBusy = _props.accessibilityBusy, ariaChecked = _props["aria-checked"], accessibilityChecked = _props.accessibilityChecked, ariaColumnCount = _props["aria-colcount"], accessibilityColumnCount = _props.accessibilityColumnCount, ariaColumnIndex = _props["aria-colindex"], accessibilityColumnIndex = _props.accessibilityColumnIndex, ariaColumnSpan = _props["aria-colspan"], accessibilityColumnSpan = _props.accessibilityColumnSpan, ariaControls = _props["aria-controls"], accessibilityControls = _props.accessibilityControls, ariaCurrent = _props["aria-current"], accessibilityCurrent = _props.accessibilityCurrent, ariaDescribedBy = _props["aria-describedby"], accessibilityDescribedBy = _props.accessibilityDescribedBy, ariaDetails = _props["aria-details"], accessibilityDetails = _props.accessibilityDetails, ariaDisabled = _props["aria-disabled"], accessibilityDisabled = _props.accessibilityDisabled, ariaErrorMessage = _props["aria-errormessage"], accessibilityErrorMessage = _props.accessibilityErrorMessage, ariaExpanded = _props["aria-expanded"], accessibilityExpanded = _props.accessibilityExpanded, ariaFlowTo = _props["aria-flowto"], accessibilityFlowTo = _props.accessibilityFlowTo, ariaHasPopup = _props["aria-haspopup"], accessibilityHasPopup = _props.accessibilityHasPopup, ariaHidden = _props["aria-hidden"], accessibilityHidden = _props.accessibilityHidden, ariaInvalid = _props["aria-invalid"], accessibilityInvalid = _props.accessibilityInvalid, ariaKeyShortcuts = _props["aria-keyshortcuts"], accessibilityKeyShortcuts = _props.accessibilityKeyShortcuts, ariaLabel = _props["aria-label"], accessibilityLabel = _props.accessibilityLabel, ariaLabelledBy = _props["aria-labelledby"], accessibilityLabelledBy = _props.accessibilityLabelledBy, ariaLevel = _props["aria-level"], accessibilityLevel = _props.accessibilityLevel, ariaLive = _props["aria-live"], accessibilityLiveRegion = _props.accessibilityLiveRegion, ariaModal = _props["aria-modal"], accessibilityModal = _props.accessibilityModal, ariaMultiline = _props["aria-multiline"], accessibilityMultiline = _props.accessibilityMultiline, ariaMultiSelectable = _props["aria-multiselectable"], accessibilityMultiSelectable = _props.accessibilityMultiSelectable, ariaOrientation = _props["aria-orientation"], accessibilityOrientation = _props.accessibilityOrientation, ariaOwns = _props["aria-owns"], accessibilityOwns = _props.accessibilityOwns, ariaPlaceholder = _props["aria-placeholder"], accessibilityPlaceholder = _props.accessibilityPlaceholder, ariaPosInSet = _props["aria-posinset"], accessibilityPosInSet = _props.accessibilityPosInSet, ariaPressed = _props["aria-pressed"], accessibilityPressed = _props.accessibilityPressed, ariaReadOnly = _props["aria-readonly"], accessibilityReadOnly = _props.accessibilityReadOnly, ariaRequired = _props["aria-required"], accessibilityRequired = _props.accessibilityRequired, ariaRole = _props.role, accessibilityRole = _props.accessibilityRole, ariaRoleDescription = _props["aria-roledescription"], accessibilityRoleDescription = _props.accessibilityRoleDescription, ariaRowCount = _props["aria-rowcount"], accessibilityRowCount = _props.accessibilityRowCount, ariaRowIndex = _props["aria-rowindex"], accessibilityRowIndex = _props.accessibilityRowIndex, ariaRowSpan = _props["aria-rowspan"], accessibilityRowSpan = _props.accessibilityRowSpan, ariaSelected = _props["aria-selected"], accessibilitySelected = _props.accessibilitySelected, ariaSetSize = _props["aria-setsize"], accessibilitySetSize = _props.accessibilitySetSize, ariaSort = _props["aria-sort"], accessibilitySort = _props.accessibilitySort, ariaValueMax = _props["aria-valuemax"], accessibilityValueMax = _props.accessibilityValueMax, ariaValueMin = _props["aria-valuemin"], accessibilityValueMin = _props.accessibilityValueMin, ariaValueNow = _props["aria-valuenow"], accessibilityValueNow = _props.accessibilityValueNow, ariaValueText = _props["aria-valuetext"], accessibilityValueText = _props.accessibilityValueText, dataSet = _props.dataSet, focusable = _props.focusable, id = _props.id, nativeID = _props.nativeID, pointerEvents = _props.pointerEvents, style = _props.style, tabIndex = _props.tabIndex, testID = _props.testID, domProps = (0, import_objectWithoutPropertiesLoose3.default)(_props, _excluded3);
  var disabled = ariaDisabled || accessibilityDisabled;
  var role = AccessibilityUtil_default.propsToAriaRole(props);
  var _ariaActiveDescendant = ariaActiveDescendant != null ? ariaActiveDescendant : accessibilityActiveDescendant;
  if (_ariaActiveDescendant != null) {
    domProps["aria-activedescendant"] = _ariaActiveDescendant;
  }
  var _ariaAtomic = ariaAtomic != null ? ariaActiveDescendant : accessibilityAtomic;
  if (_ariaAtomic != null) {
    domProps["aria-atomic"] = _ariaAtomic;
  }
  var _ariaAutoComplete = ariaAutoComplete != null ? ariaAutoComplete : accessibilityAutoComplete;
  if (_ariaAutoComplete != null) {
    domProps["aria-autocomplete"] = _ariaAutoComplete;
  }
  var _ariaBusy = ariaBusy != null ? ariaBusy : accessibilityBusy;
  if (_ariaBusy != null) {
    domProps["aria-busy"] = _ariaBusy;
  }
  var _ariaChecked = ariaChecked != null ? ariaChecked : accessibilityChecked;
  if (_ariaChecked != null) {
    domProps["aria-checked"] = _ariaChecked;
  }
  var _ariaColumnCount = ariaColumnCount != null ? ariaColumnCount : accessibilityColumnCount;
  if (_ariaColumnCount != null) {
    domProps["aria-colcount"] = _ariaColumnCount;
  }
  var _ariaColumnIndex = ariaColumnIndex != null ? ariaColumnIndex : accessibilityColumnIndex;
  if (_ariaColumnIndex != null) {
    domProps["aria-colindex"] = _ariaColumnIndex;
  }
  var _ariaColumnSpan = ariaColumnSpan != null ? ariaColumnSpan : accessibilityColumnSpan;
  if (_ariaColumnSpan != null) {
    domProps["aria-colspan"] = _ariaColumnSpan;
  }
  var _ariaControls = ariaControls != null ? ariaControls : accessibilityControls;
  if (_ariaControls != null) {
    domProps["aria-controls"] = processIDRefList(_ariaControls);
  }
  var _ariaCurrent = ariaCurrent != null ? ariaCurrent : accessibilityCurrent;
  if (_ariaCurrent != null) {
    domProps["aria-current"] = _ariaCurrent;
  }
  var _ariaDescribedBy = ariaDescribedBy != null ? ariaDescribedBy : accessibilityDescribedBy;
  if (_ariaDescribedBy != null) {
    domProps["aria-describedby"] = processIDRefList(_ariaDescribedBy);
  }
  var _ariaDetails = ariaDetails != null ? ariaDetails : accessibilityDetails;
  if (_ariaDetails != null) {
    domProps["aria-details"] = _ariaDetails;
  }
  if (disabled === true) {
    domProps["aria-disabled"] = true;
    if (elementType === "button" || elementType === "form" || elementType === "input" || elementType === "select" || elementType === "textarea") {
      domProps.disabled = true;
    }
  }
  var _ariaErrorMessage = ariaErrorMessage != null ? ariaErrorMessage : accessibilityErrorMessage;
  if (_ariaErrorMessage != null) {
    domProps["aria-errormessage"] = _ariaErrorMessage;
  }
  var _ariaExpanded = ariaExpanded != null ? ariaExpanded : accessibilityExpanded;
  if (_ariaExpanded != null) {
    domProps["aria-expanded"] = _ariaExpanded;
  }
  var _ariaFlowTo = ariaFlowTo != null ? ariaFlowTo : accessibilityFlowTo;
  if (_ariaFlowTo != null) {
    domProps["aria-flowto"] = processIDRefList(_ariaFlowTo);
  }
  var _ariaHasPopup = ariaHasPopup != null ? ariaHasPopup : accessibilityHasPopup;
  if (_ariaHasPopup != null) {
    domProps["aria-haspopup"] = _ariaHasPopup;
  }
  var _ariaHidden = ariaHidden != null ? ariaHidden : accessibilityHidden;
  if (_ariaHidden === true) {
    domProps["aria-hidden"] = _ariaHidden;
  }
  var _ariaInvalid = ariaInvalid != null ? ariaInvalid : accessibilityInvalid;
  if (_ariaInvalid != null) {
    domProps["aria-invalid"] = _ariaInvalid;
  }
  var _ariaKeyShortcuts = ariaKeyShortcuts != null ? ariaKeyShortcuts : accessibilityKeyShortcuts;
  if (_ariaKeyShortcuts != null) {
    domProps["aria-keyshortcuts"] = processIDRefList(_ariaKeyShortcuts);
  }
  var _ariaLabel = ariaLabel != null ? ariaLabel : accessibilityLabel;
  if (_ariaLabel != null) {
    domProps["aria-label"] = _ariaLabel;
  }
  var _ariaLabelledBy = ariaLabelledBy != null ? ariaLabelledBy : accessibilityLabelledBy;
  if (_ariaLabelledBy != null) {
    domProps["aria-labelledby"] = processIDRefList(_ariaLabelledBy);
  }
  var _ariaLevel = ariaLevel != null ? ariaLevel : accessibilityLevel;
  if (_ariaLevel != null) {
    domProps["aria-level"] = _ariaLevel;
  }
  var _ariaLive = ariaLive != null ? ariaLive : accessibilityLiveRegion;
  if (_ariaLive != null) {
    domProps["aria-live"] = _ariaLive === "none" ? "off" : _ariaLive;
  }
  var _ariaModal = ariaModal != null ? ariaModal : accessibilityModal;
  if (_ariaModal != null) {
    domProps["aria-modal"] = _ariaModal;
  }
  var _ariaMultiline = ariaMultiline != null ? ariaMultiline : accessibilityMultiline;
  if (_ariaMultiline != null) {
    domProps["aria-multiline"] = _ariaMultiline;
  }
  var _ariaMultiSelectable = ariaMultiSelectable != null ? ariaMultiSelectable : accessibilityMultiSelectable;
  if (_ariaMultiSelectable != null) {
    domProps["aria-multiselectable"] = _ariaMultiSelectable;
  }
  var _ariaOrientation = ariaOrientation != null ? ariaOrientation : accessibilityOrientation;
  if (_ariaOrientation != null) {
    domProps["aria-orientation"] = _ariaOrientation;
  }
  var _ariaOwns = ariaOwns != null ? ariaOwns : accessibilityOwns;
  if (_ariaOwns != null) {
    domProps["aria-owns"] = processIDRefList(_ariaOwns);
  }
  var _ariaPlaceholder = ariaPlaceholder != null ? ariaPlaceholder : accessibilityPlaceholder;
  if (_ariaPlaceholder != null) {
    domProps["aria-placeholder"] = _ariaPlaceholder;
  }
  var _ariaPosInSet = ariaPosInSet != null ? ariaPosInSet : accessibilityPosInSet;
  if (_ariaPosInSet != null) {
    domProps["aria-posinset"] = _ariaPosInSet;
  }
  var _ariaPressed = ariaPressed != null ? ariaPressed : accessibilityPressed;
  if (_ariaPressed != null) {
    domProps["aria-pressed"] = _ariaPressed;
  }
  var _ariaReadOnly = ariaReadOnly != null ? ariaReadOnly : accessibilityReadOnly;
  if (_ariaReadOnly != null) {
    domProps["aria-readonly"] = _ariaReadOnly;
    if (elementType === "input" || elementType === "select" || elementType === "textarea") {
      domProps.readOnly = true;
    }
  }
  var _ariaRequired = ariaRequired != null ? ariaRequired : accessibilityRequired;
  if (_ariaRequired != null) {
    domProps["aria-required"] = _ariaRequired;
    if (elementType === "input" || elementType === "select" || elementType === "textarea") {
      domProps.required = accessibilityRequired;
    }
  }
  if (role != null) {
    domProps["role"] = role === "none" ? "presentation" : role;
  }
  var _ariaRoleDescription = ariaRoleDescription != null ? ariaRoleDescription : accessibilityRoleDescription;
  if (_ariaRoleDescription != null) {
    domProps["aria-roledescription"] = _ariaRoleDescription;
  }
  var _ariaRowCount = ariaRowCount != null ? ariaRowCount : accessibilityRowCount;
  if (_ariaRowCount != null) {
    domProps["aria-rowcount"] = _ariaRowCount;
  }
  var _ariaRowIndex = ariaRowIndex != null ? ariaRowIndex : accessibilityRowIndex;
  if (_ariaRowIndex != null) {
    domProps["aria-rowindex"] = _ariaRowIndex;
  }
  var _ariaRowSpan = ariaRowSpan != null ? ariaRowSpan : accessibilityRowSpan;
  if (_ariaRowSpan != null) {
    domProps["aria-rowspan"] = _ariaRowSpan;
  }
  var _ariaSelected = ariaSelected != null ? ariaSelected : accessibilitySelected;
  if (_ariaSelected != null) {
    domProps["aria-selected"] = _ariaSelected;
  }
  var _ariaSetSize = ariaSetSize != null ? ariaSetSize : accessibilitySetSize;
  if (_ariaSetSize != null) {
    domProps["aria-setsize"] = _ariaSetSize;
  }
  var _ariaSort = ariaSort != null ? ariaSort : accessibilitySort;
  if (_ariaSort != null) {
    domProps["aria-sort"] = _ariaSort;
  }
  var _ariaValueMax = ariaValueMax != null ? ariaValueMax : accessibilityValueMax;
  if (_ariaValueMax != null) {
    domProps["aria-valuemax"] = _ariaValueMax;
  }
  var _ariaValueMin = ariaValueMin != null ? ariaValueMin : accessibilityValueMin;
  if (_ariaValueMin != null) {
    domProps["aria-valuemin"] = _ariaValueMin;
  }
  var _ariaValueNow = ariaValueNow != null ? ariaValueNow : accessibilityValueNow;
  if (_ariaValueNow != null) {
    domProps["aria-valuenow"] = _ariaValueNow;
  }
  var _ariaValueText = ariaValueText != null ? ariaValueText : accessibilityValueText;
  if (_ariaValueText != null) {
    domProps["aria-valuetext"] = _ariaValueText;
  }
  if (dataSet != null) {
    for (var dataProp in dataSet) {
      if (hasOwnProperty.call(dataSet, dataProp)) {
        var dataName = hyphenateString(dataProp);
        var dataValue = dataSet[dataProp];
        if (dataValue != null) {
          domProps["data-" + dataName] = dataValue;
        }
      }
    }
  }
  if (tabIndex === 0 || tabIndex === "0" || tabIndex === -1 || tabIndex === "-1") {
    domProps.tabIndex = tabIndex;
  } else {
    if (focusable === false) {
      domProps.tabIndex = "-1";
    }
    if (
      // These native elements are keyboard focusable by default
      elementType === "a" || elementType === "button" || elementType === "input" || elementType === "select" || elementType === "textarea"
    ) {
      if (focusable === false || accessibilityDisabled === true) {
        domProps.tabIndex = "-1";
      }
    } else if (
      // These roles are made keyboard focusable by default
      role === "button" || role === "checkbox" || role === "link" || role === "radio" || role === "textbox" || role === "switch"
    ) {
      if (focusable !== false) {
        domProps.tabIndex = "0";
      }
    } else {
      if (focusable === true) {
        domProps.tabIndex = "0";
      }
    }
  }
  if (pointerEvents != null) {
    warnOnce("pointerEvents", "props.pointerEvents is deprecated. Use style.pointerEvents");
  }
  var _StyleSheet = StyleSheet_default([style, pointerEvents && pointerEventsStyles[pointerEvents]], (0, import_objectSpread23.default)({
    writingDirection: "ltr"
  }, options)), className = _StyleSheet[0], inlineStyle = _StyleSheet[1];
  if (className) {
    domProps.className = className;
  }
  if (inlineStyle) {
    domProps.style = inlineStyle;
  }
  var _id = id != null ? id : nativeID;
  if (_id != null) {
    domProps.id = _id;
  }
  if (testID != null) {
    domProps["data-testid"] = testID;
  }
  if (domProps.type == null && elementType === "button") {
    domProps.type = "button";
  }
  return domProps;
}, "createDOMProps");
var createDOMProps_default = createDOMProps;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/createElement/index.js
import React27 from "react";

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useLocale/index.js
import React26, { createContext as createContext11, useContext as useContext11 } from "react";

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useLocale/isLocaleRTL.js
var rtlScripts = /* @__PURE__ */ new Set(["Arab", "Syrc", "Samr", "Mand", "Thaa", "Mend", "Nkoo", "Adlm", "Rohg", "Hebr"]);
var rtlLangs = /* @__PURE__ */ new Set([
  "ae",
  // Avestan
  "ar",
  // Arabic
  "arc",
  // Aramaic
  "bcc",
  // Southern Balochi
  "bqi",
  // Bakthiari
  "ckb",
  // Sorani
  "dv",
  // Dhivehi
  "fa",
  "far",
  // Persian
  "glk",
  // Gilaki
  "he",
  "iw",
  // Hebrew
  "khw",
  // Khowar
  "ks",
  // Kashmiri
  "ku",
  // Kurdish
  "mzn",
  // Mazanderani
  "nqo",
  // N'Ko
  "pnb",
  // Western Punjabi
  "ps",
  // Pashto
  "sd",
  // Sindhi
  "ug",
  // Uyghur
  "ur",
  // Urdu
  "yi"
  // Yiddish
]);
var cache6 = /* @__PURE__ */ new Map();
function isLocaleRTL(locale) {
  var cachedRTL = cache6.get(locale);
  if (cachedRTL) {
    return cachedRTL;
  }
  var isRTL2 = false;
  if (Intl.Locale) {
    try {
      var script = new Intl.Locale(locale).maximize().script;
      isRTL2 = rtlScripts.has(script);
    } catch (_unused) {
      var lang = locale.split("-")[0];
      isRTL2 = rtlLangs.has(lang);
    }
  } else {
    var _lang = locale.split("-")[0];
    isRTL2 = rtlLangs.has(_lang);
  }
  cache6.set(locale, isRTL2);
  return isRTL2;
}
__name(isLocaleRTL, "isLocaleRTL");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useLocale/index.js
var defaultLocale = {
  direction: "ltr",
  locale: "en-US"
};
var LocaleContext = /* @__PURE__ */ createContext11(defaultLocale);
function getLocaleDirection(locale) {
  return isLocaleRTL(locale) ? "rtl" : "ltr";
}
__name(getLocaleDirection, "getLocaleDirection");
function LocaleProvider(props) {
  var direction = props.direction, locale = props.locale, children = props.children;
  var needsContext = direction || locale;
  return needsContext ? /* @__PURE__ */ React26.createElement(LocaleContext.Provider, {
    children,
    value: {
      direction: locale ? getLocaleDirection(locale) : direction,
      locale
    }
  }) : children;
}
__name(LocaleProvider, "LocaleProvider");
function useLocaleContext() {
  return useContext11(LocaleContext);
}
__name(useLocaleContext, "useLocaleContext");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/createElement/index.js
var createElement = /* @__PURE__ */ __name((component, props, options) => {
  var accessibilityComponent;
  if (component && component.constructor === String) {
    accessibilityComponent = AccessibilityUtil_default.propsToAccessibilityComponent(props);
  }
  var Component = accessibilityComponent || component;
  var domProps = createDOMProps_default(Component, props, options);
  var element = /* @__PURE__ */ React27.createElement(Component, domProps);
  var elementWithLocaleProvider = domProps.dir ? /* @__PURE__ */ React27.createElement(LocaleProvider, {
    children: element,
    direction: domProps.dir,
    locale: domProps.lang
  }) : element;
  return elementWithLocaleProvider;
}, "createElement");
var createElement_default = createElement;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/getBoundingClientRect/index.js
var getBoundingClientRect = /* @__PURE__ */ __name((node) => {
  if (node != null) {
    var isElement3 = node.nodeType === 1;
    if (isElement3 && typeof node.getBoundingClientRect === "function") {
      return node.getBoundingClientRect();
    }
  }
}, "getBoundingClientRect");
var getBoundingClientRect_default = getBoundingClientRect;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/unitlessNumbers/index.js
var unitlessNumbers2 = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexOrder: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  fontWeight: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowGap: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnGap: true,
  gridColumnStart: true,
  lineClamp: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  // SVG-related
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
  // transform types
  scale: true,
  scaleX: true,
  scaleY: true,
  scaleZ: true,
  // RN properties
  shadowOpacity: true
};
var prefixes3 = ["ms", "Moz", "O", "Webkit"];
var prefixKey2 = /* @__PURE__ */ __name((prefix, key) => {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}, "prefixKey");
Object.keys(unitlessNumbers2).forEach((prop) => {
  prefixes3.forEach((prefix) => {
    unitlessNumbers2[prefixKey2(prefix, prop)] = unitlessNumbers2[prop];
  });
});
var unitlessNumbers_default2 = unitlessNumbers2;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/setValueForStyles/dangerousStyleValue.js
function dangerousStyleValue(name, value, isCustomProperty) {
  var isEmpty = value == null || typeof value === "boolean" || value === "";
  if (isEmpty) {
    return "";
  }
  if (!isCustomProperty && typeof value === "number" && value !== 0 && !(unitlessNumbers_default2.hasOwnProperty(name) && unitlessNumbers_default2[name])) {
    return value + "px";
  }
  return ("" + value).trim();
}
__name(dangerousStyleValue, "dangerousStyleValue");
var dangerousStyleValue_default = dangerousStyleValue;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/setValueForStyles/index.js
function setValueForStyles(node, styles5) {
  var style = node.style;
  for (var styleName in styles5) {
    if (!styles5.hasOwnProperty(styleName)) {
      continue;
    }
    var isCustomProperty = styleName.indexOf("--") === 0;
    var styleValue = dangerousStyleValue_default(styleName, styles5[styleName], isCustomProperty);
    if (styleName === "float") {
      styleName = "cssFloat";
    }
    if (isCustomProperty) {
      style.setProperty(styleName, styleValue);
    } else {
      style[styleName] = styleValue;
    }
  }
}
__name(setValueForStyles, "setValueForStyles");
var setValueForStyles_default = setValueForStyles;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/UIManager/index.js
var getRect = /* @__PURE__ */ __name((node) => {
  var height = node.offsetHeight;
  var width = node.offsetWidth;
  var left2 = node.offsetLeft;
  var top = node.offsetTop;
  node = node.offsetParent;
  while (node && node.nodeType === 1) {
    left2 += node.offsetLeft + node.clientLeft - node.scrollLeft;
    top += node.offsetTop + node.clientTop - node.scrollTop;
    node = node.offsetParent;
  }
  top -= window.scrollY;
  left2 -= window.scrollX;
  return {
    width,
    height,
    top,
    left: left2
  };
}, "getRect");
var measureLayout = /* @__PURE__ */ __name((node, relativeToNativeNode, callback) => {
  var relativeNode = relativeToNativeNode || node && node.parentNode;
  if (node && relativeNode) {
    setTimeout(() => {
      if (node.isConnected && relativeNode.isConnected) {
        var relativeRect = getRect(relativeNode);
        var _getRect = getRect(node), height = _getRect.height, left2 = _getRect.left, top = _getRect.top, width = _getRect.width;
        var x = left2 - relativeRect.left;
        var y = top - relativeRect.top;
        callback(x, y, width, height, left2, top);
      }
    }, 0);
  }
}, "measureLayout");
var elementsToIgnore = {
  A: true,
  BODY: true,
  INPUT: true,
  SELECT: true,
  TEXTAREA: true
};
var UIManager = {
  blur(node) {
    try {
      node.blur();
    } catch (err) {
    }
  },
  focus(node) {
    try {
      var name = node.nodeName;
      if (node.getAttribute("tabIndex") == null && node.isContentEditable !== true && elementsToIgnore[name] == null) {
        node.setAttribute("tabIndex", "-1");
      }
      node.focus();
    } catch (err) {
    }
  },
  measure(node, callback) {
    measureLayout(node, null, callback);
  },
  measureInWindow(node, callback) {
    if (node) {
      setTimeout(() => {
        var _getBoundingClientRec = getBoundingClientRect_default(node), height = _getBoundingClientRec.height, left2 = _getBoundingClientRec.left, top = _getBoundingClientRec.top, width = _getBoundingClientRec.width;
        callback(left2, top, width, height);
      }, 0);
    }
  },
  measureLayout(node, relativeToNativeNode, onFail, onSuccess) {
    measureLayout(node, relativeToNativeNode, onSuccess);
  },
  updateView(node, props) {
    for (var prop in props) {
      if (!Object.prototype.hasOwnProperty.call(props, prop)) {
        continue;
      }
      var value = props[prop];
      switch (prop) {
        case "style": {
          setValueForStyles_default(node, value);
          break;
        }
        case "class":
        case "className": {
          node.setAttribute("class", value);
          break;
        }
        case "text":
        case "value":
          node.value = value;
          break;
        default:
          node.setAttribute(prop, value);
      }
    }
  },
  configureNextLayoutAnimation(config, onAnimationDidEnd) {
    onAnimationDidEnd();
  },
  // mocks
  setLayoutAnimationEnabledExperimental() {
  }
};
var UIManager_default = UIManager;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/Platform/index.js
var Platform = {
  OS: "web",
  select: /* @__PURE__ */ __name((obj) => "web" in obj ? obj.web : obj.default, "select"),
  get isTesting() {
    if (process.env.NODE_ENV === "test") {
      return true;
    }
    return false;
  },
  get Version() {
    return "0.0.0";
  }
};
var Platform_default = Platform;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/View/index.js
var import_objectWithoutPropertiesLoose4 = __toESM(require_objectWithoutPropertiesLoose());
import * as React32 from "react";

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/forwardedProps/index.js
var defaultProps = {
  children: true,
  dataSet: true,
  dir: true,
  id: true,
  ref: true,
  suppressHydrationWarning: true,
  tabIndex: true,
  testID: true,
  // @deprecated
  focusable: true,
  nativeID: true
};
var accessibilityProps = {
  "aria-activedescendant": true,
  "aria-atomic": true,
  "aria-autocomplete": true,
  "aria-busy": true,
  "aria-checked": true,
  "aria-colcount": true,
  "aria-colindex": true,
  "aria-colspan": true,
  "aria-controls": true,
  "aria-current": true,
  "aria-describedby": true,
  "aria-details": true,
  "aria-disabled": true,
  "aria-errormessage": true,
  "aria-expanded": true,
  "aria-flowto": true,
  "aria-haspopup": true,
  "aria-hidden": true,
  "aria-invalid": true,
  "aria-keyshortcuts": true,
  "aria-label": true,
  "aria-labelledby": true,
  "aria-level": true,
  "aria-live": true,
  "aria-modal": true,
  "aria-multiline": true,
  "aria-multiselectable": true,
  "aria-orientation": true,
  "aria-owns": true,
  "aria-placeholder": true,
  "aria-posinset": true,
  "aria-pressed": true,
  "aria-readonly": true,
  "aria-required": true,
  inert: true,
  role: true,
  "aria-roledescription": true,
  "aria-rowcount": true,
  "aria-rowindex": true,
  "aria-rowspan": true,
  "aria-selected": true,
  "aria-setsize": true,
  "aria-sort": true,
  "aria-valuemax": true,
  "aria-valuemin": true,
  "aria-valuenow": true,
  "aria-valuetext": true,
  // @deprecated
  accessibilityActiveDescendant: true,
  accessibilityAtomic: true,
  accessibilityAutoComplete: true,
  accessibilityBusy: true,
  accessibilityChecked: true,
  accessibilityColumnCount: true,
  accessibilityColumnIndex: true,
  accessibilityColumnSpan: true,
  accessibilityControls: true,
  accessibilityCurrent: true,
  accessibilityDescribedBy: true,
  accessibilityDetails: true,
  accessibilityDisabled: true,
  accessibilityErrorMessage: true,
  accessibilityExpanded: true,
  accessibilityFlowTo: true,
  accessibilityHasPopup: true,
  accessibilityHidden: true,
  accessibilityInvalid: true,
  accessibilityKeyShortcuts: true,
  accessibilityLabel: true,
  accessibilityLabelledBy: true,
  accessibilityLevel: true,
  accessibilityLiveRegion: true,
  accessibilityModal: true,
  accessibilityMultiline: true,
  accessibilityMultiSelectable: true,
  accessibilityOrientation: true,
  accessibilityOwns: true,
  accessibilityPlaceholder: true,
  accessibilityPosInSet: true,
  accessibilityPressed: true,
  accessibilityReadOnly: true,
  accessibilityRequired: true,
  accessibilityRole: true,
  accessibilityRoleDescription: true,
  accessibilityRowCount: true,
  accessibilityRowIndex: true,
  accessibilityRowSpan: true,
  accessibilitySelected: true,
  accessibilitySetSize: true,
  accessibilitySort: true,
  accessibilityValueMax: true,
  accessibilityValueMin: true,
  accessibilityValueNow: true,
  accessibilityValueText: true
};
var clickProps = {
  onClick: true,
  onAuxClick: true,
  onContextMenu: true,
  onGotPointerCapture: true,
  onLostPointerCapture: true,
  onPointerCancel: true,
  onPointerDown: true,
  onPointerEnter: true,
  onPointerMove: true,
  onPointerLeave: true,
  onPointerOut: true,
  onPointerOver: true,
  onPointerUp: true
};
var focusProps = {
  onBlur: true,
  onFocus: true
};
var keyboardProps = {
  onKeyDown: true,
  onKeyDownCapture: true,
  onKeyUp: true,
  onKeyUpCapture: true
};
var mouseProps = {
  onMouseDown: true,
  onMouseEnter: true,
  onMouseLeave: true,
  onMouseMove: true,
  onMouseOver: true,
  onMouseOut: true,
  onMouseUp: true
};
var touchProps = {
  onTouchCancel: true,
  onTouchCancelCapture: true,
  onTouchEnd: true,
  onTouchEndCapture: true,
  onTouchMove: true,
  onTouchMoveCapture: true,
  onTouchStart: true,
  onTouchStartCapture: true
};
var styleProps = {
  style: true
};

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/pick/index.js
function pick(obj, list) {
  var nextObj = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (list[key] === true) {
        nextObj[key] = obj[key];
      }
    }
  }
  return nextObj;
}
__name(pick, "pick");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useLayoutEffect/index.js
import { useEffect as useEffect12, useLayoutEffect as useLayoutEffect4 } from "react";
var useLayoutEffectImpl = canUseDom_default ? useLayoutEffect4 : useEffect12;
var useLayoutEffect_default = useLayoutEffectImpl;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useElementLayout/index.js
var DOM_LAYOUT_HANDLER_NAME = "__reactLayoutHandler";
var didWarn = !canUseDom_default;
var resizeObserver = null;
function getResizeObserver() {
  if (canUseDom_default && typeof window.ResizeObserver !== "undefined") {
    if (resizeObserver == null) {
      resizeObserver = new window.ResizeObserver(function(entries) {
        entries.forEach((entry) => {
          var node = entry.target;
          var onLayout = node[DOM_LAYOUT_HANDLER_NAME];
          if (typeof onLayout === "function") {
            UIManager_default.measure(node, (x, y, width, height, left2, top) => {
              var event = {
                // $FlowFixMe
                nativeEvent: {
                  layout: {
                    x,
                    y,
                    width,
                    height,
                    left: left2,
                    top
                  }
                },
                timeStamp: Date.now()
              };
              Object.defineProperty(event.nativeEvent, "target", {
                enumerable: true,
                get: /* @__PURE__ */ __name(() => entry.target, "get")
              });
              onLayout(event);
            });
          }
        });
      });
    }
  } else if (!didWarn) {
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      console.warn("onLayout relies on ResizeObserver which is not supported by your browser. Please include a polyfill, e.g., https://github.com/que-etc/resize-observer-polyfill.");
      didWarn = true;
    }
  }
  return resizeObserver;
}
__name(getResizeObserver, "getResizeObserver");
function useElementLayout(ref, onLayout) {
  var observer = getResizeObserver();
  useLayoutEffect_default(() => {
    var node = ref.current;
    if (node != null) {
      node[DOM_LAYOUT_HANDLER_NAME] = onLayout;
    }
  }, [ref, onLayout]);
  useLayoutEffect_default(() => {
    var node = ref.current;
    if (node != null && observer != null) {
      if (typeof node[DOM_LAYOUT_HANDLER_NAME] === "function") {
        observer.observe(node);
      } else {
        observer.unobserve(node);
      }
    }
    return () => {
      if (node != null && observer != null) {
        observer.unobserve(node);
      }
    };
  }, [ref, observer]);
}
__name(useElementLayout, "useElementLayout");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useMergeRefs/index.js
import * as React29 from "react";

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/mergeRefs/index.js
import * as React28 from "react";
function mergeRefs() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return /* @__PURE__ */ __name(function forwardRef29(node) {
    args.forEach((ref) => {
      if (ref == null) {
        return;
      }
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      if (typeof ref === "object") {
        ref.current = node;
        return;
      }
      console.error("mergeRefs cannot handle Refs of type boolean, number or string, received ref " + String(ref));
    });
  }, "forwardRef");
}
__name(mergeRefs, "mergeRefs");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useMergeRefs/index.js
function useMergeRefs() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return React29.useMemo(
    () => mergeRefs(...args),
    // eslint-disable-next-line
    [...args]
  );
}
__name(useMergeRefs, "useMergeRefs");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useStable/index.js
import * as React30 from "react";
var UNINITIALIZED = typeof Symbol === "function" && typeof /* @__PURE__ */ Symbol() === "symbol" ? /* @__PURE__ */ Symbol() : Object.freeze({});
function useStable(getInitialValue) {
  var ref = React30.useRef(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    ref.current = getInitialValue();
  }
  return ref.current;
}
__name(useStable, "useStable");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/usePlatformMethods/index.js
function usePlatformMethods(_ref) {
  var pointerEvents = _ref.pointerEvents, style = _ref.style;
  var ref = useStable(() => (hostNode) => {
    if (hostNode != null) {
      hostNode.measure = (callback) => UIManager_default.measure(hostNode, callback);
      hostNode.measureLayout = (relativeToNode, success, failure) => UIManager_default.measureLayout(hostNode, relativeToNode, failure, success);
      hostNode.measureInWindow = (callback) => UIManager_default.measureInWindow(hostNode, callback);
    }
  });
  return ref;
}
__name(usePlatformMethods, "usePlatformMethods");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useResponderEvents/index.js
import * as React31 from "react";

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useResponderEvents/createResponderEvent.js
var emptyFunction = /* @__PURE__ */ __name(() => {
}, "emptyFunction");
var emptyObject6 = {};
var emptyArray = [];
function normalizeIdentifier(identifier) {
  return identifier > 20 ? identifier % 20 : identifier;
}
__name(normalizeIdentifier, "normalizeIdentifier");
function createResponderEvent(domEvent, responderTouchHistoryStore2) {
  var rect;
  var propagationWasStopped = false;
  var changedTouches;
  var touches;
  var domEventChangedTouches = domEvent.changedTouches;
  var domEventType = domEvent.type;
  var metaKey = domEvent.metaKey === true;
  var shiftKey = domEvent.shiftKey === true;
  var force = domEventChangedTouches && domEventChangedTouches[0].force || 0;
  var identifier = normalizeIdentifier(domEventChangedTouches && domEventChangedTouches[0].identifier || 0);
  var clientX = domEventChangedTouches && domEventChangedTouches[0].clientX || domEvent.clientX;
  var clientY = domEventChangedTouches && domEventChangedTouches[0].clientY || domEvent.clientY;
  var pageX = domEventChangedTouches && domEventChangedTouches[0].pageX || domEvent.pageX;
  var pageY = domEventChangedTouches && domEventChangedTouches[0].pageY || domEvent.pageY;
  var preventDefault = typeof domEvent.preventDefault === "function" ? domEvent.preventDefault.bind(domEvent) : emptyFunction;
  var timestamp = domEvent.timeStamp;
  function normalizeTouches(touches2) {
    return Array.prototype.slice.call(touches2).map((touch2) => {
      return {
        force: touch2.force,
        identifier: normalizeIdentifier(touch2.identifier),
        get locationX() {
          return locationX(touch2.clientX);
        },
        get locationY() {
          return locationY(touch2.clientY);
        },
        pageX: touch2.pageX,
        pageY: touch2.pageY,
        target: touch2.target,
        timestamp
      };
    });
  }
  __name(normalizeTouches, "normalizeTouches");
  if (domEventChangedTouches != null) {
    changedTouches = normalizeTouches(domEventChangedTouches);
    touches = normalizeTouches(domEvent.touches);
  } else {
    var emulatedTouches = [{
      force,
      identifier,
      get locationX() {
        return locationX(clientX);
      },
      get locationY() {
        return locationY(clientY);
      },
      pageX,
      pageY,
      target: domEvent.target,
      timestamp
    }];
    changedTouches = emulatedTouches;
    touches = domEventType === "mouseup" || domEventType === "dragstart" ? emptyArray : emulatedTouches;
  }
  var responderEvent = {
    bubbles: true,
    cancelable: true,
    // `currentTarget` is set before dispatch
    currentTarget: null,
    defaultPrevented: domEvent.defaultPrevented,
    dispatchConfig: emptyObject6,
    eventPhase: domEvent.eventPhase,
    isDefaultPrevented() {
      return domEvent.defaultPrevented;
    },
    isPropagationStopped() {
      return propagationWasStopped;
    },
    isTrusted: domEvent.isTrusted,
    nativeEvent: {
      altKey: false,
      ctrlKey: false,
      metaKey,
      shiftKey,
      changedTouches,
      force,
      identifier,
      get locationX() {
        return locationX(clientX);
      },
      get locationY() {
        return locationY(clientY);
      },
      pageX,
      pageY,
      target: domEvent.target,
      timestamp,
      touches,
      type: domEventType
    },
    persist: emptyFunction,
    preventDefault,
    stopPropagation() {
      propagationWasStopped = true;
    },
    target: domEvent.target,
    timeStamp: timestamp,
    touchHistory: responderTouchHistoryStore2.touchHistory
  };
  function locationX(x) {
    rect = rect || getBoundingClientRect_default(responderEvent.currentTarget);
    if (rect) {
      return x - rect.left;
    }
  }
  __name(locationX, "locationX");
  function locationY(y) {
    rect = rect || getBoundingClientRect_default(responderEvent.currentTarget);
    if (rect) {
      return y - rect.top;
    }
  }
  __name(locationY, "locationY");
  return responderEvent;
}
__name(createResponderEvent, "createResponderEvent");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useResponderEvents/ResponderEventTypes.js
var MOUSE_DOWN = "mousedown";
var MOUSE_MOVE = "mousemove";
var MOUSE_UP = "mouseup";
var MOUSE_CANCEL = "dragstart";
var TOUCH_START = "touchstart";
var TOUCH_MOVE = "touchmove";
var TOUCH_END = "touchend";
var TOUCH_CANCEL = "touchcancel";
var SCROLL = "scroll";
var SELECT = "select";
var SELECTION_CHANGE = "selectionchange";
function isStartish(eventType) {
  return eventType === TOUCH_START || eventType === MOUSE_DOWN;
}
__name(isStartish, "isStartish");
function isMoveish(eventType) {
  return eventType === TOUCH_MOVE || eventType === MOUSE_MOVE;
}
__name(isMoveish, "isMoveish");
function isEndish(eventType) {
  return eventType === TOUCH_END || eventType === MOUSE_UP || isCancelish(eventType);
}
__name(isEndish, "isEndish");
function isCancelish(eventType) {
  return eventType === TOUCH_CANCEL || eventType === MOUSE_CANCEL;
}
__name(isCancelish, "isCancelish");
function isScroll(eventType) {
  return eventType === SCROLL;
}
__name(isScroll, "isScroll");
function isSelectionChange(eventType) {
  return eventType === SELECT || eventType === SELECTION_CHANGE;
}
__name(isSelectionChange, "isSelectionChange");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/isSelectionValid/index.js
function isSelectionValid() {
  var selection = window.getSelection();
  var string = selection.toString();
  var anchorNode = selection.anchorNode;
  var focusNode = selection.focusNode;
  var isTextNode = anchorNode && anchorNode.nodeType === window.Node.TEXT_NODE || focusNode && focusNode.nodeType === window.Node.TEXT_NODE;
  return string.length >= 1 && string !== "\n" && isTextNode;
}
__name(isSelectionValid, "isSelectionValid");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useResponderEvents/utils.js
var keyName = "__reactResponderId";
function getEventPath(domEvent) {
  if (domEvent.type === "selectionchange") {
    var target = window.getSelection().anchorNode;
    return composedPathFallback(target);
  } else {
    var path = domEvent.composedPath != null ? domEvent.composedPath() : composedPathFallback(domEvent.target);
    return path;
  }
}
__name(getEventPath, "getEventPath");
function composedPathFallback(target) {
  var path = [];
  while (target != null && target !== document.body) {
    path.push(target);
    target = target.parentNode;
  }
  return path;
}
__name(composedPathFallback, "composedPathFallback");
function getResponderId(node) {
  if (node != null) {
    return node[keyName];
  }
  return null;
}
__name(getResponderId, "getResponderId");
function setResponderId(node, id) {
  if (node != null) {
    node[keyName] = id;
  }
}
__name(setResponderId, "setResponderId");
function getResponderPaths(domEvent) {
  var idPath = [];
  var nodePath = [];
  var eventPath = getEventPath(domEvent);
  for (var i = 0; i < eventPath.length; i++) {
    var node = eventPath[i];
    var id = getResponderId(node);
    if (id != null) {
      idPath.push(id);
      nodePath.push(node);
    }
  }
  return {
    idPath,
    nodePath
  };
}
__name(getResponderPaths, "getResponderPaths");
function getLowestCommonAncestor(pathA, pathB) {
  var pathALength = pathA.length;
  var pathBLength = pathB.length;
  if (
    // If either path is empty
    pathALength === 0 || pathBLength === 0 || // If the last elements aren't the same there can't be a common ancestor
    // that is connected to the responder system
    pathA[pathALength - 1] !== pathB[pathBLength - 1]
  ) {
    return null;
  }
  var itemA = pathA[0];
  var indexA = 0;
  var itemB = pathB[0];
  var indexB = 0;
  if (pathALength - pathBLength > 0) {
    indexA = pathALength - pathBLength;
    itemA = pathA[indexA];
    pathALength = pathBLength;
  }
  if (pathBLength - pathALength > 0) {
    indexB = pathBLength - pathALength;
    itemB = pathB[indexB];
    pathBLength = pathALength;
  }
  var depth = pathALength;
  while (depth--) {
    if (itemA === itemB) {
      return itemA;
    }
    itemA = pathA[indexA++];
    itemB = pathB[indexB++];
  }
  return null;
}
__name(getLowestCommonAncestor, "getLowestCommonAncestor");
function hasTargetTouches(target, touches) {
  if (!touches || touches.length === 0) {
    return false;
  }
  for (var i = 0; i < touches.length; i++) {
    var node = touches[i].target;
    if (node != null) {
      if (target.contains(node)) {
        return true;
      }
    }
  }
  return false;
}
__name(hasTargetTouches, "hasTargetTouches");
function hasValidSelection(domEvent) {
  if (domEvent.type === "selectionchange") {
    return isSelectionValid();
  }
  return domEvent.type === "select";
}
__name(hasValidSelection, "hasValidSelection");
function isPrimaryPointerDown(domEvent) {
  var altKey = domEvent.altKey, button = domEvent.button, buttons = domEvent.buttons, ctrlKey = domEvent.ctrlKey, type = domEvent.type;
  var isTouch = type === "touchstart" || type === "touchmove";
  var isPrimaryMouseDown = type === "mousedown" && (button === 0 || buttons === 1);
  var isPrimaryMouseMove = type === "mousemove" && buttons === 1;
  var noModifiers = altKey === false && ctrlKey === false;
  if (isTouch || isPrimaryMouseDown && noModifiers || isPrimaryMouseMove && noModifiers) {
    return true;
  }
  return false;
}
__name(isPrimaryPointerDown, "isPrimaryPointerDown");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useResponderEvents/ResponderTouchHistoryStore.js
var __DEV__ = process.env.NODE_ENV !== "production";
var MAX_TOUCH_BANK = 20;
function timestampForTouch(touch2) {
  return touch2.timeStamp || touch2.timestamp;
}
__name(timestampForTouch, "timestampForTouch");
function createTouchRecord(touch2) {
  return {
    touchActive: true,
    startPageX: touch2.pageX,
    startPageY: touch2.pageY,
    startTimeStamp: timestampForTouch(touch2),
    currentPageX: touch2.pageX,
    currentPageY: touch2.pageY,
    currentTimeStamp: timestampForTouch(touch2),
    previousPageX: touch2.pageX,
    previousPageY: touch2.pageY,
    previousTimeStamp: timestampForTouch(touch2)
  };
}
__name(createTouchRecord, "createTouchRecord");
function resetTouchRecord(touchRecord, touch2) {
  touchRecord.touchActive = true;
  touchRecord.startPageX = touch2.pageX;
  touchRecord.startPageY = touch2.pageY;
  touchRecord.startTimeStamp = timestampForTouch(touch2);
  touchRecord.currentPageX = touch2.pageX;
  touchRecord.currentPageY = touch2.pageY;
  touchRecord.currentTimeStamp = timestampForTouch(touch2);
  touchRecord.previousPageX = touch2.pageX;
  touchRecord.previousPageY = touch2.pageY;
  touchRecord.previousTimeStamp = timestampForTouch(touch2);
}
__name(resetTouchRecord, "resetTouchRecord");
function getTouchIdentifier(_ref) {
  var identifier = _ref.identifier;
  if (identifier == null) {
    console.error("Touch object is missing identifier.");
  }
  if (__DEV__) {
    if (identifier > MAX_TOUCH_BANK) {
      console.error("Touch identifier %s is greater than maximum supported %s which causes performance issues backfilling array locations for all of the indices.", identifier, MAX_TOUCH_BANK);
    }
  }
  return identifier;
}
__name(getTouchIdentifier, "getTouchIdentifier");
function recordTouchStart(touch2, touchHistory) {
  var identifier = getTouchIdentifier(touch2);
  var touchRecord = touchHistory.touchBank[identifier];
  if (touchRecord) {
    resetTouchRecord(touchRecord, touch2);
  } else {
    touchHistory.touchBank[identifier] = createTouchRecord(touch2);
  }
  touchHistory.mostRecentTimeStamp = timestampForTouch(touch2);
}
__name(recordTouchStart, "recordTouchStart");
function recordTouchMove(touch2, touchHistory) {
  var touchRecord = touchHistory.touchBank[getTouchIdentifier(touch2)];
  if (touchRecord) {
    touchRecord.touchActive = true;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch2.pageX;
    touchRecord.currentPageY = touch2.pageY;
    touchRecord.currentTimeStamp = timestampForTouch(touch2);
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch2);
  } else {
    console.warn("Cannot record touch move without a touch start.\n", "Touch Move: " + printTouch(touch2) + "\n", "Touch Bank: " + printTouchBank(touchHistory));
  }
}
__name(recordTouchMove, "recordTouchMove");
function recordTouchEnd(touch2, touchHistory) {
  var touchRecord = touchHistory.touchBank[getTouchIdentifier(touch2)];
  if (touchRecord) {
    touchRecord.touchActive = false;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch2.pageX;
    touchRecord.currentPageY = touch2.pageY;
    touchRecord.currentTimeStamp = timestampForTouch(touch2);
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch2);
  } else {
    console.warn("Cannot record touch end without a touch start.\n", "Touch End: " + printTouch(touch2) + "\n", "Touch Bank: " + printTouchBank(touchHistory));
  }
}
__name(recordTouchEnd, "recordTouchEnd");
function printTouch(touch2) {
  return JSON.stringify({
    identifier: touch2.identifier,
    pageX: touch2.pageX,
    pageY: touch2.pageY,
    timestamp: timestampForTouch(touch2)
  });
}
__name(printTouch, "printTouch");
function printTouchBank(touchHistory) {
  var touchBank = touchHistory.touchBank;
  var printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));
  if (touchBank.length > MAX_TOUCH_BANK) {
    printed += " (original size: " + touchBank.length + ")";
  }
  return printed;
}
__name(printTouchBank, "printTouchBank");
var ResponderTouchHistoryStore = class {
  static {
    __name(this, "ResponderTouchHistoryStore");
  }
  constructor() {
    this._touchHistory = {
      touchBank: [],
      //Array<TouchRecord>
      numberActiveTouches: 0,
      // If there is only one active touch, we remember its location. This prevents
      // us having to loop through all of the touches all the time in the most
      // common case.
      indexOfSingleActiveTouch: -1,
      mostRecentTimeStamp: 0
    };
  }
  recordTouchTrack(topLevelType, nativeEvent) {
    var touchHistory = this._touchHistory;
    if (isMoveish(topLevelType)) {
      nativeEvent.changedTouches.forEach((touch2) => recordTouchMove(touch2, touchHistory));
    } else if (isStartish(topLevelType)) {
      nativeEvent.changedTouches.forEach((touch2) => recordTouchStart(touch2, touchHistory));
      touchHistory.numberActiveTouches = nativeEvent.touches.length;
      if (touchHistory.numberActiveTouches === 1) {
        touchHistory.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier;
      }
    } else if (isEndish(topLevelType)) {
      nativeEvent.changedTouches.forEach((touch2) => recordTouchEnd(touch2, touchHistory));
      touchHistory.numberActiveTouches = nativeEvent.touches.length;
      if (touchHistory.numberActiveTouches === 1) {
        var touchBank = touchHistory.touchBank;
        for (var i = 0; i < touchBank.length; i++) {
          var touchTrackToCheck = touchBank[i];
          if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
            touchHistory.indexOfSingleActiveTouch = i;
            break;
          }
        }
        if (__DEV__) {
          var activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];
          if (!(activeRecord != null && activeRecord.touchActive)) {
            console.error("Cannot find single active touch.");
          }
        }
      }
    }
  }
  get touchHistory() {
    return this._touchHistory;
  }
};

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useResponderEvents/ResponderSystem.js
var emptyObject7 = {};
var startRegistration = ["onStartShouldSetResponderCapture", "onStartShouldSetResponder", {
  bubbles: true
}];
var moveRegistration = ["onMoveShouldSetResponderCapture", "onMoveShouldSetResponder", {
  bubbles: true
}];
var scrollRegistration = ["onScrollShouldSetResponderCapture", "onScrollShouldSetResponder", {
  bubbles: false
}];
var shouldSetResponderEvents = {
  touchstart: startRegistration,
  mousedown: startRegistration,
  touchmove: moveRegistration,
  mousemove: moveRegistration,
  scroll: scrollRegistration
};
var emptyResponder = {
  id: null,
  idPath: null,
  node: null
};
var responderListenersMap = /* @__PURE__ */ new Map();
var isEmulatingMouseEvents = false;
var trackedTouchCount = 0;
var currentResponder = {
  id: null,
  node: null,
  idPath: null
};
var responderTouchHistoryStore = new ResponderTouchHistoryStore();
function changeCurrentResponder(responder) {
  currentResponder = responder;
}
__name(changeCurrentResponder, "changeCurrentResponder");
function getResponderConfig(id) {
  var config = responderListenersMap.get(id);
  return config != null ? config : emptyObject7;
}
__name(getResponderConfig, "getResponderConfig");
function eventListener(domEvent) {
  var eventType = domEvent.type;
  var eventTarget = domEvent.target;
  if (eventType === "touchstart") {
    isEmulatingMouseEvents = true;
  }
  if (eventType === "touchmove" || trackedTouchCount > 1) {
    isEmulatingMouseEvents = false;
  }
  if (
    // Ignore browser emulated mouse events
    eventType === "mousedown" && isEmulatingMouseEvents || eventType === "mousemove" && isEmulatingMouseEvents || // Ignore mousemove if a mousedown didn't occur first
    eventType === "mousemove" && trackedTouchCount < 1
  ) {
    return;
  }
  if (isEmulatingMouseEvents && eventType === "mouseup") {
    if (trackedTouchCount === 0) {
      isEmulatingMouseEvents = false;
    }
    return;
  }
  var isStartEvent = isStartish(eventType) && isPrimaryPointerDown(domEvent);
  var isMoveEvent = isMoveish(eventType);
  var isEndEvent = isEndish(eventType);
  var isScrollEvent = isScroll(eventType);
  var isSelectionChangeEvent = isSelectionChange(eventType);
  var responderEvent = createResponderEvent(domEvent, responderTouchHistoryStore);
  if (isStartEvent || isMoveEvent || isEndEvent) {
    if (domEvent.touches) {
      trackedTouchCount = domEvent.touches.length;
    } else {
      if (isStartEvent) {
        trackedTouchCount = 1;
      } else if (isEndEvent) {
        trackedTouchCount = 0;
      }
    }
    responderTouchHistoryStore.recordTouchTrack(eventType, responderEvent.nativeEvent);
  }
  var eventPaths = getResponderPaths(domEvent);
  var wasNegotiated = false;
  var wantsResponder;
  if (isStartEvent || isMoveEvent || isScrollEvent && trackedTouchCount > 0) {
    var currentResponderIdPath = currentResponder.idPath;
    var eventIdPath = eventPaths.idPath;
    if (currentResponderIdPath != null && eventIdPath != null) {
      var lowestCommonAncestor = getLowestCommonAncestor(currentResponderIdPath, eventIdPath);
      if (lowestCommonAncestor != null) {
        var indexOfLowestCommonAncestor = eventIdPath.indexOf(lowestCommonAncestor);
        var index2 = indexOfLowestCommonAncestor + (lowestCommonAncestor === currentResponder.id ? 1 : 0);
        eventPaths = {
          idPath: eventIdPath.slice(index2),
          nodePath: eventPaths.nodePath.slice(index2)
        };
      } else {
        eventPaths = null;
      }
    }
    if (eventPaths != null) {
      wantsResponder = findWantsResponder(eventPaths, domEvent, responderEvent);
      if (wantsResponder != null) {
        attemptTransfer(responderEvent, wantsResponder);
        wasNegotiated = true;
      }
    }
  }
  if (currentResponder.id != null && currentResponder.node != null) {
    var _currentResponder = currentResponder, id = _currentResponder.id, node = _currentResponder.node;
    var _getResponderConfig = getResponderConfig(id), onResponderStart = _getResponderConfig.onResponderStart, onResponderMove = _getResponderConfig.onResponderMove, onResponderEnd = _getResponderConfig.onResponderEnd, onResponderRelease = _getResponderConfig.onResponderRelease, onResponderTerminate = _getResponderConfig.onResponderTerminate, onResponderTerminationRequest = _getResponderConfig.onResponderTerminationRequest;
    responderEvent.bubbles = false;
    responderEvent.cancelable = false;
    responderEvent.currentTarget = node;
    if (isStartEvent) {
      if (onResponderStart != null) {
        responderEvent.dispatchConfig.registrationName = "onResponderStart";
        onResponderStart(responderEvent);
      }
    } else if (isMoveEvent) {
      if (onResponderMove != null) {
        responderEvent.dispatchConfig.registrationName = "onResponderMove";
        onResponderMove(responderEvent);
      }
    } else {
      var isTerminateEvent = isCancelish(eventType) || // native context menu
      eventType === "contextmenu" || // window blur
      eventType === "blur" && eventTarget === window || // responder (or ancestors) blur
      eventType === "blur" && eventTarget.contains(node) && domEvent.relatedTarget !== node || // native scroll without using a pointer
      isScrollEvent && trackedTouchCount === 0 || // native scroll on node that is parent of the responder (allow siblings to scroll)
      isScrollEvent && eventTarget.contains(node) && eventTarget !== node || // native select/selectionchange on node
      isSelectionChangeEvent && hasValidSelection(domEvent);
      var isReleaseEvent = isEndEvent && !isTerminateEvent && !hasTargetTouches(node, domEvent.touches);
      if (isEndEvent) {
        if (onResponderEnd != null) {
          responderEvent.dispatchConfig.registrationName = "onResponderEnd";
          onResponderEnd(responderEvent);
        }
      }
      if (isReleaseEvent) {
        if (onResponderRelease != null) {
          responderEvent.dispatchConfig.registrationName = "onResponderRelease";
          onResponderRelease(responderEvent);
        }
        changeCurrentResponder(emptyResponder);
      }
      if (isTerminateEvent) {
        var shouldTerminate = true;
        if (eventType === "contextmenu" || eventType === "scroll" || eventType === "selectionchange") {
          if (wasNegotiated) {
            shouldTerminate = false;
          } else if (onResponderTerminationRequest != null) {
            responderEvent.dispatchConfig.registrationName = "onResponderTerminationRequest";
            if (onResponderTerminationRequest(responderEvent) === false) {
              shouldTerminate = false;
            }
          }
        }
        if (shouldTerminate) {
          if (onResponderTerminate != null) {
            responderEvent.dispatchConfig.registrationName = "onResponderTerminate";
            onResponderTerminate(responderEvent);
          }
          changeCurrentResponder(emptyResponder);
          isEmulatingMouseEvents = false;
          trackedTouchCount = 0;
        }
      }
    }
  }
}
__name(eventListener, "eventListener");
function findWantsResponder(eventPaths, domEvent, responderEvent) {
  var shouldSetCallbacks = shouldSetResponderEvents[domEvent.type];
  if (shouldSetCallbacks != null) {
    var idPath = eventPaths.idPath, nodePath = eventPaths.nodePath;
    var shouldSetCallbackCaptureName = shouldSetCallbacks[0];
    var shouldSetCallbackBubbleName = shouldSetCallbacks[1];
    var bubbles = shouldSetCallbacks[2].bubbles;
    var check = /* @__PURE__ */ __name(function check2(id2, node2, callbackName) {
      var config = getResponderConfig(id2);
      var shouldSetCallback = config[callbackName];
      if (shouldSetCallback != null) {
        responderEvent.currentTarget = node2;
        if (shouldSetCallback(responderEvent) === true) {
          var prunedIdPath = idPath.slice(idPath.indexOf(id2));
          return {
            id: id2,
            node: node2,
            idPath: prunedIdPath
          };
        }
      }
    }, "check");
    for (var i = idPath.length - 1; i >= 0; i--) {
      var id = idPath[i];
      var node = nodePath[i];
      var result = check(id, node, shouldSetCallbackCaptureName);
      if (result != null) {
        return result;
      }
      if (responderEvent.isPropagationStopped() === true) {
        return;
      }
    }
    if (bubbles) {
      for (var _i = 0; _i < idPath.length; _i++) {
        var _id = idPath[_i];
        var _node = nodePath[_i];
        var _result = check(_id, _node, shouldSetCallbackBubbleName);
        if (_result != null) {
          return _result;
        }
        if (responderEvent.isPropagationStopped() === true) {
          return;
        }
      }
    } else {
      var _id2 = idPath[0];
      var _node2 = nodePath[0];
      var target = domEvent.target;
      if (target === _node2) {
        return check(_id2, _node2, shouldSetCallbackBubbleName);
      }
    }
  }
}
__name(findWantsResponder, "findWantsResponder");
function attemptTransfer(responderEvent, wantsResponder) {
  var _currentResponder2 = currentResponder, currentId = _currentResponder2.id, currentNode = _currentResponder2.node;
  var id = wantsResponder.id, node = wantsResponder.node;
  var _getResponderConfig2 = getResponderConfig(id), onResponderGrant = _getResponderConfig2.onResponderGrant, onResponderReject = _getResponderConfig2.onResponderReject;
  responderEvent.bubbles = false;
  responderEvent.cancelable = false;
  responderEvent.currentTarget = node;
  if (currentId == null) {
    if (onResponderGrant != null) {
      responderEvent.currentTarget = node;
      responderEvent.dispatchConfig.registrationName = "onResponderGrant";
      onResponderGrant(responderEvent);
    }
    changeCurrentResponder(wantsResponder);
  } else {
    var _getResponderConfig3 = getResponderConfig(currentId), onResponderTerminate = _getResponderConfig3.onResponderTerminate, onResponderTerminationRequest = _getResponderConfig3.onResponderTerminationRequest;
    var allowTransfer = true;
    if (onResponderTerminationRequest != null) {
      responderEvent.currentTarget = currentNode;
      responderEvent.dispatchConfig.registrationName = "onResponderTerminationRequest";
      if (onResponderTerminationRequest(responderEvent) === false) {
        allowTransfer = false;
      }
    }
    if (allowTransfer) {
      if (onResponderTerminate != null) {
        responderEvent.currentTarget = currentNode;
        responderEvent.dispatchConfig.registrationName = "onResponderTerminate";
        onResponderTerminate(responderEvent);
      }
      if (onResponderGrant != null) {
        responderEvent.currentTarget = node;
        responderEvent.dispatchConfig.registrationName = "onResponderGrant";
        onResponderGrant(responderEvent);
      }
      changeCurrentResponder(wantsResponder);
    } else {
      if (onResponderReject != null) {
        responderEvent.currentTarget = node;
        responderEvent.dispatchConfig.registrationName = "onResponderReject";
        onResponderReject(responderEvent);
      }
    }
  }
}
__name(attemptTransfer, "attemptTransfer");
var documentEventsCapturePhase = ["blur", "scroll"];
var documentEventsBubblePhase = [
  // mouse
  "mousedown",
  "mousemove",
  "mouseup",
  "dragstart",
  // touch
  "touchstart",
  "touchmove",
  "touchend",
  "touchcancel",
  // other
  "contextmenu",
  "select",
  "selectionchange"
];
function attachListeners() {
  if (canUseDom_default && window.__reactResponderSystemActive == null) {
    window.addEventListener("blur", eventListener);
    documentEventsBubblePhase.forEach((eventType) => {
      document.addEventListener(eventType, eventListener);
    });
    documentEventsCapturePhase.forEach((eventType) => {
      document.addEventListener(eventType, eventListener, true);
    });
    window.__reactResponderSystemActive = true;
  }
}
__name(attachListeners, "attachListeners");
function addNode(id, node, config) {
  setResponderId(node, id);
  responderListenersMap.set(id, config);
}
__name(addNode, "addNode");
function removeNode(id) {
  if (currentResponder.id === id) {
    terminateResponder();
  }
  if (responderListenersMap.has(id)) {
    responderListenersMap.delete(id);
  }
}
__name(removeNode, "removeNode");
function terminateResponder() {
  var _currentResponder3 = currentResponder, id = _currentResponder3.id, node = _currentResponder3.node;
  if (id != null && node != null) {
    var _getResponderConfig4 = getResponderConfig(id), onResponderTerminate = _getResponderConfig4.onResponderTerminate;
    if (onResponderTerminate != null) {
      var event = createResponderEvent({}, responderTouchHistoryStore);
      event.currentTarget = node;
      onResponderTerminate(event);
    }
    changeCurrentResponder(emptyResponder);
  }
  isEmulatingMouseEvents = false;
  trackedTouchCount = 0;
}
__name(terminateResponder, "terminateResponder");
function getResponderNode() {
  return currentResponder.node;
}
__name(getResponderNode, "getResponderNode");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/useResponderEvents/index.js
var emptyObject8 = {};
var idCounter = 0;
function useStable2(getInitialValue) {
  var ref = React31.useRef(null);
  if (ref.current == null) {
    ref.current = getInitialValue();
  }
  return ref.current;
}
__name(useStable2, "useStable");
function useResponderEvents(hostRef, config) {
  if (config === void 0) {
    config = emptyObject8;
  }
  var id = useStable2(() => idCounter++);
  var isAttachedRef = React31.useRef(false);
  React31.useEffect(() => {
    attachListeners();
    return () => {
      removeNode(id);
    };
  }, [id]);
  React31.useEffect(() => {
    var _config = config, onMoveShouldSetResponder = _config.onMoveShouldSetResponder, onMoveShouldSetResponderCapture = _config.onMoveShouldSetResponderCapture, onScrollShouldSetResponder = _config.onScrollShouldSetResponder, onScrollShouldSetResponderCapture = _config.onScrollShouldSetResponderCapture, onSelectionChangeShouldSetResponder = _config.onSelectionChangeShouldSetResponder, onSelectionChangeShouldSetResponderCapture = _config.onSelectionChangeShouldSetResponderCapture, onStartShouldSetResponder = _config.onStartShouldSetResponder, onStartShouldSetResponderCapture = _config.onStartShouldSetResponderCapture;
    var requiresResponderSystem = onMoveShouldSetResponder != null || onMoveShouldSetResponderCapture != null || onScrollShouldSetResponder != null || onScrollShouldSetResponderCapture != null || onSelectionChangeShouldSetResponder != null || onSelectionChangeShouldSetResponderCapture != null || onStartShouldSetResponder != null || onStartShouldSetResponderCapture != null;
    var node = hostRef.current;
    if (requiresResponderSystem) {
      addNode(id, node, config);
      isAttachedRef.current = true;
    } else if (isAttachedRef.current) {
      removeNode(id);
      isAttachedRef.current = false;
    }
  }, [config, hostRef, id]);
  React31.useDebugValue({
    isResponder: hostRef.current === getResponderNode()
  });
  React31.useDebugValue(config);
}
__name(useResponderEvents, "useResponderEvents");

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/Text/TextAncestorContext.js
import { createContext as createContext12 } from "react";
var TextAncestorContext = /* @__PURE__ */ createContext12(false);
var TextAncestorContext_default = TextAncestorContext;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/View/index.js
var _excluded4 = ["hrefAttrs", "onLayout", "onMoveShouldSetResponder", "onMoveShouldSetResponderCapture", "onResponderEnd", "onResponderGrant", "onResponderMove", "onResponderReject", "onResponderRelease", "onResponderStart", "onResponderTerminate", "onResponderTerminationRequest", "onScrollShouldSetResponder", "onScrollShouldSetResponderCapture", "onSelectionChangeShouldSetResponder", "onSelectionChangeShouldSetResponderCapture", "onStartShouldSetResponder", "onStartShouldSetResponderCapture"];
var forwardPropsList = Object.assign({}, defaultProps, accessibilityProps, clickProps, focusProps, keyboardProps, mouseProps, touchProps, styleProps, {
  href: true,
  lang: true,
  onScroll: true,
  onWheel: true,
  pointerEvents: true
});
var pickProps = /* @__PURE__ */ __name((props) => pick(props, forwardPropsList), "pickProps");
var View5 = /* @__PURE__ */ React32.forwardRef((props, forwardedRef) => {
  var hrefAttrs = props.hrefAttrs, onLayout = props.onLayout, onMoveShouldSetResponder = props.onMoveShouldSetResponder, onMoveShouldSetResponderCapture = props.onMoveShouldSetResponderCapture, onResponderEnd = props.onResponderEnd, onResponderGrant = props.onResponderGrant, onResponderMove = props.onResponderMove, onResponderReject = props.onResponderReject, onResponderRelease = props.onResponderRelease, onResponderStart = props.onResponderStart, onResponderTerminate = props.onResponderTerminate, onResponderTerminationRequest = props.onResponderTerminationRequest, onScrollShouldSetResponder = props.onScrollShouldSetResponder, onScrollShouldSetResponderCapture = props.onScrollShouldSetResponderCapture, onSelectionChangeShouldSetResponder = props.onSelectionChangeShouldSetResponder, onSelectionChangeShouldSetResponderCapture = props.onSelectionChangeShouldSetResponderCapture, onStartShouldSetResponder = props.onStartShouldSetResponder, onStartShouldSetResponderCapture = props.onStartShouldSetResponderCapture, rest = (0, import_objectWithoutPropertiesLoose4.default)(props, _excluded4);
  if (process.env.NODE_ENV !== "production") {
    React32.Children.toArray(props.children).forEach((item) => {
      if (typeof item === "string") {
        console.error("Unexpected text node: " + item + ". A text node cannot be a child of a <View>.");
      }
    });
  }
  var hasTextAncestor = React32.useContext(TextAncestorContext_default);
  var hostRef = React32.useRef(null);
  var _useLocaleContext = useLocaleContext(), contextDirection = _useLocaleContext.direction;
  useElementLayout(hostRef, onLayout);
  useResponderEvents(hostRef, {
    onMoveShouldSetResponder,
    onMoveShouldSetResponderCapture,
    onResponderEnd,
    onResponderGrant,
    onResponderMove,
    onResponderReject,
    onResponderRelease,
    onResponderStart,
    onResponderTerminate,
    onResponderTerminationRequest,
    onScrollShouldSetResponder,
    onScrollShouldSetResponderCapture,
    onSelectionChangeShouldSetResponder,
    onSelectionChangeShouldSetResponderCapture,
    onStartShouldSetResponder,
    onStartShouldSetResponderCapture
  });
  var component = "div";
  var langDirection = props.lang != null ? getLocaleDirection(props.lang) : null;
  var componentDirection = props.dir || langDirection;
  var writingDirection = componentDirection || contextDirection;
  var supportedProps = pickProps(rest);
  supportedProps.dir = componentDirection;
  supportedProps.style = [styles.view$raw, hasTextAncestor && styles.inline, props.style];
  if (props.href != null) {
    component = "a";
    if (hrefAttrs != null) {
      var download = hrefAttrs.download, rel = hrefAttrs.rel, target = hrefAttrs.target;
      if (download != null) {
        supportedProps.download = download;
      }
      if (rel != null) {
        supportedProps.rel = rel;
      }
      if (typeof target === "string") {
        supportedProps.target = target.charAt(0) !== "_" ? "_" + target : target;
      }
    }
  }
  var platformMethodsRef = usePlatformMethods(supportedProps);
  var setRef2 = useMergeRefs(hostRef, platformMethodsRef, forwardedRef);
  supportedProps.ref = setRef2;
  return createElement_default(component, supportedProps, {
    writingDirection
  });
});
View5.displayName = "View";
var styles = StyleSheet_default.create({
  view$raw: {
    alignContent: "flex-start",
    alignItems: "stretch",
    backgroundColor: "transparent",
    border: "0 solid black",
    boxSizing: "border-box",
    display: "flex",
    flexBasis: "auto",
    flexDirection: "column",
    flexShrink: 0,
    listStyle: "none",
    margin: 0,
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    position: "relative",
    textDecoration: "none",
    zIndex: 0
  },
  inline: {
    display: "inline-flex"
  }
});
var View_default = View5;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/ScrollView/index.js
var import_objectSpread24 = __toESM(require_objectSpread2());
var import_extends2 = __toESM(require_extends());
var import_objectWithoutPropertiesLoose6 = __toESM(require_objectWithoutPropertiesLoose());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/Dimensions/index.js
var import_invariant = __toESM(require_invariant());
var dimensions = {
  window: {
    fontScale: 1,
    height: 0,
    scale: 1,
    width: 0
  },
  screen: {
    fontScale: 1,
    height: 0,
    scale: 1,
    width: 0
  }
};
var listeners = {};
var shouldInit = canUseDom_default;
function update() {
  if (!canUseDom_default) {
    return;
  }
  var win = window;
  var height;
  var width;
  if (win.visualViewport) {
    var visualViewport = win.visualViewport;
    height = Math.round(visualViewport.height * visualViewport.scale);
    width = Math.round(visualViewport.width * visualViewport.scale);
  } else {
    var docEl = win.document.documentElement;
    height = docEl.clientHeight;
    width = docEl.clientWidth;
  }
  dimensions.window = {
    fontScale: 1,
    height,
    scale: win.devicePixelRatio || 1,
    width
  };
  dimensions.screen = {
    fontScale: 1,
    height: win.screen.height,
    scale: win.devicePixelRatio || 1,
    width: win.screen.width
  };
}
__name(update, "update");
function handleResize() {
  update();
  if (Array.isArray(listeners["change"])) {
    listeners["change"].forEach((handler) => handler(dimensions));
  }
}
__name(handleResize, "handleResize");
var Dimensions = class {
  static {
    __name(this, "Dimensions");
  }
  static get(dimension) {
    if (shouldInit) {
      shouldInit = false;
      update();
    }
    (0, import_invariant.default)(dimensions[dimension], "No dimension set for key " + dimension);
    return dimensions[dimension];
  }
  static set(initialDimensions) {
    if (initialDimensions) {
      if (canUseDom_default) {
        (0, import_invariant.default)(false, "Dimensions cannot be set in the browser");
      } else {
        if (initialDimensions.screen != null) {
          dimensions.screen = initialDimensions.screen;
        }
        if (initialDimensions.window != null) {
          dimensions.window = initialDimensions.window;
        }
      }
    }
  }
  static addEventListener(type, handler) {
    listeners[type] = listeners[type] || [];
    listeners[type].push(handler);
    return {
      remove: /* @__PURE__ */ __name(() => {
        this.removeEventListener(type, handler);
      }, "remove")
    };
  }
  static removeEventListener(type, handler) {
    if (Array.isArray(listeners[type])) {
      listeners[type] = listeners[type].filter((_handler) => _handler !== handler);
    }
  }
};
if (canUseDom_default) {
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleResize, false);
  } else {
    window.addEventListener("resize", handleResize, false);
  }
}

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/TextInputState/index.js
var TextInputState = {
  /**
   * Internal state
   */
  _currentlyFocusedNode: null,
  /**
   * Returns the ID of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedField() {
    if (document.activeElement !== this._currentlyFocusedNode) {
      this._currentlyFocusedNode = null;
    }
    return this._currentlyFocusedNode;
  },
  /**
   * @param {Object} TextInputID id of the text field to focus
   * Focuses the specified text field
   * noop if the text field was already focused
   */
  focusTextInput(textFieldNode) {
    if (textFieldNode !== null) {
      this._currentlyFocusedNode = textFieldNode;
      if (document.activeElement !== textFieldNode) {
        UIManager_default.focus(textFieldNode);
      }
    }
  },
  /**
   * @param {Object} textFieldNode id of the text field to focus
   * Unfocuses the specified text field
   * noop if it wasn't focused
   */
  blurTextInput(textFieldNode) {
    if (textFieldNode !== null) {
      this._currentlyFocusedNode = null;
      if (document.activeElement === textFieldNode) {
        UIManager_default.blur(textFieldNode);
      }
    }
  }
};
var TextInputState_default = TextInputState;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/modules/dismissKeyboard/index.js
var dismissKeyboard = /* @__PURE__ */ __name(() => {
  TextInputState_default.blurTextInput(TextInputState_default.currentlyFocusedField());
}, "dismissKeyboard");
var dismissKeyboard_default = dismissKeyboard;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/ScrollView/index.js
var import_invariant2 = __toESM(require_invariant());

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/ScrollView/ScrollViewBase.js
var import_extends = __toESM(require_extends());
var import_objectWithoutPropertiesLoose5 = __toESM(require_objectWithoutPropertiesLoose());
import * as React33 from "react";
var _excluded5 = ["onScroll", "onTouchMove", "onWheel", "scrollEnabled", "scrollEventThrottle", "showsHorizontalScrollIndicator", "showsVerticalScrollIndicator", "style"];
function normalizeScrollEvent(e) {
  return {
    nativeEvent: {
      contentOffset: {
        get x() {
          return e.target.scrollLeft;
        },
        get y() {
          return e.target.scrollTop;
        }
      },
      contentSize: {
        get height() {
          return e.target.scrollHeight;
        },
        get width() {
          return e.target.scrollWidth;
        }
      },
      layoutMeasurement: {
        get height() {
          return e.target.offsetHeight;
        },
        get width() {
          return e.target.offsetWidth;
        }
      }
    },
    timeStamp: Date.now()
  };
}
__name(normalizeScrollEvent, "normalizeScrollEvent");
function shouldEmitScrollEvent(lastTick, eventThrottle) {
  var timeSinceLastTick = Date.now() - lastTick;
  return eventThrottle > 0 && timeSinceLastTick >= eventThrottle;
}
__name(shouldEmitScrollEvent, "shouldEmitScrollEvent");
var ScrollViewBase = /* @__PURE__ */ React33.forwardRef((props, forwardedRef) => {
  var onScroll = props.onScroll, onTouchMove = props.onTouchMove, onWheel = props.onWheel, _props$scrollEnabled = props.scrollEnabled, scrollEnabled = _props$scrollEnabled === void 0 ? true : _props$scrollEnabled, _props$scrollEventThr = props.scrollEventThrottle, scrollEventThrottle = _props$scrollEventThr === void 0 ? 0 : _props$scrollEventThr, showsHorizontalScrollIndicator = props.showsHorizontalScrollIndicator, showsVerticalScrollIndicator = props.showsVerticalScrollIndicator, style = props.style, rest = (0, import_objectWithoutPropertiesLoose5.default)(props, _excluded5);
  var scrollState = React33.useRef({
    isScrolling: false,
    scrollLastTick: 0
  });
  var scrollTimeout = React33.useRef(null);
  var scrollRef = React33.useRef(null);
  function createPreventableScrollHandler(handler) {
    return (e) => {
      if (scrollEnabled) {
        if (handler) {
          handler(e);
        }
      }
    };
  }
  __name(createPreventableScrollHandler, "createPreventableScrollHandler");
  function handleScroll(e) {
    e.stopPropagation();
    if (e.target === scrollRef.current) {
      e.persist();
      if (scrollTimeout.current != null) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        handleScrollEnd(e);
      }, 100);
      if (scrollState.current.isScrolling) {
        if (shouldEmitScrollEvent(scrollState.current.scrollLastTick, scrollEventThrottle)) {
          handleScrollTick(e);
        }
      } else {
        handleScrollStart(e);
      }
    }
  }
  __name(handleScroll, "handleScroll");
  function handleScrollStart(e) {
    scrollState.current.isScrolling = true;
    handleScrollTick(e);
  }
  __name(handleScrollStart, "handleScrollStart");
  function handleScrollTick(e) {
    scrollState.current.scrollLastTick = Date.now();
    if (onScroll) {
      onScroll(normalizeScrollEvent(e));
    }
  }
  __name(handleScrollTick, "handleScrollTick");
  function handleScrollEnd(e) {
    scrollState.current.isScrolling = false;
    if (onScroll) {
      onScroll(normalizeScrollEvent(e));
    }
  }
  __name(handleScrollEnd, "handleScrollEnd");
  var hideScrollbar = showsHorizontalScrollIndicator === false || showsVerticalScrollIndicator === false;
  return /* @__PURE__ */ React33.createElement(View_default, (0, import_extends.default)({}, rest, {
    onScroll: handleScroll,
    onTouchMove: createPreventableScrollHandler(onTouchMove),
    onWheel: createPreventableScrollHandler(onWheel),
    ref: useMergeRefs(scrollRef, forwardedRef),
    style: [style, !scrollEnabled && styles2.scrollDisabled, hideScrollbar && styles2.hideScrollbar]
  }));
});
var styles2 = StyleSheet_default.create({
  scrollDisabled: {
    overflowX: "hidden",
    overflowY: "hidden",
    touchAction: "none"
  },
  hideScrollbar: {
    scrollbarWidth: "none"
  }
});
var ScrollViewBase_default = ScrollViewBase;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/ScrollView/index.js
var import_warning = __toESM(require_warning());
import React34 from "react";
var _excluded6 = ["contentContainerStyle", "horizontal", "onContentSizeChange", "refreshControl", "stickyHeaderIndices", "pagingEnabled", "forwardedRef", "keyboardDismissMode", "onScroll", "centerContent"];
var emptyObject9 = {};
var IS_ANIMATING_TOUCH_START_THRESHOLD_MS = 16;
var ScrollView = class extends React34.Component {
  static {
    __name(this, "ScrollView");
  }
  constructor() {
    super(...arguments);
    this._scrollNodeRef = null;
    this._innerViewRef = null;
    this.isTouching = false;
    this.lastMomentumScrollBeginTime = 0;
    this.lastMomentumScrollEndTime = 0;
    this.observedScrollSinceBecomingResponder = false;
    this.becameResponderWhileAnimating = false;
    this.scrollResponderHandleScrollShouldSetResponder = () => {
      return this.isTouching;
    };
    this.scrollResponderHandleStartShouldSetResponderCapture = (e) => {
      return this.scrollResponderIsAnimating();
    };
    this.scrollResponderHandleTerminationRequest = () => {
      return !this.observedScrollSinceBecomingResponder;
    };
    this.scrollResponderHandleTouchEnd = (e) => {
      var nativeEvent = e.nativeEvent;
      this.isTouching = nativeEvent.touches.length !== 0;
      this.props.onTouchEnd && this.props.onTouchEnd(e);
    };
    this.scrollResponderHandleResponderRelease = (e) => {
      this.props.onResponderRelease && this.props.onResponderRelease(e);
      var currentlyFocusedTextInput = TextInputState_default.currentlyFocusedField();
      if (!this.props.keyboardShouldPersistTaps && currentlyFocusedTextInput != null && e.target !== currentlyFocusedTextInput && !this.observedScrollSinceBecomingResponder && !this.becameResponderWhileAnimating) {
        this.props.onScrollResponderKeyboardDismissed && this.props.onScrollResponderKeyboardDismissed(e);
        TextInputState_default.blurTextInput(currentlyFocusedTextInput);
      }
    };
    this.scrollResponderHandleScroll = (e) => {
      this.observedScrollSinceBecomingResponder = true;
      this.props.onScroll && this.props.onScroll(e);
    };
    this.scrollResponderHandleResponderGrant = (e) => {
      this.observedScrollSinceBecomingResponder = false;
      this.props.onResponderGrant && this.props.onResponderGrant(e);
      this.becameResponderWhileAnimating = this.scrollResponderIsAnimating();
    };
    this.scrollResponderHandleScrollBeginDrag = (e) => {
      this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
    };
    this.scrollResponderHandleScrollEndDrag = (e) => {
      this.props.onScrollEndDrag && this.props.onScrollEndDrag(e);
    };
    this.scrollResponderHandleMomentumScrollBegin = (e) => {
      this.lastMomentumScrollBeginTime = Date.now();
      this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
    };
    this.scrollResponderHandleMomentumScrollEnd = (e) => {
      this.lastMomentumScrollEndTime = Date.now();
      this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e);
    };
    this.scrollResponderHandleTouchStart = (e) => {
      this.isTouching = true;
      this.props.onTouchStart && this.props.onTouchStart(e);
    };
    this.scrollResponderHandleTouchMove = (e) => {
      this.props.onTouchMove && this.props.onTouchMove(e);
    };
    this.scrollResponderIsAnimating = () => {
      var now = Date.now();
      var timeSinceLastMomentumScrollEnd = now - this.lastMomentumScrollEndTime;
      var isAnimating = timeSinceLastMomentumScrollEnd < IS_ANIMATING_TOUCH_START_THRESHOLD_MS || this.lastMomentumScrollEndTime < this.lastMomentumScrollBeginTime;
      return isAnimating;
    };
    this.scrollResponderScrollTo = (x, y, animated) => {
      if (typeof x === "number") {
        console.warn("`scrollResponderScrollTo(x, y, animated)` is deprecated. Use `scrollResponderScrollTo({x: 5, y: 5, animated: true})` instead.");
      } else {
        var _ref = x || emptyObject9;
        x = _ref.x;
        y = _ref.y;
        animated = _ref.animated;
      }
      var node = this.getScrollableNode();
      var left2 = x || 0;
      var top = y || 0;
      if (node != null) {
        if (typeof node.scroll === "function") {
          node.scroll({
            top,
            left: left2,
            behavior: !animated ? "auto" : "smooth"
          });
        } else {
          node.scrollLeft = left2;
          node.scrollTop = top;
        }
      }
    };
    this.scrollResponderZoomTo = (rect, animated) => {
      if (Platform_default.OS !== "ios") {
        (0, import_invariant2.default)("zoomToRect is not implemented");
      }
    };
    this.scrollResponderScrollNativeHandleToKeyboard = (nodeHandle, additionalOffset, preventNegativeScrollOffset) => {
      this.additionalScrollOffset = additionalOffset || 0;
      this.preventNegativeScrollOffset = !!preventNegativeScrollOffset;
      UIManager_default.measureLayout(nodeHandle, this.getInnerViewNode(), this.scrollResponderTextInputFocusError, this.scrollResponderInputMeasureAndScrollToKeyboard);
    };
    this.scrollResponderInputMeasureAndScrollToKeyboard = (left2, top, width, height) => {
      var keyboardScreenY = Dimensions.get("window").height;
      if (this.keyboardWillOpenTo) {
        keyboardScreenY = this.keyboardWillOpenTo.endCoordinates.screenY;
      }
      var scrollOffsetY = top - keyboardScreenY + height + this.additionalScrollOffset;
      if (this.preventNegativeScrollOffset) {
        scrollOffsetY = Math.max(0, scrollOffsetY);
      }
      this.scrollResponderScrollTo({
        x: 0,
        y: scrollOffsetY,
        animated: true
      });
      this.additionalOffset = 0;
      this.preventNegativeScrollOffset = false;
    };
    this.scrollResponderKeyboardWillShow = (e) => {
      this.keyboardWillOpenTo = e;
      this.props.onKeyboardWillShow && this.props.onKeyboardWillShow(e);
    };
    this.scrollResponderKeyboardWillHide = (e) => {
      this.keyboardWillOpenTo = null;
      this.props.onKeyboardWillHide && this.props.onKeyboardWillHide(e);
    };
    this.scrollResponderKeyboardDidShow = (e) => {
      if (e) {
        this.keyboardWillOpenTo = e;
      }
      this.props.onKeyboardDidShow && this.props.onKeyboardDidShow(e);
    };
    this.scrollResponderKeyboardDidHide = (e) => {
      this.keyboardWillOpenTo = null;
      this.props.onKeyboardDidHide && this.props.onKeyboardDidHide(e);
    };
    this.flashScrollIndicators = () => {
      this.scrollResponderFlashScrollIndicators();
    };
    this.getScrollResponder = () => {
      return this;
    };
    this.getScrollableNode = () => {
      return this._scrollNodeRef;
    };
    this.getInnerViewRef = () => {
      return this._innerViewRef;
    };
    this.getInnerViewNode = () => {
      return this._innerViewRef;
    };
    this.getNativeScrollRef = () => {
      return this._scrollNodeRef;
    };
    this.scrollTo = (y, x, animated) => {
      if (typeof y === "number") {
        console.warn("`scrollTo(y, x, animated)` is deprecated. Use `scrollTo({x: 5, y: 5, animated: true})` instead.");
      } else {
        var _ref2 = y || emptyObject9;
        x = _ref2.x;
        y = _ref2.y;
        animated = _ref2.animated;
      }
      this.scrollResponderScrollTo({
        x: x || 0,
        y: y || 0,
        animated: animated !== false
      });
    };
    this.scrollToEnd = (options) => {
      var animated = (options && options.animated) !== false;
      var horizontal = this.props.horizontal;
      var scrollResponderNode = this.getScrollableNode();
      var x = horizontal ? scrollResponderNode.scrollWidth : 0;
      var y = horizontal ? 0 : scrollResponderNode.scrollHeight;
      this.scrollResponderScrollTo({
        x,
        y,
        animated
      });
    };
    this._handleContentOnLayout = (e) => {
      var _e$nativeEvent$layout = e.nativeEvent.layout, width = _e$nativeEvent$layout.width, height = _e$nativeEvent$layout.height;
      this.props.onContentSizeChange(width, height);
    };
    this._handleScroll = (e) => {
      if (process.env.NODE_ENV !== "production") {
        if (this.props.onScroll && this.props.scrollEventThrottle == null) {
          console.log("You specified `onScroll` on a <ScrollView> but not `scrollEventThrottle`. You will only receive one event. Using `16` you get all the events but be aware that it may cause frame drops, use a bigger number if you don't need as much precision.");
        }
      }
      if (this.props.keyboardDismissMode === "on-drag") {
        dismissKeyboard_default();
      }
      this.scrollResponderHandleScroll(e);
    };
    this._setInnerViewRef = (node) => {
      this._innerViewRef = node;
    };
    this._setScrollNodeRef = (node) => {
      this._scrollNodeRef = node;
      if (node != null) {
        node.getScrollResponder = this.getScrollResponder;
        node.getInnerViewNode = this.getInnerViewNode;
        node.getInnerViewRef = this.getInnerViewRef;
        node.getNativeScrollRef = this.getNativeScrollRef;
        node.getScrollableNode = this.getScrollableNode;
        node.scrollTo = this.scrollTo;
        node.scrollToEnd = this.scrollToEnd;
        node.flashScrollIndicators = this.flashScrollIndicators;
        node.scrollResponderZoomTo = this.scrollResponderZoomTo;
        node.scrollResponderScrollNativeHandleToKeyboard = this.scrollResponderScrollNativeHandleToKeyboard;
      }
      var ref = mergeRefs(this.props.forwardedRef);
      ref(node);
    };
  }
  /**
   * ------------------------------------------------------
   * START SCROLLRESPONDER
   * ------------------------------------------------------
   */
  // Reset to false every time becomes responder. This is used to:
  // - Determine if the scroll view has been scrolled and therefore should
  // refuse to give up its responder lock.
  // - Determine if releasing should dismiss the keyboard when we are in
  // tap-to-dismiss mode (!this.props.keyboardShouldPersistTaps).
  /**
   * Invoke this from an `onScroll` event.
   */
  /**
   * Merely touch starting is not sufficient for a scroll view to become the
   * responder. Being the "responder" means that the very next touch move/end
   * event will result in an action/movement.
   *
   * Invoke this from an `onStartShouldSetResponder` event.
   *
   * `onStartShouldSetResponder` is used when the next move/end will trigger
   * some UI movement/action, but when you want to yield priority to views
   * nested inside of the view.
   *
   * There may be some cases where scroll views actually should return `true`
   * from `onStartShouldSetResponder`: Any time we are detecting a standard tap
   * that gives priority to nested views.
   *
   * - If a single tap on the scroll view triggers an action such as
   *   recentering a map style view yet wants to give priority to interaction
   *   views inside (such as dropped pins or labels), then we would return true
   *   from this method when there is a single touch.
   *
   * - Similar to the previous case, if a two finger "tap" should trigger a
   *   zoom, we would check the `touches` count, and if `>= 2`, we would return
   *   true.
   *
   */
  scrollResponderHandleStartShouldSetResponder() {
    return false;
  }
  /**
   * There are times when the scroll view wants to become the responder
   * (meaning respond to the next immediate `touchStart/touchEnd`), in a way
   * that *doesn't* give priority to nested views (hence the capture phase):
   *
   * - Currently animating.
   * - Tapping anywhere that is not the focused input, while the keyboard is
   *   up (which should dismiss the keyboard).
   *
   * Invoke this from an `onStartShouldSetResponderCapture` event.
   */
  /**
   * Invoke this from an `onResponderReject` event.
   *
   * Some other element is not yielding its role as responder. Normally, we'd
   * just disable the `UIScrollView`, but a touch has already began on it, the
   * `UIScrollView` will not accept being disabled after that. The easiest
   * solution for now is to accept the limitation of disallowing this
   * altogether. To improve this, find a way to disable the `UIScrollView` after
   * a touch has already started.
   */
  scrollResponderHandleResponderReject() {
    (0, import_warning.default)(false, "ScrollView doesn't take rejection well - scrolls anyway");
  }
  /**
   * We will allow the scroll view to give up its lock iff it acquired the lock
   * during an animation. This is a very useful default that happens to satisfy
   * many common user experiences.
   *
   * - Stop a scroll on the left edge, then turn that into an outer view's
   *   backswipe.
   * - Stop a scroll mid-bounce at the top, continue pulling to have the outer
   *   view dismiss.
   * - However, without catching the scroll view mid-bounce (while it is
   *   motionless), if you drag far enough for the scroll view to become
   *   responder (and therefore drag the scroll view a bit), any backswipe
   *   navigation of a swipe gesture higher in the view hierarchy, should be
   *   rejected.
   */
  /**
   * Invoke this from an `onTouchEnd` event.
   *
   * @param {SyntheticEvent} e Event.
   */
  /**
   * Invoke this from an `onResponderRelease` event.
   */
  /**
   * Invoke this from an `onResponderGrant` event.
   */
  /**
   * Unfortunately, `onScrollBeginDrag` also fires when *stopping* the scroll
   * animation, and there's not an easy way to distinguish a drag vs. stopping
   * momentum.
   *
   * Invoke this from an `onScrollBeginDrag` event.
   */
  /**
   * Invoke this from an `onScrollEndDrag` event.
   */
  /**
   * Invoke this from an `onMomentumScrollBegin` event.
   */
  /**
   * Invoke this from an `onMomentumScrollEnd` event.
   */
  /**
   * Invoke this from an `onTouchStart` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param {SyntheticEvent} e Touch Start event.
   */
  /**
   * Invoke this from an `onTouchMove` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param {SyntheticEvent} e Touch Start event.
   */
  /**
   * A helper function for this class that lets us quickly determine if the
   * view is currently animating. This is particularly useful to know when
   * a touch has just started or ended.
   */
  /**
   * A helper function to scroll to a specific point in the scrollview.
   * This is currently used to help focus on child textviews, but can also
   * be used to quickly scroll to any element we want to focus. Syntax:
   *
   * scrollResponderScrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as as alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  /**
   * A helper function to zoom to a specific rect in the scrollview. The argument has the shape
   * {x: number; y: number; width: number; height: number; animated: boolean = true}
   *
   * @platform ios
   */
  /**
   * Displays the scroll indicators momentarily.
   */
  scrollResponderFlashScrollIndicators() {
  }
  /**
   * This method should be used as the callback to onFocus in a TextInputs'
   * parent view. Note that any module using this mixin needs to return
   * the parent view's ref in getScrollViewRef() in order to use this method.
   * @param {any} nodeHandle The TextInput node handle
   * @param {number} additionalOffset The scroll view's top "contentInset".
   *        Default is 0.
   * @param {bool} preventNegativeScrolling Whether to allow pulling the content
   *        down to make it meet the keyboard's top. Default is false.
   */
  /**
   * The calculations performed here assume the scroll view takes up the entire
   * screen - even if has some content inset. We then measure the offsets of the
   * keyboard, and compensate both for the scroll view's "contentInset".
   *
   * @param {number} left Position of input w.r.t. table view.
   * @param {number} top Position of input w.r.t. table view.
   * @param {number} width Width of the text input.
   * @param {number} height Height of the text input.
   */
  scrollResponderTextInputFocusError(e) {
    console.error("Error measuring text field: ", e);
  }
  /**
   * Warning, this may be called several times for a single keyboard opening.
   * It's best to store the information in this method and then take any action
   * at a later point (either in `keyboardDidShow` or other).
   *
   * Here's the order that events occur in:
   * - focus
   * - willShow {startCoordinates, endCoordinates} several times
   * - didShow several times
   * - blur
   * - willHide {startCoordinates, endCoordinates} several times
   * - didHide several times
   *
   * The `ScrollResponder` providesModule callbacks for each of these events.
   * Even though any user could have easily listened to keyboard events
   * themselves, using these `props` callbacks ensures that ordering of events
   * is consistent - and not dependent on the order that the keyboard events are
   * subscribed to. This matters when telling the scroll view to scroll to where
   * the keyboard is headed - the scroll responder better have been notified of
   * the keyboard destination before being instructed to scroll to where the
   * keyboard will be. Stick to the `ScrollResponder` callbacks, and everything
   * will work.
   *
   * WARNING: These callbacks will fire even if a keyboard is displayed in a
   * different navigation pane. Filter out the events to determine if they are
   * relevant to you. (For example, only if you receive these callbacks after
   * you had explicitly focused a node etc).
   */
  /**
   * ------------------------------------------------------
   * END SCROLLRESPONDER
   * ------------------------------------------------------
   */
  /**
   * Returns a reference to the underlying scroll responder, which supports
   * operations like `scrollTo`. All ScrollView-like components should
   * implement this method so that they can be composed while providing access
   * to the underlying scroll responder's methods.
   */
  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   * Syntax:
   *
   * scrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as as alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  /**
   * If this is a vertical ScrollView scrolls to the bottom.
   * If this is a horizontal ScrollView scrolls to the right.
   *
   * Use `scrollToEnd({ animated: true })` for smooth animated scrolling,
   * `scrollToEnd({ animated: false })` for immediate scrolling.
   * If no options are passed, `animated` defaults to true.
   */
  render() {
    var _this$props = this.props, contentContainerStyle = _this$props.contentContainerStyle, horizontal = _this$props.horizontal, onContentSizeChange = _this$props.onContentSizeChange, refreshControl = _this$props.refreshControl, stickyHeaderIndices = _this$props.stickyHeaderIndices, pagingEnabled = _this$props.pagingEnabled, forwardedRef = _this$props.forwardedRef, keyboardDismissMode = _this$props.keyboardDismissMode, onScroll = _this$props.onScroll, centerContent = _this$props.centerContent, other = (0, import_objectWithoutPropertiesLoose6.default)(_this$props, _excluded6);
    if (process.env.NODE_ENV !== "production" && this.props.style) {
      var style = StyleSheet_default.flatten(this.props.style);
      var childLayoutProps = ["alignItems", "justifyContent"].filter((prop) => style && style[prop] !== void 0);
      (0, import_invariant2.default)(childLayoutProps.length === 0, "ScrollView child layout (" + JSON.stringify(childLayoutProps) + ") must be applied through the contentContainerStyle prop.");
    }
    var contentSizeChangeProps = {};
    if (onContentSizeChange) {
      contentSizeChangeProps = {
        onLayout: this._handleContentOnLayout
      };
    }
    var hasStickyHeaderIndices = !horizontal && Array.isArray(stickyHeaderIndices);
    var children = hasStickyHeaderIndices || pagingEnabled ? React34.Children.map(this.props.children, (child, i) => {
      var isSticky = hasStickyHeaderIndices && stickyHeaderIndices.indexOf(i) > -1;
      if (child != null && (isSticky || pagingEnabled)) {
        return /* @__PURE__ */ React34.createElement(View_default, {
          style: [isSticky && styles3.stickyHeader, pagingEnabled && styles3.pagingEnabledChild]
        }, child);
      } else {
        return child;
      }
    }) : this.props.children;
    var contentContainer = /* @__PURE__ */ React34.createElement(View_default, (0, import_extends2.default)({}, contentSizeChangeProps, {
      children,
      collapsable: false,
      ref: this._setInnerViewRef,
      style: [horizontal && styles3.contentContainerHorizontal, centerContent && styles3.contentContainerCenterContent, contentContainerStyle]
    }));
    var baseStyle = horizontal ? styles3.baseHorizontal : styles3.baseVertical;
    var pagingEnabledStyle = horizontal ? styles3.pagingEnabledHorizontal : styles3.pagingEnabledVertical;
    var props = (0, import_objectSpread24.default)((0, import_objectSpread24.default)({}, other), {}, {
      style: [baseStyle, pagingEnabled && pagingEnabledStyle, this.props.style],
      onTouchStart: this.scrollResponderHandleTouchStart,
      onTouchMove: this.scrollResponderHandleTouchMove,
      onTouchEnd: this.scrollResponderHandleTouchEnd,
      onScrollBeginDrag: this.scrollResponderHandleScrollBeginDrag,
      onScrollEndDrag: this.scrollResponderHandleScrollEndDrag,
      onMomentumScrollBegin: this.scrollResponderHandleMomentumScrollBegin,
      onMomentumScrollEnd: this.scrollResponderHandleMomentumScrollEnd,
      onStartShouldSetResponder: this.scrollResponderHandleStartShouldSetResponder,
      onStartShouldSetResponderCapture: this.scrollResponderHandleStartShouldSetResponderCapture,
      onScrollShouldSetResponder: this.scrollResponderHandleScrollShouldSetResponder,
      onScroll: this._handleScroll,
      onResponderGrant: this.scrollResponderHandleResponderGrant,
      onResponderTerminationRequest: this.scrollResponderHandleTerminationRequest,
      onResponderTerminate: this.scrollResponderHandleTerminate,
      onResponderRelease: this.scrollResponderHandleResponderRelease,
      onResponderReject: this.scrollResponderHandleResponderReject
    });
    var ScrollViewClass = ScrollViewBase_default;
    (0, import_invariant2.default)(ScrollViewClass !== void 0, "ScrollViewClass must not be undefined");
    var scrollView = /* @__PURE__ */ React34.createElement(ScrollViewClass, (0, import_extends2.default)({}, props, {
      ref: this._setScrollNodeRef
    }), contentContainer);
    if (refreshControl) {
      return /* @__PURE__ */ React34.cloneElement(refreshControl, {
        style: props.style
      }, scrollView);
    }
    return scrollView;
  }
};
var commonStyle = {
  flexGrow: 1,
  flexShrink: 1,
  // Enable hardware compositing in modern browsers.
  // Creates a new layer with its own backing surface that can significantly
  // improve scroll performance.
  transform: "translateZ(0)",
  // iOS native scrolling
  WebkitOverflowScrolling: "touch"
};
var styles3 = StyleSheet_default.create({
  baseVertical: (0, import_objectSpread24.default)((0, import_objectSpread24.default)({}, commonStyle), {}, {
    flexDirection: "column",
    overflowX: "hidden",
    overflowY: "auto"
  }),
  baseHorizontal: (0, import_objectSpread24.default)((0, import_objectSpread24.default)({}, commonStyle), {}, {
    flexDirection: "row",
    overflowX: "auto",
    overflowY: "hidden"
  }),
  contentContainerHorizontal: {
    flexDirection: "row"
  },
  contentContainerCenterContent: {
    justifyContent: "center",
    flexGrow: 1
  },
  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 10
  },
  pagingEnabledHorizontal: {
    scrollSnapType: "x mandatory"
  },
  pagingEnabledVertical: {
    scrollSnapType: "y mandatory"
  },
  pagingEnabledChild: {
    scrollSnapAlign: "start"
  }
});
var ForwardedScrollView = /* @__PURE__ */ React34.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ React34.createElement(ScrollView, (0, import_extends2.default)({}, props, {
    forwardedRef
  }));
});
ForwardedScrollView.displayName = "ScrollView";
var ScrollView_default = ForwardedScrollView;

// node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-native-web/dist/exports/ActivityIndicator/index.js
var import_extends3 = __toESM(require_extends());
var import_objectWithoutPropertiesLoose7 = __toESM(require_objectWithoutPropertiesLoose());
import * as React35 from "react";
var _excluded7 = ["animating", "color", "hidesWhenStopped", "size", "style"];
var createSvgCircle = /* @__PURE__ */ __name((style) => /* @__PURE__ */ React35.createElement("circle", {
  cx: "16",
  cy: "16",
  fill: "none",
  r: "14",
  strokeWidth: "4",
  style
}), "createSvgCircle");
var ActivityIndicator = /* @__PURE__ */ React35.forwardRef((props, forwardedRef) => {
  var _props$animating = props.animating, animating = _props$animating === void 0 ? true : _props$animating, _props$color = props.color, color = _props$color === void 0 ? "#1976D2" : _props$color, _props$hidesWhenStopp = props.hidesWhenStopped, hidesWhenStopped = _props$hidesWhenStopp === void 0 ? true : _props$hidesWhenStopp, _props$size = props.size, size4 = _props$size === void 0 ? "small" : _props$size, style = props.style, other = (0, import_objectWithoutPropertiesLoose7.default)(props, _excluded7);
  var svg = /* @__PURE__ */ React35.createElement("svg", {
    height: "100%",
    viewBox: "0 0 32 32",
    width: "100%"
  }, createSvgCircle({
    stroke: color,
    opacity: 0.2
  }), createSvgCircle({
    stroke: color,
    strokeDasharray: 80,
    strokeDashoffset: 60
  }));
  return /* @__PURE__ */ React35.createElement(View_default, (0, import_extends3.default)({}, other, {
    "aria-valuemax": 1,
    "aria-valuemin": 0,
    ref: forwardedRef,
    role: "progressbar",
    style: [styles4.container, style]
  }), /* @__PURE__ */ React35.createElement(View_default, {
    children: svg,
    style: [typeof size4 === "number" ? {
      height: size4,
      width: size4
    } : indicatorSizes[size4], styles4.animation, !animating && styles4.animationPause, !animating && hidesWhenStopped && styles4.hidesWhenStopped]
  }));
});
ActivityIndicator.displayName = "ActivityIndicator";
var styles4 = StyleSheet_default.create({
  container: {
    alignItems: "center",
    justifyContent: "center"
  },
  hidesWhenStopped: {
    visibility: "hidden"
  },
  animation: {
    animationDuration: "0.75s",
    animationKeyframes: [{
      "0%": {
        transform: "rotate(0deg)"
      },
      "100%": {
        transform: "rotate(360deg)"
      }
    }],
    animationTimingFunction: "linear",
    animationIterationCount: "infinite"
  },
  animationPause: {
    animationPlayState: "paused"
  }
});
var indicatorSizes = StyleSheet_default.create({
  small: {
    width: 20,
    height: 20
  },
  large: {
    width: 36,
    height: 36
  }
});
var ActivityIndicator_default = ActivityIndicator;

// node_modules/.pnpm/@hanzogui+avatar@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21_0c1ca19bf5a573510dad84784a757ed8/node_modules/@hanzogui/avatar/dist/esm/Avatar.mjs
import { getTokens as getTokens3, getVariableValue as getVariableValue2, styled as styled12 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+image@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21._08b6b18cf199c838f9b482e8d2631c07/node_modules/@hanzogui/image/dist/esm/Image.mjs
import { View as View6, styled as styled10 } from "@hanzogui/web";
import { jsx as jsx21 } from "react/jsx-runtime";
var StyledImage = styled10(View6, {
  name: "Image",
  render: "img"
});
var Image = StyledImage.styleable((inProps, ref) => {
  const {
    // exclude native only props
    blurRadius,
    capInsets,
    defaultSource,
    fadeDuration,
    loadingIndicatorSource,
    onLoadEnd,
    onPartialLoad,
    progressiveRenderingEnabled,
    resizeMethod,
    tintColor,
    ...rest
  } = inProps;
  return /* @__PURE__ */ jsx21(StyledImage, {
    ref,
    ...rest
  });
}, {
  staticConfig: {
    memo: true
  }
});
var func = /* @__PURE__ */ __name(() => {
}, "func");
Image.getSize = func;
Image.getSizeWithHeaders = func;
Image.prefetch = func;
Image.prefetchWithMetadata = func;
Image.abortPrefetch = func;
Image.queryCache = func;

// node_modules/.pnpm/@hanzogui+shapes@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_929606beb651bc1b2cbbd514ce8aae43/node_modules/@hanzogui/shapes/dist/esm/Square.mjs
import { styled as styled11 } from "@hanzogui/web";

// node_modules/.pnpm/@hanzogui+shapes@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_929606beb651bc1b2cbbd514ce8aae43/node_modules/@hanzogui/shapes/dist/esm/getShapeSize.mjs
var getShapeSize = /* @__PURE__ */ __name((size4, {
  tokens
}) => {
  const width = tokens.size[size4] ?? size4;
  const height = tokens.size[size4] ?? size4;
  return {
    width,
    height,
    minWidth: width,
    maxWidth: width,
    maxHeight: height,
    minHeight: height
  };
}, "getShapeSize");

// node_modules/.pnpm/@hanzogui+shapes@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_929606beb651bc1b2cbbd514ce8aae43/node_modules/@hanzogui/shapes/dist/esm/Square.mjs
var Square = styled11(ThemeableStack, {
  name: "Square",
  alignItems: "center",
  justifyContent: "center",
  variants: {
    size: {
      "...size": getShapeSize,
      ":number": getShapeSize
    }
  }
}, {
  memo: true
});

// node_modules/.pnpm/@hanzogui+avatar@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21_0c1ca19bf5a573510dad84784a757ed8/node_modules/@hanzogui/avatar/dist/esm/Avatar.mjs
import * as React36 from "react";
import { jsx as jsx22 } from "react/jsx-runtime";
var AVATAR_NAME = "Avatar";
var [createAvatarContext, createAvatarScope] = createContextScope(AVATAR_NAME);
var [AvatarProvider, useAvatarContext] = createAvatarContext(AVATAR_NAME);
var IMAGE_NAME = "AvatarImage";
var AvatarImage = React36.forwardRef((props, forwardedRef) => {
  const {
    __scopeAvatar,
    src,
    source,
    onLoadingStatusChange = /* @__PURE__ */ __name(() => {
    }, "onLoadingStatusChange"),
    ...imageProps
  } = props;
  const context3 = useAvatarContext(IMAGE_NAME, __scopeAvatar);
  const [status, setStatus] = React36.useState("idle");
  const shapeSize = getVariableValue2(getShapeSize(
    context3.size,
    // @ts-expect-error
    {
      tokens: getTokens3()
    }
  )?.width);
  const resolvedSrc = src || (source && typeof source === "object" && "uri" in source ? source.uri : source);
  React36.useEffect(() => {
    if (!resolvedSrc) {
      setStatus("error");
    } else {
      setStatus("idle");
    }
  }, [resolvedSrc]);
  React36.useEffect(() => {
    onLoadingStatusChange(status);
    context3.onImageLoadingStatusChange(status);
  }, [status]);
  if (!resolvedSrc) {
    return null;
  }
  return /* @__PURE__ */ jsx22(YStack, {
    fullscreen: true,
    zIndex: 1,
    children: /* @__PURE__ */ jsx22(Image, {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      objectFit: "cover",
      ...typeof shapeSize === "number" && !Number.isNaN(shapeSize) && {
        width: shapeSize,
        height: shapeSize
      },
      ...imageProps,
      ref: forwardedRef,
      src: resolvedSrc,
      onError: /* @__PURE__ */ __name(() => {
        setStatus("error");
      }, "onError"),
      onLoad: /* @__PURE__ */ __name(() => {
        setStatus("loaded");
      }, "onLoad")
    })
  });
});
AvatarImage.displayName = IMAGE_NAME;
var FALLBACK_NAME = "AvatarFallback";
var AvatarFallbackFrame = styled12(YStack, {
  name: FALLBACK_NAME,
  position: "absolute",
  fullscreen: true,
  zIndex: 0
});
var AvatarFallback = AvatarFallbackFrame.styleable((props, forwardedRef) => {
  const {
    __scopeAvatar,
    delayMs,
    ...fallbackProps
  } = props;
  const context3 = useAvatarContext(FALLBACK_NAME, __scopeAvatar);
  const [canRender, setCanRender] = React36.useState(delayMs === void 0);
  React36.useEffect(() => {
    if (delayMs !== void 0) {
      const timerId = setTimeout(() => setCanRender(true), delayMs);
      return () => clearTimeout(timerId);
    }
  }, [delayMs]);
  return canRender && context3.imageLoadingStatus !== "loaded" ? /* @__PURE__ */ jsx22(AvatarFallbackFrame, {
    ...fallbackProps,
    ref: forwardedRef
  }) : null;
});
AvatarFallback.displayName = FALLBACK_NAME;
var AvatarFrame = styled12(Square, {
  name: AVATAR_NAME,
  position: "relative",
  overflow: "hidden"
});
var Avatar = withStaticProperties(React36.forwardRef((props, forwardedRef) => {
  const {
    __scopeAvatar,
    size: size4 = "$true",
    ...avatarProps
  } = props;
  const [imageLoadingStatus, setImageLoadingStatus] = React36.useState("idle");
  return /* @__PURE__ */ jsx22(AvatarProvider, {
    size: size4,
    scope: __scopeAvatar,
    imageLoadingStatus,
    onImageLoadingStatusChange: setImageLoadingStatus,
    children: /* @__PURE__ */ jsx22(AvatarFrame, {
      size: size4,
      ...avatarProps,
      ref: forwardedRef
    })
  });
}), {
  Image: AvatarImage,
  Fallback: AvatarFallback
});
Avatar.displayName = AVATAR_NAME;

// node_modules/.pnpm/@hanzogui+font-size@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83._9361a866acfd31fd74c8a64e1bceb196/node_modules/@hanzogui/font-size/dist/esm/getFontSize.mjs
import { getConfig, isVariable as isVariable3 } from "@hanzogui/core";
var getFontSize = /* @__PURE__ */ __name((inSize, opts) => {
  const res = getFontSizeVariable(inSize, opts);
  if (isVariable3(res)) {
    return +res.val;
  }
  return res ? +res : 16;
}, "getFontSize");
var getFontSizeVariable = /* @__PURE__ */ __name((inSize, opts) => {
  const token = getFontSizeToken(inSize, opts);
  if (!token) {
    return inSize;
  }
  const conf = getConfig();
  const font = conf.fontsParsed[opts?.font || conf.defaultFontToken];
  return font?.size[token];
}, "getFontSizeVariable");
var getFontSizeToken = /* @__PURE__ */ __name((inSize, opts) => {
  if (typeof inSize === "number") {
    return null;
  }
  const relativeSize = opts?.relativeSize || 0;
  const conf = getConfig();
  const font = conf.fontsParsed[opts?.font || conf.defaultFontToken];
  const fontSize = font?.size || // fallback to size tokens
  conf.tokensParsed.size;
  const size4 = (inSize === "$true" && !("$true" in fontSize) ? "$4" : inSize) ?? ("$true" in fontSize ? "$true" : "$4");
  const sizeTokens = Object.keys(fontSize);
  let foundIndex = sizeTokens.indexOf(size4);
  if (foundIndex === -1) {
    if (size4.endsWith(".5")) {
      foundIndex = sizeTokens.indexOf(size4.replace(".5", ""));
    }
  }
  if (process.env.NODE_ENV === "development") {
    if (foundIndex === -1) {
      console.warn("No font size found", size4, opts, "in size tokens", sizeTokens);
    }
  }
  const tokenIndex = Math.min(Math.max(0, foundIndex + relativeSize), sizeTokens.length - 1);
  return sizeTokens[tokenIndex] ?? size4;
}, "getFontSizeToken");

// node_modules/.pnpm/@hanzogui+component-helpers@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_9cfd090107b5ad855a9f490c7b10c58c/node_modules/@hanzogui/component-helpers/dist/esm/useCurrentColor.mjs
import { getVariable, useTheme } from "@hanzogui/web";
var useCurrentColor = /* @__PURE__ */ __name((colorProp) => {
  const theme = useTheme();
  const out = colorProp ? getVariable(colorProp) : theme[colorProp]?.get() || theme.color?.get();
  return out;
}, "useCurrentColor");

// node_modules/.pnpm/@hanzogui+component-helpers@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_9cfd090107b5ad855a9f490c7b10c58c/node_modules/@hanzogui/component-helpers/dist/esm/useGetThemedIcon.mjs
import React37 from "react";
var useGetThemedIcon = /* @__PURE__ */ __name((props) => {
  const color = useCurrentColor(props.color);
  return (el) => {
    if (!el) return el;
    if (React37.isValidElement(el)) {
      return React37.cloneElement(el, {
        ...props,
        color,
        // @ts-expect-error
        ...el.props
      });
    }
    return React37.createElement(el, props);
  };
}, "useGetThemedIcon");

// node_modules/.pnpm/@hanzogui+component-helpers@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_9cfd090107b5ad855a9f490c7b10c58c/node_modules/@hanzogui/component-helpers/dist/esm/getIcon.mjs
import React38 from "react";
var getIcon = /* @__PURE__ */ __name((el, props) => {
  if (!el) return el;
  if (React38.isValidElement(el)) {
    return React38.cloneElement(el, {
      ...props,
      // @ts-expect-error
      ...el.props
    });
  }
  return React38.createElement(el, props);
}, "getIcon");

// node_modules/.pnpm/@hanzogui+button@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_489c5dfb485d99aed2ce92090fe70317/node_modules/@hanzogui/button/dist/esm/Button.mjs
import { createStyledContext as createStyledContext5, getTokenValue as getTokenValue2, styled as styled13, useProps, View as View7, withStaticProperties as withStaticProperties2 } from "@hanzogui/web";
import { useContext as useContext13 } from "react";
import { jsx as jsx23, jsxs as jsxs3 } from "react/jsx-runtime";
var context = createStyledContext5({
  size: void 0,
  variant: void 0,
  color: void 0,
  elevation: void 0
});
var Frame = styled13(View7, {
  context,
  name: "Button",
  role: "button",
  render: /* @__PURE__ */ jsx23("button", {
    type: "button"
  }),
  tabIndex: 0,
  variants: {
    unstyled: {
      false: {
        size: "$true",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "nowrap",
        flexDirection: "row",
        cursor: "pointer",
        backgroundColor: "$background",
        borderWidth: 1,
        borderColor: "transparent",
        hoverStyle: {
          backgroundColor: "$backgroundHover",
          borderColor: "$borderColorHover"
        },
        pressStyle: {
          backgroundColor: "$backgroundPress",
          borderColor: "$borderColorHover"
        },
        focusVisibleStyle: {
          outlineColor: "$outlineColor",
          outlineStyle: "solid",
          outlineWidth: 2
        }
      }
    },
    variant: {
      outlined: process.env.GUI_HEADLESS === "1" ? {} : {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$borderColor",
        hoverStyle: {
          backgroundColor: "transparent",
          borderColor: "$borderColorHover"
        },
        pressStyle: {
          backgroundColor: "transparent",
          borderColor: "$borderColorPress"
        }
      }
    },
    circular: themeableVariants.circular,
    chromeless: themeableVariants.chromeless,
    size: {
      "...size": /* @__PURE__ */ __name((val, extras) => {
        const buttonStyle = getButtonSized(val, extras);
        const gap = getTokenValue2(val);
        return {
          ...buttonStyle,
          gap
        };
      }, "...size"),
      ":number": /* @__PURE__ */ __name((val, extras) => {
        const buttonStyle = getButtonSized(val, extras);
        const gap = val * 0.4;
        return {
          ...buttonStyle,
          gap
        };
      }, ":number")
    },
    elevation: {
      "...size": getElevation,
      ":number": getElevation
    },
    disabled: {
      true: {
        pointerEvents: "none",
        // @ts-ignore
        "aria-disabled": true
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var Text3 = styled13(SizableText2, {
  context,
  variants: {
    unstyled: {
      false: {
        userSelect: "none",
        cursor: "pointer",
        // flexGrow 1 leads to inconsistent native style where text pushes to start of view
        flexGrow: 0,
        flexShrink: 1,
        ellipsis: true,
        color: "$color"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var Icon = /* @__PURE__ */ __name((props) => {
  const {
    children,
    scaleIcon = 1,
    size: size4
  } = props;
  const styledContext = context.useStyledContext();
  if (!styledContext) {
    throw new Error("Button.Icon must be used within a Button");
  }
  const sizeToken = size4 ?? styledContext.size;
  const iconColor = useCurrentColor(styledContext.color);
  const iconSize = (typeof sizeToken === "number" ? sizeToken * 0.5 : getFontSize(sizeToken)) * scaleIcon;
  return getIcon(children, {
    size: iconSize,
    color: iconColor
  });
}, "Icon");
var ButtonContext = createStyledContext5({
  size: void 0,
  variant: void 0,
  color: void 0
});
var ButtonComponent = Frame.styleable((propsIn, ref) => {
  const isNested = useContext13(ButtonNestingContext);
  const processedProps = useProps(propsIn, {
    noNormalize: true,
    noExpand: true
  });
  const {
    children,
    iconSize,
    icon,
    iconAfter,
    scaleIcon = 1,
    ...props
  } = processedProps;
  const size4 = propsIn.size || (propsIn.unstyled ? void 0 : "$true");
  const styledContext = context.useStyledContext();
  const iconColor = useCurrentColor(styledContext?.color);
  const finalSize = iconSize ?? size4 ?? styledContext?.size;
  const iconSizeNumber = (typeof finalSize === "number" ? finalSize * 0.5 : getFontSize(finalSize)) * scaleIcon;
  const [themedIcon, themedIconAfter] = [icon, iconAfter].map((icon2) => {
    if (!icon2) return null;
    return getIcon(icon2, {
      size: iconSizeNumber,
      color: iconColor
      // No marginLeft or marginRight needed - spacing is handled by the gap property in Frame's size variants
    });
  });
  const wrappedChildren = wrapChildrenInText(Text3, {
    children
  }, {
    unstyled: process.env.GUI_HEADLESS === "1",
    size: finalSize ?? styledContext?.size
  });
  return /* @__PURE__ */ jsx23(ButtonNestingContext.Provider, {
    value: true,
    children: /* @__PURE__ */ jsxs3(Frame, {
      ref,
      ...props,
      ...isNested && {
        render: "span"
      },
      ...props.circular && !propsIn.size && {
        size: size4
      },
      tabIndex: 0,
      children: [themedIcon, wrappedChildren, themedIconAfter]
    })
  });
});
var Button = withStaticProperties2(ButtonComponent, {
  Apply: context.Provider,
  Frame,
  Text: Text3,
  Icon
});

// node_modules/.pnpm/@hanzogui+checkbox@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_875697b9df1ecae857f0e7f2ddc6cde9/node_modules/@hanzogui/checkbox/dist/esm/Checkbox.mjs
import { getVariableValue as getVariableValue3, styled as styled14 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+checkbox@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_875697b9df1ecae857f0e7f2ddc6cde9/node_modules/@hanzogui/checkbox/dist/esm/CheckboxStyledContext.mjs
import { createStyledContext as createStyledContext6 } from "@hanzogui/core";
var CheckboxStyledContext = createStyledContext6({
  size: "$true",
  scaleIcon: 1,
  unstyled: process.env.GUI_HEADLESS === "1",
  active: false,
  disabled: false
});

// node_modules/.pnpm/@hanzogui+checkbox@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_875697b9df1ecae857f0e7f2ddc6cde9/node_modules/@hanzogui/checkbox/dist/esm/Checkbox.mjs
var INDICATOR_NAME = "CheckboxIndicator";
var CheckboxIndicatorFrame = styled14(YStack, {
  // use Checkbox for easier themes
  name: INDICATOR_NAME,
  context: CheckboxStyledContext,
  variants: {
    unstyled: {
      false: {}
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
}, {
  accept: {
    activeStyle: "style"
  }
});
var CHECKBOX_NAME = "Checkbox";
var CheckboxFrame = styled14(YStack, {
  name: CHECKBOX_NAME,
  render: "button",
  context: CheckboxStyledContext,
  variants: {
    unstyled: {
      false: {
        size: "$true",
        backgroundColor: "$background",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "$borderColor",
        hoverStyle: {
          borderColor: "$borderColorHover"
        },
        pressStyle: {
          backgroundColor: "$backgroundPress",
          borderColor: "$borderColorPress"
        },
        focusStyle: {
          borderColor: "$borderColorFocus"
        },
        focusVisibleStyle: {
          outlineStyle: "solid",
          outlineWidth: 2,
          outlineColor: "$outlineColor"
        }
      }
    },
    disabled: {
      true: {
        pointerEvents: "none",
        userSelect: "none",
        cursor: "not-allowed",
        hoverStyle: {
          borderColor: "$borderColor",
          backgroundColor: "$background"
        },
        pressStyle: {
          borderColor: "$borderColor",
          backgroundColor: "$background"
        },
        focusStyle: {
          outlineWidth: 0
        }
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val) => {
        const radiusToken = getVariableValue3(getSize(val)) / 8;
        return {
          borderRadius: radiusToken
        };
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
}, {
  accept: {
    activeStyle: "style"
  }
});

// node_modules/.pnpm/@hanzogui+focusable@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83._3030cd94716169cc42d53a3010362b3e/node_modules/@hanzogui/focusable/dist/esm/registerFocusable.mjs
var registerFocusable = /* @__PURE__ */ __name((id, input) => () => {
}, "registerFocusable");
var focusFocusable = /* @__PURE__ */ __name((id) => {
}, "focusFocusable");

// node_modules/.pnpm/@hanzogui+label@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_15c9ff6c27b510a4d971c948c4396fa3/node_modules/@hanzogui/label/dist/esm/Label.mjs
import { styled as styled15 } from "@hanzogui/web";
import * as React39 from "react";
import { jsx as jsx24 } from "react/jsx-runtime";
var NAME = "Label";
var [LabelProvider, useLabelContextImpl] = createContext8(NAME, {
  id: void 0,
  controlRef: {
    current: null
  }
});
var LabelFrame = styled15(SizableText2, {
  name: "Label",
  render: "label",
  variants: {
    unstyled: {
      false: {
        size: "$true",
        color: "$color",
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        userSelect: "none",
        cursor: "default",
        pressStyle: {
          color: "$colorPress"
        }
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, extras) => {
        const buttonStyle = getButtonSized(val, extras);
        const buttonHeight = buttonStyle?.height;
        const fontStyle = getFontSized(val, extras);
        return {
          ...fontStyle,
          lineHeight: buttonHeight ? extras.tokens.size[buttonHeight] : void 0
        };
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var Label = LabelFrame.styleable(/* @__PURE__ */ __name(function Label2(props, forwardedRef) {
  const {
    htmlFor,
    id: idProp,
    ...labelProps
  } = props;
  const controlRef = React39.useRef(null);
  const ref = React39.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const backupId = React39.useId();
  const id = idProp ?? backupId;
  if (isWeb) {
    React39.useEffect(() => {
      if (htmlFor) {
        const element = document.getElementById(htmlFor);
        const label = ref.current;
        if (label && element) {
          const getAriaLabel = /* @__PURE__ */ __name(() => element.getAttribute("aria-labelledby"), "getAriaLabel");
          const ariaLabelledBy = [id, getAriaLabel()].filter(Boolean).join(" ");
          element.setAttribute("aria-labelledby", ariaLabelledBy);
          controlRef.current = element;
          return () => {
            if (!id) return;
            const ariaLabelledBy2 = getAriaLabel()?.replace(id, "");
            if (ariaLabelledBy2 === "") {
              element.removeAttribute("aria-labelledby");
            } else if (ariaLabelledBy2) {
              element.setAttribute("aria-labelledby", ariaLabelledBy2);
            }
          };
        }
      }
    }, [id, htmlFor]);
  }
  return /* @__PURE__ */ jsx24(LabelProvider, {
    id,
    controlRef,
    children: /* @__PURE__ */ jsx24(LabelFrame, {
      id,
      htmlFor,
      ...labelProps,
      ref: composedRefs,
      onMouseDown: /* @__PURE__ */ __name((event) => {
        props.onMouseDown?.(event);
        if (!event.defaultPrevented && event.detail > 1) {
          event.preventDefault();
        }
      }, "onMouseDown"),
      onPress: /* @__PURE__ */ __name((event) => {
        props.onPress?.(event);
        if (isWeb) {
          if (htmlFor || !controlRef.current || event.defaultPrevented) return;
          const isClickingControl = controlRef.current.contains(event.target);
          const isUserClick = event.isTrusted === true;
          if (!isClickingControl && isUserClick) {
            controlRef.current.click();
            controlRef.current.focus();
          }
        } else {
          if (props.htmlFor) {
            focusFocusable(props.htmlFor);
          }
        }
      }, "onPress")
    })
  });
}, "Label2"));
var useLabelContext = /* @__PURE__ */ __name((element) => {
  const context3 = useLabelContextImpl("LabelConsumer");
  const {
    controlRef
  } = context3;
  React39.useEffect(() => {
    if (element) controlRef.current = element;
  }, [element, controlRef]);
  return context3.id;
}, "useLabelContext");

// node_modules/.pnpm/@hanzogui+checkbox-headless@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_bc61d35d2968756e8a87669491e714f1/node_modules/@hanzogui/checkbox-headless/dist/esm/useCheckbox.mjs
import React42, { useMemo as useMemo12 } from "react";

// node_modules/.pnpm/@hanzogui+use-previous@7.3.0_react@19.2.4/node_modules/@hanzogui/use-previous/dist/esm/index.mjs
import * as React40 from "react";
function usePrevious(value) {
  const ref = React40.useRef({
    value,
    previous: value
  });
  return React40.useMemo(() => {
    if (ref.current.value !== value) {
      ref.current.previous = ref.current.value;
      ref.current.value = value;
    }
    return ref.current.previous;
  }, [value]);
}
__name(usePrevious, "usePrevious");

// node_modules/.pnpm/@hanzogui+checkbox-headless@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_bc61d35d2968756e8a87669491e714f1/node_modules/@hanzogui/checkbox-headless/dist/esm/BubbleInput.mjs
import * as React41 from "react";

// node_modules/.pnpm/@hanzogui+checkbox-headless@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_bc61d35d2968756e8a87669491e714f1/node_modules/@hanzogui/checkbox-headless/dist/esm/utils.mjs
function isIndeterminate(checked) {
  return checked === "indeterminate";
}
__name(isIndeterminate, "isIndeterminate");
function getState3(checked) {
  return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
__name(getState3, "getState");

// node_modules/.pnpm/@hanzogui+checkbox-headless@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_bc61d35d2968756e8a87669491e714f1/node_modules/@hanzogui/checkbox-headless/dist/esm/BubbleInput.mjs
import { jsx as jsx25 } from "react/jsx-runtime";
var BubbleInput = /* @__PURE__ */ __name((props) => {
  const {
    checked,
    bubbles = true,
    control,
    isHidden: isHidden2,
    ...inputProps
  } = props;
  const ref = React41.useRef(null);
  const prevChecked = usePrevious(checked);
  React41.useEffect(() => {
    const input = ref.current;
    const inputProto = window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(inputProto, "checked");
    const setChecked = descriptor.set;
    if (prevChecked !== checked && setChecked) {
      const event = new Event("click", {
        bubbles
      });
      input.indeterminate = isIndeterminate(checked);
      setChecked.call(input, isIndeterminate(checked) ? false : checked);
      input.dispatchEvent(event);
    }
  }, [prevChecked, checked, bubbles]);
  return /* @__PURE__ */ jsx25("input", {
    type: "checkbox",
    defaultChecked: isIndeterminate(checked) ? false : checked,
    ...inputProps,
    tabIndex: -1,
    ref,
    "aria-hidden": isHidden2,
    style: {
      ...isHidden2 ? {
        // ...controlSize,
        position: "absolute",
        pointerEvents: "none",
        opacity: 0,
        margin: 0
      } : {
        appearance: "auto",
        accentColor: "var(--color6)"
      },
      ...props.style
    }
  });
}, "BubbleInput");

// node_modules/.pnpm/@hanzogui+checkbox-headless@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-nati_bc61d35d2968756e8a87669491e714f1/node_modules/@hanzogui/checkbox-headless/dist/esm/useCheckbox.mjs
import { jsx as jsx26 } from "react/jsx-runtime";
function useCheckbox(props, [checked, setChecked], ref) {
  const {
    labelledBy: ariaLabelledby,
    name,
    required,
    disabled,
    value = "on",
    onCheckedChange,
    ...checkboxProps
  } = props;
  const [button, setButton] = React42.useState(null);
  const composedRefs = useComposedRefs(ref, setButton);
  const hasConsumerStoppedPropagationRef = React42.useRef(false);
  const isFormControl = isWeb ? button ? Boolean(button.closest("form")) : true : false;
  const labelId = useLabelContext(button);
  const labelledBy = ariaLabelledby || labelId;
  const parentKeyDown = props.onKeyDown;
  const handleKeyDown = useMemo12(() => composeEventHandlers(parentKeyDown, (event) => {
    if (event.key === "Enter") event.preventDefault();
  }), [parentKeyDown]);
  const handlePress = useMemo12(() => composeEventHandlers(props.onPress, (event) => {
    setChecked((prevChecked) => isIndeterminate(prevChecked) ? true : !prevChecked);
    if (isFormControl && "isPropagationStopped" in event) {
      hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
      if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
    }
  }), [isFormControl]);
  return {
    bubbleInput: isWeb && isFormControl ? /* @__PURE__ */ jsx26(BubbleInput, {
      isHidden: true,
      control: button,
      bubbles: !hasConsumerStoppedPropagationRef.current,
      name,
      value,
      checked,
      required,
      disabled
    }) : null,
    checkboxRef: composedRefs,
    checkboxProps: {
      role: "checkbox",
      "aria-labelledby": labelledBy,
      "aria-checked": isIndeterminate(checked) ? "mixed" : checked,
      ...checkboxProps,
      ...isWeb && {
        type: "button",
        value,
        "data-state": getState3(checked),
        "data-disabled": disabled ? "" : void 0,
        disabled,
        onKeyDown: disabled ? void 0 : handleKeyDown
      },
      onPress: disabled ? void 0 : handlePress
    }
  };
}
__name(useCheckbox, "useCheckbox");

// node_modules/.pnpm/@hanzogui+checkbox@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_875697b9df1ecae857f0e7f2ddc6cde9/node_modules/@hanzogui/checkbox/dist/esm/createCheckbox.mjs
import { getVariableValue as getVariableValue4, isWeb as isWeb2, shouldRenderNativePlatform, useProps as useProps2, useTheme as useTheme2, withStaticProperties as withStaticProperties3 } from "@hanzogui/core";
import React43, { useMemo as useMemo13 } from "react";
import { jsx as jsx27, jsxs as jsxs4 } from "react/jsx-runtime";
var CheckboxContext = React43.createContext({
  checked: false,
  disabled: false
});
var ensureContext = /* @__PURE__ */ __name((x) => {
  if (!x.context) x.context = CheckboxContext;
}, "ensureContext");
function createCheckbox(createProps) {
  const {
    Frame: Frame3 = CheckboxFrame,
    Indicator: Indicator2 = CheckboxIndicatorFrame
  } = createProps;
  ensureContext(Frame3);
  ensureContext(Indicator2);
  return withStaticProperties3(Frame3.styleable(/* @__PURE__ */ __name(function Checkbox3(_props, forwardedRef) {
    const {
      scaleSize = 0.45,
      sizeAdjust = 0,
      scaleIcon,
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      native,
      unstyled = false,
      activeStyle,
      activeTheme,
      ...props
    } = _props;
    const propsActive = useProps2(props);
    const styledContext = React43.useContext(CheckboxStyledContext.context);
    let adjustedSize = 0;
    let size4 = 0;
    if (!unstyled) {
      adjustedSize = getVariableValue4(getSize(propsActive.size ?? styledContext?.size ?? "$true", {
        shift: sizeAdjust
      }));
      size4 = scaleSize ? Math.round(adjustedSize * scaleSize) : adjustedSize;
    }
    const [checked = false, setChecked] = useControllableState({
      prop: checkedProp,
      defaultProp: defaultChecked,
      onChange: onCheckedChange
    });
    const {
      checkboxProps,
      checkboxRef,
      bubbleInput
    } = useCheckbox(
      // @ts-ignore
      propsActive,
      [checked, setChecked],
      forwardedRef
    );
    if (shouldRenderNativePlatform(native) === "web") return /* @__PURE__ */ jsx27("input", {
      type: "checkbox",
      defaultChecked: isIndeterminate(checked) ? false : checked,
      tabIndex: -1,
      ref: checkboxRef,
      disabled: checkboxProps.disabled,
      style: {
        appearance: "auto",
        accentColor: "var(--color6)",
        ...checkboxProps.style
      }
    });
    const memoizedContext = useMemo13(() => ({
      checked,
      disabled: checkboxProps.disabled
    }), [checked, checkboxProps.disabled]);
    const isActive = !!checked;
    const disabled = checkboxProps.disabled;
    return /* @__PURE__ */ jsx27(CheckboxContext.Provider, {
      value: memoizedContext,
      children: /* @__PURE__ */ jsxs4(CheckboxStyledContext.Provider, {
        size: propsActive.size ?? styledContext?.size ?? "$true",
        scaleIcon: scaleIcon ?? styledContext?.scaleIcon ?? 1,
        unstyled,
        active: isActive,
        disabled,
        children: [/* @__PURE__ */ jsx27(Frame3, {
          render: "button",
          ref: checkboxRef,
          unstyled,
          theme: activeTheme ?? null,
          ...isWeb2 && {
            type: "button"
          },
          ...!unstyled && {
            width: size4,
            height: size4,
            size: size4
          },
          checked,
          disabled,
          ...checkboxProps,
          ...props,
          ...isActive && {
            ...!unstyled && !activeStyle && {
              backgroundColor: "$backgroundActive"
            },
            ...activeStyle
          },
          children: propsActive.children
        }), bubbleInput]
      })
    });
  }, "Checkbox")), {
    Indicator: Indicator2.styleable((props, forwardedRef) => {
      const {
        children: childrenProp,
        forceMount,
        disablePassStyles,
        unstyled = false,
        activeStyle,
        ...indicatorProps
      } = props;
      const styledContext = CheckboxStyledContext.useStyledContext();
      const {
        active
      } = styledContext;
      let children = childrenProp;
      if (!unstyled) {
        const getThemedIcon = useGetThemedIcon({
          size: (typeof styledContext.size === "number" ? styledContext.size * 0.65 : getFontSize(styledContext.size)) * styledContext.scaleIcon,
          color: useTheme2().color
        });
        children = React43.Children.toArray(childrenProp).map((child) => {
          if (disablePassStyles || !React43.isValidElement(child)) return child;
          return getThemedIcon(child);
        });
      }
      const context3 = React43.useContext(CheckboxContext);
      if (forceMount || isIndeterminate(context3.checked) || context3.checked === true) return /* @__PURE__ */ jsx27(Indicator2, {
        pointerEvents: "none",
        ...indicatorProps,
        ...active && activeStyle,
        ref: forwardedRef,
        children
      });
      return null;
    })
  });
}
__name(createCheckbox, "createCheckbox");

// node_modules/.pnpm/@hanzogui+checkbox@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_875697b9df1ecae857f0e7f2ddc6cde9/node_modules/@hanzogui/checkbox/dist/esm/index.mjs
var Checkbox = createCheckbox({
  Frame: CheckboxFrame,
  Indicator: CheckboxIndicatorFrame
});

// node_modules/.pnpm/@hanzogui+group@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_824ab36d8f88819aaf8482092102d650/node_modules/@hanzogui/group/dist/esm/Group.mjs
import { mergeSlotStyleProps, styled as styled16 } from "@hanzogui/core";
import React45 from "react";

// node_modules/.pnpm/@hanzogui+group@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_824ab36d8f88819aaf8482092102d650/node_modules/@hanzogui/group/dist/esm/useIndexedChildren.mjs
import * as React44 from "react";
import { jsx as jsx28 } from "react/jsx-runtime";
var MaxIndexContext = React44.createContext([]);
var IndexContext = React44.createContext(null);
function useIndex() {
  const maxIndexPath = React44.useContext(MaxIndexContext);
  const indexPathString = React44.useContext(IndexContext);
  return React44.useMemo(() => {
    if (indexPathString === null) {
      return null;
    }
    const indexPath = parseIndexPath(indexPathString);
    const maxIndex = maxIndexPath[maxIndexPath.length - 1];
    const index2 = indexPath[indexPath.length - 1];
    return {
      maxIndex,
      maxIndexPath,
      index: index2,
      indexPath,
      indexPathString,
      isFirst: index2 === 0,
      isLast: index2 === maxIndex,
      isEven: index2 % 2 === 0,
      isOdd: Math.abs(index2 % 2) === 1
    };
  }, [maxIndexPath, indexPathString]);
}
__name(useIndex, "useIndex");
function useIndexedChildren(children) {
  const parentMaxIndexPath = React44.useContext(MaxIndexContext);
  const indexPathString = React44.useContext(IndexContext);
  const childrenCount = React44.Children.count(children);
  const maxIndexPath = React44.useMemo(() => parentMaxIndexPath.concat(childrenCount - 1), [childrenCount]);
  return /* @__PURE__ */ jsx28(MaxIndexContext.Provider, {
    value: maxIndexPath,
    children: React44.Children.map(children, (child, index2) => React44.isValidElement(child) ? /* @__PURE__ */ jsx28(IndexContext.Provider, {
      value: indexPathString ? `${indexPathString}.${index2.toString()}` : index2.toString(),
      children: child
    }, child.key) : child)
  });
}
__name(useIndexedChildren, "useIndexedChildren");
function parseIndexPath(indexPathString) {
  return indexPathString.split(".").map((index2) => Number.parseInt(index2, 10));
}
__name(parseIndexPath, "parseIndexPath");

// node_modules/.pnpm/@hanzogui+group@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_824ab36d8f88819aaf8482092102d650/node_modules/@hanzogui/group/dist/esm/Group.mjs
import { jsx as jsx29 } from "react/jsx-runtime";
var GROUP_NAME = "Group";
var [createGroupContext, createGroupScope] = createContextScope(GROUP_NAME);
var [GroupProvider, useGroupContext] = createGroupContext(GROUP_NAME);
var GroupFrame = styled16(YStack, {
  name: "GroupFrame",
  variants: {
    unstyled: {
      false: {
        size: "$true"
      }
    },
    size: /* @__PURE__ */ __name((val, {
      tokens
    }) => {
      const borderRadius = tokens.radius[val] ?? val ?? tokens.radius["$true"];
      return {
        borderRadius
      };
    }, "size")
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
function createGroup(verticalDefault) {
  return withStaticProperties(GroupFrame.styleable((props, ref) => {
    const {
      __scopeGroup,
      children: childrenProp,
      orientation = verticalDefault ? "vertical" : "horizontal",
      disabled,
      ...restProps
    } = props;
    const vertical = orientation === "vertical";
    const indexedChildren = useIndexedChildren(React45.Children.toArray(childrenProp));
    return /* @__PURE__ */ jsx29(GroupProvider, {
      vertical,
      disabled,
      scope: __scopeGroup,
      children: /* @__PURE__ */ jsx29(GroupFrame, {
        ref,
        flexDirection: vertical ? "column" : "row",
        ...restProps,
        children: indexedChildren
      })
    });
  }), {
    Item: GroupItem
  });
}
__name(createGroup, "createGroup");
function GroupItem(props) {
  const {
    __scopeGroup,
    children,
    forcePlacement,
    ...forwardedProps
  } = props;
  const context3 = useGroupContext("GroupItem", __scopeGroup);
  const treeIndex = useIndex();
  if (!treeIndex) {
    throw Error("<Group.Item/> should only be used within a <Group/>");
  }
  if (!React45.isValidElement(children)) {
    return children;
  }
  const isFirst = forcePlacement === "first" || forcePlacement !== "last" && treeIndex.index === 0;
  const isLast = forcePlacement === "last" || forcePlacement !== "first" && treeIndex.index === treeIndex.maxIndex;
  const radiusStyles = getZeroedRadius(isFirst, isLast, context3.vertical);
  const groupProps = {
    ...forwardedProps,
    ...radiusStyles
  };
  if (context3.disabled != null) {
    groupProps.disabled = children.props.disabled ?? context3.disabled;
  }
  const mergedProps = mergeSlotStyleProps(groupProps, children.props);
  return React45.cloneElement(children, mergedProps);
}
__name(GroupItem, "GroupItem");
var useGroupItem = /* @__PURE__ */ __name((childrenProps, forcePlacement, __scopeGroup) => {
  const treeIndex = useIndex();
  const context3 = useGroupContext("GroupItem", __scopeGroup);
  if (!treeIndex) {
    throw Error("useGroupItem should only be used within a <Group/>");
  }
  const isFirst = forcePlacement === "first" || forcePlacement !== "last" && treeIndex.index === 0;
  const isLast = forcePlacement === "last" || forcePlacement !== "first" && treeIndex.index === treeIndex.maxIndex;
  const radiusStyles = getZeroedRadius(isFirst, isLast, context3.vertical);
  return {
    disabled: childrenProps.disabled ?? context3.disabled,
    ...radiusStyles
  };
}, "useGroupItem");
var Group = createGroup(true);
var XGroup = createGroup(false);
function getZeroedRadius(isFirst, isLast, vertical) {
  if (vertical) {
    return {
      ...isFirst ? null : {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0
      },
      ...isLast ? null : {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0
      }
    };
  }
  return {
    ...isFirst ? null : {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
    },
    ...isLast ? null : {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    }
  };
}
__name(getZeroedRadius, "getZeroedRadius");

// node_modules/.pnpm/@hanzogui+list-item@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83._ab6542a97549198f6c1c2a729f59530b/node_modules/@hanzogui/list-item/dist/esm/ListItem.mjs
import { createStyledContext as createStyledContext7, styled as styled17, View as View8 } from "@hanzogui/web";
import { Fragment as Fragment8, jsx as jsx30, jsxs as jsxs5 } from "react/jsx-runtime";
var NAME2 = "ListItem";
var context2 = createStyledContext7({
  size: void 0,
  variant: void 0,
  color: void 0
});
var ListItemFrame = styled17(View8, {
  context: context2,
  name: NAME2,
  render: "li",
  role: "listitem",
  variants: {
    unstyled: {
      false: {
        size: "$true",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "nowrap",
        borderColor: "$borderColor",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        flexDirection: "row",
        backgroundColor: "$background",
        cursor: "default",
        hoverStyle: {
          backgroundColor: "$backgroundHover",
          borderColor: "$borderColorHover"
        },
        pressStyle: {
          backgroundColor: "$backgroundPress",
          borderColor: "$borderColorPress"
        }
      }
    },
    variant: {
      outlined: process.env.GUI_HEADLESS === "1" ? {} : {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$borderColor",
        hoverStyle: {
          backgroundColor: "transparent",
          borderColor: "$borderColorHover"
        },
        pressStyle: {
          backgroundColor: "transparent",
          borderColor: "$borderColorPress"
        }
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, {
        tokens
      }) => {
        return {
          minHeight: tokens.size[val],
          paddingHorizontal: tokens.space[val],
          paddingVertical: getSpace(tokens.space[val], {
            shift: -4
          })
        };
      }, "...size")
    },
    active: {
      true: {
        hoverStyle: {
          backgroundColor: "$background"
        }
      }
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ListItemText = styled17(SizableText2, {
  context: context2,
  name: "ListItemText",
  variants: {
    unstyled: {
      false: {
        color: "$color",
        size: "$true",
        flexGrow: 1,
        flexShrink: 1,
        ellipsis: true,
        cursor: "inherit"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ListItemSubtitle = styled17(ListItemText, {
  name: "ListItemSubtitle",
  context: context2,
  variants: {
    unstyled: {
      false: {
        opacity: 0.6,
        maxWidth: "100%",
        color: "$color"
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, extras) => {
        const oneSmaller = getSize(val, {
          shift: -1,
          excludeHalfSteps: true
        });
        const fontStyle = getFontSized(oneSmaller.key, extras);
        return fontStyle;
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ListItemTitle = styled17(ListItemText, {
  name: "ListItemTitle",
  context: context2,
  variants: {
    unstyled: {
      false: {}
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ListItemIcon = /* @__PURE__ */ __name((props) => {
  const {
    children,
    size: size4,
    scaleIcon = 1
  } = props;
  const styledContext = context2.useStyledContext();
  if (!styledContext) {
    throw new Error("ListItem.Icon must be used within a ListItem");
  }
  const sizeToken = size4 ?? styledContext.size ?? "$true";
  const iconColor = useCurrentColor(styledContext.color);
  const iconSize = getFontSize(sizeToken) * scaleIcon;
  return getIcon(children, {
    size: iconSize,
    color: iconColor
  });
}, "ListItemIcon");
var ListItemComponent = ListItemFrame.styleable(/* @__PURE__ */ __name(function ListItem(propsIn, ref) {
  const {
    children,
    icon,
    iconAfter,
    scaleIcon = 1,
    unstyled = false,
    subTitle,
    title,
    iconSize,
    ...rest
  } = propsIn;
  const size4 = propsIn.size || "$true";
  const styledContext = context2.useStyledContext();
  const iconColor = useCurrentColor(styledContext?.color);
  const iconSizeNumber = getFontSize(iconSize || size4) * scaleIcon;
  const [themedIcon, themedIconAfter] = [icon, iconAfter].map((icon2, i) => {
    if (!icon2) return null;
    const isBefore = i === 0;
    return getIcon(icon2, {
      size: iconSizeNumber,
      color: iconColor,
      style: {
        [isBefore ? "marginRight" : "marginLeft"]: `${iconSizeNumber * 0.4}%`
      }
    });
  });
  const wrappedChildren = wrapChildrenInText(ListItemText, {
    children
  }, propsIn.unstyled !== true ? {
    unstyled: process.env.GUI_HEADLESS === "1",
    fontSize: propsIn.size
  } : void 0);
  return /* @__PURE__ */ jsxs5(ListItemFrame, {
    ref,
    ...rest,
    children: [themedIcon, title || subTitle ? /* @__PURE__ */ jsxs5(YStack, {
      flex: 1,
      children: [title ? typeof title === "string" ? /* @__PURE__ */ jsx30(ListItemTitle, {
        unstyled,
        size: size4,
        children: title
      }) : title : null, subTitle ? /* @__PURE__ */ jsx30(Fragment8, {
        children: typeof subTitle === "string" ? /* @__PURE__ */ jsx30(ListItemSubtitle, {
          unstyled,
          size: size4,
          children: subTitle
        }) : subTitle
      }) : null, wrappedChildren]
    }) : wrappedChildren, themedIconAfter]
  });
}, "ListItem"));
var ListItem2 = withStaticProperties(ListItemComponent, {
  Apply: context2.Provider,
  Frame: ListItemFrame,
  Text: ListItemText,
  Subtitle: ListItemSubtitle,
  Icon: ListItemIcon,
  Title: ListItemTitle
});

// node_modules/.pnpm/@hanzogui+focus-guard@7.3.0_react@19.2.4/node_modules/@hanzogui/focus-guard/dist/esm/FocusGuard.mjs
import * as React46 from "react";
var count = 0;
function useFocusGuards() {
  React46.useEffect(() => {
    const edgeGuards = document.querySelectorAll("[data-gui-focus-guard]");
    document.body.insertAdjacentElement("afterbegin", edgeGuards[0] ?? createFocusGuard());
    document.body.insertAdjacentElement("beforeend", edgeGuards[1] ?? createFocusGuard());
    count++;
    return () => {
      if (count === 1) {
        document.querySelectorAll("[data-gui-focus-guard]").forEach((node) => node.remove());
      }
      count--;
    };
  }, []);
}
__name(useFocusGuards, "useFocusGuards");
function createFocusGuard() {
  const element = document.createElement("span");
  element.setAttribute("data-gui-focus-guard", "");
  element.tabIndex = 0;
  element.style.cssText = "outline: none; opacity: 0; position: fixed; pointer-events: none";
  return element;
}
__name(createFocusGuard, "createFocusGuard");

// node_modules/.pnpm/@hanzogui+popper@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_3275946b7e3ca0597e90d93965009829/node_modules/@hanzogui/popper/dist/esm/Popper.mjs
import { flushSync as flushSync5 } from "react-dom";
import { LayoutMeasurementController as LayoutMeasurementController2, View as GuiView, createStyledContext as createStyledContext8, getVariableValue as getVariableValue5, registerLayoutNode, styled as styled18 } from "@hanzogui/core";

// node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var min = Math.min;
var max = Math.max;
var round = Math.round;
var floor = Math.floor;
var createCoords = /* @__PURE__ */ __name((v) => ({
  x: v,
  y: v
}), "createCoords");
var oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function clamp2(start, value, end) {
  return max(start, min(value, end));
}
__name(clamp2, "clamp");
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
__name(evaluate, "evaluate");
function getSide(placement) {
  return placement.split("-")[0];
}
__name(getSide, "getSide");
function getAlignment(placement) {
  return placement.split("-")[1];
}
__name(getAlignment, "getAlignment");
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
__name(getOppositeAxis, "getOppositeAxis");
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
__name(getAxisLength, "getAxisLength");
function getSideAxis(placement) {
  const firstChar = placement[0];
  return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
__name(getSideAxis, "getSideAxis");
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
__name(getAlignmentAxis, "getAlignmentAxis");
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
__name(getAlignmentSides, "getAlignmentSides");
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
__name(getExpandedPlacements, "getExpandedPlacements");
function getOppositeAlignmentPlacement(placement) {
  return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
}
__name(getOppositeAlignmentPlacement, "getOppositeAlignmentPlacement");
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
  switch (side) {
    case "top":
    case "bottom":
      if (rtl) return isStart ? rlPlacement : lrPlacement;
      return isStart ? lrPlacement : rlPlacement;
    case "left":
    case "right":
      return isStart ? tbPlacement : btPlacement;
    default:
      return [];
  }
}
__name(getSideList, "getSideList");
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list = list.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
__name(getOppositeAxisPlacements, "getOppositeAxisPlacements");
function getOppositePlacement(placement) {
  const side = getSide(placement);
  return oppositeSideMap[side] + placement.slice(side.length);
}
__name(getOppositePlacement, "getOppositePlacement");
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
__name(expandPaddingObject, "expandPaddingObject");
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
__name(getPaddingObject, "getPaddingObject");
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}
__name(rectToClientRect, "rectToClientRect");

// node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
__name(computeCoordsFromPlacement, "computeCoordsFromPlacement");
async function detectOverflow(state4, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state4;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state4);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) ? await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
__name(detectOverflow, "detectOverflow");
var MAX_RESET_COUNT = 50;
var computePosition = /* @__PURE__ */ __name(async (reference, floating, config) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const platformWithDetectOverflow = platform2.detectOverflow ? platform2 : {
    ...platform2,
    detectOverflow
  };
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let resetCount = 0;
  const middlewareData = {};
  for (let i = 0; i < middleware.length; i++) {
    const currentMiddleware = middleware[i];
    if (!currentMiddleware) {
      continue;
    }
    const {
      name,
      fn
    } = currentMiddleware;
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platformWithDetectOverflow,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData[name] = {
      ...middlewareData[name],
      ...data
    };
    if (reset && resetCount < MAX_RESET_COUNT) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
}, "computePosition");
var arrow = /* @__PURE__ */ __name((options) => ({
  name: "arrow",
  options,
  async fn(state4) {
    const {
      x,
      y,
      placement,
      rects,
      platform: platform2,
      elements,
      middlewareData
    } = state4;
    const {
      element,
      padding = 0
    } = evaluate(options, state4) || {};
    if (element == null) {
      return {};
    }
    const paddingObject = getPaddingObject(padding);
    const coords = {
      x,
      y
    };
    const axis = getAlignmentAxis(placement);
    const length = getAxisLength(axis);
    const arrowDimensions = await platform2.getDimensions(element);
    const isYAxis = axis === "y";
    const minProp = isYAxis ? "top" : "left";
    const maxProp = isYAxis ? "bottom" : "right";
    const clientProp = isYAxis ? "clientHeight" : "clientWidth";
    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];
    const arrowOffsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(element));
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
    if (!clientSize || !await (platform2.isElement == null ? void 0 : platform2.isElement(arrowOffsetParent))) {
      clientSize = elements.floating[clientProp] || rects.floating[length];
    }
    const centerToReference = endDiff / 2 - startDiff / 2;
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
    const minPadding = min(paddingObject[minProp], largestPossiblePadding);
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);
    const min$1 = minPadding;
    const max2 = clientSize - arrowDimensions[length] - maxPadding;
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset4 = clamp2(min$1, center, max2);
    const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset4 && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
    const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max2 : 0;
    return {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset4,
        centerOffset: center - offset4 - alignmentOffset,
        ...shouldAddOffset && {
          alignmentOffset
        }
      },
      reset: shouldAddOffset
    };
  }
}), "arrow");
var flip = /* @__PURE__ */ __name(function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "flip",
    options,
    async fn(state4) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform: platform2,
        elements
      } = state4;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = "bestFit",
        fallbackAxisSideDirection = "none",
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state4);
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements2 = [initialPlacement, ...fallbackPlacements];
      const overflow = await platform2.detectOverflow(state4, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides2 = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];
      if (!overflows.every((side2) => side2 <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements2[nextIndex];
        if (nextPlacement) {
          const ignoreCrossAxisOverflow = checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false;
          if (!ignoreCrossAxisOverflow || // We leave the current main axis only if every placement on that axis
          // overflows the main axis.
          overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
        }
        let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$filter2;
              const placement2 = (_overflowsData$filter2 = overflowsData.filter((d) => {
                if (hasFallbackAxisSideDirection) {
                  const currentSideAxis = getSideAxis(d.placement);
                  return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  currentSideAxis === "y";
                }
                return true;
              }).map((d) => [d.placement, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
}, "flip");
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
async function convertValueToCoords(state4, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state4;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state4);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
__name(convertValueToCoords, "convertValueToCoords");
var offset = /* @__PURE__ */ __name(function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state4) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state4;
      const diffCoords = await convertValueToCoords(state4, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
}, "offset");
var shift = /* @__PURE__ */ __name(function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state4) {
      const {
        x,
        y,
        placement,
        platform: platform2
      } = state4;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: /* @__PURE__ */ __name((_ref) => {
            let {
              x: x2,
              y: y2
            } = _ref;
            return {
              x: x2,
              y: y2
            };
          }, "fn")
        },
        ...detectOverflowOptions
      } = evaluate(options, state4);
      const coords = {
        x,
        y
      };
      const overflow = await platform2.detectOverflow(state4, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === "y" ? "top" : "left";
        const maxSide = mainAxis === "y" ? "bottom" : "right";
        const min2 = mainAxisCoord + overflow[minSide];
        const max2 = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp2(min2, mainAxisCoord, max2);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === "y" ? "top" : "left";
        const maxSide = crossAxis === "y" ? "bottom" : "right";
        const min2 = crossAxisCoord + overflow[minSide];
        const max2 = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp2(min2, crossAxisCoord, max2);
      }
      const limitedCoords = limiter.fn({
        ...state4,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
}, "shift");
var size = /* @__PURE__ */ __name(function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "size",
    options,
    async fn(state4) {
      var _state$middlewareData, _state$middlewareData2;
      const {
        placement,
        rects,
        platform: platform2,
        elements
      } = state4;
      const {
        apply = /* @__PURE__ */ __name(() => {
        }, "apply"),
        ...detectOverflowOptions
      } = evaluate(options, state4);
      const overflow = await platform2.detectOverflow(state4, detectOverflowOptions);
      const side = getSide(placement);
      const alignment = getAlignment(placement);
      const isYAxis = getSideAxis(placement) === "y";
      const {
        width,
        height
      } = rects.floating;
      let heightSide;
      let widthSide;
      if (side === "top" || side === "bottom") {
        heightSide = side;
        widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
      } else {
        widthSide = side;
        heightSide = alignment === "end" ? "top" : "bottom";
      }
      const maximumClippingHeight = height - overflow.top - overflow.bottom;
      const maximumClippingWidth = width - overflow.left - overflow.right;
      const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
      const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
      const noShift = !state4.middlewareData.shift;
      let availableHeight = overflowAvailableHeight;
      let availableWidth = overflowAvailableWidth;
      if ((_state$middlewareData = state4.middlewareData.shift) != null && _state$middlewareData.enabled.x) {
        availableWidth = maximumClippingWidth;
      }
      if ((_state$middlewareData2 = state4.middlewareData.shift) != null && _state$middlewareData2.enabled.y) {
        availableHeight = maximumClippingHeight;
      }
      if (noShift && !alignment) {
        const xMin = max(overflow.left, 0);
        const xMax = max(overflow.right, 0);
        const yMin = max(overflow.top, 0);
        const yMax = max(overflow.bottom, 0);
        if (isYAxis) {
          availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
        } else {
          availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
        }
      }
      await apply({
        ...state4,
        availableWidth,
        availableHeight
      });
      const nextDimensions = await platform2.getDimensions(elements.floating);
      if (width !== nextDimensions.width || height !== nextDimensions.height) {
        return {
          reset: {
            rects: true
          }
        };
      }
      return {};
    }
  };
}, "size");

// node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
__name(hasWindow, "hasWindow");
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
__name(getNodeName, "getNodeName");
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
__name(getWindow, "getWindow");
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
__name(getDocumentElement, "getDocumentElement");
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
__name(isNode, "isNode");
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
__name(isElement, "isElement");
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
__name(isHTMLElement, "isHTMLElement");
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
__name(isShadowRoot, "isShadowRoot");
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle2(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
}
__name(isOverflowElement, "isOverflowElement");
function isTableElement(element) {
  return /^(table|td|th)$/.test(getNodeName(element));
}
__name(isTableElement, "isTableElement");
function isTopLayer(element) {
  try {
    if (element.matches(":popover-open")) {
      return true;
    }
  } catch (_e) {
  }
  try {
    return element.matches(":modal");
  } catch (_e) {
    return false;
  }
}
__name(isTopLayer, "isTopLayer");
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
var containRe = /paint|layout|strict|content/;
var isNotNone = /* @__PURE__ */ __name((value) => !!value && value !== "none", "isNotNone");
var isWebKitValue;
function isContainingBlock(elementOrCss) {
  const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
  return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
}
__name(isContainingBlock, "isContainingBlock");
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
__name(getContainingBlock, "getContainingBlock");
function isWebKit() {
  if (isWebKitValue == null) {
    isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
  }
  return isWebKitValue;
}
__name(isWebKit, "isWebKit");
function isLastTraversableNode(node) {
  return /^(html|body|#document)$/.test(getNodeName(node));
}
__name(isLastTraversableNode, "isLastTraversableNode");
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}
__name(getComputedStyle2, "getComputedStyle");
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
__name(getNodeScroll, "getNodeScroll");
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
__name(getParentNode, "getParentNode");
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
__name(getNearestOverflowAncestor, "getNearestOverflowAncestor");
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  } else {
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
  }
}
__name(getOverflowAncestors, "getOverflowAncestors");
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}
__name(getFrameElement, "getFrameElement");

// node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle2(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
__name(getCssDimensions, "getCssDimensions");
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
__name(unwrapElement, "unwrapElement");
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
__name(getScale, "getScale");
var noOffsets = /* @__PURE__ */ createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
__name(getVisualOffsets, "getVisualOffsets");
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}
__name(shouldAddVisualOffsets, "shouldAddVisualOffsets");
function getBoundingClientRect2(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle2(currentIFrame);
      const left2 = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left2;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
__name(getBoundingClientRect2, "getBoundingClientRect");
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect2(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
__name(getWindowScrollBarX, "getWindowScrollBarX");
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}
__name(getHTMLOffset, "getHTMLOffset");
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect2(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
__name(convertOffsetParentRelativeRectToViewportRelativeRect, "convertOffsetParentRelativeRectToViewportRelativeRect");
function getClientRects(element) {
  return Array.from(element.getClientRects());
}
__name(getClientRects, "getClientRects");
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle2(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
__name(getDocumentRect, "getDocumentRect");
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const clippingStableScrollbarWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
      width -= clippingStableScrollbarWidth;
    }
  } else if (windowScrollbarX <= SCROLLBAR_MAX) {
    width += windowScrollbarX;
  }
  return {
    width,
    height,
    x,
    y
  };
}
__name(getViewportRect, "getViewportRect");
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect2(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left2 = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left2 * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
__name(getInnerBoundingClientRect, "getInnerBoundingClientRect");
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
__name(getClientRectFromClippingAncestor, "getClientRectFromClippingAncestor");
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle2(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
__name(hasFixedPositionAncestor, "hasFixedPositionAncestor");
function getClippingElementAncestors(element, cache7) {
  const cachedResult2 = cache7.get(element);
  if (cachedResult2) {
    return cachedResult2;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle2(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && (currentContainingBlockComputedStyle.position === "absolute" || currentContainingBlockComputedStyle.position === "fixed") || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache7.set(element, result);
  return result;
}
__name(getClippingElementAncestors, "getClippingElementAncestors");
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
  let top = firstRect.top;
  let right2 = firstRect.right;
  let bottom = firstRect.bottom;
  let left2 = firstRect.left;
  for (let i = 1; i < clippingAncestors.length; i++) {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
    top = max(rect.top, top);
    right2 = min(rect.right, right2);
    bottom = min(rect.bottom, bottom);
    left2 = max(rect.left, left2);
  }
  return {
    width: right2 - left2,
    height: bottom - top,
    x: left2,
    y: top
  };
}
__name(getClippingRect, "getClippingRect");
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
__name(getDimensions, "getDimensions");
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect2(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  function setLeftRTLScrollbarOffset() {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  __name(setLeftRTLScrollbarOffset, "setLeftRTLScrollbarOffset");
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect2(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      setLeftRTLScrollbarOffset();
    }
  }
  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset();
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}
__name(getRectRelativeToOffsetParent, "getRectRelativeToOffsetParent");
function isStaticPositioned(element) {
  return getComputedStyle2(element).position === "static";
}
__name(isStaticPositioned, "isStaticPositioned");
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
__name(getTrueOffsetParent, "getTrueOffsetParent");
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
__name(getOffsetParent, "getOffsetParent");
var getElementRects = /* @__PURE__ */ __name(async function(data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
}, "getElementRects");
function isRTL(element) {
  return getComputedStyle2(element).direction === "rtl";
}
__name(isRTL, "isRTL");
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
function rectsAreEqual(a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
__name(rectsAreEqual, "rectsAreEqual");
function observeMove(element, onMove) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io) == null || _io.disconnect();
    io = null;
  }
  __name(cleanup, "cleanup");
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const elementRectForRootMargin = element.getBoundingClientRect();
    const {
      left: left2,
      top,
      width,
      height
    } = elementRectForRootMargin;
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left2 + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left2);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1e3);
        } else {
          refresh(false, ratio);
        }
      }
      if (ratio === 1 && !rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) {
        refresh();
      }
      isFirstUpdate = false;
    }
    __name(handleObserve, "handleObserve");
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (_e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  __name(refresh, "refresh");
  refresh(true);
  return cleanup;
}
__name(observeMove, "observeMove");
function autoUpdate(reference, floating, update2, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener("scroll", update2, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener("resize", update2);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update2) : null;
  let reobserveFrame = -1;
  let resizeObserver2 = null;
  if (elementResize) {
    resizeObserver2 = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver2 && floating) {
        resizeObserver2.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver2) == null || _resizeObserver.observe(floating);
        });
      }
      update2();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver2.observe(referenceEl);
    }
    if (floating) {
      resizeObserver2.observe(floating);
    }
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect2(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect2(reference);
    if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
      update2();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  __name(frameLoop, "frameLoop");
  update2();
  return () => {
    var _resizeObserver2;
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener("scroll", update2);
      ancestorResize && ancestor.removeEventListener("resize", update2);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver2) == null || _resizeObserver2.disconnect();
    resizeObserver2 = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}
__name(autoUpdate, "autoUpdate");
var detectOverflow2 = detectOverflow;
var offset2 = offset;
var shift2 = shift;
var flip2 = flip;
var size2 = size;
var arrow2 = arrow;
var computePosition2 = /* @__PURE__ */ __name((reference, floating, options) => {
  const cache7 = /* @__PURE__ */ new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache7
  };
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
}, "computePosition");

// node_modules/.pnpm/@floating-ui+react-dom@2.1.8_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs
import * as React47 from "react";
import { useLayoutEffect as useLayoutEffect5 } from "react";
import * as ReactDOM2 from "react-dom";
var isClient2 = typeof document !== "undefined";
var noop = /* @__PURE__ */ __name(function noop2() {
}, "noop");
var index = isClient2 ? useLayoutEffect5 : noop;
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a === "function" && a.toString() === b.toString()) {
    return true;
  }
  let length;
  let i;
  let keys;
  if (a && b && typeof a === "object") {
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) {
      return false;
    }
    for (i = length; i-- !== 0; ) {
      if (!{}.hasOwnProperty.call(b, keys[i])) {
        return false;
      }
    }
    for (i = length; i-- !== 0; ) {
      const key = keys[i];
      if (key === "_owner" && a.$$typeof) {
        continue;
      }
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return a !== a && b !== b;
}
__name(deepEqual, "deepEqual");
function getDPR(element) {
  if (typeof window === "undefined") {
    return 1;
  }
  const win = element.ownerDocument.defaultView || window;
  return win.devicePixelRatio || 1;
}
__name(getDPR, "getDPR");
function roundByDPR(element, value) {
  const dpr = getDPR(element);
  return Math.round(value * dpr) / dpr;
}
__name(roundByDPR, "roundByDPR");
function useLatestRef(value) {
  const ref = React47.useRef(value);
  index(() => {
    ref.current = value;
  });
  return ref;
}
__name(useLatestRef, "useLatestRef");
function useFloating(options) {
  if (options === void 0) {
    options = {};
  }
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2,
    elements: {
      reference: externalReference,
      floating: externalFloating
    } = {},
    transform = true,
    whileElementsMounted,
    open
  } = options;
  const [data, setData] = React47.useState({
    x: 0,
    y: 0,
    strategy,
    placement,
    middlewareData: {},
    isPositioned: false
  });
  const [latestMiddleware, setLatestMiddleware] = React47.useState(middleware);
  if (!deepEqual(latestMiddleware, middleware)) {
    setLatestMiddleware(middleware);
  }
  const [_reference, _setReference] = React47.useState(null);
  const [_floating, _setFloating] = React47.useState(null);
  const setReference = React47.useCallback((node) => {
    if (node !== referenceRef.current) {
      referenceRef.current = node;
      _setReference(node);
    }
  }, []);
  const setFloating = React47.useCallback((node) => {
    if (node !== floatingRef.current) {
      floatingRef.current = node;
      _setFloating(node);
    }
  }, []);
  const referenceEl = externalReference || _reference;
  const floatingEl = externalFloating || _floating;
  const referenceRef = React47.useRef(null);
  const floatingRef = React47.useRef(null);
  const dataRef = React47.useRef(data);
  const hasWhileElementsMounted = whileElementsMounted != null;
  const whileElementsMountedRef = useLatestRef(whileElementsMounted);
  const platformRef = useLatestRef(platform2);
  const openRef = useLatestRef(open);
  const update2 = React47.useCallback(() => {
    if (!referenceRef.current || !floatingRef.current) {
      return;
    }
    const config = {
      placement,
      strategy,
      middleware: latestMiddleware
    };
    if (platformRef.current) {
      config.platform = platformRef.current;
    }
    computePosition2(referenceRef.current, floatingRef.current, config).then((data2) => {
      const fullData = {
        ...data2,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: openRef.current !== false
      };
      if (isMountedRef.current && !deepEqual(dataRef.current, fullData)) {
        dataRef.current = fullData;
        ReactDOM2.flushSync(() => {
          setData(fullData);
        });
      }
    });
  }, [latestMiddleware, placement, strategy, platformRef, openRef]);
  index(() => {
    if (open === false && dataRef.current.isPositioned) {
      dataRef.current.isPositioned = false;
      setData((data2) => ({
        ...data2,
        isPositioned: false
      }));
    }
  }, [open]);
  const isMountedRef = React47.useRef(false);
  index(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  index(() => {
    if (referenceEl) referenceRef.current = referenceEl;
    if (floatingEl) floatingRef.current = floatingEl;
    if (referenceEl && floatingEl) {
      if (whileElementsMountedRef.current) {
        return whileElementsMountedRef.current(referenceEl, floatingEl, update2);
      }
      update2();
    }
  }, [referenceEl, floatingEl, update2, whileElementsMountedRef, hasWhileElementsMounted]);
  const refs = React47.useMemo(() => ({
    reference: referenceRef,
    floating: floatingRef,
    setReference,
    setFloating
  }), [setReference, setFloating]);
  const elements = React47.useMemo(() => ({
    reference: referenceEl,
    floating: floatingEl
  }), [referenceEl, floatingEl]);
  const floatingStyles = React47.useMemo(() => {
    const initialStyles = {
      position: strategy,
      left: 0,
      top: 0
    };
    if (!elements.floating) {
      return initialStyles;
    }
    const x = roundByDPR(elements.floating, data.x);
    const y = roundByDPR(elements.floating, data.y);
    if (transform) {
      return {
        ...initialStyles,
        transform: "translate(" + x + "px, " + y + "px)",
        ...getDPR(elements.floating) >= 1.5 && {
          willChange: "transform"
        }
      };
    }
    return {
      position: strategy,
      left: x,
      top: y
    };
  }, [strategy, transform, elements.floating, data.x, data.y]);
  return React47.useMemo(() => ({
    ...data,
    update: update2,
    refs,
    elements,
    floatingStyles
  }), [data, update2, refs, elements, floatingStyles]);
}
__name(useFloating, "useFloating");
var arrow$1 = /* @__PURE__ */ __name((options) => {
  function isRef(value) {
    return {}.hasOwnProperty.call(value, "current");
  }
  __name(isRef, "isRef");
  return {
    name: "arrow",
    options,
    fn(state4) {
      const {
        element,
        padding
      } = typeof options === "function" ? options(state4) : options;
      if (element && isRef(element)) {
        if (element.current != null) {
          return arrow2({
            element: element.current,
            padding
          }).fn(state4);
        }
        return {};
      }
      if (element) {
        return arrow2({
          element,
          padding
        }).fn(state4);
      }
      return {};
    }
  };
}, "arrow$1");
var offset3 = /* @__PURE__ */ __name((options, deps) => {
  const result = offset2(options);
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps]
  };
}, "offset");
var shift3 = /* @__PURE__ */ __name((options, deps) => {
  const result = shift2(options);
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps]
  };
}, "shift");
var flip3 = /* @__PURE__ */ __name((options, deps) => {
  const result = flip2(options);
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps]
  };
}, "flip");
var size3 = /* @__PURE__ */ __name((options, deps) => {
  const result = size2(options);
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps]
  };
}, "size");
var arrow3 = /* @__PURE__ */ __name((options, deps) => {
  const result = arrow$1(options);
  return {
    name: result.name,
    fn: result.fn,
    options: [options, deps]
  };
}, "arrow");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/useFloating.mjs
import React48 from "react";
var FloatingOverrideContext = React48.createContext(null);
var useFloating2 = /* @__PURE__ */ __name((props) => {
  "use no memo";
  const context3 = React48.useContext(FloatingOverrideContext);
  return (context3 || useFloating)?.({
    ...props,
    middleware: [
      // @ts-ignore
      ...props.middleware,
      {
        name: `rounded`,
        fn({
          x,
          y
        }) {
          return {
            x: Math.round(x),
            y: Math.round(y)
          };
        }
      }
    ]
  });
}, "useFloating");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/createFloatingEvents.mjs
function createFloatingEvents() {
  const listeners2 = /* @__PURE__ */ new Map();
  return {
    emit(event, data) {
      listeners2.get(event)?.forEach((fn) => fn(data));
    },
    on(event, handler) {
      let set = listeners2.get(event);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        listeners2.set(event, set);
      }
      set.add(handler);
    },
    off(event, handler) {
      const set = listeners2.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) listeners2.delete(event);
      }
    }
  };
}
__name(createFloatingEvents, "createFloatingEvents");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/PopupTriggerMap.mjs
var PopupTriggerMap = class {
  static {
    __name(this, "PopupTriggerMap");
  }
  map = /* @__PURE__ */ new Map();
  elements = /* @__PURE__ */ new Set();
  add(id, element) {
    const prev = this.map.get(id);
    if (prev) {
      this.elements.delete(prev);
    }
    this.map.set(id, element);
    this.elements.add(element);
  }
  delete(id) {
    const el = this.map.get(id);
    if (el) {
      this.elements.delete(el);
      this.map.delete(id);
    }
  }
  hasElement(element) {
    return this.elements.has(element);
  }
};

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useInteractions.mjs
function useInteractions(propsList) {
  const filtered = propsList.filter(Boolean);
  const referenceFns = /* @__PURE__ */ new Map();
  const floatingFns = /* @__PURE__ */ new Map();
  const itemFns = /* @__PURE__ */ new Map();
  const referenceStatic = {};
  const floatingStatic = {};
  for (const props of filtered) {
    if (props.reference) {
      collectProps(props.reference, referenceFns, referenceStatic);
    }
    if (props.floating) {
      collectProps(props.floating, floatingFns, floatingStatic);
    }
    if (props.item && typeof props.item === "object") {
      collectProps(props.item, itemFns, {});
    }
  }
  return {
    getReferenceProps(userProps) {
      return buildProps(referenceFns, referenceStatic, userProps);
    },
    getFloatingProps(userProps) {
      return buildProps(floatingFns, floatingStatic, userProps);
    },
    getItemProps(userProps) {
      return buildProps(itemFns, {}, userProps);
    }
  };
}
__name(useInteractions, "useInteractions");
function collectProps(props, fnMap, staticMap) {
  for (const key of Object.keys(props)) {
    if (typeof props[key] === "function") {
      let arr = fnMap.get(key);
      if (!arr) {
        arr = [];
        fnMap.set(key, arr);
      }
      arr.push(props[key]);
    } else {
      staticMap[key] = props[key];
    }
  }
}
__name(collectProps, "collectProps");
function buildProps(fnMap, staticProps, userProps) {
  const result = {
    ...staticProps
  };
  for (const [key, fns] of fnMap) {
    const hookHandler = /* @__PURE__ */ __name((...args) => {
      for (const fn of fns) {
        const result2 = fn(...args);
        if (result2 !== void 0) return result2;
      }
    }, "hookHandler");
    result[key] = hookHandler;
  }
  if (userProps) {
    for (const key of Object.keys(userProps)) {
      if (key === "style") {
        result.style = {
          ...result.style,
          ...userProps.style
        };
      } else if (typeof userProps[key] === "function" && result[key]) {
        const hookFn = result[key];
        const userFn = userProps[key];
        result[key] = (...args) => {
          userFn(...args);
          hookFn(...args);
        };
      } else {
        result[key] = userProps[key];
      }
    }
  }
  return result;
}
__name(buildProps, "buildProps");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useHover.mjs
import * as React49 from "react";

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/utils.mjs
function getDocument(node) {
  return node?.ownerDocument || document;
}
__name(getDocument, "getDocument");
function contains(parent, child) {
  if (!parent || !child) return false;
  const rootNode = child.getRootNode?.();
  if (parent.contains(child)) return true;
  if (rootNode && isShadowRoot2(rootNode)) {
    let next = child;
    while (next) {
      if (parent === next) return true;
      next = next.parentNode || next.host;
    }
  }
  return false;
}
__name(contains, "contains");
function isShadowRoot2(node) {
  return node instanceof ShadowRoot;
}
__name(isShadowRoot2, "isShadowRoot");
function getTarget(event) {
  if ("composedPath" in event) {
    return event.composedPath()[0];
  }
  return event.target;
}
__name(getTarget, "getTarget");
function activeElement(doc) {
  let el = doc.activeElement;
  while (el?.shadowRoot?.activeElement != null) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}
__name(activeElement, "activeElement");
function isHTMLElement2(value) {
  return value instanceof HTMLElement;
}
__name(isHTMLElement2, "isHTMLElement");
function isElement2(value) {
  return value instanceof Element;
}
__name(isElement2, "isElement");
var TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function isTypeableElement(element) {
  return isHTMLElement2(element) && element.matches(TYPEABLE_SELECTOR);
}
__name(isTypeableElement, "isTypeableElement");
function isTypeableCombobox(element) {
  if (!element) return false;
  return element.getAttribute("role") === "combobox" && isTypeableElement(element);
}
__name(isTypeableCombobox, "isTypeableCombobox");
function getPlatform() {
  const uaData = navigator.userAgentData;
  if (uaData?.platform) return uaData.platform;
  return navigator.platform;
}
__name(getPlatform, "getPlatform");
function getUserAgent() {
  const uaData = navigator.userAgentData;
  if (uaData && Array.isArray(uaData.brands)) {
    return uaData.brands.map(({
      brand,
      version
    }) => `${brand}/${version}`).join(" ");
  }
  return navigator.userAgent;
}
__name(getUserAgent, "getUserAgent");
function isSafari() {
  return /apple/i.test(navigator.vendor);
}
__name(isSafari, "isSafari");
function isMac() {
  return getPlatform().toLowerCase().startsWith("mac") && !navigator.maxTouchPoints;
}
__name(isMac, "isMac");
function isJSDOM() {
  return getUserAgent().includes("jsdom/");
}
__name(isJSDOM, "isJSDOM");
function matchesFocusVisible(element) {
  if (!element || isJSDOM()) return true;
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}
__name(matchesFocusVisible, "matchesFocusVisible");
function isMouseLikePointerType(pointerType, strict) {
  const values = ["mouse", "pen"];
  if (!strict) {
    values.push("", void 0);
  }
  return values.includes(pointerType);
}
__name(isMouseLikePointerType, "isMouseLikePointerType");
function clearTimeoutIfSet(timeoutRef) {
  if (timeoutRef.current !== -1) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = -1;
  }
}
__name(clearTimeoutIfSet, "clearTimeoutIfSet");
function stopEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}
__name(stopEvent, "stopEvent");
function isVirtualClick(event) {
  if (event.mozInputSource === 0 && event.isTrusted) return true;
  if (isAndroid3() && event.pointerType) {
    return event.type === "click" && event.buttons === 1;
  }
  return event.detail === 0 && !event.pointerType;
}
__name(isVirtualClick, "isVirtualClick");
function isVirtualPointerEvent(event) {
  if (isJSDOM()) return false;
  return !isAndroid3() && event.width === 0 && event.height === 0 || isAndroid3() && event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "mouse" || event.width < 1 && event.height < 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "touch";
}
__name(isVirtualPointerEvent, "isVirtualPointerEvent");
function isAndroid3() {
  const re = /android/i;
  return re.test(getPlatform()) || re.test(getUserAgent());
}
__name(isAndroid3, "isAndroid");
var rafId = 0;
function enqueueFocus(el, options = {}) {
  const {
    preventScroll = false,
    cancelPrevious = true,
    sync = false
  } = options;
  cancelPrevious && cancelAnimationFrame(rafId);
  const exec = /* @__PURE__ */ __name(() => el?.focus({
    preventScroll
  }), "exec");
  if (sync) {
    exec();
  } else {
    rafId = requestAnimationFrame(exec);
  }
}
__name(enqueueFocus, "enqueueFocus");
function isListIndexDisabled(listRef, index2, disabledIndices) {
  if (typeof disabledIndices === "function") return disabledIndices(index2);
  if (disabledIndices) return disabledIndices.includes(index2);
  const element = listRef.current[index2];
  return element == null || element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
}
__name(isListIndexDisabled, "isListIndexDisabled");
function findNonDisabledListIndex(listRef, {
  startingIndex = -1,
  decrement = false,
  disabledIndices,
  amount = 1
} = {}) {
  let index2 = startingIndex;
  do {
    index2 += decrement ? -amount : amount;
  } while (index2 >= 0 && index2 <= listRef.current.length - 1 && isListIndexDisabled(listRef, index2, disabledIndices));
  return index2;
}
__name(findNonDisabledListIndex, "findNonDisabledListIndex");
function getMinListIndex(listRef, disabledIndices) {
  return findNonDisabledListIndex(listRef, {
    disabledIndices
  });
}
__name(getMinListIndex, "getMinListIndex");
function getMaxListIndex(listRef, disabledIndices) {
  return findNonDisabledListIndex(listRef, {
    decrement: true,
    startingIndex: listRef.current.length,
    disabledIndices
  });
}
__name(getMaxListIndex, "getMaxListIndex");
function isIndexOutOfListBounds(listRef, index2) {
  return index2 < 0 || index2 >= listRef.current.length;
}
__name(isIndexOutOfListBounds, "isIndexOutOfListBounds");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useHover.mjs
var safePolygonIdentifier = "data-floating-ui-safe-polygon";
function getDelay(value, prop, pointerType) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  return value?.[prop];
}
__name(getDelay, "getDelay");
function useHover(context3, props = {}) {
  const {
    open,
    onOpenChange,
    dataRef,
    events,
    elements
  } = context3;
  const {
    enabled = true,
    delay = 0,
    handleClose = null,
    mouseOnly = false,
    restMs = 0,
    move = true
  } = props;
  const handleCloseRef = React49.useRef(handleClose);
  handleCloseRef.current = handleClose;
  const delayRef = React49.useRef(delay);
  delayRef.current = delay;
  const openRef = React49.useRef(open);
  openRef.current = open;
  const restMsRef = React49.useRef(restMs);
  restMsRef.current = restMs;
  const stableOnOpenChange = useEvent(onOpenChange);
  const pointerTypeRef = React49.useRef(void 0);
  const timeoutRef = React49.useRef(-1);
  const handlerRef = React49.useRef(void 0);
  const restTimeoutRef = React49.useRef(-1);
  const blockMouseMoveRef = React49.useRef(true);
  const performedPointerEventsMutationRef = React49.useRef(false);
  const unbindMouseMoveRef = React49.useRef(() => {
  });
  const restTimeoutPendingRef = React49.useRef(false);
  const isHoverOpen = useEvent(() => {
    const type = dataRef.current.openEvent?.type;
    return type?.includes("mouse") && type !== "mousedown";
  });
  React49.useEffect(() => {
    if (!enabled) return;
    if (!events) return;
    function onOpenChange2({
      open: open2
    }) {
      if (!open2) {
        clearTimeoutIfSet(timeoutRef);
        clearTimeoutIfSet(restTimeoutRef);
        blockMouseMoveRef.current = true;
        restTimeoutPendingRef.current = false;
      }
    }
    __name(onOpenChange2, "onOpenChange2");
    events.on("openchange", onOpenChange2);
    return () => {
      events.off("openchange", onOpenChange2);
    };
  }, [enabled, events]);
  const closeWithDelay = useEvent((event, runElseBranch = true, reason = "hover") => {
    const closeDelay = getDelay(delayRef.current, "close", pointerTypeRef.current);
    if (closeDelay && !handlerRef.current) {
      clearTimeoutIfSet(timeoutRef);
      timeoutRef.current = window.setTimeout(() => stableOnOpenChange(false, event, reason), closeDelay);
    } else if (runElseBranch) {
      clearTimeoutIfSet(timeoutRef);
      stableOnOpenChange(false, event, reason);
    }
  });
  const cleanupMouseMoveHandler = useEvent(() => {
    unbindMouseMoveRef.current();
    handlerRef.current = void 0;
    if (context3.handleCloseActiveRef) {
      context3.handleCloseActiveRef.current = false;
    }
  });
  const clearPointerEvents = useEvent(() => {
    if (performedPointerEventsMutationRef.current) {
      const body = getDocument(elements.floating).body;
      body.style.pointerEvents = "";
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef.current = false;
    }
  });
  const isClickLikeOpenEvent = useEvent(() => {
    return dataRef.current.openEvent ? ["click", "mousedown"].includes(dataRef.current.openEvent.type) : false;
  });
  React49.useEffect(() => {
    if (!enabled) return;
    function onReferenceMouseEnter(event) {
      clearTimeoutIfSet(timeoutRef);
      blockMouseMoveRef.current = false;
      if (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current) || restMsRef.current > 0 && !getDelay(delayRef.current, "open")) {
        return;
      }
      const openDelay = getDelay(delayRef.current, "open", pointerTypeRef.current);
      if (openDelay) {
        timeoutRef.current = window.setTimeout(() => {
          if (!openRef.current) {
            stableOnOpenChange(true, event, "hover");
          }
        }, openDelay);
      } else if (!open) {
        stableOnOpenChange(true, event, "hover");
      }
    }
    __name(onReferenceMouseEnter, "onReferenceMouseEnter");
    function onReferenceMouseLeave(event) {
      if (isClickLikeOpenEvent()) {
        clearPointerEvents();
        return;
      }
      if (context3.triggerElements?.hasElement(event.relatedTarget)) {
        return;
      }
      unbindMouseMoveRef.current();
      const doc = getDocument(elements.floating);
      clearTimeoutIfSet(restTimeoutRef);
      restTimeoutPendingRef.current = false;
      if (handleCloseRef.current) {
        if (!open) {
          clearTimeoutIfSet(timeoutRef);
        }
        const placement = dataRef.current.placement || "bottom";
        const reference2 = elements.domReference;
        const floating = elements.floating;
        if (!reference2 || !floating) return;
        handlerRef.current = handleCloseRef.current({
          x: event.clientX,
          y: event.clientY,
          placement,
          elements: {
            reference: reference2,
            floating,
            domReference: reference2
          },
          onClose() {
            if (context3.handleCloseActiveRef) {
              context3.handleCloseActiveRef.current = false;
            }
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (!isClickLikeOpenEvent()) {
              closeWithDelay(event, true, "safe-polygon");
            }
          }
        });
        if (context3.handleCloseActiveRef) {
          context3.handleCloseActiveRef.current = true;
        }
        const handler = handlerRef.current;
        doc.addEventListener("mousemove", handler);
        unbindMouseMoveRef.current = () => {
          doc.removeEventListener("mousemove", handler);
        };
        return;
      }
      const shouldClose = pointerTypeRef.current === "touch" ? !contains(elements.floating, event.relatedTarget) : true;
      if (shouldClose) {
        closeWithDelay(event);
      }
    }
    __name(onReferenceMouseLeave, "onReferenceMouseLeave");
    function onScrollMouseLeave(event) {
      if (isClickLikeOpenEvent()) return;
      if (context3.triggerElements?.hasElement(event.relatedTarget)) {
        return;
      }
      const placement = dataRef.current.placement || "bottom";
      const reference2 = elements.domReference;
      const floating = elements.floating;
      if (!reference2 || !floating) return;
      handleCloseRef.current?.({
        x: event.clientX,
        y: event.clientY,
        placement,
        elements: {
          reference: reference2,
          floating,
          domReference: reference2
        },
        onClose() {
          clearPointerEvents();
          cleanupMouseMoveHandler();
          if (!isClickLikeOpenEvent()) {
            closeWithDelay(event);
          }
        }
      })(event);
    }
    __name(onScrollMouseLeave, "onScrollMouseLeave");
    function onFloatingMouseEnter() {
      clearTimeoutIfSet(timeoutRef);
    }
    __name(onFloatingMouseEnter, "onFloatingMouseEnter");
    function onFloatingMouseLeave(event) {
      if (isClickLikeOpenEvent()) return;
      if (context3.triggerElements?.hasElement(event.relatedTarget)) {
        return;
      }
      closeWithDelay(event, false);
    }
    __name(onFloatingMouseLeave, "onFloatingMouseLeave");
    if (isElement2(elements.domReference)) {
      const reference2 = elements.domReference;
      const floating = elements.floating;
      if (open) {
        reference2.addEventListener("mouseleave", onScrollMouseLeave);
      }
      if (move) {
        reference2.addEventListener("mousemove", onReferenceMouseEnter, {
          once: true
        });
      }
      reference2.addEventListener("mouseenter", onReferenceMouseEnter);
      reference2.addEventListener("mouseleave", onReferenceMouseLeave);
      if (floating) {
        floating.addEventListener("mouseleave", onScrollMouseLeave);
        floating.addEventListener("mouseenter", onFloatingMouseEnter);
        floating.addEventListener("mouseleave", onFloatingMouseLeave);
      }
      return () => {
        if (open) {
          reference2.removeEventListener("mouseleave", onScrollMouseLeave);
        }
        if (move) {
          reference2.removeEventListener("mousemove", onReferenceMouseEnter);
        }
        reference2.removeEventListener("mouseenter", onReferenceMouseEnter);
        reference2.removeEventListener("mouseleave", onReferenceMouseLeave);
        if (floating) {
          floating.removeEventListener("mouseleave", onScrollMouseLeave);
          floating.removeEventListener("mouseenter", onFloatingMouseEnter);
          floating.removeEventListener("mouseleave", onFloatingMouseLeave);
        }
        cleanupMouseMoveHandler();
      };
    }
  }, [elements, enabled, context3, mouseOnly, move, open, dataRef]);
  React49.useLayoutEffect(() => {
    if (!enabled) return;
    if (open && handleCloseRef.current?.__options?.blockPointerEvents && isHoverOpen()) {
      performedPointerEventsMutationRef.current = true;
      const floatingEl = elements.floating;
      if (isElement2(elements.domReference) && floatingEl) {
        const body = getDocument(elements.floating).body;
        body.setAttribute(safePolygonIdentifier, "");
        const ref = elements.domReference;
        body.style.pointerEvents = "none";
        ref.style.pointerEvents = "auto";
        floatingEl.style.pointerEvents = "auto";
        return () => {
          body.style.pointerEvents = "";
          ref.style.pointerEvents = "";
          floatingEl.style.pointerEvents = "";
        };
      }
    }
  }, [enabled, open, elements, isHoverOpen]);
  React49.useLayoutEffect(() => {
    if (!open) {
      pointerTypeRef.current = void 0;
      restTimeoutPendingRef.current = false;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  }, [open]);
  React49.useEffect(() => {
    return () => {
      cleanupMouseMoveHandler();
      clearTimeoutIfSet(timeoutRef);
      clearTimeoutIfSet(restTimeoutRef);
      clearPointerEvents();
    };
  }, [enabled, elements.domReference]);
  const reference = React49.useMemo(() => {
    function setPointerRef(event) {
      pointerTypeRef.current = event.pointerType;
    }
    __name(setPointerRef, "setPointerRef");
    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        const {
          nativeEvent
        } = event;
        function handleMouseMove() {
          if (!blockMouseMoveRef.current && !openRef.current) {
            stableOnOpenChange(true, nativeEvent, "hover");
          }
        }
        __name(handleMouseMove, "handleMouseMove");
        if (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current)) {
          return;
        }
        if (open || restMsRef.current === 0) {
          return;
        }
        if (restTimeoutPendingRef.current && event.movementX ** 2 + event.movementY ** 2 < 2) {
          return;
        }
        clearTimeoutIfSet(restTimeoutRef);
        if (pointerTypeRef.current === "touch") {
          handleMouseMove();
        } else {
          restTimeoutPendingRef.current = true;
          restTimeoutRef.current = window.setTimeout(handleMouseMove, restMsRef.current);
        }
      }
    };
  }, [mouseOnly, open]);
  return React49.useMemo(() => enabled ? {
    reference
  } : {}, [enabled, reference]);
}
__name(useHover, "useHover");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/safePolygon.mjs
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let isInside2 = false;
  const length = polygon.length;
  for (let i = 0, j = length - 1; i < length; j = i++) {
    const [xi, yi] = polygon[i] || [0, 0];
    const [xj, yj] = polygon[j] || [0, 0];
    const intersect = yi >= y !== yj >= y && x <= (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (intersect) {
      isInside2 = !isInside2;
    }
  }
  return isInside2;
}
__name(isPointInPolygon, "isPointInPolygon");
function isInside(point, rect) {
  return point[0] >= rect.x && point[0] <= rect.x + rect.width && point[1] >= rect.y && point[1] <= rect.y + rect.height;
}
__name(isInside, "isInside");
var debugSvg = null;
function debugDrawPolygon(polygon, trough, cursor, anchor) {
  if (!debugSvg) {
    debugSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    debugSvg.id = "__safe-polygon-debug";
    Object.assign(debugSvg.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "999999"
    });
    document.body.appendChild(debugSvg);
  }
  debugSvg.innerHTML = "";
  if (trough.length) {
    const troughEl = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    troughEl.setAttribute("points", trough.map((p) => p.join(",")).join(" "));
    troughEl.setAttribute("fill", "rgba(0,100,255,0.15)");
    troughEl.setAttribute("stroke", "rgba(0,100,255,0.6)");
    troughEl.setAttribute("stroke-width", "1");
    debugSvg.appendChild(troughEl);
  }
  if (polygon.length) {
    const polyEl = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polyEl.setAttribute("points", polygon.map((p) => p.join(",")).join(" "));
    polyEl.setAttribute("fill", "rgba(255,50,50,0.2)");
    polyEl.setAttribute("stroke", "rgba(255,50,50,0.8)");
    polyEl.setAttribute("stroke-width", "1.5");
    debugSvg.appendChild(polyEl);
  }
  const anchorCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  anchorCircle.setAttribute("cx", String(anchor[0]));
  anchorCircle.setAttribute("cy", String(anchor[1]));
  anchorCircle.setAttribute("r", "5");
  anchorCircle.setAttribute("fill", "lime");
  anchorCircle.setAttribute("stroke", "darkgreen");
  anchorCircle.setAttribute("stroke-width", "1.5");
  debugSvg.appendChild(anchorCircle);
  const cursorCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  cursorCircle.setAttribute("cx", String(cursor[0]));
  cursorCircle.setAttribute("cy", String(cursor[1]));
  cursorCircle.setAttribute("r", "4");
  cursorCircle.setAttribute("fill", "yellow");
  cursorCircle.setAttribute("stroke", "orange");
  cursorCircle.setAttribute("stroke-width", "1.5");
  debugSvg.appendChild(cursorCircle);
}
__name(debugDrawPolygon, "debugDrawPolygon");
function debugClear() {
  if (debugSvg) {
    debugSvg.remove();
    debugSvg = null;
  }
}
__name(debugClear, "debugClear");
function safePolygon(options = {}) {
  const {
    buffer = 0.5,
    blockPointerEvents = false,
    requireIntent = true,
    __debug = false
  } = options;
  const timeoutRef = {
    current: -1
  };
  let hasLanded = false;
  let lastX = null;
  let lastY = null;
  let lastCursorTime = typeof performance !== "undefined" ? performance.now() : 0;
  function getCursorSpeed(x, y) {
    const currentTime = performance.now();
    const elapsedTime = currentTime - lastCursorTime;
    if (lastX === null || lastY === null || elapsedTime === 0) {
      lastX = x;
      lastY = y;
      lastCursorTime = currentTime;
      return null;
    }
    const deltaX = x - lastX;
    const deltaY = y - lastY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const speed = distance / elapsedTime;
    lastX = x;
    lastY = y;
    lastCursorTime = currentTime;
    return speed;
  }
  __name(getCursorSpeed, "getCursorSpeed");
  const fn = /* @__PURE__ */ __name(({
    x,
    y,
    placement,
    elements,
    onClose
  }) => {
    hasLanded = false;
    lastX = null;
    lastY = null;
    return /* @__PURE__ */ __name(function onMouseMove(event) {
      function close() {
        clearTimeoutIfSet(timeoutRef);
        onClose();
      }
      __name(close, "close");
      clearTimeoutIfSet(timeoutRef);
      const domReference = elements.domReference ?? elements.reference;
      if (!domReference || !elements.floating || placement == null || x == null || y == null) {
        return;
      }
      const {
        clientX,
        clientY
      } = event;
      const clientPoint = [clientX, clientY];
      const target = getTarget(event);
      const isLeave = event.type === "mouseleave";
      const isOverFloatingEl = contains(elements.floating, target);
      const isOverReferenceEl = contains(domReference, target);
      const refRect = domReference.getBoundingClientRect();
      const rect = elements.floating.getBoundingClientRect();
      const side = placement.split("-")[0];
      const cursorLeaveFromRight = x > rect.right - rect.width / 2;
      const cursorLeaveFromBottom = y > rect.bottom - rect.height / 2;
      const isOverReferenceRect = isInside(clientPoint, refRect);
      const isFloatingWider = rect.width > refRect.width;
      const isFloatingTaller = rect.height > refRect.height;
      const left2 = (isFloatingWider ? refRect : rect).left;
      const right2 = (isFloatingWider ? refRect : rect).right;
      const top = (isFloatingTaller ? refRect : rect).top;
      const bottom = (isFloatingTaller ? refRect : rect).bottom;
      if (isOverFloatingEl) {
        hasLanded = true;
        if (!isLeave) {
          return;
        }
      }
      if (isOverReferenceEl) {
        hasLanded = false;
      }
      if (isOverReferenceEl && !isLeave) {
        hasLanded = true;
        return;
      }
      if (!isOverReferenceEl && isOverReferenceRect && !isLeave) {
        return;
      }
      if (isLeave && event.relatedTarget && contains(elements.floating, event.relatedTarget)) {
        return;
      }
      if (side === "top" && y >= refRect.bottom - 1 || side === "bottom" && y <= refRect.top + 1 || side === "left" && x >= refRect.right - 1 || side === "right" && x <= refRect.left + 1) {
        return close();
      }
      let rectPoly = [];
      switch (side) {
        case "top":
          rectPoly = [[left2, refRect.top + 1], [left2, rect.bottom - 1], [right2, rect.bottom - 1], [right2, refRect.top + 1]];
          break;
        case "bottom":
          rectPoly = [[left2, rect.top + 1], [left2, refRect.bottom - 1], [right2, refRect.bottom - 1], [right2, rect.top + 1]];
          break;
        case "left":
          rectPoly = [[rect.right - 1, bottom], [rect.right - 1, top], [refRect.left + 1, top], [refRect.left + 1, bottom]];
          break;
        case "right":
          rectPoly = [[refRect.right - 1, bottom], [refRect.right - 1, top], [rect.left + 1, top], [rect.left + 1, bottom]];
          break;
      }
      function getPolygon([x2, y2]) {
        switch (side) {
          case "top": {
            const cursorPointOne = [isFloatingWider ? x2 + buffer / 2 : cursorLeaveFromRight ? x2 + buffer * 4 : x2 - buffer * 4, y2 + buffer + 1];
            const cursorPointTwo = [isFloatingWider ? x2 - buffer / 2 : cursorLeaveFromRight ? x2 + buffer * 4 : x2 - buffer * 4, y2 + buffer + 1];
            const commonPoints = [[rect.left, cursorLeaveFromRight ? rect.bottom - buffer : isFloatingWider ? rect.bottom - buffer : rect.top], [rect.right, cursorLeaveFromRight ? isFloatingWider ? rect.bottom - buffer : rect.top : rect.bottom - buffer]];
            return [cursorPointOne, cursorPointTwo, ...commonPoints];
          }
          case "bottom": {
            const cursorPointOne = [isFloatingWider ? x2 + buffer / 2 : cursorLeaveFromRight ? x2 + buffer * 4 : x2 - buffer * 4, y2 - buffer];
            const cursorPointTwo = [isFloatingWider ? x2 - buffer / 2 : cursorLeaveFromRight ? x2 + buffer * 4 : x2 - buffer * 4, y2 - buffer];
            const commonPoints = [[rect.left, cursorLeaveFromRight ? rect.top + buffer : isFloatingWider ? rect.top + buffer : rect.bottom], [rect.right, cursorLeaveFromRight ? isFloatingWider ? rect.top + buffer : rect.bottom : rect.top + buffer]];
            return [cursorPointOne, cursorPointTwo, ...commonPoints];
          }
          case "left": {
            const cursorPointOne = [x2 + buffer + 1, isFloatingTaller ? y2 + buffer / 2 : cursorLeaveFromBottom ? y2 + buffer * 4 : y2 - buffer * 4];
            const cursorPointTwo = [x2 + buffer + 1, isFloatingTaller ? y2 - buffer / 2 : cursorLeaveFromBottom ? y2 + buffer * 4 : y2 - buffer * 4];
            const commonPoints = [[cursorLeaveFromBottom ? rect.right - buffer : isFloatingTaller ? rect.right - buffer : rect.left, rect.top], [cursorLeaveFromBottom ? isFloatingTaller ? rect.right - buffer : rect.left : rect.right - buffer, rect.bottom]];
            return [...commonPoints, cursorPointOne, cursorPointTwo];
          }
          case "right": {
            const cursorPointOne = [x2 - buffer, isFloatingTaller ? y2 + buffer / 2 : cursorLeaveFromBottom ? y2 + buffer * 4 : y2 - buffer * 4];
            const cursorPointTwo = [x2 - buffer, isFloatingTaller ? y2 - buffer / 2 : cursorLeaveFromBottom ? y2 + buffer * 4 : y2 - buffer * 4];
            const commonPoints = [[cursorLeaveFromBottom ? rect.left + buffer : isFloatingTaller ? rect.left + buffer : rect.right, rect.top], [cursorLeaveFromBottom ? isFloatingTaller ? rect.left + buffer : rect.right : rect.left + buffer, rect.bottom]];
            return [cursorPointOne, cursorPointTwo, ...commonPoints];
          }
        }
      }
      __name(getPolygon, "getPolygon");
      const poly = getPolygon([x, y]);
      if (__debug) {
        debugDrawPolygon(poly, rectPoly, clientPoint, [x, y]);
      }
      if (isPointInPolygon([clientX, clientY], rectPoly)) {
        return;
      }
      if (hasLanded && !isOverReferenceRect) {
        if (__debug) debugClear();
        return close();
      }
      if (isPointInPolygon([clientX, clientY], poly)) {
        return;
      }
      if (!isLeave && requireIntent) {
        const cursorSpeed = getCursorSpeed(clientX, clientY);
        const cursorSpeedThreshold = 0.1;
        if (cursorSpeed !== null && cursorSpeed < cursorSpeedThreshold) {
          if (__debug) debugClear();
          return close();
        }
      }
      if (__debug) debugClear();
      close();
    }, "onMouseMove");
  }, "fn");
  fn.__options = {
    blockPointerEvents
  };
  return fn;
}
__name(safePolygon, "safePolygon");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useFocus.mjs
import { useEffect as useEffect19, useMemo as useMemo17, useRef as useRef20 } from "react";
function isMacSafari() {
  return isMac() && isSafari();
}
__name(isMacSafari, "isMacSafari");
function useFocus(context3, props = {}) {
  const {
    open,
    onOpenChange,
    events,
    dataRef,
    elements
  } = context3;
  const {
    enabled = true,
    visibleOnly = true
  } = props;
  const blockFocusRef = useRef20(false);
  const timeoutRef = useRef20(-1);
  const keyboardModalityRef = useRef20(true);
  useEffect19(() => {
    if (!enabled) return;
    const win = getDocument(elements.domReference).defaultView || window;
    function onBlur() {
      if (!open && isHTMLElement2(elements.domReference) && elements.domReference === activeElement(getDocument(elements.domReference))) {
        blockFocusRef.current = true;
      }
    }
    __name(onBlur, "onBlur");
    function onKeyDown() {
      keyboardModalityRef.current = true;
    }
    __name(onKeyDown, "onKeyDown");
    function onPointerDown() {
      keyboardModalityRef.current = false;
    }
    __name(onPointerDown, "onPointerDown");
    win.addEventListener("blur", onBlur);
    if (isMacSafari()) {
      win.addEventListener("keydown", onKeyDown, true);
      win.addEventListener("pointerdown", onPointerDown, true);
    }
    return () => {
      win.removeEventListener("blur", onBlur);
      if (isMacSafari()) {
        win.removeEventListener("keydown", onKeyDown, true);
        win.removeEventListener("pointerdown", onPointerDown, true);
      }
    };
  }, [elements.domReference, open, enabled]);
  useEffect19(() => {
    if (!enabled) return;
    if (!events) return;
    function handleOpenChange({
      reason
    }) {
      if (reason === "reference-press" || reason === "escape-key") {
        blockFocusRef.current = true;
      }
    }
    __name(handleOpenChange, "handleOpenChange");
    events.on("openchange", handleOpenChange);
    return () => {
      events.off("openchange", handleOpenChange);
    };
  }, [events, enabled]);
  useEffect19(() => {
    return () => {
      clearTimeoutIfSet(timeoutRef);
    };
  }, []);
  const reference = useMemo17(() => ({
    onMouseLeave() {
      blockFocusRef.current = false;
    },
    onFocus(event) {
      if (blockFocusRef.current) return;
      const target = getTarget(event.nativeEvent);
      if (visibleOnly && isElement2(target)) {
        if (isMacSafari() && !event.relatedTarget) {
          if (!keyboardModalityRef.current && !isTypeableElement(target)) {
            return;
          }
        } else if (!matchesFocusVisible(target)) {
          return;
        }
      }
      onOpenChange(true, event.nativeEvent, "focus");
    },
    onBlur(event) {
      blockFocusRef.current = false;
      const relatedTarget = event.relatedTarget;
      const nativeEvent = event.nativeEvent;
      timeoutRef.current = window.setTimeout(() => {
        const activeEl = activeElement(elements.domReference ? elements.domReference.ownerDocument : document);
        if (!relatedTarget && activeEl === elements.domReference) return;
        if (contains(context3.refs.floating.current, activeEl) || contains(elements.domReference, activeEl)) {
          return;
        }
        onOpenChange(false, nativeEvent, "focus");
      });
    }
  }), [context3.refs.floating, elements.domReference, onOpenChange, visibleOnly]);
  return useMemo17(() => enabled ? {
    reference
  } : {}, [enabled, reference]);
}
__name(useFocus, "useFocus");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useRole.mjs
import * as React50 from "react";
var componentRoleToAriaRoleMap = /* @__PURE__ */ new Map([["select", "listbox"], ["combobox", "listbox"], ["label", false]]);
var idCounter2 = 0;
function useRole(context3, props = {}) {
  const {
    open,
    elements
  } = context3;
  const {
    enabled = true,
    role = "dialog"
  } = props;
  const defaultReferenceId = React50.useId();
  const referenceId = elements.domReference?.id || defaultReferenceId;
  const defaultFloatingId = React50.useMemo(() => `floating-${idCounter2++}`, []);
  const floatingId = React50.useMemo(() => elements.floating?.id || defaultFloatingId, [elements.floating, defaultFloatingId]);
  const ariaRole = componentRoleToAriaRoleMap.get(role) ?? role;
  const reference = React50.useMemo(() => {
    if (ariaRole === "tooltip" || role === "label") {
      return {
        [`aria-${role === "label" ? "labelledby" : "describedby"}`]: open ? floatingId : void 0
      };
    }
    return {
      "aria-expanded": open ? "true" : "false",
      "aria-haspopup": ariaRole === "alertdialog" ? "dialog" : ariaRole,
      "aria-controls": open ? floatingId : void 0,
      ...ariaRole === "listbox" && {
        role: "combobox"
      },
      ...ariaRole === "menu" && {
        id: referenceId
      },
      ...role === "select" && {
        "aria-autocomplete": "none"
      },
      ...role === "combobox" && {
        "aria-autocomplete": "list"
      }
    };
  }, [ariaRole, floatingId, open, referenceId, role]);
  const floating = React50.useMemo(() => {
    const floatingProps = {
      id: floatingId,
      ...ariaRole && {
        role: ariaRole
      }
    };
    if (ariaRole === "tooltip" || role === "label") {
      return floatingProps;
    }
    return {
      ...floatingProps,
      ...ariaRole === "menu" && {
        "aria-labelledby": referenceId
      }
    };
  }, [ariaRole, floatingId, referenceId, role]);
  const item = React50.useCallback(({
    active,
    selected
  }) => {
    const commonProps = {
      role: "option",
      ...active && {
        id: `${floatingId}-fui-option`
      }
    };
    switch (role) {
      case "select":
      case "combobox":
        return {
          ...commonProps,
          "aria-selected": selected
        };
    }
    return {};
  }, [floatingId, role]);
  return React50.useMemo(() => enabled ? {
    reference,
    floating,
    item
  } : {}, [enabled, reference, floating, item]);
}
__name(useRole, "useRole");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useClick.mjs
import { useMemo as useMemo19, useRef as useRef21 } from "react";
function isButtonTarget(event) {
  return isHTMLElement2(event.target) && event.target.tagName === "BUTTON";
}
__name(isButtonTarget, "isButtonTarget");
function isAnchorTarget(event) {
  return isHTMLElement2(event.target) && event.target.tagName === "A";
}
__name(isAnchorTarget, "isAnchorTarget");
function isSpaceIgnored(element) {
  return isTypeableElement(element);
}
__name(isSpaceIgnored, "isSpaceIgnored");
function useClick(context3, props = {}) {
  const {
    open,
    onOpenChange,
    dataRef,
    elements: {
      domReference
    }
  } = context3;
  const {
    enabled = true,
    event: eventOption = "click",
    toggle = true,
    ignoreMouse = false,
    keyboardHandlers = true,
    stickIfOpen = true
  } = props;
  const pointerTypeRef = useRef21(void 0);
  const didKeyDownRef = useRef21(false);
  const reference = useMemo19(() => ({
    onPointerDown(event) {
      pointerTypeRef.current = event.pointerType;
    },
    onMouseDown(event) {
      const pointerType = pointerTypeRef.current;
      if (event.button !== 0) return;
      if (eventOption === "click") return;
      if (isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
      if (open && toggle && (dataRef.current.openEvent && stickIfOpen ? dataRef.current.openEvent.type === "mousedown" : true)) {
        onOpenChange(false, event.nativeEvent || event, "click");
      } else {
        event.preventDefault();
        onOpenChange(true, event.nativeEvent || event, "click");
      }
    },
    onClick(event) {
      const pointerType = pointerTypeRef.current;
      if (eventOption === "mousedown" && pointerTypeRef.current) {
        pointerTypeRef.current = void 0;
        return;
      }
      if (isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
      if (open && toggle && (dataRef.current.openEvent && stickIfOpen ? dataRef.current.openEvent.type === "click" : true)) {
        onOpenChange(false, event.nativeEvent || event, "click");
      } else {
        onOpenChange(true, event.nativeEvent || event, "click");
      }
    },
    onKeyDown(event) {
      pointerTypeRef.current = void 0;
      if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event)) {
        return;
      }
      if (event.key === " " && !isSpaceIgnored(domReference)) {
        event.preventDefault();
        didKeyDownRef.current = true;
      }
      if (isAnchorTarget(event)) {
        return;
      }
      if (event.key === "Enter") {
        if (open && toggle) {
          onOpenChange(false, event.nativeEvent || event, "click");
        } else {
          onOpenChange(true, event.nativeEvent || event, "click");
        }
      }
    },
    onKeyUp(event) {
      if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event) || isSpaceIgnored(domReference)) {
        return;
      }
      if (event.key === " " && didKeyDownRef.current) {
        didKeyDownRef.current = false;
        if (open && toggle) {
          onOpenChange(false, event.nativeEvent || event, "click");
        } else {
          onOpenChange(true, event.nativeEvent || event, "click");
        }
      }
    }
  }), [dataRef, domReference, eventOption, ignoreMouse, keyboardHandlers, onOpenChange, open, stickIfOpen, toggle]);
  return useMemo19(() => enabled ? {
    reference
  } : {}, [enabled, reference]);
}
__name(useClick, "useClick");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useListNavigation.mjs
import { useLayoutEffect as useLayoutEffect7, useMemo as useMemo20, useRef as useRef22, useState as useState10 } from "react";
var ARROW_UP = "ArrowUp";
var ARROW_DOWN = "ArrowDown";
var ARROW_LEFT = "ArrowLeft";
var ARROW_RIGHT = "ArrowRight";
function doSwitch(orientation, vertical, horizontal) {
  switch (orientation) {
    case "vertical":
      return vertical;
    case "horizontal":
      return horizontal;
    default:
      return vertical || horizontal;
  }
}
__name(doSwitch, "doSwitch");
function isMainOrientationKey(key, orientation) {
  const vertical = key === ARROW_UP || key === ARROW_DOWN;
  const horizontal = key === ARROW_LEFT || key === ARROW_RIGHT;
  return doSwitch(orientation, vertical, horizontal);
}
__name(isMainOrientationKey, "isMainOrientationKey");
function isMainOrientationToEndKey(key, orientation, rtl) {
  const vertical = key === ARROW_DOWN;
  const horizontal = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT;
  return doSwitch(orientation, vertical, horizontal) || key === "Enter" || key === " " || key === "";
}
__name(isMainOrientationToEndKey, "isMainOrientationToEndKey");
function isCrossOrientationOpenKey(key, orientation, rtl) {
  const vertical = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT;
  const horizontal = key === ARROW_DOWN;
  return doSwitch(orientation, vertical, horizontal);
}
__name(isCrossOrientationOpenKey, "isCrossOrientationOpenKey");
function isCrossOrientationCloseKey(key, orientation, rtl) {
  const vertical = rtl ? key === ARROW_RIGHT : key === ARROW_LEFT;
  const horizontal = key === ARROW_UP;
  return doSwitch(orientation, vertical, horizontal);
}
__name(isCrossOrientationCloseKey, "isCrossOrientationCloseKey");
function useListNavigation(context3, props) {
  const {
    open,
    onOpenChange,
    elements
  } = context3;
  const {
    listRef,
    activeIndex,
    onNavigate: unstable_onNavigate = /* @__PURE__ */ __name(() => {
    }, "unstable_onNavigate"),
    enabled = true,
    selectedIndex = null,
    allowEscape = false,
    loop = false,
    nested = false,
    rtl = false,
    virtual = false,
    focusItemOnOpen = "auto",
    focusItemOnHover = true,
    openOnArrowKeyDown = true,
    disabledIndices = void 0,
    orientation = "vertical",
    scrollItemIntoView = true
  } = props;
  const typeableComboboxReference = isTypeableCombobox(elements.domReference);
  const focusItemOnOpenRef = useRef22(focusItemOnOpen);
  const indexRef = useRef22(selectedIndex ?? -1);
  const keyRef = useRef22(null);
  const isPointerModalityRef = useRef22(true);
  const previousMountedRef = useRef22(!!elements.floating);
  const previousOpenRef = useRef22(open);
  const forceSyncFocusRef = useRef22(false);
  const forceScrollIntoViewRef = useRef22(false);
  const disabledIndicesRef = useRef22(disabledIndices);
  disabledIndicesRef.current = disabledIndices;
  const latestOpenRef = useRef22(open);
  latestOpenRef.current = open;
  const scrollItemIntoViewRef = useRef22(scrollItemIntoView);
  scrollItemIntoViewRef.current = scrollItemIntoView;
  const selectedIndexRef = useRef22(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const stableOnNavigate = useEvent(unstable_onNavigate);
  const [activeId, setActiveId] = useState10();
  const onNavigate = useEvent(() => {
    stableOnNavigate(indexRef.current === -1 ? null : indexRef.current);
  });
  const previousOnNavigateRef = useRef22(onNavigate);
  const focusItem = useEvent(() => {
    function runFocus(item2) {
      if (virtual) {
        setActiveId(item2.id);
      } else {
        enqueueFocus(item2, {
          sync: forceSyncFocusRef.current,
          preventScroll: true
        });
      }
    }
    __name(runFocus, "runFocus");
    const initialItem = listRef.current[indexRef.current];
    const forceScrollIntoView = forceScrollIntoViewRef.current;
    if (initialItem) {
      runFocus(initialItem);
    }
    const scheduler = forceSyncFocusRef.current ? (v) => v() : requestAnimationFrame;
    scheduler(() => {
      const waitedItem = listRef.current[indexRef.current] || initialItem;
      if (!waitedItem) return;
      if (!initialItem) {
        runFocus(waitedItem);
      }
      const scrollIntoViewOptions = scrollItemIntoViewRef.current;
      const shouldScrollIntoView = scrollIntoViewOptions && waitedItem && (forceScrollIntoView || !isPointerModalityRef.current);
      if (shouldScrollIntoView) {
        waitedItem.scrollIntoView?.(typeof scrollIntoViewOptions === "boolean" ? {
          block: "nearest",
          inline: "nearest"
        } : scrollIntoViewOptions);
      }
    });
  });
  useLayoutEffect7(() => {
    if (!enabled) return;
    if (open && elements.floating) {
      if (focusItemOnOpenRef.current && selectedIndex != null) {
        forceScrollIntoViewRef.current = true;
        indexRef.current = selectedIndex;
        onNavigate();
      }
    } else if (previousMountedRef.current) {
      indexRef.current = -1;
      previousOnNavigateRef.current();
    }
  }, [enabled, open, elements.floating, selectedIndex, onNavigate]);
  useLayoutEffect7(() => {
    if (!enabled) return;
    if (!open) return;
    if (!elements.floating) return;
    if (activeIndex == null) {
      forceSyncFocusRef.current = false;
      if (selectedIndexRef.current != null) {
        return;
      }
      if (previousMountedRef.current) {
        indexRef.current = -1;
        focusItem();
      }
      if ((!previousOpenRef.current || !previousMountedRef.current) && focusItemOnOpenRef.current && (keyRef.current != null || focusItemOnOpenRef.current === true && keyRef.current == null)) {
        let runs = 0;
        const waitForListPopulated = /* @__PURE__ */ __name(() => {
          if (listRef.current[0] == null) {
            if (runs < 2) {
              const scheduler = runs ? requestAnimationFrame : queueMicrotask;
              scheduler(waitForListPopulated);
            }
            runs++;
          } else {
            indexRef.current = keyRef.current == null || isMainOrientationToEndKey(keyRef.current, orientation, rtl) || nested ? getMinListIndex(listRef, disabledIndicesRef.current) : getMaxListIndex(listRef, disabledIndicesRef.current);
            keyRef.current = null;
            onNavigate();
          }
        }, "waitForListPopulated");
        waitForListPopulated();
      }
    } else if (!isIndexOutOfListBounds(listRef, activeIndex)) {
      indexRef.current = activeIndex;
      focusItem();
      forceScrollIntoViewRef.current = false;
    }
  }, [enabled, open, elements.floating, activeIndex, selectedIndexRef, nested, listRef, orientation, rtl, onNavigate, focusItem, disabledIndicesRef]);
  useLayoutEffect7(() => {
    previousOnNavigateRef.current = onNavigate;
    previousOpenRef.current = open;
    previousMountedRef.current = !!elements.floating;
  });
  useLayoutEffect7(() => {
    if (!open) {
      keyRef.current = null;
      focusItemOnOpenRef.current = focusItemOnOpen;
    }
  }, [open, focusItemOnOpen]);
  const hasActiveIndex = activeIndex != null;
  const commonOnKeyDown = useEvent((event) => {
    isPointerModalityRef.current = false;
    forceSyncFocusRef.current = true;
    if (event.which === 229) {
      return;
    }
    if (!latestOpenRef.current && event.currentTarget === elements.floating) {
      return;
    }
    if (nested && isCrossOrientationCloseKey(event.key, orientation, rtl)) {
      stopEvent(event);
      onOpenChange(false, event.nativeEvent, "list-navigation");
      if (isHTMLElement2(elements.domReference)) {
        elements.domReference.focus();
      }
      return;
    }
    const currentIndex = indexRef.current;
    const minIndex = getMinListIndex(listRef, disabledIndices);
    const maxIndex = getMaxListIndex(listRef, disabledIndices);
    if (!typeableComboboxReference) {
      if (event.key === "Home") {
        stopEvent(event);
        indexRef.current = minIndex;
        onNavigate();
      }
      if (event.key === "End") {
        stopEvent(event);
        indexRef.current = maxIndex;
        onNavigate();
      }
    }
    if (isMainOrientationKey(event.key, orientation)) {
      stopEvent(event);
      if (open && !virtual && activeElement(event.currentTarget.ownerDocument) === event.currentTarget) {
        indexRef.current = isMainOrientationToEndKey(event.key, orientation, rtl) ? minIndex : maxIndex;
        onNavigate();
        return;
      }
      if (isMainOrientationToEndKey(event.key, orientation, rtl)) {
        if (loop) {
          indexRef.current = currentIndex >= maxIndex ? allowEscape && currentIndex !== listRef.current.length ? -1 : minIndex : findNonDisabledListIndex(listRef, {
            startingIndex: currentIndex,
            disabledIndices
          });
        } else {
          indexRef.current = Math.min(maxIndex, findNonDisabledListIndex(listRef, {
            startingIndex: currentIndex,
            disabledIndices
          }));
        }
      } else {
        if (loop) {
          indexRef.current = currentIndex <= minIndex ? allowEscape && currentIndex !== -1 ? listRef.current.length : maxIndex : findNonDisabledListIndex(listRef, {
            startingIndex: currentIndex,
            decrement: true,
            disabledIndices
          });
        } else {
          indexRef.current = Math.max(minIndex, findNonDisabledListIndex(listRef, {
            startingIndex: currentIndex,
            decrement: true,
            disabledIndices
          }));
        }
      }
      if (isIndexOutOfListBounds(listRef, indexRef.current)) {
        indexRef.current = -1;
      }
      onNavigate();
    }
  });
  const ariaActiveDescendantProp = useMemo20(() => {
    return virtual && open && hasActiveIndex && {
      "aria-activedescendant": activeId
    };
  }, [virtual, open, hasActiveIndex, activeId]);
  const floating = useMemo20(() => {
    return {
      "aria-orientation": orientation === "both" ? void 0 : orientation,
      ...!typeableComboboxReference ? ariaActiveDescendantProp : {},
      onKeyDown: commonOnKeyDown,
      onPointerMove() {
        isPointerModalityRef.current = true;
      }
    };
  }, [ariaActiveDescendantProp, commonOnKeyDown, orientation, typeableComboboxReference]);
  const reference = useMemo20(() => {
    function checkVirtualMouse(event) {
      if (focusItemOnOpen === "auto" && isVirtualClick(event.nativeEvent)) {
        focusItemOnOpenRef.current = true;
      }
    }
    __name(checkVirtualMouse, "checkVirtualMouse");
    function checkVirtualPointer(event) {
      focusItemOnOpenRef.current = focusItemOnOpen;
      if (focusItemOnOpen === "auto" && isVirtualPointerEvent(event.nativeEvent)) {
        focusItemOnOpenRef.current = true;
      }
    }
    __name(checkVirtualPointer, "checkVirtualPointer");
    return {
      ...ariaActiveDescendantProp,
      onKeyDown(event) {
        isPointerModalityRef.current = false;
        const isArrowKey = event.key.startsWith("Arrow");
        const isCrossOpenKey = isCrossOrientationOpenKey(event.key, orientation, rtl);
        const isMainKey = isMainOrientationKey(event.key, orientation);
        const isNavigationKey = (nested ? isCrossOpenKey : isMainKey) || event.key === "Enter" || event.key.trim() === "";
        if (virtual && open) {
          return commonOnKeyDown(event);
        }
        if (!open && !openOnArrowKeyDown && isArrowKey) {
          return;
        }
        if (isNavigationKey) {
          keyRef.current = event.key;
        }
        if (nested) {
          if (isCrossOpenKey) {
            stopEvent(event);
            if (open) {
              indexRef.current = getMinListIndex(listRef, disabledIndicesRef.current);
              onNavigate();
            } else {
              onOpenChange(true, event.nativeEvent, "list-navigation");
            }
          }
          return;
        }
        if (isMainKey) {
          if (selectedIndex != null) {
            indexRef.current = selectedIndex;
          }
          stopEvent(event);
          if (!open && openOnArrowKeyDown) {
            onOpenChange(true, event.nativeEvent, "list-navigation");
          } else {
            commonOnKeyDown(event);
          }
          if (open) {
            onNavigate();
          }
        }
      },
      onFocus() {
        if (open && !virtual) {
          indexRef.current = -1;
          onNavigate();
        }
      },
      onPointerDown: checkVirtualPointer,
      onPointerEnter: checkVirtualPointer,
      onMouseDown: checkVirtualMouse,
      onClick: checkVirtualMouse
    };
  }, [ariaActiveDescendantProp, commonOnKeyDown, disabledIndicesRef, focusItemOnOpen, listRef, nested, onNavigate, onOpenChange, open, openOnArrowKeyDown, orientation, rtl, selectedIndex, virtual]);
  const item = useMemo20(() => {
    function syncCurrentTarget(currentTarget) {
      if (!latestOpenRef.current) return;
      const index2 = listRef.current.indexOf(currentTarget);
      if (index2 !== -1 && indexRef.current !== index2) {
        indexRef.current = index2;
        onNavigate();
      }
    }
    __name(syncCurrentTarget, "syncCurrentTarget");
    const itemProps = {
      onFocus({
        currentTarget
      }) {
        forceSyncFocusRef.current = true;
        syncCurrentTarget(currentTarget);
      },
      onClick: /* @__PURE__ */ __name(({
        currentTarget
      }) => currentTarget.focus({
        preventScroll: true
      }), "onClick"),
      // safari
      onMouseMove({
        currentTarget
      }) {
        forceSyncFocusRef.current = true;
        forceScrollIntoViewRef.current = false;
        if (focusItemOnHover) {
          syncCurrentTarget(currentTarget);
        }
      },
      onPointerLeave({
        pointerType
      }) {
        if (!isPointerModalityRef.current || pointerType === "touch") {
          return;
        }
        forceSyncFocusRef.current = true;
        if (!focusItemOnHover) {
          return;
        }
        indexRef.current = -1;
        onNavigate();
        if (!virtual) {
          elements.floating?.focus({
            preventScroll: true
          });
        }
      }
    };
    return itemProps;
  }, [latestOpenRef, focusItemOnHover, listRef, onNavigate, virtual, elements.floating]);
  return useMemo20(() => enabled ? {
    reference,
    floating,
    item
  } : {}, [enabled, reference, floating, item]);
}
__name(useListNavigation, "useListNavigation");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useTypeahead.mjs
import { useLayoutEffect as useLayoutEffect8, useMemo as useMemo21, useRef as useRef23 } from "react";
function useTypeahead(context3, props) {
  const {
    open,
    dataRef
  } = context3;
  const {
    listRef,
    activeIndex,
    onMatch: unstable_onMatch,
    onTypingChange: unstable_onTypingChange,
    enabled = true,
    findMatch = null,
    resetMs = 750,
    ignoreKeys = [],
    selectedIndex = null
  } = props;
  const timeoutIdRef = useRef23(-1);
  const stringRef = useRef23("");
  const prevIndexRef = useRef23(selectedIndex ?? activeIndex ?? -1);
  const matchIndexRef = useRef23(null);
  const onMatch = useEvent(unstable_onMatch || (() => {
  }));
  const onTypingChange = useEvent(unstable_onTypingChange || (() => {
  }));
  const findMatchRef = useRef23(findMatch);
  findMatchRef.current = findMatch;
  const ignoreKeysRef = useRef23(ignoreKeys);
  ignoreKeysRef.current = ignoreKeys;
  useLayoutEffect8(() => {
    if (open) {
      clearTimeoutIfSet(timeoutIdRef);
      matchIndexRef.current = null;
      stringRef.current = "";
    }
  }, [open]);
  useLayoutEffect8(() => {
    if (open && stringRef.current === "") {
      prevIndexRef.current = selectedIndex ?? activeIndex ?? -1;
    }
  }, [open, selectedIndex, activeIndex]);
  const setTypingChange = /* @__PURE__ */ __name((value) => {
    if (value) {
      if (!dataRef.current.typing) {
        dataRef.current.typing = value;
        onTypingChange(value);
      }
    } else {
      if (dataRef.current.typing) {
        dataRef.current.typing = value;
        onTypingChange(value);
      }
    }
  }, "setTypingChange");
  const onKeyDown = /* @__PURE__ */ __name((event) => {
    function getMatchingIndex(list, orderedList, string) {
      const str = findMatchRef.current ? findMatchRef.current(orderedList, string) : orderedList.find((text) => text?.toLocaleLowerCase().indexOf(string.toLocaleLowerCase()) === 0);
      return str ? list.indexOf(str) : -1;
    }
    __name(getMatchingIndex, "getMatchingIndex");
    const listContent = listRef.current;
    if (stringRef.current.length > 0 && stringRef.current[0] !== " ") {
      if (getMatchingIndex(listContent, listContent, stringRef.current) === -1) {
        setTypingChange(false);
      } else if (event.key === " ") {
        stopEvent(event);
      }
    }
    if (listContent == null || ignoreKeysRef.current.includes(event.key) || // character key
    event.key.length !== 1 || // modifier key
    event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (open && event.key !== " ") {
      stopEvent(event);
      setTypingChange(true);
    }
    const allowRapidSuccessionOfFirstLetter = listContent.every((text) => text ? text[0]?.toLocaleLowerCase() !== text[1]?.toLocaleLowerCase() : true);
    if (allowRapidSuccessionOfFirstLetter && stringRef.current === event.key) {
      stringRef.current = "";
      prevIndexRef.current = matchIndexRef.current;
    }
    stringRef.current += event.key;
    clearTimeoutIfSet(timeoutIdRef);
    timeoutIdRef.current = window.setTimeout(() => {
      stringRef.current = "";
      prevIndexRef.current = matchIndexRef.current;
      setTypingChange(false);
    }, resetMs);
    const prevIndex = prevIndexRef.current;
    const index2 = getMatchingIndex(listContent, [...listContent.slice((prevIndex || 0) + 1), ...listContent.slice(0, (prevIndex || 0) + 1)], stringRef.current);
    if (index2 !== -1) {
      onMatch(index2);
      matchIndexRef.current = index2;
    } else if (event.key !== " ") {
      stringRef.current = "";
      setTypingChange(false);
    }
  }, "onKeyDown");
  const reference = useMemo21(() => ({
    onKeyDown
  }), [open, enabled]);
  const floating = useMemo21(() => ({
    onKeyDown,
    onKeyUp(event) {
      if (event.key === " ") {
        setTypingChange(false);
      }
    }
  }), [open, enabled]);
  return useMemo21(() => enabled ? {
    reference,
    floating
  } : {}, [enabled, reference, floating]);
}
__name(useTypeahead, "useTypeahead");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useInnerOffset.mjs
import * as React51 from "react";
import * as ReactDOM3 from "react-dom";
function useInnerOffset(context3, props) {
  const {
    open,
    elements
  } = context3;
  const {
    enabled = true,
    overflowRef,
    scrollRef,
    onChange: unstable_onChange
  } = props;
  const onChange = useEvent(unstable_onChange);
  const controlledScrollingRef = React51.useRef(false);
  const prevScrollTopRef = React51.useRef(null);
  const initialOverflowRef = React51.useRef(null);
  React51.useEffect(() => {
    if (!enabled) return;
    function onWheel(e) {
      if (e.ctrlKey || !el || overflowRef.current == null) {
        return;
      }
      const dY = e.deltaY;
      const isAtTop = overflowRef.current.top >= -0.5;
      const isAtBottom = overflowRef.current.bottom >= -0.5;
      const remainingScroll = el.scrollHeight - el.clientHeight;
      const sign = dY < 0 ? -1 : 1;
      const method = dY < 0 ? "max" : "min";
      if (el.scrollHeight <= el.clientHeight) {
        return;
      }
      if (!isAtTop && dY > 0 || !isAtBottom && dY < 0) {
        e.preventDefault();
        ReactDOM3.flushSync(() => {
          onChange((d) => d + Math[method](dY, remainingScroll * sign));
        });
      } else if (/firefox/i.test(navigator.userAgent)) {
        el.scrollTop += dY;
      }
    }
    __name(onWheel, "onWheel");
    const el = scrollRef?.current || elements.floating;
    if (open && el) {
      el.addEventListener("wheel", onWheel);
      requestAnimationFrame(() => {
        prevScrollTopRef.current = el.scrollTop;
        if (overflowRef.current != null) {
          initialOverflowRef.current = {
            ...overflowRef.current
          };
        }
      });
      return () => {
        prevScrollTopRef.current = null;
        initialOverflowRef.current = null;
        el.removeEventListener("wheel", onWheel);
      };
    }
  }, [enabled, open, elements.floating, overflowRef, scrollRef, onChange]);
  const floating = React51.useMemo(() => ({
    onKeyDown() {
      controlledScrollingRef.current = true;
    },
    onWheel() {
      controlledScrollingRef.current = false;
    },
    onPointerMove() {
      controlledScrollingRef.current = false;
    },
    onScroll() {
      const el = scrollRef?.current || elements.floating;
      if (!overflowRef.current || !el || !controlledScrollingRef.current) {
        return;
      }
      if (prevScrollTopRef.current !== null) {
        const scrollDiff = el.scrollTop - prevScrollTopRef.current;
        if (overflowRef.current.bottom < -0.5 && scrollDiff < -1 || overflowRef.current.top < -0.5 && scrollDiff > 1) {
          ReactDOM3.flushSync(() => onChange((d) => d + scrollDiff));
        }
      }
      requestAnimationFrame(() => {
        prevScrollTopRef.current = el.scrollTop;
      });
    }
  }), [elements.floating, onChange, overflowRef, scrollRef]);
  return React51.useMemo(() => enabled ? {
    floating
  } : {}, [enabled, floating]);
}
__name(useInnerOffset, "useInnerOffset");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/interactions/useDelayGroup.mjs
import * as React52 from "react";
var DelayGroupContext = React52.createContext({
  currentId: null,
  setCurrentId: /* @__PURE__ */ __name(() => {
  }, "setCurrentId"),
  delay: 0,
  timeoutMs: 0,
  initialDelay: 0
});
function useDelayGroupContext() {
  return React52.useContext(DelayGroupContext);
}
__name(useDelayGroupContext, "useDelayGroupContext");
function FloatingDelayGroup({
  children,
  delay,
  timeoutMs = 0
}) {
  const [currentId, setCurrentIdRaw] = React52.useState(null);
  const timeoutRef = React52.useRef(void 0);
  const setCurrentId = React52.useCallback((id) => {
    clearTimeout(timeoutRef.current);
    if (id == null && timeoutMs > 0) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIdRaw(null);
      }, timeoutMs);
    } else {
      setCurrentIdRaw(id);
    }
  }, [timeoutMs]);
  React52.useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);
  const value = React52.useMemo(() => ({
    currentId,
    setCurrentId,
    delay,
    timeoutMs,
    initialDelay: delay
  }), [currentId, setCurrentId, delay, timeoutMs]);
  return React52.createElement(DelayGroupContext.Provider, {
    value
  }, children);
}
__name(FloatingDelayGroup, "FloatingDelayGroup");
function useDelayGroup(context3, options = {}) {
  const {
    id
  } = options;
  const groupContext = React52.useContext(DelayGroupContext);
  React52.useEffect(() => {
    if (!context3.open && groupContext.currentId === id) {
      groupContext.setCurrentId(null);
    }
  }, [context3.open, id]);
  React52.useEffect(() => {
    if (groupContext.currentId != null && groupContext.currentId !== id && context3.open) {
      context3.onOpenChange(false);
    }
  }, [groupContext.currentId, id, context3.open]);
  if (groupContext.currentId != null) {
    return {
      delay: {
        open: 1,
        close: getClose(groupContext.initialDelay)
      },
      currentId: groupContext.currentId
    };
  }
  return {
    delay: groupContext.initialDelay,
    currentId: groupContext.currentId
  };
}
__name(useDelayGroup, "useDelayGroup");
function getClose(delay) {
  if (typeof delay === "number") return delay;
  return delay?.close ?? 0;
}
__name(getClose, "getClose");

// node_modules/.pnpm/@hanzogui+floating@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-con_43c1d593784d5d460bb131d089718378/node_modules/@hanzogui/floating/dist/esm/middleware/inner.mjs
import * as ReactDOM4 from "react-dom";
function getArgsWithCustomFloatingHeight(state4, height) {
  return {
    ...state4,
    rects: {
      ...state4.rects,
      floating: {
        ...state4.rects.floating,
        height
      }
    }
  };
}
__name(getArgsWithCustomFloatingHeight, "getArgsWithCustomFloatingHeight");
var inner = /* @__PURE__ */ __name((props) => ({
  name: "inner",
  options: props,
  async fn(state4) {
    const {
      listRef,
      overflowRef,
      onFallbackChange,
      offset: innerOffset = 0,
      index: index2 = 0,
      minItemsVisible = 4,
      referenceOverflowThreshold = 0,
      scrollRef,
      padding = 0
    } = props;
    const {
      rects,
      elements: {
        floating
      }
    } = state4;
    const item = listRef.current?.[index2 ?? 0];
    const scrollEl = scrollRef?.current || floating;
    const clientTop = floating.clientTop || scrollEl.clientTop;
    const floatingIsBordered = floating.clientTop !== 0;
    const scrollElIsBordered = scrollEl.clientTop !== 0;
    const floatingIsScrollEl = floating === scrollEl;
    if (!item || index2 == null) {
      onFallbackChange?.(true);
      return {};
    }
    const nextArgs = {
      ...state4,
      ...await offset3(-item.offsetTop - floating.clientTop - rects.reference.height / 2 - item.offsetHeight / 2 - innerOffset).fn(state4)
    };
    const detectOverflowOptions = {
      padding
    };
    const overflow = await detectOverflow2(getArgsWithCustomFloatingHeight(nextArgs, scrollEl.scrollHeight + clientTop + floating.clientTop), detectOverflowOptions);
    const refOverflow = await detectOverflow2(nextArgs, {
      ...detectOverflowOptions,
      elementContext: "reference"
    });
    const diffY = Math.max(0, overflow.top);
    const nextY = nextArgs.y + diffY;
    const isScrollable = scrollEl.scrollHeight > scrollEl.clientHeight;
    const rounder = isScrollable ? (v) => v : Math.round;
    const maxHeight = rounder(Math.max(0, scrollEl.scrollHeight + (floatingIsBordered && floatingIsScrollEl || scrollElIsBordered ? clientTop * 2 : 0) - diffY - Math.max(0, overflow.bottom)));
    scrollEl.style.maxHeight = `${maxHeight}px`;
    scrollEl.scrollTop = diffY;
    if (onFallbackChange) {
      const shouldFallback = scrollEl.offsetHeight < item.offsetHeight * Math.min(minItemsVisible, listRef.current?.length ?? 0) - 1 || refOverflow.top >= -referenceOverflowThreshold || refOverflow.bottom >= -referenceOverflowThreshold;
      ReactDOM4.flushSync(() => onFallbackChange(shouldFallback));
    }
    if (overflowRef) {
      ;
      overflowRef.current = await detectOverflow2(getArgsWithCustomFloatingHeight({
        ...nextArgs,
        y: nextY
      }, scrollEl.offsetHeight + clientTop + floating.clientTop), detectOverflowOptions);
    }
    return {
      y: nextY
    };
  }
}), "inner");

// node_modules/.pnpm/@hanzogui+popper@7.3.0_expo@57.0.6_react-native@0.83.9_@babel+core@7.29.0_@react-native_3275946b7e3ca0597e90d93965009829/node_modules/@hanzogui/popper/dist/esm/Popper.mjs
import * as React53 from "react";
import { jsx as jsx31 } from "react/jsx-runtime";
var PopperContextFast = createStyledContext8(
  // since we always provide this we can avoid setting here
  {},
  "Popper__"
);
var {
  useStyledContext: usePopperContext,
  Provider: PopperProviderFast
} = PopperContextFast;
var PopperContextSlow = createStyledContext8(
  // since we always provide this we can avoid setting here
  {},
  "PopperSlow__"
);
var {
  useStyledContext: usePopperContextSlow,
  Provider: PopperProviderSlow
} = PopperContextSlow;
var PopperProvider = /* @__PURE__ */ __name(({
  scope,
  children,
  ...context3
}) => {
  const fns = React53.useRef(context3);
  fns.current = context3;
  const [slowContext] = React53.useState(() => ({
    refs: context3.refs,
    triggerElements: context3.triggerElements,
    update(...a) {
      fns.current.update(...a);
    },
    getReferenceProps(p) {
      return fns.current.getReferenceProps?.(p);
    },
    onHoverReference(e) {
      fns.current.onHoverReference?.(e);
    },
    onLeaveReference() {
      fns.current.onLeaveReference?.();
    }
  }));
  return /* @__PURE__ */ jsx31(PopperProviderFast, {
    scope,
    ...context3,
    children: /* @__PURE__ */ jsx31(PopperProviderSlow, {
      scope,
      ...slowContext,
      children
    })
  });
}, "PopperProvider");
var checkFloating = void 0;
var setupOptions = {};
function getSideAndAlignFromPlacement(placement) {
  const [side, align = "center"] = placement.split("-");
  return [side, align];
}
__name(getSideAndAlignFromPlacement, "getSideAndAlignFromPlacement");
var transformOriginMiddleware = /* @__PURE__ */ __name((options) => ({
  name: "transformOrigin",
  options,
  fn(data) {
    const {
      placement,
      rects,
      middlewareData
    } = data;
    const isArrowHidden = middlewareData.arrow?.centerOffset !== 0;
    const arrowWidth = isArrowHidden ? 0 : options.arrowWidth;
    const arrowHeight = isArrowHidden ? 0 : options.arrowHeight;
    const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
    const noArrowAlign = {
      start: "0%",
      center: "50%",
      end: "100%"
    }[placedAlign];
    const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2;
    const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2;
    let x = "";
    let y = "";
    if (placedSide === "bottom") {
      x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
      y = `${-arrowHeight}px`;
    } else if (placedSide === "top") {
      x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
      y = `${rects.floating.height + arrowHeight}px`;
    } else if (placedSide === "right") {
      x = `${-arrowHeight}px`;
      y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
    } else if (placedSide === "left") {
      x = `${rects.floating.width + arrowHeight}px`;
      y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
    }
    return {
      data: {
        x,
        y
      }
    };
  }
}), "transformOriginMiddleware");
function guiAutoUpdate(reference, floating, update2) {
  update2();
  let rafId2 = requestAnimationFrame(() => {
    update2();
    rafId2 = 0;
  });
  const cleanups = [() => {
    if (rafId2) cancelAnimationFrame(rafId2);
  }];
  if (reference instanceof HTMLElement) cleanups.push(registerLayoutNode(reference, update2));
  const ancestors = [...reference instanceof Element ? getOverflowAncestors(reference) : [], ...getOverflowAncestors(floating)];
  const uniqueAncestors = [...new Set(ancestors)];
  for (const ancestor of uniqueAncestors) ancestor.addEventListener("scroll", update2, {
    passive: true
  });
  window.addEventListener("resize", update2);
  cleanups.push(() => {
    for (const ancestor of uniqueAncestors) ancestor.removeEventListener("scroll", update2);
    window.removeEventListener("resize", update2);
  });
  return () => cleanups.forEach((fn) => fn());
}
__name(guiAutoUpdate, "guiAutoUpdate");
function Popper(props) {
  const {
    children,
    size: size4,
    strategy = "absolute",
    placement = "bottom",
    stayInFrame,
    allowFlip,
    offset: offset4,
    disableRTL,
    resize,
    passThrough,
    open,
    scope
  } = props;
  const [arrowEl, setArrow] = React53.useState(null);
  const [arrowSize, setArrowSize] = React53.useState(0);
  const offsetOptions = offset4 ?? arrowSize;
  const floatingStyle = React53.useRef({});
  const isOpen = passThrough ? false : open ?? true;
  const middlewareRef = React53.useRef([]);
  if (isOpen) middlewareRef.current = [typeof offsetOptions !== "undefined" ? offset3(offsetOptions) : null, allowFlip ? flip3(typeof allowFlip === "boolean" ? {} : allowFlip) : null, stayInFrame ? shift3({
    padding: 10,
    mainAxis: true,
    crossAxis: false,
    ...typeof stayInFrame === "object" ? stayInFrame : null
  }) : null, arrowEl ? arrow3({
    element: arrowEl
  }) : null, checkFloating, resize ? size3({
    padding: typeof stayInFrame === "object" ? stayInFrame.padding : 10,
    apply({
      availableHeight,
      availableWidth
    }) {
      if (passThrough) return;
      Object.assign(floatingStyle.current, {
        maxHeight: `${availableHeight}px`,
        maxWidth: `${availableWidth}px`
      });
      const floatingChild = floating.refs.floating.current?.firstChild;
      if (floatingChild && floatingChild instanceof HTMLElement) Object.assign(floatingChild.style, floatingStyle.current);
    },
    ...typeof resize === "object" && resize
  }) : null, size3({
    apply({
      elements,
      rects,
      availableWidth,
      availableHeight
    }) {
      const {
        width: anchorWidth,
        height: anchorHeight
      } = rects.reference;
      const contentStyle = elements.floating.style;
      contentStyle.setProperty("--gui-popper-available-width", `${availableWidth}px`);
      contentStyle.setProperty("--gui-popper-available-height", `${availableHeight}px`);
      contentStyle.setProperty("--gui-popper-anchor-width", `${anchorWidth}px`);
      contentStyle.setProperty("--gui-popper-anchor-height", `${anchorHeight}px`);
    }
  }), transformOriginMiddleware({
    arrowHeight: arrowSize,
    arrowWidth: arrowSize
  })].filter(Boolean);
  let floating = useFloating2({
    open: isOpen,
    strategy,
    placement,
    sameScrollView: false,
    whileElementsMounted: !isOpen ? void 0 : guiAutoUpdate,
    platform: disableRTL ?? setupOptions.disableRTL ? {
      ...platform,
      isRTL(element) {
        return false;
      }
    } : platform,
    middleware: middlewareRef.current
  });
  floating = React53.useMemo(() => {
    const og = floating.getFloatingProps;
    if (resize && og) floating.getFloatingProps = (props2) => {
      return og({
        ...props2,
        style: {
          ...props2.style,
          ...floatingStyle.current
        }
      });
    };
    return floating;
  }, [floating, resize ? JSON.stringify(resize) : null]);
  const {
    middlewareData
  } = floating;
  return /* @__PURE__ */ jsx31(PopperProvider, {
    scope,
    ...React53.useMemo(() => {
      return {
        size: size4,
        arrowRef: setArrow,
        arrowStyle: middlewareData.arrow,
        onArrowSize: setArrowSize,
        hasFloating: middlewareData.checkFloating?.hasFloating,
        transformOrigin: middlewareData.transformOrigin,
        open: !!open,
        ...floating
      };
    }, [open, size4, floating, JSON.stringify(middlewareData.arrow || null), JSON.stringify(middlewareData.transformOrigin || null)]),
    children: /* @__PURE__ */ jsx31(FloatingOverrideContext.Provider, {
      value: null,
      children
    })
  });
}
__name(Popper, "Popper");
var PopperAnchor = YStack.styleable(/* @__PURE__ */ __name(function PopperAnchor2(props, forwardedRef) {
  const {
    virtualRef,
    scope,
    ...rest
  } = props;
  const context3 = usePopperContextSlow(scope);
  const {
    getReferenceProps,
    refs,
    update: update2
  } = context3;
  const ref = React53.useRef(null);
  const triggerId = React53.useId();
  React53.useEffect(() => {
    if (!scope || !context3.triggerElements || !ref.current) return;
    if (!(ref.current instanceof Element)) return;
    const el = ref.current;
    context3.triggerElements.add(triggerId, el);
    return () => {
      context3.triggerElements?.delete(triggerId);
    };
  }, [scope, triggerId, context3.triggerElements]);
  React53.useEffect(() => {
    if (virtualRef) {
      refs.setReference(virtualRef.current);
      update2();
    }
  }, [virtualRef]);
  const refProps = getReferenceProps?.({
    ...rest,
    ref
  }) || null;
  const safeSetReference = React53.useCallback(
    (node) => {
      startTransition(() => {
        refs.setReference(node);
      });
    },
    // it was refs.setRefernce but its stable and refs is undefined on server
    [refs]
  );
  const shouldHandleInHover = isWeb && scope;
  const composedRefs = useComposedRefs(
    forwardedRef,
    ref,
    // web handles this onMouseEnter below so it can support multiple targets + hovering
    shouldHandleInHover ? void 0 : safeSetReference
  );
  return /* @__PURE__ */ jsx31(GuiView, {
    ...rest,
    ...refProps,
    ref: composedRefs,
    ...shouldHandleInHover && {
      onMouseEnter: /* @__PURE__ */ __name((e) => {
        const el = e.currentTarget ?? ref.current;
        if (el instanceof HTMLElement) {
          flushSync5(() => refs.setReference(el));
          update2();
          if (!refProps) return;
          refProps.onPointerEnter?.(e);
          context3.onHoverReference?.(e.nativeEvent);
        }
      }, "onMouseEnter"),
      onMouseLeave: /* @__PURE__ */ __name((e) => {
        context3.onLeaveReference?.();
        refProps?.onMouseLeave?.(e);
      }, "onMouseLeave")
    }
  });
}, "PopperAnchor2"));
var PopperContentFrame = styled18(YStack, {
  name: "PopperContent",
  variants: {
    unstyled: {
      true: {}
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, {
        tokens
      }) => {
        return {
          padding: tokens.space[val],
          borderRadius: tokens.radius[val]
        };
      }, "...size")
    }
  }
});
var PopperContent = React53.forwardRef(/* @__PURE__ */ __name(function PopperContent2(props, forwardedRef) {
  const {
    scope,
    animatePosition,
    enableAnimationForPositionChange,
    children,
    passThrough,
    unstyled,
    ...rest
  } = props;
  const animatePos = animatePosition ?? enableAnimationForPositionChange;
  const context3 = usePopperContext(scope);
  const {
    strategy,
    placement,
    refs,
    x,
    y,
    getFloatingProps,
    size: size4,
    isPositioned,
    transformOrigin,
    update: update2
  } = context3;
  const updateRef = React53.useRef(update2);
  updateRef.current = update2;
  const lastNodeRef = React53.useRef(null);
  const safeSetFloating = React53.useCallback((node) => {
    const isNewNode = node !== lastNodeRef.current;
    if (node) {
      lastNodeRef.current = node;
      refs.setFloating(node);
      if (!isNewNode) updateRef.current?.();
    }
  }, [refs.setFloating]);
  React53.useEffect(() => {
    return () => {
      const ourNode = lastNodeRef.current;
      if (ourNode && refs.floating.current === ourNode) refs.setFloating(null);
      lastNodeRef.current = null;
    };
  }, []);
  const contentRefs = useComposedRefs(safeSetFloating, forwardedRef);
  const [needsMeasure, setNeedsMeasure] = React53.useState(animatePos);
  useIsomorphicLayoutEffect(() => {
    if (needsMeasure && x && y) setNeedsMeasure(false);
  }, [needsMeasure, animatePos, x, y]);
  const hasBeenPositioned = React53.useRef(false);
  const lastGoodPosition = React53.useRef({
    x: 0,
    y: 0
  });
  if (x !== 0 || y !== 0) {
    lastGoodPosition.current = {
      x,
      y
    };
    if (isPositioned) hasBeenPositioned.current = true;
  }
  const brieflyZero = hasBeenPositioned.current && x === 0 && y === 0;
  const effectiveX = brieflyZero ? lastGoodPosition.current.x : x;
  const effectiveY = brieflyZero ? lastGoodPosition.current.y : y;
  const hide4 = !hasBeenPositioned.current && effectiveX === 0 && effectiveY === 0;
  const disableAnimationProp = animatePos === "even-when-repositioning" ? needsMeasure : !hasBeenPositioned.current && !isPositioned || needsMeasure;
  const [disableAnimation, setDisableAnimation] = React53.useState(disableAnimationProp);
  React53.useEffect(() => {
    setDisableAnimation(disableAnimationProp);
  }, [disableAnimationProp]);
  const frameProps = {
    ref: contentRefs,
    ...hide4 ? {} : {
      x: effectiveX || 0,
      y: effectiveY || 0
    },
    top: 0,
    left: 0,
    position: strategy,
    opacity: hide4 ? 0 : 1,
    ...animatePos && {
      transition: rest.transition,
      animateOnly: disableAnimation ? [] : rest.animateOnly,
      animatePresence: false
    }
  };
  const {
    style,
    ...floatingProps
  } = getFloatingProps ? getFloatingProps(frameProps) : frameProps;
  const transformOriginStyle = isWeb && transformOrigin ? {
    transformOrigin: `${transformOrigin.x} ${transformOrigin.y}`
  } : void 0;
  return /* @__PURE__ */ jsx31(LayoutMeasurementController2, {
    disable: !context3.open,
    children: /* @__PURE__ */ jsx31(GuiView, {
      passThrough,
      ref: contentRefs,
      direction: rest.direction,
      ...passThrough ? null : floatingProps,
      ...!passThrough && animatePos && {
        "data-popper-animate-position": "true"
      },
      children: /* @__PURE__ */ jsx31(PopperContentFrame, {
        passThrough,
        unstyled,
        ...!passThrough && {
          "data-placement": placement,
          "data-strategy": strategy,
          size: size4,
          ...style,
          ...transformOriginStyle,
          ...rest
        },
        children
      }, "popper-content-frame")
    })
  });
}, "PopperContent2"));
var PopperArrowFrame = styled18(YStack, {
  name: "PopperArrow",
  variants: {
    unstyled: {
      false: {
        borderColor: "$borderColor",
        backgroundColor: "$background",
        position: "relative"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var PopperArrowOuterFrame = styled18(YStack, {
  name: "PopperArrowOuter",
  variants: {
    unstyled: {
      false: {
        position: "absolute",
        zIndex: 1e6,
        pointerEvents: "none",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var opposites = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
};
var PopperArrow = React53.forwardRef(/* @__PURE__ */ __name(function PopperArrow2(propsIn, forwardedRef) {
  const {
    scope,
    animatePosition,
    transition: transition2,
    ...rest
  } = propsIn;
  const {
    offset: offset4,
    size: sizeProp,
    borderWidth = 0,
    ...arrowProps
  } = rest;
  const context3 = usePopperContext(scope);
  const sizeVal = typeof sizeProp === "number" ? sizeProp : getVariableValue5(getSpace(sizeProp ?? context3.size, {
    shift: -2,
    bounds: [2]
  }));
  const size4 = Math.max(0, +sizeVal);
  const {
    placement
  } = context3;
  const refs = useComposedRefs(context3.arrowRef, forwardedRef);
  const x = context3.arrowStyle?.x || 0;
  const y = context3.arrowStyle?.y || 0;
  const arrowPositioned = context3.arrowStyle != null;
  const primaryPlacement = placement ? placement.split("-")[0] : "top";
  const arrowStyle = {
    x,
    y,
    width: size4,
    height: size4
  };
  const innerArrowStyle = {};
  const isVertical = primaryPlacement === "bottom" || primaryPlacement === "top";
  if (primaryPlacement) {
    arrowStyle[isVertical ? "width" : "height"] = size4 * 2;
    const oppSide = opposites[primaryPlacement];
    if (oppSide) {
      arrowStyle[oppSide] = -size4;
      innerArrowStyle[oppSide] = size4 / 2;
    }
    if (oppSide === "top" || oppSide === "bottom") arrowStyle.left = 0;
    if (oppSide === "left" || oppSide === "right") arrowStyle.top = 0;
    useIsomorphicLayoutEffect(() => {
      context3.onArrowSize?.(size4);
    }, [size4, context3.onArrowSize]);
  }
  return /* @__PURE__ */ jsx31(PopperArrowOuterFrame, {
    ref: refs,
    ...arrowStyle,
    ...!arrowPositioned && {
      opacity: 0
    },
    ...animatePosition && {
      transition: transition2,
      animateOnly: ["transform"],
      animatePresence: false
    },
    children: /* @__PURE__ */ jsx31(PopperArrowFrame, {
      width: size4,
      height: size4,
      ...arrowProps,
      ...innerArrowStyle,
      rotate: "45deg",
      ...primaryPlacement === "bottom" && {
        borderLeftWidth: borderWidth,
        borderTopWidth: borderWidth
      },
      ...primaryPlacement === "top" && {
        borderBottomWidth: borderWidth,
        borderRightWidth: borderWidth
      },
      ...primaryPlacement === "right" && {
        borderLeftWidth: borderWidth,
        borderBottomWidth: borderWidth
      },
      ...primaryPlacement === "left" && {
        borderTopWidth: borderWidth,
        borderRightWidth: borderWidth
      }
    })
  });
}, "PopperArrow2"));

// node_modules/.pnpm/@hanzogui+roving-focus@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0._5c69b7cccf8c4d3bb6c44d85c0d3c38a/node_modules/@hanzogui/roving-focus/dist/esm/RovingFocusGroup.mjs
import { Slot as Slot3, View as View9, createStyledContext as createStyledContext9, useEvent as useEvent3 } from "@hanzogui/core";
import * as React54 from "react";
import { jsx as jsx32 } from "react/jsx-runtime";
var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
var EVENT_OPTIONS2 = {
  bubbles: false,
  cancelable: true
};
var RovingFocusGroupImpl = React54.forwardRef((props, forwardedRef) => {
  const {
    __scopeRovingFocusGroup,
    orientation,
    loop = false,
    dir,
    currentTabStopId: currentTabStopIdProp,
    defaultCurrentTabStopId,
    onCurrentTabStopIdChange,
    onEntryFocus,
    asChild,
    ...groupProps
  } = props;
  const ref = React54.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const direction = useDirection(dir);
  const [currentTabStopId = null, setCurrentTabStopId] = useControllableState({
    prop: currentTabStopIdProp,
    defaultProp: defaultCurrentTabStopId ?? null,
    onChange: onCurrentTabStopIdChange
  });
  const [isTabbingBackOut, setIsTabbingBackOut] = React54.useState(false);
  const handleEntryFocus = useEvent3(onEntryFocus);
  const getItems = useCollection(__scopeRovingFocusGroup || ROVING_FOCUS_GROUP_CONTEXT);
  const isClickFocusRef = React54.useRef(false);
  const [focusableItemsCount, setFocusableItemsCount] = React54.useState(0);
  const Comp = asChild ? Slot3 : View9;
  return /* @__PURE__ */ jsx32(RovingFocusProvider, {
    scope: __scopeRovingFocusGroup,
    orientation,
    dir: direction,
    loop,
    currentTabStopId,
    onItemFocus: React54.useCallback((tabStopId) => setCurrentTabStopId(tabStopId), [setCurrentTabStopId]),
    onItemShiftTab: React54.useCallback(() => setIsTabbingBackOut(true), []),
    onFocusableItemAdd: React54.useCallback(() => setFocusableItemsCount((prevCount) => prevCount + 1), []),
    onFocusableItemRemove: React54.useCallback(() => setFocusableItemsCount((prevCount) => prevCount - 1), []),
    children: /* @__PURE__ */ jsx32(Comp, {
      tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
      "data-orientation": orientation,
      ...groupProps,
      ref: composedRefs,
      outlineStyle: "none",
      onMouseDown: composeEventHandlers(props.onMouseDown, () => {
        isClickFocusRef.current = true;
      }),
      onFocus: composeEventHandlers(props.onFocus, (event) => {
        const isKeyboardFocus = !isClickFocusRef.current;
        if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
          const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS2);
          handleEntryFocus(entryFocusEvent);
          if (!entryFocusEvent.defaultPrevented) {
            const items = getItems().filter((item) => item.focusable);
            const activeItem = items.find((item) => item.active);
            const currentItem = items.find((item) => item.id === currentTabStopId);
            const candidateItems = [activeItem, currentItem, ...items].filter(Boolean);
            const candidateNodes = candidateItems.map((item) => item.ref.current);
            focusFirst2(candidateNodes, {
              focusVisible: false
            });
          }
        }
        isClickFocusRef.current = false;
      }),
      onBlur: composeEventHandlers(props.onBlur, () => setIsTabbingBackOut(false))
    })
  });
});
var ITEM_NAME = "RovingFocusGroupItem";
var RovingFocusGroupItem = React54.forwardRef((props, forwardedRef) => {
  const {
    __scopeRovingFocusGroup,
    focusable = true,
    active = false,
    tabStopId,
    ...itemProps
  } = props;
  const autoId = React54.useId();
  const id = tabStopId || autoId;
  const context3 = useRovingFocusContext(__scopeRovingFocusGroup);
  const isCurrentTabStop = context3.currentTabStopId === id;
  const getItems = useCollection(__scopeRovingFocusGroup || ROVING_FOCUS_GROUP_CONTEXT);
  const {
    onFocusableItemAdd,
    onFocusableItemRemove
  } = context3;
  React54.useEffect(() => {
    if (focusable) {
      onFocusableItemAdd();
      return () => onFocusableItemRemove();
    }
  }, [focusable, onFocusableItemAdd, onFocusableItemRemove]);
  return /* @__PURE__ */ jsx32(Collection.ItemSlot, {
    scope: __scopeRovingFocusGroup || ROVING_FOCUS_GROUP_CONTEXT,
    id,
    focusable,
    active,
    children: /* @__PURE__ */ jsx32(View9, {
      tabIndex: focusable ? 0 : -1,
      "data-orientation": context3.orientation,
      ...itemProps,
      ref: forwardedRef,
      onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
        if (!focusable) event.preventDefault();
        else context3.onItemFocus(id);
      }),
      onFocus: composeEventHandlers(props.onFocus, () => context3.onItemFocus(id)),
      ...isWeb && {
        onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
          if (event.key === "Tab" && event.shiftKey) {
            context3.onItemShiftTab();
            return;
          }
          if (event.target !== event.currentTarget) return;
          const focusIntent = getFocusIntent(event, context3.orientation, context3.dir);
          if (focusIntent !== void 0) {
            event.preventDefault();
            const items = getItems().filter((item) => item.focusable);
            let candidateNodes = items.map((item) => item.ref.current);
            if (focusIntent === "last") candidateNodes.reverse();
            else if (focusIntent === "prev" || focusIntent === "next") {
              if (focusIntent === "prev") candidateNodes.reverse();
              const currentIndex = candidateNodes.indexOf(event.currentTarget);
              candidateNodes = context3.loop ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
            }
            setTimeout(() => focusFirst2(candidateNodes, {
              focusVisible: true
            }));
          }
        })
      }
    })
  });
});
RovingFocusGroupItem.displayName = ITEM_NAME;
var GROUP_NAME2 = "RovingFocusGroup";
var [Collection, useCollection] = createCollection(GROUP_NAME2);
var {
  Provider: RovingFocusProvider,
  useStyledContext: useRovingFocusContext
} = createStyledContext9();
var ROVING_FOCUS_GROUP_CONTEXT = "RovingFocusGroupContext";
var RovingFocusGroup = withStaticProperties(React54.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ jsx32(Collection.Provider, {
    scope: props.__scopeRovingFocusGroup || ROVING_FOCUS_GROUP_CONTEXT,
    children: /* @__PURE__ */ jsx32(Collection.Slot, {
      scope: props.__scopeRovingFocusGroup || ROVING_FOCUS_GROUP_CONTEXT,
      children: /* @__PURE__ */ jsx32(RovingFocusGroupImpl, {
        ...props,
        ref: forwardedRef
      })
    })
  });
}), {
  Item: RovingFocusGroupItem
});
RovingFocusGroup.displayName = GROUP_NAME2;
var MAP_KEY_TO_FOCUS_INTENT = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function getDirectionAwareKey(key, dir) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
__name(getDirectionAwareKey, "getDirectionAwareKey");
function getFocusIntent(event, orientation, dir) {
  const key = getDirectionAwareKey(event.key, dir);
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
  return MAP_KEY_TO_FOCUS_INTENT[key];
}
__name(getFocusIntent, "getFocusIntent");
function focusFirst2(candidates, options) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({
      focusVisible: options?.focusVisible
    });
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
__name(focusFirst2, "focusFirst");
function wrapArray(array, startIndex) {
  return array.map((_, index2) => array[(startIndex + index2) % array.length]);
}
__name(wrapArray, "wrapArray");

// node_modules/.pnpm/@hanzogui+create-menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web_76535c0d992028a40b29ad0f5fefbc22/node_modules/@hanzogui/create-menu/dist/esm/createBaseMenu.mjs
import { composeEventHandlers as composeEventHandlers3, composeRefs as composeRefs2, createStyledContext as createStyledContext10, isWeb as isWeb3, styled as styled20, Text as Text4, Theme as Theme2, useComposedRefs as useComposedRefs2, useIsTouchDevice, useThemeName as useThemeName4, View as View11, withStaticProperties as withStaticProperties4 } from "@hanzogui/web";
import * as React55 from "react";
import { useId as useId11 } from "react";

// node_modules/.pnpm/@hanzogui+create-menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web_76535c0d992028a40b29ad0f5fefbc22/node_modules/@hanzogui/create-menu/dist/esm/MenuPredefined.mjs
import { styled as styled19, View as View10 } from "@hanzogui/web";
var GROUP_NAME3 = "MenuGroup";
var MenuGroup = styled19(View10, {
  name: GROUP_NAME3,
  variants: {
    unstyled: {
      false: {
        role: "group",
        width: "100%",
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "$borderColor",
        overflow: "hidden",
        backgroundColor: "$background"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var LABEL_NAME = "MenuLabel";
var MenuLabel = styled19(SizableText2, {
  name: LABEL_NAME,
  variants: {
    unstyled: {
      false: {
        cursor: "default",
        color: "$color"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SEPARATOR_NAME = "MenuSeparator";
var MenuSeparator = styled19(View10, {
  name: SEPARATOR_NAME,
  role: "separator",
  // @ts-ignore
  "aria-orientation": "horizontal",
  variants: {
    unstyled: {
      false: {
        borderColor: "$borderColor",
        flexShrink: 0,
        borderWidth: 0,
        height: 1,
        marginVertical: 3,
        marginHorizontal: 10,
        backgroundColor: "$borderColor"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var MenuIcon = styled19(View10, {
  name: "MenuIcon",
  variants: {
    unstyled: {
      false: {
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "auto"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var MenuImage = styled19(Image, {
  name: "MenuImage"
});
var MenuIndicator = styled19(View10, {
  name: "MenuIndicator",
  variants: {
    unstyled: {
      false: {
        justifyContent: "center",
        alignItems: "center",
        marginLeft: "auto"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var MenuItem = styled19(View10, {
  name: "MenuItem",
  variants: {
    unstyled: {
      false: {
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        cursor: "pointer",
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        // use focusStyle for highlight since hover triggers focus via onPointerMove
        // this ensures a single unified highlight for both mouse and keyboard
        focusStyle: {
          backgroundColor: "$backgroundHover"
        },
        pressStyle: {
          backgroundColor: "$backgroundPress"
        }
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var Title = styled19(SizableText2, {
  name: "MenuTitle",
  variants: {
    unstyled: {
      false: {
        cursor: "default",
        color: "$color",
        flexGrow: 1,
        flexShrink: 1
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SubTitle = styled19(SizableText2, {
  name: "MenuSubTitle",
  variants: {
    unstyled: {
      false: {
        cursor: "default",
        color: "$colorFaint"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var MenuPredefined = {
  MenuIcon,
  MenuImage,
  MenuIndicator,
  MenuItem,
  Title,
  SubTitle,
  MenuGroup,
  MenuSeparator,
  MenuLabel
};

// node_modules/.pnpm/@hanzogui+create-menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web_76535c0d992028a40b29ad0f5fefbc22/node_modules/@hanzogui/create-menu/dist/esm/createBaseMenu.mjs
import { Fragment as Fragment9, jsx as jsx33, jsxs as jsxs6 } from "react/jsx-runtime";
function whenMouse(handler) {
  return (event) => event.pointerType === "mouse" ? handler(event) : void 0;
}
__name(whenMouse, "whenMouse");
var SELECTION_KEYS = ["Enter", " "];
var FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
var LAST_KEYS = ["ArrowUp", "PageDown", "End"];
var FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
var SUB_OPEN_KEYS = {
  ltr: [...SELECTION_KEYS, "ArrowRight"],
  rtl: [...SELECTION_KEYS, "ArrowLeft"]
};
var SUB_CLOSE_KEYS = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"]
};
var MENU_NAME = "Menu";
var [Collection2, useCollection2] = createCollection(MENU_NAME);
var {
  Provider: MenuProvider,
  useStyledContext: useMenuContext
} = createStyledContext10();
var {
  Provider: MenuRootProvider,
  useStyledContext: useMenuRootContext
} = createStyledContext10();
var MENU_CONTEXT = "MenuContext";
function createBaseMenu({
  Item: _Item = MenuPredefined.MenuItem,
  Title: _Title = MenuPredefined.Title,
  SubTitle: _SubTitle = MenuPredefined.SubTitle,
  Image: _Image = MenuPredefined.MenuImage,
  Icon: _Icon = MenuPredefined.MenuIcon,
  Indicator: _Indicator = MenuPredefined.MenuIndicator,
  Separator: _Separator = MenuPredefined.MenuSeparator,
  MenuGroup: _MenuGroup = MenuPredefined.MenuGroup,
  Label: _Label = MenuPredefined.MenuLabel
}) {
  const MenuComp = /* @__PURE__ */ __name((props) => {
    const direction = useDirection(props.dir);
    const defaultPlacement = direction === "rtl" ? "bottom-end" : "bottom-start";
    const {
      scope = MENU_CONTEXT,
      open = false,
      children,
      dir,
      onOpenChange,
      modal = true,
      allowFlip = {
        padding: 10
      },
      stayInFrame = {
        padding: 10
      },
      placement = defaultPlacement,
      resize = true,
      offset: offset4 = 10,
      ...rest
    } = props;
    const [content, setContent] = React55.useState(null);
    const isUsingKeyboardRef = React55.useRef(false);
    const handleOpenChange = useCallbackRef(onOpenChange);
    if (isWeb3) {
      React55.useEffect(() => {
        const handleKeyDown = /* @__PURE__ */ __name(() => {
          isUsingKeyboardRef.current = true;
          document.addEventListener("pointerdown", handlePointer, {
            capture: true,
            once: true
          });
          document.addEventListener("pointermove", handlePointer, {
            capture: true,
            once: true
          });
        }, "handleKeyDown");
        const handlePointer = /* @__PURE__ */ __name(() => isUsingKeyboardRef.current = false, "handlePointer");
        document.addEventListener("keydown", handleKeyDown, {
          capture: true
        });
        return () => {
          document.removeEventListener("keydown", handleKeyDown, {
            capture: true
          });
          document.removeEventListener("pointerdown", handlePointer, {
            capture: true
          });
          document.removeEventListener("pointermove", handlePointer, {
            capture: true
          });
        };
      }, []);
    }
    return /* @__PURE__ */ jsx33(Popper, {
      scope,
      open,
      placement,
      allowFlip,
      stayInFrame,
      resize,
      offset: offset4,
      ...rest,
      children: /* @__PURE__ */ jsx33(MenuProvider, {
        scope,
        open,
        onOpenChange: handleOpenChange,
        content,
        onContentChange: setContent,
        children: /* @__PURE__ */ jsx33(MenuRootProvider, {
          scope,
          open,
          onClose: React55.useCallback(() => handleOpenChange(false), [handleOpenChange]),
          isUsingKeyboardRef,
          dir: direction,
          modal,
          children: /* @__PURE__ */ jsx33(MenuSubProvider, {
            scope,
            children
          })
        })
      })
    });
  }, "MenuComp");
  const RepropagateMenuAndMenuRootProvider = /* @__PURE__ */ __name((props) => {
    const {
      scope = MENU_CONTEXT,
      menuContext,
      rootContext,
      popperContext,
      menuSubContext,
      children
    } = props;
    return /* @__PURE__ */ jsx33(PopperProvider, {
      ...popperContext,
      scope,
      children: /* @__PURE__ */ jsx33(MenuProvider, {
        scope,
        ...menuContext,
        children: /* @__PURE__ */ jsx33(MenuRootProvider, {
          scope,
          ...rootContext,
          children: menuSubContext ? /* @__PURE__ */ jsx33(MenuSubProvider, {
            scope,
            ...menuSubContext,
            children
          }) : children
        })
      })
    });
  }, "RepropagateMenuAndMenuRootProvider");
  MenuComp.displayName = MENU_NAME;
  const ANCHOR_NAME = "MenuAnchor";
  const MenuAnchor = /* @__PURE__ */ __name((props) => {
    return /* @__PURE__ */ jsx33(PopperAnchor, {
      scope: MENU_CONTEXT,
      ...props
    });
  }, "MenuAnchor");
  MenuAnchor.displayName = ANCHOR_NAME;
  const PORTAL_NAME = "MenuPortal";
  const {
    Provider: PortalProvider2,
    useStyledContext: usePortalContext
  } = createStyledContext10(void 0, "Portal");
  const MenuPortal = /* @__PURE__ */ __name((props) => {
    const {
      scope = MENU_CONTEXT,
      forceMount,
      zIndex,
      children
    } = props;
    const menuContext = useMenuContext(scope);
    const rootContext = useMenuRootContext(scope);
    const popperContext = usePopperContext(scope);
    const menuSubContext = useMenuSubContext(scope);
    const themeName = useThemeName4();
    const themedChildren = /* @__PURE__ */ jsx33(Theme2, {
      forceClassName: true,
      name: themeName,
      children
    });
    const content = needsPortalRepropagation() ? /* @__PURE__ */ jsx33(RepropagateMenuAndMenuRootProvider, {
      menuContext,
      rootContext,
      popperContext,
      menuSubContext,
      scope,
      children: themedChildren
    }) : themedChildren;
    const isPresent = forceMount || rootContext.open && menuContext.open;
    return /* @__PURE__ */ jsx33(Animate, {
      type: "presence",
      present: isPresent,
      children: /* @__PURE__ */ jsx33(Portal, {
        stackZIndex: true,
        children: /* @__PURE__ */ jsx33(Fragment9, {
          children: /* @__PURE__ */ jsx33(PortalProvider2, {
            scope,
            forceMount,
            children: /* @__PURE__ */ jsxs6(View11, {
              zIndex: zIndex || 100,
              inset: 0,
              position: "absolute",
              children: [!!menuContext.open && !isWeb3 && /* @__PURE__ */ jsx33(View11, {
                inset: 0,
                position: "absolute",
                onPress: /* @__PURE__ */ __name(() => menuContext.onOpenChange(!menuContext.open), "onPress")
              }), content]
            })
          })
        })
      })
    });
  }, "MenuPortal");
  MenuPortal.displayName = PORTAL_NAME;
  const CONTENT_NAME4 = "MenuContent";
  const {
    Provider: MenuContentProvider,
    useStyledContext: useMenuContentContext
  } = createStyledContext10();
  const MenuContentFrame = styled20(PopperContentFrame, {
    name: CONTENT_NAME4
  });
  const MenuContent = MenuContentFrame.styleable((props, forwardedRef) => {
    const scope = props.scope || MENU_CONTEXT;
    const portalContext = usePortalContext(scope);
    const {
      forceMount = portalContext.forceMount,
      ...contentProps
    } = props;
    const rootContext = useMenuRootContext(scope);
    return /* @__PURE__ */ jsx33(Collection2.Provider, {
      scope,
      children: /* @__PURE__ */ jsx33(Collection2.Slot, {
        scope,
        children: rootContext.modal ? /* @__PURE__ */ jsx33(MenuRootContentModal, {
          ...contentProps,
          ref: forwardedRef
        }) : /* @__PURE__ */ jsx33(MenuRootContentNonModal, {
          ...contentProps,
          ref: forwardedRef
        })
      })
    });
  });
  const MenuRootContentModal = React55.forwardRef((props, forwardedRef) => {
    const scope = props.scope || MENU_CONTEXT;
    const context3 = useMenuContext(scope);
    const ref = React55.useRef(null);
    const composedRefs = useComposedRefs2(forwardedRef, ref);
    return /* @__PURE__ */ jsx33(MenuContentImpl, {
      ...props,
      scope,
      ref: composedRefs,
      trapFocus: context3.open,
      disableOutsidePointerEvents: context3.open,
      disableOutsideScroll: false,
      onFocusOutside: composeEventHandlers3(props.onFocusOutside, (event) => event.preventDefault(), {
        checkDefaultPrevented: false
      }),
      onDismiss: /* @__PURE__ */ __name(() => context3.onOpenChange(false), "onDismiss")
    });
  });
  const MenuRootContentNonModal = React55.forwardRef((props, forwardedRef) => {
    const scope = props.scope || MENU_CONTEXT;
    const context3 = useMenuContext(scope);
    return /* @__PURE__ */ jsx33(MenuContentImpl, {
      ...props,
      scope,
      ref: forwardedRef,
      trapFocus: false,
      disableOutsidePointerEvents: false,
      disableOutsideScroll: false,
      onDismiss: /* @__PURE__ */ __name(() => context3.onOpenChange(false), "onDismiss")
    });
  });
  const MenuContentImpl = React55.forwardRef((props, forwardedRef) => {
    const {
      scope = MENU_CONTEXT,
      loop = false,
      trapFocus,
      onOpenAutoFocus,
      onCloseAutoFocus,
      disableOutsidePointerEvents,
      onEntryFocus,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
      disableOutsideScroll,
      disableDismissOnScroll = false,
      unstyled = process.env.GUI_HEADLESS === "1",
      ...contentProps
    } = props;
    const context3 = useMenuContext(scope);
    const rootContext = useMenuRootContext(scope);
    const getItems = useCollection2(scope);
    const [currentItemId, setCurrentItemId] = React55.useState(null);
    const contentRef = React55.useRef(null);
    const focusableContentRef = React55.useRef(null);
    const composedRefs = useComposedRefs2(forwardedRef, contentRef, context3.onContentChange);
    const timerRef = React55.useRef(0);
    const searchRef = React55.useRef("");
    const pointerGraceTimerRef = React55.useRef(0);
    const pointerGraceIntentRef = React55.useRef(null);
    const pointerDirRef = React55.useRef("right");
    const lastPointerXRef = React55.useRef(0);
    const handleTypeaheadSearch = /* @__PURE__ */ __name((key) => {
      const search = searchRef.current + key;
      const items = getItems().filter((item) => !item.disabled);
      const currentItem = document.activeElement;
      const currentMatch = items.find((item) => item.ref.current === currentItem)?.textValue;
      const values = items.map((item) => item.textValue);
      const nextMatch = getNextMatch(values, search, currentMatch);
      const newItem = items.find((item) => item.textValue === nextMatch)?.ref.current;
      (/* @__PURE__ */ __name((function updateSearch(value) {
        searchRef.current = value;
        clearTimeout(timerRef.current);
        if (value !== "") timerRef.current = setTimeout(() => updateSearch(""), 1e3);
      }), "updateSearch"))(search);
      if (newItem) {
        setTimeout(() => newItem.focus());
      }
    }, "handleTypeaheadSearch");
    React55.useEffect(() => {
      return () => clearTimeout(timerRef.current);
    }, []);
    React55.useEffect(() => {
      if (!isWeb3 || !context3.open) return;
      const frame = requestAnimationFrame(() => {
        const container = contentRef.current;
        const el = container?.querySelector("[data-gui-menu-content]");
        if (el) focusableContentRef.current = el;
      });
      return () => cancelAnimationFrame(frame);
    }, [context3.open]);
    React55.useEffect(() => {
      if (!isWeb3 || disableDismissOnScroll || !context3.open) return;
      const handleScroll = /* @__PURE__ */ __name((event) => {
        const target = event.target;
        if (contentRef.current?.contains(target)) return;
        onDismiss?.();
      }, "handleScroll");
      window.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true
      });
      return () => {
        window.removeEventListener("scroll", handleScroll, {
          capture: true
        });
      };
    }, [disableDismissOnScroll, context3.open, onDismiss]);
    if (isWeb3) {
      useFocusGuards();
    }
    const isPointerMovingToSubmenu = React55.useCallback((event) => {
      const isMovingTowards = pointerDirRef.current === pointerGraceIntentRef.current?.side;
      const inArea = isPointerInGraceArea(event, pointerGraceIntentRef.current?.area);
      return isMovingTowards && inArea;
    }, []);
    const content = /* @__PURE__ */ jsx33(PopperContent, {
      role: "menu",
      tabIndex: -1,
      unstyled,
      ...!unstyled && {
        backgroundColor: "$background",
        borderWidth: 1,
        borderColor: "$borderColor",
        outlineWidth: 0,
        minWidth: 180
      },
      "aria-orientation": "vertical",
      "data-state": getOpenState(context3.open),
      "data-gui-menu-content": "",
      dir: rootContext.dir,
      scope: scope || MENU_CONTEXT,
      ...contentProps,
      ref: composedRefs,
      className: contentProps.transition ? void 0 : contentProps.className,
      ...isWeb3 ? {
        onKeyDown: composeEventHandlers3(contentProps.onKeyDown, (event) => {
          const target = event.target;
          const isKeyDownInside = target.closest("[data-gui-menu-content]") === event.currentTarget;
          const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
          const isCharacterKey = event.key.length === 1;
          if (isKeyDownInside) {
            if (event.key === "Tab") event.preventDefault();
            if (!isModifierKey && isCharacterKey) handleTypeaheadSearch(event.key);
          }
          const isOnContentFrame = event.target.hasAttribute("data-gui-menu-content");
          if (!isKeyDownInside || !isOnContentFrame) return;
          if (!FIRST_LAST_KEYS.includes(event.key)) return;
          event.preventDefault();
          const items = getItems().filter((item) => !item.disabled);
          const candidateNodes = items.map((item) => item.ref.current);
          if (LAST_KEYS.includes(event.key)) candidateNodes.reverse();
          focusFirst3(candidateNodes, {
            focusVisible: true
          });
        }),
        // TODO
        // @ts-ignore
        onBlur: composeEventHandlers3(props.onBlur, (event) => {
          if (!event.currentTarget?.contains(event.target)) {
            clearTimeout(timerRef.current);
            searchRef.current = "";
          }
        }),
        // TODO
        onPointerMove: composeEventHandlers3(props.onPointerMove, (event) => {
          if (event.pointerType !== "mouse") return;
          const target = event.target;
          const pointerXHasChanged = lastPointerXRef.current !== event.clientX;
          if (event.currentTarget?.contains(target) && pointerXHasChanged) {
            const newDir = event.clientX > lastPointerXRef.current ? "right" : "left";
            pointerDirRef.current = newDir;
            lastPointerXRef.current = event.clientX;
          }
        })
      } : {}
    });
    return /* @__PURE__ */ jsx33(MenuContentProvider, {
      scope,
      searchRef,
      onItemEnter: React55.useCallback((event) => {
        if (isPointerMovingToSubmenu(event)) event.preventDefault();
      }, [isPointerMovingToSubmenu]),
      onItemLeave: React55.useCallback((event) => {
        if (isPointerMovingToSubmenu(event)) return;
        focusableContentRef.current?.focus();
        setCurrentItemId(null);
      }, [isPointerMovingToSubmenu]),
      onTriggerLeave: React55.useCallback((event) => {
        if (isPointerMovingToSubmenu(event)) event.preventDefault();
      }, [isPointerMovingToSubmenu]),
      pointerGraceTimerRef,
      onPointerGraceIntentChange: React55.useCallback((intent) => {
        pointerGraceIntentRef.current = intent;
      }, []),
      children: /* @__PURE__ */ jsx33(RemoveScroll, {
        enabled: disableOutsideScroll,
        children: /* @__PURE__ */ jsx33(FocusScope, {
          asChild: false,
          trapped: trapFocus,
          onMountAutoFocus: composeEventHandlers3(onOpenAutoFocus, (event) => {
            event.preventDefault();
            const content2 = document.querySelector("[data-gui-menu-content]");
            content2?.focus({
              preventScroll: true
            });
          }),
          onUnmountAutoFocus: onCloseAutoFocus,
          children: /* @__PURE__ */ jsx33(Dismissable, {
            disableOutsidePointerEvents,
            onEscapeKeyDown,
            onPointerDownOutside,
            onFocusOutside,
            onInteractOutside,
            onDismiss,
            asChild: true,
            children: /* @__PURE__ */ jsx33(RovingFocusGroup, {
              asChild: true,
              __scopeRovingFocusGroup: scope || MENU_CONTEXT,
              dir: rootContext.dir,
              orientation: "vertical",
              loop,
              currentTabStopId: currentItemId,
              onCurrentTabStopIdChange: setCurrentItemId,
              onEntryFocus: composeEventHandlers3(onEntryFocus, (event) => {
                if (!rootContext.isUsingKeyboardRef.current) {
                  event.preventDefault();
                }
              }),
              children: content
            })
          })
        })
      })
    });
  });
  MenuContent.displayName = CONTENT_NAME4;
  const ITEM_NAME3 = "MenuItem";
  const ITEM_SELECT = "menu.itemSelect";
  const MenuItem2 = _Item.styleable((props, forwardedRef) => {
    const {
      disabled = false,
      onSelect,
      preventCloseOnSelect,
      children,
      scope = MENU_CONTEXT,
      // filter out native-only props that shouldn't reach the DOM
      // @ts-ignore
      destructive,
      // @ts-ignore
      hidden,
      // @ts-ignore
      androidIconName,
      // @ts-ignore
      iosIconName,
      ...itemProps
    } = props;
    const ref = React55.useRef(null);
    const rootContext = useMenuRootContext(scope);
    const contentContext = useMenuContentContext(scope);
    const composedRefs = useComposedRefs2(forwardedRef, ref);
    const isPointerDownRef = React55.useRef(false);
    const handleSelect = /* @__PURE__ */ __name(() => {
      const menuItem = ref.current;
      if (!disabled && menuItem) {
        if (isWeb3) {
          const menuItemEl = menuItem;
          const itemSelectEvent = new CustomEvent(ITEM_SELECT, {
            bubbles: true,
            cancelable: true
          });
          menuItemEl.addEventListener(ITEM_SELECT, (event) => onSelect?.(event), {
            once: true
          });
          dispatchDiscreteCustomEvent(menuItemEl, itemSelectEvent);
          if (itemSelectEvent.defaultPrevented || preventCloseOnSelect) {
            isPointerDownRef.current = false;
          } else {
            rootContext.onClose();
          }
        } else {
          onSelect?.({
            target: menuItem
          });
          isPointerDownRef.current = false;
          if (!preventCloseOnSelect) {
            rootContext.onClose();
          }
        }
      }
    }, "handleSelect");
    const content = typeof children === "string" ? /* @__PURE__ */ jsx33(Text4, {
      children
    }) : children;
    return /* @__PURE__ */ jsx33(MenuItemImpl, {
      outlineStyle: "none",
      ...itemProps,
      scope,
      ref: composedRefs,
      disabled,
      onPress: composeEventHandlers3(props.onPress, handleSelect),
      onPointerDown: /* @__PURE__ */ __name((event) => {
        props.onPointerDown?.(event);
        isPointerDownRef.current = true;
      }, "onPointerDown"),
      onPointerUp: composeEventHandlers3(props.onPointerUp, (event) => {
        if (isWeb3) {
          if (!isPointerDownRef.current) event.currentTarget?.click();
        }
      }),
      ...isWeb3 ? {
        onKeyDown: composeEventHandlers3(props.onKeyDown, (event) => {
          const isTypingAhead = contentContext.searchRef.current !== "";
          if (disabled || isTypingAhead && event.key === " ") return;
          if (SELECTION_KEYS.includes(event.key)) {
            event.currentTarget?.click();
            event.preventDefault();
          }
        })
      } : {},
      children: content
    });
  });
  const MenuItemImpl = React55.forwardRef((props, forwardedRef) => {
    const {
      scope = MENU_CONTEXT,
      disabled = false,
      textValue,
      unstyled = process.env.GUI_HEADLESS === "1",
      ...itemProps
    } = props;
    const contentContext = useMenuContentContext(scope);
    const ref = React55.useRef(null);
    const composedRefs = useComposedRefs2(forwardedRef, ref);
    const [isFocused, setIsFocused] = React55.useState(false);
    const [textContent, setTextContent] = React55.useState("");
    if (isWeb3) {
      React55.useEffect(() => {
        const menuItem = ref.current;
        if (menuItem) {
          setTextContent((menuItem.textContent ?? "").trim());
        }
      }, [itemProps.children]);
    }
    return /* @__PURE__ */ jsx33(Collection2.ItemSlot, {
      scope,
      disabled,
      textValue: textValue ?? textContent,
      children: /* @__PURE__ */ jsx33(RovingFocusGroup.Item, {
        asChild: true,
        __scopeRovingFocusGroup: scope,
        focusable: !disabled,
        children: /* @__PURE__ */ jsx33(_Item, {
          unstyled,
          componentName: ITEM_NAME3,
          role: "menuitem",
          "data-highlighted": isFocused ? "" : void 0,
          "aria-disabled": disabled || void 0,
          "data-disabled": disabled ? "" : void 0,
          ...itemProps,
          ref: composedRefs,
          onPointerMove: composeEventHandlers3(props.onPointerMove, (event) => {
            if (event.pointerType !== "mouse") return;
            if (disabled) {
              contentContext.onItemLeave(event);
            } else {
              contentContext.onItemEnter(event);
              if (!event.defaultPrevented) {
                const item = event.currentTarget;
                item.focus({
                  preventScroll: true,
                  focusVisible: false
                });
              }
            }
          }),
          onPointerLeave: composeEventHandlers3(props.onPointerLeave, (event) => {
            contentContext.onItemLeave(event);
          }),
          onFocus: composeEventHandlers3(props.onFocus, () => setIsFocused(true)),
          onBlur: composeEventHandlers3(props.onBlur, () => setIsFocused(false))
        })
      })
    });
  });
  MenuItem2.displayName = ITEM_NAME3;
  const ITEM_TITLE_NAME = "MenuItemTitle";
  const MenuItemTitle = _Title.styleable((props, forwardedRef) => {
    return /* @__PURE__ */ jsx33(_Title, {
      ...props,
      ref: forwardedRef
    });
  });
  MenuItemTitle.displayName = ITEM_TITLE_NAME;
  const ITEM_SUB_TITLE_NAME = "MenuItemSubTitle";
  const MenuItemSubTitle = _SubTitle.styleable((props, forwardedRef) => {
    return /* @__PURE__ */ jsx33(_SubTitle, {
      ...props,
      ref: forwardedRef
    });
  });
  MenuItemSubTitle.displayName = ITEM_SUB_TITLE_NAME;
  const ITEM_IMAGE = "MenuItemImage";
  const MenuItemImage = React55.forwardRef((props, forwardedRef) => {
    const {
      // @ts-ignore - native menu ios config
      ios,
      // @ts-ignore
      androidIconName,
      // @ts-ignore
      iosIconName,
      ...rest
    } = props;
    return /* @__PURE__ */ jsx33(_Image, {
      ...rest,
      ref: forwardedRef
    });
  });
  MenuItemImage.displayName = ITEM_IMAGE;
  const ITEM_ICON = "MenuItemIcon";
  const MenuItemIcon = _Icon.styleable((props, forwardedRef) => {
    const {
      // @ts-ignore
      ios,
      // @ts-ignore
      android,
      // @ts-ignore
      androidIconName,
      // @ts-ignore
      iosIconName,
      ...rest
    } = props;
    return /* @__PURE__ */ jsx33(_Icon, {
      ...rest,
      ref: forwardedRef
    });
  });
  MenuItemIcon.displayName = ITEM_ICON;
  const CHECKBOX_ITEM_NAME = "MenuCheckboxItem";
  const MenuCheckboxItem = _Item.styleable((props, forwardedRef) => {
    const {
      checked = false,
      onCheckedChange,
      scope = MENU_CONTEXT,
      // filter out native-only props
      // @ts-ignore - native menu value state
      value,
      // @ts-ignore - native menu value change handler
      onValueChange,
      ...checkboxItemProps
    } = props;
    return /* @__PURE__ */ jsx33(ItemIndicatorProvider, {
      scope,
      checked,
      children: /* @__PURE__ */ jsx33(MenuItem2, {
        componentName: CHECKBOX_ITEM_NAME,
        role: isWeb3 ? "menuitemcheckbox" : "menuitem",
        "aria-checked": isIndeterminate2(checked) ? "mixed" : checked,
        ...checkboxItemProps,
        scope,
        ref: forwardedRef,
        "data-state": getCheckedState(checked),
        onSelect: composeEventHandlers3(checkboxItemProps.onSelect, () => onCheckedChange?.(isIndeterminate2(checked) ? true : !checked), {
          checkDefaultPrevented: false
        })
      })
    });
  });
  MenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME;
  const RADIO_GROUP_NAME = "MenuRadioGroup";
  const {
    Provider: RadioGroupProvider,
    useStyledContext: useRadioGroupContext
  } = createStyledContext10();
  const MenuRadioGroup = _MenuGroup.styleable((props, forwardedRef) => {
    const {
      value,
      onValueChange,
      scope = MENU_CONTEXT,
      ...groupProps
    } = props;
    const handleValueChange = useCallbackRef(onValueChange);
    return /* @__PURE__ */ jsx33(RadioGroupProvider, {
      scope,
      value,
      onValueChange: handleValueChange,
      children: /* @__PURE__ */ jsx33(_MenuGroup, {
        componentName: RADIO_GROUP_NAME,
        ...groupProps,
        ref: forwardedRef
      })
    });
  });
  MenuRadioGroup.displayName = RADIO_GROUP_NAME;
  const RADIO_ITEM_NAME = "MenuRadioItem";
  const MenuRadioItem = _Item.styleable((props, forwardedRef) => {
    const {
      value,
      scope = MENU_CONTEXT,
      ...radioItemProps
    } = props;
    const context3 = useRadioGroupContext(scope);
    const checked = value === context3.value;
    return /* @__PURE__ */ jsx33(ItemIndicatorProvider, {
      scope,
      checked,
      children: /* @__PURE__ */ jsx33(MenuItem2, {
        componentName: RADIO_ITEM_NAME,
        ...radioItemProps,
        scope,
        "aria-checked": checked,
        ref: forwardedRef,
        role: isWeb3 ? "menuitemradio" : "menuitem",
        "data-state": getCheckedState(checked),
        onSelect: composeEventHandlers3(radioItemProps.onSelect, () => context3.onValueChange?.(value), {
          checkDefaultPrevented: false
        })
      })
    });
  });
  MenuRadioItem.displayName = RADIO_ITEM_NAME;
  const ITEM_INDICATOR_NAME = "MenuItemIndicator";
  const {
    Provider: ItemIndicatorProvider,
    useStyledContext: useItemIndicatorContext
  } = createStyledContext10();
  const MenuItemIndicator = _Indicator.styleable((props, forwardedRef) => {
    const {
      scope = MENU_CONTEXT,
      forceMount,
      ...itemIndicatorProps
    } = props;
    const indicatorContext = useItemIndicatorContext(scope);
    return /* @__PURE__ */ jsx33(AnimatePresence, {
      children: forceMount || isIndeterminate2(indicatorContext.checked) || indicatorContext.checked === true ? /* @__PURE__ */ jsx33(_Indicator, {
        componentName: ITEM_INDICATOR_NAME,
        render: "span",
        ...itemIndicatorProps,
        ref: forwardedRef,
        "data-state": getCheckedState(indicatorContext.checked)
      }) : null
    });
  });
  MenuItemIndicator.displayName = ITEM_INDICATOR_NAME;
  const MenuArrow = React55.forwardRef(/* @__PURE__ */ __name(function MenuArrow2(props, forwardedRef) {
    const {
      scope = MENU_CONTEXT,
      unstyled = process.env.GUI_HEADLESS === "1",
      ...rest
    } = props;
    return /* @__PURE__ */ jsx33(PopperArrow, {
      scope,
      componentName: "PopperArrow",
      unstyled,
      ...!unstyled && {
        backgroundColor: "$background"
      },
      ...rest,
      ref: forwardedRef
    });
  }, "MenuArrow2"));
  const SUB_NAME = "MenuSub";
  const {
    Provider: MenuSubProvider,
    useStyledContext: useMenuSubContext
  } = createStyledContext10();
  const MenuSub = /* @__PURE__ */ __name((props) => {
    const isTouchDevice = useIsTouchDevice();
    const {
      scope = MENU_CONTEXT
    } = props;
    const rootContext = useMenuRootContext(scope);
    const parentPopperContext = usePopperContext(scope);
    const parentSide = parentPopperContext.placement?.split("-")[0];
    const isNestedSubmenu = parentSide === "left" || parentSide === "right";
    const defaultPlacement = isTouchDevice ? "bottom" : isNestedSubmenu ? `${parentSide}-start` : rootContext.dir === "rtl" ? "left-start" : "right-start";
    const {
      children,
      open = false,
      onOpenChange,
      allowFlip: allowFlipProp = {
        padding: 10
      },
      stayInFrame = {
        padding: 10
      },
      placement = defaultPlacement,
      ...rest
    } = props;
    const allowFlip = React55.useMemo(() => {
      if (!isNestedSubmenu || typeof allowFlipProp === "boolean") return allowFlipProp;
      if (allowFlipProp.fallbackPlacements) return allowFlipProp;
      const side = placement.split("-")[0];
      const align = placement.split("-")[1] || "start";
      const otherAlign = align === "start" ? "end" : "start";
      if (side === "left" || side === "right") {
        const oppositeSide = side === "right" ? "left" : "right";
        return {
          ...typeof allowFlipProp === "object" ? allowFlipProp : {},
          fallbackPlacements: [`${side}-${otherAlign}`, `${oppositeSide}-${align}`, `${oppositeSide}-${otherAlign}`]
        };
      }
      return allowFlipProp;
    }, [isNestedSubmenu, allowFlipProp, placement]);
    const parentMenuContext = useMenuContext(scope);
    const [trigger, setTrigger] = React55.useState(null);
    const [content, setContent] = React55.useState(null);
    const handleOpenChange = useCallbackRef(onOpenChange);
    React55.useEffect(() => {
      if (parentMenuContext.open === false) handleOpenChange(false);
      return () => handleOpenChange(false);
    }, [parentMenuContext.open, handleOpenChange]);
    return /* @__PURE__ */ jsx33(Popper, {
      open,
      placement,
      allowFlip,
      stayInFrame,
      ...rest,
      scope,
      children: /* @__PURE__ */ jsx33(MenuProvider, {
        scope,
        open,
        onOpenChange: handleOpenChange,
        content,
        onContentChange: setContent,
        children: /* @__PURE__ */ jsx33(MenuSubProvider, {
          scope,
          contentId: useId11(),
          triggerId: useId11(),
          trigger,
          onTriggerChange: setTrigger,
          children
        })
      })
    });
  }, "MenuSub");
  MenuSub.displayName = SUB_NAME;
  const SUB_TRIGGER_NAME = "MenuSubTrigger";
  const MenuSubTrigger = React55.forwardRef((props, forwardedRef) => {
    const scope = props.scope || MENU_CONTEXT;
    const context3 = useMenuContext(scope);
    const rootContext = useMenuRootContext(scope);
    const subContext = useMenuSubContext(scope);
    const contentContext = useMenuContentContext(scope);
    const popperContext = usePopperContext(scope);
    const openTimerRef = React55.useRef(null);
    const {
      pointerGraceTimerRef,
      onPointerGraceIntentChange
    } = contentContext;
    const effectiveDir = rootContext.dir;
    const clearOpenTimer = React55.useCallback(() => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }, []);
    React55.useEffect(() => clearOpenTimer, [clearOpenTimer]);
    React55.useEffect(() => {
      const pointerGraceTimer = pointerGraceTimerRef.current;
      return () => {
        window.clearTimeout(pointerGraceTimer);
        onPointerGraceIntentChange(null);
      };
    }, [pointerGraceTimerRef, onPointerGraceIntentChange]);
    return /* @__PURE__ */ jsx33(MenuAnchor, {
      componentName: SUB_TRIGGER_NAME,
      asChild: "except-style",
      scope,
      children: /* @__PURE__ */ jsx33(MenuItemImpl, {
        id: subContext.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": context3.open,
        "aria-controls": subContext.contentId,
        "data-state": getOpenState(context3.open),
        outlineStyle: "none",
        ...props,
        ref: composeRefs2(forwardedRef, subContext.onTriggerChange),
        onPress: /* @__PURE__ */ __name((event) => {
          props.onPress?.(event);
          if (props.disabled || event.defaultPrevented) return;
          if (isWeb3) {
            event.currentTarget.focus();
          }
          if (!context3.open) context3.onOpenChange(true);
        }, "onPress"),
        onPointerMove: composeEventHandlers3(
          props.onPointerMove,
          // @ts-ignore
          whenMouse((event) => {
            contentContext.onItemEnter(event);
            if (event.defaultPrevented) return;
            if (!props.disabled && !context3.open && !openTimerRef.current) {
              contentContext.onPointerGraceIntentChange(null);
              openTimerRef.current = window.setTimeout(() => {
                context3.onOpenChange(true);
                clearOpenTimer();
              }, 100);
            }
          })
        ),
        onPointerLeave: composeEventHandlers3(props.onPointerLeave, (eventIn) => {
          const event = eventIn;
          clearOpenTimer();
          const contentRect = context3.content?.getBoundingClientRect();
          if (contentRect) {
            const contentEl = context3.content;
            const sideEl = contentEl?.dataset?.side ? contentEl : contentEl?.querySelector("[data-side]");
            const side = sideEl?.dataset?.side || "right";
            const rightSide = side === "right";
            const bleed = rightSide ? -5 : 5;
            const contentNearEdge = contentRect[rightSide ? "left" : "right"];
            const contentFarEdge = contentRect[rightSide ? "right" : "left"];
            const polygon = {
              area: [
                // Apply a bleed on clientX to ensure that our exit point is
                // consistently within polygon bounds
                {
                  x: event.clientX + bleed,
                  y: event.clientY
                },
                {
                  x: contentNearEdge,
                  y: contentRect.top
                },
                {
                  x: contentFarEdge,
                  y: contentRect.top
                },
                {
                  x: contentFarEdge,
                  y: contentRect.bottom
                },
                {
                  x: contentNearEdge,
                  y: contentRect.bottom
                }
              ],
              side
            };
            contentContext.onPointerGraceIntentChange(polygon);
            window.clearTimeout(pointerGraceTimerRef.current);
            pointerGraceTimerRef.current = window.setTimeout(() => contentContext.onPointerGraceIntentChange(null), 300);
          } else if (isWeb3 && subContext.trigger) {
            const triggerEl = subContext.trigger;
            const triggerRect = triggerEl?.getBoundingClientRect();
            if (triggerRect) {
              const placementSide = popperContext.placement?.split("-")[0];
              const side = placementSide === "left" || placementSide === "right" ? placementSide : rootContext.dir === "rtl" ? "left" : "right";
              const rightSide = side === "right";
              const bleed = rightSide ? -5 : 5;
              const nearEdge = rightSide ? triggerRect.right + 4 : triggerRect.left - 4;
              const farEdge = rightSide ? nearEdge + 200 : nearEdge - 200;
              const polygon = {
                area: [{
                  x: event.clientX + bleed,
                  y: event.clientY
                }, {
                  x: nearEdge,
                  y: triggerRect.top - 50
                }, {
                  x: farEdge,
                  y: triggerRect.top - 50
                }, {
                  x: farEdge,
                  y: triggerRect.bottom + 50
                }, {
                  x: nearEdge,
                  y: triggerRect.bottom + 50
                }],
                side
              };
              contentContext.onPointerGraceIntentChange(polygon);
              window.clearTimeout(pointerGraceTimerRef.current);
              pointerGraceTimerRef.current = window.setTimeout(() => contentContext.onPointerGraceIntentChange(null), 300);
            }
          } else {
            contentContext.onTriggerLeave(event);
            if (event.defaultPrevented) return;
            contentContext.onPointerGraceIntentChange(null);
          }
        }),
        ...isWeb3 ? {
          onKeyDown: composeEventHandlers3(props.onKeyDown, (event) => {
            const isTypingAhead = contentContext.searchRef.current !== "";
            if (props.disabled || isTypingAhead && event.key === " ") return;
            const willOpen = SUB_OPEN_KEYS[effectiveDir].includes(event.key);
            if (willOpen) {
              if (context3.open && context3.content) {
                const contentEl = context3.content;
                const firstItem = contentEl.querySelector?.('[role="menuitem"]:not([data-disabled])');
                if (firstItem) {
                  firstItem.focus({
                    focusVisible: true
                  });
                  event.preventDefault();
                  return;
                }
              }
              const triggerEl = event.currentTarget;
              popperContext.refs?.setReference(triggerEl);
              context3.onOpenChange(true);
              requestAnimationFrame(() => {
                popperContext.update?.();
              });
              context3.content?.focus({
                focusVisible: true
              });
              event.preventDefault();
            }
          })
        } : null
      })
    });
  });
  MenuSubTrigger.displayName = SUB_TRIGGER_NAME;
  const SUB_CONTENT_NAME = "MenuSubContent";
  const MenuSubContentFrame = styled20(PopperContentFrame, {
    name: SUB_CONTENT_NAME
  });
  const MenuSubContent = MenuSubContentFrame.styleable((props, forwardedRef) => {
    const scope = props.scope || MENU_CONTEXT;
    const portalContext = usePortalContext(scope);
    const {
      forceMount = portalContext.forceMount,
      ...subContentProps
    } = props;
    const context3 = useMenuContext(scope);
    const rootContext = useMenuRootContext(scope);
    const subContext = useMenuSubContext(scope);
    const popperContext = usePopperContext(scope);
    const ref = React55.useRef(null);
    const composedRefs = useComposedRefs2(forwardedRef, ref);
    const placementSide = popperContext.placement?.split("-")[0];
    const dataSide = placementSide === "left" || placementSide === "right" ? placementSide : rootContext.dir === "rtl" ? "left" : "right";
    const effectiveDir = rootContext.dir;
    return /* @__PURE__ */ jsx33(Collection2.Provider, {
      scope,
      children: /* @__PURE__ */ jsx33(Collection2.Slot, {
        scope,
        children: /* @__PURE__ */ jsx33(MenuContentImpl, {
          id: subContext.contentId,
          "aria-labelledby": subContext.triggerId,
          ...subContentProps,
          ref: composedRefs,
          "data-side": dataSide,
          disableOutsidePointerEvents: false,
          disableOutsideScroll: false,
          trapFocus: false,
          onOpenAutoFocus: /* @__PURE__ */ __name((event) => {
            if (rootContext.isUsingKeyboardRef.current) {
              const root = ref.current;
              const content = root?.querySelector?.("[data-gui-menu-content]");
              (content || root)?.focus({
                preventScroll: true
              });
            }
            event.preventDefault();
          }, "onOpenAutoFocus"),
          onCloseAutoFocus: /* @__PURE__ */ __name((event) => event.preventDefault(), "onCloseAutoFocus"),
          onFocusOutside: composeEventHandlers3(props.onFocusOutside, (event) => {
            if (event.target !== subContext.trigger) context3.onOpenChange(false);
          }),
          onEscapeKeyDown: composeEventHandlers3(props.onEscapeKeyDown, (event) => {
            context3.onOpenChange(false);
            subContext.trigger?.focus({
              focusVisible: true
            });
            event.preventDefault();
          }),
          ...isWeb3 ? {
            onKeyDown: composeEventHandlers3(props.onKeyDown, (event) => {
              const isKeyDownInside = event.currentTarget.contains(event.target);
              const isCloseKey = SUB_CLOSE_KEYS[effectiveDir].includes(event.key);
              if (isKeyDownInside && isCloseKey) {
                context3.onOpenChange(false);
                subContext.trigger?.focus({
                  focusVisible: true
                });
                event.preventDefault();
              }
            })
          } : null
        })
      })
    });
  });
  MenuSubContent.displayName = SUB_CONTENT_NAME;
  const Anchor = MenuAnchor;
  const Portal2 = MenuPortal;
  const Content = MenuContent;
  const Group2 = _MenuGroup.styleable((props, ref) => {
    return /* @__PURE__ */ jsx33(_MenuGroup, {
      ...props,
      ref
    });
  });
  Group2.displayName = "MenuGroup";
  const Label4 = _Label.styleable((props, ref) => {
    return /* @__PURE__ */ jsx33(_Label, {
      ...props,
      ref
    });
  });
  Label4.displayName = "MenuLabel";
  const Item = MenuItem2;
  const CheckboxItem = MenuCheckboxItem;
  const RadioGroup = MenuRadioGroup;
  const RadioItem = MenuRadioItem;
  const ItemIndicator = MenuItemIndicator;
  const Separator3 = _Separator.styleable((props, ref) => {
    return /* @__PURE__ */ jsx33(_Separator, {
      ...props,
      ref
    });
  });
  Separator3.displayName = "MenuSeparator";
  const Arrow = MenuArrow;
  const Sub = MenuSub;
  const SubTrigger = MenuSubTrigger;
  const SubContent = MenuSubContent;
  const ItemTitle = MenuItemTitle;
  const ItemSubtitle = MenuItemSubTitle;
  const ItemImage = MenuItemImage;
  const ItemIcon = MenuItemIcon;
  const Menu2 = withStaticProperties4(MenuComp, {
    Anchor,
    Portal: Portal2,
    Content,
    Group: Group2,
    Label: Label4,
    Item,
    CheckboxItem,
    RadioGroup,
    RadioItem,
    ItemIndicator,
    Separator: Separator3,
    Arrow,
    Sub,
    SubTrigger,
    SubContent,
    ItemTitle,
    ItemSubtitle,
    ItemImage,
    ItemIcon
  });
  return {
    Menu: Menu2
  };
}
__name(createBaseMenu, "createBaseMenu");
function getOpenState(open) {
  return open ? "open" : "closed";
}
__name(getOpenState, "getOpenState");
function isIndeterminate2(checked) {
  return checked === "indeterminate";
}
__name(isIndeterminate2, "isIndeterminate");
function getCheckedState(checked) {
  return isIndeterminate2(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
__name(getCheckedState, "getCheckedState");
function focusFirst3(candidates, options) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({
      preventScroll: true,
      focusVisible: options?.focusVisible
    });
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
__name(focusFirst3, "focusFirst");
function wrapArray2(array, startIndex) {
  return array.map((_, index2) => array[(startIndex + index2) % array.length]);
}
__name(wrapArray2, "wrapArray");
function getNextMatch(values, search, currentMatch) {
  const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
  const normalizedSearch = isRepeated ? search[0] : search;
  const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
  let wrappedValues = wrapArray2(values, Math.max(currentMatchIndex, 0));
  const excludeCurrentMatch = normalizedSearch.length === 1;
  if (excludeCurrentMatch) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
  const nextMatch = wrappedValues.find((value) => value.toLowerCase().startsWith(normalizedSearch.toLowerCase()));
  return nextMatch !== currentMatch ? nextMatch : void 0;
}
__name(getNextMatch, "getNextMatch");
function isPointInPolygon2(point, polygon) {
  const {
    x,
    y
  } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
__name(isPointInPolygon2, "isPointInPolygon");
function isPointerInGraceArea(event, area) {
  if (!area) return false;
  const cursorPos = {
    x: event.clientX,
    y: event.clientY
  };
  return isPointInPolygon2(cursorPos, area);
}
__name(isPointerInGraceArea, "isPointerInGraceArea");

// node_modules/.pnpm/@hanzogui+create-menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web_76535c0d992028a40b29ad0f5fefbc22/node_modules/@hanzogui/create-menu/dist/esm/createNativeMenu/createNativeMenu.mjs
import { isWeb as isWeb4, withStaticProperties as withStaticProperties5, isIos as isIos2 } from "@hanzogui/web";
import React56 from "react";
import { Fragment as Fragment10, jsx as jsx34 } from "react/jsx-runtime";
var MAPPED_TYPES = ["SubContent", "SubTrigger", "Content", "Sub", "Group", "CheckboxItem"];
var CONTAINER_TYPES = ["SubContent", "Content", "Sub", "Group"];
function getComponentType(displayName) {
  for (const type of MAPPED_TYPES) {
    if (displayName === type || displayName.includes(`(${type})`)) {
      return type;
    }
  }
  return null;
}
__name(getComponentType, "getComponentType");
function isItemLike(props, displayName) {
  if (getComponentType(displayName)) return false;
  return "onSelect" in props || "textValue" in props;
}
__name(isItemLike, "isItemLike");
function isPortalLike(displayName) {
  return displayName === "Portal" || displayName.includes("Portal");
}
__name(isPortalLike, "isPortalLike");
function isTriggerLike(displayName) {
  return displayName === "Trigger" || displayName.includes("(Trigger)");
}
__name(isTriggerLike, "isTriggerLike");
function composeHandlers(first, second) {
  return (...args) => {
    first?.(...args);
    second?.(...args);
  };
}
__name(composeHandlers, "composeHandlers");
function getTriggerDebugName(menuType, props) {
  const childProps = React56.isValidElement(props.children) && props.children.props ? props.children.props : null;
  const prefix = menuType === "ContextMenu" ? "ContextMenuTrigger" : "MenuTrigger";
  const detail = childProps?.testID ?? childProps?.accessibilityLabel ?? (typeof props.textValue === "string" ? props.textValue : null);
  return [prefix, detail].filter(Boolean).join(":") || prefix;
}
__name(getTriggerDebugName, "getTriggerDebugName");
var emptyStub = /* @__PURE__ */ __name(() => null, "emptyStub");
function createWebStubs() {
  return {
    Menu: withStaticProperties5(emptyStub, {
      Trigger: emptyStub,
      Content: emptyStub,
      Item: emptyStub,
      ItemTitle: emptyStub,
      ItemSubtitle: emptyStub,
      SubTrigger: emptyStub,
      Group: emptyStub,
      ItemIcon: emptyStub,
      Separator: emptyStub,
      CheckboxItem: emptyStub,
      ItemIndicator: emptyStub,
      ItemImage: emptyStub,
      Label: emptyStub,
      Arrow: emptyStub,
      Sub: emptyStub,
      SubContent: emptyStub,
      Preview: emptyStub,
      Portal: emptyStub,
      RadioGroup: emptyStub,
      RadioItem: emptyStub,
      Auxiliary: emptyStub
    })
  };
}
__name(createWebStubs, "createWebStubs");
var createNativeMenu = /* @__PURE__ */ __name((MenuType) => {
  if (isWeb4) {
    return createWebStubs();
  }
  const isContextMenu = MenuType === "ContextMenu";
  const isAndroid5 = !isIos2 && !isWeb4;
  let resolved = null;
  let warned = false;
  function resolve() {
    if (resolved) return resolved;
    const zeego = getZeego();
    if (!zeego.isEnabled) {
      if (!warned) {
        warned = true;
        console.warn(`Warning: Must call import '@hanzogui/native/setup-zeego' at your app entry point to use native menus`);
      }
      return null;
    }
    const menu = isContextMenu ? zeego.state.ContextMenu : zeego.state.DropdownMenu;
    resolved = {
      menu,
      componentMap: {
        SubContent: menu.SubContent,
        Content: menu.Content,
        Sub: menu.Sub,
        Group: menu.Group,
        SubTrigger: menu.SubTrigger
      }
    };
    return resolved;
  }
  __name(resolve, "resolve");
  function transformChildren(menu, map, children, shouldReverseOnIos = false, triggerBoundaryHandlers, radioContext) {
    const result = [];
    React56.Children.forEach(children, (child) => {
      if (!React56.isValidElement(child)) {
        result.push(child);
        return;
      }
      const displayName = child.type?.displayName || "";
      const props = child.props;
      if (isPortalLike(displayName)) {
        const inner2 = transformChildren(menu, map, props.children, false, triggerBoundaryHandlers, radioContext);
        React56.Children.forEach(inner2, (c) => result.push(c));
        return;
      }
      if (displayName.includes("ScrollView")) {
        const inner2 = transformChildren(menu, map, props.children, false, triggerBoundaryHandlers, radioContext);
        React56.Children.forEach(inner2, (c) => result.push(c));
        return;
      }
      if (isTriggerLike(displayName)) {
        const debugName = getTriggerDebugName(MenuType, props);
        const claim = /* @__PURE__ */ __name(() => triggerBoundaryHandlers?.claim(debugName), "claim");
        const release = /* @__PURE__ */ __name(() => triggerBoundaryHandlers?.release(debugName), "release");
        result.push(React56.cloneElement(child, {
          onTouchStart: composeHandlers(claim, props.onTouchStart),
          onTouchEnd: composeHandlers(props.onTouchEnd, release),
          onTouchCancel: composeHandlers(props.onTouchCancel, release),
          onResponderGrant: composeHandlers(claim, props.onResponderGrant),
          onResponderRelease: composeHandlers(props.onResponderRelease, release),
          onResponderTerminate: composeHandlers(props.onResponderTerminate, release),
          onPressIn: composeHandlers(claim, props.onPressIn),
          onPressOut: composeHandlers(props.onPressOut, release)
        }));
        return;
      }
      if (displayName.includes("RadioGroup")) {
        const {
          value: rgValue,
          onValueChange: rgOnValueChange,
          children: rgChildren,
          ...rest
        } = props;
        result.push(React56.createElement(menu.Group, {
          ...rest,
          key: child.key
        }, transformChildren(menu, map, rgChildren, false, triggerBoundaryHandlers, {
          value: rgValue,
          onValueChange: rgOnValueChange
        })));
        return;
      }
      if (displayName.includes("RadioItem") && radioContext) {
        const {
          value: itemValue,
          children: rChildren,
          ...rest
        } = props;
        const cleanChildren = React56.Children.map(rChildren, (c) => {
          if (!React56.isValidElement(c)) return c;
          const dn = c.type?.displayName || "";
          if (dn.includes("ItemIndicator")) return null;
          return c;
        });
        result.push(React56.createElement(menu.CheckboxItem, {
          ...rest,
          key: child.key,
          value: itemValue === radioContext.value ? "on" : "off",
          onValueChange: /* @__PURE__ */ __name(() => radioContext.onValueChange?.(itemValue), "onValueChange")
        }, cleanChildren));
        return;
      }
      const componentType = getComponentType(displayName);
      if (componentType === "CheckboxItem") {
        const {
          checked,
          onCheckedChange,
          value,
          onValueChange,
          children: cbChildren,
          ...rest
        } = props;
        const finalValue = value ?? (checked ? "on" : "off");
        const finalOnValueChange = onValueChange ?? (onCheckedChange && ((v) => onCheckedChange(v === "on")));
        const cleanChildren = React56.Children.map(cbChildren, (c) => {
          if (!React56.isValidElement(c)) return c;
          const dn = c.type?.displayName || "";
          if (dn.includes("ItemIndicator")) return null;
          return c;
        });
        result.push(React56.createElement(menu.CheckboxItem, {
          ...rest,
          key: child.key,
          value: finalValue,
          onValueChange: finalOnValueChange
        }, cleanChildren));
        return;
      }
      if (componentType) {
        const {
          children: childChildren,
          ...restProps
        } = props;
        const isContainer = CONTAINER_TYPES.includes(componentType);
        const shouldReverse = componentType === "Content" || componentType === "SubContent";
        result.push(React56.createElement(map[componentType], {
          ...restProps,
          key: child.key
        }, isContainer ? transformChildren(menu, map, childChildren, shouldReverse, triggerBoundaryHandlers, radioContext) : childChildren));
        return;
      }
      if (isItemLike(props, displayName)) {
        const {
          children: itemChildren,
          ...itemProps
        } = props;
        result.push(React56.createElement(menu.Item, {
          ...itemProps,
          key: child.key
        }, itemChildren));
        return;
      }
      result.push(child);
    });
    if (isIos2 && shouldReverseOnIos && !isContextMenu) {
      result.reverse();
    }
    return result;
  }
  __name(transformChildren, "transformChildren");
  function lazyZeego(name, displayName) {
    const Comp = /* @__PURE__ */ __name((props) => {
      const z = resolve();
      if (!z) return null;
      return React56.createElement(z.menu[name], props);
    }, "Comp");
    Comp.displayName = displayName || name;
    return Comp;
  }
  __name(lazyZeego, "lazyZeego");
  const Trigger = lazyZeego("Trigger");
  const Content = lazyZeego("Content");
  const Item = lazyZeego("Item");
  const ItemTitle = lazyZeego("ItemTitle");
  const ItemSubtitle = lazyZeego("ItemSubtitle");
  const ItemIcon = lazyZeego("ItemIcon");
  const ItemImage = lazyZeego("ItemImage");
  const ItemIndicator = lazyZeego("ItemIndicator");
  const Group2 = lazyZeego("Group");
  const Label4 = lazyZeego("Label");
  const Separator3 = lazyZeego("Separator");
  const Sub = lazyZeego("Sub");
  const SubTrigger = lazyZeego("SubTrigger");
  const SubContent = lazyZeego("SubContent");
  const Portal2 = /* @__PURE__ */ __name(({
    children
  }) => /* @__PURE__ */ jsx34(Fragment10, {
    children
  }), "Portal");
  Portal2.displayName = "Portal";
  const Arrow = /* @__PURE__ */ __name(() => null, "Arrow");
  Arrow.displayName = "Arrow";
  const RadioGroup = /* @__PURE__ */ __name(({
    children
  }) => /* @__PURE__ */ jsx34(Fragment10, {
    children
  }), "RadioGroup");
  RadioGroup.displayName = `${MenuType}RadioGroup`;
  const RadioItem = /* @__PURE__ */ __name(({
    children
  }) => /* @__PURE__ */ jsx34(Fragment10, {
    children
  }), "RadioItem");
  RadioItem.displayName = `${MenuType}RadioItem`;
  const CheckboxItem = /* @__PURE__ */ __name(() => null, "CheckboxItem");
  CheckboxItem.displayName = "CheckboxItem";
  const Preview = isContextMenu ? lazyZeego("Preview", `${MenuType}Preview`) : () => null;
  Preview.displayName = `${MenuType}Preview`;
  const Auxiliary = isContextMenu ? lazyZeego("Auxiliary", `${MenuType}Auxiliary`) : () => null;
  Auxiliary.displayName = `${MenuType}Auxiliary`;
  const Menu2 = /* @__PURE__ */ __name(({
    children,
    onOpenChange,
    onOpenWillChange
  }) => {
    const triggerOwnerRef = React56.useRef(null);
    const claimTriggerBoundary = React56.useCallback((debugName) => {
      if (triggerOwnerRef.current) {
        releaseExternalPressOwnership(triggerOwnerRef.current, debugName);
      }
      triggerOwnerRef.current = claimExternalPressOwnership(debugName);
    }, []);
    const releaseTriggerBoundary = React56.useCallback((debugName) => {
      if (!triggerOwnerRef.current) return;
      releaseExternalPressOwnership(triggerOwnerRef.current, debugName);
      triggerOwnerRef.current = null;
    }, []);
    React56.useEffect(() => releaseTriggerBoundary, [releaseTriggerBoundary]);
    const z = resolve();
    if (!z) return null;
    const handleOpenChange = React56.useCallback((isOpen) => {
      if (!isOpen) {
        releaseTriggerBoundary();
      }
      onOpenChange?.(isOpen);
    }, [onOpenChange, releaseTriggerBoundary]);
    const handleOpenWillChange = React56.useCallback((willOpen) => {
      if (!willOpen) {
        releaseTriggerBoundary();
      }
      onOpenWillChange?.(willOpen);
    }, [onOpenWillChange, releaseTriggerBoundary]);
    const rootProps = {
      onOpenChange: handleOpenChange
    };
    if (isContextMenu && onOpenWillChange) {
      rootProps.onOpenWillChange = handleOpenWillChange;
    }
    const content = /* @__PURE__ */ jsx34(z.menu.Root, {
      ...rootProps,
      children: transformChildren(z.menu, z.componentMap, children, false, {
        claim: claimTriggerBoundary,
        release: releaseTriggerBoundary
      })
    });
    if (isAndroid5) {
      return /* @__PURE__ */ jsx34(NativeMenuContext.Provider, {
        value: true,
        children: content
      });
    }
    return content;
  }, "Menu");
  Menu2.displayName = MenuType;
  return {
    Menu: withStaticProperties5(Menu2, {
      Trigger,
      Content,
      Item,
      ItemTitle,
      ItemSubtitle,
      ItemIcon,
      ItemImage,
      ItemIndicator,
      Group: Group2,
      Label: Label4,
      Separator: Separator3,
      Sub,
      SubTrigger,
      SubContent,
      CheckboxItem,
      Portal: Portal2,
      RadioGroup,
      RadioItem,
      Arrow,
      Preview,
      Auxiliary
    })
  };
}, "createNativeMenu");

// node_modules/.pnpm/@hanzogui+create-menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web_76535c0d992028a40b29ad0f5fefbc22/node_modules/@hanzogui/create-menu/dist/esm/createNativeMenu/withNativeMenu.mjs
import { isWeb as isWeb5 } from "@hanzogui/web";
import { jsx as jsx35 } from "react/jsx-runtime";
function withNativeMenu({
  Component,
  NativeComponent
}) {
  if (isWeb5) {
    return Component;
  }
  if (!NativeComponent) {
    return Component;
  }
  const Menu2 = /* @__PURE__ */ __name((props) => {
    return /* @__PURE__ */ jsx35(NativeComponent, {
      ...props
    });
  }, "Menu");
  Menu2.displayName = NativeComponent.displayName || Component?.displayName;
  return Menu2;
}
__name(withNativeMenu, "withNativeMenu");

// node_modules/.pnpm/@hanzogui+menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21.2_33eaebfd92acfe62df4bf2ec66ce602d/node_modules/@hanzogui/menu/dist/esm/Menu.mjs
import { isWeb as isWeb7, withStaticProperties as withStaticProperties7 } from "@hanzogui/web";
import React58 from "react";

// node_modules/.pnpm/@hanzogui+scroll-view@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.8_09c38ec0c9ac1bfb955ff93cee792fbe/node_modules/@hanzogui/scroll-view/dist/esm/ScrollView.mjs
import { styled as styled21 } from "@hanzogui/web";
var ScrollView2 = styled21(ScrollView_default, {
  name: "ScrollView",
  scrollEnabled: true,
  variants: {
    fullscreen: {
      true: fullscreenStyle
    }
  }
}, {
  accept: {
    contentContainerStyle: "style"
  }
});

// node_modules/.pnpm/@hanzogui+menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21.2_33eaebfd92acfe62df4bf2ec66ce602d/node_modules/@hanzogui/menu/dist/esm/createNonNativeMenu.mjs
import { composeEventHandlers as composeEventHandlers4, composeRefs as composeRefs3, createStyledContext as createStyledContext11, isAndroid as isAndroid4, isWeb as isWeb6, Slot as Slot4, styled as styled22, useEvent as useEvent4, useIsTouchDevice as useIsTouchDevice2, View as View12, withStaticProperties as withStaticProperties6 } from "@hanzogui/web";
import * as React57 from "react";
import { useId as useId13 } from "react";
import { jsx as jsx36 } from "react/jsx-runtime";
var DROPDOWN_MENU_CONTEXT = "MenuContext";
function useMenuTriggerSetup(open) {
  const triggerStateSettersRef = React57.useRef(/* @__PURE__ */ new Map());
  const activeTriggerIdRef = React57.useRef(null);
  const setActiveTrigger = useEvent4((id) => {
    const prevId = activeTriggerIdRef.current;
    if (prevId === id) return;
    if (prevId) {
      triggerStateSettersRef.current.get(prevId)?.(false);
    }
    activeTriggerIdRef.current = id;
    if (id && open) {
      triggerStateSettersRef.current.get(id)?.(true);
    }
  });
  const registerTrigger = useEvent4((id, setOpenState) => {
    triggerStateSettersRef.current.set(id, setOpenState);
    setOpenState(activeTriggerIdRef.current === id && open);
  });
  const unregisterTrigger = useEvent4((id) => {
    triggerStateSettersRef.current.delete(id);
    if (activeTriggerIdRef.current === id) {
      activeTriggerIdRef.current = null;
    }
  });
  React57.useEffect(() => {
    if (!open) {
      setActiveTrigger(null);
      return;
    }
    const activeId = activeTriggerIdRef.current;
    if (activeId) {
      triggerStateSettersRef.current.get(activeId)?.(true);
    }
  }, [open, setActiveTrigger]);
  return {
    setActiveTrigger,
    registerTrigger,
    unregisterTrigger
  };
}
__name(useMenuTriggerSetup, "useMenuTriggerSetup");
function createNonNativeMenu(params) {
  const {
    Menu: Menu2
  } = createBaseMenu(params);
  const DROPDOWN_MENU_NAME = "Menu";
  const {
    Provider: MenuProvider2,
    useStyledContext: useMenuContext2
  } = createStyledContext11();
  const MenuComp = /* @__PURE__ */ __name((props) => {
    const {
      scope,
      children,
      dir,
      open: openProp,
      defaultOpen,
      onOpenChange,
      modal = true,
      ...rest
    } = props;
    const triggerRef = React57.useRef(null);
    const [open = false, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen,
      onChange: onOpenChange
    });
    const openRef = React57.useRef(open);
    openRef.current = open;
    const {
      setActiveTrigger,
      registerTrigger,
      unregisterTrigger
    } = useMenuTriggerSetup(open);
    return /* @__PURE__ */ jsx36(MenuProvider2, {
      scope,
      triggerId: useId13(),
      triggerRef,
      contentId: useId13(),
      openRef,
      onOpenChange: React57.useCallback((nextOpen) => setOpen(nextOpen), [setOpen]),
      onOpenToggle: React57.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
      modal,
      setActiveTrigger,
      registerTrigger,
      unregisterTrigger,
      children: /* @__PURE__ */ jsx36(Menu2, {
        scope: scope || DROPDOWN_MENU_CONTEXT,
        open,
        onOpenChange: setOpen,
        dir,
        modal,
        ...rest,
        children
      })
    });
  }, "MenuComp");
  MenuComp.displayName = DROPDOWN_MENU_NAME;
  const TRIGGER_NAME4 = "MenuTrigger";
  const MenuTriggerFrame = Menu2.Anchor;
  const MenuTrigger = View12.styleable((props, forwardedRef) => {
    const {
      scope,
      asChild,
      children,
      disabled = false,
      onKeydown,
      ...triggerProps
    } = props;
    const context3 = useMenuContext2(scope);
    const popperCtx = usePopperContextSlow(scope || DROPDOWN_MENU_CONTEXT);
    const Comp = asChild ? Slot4 : View12;
    const isTouchDevice = useIsTouchDevice2();
    const triggerElRef = React57.useRef(null);
    const triggerId = React57.useId();
    const [triggerOpen, setTriggerOpen] = React57.useState(false);
    const {
      registerTrigger,
      unregisterTrigger
    } = context3;
    React57.useEffect(() => {
      registerTrigger(triggerId, setTriggerOpen);
      return () => unregisterTrigger(triggerId);
    }, [registerTrigger, unregisterTrigger, triggerId]);
    const activateSelf = React57.useCallback(() => {
      context3.setActiveTrigger(triggerId);
      const el = triggerElRef.current;
      if (el) {
        context3.triggerRef.current = el;
        if (el instanceof HTMLElement) {
          popperCtx.refs?.setReference(el);
          requestAnimationFrame(() => popperCtx.update?.());
        }
      }
    }, [context3, triggerId, popperCtx]);
    const pressEvent = isWeb6 ? isTouchDevice ? "onClick" : "onPointerDown" : "onPress";
    return /* @__PURE__ */ jsx36(MenuTriggerFrame, {
      asChild: true,
      componentName: TRIGGER_NAME4,
      scope: scope || DROPDOWN_MENU_CONTEXT,
      children: /* @__PURE__ */ jsx36(Comp, {
        role: "button",
        id: context3.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": triggerOpen,
        "aria-controls": triggerOpen ? context3.contentId : void 0,
        "data-state": triggerOpen ? "open" : "closed",
        "data-disabled": disabled ? "" : void 0,
        "aria-disabled": disabled || void 0,
        ref: composeRefs3(forwardedRef, context3.triggerRef, triggerElRef),
        ...{
          [pressEvent]: composeEventHandlers4(
            //@ts-ignore
            props[pressEvent],
            (event) => {
              if (!disabled) {
                if (isWeb6 && event instanceof PointerEvent && event.button !== 0 && event.ctrlKey === true) return;
                if (context3.openRef.current) {
                  context3.setActiveTrigger(null);
                } else {
                  activateSelf();
                }
                context3.onOpenToggle();
                if (!context3.openRef.current) event.preventDefault();
              }
            }
          )
        },
        ...isWeb6 && {
          onKeyDown: composeEventHandlers4(onKeydown, (event) => {
            if (disabled) return;
            if (["Enter", " "].includes(event.key)) {
              if (context3.openRef.current) {
                context3.setActiveTrigger(null);
              } else {
                activateSelf();
              }
              context3.onOpenToggle();
            }
            if (event.key === "ArrowDown") {
              activateSelf();
              context3.onOpenChange(true);
            }
            if (["Enter", " ", "ArrowDown"].includes(event.key)) event.preventDefault();
          })
        },
        ...triggerProps,
        children
      })
    });
  });
  MenuTrigger.displayName = TRIGGER_NAME4;
  const PORTAL_NAME = "MenuPortal";
  const MenuPortal = /* @__PURE__ */ __name((props) => {
    const {
      scope,
      children,
      ...portalProps
    } = props;
    const context3 = isAndroid4 ? useMenuContext2(scope) : null;
    const content = isAndroid4 ? /* @__PURE__ */ jsx36(MenuProvider2, {
      ...context3,
      children
    }) : children;
    return /* @__PURE__ */ jsx36(Menu2.Portal, {
      scope: scope || DROPDOWN_MENU_CONTEXT,
      ...portalProps,
      children: content
    });
  }, "MenuPortal");
  MenuPortal.displayName = PORTAL_NAME;
  const CONTENT_NAME4 = "MenuContent";
  const MenuContent = React57.forwardRef((props, forwardedRef) => {
    const {
      scope,
      ...contentProps
    } = props;
    const context3 = useMenuContext2(scope);
    const hasInteractedOutsideRef = React57.useRef(false);
    return /* @__PURE__ */ jsx36(Menu2.Content, {
      id: context3.contentId,
      "aria-labelledby": context3.triggerId,
      scope: scope || DROPDOWN_MENU_CONTEXT,
      ...contentProps,
      ref: forwardedRef,
      onCloseAutoFocus: composeEventHandlers4(props.onCloseAutoFocus, (event) => {
        if (!hasInteractedOutsideRef.current) {
          requestAnimationFrame(() => {
            const activeEl = document.activeElement;
            if (!activeEl || activeEl === document.body) {
              context3.triggerRef.current?.focus();
            }
          });
        }
        hasInteractedOutsideRef.current = false;
        event.preventDefault();
      }),
      onInteractOutside: composeEventHandlers4(props.onInteractOutside, (event) => {
        const originalEvent = event.detail.originalEvent;
        const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
        const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
        if (!context3.modal || isRightClick) hasInteractedOutsideRef.current = true;
      }),
      style: isWeb6 ? {
        ...props.style,
        ...{
          "--gui-menu-content-transform-origin": "var(--gui-popper-transform-origin)",
          "--gui-menu-content-available-width": "var(--gui-popper-available-width)",
          "--gui-menu-content-available-height": "var(--gui-popper-available-height)",
          "--gui-menu-trigger-width": "var(--gui-popper-anchor-width)",
          "--gui-menu-trigger-height": "var(--gui-popper-anchor-height)"
        }
      } : props.style
    });
  });
  MenuContent.displayName = CONTENT_NAME4;
  const DROPDOWN_MENU_SUB_NAME = "MenuSub";
  const MenuSub = /* @__PURE__ */ __name((props) => {
    const {
      scope,
      children,
      open: openProp,
      onOpenChange,
      defaultOpen,
      ...rest
    } = props;
    const [open = false, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen,
      onChange: onOpenChange
    });
    return /* @__PURE__ */ jsx36(Menu2.Sub, {
      scope: scope || DROPDOWN_MENU_CONTEXT,
      open,
      onOpenChange: setOpen,
      ...rest,
      children
    });
  }, "MenuSub");
  MenuSub.displayName = DROPDOWN_MENU_SUB_NAME;
  const SUB_CONTENT_NAME = "MenuSubContent";
  const MenuSubContent = React57.forwardRef((props, forwardedRef) => {
    const {
      scope,
      ...subContentProps
    } = props;
    return /* @__PURE__ */ jsx36(Menu2.SubContent, {
      scope: scope || DROPDOWN_MENU_CONTEXT,
      ...subContentProps,
      ref: forwardedRef,
      style: isWeb6 ? {
        ...props.style,
        ...{
          "--gui-menu-content-transform-origin": "var(--gui-popper-transform-origin)",
          "--gui-menu-content-available-width": "var(--gui-popper-available-width)",
          "--gui-menu-content-available-height": "var(--gui-popper-available-height)",
          "--gui-menu-trigger-width": "var(--gui-popper-anchor-width)",
          "--gui-menu-trigger-height": "var(--gui-popper-anchor-height)"
        }
      } : null
    });
  });
  MenuSubContent.displayName = SUB_CONTENT_NAME;
  const MenuScrollView = styled22(ScrollView2, {
    flexShrink: 1,
    alignSelf: "stretch",
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
    "$platform-web": {
      maxHeight: "var(--gui-menu-content-available-height)"
    }
  });
  const Group2 = Menu2.Group;
  const Label4 = Menu2.Label;
  const Item = Menu2.Item;
  const CheckboxItem = Menu2.CheckboxItem;
  const RadioGroup = Menu2.RadioGroup;
  const RadioItem = Menu2.RadioItem;
  const ItemIndicator = Menu2.ItemIndicator;
  const Separator3 = Menu2.Separator;
  const Arrow = Menu2.Arrow;
  const SubTrigger = Menu2.SubTrigger;
  const ItemTitle = Menu2.ItemTitle;
  const ItemSubtitle = Menu2.ItemSubtitle;
  const ItemImage = Menu2.ItemImage;
  const ItemIcon = Menu2.ItemIcon;
  return withStaticProperties6(MenuComp, {
    Root: MenuComp,
    Trigger: MenuTrigger,
    Portal: MenuPortal,
    Content: MenuContent,
    Group: Group2,
    Label: Label4,
    Item,
    CheckboxItem,
    RadioGroup,
    RadioItem,
    ItemIndicator,
    Separator: Separator3,
    Arrow,
    Sub: MenuSub,
    SubTrigger,
    SubContent: MenuSubContent,
    ItemTitle,
    ItemSubtitle,
    ItemImage,
    ItemIcon,
    ScrollView: MenuScrollView
  });
}
__name(createNonNativeMenu, "createNonNativeMenu");

// node_modules/.pnpm/@hanzogui+menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21.2_33eaebfd92acfe62df4bf2ec66ce602d/node_modules/@hanzogui/menu/dist/esm/Menu.mjs
import { Fragment as Fragment11, jsx as jsx37 } from "react/jsx-runtime";
function createMenu(params) {
  const {
    Menu: NativeMenuRoot
  } = createNativeMenu("Menu");
  const NonNativeMenu = createNonNativeMenu(params);
  const COMMON_PARAMS = {
    isRoot: false,
    scope: DROPDOWN_MENU_CONTEXT
  };
  const MenuComp = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Root,
    NativeComponent: NativeMenuRoot,
    isRoot: true
  });
  const Trigger = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Trigger,
    NativeComponent: NativeMenuRoot.Trigger
  });
  const Portal2 = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Portal,
    NativeComponent: React58.Fragment
  });
  const Content = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Content,
    NativeComponent: NativeMenuRoot.Content
  });
  const Group2 = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Group,
    NativeComponent: NativeMenuRoot.Group
  });
  const Label4 = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Label,
    NativeComponent: NativeMenuRoot.Label
  });
  const Item = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Item,
    NativeComponent: NativeMenuRoot.Item
  });
  const ItemTitle = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.ItemTitle,
    NativeComponent: NativeMenuRoot.ItemTitle
  });
  const ItemSubtitle = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.ItemSubtitle,
    NativeComponent: NativeMenuRoot.ItemSubtitle
  });
  const ItemIcon = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.ItemIcon,
    NativeComponent: NativeMenuRoot.ItemIcon
  });
  const ItemImage = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.ItemImage,
    NativeComponent: NativeMenuRoot.ItemImage
  });
  const CheckboxItem = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.CheckboxItem,
    NativeComponent: NativeMenuRoot.CheckboxItem
  });
  const RadioGroup = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.RadioGroup,
    NativeComponent: /* @__PURE__ */ __name(({
      children
    }) => /* @__PURE__ */ jsx37(Fragment11, {
      children
    }), "NativeComponent")
  });
  const RadioItem = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.RadioItem,
    NativeComponent: /* @__PURE__ */ __name(({
      children
    }) => /* @__PURE__ */ jsx37(Fragment11, {
      children
    }), "NativeComponent")
  });
  const ItemIndicator = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.ItemIndicator,
    NativeComponent: NativeMenuRoot.ItemIndicator
  });
  const Separator3 = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Separator,
    NativeComponent: NativeMenuRoot.Separator
  });
  const Arrow = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Arrow,
    NativeComponent: NativeMenuRoot.Arrow
  });
  const Sub = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.Sub,
    NativeComponent: NativeMenuRoot.Sub
  });
  const SubTrigger = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.SubTrigger,
    NativeComponent: NativeMenuRoot.SubTrigger
  });
  const SubContent = withNativeMenu({
    ...COMMON_PARAMS,
    Component: NonNativeMenu.SubContent,
    NativeComponent: NativeMenuRoot.SubContent
  });
  const NativeScrollView = /* @__PURE__ */ __name(({
    children
  }) => /* @__PURE__ */ jsx37(Fragment11, {
    children
  }), "NativeScrollView");
  NativeScrollView.displayName = "MenuScrollView";
  const ScrollView3 = isWeb7 ? NonNativeMenu.ScrollView : NativeScrollView;
  const Menu2 = withStaticProperties7(MenuComp, {
    Trigger,
    Portal: Portal2,
    Content,
    Group: Group2,
    Label: Label4,
    Item,
    CheckboxItem,
    RadioGroup,
    RadioItem,
    ItemIndicator,
    Separator: Separator3,
    Arrow,
    Sub,
    SubTrigger,
    SubContent,
    ItemTitle,
    ItemSubtitle,
    ItemIcon,
    ItemImage,
    ScrollView: ScrollView3
  });
  return Menu2;
}
__name(createMenu, "createMenu");

// node_modules/.pnpm/@hanzogui+menu@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21.2_33eaebfd92acfe62df4bf2ec66ce602d/node_modules/@hanzogui/menu/dist/esm/index.mjs
var Menu = createMenu({
  Icon: MenuPredefined.MenuIcon,
  Image: MenuPredefined.MenuImage,
  Indicator: MenuPredefined.MenuIndicator,
  Item: MenuPredefined.MenuItem,
  Label: MenuPredefined.MenuLabel,
  MenuGroup: MenuPredefined.MenuGroup,
  Separator: MenuPredefined.MenuSeparator,
  SubTitle: MenuPredefined.SubTitle,
  Title: MenuPredefined.Title
});

// node_modules/.pnpm/@hanzogui+popover@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9__1a445a9923a63b01f8cf490dff30475a/node_modules/@hanzogui/popover/dist/esm/Popover.mjs
import { createStyledContext as createStyledContext12, useCreateShallowSetState, useEvent as useEvent5, useGet as useGet2, View as View13 } from "@hanzogui/core";
import * as React60 from "react";

// node_modules/.pnpm/@hanzogui+popover@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9__1a445a9923a63b01f8cf490dff30475a/node_modules/@hanzogui/popover/dist/esm/useFloatingContext.mjs
import React59 from "react";
var useFloatingContext = /* @__PURE__ */ __name(({
  open,
  setOpen,
  disable,
  disableFocus,
  hoverable,
  role: roleProp = "dialog",
  focus: focusProp,
  groupId,
  delay: delayProp,
  restMs: restMsProp
}) => {
  "use no memo";
  const openRef = React59.useRef(open);
  openRef.current = open;
  const hoverableRef = React59.useRef(hoverable);
  hoverableRef.current = hoverable;
  const disableRef = React59.useRef(disable);
  disableRef.current = disable;
  const disableFocusRef = React59.useRef(disableFocus);
  disableFocusRef.current = disableFocus;
  const roleRef = React59.useRef(roleProp);
  roleRef.current = roleProp;
  const focusRef = React59.useRef(focusProp);
  focusRef.current = focusProp;
  const groupIdRef = React59.useRef(groupId);
  groupIdRef.current = groupId;
  const delayRef = React59.useRef(delayProp);
  delayRef.current = delayProp;
  const restMsRef = React59.useRef(restMsProp);
  restMsRef.current = restMsProp;
  const events = React59.useMemo(() => createFloatingEvents(), []);
  const triggerElements = React59.useMemo(() => new PopupTriggerMap(), []);
  React59.useEffect(() => {
    events.emit("openchange", {
      open
    });
  }, [open, events]);
  return React59.useCallback((props) => {
    const onTriggerRef = React59.useRef(false);
    const restTimerRef = React59.useRef(void 0);
    const graceRef = React59.useRef(void 0);
    const pendingCloseRef = React59.useRef(false);
    const isOverFloatingRef = React59.useRef(false);
    const handleCloseActiveRef = React59.useRef(false);
    React59.useEffect(() => {
      return () => {
        clearTimeout(restTimerRef.current);
        clearTimeout(graceRef.current);
      };
    }, []);
    const onOpenChange = /* @__PURE__ */ __name((val, event) => {
      if (val && event?.type === "mouseenter") {
        return;
      }
      if (!val && onTriggerRef.current && (event?.type === "mousemove" || event?.type === "mouseleave")) {
        pendingCloseRef.current = true;
        return;
      }
      const type = event?.type === "mousemove" || event?.type === "mouseenter" || event?.type === "mouseleave" ? "hover" : "press";
      setOpen(val, type);
    }, "onOpenChange");
    const floating = useFloating({
      ...props,
      open: openRef.current
    });
    const currentHoverable = hoverableRef.current;
    const dataRef = React59.useRef({});
    dataRef.current.placement = floating.placement;
    const floatingRefs = floating.refs;
    const nullRef = {
      current: null
    };
    const interactionContext = {
      open: openRef.current,
      onOpenChange,
      refs: {
        reference: floatingRefs?.reference || nullRef,
        floating: floatingRefs?.floating || nullRef,
        domReference: floatingRefs?.reference || nullRef
      },
      elements: {
        get reference() {
          return floatingRefs?.reference?.current || null;
        },
        get floating() {
          return floatingRefs?.floating?.current || null;
        },
        get domReference() {
          return floatingRefs?.reference?.current || null;
        }
      },
      dataRef,
      events,
      triggerElements,
      handleCloseActiveRef
    };
    const {
      delay: groupDelay,
      currentId: groupCurrentId
    } = useDelayGroup(interactionContext, {
      id: groupIdRef.current
    });
    const isInActiveGroup = groupIdRef.current && groupCurrentId != null && typeof groupDelay === "object";
    let delay;
    let restMs;
    if (isInActiveGroup) {
      delay = groupDelay;
      restMs = 0;
    } else if (delayRef.current !== void 0) {
      delay = delayRef.current;
      restMs = restMsRef.current ?? 0;
    } else {
      delay = currentHoverable && typeof currentHoverable === "object" ? currentHoverable.delay ?? 0 : 0;
      restMs = currentHoverable && typeof currentHoverable === "object" ? currentHoverable.restMs ?? 0 : 0;
    }
    const currentRole = roleRef.current;
    const currentFocus = focusRef.current;
    const {
      getReferenceProps,
      getFloatingProps: getFloatingPropsInner
    } = useInteractions([currentHoverable ? useHover(interactionContext, {
      enabled: !disableRef.current && !!currentHoverable,
      delay,
      restMs,
      handleClose: safePolygon({
        requireIntent: true,
        buffer: 1,
        __debug: typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "safePolygon"
      }),
      ...typeof currentHoverable === "object" && currentHoverable
    }) : useHover(interactionContext, {
      enabled: false
    }), useFocus(interactionContext, {
      enabled: !disableRef.current && !disableFocusRef.current,
      visibleOnly: true,
      ...currentFocus
    }), useRole(interactionContext, {
      role: currentRole
    })]);
    const getFloatingProps = currentHoverable ? (userProps) => {
      const merged = getFloatingPropsInner(userProps);
      const origEnter = merged.onMouseEnter;
      const origLeave = merged.onMouseLeave;
      return {
        ...merged,
        onMouseEnter: /* @__PURE__ */ __name((e) => {
          isOverFloatingRef.current = true;
          origEnter?.(e);
        }, "onMouseEnter"),
        onMouseLeave: /* @__PURE__ */ __name((e) => {
          isOverFloatingRef.current = false;
          origLeave?.(e);
        }, "onMouseLeave")
      };
    } : getFloatingPropsInner;
    const openDelay = typeof delay === "number" ? delay : delay?.open ?? 0;
    const closeDelay = typeof delay === "number" ? delay : delay?.close ?? 0;
    const setOpenWithDelay = /* @__PURE__ */ __name(() => {
      clearTimeout(restTimerRef.current);
      if (restMs && !openDelay) {
        restTimerRef.current = setTimeout(() => {
          setOpen(true, "hover");
        }, restMs);
      } else if (openDelay) {
        restTimerRef.current = setTimeout(() => {
          setOpen(true, "hover");
        }, openDelay);
      } else {
        setOpen(true, "hover");
      }
    }, "setOpenWithDelay");
    return {
      ...floating,
      open: openRef.current,
      triggerElements,
      getReferenceProps,
      getFloatingProps,
      onHoverReference: currentHoverable ? (_event) => {
        clearTimeout(graceRef.current);
        onTriggerRef.current = true;
        pendingCloseRef.current = false;
        clearTimeout(restTimerRef.current);
        if (openRef.current) return;
        setOpenWithDelay();
      } : void 0,
      onLeaveReference: currentHoverable ? () => {
        clearTimeout(restTimerRef.current);
        clearTimeout(graceRef.current);
        graceRef.current = setTimeout(() => {
          onTriggerRef.current = false;
          if (pendingCloseRef.current) {
            pendingCloseRef.current = false;
            setOpen(false, "hover");
            return;
          }
          if (openRef.current) {
            graceRef.current = setTimeout(() => {
              if (openRef.current && !isOverFloatingRef.current && !handleCloseActiveRef.current) {
                setOpen(false, "hover");
              }
            }, Math.max(250, closeDelay));
          }
        }, 40);
      } : void 0
    };
  }, [setOpen]);
}, "useFloatingContext");

// node_modules/.pnpm/@hanzogui+popover@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9__1a445a9923a63b01f8cf490dff30475a/node_modules/@hanzogui/popover/dist/esm/Popover.mjs
import { Fragment as Fragment12, jsx as jsx38, jsxs as jsxs7 } from "react/jsx-runtime";
var needsRepropagation2 = needsPortalRepropagation();
var openPopovers = /* @__PURE__ */ new Set();
var PopoverContext = createStyledContext12(
  // since we always provide this we can avoid setting here
  {},
  "Popover__"
);
var PopoverZIndexContext = React60.createContext(void 0);
var PopoverTriggerContext = createStyledContext12({}, "PopoverTrigger__");
var usePopoverContext = PopoverContext.useStyledContext;
var usePopoverTriggerContext = PopoverTriggerContext.useStyledContext;
function usePopoverOpen(scope) {
  return usePopoverContext(scope).open;
}
__name(usePopoverOpen, "usePopoverOpen");
function usePopoverTriggerSetup(open) {
  const triggerStateSettersRef = React60.useRef(/* @__PURE__ */ new Map());
  const activeTriggerIdRef = React60.useRef(null);
  const setActiveTrigger = useEvent5((id) => {
    const prevId = activeTriggerIdRef.current;
    if (prevId === id) return;
    if (prevId) triggerStateSettersRef.current.get(prevId)?.(false);
    activeTriggerIdRef.current = id;
    if (id && open) triggerStateSettersRef.current.get(id)?.(true);
  });
  const registerTrigger = useEvent5((id, setOpenState) => {
    triggerStateSettersRef.current.set(id, setOpenState);
    setOpenState(activeTriggerIdRef.current === id && open);
  });
  const unregisterTrigger = useEvent5((id) => {
    triggerStateSettersRef.current.delete(id);
    if (activeTriggerIdRef.current === id) activeTriggerIdRef.current = null;
  });
  React60.useEffect(() => {
    if (!open) {
      setActiveTrigger(null);
      return;
    }
    const activeId = activeTriggerIdRef.current;
    if (activeId) triggerStateSettersRef.current.get(activeId)?.(true);
  }, [open, setActiveTrigger]);
  return {
    setActiveTrigger,
    registerTrigger,
    unregisterTrigger
  };
}
__name(usePopoverTriggerSetup, "usePopoverTriggerSetup");
var PopoverContextProvider = React60.memo(({
  scope,
  children,
  open,
  onOpenChange,
  onOpenToggle,
  triggerRef,
  id = "",
  contentId,
  hasCustomAnchor = false,
  onCustomAnchorAdd = voidFn,
  onCustomAnchorRemove = voidFn,
  anchorTo,
  adaptScope,
  breakpointActive,
  keepChildrenMounted,
  disableDismissable,
  hoverable
}) => {
  const [branches] = React60.useState(() => /* @__PURE__ */ new Set());
  const {
    setActiveTrigger,
    registerTrigger,
    unregisterTrigger
  } = usePopoverTriggerSetup(open);
  return /* @__PURE__ */ jsx38(PopoverContext.Provider, {
    scope,
    popoverScope: scope,
    adaptScope,
    id,
    contentId,
    triggerRef,
    open,
    onOpenChange,
    onOpenToggle,
    hasCustomAnchor,
    onCustomAnchorAdd,
    onCustomAnchorRemove,
    anchorTo,
    branches,
    breakpointActive,
    keepChildrenMounted,
    disableDismissable,
    hoverable,
    children: /* @__PURE__ */ jsx38(PopoverTriggerContext.Provider, {
      scope,
      triggerRef,
      hasCustomAnchor,
      anchorTo,
      branches,
      onOpenToggle,
      setActiveTrigger,
      registerTrigger,
      unregisterTrigger,
      children
    })
  });
});
var voidFn = /* @__PURE__ */ __name(() => {
}, "voidFn");
var PopoverAnchor = React60.memo(React60.forwardRef(/* @__PURE__ */ __name(function PopoverAnchor2(props, forwardedRef) {
  const {
    scope,
    ...rest
  } = props;
  const {
    onCustomAnchorAdd,
    onCustomAnchorRemove
  } = usePopoverContext(scope) || {};
  React60.useEffect(() => {
    onCustomAnchorAdd();
    return () => onCustomAnchorRemove();
  }, [onCustomAnchorAdd, onCustomAnchorRemove]);
  return /* @__PURE__ */ jsx38(PopperAnchor, {
    scope,
    ...rest,
    ref: forwardedRef
  });
}, "PopoverAnchor2")));
var PopoverTrigger = React60.memo(React60.forwardRef(/* @__PURE__ */ __name(function PopoverTrigger2(props, forwardedRef) {
  const {
    scope,
    disablePressTrigger,
    ...rest
  } = props;
  const triggerContext = usePopoverTriggerContext(scope);
  const triggerId = React60.useId();
  const [open, setOpen] = React60.useState(false);
  const anchorTo = triggerContext.anchorTo;
  const triggerElRef = React60.useRef(null);
  const composedTriggerRef = useComposedRefs(forwardedRef, triggerElRef);
  const {
    registerTrigger,
    unregisterTrigger
  } = triggerContext;
  React60.useEffect(() => {
    registerTrigger(triggerId, setOpen);
    return () => {
      unregisterTrigger(triggerId);
    };
  }, [registerTrigger, unregisterTrigger, triggerId]);
  if (!rest.children) return null;
  const activateSelf = /* @__PURE__ */ __name(() => {
    triggerContext.setActiveTrigger(triggerId);
    const el = triggerElRef.current;
    if (el) triggerContext.triggerRef.current = el;
  }, "activateSelf");
  const trigger = /* @__PURE__ */ jsx38(View13, {
    "aria-expanded": open,
    "data-state": getState4(open),
    ...rest,
    ref: composedTriggerRef,
    onPress: composeEventHandlers(rest.onPress, () => {
      if (disablePressTrigger) return;
      triggerContext.setActiveTrigger(open ? null : triggerId);
      triggerContext.onOpenToggle();
    }),
    onMouseEnter: composeEventHandlers(rest.onMouseEnter, activateSelf),
    onPressIn: composeEventHandlers(rest.onPressIn, activateSelf),
    onFocus: composeEventHandlers(rest.onFocus, activateSelf)
  });
  const virtualRef = React60.useMemo(() => {
    if (!anchorTo) return null;
    return {
      current: {
        getBoundingClientRect: /* @__PURE__ */ __name(() => isWeb ? DOMRect.fromRect(anchorTo) : anchorTo, "getBoundingClientRect"),
        ...!isWeb && {
          measure: /* @__PURE__ */ __name((c) => c(anchorTo?.x, anchorTo?.y, anchorTo?.width, anchorTo?.height), "measure"),
          measureInWindow: /* @__PURE__ */ __name((c) => c(anchorTo?.x, anchorTo?.y, anchorTo?.width, anchorTo?.height), "measureInWindow")
        }
      }
    };
  }, [triggerContext.anchorTo, anchorTo?.x, anchorTo?.y, anchorTo?.height, anchorTo?.width]);
  const wrappedTrigger = isWeb ? /* @__PURE__ */ jsx38(DismissableBranch, {
    branches: triggerContext.branches,
    children: trigger
  }) : trigger;
  return triggerContext.hasCustomAnchor ? wrappedTrigger : /* @__PURE__ */ jsx38(PopperAnchor, {
    ...virtualRef && {
      virtualRef
    },
    scope,
    asChild: true,
    children: wrappedTrigger
  });
}, "PopoverTrigger2")));
var PopoverContent = PopperContentFrame.styleable(/* @__PURE__ */ __name(function PopoverContent2(props, forwardedRef) {
  const {
    trapFocus,
    enableRemoveScroll = false,
    zIndex: zIndexProp,
    scope,
    ...contentImplProps
  } = props;
  const context3 = usePopoverContext(scope);
  const zIndexFromContext = React60.useContext(PopoverZIndexContext);
  const zIndex = zIndexProp ?? zIndexFromContext;
  const open = usePopoverOpen(scope);
  const composedRefs = useComposedRefs(forwardedRef, React60.useRef(null));
  const isRightClickOutsideRef = React60.useRef(false);
  const [isFullyHidden, setIsFullyHidden] = React60.useState(!open);
  useIsomorphicLayoutEffect(() => {
    if (open && isFullyHidden) setIsFullyHidden(false);
  }, [open, isFullyHidden]);
  if (!context3.keepChildrenMounted) {
    if (isFullyHidden && !open) return null;
  }
  return /* @__PURE__ */ jsx38(PopoverPortal, {
    passThrough: context3.breakpointActive,
    context: context3,
    open,
    zIndex,
    children: /* @__PURE__ */ jsx38(View13, {
      passThrough: context3.breakpointActive,
      pointerEvents: open ? contentImplProps.pointerEvents ?? "auto" : "none",
      children: /* @__PURE__ */ jsx38(PopoverContentImpl, {
        ...contentImplProps,
        context: context3,
        open,
        enableRemoveScroll,
        ref: composedRefs,
        setIsFullyHidden,
        scope,
        trapFocus: trapFocus ?? open,
        disableOutsidePointerEvents: true,
        onCloseAutoFocus: props.onCloseAutoFocus === false ? void 0 : composeEventHandlers(props.onCloseAutoFocus, (event) => {
          if (event.defaultPrevented) return;
          event.preventDefault();
          if (!isRightClickOutsideRef.current) context3.triggerRef.current?.focus();
        }),
        onPointerDownOutside: composeEventHandlers(props.onPointerDownOutside, (event) => {
          const originalEvent = event.detail.originalEvent;
          const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
          isRightClickOutsideRef.current = originalEvent.button === 2 || ctrlLeftClick;
        }, {
          checkDefaultPrevented: false
        }),
        onFocusOutside: composeEventHandlers(props.onFocusOutside, (event) => event.preventDefault(), {
          checkDefaultPrevented: false
        })
      })
    })
  });
}, "PopoverContent2"));
var useParentContexts = /* @__PURE__ */ __name((scope) => {
  const context3 = usePopoverContext(scope);
  const triggerContext = usePopoverTriggerContext(scope);
  return {
    popperContext: usePopperContext(scope),
    adaptContext: useAdaptContext(context3.adaptScope),
    context: context3,
    triggerContext
  };
}, "useParentContexts");
function RepropagateParentContexts({
  adaptContext,
  children,
  context: context3,
  triggerContext,
  popperContext
}) {
  return /* @__PURE__ */ jsx38(PopperProvider, {
    scope: context3.popoverScope,
    ...popperContext,
    children: /* @__PURE__ */ jsx38(PopoverContext.Provider, {
      scope: context3.popoverScope,
      ...context3,
      children: /* @__PURE__ */ jsx38(PopoverTriggerContext.Provider, {
        scope: context3.popoverScope,
        ...triggerContext,
        children: /* @__PURE__ */ jsx38(ProvideAdaptContext, {
          ...adaptContext,
          children
        })
      })
    })
  });
}
__name(RepropagateParentContexts, "RepropagateParentContexts");
var PortalAdaptSafe = /* @__PURE__ */ __name(({
  children,
  context: context3
}) => {
  "use no memo";
  if (needsRepropagation2) {
    const parentContexts = useParentContexts(context3.popoverScope);
    return /* @__PURE__ */ jsx38(AdaptPortalContents, {
      scope: context3.adaptScope,
      children: /* @__PURE__ */ jsx38(RepropagateParentContexts, {
        ...parentContexts,
        children
      })
    });
  }
  return /* @__PURE__ */ jsx38(AdaptPortalContents, {
    scope: context3.adaptScope,
    children
  });
}, "PortalAdaptSafe");
function PopoverPortal({
  context: context3,
  open,
  zIndex,
  passThrough,
  children,
  onPress
}) {
  "use no memo";
  let content = children;
  if (needsRepropagation2) content = /* @__PURE__ */ jsx38(RepropagateParentContexts, {
    ...useParentContexts(context3.popoverScope),
    children: content
  });
  return /* @__PURE__ */ jsxs7(Portal, {
    passThrough,
    stackZIndex: true,
    zIndex,
    children: [!!open && !context3.breakpointActive && !context3.hoverable && /* @__PURE__ */ jsx38(YStack, {
      fullscreen: true,
      onPress: composeEventHandlers(onPress, context3.onOpenToggle)
    }), content]
  });
}
__name(PopoverPortal, "PopoverPortal");
var PopoverContentImpl = React60.forwardRef(/* @__PURE__ */ __name(function PopoverContentImpl2(props, forwardedRef) {
  const {
    trapFocus,
    scope,
    onOpenAutoFocus,
    onCloseAutoFocus,
    disableOutsidePointerEvents,
    disableFocusScope,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    children,
    enableRemoveScroll,
    freezeContentsWhenHidden,
    setIsFullyHidden,
    lazyMount,
    forceUnmount,
    context: context3,
    open,
    alwaysDisable,
    ...contentProps
  } = props;
  const {
    keepChildrenMounted,
    disableDismissable
  } = context3;
  const handleExitComplete = React60.useCallback(() => {
    setIsFullyHidden?.(true);
  }, [setIsFullyHidden]);
  let contents = /* @__PURE__ */ jsx38(ResetPresence, {
    disable: context3.breakpointActive,
    children
  });
  const handleDismiss = React60.useCallback(() => {
    context3.onOpenChange(false, "press");
  }, [context3]);
  if (!context3.breakpointActive) {
    if (!alwaysDisable || !alwaysDisable.focus) contents = /* @__PURE__ */ jsx38(FocusScope, {
      loop: trapFocus !== false,
      enabled: context3.breakpointActive ? false : disableFocusScope ? false : open,
      trapped: context3.breakpointActive ? false : trapFocus,
      onMountAutoFocus: onOpenAutoFocus,
      onUnmountAutoFocus: onCloseAutoFocus === false ? void 0 : onCloseAutoFocus,
      children: /* @__PURE__ */ jsx38("div", {
        style: dspContentsStyle,
        children: contents
      })
    });
    if (!alwaysDisable || !alwaysDisable["remove-scroll"]) contents = /* @__PURE__ */ jsx38(RemoveScroll, {
      enabled: context3.breakpointActive ? false : enableRemoveScroll ? open : false,
      children: contents
    });
    if (!alwaysDisable || !alwaysDisable.dismiss) contents = /* @__PURE__ */ jsx38(Dismissable, {
      branches: context3.branches,
      forceUnmount: disableDismissable || (forceUnmount ?? !open),
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss: handleDismiss,
      children: contents
    });
  }
  return /* @__PURE__ */ jsx38(Animate, {
    type: "presence",
    present: Boolean(open),
    keepChildrenMounted: Boolean(keepChildrenMounted),
    onExitComplete: handleExitComplete,
    lazyMount,
    passThrough: context3.breakpointActive,
    children: /* @__PURE__ */ jsx38(PopperContent, {
      scope,
      "data-state": getState4(open),
      id: context3.contentId,
      ref: forwardedRef,
      passThrough: context3.breakpointActive,
      ...!contentProps.unstyled && {
        size: "$true",
        backgroundColor: "$background",
        alignItems: "center"
      },
      ...contentProps,
      children: /* @__PURE__ */ jsx38(PortalAdaptSafe, {
        context: context3,
        children: contents
      })
    }, context3.contentId)
  });
}, "PopoverContentImpl2"));
var dspContentsStyle = {
  display: "contents"
};
var PopoverClose = React60.forwardRef(/* @__PURE__ */ __name(function PopoverClose2(props, forwardedRef) {
  const {
    scope,
    ...rest
  } = props;
  const context3 = usePopoverContext(scope);
  return /* @__PURE__ */ jsx38(YStack, {
    ...rest,
    ref: forwardedRef,
    componentName: "PopoverClose",
    onPress: composeEventHandlers(props.onPress, () => context3?.onOpenChange?.(false, "press"))
  });
}, "PopoverClose2"));
var PopoverArrow = PopperArrowFrame.styleable(/* @__PURE__ */ __name(function PopoverArrow2(props, forwardedRef) {
  const {
    scope,
    ...rest
  } = props;
  if (useAdaptIsActive(usePopoverContext(scope).adaptScope)) return null;
  return /* @__PURE__ */ jsx38(PopperArrow, {
    scope,
    componentName: "PopoverArrow",
    ...rest,
    ref: forwardedRef
  });
}, "PopoverArrow2"));
var PopoverScrollView = React60.forwardRef(({
  scope,
  ...props
}, ref) => {
  const context3 = usePopoverContext(scope);
  return /* @__PURE__ */ jsx38(ScrollView2, {
    ref,
    pointerEvents: context3.breakpointActive ? "none" : void 0,
    scrollEnabled: !context3.breakpointActive,
    passThrough: context3.breakpointActive,
    ...props
  });
});
var DEFAULT_SCOPE = "";
var Popover = withStaticProperties(React60.forwardRef(/* @__PURE__ */ __name(function Popover2({
  scope = DEFAULT_SCOPE,
  ...props
}, ref) {
  const id = React60.useId();
  const adaptScope = `PopoverAdapt${scope}`;
  return /* @__PURE__ */ jsx38(AdaptParent, {
    scope: adaptScope,
    portal: true,
    children: /* @__PURE__ */ jsx38(PopoverInner, {
      adaptScope,
      ref,
      id,
      scope,
      ...props
    })
  });
}, "Popover2")), {
  Anchor: PopoverAnchor,
  Arrow: PopoverArrow,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
  Adapt,
  ScrollView: PopoverScrollView,
  FocusScope: FocusScopeControllerComponent
});
var PopoverInner = React60.forwardRef(/* @__PURE__ */ __name(function PopoverInner2(props, forwardedRef) {
  const {
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    scope = DEFAULT_SCOPE,
    keepChildrenMounted: keepChildrenMountedProp,
    hoverable,
    disableFocus,
    disableDismissable,
    zIndex,
    id,
    adaptScope,
    ...restProps
  } = props;
  const triggerRef = React60.useRef(null);
  const [hasCustomAnchor, setHasCustomAnchor] = React60.useState(false);
  const viaRef = React60.useRef(void 0);
  const [keepChildrenMounted] = useControllableState({
    prop: keepChildrenMountedProp,
    defaultProp: false,
    transition: keepChildrenMountedProp === "lazy"
  });
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen || false,
    onChange: /* @__PURE__ */ __name((val) => {
      onOpenChange?.(val, viaRef.current);
    }, "onChange")
  });
  React60.useEffect(() => {
    if (!open) return;
    openPopovers.add(setOpen);
    return () => {
      openPopovers.delete(setOpen);
    };
  }, [open, setOpen]);
  const handleOpenChange = useEvent5((val, via) => {
    viaRef.current = via;
    setOpen(val);
  });
  const isAdapted = useAdaptIsActive(adaptScope);
  const floatingContext = useFloatingContext({
    open,
    setOpen: handleOpenChange,
    disable: isAdapted,
    hoverable,
    disableFocus
  });
  const [anchorTo, setAnchorToRaw] = React60.useState();
  const setAnchorTo = useCreateShallowSetState(setAnchorToRaw);
  React60.useImperativeHandle(forwardedRef, () => ({
    anchorTo: setAnchorTo,
    toggle: /* @__PURE__ */ __name(() => setOpen((prev) => !prev), "toggle"),
    open: /* @__PURE__ */ __name(() => setOpen(true), "open"),
    close: /* @__PURE__ */ __name(() => setOpen(false), "close"),
    setOpen
  }));
  const contentId = React60.useId();
  const onOpenToggle = useEvent5(() => {
    if (open && isAdapted) return;
    setOpen(!open);
  });
  const onCustomAnchorAdd = React60.useCallback(() => setHasCustomAnchor(true), []);
  const onCustomAnchorRemove = React60.useCallback(() => setHasCustomAnchor(false), []);
  const contents = /* @__PURE__ */ jsx38(Popper, {
    open,
    passThrough: isAdapted,
    scope,
    stayInFrame: true,
    ...restProps,
    children: /* @__PURE__ */ jsx38(PopoverContextProvider, {
      scope,
      open,
      onOpenChange: handleOpenChange,
      onOpenToggle,
      triggerRef,
      id,
      contentId,
      hasCustomAnchor,
      onCustomAnchorAdd,
      onCustomAnchorRemove,
      anchorTo,
      adaptScope,
      breakpointActive: isAdapted,
      keepChildrenMounted,
      disableDismissable,
      hoverable,
      children: /* @__PURE__ */ jsx38(PopoverSheetController, {
        onOpenChange: setOpen,
        open,
        scope,
        children
      })
    })
  });
  let result = /* @__PURE__ */ jsx38(Fragment12, {
    children: isWeb ? /* @__PURE__ */ jsx38(FloatingOverrideContext.Provider, {
      value: floatingContext,
      children: contents
    }) : contents
  });
  if (zIndex !== void 0) return /* @__PURE__ */ jsx38(PopoverZIndexContext.Provider, {
    value: zIndex,
    children: result
  });
  return result;
}, "PopoverInner2"));
function getState4(open) {
  return open ? "open" : "closed";
}
__name(getState4, "getState");
var PopoverSheetController = /* @__PURE__ */ __name(({
  open,
  scope,
  ...props
}) => {
  const context3 = usePopoverContext(scope);
  const showSheet = useShowPopoverSheet(context3, open);
  const breakpointActive = context3?.breakpointActive;
  const getShowSheet = useGet2(showSheet);
  return /* @__PURE__ */ jsx38(SheetController, {
    onOpenChange: /* @__PURE__ */ __name((val) => {
      if (getShowSheet()) props.onOpenChange?.(val);
    }, "onOpenChange"),
    open,
    hidden: !breakpointActive,
    children: props.children
  });
}, "PopoverSheetController");
var useShowPopoverSheet = /* @__PURE__ */ __name((context3, open) => {
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  return open === false ? false : isAdapted;
}, "useShowPopoverSheet");

// node_modules/.pnpm/@hanzogui+progress@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_8fb3ce368a38297beca68ac63f9f4802/node_modules/@hanzogui/progress/dist/esm/Progress.mjs
import { getVariableValue as getVariableValue6, isWeb as isWeb8, styled as styled23 } from "@hanzogui/core";
import { useState as useState17 } from "react";
import { jsx as jsx39 } from "react/jsx-runtime";
var PROGRESS_NAME = "Progress";
var [createProgressContext, createProgressScope] = createContextScope(PROGRESS_NAME);
var [ProgressProvider, useProgressContext] = createProgressContext(PROGRESS_NAME);
var INDICATOR_NAME2 = "ProgressIndicator";
var ProgressIndicatorFrame = styled23(YStack, {
  name: INDICATOR_NAME2,
  variants: {
    unstyled: {
      false: {
        height: "100%",
        width: "100%",
        backgroundColor: "$background"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ProgressIndicator = ProgressIndicatorFrame.styleable(/* @__PURE__ */ __name(function ProgressIndicator2(props, forwardedRef) {
  const {
    __scopeProgress,
    transition: transition2,
    ...indicatorProps
  } = props;
  const context3 = useProgressContext(INDICATOR_NAME2, __scopeProgress);
  const progressRatio = (context3.value ?? 0) / context3.max;
  let x;
  if (isWeb8) {
    x = `${-100 + progressRatio * 50}%`;
  } else {
    const baseWidth = context3.width || 0;
    x = Math.ceil(-baseWidth * (2 - progressRatio));
  }
  return /* @__PURE__ */ jsx39(ProgressIndicatorFrame, {
    "data-state": getProgressState(context3.value, context3.max),
    "data-value": context3.value ?? void 0,
    "data-max": context3.max,
    x,
    width: "200%",
    ...!props.unstyled && {
      animateOnly: ["transform"],
      // on native, hide until we have width measurement
      ...!isWeb8 && context3.width === 0 && {
        opacity: 0
      }
    },
    ...indicatorProps,
    ref: forwardedRef,
    transition: !isWeb8 && !context3.width ? null : transition2
  });
}, "ProgressIndicator2"));
function defaultGetValueLabel(value, max2) {
  return `${Math.round(value / max2 * 100)}%`;
}
__name(defaultGetValueLabel, "defaultGetValueLabel");
function getProgressState(value, maxValue) {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}
__name(getProgressState, "getProgressState");
function isNumber(value) {
  return typeof value === "number";
}
__name(isNumber, "isNumber");
function isValidMaxNumber(max2) {
  return isNumber(max2) && !Number.isNaN(max2) && max2 > 0;
}
__name(isValidMaxNumber, "isValidMaxNumber");
function isValidValueNumber(value, max2) {
  return isNumber(value) && !Number.isNaN(value) && value <= max2 && value >= 0;
}
__name(isValidValueNumber, "isValidValueNumber");
var DEFAULT_MAX = 100;
var ProgressFrame = styled23(YStack, {
  name: "Progress",
  variants: {
    unstyled: {
      false: {
        borderRadius: 1e5,
        overflow: "hidden",
        backgroundColor: "$background"
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val) => {
        const size4 = Math.round(getVariableValue6(getSize(val)) * 0.25);
        return {
          height: size4,
          minWidth: getVariableValue6(size4) * 20,
          width: "100%"
        };
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var Progress = withStaticProperties(ProgressFrame.styleable(/* @__PURE__ */ __name(function Progress2(props, forwardedRef) {
  const {
    // @ts-expect-error
    __scopeProgress,
    value: valueProp,
    max: maxProp,
    getValueLabel = defaultGetValueLabel,
    size: size4 = "$true",
    ...progressProps
  } = props;
  const max2 = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
  const value = isValidValueNumber(valueProp, max2) ? Math.round(valueProp) : null;
  const valueLabel = isNumber(value) ? getValueLabel(value, max2) : void 0;
  const [width, setWidth] = useState17(0);
  return /* @__PURE__ */ jsx39(ProgressProvider, {
    scope: __scopeProgress,
    value,
    max: max2,
    width,
    children: /* @__PURE__ */ jsx39(ProgressFrame, {
      "aria-valuemax": max2,
      "aria-valuemin": 0,
      "aria-valuenow": isNumber(value) ? value : void 0,
      "aria-valuetext": valueLabel,
      role: "progressbar",
      "data-state": getProgressState(value, max2),
      "data-value": value ?? void 0,
      "data-max": max2,
      ...progressProps.unstyled !== true && {
        size: size4
      },
      ...progressProps,
      ...!isWeb8 && {
        onLayout: /* @__PURE__ */ __name((e) => {
          const newWidth = Math.round(e.nativeEvent.layout.width);
          if (newWidth !== width) {
            setWidth(newWidth);
          }
          progressProps.onLayout?.(e);
        }, "onLayout")
      },
      ref: forwardedRef
    })
  });
}, "Progress2")), {
  Indicator: ProgressIndicator
});

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/Select.mjs
import { createStyledContext as createStyledContext15, getVariableValue as getVariableValue7, styled as styled27, useEvent as useEvent7, useGet as useGet3 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+separator@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83._9571619ef4fc8ffd3fcc1083772641b1/node_modules/@hanzogui/separator/dist/esm/Separator.mjs
import { View as View14, styled as styled24 } from "@hanzogui/core";
var Separator = styled24(View14, {
  name: "Separator",
  variants: {
    unstyled: {
      false: {
        borderColor: "$backgroundFocus",
        flexShrink: 0,
        borderWidth: 0,
        flex: 1,
        height: 0,
        maxHeight: 0,
        borderBottomWidth: 1,
        y: -0.5
      }
    },
    vertical: {
      true: {
        y: 0,
        x: -0.5,
        height: isWeb ? "initial" : "auto",
        // maxHeight auto WILL BE passed to style attribute, but for some reason not used?
        // almost seems like a react or browser bug, but for now `initial` works
        // also, it doesn't happen for `height`, but for consistency using the same values
        maxHeight: isWeb ? "initial" : "auto",
        width: 0,
        maxWidth: 0,
        borderBottomWidth: 0,
        borderRightWidth: 1
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/Select.mjs
import * as React67 from "react";

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/context.mjs
import { createStyledContext as createStyledContext13 } from "@hanzogui/core";
import { createContext as createContext16 } from "react";
import { jsx as jsx40 } from "react/jsx-runtime";
var SelectZIndexContext = createContext16(void 0);
var {
  Provider: SelectProvider,
  useStyledContext: useSelectContext
} = createStyledContext13(null, "Select");
var {
  Provider: SelectItemParentProvider,
  useStyledContext: useSelectItemParentContext
} = createStyledContext13(null, "SelectItem");
var ForwardSelectContext = /* @__PURE__ */ __name(({
  context: context3,
  itemContext,
  children
}) => {
  const portalState = getPortal().state;
  if (portalState.type === "teleport") {
    return children;
  }
  return /* @__PURE__ */ jsx40(SelectProvider, {
    isInSheet: true,
    scope: context3.scopeName,
    ...context3,
    children: /* @__PURE__ */ jsx40(SelectItemParentProvider, {
      scope: context3.scopeName,
      ...itemContext,
      children
    })
  });
}, "ForwardSelectContext");

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectContent.mjs
import { isWeb as isWeb9 } from "@hanzogui/core";
import { useContext as useContext17 } from "react";

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/useSelectBreakpointActive.mjs
var useShowSelectSheet = /* @__PURE__ */ __name((context3) => {
  const breakpointActive = useAdaptIsActive(context3.adaptScope);
  return context3.open === false ? false : breakpointActive;
}, "useShowSelectSheet");

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectContent.mjs
import { Fragment as Fragment13, jsx as jsx41 } from "react/jsx-runtime";
var SelectContent = /* @__PURE__ */ __name(({
  children,
  scope,
  ...focusScopeProps
}) => {
  const context3 = useSelectContext(scope);
  const itemParentContext = useSelectItemParentContext(scope);
  const zIndex = useContext17(SelectZIndexContext);
  const showSheet = useShowSelectSheet(context3);
  const contents = children;
  if (itemParentContext.shouldRenderWebNative) {
    return /* @__PURE__ */ jsx41(Fragment13, {
      children
    });
  }
  if (showSheet) {
    if (!context3.open) {
      return null;
    }
    return /* @__PURE__ */ jsx41(Fragment13, {
      children: contents
    });
  }
  return /* @__PURE__ */ jsx41(Portal, {
    open: context3.open,
    zIndex,
    stackZIndex: 1e5,
    children: /* @__PURE__ */ jsx41(RemoveScroll, {
      enabled: context3.open && !context3.disablePreventBodyScroll,
      children: /* @__PURE__ */ jsx41(Dismissable, {
        asChild: true,
        forceUnmount: !context3.open,
        onDismiss: /* @__PURE__ */ __name(() => itemParentContext.setOpen(false), "onDismiss"),
        onFocusOutside: /* @__PURE__ */ __name((e) => e.preventDefault(), "onFocusOutside"),
        onPointerDownOutside: /* @__PURE__ */ __name((e) => e.preventDefault(), "onPointerDownOutside"),
        children: /* @__PURE__ */ jsx41(FocusScope, {
          ...focusScopeProps,
          enabled: !!context3.open,
          trapped: true,
          onMountAutoFocus: /* @__PURE__ */ __name((e) => {
            e.preventDefault();
          }, "onMountAutoFocus"),
          onUnmountAutoFocus: /* @__PURE__ */ __name((e) => {
            e.preventDefault();
            const trigger = context3.floatingContext?.refs?.reference?.current;
            if (trigger instanceof HTMLElement) {
              trigger.focus();
            }
          }, "onUnmountAutoFocus"),
          children: isWeb9 ? /* @__PURE__ */ jsx41("div", {
            style: {
              display: "contents"
            },
            children: contents
          }) : contents
        })
      })
    })
  });
}, "SelectContent");

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectImpl.mjs
import { useEvent as useEvent6, useIsTouchDevice as useIsTouchDevice3 } from "@hanzogui/core";
import * as React61 from "react";
import { flushSync as flushSync6 } from "react-dom";

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/constants.mjs
var SCROLL_ARROW_THRESHOLD = 8;
var VIEWPORT_NAME = "SelectViewport";

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectImpl.mjs
import { jsx as jsx42 } from "react/jsx-runtime";
var SelectInlineImpl = /* @__PURE__ */ __name((props) => {
  const {
    scope,
    children,
    open = false,
    listContentRef,
    setActiveIndexFast
  } = props;
  const selectContext = useSelectContext(scope);
  const selectItemParentContext = useSelectItemParentContext(scope);
  const {
    setActiveIndex,
    selectedIndex,
    activeIndexRef
  } = selectContext;
  const {
    setOpen,
    setSelectedIndex
  } = selectItemParentContext;
  const [scrollTop, setScrollTop] = React61.useState(0);
  const touch2 = useIsTouchDevice3();
  const listItemsRef = React61.useRef([]);
  const overflowRef = React61.useRef(null);
  const upArrowRef = React61.useRef(null);
  const downArrowRef = React61.useRef(null);
  const allowSelectRef = React61.useRef(false);
  const allowMouseUpRef = React61.useRef(true);
  const selectTimeoutRef = React61.useRef(null);
  const state4 = React61.useRef({
    isMouseOutside: false,
    isTyping: false
  });
  const [controlledScrolling, setControlledScrolling] = React61.useState(false);
  const [fallback, setFallback] = React61.useState(false);
  const [innerOffset, setInnerOffset] = React61.useState(0);
  const [blockSelection, setBlockSelection] = React61.useState(false);
  const floatingStyle = React61.useRef({});
  React61.useEffect(() => {
    if (open) setActiveIndexFast(selectedIndex ?? 0);
    else {
      setScrollTop(0);
      setFallback(false);
      setActiveIndexFast(null);
      setControlledScrolling(false);
    }
  }, [open, selectedIndex, setActiveIndexFast]);
  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    const mouseUp = /* @__PURE__ */ __name((e) => {
      if (state4.current.isMouseOutside) setOpen(false);
    }, "mouseUp");
    document.addEventListener("mouseup", mouseUp);
    return () => {
      document.removeEventListener("mouseup", mouseUp);
    };
  }, [open]);
  const {
    x,
    y,
    strategy,
    refs,
    update: update2,
    placement: computedPlacement
  } = useFloating({
    open,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [size3({
      apply({
        rects: {
          reference: {
            width
          }
        }
      }) {
        Object.assign(floatingStyle.current, {
          minWidth: width + 8
        });
        if (refs.floating.current) Object.assign(refs.floating.current.style, floatingStyle.current);
      }
    }), inner({
      listRef: listItemsRef,
      overflowRef,
      index: selectedIndex,
      offset: innerOffset,
      onFallbackChange: setFallback,
      padding: 10,
      minItemsVisible: touch2 ? 10 : 4,
      referenceOverflowThreshold: 20
    }), offset3({
      crossAxis: -5
    })]
  });
  const floatingRef = refs.floating;
  const showUpArrow = open && scrollTop > SCROLL_ARROW_THRESHOLD;
  const showDownArrow = open && floatingRef.current && scrollTop < floatingRef.current.scrollHeight - floatingRef.current.clientHeight - SCROLL_ARROW_THRESHOLD;
  const isScrollable = showDownArrow || showUpArrow;
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", update2);
    if (open) update2();
    return () => window.removeEventListener("resize", update2);
  }, [update2, open]);
  const onMatch = useEvent6((index2) => {
    return (open ? setActiveIndex : setSelectedIndex)(index2);
  });
  const dataRef = React61.useRef({});
  dataRef.current.placement = computedPlacement;
  const interactionContext = {
    open,
    onOpenChange: /* @__PURE__ */ __name((val) => setOpen(val), "onOpenChange"),
    refs: {
      reference: refs.reference,
      floating: refs.floating,
      domReference: refs.reference
    },
    elements: {
      reference: refs.reference?.current || null,
      floating: refs.floating?.current || null,
      domReference: refs.reference?.current || null
    },
    dataRef
  };
  const interactionsProps = [useClick(interactionContext, {
    event: "mousedown",
    keyboardHandlers: false
  }), useRole(interactionContext, {
    role: "listbox"
  }), useInnerOffset(interactionContext, {
    enabled: !fallback && isScrollable,
    onChange: setInnerOffset,
    overflowRef,
    scrollRef: refs.floating
  }), useListNavigation(interactionContext, {
    listRef: listItemsRef,
    activeIndex: selectContext.activeIndex ?? 0,
    selectedIndex,
    onNavigate: /* @__PURE__ */ __name((index2) => {
      if (index2 !== null) setActiveIndex(index2);
    }, "onNavigate"),
    scrollItemIntoView: false
  }), useTypeahead(interactionContext, {
    listRef: listContentRef,
    onMatch,
    selectedIndex,
    activeIndex: selectContext.activeIndex,
    onTypingChange: /* @__PURE__ */ __name((e) => {
      state4.current.isTyping = e;
    }, "onTypingChange")
  })];
  const interactions = useInteractions(React61.useMemo(() => {
    return interactionsProps;
  }, interactionsProps));
  const interactionsContext = React61.useMemo(() => {
    return {
      ...interactions,
      getReferenceProps() {
        return interactions.getReferenceProps({
          ref: refs.reference,
          className: "SelectTrigger",
          onKeyDown(event) {
            if (event.key === "Enter" || event.code === "Space" || event.key === " " && !state4.current.isTyping) {
              event.preventDefault();
              setOpen(true);
            }
          }
        });
      },
      getFloatingProps(props2) {
        return interactions.getFloatingProps({
          ref: refs.floating,
          className: "Select",
          ...props2,
          style: {
            position: strategy,
            top: y ?? "",
            left: x ?? "",
            outline: 0,
            scrollbarWidth: "none",
            ...floatingStyle.current,
            ...props2?.style
          },
          onPointerEnter() {
            setControlledScrolling(false);
            state4.current.isMouseOutside = false;
          },
          onPointerLeave() {
            state4.current.isMouseOutside = true;
          },
          onPointerMove() {
            state4.current.isMouseOutside = false;
            setControlledScrolling(false);
          },
          onKeyDown() {
            setControlledScrolling(true);
          },
          onContextMenu(e) {
            e.preventDefault();
          },
          onScroll(event) {
            flushSync6(() => {
              setScrollTop(event.currentTarget.scrollTop);
            });
          }
        });
      }
    };
  }, [refs.reference.current, x, y, refs.floating.current, interactions]);
  useIsomorphicLayoutEffect(() => {
    if (open) {
      allowMouseUpRef.current = false;
      selectTimeoutRef.current = setTimeout(() => {
        allowSelectRef.current = true;
        allowMouseUpRef.current = true;
      }, 300);
      return () => {
        clearTimeout(selectTimeoutRef.current);
      };
    }
    allowSelectRef.current = false;
    allowMouseUpRef.current = true;
    setInnerOffset(0);
    setFallback(false);
    setBlockSelection(false);
  }, [open]);
  useIsomorphicLayoutEffect(() => {
    if (!open && state4.current.isMouseOutside) state4.current.isMouseOutside = false;
  }, [open]);
  useIsomorphicLayoutEffect(() => {
    function onPointerDown(e) {
      const target = e.target;
      if (!(refs.floating.current?.contains(target) || upArrowRef.current?.contains(target) || downArrowRef.current?.contains(target))) {
        setOpen(false);
        setControlledScrolling(false);
      }
    }
    __name(onPointerDown, "onPointerDown");
    if (open) {
      document.addEventListener("pointerdown", onPointerDown);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
      };
    }
  }, [open, refs, setOpen]);
  React61.useEffect(() => {
    if (!open) return;
    const scrollActiveIntoView = /* @__PURE__ */ __name((index2) => {
      if (controlledScrolling && index2 != null) listItemsRef.current[index2]?.scrollIntoView({
        block: "nearest"
      });
      setScrollTop(refs.floating.current?.scrollTop ?? 0);
    }, "scrollActiveIntoView");
    scrollActiveIntoView(activeIndexRef.current);
    return selectItemParentContext.activeIndexSubscribe(scrollActiveIntoView);
  }, [open, refs, controlledScrolling, selectItemParentContext.activeIndexSubscribe]);
  React61.useEffect(() => {
    if (open && fallback) {
      if (selectedIndex != null) listItemsRef.current[selectedIndex]?.scrollIntoView({
        block: "nearest"
      });
    }
  }, [open, fallback, selectedIndex]);
  useIsomorphicLayoutEffect(() => {
    if (refs.floating.current && fallback) refs.floating.current.style.maxHeight = "";
  }, [refs, fallback]);
  const floatingContext = React61.useMemo(() => ({
    refs,
    dataRef
  }), [refs]);
  return /* @__PURE__ */ jsx42(SelectProvider, {
    scope,
    ...selectContext,
    setScrollTop,
    setInnerOffset,
    fallback,
    floatingContext,
    canScrollDown: !!showDownArrow,
    canScrollUp: !!showUpArrow,
    controlledScrolling,
    blockSelection,
    upArrowRef,
    downArrowRef,
    update: update2,
    children: /* @__PURE__ */ jsx42(SelectItemParentProvider, {
      scope,
      ...selectItemParentContext,
      allowMouseUpRef,
      allowSelectRef,
      dataRef,
      interactions: interactionsContext,
      listRef: listItemsRef,
      selectTimeoutRef,
      children
    })
  });
}, "SelectInlineImpl");

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectItem.mjs
import { createStyledContext as createStyledContext14 } from "@hanzogui/core";
import * as React62 from "react";
import { jsx as jsx43 } from "react/jsx-runtime";
var ITEM_NAME2 = "SelectItem";
var {
  Provider: SelectItemContextProvider,
  useStyledContext: useSelectItemContext
} = createStyledContext14(null, ITEM_NAME2);
var SelectItem = ListItem2.Frame.styleable(/* @__PURE__ */ __name(function SelectItem2(props, forwardedRef) {
  const {
    scope,
    value,
    disabled = false,
    textValue: textValueProp,
    index: index2,
    ...restProps
  } = props;
  const context3 = useSelectItemParentContext(scope);
  const {
    setSelectedIndex,
    listRef,
    setOpen,
    onChange,
    activeIndexSubscribe,
    activeIndexRef,
    valueSubscribe,
    allowMouseUpRef,
    allowSelectRef,
    setValueAtIndex,
    selectTimeoutRef,
    dataRef,
    interactions,
    shouldRenderWebNative,
    size: size4,
    onActiveChange,
    initialValue,
    setActiveIndexFast
  } = context3;
  const [isSelected, setSelected] = React62.useState(initialValue === value);
  useIsomorphicLayoutEffect(() => {
    if (initialValue === value) {
      setSelectedIndex(index2);
    }
  }, []);
  React62.useEffect(() => {
    const handleActiveIndex = /* @__PURE__ */ __name((i) => {
      if (index2 === i) {
        onActiveChange(value, index2);
        if (isWeb) {
          requestAnimationFrame(() => {
            listRef?.current[index2]?.focus();
          });
        }
      }
    }, "handleActiveIndex");
    const currentActiveIndex = activeIndexRef?.current;
    if (currentActiveIndex !== null && currentActiveIndex !== void 0) {
      handleActiveIndex(currentActiveIndex);
    }
    return activeIndexSubscribe(handleActiveIndex);
  }, [index2]);
  React62.useEffect(() => {
    return valueSubscribe((val) => {
      setSelected(val === value);
    });
  }, [value]);
  const textId = React62.useId();
  const refCallback = React62.useCallback((node) => {
    if (!isWeb) return;
    if (node instanceof HTMLElement) {
      if (listRef) {
        listRef.current[index2] = node;
      }
    }
  }, [index2, listRef]);
  const composedRefs = useComposedRefs(forwardedRef, refCallback);
  useIsomorphicLayoutEffect(() => {
    setValueAtIndex(index2, value);
  }, [index2, setValueAtIndex, value]);
  function handleSelect() {
    setSelectedIndex(index2);
    onChange(value);
    setOpen(false);
  }
  __name(handleSelect, "handleSelect");
  const selectItemProps = React62.useMemo(() => {
    return interactions ? interactions.getItemProps({
      onTouchMove() {
        allowSelectRef.current = true;
        allowMouseUpRef.current = false;
      },
      onTouchEnd() {
        allowSelectRef.current = false;
        allowMouseUpRef.current = true;
      },
      onKeyDown(event) {
        if (event.key === "Enter" || event.key === " " && !dataRef?.current.typing) {
          event.preventDefault();
          handleSelect();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          const itemCount = listRef?.current.length ?? 0;
          if (itemCount === 0) return;
          let nextIndex;
          if (event.key === "ArrowDown") {
            nextIndex = index2 + 1 >= itemCount ? 0 : index2 + 1;
          } else {
            nextIndex = index2 - 1 < 0 ? itemCount - 1 : index2 - 1;
          }
          setActiveIndexFast?.(nextIndex);
        } else {
          allowSelectRef.current = true;
        }
      },
      onClick() {
        if (allowSelectRef.current) {
          handleSelect();
        }
      },
      onMouseUp() {
        if (!allowMouseUpRef.current) {
          allowMouseUpRef.current = true;
          allowSelectRef.current = true;
          return;
        }
        if (allowSelectRef.current) {
          handleSelect();
        }
        clearTimeout(selectTimeoutRef.current);
        selectTimeoutRef.current = setTimeout(() => {
          allowSelectRef.current = true;
        });
      }
    }) : {
      onPress: handleSelect
    };
  }, [handleSelect, index2, listRef, setActiveIndexFast]);
  return /* @__PURE__ */ jsx43(SelectItemContextProvider, {
    scope,
    value,
    textId: textId || "",
    isSelected,
    children: shouldRenderWebNative ? /* @__PURE__ */ jsx43("option", {
      value,
      children: props.children
    }) : /* @__PURE__ */ jsx43(ListItem2.Frame, {
      render: "div",
      componentName: ITEM_NAME2,
      ref: composedRefs,
      role: "option",
      "aria-labelledby": textId,
      "aria-selected": isSelected,
      "data-state": isSelected ? "active" : "inactive",
      "aria-disabled": disabled || void 0,
      "data-disabled": disabled ? "" : void 0,
      tabIndex: disabled ? void 0 : -1,
      ...!props.unstyled && {
        cursor: "default",
        size: size4,
        outlineOffset: -0.5,
        zIndex: 100,
        hoverStyle: {
          backgroundColor: "$backgroundHover"
        },
        pressStyle: {
          backgroundColor: "$backgroundPress"
        },
        focusStyle: {
          backgroundColor: "$backgroundFocus"
        },
        focusVisibleStyle: {
          outlineColor: "$outlineColor",
          outlineWidth: 1,
          outlineStyle: "solid"
        }
      },
      ...restProps,
      ...selectItemProps
    })
  });
}, "SelectItem2"), {
  disableTheme: true
});

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectItemText.mjs
import { styled as styled25, useIsomorphicLayoutEffect as useIsomorphicLayoutEffect2 } from "@hanzogui/core";
import * as React63 from "react";
import { Fragment as Fragment14, jsx as jsx44 } from "react/jsx-runtime";
var ITEM_TEXT_NAME = "SelectItemText";
var SelectItemTextFrame = styled25(SizableText2, {
  name: ITEM_TEXT_NAME,
  variants: {
    unstyled: {
      false: {
        userSelect: "none",
        color: "$color",
        ellipsis: true
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SelectItemText = SelectItemTextFrame.styleable(/* @__PURE__ */ __name(function SelectItemText2(props, forwardedRef) {
  const {
    scope,
    className,
    ...itemTextProps
  } = props;
  const itemParentContext = useSelectItemParentContext(scope);
  const ref = React63.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const itemContext = useSelectItemContext(scope);
  const contents = React63.useRef(null);
  contents.current = /* @__PURE__ */ jsx44(SelectItemTextFrame, {
    className,
    size: itemParentContext.size,
    id: itemContext.textId,
    ...itemTextProps,
    ref: composedRefs
  });
  useIsomorphicLayoutEffect2(() => {
    if (itemParentContext.initialValue === itemContext.value) {
      itemParentContext.setSelectedItem(contents.current);
    }
  }, []);
  useIsomorphicLayoutEffect2(() => {
    return itemParentContext.valueSubscribe((val) => {
      if (val === itemContext.value) {
        itemParentContext.setSelectedItem(contents.current);
      }
    });
  }, [itemContext.value]);
  if (itemParentContext.shouldRenderWebNative) {
    return /* @__PURE__ */ jsx44(Fragment14, {
      children: props.children
    });
  }
  return /* @__PURE__ */ jsx44(Fragment14, {
    children: contents.current
  });
}, "SelectItemText2"));

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectScrollButton.mjs
import * as React64 from "react";
import { flushSync as flushSync7 } from "react-dom";
import { jsx as jsx45 } from "react/jsx-runtime";
var SCROLL_UP_BUTTON_NAME = "SelectScrollUpButton";
var SelectScrollUpButton = React64.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ jsx45(SelectScrollButtonImpl, {
    componentName: SCROLL_UP_BUTTON_NAME,
    ...props,
    dir: "up",
    ref: forwardedRef
  });
});
SelectScrollUpButton.displayName = SCROLL_UP_BUTTON_NAME;
var SCROLL_DOWN_BUTTON_NAME = "SelectScrollDownButton";
var SelectScrollDownButton = React64.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ jsx45(SelectScrollButtonImpl, {
    componentName: SCROLL_DOWN_BUTTON_NAME,
    ...props,
    dir: "down",
    ref: forwardedRef
  });
});
SelectScrollDownButton.displayName = SCROLL_DOWN_BUTTON_NAME;
var SelectScrollButtonImpl = React64.memo(React64.forwardRef((props, forwardedRef) => {
  const {
    scope,
    dir,
    componentName,
    ...scrollIndicatorProps
  } = props;
  const {
    forceUpdate,
    open,
    fallback,
    setScrollTop,
    setInnerOffset,
    ...context3
  } = useSelectContext(scope);
  const floatingRef = context3.floatingContext?.refs.floating;
  const statusRef = React64.useRef("idle");
  const isVisible = context3[dir === "down" ? "canScrollDown" : "canScrollUp"];
  const frameRef = React64.useRef(null);
  const {
    x,
    y,
    refs,
    strategy
  } = useFloating({
    open: open && isVisible,
    strategy: "fixed",
    elements: {
      reference: floatingRef?.current
    },
    placement: dir === "up" ? "top" : "bottom",
    middleware: [offset3(({
      rects
    }) => -rects.floating.height)],
    whileElementsMounted: /* @__PURE__ */ __name((...args) => autoUpdate(...args, {
      animationFrame: true
    }), "whileElementsMounted")
  });
  const composedRef = useComposedRefs(forwardedRef, refs.setFloating);
  if (!isVisible) {
    return null;
  }
  const onScroll = /* @__PURE__ */ __name((amount) => {
    const floating = floatingRef;
    if (!floating) return;
    if (fallback) {
      if (floating.current) {
        floating.current.scrollTop -= amount;
        flushSync7(() => setScrollTop(floating.current?.scrollTop ?? 0));
      }
    } else {
      flushSync7(() => setInnerOffset((value) => value - amount));
    }
  }, "onScroll");
  return /* @__PURE__ */ jsx45(YStack, {
    ref: composedRef,
    componentName,
    "aria-hidden": true,
    ...scrollIndicatorProps,
    zIndex: 1e3,
    position: strategy,
    left: x || 0,
    top: y || 0,
    width: `calc(${(floatingRef?.current?.offsetWidth ?? 0) - 2}px)`,
    onPointerEnter: /* @__PURE__ */ __name(() => {
      statusRef.current = "active";
      let prevNow = Date.now();
      function frame() {
        const element = floatingRef?.current;
        if (element) {
          const currentNow = Date.now();
          const msElapsed = currentNow - prevNow;
          prevNow = currentNow;
          const pixelsToScroll = msElapsed / 2;
          const remainingPixels = dir === "up" ? element.scrollTop : element.scrollHeight - element.clientHeight - element.scrollTop;
          const scrollRemaining = dir === "up" ? element.scrollTop - pixelsToScroll > 0 : element.scrollTop + pixelsToScroll < element.scrollHeight - element.clientHeight;
          onScroll(dir === "up" ? Math.min(pixelsToScroll, remainingPixels) : Math.max(-pixelsToScroll, -remainingPixels));
          if (scrollRemaining) {
            frameRef.current = requestAnimationFrame(frame);
          }
        }
      }
      __name(frame, "frame");
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(frame);
    }, "onPointerEnter"),
    onPointerLeave: /* @__PURE__ */ __name(() => {
      statusRef.current = "idle";
      cancelAnimationFrame(frameRef.current);
    }, "onPointerLeave")
  });
}));

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectTrigger.mjs
import * as React65 from "react";
import { jsx as jsx46 } from "react/jsx-runtime";
var TRIGGER_NAME2 = "SelectTrigger";
var isPointerCoarse = typeof window !== "undefined" && true ? window.matchMedia("(pointer:coarse)").matches : true;
var SelectTrigger = React65.forwardRef(/* @__PURE__ */ __name(function SelectTrigger2(props, forwardedRef) {
  const {
    scope,
    disabled = false,
    unstyled = false,
    ...triggerProps
  } = props;
  const context3 = useSelectContext(scope);
  const itemParentContext = useSelectItemParentContext(scope);
  const composedRefs = useComposedRefs(forwardedRef, context3.floatingContext?.refs.setReference);
  if (itemParentContext.shouldRenderWebNative) return null;
  return /* @__PURE__ */ jsx46(ListItem2, {
    componentName: TRIGGER_NAME2,
    unstyled,
    render: "button",
    type: "button",
    id: itemParentContext.id,
    ...!unstyled && {
      focusVisibleStyle: {
        outlineStyle: "solid",
        outlineWidth: 2,
        outlineColor: "$outlineColor"
      },
      borderWidth: 1,
      size: itemParentContext.size
    },
    role: "combobox",
    "aria-haspopup": "listbox",
    "aria-expanded": context3.open,
    "aria-autocomplete": "none",
    dir: context3.dir,
    disabled,
    "data-disabled": disabled ? "" : void 0,
    ...triggerProps,
    ref: composedRefs,
    ...itemParentContext.interactions ? {
      ...itemParentContext.interactions.getReferenceProps(),
      ...isPointerCoarse ? {
        onPress() {
          itemParentContext.setOpen(!context3.open);
        }
      } : {
        onMouseDown() {
          context3.floatingContext?.update?.();
          itemParentContext.setOpen(!context3.open);
        }
      }
    } : {
      onPress() {
        itemParentContext.setOpen(!context3.open);
      }
    }
  });
}, "SelectTrigger2"));

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/SelectViewport.mjs
import { styled as styled26 } from "@hanzogui/core";
import * as React66 from "react";
import { Fragment as Fragment15, jsx as jsx47, jsxs as jsxs8 } from "react/jsx-runtime";
var SelectViewportFrame = styled26(YStack, {
  name: VIEWPORT_NAME,
  variants: {
    unstyled: {
      false: {
        size: "$2",
        backgroundColor: "$background",
        elevate: true,
        bordered: true,
        userSelect: "none",
        outlineWidth: 0
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, {
        tokens
      }) => {
        return {
          borderRadius: tokens.radius[val] ?? val
        };
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var needsRepropagation3 = needsPortalRepropagation();
var SelectViewport = SelectViewportFrame.styleable(/* @__PURE__ */ __name(function SelectViewport2(props, forwardedRef) {
  const {
    scope,
    children,
    disableScroll,
    ...viewportProps
  } = props;
  const context3 = useSelectContext(scope);
  const itemContext = useSelectItemParentContext(scope);
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  const [lazyMounted, setLazyMounted] = React66.useState(context3.lazyMount ? false : true);
  React66.useEffect(() => {
    if (!context3.lazyMount) return;
    if (!context3.open) return;
    if (lazyMounted) return;
    startTransition(() => {
      setLazyMounted(true);
    });
  }, [context3.lazyMount, context3.open, lazyMounted]);
  const composedRefs = useComposedRefs(
    // @ts-ignore TODO react 19 type needs fix
    forwardedRef,
    context3.floatingContext?.refs.setFloating
  );
  useIsomorphicLayoutEffect(() => {
    if (context3.update) {
      context3.update();
    }
  }, [isAdapted]);
  useIsomorphicLayoutEffect(() => {
    if (context3.lazyMount && lazyMounted && context3.open && context3.update) {
      context3.update();
    }
  }, [lazyMounted]);
  if (itemContext.shouldRenderWebNative) {
    return /* @__PURE__ */ jsx47(YStack, {
      position: "relative",
      children
    });
  }
  if (isAdapted || !isWeb) {
    let content = children;
    if (needsRepropagation3) {
      content = /* @__PURE__ */ jsx47(ForwardSelectContext, {
        itemContext,
        context: context3,
        children: content
      });
    }
    return /* @__PURE__ */ jsx47(AdaptPortalContents, {
      scope: context3.adaptScope,
      children: content
    });
  }
  if (!itemContext.interactions) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`No interactions provided to Select, potentially missing Adapt`);
    }
    return null;
  }
  const {
    style,
    // remove this, it was set to "Select" always
    className,
    ...floatingProps
  } = itemContext.interactions.getFloatingProps();
  return /* @__PURE__ */ jsxs8(Fragment15, {
    children: [!disableScroll && !props.unstyled && /* @__PURE__ */ jsx47("style", {
      dangerouslySetInnerHTML: {
        __html: selectViewportCSS
      }
    }), /* @__PURE__ */ jsx47(AnimatePresence, {
      children: context3.open ? /* @__PURE__ */ jsx47(SelectViewportFrame, {
        size: itemContext.size,
        role: "presentation",
        ...viewportProps,
        ...style,
        ...floatingProps,
        ...!props.unstyled && {
          overflowY: disableScroll ? void 0 : style.overflow ?? "auto"
        },
        ref: composedRefs,
        children: lazyMounted ? children : null
      }, "select-viewport") : null
    }), !context3.open && !(context3.lazyMount && context3.renderValue) && lazyMounted && /* @__PURE__ */ jsx47("div", {
      style: {
        display: "none"
      },
      children
    })]
  });
}, "SelectViewport2"));
var selectViewportCSS = `
.is_SelectViewport {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.is_SelectViewport::-webkit-scrollbar{
  display:none
}
`;

// node_modules/.pnpm/@hanzogui+select@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_a6950169e8412b7c6b2c136d25788c66/node_modules/@hanzogui/select/dist/esm/Select.mjs
import { Fragment as Fragment16, jsx as jsx48 } from "react/jsx-runtime";
var SelectValueFrame = styled27(SizableText2, {
  name: "SelectValue",
  userSelect: "none"
});
var SelectValue = SelectValueFrame.styleable(/* @__PURE__ */ __name(function SelectValue2({
  scope,
  children: childrenProp,
  placeholder,
  ...props
}, forwardedRef) {
  const context3 = useSelectContext(scope);
  const itemParentContext = useSelectItemParentContext(scope);
  const composedRefs = useComposedRefs(
    // @ts-ignore TODO react 19 type needs fix
    forwardedRef,
    context3.onValueNodeChange
  );
  const isEmptyValue = context3.value == null || context3.value === "";
  const renderedValue = context3.renderValue?.(context3.value);
  const children = childrenProp ?? renderedValue ?? itemParentContext.selectedItem ?? context3.value;
  const selectValueChildren = isEmptyValue ? placeholder ?? children : children;
  return /* @__PURE__ */ jsx48(SelectValueFrame, {
    ...!props.unstyled && {
      size: itemParentContext.size,
      ellipsis: true,
      pointerEvents: "none"
    },
    ref: composedRefs,
    ...props,
    children: unwrapSelectItem(selectValueChildren)
  });
}, "SelectValue2"));
function unwrapSelectItem(selectValueChildren) {
  return React67.Children.map(selectValueChildren, (child) => {
    if (child) {
      if (child.type?.staticConfig?.componentName === ITEM_TEXT_NAME) return child.props.children;
      if (child.props?.children) return unwrapSelectItem(child.props.children);
    }
    return child;
  });
}
__name(unwrapSelectItem, "unwrapSelectItem");
var SelectIcon = styled27(XStack, {
  name: "SelectIcon",
  "aria-hidden": true,
  children: /* @__PURE__ */ jsx48(Paragraph, {
    children: "\u25BC"
  })
});
var SelectItemIndicatorFrame = styled27(XStack, {
  name: "SelectItemIndicator"
});
var SelectItemIndicator = React67.forwardRef(/* @__PURE__ */ __name(function SelectItemIndicator2(props, forwardedRef) {
  const {
    scope,
    ...itemIndicatorProps
  } = props;
  const context3 = useSelectItemParentContext(scope);
  const itemContext = useSelectItemContext(scope);
  if (context3.shouldRenderWebNative) return null;
  return itemContext.isSelected ? /* @__PURE__ */ jsx48(SelectItemIndicatorFrame, {
    "aria-hidden": true,
    ...itemIndicatorProps,
    ref: forwardedRef
  }) : null;
}, "SelectItemIndicator2"));
var SelectIndicatorFrame = styled27(YStack, {
  name: "SelectIndicator",
  variants: {
    unstyled: {
      false: {
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 10,
        backgroundColor: "$background",
        borderRadius: 0
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SelectIndicator = SelectIndicatorFrame.styleable(/* @__PURE__ */ __name(function SelectIndicator2({
  scope,
  ...props
}, forwardedRef) {
  const itemContext = useSelectItemParentContext(scope);
  const context3 = useSelectContext(scope);
  const [layout, setLayout] = React67.useState(null);
  const rafRef = React67.useRef(0);
  React67.useLayoutEffect(() => {
    const update2 = /* @__PURE__ */ __name((index2) => {
      if (typeof index2 !== "number") return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const node = itemContext.listRef?.current?.[index2];
        if (node) setLayout({
          width: Math.round(node.offsetWidth),
          height: Math.round(node.offsetHeight),
          x: Math.round(node.offsetLeft),
          y: Math.round(node.offsetTop)
        });
      });
    }, "update");
    if (context3.open && context3.activeIndexRef.current !== null) update2(context3.activeIndexRef.current);
    return itemContext.activeIndexSubscribe(update2);
  }, [context3.open, itemContext.listRef]);
  if (!layout) return null;
  return /* @__PURE__ */ jsx48(SelectIndicatorFrame, {
    ref: forwardedRef,
    ...props,
    width: layout.width,
    height: layout.height,
    x: layout.x,
    y: layout.y
  });
}, "SelectIndicator2"));
var GROUP_NAME4 = "SelectGroup";
var {
  Provider: SelectGroupContextProvider,
  useStyledContext: useSelectGroupContext
} = createStyledContext15({
  id: ""
}, "SelectGroup");
var SelectGroupFrame = styled27(YStack, {
  name: GROUP_NAME4,
  width: "100%"
});
var NativeSelectTextFrame = styled27(SizableText2, {
  render: "select",
  backgroundColor: "$background",
  borderColor: "$borderColor",
  hoverStyle: {
    backgroundColor: "$backgroundHover"
  }
});
var NativeSelectFrame = styled27(YStack, {
  name: "NativeSelect",
  variants: {
    size: {
      "...size": /* @__PURE__ */ __name((val, extras) => {
        const {
          tokens
        } = extras;
        const paddingHorizontal = getVariableValue7(tokens.space[val]);
        return {
          borderRadius: tokens.radius[val] ?? val,
          minHeight: tokens.size[val],
          paddingRight: paddingHorizontal + 20,
          paddingLeft: paddingHorizontal,
          paddingVertical: getSpace(val, {
            shift: -3
          })
        };
      }, "...size")
    },
    unstyled: {
      false: {
        borderWidth: 1,
        borderColor: "$borderColor",
        userSelect: "none",
        outlineWidth: 0,
        paddingRight: 10
      }
    }
  },
  defaultVariants: {
    size: "$2",
    unstyled: process.env.GUI_HEADLESS === "1" ? true : false
  }
});
var SelectGroup = React67.forwardRef((props, forwardedRef) => {
  const {
    scope,
    ...groupProps
  } = props;
  const groupId = React67.useId();
  const context3 = useSelectContext(scope);
  const itemParentContext = useSelectItemParentContext(scope);
  const size4 = itemParentContext.size ?? "$true";
  const nativeSelectRef = React67.useRef(null);
  const content = (() => {
    if (itemParentContext.shouldRenderWebNative) return /* @__PURE__ */ jsx48(NativeSelectFrame, {
      asChild: true,
      size: size4,
      value: context3.value,
      id: itemParentContext.id,
      children: /* @__PURE__ */ jsx48(NativeSelectTextFrame, {
        onChange: /* @__PURE__ */ __name((event) => {
          itemParentContext.onChange(event.currentTarget.value);
        }, "onChange"),
        size: size4,
        ref: nativeSelectRef,
        style: {
          color: "var(--color)",
          appearance: "none"
        },
        children: props.children
      })
    });
    return /* @__PURE__ */ jsx48(SelectGroupFrame, {
      role: "group",
      "aria-labelledby": groupId,
      ...groupProps,
      ref: forwardedRef
    });
  })();
  return /* @__PURE__ */ jsx48(SelectGroupContextProvider, {
    scope,
    id: groupId || "",
    children: content
  });
});
SelectGroup.displayName = GROUP_NAME4;
var SelectLabelFrame = styled27(SizableText2, {
  name: "SelectLabel",
  variants: {
    unstyled: {
      false: {
        size: "$true",
        ellipsis: true,
        maxWidth: "100%",
        cursor: "default"
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, {
        tokens
      }) => {
        return {
          paddingHorizontal: tokens.space[val],
          paddingVertical: getSpace(tokens.space[val], {
            shift: -4
          })
        };
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SelectLabel = SelectLabelFrame.styleable((props, forwardedRef) => {
  const {
    scope,
    ...labelProps
  } = props;
  const context3 = useSelectItemParentContext(scope);
  const groupContext = useSelectGroupContext(scope);
  if (context3.shouldRenderWebNative) return null;
  return /* @__PURE__ */ jsx48(SelectLabelFrame, {
    render: "div",
    id: groupContext.id,
    size: context3.size,
    ...labelProps,
    ref: forwardedRef
  });
});
var SelectSeparator = styled27(Separator, {
  name: "SelectSeparator"
});
var SelectSheetController = /* @__PURE__ */ __name((props) => {
  const context3 = useSelectContext(props.scope);
  const showSheet = useShowSelectSheet(context3);
  const isAdapted = useAdaptIsActive(context3.adaptScope);
  const getShowSheet = useGet3(showSheet);
  return /* @__PURE__ */ jsx48(SheetController, {
    onOpenChange: /* @__PURE__ */ __name((val) => {
      if (getShowSheet()) props.onOpenChange(val);
    }, "onOpenChange"),
    open: context3.open,
    hidden: !isAdapted,
    children: props.children
  });
}, "SelectSheetController");
var SelectSheetImpl = /* @__PURE__ */ __name((props) => {
  return /* @__PURE__ */ jsx48(Fragment16, {
    children: props.children
  });
}, "SelectSheetImpl");
var Select = withStaticProperties(/* @__PURE__ */ __name(function Select2(props) {
  const adaptScope = `AdaptSelect${props.scope || ""}`;
  return /* @__PURE__ */ jsx48(AdaptParent, {
    scope: adaptScope,
    portal: true,
    children: /* @__PURE__ */ jsx48(SelectInner, {
      scope: props.scope,
      adaptScope,
      ...props
    })
  });
}, "Select2"), {
  Adapt,
  Content: SelectContent,
  Group: SelectGroup,
  Icon: SelectIcon,
  Item: SelectItem,
  ItemIndicator: SelectItemIndicator,
  ItemText: SelectItemText,
  Label: SelectLabel,
  ScrollDownButton: SelectScrollDownButton,
  ScrollUpButton: SelectScrollUpButton,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Viewport: SelectViewport,
  Indicator: SelectIndicator,
  FocusScope: FocusScopeControllerComponent
});
function useEmitter() {
  const listenersRef = React67.useRef(/* @__PURE__ */ new Set());
  return [React67.useCallback((value) => {
    listenersRef.current.forEach((l) => l(value));
  }, []), React67.useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, [])];
}
__name(useEmitter, "useEmitter");
function SelectInner(props) {
  const {
    scope = "",
    adaptScope,
    native,
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    value: valueProp,
    defaultValue: defaultValue2,
    onValueChange,
    disablePreventBodyScroll,
    size: sizeProp = "$true",
    onActiveChange,
    dir,
    id,
    renderValue,
    lazyMount,
    zIndex
  } = props;
  const SelectImpl = useAdaptIsActive(adaptScope) || !isWeb ? SelectSheetImpl : SelectInlineImpl;
  const forceUpdate = React67.useReducer(() => ({}), {})[1];
  const [selectedItem, setSelectedItem] = React67.useState(null);
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen || false,
    onChange: onOpenChange
  });
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue2 || "",
    onChange: onValueChange,
    transition: true
  });
  React67.useEffect(() => {
    if (open) emitValue(value);
  }, [open]);
  React67.useEffect(() => {
    emitValue(value);
  }, [value]);
  const activeIndexRef = React67.useRef(null);
  const [activeIndex, setActiveIndexState] = React67.useState(null);
  const [emitValue, valueSubscribe] = useEmitter();
  const [emitActiveIndex, activeIndexSubscribe] = useEmitter();
  const selectedIndexRef = React67.useRef(null);
  const listContentRef = React67.useRef([]);
  const [selectedIndex, setSelectedIndex] = React67.useState(0);
  const [valueNode, setValueNode] = React67.useState(null);
  useIsomorphicLayoutEffect(() => {
    selectedIndexRef.current = selectedIndex;
  });
  const shouldRenderWebNative = isWeb && (native === true || native === "web" || Array.isArray(native) && native.includes("web"));
  const setActiveIndexFast = React67.useCallback((index2) => {
    if (activeIndexRef.current !== index2) {
      activeIndexRef.current = index2;
      if (typeof index2 === "number") emitActiveIndex(index2);
    }
  }, [emitActiveIndex]);
  const setActiveIndex = React67.useCallback((index2) => {
    setActiveIndexFast(index2);
    setActiveIndexState(index2);
  }, [setActiveIndexFast]);
  const content = /* @__PURE__ */ jsx48(SelectItemParentProvider, {
    scopeName: scope,
    scope,
    adaptScope,
    initialValue: React67.useMemo(() => value, [open]),
    size: sizeProp,
    activeIndexSubscribe,
    activeIndexRef,
    valueSubscribe,
    setOpen,
    id,
    onChange: React67.useCallback((val) => {
      setValue(val);
      emitValue(val);
    }, []),
    onActiveChange: useEvent7((value2, index2) => {
      onActiveChange?.(value2, index2);
    }),
    setSelectedIndex,
    setValueAtIndex: React67.useCallback((index2, value2) => {
      listContentRef.current[index2] = value2;
    }, []),
    shouldRenderWebNative,
    setActiveIndexFast,
    selectedItem,
    setSelectedItem,
    children: /* @__PURE__ */ jsx48(SelectProvider, {
      scope,
      scopeName: scope,
      adaptScope,
      disablePreventBodyScroll,
      dir,
      blockSelection: false,
      fallback: false,
      forceUpdate,
      valueNode,
      onValueNodeChange: setValueNode,
      activeIndex,
      activeIndexRef,
      selectedIndex,
      setActiveIndex,
      value,
      open,
      native,
      renderValue,
      lazyMount,
      children: /* @__PURE__ */ jsx48(SelectSheetController, {
        onOpenChange: setOpen,
        scope,
        children: shouldRenderWebNative ? children : /* @__PURE__ */ jsx48(SelectImpl, {
          activeIndexRef,
          listContentRef,
          selectedIndexRef,
          setActiveIndexFast,
          ...props,
          open,
          value,
          children
        })
      })
    })
  });
  if (zIndex !== void 0) return /* @__PURE__ */ jsx48(SelectZIndexContext.Provider, {
    value: zIndex,
    children: content
  });
  return content;
}
__name(SelectInner, "SelectInner");

// node_modules/.pnpm/@hanzogui+slider@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_7b8bb8f28ae1964b7efb8b238ae4ef76/node_modules/@hanzogui/slider/dist/esm/Slider.mjs
import { getTokens as getTokens4, getVariableValue as getVariableValue9, styled as styled29, useConfiguration, useCreateShallowSetState as useCreateShallowSetState2 } from "@hanzogui/core";
import * as React69 from "react";

// node_modules/.pnpm/@hanzogui+slider@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_7b8bb8f28ae1964b7efb8b238ae4ef76/node_modules/@hanzogui/slider/dist/esm/constants.mjs
import { createStyledContext as createStyledContext16 } from "@hanzogui/core";
var SLIDER_NAME = "Slider";
var SliderContext = createStyledContext16({
  size: "$true",
  min: 0,
  max: 100,
  orientation: "horizontal"
});
var {
  Provider: SliderProvider,
  useStyledContext: useSliderContext
} = SliderContext;
var {
  Provider: SliderOrientationProvider,
  useStyledContext: useSliderOrientationContext
} = createStyledContext16({
  startEdge: "left",
  endEdge: "right",
  sizeProp: "width",
  size: 0,
  direction: 1
});
var PAGE_KEYS = ["PageUp", "PageDown"];
var ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
var BACK_KEYS = {
  ltr: ["ArrowDown", "Home", "ArrowLeft", "PageDown"],
  rtl: ["ArrowDown", "Home", "ArrowRight", "PageDown"]
};

// node_modules/.pnpm/@hanzogui+slider@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_7b8bb8f28ae1964b7efb8b238ae4ef76/node_modules/@hanzogui/slider/dist/esm/helpers.mjs
function getNextSortedValues(prevValues = [], nextValue, atIndex) {
  const nextValues = [...prevValues];
  nextValues[atIndex] = nextValue;
  return nextValues.sort((a, b) => a - b);
}
__name(getNextSortedValues, "getNextSortedValues");
function convertValueToPercentage(value, min2, max2) {
  const maxSteps = max2 - min2;
  const percentPerStep = 100 / maxSteps;
  return percentPerStep * (value - min2);
}
__name(convertValueToPercentage, "convertValueToPercentage");
function getLabel(index2, totalValues) {
  if (totalValues > 2) {
    return `Value ${index2 + 1} of ${totalValues}`;
  }
  if (totalValues === 2) {
    return ["Minimum", "Maximum"][index2];
  }
  return void 0;
}
__name(getLabel, "getLabel");
function getClosestValueIndex(values, nextValue) {
  if (values.length === 1) return 0;
  const distances = values.map((value) => Math.abs(value - nextValue));
  const closestDistance = Math.min(...distances);
  return distances.indexOf(closestDistance);
}
__name(getClosestValueIndex, "getClosestValueIndex");
function getThumbInBoundsOffset(width, left2, direction) {
  const quarterWidth = width / 4;
  const halfPercent = 50;
  const offset4 = linearScale([0, halfPercent], [0, quarterWidth]);
  return (quarterWidth - offset4(left2)) * direction;
}
__name(getThumbInBoundsOffset, "getThumbInBoundsOffset");
function getStepsBetweenValues(values) {
  return values.slice(0, -1).map((value, index2) => values[index2 + 1] - value);
}
__name(getStepsBetweenValues, "getStepsBetweenValues");
function hasMinStepsBetweenValues(values, minStepsBetweenValues) {
  if (minStepsBetweenValues > 0) {
    const stepsBetweenValues = getStepsBetweenValues(values);
    const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues);
    return actualMinStepsBetweenValues >= minStepsBetweenValues;
  }
  return true;
}
__name(hasMinStepsBetweenValues, "hasMinStepsBetweenValues");
function linearScale(input, output) {
  return (value) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}
__name(linearScale, "linearScale");
function getDecimalCount(value) {
  return (String(value).split(".")[1] || "").length;
}
__name(getDecimalCount, "getDecimalCount");
function roundValue(value, decimalCount) {
  const rounder = 10 ** decimalCount;
  return Math.round(value * rounder) / rounder;
}
__name(roundValue, "roundValue");

// node_modules/.pnpm/@hanzogui+slider@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_7b8bb8f28ae1964b7efb8b238ae4ef76/node_modules/@hanzogui/slider/dist/esm/SliderImpl.mjs
import { getVariableValue as getVariableValue8, styled as styled28 } from "@hanzogui/core";
import * as React68 from "react";
import { jsx as jsx49 } from "react/jsx-runtime";
var SliderFrame = styled28(YStack, {
  position: "relative",
  variants: {
    orientation: {
      horizontal: {},
      vertical: {}
    },
    size: /* @__PURE__ */ __name((val, extras) => {
      if (!val) {
        return;
      }
      const orientation = extras.props["orientation"];
      const size4 = Math.round(getVariableValue8(getSize(val)) / 6);
      if (orientation === "horizontal") {
        return {
          height: size4,
          borderRadius: size4,
          justifyContent: "center"
        };
      }
      return {
        width: size4,
        borderRadius: size4,
        alignItems: "center"
      };
    }, "size")
  }
});
var SliderImpl = React68.forwardRef((props, forwardedRef) => {
  const {
    __scopeSlider,
    onSlideStart,
    onSlideMove,
    onSlideEnd,
    onHomeKeyDown,
    onEndKeyDown,
    onStepKeyDown,
    children,
    ...sliderProps
  } = props;
  const context3 = useSliderContext(__scopeSlider);
  const handleResponderGrant = React68.useCallback((event) => {
    props.onResponderGrant?.(event);
    const target = event.target;
    const thumbIndex = context3.thumbs.get(target);
    const isStartingOnThumb = thumbIndex !== void 0;
    if (isWeb && target instanceof HTMLElement) {
      if (context3.thumbs.has(target)) {
        target.focus();
      }
    }
    if (!isWeb && isStartingOnThumb) {
      context3.valueIndexToChangeRef.current = thumbIndex;
    }
    onSlideStart(event, isStartingOnThumb ? "thumb" : "track");
  }, [context3, onSlideStart, props.onResponderGrant]);
  const handleResponderMove = React68.useCallback((event) => {
    props.onResponderMove?.(event);
    event.stopPropagation();
    onSlideMove(event);
  }, [onSlideMove, props.onResponderMove]);
  const handleResponderRelease = React68.useCallback((event) => {
    props.onResponderRelease?.(event);
    onSlideEnd(event);
  }, [onSlideEnd, props.onResponderRelease]);
  return (
    // wrap with plain RN View for responder events - gui views no longer handle responder events on web
    /* @__PURE__ */ jsx49(SliderFrame, {
      size: "$4",
      ref: forwardedRef,
      ...sliderProps,
      "data-orientation": sliderProps.orientation,
      ...isWeb && {
        onKeyDown: /* @__PURE__ */ __name((event) => {
          if (event.key === "Home") {
            onHomeKeyDown(event);
            event.preventDefault();
          } else if (event.key === "End") {
            onEndKeyDown(event);
            event.preventDefault();
          } else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
            onStepKeyDown(event);
            event.preventDefault();
          }
        }, "onKeyDown")
      },
      children: /* @__PURE__ */ jsx49(View_default, {
        onMoveShouldSetResponderCapture: /* @__PURE__ */ __name(() => true, "onMoveShouldSetResponderCapture"),
        onMoveShouldSetResponder: /* @__PURE__ */ __name(() => true, "onMoveShouldSetResponder"),
        onStartShouldSetResponder: /* @__PURE__ */ __name(() => true, "onStartShouldSetResponder"),
        onResponderTerminationRequest: /* @__PURE__ */ __name(() => false, "onResponderTerminationRequest"),
        onResponderGrant: handleResponderGrant,
        onResponderMove: handleResponderMove,
        onResponderRelease: handleResponderRelease,
        style: {
          inset: 0,
          position: "absolute"
        },
        children
      })
    })
  );
});

// node_modules/.pnpm/@hanzogui+slider@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_7b8bb8f28ae1964b7efb8b238ae4ef76/node_modules/@hanzogui/slider/dist/esm/Slider.mjs
import { jsx as jsx50 } from "react/jsx-runtime";
var activeSliderMeasureListeners = /* @__PURE__ */ new Set();
if (!process.env.GUI_DISABLE_SLIDER_INTERVAL) setInterval?.(
  () => {
    activeSliderMeasureListeners.forEach((cb) => cb());
  },
  // really doesn't need to be super often
  1e3
);
var SliderHorizontal = React69.forwardRef((props, forwardedRef) => {
  const {
    min: min2,
    max: max2,
    dir,
    onSlideStart,
    onSlideMove,
    onStepKeyDown,
    onSlideEnd,
    ...sliderProps
  } = props;
  const direction = useDirection(dir);
  const isDirectionLTR = direction === "ltr";
  const sliderRef = React69.useRef(null);
  const [state4, setState_] = React69.useState(() => ({
    size: 0,
    offset: 0
  }));
  const setState = useCreateShallowSetState2(setState_);
  function getValueFromPointer(pointerPosition) {
    return linearScale([0, state4.size], isDirectionLTR ? [min2, max2] : [max2, min2])(pointerPosition);
  }
  __name(getValueFromPointer, "getValueFromPointer");
  const measure = /* @__PURE__ */ __name(() => {
    sliderRef.current?.measure((_x, _y, width, _height, pageX, _pageY) => {
      setState({
        size: width,
        offset: pageX
      });
    });
  }, "measure");
  useSliderMeasure(sliderRef, measure);
  return /* @__PURE__ */ jsx50(SliderOrientationProvider, {
    scope: props.__scopeSlider,
    startEdge: isDirectionLTR ? "left" : "right",
    endEdge: isDirectionLTR ? "right" : "left",
    direction: isDirectionLTR ? 1 : -1,
    sizeProp: "width",
    size: state4.size,
    children: /* @__PURE__ */ jsx50(SliderImpl, {
      ref: composeRefs(forwardedRef, sliderRef),
      dir: direction,
      ...sliderProps,
      orientation: "horizontal",
      onLayout: measure,
      onSlideStart: /* @__PURE__ */ __name((event, target) => {
        const value = getValueFromPointer(event.nativeEvent.locationX);
        if (value) onSlideStart?.(value, target, event);
      }, "onSlideStart"),
      onSlideMove: /* @__PURE__ */ __name((event) => {
        const value = getValueFromPointer(event.nativeEvent.pageX - state4.offset);
        if (value) onSlideMove?.(value, event);
      }, "onSlideMove"),
      onSlideEnd: /* @__PURE__ */ __name((event) => {
        const value = getValueFromPointer(event.nativeEvent.pageX - state4.offset);
        if (value) onSlideEnd?.(event, value);
      }, "onSlideEnd"),
      onStepKeyDown: /* @__PURE__ */ __name((event) => {
        const isBackKey = BACK_KEYS[direction].includes(event.key);
        onStepKeyDown?.({
          event,
          direction: isBackKey ? -1 : 1
        });
      }, "onStepKeyDown")
    })
  });
});
function useOnDebouncedWindowResize(callback, amt = 200) {
  React69.useEffect(() => {
    let last;
    const onResize = /* @__PURE__ */ __name(() => {
      clearTimeout(last);
      last = setTimeout(callback, amt);
    }, "onResize");
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(last);
      window.removeEventListener("resize", onResize);
    };
  }, []);
}
__name(useOnDebouncedWindowResize, "useOnDebouncedWindowResize");
function useSliderMeasure(sliderRef, measure) {
  useOnDebouncedWindowResize(measure);
  React69.useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;
    let measureTm;
    const debouncedMeasure = /* @__PURE__ */ __name(() => {
      clearTimeout(measureTm);
      measureTm = setTimeout(() => {
        measure();
      }, 200);
    }, "debouncedMeasure");
    const io = new IntersectionObserver((entries) => {
      debouncedMeasure();
      if (entries?.[0].isIntersecting) activeSliderMeasureListeners.add(debouncedMeasure);
      else activeSliderMeasureListeners.delete(debouncedMeasure);
    }, {
      root: null,
      rootMargin: "0px",
      threshold: [0, 0.5, 1]
    });
    io.observe(node);
    return () => {
      activeSliderMeasureListeners.delete(debouncedMeasure);
      io.disconnect();
    };
  }, []);
}
__name(useSliderMeasure, "useSliderMeasure");
var SliderVertical = React69.forwardRef((props, forwardedRef) => {
  const {
    min: min2,
    max: max2,
    onSlideStart,
    onSlideMove,
    onStepKeyDown,
    onSlideEnd,
    ...sliderProps
  } = props;
  const [state4, setState_] = React69.useState(() => ({
    size: 0,
    offset: 0
  }));
  const setState = useCreateShallowSetState2(setState_);
  const sliderRef = React69.useRef(null);
  const configuration = useConfiguration();
  const insets = isIos && configuration.insets ? configuration.insets : {
    top: 0,
    bottom: 0
  };
  function getValueFromPointer(pointerPosition) {
    return linearScale([0, state4.size], [max2, min2])(pointerPosition);
  }
  __name(getValueFromPointer, "getValueFromPointer");
  const measure = /* @__PURE__ */ __name(() => {
    sliderRef.current?.measure((_x, _y, _width, height, _pageX, pageY) => {
      setState({
        size: height,
        offset: pageY + (isIos ? insets.top : 0)
      });
    });
  }, "measure");
  useSliderMeasure(sliderRef, measure);
  return /* @__PURE__ */ jsx50(SliderOrientationProvider, {
    scope: props.__scopeSlider,
    startEdge: "bottom",
    endEdge: "top",
    sizeProp: "height",
    size: state4.size,
    direction: 1,
    children: /* @__PURE__ */ jsx50(SliderImpl, {
      ref: composeRefs(forwardedRef, sliderRef),
      ...sliderProps,
      orientation: "vertical",
      onLayout: measure,
      onSlideStart: /* @__PURE__ */ __name((event, target) => {
        const value = getValueFromPointer(event.nativeEvent.locationY);
        if (value) onSlideStart?.(value, target, event);
      }, "onSlideStart"),
      onSlideMove: /* @__PURE__ */ __name((event) => {
        const value = getValueFromPointer(event.nativeEvent.pageY - state4.offset);
        if (value) onSlideMove?.(value, event);
      }, "onSlideMove"),
      onSlideEnd: /* @__PURE__ */ __name((event) => {
        const value = getValueFromPointer(event.nativeEvent.pageY - state4.offset);
        onSlideEnd?.(event, value);
      }, "onSlideEnd"),
      onStepKeyDown: /* @__PURE__ */ __name((event) => {
        const isBackKey = BACK_KEYS.ltr.includes(event.key);
        onStepKeyDown?.({
          event,
          direction: isBackKey ? -1 : 1
        });
      }, "onStepKeyDown")
    })
  });
});
var SliderTrackFrame = styled29(SliderFrame, {
  name: "Slider",
  variants: {
    unstyled: {
      false: {
        height: "100%",
        width: "100%",
        backgroundColor: "$background",
        position: "relative",
        borderRadius: 1e5,
        overflow: "hidden"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SliderTrack = React69.forwardRef(/* @__PURE__ */ __name(function SliderTrack2(props, forwardedRef) {
  const {
    __scopeSlider,
    ...trackProps
  } = props;
  const context3 = useSliderContext(__scopeSlider);
  return /* @__PURE__ */ jsx50(SliderTrackFrame, {
    "data-disabled": context3.disabled ? "" : void 0,
    "data-orientation": context3.orientation,
    orientation: context3.orientation,
    size: context3.size,
    ...trackProps,
    ref: forwardedRef
  });
}, "SliderTrack2"));
var SliderActiveFrame = styled29(SliderFrame, {
  name: "SliderActive",
  position: "absolute",
  pointerEvents: "box-none",
  variants: {
    unstyled: {
      false: {
        backgroundColor: "$background",
        borderRadius: 1e5
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SliderActive = React69.forwardRef(/* @__PURE__ */ __name(function SliderActive2(props, forwardedRef) {
  const {
    __scopeSlider,
    ...rangeProps
  } = props;
  const context3 = useSliderContext(__scopeSlider);
  const orientation = useSliderOrientationContext(__scopeSlider);
  const composedRefs = useComposedRefs(forwardedRef, React69.useRef(null));
  const valuesCount = context3.values.length;
  const percentages = context3.values.map((value) => convertValueToPercentage(value, context3.min, context3.max));
  const offsetStart = valuesCount > 1 ? Math.min(...percentages) : 0;
  const offsetEnd = 100 - Math.max(...percentages);
  return /* @__PURE__ */ jsx50(SliderActiveFrame, {
    orientation: context3.orientation,
    "data-orientation": context3.orientation,
    "data-disabled": context3.disabled ? "" : void 0,
    size: context3.size,
    animateOnly: ["left", "top", "right", "bottom"],
    ...rangeProps,
    ref: composedRefs,
    [orientation.startEdge]: `${offsetStart}%`,
    [orientation.endEdge]: `${offsetEnd}%`,
    ...orientation.sizeProp === "width" ? {
      height: "100%"
    } : {
      left: 0,
      right: 0
    }
  });
}, "SliderActive2"));
var getThumbSize = /* @__PURE__ */ __name((val) => {
  const tokens = getTokens4();
  const size4 = typeof val === "number" ? val : getSize(tokens.size[val], {
    shift: -1
  });
  return {
    width: size4,
    height: size4,
    minWidth: size4,
    minHeight: size4
  };
}, "getThumbSize");
var SliderThumbFrame = styled29(ThemeableStack, {
  name: "SliderThumb",
  variants: {
    size: {
      "...size": getThumbSize,
      ":number": getThumbSize
    },
    unstyled: {
      false: {
        position: "absolute",
        borderWidth: 2,
        borderColor: "$borderColor",
        backgroundColor: "$background",
        pressStyle: {
          backgroundColor: "$backgroundPress",
          borderColor: "$borderColorPress"
        },
        hoverStyle: {
          backgroundColor: "$backgroundHover",
          borderColor: "$borderColorHover"
        },
        focusVisibleStyle: {
          outlineStyle: "solid",
          outlineWidth: 2,
          outlineColor: "$outlineColor"
        }
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var SliderThumb = SliderThumbFrame.styleable(/* @__PURE__ */ __name(function SliderThumb2(props, forwardedRef) {
  const {
    __scopeSlider,
    index: index2 = 0,
    circular: circular2,
    size: sizeProp,
    ...thumbProps
  } = props;
  const context3 = useSliderContext(__scopeSlider);
  const orientation = useSliderOrientationContext(__scopeSlider);
  const [thumb, setThumb] = React69.useState(null);
  const composedRefs = useComposedRefs(forwardedRef, setThumb);
  const value = context3.values[index2];
  const percent = value === void 0 ? 0 : convertValueToPercentage(value, context3.min, context3.max);
  const label = getLabel(index2, context3.values.length);
  const sizeIn = sizeProp ?? context3.size ?? "$true";
  const [size4, setSize] = React69.useState(() => {
    return getVariableValue9(getThumbSize(sizeIn).width);
  });
  const thumbInBoundsOffset = size4 ? getThumbInBoundsOffset(size4, percent, orientation.direction) : 0;
  React69.useEffect(() => {
    if (thumb) {
      context3.thumbs.set(thumb, index2);
      return () => {
        context3.thumbs.delete(thumb);
      };
    }
  }, [thumb, context3.thumbs, index2]);
  const positionalStyles = context3.orientation === "horizontal" ? {
    x: (thumbInBoundsOffset - size4 / 2) * orientation.direction,
    y: -size4 / 2,
    top: "50%",
    ...size4 === 0 && {
      top: "auto",
      bottom: "auto"
    }
  } : {
    x: -size4 / 2,
    y: size4 / 2,
    left: "50%",
    ...size4 === 0 && {
      left: "auto",
      right: "auto"
    }
  };
  return /* @__PURE__ */ jsx50(SliderThumbFrame, {
    ref: composedRefs,
    role: "slider",
    "aria-label": props["aria-label"] || label,
    "aria-valuemin": context3.min,
    "aria-valuenow": value,
    "aria-valuemax": context3.max,
    "aria-orientation": context3.orientation,
    "data-orientation": context3.orientation,
    "data-disabled": context3.disabled ? "" : void 0,
    tabIndex: context3.disabled ? void 0 : 0,
    animateOnly: ["transform", "left", "top", "right", "bottom"],
    ...positionalStyles,
    [orientation.startEdge]: `${percent}%`,
    size: sizeIn,
    circular: circular2,
    ...thumbProps,
    onLayout: /* @__PURE__ */ __name((e) => {
      setSize(e.nativeEvent.layout[orientation.sizeProp]);
    }, "onLayout"),
    onFocus: composeEventHandlers(props.onFocus, () => {
      context3.valueIndexToChangeRef.current = index2;
    })
  });
}, "SliderThumb2"), {
  staticConfig: {
    memo: true
  }
});
var Slider = withStaticProperties(React69.forwardRef((props, forwardedRef) => {
  const {
    name,
    min: min2 = 0,
    max: max2 = 100,
    step: step2 = 1,
    orientation = "horizontal",
    disabled = false,
    minStepsBetweenThumbs = 0,
    defaultValue: defaultValue2 = [min2],
    value,
    onValueChange = /* @__PURE__ */ __name(() => {
    }, "onValueChange"),
    size: sizeProp,
    onSlideEnd,
    onSlideMove,
    onSlideStart,
    ...sliderProps
  } = props;
  const sliderRef = React69.useRef(null);
  const composedRefs = useComposedRefs(sliderRef, forwardedRef);
  const thumbRefs = React69.useRef(/* @__PURE__ */ new Map());
  const valueIndexToChangeRef = React69.useRef(0);
  const isHorizontal = orientation === "horizontal";
  const [values = [], setValues] = useControllableState({
    prop: value,
    defaultProp: defaultValue2,
    transition: true,
    onChange: /* @__PURE__ */ __name((value2) => {
      updateThumbFocus(valueIndexToChangeRef.current);
      onValueChange(value2);
    }, "onChange")
  });
  if (isWeb) React69.useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;
    const preventDefault = /* @__PURE__ */ __name((e) => {
      e.preventDefault();
    }, "preventDefault");
    node.addEventListener("touchstart", preventDefault);
    return () => {
      node.removeEventListener("touchstart", preventDefault);
    };
  }, []);
  function updateThumbFocus(focusIndex) {
    if (!isWeb) return;
    for (const [node, index2] of thumbRefs.current.entries()) if (index2 === focusIndex) {
      node.focus();
      return;
    }
  }
  __name(updateThumbFocus, "updateThumbFocus");
  function handleSlideMove(value2, event) {
    updateValues(value2, valueIndexToChangeRef.current);
    onSlideMove?.(event, value2);
  }
  __name(handleSlideMove, "handleSlideMove");
  function updateValues(value2, atIndex) {
    const decimalCount = getDecimalCount(step2);
    const nextValue = clamp(roundValue(Math.round((value2 - min2) / step2) * step2 + min2, decimalCount), [min2, max2]);
    setValues((prevValues = []) => {
      const nextValues = getNextSortedValues(prevValues, nextValue, atIndex);
      if (hasMinStepsBetweenValues(nextValues, minStepsBetweenThumbs * step2)) {
        valueIndexToChangeRef.current = nextValues.indexOf(nextValue);
        return String(nextValues) === String(prevValues) ? prevValues : nextValues;
      }
      return prevValues;
    });
  }
  __name(updateValues, "updateValues");
  const SliderOriented = isHorizontal ? SliderHorizontal : SliderVertical;
  return /* @__PURE__ */ jsx50(SliderProvider, {
    scope: props.__scopeSlider,
    disabled,
    min: min2,
    max: max2,
    valueIndexToChangeRef,
    thumbs: thumbRefs.current,
    values,
    orientation,
    size: sizeProp,
    children: /* @__PURE__ */ jsx50(SliderOriented, {
      "aria-disabled": disabled,
      "data-disabled": disabled ? "" : void 0,
      ...sliderProps,
      ref: composedRefs,
      min: min2,
      max: max2,
      onSlideEnd,
      onSlideStart: disabled ? void 0 : (value2, target, event) => {
        if (target !== "thumb") updateValues(value2, getClosestValueIndex(values, value2));
        onSlideStart?.(event, value2, target);
      },
      onSlideMove: disabled ? void 0 : handleSlideMove,
      onHomeKeyDown: /* @__PURE__ */ __name(() => !disabled && updateValues(min2, 0), "onHomeKeyDown"),
      onEndKeyDown: /* @__PURE__ */ __name(() => !disabled && updateValues(max2, values.length - 1), "onEndKeyDown"),
      onStepKeyDown: /* @__PURE__ */ __name(({
        event,
        direction: stepDirection
      }) => {
        if (!disabled) {
          const multiplier = PAGE_KEYS.includes(event.key) || event.shiftKey && ARROW_KEYS.includes(event.key) ? 10 : 1;
          const atIndex = valueIndexToChangeRef.current;
          const value2 = values[atIndex];
          updateValues(value2 + step2 * multiplier * stepDirection, atIndex);
        }
      }, "onStepKeyDown")
    })
  });
}), {
  Track: SliderTrack,
  TrackActive: SliderActive,
  Thumb: SliderThumb
});
Slider.displayName = SLIDER_NAME;

// node_modules/.pnpm/@hanzogui+switch@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_0f71451dc7732458f5e799521f91ec69/node_modules/@hanzogui/switch/dist/esm/createSwitch.mjs
import { composeEventHandlers as composeEventHandlers5, getVariableValue as getVariableValue11, isWeb as isWeb10, View as View15, withStaticProperties as withStaticProperties8 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzogui+switch-headless@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native_d80065a302a8e5b827d574d608464ea8/node_modules/@hanzogui/switch-headless/dist/esm/useSwitch.mjs
import * as React70 from "react";
import { jsx as jsx51 } from "react/jsx-runtime";
function getState5(checked) {
  return checked ? "checked" : "unchecked";
}
__name(getState5, "getState");
var BubbleInput2 = /* @__PURE__ */ __name((props) => {
  const {
    control,
    checked,
    bubbles = true,
    ...inputProps
  } = props;
  const ref = React70.useRef(null);
  const prevChecked = usePrevious(checked);
  React70.useEffect(() => {
    const input = ref.current;
    const inputProto = window.HTMLInputElement.prototype;
    const setChecked = Object.getOwnPropertyDescriptor(inputProto, "checked").set;
    if (prevChecked !== checked && setChecked) {
      const event = new Event("click", {
        bubbles
      });
      setChecked.call(input, checked);
      input.dispatchEvent(event);
    }
  }, [prevChecked, checked, bubbles]);
  return /* @__PURE__ */ jsx51("input", {
    type: "checkbox",
    "aria-hidden": true,
    defaultChecked: checked,
    ...inputProps,
    tabIndex: -1,
    ref,
    style: {
      ...props.style,
      position: "absolute",
      pointerEvents: "none",
      opacity: 0,
      margin: 0
    }
  });
}, "BubbleInput");
function useSwitch(props, [checked, setChecked], ref) {
  {
    const {
      disabled,
      name,
      value,
      required
    } = props;
    const hasConsumerStoppedPropagationRef = React70.useRef(false);
    const [button, setButton] = React70.useState(null);
    const composedRefs = useComposedRefs(ref, setButton);
    const isFormControl = isWeb ? button ? Boolean(button.closest("form")) : true : false;
    const labelId = useLabelContext(button);
    const ariaLabelledBy = props["aria-labelledby"] || props.labeledBy || labelId;
    return {
      switchProps: {
        role: "switch",
        "aria-checked": checked,
        ...isWeb ? {
          tabIndex: disabled ? void 0 : 0,
          "data-state": getState5(checked),
          "data-disabled": disabled ? "" : void 0,
          disabled
        } : {},
        "aria-labelledby": ariaLabelledBy,
        onPress: composeEventHandlers(props.onPress, (event) => {
          setChecked((prevChecked) => !prevChecked);
          if (isWeb && isFormControl) {
            hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
            if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
          }
        })
      },
      switchRef: composedRefs,
      bubbleInput: isWeb && isFormControl ? /* @__PURE__ */ jsx51(BubbleInput2, {
        control: button,
        bubbles: !hasConsumerStoppedPropagationRef.current,
        name,
        value,
        checked,
        required,
        disabled,
        style: {
          transform: "translateX(-100%)"
        }
      }) : null
    };
  }
}
__name(useSwitch, "useSwitch");

// node_modules/.pnpm/@hanzogui+switch@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_0f71451dc7732458f5e799521f91ec69/node_modules/@hanzogui/switch/dist/esm/createSwitch.mjs
import * as React71 from "react";

// node_modules/.pnpm/@hanzogui+switch@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_0f71451dc7732458f5e799521f91ec69/node_modules/@hanzogui/switch/dist/esm/StyledContext.mjs
import { createStyledContext as createStyledContext17 } from "@hanzogui/core";
var SwitchStyledContext = createStyledContext17({
  active: false,
  disabled: false,
  frameWidth: void 0,
  size: void 0,
  unstyled: process.env.GUI_HEADLESS === "1"
});

// node_modules/.pnpm/@hanzogui+switch@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_0f71451dc7732458f5e799521f91ec69/node_modules/@hanzogui/switch/dist/esm/Switch.mjs
import { getVariableValue as getVariableValue10, styled as styled30 } from "@hanzogui/core";
var SwitchThumb = styled30(YStack, {
  name: "SwitchThumb",
  variants: {
    unstyled: {
      false: {
        size: "$true",
        backgroundColor: "$background",
        borderRadius: 1e3
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val) => {
        const size4 = getSwitchHeight(val);
        return {
          height: size4,
          width: size4
        };
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
}, {
  accept: {
    activeStyle: "style"
  }
});
var getSwitchHeight = /* @__PURE__ */ __name((val) => Math.round(getVariableValue10(getSize(val)) * 0.65), "getSwitchHeight");
var getSwitchWidth = /* @__PURE__ */ __name((val) => getSwitchHeight(val) * 2, "getSwitchWidth");
var SwitchFrame = styled30(YStack, {
  name: "Switch",
  render: "button",
  tabIndex: 0,
  variants: {
    unstyled: {
      false: {
        borderRadius: 1e3,
        backgroundColor: "$background",
        focusVisibleStyle: {
          outlineColor: "$outlineColor",
          outlineStyle: "solid",
          outlineWidth: 2
        }
      }
    },
    size: {
      "...size": /* @__PURE__ */ __name((val, {
        props
      }) => {
        if (props["unstyled"]) return;
        const height = getSwitchHeight(val);
        const width = getSwitchWidth(val);
        return {
          height,
          minHeight: height,
          width
        };
      }, "...size")
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
}, {
  accept: {
    activeStyle: "style"
  }
});

// node_modules/.pnpm/@hanzogui+switch@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_0f71451dc7732458f5e799521f91ec69/node_modules/@hanzogui/switch/dist/esm/useSwitchNative.mjs
function useSwitchNative(_props) {
  return null;
}
__name(useSwitchNative, "useSwitchNative");

// node_modules/.pnpm/@hanzogui+switch@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_0f71451dc7732458f5e799521f91ec69/node_modules/@hanzogui/switch/dist/esm/createSwitch.mjs
import { Fragment as Fragment17, jsx as jsx52, jsxs as jsxs9 } from "react/jsx-runtime";
function createSwitch(createProps) {
  const {
    Frame: Frame3 = SwitchFrame,
    Thumb = SwitchThumb
  } = createProps;
  if (process.env.NODE_ENV === "development") {
    if (Frame3 !== SwitchFrame && Frame3.staticConfig.context && Frame3.staticConfig.context !== SwitchStyledContext || Thumb !== SwitchThumb && Thumb.staticConfig.context && Thumb.staticConfig.context !== SwitchStyledContext) {
      console.warn(`Warning: createSwitch() needs to control context to pass checked state from Frame to Thumb, any custom context passed will be overridden.`);
    }
  }
  Frame3.staticConfig.context = SwitchStyledContext;
  Thumb.staticConfig.context = SwitchStyledContext;
  const SwitchThumbComponent = Thumb.styleable(/* @__PURE__ */ __name(function SwitchThumb2(props, forwardedRef) {
    const {
      size: sizeProp,
      unstyled: unstyledProp,
      activeStyle,
      ...thumbProps
    } = props;
    const styledContext = SwitchStyledContext.useStyledContext();
    const {
      unstyled: unstyledContext,
      size: sizeContext,
      active,
      disabled,
      frameWidth = 0
    } = styledContext;
    const unstyled = process.env.GUI_HEADLESS === "1" ? true : unstyledProp ?? unstyledContext ?? false;
    const size4 = sizeProp ?? sizeContext ?? "$true";
    const initialChecked = React71.useRef(active).current;
    const initialWidth = getVariableValue11(props.width || size4, "size");
    const [thumbWidth, setThumbWidth] = React71.useState(typeof initialWidth === "number" ? initialWidth : 0);
    const distance = frameWidth - thumbWidth;
    const x = initialChecked ? active ? 0 : -distance : active ? distance : 0;
    return /* @__PURE__ */ jsx52(Thumb, {
      ref: forwardedRef,
      unstyled,
      ...unstyled === false && {
        size: size4
      },
      alignSelf: initialChecked ? "flex-end" : "flex-start",
      x,
      onLayout: composeEventHandlers5(props.onLayout, (e) => {
        const next = e.nativeEvent.layout.width;
        setThumbWidth(next);
      }),
      disabled,
      ...thumbProps,
      ...active && activeStyle
    });
  }, "SwitchThumb2"));
  const SwitchComponent = Frame3.styleable(/* @__PURE__ */ __name(function SwitchFrame2(_props, forwardedRef) {
    const {
      native,
      nativeProps,
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      activeStyle,
      unstyled: unstyledProp,
      activeTheme: activeThemeProp,
      ...props
    } = _props;
    const [checked, setChecked] = useControllableState({
      prop: checkedProp,
      defaultProp: defaultChecked || false,
      onChange: onCheckedChange,
      transition: true
    });
    const styledContext = React71.useContext(SwitchStyledContext.context);
    const [frameWidth, setFrameInnerWidth] = React71.useState(0);
    const {
      switchProps,
      bubbleInput,
      switchRef
    } = useSwitch(
      props,
      [checked, setChecked],
      // @ts-ignore TODO gui react 19 type error
      forwardedRef
    );
    const nativeSwitch = useSwitchNative({
      id: props.id,
      disabled: props.disabled,
      native,
      nativeProps,
      checked,
      setChecked
    });
    if (nativeSwitch) {
      return nativeSwitch;
    }
    const disabled = props.disabled;
    const handleLayout = /* @__PURE__ */ __name((e) => {
      const next = e.nativeEvent.layout.width;
      if (next !== frameWidth) {
        setFrameInnerWidth(next);
      }
    }, "handleLayout");
    const unstyled = styledContext.unstyled ?? unstyledProp ?? false;
    return /* @__PURE__ */ jsxs9(Fragment17, {
      children: [/* @__PURE__ */ jsx52(SwitchStyledContext.Provider, {
        size: styledContext.size ?? props.size ?? "$true",
        unstyled,
        active: checked,
        disabled,
        frameWidth,
        children: /* @__PURE__ */ jsx52(Frame3, {
          ref: switchRef,
          render: "button",
          theme: activeThemeProp ?? null,
          ...isWeb10 && {
            type: "button"
          },
          ...!unstyled && {
            size: styledContext.size ?? props.size ?? "$true"
          },
          unstyled,
          ...props,
          ...switchProps,
          disabled,
          ...checked && {
            ...!unstyled && !activeStyle && {
              backgroundColor: "$backgroundActive"
            },
            ...activeStyle
          },
          children: /* @__PURE__ */ jsx52(View15, {
            alignSelf: "stretch",
            flex: 1,
            onLayout: handleLayout,
            children: props.children
          })
        })
      }), bubbleInput]
    });
  }, "SwitchFrame"), {
    disableTheme: true
  });
  return withStaticProperties8(SwitchComponent, {
    Thumb: SwitchThumbComponent
  });
}
__name(createSwitch, "createSwitch");

// node_modules/.pnpm/@hanzogui+switch@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@_0f71451dc7732458f5e799521f91ec69/node_modules/@hanzogui/switch/dist/esm/index.mjs
var Switch = createSwitch({
  Frame: SwitchFrame,
  Thumb: SwitchThumb
});

// node_modules/.pnpm/@hanzogui+sizable-context@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native_1f07d3b7c9211f1f7668763fa612936b/node_modules/@hanzogui/sizable-context/dist/esm/index.mjs
import { createStyledContext as createStyledContext18 } from "@hanzogui/core";
var SizableContext = createStyledContext18({
  size: void 0
});

// node_modules/.pnpm/@hanzogui+tabs@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_a0ecc6e3c6710aa6ca556be8a37ef8be/node_modules/@hanzogui/tabs/dist/esm/createTabs.mjs
import { useEvent as useEvent8 } from "@hanzogui/web";
import * as React72 from "react";

// node_modules/.pnpm/@hanzogui+tabs@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_a0ecc6e3c6710aa6ca556be8a37ef8be/node_modules/@hanzogui/tabs/dist/esm/StyledContext.mjs
import { createStyledContext as createStyledContext19 } from "@hanzogui/core";
var {
  Provider: TabsProvider,
  useStyledContext: useTabsContext
} = createStyledContext19();

// node_modules/.pnpm/@hanzogui+tabs@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_a0ecc6e3c6710aa6ca556be8a37ef8be/node_modules/@hanzogui/tabs/dist/esm/Tabs.mjs
import { styled as styled31, View as View16 } from "@hanzogui/core";
var TABS_NAME = "Tabs";
var DefaultTabsFrame = styled31(SizableStack, {
  name: TABS_NAME
});
var TRIGGER_NAME3 = "TabsTrigger";
var DefaultTabsTabFrame = styled31(View16, {
  name: TRIGGER_NAME3,
  role: "tab",
  variants: {
    size: {
      "...size": getButtonSized
    },
    disabled: {
      true: {
        pointerEvents: "none"
      }
    },
    unstyled: {
      false: {
        borderWidth: 0,
        backgroundColor: "$background",
        userSelect: "none",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "nowrap",
        flexDirection: "row",
        cursor: "pointer",
        pressStyle: {
          backgroundColor: "$backgroundPress"
        },
        focusVisibleStyle: {
          outlineColor: "$outlineColor",
          outlineWidth: 2,
          outlineStyle: "solid",
          zIndex: 10
        }
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
}, {
  accept: {
    activeStyle: "style"
  }
});
var CONTENT_NAME3 = "TabsContent";
var DefaultTabsContentFrame = styled31(ThemeableStack, {
  name: CONTENT_NAME3
});

// node_modules/.pnpm/@hanzogui+tabs@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_a0ecc6e3c6710aa6ca556be8a37ef8be/node_modules/@hanzogui/tabs/dist/esm/createTabs.mjs
import { jsx as jsx53 } from "react/jsx-runtime";
function createTabs(createProps) {
  const {
    ContentFrame: ContentFrame2 = DefaultTabsContentFrame,
    TabFrame = DefaultTabsTabFrame,
    TabsFrame = DefaultTabsFrame
  } = createProps;
  const TABS_CONTEXT = "TabsContext";
  const TAB_LIST_NAME = "TabsList";
  const TabsList2 = React72.forwardRef((props, forwardedRef) => {
    const {
      __scopeTabs,
      loop = true,
      children,
      ...listProps
    } = props;
    const context3 = useTabsContext(__scopeTabs);
    return /* @__PURE__ */ jsx53(RovingFocusGroup, {
      __scopeRovingFocusGroup: __scopeTabs || TABS_CONTEXT,
      orientation: context3.orientation,
      dir: context3.dir,
      loop,
      asChild: true,
      children: /* @__PURE__ */ jsx53(Group, {
        role: "tablist",
        componentName: TAB_LIST_NAME,
        "aria-orientation": context3.orientation,
        ref: forwardedRef,
        orientation: context3.orientation,
        ...listProps,
        children
      })
    });
  });
  TabsList2.displayName = TAB_LIST_NAME;
  const TRIGGER_NAME4 = "TabsTrigger";
  const TabsTrigger2 = TabFrame.styleable((props, forwardedRef) => {
    const {
      __scopeTabs,
      value,
      disabled = false,
      onInteraction,
      activeStyle,
      activeTheme,
      unstyled = false,
      ...triggerProps
    } = props;
    const context3 = useTabsContext(__scopeTabs);
    const triggerId = makeTriggerId(context3.baseId, value);
    const contentId = makeContentId(context3.baseId, value);
    const isSelected = value === context3.value;
    const [layout, setLayout] = React72.useState(null);
    const triggerRef = React72.useRef(null);
    const groupItemProps = useGroupItem({
      disabled: !!disabled
    });
    React72.useEffect(() => {
      context3.registerTrigger();
      return () => context3.unregisterTrigger();
    }, []);
    React72.useEffect(() => {
      if (!triggerRef.current || !isWeb) return;
      const el = triggerRef.current;
      function getTriggerSize() {
        if (!el) return;
        setLayout({
          width: el.offsetWidth,
          height: el.offsetHeight,
          x: el.offsetLeft,
          y: el.offsetTop
        });
      }
      __name(getTriggerSize, "getTriggerSize");
      getTriggerSize();
      const observer = new ResizeObserver(getTriggerSize);
      observer.observe(el);
      return () => {
        observer.disconnect();
      };
    }, [context3.triggersCount]);
    React72.useEffect(() => {
      if (isSelected && layout) {
        onInteraction?.("select", layout);
      }
    }, [isSelected, value, layout]);
    return /* @__PURE__ */ jsx53(RovingFocusGroup.Item, {
      __scopeRovingFocusGroup: __scopeTabs || TABS_CONTEXT,
      asChild: true,
      focusable: !disabled,
      active: isSelected,
      children: /* @__PURE__ */ jsx53(TabFrame, {
        ...!isWeb && {
          onLayout: /* @__PURE__ */ __name((event) => {
            setLayout(event.nativeEvent.layout);
          }, "onLayout")
        },
        onMouseEnter: composeEventHandlers(props.onMouseEnter, () => {
          if (layout) {
            onInteraction?.("hover", layout);
          }
        }),
        onMouseLeave: composeEventHandlers(props.onMouseLeave, () => {
          onInteraction?.("hover", null);
        }),
        role: "tab",
        "aria-selected": isSelected,
        "aria-controls": contentId,
        "data-state": isSelected ? "active" : "inactive",
        "data-disabled": disabled ? "" : void 0,
        id: triggerId,
        theme: activeTheme ?? null,
        unstyled,
        ...!unstyled && {
          size: context3.size
        },
        ...isSelected && {
          ...!unstyled && !activeStyle && {
            backgroundColor: "$backgroundActive"
          },
          ...activeStyle
        },
        ...groupItemProps,
        disabled: disabled ?? groupItemProps.disabled,
        ...triggerProps,
        ref: composeRefs(forwardedRef, triggerRef),
        onPress: composeEventHandlers(props.onPress ?? void 0, (event) => {
          const webChecks = !isWeb || event.button === 0 && event.ctrlKey === false;
          if (!disabled && !isSelected && webChecks) {
            context3.onChange(value);
          }
        }),
        ...isWeb && {
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            if ([" ", "Enter"].includes(event.key)) {
              context3.onChange(value);
              event.preventDefault();
            }
          }),
          onFocus: composeEventHandlers(props.onFocus, (event) => {
            if (layout) {
              onInteraction?.("focus", layout);
            }
            const isAutomaticActivation = context3.activationMode !== "manual";
            if (!isSelected && !disabled && isAutomaticActivation) {
              context3.onChange(value);
            }
          }),
          onBlur: composeEventHandlers(props.onBlur, () => {
            onInteraction?.("focus", null);
          })
        }
      })
    });
  });
  TabsTrigger2.displayName = TRIGGER_NAME4;
  const TabsContent2 = ContentFrame2.styleable(/* @__PURE__ */ __name(function TabsContent22(props, forwardedRef) {
    const {
      __scopeTabs,
      value,
      forceMount,
      children,
      ...contentProps
    } = props;
    const context3 = useTabsContext(__scopeTabs);
    const isSelected = value === context3.value;
    const show = forceMount || isSelected;
    const triggerId = makeTriggerId(context3.baseId, value);
    const contentId = makeContentId(context3.baseId, value);
    if (!show) {
      return null;
    }
    return /* @__PURE__ */ jsx53(ContentFrame2, {
      "data-state": isSelected ? "active" : "inactive",
      "data-orientation": context3.orientation,
      role: "tabpanel",
      "aria-labelledby": triggerId,
      hidden: !show,
      id: contentId,
      tabIndex: 0,
      ...contentProps,
      ref: forwardedRef,
      children
    }, value);
  }, "TabsContent2"));
  const TabsComponent = TabsFrame.styleable(/* @__PURE__ */ __name(function Tabs3(props, forwardedRef) {
    const {
      __scopeTabs,
      value: valueProp,
      onValueChange,
      defaultValue: defaultValue2,
      orientation = "horizontal",
      dir,
      activationMode = "manual",
      size: size4 = "$true",
      ...tabsProps
    } = props;
    const direction = useDirection(dir);
    const [value, setValue] = useControllableState({
      prop: valueProp,
      onChange: onValueChange,
      defaultProp: defaultValue2 ?? ""
    });
    const [triggersCount, setTriggersCount] = React72.useState(0);
    const registerTrigger = useEvent8(() => setTriggersCount((v) => v + 1));
    const unregisterTrigger = useEvent8(() => setTriggersCount((v) => v - 1));
    return /* @__PURE__ */ jsx53(SizableContext.Provider, {
      size: size4,
      children: /* @__PURE__ */ jsx53(TabsProvider, {
        scope: __scopeTabs,
        baseId: React72.useId(),
        value,
        onChange: setValue,
        orientation,
        dir: direction,
        activationMode,
        size: size4,
        registerTrigger,
        triggersCount,
        unregisterTrigger,
        children: /* @__PURE__ */ jsx53(TabsFrame, {
          direction,
          "data-orientation": orientation,
          ...tabsProps,
          ref: forwardedRef
        })
      })
    });
  }, "Tabs"));
  return withStaticProperties(TabsComponent, {
    List: TabsList2,
    /**
     * @deprecated Use Tabs.Tab instead
     */
    Trigger: TabsTrigger2,
    Tab: TabsTrigger2,
    Content: TabsContent2
  });
}
__name(createTabs, "createTabs");
function makeTriggerId(baseId, value) {
  return `${baseId}-trigger-${value}`;
}
__name(makeTriggerId, "makeTriggerId");
function makeContentId(baseId, value) {
  return `${baseId}-content-${value}`;
}
__name(makeContentId, "makeContentId");

// node_modules/.pnpm/@hanzogui+tabs@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@ba_a0ecc6e3c6710aa6ca556be8a37ef8be/node_modules/@hanzogui/tabs/dist/esm/index.mjs
var Tabs = createTabs({
  ContentFrame: DefaultTabsContentFrame,
  TabFrame: DefaultTabsTabFrame,
  TabsFrame: DefaultTabsFrame
});

// node_modules/.pnpm/@hanzogui+visually-hidden@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native_f92b6f64facad5708f9675b2b9a2eeaa/node_modules/@hanzogui/visually-hidden/dist/esm/VisuallyHidden.mjs
import { Text as Text5, styled as styled32 } from "@hanzogui/web";
var VisuallyHidden = styled32(Text5, {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  zIndex: -1e4,
  overflow: "hidden",
  opacity: 1e-8,
  pointerEvents: "none",
  variants: {
    preserveDimensions: {
      true: {
        position: "relative",
        width: "auto",
        height: "auto"
      }
    },
    visible: {
      true: {
        position: "relative",
        width: "auto",
        height: "auto",
        margin: 0,
        zIndex: 1,
        overflow: "visible",
        opacity: 1,
        pointerEvents: "auto"
      }
    }
  }
});
VisuallyHidden["isVisuallyHidden"] = true;

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/createNativeToast.mjs
var createNativeToast = /* @__PURE__ */ __name((title, {
  message,
  notificationOptions
}) => {
  if (!("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") return false;
  const notification = new Notification(title, {
    body: message,
    ...notificationOptions
  });
  return {
    nativeToastRef: notification
  };
}, "createNativeToast");

// node_modules/.pnpm/@hanzogui+tooltip@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9__9bd980293bacc3b9812b035252a6fc48/node_modules/@hanzogui/tooltip/dist/esm/Tooltip.mjs
import { useEvent as useEvent9 } from "@hanzogui/core";
import * as React73 from "react";
import { jsx as jsx54 } from "react/jsx-runtime";
var TOOLTIP_SCOPE = "";
var ALWAYS_DISABLE_TOOLTIP = {
  focus: true,
  "remove-scroll": true
  // it's nice to hit escape to hide a tooltip
  // dismiss: true
};
var TooltipContent = PopperContentFrame.styleable((props, ref) => {
  const preventAnimation = React73.useContext(PreventTooltipAnimationContext);
  const zIndexFromContext = React73.useContext(TooltipZIndexContext);
  return /* @__PURE__ */ jsx54(PopoverContent, {
    scope: props.scope || TOOLTIP_SCOPE,
    alwaysDisable: ALWAYS_DISABLE_TOOLTIP,
    ...!props.unstyled && {
      backgroundColor: "$background",
      alignItems: "center",
      pointerEvents: "none",
      size: "$true"
    },
    ref,
    ...zIndexFromContext !== void 0 && {
      zIndex: zIndexFromContext
    },
    ...props,
    ...preventAnimation && {
      transition: null
    }
  });
}, {
  staticConfig: {
    componentName: "Tooltip"
  }
});
var TooltipArrow = React73.forwardRef((props, ref) => {
  return /* @__PURE__ */ jsx54(PopoverArrow, {
    scope: props.scope || TOOLTIP_SCOPE,
    componentName: "Tooltip",
    ref,
    ...props
  });
});
var PreventTooltipAnimationContext = React73.createContext(false);
var TooltipZIndexContext = React73.createContext(void 0);
var TooltipGroup = /* @__PURE__ */ __name(({
  children,
  delay,
  preventAnimation = false,
  timeoutMs
}) => {
  return /* @__PURE__ */ jsx54(PreventTooltipAnimationContext.Provider, {
    value: preventAnimation,
    children: /* @__PURE__ */ jsx54(FloatingDelayGroup, {
      timeoutMs,
      delay: React73.useMemo(() => delay, [JSON.stringify(delay)]),
      children
    })
  });
}, "TooltipGroup");
var setOpens = /* @__PURE__ */ new Set();
var TooltipComponent = React73.forwardRef(/* @__PURE__ */ __name(function Tooltip(props, ref) {
  "use no memo";
  const {
    children,
    delay: delayProp,
    restMs: restMsProp,
    onOpenChange: onOpenChangeProp,
    focus: focus2,
    open: openProp,
    disableAutoCloseOnScroll,
    zIndex,
    scope = TOOLTIP_SCOPE,
    ...restProps
  } = props;
  const triggerRef = React73.useRef(null);
  const [hasCustomAnchor, setHasCustomAnchor] = React73.useState(false);
  const {
    delay: delayGroup,
    setCurrentId
  } = useDelayGroupContext();
  const delay = delayProp !== void 0 ? delayProp : delayGroup ?? 400;
  const restMs = restMsProp ?? (typeof delay === "number" ? delay : 0);
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: false,
    onChange: onOpenChangeProp
  });
  const id = props.groupId;
  const onOpenChange = useEvent9((open2) => {
    if (open2) {
      setCurrentId(id);
    }
    setOpen(open2);
  });
  React73.useEffect(() => {
    if (!open) return;
    if (disableAutoCloseOnScroll) return;
    if (typeof document === "undefined") return;
    const closeIt = /* @__PURE__ */ __name(() => {
      setOpen(false);
    }, "closeIt");
    setOpens.add(setOpen);
    document.documentElement.addEventListener("scroll", closeIt);
    return () => {
      setOpens.delete(setOpen);
      document.documentElement.removeEventListener("scroll", closeIt);
    };
  }, [open, disableAutoCloseOnScroll]);
  const floatingContext = useFloatingContext({
    open,
    setOpen: onOpenChange,
    disable: false,
    disableFocus: false,
    hoverable: true,
    role: "tooltip",
    focus: focus2,
    groupId: id,
    delay,
    restMs
  });
  const onCustomAnchorAdd = React73.useCallback(() => setHasCustomAnchor(true), []);
  const onCustomAnchorRemove = React73.useCallback(() => setHasCustomAnchor(false), []);
  const contentId = React73.useId();
  const smallerSize = props.unstyled ? null : getSize("$true", {
    shift: -2,
    bounds: [0]
  });
  const content = /* @__PURE__ */ jsx54(FloatingOverrideContext.Provider, {
    value: floatingContext,
    children: /* @__PURE__ */ jsx54(Popper, {
      scope,
      size: smallerSize?.key,
      allowFlip: true,
      stayInFrame: true,
      open,
      ...restProps,
      children: /* @__PURE__ */ jsx54(PopoverContextProvider, {
        scope,
        contentId,
        triggerRef,
        open,
        onOpenChange: setOpen,
        onOpenToggle: voidFn2,
        hasCustomAnchor,
        onCustomAnchorAdd,
        onCustomAnchorRemove,
        children
      })
    })
  });
  if (zIndex !== void 0) {
    return /* @__PURE__ */ jsx54(TooltipZIndexContext.Provider, {
      value: zIndex,
      children: content
    });
  }
  return content;
}, "Tooltip"));
var TooltipTrigger = React73.forwardRef(/* @__PURE__ */ __name(function TooltipTrigger2(props, ref) {
  const {
    scope,
    ...rest
  } = props;
  return /* @__PURE__ */ jsx54(PopoverTrigger, {
    ...rest,
    scope: scope || TOOLTIP_SCOPE,
    ref
  });
}, "TooltipTrigger2"));
var TooltipAnchor = React73.forwardRef(/* @__PURE__ */ __name(function TooltipAnchor2(props, ref) {
  const {
    scope,
    ...rest
  } = props;
  return /* @__PURE__ */ jsx54(PopoverAnchor, {
    ...rest,
    scope: scope || TOOLTIP_SCOPE,
    ref
  });
}, "TooltipAnchor2"));
var Tooltip2 = withStaticProperties(TooltipComponent, {
  Anchor: TooltipAnchor,
  Arrow: TooltipArrow,
  Content: TooltipContent,
  Trigger: TooltipTrigger
});
var voidFn2 = /* @__PURE__ */ __name(() => {
}, "voidFn");

// node_modules/.pnpm/@hanzogui+element@7.3.0_react-native@0.83.9_@babel+core@7.29.0_@react-native+metro-conf_bc572ffd918a7da8d57ac60ade50958c/node_modules/@hanzogui/element/dist/esm/useWebRef.mjs
import * as React74 from "react";
function useWebRef(forwardedRef) {
  const ref = React74.useRef(null);
  const composedRef = useComposedRefs(ref, forwardedRef);
  return {
    ref,
    composedRef
  };
}
__name(useWebRef, "useWebRef");

// node_modules/.pnpm/@hanzogui+input@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_212b73f48981a855f279c8a8dd255bf8/node_modules/@hanzogui/input/dist/esm/Input.mjs
import { View as View17, styled as styled33, useTheme as useTheme3 } from "@hanzogui/core";
import React75 from "react";

// node_modules/.pnpm/@hanzogui+input@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_212b73f48981a855f279c8a8dd255bf8/node_modules/@hanzogui/input/dist/esm/shared.mjs
import { Text as Text6 } from "@hanzogui/core";
import { getVariableValue as getVariableValue12, isWeb as isWeb11 } from "@hanzogui/core";
var defaultStyles = {
  size: "$true",
  fontFamily: "$body",
  borderWidth: 1,
  outlineWidth: 0,
  color: "$color",
  ...isWeb11 ? {
    tabIndex: 0
  } : {
    focusable: true
  },
  borderColor: "$borderColor",
  backgroundColor: "$background",
  // this fixes a flex bug where it overflows container
  minWidth: 0,
  hoverStyle: {
    borderColor: "$borderColorHover"
  },
  focusStyle: {
    borderColor: "$borderColorFocus"
  },
  focusVisibleStyle: {
    outlineColor: "$outlineColor",
    outlineWidth: 2,
    outlineStyle: "solid"
  }
};
var inputSizeVariant = /* @__PURE__ */ __name((val = "$true", extras) => {
  if (extras.props.tag === "textarea" || extras.props.rows > 1 || extras.props.multiline || extras.props.numberOfLines > 1) {
    return textAreaSizeVariant(val, extras);
  }
  const buttonStyles = getButtonSized(val, extras);
  const paddingHorizontal = getSpace(val, {
    shift: -1,
    bounds: [2]
  });
  const fontStyle = getFontSized(val, extras);
  if (!isWeb11 && fontStyle) {
    delete fontStyle["lineHeight"];
  }
  return {
    ...fontStyle,
    ...buttonStyles,
    paddingHorizontal
  };
}, "inputSizeVariant");
var textAreaSizeVariant = /* @__PURE__ */ __name((val = "$true", extras) => {
  const {
    props
  } = extras;
  const buttonStyles = getButtonSized(val, extras);
  const fontStyle = getFontSized(val, extras);
  const lines = props.rows ?? props.numberOfLines;
  const height = typeof lines === "number" ? lines * getVariableValue12(fontStyle.lineHeight) : "auto";
  if (!isWeb11 && fontStyle) {
    delete fontStyle["lineHeight"];
  }
  const paddingVertical = getSpace(val, {
    shift: -2,
    bounds: [2]
  });
  const paddingHorizontal = getSpace(val, {
    shift: -1,
    bounds: [2]
  });
  return {
    ...buttonStyles,
    ...fontStyle,
    paddingVertical,
    paddingHorizontal,
    height
  };
}, "textAreaSizeVariant");
var INPUT_NAME = "Input";
var styledBody = [{
  name: INPUT_NAME,
  render: "input",
  variants: {
    unstyled: {
      false: defaultStyles
    },
    size: {
      "...size": inputSizeVariant
    },
    disabled: {
      true: {}
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
}, {
  isInput: true,
  accept: {
    placeholderTextColor: "color",
    selectionColor: "color",
    cursorColor: "color",
    selectionHandleColor: "color",
    underlineColorAndroid: "color"
  },
  validStyles: Text6.staticConfig.validStyles
}];

// node_modules/.pnpm/@hanzogui+input@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_212b73f48981a855f279c8a8dd255bf8/node_modules/@hanzogui/input/dist/esm/Input.mjs
import { jsx as jsx55 } from "react/jsx-runtime";
var StyledInput = styled33(View17, styledBody[0], styledBody[1]);
var Input = StyledInput.styleable((props, _forwardedRef) => {
  const {
    disabled,
    id,
    onChangeText,
    onSubmitEditing,
    onSelectionChange,
    selection,
    placeholderTextColor,
    selectionColor,
    rows,
    // Native-only props (ignored on web)
    keyboardAppearance,
    returnKeyType,
    submitBehavior,
    blurOnSubmit,
    caretHidden,
    contextMenuHidden,
    selectTextOnFocus,
    secureTextEntry,
    maxFontSizeMultiplier,
    allowFontScaling,
    multiline,
    keyboardType,
    autoCapitalize: autoCapitalizeProp,
    autoCorrect: autoCorrectProp,
    autoFocusNative,
    textContentType,
    onEndEditing,
    onContentSizeChange,
    onScroll,
    onKeyPress,
    // iOS-only props (ignored on web)
    clearButtonMode,
    clearTextOnFocus,
    enablesReturnKeyAutomatically,
    dataDetectorTypes,
    scrollEnabled,
    passwordRules,
    rejectResponderTermination,
    spellCheck,
    lineBreakStrategyIOS,
    lineBreakModeIOS,
    smartInsertDelete,
    inputAccessoryViewID,
    inputAccessoryViewButtonLabel,
    disableKeyboardShortcuts,
    // Android-only props (ignored on web)
    cursorColor,
    selectionHandleColor,
    underlineColorAndroid,
    importantForAutofill,
    disableFullscreenUI,
    inlineImageLeft,
    inlineImagePadding,
    returnKeyLabel,
    textBreakStrategy,
    textAlignVertical,
    verticalAlign,
    showSoftInputOnFocus,
    numberOfLines,
    ...rest
  } = props;
  const {
    ref,
    composedRef
  } = useWebRef(_forwardedRef);
  const theme = useTheme3();
  const autoCorrect = autoCorrectProp === true ? "on" : autoCorrectProp === false ? "off" : autoCorrectProp;
  const autoCapitalize = autoCapitalizeProp === "sentences" || autoCapitalizeProp === "words" ? "on" : autoCapitalizeProp === "none" || autoCapitalizeProp === "characters" ? "off" : autoCapitalizeProp;
  React75.useEffect(() => {
    if (!onSelectionChange) return;
    const node = ref.current;
    if (!node) return;
    const handleSelectionChange = /* @__PURE__ */ __name(() => {
      onSelectionChange({
        nativeEvent: {
          selection: {
            start: node.selectionStart ?? 0,
            end: node.selectionEnd ?? 0
          }
        }
      });
    }, "handleSelectionChange");
    node.addEventListener("select", handleSelectionChange);
    return () => node.removeEventListener("select", handleSelectionChange);
  }, [onSelectionChange]);
  React75.useEffect(() => {
    if (selection && ref.current) {
      ref.current.setSelectionRange(selection.start, selection.end ?? selection.start);
    }
  }, [selection?.start, selection?.end]);
  React75.useEffect(() => {
    if (!id || disabled) return;
    return registerFocusable(id, {
      focusAndSelect: /* @__PURE__ */ __name(() => ref.current?.focus(), "focusAndSelect"),
      focus: /* @__PURE__ */ __name(() => ref.current?.focus(), "focus")
    });
  }, [id, disabled]);
  const handleKeyDown = /* @__PURE__ */ __name((e) => {
    if (e.key === "Enter" && onSubmitEditing) {
      onSubmitEditing({
        nativeEvent: {
          text: e.target.value
        }
      });
    }
    rest.onKeyDown?.(e);
  }, "handleKeyDown");
  const handleChange = /* @__PURE__ */ __name((e) => {
    onChangeText?.(e.target.value);
    rest.onChange?.(e);
  }, "handleChange");
  const finalProps = {
    ...rest,
    disabled,
    id,
    rows,
    autoCorrect,
    autoCapitalize,
    onKeyDown: onSubmitEditing ? handleKeyDown : rest.onKeyDown,
    onChange: onChangeText ? handleChange : rest.onChange,
    style: {
      ...rest.style,
      ...placeholderTextColor && {
        "--placeholderColor": theme[placeholderTextColor]?.variable || placeholderTextColor
      },
      ...selectionColor && {
        "--selectionColor": theme[selectionColor]?.variable || selectionColor
      }
    }
  };
  return /* @__PURE__ */ jsx55(StyledInput, {
    ref: composedRef,
    ...finalProps
  });
});

// node_modules/.pnpm/@hanzogui+input@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_212b73f48981a855f279c8a8dd255bf8/node_modules/@hanzogui/input/dist/esm/TextArea.mjs
import { styled as styled34 } from "@hanzogui/web";
var TextArea = styled34(Input, {
  name: "TextArea",
  render: "textarea",
  // this attribute fixes firefox newline issue
  // @ts-ignore
  whiteSpace: "pre-wrap",
  variants: {
    unstyled: {
      false: {
        height: "auto",
        ...defaultStyles,
        rows: 3
      }
    },
    size: {
      "...size": textAreaSizeVariant
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});

// node_modules/.pnpm/@hanzogui+spinner@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9__7f8f332740e525691173fa220c2c6ae2/node_modules/@hanzogui/spinner/dist/esm/Spinner.mjs
import { useTheme as useTheme4, variableToString } from "@hanzogui/core";
import { jsx as jsx56 } from "react/jsx-runtime";
var Spinner = YStack.styleable((props, ref) => {
  const {
    size: size4,
    color: colorProp,
    ...stackProps
  } = props;
  const theme = useTheme4();
  let color = colorProp;
  if (color && color[0] === "$") {
    color = variableToString(theme[color]);
  }
  return /* @__PURE__ */ jsx56(YStack, {
    ref,
    ...stackProps,
    children: /* @__PURE__ */ jsx56(ActivityIndicator_default, {
      size: size4,
      color
    })
  });
});

// node_modules/.pnpm/@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21.2_rea_a33ca91a33fc5aafa6a7d593db742767/node_modules/@hanzo/gui/dist/esm/views/Text.mjs
import { Text as GuiText, styled as styled35 } from "@hanzogui/core";
var Text7 = styled35(GuiText, {
  variants: {
    unstyled: {
      false: {
        color: "$color"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});

// node_modules/.pnpm/@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-web@0.21.2_rea_a33ca91a33fc5aafa6a7d593db742767/node_modules/@hanzo/gui/dist/esm/index.mjs
import { ClientOnly, Configuration, ComponentContext, GroupContext, FontLanguage, Theme as Theme3, View as View18, createComponent, createFont, createShorthands, createStyledContext as createStyledContext20, createTokens, createVariable, getConfig as getConfig2, getMedia, getCSSStylesAtomic, getThemes, getToken, getTokenValue as getTokenValue3, getTokens as getTokens5, getVariable as getVariable2, getVariableName, getVariableValue as getVariableValue13, insertFont, setConfig, setupDev, _withStableStyle, isBrowser as isBrowser2, isChrome as isChrome2, isClient as isClient3, isServer as isServer2, isGuiComponent, isGuiElement, isTouchable as isTouchable2, isVariable as isVariable4, isWeb as isWeb12, isWebTouchable as isWebTouchable2, matchMedia, mediaObjectToString, mediaQueryConfig, mediaState, setOnLayoutStrategy, styled as styled36, themeable, useClientValue, useDidFinishSSR as useDidFinishSSR2, useEvent as useEvent10, useGet as useGet4, useIsTouchDevice as useIsTouchDevice4, useIsomorphicLayoutEffect as useIsomorphicLayoutEffect3, useMedia as useMedia2, useProps as useProps3, usePropsAndStyle, useStyle, useConfiguration as useConfiguration2, useTheme as useTheme5, useThemeName as useThemeName5, variableToString as variableToString2, withStaticProperties as withStaticProperties9 } from "@hanzogui/core";

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/aspect-ratio.js
var AspectRatio = /* @__PURE__ */ __name(({ ratio = 1, ...props }) => _jsx(YStack, { "data-slot": "aspect-ratio", width: "100%", aspectRatio: ratio, ...props }), "AspectRatio");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/avatar.js
import { jsx as _jsx2 } from "react/jsx-runtime";
var SIZE = 32;
var Avatar2 = /* @__PURE__ */ __name((props) => _jsx2(Avatar, { "data-slot": "avatar", circular: true, size: SIZE, shrink: 0, overflow: "hidden", ...props }), "Avatar");
var AvatarImage2 = /* @__PURE__ */ __name((props) => _jsx2(Avatar.Image, { "data-slot": "avatar-image", width: "100%", height: "100%", ...props }), "AvatarImage");
var AvatarFallback2 = /* @__PURE__ */ __name(({ children, ...props }) => _jsx2(Avatar.Fallback, { "data-slot": "avatar-fallback", bg: "$color4", items: "center", justify: "center", ...props, children: typeof children === "string" || typeof children === "number" ? _jsx2(SizableText2, { size: "$2", color: "$color11", children }) : children }), "AvatarFallback");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/badge.js
import { jsx as _jsx3 } from "react/jsx-runtime";

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/ink.js
import { Children as Children6, createElement as createElement5 } from "react";
var ink = /* @__PURE__ */ __name((children, Wrap = SizableText2, props = {}) => Children6.map(children, (child) => typeof child === "string" || typeof child === "number" ? createElement5(Wrap, props, child) : child), "ink");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/gesture.js
var dragPos = /* @__PURE__ */ __name((e, horizontal) => (horizontal ? e.clientX ?? e.nativeEvent?.pageX : e.clientY ?? e.nativeEvent?.pageY) ?? 0, "dragPos");
var drag = /* @__PURE__ */ __name(({ begin, move, end, enabled = true }) => isWeb12 ? {
  onPointerDown: /* @__PURE__ */ __name((e) => {
    if (!enabled)
      return;
    const target = e.currentTarget;
    if (target?.setPointerCapture && e.pointerId != null)
      target.setPointerCapture(e.pointerId);
    begin(e);
  }, "onPointerDown"),
  onPointerMove: move,
  onPointerUp: end,
  onPointerCancel: end
} : {
  onStartShouldSetResponder: /* @__PURE__ */ __name(() => enabled, "onStartShouldSetResponder"),
  onMoveShouldSetResponder: /* @__PURE__ */ __name(() => enabled, "onMoveShouldSetResponder"),
  onResponderTerminationRequest: /* @__PURE__ */ __name(() => false, "onResponderTerminationRequest"),
  onResponderGrant: begin,
  onResponderMove: move,
  onResponderRelease: end,
  onResponderTerminate: end
}, "drag");
var MAX_PAD = 24;
var touch = /* @__PURE__ */ __name((size4, min2 = 44, axis = "both") => {
  const pad = Math.min(MAX_PAD, Math.ceil((min2 - size4) / 2));
  if (pad <= 0)
    return {};
  if (!isWeb12)
    return {
      hitSlop: axis === "both" ? pad : axis === "x" ? { left: pad, right: pad } : { top: pad, bottom: pad }
    };
  return {
    position: "relative",
    ...axis !== "y" && { "data-touch-x": String(pad) },
    ...axis !== "x" && { "data-touch-y": String(pad) }
  };
}, "touch");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/badge.js
var MIN_TOUCH = 44;
var HEIGHT = 24;
var BadgeContext = /* @__PURE__ */ createStyledContext20({ variant: "default" });
var BadgeFrame = styled36(XStack, {
  name: "Badge",
  context: BadgeContext,
  self: "flex-start",
  items: "center",
  justify: "center",
  shrink: 0,
  minH: HEIGHT,
  px: "$2.5",
  py: "$1",
  gap: "$1.5",
  rounded: "$2",
  borderWidth: 1,
  borderColor: "transparent",
  overflow: "hidden",
  variants: {
    variant: {
      default: { bg: "$color12" },
      secondary: { bg: "$color4" },
      destructive: { bg: "$red9" },
      outline: { bg: "$background", borderColor: "$borderColor" },
      ghost: { bg: "transparent", hoverStyle: { bg: "$color3" } },
      link: { bg: "transparent" },
      inputAdornment: { bg: "$color3", px: "$2" },
      tags: { bg: "$color3", borderColor: "$borderColor", rounded: "$3" }
    }
  },
  defaultVariants: { variant: "default" }
});
var BadgeText = styled36(SizableText2, {
  name: "BadgeText",
  context: BadgeContext,
  size: "$1",
  fontWeight: "600",
  variants: {
    variant: {
      default: { color: "$color1" },
      secondary: { color: "$color12" },
      destructive: { color: "$white1" },
      outline: { color: "$color12" },
      ghost: { color: "$color12" },
      link: { color: "$color12", textDecorationLine: "underline" },
      inputAdornment: { color: "$color12", fontWeight: "500" },
      tags: { color: "$color11", fontWeight: "400", textTransform: "capitalize" }
    }
  }
});
var badgeVariants = /* @__PURE__ */ __name(({ variant } = {}) => `hanzo-badge hanzo-badge--${variant ?? "default"}`, "badgeVariants");
function Badge({ className, variant = "default", asChild = false, children, ...props }) {
  return _jsx3(BadgeFrame, { "data-slot": "badge", "data-variant": variant, variant: variant ?? "default", asChild, render: asChild ? void 0 : "span", ...touch(HEIGHT, MIN_TOUCH, "y"), className: [badgeVariants({ variant }), className].filter(Boolean).join(" "), ...props, children: asChild ? children : ink(children, BadgeText) });
}
__name(Badge, "Badge");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/button.js
import { jsx as _jsx4, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement as createElement6, isValidElement as isValidElement3 } from "react";
var HEIGHT2 = {
  default: 36,
  sm: 32,
  lg: 40,
  icon: 36,
  "icon-sm": 32,
  "icon-lg": 40
};
var TYPE = {
  default: "$3",
  sm: "$2",
  lg: "$3",
  icon: "$3",
  "icon-sm": "$2",
  "icon-lg": "$3"
};
var Frame2 = styled36(Button.Frame, {
  name: "Button",
  items: "center",
  justify: "center",
  gap: "$2",
  shrink: 0,
  rounded: "$3",
  borderWidth: 1,
  borderColor: "transparent",
  cursor: "pointer",
  variants: {
    variant: {
      default: { bg: "$color12", color: "$color1", hoverStyle: { opacity: 0.9 } },
      primary: { bg: "$color12", color: "$color1", hoverStyle: { opacity: 0.9 } },
      destructive: { bg: "$red9", color: "$white1", hoverStyle: { opacity: 0.9 } },
      outline: {
        bg: "$background",
        color: "$color12",
        borderColor: "$borderColor",
        hoverStyle: { bg: "$color3" }
      },
      secondary: { bg: "$color4", color: "$color12", hoverStyle: { opacity: 0.8 } },
      ghost: { bg: "transparent", color: "$color12", hoverStyle: { bg: "$color3" } },
      link: { bg: "transparent", color: "$color12", hoverStyle: { textDecorationLine: "underline" } },
      linkFG: { bg: "transparent", color: "$color12", hoverStyle: { textDecorationLine: "underline" } },
      linkMuted: {
        bg: "transparent",
        color: "$color11",
        hoverStyle: { color: "$color12", textDecorationLine: "underline" }
      }
    },
    size: {
      default: { height: HEIGHT2.default, px: "$4" },
      sm: { height: HEIGHT2.sm, px: "$3", gap: "$1.5" },
      lg: { height: HEIGHT2.lg, px: "$6" },
      icon: { height: HEIGHT2.icon, width: HEIGHT2.icon, px: 0 },
      "icon-sm": { height: HEIGHT2["icon-sm"], width: HEIGHT2["icon-sm"], px: 0 },
      "icon-lg": { height: HEIGHT2["icon-lg"], width: HEIGHT2["icon-lg"], px: 0 }
    },
    disabled: {
      true: { opacity: 0.5, pointerEvents: "none", cursor: "default" }
    }
  },
  defaultVariants: { variant: "default", size: "default" }
});
var buttonVariants = /* @__PURE__ */ __name(({ variant, size: size4, className } = {}) => [`hanzo-button`, `hanzo-button--${variant ?? "default"}`, `hanzo-button--${size4 ?? "default"}`, className].filter(Boolean).join(" "), "buttonVariants");
function Button2({ className, variant = "default", size: size4 = "default", asChild = false, isLoading = false, disabled, children, ...props }) {
  const resolved = size4 ?? "default";
  const host = asChild && isValidElement3(children) ? children : null;
  const body = host ? host.props.children : children;
  return _jsxs(Frame2, { "data-slot": "button", "data-variant": variant ?? "default", "data-size": resolved, variant: variant ?? "default", size: resolved, render: host ? createElement6(host.type, { ...host.props, children: void 0 }) : void 0, disabled: disabled || isLoading, ...touch(HEIGHT2[resolved], 44, "y"), className: buttonVariants({ variant, size: size4, className }), ...props, children: [isLoading && _jsx4(Spinner, { size: "small" }), ink(body, Button.Text, { fontSize: TYPE[resolved] })] });
}
__name(Button2, "Button");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/card.js
import { jsx as _jsx5 } from "react/jsx-runtime";

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/slot.js
var slot = /* @__PURE__ */ __name((name) => ({ "data-slot": name }), "slot");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/card.js
var PAD = 24;
var CardFrame = styled36(YStack, {
  name: "Card",
  bg: "$background",
  borderWidth: 1,
  borderColor: "$borderColor",
  rounded: "$6",
  py: PAD,
  gap: PAD
});
var HeaderFrame = styled36(XStack, {
  name: "CardHeader",
  px: PAD,
  gap: "$2",
  items: "flex-start",
  justify: "space-between"
});
var TitleFrame = styled36(SizableText2, { name: "CardTitle", size: "$4", fontWeight: "600" });
var DescriptionFrame = styled36(SizableText2, { name: "CardDescription", size: "$2", color: "$color11" });
var ActionFrame = styled36(XStack, { name: "CardAction", self: "flex-start", shrink: 0 });
var ContentFrame = styled36(YStack, { name: "CardContent", px: PAD });
var FooterFrame = styled36(XStack, { name: "CardFooter", px: PAD, items: "center" });
var Card = /* @__PURE__ */ __name((p) => _jsx5(CardFrame, { ...slot("card"), ...p }), "Card");
var CardHeader = /* @__PURE__ */ __name((p) => _jsx5(HeaderFrame, { ...slot("card-header"), ...p }), "CardHeader");
var CardTitle = /* @__PURE__ */ __name((p) => _jsx5(TitleFrame, { ...slot("card-title"), ...p }), "CardTitle");
var CardDescription = /* @__PURE__ */ __name((p) => _jsx5(DescriptionFrame, { ...slot("card-description"), ...p }), "CardDescription");
var CardAction = /* @__PURE__ */ __name((p) => _jsx5(ActionFrame, { ...slot("card-action"), ...p }), "CardAction");
var CardContent = /* @__PURE__ */ __name((p) => _jsx5(ContentFrame, { ...slot("card-content"), ...p }), "CardContent");
var CardFooter = /* @__PURE__ */ __name((p) => _jsx5(FooterFrame, { ...slot("card-footer"), ...p }), "CardFooter");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/checkbox.js
import { jsx as _jsx6 } from "react/jsx-runtime";

// node_modules/.pnpm/@hanzogui+helpers-icon@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-sv_2c92cd71e4af91b3a2cf329a1dadafe7/node_modules/@hanzogui/helpers-icon/dist/esm/themed.mjs
import { getTokenValue as getTokenValue4, getVariable as getVariable3, Text as Text8, usePropsAndStyle as usePropsAndStyle2 } from "@hanzogui/core";
import { jsx as jsx57 } from "react/jsx-runtime";
function needsFullStyleResolution(props) {
  for (const key in props) {
    if (key[0] === "$") return true;
  }
  return false;
}
__name(needsFullStyleResolution, "needsFullStyleResolution");
function themed(Component, optsIn = {}) {
  const opts = {
    defaultThemeColor: process.env.DEFAULT_ICON_THEME_COLOR || "$color",
    defaultStrokeWidth: 2,
    fallbackColor: "#000",
    resolveValues: process.env.GUI_ICON_COLOR_RESOLVE || "auto",
    ...optsIn
  };
  const IconWrapper = /* @__PURE__ */ __name((propsIn) => {
    const styledContext = SizableContext.useStyledContext();
    const needsMedia = needsFullStyleResolution(propsIn);
    const [props, style, theme] = usePropsAndStyle2(propsIn, {
      ...opts,
      forComponent: Text8,
      resolveValues: opts.resolveValues,
      noMedia: !needsMedia
    });
    const defaultColor = opts.defaultThemeColor;
    const colorIn = style.color || (defaultColor ? theme[defaultColor] : void 0) || (!props.disableTheme ? theme.color : null) || opts.fallbackColor;
    const color = getVariable3(colorIn);
    const size4 = typeof props.size === "string" ? getTokenValue4(props.size, "size") : props.size || (styledContext.size === "$true" ? void 0 : styledContext.size);
    const strokeWidth = typeof props.strokeWidth === "string" ? getTokenValue4(props.strokeWidth, "size") : props.strokeWidth ?? `${opts.defaultStrokeWidth}`;
    const finalProps = {
      ...props,
      color,
      size: size4,
      strokeWidth,
      style
    };
    return /* @__PURE__ */ jsx57(Component, {
      ...finalProps
    });
  }, "IconWrapper");
  const wrapped = /* @__PURE__ */ __name((propsIn) => {
    return /* @__PURE__ */ jsx57(IconWrapper, {
      ...propsIn
    });
  }, "wrapped");
  wrapped["staticConfig"] = {
    isHOC: true,
    acceptsClassName: true
  };
  return wrapped;
}
__name(themed, "themed");

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/Check.mjs
import { memo as memo6 } from "react";
import { Svg, Path } from "react-native-svg";
import { jsx as jsx58 } from "react/jsx-runtime";
var Check = themed(memo6(/* @__PURE__ */ __name(function Check2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsx58(Svg, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: /* @__PURE__ */ jsx58(Path, {
      d: "M20 6 9 17l-5-5",
      stroke: color
    })
  });
}, "Check2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/ChevronDown.mjs
import { memo as memo7 } from "react";
import { Svg as Svg2, Path as Path2 } from "react-native-svg";
import { jsx as jsx59 } from "react/jsx-runtime";
var ChevronDown = themed(memo7(/* @__PURE__ */ __name(function ChevronDown2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsx59(Svg2, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: /* @__PURE__ */ jsx59(Path2, {
      d: "m6 9 6 6 6-6",
      stroke: color
    })
  });
}, "ChevronDown2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/ChevronRight.mjs
import { memo as memo8 } from "react";
import { Svg as Svg3, Path as Path3 } from "react-native-svg";
import { jsx as jsx60 } from "react/jsx-runtime";
var ChevronRight = themed(memo8(/* @__PURE__ */ __name(function ChevronRight2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsx60(Svg3, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: /* @__PURE__ */ jsx60(Path3, {
      d: "m9 18 6-6-6-6",
      stroke: color
    })
  });
}, "ChevronRight2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/ChevronUp.mjs
import { memo as memo9 } from "react";
import { Svg as Svg4, Path as Path4 } from "react-native-svg";
import { jsx as jsx61 } from "react/jsx-runtime";
var ChevronUp = themed(memo9(/* @__PURE__ */ __name(function ChevronUp2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsx61(Svg4, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: /* @__PURE__ */ jsx61(Path4, {
      d: "m18 15-6-6-6 6",
      stroke: color
    })
  });
}, "ChevronUp2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/Circle.mjs
import { memo as memo10 } from "react";
import { Svg as Svg5, Circle as _Circle } from "react-native-svg";
import { jsx as jsx62 } from "react/jsx-runtime";
var Circle = themed(memo10(/* @__PURE__ */ __name(function Circle2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsx62(Svg5, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: /* @__PURE__ */ jsx62(_Circle, {
      cx: "12",
      cy: "12",
      r: "10",
      stroke: color
    })
  });
}, "Circle2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/EyeOff.mjs
import { memo as memo11 } from "react";
import { Svg as Svg6, Path as Path5 } from "react-native-svg";
import { jsx as jsx63, jsxs as jsxs10 } from "react/jsx-runtime";
var EyeOff = themed(memo11(/* @__PURE__ */ __name(function EyeOff2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsxs10(Svg6, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: [/* @__PURE__ */ jsx63(Path5, {
      d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
      stroke: color
    }), /* @__PURE__ */ jsx63(Path5, {
      d: "M14.084 14.158a3 3 0 0 1-4.242-4.242",
      stroke: color
    }), /* @__PURE__ */ jsx63(Path5, {
      d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
      stroke: color
    }), /* @__PURE__ */ jsx63(Path5, {
      d: "m2 2 20 20",
      stroke: color
    })]
  });
}, "EyeOff2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/Eye.mjs
import { memo as memo12 } from "react";
import { Svg as Svg7, Circle as _Circle2, Path as Path6 } from "react-native-svg";
import { jsx as jsx64, jsxs as jsxs11 } from "react/jsx-runtime";
var Eye = themed(memo12(/* @__PURE__ */ __name(function Eye2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsxs11(Svg7, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: [/* @__PURE__ */ jsx64(Path6, {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      stroke: color
    }), /* @__PURE__ */ jsx64(_Circle2, {
      cx: "12",
      cy: "12",
      r: "3",
      stroke: color
    })]
  });
}, "Eye2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/GripVertical.mjs
import { memo as memo13 } from "react";
import { Svg as Svg8, Circle as _Circle3 } from "react-native-svg";
import { jsx as jsx65, jsxs as jsxs12 } from "react/jsx-runtime";
var GripVertical = themed(memo13(/* @__PURE__ */ __name(function GripVertical2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsxs12(Svg8, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: [/* @__PURE__ */ jsx65(_Circle3, {
      cx: "9",
      cy: "12",
      r: "1",
      stroke: color
    }), /* @__PURE__ */ jsx65(_Circle3, {
      cx: "9",
      cy: "5",
      r: "1",
      stroke: color
    }), /* @__PURE__ */ jsx65(_Circle3, {
      cx: "9",
      cy: "19",
      r: "1",
      stroke: color
    }), /* @__PURE__ */ jsx65(_Circle3, {
      cx: "15",
      cy: "12",
      r: "1",
      stroke: color
    }), /* @__PURE__ */ jsx65(_Circle3, {
      cx: "15",
      cy: "5",
      r: "1",
      stroke: color
    }), /* @__PURE__ */ jsx65(_Circle3, {
      cx: "15",
      cy: "19",
      r: "1",
      stroke: color
    })]
  });
}, "GripVertical2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/Search.mjs
import { memo as memo14 } from "react";
import { Svg as Svg9, Circle as _Circle4, Path as Path7 } from "react-native-svg";
import { jsx as jsx66, jsxs as jsxs13 } from "react/jsx-runtime";
var Search = themed(memo14(/* @__PURE__ */ __name(function Search2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsxs13(Svg9, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: [/* @__PURE__ */ jsx66(Path7, {
      d: "m21 21-4.34-4.34",
      stroke: color
    }), /* @__PURE__ */ jsx66(_Circle4, {
      cx: "11",
      cy: "11",
      r: "8",
      stroke: color
    })]
  });
}, "Search2")));

// node_modules/.pnpm/@hanzogui+lucide-icons-2@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native-_aafbd022add1f3da27e76870fe0f0612/node_modules/@hanzogui/lucide-icons-2/dist/esm/icons/X.mjs
import { memo as memo15 } from "react";
import { Svg as Svg10, Path as Path8 } from "react-native-svg";
import { jsx as jsx67, jsxs as jsxs14 } from "react/jsx-runtime";
var X = themed(memo15(/* @__PURE__ */ __name(function X2(props) {
  const {
    color = "black",
    size: size4 = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */ jsxs14(Svg10, {
    width: size4,
    height: size4,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: [/* @__PURE__ */ jsx67(Path8, {
      d: "M18 6 6 18",
      stroke: color
    }), /* @__PURE__ */ jsx67(Path8, {
      d: "m6 6 12 12",
      stroke: color
    })]
  });
}, "X2")));

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/checkbox.js
var BOX = 16;
var Checkbox2 = /* @__PURE__ */ __name((props) => _jsx6(Checkbox, { ...slot("checkbox"), width: BOX, height: BOX, shrink: 0, rounded: "$2", borderWidth: 1, borderColor: "$borderColor", bg: "transparent", ...touch(BOX), ...props, children: _jsx6(Checkbox.Indicator, { ...slot("checkbox-indicator"), items: "center", justify: "center", children: _jsx6(Check, { size: BOX - 3 }) }) }), "Checkbox");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/collapsible.js
import { jsx as _jsx7 } from "react/jsx-runtime";
var Collapsible2 = /* @__PURE__ */ __name((p) => _jsx7(Collapsible, { ...slot("collapsible"), ...p }), "Collapsible");
var CollapsibleTrigger2 = /* @__PURE__ */ __name((p) => _jsx7(Collapsible.Trigger, { ...slot("collapsible-trigger"), unstyled: true, ...touch(28), ...p }), "CollapsibleTrigger");
var CollapsibleContent2 = /* @__PURE__ */ __name((p) => _jsx7(Collapsible.Content, { ...slot("collapsible-content"), ...p }), "CollapsibleContent");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/command.js
import { jsx as _jsx8, jsxs as _jsxs2 } from "react/jsx-runtime";
import { createContext as createContext18, forwardRef as forwardRef21, isValidElement as isValidElement4, useCallback as useCallback19, useContext as useContext20, useEffect as useEffect35, useId as useId19, useMemo as useMemo31, useReducer as useReducer3, useRef as useRef41, useState as useState27 } from "react";

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/command.logic.js
var score = /* @__PURE__ */ __name((value, search, keywords) => {
  const needle = search.trim().toLowerCase();
  if (!needle)
    return 1;
  const hay = (keywords?.length ? `${value} ${keywords.join(" ")}` : value).toLowerCase();
  if (hay === needle)
    return 1;
  if (hay.startsWith(needle))
    return 0.9;
  const at = hay.indexOf(needle);
  if (at > -1)
    return 0.8 - at / (hay.length * 100);
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++)
    if (hay[j] === needle[i])
      i++;
  return i === needle.length ? 0.4 : 0;
}, "score");
var step = /* @__PURE__ */ __name((count2, from, delta, loop = false) => {
  if (count2 <= 0)
    return -1;
  const next = from + delta;
  if (next < 0)
    return loop ? count2 - 1 : 0;
  if (next >= count2)
    return loop ? 0 : count2 - 1;
  return next;
}, "step");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/command.js
var TOUCH = 44;
var textOf = /* @__PURE__ */ __name((node) => typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).filter(Boolean).join(" ") : isValidElement4(node) ? textOf(node.props.children) : "", "textOf");
var CommandContext = /* @__PURE__ */ createContext18(null);
var GroupContext2 = /* @__PURE__ */ createContext18(void 0);
var useCommand = /* @__PURE__ */ __name(() => {
  const ctx = useContext20(CommandContext);
  if (!ctx)
    throw new Error("Command parts must be rendered inside <Command>");
  return ctx;
}, "useCommand");
var Command = /* @__PURE__ */ forwardRef21(/* @__PURE__ */ __name(function Command2({ value, defaultValue: defaultValue2, onValueChange, filter = score, shouldFilter = true, loop = false, label, vimBindings = true, disablePointerSelection = false, children, ...rest }, ref) {
  const entries = useRef41(/* @__PURE__ */ new Map()).current;
  const order = useRef41([]).current;
  const [version, touch2] = useReducer3((n) => n + 1, 0);
  const [search, setSearch] = useState27("");
  const [uncontrolled, setUncontrolled] = useState27(defaultValue2 ?? "");
  const selected = value ?? uncontrolled;
  const register = useCallback19((id, entry) => {
    entries.set(id, entry);
    if (!order.includes(id))
      order.push(id);
    touch2();
    return () => {
      entries.delete(id);
      const at = order.indexOf(id);
      if (at > -1)
        order.splice(at, 1);
      touch2();
    };
  }, [entries, order]);
  const visible = useMemo31(
    () => order.filter((id) => {
      const entry = entries.get(id)?.current;
      return !!entry && (!shouldFilter || filter(entry.value, search, entry.keywords) > 0);
    }),
    // `version` is the registry's revision — the registry itself is a mutable ref.
    [version, order, entries, shouldFilter, filter, search]
  );
  const shown = useMemo31(() => new Set(visible), [visible]);
  const shownGroups = useMemo31(() => new Set(visible.map((id) => entries.get(id)?.current.group).filter(Boolean)), [visible, entries]);
  const select = useCallback19((next) => {
    if (value === void 0)
      setUncontrolled(next);
    onValueChange?.(next);
  }, [value, onValueChange]);
  useEffect35(() => {
    if (!visible.length)
      return;
    if (selected && visible.some((id) => entries.get(id)?.current.value === selected))
      return;
    const first = entries.get(visible[0])?.current.value;
    if (first)
      select(first);
  }, [visible, selected, entries, select]);
  const move = useCallback19((delta) => {
    const reachable = visible.filter((id) => !entries.get(id)?.current.disabled);
    const at = reachable.findIndex((id) => entries.get(id)?.current.value === selected);
    const next = step(reachable.length, at, delta, loop);
    const target = next < 0 ? void 0 : entries.get(reachable[next])?.current.value;
    if (target)
      select(target);
  }, [visible, entries, selected, loop, select]);
  const run = useCallback19((id) => {
    const entry = entries.get(id)?.current;
    if (!entry || entry.disabled)
      return;
    select(entry.value);
    entry.onSelect?.(entry.value);
  }, [entries, select]);
  const onKey = useCallback19((e) => {
    const mod = vimBindings && (e.ctrlKey || e.metaKey);
    const down = e.key === "ArrowDown" || mod && (e.key === "n" || e.key === "j");
    const up = e.key === "ArrowUp" || mod && (e.key === "p" || e.key === "k");
    if (down || up) {
      e.preventDefault();
      move(down ? 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const id = visible.find((it) => entries.get(it)?.current.value === selected);
      if (id)
        run(id);
    }
  }, [vimBindings, move, visible, entries, selected, run]);
  const ctx = useMemo31(() => ({
    search,
    setSearch,
    selected,
    select,
    register,
    touch: touch2,
    run,
    onKey,
    shows: /* @__PURE__ */ __name((id) => shown.has(id), "shows"),
    showsGroup: /* @__PURE__ */ __name((group) => shownGroups.has(group), "showsGroup"),
    empty: visible.length === 0,
    disablePointerSelection
  }), [search, selected, select, register, run, onKey, shown, shownGroups, visible.length, disablePointerSelection]);
  return _jsx8(CommandContext.Provider, { value: ctx, children: _jsx8(YStack, { ref, "data-slot": "command", "aria-label": label, width: "100%", overflow: "hidden", rounded: "$4", bg: "$background", ...isWeb12 ? { onKeyDown: onKey } : null, ...rest, children }) });
}, "Command"));
var CommandDialog = /* @__PURE__ */ __name(({ title = "Command Palette", description = "Search for a command to run...", children, ...props }) => _jsx8(Dialog, { modal: true, ...props, children: _jsxs2(DialogPortal, { children: [_jsx8(DialogOverlay, { bg: "rgba(0,0,0,0.5)" }, "overlay"), _jsxs2(DialogContent, { p: 0, width: "100%", maxW: 640, overflow: "hidden", children: [_jsxs2(VisuallyHidden, { children: [_jsx8(DialogTitle, { children: title }), _jsx8(DialogDescription, { children: description })] }), _jsx8(Command, { children })] }, "content")] }) }), "CommandDialog");
var CommandInput = /* @__PURE__ */ forwardRef21(/* @__PURE__ */ __name(function CommandInput2({ value, onValueChange, placeholder, ...rest }, ref) {
  const { search, setSearch, onKey } = useCommand();
  useEffect35(() => {
    if (value !== void 0 && value !== search)
      setSearch(value);
  }, [value, search, setSearch]);
  return _jsxs2(XStack, { "data-slot": "command-input-wrapper", items: "center", gap: "$2", px: "$3", minH: TOUCH, borderBottomWidth: 1, borderColor: "$borderColor", children: [_jsx8(Search, { size: 16, opacity: 0.5 }), _jsx8(Input, { ref, "data-slot": "command-input", unstyled: true, flex: 1, height: TOUCH, borderWidth: 0, bg: "transparent", color: "$color", placeholder, value: value ?? search, onChangeText: /* @__PURE__ */ __name((next) => {
    setSearch(next);
    onValueChange?.(next);
  }, "onChangeText"), ...isWeb12 ? { onKeyDown: onKey } : null, ...rest })] });
}, "CommandInput"));
var CommandList = /* @__PURE__ */ forwardRef21(/* @__PURE__ */ __name(function CommandList2(props, ref) {
  return _jsx8(ScrollView2, { ref, "data-slot": "command-list", maxH: 300, ...props });
}, "CommandList"));
var CommandEmpty = /* @__PURE__ */ forwardRef21(/* @__PURE__ */ __name(function CommandEmpty2({ children, ...rest }, ref) {
  const { empty } = useCommand();
  if (!empty)
    return null;
  return _jsx8(YStack, { ref, "data-slot": "command-empty", py: "$4", items: "center", ...rest, children: typeof children === "string" ? _jsx8(SizableText2, { size: "$3", color: "$color11", children }) : children });
}, "CommandEmpty"));
var CommandGroup = /* @__PURE__ */ forwardRef21(/* @__PURE__ */ __name(function CommandGroup2({ heading, children, ...rest }, ref) {
  const id = useId19();
  const { showsGroup } = useCommand();
  return _jsx8(GroupContext2.Provider, { value: id, children: _jsxs2(YStack, {
    ref,
    "data-slot": "command-group",
    // Never unmounted: the children must stay registered to stay ordered.
    display: showsGroup(id) ? "flex" : "none",
    p: "$1",
    ...rest,
    children: [heading != null ? _jsx8(SizableText2, { "data-slot": "command-group-heading", size: "$1", color: "$color11", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.6, px: "$2", py: "$1.5", children: heading }) : null, children]
  }) });
}, "CommandGroup"));
var CommandSeparator = /* @__PURE__ */ forwardRef21(/* @__PURE__ */ __name(function CommandSeparator2({ alwaysRender, ...rest }, ref) {
  const { search } = useCommand();
  if (!alwaysRender && search)
    return null;
  return _jsx8(Separator, { ref, "data-slot": "command-separator", ...rest });
}, "CommandSeparator"));
var CommandItem = /* @__PURE__ */ forwardRef21(/* @__PURE__ */ __name(function CommandItem2({ value, keywords, disabled, onSelect, children, ...rest }, ref) {
  const id = useId19();
  const { register, touch: touch2, run, select, selected, shows, disablePointerSelection } = useCommand();
  const group = useContext20(GroupContext2);
  const self = value ?? textOf(children);
  const entry = useRef41({ value: self, keywords, disabled, group, onSelect });
  entry.current = { value: self, keywords, disabled, group, onSelect };
  useEffect35(() => register(id, entry), [id, register]);
  useEffect35(touch2, [touch2, self, disabled, keywords?.join("\0")]);
  const isSelected = !!self && selected === self;
  return _jsx8(ListItem2, { ref, "data-slot": "command-item", "data-selected": isSelected, "data-disabled": !!disabled, display: shows(id) ? "flex" : "none", disabled, minH: TOUCH, gap: "$2", rounded: "$2", bg: isSelected ? "$backgroundFocus" : "transparent", opacity: disabled ? 0.5 : 1, onPress: /* @__PURE__ */ __name(() => run(id), "onPress"), onPointerEnter: disabled || disablePointerSelection ? void 0 : () => select(self), ...rest, children });
}, "CommandItem"));
var CommandShortcut = /* @__PURE__ */ __name((props) => _jsx8(SizableText2, { "data-slot": "command-shortcut", ml: "auto", size: "$1", color: "$color11", letterSpacing: 1.5, ...props }), "CommandShortcut");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/dialog.js
import { jsx as _jsx10, jsxs as _jsxs3 } from "react/jsx-runtime";

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/product/menu/portal-theme.js
import { jsx as _jsx9 } from "react/jsx-runtime";
function PortalTheme({ name, children }) {
  return _jsx9(Theme3, { name, children });
}
__name(PortalTheme, "PortalTheme");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/dialog.js
var PAD2 = 24;
var Dialog3 = /* @__PURE__ */ __name((p) => _jsx10(Dialog, { modal: true, ...p }), "Dialog");
var DialogTrigger3 = Dialog.Trigger;
var DialogPortal2 = Dialog.Portal;
var DialogClose2 = Dialog.Close;
var DialogOverlay3 = /* @__PURE__ */ __name((props) => _jsx10(Dialog.Overlay, { ...slot("dialog-overlay"), bg: "rgba(0,0,0,0.5)", opacity: 0.5, ...props }), "DialogOverlay");
var DialogContent3 = /* @__PURE__ */ __name(({ showCloseButton = true, children, ...props }) => {
  const themeName = useThemeName5();
  return _jsx10(Dialog.Portal, { children: _jsxs3(PortalTheme, { name: themeName, children: [_jsx10(DialogOverlay3, {}), _jsxs3(Dialog.Content, { ...slot("dialog-content"), bg: "$background", borderWidth: 1, borderColor: "$borderColor", rounded: "$5", p: PAD2, gap: "$4", width: "100%", maxW: 512, ...props, children: [children, showCloseButton ? _jsx10(Dialog.Close, { asChild: true, children: _jsx10(XStack, { ...slot("dialog-close"), position: "absolute", t: 16, r: 16, cursor: "pointer", opacity: 0.7, hoverStyle: { opacity: 1 }, ...touch(16), "aria-label": "Close", children: _jsx10(X, { size: 16 }) }) }) : null] })] }) });
}, "DialogContent");
var DialogHeader = /* @__PURE__ */ __name((props) => _jsx10(YStack, { ...slot("dialog-header"), gap: "$2", ...props }), "DialogHeader");
var DialogFooter = /* @__PURE__ */ __name((props) => _jsx10(XStack, { ...slot("dialog-footer"), gap: "$2", justify: "flex-end", items: "center", ...props }), "DialogFooter");
var DialogTitle3 = /* @__PURE__ */ __name((props) => _jsx10(Dialog.Title, { ...slot("dialog-title"), size: "$5", fontWeight: "600", ...props }), "DialogTitle");
var DialogDescription3 = /* @__PURE__ */ __name((props) => _jsx10(Dialog.Description, { ...slot("dialog-description"), size: "$2", color: "$color11", ...props }), "DialogDescription");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/dropdown-menu.js
import { jsx as _jsx11, jsxs as _jsxs4 } from "react/jsx-runtime";
import * as React76 from "react";
var ROW_H = 32;
var TAP_MIN = 44;
var ROW_PX = 8;
var MIN_W = 200;
var INSET_PL = 32;
var INDICATOR_SLOT = 14;
var ICON = 16;
var panel = {
  bg: "$color2",
  borderColor: "$borderColor",
  borderWidth: 1,
  rounded: "$4",
  p: 4,
  minW: MIN_W,
  overflow: "hidden",
  shadowColor: "rgba(0,0,0,0.45)",
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 }
};
var row = {
  items: "center",
  gap: ROW_PX,
  px: ROW_PX,
  minH: ROW_H,
  rounded: "$3",
  select: "none",
  cursor: "pointer",
  ...touch(ROW_H, TAP_MIN, "y"),
  hoverStyle: { bg: "$color5" },
  focusStyle: { bg: "$color5" },
  pressStyle: { bg: "$color6" }
};
var Indicator = /* @__PURE__ */ __name(({ children }) => _jsx11(XStack, { position: "absolute", l: ROW_PX, width: INDICATOR_SLOT, height: INDICATOR_SLOT, items: "center", justify: "center", pointerEvents: "none", children: _jsx11(Menu.ItemIndicator, { children }) }), "Indicator");
var OffsetContext = /* @__PURE__ */ React76.createContext(null);
var DEFAULT_OFFSET = 4;
function DropdownMenu({ offset: offset4 = DEFAULT_OFFSET, trigger, items, minWidth = MIN_W, maxHeight, children, ...props }) {
  const [current, setOffset] = React76.useState(offset4);
  React76.useEffect(() => setOffset(offset4), [offset4]);
  return _jsx11(OffsetContext.Provider, { value: setOffset, children: _jsxs4(Menu, { offset: current, ...props, children: [trigger ? _jsx11(DropdownMenuTrigger, { asChild: true, children: trigger }) : null, items ? _jsx11(DropdownMenuContent, { minW: minWidth, maxH: maxHeight, children: items.map(renderSpec) }) : null, children] }) });
}
__name(DropdownMenu, "DropdownMenu");
var renderSpec = /* @__PURE__ */ __name((spec, i) => {
  if (spec.type === "separator")
    return _jsx11(DropdownMenuSeparator, {}, spec.key ?? `sep-${i}`);
  if (spec.type === "label")
    return _jsx11(DropdownMenuLabel, { children: spec.label }, spec.key ?? `label-${i}`);
  return _jsxs4(DropdownMenuItem, { disabled: spec.disabled, variant: spec.destructive ? "destructive" : "default", onSelect: spec.onSelect, children: [spec.icon ? _jsx11(XStack, { width: ICON, height: ICON, items: "center", justify: "center", shrink: 0, children: spec.icon }) : null, _jsxs4(YStack, { flex: 1, minW: 0, children: [_jsx11(Text7, { fontSize: "$2", color: "$color12", numberOfLines: 1, children: spec.label }), spec.description ? _jsx11(Text7, { fontSize: "$1", color: "$color11", numberOfLines: 1, children: spec.description }) : null] }), spec.shortcut ? _jsx11(DropdownMenuShortcut, { children: spec.shortcut }) : null, spec.selected ? _jsx11(Check, { size: ICON - 2, ml: "auto" }) : null, spec.hasSubmenu ? _jsx11(ChevronRight, { size: ICON - 2, ml: "auto", opacity: 0.6 }) : null] }, spec.key);
}, "renderSpec");
var DropdownMenuTrigger = Menu.Trigger;
var DropdownMenuGroup = Menu.Group;
var DropdownMenuPortal = Menu.Portal;
var DropdownMenuSub = Menu.Sub;
var DropdownMenuRadioGroup = Menu.RadioGroup;
var DropdownMenuContent = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuContent2({ sideOffset = DEFAULT_OFFSET, children, ...props }, ref) {
  const themeName = useThemeName5();
  const setOffset = React76.useContext(OffsetContext);
  React76.useEffect(() => setOffset?.(sideOffset), [setOffset, sideOffset]);
  return _jsx11(Menu.Portal, { children: _jsx11(PortalTheme, { name: themeName, children: _jsx11(Menu.Content, { ref, "data-slot": "dropdown-menu-content", ...panel, ...props, children }) }) });
}, "DropdownMenuContent"));
var DropdownMenuSubContent = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuSubContent2(props, ref) {
  return _jsx11(Menu.SubContent, { ref, "data-slot": "dropdown-menu-sub-content", ...panel, ...props });
}, "DropdownMenuSubContent"));
var DropdownMenuItem = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuItem2({ inset, variant = "default", disabled, ...props }, ref) {
  return _jsx11(Menu.Item, { ref, "data-slot": "dropdown-menu-item", "data-inset": inset, "data-variant": variant, disabled, ...row, pl: inset ? INSET_PL : ROW_PX, theme: variant === "destructive" ? "red" : void 0, opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer", ...props });
}, "DropdownMenuItem"));
var DropdownMenuCheckboxItem = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuCheckboxItem2({ children, checked, ...props }, ref) {
  return _jsxs4(Menu.CheckboxItem, { ref, "data-slot": "dropdown-menu-checkbox-item", checked, ...row, pl: INSET_PL, ...props, children: [_jsx11(Indicator, { children: _jsx11(Check, { size: ICON }) }), children] });
}, "DropdownMenuCheckboxItem"));
var DropdownMenuRadioItem = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuRadioItem2({ children, ...props }, ref) {
  return _jsxs4(Menu.RadioItem, { ref, "data-slot": "dropdown-menu-radio-item", ...row, pl: INSET_PL, ...props, children: [_jsx11(Indicator, { children: _jsx11(Circle, { size: 8, fill: "currentColor" }) }), children] });
}, "DropdownMenuRadioItem"));
var DropdownMenuSubTrigger = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuSubTrigger2({ inset, children, ...props }, ref) {
  return _jsxs4(Menu.SubTrigger, { ref, "data-slot": "dropdown-menu-sub-trigger", "data-inset": inset, ...row, pl: inset ? INSET_PL : ROW_PX, ...props, children: [children, _jsx11(ChevronRight, { size: ICON, ml: "auto", opacity: 0.6 })] });
}, "DropdownMenuSubTrigger"));
var DropdownMenuLabel = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuLabel2({ inset, ...props }, ref) {
  return _jsx11(Menu.Label, { ref, "data-slot": "dropdown-menu-label", "data-inset": inset, px: ROW_PX, py: 4, pl: inset ? INSET_PL : ROW_PX, fontSize: "$2", fontWeight: "500", color: "$color12", select: "none", ...props });
}, "DropdownMenuLabel"));
var DropdownMenuSeparator = /* @__PURE__ */ React76.forwardRef(/* @__PURE__ */ __name(function DropdownMenuSeparator2(props, ref) {
  return _jsx11(Menu.Separator, { ref, "data-slot": "dropdown-menu-separator", height: 1, bg: "$borderColor", mx: 4, my: 4, ...props });
}, "DropdownMenuSeparator"));
function DropdownMenuShortcut(props) {
  return _jsx11(Text7, { "data-slot": "dropdown-menu-shortcut", ml: "auto", fontSize: "$1", letterSpacing: 1, color: "$color11", ...props });
}
__name(DropdownMenuShortcut, "DropdownMenuShortcut");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/input.js
import { jsx as _jsx12, jsxs as _jsxs5 } from "react/jsx-runtime";
import { forwardRef as forwardRef23, useState as useState29 } from "react";
var HEIGHT3 = 36;
var GUTTER = 12;
var WELL = 36;
var well = /* @__PURE__ */ __name((side) => ({
  position: "absolute",
  [side]: GUTTER,
  t: 0,
  b: 0,
  items: "center",
  justify: "center"
}), "well");
var Input2 = /* @__PURE__ */ forwardRef23(/* @__PURE__ */ __name(function Input3({ startAdornment, endAdornment, hidePasswordToggle, type, secureTextEntry, ...props }, ref) {
  const [revealed, setRevealed] = useState29(false);
  const isPassword = type === "password" || secureTextEntry === true;
  const toggle = isPassword && !hidePasswordToggle;
  const field = _jsx12(Input, { ref, ...slot("input"), secureTextEntry: isPassword && !revealed, height: HEIGHT3, width: "100%", minW: 0, rounded: "$3", bg: "transparent", borderWidth: 1, borderColor: "$borderColor", placeholderTextColor: "$color10", fontSize: "$3", pl: startAdornment ? WELL : GUTTER, pr: endAdornment || toggle ? WELL : GUTTER, ...props });
  if (!startAdornment && !endAdornment && !toggle)
    return field;
  return _jsxs5(XStack, { position: "relative", width: "100%", items: "center", children: [startAdornment ? _jsx12(XStack, { ...well("l"), pointerEvents: "none", opacity: 0.6, children: startAdornment }) : null, field, toggle ? _jsx12(XStack, { ...well("r"), cursor: "pointer", ...touch(20), onPress: /* @__PURE__ */ __name(() => setRevealed((v) => !v), "onPress"), "aria-label": revealed ? "Hide password" : "Show password", children: revealed ? _jsx12(EyeOff, { size: 16 }) : _jsx12(Eye, { size: 16 }) }) : endAdornment ? _jsx12(XStack, { ...well("r"), opacity: 0.6, children: endAdornment }) : null] });
}, "Input"));

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/label.js
import { jsx as _jsx13 } from "react/jsx-runtime";
var Label3 = /* @__PURE__ */ __name((props) => _jsx13(Label, { ...slot("label"), fontSize: "$2", fontWeight: "500", color: "$color12", select: "none", cursor: "pointer", ...props }), "Label");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/popover.js
import { jsx as _jsx14 } from "react/jsx-runtime";
import { createContext as createContext20, useContext as useContext22, useEffect as useEffect37, useState as useState30 } from "react";
var DEFAULT_OFFSET2 = 4;
var OffsetContext2 = /* @__PURE__ */ createContext20(null);
function Popover3({ offset: offset4 = DEFAULT_OFFSET2, ...props }) {
  const [current, setOffset] = useState30(offset4);
  useEffect37(() => setOffset(offset4), [offset4]);
  return _jsx14(OffsetContext2.Provider, { value: setOffset, children: _jsx14(Popover, { offset: current, ...props }) });
}
__name(Popover3, "Popover");
var PopoverTrigger3 = Popover.Trigger;
var PopoverAnchor3 = Popover.Anchor;
var PopoverClose3 = Popover.Close;
var PopoverContent3 = /* @__PURE__ */ __name(({ sideOffset = DEFAULT_OFFSET2, align: _align, ...props }) => {
  const themeName = useThemeName5();
  const setOffset = useContext22(OffsetContext2);
  useEffect37(() => setOffset?.(sideOffset), [setOffset, sideOffset]);
  return _jsx14(PortalTheme, { name: themeName, children: _jsx14(Popover.Content, { ...slot("popover-content"), bg: "$color2", borderWidth: 1, borderColor: "$borderColor", rounded: "$4", p: "$4", width: 288, ...props }) });
}, "PopoverContent");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/progress.js
import { jsx as _jsx15 } from "react/jsx-runtime";
var Progress3 = /* @__PURE__ */ __name(({ value, indicatorClassName, ...props }) => _jsx15(Progress, { ...slot("progress"), value: value ?? 0, height: 8, width: "100%", bg: "$color4", rounded: "$10", overflow: "hidden", ...props, children: _jsx15(Progress.Indicator, { ...slot("progress-indicator"), bg: "$color12", className: indicatorClassName }) }), "Progress");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/resizable.js
import { jsx as _jsx16, jsxs as _jsxs6 } from "react/jsx-runtime";
import { Children as Children7, createContext as createContext21, isValidElement as isValidElement5, useCallback as useCallback20, useContext as useContext23, useEffect as useEffect38, useMemo as useMemo32, useRef as useRef42, useState as useState31 } from "react";

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/resizable.logic.js
var clamp3 = /* @__PURE__ */ __name((n, lo, hi) => Math.max(lo, Math.min(n, hi)), "clamp");
var floorOf = /* @__PURE__ */ __name((s) => s.collapsible ? s.collapsedSize ?? 0 : s.minSize ?? 0, "floorOf");
var ceilOf = /* @__PURE__ */ __name((s) => s.maxSize ?? 100, "ceilOf");
function defaultLayout(specs) {
  if (specs.length === 0)
    return [];
  const claimed = specs.reduce((n, s) => n + (s.defaultSize ?? 0), 0);
  const free = specs.filter((s) => s.defaultSize == null).length;
  const each = free > 0 ? Math.max(0, 100 - claimed) / free : 0;
  const raw = specs.map((s) => s.defaultSize ?? each);
  const sum = raw.reduce((a, b) => a + b, 0);
  return sum > 0 ? raw.map((v) => v / sum * 100) : specs.map(() => 100 / specs.length);
}
__name(defaultLayout, "defaultLayout");
function resizeAt(sizes, specs, i, delta) {
  const a = sizes[i];
  const b = sizes[i + 1];
  const sa = specs[i];
  const sb = specs[i + 1];
  if (a == null || b == null || !sa || !sb)
    return sizes;
  const pair = a + b;
  const lo = Math.max(floorOf(sa), pair - ceilOf(sb));
  const hi = Math.min(ceilOf(sa), pair - floorOf(sb));
  if (lo > hi)
    return sizes;
  const next = clamp3(a + delta, lo, hi);
  if (next === a)
    return sizes;
  const out = sizes.slice();
  out[i] = next;
  out[i + 1] = pair - next;
  return out;
}
__name(resizeAt, "resizeAt");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/resizable.js
var webStorage = /* @__PURE__ */ __name(() => globalThis.localStorage, "webStorage");
var storeKey = /* @__PURE__ */ __name((id) => `hanzo.panels.${id}`, "storeKey");
function loadStore(id) {
  if (!id)
    return {};
  try {
    return JSON.parse(webStorage()?.getItem(storeKey(id)) ?? "{}");
  } catch {
    return {};
  }
}
__name(loadStore, "loadStore");
function saveStore(id, store) {
  if (!id)
    return;
  try {
    webStorage()?.setItem(storeKey(id), JSON.stringify(store));
  } catch {
  }
}
__name(saveStore, "saveStore");
var GroupContext3 = /* @__PURE__ */ createContext21(null);
var SlotContext = /* @__PURE__ */ createContext21(-1);
function ResizablePanelGroup({ direction, autoSaveId, onLayout, children, ...rest }) {
  const axis = direction === "horizontal";
  const extent = useRef42(0);
  const [store, setStore] = useState31({});
  const slots = useMemo32(() => Children7.toArray(children).filter(isValidElement5), [children]);
  const specs = useMemo32(() => slots.filter((el) => el.type === ResizablePanel).map((el, i) => {
    const p = el.props;
    return {
      id: p.id ?? String(p.order ?? i),
      defaultSize: p.defaultSize,
      minSize: p.minSize,
      maxSize: p.maxSize,
      collapsible: p.collapsible,
      collapsedSize: p.collapsedSize,
      onResize: p.onResize
    };
  }), [slots]);
  const key = specs.map((s) => s.id).join(",");
  const sizes = store[key] ?? defaultLayout(specs);
  useEffect38(() => {
    setStore(loadStore(autoSaveId));
  }, [autoSaveId]);
  const setLayout = useCallback20((next) => {
    const merged = { ...store, [key]: next };
    setStore(merged);
    saveStore(autoSaveId, merged);
    onLayout?.(next);
  }, [autoSaveId, key, onLayout, store]);
  const prev = useRef42([]);
  useEffect38(() => {
    specs.forEach((s, i) => {
      if (sizes[i] != null && sizes[i] !== prev.current[i])
        s.onResize?.(sizes[i]);
    });
    prev.current = sizes;
  }, [specs, sizes]);
  const value = useMemo32(() => ({ direction, specs, sizes, extent, setLayout }), [direction, specs, sizes, setLayout]);
  let panel2 = -1;
  return _jsx16(GroupContext3.Provider, { value, children: _jsx16(XStack, { width: "100%", height: "100%", flexDirection: axis ? "row" : "column", overflow: "hidden", "data-panel-group-direction": direction, onLayout: /* @__PURE__ */ __name((e) => {
    extent.current = axis ? e.nativeEvent.layout.width : e.nativeEvent.layout.height;
  }, "onLayout"), ...rest, children: slots.map((el, i) => {
    if (el.type === ResizablePanel)
      panel2++;
    return _jsx16(SlotContext.Provider, { value: panel2, children: el }, el.key ?? i);
  }) }) });
}
__name(ResizablePanelGroup, "ResizablePanelGroup");
function ResizablePanel({ id, order, defaultSize, minSize, maxSize, collapsible, collapsedSize, onResize, children, ...rest }) {
  const group = useContext23(GroupContext3);
  const index2 = useContext23(SlotContext);
  const size4 = group?.sizes[index2];
  return _jsx16(XStack, { flexDirection: "column", overflow: "hidden", flexBasis: 0, grow: size4 ?? 1, shrink: 1, ...rest, children });
}
__name(ResizablePanel, "ResizablePanel");
var THICKNESS = 4;
var KEY_STEP = 5;
var KEY_STEP_FINE = 1;
function ResizableHandle({ withHandle, disabled, ...rest }) {
  const group = useContext23(GroupContext3);
  const boundary = useContext23(SlotContext);
  const [state4, setState] = useState31("idle");
  const start = useRef42(null);
  const axis = group?.direction !== "vertical";
  const off = disabled || !group || boundary < 0 || boundary + 1 >= group.sizes.length;
  const posOf = useCallback20((e) => dragPos(e, axis), [axis]);
  const begin = useCallback20((e) => {
    if (off || !group)
      return;
    start.current = { pos: posOf(e), sizes: group.sizes };
    setState("drag");
  }, [group, off, posOf]);
  const move = useCallback20((e) => {
    const from = start.current;
    if (!from || !group)
      return;
    const px = group.extent.current;
    if (px <= 0)
      return;
    group.setLayout(resizeAt(from.sizes, group.specs, boundary, (posOf(e) - from.pos) / px * 100));
  }, [boundary, group, posOf]);
  const end = useCallback20(() => {
    start.current = null;
    setState("idle");
  }, []);
  const nudge = useCallback20((e) => {
    if (off || !group)
      return;
    const dir = axis ? e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0 : e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (dir === 0)
      return;
    e.preventDefault();
    group.setLayout(resizeAt(group.sizes, group.specs, boundary, dir * (e.shiftKey ? KEY_STEP_FINE : KEY_STEP)));
  }, [axis, boundary, group, off]);
  const hover = useCallback20((on) => setState((s) => s === "drag" ? s : on ? "hover" : "idle"), []);
  const gesture = drag({ begin, move, end, enabled: !off });
  return _jsxs6(XStack, { position: "relative", flexDirection: axis ? "column" : "row", items: "center", justify: "center", shrink: 0, width: axis ? THICKNESS : "100%", height: axis ? "100%" : THICKNESS, ...touch(THICKNESS, 44, axis ? "x" : "y"), cursor: off ? "default" : axis ? "col-resize" : "row-resize", tabIndex: off ? -1 : 0, role: "separator", "aria-orientation": axis ? "vertical" : "horizontal", "data-panel-group-direction": group?.direction, "data-resize-handle-state": state4, ...gesture, onKeyDown: nudge, onMouseEnter: /* @__PURE__ */ __name(() => hover(true), "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name(() => hover(false), "onMouseLeave"), ...rest, children: [_jsx16(Separator, { vertical: axis, borderColor: state4 === "idle" ? "$borderColor" : "$color8" }), withHandle && _jsx16(XStack, { position: "absolute", items: "center", justify: "center", width: 12, height: 20, rounded: "$2", bg: "$color5", borderWidth: 1, borderColor: "$borderColor", rotate: axis ? "0deg" : "90deg", children: _jsx16(GripVertical, { size: 10 }) })] });
}
__name(ResizableHandle, "ResizableHandle");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/scroll-area.js
import { jsx as _jsx17, jsxs as _jsxs7 } from "react/jsx-runtime";
import { createContext as createContext22, forwardRef as forwardRef24, useCallback as useCallback21, useContext as useContext24, useEffect as useEffect39, useRef as useRef43, useState as useState32 } from "react";
var BAR = 10;
var TOUCH2 = 44;
var ZERO = { offset: 0, viewport: 0, content: 0 };
var Ctx = /* @__PURE__ */ createContext22(null);
var clamp4 = /* @__PURE__ */ __name((n, max2) => n < 0 ? 0 : n > max2 ? max2 : n, "clamp");
var ScrollBar = /* @__PURE__ */ forwardRef24(/* @__PURE__ */ __name(function ScrollBar2({ orientation = "vertical", ...props }, ref) {
  const ctx = useContext24(Ctx);
  const [len, setLen] = useState32(0);
  const from = useRef43(null);
  if (!ctx || ctx.axis !== orientation)
    return null;
  const vertical = orientation === "vertical";
  const { content, viewport, offset: offset4 } = ctx.track;
  const scrollable = content - viewport;
  const overflow = scrollable > 1;
  const shown = ctx.type === "always" ? true : !overflow ? false : ctx.type === "auto" ? true : ctx.active;
  const thumb = Math.max(TOUCH2, len * (viewport / Math.max(content, 1)));
  const range = Math.max(len - thumb, 0);
  const at = overflow ? range * clamp4(offset4 / scrollable, 1) : 0;
  const gesture = drag({
    begin: /* @__PURE__ */ __name((e) => {
      from.current = dragPos(e, !vertical);
    }, "begin"),
    move: /* @__PURE__ */ __name((e) => {
      const start = from.current;
      if (start === null || range === 0)
        return;
      const now = dragPos(e, !vertical);
      from.current = now;
      ctx.scrollBy((now - start) * scrollable / range);
    }, "move"),
    end: /* @__PURE__ */ __name(() => {
      from.current = null;
    }, "end")
  });
  return _jsx17(XStack, { ref, ...slot("scroll-area-scrollbar"), position: "absolute", ...vertical ? {
    t: 0,
    b: 0,
    ...ctx.rtl ? { l: 0 } : { r: 0 },
    width: BAR,
    flexDirection: "column"
  } : { l: 0, r: 0, b: 0, height: BAR, flexDirection: "row" }, p: 1, opacity: shown ? 1 : 0, pointerEvents: shown ? "auto" : "none", onLayout: /* @__PURE__ */ __name((e) => setLen(vertical ? e.nativeEvent.layout.height : e.nativeEvent.layout.width), "onLayout"), ...props, children: _jsx17(YStack, { ...slot("scroll-area-thumb"), bg: "$borderColor", rounded: BAR, ...touch(BAR, TOUCH2, vertical ? "x" : "y"), ...vertical ? { width: "100%", height: thumb, y: at } : { height: "100%", width: thumb, x: at }, ...gesture }) });
}, "ScrollBar"));
var ScrollArea = /* @__PURE__ */ forwardRef24(/* @__PURE__ */ __name(function ScrollArea2({ type = "hover", scrollHideDelay = 600, dir, horizontal = false, children, ...props }, ref) {
  const viewport = useRef43(null);
  const live = useRef43(ZERO);
  const [track, setTrack] = useState32(ZERO);
  const [active, setActive] = useState32(false);
  const timer = useRef43(null);
  const axis = horizontal ? "horizontal" : "vertical";
  const put = useCallback21((patch) => {
    const next = { ...live.current, ...patch };
    live.current = next;
    setTrack(next);
  }, []);
  const clear = /* @__PURE__ */ __name(() => {
    if (timer.current)
      clearTimeout(timer.current);
    timer.current = null;
  }, "clear");
  const hold = /* @__PURE__ */ __name(() => {
    clear();
    setActive(true);
  }, "hold");
  const wake = useCallback21(() => {
    setActive(true);
    clear();
    timer.current = setTimeout(() => setActive(false), scrollHideDelay);
  }, [scrollHideDelay]);
  useEffect39(() => clear, []);
  const scrollBy = useCallback21((delta) => {
    const t = live.current;
    const next = clamp4(t.offset + delta, Math.max(t.content - t.viewport, 0));
    put({ offset: next });
    viewport.current?.scrollTo(horizontal ? { x: next, y: 0, animated: false } : { x: 0, y: next, animated: false });
  }, [horizontal, put]);
  return _jsxs7(YStack, { ref, ...slot("scroll-area"), position: "relative", overflow: "hidden", onMouseEnter: type === "hover" ? hold : void 0, onMouseLeave: type === "hover" ? wake : void 0, ...props, children: [_jsx17(ScrollView2, { ref: viewport, ...slot("scroll-area-viewport"), flex: 1, width: "100%", height: "100%", horizontal, showsVerticalScrollIndicator: false, showsHorizontalScrollIndicator: false, scrollEventThrottle: 16, onLayout: /* @__PURE__ */ __name((e) => put({
    viewport: horizontal ? e.nativeEvent.layout.width : e.nativeEvent.layout.height
  }), "onLayout"), onContentSizeChange: /* @__PURE__ */ __name((w2, h) => put({ content: horizontal ? w2 : h }), "onContentSizeChange"), onScroll: /* @__PURE__ */ __name((e) => {
    const { contentOffset } = e.nativeEvent;
    put({ offset: horizontal ? contentOffset.x : contentOffset.y });
    wake();
  }, "onScroll"), children }), _jsx17(Ctx.Provider, { value: { axis, track, type, active, rtl: dir === "rtl", scrollBy }, children: _jsx17(ScrollBar, { orientation: axis }) })] });
}, "ScrollArea"));

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/select.js
import { jsx as _jsx18, jsxs as _jsxs8 } from "react/jsx-runtime";
import { Children as Children8, cloneElement as cloneElement2, isValidElement as isValidElement6 } from "react";
var ROW_H2 = 32;
var TRIGGER_H = 36;
var Select3 = Select;
var SelectGroup2 = Select.Group;
var SelectValue3 = Select.Value;
var SelectTrigger3 = /* @__PURE__ */ __name(({ children, ...props }) => _jsxs8(Select.Trigger, { ...slot("select-trigger"), unstyled: true, items: "center", justify: "space-between", gap: "$2", height: TRIGGER_H, px: "$3", rounded: "$3", borderWidth: 1, borderColor: "$borderColor", bg: "transparent", cursor: "pointer", ...touch(TRIGGER_H, 44, "y"), ...props, children: [ink(children, void 0, { size: "$2" }), _jsx18(Select.Icon, { children: _jsx18(ChevronDown, { size: 16, opacity: 0.5 }) })] }), "SelectTrigger");
var SelectItem3 = /* @__PURE__ */ __name(({ children, ...props }) => _jsxs8(Select.Item, { ...slot("select-item"), unstyled: true, index: props.index ?? 0, items: "center", gap: "$2", minH: ROW_H2, pl: "$2", pr: "$7", rounded: "$2", cursor: "pointer", ...touch(ROW_H2, 44, "y"), hoverStyle: { bg: "$color5" }, focusStyle: { bg: "$color5" }, ...props, children: [_jsx18(Select.ItemText, { children }), _jsx18(XStack, { position: "absolute", r: "$2", items: "center", justify: "center", pointerEvents: "none", children: _jsx18(Select.ItemIndicator, { children: _jsx18(Check, { size: 16 }) }) })] }), "SelectItem");
var stampIndices = /* @__PURE__ */ __name((children, next) => Children8.map(children, (child) => {
  if (!isValidElement6(child))
    return child;
  if (child.type === SelectItem3)
    return cloneElement2(child, { index: next() });
  const kids = child.props.children;
  return kids === void 0 ? child : cloneElement2(child, void 0, stampIndices(kids, next));
}), "stampIndices");
var SelectScrollUpButton2 = /* @__PURE__ */ __name((props) => _jsx18(Select.ScrollUpButton, { ...slot("select-scroll-up-button"), items: "center", justify: "center", py: "$1", ...props, children: _jsx18(ChevronUp, { size: 16 }) }), "SelectScrollUpButton");
var SelectScrollDownButton2 = /* @__PURE__ */ __name((props) => _jsx18(Select.ScrollDownButton, { ...slot("select-scroll-down-button"), items: "center", justify: "center", py: "$1", ...props, children: _jsx18(ChevronDown, { size: 16 }) }), "SelectScrollDownButton");
var SelectContent2 = /* @__PURE__ */ __name(({ children, ...props }) => {
  let n = 0;
  return _jsxs8(Select.Content, { ...slot("select-content"), ...props, children: [_jsx18(SelectScrollUpButton2, {}), _jsx18(Select.Viewport, { minW: 128, p: "$1", bg: "$color2", borderWidth: 1, borderColor: "$borderColor", rounded: "$4", children: stampIndices(children, () => n++) }), _jsx18(SelectScrollDownButton2, {})] });
}, "SelectContent");
var SelectLabel2 = /* @__PURE__ */ __name((props) => _jsx18(Select.Label, { ...slot("select-label"), px: "$2", py: "$1.5", fontSize: "$1", color: "$color11", ...props }), "SelectLabel");
var SelectSeparator2 = /* @__PURE__ */ __name((props) => _jsx18(SelectSeparator, { ...slot("select-separator"), my: "$1", borderColor: "$borderColor", ...props }), "SelectSeparator");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/separator.js
import { jsx as _jsx19 } from "react/jsx-runtime";
var Separator2 = /* @__PURE__ */ __name(({ orientation = "horizontal", decorative: _decorative, ...props }) => _jsx19(Separator, { ...slot("separator"), "data-orientation": orientation, vertical: orientation === "vertical", borderColor: "$borderColor", ...props }), "Separator");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/slider.js
import { jsx as _jsx20, jsxs as _jsxs9 } from "react/jsx-runtime";
var TRACK = 6;
var THUMB = 16;
var Slider2 = /* @__PURE__ */ __name((props) => _jsxs9(Slider, { ...slot("slider"), width: "100%", ...props, children: [_jsx20(Slider.Track, { ...slot("slider-track"), height: TRACK, bg: "$color4", rounded: "$10", children: _jsx20(Slider.TrackActive, { ...slot("slider-range"), bg: "$color12" }) }), _jsx20(Slider.Thumb, { ...slot("slider-thumb"), index: 0, circular: true, size: THUMB, bg: "$background", borderWidth: 1, borderColor: "$color12", ...touch(THUMB) })] }), "Slider");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/switch.js
import { jsx as _jsx21 } from "react/jsx-runtime";
var TRACK_H = 20;
var THUMB2 = 16;
var Switch2 = /* @__PURE__ */ __name((props) => _jsx21(Switch, { ...slot("switch"), width: 36, height: TRACK_H, p: 2, shrink: 0, ...touch(TRACK_H, 44, "y"), ...props, children: _jsx21(Switch.Thumb, { ...slot("switch-thumb"), width: THUMB2, height: THUMB2 }) }), "Switch");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/tabs.js
import { jsx as _jsx22 } from "react/jsx-runtime";
var ROW_H3 = 36;
var Tabs2 = /* @__PURE__ */ __name((p) => _jsx22(Tabs, { ...slot("tabs"), flexDirection: "column", gap: "$2", ...p }), "Tabs");
var TabsList = /* @__PURE__ */ __name((p) => _jsx22(Tabs.List, { ...slot("tabs-list"), items: "center", justify: "center", self: "flex-start", height: ROW_H3, p: 3, gap: 2, bg: "$color3", rounded: "$4", ...p }), "TabsList");
var TabsTrigger = /* @__PURE__ */ __name(({ children, ...p }) => _jsx22(Tabs.Tab, { ...slot("tabs-trigger"), unstyled: true, items: "center", justify: "center", height: "100%", px: "$3", gap: "$1.5", rounded: "$3", cursor: "pointer", ...touch(ROW_H3, 44, "y"), hoverStyle: { bg: "$color4" }, focusStyle: { bg: "$color4" }, ...p, children: ink(children, void 0, { size: "$2", fontWeight: "500" }) }), "TabsTrigger");
var TabsContent = /* @__PURE__ */ __name((p) => _jsx22(Tabs.Content, { ...slot("tabs-content"), flex: 1, ...p }), "TabsContent");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/textarea.js
import { jsx as _jsx23 } from "react/jsx-runtime";
import * as React77 from "react";
var MIN_ROWS = 3;
var rowsOf = /* @__PURE__ */ __name((v) => typeof v === "string" ? v.split("\n").length : 0, "rowsOf");
var Textarea = /* @__PURE__ */ React77.forwardRef(/* @__PURE__ */ __name(function Textarea2({ rows, value, defaultValue: defaultValue2, ...props }, ref) {
  const [typed, setTyped] = React77.useState(() => rowsOf(defaultValue2));
  const uncontrolled = value === void 0;
  const invalid = props["aria-invalid"];
  return _jsx23(TextArea, { ref, "data-slot": "textarea", rows: Math.max(rows ?? MIN_ROWS, uncontrolled ? typed : rowsOf(value)), value, defaultValue: defaultValue2, onChangeText: uncontrolled ? (t) => setTyped(rowsOf(t)) : void 0, width: "100%", minH: 64, rounded: "$4", bg: "transparent", borderWidth: 1, borderColor: invalid && invalid !== "false" ? "$red7" : "$borderColor", placeholderTextColor: "$color10", fontSize: "$3", opacity: props.disabled ? 0.5 : 1, ...props });
}, "Textarea"));

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/toaster.js
import { jsx as _jsx24 } from "react/jsx-runtime";

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/ToastComposable.mjs
import { createStyledContext as createStyledContext21, styled as styled38, Theme as Theme4, useConfiguration as useConfiguration4, useEvent as useEvent12, useThemeName as useThemeName6, View as View19 } from "@hanzogui/core";
import * as React81 from "react";

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/ToastState.mjs
var toastsCounter = 1;
var Observer = class {
  static {
    __name(this, "Observer");
  }
  subscribers = [];
  toasts = [];
  dismissedToasts = /* @__PURE__ */ new Set();
  /**
   * Subscribe to toast state changes.
   * Returns an unsubscribe function.
   */
  subscribe = /* @__PURE__ */ __name((subscriber) => {
    this.subscribers.push(subscriber);
    return () => {
      const index2 = this.subscribers.indexOf(subscriber);
      if (index2 > -1) {
        this.subscribers.splice(index2, 1);
      }
    };
  }, "subscribe");
  /**
   * Publish a toast to all subscribers
   */
  publish = /* @__PURE__ */ __name((data) => {
    this.subscribers.forEach((subscriber) => subscriber(data));
  }, "publish");
  /**
   * Add a new toast to the internal array and publish to subscribers
   */
  addToast = /* @__PURE__ */ __name((data) => {
    this.publish(data);
    this.toasts = [...this.toasts, data];
  }, "addToast");
  /**
   * Create or update a toast
   */
  create = /* @__PURE__ */ __name((data) => {
    const {
      title,
      ...rest
    } = data;
    const id = typeof data?.id === "number" || typeof data?.id === "string" && data.id.length > 0 ? data.id : toastsCounter++;
    const alreadyExists = this.toasts.find((toast2) => toast2.id === id);
    const dismissible = data.dismissible ?? true;
    if (this.dismissedToasts.has(id)) {
      this.dismissedToasts.delete(id);
    }
    if (alreadyExists) {
      this.toasts = this.toasts.map((toast2) => {
        if (toast2.id === id) {
          this.publish({
            ...toast2,
            ...data,
            id,
            title,
            dismissible
          });
          return {
            ...toast2,
            ...data,
            id,
            title,
            dismissible
          };
        }
        return toast2;
      });
    } else {
      this.addToast({
        title,
        ...rest,
        dismissible,
        id
      });
    }
    return id;
  }, "create");
  /**
   * Dismiss a toast by id, or all toasts if no id provided
   */
  dismiss = /* @__PURE__ */ __name((id) => {
    if (id !== void 0) {
      this.dismissedToasts.add(id);
      requestAnimationFrame(() => {
        this.subscribers.forEach((subscriber) => subscriber({
          id,
          dismiss: true
        }));
      });
    } else {
      this.toasts.forEach((toast2) => {
        this.subscribers.forEach((subscriber) => subscriber({
          id: toast2.id,
          dismiss: true
        }));
      });
    }
    return id;
  }, "dismiss");
  /**
   * Show a basic toast message
   */
  message = /* @__PURE__ */ __name((title, data) => {
    return this.create({
      ...data,
      title,
      type: "default"
    });
  }, "message");
  /**
   * Show a success toast
   */
  success = /* @__PURE__ */ __name((title, data) => {
    return this.create({
      ...data,
      title,
      type: "success"
    });
  }, "success");
  /**
   * Show an error toast
   */
  error = /* @__PURE__ */ __name((title, data) => {
    return this.create({
      ...data,
      title,
      type: "error"
    });
  }, "error");
  /**
   * Show a warning toast
   */
  warning = /* @__PURE__ */ __name((title, data) => {
    return this.create({
      ...data,
      title,
      type: "warning"
    });
  }, "warning");
  /**
   * Show an info toast
   */
  info = /* @__PURE__ */ __name((title, data) => {
    return this.create({
      ...data,
      title,
      type: "info"
    });
  }, "info");
  /**
   * Show a loading toast
   */
  loading = /* @__PURE__ */ __name((title, data) => {
    return this.create({
      ...data,
      title,
      type: "loading"
    });
  }, "loading");
  /**
   * Show a toast for a promise, automatically transitioning through
   * loading -> success/error states
   */
  promise = /* @__PURE__ */ __name((promise, data) => {
    if (!data) {
      return;
    }
    let id = void 0;
    if (data.loading !== void 0) {
      id = this.create({
        promise,
        type: "loading",
        title: data.loading,
        description: typeof data.description !== "function" ? data.description : void 0,
        // loading toasts shouldn't auto-dismiss
        duration: Number.POSITIVE_INFINITY
      });
    }
    const p = Promise.resolve(promise instanceof Function ? promise() : promise);
    let shouldDismiss = id !== void 0;
    let result;
    const originalPromise = p.then(async (response) => {
      result = ["resolve", response];
      if (isHttpResponse(response) && !response.ok) {
        shouldDismiss = false;
        const errorMsg = typeof data.error === "function" ? await data.error(`HTTP error! status: ${response.status}`) : data.error;
        const description = typeof data.description === "function" ? await data.description(`HTTP error! status: ${response.status}`) : data.description;
        this.create({
          id,
          type: "error",
          title: errorMsg,
          description
        });
      } else if (data.success !== void 0) {
        shouldDismiss = false;
        const successMsg = typeof data.success === "function" ? await data.success(response) : data.success;
        const description = typeof data.description === "function" ? await data.description(response) : data.description;
        this.create({
          id,
          type: "success",
          title: successMsg,
          description
        });
      }
    }).catch(async (error2) => {
      result = ["reject", error2];
      if (data.error !== void 0) {
        shouldDismiss = false;
        const errorMsg = typeof data.error === "function" ? await data.error(error2) : data.error;
        const description = typeof data.description === "function" ? await data.description(error2) : data.description;
        this.create({
          id,
          type: "error",
          title: errorMsg,
          description
        });
      }
    }).finally(() => {
      if (shouldDismiss) {
        this.dismiss(id);
        id = void 0;
      }
      data.finally?.();
    });
    const unwrap = /* @__PURE__ */ __name(() => new Promise((resolve, reject) => originalPromise.then(() => result[0] === "reject" ? reject(result[1]) : resolve(result[1])).catch(reject)), "unwrap");
    if (typeof id !== "string" && typeof id !== "number") {
      return {
        unwrap
      };
    } else {
      return Object.assign(id, {
        unwrap
      });
    }
  }, "promise");
  /**
   * Show a custom JSX toast
   */
  custom = /* @__PURE__ */ __name((jsx71, data) => {
    const id = data?.id ?? toastsCounter++;
    this.create({
      jsx: jsx71(id),
      ...data,
      id
    });
    return id;
  }, "custom");
  /**
   * Get all active (non-dismissed) toasts
   */
  getActiveToasts = /* @__PURE__ */ __name(() => {
    return this.toasts.filter((toast2) => !this.dismissedToasts.has(toast2.id));
  }, "getActiveToasts");
  /**
   * Get full toast history
   */
  getHistory = /* @__PURE__ */ __name(() => {
    return this.toasts;
  }, "getHistory");
};
function isHttpResponse(data) {
  return data && typeof data === "object" && "ok" in data && typeof data.ok === "boolean" && "status" in data && typeof data.status === "number";
}
__name(isHttpResponse, "isHttpResponse");
var ToastState = new Observer();
var toastFunction = /* @__PURE__ */ __name((title, data) => {
  return ToastState.create({
    ...data,
    title
  });
}, "toastFunction");
var getHistory = /* @__PURE__ */ __name(() => ToastState.getHistory(), "getHistory");
var getToasts = /* @__PURE__ */ __name(() => ToastState.getActiveToasts(), "getToasts");
var toast = Object.assign(toastFunction, {
  success: ToastState.success,
  error: ToastState.error,
  warning: ToastState.warning,
  info: ToastState.info,
  loading: ToastState.loading,
  promise: ToastState.promise,
  custom: ToastState.custom,
  dismiss: ToastState.dismiss,
  message: ToastState.message,
  getHistory,
  getToasts
});

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/dispatchNativeToast.mjs
function dispatchNativeToast(toast2, opts) {
  const titleText = typeof toast2.title === "function" ? toast2.title() : toast2.title;
  if (typeof titleText !== "string") return false;
  const descText = typeof toast2.description === "function" ? toast2.description() : toast2.description;
  const toastType = toast2.type ?? "default";
  const preset = toastType === "error" ? "error" : toastType === "success" ? "done" : "none";
  const haptic = toastType === "error" ? "error" : toastType === "success" ? "success" : toastType === "warning" ? "warning" : "none";
  const result = createNativeToast(titleText, {
    message: typeof descText === "string" ? descText : void 0,
    duration: toast2.duration ?? opts.duration,
    burntOptions: {
      preset,
      haptic,
      ...opts.burntOptions
    },
    notificationOptions: opts.notificationOptions
  });
  return result !== false;
}
__name(dispatchNativeToast, "dispatchNativeToast");

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/useAnimatedDragGesture.mjs
import * as React78 from "react";
var VELOCITY_THRESHOLD = 0.11;
function resisted(delta, maxResist = 25) {
  if (delta >= 0) return delta;
  const pastBoundary = Math.abs(delta);
  const resistedDistance = Math.sqrt(pastBoundary) * 2;
  return -Math.min(resistedDistance, maxResist);
}
__name(resisted, "resisted");
var EXIT_DRAG_CAP = 80;
function cappedExit(delta) {
  if (Math.abs(delta) <= EXIT_DRAG_CAP) return delta;
  const sign = delta > 0 ? 1 : -1;
  const overshoot = Math.abs(delta) - EXIT_DRAG_CAP;
  return sign * (EXIT_DRAG_CAP + Math.sqrt(overshoot) * 2);
}
__name(cappedExit, "cappedExit");
function useAnimatedDragGesture(options) {
  const {
    direction,
    threshold,
    disabled,
    expanded,
    onDragMove,
    onDragStart,
    onDismiss,
    onCancel
  } = options;
  const [isDragging, setIsDragging] = React78.useState(false);
  const dragStartRef = React78.useRef(null);
  const lockedDirectionRef = React78.useRef(null);
  const captureElementRef = React78.useRef(null);
  const isHorizontal = direction === "left" || direction === "right" || direction === "horizontal";
  const isVertical = direction === "up" || direction === "down" || direction === "vertical";
  const preventSelectRef = React78.useRef(null);
  function startPreventingSelection() {
    if (typeof document === "undefined") return;
    window.getSelection()?.removeAllRanges();
    const handler = /* @__PURE__ */ __name((e) => e.preventDefault(), "handler");
    preventSelectRef.current = handler;
    document.addEventListener("selectstart", handler, true);
  }
  __name(startPreventingSelection, "startPreventingSelection");
  function stopPreventingSelection() {
    if (preventSelectRef.current) {
      document.removeEventListener("selectstart", preventSelectRef.current, true);
      preventSelectRef.current = null;
    }
  }
  __name(stopPreventingSelection, "stopPreventingSelection");
  const cleanup = React78.useCallback(() => {
    dragStartRef.current = null;
    lockedDirectionRef.current = null;
    setIsDragging(false);
    stopPreventingSelection();
  }, []);
  React78.useEffect(() => {
    return () => {
      if (dragStartRef.current) {
        if (captureElementRef.current && dragStartRef.current.pointerId) {
          try {
            captureElementRef.current.releasePointerCapture(dragStartRef.current.pointerId);
          } catch {
          }
        }
        cleanup();
      }
    };
  }, [cleanup]);
  const handlePointerDown = React78.useCallback((event) => {
    if (disabled) return;
    if (event.button !== 0) return;
    const target = event.target;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) {
      return;
    }
    const hasSelection = (window.getSelection()?.toString().length ?? 0) > 0;
    if (hasSelection) return;
    const captureElement = event.currentTarget;
    captureElementRef.current = captureElement;
    captureElement.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startTime: Date.now(),
      pointerId: event.pointerId
    };
    startPreventingSelection();
    setIsDragging(true);
    onDragStart?.();
  }, [disabled, onDragStart]);
  const handlePointerMove = React78.useCallback((event) => {
    if (!dragStartRef.current || disabled) return;
    const deltaX = event.clientX - dragStartRef.current.startX;
    const deltaY = event.clientY - dragStartRef.current.startY;
    if (!lockedDirectionRef.current && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
      lockedDirectionRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
    }
    let offsetX = 0;
    let offsetY = 0;
    if (direction === "right") {
      offsetX = deltaX > 0 ? cappedExit(deltaX) : resisted(deltaX);
    } else if (direction === "left") {
      offsetX = deltaX < 0 ? cappedExit(deltaX) : -resisted(-deltaX);
    } else if (direction === "down") {
      offsetY = deltaY > 0 ? cappedExit(deltaY) : resisted(deltaY);
    } else if (direction === "up") {
      offsetY = deltaY < 0 ? cappedExit(deltaY) : -resisted(-deltaY);
    } else if (direction === "horizontal") {
      offsetX = cappedExit(deltaX);
    } else if (direction === "vertical") {
      offsetY = cappedExit(deltaY);
    }
    onDragMove(offsetX, offsetY);
  }, [disabled, direction, expanded, isHorizontal, isVertical, onDragMove]);
  const handlePointerUp = React78.useCallback((event) => {
    if (!dragStartRef.current || disabled) return;
    const deltaX = event.clientX - dragStartRef.current.startX;
    const deltaY = event.clientY - dragStartRef.current.startY;
    const timeTaken = Date.now() - dragStartRef.current.startTime;
    const velocityX = Math.abs(deltaX) / timeTaken;
    const velocityY = Math.abs(deltaY) / timeTaken;
    const lockedDirection = lockedDirectionRef.current;
    const isLockedToWrongAxis = lockedDirection === "y" && isHorizontal || lockedDirection === "x" && isVertical;
    const relevantDelta = isHorizontal ? deltaX : deltaY;
    const relevantVelocity = isHorizontal ? velocityX : velocityY;
    const passedThreshold = Math.abs(relevantDelta) >= threshold;
    const hasVelocity = relevantVelocity > VELOCITY_THRESHOLD;
    let exitDirection = null;
    if (!isLockedToWrongAxis) {
      if (direction === "right" && deltaX > 0) exitDirection = "right";
      else if (direction === "left" && deltaX < 0) exitDirection = "left";
      else if (direction === "horizontal") {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          exitDirection = deltaX > 0 ? "right" : "left";
        }
      } else if (direction === "down" && deltaY > 0) exitDirection = "down";
      else if (direction === "up" && deltaY < 0) exitDirection = "up";
      else if (direction === "vertical") {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          exitDirection = deltaY > 0 ? "down" : "up";
        }
      }
    }
    const shouldDismiss = exitDirection && (passedThreshold || hasVelocity);
    if (captureElementRef.current) {
      try {
        captureElementRef.current.releasePointerCapture(event.pointerId);
      } catch {
      }
    }
    cleanup();
    if (shouldDismiss && exitDirection) {
      onDismiss(exitDirection, relevantVelocity);
    } else {
      onCancel();
    }
  }, [disabled, direction, threshold, isHorizontal, isVertical, onDismiss, onCancel, cleanup]);
  const handlePointerCancel = React78.useCallback((event) => {
    if (captureElementRef.current) {
      try {
        captureElementRef.current.releasePointerCapture(event.pointerId);
      } catch {
      }
    }
    cleanup();
    onCancel();
  }, [onCancel, cleanup]);
  const handleLostPointerCapture = React78.useCallback(() => {
    if (dragStartRef.current) {
      cleanup();
      onCancel();
    }
  }, [onCancel, cleanup]);
  const gestureHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onLostPointerCapture: handleLostPointerCapture
  };
  return {
    isDragging,
    gestureHandlers,
    gesture: null
  };
}
__name(useAnimatedDragGesture, "useAnimatedDragGesture");

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/useToastAnimations.mjs
import { useConfiguration as useConfiguration3, useEvent as useEvent11, View as GuiView2 } from "@hanzogui/core";
import * as React79 from "react";
var SPRING_CONFIG = {
  type: "spring",
  damping: 30,
  stiffness: 400,
  mass: 0.5
};
var EXIT_DISTANCE = 200;
function animateSpring(element, fromX, fromY, toX, toY, config, onComplete) {
  const {
    damping = 30,
    stiffness = 400,
    mass = 0.5,
    initialVelocityX = 0,
    initialVelocityY = 0,
    fadeOut = false
  } = config;
  let x = fromX;
  let y = fromY;
  let velocityX = initialVelocityX;
  let velocityY = initialVelocityY;
  let animationId = null;
  const targetX = toX;
  const targetY = toY;
  const totalDistance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2) || 1;
  function step2() {
    const forceX = -stiffness * (x - targetX);
    const forceY = -stiffness * (y - targetY);
    const dampingForceX = -damping * velocityX;
    const dampingForceY = -damping * velocityY;
    const accelerationX = (forceX + dampingForceX) / mass;
    const accelerationY = (forceY + dampingForceY) / mass;
    velocityX += accelerationX * 0.016;
    velocityY += accelerationY * 0.016;
    x += velocityX * 0.016;
    y += velocityY * 0.016;
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (fadeOut) {
      const distanceTraveled = Math.sqrt((x - fromX) ** 2 + (y - fromY) ** 2);
      const progress = Math.min(distanceTraveled / totalDistance, 1);
      element.style.opacity = String(1 - progress);
    }
    const distanceX = Math.abs(x - targetX);
    const distanceY = Math.abs(y - targetY);
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (distanceX < 0.5 && distanceY < 0.5 && speed < 0.5) {
      element.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      if (fadeOut) {
        element.style.opacity = "0";
      }
      onComplete?.();
      return;
    }
    animationId = requestAnimationFrame(step2);
  }
  __name(step2, "step");
  animationId = requestAnimationFrame(step2);
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}
__name(animateSpring, "animateSpring");
function useToastAnimations(options = {}) {
  const {
    onExitComplete,
    reducedMotion,
    swipeAxis = "horizontal"
  } = options;
  const {
    animationDriver
  } = useConfiguration3();
  if (!animationDriver) {
    throw new Error("Toast requires an animation driver to be set in GuiProvider");
  }
  const {
    useAnimatedNumber,
    useAnimatedNumberStyle,
    useAnimatedNumbersStyle
  } = animationDriver;
  const AnimatedView = animationDriver.View ?? GuiView2;
  const dragRef = React79.useRef(null);
  const cancelAnimationRef = React79.useRef(null);
  const currentOffsetRef = React79.useRef({
    x: 0,
    y: 0
  });
  const useDirectDom = isWeb;
  const translateX = useAnimatedNumber(0);
  const translateY = useAnimatedNumber(0);
  const animatedStyleMulti = useAnimatedNumbersStyle ? useAnimatedNumbersStyle([translateX, translateY], (x, y) => {
    "worklet";
    return {
      transform: [{
        translateX: x
      }, {
        translateY: y
      }]
    };
  }) : null;
  const animatedStyleFallback = useAnimatedNumberStyle(swipeAxis === "vertical" ? translateY : translateX, (primary) => {
    "worklet";
    const secondary = swipeAxis === "vertical" ? translateX.getValue() : translateY.getValue();
    return swipeAxis === "vertical" ? {
      transform: [{
        translateX: secondary
      }, {
        translateY: primary
      }]
    } : {
      transform: [{
        translateX: primary
      }, {
        translateY: secondary
      }]
    };
  });
  const animatedStyle = animatedStyleMulti ?? animatedStyleFallback;
  const setDragOffset = useEvent11((x, y) => {
    cancelAnimationRef.current?.();
    cancelAnimationRef.current = null;
    currentOffsetRef.current = {
      x,
      y
    };
    if (useDirectDom && dragRef.current) {
      dragRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      dragRef.current.style.opacity = "1";
    } else {
      translateX.setValue(x, {
        type: "direct"
      });
      translateY.setValue(y, {
        type: "direct"
      });
    }
  });
  const springBack = useEvent11((onComplete) => {
    cancelAnimationRef.current?.();
    if (reducedMotion) {
      if (useDirectDom && dragRef.current) {
        dragRef.current.style.transform = "translate3d(0px, 0px, 0)";
      } else {
        translateX.setValue(0, {
          type: "direct"
        });
        translateY.setValue(0, {
          type: "direct"
        });
      }
      currentOffsetRef.current = {
        x: 0,
        y: 0
      };
      onComplete?.();
      return;
    }
    if (useDirectDom && dragRef.current) {
      const {
        x,
        y
      } = currentOffsetRef.current;
      cancelAnimationRef.current = animateSpring(dragRef.current, x, y, 0, 0, SPRING_CONFIG, () => {
        currentOffsetRef.current = {
          x: 0,
          y: 0
        };
        onComplete?.();
      });
    } else {
      translateX.setValue(0, SPRING_CONFIG);
      translateY.setValue(0, SPRING_CONFIG, onComplete);
    }
  });
  const animateOut = useEvent11((direction, velocity, onComplete) => {
    cancelAnimationRef.current?.();
    const {
      x: curX,
      y: curY
    } = currentOffsetRef.current;
    let exitX = direction === "left" ? -EXIT_DISTANCE : direction === "right" ? EXIT_DISTANCE : 0;
    let exitY = direction === "up" ? -EXIT_DISTANCE : direction === "down" ? EXIT_DISTANCE : 0;
    if (direction === "left" && curX < exitX) exitX = curX - 50;
    else if (direction === "right" && curX > exitX) exitX = curX + 50;
    if (direction === "up" && curY < exitY) exitY = curY - 50;
    else if (direction === "down" && curY > exitY) exitY = curY + 50;
    if (reducedMotion) {
      if (useDirectDom && dragRef.current) {
        dragRef.current.style.transform = `translate3d(${exitX}px, ${exitY}px, 0)`;
      } else {
        translateX.setValue(exitX, {
          type: "direct"
        });
        translateY.setValue(exitY, {
          type: "direct"
        });
      }
      onComplete?.();
      onExitComplete?.();
      return;
    }
    const velocityScale = (velocity ?? 0) * 500;
    const initialVelocityX = direction === "left" ? -velocityScale : direction === "right" ? velocityScale : 0;
    const initialVelocityY = direction === "up" ? -velocityScale : direction === "down" ? velocityScale : 0;
    const exitConfig = {
      damping: 25,
      stiffness: 350,
      mass: 0.4,
      initialVelocityX,
      initialVelocityY,
      fadeOut: true
    };
    if (useDirectDom && dragRef.current) {
      const {
        x,
        y
      } = currentOffsetRef.current;
      cancelAnimationRef.current = animateSpring(dragRef.current, x, y, exitX, exitY, exitConfig, () => {
        onComplete?.();
        onExitComplete?.();
      });
    } else {
      const springConfig = {
        type: "spring",
        damping: 25,
        stiffness: 350,
        mass: 0.4
      };
      translateX.setValue(exitX, springConfig);
      translateY.setValue(exitY, springConfig, () => {
        onComplete?.();
        onExitComplete?.();
      });
    }
  });
  const stop = useEvent11(() => {
    cancelAnimationRef.current?.();
    translateX.stop();
    translateY.stop();
  });
  React79.useEffect(() => {
    return () => {
      cancelAnimationRef.current?.();
    };
  }, []);
  return {
    setDragOffset,
    springBack,
    animateOut,
    stop,
    animatedStyle,
    AnimatedView,
    dragRef
  };
}
__name(useToastAnimations, "useToastAnimations");

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/useReducedMotion.mjs
import * as React80 from "react";
var cachedResult = null;
function getReducedMotion() {
  if (cachedResult !== null) return cachedResult;
  if (!isWeb) {
    cachedResult = false;
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  cachedResult = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  return cachedResult;
}
__name(getReducedMotion, "getReducedMotion");
function useReducedMotion(forceReducedMotion) {
  const [reducedMotion, setReducedMotion] = React80.useState(() => forceReducedMotion ?? getReducedMotion());
  React80.useEffect(() => {
    if (forceReducedMotion !== void 0) {
      setReducedMotion(forceReducedMotion);
      return;
    }
    if (!isWeb || typeof window === "undefined") return;
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mediaQuery) return;
    const handleChange = /* @__PURE__ */ __name((e) => {
      cachedResult = e.matches;
      setReducedMotion(e.matches);
    }, "handleChange");
    mediaQuery.addEventListener?.("change", handleChange);
    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, [forceReducedMotion]);
  return reducedMotion;
}
__name(useReducedMotion, "useReducedMotion");

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/ToastItemFrame.mjs
import { styled as styled37 } from "@hanzogui/core";
import { jsx as jsx68 } from "react/jsx-runtime";
var ToastPositionWrapper = styled37(YStack, {
  name: "ToastPositionWrapper",
  pointerEvents: "auto",
  position: "absolute",
  left: 0,
  right: 0,
  opacity: 1,
  scale: 1,
  y: 0,
  x: 0
});
var ToastItemFrame = styled37(YStack, {
  name: "ToastItem",
  userSelect: "none",
  cursor: "default",
  focusable: true,
  variants: {
    unstyled: {
      false: {
        backgroundColor: "$background",
        borderRadius: "$6",
        paddingHorizontal: "$4",
        paddingVertical: "$3",
        borderWidth: 1,
        borderColor: "$borderColor",
        shadowColor: "rgba(0, 0, 0, 0.15)",
        shadowOffset: {
          width: 0,
          height: 4
        },
        shadowRadius: 12,
        focusVisibleStyle: {
          outlineWidth: 2,
          outlineColor: "$color8",
          outlineStyle: "solid"
        }
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ToastCloseFrame = styled37(XStack, {
  name: "ToastClose",
  render: "button",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  variants: {
    unstyled: {
      false: {
        width: 18,
        height: 18,
        borderRadius: "$10",
        backgroundColor: "$background",
        borderWidth: 1,
        borderColor: "$borderColor",
        shadowColor: "rgba(0, 0, 0, 0.08)",
        shadowOffset: {
          width: 0,
          height: 1
        },
        shadowRadius: 3,
        hoverStyle: {
          backgroundColor: "$color3"
        },
        pressStyle: {
          backgroundColor: "$color4"
        }
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ToastActionFrame = styled37(XStack, {
  name: "ToastAction",
  render: "button",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  variants: {
    unstyled: {
      false: {
        borderRadius: "$2",
        paddingHorizontal: "$2",
        height: 24,
        backgroundColor: "$color5",
        hoverStyle: {
          backgroundColor: "$color6"
        },
        pressStyle: {
          backgroundColor: "$color7"
        }
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var DefaultCloseIcon = /* @__PURE__ */ __name(() => /* @__PURE__ */ jsx68(SizableText2, {
  size: "$1",
  color: "$color11",
  children: "\u2715"
}), "DefaultCloseIcon");

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/ToastComposable.mjs
import { jsx as jsx69, jsxs as jsxs15 } from "react/jsx-runtime";
var VISIBLE_TOASTS_AMOUNT = 4;
var VIEWPORT_OFFSET = 16;
var TOAST_GAP = 14;
var TOAST_LIFETIME = 4e3;
var FIXED_TOAST_HEIGHT = 72;
var TIME_BEFORE_UNMOUNT = 200;
var DEFAULT_HOTKEY = ["altKey", "KeyT"];
var ToastContext = createStyledContext21({}, "Toast__");
var useToastContext = ToastContext.useStyledContext;
var ToastItemContext = React81.createContext(null);
function useToastItemContext() {
  const ctx = React81.useContext(ToastItemContext);
  if (!ctx) {
    throw new Error("useToastItemContext must be used within Toast.Item or Toast.List");
  }
  return ctx;
}
__name(useToastItemContext, "useToastItemContext");
function resolveSwipeDirection(direction, position2) {
  if (direction !== "auto") return direction;
  const [yPosition, xPosition] = position2.split("-");
  if (!isWeb) {
    return yPosition === "top" ? "up" : "down";
  }
  if (xPosition === "left") return "left";
  if (xPosition === "right") return "right";
  return "horizontal";
}
__name(resolveSwipeDirection, "resolveSwipeDirection");
var ToastRoot = React81.forwardRef(/* @__PURE__ */ __name(function ToastRoot2(props, _ref) {
  const {
    children,
    position: position2 = "bottom-right",
    duration = TOAST_LIFETIME,
    gap = TOAST_GAP,
    visibleToasts = VISIBLE_TOASTS_AMOUNT,
    swipeDirection: swipeDirectionProp = "auto",
    swipeThreshold = 50,
    toastHeight = FIXED_TOAST_HEIGHT,
    closeButton = false,
    expand = false,
    theme: themeProp,
    reducedMotion: reducedMotionProp,
    native = false,
    burntOptions,
    notificationOptions,
    icons
  } = props;
  const reducedMotion = useReducedMotion(reducedMotionProp);
  const [toasts, setToasts] = React81.useState([]);
  const [heights, setHeights] = React81.useState({});
  const [localExpanded, setExpanded] = React81.useState(false);
  const expanded = expand || localExpanded;
  const [interacting, setInteracting] = React81.useState(false);
  const heightsLockedRef = React81.useRef(false);
  const prevExpandedRef = React81.useRef(expanded);
  React81.useLayoutEffect(() => {
    if (prevExpandedRef.current !== expanded) {
      heightsLockedRef.current = true;
      prevExpandedRef.current = expanded;
    }
    const timer = setTimeout(() => {
      heightsLockedRef.current = false;
    }, 350);
    return () => clearTimeout(timer);
  }, [expanded]);
  const setToastHeight = React81.useCallback((toastId, height) => {
    if (heightsLockedRef.current) return;
    const rounded = Math.round(height);
    setHeights((prev) => {
      const existing = prev[toastId];
      if (existing != null && Math.abs(existing - rounded) <= 2) return prev;
      return {
        ...prev,
        [toastId]: rounded
      };
    });
  }, []);
  const removeToastHeight = React81.useCallback((toastId) => {
    setHeights((prev) => {
      if (!(toastId in prev)) return prev;
      const next = {
        ...prev
      };
      delete next[toastId];
      return next;
    });
  }, []);
  const dismissCooldownRef = React81.useRef(false);
  const dismissCooldownTimerRef = React81.useRef(null);
  const triggerDismissCooldown = React81.useCallback(() => {
    dismissCooldownRef.current = true;
    if (dismissCooldownTimerRef.current) {
      clearTimeout(dismissCooldownTimerRef.current);
    }
    dismissCooldownTimerRef.current = setTimeout(() => {
      dismissCooldownRef.current = false;
    }, 800);
  }, []);
  const isInDismissCooldown = React81.useCallback(() => dismissCooldownRef.current, []);
  const burntOptionsRef = React81.useRef(burntOptions);
  const notificationOptionsRef = React81.useRef(notificationOptions);
  React81.useEffect(() => {
    burntOptionsRef.current = burntOptions;
  }, [burntOptions]);
  React81.useEffect(() => {
    notificationOptionsRef.current = notificationOptions;
  }, [notificationOptions]);
  React81.useEffect(() => {
    return ToastState.subscribe((toast2) => {
      if (toast2.dismiss) {
        setToasts((toasts2) => toasts2.map((t) => t.id === toast2.id ? {
          ...t,
          delete: true
        } : t));
        return;
      }
      if (native) {
        const handled = dispatchNativeToast(toast2, {
          duration,
          burntOptions: burntOptionsRef.current,
          notificationOptions: notificationOptionsRef.current
        });
        if (handled) return;
      }
      setToasts((toasts2) => {
        const idx = toasts2.findIndex((t) => t.id === toast2.id);
        if (idx !== -1) {
          return [...toasts2.slice(0, idx), {
            ...toasts2[idx],
            ...toast2
          }, ...toasts2.slice(idx + 1)];
        }
        return [toast2, ...toasts2];
      });
    });
  }, [native, duration]);
  const prevToastCountRef = React81.useRef(toasts.length);
  React81.useEffect(() => {
    const prevCount = prevToastCountRef.current;
    prevToastCountRef.current = toasts.length;
    if (toasts.length <= 1 && !dismissCooldownRef.current) {
      setExpanded(false);
    } else if (toasts.length > prevCount && expanded) {
      setExpanded(false);
    }
  }, [toasts.length, expanded]);
  const removeToast = React81.useCallback((toastToRemove) => {
    setToasts((toasts2) => {
      if (!toasts2.find((t) => t.id === toastToRemove.id)?.delete) {
        ToastState.dismiss(toastToRemove.id);
      }
      return toasts2.filter(({
        id
      }) => id !== toastToRemove.id);
    });
  }, []);
  const swipeDirection = resolveSwipeDirection(swipeDirectionProp, position2);
  const currentTheme = useThemeName6();
  const resolvedTheme = themeProp === "system" || !themeProp ? currentTheme?.includes("dark") ? "dark" : "light" : themeProp;
  const contextValue = {
    toasts,
    heights,
    setToastHeight,
    removeToastHeight,
    expanded,
    setExpanded,
    interacting,
    setInteracting,
    triggerDismissCooldown,
    isInDismissCooldown,
    removeToast,
    position: position2,
    duration,
    gap,
    visibleToasts,
    swipeDirection,
    swipeThreshold,
    toastHeight,
    closeButton,
    reducedMotion,
    native,
    burntOptions,
    notificationOptions,
    icons
  };
  return /* @__PURE__ */ jsx69(ToastContext.Provider, {
    ...contextValue,
    children: /* @__PURE__ */ jsx69(Theme4, {
      name: resolvedTheme,
      children
    })
  });
}, "ToastRoot2"));
var ToastViewportFrame = styled38(View19, {
  name: "ToastViewport",
  variants: {
    unstyled: {
      false: {
        position: isWeb ? "fixed" : "absolute",
        zIndex: 1e5,
        pointerEvents: "box-none",
        maxWidth: "100%",
        ...isWeb && {
          width: 356
        },
        minHeight: 1
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ToastViewport = ToastViewportFrame.styleable(/* @__PURE__ */ __name(function ToastViewport2(props, ref) {
  const {
    offset: offset4 = VIEWPORT_OFFSET,
    hotkey = DEFAULT_HOTKEY,
    label = "Notifications",
    portalToRoot = true,
    portalZIndex = Number.MAX_SAFE_INTEGER,
    children,
    ...rest
  } = props;
  const ctx = useToastContext();
  const listRef = React81.useRef(null);
  const hoverTimeoutRef = React81.useRef(null);
  const hoverCooldownRef = React81.useRef(false);
  const deferredCollapseRef = React81.useRef(null);
  const mouseInsideRef = React81.useRef(false);
  const [yPosition, xPosition] = ctx.position.split("-");
  const {
    insets: safeInsets
  } = useConfiguration4();
  const offsetStyles = React81.useMemo(() => {
    const styles5 = {};
    const defaultOffset2 = typeof offset4 === "number" ? offset4 : VIEWPORT_OFFSET;
    const offsetObj = typeof offset4 === "object" ? offset4 : {
      top: defaultOffset2,
      right: defaultOffset2,
      bottom: defaultOffset2,
      left: defaultOffset2
    };
    const safeTop = safeInsets?.top ?? 0;
    const safeBottom = safeInsets?.bottom ?? 0;
    const topOffset = safeTop > 0 ? safeTop : offsetObj.top ?? defaultOffset2;
    const bottomOffset = safeBottom > 0 ? safeBottom : offsetObj.bottom ?? defaultOffset2;
    if (yPosition === "top") styles5.top = topOffset;
    else styles5.bottom = bottomOffset;
    if (isWeb) {
      if (xPosition === "left") styles5.left = offsetObj.left ?? defaultOffset2;
      else if (xPosition === "right") styles5.right = offsetObj.right ?? defaultOffset2;
      else {
        styles5.left = "50%";
        styles5.transform = "translateX(-50%)";
      }
    } else {
      styles5.left = offsetObj.left ?? defaultOffset2;
      styles5.right = offsetObj.right ?? defaultOffset2;
    }
    return styles5;
  }, [offset4, yPosition, xPosition]);
  React81.useEffect(() => {
    if (!isWeb) return;
    const handleKeyDown = /* @__PURE__ */ __name((event) => {
      const isHotkeyPressed = hotkey.length > 0 && hotkey.every((key) => event[key] || event.code === key);
      if (isHotkeyPressed) {
        ctx.setExpanded(true);
        listRef.current?.focus();
      }
    }, "handleKeyDown");
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hotkey]);
  if (ctx.toasts.length === 0) return null;
  const hotkeyLabel = hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, "");
  const content = /* @__PURE__ */ jsx69(ToastViewportFrame, {
    ref: listRef,
    "aria-label": `${label} ${hotkeyLabel}`,
    tabIndex: -1,
    "aria-live": "polite",
    style: offsetStyles,
    "data-y-position": yPosition,
    "data-x-position": xPosition,
    ...isWeb ? {
      onMouseEnter: /* @__PURE__ */ __name(() => {
        mouseInsideRef.current = true;
        if (deferredCollapseRef.current) {
          clearTimeout(deferredCollapseRef.current);
          deferredCollapseRef.current = null;
        }
        if (ctx.toasts.length > 1 && !ctx.interacting && !hoverCooldownRef.current) {
          hoverTimeoutRef.current = setTimeout(() => ctx.setExpanded(true), 50);
        }
      }, "onMouseEnter"),
      onMouseLeave: /* @__PURE__ */ __name(() => {
        mouseInsideRef.current = false;
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        if (!ctx.interacting && !ctx.isInDismissCooldown()) {
          ctx.setExpanded(false);
        } else if (ctx.isInDismissCooldown()) {
          if (deferredCollapseRef.current) {
            clearTimeout(deferredCollapseRef.current);
          }
          deferredCollapseRef.current = setTimeout(() => {
            deferredCollapseRef.current = null;
            if (!mouseInsideRef.current) {
              ctx.setExpanded(false);
            }
          }, 1200);
        }
      }, "onMouseLeave"),
      onPointerDown: /* @__PURE__ */ __name(() => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        ctx.setInteracting(true);
      }, "onPointerDown"),
      onPointerUp: /* @__PURE__ */ __name(() => ctx.setInteracting(false), "onPointerUp"),
      onPointerCancel: /* @__PURE__ */ __name(() => ctx.setInteracting(false), "onPointerCancel")
    } : {
      onPress: /* @__PURE__ */ __name(() => {
        if (ctx.toasts.length > 1) {
          ctx.setExpanded((prev) => !prev);
        }
      }, "onPress")
    },
    ...isWeb && {
      onFocus: /* @__PURE__ */ __name((event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          if (ctx.toasts.length > 1) {
            ctx.setExpanded(true);
          }
          ctx.setInteracting(true);
        }
      }, "onFocus"),
      onBlur: /* @__PURE__ */ __name((event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          ctx.setInteracting(false);
          if (!ctx.isInDismissCooldown()) {
            ctx.setExpanded(false);
          }
        }
      }, "onBlur")
    },
    ...rest,
    children
  });
  if (portalToRoot) {
    return /* @__PURE__ */ jsx69(Portal, {
      zIndex: portalZIndex,
      children: content
    });
  }
  return content;
}, "ToastViewport2"));
function ToastList({
  renderItem
}) {
  const ctx = useToastContext();
  const maxRender = ctx.toasts.length;
  return /* @__PURE__ */ jsx69(AnimatePresence, {
    children: ctx.toasts.slice(0, maxRender).map((toast2, index2) => {
      const handleClose = /* @__PURE__ */ __name(() => {
        if (toast2.dismissible === false) return;
        toast2.onDismiss?.(toast2);
        ctx.removeToast(toast2);
      }, "handleClose");
      const itemContextValue = {
        toast: toast2,
        handleClose
      };
      if (!renderItem) {
        return /* @__PURE__ */ jsx69(ToastItemContext.Provider, {
          value: itemContextValue,
          children: /* @__PURE__ */ jsx69(ToastItemInner, {
            toast: toast2,
            index: index2,
            children: /* @__PURE__ */ jsx69(DefaultToastContent, {
              toast: toast2
            })
          })
        }, toast2.id);
      }
      return /* @__PURE__ */ jsx69(ToastItemContext.Provider, {
        value: itemContextValue,
        children: renderItem({
          toast: toast2,
          index: index2,
          handleClose
        })
      }, toast2.id);
    })
  });
}
__name(ToastList, "ToastList");
function DefaultToastContent({
  toast: toast2
}) {
  const ctx = useToastContext();
  const {
    handleClose
  } = useToastItemContext();
  const toastType = toast2.type ?? "default";
  const dismissible = toast2.dismissible !== false;
  const title = typeof toast2.title === "function" ? toast2.title() : toast2.title;
  const description = typeof toast2.description === "function" ? toast2.description() : toast2.description;
  return /* @__PURE__ */ jsxs15(XStack, {
    alignItems: "flex-start",
    gap: "$3",
    children: [/* @__PURE__ */ jsx69(ToastIcon, {}), /* @__PURE__ */ jsxs15(YStack, {
      flex: 1,
      gap: "$1",
      children: [title && /* @__PURE__ */ jsx69(ToastTitle, {
        children: title
      }), description && /* @__PURE__ */ jsx69(ToastDescription, {
        children: description
      }), (toast2.action || toast2.cancel) && /* @__PURE__ */ jsxs15(XStack, {
        gap: "$2",
        marginTop: "$2",
        children: [toast2.cancel && /* @__PURE__ */ jsx69(ToastActionFrame, {
          backgroundColor: "transparent",
          onPress: /* @__PURE__ */ __name((e) => {
            toast2.cancel?.onClick?.(e);
            handleClose();
          }, "onPress"),
          children: /* @__PURE__ */ jsx69(SizableText2, {
            size: "$2",
            color: "$color11",
            children: toast2.cancel.label
          })
        }), toast2.action && /* @__PURE__ */ jsx69(ToastActionFrame, {
          backgroundColor: "$color12",
          hoverStyle: {
            backgroundColor: "$color11"
          },
          pressStyle: {
            backgroundColor: "$color10"
          },
          onPress: /* @__PURE__ */ __name((e) => {
            toast2.action?.onClick?.(e);
            if (!e.defaultPrevented) {
              handleClose();
            }
          }, "onPress"),
          children: /* @__PURE__ */ jsx69(SizableText2, {
            size: "$2",
            fontWeight: "600",
            color: "$background",
            children: toast2.action.label
          })
        })]
      })]
    }), ctx.closeButton && dismissible && /* @__PURE__ */ jsx69(ToastClose, {})]
  });
}
__name(DefaultToastContent, "DefaultToastContent");
function DragWrapper({
  animatedStyle,
  gestureHandlers,
  gesture,
  AnimatedView,
  dragRef,
  children
}) {
  if (isWeb) {
    return /* @__PURE__ */ jsx69("div", {
      ref: dragRef,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        cursor: "default"
      },
      ...gestureHandlers,
      children
    });
  }
  if (gesture) {
    const gh = getGestureHandler();
    const GestureDetector = gh.state.GestureDetector;
    if (GestureDetector) {
      return /* @__PURE__ */ jsx69(GestureDetector, {
        gesture,
        children: /* @__PURE__ */ jsx69(View19, {
          style: {
            flex: 1
          },
          ...{
            collapsable: false
          },
          children: /* @__PURE__ */ jsx69(AnimatedView, {
            style: [{
              flex: 1
            }, animatedStyle],
            children
          })
        })
      });
    }
  }
  return /* @__PURE__ */ jsx69(AnimatedView, {
    style: [{
      flex: 1
    }, animatedStyle],
    ...gestureHandlers,
    children
  });
}
__name(DragWrapper, "DragWrapper");
var ToastItemInner = ToastItemFrame.styleable(/* @__PURE__ */ __name(function ToastItem(props, ref) {
  const {
    toast: toast2,
    index: index2,
    children,
    ...rest
  } = props;
  const ctx = useToastContext();
  const [mounted, setMounted] = React81.useState(false);
  const [removed, setRemoved] = React81.useState(false);
  const [swipeOut, setSwipeOut] = React81.useState(false);
  const [offsetBeforeRemove, setOffsetBeforeRemove] = React81.useState(0);
  const swipeExitYRef = React81.useRef(null);
  const closeTimerRef = React81.useRef(null);
  const closeTimerStartRef = React81.useRef(0);
  const lastPauseTimeRef = React81.useRef(0);
  const remainingTimeRef = React81.useRef(toast2.duration ?? ctx.duration);
  const isFront = index2 === 0;
  const isVisible = index2 < ctx.visibleToasts;
  const toastType = toast2.type ?? "default";
  const dismissible = toast2.dismissible !== false;
  const duration = toast2.duration ?? ctx.duration;
  const [yPosition] = ctx.position.split("-");
  const isTop = yPosition === "top";
  const expandedOffset = isWeb ? (() => {
    let totalHeight = 0;
    let activeCount = 0;
    for (let i = 0; i < index2; i++) {
      const toastId = ctx.toasts[i]?.id;
      if (toastId == null) continue;
      const h = ctx.heights[toastId];
      if (h === 0) continue;
      totalHeight += h ?? ctx.toastHeight;
      activeCount++;
    }
    return totalHeight + activeCount * ctx.gap;
  })() : index2 * (ctx.toastHeight + ctx.gap);
  const expandedOffsetRef = React81.useRef(expandedOffset);
  expandedOffsetRef.current = expandedOffset;
  const isExpandedRef = React81.useRef(ctx.expanded);
  isExpandedRef.current = ctx.expanded;
  const startTimer = React81.useCallback(() => {
    if (duration === Number.POSITIVE_INFINITY || toastType === "loading") return;
    closeTimerStartRef.current = Date.now();
    closeTimerRef.current = setTimeout(() => {
      toast2.onAutoClose?.(toast2);
      setRemoved(true);
      setTimeout(() => ctx.removeToast(toast2), TIME_BEFORE_UNMOUNT);
    }, remainingTimeRef.current);
  }, [duration, toastType, toast2, ctx.removeToast]);
  const pauseTimer = useEvent12(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    if (lastPauseTimeRef.current < closeTimerStartRef.current) {
      const elapsed = Date.now() - closeTimerStartRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
    lastPauseTimeRef.current = Date.now();
  });
  const resumeTimer = useEvent12(() => {
    if (ctx.expanded || ctx.interacting) return;
    remainingTimeRef.current = duration;
    startTimer();
  });
  React81.useEffect(() => {
    setMounted(true);
  }, []);
  React81.useEffect(() => {
    if (toast2.delete) {
      setRemoved(true);
      if (isExpandedRef.current) {
        setOffsetBeforeRemove(expandedOffsetRef.current);
      }
      setTimeout(() => ctx.removeToast(toast2), TIME_BEFORE_UNMOUNT);
    }
  }, [toast2.delete, toast2, ctx.removeToast]);
  React81.useEffect(() => {
    if (ctx.expanded || ctx.interacting) {
      pauseTimer();
    } else {
      startTimer();
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [ctx.expanded, ctx.interacting, startTimer]);
  React81.useEffect(() => {
    remainingTimeRef.current = duration;
  }, [duration]);
  const {
    setDragOffset,
    springBack,
    animateOut,
    animatedStyle,
    AnimatedView,
    dragRef
  } = useToastAnimations({
    reducedMotion: ctx.reducedMotion,
    swipeAxis: ctx.swipeDirection === "up" || ctx.swipeDirection === "down" || ctx.swipeDirection === "vertical" ? "vertical" : "horizontal"
  });
  const {
    isDragging,
    gestureHandlers,
    gesture
  } = useAnimatedDragGesture({
    direction: ctx.swipeDirection,
    threshold: ctx.swipeThreshold,
    disabled: !dismissible || toastType === "loading",
    expanded: ctx.expanded,
    onDragStart: pauseTimer,
    onDragMove: setDragOffset,
    onDismiss: /* @__PURE__ */ __name((exitDirection, velocity) => {
      ctx.triggerDismissCooldown();
      setSwipeOut(true);
      toast2.onDismiss?.(toast2);
      swipeExitYRef.current = isExpandedRef.current ? isTop ? expandedOffsetRef.current : -expandedOffsetRef.current : isFront ? 0 : isTop ? ctx.gap * index2 : -ctx.gap * index2;
      setRemoved(true);
      ctx.removeToast(toast2);
      animateOut(exitDirection, velocity);
    }, "onDismiss"),
    onCancel: /* @__PURE__ */ __name(() => {
      springBack(() => {
        resumeTimer();
      });
    }, "onCancel")
  });
  const handleLayout = React81.useCallback((event) => {
    if (!isWeb) return;
    if (removed) return;
    if (!ctx.expanded && index2 !== 0) return;
    const {
      height
    } = event.nativeEvent.layout;
    ctx.setToastHeight(toast2.id, height);
  }, [toast2.id, ctx.setToastHeight, index2, ctx.expanded, removed]);
  React81.useEffect(() => {
    if (!isWeb) return;
    return () => {
      ctx.removeToastHeight(toast2.id);
    };
  }, [toast2.id, ctx.removeToastHeight]);
  const handleClose = React81.useCallback(() => {
    if (!dismissible) return;
    ctx.triggerDismissCooldown();
    toast2.onDismiss?.(toast2);
    setRemoved(true);
    if (isExpandedRef.current) {
      setOffsetBeforeRemove(expandedOffsetRef.current);
    }
    setTimeout(() => ctx.removeToast(toast2), TIME_BEFORE_UNMOUNT);
  }, [dismissible, toast2, ctx.removeToast, ctx.triggerDismissCooldown]);
  const itemContextValue = React81.useMemo(() => ({
    toast: toast2,
    handleClose
  }), [toast2, handleClose]);
  let frontToastHeight = -1;
  if (isWeb) {
    for (const t of ctx.toasts) {
      const h = ctx.heights[t.id];
      if (h != null && h > 0) {
        frontToastHeight = h;
        break;
      }
    }
  }
  const stackScale = !ctx.expanded && !isFront ? 1 - index2 * 0.05 : 1;
  const activeExpandedOffset = removed ? offsetBeforeRemove : expandedOffset;
  const stackY = ctx.expanded ? isTop ? activeExpandedOffset : -activeExpandedOffset : isFront ? 0 : isTop ? ctx.gap * index2 : -ctx.gap * index2;
  const computedOpacity = removed && !swipeOut ? 0 : index2 >= ctx.visibleToasts ? 0 : 1;
  const computedZIndex = removed ? 0 : ctx.visibleToasts - index2 + 1;
  const computedHeight = isWeb ? ctx.expanded ? ctx.heights[toast2.id] || void 0 : !isFront && frontToastHeight > 0 ? frontToastHeight : void 0 : void 0;
  const computedPointerEvents = index2 >= ctx.visibleToasts ? "none" : "auto";
  const gapFillerHeight = ctx.expanded ? ctx.gap + 1 : 0;
  const dataAttributes = {
    "data-mounted": mounted ? "true" : "false",
    "data-removed": removed ? "true" : "false",
    "data-swipe-out": swipeOut ? "true" : "false",
    "data-visible": isVisible ? "true" : "false",
    "data-front": isFront ? "true" : "false",
    "data-index": String(index2),
    "data-type": toastType,
    "data-expanded": ctx.expanded ? "true" : "false"
  };
  return /* @__PURE__ */ jsx69(ToastPositionWrapper, {
    ref,
    testID: rest.testID,
    accessibilityLabel: rest.accessibilityLabel,
    ...dataAttributes,
    transition: isDragging || ctx.reducedMotion ? void 0 : removed ? "200ms" : "400ms",
    animateOnly: isWeb ? ["transform", "opacity", "height"] : ["transform", "opacity"],
    y: stackY,
    scale: stackScale,
    opacity: computedOpacity,
    zIndex: computedZIndex,
    height: computedHeight,
    overflow: "visible",
    pointerEvents: computedPointerEvents,
    top: isTop ? 0 : void 0,
    bottom: isTop ? void 0 : 0,
    ...isWeb && !isFront && {
      style: {
        transformOrigin: isTop ? "top center" : "bottom center"
      }
    },
    enterStyle: ctx.reducedMotion ? {
      opacity: 0
    } : {
      opacity: 0,
      y: isTop ? -80 : 80
    },
    exitStyle: ctx.reducedMotion ? {
      opacity: 0
    } : swipeOut ? {
      opacity: 0,
      y: swipeExitYRef.current ?? stackY,
      scale: stackScale
    } : {
      opacity: 0,
      y: stackY,
      scale: stackScale
    },
    children: /* @__PURE__ */ jsx69(DragWrapper, {
      animatedStyle,
      gestureHandlers,
      gesture,
      AnimatedView,
      dragRef,
      children: /* @__PURE__ */ jsxs15(ToastItemFrame, {
        role: "status",
        "aria-live": "polite",
        "aria-atomic": true,
        tabIndex: 0,
        onLayout: handleLayout,
        ...isWeb && {
          onKeyDown: /* @__PURE__ */ __name((event) => {
            if (event.key === "Escape" && dismissible) {
              const current = event.currentTarget;
              const container = current.closest("[aria-label]");
              if (container) {
                const focusables = container.querySelectorAll('[tabindex="0"]');
                const arr = Array.from(focusables);
                const idx = arr.indexOf(current);
                const next = arr[idx + 1] || arr[idx - 1];
                next?.focus();
              }
              handleClose();
            }
          }, "onKeyDown")
        },
        ...rest,
        children: [ctx.expanded && gapFillerHeight > 0 && /* @__PURE__ */ jsx69(View19, {
          position: "absolute",
          left: 0,
          right: 0,
          height: gapFillerHeight,
          pointerEvents: "auto",
          ...isTop ? {
            top: "100%"
          } : {
            bottom: "100%"
          }
        }), /* @__PURE__ */ jsx69(ToastItemContext.Provider, {
          value: itemContextValue,
          children
        })]
      })
    })
  });
}, "ToastItem"));
var ToastTitle = styled38(SizableText2, {
  name: "ToastTitle",
  variants: {
    unstyled: {
      false: {
        color: "$color",
        fontWeight: "600",
        size: "$4"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ToastDescription = styled38(SizableText2, {
  name: "ToastDescription",
  variants: {
    unstyled: {
      false: {
        color: "$color11",
        size: "$2"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.GUI_HEADLESS === "1"
  }
});
var ToastClose = ToastCloseFrame.styleable(/* @__PURE__ */ __name(function ToastClose2(props, ref) {
  let handleClose;
  try {
    const itemCtx = useToastItemContext();
    handleClose = itemCtx.handleClose;
  } catch {
  }
  const ctx = useToastContext();
  return /* @__PURE__ */ jsx69(ToastCloseFrame, {
    ref,
    "aria-label": "Close toast",
    onPress: handleClose,
    ...props,
    children: props.children ?? ctx.icons?.close ?? /* @__PURE__ */ jsx69(DefaultCloseIcon, {})
  });
}, "ToastClose2"));
var ToastAction = ToastActionFrame.styleable(/* @__PURE__ */ __name(function ToastAction2(props, ref) {
  return /* @__PURE__ */ jsx69(ToastActionFrame, {
    ref,
    ...props
  });
}, "ToastAction2"));
function ToastIcon(props) {
  const ctx = useToastContext();
  let toast2;
  try {
    const itemCtx = useToastItemContext();
    toast2 = itemCtx.toast;
  } catch {
    return null;
  }
  if (!toast2) return null;
  if (toast2.icon !== void 0) {
    return /* @__PURE__ */ jsx69(View19, {
      flexShrink: 0,
      marginTop: "$0.5",
      children: toast2.icon
    });
  }
  const toastType = toast2.type ?? "default";
  const icon = ctx.icons?.[toastType] ?? null;
  if (!icon) return null;
  return /* @__PURE__ */ jsx69(View19, {
    flexShrink: 0,
    marginTop: "$0.5",
    children: icon
  });
}
__name(ToastIcon, "ToastIcon");
ToastRoot.displayName = "Toast";
var Toast = withStaticProperties(ToastRoot, {
  Viewport: ToastViewport,
  List: ToastList,
  Item: ToastItemInner,
  Title: ToastTitle,
  Description: ToastDescription,
  Close: ToastClose,
  Action: ToastAction,
  Icon: ToastIcon
});

// node_modules/.pnpm/@hanzogui+toast@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-native@0.83.9_@b_97ea6d70c6190afc421933f55efa49e5/node_modules/@hanzogui/toast/dist/esm/Toaster.mjs
import * as React82 from "react";
import { jsx as jsx70 } from "react/jsx-runtime";
var Toaster = React82.forwardRef(/* @__PURE__ */ __name(function Toaster2(props, ref) {
  const {
    position: position2 = "bottom-right",
    expand = false,
    visibleToasts,
    gap,
    duration,
    offset: offset4,
    hotkey,
    swipeDirection,
    swipeThreshold,
    closeButton,
    theme,
    icons,
    toastOptions,
    containerAriaLabel = "Notifications",
    native,
    burntOptions,
    notificationOptions,
    reducedMotion
  } = props;
  return /* @__PURE__ */ jsx70(Toast, {
    position: position2,
    expand,
    visibleToasts,
    gap,
    duration: toastOptions?.duration ?? duration,
    swipeDirection,
    swipeThreshold,
    closeButton,
    theme,
    icons,
    native,
    burntOptions,
    notificationOptions,
    reducedMotion,
    children: /* @__PURE__ */ jsx70(Toast.Viewport, {
      ref,
      offset: offset4,
      hotkey,
      label: containerAriaLabel,
      children: /* @__PURE__ */ jsx70(Toast.List, {})
    })
  });
}, "Toaster2"));
Toaster.displayName = "Toaster";

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/toaster.js
import { forwardRef as forwardRef28 } from "react";
var Toaster3 = /* @__PURE__ */ forwardRef28(/* @__PURE__ */ __name(function Toaster4(props, ref) {
  const { theme = "system", toastOptions, richColors: _richColors, ...rest } = props;
  return _jsx24(Toaster, { ref, theme, toastOptions, ...rest });
}, "Toaster"));

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/backends/gui/tooltip.js
import { jsx as _jsx25 } from "react/jsx-runtime";
var DEFAULT_OFFSET3 = 4;
var Tooltip3 = /* @__PURE__ */ __name((props) => _jsx25(Tooltip2, { offset: DEFAULT_OFFSET3, ...props }), "Tooltip");
var TooltipTrigger3 = Tooltip2.Trigger;
var TooltipProvider = TooltipGroup;
var TooltipContent2 = /* @__PURE__ */ __name(({ sideOffset: _sideOffset, children, ...props }) => {
  const themeName = useThemeName5();
  return _jsx25(PortalTheme, { name: themeName, children: _jsx25(Tooltip2.Content, { ...slot("tooltip-content"), bg: "$color2", borderWidth: 1, borderColor: "$borderColor", rounded: "$3", px: "$3", py: "$1.5", ...props, children: ink(children, void 0, { size: "$1" }) }) });
}, "TooltipContent");

// node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
__name(r, "r");
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
__name(clsx, "clsx");

// node_modules/.pnpm/@hanzo+ui@8.0.33_a4c65431bb5d57eb7457afd7a769198a/node_modules/@hanzo/ui/dist/core/cn.js
function cn(...inputs) {
  return clsx(inputs);
}
__name(cn, "cn");
export {
  AspectRatio,
  Avatar2 as Avatar,
  AvatarFallback2 as AvatarFallback,
  AvatarImage2 as AvatarImage,
  Badge,
  Button2 as Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox2 as Checkbox,
  Collapsible2 as Collapsible,
  CollapsibleContent2 as CollapsibleContent,
  CollapsibleTrigger2 as CollapsibleTrigger,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Dialog3 as Dialog,
  DialogClose2 as DialogClose,
  DialogContent3 as DialogContent,
  DialogDescription3 as DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay3 as DialogOverlay,
  DialogPortal2 as DialogPortal,
  DialogTitle3 as DialogTitle,
  DialogTrigger3 as DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input2 as Input,
  Label3 as Label,
  Popover3 as Popover,
  PopoverAnchor3 as PopoverAnchor,
  PopoverClose3 as PopoverClose,
  PopoverContent3 as PopoverContent,
  PopoverTrigger3 as PopoverTrigger,
  Progress3 as Progress,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  ScrollBar,
  Select3 as Select,
  SelectContent2 as SelectContent,
  SelectGroup2 as SelectGroup,
  SelectItem3 as SelectItem,
  SelectLabel2 as SelectLabel,
  SelectScrollDownButton2 as SelectScrollDownButton,
  SelectScrollUpButton2 as SelectScrollUpButton,
  SelectSeparator2 as SelectSeparator,
  SelectTrigger3 as SelectTrigger,
  SelectValue3 as SelectValue,
  Separator2 as Separator,
  Slider2 as Slider,
  Switch2 as Switch,
  Tabs2 as Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster3 as Toaster,
  Tooltip3 as Tooltip,
  TooltipContent2 as TooltipContent,
  TooltipProvider,
  TooltipTrigger3 as TooltipTrigger,
  badgeVariants,
  buttonVariants,
  cn,
  toast
};

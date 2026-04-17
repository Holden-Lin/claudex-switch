#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/yoctocolors-cjs/index.js
var require_yoctocolors_cjs = __commonJS((exports, module) => {
  var tty2 = __require("node:tty");
  var hasColors = tty2?.WriteStream?.prototype?.hasColors?.() ?? false;
  var format = (open, close) => {
    if (!hasColors) {
      return (input) => input;
    }
    const openCode = `\x1B[${open}m`;
    const closeCode = `\x1B[${close}m`;
    return (input) => {
      const string = input + "";
      let index = string.indexOf(closeCode);
      if (index === -1) {
        return openCode + string + closeCode;
      }
      let result = openCode;
      let lastIndex = 0;
      const reopenOnNestedClose = close === 22;
      const replaceCode = (reopenOnNestedClose ? closeCode : "") + openCode;
      while (index !== -1) {
        result += string.slice(lastIndex, index) + replaceCode;
        lastIndex = index + closeCode.length;
        index = string.indexOf(closeCode, lastIndex);
      }
      result += string.slice(lastIndex) + closeCode;
      return result;
    };
  };
  var colors = {};
  colors.reset = format(0, 0);
  colors.bold = format(1, 22);
  colors.dim = format(2, 22);
  colors.italic = format(3, 23);
  colors.underline = format(4, 24);
  colors.overline = format(53, 55);
  colors.inverse = format(7, 27);
  colors.hidden = format(8, 28);
  colors.strikethrough = format(9, 29);
  colors.black = format(30, 39);
  colors.red = format(31, 39);
  colors.green = format(32, 39);
  colors.yellow = format(33, 39);
  colors.blue = format(34, 39);
  colors.magenta = format(35, 39);
  colors.cyan = format(36, 39);
  colors.white = format(37, 39);
  colors.gray = format(90, 39);
  colors.bgBlack = format(40, 49);
  colors.bgRed = format(41, 49);
  colors.bgGreen = format(42, 49);
  colors.bgYellow = format(43, 49);
  colors.bgBlue = format(44, 49);
  colors.bgMagenta = format(45, 49);
  colors.bgCyan = format(46, 49);
  colors.bgWhite = format(47, 49);
  colors.bgGray = format(100, 49);
  colors.redBright = format(91, 39);
  colors.greenBright = format(92, 39);
  colors.yellowBright = format(93, 39);
  colors.blueBright = format(94, 39);
  colors.magentaBright = format(95, 39);
  colors.cyanBright = format(96, 39);
  colors.whiteBright = format(97, 39);
  colors.bgRedBright = format(101, 49);
  colors.bgGreenBright = format(102, 49);
  colors.bgYellowBright = format(103, 49);
  colors.bgBlueBright = format(104, 49);
  colors.bgMagentaBright = format(105, 49);
  colors.bgCyanBright = format(106, 49);
  colors.bgWhiteBright = format(107, 49);
  module.exports = colors;
});

// node_modules/cli-width/index.js
var require_cli_width = __commonJS((exports, module) => {
  module.exports = cliWidth;
  function normalizeOpts(options) {
    const defaultOpts = {
      defaultWidth: 0,
      output: process.stdout,
      tty: __require("tty")
    };
    if (!options) {
      return defaultOpts;
    }
    Object.keys(defaultOpts).forEach(function(key) {
      if (!options[key]) {
        options[key] = defaultOpts[key];
      }
    });
    return options;
  }
  function cliWidth(options) {
    const opts = normalizeOpts(options);
    if (opts.output.getWindowSize) {
      return opts.output.getWindowSize()[0] || opts.defaultWidth;
    }
    if (opts.tty.getWindowSize) {
      return opts.tty.getWindowSize()[1] || opts.defaultWidth;
    }
    if (opts.output.columns) {
      return opts.output.columns;
    }
    if (process.env.CLI_WIDTH) {
      const width = parseInt(process.env.CLI_WIDTH, 10);
      if (!isNaN(width) && width !== 0) {
        return width;
      }
    }
    return opts.defaultWidth;
  }
});

// node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS((exports, module) => {
  module.exports = ({ onlyFirst = false } = {}) => {
    const pattern = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");
    return new RegExp(pattern, onlyFirst ? undefined : "g");
  };
});

// node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS((exports, module) => {
  var ansiRegex = require_ansi_regex();
  module.exports = (string) => typeof string === "string" ? string.replace(ansiRegex(), "") : string;
});

// node_modules/is-fullwidth-code-point/index.js
var require_is_fullwidth_code_point = __commonJS((exports, module) => {
  var isFullwidthCodePoint = (codePoint) => {
    if (Number.isNaN(codePoint)) {
      return false;
    }
    if (codePoint >= 4352 && (codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || 11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || 12880 <= codePoint && codePoint <= 19903 || 19968 <= codePoint && codePoint <= 42182 || 43360 <= codePoint && codePoint <= 43388 || 44032 <= codePoint && codePoint <= 55203 || 63744 <= codePoint && codePoint <= 64255 || 65040 <= codePoint && codePoint <= 65049 || 65072 <= codePoint && codePoint <= 65131 || 65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || 110592 <= codePoint && codePoint <= 110593 || 127488 <= codePoint && codePoint <= 127569 || 131072 <= codePoint && codePoint <= 262141)) {
      return true;
    }
    return false;
  };
  module.exports = isFullwidthCodePoint;
  module.exports.default = isFullwidthCodePoint;
});

// node_modules/emoji-regex/index.js
var require_emoji_regex = __commonJS((exports, module) => {
  module.exports = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
});

// node_modules/string-width/index.js
var require_string_width = __commonJS((exports, module) => {
  var stripAnsi = require_strip_ansi();
  var isFullwidthCodePoint = require_is_fullwidth_code_point();
  var emojiRegex = require_emoji_regex();
  var stringWidth = (string) => {
    if (typeof string !== "string" || string.length === 0) {
      return 0;
    }
    string = stripAnsi(string);
    if (string.length === 0) {
      return 0;
    }
    string = string.replace(emojiRegex(), "  ");
    let width = 0;
    for (let i = 0;i < string.length; i++) {
      const code = string.codePointAt(i);
      if (code <= 31 || code >= 127 && code <= 159) {
        continue;
      }
      if (code >= 768 && code <= 879) {
        continue;
      }
      if (code > 65535) {
        i++;
      }
      width += isFullwidthCodePoint(code) ? 2 : 1;
    }
    return width;
  };
  module.exports = stringWidth;
  module.exports.default = stringWidth;
});

// node_modules/color-name/index.js
var require_color_name = __commonJS((exports, module) => {
  module.exports = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50]
  };
});

// node_modules/color-convert/conversions.js
var require_conversions = __commonJS((exports, module) => {
  var cssKeywords = require_color_name();
  var reverseKeywords = {};
  for (const key of Object.keys(cssKeywords)) {
    reverseKeywords[cssKeywords[key]] = key;
  }
  var convert = {
    rgb: { channels: 3, labels: "rgb" },
    hsl: { channels: 3, labels: "hsl" },
    hsv: { channels: 3, labels: "hsv" },
    hwb: { channels: 3, labels: "hwb" },
    cmyk: { channels: 4, labels: "cmyk" },
    xyz: { channels: 3, labels: "xyz" },
    lab: { channels: 3, labels: "lab" },
    lch: { channels: 3, labels: "lch" },
    hex: { channels: 1, labels: ["hex"] },
    keyword: { channels: 1, labels: ["keyword"] },
    ansi16: { channels: 1, labels: ["ansi16"] },
    ansi256: { channels: 1, labels: ["ansi256"] },
    hcg: { channels: 3, labels: ["h", "c", "g"] },
    apple: { channels: 3, labels: ["r16", "g16", "b16"] },
    gray: { channels: 1, labels: ["gray"] }
  };
  module.exports = convert;
  for (const model of Object.keys(convert)) {
    if (!("channels" in convert[model])) {
      throw new Error("missing channels property: " + model);
    }
    if (!("labels" in convert[model])) {
      throw new Error("missing channel labels property: " + model);
    }
    if (convert[model].labels.length !== convert[model].channels) {
      throw new Error("channel and label counts mismatch: " + model);
    }
    const { channels, labels } = convert[model];
    delete convert[model].channels;
    delete convert[model].labels;
    Object.defineProperty(convert[model], "channels", { value: channels });
    Object.defineProperty(convert[model], "labels", { value: labels });
  }
  convert.rgb.hsl = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    let h;
    let s;
    if (max === min) {
      h = 0;
    } else if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else if (b === max) {
      h = 4 + (r - g) / delta;
    }
    h = Math.min(h * 60, 360);
    if (h < 0) {
      h += 360;
    }
    const l = (min + max) / 2;
    if (max === min) {
      s = 0;
    } else if (l <= 0.5) {
      s = delta / (max + min);
    } else {
      s = delta / (2 - max - min);
    }
    return [h, s * 100, l * 100];
  };
  convert.rgb.hsv = function(rgb) {
    let rdif;
    let gdif;
    let bdif;
    let h;
    let s;
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    const diffc = function(c) {
      return (v - c) / 6 / diff + 1 / 2;
    };
    if (diff === 0) {
      h = 0;
      s = 0;
    } else {
      s = diff / v;
      rdif = diffc(r);
      gdif = diffc(g);
      bdif = diffc(b);
      if (r === v) {
        h = bdif - gdif;
      } else if (g === v) {
        h = 1 / 3 + rdif - bdif;
      } else if (b === v) {
        h = 2 / 3 + gdif - rdif;
      }
      if (h < 0) {
        h += 1;
      } else if (h > 1) {
        h -= 1;
      }
    }
    return [
      h * 360,
      s * 100,
      v * 100
    ];
  };
  convert.rgb.hwb = function(rgb) {
    const r = rgb[0];
    const g = rgb[1];
    let b = rgb[2];
    const h = convert.rgb.hsl(rgb)[0];
    const w = 1 / 255 * Math.min(r, Math.min(g, b));
    b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
    return [h, w * 100, b * 100];
  };
  convert.rgb.cmyk = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const k = Math.min(1 - r, 1 - g, 1 - b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;
    return [c * 100, m * 100, y * 100, k * 100];
  };
  function comparativeDistance(x, y) {
    return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
  }
  convert.rgb.keyword = function(rgb) {
    const reversed = reverseKeywords[rgb];
    if (reversed) {
      return reversed;
    }
    let currentClosestDistance = Infinity;
    let currentClosestKeyword;
    for (const keyword of Object.keys(cssKeywords)) {
      const value = cssKeywords[keyword];
      const distance = comparativeDistance(rgb, value);
      if (distance < currentClosestDistance) {
        currentClosestDistance = distance;
        currentClosestKeyword = keyword;
      }
    }
    return currentClosestKeyword;
  };
  convert.keyword.rgb = function(keyword) {
    return cssKeywords[keyword];
  };
  convert.rgb.xyz = function(rgb) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;
    r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
    g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
    b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    return [x * 100, y * 100, z * 100];
  };
  convert.rgb.lab = function(rgb) {
    const xyz = convert.rgb.xyz(rgb);
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];
    x /= 95.047;
    y /= 100;
    z /= 108.883;
    x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
    const l = 116 * y - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    return [l, a, b];
  };
  convert.hsl.rgb = function(hsl) {
    const h = hsl[0] / 360;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;
    let t2;
    let t3;
    let val;
    if (s === 0) {
      val = l * 255;
      return [val, val, val];
    }
    if (l < 0.5) {
      t2 = l * (1 + s);
    } else {
      t2 = l + s - l * s;
    }
    const t1 = 2 * l - t2;
    const rgb = [0, 0, 0];
    for (let i = 0;i < 3; i++) {
      t3 = h + 1 / 3 * -(i - 1);
      if (t3 < 0) {
        t3++;
      }
      if (t3 > 1) {
        t3--;
      }
      if (6 * t3 < 1) {
        val = t1 + (t2 - t1) * 6 * t3;
      } else if (2 * t3 < 1) {
        val = t2;
      } else if (3 * t3 < 2) {
        val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
      } else {
        val = t1;
      }
      rgb[i] = val * 255;
    }
    return rgb;
  };
  convert.hsl.hsv = function(hsl) {
    const h = hsl[0];
    let s = hsl[1] / 100;
    let l = hsl[2] / 100;
    let smin = s;
    const lmin = Math.max(l, 0.01);
    l *= 2;
    s *= l <= 1 ? l : 2 - l;
    smin *= lmin <= 1 ? lmin : 2 - lmin;
    const v = (l + s) / 2;
    const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
    return [h, sv * 100, v * 100];
  };
  convert.hsv.rgb = function(hsv) {
    const h = hsv[0] / 60;
    const s = hsv[1] / 100;
    let v = hsv[2] / 100;
    const hi = Math.floor(h) % 6;
    const f = h - Math.floor(h);
    const p = 255 * v * (1 - s);
    const q = 255 * v * (1 - s * f);
    const t = 255 * v * (1 - s * (1 - f));
    v *= 255;
    switch (hi) {
      case 0:
        return [v, t, p];
      case 1:
        return [q, v, p];
      case 2:
        return [p, v, t];
      case 3:
        return [p, q, v];
      case 4:
        return [t, p, v];
      case 5:
        return [v, p, q];
    }
  };
  convert.hsv.hsl = function(hsv) {
    const h = hsv[0];
    const s = hsv[1] / 100;
    const v = hsv[2] / 100;
    const vmin = Math.max(v, 0.01);
    let sl;
    let l;
    l = (2 - s) * v;
    const lmin = (2 - s) * vmin;
    sl = s * vmin;
    sl /= lmin <= 1 ? lmin : 2 - lmin;
    sl = sl || 0;
    l /= 2;
    return [h, sl * 100, l * 100];
  };
  convert.hwb.rgb = function(hwb) {
    const h = hwb[0] / 360;
    let wh = hwb[1] / 100;
    let bl = hwb[2] / 100;
    const ratio = wh + bl;
    let f;
    if (ratio > 1) {
      wh /= ratio;
      bl /= ratio;
    }
    const i = Math.floor(6 * h);
    const v = 1 - bl;
    f = 6 * h - i;
    if ((i & 1) !== 0) {
      f = 1 - f;
    }
    const n = wh + f * (v - wh);
    let r;
    let g;
    let b;
    switch (i) {
      default:
      case 6:
      case 0:
        r = v;
        g = n;
        b = wh;
        break;
      case 1:
        r = n;
        g = v;
        b = wh;
        break;
      case 2:
        r = wh;
        g = v;
        b = n;
        break;
      case 3:
        r = wh;
        g = n;
        b = v;
        break;
      case 4:
        r = n;
        g = wh;
        b = v;
        break;
      case 5:
        r = v;
        g = wh;
        b = n;
        break;
    }
    return [r * 255, g * 255, b * 255];
  };
  convert.cmyk.rgb = function(cmyk) {
    const c = cmyk[0] / 100;
    const m = cmyk[1] / 100;
    const y = cmyk[2] / 100;
    const k = cmyk[3] / 100;
    const r = 1 - Math.min(1, c * (1 - k) + k);
    const g = 1 - Math.min(1, m * (1 - k) + k);
    const b = 1 - Math.min(1, y * (1 - k) + k);
    return [r * 255, g * 255, b * 255];
  };
  convert.xyz.rgb = function(xyz) {
    const x = xyz[0] / 100;
    const y = xyz[1] / 100;
    const z = xyz[2] / 100;
    let r;
    let g;
    let b;
    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.204 + z * 1.057;
    r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
    g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92;
    b = b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92;
    r = Math.min(Math.max(0, r), 1);
    g = Math.min(Math.max(0, g), 1);
    b = Math.min(Math.max(0, b), 1);
    return [r * 255, g * 255, b * 255];
  };
  convert.xyz.lab = function(xyz) {
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];
    x /= 95.047;
    y /= 100;
    z /= 108.883;
    x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
    const l = 116 * y - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    return [l, a, b];
  };
  convert.lab.xyz = function(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];
    let x;
    let y;
    let z;
    y = (l + 16) / 116;
    x = a / 500 + y;
    z = y - b / 200;
    const y2 = y ** 3;
    const x2 = x ** 3;
    const z2 = z ** 3;
    y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
    x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
    z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;
    x *= 95.047;
    y *= 100;
    z *= 108.883;
    return [x, y, z];
  };
  convert.lab.lch = function(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];
    let h;
    const hr = Math.atan2(b, a);
    h = hr * 360 / 2 / Math.PI;
    if (h < 0) {
      h += 360;
    }
    const c = Math.sqrt(a * a + b * b);
    return [l, c, h];
  };
  convert.lch.lab = function(lch) {
    const l = lch[0];
    const c = lch[1];
    const h = lch[2];
    const hr = h / 360 * 2 * Math.PI;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    return [l, a, b];
  };
  convert.rgb.ansi16 = function(args, saturation = null) {
    const [r, g, b] = args;
    let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
    value = Math.round(value / 50);
    if (value === 0) {
      return 30;
    }
    let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
    if (value === 2) {
      ansi += 60;
    }
    return ansi;
  };
  convert.hsv.ansi16 = function(args) {
    return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
  };
  convert.rgb.ansi256 = function(args) {
    const r = args[0];
    const g = args[1];
    const b = args[2];
    if (r === g && g === b) {
      if (r < 8) {
        return 16;
      }
      if (r > 248) {
        return 231;
      }
      return Math.round((r - 8) / 247 * 24) + 232;
    }
    const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
    return ansi;
  };
  convert.ansi16.rgb = function(args) {
    let color = args % 10;
    if (color === 0 || color === 7) {
      if (args > 50) {
        color += 3.5;
      }
      color = color / 10.5 * 255;
      return [color, color, color];
    }
    const mult = (~~(args > 50) + 1) * 0.5;
    const r = (color & 1) * mult * 255;
    const g = (color >> 1 & 1) * mult * 255;
    const b = (color >> 2 & 1) * mult * 255;
    return [r, g, b];
  };
  convert.ansi256.rgb = function(args) {
    if (args >= 232) {
      const c = (args - 232) * 10 + 8;
      return [c, c, c];
    }
    args -= 16;
    let rem;
    const r = Math.floor(args / 36) / 5 * 255;
    const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
    const b = rem % 6 / 5 * 255;
    return [r, g, b];
  };
  convert.rgb.hex = function(args) {
    const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
    const string = integer.toString(16).toUpperCase();
    return "000000".substring(string.length) + string;
  };
  convert.hex.rgb = function(args) {
    const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
    if (!match) {
      return [0, 0, 0];
    }
    let colorString = match[0];
    if (match[0].length === 3) {
      colorString = colorString.split("").map((char) => {
        return char + char;
      }).join("");
    }
    const integer = parseInt(colorString, 16);
    const r = integer >> 16 & 255;
    const g = integer >> 8 & 255;
    const b = integer & 255;
    return [r, g, b];
  };
  convert.rgb.hcg = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const max = Math.max(Math.max(r, g), b);
    const min = Math.min(Math.min(r, g), b);
    const chroma = max - min;
    let grayscale;
    let hue;
    if (chroma < 1) {
      grayscale = min / (1 - chroma);
    } else {
      grayscale = 0;
    }
    if (chroma <= 0) {
      hue = 0;
    } else if (max === r) {
      hue = (g - b) / chroma % 6;
    } else if (max === g) {
      hue = 2 + (b - r) / chroma;
    } else {
      hue = 4 + (r - g) / chroma;
    }
    hue /= 6;
    hue %= 1;
    return [hue * 360, chroma * 100, grayscale * 100];
  };
  convert.hsl.hcg = function(hsl) {
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;
    const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
    let f = 0;
    if (c < 1) {
      f = (l - 0.5 * c) / (1 - c);
    }
    return [hsl[0], c * 100, f * 100];
  };
  convert.hsv.hcg = function(hsv) {
    const s = hsv[1] / 100;
    const v = hsv[2] / 100;
    const c = s * v;
    let f = 0;
    if (c < 1) {
      f = (v - c) / (1 - c);
    }
    return [hsv[0], c * 100, f * 100];
  };
  convert.hcg.rgb = function(hcg) {
    const h = hcg[0] / 360;
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    if (c === 0) {
      return [g * 255, g * 255, g * 255];
    }
    const pure = [0, 0, 0];
    const hi = h % 1 * 6;
    const v = hi % 1;
    const w = 1 - v;
    let mg = 0;
    switch (Math.floor(hi)) {
      case 0:
        pure[0] = 1;
        pure[1] = v;
        pure[2] = 0;
        break;
      case 1:
        pure[0] = w;
        pure[1] = 1;
        pure[2] = 0;
        break;
      case 2:
        pure[0] = 0;
        pure[1] = 1;
        pure[2] = v;
        break;
      case 3:
        pure[0] = 0;
        pure[1] = w;
        pure[2] = 1;
        break;
      case 4:
        pure[0] = v;
        pure[1] = 0;
        pure[2] = 1;
        break;
      default:
        pure[0] = 1;
        pure[1] = 0;
        pure[2] = w;
    }
    mg = (1 - c) * g;
    return [
      (c * pure[0] + mg) * 255,
      (c * pure[1] + mg) * 255,
      (c * pure[2] + mg) * 255
    ];
  };
  convert.hcg.hsv = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const v = c + g * (1 - c);
    let f = 0;
    if (v > 0) {
      f = c / v;
    }
    return [hcg[0], f * 100, v * 100];
  };
  convert.hcg.hsl = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const l = g * (1 - c) + 0.5 * c;
    let s = 0;
    if (l > 0 && l < 0.5) {
      s = c / (2 * l);
    } else if (l >= 0.5 && l < 1) {
      s = c / (2 * (1 - l));
    }
    return [hcg[0], s * 100, l * 100];
  };
  convert.hcg.hwb = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const v = c + g * (1 - c);
    return [hcg[0], (v - c) * 100, (1 - v) * 100];
  };
  convert.hwb.hcg = function(hwb) {
    const w = hwb[1] / 100;
    const b = hwb[2] / 100;
    const v = 1 - b;
    const c = v - w;
    let g = 0;
    if (c < 1) {
      g = (v - c) / (1 - c);
    }
    return [hwb[0], c * 100, g * 100];
  };
  convert.apple.rgb = function(apple) {
    return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
  };
  convert.rgb.apple = function(rgb) {
    return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
  };
  convert.gray.rgb = function(args) {
    return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
  };
  convert.gray.hsl = function(args) {
    return [0, 0, args[0]];
  };
  convert.gray.hsv = convert.gray.hsl;
  convert.gray.hwb = function(gray) {
    return [0, 100, gray[0]];
  };
  convert.gray.cmyk = function(gray) {
    return [0, 0, 0, gray[0]];
  };
  convert.gray.lab = function(gray) {
    return [gray[0], 0, 0];
  };
  convert.gray.hex = function(gray) {
    const val = Math.round(gray[0] / 100 * 255) & 255;
    const integer = (val << 16) + (val << 8) + val;
    const string = integer.toString(16).toUpperCase();
    return "000000".substring(string.length) + string;
  };
  convert.rgb.gray = function(rgb) {
    const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
    return [val / 255 * 100];
  };
});

// node_modules/color-convert/route.js
var require_route = __commonJS((exports, module) => {
  var conversions = require_conversions();
  function buildGraph() {
    const graph = {};
    const models = Object.keys(conversions);
    for (let len = models.length, i = 0;i < len; i++) {
      graph[models[i]] = {
        distance: -1,
        parent: null
      };
    }
    return graph;
  }
  function deriveBFS(fromModel) {
    const graph = buildGraph();
    const queue = [fromModel];
    graph[fromModel].distance = 0;
    while (queue.length) {
      const current = queue.pop();
      const adjacents = Object.keys(conversions[current]);
      for (let len = adjacents.length, i = 0;i < len; i++) {
        const adjacent = adjacents[i];
        const node = graph[adjacent];
        if (node.distance === -1) {
          node.distance = graph[current].distance + 1;
          node.parent = current;
          queue.unshift(adjacent);
        }
      }
    }
    return graph;
  }
  function link(from, to) {
    return function(args) {
      return to(from(args));
    };
  }
  function wrapConversion(toModel, graph) {
    const path = [graph[toModel].parent, toModel];
    let fn = conversions[graph[toModel].parent][toModel];
    let cur = graph[toModel].parent;
    while (graph[cur].parent) {
      path.unshift(graph[cur].parent);
      fn = link(conversions[graph[cur].parent][cur], fn);
      cur = graph[cur].parent;
    }
    fn.conversion = path;
    return fn;
  }
  module.exports = function(fromModel) {
    const graph = deriveBFS(fromModel);
    const conversion = {};
    const models = Object.keys(graph);
    for (let len = models.length, i = 0;i < len; i++) {
      const toModel = models[i];
      const node = graph[toModel];
      if (node.parent === null) {
        continue;
      }
      conversion[toModel] = wrapConversion(toModel, graph);
    }
    return conversion;
  };
});

// node_modules/color-convert/index.js
var require_color_convert = __commonJS((exports, module) => {
  var conversions = require_conversions();
  var route = require_route();
  var convert = {};
  var models = Object.keys(conversions);
  function wrapRaw(fn) {
    const wrappedFn = function(...args) {
      const arg0 = args[0];
      if (arg0 === undefined || arg0 === null) {
        return arg0;
      }
      if (arg0.length > 1) {
        args = arg0;
      }
      return fn(args);
    };
    if ("conversion" in fn) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  function wrapRounded(fn) {
    const wrappedFn = function(...args) {
      const arg0 = args[0];
      if (arg0 === undefined || arg0 === null) {
        return arg0;
      }
      if (arg0.length > 1) {
        args = arg0;
      }
      const result = fn(args);
      if (typeof result === "object") {
        for (let len = result.length, i = 0;i < len; i++) {
          result[i] = Math.round(result[i]);
        }
      }
      return result;
    };
    if ("conversion" in fn) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  models.forEach((fromModel) => {
    convert[fromModel] = {};
    Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
    Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
    const routes = route(fromModel);
    const routeModels = Object.keys(routes);
    routeModels.forEach((toModel) => {
      const fn = routes[toModel];
      convert[fromModel][toModel] = wrapRounded(fn);
      convert[fromModel][toModel].raw = wrapRaw(fn);
    });
  });
  module.exports = convert;
});

// node_modules/ansi-styles/index.js
var require_ansi_styles = __commonJS((exports, module) => {
  var wrapAnsi162 = (fn, offset) => (...args) => {
    const code = fn(...args);
    return `\x1B[${code + offset}m`;
  };
  var wrapAnsi2562 = (fn, offset) => (...args) => {
    const code = fn(...args);
    return `\x1B[${38 + offset};5;${code}m`;
  };
  var wrapAnsi16m2 = (fn, offset) => (...args) => {
    const rgb = fn(...args);
    return `\x1B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
  };
  var ansi2ansi = (n) => n;
  var rgb2rgb = (r, g, b) => [r, g, b];
  var setLazyProperty = (object, property, get) => {
    Object.defineProperty(object, property, {
      get: () => {
        const value = get();
        Object.defineProperty(object, property, {
          value,
          enumerable: true,
          configurable: true
        });
        return value;
      },
      enumerable: true,
      configurable: true
    });
  };
  var colorConvert;
  var makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
    if (colorConvert === undefined) {
      colorConvert = require_color_convert();
    }
    const offset = isBackground ? 10 : 0;
    const styles3 = {};
    for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
      const name = sourceSpace === "ansi16" ? "ansi" : sourceSpace;
      if (sourceSpace === targetSpace) {
        styles3[name] = wrap(identity, offset);
      } else if (typeof suite === "object") {
        styles3[name] = wrap(suite[targetSpace], offset);
      }
    }
    return styles3;
  };
  function assembleStyles2() {
    const codes = new Map;
    const styles3 = {
      modifier: {
        reset: [0, 0],
        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29]
      },
      color: {
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        blackBright: [90, 39],
        redBright: [91, 39],
        greenBright: [92, 39],
        yellowBright: [93, 39],
        blueBright: [94, 39],
        magentaBright: [95, 39],
        cyanBright: [96, 39],
        whiteBright: [97, 39]
      },
      bgColor: {
        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        bgBlackBright: [100, 49],
        bgRedBright: [101, 49],
        bgGreenBright: [102, 49],
        bgYellowBright: [103, 49],
        bgBlueBright: [104, 49],
        bgMagentaBright: [105, 49],
        bgCyanBright: [106, 49],
        bgWhiteBright: [107, 49]
      }
    };
    styles3.color.gray = styles3.color.blackBright;
    styles3.bgColor.bgGray = styles3.bgColor.bgBlackBright;
    styles3.color.grey = styles3.color.blackBright;
    styles3.bgColor.bgGrey = styles3.bgColor.bgBlackBright;
    for (const [groupName, group] of Object.entries(styles3)) {
      for (const [styleName, style] of Object.entries(group)) {
        styles3[styleName] = {
          open: `\x1B[${style[0]}m`,
          close: `\x1B[${style[1]}m`
        };
        group[styleName] = styles3[styleName];
        codes.set(style[0], style[1]);
      }
      Object.defineProperty(styles3, groupName, {
        value: group,
        enumerable: false
      });
    }
    Object.defineProperty(styles3, "codes", {
      value: codes,
      enumerable: false
    });
    styles3.color.close = "\x1B[39m";
    styles3.bgColor.close = "\x1B[49m";
    setLazyProperty(styles3.color, "ansi", () => makeDynamicStyles(wrapAnsi162, "ansi16", ansi2ansi, false));
    setLazyProperty(styles3.color, "ansi256", () => makeDynamicStyles(wrapAnsi2562, "ansi256", ansi2ansi, false));
    setLazyProperty(styles3.color, "ansi16m", () => makeDynamicStyles(wrapAnsi16m2, "rgb", rgb2rgb, false));
    setLazyProperty(styles3.bgColor, "ansi", () => makeDynamicStyles(wrapAnsi162, "ansi16", ansi2ansi, true));
    setLazyProperty(styles3.bgColor, "ansi256", () => makeDynamicStyles(wrapAnsi2562, "ansi256", ansi2ansi, true));
    setLazyProperty(styles3.bgColor, "ansi16m", () => makeDynamicStyles(wrapAnsi16m2, "rgb", rgb2rgb, true));
    return styles3;
  }
  Object.defineProperty(module, "exports", {
    enumerable: true,
    get: assembleStyles2
  });
});

// node_modules/wrap-ansi/index.js
var require_wrap_ansi = __commonJS((exports, module) => {
  var stringWidth = require_string_width();
  var stripAnsi = require_strip_ansi();
  var ansiStyles2 = require_ansi_styles();
  var ESCAPES = new Set([
    "\x1B",
    ""
  ]);
  var END_CODE = 39;
  var wrapAnsi = (code) => `${ESCAPES.values().next().value}[${code}m`;
  var wordLengths = (string) => string.split(" ").map((character) => stringWidth(character));
  var wrapWord = (rows, word, columns) => {
    const characters = [...word];
    let isInsideEscape = false;
    let visible = stringWidth(stripAnsi(rows[rows.length - 1]));
    for (const [index, character] of characters.entries()) {
      const characterLength = stringWidth(character);
      if (visible + characterLength <= columns) {
        rows[rows.length - 1] += character;
      } else {
        rows.push(character);
        visible = 0;
      }
      if (ESCAPES.has(character)) {
        isInsideEscape = true;
      } else if (isInsideEscape && character === "m") {
        isInsideEscape = false;
        continue;
      }
      if (isInsideEscape) {
        continue;
      }
      visible += characterLength;
      if (visible === columns && index < characters.length - 1) {
        rows.push("");
        visible = 0;
      }
    }
    if (!visible && rows[rows.length - 1].length > 0 && rows.length > 1) {
      rows[rows.length - 2] += rows.pop();
    }
  };
  var stringVisibleTrimSpacesRight = (str) => {
    const words = str.split(" ");
    let last = words.length;
    while (last > 0) {
      if (stringWidth(words[last - 1]) > 0) {
        break;
      }
      last--;
    }
    if (last === words.length) {
      return str;
    }
    return words.slice(0, last).join(" ") + words.slice(last).join("");
  };
  var exec = (string, columns, options = {}) => {
    if (options.trim !== false && string.trim() === "") {
      return "";
    }
    let pre = "";
    let ret = "";
    let escapeCode;
    const lengths = wordLengths(string);
    let rows = [""];
    for (const [index, word] of string.split(" ").entries()) {
      if (options.trim !== false) {
        rows[rows.length - 1] = rows[rows.length - 1].trimLeft();
      }
      let rowLength = stringWidth(rows[rows.length - 1]);
      if (index !== 0) {
        if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
          rows.push("");
          rowLength = 0;
        }
        if (rowLength > 0 || options.trim === false) {
          rows[rows.length - 1] += " ";
          rowLength++;
        }
      }
      if (options.hard && lengths[index] > columns) {
        const remainingColumns = columns - rowLength;
        const breaksStartingThisLine = 1 + Math.floor((lengths[index] - remainingColumns - 1) / columns);
        const breaksStartingNextLine = Math.floor((lengths[index] - 1) / columns);
        if (breaksStartingNextLine < breaksStartingThisLine) {
          rows.push("");
        }
        wrapWord(rows, word, columns);
        continue;
      }
      if (rowLength + lengths[index] > columns && rowLength > 0 && lengths[index] > 0) {
        if (options.wordWrap === false && rowLength < columns) {
          wrapWord(rows, word, columns);
          continue;
        }
        rows.push("");
      }
      if (rowLength + lengths[index] > columns && options.wordWrap === false) {
        wrapWord(rows, word, columns);
        continue;
      }
      rows[rows.length - 1] += word;
    }
    if (options.trim !== false) {
      rows = rows.map(stringVisibleTrimSpacesRight);
    }
    pre = rows.join(`
`);
    for (const [index, character] of [...pre].entries()) {
      ret += character;
      if (ESCAPES.has(character)) {
        const code2 = parseFloat(/\d[^m]*/.exec(pre.slice(index, index + 4)));
        escapeCode = code2 === END_CODE ? null : code2;
      }
      const code = ansiStyles2.codes.get(Number(escapeCode));
      if (escapeCode && code) {
        if (pre[index + 1] === `
`) {
          ret += wrapAnsi(code);
        } else if (character === `
`) {
          ret += wrapAnsi(escapeCode);
        }
      }
    }
    return ret;
  };
  module.exports = (string, columns, options) => {
    return String(string).normalize().replace(/\r\n/g, `
`).split(`
`).map((line) => exec(line, columns, options)).join(`
`);
  };
});

// node_modules/mute-stream/lib/index.js
var require_lib = __commonJS((exports, module) => {
  var Stream = __require("stream");

  class MuteStream extends Stream {
    #isTTY = null;
    constructor(opts = {}) {
      super(opts);
      this.writable = this.readable = true;
      this.muted = false;
      this.on("pipe", this._onpipe);
      this.replace = opts.replace;
      this._prompt = opts.prompt || null;
      this._hadControl = false;
    }
    #destSrc(key, def) {
      if (this._dest) {
        return this._dest[key];
      }
      if (this._src) {
        return this._src[key];
      }
      return def;
    }
    #proxy(method, ...args) {
      if (typeof this._dest?.[method] === "function") {
        this._dest[method](...args);
      }
      if (typeof this._src?.[method] === "function") {
        this._src[method](...args);
      }
    }
    get isTTY() {
      if (this.#isTTY !== null) {
        return this.#isTTY;
      }
      return this.#destSrc("isTTY", false);
    }
    set isTTY(val) {
      this.#isTTY = val;
    }
    get rows() {
      return this.#destSrc("rows");
    }
    get columns() {
      return this.#destSrc("columns");
    }
    mute() {
      this.muted = true;
    }
    unmute() {
      this.muted = false;
    }
    _onpipe(src) {
      this._src = src;
    }
    pipe(dest, options) {
      this._dest = dest;
      return super.pipe(dest, options);
    }
    pause() {
      if (this._src) {
        return this._src.pause();
      }
    }
    resume() {
      if (this._src) {
        return this._src.resume();
      }
    }
    write(c) {
      if (this.muted) {
        if (!this.replace) {
          return true;
        }
        if (c.match(/^\u001b/)) {
          if (c.indexOf(this._prompt) === 0) {
            c = c.slice(this._prompt.length);
            c = c.replace(/./g, this.replace);
            c = this._prompt + c;
          }
          this._hadControl = true;
          return this.emit("data", c);
        } else {
          if (this._prompt && this._hadControl && c.indexOf(this._prompt) === 0) {
            this._hadControl = false;
            this.emit("data", this._prompt);
            c = c.slice(this._prompt.length);
          }
          c = c.toString().replace(/./g, this.replace);
        }
      }
      this.emit("data", c);
    }
    end(c) {
      if (this.muted) {
        if (c && this.replace) {
          c = c.toString().replace(/./g, this.replace);
        } else {
          c = null;
        }
      }
      if (c) {
        this.emit("data", c);
      }
      this.emit("end");
    }
    destroy(...args) {
      return this.#proxy("destroy", ...args);
    }
    destroySoon(...args) {
      return this.#proxy("destroySoon", ...args);
    }
    close(...args) {
      return this.#proxy("close", ...args);
    }
  }
  module.exports = MuteStream;
});

// src/lib/paths.ts
import { homedir } from "os";
import { join } from "path";
function claudeProfileDir(name) {
  return join(CLAUDE_PROFILES_DIR, name);
}
function claudeProfileCredentials(name) {
  return join(claudeProfileDir(name), ".credentials.json");
}
function claudeProfileDataFile(name) {
  return join(claudeProfileDir(name), "profile.json");
}
function claudeProfileAccountFile(name) {
  return join(claudeProfileDir(name), "account.json");
}
function codexAccountAuthFile(accountKey) {
  const needsEncoding = !accountKey || accountKey === "." || accountKey === ".." || [...accountKey].some((ch) => !/[a-zA-Z0-9\-_.]/.test(ch));
  const fileKey = needsEncoding ? Buffer.from(accountKey).toString("base64url") : accountKey;
  return join(CODEX_ACCOUNTS_DIR, `${fileKey}.auth.json`);
}
var CLAUDE_DIR, CLAUDE_JSON, CREDENTIALS_FILE, SETTINGS_FILE, CLAUDE_PROFILES_DIR, CLAUDE_STATE_FILE, CODEX_DIR, CODEX_AUTH_FILE, CODEX_ACCOUNTS_DIR, CODEX_REGISTRY_FILE, CLAUDEX_DIR, ALIAS_REGISTRY_FILE;
var init_paths = __esm(() => {
  CLAUDE_DIR = join(homedir(), ".claude");
  CLAUDE_JSON = join(homedir(), ".claude.json");
  CREDENTIALS_FILE = join(CLAUDE_DIR, ".credentials.json");
  SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
  CLAUDE_PROFILES_DIR = join(homedir(), ".claude-profiles");
  CLAUDE_STATE_FILE = join(CLAUDE_PROFILES_DIR, "state.json");
  CODEX_DIR = join(homedir(), ".codex");
  CODEX_AUTH_FILE = join(CODEX_DIR, "auth.json");
  CODEX_ACCOUNTS_DIR = join(CODEX_DIR, "accounts");
  CODEX_REGISTRY_FILE = join(CODEX_ACCOUNTS_DIR, "registry.json");
  CLAUDEX_DIR = join(homedir(), ".claudex-switch");
  ALIAS_REGISTRY_FILE = join(CLAUDEX_DIR, "aliases.json");
});

// src/lib/fs.ts
import { readFile, writeFile, access } from "fs/promises";
async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function readJson(path, fallback) {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}
async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2));
}
async function writeJsonSecure(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2), { mode: 384 });
}
var init_fs = () => {};

// src/providers/codex/auth.ts
var exports_auth = {};
__export(exports_auth, {
  switchToAccount: () => switchToAccount,
  snapshotActiveAuth: () => snapshotActiveAuth,
  saveAccountAuth: () => saveAccountAuth,
  readActiveAuth: () => readActiveAuth,
  readAccountAuth: () => readAccountAuth,
  decodeIdToken: () => decodeIdToken
});
import { chmod, copyFile, mkdir as mkdir4, writeFile as writeFile2 } from "fs/promises";
async function ensureAccountsDir2() {
  await mkdir4(CODEX_ACCOUNTS_DIR, { recursive: true });
}
async function readActiveAuth() {
  if (!await fileExists(CODEX_AUTH_FILE))
    return null;
  return readJson(CODEX_AUTH_FILE, null);
}
async function readAccountAuth(accountKey) {
  const path = codexAccountAuthFile(accountKey);
  if (!await fileExists(path))
    return null;
  return readJson(path, null);
}
async function switchToAccount(accountKey) {
  const srcPath = codexAccountAuthFile(accountKey);
  if (!await fileExists(srcPath)) {
    throw new Error(`Auth file not found for account: ${accountKey}`);
  }
  await copyFile(srcPath, CODEX_AUTH_FILE);
}
async function saveAccountAuth(accountKey, authData) {
  await ensureAccountsDir2();
  const destPath = codexAccountAuthFile(accountKey);
  await writeFile2(destPath, JSON.stringify(authData, null, 2), { mode: 384 });
}
function decodeIdToken(idToken) {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2)
      return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    const authInfo = payload["https://api.openai.com/auth"] ?? {};
    return {
      email: payload.email ?? undefined,
      chatgpt_user_id: authInfo.user_id ?? payload.sub ?? undefined,
      chatgpt_account_id: authInfo.account_id ?? payload.account_id ?? undefined,
      plan_type: authInfo.plan_type ?? undefined
    };
  } catch {
    return null;
  }
}
async function snapshotActiveAuth(accountKey) {
  if (!await fileExists(CODEX_AUTH_FILE)) {
    throw new Error("No active Codex auth file found");
  }
  await ensureAccountsDir2();
  const destPath = codexAccountAuthFile(accountKey);
  await copyFile(CODEX_AUTH_FILE, destPath);
  await chmod(destPath, 384);
}
var init_auth = __esm(() => {
  init_paths();
  init_fs();
});

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os from "node:os";
import tty from "node:tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => (key in env))) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? `\r
` : `
`) + postfix;
    endIndex = index + 1;
    index = string.indexOf(`
`, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf(`
`);
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;
// node_modules/@inquirer/core/dist/esm/lib/key.js
var isUpKey = (key, keybindings = []) => key.name === "up" || keybindings.includes("vim") && key.name === "k" || keybindings.includes("emacs") && key.ctrl && key.name === "p";
var isDownKey = (key, keybindings = []) => key.name === "down" || keybindings.includes("vim") && key.name === "j" || keybindings.includes("emacs") && key.ctrl && key.name === "n";
var isBackspaceKey = (key) => key.name === "backspace";
var isTabKey = (key) => key.name === "tab";
var isNumberKey = (key) => "1234567890".includes(key.name);
var isEnterKey = (key) => key.name === "enter" || key.name === "return";
// node_modules/@inquirer/core/dist/esm/lib/errors.js
class AbortPromptError extends Error {
  name = "AbortPromptError";
  message = "Prompt was aborted";
  constructor(options) {
    super();
    this.cause = options?.cause;
  }
}

class CancelPromptError extends Error {
  name = "CancelPromptError";
  message = "Prompt was canceled";
}

class ExitPromptError extends Error {
  name = "ExitPromptError";
}

class HookError extends Error {
  name = "HookError";
}

class ValidationError extends Error {
  name = "ValidationError";
}
// node_modules/@inquirer/core/dist/esm/lib/use-state.js
import { AsyncResource as AsyncResource2 } from "node:async_hooks";

// node_modules/@inquirer/core/dist/esm/lib/hook-engine.js
import { AsyncLocalStorage, AsyncResource } from "node:async_hooks";
var hookStorage = new AsyncLocalStorage;
function createStore(rl) {
  const store = {
    rl,
    hooks: [],
    hooksCleanup: [],
    hooksEffect: [],
    index: 0,
    handleChange() {}
  };
  return store;
}
function withHooks(rl, cb) {
  const store = createStore(rl);
  return hookStorage.run(store, () => {
    function cycle(render) {
      store.handleChange = () => {
        store.index = 0;
        render();
      };
      store.handleChange();
    }
    return cb(cycle);
  });
}
function getStore() {
  const store = hookStorage.getStore();
  if (!store) {
    throw new HookError("[Inquirer] Hook functions can only be called from within a prompt");
  }
  return store;
}
function readline() {
  return getStore().rl;
}
function withUpdates(fn) {
  const wrapped = (...args) => {
    const store = getStore();
    let shouldUpdate = false;
    const oldHandleChange = store.handleChange;
    store.handleChange = () => {
      shouldUpdate = true;
    };
    const returnValue = fn(...args);
    if (shouldUpdate) {
      oldHandleChange();
    }
    store.handleChange = oldHandleChange;
    return returnValue;
  };
  return AsyncResource.bind(wrapped);
}
function withPointer(cb) {
  const store = getStore();
  const { index } = store;
  const pointer = {
    get() {
      return store.hooks[index];
    },
    set(value) {
      store.hooks[index] = value;
    },
    initialized: index in store.hooks
  };
  const returnValue = cb(pointer);
  store.index++;
  return returnValue;
}
function handleChange() {
  getStore().handleChange();
}
var effectScheduler = {
  queue(cb) {
    const store = getStore();
    const { index } = store;
    store.hooksEffect.push(() => {
      store.hooksCleanup[index]?.();
      const cleanFn = cb(readline());
      if (cleanFn != null && typeof cleanFn !== "function") {
        throw new ValidationError("useEffect return value must be a cleanup function or nothing.");
      }
      store.hooksCleanup[index] = cleanFn;
    });
  },
  run() {
    const store = getStore();
    withUpdates(() => {
      store.hooksEffect.forEach((effect) => {
        effect();
      });
      store.hooksEffect.length = 0;
    })();
  },
  clearAll() {
    const store = getStore();
    store.hooksCleanup.forEach((cleanFn) => {
      cleanFn?.();
    });
    store.hooksEffect.length = 0;
    store.hooksCleanup.length = 0;
  }
};

// node_modules/@inquirer/core/dist/esm/lib/use-state.js
function useState(defaultValue) {
  return withPointer((pointer) => {
    const setState = AsyncResource2.bind(function setState2(newValue) {
      if (pointer.get() !== newValue) {
        pointer.set(newValue);
        handleChange();
      }
    });
    if (pointer.initialized) {
      return [pointer.get(), setState];
    }
    const value = typeof defaultValue === "function" ? defaultValue() : defaultValue;
    pointer.set(value);
    return [value, setState];
  });
}

// node_modules/@inquirer/core/dist/esm/lib/use-effect.js
function useEffect(cb, depArray) {
  withPointer((pointer) => {
    const oldDeps = pointer.get();
    const hasChanged = !Array.isArray(oldDeps) || depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
    if (hasChanged) {
      effectScheduler.queue(cb);
    }
    pointer.set(depArray);
  });
}

// node_modules/@inquirer/core/dist/esm/lib/theme.js
var import_yoctocolors_cjs = __toESM(require_yoctocolors_cjs(), 1);

// node_modules/@inquirer/figures/dist/esm/index.js
import process3 from "node:process";
function isUnicodeSupported() {
  if (process3.platform !== "win32") {
    return process3.env["TERM"] !== "linux";
  }
  return Boolean(process3.env["WT_SESSION"]) || Boolean(process3.env["TERMINUS_SUBLIME"]) || process3.env["ConEmuTask"] === "{cmd::Cmder}" || process3.env["TERM_PROGRAM"] === "Terminus-Sublime" || process3.env["TERM_PROGRAM"] === "vscode" || process3.env["TERM"] === "xterm-256color" || process3.env["TERM"] === "alacritty" || process3.env["TERMINAL_EMULATOR"] === "JetBrains-JediTerm";
}
var common = {
  circleQuestionMark: "(?)",
  questionMarkPrefix: "(?)",
  square: "█",
  squareDarkShade: "▓",
  squareMediumShade: "▒",
  squareLightShade: "░",
  squareTop: "▀",
  squareBottom: "▄",
  squareLeft: "▌",
  squareRight: "▐",
  squareCenter: "■",
  bullet: "●",
  dot: "․",
  ellipsis: "…",
  pointerSmall: "›",
  triangleUp: "▲",
  triangleUpSmall: "▴",
  triangleDown: "▼",
  triangleDownSmall: "▾",
  triangleLeftSmall: "◂",
  triangleRightSmall: "▸",
  home: "⌂",
  heart: "♥",
  musicNote: "♪",
  musicNoteBeamed: "♫",
  arrowUp: "↑",
  arrowDown: "↓",
  arrowLeft: "←",
  arrowRight: "→",
  arrowLeftRight: "↔",
  arrowUpDown: "↕",
  almostEqual: "≈",
  notEqual: "≠",
  lessOrEqual: "≤",
  greaterOrEqual: "≥",
  identical: "≡",
  infinity: "∞",
  subscriptZero: "₀",
  subscriptOne: "₁",
  subscriptTwo: "₂",
  subscriptThree: "₃",
  subscriptFour: "₄",
  subscriptFive: "₅",
  subscriptSix: "₆",
  subscriptSeven: "₇",
  subscriptEight: "₈",
  subscriptNine: "₉",
  oneHalf: "½",
  oneThird: "⅓",
  oneQuarter: "¼",
  oneFifth: "⅕",
  oneSixth: "⅙",
  oneEighth: "⅛",
  twoThirds: "⅔",
  twoFifths: "⅖",
  threeQuarters: "¾",
  threeFifths: "⅗",
  threeEighths: "⅜",
  fourFifths: "⅘",
  fiveSixths: "⅚",
  fiveEighths: "⅝",
  sevenEighths: "⅞",
  line: "─",
  lineBold: "━",
  lineDouble: "═",
  lineDashed0: "┄",
  lineDashed1: "┅",
  lineDashed2: "┈",
  lineDashed3: "┉",
  lineDashed4: "╌",
  lineDashed5: "╍",
  lineDashed6: "╴",
  lineDashed7: "╶",
  lineDashed8: "╸",
  lineDashed9: "╺",
  lineDashed10: "╼",
  lineDashed11: "╾",
  lineDashed12: "−",
  lineDashed13: "–",
  lineDashed14: "‐",
  lineDashed15: "⁃",
  lineVertical: "│",
  lineVerticalBold: "┃",
  lineVerticalDouble: "║",
  lineVerticalDashed0: "┆",
  lineVerticalDashed1: "┇",
  lineVerticalDashed2: "┊",
  lineVerticalDashed3: "┋",
  lineVerticalDashed4: "╎",
  lineVerticalDashed5: "╏",
  lineVerticalDashed6: "╵",
  lineVerticalDashed7: "╷",
  lineVerticalDashed8: "╹",
  lineVerticalDashed9: "╻",
  lineVerticalDashed10: "╽",
  lineVerticalDashed11: "╿",
  lineDownLeft: "┐",
  lineDownLeftArc: "╮",
  lineDownBoldLeftBold: "┓",
  lineDownBoldLeft: "┒",
  lineDownLeftBold: "┑",
  lineDownDoubleLeftDouble: "╗",
  lineDownDoubleLeft: "╖",
  lineDownLeftDouble: "╕",
  lineDownRight: "┌",
  lineDownRightArc: "╭",
  lineDownBoldRightBold: "┏",
  lineDownBoldRight: "┎",
  lineDownRightBold: "┍",
  lineDownDoubleRightDouble: "╔",
  lineDownDoubleRight: "╓",
  lineDownRightDouble: "╒",
  lineUpLeft: "┘",
  lineUpLeftArc: "╯",
  lineUpBoldLeftBold: "┛",
  lineUpBoldLeft: "┚",
  lineUpLeftBold: "┙",
  lineUpDoubleLeftDouble: "╝",
  lineUpDoubleLeft: "╜",
  lineUpLeftDouble: "╛",
  lineUpRight: "└",
  lineUpRightArc: "╰",
  lineUpBoldRightBold: "┗",
  lineUpBoldRight: "┖",
  lineUpRightBold: "┕",
  lineUpDoubleRightDouble: "╚",
  lineUpDoubleRight: "╙",
  lineUpRightDouble: "╘",
  lineUpDownLeft: "┤",
  lineUpBoldDownBoldLeftBold: "┫",
  lineUpBoldDownBoldLeft: "┨",
  lineUpDownLeftBold: "┥",
  lineUpBoldDownLeftBold: "┩",
  lineUpDownBoldLeftBold: "┪",
  lineUpDownBoldLeft: "┧",
  lineUpBoldDownLeft: "┦",
  lineUpDoubleDownDoubleLeftDouble: "╣",
  lineUpDoubleDownDoubleLeft: "╢",
  lineUpDownLeftDouble: "╡",
  lineUpDownRight: "├",
  lineUpBoldDownBoldRightBold: "┣",
  lineUpBoldDownBoldRight: "┠",
  lineUpDownRightBold: "┝",
  lineUpBoldDownRightBold: "┡",
  lineUpDownBoldRightBold: "┢",
  lineUpDownBoldRight: "┟",
  lineUpBoldDownRight: "┞",
  lineUpDoubleDownDoubleRightDouble: "╠",
  lineUpDoubleDownDoubleRight: "╟",
  lineUpDownRightDouble: "╞",
  lineDownLeftRight: "┬",
  lineDownBoldLeftBoldRightBold: "┳",
  lineDownLeftBoldRightBold: "┯",
  lineDownBoldLeftRight: "┰",
  lineDownBoldLeftBoldRight: "┱",
  lineDownBoldLeftRightBold: "┲",
  lineDownLeftRightBold: "┮",
  lineDownLeftBoldRight: "┭",
  lineDownDoubleLeftDoubleRightDouble: "╦",
  lineDownDoubleLeftRight: "╥",
  lineDownLeftDoubleRightDouble: "╤",
  lineUpLeftRight: "┴",
  lineUpBoldLeftBoldRightBold: "┻",
  lineUpLeftBoldRightBold: "┷",
  lineUpBoldLeftRight: "┸",
  lineUpBoldLeftBoldRight: "┹",
  lineUpBoldLeftRightBold: "┺",
  lineUpLeftRightBold: "┶",
  lineUpLeftBoldRight: "┵",
  lineUpDoubleLeftDoubleRightDouble: "╩",
  lineUpDoubleLeftRight: "╨",
  lineUpLeftDoubleRightDouble: "╧",
  lineUpDownLeftRight: "┼",
  lineUpBoldDownBoldLeftBoldRightBold: "╋",
  lineUpDownBoldLeftBoldRightBold: "╈",
  lineUpBoldDownLeftBoldRightBold: "╇",
  lineUpBoldDownBoldLeftRightBold: "╊",
  lineUpBoldDownBoldLeftBoldRight: "╉",
  lineUpBoldDownLeftRight: "╀",
  lineUpDownBoldLeftRight: "╁",
  lineUpDownLeftBoldRight: "┽",
  lineUpDownLeftRightBold: "┾",
  lineUpBoldDownBoldLeftRight: "╂",
  lineUpDownLeftBoldRightBold: "┿",
  lineUpBoldDownLeftBoldRight: "╃",
  lineUpBoldDownLeftRightBold: "╄",
  lineUpDownBoldLeftBoldRight: "╅",
  lineUpDownBoldLeftRightBold: "╆",
  lineUpDoubleDownDoubleLeftDoubleRightDouble: "╬",
  lineUpDoubleDownDoubleLeftRight: "╫",
  lineUpDownLeftDoubleRightDouble: "╪",
  lineCross: "╳",
  lineBackslash: "╲",
  lineSlash: "╱"
};
var specialMainSymbols = {
  tick: "✔",
  info: "ℹ",
  warning: "⚠",
  cross: "✘",
  squareSmall: "◻",
  squareSmallFilled: "◼",
  circle: "◯",
  circleFilled: "◉",
  circleDotted: "◌",
  circleDouble: "◎",
  circleCircle: "ⓞ",
  circleCross: "ⓧ",
  circlePipe: "Ⓘ",
  radioOn: "◉",
  radioOff: "◯",
  checkboxOn: "☒",
  checkboxOff: "☐",
  checkboxCircleOn: "ⓧ",
  checkboxCircleOff: "Ⓘ",
  pointer: "❯",
  triangleUpOutline: "△",
  triangleLeft: "◀",
  triangleRight: "▶",
  lozenge: "◆",
  lozengeOutline: "◇",
  hamburger: "☰",
  smiley: "㋡",
  mustache: "෴",
  star: "★",
  play: "▶",
  nodejs: "⬢",
  oneSeventh: "⅐",
  oneNinth: "⅑",
  oneTenth: "⅒"
};
var specialFallbackSymbols = {
  tick: "√",
  info: "i",
  warning: "‼",
  cross: "×",
  squareSmall: "□",
  squareSmallFilled: "■",
  circle: "( )",
  circleFilled: "(*)",
  circleDotted: "( )",
  circleDouble: "( )",
  circleCircle: "(○)",
  circleCross: "(×)",
  circlePipe: "(│)",
  radioOn: "(*)",
  radioOff: "( )",
  checkboxOn: "[×]",
  checkboxOff: "[ ]",
  checkboxCircleOn: "(×)",
  checkboxCircleOff: "( )",
  pointer: ">",
  triangleUpOutline: "∆",
  triangleLeft: "◄",
  triangleRight: "►",
  lozenge: "♦",
  lozengeOutline: "◊",
  hamburger: "≡",
  smiley: "☺",
  mustache: "┌─┐",
  star: "✶",
  play: "►",
  nodejs: "♦",
  oneSeventh: "1/7",
  oneNinth: "1/9",
  oneTenth: "1/10"
};
var mainSymbols = {
  ...common,
  ...specialMainSymbols
};
var fallbackSymbols = {
  ...common,
  ...specialFallbackSymbols
};
var shouldUseMain = isUnicodeSupported();
var figures = shouldUseMain ? mainSymbols : fallbackSymbols;
var esm_default = figures;
var replacements = Object.entries(specialMainSymbols);

// node_modules/@inquirer/core/dist/esm/lib/theme.js
var defaultTheme = {
  prefix: {
    idle: import_yoctocolors_cjs.default.blue("?"),
    done: import_yoctocolors_cjs.default.green(esm_default.tick)
  },
  spinner: {
    interval: 80,
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"].map((frame) => import_yoctocolors_cjs.default.yellow(frame))
  },
  style: {
    answer: import_yoctocolors_cjs.default.cyan,
    message: import_yoctocolors_cjs.default.bold,
    error: (text) => import_yoctocolors_cjs.default.red(`> ${text}`),
    defaultAnswer: (text) => import_yoctocolors_cjs.default.dim(`(${text})`),
    help: import_yoctocolors_cjs.default.dim,
    highlight: import_yoctocolors_cjs.default.cyan,
    key: (text) => import_yoctocolors_cjs.default.cyan(import_yoctocolors_cjs.default.bold(`<${text}>`))
  }
};

// node_modules/@inquirer/core/dist/esm/lib/make-theme.js
function isPlainObject(value) {
  if (typeof value !== "object" || value === null)
    return false;
  let proto2 = value;
  while (Object.getPrototypeOf(proto2) !== null) {
    proto2 = Object.getPrototypeOf(proto2);
  }
  return Object.getPrototypeOf(value) === proto2;
}
function deepMerge(...objects) {
  const output = {};
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      const prevValue = output[key];
      output[key] = isPlainObject(prevValue) && isPlainObject(value) ? deepMerge(prevValue, value) : value;
    }
  }
  return output;
}
function makeTheme(...themes) {
  const themesToMerge = [
    defaultTheme,
    ...themes.filter((theme) => theme != null)
  ];
  return deepMerge(...themesToMerge);
}

// node_modules/@inquirer/core/dist/esm/lib/use-prefix.js
function usePrefix({ status = "idle", theme }) {
  const [showLoader, setShowLoader] = useState(false);
  const [tick, setTick] = useState(0);
  const { prefix, spinner } = makeTheme(theme);
  useEffect(() => {
    if (status === "loading") {
      let tickInterval;
      let inc = -1;
      const delayTimeout = setTimeout(() => {
        setShowLoader(true);
        tickInterval = setInterval(() => {
          inc = inc + 1;
          setTick(inc % spinner.frames.length);
        }, spinner.interval);
      }, 300);
      return () => {
        clearTimeout(delayTimeout);
        clearInterval(tickInterval);
      };
    } else {
      setShowLoader(false);
    }
  }, [status]);
  if (showLoader) {
    return spinner.frames[tick];
  }
  const iconName = status === "loading" ? "idle" : status;
  return typeof prefix === "string" ? prefix : prefix[iconName] ?? prefix["idle"];
}
// node_modules/@inquirer/core/dist/esm/lib/use-memo.js
function useMemo(fn, dependencies) {
  return withPointer((pointer) => {
    const prev = pointer.get();
    if (!prev || prev.dependencies.length !== dependencies.length || prev.dependencies.some((dep, i) => dep !== dependencies[i])) {
      const value = fn();
      pointer.set({ value, dependencies });
      return value;
    }
    return prev.value;
  });
}
// node_modules/@inquirer/core/dist/esm/lib/use-ref.js
function useRef(val) {
  return useState({ current: val })[0];
}
// node_modules/@inquirer/core/dist/esm/lib/use-keypress.js
function useKeypress(userHandler) {
  const signal = useRef(userHandler);
  signal.current = userHandler;
  useEffect((rl) => {
    let ignore = false;
    const handler = withUpdates((_input, event) => {
      if (ignore)
        return;
      signal.current(event, rl);
    });
    rl.input.on("keypress", handler);
    return () => {
      ignore = true;
      rl.input.removeListener("keypress", handler);
    };
  }, []);
}
// node_modules/@inquirer/core/dist/esm/lib/utils.js
var import_cli_width = __toESM(require_cli_width(), 1);
var import_wrap_ansi = __toESM(require_wrap_ansi(), 1);
function breakLines(content, width) {
  return content.split(`
`).flatMap((line) => import_wrap_ansi.default(line, width, { trim: false, hard: true }).split(`
`).map((str) => str.trimEnd())).join(`
`);
}
function readlineWidth() {
  return import_cli_width.default({ defaultWidth: 80, output: readline().output });
}

// node_modules/@inquirer/core/dist/esm/lib/pagination/use-pagination.js
function usePointerPosition({ active, renderedItems, pageSize, loop }) {
  const state = useRef({
    lastPointer: active,
    lastActive: undefined
  });
  const { lastPointer, lastActive } = state.current;
  const middle = Math.floor(pageSize / 2);
  const renderedLength = renderedItems.reduce((acc, item) => acc + item.length, 0);
  const defaultPointerPosition = renderedItems.slice(0, active).reduce((acc, item) => acc + item.length, 0);
  let pointer = defaultPointerPosition;
  if (renderedLength > pageSize) {
    if (loop) {
      pointer = lastPointer;
      if (lastActive != null && lastActive < active && active - lastActive < pageSize) {
        pointer = Math.min(middle, Math.abs(active - lastActive) === 1 ? Math.min(lastPointer + (renderedItems[lastActive]?.length ?? 0), Math.max(defaultPointerPosition, lastPointer)) : lastPointer + active - lastActive);
      }
    } else {
      const spaceUnderActive = renderedItems.slice(active).reduce((acc, item) => acc + item.length, 0);
      pointer = spaceUnderActive < pageSize - middle ? pageSize - spaceUnderActive : Math.min(defaultPointerPosition, middle);
    }
  }
  state.current.lastPointer = pointer;
  state.current.lastActive = active;
  return pointer;
}
function usePagination({ items, active, renderItem, pageSize, loop = true }) {
  const width = readlineWidth();
  const bound = (num) => (num % items.length + items.length) % items.length;
  const renderedItems = items.map((item, index) => {
    if (item == null)
      return [];
    return breakLines(renderItem({ item, index, isActive: index === active }), width).split(`
`);
  });
  const renderedLength = renderedItems.reduce((acc, item) => acc + item.length, 0);
  const renderItemAtIndex = (index) => renderedItems[index] ?? [];
  const pointer = usePointerPosition({ active, renderedItems, pageSize, loop });
  const activeItem = renderItemAtIndex(active).slice(0, pageSize);
  const activeItemPosition = pointer + activeItem.length <= pageSize ? pointer : pageSize - activeItem.length;
  const pageBuffer = Array.from({ length: pageSize });
  pageBuffer.splice(activeItemPosition, activeItem.length, ...activeItem);
  const itemVisited = new Set([active]);
  let bufferPointer = activeItemPosition + activeItem.length;
  let itemPointer = bound(active + 1);
  while (bufferPointer < pageSize && !itemVisited.has(itemPointer) && (loop && renderedLength > pageSize ? itemPointer !== active : itemPointer > active)) {
    const lines = renderItemAtIndex(itemPointer);
    const linesToAdd = lines.slice(0, pageSize - bufferPointer);
    pageBuffer.splice(bufferPointer, linesToAdd.length, ...linesToAdd);
    itemVisited.add(itemPointer);
    bufferPointer += linesToAdd.length;
    itemPointer = bound(itemPointer + 1);
  }
  bufferPointer = activeItemPosition - 1;
  itemPointer = bound(active - 1);
  while (bufferPointer >= 0 && !itemVisited.has(itemPointer) && (loop && renderedLength > pageSize ? itemPointer !== active : itemPointer < active)) {
    const lines = renderItemAtIndex(itemPointer);
    const linesToAdd = lines.slice(Math.max(0, lines.length - bufferPointer - 1));
    pageBuffer.splice(bufferPointer - linesToAdd.length + 1, linesToAdd.length, ...linesToAdd);
    itemVisited.add(itemPointer);
    bufferPointer -= linesToAdd.length;
    itemPointer = bound(itemPointer - 1);
  }
  return pageBuffer.filter((line) => typeof line === "string").join(`
`);
}
// node_modules/@inquirer/core/dist/esm/lib/create-prompt.js
var import_mute_stream = __toESM(require_lib(), 1);
import * as readline2 from "node:readline";
import { AsyncResource as AsyncResource3 } from "node:async_hooks";

// node_modules/signal-exit/dist/mjs/signals.js
var signals = [];
signals.push("SIGHUP", "SIGINT", "SIGTERM");
if (process.platform !== "win32") {
  signals.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
}
if (process.platform === "linux") {
  signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
}

// node_modules/signal-exit/dist/mjs/index.js
var processOk = (process4) => !!process4 && typeof process4 === "object" && typeof process4.removeListener === "function" && typeof process4.emit === "function" && typeof process4.reallyExit === "function" && typeof process4.listeners === "function" && typeof process4.kill === "function" && typeof process4.pid === "number" && typeof process4.on === "function";
var kExitEmitter = Symbol.for("signal-exit emitter");
var global = globalThis;
var ObjectDefineProperty = Object.defineProperty.bind(Object);

class Emitter {
  emitted = {
    afterExit: false,
    exit: false
  };
  listeners = {
    afterExit: [],
    exit: []
  };
  count = 0;
  id = Math.random();
  constructor() {
    if (global[kExitEmitter]) {
      return global[kExitEmitter];
    }
    ObjectDefineProperty(global, kExitEmitter, {
      value: this,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  on(ev, fn) {
    this.listeners[ev].push(fn);
  }
  removeListener(ev, fn) {
    const list = this.listeners[ev];
    const i = list.indexOf(fn);
    if (i === -1) {
      return;
    }
    if (i === 0 && list.length === 1) {
      list.length = 0;
    } else {
      list.splice(i, 1);
    }
  }
  emit(ev, code, signal) {
    if (this.emitted[ev]) {
      return false;
    }
    this.emitted[ev] = true;
    let ret = false;
    for (const fn of this.listeners[ev]) {
      ret = fn(code, signal) === true || ret;
    }
    if (ev === "exit") {
      ret = this.emit("afterExit", code, signal) || ret;
    }
    return ret;
  }
}

class SignalExitBase {
}
var signalExitWrap = (handler) => {
  return {
    onExit(cb, opts) {
      return handler.onExit(cb, opts);
    },
    load() {
      return handler.load();
    },
    unload() {
      return handler.unload();
    }
  };
};

class SignalExitFallback extends SignalExitBase {
  onExit() {
    return () => {};
  }
  load() {}
  unload() {}
}

class SignalExit extends SignalExitBase {
  #hupSig = process4.platform === "win32" ? "SIGINT" : "SIGHUP";
  #emitter = new Emitter;
  #process;
  #originalProcessEmit;
  #originalProcessReallyExit;
  #sigListeners = {};
  #loaded = false;
  constructor(process4) {
    super();
    this.#process = process4;
    this.#sigListeners = {};
    for (const sig of signals) {
      this.#sigListeners[sig] = () => {
        const listeners = this.#process.listeners(sig);
        let { count } = this.#emitter;
        const p = process4;
        if (typeof p.__signal_exit_emitter__ === "object" && typeof p.__signal_exit_emitter__.count === "number") {
          count += p.__signal_exit_emitter__.count;
        }
        if (listeners.length === count) {
          this.unload();
          const ret = this.#emitter.emit("exit", null, sig);
          const s = sig === "SIGHUP" ? this.#hupSig : sig;
          if (!ret)
            process4.kill(process4.pid, s);
        }
      };
    }
    this.#originalProcessReallyExit = process4.reallyExit;
    this.#originalProcessEmit = process4.emit;
  }
  onExit(cb, opts) {
    if (!processOk(this.#process)) {
      return () => {};
    }
    if (this.#loaded === false) {
      this.load();
    }
    const ev = opts?.alwaysLast ? "afterExit" : "exit";
    this.#emitter.on(ev, cb);
    return () => {
      this.#emitter.removeListener(ev, cb);
      if (this.#emitter.listeners["exit"].length === 0 && this.#emitter.listeners["afterExit"].length === 0) {
        this.unload();
      }
    };
  }
  load() {
    if (this.#loaded) {
      return;
    }
    this.#loaded = true;
    this.#emitter.count += 1;
    for (const sig of signals) {
      try {
        const fn = this.#sigListeners[sig];
        if (fn)
          this.#process.on(sig, fn);
      } catch (_) {}
    }
    this.#process.emit = (ev, ...a) => {
      return this.#processEmit(ev, ...a);
    };
    this.#process.reallyExit = (code) => {
      return this.#processReallyExit(code);
    };
  }
  unload() {
    if (!this.#loaded) {
      return;
    }
    this.#loaded = false;
    signals.forEach((sig) => {
      const listener = this.#sigListeners[sig];
      if (!listener) {
        throw new Error("Listener not defined for signal: " + sig);
      }
      try {
        this.#process.removeListener(sig, listener);
      } catch (_) {}
    });
    this.#process.emit = this.#originalProcessEmit;
    this.#process.reallyExit = this.#originalProcessReallyExit;
    this.#emitter.count -= 1;
  }
  #processReallyExit(code) {
    if (!processOk(this.#process)) {
      return 0;
    }
    this.#process.exitCode = code || 0;
    this.#emitter.emit("exit", this.#process.exitCode, null);
    return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
  }
  #processEmit(ev, ...args) {
    const og = this.#originalProcessEmit;
    if (ev === "exit" && processOk(this.#process)) {
      if (typeof args[0] === "number") {
        this.#process.exitCode = args[0];
      }
      const ret = og.call(this.#process, ev, ...args);
      this.#emitter.emit("exit", this.#process.exitCode, null);
      return ret;
    } else {
      return og.call(this.#process, ev, ...args);
    }
  }
}
var process4 = globalThis.process;
var {
  onExit,
  load,
  unload
} = signalExitWrap(processOk(process4) ? new SignalExit(process4) : new SignalExitFallback);

// node_modules/@inquirer/core/dist/esm/lib/screen-manager.js
import { stripVTControlCharacters } from "node:util";

// node_modules/@inquirer/ansi/dist/esm/index.js
var ESC = "\x1B[";
var cursorLeft = ESC + "G";
var cursorHide = ESC + "?25l";
var cursorShow = ESC + "?25h";
var cursorUp = (rows = 1) => rows > 0 ? `${ESC}${rows}A` : "";
var cursorDown = (rows = 1) => rows > 0 ? `${ESC}${rows}B` : "";
var cursorTo = (x, y) => {
  if (typeof y === "number" && !Number.isNaN(y)) {
    return `${ESC}${y + 1};${x + 1}H`;
  }
  return `${ESC}${x + 1}G`;
};
var eraseLine = ESC + "2K";
var eraseLines = (lines) => lines > 0 ? (eraseLine + cursorUp(1)).repeat(lines - 1) + eraseLine + cursorLeft : "";

// node_modules/@inquirer/core/dist/esm/lib/screen-manager.js
var height = (content) => content.split(`
`).length;
var lastLine = (content) => content.split(`
`).pop() ?? "";

class ScreenManager {
  height = 0;
  extraLinesUnderPrompt = 0;
  cursorPos;
  rl;
  constructor(rl) {
    this.rl = rl;
    this.cursorPos = rl.getCursorPos();
  }
  write(content) {
    this.rl.output.unmute();
    this.rl.output.write(content);
    this.rl.output.mute();
  }
  render(content, bottomContent = "") {
    const promptLine = lastLine(content);
    const rawPromptLine = stripVTControlCharacters(promptLine);
    let prompt = rawPromptLine;
    if (this.rl.line.length > 0) {
      prompt = prompt.slice(0, -this.rl.line.length);
    }
    this.rl.setPrompt(prompt);
    this.cursorPos = this.rl.getCursorPos();
    const width = readlineWidth();
    content = breakLines(content, width);
    bottomContent = breakLines(bottomContent, width);
    if (rawPromptLine.length % width === 0) {
      content += `
`;
    }
    let output = content + (bottomContent ? `
` + bottomContent : "");
    const promptLineUpDiff = Math.floor(rawPromptLine.length / width) - this.cursorPos.rows;
    const bottomContentHeight = promptLineUpDiff + (bottomContent ? height(bottomContent) : 0);
    if (bottomContentHeight > 0)
      output += cursorUp(bottomContentHeight);
    output += cursorTo(this.cursorPos.cols);
    this.write(cursorDown(this.extraLinesUnderPrompt) + eraseLines(this.height) + output);
    this.extraLinesUnderPrompt = bottomContentHeight;
    this.height = height(output);
  }
  checkCursorPos() {
    const cursorPos = this.rl.getCursorPos();
    if (cursorPos.cols !== this.cursorPos.cols) {
      this.write(cursorTo(cursorPos.cols));
      this.cursorPos = cursorPos;
    }
  }
  done({ clearContent }) {
    this.rl.setPrompt("");
    let output = cursorDown(this.extraLinesUnderPrompt);
    output += clearContent ? eraseLines(this.height) : `
`;
    output += cursorShow;
    this.write(output);
    this.rl.close();
  }
}

// node_modules/@inquirer/core/dist/esm/lib/promise-polyfill.js
class PromisePolyfill extends Promise {
  static withResolver() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
}

// node_modules/@inquirer/core/dist/esm/lib/create-prompt.js
function getCallSites() {
  const _prepareStackTrace = Error.prepareStackTrace;
  let result = [];
  try {
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
      return callSitesWithoutCurrent;
    };
    new Error().stack;
  } catch {
    return result;
  }
  Error.prepareStackTrace = _prepareStackTrace;
  return result;
}
function createPrompt(view) {
  const callSites = getCallSites();
  const prompt = (config, context = {}) => {
    const { input = process.stdin, signal } = context;
    const cleanups = new Set;
    const output = new import_mute_stream.default;
    output.pipe(context.output ?? process.stdout);
    const rl = readline2.createInterface({
      terminal: true,
      input,
      output
    });
    const screen = new ScreenManager(rl);
    const { promise, resolve, reject } = PromisePolyfill.withResolver();
    const cancel = () => reject(new CancelPromptError);
    if (signal) {
      const abort = () => reject(new AbortPromptError({ cause: signal.reason }));
      if (signal.aborted) {
        abort();
        return Object.assign(promise, { cancel });
      }
      signal.addEventListener("abort", abort);
      cleanups.add(() => signal.removeEventListener("abort", abort));
    }
    cleanups.add(onExit((code, signal2) => {
      reject(new ExitPromptError(`User force closed the prompt with ${code} ${signal2}`));
    }));
    const sigint = () => reject(new ExitPromptError(`User force closed the prompt with SIGINT`));
    rl.on("SIGINT", sigint);
    cleanups.add(() => rl.removeListener("SIGINT", sigint));
    const checkCursorPos = () => screen.checkCursorPos();
    rl.input.on("keypress", checkCursorPos);
    cleanups.add(() => rl.input.removeListener("keypress", checkCursorPos));
    return withHooks(rl, (cycle) => {
      const hooksCleanup = AsyncResource3.bind(() => effectScheduler.clearAll());
      rl.on("close", hooksCleanup);
      cleanups.add(() => rl.removeListener("close", hooksCleanup));
      cycle(() => {
        try {
          const nextView = view(config, (value) => {
            setImmediate(() => resolve(value));
          });
          if (nextView === undefined) {
            const callerFilename = callSites[1]?.getFileName();
            throw new Error(`Prompt functions must return a string.
    at ${callerFilename}`);
          }
          const [content, bottomContent] = typeof nextView === "string" ? [nextView] : nextView;
          screen.render(content, bottomContent);
          effectScheduler.run();
        } catch (error) {
          reject(error);
        }
      });
      return Object.assign(promise.then((answer) => {
        effectScheduler.clearAll();
        return answer;
      }, (error) => {
        effectScheduler.clearAll();
        throw error;
      }).finally(() => {
        cleanups.forEach((cleanup) => cleanup());
        screen.done({ clearContent: Boolean(context.clearPromptOnDone) });
        output.end();
      }).then(() => promise), { cancel });
    });
  };
  return prompt;
}
// node_modules/@inquirer/core/dist/esm/lib/Separator.js
var import_yoctocolors_cjs2 = __toESM(require_yoctocolors_cjs(), 1);
class Separator {
  separator = import_yoctocolors_cjs2.default.dim(Array.from({ length: 15 }).join(esm_default.line));
  type = "separator";
  constructor(separator) {
    if (separator) {
      this.separator = separator;
    }
  }
  static isSeparator(choice) {
    return Boolean(choice && typeof choice === "object" && "type" in choice && choice.type === "separator");
  }
}
// node_modules/@inquirer/confirm/dist/esm/index.js
function getBooleanValue(value, defaultValue) {
  let answer = defaultValue !== false;
  if (/^(y|yes)/i.test(value))
    answer = true;
  else if (/^(n|no)/i.test(value))
    answer = false;
  return answer;
}
function boolToString(value) {
  return value ? "Yes" : "No";
}
var esm_default2 = createPrompt((config, done) => {
  const { transformer = boolToString } = config;
  const [status, setStatus] = useState("idle");
  const [value, setValue] = useState("");
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ status, theme });
  useKeypress((key, rl) => {
    if (status !== "idle")
      return;
    if (isEnterKey(key)) {
      const answer = getBooleanValue(value, config.default);
      setValue(transformer(answer));
      setStatus("done");
      done(answer);
    } else if (isTabKey(key)) {
      const answer = boolToString(!getBooleanValue(value, config.default));
      rl.clearLine(0);
      rl.write(answer);
      setValue(answer);
    } else {
      setValue(rl.line);
    }
  });
  let formattedValue = value;
  let defaultValue = "";
  if (status === "done") {
    formattedValue = theme.style.answer(value);
  } else {
    defaultValue = ` ${theme.style.defaultAnswer(config.default === false ? "y/N" : "Y/n")}`;
  }
  const message = theme.style.message(config.message, status);
  return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});
// node_modules/@inquirer/password/dist/esm/index.js
var esm_default3 = createPrompt((config, done) => {
  const { validate = () => true } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setError] = useState();
  const [value, setValue] = useState("");
  const prefix = usePrefix({ status, theme });
  useKeypress(async (key, rl) => {
    if (status !== "idle") {
      return;
    }
    if (isEnterKey(key)) {
      const answer = value;
      setStatus("loading");
      const isValid = await validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus("done");
        done(answer);
      } else {
        rl.write(value);
        setError(isValid || "You must provide a valid value");
        setStatus("idle");
      }
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });
  const message = theme.style.message(config.message, status);
  let formattedValue = "";
  let helpTip;
  if (config.mask) {
    const maskChar = typeof config.mask === "string" ? config.mask : "*";
    formattedValue = maskChar.repeat(value.length);
  } else if (status !== "done") {
    helpTip = `${theme.style.help("[input is masked]")}${cursorHide}`;
  }
  if (status === "done") {
    formattedValue = theme.style.answer(formattedValue);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [[prefix, message, config.mask ? formattedValue : helpTip].join(" "), error];
});
// node_modules/@inquirer/select/dist/esm/index.js
var import_yoctocolors_cjs3 = __toESM(require_yoctocolors_cjs(), 1);
var selectTheme = {
  icon: { cursor: esm_default.pointer },
  style: {
    disabled: (text) => import_yoctocolors_cjs3.default.dim(`- ${text}`),
    description: (text) => import_yoctocolors_cjs3.default.cyan(text),
    keysHelpTip: (keys) => keys.map(([key, action]) => `${import_yoctocolors_cjs3.default.bold(key)} ${import_yoctocolors_cjs3.default.dim(action)}`).join(import_yoctocolors_cjs3.default.dim(" • "))
  },
  helpMode: "always",
  indexMode: "hidden",
  keybindings: []
};
function isSelectable(item) {
  return !Separator.isSeparator(item) && !item.disabled;
}
function normalizeChoices(choices) {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice))
      return choice;
    if (typeof choice === "string") {
      return {
        value: choice,
        name: choice,
        short: choice,
        disabled: false
      };
    }
    const name = choice.name ?? String(choice.value);
    const normalizedChoice = {
      value: choice.value,
      name,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false
    };
    if (choice.description) {
      normalizedChoice.description = choice.description;
    }
    return normalizedChoice;
  });
}
var esm_default4 = createPrompt((config, done) => {
  const { loop = true, pageSize = 7 } = config;
  const theme = makeTheme(selectTheme, config.theme);
  const { keybindings } = theme;
  const [status, setStatus] = useState("idle");
  const prefix = usePrefix({ status, theme });
  const searchTimeoutRef = useRef();
  const searchEnabled = !keybindings.includes("vim");
  const items = useMemo(() => normalizeChoices(config.choices), [config.choices]);
  const bounds = useMemo(() => {
    const first = items.findIndex(isSelectable);
    const last = items.findLastIndex(isSelectable);
    if (first === -1) {
      throw new ValidationError("[select prompt] No selectable choices. All choices are disabled.");
    }
    return { first, last };
  }, [items]);
  const defaultItemIndex = useMemo(() => {
    if (!("default" in config))
      return -1;
    return items.findIndex((item) => isSelectable(item) && item.value === config.default);
  }, [config.default, items]);
  const [active, setActive] = useState(defaultItemIndex === -1 ? bounds.first : defaultItemIndex);
  const selectedChoice = items[active];
  useKeypress((key, rl) => {
    clearTimeout(searchTimeoutRef.current);
    if (isEnterKey(key)) {
      setStatus("done");
      done(selectedChoice.value);
    } else if (isUpKey(key, keybindings) || isDownKey(key, keybindings)) {
      rl.clearLine(0);
      if (loop || isUpKey(key, keybindings) && active !== bounds.first || isDownKey(key, keybindings) && active !== bounds.last) {
        const offset = isUpKey(key, keybindings) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + items.length) % items.length;
        } while (!isSelectable(items[next]));
        setActive(next);
      }
    } else if (isNumberKey(key) && !Number.isNaN(Number(rl.line))) {
      const selectedIndex = Number(rl.line) - 1;
      let selectableIndex = -1;
      const position = items.findIndex((item2) => {
        if (Separator.isSeparator(item2))
          return false;
        selectableIndex++;
        return selectableIndex === selectedIndex;
      });
      const item = items[position];
      if (item != null && isSelectable(item)) {
        setActive(position);
      }
      searchTimeoutRef.current = setTimeout(() => {
        rl.clearLine(0);
      }, 700);
    } else if (isBackspaceKey(key)) {
      rl.clearLine(0);
    } else if (searchEnabled) {
      const searchTerm = rl.line.toLowerCase();
      const matchIndex = items.findIndex((item) => {
        if (Separator.isSeparator(item) || !isSelectable(item))
          return false;
        return item.name.toLowerCase().startsWith(searchTerm);
      });
      if (matchIndex !== -1) {
        setActive(matchIndex);
      }
      searchTimeoutRef.current = setTimeout(() => {
        rl.clearLine(0);
      }, 700);
    }
  });
  useEffect(() => () => {
    clearTimeout(searchTimeoutRef.current);
  }, []);
  const message = theme.style.message(config.message, status);
  let helpLine;
  if (theme.helpMode !== "never") {
    if (config.instructions) {
      const { pager, navigation } = config.instructions;
      helpLine = theme.style.help(items.length > pageSize ? pager : navigation);
    } else {
      helpLine = theme.style.keysHelpTip([
        ["↑↓", "navigate"],
        ["⏎", "select"]
      ]);
    }
  }
  let separatorCount = 0;
  const page = usePagination({
    items,
    active,
    renderItem({ item, isActive, index }) {
      if (Separator.isSeparator(item)) {
        separatorCount++;
        return ` ${item.separator}`;
      }
      const indexLabel = theme.indexMode === "number" ? `${index + 1 - separatorCount}. ` : "";
      if (item.disabled) {
        const disabledLabel = typeof item.disabled === "string" ? item.disabled : "(disabled)";
        return theme.style.disabled(`${indexLabel}${item.name} ${disabledLabel}`);
      }
      const color = isActive ? theme.style.highlight : (x) => x;
      const cursor = isActive ? theme.icon.cursor : ` `;
      return color(`${cursor} ${indexLabel}${item.name}`);
    },
    pageSize,
    loop
  });
  if (status === "done") {
    return [prefix, message, theme.style.answer(selectedChoice.short)].filter(Boolean).join(" ");
  }
  const { description } = selectedChoice;
  const lines = [
    [prefix, message].filter(Boolean).join(" "),
    page,
    " ",
    description ? theme.style.description(description) : "",
    helpLine
  ].filter(Boolean).join(`
`).trimEnd();
  return `${lines}${cursorHide}`;
});
// src/alias/store.ts
init_paths();
init_fs();
import { mkdir } from "fs/promises";
function emptyRegistry() {
  return { version: 1, aliases: [] };
}
var RESERVED = new Set([
  "add",
  "use",
  "list",
  "ls",
  "remove",
  "rm",
  "rename",
  "purge",
  "current",
  "import",
  "update",
  "help",
  "--help",
  "-h",
  "--version",
  "-v"
]);
async function ensureDir() {
  await mkdir(CLAUDEX_DIR, { recursive: true });
}
async function loadAliases() {
  const reg = await readJson(ALIAS_REGISTRY_FILE, emptyRegistry());
  if (!Array.isArray(reg.aliases)) {
    reg.aliases = [];
  }
  return reg;
}
async function saveAliases(reg) {
  await ensureDir();
  await writeJsonSecure(ALIAS_REGISTRY_FILE, reg);
}
function findAlias(reg, alias) {
  const lower = alias.toLowerCase();
  return reg.aliases.find((a) => a.alias.toLowerCase() === lower);
}
function targetsEqual(left, right) {
  if (left.provider !== right.provider)
    return false;
  if (left.provider === "claude" && right.provider === "claude") {
    return left.profileName === right.profileName;
  }
  if (left.provider === "codex" && right.provider === "codex") {
    return left.accountKey === right.accountKey;
  }
  return false;
}
function findAliasByTarget(reg, target) {
  return reg.aliases.find((entry) => targetsEqual(entry.target, target));
}
function findAliasesByTarget(reg, target) {
  return reg.aliases.filter((entry) => targetsEqual(entry.target, target));
}
function aliasExists(reg, alias) {
  return findAlias(reg, alias) !== undefined;
}
function isReservedAlias(alias) {
  return RESERVED.has(alias.toLowerCase());
}
function isValidAlias(alias) {
  if (!alias)
    return false;
  if (isReservedAlias(alias))
    return false;
  if (/[/\\:*?"<>|.\s]/.test(alias))
    return false;
  return true;
}
async function addAlias(alias, target) {
  const reg = await loadAliases();
  if (aliasExists(reg, alias)) {
    throw new Error(`Alias "${alias}" already exists`);
  }
  const existingTarget = findAliasByTarget(reg, target);
  if (existingTarget) {
    throw new Error(`Account already imported as alias "${existingTarget.alias}"`);
  }
  reg.aliases.push({
    alias,
    target,
    createdAt: Date.now()
  });
  await saveAliases(reg);
}
async function removeAlias(alias) {
  const reg = await loadAliases();
  const idx = reg.aliases.findIndex((a) => a.alias.toLowerCase() === alias.toLowerCase());
  if (idx < 0)
    return false;
  reg.aliases.splice(idx, 1);
  await saveAliases(reg);
  return true;
}
async function removeAliasesByTarget(target) {
  const reg = await loadAliases();
  const before = reg.aliases.length;
  reg.aliases = reg.aliases.filter((entry) => !targetsEqual(entry.target, target));
  const removed = before - reg.aliases.length;
  if (removed > 0) {
    await saveAliases(reg);
  }
  return removed;
}
async function renameAlias(currentAlias, nextAlias) {
  const reg = await loadAliases();
  const entry = findAlias(reg, currentAlias);
  if (!entry) {
    throw new Error(`Alias "${currentAlias}" not found`);
  }
  if (!isValidAlias(nextAlias)) {
    throw new Error(`Alias "${nextAlias}" is invalid`);
  }
  if (currentAlias.toLowerCase() !== nextAlias.toLowerCase() && aliasExists(reg, nextAlias)) {
    throw new Error(`Alias "${nextAlias}" already exists`);
  }
  entry.alias = nextAlias;
  await saveAliases(reg);
}

// src/providers/claude/profiles.ts
init_paths();
import { mkdir as mkdir2, readdir, rm } from "fs/promises";

// src/providers/claude/credentials.ts
init_paths();
init_fs();
import { platform } from "os";
import { spawnSync } from "child_process";
var KEYCHAIN_SERVICE = "Claude Code-credentials";
var HEX_PATTERN = /^[0-9a-f]+$/i;
function useKeychain(path) {
  return platform() === "darwin" && path === CREDENTIALS_FILE && process.env.CLAUDEX_FORCE_FILE_CREDENTIALS !== "1";
}
function getKeychainAccount() {
  return process.env.USER ?? spawnSync("whoami").stdout.toString().trim();
}
function parseKeychainCredentials(raw) {
  const payload = raw.trim();
  if (!payload)
    return null;
  try {
    return JSON.parse(payload);
  } catch {}
  if (!HEX_PATTERN.test(payload) || payload.length % 2 !== 0) {
    return null;
  }
  try {
    const json = Buffer.from(payload, "hex").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
async function readKeychain() {
  const result = spawnSync("security", [
    "find-generic-password",
    "-s",
    KEYCHAIN_SERVICE,
    "-a",
    getKeychainAccount(),
    "-w"
  ]);
  if (result.status !== 0)
    return null;
  return parseKeychainCredentials(result.stdout.toString("utf-8"));
}
async function writeKeychain(creds) {
  const payload = JSON.stringify(creds);
  const account = getKeychainAccount();
  const result = spawnSync("security", [
    "add-generic-password",
    "-U",
    "-s",
    KEYCHAIN_SERVICE,
    "-a",
    account,
    "-w",
    payload
  ]);
  if (result.status !== 0) {
    throw new Error("Failed to write to macOS Keychain");
  }
}
async function readJsonFile(path) {
  return readJson(path, null);
}
async function writeJsonFile(creds, path) {
  await writeJsonSecure(path, creds);
}
async function readCredentials(path = CREDENTIALS_FILE) {
  if (useKeychain(path)) {
    return readKeychain();
  }
  return readJsonFile(path);
}
async function writeCredentials(creds, path = CREDENTIALS_FILE) {
  if (useKeychain(path)) {
    return writeKeychain(creds);
  }
  await writeJsonFile(creds, path);
}
async function copyCredentials(from, to) {
  const creds = await readCredentials(from);
  if (!creds)
    throw new Error(`No credentials found at ${from}`);
  await writeCredentials(creds, to);
}

// src/providers/claude/account.ts
init_paths();
init_fs();
async function readOAuthAccount() {
  if (!await fileExists(CLAUDE_JSON))
    return null;
  const data = await readJson(CLAUDE_JSON, {});
  return data.oauthAccount ?? null;
}
async function writeOAuthAccount(account) {
  const data = await readJson(CLAUDE_JSON, {});
  if (account) {
    data.oauthAccount = account;
  } else {
    delete data.oauthAccount;
  }
  await writeJson(CLAUDE_JSON, data);
}

// src/providers/claude/profiles.ts
init_fs();

// src/providers/claude/settings.ts
init_paths();
init_fs();
async function read() {
  return readJson(SETTINGS_FILE, {});
}
async function write(settings) {
  await writeJson(SETTINGS_FILE, settings);
}
async function setApiKey(key) {
  const settings = await read();
  const env2 = settings.env ?? {};
  env2.ANTHROPIC_API_KEY = key;
  settings.env = env2;
  await write(settings);
}
async function clearApiKey() {
  const settings = await read();
  const env2 = settings.env ?? {};
  delete env2.ANTHROPIC_API_KEY;
  if (Object.keys(env2).length === 0) {
    delete settings.env;
  } else {
    settings.env = env2;
  }
  await write(settings);
}

// src/lib/ui.ts
var icons = {
  active: source_default.green("▸"),
  inactive: source_default.dim(" "),
  success: source_default.green("✓"),
  error: source_default.red("✗"),
  arrow: source_default.cyan("→"),
  info: source_default.blue("●")
};
function header(text) {
  return source_default.bold(text);
}
function success(text) {
  console.log(`  ${icons.success} ${text}`);
}
function error(text) {
  console.error(`  ${icons.error} ${source_default.red(text)}`);
}
function info(text) {
  console.log(`  ${icons.info} ${text}`);
}
function hint(text) {
  console.log(source_default.dim(`  ${text}`));
}
function blank() {
  console.log();
}
function sectionHeader(text) {
  console.log(`  ${source_default.dim("──")} ${source_default.bold(text)} ${source_default.dim("──")}`);
}
function formatType(type) {
  switch (type) {
    case "oauth":
      return source_default.blue("oauth");
    case "api-key":
      return source_default.yellow("api-key");
    case "chatgpt":
      return source_default.green("chatgpt");
    case "apikey":
      return source_default.yellow("apikey");
    default:
      return source_default.dim(type);
  }
}
function formatPlan(plan) {
  if (!plan)
    return source_default.dim("unknown");
  const map = {
    max: source_default.magenta("Max"),
    pro: source_default.cyan("Pro"),
    free: source_default.dim("Free"),
    plus: source_default.green("Plus"),
    team: source_default.blue("Team"),
    business: source_default.blue("Business"),
    enterprise: source_default.yellow("Enterprise"),
    edu: source_default.cyan("Edu")
  };
  return map[plan.toLowerCase()] ?? source_default.dim(plan);
}
function formatProvider(provider) {
  return provider === "claude" ? source_default.magenta("Claude") : source_default.green("Codex");
}
function formatUsage(usedPercent) {
  if (usedPercent === null || usedPercent === undefined)
    return source_default.dim("n/a");
  const remaining = Math.max(0, 100 - usedPercent);
  if (remaining > 50)
    return source_default.green(`${remaining.toFixed(0)}%`);
  if (remaining > 20)
    return source_default.yellow(`${remaining.toFixed(0)}%`);
  return source_default.red(`${remaining.toFixed(0)}%`);
}
function maskKey(key) {
  if (key.length <= 12)
    return "••••";
  return key.slice(0, 7) + "••••" + key.slice(-4);
}

// src/providers/claude/profiles.ts
async function ensureDir2(path) {
  await mkdir2(path, { recursive: true });
}
async function readState() {
  return readJson(CLAUDE_STATE_FILE, { active: null });
}
async function writeState(state) {
  await ensureDir2(CLAUDE_PROFILES_DIR);
  await writeJson(CLAUDE_STATE_FILE, state);
}
async function readProfileData(name) {
  return readJson(claudeProfileDataFile(name), { type: "oauth" });
}
async function writeProfileData(name, data) {
  await writeJson(claudeProfileDataFile(name), data);
}
async function profileExists(name) {
  return fileExists(claudeProfileDataFile(name));
}
async function getProfileData(name) {
  return readProfileData(name);
}
async function addOAuthProfile(name, fromCredentials = CREDENTIALS_FILE) {
  await ensureDir2(claudeProfileDir(name));
  await copyCredentials(fromCredentials, claudeProfileCredentials(name));
  await writeProfileData(name, { type: "oauth" });
  const account = await readOAuthAccount();
  if (account) {
    await writeJson(claudeProfileAccountFile(name), account);
  }
  await writeState({ active: name });
}
async function addApiKeyProfile(name, apiKey) {
  await ensureDir2(claudeProfileDir(name));
  await writeProfileData(name, { type: "api-key", apiKey });
  await writeState({ active: name });
  await setApiKey(apiKey);
}
async function switchProfile(name) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const state = await readState();
  const targetData = await readProfileData(name);
  if (state.active) {
    const oldData = await readProfileData(state.active);
    if (oldData.type === "oauth") {
      const currentCreds = await readCredentials(CREDENTIALS_FILE);
      if (currentCreds) {
        await ensureDir2(claudeProfileDir(state.active));
        await copyCredentials(CREDENTIALS_FILE, claudeProfileCredentials(state.active));
      }
      const currentAccount = await readOAuthAccount();
      if (currentAccount) {
        await writeJson(claudeProfileAccountFile(state.active), currentAccount);
      }
    }
  }
  if (targetData.type === "api-key" && targetData.apiKey) {
    await setApiKey(targetData.apiKey);
  } else {
    await clearApiKey();
    await copyCredentials(claudeProfileCredentials(name), CREDENTIALS_FILE);
    const savedAccount = await readJson(claudeProfileAccountFile(name), null);
    if (savedAccount) {
      await writeOAuthAccount(savedAccount);
    }
  }
  await writeState({ active: name });
  return targetData;
}
async function snapshotActiveOAuthProfile(name) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const data = await readProfileData(name);
  if (data.type !== "oauth") {
    throw new Error(`Profile "${name}" is not an OAuth profile`);
  }
  const currentCreds = await readCredentials(CREDENTIALS_FILE);
  if (!currentCreds) {
    throw new Error("No active Claude credentials found");
  }
  await ensureDir2(claudeProfileDir(name));
  await copyCredentials(CREDENTIALS_FILE, claudeProfileCredentials(name));
  const currentAccount = await readOAuthAccount();
  if (currentAccount) {
    await writeJson(claudeProfileAccountFile(name), currentAccount);
  }
}
async function removeProfile(name) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const state = await readState();
  const data = await readProfileData(name);
  if (state.active === name && data.type === "api-key") {
    await clearApiKey();
  }
  await rm(claudeProfileDir(name), { recursive: true });
  if (state.active === name) {
    await writeState({ active: null });
  }
}

// src/providers/codex/registry.ts
init_paths();
init_fs();
import { mkdir as mkdir3 } from "fs/promises";
var DEFAULT_REGISTRY = {
  schema_version: 3,
  active_account_key: null,
  active_account_activated_at_ms: null,
  auto_switch: {
    enabled: false,
    threshold_5h_percent: 10,
    threshold_weekly_percent: 5
  },
  api: { usage: true, account: true },
  accounts: []
};
async function ensureAccountsDir() {
  await mkdir3(CODEX_ACCOUNTS_DIR, { recursive: true });
}
async function loadRegistry() {
  if (!await fileExists(CODEX_REGISTRY_FILE)) {
    return JSON.parse(JSON.stringify(DEFAULT_REGISTRY));
  }
  const reg = await readJson(CODEX_REGISTRY_FILE, DEFAULT_REGISTRY);
  if (!Array.isArray(reg.accounts)) {
    reg.accounts = [];
  }
  return reg;
}
async function saveRegistry(reg) {
  await ensureAccountsDir();
  await writeJson(CODEX_REGISTRY_FILE, reg);
}
function findAccountByKey(reg, accountKey) {
  return reg.accounts.find((a) => a.account_key === accountKey);
}
function addAccountToRegistry(reg, account) {
  const existing = reg.accounts.findIndex((a) => a.account_key === account.account_key);
  if (existing >= 0) {
    reg.accounts[existing] = account;
  } else {
    reg.accounts.push(account);
  }
}
function removeAccountFromRegistry(reg, accountKey) {
  const idx = reg.accounts.findIndex((a) => a.account_key === accountKey);
  if (idx < 0)
    return false;
  reg.accounts.splice(idx, 1);
  if (reg.active_account_key === accountKey) {
    reg.active_account_key = null;
    reg.active_account_activated_at_ms = null;
  }
  return true;
}
function setActiveAccount(reg, accountKey) {
  reg.active_account_key = accountKey;
  reg.active_account_activated_at_ms = Date.now();
  const account = findAccountByKey(reg, accountKey);
  if (account) {
    account.last_used_at = Math.floor(Date.now() / 1000);
  }
}

// src/commands/add.ts
import { spawn, spawnSync as spawnSync2 } from "child_process";

// src/lib/browser.ts
import { platform as platform2 } from "os";
import { join as join2 } from "path";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";
var MACOS_SCRIPT = `#!/bin/bash
URL="$1"
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --incognito "$URL"
elif [ -d "/Applications/Firefox.app" ]; then
  open -na "Firefox" --args --private-window "$URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --inprivate "$URL"
else
  open "$URL"
fi
`;
function createPrivateBrowserScript() {
  if (platform2() !== "darwin")
    return null;
  const path = join2(tmpdir(), `claudex-private-browser-${process.pid}.sh`);
  writeFileSync(path, MACOS_SCRIPT, { mode: 493 });
  return path;
}
function cleanupBrowserScript(path) {
  if (!path)
    return;
  try {
    unlinkSync(path);
  } catch {}
}

// src/commands/add.ts
init_paths();
init_auth();
function readClaudeAuthStatus() {
  const result = spawnSync2("claude", ["auth", "status"], {
    encoding: "utf-8"
  });
  if (result.status !== 0)
    return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}
async function add(alias) {
  blank();
  if (!isValidAlias(alias)) {
    if (isReservedAlias(alias)) {
      error(`"${alias}" is a reserved command name.`);
    } else {
      error("Invalid alias. Use letters, numbers, hyphens, or underscores.");
    }
    blank();
    process.exit(1);
  }
  const reg = await loadAliases();
  if (aliasExists(reg, alias)) {
    error(`Alias "${alias}" already exists.`);
    blank();
    process.exit(1);
  }
  const accountType = await esm_default4({
    message: "What type of account?",
    choices: [
      {
        name: "Claude OAuth — Claude subscription (Pro, Max, Team, etc.)",
        value: "claude-oauth"
      },
      {
        name: "Claude API Key — Anthropic API key",
        value: "claude-apikey"
      },
      {
        name: "Codex ChatGPT — ChatGPT login (Plus, Pro, Team, etc.)",
        value: "codex-chatgpt"
      },
      {
        name: "Codex API Key — OpenAI API key",
        value: "codex-apikey"
      }
    ]
  });
  switch (accountType) {
    case "claude-oauth":
      await addClaudeOAuth(alias);
      break;
    case "claude-apikey":
      await addClaudeApiKey(alias);
      break;
    case "codex-chatgpt":
      await addCodexChatGPT(alias);
      break;
    case "codex-apikey":
      await addCodexApiKey(alias);
      break;
  }
}
async function addClaudeOAuth(alias) {
  const creds = await readCredentials(CREDENTIALS_FILE);
  const authStatus = readClaudeAuthStatus();
  if (creds || authStatus?.loggedIn) {
    const sub = creds?.claudeAiOauth?.subscriptionType ?? authStatus?.subscriptionType ?? null;
    info(`Found active Claude session${sub ? ` (${formatPlan(sub)})` : ""}`);
    const importCurrent = await esm_default2({
      message: "Save this session as the new account?",
      default: true
    });
    if (importCurrent) {
      if (!creds) {
        blank();
        error("Claude reported a session, but credentials could not be read.");
        hint(`Try ${source_default.cyan("claude auth logout")} then ${source_default.cyan("claude auth login")}`);
        blank();
        process.exit(1);
      }
      await addOAuthProfile(alias, CREDENTIALS_FILE);
      await addAlias(alias, { provider: "claude", profileName: alias });
      blank();
      success(`${source_default.bold(alias)} created from current Claude session`);
      blank();
      return;
    }
    if (authStatus?.loggedIn) {
      info("Logging out current Claude session...");
      blank();
      const logout = spawnSync2("claude", ["auth", "logout"], {
        stdio: "inherit"
      });
      if (logout.status !== 0) {
        blank();
        error("Failed to log out.");
        blank();
        process.exit(1);
      }
    }
  }
  info("Opening Claude login...");
  blank();
  const browserScript = createPrivateBrowserScript();
  const env2 = browserScript ? { ...process.env, BROWSER: browserScript } : undefined;
  const proc = spawn("claude", ["auth", "login"], { stdio: "inherit", env: env2 });
  const exitCode = await new Promise((resolve) => proc.on("close", resolve));
  cleanupBrowserScript(browserScript);
  const newCreds = await readCredentials(CREDENTIALS_FILE);
  if (exitCode !== 0 || !newCreds) {
    blank();
    error("Login failed or was cancelled.");
    blank();
    process.exit(1);
  }
  await addOAuthProfile(alias, CREDENTIALS_FILE);
  await addAlias(alias, { provider: "claude", profileName: alias });
  blank();
  success(`${source_default.bold(alias)} created`);
  blank();
}
async function addClaudeApiKey(alias) {
  const key = await esm_default3({
    message: "Paste your Anthropic API key",
    mask: "*",
    validate: (v) => {
      if (!v.trim())
        return "API key cannot be empty";
      return true;
    }
  });
  await addApiKeyProfile(alias, key.trim());
  await addAlias(alias, { provider: "claude", profileName: alias });
  blank();
  success(`${source_default.bold(alias)} created  ${source_default.dim(maskKey(key.trim()))}`);
  blank();
}
async function addCodexChatGPT(alias) {
  const codexCheck = spawnSync2("codex", ["--version"], {
    encoding: "utf-8"
  });
  const hasCodex = codexCheck.status === 0;
  if (!hasCodex) {
    error("Codex CLI not found. Install it with: npm install -g @openai/codex");
    blank();
    process.exit(1);
  }
  info("Running codex login...");
  blank();
  const browserScript2 = createPrivateBrowserScript();
  const env2 = browserScript2 ? { ...process.env, BROWSER: browserScript2 } : undefined;
  const proc = spawn("codex", ["login"], { stdio: "inherit", env: env2 });
  const exitCode = await new Promise((resolve) => proc.on("close", resolve));
  cleanupBrowserScript(browserScript2);
  if (exitCode !== 0) {
    blank();
    error("Login failed or was cancelled.");
    blank();
    process.exit(1);
  }
  const auth = await readActiveAuth();
  if (!auth || !auth.tokens) {
    blank();
    error("Could not read Codex auth after login.");
    blank();
    process.exit(1);
  }
  const tokenInfo = decodeIdToken(auth.tokens.id_token);
  const email = tokenInfo?.email ?? "unknown";
  const userId = tokenInfo?.chatgpt_user_id ?? auth.tokens.account_id ?? "unknown";
  const accountId = tokenInfo?.chatgpt_account_id ?? auth.tokens.account_id ?? "unknown";
  const planType = tokenInfo?.plan_type ?? null;
  if (!userId || userId === "unknown" || !accountId || accountId === "unknown") {
    blank();
    error("Could not extract account info from Codex auth token.");
    blank();
    process.exit(1);
  }
  const accountKey = `${userId}::${accountId}`;
  const existingAlias = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey
  });
  if (existingAlias) {
    blank();
    error(`This Codex account is already imported as "${existingAlias.alias}".`);
    blank();
    process.exit(1);
  }
  await snapshotActiveAuth(accountKey);
  const reg = await loadRegistry();
  const accountRecord = {
    account_key: accountKey,
    chatgpt_account_id: accountId ?? "",
    chatgpt_user_id: userId,
    email,
    alias,
    account_name: null,
    plan: planType,
    auth_mode: "chatgpt",
    created_at: Math.floor(Date.now() / 1000),
    last_used_at: Math.floor(Date.now() / 1000),
    last_usage: null,
    last_usage_at: null,
    last_local_rollout: null
  };
  addAccountToRegistry(reg, accountRecord);
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);
  await addAlias(alias, { provider: "codex", accountKey });
  blank();
  success(`${source_default.bold(alias)} created  ${source_default.dim(email)}`);
  blank();
}
async function addCodexApiKey(alias) {
  const key = await esm_default3({
    message: "Paste your OpenAI API key",
    mask: "*",
    validate: (v) => {
      if (!v.trim())
        return "API key cannot be empty";
      return true;
    }
  });
  const { createHash } = await import("crypto");
  const keyHash = createHash("sha256").update(key.trim()).digest("hex").slice(0, 16);
  const accountKey = `apikey::${keyHash}`;
  const existingAlias = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey
  });
  if (existingAlias) {
    blank();
    error(`This Codex account is already imported as "${existingAlias.alias}".`);
    blank();
    process.exit(1);
  }
  const { saveAccountAuth: saveAccountAuth2 } = await Promise.resolve().then(() => (init_auth(), exports_auth));
  await saveAccountAuth2(accountKey, {
    auth_mode: "apikey",
    OPENAI_API_KEY: key.trim(),
    tokens: {
      id_token: "",
      access_token: "",
      refresh_token: "",
      account_id: ""
    },
    last_refresh: new Date().toISOString()
  });
  const reg = await loadRegistry();
  const accountRecord = {
    account_key: accountKey,
    chatgpt_account_id: "",
    chatgpt_user_id: "",
    email: "",
    alias,
    account_name: null,
    plan: null,
    auth_mode: "apikey",
    created_at: Math.floor(Date.now() / 1000),
    last_used_at: Math.floor(Date.now() / 1000),
    last_usage: null,
    last_usage_at: null,
    last_local_rollout: null
  };
  addAccountToRegistry(reg, accountRecord);
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);
  await addAlias(alias, { provider: "codex", accountKey });
  blank();
  success(`${source_default.bold(alias)} created  ${source_default.dim(maskKey(key.trim()))}`);
  blank();
}

// src/commands/use.ts
init_paths();
init_auth();
async function use(aliasOrName) {
  blank();
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);
  if (!entry) {
    error(`Alias "${aliasOrName}" not found.`);
    hint(`Run ${source_default.cyan("claudex-switch list")} to see your accounts`);
    blank();
    process.exit(1);
  }
  if (entry.target.provider === "claude") {
    await switchClaude(entry.alias, entry.target.profileName);
  } else {
    await switchCodex(entry.alias, entry.target.accountKey);
  }
}
async function switchClaude(alias, profileName) {
  if (!await profileExists(profileName)) {
    error(`Claude profile "${profileName}" no longer exists.`);
    hint("The underlying profile may have been removed.");
    blank();
    process.exit(1);
  }
  const data = await switchProfile(profileName);
  let label;
  if (data.type === "api-key" && data.apiKey) {
    label = source_default.dim(maskKey(data.apiKey));
  } else {
    const creds = await readCredentials(claudeProfileCredentials(profileName));
    label = formatPlan(creds?.claudeAiOauth?.subscriptionType ?? null);
  }
  success(`Switched to ${source_default.bold(alias)}  ${formatProvider("claude")}  ${formatType(data.type)}  ${label}`);
  blank();
}
async function switchCodex(alias, accountKey) {
  const reg = await loadRegistry();
  const account = findAccountByKey(reg, accountKey);
  if (!account) {
    error(`Codex account not found in registry.`);
    hint("The account may have been removed by codex-auth.");
    blank();
    process.exit(1);
  }
  try {
    await switchToAccount(accountKey);
  } catch (err) {
    error(`Failed to switch: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  }
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);
  const plan = formatPlan(account.plan ?? account.last_usage?.plan_type ?? null);
  const email = account.email ? source_default.dim(account.email) : "";
  success(`Switched to ${source_default.bold(alias)}  ${formatProvider("codex")}  ${plan}  ${email}`);
  blank();
}

// src/commands/list.ts
init_paths();
init_fs();
async function list() {
  const aliasReg = await loadAliases();
  if (aliasReg.aliases.length === 0) {
    blank();
    console.log(header("  No accounts yet"));
    blank();
    hint(`Run ${source_default.cyan("claudex-switch import")} to import existing accounts`);
    hint(`or  ${source_default.cyan("claudex-switch add <alias>")} to add a new one`);
    blank();
    return;
  }
  const claudeAliases = aliasReg.aliases.filter((a) => a.target.provider === "claude");
  const codexAliases = aliasReg.aliases.filter((a) => a.target.provider === "codex");
  const claudeState = await readState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {}
  blank();
  console.log(header("  Accounts"));
  if (claudeAliases.length > 0) {
    blank();
    sectionHeader("Claude");
    const maxAliasLen = Math.max(...claudeAliases.map((a) => a.alias.length));
    for (const entry of claudeAliases) {
      const info2 = await getClaudeAccountInfo(entry, claudeState.active);
      const icon = info2.isActive ? icons.active : icons.inactive;
      const name = info2.isActive ? source_default.green.bold(info2.alias) : info2.alias;
      const paddedName = name + " ".repeat(Math.max(0, maxAliasLen - info2.alias.length));
      const type = formatType(info2.authMode);
      const plan = formatPlan(info2.plan);
      const email = info2.email ? source_default.dim(info2.email) : "";
      console.log(`  ${icon} ${paddedName}  ${type}  ${plan}  ${email}`);
    }
  }
  if (codexAliases.length > 0) {
    blank();
    sectionHeader("Codex");
    const maxAliasLen = Math.max(...codexAliases.map((a) => a.alias.length));
    for (const entry of codexAliases) {
      const info2 = await getCodexAccountInfo(entry, codexReg);
      const icon = info2.isActive ? icons.active : icons.inactive;
      const name = info2.isActive ? source_default.green.bold(info2.alias) : info2.alias;
      const paddedName = name + " ".repeat(Math.max(0, maxAliasLen - info2.alias.length));
      const type = formatType(info2.authMode);
      const plan = formatPlan(info2.plan);
      const email = info2.email ? source_default.dim(info2.email) : "";
      let usageStr = "";
      if (info2.usage) {
        const fiveH = formatUsage(info2.usage.primaryPercent);
        const weekly = formatUsage(info2.usage.secondaryPercent);
        usageStr = `  5h${source_default.dim("rem")}: ${fiveH}  wk${source_default.dim("rem")}: ${weekly}`;
      }
      console.log(`  ${icon} ${paddedName}  ${type}  ${plan}  ${email}${usageStr}`);
    }
  }
  blank();
}
async function getClaudeAccountInfo(entry, activeProfile) {
  if (entry.target.provider !== "claude")
    throw new Error("Not a claude alias");
  const profileName = entry.target.profileName;
  let plan = null;
  let email = null;
  let authMode = "oauth";
  try {
    const profileData = await readJson(claudeProfileDataFile(profileName), { type: "oauth" });
    authMode = profileData.type;
    if (profileData.type === "api-key" && profileData.apiKey) {
      plan = maskKey(profileData.apiKey);
    } else {
      const creds = await readCredentials(claudeProfileCredentials(profileName));
      plan = creds?.claudeAiOauth?.subscriptionType ?? null;
      const account = await readJson(claudeProfileAccountFile(profileName), null);
      email = account?.emailAddress ?? null;
    }
  } catch {}
  return {
    alias: entry.alias,
    provider: "claude",
    email,
    plan,
    authMode,
    isActive: activeProfile === profileName,
    usage: null
  };
}
async function getCodexAccountInfo(entry, codexReg) {
  if (entry.target.provider !== "codex")
    throw new Error("Not a codex alias");
  const accountKey = entry.target.accountKey;
  const account = codexReg?.accounts?.find((a) => a.account_key === accountKey);
  const isActive = codexReg?.active_account_key === accountKey;
  if (!account) {
    return {
      alias: entry.alias,
      provider: "codex",
      email: null,
      plan: null,
      authMode: "unknown",
      isActive,
      usage: null
    };
  }
  return {
    alias: entry.alias,
    provider: "codex",
    email: account.email || null,
    plan: account.plan ?? account.last_usage?.plan_type ?? null,
    authMode: account.auth_mode ?? "chatgpt",
    isActive,
    usage: account.last_usage ? {
      primaryPercent: account.last_usage.primary?.used_percent ?? null,
      secondaryPercent: account.last_usage.secondary?.used_percent ?? null,
      primaryResetsAt: account.last_usage.primary?.resets_at ?? null,
      secondaryResetsAt: account.last_usage.secondary?.resets_at ?? null
    } : null
  };
}

// src/commands/remove.ts
async function remove(aliasName) {
  blank();
  const reg = await loadAliases();
  const entry = findAlias(reg, aliasName);
  if (!entry) {
    error(`Alias "${aliasName}" not found.`);
    blank();
    process.exit(1);
  }
  const provider = entry.target.provider;
  const ok = await esm_default2({
    message: `Remove alias "${aliasName}"? The ${formatProvider(provider)} account will be kept.`,
    default: false
  });
  if (!ok) {
    console.log(source_default.dim("  Cancelled"));
    blank();
    return;
  }
  await removeAlias(aliasName);
  blank();
  success(`${source_default.bold(aliasName)} alias removed`);
  blank();
}

// src/commands/rename.ts
async function rename(currentAlias, nextAlias) {
  blank();
  const reg = await loadAliases();
  const entry = findAlias(reg, currentAlias);
  if (!entry) {
    error(`Alias "${currentAlias}" not found.`);
    blank();
    process.exit(1);
  }
  if (!isValidAlias(nextAlias)) {
    if (isReservedAlias(nextAlias)) {
      error(`"${nextAlias}" is a reserved command name.`);
    } else {
      error("Invalid alias. Use letters, numbers, hyphens, or underscores.");
    }
    blank();
    process.exit(1);
  }
  if (currentAlias.toLowerCase() !== nextAlias.toLowerCase() && aliasExists(reg, nextAlias)) {
    error(`Alias "${nextAlias}" already exists.`);
    blank();
    process.exit(1);
  }
  const ok = await esm_default2({
    message: `Rename alias "${currentAlias}" to "${nextAlias}"?`,
    default: true
  });
  if (!ok) {
    console.log(source_default.dim("  Cancelled"));
    blank();
    return;
  }
  await renameAlias(currentAlias, nextAlias);
  blank();
  success(`${source_default.bold(currentAlias)} renamed to ${source_default.bold(nextAlias)}`);
  blank();
}

// src/commands/purge.ts
import { unlink } from "fs/promises";
init_paths();
init_fs();
async function purge(aliasName) {
  blank();
  const reg = await loadAliases();
  const entry = findAlias(reg, aliasName);
  if (!entry) {
    error(`Alias "${aliasName}" not found.`);
    blank();
    process.exit(1);
  }
  const linkedAliases = findAliasesByTarget(reg, entry.target).map((item) => item.alias);
  const aliasCount = linkedAliases.length;
  const aliasLabel = aliasCount === 1 ? `This will also remove alias "${aliasName}".` : `This will also remove ${aliasCount} aliases: ${linkedAliases.join(", ")}.`;
  const ok = await esm_default2({
    message: `Purge ${formatProvider(entry.target.provider)} account "${aliasName}"? ${aliasLabel}`,
    default: false
  });
  if (!ok) {
    console.log(source_default.dim("  Cancelled"));
    blank();
    return;
  }
  if (entry.target.provider === "claude") {
    try {
      if (await profileExists(entry.target.profileName)) {
        await removeProfile(entry.target.profileName);
      }
    } catch {}
  } else {
    try {
      const codexReg = await loadRegistry();
      const removed = removeAccountFromRegistry(codexReg, entry.target.accountKey);
      if (removed) {
        await saveRegistry(codexReg);
      }
      const authFile = codexAccountAuthFile(entry.target.accountKey);
      if (await fileExists(authFile)) {
        await unlink(authFile);
      }
    } catch {}
  }
  await removeAliasesByTarget(entry.target);
  blank();
  success(`${source_default.bold(aliasName)} account purged`);
  blank();
}

// src/commands/current.ts
async function current() {
  const aliasReg = await loadAliases();
  const claudeState = await readState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {}
  blank();
  let found = false;
  if (claudeState.active) {
    const alias = aliasReg.aliases.find((a) => a.target.provider === "claude" && a.target.profileName === claudeState.active);
    const displayName = alias ? alias.alias : claudeState.active;
    console.log(`  ${formatProvider("claude")}:  ${source_default.green.bold(displayName)}`);
    found = true;
  }
  if (codexReg?.active_account_key) {
    const alias = aliasReg.aliases.find((a) => a.target.provider === "codex" && a.target.accountKey === codexReg.active_account_key);
    const account = codexReg.accounts?.find((a) => a.account_key === codexReg.active_account_key);
    const displayName = alias ? alias.alias : account?.email ?? codexReg.active_account_key;
    console.log(`  ${formatProvider("codex")}:   ${source_default.green.bold(displayName)}`);
    found = true;
  }
  if (!found) {
    console.log(source_default.dim("  No active accounts"));
    hint(`Run ${source_default.cyan("claudex-switch add <alias>")} to create one`);
  }
  blank();
}

// src/commands/import.ts
init_paths();
init_fs();
import { readdir as readdir2 } from "fs/promises";
async function importAccounts() {
  blank();
  info("Scanning for existing accounts...");
  blank();
  const reg = await loadAliases();
  let imported = 0;
  let skipped = 0;
  const claudeResult = await importClaudeProfiles(reg);
  imported += claudeResult.imported;
  skipped += claudeResult.skipped;
  const codexResult = await importCodexAccounts(reg);
  imported += codexResult.imported;
  skipped += codexResult.skipped;
  await saveAliases(reg);
  blank();
  if (imported > 0) {
    success(`Imported ${imported} account(s)`);
  } else {
    info("No new accounts to import");
  }
  if (skipped > 0) {
    hint(`${skipped} account(s) skipped`);
  }
  blank();
}
async function importClaudeProfiles(reg) {
  if (!await fileExists(CLAUDE_PROFILES_DIR))
    return { imported: 0, skipped: 0 };
  let imported = 0;
  let skipped = 0;
  const entries = await readdir2(CLAUDE_PROFILES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory())
      continue;
    const name = entry.name;
    const target = { provider: "claude", profileName: name };
    const existing = findAliasByTarget(reg, target);
    if (existing) {
      console.log(source_default.dim(`  skip  ${name} (already imported as "${existing.alias}")`));
      skipped++;
      continue;
    }
    if (!isValidAlias(name) || aliasExists(reg, name)) {
      console.log(source_default.dim(`  skip  ${name} (${aliasExists(reg, name) ? "alias already exists" : "invalid alias name"})`));
      skipped++;
      continue;
    }
    reg.aliases.push({
      alias: name,
      target,
      createdAt: Date.now()
    });
    console.log(`  ${source_default.green("+")} ${name}  ${source_default.dim("(claude)")}`);
    imported++;
  }
  return { imported, skipped };
}
async function importCodexAccounts(reg) {
  let imported = 0;
  let skipped = 0;
  try {
    const codexReg = await loadRegistry();
    if (!codexReg.accounts || codexReg.accounts.length === 0) {
      return { imported, skipped };
    }
    for (const account of codexReg.accounts) {
      const target = {
        provider: "codex",
        accountKey: account.account_key
      };
      const existing = findAliasByTarget(reg, target);
      if (existing) {
        console.log(source_default.dim(`  skip  ${account.email || account.account_key} (already imported as "${existing.alias}")`));
        skipped++;
        continue;
      }
      let alias = account.alias && account.alias.trim() ? account.alias.trim() : null;
      if (!alias) {
        const emailPrefix = account.email?.split("@")[0];
        if (emailPrefix) {
          const plan = account.plan ?? "codex";
          alias = `${emailPrefix}-${plan}`;
        } else {
          alias = `codex-${account.account_key.slice(0, 8)}`;
        }
      }
      alias = alias.replace(/[/\\:*?"<>|.\s]/g, "-");
      let finalAlias = alias;
      let counter = 1;
      while (!isValidAlias(finalAlias) || aliasExists(reg, finalAlias)) {
        finalAlias = `${alias}-${counter}`;
        counter++;
        if (counter > 100) {
          skipped++;
          break;
        }
      }
      if (counter > 100)
        continue;
      reg.aliases.push({
        alias: finalAlias,
        target,
        createdAt: Date.now()
      });
      console.log(`  ${source_default.green("+")} ${finalAlias}  ${source_default.dim("(codex)")}  ${source_default.dim(account.email || "")}`);
      imported++;
    }
  } catch {}
  return { imported, skipped };
}

// src/commands/refresh.ts
import { spawn as spawn2 } from "child_process";
init_fs();
init_paths();
init_auth();
async function refresh(aliasOrName) {
  blank();
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);
  if (!entry) {
    error(`Alias "${aliasOrName}" not found.`);
    hint(`Run ${source_default.cyan("claudex-switch list")} to see your accounts`);
    blank();
    process.exit(1);
  }
  if (entry.target.provider === "claude") {
    await refreshClaude(entry.alias, entry.target.profileName);
  } else {
    await refreshCodex(entry.alias, entry.target.accountKey);
  }
}
async function refreshClaude(alias, profileName) {
  if (!await profileExists(profileName)) {
    error(`Claude profile "${profileName}" no longer exists.`);
    hint("The underlying profile may have been removed.");
    blank();
    process.exit(1);
  }
  const profile = await getProfileData(profileName);
  if (profile.type !== "oauth") {
    error("Claude API key accounts do not need refresh.");
    blank();
    process.exit(1);
  }
  const savedAccount = await readJson(claudeProfileAccountFile(profileName), null);
  await switchProfile(profileName);
  info(`Opening Claude login for ${source_default.bold(alias)}...`);
  blank();
  const exitCode = await runLoginCommand("claude", [
    "auth",
    "login"
  ]);
  if (exitCode !== 0) {
    blank();
    error("Claude login failed or was cancelled.");
    hint(`If Claude refuses the current session, run ${source_default.cyan("claude auth logout")} and retry.`);
    blank();
    process.exit(1);
  }
  const currentAccount = await readOAuthAccount();
  if (!matchesClaudeAccount(savedAccount, currentAccount)) {
    await switchProfile(profileName);
    blank();
    error(`Claude login completed for a different account (${formatClaudeIdentity(currentAccount)}).`);
    hint(`Retry and sign in as ${source_default.cyan(savedAccount?.emailAddress ?? savedAccount?.accountUuid ?? alias)}.`);
    blank();
    process.exit(1);
  }
  try {
    await snapshotActiveOAuthProfile(profileName);
  } catch (err) {
    await switchProfile(profileName);
    blank();
    error(`Could not save refreshed Claude credentials: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  }
  const creds = await readCredentials();
  const account = await readOAuthAccount();
  const label = formatPlan(creds?.claudeAiOauth?.subscriptionType ?? null);
  const email = account?.emailAddress ? `  ${source_default.dim(account.emailAddress)}` : "";
  success(`Refreshed ${source_default.bold(alias)}  ${formatProvider("claude")}  ${formatType("oauth")}  ${label}${email}`);
  blank();
}
async function refreshCodex(alias, accountKey) {
  const reg = await loadRegistry();
  const account = findAccountByKey(reg, accountKey);
  if (!account) {
    error("Codex account not found in registry.");
    hint("The account may have been removed by codex-auth.");
    blank();
    process.exit(1);
  }
  if (account.auth_mode === "apikey") {
    error("Codex API key accounts do not need refresh.");
    blank();
    process.exit(1);
  }
  try {
    await switchToAccount(accountKey);
  } catch (err) {
    error(`Failed to prepare Codex auth: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  }
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);
  info(`Opening Codex login for ${source_default.bold(alias)}...`);
  blank();
  const exitCode = await runLoginCommand("codex", ["login"]);
  if (exitCode !== 0) {
    blank();
    error("Codex login failed or was cancelled.");
    hint(`If Codex reports an expired refresh token, run ${source_default.cyan("codex logout")} and retry.`);
    blank();
    process.exit(1);
  }
  const auth = await readActiveAuth();
  if (!auth || !auth.tokens) {
    await switchToAccount(accountKey);
    blank();
    error("Could not read Codex auth after login.");
    blank();
    process.exit(1);
  }
  const tokenInfo = decodeIdToken(auth.tokens.id_token);
  const email = tokenInfo?.email ?? account.email ?? "unknown";
  const userId = tokenInfo?.chatgpt_user_id ?? auth.tokens.account_id ?? "unknown";
  const accountId = tokenInfo?.chatgpt_account_id ?? auth.tokens.account_id ?? "unknown";
  const refreshedKey = `${userId}::${accountId}`;
  if (refreshedKey !== accountKey) {
    await switchToAccount(accountKey);
    blank();
    error(`Codex login completed for a different account (${email}).`);
    hint(`Retry and sign in as ${source_default.cyan(account.email || alias)}.`);
    blank();
    process.exit(1);
  }
  await snapshotActiveAuth(accountKey);
  account.email = tokenInfo?.email ?? account.email;
  account.chatgpt_user_id = userId;
  account.chatgpt_account_id = accountId;
  account.plan = tokenInfo?.plan_type ?? account.plan;
  account.auth_mode = "chatgpt";
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);
  success(`Refreshed ${source_default.bold(alias)}  ${formatProvider("codex")}  ${formatPlan(account.plan ?? null)}  ${source_default.dim(account.email || "")}`);
  blank();
}
function matchesClaudeAccount(expected, actual) {
  if (!expected || !actual)
    return true;
  const expectedId = expected.accountUuid ?? expected.emailAddress ?? null;
  const actualId = actual.accountUuid ?? actual.emailAddress ?? null;
  if (!expectedId || !actualId)
    return true;
  return expectedId === actualId;
}
function formatClaudeIdentity(account) {
  return account?.emailAddress ?? account?.accountUuid ?? "unknown";
}
async function runLoginCommand(command, args) {
  const browserScript = createPrivateBrowserScript();
  const env2 = browserScript ? { ...process.env, BROWSER: browserScript } : undefined;
  try {
    const proc = spawn2(command, args, { stdio: "inherit", env: env2 });
    return await new Promise((resolve, reject) => {
      proc.on("close", resolve);
      proc.on("error", reject);
    });
  } catch (err) {
    error(`Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  } finally {
    cleanupBrowserScript(browserScript);
  }
}

// src/lib/update.ts
import { spawnSync as spawnSync3 } from "child_process";
// package.json
var package_default = {
  name: "claudex-switch",
  version: "1.1.4",
  description: "Switch between Claude Code and Codex accounts with ease",
  type: "module",
  bin: {
    "claudex-switch": "./dist/claudex-switch.js"
  },
  files: ["dist"],
  scripts: {
    build: "bun build ./src/index.ts --target node --outfile ./dist/claudex-switch.js",
    "build:binary": "bun build ./src/index.ts --compile --outfile ./dist/claudex-switch",
    "build:release": "./scripts/build-release-assets.sh ./release",
    dev: "bun run src/index.ts",
    test: "bun test --preload ./tests/preload.ts",
    verify: "bun run test && bun run build && bun ./dist/claudex-switch.js help >/dev/null",
    "release:guard": "bash ./scripts/check-release-state.sh",
    prepublishOnly: "bun run verify"
  },
  repository: {
    type: "git",
    url: "git+https://github.com/Holden-Lin/claudex-switch.git"
  },
  homepage: "https://github.com/Holden-Lin/claudex-switch",
  bugs: {
    url: "https://github.com/Holden-Lin/claudex-switch/issues"
  },
  keywords: ["claude", "codex", "account-switcher", "cli", "bun"],
  license: "MIT",
  engines: {
    bun: ">=1.3.5"
  },
  dependencies: {
    chalk: "^5.4.1",
    "@inquirer/prompts": "^7.5.0"
  },
  devDependencies: {
    "@types/bun": "^1.2.0",
    typescript: "^5.7.0"
  }
};

// src/lib/update.ts
var REPO = "Holden-Lin/claudex-switch";
var LATEST_RELEASE_URL = `https://github.com/${REPO}/releases/latest`;
var BUN_INSTALL_SPEC = `git+https://github.com/${REPO}.git`;
var HOMEBREW_FORMULA_URL = `https://raw.githubusercontent.com/${REPO}/main/Formula/claudex-switch.rb`;
var SKIP_AUTO_UPDATE_ENV = "CLAUDEX_SKIP_AUTO_UPDATE";
var DISABLE_AUTO_UPDATE_ENV = "CLAUDEX_DISABLE_AUTO_UPDATE";
var CURRENT_VERSION = normalizeVersion(package_default.version);
function normalizeVersion(version) {
  return version.replace(/^v/, "");
}
function compareVersions(a, b) {
  const aParts = normalizeVersion(a).split(/[.-]/);
  const bParts = normalizeVersion(b).split(/[.-]/);
  const length = Math.max(aParts.length, bParts.length);
  for (let i = 0;i < length; i += 1) {
    const aValue = Number.parseInt(aParts[i] ?? "0", 10);
    const bValue = Number.parseInt(bParts[i] ?? "0", 10);
    if (aValue > bValue)
      return 1;
    if (aValue < bValue)
      return -1;
  }
  return 0;
}
function extractVersionFromReleaseUrl(url) {
  const match = url.match(/\/tag\/(v?[^/?#]+)$/);
  return match ? normalizeVersion(match[1]) : null;
}
async function fetchLatestReleaseVersion(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(LATEST_RELEASE_URL, {
      headers: { "user-agent": "claudex-switch" },
      redirect: "follow",
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) {
      return null;
    }
    return extractVersionFromReleaseUrl(response.url);
  } catch {
    return null;
  }
}
function detectInstallMethod(argv = process.argv, execPath = process.execPath, runCommand = spawnSync3) {
  const brewPrefix = readCommandStdout(runCommand("brew", ["--prefix"], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"]
  }));
  const cliPath = resolveCliPath(argv, execPath);
  if (brewPrefix && cliPath && cliPath.startsWith(brewPrefix)) {
    return "brew";
  }
  const bunCheck = runCommand("bun", ["--version"], {
    stdio: ["ignore", "ignore", "ignore"]
  });
  if (bunCheck.status === 0 && !bunCheck.error) {
    return "bun";
  }
  return null;
}
async function checkForLatestUpdate(options = {}, settings = {}) {
  const argv = options.argv ?? process.argv;
  const env2 = options.env ?? process.env;
  const execPath = options.execPath ?? process.execPath;
  const fetchLatestVersion = options.fetchLatestVersion ?? fetchLatestReleaseVersion;
  const runCommand = options.runCommand ?? spawnSync3;
  const respectDisableEnv = settings.respectDisableEnv ?? true;
  if (respectDisableEnv && (env2[SKIP_AUTO_UPDATE_ENV] === "1" || env2[DISABLE_AUTO_UPDATE_ENV] === "1")) {
    return {
      status: "disabled",
      currentVersion: CURRENT_VERSION
    };
  }
  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) {
    return {
      status: "unavailable",
      currentVersion: CURRENT_VERSION
    };
  }
  if (compareVersions(latestVersion, CURRENT_VERSION) <= 0) {
    return {
      status: "up-to-date",
      currentVersion: CURRENT_VERSION,
      latestVersion
    };
  }
  const installMethod = detectInstallMethod(argv, execPath, runCommand);
  if (!installMethod) {
    return {
      status: "unsupported",
      currentVersion: CURRENT_VERSION,
      latestVersion
    };
  }
  return {
    status: "available",
    currentVersion: CURRENT_VERSION,
    latestVersion,
    installMethod,
    argv,
    env: env2,
    execPath,
    runCommand
  };
}
function installLatestUpdate(update) {
  const updateEnv = createUpdateEnv(update.env);
  const ok = update.installMethod === "brew" ? updateWithHomebrew(update.runCommand, updateEnv) : updateWithBun(update.latestVersion, update.runCommand, updateEnv);
  return { ok, env: updateEnv };
}
async function runAutoUpdateIfNeeded(options = {}) {
  const update = await checkForLatestUpdate(options);
  if (update.status !== "available") {
    return { action: "continue" };
  }
  info(`Updating claudex-switch from v${update.currentVersion} to v${update.latestVersion}`);
  hint("Running self-update before continuing...");
  const installed = installLatestUpdate(update);
  if (!installed.ok) {
    hint("Auto-update failed; continuing with current version.");
    return { action: "continue" };
  }
  const restart = update.runCommand(update.argv[0] ?? update.execPath, update.argv.slice(1), {
    env: installed.env,
    stdio: "inherit"
  });
  return { action: "restart", exitCode: restart.status ?? 1 };
}
function createUpdateEnv(env2) {
  return {
    ...env2,
    [SKIP_AUTO_UPDATE_ENV]: "1"
  };
}
function updateWithHomebrew(runCommand, env2) {
  const result = runCommand("brew", ["install", "--formula", HOMEBREW_FORMULA_URL], {
    env: env2,
    stdio: "inherit"
  });
  return result.status === 0 && !result.error;
}
function updateWithBun(version, runCommand, env2) {
  const installArgs = [
    "install",
    "-g",
    `${BUN_INSTALL_SPEC}#v${normalizeVersion(version)}`
  ];
  const directInstall = runCommand("bun", installArgs, {
    env: env2,
    stdio: "inherit"
  });
  if (directInstall.status === 0 && !directInstall.error) {
    return true;
  }
  const remove2 = runCommand("bun", ["remove", "-g", "claudex-switch"], {
    env: env2,
    stdio: "inherit"
  });
  if (remove2.status !== 0 || remove2.error) {
    return false;
  }
  const reinstall = runCommand("bun", installArgs, {
    env: env2,
    stdio: "inherit"
  });
  return reinstall.status === 0 && !reinstall.error;
}
function readCommandStdout(result) {
  return typeof result.stdout === "string" ? result.stdout.trim() : "";
}
function resolveCliPath(argv, execPath) {
  const scriptPath = argv[1];
  if (scriptPath && /[\\/]/.test(scriptPath)) {
    return scriptPath;
  }
  return argv[0] || execPath || null;
}

// src/commands/version.ts
function version() {
  console.log(CURRENT_VERSION);
}

// src/commands/update.ts
async function update() {
  blank();
  const result = await checkForLatestUpdate({}, {
    respectDisableEnv: false
  });
  switch (result.status) {
    case "available": {
      info(`Updating claudex-switch from v${result.currentVersion} to v${result.latestVersion}`);
      hint("Running self-update...");
      const installed = installLatestUpdate(result);
      if (!installed.ok) {
        blank();
        error("Update failed.");
        hint(`If this install is managed externally, reinstall it manually or retry ${source_default.cyan("claudex-switch update")}.`);
        blank();
        process.exit(1);
      }
      success(`Updated to v${result.latestVersion}`);
      blank();
      return;
    }
    case "up-to-date":
      info(`claudex-switch is already up to date (v${result.currentVersion})`);
      blank();
      return;
    case "unsupported":
      error("Could not determine how this claudex-switch install was installed.");
      hint("Automatic update currently supports Bun and Homebrew installs.");
      blank();
      process.exit(1);
    case "unavailable":
      error("Could not determine the latest release version.");
      hint("Check your network connection and GitHub Release availability.");
      blank();
      process.exit(1);
    case "disabled":
      info(`claudex-switch is already up to date (v${result.currentVersion})`);
      blank();
      return;
  }
}

// src/index.ts
var HELP = `
  ${source_default.bold("claudex-switch")} — Manage Claude Code and Codex accounts

  ${source_default.dim("Usage:")}
    claudex-switch                     Interactive account picker
    claudex-switch <alias>             Switch to an account
    claudex-switch add <alias>         Add a new account
    claudex-switch use <alias>         Switch to an account
    claudex-switch list                List all accounts
    claudex-switch rename <from> <to>  Rename an alias
    claudex-switch remove <alias>      Remove an alias only
    claudex-switch purge <alias>       Delete an account and all linked aliases
    claudex-switch refresh <alias>     Refresh and resave an account login
    claudex-switch current             Show active accounts
    claudex-switch import              Import existing accounts
    claudex-switch update              Upgrade to the latest release
    claudex-switch --version           Show version and auto-update to the latest release
    claudex-switch help                Show this help

  ${source_default.dim("Shortcuts:")}
    claudex-switch ls                  Same as 'list'
    claudex-switch rm <alias>          Same as 'remove'
    claudex-switch -V                  Same as '--version'
`;
function isVersionCommand(command) {
  return command === "--version" || command === "-V";
}
async function interactivePicker() {
  const aliasReg = await loadAliases();
  if (aliasReg.aliases.length === 0) {
    blank();
    console.log(source_default.bold("  Welcome to claudex-switch"));
    blank();
    console.log(source_default.dim(`  Run ${source_default.cyan("claudex-switch import")} to import existing accounts`));
    console.log(source_default.dim(`  or  ${source_default.cyan("claudex-switch add <alias>")} to add a new one`));
    blank();
    return;
  }
  blank();
  const claudeState = await readState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {}
  const choices = aliasReg.aliases.map((entry) => {
    const provider = formatProvider(entry.target.provider);
    let isActive = false;
    if (entry.target.provider === "claude") {
      isActive = claudeState.active === entry.target.profileName;
    } else if (entry.target.provider === "codex" && codexReg) {
      isActive = codexReg.active_account_key === entry.target.accountKey;
    }
    const active = isActive ? source_default.dim(" (active)") : "";
    return {
      name: `${entry.alias}  ${provider}${active}`,
      value: entry.alias
    };
  });
  const choice = await esm_default4({
    message: "Switch to account",
    choices
  });
  await use(choice);
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (isVersionCommand(command)) {
      const autoUpdate = await runAutoUpdateIfNeeded();
      if (autoUpdate.action === "restart") {
        process.exit(autoUpdate.exitCode);
      }
      version();
      return;
    }
    switch (command) {
      case "add":
        if (!args[0]) {
          console.error(source_default.red(`
  Usage: claudex-switch add <alias>
`));
          process.exit(1);
        }
        await add(args[0]);
        break;
      case "use":
        if (!args[0]) {
          console.error(source_default.red(`
  Usage: claudex-switch use <alias>
`));
          process.exit(1);
        }
        await use(args[0]);
        break;
      case "list":
      case "ls":
        await list();
        break;
      case "remove":
      case "rm":
        if (!args[0]) {
          console.error(source_default.red(`
  Usage: claudex-switch remove <alias>
`));
          process.exit(1);
        }
        await remove(args[0]);
        break;
      case "rename":
        if (!args[0] || !args[1]) {
          console.error(source_default.red(`
  Usage: claudex-switch rename <from> <to>
`));
          process.exit(1);
        }
        await rename(args[0], args[1]);
        break;
      case "purge":
        if (!args[0]) {
          console.error(source_default.red(`
  Usage: claudex-switch purge <alias>
`));
          process.exit(1);
        }
        await purge(args[0]);
        break;
      case "current":
        await current();
        break;
      case "refresh":
        if (!args[0]) {
          console.error(source_default.red(`
  Usage: claudex-switch refresh <alias>
`));
          process.exit(1);
        }
        await refresh(args[0]);
        break;
      case "import":
        await importAccounts();
        break;
      case "update":
        await update();
        break;
      case "help":
      case "--help":
      case "-h":
        console.log(HELP);
        break;
      case "--version":
      case "-V":
        version();
        break;
      case undefined:
        await interactivePicker();
        break;
      default: {
        const aliasReg = await loadAliases();
        const match = findAlias(aliasReg, command);
        if (match) {
          await use(command);
        } else {
          console.error(source_default.red(`
  Unknown command: "${command}"`));
          console.log(HELP);
          process.exit(1);
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("User force closed")) {
      blank();
      process.exit(0);
    }
    throw err;
  }
}
main();

#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
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
    const setState = AsyncResource2.bind(function setState(newValue) {
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
// node_modules/@inquirer/input/dist/esm/index.js
var inputTheme = {
  validationFailureMode: "keep"
};
var esm_default3 = createPrompt((config, done) => {
  const { prefill = "tab" } = config;
  const theme = makeTheme(inputTheme, config.theme);
  const [status, setStatus] = useState("idle");
  const [defaultValue = "", setDefaultValue] = useState(config.default);
  const [errorMsg, setError] = useState();
  const [value, setValue] = useState("");
  const prefix = usePrefix({ status, theme });
  async function validate(value2) {
    const { required, pattern, patternError = "Invalid input" } = config;
    if (required && !value2) {
      return "You must provide a value";
    }
    if (pattern && !pattern.test(value2)) {
      return patternError;
    }
    if (typeof config.validate === "function") {
      return await config.validate(value2) || "You must provide a valid value";
    }
    return true;
  }
  useKeypress(async (key, rl) => {
    if (status !== "idle") {
      return;
    }
    if (isEnterKey(key)) {
      const answer = value || defaultValue;
      setStatus("loading");
      const isValid = await validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus("done");
        done(answer);
      } else {
        if (theme.validationFailureMode === "clear") {
          setValue("");
        } else {
          rl.write(value);
        }
        setError(isValid);
        setStatus("idle");
      }
    } else if (isBackspaceKey(key) && !value) {
      setDefaultValue(undefined);
    } else if (isTabKey(key) && !value) {
      setDefaultValue(undefined);
      rl.clearLine(0);
      rl.write(defaultValue);
      setValue(defaultValue);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });
  useEffect((rl) => {
    if (prefill === "editable" && defaultValue) {
      rl.write(defaultValue);
      setValue(defaultValue);
    }
  }, []);
  const message = theme.style.message(config.message, status);
  let formattedValue = value;
  if (typeof config.transformer === "function") {
    formattedValue = config.transformer(value, { isFinal: status === "done" });
  } else if (status === "done") {
    formattedValue = theme.style.answer(value);
  }
  let defaultStr;
  if (defaultValue && status !== "done" && !value) {
    defaultStr = theme.style.defaultAnswer(defaultValue);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [
    [prefix, message, defaultStr, formattedValue].filter((v) => v !== undefined).join(" "),
    error
  ];
});
// node_modules/@inquirer/password/dist/esm/index.js
var esm_default4 = createPrompt((config, done) => {
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
var esm_default5 = createPrompt((config, done) => {
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
// src/index.ts
import { existsSync, readFileSync as readFileSync2 } from "fs";
import { basename as basename3, dirname as dirname8, join as join19, resolve as resolve3 } from "path";

// src/alias/store.ts
import { mkdir } from "fs/promises";

// src/lib/paths.ts
import { homedir } from "os";
import { join } from "path";
var HOME = process.env.CLAUDEX_TEST_HOME ?? homedir();
var CLAUDE_DIR = join(HOME, ".claude");
var CLAUDE_JSON = join(HOME, ".claude.json");
var CREDENTIALS_FILE = join(CLAUDE_DIR, ".credentials.json");
var SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
var CLAUDE_PROFILES_DIR = join(HOME, ".claude-profiles");
var CLAUDE_STATE_FILE = join(CLAUDE_PROFILES_DIR, "state.json");
var CODEX_DIR = join(HOME, ".codex");
var CODEX_AUTH_FILE = join(CODEX_DIR, "auth.json");
var CODEX_CONFIG_FILE = join(CODEX_DIR, "config.toml");
var CODEX_ACCOUNTS_DIR = join(CODEX_DIR, "accounts");
var CODEX_REGISTRY_FILE = join(CODEX_ACCOUNTS_DIR, "registry.json");
var CLAUDEX_DIR = join(HOME, ".claudex-switch");
var ALIAS_REGISTRY_FILE = join(CLAUDEX_DIR, "aliases.json");
var RELAYS_FILE = join(CLAUDEX_DIR, "relays.json");
var MANAGED_ENV_FILE = join(CLAUDEX_DIR, "managed-env.json");
var USAGE_CACHE_FILE = join(CLAUDEX_DIR, "usage-cache.json");
var USAGE_REFRESH_LOCK = join(CLAUDEX_DIR, "usage-refresh.lock");
var ACTIVITY_CACHE_FILE = join(CLAUDEX_DIR, "activity-cache.json");
var CLI_PROXY_API_DIR = join(CLAUDEX_DIR, "cliproxyapi");
var CLI_PROXY_API_LINKS_FILE = join(CLAUDEX_DIR, "cliproxy-links.json");
var CLI_PROXY_API_LOGIN_LOCK = join(CLI_PROXY_API_DIR, "login.lock");
var OPENCODE_PROFILES_DIR = join(CLAUDEX_DIR, "opencode", "profiles");
var OPENCODE_STATE_FILE = join(CLAUDEX_DIR, "opencode", "state.json");
var OPENCODE_LOCKS_DIR = join(CLAUDEX_DIR, "opencode", "locks");
function openCodeProfileConsoleLock(profileId) {
  return join(OPENCODE_LOCKS_DIR, `${profileId}.lock`);
}
var OPENCODE_GLOBAL_DATA_DIR = join(process.env.XDG_DATA_HOME ?? join(HOME, ".local", "share"), "opencode");
var OPENCODE_GLOBAL_AUTH_FILE = join(OPENCODE_GLOBAL_DATA_DIR, "auth.json");
function claudeProfileDir(name) {
  return join(CLAUDE_PROFILES_DIR, name);
}
function claudeProfileCredentials(name) {
  return join(claudeProfileDir(name), ".credentials.json");
}
function claudeProfileConfigDir(name) {
  return join(claudeProfileDir(name), "config");
}
function claudeProfileSecureStorageDir(name) {
  return join(claudeProfileDir(name), "secure-storage");
}
function claudeProfileConfigJson(name) {
  return join(claudeProfileConfigDir(name), ".claude.json");
}
function claudeProfileDataFile(name) {
  return join(claudeProfileDir(name), "profile.json");
}
function claudeProfileAccountFile(name) {
  return join(claudeProfileDir(name), "account.json");
}
function claudeProfileClaudeSettingsFile(name) {
  return join(claudeProfileDir(name), "claude-settings.json");
}
function cliProxyAPIProfileDir(profileId) {
  return join(CLI_PROXY_API_DIR, profileId);
}
function cliProxyAPIAuthDir(profileId) {
  return join(cliProxyAPIProfileDir(profileId), "auth");
}
function cliProxyAPIEnvFile(profileId) {
  return join(cliProxyAPIProfileDir(profileId), ".env");
}
function cliProxyAPIConfigFile(profileId) {
  return join(cliProxyAPIProfileDir(profileId), "runtime.yaml");
}
function cliProxyAPIClaudeSettingsFile(profileId) {
  return join(cliProxyAPIProfileDir(profileId), "claude-settings.json");
}
function cliProxyAPISessionsDir(profileId) {
  return join(cliProxyAPIProfileDir(profileId), "sessions");
}
function cliProxyAPIStateFile(profileId) {
  return join(cliProxyAPIProfileDir(profileId), "state.json");
}
function cliProxyAPIStartupLock(profileId) {
  return join(CLI_PROXY_API_DIR, "locks", `${profileId}.lock`);
}
function openCodeProfileDir(profileId) {
  return join(OPENCODE_PROFILES_DIR, profileId);
}
function openCodeProfileDataHome(profileId) {
  return join(openCodeProfileDir(profileId), "data");
}
function openCodeProfileV2RuntimeDir(profileId) {
  return join(openCodeProfileDir(profileId), "v2-runtime");
}
function openCodeProfileV2DataHome(profileId) {
  return join(openCodeProfileV2RuntimeDir(profileId), "data");
}
function openCodeProfileV2DatabaseFile(profileId) {
  return join(openCodeProfileV2DataHome(profileId), "opencode", "opencode.db");
}
function openCodeProfileV2ModelInventoryFile(profileId) {
  return join(openCodeProfileV2RuntimeDir(profileId), "models.json");
}
function openCodeProfileV2CredentialStateFile(profileId) {
  return join(openCodeProfileV2RuntimeDir(profileId), "credentials.json");
}
function openCodeProfileAuthFile(profileId) {
  return join(openCodeProfileDataHome(profileId), "opencode", "auth.json");
}
function openCodeProfileDataFile(profileId) {
  return join(openCodeProfileDir(profileId), "profile.json");
}
function codexAccountFileKey(accountKey) {
  const needsEncoding = !accountKey || accountKey === "." || accountKey === ".." || [...accountKey].some((ch) => !/[a-zA-Z0-9\-_.]/.test(ch));
  return needsEncoding ? Buffer.from(accountKey).toString("base64url") : accountKey;
}
function codexAccountAuthFile(accountKey) {
  return join(CODEX_ACCOUNTS_DIR, `${codexAccountFileKey(accountKey)}.auth.json`);
}
function codexRunHome(accountKey) {
  return join(CLAUDEX_DIR, "codex-run", codexAccountFileKey(accountKey));
}

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

// src/alias/store.ts
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
  "doctor",
  "model",
  "import",
  "update",
  "webconfig",
  "help",
  "-run",
  "--run",
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
  if (left.provider === "opencode" && right.provider === "opencode") {
    return left.profileId === right.profileId;
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
function checkAlias(reg, alias, options = {}) {
  if (!alias)
    return "empty";
  if (isReservedAlias(alias))
    return "reserved";
  if (!isValidAlias(alias))
    return "charset";
  if (options.ignoreAlias !== undefined && options.ignoreAlias.toLowerCase() === alias.toLowerCase()) {
    return null;
  }
  if (aliasExists(reg, alias))
    return "taken";
  return null;
}
function describeAliasRejection(rejection, alias) {
  switch (rejection) {
    case "empty":
      return "Alias cannot be empty";
    case "reserved":
      return `"${alias}" is a reserved command name`;
    case "charset":
      return "Invalid alias. Use letters, numbers, hyphens, or underscores.";
    case "taken":
      return `Alias "${alias}" already exists`;
  }
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
async function updateAlias(alias, target) {
  const reg = await loadAliases();
  const entry = findAlias(reg, alias);
  if (!entry) {
    throw new Error(`Alias "${alias}" not found`);
  }
  entry.target = target;
  await saveAliases(reg);
}
async function renameAlias(currentAlias, nextAlias) {
  const reg = await loadAliases();
  const entry = findAlias(reg, currentAlias);
  if (!entry) {
    throw new Error(`Alias "${currentAlias}" not found`);
  }
  const rejection = checkAlias(reg, nextAlias, { ignoreAlias: currentAlias });
  if (rejection) {
    throw new Error(describeAliasRejection(rejection, nextAlias));
  }
  entry.alias = nextAlias;
  await saveAliases(reg);
}

// src/providers/claude/profiles.ts
import {
  chmod as chmod4,
  copyFile,
  lstat,
  mkdir as mkdir5,
  readdir as readdir3,
  readlink,
  rm as rm3,
  symlink,
  unlink as unlink2
} from "fs/promises";
import { join as join8 } from "path";

// src/providers/claude/credentials.ts
import { platform } from "os";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import { rm } from "fs/promises";
import { join as join2 } from "path";
var KEYCHAIN_SERVICE = "Claude Code-credentials";
var HEX_PATTERN = /^[0-9a-f]+$/i;
function keychainEnabled() {
  return platform() === "darwin" && process.env.CLAUDEX_FORCE_FILE_CREDENTIALS !== "1";
}
function useKeychain(path) {
  return keychainEnabled() && path === CREDENTIALS_FILE;
}
function isolatedKeychainService(dir) {
  const hash = createHash("sha256").update(dir.normalize("NFC")).digest("hex").slice(0, 8);
  return `${KEYCHAIN_SERVICE}-${hash}`;
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
async function readKeychain(service = KEYCHAIN_SERVICE) {
  const result = spawnSync("security", [
    "find-generic-password",
    "-s",
    service,
    "-a",
    getKeychainAccount(),
    "-w"
  ]);
  if (result.status !== 0)
    return null;
  return parseKeychainCredentials(result.stdout.toString("utf-8"));
}
async function writeKeychain(creds, service = KEYCHAIN_SERVICE) {
  const payload = JSON.stringify(creds);
  const account = getKeychainAccount();
  const result = spawnSync("security", [
    "add-generic-password",
    "-U",
    "-s",
    service,
    "-a",
    account,
    "-w",
    payload
  ]);
  if (result.status !== 0) {
    throw new Error("Failed to write to macOS Keychain");
  }
}
async function deleteKeychain(service = KEYCHAIN_SERVICE) {
  const result = spawnSync("security", [
    "delete-generic-password",
    "-s",
    service,
    "-a",
    getKeychainAccount()
  ]);
  if (result.status !== 0 && await readKeychain(service)) {
    throw new Error("Failed to delete macOS Keychain credentials");
  }
}
async function readJsonFile(path) {
  return readJson(path, null);
}
async function writeJsonFile(creds, path) {
  await writeJsonSecure(path, creds);
}
async function deleteJsonFile(path) {
  await rm(path, { force: true });
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
async function deleteCredentials(path = CREDENTIALS_FILE) {
  if (useKeychain(path)) {
    return deleteKeychain();
  }
  await deleteJsonFile(path);
}
async function copyCredentials(from, to) {
  const creds = await readCredentials(from);
  if (!creds)
    throw new Error(`No credentials found at ${from}`);
  await writeCredentials(creds, to);
}
async function readIsolatedCredentials(dir) {
  if (keychainEnabled()) {
    return readKeychain(isolatedKeychainService(dir));
  }
  return readJson(join2(dir, ".credentials.json"), null);
}
async function writeIsolatedCredentials(creds, dir) {
  if (keychainEnabled()) {
    return writeKeychain(creds, isolatedKeychainService(dir));
  }
  await writeJsonSecure(join2(dir, ".credentials.json"), creds);
}
async function deleteIsolatedCredentials(dir) {
  if (keychainEnabled()) {
    return deleteKeychain(isolatedKeychainService(dir));
  }
  await rm(join2(dir, ".credentials.json"), { force: true });
}

// src/providers/claude/account.ts
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

// src/providers/claude/settings.ts
import { chmod, mkdir as mkdir2 } from "fs/promises";
import { dirname } from "path";
function localCLIProxyAPIAuthEnv(apiKey) {
  return { ANTHROPIC_API_KEY: "", ANTHROPIC_AUTH_TOKEN: apiKey };
}
function localCLIProxyAPIExtraEnv(extraEnv) {
  return {
    CLAUDE_CODE_AUTO_MODE_SERVER: "0",
    ...normalizeCustomEnv(extraEnv)
  };
}
var CLAUDE_ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_FABLE_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL_FORCE"
];
var CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS = [
  "CLAUDE_CODE_OAUTH_TOKEN",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY"
];
async function read() {
  return readJson(SETTINGS_FILE, {});
}
async function write(settings) {
  await mkdir2(dirname(SETTINGS_FILE), { recursive: true });
  await writeJsonSecure(SETTINGS_FILE, settings);
  try {
    await chmod(SETTINGS_FILE, 384);
  } catch {}
}
function normalizeEnv(settings) {
  const env2 = settings.env;
  if (!env2 || typeof env2 !== "object" || Array.isArray(env2)) {
    return {};
  }
  const result = {};
  for (const [key, value] of Object.entries(env2)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}
function setEnvValue(env2, key, value) {
  if (value) {
    env2[key] = value;
    return;
  }
  delete env2[key];
}
function normalizeModelValue(value) {
  if (typeof value !== "string")
    return;
  const normalized = value.trim();
  return normalized || undefined;
}
function setTopLevelModel(settings, model) {
  if (model) {
    settings.model = model;
    return;
  }
  delete settings.model;
}
var CUSTOM_ENV_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
async function readManagedExtraEnvKeys() {
  const record = await readJson(MANAGED_ENV_FILE, {
    keys: []
  });
  if (!Array.isArray(record.keys))
    return [];
  return record.keys.filter((key) => typeof key === "string");
}
async function writeManagedExtraEnvKeys(keys) {
  await mkdir2(dirname(MANAGED_ENV_FILE), { recursive: true });
  await writeJson(MANAGED_ENV_FILE, { keys });
}
function isReservedClaudeEnvKey(key) {
  return CLAUDE_ENV_KEYS.includes(key) || CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS.includes(key);
}
function isValidCustomEnvKey(key) {
  return CUSTOM_ENV_KEY_PATTERN.test(key) && !isReservedClaudeEnvKey(key);
}
function normalizeCustomEnv(env2) {
  const result = {};
  for (const [rawKey, rawValue] of Object.entries(env2 ?? {})) {
    const key = rawKey.trim();
    if (!isValidCustomEnvKey(key))
      continue;
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!value)
      continue;
    result[key] = value;
  }
  return result;
}
async function beginManagedEnv(settings) {
  const env2 = normalizeEnv(settings);
  for (const key of CLAUDE_ENV_KEYS) {
    delete env2[key];
  }
  for (const key of await readManagedExtraEnvKeys()) {
    delete env2[key];
  }
  return env2;
}
async function commitManagedEnv(settings, env2, extraEnv) {
  const extra = normalizeCustomEnv(extraEnv);
  for (const [key, value] of Object.entries(extra)) {
    env2[key] = value;
  }
  if (Object.keys(env2).length === 0) {
    delete settings.env;
  } else {
    settings.env = env2;
  }
  await writeManagedExtraEnvKeys(Object.keys(extra));
  await write(settings);
}
async function applyApiConfig(config) {
  const settings = await read();
  const env2 = await beginManagedEnv(settings);
  setEnvValue(env2, "ANTHROPIC_API_KEY", config.apiKey);
  setEnvValue(env2, "ANTHROPIC_BASE_URL", config.baseUrl);
  setEnvValue(env2, "ANTHROPIC_AUTH_TOKEN", config.authToken);
  setEnvValue(env2, "ANTHROPIC_MODEL", config.model);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_FABLE_MODEL", config.defaultFableModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_SONNET_MODEL", config.defaultSonnetModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_OPUS_MODEL", config.defaultOpusModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_HAIKU_MODEL", config.defaultHaikuModel);
  setEnvValue(env2, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);
  setTopLevelModel(settings, config.model);
  await commitManagedEnv(settings, env2, config.env);
}
async function applyOAuthConfig(model, extraEnv) {
  const settings = await read();
  const env2 = await beginManagedEnv(settings);
  setTopLevelModel(settings, model);
  await commitManagedEnv(settings, env2, extraEnv);
}
async function applyLocalCLIProxyAPIConfig(config, extraEnv) {
  const settings = await read();
  const env2 = await beginManagedEnv(settings);
  Object.assign(env2, localCLIProxyAPIAuthEnv(config.apiKey));
  setEnvValue(env2, "ANTHROPIC_BASE_URL", config.baseUrl);
  setEnvValue(env2, "ANTHROPIC_MODEL", config.model);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_FABLE_MODEL", config.fableModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_SONNET_MODEL", config.sonnetModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_OPUS_MODEL", config.opusModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_HAIKU_MODEL", config.haikuModel);
  setEnvValue(env2, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel ?? undefined);
  setEnvValue(env2, "CLAUDE_CODE_SUBAGENT_MODEL_FORCE", config.subagentModel ? "1" : undefined);
  setTopLevelModel(settings, config.model);
  await commitManagedEnv(settings, env2, localCLIProxyAPIExtraEnv(extraEnv));
}
async function prepareApiProfileClaudeSettings(name, config) {
  const env2 = {};
  for (const key of CLAUDE_ENV_KEYS) {
    env2[key] = "";
  }
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    env2[key] = "";
  }
  for (const key of await readManagedExtraEnvKeys()) {
    env2[key] = "";
  }
  env2.ANTHROPIC_API_KEY = config.apiKey;
  env2.ANTHROPIC_BASE_URL = config.baseUrl ?? "";
  env2.ANTHROPIC_AUTH_TOKEN = config.authToken ?? "";
  env2.ANTHROPIC_MODEL = config.model ?? "";
  env2.ANTHROPIC_DEFAULT_FABLE_MODEL = config.defaultFableModel ?? "";
  env2.ANTHROPIC_DEFAULT_SONNET_MODEL = config.defaultSonnetModel ?? "";
  env2.ANTHROPIC_DEFAULT_OPUS_MODEL = config.defaultOpusModel ?? "";
  env2.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.defaultHaikuModel ?? "";
  env2.CLAUDE_CODE_SUBAGENT_MODEL = config.subagentModel ?? "";
  for (const [key, value] of Object.entries(normalizeCustomEnv(config.env))) {
    env2[key] = value;
  }
  const settings = { env: env2 };
  if (config.model) {
    settings.model = config.model;
  }
  return writePrivateRunSettings(name, settings);
}
async function prepareOAuthProfileClaudeSettings(name, profile) {
  const env2 = {};
  for (const key of CLAUDE_ENV_KEYS) {
    env2[key] = "";
  }
  for (const key of await readManagedExtraEnvKeys()) {
    env2[key] = "";
  }
  for (const [key, value] of Object.entries(normalizeCustomEnv(profile.env))) {
    env2[key] = value;
  }
  const settings = { env: env2 };
  if (profile.defaultModel) {
    settings.model = profile.defaultModel;
  }
  return writePrivateRunSettings(name, settings);
}
async function writePrivateRunSettings(name, settings) {
  const file = claudeProfileClaudeSettingsFile(name);
  await mkdir2(claudeProfileDir(name), { recursive: true });
  await writeJsonSecure(file, settings);
  try {
    await chmod(file, 384);
  } catch {}
  return file;
}
async function clearApiConfig() {
  await applyOAuthConfig();
}
async function getConfiguredModel() {
  const settings = await read();
  return normalizeModelValue(settings.model);
}
async function getClaudeEnvNeutralizer() {
  const settings = await read();
  const env2 = normalizeEnv(settings);
  const present = CLAUDE_ENV_KEYS.filter((key) => env2[key]);
  for (const key of await readManagedExtraEnvKeys()) {
    if (env2[key] && !present.includes(key))
      present.push(key);
  }
  if (present.length === 0)
    return null;
  const override = {};
  for (const key of present) {
    override[key] = "";
  }
  return JSON.stringify({ env: override });
}
async function getApiConfig() {
  const settings = await read();
  const env2 = normalizeEnv(settings);
  const apiKey = env2.ANTHROPIC_API_KEY;
  if (!apiKey)
    return null;
  const topLevelModel = normalizeModelValue(settings.model);
  const envModel = env2.ANTHROPIC_MODEL;
  const model = topLevelModel ?? envModel;
  const extraEnv = {};
  for (const key of await readManagedExtraEnvKeys()) {
    if (env2[key])
      extraEnv[key] = env2[key];
  }
  return {
    apiKey,
    baseUrl: env2.ANTHROPIC_BASE_URL,
    authToken: env2.ANTHROPIC_AUTH_TOKEN,
    model,
    defaultFableModel: env2.ANTHROPIC_DEFAULT_FABLE_MODEL,
    defaultSonnetModel: env2.ANTHROPIC_DEFAULT_SONNET_MODEL,
    defaultOpusModel: env2.ANTHROPIC_DEFAULT_OPUS_MODEL,
    defaultHaikuModel: env2.ANTHROPIC_DEFAULT_HAIKU_MODEL,
    subagentModel: env2.CLAUDE_CODE_SUBAGENT_MODEL,
    ...Object.keys(extraEnv).length > 0 ? { env: extraEnv } : {}
  };
}

// src/providers/cliproxyapi/managed.ts
import { spawn, spawnSync as spawnSync4 } from "child_process";
import { realpathSync } from "fs";
import {
  chmod as chmod3,
  mkdir as mkdir4,
  readFile as readFile4,
  readdir as readdir2,
  rename as rename2,
  rm as rm2,
  rmdir,
  stat as stat2,
  writeFile as writeFile3
} from "fs/promises";
import { createServer as createServer2 } from "net";
import { platform as platform4 } from "os";
import { basename as basename2, dirname as dirname3, join as join7, resolve as resolve2 } from "path";
import { createHash as createHash6, randomBytes as randomBytes4, randomUUID as randomUUID3 } from "crypto";

// src/lib/browser.ts
import { spawnSync as spawnSync2 } from "child_process";
import { platform as platform2 } from "os";
import { join as join3 } from "path";
import { tmpdir } from "os";
import { mkdirSync, writeFileSync, unlinkSync, rmdirSync } from "fs";
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
var MACOS_OPEN_SHIM = `#!/bin/bash
# Intercept \`open\` calls: auth URLs go to incognito, everything else to real open.
AUTH_URL=""
PASSTHROUGH_ARGS=()
for arg in "$@"; do
  case "$arg" in
    https://auth.openai.com/*|https://auth0.openai.com/*|https://opencode.ai/console/*|https://opencode.ai/auth*)
      AUTH_URL="$arg" ;;
    *)
      PASSTHROUGH_ARGS+=("$arg") ;;
  esac
done
if [ -n "$AUTH_URL" ]; then
  if [ -d "/Applications/Google Chrome.app" ]; then
    /usr/bin/open -na "Google Chrome" --args --incognito "$AUTH_URL"
  elif [ -d "/Applications/Firefox.app" ]; then
    /usr/bin/open -na "Firefox" --args --private-window "$AUTH_URL"
  elif [ -d "/Applications/Microsoft Edge.app" ]; then
    /usr/bin/open -na "Microsoft Edge" --args --inprivate "$AUTH_URL"
  else
    /usr/bin/open "$AUTH_URL"
  fi
else
  /usr/bin/open "\${PASSTHROUGH_ARGS[@]}"
fi
`;
function createPrivateBrowserScript() {
  if (platform2() !== "darwin")
    return null;
  const path = join3(tmpdir(), `claudex-private-browser-${process.pid}.sh`);
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
function createOpenShimDir() {
  if (platform2() !== "darwin")
    return null;
  const dir = join3(tmpdir(), `claudex-open-shim-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join3(dir, "open"), MACOS_OPEN_SHIM, { mode: 493 });
  return dir;
}
function cleanupOpenShimDir(dir) {
  if (!dir)
    return;
  try {
    unlinkSync(join3(dir, "open"));
    rmdirSync(dir);
  } catch {}
}
function getBrowserOpenCommand(url) {
  switch (platform2()) {
    case "darwin":
      return { command: "open", args: [url] };
    case "linux":
      return { command: "xdg-open", args: [url] };
    case "win32":
      return { command: "cmd", args: ["/c", "start", "", url] };
    default:
      return null;
  }
}
function openExternalUrl(url, privateWindow = false) {
  const browserScript = privateWindow ? createPrivateBrowserScript() : null;
  const openCommand = browserScript ? { command: browserScript, args: [url] } : getBrowserOpenCommand(url);
  if (!openCommand)
    return false;
  try {
    const result = spawnSync2(openCommand.command, openCommand.args, {
      stdio: "ignore"
    });
    return result.status === 0 && !result.error;
  } catch {
    return false;
  } finally {
    cleanupBrowserScript(browserScript);
  }
}

// src/providers/cliproxyapi/version.ts
import { spawnSync as spawnSync3 } from "child_process";
var CLI_PROXY_API_ANTIGRAVITY_MIN_VERSION = "7.3.19";
var CLI_PROXY_API_RECOMMENDED_VERSION = "7.3.20";
function parseCLIProxyAPIVersion(output) {
  return output.match(/CLIProxyAPI\s+Version[:\s]+v?(\d+\.\d+\.\d+(?:-[\w.-]+)?)/i)?.[1] ?? null;
}
function readCLIProxyAPIVersion(binaryPath) {
  try {
    const result = spawnSync3(binaryPath, ["--help"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000
    });
    if (result.error || result.status !== 0)
      return null;
    return parseCLIProxyAPIVersion(`${result.stdout}
${result.stderr}`);
  } catch {
    return null;
  }
}
function supportsAntigravityToolHistory(version) {
  if (!version || !/^\d+\.\d+\.\d+$/.test(version))
    return false;
  const actual = version.split(".").map(Number);
  const required = CLI_PROXY_API_ANTIGRAVITY_MIN_VERSION.split(".").map(Number);
  for (let i = 0;i < required.length; i += 1) {
    if (actual[i] > required[i])
      return true;
    if (actual[i] < required[i])
      return false;
  }
  return true;
}
function assertCLIProxyAPICompatibility(binaryPath, upstream) {
  if (upstream !== "antigravity")
    return;
  const version = readCLIProxyAPIVersion(binaryPath);
  if (!supportsAntigravityToolHistory(version)) {
    throw new Error(`CLIProxyAPI ${version ?? "(unknown version)"} lacks the verified Antigravity tool-history fixes. ` + `Use v${CLI_PROXY_API_ANTIGRAVITY_MIN_VERSION} or newer (validated: v${CLI_PROXY_API_RECOMMENDED_VERSION}). ` + "Install a compatible binary; for an existing account, end its sessions, then run `claudex-switch doctor <alias> --binary /path/to/cli-proxy-api`. " + "A reachable proxy or text-only response does not verify tool compatibility.");
  }
}

// src/providers/cliproxyapi/upstreams.ts
var SUBSCRIPTION_SPEC = {
  loginFlag: null,
  callbackPort: null,
  authType: null,
  defaults: { fableModel: "fable", opusModel: "opus", sonnetModel: "sonnet", haikuModel: "haiku" }
};
var CLI_PROXY_API_UPSTREAMS = {
  cursor: { ...SUBSCRIPTION_SPEC, label: "Cursor" },
  workbuddy: { ...SUBSCRIPTION_SPEC, label: "WorkBuddy (China)" },
  "workbuddy-ai": { ...SUBSCRIPTION_SPEC, label: "WorkBuddy AI (international)" },
  codex: {
    label: "ChatGPT",
    loginFlag: "-codex-login",
    callbackPort: 1455,
    authType: "codex",
    defaults: {
      fableModel: "gpt-6-astra",
      sonnetModel: "gpt-5.6-terra",
      opusModel: "gpt-5.6-terra",
      haikuModel: "gpt-6-luna"
    }
  },
  antigravity: {
    label: "Antigravity",
    loginFlag: "-antigravity-login",
    callbackPort: 51121,
    authType: "antigravity",
    defaults: {
      fableModel: "fable",
      sonnetModel: "sonnet",
      opusModel: "opus",
      haikuModel: "haiku"
    }
  },
  "opencode-go": {
    label: "OpenCode Go",
    loginFlag: null,
    callbackPort: null,
    authType: null,
    defaults: {
      fableModel: "kimi-k3",
      sonnetModel: "glm-5.3",
      opusModel: "kimi-k3",
      haikuModel: "deepseek-v4-flash"
    }
  }
};
function parseUpstream(value) {
  if (!value || value === "codex")
    return "codex";
  if (Object.hasOwn(CLI_PROXY_API_UPSTREAMS, value))
    return value;
  throw new Error(`Unknown managed proxy upstream: ${value}`);
}
function pickSubscriptionModels(ids, current) {
  if (!ids.length || ids.some((id) => !id.trim() || /[\r\n,=]/.test(id))) {
    throw new Error("The subscription returned an empty or invalid model catalog. Sign in again; no guessed models will be used.");
  }
  const strongest = ids.includes("auto") ? "auto" : newest(ids.filter((id) => /claude.*opus/i.test(id))) ?? newest(ids.filter((id) => /claude.*sonnet/i.test(id))) ?? ids[0];
  const sonnet = newest(ids.filter((id) => /claude.*sonnet/i.test(id))) ?? strongest;
  const fast = newest(ids.filter((id) => /haiku|flash|mini/i.test(id))) ?? sonnet;
  const keep = (tier, fallback) => current && ids.includes(current[tier]) ? current[tier] : fallback;
  return {
    fableModel: keep("fableModel", strongest),
    opusModel: keep("opusModel", strongest),
    sonnetModel: keep("sonnetModel", sonnet),
    haikuModel: keep("haikuModel", fast)
  };
}
var OPENCODE_GO_OPENAI_BASE_URL = "https://opencode.ai/zen/go/v1";
var OPENCODE_GO_ANTHROPIC_BASE_URL = "https://opencode.ai/zen/go";
function isOpenCodeGoMessagesModel(model) {
  return /^(minimax-|qwen|claude-)/i.test(model);
}
function versionKey(id) {
  return (id.match(/\d+/g) ?? []).map(Number);
}
var MODEL_VARIANT_ORDER = ["high", "max", "thinking", "medium", "low"];
function antigravityModelBase(id) {
  return id.replace(/-(thinking|max|high|medium|low)$/i, "");
}
function variantRank(id) {
  const suffix = id.match(/-(thinking|max|high|medium|low)$/i)?.[1]?.toLowerCase();
  return suffix ? MODEL_VARIANT_ORDER.indexOf(suffix) + 1 : 0;
}
function newest(ids) {
  return [...ids].sort((a, b) => {
    const va = versionKey(a);
    const vb = versionKey(b);
    for (let i = 0;i < Math.max(va.length, vb.length); i++) {
      const diff = (vb[i] ?? -1) - (va[i] ?? -1);
      if (diff !== 0)
        return diff;
    }
    return variantRank(a) - variantRank(b) || a.localeCompare(b);
  })[0];
}
function pickAntigravityModels(ids) {
  const opus = newest(ids.filter((id) => /^claude-opus-/i.test(id)));
  const sonnet = newest(ids.filter((id) => /^claude-sonnet-/i.test(id)));
  const flash = newest(ids.filter((id) => /^gemini-.*flash/i.test(id) && !/(image|lite)/i.test(id)));
  const strongest = opus ?? sonnet;
  if (!strongest)
    return null;
  return {
    fableModel: strongest,
    opusModel: strongest,
    sonnetModel: sonnet ?? strongest,
    haikuModel: flash ?? sonnet ?? strongest
  };
}
function matchAntigravityModel(input, ids) {
  if (ids.includes(input))
    return input;
  const stem = antigravityModelBase(input);
  return newest(ids.filter((id) => antigravityModelBase(id) === stem));
}
function modelFamily(id) {
  return antigravityModelBase(id).replace(/\d+(?:[.-]\d+)*/g, "#");
}
function isSupersededAntigravityClaude(id, ids) {
  if (!/^claude-/i.test(id))
    return false;
  const base = antigravityModelBase(id);
  return ids.some((other) => modelFamily(other) === modelFamily(id) && antigravityModelBase(other) !== base && newest([id, other]) === other);
}
function reconcileAntigravityModels(ids, current) {
  const defaults = pickAntigravityModels(ids);
  if (!defaults) {
    throw new Error("Antigravity's model catalog has no supported Claude models. Check its login and CLIProxyAPI version; no guessed model will be used.");
  }
  const pick = (tier) => {
    const kept = matchAntigravityModel(current[tier], ids);
    if (!kept)
      return defaults[tier];
    if (!isSupersededAntigravityClaude(kept, ids))
      return kept;
    return newest(ids.filter((id) => modelFamily(id) === modelFamily(kept))) ?? defaults[tier];
  };
  return {
    fableModel: pick("fableModel"),
    opusModel: pick("opusModel"),
    sonnetModel: pick("sonnetModel"),
    haikuModel: pick("haikuModel")
  };
}
function pickOpenCodeGoModels(catalog) {
  const defaults = CLI_PROXY_API_UPSTREAMS["opencode-go"].defaults;
  if (!catalog || catalog.size === 0)
    return defaults;
  const ids = [...catalog];
  const pick = (preferred, family) => catalog.has(preferred) ? preferred : newest(ids.filter((id) => family.test(id))) ?? preferred;
  return {
    fableModel: pick(defaults.fableModel, /^kimi-/),
    opusModel: pick(defaults.opusModel, /^kimi-/),
    sonnetModel: pick(defaults.sonnetModel, /^glm-(?!.*flash)/),
    haikuModel: pick(defaults.haikuModel, /^deepseek-.*flash$/)
  };
}

// node_modules/@magpie-community/opencode-cursor-auth/native-session.mjs
import { createHash as createHash2, randomBytes } from "node:crypto";
var NATIVE_LIMITS = {
  resultWait: 120000,
  lifetime: 15 * 60000,
  batchWait: 30000,
  drain: 6000,
  replayWait: 120000,
  blobBytes: 64 << 20,
  outputBytes: 16 << 20,
  argumentBytes: 1 << 20,
  argumentFields: 1e5,
  argumentDepth: 64,
  outboundBytes: 16 << 20,
  outboundMessages: 256,
  writeWait: 30000,
  perAccount: 8,
  perProcess: 32
};
var HANDLE = /^call_cursor_[a-f0-9]+_\d+_\d+$/;
var hash = (s) => createHash2("sha256").update(s).digest("hex");
var canonical = (v) => JSON.stringify(v, (_k, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x);
var bytes = (v) => Buffer.byteLength(canonical(v));
var later = (fn, ms) => {
  const timer = setTimeout(fn, ms);
  timer.unref?.();
  return timer;
};

class NativeSessionError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
var invalid = (message, status = 409) => {
  throw new NativeSessionError(status, message);
};
var failureOf = (e) => ({ status: e?.status ?? 502, message: e?.message ?? String(e) });
function nativeFields(input, maxFields = Infinity) {
  const b = Buffer.from(input);
  const out = [];
  let at = 0;
  const uv = () => {
    let n = 0;
    let scale = 1;
    for (let i = 0;i < 10 && at < b.length; i++) {
      const c = b[at++];
      n += (c & 127) * scale;
      if (c < 128 && Number.isSafeInteger(n))
        return n;
      scale *= 128;
    }
    invalid("malformed native protobuf", 502);
  };
  while (at < b.length) {
    const key = uv();
    const num = Math.floor(key / 8);
    const wire = key % 8;
    if (!num || num > 536870911)
      invalid("malformed native protobuf field", 502);
    let n = 0;
    let data = Buffer.alloc(0);
    if (wire === 0)
      n = uv();
    else if (wire === 2 || wire === 1 || wire === 5) {
      const size = wire === 2 ? uv() : wire === 1 ? 8 : 4;
      if (at + size > b.length)
        invalid("truncated native protobuf", 502);
      data = b.subarray(at, at + size);
      at += size;
    } else
      invalid("unsupported native protobuf wire type", 502);
    if (out.length >= maxFields)
      invalid("native protobuf field limit reached", 502);
    out.push({ num, wire, n, data });
  }
  return out;
}
function nativeMcpArgs(input, limits = NATIVE_LIMITS) {
  if (input.length > limits.argumentBytes)
    invalid("native MCP argument byte limit reached", 502);
  let remaining = limits.argumentFields;
  const read2 = (b) => {
    const fs2 = nativeFields(b, remaining);
    remaining -= fs2.length;
    return fs2;
  };
  const typed = (f, wire) => {
    if (f.wire !== wire)
      invalid("invalid native MCP argument field type", 502);
  };
  const utf8 = (b) => {
    try {
      return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(b);
    } catch {
      invalid("invalid UTF-8 in native MCP arguments", 502);
    }
  };
  function mapEntry(b, depth) {
    let key = "", value = null;
    for (const f of read2(b)) {
      if (f.num === 1) {
        typed(f, 2);
        key = utf8(f.data);
      } else if (f.num === 2) {
        typed(f, 2);
        value = decodeValue(f.data, depth);
      }
    }
    return [key, value];
  }
  function decodeStruct(b, depth) {
    const entries2 = [];
    for (const f of read2(b))
      if (f.num === 1) {
        typed(f, 2);
        entries2.push(mapEntry(f.data, depth));
      }
    return Object.fromEntries(entries2);
  }
  function decodeValue(b, depth = 0) {
    if (depth > limits.argumentDepth)
      invalid("native MCP argument nesting limit reached", 502);
    let value = null;
    for (const f of read2(b)) {
      if (f.num < 1 || f.num > 6)
        continue;
      typed(f, [0, 1, 2, 0, 2, 2][f.num - 1]);
      switch (f.num) {
        case 1:
          if (f.n !== 0)
            invalid("invalid native protobuf NullValue", 502);
          value = null;
          break;
        case 2:
          value = f.data.readDoubleLE(0);
          if (!Number.isFinite(value))
            invalid("nonfinite native MCP argument number", 502);
          break;
        case 3:
          value = utf8(f.data);
          break;
        case 4:
          value = f.n !== 0;
          break;
        case 5:
          value = decodeStruct(f.data, depth + 1);
          break;
        case 6:
          value = [];
          for (const item of read2(f.data))
            if (item.num === 1) {
              typed(item, 2);
              value.push(decodeValue(item.data, depth + 1));
            }
          break;
      }
    }
    return value;
  }
  const fs = read2(input), entries = [];
  for (const f of fs) {
    if ([1, 3, 4, 5, 9].includes(f.num)) {
      typed(f, 2);
      utf8(f.data);
    } else if (f.num === 2) {
      typed(f, 2);
      entries.push(mapEntry(f.data, 0));
    } else if (f.num === 6)
      typed(f, 2);
    else if (f.num === 7)
      typed(f, 0);
  }
  return { fields: fs, args: Object.fromEntries(entries) };
}
var field = (fs, n) => fs.find((f) => f.num === n);
var str = (fs, n) => field(fs, n)?.data.toString("utf8") ?? "";
var num = (fs, n) => field(fs, n)?.n ?? 0;
function argsOf(s) {
  try {
    const v = typeof s === "string" ? JSON.parse(s) : s;
    if (v && typeof v === "object" && !Array.isArray(v))
      return v;
  } catch {}
  invalid("invalid tool arguments in native continuation", 400);
}
function assistantDisplay(message) {
  const parts = typeof message.content === "string" ? [{ type: "text", text: message.content }] : message.content ?? [];
  if (!Array.isArray(parts) || parts.some((p) => !["text", "reasoning"].includes(p?.type) || typeof p.text !== "string"))
    invalid("unsupported native assistant display");
  const reasoning = [message.reasoning_content, message.reasoning, message.reasoning_text].find((v) => typeof v === "string" && v.trim()) ?? "";
  return {
    text: parts.filter((p) => p.type === "text").map((p) => p.text).join(""),
    reasoning: reasoning + parts.filter((p) => p.type === "reasoning").map((p) => p.text).join("")
  };
}
function resultParts(message, limits) {
  const parts = typeof message.content === "string" ? [{ type: "text", text: message.content }] : message.content;
  if (!Array.isArray(parts))
    invalid("unsupported native tool result");
  let retained = 0;
  return parts.map((part) => {
    if (part?.type === "text" && typeof part.text === "string") {
      retained += Buffer.byteLength(part.text);
      if (retained > limits.outputBytes)
        invalid("native tool result limit reached");
      return { text: part.text };
    }
    const url = part?.type === "image_url" ? typeof part.image_url === "string" ? part.image_url : part.image_url?.url : part?.type === "image" && part.source?.type === "base64" ? `data:${part.source.media_type};base64,${part.source.data}` : "";
    const image = /^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(url ?? "");
    if (!image)
      invalid("unsupported native tool result content");
    const data = Buffer.from(image[2], "base64");
    retained += data.length;
    if (retained > limits.outputBytes)
      invalid("native tool result limit reached");
    if (!data.length || data.toString("base64").replace(/=+$/, "") !== image[2].replace(/=+$/, ""))
      invalid("invalid native result image");
    return { data, mimeType: image[1] };
  });
}
function normalizeMessage(m) {
  if (m?.role !== "assistant")
    return m;
  const { text, reasoning } = assistantDisplay(m);
  const out = { ...m, content: text };
  delete out.reasoning;
  delete out.reasoning_content;
  delete out.reasoning_text;
  if (reasoning)
    out.reasoning_content = reasoning;
  if (m.tool_calls)
    out.tool_calls = m.tool_calls.map((c) => ({
      ...c,
      type: c.type ?? "function",
      function: { ...c.function, arguments: argsOf(c.function?.arguments ?? "{}") }
    }));
  return out;
}
var historyDigest = (messages) => hash(canonical(messages.map(normalizeMessage)));
function controlsOf(chat, selector, tools) {
  const controls = { ...chat };
  for (const k of ["messages", "stream", "stream_options"])
    delete controls[k];
  return hash(canonical({ selector, controls, tools }));
}
var toolAttachment = (m) => m?.role === "user" && Array.isArray(m.content) && m.content.length > 1 && m.content[0]?.type === "text" && m.content[0].text === "Attached image(s) from tool result:" && m.content.slice(1).every((p) => p?.type === "image_url");
function matchResults(batch, messages) {
  if (historyDigest(messages.slice(0, batch.prefixLength)) !== batch.prefixDigest)
    invalid("native continuation history diverged");
  const suffix = messages.slice(batch.prefixLength);
  const assistants = [];
  while (suffix[assistants.length]?.role === "assistant")
    assistants.push(suffix[assistants.length]);
  if (!assistants.length)
    invalid("native continuation is missing its assistant tool calls", 400);
  let content = "";
  let reasoning = "";
  const calls = [];
  for (const m of assistants) {
    const unknown = Object.keys(m).filter((k) => !["role", "content", "tool_calls", "reasoning", "reasoning_content", "reasoning_text"].includes(k));
    if (unknown.length)
      invalid("unsupported assistant fields in native continuation", 400);
    const display = assistantDisplay(m);
    content += display.text;
    reasoning += display.reasoning;
    for (const c of m.tool_calls ?? []) {
      if (c.type && c.type !== "function")
        invalid("unsupported native continuation tool call", 400);
      calls.push({ id: c.id, name: c.function?.name, args: argsOf(c.function?.arguments ?? "{}") });
    }
  }
  if (content !== batch.content || reasoning && reasoning !== batch.reasoning)
    invalid("native continuation assistant output changed");
  const expected = batch.calls.map((c) => ({ id: c.id, name: c.name, args: argsOf(c.args) }));
  const sorted = (v) => [...v].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (canonical(sorted(calls)) !== canonical(sorted(expected)))
    invalid("native continuation tool calls changed");
  let results = suffix.slice(assistants.length);
  if (batch.calls.length === 1 && results.length === 2 && results[0]?.role === "tool" && toolAttachment(results[1])) {
    const [result, attachment] = results;
    const content2 = typeof result.content === "string" ? [{ type: "text", text: result.content }] : result.content;
    if (!Array.isArray(content2))
      invalid("unsupported native tool result");
    results = [{ ...result, content: [...content2, ...attachment.content.slice(1)] }];
  }
  if (results.some((m) => m?.role !== "tool"))
    invalid("new input cannot be interleaved with pending native results");
  const ids = new Set;
  for (const m of results) {
    if (ids.has(m.tool_call_id))
      invalid("duplicate native tool result", 400);
    ids.add(m.tool_call_id);
    if (!expected.some((c) => c.id === m.tool_call_id))
      invalid("unknown native tool result", 400);
  }
  if (ids.size !== expected.length)
    invalid("all parallel native tool results must be submitted together", 400);
  return [...results].sort((a, b) => a.tool_call_id.localeCompare(b.tool_call_id));
}

class Segment {
  constructor(owner, chat) {
    this.owner = owner;
    this.prefixLength = chat.messages.length;
    this.prefixDigest = historyDigest(chat.messages);
    this.events = [];
    this.calls = [];
    this.answered = 0;
    this.content = "";
    this.reasoning = "";
    this.expected = null;
    this.closed = false;
    this.clean = false;
    this.waiters = new Set;
  }
  wake() {
    for (const wake of this.waiters)
      wake();
    this.waiters.clear();
  }
  emit(e) {
    this.owner.retain(bytes(e));
    if (e.text)
      this.content += e.text;
    if (e.reasoning)
      this.reasoning += e.reasoning;
    this.events.push(e);
    this.wake();
  }
  finish(stop) {
    for (const [index, c] of this.calls.entries()) {
      const e = { tool: { index, id: c.id, name: c.name, args: c.args } };
      this.owner.retain(bytes(e));
      this.events.push(e);
    }
    this.owner.retain(bytes(stop));
    this.events.push(stop);
    this.closed = true;
    this.wake();
  }
  fail(error) {
    this.events = [{ error }];
    this.closed = true;
    this.wake();
  }
  iterator({ replay = false } = {}) {
    const segment = this;
    let at = 0;
    let errorSent = false;
    return {
      async next() {
        while (!segment.closed && at >= segment.events.length)
          await new Promise((r) => segment.waiters.add(r));
        if (!replay && segment.owner.error) {
          if (errorSent)
            return { done: true };
          errorSent = true;
          return { value: { error: segment.owner.error }, done: false };
        }
        if (at < segment.events.length) {
          const event = segment.events[at++];
          if (replay && event.stop)
            return { value: { ...event, usage: {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              prompt_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
              magpie_native: { accounting: "replayed" }
            } }, done: false };
          return { value: event, done: false };
        }
        return { done: true };
      },
      async return() {
        if (!replay)
          await segment.owner.cancel("the Chat response was cancelled");
        return { done: true };
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
}

class NativeSessionPool {
  constructor(limits = NATIVE_LIMITS) {
    this.limits = limits;
    this.entries = new Set;
    this.handles = new Map;
    this.selectors = new Map;
  }
  prepare(tok, chat, selector, tools) {
    const fallback = (reason) => ({ fallback: reason });
    if (!Array.isArray(chat.messages) || bytes(chat) > this.limits.outputBytes)
      return fallback("history retention limit");
    const account = hash(tok);
    const controls = controlsOf(chat, selector, tools);
    const trailing = [];
    const end = chat.messages.length - (toolAttachment(chat.messages.at(-1)) ? 2 : 1);
    for (let i = end;i >= 0 && chat.messages[i]?.role === "tool"; i--)
      trailing.push(chat.messages[i].tool_call_id);
    const handles = trailing.filter((id) => typeof id === "string" && HANDLE.test(id));
    if (handles.length) {
      const found = handles.map((id) => this.handles.get(id));
      if (found.some((v) => !v))
        return fallback("owner unavailable");
      const { owner, batch } = found[0];
      if (found.some((v) => v.owner !== owner || v.batch !== batch))
        return fallback("different native batches");
      if (owner.account !== account || owner.controls !== controls || owner.error)
        return fallback("owner incompatible or expired");
      try {
        const results = matchResults(batch, chat.messages);
        const encoded = results.map((m) => owner.encodeResult(m));
        const digest = hash(canonical(results));
        if (batch.resultDigest) {
          if (batch.resultDigest !== digest || !batch.next?.clean)
            return fallback("result already submitted or busy");
          return { owner, batch, replay: true, segment: batch.next };
        }
        if (owner.state !== "awaiting-results" || owner.segment !== batch || !batch.clean)
          return fallback("owner busy");
        const reserve = Math.min(60000, owner.limits.lifetime / 10);
        if (owner.expiresAt - Date.now() <= reserve) {
          owner.fail({ status: 410, message: "native Run retired before lifetime deadline" }, "expired");
          return fallback("owner near lifetime deadline");
        }
        return { owner, batch, results, encoded, digest, chat };
      } catch (e) {
        if (!(e instanceof NativeSessionError))
          throw e;
        return fallback("history incompatible with retained owner");
      }
    }
    if (chat.messages.some((m) => m?.tool_calls?.some((c) => HANDLE.test(c?.id ?? ""))))
      return fallback("historical native calls");
    if (selector && this.selectors.has(account + ":" + selector))
      return fallback("owner busy");
    return { account, selector, controls, selected: !!selector, chat };
  }
  create(prepared, resolution, wire) {
    if (prepared.fallback || prepared.selected && this.selectors.has(prepared.account + ":" + prepared.selector))
      return null;
    const crowded = () => this.entries.size >= this.limits.perProcess || [...this.entries].filter((e) => e.account === prepared.account).length >= this.limits.perAccount;
    while (crowded()) {
      const accountFull = [...this.entries].filter((e) => e.account === prepared.account).length >= this.limits.perAccount;
      const finished = [...this.entries].find((e) => ["complete", "failed", "cancelled", "expired"].includes(e.state) && (!accountFull || e.account === prepared.account));
      if (!finished)
        return null;
      this.forget(finished);
    }
    let owner;
    try {
      owner = new NativeSession(this, prepared, resolution, wire);
    } catch (e) {
      if (!(e instanceof NativeSessionError))
        throw e;
      return null;
    }
    this.entries.add(owner);
    if (prepared.selected)
      this.selectors.set(owner.account + ":" + owner.selector, owner);
    return owner;
  }
  release(owner) {
    const key = owner.account + ":" + owner.selector;
    if (this.selectors.get(key) === owner)
      this.selectors.delete(key);
  }
  forget(owner) {
    owner.accounting?.abandon();
    clearTimeout(owner.replayTimer);
    this.release(owner);
    this.entries.delete(owner);
    for (const [id, h] of this.handles)
      if (h.owner === owner)
        this.handles.delete(id);
    owner.blobs.clear();
    owner.checkpoint = null;
    owner.execs.clear();
    owner.nativeCalls.clear();
  }
  async clear() {
    await Promise.all([...this.entries].map((e) => e.cancel("native owner removed")));
    for (const e of this.entries) {
      clearTimeout(e.replayTimer);
      this.forget(e);
    }
  }
}

class NativeSession {
  constructor(pool, prepared, resolution, wire) {
    Object.assign(this, prepared);
    this.pool = pool;
    this.limits = pool.limits;
    this.resolution = resolution;
    this.wire = wire;
    this.identity = randomBytes(12).toString("hex");
    this.state = "opening";
    this.ac = new AbortController;
    this.execs = new Map;
    this.nativeCalls = new Map;
    this.blobs = new Map;
    this.knownHashes = new Set;
    this.blobSize = 0;
    this.retainedBytes = 0;
    this.sequence = 0;
    this.segments = 0;
    this.steps = 1;
    this.stepSaid = 0;
    this.said = 0;
    this.wrote = 0;
    this.terminal = false;
    this.segment = new Segment(this, prepared.chat);
    this.retain(bytes(prepared.chat));
    this.expireIn(this.limits.lifetime);
  }
  expireIn(ms) {
    clearTimeout(this.lifetimeTimer);
    this.expiresAt = Date.now() + ms;
    this.lifetimeTimer = later(() => this.fail({ status: 410, message: "native Run lifetime expired" }, "expired"), ms);
  }
  retain(n) {
    if (this.retainedBytes + n > this.limits.outputBytes)
      invalid("native output/history retention limit reached", 503);
    this.retainedBytes += n;
  }
  attach(signal, segment = this.segment) {
    if (signal?.aborted) {
      this.fail({ status: 410, message: "the Chat request was already cancelled" }, "cancelled");
      return;
    }
    const abort = () => this.fail({ status: 410, message: "the Chat request was cancelled" }, "cancelled");
    signal?.addEventListener("abort", abort, { once: true });
    segment.detach = () => signal?.removeEventListener("abort", abort);
  }
  delivered(segment = this.segment) {
    if (this.error)
      return;
    segment.clean = true;
    segment.detach?.();
    if (this.state === "complete" && segment === this.segment)
      this.accounting?.delivered();
  }
  closeTransport() {
    if (this.transportClosed)
      return;
    this.transportClosed = true;
    clearInterval(this.runHeartbeat);
    clearInterval(this.execHeartbeat);
    clearTimeout(this.batchTimer);
    clearTimeout(this.resultTimer);
    clearTimeout(this.drainTimer);
    clearTimeout(this.lifetimeTimer);
    this.ac.abort();
    this.transport?.close();
  }
  fail(error, state = "failed") {
    if (this.error || this.state === "complete")
      return;
    this.error = error;
    this.state = state;
    this.segment.fail(error);
    for (const segment of this.batches ?? [])
      segment.detach?.();
    this.segment.detach?.();
    this.closeTransport();
    this.pool.forget(this);
  }
  async cancel(message) {
    this.fail({ status: 410, message }, "cancelled");
    await this.pumpTask;
  }
  bind(transport, blobs, estimate) {
    if (this.transportClosed || this.error) {
      transport.close();
      return;
    }
    this.transport = transport;
    this.estimate = estimate;
    this.stepEstimate = estimate;
    this.blobs = blobs;
    this.knownHashes = new Set(blobs.keys());
    this.blobSize = [...blobs.values()].reduce((n, b) => n + b.length, 0);
    if (this.blobSize > this.limits.blobBytes)
      invalid("native bootstrap blob limit reached", 503);
    if (this.error)
      return this.closeTransport();
    this.state = "running";
    const { pb } = this.wire;
    const heartbeat = (message) => {
      try {
        this.send(message);
      } catch (e) {
        this.fail(failureOf(e));
      }
    };
    this.runHeartbeat = setInterval(() => heartbeat(pb().bytes(7, Buffer.alloc(0)).done()), 5000);
    this.execHeartbeat = setInterval(() => {
      for (const c of this.execs.values())
        if (!c.submitted)
          heartbeat(pb().bytes(5, pb().bytes(3, pb().varint(1, c.requestID))).done());
    }, 3000);
    this.runHeartbeat.unref?.();
    this.execHeartbeat.unref?.();
  }
  send(message) {
    if (this.error || this.transportClosed)
      invalid("native transport is no longer writable", 410);
    this.transport.send(message);
  }
  async reply(message) {
    await this.transport.room?.(message.length + 5);
    this.send(message);
  }
  execClose(id) {
    this.send(this.wire.pb().bytes(5, this.wire.pb().bytes(1, this.wire.pb().varint(1, id))).done());
  }
  encodeResult(message) {
    const { pb } = this.wire;
    const success = pb();
    for (const item of resultParts(message, this.limits)) {
      if (item.text !== undefined)
        success.bytes(1, pb().bytes(1, pb().str(1, item.text)));
      else
        success.bytes(1, pb().bytes(2, pb().bytes(1, item.data).str(2, item.mimeType)));
    }
    if (message.is_error === true || message.isError === true)
      success.varint(2, 1);
    return pb().bytes(1, success).done();
  }
  resume(prepared, signal) {
    if (prepared.replay)
      return this.response(prepared.segment, true);
    const batch = prepared.batch;
    if (this.error || this.state !== "awaiting-results" || this.segment !== batch || batch.resultDigest)
      invalid("native continuation is already reserved");
    const next = new Segment(this, prepared.chat);
    this.attach(signal, next);
    if (this.error)
      invalid(this.error.message, this.error.status);
    batch.resultDigest = prepared.digest;
    batch.next = next;
    this.segment = next;
    this.state = "submitting";
    clearTimeout(this.resultTimer);
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
    this.nextStep(prepared.estimate);
    try {
      for (let i = 0;i < prepared.results.length; i++) {
        const call = batch.calls.find((c) => c.id === prepared.results[i].tool_call_id);
        const msg = this.wire.pb().varint(1, call.requestID);
        if (call.execID)
          msg.str(15, call.execID);
        msg.bytes(11, prepared.encoded[i]);
        this.resultSubmitted = true;
        this.send(this.wire.pb().bytes(2, msg).done());
        call.submitted = true;
        this.execClose(call.requestID);
      }
      this.state = "running";
    } catch (e) {
      const error = failureOf(e);
      this.fail({ status: error.status, message: `${error.message}; native result submission failed; its outcome is uncertain and cannot be replayed` });
    }
    return this.response(next);
  }
  response(segment = this.segment, replay = false) {
    return {
      events: segment.iterator({ replay }),
      cancel: () => replay ? Promise.resolve() : this.cancel("the Chat response was cancelled"),
      resolution: this.resolution,
      delivered: () => replay || this.delivered(segment),
      diagnostic: `same-run; bootstrap=imported-history; new-turn=stateless; missing-owner=stateless${replay ? "; replay=true" : ""}`
    };
  }
  acceptCall(call) {
    if (!Number.isInteger(call.requestID))
      invalid("native tool call is missing its exec request ID", 502);
    const prior = this.execs.get(call.requestID);
    const digest = hash(canonical({ requestID: call.requestID, execID: call.execID, nativeID: call.nativeID, name: call.name, args: argsOf(call.args) }));
    if (prior) {
      if (prior.digest !== digest)
        invalid("native exec identity changed during retransmission", 502);
      return;
    }
    if (this.terminal || this.state === "awaiting-results")
      invalid("native call arrived after its batch was sealed", 502);
    if (call.nativeID && this.nativeCalls.has(call.nativeID))
      invalid("native tool-call ID was reused for another exec", 502);
    call.id = `call_cursor_${this.identity}_${this.segments}_${this.segment.calls.length}`;
    call.digest = digest;
    this.execs.set(call.requestID, call);
    if (call.nativeID)
      this.nativeCalls.set(call.nativeID, call);
    this.segment.calls.push(call);
    this.retain(bytes(call));
    this.said += call.args.length;
    this.waitForBatch();
    this.sealBatch();
  }
  nextStep(estimate) {
    this.steps++;
    this.stepSaid = this.said;
    if (estimate != null)
      this.stepEstimate = estimate;
  }
  waitForBatch() {
    clearTimeout(this.batchTimer);
    this.batchTimer = later(() => {
      if (this.segment.expected == null && this.segment.calls.length && !this.resultSubmitted)
        this.missingCount();
      else
        this.fail({ status: 502, message: "Cursor did not complete its declared native tool batch" });
    }, this.limits.batchWait);
  }
  missingCount() {
    this.fail({ status: 502, message: "Cursor did not declare its native tool batch", retentionIneligible: !this.resultSubmitted });
  }
  answeredCall() {
    if (this.terminal || this.state === "awaiting-results")
      return;
    this.segment.answered++;
    if (this.batchTimer)
      this.waitForBatch();
    this.sealBatch();
  }
  listed(count) {
    if (!Number.isSafeInteger(count) || count < 1)
      invalid("invalid native tool count", 502);
    if (this.segment.expected != null && this.segment.expected !== count) {
      this.fail({ status: 502, message: "inconsistent native tool count", retentionIneligible: !this.resultSubmitted, continuityReason: "inconsistent-batch-count" });
      return;
    }
    this.segment.expected = count;
    if (this.state === "awaiting-results")
      return;
    this.waitForBatch();
    this.sealBatch();
  }
  sealBatch() {
    const segment = this.segment;
    if (segment.expected == null)
      return;
    const made = segment.calls.length + segment.answered;
    if (made > segment.expected)
      invalid("native tool batch exceeded its declared count", 502);
    if (made !== segment.expected || segment.closed)
      return;
    if (!segment.calls.length) {
      segment.expected = null;
      segment.answered = 0;
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
      this.nextStep();
      return;
    }
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
    this.state = "awaiting-results";
    this.batches ??= [];
    this.batches.push(segment);
    for (const c of segment.calls)
      this.pool.handles.set(c.id, { owner: this, batch: segment });
    segment.finish({ stop: "tool_calls", usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      prompt_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
      magpie_native: { accounting: "pending" }
    } });
    this.segments++;
    this.resultTimer = later(() => this.fail({ status: 410, message: "native tool-result deadline expired" }, "expired"), this.limits.resultWait);
  }
  store(id, data) {
    if (!id.length)
      invalid("native blob ID is empty", 502);
    const key = id.toString("hex");
    if (this.knownHashes.has(key) && hash(data) !== key)
      invalid("native content-addressed bootstrap blob changed", 502);
    const size = this.blobSize - (this.blobs.get(key)?.length ?? 0) + data.length;
    if (size + (this.checkpoint?.bytes.length ?? 0) > this.limits.blobBytes)
      invalid("native blob retention limit reached", 503);
    this.blobs.set(key, Buffer.from(data));
    this.blobSize = size;
    this.validateCheckpoint();
  }
  checkpointReceived(data) {
    if (data.length + this.blobSize > this.limits.blobBytes)
      invalid("native checkpoint retention limit reached", 503);
    nativeFields(data);
    this.checkpoint = { bytes: Buffer.from(data), sequence: ++this.sequence, status: "incomplete", terminal: this.terminal };
    this.validateCheckpoint();
  }
  validateCheckpoint() {
    if (!this.checkpoint)
      return;
    const state = nativeFields(this.checkpoint.bytes);
    const missing = new Set;
    let supported = true;
    const get = (id) => {
      const key = id.toString("hex");
      const b = this.blobs.get(key);
      if (!b)
        missing.add(key);
      return b;
    };
    const refs = new Set([1, 3, 6, 7, 11, 13]);
    const known = new Set(Array.from({ length: 34 }, (_, i) => i + 1).filter((n) => n !== 2));
    const complex = new Set([3, 6, 7, 11, 12, 13, 15, 16, 20, 24, 29, 30, 31, 32]);
    for (const f of state) {
      if (!known.has(f.num) || complex.has(f.num))
        supported = false;
      if (refs.has(f.num) && f.data.length)
        get(f.data);
      if (f.num !== 8)
        continue;
      const turn = get(f.data);
      if (!turn)
        continue;
      const tf = nativeFields(turn);
      const agent = field(tf, 1);
      if (!agent || tf.some((f2) => f2.num !== 1)) {
        supported = false;
        continue;
      }
      const agentFields = nativeFields(agent.data);
      if (!field(agentFields, 1)?.data.length)
        supported = false;
      for (const a of agentFields) {
        if (a.num === 1) {
          const user = get(a.data);
          if (user)
            nativeFields(user);
        } else if (a.num === 2) {
          const step = get(a.data);
          if (step) {
            const sf = nativeFields(step);
            if (sf.length !== 1 || ![1, 2, 3].includes(sf[0].num))
              supported = false;
            else {
              const stepFields = nativeFields(sf[0].data);
              if (sf[0].num === 2 && (stepFields.length !== 1 || stepFields[0].num !== 15))
                supported = false;
            }
          }
        } else if (![3, 4, 5, 6].includes(a.num))
          supported = false;
      }
    }
    this.checkpoint.missing = missing.size;
    this.checkpoint.status = !supported ? "unsupported" : missing.size ? "incomplete" : "complete";
    this.checkpoint.terminal = this.terminal;
  }
  terminalSeen(fields) {
    if (this.segment.calls.length)
      invalid("Cursor ended a turn with unresolved native tool calls", 502);
    this.terminal = true;
    this.state = "finalizing";
    this.usageFields = fields;
    if (this.checkpoint)
      this.checkpoint.terminal = true;
    clearTimeout(this.batchTimer);
    this.drainTimer = later(() => {
      Promise.resolve().then(() => this.complete()).catch((e) => this.fail(failureOf(e)));
    }, this.limits.drain);
  }
  complete() {
    if (this.completionTask)
      return this.completionTask;
    if (this.error || this.state === "complete")
      return;
    if (!this.terminal)
      invalid("native Run ended before TurnEnded or a complete final answer", 502);
    const { usageOf } = this.wire;
    const measuredInput = this.usageFields?.some((f) => [1, 3, 4].includes(f.num));
    const measuredOutput = this.usageFields?.some((f) => f.num === 2);
    const u = usageOf(this.usageFields ?? []);
    if (!measuredInput)
      u.input = this.estimate;
    if (!measuredOutput)
      u.output = Math.floor((this.said + 3) / 4);
    let earlier = null;
    if (this.steps > 1) {
      const whole = u.input + u.cacheRead + u.cacheWrite;
      const share = (total, own2) => total > 0 ? Math.min(1, Math.max(own2, total / this.steps) / total) : 0;
      const fi = share(whole, measuredInput ? this.stepEstimate ?? 0 : whole);
      const fo = share(u.output, Math.floor((this.said - this.stepSaid + 3) / 4));
      const own = {
        input: Math.round(u.input * fi),
        cacheRead: Math.round(u.cacheRead * fi),
        cacheWrite: Math.round(u.cacheWrite * fi),
        output: Math.round(u.output * fo),
        reasoning: Math.round(u.reasoning * fo)
      };
      earlier = { input: u.input - own.input, cacheRead: u.cacheRead - own.cacheRead, cacheWrite: u.cacheWrite - own.cacheWrite, output: u.output - own.output };
      Object.assign(u, own);
    }
    const prompt = u.input + u.cacheRead + u.cacheWrite;
    this.finalUsage = {
      prompt_tokens: prompt,
      completion_tokens: u.output,
      total_tokens: prompt + u.output,
      prompt_tokens_details: { cached_tokens: u.cacheRead, cache_write_tokens: u.cacheWrite },
      ...this.usageFields?.some((f) => f.num === 5) ? { completion_tokens_details: { reasoning_tokens: u.reasoning } } : {},
      ...!measuredInput || !measuredOutput ? { magpie_native: { accounting: "estimated" } } : {}
    };
    this.state = "finalizing";
    this.closeTransport();
    const finish = (settled) => {
      if (this.error)
        return;
      const more = earlier && settled ? Object.fromEntries(Object.keys(earlier).map((k) => [k, earlier[k] + settled[k]])) : earlier ?? settled;
      const deferred = more && more.input + more.output + more.cacheRead + more.cacheWrite > 0;
      this.segment.finish({ stop: "stop", usage: {
        ...this.finalUsage,
        ...deferred ? { magpie_deferred: {
          prompt_tokens: more.input + more.cacheRead + more.cacheWrite,
          completion_tokens: more.output,
          cached_tokens: more.cacheRead,
          cache_write_tokens: more.cacheWrite
        } } : {}
      } });
      this.state = "complete";
      this.pool.release(this);
      this.replayTimer = later(() => this.pool.forget(this), this.limits.replayWait);
    };
    if (!this.accounting)
      return finish(null);
    this.completionTask = this.accounting.settle().then(finish);
    return this.completionTask;
  }
  async pump(stream) {
    const { pb, exec, failure } = this.wire;
    try {
      for await (const f of stream) {
        if (this.error || this.state === "complete")
          return;
        if (f.end) {
          const e = failure(200, f.data);
          if (e.status < 200 || e.status > 299)
            throw new NativeSessionError(e.status, e.message);
          if (this.segment.calls.length && this.segment.expected == null) {
            this.missingCount();
            return;
          }
          if (!this.terminal && !this.segment.calls.length && this.segment.content)
            this.terminalSeen([]);
          await this.complete();
          return;
        }
        for (const m of nativeFields(f.data)) {
          switch (m.num) {
            case 1:
              for (const u of nativeFields(m.data)) {
                const uf = nativeFields(u.data);
                if (u.num === 1 || u.num === 4) {
                  const text = str(uf, 1);
                  if (this.terminal || this.state === "awaiting-results")
                    invalid("native output arrived outside a running Chat segment", 502);
                  if (text) {
                    this.said += text.length;
                    if (u.num === 1)
                      this.wrote += text.length;
                    this.segment.emit(u.num === 1 ? { text } : { reasoning: text });
                    if (this.batchTimer)
                      this.waitForBatch();
                  }
                } else if (u.num === 14) {
                  if (!this.segment.content && !this.segment.calls.length)
                    invalid("an empty reply (Cursor ended the turn without text or a tool call)", 502);
                  this.terminalSeen(uf);
                } else if (u.num === 27) {
                  this.listed(num(uf, 1));
                  if (this.error)
                    return;
                }
              }
              break;
            case 2: {
              const c = exec(m.data, this.chatTools, (b) => this.send(b), (id) => this.execClose(id), null, true);
              if (c)
                this.acceptCall(c);
              else if (!nativeFields(m.data).some((e) => e.num === 10))
                this.answeredCall();
              break;
            }
            case 3:
              this.checkpointReceived(m.data);
              break;
            case 4: {
              const kv = nativeFields(m.data);
              const id = num(kv, 1);
              for (const k of kv) {
                if (k.num === 2) {
                  const want = field(nativeFields(k.data), 1)?.data.toString("hex") ?? "";
                  const b = this.blobs.get(want);
                  const res = b ? pb().bytes(1, b) : pb().bytes(2, pb().str(1, "blob not found"));
                  await this.reply(pb().bytes(3, pb().varint(1, id).bytes(2, res)).done());
                } else if (k.num === 3) {
                  try {
                    const set = nativeFields(k.data);
                    this.store(field(set, 1)?.data ?? Buffer.alloc(0), field(set, 2)?.data ?? Buffer.alloc(0));
                  } catch (e) {
                    this.send(pb().bytes(3, pb().varint(1, id).bytes(3, pb().bytes(1, pb().str(1, "native blob could not be retained")))).done());
                    throw e;
                  }
                  await this.reply(pb().bytes(3, pb().varint(1, id).bytes(3, Buffer.alloc(0))).done());
                }
              }
              break;
            }
            case 5:
              for (const c of nativeFields(m.data))
                if (c.num === 1) {
                  const id = num(nativeFields(c.data), 1);
                  const pending = this.execs.get(id);
                  if (pending && !pending.submitted)
                    invalid("Cursor cancelled a pending native tool exec; late results cannot be submitted", 410);
                }
              break;
            case 7:
              invalid("unsupported native interaction query", 502);
          }
        }
      }
      if (!this.error && this.state !== "complete") {
        if (this.terminal)
          await this.complete();
        else
          invalid("native reply broke off before completing its turn or tool batch: EOF", 502);
      }
    } catch (e) {
      if (!this.error && this.state !== "complete")
        this.fail(failureOf(e));
    }
  }
}
var nativeSessions = new NativeSessionPool;

// node_modules/@magpie-community/opencode-cursor-auth/index.mjs
import { isDeepStrictEqual } from "node:util";
import http2 from "node:http2";
import { STATUS_CODES } from "node:http";
import { gunzipSync } from "node:zlib";
import { Duplex } from "node:stream";
import { createHash as createHash3, randomBytes as randomBytes2, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile as readFile2, stat, readdir, realpath } from "node:fs/promises";
import { homedir as homedir2, platform as platform3, tmpdir as tmpdir2 } from "node:os";
import { basename, dirname as dirname2, join as join4 } from "node:path";
var ID = "cursor";
var API = "https://api2.cursor.sh";
var WEBSITE = "https://cursor.com";
var AGENT = "https://agentn.global.api5.cursor.sh";
var CHAT = "@ai-sdk/openai-compatible";
var VERSION_FALLBACK = "2026.09.23-86fc751";
var DEFAULT_CONTEXT = 200000;
var MODELS_KEEP = 10 * 60 * 1000;
var CALL = "CallDynamicTool";
var NO_RESULT = "Tool use was interrupted and did not produce a result.";
var CLI_MARK = "cursor-agent";
var GOOS = { win32: "windows" }[platform3()] ?? platform3();
var EMPTY = Buffer.alloc(0);
var enc = new TextEncoder;
var exists = (p) => stat(p).then((s) => !s.isDirectory(), () => false);
function run(file, args, { timeout = 1e4, env: env2 } = {}) {
  return new Promise((resolve) => {
    execFile(file, args, { timeout, env: env2 ?? process.env, maxBuffer: 8 << 20 }, (err, stdout) => resolve({ ok: !err, out: String(stdout ?? ""), code: typeof err?.code === "number" ? err.code : err ? -1 : 0 }));
  });
}
async function cursorExecutable() {
  const dirs = (process.env.PATH ?? "").split(GOOS === "windows" ? ";" : ":").filter(Boolean);
  for (const name of ["cursor-agent", "agent"]) {
    for (const d of dirs) {
      const p = join4(d, GOOS === "windows" ? name + ".exe" : name);
      if (!await exists(p))
        continue;
      if (name === "cursor-agent")
        return p;
      if ((await realpath(p).catch(() => "")).includes("cursor-agent"))
        return p;
    }
  }
  const home = homedir2();
  for (const p of [join4(home, ".local", "bin", "cursor-agent"), "/usr/local/bin/cursor-agent", "/opt/homebrew/bin/cursor-agent"])
    if (await exists(p))
      return p;
  return "";
}
var VERSION_RE = /^\d{4}\.\d{2}\.\d{2}-[0-9a-f]+$/;
var versionSaid = "";
async function clientVersion() {
  if (versionSaid)
    return versionSaid;
  let v = "";
  const exe = await cursorExecutable();
  if (exe) {
    const d = basename(dirname2(await realpath(exe).catch(() => exe)));
    if (VERSION_RE.test(d))
      v = d;
  }
  if (!v) {
    const dirs = [join4(homedir2(), ".local", "share", "cursor-agent", "versions")];
    if (GOOS === "windows")
      dirs.push(join4(process.env.LOCALAPPDATA ?? "", "cursor-agent", "versions"));
    for (const dir of dirs)
      for (const n of await readdir(dir).catch(() => []))
        if (VERSION_RE.test(n) && n > v)
          v = n;
  }
  versionSaid = "cli-" + (v || VERSION_FALLBACK);
  return versionSaid;
}
function authFile() {
  const home = homedir2();
  if (GOOS === "windows")
    return join4(process.env.APPDATA || join4(home, "AppData", "Roaming"), "Cursor", "auth.json");
  if (GOOS === "darwin")
    return join4(home, ".cursor", "auth.json");
  return join4(process.env.XDG_CONFIG_HOME || join4(home, ".config"), "cursor", "auth.json");
}
var TOKEN_TTL = 1e4;
var KEYCHAIN_DENIED = 10 * 60000;
var keychain = { tok: "", at: 0, ask: 0, busy: null, now: () => Date.now(), read: (args) => run("security", args) };
function keychainToken(fresh = false) {
  const go = async () => {
    const now = keychain.now();
    const ttl = !keychain.tok && now - keychain.ask < KEYCHAIN_DENIED ? KEYCHAIN_DENIED : TOKEN_TTL;
    if (!fresh && now - keychain.at < ttl)
      return keychain.tok;
    const r = await keychain.read(["find-generic-password", "-s", "cursor-access-token", "-a", "cursor-user", "-w"]);
    keychain.tok = "";
    keychain.at = keychain.now();
    if (r.ok) {
      keychain.tok = r.out.trim();
      keychain.ask = 0;
    } else if (r.code !== 44) {
      keychain.ask = keychain.at;
    } else
      keychain.ask = 0;
    return keychain.tok;
  };
  const p = (keychain.busy ?? Promise.resolve()).then(go, go);
  keychain.busy = p.catch(() => {});
  return p;
}
async function cliToken(fresh = false) {
  if (GOOS === "darwin") {
    const t = await keychainToken(fresh);
    if (t)
      return t;
  }
  try {
    return JSON.parse(await readFile2(authFile(), "utf8"))?.accessToken ?? "";
  } catch {
    return "";
  }
}
function expiry(tok) {
  const parts = String(tok ?? "").split(".");
  if (parts.length !== 3)
    return 0;
  try {
    const exp = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))?.exp;
    return typeof exp === "number" && exp > 0 ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}
var SOON = 5 * 60 * 1000;

class AuthError extends Error {
  constructor(msg) {
    super(msg);
    this.status = 401;
  }
}
var cliRefresh = null;
async function cliTokenNow() {
  let tok = await cliToken();
  const exp = expiry(tok);
  if (tok && (!exp || exp - Date.now() > SOON))
    return tok;
  const exe = await cursorExecutable();
  if (exe) {
    cliRefresh ??= run(exe, ["status"], { timeout: 30000 }).finally(() => cliRefresh = null);
    await cliRefresh;
    tok = await cliToken(true);
  }
  if (!tok)
    throw new AuthError("Cursor isn't signed in; sign in from magpie's Providers page or run `cursor-agent login`");
  const e = expiry(tok);
  if (e && e <= Date.now())
    throw new AuthError("Cursor's sign-in has run out; sign in again from magpie's Providers page or run `cursor-agent login`");
  return tok;
}
async function headersFor(tok) {
  return {
    "Content-Type": "application/json",
    "Connect-Protocol-Version": "1",
    ...tok ? { Authorization: `Bearer ${tok}` } : {},
    "x-cursor-client-version": await clientVersion(),
    "x-cursor-client-type": "cli",
    "x-ghost-mode": "true"
  };
}
async function unary(base, path, tok, body = {}, timeout = 15000) {
  const res = await fetch(base + "/" + path, {
    method: "POST",
    headers: await headersFor(tok),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout)
  });
  const text = await res.text();
  if (!res.ok) {
    const f = failure(res.status, text);
    const e = new Error(f.message);
    e.status = f.status;
    throw e;
  }
  return JSON.parse(text || "{}");
}
async function whoIs(tok) {
  const [me, plan] = await Promise.allSettled([
    unary(API, "aiserver.v1.DashboardService/GetMe", tok),
    unary(API, "aiserver.v1.DashboardService/GetPlanInfo", tok)
  ]);
  return {
    email: me.status === "fulfilled" ? String(me.value?.email ?? "").trim() : "",
    plan: plan.status === "fulfilled" ? String(plan.value?.planInfo?.planName ?? "").trim() : ""
  };
}
var plans = new Map;
var PLAN_TTL = 3600000;
async function planOf(tok) {
  const had = plans.get(tok);
  if (had && Date.now() - had.at < PLAN_TTL)
    return had.plan;
  try {
    const plan = String((await unary(API, "aiserver.v1.DashboardService/GetPlanInfo", tok))?.planInfo?.planName ?? "").trim();
    if (plan)
      plans.set(tok, { plan, at: Date.now() });
    return plan || had?.plan || "";
  } catch {
    return had?.plan ?? "";
  }
}
var exchanged = new Map;
async function keyToken(key) {
  const h = createHash3("sha256").update(key).digest("hex");
  const had = exchanged.get(h);
  if (had && (!had.exp || had.exp - Date.now() > SOON))
    return had.tok;
  const res = await fetch(API + "/auth/exchange_user_api_key", {
    method: "POST",
    headers: { ...await headersFor(key), "Connect-Protocol-Version": undefined },
    body: "{}",
    signal: AbortSignal.timeout(15000)
  }).catch((e) => {
    throw Object.assign(new Error("couldn't reach Cursor's API: " + e.message), { status: 502 });
  });
  if (res.status >= 500)
    throw Object.assign(new Error(`exchange_user_api_key: HTTP ${res.status}`), { status: 502 });
  const j = res.ok ? await res.json().catch(() => null) : null;
  if (!j?.accessToken)
    throw new AuthError("Cursor didn't take this API key");
  exchanged.set(h, { tok: j.accessToken, exp: expiry(j.accessToken) });
  return j.accessToken;
}
async function tokenOf(auth) {
  if (auth?.type === "api" && auth.key)
    return keyToken(auth.key);
  if (auth?.type !== "oauth")
    throw new AuthError("Cursor isn't signed in");
  if (auth.refresh === CLI_MARK)
    return cliTokenNow();
  const exp = auth.expires || expiry(auth.access);
  if (!auth.access)
    throw new AuthError("Cursor isn't signed in");
  if (exp && exp <= Date.now())
    throw new AuthError("Cursor's sign-in has run out; sign in to Cursor again");
  return auth.access;
}
async function browserSignIn() {
  const verifier = randomBytes2(32).toString("base64url");
  const challenge = createHash3("sha256").update(verifier).digest("base64url");
  const uuid = randomUUID();
  const url = new URL("/loginDeepControl", WEBSITE);
  url.searchParams.set("challenge", challenge);
  url.searchParams.set("uuid", uuid);
  url.searchParams.set("mode", "login");
  url.searchParams.set("redirectTarget", "cli");
  return {
    url: url.toString(),
    instructions: "Sign in to Cursor in the browser; this finishes by itself.",
    method: "auto",
    async callback() {
      const headers = { "Content-Type": "application/json", "x-cursor-client-version": await clientVersion(), "x-cursor-client-type": "cli" };
      let errors2 = 0;
      for (let r = 0;r < 150; r++) {
        const wait = Math.min(1000 * 1.2 ** r, 1e4);
        let res;
        try {
          res = await fetch(`${API}/auth/poll?uuid=${uuid}&verifier=${verifier}`, { headers, signal: AbortSignal.timeout(15000) });
        } catch {
          if (++errors2 >= 3)
            return { type: "failed", error: "couldn't reach Cursor" };
          await sleep(wait);
          continue;
        }
        if (res.status === 404) {
          errors2 = 0;
          await sleep(wait);
          continue;
        }
        if (!res.ok) {
          if (res.status === 403 || ++errors2 >= 3)
            return { type: "failed", error: res.status === 403 ? "Cursor refused the sign-in (403)" : `Cursor's sign-in answered HTTP ${res.status}` };
          await sleep(wait);
          continue;
        }
        const j = await res.json().catch(() => null);
        if (!j?.accessToken || !("refreshToken" in j))
          return { type: "failed", error: "Cursor sent back no token" };
        const who = await whoIs(j.accessToken);
        return {
          type: "success",
          access: j.accessToken,
          refresh: j.refreshToken || "none",
          expires: expiry(j.accessToken) || Date.now() + 30 * 24 * 3600 * 1000,
          ...who.email ? { accountId: who.email } : {},
          ...who.plan ? { plan: who.plan } : {}
        };
      }
      return { type: "failed", error: "the sign-in timed out" };
    }
  };
}
async function cliSignIn() {
  return {
    url: "",
    instructions: "Uses the account `cursor-agent login` signed in to.",
    method: "auto",
    async callback() {
      const tok = await cliToken(true);
      const exp = expiry(tok);
      if (!tok)
        return { type: "failed", error: "cursor-agent isn't signed in: run `cursor-agent login`" };
      if (exp && exp <= Date.now())
        return { type: "failed", error: "cursor-agent's sign-in has run out: run `cursor-agent login` again" };
      const who = await whoIs(tok);
      if (!who.email)
        return { type: "failed", error: "Cursor couldn't say which account is signed in" };
      return { type: "success", access: "", refresh: CLI_MARK, expires: 0, accountId: who.email, ...who.plan ? { plan: who.plan } : {} };
    }
  };
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var statusText = (s) => ({ 413: "Request Entity Too Large", 414: "Request URI Too Long", 416: "Requested Range Not Satisfiable", 418: "I'm a teapot", 509: "" })[s] ?? STATUS_CODES[s] ?? "";
var POOL_VARIANT = /-(fast|none|low|medium|high|xhigh|extra-high|max|thinking)$/;
function poolBase(model) {
  model = String(model).trim().toLowerCase().replace(/@[^@]*$/, "");
  if (model.startsWith("cursor-"))
    model = model.slice("cursor-".length);
  for (;; ) {
    const b = model.replace(POOL_VARIANT, "");
    if (b === model)
      return model;
    model = b;
  }
}
function firstParty(model) {
  model = model.replace(/@[^@]*$/, "");
  if (model.startsWith("cursor-"))
    model = model.slice("cursor-".length);
  if (model === "default" || model === "composer" || model.startsWith("composer-"))
    return true;
  return ["grok-4.5", "grok-4.6", "grok-4.7"].some((b) => model === b || model.startsWith(b + "-"));
}
function onDemandOf(data, hard) {
  const s = data?.spendLimitUsage;
  const usedDollars = Number(s?.individualUsed ?? 0) / 100;
  const own = s?.individualLimit === undefined ? undefined : Number(s.individualLimit) > 0 ? { kind: "fixed", usedDollars, limitDollars: Number(s.individualLimit) / 100 } : { kind: "disabled", usedDollars };
  if (s?.limitType === "team") {
    if (own)
      return own;
    if (hard && (hard.noUsageBasedAllowed || !(Number(hard.hardLimit) > 0)))
      return { kind: "disabled", usedDollars };
    const pool = Number(s.pooledLimit ?? 0);
    if (pool > 0)
      return { kind: "fixed", usedDollars: Number(s.pooledUsed ?? 0) / 100, limitDollars: pool / 100, mineDollars: usedDollars };
    return hard ? { kind: "unlimited", usedDollars } : { kind: "unavailable", usedDollars };
  }
  if (!hard)
    return own ?? { kind: "unavailable", usedDollars };
  if (hard.noUsageBasedAllowed)
    return { kind: "disabled", usedDollars };
  const limit = Number(hard.hardLimit ?? 0);
  if (limit >= 2147483647)
    return { kind: "unlimited", usedDollars };
  return limit > 0 ? { kind: "fixed", usedDollars, limitDollars: limit } : { kind: "disabled", usedDollars };
}
async function hardLimit(tok) {
  try {
    const res = await fetch(API + "/aiserver.v1.DashboardService/GetHardLimit", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json", "Connect-Protocol-Version": "1" },
      body: "{}",
      signal: AbortSignal.timeout(15000)
    });
    return res.ok ? await res.json() ?? undefined : undefined;
  } catch {
    return;
  }
}
var dollars = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
async function usage(tok, ids) {
  const [res, hard] = await Promise.all([
    fetch(API + "/aiserver.v1.DashboardService/GetCurrentPeriodUsage", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json", "Connect-Protocol-Version": "1" },
      body: "{}",
      signal: AbortSignal.timeout(15000)
    }),
    hardLimit(tok)
  ]);
  if (!res.ok)
    return { error: statusText(res.status), windows: [] };
  const data = await res.json();
  const u = data?.planUsage;
  if (!u)
    return { windows: [] };
  const ms = /^[+-]?\d+$/.test(data.billingCycleEnd ?? "") ? Number(data.billingCycleEnd) : 0;
  const resets = ms > 0 ? { resetsAt: new Date(ms).toISOString() } : {};
  const bucket = new Set((data.autoBucketModels ?? []).map(poolBase));
  const inPool = (model) => {
    model = poolBase(model);
    if (model === "auto")
      model = "default";
    return bucket.has(model) || firstParty(model);
  };
  const asked = ids.flatMap((id) => [id, id.replace(/@[^@]*$/, "")]);
  const pool = [...new Set(["auto", ...asked, ...data.autoBucketModels ?? []])].filter(inPool);
  const num2 = (v) => typeof v === "number" ? v : 0;
  const od = onDemandOf(data, hard);
  const pooled = od.kind === "fixed" || od.kind === "unlimited" ? { aside: true } : {};
  const onDemand = od.kind === "fixed" ? [{ name: "On-demand", used: Math.max(0, Math.min(100, 100 * od.usedDollars / od.limitDollars)), display: `${dollars(od.usedDollars)} / ${dollars(od.limitDollars)}` + (od.mineDollars === undefined ? "" : ` (you: ${dollars(od.mineDollars)})`), ...resets }] : od.kind === "unlimited" ? [{ name: "On-demand", used: 0, display: dollars(od.usedDollars), ...resets, aside: true }] : [];
  return {
    windows: [
      { name: "Cursor Models", used: num2(u.autoPercentUsed), ...resets, models: pool, ...pooled },
      { name: "Other Models", used: num2(u.apiPercentUsed), ...resets, notModels: pool, ...pooled },
      ...onDemand,
      { name: "Total", used: num2(u.totalPercentUsed), ...resets, aside: true }
    ]
  };
}
async function botUsage(tok) {
  try {
    const subject = JSON.parse(Buffer.from(tok.split(".")[1], "base64url").toString()).sub;
    if (typeof subject !== "string")
      return [];
    const user = subject.split("|").filter(Boolean).at(-1);
    if (!user || !/^[a-zA-Z0-9._-]+$/.test(user))
      return [];
    const res = await fetch(WEBSITE + "/api/dashboard/get-sand-usage-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: WEBSITE,
        Cookie: "WorkosCursorSessionToken=" + encodeURIComponent(user + "::" + tok)
      },
      body: "{}",
      redirect: "error",
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok)
      return [];
    const data = await res.json();
    const paid = typeof data?.includedLimitZero === "boolean" ? !data.includedLimitZero : data?.hasNonZeroIncludedLimit === true;
    const trial = !paid && typeof data?.sandTrialExpiresAt === "string" && Date.parse(data.sandTrialExpiresAt) > Date.now();
    if (!paid && !trial || typeof data?.usagePercent !== "number" || !Number.isFinite(data.usagePercent))
      return [];
    const reset = paid && typeof data.nextResetTimestampUtc === "string" ? Date.parse(data.nextResetTimestampUtc) : NaN;
    return [{
      name: trial ? "Grok Bot (trial)" : "Grok Bot",
      used: Math.max(0, Math.min(100, data.usagePercent)),
      aside: true,
      ...Number.isFinite(reset) ? { resetsAt: new Date(reset).toISOString(), span: 604800 } : {}
    }];
  } catch {
    return [];
  }
}
var LEVEL_RANK = ["none", "minimal", "low", "medium", "high", "xhigh", "max"];
var EFFORT_PARAMS = ["effort", "reasoning_effort", "reasoning"];
var ID_EFFORTS = [["extra-high", "xhigh"], ["xhigh", "xhigh"], ["minimal", "minimal"], ["none", "none"], ["low", "low"], ["medium", "medium"], ["high", "high"], ["max", "max"]];
var cut = (s, suffix) => s.endsWith(suffix) && s.length > suffix.length ? s.slice(0, -suffix.length) : null;
function splitID(id) {
  let s = id;
  let fast = false;
  let thinking = false;
  let effort = "";
  let b;
  if ((b = cut(s, "-fast")) !== null)
    [s, fast] = [b, true];
  if ((b = cut(s, "-thinking")) !== null)
    [s, thinking] = [b, true];
  for (const [word, level] of ID_EFFORTS) {
    if ((b = cut(s, "-" + word)) !== null) {
      [s, effort] = [b, level];
      break;
    }
  }
  if (!thinking && (b = cut(s, "-thinking")) !== null)
    [s, thinking] = [b, true];
  if (thinking)
    s += "-thinking";
  if (fast)
    s += "-fast";
  return [s, effort];
}
var PICKER_SKIP = new Set(["claude-4.5-haiku", "claude-4.5-haiku-thinking", "gemini-2.5-pro", "gemini-2.5-flash", "claude-haiku-4-5"]);
var clean = (s) => String(s ?? "").replaceAll("​", "").split(/\s+/).filter(Boolean).join(" ");
function tokensOf(value) {
  const m = /^(\d+(?:\.\d+)?)([km])$/i.exec(String(value ?? "").trim());
  return m ? Math.round(Number(m[1]) * (m[2].toLowerCase() === "m" ? 1e6 : 1000)) : 0;
}
function paramDefs(m) {
  const out = {};
  for (const d of m.parameterDefinitions ?? []) {
    const t = d?.parameterType ?? {};
    const vs = (t.enumParameter ?? t.booleanParameter)?.values ?? [];
    if (d?.id)
      out[d.id] = vs.map((v) => String(v.value));
  }
  return out;
}
var valuesOf = (v) => Object.fromEntries((v?.parameterValues ?? []).map((p) => [String(p.id), String(p.value)]));
var defaultVariant = (m) => {
  const vs = m?.variants ?? [];
  return vs.find((v) => v.isDefaultNonMaxConfig) ?? vs.find((v) => v.isDefaultMaxConfig) ?? vs[0];
};
var needsMax = (m, v) => m?.supportsNonMaxMode === false || v?.isMaxMode === true;
function effortsOf(defs) {
  const pid = EFFORT_PARAMS.find((p) => defs[p]?.length);
  if (!pid && defs.thinking?.includes("true") && defs.thinking.includes("false"))
    return { pid: "thinking", levels: { none: "false", high: "true" } };
  if (!pid)
    return { pid: "", levels: {} };
  const levels = {};
  for (const v of defs[pid]) {
    const l = v === "extra-high" ? "xhigh" : v;
    if (LEVEL_RANK.includes(l))
      levels[l] = v;
  }
  return { pid, levels };
}
function served(m, ids) {
  const vs = m.variants ?? [];
  if (!ids)
    return vs;
  const got = vs.filter((v) => !v.legacySlug || ids.has(v.legacySlug));
  return got.some((v) => v.legacySlug) ? got : vs;
}
function modelsOf(picker, ids) {
  const out = [];
  const used = new Set;
  for (const m of picker) {
    if (!m?.name || m.isHidden || m.isChatOnly || m.onlySupportsCmdK || m.supportsAgent === false || PICKER_SKIP.has(m.name))
      continue;
    const defs = paramDefs(m);
    const variants = served(m, ids);
    const partial = variants.length < (m.variants ?? []).length;
    const has = (pid2, value) => !partial || !variants.some((v) => (pid2 in valuesOf(v))) || variants.some((v) => valuesOf(v)[pid2] === value);
    const def = defaultVariant({ variants });
    const { pid, levels: all } = effortsOf(defs);
    const levels = Object.fromEntries(Object.entries(all).filter(([, value]) => has(pid, value)));
    const base = { run: m.name, title: clean(m.clientDisplayName || m.name), pid, levels, fast: !!defs.fast?.length, variants, def, partial, model: m };
    const contexts = (defs.context ?? []).filter((c) => has("context", c));
    if (contexts.length) {
      for (const c of contexts) {
        const id = m.name + "@" + c;
        if (used.has(id))
          continue;
        used.add(id);
        out.push({ ...base, id, name: base.title + " @ " + c, context: tokensOf(c) || DEFAULT_CONTEXT, size: c, offersFast: fastAt(variants, c) });
      }
    } else if (!used.has(m.name)) {
      used.add(m.name);
      const limit = needsMax(m, def) ? m.contextTokenLimitForMaxMode || m.contextTokenLimit : m.contextTokenLimit;
      out.push({ ...base, id: m.name === "default" ? "auto" : m.name, name: base.title, context: limit > 0 ? limit : DEFAULT_CONTEXT, size: "", offersFast: fastAt(variants, "") });
    }
  }
  return out;
}
var fastAt = (variants, size) => variants.some((v) => {
  const have = valuesOf(v);
  return have.fast === "true" && (!size || have.context === undefined || have.context === size);
});
function nearest(vs, want) {
  let best;
  let most = -1;
  for (const v of vs) {
    const have = valuesOf(v);
    const n = Object.keys(want).filter((k) => have[k] === want[k]).length + (have.context === want.context ? 100 : 0);
    if (n > most)
      [best, most] = [v, n];
  }
  return best;
}
function pick(entry, effort, fast, seed) {
  const def = entry.def;
  const want = { ...valuesOf(seed ?? def) };
  if (entry.size)
    want.context = entry.size;
  if (effort === "off")
    effort = "none";
  if (entry.pid && entry.pid !== "thinking" && effort === "none" && !("none" in entry.levels) && "thinking" in want) {
    want.thinking = "false";
  } else if (entry.pid) {
    const at = effort ? fitEffort(effort, Object.keys(entry.levels)) : "";
    if (at && entry.levels[at])
      want[entry.pid] = entry.levels[at];
    if (!seed && entry.pid !== "thinking" && "thinking" in want && at)
      want.thinking = "true";
  }
  if (entry.fast)
    want.fast = fast ? "true" : "false";
  const same = (v2) => {
    const have = valuesOf(v2);
    return Object.keys({ ...have, ...want }).every((k) => have[k] === undefined || want[k] === undefined || have[k] === want[k]);
  };
  const v = entry.variants.find(same) ?? (seed ? branch(entry, want) : undefined) ?? (entry.partial ? nearest(entry.variants, want) : undefined);
  const params = Object.entries(v ? { ...want, ...valuesOf(v) } : want).map(([id2, value]) => ({ id: id2, value }));
  const maxMode = v ? needsMax(entry.model, v) : needsMax(entry.model, def) || tokensOf(entry.size) > (entry.model.contextTokenLimit || Infinity);
  const id = v?.legacySlug || def?.legacySlug || entry.run;
  return { id, params, maxMode };
}
function branch(entry, want) {
  if (!entry.pid || entry.pid === "thinking")
    return;
  const level = (x) => x === "extra-high" ? "xhigh" : x;
  const def = valuesOf(entry.def);
  const named = entry.variants.some((v) => level(valuesOf(v)[entry.pid]) === level(want[entry.pid]));
  if (!named && Object.keys(want).every((k) => k === entry.pid || k === "context" || def[k] === undefined || def[k] === want[k]))
    return;
  const vs = entry.variants.filter((v) => {
    const have = valuesOf(v);
    return entry.pid in have && Object.keys(want).every((k) => k === entry.pid || have[k] === undefined || have[k] === want[k]);
  });
  const at = fitEffort(level(want[entry.pid]), vs.map((v) => level(valuesOf(v)[entry.pid])));
  return at ? vs.find((v) => level(valuesOf(v)[entry.pid]) === at) : undefined;
}
function fitEffort(want, levels) {
  if (want === "ultra")
    want = "max";
  if (!levels.length || levels.includes(want))
    return want;
  const at = LEVEL_RANK.indexOf(want);
  if (at < 0)
    return "";
  let best = "";
  let dist = LEVEL_RANK.length;
  for (const l of levels) {
    const i = LEVEL_RANK.indexOf(l);
    if (i < 0 || l === "none")
      continue;
    const d = Math.abs(i - at);
    if (d < dist || d === dist && i > at)
      [best, dist] = [l, d];
  }
  return best;
}
var lists = new Map;
async function usable(tok) {
  const h = createHash3("sha256").update(tok).digest("hex");
  const had = lists.get(h);
  if (had && Date.now() - had.at < MODELS_KEEP)
    return had.raw;
  const [j, ids] = await Promise.all([
    unary(API, "aiserver.v1.AiService/AvailableModels", tok, { useModelParameters: true, doNotUseMarkdown: true }, 30000),
    unary(API, "agent.v1.AgentService/GetUsableModels", tok, {}, 8000).then((u) => {
      const ids2 = new Set((u?.models ?? []).flatMap((m) => [m.modelId, m.displayModelId]).filter(Boolean));
      return ids2.size ? ids2 : null;
    }, () => null)
  ]);
  const raw = modelsOf(Array.isArray(j?.models) ? j.models : [], ids);
  if (!raw.length)
    throw new Error("Cursor listed no models");
  lists.set(h, { at: Date.now(), raw });
  return raw;
}
function named(raw, id) {
  const models = raw.filter((e, i) => raw.findIndex((x) => x.model === e.model) === i);
  const at = (e, v) => raw.find((x) => x.model === e.model && x.size === (valuesOf(v).context ?? "")) ?? e;
  const as = (e, vs, effort2) => {
    const seed = nearest(vs, valuesOf(e.def));
    return { entry: at(e, seed), seed, effort: effort2, fast: valuesOf(seed).fast === "true" };
  };
  for (const e of models) {
    const vs = e.variants.filter((v) => v.legacySlug === id);
    if (vs.length)
      return as(e, vs, "");
  }
  const [family, effort] = splitID(id);
  for (const e of models) {
    const vs = e.variants.filter((v) => v.legacySlug && splitID(v.legacySlug)[0] === family);
    if (vs.length)
      return as(e, vs, effort);
  }
  for (const e of models) {
    const m = e.model;
    if ([m.name, ...m.legacySlugs ?? [], ...m.idAliases ?? []].includes(id))
      return { entry: at(e, e.def), seed: undefined, effort: "", fast: false };
  }
  return null;
}
function request(raw, model, effort, fast) {
  const entry = raw.find((m) => m.id === model);
  if (entry)
    return pick(entry, effort, fast);
  const old = named(raw, model);
  if (old)
    return pick(old.entry, effort || old.effort, fast || old.fast, old.seed);
  return { id: model === "auto" ? "default" : model, params: [], maxMode: false };
}
function runtimeModel(m) {
  const efforts = LEVEL_RANK.filter((l) => (l in m.levels));
  return {
    id: m.id,
    providerID: ID,
    name: m.name,
    api: { id: m.id, url: AGENT, npm: CHAT },
    status: "active",
    headers: {},
    options: {},
    cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
    limit: { context: m.context || DEFAULT_CONTEXT, output: 0 },
    capabilities: {
      temperature: false,
      reasoning: efforts.length > 0,
      attachment: true,
      toolcall: true,
      input: { text: true, image: true, audio: false, video: false, pdf: false },
      output: { text: true, image: false, audio: false, video: false, pdf: false },
      interleaved: false
    },
    release_date: "",
    variants: Object.fromEntries(efforts.map((e) => [e, { reasoningEffort: e }])),
    ...m.offersFast ? { fast: true } : {}
  };
}

class PB {
  parts = [];
  push(b) {
    this.parts.push(b);
    return this;
  }
  uv(v) {
    const out = [];
    while (v >= 128) {
      out.push(v % 128 | 128);
      v = Math.floor(v / 128);
    }
    out.push(v);
    return this.push(Uint8Array.from(out));
  }
  tag(num2, wire) {
    return this.uv(num2 * 8 + wire);
  }
  varint(num2, v) {
    return this.tag(num2, 0).uv(v);
  }
  bytes(num2, v) {
    const b = v instanceof PB ? v.done() : v ?? EMPTY;
    return this.tag(num2, 2).uv(b.length).push(b);
  }
  str(num2, s) {
    return this.bytes(num2, Buffer.from(s, "utf8"));
  }
  double(num2, v) {
    const b = Buffer.alloc(8);
    b.writeDoubleLE(v);
    return this.tag(num2, 1).push(b);
  }
  done() {
    return Buffer.concat(this.parts);
  }
}
var pb = () => new PB;
function fields(b) {
  b = Buffer.isBuffer(b) ? b : Buffer.from(b ?? EMPTY);
  const out = [];
  let i = 0;
  const uv = () => {
    let v = 0;
    let m = 1;
    while (i < b.length) {
      const c = b[i++];
      v += (c & 127) * m;
      if (c < 128)
        return v;
      m *= 128;
    }
    return -1;
  };
  while (i < b.length) {
    const key = uv();
    if (key < 0)
      break;
    const f = { num: Math.floor(key / 8), wire: key % 8, n: 0, data: EMPTY };
    switch (f.wire) {
      case 0: {
        const v = uv();
        if (v < 0)
          return out;
        f.n = v;
        break;
      }
      case 1:
        if (i + 8 > b.length)
          return out;
        f.data = b.subarray(i, i + 8);
        f.n = Number(b.readBigUInt64LE(i));
        i += 8;
        break;
      case 2: {
        const l = uv();
        if (l < 0 || i + l > b.length)
          return out;
        f.data = b.subarray(i, i + l);
        i += l;
        break;
      }
      case 5:
        if (i + 4 > b.length)
          return out;
        f.n = b.readUInt32LE(i);
        i += 4;
        break;
      default:
        return out;
    }
    out.push(f);
  }
  return out;
}
var field2 = (fs, num2) => fs.find((f) => f.num === num2);
var pbStr = (fs, num2) => field2(fs, num2)?.data.toString("utf8") ?? "";
var pbNum = (fs, num2) => field2(fs, num2)?.n ?? 0;
function pbValue(v) {
  if (v === null || v === undefined)
    return pb().varint(1, 0);
  if (typeof v === "number")
    return pb().double(2, v);
  if (typeof v === "string")
    return pb().str(3, v);
  if (typeof v === "boolean")
    return pb().varint(4, v ? 1 : 0);
  if (Array.isArray(v)) {
    const l = pb();
    for (const e of v)
      l.bytes(1, pbValue(e));
    return pb().bytes(6, l);
  }
  if (typeof v === "object") {
    const st = pb();
    for (const k of Object.keys(v).sort())
      st.bytes(1, pb().str(1, k).bytes(2, pbValue(v[k])));
    return pb().bytes(5, st);
  }
  return pb().varint(1, 0);
}
function pbAny(b) {
  for (const f of fields(b)) {
    switch (f.num) {
      case 1:
        return null;
      case 2:
        return f.data.length === 8 ? f.data.readDoubleLE(0) : 0;
      case 3:
        return f.data.toString("utf8");
      case 4:
        return f.n !== 0;
      case 5: {
        const m = {};
        for (const e of fields(f.data)) {
          if (e.num !== 1)
            continue;
          const kv = fields(e.data);
          const v = field2(kv, 2);
          m[pbStr(kv, 1)] = v ? pbAny(v.data) : null;
        }
        return m;
      }
      case 6:
        return fields(f.data).filter((e) => e.num === 1).map((e) => pbAny(e.data));
    }
  }
  return null;
}
function frame(msg) {
  const head = Buffer.alloc(5);
  head.writeUInt32BE(msg.length, 1);
  return Buffer.concat([head, msg]);
}
async function* frames(body) {
  let buf = EMPTY;
  for await (const chunk of body) {
    buf = buf.length ? Buffer.concat([buf, chunk]) : Buffer.from(chunk);
    while (buf.length >= 5) {
      const n = buf.readUInt32BE(1);
      if (n > 64 << 20)
        throw new Error("a malformed stream");
      if (buf.length < 5 + n)
        break;
      const flags = buf[0];
      let data = buf.subarray(5, 5 + n);
      buf = buf.subarray(5 + n);
      if (flags & 1)
        data = gunzipSync(data);
      yield { end: (flags & 2) !== 0, data };
    }
  }
  if (buf.length)
    throw new Error("unexpected EOF");
}
var regional = (msg) => msg.toLowerCase().includes("region");
function failure(status, text) {
  let e;
  try {
    e = JSON.parse(typeof text === "string" ? text : Buffer.from(text).toString("utf8"));
  } catch {
    return statusOf(status, "", String(text ?? "").trim());
  }
  const f = e?.error && typeof e.error === "object" ? e.error : e ?? {};
  let msg = f.message ?? "";
  for (const d of f.details ?? []) {
    const t = `${d?.debug?.details?.title ?? ""}: ${d?.debug?.details?.detail ?? ""}`.trim();
    if (t !== ":")
      msg = t.replace(/^[:\s]+|[:\s]+$/g, "");
  }
  if (!msg || msg === "Error")
    msg = f.code ?? "";
  if (!f.code && status >= 200 && status < 300)
    return { status, message: msg };
  return statusOf(status, f.code ?? "", msg);
}
function statusOf(status, code, msg) {
  msg ||= statusText(status);
  const low = msg.toLowerCase();
  const out = (status2, message) => ({ status: status2, message });
  if (regional(msg))
    return out(403, msg + " — Cursor serves your team only in some regions and turned this request away; signing in again won't change that");
  if (code === "permission_denied")
    return out(403, msg);
  if (code === "unauthenticated" || status === 401 || low.includes("expired"))
    return out(401, msg + " — sign in to Cursor again in magpie");
  if (code === "resource_exhausted" || low.includes("quota") || low.includes("rate limit") || low.includes("usage limit"))
    return out(429, "usage limit reached: " + msg);
  if (low.includes("too long") || low.includes("context length") || low.includes("too many tokens"))
    return out(400, "input is too long for the model's context: " + msg);
  if (code === "invalid_argument")
    return out(400, msg);
  if (code === "unavailable")
    return out(503, msg);
  if (code)
    return out(502, msg);
  return out(status, msg);
}
var textOf = (c) => typeof c === "string" ? c : Array.isArray(c) ? c.filter((p) => p?.type === "text").map((p) => p.text ?? "").join("") : "";
var reasoningOf = (m) => [m.reasoning_content, m.reasoning].find((s) => typeof s === "string" && s.trim()) ?? "";
function joinSplitCalls(msgs) {
  const out = [];
  for (const m of msgs) {
    const prev = out.at(-1);
    if (m?.role === "assistant" && prev?.role === "assistant" && prev.tool_calls?.length) {
      const content = [textOf(prev.content), textOf(m.content)].filter(Boolean).join(`

`);
      const reasoning_content = [reasoningOf(prev), reasoningOf(m)].filter(Boolean).join(`

`);
      out[out.length - 1] = { ...prev, content, reasoning_content, tool_calls: [...prev.tool_calls, ...m.tool_calls ?? []] };
      continue;
    }
    out.push(m);
  }
  return out;
}
function parseArgs(s) {
  if (s && typeof s === "object")
    return s;
  try {
    const v = JSON.parse(s || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function toolsOf(chat) {
  const choice = chat.tool_choice;
  const only = typeof choice === "object" ? choice?.function?.name : "";
  if (choice === "none")
    return [];
  return (chat.tools ?? []).filter((t) => t?.type === "function" && t.function?.name && (!only || t.function.name === only)).map((t) => {
    const schema = t.function.parameters ?? { type: "object", properties: {} };
    return { name: t.function.name, description: t.function.description ?? "", schema, schemaText: JSON.stringify(schema) };
  });
}
function catalog(tools) {
  if (!tools.length)
    return "";
  let s = `

<dynamic_tool_catalog>
The MCP namespace "magpie" has the tools below. They are reached only through \`${CALL}\`, never as tools of their own. Each entry is the exact call to make; its arguments must match the schema given. The schemas are complete, so there is no need to call \`GetDynamicTools\` first.
`;
  for (const t of tools)
    s += `<call>${CALL}({"namespace":"magpie","toolName":"${t.name}","arguments":{...}})
${t.description}
arguments schema: ${t.schemaText}
</call>
`;
  return s + "</dynamic_tool_catalog>";
}
var callID = (id) => id.startsWith("call_") ? id.replace("__fc_", `
fc_`) : id;
function result(id, text, isError) {
  let res = text;
  try {
    res = JSON.parse(text);
  } catch {}
  return {
    type: "tool-result",
    toolCallId: callID(id),
    toolName: CALL,
    result: res,
    experimental_content: [{ type: "text", text }],
    ...isError ? { isError: true } : {}
  };
}
function conversation(chat, tools) {
  const out = [];
  const add = (m) => out.push(Buffer.from(JSON.stringify(m)));
  let size = 0;
  const system = [];
  let last = ".";
  for (const m of chat.messages ?? [])
    if (m.role === "system" || m.role === "developer")
      system.push(textOf(m.content));
  const sys = system.filter(Boolean).join(`

`) + catalog(tools);
  size += sys.length;
  if (sys)
    add({ role: "system", content: sys });
  let pending = [];
  let results = [];
  const answer = () => {
    for (const id of pending)
      results.push(result(id, NO_RESULT, true));
    pending = [];
    if (results.length)
      add({ role: "tool", content: results });
    results = [];
  };
  for (const m of joinSplitCalls(chat.messages ?? [])) {
    if (m.role === "system" || m.role === "developer")
      continue;
    if (m.role === "tool") {
      const id = m.tool_call_id ?? "";
      const i = pending.indexOf(id);
      if (i >= 0) {
        pending.splice(i, 1);
        const text = textOf(m.content);
        size += text.length;
        results.push(result(id, text, m.is_error === true || m.isError === true));
      }
      continue;
    }
    if (m.role === "assistant") {
      answer();
      const content2 = [];
      const reasoning = reasoningOf(m);
      if (reasoning)
        content2.push({ type: "reasoning", text: reasoning });
      const text = textOf(m.content);
      if (text)
        content2.push({ type: "text", text });
      size += reasoning.length + text.length;
      for (const c of m.tool_calls ?? []) {
        if (c?.type && c.type !== "function")
          continue;
        const args = parseArgs(c.function?.arguments);
        size += (c.function?.arguments ?? "").length + (c.function?.name ?? "").length;
        content2.push({ type: "tool-call", toolCallId: callID(c.id), toolName: CALL, args: { namespace: "magpie", toolName: c.function?.name, arguments: args } });
        pending.push(c.id);
      }
      if (content2.length)
        add({ role: "assistant", content: content2 });
      continue;
    }
    const content = [];
    const parts = typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content ?? [];
    let first = "";
    for (const p of parts) {
      if (p?.type === "text" && p.text) {
        content.push({ type: "text", text: p.text });
        size += p.text.length;
        first ||= p.text;
      } else if (p?.type === "image_url") {
        const u = typeof p.image_url === "string" ? p.image_url : p.image_url?.url ?? "";
        const d = /^data:([^;,]+);base64,(.*)$/s.exec(u);
        if (d)
          content.push({ type: "image", mimeType: d[1], image: { __type: "Uint8Array", hex: Buffer.from(d[2], "base64").toString("hex") } });
        else
          content.push({ type: "text", text: `[attachment image: ${u}]` });
      } else if (p?.type === "file") {
        content.push({ type: "text", text: `[attachment ${p.file?.filename ?? "file"}]` });
      }
    }
    answer();
    if (first)
      last = first;
    if (content.length)
      add({ role: "user", content });
  }
  answer();
  for (const t of tools)
    size += t.name.length + t.description.length + t.schemaText.length;
  return { msgs: out, last, estimate: Math.floor(size / 4) };
}
function toolDef(t) {
  const d = pb().str(1, t.name);
  if (t.description)
    d.str(2, t.description);
  d.bytes(3, pbValue(t.schema));
  return d.str(4, "magpie").str(5, t.name).str(6, t.schemaText).done();
}
var env2 = () => pb().str(1, GOOS).str(2, tmpdir2()).str(10, "UTC");
var SESSION = "x-magpie-cursor-session";
function sessionOf(input) {
  const s = String(input?.sessionID ?? "").trim();
  if (!s || /^magpie-[0-9a-f]{24}$/.test(s))
    return "";
  return s.slice(0, 128);
}
function uuidOf(b) {
  b = Buffer.from(b.subarray(0, 16));
  b[6] = b[6] & 15 | 64;
  b[8] = b[8] & 63 | 128;
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function conversationID(chat, session) {
  const key = (typeof chat?.prompt_cache_key === "string" ? chat.prompt_cache_key.trim() : "") || session || "";
  if (!key)
    return "";
  const msgs = Array.isArray(chat?.messages) ? chat.messages : [];
  const first = msgs.find((m) => m?.role === "user") ?? msgs[0];
  const sum = createHash3("sha256").update("cursor conversation\x00" + key + "\x00" + (first === undefined ? "" : JSON.stringify(first))).digest();
  return uuidOf(sum);
}
function usageOf(uf) {
  const [inp, cr, cw] = [pbNum(uf, 1), pbNum(uf, 3), pbNum(uf, 4)];
  return { input: Math.max(inp - cr - cw, 0), output: pbNum(uf, 2), cacheRead: cr, cacheWrite: cw, reasoning: pbNum(uf, 5) };
}
var STEP_WAIT = { first: 1500, every: 500, until: 6000, ask: 5000, skipAfter: 3, retryEvery: 10, owedAt: 5000, owedFor: 600000 };
var claimed = new Map;
var owed = new Map;
var flights = new Map;
var unreadable = new Map;
var misses = new Map;
var tokKey = (tok) => createHash3("sha256").update(tok).digest("hex");
var usageKey = (tok, conv) => tokKey(tok) + "\x00" + conv;
function canRead(tok) {
  const at = unreadable.get(tokKey(tok));
  if (at === undefined)
    return true;
  if (Date.now() - at < STEP_WAIT.owedFor)
    return false;
  unreadable.delete(tokKey(tok));
  return true;
}
var ZERO = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 });
function addUsage(a, b) {
  if (!b)
    return a;
  if (!a)
    return { ...b };
  for (const k of Object.keys(a))
    a[k] += b[k] ?? 0;
  return a;
}
var DEBT_GROUP_LIMIT = 64;
function owe(key, { since = Date.now(), n = 0, ready = Date.now(), carry = null, before }) {
  for (const [k, d2] of owed) {
    if (d2.groups) {
      d2.groups = d2.groups.filter((g) => Date.now() - g.since <= STEP_WAIT.owedFor);
      d2.n = d2.groups.reduce((sum, g) => sum + g.n, 0);
      if (Date.now() - d2.since > STEP_WAIT.owedFor)
        d2.carry = null;
      if (!d2.n && !d2.carry)
        owed.delete(k);
      else if (d2.groups.length)
        d2.since = Math.min(...d2.groups.map((g) => g.since));
    } else if (Date.now() - d2.since > STEP_WAIT.owedFor)
      owed.delete(k);
  }
  if (n <= 0 && !carry)
    return;
  const d = owed.get(key);
  if (!d)
    return void owed.set(key, { since, n, ready, carry: carry && { ...carry }, ...before !== undefined ? { before } : {} });
  if (n > 0 && (d.groups || d.before !== undefined || before !== undefined)) {
    const groups = d.groups ?? (d.n > 0 ? [{ since: d.since, n: d.n, ready: d.ready, before: d.before }] : []);
    const same = groups.find((g) => g.before === before);
    if (same) {
      same.since = Math.min(same.since, since);
      same.n += n;
      same.ready = Math.min(same.ready, ready);
    } else
      groups.push({ since, n, ready, before });
    groups.sort((a, b) => a.since - b.since);
    d.groups = groups.slice(-DEBT_GROUP_LIMIT);
    delete d.before;
    d.n = d.groups.reduce((sum, g) => sum + g.n, 0);
    d.since = Math.min(...d.groups.map((g) => g.since));
  } else {
    d.since = Math.min(d.since, since);
    d.n += n;
  }
  d.ready = Math.min(d.ready, ready);
  d.carry = addUsage(d.carry, carry);
}
async function usageEvents(tok, conv, since, want, { poll = false, first = STEP_WAIT.first, signal, before = () => Infinity, groups, abortFetch = false } = {}) {
  const key = usageKey(tok, conv);
  const end = Date.now() + STEP_WAIT.until;
  const wait = (ms) => new Promise((r) => {
    const t = setTimeout(r, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), r()), { once: true });
  });
  for (const [k, at] of claimed)
    if (Date.now() - at > 2 * STEP_WAIT.owedFor)
      claimed.delete(k);
  const num2 = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  let usage2 = null;
  let got = 0;
  const events = [];
  const counts = groups?.map(() => 0);
  if (poll)
    await wait(first);
  while (!signal?.aborted) {
    try {
      const res = await fetch(API + "/aiserver.v1.DashboardService/GetFilteredUsageEvents", {
        method: "POST",
        headers: await headersFor(tok),
        body: JSON.stringify({ teamId: 0, startDate: String(since - 60000), endDate: String(Date.now() + 60000), page: 1, pageSize: 50 }),
        signal: abortFetch && signal ? AbortSignal.any([signal, AbortSignal.timeout(STEP_WAIT.ask)]) : AbortSignal.timeout(STEP_WAIT.ask)
      });
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        unreadable.set(tokKey(tok), Date.now());
        return { usage: usage2, events, got, counts, refused: true };
      }
      const evs = res.ok ? (await res.json())?.usageEventsDisplay ?? [] : [];
      const found = evs.filter((e) => e?.conversationId === conv && e.tokenUsage && num2(e.timestamp) >= since - 1000 && !claimed.has(key + "\x00" + e.timestamp)).sort((a, b) => num2(a.timestamp) - num2(b.timestamp));
      for (const ev of found) {
        if (got >= want)
          break;
        const at = num2(ev.timestamp);
        if (at >= before())
          continue;
        const group = groups?.findIndex((g, i) => counts[i] < g.n && at >= g.since - 1000 && at < (g.before ?? Infinity));
        if (groups && group === -1)
          continue;
        if (groups)
          counts[group]++;
        claimed.set(key + "\x00" + ev.timestamp, Date.now());
        const t = ev.tokenUsage;
        const u = { input: num2(t.inputTokens), output: num2(t.outputTokens), cacheRead: num2(t.cacheReadTokens), cacheWrite: num2(t.cacheWriteTokens), reasoning: 0 };
        usage2 = addUsage(usage2 ?? ZERO(), u);
        events.push({ at: num2(ev.timestamp), usage: u });
        got++;
      }
      if (got >= want)
        break;
    } catch {}
    if (!poll || Date.now() + STEP_WAIT.every > end)
      break;
    await wait(STEP_WAIT.every);
  }
  return { usage: usage2, events, got, counts, refused: false };
}
function collect(tok, conv, { poll = false, first, signal, over = () => false, abortFetch = false } = {}) {
  const key = usageKey(tok, conv);
  const d = owed.get(key);
  if (!d)
    return Promise.resolve({ usage: null, carry: null, events: [], short: false });
  owed.delete(key);
  const p = (async () => {
    const groups = (d.groups ?? [d]).filter((g) => g.before === undefined && !d.groups || Date.now() - g.since <= STEP_WAIT.owedFor);
    const want = groups.reduce((sum, g) => sum + g.n, 0);
    let r = { usage: null, events: [], got: 0 };
    if (want > 0 && canRead(tok))
      r = await usageEvents(tok, conv, Math.min(...groups.map((g) => g.since)), want, {
        poll,
        first,
        signal,
        abortFetch,
        before: () => d.before ?? Infinity,
        ...d.groups ? { groups } : {}
      }).catch(() => r);
    let short = false;
    for (const [i, g] of groups.entries()) {
      const remaining = g.n - (d.groups ? r.counts?.[i] ?? 0 : r.got);
      if (remaining > 0 && canRead(tok)) {
        short = true;
        owe(key, { since: g.since, n: remaining, ready: g.ready, before: g.before });
      }
    }
    const carry = d.carry && { ...d.carry };
    const usage2 = addUsage(d.carry, r.usage);
    if (!over())
      return { usage: usage2, carry, events: r.events ?? [], short };
    owe(key, { carry: usage2 });
    return { usage: null, carry: null, events: [], short };
  })();
  p.debt = d;
  const set = flights.get(key) ?? new Set;
  flights.set(key, set.add(p));
  p.finally(() => {
    set.delete(p);
    if (!set.size && flights.get(key) === set)
      flights.delete(key);
  });
  return p;
}
function ledger(tok, conv, since, signal, kept, { before } = {}) {
  const key = tokKey(tok);
  const debtKey = usageKey(tok, conv);
  if (kept && before !== undefined) {
    const debts = [owed.get(debtKey), ...[...flights.get(debtKey) ?? []].map((p) => p.debt)];
    for (const d of debts)
      for (const g of d?.groups ?? (d ? [d] : []))
        g.before = Math.min(g.before ?? Infinity, before);
  }
  let mine = null;
  let theirs = null;
  let over = false;
  const gather = (opts) => collect(tok, conv, { ...opts, over: () => over, abortFetch: before !== undefined }).then((r) => {
    theirs = addUsage(theirs, r.carry);
    for (const e of r.events ?? []) {
      if (e.at >= since - 1000)
        mine = addUsage(mine, e.usage);
      else
        theirs = addUsage(theirs, e.usage);
    }
    return r;
  });
  let collecting = null;
  const debt = kept ? owed.get(debtKey) : undefined;
  const timer = debt ? setTimeout(() => collecting = gather(), Math.max(0, debt.ready - Date.now())) : null;
  timer?.unref?.();
  const takeMine = () => {
    const u = mine;
    mine = null;
    return u;
  };
  const take = () => {
    const u = addUsage(theirs, mine);
    mine = theirs = null;
    return u;
  };
  return {
    async own() {
      if (!canRead(tok))
        return null;
      const m = misses.get(key) ?? 0;
      const waits = m < STEP_WAIT.skipAfter || m % STEP_WAIT.retryEvery === 0;
      if (!kept) {
        const r = waits ? await usageEvents(tok, conv, since, 1, { poll: true, signal }).catch(() => ({})) : {};
        if (r.usage)
          misses.delete(key);
        else if (!r.refused)
          misses.set(key, m + 1);
        return r.usage ?? null;
      }
      owe(debtKey, { since, n: 1, ready: Date.now() + STEP_WAIT.owedAt });
      if (waits) {
        const r = await gather({ poll: true, signal });
        if (!canRead(tok))
          return null;
        if (r.short)
          misses.set(key, m + 1);
        else
          misses.delete(key);
      } else
        misses.set(key, m + 1);
      return takeMine() ?? false;
    },
    async owed(final) {
      if (!kept)
        return null;
      if (final) {
        await collecting;
        await Promise.all([...flights.get(debtKey) ?? []]);
        if (owed.has(debtKey))
          await gather({ poll: owed.get(debtKey).n > 0, first: 0, signal });
      }
      return take();
    },
    done() {
      over = true;
      clearTimeout(timer);
      const u = take();
      if (u)
        owe(debtKey, { carry: u });
    }
  };
}
function buildRun(msgs, lastUser, tools, model, conv = "", { maxMode = false, params = [] } = {}) {
  const blobs = new Map;
  const put = (b) => {
    const id = createHash3("sha256").update(b).digest();
    blobs.set(id.toString("hex"), b);
    return id;
  };
  const state = pb();
  for (const m of msgs)
    state.bytes(1, put(m));
  const mid = randomUUID();
  const user = pb().str(1, lastUser).str(2, mid).varint(4, 1).done();
  const turn = pb().bytes(1, pb().bytes(1, put(user)).str(10, mid)).done();
  state.bytes(8, put(turn)).varint(10, 1).str(22, "cli");
  const defs = tools.map(toolDef);
  const rc = pb().bytes(4, env2());
  const mcp = pb();
  for (const d of defs) {
    rc.bytes(7, d);
    mcp.bytes(1, d);
  }
  const action = pb().bytes(2, pb().bytes(2, rc));
  const details = pb().str(1, model).str(3, model).str(4, model);
  const requested = pb().str(1, model);
  if (maxMode) {
    details.varint(7, 1);
    requested.varint(2, 1);
  }
  for (const p of params)
    requested.bytes(3, pb().str(1, p.id).str(2, p.value));
  const rr = pb().bytes(1, state).bytes(2, action).bytes(3, details).bytes(4, mcp).str(5, conv || randomUUID()).bytes(9, requested).varint(19, 1);
  return { first: pb().bytes(1, rr).done(), blobs };
}
var endpoints = new Map;
async function agentURL(tok, fresh) {
  const key = createHash3("sha256").update(tok).digest("hex");
  const had = endpoints.get(key);
  if (!fresh && had && (had.listed || Date.now() - had.at < 60000))
    return had.url;
  let url = AGENT;
  let listed = false;
  try {
    const cfg = await unary(API, "aiserver.v1.ServerConfigService/GetServerConfig", tok, {}, 1e4);
    for (const raw of [cfg?.agentUrlConfig?.agentUrl, cfg?.agentUrlConfig?.agentnUrl]) {
      try {
        const u = new URL(raw);
        if ((u.protocol === "https:" || u.protocol === "http:") && u.host) {
          url = raw.replace(/\/+$/, "");
          listed = true;
          break;
        }
      } catch {}
    }
  } catch {}
  endpoints.set(key, { url, at: Date.now(), listed });
  return url;
}
var h1Until = 0;
var cancelledOpen = () => ({ error: { status: 410, message: "the request was cancelled" }, h2Failed: false });
async function open(base, headers, signal) {
  if (signal?.aborted)
    return cancelledOpen();
  if (Date.now() >= h1Until) {
    const o = await openH2(base, headers, signal);
    if (signal?.aborted) {
      o.req?.close(http2.constants.NGHTTP2_CANCEL);
      o.session?.destroy();
      return cancelledOpen();
    }
    if (!o.h2Failed)
      return o;
    if (o.blocked)
      h1Until = Date.now() + H2.retryAfter;
  }
  if (signal?.aborted)
    return cancelledOpen();
  return openH1(headers, signal);
}
var H2 = {
  wait: 15000,
  retryAfter: 10 * 60000
};
var NET = ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "ECONNRESET", "ETIMEDOUT", "ECONNABORTED", "EPIPE"];
function h2Blocked(e) {
  if (e?.h2Timeout)
    return true;
  const code = String(e?.code ?? "");
  const text = `${code} ${e?.message ?? ""}`;
  if (NET.some((c) => text.includes(c)))
    return false;
  if (code === "ERR_HTTP2_STREAM_ERROR")
    return false;
  return code.startsWith("ERR_HTTP2") || /h2 is not supported|alpn|nghttp2|protocol error/i.test(text);
}
function openH2(base, headers, signal) {
  if (signal?.aborted)
    return Promise.resolve(cancelledOpen());
  return new Promise((resolve) => {
    const u = new URL(base);
    const session = http2.connect(u.origin);
    let done = false;
    const fail = (e, h2Failed = true) => {
      if (done)
        return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      session.destroy();
      resolve({ error: { status: h2Failed ? 502 : 410, message: e?.message ?? String(e) }, h2Failed, blocked: h2Failed && h2Blocked(e) });
    };
    const abort = () => fail(new Error("the request was cancelled"), false);
    const timer = setTimeout(() => fail(Object.assign(new Error(`no answer over HTTP/2 in ${H2.wait / 1000}s`), { h2Timeout: true })), H2.wait);
    session.on("error", fail);
    const req = session.request({
      ":method": "POST",
      ":path": u.pathname.replace(/\/+$/, "") + "/agent.v1.AgentService/Run",
      ...headers
    });
    req.on("error", fail);
    req.once("close", () => fail(Object.assign(new Error(`the HTTP/2 stream closed before its response (code ${req.rstCode ?? "?"})`), { code: "ERR_HTTP2_STREAM_ERROR" })));
    req.once("response", (h) => {
      if (done)
        return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      resolve({ session, req, status: Number(h[":status"]) });
    });
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted)
      abort();
  });
}
var H1 = { appendWait: 60000 };
function connectCode(status) {
  return { 400: "invalid_argument", 401: "unauthenticated", 403: "permission_denied", 429: "resource_exhausted" }[status] ?? "unavailable";
}
function openH1(headers, signal) {
  if (signal?.aborted)
    return Promise.resolve(cancelledOpen());
  const ac = new AbortController;
  const id = headers["x-request-id"];
  const h = { ...headers, "accept-encoding": "identity", "x-cursor-streaming": "true" };
  let ended = false;
  let seq = 0;
  let reader;
  const req = new Duplex({
    read() {},
    write(chunk, _enc, cb) {
      const msg = Buffer.from(chunk).subarray(5);
      const n = seq++;
      append(msg, n).then(() => cb(), (e) => cb(e));
    }
  });
  const cleanup = () => {
    signal?.removeEventListener("abort", close);
    ac.abort();
    reader?.cancel().catch(() => {});
  };
  const end = (body) => {
    if (ended || req.destroyed)
      return;
    ended = true;
    const f = frame(Buffer.from(body));
    f[0] = 2;
    req.push(f);
    req.push(null);
    cleanup();
  };
  const failed = async (res) => {
    const text = await res.text().catch(() => "");
    let e;
    try {
      e = JSON.parse(text);
    } catch {}
    end(JSON.stringify({ error: typeof e?.code === "string" ? e : { code: connectCode(res.status), message: text.trim() || `HTTP ${res.status}` } }));
  };
  const append = async (msg, n) => {
    if (ended || ac.signal.aborted)
      return;
    const body = pb().str(1, msg.toString("hex")).bytes(2, pb().str(1, id).done()).varint(3, n).done();
    const ms = H1.appendWait + Math.ceil(body.length / 65536) * 1000;
    const deadline = AbortSignal.timeout(ms);
    try {
      const res = await fetch(API + "/aiserver.v1.BidiService/BidiAppend", {
        method: "POST",
        headers: { ...h, "content-type": "application/proto", "connect-protocol-version": "1" },
        body,
        signal: AbortSignal.any([ac.signal, deadline])
      });
      if (ended || ac.signal.aborted) {
        await res.body?.cancel().catch(() => {});
        return;
      }
      if (!res.ok)
        return failed(res);
      await res.arrayBuffer();
    } catch (e) {
      if (ac.signal.aborted)
        return;
      if (deadline.aborted)
        return end(JSON.stringify({ error: { code: "deadline_exceeded", message: `BidiAppend got no answer in ${Math.round(ms / 1000)}s` } }));
      end(JSON.stringify({ error: { code: "unavailable", message: `BidiAppend: ${e?.message ?? e}` } }));
    }
  };
  const close = () => {
    ended = true;
    cleanup();
    req.destroy();
  };
  signal?.addEventListener("abort", close, { once: true });
  if (signal?.aborted) {
    close();
    return Promise.resolve(cancelledOpen());
  }
  (async () => {
    try {
      const res = await fetch(API + "/agent.v1.AgentService/RunSSE", {
        method: "POST",
        headers: { ...h, "content-type": "application/connect+proto", "connect-protocol-version": "1" },
        body: frame(pb().str(1, id).done()),
        signal: ac.signal
      });
      if (ended || ac.signal.aborted) {
        await res.body?.cancel().catch(() => {});
        return;
      }
      if (!res.ok)
        return failed(res);
      reader = res.body.getReader();
      try {
        while (!ended && !req.destroyed) {
          const { value, done } = await reader.read();
          if (done)
            break;
          if (!ended && !req.destroyed)
            req.push(Buffer.from(value));
        }
      } finally {
        reader.releaseLock();
        reader = undefined;
      }
      if (!ended && !req.destroyed) {
        ended = true;
        req.push(null);
        cleanup();
      }
    } catch (e) {
      if (!ac.signal.aborted)
        end(JSON.stringify({ error: { code: "unavailable", message: `RunSSE: ${e?.message ?? e}` } }));
    }
  })();
  return Promise.resolve(signal?.aborted ? cancelledOpen() : { session: { close, destroy: close }, req: Object.assign(req, { close }), status: 200, h1: true });
}
function nativeTransport(req, close, fail, limits = NATIVE_LIMITS) {
  const outbound = { bytes: 0, messages: 0 };
  const queue = [];
  let closed = false, flushing = false, rejectWrite;
  const waiters = new Set;
  const spare = (n) => Math.floor(n / 8);
  const fits = (size) => outbound.messages === 0 || outbound.messages + 1 + spare(limits.outboundMessages) <= limits.outboundMessages && outbound.bytes + size + spare(limits.outboundBytes) <= limits.outboundBytes;
  const wake = () => {
    for (const w of waiters)
      if (closed || fits(w.size))
        w.done();
  };
  const flush = async () => {
    if (closed || flushing)
      return;
    flushing = true;
    try {
      while (!closed && queue.length) {
        const packet = queue.shift();
        await new Promise((resolve, reject) => {
          let written = false, drained = false, started = false, settled = false;
          const finish = (error) => {
            if (settled)
              return;
            settled = true;
            rejectWrite = undefined;
            req.removeListener("drain", drain);
            req.removeListener("error", failed);
            req.removeListener("close", lost);
            error ? reject(error) : resolve();
          };
          const check = () => {
            if (started && written && drained)
              finish();
          };
          const drain = () => {
            drained = true;
            check();
          };
          const failed = (e) => finish(e);
          const lost = () => finish(new NativeSessionError(502, "native transport closed during a write; its outcome is uncertain"));
          rejectWrite = finish;
          req.once("drain", drain);
          req.once("error", failed);
          req.once("close", lost);
          try {
            drained = req.write(packet, (e) => {
              if (e)
                return finish(e);
              written = true;
              check();
            }) || drained;
            started = true;
            if (drained)
              req.removeListener("drain", drain);
            check();
          } catch (e) {
            finish(e);
          }
        });
        if (!closed) {
          outbound.bytes -= packet.length;
          outbound.messages--;
          wake();
        }
      }
    } catch (e) {
      if (!closed)
        fail(e);
    } finally {
      flushing = false;
    }
  };
  return {
    outbound,
    send(message) {
      if (closed || req.destroyed || !req.writable)
        throw new NativeSessionError(502, "native transport is no longer writable");
      const size = message.length + 5;
      if (outbound.bytes + size > limits.outboundBytes)
        throw new NativeSessionError(503, "native outbound bytes limit reached");
      if (outbound.messages + 1 > limits.outboundMessages)
        throw new NativeSessionError(503, "native outbound messages limit reached");
      outbound.bytes += size;
      outbound.messages++;
      queue.push(frame(message));
      flush();
    },
    room(size) {
      if (closed || fits(size))
        return Promise.resolve();
      return new Promise((resolve, reject) => {
        const w = {
          size,
          done() {
            waiters.delete(w);
            clearTimeout(w.timer);
            resolve();
          }
        };
        w.timer = setTimeout(() => {
          waiters.delete(w);
          const which = outbound.bytes + size + spare(limits.outboundBytes) > limits.outboundBytes ? "bytes" : "messages";
          reject(new NativeSessionError(503, `native outbound ${which} limit reached: the queue did not drain for ${Math.round(limits.writeWait / 1000)}s`));
        }, limits.writeWait);
        w.timer.unref?.();
        waiters.add(w);
      });
    },
    close() {
      if (closed)
        return;
      closed = true;
      queue.length = 0;
      outbound.bytes = 0;
      outbound.messages = 0;
      wake();
      rejectWrite?.(new NativeSessionError(410, "native transport was cancelled"));
      close();
    }
  };
}
async function runNative({ tok, base, id, tools, conv, convID, signal, maxMode, params, native }) {
  const cid = convID || randomUUID();
  const since = Date.now();
  const accounting = new AbortController;
  const book = ledger(tok, cid, since, accounting.signal, !!convID, { before: since });
  const debtKey = usageKey(tok, cid);
  let started = false, settled = false, deferred = null;
  native.accounting = {
    started() {
      started = true;
    },
    async settle() {
      const more = await book.owed(true);
      if (settled) {
        if (more)
          owe(debtKey, { carry: more });
        return null;
      }
      deferred = more;
      return more;
    },
    delivered() {
      if (settled)
        return;
      settled = true;
      deferred = null;
      book.done();
      accounting.abort();
    },
    abandon() {
      if (settled)
        return;
      settled = true;
      book.done();
      accounting.abort();
      if (deferred)
        owe(debtKey, { carry: deferred });
      deferred = null;
      if (started && native.segments > 0 && !native.finalUsage && convID && canRead(tok)) {
        owe(debtKey, { since, n: 1, ready: Date.now() + STEP_WAIT.owedAt });
      }
    }
  };
  const { first, blobs } = buildRun(conv.msgs, conv.last, tools, id, cid, { maxMode, params });
  native.chatTools = tools;
  native.attach(signal);
  if (native.error) {
    nativeSessions.forget(native);
    return { error: native.error };
  }
  const o = await open(base, {
    "content-type": "application/connect+proto",
    "connect-protocol-version": "1",
    authorization: `Bearer ${tok}`,
    "x-cursor-client-version": await clientVersion(),
    "x-cursor-client-type": "cli",
    "x-ghost-mode": "true",
    "x-request-id": randomUUID(),
    "x-cursor-agent-allowed-tools": "mcp_tool_call,get_mcp_tools_tool_call"
  }, native.ac.signal);
  if (o.error) {
    native.fail(o.error);
    nativeSessions.forget(native);
    return o;
  }
  const { session, req } = o;
  const close = () => {
    try {
      req.close(http2.constants.NGHTTP2_CANCEL);
    } catch {}
    session.close();
    session.destroy();
  };
  const transport = nativeTransport(req, close, (e) => native.fail({ status: e.status ?? 502, message: e.message }), native.limits);
  try {
    native.bind(transport, blobs, conv.estimate);
    if (native.error) {
      nativeSessions.forget(native);
      return { error: native.error };
    }
    native.send(first);
    native.accounting.started();
    if (o.status < 200 || o.status > 299) {
      const chunks = [];
      for await (const c of req)
        chunks.push(c);
      native.fail(failure(o.status, Buffer.concat(chunks).toString("utf8").slice(0, 1 << 20)));
      nativeSessions.forget(native);
      return { error: native.error, h1: !!o.h1 };
    }
    native.pumpTask = (async () => {
      await native.pump(frames(req));
    })();
    const response = native.response();
    const it = response.events;
    const head = await it.next();
    if (head.done || head.value.error) {
      const error = head.value?.error ?? { status: 502, message: "an empty reply" };
      await native.cancel(error.message);
      nativeSessions.forget(native);
      return { error, h1: !!o.h1 };
    }
    let firstEvent = head;
    response.events = {
      next() {
        if (firstEvent) {
          const r = firstEvent;
          firstEvent = null;
          return Promise.resolve(r);
        }
        return it.next();
      },
      return: () => it.return(),
      [Symbol.asyncIterator]() {
        return this;
      }
    };
    return response;
  } catch (e) {
    native.fail({ status: e.status ?? 502, message: e.message });
    await native.pumpTask;
    nativeSessions.forget(native);
    return { error: native.error, h1: !!o.h1 };
  }
}
async function runOnce({ tok, base, id, tools, conv, convID, signal, maxMode, params }) {
  const cid = convID || randomUUID();
  const since = Date.now();
  const book = ledger(tok, cid, since, signal, !!convID);
  const { first, blobs } = buildRun(conv.msgs, conv.last, tools, id, cid, { maxMode, params });
  const o = await open(base, {
    "content-type": "application/connect+proto",
    "connect-protocol-version": "1",
    authorization: `Bearer ${tok}`,
    "x-cursor-client-version": await clientVersion(),
    "x-cursor-client-type": "cli",
    "x-ghost-mode": "true",
    "x-request-id": randomUUID(),
    "x-cursor-agent-allowed-tools": "mcp_tool_call,get_mcp_tools_tool_call"
  }, signal);
  if (o.error)
    return book.done(), o;
  const { session, req } = o;
  let closed = false;
  let heartbeat;
  const send = (msg) => {
    if (!closed && !req.destroyed && req.writable)
      req.write(frame(msg));
  };
  const close = () => {
    if (closed)
      return;
    closed = true;
    clearInterval(heartbeat);
    signal?.removeEventListener("abort", close);
    try {
      req.close(http2.constants.NGHTTP2_CANCEL);
    } catch {}
    session.close();
    setTimeout(() => session.destroy(), 1000).unref?.();
  };
  signal?.addEventListener("abort", close, { once: true });
  if (signal?.aborted) {
    close();
    book.done();
    return cancelledOpen();
  }
  heartbeat = setInterval(() => send(pb().bytes(7, EMPTY).done()), 5000);
  send(first);
  if (o.status < 200 || o.status > 299) {
    const chunks = [];
    try {
      for await (const c of req)
        chunks.push(c);
    } catch {}
    close();
    book.done();
    return { error: failure(o.status, Buffer.concat(chunks).toString("utf8").slice(0, 1 << 20)) };
  }
  const it = decode(frames(req), {
    send,
    blobs,
    tools,
    estimate: conv.estimate,
    close,
    stepUsage: book.own,
    owedUsage: book.owed
  });
  const wrapped = async function* () {
    try {
      yield* it;
    } finally {
      close();
      book.done();
    }
  }();
  const head = await wrapped.next();
  if (head.done)
    return book.done(), { error: { status: 502, message: "an empty reply" } };
  if (head.value.error) {
    await wrapped.return();
    return { error: head.value.error, h1: !!o.h1 };
  }
  return {
    events: async function* () {
      yield head.value;
      yield* wrapped;
    }()
  };
}
async function* decode(stream, { send, blobs, tools, estimate, close, stepUsage, owedUsage }) {
  let calls = 0;
  let answered = 0;
  let ended = false;
  let listed = 0;
  const stepDone = () => {
    if (!listed || calls + answered < listed)
      return false;
    if (calls > 0)
      return true;
    listed = 0;
    answered = 0;
    return false;
  };
  let said = 0;
  let wrote = 0;
  const seen = { thinking: 0, refused: new Map, updates: new Map, messages: new Map };
  const count = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  const empty = (how) => ({ error: { status: 502, message: "an empty reply" + emptyWhy(how, seen, ended ? usage2 : null) } });
  let usage2 = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 };
  let counted = false;
  const finish = (more) => {
    if (!counted && !usage2.output)
      usage2.output = Math.floor((said + 3) / 4);
    if (!counted && !usage2.input && !usage2.cacheRead && !usage2.cacheWrite)
      usage2.input = estimate;
    const prompt = usage2.input + usage2.cacheRead + usage2.cacheWrite;
    const deferred = more && more.input + more.output + more.cacheRead + more.cacheWrite > 0;
    return {
      stop: calls > 0 ? "tool_calls" : "stop",
      usage: {
        prompt_tokens: prompt,
        completion_tokens: usage2.output,
        total_tokens: prompt + usage2.output,
        prompt_tokens_details: { cached_tokens: usage2.cacheRead, cache_write_tokens: usage2.cacheWrite },
        ...usage2.reasoning ? { completion_tokens_details: { reasoning_tokens: usage2.reasoning } } : {},
        ...deferred ? {
          magpie_deferred: {
            prompt_tokens: more.input + more.cacheRead + more.cacheWrite,
            completion_tokens: more.output,
            cached_tokens: more.cacheRead,
            cache_write_tokens: more.cacheWrite
          }
        } : {}
      }
    };
  };
  const settled = async () => {
    if (calls > 0 && !ended && stepUsage) {
      close?.();
      const u = await stepUsage().catch(() => null);
      if (u)
        usage2 = u;
      counted = u === false || !!u;
    }
    return finish(owedUsage ? await owedUsage(calls === 0).catch(() => null) : null);
  };
  const closeExec = (id) => send(pb().bytes(5, pb().bytes(1, pb().varint(1, id))).done());
  try {
    for await (const f of stream) {
      if (f.end) {
        const e = failure(200, f.data);
        if (e.status < 200 || e.status > 299)
          yield { error: e };
        else if (wrote === 0 && calls === 0)
          yield empty(endFrame(f.data));
        else
          yield await settled();
        return;
      }
      for (const m of fields(f.data)) {
        switch (m.num) {
          case 1:
            for (const u of fields(m.data)) {
              const uf = fields(u.data);
              switch (u.num) {
                case 1: {
                  const t = pbStr(uf, 1);
                  if (t) {
                    said += t.length;
                    wrote += t.length;
                    yield { text: t };
                  }
                  break;
                }
                case 4: {
                  const t = pbStr(uf, 1);
                  if (t) {
                    said += t.length;
                    seen.thinking += t.length;
                    yield { reasoning: t };
                  }
                  break;
                }
                case 14:
                  usage2 = usageOf(uf);
                  ended = true;
                  if (calls === 0) {
                    yield wrote === 0 ? empty("Cursor ended the turn") : await settled();
                    return;
                  }
                  break;
                case 27:
                  listed = pbNum(uf, 1);
                  if (stepDone()) {
                    yield await settled();
                    return;
                  }
                  break;
                default:
                  count(seen.updates, u.num);
              }
            }
            break;
          case 2: {
            const call = exec(m.data, tools, send, closeExec, seen.refused);
            if (call) {
              said += call.args.length;
              yield { tool: { index: calls++, ...call } };
            } else if (!fields(m.data).some((e) => e.num === 10))
              answered++;
            if (stepDone()) {
              yield await settled();
              return;
            }
            break;
          }
          case 4: {
            const kv = fields(m.data);
            const id = pbNum(kv, 1);
            for (const k of kv) {
              if (k.num === 2) {
                const want = field2(fields(k.data), 1)?.data.toString("hex") ?? "";
                const b = blobs.get(want);
                const res = b ? pb().bytes(1, b) : pb().bytes(2, pb().str(1, "blob not found"));
                send(pb().bytes(3, pb().varint(1, id).bytes(2, res)).done());
              } else if (k.num === 3) {
                send(pb().bytes(3, pb().varint(1, id).bytes(3, EMPTY)).done());
              }
            }
            break;
          }
          default:
            count(seen.messages, m.num);
        }
      }
    }
    if (calls > 0) {
      yield await settled();
      return;
    }
    yield { error: { status: 502, message: "the reply broke off: EOF" } };
  } catch (e) {
    if (calls > 0 && /EOF/.test(e?.message ?? "")) {
      yield await settled();
      return;
    }
    yield { error: { status: 502, message: "the reply broke off: " + (e?.message ?? e) } };
  }
}
function endFrame(data) {
  const t = Buffer.from(data ?? []).toString("utf8").trim();
  if (!t || t === "{}")
    return "the Run's stream ended (an empty end frame)";
  return `the Run's stream ended (end frame: ${t.length > 300 ? t.slice(0, 300) + "…" : t})`;
}
function emptyWhy(how, seen, usage2) {
  const list = (m) => [...m].map(([k, n]) => n > 1 ? `#${k} ×${n}` : `#${k}`).join(", ");
  const parts = [how];
  parts.push(seen.thinking ? `after ${seen.thinking} chars of thinking, no text and no tool call` : "with no thinking, no text and no tool call");
  if (usage2)
    parts.push(`Cursor counted ${usage2.output} output tokens`);
  if (seen.refused.size)
    parts.push(`Cursor's own tools asked for and refused: ${list(seen.refused)}`);
  if (seen.updates.size)
    parts.push(`updates not read: ${list(seen.updates)}`);
  if (seen.messages.size)
    parts.push(`messages not read: ${list(seen.messages)}`);
  return ` (${parts.join("; ")}; try again)`;
}
function exec(msg, tools, send, closeExec, refused, native = false) {
  const es = native ? nativeFields(msg) : fields(msg);
  if (native && es.some((e) => e.num === 1 && (e.wire !== 0 || !Number.isInteger(e.n) || e.n < 0 || e.n > 4294967295)))
    throw new NativeSessionError(502, "invalid native exec request ID");
  const id = pbNum(es, 1);
  const execID = pbStr(es, 15);
  let nativeCall, nativeUnavailable = false;
  if (native) {
    for (const e of es)
      if (e.num === 11) {
        if (e.wire !== 2)
          throw new NativeSessionError(502, "invalid native MCP argument envelope");
        const { fields: a, args } = nativeMcpArgs(e.data);
        const name = pbStr(a, 5) || pbStr(a, 1).replace(/^magpie-/, "");
        const provider = pbStr(a, 4);
        const server = pbStr(a, 9);
        if (provider && provider !== "magpie" || server && server !== "magpie")
          nativeUnavailable = true;
        if (pbNum(a, 7) || field2(a, 6))
          nativeUnavailable = true;
        if (!tools.some((t) => t.name === name))
          nativeUnavailable = true;
        if (!pbStr(a, 5) && pbStr(a, 1) !== "magpie-" + name)
          nativeUnavailable = true;
        const call = { requestID: id, execID, nativeID: pbStr(a, 3), name, args };
        if (nativeCall && !isDeepStrictEqual(nativeCall, call))
          throw new NativeSessionError(502, "ambiguous repeated native MCP argument envelopes");
        nativeCall ??= call;
      }
  }
  const answer = (num2, res) => {
    send(pb().bytes(2, pb().varint(1, id).str(15, execID).bytes(num2, res)).done());
    closeExec(id);
  };
  const unavailable = () => {
    const kind = es.find((e) => ![1, 15, 19, 55].includes(e.num))?.num ?? 0;
    refused?.set(kind, (refused.get(kind) ?? 0) + 1);
    send(pb().bytes(5, pb().bytes(2, pb().varint(1, id).str(2, "not available"))).done());
    closeExec(id);
    return null;
  };
  if (nativeUnavailable)
    return unavailable();
  for (const e of es) {
    switch (e.num) {
      case 11: {
        if (native)
          return { ...nativeCall, args: JSON.stringify(nativeCall.args) };
        const a = fields(e.data);
        const args = {};
        for (const kv of a) {
          if (kv.num !== 2)
            continue;
          const ef = fields(kv.data);
          const v = field2(ef, 2);
          args[pbStr(ef, 1)] = v ? pbAny(v.data) : null;
        }
        const name = pbStr(a, 5) || pbStr(a, 1).replace(/^magpie-/, "");
        const cid = pbStr(a, 3).replaceAll(`
`, "__") || "call_" + randomBytes2(12).toString("hex");
        return { id: cid, name, args: JSON.stringify(args) };
      }
      case 36: {
        const srv = pb().str(1, "magpie").str(2, "magpie").str(7, "connected");
        for (const t of tools)
          srv.bytes(5, toolDef(t));
        answer(36, pb().bytes(1, pb().bytes(1, srv)));
        return null;
      }
      case 10:
        answer(10, pb().bytes(1, pb().bytes(1, pb().bytes(4, env2()))));
        return null;
    }
  }
  return unavailable();
}
var errorResponse = ({ status, message }) => new Response(JSON.stringify({ error: { message, type: "cursor_error", code: status } }), {
  status,
  headers: { "Content-Type": "application/json", "X-Magpie-Sign-In": "kept" }
});
function kept(res) {
  if (res.headers.has("X-Magpie-Sign-In"))
    return res;
  const headers = new Headers(res.headers);
  headers.set("X-Magpie-Sign-In", "kept");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
var answer = async (auth, chat, signal, session) => kept(await answerOf(auth, chat, signal, session));
var maxOnly = new Set;
var maxRequired = (msg) => /max[ _]mode[ _]required|requires max mode/i.test(String(msg ?? ""));
async function answerOf(auth, chat, signal, session = "") {
  let tok;
  try {
    tok = await tokenOf(auth);
  } catch (e) {
    return errorResponse({ status: e.status ?? 401, message: e.message });
  }
  if (signal?.aborted)
    return errorResponse({ status: 410, message: "the request was cancelled" });
  const tools = toolsOf(chat);
  const convID = conversationID(chat, session);
  const prepared = nativeSessions.prepare(tok, chat, convID, tools);
  let r;
  if (prepared.owner)
    r = prepared.owner.resume({ ...prepared, estimate: conversation(chat, tools).estimate }, signal);
  const model = String(chat.model ?? "");
  if (!r) {
    let raw = [];
    try {
      raw = await usable(tok);
    } catch {}
    const tier = chat.service_tier;
    const fast = tier === "priority" || tier === "fast" ? true : tier ? false : undefined;
    const req = request(raw, model, chat.reasoning_effort ?? "", fast);
    const id = req.id;
    const params = req.params;
    let maxMode = req.maxMode || maxOnly.has(id);
    const conv = conversation(chat, tools);
    let base = await agentURL(tok, false);
    const once = async () => {
      const native = prepared.fallback ? null : nativeSessions.create(prepared, { id, maxMode, params }, { pb, exec, usageOf, failure });
      const args = { tok, base, id, tools, conv, convID, signal, maxMode, params };
      let response = native ? await runNative({ ...args, native }) : await runOnce(args);
      const rebuild = async () => {
        const fallback = await runOnce(args);
        fallback.diagnostic = "stateless; bootstrap=imported-history; reason=" + (response.error?.continuityReason || "missing-batch-count");
        return fallback;
      };
      if (response.error?.retentionIneligible && !signal?.aborted)
        response = await rebuild();
      else if (native)
        response.rebuild = rebuild;
      response.diagnostic ??= "stateless; bootstrap=imported-history; reason=" + (prepared.fallback || "retention capacity or reservation unavailable");
      return response;
    };
    r = await once();
    if (r.error && regional(r.error.message)) {
      const viaH1 = !!r.h1;
      h1Until = 0;
      const fresh = await agentURL(tok, true);
      if (fresh !== base || viaH1) {
        base = fresh;
        r = await once();
      }
    }
    if (r.error && !maxMode && maxRequired(r.error.message)) {
      maxMode = true;
      maxOnly.add(id);
      r = await once();
    }
  }
  if (r.error)
    return errorResponse(r.error);
  const it = r.events;
  let head = await it.next();
  if (head.value?.error)
    return errorResponse(head.value.error);
  let events = {
    next() {
      if (head) {
        const value = head;
        head = null;
        return Promise.resolve(value);
      }
      return it.next();
    },
    return: () => it.return?.(),
    [Symbol.asyncIterator]() {
      return this;
    }
  };
  const responseHeaders = { "X-Magpie-Cursor-Continuity": r.diagnostic };
  const cid = "chatcmpl-" + randomBytes2(12).toString("hex");
  const created = Math.floor(Date.now() / 1000);
  if (!chat.stream) {
    while (true) {
      let retry = false;
      const msg = { role: "assistant", content: "" };
      let reasoning = "";
      const calls = [];
      let stop = "stop";
      let usage2;
      for await (const e of events) {
        if (e.error) {
          if (!e.error.retentionIneligible || !r.rebuild || signal?.aborted)
            return errorResponse(e.error);
          const reason = e.error.continuityReason;
          r = await r.rebuild();
          if (r.error)
            return errorResponse(r.error);
          if (reason)
            r.diagnostic = "stateless; bootstrap=imported-history; reason=" + reason;
          events = r.events;
          responseHeaders["X-Magpie-Cursor-Continuity"] = r.diagnostic;
          retry = true;
          break;
        }
        if (e.text)
          msg.content += e.text;
        if (e.reasoning)
          reasoning += e.reasoning;
        if (e.tool)
          calls.push({ id: e.tool.id, type: "function", function: { name: e.tool.name, arguments: e.tool.args } });
        if (e.stop)
          [stop, usage2] = [e.stop, e.usage];
      }
      if (retry)
        continue;
      if (reasoning)
        msg.reasoning_content = reasoning;
      if (calls.length)
        msg.tool_calls = calls;
      r.delivered?.();
      return Response.json({ id: cid, object: "chat.completion", created, model, choices: [{ index: 0, message: msg, finish_reason: stop }], ...usage2 ? { usage: usage2 } : {} }, { headers: responseHeaders });
    }
  }
  const chunk = (delta, finish_reason = null, extra = {}) => enc.encode(`data: ${JSON.stringify({ id: cid, object: "chat.completion.chunk", created, model, choices: [{ index: 0, delta, finish_reason }], ...extra })}

`);
  let began = false;
  const stream = new ReadableStream({
    async pull(ctl) {
      const next = await events.next();
      if (!began) {
        began = true;
        ctl.enqueue(chunk({ role: "assistant", content: "" }));
      }
      if (next.done) {
        r.delivered?.();
        ctl.enqueue(enc.encode(`data: [DONE]

`));
        return ctl.close();
      }
      const e = next.value;
      if (e.text)
        ctl.enqueue(chunk({ content: e.text }));
      else if (e.reasoning)
        ctl.enqueue(chunk({ reasoning_content: e.reasoning }));
      else if (e.tool)
        ctl.enqueue(chunk({ tool_calls: [{ index: e.tool.index, id: e.tool.id, type: "function", function: { name: e.tool.name, arguments: e.tool.args } }] }));
      else if (e.stop)
        ctl.enqueue(chunk({}, e.stop, e.usage ? { usage: e.usage } : {}));
      else if (e.error) {
        ctl.enqueue(enc.encode(`data: ${JSON.stringify({ error: { message: e.error.message, code: e.error.status } })}

`));
        ctl.close();
      }
    },
    async cancel() {
      await r.cancel?.();
      await events.return();
    }
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", ...responseHeaders } });
}
async function CursorAuthPlugin() {
  return {
    auth: {
      provider: ID,
      async loader(getAuth) {
        const auth = await getAuth();
        if (!auth || auth.type !== "oauth" && auth.type !== "api")
          return {};
        return {
          baseURL: AGENT,
          apiKey: "cursor",
          async fetch(input, init = {}) {
            const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
            if (!/\/chat\/completions$/.test(new URL(url).pathname))
              return errorResponse({ status: 404, message: "only chat completions are served" });
            let chat;
            try {
              const b = init.body ?? (input instanceof Request ? await input.clone().text() : undefined);
              chat = JSON.parse(typeof b === "string" ? b : new TextDecoder().decode(b));
            } catch {
              return errorResponse({ status: 400, message: "a request that isn't JSON" });
            }
            const session = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined)).get(SESSION) ?? "";
            return answer(await getAuth() ?? auth, chat, init.signal ?? (input instanceof Request ? input.signal : undefined), session);
          }
        };
      },
      methods: [
        { type: "oauth", label: "Cursor (browser)", authorize: browserSignIn },
        { type: "oauth", label: "cursor-agent's sign-in", authorize: cliSignIn },
        { type: "api", label: "Cursor API key (cursor.com/dashboard → Integrations)" }
      ],
      async usage(getAuth, provider) {
        let tok;
        try {
          tok = await tokenOf(await getAuth());
        } catch (e) {
          return { error: e.message, windows: [], signIn: "kept" };
        }
        const [u, plan, bot] = await Promise.all([usage(tok, Object.keys(provider?.models ?? {})), planOf(tok), botUsage(tok)]);
        const last = (w) => w.name === "Total" || w.name === "On-demand" && w.aside;
        const windows = [...u.windows.filter((w) => !last(w)), ...bot, ...u.windows.filter(last)];
        return { ...u, windows, ...plan ? { plan } : {}, signIn: "kept" };
      }
    },
    async "chat.headers"(input, output) {
      if (input?.model?.providerID !== ID && input?.provider?.info?.id !== ID)
        return;
      const s = sessionOf(input);
      if (s)
        output.headers[SESSION] = s;
    },
    async config(config) {
      config.provider ??= {};
      const was = config.provider[ID] ?? {};
      config.provider[ID] = {
        name: "Cursor",
        npm: CHAT,
        api: AGENT,
        ...was,
        models: {
          auto: { name: "Auto", limit: { context: DEFAULT_CONTEXT, output: 0 }, attachment: true, tool_call: true },
          ...was.models ?? {}
        }
      };
    },
    provider: {
      id: ID,
      async models(provider, { auth } = {}) {
        if (!auth)
          return provider.models;
        const tok = await tokenOf(auth);
        return Object.fromEntries((await usable(tok)).map((m) => [m.id, runtimeModel(m)]));
      }
    }
  };
}

// node_modules/@magpie-community/opencode-workbuddy-auth/index.mjs
import { createHash as createHash4, randomBytes as randomBytes3 } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { join as join5 } from "node:path";
var APP_VERSION = "2.0.0";
var UA_VERSION = "5.5.6";
var POLL_MS = 1000;
var SIGN_IN_MS = 5 * 60 * 1000;
var EARLY_MS = 60 * 1000;
var LEAD_MS = 5 * 60 * 1000;
var KEEP_RENEWED_MS = 60 * 1000;
var CN_MODELS = [
  ["auto", "Auto", 168000],
  ["hy4-preview-f", "Hy4 preview", 1e6, ["high"]],
  ["hy3", "Hy3", 192000, ["low", "high"]],
  ["hy3-x", "Hy3-X", 192000, ["low", "high"]],
  ["deepseek-v4.1-flash", "Deepseek-V4.1-Flash", 1e6],
  ["glm-5.3", "GLM-5.3", 1e6, ["low", "high", "max"]],
  ["glm-5.3-flash", "GLM-5.3-Flash", 1e6, ["low", "high", "max"]],
  ["glm-5.2", "GLM-5.2", 1e6, ["high", "xhigh"]],
  ["glm-5.1", "GLM-5.1", 200000],
  ["glm-5v-turbo", "GLM-5v-Turbo", 200000],
  ["minimax-m3", "MiniMax-M3", 512000],
  ["kimi-k3-1", "Kimi-K3", 1e6, ["low", "high", "xhigh"]],
  ["kimi-k2.7", "Kimi-K2.7-Code", 256000],
  ["kimi-k2.6", "Kimi-K2.6", 256000],
  ["deepseek-v4-pro", "Deepseek-V4-Pro", 1e6, ["none", "high", "xhigh"]]
];
var AI_MODELS = [
  ["default-model", "Default", 176000],
  ["fast-model", "Fast", 200000],
  ["balanced-model", "Balanced", 256000],
  ["primary-model", "Primary", 272000],
  ["deep-model", "Deep", 176000],
  ["gpt-5.5", "GPT-5.5", 1e6],
  ["gpt-5.4", "GPT-5.4", 272000],
  ["gpt-5.3-codex", "GPT-5.3-Codex", 272000],
  ["gemini-3.1-pro", "Gemini-3.1-Pro", 400000],
  ["gemini-3.5-flash", "Gemini-3.5-Flash", 1e6],
  ["glm-5.3", "GLM-5.3", 1e6, ["low", "high", "max"]],
  ["glm-5.2", "GLM-5.2", 1e6, ["high", "xhigh"]],
  ["hy3", "Hy3", 192000, ["low", "high"]],
  ["kimi-k3", "Kimi-K3", 1e6],
  ["kimi-k2.6", "Kimi-K2.6", 256000],
  ["minimax-m3", "MiniMax-M3", 512000]
];
var SITES = {
  workbuddy: {
    id: "workbuddy",
    name: "WorkBuddy",
    endpoint: "https://copilot.tencent.com",
    authID: "workbuddy-desktop",
    platform: "workbuddy",
    ai: false,
    models: CN_MODELS
  },
  "workbuddy-ai": {
    id: "workbuddy-ai",
    name: "WorkBuddy AI",
    endpoint: "https://www.workbuddy.ai",
    authID: "workbuddy-desktop-ai",
    platform: "workbuddy-ai",
    ai: true,
    models: AI_MODELS,
    noImages: /^glm-/
  }
};
function textOnly(site, model) {
  return !!site.noImages?.test(model);
}
var NPM = "@ai-sdk/openai-compatible";
var hex = () => randomBytes3(16).toString("hex");
var sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
var api = (site) => site.endpoint + "/v2";

class WBError extends Error {
  constructor(message, code, status, said) {
    super(message);
    this.code = code;
    this.status = status;
    this.said = said;
  }
}
async function call(site, method, path, headers = {}, body) {
  const res = await fetch(site.endpoint + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "WorkBuddy/" + UA_VERSION,
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  const text = await res.text();
  let env3 = {};
  try {
    env3 = JSON.parse(text);
  } catch {}
  const code = Number.parseInt(env3.code, 10) || 0;
  if (!res.ok) {
    const why = env3.msg || env3.message || env3.error?.message || text.slice(0, 200) || res.statusText;
    const said = code ? env3.msg || `error ${code}` : env3.msg || statusText2(res.status);
    throw new WBError(`${site.name}: ${why} (HTTP ${res.status}${env3.code ? ", code " + env3.code : ""})`, env3.code, res.status, said);
  }
  if (env3.code)
    throw new WBError(`${site.name}: ${env3.msg || "error"} (${env3.code})`, env3.code, res.status, env3.msg || `error ${code}`);
  return env3.data;
}
function domainOf(site, a) {
  return a.domain || new URL(api(site)).host;
}
function merge(a, got) {
  const now = Date.now();
  const out = { ...a, access: got.accessToken };
  if (got.refreshToken)
    out.refresh = got.refreshToken;
  if (got.domain)
    out.domain = got.domain;
  if (got.tokenType)
    out.tokenType = got.tokenType;
  if (got.expiresAt > 0)
    out.expires = got.expiresAt;
  else if (got.expiresIn > 0)
    out.expires = now + got.expiresIn * 1000;
  if (got.refreshExpiresAt > 0)
    out.refreshExpiresAt = got.refreshExpiresAt;
  else if (got.refreshExpiresIn > 0)
    out.refreshExpiresAt = now + got.refreshExpiresIn * 1000;
  return out;
}
function stale(a) {
  return !!a.expires && Date.now() >= a.expires - EARLY_MS;
}
var renewing = new Map;
var renewed = new Map;
function refreshable(a) {
  return !!a.refresh && !(a.refreshExpiresAt && Date.now() >= a.refreshExpiresAt);
}
function renew(site, a, save) {
  const key = site.id + `
` + a.refresh;
  const done = renewed.get(key);
  if (done && Date.now() - done.at < KEEP_RENEWED_MS)
    return Promise.resolve(merged(a, done.next));
  let r = renewing.get(key);
  if (!r) {
    r = (async () => {
      const got = await call(site, "POST", "/v2/plugin/auth/token/refresh", {
        "X-Refresh-Token": a.refresh,
        "X-Auth-Refresh-Source": "plugin",
        "X-Domain": domainOf(site, a),
        ...enterpriseHeaders(a)
      }, {});
      if (!got?.accessToken)
        throw Object.assign(new Error("WorkBuddy gave no refreshed token"), { bare: true });
      const next = merge(a, got);
      renewed.set(key, { next, at: Date.now() });
      await save?.(next);
      return next;
    })().finally(() => renewing.delete(key));
    renewing.set(key, r);
  }
  return r.then((next) => merged(a, next));
}
function merged(a, next) {
  const out = { ...a };
  for (const k of TOKEN_FIELDS)
    if (k in next)
      out[k] = next[k];
  return out;
}
var TOKEN_FIELDS = ["access", "refresh", "expires", "refreshExpiresAt", "domain", "tokenType"];
async function fresh(site, client, a) {
  if (!stale(a))
    return a;
  if (!refreshable(a)) {
    if (a.access)
      return a;
    throw new Error("this WorkBuddy account is signed out; sign in again");
  }
  try {
    return await renew(site, a, async (next) => {
      try {
        await client?.auth?.set?.({ path: { id: site.id }, body: next });
      } catch {}
    });
  } catch (e) {
    if (a.access)
      return a;
    if (e?.bare)
      throw e;
    throw new Error(`WorkBuddy token refresh: ${e?.said ?? e?.message ?? e}`);
  }
}
async function refreshed(site, auth) {
  if (auth?.type !== "oauth" || auth.source === "desktop" || !auth.access || !auth.refresh)
    return;
  if (!refreshable(auth))
    throw new Error("this WorkBuddy account is signed out; sign in again");
  let next;
  try {
    next = await renew(site, auth);
  } catch (e) {
    if (e?.bare)
      throw e;
    throw new Error(`WorkBuddy token refresh: ${e?.said ?? e?.message ?? e}`);
  }
  const out = {};
  for (const k of TOKEN_FIELDS)
    if (k in next && next[k] !== auth[k])
      out[k] = next[k];
  return Object.keys(out).length ? out : undefined;
}
function sign(site, a, headers) {
  headers.set("Authorization", "Bearer " + a.access);
  headers.set("X-User-Id", a.uid ?? "");
  headers.set("X-Domain", domainOf(site, a));
  headers.set("X-Product", "SaaS");
  headers.set("X-IDE-Type", "WorkBuddy");
  headers.set("User-Agent", "WorkBuddy/" + UA_VERSION);
  headers.set("X-Requested-With", "XMLHttpRequest");
  headers.set("X-Agent-Intent", "craft");
  headers.set("X-Agent-Purpose", "conversation");
  headers.set("X-IDE-Name", "WorkBuddy");
  headers.set("X-IDE-Version", UA_VERSION);
  for (const [k, v] of Object.entries(enterpriseHeaders(a)))
    headers.set(k, v);
  if (!site.ai)
    return;
  headers.set("X-Agent-Type", "main");
}
function enterpriseHeaders(a) {
  const id = typeof a?.enterpriseId === "string" ? a.enterpriseId.trim() : "";
  return id ? { "X-Enterprise-Id": id, "X-Tenant-Id": id } : {};
}
async function enterpriseOf(site, a, who) {
  const own = typeof who?.enterpriseId === "string" ? who.enterpriseId.trim() : "";
  if (own)
    return own;
  const type = String(who?.type ?? "").trim().toLowerCase();
  if (!type || type === "personal")
    return "";
  let list;
  try {
    list = await call(site, "GET", "/v2/plugin/accounts", {
      Authorization: "Bearer " + a.access,
      "X-Domain": domainOf(site, a)
    });
  } catch {
    return "";
  }
  const mine = (list?.accounts ?? []).filter((x) => x?.uid === who.uid && typeof x.enterpriseId === "string" && x.enterpriseId.trim());
  const same = mine.filter((x) => String(x.type ?? "").trim().toLowerCase() === type);
  const last = mine.filter((x) => x.lastLogin);
  const pick2 = same.length === 1 ? same[0] : last.length === 1 ? last[0] : mine.length === 1 ? mine[0] : undefined;
  return pick2 ? pick2.enterpriseId.trim() : "";
}
var SESSION2 = "x-magpie-workbuddy-session";
var SALT = randomBytes3(16).toString("hex");
function idFor(kind, key) {
  return createHash4("sha256").update(`${SALT}|${kind}|${key}`).digest("hex").slice(0, 32);
}
function signatureOf(content) {
  if (typeof content === "string")
    return content;
  if (!Array.isArray(content))
    return "";
  let out = "";
  for (const part of content) {
    const type = part?.type ?? "";
    if (type === "" || type === "text")
      out += typeof part?.text === "string" ? part.text : "";
    else if (type !== "tool_result" && type !== "tool-result") {
      out += `[${type}:${createHash4("sha256").update(JSON.stringify(part)).digest("hex").slice(0, 8)}]`;
    }
  }
  return out;
}
function answeredBefore(msgs, i) {
  const prev = msgs[i - 1];
  if (prev === null || typeof prev !== "object")
    return false;
  if (prev.role === "tool")
    return true;
  return prev.role === "assistant" && Array.isArray(prev.tool_calls) && prev.tool_calls.length > 0;
}
function turnKey(chat) {
  const msgs = Array.isArray(chat?.messages) ? chat.messages : [];
  for (let i = msgs.length - 1;i >= 0; i--) {
    if (msgs[i]?.role !== "user" || answeredBefore(msgs, i))
      continue;
    const sig = signatureOf(msgs[i].content);
    return sig ? `u${i}:${sig}` : "";
  }
  return "";
}
function conversationKey(chat, session) {
  if (session)
    return `session:${session}`;
  const msgs = Array.isArray(chat?.messages) ? chat.messages : [];
  for (const m of msgs) {
    if (m?.role !== "user")
      continue;
    const sig = signatureOf(m.content);
    if (sig)
      return `first:${sig}`;
  }
  return "";
}
function chatOf(body) {
  if (typeof body !== "string")
    return null;
  try {
    const b = JSON.parse(body);
    return b !== null && typeof b === "object" ? b : null;
  } catch {
    return null;
  }
}
function sessionOf2(headers) {
  const s = String(headers.get(SESSION2) ?? "").trim();
  headers.delete(SESSION2);
  return s.slice(0, 128);
}
function attend(headers, body, session) {
  const chat = chatOf(body);
  const conv = conversationKey(chat, session);
  const msg = hex();
  headers.set("X-Conversation-Message-ID", msg);
  headers.set("X-Request-ID", msg);
  if (!headers.has("X-Conversation-Request-ID")) {
    const turn = turnKey(chat);
    headers.set("X-Conversation-Request-ID", turn ? idFor("turn", `${conv}|${turn}`) : hex());
  }
  if (conv && !headers.has("X-Conversation-ID"))
    headers.set("X-Conversation-ID", idFor("conversation", conv));
}
var FLAGGED = [
  [/x-anthropic-billing-header:[^\n]*\n?/gi, ""],
  [/You are Claude Code, Anthropic['’]s official CLI for Claude/gi, "You are Claude Code, Anthropic's CLI for Claude"],
  [/Main branch \(you will usually use this for PRs\)/gi, "Main branch (usually the base for PRs)"],
  [/(?<!the )Codex CLI is an open source project led by OpenAI\./gi, "The Codex CLI is an open source project led by OpenAI."],
  [/You are an AI agent powered by DeepSeek Harness\.?/gi, "You are an AI agent that helps the user with programming tasks."],
  [/Web GUI whose URL the runtime context names\.\s+When the user refers/gi, "Web GUI whose URL the runtime context names. The interface, when the user refers"]
];
function unflagged(text) {
  for (const [re, to] of FLAGGED)
    text = text.replace(re, to);
  return text;
}
function unflag(messages) {
  let changed = false;
  for (let i = messages.length - 1;i >= 0; i--) {
    const m = messages[i];
    if (typeof m?.content === "string") {
      const t = unflagged(m.content);
      if (t === m.content)
        continue;
      changed = true;
      if (t.trim() || m.role !== "system")
        m.content = t;
      else
        messages.splice(i, 1);
    } else if (Array.isArray(m?.content)) {
      const parts = [];
      let here = false;
      for (const p of m.content) {
        const t = typeof p?.text === "string" ? unflagged(p.text) : null;
        if (t === null || t === p.text) {
          parts.push(p);
          continue;
        }
        here = true;
        if (t.trim())
          parts.push({ ...p, text: t });
      }
      if (!here)
        continue;
      changed = true;
      if (parts.length || m.role !== "system")
        m.content = parts;
      else
        messages.splice(i, 1);
    }
  }
  return changed;
}
function withSystem(body) {
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
    body = new TextDecoder().decode(body);
  if (typeof body !== "string")
    return body;
  try {
    const b = JSON.parse(body);
    if (!Array.isArray(b?.messages) || !b.messages.length)
      return body;
    let changed = unflag(b.messages);
    if (b.max_completion_tokens !== undefined) {
      if (b.max_tokens === undefined)
        b.max_tokens = b.max_completion_tokens;
      delete b.max_completion_tokens;
      changed = true;
    }
    for (const m of b.messages) {
      if (m?.role !== "developer")
        continue;
      m.role = "system";
      changed = true;
    }
    if (b.messages[0]?.role !== "system") {
      b.messages.unshift({ role: "system", content: "You are a helpful assistant." });
      changed = true;
    }
    return changed ? JSON.stringify(b) : body;
  } catch {
    return body;
  }
}
var DEFAULT_SYSTEM = "You are a helpful assistant.";
var INSTRUCTIONS = [`<instructions>
`, `
</instructions>`];
function textOf2(content) {
  if (typeof content === "string")
    return content;
  if (!Array.isArray(content))
    return "";
  return content.map((p) => typeof p?.text === "string" ? p.text : "").filter(Boolean).join(`
`);
}
function systemKey(body) {
  const msgs = chatOf(body)?.messages;
  if (!Array.isArray(msgs))
    return "";
  const key = msgs.filter((m) => m?.role === "system").map((m) => textOf2(m.content)).join(`
`);
  return key.trim() === DEFAULT_SYSTEM ? "" : key;
}
function systemAsUser(body) {
  const b = chatOf(body);
  const msgs = b?.messages;
  if (!Array.isArray(msgs))
    return null;
  let i = 0;
  const lead = [];
  for (;i < msgs.length && msgs[i]?.role === "system"; i++)
    lead.push(textOf2(msgs[i].content));
  const said = lead.join(`

`).trim();
  const rest = msgs.slice(i).map((m) => m?.role === "system" ? { ...m, role: "user" } : m);
  const moved = said && said !== DEFAULT_SYSTEM;
  if (!moved && rest.every((m, k) => m === msgs[i + k]))
    return null;
  if (moved) {
    const text = INSTRUCTIONS[0] + said + INSTRUCTIONS[1];
    const u = rest.findIndex((m) => m?.role === "user");
    if (u < 0)
      rest.unshift({ role: "user", content: text });
    else if (typeof rest[u].content === "string")
      rest[u] = { ...rest[u], content: text + `

` + rest[u].content };
    else if (Array.isArray(rest[u].content))
      rest[u] = { ...rest[u], content: [{ type: "text", text }, ...rest[u].content] };
    else
      rest[u] = { ...rest[u], content: text };
  }
  b.messages = [{ role: "system", content: DEFAULT_SYSTEM }, ...rest];
  return JSON.stringify(b);
}
function normalizeToolChoice(body) {
  if (typeof body !== "string")
    return body;
  try {
    const b = JSON.parse(body);
    if (!b || typeof b !== "object" || Array.isArray(b) || !("tool_choice" in b))
      return body;
    const choice = b.tool_choice;
    if (typeof choice === "string") {
      if (choice.trim().toLowerCase() === "none") {
        delete b.tool_choice;
        delete b.tools;
        delete b.functions;
      }
      return JSON.stringify(b);
    }
    if (!choice || typeof choice !== "object" || Array.isArray(choice)) {
      delete b.tool_choice;
      return JSON.stringify(b);
    }
    const type = typeof choice.type === "string" ? choice.type.trim().toLowerCase() : "";
    if (type === "none") {
      delete b.tool_choice;
      delete b.tools;
      delete b.functions;
    } else if (type === "auto" || type === "required") {
      b.tool_choice = type;
    } else if (type === "function") {
      const fn = choice.function && typeof choice.function === "object" && !Array.isArray(choice.function) ? choice.function : undefined;
      const name = typeof fn?.name === "string" ? fn.name.trim() : "";
      b.tool_choice = name || "auto";
    } else {
      delete b.tool_choice;
    }
    return JSON.stringify(b);
  } catch {
    return body;
  }
}
var NAME_OK = /^[A-Za-z0-9_-]+$/;
function safeName(name, taken) {
  const base = String(name).replace(/[^A-Za-z0-9_-]/g, "_") || "tool";
  let n = base;
  for (let i = 2;taken.has(n); i++)
    n = `${base}_${i}`;
  taken.add(n);
  return n;
}
var NUL_ESCAPE = /\\\\|\\0(?![0-9])/g;
function fitSchema(s, depth = 0) {
  if (!s || typeof s !== "object" || depth > 64)
    return false;
  let changed = false;
  if (Array.isArray(s)) {
    for (const v of s)
      if (fitSchema(v, depth + 1))
        changed = true;
    return changed;
  }
  if (typeof s.pattern === "string" && s.pattern.includes("\\0")) {
    const p = s.pattern.replace(NUL_ESCAPE, (m) => m === "\\\\" ? m : "\\u0000");
    if (p !== s.pattern) {
      s.pattern = p;
      changed = true;
    }
  }
  if (Array.isArray(s.items)) {
    const list = s.items.filter((v) => v && typeof v === "object");
    s.items = list.length === 0 ? {} : list.length === 1 ? list[0] : { anyOf: list };
    delete s.additionalItems;
    changed = true;
  }
  for (const v of Object.values(s))
    if (fitSchema(v, depth + 1))
      changed = true;
  return changed;
}
var TYPES = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);
var SUB_ONE = ["items", "additionalItems", "unevaluatedItems", "contains", "not", "if", "then", "else", "propertyNames", "additionalProperties", "unevaluatedProperties"];
var SUB_LIST = ["anyOf", "oneOf", "allOf", "prefixItems"];
var SUB_MAP = ["properties", "patternProperties", "$defs", "definitions", "dependentSchemas"];
var BOOL_OK = new Set(["additionalProperties", "unevaluatedProperties"]);
function valueType(v) {
  if (v === null)
    return "null";
  if (Array.isArray(v))
    return "array";
  if (typeof v === "number")
    return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}
function fitEnum(s) {
  if (!("enum" in s))
    return false;
  if (!Array.isArray(s.enum) || s.enum.length === 0) {
    delete s.enum;
    return true;
  }
  const listed = Array.isArray(s.type) ? s.type : typeof s.type === "string" ? [s.type] : [];
  if (listed.filter((t) => t !== "null").length === 1)
    return false;
  const byType = new Map;
  for (const v of s.enum) {
    const t = valueType(v);
    if (!byType.has(t))
      byType.set(t, []);
    byType.get(t).push(v);
  }
  if (byType.has("integer") && byType.has("number")) {
    byType.get("number").push(...byType.get("integer"));
    byType.delete("integer");
  }
  const hasNull = byType.delete("null");
  if (byType.size <= 1) {
    const [t] = byType.keys();
    const want = t === undefined ? "null" : hasNull ? [t, "null"] : t;
    if (JSON.stringify(want) === JSON.stringify(s.type))
      return false;
    s.type = want;
    return true;
  }
  const split = [...byType].map(([t, vs]) => ({ type: t, enum: vs }));
  if (hasNull)
    split.push({ type: "null" });
  delete s.enum;
  delete s.type;
  if (Array.isArray(s.anyOf))
    s.allOf = [...Array.isArray(s.allOf) ? s.allOf : [], { anyOf: split }];
  else
    s.anyOf = split;
  return true;
}
function subSchema(v, key) {
  if (typeof v !== "boolean" || BOOL_OK.has(key))
    return v;
  return v ? {} : { not: {} };
}
function fitShape(s, depth = 0) {
  if (!s || typeof s !== "object" || Array.isArray(s) || depth > 64)
    return false;
  let changed = false;
  if ("type" in s) {
    const list = (Array.isArray(s.type) ? s.type : [s.type]).map((t) => typeof t === "string" ? t.toLowerCase() : t).filter((t) => TYPES.has(t));
    const uniq = [...new Set(list)];
    const want = uniq.length === 0 ? undefined : uniq.length === 1 ? uniq[0] : uniq;
    if (JSON.stringify(want) !== JSON.stringify(s.type)) {
      if (want === undefined)
        delete s.type;
      else
        s.type = want;
      changed = true;
    }
  }
  if ("required" in s && !Array.isArray(s.required)) {
    delete s.required;
    changed = true;
  } else if (Array.isArray(s.required) && s.required.some((k) => typeof k !== "string")) {
    s.required = s.required.filter((k) => typeof k === "string");
    changed = true;
  }
  if (fitEnum(s))
    changed = true;
  for (const k of SUB_ONE) {
    if (!(k in s))
      continue;
    const v = subSchema(s[k], k);
    if (v !== s[k]) {
      s[k] = v;
      changed = true;
    }
    if (fitShape(v, depth + 1))
      changed = true;
  }
  for (const k of SUB_LIST) {
    if (!Array.isArray(s[k]))
      continue;
    s[k].forEach((v0, i) => {
      const v = subSchema(v0, k);
      if (v !== v0) {
        s[k][i] = v;
        changed = true;
      }
      if (fitShape(v, depth + 1))
        changed = true;
    });
  }
  for (const k of SUB_MAP) {
    const m = s[k];
    if (!m || typeof m !== "object" || Array.isArray(m))
      continue;
    for (const [name, v0] of Object.entries(m)) {
      const v = subSchema(v0, k);
      if (v !== v0) {
        m[name] = v;
        changed = true;
      }
      if (fitShape(v, depth + 1))
        changed = true;
    }
  }
  return changed;
}
function localRef(root, s) {
  const ref = s?.$ref;
  if (typeof ref !== "string" || !ref.startsWith("#/"))
    return s;
  let at = root;
  for (const k of ref.slice(2).split("/"))
    at = at?.[k.replaceAll("~1", "/").replaceAll("~0", "~")];
  return at && typeof at === "object" ? at : s;
}
function objectRoot(ps, root = ps, depth = 0) {
  const unions = ["allOf", "anyOf", "oneOf"].filter((k) => Array.isArray(ps[k]));
  if (ps.type === "object" && !unions.length)
    return false;
  const props = ps.properties && typeof ps.properties === "object" ? ps.properties : {};
  const required = Array.isArray(ps.required) ? [...ps.required] : [];
  for (const b0 of ps.allOf ?? []) {
    let b = localRef(root, b0);
    if (!b || typeof b !== "object")
      continue;
    if (depth < 8 && ["allOf", "anyOf", "oneOf"].some((k) => Array.isArray(b[k])))
      objectRoot(b = structuredClone(b), root, depth + 1);
    for (const [k, v] of Object.entries(b.properties ?? {}))
      if (!(k in props))
        props[k] = v;
    if (Array.isArray(b.required))
      required.push(...b.required);
  }
  const branches = [];
  for (const key of ["anyOf", "oneOf"]) {
    for (const b0 of ps[key] ?? []) {
      let b = localRef(root, b0);
      if (!b || typeof b !== "object")
        continue;
      if (depth < 8 && ["allOf", "anyOf", "oneOf"].some((k) => Array.isArray(b[k])))
        objectRoot(b = structuredClone(b), root, depth + 1);
      if (b.type !== "object" && !b.properties)
        continue;
      branches.push(b);
    }
  }
  const from = new Map;
  for (const b of branches) {
    for (const [k, v] of Object.entries(b.properties ?? {})) {
      if (k in props)
        continue;
      const seen = from.get(k) ?? [];
      if (!seen.some((x) => JSON.stringify(x) === JSON.stringify(v)))
        seen.push(v);
      from.set(k, seen);
    }
  }
  for (const [k, list] of from)
    props[k] = list.length === 1 ? list[0] : { anyOf: list };
  if (branches.length) {
    for (const k of Object.keys(branches[0].properties ?? {})) {
      if (branches.every((b) => Array.isArray(b.required) && b.required.includes(k)))
        required.push(k);
    }
  }
  for (const k of unions)
    delete ps[k];
  ps.type = "object";
  ps.properties = props;
  const req = [...new Set(required)].filter((k) => typeof k === "string" && (k in props));
  if (req.length)
    ps.required = req;
  else
    delete ps.required;
  return true;
}
function fitTools(b) {
  const names = new Map;
  if (!Array.isArray(b?.tools) || !b.tools.length)
    return { changed: false, names };
  let changed = false;
  const taken = new Set;
  for (const t of b.tools) {
    const n = t?.function?.name;
    if (typeof n === "string" && NAME_OK.test(n))
      taken.add(n);
  }
  const theirs = new Map;
  for (const t of b.tools) {
    const fn = t?.type === "function" || t?.function ? t.function : null;
    if (!fn || typeof fn !== "object")
      continue;
    if (typeof fn.name === "string" && !NAME_OK.test(fn.name)) {
      const safe = safeName(fn.name, taken);
      names.set(safe, fn.name);
      theirs.set(fn.name, safe);
      fn.name = safe;
      changed = true;
    }
    if (fn.parameters === undefined)
      continue;
    if (!fn.parameters || typeof fn.parameters !== "object" || Array.isArray(fn.parameters)) {
      fn.parameters = { type: "object", properties: {} };
      changed = true;
      continue;
    }
    if (fitSchema(fn.parameters))
      changed = true;
    if (fitShape(fn.parameters))
      changed = true;
    if (objectRoot(fn.parameters))
      changed = true;
  }
  if (theirs.size && Array.isArray(b.messages)) {
    for (const m of b.messages) {
      for (const c of Array.isArray(m?.tool_calls) ? m.tool_calls : []) {
        const safe = theirs.get(c?.function?.name);
        if (safe)
          c.function.name = safe;
      }
      if (m?.role === "tool" && theirs.has(m.name))
        m.name = theirs.get(m.name);
    }
  }
  const choice = b.tool_choice?.function;
  if (choice && theirs.has(choice.name))
    choice.name = theirs.get(choice.name);
  return { changed, names };
}
function fitted(body) {
  if (typeof body !== "string")
    return { body, names: new Map };
  try {
    const b = JSON.parse(body);
    const { changed, names } = fitTools(b);
    return { body: changed ? JSON.stringify(b) : body, names };
  } catch {
    return { body, names: new Map };
  }
}
function namedBack(v, names) {
  let changed = false;
  for (const c of Array.isArray(v?.choices) ? v.choices : []) {
    for (const at of [c?.message, c?.delta]) {
      for (const tc of Array.isArray(at?.tool_calls) ? at.tool_calls : []) {
        const ours = names.get(tc?.function?.name);
        if (ours) {
          tc.function.name = ours;
          changed = true;
        }
      }
    }
  }
  return changed;
}
function renamed(res, names) {
  if (!names.size || !res.body)
    return res;
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  const json = /json/i.test(res.headers.get("content-type") ?? "");
  if (json) {
    const out = res.text().then((text) => {
      try {
        const v = JSON.parse(text);
        return namedBack(v, names) ? JSON.stringify(v) : text;
      } catch {
        return text;
      }
    });
    return out.then((text) => new Response(text, { status: res.status, statusText: res.statusText, headers }));
  }
  const dec = new TextDecoder;
  const enc2 = new TextEncoder;
  let rest = "";
  const line = (l) => {
    const m = /^data:\s?(.*)$/.exec(l);
    if (!m || m[1] === "[DONE]")
      return l;
    try {
      const v = JSON.parse(m[1]);
      return namedBack(v, names) ? `data: ${JSON.stringify(v)}` : l;
    } catch {
      return l;
    }
  };
  const body = res.body.pipeThrough(new TransformStream({
    transform(chunk, ctl) {
      rest += dec.decode(chunk, { stream: true });
      const lines = rest.split(`
`);
      rest = lines.pop();
      if (lines.length)
        ctl.enqueue(enc2.encode(lines.map(line).join(`
`) + `
`));
    },
    flush(ctl) {
      rest += dec.decode();
      if (rest)
        ctl.enqueue(enc2.encode(line(rest)));
    }
  }));
  return new Response(body, { status: res.status, statusText: res.statusText, headers });
}
async function poll(site, path, headers, retry, deadline) {
  for (;; ) {
    if (Date.now() > deadline)
      throw new Error(`${site.name} sign-in timed out`);
    try {
      const data = await call(site, "GET", path, headers);
      if (data && Object.keys(data).length)
        return data;
    } catch (e) {
      if (!(retry.includes(e.code) || e.status === 408 || e.status === 429))
        throw e;
    }
    await sleep2(POLL_MS);
  }
}
async function browserSignIn2(site) {
  const state = await call(site, "POST", `/v2/plugin/auth/state?platform=${encodeURIComponent(site.platform)}`, {
    "X-No-Authorization": "true",
    "X-No-User-Id": "true",
    "X-No-Enterprise-Id": "true",
    "X-No-Department-Info": "true"
  }, {});
  if (!state?.state || !state?.authUrl)
    throw new Error(`${site.name} gave no sign-in page`);
  const url = new URL(state.authUrl);
  if (url.protocol !== "https:")
    throw new Error(`${site.name}'s sign-in page isn't https`);
  url.searchParams.set("version", APP_VERSION);
  url.searchParams.set("loginSessionId", hex());
  return {
    url: url.toString(),
    instructions: `Sign in to ${site.name} in the browser; this finishes by itself.`,
    method: "auto",
    async callback() {
      try {
        const deadline = Date.now() + SIGN_IN_MS;
        const q = encodeURIComponent(state.state);
        const token = await poll(site, `/v2/plugin/auth/token?state=${q}`, {}, [11217], deadline);
        if (!token.accessToken)
          return { type: "failed", error: `${site.name} sent back no token` };
        let a = merge({}, token);
        const who = await poll(site, `/v2/plugin/login/account?state=${q}`, {
          Authorization: "Bearer " + a.access,
          "X-Domain": domainOf(site, a),
          "X-No-User-Id": "true",
          "X-No-Enterprise-Id": "true"
        }, [12151], deadline);
        a.uid = who.uid ?? "";
        a.enterpriseId = await enterpriseOf(site, a, who);
        return success(site, a, who.nickname || who.phoneNumber || who.uid);
      } catch (e) {
        return { type: "failed", error: e.message };
      }
    }
  };
}
function success(site, a, name) {
  return {
    type: "success",
    refresh: a.refresh ?? "",
    access: a.access,
    expires: a.expires ?? 0,
    accountId: name || site.name,
    uid: a.uid ?? "",
    domain: a.domain ?? "",
    ...a.enterpriseId ? { enterpriseId: a.enterpriseId } : {},
    ...a.refreshExpiresAt ? { refreshExpiresAt: a.refreshExpiresAt } : {},
    ...a.tokenType ? { tokenType: a.tokenType } : {}
  };
}
function desktopFile(site) {
  const home = homedir3();
  const base = process.platform === "darwin" ? join5(home, "Library", "Application Support", "CodeBuddyExtension") : process.platform === "win32" ? join5(home, "AppData", "Local", "CodeBuddyExtension") : join5(home, ".local", "share", "CodeBuddyExtension");
  return join5(base, "Data", "Public", "auth", site.authID + ".info");
}
function readDesktop(site) {
  try {
    const f = JSON.parse(readFileSync(desktopFile(site), "utf8"));
    const t = f?.auth ?? {};
    if (typeof t.accessToken !== "string" || !t.accessToken || !f?.account?.uid)
      return null;
    const now = Date.now();
    const acct = f.account;
    return {
      access: t.accessToken,
      refresh: typeof t.refreshToken === "string" ? t.refreshToken : "",
      expires: t.expiresAt > 0 ? t.expiresAt : t.expiresIn > 0 ? now + t.expiresIn * 1000 : 0,
      refreshExpiresAt: t.refreshExpiresAt > 0 ? t.refreshExpiresAt : t.refreshExpiresIn > 0 ? now + t.refreshExpiresIn * 1000 : 0,
      domain: typeof t.domain === "string" ? t.domain : "",
      tokenType: typeof t.tokenType === "string" ? t.tokenType : "",
      uid: acct.uid,
      ...typeof acct.enterpriseId === "string" && acct.enterpriseId.trim() ? { enterpriseId: acct.enterpriseId.trim() } : {},
      name: acct.nickname || acct.phoneNumber || acct.uid
    };
  } catch {
    return null;
  }
}
function notDesktop(site) {
  try {
    const t = JSON.parse(readFileSync(desktopFile(site), "utf8"))?.auth ?? {};
    if (t.accessToken?.$wbEncrypted || t.refreshToken?.$wbEncrypted)
      return `${site.name} desktop keeps its sign-in encrypted (WorkBuddy 5.6 and later), which magpie can't read; sign in with "${site.name} account (browser)" instead`;
  } catch {}
  return `${site.name} desktop isn't signed in`;
}
function desktopSignIn(site) {
  return {
    url: "",
    instructions: `Uses the account ${site.name} desktop is signed in to.`,
    method: "auto",
    async callback() {
      const d = readDesktop(site);
      if (!d)
        return { type: "failed", error: notDesktop(site) };
      return { type: "success", refresh: "", access: "", expires: 0, source: "desktop", accountId: d.name || site.name, uid: d.uid };
    }
  };
}
var desktopHeld = new Map;
async function current(site, client, auth) {
  if (auth?.source !== "desktop")
    return fresh(site, client, auth);
  const d = readDesktop(site);
  if (!d)
    throw new Error(notDesktop(site));
  const k = site.id + "|" + d.uid;
  const h = desktopHeld.get(k);
  const a = await fresh(site, null, h && h.expires >= d.expires ? h : d);
  desktopHeld.set(k, a);
  return a;
}
var STATUS_TEXT = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  103: "Early Hints",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Request Entity Too Large",
  414: "Request URI Too Long",
  415: "Unsupported Media Type",
  416: "Requested Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  425: "Too Early",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required"
};
var statusText2 = (n) => STATUS_TEXT[n] || `HTTP ${n}`;
function meterAsked(site, a, path, body = {}, signal = AbortSignal.timeout(20000)) {
  return fetch(site.endpoint + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "WorkBuddy/" + UA_VERSION,
      Authorization: "Bearer " + a.access,
      "X-User-Id": a.uid ?? "",
      "X-Domain": domainOf(site, a),
      "X-Product": "SaaS",
      "X-IDE-Type": "WorkBuddy",
      ...enterpriseHeaders(a)
    },
    body: JSON.stringify(body),
    signal
  });
}
var EDGE_READS = 2 * 1024 * 1024;
var byteLength = (b) => typeof b === "string" ? Buffer.byteLength(b) : b instanceof ArrayBuffer || ArrayBuffer.isView(b) ? b.byteLength : 0;
async function unanswered(site, a, body, err, signal) {
  if (signal?.aborted || err?.name === "AbortError" || err?.name === "TimeoutError")
    throw err;
  const size = byteLength(body);
  if (size <= EDGE_READS)
    throw err;
  let status = 0;
  try {
    const res = await meterAsked(site, a, "/billing/meter/get-user-resource-summary", {}, AbortSignal.timeout(20000));
    status = res.status;
    await res.body?.cancel();
  } catch {
    throw err;
  }
  if (status !== 401)
    throw err;
  const mb = (size / (1024 * 1024)).toFixed(1);
  const message = `${site.name} refused this account's sign-in (401). It closes the connection on a refused request over 2 MiB ` + `(this one was ${mb} MiB) instead of answering, which is why it read as ECONNRESET. ` + (a.source === "desktop" ? `Sign in to ${site.name} desktop again.` : `Sign in to ${site.name} again in magpie.`);
  return new Response(JSON.stringify({ error: { message, type: "authentication_error", code: 401 } }), {
    status: 401,
    statusText: "Unauthorized",
    headers: { "content-type": "application/json" }
  });
}
async function meter(site, a, path, body = {}) {
  const res = await meterAsked(site, a, path, body);
  let env3 = {};
  try {
    env3 = JSON.parse(await res.text()) ?? {};
  } catch {}
  const code = Number.parseInt(env3.code, 10) || 0;
  if (!res.ok) {
    if (code)
      throw new Error(env3.msg || `error ${code}`);
    if (env3.msg)
      throw new Error(env3.msg);
    throw new Error(statusText2(res.status));
  }
  if (code)
    throw new Error(env3.msg || `error ${code}`);
  return env3.data ?? null;
}
function capacity(v) {
  if (v == null || v === "")
    return 0;
  if (typeof v === "number")
    return v;
  const s = String(v);
  const n = Number(s);
  if (s.trim() !== s || Number.isNaN(n))
    throw new Error(`strconv.ParseFloat: parsing ${JSON.stringify(s)}: invalid syntax`);
  return n;
}
var compact = (n) => Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
function usageOf2(sum, plan) {
  const out = { plan: plan || (sum?.IsPaidUser ? "Pro" : "Free"), windows: [] };
  let total = 0, used = 0;
  for (const p of sum?.Packages ?? []) {
    total += capacity(p?.CycleTotalCapacity);
    used += capacity(p?.CycleUsedCapacity);
  }
  if (total > 0)
    out.windows.push({ name: "Credits", used: 100 * used / total, display: `${compact(used)} / ${compact(total)}`, amount: used, limit: total, unit: "credits" });
  return out;
}
function enterpriseUsageOf(u) {
  const limit = capacity(u?.limitNum);
  if (!(limit > 0))
    return null;
  const used = capacity(u?.credit);
  const w = { name: "Credits", used: 100 * used / limit, display: `${compact(used)} / ${compact(limit)}`, amount: used, limit, unit: "credits" };
  const at = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v.trim()) ? Date.parse(v.trim().replace(" ", "T") + "+08:00") : 0;
  const reset = at(u?.cycleResetTime), start = at(u?.cycleStartTime);
  if (reset > 0)
    w.resetsAt = new Date(reset).toISOString();
  if (reset > start && start > 0)
    w.span = (reset - start) / 1000;
  return w;
}
async function spareFree(site, a, windows) {
  if (!windows.length)
    return windows;
  let free = [];
  try {
    free = (await liveModels(site, a)).filter((m) => m.free).map((m) => m.id);
  } catch {}
  if (free.length)
    for (const w of windows)
      w.notModels = free;
  return windows;
}
var CODE = (n, s) => `TCACA_code_${n}_${s}`;
var PAID_CODES = [
  CODE("002", "AkiJS3ZHF5"),
  CODE("005", "maRGyrHhw1"),
  CODE("003", "FAnt7lcmRT"),
  CODE("023", "4xbGhMrE6q"),
  CODE("026", "BaESVICNoi"),
  CODE("027", "0FCGVA6vSa"),
  CODE("009", "0XmEQc2xOf"),
  CODE("038", "OhvqZtiPKr"),
  CODE("036", "lupO5WgNdG")
];
var DAILY_CODE = CODE("001", "PqouKr6QWV");
var FREE_CODES = [
  DAILY_CODE,
  CODE("008", "cfWoLwvjU4"),
  CODE("035", "ArVxJcGDsm"),
  CODE("006", "DbXS0lrypC"),
  CODE("039", "KRcQj7wUat"),
  CODE("040", "mi9rCYg46x"),
  CODE("007", "nzdH5h4Nl0"),
  CODE("028", "NtpWi0jzXs"),
  CODE("037", "WxOD3MpI2o"),
  CODE("029", "6wCGEWquYy"),
  CODE("030", "BjSt89qTvr")
];
var SLICE = "4";
var beijing = (ms) => new Date(ms + 8 * 3600000).toISOString().slice(0, 19).replace("T", " ");
async function packagesOf(site, a, now = Date.now()) {
  const day = beijing(now).slice(0, 10);
  const lists2 = [
    ["/billing/meter/get-user-resource-paid-packages", { PackageCodes: PAID_CODES, NeedRenewInfo: true }],
    ["/billing/meter/get-user-resource-free-packages", { PackageCodes: FREE_CODES, SlicePeriodStartTime: day + " 00:00:00", SlicePeriodEndTime: day + " 23:59:59" }]
  ];
  const out = [];
  for (const [path, extra] of lists2) {
    for (let page = 1;page <= 10; page++) {
      const d = await meter(site, a, path, { PageNumber: page, PageSize: 200, Status: [0, 3], ...extra });
      const got = d?.Accounts ?? [];
      out.push(...got);
      if (got.length < 200 || out.length >= (d?.TotalCount ?? 0))
        break;
    }
  }
  return out;
}
function endOf(p) {
  const ms = Number(p?.DeductionEndTime);
  if (ms > 0)
    return ms;
  for (const v of [p?.ExpiredTime, p?.CycleEndTime]) {
    if (typeof v !== "string" || !v.trim())
      continue;
    const t = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v.trim()) ? Date.parse(v.trim().replace(" ", "T") + "+08:00") : Date.parse(v);
    if (t > 0)
      return t;
  }
  return 0;
}
function runsOutOf(sum, packages, now = Date.now()) {
  const counted = new Set((sum?.Packages ?? []).map((p) => p?.PackageCode));
  let at = 0, amount = 0;
  for (const p of packages ?? []) {
    if (!counted.has(p?.PackageCode) || p?.PackageCode === DAILY_CODE || String(p?.CapacityType) === SLICE)
      continue;
    const left = capacity(p?.CycleCapacityRemainPrecise ?? p?.CycleCapacityRemain);
    const end = endOf(p);
    if (!(left > 0) || end <= now)
      continue;
    if (!at || end < at)
      at = end, amount = left;
    else if (end === at)
      amount += left;
  }
  return at ? { runsOutAt: new Date(at).toISOString(), runsOut: amount } : null;
}
function variants(efforts) {
  return Object.fromEntries((efforts ?? []).map((e) => [e, { reasoningEffort: e }]));
}
function configModels(site) {
  return Object.fromEntries(site.models.map(([id, name, context, efforts]) => [id, {
    name,
    limit: { context, output: 0 },
    tool_call: true,
    ...efforts ? { reasoning: true, variants: variants(efforts) } : {}
  }]));
}
function modelOf(site, provider, m) {
  return {
    id: m.id,
    providerID: provider.id,
    name: m.name,
    api: { id: m.id, url: api(site), npm: NPM },
    status: "active",
    headers: {},
    options: {},
    cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
    limit: { context: m.context ?? 0, output: m.output ?? 0 },
    capabilities: {
      temperature: true,
      reasoning: !!m.efforts?.length,
      attachment: !!m.images,
      toolcall: true,
      input: { text: true, image: !!m.images, audio: false, video: false, pdf: false },
      output: { text: true, image: false, audio: false, video: false, pdf: false },
      interleaved: false
    },
    release_date: "",
    variants: variants(m.efforts),
    free: !!m.free,
    rate: m.rate ?? 0,
    rateWas: m.rateWas ?? 0
  };
}
function creditsOf(c) {
  if (c == null || c === "")
    return;
  const s = String(c).trim().toLowerCase().replace(/\s+credits?$/, "").replace(/^x/, "");
  const n = Number(s);
  return s !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
}
function discountOf(p, base) {
  const said = creditsOf(String(p.discount?.discountedCredits ?? "").trim().replace(/x$/i, ""));
  if (said !== undefined)
    return said;
  const f = Number(p.discount?.factor);
  return Number.isFinite(f) && f >= 0 && base !== undefined ? base * f : undefined;
}
function running(p, now) {
  if (!p || p.enabled === false)
    return false;
  const from = Date.parse(p.schedule?.validFrom ?? "");
  const until = Date.parse(p.schedule?.validUntil ?? "");
  return !(from > now) && !(until <= now);
}
function priceOf(d, promotions, now = Date.now()) {
  const base = creditsOf(d.credits);
  const mine = (Array.isArray(promotions) ? promotions : []).filter((p) => p?.kind === "discount" && Array.isArray(p.modelIds) && p.modelIds.includes(d.id) && running(p, now));
  if (mine.some((p) => Array.isArray(p.schedule?.daily) && p.schedule.daily.length)) {
    const night = mine.filter((p) => p.discount && Array.isArray(p.schedule?.daily) && p.schedule.daily.length);
    if (base === undefined || base === 0 && night.some((p) => discountOf(p, base) === 0))
      return { free: false };
    return { free: false, rate: base };
  }
  const off = mine.filter((p) => p.discount).map((p) => discountOf(p, base)).filter((r) => r !== undefined);
  if (off.length) {
    const r = Math.min(...off);
    return { free: r === 0, rate: r, ...base !== undefined && base > r ? { rateWas: base } : {} };
  }
  if (base === undefined)
    return {};
  return { free: base === 0, rate: base };
}
var EFFORT_ORDER = ["low", "medium", "high", "xhigh", "max"];
function effortsOf2(d) {
  const said = d.reasoning?.supportedEfforts;
  if (Array.isArray(said) && said.length)
    return said;
  if (d.supportsReasoning !== true)
    return [];
  const own = d.reasoning?.effort;
  const set = new Set(["low", "high", "max", ...typeof own === "string" && EFFORT_ORDER.includes(own) ? [own] : []]);
  return EFFORT_ORDER.filter((e) => set.has(e));
}
async function liveModels(site, a) {
  const headers = new Headers;
  sign(site, a, headers);
  headers.set("User-Agent", `CLI/${APP_VERSION} WorkBuddy/${UA_VERSION}`);
  headers.set("X-Requested-With", "XMLHttpRequest");
  headers.set("Accept", "application/json");
  const res = await fetch(site.endpoint + "/v3/config", { headers, signal: AbortSignal.timeout(15000) });
  const env3 = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(`${site.name}'s config: HTTP ${res.status}`);
  if (env3.code)
    throw new Error(`${site.name}'s config: ${env3.msg} (${env3.code})`);
  const cfg = env3.data ?? {};
  const out = [];
  for (const agent of cfg.agents ?? []) {
    if (agent.name !== "cli")
      continue;
    for (const id of agent.models ?? []) {
      const d = (cfg.models ?? []).find((x) => x.id === id);
      const m = { id, name: d?.name || id };
      if (d) {
        m.context = d.maxInputTokens;
        m.output = d.maxOutputTokens;
        m.images = d.supportsImages === true && !textOnly(site, id);
        Object.assign(m, priceOf(d, cfg.modelPromotions));
        const es = effortsOf2(d);
        if (es.length) {
          const canOff = d.reasoning?.canDisableThinking;
          m.efforts = [...!d.onlyReasoning && (canOff == null || canOff) ? ["none"] : [], ...es];
        }
      }
      out.push(m);
    }
  }
  const first = new Map;
  for (const m of out) {
    const id = first.get(m.name);
    if (id === undefined) {
      first.set(m.name, m.id);
      continue;
    }
    const rest = m.id.startsWith(id + "-") ? m.id.slice(id.length + 1) : "";
    m.name = `${m.name} (${rest ? rest.toUpperCase() : m.id})`;
  }
  return out;
}
var AFTER_TOOLS_REFUSED = /must end with a user message|["']code["']\s*:\s*["']?11153(?![\d.])/i;
function replyAfterTools(body) {
  const b = chatOf(body);
  const msgs = b?.messages;
  if (!Array.isArray(msgs))
    return null;
  let i = msgs.length - 1;
  while (i >= 0 && msgs[i]?.role === "user")
    i--;
  if (i === msgs.length - 1 || i < 0 || msgs[i]?.role !== "tool")
    return null;
  msgs.splice(i + 1, 0, { role: "assistant", content: "" });
  return JSON.stringify(b);
}
function makePlugin(site) {
  const endsAfterTools = new Set;
  const refusedSystems = new Set;
  return async ({ client }) => ({
    config: async (config) => {
      config.provider ??= {};
      config.provider[site.id] ??= {};
      const p = config.provider[site.id];
      p.name ??= site.name;
      p.npm ??= NPM;
      p.api ??= api(site);
      p.models = { ...configModels(site), ...p.models ?? {} };
    },
    "chat.headers": async (input, output) => {
      const id = input?.model?.providerID ?? input?.provider?.info?.id;
      if (id !== site.id || !input?.sessionID)
        return;
      output.headers[SESSION2] = String(input.sessionID).slice(0, 128);
    },
    provider: {
      id: site.id,
      async models(provider, { auth }) {
        if (auth?.type !== "oauth" || !(auth.access || auth.source))
          return provider.models;
        try {
          const a = await current(site, client, auth);
          const ms = await liveModels(site, a);
          if (!ms.length)
            return provider.models;
          return Object.fromEntries(ms.map((m) => [m.id, modelOf(site, provider, m)]));
        } catch {
          return provider.models;
        }
      }
    },
    auth: {
      provider: site.id,
      refreshLead: LEAD_MS,
      refresh: (auth) => refreshed(site, auth),
      async loader(getAuth) {
        const auth = await getAuth();
        if (auth?.type !== "oauth")
          return {};
        return {
          baseURL: api(site),
          apiKey: "",
          async fetch(input, init) {
            let a = await getAuth();
            if (a?.type !== "oauth")
              throw new Error(`${site.name} isn't signed in`);
            a = await current(site, client, a);
            const req = input instanceof Request ? input : null;
            const headers = new Headers(init?.headers ?? req?.headers);
            headers.delete("authorization");
            headers.delete("x-api-key");
            headers.delete("content-length");
            const session = sessionOf2(headers);
            sign(site, a, headers);
            let body = init?.body;
            if (body === undefined && req)
              body = await req.clone().text();
            body = withSystem(body);
            const fit = fitted(body);
            body = normalizeToolChoice(fit.body);
            attend(headers, body, session);
            const send = (b) => fetch(req ? req.url : input, { ...init, method: init?.method ?? req?.method, headers, body: b }).catch((e) => unanswered(site, a, b, e, init?.signal));
            const model = chatOf(body)?.model;
            const sysKey = systemKey(body);
            if (sysKey && refusedSystems.has(sysKey))
              body = systemAsUser(body) ?? body;
            const shaped = (b) => endsAfterTools.has(model) ? replyAfterTools(b) ?? b : b;
            let res = await send(shaped(body));
            if (res.status === 400) {
              let text = await res.text();
              const moved = REFUSED.test(text) && sysKey && !refusedSystems.has(sysKey) ? systemAsUser(body) : null;
              if (moved) {
                refusedSystems.add(sysKey);
                if (refusedSystems.size > 256)
                  refusedSystems.delete(refusedSystems.values().next().value);
                body = moved;
                res = await send(shaped(body));
                if (res.status === 400)
                  text = await res.text();
              }
              const again = res.status === 400 && !endsAfterTools.has(model) && AFTER_TOOLS_REFUSED.test(text) ? replyAfterTools(body) : null;
              if (again) {
                endsAfterTools.add(model);
                res = await send(again);
              } else if (res.status === 400) {
                res = new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });
              }
            }
            return res.status >= 400 ? explained(res) : kept2(await renamed(res, fit.names));
          }
        };
      },
      async usage(getAuth) {
        const auth = await getAuth();
        if (auth?.type !== "oauth" || !(auth.access || auth.source))
          return { error: "not signed in", signIn: "kept" };
        try {
          const a = await current(site, client, auth);
          const sum = await meter(site, a, "/billing/meter/get-user-resource-summary");
          const out = usageOf2(sum, auth.plan);
          if (!out.windows.length) {
            let ent = null;
            try {
              ent = enterpriseUsageOf(await meter(site, a, "/billing/meter/get-enterprise-user-usage"));
            } catch {}
            if (ent)
              return { plan: auth.plan || "Enterprise", windows: await spareFree(site, a, [ent]), signIn: "kept" };
          }
          const credits = out.windows.find((w) => w.name === "Credits");
          if (credits) {
            try {
              Object.assign(credits, runsOutOf(sum, await packagesOf(site, a)) ?? {});
            } catch {}
          }
          await spareFree(site, a, out.windows);
          return { ...out, signIn: "kept" };
        } catch (e) {
          return { error: e?.message ?? String(e), signIn: "kept" };
        }
      },
      methods: [
        {
          type: "oauth",
          label: `${site.name} account (browser)`,
          authorize: () => browserSignIn2(site)
        },
        {
          type: "oauth",
          label: `${site.name} desktop's sign-in`,
          authorize: async () => desktopSignIn(site)
        }
      ]
    }
  });
}
var REFUSED_HINT = "WorkBuddy refused words in this client's prompt (most often its system prompt); use it from Hermes, OpenCode or Pi, or add another provider to this group";
var REFUSED = /unapproved channel|illegal api invocation/i;
var RESTRICTED_HINT = "WorkBuddy restricted this account for unusual activity; it stays out until WorkBuddy lifts that, which an appeal (Submit feedback in WorkBuddy) asks for";
var RESTRICTED_CODE = 11140;
var RESTRICTED_TEXT = /account has been restricted due to unusual activity|账号存在异常行为|帳號存在異常行為|["']code["']\s*:\s*["']?11140(?![\d.])/i;
var EXHAUSTED_HINT = "WorkBuddy requires an active credit package even for 0-rate free models; check your account package balance";
var EXHAUSTED_TEXT = /credits exhausted|额度已用尽|["']code["']\s*:\s*["']?14018(?![\d.])/i;
function kept2(res) {
  const headers = new Headers(res.headers);
  headers.set("X-Magpie-Sign-In", "kept");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
async function explained(res) {
  const text = await res.text();
  const again = (b) => {
    const headers2 = new Headers(res.headers);
    headers2.delete("content-length");
    headers2.delete("content-encoding");
    headers2.set("X-Magpie-Sign-In", "kept");
    return new Response(b, { status: res.status, statusText: res.statusText, headers: headers2 });
  };
  let v;
  try {
    v = JSON.parse(text);
  } catch {}
  const at = v?.error && typeof v.error === "object" ? v.error : v && typeof v === "object" ? v : null;
  const code = at?.data?.code ?? at?.code ?? v?.code ?? v?.data?.code;
  const isRefused = REFUSED.test(text);
  const isRestricted = !isRefused && (Number(code) === RESTRICTED_CODE || RESTRICTED_TEXT.test(text));
  const isExhausted = !isRestricted && (code === 14018 || Number(code) === 14018 || EXHAUSTED_TEXT.test(text));
  if (!isRefused && !isRestricted && !isExhausted)
    return again(text);
  let msg = text.trim();
  if (at && typeof at.message === "string")
    msg = at.message;
  else if (typeof at?.data?.msg === "string")
    msg = at.data.msg;
  else if (typeof v?.error === "string")
    msg = v.error;
  else if (typeof v?.msg === "string" && v.msg)
    msg = v.msg;
  else if (typeof v?.data?.msg === "string")
    msg = v.data.msg;
  const hint = isRefused ? REFUSED_HINT : isRestricted ? RESTRICTED_HINT : EXHAUSTED_HINT;
  const type = isRefused || isRestricted ? "permission_error" : "insufficient_quota";
  const errCode = isRefused ? null : isRestricted ? RESTRICTED_CODE : 14018;
  msg = `${msg} — ${hint}`;
  const headers = new Headers(res.headers);
  headers.set("content-type", "application/json");
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("X-Magpie-Sign-In", "kept");
  return new Response(JSON.stringify({ error: { message: msg, type, code: errCode } }), { status: res.status, statusText: res.statusText, headers });
}
var WorkBuddyAuthPlugin = makePlugin(SITES.workbuddy);
var WorkBuddyAIAuthPlugin = makePlugin(SITES["workbuddy-ai"]);

// src/providers/subscription-plugins/index.ts
import { createHash as createHash5, randomUUID as randomUUID2, timingSafeEqual } from "node:crypto";
import { chmod as chmod2, mkdir as mkdir3, readFile as readFile3, rename, unlink, writeFile as writeFile2 } from "node:fs/promises";
import { createServer } from "node:http";
import { join as join6, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
var FACTORIES = { cursor: CursorAuthPlugin, workbuddy: WorkBuddyAuthPlugin, "workbuddy-ai": WorkBuddyAIAuthPlugin };
var writes = new Map;
var contexts = new Map;
var MAX_BODY_BYTES = 16 * 1024 * 1024;
var SUBSCRIPTION_AUTH_FILE = "plugin-auth.json";
function isSubscriptionUpstream(value) {
  return value === "cursor" || value === "workbuddy" || value === "workbuddy-ai";
}
function authPath(directory) {
  return join6(resolve(directory), SUBSCRIPTION_AUTH_FILE);
}
async function readAuthFile(file, upstream) {
  let text;
  try {
    text = await readFile3(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT")
      return;
    throw error;
  }
  let stored;
  try {
    stored = JSON.parse(text);
  } catch {
    throw new Error("Subscription login file is invalid; sign in again.");
  }
  if (stored?.version !== 1 || stored.upstream !== upstream || stored.auth?.type !== "oauth") {
    throw new Error("Subscription login file does not match this provider; sign in again.");
  }
  return stored.auth;
}
async function getAuth(directory, upstream) {
  const file = authPath(directory);
  await writes.get(file);
  return readAuthFile(file, upstream);
}
async function saveAuth(directory, upstream, update, replace = false) {
  const file = authPath(directory);
  const previous = writes.get(file) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const old = replace ? undefined : await readAuthFile(file, upstream);
    if (!replace && old?.source === "desktop")
      return;
    const auth = { ...old, ...update, type: "oauth" };
    await mkdir3(resolve(directory), { recursive: true, mode: 448 });
    const temporary = `${file}.${process.pid}.${randomUUID2()}.tmp`;
    try {
      await writeFile2(temporary, JSON.stringify({ version: 1, upstream, auth }, null, 2) + `
`, { mode: 384 });
      await rename(temporary, file);
      await chmod2(file, 384);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  });
  writes.set(file, next);
  try {
    await next;
  } finally {
    if (writes.get(file) === next)
      writes.delete(file);
  }
}
async function context(directory, upstream, options) {
  const key = `${resolve(directory)}
${upstream}`;
  const create = async () => {
    const plugin = await (options.pluginFactory ?? FACTORIES[upstream])({
      client: { auth: { set: async ({ path, body }) => {
        if (path.id !== upstream)
          throw new Error("Plugin attempted to update a different provider's login.");
        await saveAuth(directory, upstream, body);
      } } }
    });
    if (plugin.auth.provider !== upstream)
      throw new Error("Subscription plugin provider mismatch.");
    const config = { provider: {} };
    await plugin.config?.(config);
    return {
      plugin,
      provider: { ...config.provider[upstream], id: upstream, models: config.provider[upstream]?.models ?? {} },
      getAuth: () => getAuth(directory, upstream)
    };
  };
  if (options.pluginFactory)
    return create();
  let pending = contexts.get(key);
  if (!pending) {
    pending = create();
    contexts.set(key, pending);
    pending.catch(() => {
      if (contexts.get(key) === pending)
        contexts.delete(key);
    });
  }
  return pending;
}
async function subscriptionLoginMethods(directory, upstream, options = {}) {
  const { plugin } = await context(directory, upstream, options);
  return plugin.auth.methods.filter((method) => method.type === "oauth" && method.authorize).map(({ label }) => ({ label: /desktop|cursor-agent/i.test(label) ? `${label} (follows the app account)` : label }));
}
function identity(upstream, auth) {
  let subject;
  if (typeof auth.access === "string") {
    try {
      const claims = JSON.parse(Buffer.from(auth.access.split(".")[1] ?? "", "base64url").toString("utf8"));
      subject = claims.sub;
    } catch {}
  }
  const account = [auth.uid, auth.accountId, subject].map((value) => typeof value === "number" && Number.isFinite(value) ? String(value) : value).find((value) => typeof value === "string" && value.length > 0);
  if (typeof account !== "string")
    throw new Error("Subscription sign-in did not identify the account.");
  return createHash5("sha256").update(`${upstream}
${account}`).digest("hex");
}
async function loginSubscriptionPlugin(directory, upstream, methodIndex, notify, options = {}) {
  const { plugin } = await context(directory, upstream, options);
  const methods = plugin.auth.methods.filter((method2) => method2.type === "oauth" && method2.authorize);
  const method = Number.isInteger(methodIndex) ? methods[methodIndex] : undefined;
  if (!method?.authorize)
    throw new Error("Unknown subscription login method.");
  if (/desktop|cursor-agent/i.test(method.label))
    notify("This login follows the account currently signed in to the native app, including later account switches.");
  const authorization = await method.authorize();
  if (authorization.instructions)
    notify(authorization.instructions);
  if (authorization.url) {
    if (new URL(authorization.url).protocol !== "https:")
      throw new Error("Subscription sign-in URL must use HTTPS.");
    notify(authorization.url);
    (options.openUrl ?? ((url) => openExternalUrl(url, true)))(authorization.url);
  }
  if (authorization.method && authorization.method !== "auto")
    throw new Error("This subscription sign-in requires an unsupported manual callback.");
  const result2 = await authorization.callback();
  if (result2.type !== "success")
    throw new Error(result2.error || "Subscription sign-in failed.");
  const { type: _type, error: _error, ...fields2 } = result2;
  const auth = { ...fields2, type: "oauth" };
  if (auth.source === "desktop") {
    auth.access = "";
    auth.refresh = "";
    auth.expires = 0;
  }
  const fingerprint = identity(upstream, auth);
  await saveAuth(directory, upstream, auth, true);
  return fingerprint;
}
async function hasSubscriptionLogin(directory, upstream) {
  try {
    const auth = await getAuth(directory, upstream);
    return !!auth && (!!auth.access || auth.source === "desktop" || upstream === "cursor" && auth.refresh === "cursor-agent");
  } catch {
    return false;
  }
}
async function models(ctx) {
  const auth = await ctx.getAuth();
  if (!auth)
    throw new Error("Subscription is not signed in.");
  const catalog2 = ctx.plugin.provider ? await ctx.plugin.provider.models(ctx.provider, { auth }) : ctx.provider.models;
  if (!Object.keys(catalog2).length || ctx.plugin.provider && catalog2 === ctx.provider.models) {
    throw new Error("Subscription model catalog is unavailable; retry after checking the account sign-in.");
  }
  return Object.entries(catalog2).map(([id, value]) => {
    const context2 = value.limit?.context;
    return {
      id,
      ...value.name ? { display_name: value.name } : {},
      ...typeof context2 === "number" && Number.isSafeInteger(context2) && context2 > 0 ? { context_window: context2 } : {}
    };
  });
}
async function listSubscriptionModels(directory, upstream, options = {}) {
  return models(await context(directory, upstream, options));
}
function authorized(headers, key) {
  const bearer = headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : headers.get("x-api-key");
  if (typeof token !== "string")
    return false;
  const expected = Buffer.from(key);
  const actual = Buffer.from(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function json(status, body) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

class HTTPError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
async function requestBody(request2) {
  if (Number(request2.headers["content-length"]) > MAX_BODY_BYTES)
    throw new HTTPError(413, "Request body is too large.");
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    const cleanup = () => {
      request2.removeListener("data", data);
      request2.removeListener("end", end);
      request2.removeListener("error", fail);
      request2.removeListener("aborted", aborted);
    };
    const fail = (error) => {
      cleanup();
      reject(error);
    };
    const aborted = () => fail(new Error("Request aborted."));
    const data = (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        request2.pause();
        fail(new HTTPError(413, "Request body is too large."));
      } else
        chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      resolveBody(Buffer.concat(chunks).toString("utf8"));
    };
    request2.on("data", data);
    request2.once("end", end);
    request2.once("error", fail);
    request2.once("aborted", aborted);
  });
}
async function webRequestBody(request2) {
  if (!request2.body)
    return "";
  const reader = request2.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;; ) {
      const { value, done } = await reader.read();
      if (done)
        return Buffer.concat(chunks).toString("utf8");
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        throw new HTTPError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}
var HOP_HEADERS = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "content-length", "content-encoding"]);
async function bridgeResponse(input, ctx, pluginFetch, endpoint, options) {
  if (!authorized(input.headers, options.apiKey))
    return json(401, { error: { message: "Invalid API key." } });
  const path = new URL(input.url, "http://127.0.0.1").pathname;
  if (input.method === "GET" && path === "/health")
    return json(200, { status: "ok", upstream: options.upstream });
  if (input.method === "GET" && path === "/v1/models") {
    return json(200, { object: "list", data: (await models(ctx)).map((model) => ({ ...model, object: "model", owned_by: options.upstream })) });
  }
  if (input.method !== "POST" || path !== "/v1/chat/completions")
    return json(404, { error: { message: "Unknown endpoint." } });
  if (Number(input.headers.get("content-length")) > MAX_BODY_BYTES)
    throw new HTTPError(413, "Request body is too large.");
  const body = await input.body();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES)
    throw new HTTPError(413, "Request body is too large.");
  let chat;
  try {
    chat = JSON.parse(body);
  } catch {
    throw new HTTPError(400, "Request body must be valid JSON.");
  }
  if (!chat || typeof chat !== "object" || Array.isArray(chat))
    throw new HTTPError(400, "Request body must be a JSON object.");
  const headers = { "content-type": "application/json" };
  const session = input.headers.get("x-claudex-session");
  if (session)
    await ctx.plugin["chat.headers"]?.({ sessionID: session.slice(0, 256), model: { providerID: options.upstream } }, { headers });
  const upstream = await pluginFetch(endpoint, { method: "POST", headers, body, signal: input.signal });
  const responseHeaders = new Headers;
  const connectionHeaders = new Set((upstream.headers.get("connection") ?? "").toLowerCase().split(",").map((h) => h.trim()));
  upstream.headers.forEach((value, name) => {
    if (!HOP_HEADERS.has(name) && !connectionHeaders.has(name))
      responseHeaders.set(name, value);
  });
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
}
function failure2(error) {
  const result2 = json(error instanceof HTTPError ? error.status : 502, { error: { message: error instanceof HTTPError ? error.message : "Subscription upstream request failed." } });
  if (error instanceof HTTPError && error.status === 413)
    result2.headers.set("connection", "close");
  return result2;
}
async function serveSubscriptionBridge(options) {
  if (!options.apiKey)
    throw new Error("Subscription bridge requires an API key.");
  const ctx = await context(options.directory, options.upstream, options);
  const loader = await ctx.plugin.auth.loader(ctx.getAuth);
  if (!loader.fetch || !loader.baseURL)
    throw new Error("Subscription is not signed in.");
  const pluginFetch = loader.fetch;
  const endpoint = `${loader.baseURL.replace(/\/$/, "")}/chat/completions`;
  if (typeof Bun !== "undefined") {
    const native = Bun.serve({
      hostname: "127.0.0.1",
      port: options.port,
      idleTimeout: 0,
      maxRequestBodySize: MAX_BODY_BYTES + 64 * 1024,
      fetch: async (request2) => {
        try {
          return await bridgeResponse({ method: request2.method, url: request2.url, headers: request2.headers, body: () => webRequestBody(request2), signal: request2.signal }, ctx, pluginFetch, endpoint, options);
        } catch (error) {
          if (request2.signal.aborted)
            return new Response(null, { status: 499 });
          return failure2(error);
        }
      },
      error: () => failure2(new Error("HTTP request failed."))
    });
    let closing = false;
    return {
      address: () => closing ? null : { address: "127.0.0.1", family: "IPv4", port: native.port },
      close: (callback) => {
        closing = true;
        native.stop(false).then(() => callback?.(), (error) => callback?.(error));
      },
      closeAllConnections: () => {
        closing = true;
        native.stop(true);
      }
    };
  }
  const server = createServer(async (request2, response) => {
    const abort = new AbortController;
    const disconnected = () => {
      if (!response.writableFinished)
        abort.abort();
    };
    request2.once("aborted", disconnected);
    response.once("close", disconnected);
    request2.socket.once("close", disconnected);
    try {
      const headers = new Headers;
      for (const [name, value] of Object.entries(request2.headers)) {
        if (value !== undefined)
          headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
      const upstream = await bridgeResponse({ method: request2.method ?? "GET", url: request2.url ?? "/", headers, body: () => requestBody(request2), signal: abort.signal }, ctx, pluginFetch, endpoint, options);
      const responseHeaders = {};
      upstream.headers.forEach((value, name) => {
        responseHeaders[name] = value;
      });
      response.writeHead(upstream.status, responseHeaders);
      if (upstream.body) {
        await pipeline(Readable.fromWeb(upstream.body), response, { signal: abort.signal });
      } else
        response.end();
    } catch (error) {
      if (abort.signal.aborted || response.destroyed)
        return;
      if (response.headersSent)
        response.destroy();
      else {
        if (error instanceof HTTPError && error.status === 413) {
          response.shouldKeepAlive = false;
          response.once("finish", () => request2.destroy());
        }
        const result2 = failure2(error);
        response.writeHead(result2.status, Object.fromEntries(result2.headers));
        response.end(await result2.text());
      }
    } finally {
      request2.removeListener("aborted", disconnected);
      response.removeListener("close", disconnected);
      request2.socket.removeListener("close", disconnected);
    }
  });
  server.requestTimeout = 60000;
  server.headersTimeout = 15000;
  await new Promise((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(options.port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolveListening();
    });
  });
  return server;
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
function success2(text) {
  console.log(`  ${icons.success} ${text}`);
}
function error(text) {
  console.error(`  ${icons.error} ${source_default.red(text)}`);
}
function warn(text) {
  console.log(`  ${source_default.yellow("⚠")} ${source_default.yellow(text)}`);
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
    case "local-cliproxyapi":
      return source_default.green("local CLIProxyAPI");
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
  switch (provider) {
    case "claude":
      return source_default.magenta("Claude");
    case "codex":
      return source_default.green("Codex");
    case "opencode":
      return source_default.cyan("OpenCode");
  }
}
function maskKey(key) {
  if (key.length <= 12)
    return "••••";
  return key.slice(0, 7) + "••••" + key.slice(-4);
}
function formatUsage(usage2, note) {
  if (usage2) {
    const parts = [];
    if (usage2.fiveHourUsedPercent !== null) {
      parts.push(`${source_default.dim("5h")} ${colorRemaining(100 - usage2.fiveHourUsedPercent)}`);
    }
    if (usage2.weeklyUsedPercent !== null) {
      parts.push(`${source_default.dim("wk")} ${colorRemaining(100 - usage2.weeklyUsedPercent)}${formatWeeklyReset(usage2.weeklyResetsAt)}`);
    }
    if (usage2.monthlyUsedPercent !== null && usage2.monthlyUsedPercent !== undefined) {
      parts.push(`${source_default.dim("mo")} ${colorRemaining(100 - usage2.monthlyUsedPercent)}`);
    }
    if (parts.length > 0)
      return parts.join(source_default.dim(" · "));
  }
  return note ? source_default.dim(note) : "";
}
var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function formatWeeklyReset(resetsAt) {
  if (resetsAt === null || !Number.isFinite(resetsAt))
    return "";
  const date = new Date(Math.round(resetsAt / 3600000) * 3600000);
  const hour = String(date.getHours()).padStart(2, "0");
  return ` ${source_default.dim(`${WEEKDAYS[date.getDay()]}${hour}`)}`;
}
function colorRemaining(percent) {
  const value = Math.round(Math.min(100, Math.max(0, percent)));
  const text = `${value}%`;
  if (value >= 50)
    return source_default.green(text);
  if (value >= 20)
    return source_default.yellow(text);
  return source_default.red(text);
}
function formatBalance(balance) {
  if (!balance)
    return "";
  const keyPart = formatBalanceSide(balance.key);
  const acctPart = formatBalanceSide(balance.account);
  if (keyPart && acctPart) {
    return [
      `${source_default.dim("key")} ${keyPart}`,
      `${source_default.dim("acct")} ${acctPart}`
    ].join(source_default.dim(" · "));
  }
  return keyPart || acctPart;
}
function formatBalanceSide(side) {
  if (!side)
    return "";
  const dollars2 = (v) => `$${v.toFixed(2)}`;
  if (side.unlimited) {
    return side.usedUsd === null ? source_default.dim("∞") : source_default.dim(`${dollars2(side.usedUsd)} used`);
  }
  if (side.remainingUsd === null)
    return "";
  const colored = side.remainingUsd >= 10 ? source_default.green(dollars2(side.remainingUsd)) : side.remainingUsd >= 1 ? source_default.yellow(dollars2(side.remainingUsd)) : source_default.red(dollars2(side.remainingUsd));
  return `${colored} ${source_default.dim("left")}`;
}

// src/providers/cliproxyapi/managed.ts
var CLI_PROXY_API_DEFAULTS = {
  ...CLI_PROXY_API_UPSTREAMS.codex.defaults,
  subagentModel: "claudex-terra-max"
};
var ENV_CLIENT_KEY = "CLAUDEX_CLIPROXYAPI_CLIENT_API_KEY";
var ENV_FABLE_MODEL = "CLAUDEX_CLIPROXYAPI_FABLE_MODEL";
var ENV_SONNET_MODEL = "CLAUDEX_CLIPROXYAPI_SONNET_MODEL";
var ENV_OPUS_MODEL = "CLAUDEX_CLIPROXYAPI_OPUS_MODEL";
var ENV_HAIKU_MODEL = "CLAUDEX_CLIPROXYAPI_HAIKU_MODEL";
var ENV_UPSTREAM = "CLAUDEX_CLIPROXYAPI_UPSTREAM";
var ENV_UPSTREAM_KEY = "CLAUDEX_CLIPROXYAPI_UPSTREAM_KEY";
var ENV_UPSTREAM_MODELS = "CLAUDEX_CLIPROXYAPI_UPSTREAM_MODELS";
var ENV_SUBSCRIPTION_PORT = "CLAUDEX_CLIPROXYAPI_SUBSCRIPTION_PORT";
var ENV_UPSTREAM_CONTEXT = "CLAUDEX_CLIPROXYAPI_UPSTREAM_CONTEXT";
var ENV_ANTIGRAVITY_SENSITIVE_WORDS = "CLAUDEX_CLIPROXYAPI_ANTIGRAVITY_SENSITIVE_WORDS";
var ANTIGRAVITY_SENSITIVE_WORDS = ["Claude Agent SDK", "Claude Code"];
var LEGACY_HAIKU_DEFAULT = "gpt-5.6-luna";
var STARTUP_TIMEOUT_MS = 12000;
var ANTIGRAVITY_CATALOG = { settleMs: 12000 };
var settledAntigravityDaemons = new Set;
var LOCK_TIMEOUT_MS = 20000;
var ORPHAN_LOCK_GRACE_MS = 60000;
var LOCK_HEARTBEAT_MS = 1e4;
var LOOPBACK_HOST = "127.0.0.1";
var PROFILE_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function assertProfileId(profileId) {
  if (!PROFILE_ID_PATTERN.test(profileId)) {
    throw new Error("Invalid managed CLIProxyAPI profile id");
  }
}
function profilePaths(profileId) {
  assertProfileId(profileId);
  return {
    dir: cliProxyAPIProfileDir(profileId),
    authDir: cliProxyAPIAuthDir(profileId),
    envFile: cliProxyAPIEnvFile(profileId),
    configFile: cliProxyAPIConfigFile(profileId),
    claudeSettingsFile: cliProxyAPIClaudeSettingsFile(profileId),
    stateFile: cliProxyAPIStateFile(profileId),
    sessionsDir: cliProxyAPISessionsDir(profileId),
    lock: cliProxyAPIStartupLock(profileId)
  };
}
async function mkdirPrivate(path) {
  await mkdir4(path, { recursive: true, mode: 448 });
  try {
    await chmod3(path, 448);
  } catch {}
}
async function writePrivate(path, data) {
  await writeFile3(path, data, { mode: 384 });
  try {
    await chmod3(path, 384);
  } catch {}
}
async function writePrivateOnce(path, data) {
  try {
    await writeFile3(path, data, { mode: 384, flag: "wx" });
    try {
      await chmod3(path, 384);
    } catch {}
    return true;
  } catch (err) {
    if (err.code === "EEXIST")
      return false;
    throw err;
  }
}
async function writePrivateJson(path, data) {
  await writeJsonSecure(path, data);
  try {
    await chmod3(path, 384);
  } catch {}
}
function requireEnvValue(values, key) {
  const value = values[key]?.trim();
  if (!value) {
    throw new Error(`Managed CLIProxyAPI configuration is missing ${key}`);
  }
  return value;
}
function parseManagedEnv(content) {
  const values = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#"))
      continue;
    const separator = line.indexOf("=");
    if (separator <= 0)
      continue;
    values[line.slice(0, separator)] = line.slice(separator + 1);
  }
  const upstream = parseUpstream(values[ENV_UPSTREAM]?.trim());
  const defaults = CLI_PROXY_API_UPSTREAMS[upstream].defaults;
  const upstreamKey = values[ENV_UPSTREAM_KEY]?.trim() || null;
  const subscriptionPort = values[ENV_SUBSCRIPTION_PORT] ? Number(values[ENV_SUBSCRIPTION_PORT]) : null;
  if (subscriptionPort !== null && (!Number.isInteger(subscriptionPort) || subscriptionPort < 1 || subscriptionPort > 65535)) {
    throw new Error("Invalid subscription bridge port");
  }
  if (upstream === "opencode-go" && !upstreamKey) {
    throw new Error(`Managed CLIProxyAPI configuration is missing ${ENV_UPSTREAM_KEY}`);
  }
  return {
    apiKey: requireEnvValue(values, ENV_CLIENT_KEY),
    upstream,
    upstreamKey,
    subscriptionPort,
    antigravitySensitiveWords: (values[ENV_ANTIGRAVITY_SENSITIVE_WORDS] ?? ANTIGRAVITY_SENSITIVE_WORDS.join(",")).split(",").map((word) => word.trim()).filter(Boolean),
    upstreamModels: (values[ENV_UPSTREAM_MODELS] ?? "").split(",").map((model) => model.trim()).filter(Boolean),
    upstreamContext: values[ENV_UPSTREAM_CONTEXT] === undefined ? null : Object.fromEntries(values[ENV_UPSTREAM_CONTEXT].split(",").flatMap((pair) => {
      const separator = pair.lastIndexOf("=");
      const tokens = Number(pair.slice(separator + 1));
      return separator > 0 && Number.isSafeInteger(tokens) && tokens > 0 ? [[pair.slice(0, separator).trim(), tokens]] : [];
    })),
    fableModel: values[ENV_FABLE_MODEL]?.trim() || defaults.fableModel,
    sonnetModel: values[ENV_SONNET_MODEL]?.trim() || defaults.sonnetModel,
    opusModel: values[ENV_OPUS_MODEL]?.trim() || defaults.opusModel,
    haikuModel: currentHaikuModel(upstream, values[ENV_HAIKU_MODEL])
  };
}
function currentHaikuModel(upstream, value) {
  const model = value?.trim();
  const fallback = CLI_PROXY_API_UPSTREAMS[upstream].defaults.haikuModel;
  if (!model || upstream === "codex" && model === LEGACY_HAIKU_DEFAULT) {
    return fallback;
  }
  return model;
}
function renderManagedEnv(apiKey, setup = { upstream: "codex" }) {
  const models2 = setup.models ?? CLI_PROXY_API_UPSTREAMS[setup.upstream].defaults;
  return [
    "# Managed by claudex-switch. Keep this directory private.",
    `${ENV_CLIENT_KEY}=${apiKey}`,
    ...setup.upstream === "codex" ? [] : [`${ENV_UPSTREAM}=${setup.upstream}`],
    ...setup.upstream === "antigravity" ? [
      `${ENV_ANTIGRAVITY_SENSITIVE_WORDS}=${(setup.antigravitySensitiveWords ?? ANTIGRAVITY_SENSITIVE_WORDS).join(",")}`
    ] : [],
    ...setup.upstreamKey ? [`${ENV_UPSTREAM_KEY}=${setup.upstreamKey}`] : [],
    ...setup.subscriptionPort ? [`${ENV_SUBSCRIPTION_PORT}=${setup.subscriptionPort}`] : [],
    ...setup.upstreamModels?.length ? [`${ENV_UPSTREAM_MODELS}=${setup.upstreamModels.join(",")}`] : [],
    ...setup.upstreamContext ? [`${ENV_UPSTREAM_CONTEXT}=${Object.entries(setup.upstreamContext).map(([id, tokens]) => `${id}=${tokens}`).join(",")}`] : [],
    `${ENV_FABLE_MODEL}=${models2.fableModel}`,
    `${ENV_SONNET_MODEL}=${models2.sonnetModel}`,
    `${ENV_OPUS_MODEL}=${models2.opusModel}`,
    `${ENV_HAIKU_MODEL}=${models2.haikuModel}`,
    ""
  ].join(`
`);
}
function yaml(value) {
  return JSON.stringify(value);
}
function renderRuntimeConfig(authDir, managed, port) {
  const header2 = [
    `host: ${yaml(LOOPBACK_HOST)}`,
    `port: ${port}`,
    `auth-dir: ${yaml(authDir)}`,
    "api-keys:",
    `  - ${yaml(managed.apiKey)}`,
    "remote-management:",
    "  allow-remote: false",
    '  secret-key: ""',
    "  disable-control-panel: true",
    "logging-to-file: false",
    "usage-statistics-enabled: false"
  ];
  if (isSubscriptionUpstream(managed.upstream)) {
    if (!managed.subscriptionPort || !managed.upstreamModels.length) {
      throw new Error("Subscription models and bridge port must be discovered before proxy startup.");
    }
    return [
      ...header2,
      "openai-compatibility:",
      `  - name: ${yaml(managed.upstream)}`,
      `    base-url: ${yaml(`${baseUrl(managed.subscriptionPort)}/v1`)}`,
      "    headers:",
      `      x-claudex-session: ${yaml("$X-Claude-Code-Session-Id")}`,
      "    api-key-entries:",
      `      - api-key: ${yaml(managed.apiKey)}`,
      "    models:",
      ...managed.upstreamModels.flatMap((id) => [`      - name: ${yaml(id)}`, `        alias: ${yaml(id)}`]),
      ""
    ].join(`
`);
  }
  if (managed.upstream === "antigravity") {
    return [
      ...header2,
      "antigravity:",
      ...managed.antigravitySensitiveWords.length ? ["  sensitive-words:", ...managed.antigravitySensitiveWords.map((word) => `    - ${yaml(word)}`)] : ["  sensitive-words: []"],
      ""
    ].join(`
`);
  }
  if (managed.upstream === "opencode-go") {
    return [...header2, ...renderOpenCodeGoUpstream(managed), ""].join(`
`);
  }
  return [
    ...header2,
    "oauth-model-alias:",
    "  codex:",
    `    - name: ${yaml("gpt-5.6-terra")}`,
    `      alias: ${yaml(CLI_PROXY_API_DEFAULTS.subagentModel)}`,
    "      fork: true",
    "payload:",
    "  override:",
    "    - models:",
    `        - name: ${yaml(CLI_PROXY_API_DEFAULTS.subagentModel)}`,
    '          protocol: "codex"',
    "      params:",
    '        "reasoning.effort": "max"',
    ""
  ].join(`
`);
}
function renderOpenCodeGoUpstream(managed) {
  const key = managed.upstreamKey ?? "";
  const models2 = [
    ...new Set([
      managed.fableModel,
      managed.opusModel,
      managed.sonnetModel,
      managed.haikuModel,
      ...managed.upstreamModels
    ])
  ];
  const chat = models2.filter((model) => !isOpenCodeGoMessagesModel(model));
  const messages = models2.filter(isOpenCodeGoMessagesModel);
  const modelLines = (list, indent) => list.flatMap((model) => [
    `${indent}- name: ${yaml(model)}`,
    `${indent}  alias: ${yaml(model)}`
  ]);
  const sessionHeader = [
    "    headers:",
    `      ${yaml("x-opencode-session")}: ${yaml("$X-Claude-Code-Session-Id")}`
  ];
  const lines = [];
  if (chat.length > 0) {
    lines.push("openai-compatibility:", `  - name: ${yaml("opencode-go")}`, `    base-url: ${yaml(OPENCODE_GO_OPENAI_BASE_URL)}`, ...sessionHeader, "    api-key-entries:", `      - api-key: ${yaml(key)}`, "    models:", ...modelLines(chat, "      "));
  }
  if (messages.length > 0) {
    lines.push("claude-api-key:", `  - api-key: ${yaml(key)}`, `    base-url: ${yaml(OPENCODE_GO_ANTHROPIC_BASE_URL)}`, ...sessionHeader, `      ${yaml("x-api-key")}: ${yaml(key)}`, "    models:", ...modelLines(messages, "      "));
  }
  return lines;
}
function createManagedCLIProxyAPIProfileId() {
  return randomUUID3();
}
async function initializeManagedCLIProxyAPI(profileId, setup = { upstream: "codex" }) {
  const paths = profilePaths(profileId);
  await mkdirPrivate(paths.dir);
  await mkdirPrivate(paths.authDir);
  const apiKey = randomBytes4(32).toString("base64url");
  await writePrivateOnce(paths.envFile, renderManagedEnv(apiKey, setup));
}
async function updateManagedCLIProxyAPISetup(profileId, patch) {
  const paths = profilePaths(profileId);
  const current2 = await readExistingManagedEnv(profileId);
  await writePrivate(paths.envFile, renderManagedEnv(current2.apiKey, {
    upstream: current2.upstream,
    models: patch.models ?? current2,
    upstreamKey: patch.upstreamKey ?? current2.upstreamKey ?? undefined,
    upstreamModels: patch.upstreamModels ?? current2.upstreamModels,
    upstreamContext: patch.upstreamContext ?? current2.upstreamContext ?? undefined,
    antigravitySensitiveWords: patch.antigravitySensitiveWords ?? current2.antigravitySensitiveWords,
    subscriptionPort: patch.subscriptionPort ?? current2.subscriptionPort ?? undefined
  }));
}
async function readManagedCLIProxyAPIUpstream(profileId) {
  try {
    const config = await readManagedEnv(profileId);
    return { upstream: config.upstream, upstreamKey: config.upstreamKey };
  } catch {
    return null;
  }
}
async function readManagedEnv(profileId) {
  const paths = profilePaths(profileId);
  const content = await readFile4(paths.envFile, "utf-8");
  return parseManagedEnv(content);
}
async function readExistingManagedEnv(profileId) {
  const paths = profilePaths(profileId);
  if (!await fileExists(paths.envFile)) {
    throw new Error("Managed CLIProxyAPI data is missing. The account may have been purged; add it again instead of recreating its private login state.");
  }
  try {
    return await readManagedEnv(profileId);
  } catch {
    throw new Error("Managed CLIProxyAPI private environment is invalid. Do not recreate it automatically; add the account again.");
  }
}
async function writeRuntimeConfig(profileId, port) {
  const paths = profilePaths(profileId);
  const config = await readManagedEnv(profileId);
  await writePrivate(paths.configFile, renderRuntimeConfig(paths.authDir, config, port));
  return config;
}
async function isExpectedRuntimeConfig(paths, state, managed) {
  if (!managed)
    return false;
  try {
    const raw = await readFile4(paths.configFile, "utf-8");
    const configuredPort = raw.match(/^port:\s*(\d+)\s*$/m)?.[1];
    const port = state?.port ?? Number(configuredPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      return false;
    return raw === renderRuntimeConfig(paths.authDir, managed, port);
  } catch {
    return false;
  }
}
async function getLocalCLIProxyAPISettings(profile, runtime) {
  const config = await readManagedEnv(profile.profileId);
  return {
    apiKey: runtime.apiKey,
    baseUrl: runtime.baseUrl,
    model: await resolveManagedLocalCLIProxyAPIDefaultModel(profile),
    fableModel: config.fableModel,
    sonnetModel: config.sonnetModel,
    opusModel: config.opusModel,
    haikuModel: config.haikuModel,
    subagentModel: config.upstream === "codex" ? CLI_PROXY_API_DEFAULTS.subagentModel : null
  };
}
var CLAUDE_CODE_MODEL_IDS = ["claude-fable-5-1", "claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"];
function antigravityModelOverrides(ids, tiers, savedModel) {
  const overrides = {};
  for (const id of ids) {
    const bare = antigravityModelBase(id);
    if (bare !== id && !ids.includes(bare))
      overrides[bare] = matchAntigravityModel(bare, ids);
  }
  for (const id of ids) {
    const family = id.match(/^claude-(fable|opus|sonnet|haiku)-/i)?.[1]?.toLowerCase();
    if (family && isSupersededAntigravityClaude(id, ids)) {
      overrides[id] = resolveLocalCLIProxyAPIModelFromConfig(family, tiers);
      const bare = antigravityModelBase(id);
      if (overrides[bare])
        overrides[bare] = overrides[id];
    }
  }
  for (const id of [...CLAUDE_CODE_MODEL_IDS, typeof savedModel === "string" ? savedModel.trim() : ""]) {
    const family = id.match(/^claude-(fable|opus|sonnet|haiku)-\d/i)?.[1]?.toLowerCase();
    if (!family || ids.includes(id) || overrides[id])
      continue;
    overrides[id] = matchAntigravityModel(id, ids) ?? resolveLocalCLIProxyAPIModelFromConfig(family, tiers);
  }
  return overrides;
}
var WORKBUDDY_AUTO_MODE_MODEL = "deepseek-v4.1-flash";
async function prepareLocalCLIProxyAPIClaudeSettings(profile, runtime, options = {}) {
  const config = await getLocalCLIProxyAPISettings(profile, runtime);
  const paths = profilePaths(profile.profileId);
  const env3 = {
    ...localCLIProxyAPIAuthEnv(config.apiKey),
    ANTHROPIC_BASE_URL: config.baseUrl,
    ANTHROPIC_MODEL: options.inheritModel ? "" : config.model,
    ANTHROPIC_DEFAULT_FABLE_MODEL: config.fableModel,
    ANTHROPIC_DEFAULT_SONNET_MODEL: config.sonnetModel,
    ANTHROPIC_DEFAULT_OPUS_MODEL: config.opusModel,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: config.haikuModel,
    CLAUDE_CODE_SUBAGENT_MODEL: config.subagentModel ?? "",
    CLAUDE_CODE_SUBAGENT_MODEL_FORCE: config.subagentModel ? "1" : ""
  };
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    env3[key] = "";
  }
  const overrides = runtime.models ? profile.upstream === "antigravity" ? antigravityModelOverrides(runtime.models.map(({ id }) => id), config, options.savedModel) : subscriptionModelOverrides(runtime.models.map(({ id }) => id), config, options.savedModel) : {};
  const windows = runtime.models && isSubscriptionUpstream(profile.upstream) ? subscriptionCompactWindows((await readExistingManagedEnv(profile.profileId)).upstreamContext ?? {}, runtime.models.map(({ id }) => id), overrides) : null;
  if (windows)
    env3.CLAUDE_CODE_MAX_CONTEXT_TOKENS = String(windows.maxContext);
  if ((profile.upstream === "workbuddy" || profile.upstream === "workbuddy-ai") && runtime.models?.some(({ id }) => id === WORKBUDDY_AUTO_MODE_MODEL)) {
    env3.CLAUDE_CODE_AUTO_MODE_MODEL = WORKBUDDY_AUTO_MODE_MODEL;
  }
  for (const [key, value] of Object.entries(localCLIProxyAPIExtraEnv(profile.env))) {
    env3[key] = value;
  }
  await writePrivateJson(paths.claudeSettingsFile, {
    model: options.inheritModel ? undefined : config.model,
    ...runtime.models ? {
      modelPicker: {
        replaceBuiltInOptions: true,
        options: runtime.models.filter((model) => !/image/i.test(model.id) && (profile.upstream !== "antigravity" || !isSupersededAntigravityClaude(model.id, runtime.models.map(({ id }) => id)))).map((model) => ({
          model: model.id,
          label: model.display_name ?? model.id,
          description: `${CLI_PROXY_API_UPSTREAMS[profile.upstream ?? "codex"].label} · ${model.id}`
        }))
      },
      modelOverrides: overrides,
      ...windows ? { modelSettings: windows.modelSettings } : {}
    } : {},
    env: env3
  });
  return paths.claudeSettingsFile;
}
var UNKNOWN_MODEL_WINDOW = 200000;
var MIN_COMPACT_WINDOW = 1e5;
var MAX_COMPACT_WINDOW = 1e6;
function subscriptionCompactWindows(context2, ids, overrides) {
  if (!ids.some((id) => context2[id]))
    return null;
  const windowOf = (id) => Math.min(MAX_COMPACT_WINDOW, Math.max(MIN_COMPACT_WINDOW, context2[id] ?? UNKNOWN_MODEL_WINDOW));
  const modelSettings = Object.fromEntries([
    ...ids.map((id) => [id, { autoCompactWindow: windowOf(id) }]),
    ...Object.entries(overrides).map(([id, target]) => [id, { autoCompactWindow: windowOf(target) }])
  ]);
  return { maxContext: Math.max(...ids.map(windowOf)), modelSettings };
}
function subscriptionModelOverrides(ids, tiers, savedModel) {
  const overrides = {};
  for (const id of [...CLAUDE_CODE_MODEL_IDS, ...savedModel ? [savedModel] : []]) {
    if (ids.includes(id))
      continue;
    const family = id.match(/^claude-(fable|opus|sonnet|haiku)(?:-|$)/i)?.[1]?.toLowerCase();
    overrides[id] = family ? tiers[`${family}Model`] : tiers.fableModel;
  }
  return overrides;
}
function resolveLocalCLIProxyAPIModelFromConfig(input, config) {
  const normalized = input.trim();
  switch (normalized.toLowerCase()) {
    case "fable":
      return config.fableModel;
    case "sonnet":
      return config.sonnetModel;
    case "opus":
      return config.opusModel;
    case "haiku":
      return config.haikuModel;
    default:
      return normalized;
  }
}
function resolveLocalCLIProxyAPIDefaultModelFromConfig(profile, config) {
  if (profile.defaultModel === CLI_PROXY_API_DEFAULTS.fableModel) {
    return config.fableModel;
  }
  return resolveLocalCLIProxyAPIModelFromConfig(profile.defaultModel, config);
}
async function resolveManagedLocalCLIProxyAPIModel(profile, input) {
  const config = await readExistingManagedEnv(profile.profileId);
  const model = resolveLocalCLIProxyAPIModelFromConfig(input, config);
  if (isSubscriptionUpstream(config.upstream)) {
    if (config.upstreamModels.includes(model))
      return model;
    throw new Error(`${CLI_PROXY_API_UPSTREAMS[config.upstream].label} model "${input}" is not in the account catalog. Use /model or one of: ${config.upstreamModels.join(", ")}`);
  }
  if (config.upstream !== "antigravity")
    return model;
  if (!config.upstreamModels.length) {
    throw new Error("Antigravity's model catalog has not been synchronized. Start this account with --run --cliproxy claudecode once before setting its default model.");
  }
  const matched = matchAntigravityModel(model, config.upstreamModels);
  if (matched)
    return matched;
  throw new Error(`Antigravity model "${input}" is not in the proxy catalog. Use /model or one of: ${config.upstreamModels.join(", ")}`);
}
async function resolveManagedLocalCLIProxyAPIDefaultModel(profile) {
  const config = await readExistingManagedEnv(profile.profileId);
  const model = resolveLocalCLIProxyAPIDefaultModelFromConfig(profile, config);
  if (isSubscriptionUpstream(config.upstream))
    return config.upstreamModels.includes(model) ? model : config.fableModel;
  if (config.upstream !== "antigravity")
    return model;
  return matchAntigravityModel(model, config.upstreamModels) ?? config.fableModel;
}
function baseUrl(port) {
  return `http://${LOOPBACK_HOST}:${port}`;
}
function credentialHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey
  };
}
async function probeProxy(port, apiKey) {
  const controller = new AbortController;
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${baseUrl(port)}/v1/models`, {
      headers: credentialHeaders(apiKey),
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
async function listManagedCLIProxyAPICatalog(runtime) {
  const controller = new AbortController;
  const timeout = setTimeout(() => controller.abort(), 1e4);
  try {
    const response = await fetch(`${runtime.baseUrl}/v1/models`, {
      headers: credentialHeaders(runtime.apiKey),
      signal: controller.signal
    });
    if (!response.ok)
      return [];
    const body = await response.json();
    const models2 = (body.data ?? []).flatMap((model) => typeof model.id === "string" && model.id.trim() ? [{ id: model.id, ...typeof model.display_name === "string" ? { display_name: model.display_name } : {} }] : []);
    return [...new Map(models2.map((model) => [model.id, model])).values()].sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
async function syncAntigravityModels(profileId, managed, runtime, startedAt) {
  if (isSubscriptionUpstream(managed.upstream)) {
    const catalog2 = await listManagedCLIProxyAPICatalog({ ...runtime, baseUrl: baseUrl(managed.subscriptionPort) });
    const models3 = catalog2.filter(({ id }) => managed.upstreamModels.includes(id));
    if (!models3.length)
      throw new Error("The subscription adapter has no available models. Check its login, then restart this account's proxy.");
    return { ...runtime, models: models3 };
  }
  if (managed.upstream !== "antigravity")
    return runtime;
  const hasClaude = (list) => list.some(({ id }) => /^claude-(opus|sonnet)-/i.test(id));
  const key = (list) => list.map(({ id }) => id).join(",");
  const daemon = `${profileId}:${startedAt}`;
  const settleUntil = settledAntigravityDaemons.has(daemon) ? 0 : startedAt + ANTIGRAVITY_CATALOG.settleMs;
  let models2 = await listManagedCLIProxyAPICatalog(runtime);
  let first = hasClaude(models2) ? key(models2) : null;
  for (let attempt = 0;; attempt += 1) {
    const young = Date.now() < settleUntil;
    if (hasClaude(models2) && (!young || key(models2) !== first))
      break;
    if (!young && attempt >= 3)
      break;
    await delay(250);
    models2 = await listManagedCLIProxyAPICatalog(runtime);
    first ??= hasClaude(models2) ? key(models2) : null;
  }
  settledAntigravityDaemons.add(daemon);
  const ids = [...new Set(models2.map((model) => model.id))];
  const mappings = reconcileAntigravityModels(ids, managed);
  if (Object.entries(mappings).some(([tier, id]) => managed[tier] !== id) || JSON.stringify(ids) !== JSON.stringify(managed.upstreamModels)) {
    await updateManagedCLIProxyAPISetup(profileId, { models: mappings, upstreamModels: ids });
  }
  return { ...runtime, models: models2 };
}
async function probeManagedCLIProxyAPILive(runtime, model) {
  const controller = new AbortController;
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${runtime.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        ...credentialHeaders(runtime.apiKey),
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "X-Claude-Code-Session-Id": randomUUID3()
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "Reply with OK." }]
      }),
      signal: controller.signal
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timeout);
  }
}
async function waitForProxy(port, apiKey) {
  const until = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < until) {
    if (await probeProxy(port, apiKey))
      return true;
    await delay(150);
  }
  return false;
}
function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}
async function portIsAvailable(port) {
  return new Promise((resolveAvailable) => {
    const server = createServer2();
    const closeAndResolve = (available) => {
      server.close(() => resolveAvailable(available));
    };
    server.once("error", () => resolveAvailable(false));
    server.listen({ host: LOOPBACK_HOST, port, exclusive: true }, () => {
      closeAndResolve(true);
    });
  });
}
async function findAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer2();
    server.once("error", reject);
    server.listen({ host: LOOPBACK_HOST, port: 0, exclusive: true }, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error2) => {
        if (error2) {
          reject(error2);
        } else if (port) {
          resolvePort(port);
        } else {
          reject(new Error("Could not allocate a loopback port"));
        }
      });
    });
  });
}
function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
async function processCommandLine(pid) {
  if (process.platform === "linux") {
    try {
      return (await readFile4(`/proc/${pid}/cmdline`, "utf-8")).replaceAll("\x00", " ");
    } catch {
      return null;
    }
  }
  try {
    const result2 = spawnSync4("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    if (result2.status !== 0)
      return null;
    return result2.stdout.trim() || null;
  } catch {
    return null;
  }
}
async function isOwnedProcess(state) {
  if (!isPidAlive(state.pid))
    return false;
  const command = await processCommandLine(state.pid);
  if (!command)
    return false;
  return command.includes(state.configPath) && command.includes(basename2(state.binaryPath));
}
async function readState(profileId) {
  const paths = profilePaths(profileId);
  const state = await readJson(paths.stateFile, null);
  if (!state || !Number.isInteger(state.pid) || !Number.isInteger(state.port) || state.port < 1 || state.port > 65535 || typeof state.binaryPath !== "string" || typeof state.configPath !== "string") {
    return null;
  }
  return state;
}
async function writeState(profileId, state) {
  const paths = profilePaths(profileId);
  await writePrivateJson(paths.stateFile, state);
}
async function withLock(lock, action) {
  const until = Date.now() + LOCK_TIMEOUT_MS;
  const token = randomUUID3();
  let createdAt = 0;
  await mkdirPrivate(dirname3(lock));
  for (;; ) {
    try {
      await mkdir4(lock, { mode: 448 });
      createdAt = Date.now();
      try {
        await writePrivateJson(join7(lock, "owner.json"), {
          pid: process.pid,
          token,
          createdAt,
          heartbeatAt: createdAt
        });
      } catch (err) {
        await rm2(lock, { recursive: true, force: true });
        throw err;
      }
      break;
    } catch (err) {
      const code = err.code;
      if (code !== "EEXIST")
        throw err;
      if (await canReclaimLock(lock)) {
        await rm2(lock, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= until) {
        throw new Error("Timed out waiting for another CLIProxyAPI operation");
      }
      await delay(75);
    }
  }
  const heartbeat = setInterval(() => {
    refreshOwnedLock(lock, token, createdAt);
  }, LOCK_HEARTBEAT_MS);
  try {
    return await action();
  } finally {
    clearInterval(heartbeat);
    await removeLockIfOwned(lock, token);
  }
}
async function refreshOwnedLock(lock, token, createdAt) {
  try {
    const owner = await readJson(join7(lock, "owner.json"), null);
    if (owner?.token !== token || owner.pid !== process.pid)
      return;
    await writePrivateJson(join7(lock, "owner.json"), {
      pid: process.pid,
      token,
      createdAt,
      heartbeatAt: Date.now()
    });
  } catch {}
}
async function removeLockIfOwned(lock, token) {
  try {
    const owner = await readJson(join7(lock, "owner.json"), null);
    if (owner?.token !== token || owner.pid !== process.pid)
      return;
    await rm2(lock, { recursive: true, force: true });
  } catch {}
}
async function canReclaimLock(lock) {
  const owner = await readJson(join7(lock, "owner.json"), null);
  if (owner && Number.isInteger(owner.pid) && owner.pid > 0) {
    return !isPidAlive(owner.pid);
  }
  try {
    const lockStat = await stat2(lock);
    return Date.now() - lockStat.mtimeMs > ORPHAN_LOCK_GRACE_MS;
  } catch {
    return false;
  }
}
async function withStartupLock(profileId, action) {
  return withLock(profilePaths(profileId).lock, action);
}
function proxyProcessEnvironment() {
  const env3 = { ...process.env };
  for (const key of [
    "OPENAI_API_KEY",
    "CODEX_API_KEY",
    "CODEX_ACCESS_TOKEN",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OPENCODE_API_KEY"
  ]) {
    delete env3[key];
  }
  for (const key of Object.keys(env3)) {
    const upper = key.toUpperCase();
    if (upper === "HOME_JWT" || upper === "MANAGEMENT_PASSWORD" || upper === "DEPLOY" || upper.startsWith("PGSTORE_") || upper.startsWith("GITSTORE_") || upper.startsWith("OBJECTSTORE_") || upper.startsWith("DEPLOY_")) {
      delete env3[key];
    }
  }
  return env3;
}
function startProxy(binaryPath, configPath, managedDirectory, spawnCommand = spawn, subscriptionProfileId) {
  const script = process.argv[1];
  const scriptEntrypoint = subscriptionProfileId && script && !script.includes("$bunfs") && (!process.versions.bun || /\.[cm]?[jt]s$/.test(realpathSync(script)));
  const args = subscriptionProfileId ? [
    ...scriptEntrypoint ? [resolve2(script)] : [],
    "__subscription-proxy",
    subscriptionProfileId,
    binaryPath,
    configPath
  ] : ["-config", configPath];
  const proc = spawnCommand(subscriptionProfileId ? process.execPath : binaryPath, args, {
    detached: true,
    stdio: "ignore",
    cwd: managedDirectory,
    env: proxyProcessEnvironment()
  });
  proc.on("error", () => {});
  proc.unref?.();
  return proc;
}
async function runManagedSubscriptionProxy(profileId, binaryPath, configPath) {
  const paths = profilePaths(profileId);
  const managed = await readExistingManagedEnv(profileId);
  if (resolve2(configPath) !== paths.configFile || !isSubscriptionUpstream(managed.upstream) || !managed.subscriptionPort) {
    throw new Error("Invalid managed subscription proxy invocation");
  }
  const server = await serveSubscriptionBridge({
    directory: paths.dir,
    upstream: managed.upstream,
    apiKey: managed.apiKey,
    port: managed.subscriptionPort
  });
  const child = spawn(binaryPath, ["-config", configPath], { cwd: paths.dir, stdio: "ignore", env: proxyProcessEnvironment() });
  let timer;
  const stop = () => {
    server.close();
    child.kill("SIGTERM");
    timer ??= setTimeout(() => child.kill("SIGKILL"), 3000);
    timer.unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  try {
    await new Promise((resolveExit, reject) => {
      child.once("error", reject);
      child.once("exit", () => resolveExit());
    });
  } finally {
    if (timer)
      clearTimeout(timer);
    process.off("SIGTERM", stop);
    process.off("SIGINT", stop);
    server.closeAllConnections();
    await new Promise((resolveClose) => server.close(() => resolveClose()));
  }
}
function stopChildWeStarted(proc) {
  try {
    if (proc.pid && !proc.killed)
      proc.kill("SIGTERM");
  } catch {}
}
async function ensureManagedCLIProxyAPI(profile) {
  assertProfileId(profile.profileId);
  return withStartupLock(profile.profileId, () => ensureManagedCLIProxyAPIUnlocked(profile));
}
async function ensureManagedCLIProxyAPIUnlocked(profile) {
  const paths = profilePaths(profile.profileId);
  const state = await readState(profile.profileId);
  let managed = await readExistingManagedEnv(profile.profileId);
  assertCLIProxyAPICompatibility(profile.binaryPath, managed.upstream);
  if (state) {
    const alive = isPidAlive(state.pid);
    const owned = alive && state.binaryPath === profile.binaryPath && state.configPath === paths.configFile && await isOwnedProcess(state);
    if (owned) {
      if (managed.upstream === "antigravity" && !await isExpectedRuntimeConfig(paths, state, managed)) {
        throw new Error("Antigravity's running proxy needs updated compatibility settings. End its Claude Code sessions, then run `claudex-switch doctor <alias> --restart` before launching again.");
      }
      if (await probeProxy(state.port, managed.apiKey)) {
        return syncAntigravityModels(profile.profileId, managed, {
          port: state.port,
          baseUrl: baseUrl(state.port),
          apiKey: managed.apiKey
        }, state.startedAt);
      }
      throw new Error("Managed CLIProxyAPI is running but unhealthy. Run `claudex-switch doctor <alias> --restart` after ending its sessions.");
    }
    if (alive) {
      throw new Error("Refusing to replace CLIProxyAPI state because its PID is not a verified managed process.");
    }
    await rm2(paths.stateFile, { force: true });
  }
  if (isSubscriptionUpstream(managed.upstream)) {
    const models2 = await listSubscriptionModels(paths.dir, managed.upstream);
    const ids = models2.map(({ id }) => id);
    await updateManagedCLIProxyAPISetup(profile.profileId, {
      models: pickSubscriptionModels(ids, managed),
      upstreamModels: ids,
      upstreamContext: Object.fromEntries(models2.flatMap(({ id, context_window }) => context_window ? [[id, context_window]] : [])),
      subscriptionPort: await findAvailablePort()
    });
    managed = await readExistingManagedEnv(profile.profileId);
  }
  for (let attempt = 0;attempt < 3; attempt += 1) {
    if (attempt > 0 && isSubscriptionUpstream(managed.upstream)) {
      await updateManagedCLIProxyAPISetup(profile.profileId, { subscriptionPort: await findAvailablePort() });
      managed = await readExistingManagedEnv(profile.profileId);
    }
    const port = await findAvailablePort();
    if (port === managed.subscriptionPort)
      continue;
    await writeRuntimeConfig(profile.profileId, port);
    const startedAt = Date.now();
    const proc = startProxy(profile.binaryPath, paths.configFile, paths.dir, spawn, isSubscriptionUpstream(managed.upstream) ? profile.profileId : undefined);
    const ready = await waitForProxy(port, managed.apiKey);
    if (!ready) {
      stopChildWeStarted(proc);
      continue;
    }
    if (!proc.pid) {
      stopChildWeStarted(proc);
      throw new Error("CLIProxyAPI started without a process id");
    }
    await writeState(profile.profileId, {
      pid: proc.pid,
      port,
      binaryPath: profile.binaryPath,
      configPath: paths.configFile,
      startedAt
    });
    return syncAntigravityModels(profile.profileId, managed, { port, baseUrl: baseUrl(port), apiKey: managed.apiKey }, startedAt);
  }
  throw new Error("CLIProxyAPI did not become ready. Check `claudex-switch doctor <alias>` after fixing its login or binary.");
}
async function replaceManagedCLIProxyAPIBinary(profile, binaryPath, persist) {
  await withStartupLock(profile.profileId, async () => {
    const managed = await readExistingManagedEnv(profile.profileId);
    assertCLIProxyAPICompatibility(binaryPath, managed.upstream);
    await stopManagedCLIProxyAPIUnlocked(profile);
    const next = { ...profile, binaryPath };
    await ensureManagedCLIProxyAPIUnlocked(next);
    try {
      await persist();
    } catch (err) {
      await stopManagedCLIProxyAPIUnlocked(next);
      throw err;
    }
  });
}
async function managedCLIProxyAPIHasActiveLeases(profileId) {
  const paths = profilePaths(profileId);
  let entries;
  try {
    entries = await readdir2(paths.sessionsDir, { withFileTypes: true });
  } catch {
    return false;
  }
  let active = false;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json"))
      continue;
    const leasePath = join7(paths.sessionsDir, entry.name);
    const lease = await readJson(leasePath, null);
    if (lease && Number.isInteger(lease.pid) && isPidAlive(lease.pid)) {
      active = true;
      continue;
    }
    await rm2(leasePath, { force: true });
  }
  return active;
}
async function acquireManagedCLIProxyAPILease(profile) {
  assertProfileId(profile.profileId);
  return withStartupLock(profile.profileId, async () => {
    const paths = profilePaths(profile.profileId);
    const managed = await readExistingManagedEnv(profile.profileId);
    if (!await hasManagedCLIProxyAPILogin(profile.profileId)) {
      throw new Error(`No valid CLIProxyAPI ${CLI_PROXY_API_UPSTREAMS[managed.upstream].label} login is available. Run \`claudex-switch refresh <alias>\` before starting Claude Code.`);
    }
    await mkdirPrivate(paths.sessionsDir);
    const leasePath = join7(paths.sessionsDir, `${randomUUID3()}.json`);
    await writePrivateJson(leasePath, {
      pid: process.pid,
      createdAt: Date.now()
    });
    return {
      async release() {
        await rm2(leasePath, { force: true });
      }
    };
  });
}
async function authFiles(path) {
  let entries;
  try {
    entries = await readdir2(path, { withFileTypes: true });
  } catch {
    return [];
  }
  const result2 = [];
  for (const entry of entries) {
    const child = join7(path, entry.name);
    if (entry.isDirectory()) {
      result2.push(...await authFiles(child));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".json"))
      continue;
    try {
      if ((await stat2(child)).size > 0)
        result2.push(child);
    } catch {}
  }
  return result2;
}
function collectIdentityValues(value, result2 = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result2;
  }
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const identityKey = /^(email|sub|account_?id|user_?id|chatgpt_account_?id|chatgpt_user_?id|organization_?id)$/.test(lower);
    if (identityKey && (typeof child === "string" || typeof child === "number")) {
      result2.push(`${lower}=${String(child)}`);
    }
  }
  return result2;
}
function decodeJwtPayload(token) {
  if (typeof token !== "string")
    return null;
  const encoded = token.split(".")[1];
  if (!encoded)
    return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
async function readSingleAuthFile(authDir, authType) {
  const files = await authFiles(authDir);
  if (files.length !== 1)
    return null;
  try {
    const parsed = JSON.parse(await readFile4(files[0], "utf-8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return null;
    const auth = parsed;
    if (auth.type !== authType || typeof auth.access_token !== "string" || !auth.access_token.trim()) {
      return null;
    }
    return auth;
  } catch {
    return null;
  }
}
async function inspectAuthDirectory(authDir, authType) {
  const auth = await readSingleAuthFile(authDir, authType);
  if (!auth)
    return { valid: false, identity: null };
  const values = [
    ...collectIdentityValues(auth),
    ...collectIdentityValues(decodeJwtPayload(auth.id_token))
  ].sort();
  if (values.length === 0)
    return { valid: false, identity: null };
  return {
    valid: true,
    identity: createHash6("sha256").update(values.join(`
`)).digest("hex")
  };
}
function stagedAccountMatches(auth, expected) {
  const claims = decodeJwtPayload(auth.id_token);
  const openai = claims?.["https://api.openai.com/auth"];
  const nestedId = openai && typeof openai === "object" && !Array.isArray(openai) ? openai.chatgpt_account_id : undefined;
  const accountId = [auth.account_id, auth.chatgpt_account_id, nestedId].find((value) => typeof value === "string" && value.length > 0);
  const email = [auth.email, claims?.email].find((value) => typeof value === "string" && value.length > 0);
  if (expected.accountId && accountId)
    return expected.accountId === accountId;
  if (expected.email && email)
    return expected.email.toLowerCase() === email.toLowerCase();
  return false;
}
async function hasManagedCLIProxyAPILogin(profileId) {
  let managed;
  try {
    managed = await readManagedEnv(profileId);
  } catch {
    return (await inspectAuthDirectory(profilePaths(profileId).authDir, "codex")).valid;
  }
  const spec = CLI_PROXY_API_UPSTREAMS[managed.upstream];
  if (isSubscriptionUpstream(managed.upstream))
    return hasSubscriptionLogin(profilePaths(profileId).dir, managed.upstream);
  if (!spec.authType)
    return Boolean(managed.upstreamKey);
  return (await inspectAuthDirectory(profilePaths(profileId).authDir, spec.authType)).valid;
}
async function runManagedCLIProxyAPILogin(profile, spawnCommand = spawn, expectedIdentity, expectedAccount) {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  await mkdirPrivate(CLI_PROXY_API_DIR);
  const upstream = (await readExistingManagedEnv(profile.profileId)).upstream;
  const spec = CLI_PROXY_API_UPSTREAMS[upstream];
  if (isSubscriptionUpstream(upstream)) {
    if (!process.stdin.isTTY) {
      throw new Error(`${spec.label} login needs an interactive terminal to choose a login method. Run the same command in your terminal first.`);
    }
    return withStartupLock(profile.profileId, async () => {
      if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
        throw new Error("End this account's Claude Code sessions before refreshing its login.");
      }
      await stopManagedCLIProxyAPIUnlocked(profile);
      const staging = join7(paths.dir, `.login-${randomUUID3()}`);
      await mkdirPrivate(staging);
      try {
        const methods = await subscriptionLoginMethods(staging, upstream);
        if (!methods.length)
          throw new Error(`${spec.label} has no supported login methods.`);
        const method = await esm_default5({
          message: `${spec.label} login`,
          choices: methods.map(({ label }, value) => ({ name: label, value }))
        });
        const identity2 = await loginSubscriptionPlugin(staging, upstream, method, info);
        if (expectedIdentity && identity2 !== expectedIdentity) {
          return { success: false, identity: null, identityMismatch: true };
        }
        await rename2(join7(staging, SUBSCRIPTION_AUTH_FILE), join7(paths.dir, SUBSCRIPTION_AUTH_FILE));
        return { success: true, identity: identity2, identityMismatch: false };
      } finally {
        await rm2(staging, { recursive: true, force: true });
      }
    });
  }
  if (!spec.loginFlag || !spec.authType) {
    throw new Error(`${spec.label} accounts use an API key and have no CLIProxyAPI login.`);
  }
  const { loginFlag, authType, callbackPort } = spec;
  return withStartupLock(profile.profileId, async () => withLock(CLI_PROXY_API_LOGIN_LOCK, async () => {
    if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
      throw new Error("A Claude Code session launched by claudex-switch is still using this CLIProxyAPI account. End it before refreshing the login.");
    }
    const stagingAuthDir = join7(paths.dir, `.login-${randomUUID3()}`);
    const loginConfig = join7(paths.dir, "login-runtime.yaml");
    const apiPort = await findAvailablePort();
    if (callbackPort && !await portIsAvailable(callbackPort)) {
      throw new Error(`CLIProxyAPI ${spec.label} OAuth needs localhost:${callbackPort}, but that callback port is already in use. Stop the process using it and retry.`);
    }
    await mkdirPrivate(stagingAuthDir);
    const config = await readExistingManagedEnv(profile.profileId);
    await writePrivate(loginConfig, renderRuntimeConfig(stagingAuthDir, config, apiPort));
    const shimDir = createOpenShimDir();
    const env3 = proxyProcessEnvironment();
    if (shimDir)
      env3.PATH = `${shimDir}:${env3.PATH ?? ""}`;
    try {
      const proc = spawnCommand(profile.binaryPath, [
        "-config",
        loginConfig,
        loginFlag
      ], { stdio: "inherit", cwd: paths.dir, env: env3 });
      const exitCode = await new Promise((resolveCode, reject) => {
        proc.on("close", resolveCode);
        proc.on("error", reject);
      });
      const staged = await inspectAuthDirectory(stagingAuthDir, authType);
      if (exitCode !== 0 || !staged.valid || !staged.identity) {
        return { success: false, identity: null, identityMismatch: false };
      }
      const stagedAuth = expectedAccount ? await readSingleAuthFile(stagingAuthDir, authType) : null;
      if (expectedIdentity && staged.identity !== expectedIdentity || expectedAccount && (!stagedAuth || !stagedAccountMatches(stagedAuth, expectedAccount))) {
        return {
          success: false,
          identity: staged.identity,
          identityMismatch: true
        };
      }
      await stopManagedCLIProxyAPIUnlocked(profile);
      const backup = join7(paths.dir, `.auth-backup-${randomUUID3()}`);
      let movedCurrent = false;
      try {
        if (await fileExists(paths.authDir)) {
          await rename2(paths.authDir, backup);
          movedCurrent = true;
        }
        await rename2(stagingAuthDir, paths.authDir);
        if (movedCurrent)
          await rm2(backup, { recursive: true, force: true });
      } catch (err) {
        if (movedCurrent && !await fileExists(paths.authDir)) {
          try {
            await rename2(backup, paths.authDir);
          } catch {}
        }
        throw err;
      }
      return { success: true, identity: staged.identity, identityMismatch: false };
    } finally {
      cleanupOpenShimDir(shimDir);
      await rm2(stagingAuthDir, { recursive: true, force: true });
      await rm2(loginConfig, { force: true });
    }
  }));
}
async function inspectManagedCLIProxyAPI(profile, options = {}) {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  let managed = null;
  try {
    managed = await readManagedEnv(profile.profileId);
  } catch {}
  const state = managed ? await readState(profile.profileId) : null;
  const configured = await isExpectedRuntimeConfig(paths, state, managed);
  const running2 = Boolean(state && state.binaryPath === profile.binaryPath && state.configPath === paths.configFile && await isOwnedProcess(state));
  const healthy = options.probe && running2 && state && managed ? await probeProxy(state.port, managed.apiKey) : null;
  return {
    installed: Boolean(findCLIProxyAPIBinary(profile.binaryPath)),
    loggedIn: await hasManagedCLIProxyAPILogin(profile.profileId),
    environmentValid: managed !== null,
    running: running2,
    configured,
    healthy,
    port: state?.port ?? null
  };
}
async function hasActiveManagedCLIProxyAPI(profile) {
  return managedCLIProxyAPIHasActiveLeases(profile.profileId);
}
async function waitForProcessExit(pid, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (!isPidAlive(pid))
      return true;
    await delay(50);
  }
  return !isPidAlive(pid);
}
async function stopManagedCLIProxyAPIUnlocked(profile) {
  assertProfileId(profile.profileId);
  if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
    throw new Error("A Claude Code session launched by claudex-switch is still using this CLIProxyAPI account. End it before stopping or purging the proxy.");
  }
  const paths = profilePaths(profile.profileId);
  const state = await readState(profile.profileId);
  if (!state)
    return false;
  if (!isPidAlive(state.pid)) {
    await rm2(paths.stateFile, { force: true });
    return false;
  }
  if (state.binaryPath !== profile.binaryPath || state.configPath !== paths.configFile || !await isOwnedProcess(state)) {
    throw new Error("Refusing to stop a PID that is not a verified CLIProxyAPI process owned by this profile.");
  }
  try {
    process.kill(state.pid, "SIGTERM");
  } catch (err) {
    throw new Error(`Could not stop the managed CLIProxyAPI process: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!await waitForProcessExit(state.pid)) {
    throw new Error("Managed CLIProxyAPI did not stop in time; it was left intact and the profile was not removed.");
  }
  await rm2(paths.stateFile, { force: true });
  return true;
}
async function stopManagedCLIProxyAPI(profile) {
  return withStartupLock(profile.profileId, () => stopManagedCLIProxyAPIUnlocked(profile));
}
async function stopStaleManagedCLIProxyAPI(profile) {
  assertProfileId(profile.profileId);
  return withStartupLock(profile.profileId, async () => {
    if (await managedCLIProxyAPIHasActiveLeases(profile.profileId))
      return false;
    const paths = profilePaths(profile.profileId);
    let managed;
    try {
      managed = await readManagedEnv(profile.profileId);
    } catch {
      return false;
    }
    const state = await readState(profile.profileId);
    if (!state || !isPidAlive(state.pid))
      return false;
    const missingWindows = isSubscriptionUpstream(managed.upstream) && managed.upstreamContext === null;
    if (!missingWindows && await isExpectedRuntimeConfig(paths, state, managed))
      return false;
    return stopManagedCLIProxyAPIUnlocked(profile);
  });
}
async function restartManagedCLIProxyAPI(profile) {
  await stopManagedCLIProxyAPI(profile);
  return ensureManagedCLIProxyAPI(profile);
}
async function purgeManagedCLIProxyAPI(profile) {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  if (!await fileExists(paths.dir))
    return;
  await withStartupLock(profile.profileId, async () => {
    await stopManagedCLIProxyAPIUnlocked(profile);
    await rm2(paths.dir, { recursive: true, force: true });
  });
}
async function cleanupFailedManagedCLIProxyAPI(profileId) {
  assertProfileId(profileId);
  const paths = profilePaths(profileId);
  await rm2(paths.dir, { recursive: true, force: true });
  try {
    await rmdir(dirname3(paths.lock));
  } catch {}
}
function commandWorks(command) {
  try {
    return spawnSync4(command, ["--help"], {
      stdio: "ignore"
    }).status === 0;
  } catch {
    return false;
  }
}
function resolvedCommand(command) {
  if (command.includes("/") || command.includes("\\")) {
    return resolve2(command);
  }
  const locator = platform4() === "win32" ? "where" : "which";
  try {
    const result2 = spawnSync4(locator, [command], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const first = result2.stdout.trim().split(/\r?\n/)[0]?.trim();
    return first || command;
  } catch {
    return command;
  }
}
function findCLIProxyAPIBinary(explicitPath) {
  const candidates = explicitPath ? [explicitPath] : ["cliproxyapi", "cli-proxy-api"];
  for (const candidate of candidates) {
    if (commandWorks(candidate))
      return resolvedCommand(candidate);
  }
  return null;
}
async function installCLIProxyAPIWithHomebrew(spawnCommand = spawn) {
  const proc = spawnCommand("brew", ["install", "cliproxyapi"], {
    stdio: "inherit",
    env: process.env
  });
  const exitCode = await new Promise((resolveCode, reject) => {
    proc.on("close", resolveCode);
    proc.on("error", reject);
  });
  return exitCode === 0;
}

// src/providers/claude/profiles.ts
var PROFILE_CONFIG_LINK_EXCLUDES = new Set([
  ".credentials.json",
  ".claude.json",
  "backups"
]);
async function ensureDir2(path) {
  await mkdir5(path, { recursive: true });
}
async function ensurePrivateDir(path) {
  await mkdir5(path, { recursive: true, mode: 448 });
  try {
    await chmod4(path, 448);
  } catch {}
}
async function readState2() {
  return readJson(CLAUDE_STATE_FILE, { active: null });
}
async function writeState2(state) {
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
async function updateProfileDefaultModel(name, model) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const currentData = await readProfileData(name);
  const normalizedModel = normalizeOptionalValue(model);
  if (!normalizedModel) {
    throw new Error("Default model cannot be empty");
  }
  const nextData = currentData.type === "api-key" ? normalizeApiKeyProfileData({
    ...currentData,
    model: normalizedModel
  }) : currentData.type === "local-cliproxyapi" ? { ...currentData, defaultModel: normalizedModel } : normalizeOAuthProfileData({ defaultModel: normalizedModel });
  await writeProfileData(name, nextData);
  const state = await readState2();
  if (state.active === name) {
    await activateProfile(name, nextData);
  }
  return nextData;
}
async function updateClaudeProfileConfig(name, patch) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const current2 = await readProfileData(name);
  const fields2 = patch.fields ?? {};
  const pick2 = (key, fallback) => (key in fields2) ? fields2[key] : fallback;
  const env3 = patch.env === undefined ? current2.env : patch.env;
  let next;
  if (current2.type === "api-key") {
    next = normalizeApiKeyProfileData({
      apiKey: pick2("apiKey", current2.apiKey) ?? "",
      baseUrl: pick2("baseUrl", current2.baseUrl),
      authToken: pick2("authToken", current2.authToken),
      model: pick2("model", current2.model),
      defaultFableModel: pick2("defaultFableModel", current2.defaultFableModel),
      defaultSonnetModel: pick2("defaultSonnetModel", current2.defaultSonnetModel),
      defaultOpusModel: pick2("defaultOpusModel", current2.defaultOpusModel),
      defaultHaikuModel: pick2("defaultHaikuModel", current2.defaultHaikuModel),
      subagentModel: pick2("subagentModel", current2.subagentModel),
      env: env3
    });
    if (!next.apiKey) {
      throw new Error("API key cannot be empty");
    }
  } else if (current2.type === "local-cliproxyapi") {
    const defaultModel = normalizeOptionalValue(pick2("defaultModel", current2.defaultModel));
    if (!defaultModel) {
      throw new Error("Default model cannot be empty");
    }
    const { env: _previousEnv, ...rest } = current2;
    next = { ...rest, defaultModel, ...withCustomEnv(env3) };
  } else {
    next = normalizeOAuthProfileData({
      defaultModel: pick2("defaultModel", current2.defaultModel),
      env: env3
    });
  }
  await writeProfileData(name, next);
  const state = await readState2();
  const reapplied = state.active === name;
  if (reapplied) {
    await activateProfile(name, next);
  }
  return { data: next, reapplied };
}
async function addOAuthProfile(name, fromCredentials = CREDENTIALS_FILE, config = {}) {
  const data = normalizeOAuthProfileData(config);
  await ensureDir2(claudeProfileDir(name));
  await copyCredentials(fromCredentials, claudeProfileCredentials(name));
  await writeProfileData(name, data);
  const account = await readOAuthAccount();
  if (account) {
    await writeJson(claudeProfileAccountFile(name), account);
  }
  await activateProfile(name, data);
  await writeState2({ active: name });
}
async function addApiKeyProfile(name, config) {
  const state = await readState2();
  if (state.active && state.active !== name && await profileExists(state.active)) {
    const oldData = await readProfileData(state.active);
    if (oldData.type === "oauth") {
      await snapshotCurrentOAuthProfileIfLiveMatches(state.active);
    }
  }
  await ensureDir2(claudeProfileDir(name));
  const data = normalizeApiKeyProfileData(config);
  await writeProfileData(name, data);
  await activateProfile(name, data);
  await writeState2({ active: name });
}
async function addLocalCLIProxyAPIProfile(name, config) {
  const state = await readState2();
  if (state.active && state.active !== name && await profileExists(state.active)) {
    const oldData = await readProfileData(state.active);
    if (oldData.type === "oauth") {
      await snapshotCurrentOAuthProfileIfLiveMatches(state.active);
    }
  }
  await ensureDir2(claudeProfileDir(name));
  await writeProfileData(name, config);
  await activateProfile(name, config);
  await writeState2({ active: name });
}
async function saveLocalCLIProxyAPIProfile(name, config) {
  await ensureDir2(claudeProfileDir(name));
  await writeProfileData(name, config);
}
async function updateLocalCLIProxyAPIProfileIdentity(name, authIdentity) {
  const current2 = await readProfileData(name);
  if (current2.type !== "local-cliproxyapi") {
    throw new Error(`Profile "${name}" is not a local CLIProxyAPI profile`);
  }
  await writeProfileData(name, { ...current2, authIdentity });
}
async function replaceLocalCLIProxyAPIBinary(name, binaryPath) {
  const current2 = await readProfileData(name);
  if (current2.type !== "local-cliproxyapi") {
    throw new Error(`Profile "${name}" is not a local CLIProxyAPI profile`);
  }
  const resolved = findCLIProxyAPIBinary(binaryPath);
  if (!resolved)
    throw new Error("The replacement CLIProxyAPI executable is unavailable.");
  assertCLIProxyAPICompatibility(resolved, current2.upstream);
  const next = { ...current2, binaryPath: resolved };
  await replaceManagedCLIProxyAPIBinary(current2, resolved, () => writeProfileData(name, next));
  return next;
}
async function switchProfile(name) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const state = await readState2();
  const targetData = await readProfileData(name);
  if (state.active === name && await isProfileApplied(name, targetData)) {
    return targetData;
  }
  if (state.active && state.active !== name) {
    const oldData = await readProfileData(state.active);
    if (oldData.type === "oauth") {
      await snapshotCurrentOAuthProfileIfLiveMatches(state.active);
    }
  }
  await activateProfile(name, targetData);
  await writeState2({ active: name });
  return targetData;
}
async function snapshotCurrentOAuthProfile(name) {
  const currentCreds = await readCredentials(CREDENTIALS_FILE);
  if (currentCreds) {
    await ensureDir2(claudeProfileDir(name));
    await copyCredentials(CREDENTIALS_FILE, claudeProfileCredentials(name));
  }
  const currentAccount = await readOAuthAccount();
  if (currentAccount) {
    await writeJson(claudeProfileAccountFile(name), currentAccount);
  }
}
async function snapshotCurrentOAuthProfileIfLiveMatches(name) {
  const savedAccount = await readJson(claudeProfileAccountFile(name), null);
  if (savedAccount) {
    const liveAccount = await readOAuthAccount();
    if (!sameOAuthSession(savedAccount, liveAccount)) {
      return false;
    }
  }
  await snapshotCurrentOAuthProfile(name);
  return true;
}
async function activateProfile(name, targetData) {
  if (targetData.type === "api-key") {
    await deleteCredentials(CREDENTIALS_FILE);
    await writeOAuthAccount(null);
    await applyApiConfig(targetData);
    return;
  }
  if (targetData.type === "local-cliproxyapi") {
    const runtime = await ensureManagedCLIProxyAPI({
      profileId: targetData.profileId,
      binaryPath: targetData.binaryPath
    });
    const config = await getLocalCLIProxyAPISettings(targetData, runtime);
    await deleteCredentials(CREDENTIALS_FILE);
    await writeOAuthAccount(null);
    await applyLocalCLIProxyAPIConfig(config, targetData.env);
    return;
  }
  await applyOAuthConfig(targetData.defaultModel, targetData.env);
  await restoreOAuthCredentials(name);
}
async function restoreOAuthCredentials(name) {
  const savedAccount = await readJson(claudeProfileAccountFile(name), null);
  if (savedAccount) {
    const liveCreds = await readCredentials(CREDENTIALS_FILE);
    const liveAccount = await readOAuthAccount();
    if (liveCreds && sameOAuthSession(savedAccount, liveAccount)) {
      await snapshotCurrentOAuthProfile(name);
      return;
    }
  }
  const creds = await readFreshestOAuthCredentials(name, false);
  if (!creds) {
    throw new Error(`No credentials found at ${claudeProfileCredentials(name)}`);
  }
  await writeCredentials(creds, CREDENTIALS_FILE);
  await writeOAuthAccount(savedAccount);
}
function oauthExpiresAt(creds) {
  return creds?.claudeAiOauth?.expiresAt ?? 0;
}
function pickFresherCredentials(a, b) {
  if (!a)
    return b;
  if (!b)
    return a;
  return oauthExpiresAt(b) > oauthExpiresAt(a) ? b : a;
}
async function readOAuthCredentialStores(name, includeMatchingGlobal) {
  const snapshot = await readCredentials(claudeProfileCredentials(name));
  const isolated = await readIsolatedCredentials(claudeProfileDir(name));
  let global2 = null;
  if (includeMatchingGlobal) {
    const savedAccount = await readJson(claudeProfileAccountFile(name), null);
    if (savedAccount && sameOAuthSession(savedAccount, await readOAuthAccount())) {
      global2 = await readCredentials(CREDENTIALS_FILE);
    }
  }
  return { snapshot, isolated, global: global2 };
}
function freshestOAuthCredentials(stores) {
  return pickFresherCredentials(pickFresherCredentials(stores.snapshot, stores.isolated), stores.global);
}
async function readFreshestOAuthCredentials(name, includeMatchingGlobal) {
  return freshestOAuthCredentials(await readOAuthCredentialStores(name, includeMatchingGlobal));
}
async function prepareIsolatedOAuthRun(name) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const dir = claudeProfileDir(name);
  const configDir = claudeProfileConfigDir(name);
  const state = await readState2();
  const stores = await readOAuthCredentialStores(name, state.active === name);
  const { snapshot, isolated } = stores;
  const freshest = freshestOAuthCredentials(stores);
  if (!freshest) {
    throw new Error(`No credentials stored for Claude profile "${name}". Switch to it and log in first.`);
  }
  await ensureDir2(dir);
  if (oauthExpiresAt(freshest) > oauthExpiresAt(isolated) || !isolated) {
    await writeIsolatedCredentials(freshest, dir);
  }
  if (oauthExpiresAt(freshest) > oauthExpiresAt(snapshot)) {
    await writeCredentials(freshest, claudeProfileCredentials(name));
  }
  await prepareIsolatedOAuthConfig(name);
  return { secureStorageDir: dir, configDir };
}
async function prepareIsolatedLocalCLIProxyAPIRun(name) {
  if (!await profileExists(name)) {
    throw new Error(`Profile "${name}" does not exist`);
  }
  const data = await readProfileData(name);
  if (data.type !== "local-cliproxyapi") {
    throw new Error(`Profile "${name}" is not a local CLIProxyAPI profile`);
  }
  const configDir = claudeProfileConfigDir(name);
  const secureStorageDir = claudeProfileSecureStorageDir(name);
  await ensureDir2(configDir);
  await ensurePrivateDir(secureStorageDir);
  await linkSharedClaudeConfigEntries(configDir);
  await writeIsolatedLocalClaudeJson(name);
  return { secureStorageDir, configDir };
}
async function prepareIsolatedOAuthConfig(name) {
  const configDir = claudeProfileConfigDir(name);
  await ensureDir2(configDir);
  await linkSharedClaudeConfigEntries(configDir);
  await writeIsolatedClaudeJson(name);
}
async function linkSharedClaudeConfigEntries(configDir) {
  let entries;
  try {
    entries = await readdir3(CLAUDE_DIR, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (PROFILE_CONFIG_LINK_EXCLUDES.has(entry.name))
      continue;
    const source = join8(CLAUDE_DIR, entry.name);
    const destination = join8(configDir, entry.name);
    const type = entry.isDirectory() ? process.platform === "win32" ? "junction" : "dir" : "file";
    await ensureSymlinkOrCopy(source, destination, type);
  }
}
async function ensureSymlinkOrCopy(source, destination, type) {
  try {
    const stat3 = await lstat(destination);
    if (!stat3.isSymbolicLink())
      return;
    const existing = await readlink(destination);
    if (existing === source)
      return;
    await unlink2(destination);
  } catch {}
  try {
    await symlink(source, destination, type);
    return;
  } catch {}
  if (type === "file") {
    try {
      await copyFile(source, destination);
    } catch {}
  }
}
async function writeIsolatedClaudeJson(name) {
  const account = await readJson(claudeProfileAccountFile(name), null);
  const data = await readJson(CLAUDE_JSON, {});
  if (account) {
    data.oauthAccount = account;
  } else {
    delete data.oauthAccount;
  }
  await writeJson(claudeProfileConfigJson(name), data);
}
async function writeIsolatedLocalClaudeJson(name) {
  const data = await readJson(CLAUDE_JSON, {});
  delete data.oauthAccount;
  await writeJson(claudeProfileConfigJson(name), data);
}
async function syncIsolatedOAuthSnapshot(name) {
  const isolated = await readIsolatedCredentials(claudeProfileDir(name));
  if (!isolated)
    return;
  const snapshot = await readCredentials(claudeProfileCredentials(name));
  if (oauthExpiresAt(isolated) > oauthExpiresAt(snapshot)) {
    await writeCredentials(isolated, claudeProfileCredentials(name));
  }
}
async function isProfileApplied(name, targetData) {
  if (targetData.type === "local-cliproxyapi") {
    return false;
  }
  if (targetData.type === "api-key") {
    if (!sameApiConfig(targetData, await getApiConfig()))
      return false;
    if (await readCredentials(CREDENTIALS_FILE))
      return false;
    if (await readOAuthAccount())
      return false;
    return true;
  }
  if (await getApiConfig())
    return false;
  if (normalizeOptionalValue(targetData.defaultModel) !== normalizeOptionalValue(await getConfiguredModel())) {
    return false;
  }
  if (!await readCredentials(CREDENTIALS_FILE))
    return false;
  const savedAccount = await readJson(claudeProfileAccountFile(name), null);
  if (!savedAccount)
    return true;
  return sameOAuthSession(savedAccount, await readOAuthAccount());
}
function sameOAuthAccount(expected, actual) {
  const expectedId = expected.accountUuid ?? expected.emailAddress ?? null;
  const actualId = actual?.accountUuid ?? actual?.emailAddress ?? null;
  return Boolean(expectedId && actualId && expectedId === actualId);
}
function sameOAuthSession(expected, actual) {
  return sameOAuthAccount(expected, actual) && expected.organizationUuid === actual?.organizationUuid;
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
  const state = await readState2();
  const data = await readProfileData(name);
  if (data.type === "oauth") {
    await deleteIsolatedCredentials(claudeProfileDir(name));
  }
  if (data.type === "local-cliproxyapi") {
    await purgeManagedCLIProxyAPI({
      profileId: data.profileId,
      binaryPath: data.binaryPath
    });
  }
  if (state.active === name && (data.type === "api-key" || data.type === "local-cliproxyapi")) {
    await clearApiConfig();
  }
  await rm3(claudeProfileDir(name), { recursive: true });
  if (state.active === name) {
    await writeState2({ active: null });
  }
}
function normalizeOptionalValue(value) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
function normalizeApiKeyProfileData(config) {
  return {
    type: "api-key",
    apiKey: config.apiKey.trim(),
    ...normalizeOptionalValue(config.baseUrl) ? { baseUrl: normalizeOptionalValue(config.baseUrl) } : {},
    ...normalizeOptionalValue(config.authToken) ? { authToken: normalizeOptionalValue(config.authToken) } : {},
    ...normalizeOptionalValue(config.model) ? { model: normalizeOptionalValue(config.model) } : {},
    ...normalizeOptionalValue(config.defaultFableModel) ? { defaultFableModel: normalizeOptionalValue(config.defaultFableModel) } : {},
    ...normalizeOptionalValue(config.defaultSonnetModel) ? { defaultSonnetModel: normalizeOptionalValue(config.defaultSonnetModel) } : {},
    ...normalizeOptionalValue(config.defaultOpusModel) ? { defaultOpusModel: normalizeOptionalValue(config.defaultOpusModel) } : {},
    ...normalizeOptionalValue(config.defaultHaikuModel) ? { defaultHaikuModel: normalizeOptionalValue(config.defaultHaikuModel) } : {},
    ...normalizeOptionalValue(config.subagentModel) ? { subagentModel: normalizeOptionalValue(config.subagentModel) } : {},
    ...withCustomEnv(config.env)
  };
}
function normalizeOAuthProfileData(config) {
  const defaultModel = normalizeOptionalValue(config.defaultModel);
  return {
    type: "oauth",
    ...defaultModel ? { defaultModel } : {},
    ...withCustomEnv(config.env)
  };
}
function withCustomEnv(env3) {
  const normalized = normalizeCustomEnv(env3);
  return Object.keys(normalized).length > 0 ? { env: normalized } : {};
}
function sameCustomEnv(expected, actual) {
  const a = normalizeCustomEnv(expected);
  const b = normalizeCustomEnv(actual);
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length)
    return false;
  return keys.every((key) => a[key] === b[key]);
}
function sameApiConfig(expected, actual) {
  if (!actual)
    return false;
  return expected.apiKey === actual.apiKey && normalizeOptionalValue(expected.baseUrl) === normalizeOptionalValue(actual.baseUrl) && normalizeOptionalValue(expected.authToken) === normalizeOptionalValue(actual.authToken) && normalizeOptionalValue(expected.model) === normalizeOptionalValue(actual.model) && normalizeOptionalValue(expected.defaultFableModel) === normalizeOptionalValue(actual.defaultFableModel) && normalizeOptionalValue(expected.subagentModel) === normalizeOptionalValue(actual.subagentModel) && normalizeOptionalValue(expected.defaultSonnetModel) === normalizeOptionalValue(actual.defaultSonnetModel) && normalizeOptionalValue(expected.defaultOpusModel) === normalizeOptionalValue(actual.defaultOpusModel) && normalizeOptionalValue(expected.defaultHaikuModel) === normalizeOptionalValue(actual.defaultHaikuModel) && sameCustomEnv(expected.env, actual.env);
}

// src/providers/codex/registry.ts
import { mkdir as mkdir7 } from "fs/promises";

// src/providers/codex/config.ts
import { chmod as chmod5, mkdir as mkdir6, readFile as readFile5, writeFile as writeFile4 } from "fs/promises";
import { dirname as dirname4 } from "path";

// src/lib/toml.ts
function parseKeyPath(path) {
  const keys = [];
  let i = 0;
  while (i < path.length) {
    while (i < path.length && path[i] === " ")
      i++;
    if (i >= path.length)
      break;
    if (path[i] === '"') {
      i++;
      let key = "";
      while (i < path.length && path[i] !== '"') {
        if (path[i] === "\\" && i + 1 < path.length) {
          i++;
          if (path[i] === "n")
            key += `
`;
          else if (path[i] === "t")
            key += "\t";
          else
            key += path[i];
        } else {
          key += path[i];
        }
        i++;
      }
      i++;
      keys.push(key);
    } else {
      let key = "";
      while (i < path.length && path[i] !== ".") {
        key += path[i];
        i++;
      }
      keys.push(key.trim());
    }
    while (i < path.length && path[i] === " ")
      i++;
    if (i < path.length && path[i] === ".")
      i++;
  }
  return keys;
}
function splitArrayElements(inner) {
  const elements = [];
  let depth = 0;
  let inString = false;
  let current2 = "";
  for (let i = 0;i < inner.length; i++) {
    const ch = inner[i];
    if (inString) {
      current2 += ch;
      if (ch === "\\" && i + 1 < inner.length) {
        current2 += inner[++i];
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      current2 += ch;
    } else if (ch === "[") {
      depth++;
      current2 += ch;
    } else if (ch === "]") {
      depth--;
      current2 += ch;
    } else if (ch === "," && depth === 0) {
      elements.push(current2);
      current2 = "";
    } else {
      current2 += ch;
    }
  }
  if (current2.trim())
    elements.push(current2);
  return elements;
}
function parseValue(raw) {
  if (raw === "true")
    return true;
  if (raw === "false")
    return false;
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const inner = raw.slice(1, -1).trim();
    if (!inner)
      return [];
    return splitArrayElements(inner).map((el) => parseValue(el.trim()));
  }
  if (raw.startsWith('"')) {
    let result2 = "";
    let i = 1;
    while (i < raw.length && raw[i] !== '"') {
      if (raw[i] === "\\" && i + 1 < raw.length) {
        i++;
        if (raw[i] === "n")
          result2 += `
`;
        else if (raw[i] === "t")
          result2 += "\t";
        else
          result2 += raw[i];
      } else {
        result2 += raw[i];
      }
      i++;
    }
    return result2;
  }
  const num2 = Number(raw);
  if (!Number.isNaN(num2) && raw !== "")
    return num2;
  return raw;
}
var SCALAR_NUMBER_RE = /^[+-]?(?:\d[\d_]*)(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?$/;
function parseScalarArray(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]"))
    return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner)
    return [];
  const result2 = [];
  for (const rawEl of splitArrayElements(inner)) {
    const el = rawEl.trim();
    if (!el)
      return null;
    const isQuoted = el.length >= 2 && (el.startsWith('"') && el.endsWith('"') || el.startsWith("'") && el.endsWith("'"));
    if (isQuoted || el === "true" || el === "false" || SCALAR_NUMBER_RE.test(el)) {
      result2.push(parseValue(el));
    } else {
      return null;
    }
  }
  return result2;
}
function ensureTable(root, keys) {
  let current2 = root;
  for (const key of keys) {
    if (!(key in current2) || typeof current2[key] !== "object") {
      current2[key] = {};
    }
    current2 = current2[key];
  }
  return current2;
}
function parseToml(input) {
  const root = {};
  let current2 = root;
  for (const raw of input.split(/\r?\n/)) {
    const commentIdx = findCommentStart(raw);
    const line = (commentIdx >= 0 ? raw.slice(0, commentIdx) : raw).trim();
    if (!line)
      continue;
    const headerMatch = line.match(/^\[(.+)\]$/);
    if (headerMatch) {
      current2 = ensureTable(root, parseKeyPath(headerMatch[1]));
      continue;
    }
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1)
      continue;
    const keyPart = line.slice(0, eqIdx).trim();
    const valuePart = line.slice(eqIdx + 1).trim();
    const key = keyPart.startsWith('"') ? parseValue(keyPart) : keyPart;
    current2[key] = parseValue(valuePart);
  }
  return root;
}
function findCommentStart(line) {
  let inString = false;
  for (let i = 0;i < line.length; i++) {
    if (line[i] === '"' && (i === 0 || line[i - 1] !== "\\")) {
      inString = !inString;
    } else if (line[i] === "#" && !inString) {
      return i;
    }
  }
  return -1;
}

// src/providers/codex/config.ts
var DEFAULT_CODEX_MODEL = "gpt-5.4";
function normalizeCodexModel(value) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
function resolveCodexModel(defaultModel, providerModel) {
  return normalizeCodexModel(defaultModel) ?? normalizeCodexModel(providerModel) ?? DEFAULT_CODEX_MODEL;
}
function cloneConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {};
  return JSON.parse(JSON.stringify(value));
}
async function readCodexConfig() {
  if (!await fileExists(CODEX_CONFIG_FILE))
    return {};
  try {
    const content = await readFile5(CODEX_CONFIG_FILE, "utf-8");
    return cloneConfig(parseToml(content));
  } catch {
    return {};
  }
}
function isSimpleTable(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function formatScalar(value) {
  if (typeof value === "string")
    return JSON.stringify(value);
  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== null && item !== undefined).map((item) => formatScalar(item));
    return `[${items.join(", ")}]`;
  }
  return String(value);
}
function isInlineValue(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || Array.isArray(value);
}
var BARE_KEY_RE = /^[A-Za-z0-9_-]+$/;
function formatKey(key) {
  if (BARE_KEY_RE.test(key))
    return key;
  return JSON.stringify(key);
}
function renderTable(lines, table, prefix) {
  const scalars = [];
  const subtables = [];
  for (const [key, value] of Object.entries(table)) {
    if (value === null || value === undefined)
      continue;
    if (isSimpleTable(value)) {
      subtables.push([key, value]);
    } else if (isInlineValue(value)) {
      scalars.push([key, value]);
    }
  }
  for (const [key, value] of scalars) {
    lines.push(`${formatKey(key)} = ${formatScalar(value)}`);
  }
  for (const [key, subtable] of subtables) {
    const quotedKey = formatKey(key);
    const fullKey = prefix ? `${prefix}.${quotedKey}` : quotedKey;
    if (lines.length > 0 && lines[lines.length - 1] !== "")
      lines.push("");
    lines.push(`[${fullKey}]`);
    renderTable(lines, subtable, fullKey);
  }
}
function renderCodexConfig(config) {
  const lines = [];
  if (config.model_provider) {
    lines.push(`model_provider = ${formatScalar(config.model_provider)}`);
  }
  if (config.model) {
    lines.push(`model = ${formatScalar(config.model)}`);
  }
  const skipKeys = new Set(["model_provider", "model"]);
  for (const [key, value] of Object.entries(config)) {
    if (skipKeys.has(key))
      continue;
    if (value === null || value === undefined || isSimpleTable(value))
      continue;
    if (isInlineValue(value)) {
      lines.push(`${key} = ${formatScalar(value)}`);
    }
  }
  for (const [key, value] of Object.entries(config)) {
    if (skipKeys.has(key))
      continue;
    if (!isSimpleTable(value))
      continue;
    if (lines.length > 0 && lines[lines.length - 1] !== "")
      lines.push("");
    lines.push(`[${key}]`);
    renderTable(lines, value, key);
  }
  return `${lines.join(`
`)}
`;
}
function applyOfficialProvider(config, defaultModel) {
  delete config.model_provider;
  delete config.openai_base_url;
  config.model = resolveCodexModel(defaultModel);
  config.cli_auth_credentials_store = "file";
  if (isSimpleTable(config.model_providers)) {
    for (const [name, rawProvider] of Object.entries(config.model_providers)) {
      if (isSimpleTable(rawProvider) && rawProvider.experimental_bearer_token) {
        delete config.model_providers[name];
      }
    }
    if (Object.keys(config.model_providers).length === 0) {
      delete config.model_providers;
    }
  }
}
function applyCustomProvider(config, provider, apiKey, defaultModel) {
  if (provider.type !== "custom" || !provider.name || !provider.base_url || !provider.env_key) {
    throw new Error("Invalid Codex custom provider config");
  }
  const providers = isSimpleTable(config.model_providers) ? config.model_providers : {};
  config.model_providers = providers;
  config.model_provider = provider.name;
  config.model = resolveCodexModel(defaultModel, provider.model);
  config.cli_auth_credentials_store = "file";
  const providerConfig = {
    name: provider.name,
    base_url: provider.base_url,
    requires_openai_auth: false
  };
  if (apiKey) {
    providerConfig.experimental_bearer_token = apiKey;
  } else {
    providerConfig.env_key = provider.env_key;
  }
  providers[provider.name] = providerConfig;
}
function applyProvider(config, provider, apiKey, defaultModel) {
  if (!provider || provider.type === "official") {
    applyOfficialProvider(config, defaultModel);
  } else {
    applyCustomProvider(config, provider, apiKey, defaultModel);
  }
}
async function applyCodexApiProvider(provider, apiKey, defaultModel) {
  const config = await readCodexConfig();
  applyProvider(config, provider, apiKey, defaultModel);
  await writeCodexConfig(config);
}
async function renderCodexRunConfig(provider, apiKey) {
  const original = await readCodexConfig();
  const config = cloneConfig(original);
  applyProvider(config, provider, apiKey);
  if (original.model === undefined) {
    delete config.model;
  } else {
    config.model = original.model;
  }
  const rendered = renderCodexConfig(config);
  return rendered === renderCodexConfig(original) ? null : rendered;
}
async function repairCodexStringifiedArrays() {
  if (!await fileExists(CODEX_CONFIG_FILE))
    return false;
  const content = await readFile5(CODEX_CONFIG_FILE, "utf-8");
  const lines = content.split(/\r?\n/);
  let changed = false;
  for (let i = 0;i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)([A-Za-z0-9_-]+|"(?:[^"\\]|\\.)*")(\s*=\s*)("(?:[^"\\]|\\.)*")\s*$/);
    if (!match)
      continue;
    const [, indent, rawKey, eq, rawValue] = match;
    let decoded;
    try {
      decoded = JSON.parse(rawValue);
    } catch {
      continue;
    }
    if (typeof decoded !== "string")
      continue;
    const parsed = parseScalarArray(decoded);
    if (!parsed)
      continue;
    lines[i] = `${indent}${rawKey}${eq}${formatScalar(parsed)}`;
    changed = true;
  }
  if (changed) {
    await writeFile4(CODEX_CONFIG_FILE, lines.join(`
`), { mode: 384 });
  }
  return changed;
}
async function writeCodexConfig(config) {
  const content = renderCodexConfig(config);
  try {
    if (await readFile5(CODEX_CONFIG_FILE, "utf-8") === content) {
      await chmod5(CODEX_CONFIG_FILE, 384);
      return;
    }
  } catch {}
  await mkdir6(dirname4(CODEX_CONFIG_FILE), { recursive: true });
  await writeFile4(CODEX_CONFIG_FILE, content, { mode: 384 });
  await chmod5(CODEX_CONFIG_FILE, 384);
}

// src/providers/codex/registry.ts
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
  await mkdir7(CODEX_ACCOUNTS_DIR, { recursive: true });
}
async function loadRegistry(options = {}) {
  if (!await fileExists(CODEX_REGISTRY_FILE)) {
    return JSON.parse(JSON.stringify(DEFAULT_REGISTRY));
  }
  const reg = await readJson(CODEX_REGISTRY_FILE, DEFAULT_REGISTRY);
  if (!Array.isArray(reg.accounts)) {
    reg.accounts = [];
  }
  let changed = false;
  for (const account of reg.accounts) {
    const resolvedModel = resolveCodexModel(account.default_model, account.api_provider?.model ?? null);
    if (account.default_model !== resolvedModel) {
      account.default_model = resolvedModel;
      changed = true;
    }
  }
  if (changed && options.persistNormalization !== false) {
    await saveRegistry(reg);
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
function updateAccountDefaultModel(reg, accountKey, model) {
  const account = findAccountByKey(reg, accountKey);
  if (!account) {
    throw new Error(`Codex account not found: ${accountKey}`);
  }
  account.default_model = resolveCodexModel(model);
  return account;
}
function updateAccountConfig(reg, accountKey, patch) {
  const account = findAccountByKey(reg, accountKey);
  if (!account) {
    throw new Error(`Codex account not found: ${accountKey}`);
  }
  if (patch.defaultModel !== undefined) {
    account.default_model = resolveCodexModel(patch.defaultModel);
  }
  const provider = account.api_provider;
  if (provider && provider.type === "custom") {
    if (patch.baseUrl !== undefined) {
      provider.base_url = patch.baseUrl.trim() || null;
    }
    if (patch.model !== undefined) {
      provider.model = patch.model.trim() || null;
    }
    if (patch.envKey !== undefined) {
      provider.env_key = patch.envKey.trim() || null;
    }
  }
  return account;
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
function codexAccountProviderName(account) {
  if (account.auth_mode === "apikey" && account.api_provider?.type === "custom") {
    return account.api_provider.name || null;
  }
  return "openai";
}
function managedProviderNames(reg) {
  const names = new Set(["openai"]);
  for (const account of reg.accounts) {
    const name = codexAccountProviderName(account);
    if (name)
      names.add(name.toLowerCase());
  }
  return names;
}

// src/providers/opencode/profiles.ts
import { chmod as chmod6, mkdir as mkdir8, rename as rename3, rm as rm5, writeFile as writeFile5 } from "fs/promises";
import { randomUUID as randomUUID5 } from "crypto";
import { dirname as dirname5 } from "path";

// src/providers/opencode/native.ts
import { execFile as execFile2 } from "child_process";
import { promisify } from "util";
import { join as join9 } from "path";
var execFileAsync = promisify(execFile2);
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function nativeOpenCodeDatabaseFile() {
  const override = process.env.OPENCODE_DB?.trim();
  if (override)
    return override;
  return join9(OPENCODE_GLOBAL_DATA_DIR, "opencode.db");
}
async function queryRows(dbPath, sql) {
  try {
    const mod = await import(["bun", "sqlite"].join(":"));
    const db = new mod.Database(dbPath, { readonly: true });
    try {
      return db.prepare(sql).all();
    } finally {
      db.close();
    }
  } catch {}
  try {
    const { stdout } = await execFileAsync("sqlite3", [
      "-readonly",
      "-json",
      dbPath,
      sql
    ]);
    const parsed = JSON.parse(stdout.trim() || "[]");
    return Array.isArray(parsed) ? parsed : null;
  } catch {}
  if (!process.versions.bun) {
    try {
      const { stdout } = await execFileAsync(process.execPath, [
        "--disable-warning=ExperimentalWarning",
        "--input-type=module",
        "-e",
        `import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(process.argv[1], { readOnly: true });
try { process.stdout.write(JSON.stringify(db.prepare(process.argv[2]).all())); }
finally { db.close(); }`,
        dbPath,
        sql
      ]);
      const parsed = JSON.parse(stdout.trim() || "[]");
      return Array.isArray(parsed) ? parsed : null;
    } catch {}
  }
  return null;
}
async function readOpenCodeConsoleCredentials(dbPath) {
  if (!await fileExists(dbPath))
    return [];
  const rows = await queryRows(dbPath, "SELECT id, label, value, active FROM credential WHERE integration_id = 'opencode'");
  if (!rows)
    throw new Error("Could not read OpenCode's private subscription credentials.");
  return rows.flatMap((row) => {
    try {
      const value = JSON.parse(String(row.value));
      const metadata = value.metadata;
      if (typeof row.id !== "string" || value.type !== "oauth" || typeof value.access !== "string" || !value.access || typeof value.refresh !== "string" || !value.refresh || typeof value.expires !== "number" || !Number.isFinite(value.expires) || typeof value.methodID !== "string" || !isRecord(metadata) || typeof metadata.server !== "string" || typeof metadata.accountID !== "string" || !metadata.accountID || typeof metadata.email !== "string" || typeof metadata.orgID !== "string" || !metadata.orgID)
        return [];
      return [{ id: row.id, label: String(row.label), active: row.active === 1 || row.active === true, value }];
    } catch {
      return [];
    }
  });
}
function parseCredentialRows(rows) {
  const credentials = [];
  for (const row of rows) {
    if (typeof row.id !== "string" || row.id.length === 0 || typeof row.value !== "string") {
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      continue;
    }
    if (!isRecord(parsed) || typeof parsed.key !== "string" || !parsed.key) {
      continue;
    }
    credentials.push({
      id: row.id,
      label: typeof row.label === "string" && row.label ? row.label : "OpenCode Go",
      key: parsed.key,
      active: row.active === 1 || row.active === true
    });
  }
  return credentials.toSorted((left, right) => Number(right.active) - Number(left.active) || left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
}
async function readNativeOpenCodeGoCredentials() {
  const dbFile = nativeOpenCodeDatabaseFile();
  if (!await fileExists(dbFile))
    return { status: "ok", credentials: [] };
  const rows = await queryRows(dbFile, "SELECT id, label, value, active FROM credential WHERE integration_id = 'opencode-go'");
  if (!rows)
    return { status: "unavailable" };
  return { status: "ok", credentials: parseCredentialRows(rows) };
}

// src/providers/opencode/lock.ts
import { randomUUID as randomUUID4 } from "crypto";
import { open as open2, readFile as readFile6, rm as rm4, stat as stat3 } from "fs/promises";
async function acquireProfileLock(lockPath, resourceName, timeoutMs = 1e4) {
  const timeoutAt = Date.now() + timeoutMs;
  const token = randomUUID4();
  while (Date.now() < timeoutAt) {
    try {
      const handle = await open2(lockPath, "wx", 384);
      await handle.writeFile(JSON.stringify({ pid: process.pid, token, createdAt: Date.now() }));
      await handle.close();
      return async () => {
        try {
          const current2 = JSON.parse(await readFile6(lockPath, "utf8"));
          if (current2.token === token)
            await rm4(lockPath, { force: true });
        } catch {}
      };
    } catch (error2) {
      if (error2.code !== "EEXIST") {
        throw new Error(`Could not lock this alias's private OpenCode ${resourceName}.`);
      }
    }
    try {
      const owner = JSON.parse(await readFile6(lockPath, "utf8"));
      if (typeof owner.pid === "number" && Number.isInteger(owner.pid)) {
        try {
          process.kill(owner.pid, 0);
        } catch (error2) {
          if (error2.code === "ESRCH") {
            await rm4(lockPath, { force: true });
            continue;
          }
        }
      } else {
        const age = Date.now() - (await stat3(lockPath)).mtimeMs;
        if (age > 30000) {
          await rm4(lockPath, { force: true });
          continue;
        }
      }
    } catch {}
    await new Promise((resolve3) => setTimeout(resolve3, 25));
  }
  throw new Error(`Timed out waiting for this alias's private OpenCode ${resourceName} lock.`);
}

// src/providers/opencode/profiles.ts
var OPENCODE_GO_PROVIDER_ID = "opencode-go";
var OPENCODE_V2_MANAGED_PROVIDER_ID = "claudex-switch-opencode-go";
function emptyState() {
  return { active: null };
}
function isOpenCodeAuthInfo(value) {
  if (!value || typeof value !== "object")
    return false;
  const info2 = value;
  return info2.type === "api" && typeof info2.key === "string" && info2.key.length > 0;
}
async function ensureProfileDir(profileId) {
  const directory = openCodeProfileDir(profileId);
  await mkdir8(directory, { recursive: true, mode: 448 });
  await chmod6(directory, 448);
}
async function writeProfileData2(profileId, data) {
  await ensureProfileDir(profileId);
  await writeJsonSecure(openCodeProfileDataFile(profileId), data);
}
function createOpenCodeProfileId() {
  return `go-${randomUUID5()}`;
}
function normalizeOpenCodeGoModel(input) {
  const model = input.trim();
  if (!model.startsWith(`${OPENCODE_GO_PROVIDER_ID}/`) || model.length <= OPENCODE_GO_PROVIDER_ID.length + 1) {
    throw new Error("OpenCode Go models must use the form opencode-go/<model> (for example opencode-go/kimi-k3).");
  }
  return model;
}
async function readOpenCodeState() {
  return readJson(OPENCODE_STATE_FILE, emptyState());
}
async function writeOpenCodeState(state) {
  await mkdir8(OPENCODE_PROFILES_DIR, { recursive: true, mode: 448 });
  await writeJsonSecure(OPENCODE_STATE_FILE, state);
}
async function setActiveOpenCodeProfile(profileId) {
  const state = await readOpenCodeState();
  state.active = profileId;
  await writeOpenCodeState(state);
}
async function openCodeProfileExists(profileId) {
  return fileExists(openCodeProfileDataFile(profileId));
}
async function getOpenCodeProfileData(profileId) {
  const data = await readJson(openCodeProfileDataFile(profileId), null);
  if (!data || data.type !== "go") {
    throw new Error("OpenCode Go profile no longer exists.");
  }
  return data;
}
async function updateOpenCodeProfileDefaultModel(profileId, defaultModel) {
  const current2 = await getOpenCodeProfileData(profileId);
  const next = { ...current2, defaultModel };
  await writeProfileData2(profileId, next);
  return next;
}
function openCodeSetupEnvironment(profileId) {
  const env3 = { ...process.env };
  delete env3.OPENCODE_AUTH_CONTENT;
  env3.XDG_DATA_HOME = openCodeProfileDataHome(profileId);
  return env3;
}
async function openCodeRunEnvironment(profileId) {
  const auth = await readJson(openCodeProfileAuthFile(profileId), {});
  const credential = auth[OPENCODE_GO_PROVIDER_ID];
  if (!isOpenCodeAuthInfo(credential)) {
    throw new Error("OpenCode Go credential is missing from this profile.");
  }
  const env3 = { ...process.env };
  env3.OPENCODE_AUTH_CONTENT = JSON.stringify({
    [OPENCODE_GO_PROVIDER_ID]: credential
  });
  return env3;
}
async function hasOpenCodeGoCredential(profileId) {
  const profile = await readJson(openCodeProfileDataFile(profileId), null);
  if (!profile || profile.type !== "go")
    return false;
  if (profile.console) {
    const credentials = await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(profileId));
    return credentials.some((credential) => credential.id === profile.console.credentialId && credential.value.metadata.accountID === profile.console.accountId && credential.value.metadata.orgID === profile.console.orgId);
  }
  return await readOpenCodeGoApiKey(profileId) !== null;
}
async function saveOpenCodeConsoleProfile(profileId, profile) {
  if (!profile.console)
    throw new Error("Subscription identity is missing.");
  await writeProfileData2(profileId, profile);
}
async function readOpenCodeGoApiKey(profileId) {
  const auth = await readJson(openCodeProfileAuthFile(profileId), {});
  const credential = auth[OPENCODE_GO_PROVIDER_ID];
  return isOpenCodeAuthInfo(credential) ? credential.key : null;
}
async function createOpenCodeGoProfile(profileId, credential) {
  await writeProfileData2(profileId, { type: "go" });
  if (credential !== undefined) {
    await saveOpenCodeGoCredential(profileId, credential);
  }
}
async function saveOpenCodeGoCredential(profileId, credential) {
  if (!isOpenCodeAuthInfo(credential)) {
    throw new Error("The saved OpenCode Go credential is invalid.");
  }
  const authFile2 = openCodeProfileAuthFile(profileId);
  await mkdir8(openCodeProfileDataHome(profileId), {
    recursive: true,
    mode: 448
  });
  await mkdir8(dirname5(authFile2), {
    recursive: true,
    mode: 448
  });
  const temporaryFile = `${authFile2}.${randomUUID5()}.tmp`;
  try {
    await writeFile5(temporaryFile, JSON.stringify({ [OPENCODE_GO_PROVIDER_ID]: credential }, null, 2), { mode: 384, flag: "wx" });
    await chmod6(temporaryFile, 384);
    await rename3(temporaryFile, authFile2);
  } finally {
    await rm5(temporaryFile, { force: true });
  }
}
async function readGlobalOpenCodeGoCredential() {
  const auth = await readJson(OPENCODE_GLOBAL_AUTH_FILE, {});
  const credential = auth[OPENCODE_GO_PROVIDER_ID];
  return isOpenCodeAuthInfo(credential) ? credential : null;
}
async function removeOpenCodeProfile(profileId) {
  const directory = openCodeProfileDir(profileId);
  if (!/^go-[0-9a-f-]{36}$/i.test(profileId)) {
    throw new Error("Refusing to remove an invalid OpenCode profile id.");
  }
  const profile = await readJson(openCodeProfileDataFile(profileId), null);
  let release;
  if (profile?.console) {
    await mkdir8(OPENCODE_LOCKS_DIR, { recursive: true, mode: 448 });
    release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account", 100);
  }
  try {
    await rm5(directory, { recursive: true, force: true });
    const state = await readOpenCodeState();
    if (state.active === profileId) {
      state.active = null;
      await writeOpenCodeState(state);
    }
  } finally {
    await release?.();
  }
}

// src/commands/add.ts
import { spawn as spawn6, spawnSync as spawnSync7 } from "child_process";
import { platform as platform5 } from "os";

// src/accounts/create.ts
import { createHash as createHash7 } from "crypto";

// src/providers/codex/auth.ts
import { chmod as chmod7, copyFile as copyFile2, mkdir as mkdir9, readFile as readFile7, rename as rename4, unlink as unlink3, writeFile as writeFile6 } from "fs/promises";
import { randomUUID as randomUUID6 } from "crypto";
import { dirname as dirname6 } from "path";
async function ensureAccountsDir2() {
  await mkdir9(CODEX_ACCOUNTS_DIR, { recursive: true });
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
  const srcContent = await readFile7(srcPath, "utf-8");
  const auth = parseAuthContent(srcContent);
  if (auth?.auth_mode === "apikey") {
    const normalized = normalizeAuthForCodexCli(auth);
    await writeAuthFileIfChanged(srcPath, normalized);
    await writeAuthFileIfChanged(CODEX_AUTH_FILE, normalized);
    return;
  }
  await writeRawAuthFileIfChanged(CODEX_AUTH_FILE, srcContent);
}
async function saveAccountAuth(accountKey, authData) {
  await ensureAccountsDir2();
  const destPath = codexAccountAuthFile(accountKey);
  await writeAuthFile(destPath, normalizeAuthForCodexCli(authData));
}
async function writeAuthFile(path, authData) {
  await writeRawAuthFile(path, JSON.stringify(authData, null, 2));
}
async function writeAuthFileIfChanged(path, authData) {
  await writeRawAuthFileIfChanged(path, JSON.stringify(authData, null, 2));
}
async function writeRawAuthFileIfChanged(path, content) {
  try {
    if (await readFile7(path, "utf-8") === content) {
      await chmod7(path, 384);
      return;
    }
  } catch {}
  await writeRawAuthFile(path, content);
}
async function writeRawAuthFile(path, content) {
  await mkdir9(dirname6(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${randomUUID6()}.tmp`;
  try {
    await writeFile6(tempPath, content, { mode: 384 });
    await rename4(tempPath, path);
    await chmod7(path, 384);
  } catch (err) {
    try {
      await unlink3(tempPath);
    } catch {}
    throw err;
  }
}
function normalizeAuthForCodexCli(authData) {
  if (authData.auth_mode !== "apikey")
    return authData;
  return {
    auth_mode: "apikey",
    OPENAI_API_KEY: authData.OPENAI_API_KEY
  };
}
function parseAuthContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function decodeJwtPayload2(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2)
      return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}
function decodeIdToken(idToken) {
  try {
    const payload = decodeJwtPayload2(idToken);
    if (!payload)
      return null;
    const authInfo = payload["https://api.openai.com/auth"] ?? {};
    const profileInfo = payload["https://api.openai.com/profile"] ?? {};
    const str2 = (v) => typeof v === "string" ? v : undefined;
    return {
      email: str2(payload.email) ?? str2(profileInfo.email),
      chatgpt_user_id: str2(authInfo.chatgpt_user_id) ?? str2(authInfo.user_id) ?? str2(payload.sub),
      chatgpt_account_id: str2(authInfo.chatgpt_account_id) ?? str2(authInfo.account_id) ?? str2(payload.account_id),
      plan_type: str2(authInfo.chatgpt_plan_type) ?? str2(authInfo.plan_type)
    };
  } catch {
    return null;
  }
}
function decodeCodexPlan(tokens) {
  const accessPayload = decodeJwtPayload2(tokens.access_token);
  const accessAuth = accessPayload?.["https://api.openai.com/auth"] ?? {};
  const accessPlan = typeof accessAuth.chatgpt_plan_type === "string" ? accessAuth.chatgpt_plan_type : typeof accessAuth.plan_type === "string" ? accessAuth.plan_type : null;
  return accessPlan ?? decodeIdToken(tokens.id_token)?.plan_type ?? null;
}
function authMatchesAccount(auth, account) {
  if (auth.auth_mode !== "chatgpt" || !auth.tokens?.id_token)
    return false;
  const identity2 = decodeIdToken(auth.tokens.id_token);
  const userId = identity2?.chatgpt_user_id;
  const accountId = identity2?.chatgpt_account_id ?? auth.tokens.account_id;
  if (userId && accountId) {
    return userId === account.chatgpt_user_id && accountId === account.chatgpt_account_id;
  }
  return Boolean(identity2?.email && account.email && identity2.email.toLowerCase() === account.email.toLowerCase());
}
function sameChatGptIdentity(left, right) {
  if (left.auth_mode !== "chatgpt" || right.auth_mode !== "chatgpt") {
    return false;
  }
  const leftIdentity = decodeIdToken(left.tokens.id_token);
  const rightIdentity = decodeIdToken(right.tokens.id_token);
  const leftUser = leftIdentity?.chatgpt_user_id;
  const rightUser = rightIdentity?.chatgpt_user_id;
  const leftAccount = leftIdentity?.chatgpt_account_id ?? left.tokens.account_id;
  const rightAccount = rightIdentity?.chatgpt_account_id ?? right.tokens.account_id;
  if (leftUser && rightUser && leftAccount && rightAccount) {
    return leftUser === rightUser && leftAccount === rightAccount;
  }
  return Boolean(leftIdentity?.email && rightIdentity?.email && leftIdentity.email.toLowerCase() === rightIdentity.email.toLowerCase());
}
function sameAuthCredentialVersion(left, right) {
  if (left.auth_mode !== right.auth_mode)
    return false;
  if (left.auth_mode === "apikey" && right.auth_mode === "apikey") {
    return left.OPENAI_API_KEY === right.OPENAI_API_KEY;
  }
  if (left.auth_mode !== "chatgpt" || right.auth_mode !== "chatgpt") {
    return false;
  }
  return left.tokens.id_token === right.tokens.id_token && left.tokens.access_token === right.tokens.access_token && left.tokens.refresh_token === right.tokens.refresh_token && left.last_refresh === right.last_refresh;
}
async function syncActiveAuthSnapshot(reg) {
  const account = reg.accounts.find((candidate) => candidate.account_key === reg.active_account_key);
  if (!account || account.auth_mode !== "chatgpt")
    return false;
  const activeAuth = await readActiveAuth();
  if (!activeAuth || !authMatchesAccount(activeAuth, account))
    return false;
  await saveAccountAuth(account.account_key, activeAuth);
  return true;
}
async function removeAccountAuthFile(accountKey) {
  const path = codexAccountAuthFile(accountKey);
  try {
    await unlink3(path);
  } catch {}
}

// src/accounts/create.ts
async function createClaudeApiKeyAccount(input) {
  const alias = input.alias.trim();
  await assertAliasUsable(alias);
  const apiKey = input.apiKey.trim();
  if (!apiKey)
    throw new Error("API key cannot be empty");
  const config = {
    apiKey,
    baseUrl: input.baseUrl,
    authToken: input.authToken,
    model: input.model,
    defaultFableModel: input.defaultFableModel,
    defaultSonnetModel: input.defaultSonnetModel,
    defaultOpusModel: input.defaultOpusModel,
    defaultHaikuModel: input.defaultHaikuModel,
    subagentModel: input.subagentModel,
    env: input.env
  };
  await addApiKeyProfile(alias, config);
  await addAlias(alias, { provider: "claude", profileName: alias });
}
async function createCodexApiKeyAccount(input) {
  const alias = input.alias.trim();
  await assertAliasUsable(alias);
  const key = input.apiKey.trim();
  if (!key)
    throw new Error("API key cannot be empty");
  const defaultModel = input.defaultModel.trim();
  if (!defaultModel)
    throw new Error("Default model cannot be empty");
  const accountKey = codexApiAccountKey(key);
  const existingAlias = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey
  });
  if (existingAlias) {
    throw new Error(`This Codex account is already imported as "${existingAlias.alias}"`);
  }
  const registry = await loadRegistry();
  await syncActiveAuthSnapshot(registry);
  await saveAccountAuth(accountKey, {
    auth_mode: "apikey",
    OPENAI_API_KEY: key
  });
  const account = {
    account_key: accountKey,
    chatgpt_account_id: "",
    chatgpt_user_id: "",
    email: "",
    alias,
    account_name: null,
    plan: null,
    auth_mode: "apikey",
    default_model: defaultModel,
    api_provider: input.provider,
    created_at: Math.floor(Date.now() / 1000),
    last_used_at: Math.floor(Date.now() / 1000),
    last_usage: null,
    last_usage_at: null,
    last_local_rollout: null
  };
  addAccountToRegistry(registry, account);
  setActiveAccount(registry, accountKey);
  await saveRegistry(registry);
  await switchToAccount(accountKey);
  await applyCodexApiProvider(input.provider, key, defaultModel);
  await addAlias(alias, { provider: "codex", accountKey });
}
function codexApiAccountKey(apiKey) {
  const keyHash = createHash7("sha256").update(apiKey.trim()).digest("hex").slice(0, 16);
  return `apikey::${keyHash}`;
}
async function assertAliasUsable(alias) {
  if (!alias)
    throw new Error("Alias cannot be empty");
  const registry = await loadAliases();
  const rejection = checkAlias(registry, alias);
  if (rejection)
    throw new Error(describeAliasRejection(rejection, alias));
}

// src/providers/codex/login.ts
import { spawn as spawn2 } from "child_process";

// src/providers/codex/isolated-home.ts
import { chmod as chmod8, copyFile as copyFile3, mkdtemp, readFile as readFile8, rm as rm6, writeFile as writeFile7 } from "fs/promises";
import { tmpdir as tmpdir3 } from "os";
import { join as join10 } from "path";
var AUTH_FILE_NAME = "auth.json";
async function prepareIsolatedCodexHome(auth = null) {
  const home = await mkdtemp(join10(tmpdir3(), "claudex-codex-"));
  await chmod8(home, 448);
  if (await fileExists(CODEX_CONFIG_FILE)) {
    await copyFile3(CODEX_CONFIG_FILE, join10(home, "config.toml"));
  }
  if (auth) {
    await writeFile7(join10(home, AUTH_FILE_NAME), JSON.stringify(auth, null, 2), { mode: 384 });
  }
  return home;
}
async function readIsolatedCodexAuth(home) {
  try {
    return JSON.parse(await readFile8(join10(home, AUTH_FILE_NAME), "utf-8"));
  } catch {
    return null;
  }
}
async function cleanupIsolatedCodexHome(home) {
  await rm6(home, { recursive: true, force: true });
}

// src/providers/codex/login.ts
async function runIsolatedCodexLogin() {
  const codexHome = await prepareIsolatedCodexHome();
  const shimDir = createOpenShimDir();
  const env3 = { ...process.env, CODEX_HOME: codexHome };
  if (shimDir)
    env3.PATH = `${shimDir}:${process.env.PATH}`;
  delete env3.OPENAI_API_KEY;
  delete env3.CODEX_API_KEY;
  delete env3.CODEX_ACCESS_TOKEN;
  try {
    const proc = spawn2("codex", ["login", "-c", 'cli_auth_credentials_store="file"'], { stdio: "inherit", env: env3 });
    const exitCode = await new Promise((resolve3, reject) => {
      proc.on("close", resolve3);
      proc.on("error", reject);
    });
    const auth = exitCode === 0 ? await readIsolatedCodexAuth(codexHome) : null;
    return { exitCode, auth };
  } finally {
    cleanupOpenShimDir(shimDir);
    await cleanupIsolatedCodexHome(codexHome);
  }
}

// src/lib/oneapi.ts
import { mkdir as mkdir10 } from "fs/promises";
import { dirname as dirname7 } from "path";
var FETCH_TIMEOUT_MS = 4000;
var UNLIMITED_THRESHOLD_USD = 1e7;
var DEFAULT_QUOTA_PER_UNIT = 500000;
async function fetchRelayBalance(baseUrl2, apiKey) {
  let origin;
  try {
    origin = new URL(baseUrl2).origin;
  } catch {
    return null;
  }
  const [key, account] = await Promise.all([
    fetchKeyBalance(origin, apiKey),
    fetchAccountBalance(origin)
  ]);
  if (!key && !account)
    return null;
  return { key, account };
}
async function fetchKeyBalance(origin, apiKey) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  for (const prefix of ["/v1", ""]) {
    const subscription = await getJson(`${origin}${prefix}/dashboard/billing/subscription`, headers);
    const totalUsd = subscription?.hard_limit_usd;
    if (typeof totalUsd !== "number")
      continue;
    const end = new Date;
    const start = new Date(end.getTime() - 90 * 86400000);
    const day = (d) => d.toISOString().slice(0, 10);
    const usage2 = await getJson(`${origin}${prefix}/dashboard/billing/usage?start_date=${day(start)}&end_date=${day(end)}`, headers);
    const usedUsd = typeof usage2?.total_usage === "number" ? usage2.total_usage / 100 : null;
    const unlimited = totalUsd >= UNLIMITED_THRESHOLD_USD;
    return {
      unlimited,
      usedUsd,
      remainingUsd: unlimited || usedUsd === null ? null : Math.max(0, totalUsd - usedUsd)
    };
  }
  return null;
}
async function getRelayConfig(origin) {
  const relays = await readJson(RELAYS_FILE, {});
  const config = relays[origin];
  if (!config || typeof config.accessToken !== "string" || !config.accessToken) {
    return null;
  }
  return config;
}
async function saveRelayConfig(origin, config) {
  const relays = await readJson(RELAYS_FILE, {});
  relays[origin] = config;
  await mkdir10(dirname7(RELAYS_FILE), { recursive: true });
  await writeJsonSecure(RELAYS_FILE, relays);
}
async function detectRelay(origin) {
  const status = await getJson(`${origin}/api/status`, {});
  const data = status?.data && typeof status.data === "object" ? status.data : null;
  if (!data)
    return null;
  const quotaPerUnit = toNumber(data.quota_per_unit);
  const systemName = typeof data.system_name === "string" ? data.system_name : null;
  if (quotaPerUnit === null && systemName === null)
    return null;
  return { systemName, quotaPerUnit };
}
async function fetchAccountBalance(origin) {
  const config = await getRelayConfig(origin);
  if (!config)
    return null;
  return fetchAccountBalanceWith(origin, config);
}
async function fetchAccountBalanceWith(origin, config) {
  const headers = {
    Authorization: config.accessToken
  };
  if (config.userId !== undefined) {
    headers["New-Api-User"] = String(config.userId);
  }
  const [self, status] = await Promise.all([
    getJson(`${origin}/api/user/self`, headers),
    typeof config.quotaPerUnit === "number" ? Promise.resolve(null) : getJson(`${origin}/api/status`, {})
  ]);
  if (self?.success !== true)
    return null;
  const data = self.data;
  if (!data || typeof data !== "object")
    return null;
  const quota = toNumber(data.quota);
  if (quota === null)
    return null;
  const usedQuota = toNumber(data.used_quota);
  const statusData = status?.data && typeof status.data === "object" ? status.data : null;
  const quotaPerUnit = typeof config.quotaPerUnit === "number" ? config.quotaPerUnit : (statusData && toNumber(statusData.quota_per_unit)) ?? DEFAULT_QUOTA_PER_UNIT;
  return {
    unlimited: false,
    remainingUsd: quota / quotaPerUnit,
    usedUsd: usedQuota === null ? null : usedQuota / quotaPerUnit
  };
}
function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value))
    return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed))
      return parsed;
  }
  return null;
}
async function getJson(url, headers) {
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!res.ok)
      return null;
    const data = JSON.parse(await res.text());
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

// src/providers/opencode/tui.ts
import { spawn as spawn3, spawnSync as spawnSync5 } from "child_process";
async function runOpenCodeTui(profileId, spawnCommand = spawn3) {
  const proc = spawnCommand("opencode", [], {
    stdio: "inherit",
    env: openCodeSetupEnvironment(profileId)
  });
  return new Promise((resolve3) => {
    proc.once("error", () => resolve3(127));
    proc.once("close", (code) => resolve3(code ?? 1));
  });
}

// src/providers/opencode/version.ts
import { spawnSync as spawnSync6 } from "child_process";
function parseOpenCodeVersion(output) {
  const match = output.match(/(?:^|\s)v?(\d+)\.(\d+)\.(\d+)(?:[-+][\w.-]+)?(?=\s|$)/i);
  if (!match)
    return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: match[0].trim()
  };
}
function isSupportedOpenCodeVersion(version) {
  return version !== null && (version.major === 1 || version.major === 2);
}
function detectOpenCodeVersion() {
  try {
    const result2 = spawnSync6("opencode", ["--version"], {
      encoding: "utf-8",
      windowsHide: true,
      timeout: 5000,
      killSignal: "SIGTERM"
    });
    if (result2.status !== 0 || result2.error)
      return null;
    return parseOpenCodeVersion(`${result2.stdout ?? ""}
${result2.stderr ?? ""}`);
  } catch {
    return null;
  }
}

// src/providers/opencode/console.ts
import { spawn as spawn5 } from "child_process";
import { chmod as chmod10, mkdir as mkdir12 } from "fs/promises";
import { join as join13 } from "path";

// src/providers/opencode/catalog.ts
import { createHash as createHash8, randomUUID as randomUUID7 } from "crypto";
import { link, readFile as readFile9, rename as rename5, rm as rm7, stat as stat4, writeFile as writeFile8 } from "fs/promises";
import { join as join11 } from "path";
var OPENCODE_GO_CATALOG_URL = "https://opencode.ai/zen/go/v1/models";
async function prepareOpenCodeModelCatalog(env3) {
  const offline = env3.OPENCODE_DISABLE_MODELS_FETCH;
  env3.OPENCODE_DISABLE_MODELS_FETCH = "1";
  if (env3.OPENCODE_MODELS_PATH || !env3.XDG_CACHE_HOME)
    return;
  const path = join11(env3.XDG_CACHE_HOME, "claudex-models.json");
  let cached;
  let fresh2 = false;
  const valid = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data))
      return false;
    const provider = data.opencode;
    return !!provider && typeof provider === "object" && !Array.isArray(provider) && !!provider.models && typeof provider.models === "object" && !Array.isArray(provider.models) && Object.keys(provider.models).length > 0;
  };
  try {
    const text = await readFile9(path, "utf8");
    if (valid(JSON.parse(text)))
      cached = text;
    fresh2 = cached !== undefined && Date.now() - (await stat4(path)).mtimeMs < 5 * 60000;
  } catch {}
  if (!fresh2 && offline !== "1" && offline !== "true") {
    const temporary = `${path}.${randomUUID7()}.tmp`;
    try {
      const base = env3.OPENCODE_MODELS_URL || "https://models.opencode.ai";
      const response = await fetch(`${base.replace(/\/$/, "")}/api.json`, {
        signal: AbortSignal.timeout(5000),
        redirect: "error"
      });
      if (response.ok) {
        const text = await response.text();
        if (valid(JSON.parse(text))) {
          await writeFile8(temporary, text, { mode: 384 });
          await rename5(temporary, path);
          cached = text;
        }
      }
    } catch {} finally {
      await rm7(temporary, { force: true });
    }
  }
  if (cached) {
    const digest = createHash8("sha256").update(cached).digest("hex");
    const snapshot = join11(env3.XDG_CACHE_HOME, `claudex-models-${digest}.json`);
    const temporary = `${path}.${randomUUID7()}.tmp`;
    try {
      await writeFile8(temporary, cached, { mode: 384 });
      try {
        await link(temporary, snapshot);
      } catch (error2) {
        if (error2.code !== "EEXIST")
          throw error2;
      }
      env3.OPENCODE_MODELS_PATH = snapshot;
    } finally {
      await rm7(temporary, { force: true });
    }
  }
}
async function fetchOpenCodeGoCatalogIds() {
  try {
    const response = await fetch(OPENCODE_GO_CATALOG_URL, { signal: AbortSignal.timeout(5000), redirect: "error" });
    if (!response.ok)
      return null;
    const data = await response.json();
    const items = data && typeof data === "object" && Array.isArray(data.data) ? data.data : [];
    const ids = new Set(items.flatMap((item) => item && typeof item === "object" && typeof item.id === "string" ? [item.id] : []));
    return ids.size > 0 ? ids : null;
  } catch {
    return null;
  }
}
function matchOpenCodeGoModel(input, catalog2) {
  const model = normalizeOpenCodeGoModel(input);
  const id = model.slice(OPENCODE_GO_PROVIDER_ID.length + 1);
  if (catalog2.has(id))
    return model;
  const wanted = id.toLowerCase().replace(/\s+/g, "-");
  const match = [...catalog2].find((candidate) => candidate.toLowerCase() === wanted);
  if (match)
    return `${OPENCODE_GO_PROVIDER_ID}/${match}`;
  throw new Error(`OpenCode Go has no model "${id}". Available: ${[...catalog2].sort().join(", ")}.`);
}
async function resolveOpenCodeGoModel(input) {
  const catalog2 = await fetchOpenCodeGoCatalogIds();
  return catalog2 ? matchOpenCodeGoModel(input, catalog2) : normalizeOpenCodeGoModel(input);
}

// src/providers/opencode/runtime.ts
import { randomBytes as randomBytes5, randomUUID as randomUUID8 } from "crypto";
import { spawn as spawn4 } from "child_process";
import { join as join12 } from "path";
import { chmod as chmod9, mkdir as mkdir11, readFile as readFile10, rename as rename6, rm as rm8, writeFile as writeFile9 } from "fs/promises";
var OPENCODE_NATIVE_GO_KEY_ENV = "OPENCODE_API_KEY";
var OPENCODE_FREE_PROVIDER_ID = "opencode";
function isOpenCodeFreeModel(model) {
  return model.providerID === OPENCODE_FREE_PROVIDER_ID && Array.isArray(model.cost) && model.cost.length > 0 && model.cost.every((tier) => isRecord2(tier) && tier.input === 0 && tier.output === 0 && (tier.cache === undefined || isRecord2(tier.cache) && Object.values(tier.cache).every((price) => price === 0)));
}
function mapOpenCodeGoModelForV2(model) {
  const normalized = normalizeOpenCodeGoModel(model);
  const modelId = normalized.slice(OPENCODE_GO_PROVIDER_ID.length + 1);
  return `${OPENCODE_V2_MANAGED_PROVIDER_ID}/${modelId}`;
}
function isRecord2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function parseConfigContent(content) {
  if (!content?.trim())
    return {};
  try {
    const parsed = JSON.parse(content);
    if (!isRecord2(parsed))
      throw new Error("Configuration must be a JSON object.");
    return parsed;
  } catch {
    throw new Error("Could not merge OpenCode V2 launch settings with OPENCODE_CONFIG_CONTENT. Use valid JSON in that environment variable and retry.");
  }
}
function stringArray(value, field3) {
  if (value === undefined)
    return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`OpenCode V2 ${field3} must be an array of provider IDs.`);
  }
  return value;
}
function providerPatternMatches(pattern, providerID) {
  const escaped = pattern.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(providerID);
}
function modelForV2(config, selectedModel) {
  const candidate = selectedModel ?? config.model;
  if (typeof candidate !== "string" || !candidate.trim()) {
    throw new Error("OpenCode V2 aliases require an OpenCode Go model. Set this alias's default model or pass -run --model opencode-go/<model> before starting the TUI.");
  }
  let normalized;
  try {
    normalized = normalizeOpenCodeGoModel(candidate);
  } catch {
    throw new Error("OpenCode V2 aliases only bind credentials for OpenCode Go models. Set an opencode-go/<model> default or pass -run --model opencode-go/<model>; other-provider sessions are outside this alias's account-selection guarantee.");
  }
  return mapOpenCodeGoModelForV2(normalized);
}
function buildOpenCodeV2Config(source, selectedModel, managedModels = []) {
  const config = parseConfigContent(source);
  const providersValue = config.providers;
  if (providersValue !== undefined && !isRecord2(providersValue)) {
    throw new Error("OpenCode V2 providers config must be an object.");
  }
  const providers = isRecord2(providersValue) ? { ...providersValue } : {};
  if (Object.hasOwn(providers, OPENCODE_V2_MANAGED_PROVIDER_ID)) {
    throw new Error("OpenCode V2 config already uses claudex-switch's reserved provider ID; refusing to override it.");
  }
  const mappedModel = modelForV2(config, selectedModel);
  config.model = mappedModel;
  const modelIds = new Set([
    mappedModel.slice(OPENCODE_V2_MANAGED_PROVIDER_ID.length + 1)
  ]);
  for (const model of managedModels) {
    const normalized = normalizeOpenCodeGoModel(model);
    modelIds.add(normalized.slice(OPENCODE_GO_PROVIDER_ID.length + 1));
  }
  const models2 = Object.fromEntries([...modelIds].map((modelId) => [modelId, {}]));
  providers[OPENCODE_V2_MANAGED_PROVIDER_ID] = {
    name: "OpenCode Go (claudex-switch)",
    canonical: OPENCODE_GO_PROVIDER_ID,
    models: models2
  };
  config.providers = providers;
  return restrictOpenCodeProviders(config, OPENCODE_V2_MANAGED_PROVIDER_ID);
}
function restrictOpenCodeProviders(config, providerId) {
  const experimentalValue = config.experimental;
  if (experimentalValue !== undefined && !isRecord2(experimentalValue)) {
    throw new Error("OpenCode V2 experimental config must be an object.");
  }
  const experimental = isRecord2(experimentalValue) ? { ...experimentalValue } : {};
  const existingPolicies = experimental.policies;
  if (existingPolicies !== undefined && !Array.isArray(existingPolicies)) {
    throw new Error("OpenCode V2 experimental.policies must be an array.");
  }
  const sourcePolicies = Array.isArray(existingPolicies) ? existingPolicies : [];
  const userDeniesManaged = sourcePolicies.some((policy) => isRecord2(policy) && policy.action === "provider.use" && policy.effect === "deny" && typeof policy.resource === "string" && providerPatternMatches(policy.resource, providerId));
  if (userDeniesManaged) {
    throw new Error("OpenCode V2 configuration denies claudex-switch's managed Go provider; refusing to weaken that restriction.");
  }
  const denyOtherProviders = {
    action: "provider.use",
    resource: "*",
    effect: "deny"
  };
  const allowManagedProvider = {
    action: "provider.use",
    resource: providerId,
    effect: "allow"
  };
  const policies = sourcePolicies.filter((policy) => !isRecord2(policy) || (policy.action !== denyOtherProviders.action || policy.resource !== denyOtherProviders.resource || policy.effect !== denyOtherProviders.effect) && (policy.action !== allowManagedProvider.action || policy.resource !== allowManagedProvider.resource || policy.effect !== allowManagedProvider.effect));
  const userDenies = sourcePolicies.filter((policy) => isRecord2(policy) && policy.action === "provider.use" && policy.effect === "deny");
  const userNonDenies = policies.filter((policy) => !isRecord2(policy) || policy.action !== "provider.use" || policy.effect !== "deny");
  const disabledProviders = stringArray(config.disabled_providers, "disabled_providers");
  const enabledProviders = stringArray(config.enabled_providers, "enabled_providers");
  if (disabledProviders.includes(providerId)) {
    throw new Error("OpenCode V2 configuration disables claudex-switch's managed Go provider; refusing to weaken that restriction.");
  }
  if (config.enabled_providers !== undefined && !enabledProviders.includes(providerId)) {
    throw new Error("OpenCode V2 configuration does not enable claudex-switch's managed Go provider; refusing to override the allowlist.");
  }
  const freeDenied = disabledProviders.includes(OPENCODE_FREE_PROVIDER_ID) || config.enabled_providers !== undefined && !enabledProviders.includes(OPENCODE_FREE_PROVIDER_ID) || userDenies.some((policy) => isRecord2(policy) && typeof policy.resource === "string" && providerPatternMatches(policy.resource, OPENCODE_FREE_PROVIDER_ID));
  experimental.policies = [
    ...userNonDenies,
    denyOtherProviders,
    allowManagedProvider,
    ...!freeDenied ? [{ action: "provider.use", resource: OPENCODE_FREE_PROVIDER_ID, effect: "allow" }] : [],
    ...userDenies
  ];
  config.experimental = experimental;
  config.enabled_providers = freeDenied ? [providerId] : [providerId, OPENCODE_FREE_PROVIDER_ID];
  if (config.disabled_providers !== undefined)
    config.disabled_providers = disabledProviders;
  return config;
}
async function readModelInventory(file) {
  let contents;
  try {
    contents = await readFile10(file, "utf8");
  } catch (error2) {
    if (error2.code === "ENOENT")
      return [];
    throw new Error("Could not read this alias's private OpenCode model history.");
  }
  let value;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error("This alias's private OpenCode model history is malformed; refusing to overwrite it.");
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("This alias's private OpenCode model history has an unexpected schema.");
  }
  try {
    return [...new Set(value.map((item) => normalizeOpenCodeGoModel(item)))];
  } catch {
    throw new Error("This alias's private OpenCode model history contains an invalid model ID.");
  }
}
async function writeModelInventory(file, models2) {
  const temporaryFile = `${file}.${randomUUID8()}.tmp`;
  try {
    await writeFile9(temporaryFile, JSON.stringify(models2, null, 2), { flag: "wx", mode: 384 });
    await chmod9(temporaryFile, 384);
    await rename6(temporaryFile, file);
  } catch {
    throw new Error("Could not save this alias's private OpenCode model history.");
  } finally {
    await rm8(temporaryFile, { force: true });
  }
}
async function rememberOpenCodeV2Model(profileId, source, selectedModel) {
  const selectedConfig = buildOpenCodeV2Config(source, selectedModel);
  const managedModel = selectedConfig.model;
  if (typeof managedModel !== "string" || !managedModel.startsWith(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/`)) {
    throw new Error("OpenCode V2 could not resolve a managed Go model.");
  }
  const selectedGoModel = `${OPENCODE_GO_PROVIDER_ID}/${managedModel.slice(OPENCODE_V2_MANAGED_PROVIDER_ID.length + 1)}`;
  const runtimeRoot = openCodeProfileV2RuntimeDir(profileId);
  await mkdir11(runtimeRoot, { recursive: true, mode: 448 });
  await chmod9(runtimeRoot, 448);
  const inventoryFile = openCodeProfileV2ModelInventoryFile(profileId);
  const release = await acquireProfileLock(`${inventoryFile}.lock`, "model history");
  try {
    const existing = (await readModelInventory(inventoryFile)).filter((model) => model === selectedGoModel || model.toLowerCase() !== selectedGoModel.toLowerCase());
    const next = [...new Set([...existing, selectedGoModel])];
    buildOpenCodeV2Config(source, selectedGoModel, next);
    await writeModelInventory(inventoryFile, next);
    return next;
  } finally {
    await release();
  }
}
async function readOwnedCredentialIds(file) {
  let contents;
  try {
    contents = await readFile10(file, "utf8");
  } catch (error2) {
    if (error2.code === "ENOENT")
      return [];
    throw new Error("Could not read this alias's private OpenCode credential index.");
  }
  let value;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error("This alias's private OpenCode credential index is malformed; refusing cleanup.");
  }
  if (!isRecord2(value) || value.version !== 1 || !Array.isArray(value.credentialIds) || value.credentialIds.some((id) => typeof id !== "string" || id.length === 0)) {
    throw new Error("This alias's private OpenCode credential index has an unexpected schema.");
  }
  return [...new Set(value.credentialIds)];
}
async function writeOwnedCredentialIds(file, credentialIds) {
  const temporaryFile = `${file}.${randomUUID8()}.tmp`;
  try {
    await writeFile9(temporaryFile, JSON.stringify({ version: 1, credentialIds }, null, 2), {
      flag: "wx",
      mode: 384
    });
    await chmod9(temporaryFile, 384);
    await rename6(temporaryFile, file);
  } catch {
    throw new Error("Could not update this alias's private OpenCode credential index.");
  } finally {
    await rm8(temporaryFile, { force: true });
  }
}
function serverUrlFromLine(line) {
  let value;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isRecord2(value) || typeof value.url !== "string")
    return null;
  let url;
  try {
    url = new URL(value.url);
  } catch {
    throw new Error("OpenCode V2 returned an invalid local server address.");
  }
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("OpenCode V2 did not bind its credential API to the expected loopback address.");
  }
  return url.origin;
}
function waitForLocalServer(child, timeoutMs) {
  return new Promise((resolve3, reject) => {
    let output = "";
    let settled = false;
    const finish = (error2, url) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      child.stdout?.off("data", onData);
      child.off("error", onError);
      child.off("close", onClose);
      if (error2)
        reject(error2);
      else
        resolve3(url);
    };
    const onData = (chunk) => {
      output += chunk.toString();
      const lines = output.split(/\r?\n/);
      output = lines.pop() ?? "";
      for (const line of lines) {
        try {
          const url = serverUrlFromLine(line);
          if (url)
            return finish(undefined, url);
        } catch (error2) {
          return finish(error2 instanceof Error ? error2 : new Error("OpenCode V2 local server failed."));
        }
      }
    };
    const onError = () => finish(new Error("Could not start OpenCode V2's private credential service."));
    const onClose = () => finish(new Error("OpenCode V2's private credential service exited before it was ready."));
    const timer = setTimeout(() => finish(new Error("Timed out starting OpenCode V2's private credential service.")), timeoutMs);
    child.stdout?.on("data", onData);
    child.stderr?.on("data", () => {});
    child.once("error", onError);
    child.once("close", onClose);
  });
}
function waitForChildClose(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null)
    return Promise.resolve(true);
  return new Promise((resolve3) => {
    const finish = (closed) => {
      clearTimeout(timer);
      child.off("close", onClose);
      resolve3(closed);
    };
    const onClose = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once("close", onClose);
  });
}
async function stopLocalServer(child) {
  if (child.exitCode !== null || child.signalCode !== null)
    return;
  child.stdin?.end();
  if (await waitForChildClose(child, 1500))
    return;
  child.kill("SIGTERM");
  if (await waitForChildClose(child, 1500))
    return;
  child.kill("SIGKILL");
  if (await waitForChildClose(child, 1500))
    return;
  throw new Error("Could not stop OpenCode V2's private credential service; refusing to launch the TUI.");
}
function authHeaders(password) {
  return {
    authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`,
    "content-type": "application/json"
  };
}
async function fetchOpenCodeApi(fetcher, baseUrl2, path, password, init = {}) {
  try {
    return await fetcher(new URL(path, baseUrl2), {
      ...init,
      headers: { ...authHeaders(password), ...init.headers ?? {} },
      signal: AbortSignal.timeout(15000),
      redirect: "error"
    });
  } catch {
    throw new Error("Could not sync the selected OpenCode Go key to this alias's private database.");
  }
}
async function withOpenCodePrivateServer(env3, callback, spawnCommand = spawn4) {
  const password = randomBytes5(32).toString("base64url");
  const serverEnv = { ...env3 };
  delete serverEnv.OPENCODE_AUTH_CONTENT;
  delete serverEnv[OPENCODE_NATIVE_GO_KEY_ENV];
  serverEnv.OPENCODE_PASSWORD = password;
  serverEnv.OPENCODE_DISABLE_AUTOUPDATE = "1";
  serverEnv.OPENCODE_DISABLE_MODELS_FETCH = "1";
  const child = spawnCommand("opencode", ["serve", "--stdio", "--hostname", "127.0.0.1", "--port", "0"], { stdio: ["pipe", "pipe", "pipe"], windowsHide: true, env: serverEnv });
  try {
    const baseUrl2 = await waitForLocalServer(child, 15000);
    child.stdout?.on("data", () => {});
    return await callback(baseUrl2, password);
  } finally {
    await stopLocalServer(child);
  }
}
function locationData(value) {
  if (!isRecord2(value) || !isRecord2(value.location) || typeof value.location.directory !== "string" || value.data === undefined) {
    throw new Error("OpenCode V2 returned an unexpected location-scoped API response.");
  }
  return value.data;
}
async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error("OpenCode V2 returned invalid local API data.");
  }
}
function configuredDefaultAgent(configEntries) {
  if (!Array.isArray(configEntries)) {
    throw new Error("Could not verify OpenCode V2's effective local configuration.");
  }
  let defaultAgent = "build";
  for (const entry of configEntries) {
    if (isRecord2(entry) && entry.type === "document" && isRecord2(entry.info)) {
      if (entry.info.default_agent !== undefined) {
        if (typeof entry.info.default_agent !== "string" || !entry.info.default_agent) {
          throw new Error("OpenCode V2 has an invalid default agent setting.");
        }
        defaultAgent = entry.info.default_agent;
      }
    }
  }
  return defaultAgent;
}
function effectiveCompactionSettings(configEntries) {
  if (!Array.isArray(configEntries)) {
    throw new Error("Could not verify OpenCode V2's effective local configuration.");
  }
  let auto = true;
  let buffer;
  for (const entry of configEntries) {
    if (!isRecord2(entry) || entry.type !== "document" || !isRecord2(entry.info))
      continue;
    const compaction = entry.info.compaction;
    if (compaction === undefined)
      continue;
    if (!isRecord2(compaction)) {
      throw new Error("OpenCode V2 has an invalid compaction setting.");
    }
    if (compaction.auto !== undefined) {
      if (typeof compaction.auto !== "boolean") {
        throw new Error("OpenCode V2 has an invalid compaction setting.");
      }
      auto = compaction.auto;
    }
    const value = compaction.buffer ?? compaction.reserved;
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error("OpenCode V2 has an invalid compaction buffer setting.");
      }
      buffer = value;
    }
  }
  return { auto, buffer };
}
var OPENCODE_COMPACTION_WINDOW_FLOOR = 500000;
var OPENCODE_COMPACTION_FALLBACK_WINDOW = 200000;
var OPENCODE_MINIMUM_COMPACTION_BUFFER = 16000;
function defaultCompactionBuffer(window) {
  const tenPercent = Math.floor(window * 0.1);
  return window >= 2 * OPENCODE_MINIMUM_COMPACTION_BUFFER ? Math.max(tenPercent, OPENCODE_MINIMUM_COMPACTION_BUFFER) : tenPercent;
}
function applyManagedCompactionPolicy(configContent, routing, selectedModelId) {
  if (!routing.auto)
    return { configContent };
  let smallest;
  const checked = new Set([selectedModelId, routing.agentModelId, ...routing.freeModelIds ?? []].filter((value) => value !== undefined));
  for (const id of checked) {
    const reported = routing.windows.get(id);
    const window = reported !== undefined && reported > 0 ? reported : OPENCODE_COMPACTION_FALLBACK_WINDOW;
    if (!smallest || window < smallest.window)
      smallest = { id, window };
  }
  if (!smallest || smallest.window >= OPENCODE_COMPACTION_WINDOW_FLOOR) {
    return { configContent };
  }
  const target = defaultCompactionBuffer(smallest.window);
  const configured = routing.buffer;
  if (configured !== undefined && configured > 0 && configured < target && configured >= Math.min(target, OPENCODE_MINIMUM_COMPACTION_BUFFER)) {
    return {
      configContent,
      guard: { id: smallest.id, context: smallest.window, buffer: configured, managed: false }
    };
  }
  const config = parseConfigContent(configContent);
  const compaction = isRecord2(config.compaction) ? { ...config.compaction } : {};
  compaction.auto = true;
  compaction.buffer = target;
  config.compaction = compaction;
  return {
    configContent: JSON.stringify(config),
    guard: { id: smallest.id, context: smallest.window, buffer: target, managed: true }
  };
}
async function verifyEffectiveOpenCodeRouting(fetcher, baseUrl2, password, managedModels, providerId = OPENCODE_V2_MANAGED_PROVIDER_ID, validateConfig) {
  const configResponse = await fetchOpenCodeApi(fetcher, baseUrl2, "/api/config", password, {
    method: "GET"
  });
  if (!configResponse.ok)
    throw new Error("Could not verify OpenCode V2's effective local configuration.");
  const configEntries = await responseJson(configResponse);
  validateConfig?.(configEntries);
  const defaultAgentId = configuredDefaultAgent(configEntries);
  const compaction = effectiveCompactionSettings(configEntries);
  let agent;
  const agentTimeoutAt = Date.now() + 1e4;
  while (Date.now() < agentTimeoutAt) {
    const agentResponse = await fetchOpenCodeApi(fetcher, baseUrl2, "/api/agent", password, {
      method: "GET"
    });
    if (!agentResponse.ok)
      throw new Error("Could not verify OpenCode V2's selected agent.");
    const agentData = locationData(await responseJson(agentResponse));
    if (!Array.isArray(agentData)) {
      throw new Error("OpenCode V2 returned an unexpected agent inventory.");
    }
    const candidate = agentData.find((item) => isRecord2(item) && item.id === defaultAgentId);
    if (isRecord2(candidate) && Array.isArray(candidate.permissions)) {
      agent = candidate;
      break;
    }
    await new Promise((resolve3) => setTimeout(resolve3, 100));
  }
  if (!agent) {
    throw new Error("OpenCode V2's configured default agent is unavailable in this location.");
  }
  let agentModelId;
  if (agent.model !== undefined) {
    if (!isRecord2(agent.model) || typeof agent.model.providerID !== "string" || typeof agent.model.id !== "string") {
      throw new Error("OpenCode V2's default agent has an invalid model setting.");
    }
    if (agent.model.providerID !== providerId && agent.model.providerID !== OPENCODE_FREE_PROVIDER_ID) {
      throw new Error(`OpenCode V2 default agent "${defaultAgentId}" selects another provider. Set its model to this alias's Go model or a native free OpenCode model.`);
    }
    agentModelId = agent.model.providerID === OPENCODE_FREE_PROVIDER_ID ? `${OPENCODE_FREE_PROVIDER_ID}/${agent.model.id}` : agent.model.id;
    const managedModelIds = managedModels.map((model) => model.slice(model.indexOf("/") + 1));
    if (agent.model.providerID === providerId && !managedModelIds.includes(agentModelId)) {
      throw new Error(`OpenCode V2 default agent "${defaultAgentId}" selects a Go model not in this alias's private model history.`);
    }
  }
  const expected = new Set(managedModels.map((model) => model.slice(model.indexOf("/") + 1)));
  const timeoutAt = Date.now() + 1e4;
  let previousSignature = "";
  let stablePolls = 0;
  let lastUnexpectedProvider = false;
  while (Date.now() < timeoutAt) {
    let response;
    try {
      response = await fetchOpenCodeApi(fetcher, baseUrl2, "/api/model", password, {
        method: "GET"
      });
    } catch {
      await new Promise((resolve3) => setTimeout(resolve3, 100));
      continue;
    }
    if (!response.ok) {
      await new Promise((resolve3) => setTimeout(resolve3, 100));
      continue;
    }
    const modelData = locationData(await responseJson(response));
    if (!Array.isArray(modelData)) {
      throw new Error("OpenCode V2 returned an unexpected model inventory.");
    }
    const models2 = [];
    const windows = new Map;
    const freeModelIds = [];
    for (const item of modelData) {
      if (!isRecord2(item) || typeof item.providerID !== "string" || typeof item.id !== "string") {
        throw new Error("OpenCode V2 returned an unexpected model inventory.");
      }
      if (item.enabled === false)
        continue;
      const basis = isRecord2(item.limit) && typeof item.limit.input === "number" && item.limit.input > 0 ? item.limit.input : isRecord2(item.limit) && typeof item.limit.context === "number" && item.limit.context > 0 ? item.limit.context : undefined;
      if (item.providerID === OPENCODE_FREE_PROVIDER_ID) {
        if (!isOpenCodeFreeModel(item)) {
          throw new Error("OpenCode V2 exposes a paid or unpriced native OpenCode model; refusing this Go alias launch.");
        }
        const id = `${OPENCODE_FREE_PROVIDER_ID}/${item.id}`;
        freeModelIds.push(id);
        windows.set(id, basis ?? OPENCODE_COMPACTION_FALLBACK_WINDOW);
        continue;
      }
      models2.push({ providerID: item.providerID, id: item.id, context: basis });
      if (basis !== undefined)
        windows.set(item.id, basis);
    }
    const signature = JSON.stringify({
      go: models2.toSorted((left, right) => `${left.providerID}/${left.id}`.localeCompare(`${right.providerID}/${right.id}`)),
      free: freeModelIds.toSorted().map((id) => [id, windows.get(id)])
    });
    const onlyManaged = models2.every((model) => model.providerID === providerId);
    const actual = new Set(models2.map((model) => model.id));
    const sameInventory = onlyManaged && (!agentModelId?.startsWith(`${OPENCODE_FREE_PROVIDER_ID}/`) || freeModelIds.includes(agentModelId)) && actual.size === expected.size && [...expected].every((id) => actual.has(id));
    lastUnexpectedProvider = !onlyManaged;
    stablePolls = sameInventory && signature === previousSignature ? stablePolls + 1 : sameInventory ? 1 : 0;
    previousSignature = signature;
    if (stablePolls >= 3) {
      return {
        auto: compaction.auto,
        buffer: compaction.buffer,
        windows,
        agentModelId,
        freeModelIds
      };
    }
    await new Promise((resolve3) => setTimeout(resolve3, 150));
  }
  if (lastUnexpectedProvider) {
    throw new Error("OpenCode V2's effective provider inventory includes another provider; refusing this Go alias launch.");
  }
  throw new Error("OpenCode V2 did not load this alias's complete Go model inventory in the current location; refusing to launch.");
}
async function waitForManagedIntegrationKeyMethod(fetcher, baseUrl2, password) {
  const timeoutAt = Date.now() + 15000;
  const path = `/api/integration/${encodeURIComponent(OPENCODE_V2_MANAGED_PROVIDER_ID)}`;
  while (Date.now() < timeoutAt) {
    let response;
    try {
      response = await fetchOpenCodeApi(fetcher, baseUrl2, path, password, { method: "GET" });
    } catch {
      await new Promise((resolve3) => setTimeout(resolve3, 100));
      continue;
    }
    if (response.status === 404 || response.status === 503) {
      await new Promise((resolve3) => setTimeout(resolve3, 100));
      continue;
    }
    if (!response.ok) {
      throw new Error("Could not verify OpenCode V2's managed Go integration.");
    }
    const integration = locationData(await responseJson(response));
    if (!isRecord2(integration) || integration.id !== OPENCODE_V2_MANAGED_PROVIDER_ID || !Array.isArray(integration.methods) || !Array.isArray(integration.connections)) {
      throw new Error("OpenCode V2 returned an unexpected managed integration response.");
    }
    if (integration.methods.some((method) => isRecord2(method) && method.type === "key")) {
      return;
    }
    await new Promise((resolve3) => setTimeout(resolve3, 100));
  }
  throw new Error("OpenCode V2's managed Go key method did not become ready; refusing to launch.");
}
async function syncOpenCodeV2CredentialToPrivateDatabase(profileId, key, env3, spawnCommand = spawn4, fetcher = fetch) {
  const runtimeRoot = openCodeProfileV2RuntimeDir(profileId);
  await mkdir11(runtimeRoot, { recursive: true, mode: 448 });
  await chmod9(runtimeRoot, 448);
  const credentialStateFile = openCodeProfileV2CredentialStateFile(profileId);
  const release = await acquireProfileLock(`${credentialStateFile}.lock`, "credential sync");
  try {
    return await syncLocked();
  } finally {
    await release();
  }
  async function syncLocked() {
    const ownedIds = await readOwnedCredentialIds(credentialStateFile);
    const label = `claudex-switch-${profileId}-${randomUUID8()}`;
    return await withOpenCodePrivateServer(env3, async (baseUrl2, password) => {
      await waitForManagedIntegrationKeyMethod(fetcher, baseUrl2, password);
      const config = parseConfigContent(env3.OPENCODE_CONFIG_CONTENT);
      const model = config.model;
      if (typeof model !== "string" || !model.startsWith(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/`)) {
        throw new Error("OpenCode V2's managed Go model is not configured for this alias.");
      }
      const providers = isRecord2(config.providers) ? config.providers : {};
      const managedProvider = providers[OPENCODE_V2_MANAGED_PROVIDER_ID];
      const managedModelMap = isRecord2(managedProvider) ? managedProvider.models : undefined;
      const modelIds = isRecord2(managedModelMap) ? Object.keys(managedModelMap) : [];
      if (modelIds.length === 0) {
        throw new Error("OpenCode V2's managed Go model inventory is empty for this alias.");
      }
      const routing = await verifyEffectiveOpenCodeRouting(fetcher, baseUrl2, password, modelIds.map((id) => `${OPENCODE_GO_PROVIDER_ID}/${id}`));
      const encodedId = encodeURIComponent(OPENCODE_V2_MANAGED_PROVIDER_ID);
      const connected = await fetchOpenCodeApi(fetcher, baseUrl2, `/api/integration/${encodedId}/connect/key`, password, { method: "POST", body: JSON.stringify({ key, label }) });
      if (connected.status !== 204) {
        throw new Error("OpenCode V2 could not store the selected key in this alias's private database.");
      }
      const current2 = await fetchOpenCodeApi(fetcher, baseUrl2, `/api/integration/${encodedId}`, password, { method: "GET" });
      if (!current2.ok) {
        throw new Error("Could not verify the selected key in this alias's private database.");
      }
      const integration = locationData(await responseJson(current2));
      if (!isRecord2(integration) || integration.id !== OPENCODE_V2_MANAGED_PROVIDER_ID || !Array.isArray(integration.connections)) {
        throw new Error("OpenCode V2 returned an unexpected private credential response.");
      }
      const connections = integration.connections;
      const active = connections[0];
      if (!isRecord2(active) || active.type !== "credential" || active.label !== label || typeof active.id !== "string" || active.id.length === 0) {
        throw new Error("OpenCode V2 did not activate the selected key in this alias's private database.");
      }
      let tracked = [...new Set([...ownedIds, active.id])];
      await writeOwnedCredentialIds(credentialStateFile, tracked);
      const currentIds = new Set(connections.flatMap((connection) => isRecord2(connection) && connection.type === "credential" && typeof connection.id === "string" ? [connection.id] : []));
      for (const id of ownedIds) {
        if (id === active.id)
          continue;
        if (!currentIds.has(id)) {
          tracked = tracked.filter((credentialId) => credentialId !== id);
          await writeOwnedCredentialIds(credentialStateFile, tracked);
          continue;
        }
        try {
          const removed = await fetchOpenCodeApi(fetcher, baseUrl2, `/api/credential/${encodeURIComponent(id)}`, password, { method: "DELETE" });
          if (removed.ok || removed.status === 204 || removed.status === 404) {
            tracked = tracked.filter((credentialId) => credentialId !== id);
            await writeOwnedCredentialIds(credentialStateFile, tracked);
          }
        } catch {}
      }
      return routing;
    }, spawnCommand);
  }
}
async function prepareOpenCodeV2RunEnvironment(profileId, selectedModel, credentialSync = (id, key, env3) => syncOpenCodeV2CredentialToPrivateDatabase(id, key, env3)) {
  const key = await readOpenCodeGoApiKey(profileId);
  if (!key)
    throw new Error("OpenCode Go credential is missing from this profile.");
  const sourceConfig = process.env.OPENCODE_CONFIG_CONTENT;
  const history = await rememberOpenCodeV2Model(profileId, sourceConfig, selectedModel);
  const catalog2 = await fetchOpenCodeGoCatalogIds();
  const managedModels = [...new Set([
    ...history,
    ...[...catalog2 ?? []].map((id) => `${OPENCODE_GO_PROVIDER_ID}/${id}`)
  ])];
  const managedConfig = buildOpenCodeV2Config(sourceConfig, selectedModel, managedModels);
  const serializedConfig = JSON.stringify(managedConfig);
  const selectedManagedModelId = typeof managedConfig.model === "string" && managedConfig.model.startsWith(`${OPENCODE_V2_MANAGED_PROVIDER_ID}/`) ? managedConfig.model.slice(OPENCODE_V2_MANAGED_PROVIDER_ID.length + 1) : undefined;
  const privateRoot = openCodeProfileV2RuntimeDir(profileId);
  const dataHome = openCodeProfileV2DataHome(profileId);
  const stateHome = join12(privateRoot, "state");
  const cacheHome = join12(privateRoot, "cache");
  const legacyAuthFile = join12(dataHome, "opencode", "auth.json");
  if (await fileExists(legacyAuthFile)) {
    throw new Error("OpenCode V2 found a legacy auth.json in this alias's private runtime data. It will not import that file into this alias's SQLite database; preserve or remove it before retrying.");
  }
  await mkdir11(privateRoot, { recursive: true, mode: 448 });
  await chmod9(privateRoot, 448);
  await Promise.all([dataHome, join12(dataHome, "opencode"), stateHome, cacheHome].map((path) => mkdir11(path, { recursive: true, mode: 448 })));
  const env3 = { ...process.env };
  delete env3.OPENCODE_AUTH_CONTENT;
  delete env3[OPENCODE_NATIVE_GO_KEY_ENV];
  delete env3.OPENCODE_PASSWORD;
  env3.OPENCODE_DB = openCodeProfileV2DatabaseFile(profileId);
  env3.XDG_DATA_HOME = dataHome;
  env3.XDG_STATE_HOME = stateHome;
  env3.XDG_CACHE_HOME = cacheHome;
  env3.OPENCODE_CONFIG_CONTENT = serializedConfig;
  await prepareOpenCodeModelCatalog(env3);
  const routing = await credentialSync(profileId, key, env3);
  if (!routing)
    return { env: env3 };
  const applied = applyManagedCompactionPolicy(serializedConfig, routing, selectedManagedModelId);
  env3.OPENCODE_CONFIG_CONTENT = applied.configContent;
  return { env: env3, compactionGuard: applied.guard };
}

// src/providers/opencode/console.ts
class ConsoleReconnectError extends Error {
}
function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
async function openCodeConsoleEnvironment(profileId) {
  const root = openCodeProfileV2RuntimeDir(profileId);
  const data = openCodeProfileV2DataHome(profileId);
  for (const path of [root, data, join13(data, "opencode"), join13(root, "state"), join13(root, "cache"), OPENCODE_LOCKS_DIR]) {
    await mkdir12(path, { recursive: true, mode: 448 });
    await chmod10(path, 448);
  }
  const env3 = { ...process.env };
  delete env3.OPENCODE_AUTH_CONTENT;
  delete env3.OPENCODE_API_KEY;
  delete env3.OPENCODE_PASSWORD;
  env3.OPENCODE_DB = openCodeProfileV2DatabaseFile(profileId);
  env3.XDG_DATA_HOME = data;
  env3.XDG_STATE_HOME = join13(root, "state");
  env3.XDG_CACHE_HOME = join13(root, "cache");
  env3.OPENCODE_DISABLE_AUTOUPDATE = "1";
  await prepareOpenCodeModelCatalog(env3);
  return env3;
}
function consoleUrl(credential, path) {
  const url = new URL(`${credential.value.metadata.server.replace(/\/$/, "")}${path}`);
  if (url.username || url.password || url.search || url.hash || url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))) {
    throw new Error("Invalid OpenCode Console server address.");
  }
  return url;
}
async function consoleGet(credential, path) {
  return fetch(consoleUrl(credential, path), {
    headers: { Authorization: `Bearer ${credential.value.access}`, "x-org-id": credential.value.metadata.orgID },
    signal: AbortSignal.timeout(5000),
    redirect: "error"
  });
}
function parseOpenCodeConsoleStatus(data, now = Date.now()) {
  if (!record(data) || !record(data.access))
    return { active: false, usage: null };
  const access2 = data.access;
  const endsAt = typeof access2.endsAt === "string" ? Date.parse(access2.endsAt) : NaN;
  const startsAt = typeof access2.startsAt === "string" ? Date.parse(access2.startsAt) : null;
  if (!Number.isFinite(endsAt) || endsAt <= now || startsAt !== null && (!Number.isFinite(startsAt) || startsAt > now)) {
    return { active: false, usage: null };
  }
  const meters = record(access2.meters) ? access2.meters : {};
  const meter2 = (value) => {
    if (!record(value) || typeof value.limitMicroCents !== "string" || typeof value.usedMicroCents !== "string" || !/^\d+$/.test(value.limitMicroCents) || !/^\d+$/.test(value.usedMicroCents))
      return null;
    const limit = Number(value.limitMicroCents), used = Number(value.usedMicroCents);
    if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(used))
      return null;
    const resetsAt = typeof value.resetsAt === "string" ? Date.parse(value.resetsAt) : NaN;
    return { used: Math.min(100, used / limit * 100), resetsAt: Number.isFinite(resetsAt) ? resetsAt : null };
  };
  const fiveHour = meter2(meters.fiveHour), week = meter2(meters.week), month = meter2(meters.month);
  return { active: true, usage: !fiveHour && !week && !month ? null : {
    fiveHourUsedPercent: fiveHour?.used ?? null,
    fiveHourResetsAt: fiveHour?.resetsAt ?? null,
    weeklyUsedPercent: week?.used ?? null,
    weeklyResetsAt: week?.resetsAt ?? null,
    monthlyUsedPercent: month?.used ?? null,
    monthlyResetsAt: month ? month.resetsAt ?? endsAt : null
  } };
}
async function requireSubscription(credential) {
  const response = await consoleGet(credential, "/api/go/status");
  if (response.status === 401 || response.status === 403)
    throw new ConsoleReconnectError("OpenCode Console authorization expired; reconnect this account.");
  if (!response.ok)
    throw new Error("Could not verify the Go subscription; retry when OpenCode Console is reachable.");
  const status = parseOpenCodeConsoleStatus(await response.json());
  if (!status.active)
    throw new Error("The selected workspace has no active Go subscription. Sign in again and authorize the workspace that owns Go.");
  return status.usage;
}
async function readPinnedConsoleCredential(profileId, profile) {
  const identity2 = (profile ?? await getOpenCodeProfileData(profileId)).console;
  if (!identity2)
    throw new Error("This profile has no OpenCode subscription login.");
  const credential = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(profileId))).find((item) => item.id === identity2.credentialId);
  if (!credential || credential.value.metadata.accountID !== identity2.accountId || credential.value.metadata.orgID !== identity2.orgId) {
    throw new Error("OpenCode subscription identity is missing or changed; reconnect this alias.");
  }
  return credential;
}
async function nativeModels(env3, credentialId) {
  return withOpenCodePrivateServer(env3, async (baseUrl2, password) => {
    const activated = await fetchOpenCodeApi(fetch, baseUrl2, `/api/credential/${encodeURIComponent(credentialId)}/activate`, password, { method: "POST" });
    if (activated.status !== 204)
      throw new Error("Could not select this alias's OpenCode subscription.");
    const deadline = Date.now() + 1e4;
    let signature = "";
    let stable = 0;
    while (Date.now() < deadline) {
      const response = await fetchOpenCodeApi(fetch, baseUrl2, "/api/model", password);
      if (response.ok) {
        const models2 = locationData(await response.json());
        if (Array.isArray(models2) && models2.some((item) => record(item) && item.providerID === OPENCODE_GO_PROVIDER_ID && item.enabled !== false)) {
          const integrationResponse = await fetchOpenCodeApi(fetch, baseUrl2, "/api/integration/opencode", password);
          const integration = integrationResponse.ok ? locationData(await integrationResponse.json()) : null;
          if (record(integration) && Array.isArray(integration.connections) && record(integration.connections[0]) && integration.connections[0].id === credentialId && record(integration.connections[0].status) && integration.connections[0].status.status === "needs_auth") {
            throw new ConsoleReconnectError("OpenCode subscription authorization needs reconnecting.");
          }
          const stored = (await readOpenCodeConsoleCredentials(env3.OPENCODE_DB)).find((item) => item.id === credentialId);
          if (stored && stored.value.expires > Date.now() + 5 * 60000 && record(integration) && Array.isArray(integration.connections) && record(integration.connections[0]) && integration.connections[0].id === credentialId && !integration.connections[0].status) {
            const nextSignature = JSON.stringify(models2);
            stable = nextSignature === signature ? stable + 1 : 0;
            signature = nextSignature;
            if (stable >= 2)
              return models2.filter(record);
          }
        }
      }
      await new Promise((resolve3) => setTimeout(resolve3, 100));
    }
    throw new Error("OpenCode could not load this workspace's subscription models; reconnect or retry.");
  });
}
async function fetchOpenCodeConsoleGoModels(models2, credential) {
  const configResponse = await consoleGet(credential, "/api/v2/config");
  if (!configResponse.ok)
    throw new Error("Could not verify the workspace's Console model configuration.");
  const config = await configResponse.json();
  const provider = record(config) && record(config.providers) ? config.providers[OPENCODE_GO_PROVIDER_ID] : null;
  const declaredModels = record(provider) && record(provider.models) ? new Set(Object.entries(provider.models).filter(([, model]) => record(model) && model.disabled !== true).map(([id]) => id)) : new Set;
  const ids = await fetchOpenCodeGoCatalogIds();
  if (!ids)
    throw new Error("Could not load OpenCode's Go model catalog.");
  const available = models2.filter((item) => item.providerID === OPENCODE_GO_PROVIDER_ID && declaredModels.has(String(item.id)) && item.enabled !== false && typeof item.id === "string" && ids.has(item.id));
  if (available.length === 0)
    throw new Error("This Console workspace has no available Go models; check its subscription and retry.");
  return available;
}
function normalizeOpenCodeConsoleModel(model) {
  const trimmed = model.trim();
  const normalized = trimmed.replace(/^opencode\//, `${OPENCODE_GO_PROVIDER_ID}/`);
  if (!/^opencode-go\/[^/\s]+$/.test(normalized))
    throw new Error("Subscription models must use opencode-go/<model>.");
  return normalized;
}
function validateConsoleProvider(provider) {
  if (provider.settings || provider.headers || provider.body || provider.canonical || provider.package || provider.env) {
    throw new Error("Remove custom OpenCode provider routing before using a subscription alias.");
  }
  const overrides = provider.models ?? {};
  if (!record(overrides))
    throw new Error("Invalid OpenCode model configuration.");
  for (const previous of Object.values(overrides)) {
    if (!record(previous))
      throw new Error("Invalid OpenCode model override.");
    if (previous.settings || previous.headers || previous.body || previous.package || previous.modelID) {
      throw new Error("Remove custom OpenCode model routing before using a subscription alias.");
    }
    if (previous.variants !== undefined && (!Array.isArray(previous.variants) || previous.variants.some((variant) => !record(variant) || variant.settings || variant.headers || variant.body))) {
      throw new Error("Remove custom OpenCode model variant routing before using a subscription alias.");
    }
  }
}
function buildOpenCodeConsoleConfig(source, model, models2, go) {
  const config = source?.trim() ? JSON.parse(source) : {};
  if (!record(config))
    throw new Error("Invalid OpenCode configuration.");
  const selected = normalizeOpenCodeConsoleModel(model);
  if (!go.some((item) => item.providerID === OPENCODE_GO_PROVIDER_ID && `${OPENCODE_GO_PROVIDER_ID}/${item.id}` === selected))
    throw new Error("The selected model is unavailable through this workspace's Go subscription.");
  const providers = config.providers ?? {};
  if (!record(providers))
    throw new Error("Invalid OpenCode provider configuration.");
  const provider = providers[OPENCODE_GO_PROVIDER_ID] ?? {};
  if (!record(provider))
    throw new Error("Invalid OpenCode Console provider configuration.");
  validateConsoleProvider(provider);
  const overrides = provider.models ?? {};
  if (!record(overrides))
    throw new Error("Invalid OpenCode model configuration.");
  const allowed = new Set(go.map((item) => item.id));
  const selectedOverrides = { ...overrides };
  const allIds = new Set([...Object.keys(overrides), ...models2.filter((item) => item.providerID === OPENCODE_GO_PROVIDER_ID).map((item) => String(item.id))]);
  for (const id of allIds) {
    const previous = selectedOverrides[id] ?? {};
    if (!record(previous))
      throw new Error("Invalid OpenCode model override.");
    selectedOverrides[id] = allowed.has(id) ? previous : { ...previous, disabled: true };
  }
  config.providers = { ...providers, [OPENCODE_GO_PROVIDER_ID]: { ...provider, models: selectedOverrides } };
  const native = providers[OPENCODE_FREE_PROVIDER_ID] ?? {};
  if (!record(native))
    throw new Error("Invalid native OpenCode provider configuration.");
  validateConsoleProvider(native);
  const nativeOverrides = native.models ?? {};
  if (!record(nativeOverrides))
    throw new Error("Invalid native OpenCode model configuration.");
  const free = new Set(models2.filter(isOpenCodeFreeModel).map((item) => String(item.id)));
  const nativeIds = new Set([...Object.keys(nativeOverrides), ...models2.filter((item) => item.providerID === OPENCODE_FREE_PROVIDER_ID).map((item) => String(item.id))]);
  const nativeModels2 = {};
  for (const id of nativeIds) {
    const previous = nativeOverrides[id] ?? {};
    if (!record(previous))
      throw new Error("Invalid native OpenCode model override.");
    nativeModels2[id] = free.has(id) ? previous : { ...previous, disabled: true };
  }
  config.providers[OPENCODE_FREE_PROVIDER_ID] = { ...native, models: nativeModels2 };
  config.model = selected;
  return restrictOpenCodeProviders(config, OPENCODE_GO_PROVIDER_ID);
}
async function loginOpenCodeConsole(profileId, previous) {
  const stagedId = createOpenCodeProfileId();
  const stagedEnv = await openCodeConsoleEnvironment(stagedId);
  stagedEnv.OPENCODE_CONFIG_CONTENT = "{}";
  stagedEnv.XDG_CONFIG_HOME = join13(openCodeProfileV2RuntimeDir(stagedId), "config");
  stagedEnv.OPENCODE_CONFIG_PROJECT_DISABLE = "1";
  delete stagedEnv.OPENCODE_CONFIG;
  delete stagedEnv.OPENCODE_CONFIG_DIR;
  const shimDir = createOpenShimDir();
  if (shimDir)
    stagedEnv.PATH = `${shimDir}:${stagedEnv.PATH}`;
  try {
    const child = spawn5("opencode", ["auth", "login", "opencode", "--method", "device", "--standalone"], { stdio: "inherit", env: stagedEnv });
    const code = await new Promise((resolve3, reject) => {
      child.once("close", resolve3);
      child.once("error", () => reject(new Error("Could not start OpenCode subscription login.")));
    });
    if (code !== 0)
      throw new Error("OpenCode subscription login was cancelled or failed; the saved account was not replaced.");
    const credential = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(stagedId))).find((item) => item.active);
    if (!credential)
      throw new Error("OpenCode did not save a Console subscription credential.");
    const metadata = credential.value.metadata;
    if (previous?.console && (metadata.accountID !== previous.console.accountId || metadata.orgID !== previous.console.orgId)) {
      throw new Error("Login selected a different account or workspace; the saved account was not replaced.");
    }
    await requireSubscription(credential);
    const models2 = await nativeModels(stagedEnv, credential.id);
    const latest = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(stagedId))).find((item) => item.id === credential.id);
    if (!latest)
      throw new Error("The verified OpenCode credential disappeared.");
    if (latest.value.metadata.accountID !== metadata.accountID || latest.value.metadata.orgID !== metadata.orgID) {
      throw new Error("OpenCode changed the account or workspace during verification; nothing was replaced.");
    }
    const available = await fetchOpenCodeConsoleGoModels(models2, latest);
    const preferred = previous?.defaultModel ? normalizeOpenCodeConsoleModel(previous.defaultModel) : null;
    const defaultModel = available.some((item) => `${OPENCODE_GO_PROVIDER_ID}/${item.id}` === preferred) ? preferred : `${OPENCODE_GO_PROVIDER_ID}/${available[0].id}`;
    const profile = { type: "go", defaultModel, console: {
      credentialId: latest.id,
      accountId: metadata.accountID,
      email: metadata.email,
      orgId: metadata.orgID,
      orgName: metadata.orgName ?? metadata.orgID
    } };
    const env3 = await openCodeConsoleEnvironment(profileId);
    env3.OPENCODE_CONFIG_CONTENT = "{}";
    env3.XDG_CONFIG_HOME = stagedEnv.XDG_CONFIG_HOME;
    env3.OPENCODE_CONFIG_PROJECT_DISABLE = "1";
    delete env3.OPENCODE_CONFIG;
    delete env3.OPENCODE_CONFIG_DIR;
    const release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account");
    try {
      if (previous?.console) {
        const current2 = await getOpenCodeProfileData(profileId);
        if (current2.console?.credentialId !== previous.console.credentialId) {
          throw new Error("This account changed while browser login was open; retry refresh.");
        }
        if (current2.defaultModel && available.some((item) => `${OPENCODE_GO_PROVIDER_ID}/${item.id}` === normalizeOpenCodeConsoleModel(current2.defaultModel))) {
          profile.defaultModel = normalizeOpenCodeConsoleModel(current2.defaultModel);
        }
      }
      await withOpenCodePrivateServer(env3, async (baseUrl2, password) => {
        const request2 = (path, init) => fetchOpenCodeApi(fetch, baseUrl2, path, password, init);
        const response = await request2("/api/credential", { method: "POST", body: JSON.stringify({ id: latest.id, integrationID: "opencode", label: latest.label, value: latest.value, activate: false }) });
        if (!response.ok)
          throw new Error("Could not save the verified OpenCode subscription credential.");
        try {
          const activated = await request2(`/api/credential/${encodeURIComponent(latest.id)}/activate`, { method: "POST" });
          if (activated.status !== 204)
            throw new Error("Could not activate the verified OpenCode subscription.");
          const stored = (await readOpenCodeConsoleCredentials(openCodeProfileV2DatabaseFile(profileId))).find((item) => item.id === latest.id && item.active);
          if (!stored || stored.value.metadata.accountID !== metadata.accountID || stored.value.metadata.orgID !== metadata.orgID)
            throw new Error("OpenCode stored an unexpected subscription identity.");
          await saveOpenCodeConsoleProfile(profileId, profile);
        } catch (error2) {
          if (previous?.console)
            await request2(`/api/credential/${encodeURIComponent(previous.console.credentialId)}/activate`, { method: "POST" }).catch(() => {});
          throw error2;
        }
      });
    } finally {
      await release();
    }
    return profile;
  } finally {
    cleanupOpenShimDir(shimDir);
    await removeOpenCodeProfile(stagedId);
  }
}
async function prepareOpenCodeConsoleRun(profileId, selectedModel) {
  const env3 = await openCodeConsoleEnvironment(profileId);
  const release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account");
  try {
    const profile = await getOpenCodeProfileData(profileId);
    const credential = await readPinnedConsoleCredential(profileId, profile);
    const source = env3.OPENCODE_CONFIG_CONTENT;
    env3.OPENCODE_CONFIG_CONTENT = "{}";
    const models2 = await nativeModels(env3, credential.id);
    const latest = await readPinnedConsoleCredential(profileId, profile);
    await requireSubscription(latest);
    const available = await fetchOpenCodeConsoleGoModels(models2, latest);
    const resolvedModel = normalizeOpenCodeConsoleModel(selectedModel ?? profile.defaultModel ?? `${OPENCODE_GO_PROVIDER_ID}/${available[0].id}`);
    const serializedConfig = JSON.stringify(buildOpenCodeConsoleConfig(source, resolvedModel, models2, available));
    env3.OPENCODE_CONFIG_CONTENT = serializedConfig;
    let compactionGuard;
    await withOpenCodePrivateServer(env3, async (baseUrl2, password) => {
      const routing = await verifyEffectiveOpenCodeRouting(fetch, baseUrl2, password, available.map((item) => `${OPENCODE_GO_PROVIDER_ID}/${item.id}`), OPENCODE_GO_PROVIDER_ID, (entries) => {
        if (!Array.isArray(entries))
          throw new Error("Invalid OpenCode effective configuration.");
        for (const entry of entries) {
          if (record(entry) && record(entry.info) && record(entry.info.providers) && record(entry.info.providers[OPENCODE_GO_PROVIDER_ID])) {
            validateConsoleProvider(entry.info.providers[OPENCODE_GO_PROVIDER_ID]);
          }
        }
      });
      const applied = applyManagedCompactionPolicy(serializedConfig, routing, resolvedModel.slice(OPENCODE_GO_PROVIDER_ID.length + 1));
      env3.OPENCODE_CONFIG_CONTENT = applied.configContent;
      compactionGuard = applied.guard;
      const response = await fetchOpenCodeApi(fetch, baseUrl2, `/api/provider/${OPENCODE_GO_PROVIDER_ID}`, password);
      const provider = response.ok ? locationData(await response.json()) : null;
      if (!record(provider) || provider.integrationID !== "opencode")
        throw new Error("OpenCode Console is not using this alias's subscription integration.");
    });
    return { env: env3, release, compactionGuard };
  } catch (error2) {
    await release();
    throw error2;
  }
}
async function fetchOpenCodeConsoleUsage(profileId) {
  try {
    let credential = await readPinnedConsoleCredential(profileId);
    if (credential.value.expires <= Date.now() + 5 * 60000) {
      const env3 = await openCodeConsoleEnvironment(profileId);
      env3.OPENCODE_CONFIG_CONTENT = "{}";
      const release = await acquireProfileLock(openCodeProfileConsoleLock(profileId), "subscription account");
      try {
        await nativeModels(env3, credential.id);
        credential = await readPinnedConsoleCredential(profileId);
      } finally {
        await release();
      }
    }
    const response = await consoleGet(credential, "/api/go/status");
    if (response.status === 401 || response.status === 403)
      return { usage: null, note: "reconnect required" };
    if (!response.ok)
      return { usage: null, note: "quota unavailable" };
    const status = parseOpenCodeConsoleStatus(await response.json());
    return { usage: status.usage, note: !status.active ? "Go subscription required" : status.usage ? null : "quota unavailable" };
  } catch (error2) {
    return { usage: null, note: error2 instanceof ConsoleReconnectError ? "reconnect required" : "quota unavailable" };
  }
}

// src/providers/opencode/usage.ts
var OPENCODE_GO_USAGE_URL = "https://opencode.ai/zen/go/v1/usage";
var FETCH_TIMEOUT_MS2 = 5000;
async function probeOpenCodeGoKey(apiKey) {
  const key = apiKey.trim();
  if (!key)
    return { status: "invalid" };
  try {
    const response = await fetch(OPENCODE_GO_USAGE_URL, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS2)
    });
    if (response.status === 401)
      return { status: "invalid" };
    if (response.status === 403)
      return { status: "no-subscription" };
    if (!response.ok)
      return { status: "unreachable" };
    let data = null;
    try {
      data = await response.json();
    } catch {}
    return { status: "valid", usage: parseOpenCodeUsageResponse(data) };
  } catch {
    return { status: "unreachable" };
  }
}
async function fetchOpenCodeUsage(profileId) {
  const profile = await getOpenCodeProfileData(profileId).catch(() => null);
  if (profile?.console)
    return fetchOpenCodeConsoleUsage(profileId);
  const apiKey = await readOpenCodeGoApiKey(profileId);
  if (!apiKey)
    return { usage: null, note: "reconnect required" };
  const probe = await probeOpenCodeGoKey(apiKey);
  switch (probe.status) {
    case "invalid":
      return { usage: null, note: "reconnect required" };
    case "no-subscription":
      return { usage: null, note: "Go subscription required" };
    case "unreachable":
      return { usage: null, note: "quota unavailable" };
    case "valid":
      return probe.usage ? { usage: probe.usage, note: null } : { usage: null, note: "quota unavailable" };
  }
}
function parseOpenCodeUsageResponse(data) {
  if (!data || typeof data !== "object")
    return null;
  const usage2 = data.usage;
  if (!usage2 || typeof usage2 !== "object")
    return null;
  const windows = usage2;
  const rolling = parseWindow(windows.rolling);
  const weekly = parseWindow(windows.weekly);
  const monthly = parseWindow(windows.monthly);
  if (!rolling && !weekly && !monthly)
    return null;
  return {
    fiveHourUsedPercent: rolling?.usedPercent ?? null,
    fiveHourResetsAt: rolling?.resetsAt ?? null,
    weeklyUsedPercent: weekly?.usedPercent ?? null,
    weeklyResetsAt: weekly?.resetsAt ?? null,
    monthlyUsedPercent: monthly?.usedPercent ?? null,
    monthlyResetsAt: monthly?.resetsAt ?? null
  };
}
function parseWindow(value) {
  if (!value || typeof value !== "object")
    return null;
  const window = value;
  const rateLimited = window.status === "rate-limited";
  if (!rateLimited && (typeof window.percent !== "number" || !Number.isFinite(window.percent))) {
    return null;
  }
  const usedPercent = rateLimited ? 100 : Math.min(100, Math.max(0, window.percent));
  const parsedReset = typeof window.resetsAt === "string" ? Date.parse(window.resetsAt) : NaN;
  return {
    usedPercent,
    resetsAt: Number.isFinite(parsedReset) ? parsedReset : null
  };
}

// src/commands/opencode-key.ts
var MAX_VALIDATION_ROUNDS = 3;
async function resolveOpenCodeV2Key(options) {
  const native = await readNativeOpenCodeGoCredentials().catch(() => null);
  const importable = native?.status === "ok" ? native.credentials : [];
  if (importable.length > 0) {
    info("Found an OpenCode Go login in this machine's OpenCode database.");
    hint("Importing reads that credential from OpenCode's local database and saves it in this alias's private claudex-switch profile.");
    blank();
  }
  for (let round = 0;round < MAX_VALIDATION_ROUNDS; round += 1) {
    let key;
    let sourceLabel;
    if (importable.length > 0) {
      const choice = await esm_default5({
        message: "OpenCode Go credential source",
        choices: [
          ...importable.map((credential) => ({
            name: `Import local OpenCode login${credential.active ? " (current)" : ""}  ${source_default.dim(`${credential.label} · ${maskKey(credential.key)}`)}`,
            value: credential.id
          })),
          { name: "Paste an API key manually", value: null }
        ]
      });
      const imported = choice ? importable.find((credential) => credential.id === choice) : undefined;
      if (imported) {
        key = imported.key;
        sourceLabel = "imported from the local OpenCode database";
      } else {
        key = await promptForKey(options.message);
        sourceLabel = "entered manually";
      }
    } else {
      key = await promptForKey(options.message);
      sourceLabel = "entered manually";
    }
    if (options.previousKey && key === options.previousKey) {
      error("The entered OpenCode Go API key is unchanged; the profile was not refreshed.");
      blank();
      process.exit(1);
      return key;
    }
    const probe = await probeOpenCodeGoKey(key);
    if (probe.status === "valid") {
      const usage2 = formatUsage(probe.usage, null);
      success2(`OpenCode Go key verified (${sourceLabel})${usage2 ? `  ${usage2}` : ""}`);
      return key;
    }
    if (probe.status === "unreachable") {
      hint("Could not reach OpenCode Go to verify this key right now; it will be saved and checked on first use.");
      return key;
    }
    if (probe.status === "invalid") {
      error("OpenCode Go rejected this API key (invalid API key).");
    } else {
      error("This key is valid but has no OpenCode Go subscription.");
    }
    if (importable.length > 0) {
      hint("Pick another source, paste the account's current API key, or press Ctrl-C to cancel.");
    } else {
      hint("Check the key on opencode.ai and try again, or press Ctrl-C to cancel.");
    }
    blank();
  }
  error("Too many invalid OpenCode Go API keys; nothing was saved.");
  blank();
  process.exit(1);
  return "";
}
async function promptForKey(message) {
  const key = await esm_default4({
    message,
    validate: (value) => value.trim().length > 0 || "Enter a non-empty OpenCode Go API key."
  });
  return key.trim();
}

// src/commands/add.ts
function readClaudeAuthStatus() {
  const result2 = spawnSync7("claude", ["auth", "status"], {
    encoding: "utf-8"
  });
  if (result2.status !== 0)
    return null;
  try {
    return JSON.parse(result2.stdout);
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
  const accountType = await esm_default5({
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
        name: "Claude Code · ChatGPT（本机 CLIProxyAPI）",
        value: "claude-local-cliproxyapi"
      },
      {
        name: "Codex ChatGPT — ChatGPT login (Plus, Pro, Team, etc.)",
        value: "codex-chatgpt"
      },
      {
        name: "Codex API Key — OpenAI API key",
        value: "codex-apikey"
      },
      {
        name: "OpenCode Subscription — browser login (Go / Go Plus)",
        value: "opencode-subscription"
      },
      {
        name: "OpenCode Go API Key — paste or import a Go key",
        value: "opencode-go"
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
    case "claude-local-cliproxyapi":
      await addLocalCLIProxyAPI(alias);
      break;
    case "codex-chatgpt":
      await addCodexChatGPT(alias);
      break;
    case "codex-apikey":
      await addCodexApiKey(alias);
      break;
    case "opencode-go":
      await addOpenCodeGo(alias);
      break;
    case "opencode-subscription":
      await addOpenCodeSubscription(alias);
      break;
  }
}
async function addOpenCodeSubscription(alias) {
  const version = detectOpenCodeVersion();
  if (version?.major !== 2) {
    error("Browser subscription login requires OpenCode 2.x. Upgrade OpenCode or choose the Go API Key entry.");
    process.exit(1);
    return;
  }
  const profileId = createOpenCodeProfileId();
  try {
    info("Opening OpenCode subscription login in your browser...");
    hint("Sign in to the account to add, select the workspace that owns Go, and authorize. No API key is needed.");
    const profile = await loginOpenCodeConsole(profileId);
    await addAlias(alias, { provider: "opencode", profileId });
    await setActiveOpenCodeProfile(profileId);
    success2(`${source_default.bold(alias)} created  ${profile.console.email} · ${profile.console.orgName}  Go subscription verified`);
    hint(`Run ${source_default.cyan(`claudex-switch ${alias} -run`)} to use this subscription (${profile.defaultModel}).`);
    blank();
  } catch (err) {
    await removeOpenCodeProfile(profileId);
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
}
async function addOpenCodeGo(alias) {
  const openCodeVersion = detectOpenCodeVersion();
  if (!openCodeVersion) {
    error("Could not detect a supported OpenCode version on PATH.");
    hint("Install OpenCode 1.x or 2.x, then rerun this command.");
    blank();
    process.exit(1);
    return;
  }
  if (!isSupportedOpenCodeVersion(openCodeVersion)) {
    error(`OpenCode ${openCodeVersion.raw} is not supported by this version of claudex-switch.`);
    hint("Supported OpenCode major versions are 1.x and 2.x.");
    blank();
    process.exit(1);
    return;
  }
  const profileId = createOpenCodeProfileId();
  let profileCreated = false;
  try {
    if (openCodeVersion.major === 2) {
      info("OpenCode V2 uses a private key prompt instead of the TUI connect flow.");
      hint("OpenCode terminal tools may inherit process environment variables; use this account only in trusted workspaces.");
      blank();
      const trimmedKey = await resolveOpenCodeV2Key({
        message: "OpenCode Go API key"
      });
      await createOpenCodeGoProfile(profileId, { type: "api", key: trimmedKey });
      profileCreated = true;
    } else {
      const currentCredential = await readGlobalOpenCodeGoCredential();
      if (currentCredential) {
        info("Found an existing OpenCode Go credential.");
        const importCurrent = await esm_default2({
          message: "Save a private copy as the new account?",
          default: true
        });
        if (importCurrent) {
          await createOpenCodeGoProfile(profileId, currentCredential);
          profileCreated = true;
        }
      }
      if (!profileCreated) {
        await createOpenCodeGoProfile(profileId);
        profileCreated = true;
        info("Opening OpenCode TUI for this private account...");
        hint("Run /connect, choose OpenCode Go, add its API key, then exit the TUI.");
        blank();
        const exitCode = await runOpenCodeTui(profileId);
        if (exitCode !== 0 || !await hasOpenCodeGoCredential(profileId)) {
          throw new Error("OpenCode Go setup was cancelled or no Go credential was saved.");
        }
      }
    }
    await addAlias(alias, { provider: "opencode", profileId });
    await setActiveOpenCodeProfile(profileId);
    blank();
    success2(`${source_default.bold(alias)} created  ${source_default.dim("OpenCode Go subscription")}`);
    const historyHint = openCodeVersion.major === 2 ? "OpenCode V2 keeps /resume history private to this alias." : "OpenCode V1 Go aliases share /resume history.";
    hint(`Run ${source_default.cyan(`claudex-switch ${alias} -run`)} to start OpenCode's TUI with this account. ${historyHint}`);
    if (openCodeVersion.major === 2) {
      hint(`First run needs a Go model: ${source_default.cyan(`claudex-switch ${alias} -run --model opencode-go/<model>`)}; it is saved as this alias's default.`);
    }
    blank();
  } catch (err) {
    if (profileCreated) {
      try {
        await removeOpenCodeProfile(profileId);
      } catch {}
    }
    blank();
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
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
      const defaultModel2 = await promptClaudeDefaultModel();
      await addOAuthProfile(alias, CREDENTIALS_FILE, { defaultModel: defaultModel2 });
      await addAlias(alias, { provider: "claude", profileName: alias });
      blank();
      success2(`${source_default.bold(alias)} created from current Claude session`);
      blank();
      return;
    }
    if (authStatus?.loggedIn) {
      info("Logging out current Claude session...");
      blank();
      const logout = spawnSync7("claude", ["auth", "logout"], {
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
  const env3 = browserScript ? { ...process.env, BROWSER: browserScript } : undefined;
  const proc = spawn6("claude", ["auth", "login"], { stdio: "inherit", env: env3 });
  const exitCode = await new Promise((resolve3) => proc.on("close", resolve3));
  cleanupBrowserScript(browserScript);
  const newCreds = await readCredentials(CREDENTIALS_FILE);
  if (exitCode !== 0 || !newCreds) {
    blank();
    error("Login failed or was cancelled.");
    blank();
    process.exit(1);
  }
  const defaultModel = await promptClaudeDefaultModel();
  await addOAuthProfile(alias, CREDENTIALS_FILE, { defaultModel });
  await addAlias(alias, { provider: "claude", profileName: alias });
  blank();
  success2(`${source_default.bold(alias)} created`);
  blank();
}
async function addClaudeApiKey(alias) {
  const config = await promptClaudeApiConfig();
  await createClaudeApiKeyAccount({ alias, ...config });
  blank();
  success2(`${source_default.bold(alias)} created  ${source_default.dim(maskKey(config.apiKey))}`);
  await maybeSetupRelayBalance(config.baseUrl);
  blank();
}
async function addLocalCLIProxyAPI(alias) {
  const binaryPath = await resolveCLIProxyAPIBinaryForAdd();
  if (!binaryPath) {
    blank();
    error("CLIProxyAPI was not installed or no valid executable was selected.");
    hint("Install it with Homebrew on macOS, or rerun add and provide an existing cli-proxy-api path.");
    blank();
    process.exit(1);
  }
  const profileId = createManagedCLIProxyAPIProfileId();
  const profileName = `cliproxy-${profileId}`;
  const profile = {
    type: "local-cliproxyapi",
    profileId,
    binaryPath,
    defaultModel: CLI_PROXY_API_DEFAULTS.fableModel
  };
  let profileWritten = false;
  try {
    await initializeManagedCLIProxyAPI(profileId);
    info("Opening CLIProxyAPI's own ChatGPT login in your browser...");
    blank();
    const login = await runManagedCLIProxyAPILogin({
      profileId,
      binaryPath
    });
    if (!login.success || !login.identity) {
      throw new Error("Login failed, was cancelled, or did not produce one valid Codex OAuth credential.");
    }
    profile.authIdentity = login.identity;
    await addLocalCLIProxyAPIProfile(profileName, profile);
    profileWritten = true;
    await addAlias(alias, { provider: "claude", profileName });
    blank();
    success2(`${source_default.bold(alias)} created  ${source_default.dim("ChatGPT via local CLIProxyAPI")}`);
    hint(`Default mapping: fable → ${CLI_PROXY_API_DEFAULTS.fableModel}, opus/sonnet → ${CLI_PROXY_API_DEFAULTS.opusModel}, haiku → ${CLI_PROXY_API_DEFAULTS.haikuModel}.`);
    hint(`Run ${source_default.cyan(`claudex-switch ${alias} -run`)} to start Claude Code; its normal skills, MCP servers, hooks, and CLAUDE.md remain enabled.`);
    blank();
  } catch (err) {
    try {
      if (profileWritten || await profileExists(profileName)) {
        await removeProfile(profileName);
      } else {
        await cleanupFailedManagedCLIProxyAPI(profileId);
      }
    } catch {}
    blank();
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
}
async function resolveCLIProxyAPIBinaryForAdd() {
  const existing = findCLIProxyAPIBinary();
  if (existing)
    return existing;
  if (platform5() === "darwin" && hasHomebrew()) {
    const install = await esm_default2({
      message: "CLIProxyAPI is not installed. Install it with Homebrew now?",
      default: true
    });
    if (install) {
      info("Installing CLIProxyAPI with Homebrew (no brew service will be started)...");
      const installed = await installCLIProxyAPIWithHomebrew();
      if (installed) {
        const afterInstall = findCLIProxyAPIBinary();
        if (afterInstall)
          return afterInstall;
      }
      error("Homebrew did not provide a usable CLIProxyAPI executable.");
    }
  }
  const explicitPath = (await esm_default3({
    message: "Path to an existing CLIProxyAPI executable (Enter to cancel)"
  })).trim();
  return explicitPath ? findCLIProxyAPIBinary(explicitPath) : null;
}
function hasHomebrew() {
  try {
    return spawnSync7("brew", ["--version"], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}
async function maybeSetupRelayBalance(baseUrl2) {
  if (!baseUrl2)
    return;
  let origin;
  try {
    origin = new URL(baseUrl2).origin;
  } catch {
    return;
  }
  if (await getRelayConfig(origin))
    return;
  const relay = await detectRelay(origin);
  if (!relay)
    return;
  blank();
  info(`This looks like a one-api/new-api relay${relay.systemName ? ` (${source_default.bold(relay.systemName)})` : ""}.`);
  hint("With a console access token, `list` also shows the account wallet balance.");
  hint("Find both fields on the relay console's personal settings page (系统访问令牌 + 用户ID).");
  for (;; ) {
    const token = (await esm_default4({
      message: "System access token (not an sk- key; Enter to skip)",
      mask: "*"
    })).trim();
    if (!token)
      return;
    const userIdRaw = (await esm_default3({
      message: "Numeric user ID (Enter if the site doesn't need one)",
      validate: (value) => /^\d*$/.test(value.trim()) || "User ID must be a number"
    })).trim();
    const config = userIdRaw ? { accessToken: token, userId: Number(userIdRaw) } : { accessToken: token };
    const balance = await fetchAccountBalanceWith(origin, config);
    if (balance) {
      await saveRelayConfig(origin, config);
      success2(`Relay account balance: ${formatBalanceSide(balance)}`);
      return;
    }
    error("The relay rejected the token/user ID.");
    hint(`Try again, press Enter to skip, or edit ${source_default.cyan(RELAYS_FILE)} later.`);
  }
}
async function promptClaudeApiConfig() {
  const apiKey = await esm_default4({
    message: "Paste your Anthropic API key",
    mask: "*",
    validate: (v) => {
      if (!v.trim())
        return "API key cannot be empty";
      return true;
    }
  });
  const baseUrl2 = await esm_default3({
    message: "Base URL (optional, for proxy/custom endpoint)",
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed)
        return true;
      try {
        new URL(trimmed);
        return true;
      } catch {
        return "Base URL must be a valid URL";
      }
    }
  });
  const authToken = await esm_default4({
    message: "Auth token (optional, only if your provider requires it)",
    mask: "*"
  });
  const model = await esm_default3({
    message: "Default model (optional)"
  });
  const defaultSonnetModel = await esm_default3({
    message: "Sonnet model mapping (optional)"
  });
  const defaultOpusModel = await esm_default3({
    message: "Opus model mapping (optional)"
  });
  const defaultHaikuModel = await esm_default3({
    message: "Haiku model mapping (optional)"
  });
  return {
    apiKey: apiKey.trim(),
    baseUrl: baseUrl2.trim() || undefined,
    authToken: authToken.trim() || undefined,
    model: model.trim() || undefined,
    defaultSonnetModel: defaultSonnetModel.trim() || undefined,
    defaultOpusModel: defaultOpusModel.trim() || undefined,
    defaultHaikuModel: defaultHaikuModel.trim() || undefined
  };
}
async function promptClaudeDefaultModel() {
  const defaultModel = await esm_default3({
    message: "Default model (optional)"
  });
  const normalized = defaultModel.trim();
  return normalized || undefined;
}
async function addCodexChatGPT(alias) {
  const codexCheck = spawnSync7("codex", ["--version"], {
    encoding: "utf-8"
  });
  const hasCodex = codexCheck.status === 0;
  if (!hasCodex) {
    error("Codex CLI not found. Install it with: npm install -g @openai/codex");
    blank();
    process.exit(1);
  }
  const defaultModel = await promptCodexDefaultModel();
  info("Running codex login...");
  blank();
  let loginResult;
  try {
    loginResult = await runIsolatedCodexLogin();
  } catch (err) {
    blank();
    error(`Failed to start Codex login: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  }
  if (loginResult.exitCode !== 0) {
    blank();
    error("Login failed or was cancelled.");
    blank();
    process.exit(1);
  }
  const auth = loginResult.auth;
  if (!auth || auth.auth_mode !== "chatgpt" || !auth.tokens) {
    blank();
    error("Could not read Codex auth after login.");
    blank();
    process.exit(1);
  }
  const tokenInfo = decodeIdToken(auth.tokens.id_token);
  const email = tokenInfo?.email ?? "unknown";
  const userId = tokenInfo?.chatgpt_user_id ?? "unknown";
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
  const reg = await loadRegistry();
  await syncActiveAuthSnapshot(reg);
  await saveAccountAuth(accountKey, auth);
  const accountRecord = {
    account_key: accountKey,
    chatgpt_account_id: accountId ?? "",
    chatgpt_user_id: userId,
    email,
    alias,
    account_name: null,
    plan: planType,
    auth_mode: "chatgpt",
    default_model: defaultModel,
    created_at: Math.floor(Date.now() / 1000),
    last_used_at: Math.floor(Date.now() / 1000),
    last_usage: null,
    last_usage_at: null,
    last_local_rollout: null
  };
  addAccountToRegistry(reg, accountRecord);
  setActiveAccount(reg, accountKey);
  await saveRegistry(reg);
  await switchToAccount(accountKey);
  await applyCodexApiProvider(null, undefined, defaultModel);
  await addAlias(alias, { provider: "codex", accountKey });
  blank();
  success2(`${source_default.bold(alias)} created  ${source_default.dim(email)}`);
  blank();
}
async function addCodexApiKey(alias) {
  const { provider: apiProvider, defaultModel } = await promptCodexApiProvider();
  const key = (await esm_default4({
    message: "Paste your OpenAI API key",
    mask: "*",
    validate: (v) => {
      if (!v.trim())
        return "API key cannot be empty";
      return true;
    }
  })).trim();
  try {
    await createCodexApiKeyAccount({
      alias,
      apiKey: key,
      provider: apiProvider,
      defaultModel
    });
  } catch (err) {
    blank();
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
  blank();
  success2(`${source_default.bold(alias)} created  ${source_default.dim(maskKey(key))}`);
  await maybeSetupRelayBalance(apiProvider.base_url ?? undefined);
  blank();
}
async function promptCodexDefaultModel() {
  const model = await esm_default3({
    message: "Default model",
    default: DEFAULT_CODEX_MODEL,
    validate: (value) => {
      if (!value.trim())
        return "Default model cannot be empty";
      return true;
    }
  });
  return model.trim();
}
async function promptCodexApiProvider() {
  const providerType = await esm_default5({
    message: "Codex API provider?",
    choices: [
      {
        name: "OpenAI official",
        value: "official"
      },
      {
        name: "Custom OpenAI-compatible provider",
        value: "custom"
      }
    ]
  });
  if (providerType === "official") {
    return {
      provider: {
        type: "official",
        name: null,
        base_url: null,
        model: null,
        env_key: null
      },
      defaultModel: await promptCodexDefaultModel()
    };
  }
  const name = await esm_default3({
    message: "Provider name",
    default: "admin",
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed)
        return "Provider name cannot be empty";
      if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
        return "Use letters, numbers, hyphens, or underscores.";
      }
      return true;
    }
  });
  const baseUrl2 = await esm_default3({
    message: "Base URL",
    default: "https://newapi.hybaliez.com/v1",
    validate: (value) => {
      if (!value.trim())
        return "Base URL cannot be empty";
      try {
        new URL(value.trim());
        return true;
      } catch {
        return "Base URL must be a valid URL";
      }
    }
  });
  const model = await promptCodexDefaultModel();
  const envKey = await esm_default3({
    message: "Env key",
    default: "OPENAI_API_KEY",
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed)
        return "Env key cannot be empty";
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
        return "Env key must be a valid environment variable name";
      }
      return true;
    }
  });
  return {
    provider: {
      type: "custom",
      name: name.trim(),
      base_url: baseUrl2.trim(),
      model,
      env_key: envKey.trim()
    },
    defaultModel: model
  };
}

// src/providers/codex/sessions.ts
import { execFile as execFile3 } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import {
  open as open3,
  readdir as readdir4,
  realpath as realpath2,
  rename as rename7,
  rm as rm9,
  stat as stat5,
  utimes
} from "fs/promises";
import { join as join14 } from "path";
import { pipeline as pipeline2 } from "stream/promises";
import { promisify as promisify2 } from "util";
var SESSION_DIRS = ["sessions", "archived_sessions"];
var STATE_DB_CANDIDATES = [
  join14("sqlite", "state_5.sqlite"),
  "state_5.sqlite"
];
var FIRST_LINE_MAX_BYTES = 4 * 1024 * 1024;
var READ_CHUNK_BYTES = 64 * 1024;
async function listJsonlFiles(root) {
  const results = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = await readdir4(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = join14(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        results.push(fullPath);
      }
    }
  }
  return results;
}
async function readFirstLine(filePath) {
  const handle = await open3(filePath, "r");
  try {
    const chunks = [];
    let total = 0;
    while (total < FIRST_LINE_MAX_BYTES) {
      const chunk = Buffer.alloc(READ_CHUNK_BYTES);
      const { bytesRead } = await handle.read(chunk, 0, READ_CHUNK_BYTES, total);
      if (bytesRead === 0)
        break;
      const part = chunk.subarray(0, bytesRead);
      const idx = part.indexOf(10);
      chunks.push(part);
      if (idx !== -1) {
        const buffer = Buffer.concat(chunks);
        const newlineIndex = total + idx;
        const hasCr = newlineIndex > 0 && buffer[newlineIndex - 1] === 13;
        const lineEnd = hasCr ? newlineIndex - 1 : newlineIndex;
        return {
          line: buffer.subarray(0, lineEnd).toString("utf-8"),
          restOffset: newlineIndex + 1,
          separator: hasCr ? `\r
` : `
`
        };
      }
      total += bytesRead;
    }
    if (total === 0)
      return null;
    if (total >= FIRST_LINE_MAX_BYTES)
      return null;
    return {
      line: Buffer.concat(chunks).toString("utf-8"),
      restOffset: total,
      separator: ""
    };
  } finally {
    await handle.close();
  }
}
function rewriteSessionMetaLine(line, targetProvider, managedProviders) {
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  const record2 = parsed;
  if (record2?.type !== "session_meta" || typeof record2.payload !== "object" || record2.payload === null) {
    return null;
  }
  const current2 = record2.payload.model_provider;
  if (current2 === targetProvider)
    return null;
  if (typeof current2 === "string" && current2 !== "" && !managedProviders.has(current2.toLowerCase())) {
    return null;
  }
  record2.payload.model_provider = targetProvider;
  return JSON.stringify(record2);
}
async function rewriteRolloutProvider(filePath, targetProvider, managedProviders) {
  const first = await readFirstLine(filePath);
  if (!first)
    return false;
  const updatedLine = rewriteSessionMetaLine(first.line, targetProvider, managedProviders);
  if (updatedLine === null)
    return false;
  const { mode, size, atime, mtime } = await stat5(filePath);
  const tmpPath = `${filePath}.claudex-sync.${process.pid}.tmp`;
  try {
    const out = createWriteStream(tmpPath, { mode });
    await new Promise((resolve3, reject) => {
      out.write(updatedLine + first.separator, (err) => err ? reject(err) : resolve3());
    });
    if (first.restOffset < size) {
      await pipeline2(createReadStream(filePath, { start: first.restOffset }), out);
    } else {
      await new Promise((resolve3, reject) => {
        out.end((err) => err ? reject(err) : resolve3());
      });
    }
    await rename7(tmpPath, filePath);
    await utimes(filePath, atime, mtime).catch(() => {});
    return true;
  } catch (err) {
    await rm9(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}
async function openSqlite(dbPath) {
  try {
    const mod = await import(["bun", "sqlite"].join(":"));
    const db = new mod.Database(dbPath);
    return {
      exec: (sql) => db.exec(sql),
      runUpdate: (sql, ...params) => Number(db.prepare(sql).run(...params).changes ?? 0),
      close: () => db.close()
    };
  } catch {}
  try {
    const mod = await import(["node", "sqlite"].join(":"));
    const db = new mod.DatabaseSync(dbPath);
    return {
      exec: (sql) => db.exec(sql),
      runUpdate: (sql, ...params) => Number(db.prepare(sql).run(...params).changes ?? 0),
      close: () => db.close()
    };
  } catch {
    return null;
  }
}
var execFileAsync2 = promisify2(execFile3);
function sqlQuote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
async function updateProvidersViaSqliteCli(dbPath, targetProvider, managedProviders) {
  const target = sqlQuote(targetProvider);
  const managed = [...managedProviders].map((name) => sqlQuote(name.toLowerCase())).join(", ");
  const { stdout } = await execFileAsync2("sqlite3", [
    "-cmd",
    ".timeout 2000",
    dbPath,
    `UPDATE threads SET model_provider = ${target} WHERE COALESCE(model_provider, '') <> ${target} AND (lower(model_provider) IN (${managed}) OR COALESCE(model_provider, '') = ''); SELECT changes();`
  ]);
  return Number(stdout.trim()) || 0;
}
async function updateSqliteThreadProviders(targetProvider, managedProviders) {
  let dbPath = null;
  for (const candidate of STATE_DB_CANDIDATES) {
    const fullPath = join14(CODEX_DIR, candidate);
    if (await fileExists(fullPath)) {
      dbPath = fullPath;
      break;
    }
  }
  if (!dbPath)
    return 0;
  const db = await openSqlite(dbPath);
  if (!db) {
    return updateProvidersViaSqliteCli(dbPath, targetProvider, managedProviders);
  }
  try {
    db.exec("PRAGMA busy_timeout = 2000");
    const managed = [...managedProviders].map((name) => name.toLowerCase());
    const placeholders = managed.map(() => "?").join(", ");
    return db.runUpdate(`UPDATE threads SET model_provider = ? WHERE COALESCE(model_provider, '') <> ? AND (lower(model_provider) IN (${placeholders}) OR COALESCE(model_provider, '') = '')`, targetProvider, targetProvider, ...managed);
  } finally {
    db.close();
  }
}
function parseLsofPaths(stdout) {
  const open4 = new Set;
  for (const line of stdout.split(`
`)) {
    if (line.startsWith("n") && line.endsWith(".jsonl")) {
      open4.add(line.slice(1));
    }
  }
  return open4;
}
var LSOF_CHUNK_SIZE = 100;
async function scanOpenFiles(paths) {
  const byRealPath = new Map;
  for (const path of paths) {
    try {
      byRealPath.set(await realpath2(path), path);
    } catch {
      byRealPath.set(path, path);
    }
  }
  const openReal = new Set;
  for (let i = 0;i < paths.length; i += LSOF_CHUNK_SIZE) {
    const chunk = paths.slice(i, i + LSOF_CHUNK_SIZE);
    try {
      const { stdout, stderr } = await execFileAsync2("lsof", ["-w", "-Fn", "--", ...chunk], { maxBuffer: 16777216 });
      if (stderr.trim())
        return { ok: false };
      for (const path of parseLsofPaths(stdout))
        openReal.add(path);
    } catch (err) {
      const e = err;
      const stderrText = typeof e.stderr === "string" ? e.stderr : "";
      if (e.code !== 1 || stderrText.trim())
        return { ok: false };
      const stdout = typeof e.stdout === "string" ? e.stdout : "";
      for (const path of parseLsofPaths(stdout))
        openReal.add(path);
    }
  }
  const open4 = new Set;
  for (const real of openReal) {
    open4.add(byRealPath.get(real) ?? real);
  }
  return { ok: true, paths: open4 };
}
async function anyCodexProcessRunning() {
  try {
    await execFileAsync2("pgrep", ["-f", "codex"]);
    return true;
  } catch (err) {
    const e = err;
    if (e.code === 1)
      return false;
    return true;
  }
}
async function syncCodexSessionProviders(targetProvider, managedProviders) {
  const candidates = [];
  for (const dirName of SESSION_DIRS) {
    const root = join14(CODEX_DIR, dirName);
    for (const filePath of await listJsonlFiles(root)) {
      try {
        const first = await readFirstLine(filePath);
        if (!first)
          continue;
        if (rewriteSessionMetaLine(first.line, targetProvider, managedProviders) !== null) {
          candidates.push(filePath);
        }
      } catch {}
    }
  }
  const scan = candidates.length > 0 ? await scanOpenFiles(candidates) : { ok: true, paths: new Set };
  const skipRollouts = !scan.ok && await anyCodexProcessRunning();
  const openPaths = scan.ok ? scan.paths : new Set;
  let rolloutFilesUpdated = 0;
  if (!skipRollouts) {
    for (const filePath of candidates) {
      if (openPaths.has(filePath))
        continue;
      try {
        if (await rewriteRolloutProvider(filePath, targetProvider, managedProviders)) {
          rolloutFilesUpdated += 1;
        }
      } catch {}
    }
  }
  let sqliteRowsUpdated = 0;
  try {
    sqliteRowsUpdated = await updateSqliteThreadProviders(targetProvider, managedProviders);
  } catch {}
  return { rolloutFilesUpdated, sqliteRowsUpdated };
}

// src/commands/use.ts
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
  switch (entry.target.provider) {
    case "claude":
      await switchClaude(entry.alias, entry.target.profileName);
      break;
    case "codex":
      await switchCodex(entry.alias, entry.target.accountKey);
      break;
    case "opencode":
      await switchOpenCode(entry.alias, entry.target.profileId);
      break;
  }
  return entry;
}
async function switchOpenCode(alias, profileId) {
  await ensureOpenCodeProfileReady(alias, profileId);
  await setActiveOpenCodeProfile(profileId);
  success2(`Selected ${source_default.bold(alias)}  ${formatProvider("opencode")}  ${formatType("subscription")}  ${formatPlan("Go")}`);
  hint(`Run ${source_default.cyan(`claudex-switch ${alias} -run`)} to open OpenCode with this credential; session history behavior depends on the installed OpenCode version.`);
  blank();
}
async function ensureOpenCodeProfileReady(alias, profileId) {
  if (!await openCodeProfileExists(profileId)) {
    error("OpenCode Go profile no longer exists.");
    hint("The underlying profile may have been purged.");
    blank();
    process.exit(1);
  }
  if (!await hasOpenCodeGoCredential(profileId)) {
    error("OpenCode Go credential is missing from this profile.");
    hint(`Run ${source_default.cyan(`claudex-switch refresh ${alias}`)} to reconnect it.`);
    blank();
    process.exit(1);
  }
  await getOpenCodeProfileData(profileId);
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
  } else if (data.type === "local-cliproxyapi") {
    label = source_default.dim(`CLIProxyAPI · local ${CLI_PROXY_API_UPSTREAMS[data.upstream ?? "codex"].label} login`);
  } else {
    const creds = await readCredentials(claudeProfileCredentials(profileName));
    label = formatPlan(creds?.claudeAiOauth?.subscriptionType ?? null);
  }
  success2(`Switched to ${source_default.bold(alias)}  ${formatProvider("claude")}  ${formatType(data.type)}  ${label}`);
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
    await syncActiveAuthSnapshot(reg);
    const auth = account.auth_mode === "apikey" ? await readAccountAuth(accountKey) : null;
    await switchToAccount(accountKey);
    await applyCodexApiProvider(account.auth_mode === "apikey" ? account.api_provider : null, auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY : undefined, account.default_model);
  } catch (err) {
    error(`Failed to switch: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  }
  if (reg.active_account_key !== accountKey) {
    setActiveAccount(reg, accountKey);
    await saveRegistry(reg);
  }
  await syncSessionVisibility(account, managedProviderNames(reg));
  const plan = formatPlan(account.plan ?? account.last_usage?.plan_type ?? null);
  const email = account.email ? source_default.dim(account.email) : "";
  success2(`Switched to ${source_default.bold(alias)}  ${formatProvider("codex")}  ${plan}  ${email}`);
  if (account.auth_mode === "apikey" && account.api_provider?.type === "custom") {
    const envKey = account.api_provider.env_key || "OPENAI_API_KEY";
    if (!process.env[envKey]) {
      hint(`Raw ${source_default.cyan("codex")} needs ${source_default.cyan(envKey)} in the shell; ${source_default.cyan(`claudex-switch ${alias} -run`)} injects it automatically.`);
    }
  }
  blank();
}
async function syncSessionVisibility(account, managedProviders) {
  const targetProvider = codexAccountProviderName(account);
  if (!targetProvider)
    return;
  try {
    const result2 = await syncCodexSessionProviders(targetProvider, managedProviders);
    if (result2.rolloutFilesUpdated > 0 || result2.sqliteRowsUpdated > 0) {
      info(`Synced ${result2.rolloutFilesUpdated} session file(s) and ${result2.sqliteRowsUpdated} thread row(s) to provider "${targetProvider}"`);
      hint("Sessions from both API and subscription could be /resume now.");
    }
  } catch {}
}

// src/commands/run.ts
import { spawn as spawn7 } from "child_process";

// src/lib/model-shorthand.ts
var CLAUDE_SHORTHAND = /^(?:(opus|sonnet|haiku|fable)[-]?)?(\d+(?:\.\d+)*)$/i;
var CODEX_SHORTHAND = /^(?:gpt-?)?(\d+(?:\.\d+)*)$/i;
var CLAUDE_EFFORT_LEVELS = new Set([
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "ultracode"
]);
var CODEX_EFFORT_LEVELS = new Set([
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "ultra"
]);
var MODEL_EFFORT_LEVELS = new Set([
  ...CLAUDE_EFFORT_LEVELS,
  ...CODEX_EFFORT_LEVELS
]);
var CODEX_MODEL_ALIASES = {
  "gpt-5.6": "gpt-5.6-sol",
  "gpt-6": "gpt-6-astra"
};
var CODEX_NAMED_ALIASES = {
  astra: "gpt-6-astra",
  sol: "gpt-6.1-sol",
  terra: "gpt-5.6-terra",
  luna: "gpt-6-luna"
};
var CLAUDE_LATEST_FABLE = "claude-fable-5-1";
function isModelEffort(value) {
  return value !== undefined && MODEL_EFFORT_LEVELS.has(value.toLowerCase());
}
function providerEffortLevels(provider) {
  if (provider === "claude")
    return CLAUDE_EFFORT_LEVELS;
  if (provider === "codex")
    return CODEX_EFFORT_LEVELS;
  return new Set;
}
function splitModelEffort(input) {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 2 && isModelEffort(parts[1])) {
    return { model: parts[0], effort: parts[1].toLowerCase() };
  }
  return { model: input.trim() };
}
function resolveModelShorthand(provider, input) {
  const trimmed = input.trim();
  if (!trimmed)
    return trimmed;
  if (provider === "claude") {
    if (/^fable$/i.test(trimmed)) {
      return CLAUDE_LATEST_FABLE;
    }
    const match2 = trimmed.match(CLAUDE_SHORTHAND);
    if (match2) {
      const series = (match2[1] ?? "opus").toLowerCase();
      const version = match2[2].replace(/\./g, "-");
      return `claude-${series}-${version}`;
    }
    return trimmed;
  }
  if (provider === "opencode")
    return trimmed;
  const namedAlias = CODEX_NAMED_ALIASES[trimmed.toLowerCase()];
  if (namedAlias)
    return namedAlias;
  const match = trimmed.match(CODEX_SHORTHAND);
  if (match) {
    const model = `gpt-${match[1]}`;
    if (/^gpt/i.test(trimmed))
      return model;
    return CODEX_MODEL_ALIASES[model] ?? model;
  }
  return trimmed;
}

// src/commands/model.ts
async function updateDefaultModel(entry, normalizedModel) {
  if (entry.target.provider === "claude") {
    const profile = await updateProfileDefaultModel(entry.target.profileName, normalizedModel);
    return profile.type;
  }
  if (entry.target.provider === "opencode") {
    const profile = await getOpenCodeProfileData(entry.target.profileId);
    await updateOpenCodeProfileDefaultModel(entry.target.profileId, profile.console ? normalizeOpenCodeConsoleModel(normalizedModel) : normalizeOpenCodeGoModel(normalizedModel));
    return "subscription";
  }
  const reg = await loadRegistry();
  const existing = findAccountByKey(reg, entry.target.accountKey);
  if (!existing) {
    throw new Error("Codex account not found in registry.");
  }
  const account = updateAccountDefaultModel(reg, entry.target.accountKey, normalizedModel);
  await saveRegistry(reg);
  if (reg.active_account_key === entry.target.accountKey) {
    const auth = account.auth_mode === "apikey" ? await readAccountAuth(entry.target.accountKey) : null;
    await applyCodexApiProvider(account.auth_mode === "apikey" ? account.api_provider : null, auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY : undefined, account.default_model);
  }
  return account.auth_mode ?? "unknown";
}
async function model(aliasOrName, defaultModel) {
  blank();
  if (!defaultModel.trim()) {
    error("Default model cannot be empty.");
    blank();
    process.exit(1);
  }
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);
  if (!entry) {
    error(`Alias "${aliasOrName}" not found.`);
    blank();
    process.exit(1);
  }
  const { model: modelPart, effort } = splitModelEffort(defaultModel);
  if (effort) {
    error("Effort levels aren't stored with the default model.");
    hint(`Use ${source_default.cyan(`claudex-switch ${aliasOrName} -run --model "${modelPart} ${effort}"`)} for a one-shot effort override.`);
    blank();
    process.exit(1);
  }
  const profile = entry.target.provider === "claude" ? await getProfileData(entry.target.profileName) : null;
  let normalizedModel = profile?.type === "local-cliproxyapi" ? modelPart : resolveModelShorthand(entry.target.provider, modelPart);
  let authMode;
  try {
    if (profile?.type === "local-cliproxyapi") {
      normalizedModel = await resolveManagedLocalCLIProxyAPIModel(profile, modelPart);
    }
    if (entry.target.provider === "opencode" && (await getOpenCodeProfileData(entry.target.profileId)).console) {
      const prepared = await prepareOpenCodeConsoleRun(entry.target.profileId, normalizedModel);
      try {
        authMode = await updateDefaultModel(entry, normalizedModel);
      } finally {
        await prepared.release();
      }
    } else {
      if (entry.target.provider === "opencode") {
        normalizedModel = await resolveOpenCodeGoModel(normalizedModel);
      }
      authMode = await updateDefaultModel(entry, normalizedModel);
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
  blank();
  success2(`Updated ${source_default.bold(entry.alias)}  ${formatProvider(entry.target.provider)}  ${formatType(authMode)}  ${source_default.dim(normalizedModel)}`);
  blank();
}

// src/providers/cliproxyapi/links.ts
import { mkdir as mkdir13 } from "fs/promises";
function linkKey(target) {
  return target.provider === "codex" ? `codex:${target.accountKey}` : `opencode:${target.profileId}`;
}
async function readLinks() {
  const file = await readJson(CLI_PROXY_API_LINKS_FILE, null);
  if (file?.version !== 1 || !file.links || typeof file.links !== "object") {
    return { version: 1, links: {} };
  }
  return file;
}
async function writeLinks(file) {
  await mkdir13(CLAUDEX_DIR, { recursive: true });
  await writeJsonSecure(CLI_PROXY_API_LINKS_FILE, file);
}
async function getLinkedClaudeProfile(target) {
  return (await readLinks()).links[linkKey(target)] ?? null;
}
async function setLinkedClaudeProfile(target, profileName) {
  const file = await readLinks();
  file.links[linkKey(target)] = profileName;
  await writeLinks(file);
}
async function removeLinkedClaudeProfile(target) {
  const file = await readLinks();
  if (!(linkKey(target) in file.links))
    return;
  delete file.links[linkKey(target)];
  await writeLinks(file);
}
async function linkedClaudeProfileNames() {
  return new Set(Object.values((await readLinks()).links));
}
async function purgeLinkedClaudeProfile(target) {
  const linked = await getLinkedClaudeProfile(target);
  if (!linked)
    return;
  if (await profileExists(linked))
    await removeProfile(linked);
  await removeLinkedClaudeProfile(target);
}

// src/commands/cliproxy.ts
var CLAUDE_CODE_CLIENTS = new Set(["claudecode", "claude-code", "claude"]);
var CLIPROXY_CLIENT_NAMES = "claudecode";
var ANTIGRAVITY_KEYWORDS = new Set(["agy", "antigravity"]);
function isAntigravityName(name) {
  return ANTIGRAVITY_KEYWORDS.has(name.toLowerCase());
}
function isSubscriptionName(name) {
  return isSubscriptionUpstream(name.toLowerCase());
}
function isClaudeCodeClient(value) {
  return CLAUDE_CODE_CLIENTS.has(value.toLowerCase());
}
async function resolveCLIProxyClaudeEntry(aliasOrName, options = {}) {
  const entry = findAlias(await loadAliases(), aliasOrName);
  if (!entry) {
    if (isAntigravityName(aliasOrName)) {
      return createAntigravityAlias(aliasOrName, options);
    }
    if (isSubscriptionName(aliasOrName)) {
      return createSubscriptionAlias(aliasOrName, aliasOrName.toLowerCase(), options);
    }
    throw new UserFacingError(`Alias "${aliasOrName}" not found.`, [
      `Use a Codex or OpenCode Go alias, agy for Antigravity, or workbuddy / workbuddy-ai / cursor.`
    ]);
  }
  if (entry.target.provider === "claude") {
    const data = await profileExists(entry.target.profileName) ? await getProfileData(entry.target.profileName) : null;
    if (data?.type === "local-cliproxyapi") {
      if (isSubscriptionUpstream(data.upstream) && !await hasManagedCLIProxyAPILogin(data.profileId)) {
        const identity2 = await loginOrThrow(data.profileId, data.binaryPath, upstreamLabel(data.upstream), undefined, data.authIdentity);
        await updateLocalCLIProxyAPIProfileIdentity(entry.target.profileName, identity2);
      }
      return entry;
    }
    throw new UserFacingError(`${entry.alias} is already a Claude account.`, [
      `Run ${source_default.cyan(`claudex-switch ${entry.alias} -run`)} without --cliproxy.`
    ]);
  }
  const target = entry.target;
  const linked = await getLinkedClaudeProfile(target);
  if (linked && await profileExists(linked)) {
    const data = await getProfileData(linked);
    if (data.type === "local-cliproxyapi") {
      if (target.provider === "codex") {
        await ensureCodexLinkLogin(entry.alias, target, data, linked);
      } else {
        await syncOpenCodeGoKey(target.profileId, data);
      }
      return claudeEntry(entry.alias, linked);
    }
  }
  const profileName = target.provider === "codex" ? await createCodexLink(entry.alias, target, options) : await createOpenCodeGoLink(entry.alias, target, options);
  return claudeEntry(entry.alias, profileName);
}

class UserFacingError extends Error {
  hints;
  constructor(message, hints = []) {
    super(message);
    this.hints = hints;
  }
}
function claudeEntry(alias, profileName) {
  return { alias, target: { provider: "claude", profileName }, createdAt: Date.now() };
}
async function requireBinary(options) {
  const binaryPath = await (options.resolveBinary ?? resolveCLIProxyAPIBinaryForAdd)();
  if (!binaryPath) {
    throw new UserFacingError("CLIProxyAPI was not installed or no valid executable was selected.", [
      "Install it with Homebrew on macOS, or provide an existing cli-proxy-api path."
    ]);
  }
  return binaryPath;
}
async function createManagedProfile(binaryPath, setup, login, save) {
  const profileId = createManagedCLIProxyAPIProfileId();
  const profileName = `cliproxy-${profileId}`;
  const profile = {
    type: "local-cliproxyapi",
    profileId,
    binaryPath,
    defaultModel: setup.upstream === "codex" ? CLI_PROXY_API_DEFAULTS.fableModel : "fable",
    upstream: setup.upstream
  };
  let saved = false;
  try {
    await initializeManagedCLIProxyAPI(profileId, setup);
    const identity2 = login ? await login(profileId) : undefined;
    if (identity2)
      profile.authIdentity = identity2;
    const runtime = setup.upstream === "antigravity" || isSubscriptionUpstream(setup.upstream) ? await ensureManagedCLIProxyAPI(profile) : undefined;
    await saveLocalCLIProxyAPIProfile(profileName, profile);
    saved = true;
    await save(profileName, profile);
    return { profileName, profile, runtime };
  } catch (err) {
    try {
      if (saved)
        await removeProfile(profileName);
      else {
        await stopManagedCLIProxyAPI(profile);
        await cleanupFailedManagedCLIProxyAPI(profileId);
      }
    } catch {}
    throw err;
  }
}
async function loginOrThrow(profileId, binaryPath, label, expectedAccount, expectedIdentity) {
  const login = await runManagedCLIProxyAPILogin({ profileId, binaryPath }, undefined, expectedIdentity, expectedAccount);
  if (login.identityMismatch) {
    throw new UserFacingError(`${label} login completed for a different account; nothing was changed.`, [
      "Log in with the same account as the alias and retry."
    ]);
  }
  if (!login.success || !login.identity) {
    throw new UserFacingError(`CLIProxyAPI ${label} login failed or was cancelled.`);
  }
  return login.identity;
}
async function codexAccountFor(target) {
  const account = findAccountByKey(await loadRegistry(), target.accountKey);
  if (!account)
    throw new UserFacingError("Codex account not found in registry.");
  if (account.auth_mode === "apikey") {
    throw new UserFacingError("--cliproxy needs a ChatGPT-login Codex account; this one uses an API key.");
  }
  return account;
}
async function createCodexLink(alias, target, options) {
  const account = await codexAccountFor(target);
  const binaryPath = await requireBinary(options);
  info(`First use: Claude Code needs its own ChatGPT login for ${source_default.bold(alias)} (once).`);
  hint("Sharing the Codex login would make each side invalidate the other's refresh token.");
  blank();
  const expected = { accountId: account.chatgpt_account_id, email: account.email };
  const { profileName } = await createManagedProfile(binaryPath, { upstream: "codex" }, (profileId) => loginOrThrow(profileId, binaryPath, "ChatGPT", expected), (name) => setLinkedClaudeProfile(target, name));
  success2(`Linked ${source_default.bold(alias)} to Claude Code`);
  return profileName;
}
async function ensureCodexLinkLogin(alias, target, profile, profileName) {
  if (await hasManagedCLIProxyAPILogin(profile.profileId))
    return;
  const account = await codexAccountFor(target);
  info(`Claude Code's ChatGPT login for ${source_default.bold(alias)} is missing; logging in again...`);
  blank();
  const identity2 = await loginOrThrow(profile.profileId, profile.binaryPath, "ChatGPT", {
    accountId: account.chatgpt_account_id,
    email: account.email
  });
  await updateLocalCLIProxyAPIProfileIdentity(profileName, identity2);
}
async function goKeyOrThrow(alias, profileId) {
  const go = await getOpenCodeProfileData(profileId);
  if (go.console) {
    throw new UserFacingError(`${alias} is an OpenCode subscription login without a static API key.`, [
      "Create a Go API key in the OpenCode console and add it as an OpenCode Go API Key alias."
    ]);
  }
  const key = await readOpenCodeGoApiKey(profileId);
  if (!key) {
    throw new UserFacingError(`${alias} has no saved OpenCode Go key.`, [
      `Run ${source_default.cyan(`claudex-switch refresh ${alias}`)} first.`
    ]);
  }
  return key;
}
async function createOpenCodeGoLink(alias, target, options) {
  const key = await goKeyOrThrow(alias, target.profileId);
  const binaryPath = await requireBinary(options);
  const catalog2 = await fetchOpenCodeGoCatalogIds();
  const models2 = pickOpenCodeGoModels(catalog2);
  const { profileName } = await createManagedProfile(binaryPath, {
    upstream: "opencode-go",
    models: models2,
    upstreamKey: key,
    upstreamModels: catalog2 ? [...catalog2].sort() : []
  }, null, (name) => setLinkedClaudeProfile(target, name));
  success2(`Linked ${source_default.bold(alias)} to Claude Code`);
  printMapping(models2);
  return profileName;
}
async function syncOpenCodeGoKey(goProfileId, profile) {
  const key = await readOpenCodeGoApiKey(goProfileId);
  const current2 = await readManagedCLIProxyAPIUpstream(profile.profileId);
  if (!key || !current2 || current2.upstreamKey === key)
    return;
  const managed = { profileId: profile.profileId, binaryPath: profile.binaryPath };
  if (await hasActiveManagedCLIProxyAPI(managed)) {
    warn("The OpenCode Go key changed; running Claude Code sessions keep the old key until they end.");
    return;
  }
  await updateManagedCLIProxyAPISetup(profile.profileId, { upstreamKey: key });
}
async function createAntigravityAlias(alias, options) {
  const rejection = checkAlias(await loadAliases(), alias);
  if (rejection)
    throw new UserFacingError(describeAliasRejection(rejection, alias));
  blank();
  warn("Google has suspended Antigravity access for accounts used through third-party proxies (Feb 2026), and its terms still forbid it.");
  hint("Consider logging in with a Google account you can afford to lose Antigravity access on.");
  const accepted = await (options.confirmRisk ?? (() => esm_default2({ message: "Continue with Antigravity via CLIProxyAPI?", default: false })))();
  if (!accepted)
    throw new UserFacingError("Cancelled; nothing was created.");
  const binaryPath = await requireBinary(options);
  assertCLIProxyAPICompatibility(binaryPath, "antigravity");
  info("Opening CLIProxyAPI's own Antigravity login in your browser...");
  blank();
  const { profileName, profile, runtime } = await createManagedProfile(binaryPath, { upstream: "antigravity" }, (profileId) => loginOrThrow(profileId, binaryPath, "Antigravity"), (name) => addAlias(alias, { provider: "claude", profileName: name }));
  const models2 = await getLocalCLIProxyAPISettings(profile, runtime);
  success2(`Saved as alias ${source_default.bold(alias)}  ${source_default.dim(`Claude Code · ${upstreamLabel("antigravity")}`)}`);
  printMapping(models2);
  return findAlias(await loadAliases(), alias) ?? claudeEntry(alias, profileName);
}
async function createSubscriptionAlias(alias, upstream, options) {
  const rejection = checkAlias(await loadAliases(), alias);
  if (rejection)
    throw new UserFacingError(describeAliasRejection(rejection, alias));
  const binaryPath = await requireBinary(options);
  if (upstream === "workbuddy") {
    if (!options.chooseWorkBuddyRegion && !process.stdin.isTTY) {
      throw new UserFacingError("WorkBuddy needs an interactive terminal to choose its region.", [
        `Run it in your terminal, or name the build: ${source_default.cyan("workbuddy-ai")} (international).`
      ]);
    }
    upstream = await (options.chooseWorkBuddyRegion ?? (() => esm_default5({
      message: "WorkBuddy region",
      choices: [
        { name: "International (workbuddy.ai)", value: "workbuddy-ai" },
        { name: "China (workbuddy.cn)", value: "workbuddy" }
      ]
    })))();
  }
  info(`First use: sign in to ${upstreamLabel(upstream)} for Claude Code.`);
  const { profileName, profile, runtime } = await createManagedProfile(binaryPath, { upstream }, (profileId) => loginOrThrow(profileId, binaryPath, upstreamLabel(upstream)), (name) => addAlias(alias, { provider: "claude", profileName: name }));
  success2(`Saved as alias ${source_default.bold(alias)}  ${source_default.dim(`Claude Code · ${upstreamLabel(upstream)}`)}`);
  printMapping(await getLocalCLIProxyAPISettings(profile, runtime));
  return findAlias(await loadAliases(), alias) ?? claudeEntry(alias, profileName);
}
function printMapping(models2) {
  hint(`opus/default → ${models2.opusModel} · sonnet → ${models2.sonnetModel} · haiku → ${models2.haikuModel}`);
}
function upstreamLabel(upstream) {
  return CLI_PROXY_API_UPSTREAMS[upstream ?? "codex"].label;
}

// src/commands/run.ts
import { join as join16 } from "path";

// src/providers/codex/run-home.ts
import {
  chmod as chmod11,
  lstat as lstat2,
  mkdir as mkdir14,
  readdir as readdir5,
  readlink as readlink2,
  rename as rename8,
  symlink as symlink2,
  unlink as unlink4,
  writeFile as writeFile10
} from "fs/promises";
import { join as join15 } from "path";
var AUTH_FILE = "auth.json";
var CONFIG_FILE = "config.toml";
var PRIVATE_ENTRIES = new Set([AUTH_FILE, CONFIG_FILE, "accounts"]);
async function isDefaultCodexAccount(reg, account) {
  if (reg.active_account_key !== account.account_key)
    return false;
  const active = await readActiveAuth();
  if (!active)
    return false;
  if (account.auth_mode === "chatgpt") {
    return authMatchesAccount(active, account);
  }
  const snapshot = await readAccountAuth(account.account_key);
  return active.auth_mode === "apikey" && Boolean(active.OPENAI_API_KEY) && active.OPENAI_API_KEY === snapshot?.OPENAI_API_KEY;
}
async function prepareCodexRunHome(account) {
  const home = codexRunHome(account.account_key);
  await mkdir14(home, { recursive: true, mode: 448 });
  await chmod11(home, 448);
  await mkdir14(CODEX_DIR, { recursive: true });
  await syncCodexRunAuth(account);
  const auth = await readAccountAuth(account.account_key);
  if (!auth) {
    throw new Error(`Auth file not found for account: ${account.account_key}`);
  }
  await writeFile10(join15(home, AUTH_FILE), JSON.stringify(normalizeAuthForCodexCli(auth), null, 2), { mode: 384 });
  await chmod11(join15(home, AUTH_FILE), 384);
  const privateConfig = await renderCodexRunConfig(account.auth_mode === "apikey" ? account.api_provider : null, auth.auth_mode === "apikey" ? auth.OPENAI_API_KEY ?? undefined : undefined);
  const configPath = join15(home, CONFIG_FILE);
  await removeEntry(configPath);
  if (privateConfig === null) {
    if (await fileExists(join15(CODEX_DIR, CONFIG_FILE))) {
      await linkEntry(join15(CODEX_DIR, CONFIG_FILE), configPath);
    }
  } else {
    await writeFile10(configPath, privateConfig, { mode: 384 });
    await chmod11(configPath, 384);
  }
  await linkSharedEntries(home);
  return home;
}
async function syncCodexRunAuth(account) {
  if (account.auth_mode !== "chatgpt")
    return;
  const runAuth = await readJson(join15(codexRunHome(account.account_key), AUTH_FILE), null);
  if (!runAuth || !authMatchesAccount(runAuth, account))
    return;
  const snapshot = await readAccountAuth(account.account_key);
  if (snapshot && sameAuthCredentialVersion(runAuth, snapshot))
    return;
  if (snapshot?.last_refresh && (!runAuth.last_refresh || runAuth.last_refresh < snapshot.last_refresh)) {
    return;
  }
  await saveAccountAuth(account.account_key, runAuth);
}
async function finishCodexRunHome(account) {
  await syncCodexRunAuth(account);
  await linkSharedEntries(codexRunHome(account.account_key));
}
async function linkSharedEntries(home) {
  for (const entry of await readdir5(home, { withFileTypes: true })) {
    if (PRIVATE_ENTRIES.has(entry.name) || entry.isSymbolicLink())
      continue;
    const shared = join15(CODEX_DIR, entry.name);
    if (await exists2(shared))
      continue;
    try {
      await rename8(join15(home, entry.name), shared);
    } catch {}
  }
  for (const entry of await readdir5(CODEX_DIR, { withFileTypes: true })) {
    if (PRIVATE_ENTRIES.has(entry.name))
      continue;
    await linkEntry(join15(CODEX_DIR, entry.name), join15(home, entry.name));
  }
}
async function linkEntry(source, destination) {
  try {
    const stat6 = await lstat2(destination);
    if (!stat6.isSymbolicLink())
      return;
    if (await readlink2(destination) === source)
      return;
    await unlink4(destination);
  } catch {}
  const sourceStat = await lstat2(source);
  const type = sourceStat.isDirectory() ? process.platform === "win32" ? "junction" : "dir" : "file";
  try {
    await symlink2(source, destination, type);
  } catch {}
}
async function removeEntry(path) {
  try {
    await unlink4(path);
  } catch {}
}
async function exists2(path) {
  try {
    await lstat2(path);
    return true;
  } catch {
    return false;
  }
}

// src/commands/run.ts
var RUN_FLAGS = new Set(["-run", "--run"]);
var HEADER_FLAGS = new Set(["--attribution-header"]);
var MODEL_FLAGS = new Set(["-model", "--model"]);
var CLAUDE_ATTRIBUTION_HEADER_ENV = "CLAUDE_CODE_ATTRIBUTION_HEADER";
var CODEX_COMPLETION_REVIEW_DISABLED_ENV = "CODEX_COMPLETION_REVIEW_DISABLED";
function isRunFlag(value) {
  return value !== undefined && RUN_FLAGS.has(value);
}
function isCliproxyRunInvocation(args) {
  return args.includes("--cliproxy") && isRunFlag(args[0]);
}
function requestsRemoteOpenCodeServer(args) {
  return args.some((arg) => arg === "--server" || arg === "-server" || arg.startsWith("--server="));
}
function requestsUnsafeOpenCodeV2Override(args) {
  return args.some((arg) => ["--attach", "-attach", "--config", "-config", "--model", "-model", "--standalone", "-standalone"].some((flag) => arg === flag || arg.startsWith(`${flag}=`)));
}
function requestsUnsafeOpenCodeV2Target(args) {
  const safeBooleanFlags = new Set([
    "--auto",
    "--yolo",
    "--dangerously-skip-permissions",
    "--print-logs"
  ]);
  const resumeFlags = new Set(["--continue", "-c", "--session", "-s"]);
  for (let index = 0;index < args.length; index += 1) {
    const arg = args[index];
    if (resumeFlags.has(arg) || arg.startsWith("--session=") || /^-s.+/.test(arg)) {
      return true;
    }
    if (arg === "--prompt") {
      index += 1;
      continue;
    }
    if (arg.startsWith("--prompt="))
      continue;
    if (safeBooleanFlags.has(arg))
      continue;
    return true;
  }
  return false;
}
var OPENCODE_V2_RUN_VALUE_FLAGS = new Set([
  "--format",
  "--title",
  "--file",
  "-f"
]);
var OPENCODE_V2_RUN_BOOLEAN_FLAGS = new Set([
  "--auto",
  "--print-logs",
  "--thinking"
]);
var OPENCODE_V2_RUN_RESUME_FLAGS = new Set([
  "--continue",
  "-c",
  "--session",
  "-s",
  "--fork"
]);
function isOpenCodeV2HeadlessRun(args) {
  return args[0] === "run";
}
function validateOpenCodeV2RunArgs(args) {
  for (let index = 0;index < args.length; index += 1) {
    const arg = args[index];
    if (OPENCODE_V2_RUN_VALUE_FLAGS.has(arg)) {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("-")) {
        return {
          ok: false,
          message: `Missing value after ${arg}.`,
          hint: "Pass a value after the headless run flag, or remove the flag."
        };
      }
      index += 1;
      continue;
    }
    if (arg.startsWith("--format=") || arg.startsWith("--title=") || arg.startsWith("--file=")) {
      continue;
    }
    if (OPENCODE_V2_RUN_BOOLEAN_FLAGS.has(arg))
      continue;
    if (OPENCODE_V2_RUN_RESUME_FLAGS.has(arg) || arg.startsWith("--session=") || arg.startsWith("--fork=") || /^-s.+/.test(arg)) {
      return {
        ok: false,
        message: "OpenCode V2 headless runs cannot resume or fork a session through CLI arguments.",
        hint: "Start a fresh run from the intended project directory; the alias preflight only covers the current directory."
      };
    }
    if (arg === "-m" || /^-m.+/.test(arg)) {
      return {
        ok: false,
        message: "OpenCode V2 aliases control the standalone server, config, and model selection.",
        hint: "Remove -m; use -run --model opencode-go/<model> to select a Go model."
      };
    }
    if (arg === "--agent" || arg.startsWith("--agent=")) {
      return {
        ok: false,
        message: "OpenCode V2 headless runs cannot switch agents through CLI arguments.",
        hint: "Set the intended agent as this project's default; the alias preflights its default agent."
      };
    }
    if (arg.startsWith("-")) {
      return {
        ok: false,
        message: `Unsupported OpenCode V2 headless run argument: ${arg}.`,
        hint: "Supported: the message, --format, --thinking, --title, --file, and --print-logs."
      };
    }
  }
  return { ok: true };
}
async function runAliasSession(aliasOrName, forwardedArgs = [], spawnCommand = spawn7, openCodeVersionDetector = detectOpenCodeVersion, openCodeCredentialSync) {
  const runOptions = parseRunArgumentOptions(forwardedArgs);
  const entry = runOptions.cliproxyClient ? await resolveCLIProxyEntryOrExit(aliasOrName) : await resolveAliasOrExit(aliasOrName);
  const supportsAutoreview = entry.target.provider === "codex" || entry.target.provider === "opencode";
  if (runOptions.autoreviewOverride !== undefined && !supportsAutoreview) {
    error("--autoreview is only supported for Codex and OpenCode sessions.");
    blank();
    process.exit(1);
  }
  if (runOptions.effortOverride) {
    const valid = providerEffortLevels(entry.target.provider);
    if (!valid.has(runOptions.effortOverride)) {
      const providerName = entry.target.provider === "claude" ? "Claude" : entry.target.provider === "codex" ? "Codex" : "OpenCode";
      error(`${providerName} doesn't support effort "${runOptions.effortOverride}".`);
      if (valid.size > 0)
        hint(`Valid tiers: ${[...valid].join(", ")}`);
      blank();
      process.exit(1);
    }
  }
  const claudeProfileName = entry.target.provider === "claude" ? entry.target.profileName : null;
  const isClaude = claudeProfileName !== null;
  const openCodeProfileId = entry.target.provider === "opencode" ? entry.target.profileId : null;
  const isOpenCode = openCodeProfileId !== null;
  const openCodeVersion = isOpenCode ? openCodeVersionDetector() : null;
  if (isOpenCode && !openCodeVersion) {
    error("Could not detect a supported OpenCode version on PATH.");
    hint("Install OpenCode 1.x or 2.x, then retry.");
    blank();
    return 1;
  }
  if (isOpenCode && !isSupportedOpenCodeVersion(openCodeVersion)) {
    error(`OpenCode ${openCodeVersion?.raw ?? "unknown"} is not supported by this version of claudex-switch.`);
    hint("Supported OpenCode major versions are 1.x and 2.x.");
    blank();
    return 1;
  }
  const isOpenCodeV2 = isOpenCode && openCodeVersion?.major === 2;
  const openCodeV2HeadlessRun = isOpenCodeV2 && isOpenCodeV2HeadlessRun(runOptions.forwardedArgs);
  if (isOpenCodeV2 && requestsRemoteOpenCodeServer(runOptions.forwardedArgs)) {
    error("OpenCode V2 account aliases cannot connect to a remote server.");
    hint("Remove --server so the selected key stays with the private standalone OpenCode process.");
    blank();
    return 1;
  }
  if (isOpenCodeV2 && requestsUnsafeOpenCodeV2Override(runOptions.forwardedArgs)) {
    error("OpenCode V2 aliases control the standalone server, config, and model selection.");
    hint("Remove --attach, --config, --standalone, or --model=<value>; use -run --model opencode-go/<model> to select a Go model.");
    blank();
    return 1;
  }
  if (openCodeV2HeadlessRun) {
    const runArgsCheck = validateOpenCodeV2RunArgs(runOptions.forwardedArgs.slice(1));
    if (!runArgsCheck.ok) {
      error(runArgsCheck.message);
      hint(runArgsCheck.hint);
      blank();
      return 1;
    }
  } else if (isOpenCodeV2 && requestsUnsafeOpenCodeV2Target(runOptions.forwardedArgs)) {
    error("OpenCode V2 aliases cannot target another directory or resume a session through CLI arguments.");
    hint("Run claudex-switch from the intended project directory and start a fresh alias session. Use /sessions only with the same managed alias; in-app project switching isn't preflighted.");
    blank();
    return 1;
  }
  let profile = claudeProfileName ? await getProfileData(claudeProfileName) : null;
  const openCodeProfile = openCodeProfileId ? await getOpenCodeProfileData(openCodeProfileId) : null;
  const inheritProxyModel = profile?.type === "local-cliproxyapi" && !!runOptions.cliproxyClient && !runOptions.modelOverride;
  let resolvedModel = runOptions.modelOverride ? profile?.type === "local-cliproxyapi" ? undefined : isOpenCode ? openCodeProfile?.console ? normalizeOpenCodeConsoleModel(runOptions.modelOverride) : normalizeOpenCodeGoModel(runOptions.modelOverride) : resolveModelShorthand(entry.target.provider, runOptions.modelOverride) : profile?.type === "oauth" || profile?.type === "local-cliproxyapi" ? profile.type === "local-cliproxyapi" ? undefined : profile.defaultModel : openCodeProfile?.defaultModel;
  if (openCodeProfileId && openCodeProfile && !openCodeProfile.console && resolvedModel) {
    try {
      const canonical2 = await resolveOpenCodeGoModel(resolvedModel);
      if (!runOptions.modelOverride && canonical2 !== resolvedModel) {
        await updateOpenCodeProfileDefaultModel(openCodeProfileId, canonical2);
        info(`Corrected the saved default model to ${source_default.cyan(canonical2)}.`);
      }
      resolvedModel = canonical2;
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      blank();
      return 1;
    }
  }
  if (runOptions.modelOverride && resolvedModel && !isOpenCode) {
    await updateDefaultModel(entry, resolvedModel);
    if (claudeProfileName) {
      profile = await getProfileData(claudeProfileName);
    }
  }
  const isolatedClaudeApi = profile?.type === "api-key";
  const isolatedClaudeOAuth = isClaude && profile?.type === "oauth";
  const isolatedLocalCLIProxyAPI = isClaude && profile?.type === "local-cliproxyapi";
  let codexHome;
  let codexRunAccount;
  if (entry.target.provider === "codex") {
    try {
      if (await repairCodexStringifiedArrays()) {
        info("Repaired stringified arrays in ~/.codex/config.toml");
      }
    } catch {}
    const reg = await loadRegistry();
    const account = findAccountByKey(reg, entry.target.accountKey);
    if (!account) {
      error("Codex account not found in registry.");
      hint("The account may have been removed by codex-auth.");
      blank();
      return 1;
    }
    if (!await isDefaultCodexAccount(reg, account)) {
      try {
        codexHome = await prepareCodexRunHome(account);
        codexRunAccount = account;
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        hint(`Run ${source_default.cyan(`claudex-switch refresh ${aliasOrName}`)} to log in again.`);
        blank();
        return 1;
      }
      resolvedModel ??= resolveCodexModel(account.default_model, account.auth_mode === "apikey" ? account.api_provider?.model : null);
    }
  } else if (isOpenCode && openCodeProfileId) {
    await ensureOpenCodeProfileReady(aliasOrName, openCodeProfileId);
  }
  let secureStorageDir;
  let configDir;
  let settingsNeutralizer = null;
  let localSettingsFile;
  let localLease;
  if (isolatedClaudeOAuth && claudeProfileName) {
    try {
      const context2 = await prepareIsolatedOAuthRun(claudeProfileName);
      secureStorageDir = context2.secureStorageDir;
      configDir = context2.configDir;
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      hint(`Run ${source_default.cyan(`claudex-switch ${aliasOrName}`)} to switch globally, then log in with ${source_default.cyan("claude")}.`);
      blank();
      process.exit(1);
    }
    if (profile?.type === "oauth" && Object.keys(normalizeCustomEnv(profile.env)).length > 0) {
      localSettingsFile = await prepareOAuthProfileClaudeSettings(claudeProfileName, profile);
    } else {
      settingsNeutralizer = await getClaudeEnvNeutralizer();
    }
  }
  if (isolatedClaudeApi && claudeProfileName && profile?.type === "api-key") {
    localSettingsFile = await prepareApiProfileClaudeSettings(claudeProfileName, profile);
  }
  if (isolatedLocalCLIProxyAPI && profile?.type === "local-cliproxyapi") {
    try {
      const context2 = await prepareIsolatedLocalCLIProxyAPIRun(claudeProfileName);
      secureStorageDir = context2.secureStorageDir;
      configDir = context2.configDir;
      await stopStaleManagedCLIProxyAPI({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath
      });
      localLease = await acquireManagedCLIProxyAPILease({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath
      });
      const runtime = await ensureManagedCLIProxyAPI({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath
      });
      resolvedModel = runOptions.modelOverride ? await resolveManagedLocalCLIProxyAPIModel(profile, runOptions.modelOverride) : inheritProxyModel ? undefined : await resolveManagedLocalCLIProxyAPIDefaultModel(profile);
      if (runOptions.modelOverride && resolvedModel) {
        await updateDefaultModel(entry, resolvedModel);
        profile = await getProfileData(claudeProfileName);
      }
      localSettingsFile = await prepareLocalCLIProxyAPIClaudeSettings(profile, runtime, {
        inheritModel: inheritProxyModel,
        savedModel: (await readJson(join16(configDir, "settings.json"), {})).model
      });
    } catch (err) {
      try {
        await localLease?.release();
      } catch {}
      error(err instanceof Error ? err.message : String(err));
      hint(`Run ${source_default.cyan(`claudex-switch doctor ${aliasOrName}`)} after fixing the local proxy.`);
      blank();
      process.exit(1);
    }
  }
  const command = isClaude ? "claude" : isOpenCode ? "opencode" : "codex";
  const defaultPermissionArgs = isClaude ? ["--permission-mode", "auto"] : isOpenCode ? ["--auto"] : ["--approve-for-me"];
  const effortArgs = runOptions.effortOverride ? isClaude ? ["--effort", runOptions.effortOverride] : isOpenCode ? [] : ["-c", `model_reasoning_effort=${runOptions.effortOverride}`] : [];
  const openCodeV2ManagedArgs = openCodeV2HeadlessRun ? ["run", "--standalone"] : isOpenCodeV2 ? ["--standalone"] : [];
  const spawnForwardedArgs = openCodeV2HeadlessRun ? runOptions.forwardedArgs.slice(1) : runOptions.forwardedArgs;
  const args = [
    ...openCodeV2ManagedArgs,
    ...isolatedClaudeApi ? ["--bare"] : [],
    ...defaultPermissionArgs,
    ...!isOpenCodeV2 && resolvedModel ? ["--model", resolvedModel] : [],
    ...effortArgs,
    ...localSettingsFile ? ["--settings", localSettingsFile] : [],
    ...settingsNeutralizer ? ["--settings", settingsNeutralizer] : [],
    ...spawnForwardedArgs
  ];
  let baseEnv;
  let releaseOpenCode;
  let openCodeCompactionGuard;
  try {
    if (openCodeProfile?.console && openCodeVersion?.major !== 2) {
      throw new Error("OpenCode subscription accounts require OpenCode 2.x.");
    }
    if (isOpenCodeV2 && openCodeProfileId && openCodeProfile?.console) {
      const prepared = await prepareOpenCodeConsoleRun(openCodeProfileId, resolvedModel);
      baseEnv = prepared.env;
      releaseOpenCode = prepared.release;
      openCodeCompactionGuard = prepared.compactionGuard;
    } else if (isOpenCodeV2 && openCodeProfileId) {
      const prepared = await prepareOpenCodeV2RunEnvironment(openCodeProfileId, resolvedModel, openCodeCredentialSync);
      baseEnv = prepared.env;
      openCodeCompactionGuard = prepared.compactionGuard;
    } else {
      baseEnv = await getRunEnvironment(entry, profile, runOptions.headerEnabled, secureStorageDir, configDir);
    }
    if (isOpenCode && runOptions.modelOverride && resolvedModel) {
      await updateDefaultModel(entry, resolvedModel);
    }
  } catch (err) {
    await releaseOpenCode?.();
    error(err instanceof Error ? err.message : String(err));
    blank();
    return 1;
  }
  const autoreviewEnabled = supportsAutoreview ? runOptions.autoreviewOverride ?? false : undefined;
  const env3 = applyAutoreview(codexHome ? { ...baseEnv ?? process.env, CODEX_HOME: codexHome } : baseEnv, autoreviewEnabled);
  if (codexHome) {
    info(`Default Codex account unchanged; this session uses ${source_default.dim(codexHome)}`);
  }
  if (openCodeCompactionGuard) {
    const { id, context: context2, buffer, managed } = openCodeCompactionGuard;
    const triggerPercent = Math.round((context2 - buffer) / context2 * 100);
    info(managed ? `OpenCode auto-compaction stays on for this session (model "${id}" window ${context2} < 500000 tokens; session buffer ${buffer}, fires near ${triggerPercent}%).` : `OpenCode auto-compaction stays on for this session (model "${id}" window ${context2} < 500000 tokens; keeping your buffer ${buffer}, fires near ${triggerPercent}%).`);
  }
  info(`Running ${source_default.cyan([command, ...args].join(" "))}`);
  if (supportsAutoreview) {
    const source = runOptions.autoreviewOverride === undefined ? "default" : "this session";
    info(`Autoreview: ${autoreviewEnabled ? "on" : "off"} (${source})`);
  }
  return new Promise((resolve3) => {
    let settled = false;
    let removeSignalHandlers = () => {};
    const finish = async (code) => {
      if (settled)
        return;
      settled = true;
      removeSignalHandlers();
      try {
        await localLease?.release();
        await releaseOpenCode?.();
      } catch {}
      resolve3(code);
    };
    let proc;
    try {
      proc = spawnCommand(command, args, { stdio: "inherit", env: env3 });
    } catch (err) {
      error(`Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`);
      blank();
      finish(1);
      return;
    }
    const signals2 = ["SIGINT", "SIGTERM", "SIGHUP"];
    const handlers = signals2.map((signal) => () => {
      if (signal === "SIGINT" && process.stdin.isTTY)
        return;
      try {
        proc.kill(signal);
      } catch {}
    });
    for (let i = 0;i < signals2.length; i += 1)
      process.on(signals2[i], handlers[i]);
    removeSignalHandlers = () => {
      for (let i = 0;i < signals2.length; i += 1)
        process.off(signals2[i], handlers[i]);
    };
    proc.on("error", (err) => {
      error(`Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`);
      blank();
      finish(1);
    });
    proc.on("close", (code, signal) => {
      (async () => {
        if (isolatedClaudeOAuth && claudeProfileName) {
          try {
            await syncIsolatedOAuthSnapshot(claudeProfileName);
          } catch {}
        } else if (codexRunAccount) {
          try {
            await finishCodexRunHome(codexRunAccount);
          } catch {}
        } else if (entry.target.provider === "codex") {
          try {
            await syncActiveAuthSnapshot(await loadRegistry());
          } catch {}
        }
        const signalExitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : signal === "SIGHUP" ? 129 : 1;
        await finish(code ?? signalExitCode);
      })();
    });
  });
}
async function getRunEnvironment(entry, profile, headerEnabled, secureStorageDir, configDir) {
  if (entry.target.provider === "claude") {
    if (profile?.type === "api-key") {
      return applyClaudeAttributionHeader(buildClaudeApiEnvironment(profile), headerEnabled);
    }
    if (profile?.type === "local-cliproxyapi") {
      return applyClaudeAttributionHeader(buildClaudeLocalCLIProxyAPIEnvironment(secureStorageDir, configDir, profile.env), headerEnabled);
    }
    return applyClaudeAttributionHeader(buildClaudeOAuthEnvironment(secureStorageDir, configDir, profile?.env), headerEnabled);
  }
  if (entry.target.provider === "opencode") {
    return await openCodeRunEnvironment(entry.target.profileId);
  }
  const auth = await readAccountAuth(entry.target.accountKey);
  if (auth?.auth_mode !== "apikey" || !auth.OPENAI_API_KEY) {
    return;
  }
  const reg = await loadRegistry();
  const account = findAccountByKey(reg, entry.target.accountKey);
  const envKey = account?.api_provider?.env_key || "OPENAI_API_KEY";
  return {
    ...process.env,
    [envKey]: auth.OPENAI_API_KEY
  };
}
async function resolveAliasOrExit(aliasOrName) {
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, aliasOrName);
  if (entry) {
    return entry;
  }
  error(`Alias "${aliasOrName}" not found.`);
  hint(`Run ${source_default.cyan("claudex-switch list")} to see your accounts`);
  blank();
  process.exit(1);
}
async function resolveCLIProxyEntryOrExit(aliasOrName) {
  try {
    return await resolveCLIProxyClaudeEntry(aliasOrName);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    if (err instanceof UserFacingError) {
      for (const line of err.hints)
        hint(line);
    }
    blank();
    process.exit(1);
  }
}
function parseRunArgumentOptions(args) {
  const forwardedArgs = [];
  let cliproxyClient;
  let modelOverride;
  let effortOverride;
  let headerEnabled;
  let autoreviewOverride;
  for (let index = 0;index < args.length; index += 1) {
    const arg = args[index];
    if (MODEL_FLAGS.has(arg)) {
      const nextValue = args[index + 1]?.trim();
      if (!nextValue) {
        error(`Missing model name after ${arg}.`);
        hint(`Example: ${source_default.cyan("claudex-switch <alias> -run --model 4.8 max")}`);
        blank();
        process.exit(1);
      }
      const withEffort = splitModelEffort(nextValue);
      modelOverride = withEffort.model;
      effortOverride = withEffort.effort;
      index += 1;
      const follower = args[index + 1]?.trim();
      if (!effortOverride && isModelEffort(follower)) {
        effortOverride = follower.toLowerCase();
        index += 1;
      }
      continue;
    }
    if (HEADER_FLAGS.has(arg)) {
      const nextValue = args[index + 1]?.trim().toLowerCase();
      if (!nextValue || !["true", "false", "1", "0"].includes(nextValue)) {
        error("Missing header toggle after --attribution-header.");
        hint(`Example: ${source_default.cyan("claudex-switch <alias> -run --attribution-header false")}`);
        blank();
        process.exit(1);
      }
      headerEnabled = nextValue === "true" || nextValue === "1";
      index += 1;
      continue;
    }
    if (arg === "--cliproxy") {
      const nextValue = args[index + 1]?.trim();
      if (!nextValue || !isClaudeCodeClient(nextValue)) {
        error(nextValue ? `--cliproxy currently supports: ${CLIPROXY_CLIENT_NAMES}` : "Missing client after --cliproxy.");
        hint(`Example: ${source_default.cyan("claudex-switch cx -run --cliproxy claudecode")}`);
        blank();
        process.exit(1);
      }
      cliproxyClient = "claudecode";
      index += 1;
      continue;
    }
    if (arg === "--autoreview") {
      const nextValue = args[index + 1]?.trim().toLowerCase();
      if (nextValue !== "on" && nextValue !== "off") {
        error("Expected 'on' or 'off' after --autoreview.");
        hint(`Example: ${source_default.cyan("claudex-switch cx -run --autoreview off")}`);
        blank();
        process.exit(1);
      }
      autoreviewOverride = nextValue === "on";
      index += 1;
      continue;
    }
    forwardedArgs.push(arg);
  }
  return {
    forwardedArgs,
    modelOverride,
    effortOverride,
    headerEnabled,
    autoreviewOverride,
    cliproxyClient
  };
}
function applyAutoreview(baseEnv, override) {
  if (override === undefined)
    return baseEnv;
  const env3 = { ...baseEnv ?? process.env };
  if (override) {
    delete env3[CODEX_COMPLETION_REVIEW_DISABLED_ENV];
  } else {
    env3[CODEX_COMPLETION_REVIEW_DISABLED_ENV] = "1";
  }
  return env3;
}
function buildClaudeOAuthEnvironment(secureStorageDir, configDir, extraEnv) {
  if (!secureStorageDir && !configDir && !CLAUDE_ENV_KEYS.some((key) => process.env[key]) && Object.keys(normalizeCustomEnv(extraEnv)).length === 0) {
    return;
  }
  const env3 = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env3[key];
  }
  applyCustomEnv(env3, extraEnv);
  if (secureStorageDir) {
    env3.CLAUDE_SECURESTORAGE_CONFIG_DIR = secureStorageDir;
  }
  if (configDir) {
    env3.CLAUDE_CONFIG_DIR = configDir;
  }
  return env3;
}
function buildClaudeApiEnvironment(config) {
  const env3 = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env3[key];
  }
  setOptionalEnv(env3, "ANTHROPIC_API_KEY", config.apiKey);
  setOptionalEnv(env3, "ANTHROPIC_BASE_URL", config.baseUrl);
  setOptionalEnv(env3, "ANTHROPIC_AUTH_TOKEN", config.authToken);
  setOptionalEnv(env3, "ANTHROPIC_MODEL", config.model);
  setOptionalEnv(env3, "ANTHROPIC_DEFAULT_FABLE_MODEL", config.defaultFableModel);
  setOptionalEnv(env3, "ANTHROPIC_DEFAULT_SONNET_MODEL", config.defaultSonnetModel);
  setOptionalEnv(env3, "ANTHROPIC_DEFAULT_OPUS_MODEL", config.defaultOpusModel);
  setOptionalEnv(env3, "ANTHROPIC_DEFAULT_HAIKU_MODEL", config.defaultHaikuModel);
  setOptionalEnv(env3, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);
  applyCustomEnv(env3, config.env);
  return env3;
}
function buildClaudeLocalCLIProxyAPIEnvironment(secureStorageDir, configDir, extraEnv) {
  const env3 = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env3[key];
  }
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    delete env3[key];
  }
  applyCustomEnv(env3, localCLIProxyAPIExtraEnv(extraEnv));
  if (secureStorageDir) {
    env3.CLAUDE_SECURESTORAGE_CONFIG_DIR = secureStorageDir;
  }
  if (configDir) {
    env3.CLAUDE_CONFIG_DIR = configDir;
  }
  return env3;
}
function applyCustomEnv(env3, extraEnv) {
  for (const [key, value] of Object.entries(normalizeCustomEnv(extraEnv))) {
    env3[key] = value;
  }
}
function applyClaudeAttributionHeader(baseEnv, headerEnabled) {
  if (headerEnabled === undefined) {
    return baseEnv;
  }
  const env3 = baseEnv ? { ...baseEnv } : { ...process.env };
  if (headerEnabled) {
    delete env3[CLAUDE_ATTRIBUTION_HEADER_ENV];
    return env3;
  }
  env3[CLAUDE_ATTRIBUTION_HEADER_ENV] = "0";
  return env3;
}
function setOptionalEnv(env3, key, value) {
  if (value) {
    env3[key] = value;
    return;
  }
  delete env3[key];
}

// src/commands/list.ts
import { stripVTControlCharacters as stripVTControlCharacters2 } from "util";

// src/providers/claude/usage.ts
var USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
var TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
var CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
var EXPIRY_SKEW_MS = 60000;
var FETCH_TIMEOUT_MS3 = 5000;
function expiresAt(creds) {
  return creds?.claudeAiOauth?.expiresAt ?? 0;
}
async function fetchClaudeUsage(profileName, isActiveProfile) {
  const stores = await readOAuthCredentialStores(profileName, isActiveProfile);
  const { isolated, global: global2 } = stores;
  let creds = freshestOAuthCredentials(stores);
  if (!creds)
    return { usage: null, note: null };
  const persist = async (next) => {
    await writeCredentials(next, claudeProfileCredentials(profileName));
    if (isolated) {
      await writeIsolatedCredentials(next, claudeProfileDir(profileName));
    }
    if (global2) {
      await writeCredentials(next, CREDENTIALS_FILE);
    }
  };
  let refreshed2 = false;
  if (expiresAt(creds) - EXPIRY_SKEW_MS < Date.now()) {
    const result2 = await refreshOAuthToken(creds);
    if (result2 === "denied")
      return { usage: null, note: "login expired" };
    if (result2 === "unavailable")
      return { usage: null, note: "usage n/a" };
    await persist(result2);
    creds = result2;
    refreshed2 = true;
  }
  let response = await requestUsage(creds.claudeAiOauth.accessToken);
  if (response === "unauthorized" && !refreshed2) {
    const result2 = await refreshOAuthToken(creds);
    if (result2 === "denied")
      return { usage: null, note: "login expired" };
    if (result2 === "unavailable")
      return { usage: null, note: "usage n/a" };
    await persist(result2);
    response = await requestUsage(result2.claudeAiOauth.accessToken);
  }
  if (response === "unauthorized")
    return { usage: null, note: "login expired" };
  if (response === "unavailable" || !response) {
    return { usage: null, note: "usage n/a" };
  }
  return { usage: response, note: null };
}
async function requestUsage(accessToken) {
  try {
    const res = await fetch(USAGE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "anthropic-beta": "oauth-2025-04-20",
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS3)
    });
    if (res.status === 401 || res.status === 403)
      return "unauthorized";
    if (!res.ok)
      return "unavailable";
    return parseUsageResponse(await res.json());
  } catch {
    return "unavailable";
  }
}
function parseUsageResponse(data) {
  if (!data || typeof data !== "object")
    return null;
  const obj = data;
  const window = (value) => {
    if (!value || typeof value !== "object")
      return null;
    const w = value;
    if (typeof w.utilization !== "number")
      return null;
    const resetsAt = typeof w.resets_at === "string" ? Date.parse(w.resets_at) : NaN;
    return {
      usedPercent: w.utilization,
      resetsAt: Number.isFinite(resetsAt) ? resetsAt : null
    };
  };
  const fiveHour = window(obj.five_hour);
  const weekly = window(obj.seven_day);
  if (!fiveHour && !weekly)
    return null;
  return {
    fiveHourUsedPercent: fiveHour?.usedPercent ?? null,
    fiveHourResetsAt: fiveHour?.resetsAt ?? null,
    weeklyUsedPercent: weekly?.usedPercent ?? null,
    weeklyResetsAt: weekly?.resetsAt ?? null
  };
}
async function refreshOAuthToken(creds) {
  const refreshToken = creds.claudeAiOauth?.refreshToken;
  if (!refreshToken)
    return "denied";
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS3)
    });
    if (!res.ok)
      return "denied";
    const token = await res.json();
    if (typeof token.access_token !== "string")
      return "denied";
    return {
      ...creds,
      claudeAiOauth: {
        ...creds.claudeAiOauth,
        accessToken: token.access_token,
        refreshToken: typeof token.refresh_token === "string" ? token.refresh_token : refreshToken,
        expiresAt: Date.now() + (typeof token.expires_in === "number" ? token.expires_in : 3600) * 1000
      }
    };
  } catch {
    return "unavailable";
  }
}

// src/lib/usage-cache.ts
import { spawn as spawn8 } from "child_process";
import { mkdir as mkdir15, open as open4, readFile as readFile11, rename as rename9, stat as stat6, unlink as unlink5, writeFile as writeFile11 } from "fs/promises";
var LOCK_STALE_MS = 2 * 60000;
var TRANSIENT_NOTES = new Set(["usage n/a", "quota unavailable"]);
function emptyUsageCache() {
  return { version: 1, refreshStartedAt: null, refreshFinishedAt: null, entries: {} };
}
async function readUsageCache() {
  try {
    const parsed = JSON.parse(await readFile11(USAGE_CACHE_FILE, "utf-8"));
    if (parsed?.version !== 1 || !parsed.entries || typeof parsed.entries !== "object") {
      return emptyUsageCache();
    }
    return parsed;
  } catch {
    return emptyUsageCache();
  }
}
async function writeUsageCache(cache) {
  await mkdir15(CLAUDEX_DIR, { recursive: true });
  const tmp = `${USAGE_CACHE_FILE}.${process.pid}.tmp`;
  await writeFile11(tmp, JSON.stringify(cache, null, 2), { mode: 384 });
  await rename9(tmp, USAGE_CACHE_FILE);
}
async function usageCacheMtime() {
  try {
    return (await stat6(USAGE_CACHE_FILE)).mtimeMs;
  } catch {
    return 0;
  }
}
function nextCacheEntry(previous, result2, now) {
  if (result2.usage || result2.balance) {
    return {
      usage: result2.usage,
      balance: result2.balance,
      plan: result2.plan ?? previous?.plan ?? null,
      dataAt: now,
      note: null,
      checkedAt: now
    };
  }
  return {
    usage: previous?.usage ?? null,
    balance: previous?.balance ?? null,
    plan: result2.plan ?? previous?.plan ?? null,
    dataAt: previous?.dataAt ?? null,
    note: result2.note,
    checkedAt: now
  };
}
function quotaFromCache(entry) {
  if (!entry)
    return null;
  const latestOk = entry.note === null && entry.dataAt === entry.checkedAt;
  const hasData = Boolean(entry.usage || entry.balance);
  if (latestOk || hasData && (entry.note === null || TRANSIENT_NOTES.has(entry.note))) {
    return {
      usage: entry.usage,
      balance: entry.balance,
      note: null,
      plan: entry.plan,
      dataAt: entry.dataAt
    };
  }
  return { usage: null, balance: null, note: entry.note, plan: entry.plan, dataAt: null };
}
function formatAge(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60)
    return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48)
    return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
async function acquireRefreshLock() {
  await mkdir15(CLAUDEX_DIR, { recursive: true });
  for (let attempt = 0;attempt < 2; attempt++) {
    try {
      const handle = await open4(USAGE_REFRESH_LOCK, "wx", 384);
      await handle.writeFile(`${process.pid} ${Date.now()}
`);
      await handle.close();
      return async () => {
        await unlink5(USAGE_REFRESH_LOCK).catch(() => {});
      };
    } catch {
      if (!await isRefreshLockStale())
        return null;
      await unlink5(USAGE_REFRESH_LOCK).catch(() => {});
    }
  }
  return null;
}
async function isRefreshRunning() {
  try {
    await stat6(USAGE_REFRESH_LOCK);
  } catch {
    return false;
  }
  return !await isRefreshLockStale();
}
async function isRefreshLockStale() {
  try {
    return Date.now() - (await stat6(USAGE_REFRESH_LOCK)).mtimeMs > LOCK_STALE_MS;
  } catch {
    return true;
  }
}
function spawnBackgroundRefresh() {
  const args = ["list", "--refresh-cache"];
  const script = process.argv[1];
  const compiled = !script || script.startsWith("/$bunfs/") || /^[A-Za-z]:[\\/]~BUN[\\/]/.test(script);
  try {
    const child = spawn8(process.execPath, compiled ? args : [script, ...args], {
      detached: true,
      stdio: "ignore",
      env: process.env
    });
    child.on("error", () => {});
    child.unref();
  } catch {}
}

// src/lib/activity.ts
import { execFile as execFile4 } from "child_process";
import { mkdir as mkdir16, readdir as readdir6, readFile as readFile12, realpath as realpath3, rename as rename10, stat as stat7, writeFile as writeFile12 } from "fs/promises";
import { join as join17 } from "path";
import { promisify as promisify3 } from "util";
var ACTIVITY_DAYS = 30;
var REFRESH_INTERVAL_MS = 10 * 60000;
var STALE_START_MS = 2 * 60000;
var GIT_TIMEOUT_MS = 30000;
var execFileAsync3 = promisify3(execFile4);
var CODE_EXTENSIONS = [
  "py",
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "go",
  "rs",
  "sh",
  "swift",
  "java",
  "kt",
  "c",
  "cc",
  "cpp",
  "h",
  "hpp",
  "cs",
  "rb",
  "php",
  "lua",
  "sql",
  "css",
  "scss",
  "vue",
  "svelte",
  "dart",
  "zig"
];
var GENERATED_PATH = /(\.min\.(js|css)$|(^|\/)(node_modules|dist|build|vendor|\.venv|output|outputs|data|state|journals|logs|fixtures|snapshots|generated)\/)/;
function emptyActivityCache() {
  return { version: 1, startedAt: null, finishedAt: null, repos: 0, days: {} };
}
async function readActivityCache() {
  try {
    const parsed = JSON.parse(await readFile12(ACTIVITY_CACHE_FILE, "utf-8"));
    if (parsed?.version !== 1 || !parsed.days || typeof parsed.days !== "object") {
      return emptyActivityCache();
    }
    return parsed;
  } catch {
    return emptyActivityCache();
  }
}
async function writeActivityCache(cache) {
  await mkdir16(CLAUDEX_DIR, { recursive: true });
  const tmp = `${ACTIVITY_CACHE_FILE}.${process.pid}.tmp`;
  await writeFile12(tmp, JSON.stringify(cache), { mode: 384 });
  await rename10(tmp, ACTIVITY_CACHE_FILE);
}
function localDay(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function activityWindow(now) {
  const today = new Date(now);
  return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (ACTIVITY_DAYS - 1 - i), 12);
    return localDay(d.getTime());
  });
}
async function refreshActivityCache(now = Date.now()) {
  const cache = await readActivityCache();
  const started = cache.startedAt ?? 0;
  const running2 = started > (cache.finishedAt ?? 0) && now - started < STALE_START_MS;
  if (running2 || now - (cache.finishedAt ?? 0) < REFRESH_INTERVAL_MS)
    return false;
  await writeActivityCache({ ...cache, startedAt: now });
  const result2 = await computeActivity(now);
  await writeActivityCache({ version: 1, startedAt: now, finishedAt: Date.now(), ...result2 });
  return true;
}
async function computeActivity(now) {
  const window = activityWindow(now);
  const since = new Date(`${window[0]}T00:00:00`).getTime();
  const days = Object.fromEntries(window.map((day) => [day, { tokens: 0, added: 0, deleted: 0 }]));
  const addTokens = (ms, tokens) => {
    const day = days[localDay(ms)];
    if (day && tokens > 0)
      day.tokens += tokens;
  };
  const cwds = new Set;
  await Promise.all([
    collectClaudeTokens(since, addTokens, cwds).catch(() => {}),
    collectCodexTokens(since, addTokens, cwds).catch(() => {}),
    collectOpenCodeTokens(since, addTokens, cwds).catch(() => {})
  ]);
  const repos = await collectCommittedLines(cwds, since, days).catch(() => 0);
  return { repos, days };
}
async function recentJsonlFiles(roots, since) {
  const files = new Set;
  const seenDirs = new Set;
  const walk = async (dir) => {
    let real;
    try {
      real = await realpath3(dir);
    } catch {
      return;
    }
    if (seenDirs.has(real))
      return;
    seenDirs.add(real);
    const entries = await readdir6(real, { withFileTypes: true }).catch(() => []);
    await Promise.all(entries.map(async (entry) => {
      const path = join17(real, entry.name);
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        const info2 = await stat7(path).catch(() => null);
        if (info2?.isDirectory())
          return walk(path);
        if (!info2 || !entry.name.endsWith(".jsonl"))
          return;
        if (info2.mtimeMs >= since)
          files.add(await realpath3(path));
      } else if (entry.name.endsWith(".jsonl")) {
        const info2 = await stat7(path).catch(() => null);
        if (info2 && info2.mtimeMs >= since)
          files.add(path);
      }
    }));
  };
  await Promise.all(roots.map(walk));
  return [...files];
}
async function collectClaudeTokens(since, addTokens, cwds) {
  const roots = [join17(CLAUDE_DIR, "projects")];
  for (const profile of await readdir6(CLAUDE_PROFILES_DIR).catch(() => [])) {
    roots.push(join17(CLAUDE_PROFILES_DIR, profile, "config", "projects"));
  }
  const seen = new Set;
  for (const file of await recentJsonlFiles(roots, since)) {
    const text = await readFile12(file, "utf-8").catch(() => "");
    for (const line of text.split(`
`)) {
      if (!line.includes('"usage"'))
        continue;
      let record2;
      try {
        record2 = JSON.parse(line);
      } catch {
        continue;
      }
      const usage2 = record2?.message?.usage;
      const at = Date.parse(record2?.timestamp);
      if (!usage2 || !(at >= since))
        continue;
      const key = `${record2.message.id}:${record2.requestId}`;
      if (seen.has(key))
        continue;
      seen.add(key);
      if (typeof record2.cwd === "string")
        cwds.add(record2.cwd);
      addTokens(at, num2(usage2.input_tokens) + num2(usage2.output_tokens) + num2(usage2.cache_creation_input_tokens) + num2(usage2.cache_read_input_tokens));
    }
  }
}
async function collectCodexTokens(since, addTokens, cwds) {
  const files = await recentJsonlFiles([join17(CODEX_DIR, "sessions"), join17(CODEX_DIR, "archived_sessions")], since);
  for (const file of files) {
    const text = await readFile12(file, "utf-8").catch(() => "");
    let previous = 0;
    for (const line of text.split(`
`)) {
      const tokenEvent = line.includes('"token_count"');
      if (!tokenEvent && !line.includes('"turn_context"') && !line.includes('"session_meta"'))
        continue;
      let record2;
      try {
        record2 = JSON.parse(line);
      } catch {
        continue;
      }
      const payload = record2?.payload;
      if (tokenEvent) {
        const total = num2(payload?.info?.total_token_usage?.total_tokens);
        if (total <= previous)
          continue;
        const at = Date.parse(record2.timestamp);
        if (at >= since)
          addTokens(at, total - previous);
        previous = total;
      } else if (typeof payload?.cwd === "string") {
        cwds.add(payload.cwd);
      }
    }
  }
}
async function collectOpenCodeTokens(since, addTokens, cwds) {
  const dbs = [nativeOpenCodeDatabaseFile()];
  for (const profileId of await readdir6(OPENCODE_PROFILES_DIR).catch(() => [])) {
    dbs.push(openCodeProfileV2DatabaseFile(profileId));
  }
  const seen = new Set;
  for (const db of dbs) {
    if (!await stat7(db).catch(() => null))
      continue;
    const messages = await queryRows(db, `SELECT id, time_created AS at,
         coalesce(json_extract(data, '$.tokens.input'), 0) + coalesce(json_extract(data, '$.tokens.output'), 0) +
         coalesce(json_extract(data, '$.tokens.reasoning'), 0) + coalesce(json_extract(data, '$.tokens.cache.read'), 0) +
         coalesce(json_extract(data, '$.tokens.cache.write'), 0) AS tokens
       FROM session_message WHERE type = 'assistant' AND time_created >= ${Math.floor(since)}`);
    for (const row of messages ?? []) {
      if (typeof row.id !== "string" || seen.has(row.id))
        continue;
      seen.add(row.id);
      addTokens(num2(row.at), num2(row.tokens));
    }
    const sessions = await queryRows(db, `SELECT DISTINCT directory FROM session_v2 WHERE time_updated >= ${Math.floor(since)}`);
    for (const row of sessions ?? []) {
      if (typeof row.directory === "string")
        cwds.add(row.directory);
    }
  }
}
async function git(args) {
  try {
    const { stdout } = await execFileAsync3("git", args, {
      maxBuffer: 256 * 1024 * 1024,
      timeout: GIT_TIMEOUT_MS
    });
    return stdout;
  } catch {
    return null;
  }
}
async function collectCommittedLines(cwds, since, days) {
  const repos = new Map;
  await Promise.all([...cwds].map(async (cwd) => {
    if (!(await stat7(cwd).catch(() => null))?.isDirectory())
      return;
    const out = await git(["-C", cwd, "rev-parse", "--path-format=absolute", "--git-common-dir", "--show-toplevel"]);
    const [common2, top] = out?.trim().split(`
`) ?? [];
    if (common2 && top && !repos.has(common2))
      repos.set(common2, top);
  }));
  const seenCommits = new Set;
  let counted = 0;
  await Promise.all([...repos.values()].map(async (top) => {
    const email = (await git(["-C", top, "config", "user.email"]))?.trim();
    if (!email)
      return;
    const out = await git([
      "-C",
      top,
      "log",
      "--all",
      "--no-merges",
      `--since=${new Date(since).toISOString()}`,
      "--author",
      `<${email}>`,
      "--fixed-strings",
      "--numstat",
      "--date=format-local:%Y-%m-%d",
      "--format=@%H %ad",
      "--",
      ...CODE_EXTENSIONS.map((ext) => `*.${ext}`)
    ]);
    if (out === null)
      return;
    counted++;
    let day;
    for (const line of out.split(`
`)) {
      if (line.startsWith("@")) {
        const [hash2, date] = line.slice(1).split(" ");
        day = hash2 && !seenCommits.has(hash2) ? days[date ?? ""] : undefined;
        if (hash2)
          seenCommits.add(hash2);
        continue;
      }
      const [added, deleted, path] = line.split("\t");
      if (!day || path === undefined || added === "-" || GENERATED_PATH.test(path))
        continue;
      day.added += num2(Number(added));
      day.deleted += num2(Number(deleted));
    }
  }));
  return counted;
}
function num2(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}
var SPARK = "▁▂▃▄▅▆▇█";
function sparkline(values) {
  const max = Math.max(...values);
  return values.map((v) => v <= 0 || max <= 0 ? " " : SPARK[Math.min(SPARK.length - 1, Math.ceil(v / max * SPARK.length) - 1)]).join("");
}
function formatCompact(n) {
  const units = [[1e9, "B"], [1e6, "M"], [1000, "K"]];
  for (const [size, suffix] of units) {
    if (n >= size) {
      const value = n / size;
      return `${value >= 100 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "")}${suffix}`;
    }
  }
  return String(Math.round(n));
}
function shortDay(day) {
  return `${day.slice(5, 7)}/${day.slice(8, 10)}`;
}
function renderActivityLines(cache, now = Date.now()) {
  if (!cache.finishedAt)
    return [];
  const window = activityWindow(now);
  const day = (key) => cache.days[key] ?? { tokens: 0, added: 0, deleted: 0 };
  const tokens = window.map((key) => day(key).tokens);
  const added = window.map((key) => day(key).added);
  const deleted = window.reduce((sum2, key) => sum2 + day(key).deleted, 0);
  const sum = (values) => values.reduce((a, b) => a + b, 0);
  const peak = (values, format) => {
    const max = Math.max(...values);
    return max > 0 ? source_default.dim(`  peak ${format(max)} ${shortDay(window[values.indexOf(max)])}`) : "";
  };
  const age = now - cache.finishedAt >= 60 * 60000 ? source_default.dim(` · ${formatAge(now - cache.finishedAt)}`) : "";
  const axisGap = " ".repeat(ACTIVITY_DAYS - 10);
  return [
    `  ${source_default.dim("──")} ${source_default.bold(`Last ${ACTIVITY_DAYS} days`)} ${source_default.dim("──")}${age}`,
    `  Tokens  ${source_default.cyan(sparkline(tokens))}  ${formatCompact(sum(tokens))}${peak(tokens, formatCompact)}`,
    `  Code    ${source_default.green(sparkline(added))}  ${source_default.green(`+${formatCompact(sum(added))}`)} ${source_default.red(`-${formatCompact(deleted)}`)}` + source_default.dim(`  ${cache.repos} ${cache.repos === 1 ? "repo" : "repos"}`) + peak(added, (n) => `+${formatCompact(n)}`),
    source_default.dim(`          ${shortDay(window[0])}${axisGap}${shortDay(window[window.length - 1])}`)
  ];
}

// src/providers/codex/app-server.ts
import { spawn as spawn9 } from "child_process";
import { createInterface as createInterface2 } from "readline";
var REQUEST_TIMEOUT_MS = 1e4;
var MAX_CONCURRENT_SERVERS = 3;

class CodexRateLimitsReadError extends Error {
  refreshedAuth;
  constructor(message, refreshedAuth) {
    super(message);
    this.refreshedAuth = refreshedAuth;
    this.name = "CodexRateLimitsReadError";
  }
}
var activeServers = 0;
var serverWaiters = [];
async function acquireServerSlot() {
  if (activeServers >= MAX_CONCURRENT_SERVERS) {
    await new Promise((resolve3) => serverWaiters.push(resolve3));
  }
  activeServers += 1;
  return () => {
    activeServers -= 1;
    serverWaiters.shift()?.();
  };
}
async function readCodexRateLimits(auth, spawnAppServer = spawn9) {
  const release = await acquireServerSlot();
  let codexHome = null;
  try {
    codexHome = await prepareIsolatedCodexHome(auth);
    try {
      const response = await requestRateLimits(codexHome, spawnAppServer);
      return {
        response,
        refreshedAuth: await readIsolatedCodexAuth(codexHome)
      };
    } catch (err) {
      throw new CodexRateLimitsReadError(err instanceof Error ? err.message : String(err), await readIsolatedCodexAuth(codexHome));
    }
  } finally {
    try {
      if (codexHome)
        await cleanupIsolatedCodexHome(codexHome);
    } finally {
      release();
    }
  }
}
async function requestRateLimits(codexHome, spawnAppServer) {
  const env3 = { ...process.env, CODEX_HOME: codexHome };
  delete env3.OPENAI_API_KEY;
  delete env3.CODEX_API_KEY;
  delete env3.CODEX_ACCESS_TOKEN;
  return new Promise((resolve3, reject) => {
    const proc = spawnAppServer("codex", ["app-server", "-c", 'cli_auth_credentials_store="file"'], { stdio: ["pipe", "pipe", "pipe"], env: env3 });
    const stdout = proc.stdout;
    const stdin = proc.stdin;
    if (!stdout || !stdin) {
      proc.kill();
      reject(new Error("Codex App Server did not expose stdio"));
      return;
    }
    let settled = false;
    let stderr = "";
    const finish = (error2, response) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      lines.close();
      stdin.end();
      proc.kill();
      if (error2)
        reject(error2);
      else
        resolve3(response ?? {});
    };
    const send = (message) => {
      stdin.write(`${JSON.stringify(message)}
`);
    };
    proc.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.on("error", (error2) => finish(error2));
    proc.on("close", (code) => {
      if (!settled) {
        const detail = stderr.trim();
        finish(new Error(detail || `Codex App Server exited before replying (${code ?? "unknown"})`));
      }
    });
    const lines = createInterface2({ input: stdout });
    lines.on("line", (line) => {
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        return;
      }
      if (message.id === 0) {
        if (message.error) {
          finish(new Error(jsonRpcErrorMessage(message.error)));
          return;
        }
        send({ method: "initialized" });
        send({ id: 1, method: "account/rateLimits/read" });
        return;
      }
      if (message.id === 1) {
        if (message.error) {
          finish(new Error(jsonRpcErrorMessage(message.error)));
          return;
        }
        finish(null, message.result ?? {});
      }
    });
    const timer = setTimeout(() => finish(new Error("Codex App Server rate-limit request timed out")), REQUEST_TIMEOUT_MS);
    send({
      id: 0,
      method: "initialize",
      params: {
        clientInfo: {
          name: "claudex-switch",
          title: "claudex-switch",
          version: "1"
        },
        capabilities: { experimentalApi: true }
      }
    });
  });
}
function jsonRpcErrorMessage(error2) {
  if (error2 && typeof error2 === "object") {
    const message = error2.message;
    if (typeof message === "string")
      return message;
  }
  return "Codex App Server request failed";
}

// src/providers/codex/usage.ts
function isFreePlan(tokens) {
  return decodeCodexPlan(tokens) === "free";
}
async function fetchCodexUsage(accountKey, isActive, rateLimitsReader = readCodexRateLimits) {
  const auth = await readAccountAuth(accountKey);
  if (!auth || auth.auth_mode !== "chatgpt" || !auth.tokens?.access_token) {
    return { usage: null, note: null };
  }
  if (isFreePlan(auth.tokens))
    return { usage: null, note: null };
  try {
    const { response, refreshedAuth } = await rateLimitsReader(auth);
    await persistRefreshedAuth(accountKey, isActive, auth, refreshedAuth);
    const usage2 = parseRateLimitsResponse(response);
    const plan = parseRateLimitsPlan(response);
    return usage2 ? { usage: usage2, note: null, plan } : { usage: null, note: "usage n/a", plan };
  } catch (err) {
    if (err instanceof CodexRateLimitsReadError) {
      await persistRefreshedAuth(accountKey, isActive, auth, err.refreshedAuth);
    }
    const message = err instanceof Error ? err.message : String(err);
    const expired = /auth|login|refresh.token|unauthorized|forbidden/i.test(message);
    return { usage: null, note: expired ? "login expired" : "usage n/a" };
  }
}
async function persistRefreshedAuth(accountKey, isActive, originalAuth, refreshedAuth) {
  if (!originalAuth || !refreshedAuth || refreshedAuth.auth_mode !== "chatgpt" || !sameChatGptIdentity(originalAuth, refreshedAuth)) {
    return;
  }
  const currentSnapshot = await readAccountAuth(accountKey);
  if (!currentSnapshot || !sameAuthCredentialVersion(currentSnapshot, originalAuth)) {
    return;
  }
  if (!isActive) {
    await saveAccountAuth(accountKey, refreshedAuth);
    return;
  }
  const registry = await loadRegistry();
  const account = findAccountByKey(registry, accountKey);
  if (registry.active_account_key !== accountKey || !account) {
    await saveAccountAuth(accountKey, refreshedAuth);
    return;
  }
  const activeAuth = await readActiveAuth();
  if (!activeAuth || !authMatchesAccount(activeAuth, account))
    return;
  if (!sameAuthCredentialVersion(activeAuth, originalAuth)) {
    await saveAccountAuth(accountKey, activeAuth);
    return;
  }
  await saveAccountAuth(accountKey, refreshedAuth);
  await switchToAccount(accountKey);
}
function parseRateLimitsResponse(response) {
  const snapshot = preferredSnapshot(response);
  if (!snapshot)
    return null;
  return parseSnapshot(snapshot);
}
function parseRateLimitsPlan(response) {
  const plan = response.rateLimitsByLimitId?.codex?.planType ?? response.rateLimits?.planType;
  return typeof plan === "string" && plan.trim() ? plan : null;
}
function preferredSnapshot(response) {
  return response.rateLimitsByLimitId?.codex ?? response.rateLimits ?? null;
}
function parseSnapshot(snapshot) {
  const info2 = {
    fiveHourUsedPercent: null,
    fiveHourResetsAt: null,
    weeklyUsedPercent: null,
    weeklyResetsAt: null
  };
  let any = false;
  for (const [index, window] of [snapshot.primary, snapshot.secondary].entries()) {
    if (!window || typeof window.usedPercent !== "number")
      continue;
    const isWeekly = typeof window.windowDurationMins === "number" ? window.windowDurationMins > 1440 : index === 1;
    const resetsAt = typeof window.resetsAt === "number" ? window.resetsAt * 1000 : null;
    if (isWeekly) {
      info2.weeklyUsedPercent = window.usedPercent;
      info2.weeklyResetsAt = resetsAt;
    } else {
      info2.fiveHourUsedPercent = window.usedPercent;
      info2.fiveHourResetsAt = resetsAt;
    }
    any = true;
  }
  return any ? info2 : null;
}

// src/commands/list.ts
async function list(options = {}) {
  const withUsage = options.usage !== false;
  const offlineJson = options.json === true && !withUsage;
  const aliasReg = await loadAliases();
  const validAliases = options.json ? aliasReg.aliases.filter(isWellFormedJsonAlias) : aliasReg.aliases;
  if (validAliases.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ schemaVersion: 1, accounts: [] }));
      return;
    }
    blank();
    console.log(header("  No accounts yet"));
    blank();
    hint(`Run ${source_default.cyan("claudex-switch import")} to import existing accounts`);
    hint(`or  ${source_default.cyan("claudex-switch add <alias>")} to add a new one`);
    blank();
    return;
  }
  const ctx = await loadListContext(validAliases, offlineJson);
  if (options.json) {
    const infos = await Promise.all(ctx.entries.map((entry) => accountInfo(ctx, entry, withUsage, options, true)));
    if (!offlineJson)
      await persistDisplayedCodexPlans(ctx.entries, infos, ctx.codexReg);
    const result2 = {
      schemaVersion: 1,
      accounts: infos.map(toJsonListAccount).sort(compareJsonAccounts)
    };
    console.log(JSON.stringify(result2));
    return;
  }
  const baseInfos = await Promise.all(ctx.entries.map((entry) => accountInfo(ctx, entry, false, options, false)));
  const activity = await readActivityCache();
  if (!withUsage) {
    await persistDisplayedCodexPlans(ctx.entries, baseInfos, ctx.codexReg);
    printLines(renderLines(baseInfos, false, activity));
    return;
  }
  if (!options.background) {
    await refreshUsageCache(options);
    printLines(renderLines(withCachedQuota(ctx.entries, baseInfos, await readUsageCache()), false, activity));
    return;
  }
  const spawnRefresh = options.spawnRefresh ?? spawnBackgroundRefresh;
  if (options.cached) {
    const cache = await readUsageCache();
    printLines(renderLines(withCachedQuota(ctx.entries, baseInfos, cache), false, activity));
    await startBackgroundRefreshIfIdle(cache, spawnRefresh);
    return;
  }
  const startedAt = Date.now();
  spawnRefresh();
  await renderWhileRefreshing(ctx.entries, baseInfos, activity, startedAt, options.waitMs ?? DEFAULT_WAIT_MS);
}
async function refreshUsageCache(options = {}) {
  const release = await acquireRefreshLock();
  if (!release)
    return false;
  try {
    const ctx = await loadListContext((await loadAliases()).aliases, false);
    const cache = await readUsageCache();
    const keys = new Set(ctx.entries.map(cacheKey));
    cache.entries = Object.fromEntries(Object.entries(cache.entries).filter(([key]) => keys.has(key)));
    cache.refreshStartedAt = Date.now();
    let writes2 = writeUsageCache(cache);
    const save = () => {
      writes2 = writes2.catch(() => {}).then(() => writeUsageCache(cache));
      return writes2;
    };
    const infos = await Promise.all(ctx.entries.map(async (entry) => {
      const info2 = await accountInfo(ctx, entry, true, options, false);
      if (info2.status === "configured") {
        const key = cacheKey(entry);
        cache.entries[key] = nextCacheEntry(cache.entries[key], {
          usage: info2.usage,
          balance: info2.balance,
          note: info2.usageNote,
          plan: info2.provider === "codex" && info2.authMode === "chatgpt" ? info2.plan : null
        }, Date.now());
        await save().catch(() => {});
      }
      return info2;
    }));
    await persistDisplayedCodexPlans(ctx.entries, infos, ctx.codexReg);
    cache.refreshFinishedAt = Date.now();
    await save();
    return true;
  } finally {
    await release();
  }
}
var DEFAULT_WAIT_MS = 2000;
var POLL_MS2 = 100;
var CACHED_REFRESH_MIN_INTERVAL_MS = 30000;
async function loadListContext(aliases, offlineJson) {
  const byProvider = (provider) => aliases.filter((a) => a.target.provider === provider);
  const claudeState = await readState2();
  const openCodeState = await readOpenCodeState();
  let codexReg = null;
  try {
    codexReg = await loadRegistry({ persistNormalization: !offlineJson });
    if (!offlineJson)
      await syncActiveAuthSnapshot(codexReg);
  } catch {}
  return {
    entries: [
      ...byProvider("claude"),
      ...byProvider("codex"),
      ...byProvider("opencode")
    ],
    claudeActive: claudeState.active,
    openCodeActive: openCodeState.active,
    codexReg,
    codexUsage: codexReg?.api?.usage !== false
  };
}
async function accountInfo(ctx, entry, withUsage, options, inspectCredentials) {
  const info2 = await providerAccountInfo(ctx, entry, withUsage, options, inspectCredentials);
  if (entry.target.provider !== "claude") {
    info2.linkedClient = await linkedClaudeCodeStatus(entry.target);
  }
  return info2;
}
async function linkedClaudeCodeStatus(target) {
  const profileName = await getLinkedClaudeProfile(target);
  if (!profileName)
    return null;
  const data = await readJson(claudeProfileDataFile(profileName), null);
  if (data?.type !== "local-cliproxyapi")
    return null;
  const status = await inspectManagedCLIProxyAPI({
    profileId: data.profileId,
    binaryPath: data.binaryPath
  });
  return `claudecode: ${!status.loggedIn ? "login required" : status.running ? "running" : "stopped"}`;
}
function providerAccountInfo(ctx, entry, withUsage, options, inspectCredentials) {
  switch (entry.target.provider) {
    case "claude":
      return getClaudeAccountInfo(entry, ctx.claudeActive, withUsage);
    case "codex":
      return getCodexAccountInfo(entry, ctx.codexReg, withUsage && ctx.codexUsage, options.codexUsageFetcher ?? fetchCodexUsage, inspectCredentials);
    default:
      return getOpenCodeAccountInfo(entry, ctx.openCodeActive, withUsage, options.openCodeUsageFetcher ?? fetchOpenCodeUsage);
  }
}
function cacheKey(entry) {
  const target = entry.target;
  switch (target.provider) {
    case "claude":
      return `claude:${target.profileName}`;
    case "codex":
      return `codex:${target.accountKey}`;
    default:
      return `opencode:${target.profileId}`;
  }
}
function withCachedQuota(entries, baseInfos, cache) {
  return baseInfos.map((info2, index) => {
    const entry = entries[index];
    if (!entry || info2.status !== "configured")
      return info2;
    const quota = quotaFromCache(cache.entries[cacheKey(entry)]);
    if (!quota)
      return info2;
    return {
      ...info2,
      usage: quota.usage,
      balance: quota.balance,
      usageNote: quota.note ?? info2.usageNote,
      plan: info2.provider === "codex" && info2.authMode === "chatgpt" && quota.plan ? quota.plan : info2.plan,
      quotaAt: quota.dataAt
    };
  });
}
async function startBackgroundRefreshIfIdle(cache, spawnRefresh) {
  const last = Math.max(cache.refreshStartedAt ?? 0, cache.refreshFinishedAt ?? 0);
  if (Date.now() - last < CACHED_REFRESH_MIN_INTERVAL_MS)
    return;
  if (await isRefreshRunning())
    return;
  spawnRefresh();
}
async function renderWhileRefreshing(entries, baseInfos, activity, startedAt, waitMs) {
  let cache = await readUsageCache();
  const finished = () => (cache.refreshFinishedAt ?? 0) >= startedAt;
  const current2 = (refreshing) => renderLines(withCachedQuota(entries, baseInfos, cache), refreshing, activity);
  const initial = current2(true);
  const live = process.stdout.isTTY === true && visualLineCount(initial) < (process.stdout.rows || 24);
  let drawn = live ? redraw(initial, 0) : 0;
  let lastMtime = await usageCacheMtime();
  while (!finished() && Date.now() - startedAt < waitMs) {
    await new Promise((resolve3) => setTimeout(resolve3, POLL_MS2));
    const mtime = await usageCacheMtime();
    if (mtime === lastMtime)
      continue;
    lastMtime = mtime;
    cache = await readUsageCache();
    if (live)
      drawn = redraw(current2(!finished()), drawn);
  }
  if (live)
    redraw(current2(false), drawn);
  else
    printLines(current2(false));
}
function redraw(lines, previousLineCount) {
  const clear = previousLineCount > 0 ? `\x1B[${previousLineCount}A\x1B[0J` : "";
  process.stdout.write(`${clear}${lines.join(`
`)}
`);
  return visualLineCount(lines);
}
function visualLineCount(lines) {
  const columns = process.stdout.columns || 80;
  return lines.reduce((total, line) => total + Math.max(1, Math.ceil(stripVTControlCharacters2(line).length / columns)), 0);
}
function printLines(lines) {
  console.log(lines.join(`
`));
}
function renderLines(infos, refreshing, activity) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(...args.map(String).join(" ").split(`
`));
  };
  try {
    blank();
    console.log(header("  Accounts"));
    const sections = [
      ["Claude", "claude"],
      ["Codex", "codex"],
      ["OpenCode", "opencode"]
    ];
    for (const [title, provider] of sections) {
      const sectionInfos = infos.filter((info2) => info2.provider === provider);
      if (sectionInfos.length === 0)
        continue;
      blank();
      sectionHeader(title);
      renderSection(sectionInfos);
    }
    if (infos.some((info2) => info2.usage)) {
      blank();
      hint("5h/wk/mo = remaining quota in the 5-hour / weekly / monthly window");
    }
    if (refreshing)
      hint("refreshing quota…");
    const trend = renderActivityLines(activity);
    if (trend.length > 0) {
      blank();
      for (const line of trend)
        console.log(line);
    }
    blank();
  } finally {
    console.log = originalLog;
  }
  return lines;
}
async function getOpenCodeAccountInfo(entry, activeProfile, withUsage, usageFetcher) {
  if (entry.target.provider !== "opencode") {
    throw new Error("Not an OpenCode alias");
  }
  const profileId = entry.target.profileId;
  const info2 = {
    alias: entry.alias,
    provider: "opencode",
    email: null,
    plan: "Go",
    authMode: "subscription",
    apiProvider: null,
    defaultModel: null,
    isActive: activeProfile === profileId,
    usage: null,
    usageNote: null,
    balance: null,
    status: "configured"
  };
  try {
    const profile = await getOpenCodeProfileData(profileId);
    info2.defaultModel = profile.console && profile.defaultModel ? normalizeOpenCodeConsoleModel(profile.defaultModel) : profile.defaultModel ?? null;
    if (profile.console) {
      info2.email = profile.console.email;
    }
    if (!await hasOpenCodeGoCredential(profileId)) {
      info2.authMode = "missing credential";
      info2.usageNote = "reconnect required";
      info2.status = "missing-credential";
    } else if (withUsage) {
      const result2 = await usageFetcher(profileId);
      info2.usage = result2.usage;
      info2.usageNote = result2.note;
    }
  } catch {
    info2.authMode = "missing profile";
    info2.usageNote = "reconnect required";
    info2.status = "missing-profile";
  }
  return info2;
}
function renderSection(infos) {
  const maxAliasLen = Math.max(...infos.map((info2) => info2.alias.length));
  for (const info2 of infos) {
    const icon = info2.isActive ? icons.active : icons.inactive;
    const name = info2.isActive ? source_default.green.bold(info2.alias) : info2.alias;
    const paddedName = name + " ".repeat(Math.max(0, maxAliasLen - info2.alias.length));
    const type = formatType(info2.authMode);
    const plan = formatPlan(info2.plan);
    const email = info2.email ? source_default.dim(info2.email) : "";
    const apiProvider = info2.apiProvider ? `  ${source_default.dim(info2.apiProvider)}` : "";
    const linkedClient = info2.linkedClient ? `  ${source_default.dim(`· ${info2.linkedClient}`)}` : "";
    const model2 = info2.defaultModel ? `  ${source_default.dim(info2.defaultModel)}` : "";
    const usage2 = formatUsage(info2.usage, info2.usageNote);
    const balance = formatBalance(info2.balance);
    const quota = usage2 || balance;
    const age = quota && info2.quotaAt && Date.now() - info2.quotaAt >= 60000 ? source_default.dim(` · ${formatAge(Date.now() - info2.quotaAt)}`) : "";
    const quotaStr = quota ? `  ${quota}${age}` : "";
    console.log(`  ${icon} ${paddedName}  ${type}  ${plan}  ${email}${apiProvider}${linkedClient}${model2}${quotaStr}`);
  }
}
async function getClaudeAccountInfo(entry, activeProfile, withUsage) {
  if (entry.target.provider !== "claude")
    throw new Error("Not a claude alias");
  const profileName = entry.target.profileName;
  const isActive = activeProfile === profileName;
  const info2 = {
    alias: entry.alias,
    provider: "claude",
    email: null,
    plan: null,
    authMode: "oauth",
    apiProvider: null,
    defaultModel: null,
    isActive,
    usage: null,
    usageNote: null,
    balance: null,
    status: "configured"
  };
  try {
    const profileData = await readJson(claudeProfileDataFile(profileName), { type: "oauth" });
    info2.authMode = profileData.type;
    info2.defaultModel = profileData.type === "api-key" ? profileData.model ?? null : profileData.defaultModel ?? null;
    if (profileData.type === "local-cliproxyapi") {
      const status = await inspectManagedCLIProxyAPI({
        profileId: profileData.profileId,
        binaryPath: profileData.binaryPath
      });
      const upstream = profileData.upstream ?? "codex";
      const prefix = upstream === "codex" ? "CLIProxyAPI" : `CLIProxyAPI · ${CLI_PROXY_API_UPSTREAMS[upstream].label}`;
      info2.apiProvider = status.loggedIn ? !status.environmentValid ? `${prefix} · invalid private env` : !status.configured ? `${prefix} · invalid config` : status.running ? `${prefix} · running` : `${prefix} · stopped` : `${prefix} · login required`;
      if (upstream !== "codex") {
        try {
          info2.defaultModel = await resolveManagedLocalCLIProxyAPIDefaultModel(profileData);
        } catch {}
      }
      info2.usageNote = "quota unavailable";
      if (!status.loggedIn)
        info2.status = "login-required";
    } else if (profileData.type === "api-key" && profileData.apiKey) {
      info2.plan = maskKey(profileData.apiKey);
      if (withUsage && profileData.baseUrl) {
        info2.balance = await fetchRelayBalance(profileData.baseUrl, profileData.apiKey);
      }
    } else if (profileData.type === "api-key") {
      info2.status = "missing-credential";
    } else {
      const account = await readJson(claudeProfileAccountFile(profileName), null);
      info2.email = account?.emailAddress ?? null;
      if (withUsage) {
        const result2 = await fetchClaudeUsage(profileName, isActive);
        info2.usage = result2.usage;
        info2.usageNote = result2.note;
      }
      const creds = await readFreshestOAuthCredentials(profileName, isActive);
      info2.plan = creds?.claudeAiOauth?.subscriptionType ?? null;
      if (!creds?.claudeAiOauth)
        info2.status = "missing-credential";
    }
  } catch {
    info2.status = "missing-profile";
  }
  return info2;
}
async function getCodexAccountInfo(entry, codexReg, withUsage, codexUsageFetcher, inspectCredentials) {
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
      apiProvider: null,
      defaultModel: null,
      isActive,
      usage: null,
      usageNote: null,
      balance: null,
      status: "missing-profile"
    };
  }
  const info2 = {
    alias: entry.alias,
    provider: "codex",
    email: account.email || null,
    plan: account.plan ?? null,
    authMode: account.auth_mode ?? "chatgpt",
    apiProvider: account.auth_mode === "apikey" ? account.api_provider?.type === "custom" ? account.api_provider.name : "official" : null,
    defaultModel: resolveCodexModel(account.default_model, account.api_provider?.model ?? null),
    isActive,
    usage: null,
    usageNote: null,
    balance: null,
    status: "configured"
  };
  let serverPlan = null;
  let auth = null;
  if (withUsage) {
    if (account.auth_mode === "apikey") {
      const baseUrl2 = account.api_provider?.base_url;
      if (baseUrl2) {
        auth = await readAccountAuth(accountKey);
        if (auth?.OPENAI_API_KEY) {
          info2.balance = await fetchRelayBalance(baseUrl2, auth.OPENAI_API_KEY);
        }
      }
    } else {
      const result2 = await codexUsageFetcher(accountKey, isActive);
      info2.usage = result2.usage;
      info2.usageNote = result2.note;
      serverPlan = result2.plan ?? null;
    }
  }
  if (account.auth_mode !== "apikey" || inspectCredentials) {
    info2.plan = serverPlan ?? info2.plan;
    auth ??= await readAccountAuth(accountKey);
    if (auth?.auth_mode === "chatgpt") {
      info2.plan = serverPlan ?? decodeCodexPlan(auth.tokens) ?? info2.plan;
    }
  }
  if (inspectCredentials) {
    const hasCredential = auth?.auth_mode === "apikey" ? Boolean(auth.OPENAI_API_KEY) : auth?.auth_mode === "chatgpt" && Boolean(auth.tokens?.access_token);
    if (!hasCredential)
      info2.status = "missing-credential";
  }
  return info2;
}
function isWellFormedJsonAlias(value) {
  if (!value || typeof value !== "object")
    return false;
  const entry = value;
  if (typeof entry.alias !== "string" || entry.alias.length === 0 || /[\u0000-\u001f\u007f]/.test(entry.alias)) {
    return false;
  }
  if (!entry.target || typeof entry.target !== "object")
    return false;
  const target = entry.target;
  if (target.provider === "claude") {
    return isSafePathSegment(target.profileName);
  }
  if (target.provider === "codex") {
    return typeof target.accountKey === "string" && target.accountKey.length > 0 && target.accountKey.length <= 1024;
  }
  if (target.provider === "opencode") {
    return typeof target.profileId === "string" && /^go-[0-9a-f-]{36}$/i.test(target.profileId);
  }
  return false;
}
function isSafePathSegment(value) {
  return typeof value === "string" && value.length > 0 && value !== "." && value !== ".." && !/[\\/:\u0000]/.test(value);
}
var SAFE_PLANS = new Set([
  "max",
  "pro",
  "plus",
  "team",
  "business",
  "enterprise",
  "edu",
  "free",
  "go"
]);
function safePlan(plan, authMode) {
  if (authMode === "api-key" || authMode === "apikey")
    return null;
  if (typeof plan !== "string")
    return null;
  const normalized = plan.trim().toLowerCase();
  return SAFE_PLANS.has(normalized) ? normalized : null;
}
function safeDefaultModel(model2) {
  if (typeof model2 !== "string" || model2.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/.test(model2) || /api[-_]?key|secret|token|credential|bearer|^(?:sk|gh[pousr]|xox[baprs])[-_]/i.test(model2)) {
    return null;
  }
  return model2;
}
function safeAuthMode(provider, authMode) {
  const allowed = {
    claude: ["oauth", "api-key", "local-cliproxyapi"],
    codex: ["chatgpt", "apikey"],
    opencode: ["subscription"]
  };
  if (allowed[provider]?.includes(authMode)) {
    return authMode;
  }
  if (authMode === "missing credential")
    return "missing-credential";
  if (authMode === "missing profile")
    return "missing-profile";
  return "unknown";
}
function safePercent(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}
function safeTimestamp(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
function safeMoney(value) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1e9 ? value : null;
}
function toJsonListAccount(info2) {
  return {
    alias: info2.alias,
    provider: info2.provider,
    authMode: safeAuthMode(info2.provider, info2.authMode),
    plan: safePlan(info2.plan, info2.authMode),
    defaultModel: safeDefaultModel(info2.defaultModel),
    isActive: info2.isActive,
    status: info2.status,
    usage: info2.usage ? {
      fiveHourUsedPercent: safePercent(info2.usage.fiveHourUsedPercent),
      fiveHourResetsAt: safeTimestamp(info2.usage.fiveHourResetsAt),
      weeklyUsedPercent: safePercent(info2.usage.weeklyUsedPercent),
      weeklyResetsAt: safeTimestamp(info2.usage.weeklyResetsAt),
      monthlyUsedPercent: safePercent(info2.usage.monthlyUsedPercent),
      monthlyResetsAt: safeTimestamp(info2.usage.monthlyResetsAt)
    } : null,
    balance: info2.balance ? {
      key: info2.balance.key ? {
        remainingUsd: safeMoney(info2.balance.key.remainingUsd),
        usedUsd: safeMoney(info2.balance.key.usedUsd),
        unlimited: info2.balance.key.unlimited === true
      } : null,
      account: info2.balance.account ? {
        remainingUsd: safeMoney(info2.balance.account.remainingUsd),
        usedUsd: safeMoney(info2.balance.account.usedUsd),
        unlimited: info2.balance.account.unlimited === true
      } : null
    } : null
  };
}
function compareJsonAccounts(left, right) {
  if (left.provider !== right.provider) {
    return left.provider < right.provider ? -1 : 1;
  }
  if (left.alias === right.alias)
    return 0;
  return left.alias < right.alias ? -1 : 1;
}
async function persistDisplayedCodexPlans(entries, infos, registry) {
  if (!registry)
    return;
  const latestRegistry = await loadRegistry();
  let changed = false;
  entries.forEach((entry, index) => {
    if (entry.target.provider !== "codex")
      return;
    const accountKey = entry.target.accountKey;
    const account = latestRegistry.accounts.find((candidate) => candidate.account_key === accountKey);
    const plan = infos[index]?.plan ?? null;
    if (!account || account.auth_mode === "apikey" || !plan)
      return;
    if (account.plan !== plan) {
      account.plan = plan;
      changed = true;
    }
  });
  if (changed)
    await saveRegistry(latestRegistry);
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
  success2(`${source_default.bold(aliasName)} alias removed`);
  blank();
}

// src/commands/rename.ts
async function rename11(currentAlias, nextAlias) {
  blank();
  const reg = await loadAliases();
  const entry = findAlias(reg, currentAlias);
  if (!entry) {
    error(`Alias "${currentAlias}" not found.`);
    blank();
    process.exit(1);
  }
  const rejection = checkAlias(reg, nextAlias, { ignoreAlias: currentAlias });
  if (rejection) {
    error(describeAliasRejection(rejection, nextAlias));
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
  success2(`${source_default.bold(currentAlias)} renamed to ${source_default.bold(nextAlias)}`);
  blank();
}

// src/accounts/purge.ts
import { rm as rm10, unlink as unlink6 } from "fs/promises";
async function planPurge(aliasName) {
  const reg = await loadAliases();
  const entry = findAlias(reg, aliasName);
  if (!entry) {
    throw new Error(`Alias "${aliasName}" not found`);
  }
  return {
    entry,
    linkedAliases: findAliasesByTarget(reg, entry.target).map((a) => a.alias)
  };
}
async function purgeAccount(aliasName) {
  const plan = await planPurge(aliasName);
  const { entry } = plan;
  if (entry.target.provider !== "claude") {
    await purgeLinkedClaudeProfile(entry.target);
  }
  if (entry.target.provider === "claude") {
    if (await profileExists(entry.target.profileName)) {
      await removeProfile(entry.target.profileName);
    }
  } else if (entry.target.provider === "opencode") {
    await removeOpenCodeProfile(entry.target.profileId);
  } else {
    try {
      const codexReg = await loadRegistry();
      const removed = removeAccountFromRegistry(codexReg, entry.target.accountKey);
      if (removed) {
        await saveRegistry(codexReg);
      }
      const authFile2 = codexAccountAuthFile(entry.target.accountKey);
      if (await fileExists(authFile2)) {
        await unlink6(authFile2);
      }
      await rm10(codexRunHome(entry.target.accountKey), {
        recursive: true,
        force: true
      });
    } catch {}
  }
  await removeAliasesByTarget(entry.target);
  return plan;
}

// src/commands/purge.ts
async function purge(aliasName) {
  blank();
  let plan;
  try {
    plan = await planPurge(aliasName);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
  const { linkedAliases } = plan;
  const aliasLabel = linkedAliases.length === 1 ? `This will also remove alias "${aliasName}".` : `This will also remove ${linkedAliases.length} aliases: ${linkedAliases.join(", ")}.`;
  const ok = await esm_default2({
    message: `Purge ${formatProvider(plan.entry.target.provider)} account "${aliasName}"? ${aliasLabel}`,
    default: false
  });
  if (!ok) {
    console.log(source_default.dim("  Cancelled"));
    blank();
    return;
  }
  try {
    await purgeAccount(aliasName);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
  blank();
  success2(`${source_default.bold(aliasName)} account purged`);
  blank();
}

// src/commands/current.ts
async function current2() {
  const aliasReg = await loadAliases();
  const claudeState = await readState2();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {}
  const openCodeState = await readOpenCodeState();
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
  if (openCodeState.active) {
    const alias = aliasReg.aliases.find((a) => a.target.provider === "opencode" && a.target.profileId === openCodeState.active);
    const displayName = alias ? alias.alias : openCodeState.active;
    console.log(`  ${formatProvider("opencode")}: ${source_default.green.bold(displayName)}`);
    found = true;
  }
  if (!found) {
    console.log(source_default.dim("  No active accounts"));
    hint(`Run ${source_default.cyan("claudex-switch add <alias>")} to create one`);
  }
  blank();
}

// src/commands/import.ts
import { readdir as readdir7 } from "fs/promises";
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
    success2(`Imported ${imported} account(s)`);
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
  const entries = await readdir7(CLAUDE_PROFILES_DIR, { withFileTypes: true });
  const linked = await linkedClaudeProfileNames();
  for (const entry of entries) {
    if (!entry.isDirectory())
      continue;
    const name = entry.name;
    if (linked.has(name))
      continue;
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
import { spawn as spawn10 } from "child_process";
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
  } else if (entry.target.provider === "codex") {
    await refreshCodex(entry.alias, entry.target.accountKey);
  } else {
    await refreshOpenCode(entry.alias, entry.target.profileId);
  }
}
async function refreshOpenCode(alias, profileId) {
  if (!await openCodeProfileExists(profileId)) {
    error("OpenCode Go profile no longer exists.");
    hint("The underlying profile may have been purged.");
    blank();
    process.exit(1);
  }
  const openCodeVersion = detectOpenCodeVersion();
  if (!openCodeVersion) {
    error("Could not detect a supported OpenCode version on PATH.");
    hint("Install OpenCode 1.x or 2.x, then retry.");
    blank();
    process.exit(1);
    return;
  }
  if (!isSupportedOpenCodeVersion(openCodeVersion)) {
    error(`OpenCode ${openCodeVersion.raw} is not supported by this version of claudex-switch.`);
    hint("Supported OpenCode major versions are 1.x and 2.x.");
    blank();
    process.exit(1);
    return;
  }
  if ((await getOpenCodeProfileData(profileId)).console && openCodeVersion.major !== 2) {
    error("OpenCode subscription accounts require OpenCode 2.x.");
    process.exit(1);
    return;
  }
  if (openCodeVersion.major === 2) {
    const profile = await getOpenCodeProfileData(profileId);
    if (profile.console) {
      try {
        info(`Sign in again as ${profile.console.email} and authorize ${profile.console.orgName}.`);
        await loginOpenCodeConsole(profileId, profile);
        await setActiveOpenCodeProfile(profileId);
        success2(`${source_default.bold(alias)} OpenCode subscription reconnected`);
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
      blank();
      return;
    }
    const previousKey2 = await readOpenCodeGoApiKey(profileId);
    if (!previousKey2) {
      error("This profile has no saved OpenCode Go API key to replace.");
      hint("Add the account again with OpenCode V2 before trying to refresh it.");
      blank();
      process.exit(1);
      return;
    }
    info(`Replace the OpenCode Go API key for ${source_default.bold(alias)}.`);
    hint("The key stays in claudex-switch's private profile. OpenCode terminal tools may inherit process environment variables.");
    blank();
    const trimmedKey = await resolveOpenCodeV2Key({
      message: "New OpenCode Go API key",
      previousKey: previousKey2
    });
    try {
      await saveOpenCodeGoCredential(profileId, { type: "api", key: trimmedKey });
    } catch (err) {
      error(`Could not save the replacement OpenCode Go key: ${err instanceof Error ? err.message : String(err)}`);
      blank();
      process.exit(1);
      return;
    }
    await setActiveOpenCodeProfile(profileId);
    success2(`${source_default.bold(alias)} OpenCode Go key replaced`);
    blank();
    return;
  }
  info(`Opening OpenCode TUI for ${source_default.bold(alias)}...`);
  hint("Use /connect → OpenCode Go to replace or repair this account's credential, then exit the TUI.");
  blank();
  const previousKey = await readOpenCodeGoApiKey(profileId);
  const exitCode = await runOpenCodeTui(profileId);
  const refreshedKey = await readOpenCodeGoApiKey(profileId);
  if (exitCode !== 0 || !refreshedKey || refreshedKey === previousKey) {
    error(refreshedKey === previousKey ? "OpenCode Go setup finished without changing the saved key; the profile was not refreshed." : "OpenCode Go login failed, was cancelled, or did not save a new credential.");
    blank();
    process.exit(1);
    return;
  }
  await setActiveOpenCodeProfile(profileId);
  success2(`${source_default.bold(alias)} OpenCode Go credential refreshed`);
  blank();
}
async function refreshClaude(alias, profileName) {
  if (!await profileExists(profileName)) {
    error(`Claude profile "${profileName}" no longer exists.`);
    hint("The underlying profile may have been removed.");
    blank();
    process.exit(1);
  }
  const profile = await getProfileData(profileName);
  if (profile.type === "local-cliproxyapi") {
    await refreshLocalCLIProxyAPI(alias, profileName, profile);
    return;
  }
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
  success2(`Refreshed ${source_default.bold(alias)}  ${formatProvider("claude")}  ${formatType("oauth")}  ${label}${email}`);
  blank();
}
async function refreshLocalCLIProxyAPI(alias, profileName, profile) {
  if (!profile.authIdentity) {
    error("This local CLIProxyAPI account has no saved identity fingerprint and cannot be safely refreshed.");
    hint("Remove and add it again to create a new isolated local login.");
    blank();
    process.exit(1);
  }
  const upstream = CLI_PROXY_API_UPSTREAMS[profile.upstream ?? "codex"];
  if (!upstream.loginFlag && !isSubscriptionUpstream(profile.upstream)) {
    error(`${upstream.label} uses the key of its own alias; refresh that alias instead.`);
    blank();
    process.exit(1);
  }
  info(`Opening ${upstream.label} login for ${source_default.bold(alias)}...`);
  blank();
  let login;
  try {
    login = await runManagedCLIProxyAPILogin({ profileId: profile.profileId, binaryPath: profile.binaryPath }, undefined, profile.authIdentity);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
  if (!login?.success || !login.identity) {
    error(login?.identityMismatch ? `${upstream.label} login completed for a different account; the existing local account was left unchanged.` : `CLIProxyAPI ${upstream.label} login failed or was cancelled; the existing local account was left unchanged.`);
    blank();
    process.exit(1);
  }
  await updateLocalCLIProxyAPIProfileIdentity(profileName, login.identity);
  if ((await readState2()).active === profileName) {
    await switchProfile(profileName);
  }
  success2(`Refreshed ${source_default.bold(alias)}  ${formatProvider("claude")}  ${formatType("local-cliproxyapi")}`);
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
  info(`Opening Codex login for ${source_default.bold(alias)}...`);
  blank();
  let loginResult;
  try {
    loginResult = await runIsolatedCodexLogin();
  } catch (err) {
    blank();
    error(`Failed to start Codex login: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  }
  if (loginResult.exitCode !== 0) {
    blank();
    error("Codex login failed or was cancelled.");
    blank();
    process.exit(1);
  }
  const auth = loginResult.auth;
  if (!auth || auth.auth_mode !== "chatgpt" || !auth.tokens) {
    blank();
    error("Could not read Codex auth after login.");
    blank();
    process.exit(1);
  }
  const tokenInfo = decodeIdToken(auth.tokens.id_token);
  const email = tokenInfo?.email ?? account.email ?? "unknown";
  const userId = tokenInfo?.chatgpt_user_id ?? "unknown";
  const accountId = tokenInfo?.chatgpt_account_id ?? auth.tokens.account_id ?? "unknown";
  const refreshedKey = `${userId}::${accountId}`;
  const wasActive = reg.active_account_key === accountKey;
  let oldKey = null;
  if (refreshedKey !== accountKey) {
    const savedEmail = account.email?.toLowerCase();
    const refreshedEmail = tokenInfo?.email?.toLowerCase();
    if (!savedEmail || !refreshedEmail || savedEmail !== refreshedEmail) {
      blank();
      error(`Codex login completed for a different account (${email}).`);
      hint(`Retry and sign in as ${source_default.cyan(account.email || alias)}.`);
      blank();
      process.exit(1);
    }
    info(`Account key changed for ${source_default.bold(email)} (org/team change detected). Migrating...`);
    oldKey = accountKey;
    accountKey = refreshedKey;
    account.account_key = refreshedKey;
    account.chatgpt_user_id = userId;
    account.chatgpt_account_id = accountId;
  }
  await saveAccountAuth(accountKey, auth);
  account.email = tokenInfo?.email ?? account.email;
  account.chatgpt_user_id = userId;
  account.chatgpt_account_id = accountId;
  account.plan = tokenInfo?.plan_type ?? account.plan;
  account.auth_mode = "chatgpt";
  if (wasActive) {
    await switchToAccount(accountKey);
    await applyCodexApiProvider(null, undefined, account.default_model);
    setActiveAccount(reg, accountKey);
  }
  await saveRegistry(reg);
  if (oldKey) {
    await updateAlias(alias, { provider: "codex", accountKey });
    await removeAccountAuthFile(oldKey);
  }
  success2(`Refreshed ${source_default.bold(alias)}  ${formatProvider("codex")}  ${formatPlan(account.plan ?? null)}  ${source_default.dim(account.email || "")}`);
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
  const env3 = browserScript ? { ...process.env, BROWSER: browserScript } : undefined;
  try {
    const proc = spawn10(command, args, { stdio: "inherit", env: env3 });
    return await new Promise((resolve3, reject) => {
      proc.on("close", resolve3);
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
import { realpathSync as realpathSync2 } from "fs";
import { join as join18 } from "path";
import { spawnSync as spawnSync8 } from "child_process";
// package.json
var package_default = {
  name: "claudex-switch",
  version: "1.26.3",
  description: "Local CLI account switcher and quota viewer for Claude Code, Codex, and OpenCode Go",
  type: "module",
  bin: {
    "claudex-switch": "./dist/claudex-switch.js"
  },
  files: ["dist", "scripts/guard-package-manager.js", "LICENSE", "COMMERCIAL-LICENSING.md", "THIRD-PARTY-NOTICES.md"],
  scripts: {
    build: "bun build ./src/index.ts --target node --outfile ./dist/claudex-switch.js",
    "build:binary": "bun build ./src/index.ts --compile --outfile ./dist/claudex-switch",
    "build:release": "./scripts/build-release-assets.sh ./release",
    dev: "bun run src/index.ts",
    preinstall: "node ./scripts/guard-package-manager.js",
    test: "bun test",
    "test:opencode-v2-private": "node scripts/verify-opencode-v2-private-store.mjs",
    "test:opencode-subscription": "bun scripts/verify-opencode-subscription.ts",
    "docs:check": "node ./scripts/validate-docs.mjs",
    verify: "bun run docs:check && bun run test && bun run build && bun ./dist/claudex-switch.js help >/dev/null",
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
  keywords: ["claude-code", "codex-cli", "opencode-go", "account-switcher", "quota-viewer", "cli", "bun", "typescript"],
  license: "SEE LICENSE IN LICENSE",
  engines: {
    bun: ">=1.3.5"
  },
  dependencies: {
    "@inquirer/prompts": "^7.5.0",
    "@magpie-community/opencode-cursor-auth": "0.2.19",
    "@magpie-community/opencode-workbuddy-auth": "0.1.30",
    chalk: "^5.4.1"
  },
  devDependencies: {
    "@types/bun": "^1.2.0",
    typescript: "^5.7.0"
  }
};

// src/lib/update.ts
var REPO = "Holden-Lin/claudex-switch";
var LATEST_RELEASE_URL = `https://github.com/${REPO}/releases/latest`;
var LATEST_RELEASE_API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
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
  const match = url.match(/\/tag\/(v?[^/?#]+)\/?$/);
  return match ? normalizeVersion(match[1]) : null;
}
function extractVersionFromReleaseApiPayload(payload) {
  if (!payload || typeof payload !== "object")
    return null;
  const tagName = payload.tag_name;
  return typeof tagName === "string" && tagName.length > 0 ? normalizeVersion(tagName) : null;
}
async function fetchLatestReleaseVersion(fetchImpl = fetch) {
  const headers = { "user-agent": "claudex-switch" };
  try {
    const response = await fetchImpl(LATEST_RELEASE_URL, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(2500)
    });
    if (response.ok) {
      const version = extractVersionFromReleaseUrl(response.url);
      if (version)
        return version;
    }
  } catch {}
  try {
    const response = await fetchImpl(LATEST_RELEASE_API_URL, {
      headers: {
        ...headers,
        accept: "application/vnd.github+json"
      },
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok)
      return null;
    return extractVersionFromReleaseApiPayload(await response.json());
  } catch {
    return null;
  }
}
function detectInstallMethod(argv = process.argv, execPath = process.execPath, runCommand = spawnSync8) {
  const brewPrefix = readCommandStdout(runCommand("brew", ["--prefix"], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"]
  }));
  const cliPath = resolveCliPath(argv, execPath);
  const realCliPath = resolveRealPath(cliPath);
  if (brewPrefix && (pathStartsWith(cliPath, brewPrefix) || pathStartsWith(realCliPath, brewPrefix))) {
    return "brew";
  }
  const bunCheck = runCommand("bun", ["--version"], {
    stdio: ["ignore", "ignore", "ignore"]
  });
  if (bunCheck.status === 0 && !bunCheck.error) {
    const bunGlobalBin = readCommandStdout(runCommand("bun", ["pm", "bin", "-g"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }));
    if (bunGlobalBin && (pathStartsWith(cliPath, bunGlobalBin) || pathStartsWith(realCliPath, bunGlobalBin) || realCliPath === resolveRealPath(join18(bunGlobalBin, "claudex-switch")))) {
      return "bun";
    }
  }
  return null;
}
function detectUnsupportedInstallMethod(argv, execPath, runCommand) {
  const cliPath = resolveCliPath(argv, execPath);
  const realCliPath = resolveRealPath(cliPath);
  const npmCheck = runCommand("npm", ["--version"], {
    stdio: ["ignore", "ignore", "ignore"]
  });
  if (npmCheck.status === 0 && !npmCheck.error) {
    const npmPrefix = readCommandStdout(runCommand("npm", ["prefix", "-g"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }));
    const npmRoot = readCommandStdout(runCommand("npm", ["root", "-g"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }));
    const npmBin = npmPrefix ? `${npmPrefix.replace(/\/$/, "")}/bin` : "";
    if (npmBin && (pathStartsWith(cliPath, npmBin) || pathStartsWith(realCliPath, npmBin)) || npmRoot && (pathStartsWith(cliPath, npmRoot) || pathStartsWith(realCliPath, npmRoot))) {
      return "npm";
    }
  }
  return null;
}
function pathStartsWith(path, prefix) {
  if (!path)
    return false;
  return path === prefix || path.startsWith(`${prefix.replace(/\/$/, "")}/`);
}
function resolveRealPath(path) {
  if (!path)
    return null;
  try {
    return realpathSync2(path);
  } catch {
    return path;
  }
}
async function checkForLatestUpdate(options = {}, settings = {}) {
  const argv = options.argv ?? process.argv;
  const env3 = options.env ?? process.env;
  const execPath = options.execPath ?? process.execPath;
  const fetchLatestVersion = options.fetchLatestVersion ?? fetchLatestReleaseVersion;
  const runCommand = options.runCommand ?? spawnSync8;
  const respectDisableEnv = settings.respectDisableEnv ?? true;
  if (respectDisableEnv && (env3[SKIP_AUTO_UPDATE_ENV] === "1" || env3[DISABLE_AUTO_UPDATE_ENV] === "1")) {
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
      latestVersion,
      unsupportedInstallMethod: detectUnsupportedInstallMethod(argv, execPath, runCommand) ?? undefined
    };
  }
  return {
    status: "available",
    currentVersion: CURRENT_VERSION,
    latestVersion,
    installMethod,
    argv,
    env: env3,
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
function createUpdateEnv(env3) {
  return {
    ...env3,
    [SKIP_AUTO_UPDATE_ENV]: "1"
  };
}
function updateWithHomebrew(runCommand, env3) {
  const result2 = runCommand("brew", ["install", "--formula", HOMEBREW_FORMULA_URL], {
    env: env3,
    stdio: "inherit"
  });
  return result2.status === 0 && !result2.error;
}
function updateWithBun(version, runCommand, env3) {
  const installArgs = [
    "install",
    "-g",
    `${BUN_INSTALL_SPEC}#v${normalizeVersion(version)}`
  ];
  const remove2 = runCommand("bun", ["remove", "-g", "claudex-switch"], {
    env: env3,
    stdio: "inherit"
  });
  if (remove2.status !== 0 || remove2.error) {
    return false;
  }
  const install = runCommand("bun", installArgs, {
    env: env3,
    stdio: "inherit"
  });
  return install.status === 0 && !install.error;
}
function readCommandStdout(result2) {
  return typeof result2.stdout === "string" ? result2.stdout.trim() : "";
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
  const result2 = await checkForLatestUpdate({}, {
    respectDisableEnv: false
  });
  switch (result2.status) {
    case "available": {
      info(`Updating claudex-switch from v${result2.currentVersion} to v${result2.latestVersion}`);
      hint("Running self-update...");
      const installed = installLatestUpdate(result2);
      if (!installed.ok) {
        blank();
        error("Update failed.");
        hint(`If this install is managed externally, reinstall it manually or retry ${source_default.cyan("claudex-switch update")}.`);
        blank();
        process.exit(1);
      }
      success2(`Updated to v${result2.latestVersion}`);
      blank();
      return;
    }
    case "up-to-date":
      info(`claudex-switch is already up to date (v${result2.currentVersion})`);
      blank();
      return;
    case "unsupported":
      if (result2.unsupportedInstallMethod === "npm") {
        error("This claudex-switch command is installed through npm/nvm, which is not supported.");
        hint(`Reinstall with the installer script or ${source_default.cyan("bun install -g git+https://github.com/Holden-Lin/claudex-switch.git")}.`);
      } else {
        error("Could not determine how this claudex-switch install was installed.");
        hint("Automatic update currently supports Bun and Homebrew installs.");
      }
      blank();
      process.exit(1);
    case "unavailable":
      error("Could not determine the latest release version.");
      hint("Check your network connection and GitHub Release availability.");
      blank();
      process.exit(1);
    case "disabled":
      info(`claudex-switch is already up to date (v${result2.currentVersion})`);
      blank();
      return;
  }
}

// src/webconfig/server.ts
import { createServer as createServer3 } from "http";
import { randomBytes as randomBytes6, timingSafeEqual as timingSafeEqual2 } from "crypto";

// src/webconfig/page.ts
var PAGE = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>claudex-switch 配置</title>
<link rel="icon" href="data:,">
<style>
  :root {
    color-scheme: light dark;
    --bg: #f6f6f4;
    --surface: #ffffff;
    --border: #e2e0da;
    --text: #1d1c1a;
    --muted: #78746c;
    --accent: #b8552a;
    --accent-soft: #fdf1ea;
    --danger: #b3261e;
    --ok: #2f6f3e;
    --field-bg: #fbfbf9;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #17171a;
      --surface: #1f1f23;
      --border: #33333a;
      --text: #ececec;
      --muted: #9b968d;
      --accent: #e08b5f;
      --accent-soft: #2a211c;
      --danger: #f2837b;
      --ok: #7cc98d;
      --field-bg: #26262b;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0 16px 120px;
    background: var(--bg);
    color: var(--text);
    font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  }
  .wrap { max-width: 900px; margin: 0 auto; }
  header { padding: 28px 0 16px; }
  h1 { margin: 0; font-size: 19px; letter-spacing: .2px; }
  .sub { color: var(--muted); font-size: 13px; margin-top: 5px; }
  h2 {
    margin: 26px 0 10px; font-size: 12px; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
  }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; margin-bottom: 10px; overflow: hidden;
  }
  .card.dirty { border-color: var(--accent); }
  .card-head {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 12px 14px; cursor: pointer; user-select: none;
  }
  .card-head:hover { background: var(--accent-soft); }
  .caret { color: var(--muted); width: 10px; flex: none; font-size: 11px; }
  .alias { font-weight: 600; }
  .badge {
    font-size: 11px; color: var(--muted); border: 1px solid var(--border);
    border-radius: 20px; padding: 1px 8px; white-space: nowrap;
  }
  .badge.active { color: var(--ok); border-color: currentColor; }
  .badge.changed { color: var(--accent); border-color: currentColor; }
  .email { color: var(--muted); font-size: 12px; }
  .spacer { flex: 1 1 auto; }
  .card-body { padding: 4px 14px 16px; border-top: 1px solid var(--border); }
  .grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px; margin-top: 14px;
  }
  @media (max-width: 620px) { .grid { grid-template-columns: 1fr; } }
  .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .field label code { font-size: 11px; opacity: .75; }
  .row { display: flex; gap: 6px; }
  input, textarea, select {
    width: 100%; padding: 7px 9px; font: inherit; font-size: 13px;
    color: var(--text); background: var(--field-bg);
    border: 1px solid var(--border); border-radius: 6px;
  }
  input:focus, textarea:focus, select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  input:disabled { color: var(--muted); cursor: not-allowed; }
  textarea { resize: vertical; min-height: 68px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  button {
    font: inherit; font-size: 13px; padding: 7px 12px; cursor: pointer;
    border: 1px solid var(--border); border-radius: 6px;
    background: var(--surface); color: var(--text);
  }
  button:hover { border-color: var(--accent); color: var(--accent); }
  button.primary {
    background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600;
  }
  button.primary:hover { color: #fff; opacity: .9; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  button.icon { padding: 7px 9px; flex: none; }
  .section-label {
    margin: 18px 0 8px; font-size: 12px; color: var(--muted);
    display: flex; align-items: center; gap: 8px;
  }
  .env-row { display: flex; gap: 6px; margin-bottom: 6px; }
  .env-row input:first-child { flex: 0 0 42%; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  @media (max-width: 520px) {
    .env-row { flex-wrap: wrap; }
    .env-row input:first-child { flex: 1 1 100%; }
  }
  .hint { color: var(--muted); font-size: 12px; margin-top: 6px; }
  .err {
    color: var(--danger); font-size: 12px; margin-top: 10px;
    border-left: 2px solid currentColor; padding-left: 8px;
  }
  details.paste { margin-top: 18px; }
  details.paste summary { color: var(--muted); font-size: 12px; cursor: pointer; }
  details.paste .row { margin-top: 8px; }
  button.mini { padding: 4px 9px; font-size: 12px; }
  button.danger { color: var(--danger); border-color: var(--danger); }
  button.danger:hover { background: var(--danger); border-color: var(--danger); color: #fff; }
  button.confirm-delete { background: var(--danger); border-color: var(--danger); color: #fff; font-weight: 600; }
  button.confirm-delete:hover { color: #fff; opacity: .9; }
  .alias-input { width: 190px; padding: 4px 8px; font-size: 13px; font-weight: 600; }
  .section-head { display: flex; align-items: center; gap: 8px; }
  .card.new-card { border-color: var(--accent); }
  .new-card .card-head { cursor: default; }
  .new-card .card-head:hover { background: none; }
  .new-note {
    margin: 12px 0 0; padding: 8px 10px; border-radius: 6px;
    background: var(--accent-soft); color: var(--text); font-size: 12.5px;
  }
  .alias-wrap { display: inline-flex; align-items: center; gap: 3px; min-width: 0; }
  /* Icon-only affordances: no chrome until hovered, so the header stays quiet. */
  button.icon-btn {
    display: inline-flex; align-items: center; line-height: 0;
    padding: 3px; border-color: transparent; background: none;
    color: var(--muted); border-radius: 5px;
  }
  button.icon-btn:hover { color: var(--accent); border-color: transparent; background: none; }
  button.icon-btn.accept:hover { color: var(--ok); }
  button.icon-btn.reject:hover { color: var(--danger); }
  button.icon-btn svg { display: block; }
  .danger-panel {
    margin-top: 14px; padding: 12px 14px;
    border: 1px solid var(--danger); border-radius: 8px;
  }
  .danger-title { color: var(--danger); font-weight: 600; font-size: 13px; }
  .danger-facts { margin: 8px 0 12px; padding-left: 18px; color: var(--muted); font-size: 12.5px; }
  .danger-facts li { margin: 3px 0; }
  footer {
    position: fixed; left: 0; right: 0; bottom: 0;
    background: var(--surface); border-top: 1px solid var(--border);
    padding: 12px 16px;
  }
  .bar {
    max-width: 900px; margin: 0 auto; display: flex;
    align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .status { font-size: 13px; color: var(--muted); }
  .status.ok { color: var(--ok); }
  .status.bad { color: var(--danger); }
  .empty { color: var(--muted); padding: 24px 0; }
  button.add-account { color: var(--accent); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>claudex-switch 配置</h1>
    <div class="sub" id="sub">加载中…</div>
  </header>
  <div id="list"></div>
</div>
<footer>
  <div class="bar">
    <button class="primary" id="save" disabled>保存修改</button>
    <button id="reload">放弃改动并重新读取</button>
    <span class="status" id="status"></span>
  </div>
</footer>
<script>
(function () {
  "use strict";

  var token = new URL(location.href).searchParams.get("t") || "";
  // Keep the token out of the visible address bar, history and screenshots.
  history.replaceState(null, "", location.pathname);

  var FIELD_LABELS = {
    apiKey: ["API Key", "ANTHROPIC_API_KEY"],
    baseUrl: ["请求地址", "ANTHROPIC_BASE_URL"],
    authToken: ["Auth Token", "ANTHROPIC_AUTH_TOKEN"],
    model: ["主模型", "ANTHROPIC_MODEL"],
    defaultFableModel: ["Fable 映射", "ANTHROPIC_DEFAULT_FABLE_MODEL"],
    defaultOpusModel: ["Opus 映射", "ANTHROPIC_DEFAULT_OPUS_MODEL"],
    defaultSonnetModel: ["Sonnet 映射", "ANTHROPIC_DEFAULT_SONNET_MODEL"],
    defaultHaikuModel: ["Haiku 映射", "ANTHROPIC_DEFAULT_HAIKU_MODEL"],
    subagentModel: ["子代理模型", "CLAUDE_CODE_SUBAGENT_MODEL"],
    defaultModel: ["默认模型", ""],
    binaryPath: ["CLIProxyAPI 可执行文件", ""],
    providerType: ["Provider 类型", ""],
    providerName: ["Provider 名称", "model_providers"],
    envKey: ["环境变量名", "env_key"]
  };
  var CODEX_FIELD_LABELS = {
    baseUrl: ["请求地址", "base_url"],
    model: ["Provider 模型", "model"],
    apiKey: ["API Key", "OPENAI_API_KEY"]
  };
  var FIELD_ORDER = [
    "apiKey", "baseUrl", "authToken", "model",
    "defaultFableModel", "defaultOpusModel", "defaultSonnetModel",
    "defaultHaikuModel", "subagentModel",
    "defaultModel", "providerName", "envKey", "binaryPath"
  ];
  var ENV_TO_FIELD = {
    ANTHROPIC_API_KEY: "apiKey",
    ANTHROPIC_BASE_URL: "baseUrl",
    ANTHROPIC_AUTH_TOKEN: "authToken",
    ANTHROPIC_MODEL: "model",
    ANTHROPIC_DEFAULT_FABLE_MODEL: "defaultFableModel",
    ANTHROPIC_DEFAULT_OPUS_MODEL: "defaultOpusModel",
    ANTHROPIC_DEFAULT_SONNET_MODEL: "defaultSonnetModel",
    ANTHROPIC_DEFAULT_HAIKU_MODEL: "defaultHaikuModel",
    CLAUDE_CODE_SUBAGENT_MODEL: "subagentModel"
  };

  var snapshot = null;
  var drafts = {};
  var errors = {};
  var expanded = {};
  // Alias-level state for the two identity operations, which apply on their
  // own rather than through the batch save.
  var renaming = {};
  var pendingDelete = {};
  var busy = {};
  // Open "new account" forms, keyed by provider. Lazily created so a section
  // that was never opened holds no state.
  var newForms = {};

  var listEl = document.getElementById("list");
  var subEl = document.getElementById("sub");
  var saveEl = document.getElementById("save");
  var statusEl = document.getElementById("status");
  document.getElementById("reload").addEventListener("click", function () {
    load(true);
  });
  saveEl.addEventListener("click", save);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function iconPath(svg, d) {
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.7");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
  }

  function icon(name) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("aria-hidden", "true");
    if (name === "pencil") {
      iconPath(svg, "M11.1 2.3l2.6 2.6-8.3 8.3-3.3.7.7-3.3 8.3-8.3zM10.2 3.2l2.6 2.6");
    } else if (name === "check") {
      iconPath(svg, "M3 8.5l3.2 3.2L13 5");
    } else if (name === "plus") {
      iconPath(svg, "M8 3.2v9.6M3.2 8h9.6");
    } else {
      iconPath(svg, "M4 4l8 8M12 4l-8 8");
    }
    return svg;
  }

  function iconButton(name, title, className) {
    var button = el("button", "icon-btn" + (className ? " " + className : ""));
    button.type = "button";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.appendChild(icon(name));
    return button;
  }

  function api(path, options) {
    var opts = options || {};
    opts.headers = Object.assign({}, opts.headers, {
      authorization: "Bearer " + token
    });
    return fetch(path, opts).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) throw new Error(body && body.error ? body.error : "请求失败");
        return body;
      });
    });
  }

  function accounts() {
    if (!snapshot) return [];
    return snapshot.claude.concat(snapshot.codex);
  }

  function draftOf(account) {
    var draft = drafts[account.alias];
    if (!draft) {
      draft = {
        fields: Object.assign({}, account.fields),
        env: Object.keys(account.env).map(function (key) {
          return { key: key, value: account.env[key] };
        }),
        reveal: {}
      };
      drafts[account.alias] = draft;
    }
    return draft;
  }

  function envToObject(rows) {
    var out = {};
    rows.forEach(function (row) {
      var key = row.key.trim();
      if (key) out[key] = row.value;
    });
    return out;
  }

  function sameObject(a, b) {
    var ka = Object.keys(a);
    var kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(function (key) { return a[key] === b[key]; });
  }

  function isDirty(account) {
    var draft = draftOf(account);
    var fieldsChanged = Object.keys(account.fields).some(function (key) {
      return account.readonly.indexOf(key) < 0 &&
        (draft.fields[key] || "") !== (account.fields[key] || "");
    });
    if (fieldsChanged) return true;
    if (!account.supportsEnv) return false;
    return !sameObject(envToObject(draft.env), account.env);
  }

  function dirtyAccounts() {
    return accounts().filter(isDirty);
  }

  function refreshFooter() {
    var count = dirtyAccounts().length;
    saveEl.disabled = count === 0;
    saveEl.textContent = count > 0 ? "保存修改 (" + count + ")" : "保存修改";
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function fieldLabel(provider, key) {
    var entry = (provider === "codex" && CODEX_FIELD_LABELS[key]) ||
      FIELD_LABELS[key] || [key, ""];
    return entry;
  }

  // spec: what this form is (provider, which keys are secret/readonly).
  // entry: { key, kind, options, showWhen } describing one field.
  // draft: the live values ({ fields, reveal }) this renderer binds to.
  function buildField(spec, entry, draft, onChange) {
    var key = entry.key;
    var labels = fieldLabel(spec.provider, key);
    // Associate the label with its control: it is what makes the form usable
    // with a screen reader, and what lets a test address a field by its name.
    var inputId = "f-" + spec.scope + "-" + key;
    var wrap = el("div", "field");
    var label = el("label", null, labels[0]);
    label.htmlFor = inputId;
    if (labels[1]) {
      label.appendChild(document.createTextNode("  "));
      label.appendChild(el("code", null, labels[1]));
    }
    wrap.appendChild(label);

    var row = el("div", "row");
    var isSecret = spec.secretFields.indexOf(key) >= 0;

    if (entry.kind === "select") {
      var select = document.createElement("select");
      select.id = inputId;
      entry.options.forEach(function (option) {
        var node = document.createElement("option");
        node.value = option[0];
        node.textContent = option[1];
        select.appendChild(node);
      });
      select.value = draft.fields[key] || entry.options[0][0];
      select.addEventListener("change", function () {
        draft.fields[key] = select.value;
        onChange(entry);
      });
      row.appendChild(select);
      wrap.appendChild(row);
      return wrap;
    }

    var input = document.createElement("input");
    input.id = inputId;
    input.type = isSecret && !draft.reveal[key] ? "password" : "text";
    input.value = draft.fields[key] || "";
    input.autocomplete = "off";
    input.spellcheck = false;
    if (spec.readonly.indexOf(key) >= 0) input.disabled = true;
    input.addEventListener("input", function () {
      draft.fields[key] = input.value;
      onChange();
    });
    row.appendChild(input);

    if (isSecret) {
      var toggle = el("button", "icon", draft.reveal[key] ? "隐藏" : "显示");
      toggle.type = "button";
      toggle.addEventListener("click", function () {
        draft.reveal[key] = !draft.reveal[key];
        input.type = draft.reveal[key] ? "text" : "password";
        toggle.textContent = draft.reveal[key] ? "隐藏" : "显示";
      });
      row.appendChild(toggle);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function buildEnvSection(draft, rerender, onChange) {
    var box = document.createElement("div");
    var label = el("div", "section-label", "自定义环境变量");
    box.appendChild(label);

    draft.env.forEach(function (row, index) {
      var line = el("div", "env-row");
      var keyInput = document.createElement("input");
      keyInput.value = row.key;
      keyInput.placeholder = "CLAUDE_CODE_EFFORT_LEVEL";
      keyInput.autocomplete = "off";
      keyInput.spellcheck = false;
      keyInput.setAttribute("data-env-key", String(index));
      keyInput.addEventListener("input", function () {
        row.key = keyInput.value;
        onChange();
      });

      var valueInput = document.createElement("input");
      valueInput.value = row.value;
      valueInput.placeholder = "max";
      valueInput.autocomplete = "off";
      valueInput.spellcheck = false;
      valueInput.addEventListener("input", function () {
        row.value = valueInput.value;
        onChange();
      });

      var remove = el("button", "icon", "删除");
      remove.type = "button";
      remove.addEventListener("click", function () {
        draft.env.splice(index, 1);
        rerender();
      });

      line.appendChild(keyInput);
      line.appendChild(valueInput);
      line.appendChild(remove);
      box.appendChild(line);
    });

    var add = el("button", null, "+ 添加变量");
    add.type = "button";
    add.addEventListener("click", function () {
      draft.env.push({ key: "", value: "" });
      rerender({ env: draft.env.length - 1 });
    });
    box.appendChild(add);
    box.appendChild(el("div", "hint",
      "这些变量会写进该账号自己的配置；切换到别的账号时会被自动清理。"));
    return box;
  }

  // fieldKeys is the set of fixed fields this form owns; a pasted key that
  // matches one lands there, everything else becomes a custom env var.
  function buildPasteBox(draft, fieldKeys, rerender) {
    var details = el("details", "paste");
    details.appendChild(el("summary", null, "从 export 代码块粘贴导入"));

    var area = document.createElement("textarea");
    area.placeholder = "export ANTHROPIC_BASE_URL=https://api.example.com/anthropic\\nexport ANTHROPIC_MODEL=some-model";
    details.appendChild(area);

    var row = el("div", "row");
    var apply = el("button", null, "解析并填入");
    apply.type = "button";
    apply.addEventListener("click", function () {
      var parsed = parseExportBlock(area.value);
      var known = 0;
      var extra = 0;
      Object.keys(parsed).forEach(function (envKey) {
        var field = ENV_TO_FIELD[envKey];
        if (field && fieldKeys.indexOf(field) >= 0) {
          draft.fields[field] = parsed[envKey];
          known += 1;
          return;
        }
        var existing = draft.env.filter(function (r) { return r.key === envKey; })[0];
        if (existing) existing.value = parsed[envKey];
        else draft.env.push({ key: envKey, value: parsed[envKey] });
        extra += 1;
      });
      setStatus("已填入 " + known + " 个字段、" + extra + " 个自定义变量。");
      rerender();
    });
    row.appendChild(apply);
    details.appendChild(row);
    return details;
  }

  function parseExportBlock(text) {
    var out = {};
    text.split(/\\r?\\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === "#") return;
      if (line.indexOf("export ") === 0) line = line.slice(7).trim();
      var eq = line.indexOf("=");
      if (eq <= 0) return;
      var key = line.slice(0, eq).trim();
      var value = line.slice(eq + 1).trim();
      if (value.length > 1) {
        var first = value.charAt(0);
        var last = value.charAt(value.length - 1);
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
          value = value.slice(1, -1);
        }
      }
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) out[key.toUpperCase()] = value;
    });
    return out;
  }

  function buildHead(account) {
    var alias = account.alias;
    var head = el("div", "card-head");
    var renamingThis = Object.prototype.hasOwnProperty.call(renaming, alias);
    var open = expanded[alias] === true || pendingDelete[alias] === true;

    head.appendChild(el("span", "caret", open ? "▼" : "▶"));

    if (renamingThis) {
      var input = document.createElement("input");
      input.className = "alias-input";
      input.value = renaming[alias];
      input.setAttribute("aria-label", "别名");
      input.autocomplete = "off";
      input.spellcheck = false;
      input.addEventListener("input", function () {
        renaming[alias] = input.value;
      });
      input.addEventListener("click", function (event) {
        event.stopPropagation();
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          submitRename(account);
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancelRename(alias);
        }
      });
      head.appendChild(input);

      var accept = iconButton("check", "保存", "accept");
      accept.addEventListener("click", function (event) {
        event.stopPropagation();
        submitRename(account);
      });
      head.appendChild(accept);

      var reject = iconButton("reject", "取消", "reject");
      reject.addEventListener("click", function (event) {
        event.stopPropagation();
        cancelRename(alias);
      });
      head.appendChild(reject);
      // Keep the type badge next to the input; the spacer belongs at the end so
      // the row does not visibly come apart while the name is being edited.
      head.appendChild(el("span", "badge", account.label));
      head.appendChild(el("span", "spacer"));
      return head;
    }

    var aliasWrap = el("span", "alias-wrap");
    aliasWrap.appendChild(el("span", "alias", account.alias));
    if (pendingDelete[alias] !== true) {
      var pencil = iconButton("pencil", "修改别名");
      pencil.addEventListener("click", function (event) {
        event.stopPropagation();
        startRename(account);
      });
      aliasWrap.appendChild(pencil);
    }
    head.appendChild(aliasWrap);
    head.appendChild(el("span", "badge", account.label));
    if (account.isActive) head.appendChild(el("span", "badge active", "当前生效"));
    if (isDirty(account)) head.appendChild(el("span", "badge changed", "已修改"));
    if (account.email) head.appendChild(el("span", "email", account.email));
    head.appendChild(el("span", "spacer"));

    if (pendingDelete[alias] !== true) {
      var remove = el("button", "mini danger", "删除");
      remove.type = "button";
      remove.title = "删除账号（不可撤销）";
      remove.addEventListener("click", function (event) {
        event.stopPropagation();
        pendingDelete[alias] = true;
        expanded[alias] = true;
        rerenderCard(alias);
      });
      head.appendChild(remove);
    }

    head.addEventListener("click", function () {
      expanded[alias] = !open;
      rerenderCard(alias);
    });
    return head;
  }

  // What an existing account's card edits. Derived from the account so the card
  // and the new-account form can share one field renderer.
  function accountSpec(account) {
    return {
      scope: "card-" + account.alias,
      provider: account.provider,
      secretFields: account.secretFields,
      readonly: account.readonly,
      supportsEnv: account.supportsEnv,
      fields: FIELD_ORDER.filter(function (key) {
        return Object.prototype.hasOwnProperty.call(account.fields, key);
      }).map(function (key) { return { key: key }; })
    };
  }

  function isCustomCodexProvider(draft) {
    return (draft.fields.providerType || "official") === "custom";
  }

  function isOfficialCodexProvider(draft) {
    return (draft.fields.providerType || "official") !== "custom";
  }

  var NEW_ACCOUNT_SPECS = {
    claude: {
      scope: "new-claude",
      provider: "claude",
      title: "新增 Claude API Key 账号",
      note: "创建后会立即切为当前生效的 Claude 账号（与 CLI 的 add 一致）。",
      secretFields: ["apiKey", "authToken"],
      readonly: [],
      supportsEnv: true,
      fields: [
        { key: "apiKey" },
        { key: "baseUrl" },
        { key: "authToken" },
        { key: "model" },
        { key: "defaultFableModel" },
        { key: "defaultOpusModel" },
        { key: "defaultSonnetModel" },
        { key: "defaultHaikuModel" },
        { key: "subagentModel" }
      ]
    },
    codex: {
      scope: "new-codex",
      provider: "codex",
      title: "新增 Codex API Key 账号",
      note: "创建后会立即切为当前生效的 Codex 账号，并重写 ~/.codex/config.toml。",
      secretFields: ["apiKey"],
      readonly: [],
      supportsEnv: false,
      fields: [
        {
          key: "providerType",
          kind: "select",
          options: [
            ["official", "OpenAI 官方"],
            ["custom", "自定义中转（relay）"]
          ]
        },
        { key: "apiKey" },
        { key: "defaultModel", showWhen: isOfficialCodexProvider },
        { key: "providerName", showWhen: isCustomCodexProvider },
        { key: "baseUrl", showWhen: isCustomCodexProvider },
        { key: "model", showWhen: isCustomCodexProvider },
        { key: "envKey", showWhen: isCustomCodexProvider }
      ]
    }
  };

  function visibleFields(spec, draft) {
    return spec.fields.filter(function (entry) {
      return !entry.showWhen || entry.showWhen(draft);
    });
  }

  function newFormOf(provider) {
    var form = newForms[provider];
    if (form) return form;

    var spec = NEW_ACCOUNT_SPECS[provider];
    var fields = {};
    spec.fields.forEach(function (entry) {
      if (entry.kind === "select") fields[entry.key] = entry.options[0][0];
    });
    if (provider === "codex") {
      fields.defaultModel = (snapshot && snapshot.codexDefaultModel) || "";
      fields.envKey = "OPENAI_API_KEY";
    }

    form = {
      alias: "",
      fields: fields,
      env: [],
      reveal: {},
      error: null,
      busy: false
    };
    newForms[provider] = form;
    return form;
  }

  function openNewForm(provider) {
    newFormOf(provider);
    render();
  }

  function closeNewForm(provider) {
    delete newForms[provider];
    render();
  }

  function rerenderNewForm(provider, focus) {
    var current = listEl.querySelector('[data-new="' + cssEscape(provider) + '"]');
    if (!current) return render();
    var next = buildNewForm(provider);
    next.setAttribute("data-new", provider);
    current.replaceWith(next);
    if (focus && focus.env !== undefined) {
      var input = next.querySelector('[data-env-key="' + focus.env + '"]');
      if (input) input.focus();
    }
  }

  function buildNewForm(provider) {
    var spec = NEW_ACCOUNT_SPECS[provider];
    var form = newFormOf(provider);
    var card = el("div", "card new-card");

    var head = el("div", "card-head");
    head.appendChild(el("span", "alias", spec.title));
    head.appendChild(el("span", "spacer"));
    var cancelTop = el("button", "mini", "取消");
    cancelTop.type = "button";
    cancelTop.addEventListener("click", function () { closeNewForm(provider); });
    head.appendChild(cancelTop);
    card.appendChild(head);

    var body = el("div", "card-body");
    body.appendChild(el("div", "new-note", spec.note));

    var aliasField = el("div", "field");
    var aliasLabel = el("label", null, "别名");
    aliasLabel.htmlFor = "f-" + spec.scope + "-alias";
    aliasField.appendChild(aliasLabel);
    var aliasRow = el("div", "row");
    var aliasInput = document.createElement("input");
    aliasInput.id = "f-" + spec.scope + "-alias";
    aliasInput.value = form.alias;
    aliasInput.placeholder = "例如 deepseek";
    aliasInput.autocomplete = "off";
    aliasInput.spellcheck = false;
    aliasInput.addEventListener("input", function () {
      form.alias = aliasInput.value;
    });
    aliasRow.appendChild(aliasInput);
    aliasField.appendChild(aliasRow);
    body.appendChild(aliasField);

    var grid = el("div", "grid");
    visibleFields(spec, form).forEach(function (entry) {
      grid.appendChild(
        buildField(spec, entry, form, function (changed) {
          // Only a visibility-affecting change redraws; redrawing on every
          // keystroke would steal focus from the input being typed in.
          if (changed && changed.kind === "select") rerenderNewForm(provider);
        })
      );
    });
    body.appendChild(grid);

    if (spec.supportsEnv) {
      body.appendChild(
        buildEnvSection(
          form,
          function (focus) { rerenderNewForm(provider, focus); },
          function () {}
        )
      );
      body.appendChild(
        buildPasteBox(form, spec.fields.map(function (e) { return e.key; }), function () {
          rerenderNewForm(provider);
        })
      );
    }

    var actions = el("div", "row");
    actions.style.marginTop = "16px";
    var submit = el("button", "primary", form.busy ? "创建中…" : "创建账号");
    submit.type = "button";
    submit.disabled = form.busy;
    submit.addEventListener("click", function () { submitNewForm(provider); });
    actions.appendChild(submit);

    var cancelBottom = el("button", null, "取消");
    cancelBottom.type = "button";
    cancelBottom.addEventListener("click", function () { closeNewForm(provider); });
    actions.appendChild(cancelBottom);
    body.appendChild(actions);

    if (form.error) body.appendChild(el("div", "err", form.error));

    card.appendChild(body);
    return card;
  }

  function submitNewForm(provider) {
    var spec = NEW_ACCOUNT_SPECS[provider];
    var form = newFormOf(provider);
    if (form.busy) return;

    form.busy = true;
    form.error = null;
    rerenderNewForm(provider);

    var fields = {};
    visibleFields(spec, form).forEach(function (entry) {
      fields[entry.key] = form.fields[entry.key] || "";
    });
    // A relay's provider model doubles as the default model, the way
    // "claudex-switch add" sets both from the single model it prompts for.
    if (provider === "codex" && fields.providerType === "custom") {
      fields.defaultModel = fields.model || "";
    }

    var payload = { provider: spec.provider, alias: form.alias, fields: fields };
    if (spec.supportsEnv) payload.env = envToObject(form.env);

    api("/api/accounts/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (data) {
      form.busy = false;
      if (!data.ok) throw new Error(data.error || "创建失败");
      var created = form.alias.trim();
      delete newForms[provider];
      snapshot = data.snapshot;
      render();
      setStatus("已创建 " + created + "，并切为当前生效账号", "ok");
    }).catch(function (err) {
      form.busy = false;
      form.error = err.message;
      rerenderNewForm(provider);
    });
  }

  function buildCard(account) {
    var alias = account.alias;
    var card = el("div", "card" + (isDirty(account) ? " dirty" : ""));
    card.appendChild(buildHead(account));

    var open = expanded[alias] === true || pendingDelete[alias] === true;
    if (!open) return card;

    var body = el("div", "card-body");

    // A pending delete replaces the form entirely: this is a confirmation
    // state, and the form's fields are not what the user is being asked about.
    if (pendingDelete[alias] === true) {
      body.appendChild(buildDeletePanel(account));
      card.appendChild(body);
      return card;
    }

    var onChange = function () {
      refreshFooter();
      card.className = "card" + (isDirty(account) ? " dirty" : "");
    };
    var rerender = function (focus) {
      rerenderCard(account.alias, focus);
    };

    var spec = accountSpec(account);
    var draft = draftOf(account);
    var grid = el("div", "grid");
    spec.fields.forEach(function (entry) {
      grid.appendChild(buildField(spec, entry, draft, onChange));
    });
    body.appendChild(grid);

    if (spec.supportsEnv) {
      body.appendChild(buildEnvSection(draft, rerender, onChange));
      body.appendChild(
        buildPasteBox(draft, spec.fields.map(function (e) { return e.key; }), rerender)
      );
    } else {
      body.appendChild(el("div", "hint",
        "Codex 从 ~/.codex/config.toml 读取配置，不使用 Claude Code 的环境变量。"));
    }

    if (errors[account.alias]) {
      body.appendChild(el("div", "err", errors[account.alias]));
    }

    card.appendChild(body);
    return card;
  }

  function rerenderCard(alias, focus) {
    var account = accounts().filter(function (a) { return a.alias === alias; })[0];
    if (!account) return render();
    var current = listEl.querySelector('[data-alias="' + cssEscape(alias) + '"]');
    if (!current) return render();
    var next = buildCard(account);
    next.setAttribute("data-alias", alias);
    current.replaceWith(next);
    refreshFooter();

    if (focus && focus.alias === true) {
      var aliasInput = next.querySelector(".alias-input");
      if (aliasInput) {
        aliasInput.focus();
        aliasInput.select();
      }
    } else if (focus && focus.env !== undefined) {
      var input = next.querySelector('[data-env-key="' + focus.env + '"]');
      if (input) input.focus();
    }
  }

  function startRename(account) {
    // Only the flag is set here; the input itself is built by buildHead, so
    // there is exactly one construction site for it. The card deliberately does
    // not expand — the name is swapped in place.
    renaming[account.alias] = account.alias;
    rerenderCard(account.alias, { alias: true });
  }

  function cancelRename(alias) {
    delete renaming[alias];
    rerenderCard(alias);
  }

  function submitRename(account) {
    var alias = account.alias;
    // Re-entrancy guard: Enter held down would otherwise fire a second rename
    // against the alias the first one is already moving.
    if (busy[alias] === true) return;
    var next = (renaming[alias] || "").trim();

    if (!next || next === alias) {
      cancelRename(alias);
      return;
    }

    busy[alias] = true;
    api("/api/accounts/rename", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias: alias, newAlias: next })
    }).then(function (data) {
      delete busy[alias];
      if (!data.ok) throw new Error(data.error || "重命名失败");
      delete renaming[alias];
      delete drafts[alias];
      delete expanded[alias];
      delete errors[alias];
      snapshot = data.snapshot;
      render();
      setStatus("已重命名为 " + data.alias, "ok");
    }).catch(function (err) {
      delete busy[alias];
      // Keep the input open so the name can be corrected in place.
      errors[alias] = err.message;
      expanded[alias] = true;
      rerenderCard(alias);
    });
  }

  function submitDelete(account) {
    var alias = account.alias;
    if (busy[alias] === true) return;
    busy[alias] = true;
    rerenderCard(alias);

    api("/api/accounts/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias: alias })
    }).then(function (data) {
      delete busy[alias];
      if (!data.ok) throw new Error(data.error || "删除失败");
      var removed = data.removedAliases || [alias];
      delete pendingDelete[alias];
      delete drafts[alias];
      delete expanded[alias];
      delete errors[alias];
      snapshot = data.snapshot;
      render();
      setStatus("已删除 " + removed.join("、"), "ok");
    }).catch(function (err) {
      delete busy[alias];
      errors[alias] = err.message;
      rerenderCard(alias);
    });
  }

  // Spells out exactly what is about to be lost. A refusal (an active local
  // CLIProxyAPI session, say) surfaces in the same panel and removes nothing.
  function buildDeletePanel(account) {
    var alias = account.alias;
    var panel = el("div", "danger-panel");
    panel.appendChild(el("div", "danger-title",
      '删除账号 "' + alias + '"？此操作不可撤销。'));

    var facts = el("ul", "danger-facts");
    var linked = account.linkedAliases || [alias];
    if (linked.length > 1) {
      facts.appendChild(el("li", null,
        "会同时删除 " + linked.length + " 个指向它的别名：" + linked.join("、")));
    } else {
      facts.appendChild(el("li", null, "会删除别名 " + alias));
    }
    facts.appendChild(el("li", null, deleteCredentialFact(account)));
    if (account.isActive) {
      facts.appendChild(el("li", null,
        "该账号当前生效，删除后裸 " +
        (account.provider === "claude" ? "claude" : "codex") +
        " 将没有可用账号"));
    }
    panel.appendChild(facts);

    var row = el("div", "row");
    var keep = el("button", null, "取消");
    keep.type = "button";
    keep.addEventListener("click", function () {
      delete pendingDelete[alias];
      delete errors[alias];
      rerenderCard(alias);
    });
    row.appendChild(keep);

    var confirmDelete = el("button", "confirm-delete",
      account.isActive ? "仍然删除" : "确认删除");
    confirmDelete.type = "button";
    confirmDelete.disabled = busy[alias] === true;
    confirmDelete.addEventListener("click", function () {
      submitDelete(account);
    });
    row.appendChild(confirmDelete);
    panel.appendChild(row);

    if (errors[alias]) panel.appendChild(el("div", "err", errors[alias]));
    return panel;
  }

  function deleteCredentialFact(account) {
    if (account.provider === "claude") {
      if (account.type === "oauth") return "保存的登录凭据会被删除，需要重新登录";
      if (account.type === "api-key") return "API Key 与其账号配置会被删除";
      return "本机 CLIProxyAPI 的登录与配置会被删除，需要重新登录";
    }
    if (account.type === "chatgpt") return "Codex 登录文件会被删除，需要重新登录";
    return "API Key 与 Codex 登录文件会被删除";
  }

  function cssEscape(value) {
    return String(value).replace(/["\\\\]/g, "\\\\$&");
  }

  function renderGroup(title, items, provider) {
    var box = document.createDocumentFragment();

    var heading = el("h2", "section-head");
    heading.appendChild(document.createTextNode(title));
    var add = iconButton("plus", "新增 " + title + " 账号", "add-account");
    add.addEventListener("click", function () { openNewForm(provider); });
    heading.appendChild(add);
    box.appendChild(heading);

    if (newForms[provider]) {
      var form = buildNewForm(provider);
      form.setAttribute("data-new", provider);
      box.appendChild(form);
    }

    if (items.length === 0 && !newForms[provider]) {
      box.appendChild(el("div", "empty", "没有账号"));
      return box;
    }
    items.forEach(function (account) {
      var card = buildCard(account);
      card.setAttribute("data-alias", account.alias);
      box.appendChild(card);
    });
    return box;
  }

  function render() {
    listEl.textContent = "";
    if (!snapshot) return;
    listEl.appendChild(renderGroup("Claude", snapshot.claude, "claude"));
    listEl.appendChild(renderGroup("Codex", snapshot.codex, "codex"));
    subEl.textContent = "共 " + accounts().length + " 个账号 · " +
      "改完点底部保存；当前生效的账号会立即同步到全局配置";
    refreshFooter();
  }

  function load(announce) {
    api("/api/accounts").then(function (data) {
      snapshot = data;
      drafts = {};
      errors = {};
      render();
      if (announce) setStatus("已重新读取", "ok");
    }).catch(function (err) {
      setStatus("读取失败：" + err.message, "bad");
    });
  }

  function save() {
    var dirty = dirtyAccounts();
    if (dirty.length === 0) return;

    var changes = dirty.map(function (account) {
      var draft = draftOf(account);
      var fields = {};
      Object.keys(account.fields).forEach(function (key) {
        if (account.readonly.indexOf(key) >= 0) return;
        fields[key] = draft.fields[key] || "";
      });
      var change = {
        provider: account.provider,
        alias: account.alias,
        fields: fields
      };
      if (account.supportsEnv) change.env = envToObject(draft.env);
      return change;
    });

    saveEl.disabled = true;
    setStatus("保存中…");

    api("/api/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ changes: changes })
    }).then(function (data) {
      errors = {};
      var failed = [];
      data.results.forEach(function (result) {
        if (!result.ok) {
          errors[result.alias] = result.error || "保存失败";
          failed.push(result.alias);
          expanded[result.alias] = true;
        }
      });

      snapshot = data.snapshot;
      // Keep unsaved edits for the accounts that failed so the user can fix
      // them in place; everything else reloads from the fresh snapshot.
      Object.keys(drafts).forEach(function (alias) {
        if (failed.indexOf(alias) < 0) delete drafts[alias];
      });
      render();

      if (failed.length === 0) {
        var reapplied = data.results.filter(function (r) { return r.reapplied; });
        setStatus(
          "已保存 " + data.results.length + " 个账号" +
          (reapplied.length > 0 ? "，其中 " + reapplied.length + " 个已同步到全局配置" : ""),
          "ok"
        );
      } else {
        setStatus(failed.length + " 个账号保存失败：" + failed.join("、"), "bad");
      }
    }).catch(function (err) {
      setStatus("保存失败：" + err.message, "bad");
      refreshFooter();
    });
  }

  load(false);
})();
</script>
</body>
</html>
`;
function renderPage() {
  return PAGE;
}

// src/webconfig/messages.ts
var ALIAS_REJECTIONS = {
  empty: "别名不能为空",
  reserved: "这个名字是保留命令，换一个",
  charset: "别名只能用字母、数字、连字符和下划线",
  taken: "这个别名已经被占用了"
};
function aliasRejectionMessage(rejection) {
  return ALIAS_REJECTIONS[rejection];
}

// src/webconfig/validation.ts
function optional(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
function requireValidUrl(value) {
  const trimmed = value.trim();
  if (!trimmed)
    return;
  try {
    new URL(trimmed);
  } catch {
    throw new Error(`请求地址不是合法 URL：${trimmed}`);
  }
}
function validateCustomEnv(env3) {
  const result2 = {};
  for (const [rawKey, rawValue] of Object.entries(env3 ?? {})) {
    const key = String(rawKey).trim();
    if (!key)
      continue;
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      throw new Error(`环境变量名 "${key}" 无效：只能用大写字母、数字和下划线，且不能以数字开头`);
    }
    if (!isValidCustomEnvKey(key)) {
      throw new Error(`"${key}" 上面已有专门的输入框，请填在那里`);
    }
    result2[key] = typeof rawValue === "string" ? rawValue.trim() : "";
  }
  return result2;
}

// src/webconfig/snapshot.ts
async function buildSnapshot() {
  const aliasReg = await loadAliases();
  const claudeState = await readState2();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {}
  const claude = [];
  const codex = [];
  for (const entry of aliasReg.aliases) {
    const linkedAliases = findAliasesByTarget(aliasReg, entry.target).map((item) => item.alias);
    if (entry.target.provider === "claude") {
      const account = await describeClaudeAccount(entry, claudeState.active, linkedAliases);
      if (account)
        claude.push(account);
    } else if (codexReg) {
      const account = await describeCodexAccount(entry, codexReg, linkedAliases);
      if (account)
        codex.push(account);
    }
  }
  return {
    version: 1,
    generatedAt: Date.now(),
    claude,
    codex,
    codexDefaultModel: DEFAULT_CODEX_MODEL
  };
}
async function describeClaudeAccount(entry, activeProfile, linkedAliases) {
  if (entry.target.provider !== "claude")
    return null;
  const profileName = entry.target.profileName;
  let data;
  try {
    data = await getProfileData(profileName);
  } catch {
    return null;
  }
  const base = {
    provider: "claude",
    alias: entry.alias,
    profileName,
    isActive: activeProfile === profileName,
    env: data.env ?? {},
    supportsEnv: true,
    linkedAliases
  };
  if (data.type === "api-key") {
    return {
      ...base,
      type: "api-key",
      label: "API Key",
      email: null,
      fields: {
        apiKey: data.apiKey ?? "",
        baseUrl: data.baseUrl ?? "",
        authToken: data.authToken ?? "",
        model: data.model ?? "",
        defaultFableModel: data.defaultFableModel ?? "",
        defaultOpusModel: data.defaultOpusModel ?? "",
        defaultSonnetModel: data.defaultSonnetModel ?? "",
        defaultHaikuModel: data.defaultHaikuModel ?? "",
        subagentModel: data.subagentModel ?? ""
      },
      secretFields: ["apiKey", "authToken"],
      readonly: []
    };
  }
  if (data.type === "local-cliproxyapi") {
    return {
      ...base,
      type: "local-cliproxyapi",
      label: (data.upstream ?? "codex") === "codex" ? "本机 CLIProxyAPI" : `本机 CLIProxyAPI · ${CLI_PROXY_API_UPSTREAMS[data.upstream].label}`,
      email: null,
      fields: {
        defaultModel: data.defaultModel ?? "",
        binaryPath: data.binaryPath ?? ""
      },
      secretFields: [],
      readonly: ["binaryPath"]
    };
  }
  const account = await readJson(claudeProfileAccountFile(profileName), null);
  return {
    ...base,
    type: "oauth",
    label: "OAuth 订阅",
    email: account?.emailAddress ?? null,
    fields: { defaultModel: data.defaultModel ?? "" },
    secretFields: [],
    readonly: []
  };
}
async function describeCodexAccount(entry, registry, linkedAliases) {
  if (entry.target.provider !== "codex")
    return null;
  const accountKey = entry.target.accountKey;
  const account = findAccountByKey(registry, accountKey);
  if (!account)
    return null;
  const base = {
    provider: "codex",
    alias: entry.alias,
    accountKey,
    isActive: registry.active_account_key === accountKey,
    email: account.email || null,
    env: {},
    supportsEnv: false,
    linkedAliases
  };
  if (account.auth_mode !== "apikey") {
    return {
      ...base,
      type: "chatgpt",
      label: "ChatGPT 订阅",
      fields: { defaultModel: account.default_model ?? "" },
      secretFields: [],
      readonly: []
    };
  }
  const auth = await readAccountAuth(accountKey);
  const apiKey = auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY ?? "" : "";
  const provider = account.api_provider;
  const isCustom = provider?.type === "custom";
  return {
    ...base,
    type: "apikey",
    label: isCustom ? `API Key · ${provider?.name ?? ""}` : "API Key · 官方",
    fields: {
      defaultModel: account.default_model ?? "",
      apiKey,
      ...isCustom ? {
        providerName: provider?.name ?? "",
        baseUrl: provider?.base_url ?? "",
        model: provider?.model ?? "",
        envKey: provider?.env_key ?? "OPENAI_API_KEY"
      } : {}
    },
    secretFields: ["apiKey"],
    readonly: isCustom ? ["providerName"] : []
  };
}
async function renameAccountAlias(from, to) {
  const target = to.trim();
  const registry = await loadAliases();
  if (!findAlias(registry, from)) {
    throw new Error(`别名 "${from}" 不存在`);
  }
  const rejection = checkAlias(registry, target, { ignoreAlias: from });
  if (rejection) {
    throw new Error(aliasRejectionMessage(rejection));
  }
  await renameAlias(from, target);
  return target;
}
async function deleteAccount(alias) {
  const registry = await loadAliases();
  if (!findAlias(registry, alias)) {
    throw new Error(`别名 "${alias}" 不存在`);
  }
  const { linkedAliases } = await purgeAccount(alias);
  return linkedAliases;
}
async function applyChanges(changes) {
  const results = [];
  for (const change of changes) {
    try {
      results.push(await applyChange(change));
    } catch (err) {
      results.push({
        alias: change?.alias ?? "",
        ok: false,
        reapplied: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
  return results;
}
async function applyChange(change) {
  const aliasReg = await loadAliases();
  const entry = findAlias(aliasReg, change.alias);
  if (!entry) {
    throw new Error(`别名 "${change.alias}" 不存在`);
  }
  const fields2 = sanitizeFields(change.fields);
  const env3 = change.env === undefined ? undefined : validateCustomEnv(change.env);
  if (entry.target.provider === "claude") {
    validateClaudeFields(fields2);
    const { reapplied } = await updateClaudeProfileConfig(entry.target.profileName, { fields: fields2, env: env3 });
    return { alias: entry.alias, ok: true, reapplied };
  }
  if (entry.target.provider === "opencode") {
    throw new Error("OpenCode Go 请使用 claudex-switch refresh <alias> 后在 TUI 中管理");
  }
  return applyCodexChange(entry.target.accountKey, entry.alias, fields2);
}
async function applyCodexChange(accountKey, alias, fields2) {
  if (fields2.baseUrl !== undefined)
    requireValidUrl(fields2.baseUrl);
  const registry = await loadRegistry();
  const existing = findAccountByKey(registry, accountKey);
  if (existing?.api_provider?.type === "custom" && fields2.baseUrl !== undefined && !fields2.baseUrl.trim()) {
    throw new Error("中转站账号的请求地址不能为空");
  }
  const account = updateAccountConfig(registry, accountKey, {
    defaultModel: fields2.defaultModel,
    baseUrl: fields2.baseUrl,
    model: fields2.model,
    envKey: fields2.envKey
  });
  if (fields2.apiKey !== undefined && account.auth_mode === "apikey") {
    const key = fields2.apiKey.trim();
    if (!key)
      throw new Error("API Key 不能为空");
    const auth = await readAccountAuth(accountKey);
    await saveAccountAuth(accountKey, {
      ...auth?.auth_mode === "apikey" ? auth : {},
      auth_mode: "apikey",
      OPENAI_API_KEY: key
    });
  }
  await saveRegistry(registry);
  const reapplied = registry.active_account_key === accountKey;
  if (reapplied) {
    const auth = account.auth_mode === "apikey" ? await readAccountAuth(accountKey) : null;
    await applyCodexApiProvider(account.auth_mode === "apikey" ? account.api_provider : null, auth?.auth_mode === "apikey" ? auth.OPENAI_API_KEY : undefined, account.default_model);
  }
  return { alias, ok: true, reapplied };
}
function sanitizeFields(fields2) {
  const result2 = {};
  for (const [key, value] of Object.entries(fields2 ?? {})) {
    if (typeof value !== "string")
      continue;
    result2[key] = value;
  }
  return result2;
}
function validateClaudeFields(fields2) {
  if (fields2.baseUrl !== undefined)
    requireValidUrl(fields2.baseUrl);
  if (fields2.apiKey !== undefined && !fields2.apiKey.trim()) {
    throw new Error("API Key 不能为空");
  }
}

// src/webconfig/create.ts
var PROVIDER_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
var ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
async function createAccount(request2) {
  const alias = request2.alias.trim();
  const fields2 = request2.fields ?? {};
  const registry = await loadAliases();
  const rejection = checkAlias(registry, alias);
  if (rejection)
    throw new Error(aliasRejectionMessage(rejection));
  if (request2.provider === "claude") {
    await createClaude(request2, alias, fields2);
    return;
  }
  await createCodex(request2, alias, fields2);
}
async function createClaude(request2, alias, fields2) {
  const apiKey = (fields2.apiKey ?? "").trim();
  if (!apiKey)
    throw new Error("API Key 不能为空");
  const baseUrl2 = optional(fields2.baseUrl);
  if (baseUrl2)
    requireValidUrl(baseUrl2);
  await createClaudeApiKeyAccount({
    alias,
    apiKey,
    baseUrl: baseUrl2,
    authToken: optional(fields2.authToken),
    model: optional(fields2.model),
    defaultFableModel: optional(fields2.defaultFableModel),
    defaultSonnetModel: optional(fields2.defaultSonnetModel),
    defaultOpusModel: optional(fields2.defaultOpusModel),
    defaultHaikuModel: optional(fields2.defaultHaikuModel),
    subagentModel: optional(fields2.subagentModel),
    env: validateCustomEnv(request2.env)
  });
}
async function createCodex(request2, alias, fields2) {
  const apiKey = (fields2.apiKey ?? "").trim();
  if (!apiKey)
    throw new Error("API Key 不能为空");
  const provider = resolveCodexProvider(fields2);
  const defaultModel = (fields2.defaultModel ?? "").trim();
  if (!defaultModel)
    throw new Error("默认模型不能为空");
  const existing = findAliasByTarget(await loadAliases(), {
    provider: "codex",
    accountKey: codexApiAccountKey(apiKey)
  });
  if (existing) {
    throw new Error(`这个 Codex API Key 已经导入为 "${existing.alias}"`);
  }
  await createCodexApiKeyAccount({ alias, apiKey, provider, defaultModel });
}
function resolveCodexProvider(fields2) {
  const providerType = (fields2.providerType ?? "").trim();
  if (providerType !== "official" && providerType !== "custom") {
    throw new Error("请选择 Provider 类型（OpenAI 官方 / 自定义中转）");
  }
  if (providerType === "official") {
    return {
      type: "official",
      name: null,
      base_url: null,
      model: null,
      env_key: null
    };
  }
  const name = (fields2.providerName ?? "").trim();
  if (!name)
    throw new Error("Provider 名称不能为空");
  if (!PROVIDER_NAME_PATTERN.test(name)) {
    throw new Error("Provider 名称只能用字母、数字、连字符和下划线");
  }
  const baseUrl2 = (fields2.baseUrl ?? "").trim();
  if (!baseUrl2)
    throw new Error("中转站的请求地址不能为空");
  requireValidUrl(baseUrl2);
  const model2 = (fields2.model ?? "").trim();
  if (!model2)
    throw new Error("Provider 模型不能为空");
  const envKey = (fields2.envKey ?? "OPENAI_API_KEY").trim();
  if (!ENV_KEY_PATTERN.test(envKey)) {
    throw new Error("环境变量名只能是字母、数字和下划线，且不能以数字开头");
  }
  return {
    type: "custom",
    name,
    base_url: baseUrl2,
    model: model2,
    env_key: envKey
  };
}

// src/webconfig/server.ts
var MAX_BODY_BYTES2 = 1e6;
async function startWebConfigServer(options = {}) {
  const host = options.host ?? "127.0.0.1";
  const token = randomBytes6(32).toString("base64url");
  const server = createServer3((req, res) => {
    handleRequest(req, res, token, host).catch(() => {
      sendJson(res, 500, { error: "internal error" });
    });
  });
  await new Promise((resolve3, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, host, () => {
      server.removeListener("error", reject);
      resolve3();
    });
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    url: `http://${host}:${port}/?t=${token}`,
    port,
    token,
    close: () => closeServer(server)
  };
}
function closeServer(server) {
  return new Promise((resolve3) => {
    server.closeAllConnections?.();
    server.close(() => resolve3());
  });
}
async function handleRequest(req, res, token, host) {
  if (!isAllowedHost(req.headers.host, host)) {
    sendJson(res, 403, { error: "forbidden host" });
    return;
  }
  const url = new URL(req.url ?? "/", `http://${host}`);
  if (!isAuthorized(req, url, token)) {
    sendJson(res, 403, { error: "invalid or missing token" });
    return;
  }
  if (req.method === "GET" && url.pathname === "/") {
    const body = renderPage();
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer"
    });
    res.end(body);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/accounts") {
    sendJson(res, 200, await buildSnapshot());
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/accounts/create") {
    const body = await readJsonBody(req);
    if (!body || body.provider !== "claude" && body.provider !== "codex" || typeof body.alias !== "string") {
      sendJson(res, 400, { error: "expected { provider, alias, fields }" });
      return;
    }
    try {
      await createAccount({
        provider: body.provider,
        alias: body.alias,
        fields: body.fields ?? {},
        env: body.env
      });
      sendJson(res, 200, { ok: true, snapshot: await buildSnapshot() });
    } catch (err) {
      sendJson(res, 200, {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/accounts/rename") {
    const body = await readJsonBody(req);
    if (typeof body?.alias !== "string" || typeof body?.newAlias !== "string") {
      sendJson(res, 400, { error: "expected { alias, newAlias }" });
      return;
    }
    try {
      const alias = await renameAccountAlias(body.alias, body.newAlias);
      sendJson(res, 200, { ok: true, alias, snapshot: await buildSnapshot() });
    } catch (err) {
      sendJson(res, 200, {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/accounts/delete") {
    const body = await readJsonBody(req);
    if (typeof body?.alias !== "string") {
      sendJson(res, 400, { error: "expected { alias }" });
      return;
    }
    try {
      const removedAliases = await deleteAccount(body.alias);
      sendJson(res, 200, {
        ok: true,
        removedAliases,
        snapshot: await buildSnapshot()
      });
    } catch (err) {
      sendJson(res, 200, {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/accounts") {
    const payload = await readJsonBody(req);
    const changes = Array.isArray(payload?.changes) ? payload.changes : null;
    if (!changes) {
      sendJson(res, 400, { error: "expected { changes: [...] }" });
      return;
    }
    const results = await applyChanges(changes);
    sendJson(res, 200, { results, snapshot: await buildSnapshot() });
    return;
  }
  sendJson(res, 404, { error: "not found" });
}
function isAllowedHost(header2, host) {
  if (!header2)
    return false;
  const name = header2.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return name === host || name === "localhost" || name === "127.0.0.1";
}
function isAuthorized(req, url, token) {
  const header2 = req.headers.authorization ?? "";
  const bearer = header2.startsWith("Bearer ") ? header2.slice(7) : "";
  const provided = bearer || url.searchParams.get("t") || "";
  return safeEqual(provided, token);
}
function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length)
    return false;
  return timingSafeEqual2(left, right);
}
async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES2)
      throw new Error("request body too large");
    chunks.push(buffer);
  }
  if (chunks.length === 0)
    return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return null;
  }
}
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(payload);
}

// src/commands/webconfig.ts
function parseWebConfigArgs(args) {
  const options = { open: true };
  for (let index = 0;index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--no-open") {
      options.open = false;
      continue;
    }
    if (arg === "--port" || arg === "-p") {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value < 0 || value > 65535) {
        throw new Error("--port needs a number between 0 and 65535.");
      }
      options.port = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}
async function webconfig(args = []) {
  blank();
  let options;
  try {
    options = parseWebConfigArgs(args);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    hint(`Usage: ${source_default.cyan("claudex-switch webconfig [--port <n>] [--no-open]")}`);
    blank();
    process.exit(1);
  }
  let server;
  try {
    server = await startWebConfigServer({ port: options.port });
  } catch (err) {
    error(`Could not start the config server: ${err instanceof Error ? err.message : String(err)}`);
    blank();
    process.exit(1);
  }
  success2(`Config UI running at ${source_default.cyan(server.url)}`);
  hint("The link carries a one-time token and only works from this machine.");
  hint(`Press ${source_default.cyan("Ctrl-C")} to stop.`);
  blank();
  if (options.open !== false && !openExternalUrl(server.url)) {
    info("Could not open a browser automatically — open the link above.");
  }
  await new Promise((resolve3) => {
    const stop = () => {
      server.close().then(() => {
        blank();
        resolve3();
      });
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
}

// src/commands/doctor.ts
async function doctor(aliasOrName, options = {}) {
  blank();
  const aliases = await loadAliases();
  const entry = findAlias(aliases, aliasOrName);
  if (!entry) {
    fail(`Alias "${aliasOrName}" not found.`);
    return;
  }
  const profileName = entry.target.provider === "claude" ? entry.target.profileName : await getLinkedClaudeProfile(entry.target);
  if (!profileName) {
    fail(`Doctor checks local CLIProxyAPI accounts. Run \`claudex-switch ${entry.alias} -run --cliproxy claudecode\` once to create one for this alias.`);
    return;
  }
  if (!await profileExists(profileName)) {
    fail(`Claude profile "${profileName}" no longer exists.`);
    return;
  }
  let profile = await getProfileData(profileName);
  if (profile.type !== "local-cliproxyapi") {
    fail("Doctor is currently available for local CLIProxyAPI Claude accounts only.");
    return;
  }
  if (options.binaryPath) {
    try {
      profile = await replaceLocalCLIProxyAPIBinary(profileName, options.binaryPath);
      success2("Updated this account's CLIProxyAPI binary; existing login and settings were preserved.");
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
      return;
    }
  }
  const managedProfile = {
    profileId: profile.profileId,
    binaryPath: profile.binaryPath
  };
  let status = await inspectManagedCLIProxyAPI(managedProfile, {
    probe: true
  });
  info(`CLIProxyAPI binary: ${status.installed ? `v${readCLIProxyAPIVersion(profile.binaryPath) ?? "unknown"}` : "not found"}`);
  const upstream = upstreamLabel(profile.upstream);
  info(`${upstream} ${profile.upstream === "opencode-go" ? "key" : "login"}: ${status.loggedIn ? "available" : "required"}`);
  info(`Managed daemon: ${status.running ? `running on 127.0.0.1:${status.port}` : "stopped"}`);
  info(`Managed environment: ${status.environmentValid ? "valid" : "invalid or missing"}`);
  info(`Managed configuration: ${status.configured ? "valid" : "missing or needs rebuild"}`);
  if (status.running) {
    info(`Local authenticated probe: ${status.healthy ? "passed" : "failed"}`);
  }
  if (!status.installed) {
    fail("CLIProxyAPI binary is unavailable. Reinstall it or add the account again with a valid executable.");
    return;
  }
  try {
    assertCLIProxyAPICompatibility(profile.binaryPath, profile.upstream);
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    return;
  }
  if (!status.loggedIn) {
    fail(`No valid local ${upstream} login is available. Run ${source_default.cyan(`claudex-switch refresh ${entry.alias}`)} to sign in again.`);
    return;
  }
  if (!status.environmentValid) {
    fail("Managed CLIProxyAPI private environment is invalid or missing. Add the account again; a restart cannot safely recreate its client key.");
    return;
  }
  if (!status.configured && !options.restart) {
    fail("Managed CLIProxyAPI runtime configuration is missing or invalid. Run `claudex-switch doctor <alias> --restart` to rebuild it from the private environment.");
    return;
  }
  if (status.running && !status.healthy && !options.restart) {
    fail("The managed daemon is running but did not pass its authenticated loopback probe. Use `claudex-switch doctor <alias> --restart` after ending active sessions.");
    return;
  }
  let runtime;
  try {
    if (options.restart) {
      info("Restarting this account's managed loopback proxy...");
      runtime = await restartManagedCLIProxyAPI(managedProfile);
      status = await inspectManagedCLIProxyAPI(managedProfile, { probe: true });
    } else if (options.live) {
      runtime = await ensureManagedCLIProxyAPI(managedProfile);
      status = await inspectManagedCLIProxyAPI(managedProfile, { probe: true });
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    return;
  }
  if (!status.configured) {
    fail("The managed runtime configuration could not be rebuilt.");
    return;
  }
  if (status.running && !status.healthy) {
    fail("The managed daemon did not pass its authenticated loopback probe after startup.");
    return;
  }
  if (options.live) {
    const liveRuntime = runtime ?? await ensureManagedCLIProxyAPI(managedProfile);
    const liveModel = await resolveManagedLocalCLIProxyAPIModel(profile, "haiku");
    const liveName = (profile.upstream ?? "codex") === "codex" ? `Luna (${liveModel})` : liveModel;
    const probe = await probeManagedCLIProxyAPILive(liveRuntime, liveModel);
    if (!probe.ok) {
      const reason = probe.status === 429 ? "HTTP 429: upstream rate limit or resource exhaustion; wait before retrying, do not relogin or repeatedly restart the proxy" : probe.status === 401 || probe.status === 403 ? `HTTP ${probe.status}: upstream authorization was rejected; check this account's login/access` : probe.status === 400 ? "HTTP 400: upstream rejected the model/request; check model availability and protocol compatibility" : probe.status === null ? "upstream request timed out or could not connect" : `HTTP ${probe.status}: upstream could not complete the request`;
      fail(`${liveName} live verification failed. The local proxy is reachable; ${reason}.`);
      return;
    }
    success2(`${source_default.bold(entry.alias)} ${liveName} live verification passed`);
    blank();
    return;
  }
  if (options.restart && status.running) {
    success2(`${source_default.bold(entry.alias)} managed proxy restarted`);
  } else {
    success2(`${source_default.bold(entry.alias)} basic local CLIProxyAPI checks passed`);
    hint(`Use ${source_default.cyan(`claudex-switch doctor ${entry.alias} --live`)} for a small, quota-consuming model request.`);
  }
  blank();
}
function fail(message) {
  error(message);
  blank();
  process.exit(1);
}

// src/index.ts
var HELP = `
  ${source_default.bold("claudex-switch")} — Manage Claude Code, Codex, and OpenCode accounts

  ${source_default.dim("Usage:")}
    claudex-switch                     Interactive account picker
    claudex-switch <alias>             Switch to an account
    claudex-switch <alias> -run [--model <model> [effort]] [--attribution-header <true|false>] [--autoreview <on|off>] [args...]  Switch, save the selected model, and run (Codex defaults to --approve-for-me)
    claudex-switch <alias> -run --cliproxy claudecode [--model <model>]  Run Claude Code on Codex / OpenCode Go, agy, workbuddy, workbuddy-ai or cursor
    claudex-switch add <alias>         Add a new account
    claudex-switch use <alias>         Switch to an account
    claudex-switch list [--json] [--no-usage] [--cached]  List accounts with remaining quota (--cached: instant, for shell startup)
    claudex-switch rename <from> <to>  Rename an alias
    claudex-switch model <alias> <model>  Update an account's default model (Claude: 5.5, sonnet5, fable; Codex: astra, sol, terra, luna; OpenCode: provider/model)
    claudex-switch remove <alias>      Remove an alias only
    claudex-switch purge <alias>       Delete an account and all linked aliases
    claudex-switch refresh <alias>     Refresh and resave an account login
    claudex-switch doctor <alias> [--live] [--restart] [--binary <path>]  Check or update this account's local CLIProxyAPI
    claudex-switch webconfig [--port <n>] [--no-open]  Open the local config UI
    claudex-switch current             Show active accounts
    claudex-switch import              Import existing accounts
    claudex-switch update              Upgrade to the latest release
    claudex-switch --version           Show version and auto-update to the latest release
    claudex-switch help                Show this help

  ${source_default.dim("Shortcuts:")}
    claudex-switch ls                  Same as 'list'
    claudex-switch rm <alias>          Same as 'remove'
    claudex-switch use <alias> -run [--autoreview <on|off>]  Same as '<alias> -run' (Codex defaults to --approve-for-me)
    claudex-switch -V                  Same as '--version'

  Autoreview defaults to off for Codex and OpenCode sessions; use --autoreview on to enable it for one session.
`;
function isVersionCommand(command) {
  return command === "--version" || command === "-V";
}
function isHelpCommand(command) {
  return command === "help" || command === "--help" || command === "-h";
}
function isRepoLocalEntrypoint(scriptPath) {
  if (!scriptPath)
    return false;
  const entry = resolve3(scriptPath);
  const entryName = basename3(entry);
  const parentName = basename3(dirname8(entry));
  let root = null;
  if (parentName === "src" && entryName === "index.ts") {
    root = dirname8(dirname8(entry));
  } else if (parentName === "dist" && (entryName === "claudex-switch.js" || entryName === "claudex-switch")) {
    root = dirname8(dirname8(entry));
  }
  if (!root)
    return false;
  const packageFile = join19(root, "package.json");
  if (!existsSync(packageFile))
    return false;
  try {
    const pkg = JSON.parse(readFileSync2(packageFile, "utf-8"));
    return pkg.name === "claudex-switch";
  } catch {
    return false;
  }
}
function enforceRepoLocalHomeSafety(command, machineReadable = false) {
  if (process.env.CLAUDEX_TEST_HOME)
    return;
  if (process.env.CLAUDEX_ALLOW_REAL_HOME === "1")
    return;
  if (!isRepoLocalEntrypoint(process.argv[1]))
    return;
  if (isVersionCommand(command) || isHelpCommand(command))
    return;
  if (machineReadable) {
    console.error("Refusing to run repo-local claudex-switch against your real HOME. Set CLAUDEX_TEST_HOME for an isolated inventory.");
  } else {
    blank();
    error("Refusing to run repo-local claudex-switch against your real HOME.");
    hint(`Use ${source_default.cyan("CLAUDEX_TEST_HOME=$(mktemp -d) bun ./dist/claudex-switch.js <command>")} for test data.`);
    hint(`Set ${source_default.cyan("CLAUDEX_ALLOW_REAL_HOME=1")} only when you intentionally want to touch real account files.`);
    blank();
  }
  process.exit(1);
}
function parseListOptions(args) {
  let json2 = false;
  let usage2 = true;
  let cached = false;
  for (const arg of args) {
    if (arg === "--json") {
      json2 = true;
    } else if (arg === "--no-usage") {
      usage2 = false;
    } else if (arg === "--cached") {
      cached = true;
    } else {
      console.error("Unsupported list option. Supported options are --json, --no-usage and --cached.");
      process.exitCode = 2;
      return null;
    }
  }
  return { json: json2, usage: usage2, cached, background: true };
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
  const claudeState = await readState2();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
  } catch {}
  const openCodeState = await readOpenCodeState();
  const choices = aliasReg.aliases.map((entry) => {
    const provider = formatProvider(entry.target.provider);
    let isActive = false;
    if (entry.target.provider === "claude") {
      isActive = claudeState.active === entry.target.profileName;
    } else if (entry.target.provider === "codex" && codexReg) {
      isActive = codexReg.active_account_key === entry.target.accountKey;
    } else if (entry.target.provider === "opencode") {
      isActive = openCodeState.active === entry.target.profileId;
    }
    const active = isActive ? source_default.dim(" (active)") : "";
    return {
      name: `${entry.alias}  ${provider}${active}`,
      value: entry.alias
    };
  });
  const choice = await esm_default5({
    message: "Switch to account",
    choices
  });
  await use(choice);
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    const jsonListCommand = (command === "list" || command === "ls") && args.includes("--json");
    enforceRepoLocalHomeSafety(command, jsonListCommand);
    if (command === "__subscription-proxy") {
      if (args.length !== 3)
        throw new Error("Invalid subscription proxy arguments");
      await runManagedSubscriptionProxy(args[0], args[1], args[2]);
      return;
    }
    if (args.includes("--autoreview") && !jsonListCommand) {
      const runFlag = command === "use" ? args[1] : args[0];
      if (!isRunFlag(runFlag)) {
        error("--autoreview can only be used with -run or --run.");
        hint(`Example: ${source_default.cyan("claudex-switch cx -run --autoreview off")}`);
        blank();
        process.exit(1);
      }
    }
    if (args.includes("--cliproxy") && !jsonListCommand) {
      const runFlag = command === "use" ? args[1] : args[0];
      if (!isRunFlag(runFlag)) {
        error("--cliproxy can only be used with -run or --run.");
        hint(`Example: ${source_default.cyan("claudex-switch cx -run --cliproxy claudecode")}`);
        blank();
        process.exit(1);
      }
    }
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
  Usage: claudex-switch use <alias> [-run [--model <model> [effort]] [--attribution-header <true|false>] [--autoreview <on|off>] [args...]]
`));
          process.exit(1);
        }
        if (isRunFlag(args[1])) {
          const exitCode = await runAliasSession(args[0], args.slice(2));
          process.exit(exitCode);
        }
        await use(args[0]);
        break;
      case "list":
      case "ls":
        if (args.length === 1 && args[0] === "--refresh-cache") {
          await Promise.all([refreshUsageCache(), refreshActivityCache().catch(() => false)]);
          break;
        }
        {
          const options = parseListOptions(args);
          if (!options)
            break;
          try {
            await list(options);
          } catch (err) {
            if (!options.json)
              throw err;
            console.error("Unable to produce the requested JSON account inventory.");
            process.exitCode = 1;
          }
        }
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
      case "model":
        if (!args[0] || !args[1]) {
          console.error(source_default.red(`
  Usage: claudex-switch model <alias> <model>
`));
          process.exit(1);
        }
        await model(args[0], args.slice(1).join(" "));
        break;
      case "rename":
        if (!args[0] || !args[1]) {
          console.error(source_default.red(`
  Usage: claudex-switch rename <from> <to>
`));
          process.exit(1);
        }
        await rename11(args[0], args[1]);
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
        await current2();
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
      case "doctor": {
        const doctorOptions = {};
        let validDoctorArgs = !!args[0];
        for (let i = 1;i < args.length; i += 1) {
          if (args[i] === "--live")
            doctorOptions.live = true;
          else if (args[i] === "--restart")
            doctorOptions.restart = true;
          else if (args[i] === "--binary" && !doctorOptions.binaryPath && args[i + 1] && !args[i + 1].startsWith("-")) {
            doctorOptions.binaryPath = args[++i];
          } else
            validDoctorArgs = false;
        }
        if (!validDoctorArgs) {
          console.error(source_default.red(`
  Usage: claudex-switch doctor <alias> [--live] [--restart] [--binary <path>]
`));
          process.exit(1);
        }
        await doctor(args[0], doctorOptions);
        break;
      }
      case "webconfig":
        await webconfig(args);
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
          if (isRunFlag(args[0])) {
            const exitCode = await runAliasSession(command, args.slice(1));
            process.exit(exitCode);
          }
          await use(command);
        } else if (isCliproxyRunInvocation(args)) {
          const exitCode = await runAliasSession(command, args.slice(1));
          process.exit(exitCode);
        } else {
          console.error(source_default.red(`
  Unknown command: "${command}"`));
          if (isAntigravityName(command) || isSubscriptionName(command)) {
            hint(`Run through the proxy: ${source_default.cyan(`claudex-switch ${command} --run --cliproxy claudecode`)}`);
          }
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

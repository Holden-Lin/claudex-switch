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
import { existsSync, readFileSync } from "fs";
import { basename as basename2, dirname as dirname6, join as join8, resolve as resolve2 } from "path";

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
var CLI_PROXY_API_DIR = join(CLAUDEX_DIR, "cliproxyapi");
var CLI_PROXY_API_LOGIN_LOCK = join(CLI_PROXY_API_DIR, "login.lock");
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
function codexAccountAuthFile(accountKey) {
  const needsEncoding = !accountKey || accountKey === "." || accountKey === ".." || [...accountKey].some((ch) => !/[a-zA-Z0-9\-_.]/.test(ch));
  const fileKey = needsEncoding ? Buffer.from(accountKey).toString("base64url") : accountKey;
  return join(CODEX_ACCOUNTS_DIR, `${fileKey}.auth.json`);
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
  chmod as chmod3,
  copyFile,
  lstat,
  mkdir as mkdir4,
  readdir as readdir2,
  readlink,
  rm as rm3,
  symlink,
  unlink
} from "fs/promises";
import { join as join5 } from "path";

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
  setEnvValue(env2, "ANTHROPIC_API_KEY", config.apiKey);
  setEnvValue(env2, "ANTHROPIC_BASE_URL", config.baseUrl);
  setEnvValue(env2, "ANTHROPIC_MODEL", config.model);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_FABLE_MODEL", config.fableModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_SONNET_MODEL", config.sonnetModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_OPUS_MODEL", config.opusModel);
  setEnvValue(env2, "ANTHROPIC_DEFAULT_HAIKU_MODEL", config.haikuModel);
  setEnvValue(env2, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);
  setEnvValue(env2, "CLAUDE_CODE_SUBAGENT_MODEL_FORCE", "1");
  setTopLevelModel(settings, config.model);
  await commitManagedEnv(settings, env2, extraEnv);
}
async function prepareApiProfileClaudeSettings(name, config) {
  const env2 = {};
  for (const key of CLAUDE_ENV_KEYS) {
    env2[key] = "";
  }
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
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
import { spawn, spawnSync as spawnSync3 } from "child_process";
import {
  chmod as chmod2,
  mkdir as mkdir3,
  readFile as readFile2,
  readdir,
  rename,
  rm as rm2,
  rmdir,
  stat,
  writeFile as writeFile2
} from "fs/promises";
import { createServer } from "net";
import { platform as platform3 } from "os";
import { basename, dirname as dirname2, join as join4, resolve } from "path";
import { createHash as createHash2, randomBytes, randomUUID } from "crypto";

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
    https://auth.openai.com/*|https://auth0.openai.com/*)
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

// src/providers/cliproxyapi/managed.ts
var CLI_PROXY_API_DEFAULTS = {
  fableModel: "gpt-6-astra",
  sonnetModel: "gpt-5.6-terra",
  opusModel: "gpt-5.6-terra",
  haikuModel: "gpt-5.6-luna",
  subagentModel: "claudex-terra-max"
};
var ENV_CLIENT_KEY = "CLAUDEX_CLIPROXYAPI_CLIENT_API_KEY";
var ENV_FABLE_MODEL = "CLAUDEX_CLIPROXYAPI_FABLE_MODEL";
var ENV_SONNET_MODEL = "CLAUDEX_CLIPROXYAPI_SONNET_MODEL";
var ENV_OPUS_MODEL = "CLAUDEX_CLIPROXYAPI_OPUS_MODEL";
var ENV_HAIKU_MODEL = "CLAUDEX_CLIPROXYAPI_HAIKU_MODEL";
var STARTUP_TIMEOUT_MS = 12000;
var LOCK_TIMEOUT_MS = 20000;
var ORPHAN_LOCK_GRACE_MS = 60000;
var LOCK_HEARTBEAT_MS = 1e4;
var LOOPBACK_HOST = "127.0.0.1";
var CODEX_OAUTH_CALLBACK_PORT = 1455;
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
  await mkdir3(path, { recursive: true, mode: 448 });
  try {
    await chmod2(path, 448);
  } catch {}
}
async function writePrivate(path, data) {
  await writeFile2(path, data, { mode: 384 });
  try {
    await chmod2(path, 384);
  } catch {}
}
async function writePrivateOnce(path, data) {
  try {
    await writeFile2(path, data, { mode: 384, flag: "wx" });
    try {
      await chmod2(path, 384);
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
    await chmod2(path, 384);
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
  return {
    apiKey: requireEnvValue(values, ENV_CLIENT_KEY),
    fableModel: values[ENV_FABLE_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.fableModel,
    sonnetModel: values[ENV_SONNET_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.sonnetModel,
    opusModel: values[ENV_OPUS_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.opusModel,
    haikuModel: values[ENV_HAIKU_MODEL]?.trim() || CLI_PROXY_API_DEFAULTS.haikuModel
  };
}
function renderManagedEnv(apiKey) {
  return [
    "# Managed by claudex-switch. Keep this directory private.",
    `${ENV_CLIENT_KEY}=${apiKey}`,
    `${ENV_FABLE_MODEL}=${CLI_PROXY_API_DEFAULTS.fableModel}`,
    `${ENV_SONNET_MODEL}=${CLI_PROXY_API_DEFAULTS.sonnetModel}`,
    `${ENV_OPUS_MODEL}=${CLI_PROXY_API_DEFAULTS.opusModel}`,
    `${ENV_HAIKU_MODEL}=${CLI_PROXY_API_DEFAULTS.haikuModel}`,
    ""
  ].join(`
`);
}
function yaml(value) {
  return JSON.stringify(value);
}
function renderRuntimeConfig(authDir, apiKey, port) {
  return [
    `host: ${yaml(LOOPBACK_HOST)}`,
    `port: ${port}`,
    `auth-dir: ${yaml(authDir)}`,
    "api-keys:",
    `  - ${yaml(apiKey)}`,
    "remote-management:",
    "  allow-remote: false",
    '  secret-key: ""',
    "  disable-control-panel: true",
    "logging-to-file: false",
    "usage-statistics-enabled: false",
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
function createManagedCLIProxyAPIProfileId() {
  return randomUUID();
}
async function initializeManagedCLIProxyAPI(profileId) {
  const paths = profilePaths(profileId);
  await mkdirPrivate(paths.dir);
  await mkdirPrivate(paths.authDir);
  const apiKey = randomBytes(32).toString("base64url");
  await writePrivateOnce(paths.envFile, renderManagedEnv(apiKey));
}
async function readManagedEnv(profileId) {
  const paths = profilePaths(profileId);
  const content = await readFile2(paths.envFile, "utf-8");
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
  await writePrivate(paths.configFile, renderRuntimeConfig(paths.authDir, config.apiKey, port));
  return config;
}
async function isExpectedRuntimeConfig(paths, state, managed) {
  if (!managed)
    return false;
  try {
    const raw = await readFile2(paths.configFile, "utf-8");
    const configuredPort = raw.match(/^port:\s*(\d+)\s*$/m)?.[1];
    const port = state?.port ?? Number(configuredPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      return false;
    return raw === renderRuntimeConfig(paths.authDir, managed.apiKey, port);
  } catch {
    return false;
  }
}
async function getLocalCLIProxyAPISettings(profile, runtime) {
  const config = await readManagedEnv(profile.profileId);
  return {
    apiKey: runtime.apiKey,
    baseUrl: runtime.baseUrl,
    model: resolveLocalCLIProxyAPIDefaultModelFromConfig(profile, config),
    fableModel: config.fableModel,
    sonnetModel: config.sonnetModel,
    opusModel: config.opusModel,
    haikuModel: config.haikuModel,
    subagentModel: CLI_PROXY_API_DEFAULTS.subagentModel
  };
}
async function prepareLocalCLIProxyAPIClaudeSettings(profile, runtime) {
  const config = await getLocalCLIProxyAPISettings(profile, runtime);
  const paths = profilePaths(profile.profileId);
  const env2 = {
    ANTHROPIC_API_KEY: config.apiKey,
    ANTHROPIC_BASE_URL: config.baseUrl,
    ANTHROPIC_AUTH_TOKEN: "",
    ANTHROPIC_MODEL: config.model,
    ANTHROPIC_DEFAULT_FABLE_MODEL: config.fableModel,
    ANTHROPIC_DEFAULT_SONNET_MODEL: config.sonnetModel,
    ANTHROPIC_DEFAULT_OPUS_MODEL: config.opusModel,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: config.haikuModel,
    CLAUDE_CODE_SUBAGENT_MODEL: config.subagentModel,
    CLAUDE_CODE_SUBAGENT_MODEL_FORCE: "1"
  };
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    env2[key] = "";
  }
  for (const [key, value] of Object.entries(normalizeCustomEnv(profile.env))) {
    env2[key] = value;
  }
  await writePrivateJson(paths.claudeSettingsFile, {
    model: config.model,
    env: env2
  });
  return paths.claudeSettingsFile;
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
  return resolveLocalCLIProxyAPIModelFromConfig(input, config);
}
async function resolveManagedLocalCLIProxyAPIDefaultModel(profile) {
  const config = await readExistingManagedEnv(profile.profileId);
  return resolveLocalCLIProxyAPIDefaultModelFromConfig(profile, config);
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
async function verifyManagedCLIProxyAPILive(runtime) {
  const controller = new AbortController;
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${runtime.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        ...credentialHeaders(runtime.apiKey),
        "content-type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: CLI_PROXY_API_DEFAULTS.haikuModel,
        max_tokens: 1,
        messages: [{ role: "user", content: "Reply with OK." }]
      }),
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
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
    const server = createServer();
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
    const server = createServer();
    server.once("error", reject);
    server.listen({ host: LOOPBACK_HOST, port: 0, exclusive: true }, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) {
          reject(error);
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
      return (await readFile2(`/proc/${pid}/cmdline`, "utf-8")).replaceAll("\x00", " ");
    } catch {
      return null;
    }
  }
  try {
    const result = spawnSync3("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    if (result.status !== 0)
      return null;
    return result.stdout.trim() || null;
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
  return command.includes(state.configPath) && command.includes(basename(state.binaryPath));
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
  const token = randomUUID();
  let createdAt = 0;
  await mkdirPrivate(dirname2(lock));
  for (;; ) {
    try {
      await mkdir3(lock, { mode: 448 });
      createdAt = Date.now();
      try {
        await writePrivateJson(join4(lock, "owner.json"), {
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
    const owner = await readJson(join4(lock, "owner.json"), null);
    if (owner?.token !== token || owner.pid !== process.pid)
      return;
    await writePrivateJson(join4(lock, "owner.json"), {
      pid: process.pid,
      token,
      createdAt,
      heartbeatAt: Date.now()
    });
  } catch {}
}
async function removeLockIfOwned(lock, token) {
  try {
    const owner = await readJson(join4(lock, "owner.json"), null);
    if (owner?.token !== token || owner.pid !== process.pid)
      return;
    await rm2(lock, { recursive: true, force: true });
  } catch {}
}
async function canReclaimLock(lock) {
  const owner = await readJson(join4(lock, "owner.json"), null);
  if (owner && Number.isInteger(owner.pid) && owner.pid > 0) {
    return !isPidAlive(owner.pid);
  }
  try {
    const lockStat = await stat(lock);
    return Date.now() - lockStat.mtimeMs > ORPHAN_LOCK_GRACE_MS;
  } catch {
    return false;
  }
}
async function withStartupLock(profileId, action) {
  return withLock(profilePaths(profileId).lock, action);
}
function proxyProcessEnvironment() {
  const env2 = { ...process.env };
  for (const key of [
    "OPENAI_API_KEY",
    "CODEX_API_KEY",
    "CODEX_ACCESS_TOKEN",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN"
  ]) {
    delete env2[key];
  }
  for (const key of Object.keys(env2)) {
    const upper = key.toUpperCase();
    if (upper === "HOME_JWT" || upper === "MANAGEMENT_PASSWORD" || upper === "DEPLOY" || upper.startsWith("PGSTORE_") || upper.startsWith("GITSTORE_") || upper.startsWith("OBJECTSTORE_") || upper.startsWith("DEPLOY_")) {
      delete env2[key];
    }
  }
  return env2;
}
function startProxy(binaryPath, configPath, managedDirectory, spawnCommand = spawn) {
  const proc = spawnCommand(binaryPath, ["-config", configPath], {
    detached: true,
    stdio: "ignore",
    cwd: managedDirectory,
    env: proxyProcessEnvironment()
  });
  proc.on("error", () => {});
  proc.unref?.();
  return proc;
}
function stopChildWeStarted(proc) {
  try {
    if (proc.pid && !proc.killed)
      proc.kill("SIGTERM");
  } catch {}
}
async function ensureManagedCLIProxyAPI(profile) {
  assertProfileId(profile.profileId);
  return withStartupLock(profile.profileId, async () => {
    const paths = profilePaths(profile.profileId);
    const state = await readState(profile.profileId);
    const managed = await readExistingManagedEnv(profile.profileId);
    if (state) {
      const alive = isPidAlive(state.pid);
      const owned = alive && state.binaryPath === profile.binaryPath && state.configPath === paths.configFile && await isOwnedProcess(state);
      if (owned) {
        if (await probeProxy(state.port, managed.apiKey)) {
          return {
            port: state.port,
            baseUrl: baseUrl(state.port),
            apiKey: managed.apiKey
          };
        }
        throw new Error("Managed CLIProxyAPI is running but unhealthy. Run `claudex-switch doctor <alias> --restart` after ending its sessions.");
      }
      if (alive) {
        throw new Error("Refusing to replace CLIProxyAPI state because its PID is not a verified managed process.");
      }
      await rm2(paths.stateFile, { force: true });
    }
    for (let attempt = 0;attempt < 3; attempt += 1) {
      const port = await findAvailablePort();
      await writeRuntimeConfig(profile.profileId, port);
      const proc = startProxy(profile.binaryPath, paths.configFile, paths.dir);
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
        startedAt: Date.now()
      });
      return { port, baseUrl: baseUrl(port), apiKey: managed.apiKey };
    }
    throw new Error("CLIProxyAPI did not become ready. Check `claudex-switch doctor <alias>` after fixing its login or binary.");
  });
}
async function managedCLIProxyAPIHasActiveLeases(profileId) {
  const paths = profilePaths(profileId);
  let entries;
  try {
    entries = await readdir(paths.sessionsDir, { withFileTypes: true });
  } catch {
    return false;
  }
  let active = false;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json"))
      continue;
    const leasePath = join4(paths.sessionsDir, entry.name);
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
    await readExistingManagedEnv(profile.profileId);
    if (!await hasManagedCLIProxyAPILogin(profile.profileId)) {
      throw new Error("No valid CLIProxyAPI ChatGPT login is available. Run `claudex-switch refresh <alias>` before starting Claude Code.");
    }
    await mkdirPrivate(paths.sessionsDir);
    const leasePath = join4(paths.sessionsDir, `${randomUUID()}.json`);
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
    entries = await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }
  const result = [];
  for (const entry of entries) {
    const child = join4(path, entry.name);
    if (entry.isDirectory()) {
      result.push(...await authFiles(child));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".json"))
      continue;
    try {
      if ((await stat(child)).size > 0)
        result.push(child);
    } catch {}
  }
  return result;
}
function collectIdentityValues(value, result = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const identityKey = /^(email|sub|account_?id|user_?id|chatgpt_account_?id|chatgpt_user_?id|organization_?id)$/.test(lower);
    if (identityKey && (typeof child === "string" || typeof child === "number")) {
      result.push(`${lower}=${String(child)}`);
    }
  }
  return result;
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
async function inspectAuthDirectory(authDir) {
  const files = await authFiles(authDir);
  if (files.length !== 1)
    return { valid: false, identity: null };
  try {
    const parsed = JSON.parse(await readFile2(files[0], "utf-8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { valid: false, identity: null };
    }
    const auth = parsed;
    if (auth.type !== "codex" || typeof auth.access_token !== "string" || !auth.access_token.trim()) {
      return { valid: false, identity: null };
    }
    const values = [
      ...collectIdentityValues(auth),
      ...collectIdentityValues(decodeJwtPayload(auth.id_token))
    ].sort();
    if (values.length === 0)
      return { valid: false, identity: null };
    return {
      valid: true,
      identity: createHash2("sha256").update(values.join(`
`)).digest("hex")
    };
  } catch {
    return { valid: false, identity: null };
  }
}
async function hasManagedCLIProxyAPILogin(profileId) {
  return (await inspectAuthDirectory(profilePaths(profileId).authDir)).valid;
}
async function runManagedCLIProxyAPICodexLogin(profile, spawnCommand = spawn, expectedIdentity) {
  assertProfileId(profile.profileId);
  const paths = profilePaths(profile.profileId);
  await mkdirPrivate(CLI_PROXY_API_DIR);
  return withStartupLock(profile.profileId, async () => withLock(CLI_PROXY_API_LOGIN_LOCK, async () => {
    if (await managedCLIProxyAPIHasActiveLeases(profile.profileId)) {
      throw new Error("A Claude Code session launched by claudex-switch is still using this CLIProxyAPI account. End it before refreshing the login.");
    }
    const stagingAuthDir = join4(paths.dir, `.login-${randomUUID()}`);
    const loginConfig = join4(paths.dir, "login-runtime.yaml");
    const apiPort = await findAvailablePort();
    if (!await portIsAvailable(CODEX_OAUTH_CALLBACK_PORT)) {
      throw new Error(`CLIProxyAPI Codex OAuth needs localhost:${CODEX_OAUTH_CALLBACK_PORT}, but that callback port is already in use. Stop the process using it and retry.`);
    }
    await mkdirPrivate(stagingAuthDir);
    const config = await readExistingManagedEnv(profile.profileId);
    await writePrivate(loginConfig, renderRuntimeConfig(stagingAuthDir, config.apiKey, apiPort));
    const shimDir = createOpenShimDir();
    const env2 = proxyProcessEnvironment();
    if (shimDir)
      env2.PATH = `${shimDir}:${env2.PATH ?? ""}`;
    try {
      const proc = spawnCommand(profile.binaryPath, [
        "-config",
        loginConfig,
        "-codex-login"
      ], { stdio: "inherit", cwd: paths.dir, env: env2 });
      const exitCode = await new Promise((resolveCode, reject) => {
        proc.on("close", resolveCode);
        proc.on("error", reject);
      });
      const staged = await inspectAuthDirectory(stagingAuthDir);
      if (exitCode !== 0 || !staged.valid || !staged.identity) {
        return { success: false, identity: null, identityMismatch: false };
      }
      if (expectedIdentity && staged.identity !== expectedIdentity) {
        return {
          success: false,
          identity: staged.identity,
          identityMismatch: true
        };
      }
      await stopManagedCLIProxyAPIUnlocked(profile);
      const backup = join4(paths.dir, `.auth-backup-${randomUUID()}`);
      let movedCurrent = false;
      try {
        if (await fileExists(paths.authDir)) {
          await rename(paths.authDir, backup);
          movedCurrent = true;
        }
        await rename(stagingAuthDir, paths.authDir);
        if (movedCurrent)
          await rm2(backup, { recursive: true, force: true });
      } catch (err) {
        if (movedCurrent && !await fileExists(paths.authDir)) {
          try {
            await rename(backup, paths.authDir);
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
  const running = Boolean(state && state.binaryPath === profile.binaryPath && state.configPath === paths.configFile && await isOwnedProcess(state));
  const healthy = options.probe && running && state && managed ? await probeProxy(state.port, managed.apiKey) : null;
  return {
    installed: Boolean(findCLIProxyAPIBinary(profile.binaryPath)),
    loggedIn: await hasManagedCLIProxyAPILogin(profile.profileId),
    environmentValid: managed !== null,
    running,
    configured,
    healthy,
    port: state?.port ?? null
  };
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
    await rmdir(dirname2(paths.lock));
  } catch {}
}
function commandWorks(command) {
  try {
    return spawnSync3(command, ["--help"], {
      stdio: "ignore"
    }).status === 0;
  } catch {
    return false;
  }
}
function resolvedCommand(command) {
  if (command.includes("/") || command.includes("\\")) {
    return resolve(command);
  }
  const locator = platform3() === "win32" ? "where" : "which";
  try {
    const result = spawnSync3(locator, [command], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const first = result.stdout.trim().split(/\r?\n/)[0]?.trim();
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
  return provider === "claude" ? source_default.magenta("Claude") : source_default.green("Codex");
}
function maskKey(key) {
  if (key.length <= 12)
    return "••••";
  return key.slice(0, 7) + "••••" + key.slice(-4);
}
function formatUsage(usage, note) {
  if (usage) {
    const parts = [];
    if (usage.fiveHourUsedPercent !== null) {
      parts.push(`${source_default.dim("5h")} ${colorRemaining(100 - usage.fiveHourUsedPercent)}`);
    }
    if (usage.weeklyUsedPercent !== null) {
      parts.push(`${source_default.dim("wk")} ${colorRemaining(100 - usage.weeklyUsedPercent)}`);
    }
    if (parts.length > 0)
      return parts.join(source_default.dim(" · "));
  }
  return note ? source_default.dim(note) : "";
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
  const dollars = (v) => `$${v.toFixed(2)}`;
  if (side.unlimited) {
    return side.usedUsd === null ? source_default.dim("∞") : source_default.dim(`${dollars(side.usedUsd)} used`);
  }
  if (side.remainingUsd === null)
    return "";
  const colored = side.remainingUsd >= 10 ? source_default.green(dollars(side.remainingUsd)) : side.remainingUsd >= 1 ? source_default.yellow(dollars(side.remainingUsd)) : source_default.red(dollars(side.remainingUsd));
  return `${colored} ${source_default.dim("left")}`;
}

// src/providers/claude/profiles.ts
var PROFILE_CONFIG_LINK_EXCLUDES = new Set([
  ".credentials.json",
  ".claude.json",
  "backups"
]);
async function ensureDir2(path) {
  await mkdir4(path, { recursive: true });
}
async function ensurePrivateDir(path) {
  await mkdir4(path, { recursive: true, mode: 448 });
  try {
    await chmod3(path, 448);
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
  const current = await readProfileData(name);
  const fields = patch.fields ?? {};
  const pick = (key, fallback) => (key in fields) ? fields[key] : fallback;
  const env2 = patch.env === undefined ? current.env : patch.env;
  let next;
  if (current.type === "api-key") {
    next = normalizeApiKeyProfileData({
      apiKey: pick("apiKey", current.apiKey) ?? "",
      baseUrl: pick("baseUrl", current.baseUrl),
      authToken: pick("authToken", current.authToken),
      model: pick("model", current.model),
      defaultFableModel: pick("defaultFableModel", current.defaultFableModel),
      defaultSonnetModel: pick("defaultSonnetModel", current.defaultSonnetModel),
      defaultOpusModel: pick("defaultOpusModel", current.defaultOpusModel),
      defaultHaikuModel: pick("defaultHaikuModel", current.defaultHaikuModel),
      subagentModel: pick("subagentModel", current.subagentModel),
      env: env2
    });
    if (!next.apiKey) {
      throw new Error("API key cannot be empty");
    }
  } else if (current.type === "local-cliproxyapi") {
    const defaultModel = normalizeOptionalValue(pick("defaultModel", current.defaultModel));
    if (!defaultModel) {
      throw new Error("Default model cannot be empty");
    }
    const { env: _previousEnv, ...rest } = current;
    next = { ...rest, defaultModel, ...withCustomEnv(env2) };
  } else {
    next = normalizeOAuthProfileData({
      defaultModel: pick("defaultModel", current.defaultModel),
      env: env2
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
async function updateLocalCLIProxyAPIProfileIdentity(name, authIdentity) {
  const current = await readProfileData(name);
  if (current.type !== "local-cliproxyapi") {
    throw new Error(`Profile "${name}" is not a local CLIProxyAPI profile`);
  }
  await writeProfileData(name, { ...current, authIdentity });
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
    entries = await readdir2(CLAUDE_DIR, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (PROFILE_CONFIG_LINK_EXCLUDES.has(entry.name))
      continue;
    const source = join5(CLAUDE_DIR, entry.name);
    const destination = join5(configDir, entry.name);
    const type = entry.isDirectory() ? process.platform === "win32" ? "junction" : "dir" : "file";
    await ensureSymlinkOrCopy(source, destination, type);
  }
}
async function ensureSymlinkOrCopy(source, destination, type) {
  try {
    const stat2 = await lstat(destination);
    if (!stat2.isSymbolicLink())
      return;
    const existing = await readlink(destination);
    if (existing === source)
      return;
    await unlink(destination);
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
function withCustomEnv(env2) {
  const normalized = normalizeCustomEnv(env2);
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
import { mkdir as mkdir6 } from "fs/promises";

// src/providers/codex/config.ts
import { chmod as chmod4, mkdir as mkdir5, readFile as readFile3, writeFile as writeFile3 } from "fs/promises";
import { dirname as dirname3 } from "path";

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
  let current = "";
  for (let i = 0;i < inner.length; i++) {
    const ch = inner[i];
    if (inString) {
      current += ch;
      if (ch === "\\" && i + 1 < inner.length) {
        current += inner[++i];
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      current += ch;
    } else if (ch === "[") {
      depth++;
      current += ch;
    } else if (ch === "]") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      elements.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim())
    elements.push(current);
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
    let result = "";
    let i = 1;
    while (i < raw.length && raw[i] !== '"') {
      if (raw[i] === "\\" && i + 1 < raw.length) {
        i++;
        if (raw[i] === "n")
          result += `
`;
        else if (raw[i] === "t")
          result += "\t";
        else
          result += raw[i];
      } else {
        result += raw[i];
      }
      i++;
    }
    return result;
  }
  const num = Number(raw);
  if (!Number.isNaN(num) && raw !== "")
    return num;
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
  const result = [];
  for (const rawEl of splitArrayElements(inner)) {
    const el = rawEl.trim();
    if (!el)
      return null;
    const isQuoted = el.length >= 2 && (el.startsWith('"') && el.endsWith('"') || el.startsWith("'") && el.endsWith("'"));
    if (isQuoted || el === "true" || el === "false" || SCALAR_NUMBER_RE.test(el)) {
      result.push(parseValue(el));
    } else {
      return null;
    }
  }
  return result;
}
function ensureTable(root, keys) {
  let current = root;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  return current;
}
function parseToml(input) {
  const root = {};
  let current = root;
  for (const raw of input.split(/\r?\n/)) {
    const commentIdx = findCommentStart(raw);
    const line = (commentIdx >= 0 ? raw.slice(0, commentIdx) : raw).trim();
    if (!line)
      continue;
    const headerMatch = line.match(/^\[(.+)\]$/);
    if (headerMatch) {
      current = ensureTable(root, parseKeyPath(headerMatch[1]));
      continue;
    }
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1)
      continue;
    const keyPart = line.slice(0, eqIdx).trim();
    const valuePart = line.slice(eqIdx + 1).trim();
    const key = keyPart.startsWith('"') ? parseValue(keyPart) : keyPart;
    current[key] = parseValue(valuePart);
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
    const content = await readFile3(CODEX_CONFIG_FILE, "utf-8");
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
async function activateCodexOfficialProvider(defaultModel) {
  const config = await fileExists(CODEX_CONFIG_FILE) ? await readCodexConfig() : {};
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
  await writeCodexConfig(config);
}
async function activateCodexCustomProvider(provider, apiKey, defaultModel) {
  if (provider.type !== "custom" || !provider.name || !provider.base_url || !provider.env_key) {
    throw new Error("Invalid Codex custom provider config");
  }
  const config = await readCodexConfig();
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
  await writeCodexConfig(config);
}
async function applyCodexApiProvider(provider, apiKey, defaultModel) {
  if (!provider || provider.type === "official") {
    await activateCodexOfficialProvider(defaultModel);
    return;
  }
  await activateCodexCustomProvider(provider, apiKey, defaultModel);
}
async function repairCodexStringifiedArrays() {
  if (!await fileExists(CODEX_CONFIG_FILE))
    return false;
  const content = await readFile3(CODEX_CONFIG_FILE, "utf-8");
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
    await writeFile3(CODEX_CONFIG_FILE, lines.join(`
`), { mode: 384 });
  }
  return changed;
}
async function writeCodexConfig(config) {
  const content = renderCodexConfig(config);
  try {
    if (await readFile3(CODEX_CONFIG_FILE, "utf-8") === content) {
      await chmod4(CODEX_CONFIG_FILE, 384);
      return;
    }
  } catch {}
  await mkdir5(dirname3(CODEX_CONFIG_FILE), { recursive: true });
  await writeFile3(CODEX_CONFIG_FILE, content, { mode: 384 });
  await chmod4(CODEX_CONFIG_FILE, 384);
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
  await mkdir6(CODEX_ACCOUNTS_DIR, { recursive: true });
}
async function loadRegistry() {
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
  if (changed) {
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

// src/commands/add.ts
import { spawn as spawn3, spawnSync as spawnSync4 } from "child_process";
import { platform as platform4 } from "os";

// src/accounts/create.ts
import { createHash as createHash3 } from "crypto";

// src/providers/codex/auth.ts
import { chmod as chmod5, copyFile as copyFile2, mkdir as mkdir7, readFile as readFile4, rename as rename2, unlink as unlink2, writeFile as writeFile4 } from "fs/promises";
import { randomUUID as randomUUID2 } from "crypto";
import { dirname as dirname4 } from "path";
async function ensureAccountsDir2() {
  await mkdir7(CODEX_ACCOUNTS_DIR, { recursive: true });
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
  const srcContent = await readFile4(srcPath, "utf-8");
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
    if (await readFile4(path, "utf-8") === content) {
      await chmod5(path, 384);
      return;
    }
  } catch {}
  await writeRawAuthFile(path, content);
}
async function writeRawAuthFile(path, content) {
  await mkdir7(dirname4(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${randomUUID2()}.tmp`;
  try {
    await writeFile4(tempPath, content, { mode: 384 });
    await rename2(tempPath, path);
    await chmod5(path, 384);
  } catch (err) {
    try {
      await unlink2(tempPath);
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
    const str = (v) => typeof v === "string" ? v : undefined;
    return {
      email: str(payload.email) ?? str(profileInfo.email),
      chatgpt_user_id: str(authInfo.chatgpt_user_id) ?? str(authInfo.user_id) ?? str(payload.sub),
      chatgpt_account_id: str(authInfo.chatgpt_account_id) ?? str(authInfo.account_id) ?? str(payload.account_id),
      plan_type: str(authInfo.chatgpt_plan_type) ?? str(authInfo.plan_type)
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
  const identity = decodeIdToken(auth.tokens.id_token);
  const userId = identity?.chatgpt_user_id;
  const accountId = identity?.chatgpt_account_id ?? auth.tokens.account_id;
  if (userId && accountId) {
    return userId === account.chatgpt_user_id && accountId === account.chatgpt_account_id;
  }
  return Boolean(identity?.email && account.email && identity.email.toLowerCase() === account.email.toLowerCase());
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
    await unlink2(path);
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
  const keyHash = createHash3("sha256").update(apiKey.trim()).digest("hex").slice(0, 16);
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
import { chmod as chmod6, copyFile as copyFile3, mkdtemp, readFile as readFile5, rm as rm4, writeFile as writeFile5 } from "fs/promises";
import { tmpdir as tmpdir2 } from "os";
import { join as join6 } from "path";
var AUTH_FILE_NAME = "auth.json";
async function prepareIsolatedCodexHome(auth = null) {
  const home = await mkdtemp(join6(tmpdir2(), "claudex-codex-"));
  await chmod6(home, 448);
  if (await fileExists(CODEX_CONFIG_FILE)) {
    await copyFile3(CODEX_CONFIG_FILE, join6(home, "config.toml"));
  }
  if (auth) {
    await writeFile5(join6(home, AUTH_FILE_NAME), JSON.stringify(auth, null, 2), { mode: 384 });
  }
  return home;
}
async function readIsolatedCodexAuth(home) {
  try {
    return JSON.parse(await readFile5(join6(home, AUTH_FILE_NAME), "utf-8"));
  } catch {
    return null;
  }
}
async function cleanupIsolatedCodexHome(home) {
  await rm4(home, { recursive: true, force: true });
}

// src/providers/codex/login.ts
async function runIsolatedCodexLogin() {
  const codexHome = await prepareIsolatedCodexHome();
  const shimDir = createOpenShimDir();
  const env2 = { ...process.env, CODEX_HOME: codexHome };
  if (shimDir)
    env2.PATH = `${shimDir}:${process.env.PATH}`;
  delete env2.OPENAI_API_KEY;
  delete env2.CODEX_API_KEY;
  delete env2.CODEX_ACCESS_TOKEN;
  try {
    const proc = spawn2("codex", ["login", "-c", 'cli_auth_credentials_store="file"'], { stdio: "inherit", env: env2 });
    const exitCode = await new Promise((resolve2, reject) => {
      proc.on("close", resolve2);
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
import { mkdir as mkdir8 } from "fs/promises";
import { dirname as dirname5 } from "path";
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
    const usage = await getJson(`${origin}${prefix}/dashboard/billing/usage?start_date=${day(start)}&end_date=${day(end)}`, headers);
    const usedUsd = typeof usage?.total_usage === "number" ? usage.total_usage / 100 : null;
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
  await mkdir8(dirname5(RELAYS_FILE), { recursive: true });
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

// src/commands/add.ts
function readClaudeAuthStatus() {
  const result = spawnSync4("claude", ["auth", "status"], {
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
      success(`${source_default.bold(alias)} created from current Claude session`);
      blank();
      return;
    }
    if (authStatus?.loggedIn) {
      info("Logging out current Claude session...");
      blank();
      const logout = spawnSync4("claude", ["auth", "logout"], {
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
  const proc = spawn3("claude", ["auth", "login"], { stdio: "inherit", env: env2 });
  const exitCode = await new Promise((resolve2) => proc.on("close", resolve2));
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
  success(`${source_default.bold(alias)} created`);
  blank();
}
async function addClaudeApiKey(alias) {
  const config = await promptClaudeApiConfig();
  await createClaudeApiKeyAccount({ alias, ...config });
  blank();
  success(`${source_default.bold(alias)} created  ${source_default.dim(maskKey(config.apiKey))}`);
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
    const login = await runManagedCLIProxyAPICodexLogin({
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
    success(`${source_default.bold(alias)} created  ${source_default.dim("ChatGPT via local CLIProxyAPI")}`);
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
  if (platform4() === "darwin" && hasHomebrew()) {
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
    return spawnSync4("brew", ["--version"], { stdio: "ignore" }).status === 0;
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
      success(`Relay account balance: ${formatBalanceSide(balance)}`);
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
  const codexCheck = spawnSync4("codex", ["--version"], {
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
  success(`${source_default.bold(alias)} created  ${source_default.dim(email)}`);
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
  success(`${source_default.bold(alias)} created  ${source_default.dim(maskKey(key))}`);
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
import { execFile } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import {
  open,
  readdir as readdir3,
  realpath,
  rename as rename3,
  rm as rm5,
  stat as stat2,
  utimes
} from "fs/promises";
import { join as join7 } from "path";
import { pipeline } from "stream/promises";
import { promisify } from "util";
var SESSION_DIRS = ["sessions", "archived_sessions"];
var STATE_DB_CANDIDATES = [
  join7("sqlite", "state_5.sqlite"),
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
      entries = await readdir3(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = join7(dir, entry.name);
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
  const handle = await open(filePath, "r");
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
  const record = parsed;
  if (record?.type !== "session_meta" || typeof record.payload !== "object" || record.payload === null) {
    return null;
  }
  const current = record.payload.model_provider;
  if (current === targetProvider)
    return null;
  if (typeof current === "string" && current !== "" && !managedProviders.has(current.toLowerCase())) {
    return null;
  }
  record.payload.model_provider = targetProvider;
  return JSON.stringify(record);
}
async function rewriteRolloutProvider(filePath, targetProvider, managedProviders) {
  const first = await readFirstLine(filePath);
  if (!first)
    return false;
  const updatedLine = rewriteSessionMetaLine(first.line, targetProvider, managedProviders);
  if (updatedLine === null)
    return false;
  const { mode, size, atime, mtime } = await stat2(filePath);
  const tmpPath = `${filePath}.claudex-sync.${process.pid}.tmp`;
  try {
    const out = createWriteStream(tmpPath, { mode });
    await new Promise((resolve2, reject) => {
      out.write(updatedLine + first.separator, (err) => err ? reject(err) : resolve2());
    });
    if (first.restOffset < size) {
      await pipeline(createReadStream(filePath, { start: first.restOffset }), out);
    } else {
      await new Promise((resolve2, reject) => {
        out.end((err) => err ? reject(err) : resolve2());
      });
    }
    await rename3(tmpPath, filePath);
    await utimes(filePath, atime, mtime).catch(() => {});
    return true;
  } catch (err) {
    await rm5(tmpPath, { force: true }).catch(() => {});
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
var execFileAsync = promisify(execFile);
function sqlQuote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
async function updateProvidersViaSqliteCli(dbPath, targetProvider, managedProviders) {
  const target = sqlQuote(targetProvider);
  const managed = [...managedProviders].map((name) => sqlQuote(name.toLowerCase())).join(", ");
  const { stdout } = await execFileAsync("sqlite3", [
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
    const fullPath = join7(CODEX_DIR, candidate);
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
  const open2 = new Set;
  for (const line of stdout.split(`
`)) {
    if (line.startsWith("n") && line.endsWith(".jsonl")) {
      open2.add(line.slice(1));
    }
  }
  return open2;
}
var LSOF_CHUNK_SIZE = 100;
async function scanOpenFiles(paths) {
  const byRealPath = new Map;
  for (const path of paths) {
    try {
      byRealPath.set(await realpath(path), path);
    } catch {
      byRealPath.set(path, path);
    }
  }
  const openReal = new Set;
  for (let i = 0;i < paths.length; i += LSOF_CHUNK_SIZE) {
    const chunk = paths.slice(i, i + LSOF_CHUNK_SIZE);
    try {
      const { stdout, stderr } = await execFileAsync("lsof", ["-w", "-Fn", "--", ...chunk], { maxBuffer: 16777216 });
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
  const open2 = new Set;
  for (const real of openReal) {
    open2.add(byRealPath.get(real) ?? real);
  }
  return { ok: true, paths: open2 };
}
async function anyCodexProcessRunning() {
  try {
    await execFileAsync("pgrep", ["-f", "codex"]);
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
    const root = join7(CODEX_DIR, dirName);
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
  if (entry.target.provider === "claude") {
    await switchClaude(entry.alias, entry.target.profileName);
  } else {
    await switchCodex(entry.alias, entry.target.accountKey);
  }
  return entry;
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
    label = source_default.dim("CLIProxyAPI · local ChatGPT login");
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
  success(`Switched to ${source_default.bold(alias)}  ${formatProvider("codex")}  ${plan}  ${email}`);
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
    const result = await syncCodexSessionProviders(targetProvider, managedProviders);
    if (result.rolloutFilesUpdated > 0 || result.sqliteRowsUpdated > 0) {
      info(`Synced ${result.rolloutFilesUpdated} session file(s) and ${result.sqliteRowsUpdated} thread row(s) to provider "${targetProvider}"`);
      hint("Sessions from both API and subscription could be /resume now.");
    }
  } catch {}
}

// src/commands/run.ts
import { spawn as spawn4 } from "child_process";

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
  sol: "gpt-5.6-sol",
  terra: "gpt-5.6-terra",
  luna: "gpt-5.6-luna"
};
function isModelEffort(value) {
  return value !== undefined && MODEL_EFFORT_LEVELS.has(value.toLowerCase());
}
function providerEffortLevels(provider) {
  return provider === "claude" ? CLAUDE_EFFORT_LEVELS : CODEX_EFFORT_LEVELS;
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
      return "claude-fable-5";
    }
    const match2 = trimmed.match(CLAUDE_SHORTHAND);
    if (match2) {
      const series = (match2[1] ?? "opus").toLowerCase();
      const version = match2[2].replace(/\./g, "-");
      return `claude-${series}-${version}`;
    }
    return trimmed;
  }
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
  const normalizedModel = profile?.type === "local-cliproxyapi" ? await resolveManagedLocalCLIProxyAPIModel(profile, modelPart) : resolveModelShorthand(entry.target.provider, modelPart);
  let authMode;
  try {
    authMode = await updateDefaultModel(entry, normalizedModel);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
  blank();
  success(`Updated ${source_default.bold(entry.alias)}  ${formatProvider(entry.target.provider)}  ${formatType(authMode)}  ${source_default.dim(normalizedModel)}`);
  blank();
}

// src/commands/run.ts
var RUN_FLAGS = new Set(["-run", "--run"]);
var HEADER_FLAGS = new Set(["--attribution-header"]);
var MODEL_FLAGS = new Set(["-model", "--model"]);
var CLAUDE_ATTRIBUTION_HEADER_ENV = "CLAUDE_CODE_ATTRIBUTION_HEADER";
function isRunFlag(value) {
  return value !== undefined && RUN_FLAGS.has(value);
}
async function runAliasSession(aliasOrName, forwardedArgs = [], spawnCommand = spawn4) {
  const runOptions = parseRunArgumentOptions(forwardedArgs);
  const entry = await resolveAliasOrExit(aliasOrName);
  if (runOptions.effortOverride) {
    const valid = providerEffortLevels(entry.target.provider);
    if (!valid.has(runOptions.effortOverride)) {
      error(`${entry.target.provider === "claude" ? "Claude" : "Codex"} doesn't support effort "${runOptions.effortOverride}".`);
      hint(`Valid tiers: ${[...valid].join(", ")}`);
      blank();
      process.exit(1);
    }
  }
  const claudeProfileName = entry.target.provider === "claude" ? entry.target.profileName : null;
  const isClaude = claudeProfileName !== null;
  let profile = claudeProfileName ? await getProfileData(claudeProfileName) : null;
  const resolvedModel = runOptions.modelOverride ? profile?.type === "local-cliproxyapi" ? await resolveManagedLocalCLIProxyAPIModel(profile, runOptions.modelOverride) : resolveModelShorthand(entry.target.provider, runOptions.modelOverride) : profile?.type === "oauth" || profile?.type === "local-cliproxyapi" ? profile.type === "local-cliproxyapi" ? await resolveManagedLocalCLIProxyAPIDefaultModel(profile) : profile.defaultModel : undefined;
  if (runOptions.modelOverride && resolvedModel) {
    await updateDefaultModel(entry, resolvedModel);
    if (claudeProfileName) {
      profile = await getProfileData(claudeProfileName);
    }
  }
  const isolatedClaudeApi = profile?.type === "api-key";
  const isolatedClaudeOAuth = isClaude && profile?.type === "oauth";
  const isolatedLocalCLIProxyAPI = isClaude && profile?.type === "local-cliproxyapi";
  if (!isClaude) {
    await use(aliasOrName);
    try {
      if (await repairCodexStringifiedArrays()) {
        info("Repaired stringified arrays in ~/.codex/config.toml");
      }
    } catch {}
  }
  let secureStorageDir;
  let configDir;
  let settingsNeutralizer = null;
  let localSettingsFile;
  let localLease;
  if (isolatedClaudeOAuth && claudeProfileName) {
    try {
      const context = await prepareIsolatedOAuthRun(claudeProfileName);
      secureStorageDir = context.secureStorageDir;
      configDir = context.configDir;
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
      const context = await prepareIsolatedLocalCLIProxyAPIRun(claudeProfileName);
      secureStorageDir = context.secureStorageDir;
      configDir = context.configDir;
      localLease = await acquireManagedCLIProxyAPILease({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath
      });
      const runtime = await ensureManagedCLIProxyAPI({
        profileId: profile.profileId,
        binaryPath: profile.binaryPath
      });
      localSettingsFile = await prepareLocalCLIProxyAPIClaudeSettings(profile, runtime);
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
  const command = isClaude ? "claude" : "codex";
  const defaultPermissionArgs = isClaude ? ["--permission-mode", "auto"] : ["--dangerously-bypass-approvals-and-sandbox"];
  const effortArgs = runOptions.effortOverride ? isClaude ? ["--effort", runOptions.effortOverride] : ["-c", `model_reasoning_effort=${runOptions.effortOverride}`] : [];
  const args = [
    ...isolatedClaudeApi ? ["--bare"] : [],
    ...defaultPermissionArgs,
    ...resolvedModel ? ["--model", resolvedModel] : [],
    ...effortArgs,
    ...localSettingsFile ? ["--settings", localSettingsFile] : [],
    ...settingsNeutralizer ? ["--settings", settingsNeutralizer] : [],
    ...runOptions.forwardedArgs
  ];
  const env2 = await getRunEnvironment(entry, profile, runOptions.headerEnabled, secureStorageDir, configDir);
  info(`Running ${source_default.cyan([command, ...args].join(" "))}`);
  return new Promise((resolve2) => {
    let settled = false;
    const finish = async (code) => {
      if (settled)
        return;
      settled = true;
      try {
        await localLease?.release();
      } catch {}
      resolve2(code);
    };
    let proc;
    try {
      proc = spawnCommand(command, args, { stdio: "inherit", env: env2 });
    } catch (err) {
      error(`Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`);
      blank();
      finish(1);
      return;
    }
    proc.on("error", (err) => {
      error(`Failed to start ${command}: ${err instanceof Error ? err.message : String(err)}`);
      blank();
      finish(1);
    });
    proc.on("close", (code) => {
      (async () => {
        if (isolatedClaudeOAuth && claudeProfileName) {
          try {
            await syncIsolatedOAuthSnapshot(claudeProfileName);
          } catch {}
        } else if (!isClaude) {
          try {
            await syncActiveAuthSnapshot(await loadRegistry());
          } catch {}
        }
        await finish(code ?? 1);
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
function parseRunArgumentOptions(args) {
  const forwardedArgs = [];
  let modelOverride;
  let effortOverride;
  let headerEnabled;
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
    forwardedArgs.push(arg);
  }
  return { forwardedArgs, modelOverride, effortOverride, headerEnabled };
}
function buildClaudeOAuthEnvironment(secureStorageDir, configDir, extraEnv) {
  if (!secureStorageDir && !configDir && !CLAUDE_ENV_KEYS.some((key) => process.env[key]) && Object.keys(normalizeCustomEnv(extraEnv)).length === 0) {
    return;
  }
  const env2 = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env2[key];
  }
  applyCustomEnv(env2, extraEnv);
  if (secureStorageDir) {
    env2.CLAUDE_SECURESTORAGE_CONFIG_DIR = secureStorageDir;
  }
  if (configDir) {
    env2.CLAUDE_CONFIG_DIR = configDir;
  }
  return env2;
}
function buildClaudeApiEnvironment(config) {
  const env2 = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env2[key];
  }
  setOptionalEnv(env2, "ANTHROPIC_API_KEY", config.apiKey);
  setOptionalEnv(env2, "ANTHROPIC_BASE_URL", config.baseUrl);
  setOptionalEnv(env2, "ANTHROPIC_AUTH_TOKEN", config.authToken);
  setOptionalEnv(env2, "ANTHROPIC_MODEL", config.model);
  setOptionalEnv(env2, "ANTHROPIC_DEFAULT_FABLE_MODEL", config.defaultFableModel);
  setOptionalEnv(env2, "ANTHROPIC_DEFAULT_SONNET_MODEL", config.defaultSonnetModel);
  setOptionalEnv(env2, "ANTHROPIC_DEFAULT_OPUS_MODEL", config.defaultOpusModel);
  setOptionalEnv(env2, "ANTHROPIC_DEFAULT_HAIKU_MODEL", config.defaultHaikuModel);
  setOptionalEnv(env2, "CLAUDE_CODE_SUBAGENT_MODEL", config.subagentModel);
  applyCustomEnv(env2, config.env);
  return env2;
}
function buildClaudeLocalCLIProxyAPIEnvironment(secureStorageDir, configDir, extraEnv) {
  const env2 = { ...process.env };
  for (const key of CLAUDE_ENV_KEYS) {
    delete env2[key];
  }
  for (const key of CLAUDE_LOCAL_PROXY_NEUTRALIZED_ENV_KEYS) {
    delete env2[key];
  }
  applyCustomEnv(env2, extraEnv);
  if (secureStorageDir) {
    env2.CLAUDE_SECURESTORAGE_CONFIG_DIR = secureStorageDir;
  }
  if (configDir) {
    env2.CLAUDE_CONFIG_DIR = configDir;
  }
  return env2;
}
function applyCustomEnv(env2, extraEnv) {
  for (const [key, value] of Object.entries(normalizeCustomEnv(extraEnv))) {
    env2[key] = value;
  }
}
function applyClaudeAttributionHeader(baseEnv, headerEnabled) {
  if (headerEnabled === undefined) {
    return baseEnv;
  }
  const env2 = baseEnv ? { ...baseEnv } : { ...process.env };
  if (headerEnabled) {
    delete env2[CLAUDE_ATTRIBUTION_HEADER_ENV];
    return env2;
  }
  env2[CLAUDE_ATTRIBUTION_HEADER_ENV] = "0";
  return env2;
}
function setOptionalEnv(env2, key, value) {
  if (value) {
    env2[key] = value;
    return;
  }
  delete env2[key];
}

// src/providers/claude/usage.ts
var USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
var TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
var CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
var EXPIRY_SKEW_MS = 60000;
var FETCH_TIMEOUT_MS2 = 5000;
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
  let refreshed = false;
  if (expiresAt(creds) - EXPIRY_SKEW_MS < Date.now()) {
    const result = await refreshOAuthToken(creds);
    if (result === "denied")
      return { usage: null, note: "login expired" };
    if (result === "unavailable")
      return { usage: null, note: "usage n/a" };
    await persist(result);
    creds = result;
    refreshed = true;
  }
  let response = await requestUsage(creds.claudeAiOauth.accessToken);
  if (response === "unauthorized" && !refreshed) {
    const result = await refreshOAuthToken(creds);
    if (result === "denied")
      return { usage: null, note: "login expired" };
    if (result === "unavailable")
      return { usage: null, note: "usage n/a" };
    await persist(result);
    response = await requestUsage(result.claudeAiOauth.accessToken);
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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS2)
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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS2)
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

// src/providers/codex/app-server.ts
import { spawn as spawn5 } from "child_process";
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
    await new Promise((resolve2) => serverWaiters.push(resolve2));
  }
  activeServers += 1;
  return () => {
    activeServers -= 1;
    serverWaiters.shift()?.();
  };
}
async function readCodexRateLimits(auth, spawnAppServer = spawn5) {
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
  const env2 = { ...process.env, CODEX_HOME: codexHome };
  delete env2.OPENAI_API_KEY;
  delete env2.CODEX_API_KEY;
  delete env2.CODEX_ACCESS_TOKEN;
  return new Promise((resolve2, reject) => {
    const proc = spawnAppServer("codex", ["app-server", "-c", 'cli_auth_credentials_store="file"'], { stdio: ["pipe", "pipe", "pipe"], env: env2 });
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
        resolve2(response ?? {});
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
    const usage = parseRateLimitsResponse(response);
    const plan = parseRateLimitsPlan(response);
    return usage ? { usage, note: null, plan } : { usage: null, note: "usage n/a", plan };
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
  const claudeState = await readState2();
  let codexReg = null;
  try {
    codexReg = await loadRegistry();
    await syncActiveAuthSnapshot(codexReg);
  } catch {}
  const codexUsage = withUsage && codexReg?.api?.usage !== false;
  const [claudeInfos, codexInfos] = await Promise.all([
    Promise.all(claudeAliases.map((entry) => getClaudeAccountInfo(entry, claudeState.active, withUsage))),
    Promise.all(codexAliases.map((entry) => getCodexAccountInfo(entry, codexReg, codexUsage, options.codexUsageFetcher ?? fetchCodexUsage)))
  ]);
  await persistDisplayedCodexPlans(codexAliases, codexInfos, codexReg);
  blank();
  console.log(header("  Accounts"));
  if (claudeInfos.length > 0) {
    blank();
    sectionHeader("Claude");
    renderSection(claudeInfos);
  }
  if (codexInfos.length > 0) {
    blank();
    sectionHeader("Codex");
    renderSection(codexInfos);
  }
  const anyUsage = [...claudeInfos, ...codexInfos].some((info2) => info2.usage);
  if (anyUsage) {
    blank();
    hint("5h/wk = remaining quota in the 5-hour / weekly window");
  }
  blank();
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
    const model2 = info2.defaultModel ? `  ${source_default.dim(info2.defaultModel)}` : "";
    const usage = formatUsage(info2.usage, info2.usageNote);
    const balance = formatBalance(info2.balance);
    const quota = usage || balance;
    const quotaStr = quota ? `  ${quota}` : "";
    console.log(`  ${icon} ${paddedName}  ${type}  ${plan}  ${email}${apiProvider}${model2}${quotaStr}`);
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
    balance: null
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
      info2.apiProvider = status.loggedIn ? !status.environmentValid ? "CLIProxyAPI · invalid private env" : !status.configured ? "CLIProxyAPI · invalid config" : status.running ? "CLIProxyAPI · running" : "CLIProxyAPI · stopped" : "CLIProxyAPI · login required";
      info2.usageNote = "quota unavailable";
    } else if (profileData.type === "api-key" && profileData.apiKey) {
      info2.plan = maskKey(profileData.apiKey);
      if (withUsage && profileData.baseUrl) {
        info2.balance = await fetchRelayBalance(profileData.baseUrl, profileData.apiKey);
      }
    } else {
      const account = await readJson(claudeProfileAccountFile(profileName), null);
      info2.email = account?.emailAddress ?? null;
      if (withUsage) {
        const result = await fetchClaudeUsage(profileName, isActive);
        info2.usage = result.usage;
        info2.usageNote = result.note;
      }
      const creds = await readFreshestOAuthCredentials(profileName, isActive);
      info2.plan = creds?.claudeAiOauth?.subscriptionType ?? null;
    }
  } catch {}
  return info2;
}
async function getCodexAccountInfo(entry, codexReg, withUsage, codexUsageFetcher) {
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
      balance: null
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
    balance: null
  };
  let serverPlan = null;
  if (withUsage) {
    if (account.auth_mode === "apikey") {
      const baseUrl2 = account.api_provider?.base_url;
      if (baseUrl2) {
        const auth = await readAccountAuth(accountKey);
        if (auth?.OPENAI_API_KEY) {
          info2.balance = await fetchRelayBalance(baseUrl2, auth.OPENAI_API_KEY);
        }
      }
    } else {
      const result = await codexUsageFetcher(accountKey, isActive);
      info2.usage = result.usage;
      info2.usageNote = result.note;
      serverPlan = result.plan ?? null;
    }
  }
  if (account.auth_mode !== "apikey") {
    info2.plan = serverPlan ?? info2.plan;
    const auth = await readAccountAuth(accountKey);
    if (auth?.auth_mode === "chatgpt") {
      info2.plan = serverPlan ?? decodeCodexPlan(auth.tokens) ?? info2.plan;
    }
  }
  return info2;
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
  success(`${source_default.bold(aliasName)} alias removed`);
  blank();
}

// src/commands/rename.ts
async function rename4(currentAlias, nextAlias) {
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
  success(`${source_default.bold(currentAlias)} renamed to ${source_default.bold(nextAlias)}`);
  blank();
}

// src/accounts/purge.ts
import { unlink as unlink3 } from "fs/promises";
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
  if (entry.target.provider === "claude") {
    if (await profileExists(entry.target.profileName)) {
      await removeProfile(entry.target.profileName);
    }
  } else {
    try {
      const codexReg = await loadRegistry();
      const removed = removeAccountFromRegistry(codexReg, entry.target.accountKey);
      if (removed) {
        await saveRegistry(codexReg);
      }
      const authFile = codexAccountAuthFile(entry.target.accountKey);
      if (await fileExists(authFile)) {
        await unlink3(authFile);
      }
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
  success(`${source_default.bold(aliasName)} account purged`);
  blank();
}

// src/commands/current.ts
async function current() {
  const aliasReg = await loadAliases();
  const claudeState = await readState2();
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
import { readdir as readdir4 } from "fs/promises";
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
  const entries = await readdir4(CLAUDE_PROFILES_DIR, { withFileTypes: true });
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
import { spawn as spawn6 } from "child_process";
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
  success(`Refreshed ${source_default.bold(alias)}  ${formatProvider("claude")}  ${formatType("oauth")}  ${label}${email}`);
  blank();
}
async function refreshLocalCLIProxyAPI(alias, profileName, profile) {
  if (!profile.authIdentity) {
    error("This local CLIProxyAPI account has no saved identity fingerprint and cannot be safely refreshed.");
    hint("Remove and add it again to create a new isolated local login.");
    blank();
    process.exit(1);
  }
  info(`Opening CLIProxyAPI's own ChatGPT login for ${source_default.bold(alias)}...`);
  blank();
  let login;
  try {
    login = await runManagedCLIProxyAPICodexLogin({ profileId: profile.profileId, binaryPath: profile.binaryPath }, undefined, profile.authIdentity);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    blank();
    process.exit(1);
  }
  if (!login?.success || !login.identity) {
    error(login?.identityMismatch ? "ChatGPT login completed for a different account; the existing local account was left unchanged." : "CLIProxyAPI ChatGPT login failed or was cancelled; the existing local account was left unchanged.");
    blank();
    process.exit(1);
  }
  await updateLocalCLIProxyAPIProfileIdentity(profileName, login.identity);
  if ((await readState2()).active === profileName) {
    await switchProfile(profileName);
  }
  success(`Refreshed ${source_default.bold(alias)}  ${formatProvider("claude")}  ${formatType("local-cliproxyapi")}`);
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
    const proc = spawn6(command, args, { stdio: "inherit", env: env2 });
    return await new Promise((resolve2, reject) => {
      proc.on("close", resolve2);
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
import { realpathSync } from "fs";
import { spawnSync as spawnSync5 } from "child_process";
// package.json
var package_default = {
  name: "claudex-switch",
  version: "1.10.1",
  description: "Switch between Claude Code and Codex accounts with ease",
  type: "module",
  bin: {
    "claudex-switch": "./dist/claudex-switch.js"
  },
  files: ["dist", "scripts/guard-package-manager.js"],
  scripts: {
    build: "bun build ./src/index.ts --target node --outfile ./dist/claudex-switch.js",
    "build:binary": "bun build ./src/index.ts --compile --outfile ./dist/claudex-switch",
    "build:release": "./scripts/build-release-assets.sh ./release",
    dev: "bun run src/index.ts",
    preinstall: "node ./scripts/guard-package-manager.js",
    test: "bun test",
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
function detectInstallMethod(argv = process.argv, execPath = process.execPath, runCommand = spawnSync5) {
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
    if (bunGlobalBin && (pathStartsWith(cliPath, bunGlobalBin) || pathStartsWith(realCliPath, bunGlobalBin))) {
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
    return realpathSync(path);
  } catch {
    return path;
  }
}
async function checkForLatestUpdate(options = {}, settings = {}) {
  const argv = options.argv ?? process.argv;
  const env2 = options.env ?? process.env;
  const execPath = options.execPath ?? process.execPath;
  const fetchLatestVersion = options.fetchLatestVersion ?? fetchLatestReleaseVersion;
  const runCommand = options.runCommand ?? spawnSync5;
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
  const remove2 = runCommand("bun", ["remove", "-g", "claudex-switch"], {
    env: env2,
    stdio: "inherit"
  });
  if (remove2.status !== 0 || remove2.error) {
    return false;
  }
  const install = runCommand("bun", installArgs, {
    env: env2,
    stdio: "inherit"
  });
  return install.status === 0 && !install.error;
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
      if (result.unsupportedInstallMethod === "npm") {
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
      info(`claudex-switch is already up to date (v${result.currentVersion})`);
      blank();
      return;
  }
}

// src/webconfig/server.ts
import { createServer as createServer2 } from "http";
import { randomBytes as randomBytes2, timingSafeEqual } from "crypto";

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
function validateCustomEnv(env2) {
  const result = {};
  for (const [rawKey, rawValue] of Object.entries(env2 ?? {})) {
    const key = String(rawKey).trim();
    if (!key)
      continue;
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      throw new Error(`环境变量名 "${key}" 无效：只能用大写字母、数字和下划线，且不能以数字开头`);
    }
    if (!isValidCustomEnvKey(key)) {
      throw new Error(`"${key}" 上面已有专门的输入框，请填在那里`);
    }
    result[key] = typeof rawValue === "string" ? rawValue.trim() : "";
  }
  return result;
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
      label: "本机 CLIProxyAPI",
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
  const fields = sanitizeFields(change.fields);
  const env2 = change.env === undefined ? undefined : validateCustomEnv(change.env);
  if (entry.target.provider === "claude") {
    validateClaudeFields(fields);
    const { reapplied } = await updateClaudeProfileConfig(entry.target.profileName, { fields, env: env2 });
    return { alias: entry.alias, ok: true, reapplied };
  }
  return applyCodexChange(entry.target.accountKey, entry.alias, fields);
}
async function applyCodexChange(accountKey, alias, fields) {
  if (fields.baseUrl !== undefined)
    requireValidUrl(fields.baseUrl);
  const registry = await loadRegistry();
  const existing = findAccountByKey(registry, accountKey);
  if (existing?.api_provider?.type === "custom" && fields.baseUrl !== undefined && !fields.baseUrl.trim()) {
    throw new Error("中转站账号的请求地址不能为空");
  }
  const account = updateAccountConfig(registry, accountKey, {
    defaultModel: fields.defaultModel,
    baseUrl: fields.baseUrl,
    model: fields.model,
    envKey: fields.envKey
  });
  if (fields.apiKey !== undefined && account.auth_mode === "apikey") {
    const key = fields.apiKey.trim();
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
function sanitizeFields(fields) {
  const result = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (typeof value !== "string")
      continue;
    result[key] = value;
  }
  return result;
}
function validateClaudeFields(fields) {
  if (fields.baseUrl !== undefined)
    requireValidUrl(fields.baseUrl);
  if (fields.apiKey !== undefined && !fields.apiKey.trim()) {
    throw new Error("API Key 不能为空");
  }
}

// src/webconfig/create.ts
var PROVIDER_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
var ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
async function createAccount(request) {
  const alias = request.alias.trim();
  const fields = request.fields ?? {};
  const registry = await loadAliases();
  const rejection = checkAlias(registry, alias);
  if (rejection)
    throw new Error(aliasRejectionMessage(rejection));
  if (request.provider === "claude") {
    await createClaude(request, alias, fields);
    return;
  }
  await createCodex(request, alias, fields);
}
async function createClaude(request, alias, fields) {
  const apiKey = (fields.apiKey ?? "").trim();
  if (!apiKey)
    throw new Error("API Key 不能为空");
  const baseUrl2 = optional(fields.baseUrl);
  if (baseUrl2)
    requireValidUrl(baseUrl2);
  await createClaudeApiKeyAccount({
    alias,
    apiKey,
    baseUrl: baseUrl2,
    authToken: optional(fields.authToken),
    model: optional(fields.model),
    defaultFableModel: optional(fields.defaultFableModel),
    defaultSonnetModel: optional(fields.defaultSonnetModel),
    defaultOpusModel: optional(fields.defaultOpusModel),
    defaultHaikuModel: optional(fields.defaultHaikuModel),
    subagentModel: optional(fields.subagentModel),
    env: validateCustomEnv(request.env)
  });
}
async function createCodex(request, alias, fields) {
  const apiKey = (fields.apiKey ?? "").trim();
  if (!apiKey)
    throw new Error("API Key 不能为空");
  const provider = resolveCodexProvider(fields);
  const defaultModel = (fields.defaultModel ?? "").trim();
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
function resolveCodexProvider(fields) {
  const providerType = (fields.providerType ?? "").trim();
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
  const name = (fields.providerName ?? "").trim();
  if (!name)
    throw new Error("Provider 名称不能为空");
  if (!PROVIDER_NAME_PATTERN.test(name)) {
    throw new Error("Provider 名称只能用字母、数字、连字符和下划线");
  }
  const baseUrl2 = (fields.baseUrl ?? "").trim();
  if (!baseUrl2)
    throw new Error("中转站的请求地址不能为空");
  requireValidUrl(baseUrl2);
  const model2 = (fields.model ?? "").trim();
  if (!model2)
    throw new Error("Provider 模型不能为空");
  const envKey = (fields.envKey ?? "OPENAI_API_KEY").trim();
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
var MAX_BODY_BYTES = 1e6;
async function startWebConfigServer(options = {}) {
  const host = options.host ?? "127.0.0.1";
  const token = randomBytes2(32).toString("base64url");
  const server = createServer2((req, res) => {
    handleRequest(req, res, token, host).catch(() => {
      sendJson(res, 500, { error: "internal error" });
    });
  });
  await new Promise((resolve2, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, host, () => {
      server.removeListener("error", reject);
      resolve2();
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
  return new Promise((resolve2) => {
    server.closeAllConnections?.();
    server.close(() => resolve2());
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
  return timingSafeEqual(left, right);
}
async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES)
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
  success(`Config UI running at ${source_default.cyan(server.url)}`);
  hint("The link carries a one-time token and only works from this machine.");
  hint(`Press ${source_default.cyan("Ctrl-C")} to stop.`);
  blank();
  if (options.open !== false && !openExternalUrl(server.url)) {
    info("Could not open a browser automatically — open the link above.");
  }
  await new Promise((resolve2) => {
    const stop = () => {
      server.close().then(() => {
        blank();
        resolve2();
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
  if (entry.target.provider !== "claude") {
    fail("Doctor is currently available for local CLIProxyAPI Claude accounts only.");
    return;
  }
  if (!await profileExists(entry.target.profileName)) {
    fail(`Claude profile "${entry.target.profileName}" no longer exists.`);
    return;
  }
  const profile = await getProfileData(entry.target.profileName);
  if (profile.type !== "local-cliproxyapi") {
    fail("Doctor is currently available for local CLIProxyAPI Claude accounts only.");
    return;
  }
  const managedProfile = {
    profileId: profile.profileId,
    binaryPath: profile.binaryPath
  };
  let status = await inspectManagedCLIProxyAPI(managedProfile, {
    probe: true
  });
  info(`CLIProxyAPI binary: ${status.installed ? "available" : "not found"}`);
  info(`ChatGPT login: ${status.loggedIn ? "available" : "required"}`);
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
  if (!status.loggedIn) {
    fail(`No valid local ChatGPT login is available. Run ${source_default.cyan(`claudex-switch refresh ${entry.alias}`)} to sign in again.`);
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
    if (!await verifyManagedCLIProxyAPILive(liveRuntime)) {
      fail("Luna (gpt-5.6-luna) live verification failed. The local proxy is reachable, but this ChatGPT account or that specific model could not complete the test request.");
      return;
    }
    success(`${source_default.bold(entry.alias)} Luna (gpt-5.6-luna) live verification passed`);
    blank();
    return;
  }
  if (options.restart && status.running) {
    success(`${source_default.bold(entry.alias)} managed proxy restarted`);
  } else {
    success(`${source_default.bold(entry.alias)} basic local CLIProxyAPI checks passed`);
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
  ${source_default.bold("claudex-switch")} — Manage Claude Code and Codex accounts

  ${source_default.dim("Usage:")}
    claudex-switch                     Interactive account picker
    claudex-switch <alias>             Switch to an account
    claudex-switch <alias> -run [--model <model> [effort]] [--attribution-header <true|false>] [args...]  Switch, save the selected model, and run
    claudex-switch add <alias>         Add a new account
    claudex-switch use <alias>         Switch to an account
    claudex-switch list [--no-usage]   List all accounts with remaining quota
    claudex-switch rename <from> <to>  Rename an alias
    claudex-switch model <alias> <model>  Update an account's default model (Claude: 5, sonnet5, fable5.1; Codex: sol, terra, luna, 6)
    claudex-switch remove <alias>      Remove an alias only
    claudex-switch purge <alias>       Delete an account and all linked aliases
    claudex-switch refresh <alias>     Refresh and resave an account login
    claudex-switch doctor <alias> [--live] [--restart]  Check a local CLIProxyAPI account
    claudex-switch webconfig [--port <n>] [--no-open]  Open the local config UI
    claudex-switch current             Show active accounts
    claudex-switch import              Import existing accounts
    claudex-switch update              Upgrade to the latest release
    claudex-switch --version           Show version and auto-update to the latest release
    claudex-switch help                Show this help

  ${source_default.dim("Shortcuts:")}
    claudex-switch ls                  Same as 'list'
    claudex-switch rm <alias>          Same as 'remove'
    claudex-switch use <alias> -run    Same as '<alias> -run'
    claudex-switch -V                  Same as '--version'
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
  const entry = resolve2(scriptPath);
  const entryName = basename2(entry);
  const parentName = basename2(dirname6(entry));
  let root = null;
  if (parentName === "src" && entryName === "index.ts") {
    root = dirname6(dirname6(entry));
  } else if (parentName === "dist" && (entryName === "claudex-switch.js" || entryName === "claudex-switch")) {
    root = dirname6(dirname6(entry));
  }
  if (!root)
    return false;
  const packageFile = join8(root, "package.json");
  if (!existsSync(packageFile))
    return false;
  try {
    const pkg = JSON.parse(readFileSync(packageFile, "utf-8"));
    return pkg.name === "claudex-switch";
  } catch {
    return false;
  }
}
function enforceRepoLocalHomeSafety(command) {
  if (process.env.CLAUDEX_TEST_HOME)
    return;
  if (process.env.CLAUDEX_ALLOW_REAL_HOME === "1")
    return;
  if (!isRepoLocalEntrypoint(process.argv[1]))
    return;
  if (isVersionCommand(command) || isHelpCommand(command))
    return;
  blank();
  error("Refusing to run repo-local claudex-switch against your real HOME.");
  hint(`Use ${source_default.cyan("CLAUDEX_TEST_HOME=$(mktemp -d) bun ./dist/claudex-switch.js <command>")} for test data.`);
  hint(`Set ${source_default.cyan("CLAUDEX_ALLOW_REAL_HOME=1")} only when you intentionally want to touch real account files.`);
  blank();
  process.exit(1);
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
  const choice = await esm_default5({
    message: "Switch to account",
    choices
  });
  await use(choice);
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    enforceRepoLocalHomeSafety(command);
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
  Usage: claudex-switch use <alias> [-run [--model <model> [effort]] [--attribution-header <true|false>] [args...]]
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
        await list({ usage: !args.includes("--no-usage") });
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
        await rename4(args[0], args[1]);
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
      case "doctor":
        if (!args[0]) {
          console.error(source_default.red(`
  Usage: claudex-switch doctor <alias> [--live] [--restart]
`));
          process.exit(1);
        }
        if (args.slice(1).some((arg) => arg !== "--live" && arg !== "--restart")) {
          console.error(source_default.red(`
  Usage: claudex-switch doctor <alias> [--live] [--restart]
`));
          process.exit(1);
        }
        await doctor(args[0], {
          live: args.includes("--live"),
          restart: args.includes("--restart")
        });
        break;
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

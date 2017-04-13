/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var $map = {};
function $load(name, factory) {
    var mod = {
        exports: {}
    };
    var requireFunc = function (mod) {
        if ($map[mod]) {
            return $map[mod].exports;
        }
        return require(mod);
    };
    factory.call(this, requireFunc, mod, mod.exports);
    $map[name] = mod;
}
//# sourceMappingURL=_prefix.js.map
$load('./utils', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
function clone(something) {
    return doClone(something);
}
exports.clone = clone;
function doClone(something) {
    if (Array.isArray(something)) {
        return cloneArray(something);
    }
    if (typeof something === 'object') {
        return cloneObj(something);
    }
    return something;
}
function cloneArray(arr) {
    var r = [];
    for (var i = 0, len = arr.length; i < len; i++) {
        r[i] = doClone(arr[i]);
    }
    return r;
}
function cloneObj(obj) {
    var r = {};
    for (var key in obj) {
        r[key] = doClone(obj[key]);
    }
    return r;
}
function mergeObjects(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    sources.forEach(function (source) {
        for (var key in source) {
            target[key] = source[key];
        }
    });
    return target;
}
exports.mergeObjects = mergeObjects;
var CAPTURING_REGEX_SOURCE = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/;
var RegexSource = (function () {
    function RegexSource() {
    }
    RegexSource.hasCaptures = function (regexSource) {
        return CAPTURING_REGEX_SOURCE.test(regexSource);
    };
    RegexSource.replaceCaptures = function (regexSource, captureSource, captureIndices) {
        return regexSource.replace(CAPTURING_REGEX_SOURCE, function (match, index, commandIndex, command) {
            var capture = captureIndices[parseInt(index || commandIndex, 10)];
            if (capture) {
                var result = captureSource.substring(capture.start, capture.end);
                // Remove leading dots that would make the selector invalid
                while (result[0] === '.') {
                    result = result.substring(1);
                }
                switch (command) {
                    case 'downcase':
                        return result.toLowerCase();
                    case 'upcase':
                        return result.toUpperCase();
                    default:
                        return result;
                }
            }
            else {
                return match;
            }
        });
    };
    return RegexSource;
}());
exports.RegexSource = RegexSource;
//# sourceMappingURL=utils.js.map
});
$load('./theme', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var ParsedThemeRule = (function () {
    function ParsedThemeRule(scope, parentScopes, index, fontStyle, foreground, background) {
        this.scope = scope;
        this.parentScopes = parentScopes;
        this.index = index;
        this.fontStyle = fontStyle;
        this.foreground = foreground;
        this.background = background;
    }
    return ParsedThemeRule;
}());
exports.ParsedThemeRule = ParsedThemeRule;
function isValidHexColor(hex) {
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
        // #rrggbb
        return true;
    }
    if (/^#[0-9a-f]{8}$/i.test(hex)) {
        // #rrggbbaa
        return true;
    }
    if (/^#[0-9a-f]{3}$/i.test(hex)) {
        // #rgb
        return true;
    }
    if (/^#[0-9a-f]{4}$/i.test(hex)) {
        // #rgba
        return true;
    }
    return false;
}
/**
 * Parse a raw theme into rules.
 */
function parseTheme(source) {
    if (!source) {
        return [];
    }
    if (!source.settings || !Array.isArray(source.settings)) {
        return [];
    }
    var settings = source.settings;
    var result = [], resultLen = 0;
    for (var i = 0, len = settings.length; i < len; i++) {
        var entry = settings[i];
        if (!entry.settings) {
            continue;
        }
        var scopes = void 0;
        if (typeof entry.scope === 'string') {
            var _scope = entry.scope;
            // remove leading commas
            _scope = _scope.replace(/^[,]+/, '');
            // remove trailing commans
            _scope = _scope.replace(/[,]+$/, '');
            scopes = _scope.split(',');
        }
        else if (Array.isArray(entry.scope)) {
            scopes = entry.scope;
        }
        else {
            scopes = [''];
        }
        var fontStyle = -1 /* NotSet */;
        if (typeof entry.settings.fontStyle === 'string') {
            fontStyle = 0 /* None */;
            var segments = entry.settings.fontStyle.split(' ');
            for (var j = 0, lenJ = segments.length; j < lenJ; j++) {
                var segment = segments[j];
                switch (segment) {
                    case 'italic':
                        fontStyle = fontStyle | 1 /* Italic */;
                        break;
                    case 'bold':
                        fontStyle = fontStyle | 2 /* Bold */;
                        break;
                    case 'underline':
                        fontStyle = fontStyle | 4 /* Underline */;
                        break;
                }
            }
        }
        var foreground = null;
        if (typeof entry.settings.foreground === 'string' && isValidHexColor(entry.settings.foreground)) {
            foreground = entry.settings.foreground;
        }
        var background = null;
        if (typeof entry.settings.background === 'string' && isValidHexColor(entry.settings.background)) {
            background = entry.settings.background;
        }
        for (var j = 0, lenJ = scopes.length; j < lenJ; j++) {
            var _scope = scopes[j].trim();
            var segments = _scope.split(' ');
            var scope = segments[segments.length - 1];
            var parentScopes = null;
            if (segments.length > 1) {
                parentScopes = segments.slice(0, segments.length - 1);
                parentScopes.reverse();
            }
            result[resultLen++] = new ParsedThemeRule(scope, parentScopes, i, fontStyle, foreground, background);
        }
    }
    return result;
}
exports.parseTheme = parseTheme;
/**
 * Resolve rules (i.e. inheritance).
 */
function resolveParsedThemeRules(parsedThemeRules) {
    // Sort rules lexicographically, and then by index if necessary
    parsedThemeRules.sort(function (a, b) {
        var r = strcmp(a.scope, b.scope);
        if (r !== 0) {
            return r;
        }
        r = strArrCmp(a.parentScopes, b.parentScopes);
        if (r !== 0) {
            return r;
        }
        return a.index - b.index;
    });
    // Determine defaults
    var defaultFontStyle = 0 /* None */;
    var defaultForeground = '#000000';
    var defaultBackground = '#ffffff';
    while (parsedThemeRules.length >= 1 && parsedThemeRules[0].scope === '') {
        var incomingDefaults = parsedThemeRules.shift();
        if (incomingDefaults.fontStyle !== -1 /* NotSet */) {
            defaultFontStyle = incomingDefaults.fontStyle;
        }
        if (incomingDefaults.foreground !== null) {
            defaultForeground = incomingDefaults.foreground;
        }
        if (incomingDefaults.background !== null) {
            defaultBackground = incomingDefaults.background;
        }
    }
    var colorMap = new ColorMap();
    var defaults = new ThemeTrieElementRule(0, null, defaultFontStyle, colorMap.getId(defaultForeground), colorMap.getId(defaultBackground));
    var root = new ThemeTrieElement(new ThemeTrieElementRule(0, null, -1 /* NotSet */, 0, 0), []);
    for (var i = 0, len = parsedThemeRules.length; i < len; i++) {
        var rule = parsedThemeRules[i];
        root.insert(0, rule.scope, rule.parentScopes, rule.fontStyle, colorMap.getId(rule.foreground), colorMap.getId(rule.background));
    }
    return new Theme(colorMap, defaults, root);
}
var ColorMap = (function () {
    function ColorMap() {
        this._lastColorId = 0;
        this._id2color = [];
        this._color2id = Object.create(null);
    }
    ColorMap.prototype.getId = function (color) {
        if (color === null) {
            return 0;
        }
        color = color.toUpperCase();
        var value = this._color2id[color];
        if (value) {
            return value;
        }
        value = ++this._lastColorId;
        this._color2id[color] = value;
        this._id2color[value] = color;
        return value;
    };
    ColorMap.prototype.getColorMap = function () {
        return this._id2color.slice(0);
    };
    return ColorMap;
}());
exports.ColorMap = ColorMap;
var Theme = (function () {
    function Theme(colorMap, defaults, root) {
        this._colorMap = colorMap;
        this._root = root;
        this._defaults = defaults;
        this._cache = {};
    }
    Theme.createFromRawTheme = function (source) {
        return this.createFromParsedTheme(parseTheme(source));
    };
    Theme.createFromParsedTheme = function (source) {
        return resolveParsedThemeRules(source);
    };
    Theme.prototype.getColorMap = function () {
        return this._colorMap.getColorMap();
    };
    Theme.prototype.getDefaults = function () {
        return this._defaults;
    };
    Theme.prototype.match = function (scopeName) {
        if (!this._cache.hasOwnProperty(scopeName)) {
            this._cache[scopeName] = this._root.match(scopeName);
        }
        return this._cache[scopeName];
    };
    return Theme;
}());
exports.Theme = Theme;
function strcmp(a, b) {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}
exports.strcmp = strcmp;
function strArrCmp(a, b) {
    if (a === null && b === null) {
        return 0;
    }
    if (!a) {
        return -1;
    }
    if (!b) {
        return 1;
    }
    var len1 = a.length;
    var len2 = b.length;
    if (len1 === len2) {
        for (var i = 0; i < len1; i++) {
            var res = strcmp(a[i], b[i]);
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    }
    return len1 - len2;
}
exports.strArrCmp = strArrCmp;
var ThemeTrieElementRule = (function () {
    function ThemeTrieElementRule(scopeDepth, parentScopes, fontStyle, foreground, background) {
        this.scopeDepth = scopeDepth;
        this.parentScopes = parentScopes;
        this.fontStyle = fontStyle;
        this.foreground = foreground;
        this.background = background;
    }
    ThemeTrieElementRule.prototype.clone = function () {
        return new ThemeTrieElementRule(this.scopeDepth, this.parentScopes, this.fontStyle, this.foreground, this.background);
    };
    ThemeTrieElementRule.cloneArr = function (arr) {
        var r = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            r[i] = arr[i].clone();
        }
        return r;
    };
    ThemeTrieElementRule.prototype.acceptOverwrite = function (scopeDepth, fontStyle, foreground, background) {
        if (this.scopeDepth > scopeDepth) {
            console.log('how did this happen?');
        }
        else {
            this.scopeDepth = scopeDepth;
        }
        // console.log('TODO -> my depth: ' + this.scopeDepth + ', overwriting depth: ' + scopeDepth);
        if (fontStyle !== -1 /* NotSet */) {
            this.fontStyle = fontStyle;
        }
        if (foreground !== 0) {
            this.foreground = foreground;
        }
        if (background !== 0) {
            this.background = background;
        }
    };
    return ThemeTrieElementRule;
}());
exports.ThemeTrieElementRule = ThemeTrieElementRule;
var ThemeTrieElement = (function () {
    function ThemeTrieElement(mainRule, rulesWithParentScopes, children) {
        if (rulesWithParentScopes === void 0) { rulesWithParentScopes = []; }
        if (children === void 0) { children = {}; }
        this._mainRule = mainRule;
        this._rulesWithParentScopes = rulesWithParentScopes;
        this._children = children;
    }
    ThemeTrieElement._sortBySpecificity = function (arr) {
        if (arr.length === 1) {
            return arr;
        }
        arr.sort(this._cmpBySpecificity);
        return arr;
    };
    ThemeTrieElement._cmpBySpecificity = function (a, b) {
        if (a.scopeDepth === b.scopeDepth) {
            var aParentScopes = a.parentScopes;
            var bParentScopes = b.parentScopes;
            var aParentScopesLen = aParentScopes === null ? 0 : aParentScopes.length;
            var bParentScopesLen = bParentScopes === null ? 0 : bParentScopes.length;
            if (aParentScopesLen === bParentScopesLen) {
                for (var i = 0; i < aParentScopesLen; i++) {
                    var aLen = aParentScopes[i].length;
                    var bLen = bParentScopes[i].length;
                    if (aLen !== bLen) {
                        return bLen - aLen;
                    }
                }
            }
            return bParentScopesLen - aParentScopesLen;
        }
        return b.scopeDepth - a.scopeDepth;
    };
    ThemeTrieElement.prototype.match = function (scope) {
        if (scope === '') {
            return ThemeTrieElement._sortBySpecificity([].concat(this._mainRule).concat(this._rulesWithParentScopes));
        }
        var dotIndex = scope.indexOf('.');
        var head;
        var tail;
        if (dotIndex === -1) {
            head = scope;
            tail = '';
        }
        else {
            head = scope.substring(0, dotIndex);
            tail = scope.substring(dotIndex + 1);
        }
        if (this._children.hasOwnProperty(head)) {
            return this._children[head].match(tail);
        }
        return ThemeTrieElement._sortBySpecificity([].concat(this._mainRule).concat(this._rulesWithParentScopes));
    };
    ThemeTrieElement.prototype.insert = function (scopeDepth, scope, parentScopes, fontStyle, foreground, background) {
        if (scope === '') {
            this._doInsertHere(scopeDepth, parentScopes, fontStyle, foreground, background);
            return;
        }
        var dotIndex = scope.indexOf('.');
        var head;
        var tail;
        if (dotIndex === -1) {
            head = scope;
            tail = '';
        }
        else {
            head = scope.substring(0, dotIndex);
            tail = scope.substring(dotIndex + 1);
        }
        var child;
        if (this._children.hasOwnProperty(head)) {
            child = this._children[head];
        }
        else {
            child = new ThemeTrieElement(this._mainRule.clone(), ThemeTrieElementRule.cloneArr(this._rulesWithParentScopes));
            this._children[head] = child;
        }
        child.insert(scopeDepth + 1, tail, parentScopes, fontStyle, foreground, background);
    };
    ThemeTrieElement.prototype._doInsertHere = function (scopeDepth, parentScopes, fontStyle, foreground, background) {
        if (parentScopes === null) {
            // Merge into the main rule
            this._mainRule.acceptOverwrite(scopeDepth, fontStyle, foreground, background);
            return;
        }
        // Try to merge into existing rule
        for (var i = 0, len = this._rulesWithParentScopes.length; i < len; i++) {
            var rule = this._rulesWithParentScopes[i];
            if (strArrCmp(rule.parentScopes, parentScopes) === 0) {
                // bingo! => we get to merge this into an existing one
                rule.acceptOverwrite(scopeDepth, fontStyle, foreground, background);
                return;
            }
        }
        // Must add a new rule
        // Inherit from main rule
        if (fontStyle === -1 /* NotSet */) {
            fontStyle = this._mainRule.fontStyle;
        }
        if (foreground === 0) {
            foreground = this._mainRule.foreground;
        }
        if (background === 0) {
            background = this._mainRule.background;
        }
        this._rulesWithParentScopes.push(new ThemeTrieElementRule(scopeDepth, parentScopes, fontStyle, foreground, background));
    };
    return ThemeTrieElement;
}());
exports.ThemeTrieElement = ThemeTrieElement;
//# sourceMappingURL=theme.js.map
});
$load('./matcher', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
function createMatcher(expression, matchesName) {
    var tokenizer = newTokenizer(expression);
    var token = tokenizer.next();
    function parseOperand() {
        if (token === '-') {
            token = tokenizer.next();
            var expressionToNegate = parseOperand();
            return function (matcherInput) { return expressionToNegate && !expressionToNegate(matcherInput); };
        }
        if (token === '(') {
            token = tokenizer.next();
            var expressionInParents = parseExpression('|');
            if (token === ')') {
                token = tokenizer.next();
            }
            return expressionInParents;
        }
        if (isIdentifier(token)) {
            var identifiers = [];
            do {
                identifiers.push(token);
                token = tokenizer.next();
            } while (isIdentifier(token));
            return function (matcherInput) { return matchesName(identifiers, matcherInput); };
        }
        return null;
    }
    function parseConjunction() {
        var matchers = [];
        var matcher = parseOperand();
        while (matcher) {
            matchers.push(matcher);
            matcher = parseOperand();
        }
        return function (matcherInput) { return matchers.every(function (matcher) { return matcher(matcherInput); }); }; // and
    }
    function parseExpression(orOperatorToken) {
        if (orOperatorToken === void 0) { orOperatorToken = ','; }
        var matchers = [];
        var matcher = parseConjunction();
        while (matcher) {
            matchers.push(matcher);
            if (token === orOperatorToken) {
                do {
                    token = tokenizer.next();
                } while (token === orOperatorToken); // ignore subsequent commas
            }
            else {
                break;
            }
            matcher = parseConjunction();
        }
        return function (matcherInput) { return matchers.some(function (matcher) { return matcher(matcherInput); }); }; // or
    }
    return parseExpression() || (function (matcherInput) { return false; });
}
exports.createMatcher = createMatcher;
function isIdentifier(token) {
    return token && token.match(/[\w\.:]+/);
}
function newTokenizer(input) {
    var regex = /([\w\.:]+|[\,\|\-\(\)])/g;
    var match = regex.exec(input);
    return {
        next: function () {
            if (!match) {
                return null;
            }
            var res = match[0];
            match = regex.exec(input);
            return res;
        }
    };
}
//# sourceMappingURL=matcher.js.map
});
$load('./debug', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
exports.CAPTURE_METADATA = !!process.env['VSCODE_TEXTMATE_DEBUG'];
exports.IN_DEBUG_MODE = !!process.env['VSCODE_TEXTMATE_DEBUG'];
//# sourceMappingURL=debug.js.map
});
$load('./json', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
function doFail(streamState, msg) {
    // console.log('Near offset ' + streamState.pos + ': ' + msg + ' ~~~' + streamState.source.substr(streamState.pos, 50) + '~~~');
    throw new Error('Near offset ' + streamState.pos + ': ' + msg + ' ~~~' + streamState.source.substr(streamState.pos, 50) + '~~~');
}
function parse(source, filename, withMetadata) {
    var streamState = new JSONStreamState(source);
    var token = new JSONToken();
    var state = 0 /* ROOT_STATE */;
    var cur = null;
    var stateStack = [];
    var objStack = [];
    function pushState() {
        stateStack.push(state);
        objStack.push(cur);
    }
    function popState() {
        state = stateStack.pop();
        cur = objStack.pop();
    }
    function fail(msg) {
        doFail(streamState, msg);
    }
    while (nextJSONToken(streamState, token)) {
        if (state === 0 /* ROOT_STATE */) {
            if (cur !== null) {
                fail('too many constructs in root');
            }
            if (token.type === 3 /* LEFT_CURLY_BRACKET */) {
                cur = {};
                if (withMetadata) {
                    cur.$vscodeTextmateLocation = token.toLocation(filename);
                }
                pushState();
                state = 1 /* DICT_STATE */;
                continue;
            }
            if (token.type === 2 /* LEFT_SQUARE_BRACKET */) {
                cur = [];
                pushState();
                state = 4 /* ARR_STATE */;
                continue;
            }
            fail('unexpected token in root');
        }
        if (state === 2 /* DICT_STATE_COMMA */) {
            if (token.type === 5 /* RIGHT_CURLY_BRACKET */) {
                popState();
                continue;
            }
            if (token.type === 7 /* COMMA */) {
                state = 3 /* DICT_STATE_NO_CLOSE */;
                continue;
            }
            fail('expected , or }');
        }
        if (state === 1 /* DICT_STATE */ || state === 3 /* DICT_STATE_NO_CLOSE */) {
            if (state === 1 /* DICT_STATE */ && token.type === 5 /* RIGHT_CURLY_BRACKET */) {
                popState();
                continue;
            }
            if (token.type === 1 /* STRING */) {
                var keyValue = token.value;
                if (!nextJSONToken(streamState, token) || token.type !== 6 /* COLON */) {
                    fail('expected colon');
                }
                if (!nextJSONToken(streamState, token)) {
                    fail('expected value');
                }
                state = 2 /* DICT_STATE_COMMA */;
                if (token.type === 1 /* STRING */) {
                    cur[keyValue] = token.value;
                    continue;
                }
                if (token.type === 8 /* NULL */) {
                    cur[keyValue] = null;
                    continue;
                }
                if (token.type === 9 /* TRUE */) {
                    cur[keyValue] = true;
                    continue;
                }
                if (token.type === 10 /* FALSE */) {
                    cur[keyValue] = false;
                    continue;
                }
                if (token.type === 11 /* NUMBER */) {
                    cur[keyValue] = parseFloat(token.value);
                    continue;
                }
                if (token.type === 2 /* LEFT_SQUARE_BRACKET */) {
                    var newArr = [];
                    cur[keyValue] = newArr;
                    pushState();
                    state = 4 /* ARR_STATE */;
                    cur = newArr;
                    continue;
                }
                if (token.type === 3 /* LEFT_CURLY_BRACKET */) {
                    var newDict = {};
                    if (withMetadata) {
                        newDict.$vscodeTextmateLocation = token.toLocation(filename);
                    }
                    cur[keyValue] = newDict;
                    pushState();
                    state = 1 /* DICT_STATE */;
                    cur = newDict;
                    continue;
                }
            }
            fail('unexpected token in dict');
        }
        if (state === 5 /* ARR_STATE_COMMA */) {
            if (token.type === 4 /* RIGHT_SQUARE_BRACKET */) {
                popState();
                continue;
            }
            if (token.type === 7 /* COMMA */) {
                state = 6 /* ARR_STATE_NO_CLOSE */;
                continue;
            }
            fail('expected , or ]');
        }
        if (state === 4 /* ARR_STATE */ || state === 6 /* ARR_STATE_NO_CLOSE */) {
            if (state === 4 /* ARR_STATE */ && token.type === 4 /* RIGHT_SQUARE_BRACKET */) {
                popState();
                continue;
            }
            state = 5 /* ARR_STATE_COMMA */;
            if (token.type === 1 /* STRING */) {
                cur.push(token.value);
                continue;
            }
            if (token.type === 8 /* NULL */) {
                cur.push(null);
                continue;
            }
            if (token.type === 9 /* TRUE */) {
                cur.push(true);
                continue;
            }
            if (token.type === 10 /* FALSE */) {
                cur.push(false);
                continue;
            }
            if (token.type === 11 /* NUMBER */) {
                cur.push(parseFloat(token.value));
                continue;
            }
            if (token.type === 2 /* LEFT_SQUARE_BRACKET */) {
                var newArr = [];
                cur.push(newArr);
                pushState();
                state = 4 /* ARR_STATE */;
                cur = newArr;
                continue;
            }
            if (token.type === 3 /* LEFT_CURLY_BRACKET */) {
                var newDict = {};
                if (withMetadata) {
                    newDict.$vscodeTextmateLocation = token.toLocation(filename);
                }
                cur.push(newDict);
                pushState();
                state = 1 /* DICT_STATE */;
                cur = newDict;
                continue;
            }
            fail('unexpected token in array');
        }
        fail('unknown state');
    }
    if (objStack.length !== 0) {
        fail('unclosed constructs');
    }
    return cur;
}
exports.parse = parse;
var JSONStreamState = (function () {
    function JSONStreamState(source) {
        this.source = source;
        this.pos = 0;
        this.len = source.length;
        this.line = 1;
        this.char = 0;
    }
    return JSONStreamState;
}());
var JSONToken = (function () {
    function JSONToken() {
        this.value = null;
        this.offset = -1;
        this.len = -1;
        this.line = -1;
        this.char = -1;
    }
    JSONToken.prototype.toLocation = function (filename) {
        return {
            filename: filename,
            line: this.line,
            char: this.char
        };
    };
    return JSONToken;
}());
/**
 * precondition: the string is known to be valid JSON (https://www.ietf.org/rfc/rfc4627.txt)
 */
function nextJSONToken(_state, _out) {
    _out.value = null;
    _out.type = 0 /* UNKNOWN */;
    _out.offset = -1;
    _out.len = -1;
    _out.line = -1;
    _out.char = -1;
    var source = _state.source;
    var pos = _state.pos;
    var len = _state.len;
    var line = _state.line;
    var char = _state.char;
    //------------------------ skip whitespace
    var chCode;
    do {
        if (pos >= len) {
            return false; /*EOS*/
        }
        chCode = source.charCodeAt(pos);
        if (chCode === 32 /* SPACE */ || chCode === 9 /* HORIZONTAL_TAB */ || chCode === 13 /* CARRIAGE_RETURN */) {
            // regular whitespace
            pos++;
            char++;
            continue;
        }
        if (chCode === 10 /* LINE_FEED */) {
            // newline
            pos++;
            line++;
            char = 0;
            continue;
        }
        // not whitespace
        break;
    } while (true);
    _out.offset = pos;
    _out.line = line;
    _out.char = char;
    if (chCode === 34 /* QUOTATION_MARK */) {
        //------------------------ strings
        _out.type = 1 /* STRING */;
        pos++;
        char++;
        do {
            if (pos >= len) {
                return false; /*EOS*/
            }
            chCode = source.charCodeAt(pos);
            pos++;
            char++;
            if (chCode === 92 /* BACKSLASH */) {
                // skip next char
                pos++;
                char++;
                continue;
            }
            if (chCode === 34 /* QUOTATION_MARK */) {
                // end of the string
                break;
            }
        } while (true);
        _out.value = source.substring(_out.offset + 1, pos - 1).replace(/\\u([0-9A-Fa-f]{4})/g, function (_, m0) {
            return String.fromCodePoint(parseInt(m0, 16));
        }).replace(/\\(.)/g, function (_, m0) {
            switch (m0) {
                case '"': return '"';
                case '\\': return '\\';
                case '/': return '/';
                case 'b': return '\b';
                case 'f': return '\f';
                case 'n': return '\n';
                case 'r': return '\r';
                case 't': return '\t';
                default: doFail(_state, 'invalid escape sequence');
            }
        });
    }
    else if (chCode === 91 /* LEFT_SQUARE_BRACKET */) {
        _out.type = 2 /* LEFT_SQUARE_BRACKET */;
        pos++;
        char++;
    }
    else if (chCode === 123 /* LEFT_CURLY_BRACKET */) {
        _out.type = 3 /* LEFT_CURLY_BRACKET */;
        pos++;
        char++;
    }
    else if (chCode === 93 /* RIGHT_SQUARE_BRACKET */) {
        _out.type = 4 /* RIGHT_SQUARE_BRACKET */;
        pos++;
        char++;
    }
    else if (chCode === 125 /* RIGHT_CURLY_BRACKET */) {
        _out.type = 5 /* RIGHT_CURLY_BRACKET */;
        pos++;
        char++;
    }
    else if (chCode === 58 /* COLON */) {
        _out.type = 6 /* COLON */;
        pos++;
        char++;
    }
    else if (chCode === 44 /* COMMA */) {
        _out.type = 7 /* COMMA */;
        pos++;
        char++;
    }
    else if (chCode === 110 /* n */) {
        //------------------------ null
        _out.type = 8 /* NULL */;
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 117 /* u */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 108 /* l */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 108 /* l */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
    }
    else if (chCode === 116 /* t */) {
        //------------------------ true
        _out.type = 9 /* TRUE */;
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 114 /* r */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 117 /* u */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 101 /* e */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
    }
    else if (chCode === 102 /* f */) {
        //------------------------ false
        _out.type = 10 /* FALSE */;
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 97 /* a */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 108 /* l */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 115 /* s */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
        chCode = source.charCodeAt(pos);
        if (chCode !== 101 /* e */) {
            return false; /* INVALID */
        }
        pos++;
        char++;
    }
    else {
        //------------------------ numbers
        _out.type = 11 /* NUMBER */;
        do {
            if (pos >= len) {
                return false; /*EOS*/
            }
            chCode = source.charCodeAt(pos);
            if (chCode === 46 /* DOT */
                || (chCode >= 48 /* D0 */ && chCode <= 57 /* D9 */)
                || (chCode === 101 /* e */ || chCode === 69 /* E */)
                || (chCode === 45 /* MINUS */ || chCode === 43 /* PLUS */)) {
                // looks like a piece of a number
                pos++;
                char++;
                continue;
            }
            // pos--; char--;
            break;
        } while (true);
    }
    _out.len = pos - _out.offset;
    if (_out.value === null) {
        _out.value = source.substr(_out.offset, _out.len);
    }
    _state.pos = pos;
    _state.line = line;
    _state.char = char;
    // console.log('PRODUCING TOKEN: ', _out.value, JSONTokenType[_out.type]);
    return true;
}
//# sourceMappingURL=json.js.map
});
$load('./grammarReader', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var fs = require("fs");
var plist = require("fast-plist");
var debug_1 = require("./debug");
var json_1 = require("./json");
function readGrammar(filePath, callback) {
    var reader = new AsyncGrammarReader(filePath, getGrammarParser(filePath));
    reader.load(callback);
}
exports.readGrammar = readGrammar;
function readGrammarSync(filePath) {
    var reader = new SyncGrammarReader(filePath, getGrammarParser(filePath));
    return reader.load();
}
exports.readGrammarSync = readGrammarSync;
var AsyncGrammarReader = (function () {
    function AsyncGrammarReader(filePath, parser) {
        this._filePath = filePath;
        this._parser = parser;
    }
    AsyncGrammarReader.prototype.load = function (callback) {
        var _this = this;
        fs.readFile(this._filePath, function (err, contents) {
            if (err) {
                callback(err, null);
                return;
            }
            var r;
            try {
                r = _this._parser(contents.toString(), _this._filePath);
            }
            catch (err) {
                callback(err, null);
                return;
            }
            callback(null, r);
        });
    };
    return AsyncGrammarReader;
}());
var SyncGrammarReader = (function () {
    function SyncGrammarReader(filePath, parser) {
        this._filePath = filePath;
        this._parser = parser;
    }
    SyncGrammarReader.prototype.load = function () {
        try {
            var contents = fs.readFileSync(this._filePath);
            try {
                return this._parser(contents.toString(), this._filePath);
            }
            catch (e) {
                throw new Error("Error parsing " + this._filePath + ": " + e.message + ".");
            }
        }
        catch (e) {
            throw new Error("Error reading " + this._filePath + ": " + e.message + ".");
        }
    };
    return SyncGrammarReader;
}());
function getGrammarParser(filePath) {
    if (/\.json$/.test(filePath)) {
        return parseJSONGrammar;
    }
    return parsePLISTGrammar;
}
function parseJSONGrammar(contents, filename) {
    if (debug_1.CAPTURE_METADATA) {
        return json_1.parse(contents, filename, true);
    }
    return JSON.parse(contents);
}
function parsePLISTGrammar(contents, filename) {
    if (debug_1.CAPTURE_METADATA) {
        return plist.parseWithLocation(contents, filename, '$vscodeTextmateLocation');
    }
    return plist.parse(contents);
}
//# sourceMappingURL=grammarReader.js.map
});
$load('./rule', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var utils_1 = require("./utils");
var HAS_BACK_REFERENCES = /\\(\d+)/;
var BACK_REFERENCING_END = /\\(\d+)/g;
var Rule = (function () {
    function Rule($location, id, name, contentName) {
        this.$location = $location;
        this.id = id;
        this._name = name || null;
        this._nameIsCapturing = utils_1.RegexSource.hasCaptures(this._name);
        this._contentName = contentName || null;
        this._contentNameIsCapturing = utils_1.RegexSource.hasCaptures(this._contentName);
    }
    Object.defineProperty(Rule.prototype, "debugName", {
        get: function () {
            return this.constructor.name + "#" + this.id + " @ " + path.basename(this.$location.filename) + ":" + this.$location.line;
        },
        enumerable: true,
        configurable: true
    });
    Rule.prototype.getName = function (lineText, captureIndices) {
        if (!this._nameIsCapturing) {
            return this._name;
        }
        return utils_1.RegexSource.replaceCaptures(this._name, lineText, captureIndices);
    };
    Rule.prototype.getContentName = function (lineText, captureIndices) {
        if (!this._contentNameIsCapturing) {
            return this._contentName;
        }
        return utils_1.RegexSource.replaceCaptures(this._contentName, lineText, captureIndices);
    };
    Rule.prototype.collectPatternsRecursive = function (grammar, out, isFirst) {
        throw new Error('Implement me!');
    };
    Rule.prototype.compile = function (grammar, endRegexSource, allowA, allowG) {
        throw new Error('Implement me!');
    };
    return Rule;
}());
exports.Rule = Rule;
var CaptureRule = (function (_super) {
    __extends(CaptureRule, _super);
    function CaptureRule($location, id, name, contentName, retokenizeCapturedWithRuleId) {
        var _this = _super.call(this, $location, id, name, contentName) || this;
        _this.retokenizeCapturedWithRuleId = retokenizeCapturedWithRuleId;
        return _this;
    }
    return CaptureRule;
}(Rule));
exports.CaptureRule = CaptureRule;
var RegExpSource = (function () {
    function RegExpSource(regExpSource, ruleId, handleAnchors) {
        if (handleAnchors === void 0) { handleAnchors = true; }
        if (handleAnchors) {
            this._handleAnchors(regExpSource);
        }
        else {
            this.source = regExpSource;
            this.hasAnchor = false;
        }
        if (this.hasAnchor) {
            this._anchorCache = this._buildAnchorCache();
        }
        this.ruleId = ruleId;
        this.hasBackReferences = HAS_BACK_REFERENCES.test(this.source);
        // console.log('input: ' + regExpSource + ' => ' + this.source + ', ' + this.hasAnchor);
    }
    RegExpSource.prototype.clone = function () {
        return new RegExpSource(this.source, this.ruleId, true);
    };
    RegExpSource.prototype.setSource = function (newSource) {
        if (this.source === newSource) {
            return;
        }
        this.source = newSource;
        if (this.hasAnchor) {
            this._anchorCache = this._buildAnchorCache();
        }
    };
    RegExpSource.prototype._handleAnchors = function (regExpSource) {
        if (regExpSource) {
            var pos = void 0, len = void 0, ch = void 0, nextCh = void 0, lastPushedPos = 0, output = [];
            var hasAnchor = false;
            for (pos = 0, len = regExpSource.length; pos < len; pos++) {
                ch = regExpSource.charAt(pos);
                if (ch === '\\') {
                    if (pos + 1 < len) {
                        nextCh = regExpSource.charAt(pos + 1);
                        if (nextCh === 'z') {
                            output.push(regExpSource.substring(lastPushedPos, pos));
                            output.push('$(?!\\n)(?<!\\n)');
                            lastPushedPos = pos + 2;
                        }
                        else if (nextCh === 'A' || nextCh === 'G') {
                            hasAnchor = true;
                        }
                        pos++;
                    }
                }
            }
            this.hasAnchor = hasAnchor;
            if (lastPushedPos === 0) {
                // No \z hit
                this.source = regExpSource;
            }
            else {
                output.push(regExpSource.substring(lastPushedPos, len));
                this.source = output.join('');
            }
        }
        else {
            this.hasAnchor = false;
            this.source = regExpSource;
        }
    };
    RegExpSource.prototype.resolveBackReferences = function (lineText, captureIndices) {
        var capturedValues = captureIndices.map(function (capture) {
            return lineText.substring(capture.start, capture.end);
        });
        BACK_REFERENCING_END.lastIndex = 0;
        return this.source.replace(BACK_REFERENCING_END, function (match, g1) {
            return escapeRegExpCharacters(capturedValues[parseInt(g1, 10)] || '');
        });
    };
    RegExpSource.prototype._buildAnchorCache = function () {
        var A0_G0_result = [];
        var A0_G1_result = [];
        var A1_G0_result = [];
        var A1_G1_result = [];
        var pos, len, ch, nextCh;
        for (pos = 0, len = this.source.length; pos < len; pos++) {
            ch = this.source.charAt(pos);
            A0_G0_result[pos] = ch;
            A0_G1_result[pos] = ch;
            A1_G0_result[pos] = ch;
            A1_G1_result[pos] = ch;
            if (ch === '\\') {
                if (pos + 1 < len) {
                    nextCh = this.source.charAt(pos + 1);
                    if (nextCh === 'A') {
                        A0_G0_result[pos + 1] = '\uFFFF';
                        A0_G1_result[pos + 1] = '\uFFFF';
                        A1_G0_result[pos + 1] = 'A';
                        A1_G1_result[pos + 1] = 'A';
                    }
                    else if (nextCh === 'G') {
                        A0_G0_result[pos + 1] = '\uFFFF';
                        A0_G1_result[pos + 1] = 'G';
                        A1_G0_result[pos + 1] = '\uFFFF';
                        A1_G1_result[pos + 1] = 'G';
                    }
                    else {
                        A0_G0_result[pos + 1] = nextCh;
                        A0_G1_result[pos + 1] = nextCh;
                        A1_G0_result[pos + 1] = nextCh;
                        A1_G1_result[pos + 1] = nextCh;
                    }
                    pos++;
                }
            }
        }
        return {
            A0_G0: A0_G0_result.join(''),
            A0_G1: A0_G1_result.join(''),
            A1_G0: A1_G0_result.join(''),
            A1_G1: A1_G1_result.join('')
        };
    };
    RegExpSource.prototype.resolveAnchors = function (allowA, allowG) {
        if (!this.hasAnchor) {
            return this.source;
        }
        if (allowA) {
            if (allowG) {
                return this._anchorCache.A1_G1;
            }
            else {
                return this._anchorCache.A1_G0;
            }
        }
        else {
            if (allowG) {
                return this._anchorCache.A0_G1;
            }
            else {
                return this._anchorCache.A0_G0;
            }
        }
    };
    return RegExpSource;
}());
exports.RegExpSource = RegExpSource;
var getOnigModule = (function () {
    var onigurumaModule = null;
    return function () {
        if (!onigurumaModule) {
            onigurumaModule = require('oniguruma');
        }
        return onigurumaModule;
    };
})();
function createOnigScanner(sources) {
    var onigurumaModule = getOnigModule();
    return new onigurumaModule.OnigScanner(sources);
}
function createOnigString(sources) {
    var onigurumaModule = getOnigModule();
    var r = new onigurumaModule.OnigString(sources);
    r.$str = sources;
    return r;
}
exports.createOnigString = createOnigString;
function getString(str) {
    return str.$str;
}
exports.getString = getString;
var RegExpSourceList = (function () {
    function RegExpSourceList() {
        this._items = [];
        this._hasAnchors = false;
        this._cached = null;
        this._cachedSources = null;
        this._anchorCache = {
            A0_G0: null,
            A0_G1: null,
            A1_G0: null,
            A1_G1: null
        };
    }
    RegExpSourceList.prototype.push = function (item) {
        this._items.push(item);
        this._hasAnchors = this._hasAnchors || item.hasAnchor;
    };
    RegExpSourceList.prototype.unshift = function (item) {
        this._items.unshift(item);
        this._hasAnchors = this._hasAnchors || item.hasAnchor;
    };
    RegExpSourceList.prototype.length = function () {
        return this._items.length;
    };
    RegExpSourceList.prototype.setSource = function (index, newSource) {
        if (this._items[index].source !== newSource) {
            // bust the cache
            this._cached = null;
            this._anchorCache.A0_G0 = null;
            this._anchorCache.A0_G1 = null;
            this._anchorCache.A1_G0 = null;
            this._anchorCache.A1_G1 = null;
            this._items[index].setSource(newSource);
        }
    };
    RegExpSourceList.prototype.compile = function (grammar, allowA, allowG) {
        if (!this._hasAnchors) {
            if (!this._cached) {
                var regExps = this._items.map(function (e) { return e.source; });
                this._cached = {
                    scanner: createOnigScanner(regExps),
                    rules: this._items.map(function (e) { return e.ruleId; }),
                    debugRegExps: regExps
                };
            }
            return this._cached;
        }
        else {
            this._anchorCache = {
                A0_G0: this._anchorCache.A0_G0 || (allowA === false && allowG === false ? this._resolveAnchors(allowA, allowG) : null),
                A0_G1: this._anchorCache.A0_G1 || (allowA === false && allowG === true ? this._resolveAnchors(allowA, allowG) : null),
                A1_G0: this._anchorCache.A1_G0 || (allowA === true && allowG === false ? this._resolveAnchors(allowA, allowG) : null),
                A1_G1: this._anchorCache.A1_G1 || (allowA === true && allowG === true ? this._resolveAnchors(allowA, allowG) : null),
            };
            if (allowA) {
                if (allowG) {
                    return this._anchorCache.A1_G1;
                }
                else {
                    return this._anchorCache.A1_G0;
                }
            }
            else {
                if (allowG) {
                    return this._anchorCache.A0_G1;
                }
                else {
                    return this._anchorCache.A0_G0;
                }
            }
        }
    };
    RegExpSourceList.prototype._resolveAnchors = function (allowA, allowG) {
        var regExps = this._items.map(function (e) { return e.resolveAnchors(allowA, allowG); });
        return {
            scanner: createOnigScanner(regExps),
            rules: this._items.map(function (e) { return e.ruleId; }),
            debugRegExps: regExps
        };
    };
    return RegExpSourceList;
}());
exports.RegExpSourceList = RegExpSourceList;
var MatchRule = (function (_super) {
    __extends(MatchRule, _super);
    function MatchRule($location, id, name, match, captures) {
        var _this = _super.call(this, $location, id, name, null) || this;
        _this._match = new RegExpSource(match, _this.id);
        _this.captures = captures;
        _this._cachedCompiledPatterns = null;
        return _this;
    }
    Object.defineProperty(MatchRule.prototype, "debugMatchRegExp", {
        get: function () {
            return "" + this._match.source;
        },
        enumerable: true,
        configurable: true
    });
    MatchRule.prototype.collectPatternsRecursive = function (grammar, out, isFirst) {
        out.push(this._match);
    };
    MatchRule.prototype.compile = function (grammar, endRegexSource, allowA, allowG) {
        if (!this._cachedCompiledPatterns) {
            this._cachedCompiledPatterns = new RegExpSourceList();
            this.collectPatternsRecursive(grammar, this._cachedCompiledPatterns, true);
        }
        return this._cachedCompiledPatterns.compile(grammar, allowA, allowG);
    };
    return MatchRule;
}(Rule));
exports.MatchRule = MatchRule;
var IncludeOnlyRule = (function (_super) {
    __extends(IncludeOnlyRule, _super);
    function IncludeOnlyRule($location, id, name, contentName, patterns) {
        var _this = _super.call(this, $location, id, name, contentName) || this;
        _this.patterns = patterns.patterns;
        _this.hasMissingPatterns = patterns.hasMissingPatterns;
        _this._cachedCompiledPatterns = null;
        return _this;
    }
    IncludeOnlyRule.prototype.collectPatternsRecursive = function (grammar, out, isFirst) {
        var i, len, rule;
        for (i = 0, len = this.patterns.length; i < len; i++) {
            rule = grammar.getRule(this.patterns[i]);
            rule.collectPatternsRecursive(grammar, out, false);
        }
    };
    IncludeOnlyRule.prototype.compile = function (grammar, endRegexSource, allowA, allowG) {
        if (!this._cachedCompiledPatterns) {
            this._cachedCompiledPatterns = new RegExpSourceList();
            this.collectPatternsRecursive(grammar, this._cachedCompiledPatterns, true);
        }
        return this._cachedCompiledPatterns.compile(grammar, allowA, allowG);
    };
    return IncludeOnlyRule;
}(Rule));
exports.IncludeOnlyRule = IncludeOnlyRule;
function escapeRegExpCharacters(value) {
    return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
}
var BeginEndRule = (function (_super) {
    __extends(BeginEndRule, _super);
    function BeginEndRule($location, id, name, contentName, begin, beginCaptures, end, endCaptures, applyEndPatternLast, patterns) {
        var _this = _super.call(this, $location, id, name, contentName) || this;
        _this._begin = new RegExpSource(begin, _this.id);
        _this.beginCaptures = beginCaptures;
        _this._end = new RegExpSource(end, -1);
        _this.endHasBackReferences = _this._end.hasBackReferences;
        _this.endCaptures = endCaptures;
        _this.applyEndPatternLast = applyEndPatternLast || false;
        _this.patterns = patterns.patterns;
        _this.hasMissingPatterns = patterns.hasMissingPatterns;
        _this._cachedCompiledPatterns = null;
        return _this;
    }
    Object.defineProperty(BeginEndRule.prototype, "debugBeginRegExp", {
        get: function () {
            return "" + this._begin.source;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BeginEndRule.prototype, "debugEndRegExp", {
        get: function () {
            return "" + this._end.source;
        },
        enumerable: true,
        configurable: true
    });
    BeginEndRule.prototype.getEndWithResolvedBackReferences = function (lineText, captureIndices) {
        return this._end.resolveBackReferences(lineText, captureIndices);
    };
    BeginEndRule.prototype.collectPatternsRecursive = function (grammar, out, isFirst) {
        if (isFirst) {
            var i = void 0, len = void 0, rule = void 0;
            for (i = 0, len = this.patterns.length; i < len; i++) {
                rule = grammar.getRule(this.patterns[i]);
                rule.collectPatternsRecursive(grammar, out, false);
            }
        }
        else {
            out.push(this._begin);
        }
    };
    BeginEndRule.prototype.compile = function (grammar, endRegexSource, allowA, allowG) {
        var precompiled = this._precompile(grammar);
        if (this._end.hasBackReferences) {
            if (this.applyEndPatternLast) {
                precompiled.setSource(precompiled.length() - 1, endRegexSource);
            }
            else {
                precompiled.setSource(0, endRegexSource);
            }
        }
        return this._cachedCompiledPatterns.compile(grammar, allowA, allowG);
    };
    BeginEndRule.prototype._precompile = function (grammar) {
        if (!this._cachedCompiledPatterns) {
            this._cachedCompiledPatterns = new RegExpSourceList();
            this.collectPatternsRecursive(grammar, this._cachedCompiledPatterns, true);
            if (this.applyEndPatternLast) {
                this._cachedCompiledPatterns.push(this._end.hasBackReferences ? this._end.clone() : this._end);
            }
            else {
                this._cachedCompiledPatterns.unshift(this._end.hasBackReferences ? this._end.clone() : this._end);
            }
        }
        return this._cachedCompiledPatterns;
    };
    return BeginEndRule;
}(Rule));
exports.BeginEndRule = BeginEndRule;
var BeginWhileRule = (function (_super) {
    __extends(BeginWhileRule, _super);
    function BeginWhileRule($location, id, name, contentName, begin, beginCaptures, _while, whileCaptures, patterns) {
        var _this = _super.call(this, $location, id, name, contentName) || this;
        _this._begin = new RegExpSource(begin, _this.id);
        _this.beginCaptures = beginCaptures;
        _this.whileCaptures = whileCaptures;
        _this._while = new RegExpSource(_while, -2);
        _this.whileHasBackReferences = _this._while.hasBackReferences;
        _this.patterns = patterns.patterns;
        _this.hasMissingPatterns = patterns.hasMissingPatterns;
        _this._cachedCompiledPatterns = null;
        _this._cachedCompiledWhilePatterns = null;
        return _this;
    }
    BeginWhileRule.prototype.getWhileWithResolvedBackReferences = function (lineText, captureIndices) {
        return this._while.resolveBackReferences(lineText, captureIndices);
    };
    BeginWhileRule.prototype.collectPatternsRecursive = function (grammar, out, isFirst) {
        if (isFirst) {
            var i = void 0, len = void 0, rule = void 0;
            for (i = 0, len = this.patterns.length; i < len; i++) {
                rule = grammar.getRule(this.patterns[i]);
                rule.collectPatternsRecursive(grammar, out, false);
            }
        }
        else {
            out.push(this._begin);
        }
    };
    BeginWhileRule.prototype.compile = function (grammar, endRegexSource, allowA, allowG) {
        this._precompile(grammar);
        return this._cachedCompiledPatterns.compile(grammar, allowA, allowG);
    };
    BeginWhileRule.prototype._precompile = function (grammar) {
        if (!this._cachedCompiledPatterns) {
            this._cachedCompiledPatterns = new RegExpSourceList();
            this.collectPatternsRecursive(grammar, this._cachedCompiledPatterns, true);
        }
    };
    BeginWhileRule.prototype.compileWhile = function (grammar, endRegexSource, allowA, allowG) {
        this._precompileWhile(grammar);
        if (this._while.hasBackReferences) {
            this._cachedCompiledWhilePatterns.setSource(0, endRegexSource);
        }
        return this._cachedCompiledWhilePatterns.compile(grammar, allowA, allowG);
    };
    BeginWhileRule.prototype._precompileWhile = function (grammar) {
        if (!this._cachedCompiledWhilePatterns) {
            this._cachedCompiledWhilePatterns = new RegExpSourceList();
            this._cachedCompiledWhilePatterns.push(this._while.hasBackReferences ? this._while.clone() : this._while);
        }
    };
    return BeginWhileRule;
}(Rule));
exports.BeginWhileRule = BeginWhileRule;
var RuleFactory = (function () {
    function RuleFactory() {
    }
    RuleFactory.createCaptureRule = function (helper, $location, name, contentName, retokenizeCapturedWithRuleId) {
        return helper.registerRule(function (id) {
            return new CaptureRule($location, id, name, contentName, retokenizeCapturedWithRuleId);
        });
    };
    RuleFactory.getCompiledRuleId = function (desc, helper, repository) {
        if (!desc.id) {
            helper.registerRule(function (id) {
                desc.id = id;
                if (desc.match) {
                    return new MatchRule(desc.$vscodeTextmateLocation, desc.id, desc.name, desc.match, RuleFactory._compileCaptures(desc.captures, helper, repository));
                }
                if (!desc.begin) {
                    if (desc.repository) {
                        repository = utils_1.mergeObjects({}, repository, desc.repository);
                    }
                    return new IncludeOnlyRule(desc.$vscodeTextmateLocation, desc.id, desc.name, desc.contentName, RuleFactory._compilePatterns(desc.patterns, helper, repository));
                }
                if (desc.while) {
                    return new BeginWhileRule(desc.$vscodeTextmateLocation, desc.id, desc.name, desc.contentName, desc.begin, RuleFactory._compileCaptures(desc.beginCaptures || desc.captures, helper, repository), desc.while, RuleFactory._compileCaptures(desc.whileCaptures || desc.captures, helper, repository), RuleFactory._compilePatterns(desc.patterns, helper, repository));
                }
                return new BeginEndRule(desc.$vscodeTextmateLocation, desc.id, desc.name, desc.contentName, desc.begin, RuleFactory._compileCaptures(desc.beginCaptures || desc.captures, helper, repository), desc.end, RuleFactory._compileCaptures(desc.endCaptures || desc.captures, helper, repository), desc.applyEndPatternLast, RuleFactory._compilePatterns(desc.patterns, helper, repository));
            });
        }
        return desc.id;
    };
    RuleFactory._compileCaptures = function (captures, helper, repository) {
        var r = [], numericCaptureId, maximumCaptureId, i, captureId;
        if (captures) {
            // Find the maximum capture id
            maximumCaptureId = 0;
            for (captureId in captures) {
                if (captureId === '$vscodeTextmateLocation') {
                    continue;
                }
                numericCaptureId = parseInt(captureId, 10);
                if (numericCaptureId > maximumCaptureId) {
                    maximumCaptureId = numericCaptureId;
                }
            }
            // Initialize result
            for (i = 0; i <= maximumCaptureId; i++) {
                r[i] = null;
            }
            // Fill out result
            for (captureId in captures) {
                if (captureId === '$vscodeTextmateLocation') {
                    continue;
                }
                numericCaptureId = parseInt(captureId, 10);
                var retokenizeCapturedWithRuleId = 0;
                if (captures[captureId].patterns) {
                    retokenizeCapturedWithRuleId = RuleFactory.getCompiledRuleId(captures[captureId], helper, repository);
                }
                r[numericCaptureId] = RuleFactory.createCaptureRule(helper, captures[captureId].$vscodeTextmateLocation, captures[captureId].name, captures[captureId].contentName, retokenizeCapturedWithRuleId);
            }
        }
        return r;
    };
    RuleFactory._compilePatterns = function (patterns, helper, repository) {
        var r = [], pattern, i, len, patternId, externalGrammar, rule, skipRule;
        if (patterns) {
            for (i = 0, len = patterns.length; i < len; i++) {
                pattern = patterns[i];
                patternId = -1;
                if (pattern.include) {
                    if (pattern.include.charAt(0) === '#') {
                        // Local include found in `repository`
                        var localIncludedRule = repository[pattern.include.substr(1)];
                        if (localIncludedRule) {
                            patternId = RuleFactory.getCompiledRuleId(localIncludedRule, helper, repository);
                        }
                        else {
                        }
                    }
                    else if (pattern.include === '$base' || pattern.include === '$self') {
                        // Special include also found in `repository`
                        patternId = RuleFactory.getCompiledRuleId(repository[pattern.include], helper, repository);
                    }
                    else {
                        var externalGrammarName = null, externalGrammarInclude = null, sharpIndex = pattern.include.indexOf('#');
                        if (sharpIndex >= 0) {
                            externalGrammarName = pattern.include.substring(0, sharpIndex);
                            externalGrammarInclude = pattern.include.substring(sharpIndex + 1);
                        }
                        else {
                            externalGrammarName = pattern.include;
                        }
                        // External include
                        externalGrammar = helper.getExternalGrammar(externalGrammarName, repository);
                        if (externalGrammar) {
                            if (externalGrammarInclude) {
                                var externalIncludedRule = externalGrammar.repository[externalGrammarInclude];
                                if (externalIncludedRule) {
                                    patternId = RuleFactory.getCompiledRuleId(externalIncludedRule, helper, externalGrammar.repository);
                                }
                                else {
                                }
                            }
                            else {
                                patternId = RuleFactory.getCompiledRuleId(externalGrammar.repository.$self, helper, externalGrammar.repository);
                            }
                        }
                        else {
                        }
                    }
                }
                else {
                    patternId = RuleFactory.getCompiledRuleId(pattern, helper, repository);
                }
                if (patternId !== -1) {
                    rule = helper.getRule(patternId);
                    skipRule = false;
                    if (rule instanceof IncludeOnlyRule || rule instanceof BeginEndRule || rule instanceof BeginWhileRule) {
                        if (rule.hasMissingPatterns && rule.patterns.length === 0) {
                            skipRule = true;
                        }
                    }
                    if (skipRule) {
                        // console.log('REMOVING RULE ENTIRELY DUE TO EMPTY PATTERNS THAT ARE MISSING');
                        continue;
                    }
                    r.push(patternId);
                }
            }
        }
        return {
            patterns: r,
            hasMissingPatterns: ((patterns ? patterns.length : 0) !== r.length)
        };
    };
    return RuleFactory;
}());
exports.RuleFactory = RuleFactory;
//# sourceMappingURL=rule.js.map
});
$load('./grammar', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var utils_1 = require("./utils");
var rule_1 = require("./rule");
var matcher_1 = require("./matcher");
var debug_1 = require("./debug");
function createGrammar(grammar, initialLanguage, embeddedLanguages, grammarRepository) {
    return new Grammar(grammar, initialLanguage, embeddedLanguages, grammarRepository);
}
exports.createGrammar = createGrammar;
/**
 * Fill in `result` all external included scopes in `patterns`
 */
function _extractIncludedScopesInPatterns(result, patterns) {
    for (var i = 0, len = patterns.length; i < len; i++) {
        if (Array.isArray(patterns[i].patterns)) {
            _extractIncludedScopesInPatterns(result, patterns[i].patterns);
        }
        var include = patterns[i].include;
        if (!include) {
            continue;
        }
        if (include === '$base' || include === '$self') {
            // Special includes that can be resolved locally in this grammar
            continue;
        }
        if (include.charAt(0) === '#') {
            // Local include from this grammar
            continue;
        }
        var sharpIndex = include.indexOf('#');
        if (sharpIndex >= 0) {
            result[include.substring(0, sharpIndex)] = true;
        }
        else {
            result[include] = true;
        }
    }
}
/**
 * Fill in `result` all external included scopes in `repository`
 */
function _extractIncludedScopesInRepository(result, repository) {
    for (var name_1 in repository) {
        var rule = repository[name_1];
        if (rule.patterns && Array.isArray(rule.patterns)) {
            _extractIncludedScopesInPatterns(result, rule.patterns);
        }
        if (rule.repository) {
            _extractIncludedScopesInRepository(result, rule.repository);
        }
    }
}
/**
 * Collects the list of all external included scopes in `grammar`.
 */
function collectIncludedScopes(result, grammar) {
    if (grammar.patterns && Array.isArray(grammar.patterns)) {
        _extractIncludedScopesInPatterns(result, grammar.patterns);
    }
    if (grammar.repository) {
        _extractIncludedScopesInRepository(result, grammar.repository);
    }
    // remove references to own scope (avoid recursion)
    delete result[grammar.scopeName];
}
exports.collectIncludedScopes = collectIncludedScopes;
function collectInjections(result, selector, rule, ruleFactoryHelper, grammar) {
    function scopesAreMatching(thisScopeName, scopeName) {
        if (!thisScopeName) {
            return false;
        }
        if (thisScopeName === scopeName) {
            return true;
        }
        var len = scopeName.length;
        return thisScopeName.length > len && thisScopeName.substr(0, len) === scopeName && thisScopeName[len] === '.';
    }
    function nameMatcher(identifers, stackElements) {
        var scopes = stackElements.contentNameScopesList.generateScopes();
        var lastIndex = 0;
        return identifers.every(function (identifier) {
            for (var i = lastIndex; i < scopes.length; i++) {
                if (scopesAreMatching(scopes[i], identifier)) {
                    lastIndex = i;
                    return true;
                }
            }
            return false;
        });
    }
    ;
    var subExpressions = selector.split(',');
    subExpressions.forEach(function (subExpression) {
        var expressionString = subExpression.replace(/L:/g, '');
        result.push({
            matcher: matcher_1.createMatcher(expressionString, nameMatcher),
            ruleId: rule_1.RuleFactory.getCompiledRuleId(rule, ruleFactoryHelper, grammar.repository),
            grammar: grammar,
            priorityMatch: expressionString.length < subExpression.length
        });
    });
}
var ScopeMetadata = (function () {
    function ScopeMetadata(scopeName, languageId, tokenType, themeData) {
        this.scopeName = scopeName;
        this.languageId = languageId;
        this.tokenType = tokenType;
        this.themeData = themeData;
    }
    return ScopeMetadata;
}());
exports.ScopeMetadata = ScopeMetadata;
var ScopeMetadataProvider = (function () {
    function ScopeMetadataProvider(initialLanguage, themeProvider, embeddedLanguages) {
        this._initialLanguage = initialLanguage;
        this._themeProvider = themeProvider;
        this.onDidChangeTheme();
        // embeddedLanguages handling
        this._embeddedLanguages = Object.create(null);
        if (embeddedLanguages) {
            // If embeddedLanguages are configured, fill in `this._embeddedLanguages`
            var scopes = Object.keys(embeddedLanguages);
            for (var i = 0, len = scopes.length; i < len; i++) {
                var scope = scopes[i];
                var language = embeddedLanguages[scope];
                if (typeof language !== 'number' || language === 0) {
                    console.warn('Invalid embedded language found at scope ' + scope + ': <<' + language + '>>');
                    // never hurts to be too careful
                    continue;
                }
                this._embeddedLanguages[scope] = language;
            }
        }
        // create the regex
        var escapedScopes = Object.keys(this._embeddedLanguages).map(function (scopeName) { return ScopeMetadataProvider._escapeRegExpCharacters(scopeName); });
        if (escapedScopes.length === 0) {
            // no scopes registered
            this._embeddedLanguagesRegex = null;
        }
        else {
            escapedScopes.sort();
            escapedScopes.reverse();
            this._embeddedLanguagesRegex = new RegExp("^((" + escapedScopes.join(')|(') + "))($|\\.)", '');
        }
    }
    ScopeMetadataProvider.prototype.onDidChangeTheme = function () {
        this._cache = Object.create(null);
        this._defaultMetaData = new ScopeMetadata('', this._initialLanguage, 0 /* Other */, [this._themeProvider.getDefaults()]);
    };
    ScopeMetadataProvider.prototype.getDefaultMetadata = function () {
        return this._defaultMetaData;
    };
    /**
     * Escapes regular expression characters in a given string
     */
    ScopeMetadataProvider._escapeRegExpCharacters = function (value) {
        return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
    };
    ScopeMetadataProvider.prototype.getMetadataForScope = function (scopeName) {
        if (scopeName === null) {
            return ScopeMetadataProvider._NULL_SCOPE_METADATA;
        }
        var value = this._cache[scopeName];
        if (value) {
            return value;
        }
        value = this._doGetMetadataForScope(scopeName);
        this._cache[scopeName] = value;
        return value;
    };
    ScopeMetadataProvider.prototype._doGetMetadataForScope = function (scopeName) {
        var languageId = this._scopeToLanguage(scopeName);
        var standardTokenType = ScopeMetadataProvider._toStandardTokenType(scopeName);
        var themeData = this._themeProvider.themeMatch(scopeName);
        return new ScopeMetadata(scopeName, languageId, standardTokenType, themeData);
    };
    /**
     * Given a produced TM scope, return the language that token describes or null if unknown.
     * e.g. source.html => html, source.css.embedded.html => css, punctuation.definition.tag.html => null
     */
    ScopeMetadataProvider.prototype._scopeToLanguage = function (scope) {
        if (!scope) {
            return 0;
        }
        if (!this._embeddedLanguagesRegex) {
            // no scopes registered
            return 0;
        }
        var m = scope.match(this._embeddedLanguagesRegex);
        if (!m) {
            // no scopes matched
            return 0;
        }
        var language = this._embeddedLanguages[m[1]] || 0;
        if (!language) {
            return 0;
        }
        return language;
    };
    ScopeMetadataProvider._toStandardTokenType = function (tokenType) {
        var m = tokenType.match(ScopeMetadataProvider.STANDARD_TOKEN_TYPE_REGEXP);
        if (!m) {
            return 0 /* Other */;
        }
        switch (m[1]) {
            case 'comment':
                return 1 /* Comment */;
            case 'string':
                return 2 /* String */;
            case 'regex':
                return 4 /* RegEx */;
        }
        throw new Error('Unexpected match for standard token type!');
    };
    return ScopeMetadataProvider;
}());
ScopeMetadataProvider._NULL_SCOPE_METADATA = new ScopeMetadata('', 0, 0, null);
ScopeMetadataProvider.STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex)\b/;
var Grammar = (function () {
    function Grammar(grammar, initialLanguage, embeddedLanguages, grammarRepository) {
        this._scopeMetadataProvider = new ScopeMetadataProvider(initialLanguage, grammarRepository, embeddedLanguages);
        this._rootId = -1;
        this._lastRuleId = 0;
        this._ruleId2desc = [];
        this._includedGrammars = {};
        this._grammarRepository = grammarRepository;
        this._grammar = initGrammar(grammar, null);
    }
    Grammar.prototype.onDidChangeTheme = function () {
        this._scopeMetadataProvider.onDidChangeTheme();
    };
    Grammar.prototype.getMetadataForScope = function (scope) {
        return this._scopeMetadataProvider.getMetadataForScope(scope);
    };
    Grammar.prototype.getInjections = function (states) {
        var _this = this;
        if (!this._injections) {
            this._injections = [];
            // add injections from the current grammar
            var rawInjections = this._grammar.injections;
            if (rawInjections) {
                for (var expression in rawInjections) {
                    collectInjections(this._injections, expression, rawInjections[expression], this, this._grammar);
                }
            }
            // add injection grammars contributed for the current scope
            if (this._grammarRepository) {
                var injectionScopeNames = this._grammarRepository.injections(this._grammar.scopeName);
                if (injectionScopeNames) {
                    injectionScopeNames.forEach(function (injectionScopeName) {
                        var injectionGrammar = _this.getExternalGrammar(injectionScopeName);
                        if (injectionGrammar) {
                            var selector = injectionGrammar.injectionSelector;
                            if (selector) {
                                collectInjections(_this._injections, selector, injectionGrammar, _this, injectionGrammar);
                            }
                        }
                    });
                }
            }
        }
        if (this._injections.length === 0) {
            return this._injections;
        }
        return this._injections.filter(function (injection) { return injection.matcher(states); });
    };
    Grammar.prototype.registerRule = function (factory) {
        var id = (++this._lastRuleId);
        var result = factory(id);
        this._ruleId2desc[id] = result;
        return result;
    };
    Grammar.prototype.getRule = function (patternId) {
        return this._ruleId2desc[patternId];
    };
    Grammar.prototype.getExternalGrammar = function (scopeName, repository) {
        if (this._includedGrammars[scopeName]) {
            return this._includedGrammars[scopeName];
        }
        else if (this._grammarRepository) {
            var rawIncludedGrammar = this._grammarRepository.lookup(scopeName);
            if (rawIncludedGrammar) {
                // console.log('LOADED GRAMMAR ' + pattern.include);
                this._includedGrammars[scopeName] = initGrammar(rawIncludedGrammar, repository && repository.$base);
                return this._includedGrammars[scopeName];
            }
        }
    };
    Grammar.prototype.tokenizeLine = function (lineText, prevState) {
        var r = this._tokenize(lineText, prevState, false);
        return {
            tokens: r.lineTokens.getResult(r.ruleStack, r.lineLength),
            ruleStack: r.ruleStack
        };
    };
    Grammar.prototype.tokenizeLine2 = function (lineText, prevState) {
        var r = this._tokenize(lineText, prevState, true);
        return {
            tokens: r.lineTokens.getBinaryResult(r.ruleStack, r.lineLength),
            ruleStack: r.ruleStack
        };
    };
    Grammar.prototype._tokenize = function (lineText, prevState, emitBinaryTokens) {
        if (this._rootId === -1) {
            this._rootId = rule_1.RuleFactory.getCompiledRuleId(this._grammar.repository.$self, this, this._grammar.repository);
        }
        var isFirstLine;
        if (!prevState || prevState === StackElement.NULL) {
            isFirstLine = true;
            var rawDefaultMetadata = this._scopeMetadataProvider.getDefaultMetadata();
            var defaultTheme = rawDefaultMetadata.themeData[0];
            var defaultMetadata = StackElementMetadata.set(0, rawDefaultMetadata.languageId, rawDefaultMetadata.tokenType, defaultTheme.fontStyle, defaultTheme.foreground, defaultTheme.background);
            var rootScopeName = this.getRule(this._rootId).getName(null, null);
            var rawRootMetadata = this._scopeMetadataProvider.getMetadataForScope(rootScopeName);
            var rootMetadata = ScopeListElement.mergeMetadata(defaultMetadata, null, rawRootMetadata);
            var scopeList = new ScopeListElement(null, rootScopeName, rootMetadata);
            prevState = new StackElement(null, this._rootId, -1, null, scopeList, scopeList);
        }
        else {
            isFirstLine = false;
            prevState.reset();
        }
        lineText = lineText + '\n';
        var onigLineText = rule_1.createOnigString(lineText);
        var lineLength = rule_1.getString(onigLineText).length;
        var lineTokens = new LineTokens(emitBinaryTokens, lineText);
        var nextState = _tokenizeString(this, onigLineText, isFirstLine, 0, prevState, lineTokens);
        return {
            lineLength: lineLength,
            lineTokens: lineTokens,
            ruleStack: nextState
        };
    };
    return Grammar;
}());
exports.Grammar = Grammar;
function initGrammar(grammar, base) {
    grammar = utils_1.clone(grammar);
    grammar.repository = grammar.repository || {};
    grammar.repository.$self = {
        $vscodeTextmateLocation: grammar.$vscodeTextmateLocation,
        patterns: grammar.patterns,
        name: grammar.scopeName
    };
    grammar.repository.$base = base || grammar.repository.$self;
    return grammar;
}
function handleCaptures(grammar, lineText, isFirstLine, stack, lineTokens, captures, captureIndices) {
    if (captures.length === 0) {
        return;
    }
    var len = Math.min(captures.length, captureIndices.length);
    var localStack = [];
    var maxEnd = captureIndices[0].end;
    for (var i = 0; i < len; i++) {
        var captureRule = captures[i];
        if (captureRule === null) {
            // Not interested
            continue;
        }
        var captureIndex = captureIndices[i];
        if (captureIndex.length === 0) {
            // Nothing really captured
            continue;
        }
        if (captureIndex.start > maxEnd) {
            // Capture going beyond consumed string
            break;
        }
        // pop captures while needed
        while (localStack.length > 0 && localStack[localStack.length - 1].endPos <= captureIndex.start) {
            // pop!
            lineTokens.produceFromScopes(localStack[localStack.length - 1].scopes, localStack[localStack.length - 1].endPos);
            localStack.pop();
        }
        if (localStack.length > 0) {
            lineTokens.produceFromScopes(localStack[localStack.length - 1].scopes, captureIndex.start);
        }
        else {
            lineTokens.produce(stack, captureIndex.start);
        }
        if (captureRule.retokenizeCapturedWithRuleId) {
            // the capture requires additional matching
            var scopeName = captureRule.getName(rule_1.getString(lineText), captureIndices);
            var nameScopesList = stack.contentNameScopesList.push(grammar, scopeName);
            var contentName = captureRule.getContentName(rule_1.getString(lineText), captureIndices);
            var contentNameScopesList = nameScopesList.push(grammar, contentName);
            var stackClone = stack.push(captureRule.retokenizeCapturedWithRuleId, captureIndex.start, null, nameScopesList, contentNameScopesList);
            _tokenizeString(grammar, rule_1.createOnigString(rule_1.getString(lineText).substring(0, captureIndex.end)), (isFirstLine && captureIndex.start === 0), captureIndex.start, stackClone, lineTokens);
            continue;
        }
        var captureRuleScopeName = captureRule.getName(rule_1.getString(lineText), captureIndices);
        if (captureRuleScopeName !== null) {
            // push
            var base = localStack.length > 0 ? localStack[localStack.length - 1].scopes : stack.contentNameScopesList;
            var captureRuleScopesList = base.push(grammar, captureRuleScopeName);
            localStack.push(new LocalStackElement(captureRuleScopesList, captureIndex.end));
        }
    }
    while (localStack.length > 0) {
        // pop!
        lineTokens.produceFromScopes(localStack[localStack.length - 1].scopes, localStack[localStack.length - 1].endPos);
        localStack.pop();
    }
}
function debugCompiledRuleToString(ruleScanner) {
    var r = [];
    for (var i = 0, len = ruleScanner.rules.length; i < len; i++) {
        r.push('   - ' + ruleScanner.rules[i] + ': ' + ruleScanner.debugRegExps[i]);
    }
    return r.join('\n');
}
function matchInjections(injections, grammar, lineText, isFirstLine, linePos, stack, anchorPosition) {
    // The lower the better
    var bestMatchRating = Number.MAX_VALUE;
    var bestMatchCaptureIndices = null;
    var bestMatchRuleId;
    var bestMatchResultPriority = false;
    for (var i = 0, len = injections.length; i < len; i++) {
        var injection = injections[i];
        var ruleScanner = grammar.getRule(injection.ruleId).compile(grammar, null, isFirstLine, linePos === anchorPosition);
        var matchResult = ruleScanner.scanner._findNextMatchSync(lineText, linePos);
        if (debug_1.IN_DEBUG_MODE) {
            console.log('  scanning for injections');
            console.log(debugCompiledRuleToString(ruleScanner));
        }
        if (!matchResult) {
            continue;
        }
        var matchRating = matchResult.captureIndices[0].start;
        if (matchRating > bestMatchRating) {
            continue;
        }
        else if (matchRating === bestMatchRating && (!injection.priorityMatch || bestMatchResultPriority)) {
            continue;
        }
        bestMatchRating = matchRating;
        bestMatchCaptureIndices = matchResult.captureIndices;
        bestMatchRuleId = ruleScanner.rules[matchResult.index];
        bestMatchResultPriority = injection.priorityMatch;
        if (bestMatchRating === linePos && bestMatchResultPriority) {
            // No more need to look at the rest of the injections
            break;
        }
    }
    if (bestMatchCaptureIndices) {
        return {
            priorityMatch: bestMatchResultPriority,
            captureIndices: bestMatchCaptureIndices,
            matchedRuleId: bestMatchRuleId
        };
    }
    return null;
}
function matchRule(grammar, lineText, isFirstLine, linePos, stack, anchorPosition) {
    var rule = stack.getRule(grammar);
    var ruleScanner = rule.compile(grammar, stack.endRule, isFirstLine, linePos === anchorPosition);
    var r = ruleScanner.scanner._findNextMatchSync(lineText, linePos);
    if (debug_1.IN_DEBUG_MODE) {
        console.log('  scanning for');
        console.log(debugCompiledRuleToString(ruleScanner));
    }
    if (r) {
        return {
            captureIndices: r.captureIndices,
            matchedRuleId: ruleScanner.rules[r.index]
        };
    }
    return null;
}
function matchRuleOrInjections(grammar, lineText, isFirstLine, linePos, stack, anchorPosition) {
    // Look for normal grammar rule
    var matchResult = matchRule(grammar, lineText, isFirstLine, linePos, stack, anchorPosition);
    // Look for injected rules
    var injections = grammar.getInjections(stack);
    if (injections.length === 0) {
        // No injections whatsoever => early return
        return matchResult;
    }
    var injectionResult = matchInjections(injections, grammar, lineText, isFirstLine, linePos, stack, anchorPosition);
    if (!injectionResult) {
        // No injections matched => early return
        return matchResult;
    }
    if (!matchResult) {
        // Only injections matched => early return
        return injectionResult;
    }
    // Decide if `matchResult` or `injectionResult` should win
    var matchResultScore = matchResult.captureIndices[0].start;
    var injectionResultScore = injectionResult.captureIndices[0].start;
    if (injectionResultScore < matchResultScore || (injectionResult.priorityMatch && injectionResultScore === matchResultScore)) {
        // injection won!
        return injectionResult;
    }
    return matchResult;
}
/**
 * Walk the stack from bottom to top, and check each while condition in this order.
 * If any fails, cut off the entire stack above the failed while condition. While conditions
 * may also advance the linePosition.
 */
function _checkWhileConditions(grammar, lineText, isFirstLine, linePos, stack, lineTokens) {
    var anchorPosition = -1;
    var whileRules = [];
    for (var node = stack; node; node = node.pop()) {
        var nodeRule = node.getRule(grammar);
        if (nodeRule instanceof rule_1.BeginWhileRule) {
            whileRules.push({
                rule: nodeRule,
                stack: node
            });
        }
    }
    for (var whileRule = whileRules.pop(); whileRule; whileRule = whileRules.pop()) {
        var ruleScanner = whileRule.rule.compileWhile(grammar, whileRule.stack.endRule, isFirstLine, anchorPosition === linePos);
        var r = ruleScanner.scanner._findNextMatchSync(lineText, linePos);
        if (debug_1.IN_DEBUG_MODE) {
            console.log('  scanning for while rule');
            console.log(debugCompiledRuleToString(ruleScanner));
        }
        if (r) {
            var matchedRuleId = ruleScanner.rules[r.index];
            if (matchedRuleId !== -2) {
                // we shouldn't end up here
                stack = whileRule.stack.pop();
                break;
            }
            if (r.captureIndices && r.captureIndices.length) {
                lineTokens.produce(whileRule.stack, r.captureIndices[0].start);
                handleCaptures(grammar, lineText, isFirstLine, whileRule.stack, lineTokens, whileRule.rule.whileCaptures, r.captureIndices);
                lineTokens.produce(whileRule.stack, r.captureIndices[0].end);
                anchorPosition = r.captureIndices[0].end;
                if (r.captureIndices[0].end > linePos) {
                    linePos = r.captureIndices[0].end;
                    isFirstLine = false;
                }
            }
        }
        else {
            stack = whileRule.stack.pop();
            break;
        }
    }
    return { stack: stack, linePos: linePos, anchorPosition: anchorPosition, isFirstLine: isFirstLine };
}
function _tokenizeString(grammar, lineText, isFirstLine, linePos, stack, lineTokens) {
    var lineLength = rule_1.getString(lineText).length;
    var STOP = false;
    var whileCheckResult = _checkWhileConditions(grammar, lineText, isFirstLine, linePos, stack, lineTokens);
    stack = whileCheckResult.stack;
    linePos = whileCheckResult.linePos;
    isFirstLine = whileCheckResult.isFirstLine;
    var anchorPosition = whileCheckResult.anchorPosition;
    while (!STOP) {
        scanNext(); // potentially modifies linePos && anchorPosition
    }
    function scanNext() {
        if (debug_1.IN_DEBUG_MODE) {
            console.log('');
            console.log('@@scanNext: |' + rule_1.getString(lineText).replace(/\n$/, '\\n').substr(linePos) + '|');
        }
        var r = matchRuleOrInjections(grammar, lineText, isFirstLine, linePos, stack, anchorPosition);
        if (!r) {
            if (debug_1.IN_DEBUG_MODE) {
                console.log('  no more matches.');
            }
            // No match
            lineTokens.produce(stack, lineLength);
            STOP = true;
            return;
        }
        var captureIndices = r.captureIndices;
        var matchedRuleId = r.matchedRuleId;
        var hasAdvanced = (captureIndices && captureIndices.length > 0) ? (captureIndices[0].end > linePos) : false;
        if (matchedRuleId === -1) {
            // We matched the `end` for this rule => pop it
            var poppedRule = stack.getRule(grammar);
            if (debug_1.IN_DEBUG_MODE) {
                console.log('  popping ' + poppedRule.debugName + ' - ' + poppedRule.debugEndRegExp);
            }
            lineTokens.produce(stack, captureIndices[0].start);
            stack = stack.setContentNameScopesList(stack.nameScopesList);
            handleCaptures(grammar, lineText, isFirstLine, stack, lineTokens, poppedRule.endCaptures, captureIndices);
            lineTokens.produce(stack, captureIndices[0].end);
            // pop
            var popped = stack;
            stack = stack.pop();
            if (!hasAdvanced && popped.getEnterPos() === linePos) {
                // Grammar pushed & popped a rule without advancing
                console.error('[1] - Grammar is in an endless loop - Grammar pushed & popped a rule without advancing');
                // See https://github.com/Microsoft/vscode-textmate/issues/12
                // Let's assume this was a mistake by the grammar author and the intent was to continue in this state
                stack = popped;
                lineTokens.produce(stack, lineLength);
                STOP = true;
                return;
            }
        }
        else {
            // We matched a rule!
            var _rule = grammar.getRule(matchedRuleId);
            lineTokens.produce(stack, captureIndices[0].start);
            var beforePush = stack;
            // push it on the stack rule
            var scopeName = _rule.getName(rule_1.getString(lineText), captureIndices);
            var nameScopesList = stack.contentNameScopesList.push(grammar, scopeName);
            stack = stack.push(matchedRuleId, linePos, null, nameScopesList, nameScopesList);
            if (_rule instanceof rule_1.BeginEndRule) {
                var pushedRule = _rule;
                if (debug_1.IN_DEBUG_MODE) {
                    console.log('  pushing ' + pushedRule.debugName + ' - ' + pushedRule.debugBeginRegExp);
                }
                handleCaptures(grammar, lineText, isFirstLine, stack, lineTokens, pushedRule.beginCaptures, captureIndices);
                lineTokens.produce(stack, captureIndices[0].end);
                anchorPosition = captureIndices[0].end;
                var contentName = pushedRule.getContentName(rule_1.getString(lineText), captureIndices);
                var contentNameScopesList = nameScopesList.push(grammar, contentName);
                stack = stack.setContentNameScopesList(contentNameScopesList);
                if (pushedRule.endHasBackReferences) {
                    stack = stack.setEndRule(pushedRule.getEndWithResolvedBackReferences(rule_1.getString(lineText), captureIndices));
                }
                if (!hasAdvanced && beforePush.hasSameRuleAs(stack)) {
                    // Grammar pushed the same rule without advancing
                    console.error('[2] - Grammar is in an endless loop - Grammar pushed the same rule without advancing');
                    stack = stack.pop();
                    lineTokens.produce(stack, lineLength);
                    STOP = true;
                    return;
                }
            }
            else if (_rule instanceof rule_1.BeginWhileRule) {
                var pushedRule = _rule;
                if (debug_1.IN_DEBUG_MODE) {
                    console.log('  pushing ' + pushedRule.debugName);
                }
                handleCaptures(grammar, lineText, isFirstLine, stack, lineTokens, pushedRule.beginCaptures, captureIndices);
                lineTokens.produce(stack, captureIndices[0].end);
                anchorPosition = captureIndices[0].end;
                var contentName = pushedRule.getContentName(rule_1.getString(lineText), captureIndices);
                var contentNameScopesList = nameScopesList.push(grammar, contentName);
                stack = stack.setContentNameScopesList(contentNameScopesList);
                if (pushedRule.whileHasBackReferences) {
                    stack = stack.setEndRule(pushedRule.getWhileWithResolvedBackReferences(rule_1.getString(lineText), captureIndices));
                }
                if (!hasAdvanced && beforePush.hasSameRuleAs(stack)) {
                    // Grammar pushed the same rule without advancing
                    console.error('[3] - Grammar is in an endless loop - Grammar pushed the same rule without advancing');
                    stack = stack.pop();
                    lineTokens.produce(stack, lineLength);
                    STOP = true;
                    return;
                }
            }
            else {
                var matchingRule = _rule;
                if (debug_1.IN_DEBUG_MODE) {
                    console.log('  matched ' + matchingRule.debugName + ' - ' + matchingRule.debugMatchRegExp);
                }
                handleCaptures(grammar, lineText, isFirstLine, stack, lineTokens, matchingRule.captures, captureIndices);
                lineTokens.produce(stack, captureIndices[0].end);
                // pop rule immediately since it is a MatchRule
                stack = stack.pop();
                if (!hasAdvanced) {
                    // Grammar is not advancing, nor is it pushing/popping
                    console.error('[4] - Grammar is in an endless loop - Grammar is not advancing, nor is it pushing/popping');
                    stack = stack.safePop();
                    lineTokens.produce(stack, lineLength);
                    STOP = true;
                    return;
                }
            }
        }
        if (captureIndices[0].end > linePos) {
            // Advance stream
            linePos = captureIndices[0].end;
            isFirstLine = false;
        }
    }
    return stack;
}
var StackElementMetadata = (function () {
    function StackElementMetadata() {
    }
    StackElementMetadata.toBinaryStr = function (metadata) {
        var r = metadata.toString(2);
        while (r.length < 32) {
            r = '0' + r;
        }
        return r;
    };
    StackElementMetadata.printMetadata = function (metadata) {
        var languageId = StackElementMetadata.getLanguageId(metadata);
        var tokenType = StackElementMetadata.getTokenType(metadata);
        var fontStyle = StackElementMetadata.getFontStyle(metadata);
        var foreground = StackElementMetadata.getForeground(metadata);
        var background = StackElementMetadata.getBackground(metadata);
        console.log({
            languageId: languageId,
            tokenType: tokenType,
            fontStyle: fontStyle,
            foreground: foreground,
            background: background,
        });
    };
    StackElementMetadata.getLanguageId = function (metadata) {
        return (metadata & 255 /* LANGUAGEID_MASK */) >>> 0 /* LANGUAGEID_OFFSET */;
    };
    StackElementMetadata.getTokenType = function (metadata) {
        return (metadata & 1792 /* TOKEN_TYPE_MASK */) >>> 8 /* TOKEN_TYPE_OFFSET */;
    };
    StackElementMetadata.getFontStyle = function (metadata) {
        return (metadata & 14336 /* FONT_STYLE_MASK */) >>> 11 /* FONT_STYLE_OFFSET */;
    };
    StackElementMetadata.getForeground = function (metadata) {
        return (metadata & 8372224 /* FOREGROUND_MASK */) >>> 14 /* FOREGROUND_OFFSET */;
    };
    StackElementMetadata.getBackground = function (metadata) {
        return (metadata & 4286578688 /* BACKGROUND_MASK */) >>> 23 /* BACKGROUND_OFFSET */;
    };
    StackElementMetadata.set = function (metadata, languageId, tokenType, fontStyle, foreground, background) {
        var _languageId = StackElementMetadata.getLanguageId(metadata);
        var _tokenType = StackElementMetadata.getTokenType(metadata);
        var _fontStyle = StackElementMetadata.getFontStyle(metadata);
        var _foreground = StackElementMetadata.getForeground(metadata);
        var _background = StackElementMetadata.getBackground(metadata);
        if (languageId !== 0) {
            _languageId = languageId;
        }
        if (tokenType !== 0 /* Other */) {
            _tokenType = tokenType;
        }
        if (fontStyle !== -1 /* NotSet */) {
            _fontStyle = fontStyle;
        }
        if (foreground !== 0) {
            _foreground = foreground;
        }
        if (background !== 0) {
            _background = background;
        }
        return ((_languageId << 0 /* LANGUAGEID_OFFSET */)
            | (_tokenType << 8 /* TOKEN_TYPE_OFFSET */)
            | (_fontStyle << 11 /* FONT_STYLE_OFFSET */)
            | (_foreground << 14 /* FOREGROUND_OFFSET */)
            | (_background << 23 /* BACKGROUND_OFFSET */)) >>> 0;
    };
    return StackElementMetadata;
}());
exports.StackElementMetadata = StackElementMetadata;
var ScopeListElement = (function () {
    function ScopeListElement(parent, scope, metadata) {
        this.parent = parent;
        this.scope = scope;
        this.metadata = metadata;
    }
    ScopeListElement._equals = function (a, b) {
        do {
            if (a === b) {
                return true;
            }
            if (a.scope !== b.scope || a.metadata !== b.metadata) {
                return false;
            }
            // Go to previous pair
            a = a.parent;
            b = b.parent;
            if (!a && !b) {
                // End of list reached for both
                return true;
            }
            if (!a || !b) {
                // End of list reached only for one
                return false;
            }
        } while (true);
    };
    ScopeListElement.prototype.equals = function (other) {
        return ScopeListElement._equals(this, other);
    };
    ScopeListElement._matchesScope = function (scope, selector, selectorWithDot) {
        return (selector === scope || scope.substring(0, selectorWithDot.length) === selectorWithDot);
    };
    ScopeListElement._matches = function (target, parentScopes) {
        if (parentScopes === null) {
            return true;
        }
        var len = parentScopes.length;
        var index = 0;
        var selector = parentScopes[index];
        var selectorWithDot = selector + '.';
        while (target) {
            if (this._matchesScope(target.scope, selector, selectorWithDot)) {
                index++;
                if (index === len) {
                    return true;
                }
                selector = parentScopes[index];
                selectorWithDot = selector + '.';
            }
            target = target.parent;
        }
        return false;
    };
    ScopeListElement.mergeMetadata = function (metadata, scopesList, source) {
        if (source === null) {
            return metadata;
        }
        var fontStyle = -1 /* NotSet */;
        var foreground = 0;
        var background = 0;
        if (source.themeData !== null) {
            // Find the first themeData that matches
            for (var i = 0, len = source.themeData.length; i < len; i++) {
                var themeData = source.themeData[i];
                if (this._matches(scopesList, themeData.parentScopes)) {
                    fontStyle = themeData.fontStyle;
                    foreground = themeData.foreground;
                    background = themeData.background;
                    break;
                }
            }
        }
        return StackElementMetadata.set(metadata, source.languageId, source.tokenType, fontStyle, foreground, background);
    };
    ScopeListElement._push = function (target, grammar, scopes) {
        for (var i = 0, len = scopes.length; i < len; i++) {
            var scope = scopes[i];
            var rawMetadata = grammar.getMetadataForScope(scope);
            var metadata = ScopeListElement.mergeMetadata(target.metadata, target, rawMetadata);
            target = new ScopeListElement(target, scope, metadata);
        }
        return target;
    };
    ScopeListElement.prototype.push = function (grammar, scope) {
        if (scope === null) {
            return this;
        }
        if (scope.indexOf(' ') >= 0) {
            // there are multiple scopes to push
            return ScopeListElement._push(this, grammar, scope.split(/ /g));
        }
        // there is a single scope to push
        return ScopeListElement._push(this, grammar, [scope]);
    };
    ScopeListElement._generateScopes = function (scopesList) {
        var result = [], resultLen = 0;
        while (scopesList) {
            result[resultLen++] = scopesList.scope;
            scopesList = scopesList.parent;
        }
        result.reverse();
        return result;
    };
    ScopeListElement.prototype.generateScopes = function () {
        return ScopeListElement._generateScopes(this);
    };
    return ScopeListElement;
}());
exports.ScopeListElement = ScopeListElement;
/**
 * Represents a "pushed" state on the stack (as a linked list element).
 */
var StackElement = (function () {
    function StackElement(parent, ruleId, enterPos, endRule, nameScopesList, contentNameScopesList) {
        this.parent = parent;
        this.depth = (this.parent ? this.parent.depth + 1 : 1);
        this.ruleId = ruleId;
        this._enterPos = enterPos;
        this.endRule = endRule;
        this.nameScopesList = nameScopesList;
        this.contentNameScopesList = contentNameScopesList;
    }
    /**
     * A structural equals check. Does not take into account `scopes`.
     */
    StackElement._structuralEquals = function (a, b) {
        do {
            if (a === b) {
                return true;
            }
            if (a.depth !== b.depth || a.ruleId !== b.ruleId || a.endRule !== b.endRule) {
                return false;
            }
            // Go to previous pair
            a = a.parent;
            b = b.parent;
            if (!a && !b) {
                // End of list reached for both
                return true;
            }
            if (!a || !b) {
                // End of list reached only for one
                return false;
            }
        } while (true);
    };
    StackElement._equals = function (a, b) {
        if (a === b) {
            return true;
        }
        if (!this._structuralEquals(a, b)) {
            return false;
        }
        return a.contentNameScopesList.equals(b.contentNameScopesList);
    };
    StackElement.prototype.clone = function () {
        return this;
    };
    StackElement.prototype.equals = function (other) {
        if (other === null) {
            return false;
        }
        return StackElement._equals(this, other);
    };
    StackElement._reset = function (el) {
        while (el) {
            el._enterPos = -1;
            el = el.parent;
        }
    };
    StackElement.prototype.reset = function () {
        StackElement._reset(this);
    };
    StackElement.prototype.pop = function () {
        return this.parent;
    };
    StackElement.prototype.safePop = function () {
        if (this.parent) {
            return this.parent;
        }
        return this;
    };
    StackElement.prototype.push = function (ruleId, enterPos, endRule, nameScopesList, contentNameScopesList) {
        return new StackElement(this, ruleId, enterPos, endRule, nameScopesList, contentNameScopesList);
    };
    StackElement.prototype.getEnterPos = function () {
        return this._enterPos;
    };
    StackElement.prototype.getRule = function (grammar) {
        return grammar.getRule(this.ruleId);
    };
    StackElement.prototype._writeString = function (res, outIndex) {
        if (this.parent) {
            outIndex = this.parent._writeString(res, outIndex);
        }
        res[outIndex++] = "(" + this.ruleId + ", TODO-" + this.nameScopesList + ", TODO-" + this.contentNameScopesList + ")";
        return outIndex;
    };
    StackElement.prototype.toString = function () {
        var r = [];
        this._writeString(r, 0);
        return '[' + r.join(',') + ']';
    };
    StackElement.prototype.setContentNameScopesList = function (contentNameScopesList) {
        if (this.contentNameScopesList === contentNameScopesList) {
            return this;
        }
        return this.parent.push(this.ruleId, this._enterPos, this.endRule, this.nameScopesList, contentNameScopesList);
    };
    StackElement.prototype.setEndRule = function (endRule) {
        if (this.endRule === endRule) {
            return this;
        }
        return new StackElement(this.parent, this.ruleId, this._enterPos, endRule, this.nameScopesList, this.contentNameScopesList);
    };
    StackElement.prototype.hasSameRuleAs = function (other) {
        return this.ruleId === other.ruleId;
    };
    return StackElement;
}());
StackElement.NULL = new StackElement(null, 0, 0, null, null, null);
exports.StackElement = StackElement;
var LocalStackElement = (function () {
    function LocalStackElement(scopes, endPos) {
        this.scopes = scopes;
        this.endPos = endPos;
    }
    return LocalStackElement;
}());
exports.LocalStackElement = LocalStackElement;
var LineTokens = (function () {
    function LineTokens(emitBinaryTokens, lineText) {
        this._emitBinaryTokens = emitBinaryTokens;
        if (debug_1.IN_DEBUG_MODE) {
            this._lineText = lineText;
        }
        if (this._emitBinaryTokens) {
            this._binaryTokens = [];
        }
        else {
            this._tokens = [];
        }
        this._lastTokenEndIndex = 0;
    }
    LineTokens.prototype.produce = function (stack, endIndex) {
        this.produceFromScopes(stack.contentNameScopesList, endIndex);
    };
    LineTokens.prototype.produceFromScopes = function (scopesList, endIndex) {
        if (this._lastTokenEndIndex >= endIndex) {
            return;
        }
        if (this._emitBinaryTokens) {
            var metadata = scopesList.metadata;
            if (this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 1] === metadata) {
                // no need to push a token with the same metadata
                this._lastTokenEndIndex = endIndex;
                return;
            }
            this._binaryTokens.push(this._lastTokenEndIndex);
            this._binaryTokens.push(metadata);
            this._lastTokenEndIndex = endIndex;
            return;
        }
        var scopes = scopesList.generateScopes();
        if (debug_1.IN_DEBUG_MODE) {
            console.log('  token: |' + this._lineText.substring(this._lastTokenEndIndex, endIndex).replace(/\n$/, '\\n') + '|');
            for (var k = 0; k < scopes.length; k++) {
                console.log('      * ' + scopes[k]);
            }
        }
        this._tokens.push({
            startIndex: this._lastTokenEndIndex,
            endIndex: endIndex,
            // value: lineText.substring(lastTokenEndIndex, endIndex),
            scopes: scopes
        });
        this._lastTokenEndIndex = endIndex;
    };
    LineTokens.prototype.getResult = function (stack, lineLength) {
        if (this._tokens.length > 0 && this._tokens[this._tokens.length - 1].startIndex === lineLength - 1) {
            // pop produced token for newline
            this._tokens.pop();
        }
        if (this._tokens.length === 0) {
            this._lastTokenEndIndex = -1;
            this.produce(stack, lineLength);
            this._tokens[this._tokens.length - 1].startIndex = 0;
        }
        return this._tokens;
    };
    LineTokens.prototype.getBinaryResult = function (stack, lineLength) {
        if (this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 2] === lineLength - 1) {
            // pop produced token for newline
            this._binaryTokens.pop();
            this._binaryTokens.pop();
        }
        if (this._binaryTokens.length === 0) {
            this._lastTokenEndIndex = -1;
            this.produce(stack, lineLength);
            this._binaryTokens[this._binaryTokens.length - 2] = 0;
        }
        var result = new Uint32Array(this._binaryTokens.length);
        for (var i = 0, len = this._binaryTokens.length; i < len; i++) {
            result[i] = this._binaryTokens[i];
        }
        return result;
    };
    return LineTokens;
}());
//# sourceMappingURL=grammar.js.map
});
$load('./registry', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var grammar_1 = require("./grammar");
var SyncRegistry = (function () {
    function SyncRegistry(theme) {
        this._theme = theme;
        this._grammars = {};
        this._rawGrammars = {};
        this._injectionGrammars = {};
    }
    SyncRegistry.prototype.setTheme = function (theme) {
        var _this = this;
        this._theme = theme;
        Object.keys(this._grammars).forEach(function (scopeName) {
            var grammar = _this._grammars[scopeName];
            grammar.onDidChangeTheme();
        });
    };
    SyncRegistry.prototype.getColorMap = function () {
        return this._theme.getColorMap();
    };
    /**
     * Add `grammar` to registry and return a list of referenced scope names
     */
    SyncRegistry.prototype.addGrammar = function (grammar, injectionScopeNames) {
        this._rawGrammars[grammar.scopeName] = grammar;
        var includedScopes = {};
        grammar_1.collectIncludedScopes(includedScopes, grammar);
        if (injectionScopeNames) {
            this._injectionGrammars[grammar.scopeName] = injectionScopeNames;
            injectionScopeNames.forEach(function (scopeName) {
                includedScopes[scopeName] = true;
            });
        }
        return Object.keys(includedScopes);
    };
    /**
     * Lookup a raw grammar.
     */
    SyncRegistry.prototype.lookup = function (scopeName) {
        return this._rawGrammars[scopeName];
    };
    /**
     * Returns the injections for the given grammar
     */
    SyncRegistry.prototype.injections = function (targetScope) {
        return this._injectionGrammars[targetScope];
    };
    /**
     * Get the default theme settings
     */
    SyncRegistry.prototype.getDefaults = function () {
        return this._theme.getDefaults();
    };
    /**
     * Match a scope in the theme.
     */
    SyncRegistry.prototype.themeMatch = function (scopeName) {
        return this._theme.match(scopeName);
    };
    /**
     * Lookup a grammar.
     */
    SyncRegistry.prototype.grammarForScopeName = function (scopeName, initialLanguage, embeddedLanguages) {
        if (!this._grammars[scopeName]) {
            var rawGrammar = this._rawGrammars[scopeName];
            if (!rawGrammar) {
                return null;
            }
            this._grammars[scopeName] = grammar_1.createGrammar(rawGrammar, initialLanguage, embeddedLanguages, this);
        }
        return this._grammars[scopeName];
    };
    return SyncRegistry;
}());
exports.SyncRegistry = SyncRegistry;
//# sourceMappingURL=registry.js.map
});
$load('./main', function(require, module, exports) {
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var registry_1 = require("./registry");
var grammarReader_1 = require("./grammarReader");
var theme_1 = require("./theme");
var grammar_1 = require("./grammar");
var DEFAULT_OPTIONS = {
    getFilePath: function (scopeName) { return null; },
    getInjections: function (scopeName) { return null; }
};
/**
 * The registry that will hold all grammars.
 */
var Registry = (function () {
    function Registry(locator) {
        if (locator === void 0) { locator = DEFAULT_OPTIONS; }
        this._locator = locator;
        this._syncRegistry = new registry_1.SyncRegistry(theme_1.Theme.createFromRawTheme(locator.theme));
    }
    /**
     * Change the theme. Once called, no previous `ruleStack` should be used anymore.
     */
    Registry.prototype.setTheme = function (theme) {
        this._syncRegistry.setTheme(theme_1.Theme.createFromRawTheme(theme));
    };
    /**
     * Returns a lookup array for color ids.
     */
    Registry.prototype.getColorMap = function () {
        return this._syncRegistry.getColorMap();
    };
    /**
     * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
     * Please do not use language id 0.
     */
    Registry.prototype.loadGrammarWithEmbeddedLanguages = function (initialScopeName, initialLanguage, embeddedLanguages, callback) {
        var _this = this;
        this._loadGrammar(initialScopeName, function (err) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, _this.grammarForScopeName(initialScopeName, initialLanguage, embeddedLanguages));
        });
    };
    /**
     * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
     */
    Registry.prototype.loadGrammar = function (initialScopeName, callback) {
        var _this = this;
        this._loadGrammar(initialScopeName, function (err) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, _this.grammarForScopeName(initialScopeName));
        });
    };
    Registry.prototype._loadGrammar = function (initialScopeName, callback) {
        var remainingScopeNames = [initialScopeName];
        var seenScopeNames = {};
        seenScopeNames[initialScopeName] = true;
        while (remainingScopeNames.length > 0) {
            var scopeName = remainingScopeNames.shift();
            if (this._syncRegistry.lookup(scopeName)) {
                continue;
            }
            var filePath = this._locator.getFilePath(scopeName);
            if (!filePath) {
                if (scopeName === initialScopeName) {
                    callback(new Error('Unknown location for grammar <' + initialScopeName + '>'));
                    return;
                }
                continue;
            }
            try {
                var grammar = grammarReader_1.readGrammarSync(filePath);
                var injections = (typeof this._locator.getInjections === 'function') && this._locator.getInjections(scopeName);
                var deps = this._syncRegistry.addGrammar(grammar, injections);
                deps.forEach(function (dep) {
                    if (!seenScopeNames[dep]) {
                        seenScopeNames[dep] = true;
                        remainingScopeNames.push(dep);
                    }
                });
            }
            catch (err) {
                if (scopeName === initialScopeName) {
                    callback(err);
                    return;
                }
            }
        }
        callback(null);
    };
    /**
     * Load the grammar at `path` synchronously.
     */
    Registry.prototype.loadGrammarFromPathSync = function (path, initialLanguage, embeddedLanguages) {
        if (initialLanguage === void 0) { initialLanguage = 0; }
        if (embeddedLanguages === void 0) { embeddedLanguages = null; }
        var rawGrammar = grammarReader_1.readGrammarSync(path);
        var injections = this._locator.getInjections(rawGrammar.scopeName);
        this._syncRegistry.addGrammar(rawGrammar, injections);
        return this.grammarForScopeName(rawGrammar.scopeName, initialLanguage, embeddedLanguages);
    };
    /**
     * Get the grammar for `scopeName`. The grammar must first be created via `loadGrammar` or `loadGrammarFromPathSync`.
     */
    Registry.prototype.grammarForScopeName = function (scopeName, initialLanguage, embeddedLanguages) {
        if (initialLanguage === void 0) { initialLanguage = 0; }
        if (embeddedLanguages === void 0) { embeddedLanguages = null; }
        return this._syncRegistry.grammarForScopeName(scopeName, initialLanguage, embeddedLanguages);
    };
    return Registry;
}());
exports.Registry = Registry;
exports.INITIAL = grammar_1.StackElement.NULL;
//# sourceMappingURL=main.js.map
});
module.exports = $map['./main'].exports;
//# sourceMappingURL=_suffix.js.map
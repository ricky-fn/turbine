(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.turbine = factory());
}(this, (function () { 'use strict';

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var compat = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.startsWith = startsWith;
	exports.endsWith = endsWith;
	exports.stringIncludes = stringIncludes;
	exports.isRealNaN = isRealNaN;
	exports.arrayIncludes = arrayIncludes;
	/*
	  We don't want to include babel-polyfill in our project.
	    - Library authors should be using babel-runtime for non-global polyfilling
	    - Adding babel-polyfill/-runtime increases bundle size significantly

	  We will include our polyfill instance methods as regular functions.
	*/

	function startsWith(str, searchString, position) {
	  return str.substr(position || 0, searchString.length) === searchString;
	}

	function endsWith(str, searchString, position) {
	  var index = (position || str.length) - searchString.length;
	  var lastIndex = str.lastIndexOf(searchString, index);
	  return lastIndex !== -1 && lastIndex === index;
	}

	function stringIncludes(str, searchString, position) {
	  return str.indexOf(searchString, position || 0) !== -1;
	}

	function isRealNaN(x) {
	  return typeof x === 'number' && isNaN(x);
	}

	function arrayIncludes(array, searchElement, position) {
	  var len = array.length;
	  if (len === 0) return false;

	  var lookupIndex = position | 0;
	  var isNaNElement = isRealNaN(searchElement);
	  var searchIndex = lookupIndex >= 0 ? lookupIndex : len + lookupIndex;
	  while (searchIndex < len) {
	    var element = array[searchIndex++];
	    if (element === searchElement) return true;
	    if (isNaNElement && isRealNaN(element)) return true;
	  }

	  return false;
	}

	});

	unwrapExports(compat);
	var compat_1 = compat.startsWith;
	var compat_2 = compat.endsWith;
	var compat_3 = compat.stringIncludes;
	var compat_4 = compat.isRealNaN;
	var compat_5 = compat.arrayIncludes;

	var lexer_1 = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = lexer;
	exports.lex = lex;
	exports.findTextEnd = findTextEnd;
	exports.lexText = lexText;
	exports.lexComment = lexComment;
	exports.lexTag = lexTag;
	exports.isWhitespaceChar = isWhitespaceChar;
	exports.lexTagName = lexTagName;
	exports.lexTagAttributes = lexTagAttributes;
	exports.lexSkipTag = lexSkipTag;



	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function lexer(str, options) {
	  var state = { str: str, options: options, cursor: 0, tokens: [] };
	  lex(state);
	  return state.tokens;
	}

	function lex(state) {
	  var str = state.str;

	  var len = str.length;
	  while (state.cursor < len) {
	    var start = state.cursor;
	    lexText(state);
	    if (state.cursor === start) {
	      var isComment = (0, compat.startsWith)(str, '!--', state.cursor + 1);
	      if (isComment) {
	        lexComment(state);
	      } else {
	        var tagName = lexTag(state);
	        var safeTag = tagName.toLowerCase();
	        var childlessTags = state.options.childlessTags;

	        if ((0, compat.arrayIncludes)(childlessTags, safeTag)) {
	          lexSkipTag(tagName, state);
	        }
	      }
	    }
	  }
	}

	var alphanumeric = /[A-Za-z0-9]/;
	function findTextEnd(str, index) {
	  while (true) {
	    var textEnd = str.indexOf('<', index);
	    if (textEnd === -1) {
	      return textEnd;
	    }
	    var char = str.charAt(textEnd + 1);
	    if (char === '/' || char === '!' || alphanumeric.test(char)) {
	      return textEnd;
	    }
	    index = textEnd + 1;
	  }
	}

	function lexText(state) {
	  var type = 'text';
	  var str = state.str,
	      cursor = state.cursor;

	  var textEnd = findTextEnd(str, cursor);
	  if (textEnd === -1) {
	    // there is only text left
	    var _content = str.slice(cursor);
	    state.cursor = str.length;
	    state.tokens.push({ type: type, content: _content });
	    return;
	  }

	  if (textEnd === cursor) return;

	  var content = str.slice(cursor, textEnd);
	  state.cursor = textEnd;
	  state.tokens.push({ type: type, content: content });
	}

	function lexComment(state) {
	  state.cursor += 4; // "<!--".length
	  var str = state.str,
	      cursor = state.cursor;

	  var commentEnd = str.indexOf('-->', cursor);
	  var type = 'comment';
	  if (commentEnd === -1) {
	    // there is only the comment left
	    var _content2 = str.slice(cursor);
	    state.cursor = str.length;
	    state.tokens.push({ type: type, content: _content2 });
	    return;
	  }

	  var content = str.slice(cursor, commentEnd);
	  state.cursor = commentEnd + 3; // "-->".length
	  state.tokens.push({ type: type, content: content });
	}

	function lexTag(state) {
	  var str = state.str;

	  {
	    var secondChar = str.charAt(state.cursor + 1);
	    var close = secondChar === '/';
	    state.tokens.push({ type: 'tag-start', close: close });
	    state.cursor += close ? 2 : 1;
	  }
	  var tagName = lexTagName(state);
	  lexTagAttributes(state);
	  {
	    var firstChar = str.charAt(state.cursor);
	    var _close = firstChar === '/';
	    state.tokens.push({ type: 'tag-end', close: _close });
	    state.cursor += _close ? 2 : 1;
	  }
	  return tagName;
	}

	// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#special-white-space
	var whitespace = /\s/;
	function isWhitespaceChar(char) {
	  return whitespace.test(char);
	}

	function lexTagName(state) {
	  var str = state.str,
	      cursor = state.cursor;

	  var len = str.length;
	  var start = cursor;
	  while (start < len) {
	    var char = str.charAt(start);
	    var isTagChar = !(isWhitespaceChar(char) || char === '/' || char === '>');
	    if (isTagChar) break;
	    start++;
	  }

	  var end = start + 1;
	  while (end < len) {
	    var _char = str.charAt(end);
	    var _isTagChar = !(isWhitespaceChar(_char) || _char === '/' || _char === '>');
	    if (!_isTagChar) break;
	    end++;
	  }

	  state.cursor = end;
	  var tagName = str.slice(start, end);
	  state.tokens.push({ type: 'tag', content: tagName });
	  return tagName;
	}

	function lexTagAttributes(state) {
	  var str = state.str,
	      tokens = state.tokens;

	  var cursor = state.cursor;
	  var quote = null; // null, single-, or double-quote
	  var wordBegin = cursor; // index of word start
	  var words = []; // "key", "key=value", "key='value'", etc
	  var len = str.length;
	  while (cursor < len) {
	    var char = str.charAt(cursor);
	    if (quote) {
	      var isQuoteEnd = char === quote;
	      if (isQuoteEnd) {
	        quote = null;
	      }
	      cursor++;
	      continue;
	    }

	    var isTagEnd = char === '/' || char === '>';
	    if (isTagEnd) {
	      if (cursor !== wordBegin) {
	        words.push(str.slice(wordBegin, cursor));
	      }
	      break;
	    }

	    var isWordEnd = isWhitespaceChar(char);
	    if (isWordEnd) {
	      if (cursor !== wordBegin) {
	        words.push(str.slice(wordBegin, cursor));
	      }
	      wordBegin = cursor + 1;
	      cursor++;
	      continue;
	    }

	    var isQuoteStart = char === '\'' || char === '"';
	    if (isQuoteStart) {
	      quote = char;
	      cursor++;
	      continue;
	    }

	    cursor++;
	  }
	  state.cursor = cursor;

	  var wLen = words.length;
	  var type = 'attribute';
	  for (var i = 0; i < wLen; i++) {
	    var word = words[i];
	    var isNotPair = word.indexOf('=') === -1;
	    if (isNotPair) {
	      var secondWord = words[i + 1];
	      if (secondWord && (0, compat.startsWith)(secondWord, '=')) {
	        if (secondWord.length > 1) {
	          var newWord = word + secondWord;
	          tokens.push({ type: type, content: newWord });
	          i += 1;
	          continue;
	        }
	        var thirdWord = words[i + 2];
	        i += 1;
	        if (thirdWord) {
	          var _newWord = word + '=' + thirdWord;
	          tokens.push({ type: type, content: _newWord });
	          i += 1;
	          continue;
	        }
	      }
	    }
	    if ((0, compat.endsWith)(word, '=')) {
	      var _secondWord = words[i + 1];
	      if (_secondWord && !(0, compat.stringIncludes)(_secondWord, '=')) {
	        var _newWord3 = word + _secondWord;
	        tokens.push({ type: type, content: _newWord3 });
	        i += 1;
	        continue;
	      }

	      var _newWord2 = word.slice(0, -1);
	      tokens.push({ type: type, content: _newWord2 });
	      continue;
	    }

	    tokens.push({ type: type, content: word });
	  }
	}

	function lexSkipTag(tagName, state) {
	  var str = state.str,
	      cursor = state.cursor,
	      tokens = state.tokens;

	  var len = str.length;
	  var index = cursor;
	  while (index < len) {
	    var nextTag = str.indexOf('</', index);
	    if (nextTag === -1) {
	      lexText(state);
	      break;
	    }

	    var tagState = { str: str, cursor: nextTag + 2, tokens: [] };
	    var name = lexTagName(tagState);
	    var safeTagName = tagName.toLowerCase();
	    if (safeTagName !== name.toLowerCase()) {
	      index = tagState.cursor;
	      continue;
	    }

	    var content = str.slice(cursor, nextTag);
	    tokens.push({ type: 'text', content: content });
	    var openTag = { type: 'tag-start', close: true };
	    var closeTag = { type: 'tag-end', close: false };
	    lexTagAttributes(tagState);
	    tokens.push.apply(tokens, [openTag].concat(_toConsumableArray(tagState.tokens), [closeTag]));
	    state.cursor = tagState.cursor + 1;
	    break;
	  }
	}

	});

	unwrapExports(lexer_1);
	var lexer_2 = lexer_1.lex;
	var lexer_3 = lexer_1.findTextEnd;
	var lexer_4 = lexer_1.lexText;
	var lexer_5 = lexer_1.lexComment;
	var lexer_6 = lexer_1.lexTag;
	var lexer_7 = lexer_1.isWhitespaceChar;
	var lexer_8 = lexer_1.lexTagName;
	var lexer_9 = lexer_1.lexTagAttributes;
	var lexer_10 = lexer_1.lexSkipTag;

	var parser_1 = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = parser;
	exports.hasTerminalParent = hasTerminalParent;
	exports.parse = parse;



	function parser(tokens, options) {
	  var root = { tagName: null, children: [] };
	  var state = { tokens: tokens, options: options, cursor: 0, stack: [root] };
	  parse(state);
	  return root.children;
	}

	function hasTerminalParent(tagName, stack, terminals) {
	  var tagParents = terminals[tagName];
	  if (tagParents) {
	    var currentIndex = stack.length - 1;
	    while (currentIndex >= 0) {
	      var parentTagName = stack[currentIndex].tagName;
	      if (parentTagName === tagName) {
	        break;
	      }
	      if ((0, compat.arrayIncludes)(tagParents, parentTagName)) {
	        return true;
	      }
	      currentIndex--;
	    }
	  }
	  return false;
	}

	function parse(state) {
	  var tokens = state.tokens,
	      options = state.options;
	  var stack = state.stack;

	  var nodes = stack[stack.length - 1].children;
	  var len = tokens.length;
	  var cursor = state.cursor;

	  while (cursor < len) {
	    var token = tokens[cursor];
	    if (token.type !== 'tag-start') {
	      nodes.push(token);
	      cursor++;
	      continue;
	    }

	    var tagToken = tokens[++cursor];
	    cursor++;
	    var tagName = tagToken.content.toLowerCase();
	    if (token.close) {
	      var index = stack.length;
	      var didRewind = false;
	      while (--index > -1) {
	        if (stack[index].tagName === tagName) {
	          stack.splice(index);
	          didRewind = true;
	          break;
	        }
	      }
	      while (cursor < len) {
	        var endToken = tokens[cursor];
	        if (endToken.type !== 'tag-end') break;
	        cursor++;
	      }
	      if (didRewind) {
	        break;
	      } else {
	        continue;
	      }
	    }

	    var isClosingTag = (0, compat.arrayIncludes)(options.closingTags, tagName);
	    var shouldRewindToAutoClose = isClosingTag;
	    if (shouldRewindToAutoClose) {
	      var terminals = options.closingTagAncestorBreakers;

	      shouldRewindToAutoClose = !hasTerminalParent(tagName, stack, terminals);
	    }

	    if (shouldRewindToAutoClose) {
	      // rewind the stack to just above the previous
	      // closing tag of the same name
	      var currentIndex = stack.length - 1;
	      while (currentIndex > 0) {
	        if (tagName === stack[currentIndex].tagName) {
	          stack = stack.slice(0, currentIndex);
	          var previousIndex = currentIndex - 1;
	          nodes = stack[previousIndex].children;
	          break;
	        }
	        currentIndex = currentIndex - 1;
	      }
	    }

	    var attributes = [];
	    var attrToken = void 0;
	    while (cursor < len) {
	      attrToken = tokens[cursor];
	      if (attrToken.type === 'tag-end') break;
	      attributes.push(attrToken.content);
	      cursor++;
	    }

	    cursor++;
	    var children = [];
	    nodes.push({
	      type: 'element',
	      tagName: tagToken.content,
	      attributes: attributes,
	      children: children
	    });

	    var hasChildren = !(attrToken.close || (0, compat.arrayIncludes)(options.voidTags, tagName));
	    if (hasChildren) {
	      stack.push({ tagName: tagName, children: children });
	      var innerState = { tokens: tokens, options: options, cursor: cursor, stack: stack };
	      parse(innerState);
	      cursor = innerState.cursor;
	    }
	  }
	  state.cursor = cursor;
	}

	});

	unwrapExports(parser_1);
	var parser_2 = parser_1.hasTerminalParent;
	var parser_3 = parser_1.parse;

	var format_1 = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.splitHead = splitHead;
	exports.unquote = unquote;
	exports.format = format;
	exports.formatAttributes = formatAttributes;
	function splitHead(str, sep) {
	  var idx = str.indexOf(sep);
	  if (idx === -1) return [str];
	  return [str.slice(0, idx), str.slice(idx + sep.length)];
	}

	function unquote(str) {
	  var car = str.charAt(0);
	  var end = str.length - 1;
	  var isQuoteStart = car === '"' || car === "'";
	  if (isQuoteStart && car === str.charAt(end)) {
	    return str.slice(1, end);
	  }
	  return str;
	}

	function format(nodes) {
	  return nodes.map(function (node) {
	    var type = node.type;
	    if (type === 'element') {
	      var tagName = node.tagName.toLowerCase();
	      var attributes = formatAttributes(node.attributes);
	      var children = format(node.children);
	      return { type: type, tagName: tagName, attributes: attributes, children: children };
	    }

	    return { type: type, content: node.content };
	  });
	}

	function formatAttributes(attributes) {
	  return attributes.map(function (attribute) {
	    var parts = splitHead(attribute.trim(), '=');
	    var key = parts[0];
	    var value = typeof parts[1] === 'string' ? unquote(parts[1]) : null;
	    return { key: key, value: value };
	  });
	}

	});

	unwrapExports(format_1);
	var format_2 = format_1.splitHead;
	var format_3 = format_1.unquote;
	var format_4 = format_1.format;
	var format_5 = format_1.formatAttributes;

	var stringify = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.formatAttributes = formatAttributes;
	exports.toHTML = toHTML;



	function formatAttributes(attributes) {
	  return attributes.reduce(function (attrs, attribute) {
	    var key = attribute.key,
	        value = attribute.value;

	    if (value === null) {
	      return attrs + ' ' + key;
	    }
	    var quoteEscape = value.indexOf('\'') !== -1;
	    var quote = quoteEscape ? '"' : '\'';
	    return attrs + ' ' + key + '=' + quote + value + quote;
	  }, '');
	}

	function toHTML(tree, options) {
	  return tree.map(function (node) {
	    if (node.type === 'text') {
	      return node.content;
	    }
	    if (node.type === 'comment') {
	      return '<!--' + node.content + '-->';
	    }
	    var tagName = node.tagName,
	        attributes = node.attributes,
	        children = node.children;

	    var isSelfClosing = (0, compat.arrayIncludes)(options.voidTags, tagName.toLowerCase());
	    return isSelfClosing ? '<' + tagName + formatAttributes(attributes) + '>' : '<' + tagName + formatAttributes(attributes) + '>' + toHTML(children, options) + '</' + tagName + '>';
	  }).join('');
	}

	exports.default = { toHTML: toHTML };

	});

	unwrapExports(stringify);
	var stringify_1 = stringify.formatAttributes;
	var stringify_2 = stringify.toHTML;

	var tags = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/*
	  Tags which contain arbitary non-parsed content
	  For example: <script> JavaScript should not be parsed
	*/
	var childlessTags = exports.childlessTags = ['style', 'script', 'template'];

	/*
	  Tags which auto-close because they cannot be nested
	  For example: <p>Outer<p>Inner is <p>Outer</p><p>Inner</p>
	*/
	var closingTags = exports.closingTags = ['html', 'head', 'body', 'p', 'dt', 'dd', 'li', 'option', 'thead', 'th', 'tbody', 'tr', 'td', 'tfoot', 'colgroup'];

	/*
	  Closing tags which have ancestor tags which
	  may exist within them which prevent the
	  closing tag from auto-closing.
	  For example: in <li><ul><li></ul></li>,
	  the top-level <li> should not auto-close.
	*/
	var closingTagAncestorBreakers = exports.closingTagAncestorBreakers = {
	  li: ['ul', 'ol', 'menu'],
	  dt: ['dl'],
	  dd: ['dl'],
	  tbody: ['table'],
	  thead: ['table'],
	  tfoot: ['table'],
	  tr: ['table'],
	  td: ['table']
	};

	/*
	  Tags which do not need the closing tag
	  For example: <img> does not need </img>
	*/
	var voidTags = exports.voidTags = ['!doctype', 'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

	});

	unwrapExports(tags);
	var tags_1 = tags.childlessTags;
	var tags_2 = tags.closingTags;
	var tags_3 = tags.closingTagAncestorBreakers;
	var tags_4 = tags.voidTags;

	var lib = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.parseDefaults = undefined;
	exports.parse = parse;
	exports.stringify = stringify$$1;



	var _lexer2 = _interopRequireDefault(lexer_1);



	var _parser2 = _interopRequireDefault(parser_1);







	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var parseDefaults = exports.parseDefaults = {
	  voidTags: tags.voidTags,
	  closingTags: tags.closingTags,
	  childlessTags: tags.childlessTags,
	  closingTagAncestorBreakers: tags.closingTagAncestorBreakers
	};

	function parse(str) {
	  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : parseDefaults;

	  var tokens = (0, _lexer2.default)(str, options);
	  var nodes = (0, _parser2.default)(tokens, options);
	  return (0, format_1.format)(nodes, options);
	}

	function stringify$$1(ast) {
	  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : parseDefaults;

	  return (0, stringify.toHTML)(ast, options);
	}

	});

	unwrapExports(lib);
	var lib_1 = lib.parseDefaults;
	var lib_2 = lib.parse;
	var lib_3 = lib.stringify;

	function renderJsonTree(template) {
	    var json = lib_2(template);

	    return loopDomTree(json);
	}

	function loopDomTree(tree) {
	    var keys = [];
	    tree.forEach(function (el) {
	        var key = void 0;

	        do {
	            key = createHexRandom();
	        } while (keys.indexOf(key) >= 0);

	        keys.push(key);
	        el.key = key;

	        if (el.type === "element" && el.children.length > 0) {
	            loopDomTree(el.children);
	        }
	    });
	    return tree;
	}

	function createHexRandom() {
	    var num = Math.floor(Math.random() * 1000000);
	    num = num.toString(16);
	    return num;
	}

	function render(domTree, parentNode) {
	    var fragment = parentNode || document.createDocumentFragment();

	    if (!isArray(domTree)) {
	        domTree = [domTree];
	    }

	    combine(domTree, fragment);

	    return fragment;
	}

	function combine(domTree, fragment) {
	    domTree.forEach(function (vNode, index) {
	        var el = void 0;
	        if (!vNode.isReady || vNode.isDirty) {
	            if (vNode.type == "element") {
	                el = creatByTag(fragment, vNode, vNode.isDirty);

	                vNode.ready(el);

	                combine(vNode.children, el);
	            } else {
	                if (vNode.type == "text") {
	                    el = creatByText(fragment, vNode, vNode.isDirty);
	                } else if (vNode.type == "comment") {
	                    el = creatByCommon(fragment, vNode, vNode.isDirty);
	                }
	                vNode.ready(el);
	            }
	        } else if (vNode.type === "element" && vNode.children.length > 0 && vNode.el.type != "text") {
	            combine(vNode.children, function () {
	                var isForm = fragment.nodeName === "FORM";
	                if (!isForm && fragment[index]) {
	                    return fragment[index];
	                } else {
	                    return fragment.childNodes[index];
	                }
	            }());
	        }
	    });
	}

	function creatByCommon(fragment, vNode, replace) {
	    var common = document.createComment(vNode.content);
	    if (replace === true) {
	        fragment.replaceChild(common, fragment.childNodes[vNode.index]);
	    } else {
	        insertNode(common, vNode, fragment);
	    }

	    return common;
	}

	function creatByText(fragment, vNode, replace) {
	    var text = document.createTextNode(vNode.content);
	    if (replace === true) {
	        fragment.replaceChild(text, fragment.childNodes[vNode.index]);
	    } else {
	        insertNode(text, vNode, fragment);
	    }

	    return text;
	}

	function creatByTag(fragment, vNode, replace) {
	    var tagName = vNode.tagName == "turbine" ? "div" : vNode.tagName;
	    var dom = document.createElement(tagName);

	    if (replace === true) {
	        fragment.replaceChild(setAttribs(dom, vNode.attributes), fragment.childNodes[vNode.index]);
	    } else {
	        insertNode(setAttribs(dom, vNode.attributes), vNode, fragment);
	    }

	    return dom;
	}

	function setAttribs(dom, attribs) {
	    attribs.forEach(function (attr) {
	        dom.setAttribute(attr.key, attr.value);
	    });

	    return dom;
	}

	function insertNode(node, vNode, fragment) {

	    if (fragment.childNodes.hasOwnProperty(vNode.index)) {
	        fragment.insertBefore(node, fragment.childNodes[vNode.index]);
	    } else {
	        fragment.appendChild(node);
	    }
	}

	function isArray(o) {
	    return Object.prototype.toString.call(o) == "[object Array]";
	}

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	var createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

	var _extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];

	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }

	  return target;
	};

	var inherits = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	  }

	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	};

	var possibleConstructorReturn = function (self, call) {
	  if (!self) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return call && (typeof call === "object" || typeof call === "function") ? call : self;
	};

	/**
	 * Created by Ricky on 2017/9/22.
	 */

	var Dep = function () {
	    function Dep() {
	        classCallCheck(this, Dep);

	        this.subs = [];
	    }

	    createClass(Dep, [{
	        key: "addSub",
	        value: function addSub(watcher) {
	            if (this.subs.indexOf(watcher) < 0) {
	                this.subs.push(watcher);
	                watcher.deps.push(this);
	            }
	        }
	    }, {
	        key: "notify",
	        value: function notify(val, oldVal) {
	            this.subs.forEach(function (sub) {
	                if (sub != undefined) {
	                    sub.update(val, oldVal);
	                }
	            });
	        }
	    }]);
	    return Dep;
	}();

	var react = function () {
	    function react(target, resource, call) {
	        classCallCheck(this, react);

	        var length = arguments.length;
	        if (length == 2 || length == 3) {
	            this.recall = call;
	            this.observe(target, resource);
	        } else if (length == 1) {
	            this.recall = resource;
	        }
	    }

	    createClass(react, [{
	        key: "observe",
	        value: function observe(_obj, _res) {
	            var type = Object.prototype.toString.call(_res);
	            var ob = void 0;
	            if (type == "[object Object]" || type == "[object Array]") {
	                if (_res.__ob__) {
	                    ob = _res.__ob__;
	                } else if (_obj.__ob__) {
	                    ob = _obj.__ob__;
	                } else {
	                    ob = type == "[object Array]" ? new observerArray(_obj, this) : new observer(_obj, this);
	                }

	                this.loopObj(_obj, _res, ob);
	                if (type == "[object Array]") {
	                    this.replaceArrayProperty(_obj, ob);
	                }
	            }
	        }
	    }, {
	        key: "loopObj",
	        value: function loopObj(obj, res, observer) {
	            var _this = this;

	            Object.keys(res).forEach(function (prop) {
	                _this.observeObj(obj, res, prop, observer); // observe and set value to reactive data
	            });
	        }
	    }, {
	        key: "observeObj",
	        value: function observeObj(obj, res, prop, observer) {
	            var _this2 = this;

	            var dep = observer.dep;
	            var val = res[prop],
	                oldVal = void 0;

	            if (!(res instanceof Array)) {
	                // define value's subValue which value is an Object
	                Object.defineProperty(obj, prop, {
	                    get: function get$$1() {
	                        var watcher = Dep.target;

	                        if (isObservered(val)) {
	                            dep = val.__ob__.dep;
	                        }

	                        if (watcher != null || watcher != undefined) {
	                            // Dep target would be triggered by watcher module
	                            dep.addSub(watcher); // push watcher Object into the dep
	                        }

	                        return val;
	                    },
	                    set: function set$$1(newVal) {
	                        if (newVal === val) {
	                            return;
	                        } else {
	                            oldVal = val;
	                            val = newVal;
	                        }

	                        if (oldVal instanceof Object) {
	                            injectWathcers(oldVal, val);
	                        } else {
	                            dep.notify();
	                        }

	                        _this2.recall && _this2.recall(val); // call the public recall
	                    },
	                    enumerable: true,
	                    configurable: true
	                });
	            } else {
	                obj[prop] = val;
	            }

	            // observer.value = obj; // update the observer's value this will impact the real data structure
	            this.observe(obj[prop], res[prop]); // loop subValues
	        }
	    }, {
	        key: "replaceArrayProperty",
	        value: function replaceArrayProperty(array, observer) {
	            var ORP = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
	            var arrayProto = Array.prototype;
	            var newProto = Object.create(arrayProto);
	            var dep = observer.dep;
	            var self = this;
	            ORP.forEach(function (prop) {
	                Object.defineProperty(newProto, prop, {
	                    value: function value() {
	                        var oldVal = array.concat();
	                        arrayProto[prop].apply(array, arguments);
	                        array.forEach(function (val, index) {
	                            if (!isObservered(val) && val instanceof Object) {
	                                self.observe(val, val);
	                                if (index < oldVal.length - 1) {
	                                    injectWathcers(oldVal[index], array[index]);
	                                }
	                            }
	                        });

	                        dep.notify();
	                        self.recall && self.recall();
	                    },
	                    enumerable: false,
	                    configurable: true,
	                    writable: true
	                });
	            });
	            setPrototypeOf(array, newProto);
	            // array.__proto__ = newProto;
	            observer.value = array;
	        }
	    }]);
	    return react;
	}();

	var observer = function () {
	    function observer(target, react) {
	        classCallCheck(this, observer);

	        this.dep = new Dep();
	        this.react = react;
	        this.value = target;

	        Object.defineProperty(target, "__ob__", {
	            enumerable: false,
	            value: this
	        });
	    }

	    createClass(observer, [{
	        key: "update",
	        value: function update(key, newVal) {
	            var existed = hasKey(this.value, key);
	            var referred = {};

	            if (existed) {
	                if (newVal instanceof Object) {
	                    referred = newVal instanceof Array ? [] : {};
	                    this.react.observe(referred, newVal);
	                    this.value[key] = referred;
	                } else {
	                    this.value[key] = newVal;
	                }
	            } else {
	                referred[key] = newVal;
	                this.react.observeObj(this.value, referred, key, this);
	                this.dep.notify();
	                this.react.recall && this.react.recall();
	            }
	        }
	    }, {
	        key: "destroy",
	        value: function destroy(prop, refresh) {
	            var ob = void 0,
	                dep = void 0;

	            if (arguments.length > 0) {
	                // if prop argument has been settled, destroy sub values which is belong to prop
	                ob = isObservered(this.value[prop]) && this.value[prop].__ob__;
	                dep = ob ? ob.dep : false;
	                delete this.value[prop];
	                if (this.value instanceof Array) {
	                    this.value.length -= 1;
	                }
	            } else {
	                ob = this;
	                dep = ob.dep;
	            }

	            if (ob) {
	                // loop value's sub values to delete them and lunch destroy command discretely.
	                Object.keys(ob.value).forEach(function (val) {
	                    var ob = val.__ob__;
	                    if (isObservered(val)) {
	                        ob.destroy();
	                        ob.value[prop] = null;
	                    }
	                });

	                // erase all watchers
	                dep.subs.forEach(function (watcher) {
	                    return watcher.unwatch();
	                });
	            }

	            if (refresh === true) {
	                this.react.recall && this.react.recall();
	            }
	        }
	    }]);
	    return observer;
	}();

	var observerArray = function (_observer) {
	    inherits(observerArray, _observer);

	    function observerArray(target, rawVal, react) {
	        classCallCheck(this, observerArray);
	        return possibleConstructorReturn(this, (observerArray.__proto__ || Object.getPrototypeOf(observerArray)).call(this, target, rawVal, react));
	    }

	    createClass(observerArray, [{
	        key: "update",
	        value: function update(key, newVal) {
	            var existed = hasKey(this.value, key);
	            var referred = [];
	            var oldVal = this.value[key];
	            referred[key] = newVal;

	            if (!isObservered(newVal)) {
	                this.react.observeObj(this.value, referred, key, this);
	            } else {
	                this.value[key] = newVal;
	            }

	            if (existed) {
	                injectWathcers(oldVal, newVal);
	            }

	            this.dep.notify();

	            // if (existed && oldVal instanceof Object) {
	            //
	            // }

	            this.react.recall && this.react.recall();
	        }
	    }]);
	    return observerArray;
	}(observer);

	function setPrototypeOf(obj, defaults$$1) {
	    var keys = Object.getOwnPropertyNames(defaults$$1);

	    for (var i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        var value = Object.getOwnPropertyDescriptor(defaults$$1, key);

	        if (value && value.configurable) {
	            Object.defineProperty(obj, key, value);
	        }
	    }

	    return obj;
	}

	function isObservered(val) {
	    return (val instanceof Object || val instanceof Array) && val.__ob__ != undefined ? true : false;
	}

	function getobserve(val) {
	    return isObservered(val) ? val.__ob__ : null;
	}

	function hasKey(val, key) {
	    return Object.getOwnPropertyDescriptor(val, key);
	}

	function injectWathcers(oldVal, newVal) {
	    var preOB = getobserve(oldVal);
	    var nextOB = getobserve(newVal);
	    if (nextOB && preOB) {
	        updateWatchers(preOB.dep, nextOB.dep);
	        preOB.dep.notify();
	        eliminateWatchers(preOB.dep);
	        var newValKeys = Object.keys(newVal);
	        Object.keys(oldVal).forEach(function (val, key) {
	            if (isObservered(oldVal[val]) && newValKeys[key]) {
	                injectWathcers(oldVal[val], newVal[newValKeys[key]]);
	            }
	        });
	    }
	}

	function updateWatchers(oldDep, newDep) {
	    var watchers = oldDep.subs;
	    newDep.subs = newDep.subs.concat(watchers);

	    watchers.forEach(function (watcher) {
	        if (watcher != undefined) {
	            // let index = watcher.deps.indexOf(oldDep);
	            // watcher.deps.splice(index, 1, newDep);
	            watcher.deps.push(newDep);
	        }
	    });
	}

	function eliminateWatchers(dep) {
	    dep.subs.length = 0;
	}

	function evalWithContext(content, context) {
	    content = content.replace(/&amp;/g, "&");
	    return new Function("with(this){return " + content + "}").call(context);
	}

	var watch = function () {
	    function watch(vm, name, option) {
	        classCallCheck(this, watch);

	        var type = typeof option === "undefined" ? "undefined" : _typeof(option);
	        var handler = void 0,
	            immediate = void 0,
	            deep = void 0;
	        if (type === "function") {
	            handler = option;
	            deep = false;
	        } else if (type === "object") {
	            handler = option.handler;
	            immediate = option.immediate;
	            deep = option.deep || false;
	        }

	        Dep.target = this;
	        this.deps = [];
	        this.name = name;
	        this.vm = vm;
	        this.value = this.get();
	        this.handler = handler;
	        this.deep = deep;
	        this.immediate = immediate;
	        Dep.target = null;
	        if (deep === true) {
	            loopVal.call(this, this.value);
	        }

	        if (immediate) {
	            this.update();
	        }
	    }

	    createClass(watch, [{
	        key: "update",
	        value: function update(newVals) {
	            var oldVal = this.value;
	            var newVal = this.get();
	            this.value = newVal;

	            if (this.immediate) {
	                this.handler.call(this.vm, newVal, oldVal);
	                return this.immediate = false;
	            }

	            if (this.deep && !this.immediate && newVals != undefined) {
	                loopVal.call(this, newVals);
	            }

	            if (oldVal !== newVal || oldVal instanceof Object) {
	                this.handler.call(this.vm, newVal, oldVal);
	            }
	        }
	    }, {
	        key: "get",
	        value: function get$$1() {
	            return evalWithContext(this.name, this.vm);
	        }
	    }, {
	        key: "unwatch",
	        value: function unwatch() {
	            var _this = this;

	            this.deps.forEach(function (dep) {
	                var index = dep.subs.indexOf(_this);
	                dep.subs.splice(index, 1, undefined);
	            });
	            this.deps.length = 0;
	            this.vm = null;
	            this.node = null;
	            this.recall = null;
	            this.dep = null;
	            this.value = null;
	        }
	    }]);
	    return watch;
	}();

	function loopVal(val) {
	    var _this2 = this;

	    var resource = void 0;
	    if (val instanceof Array) {
	        resource = val;
	    } else if (val instanceof Object) {
	        resource = Object.keys(val);
	    } else {
	        Dep.target = this;
	        Dep.target = null;
	        return;
	    }
	    resource.forEach(function (sval, key) {
	        var isArray = val instanceof Array;
	        Dep.target = _this2;
	        isArray ? val[key] : val[sval];
	        Dep.target = null;

	        if (sval instanceof Object) {
	            loopVal.call(_this2, sval);
	        }
	    });
	}

	var vNode = function () {
	    function vNode(json) {
	        classCallCheck(this, vNode);

	        this.type = json.type;
	        this.el = null;
	        this.oberver = [];
	        this.watchers = [];
	        this.directives = [];
	        this.key = json.key;
	        this.isReady = false;
	        this.display = true;
	        this.parse = false;
	        this.index = null;
	        this.data = {};
	        this._if = null;

	        if (json.type === "element") {
	            this.children = json.children;
	            this.isComponent = false;
	            this.attributes = json.attributes;
	            this.context = null;
	            this.tagName = json.tagName;
	            this.reference = json;
	        } else {
	            this.content = json.content;
	        }
	    }

	    createClass(vNode, [{
	        key: "inserted",
	        value: function inserted(fn) {
	            this.oberver.push(fn);
	        }
	    }, {
	        key: "ready",
	        value: function ready(el) {
	            var _this = this;

	            this.el = el;
	            this.isDirty = false;

	            if (this.directives.length > 0 && !this.isReady) {
	                this.directives.forEach(function (dir) {
	                    if (dir.bind) {
	                        dir.bind(_this.el, dir.binding, _this);
	                    } else if (dir.update) {
	                        dir.update(_this.el, dir.binding, _this);
	                    }
	                });
	            }

	            this.isReady = true;
	            this.oberver.forEach(function (fn) {
	                return fn.call(_this, el);
	            });
	            this.oberver.length = 0;
	        }
	    }, {
	        key: "remove",
	        value: function remove() {
	            var _this2 = this;

	            if (this.isReady === false) {
	                return;
	            }

	            if (this.directives) {

	                this.directives.forEach(function (obj) {
	                    obj.unbind && obj.unbind(_this2.el, obj.binding, _this2);
	                });
	                this.directives.length = 0;
	            }

	            this.watchers.forEach(function (watcher) {
	                return watcher.unwatch();
	            });

	            if (this.isComponent) {
	                this.data.component._destroy();
	            } else {
	                if (this.type == "element") {
	                    this.children.forEach(function (node) {
	                        if (node instanceof vNode) {
	                            node.remove();
	                        }
	                    });
	                }
	                if (this.el.parentNode) {
	                    this.el.parentNode.removeChild(this.el);
	                }
	            }

	            this.oberver = null;
	            this.el = null;
	            this.context = null;
	            this.children = null;
	            this.attributes = null;
	            this.directives = null;
	            this.component = null;
	            this.reference = null;
	            this.data = null;
	            this.watchers = null;
	        }
	    }]);
	    return vNode;
	}();

	var types = [Number, String, Boolean];

	function clone(item, isDeep) {
	    if (!item) {
	        return item;
	    } // null, undefined values check
	    isDeep = arguments.length == 1 ? true : isDeep;
	    var result = void 0;
	    // normalizing primitives if someone did new String('aaa'), or new Number('444');
	    types.forEach(function (type) {
	        if (item instanceof type) {
	            result = type(item);
	        }
	    });
	    if (typeof result == "undefined") {
	        if (Object.prototype.toString.call(item) === "[object Array]") {
	            result = [];
	            var isRoot = false;
	            item.forEach(function (child) {
	                if (!isRoot) {
	                    if (child.tagName === "turbine") {
	                        isRoot = true;
	                        result.length = 0;
	                    }
	                    if (child.type === "comment") {
	                        return;
	                    }
	                    result.push(clone(child, isDeep));
	                }
	            });
	        } else if ((typeof item === "undefined" ? "undefined" : _typeof(item)) == "object") {
	            result = isNode(item) ? new vNode(item) : {};

	            for (var i in item) {
	                result[i] = !isDeep && i === "children" ? [] : clone(item[i], isDeep);
	            }
	        } else {
	            result = item;
	        }
	    }

	    return result;
	}

	function isNode(obj) {
	    return obj.type == "element" || obj.type == "text";
	}

	var C = void 0;

	function initComponent() {
	    if (C) {
	        return C;
	    }

	    C = function (_turbine$prototype$_i) {
	        inherits(component, _turbine$prototype$_i);

	        function component(config) {
	            classCallCheck(this, component);
	            var data = config.data,
	                props = config.props,
	                vNode = config.vNode;

	            var usedData = {};

	            if (typeof data === "function") {
	                usedData = data();
	            } else if (data != undefined) {
	                var _ret;

	                return _ret = console.warn("data has required as a function, please change your component's data structure"), possibleConstructorReturn(_this, _ret);
	            }

	            if (props != undefined && props instanceof Array) {
	                props.forEach(function (propName) {
	                    var prop = ArrayFind(vNode.attributes, function (attr) {
	                        return attr.key === propName;
	                    });
	                    if (prop == null) {
	                        return console.warn("cannot find prop name on element's attributes.\nprop name: " + propName);
	                    }
	                    usedData[propName] = prop.value;
	                });
	                delete config.prop;
	            }

	            var newProps = _extends({}, config, {
	                data: usedData,
	                _isComponent: true,
	                $parent: vNode.context,
	                slots: getSlots(vNode)
	            });

	            var _this = possibleConstructorReturn(this, (component.__proto__ || Object.getPrototypeOf(component)).call(this, newProps));

	            vNode.data.component = _this;
	            vNode.el = _this.$el;
	            vNode.tagName = _this.$el.tagName.toLowerCase();
	            return _this;
	        }

	        return component;
	    }(turbine.prototype._init);
	}

	function getSlots(vNode) {
	    var slots = {};
	    vNode.children.forEach(function (child) {
	        var isElement = child.type == "element";
	        var slot = isElement && ArrayFind(child.attributes, function (el) {
	            return el.key == "slot";
	        });
	        if (slot) {
	            slots[slot.value] = child;
	        } else if (isElement) {
	            slots["default"] = slots["default"] instanceof Array ? slots["default"].concat(child) : [child];
	        }
	    });
	    return slots;
	}

	function ArrayFind(array, callback) {
	    var i = void 0,
	        data = void 0;
	    for (i = 0; i < array.length; i++) {
	        data = array[i];
	        if (callback(data)) {
	            return data;
	        }
	    }
	}

	var _this4 = undefined;

	var directives = [{
	    directive: "if$",
	    level: 0,
	    use: function use(params) {
	        var binding = params.binding,
	            vNode = params.vNode;
	        // let _index = 0;
	        // let nextSibling;

	        // do {
	        //     _index += 1;
	        //     nextSibling = domTree[vNode.index + _index];
	        //
	        //     if (
	        //         nextSibling != undefined &&
	        //         nextSibling.type == "element" &&
	        //         (
	        //             nextSibling.attributes.find(el => el.key == "v-else") ||
	        //             nextSibling.attributes.find(el => el.key == "v-else-if")
	        //         )
	        //     ) {
	        //         nextSibling._if = binding.result;
	        //     }
	        // } while (nextSibling != undefined && nextSibling.type != "tag");
	        // vNode.reference.attributes = vNode.reference.attributes.filter(attr => attr.key != "v-if");

	        vNode._if = Boolean(binding.result);

	        if (!binding.result) {
	            vNode.type = "comment";
	            vNode.content = "";
	            vNode.children.length = 0;
	        }

	        binding.lastResult = binding.result;
	    },
	    update: function update(el, binding, vNode) {
	        if (binding.lastResult === binding.result) {
	            return vNode.isDirty = false;
	        }
	        if (binding.result === true) {
	            vNode.type = "element";
	            vNode.children = clone(vNode.reference.children);

	            if (vNode.isComponent && vNode.data.component === null) {
	                vNode.inserted(function (el) {
	                    var tagName = vNode.reference.tagName;
	                    var config = vNode.context._c[tagName];
	                    vNode.context._components.push(new initComponent(_extends({ el: el, vNode: vNode }, config)));
	                });
	            }
	        } else {
	            vNode.type = "comment";
	            vNode.content = "";
	            vNode.children.forEach(function (child) {
	                return child.remove();
	            });
	            vNode.children.length = 0;

	            if (vNode.isComponent && vNode.data.component) {
	                vNode.inserted(function () {
	                    vNode.data.component._destroy();
	                    vNode.data.component = null;
	                });
	                // let parentNode = el.parentNode;
	                // parentNode.insertBefore(document.createComment(""), parentNode.childNodes[vNode.index]);
	            }
	        }
	        vNode.isDirty = true;
	        vNode._if = Boolean(binding.result);
	        binding.lastResult = binding.result;
	    }
	}, {
	    directive: "else$",
	    level: 0,
	    preventDefaultVal: true,
	    use: function use(params) {
	        var vNode = params.vNode,
	            domTree = params.domTree;


	        var index = vNode.index;
	        var prevNode = void 0;

	        do {
	            prevNode = domTree[index -= 1];
	        } while (prevNode._if === null);

	        if (prevNode !== undefined && prevNode._if !== null) {
	            if (prevNode._if) {
	                vNode.type = "comment";
	                vNode.content = "";
	                vNode.children.length = 0;
	            }

	            vNode.data.originNode = prevNode;
	            vNode._else = !prevNode._if;
	        } else {
	            throw "Turbine couldn't \"t-if\" attribute on previous nodes ";
	        }
	    },
	    update: function update(el, binding, vNode) {
	        var originNode = vNode.data.originNode;

	        if (!originNode._if === vNode._else) {
	            return vNode.isDirty = false;
	        } else {
	            vNode.isDirty = true;
	            vNode._else = !originNode._if;
	            if (originNode._if) {
	                vNode.type = "comment";
	                vNode.content = "";
	                vNode.children.forEach(function (child) {
	                    return child.remove();
	                });
	                vNode.children.length = 0;
	            } else {
	                vNode.type = "element";
	                vNode.children = clone(vNode.reference.children);
	            }
	        }
	    }
	},
	// {
	//     directive: 'else\-if$',
	//     level: 0,
	//     use: (params, insertQueue, stop) => {
	//         let {vNode, domTree, index, binding} = params;
	//         let result = binding.result;
	//
	//         if (vNode.hasOwnProperty("_if")) {
	//             if (vNode._if === true) {
	//                 // editTree(domTree, index, 1);
	//                 stop();
	//                 result = true;
	//             } else if (vNode._if === false) {
	//                 if (!result) {
	//                     // editTree(domTree, index, 1);
	//                     stop();
	//                 }
	//             }
	//         } else {
	//             throw "cannot find a flag 'v-if' or 'v-else-if' in previous element";
	//         }
	//
	//         let _index = 0;
	//         let nextSibling;
	//
	//         do {
	//             _index += 1;
	//             nextSibling = domTree[vNode.index + _index];
	//
	//             if (
	//                 nextSibling != undefined &&
	//                 nextSibling.type == "element" &&
	//                 (
	//                     nextSibling.attributes.find(el => el.key == "v-else") ||
	//                     nextSibling.attributes.find(el => el.key == "v-else-if")
	//                 )
	//             ) {
	//                 nextSibling._if = result;
	//             }
	//         } while (nextSibling != undefined && nextSibling.type != "tag");
	//     }
	// },
	{
	    directive: "for$",
	    level: 0,
	    preventDefaultVal: true,
	    use: function use(params, insertQueue, stop) {
	        var vNode = params.vNode,
	            domTree = params.domTree,
	            properties = params.properties,
	            binding = params.binding;

	        var code = binding.value;
	        var inner = void 0,
	            counter = void 0,
	            length = void 0;

	        var args = code.split(" in ");
	        var mulArg = args[0].match(/^\(.*\)/g);
	        var content = trim(args[1]);

	        if (mulArg != null && mulArg.length == 1) {
	            var _params = mulArg[0].match(/\w+/g);
	            inner = _params[0];
	            counter = _params[1];
	        } else {
	            inner = trim(args[0]);
	        }
	        vNode.watchers.push(new watch(properties, content, {
	            handler: function handler(newVal) {
	                vNode.data.reference = isNaN(newVal) ? newVal : function () {
	                    var array = [];
	                    var max = Number(newVal);
	                    while (array.length < max) {
	                        array.push(array.length);
	                    }
	                    return array;
	                }();
	                if (length === undefined) {
	                    insertNodes({
	                        inner: inner,
	                        counter: counter,
	                        domTree: domTree,
	                        properties: properties,
	                        vNode: vNode
	                    });
	                    length = Object.keys(newVal).length;
	                } else {
	                    var nLength = Object.keys(newVal).length;
	                    if (nLength > length) {
	                        insertNodes({
	                            inner: inner,
	                            counter: counter,
	                            domTree: domTree,
	                            properties: properties,
	                            vNode: vNode,
	                            startAt: length - 1
	                        });
	                    } else if (nLength < length) {
	                        domTree.slice(vNode.index + 1 + nLength, vNode.index + 1 + length).forEach(function (node) {
	                            domTree.splice(domTree.indexOf(node), 1);
	                            node.remove();
	                        });
	                        domTree.forEach(function (_node, index) {
	                            _node.index = index;
	                        });
	                    }
	                    length = nLength;
	                }
	            },
	            immediate: true
	        }));

	        vNode.type = "comment";
	        vNode.content = "";
	        vNode.attributes = [];
	        stop();
	    }
	}, {
	    directive: "show",
	    level: 1,
	    update: function update(el, binding, vNode) {
	        var _this = this;

	        if (vNode.isDirty) {
	            return vNode.inserted(function (el) {
	                return _this.update(el, binding, vNode);
	            });
	        }
	        if (binding.result) {
	            el.style.display = binding.args || "block";
	        } else {
	            el.style.display = "none";
	        }
	    }
	}, {
	    directive: "on",
	    level: 1,
	    preventDefaultVal: true,
	    bind: function bind(el, binding, vNode) {
	        if (vNode._if === false) {
	            return;
	        }
	        var context = Object.create(vNode.context);
	        var events = [],
	            event = void 0,
	            fn = void 0;
	        if (binding.args.length > 0) {
	            event = binding.args;
	            fn = function fn(e) {
	                var args = Array.prototype.slice.call(arguments);
	                if (/\((.*?)\)/.test(binding.value)) {
	                    if (e instanceof Event) {
	                        context["$event"] = e;
	                    }
	                    return evalWithContext(binding.value, context);
	                } else {
	                    var result = evalWithContext(binding.value, context);
	                    if (result instanceof Function) {
	                        result.apply(context, args);
	                    }
	                }
	            };
	            events.push({ event: event, fn: fn });
	        } else {
	            var evalue = evalWithContext(binding.value, context);
	            if (evalue instanceof Object) {
	                Object.keys(evalue).forEach(function (key) {
	                    event = key;
	                    fn = evalue[key];
	                    if (fn instanceof Function) {
	                        events.push({ event: event, fn: fn });
	                    }
	                });
	            }
	        }

	        vNode.data.events = events;

	        if (vNode.isComponent === false) {
	            events.forEach(function (event) {
	                el.addEventListener(event.event, event.fn);
	            });
	        }
	    },
	    update: function update(el, binding, vNode) {
	        var _this2 = this;

	        if (vNode.isDirty) {
	            vNode.inserted(function (newEl) {
	                if (vNode._if === true) {
	                    _this2.bind(newEl, binding, vNode);
	                }
	            });
	        }
	    },
	    unbind: function unbind(el, binding, vNode) {
	        if (vNode.isComponent === false && vNode._if === true) {
	            vNode.data.events.forEach(function (event) {
	                el.removeEventListener(event.event, event.fn);
	            });
	            vNode.data.events.length = 0;
	        }
	    }
	}, {
	    directive: "bind",
	    level: 1,
	    bind: function bind(el, binding, vNode) {
	        if (vNode._if === false) {
	            return;
	        }
	        bindingUpdate(el, binding, vNode);
	    },
	    update: function update(el, binding, vNode) {
	        var _this3 = this;

	        if (vNode.isDirty) {
	            vNode.inserted(function (newEl) {
	                if (vNode._if === true) {
	                    _this3.update(newEl, binding, vNode);
	                }
	            });
	            return;
	        }
	        bindingUpdate(el, binding, vNode);
	    }
	}, {
	    //需要针对v-if做特殊处理
	    directive: "model$",
	    level: 1,
	    bind: function bind(el, binding, vNode) {
	        if (vNode._if === false) {
	            return;
	        }
	        var inputType = vNode.tagName == "textarea" ? "text" : ArrayFind$1(vNode.attributes, function (el) {
	            return el.key == "type";
	        }).value || "text";
	        var content = binding.value;
	        el.addEventListener("input", binding.inputEvent = function (e) {
	            var data = evalWithContext(content, vNode.context);
	            if (data != e.target.value) {
	                evalWithContext(content + "= '" + e.target.value + "'", vNode.context);
	            }
	        });
	        el.addEventListener("change", binding.changeEvent = function (e) {
	            var data = evalWithContext(content, vNode.context);
	            if (inputType == "checkbox" && data instanceof Array) {
	                if (el.checked == true) {
	                    data.push(el.value);
	                } else {
	                    var index = data.indexOf(el.value);
	                    data.splice(index, 1);
	                }
	            } else if (data != e.target.value) {
	                data = e.target.value;
	            }
	        });
	    },
	    update: function update(el, binding, vNode) {
	        if (vNode.isDirty) {
	            return vNode.inserted(function (newEl) {
	                if (vNode._if === true) {
	                    _this4.bind(newEl, binding, vNode);
	                }
	            });
	        }
	        var inputType = vNode.tagName == "textarea" ? "text" : ArrayFind$1(vNode.attributes, function (el) {
	            return el.key == "type";
	        }).value || "text";

	        if (inputType == "radio") {
	            if (el.value == binding.result) {
	                el.checked = true;
	            } else {
	                el.checked = false;
	            }
	        } else if (inputType == "checkbox") {
	            if (binding.result.indexOf(el.value) >= 0) {
	                el.checked = true;
	            } else {
	                el.checked = false;
	            }
	        } else {
	            el.value = binding.result;
	        }
	    },
	    unbind: function unbind(el, binding) {
	        el.removeEventListener("input", binding.inputEvent);
	        el.removeEventListener("change", binding.changeEvent);
	    }
	}, {
	    directive: "^ref$",
	    level: 3,
	    display: true,
	    preventDefaultVal: true,
	    bind: function bind(el, binding, vNode) {
	        if (vNode._if === false) {
	            return;
	        }
	        var context = vNode.context;
	        var _refs = context._refs,
	            $refs = context.$refs;

	        var _refObj = _refs[binding.value];
	        var $refObj = $refs[binding.value];
	        var key = vNode.key;

	        if (_refObj == undefined) {
	            _refs[binding.value] = [key];
	            $refs[binding.value] = el;
	        } else {
	            _refObj.push(key);
	            $refs[binding.value] = $refObj instanceof Array ? $refObj.concat(el) : [$refObj, el];
	        }
	    },
	    update: function update(el, binding, vNode) {
	        var _this5 = this;

	        if (vNode.isDirty) {
	            if (vNode._if === false) {
	                this.unbind(el, binding, vNode);
	            }
	            return vNode.inserted(function (newEl) {
	                if (vNode._if === true) {
	                    _this5.bind(newEl, binding, vNode);
	                }
	            });
	        }
	    },
	    unbind: function unbind(el, binding, vNode) {
	        var key = vNode.key,
	            name = binding.value,
	            _vNode$context = vNode.context,
	            _refs = _vNode$context._refs,
	            $refs = _vNode$context.$refs,
	            _refObj = _refs[name],
	            $refObj = $refs[name];


	        if ($refObj instanceof Array) {
	            $refObj.splice($refObj.indexOf(vNode.el), 1);
	            _refObj.splice(_refObj.indexOf(key), 1);
	        } else {
	            _refs[name] = undefined;
	            $refs[name] = undefined;
	        }
	    }
	}];

	function bindingUpdate(el, binding, vNode) {
	    var value = binding.result;
	    var component = vNode.data.component;

	    if (value.toString() == "[object Object]") {
	        if (vNode.isComponent === false) {
	            var str = "",
	                val = void 0;
	            if (binding.args !== "") {
	                Object.keys(value).forEach(function (key) {
	                    val = value[key];

	                    if (typeof val == "boolean") {
	                        str += val ? key + " " : "";
	                    } else {
	                        str += key + ": " + value[key] + ";";
	                    }
	                });
	                setAttribute(vNode, el, binding.args, str);
	            } else {
	                Object.keys(value).forEach(function (key) {
	                    val = value[key];

	                    setAttribute(vNode, el, key, val);
	                });
	            }
	        } else {
	            Object.keys(value).forEach(function (key) {
	                if (vNode.isComponent) {
	                    if (component === undefined) {
	                        vNode.attributes.push({ key: key, value: value[key] });
	                    } else {
	                        component.$data.__ob__.update(key, value[key]);
	                    }
	                } else {
	                    setAttribute(vNode, el, key, value[key]);
	                }
	            });
	        }
	    } else if (value instanceof Array) {
	        if (vNode.isComponent) {
	            if (component === undefined) {
	                vNode.attributes.push({ key: binding.args, value: value[0] });
	            } else {
	                component.$data.__ob__.update(binding.args, value[0]);
	            }
	        } else {
	            setAttribute(vNode, el, binding.args, value[0]);
	        }
	    } else {
	        if (vNode.isComponent) {
	            if (component === undefined) {
	                vNode.attributes.push({ key: binding.args, value: value });
	            } else {
	                component.$data.__ob__.update(binding.args, value);
	            }
	        } else {
	            setAttribute(vNode, el, binding.args, value);
	        }
	    }
	}

	function symbol(vNode, domTree, index, context) {
	    var reg = vNode.content.match(/{{([^}}]*?)}}/g);

	    if (reg != null || reg != undefined) {
	        reg.forEach(function (match) {
	            var content = match.match(/[^{{}}]*/g)[2];
	            vNode.inserted(function (node) {
	                vNode.watchers.push(new watch(context, content, {
	                    handler: function handler(newVal) {
	                        var text = vNode.content;
	                        var start = text.indexOf(match);
	                        text = text.slice(0, start) + newVal + text.slice(start + match.length);
	                        node.nodeValue = text;
	                    },
	                    immediate: true
	                }));
	            });
	        });

	        domTree[index] = vNode;
	    }
	}

	function insertNodes(params) {
	    var properties = params.properties,
	        vNode = params.vNode,
	        inner = params.inner,
	        counter = params.counter,
	        domTree = params.domTree,
	        startAt = params.startAt;

	    var newNode = void 0;
	    var index = 0;
	    var data = isNaN(vNode.data.reference) ? vNode.data.reference : function () {
	        var array = [];
	        var max = Number(vNode.data.reference);
	        while (array.length < max) {
	            array.push(array.length);
	        }
	        return array;
	    }();

	    var _loop = function _loop(key) {
	        if (startAt != undefined && index <= startAt) {
	            index += 1;
	            return "continue";
	        }
	        var refer = {};
	        var context = Object.create(properties);
	        newNode = clone(vNode.reference);
	        newNode.attributes = newNode.attributes.filter(function (attr) {
	            return attr.key != "t-for";
	        });
	        newNode.directives.push(vNode.directives[0]);
	        newNode.index = vNode.index + (index += 1);
	        newNode.context = context;

	        if (data instanceof Array) {
	            Object.defineProperty(context, inner, {
	                get: function (newNode) {
	                    var data = vNode.data.reference;
	                    if (Dep.target) {
	                        data.__ob__.dep.addSub(Dep.target);
	                        newNode.watchers.push(Dep.target);
	                    }
	                    return data[key];
	                }.bind(null, newNode),
	                enumerable: true,
	                configurable: true
	            });
	            if (counter) {
	                refer[counter] = key;
	            }
	        } else if (data instanceof Object) {
	            Object.defineProperty(context, inner, {
	                get: function (index, newNode) {
	                    var data = vNode.data.reference;
	                    if (Dep.target) {
	                        data.__ob__.dep.addSub(Dep.target);
	                        newNode.watchers.push(Dep.target);
	                    }
	                    var key = Object.keys(data)[index - 1];

	                    return key;
	                }.bind(null, index, newNode),
	                enumerable: true,
	                configurable: true
	            });
	            if (counter) {
	                refer[counter] = index - 1;
	            }
	        }

	        context.$data.__ob__.react.observe(context, refer);

	        domTree.splice(newNode.index, 0, newNode); // inserting clone object into domTree
	    };

	    for (var key in data) {
	        var _ret = _loop(key);

	        if (_ret === "continue") continue;
	    }
	    if (index > 0) {
	        for (var i = vNode.index + index + 1; i < domTree.length; i++) {
	            domTree[i].index = i;
	        }
	    }
	}

	function setAttribute(vNode, node, key, value) {
	    if (node.nodeType !== 1) {
	        return;
	    }

	    var original = ArrayFind$1(vNode.attributes, function (el) {
	        return el.key == key;
	    });

	    if (typeof value === "boolean" && !value) {
	        if (original) {
	            value = false;
	        } else {
	            return node.removeAttribute(key);
	        }
	    }

	    var copy = node.attributes[key];

	    if (!copy) {
	        node.setAttribute(key, value);
	    } else {
	        copy.nodeValue = (original ? original.value + " " : "") + value || "";
	    }
	}

	function ArrayFind$1(array, callback) {
	    var i = void 0,
	        data = void 0;
	    for (i = 0; i < array.length; i++) {
	        data = array[i];
	        if (callback(data)) {
	            return data;
	        }
	    }
	}

	function trim(str) {
	    return str.replace(/\s/g, "");
	}

	var parseTemplate = function () {
	    function parseTemplate(domTree, context) {
	        classCallCheck(this, parseTemplate);

	        this.directives = context._dir;
	        this.components = context._c;

	        return this.parse(domTree, context);
	    }

	    createClass(parseTemplate, [{
	        key: "parse",
	        value: function parse(domTree, context) {
	            var _this = this;

	            var _loop = function _loop(_index2) {
	                var vNode = domTree[_index2];
	                vNode.index = _index2;

	                if (vNode.isReady) {
	                    vNode.directives.forEach(function (obj) {
	                        var binding = obj.binding;
	                        if (!obj.preventDefaultVal && binding.value != null) {
	                            binding.result = evalWithContext(binding.value, vNode.context);
	                        }
	                        obj.update && obj.update(vNode.el, binding, vNode);
	                    });
	                    if (vNode.children && vNode.type == "element") {
	                        _this.parse(vNode.children, vNode.context || context, vNode.el);
	                    }
	                    return "continue";
	                } else {
	                    vNode.context = vNode.context || context;
	                    if (vNode.type == "text") {
	                        symbol(vNode, domTree, _index2, context);
	                    } else if (vNode.type == "element") {
	                        if (_this.components.hasOwnProperty(vNode.tagName)) {
	                            vNode.isComponent = true;
	                        } else if (vNode.tagName == "slot") {
	                            var slotName = "default";
	                            vNode.attributes.forEach(function (attr) {
	                                if (attr.key == "name") {
	                                    slotName = attr.value;
	                                }
	                            });
	                            var slot = context.slots ? context.slots[slotName] : false;
	                            var applyArgs = [_index2, 1];
	                            if (slot) {
	                                (slot instanceof Array ? slot : [slot]).forEach(function (node) {
	                                    return applyArgs.push(node);
	                                });
	                            }
	                            [].splice.apply(domTree, applyArgs) && (_index2 -= 1);
	                        }

	                        // try {
	                        _this.analyseHook(vNode, domTree, vNode.context || context);
	                        // } catch(e) {
	                        //     console.error(e + '\n\n', 'please check your template: \n' + stringify([vNode]));
	                        // }
	                    }
	                }
	                index = _index2;
	            };

	            for (var index = 0; index < domTree.length; index++) {
	                var _ret = _loop(index);

	                if (_ret === "continue") continue;
	            }

	            return domTree;
	        }
	    }, {
	        key: "analyseHook",
	        value: function analyseHook(vNode, domTree, properties) {
	            var _this2 = this;

	            var recall = function recall(newNode, domTree, prop) {
	                if (vNode.isComponent != true) {
	                    _this2.parse(domTree || vNode.children, prop || properties);
	                } else {
	                    var node = newNode || vNode;
	                    var tagName = node.tagName;
	                    var config = _this2.components[tagName];
	                    node.tagName = "div";
	                    node.inserted(function (el) {
	                        properties._components.push(new initComponent(_extends({ el: el, vNode: this }, config)));
	                    });
	                }
	            };

	            var queue = new makeSequence(recall);
	            var attrs = vNode.attributes.concat();

	            attrs.forEach(function (binding) {
	                _this2.matchHook(binding, function (match) {
	                    var key = binding.key,
	                        argIndex = key.indexOf(":");

	                    binding.args = argIndex >= 0 ? key.slice(argIndex + 1) : "";

	                    queue.push(match, {
	                        vNode: vNode,
	                        domTree: domTree,
	                        properties: properties,
	                        binding: binding
	                    });
	                });
	            });

	            queue.process();
	        }
	    }, {
	        key: "matchHook",
	        value: function matchHook(attr, call) {
	            this.directives.forEach(function (match) {
	                var directive = match.directive;
	                var prefix = directive.indexOf("^") < 0 ? "^t-" : "";
	                var reg = evalWithContext("/" + (prefix + directive) + "/");
	                if (reg.test(attr.key)) {
	                    call(match);
	                }
	            });
	        }
	    }]);
	    return parseTemplate;
	}();

	var makeSequence = function () {
	    function makeSequence(recall) {
	        classCallCheck(this, makeSequence);

	        this.queue = [];
	        this.presentQueue = [];
	        this._flag = true;
	        this.copy = [];
	        this.recall = recall;
	    }

	    createClass(makeSequence, [{
	        key: "push",
	        value: function push(hook, args) {
	            var level = hook.level;
	            if (this.queue[level] == undefined) {
	                this.queue[level] = [{ hook: hook, args: args }];
	            } else {
	                this.queue[level].push({ hook: hook, args: args });
	            }
	        }
	    }, {
	        key: "process",
	        value: function process() {
	            var _this3 = this;

	            var redirect = [null];
	            var length = this.queue.length;

	            if (length === 0) {
	                return this.recall();
	            }
	            this.queue.forEach(function (group, cinx) {
	                _this3.presentQueue = group;

	                if (group === undefined) {
	                    return;
	                }

	                _this3.presentQueue.forEach(function (target, rinx) {
	                    if (_this3._flag != true) {
	                        return;
	                    }

	                    redirect.forEach(function (args) {
	                        var binding = target.args.binding = _extends({}, target.args.binding);
	                        var preventDefaultVal = target.hook.preventDefaultVal;

	                        if (preventDefaultVal !== true && binding.value != null) {
	                            var context = args ? args.properties : target.args.properties;
	                            var content = binding.value;
	                            binding.result = evalWithContext(content, context);
	                        }
	                        var params = _extends(target.args, args);
	                        var vNode = params.vNode;
	                        var hook = Object.create(target.hook);
	                        hook.binding = binding;
	                        vNode.directives.push(hook);

	                        removeHook(vNode.attributes, binding.key);

	                        _this3.callHandler(target, params);

	                        vNode.context = params.properties;
	                        _this3.copy.forEach(function (item) {
	                            item.vNode.directives.push(hook);
	                            item.vNode.context = item.properties;
	                            removeHook(item.vNode.attributes, binding.key);
	                        });
	                        if (_this3._flag === true && cinx == _this3.queue.length - 1 && rinx == _this3.presentQueue.length - 1) {
	                            if (_this3.copy.length > 0) {
	                                _this3.copy.forEach(function (item) {
	                                    _this3.recall(item.vNode, item.vNode.children, item.properties);
	                                });
	                            } else {
	                                _this3.recall(params.vNode, params.vNode.children, params.properties);
	                            }
	                        }
	                    });

	                    redirect = _this3.copy.length === 0 ? redirect : _this3.copy;
	                    _this3.copy = [];
	                });
	            });
	        }
	    }, {
	        key: "callHandler",
	        value: function callHandler(target, params) {
	            target.hook.use && target.hook.use(params, this.insertQueue.bind(this), this.stop.bind(this));
	        }
	    }, {
	        key: "insertQueue",
	        value: function insertQueue(vNode, domTree, properties) {
	            this._flag = true;
	            this.copy.push({
	                vNode: vNode, domTree: domTree, properties: properties
	            });
	        }
	    }, {
	        key: "stop",
	        value: function stop() {
	            this._flag = false;
	        }
	    }]);
	    return makeSequence;
	}();

	function removeHook(group, name) {
	    var index = void 0;
	    group.forEach(function (el, _index) {
	        if (el.key == name) {
	            index = _index;
	        }
	    });

	    group.splice(index, 1);
	}

	var publicDirectives = [];
	var publicComponents = {};

	function checkExistence(target, props, recall) {
	    var keys = Object.keys(props);

	    keys.forEach(function (prop) {
	        if (target.hasOwnProperty(prop)) {
	            recall(prop);
	        }
	    });
	}

	var turbine = function turbine(props) {
	    if (props instanceof turbine.prototype._init) {
	        return props;
	    } else {
	        return new turbine.prototype._init(props);
	    }
	};

	turbine.prototype = {
	    _init: function _init(props) {
	        var _this2 = this;

	        var el = props.el,
	            template = props.template,
	            components = props.components,
	            directives$$1 = props.directives,
	            methods = props.methods,
	            data = props.data,
	            watch$$1 = props.watch,
	            slots = props.slots;


	        this._refs = {};
	        this.$refs = {};
	        this._components = [];
	        // this._isComponent = props._isComponent || false;
	        // this.$parent = props.$parent || null;
	        // this.slots = slots || null;
	        this._dir = [];
	        this._vnode = [];
	        this.$el = null;
	        this._continued = false;

	        Object.keys(props).forEach(function (prop) {
	            if (_this2.hasOwnProperty(prop)) {
	                console.warn("this prototype name has been used already, please rename it:\n" + prop);
	            } else if (["components", "directives", "methods", "data", "watch", "el"].indexOf(prop) < 0) {
	                _this2[prop] = props[prop];
	            }
	        });

	        if (el != undefined) {
	            if (typeof el == "string") {
	                el = document.body.querySelector(el);
	            }
	            template = template || el.outerHTML;

	            this.$jsonTree = renderJsonTree(template);
	            this._continued = true;
	        } else if (template != undefined) {
	            this.$jsonTree = renderJsonTree(template);
	            this._continued = false;
	        }

	        {
	            publicDirectives.forEach(function (directives$$1) {
	                _this2._dir.push(directives$$1);
	            });
	            if (directives$$1 instanceof Object) {
	                for (var key in directives$$1) {
	                    turbine.directive(this, key, directives$$1[key]);
	                }
	            }
	        }

	        {
	            this._c = _extends({}, publicComponents);
	            if (components && (typeof components === "undefined" ? "undefined" : _typeof(components)) == "object") {
	                Object.keys(components).forEach(function (_c) {
	                    turbine.component(_this2, _c, components[_c]);
	                });
	            }
	        }

	        this._setMethods(methods);

	        if (this.beforeCreate) {
	            this.beforeCreate();
	        }

	        {
	            if (data != undefined && (typeof data === "undefined" ? "undefined" : _typeof(data)) == "object") {
	                this._observe(data);
	            }
	        }

	        {
	            if ((typeof watch$$1 === "undefined" ? "undefined" : _typeof(watch$$1)) == "object") {
	                var keys = Object.keys(watch$$1);

	                keys.forEach(function (key) {
	                    _this2.$watch(key, watch$$1[key]);
	                });
	            }
	        }

	        if (this.created) {
	            this.created();
	        }

	        {
	            if (el != undefined && el != null) {
	                this._render(el);
	            }
	        }

	        return this;
	    },
	    _render: function _render(el) {
	        var _this3 = this;

	        var parentNode = el.parentNode;
	        this._vnode = new parseTemplate(clone(this.$jsonTree), this);

	        var domFragment = render(this._vnode);
	        this._vnode.forEach(function (vNode) {
	            if (vNode.tagName == "turbine") {
	                _this3.$el = vNode.el;
	            }
	        });
	        if (this.$el === null) {
	            throw "couldn't find turbine as a root html tag";
	        }

	        parentNode.replaceChild(domFragment, el);

	        this._continued = true;
	        if (this.mounted) {
	            this.mounted();
	        }
	    },
	    _observe: function _observe(key, value) {
	        var _this4 = this;

	        var type = typeof key === "undefined" ? "undefined" : _typeof(key),
	            length = arguments.length,
	            data = void 0;

	        if (length == 1 && type == "object") {
	            data = key;
	        } else if (length == 2 && type == "string") {
	            data = {};
	            data[key] = value;
	        } else {
	            return console.error("arguments error");
	        }

	        checkExistence(this, data, function (prop) {
	            console.error(prop + " has been used as a basic prototype");
	            delete data[prop];
	        });

	        var timer = void 0;
	        new react(this.$data || function (vm) {
	            Object.defineProperty(vm, "$data", {
	                value: {},
	                enumerable: false
	            });
	            return vm.$data;
	        }(this), data, function () {
	            clearTimeout(timer);
	            timer = setTimeout(function () {
	                timer = null;
	                _this4._updateView();
	            });
	        });

	        Object.keys(this.$data).forEach(function (prop) {
	            Object.defineProperty(_this4, prop, {
	                enumerable: true,
	                configurable: true,
	                get: function get$$1() {
	                    return _this4.$data[prop];
	                },
	                set: function set$$1(newVal) {
	                    _this4.$data[prop] = newVal;
	                }
	            });
	        });
	    },
	    _setMethods: function _setMethods(methods) {
	        var _this5 = this;

	        if ((typeof methods === "undefined" ? "undefined" : _typeof(methods)) != "object") {
	            return;
	        }
	        var keys = Object.keys(methods);

	        keys.forEach(function (key) {
	            if (_this5.hasOwnProperty(key)) {
	                return console.error(key + "has been used as a data prototype");
	            }
	            _this5[key] = methods[key];
	        });
	    },
	    _updateView: function _updateView() {
	        if (!this._continued) {
	            return;
	        }

	        new parseTemplate(this._vnode, this);
	        render(this._vnode, [this.$el]);
	    },
	    _destroy: function _destroy() {
	        if (this._components.length > 0) {
	            this._components.forEach(function (component) {
	                return component._destroy();
	            });
	        }

	        if (this._isComponent) {
	            var index = this.$parent._components.indexOf(this);
	            this.$parent._components.splice(index, 1);
	        }

	        var observe = this.$data ? this.$data.__ob__ : false;

	        if (observe) {
	            observe.destroy();
	        }

	        this._vnode[0].remove();
	        this._vnode = null;
	        this.$jsonTree = null;
	        this.$el = null;
	        this.$refs = null;
	        this._refs = null;
	        this._dir = null;
	        this._components = null;
	        this._c = null;
	        this.$parent = null;
	        this.vNode = null;
	    }
	};

	turbine._turbine = turbine.prototype;

	turbine._turbine._init.prototype = turbine.prototype;

	turbine.use = function (obj, options) {
	    if (obj instanceof Object) {
	        obj.install(turbine, options);
	    }
	};

	turbine.set = turbine._turbine.$set = function (target, key, value) {
	    var length = arguments.length,
	        vals = void 0,
	        ob = void 0;

	    if (length == 2 && typeof target == "string" && this instanceof turbine.prototype._init) {
	        value = key;
	        vals = target.split(".");
	        target = this.$data;
	        key = vals[vals.length - 1];

	        vals.forEach(function (valName, index) {
	            if (target.hasOwnProperty(valName) && index < vals.length - 1) {
	                target = target[valName];
	            } else {
	                var separate = valName.match(/\[\w+\]/g);
	                var prefix = valName.match(/^(\w+)/)[0];
	                if (separate != null && separate.length > 1) {
	                    separate.map(function (val, i) {
	                        separate[i] = val.replace("[", "").replace("]", "");
	                    });
	                    separate.unshift(prefix);

	                    separate.forEach(function (valName, i) {
	                        if (i <= separate.length - 2 || index <= vals.length - 1) {
	                            target = target[valName];
	                        } else if (index == vals.length - 1) {
	                            key = valName;
	                        }
	                    });
	                } else if (index < vals.length - 1) {
	                    throw "reference Error";
	                }
	            }
	        });
	    } else if (length !== 3 && !(target instanceof Object)) {
	        throw "arguments Error";
	    }

	    ob = target.__ob__;
	    ob.update(key, value, true);
	};

	turbine.delete = turbine._turbine.$delete = function (target, key) {
	    var ob = void 0;
	    var refresh = true;

	    if ((typeof target === "undefined" ? "undefined" : _typeof(target)) == "object" && target.hasOwnProperty("__ob__")) {
	        ob = target.__ob__;
	        ob.destroy(key, refresh);
	    } else {
	        throw "target must be an Object or Array and it should have been observed";
	    }
	};

	turbine._turbine.$emit = function (eventName) {
	    var _this6 = this;

	    var found = false;
	    var args = Array.prototype.slice.call(arguments, 1);
	    if (this.vNode != undefined && this.vNode.data.events) {
	        this.vNode.data.events.forEach(function (event) {
	            if (event.event == eventName) {
	                found = true;
	                event.fn.apply(_this6.vNode.context, args);
	            }
	        });
	    }
	    if (!found && this.$parent) {
	        this.$parent.$emit(eventName, args);
	    }
	};

	turbine._turbine.$watch = function (exp, options) {
	    new watch(this, exp, options);
	};

	turbine.hangup = turbine._turbine.$hangup = function (vm) {
	    if (this instanceof turbine._turbine._init) {
	        this.beforeHangup && this.beforeHangup();

	        this._continued = false;
	        this._vnode[0].remove();
	        this._vnode = null;
	    } else if (vm instanceof turbine._turbine._init) {
	        vm.$hangup();
	    }
	};

	turbine.restart = turbine._turbine.$restart = function (vm) {
	    if (this instanceof turbine._turbine._init) {
	        this._render(this.$el);
	    } else if (vm instanceof turbine._turbine._init) {
	        vm.$restart(vm);
	    }
	};

	turbine._turbine.$mount = function (el) {
	    var element = el;

	    if (el instanceof HTMLElement) {
	        element = el;
	    } else if (typeof el == "string") {
	        element = document.body.querySelector(el);
	    } else {
	        throw "arguments error";
	    }

	    this._render(this.$el = element);

	    return this;
	};

	turbine.component = function (tagName, props) {
	    turbine._components = turbine._components || {};

	    turbine._components[tagName] = props;
	};

	turbine.directive = function (_t, name, fn) {
	    var config = {};

	    if (arguments.length == 2) {
	        fn = name;
	        name = _t;
	        _t = null;
	    }

	    if (typeof fn == "function") {
	        config.bind = config.update = fn;
	    } else if ((typeof fn === "undefined" ? "undefined" : _typeof(fn)) === "object") {
	        config = fn;
	    } else {
	        throw "arguments error\n" + fn;
	    }

	    config.directive = name;

	    var _conf = _extends({
	        level: 4,
	        display: false,
	        preventDefaultVal: false
	    }, config);

	    if (_t === null) {
	        publicDirectives.push(_conf);
	    } else {
	        _t._dir.push(_conf);
	    }
	};

	directives.forEach(function (obj) {
	    turbine.directive(obj.directive, obj);
	});

	turbine.component = function (childName, props) {
	    var _this = void 0;
	    if (arguments.length == 3) {
	        _this = arguments[0]._c;
	        childName = arguments[1];
	        props = arguments[2];
	    } else {
	        _this = publicComponents;
	    }

	    var isCamel = /([A-Z])/g.exec(childName);
	    var cName = void 0;

	    if (isCamel) {
	        isCamel.forEach(function (letter) {
	            cName = childName.replace(letter, "-" + letter.toLowerCase());
	        });
	    } else {
	        cName = childName;
	    }

	    if (_this.hasOwnProperty(cName)) {
	        return console.warn("this component name has been used, please rename your component.\nName: " + cName);
	    }

	    _this[cName] = props;
	};

	return turbine;

})));

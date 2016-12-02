
let Pos = CodeMirror.Pos

function div(className, text) {
  var el = document.createElement('div')
  el.className = className
  el.textContent = text
  return el
}

function copyKeyMap(d) {
  return JSON.parse(JSON.stringify(d));
}

/* ScriptsEditor */

var extraKeys = {
  'Ctrl-Space': function(cm) {
    if (cm.somethingSelected()) {
      cm.replaceSelection(''); // TODO complete on a selection
    }
    requestHint(cm, true);
  },
  'Tab': function(cm) {
    // seek next input
    if (inputSeek(cm, +1)) return;

    // auto-indent
    if (cm.somethingSelected()) {
      cm.indentSelection('smart');
    }
  },
  'Shift-Tab': function(cm) {
    // seek prev input
    if (inputSeek(cm, -1)) return;
  },
};
extraKeys[/Mac/.test(navigator.userAgent) ? 'Cmd-F' : 'Ctrl-F'] = 'findPersistent';
//extraKeys[/Mac/.test(navigator.userAgent) ? 'Cmd-Return' : 'Ctrl-Return'] = 'save';

var cmOptions = {
  value: "",
  mode: '',

  indentUnit: 3,
  smartIndent: true,
  tabSize: 3,
  indentWithTabs: true,

  lineWrapping: true,
  dragDrop: false,
  cursorScrollMargin: 80,

  lineNumbers: true,

  cursorHeight: 1,

  undoDepth: NaN,

  extraKeys: extraKeys,

  autoCloseBrackets: true,
  matchBrackets: "()<>[]''\"\"",
  scrollbarStyle: 'simple',
};

var ScriptsEditor = function() {

  this.el = document.querySelector('.editor')
  this.cm = CodeMirror(this.el, cmOptions);

  this.cm.setOption('mode', this.getModeCfg());

  this.widgets = [];

  this.annotate = this.cm.annotateScrollbar('error-annotation');

  this.compile();

  this.cm.on('change', this.onChange.bind(this));

  this.cmUndo = this.cm.undo.bind(this.cm);
  this.cmRedo = this.cm.redo.bind(this.cm);
};

ScriptsEditor.prototype.bindNames = function(names) {
  names.map(function(item) {
    item._name.subscribe(function() {
      this.debounceRepaint();
    }.bind(this), false);
  }.bind(this));
};

ScriptsEditor.prototype.fixLayout = function(offset) {
  this.cm.setSize(NaN, this.el.clientHeight);

  // make sure scrollbar has width (cm.display.barWidth)
  // otherwise annotations won't appear!
  this.cm.setOption('scrollbarStyle', 'native');
  this.cm.setOption('scrollbarStyle', cmOptions.scrollbarStyle);
};

ScriptsEditor.prototype.compile = function() {

  // clear error indicators
  this.widgets.forEach(function(widget) {
    widget.clear();
  });
  this.widgets = [];

  // parse lines
  var options = this.getModeCfg();
  var iter = this.cm.doc.iter.bind(this.cm.doc);
  var lines = Compiler.parseLines(iter, options);
  var stream = lines.slice();

  // build 'em for each line with shape of "error"
  var anns = [];
  stream.forEach(function(block, index) {
    if (block.info.shape === 'error') {
      var line = index;
      anns.push({ from: Pos(line, 0), to: Pos(line + 1, 0) });
    }
  });

  try {
    var scripts = Compiler.compile(stream);
  } catch (err) {
    var line = lines.length - (stream.length - 1); // -1 because EOF
    line = Math.min(line, lines.length - 1);

    var info = lines[line].info;
    var message = info.shape === 'error' ? info.error : err.message;

    var widgetEl = div('error-widget', message);
    var widget = this.cm.addLineWidget(line, widgetEl, {});
    this.widgets.push(widget);
    anns.push({ from: Pos(line, 0), to: Pos(line, 0) });
    this.annotate.update(anns);

    return true;
  }

  return scripts;
};

ScriptsEditor.prototype.makeDirty = function() {
}

ScriptsEditor.prototype.getModeCfg = function() {
  // force re-highlight --slow!
  return {
    name: 'tosh',
    variables: [], //'foo', 'bar', 'quxx', 'garply'],
    lists: [],
    definitions: [],
  };
};

ScriptsEditor.prototype.repaint = function() {
  var modeCfg = this.getModeCfg();

  // force re-highlight --slow!
  this.cm.setOption('mode', modeCfg);

  clearTimeout(this.repaintTimeout);
  this.repaintTimeout = null;
};

ScriptsEditor.prototype.debounceRepaint = function() {
  this.makeDirty();
  if (this.repaintTimeout) {
    clearTimeout(this.repaintTimeout);
  }
  this.repaintTimeout = setTimeout(this.repaint.bind(this), 500);
};

ScriptsEditor.prototype.checkDefinitions = function() {
  var defineParser = new Earley.Parser(Language.defineGrammar);

  var definitions = [];
  this.cm.doc.iter(function(line) {
    var line = line.text;
    if (!Language.isDefinitionLine(line)) return;

    var tokens = Language.tokenize(line);
    var results;
    try {
      results = defineParser.parse(tokens);
    } catch (e) { return; }
    if (results.length > 1) throw "ambiguous define. count: " + results.length;
    var define = results[0].process();
    definitions.push(define);
  });

  var oldDefinitions = this.definitions;
  if (JSON.stringify(oldDefinitions) !== JSON.stringify(definitions)) {
    this.definitions = definitions;
    return true;
  }
};

ScriptsEditor.prototype.activated = function() {
  doNext(function() {
    this.fixLayout();
    this.cm.focus();
    this.cm.refresh();

    this.debounceRepaint();
  }.bind(this));
};

ScriptsEditor.prototype.focus = function() {
  this.cm.focus();
};

ScriptsEditor.prototype.varsChanged = function() {
  this.hasChangedEver = true;
  this.makeDirty();
};

ScriptsEditor.prototype.onChange = function(cm, change) {
  this.hasChangedEver = true;
  this.makeDirty();

  // analyse affected lines
  var lineNos = [];
  var lines = [];
  for (var i=change.from.line; i<=change.to.line; i++) {
    lineNos.push(i);
    lines.push(this.cm.getLine(i));
  }
  lines = lines.concat(change.removed);
  lines = lines.concat(change.text);
  this.linesChanged(lines);

  // clear error widget
  for (var i=0; i<this.widgets.length; i++) {
    var widget = this.widgets[i];
    if (lineNos.indexOf(widget.line.lineNo()) > -1) {
      widget.clear();
      this.widgets.splice(i, 1);
      break; // this will only remove the first one
    }
  }

  // trigger auto-complete!
  requestHint(this.cm);

  // clear annotations
  this.annotate.update([]);
};

ScriptsEditor.prototype.linesChanged = function(lines) {
  for (var i=0; i<lines.length; i++) {
    var line = lines[i];
    if (Language.isDefinitionLine(line)) {
      if (this.checkDefinitions()) {
        this.debounceRepaint();
      }
      return;
    }
  }
};

/*****************************************************************************/
/* completion */

function inputSeek(cm, dir) {
  // TODO fix for ellipsises
  var l = tokenizeAtCursor(cm, { splitSelection: false });
  if (!l) return false;
  if (l.selection.indexOf('\n') > -1) return false;

  var index = l.cursor + dir;
  if (dir > 0 && l.tokens[l.cursor] && l.tokens[l.cursor].text === '-') index += 1;
  for (var i = index;
       dir > 0 ? i < l.tokens.length : i >= 0;
       i += dir
  ) {
    var token = l.tokens[i];
    if (['symbol', 'lparen', 'rparen', 'langle', 'rangle',
         'lsquare', 'rsquare'].indexOf(token.kind) === -1) {
      var start = l.start.ch + measureTokens(l.tokens.slice(0, i));
      end = start + token.text.replace(/ *$/, "").length;
      var line = l.from.line;
      if (token.kind === 'number' && l.tokens[i - 1].text === '-') start--;
      if (token.kind === 'string') { start++; end--; }

      var from = { line: line, ch: start };
      var to = { line: line, ch: end };
      if (l.cursor.ch === from.ch && l.cursor.ch + l.selection.length === to.ch) {
        continue;
      }
      cm.setSelection(from, to);
      return true;
    }
  }

  c = dir > 0 ? l.end : l.start;
  if (c.ch === l.cursor.ch) return false;
  cm.setCursor(c);
  return true;
}

function tabify(text, indent) {
  var tab = '\t';
  var text = text || '';
  var indentation = '';
  for (var i=0; i<indent; i++) indentation += tab;
  var lines = text.split('\n');
  for (var j=1; j<lines.length; j++) {
    lines[j] = indentation + lines[j];
  }
  return lines.join('\n');
}

function measureTokens(tokens) {
  var length = 0;
  for (var i=0; i<tokens.length; i++) {
    length += tokens[i].text.length;
  }
  return length;
}

function tokenizeAtCursor(cm, options) {
  var selection = cm.getSelection();
  var cursor = cm.getCursor('from');
  var text = cm.doc.getLine(cursor.line);

  var indent = /^\t*/.exec(text)[0].length;
  var prefix = text.slice(indent, cursor.ch);
  var suffix = text.slice(cursor.ch);

  var isPartial = !/ $/.test(prefix);
  var hasPadding = /^[ ?]/.test(suffix);

  var tokens,
      cursorIndex;
  if (options.splitSelection) {
    var beforeTokens = Language.tokenize(prefix);
    var afterTokens = Language.tokenize(suffix);
    tokens = beforeTokens.concat(afterTokens);
    cursorIndex = beforeTokens.length;
  } else {
    var tokens = Language.tokenize(prefix + suffix);
    var size = indent;
    for (var i=0; i<tokens.length; i++) {
      size += tokens[i].text.length;
      if (size > cursor.ch) {
        break;
      }
    }
    cursorIndex = i;
  }

  var to = measureTokens(tokens.slice(0, cursorIndex));
  var from;
  if (isPartial) {
    from = measureTokens(tokens.slice(0, cursorIndex - 1));
  } else {
    from = to;
  }

  return {
    from:  { line: cursor.line, ch: indent + from },
    to:    { line: cursor.line, ch: indent + to   },
    end:   { line: cursor.line, ch: text.length   },
    start: { line: cursor.line, ch: indent        },

    selection: selection,

    state: cm.getStateAfter(cursor.line),
    cursor: cursorIndex,
    tokens: tokens,
    isPartial: isPartial,
    hasPadding: hasPadding,
  }
}

function requestHint(cm, please) {
  cm.showHint({
    hint: please ? computeHintPlease : computeHintMaybe,
    completeSingle: false,
    alignWithWord: true,
    customKeys: {
      Up:       function(_, menu) { menu.moveFocus(-1); },
      Down:     function(_, menu) { menu.moveFocus(1); },
      Home:     function(_, menu) { menu.setFocus(0);},
      End:      function(_, menu) { menu.setFocus(menu.length - 1); },
      Tab:      function(_, menu) { menu.pick(); },
      Esc:      function(_, menu) { menu.close() },
    },
  });
}

function expandCompletions(completions, g) {
  function expand(symbol) {
    // don't suggest names twice
    if (['VariableName', 'ListName', 'ReporterParam'].indexOf(symbol) > -1) return [];

    if (typeof symbol !== 'string') {
      return [[symbol]];
    }
    if (/^@/.test(symbol)) {
      return [g.rulesByName[symbol][0].symbols];
    } if (/^[md]_/.test(symbol) || /^[A-Z]/.test(symbol)) {
      return (g.rulesByName[symbol] || []).map(function(rule) {
        return rule.symbols;
      });
    }
    return [[symbol]];
  }

  var choices = [];
  completions.forEach(function(c) {
    var symbols = c.completion;
    if (!symbols.length) return;
    var first = symbols[0],
    rest = symbols.slice(1);
    var more = expand(first).map(function(symbols) {
      return {
        completion: symbols.concat(rest),
        via: c,
      };
    });
    choices = choices.concat(more);
  });
  return choices;
}

function computeHintPlease(cm) { return computeHint(cm, true); }
function computeHintMaybe(cm) {  return computeHint(cm, false); }

function computeHint(cm, please) {
  var l = tokenizeAtCursor(cm, { splitSelection: true });
  if (!l) return false;
  if (l.cursor === 0) {
    return false;
  }
  /*
  if (!(l.selection === "" || l.selection === "_" ||
        l.selection === "<>")) {
    return false;
  }*/

  var state = l.state;
  var completer = state.completer;
  var grammar = completer.leftParser.grammar;

  var tokens = l.tokens.slice();
  var cursor = l.cursor;

  var isValid;
  try {
    completer.parse(tokens); isValid = true;
  } catch (e) {
    isValid = false;
    // console.log(e); // DEBUG
  }

  var partial;
  if (l.isPartial) {
    partial = tokens[cursor - 1];
    tokens.splice(cursor - 1, 1);
    cursor--;

    // don't offer completions if we don't need to
    // eg. "stop all|" should *not* suggest "sounds"
    if (isValid && !l.selection && !please) return;
  }

  var completions = completer.complete(tokens, cursor);
  if (!completions) {
    return false; // not a list--there was an error!
  }

  if (!tokens.length) {
    // TODO move 'define' into main grammar
    ['define-atomic', 'define'].forEach(function(keyword) {
      completions.splice(0, 0, {
        start: 0,
        end: 0,
        pre: [],
        post: [],
        rule: { process: { _info: { category: 'custom' } } },
        item: null,
        completion: [{ kind: 'symbol', value: keyword }, "block"],
      });
    });
  }

  completions = completions.filter(function(c) {
    if (c.pre.length === 1 && typeof c.pre[0] === "string") return;
    if (c.pre[0] === "block") return;
    if (c.rule.process.name === 'unaryMinus') return;
    if (c.rule.process._info === undefined && c.rule.symbols[0].value === undefined) return;
    return true;
  });

  var expansions = expandCompletions(completions, grammar);
  expansions.forEach(function(x) {
    x.length = x.via.end - x.via.start;
  });

  /*
  if (expansions.length) {
    var shortest = Math.min.apply(null, expansions.map(function(x) {
      return x.completion.filter(function(symbol) { return symbol.kind !== 'symbol' }).length;
    }));
    expansions = expansions.filter(function(x) {
      var length = x.completion.filter(function(symbol) { return symbol.kind !== 'symbol' }).length;
      return length === shortest;
    });
  }
  */

  if (l.isPartial) {
    expansions = expansions.filter(function(x) {
      var first = x.completion[0];
      return (first.kind === 'symbol' && partial.kind === 'symbol' &&
              first.value && first.value.indexOf(partial.value) === 0
        ); // || (typeof first === 'string' && x.via.pre.length);
    });
  } else {
    // don't complete keys!
    expansions = expansions.filter(function(x) {
      var first = x.completion[0];
      return !(first.kind === 'symbol' && /^[a-z0-9]$/.test(first.value));
    })

    if (cursor === tokens.length) {
      expansions = expansions.filter(function(x) {
        return x.via.pre.length || x.via.post.length;
      })
    }
  }

  expansions.sort(function(a, b) {
    var aInfo = a.via.rule.process._info;
    var bInfo = b.via.rule.process._info;
	var aSelector = aInfo ? aInfo.selector : a.via.rule.name;
	var bSelector = bInfo ? bInfo.selector : b.via.rule.name;

	var aIndex = Language.preferSelectors.indexOf(aSelector);
	var bIndex = Language.preferSelectors.indexOf(bSelector);
	if (aIndex > -1 && bIndex > -1) {
	  if (aIndex !== bIndex) return aIndex - bIndex;
	} else if (aIndex > -1) {
	  return +1;
	}

	var aText = a.completion.join(" ");
	var bText = b.completion.join(" ");
	return aText < bText ? -1 : aText > bText ? +1 : 0;
  });

  var rule_categories = {
	'VariableName': 'variable',
	'ListName': 'list',
  };

  var list = [];
  expansions.forEach(function(x) {
    var symbols = x.completion.slice();
    var c = x.via;

    assert(symbols.length);

    var selection;
    var text = "";
    var displayText = "";
    for (var i=0; i<symbols.length; i++) {
      var part = symbols[i];
      var displayPart = undefined;

      if (i > 0 && part.value !== "?") {
        displayText += " ";
        text += " ";
      }

      if (typeof part === "string") {
        var name = symbols[i];
        if (name[0] === "@") {
          part = grammar.rulesByName[name][0].symbols[0].value;
        } else {
          if (/^b[0-9]?$/.test(name)) {
            part = "<>";
          } else {
            part = "_";
          }

          if (partial && i === 0) {
            displayPart = part;
            part = partial.value;
            if (!selection) selection = { ch: text.length + part.length, size: 0 };
          } else {
            if (!selection) selection = { ch: text.length, size: part.length };
          }

          /*
          if (l.isPartial && i === 0) {
            // Sometimes we need more than one token!
            // Not sure what to do about this…

            var token = l.tokens[l.cursor - 1];
            displayPart = part;
            part = token.text;
            selection = { ch: part.length };
          }
          */
        }
      } else if (part && part.kind === "symbol") {
        part = part.value;
      } else {
          return;
      }
      text += part;
      displayText += (displayPart === undefined ? part : displayPart);
    }

    if (displayText === "<>" || displayText === "_") return;

    assert(text);

    var indent = state.indent;
    if (text === "else" && indent.slice().pop() !== 'if') return;
    if (text === "end" && !indent.length) return;

    // no space before trailing `?`
    text = text.replace(/ \?$/, "?");

    // add padding, but only very rarely
    if (!l.hasPadding && !isValid && partial && partial.text === text) {
      text += " ";
    }

    var info = {};
    if (c.rule.process._info) {
      info = c.rule.process._info;
    } else {
      c.item.predictedBy.forEach(function(item) {
        info = item.rule.process._info || {};
      });
    }

    // add "end" after c-blocks
    switch (info.shape) {
      case 'c-block':
      case 'c-block cap':
      case 'if-block':
        var after = "\nend";
        if (!selection) { // no inputs
          // put cursor at EOL
          selection = { ch: text.length, size: 0 };
        }
        text += tabify(after, indent.length);
        break;
    }

    var completion = {
      displayText: displayText,
      text: text,
      hint: applyHint,
      selection: selection,
      category: info.category || rule_categories[c.rule.name],
      render: renderHint,
      _name: c.rule.name, // DEBUG
    };

    function renderHint(parentNode, self, data) {
      var className = '';
      if (data.category) className = '.cm-s-' + data.category;
      parentNode.appendChild(div(className, data.displayText));
    }

    /*
    if (l.isPartial) {
      completion.text += " ";

      if (text === "_") {
        completion.selection = undefined;
      }

      if (!completion.selection) {
        completion.seekInput = true;
      }

      var nextToken = l.tokens[l.cursor];
      if (nextToken && /^ /.test(nextToken.text)) {
        completion.to = { line: l.to.line, ch: l.to.ch + 1 };
      }
    }
    */

    list.push(completion);
  });

  var result = {
    list: list,
    from: l.from,
    to:   l.to,
  };

  function applyHint(cm, data, completion) {
    var text = completion.text;
    cm.replaceRange(text, completion.from || data.from,
                          completion.to || data.to, "complete");
    if (completion.selection) {
      var line = result.from.line;
      var start = result.from.ch + completion.selection.ch;
      var end = start + (completion.selection.size || 0);
      cm.setSelection({ line: line, ch: start }, { line: line, ch: end });
    }
    cm.indentLine(l.start.line);
  }

  return result;
};

var editor = new ScriptsEditor()
window.addEventListener('resize', e => {
  editor.fixLayout()
})


editor.cm.on('keydown', (cm, e) => {
  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
    let text = cm.getValue()

    let scripts = editor.compile()
    if (!scripts) {
      return
    }
    if (!scripts || !scripts.length) return

    conn.send({
      type: 'code',
      text,
      json: scripts,
    })

    // clear the editor
    //cm.setValue("")
  }
})




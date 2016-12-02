
let bnf = BNF.template

let myDslGrammar = bnf`

file --> NL file                  ${(a, b) => b}
      | file NL                   ${(a, b) => a}
      | file blankLines script    ${(a, b, c) => a.concat([c])}
      | script                    ${a => [a]}

blankLines --> NL NL
            | blankLines NL

script --> stmt                   ${a => [a]}
        | script NLS stmt          ${(a, b, c) => a.concat(c)}

stack => script                   ${a => a}
stack => '...'                    ${a => ['nop']}

stmt => 'spawn' emoji             ${a => ['spawn', a] }
stmt => 'become' emoji            ${a => ['lookLike', a] }
stmt => 'nudge right' int         ${a => ['nudgeRight', a] }

stmt --> 'repeat' SEP int NL stack NL 'end'    ${function() { return ['repeat', arguments[7], arguments[9]] }}
stmt --> 'forever' NL stack NL 'end'           ${function() { return ['forever', arguments[8]] }}

stmt => 'when' 'I' 'press' key    ${a => ['whenPressed', a]}

int --> digits                     ${a => parseInt(a)}
digits --> digit                  ${a => ''+a}
      | digits digit              ${(a, b) => a + (''+b)}
digit --> '0' ${a => '0'}
        | '1' ${a => '1'}
        | '2' ${a => '2'}
        | '3' ${a => '3'}
        | '4' ${a => '4'}
        | '5' ${a => '5'}
        | '6' ${a => '6'}
        | '7' ${a => '7'}
        | '8' ${a => '8'}
        | '9' ${a => '9'}

key --> 'space' ${a => 32}
key --> 'up' ${a => 38}
key --> 'down' ${a => 40}
key --> 'left' ${a => 37}
key --> 'right' ${a => 39}

NL --> ' ' NL
     | NL ' '
     | '\n'
SEP --> ' '
      | NL

`

emojiNames.forEach(name => {
  let symbols = Array.from(name).map(x => x === ' ' ? Lately.Token.SEP : x)
  myDslGrammar.add(new Lately.Rule(Symbol.for('emoji'), symbols, function() { return ['emoji', name] }))
})

function hm(d) {
  let q = {}
  for (var key in d) {
    q[Symbol.for(key)] = d[key]
  }
  return q
}

var highlightMap = hm({
  stmt: 'keyword',
  emoji: 'atom',
  key: 'string',
  int: 'number',
})

var cmOptions = {
  value: "",
  mode: {
    name: 'lately',
    grammar: myDslGrammar,
    highlight: tag => highlightMap[tag] || null,
  },
  extraKeys: {
    'Ctrl-Space': 'autocomplete',
  },

  indentUnit: 3,
  smartIndent: true,
  tabSize: 3,
  indentWithTabs: true,

  lineWrapping: true,
  dragDrop: false,
  cursorScrollMargin: 80,

  lineNumbers: true,
  // TODO show errors
  //gutters: ['CodeMirror-linenumbers', 'errors'],

  cursorHeight: 1,

  undoDepth: NaN,
}


CodeMirror.commands.autocomplete = function(cm) {
  cm.showHint({
    //hint: CodeMirror.hint.lately,
    completeSingle: false,
    //alignWithWord: true,
  })
}

var editor = CodeMirror(document.querySelector('.editor'), cmOptions)

this.editor.setValue(
``
)

editor.on('change', CodeMirror.commands.autocomplete)

editor.on('keydown', (cm, e) => {
  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
    let text = cm.getValue()

    let completer = cm.getMode()._completer
    completer.rewind(0)
    let error = completer.feed(text)
    if (error) {
      // TODO mark error
      console.error(error)
      return
    }
    let json = completer.parse()
    console.log(JSON.stringify(json))

    conn.send({
      type: 'code',
      text,
      json: json[0],
    })

    cm.setValue("")
  }
})

function compile() {
  let result = this.editor.getMode()._completer.parse(this.editor.getValue())
  console.log(JSON.stringify(result))
  return result
}

// TODO layout editor on window resize


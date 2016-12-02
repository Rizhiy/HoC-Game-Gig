
let bnf = BNF.template

let myDslGrammar = bnf`

file --> NL file                  ${(a, b) => b}
      | file NL                   ${(a, b) => a}
      | file blankLines script    ${(a, b, c) => a.concat([c])}
      | script                    ${a => [a]}

blankLines --> NL NL
            | blankLines NL

script --> stmt                    ${a => [a]}
        | script NL stmt          ${(a, b, c) => a.concat(c)}

stmt => 'hello' 'world'
      | 'duck' 'face'

NL --> '\n'
SEP --> ' '
      | NL

`

function hm(d) {
  let q = {}
  for (var key in d) {
    q[Symbol.for(key)] = d[key]
  }
  return q
}

var highlightMap = hm({
  cheese: 'string',
  stmt: 'keyword',
  thing2: 'atom',
  op: 'number',
})

var cmOptions = {
  value: "",
  mode: {
    name: 'lately',
    grammar: myDslGrammar,
    highlight: tag => highlightMap[tag] || null,
  },
  extraKeys: {'Ctrl-Space': 'autocomplete'},

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
`hello sweet and really happy world
`
)

editor.on('change', CodeMirror.commands.autocomplete)

function compile() {
  let result = this.editor.getMode()._completer.parse(this.editor.getValue())
  console.log(JSON.stringify(result))
  return result
}

// TODO layout editor on window resize


var Scratch = (function() {

  var scratchCommands = [

    // entities
    ["spawn %m.emoji",					    " ", 3, "spawnEntity"],
    ["destroy",								" ", 3, "removeEntity"],
    ["nearest %m.emoji",				    "r", 3, "nearestEntity"],
    ["spawned",				                "r", 3, "spawned"],

    // ["wait %n secs",						" ", 6, "wait:elapsed:from:",	1],
    ["repeat %n",							"c", 6, "doRepeat", 10],
    ["forever",								"cf",6, "doForever"],
    ["if %b then",							"c", 6, "doIf"],
    ["if %b then",							"e", 6, "doIfElse"],
    // ["wait until %b",						" ", 6, "doWaitUntil"],
    // ["repeat until %b",						"c", 6, "doUntil"],

    // math
    ["%n + %n",								"r", 8, "+",					"", ""],
    ["%n - %n",								"r", 8, "-",					"", ""],
    ["%n * %n",								"r", 8, "*",					"", ""],
    ["%n / %n",								"r", 8, "/",					"", ""],
    ["pick random %n to %n",		        "r", 8, "randomFrom:to:",		1, 10],
    ["%s < %s",								"b", 8, "<",					"", ""],
    ["%s = %s",								"b", 8, "=",					"", ""],
    ["%s > %s",								"b", 8, ">",					"", ""],
    ["%b and %b",							"b", 8, "&"],
    ["%b or %b",							"b", 8, "|"],
    ["not %b",								"b", 8, "not"],
    ["join %s %s",							"r", 8, "concatenate:with:",	"hello ", "world"],
    ["letter %n of %s",						"r", 8, "letter:of:",			1, "world"],
    ["length of %s",						"r", 8, "stringLength:",		"world"],
    ["%n mod %n",							"r", 8, "%",					"", ""],
    ["round %n",							"r", 8, "rounded", 				""],
    ["%m.mathOp of %n",						"r", 8, "computeFunction:of:",	"sqrt", 9],

    // physics
    ["forward %n",						    " ", 1, "forward",					10],
    ["move right %n",						" ", 1, "impulseX",					10],
    ["move up %n",						    " ", 1, "impulseY",					10],
    ["turn %n degrees",			            " ", 1, "rotate",				15],
    ["change x by %n",						" ", 1, "changeX",					10],
    ["change y by %n",			            " ", 1, "changeY",				15],
    ["point in direction %d.direction",		" ", 1, "setAngle",					90],
    ["point towards %m.spriteOrMouse",		" ", 1, "pointTowardsEntity",			""],
    ["go to x:%n y:%n",						" ", 1, "gotoXY"],
    ["go to %m.location",					" ", 1, "gotoEntity",		"mouse-pointer"],
    ["x position",							"r", 1, "getX"],
    ["y position",							"r", 1, "getY"],
    ["direction",							"r", 1, "getAngle"],
    ["set mass to %n",			            " ", 1, "setMass",		0],
    ["set restitution to %n",			            " ", 1, "setRestitution",		0],
    ["mass",							    "r", 1, "getMass"],
    ["restitution",							    "r", 1, "getRestitution"],

    // TODO mass, restitution, etc...

    // visuals
    ["set opacity to %n%",			        " ", 2, "setOpacity",		0],
    ["change opacity by %n%",		        " ", 2, "changeOpacity",	10],
    ["scale by %n%",						" ", 2, "scaleBy", 				100],
    //["change size by %n",					" ", 2, "changeScale",	 		10],
    // ["show",								" ", 2, "show"],
    // ["hide",								" ", 2, "hide"],
    ["say %s",								" ", 2, "say",							"Hello!"],
    ["set emoji to %m.emoji",		        " ", 2, "setEmoji",				"pile of poo"],
    ["emoji",							    "r", 2, "getEmoji"],
    ["size",								"r", 2, "getScale"],
    ["random emoji",                 "r", 2, "randomEmoji"],

    // events
    ["when I press %m.key",				    "h", 5, "whenKeyPressed", 		"space"],
    ["when I click",				        "h", 5, "whenClick"],
    // TODO when touching <other entity>...
    ["with %m.spriteOnly",				    "c", 6, "with", "myself"],

    // sensing
    ["timer",								"r", 7, "timer"],
    ["mouse x",								"r", 7, "mouseX"],
    ["mouse y",								"r", 7, "mouseY"],
    ["distance to %m.spriteOrMouse",		"r", 7, "distanceTo:",			""],

    //["when @greenFlag clicked",				"h", 5, "whenGreenFlag"],
    //["when this sprite clicked",			"h", 5, "whenClicked"],
    //["when backdrop switches to %m.backdrop", "h", 5, "whenSceneStarts", 	"backdrop1"],
    //["when %m.triggerSensor > %n",			"h", 5, "whenSensorGreaterThan", "loudness", 10],

    // control
    //["when I start as a clone",				"h", 6, "whenCloned"],
    //["create clone of %m.spriteOnly",		" ", 6, "createCloneOf"],
    //["delete this clone",					"f", 6, "deleteClone"],

    // ["touching %m.touching?",				"b", 7, "touching:",			""],
    // ["touching color %c?",					"b", 7, "touchingColor:"],
    // ["color %c is touching %c?",			"b", 7, "color:sees:"],
    // ["answer",								"r", 7, "answer"],
    // ["key %m.key pressed?",					"b", 7, "keyPressed:",			"space"],
    // ["mouse down?",							"b", 7, "mousePressed"],
    // ["loudness",							"r", 7, "soundLevel"],
    // ["video %m.videoMotionType on %m.stageOrThis", "r", 7, "senseVideoMotion", "motion"],
    //["%m.attribute of %m.spriteOrStage",	"r", 7, "getAttribute:of:"],
    //["current %m.timeAndDate", 				"r", 7, "timeAndDate",			"minute"],
    //["days since 2000", 					"r", 7, "timestamp"],
    //["username",							"r", 7, "getUserName"],
    // ["ask %s and wait",						" ", 7, "doAsk", 				"What's your name?"],
    // ["turn video %m.videoState",			" ", 7, "setVideoState",			"on"],
    // ["set video transparency to %n%",		" ", 7, "setVideoTransparency",		50],
    // ["reset timer",							" ", 7, "timerReset"],

    // variables --unsupported
    // ["set %m.var to %s",								" ", 9, "setVar:to:"],
    // ["change %m.var by %n",								" ", 9, "changeVar:by:"],
    // ["show variable %m.var",							" ", 9, "showVariable:"],
    // ["hide variable %m.var",							" ", 9, "hideVariable:"],

    //// lists -- unsupported
    //["add %s to %m.list",								" ", 12, "append:toList:"],
    //["delete %d.listDeleteItem of %m.list",				" ", 12, "deleteLine:ofList:"],
    //["insert %s at %d.listItem of %m.list",				" ", 12, "insert:at:ofList:"],
    //["replace item %d.listItem of %m.list with %s",		" ", 12, "setLine:ofList:to:"],
    //["show list %m.list",								" ", 12, "showList:"],
    //["hide list %m.list",								" ", 12, "hideList:"],
    //["item %d.listItem of %m.list",						"r", 12, "getLine:ofList:"],
    //["length of %m.list",								"r", 12, "lineCountOfList:"],
    //["%m.list contains %s?",								"b", 12, "list:contains:"],

    /*
    // sound
    ["play sound %m.sound",					" ", 3, "playSound:",						"pop"],
    ["play sound %m.sound until done",		" ", 3, "doPlaySoundAndWait",				"pop"],
    ["stop all sounds",						" ", 3, "stopAllSounds"],
    ["play drum %d.drum for %n beats",		" ", 3, "playDrum",							1, 0.25],
    ["rest for %n beats",					" ", 3, "rest:elapsed:from:",				0.25],
    ["play note %d.note for %n beats",		" ", 3, "noteOn:duration:elapsed:from:",	60, 0.5],
    ["set instrument to %d.instrument",		" ", 3, "instrument:",						1],
    ["change volume by %n",					" ", 3, "changeVolume:",					-10],
    ["set volume to %n%",					" ", 3, "setVolumeTo:", 					100],
    ["change tempo by %n",					" ", 3, "changeTempo:",					20],
    ["set tempo to %n bpm",					" ", 3, "setTempoTo:",						60],

    // pen
    ["clear",								" ", 4, "clearPenTrails"],
    ["stamp",								" ", 4, "stampCostume"],
    ["pen down",							" ", 4, "putPenDown"],
    ["pen up",								" ", 4, "putPenUp"],
    ["set pen color to %c",					" ", 4, "penColor:"],
    ["change pen color by %n",				" ", 4, "changePenHue:"],
    ["set pen color to %n",					" ", 4, "setPenHueTo:", 		0],
    ["change pen shade by %n",				" ", 4, "changePenShade:"],
    ["set pen shade to %n",					" ", 4, "setPenShadeTo:",		50],
    ["change pen size by %n",				" ", 4, "changePenSize:",		1],
    ["set pen size to %n",					" ", 4, "penSize:", 			1],
    */

  ];



  /* define Scratch blocks */

  var categoriesById = {
    1:  "motion",
    2:  "looks",
    3:  "sound",
    4:  "pen",
    5:  "events",
    6:  "control",
    7:  "sensing",
    8:  "operators",
    9:  "variable",
    10: "custom",
    11: "parameter",
    12: "list",
    20: "extension",
    42: "grey",
  };

  var blocks = [];
  var blocksBySelector = {};

  var inputPat = /(%[a-zA-Z](?:\.[a-zA-Z]+)?)/g;

  scratchCommands.push(["%m.var", "r", 9, "readVariable"]);
  scratchCommands.push(["%m.list", "r", 12, "contentsOfList:"]);
  scratchCommands.push(["%m.param", "r", 11, "getParam"]);
  scratchCommands.push(["%m.param", "b", 11, "getParam"]);
  scratchCommands.push(["else", "else", 6, "else"]);
  scratchCommands.push(["end", "end", 6, "end"]);
  scratchCommands.push(["...", "ellips", 42, "ellips"]);

  var typeShapes = {
    ' ': 'stack',
    'b': 'predicate',
    'c': 'c-block',
    'e': 'if-block',
    'f': 'cap',
    'h': 'hat',
    'r': 'reporter',
    'cf': 'c-block cap',

    'else': 'else',
    'end': 'end',
    'ellips': 'ellips',
  };

  scratchCommands.forEach(function(command) {
    var spec = command[0];
    if (spec === 'set pen color to %n') {
      spec = 'set pen hue to %n';
    } else if (spec === 'change pen color by %n') {
      spec = 'change pen hue by %n';
    }
    var block = {
      spec: spec,
      parts: spec.split(inputPat),
      shape: typeShapes[command[1]], // /[ bcefhr]|cf/
      category: categoriesById[command[2] % 100],
      selector: command[3],
      defaults: command.slice(4),
    };
    block.inputs = block.parts.filter(function(p) { return inputPat.test(p); });
    blocks.push(block);
    if (block.selector !== 'getParam') assert(!blocksBySelector[block.selector], block.selector);
    blocksBySelector[block.selector] = block;
  });

  /* this keeps format.js happy */

  var inputShapes = {
    '%b': 'boolean',
    '%c': 'color',
    '%d': 'number-menu',
    '%m': 'readonly-menu',
    '%n': 'number',
    '%s': 'string',
  }

  var getInputShape = function(input) {
    var s = input.slice(0, 2)
    return inputShapes[s];
  };

  /* alternative info for stop block */

  var osisInfo = {
    category: "control",
    defaults: ["all"],
    inputs: ["%m.stop"],
    parts: ["stop", "%m.stop", ""],
    selector: "stopScripts",
    shape: "stack",
    spec: "stop %m.stop",
  };


  return {
    blocks: blocks,
    blocksBySelector: blocksBySelector,
    inputPat: inputPat,
    getInputShape: getInputShape,

    stopOtherScripts: osisInfo,
  };

}());


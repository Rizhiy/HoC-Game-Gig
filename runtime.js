
const Matter = require('matter-js/build/matter.js')

const emojiList = require('./static/emoji-list.js')


function evaluate(thing, ctx) {
  let selector = thing[0]
  let inputs = Array.from(thing).slice(1)

  let length = inputs.length
  var args = []
  for (var i=0; i<length; i++) {
    args.push(value(inputs[i], ctx))
  }

  switch (selector) {
    case 'spawnEntity':
      var [name] = args
      ctx.game.spawn(name, ctx.x, ctx.y)
      break
    case 'setEmoji':
      var [name] = args
      ctx.entity.name = name
      break
    case 'say':
      var [message] = args
      ctx.game.broadcast({ type: 'messagebox', id: ctx.entity.id, message })
      break

    case 'setAngle':
      var [angle] = args
      Matter.Body.setAngle(ctx.entity.body, Math.PI / 180 * angle)
      break
    case 'rotate': // TODO torque?!?!
      var [angle] = args
      Matter.Body.rotate(ctx.entity.body, Math.PI / 180 * angle)
      break

    case 'setMass':
      var [mass] = args
      Matter.Body.setMass(ctx.entity.body, mass)
      break

    case 'gotoXY':
      var [x, y] = args
      Matter.Body.setPosition(ctx.entity.body, {x, y})
      break
    case 'changeX':
      var [x] = args
      var y = 0
      Matter.Body.translate(ctx.entity.body, {x, y})
      break
    case 'changeY':
      var x = 0
      var [y] = args
      Matter.Body.translate(ctx.entity.body, {x, y})
      break

    case 'forward':
      var [amount] = args
      var body = ctx.entity.body
      var x = Math.sin(body.angle) / 100 * amount
      var y = Math.cos(body.angle) / 100 * amount
      console.log(x, y)
      Matter.Body.applyForce(body, body.position, {x, y})
      break

    default:
      console.log('unknown selector', selector, JSON.stringify(args))
  }
}

var DIGIT = /^[0-9.]+$/

var compare = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx < ny ? -1 : nx === ny ? 0 : 1;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs < ys ? -1 : xs === ys ? 0 : 1;
};

var numLess = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx < ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx < ys;
};

var numGreater = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx > ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx > ys;
};

var equal = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx === ny;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs === ys;
};

var mod = function(x, y) {
    var r = x % y;
    if (r / y < 0) {
      r += y;
    }
    return r;
  };

  var random = function(x, y) {
    x = +x || 0;
    y = +y || 0;
    if (x > y) {
      var tmp = y;
      y = x;
      x = tmp;
    }
    if (x % 1 === 0 && y % 1 === 0) {
      return Math.floor(Math.random() * (y - x + 1)) + x;
    }
    return Math.random() * (y - x) + x;
  };

var mathFunc = function(f, x) {
    switch (f) {
      case 'abs':
        return Math.abs(x);
      case 'floor':
        return Math.floor(x);
      case 'sqrt':
        return Math.sqrt(x);
      case 'ceiling':
        return Math.ceil(x);
      case 'cos':
        return Math.cos(x * Math.PI / 180);
      case 'sin':
        return Math.sin(x * Math.PI / 180);
      case 'tan':
        return Math.tan(x * Math.PI / 180);
      case 'asin':
        return Math.asin(x) * 180 / Math.PI;
      case 'acos':
        return Math.acos(x) * 180 / Math.PI;
      case 'atan':
        return Math.atan(x) * 180 / Math.PI;
      case 'ln':
        return Math.log(x);
      case 'log':
        return Math.log(x) / Math.LN10;
      case 'e ^':
        return Math.exp(x);
      case '10 ^':
        return Math.exp(x * Math.LN10);
    }
    return 0;
  };

function num(x) {
  return +x
}

function str(s) {
    return "" + s
}

function bool(x) {
    return !!x
}


function value(thing, ctx) {
  if (!(thing && thing.constructor === Array)) {
    if (thing === '_myself_') {
      return ctx.me
    } else if (thing === '_mouse_') {
      // TODO mouse pointer
    }
    return thing
  }

  let selector = thing[0]
  let inputs = thing.slice(1)

  let length = inputs.length
  var args = []
  for (var i=0; i<length; i++) {
    args.push(value(inputs[i], ctx))
  }

  switch (selector) {
    case '+': return num(args[0]) + num(args[1])
    case '-':  return num(args[0]) - num(args[1])
    case '*':  return num(args[0]) * num(args[1])
    case '/':  return num(args[0]) / num(args[1])
    case "randomFrom:to:":
        return random(num(args[0]), num(args[1]))
    case "<": return compare(args[0], args[1]) === -1
    case ">": return compare(args[0], args[1]) === 1
    case "=": return equal(args[0], args[1])
    case "&": return bool(args[0]) && bool(args[1])
    case "|": return bool(args[0]) || bool(args[1])
    case "not": return !bool(args[0])
    case "concatenate:with:": return str(args[0]) + str(args[1])
    case "letter:of:": return str(args[1]).charAt(num(args[0])-1)
    case "stringLength": return str(args[0]).length
    case "%": return mod(num(args[0]), num(args[1]))
    case "rounded": return Math.round(num(args[0]))
    case "computeFunction:of:": return mathFunc(str(args[0]), num(args[1]))

    case 'getEmoji': return ctx.entity.name
    case 'getAngle': return ctx.entity.body.angle * 180 / Math.PI
    case 'getX': return ctx.entity.body.position.x
    case 'getY': return ctx.entity.body.position.y
    case 'getMass': return ctx.entity.body.mass

    case 'nearest':
      let emoji = args[0]
      // TODO find nearest emoji!
      return ctx.this

    case 'randomEmoji':
      return choose(emojiList)

    default:
      console.log('unknown selector', selector, JSON.stringify(args))
  }
}

function evaluateSeq(things, ctx) {
  let length = things.length
  for (var i=0; i<length; i++) {
    evaluate(things[i], ctx)
  }
}

module.exports = {
  evaluate: evaluateSeq,
}

function choose(options) {
  return options[Math.floor(Math.random() * options.length)]
}


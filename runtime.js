
const Matter = require('matter-js/build/matter.js')



function evaluate(thing, ctx) {
  let selector = thing[0]
  let args = Array.from(thing).slice(1)

  let length = args.length
  var values = []
  for (var i=0; i<length; i++) {
    values.push(value(args[i], ctx))
  }

  switch (selector) {
    case 'spawnEntity':
      var [name] = values
      ctx.game.spawn(name, ctx.x, ctx.y)
      break

    case 'setEmoji':
      var [name] = values
      ctx.entity.name = name
      break

    case 'setAngle':
      var [entity, angle] = values
      Matter.Body.setAngle(ctx.entity.body, Math.PI / 180 * angle)
      break
      
    case 'say':
      var [message] = values
      ctx.game.broadcast({ type: 'messagebox', id: ctx.entity.id, message })
      break

    case 'rotate':
      var [entity, angle] = values
      Matter.Body.rotate(ctx.entity.body, Math.PI / 180 * angle)
      break

    case 'gotoXY':
      var [x, y] = values
      Matter.Body.setPosition(ctx.entity.body, {x, y})
      break

    case 'nudgeXY':
      var [x, y] = values
      x /= 100
      y /= -100
      let body = ctx.entity.body
      Matter.Body.applyForce(body, body.position, {x, y})
      break

    default:
      console.log('unknown selector', selector, JSON.stringify(args))
  }
}

function num(x) {
  return +x
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
  let args = thing.slice(1)

  let length = args.length
  var values = []
  for (var i=0; i<length; i++) {
    values.push(value(args[i], ctx))
  }

  switch (selector) {
    case '+': return num(args[0]) + num(args[1])
    case '-':  return num(args[0]) - num(args[1])
    case '*':  return num(args[0]) * num(args[1])
    case '/':  return num(args[0]) / num(args[1])

    case 'nearest':
      let emoji = args[0]
      // TODO find nearest emoji!
      return ctx.this

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


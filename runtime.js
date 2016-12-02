
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
    case 'spawn':
      var [name] = values
      ctx.game.spawn(name, ctx.x, ctx.y)
      return null

    case 'setEmoji':
      var [entity, name] = values
      entity.name = name
      return null

    case 'setAngle':
      var [entity, angle] = values
      Matter.Body.setAngle(entity.body, Math.PI / 180 * angle)
      return null

    case 'rotate':
      var [entity, angle] = values
      Matter.Body.rotate(entity.body, Math.PI / 180 * angle)
      return null

    case 'nudgeXY':
      var [entity, x, y] = values
      x /= 100
      y /= -100
      var body = entity.body
      Matter.Body.applyForce(body, body.position, {x, y})
      return null
    
    default:
      console.log('unknown selector', selector, JSON.stringify(args))
  }
}

function value(thing, ctx) {
  if (!(thing && thing.constructor === Array)) {
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
    case 'thisPlayer':
      return ctx.me

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



const Matter = require('matter-js/build/matter.js')


class Player {
  constructor(game, id, send) {
    this.game = game
    this.id = id
    this.send = send
  }

  place(name, x = 0, y = 0) {
    this.entity = new Entity(name, x, y)
    this.game.add(this.entity)
  }

  destroy() {
  }

}


class Entity {
  constructor(name, x = 0, y = 0) {
    this.name = name
    this.body = Matter.Bodies.circle(x, y, Entity.RADIUS)
    this.id = this.body.id
  }

  toJSON() {
    let body = this.body
    let render = body.render
    return {
      id: this.id,
      name: this.name,
      x: body.position.x,
      y: body.position.y,
      rot: 180 / Math.PI * body.angle,
      scale: render.sprite.xScale,
      opacity: render.opacity,
      visible: render.visible,
    }
  }
}
Entity.highestId = 0
Entity.RADIUS = 36




class Game {
  constructor() {
    this.players = {}
    this.entities = []
    this.entitiesById = {}

    this.engine = Matter.Engine.create();
    this.width = 4000;
    this.height = 2000;
      var sky = Matter.Bodies.rectangle(0,-this.height/2,this.width,100,{isStatic:true})
      var ground = Matter.Bodies.rectangle(0, this.height/2, this.width, 100, { isStatic: true })
      var right = Matter.Bodies.rectangle(this.width/2,0,100,this.height,{isStatic:true})
      var left = Matter.Bodies.rectangle(-this.width/2,0,100,this.height,{isStatic:true})
      Matter.World.add(this.engine.world,[sky,ground,right,left]);
  }


  /* players */

  player(playerId, send) {
    this.players[playerId] = new Player(this, playerId, send)
  }

  removePlayer(playerId) {
    this.players[playerId].destroy()
    delete this.players[playerId]
  }

  send(playerId, json) {
    this.players[playerId].send(json)
  }

  broadcast(json) {
    for (let id in this.players) {
      this.players[id].send(json)
    }
  }

  handle(playerId, json) {
    let player = this.players[playerId]
    let type = json.type
    delete json.type
    this[`handle_${type}`](playerId, json)
  }

  handle_spawn(id, json) {
    let player = this.players[id]
    player.place(json.name, json.x, json.y)
  }


  /* entities */

  add(entity) {
    this.entities.push(entity)
    this.entitiesById[entity.id] = entity

    Matter.World.addBody(this.engine.world, entity.body)
  }

  remove(entityId) {
    let entity = this.entitiesById[entityId]
    delete this.entitiesById[entityId]
    let index = this.entities.indexOf(entity)
    if (index === -1) throw 'already removed'
    this.entities.splice(index, 1)

    // TODO remove Matter.js entity
  }


  /* main loop */

  tick(fps) {
    // TODO sync entity values to/from Matter.js ???
    Matter.Engine.update(this.engine, 1000/fps)

    this.stream()
  }

  // send world to clients
  stream() {
    let entities = this.entities
    let out = []
    for (var i=entities.length; i--; ) {
      out.push(entities[i].toJSON())
    }
    this.broadcast({ type: 'world', entities: out })
  }

}



module.exports = {
  Game,
}

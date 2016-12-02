
const Matter = require('matter-js/build/matter.js')


class Player {
  constructor(game, id, send) {
    this.game = game
    this.id = id
    this.send = send
  }

  place(json) {
    let { emoji } = json
    this.entity = new Entity(emoji, 0, 0)
    this.game.add(this.entity)
  }

  destroy() {
  }

}


class Entity {
  constructor(name = '', x = 0, y = 0, rot = 0, scale = 1, opacity = 1, mass = 1) {
    this.id = ++Entity.highestId
    this.name = name
    this.x = x
    this.y = y
    this.rot = rot
    this.scale = scale
    this.opacity = opacity
    this.mass = mass
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      rot: this.rot,
      scale: this.scale,
      opacity: this.opacity,
      mass: this.mass,
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

    this.engine = Matter.Engine.create()

      var ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true })
      Matter.World.add(this.engine.world,[ground]);
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

    entity.body = Matter.Bodies.circle(entity.x, entity.y, Entity.RADIUS)
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

    let entities = this.entities
    for (var i=entities.length; i--; ) {
      let entity = entities[i]
      entity.x = entity.body.position.x
      entity.y = entity.body.position.y
    }

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

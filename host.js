
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




class Game {
  constructor() {
    this.players = {}
    this.entities = []

    this.engine = Matter.Engine.create()
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
    // TODO add to Matter.js
  }


  /* main loop */

  tick() {

  }
  
}



module.exports = {
  Game,
}

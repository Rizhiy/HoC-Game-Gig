

class Player {
  constructor(game, id, send) {
    this.game = game
    this.id = id
    this.send = send
  }

  destroy() {
  }

}


class Game {
  constructor() {
    this.players = {}
    this.entities = []
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
    console.log(json)
    this.broadcast(json)
  }


  /* entities */

  // TODO


  
}



module.exports = {
  Game,
}

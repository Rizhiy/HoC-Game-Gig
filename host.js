
const Matter = require('matter-js/build/matter.js')

const runtime = require('./runtime')



class Player {
  constructor(game, id, send) {
    this.game = game
    this.id = id
    this.send = send

    this.onKey = {}
    this.onClick = null
  }

  place(name, x = 0, y = 0) {
    this.entity = new Entity(name, x, y)
    this.game.add(this.entity)
  }

  destroy() {
    this.game.remove(this.entity)
    // TODO anything else?
  }

  run(code, interactive = false) {
    let player = this
    runtime.evaluate(code, {
      player: player,
      entity: player.entity,
      game: this.game,
      x: player.entity.body.position.x,
      y: player.entity.body.position.y,
      mouseX: player.mouseX,
      mouseY: player.mouseY
    }, interactive)
  }
}


class Entity {
  constructor(name, x = 0, y = 0) {
    this.name = name
    this.body = Matter.Bodies.circle(x, y, Entity.RADIUS)
    this.id = this.body.id

    this.threads = []
  }

  toJSON() {
    let body = this.body
    let render = body.render
    return {
      id: this.id,
      name: this.name,
      x: body.position.x + Game.WIDTH/2,
      y: body.position.y + Game.HEIGHT/2,
      rot: 180 / Math.PI * body.angle,
      scale: render.sprite.xScale,
      opacity: render.opacity,
      visible: render.visible,
    }
  }

  distanceTo(other){
    dx = this.body.position.x - other.body.position.x;
    dy = this.body.position.y - other.body.position.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  findClosest(){
    var closest = null;
    var smallestDistance = null;
    Game.entities.forEach(function(entity){
        var distance = this.distanceTo(entity);
        if(!closest) {
            closest = entity;
            smallestDistance = distance;
        }
        if(distance < smallestDistance){
          closest = entity;
          smallestDistance = distance;
        }
      }
    );
    return closest;
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
      var sky = Matter.Bodies.rectangle(0,-(Game.HEIGHT+Game.BORDER_WIDTH)/2,Game.WIDTH+Game.BORDER_WIDTH,Game.BORDER_WIDTH,{isStatic:true})
      var ground = Matter.Bodies.rectangle(0, (Game.HEIGHT+Game.BORDER_WIDTH)/2, Game.WIDTH+Game.BORDER_WIDTH, Game.BORDER_WIDTH, { isStatic: true })
      var right = Matter.Bodies.rectangle((Game.WIDTH+Game.BORDER_WIDTH)/2,0,Game.BORDER_WIDTH,Game.HEIGHT+Game.BORDER_WIDTH,{isStatic:true})
      var left = Matter.Bodies.rectangle(-(Game.WIDTH+Game.BORDER_WIDTH)/2,0,Game.BORDER_WIDTH,Game.HEIGHT+Game.BORDER_WIDTH,{isStatic:true})
      Matter.World.add(this.engine.world,[sky,ground,right,left]);
  }


  /* players */

  player(playerId, send) {
    let player = this.players[playerId] = new Player(this, playerId, send)
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
    player.send({ type: 'player_id', id: player.entity.id })
  }

  handle_code(id, json) {
    let player = this.players[id]
    let scripts = json.json

    player.run(scripts, true)
  }

  handle_mouseMove(id, json) {
      let player = this.players[id]
      player.mouseX = json.position.x - Game.WIDTH/2
      player.mouseY = json.position.y - Game.HEIGHT/2
  }

  handle_keydown(id, json) {
    let player = this.players[id]
    let code = player.onKey[json.keyCode]
    console.log(code)
    if (code) {
      player.run([code])
    }
  }

  handle_mouseClick(id,json){
    let player = this.players[id]
    let code = player.onClick
    console.log(code)
    if (code) {
      player.run([code])
    }
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
    if (index === -1) return
    this.entities.splice(index, 1)

    Matter.World.remove(this.engine.world, entity.body)

    this.broadcast({ type: 'remove_entity', id: entityId })
  }


  /* main loop */

  tick(fps) {
    // TODO sync entity values to/from Matter.js ???
    Matter.Engine.update(this.engine, 1000/fps)

    this.tickEntities()
    this.stream()
  }

  tickEntities() {
    let entities = this.entities
    for (var i=entities.length; i--; ) {
      runtime.tickEntity(entities[i])
    }
  }

  // send world to clients
  stream() {
    let entities = this.entities
    let out = []
    for (var i=entities.length; i--; ) {
      out.push(entities[i].toJSON())
    }
    this.broadcast({ type: 'world', entities: out })
    
    let players = this.players
    out = []
    for(let ply_idx in players){
        let player = players[ply_idx]
        if(player.entity){
            out.push({id: player.entity.id, x: player.mouseX, y: player.mouseY})
        }
    }
    this.broadcast({ type: 'mousePos', coords: out})
  }

  spawn(name, x, y) {
    let entity = new Entity(name, x, y)
    this.add(entity)
    return entity
  }

}
Game.WIDTH = 4000;
Game.HEIGHT = 2000;
Game.BORDER_WIDTH = 1000;



module.exports = {
  Game,
}

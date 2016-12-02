
const WebSocketServer = require('websocket').server
const http = require('http')
const path = require('path')
const fs = require('fs')

const host = require('./host')



var server = http.createServer(function(request, response) {

  console.log('request starting...')

  var filePath = '.' + request.url
  if (filePath == './')
    filePath = './index.html'

  var extname = path.extname(filePath)
  var contentType = 'text/html'
  switch (extname) {
    case '.js':
      contentType = 'text/javascript'
      break
    case '.css':
      contentType = 'text/css'
      break
    case '.json':
      contentType = 'application/json'
      break
    case '.png':
      contentType = 'image/png'
      break;      
    case '.jpg':
      contentType = 'image/jpg'
      break
    case '.wav':
      contentType = 'audio/wav'
      break
  }

  fs.readFile(`static/${filePath}`, function(error, content) {
    if (error) {
      if(error.code == 'ENOENT'){
        fs.readFile('./404.html', function(error, content) {
          response.writeHead(200, { 'Content-Type': contentType })
          response.end(content, 'utf-8')
        })
      }
      else {
        response.writeHead(500)
        response.end('Sorry, check with the site admin for error: '+error.code+' ..\n')
        response.end(); 
      }
    }
    else {
      response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': content.length,
        'Cache-Control': 'max-age=31536000',
      })
      response.end(content, 'utf-8')
    }
  })

})
server.listen(8080, function() {
  console.log((new Date()) + ' go to http://localhost:8080/')
})

wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production 
  // applications, as it defeats all standard cross-origin protection 
  // facilities built into the protocol and the browser.  You should 
  // *always* verify the connection's origin and decide whether or not 
  // to accept it. 
  autoAcceptConnections: false
})

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true
}



let game = new host.Game()

let highestId = 0
wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin 
    request.reject()
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.')
    return
  }

  var connection = request.accept('', request.origin)
  console.log((new Date()) + ' Connection accepted.')

  let playerId = ++highestId
  game.player(playerId, send)

  function send(json) {
    connection.sendUTF(JSON.stringify(json))
  }

  connection.on('message', function(message) {
    if (message.type !== 'utf8') throw 'oops'
    let json = JSON.parse(message.utf8Data)
    game.handle(playerId, json)
  })

  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.')
    game.removePlayer(playerId)
  })

})


let fps = 25
setInterval(() => {
  game.tick(fps)
}, 1000 / fps)


var wsUri = "ws://localhost:8080/";
var output;

class Connection {
  constructor() {
    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.onopen = e => this.opened(e)
    this.ws.onclose = e => this.closed(e)
    this.ws.onmessage = this._message.bind(this)
    this.ws.onerror = e => this.error(e)

    this.handlers = []
  }

  send(json) {
    this.ws.send(JSON.stringify(json))
  }

  opened() {}
  closed() {}
  error() {}

  _message(message) {
    let json = JSON.parse(message.data)
    this.handlers.forEach(cb => cb(json))
  }

  on(cb) {
    this.handlers.push(cb)
  }
}


function loadEmoji(cb) {
  var xhr = new XMLHttpRequest();
	
	xhr.addEventListener("load", function(data){
		cb(null);
	});
	
	xhr.addEventListener("progress", function(p){
		var el = document.getElementById("loadingbar")
		el.style.width = (100 * p.loaded / p.total) + "%";
	});
	
	xhr.open("GET", "emoji.png");
	xhr.send();
}

window.addEventListener("load", () => {
  let conn = new Connection()
  conn.opened = () => {
    loadEmoji(emoji => main(conn, emoji))
  }
})


function main(conn, emoji) {
  window.conn = conn

  conn.on(message => {
    console.log(message)
  })

  conn.send('hello')

}

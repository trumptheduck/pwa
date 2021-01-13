const express = require('express');
const app = express()
const http = require('http').Server(app);
const path = require("path")
const io = require('socket.io')(http);
const httpPort = 80

io.on('connection', (socket)=> {
  console.log("An user connected!")
  socket.emit('status', "You are connected")
  socket.on('request', (data) => {
    console.log("An user requested a package!")
    socket.emit('response', "Well fuck you!")
  })
})
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'))
})
app.get('/devices', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/devices.html'))
})

http.listen(httpPort, function () {
  console.log(`Listening on port ${httpPort}!`)
})
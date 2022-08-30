require('dotenv').config();
const express = require('express');
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid');
const io = require('socket.io')(server);
const PORT = process.env.PORT || 5000;
// webrtc
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set('view engine', 'ejs');
app.use('/peerjs', peerServer);
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

// connection socket.io
io.on('connection', (socket) => {
  // listen the room from the browser.
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    // stream to everyobody
    socket.broadcast.to(roomId).emit('user-connected', userId);
    // listen the message from the browser.
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message, userName);
    });
  });

  //error socket.io
  socket.on('connect_error', (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

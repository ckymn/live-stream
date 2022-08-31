require('dotenv').config();
const express = require('express');
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid');
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
  },
});
const PORT = process.env.PORT || 5000;
const userList = [];
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
  userList.push(socket.id);
  console.log(socket.handshake);
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
  socket.on('disconnecting', (reason) => {
    console.log(socket.handshake.auth.user);
    console.log(
      `${socket.handshake.auth.user} is disconnecting because ${reason}`
    );

    const index = userList.indexOf(socket.id);
    if (index > -1) {
      userList.splice(index, 1);
    }

    io.emit('leaveUserFromRoom', {
      userId: socket.id,
      userName: socket.handshake.auth.user,
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

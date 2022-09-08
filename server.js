require('dotenv').config();
const express = require('express');
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid');
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  },
});
const PORT = process.env.PORT || 5000;

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

const userList = [];
// connection socket.io
io.on('connection', (socket) => {
  userList.push(socket.id);
  // listen the room from the browser.
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    // stream to everyobody
    io.to(roomId).emit('user-connected', {
      userId,
      userName,
    });
    // listen the message from the browser.
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message, userName);
    });

    io.to(roomId).emit('userList', userList);

    // leave room
    socket.on('disconnect', (reason) => {
      console.log(`${socket.id} is disconnecting server`);

      const index = userList.indexOf(socket.id);
      if (index > -1) {
        userList.splice(index, 1);
      }

      io.to(roomId).emit('user-disconnected', {
        userId,
        userName,
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

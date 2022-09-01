require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || 5000;
const express = require('express');
const app = express();
const http = require('http');
const { ExpressPeerServer } = require('peer');

const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  },
});

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
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);

  io.on('connection', (socket) => {
    console.log(`${socket.id} is connected server`);
    userList.push(socket.id);

    // connect room
    socket.on('join-room', (data) => {
      socket.join(data.ROOM_ID);

      socket.broadcast.to(data.ROOM_ID).emit('user-connected', {
        userId: socket.id,
        userName: data.user,
      });

      socket.on('message', (message) => {
        io.to(data.ROOM_ID).emit('createMessage', message, data.user);
      });

      // leave room
      socket.on('disconnecting', (reason) => {
        console.log(`${socket.id} is disconnecting server`);

        const index = userList.indexOf(socket.id);
        if (index > -1) {
          userList.splice(index, 1);
        }

        io.to(data.ROOM_ID).emit('user-disconnected', {
          userId: socket.id,
          userName: data.user,
        });
      });
    });
  });
});

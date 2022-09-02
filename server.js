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
    console.log(userList);

    // connect room
    socket.on('join-room', ({ ROOM_ID, user }) => {
      socket.join(ROOM_ID);

      io.to(ROOM_ID).emit('user-connected', {
        userId: socket.id,
        userName: user,
      });

      socket.on('message', (message) => {
        io.to(ROOM_ID).emit('createMessage', message, user);
      });

      io.to(ROOM_ID).emit('userList', userList);

      // leave room
      socket.on('disconnect', (reason) => {
        console.log(`${socket.id} is disconnecting server`);

        const index = userList.indexOf(socket.id);
        if (index > -1) {
          userList.splice(index, 1);
        }

        io.to(ROOM_ID).emit('user-disconnected', {
          userId: socket.id,
          userName: user,
        });
      });
    });
  });
});

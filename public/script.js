const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
const showChat = document.querySelector('#showChat');
const showScreen = document.getElementById('showScreen');
const text = document.querySelector('#chat_message');
const send = document.getElementById('send');
const messages = document.querySelector('.messages');
const inviteButton = document.querySelector('#inviteButton');
const showUsers = document.querySelector('#showUsers');
const showUserLength = document.querySelector('#showUsers i');
const muteButton = document.querySelector('#muteButton');
const stopVideo = document.querySelector('#stopVideo');

myVideo.muted = true;

const userList = [];
const peers = {};
const currentPeer = null;

const user = prompt('Enter your name');

// peer.js Client connection
const peer = new Peer(undefined, {
  host: '/',
  path: '/peerjs',
  port: 3000,
});

let myVideoStream;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    window.stream = stream;

    addVideoStream(myVideo, stream);

    // peer to peer
    peer.on('call', (call) => {
      call.answer(stream);
      const video = document.createElement('video');
      currentPeer = call;

      call.on('stream', (userVideoStream) => {
        if (!userList.includes(call.peer)) {
          addVideoStream(video, userVideoStream);
          userList.push(call.peer);
        }
      });
    });

    // share screen
    showScreen.addEventListener('click', (e) => {
      navigator.mediaDevices
        .getDisplayMedia({
          video: {
            cursor: 'always',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
        .then((stream) => {
          const screenStream = stream;
          window.stream = stream;

          let videoTrack = screenStream.getVideoTracks()[0];

          if (peer) {
            console.log('Current Peer', currentPeer);
            var video = document.createElement('video');
            addVideoStream(video, stream);

            let sender = currentPeer.peerConnection
              .getSenders()
              .find(function (s) {
                return s.track.kind == videoTrack.kind;
              });
            sender.replaceTrack(videoTrack);
            screenSharing = true;
          }
        })
        .catch((err) => {
          console.log('unable to get display media' + err);
        });
    });
  });

peer.on('call', function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      currentPeer = call;
      call.answer(stream); // Answer the call with stream.
      console.log('Init window stream with stream');
      const video = document.createElement('video');
      call.on('stream', function (remoteStream) {
        if (!userList.includes(call.peer)) {
          addVideoStream(video, remoteStream);
          userList.push(call.peer);
        }
      });
    },
    function (err) {
      console.log('Failed to get local stream', err);
    }
  );
});

// connect to new user
const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');

  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
};

// peer.js listening
peer.on('open', (id) => {
  console.log('peer icine girdi');
  socket.emit('join-room', ROOM_ID, id, user);
});

// user connected
socket.on('user-connected', (data) => {
  messages.innerHTML =
    messages.innerHTML +
    `<li style="text-align: center; padding-bottom: 5px;"> 
      <i class="far fa-user-circle" style="color: yellow"></i> 
      <span style="color: white"> ${data.userName} is connected</span>
    </li>`;
  userList.push(data);
});

// user disconnected
socket.on('user-disconnected', (data) => {
  messages.innerHTML =
    messages.innerHTML +
    `<li style="text-align: center; padding-bottom: 5px;"> 
      <i class="far fa-user-circle" style="color: red"></i> 
      <span style="color: white"> ${data.userName} is disconnected</span>
    </li>`;

  const index = userList.findIndex((i) => i.userId === data.userId);
  if (index !== -1) {
    userList.splice(index, 1);
  }
});

// socket disconnect
socket.on('disconnect', function () {
  socket.emit('leave-room', ROOM_ID, currentUserId);
  video.remove();
});

// send message with enter
text.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && text.value.length !== 0) {
    // create new message on browser
    socket.emit('message', text.value);
    text.value = '';
  }
});

// send message with button
send.addEventListener('click', (e) => {
  if (text.value.length !== 0) {
    socket.emit('message', text.value);
    text.value = '';
  }
});

// join romm
socket.emit('join-room', { ROOM_ID, user });

// create new message
socket.on('createMessage', (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? 'me' : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
  let totalUsers = document.getElementsByTagName('video').length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName('video')[index].style.width =
        100 / totalUsers + '%';
    }
  }
};

// show-hide chat panel
showChat.addEventListener('click', () => {
  const show = document.querySelector('.main__right');
  if (show.style.display === 'none') {
    show.style.display = 'flex';
  } else {
    show.style.display = 'none';
  }
});

// mute microphone
muteButton.addEventListener('click', () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle('background__red');
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle('background__red');
    muteButton.innerHTML = html;
  }
});

// mute video
stopVideo.addEventListener('click', () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle('background__red');
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle('background__red');
    stopVideo.innerHTML = html;
  }
});

// invite another user
inviteButton.addEventListener('click', (e) => {
  prompt(
    'Copy this link and send it to people you want to meet with',
    window.location.href
  );
});

// show users and values
showUsers.addEventListener('click', (e) => {
  showUserLength.innerHTML = userList.length;
  const x = document.querySelector('.users');
  let html = '';
  userList.forEach((user) => {
    html += `<div class="user">
      <b><i class="far fa-user-circle"></i> <span> ${user.userName}</span> </b>
    </div>`;
  });
  x.innerHTML = html;

  if (x.style.display === 'none') {
    x.style.display = 'block';
  } else {
    x.style.display = 'none';
  }
});

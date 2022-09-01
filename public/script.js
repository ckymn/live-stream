const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
const showChat = document.querySelector('#showChat');
const backBtn = document.querySelector('.header__back');
const userList = [];
myVideo.muted = true;

backBtn.addEventListener('click', () => {
  document.querySelector('.main__left').style.display = 'flex';
  document.querySelector('.main__left').style.flex = '1';
  document.querySelector('.main__right').style.display = 'none';
  document.querySelector('.header__back').style.display = 'none';
});

showChat.addEventListener('click', () => {
  document.querySelector('.main__right').style.display = 'flex';
  document.querySelector('.main__right').style.flex = '1';
  document.querySelector('.main__left').style.display = 'none';
  document.querySelector('.header__back').style.display = 'block';
});

const user = prompt('Enter your name');

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
  });

const connectToNewUser = (userId, stream) => {
  // add new video stream with peer connection(webRTC)
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

peer.on('open', (id) => {
  console.log('peer icine girdi');
  socket.emit('join-room', ROOM_ID, id, user);
});

socket.emit('join-room', { ROOM_ID, user });

socket.on('user-connected', (data) => {
  userList.push(data);
  console.log(`${data.userName} is connected client`);
});

socket.on('user-disconnected', (data) => {
  console.log(`${data.userName} is disconnected client`);

  const index = userList.findIndex((i) => i.userId === data.userId);
  if (index !== -1) {
    userList.splice(index, 1);
  }
});

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
    videoGrid.append(video);
  });
};

let text = document.querySelector('#chat_message');
let send = document.getElementById('send');
let messages = document.querySelector('.messages');

send.addEventListener('click', (e) => {
  if (text.value.length !== 0) {
    socket.emit('message', text.value);
    text.value = '';
  }
});

text.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && text.value.length !== 0) {
    // create new message on browser
    socket.emit('message', text.value);
    text.value = '';
  }
});

const inviteButton = document.querySelector('#inviteButton');
const muteButton = document.querySelector('#muteButton');
const stopVideo = document.querySelector('#stopVideo');
muteButton.addEventListener('click', () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  console.log('videstream ->', myVideoStream);
  console.log('enabled ->', enabled);
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

inviteButton.addEventListener('click', (e) => {
  prompt(
    'Copy this link and send it to people you want to meet with',
    window.location.href
  );
});

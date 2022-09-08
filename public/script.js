const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
const showChat = document.querySelector('#showChat');
const showScreen = document.getElementById('showScreen');
const messages = document.querySelector('.messages');
const text = document.querySelector('#chat_message');
const send = document.getElementById('send');
const inviteButton = document.querySelector('#inviteButton');
const muteButton = document.querySelector('#muteButton');
const stopVideo = document.querySelector('#stopVideo');
const record = document.getElementById('record');
myVideo.muted = true;

const userList = [];
var currentPeer = null;
var isRecording = false;
let mediaRecorder;
let recordedBlobs;
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

    peer.on('call', (call) => {
      call.answer(stream);
      const video = document.createElement('video');

      currentPeer = call;

      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // listen the user-connected broadcast from the server(socket)
    socket.on('user-connected', ({ userId, userName }) => {
      messages.innerHTML =
        messages.innerHTML +
        `<li style="text-align: center; padding-bottom: 5px;"> 
        <i class="far fa-user-circle" style="color: yellow"></i> 
        <span style="color: white"> ${userName} is connected</span>
      </li>`;
      if (userList.length === 0) {
        userList.push({ userId, userName, role: 'admin' });
      }
      userList.push({ userId, userName, role: 'user' });
      connectToNewUser(userId, stream);
    });

    // user disconnected
    socket.on('user-disconnected', ({ userId, userName }) => {
      messages.innerHTML =
        messages.innerHTML +
        `<li style="text-align: center; padding-bottom: 5px;"> 
      <i class="far fa-user-circle" style="color: red"></i> 
      <span style="color: white"> ${userName} is disconnected</span>
    </li>`;

      const index = userList.findIndex((i) => i.userId === userId);
      if (index !== -1) {
        userList.splice(index, 1);
      }

      console.log(userList);
    });

    // share screen
    showScreen.addEventListener('click', (e) => {
      console.log('peer -> ', peer);
      console.log('user list -> ', userList);
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

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  currentPeer = call;
  const video = document.createElement('video');

  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on('close', () => {
    video.remove();
  });
};

peer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id, user);
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
  let totalUsers = document.getElementsByTagName('video').length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName('video')[index].style.width =
        100 / totalUsers + '%';
    }
  }
};

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

showChat.addEventListener('click', () => {
  document.querySelector('.main__right').style.display = 'flex';
  document.querySelector('.main__right').style.flex = '1';
  document.querySelector('.main__left').style.display = 'none';
  document.querySelector('.header__back').style.display = 'block';
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

// record
record.addEventListener('click', (e) => {
  !isRecording ? startRecording() : stopRecording();
});

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}
// start recording
const startRecording = () => {
  const VIDEO_WIDTH = 1280;
  const VIDEO_HEIGHT = 1024;
  var numStreams = 0;
  var curStream = 0;

  var merger = new VideoStreamMerger({
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
  });

  merger.start();

  document.getElementById('iconRecord').className = 'fa fa-square';
  document.getElementById('recordLabel').innerText = 'Stop Recording';

  const videoList = document.querySelectorAll('video');

  const videTags = [...videoList]; // converts NodeList to Array
  videTags.forEach((video) => {
    const curStream = numStreams;
    merger.addStream(video.srcObject, {
      mute: numStreams > 0,
      draw: function (ctx, frame, done) {
        if (curStream >= numStreams) curStream = 0;

        ctx.drawImage(
          frame,
          VIDEO_WIDTH * curStream,
          0,
          VIDEO_WIDTH,
          VIDEO_HEIGHT
        );

        done();
      },
    });

    numStreams++;
    merger.setOutputSize(numStreams * VIDEO_WIDTH, VIDEO_HEIGHT);
  });

  isRecording = true;
  recordedBlobs = [];
  const mimeType = 'video/webm;codecs=vp9,opus';
  const options = { mimeType };

  try {
    mediaRecorder = new MediaRecorder(merger.result, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(
      e
    )}`;
    return;
  }

  console.log(
    'Created MediaRecorder',
    mediaRecorder,
    'with options',
    options
  );

  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
    downloadFile();
    isRecording = false;
    merger.destroy();
  };

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
};

// stop recording
function stopRecording() {
  document.getElementById('iconRecord').className = 'fa fa-circle';
  document.getElementById('recordLabel').innerText =
    'Start Recording';
  mediaRecorder.stop();
}

// file download
function downloadFile() {
  //Download file
  const blob = new Blob(recordedBlobs, { type: 'video/webm' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  var datetime = new Date();

  a.download = datetime + 'Session.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

let divSelectConnectionId = document.getElementById("select");
let divconsultingRoom = document.getElementById("consultingRoom");

let inputconnectionId = document.getElementById("connectionId");
let btnConnectToId = document.getElementById("connectToId");

let localVideo = document.getElementById("localVideo");
let remoteVideo = document.getElementById("remoteVideo");

// eslint-disable-next-line
let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

const iceServers = {
  iceServer: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

const streamConstraints = {
  audio: true,
  video: true
};

// eslint-disable-next-line
const socket = io();

btnConnectToId.onclick = () => {
  if (inputconnectionId.value === "") {
    alert("itroducce algo  para la conexion");
  } else {
    // navigator.mediaDevices
    //   .getUserMedia(streamConstraints)
    //   .then((stream) => {
    //     localStream = stream;
    //     localVideo.srcObject = stream;
    //   })
    //   .catch((err) => console.log(err));

    roomNumber = inputconnectionId.value;

    socket.emit("create or join", roomNumber);

    divSelectConnectionId.style = "display: none";
    divconsultingRoom.style = "diplay: block";
  }
};

socket.on("created", room => {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then(stream => {
      console.log("created", stream);
      localStream = stream;
      localVideo.srcObject = stream;
      isCaller = true;
    })
    .catch(err => console.log(err));
});

socket.on("joined", room => {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then(stream => {
      console.log("video local", stream);
      localStream = stream;
      socket.emit("ready", roomNumber);
    })
    .catch(err => console.log(err));
});

socket.on("ready", () => {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection
      .createOffer()
      .then(sessionDescription => {
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("offer", {
          type: "offer",
          sdp: sessionDescription,
          room: roomNumber
        });
      })
      .catch(err => console.log(err));
  }
});

socket.on("offer", event => {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    rtcPeerConnection
      .createAnswer()
      .then(sessionDescription => {
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("answer", {
          type: "answer",
          sdp: sessionDescription,
          room: roomNumber
        });
      })
      .catch(err => console.log(err));
  }
});

socket.on("answer", event => {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on("candidate", event => {
  const candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate
  });
  rtcPeerConnection.addIceCandidate(candidate);
});

function onAddStream(event) {
  console.log("video remoto", event.streams[0]);
  remoteStream = event.streams[0];
  remoteVideo.srcObject = event.streams[0];
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log("send ice candidate", event.candidate);
    socket.emit("candidate", {
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber
    });
  }
}

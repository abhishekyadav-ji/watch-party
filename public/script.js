const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peer;

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

function createPeer() {
  peer = new RTCPeerConnection(config);

  peer.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };
}

async function shareScreen() {
  const video = document.getElementById("video");

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.error("Error sharing screen:", err);
  }
}


  localVideo.srcObject = localStream;

  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("offer", offer);
}

socket.on("offer", async (offer) => {
  createPeer();

  await peer.setRemoteDescription(offer);

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
  await peer.setRemoteDescription(answer);
});

socket.on("ice-candidate", async (candidate) => {
  try {
    await peer.addIceCandidate(candidate);
  } catch (err) {
    console.error(err);
  }
});

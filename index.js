const express = require("express");

const app = express();

let http = require("http").Server(app);

let io = require("socket.io")(http);

app.use(express.static("public"));

http.listen(8080, () => {
  console.log("listening on 8080");
});

io.on("connection", socket => {
  console.log("a user is connected");

  socket.on("create or join", room => {
    console.log("crea or join to room ", room);
    const myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
    const numClients = myRoom.length;
    console.log(room, "has", numClients);

    if (numClients === 0) {
      socket.join(room);
      socket.emit("created", room);
    } else if (numClients === 1) {
      socket.join(room);
      socket.emit("joined", room);
    } else {
      socket.emit("full", room);
    }
  });

  socket.on("ready", room => {
    socket.broadcast.to(room).emit("ready");
  });

  socket.on("candidate", event => {
    socket.broadcast.to(event.room).emit("candiadate", event);
  });

  socket.on("offer", event => {
    socket.broadcast.to(event.room).emit("offer", event.sdp);
  });

  socket.on("answer", event => {
    socket.broadcast.to(event.rom).emit("answer", event.sdp);
  });
});

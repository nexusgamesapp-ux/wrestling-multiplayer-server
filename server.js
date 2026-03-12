const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

io.on("connection", socket => {
  console.log("Player connected:", socket.id);

  socket.on("joinRoom", roomId => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: {}, state: {} };
    }

    const room = rooms[roomId];
    const slot = Object.keys(room.players).length === 0 ? "p1" : "p2";
    room.players[slot] = socket.id;

    socket.join(roomId);
    socket.emit("assignedSlot", slot);

    io.to(roomId).emit("playerList", room.players);
  });

  socket.on("playerUpdate", data => {
    const { roomId, slot, state } = data;
    if (rooms[roomId]) {
      rooms[roomId].state[slot] = state;
      socket.to(roomId).emit("opponentUpdate", { slot, state });
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      for (const slot in room.players) {
        if (room.players[slot] === socket.id) {
          delete room.players[slot];
          delete room.state[slot];
          io.to(roomId).emit("playerList", room.players);
        }
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Multiplayer server running on port 3000");
});

const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const PORT = process.env.PORT || 5000



const users = {}
io.on('connection', socket => {
    if (!users[socket.id]) {
        users[socket.id] = socket.id
    }
    // emait al existing user to   new user 
    io.sockets.emit('allUsers', users)
    //pushes data to client side
    socket.emit('yourID', { id: socket.id })
    // the on function for handle a emit
    socket.on('callUser', data => { //
        // we got 3 informmation 
        // 1 .user to call 
        // 2. from , ( call comming from where )
        // 3. data ( Video)
        io.to(data.userToCall).emit('hey',{signal:data.signalData,from:data.from})
    })
    socket.on('acceptCall',data=>{
        io.to(data.to).emit('callAccepted',data.signal)
    })

    socket.on('disconnect', () => {
        delete users[socket.id]
        socket.broadcast.emit('allUsers', users)
    })
})

server.listen(PORT, () => {
    console.log('Server running  on  port : ', PORT)
})

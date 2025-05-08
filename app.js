// import the express library
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

// create an express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
});

console.log(io);

// define a route for the home page
app.get('/', (req, res) => {
    //res.send('sup bitch');
    res.sendFile(join(__dirname, 'index.html'));
});

//app.get('/socket.io/socket.io.js', (req, res) => {
//  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
//});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat message', (msg, msg2) => {
        io.emit('chat message', msg);
        //console.log(msg2);
        socket.broadcast.emit('chat message', msg);
        console.log('message: ' + msg);
    });
});

io.engine.on("connection_error", (err) => {
    console.log(err.req);
    console.log(err.code);
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
});

// have the server listen on specified port
server.listen(3000, () => {
    console.log("server is running on http://localhost:3000");
});



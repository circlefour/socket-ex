// import the express library
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// to await setup tasks before starting the server
async function main() {
    // open database file
    const db = await open({
        filename: 'chat.db',
        driver: sqlite3.Database
    });

    // create our 'messages' table (you can ignore the 'client_offset' column for now)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_offset TEXT UNIQUE,
            content TEXT
        );
    `);

    // create an express app
    const app = express();
    const server = createServer(app);
    const io = new Server(server, {
        connectionStateRecovery: {}
    });
    
    // define a route for the home page
    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, 'index.html'));
    });
    
    io.on('connection', async (socket) => {
        console.log('a user connected');
        socket.on('chat message', async (msg) => {
            let result;
            try {
                // store the message in the database
                result = await db.run ('INSERT INTO messages (content) VALUES (?)', msg);
            } catch (e) {
                // TODO: handle failure
                console.error('Failed to insert message:', e);
                return;
            }
            // include the offset with the message
            io.emit('chat message', msg, result.lastID);
        });
    
        if (!socket.recovered) {
            // if the connection state recovery was not successful
            try {
                await db.each('SELECT id, content FROM messages WHERE id > ?',
                    [socket.handshake.auth.serverOffset || 0],
                    (_err, row) => {
                        socket.emit('chat message', row.content, row.id);
                    }
                )
            } catch (e) {
                // something went wrong
            }
        }
    });
    
    io.engine.on("connection_error", (err) => {
        console.log(err.req);
        console.log(err.code);
        console.log(err.message);  // the error message, for example "Session ID unknown"
        console.log(err.context);  // some additional error context
    });
    
    // have the server listen on specified port
    // server.listen instead of app.listen because socket.io needs to attach itself to a raw http port, not express
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`server is running on ${PORT}`);
    });
}

//main();

main().catch((err) => {
  console.error('❌ Failed to start:', err);
});


var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed =[];
var currentRoom = {};

exports.listen = function(server){
    io=socketio.listen(server);
    io.set('log level', 1); //Start the Socket.io server, allowing it to piggyback on the existing HTTP server
    io.sockets.on('connection', function (socket) { //Define how each user connection will be handled
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed); //Assign user a guest name when they connect
        joinRoom(socket, 'Lobby'); //Place user in the "Lobby" room when they connect
        handleMessageBroadcasting(socket, nickNames); //Handle user messages, name change attempts, and room creation/changes.
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms', function () { //Provide user with a list of occupied rooms on request.
            socket.emit('room', io.sockets.manager.rooms);
        });
        handleClientDisconnection(socket,nickNames,namesUsed); //Define "cleanup" logic for when a user disconnects
    })
};
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResults', {
        success : true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
};
function joinRoom(socket, room){
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult',{room:room});
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id] + ' has joined ' + room + '.'
    });
    var userInRoom = io.sockets.clients(room);
    if(usersInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for (var index in userInRoom) {
            var userSocketId = userInRoom[index].id;
            if (userSocketId != socketio) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary});
    }
}
const socketio = require('socket.io');
let io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

const assignGuestName = function(socket, guestNumber, nickNames, namesUsed){
    let name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success:true,
        name:name
    });
    namesUsed.push(name);
    return guestNumber + 1;
};

const joinRoom = function(socket, room){
  socket.join(room);
    currentRoom['socket.id'] = room;
    socket.emit('joinResult',{room : room});
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id] + ' has joined ' + room + '.'
    });
    let usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length>1){
        let usersInRomSummary = `Users currently in ${room} :`;
        for(let index of usersInRoom.keys()){
            let userSocketId = usersInRoom[index].id;
            if(userSocketId !== socket.id){
                if(index > 0){
                    usersInRomSummary += ', '
                }
                usersInRomSummary += nickNames[userSocketId];
            }
        }
        usersInRomSummary += '.';
        socket.emit('message',{text: usersInRomSummary});
    }
};

const handleMessageBroadcasting = function(socket, nickNames){
    socket.on("message",function(message){
        socket.broadcast.to(message.room).emit("message",{
            text:`${nickNames[socket.id]}: ${message.text}`
        });
    });
};

const handleNameChangeAttempts = function(socket, nickNames, namesUsed){
    socket.on("nameAttempt",function(name){
        if(name.startsWith('Guest')){
            socket.emit('nameResult',{
                success:false,
                message:'Names cannot begin with "Guest".'
            })
        }else{
            if(namesUsed.includes(name)){
                socket.emit('nameResult',{
                    success:false,
                    message:'That name is already in use'
                })
            }else{
                let previousName = nickNames[socket.id];
                let previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success:true,
                    name:name
                });

                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:`${previousName} is now known as ${name}. `
                })
            }
        }
    })
};

const handleRoomJoining = function(socket){
    socket.on('join',function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    });
};
const handleClientDisconnection = function(socket){
    socket.on('disconnect',function(){
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })
};


exports.listen = function(server){
  io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function(socket){
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
        joinRoom(socket, 'Lobby');
        
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms',function(){
            socket.emit('rooms',io.sockets.manager.rooms);
        });
        
        handleClientDisconnection(socket, nickNames, namesUsed);
    })
};
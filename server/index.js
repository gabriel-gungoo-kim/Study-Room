const express = require("express");   
const socketio = require("socket.io"); 
const http = require("http");

const app = express(); 
const server = http.createServer(app);
const io = socketio(server); 

const { addUser,removeUser,getUser,getUsersInRoom } = require("./controllers/userController"); 
io.on('connection', socket => { 

    socket.on('join',({name,room},callBack)=>{ 

        const user = addUser({id:socket.id,name,room});  //destructuring the object 
        if(user.error) return callBack(user.error); 
        socket.join(user.room) //joins a user in a room 
        socket.emit('message',{user:'admin', text:`Welcome ${user.name} in room ${user.room}.`}); //send to user
        socket.broadcast.to(user.room).emit('message',{user:'admin', text:`${user.name} has joined the room`}); //sends message to all users in room except this user
        io.to(user.room).emit('usersOnline', { room: user.room, users: getUsersInRoom(user.room) });
        callBack(); // passing no errors to frontend for now 
    }); 

    socket.on('user-message',(message,callBack)=>{ //receive an message with eventName user-message 
        const user = getUser(socket.id); 
        io.to(user.room).emit('message',{user:user.name, text:message }); //send this message to the room 
        
        callBack(); 
    }); 

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) { 
            io.to(user.room).emit('message',{user:'admin', text:`${user.name} left the chat` }); //send this message to the room 
            io.to(user.room).emit('usersOnline', { room: user.room, users: getUsersInRoom(user.room) });
        }
        //console.log("User left"); 
    });
    

});

const router = require("./controllers/chatController");
app.use(router); 

const PORT = process.env.PORT || 5000; 
server.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`); 
})


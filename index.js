var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
const path = 'messages.json'
var messages = [];
if(fs.existsSync(path)){
  fs.readFile(path, function read(err,data){
    if (err){
      throw err;
    }
    try{
      messages = JSON.parse(data);
    }catch(exception){
    }
  })
}

var conClients = new Set();
io.on('connection', (socket) => {
    socket.on('chat message', (msg, uName) => {
      socket.broadcast.emit('chat message', msg, uName); 
      addMsg(uName, msg);
    });
    socket.on('login', (uName) => {
      let check = false
      conClients.forEach((user) => {
        if (user.un === uName) {
          check = true;
        }
      });
      if(check === false){
        let loginStr = uName + ' logged in' 
        console.log(loginStr);
        socket.broadcast.emit('login message',loginStr)
        socket.emit('init msg',messages)
        addMsg('System',loginStr)
        conClients.add({id: socket.id, un: uName});
      }
      socket.emit('checkLogin',check)
    });
    socket.on('disconnect', () => {
      let logoutStr = '';
      conClients.forEach((user) => {
        if (user.id === socket.id) {
          logoutStr = user.un + ' logged out!'
          console.log(logoutStr);
          socket.broadcast.emit('login message',logoutStr)
          addMsg('System',logoutStr)
          conClients.delete(user);
        }
      });
    });
}); 

http.listen(3033, () => {
  console.log('listening on *:3033');
});

function addMsg(pUsername, pMsg){
  messages.push({
    username: pUsername,
    message: pMsg
  });
  saveChat(messages);
}

function saveChat(data){
  let jsonData = JSON.stringify(data);
  fs.writeFile('messages.json',jsonData,function(err){
    if(err){
      console.log(err);
    }
  })
}
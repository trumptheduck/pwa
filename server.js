const express = require('express');
const app = express()
const http = require('http').Server(app);
const path = require("path")
const io = require('socket.io')(http);
const httpPort = 80
let users = [
  {
    username: 'nhatyt123',
    hash: {
      salt: 'b76b1eb31e8a',
      hashedpassword: '10c17d561254b5184fbd5ccb397aae868b3c08fdc83c3f932858902c14c96fb4949ba75147624472abce3872202f6d185d55fb7841018c6d8f8c09089f11b3d6'
    },
    data: [
      {
        target: "hanghang1323",
        updated: false,
        status: "read",
        message: [
          {
            remote: true,
            data: "a"
          }
        ]
      }
    ]
  },
  {
    username: 'hanghang1323',
    hash: {
      salt: '508e3aa25307',
      hashedpassword: '4edf780571ef9946adfca6f9a3643384df1c2111bc8c8a3f459a216226d6bd9759def568cbedf96f14d3569b2fd7f389a43ce1ff2ef0300c43fab2deaad19df6'
    },
    data: [
      {
        target: "nhatyt123",
        updated: false,
        status: "read",
        message: [
          {
            remote: false,
            data: "a"
          }
        ]
      }
    ]
  },
];


//Password hash
let crypto = require('crypto');
// logger 
let logger = func => {
    console.log(func);
};
let generateSalt = rounds => {
    if (rounds >= 15) {
        throw new Error(`${rounds} is greater than 15,Must be less that 15`);
    }
    if (typeof rounds !== 'number') {
        throw new Error('rounds param must be a number');
    }
    if (rounds == null) {
        rounds = 12;
    }
    return crypto.randomBytes(Math.ceil(rounds / 2)).toString('hex').slice(0, rounds);
};
let hasher = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return {
        salt: salt,
        hashedpassword: value
    };
};
let hash = (password, salt) => {
    if (password == null || salt == null) {
        throw new Error('Must Provide Password and salt values');
    }
    if (typeof password !== 'string' || typeof salt !== 'string') {
        throw new Error('password must be a string and salt must either be a salt string or a number of rounds');
    }
    return hasher(password, salt);
};
let compare = (password, hash) => {
    if (password == null || hash == null) {
        throw new Error('password and hash is required to compare');
    }
    if (typeof password !== 'string' || typeof hash !== 'object') {
        throw new Error('password must be a String and hash must be an Object');
    }
    let passwordData = hasher(password, hash.salt);
    if (passwordData.hashedpassword === hash.hashedpassword) {
        return true;
    }
    return false
};
let makeid = (length) => {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
//End of password hash
const AccountManager = {
  newAccount(username,password) {
    let accountExisted = users.find(user => user.username === username)
    if (accountExisted!==undefined) {
      console.log("Username taken!")
    } else {
      users.push({
        username : username,
        hash : hash(password,generateSalt(12)),
        data : []
    });
    console.log(`Account: ${username} has been created!`)
    console.log('Users:',users)
    }
  },
  deleteAccount(username) {
      users = users.filter(user => user.username === username);
      console.log(`Account: ${username} is deleted!`)
      console.log('Users:',users)
  }
}
io.on('connection',(socket)=>{
  console.log("A connection has been established!")
  socket.on('login',(credentials) => {
      let user = users.find(user => user.username === credentials.username)
      if (user === undefined) {
          socket.emit('loginState',"Tên đăng nhập không chính xác!")
          console.log("!!FAILED LOGIN ATTEMPT!!:", credentials.username)
      } else {
          if (!compare(credentials.password,user.hash)) {
              socket.emit('loginState',"Sai mật khẩu!")
              console.log("!!FAILED LOGIN ATTEMPT!!:", credentials.username)
          } else {
              socket.emit('loginState',true)
              console.log(`User ${user.username} is online!`)
              socket.on('deleteAccount',()=>{
                  AccountManager.deleteAccount(user.username)
              })
              socket.on('requestServerData',() => {
                socket.emit("serverDataResponse", user.data)
              })
              socket.on('sendMessage',(msg)=>{
                console.log(msg,user.username)
                let targetedRoomLocal = user.data.find(room => room.target === msg.target)
                if (targetedRoomLocal == undefined) {
                  console.log("Local Undefined!")
                } else {
                  targetedRoomLocal.message.push({
                    remote : false,
                    data: msg.data
                  })
                  targetedRoomLocal.updated = false;
                }
                let targetedRoomRemote = users.find(targetedUser => targetedUser.username === msg.target).data.find(room => room.target === user.username)
                if (targetedRoomRemote == undefined) {
                  console.log("Remote Undefined")
                } else {
                  targetedRoomRemote.message.push({
                    remote : true,
                    data: msg.data
                  })
                  targetedRoomRemote.updated = false;
                }
                console.log(targetedRoomLocal)
                console.log(targetedRoomRemote)
              })
              let checkDataChanges = () => {
                user.data.every(room => {
                  if (!room.updated) {
                    socket.emit("serverDataUpdate", user.data);
                    user.data.forEach(element => {
                      element.updated = true;
                    })
                    return false;
                  } else {return true};
                })
              }  
              let dataChecker = setInterval(checkDataChanges,500);
              dataChecker;
              socket.on('disconnect', ()=>{
                clearInterval(dataChecker)
              })
          }
      }
  })
  socket.on('new-account', (credentials)=>{
      let user = users.find(user => user.username = credentials.username)
      if (user === undefined) {
          AccountManager.newAccount(credentials.username,credentials.password)
          socket.emit('loginState',"Account created successfully")
      } else {
          console.log("Username already existed!")
          socket.emit('loginState',"Username already existed!")
      }
      
  })
})

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'))
})
app.get('/devices', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/messenger.html'))
})
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/test.html'))
})

http.listen(httpPort, function () {
  console.log(`Listening on port ${httpPort}!`)
})
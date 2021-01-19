const express = require('express');
const app = express()
const http = require('http').Server(app);
const path = require("path")
const io = require('socket.io')(http);
const httpPort = 80
let users = [
  {
    username: 'asdadasdad',
    hash: {
      salt: 'b4126723ab33',
      hashedpassword: '18582e7d6706eb3905faf71e318b2f87ffbdd00ca1dbeb603fdc151d5902059e8ddbc3d7b82a1c21d92825ab99b46ddb2d736b0b6483e3bc448a321fd396b54c'
    },
    apikey: 'IkQOpkyfdNYAfLv5sEN8RIf2veQnSjEN'
  }
];
const data = [
  {
    apikey: 'IkQOpkyfdNYAfLv5sEN8RIf2veQnSjEN',
    data: [
      {
        username: "nhatyt123",
        status: "read",
        message:[
          {
            remote: false,
            data: "sdjadiygdauyf8uaydafd8"
          },
          {
            remote: false,
            data: "sdjadiygdauyf8uaydafd8"
          },
          {
            remote: true,
            data: "sdjadiygdauyf8uaydafd8"
          },
          {
            remote: false,
            data: "sdjadiygdauyf8uaydafd8"
          },
          {
            remote: true,
            data: "sdjadiygdauyf8uaydafd8"
          },
          {
            remote: false,
            data: "sdjadiygdauyf8uaydafd8"
          },

        ]
      }
    ]
  }
]

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
logger(generateSalt(12))
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
logger(hash('nhat1234', generateSalt(12)))
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
        apikey: makeid(32)
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
      let user = users.find(user => user.username = credentials.username)
      if (user === undefined) {
          socket.emit('loginState',"Username Invalid!")
          console.log()
      } else {
          if (!compare(credentials.password,user.hash)) {
              socket.emit('loginState',"Password Incorrect!")
          } else {
              socket.emit('loginState',true)
              console.log(`User ${user.username} is online!`)
              let userData = data.find(repo => repo.apikey === user.apikey)
              socket.emit('systemData', userData )
              socket.on('deleteAccount',()=>{
                  AccountManager.deleteAccount(user.username)
              })
              socket.on('requestServerData',() => {
                socket.emit("serverDataResponse", userData.data)
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
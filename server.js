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
    apiKey: "ylcVoPjZzKUeCuQWXsgkTNtyqkmGSWKi7zLypYBcFrixOs0YoM3YUHYIhvnCltvB",
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
var devices = [
  {
    apiKey: "ylcVoPjZzKUeCuQWXsgkTNtyqkmGSWKi7zLypYBcFrixOs0YoM3YUHYIhvnCltvB",
    data :[
      {
        name: "ledArray",
        stateList: [
          "000.",
          "000/,111.",
          "100/,010/,001/,010.",
          "000/,000/,001/,010/,100/,100/,101/,110/,110/,111/,111.",
        ],
        state: "000.",
        delay: 100,
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
const StateData = {
    stateDataVerifier(input) {
      if (typeof(input) !== "string") {
          //console.error(`Input is not a string!`);
          return `Input is not a string!`;
      }
      var letters = /^[01/.,]+$/
      if (input.match(letters) === null) {
          //console.error(`Only "0" "1" "/" "," "." are allowed!`);
          return `Only "0" "1" "/" "," "." are allowed!`;
      }
      var counter = 0;
      for(let i = 0; i < input.length -1;i++) {
          if (input[i] === '.') {
              //.error('Illegal end "." symbol at char: ',i+1);
              return `Illegal end "." symbol at char: ${i + 1}`;
              break;             
          }
          if (input[i] === "0"||input[i] === "1") {
            counter++
          }
      }
      if (counter <= 0) {
        //console.error('No digital state value found');
        return 'No digital state value found';
      }
      if (input[input.length-1]!=='.') {
          //console.error(`"." expexted at the end of the script!`);
          return `"." expexted at the end of the script!`;
      } else {
          var tokens = [];
          var childToken = '';
          for (let i = 0; i < input.length;i++) {
              if (i === (input.length-1)) {
                  childToken += input[i];
                  tokens.push(childToken);
                  childToken = ''
              } else {
                  if (input[i] !== ',') {
                  childToken += input[i];
                  } else {
                      tokens.push(childToken);
                      childToken = ''
                  }
              } 
          }
          var tokenFixedLength = tokens[0].length;
          for (let i = 0; i < tokens.length; i++) {
              if (tokens[i].length !== tokenFixedLength) {
                  //console.error("Each token must be the same length: ",`${tokens[i]} at token ${i}`);
                  return `Each token must be the same length: ${tokens[i]} at token ${i}`;
                  break;
              }
          };
          for (let i = 0; i < tokens.length; i++) {
            for (let j = 0;j< tokens[i].length-1; j++) {
              if (tokens[i][j] === '/') {
                  //console.error("Illegal break symbol: ",`${tokens[i]} at token ${i}`)
                  return `Illegal break symbol: ${tokens[i]} at token ${i}`;  
                  break;
              }
            }
              if (i !== (tokens.length-1)) {
                  if(tokens[i][tokens[i].length-1] !== '/') {
                     // console.error("Break symbol expected: ",`${tokens[i]} at token ${i}`)
                      return `Break symbol expected: ${tokens[i]} at token ${i}`;  
                      break;
                  }
              }
          }
          return true;
      }
  }
}
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
              socket.on('getDevicesData',()=>{
               socket.emit('pushDevicesData',devices.find(device => device.apiKey === user.apiKey).data)
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
              socket.on('cycleDeviceState',(deviceName)=> {
                let repo = devices.find(device => device.apiKey === user.apiKey).data
                let device = repo.find(device => device.name === deviceName)
                if (device.stateList.indexOf(device.state)+2>device.stateList.length) {
                  var nextState = device.stateList[0];
                } else {
                  var nextState = device.stateList[device.stateList.indexOf(device.state)+1]
                }
                device.state = nextState
                socket.emit('pushDevicesData',devices.find(device => device.apiKey === user.apiKey).data)
              });
              socket.on('changeDeviceState',(data) => {
                var verifierMessage = StateData.stateDataVerifier(data.state)
                if( verifierMessage === true) {
                  let repo = devices.find(device => device.apiKey === user.apiKey).data
                  let device = repo.find(device => device.name === data.name)
                  device.state = data.state
                  socket.emit('pushDevicesData',devices.find(device => device.apiKey === user.apiKey).data)
                } else {
                  socket.emit('deviceStateError',verifierMessage)
                }
              })
              socket.on('changeDeviceDelay',(data)=> {
                if (data.delay <= 49) {
                  socket.emit('deviceStateError',"Invalid delay value!");
                } else {
                  let repo = devices.find(device => device.apiKey === user.apiKey).data
                  let device = repo.find(device => device.name === data.name)
                  device.delay = data.delay;
                  socket.emit('pushDevicesData',devices.find(device => device.apiKey === user.apiKey).data)
                }

              })
              let dataChecker = setInterval(checkDataChanges,500);
              dataChecker;
              socket.on('disconnect', ()=>{
                clearInterval(dataChecker)
              })
          }
      }
  })
  socket.on('new-account', (credentials)=>{
      let user = users.find(user => user.username === credentials.username)
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
  res.sendFile(path.join(__dirname, 'public/push/index.html'))
})
app.get('/api/get/?:apiKey/?:device/?:query',(req,res)=>{
  if (req.params?.apiKey !== undefined) {
    var repo = devices.find(device => device.apiKey === req.params.apiKey)
    if (repo?.apiKey !== undefined) {
      var device = repo.data.find(device => device.name === req.params.device)
      if (device?.name !== undefined) {
        switch (req.params?.query) {
          case 'state':
            res.send(device.state)
          break;
          case 'delay':
            res.send(device.delay.toString())
          break;
          default:
           res.send("ERR: INVALID_QUERY")
           res.status(204);
           ;
        }
      } else {
        res.status(203)
        res.send('ERR: DEVICE_NAME_NOT_FOUND')
      }
    } else {
      res.status(202)
      res.send('ERR: INVALID_API_KEY')
    }
  } else {
    res.status(201)
    res.send('ERR: INVALID_API_KEY')
  }
})
http.listen(httpPort, function () {
  console.log(`Listening on port ${httpPort}!`)
})
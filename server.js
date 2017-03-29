const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const chatServer = require('./lib/chat_server');

let cache = {};

const send404 = function(res){
    res.writeHead(404,{'Content-Type':'text/plain'});
    res.end('Error  404: response not found.');
};


const sendFile = function(res, filePath, fileContents){
    res.writeHead(
        200,
        {
            'Content-Type': mime.lookup( path.basename(filePath) )
        }
    );
    res.end(fileContents);
};

const fileExistP = function(filePath){
  return new Promise(function(re,rj){
      fs.stat(filePath,(e,stats)=>{
          if(stats && stats.isFile()){
              re();
          }else{
              rj('file is not exist!');
          }
      })
  })
};

const readFileP = function(filePath){
    return new Promise(function(re,rj){
        console.log(filePath)
        fs.readFile(filePath,(e,data)=>{
            if(e){
                rj('read file error!')
            }else{
                re(data);
            }
        })
    })
};

const serverStatic = function(res, cache, absPath){
    if(cache[absPath]){
        sendFile(res, absPath, cache[absPath]);
    }else{
        fileExistP(absPath).then(function(){
            return readFileP(absPath);
        }).then(function(data){
            cache[absPath] = data;
            sendFile(res, absPath, data);
        }).catch(function(e){
            console.log(e)
            send404(res);
        })
    }
};

const server = http.createServer(function(req,res){
   let filePath,
       absPath;
    if(req.url === '/'){
        filePath = 'public/index.html';
    }else{
        filePath = 'public' + req.url;
    }

    absPath = './' + filePath;
    serverStatic(res,cache,absPath);

});

server.listen(3000,function(){
    console.log("server listening on port 3000")
});



chatServer.listen(server);
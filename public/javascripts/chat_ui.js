var divEscapedContentElement =  function(message){
  return $('<div></div>').text(message);
};

var divSystemContentElement = function(message){
    return $('<div></div>').html('<i>'+message + '</i>');
};

var processUserInput = function(chatApp,socket){
    var message = $('#send-message').val();
    var systemMessage;
    if(message.charAt(0) === '/'){
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $('#message').append(divSystemContentElement(systemMessage));
        }
    }else{
        chatApp.sendMessage($('#room').text(),message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('message').prop('scrollHeight'));
    }

    $('#send-message').val('');
};


var socket = io.connect();

$(function(){

    var chatApp = new Chat(socket);
    socket.on('nameResult', function(r){
        var message;
        if(r.success){
            message = 'You are now known as ' + r.name + ' .';
        }else{
            message =  r.message;
        }

        $('#messages').append(divSystemContentElement(message));
    });


    socket.on('joinResult', function(r){
        $('#room').text(r.room);
        $('#message').append(divSystemContentElement('Room changed.'));
    });

    socket.on('message',function(r){
        var newElements = $('<div></div>').text(r.text);
        $('#messages').append(newElements);
    });

    socket.on('rooms',function(rooms){
       $('#room-list').empty();
        for(var room in rooms){
            room = room.substring(1,room.length);
            if(room != ''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').click(function(){
            chatApp.processCommand('/join '+ $(this).text());
            $('send-message').focus();
        })

    });
    
    setInterval(function(){
        socket.emit('rooms');
    },1000);
    
    $('#send-message').focus();
    
    $('#send-form').submit(function(){
        processUserInput(chatApp, socket);
        return false;
    })
});
var net = require('net');

var server = net.createServer(function(socket) {
    console.log('server > starting');
    socket.write('Echo server ');
    
    //socket.pipe(socket);

    socket.on('data', function(data){
        console.log('Serve > Received: '+ data);
    });
    socket.on('error', function(error) {
        console.log('server > gets error: ', error);
    });
    socket.on('end', function() {
        console.log('server > end');
    });
});

server.listen(1348, '127.0.0.1');
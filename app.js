/*
this is my server test!
let see if our linode updates
*/
// server.js
var http = require('http')
, nko = require('nko')('1QyupeJT3MVzJOLf');

//slug nogrammars secret 1QyupeJT3MVzJOLf

var app = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Hello, World woooo');
});

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000);
console.log('Listening on ' + app.address().port);

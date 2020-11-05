var http = require('http');
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');
const { Db } = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/WebsiteContact";


http.createServer(function(req, res){

    if(req.url === "/"){
        fs.readFile("./index.html", "UTF-8", function (err, html){
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(html);
        });
    }
    if(req.url === "/index.html"){
        fs.readFile("./index.html", "UTF-8", function (err, html){
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(html);
        });
    }
    if(req.url === "/indexTracker.html"){
        fs.readFile("./indexTracker.html", "UTF-8", function (err, html){
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(html);
        });
    }
    if(req.url === "/indexContact.html"){
        res.writeHead(200, {"Content-Type": "text/html"});
        fs.createReadStream("./indexContact.html","UTF-8").pipe(res);
    }
    if(req.url === "/indexMapBox.html"){
        fs.readFile("./indexMapBox.html", "UTF-8", function (err, html){
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(html);
        });
    }
    if(req.method === "POST"){
        var data = "";
        req.on("data", function(chunck){
            data += chunck;
        });
        req.on("end", function(chunck){
            
            MongoClient.connect(url, function(err, db){
                if(err) throw err;

                var q = querystring.parse(data);
                db.collection('ContactInfo').insertOne(q, function(err, res){
                    if(err) throw err;

                    console.log("Data Inserted Successfully");
                    db.close();
                })

            })
        });
    }
    if(req.url.match("\.css$")){
        var cssPath = path.join(__dirname, req.url);
        var fileStream = fs.createReadStream(cssPath, "UTF-8");
        res.writeHead(200, {"Content-Type": "text/css"});
        fileStream.pipe(res);
    }
    if(req.url.match("\.js$")){
        var jsPath = path.join(__dirname, req.url);
        var fileStream = fs.createReadStream(jsPath, "UTF-8");
        res.writeHead(200, {"Content-Type": "text/js"});
        fileStream.pipe(res);
    }
    if(req.url.match("\.png$")){
        var imgPath = path.join(__dirname, req.url);
        var fileStream = fs.createReadStream(imgPath);
        res.writeHead(200, {"Content-Type": "image/png"});
        fileStream.pipe(res);
    }
    // else{
    //     res.writeHead(404, {"Content-Type": "text/html"});
    //     res.end("NO PAGE FOUND");
    // }
}).listen(3000);

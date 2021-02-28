const http = require('http');
const fs = require('fs');
const qs = require("querystring");
const path = require("path");
const ejs = require("ejs");
const marked = require("marked");
const mariadb = require("mariadb/callback");

const db = require("./mariadb.js");
config = require("./config.js");

const paths = {
    "/": "/index.html",
    "/info": "/info.html",
    "/md": "/test.md"
}



const requestListener = function (request, response) {
    console.log(request.url);
    let url = new URL(request.url,"http://127.0.0.1:8080");
    let pathname = url.pathname;
    let dirname = "";
    let contentType = "";
    console.log("Requested:", pathname);
    console.log("Type: ", request.method)

    if (request.method == "GET") {

        if (pathname in paths) {
            pathname = paths[pathname];
        }
        let extension = path.extname(pathname.substring(1));
        if (extension == ""){extension=".html";pathname+=extension};
        console.log("Extension",extension);
        console.log("Serving:", pathname.substring(1))

        if (extension== ".html"){
            dirname = "./cache/"+pathname.substring(1);
            contentType = "text/html; charset=UTF-8"
            if (!fs.existsSync(dirname)){
                renderPage(pathname.substring(1));
            }
        }
        else if (extension == ".css"){
            dirname = pathname.substring(1)
            contentType = "text/css; charset=UTF-8";
        }
        else {
            dirname = pathname.substring(1)
            contentType = "";
        }
        
        fs.readFile(dirname, (error, data) => {
            if (error) {
                
                console.error(error);
                response.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
                response.write('404 - File Not Found :(');
                response.end();
            }
            else {
    
                response.writeHead(200, { 'Content-Type': contentType });

                response.write(data.toString());
                
                console.log("Success");
            }
            response.end();
            
        })

    }
    else if (request.method == "POST") {
        //1
        request.on("data",function(data) {
            //4
            let result = qs.parse(data.toString());
            console.log(result);
        });
        //2
        request.on("end",function(){
            //5
            response.end();
        });
        //3

    }
    //never executes
}

function renderPage(pathname) {
    let html = "This Page is empty. Maybe it didn't render?";
    let name =pathname.split(".")[0];
    let subpath = path.dirname(name);
    let ejspath = "./sites/"+name +".ejs";
    console.log("rendering ./sites/"+name +".ejs")

    if (name.startsWith("articles/")){
        let dbdata = renderBlogPage(name.replace("articles/",""));
        if(dbdata !== false){
            let bloghtml = dbdata["html"];
            let heading = dbdata["heading"];
            ejspath = "./sites/articles.ejs";
        }
    }
    try {
        let contents =fs.readFileSync(ejspath);
        html = ejs.render(contents.toString(),null,{filename: ejspath});//{views:["./"]});
    }
    catch (error) {
        console.error(error);
        return false;
    }

    if(!fs.existsSync("./cache/"+subpath)){
        try{
            fs.mkdirSync("./cache/"+subpath,{"recursive":true});
        }
        catch(err){
            console.log("Couldnt Create Cache Directory:",err);
            return false;
        }
    }
    fs.writeFile("./cache/"+name+".html",html,(error)=>{
        if (error){
            console.error(error);
            return false;
        }
    });
    return true;
}

function renderBlogPage(blogEntry) {
    let content = "";
    let author = "";
    let heading = "";
    console.log("test")
    db.pool.query("select * from BlogEntries where url=(?);",[blogEntry],(err,rows,meta)=>{
        console.log("inside")
        if (err){
            console.log(err.message);
        }
        else{
            console.log(rows.length);
            if (rows.length== 1){
                content=rows[0]["content"];
                author = rows[0]["author"];
                heading = rows[0]["heading"];
                
            }
            else{
                console.log("DB Error: got weird amount of rows")
                return false;
            }
        }
    });
    return {html:marked(content),author: author,heading:heading};
}

const server = http.createServer(requestListener);
server.listen(config.port);
// OLD not used anymore
const http = require('http');
const fs = require('fs');
const qs = require("querystring");
const path = require("path");
const ejs = require("ejs");
const marked = require("marked");
const mariadb = require("mariadb/callback");
const util = require("util")

const db = require("./mariadb.js");
const config = require("./config.js");

const paths = {
    "": "index.html",
    "info": "info.html",
    "md": "test.md"
}

db.pool.query = util.promisify(db.pool.query);

const requestListener = function (request, response) {
    console.log(request.url);
    let url = new URL(request.url,"http://127.0.0.1:8080");
    let pathname = url.pathname.substring(1);
    let dirname = "";
    let contentType = "";
    console.log("Requested:", pathname);
    console.log("Type: ", request.method)

    if (request.method == "GET") {

        if (pathname in paths) {
            pathname = paths[pathname];
        }
        let extension = path.extname(pathname);
        if (extension == ""){extension=".html";pathname+=extension};
        console.log("Extension",extension);
        console.log("Serving:", pathname)

        if (extension== ".html"){
            dirname = "./cache/"+pathname;
            contentType = "text/html; charset=UTF-8"
            if (!fs.existsSync(dirname)){
                renderPage(pathname);
            }
        }
        else if (extension == ".css"){
            dirname = pathname
            contentType = "text/css; charset=UTF-8";
        }
        else {
            dirname = pathname
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
            
            url = result.heading.replace(/[;/?:@&=+$, ]/g ,"-")
            db.pool.query("insert into BlogEntries (heading,url,content) values ((?),(?),(?));",[result.heading,url,result.content]);
            response.writeHead(302,{Location: "/new"})
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

async function renderPage(pathname) {
    let html = "This Page is empty. Maybe it didn't render?";
    let name =pathname.split(".")[0];
    let subpath = path.dirname(name);
    let ejspath = "./sites/"+name +".ejs";
    let variables = {};
    console.log("rendering ./sites/"+name +".ejs")

    if (name.startsWith("blog/")){
        let dbdata = await renderBlogPage(name.replace("blog/",""));
        if(dbdata !== false){
            variables.bloghtml = dbdata["html"];
            variables.heading = dbdata["heading"];
            ejspath = "./sites/blogEntry.ejs";
        }
    }
    try {
        let contents =fs.readFileSync(ejspath);
        html = ejs.render(contents.toString(),variables,{filename: ejspath});//{views:["./"]});
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

async function renderBlogPage(blogEntry) {
    let content = "";
    let author = "";
    let heading = "";
    let html = "";
    let rows = await db.pool.query("select * from BlogEntries where url=(?);",[blogEntry]);
    if (rows.length== 1){
        content=rows[0]["content"];
        author = rows[0]["author"];
        heading = rows[0]["heading"];
    }
    else{
        return false;
    }
    //console.log("DB:",blogEntry,rows);
    html = marked(content);
    return {html:html,author: author,heading:heading};
}

const server = http.createServer(requestListener);
server.listen(config.port);
console.log("Server Started\nIP: localhost\nPort:",config.port);
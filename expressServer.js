const ejs = require("ejs");
const marked = require("marked");
const path = require("path");
const fs = require("fs");

const db = require("./mariadb.js");
const config = require("./config.js");
const express = require('express');

const app = express();

// used to be BodyParser.url... now deprecated
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'))
app.set("view engine","ejs");
app.set('view cache', false);
app.set('views', path.join(__dirname, '/sites'));

app.use("*",(req, res, next) => {
    console.log("-----------------------------");
    console.log("Request:");
    console.log("\tMethod: " +req.method);
    console.log("\tOriginal URL:"+req.originalUrl);
    console.log("\tBase URL:"+req.baseUrl);
    console.log("-----------------------------");
    next();
});

app.use((error,req, res, next) => {
    console.log(error.message)
    res.status(error.code || 500);
    res.send("404 - File Not Found :(");
});


app.get("/", (req,res) => {
    if (fs.existsSync("cache/index.html")){
        fs.readFileSync("cache/index.html",(err,data) => {
            if (!err){
                res.send(data.toString());
                return;
            }
        })
    }
    res.render("index",{"cache": true}, (err,html) => {
        if (err){ throw err;}
        res.send(html)
        fs.mkdirSync("cache",{recursive: true});
        fs.writeFileSync("cache/index.html",html,(err) => {
            if (err){
                console.log(err.message)
            }
        })
    });
})

app.get("/blog/:article", (req,res) => {
    // serve cached page if possible
    if (fs.existsSync("cache"+req.baseUrl+req.path+".html")){
        fs.readFileSync("cache"+req.baseUrl+req.path+".html",(err,data) => {
            if (!err){
                res.send(data.toString());
                return;
            }
        })
    }
    // check db for wanted entry
    db.pool.query("select * from BlogEntries where url=(?);",[req.params.article],(err,rows,meta) => {
        if (err ){ //|(rows.length != 2)
            console.log(err.message | "Weird Amount of Entries from DB" ) ;
        }

        console.log(rows[0].heading);
        // render blogEntry template with queried data
        res.render("blogEntry",{heading: rows[0].heading, bloghtml: marked(rows[0].content)}, (err,html) => {
            if (err){ 
                console.log(err.message);
                res.end()
                return
            }
            // send rendered page
            res.send(html)
            // save rendered page to cache
            fs.mkdirSync(path.dirname("cache"+req.baseUrl+req.path),{recursive: true});
            fs.writeFileSync("cache"+req.baseUrl+req.path+".html",html,(err) => {
                if (err){ console.log(err.message) }
            })
        });
    });
})


app.get("/blog", (req,res) => {
    // would serve cached blogoverview, but as it's dependent on the amount on the blogentries it changes too much to be usefull
    // also: how to find if changed?
    // deleting cached on render of blog page not viable
    /* if (fs.existsSync("cache/blog.html")){
        fs.readFileSync("cache/blog.html",(err,data) => {
            if (!err){
                res.send(data.toString());
                return;
            }
        })
    } */
    db.pool.query("select url,heading,substring(content,1,200) as description from BlogEntries;",(err,rows,meta) => {
        if (err ){ 
            console.log(err.message ) ;
        }
        blogEntries = rows;
        for (let i=0; i< rows.length;i++){
            blogEntries[i].description = marked(rows[i].description)
        }
        console.log(rows[0].heading);
        res.render("blog",{blogEntries: blogEntries}, (err,html) => {
            if (err){ 
                console.log(err.message);
                res.end()
                return
            }
            res.send(html)
            // would save blog overwiev to cache
            /*
            fs.mkdirSync(path.dirname("cache"+req.baseUrl+req.path),{recursive: true});
            fs.writeFileSync("cache"+req.baseUrl+req.path+".html",html,(err) => {
                if (err){ console.log(err.message) }
            })*/
        });
    });
})

app.get("/*", (req,res) => {
    if (fs.existsSync("cache"+req.baseUrl+req.path+".html")){
        fs.readFileSync("cache"+req.baseUrl+req.path+".html",(err,data) => {
            if (!err){
                res.send(data.toString());
                return;
            }
            console.log(err.message)
        })
    }
    res.render((req.baseUrl+req.path).substr(1),{"cache": true}, (err,html) => {
        if (err){ throw err;}
        res.send(html)
        fs.mkdirSync(path.dirname("cache"+req.baseUrl+req.path),{recursive: true});
        fs.writeFileSync("cache"+req.baseUrl+req.path+".html",html,(err) => {
            if (err){
                console.log(err.message)
            }
        })
    });
})

// put data from /new form into db
app.post("/*", (req,res) =>{
    let url = req.body.heading.replace(/[;/?:@&=+$, ]/g ,"-")
    db.pool.query("insert into BlogEntries (heading,url,content) values ((?),(?),(?));",[req.body.heading,url,req.body.content]);
    res.status(301).redirect("/new")           
})

// no idea what this does
app.use((error,req, res, next) => {
    console.log(error.message)
    res.status(error.code || 500);
    res.send("404 - File Not Found :(");
});

// starting the server
app.listen(8080, () => console.log("Started Server on Port "+config.port));

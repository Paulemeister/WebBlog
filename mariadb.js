const config = require("./config.js");
const mariadb = require("mariadb/callback");

const pool = mariadb.createPool({
    host: config.db_host,
    user: config.db_user,
    password: config.db_password,
    connectionLimit: 5,
    database: config.db_name
});

pool.query("select * from BlogEntries where url='test-heading';",(err,rows,meta) => {
    if (err){
        console.log(err.message);
    }
    else{
        console.log("Connected to MariaDB Database");

        console.log("Found Entries:",rows.length)
        //console.log(rows);//JSON.parse(JSON.stringify(rows)));
        for (let i = 0;i<rows.length;i++){
            console.log("\t",rows[i]["heading"]);
        }
    }
});
module.exports ={pool:pool};
//console.log(module.exports)
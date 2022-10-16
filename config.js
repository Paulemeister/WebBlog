const config = {
    port: process.env.PORT || 8080,
    db_host: "mariadb",
    db_name: "Paulemeister",
    db_port: process.env.DB_PORT || 3306,
    db_user: "webserver",
    db_password: "webserverpassword",
    
}

module.exports = config;
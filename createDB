#!/bin/sh

DBNAME=Paulemeister
USER=webserver
PASSWD=webserverpassword
ROOTPASSWD=password
ROOTUSER=root


mariadb -u $ROOTUSER -p$ROOTPASSWD -e "CREATE DATABASE ${DBNAME};"

mariadb -u $ROOTUSER -p$ROOTPASSWD -e "CREATE USER ${USER} IDENTIFIED BY '${PASSWD}';"

mariadb -u $ROOTUSER -p$ROOTPASSWD -e "REVOKE ALL ON *.* FROM ${USER};"

mariadb -u $ROOTUSER -p$ROOTPASSWD -e "GRANT ALL ON ${DBNAME}.* TO ${USER};"

mariadb -D $DBNAME -u $USER -p$PASSWD -e "CREATE TABLE ${DBNAME}.BlogEntries (\
    id int(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,\
    heading varchar(255) NOT NULL,\
    url varchar(255) NOT NULL UNIQUE,\
    content longtext NOT NULL,\
    author varchar(50) DEFAULT NULL);"
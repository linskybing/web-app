#! /bin/bash
docker network create webnet

docker run -d --name mysql --network webnet -e MYSQL_ROOT_PASSWORD=12341234 -p 3306:3306 mysql:latest

docker run -it --name node-vscode --network webnet -v C:/Users/linsk/Desktop/web-app:/root/web-app --entrypoint sh node-vscode

mysql -h mysql -u root -p

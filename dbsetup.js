/* DB Setup하는 방법
 * 1. 서버 시작 - nodemon dbsetup.js
 * 2. 브라우저 URL 창에서 localhost:3000/setup_db를 침
 * 3. 브라우저 URL 창에서 localhost:3000/populate_db를 침
 * 4. 위 작업을 한 후  ctrl + c로 서버를 종료
 * 4. 계속 코딩 작업을 하려면 메인 서버 시작 - nodemon app.js
 */

const express = require("express");
const mysql = require("mysql");
const connection = require("./lib/dbconn"); // db 상수 가져오기

const app = express();

// DB연결 체크
const db = connection.db;
db.connect(function(err) {
  if (err) throw err;
  console.log("Database connected!");
});

app.get("/setup_db", function(req, res) {
  var sql = `
    
  `

  db.query(sql, function(err, result) {
    if (err) {
      res.send("Database setup failed!");
      throw err;
    }
    console.log(result);
    res.send("Database setup success..");
  });
});

app.get("/populate_db", function(req, res) {
  var sql = `

    `
  db.query(sql, function(err, result) {
    if (err) {
      res.send("Data insertion failed!");
      throw err;
    }
    console.log(result);
    res.send("Data successfully populated.");
  });
});

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});

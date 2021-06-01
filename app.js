
/* --------------- NPM Package ---------------- */
require('dotenv').config(); // .env 파일 내에 있는 변수를 이 파일로 가져올 때 process.env.<키변수>로 접근
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const session = require("express-session");
const passport = require("passport"),
  LocalStrategy = require('passport-local').Strategy;
const fileUpload = require('express-fileupload');
const cors = require('cors');
// const morgan = require('morgan');
const _ = require('lodash');
const QRCode = require('qrcode');

/* ---------- User-defined Module ------------- */
const connection = require("./lib/dbconn"); // DB 연결
const user = require('./routes/user');
const home = require('./routes/home');
const bulletin = require('./routes/bulletin');

const contact = require('./routes/contact');
const chat = require('./routes/chat');
const discover = require('./routes/discover');
const places = require('./routes/places');

/* -------------------------------------------- */
const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(fileUpload({createParentPath: true}));
app.use(cors());
// app.use(morgan('dev'));

// Checking DB conneciton
db = connection.db;
db.connect(function(err) {
  if (err) throw err;
  console.log("Database connected!");
});

// Using session
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60*60*1000 } // max period 1 hour
}));

/* --- Section for developing pages --- */

// Root redirects to Homepage
app.get("/", function (req, res) {
  res.redirect("/home");
});

// Homepage
app.get("/home", home.main);

// Signup
app.get("/signup", user.signup);
app.post("/signup", user.signup);

// Login
app.get("/login", user.login);
app.post("/login", user.login);

// Logout
app.get("/logout", user.logout);

// Bulletin Board
app.get("/bulletin-board", bulletin.main); // 인욱 - Bulletin Board, Post View
app.get("/post", bulletin.viewPost);

// Contact List
app.get("/contact", contact.main); // 영일 - Contact list

// Chat System
app.get("/chat", chat.main); // 신이 - Chat list

// Discover
app.get("/discover", discover.main); // 신이 - Discover

// Local Places
app.get("/places", places.main); // 영일 - Local Places


/* ----------------------------------- */

// Setting port
let port = process.env.PORT;
if (port == null || port == "") {
  port == 3000;
}

// Server starter
app.listen(port, function() {
  console.log("Server has started at port 3000.");
});

#!/usr/bin/env node

const express        = require('express'),
      _              = require('lodash'),
      mongoose       = require('mongoose'),
      url            = require('url'),
      passport       = require('passport'),
      bodyParser     = require('body-parser'),
      expressSession = require('express-session');
      LocalStrategy  = require('passport-local');

// Define app and establish project structure
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));


const categories = ["clothes", "furniture", "toys", "games", "jewelry", 
 "health", "cars"
];

const User    = require("./models/user"),
      Post    = require("./models/post"),
      Comment = require("./models/comment");


// BEGIN Configure Passport
app.use(expressSession({
  secret: "One-time pads are cryptographically secure but not practical.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// END Configure Passport

// Connect to database and quit if this operation fails
const mongodb_addr = "mongodb://localhost/dealsteal";
mongoose.connect(mongodb_addr, {useNewUrlParser: true}, 
  function(err){
    if (err){
      console.log(err);
      process.exit(1);
    }
    console.log("Connected to " + mongodb_addr);
  }
);

//  =================
// BEGIN all routes
//  =================

app.get("/", function(req, res){
  res.render('home.ejs', {categories: categories});
});

app.get("/category/:productType", function(req, res){
  let productType = req.params.productType.split()
	              .map(s => s[0].toUpperCase() + s.substring(1))
	              .join(" ");
  
  if (categories.includes(productType.toLowerCase())){
    res.render("category.ejs", {category : productType});
  }else{
    res.send(productType + " is not a recognized product type.");
  }
});

//  =================
// BEGIN auth routes
//  =================

app.get("/signup", function(req, res){
  console.log("GET to /login route");
  res.render("signup.ejs", {message: ""});
});

app.post("/signup", function(req, res){
  console.log("POST to /signup route");
  let newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, user, info){
    if (err){
      console.log(err);
      return res.render("signup.ejs", {message: err.message});
    }
    console.log("User " + user.username + " successfully created.\n");
    passport.authenticate("local")(req, res, function(){
      res.redirect("/");
    });
  });
});

app.get("/login", function(req, res){
  console.log("GET to /login route");
  res.render("login.ejs", {message: ""});
});

app.post("/login", function(req, res, next){
  console.log("POST to /login route");
  const params = {message: "Invalid username or password."};
  let authenticator = passport.authenticate('local', 
    function(err, user, info){
      if (err)   { return next(err); }
      if (!user) { return res.render('login.ejs', params); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/');
      });
    }
  );
  authenticator(req, res, next);
});

//  =================
// END auth routes
//  =================

app.get(":invalid", function(req, res){
  res.send("Page \"" + req.params.invalid + "\" not found.");
});

app.get("*", function(req, res){
  res.redirect("/");
});

//  =================
// END all routes
//  =================



// start the server
const server = app.listen(3001, function(){
  let host = server.address().address,
      port = server.address().port;
  console.log("DealSteal server listening at %s:%s", host, port);
});

// install signal handler
process.on('SIGINT', function(){
  mongoose.connection.close(function(){
    console.log("Mongoose connection closed.");
    console.log("Shutting down the server...");
    process.exit(0);
  });
});

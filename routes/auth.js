const express = require('express'),
      passport = require('passport'),
      expressSession = require('express-session'),
      LocalStrategy = require('passport-local');

// Load User model
const User = require('../models/user');

// Initialize auth routers
const loginRouter   = express.Router({mergeParams: true}),
      logoutRouter  = express.Router({mergeParams: true}),
      signupRouter  = express.Router({mergeParams: true}),
      signoutRouter = express.Router({mergeParams: true});

// GET request renders login page
loginRouter.get('/', function(req, res){
  if (req.user) { return res.redirect("/"); }
  let params = {message: ""};
  res.render("login.ejs", params);
});

// POST request attempts to login as a given user and redirects to: 
//  -the login page with an error message in the event of a failure
//  -the home page in the event of success
loginRouter.post("/", function(req, res, next){
  if (req.user) { return res.redirect("/"); }
  let params = {message: "Invalid username or password."};
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

// POST request redirects to home page and logs out the user if applicablee
logoutRouter.post("/", function(req, res, next){
  if (req.user) {req.logout();}
  res.redirect("/");
});

// GET request renders the signup page
signupRouter.get("/", function(req, res){
  res.render("signup.ejs", {message: ""});
});

// POST request attempts to signup a new user iff a user is not already logged
// in. The signup page is rendered with an error message in the event of a
// failure. Otherwise, a new user is created, and a redirect to the home page
// occurs
signupRouter.post("/", function(req, res){
  if (req.user) { res.redirect("/"); }
  let newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, user, info){
    if (err){
      //logger.warn(err);
      return res.render("signup.ejs", {message: err.message});
    }
    //logger.info("User " + user.username + " successfully created.\n");
    passport.authenticate("local")(req, res, function(){
      res.redirect("/");
    });
  });
});


function initAppAuthentication(app){
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

  app.use(function navbarLoginCheck(req, res, next){
    res.locals.username = req.user ? req.user.username : null;
    next();
  });  
}



module.exports = {
  loginRouter: loginRouter,
  logoutRouter: logoutRouter,
  signupRouter: signupRouter,
  initAppAuthentication: initAppAuthentication
};

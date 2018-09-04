const express = require('express'),
      passport = require('passport'),
      expressSession = require('express-session'),
      LocalStrategy = require('passport-local');

// Load User model
const User = require('../models/user');

// Initialize auth routers
const loginRouter = express.Router(),
      logoutRouter = express.Router();

loginRouter.get('/', function(req, res){
  if (req.user) { return res.redirect("/"); }
  let params = {message: ""};
  res.render("login.ejs", params);
});

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

logoutRouter.post("/logout", function(req, res, next){
  if (req.user) {req.logout();}
  res.redirect("/");
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
  initAppAuthentication: initAppAuthentication
};

#!/usr/bin/env node

const express        = require('express'),
      _              = require('lodash'),
      path           = require('path'),
      mongoose       = require('mongoose'),
      url            = require('url'),
      passport       = require('passport'),
      bodyParser     = require('body-parser'),
      expressSession = require('express-session'),
      LocalStrategy  = require('passport-local'),
      winston        = require('winston'),
      methodOverride = require('method-override');     
      
const ObjectId = mongoose.Types.ObjectId;

// Define app and establish project structure
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "public")));

// Use bodyParser to preprocess request bodies, and use methodOverride to
// interpret any POST request with a hidden input /_method=(DELETE|PUT)/
// as a DELETE or PUT request respectively
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body){
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));


// BEGIN logging

// log everything to Console, errors to err.log, everything to combined.log
const loggingLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
const loggingLevel =  loggingLevels.includes(process.env.LOG_LEVEL) ? 
    process.env.LOG_LEVEL : 'info'; // default is `info`, otherwise use env
console.log(`Logging at level "${loggingLevel}"`);

const logger = winston.createLogger({
  level : loggingLevel,
  transports: [
    new (winston.transports.Console)(
     {level: 'debug', json: false, colorize: true, 
      timestamp: () => (new Date()).toLocaleTimeString()}
    ),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log', level: 'info' }),
    new winston.transports.File({ filename: 'debug.log', level: 'silly' }),
  ]
});

// add logging middleware to all routes
app.use(function logRoute(req, res, next){
  logger.info(req.method + " " + req.originalUrl);
  if (Object.keys(req.params).length) { winston.verbose(req.params); }
  next();
});
// END logging

// TODO make these a database collection
const categories = ["clothes", "furniture", "toys", "games", "jewelry", 
 "health_and_meds", "cars"
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

function navbarLoginCheck(req, res, next) {
  res.locals.username = req.user ? req.user.username : null;
  next();
}

app.use(navbarLoginCheck);
// END Configure Passport

// Connect to database and quit if this operation fails
const mongodb_addr = "mongodb://localhost/dealsteal";
mongoose.connect(mongodb_addr, {useNewUrlParser: true}, 
  function(err){
    if (err){
      logger.log(err);
      process.exit(1);
    }
    logger.info("Connected to " + mongodb_addr);
  }
);

//  =================
// BEGIN all routes
//  =================


app.get("/", function(req, res){
  let params = {categories: categories}
  res.render('home.ejs', params);
});

const toCategoryName = category =>
  category.split("_").map(s => s[0].toUpperCase() + s.substring(1)).join(" ");

app.get("/category/:productType", function(req, res){
  let category = req.params.productType;
  let categoryFmt = toCategoryName(category);
  if (!categories.includes(category.toLowerCase())){
    return res.send(category + " is not a recognized product type.");
  }
  Post.find({category : category})
    .sort({creationDate : -1})
    .exec(function(err, allPosts){
      if (err) { logger.log(err); }
      logger.debug(allPosts);
      let params = {categoryName: categoryFmt, category : category, 
                    posts: allPosts};
      res.render("category.ejs", params);
    });
});

app.get("/category/:productType/new", function(req, res){
  let category = req.params.productType;
  let user = req.user;
  if (!user){
    return res.redirect("/login");
  }
  res.render("new_post.ejs", {category: category});
});

app.post("/category/:productType/new", function(req, res){
  let category = req.params.productType;
  let user = req.user;
  if (!categories.includes(category)){
    return res.send(category + " is not a recognized product type.");
  }
  if (!user) {return res.redirect("/login");}
  let content = req.body.content ;
  let postData = {username: user.username, category: category, text: content};
  winston.debug(`Creating new post: ${JSON.stringify(postData)}`);
  let post = Post.create(postData,
    function(err, post){
      if (err){
        logger.error(err);
        return res.redirect("/category/" + category + "/new");
      }
    }
  );
  res.redirect("/category/" + category);
});

app.get("/category/:productType/:postId/", function(req, res){
  let category = req.params.productType;
  let user = req.user;
  let postId = req.params.postId;
  if (!categories.includes(category)){
    return res.send(category + " is not a recognized product type.");
  }
  Post.findById(postId, function(err, post){
      if (err) { 
        logger.error(err);
        return res.send(err); 
      }
      if (!post) { return res.send("Post " + postID + " not found."); }
      Comment.find({post: ObjectId(postId)}, function(err, comments){
          if (err) { 
            logger.error(err);
            return res.send(err); 
          }
          winston.debug(comments);
          let params = {comments: comments, post: post, category: category,
                        categoryName : toCategoryName(category)};
          return res.render("post.ejs", params);
        });
    });
});

app.delete("/category/:productType/:postId/", function(req, res){
  let category = req.params.productType;
  let user = req.user;
  let postId = req.params.postId;
  if (!categories.includes(category)){
    return res.send(category + " is not a recognized product type.");
  }
  Post.findById(postId, function(err, post){
      if (err) { 
        logger.error(err);
        return res.send(err); 
      }
      if (!post) { return res.send("Post " + postID + " not found."); }
      if (user.username !== post.username){
        logger.error(
          `User ${user.username} tried to delete another user's post.`
        );
        return res.send("Permission denied.");
      }
      Comment.deleteMany({post: ObjectId(postId)}, function(err){
        if (err) { 
          logger.error(err);
        }
      });
      Post.deleteOne({_id: ObjectId(postId)}, function(err){
        if (err) {
          logger.error(err);
          return res.send(err);
        }
        return res.redirect("/category/" + category);
      });
    });
});

app.post("/category/:productType/:postId/comment", function(req, res){
  let category = req.params.productType;
  let user = req.user;
  let postId = req.params.postId;
  if (!user) { return res.redirect("/login"); }
  if (!categories.includes(category)){
    return res.send(category + " is not a recognized product type.");
  }
  Post.findById(postId, function(err, post){
      if (err) { 
        logger.error(err);
        return res.send(err); 
      }
      if (!post) { return res.send("Post " + postID + " not found."); }
      let content = req.body.text;
      Comment.create({text: content, replyTo : null, post: ObjectId(postId),
                      username: user.username}, 
        function(err, comment){
          if (err) {
            logger.error(err); 
            return res.send(err); 
          }
          return res.redirect("/category/" + category + "/" + postId)
        }
      );
  });
});

app.delete("/category/:productType/:postId/comment/:commentId", 
  function(req, res){
    let category = req.params.productType;
    let user = req.user;
    let postId = req.params.postId;
    let commentId = req.params.commentId;
    if (!user) { return res.redirect("/login"); }
    if (!categories.includes(category)){
      return res.send(category + " is not a recognized product type.");
    }
    Post.findById(postId, function(err, post){
      if (err) { 
        logger.error(err);
        return res.send(err); 
      }
      if (!post) { return res.send("Post " + postID + " not found."); }
      Comment.deleteOne({_id : ObjectId(commentId)}, function(err){
        if (err){
          logger.error(err);
          return res.send(err);
        }
        return res.redirect(`/category/${category}/${postId}`);
      });
  });
});



//  =================
// BEGIN auth routes
//  =================

app.get("/signup", function(req, res){
  res.render("signup.ejs", {message: ""});
});

app.post("/signup", function(req, res){
  if (req.user) { res.redirect("/"); }
  let newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, user, info){
    if (err){
      logger.warn(err);
      return res.render("signup.ejs", {message: err.message});
    }
    logger.info("User " + user.username + " successfully created.\n");
    passport.authenticate("local")(req, res, function(){
      res.redirect("/");
    });
  });
});

app.get("/login", function(req, res){
  if (req.user) { return res.redirect("/"); }
  let params = {message: ""};
  res.render("login.ejs", params);
});

app.post("/login", function(req, res, next){
  if (req.user) { return res.redirect("/"); }
  let params = {message: "Invalid username or password."}
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

app.post("/logout", function(req, res, next){
  if (req.user) {req.logout();}
  res.redirect("/");
});
//  =================
// END auth routes
//  =================

app.get(":invalid", function(req, res){
  logger.warn("Get to Invalid Route: " + req.originalUrl);
  res.send("Page \"" + req.params.invalid + "\" not found.");
});

app.get("*", function(req, res){
  logger.warn("Get to Invalid Route: " + req.originalUrl);
  res.redirect("/");
});

//  =================
// END all routes
//  =================

// start the server
const server = app.listen(3001, function(){
  let host = server.address().address,
      port = server.address().port;
  logger.info(`DealSteal server listening at ${host}:${port}`);
});

// install signal handler
process.on('SIGINT', function(){
  mongoose.connection.close(function(){
    logger.info("Mongoose connection closed.");
    logger.info("Shutting down the server...");
    process.exit(0);
  });
});

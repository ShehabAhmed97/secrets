//jshint esversion:6
require('dotenv').config()

const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
var flash = require('connect-flash');
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(session({
    secret: 'this is my secret',
    resave: false,
    saveUninitialized: false,
  }))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/secretsDB");

//=================Encryption================//
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//==========================================//

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy()); //local authentication startegy

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

//==============google authentication strategy===========//

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

//========================================================//

//===============facebook authentication strategy===========//
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//==========================================================//


app.get("/", (req,res) => {
    res.render("home");
})
app.get("/logout", (req,res) => {
    req.logout();
    res.redirect("/");
})

app.route("/login")
   .get((req,res) => {
       res.render("login");
       })
   .post(passport.authenticate("local",
                                {   successRedirect: '/secrets',
                                    failureRedirect: '/login',
                                    failureFlash: 'Invalid username or password.'
                                })
    // (req,res) => {
    //     const user = new User({
    //         username: req.body.username,
    //         password: req.body.password
    //     })
    //     req.login(user, (err) => {
    //         if(err){
    //             console.log(err)
    //             res.redirect("/login")
    //         }else{
    //             passport.authenticate("local")(req,res,() => {
    //                 res.redirect("/secrets")
    //             })
    //         }
    //     })
    //     res.redirect("/secrets")
    // }
    )   

app.route("/register")
   .get((req,res) => {
       res.render("register");
       })
    .post((req,res) => {
        User.register({username:req.body.username}, req.body.password, function(err, user) {
            if (err) {
                console.log(err)
                res.redirect("/register")
            }else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets")
                })
            }
          });
    })
    

// app.get('/auth/google',
//     passport.authenticate('google', { scope: ['profile'] })
//     );

// app.get('/auth/google/secrets', 
//     passport.authenticate('google', { failureRedirect: '/login' }),
//     function(req, res) {
//         res.redirect('/secrets');
//     });
    

app.get('/auth/facebook',
    passport.authenticate('facebook')
    );
  
app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/secrets');
    });    

app.route("/submit")
   .get((req,res) => {
        if(req.isAuthenticated()){
            res.render("submit");
        }else{
            res.redirect("/login")
        }
   })
   .post((req,res) => {
       User.findById(req.user._id, (err, foundUser) => {
           foundUser.secret = req.body.secret;
           foundUser.save(() => {
                res.redirect("/secrets")
                })
       })
   })

app.route("/secrets")
   .get((req,res) => {
       if(req.isAuthenticated()){
           User.find({secret: {$ne: null}}, (err, foundUsers) => {
                res.render("secrets", {users: foundUsers});
           })
       }else{
           res.redirect("/login")
       }
   })
       

app.listen(process.env.PORT || 3000, ()=>{
    console.log("App is running on port 3000...")
})
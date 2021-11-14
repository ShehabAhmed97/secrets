//jshint esversion:6
require('dotenv').config()

const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
var flash = require('connect-flash');
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose");

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
    password: String
})
userSchema.plugin(passportLocalMongoose);
//==========================================//

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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
   .post(passport.authenticate("local", { successRedirect: '/secrets',failureRedirect: '/login', failureFlash: 'Invalid username or password.' })
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

app.route("/secrets")
   .get((req,res) => {
       if(req.isAuthenticated()){
           res.render("secrets");
       }else{
           res.redirect("/login")
       }
   })    

app.listen(process.env.PORT || 3000, ()=>{
    console.log("App is running on port 3000...")
})
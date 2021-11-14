//jshint esversion:6
require('dotenv').config()

const express = require("express");
const app = express();

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/secretsDB");

//=================Encryption================//
const encrypt = require("mongoose-encryption");
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]})
//==========================================//

const User = new mongoose.model('User', userSchema);

const ejs = require("ejs");

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req,res) => {
    res.render("home");
})
app.get("/logout", (req,res) => {
    res.redirect("/");
})

app.route("/login")
   .get((req,res) => {
       res.render("login");
       })
   .post((req,res) => {
       User.findOne({email: req.body.username}, (err, user) => {
           if(err){
               console.log(err)
           }else{
               if(user){
                   if(user.password === req.body.password){
                       res.render("secrets")
                   }
               }
           }
       }) 
    })   

app.route("/register")
   .get((req,res) => {
       res.render("register");
       })
    .post((req,res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save((err) => {
            if(!err){
                res.render("secrets");
            }else{
                console.log(err);
            }
        })
    })   

app.listen(process.env.PORT || 3000, ()=>{
    console.log("App is running on port 3000...")
})
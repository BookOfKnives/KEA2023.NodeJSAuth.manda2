import express from "express";
const app = express();
app.use(express.static("public"));
app.use(express.json());
const PORT = 8080;

import templateEngine from "./util/templateEngine.js"

import bcrypt from "bcrypt";
const saltRounds = 10;

import { MongoClient } from "mongodb";
const DBURL = "mongodb://127.0.0.1:27017";
const DBNAME = "admin";
const mongoClient = new MongoClient(DBURL);
let collection = mongoClient.db(null); //NB: let! because otherwise it might bug on empty start.
try {
    await mongoClient.connect();
    const db = mongoClient.db(DBNAME);
    collection = db.collection("myfirstdb");
    console.log("mongodb connection established, from app.js");
} catch (err) {
    console.log("mongodb not connected, error: ", err);
};

const firstPage = templateEngine.readPage("./public/pages/frontpage/body.html");
const firstPageDigest = templateEngine.renderPage(firstPage, {
    tabTitle: "first page title!"
});

app.get("/", (req, res) => {
    res.send(firstPageDigest)
});

app.post("/newuser", express.urlencoded({ extended: true }), async (req, res) => {
    const name = req.body.newusername; //no input sanitation!
    const password = req.body.newuserpassword;
    console.log("this is pw from newuser:", password);
    if ( ! collection ) {
        res.status(500).send("sorry... we're closed!");
        return "-1"; //2704 incidentally it seems i can replace "return" w "res.end()" 
    }
    if ( ! ( req.body.newuserpassword && req.body.newusername ) ) {
        res.status(422).send("This is POST:newUser, missing data, try again.");
        return "-1";
    }
    //doesnt check for duplicate names either.
   try {    
    const hashedPasswordOfNewUser = await bcrypt.hash(req.body.newuserpassword, saltRounds);
    const newUser = { name: req.body.newusername, password: hashedPasswordOfNewUser };
    console.log("newUser from post Newuser:", newUser);
      try {
        collection.insertOne(newUser);
        console.log("insertion OK in newUser POST for MongoDB for name: ", newUser["name"]);
        res.status(200).send({Data: newUser});
        return "0";
    } catch (err) {
        console.log("db has error", err);
        res.status(500).send("Sorry, DB insertion failed.");
        return "-1";
    } 
} catch (err) {
    console.log("Error in POST-Route newUser, error: ", err);
    res.status(500).send("Sorry, internal server erorr 500 has occured, in POST-route newUser.");
    return "-1";
} res.send("This is the fallthrough route for POST:newUser; something probably went wrong wth the DB.");
});

app.post("/login", express.urlencoded({ extended: true }), async (req, res) => { 
    const username = req.body.username;
    const userpassword = req.body.userpassword;
    console.log("this is userpw from post login:", userpassword);
    console.log("this is user from post login:", username);
    const dbHashedPassword = await collection.find({name: username, password: userpassword}).toArray();
    const isPasswordTrue = await bcrypt.compare(userpassword, dbHashedPassword); 
    if (isPasswordTrue){
        console.log("insdie of bcrypt compare TRUE");
    };
    
    const coll = await collection.find({name: username }, {projection: {"name": 1}}).toArray();

    res.send({data: coll})
});

app.get("/all", async (req, res) => { //not in use; test route for understanding db
    const coll = await collection.find({}).toArray();
    res.send({data: coll})
});
 
app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Server running on port", PORT)
});
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const knex = require("knex");
const { reset } = require("nodemon");
const Clarifai = require("clarifai");

const register = require("./controllers/register");
const signin = require("./controllers/signin");

const app = express();

const db = knex({
    client: "pg",
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    },
});

const clarifyApp = new Clarifai.App({
    apiKey: "a0ff2432f0f8436ea8935e7a80202193",
});

const handleAPICall = (req, res) => {
    clarifyApp.models
        .initModel({
            id: Clarifai.FACE_DETECT_MODEL,
        })
        .then((faceDetectModel) => {
            //console.log(req.body.input);
            return faceDetectModel.predict(req.body.input);
        })
        .then((data) => res.json(data))
        .catch((err) => res.status(400).json("api failed"));
};

/* db.select("*")
    .from("users")
    .then((data) => {})
    .catch((err) => {
        console.log(err);
    }); */

/* const database = {
    users: [
         {
            id: "1",
            name: "john",
            email: "john@gmail.com",
            password: "lol",
            entries: 0,
            joined: new Date(),
        },
        {
            id: "2",
            name: "sally",
            email: "sally@gmail.com",
            password: "hai",
            entries: 0,
            joined: new Date(),
        },
    ],
    login: [
        { id: "1", has: "", email: "john@gmail.com" },
        { id: "2", has: "", email: "sally@gmail.com" },
    ],
}; */

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json("success");
});

app.get("/profile/:id", (req, res) => {
    const { id } = req.params;

    db.select("*")
        .from("users")
        .where({
            id: id, //({id})
        })
        .then((user) => {
            if (user.length) {
                res.json(user[0]);
            } else {
                res.status(400).json("not found");
            }
        })
        .catch((err) => res.status(400).json("error getting user"));
});

app.post("/register", (req, res) => {
    register.handleRegister(req, res, db, bcrypt);
});

//app.post("/register", register.handleRegister(db, bcrypt));

app.post("/signin", (req, res) => {
    signin.handleSignin(req, res, db, bcrypt);
});

app.put("/image", (req, res) => {
    const { id } = req.body;

    db("users")
        .where("id", "=", id)
        .increment("entries", 1)
        .returning("entries")
        .then((entries) => {
            res.json(entries[0]);
        })
        .catch((err) => res.status(400).json("unable to get entries"));
});

app.post("/imageurl", (req, res) => {
    //console.log(req);
    handleAPICall(req, res);
});

app.listen(process.env.port || 3001, () =>
    console.log(`running on port ${process.env.port}`)
);

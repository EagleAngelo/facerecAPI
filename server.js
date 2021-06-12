const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const knex = require("knex");
const { reset } = require("nodemon");
const Clarifai = require("clarifai");

const register = require("./controllers/register");
const signin = require("./controllers/signin");

/* app.all("*", function (req, res, next) {
    var origin = req.get("origin");
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
}); */

const db = knex({
    client: "pg",
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    },
});

const clarifyApp = new Clarifai.App({
    apiKey: process.env.APIKEY,
});

const app = express();
app.use(cors());
app.use(express.json());

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

app.get("/favicon.ico", (req, res) => {
    if (req.originalUrl.includes("favicon.ico")) {
        res.status(204).end();
    }
    next();
});

app.post("/imageurl", (req, res) => {
    //console.log(req);
    handleAPICall(req, res);
});

app.listen(process.env.PORT || 3001, () =>
    console.log(`running on port ${process.env.PORT}`)
);

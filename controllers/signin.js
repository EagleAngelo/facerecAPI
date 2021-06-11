const handleSignin = (req, res, db, bcrypt) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json("incorrect form submission");
    }

    db.select("email", "hash")
        .from("login")
        .where("email", "=", req.body.email)
        .then((data) => {
            bcrypt.compare(
                req.body.password,
                data[0].hash,
                function (err, allowed) {
                    if (allowed) {
                        return db
                            .select("*")
                            .from("users")
                            .where("email", "=", req.body.email)
                            .then((user) => {
                                res.json(user[0]);
                            })
                            .catch((err) =>
                                res.status(400).json("unable to get users")
                            );
                    } else {
                        res.status(400).json("unable to log in");
                    }
                }
            );
        })
        .catch((err) => res.status(400).json("wrong credentials users"));
};

module.exports = {
    handleSignin: handleSignin,
};

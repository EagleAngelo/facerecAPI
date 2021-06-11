//const handleRegister = (db, bcrypt) => (req, res) => {
const handleRegister = (req, res, db, bcrypt) => {
    const { name, email, password } = req.body;

    if (!email || !name || !password) {
        return res.status(400).json("incorrect form submission");
    }

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            /* db("login")
                .insert({
                    email: email,
                    hash: hash,
                })
                .catch((err) => res.status(400).json("unable to register"));

            db("users")
                .returning("*")
                .insert({
                    name: name,
                    email: email,
                    joined: new Date(),
                })
                .then((user) => res.json(user[0]))
                .catch((err) => res.status(400).json("unable to register")); */

            db.transaction((trx) => {
                trx.insert({
                    hash: hash,
                    email: email,
                })
                    .into("login")
                    .returning("email")
                    .then((loginEmail) => {
                        return db("users")
                            .returning("*")
                            .insert({
                                email: loginEmail[0],
                                name: name,
                                joined: new Date(),
                            })
                            .then((user) => {
                                res.json(user[0]);
                            });
                    })
                    .then(trx.commit)
                    .catch(trx.rollback);
            }).catch((err) => res.status(400).json("unable to register"));
        });
    });
};

module.exports = {
    handleRegister: handleRegister,
};

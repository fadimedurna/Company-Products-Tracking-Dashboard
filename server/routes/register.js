const router = require("express").Router();
const { User, validate } = require("../models/User");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const email = await User.findOne({ email: req.body.email });
    if (email)
      return res
        .status(409)
        .send({ message: "User with given email already exists!" });

    const user = await User.findOne({ userName: req.body.userName });
    if (user)
      return res
        .status(409)
        .send({ message: "User with given username already exists!" });

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const savedUser = await new User({
      ...req.body,
      password: hashPassword,
    }).save();
    res
      .status(201)
      .send({ user: savedUser, message: "User created successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;

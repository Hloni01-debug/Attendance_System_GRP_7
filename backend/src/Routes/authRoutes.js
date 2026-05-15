const express = require("express");
const { registerUser, userLogin } = require("../controller/authController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", userLogin);

module.exports = router;
const express = require("express");
const { crawlPostData } = require("../controllers/crawlController");
const router = express.Router();

router.get("/posts/:postLink", crawlPostData);

module.exports = router;

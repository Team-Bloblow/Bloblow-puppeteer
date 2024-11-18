const express = require("express");
const cors = require("cors");

const crawlRouter = require("./routes/crawlRoute");

const app = express();

require("dotenv").config();

const PORT = process.env.PORT || 5000;
const SERVER_URL = process.env.SERVER_URL;

app.use(
  cors({
    origin: SERVER_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/crawl", crawlRouter);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})

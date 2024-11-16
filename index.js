const express = require("express");

const crawlRouter = require("./routes/crawlRoute");

const app = express();

const PORT = process.env.PORT || 4000;

app.use("/crawl", crawlRouter);

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running");
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})

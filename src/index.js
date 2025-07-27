require("dotenv").config();

const app = require("./app.js");
const connectDB = require("./db/index.js");

const port = process.env.PORT || 8000;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`server start at ${port}`);
    });
    app.on("error", (err) => {
      console.log("your app is not running", err);
      throw err;
    });
  })
  .catch((err) => {
    console.log("mongodb connection failed", err);
  });

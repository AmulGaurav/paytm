const express = require("express");
const app = express();
const cors = require("cors");
const PORT = 3000;
const mainRouter = require("./routes");

app.use(cors());
app.use(express.json());
app.use("/api/v1", mainRouter);

app.listen(PORT, () => {
  console.log(`listening at port ${PORT}`);
});

const mongoose = require("mongoose");
const { MONGODB_URL } = require("./config/config");

async function createConnection() {
     return await mongoose.connect(MONGODB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useFindAndModify: false,
          useCreateIndex: true,
     });
}

async function disConnection() {
     // await mongoose.disconnect();
}

module.exports = { open: createConnection, close: disConnection };

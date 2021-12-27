require("dotenv").config();

const PORT = process.env.PORT || 5000;
const MONGODB_URL =
     "mongodb+srv://tvhieu:hieu1998@cluster0.riizp.mongodb.net/LVTN?retryWrites=true&w=majority";

module.exports = {
     PORT,
     MONGODB_URL,
};

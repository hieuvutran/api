const mongoose = require("mongoose");

const hotelsSchema = new mongoose.Schema(
     {
         hotelName: String,
         address: String,
         phoneNumber: String,
          managerAcc: {type: mongoose.Schema.Types.ObjectId, ref: "accounts"}
     },
     { collection: "hotels" }
);

module.exports = mongoose.model("hotels", hotelsSchema);

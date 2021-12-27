const mongoose = require("mongoose");

const checkOutSchema = new mongoose.Schema(
     {
        createAt: {type: Date, default: Date.now},
        booking: {type: mongoose.Schema.Types.ObjectId, ref: "booking"}
     },
     { collection: "checkIn" }
);

module.exports = mongoose.model("checkOut", checkOutSchema);

const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema(
     {
        cusId: {type: mongoose.Schema.Types.ObjectId, ref: "customers"},
        createAt: {type: Date, default: Date.now},
        roomId: {type: mongoose.Schema.Types.ObjectId, ref: "rooms"},
        booking: {type: mongoose.Schema.Types.ObjectId, ref: "booking"},
        active: {type: Boolean, default: true}

     },
     { collection: "checkIn" }
);

module.exports = mongoose.model("checkIn", checkInSchema);

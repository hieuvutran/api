const mongoose = require("mongoose");

const customersSchema = new mongoose.Schema(
     {
        cusName: String,
        phoneNumber: String,
        identityCard: String,
        accId: {type: mongoose.Schema.Types.ObjectId, ref: "accounts"},
        hotelId: [{type: mongoose.Schema.Types.ObjectId, ref: "hotels"}],
     },
     { collection: "customers" }
);

module.exports = mongoose.model("customers", customersSchema);

const mongoose = require("mongoose");
const {BOOKING_STATUS_ENUM} = require('../constant/constant')
const bookingSchema = new mongoose.Schema(
     {
        roomId: {type: mongoose.Schema.Types.ObjectId, ref: "rooms"},
        cusId: {type: mongoose.Schema.Types.ObjectId, ref: "customers"},
        phoneNumber: String,
        identityCard: String,
        totalAmount: Number,
        startDate: Date,
        endDate: Date,
        status: {type: String, enum: BOOKING_STATUS_ENUM, default: BOOKING_STATUS_ENUM.success},
        createAt : {
         type: Date,
         default: Date.now
       },
       order: [{type: mongoose.Schema.Types.ObjectId, ref: "orders"}],
     },
     { collection: "booking" }
);

module.exports = mongoose.model("booking", bookingSchema);

const utils = require("../utils");
const { tryCatch } = require("../utils");
const ValidationError = require("../utils").ValidationError;
const accountsSchema = require("../schemas/accounts.schema");
const customersSchema = require("../schemas/customers.schema");
const employeesSchema = require("../schemas/employee.schema");
const hotelsSchema = require('../schemas/hotels.schema');
const workingTimesSchema = require('../schemas/workingTime.schema');
const mongo = require("../db");
const bcrypt = require("bcrypt");
const constant = require("../constant/constant");
const { authenticate } = require("./authorization");

module.exports = function (router) {
  router.post("/auth/login", async (req, res, next) => {
    return await tryCatch(async () => {
      const body = req.body;
      if (!utils.isRequired(body, "username", "password")) {
        throw new ValidationError("[payload] không hợp lệ", 400);
      }
      await mongo.open();
      const acc = await accountsSchema
        .findOne({ username: body.username })
        .lean();
      const isMatch = await bcrypt.compare(body.password, acc.password);
      if (!isMatch) {
        return res.json({
          code: 403,
          message: "username hoặc password không đúng",
        });
      }
      const [emp, cus] = await Promise.all([
        employeesSchema.findOne({ accId: acc._id }).lean(),
        customersSchema.findOne({ accId: acc._id }).lean(),
      ]);
      await mongo.close();
      let now = new Date();
      const workDay = now.toJSON().split('T')[0]
      if (cus) {
        return res.json({ code: 200, data: { ...cus, type: "CUSTOMER", role: acc.role } });
      }
      const query = {
        empId: emp ? emp._id || null : null,
        workDay
      }
      const workingTime = await workingTimesSchema.findOne(query).lean();
      const checkIn = workingTime ? workingTime.checkIn || null : null;
      const checkOut = workingTime ? workingTime.checkOut || null : null;
      const hotelManage = await hotelsSchema.findOne({managerAcc: acc._id}).lean();
      let accJson = JSON.parse(JSON.stringify(acc))
      return res.json({ code: 200, data: { ...emp,accId: acc._id , role: acc.role, type: "EMPLOYEE", workDay, checkIn, checkOut, hotelManage: hotelManage } });
    }, next);
  });
};

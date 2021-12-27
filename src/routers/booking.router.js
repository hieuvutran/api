const utils = require('../utils');
const { tryCatch } = require('../utils');
const ValidationError = require('../utils').ValidationError;
const bookingSchema = require('../schemas/booking.schema');
const customerSchema = require('../schemas/customers.schema');
const accountsSchema = require('../schemas/accounts.schema');
const roomsSchema = require('../schemas/rooms.schema')
const mongo = require('../db');
const { employee, manager, admin } = require('../routers/authorization');
const bcrypt = require('bcrypt');
const constant = require("../constant/constant");

module.exports = function (router) {
    router.get('/booking', async (req, res, next) => {
        return await tryCatch(async () => {
            let q = req.query || {};
            const beginOfDay = new Date(q.startDate);
            beginOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(q.startDate);
            endOfDay.setHours(23, 59, 59, 999);
            q['createAt'] = {
                "$gte": beginOfDay,
                "$lt": endOfDay
            }
            delete q.startDate;
            let list
            await mongo.open();
            if (q.roomId) {
                const Day = new Date(q.day);
                Day.setHours(0, 0, 0, 0);
                q['createAt'] = {
                    "$gte": Day
                }
                delete q.day

                list = await bookingSchema.find(q).lean();
            }
            else {
                list = await bookingSchema.find(q).populate('cusId').populate(
                    {
                        path: 'roomId',
                        populate: { path: 'hotelId', }
                    }
                ).lean();
            }

            if (req.headers.hotelid) {
                list = list.filter(item => item.roomId.hotelId._id == req.headers.hotelid)
            }
            await mongo.close();
            return res.json({ code: 200, data: list })
        }, next);
    });

    router.get('/booking/:id', async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if (!id) {
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            const detail = await bookingSchema.findOne({ _id: id, hotelId }).populate('cusId').populate({
                path: 'roomId',
                populate: [{
                    path: 'hotelId'
                }, {
                    path: 'roomTypeId'
                }]
            }).lean();
            await mongo.close();
            return res.json({ code: 200, data: detail })
        }, next);
    });

    router.post('/booking', async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if (!utils.isRequired(body, 'roomId', 'identityCard', 'startDate', 'endDate', 'cusName')) {
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const room = await roomsSchema.findById(body.roomId).populate('hotelId')
            const hotelId = room.hotelId._id;
            let { cusName, ...payload } = body;
            await mongo.open();
            const isCheckExistCustomer = await customerSchema.findOne({ identityCard: body.identityCard });
            if (isCheckExistCustomer) {
                if (!isCheckExistCustomer.hotelId.includes(hotelId)) {
                    isCheckExistCustomer['hotelId'].push(hotelId)
                    await isCheckExistCustomer.save();
                }
                const instance = new bookingSchema({ ...payload, cusId: isCheckExistCustomer._id });
                let saved = await instance.save();
                saved = JSON.parse(JSON.stringify(saved))
                const qr_code = await utils.generateQRCode({ bookingId: instance._id, cusId: isCheckExistCustomer._id })
                saved.qrCode = qr_code;
                return res.json({ code: 200, data: saved })
            } else {
                const passwordHashed = await bcrypt.hashSync(body.identityCard, constant.SALT);
                const account = new accountsSchema({ username: body.phoneNumber, password: passwordHashed, role: "customer" });
                const accSaved = await account.save();
                const customer = new customerSchema({ cusName, phoneNumber: body.phoneNumber, identityCard: body.identityCard, accId: accSaved._id, hotelId: hotelId });
                const cusSaved = await customer.save();
                const instance = new bookingSchema({ ...payload, cusId: cusSaved._id });
                let saved = await instance.save();
                saved = JSON.parse(JSON.stringify(saved))
                const qr_code = await utils.generateQRCode({ bookingId: instance._id, cusId: cusSaved._id })
                saved.qrCode = qr_code;



                return res.json({ code: 200, data: saved })
            }
            await mongo.close();

        }, next);
    });

    router.put('/booking/:id', employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if (!id) {
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const updated = await bookingSchema.findByIdAndUpdate(id, payload, { new: true });
            await mongo.close();
            return res.json({ code: 200, data: updated })
        }, next);
    });

    router.delete('/booking/:id', employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if (!id) {
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const deleted = await bookingSchema.findById(id);
            if (!deleted) {
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await deleted.remove();
            await mongo.close();
            return res.json({ code: 200, data: deleted })
        }, next);
    });
};
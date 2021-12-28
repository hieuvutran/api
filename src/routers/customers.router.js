require("dotenv").config();
const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const customersSchema = require('../schemas/customers.schema');
const accountsSchema = require('../schemas/accounts.schema');
const bookingSchema = require('../schemas/booking.schema');
const checkInSchema = require('../schemas/checkIn.schema');
const mongo = require('../db');
const {employee, manager, admin} = require('../routers/authorization');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const bcrypt = require('bcrypt');
const constant = require("../constant/constant");

module.exports = function(router){
    router.get('/customers', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let q = req.query || {};
            await mongo.open();
            if(req.headers.hotelid){
                q['hotelId'] = req.headers.hotelid || null;
            }
            let list = await checkInSchema.find().populate('roomId').populate('cusId').populate({
                path: 'booking',
                populate: [{
                    path: 'order'
                }]
            }).lean();
            list = list.filter(item => item.roomId.hotelId == req.headers.hotelid && item.booking && item.booking.startDate <= new Date() <=item.booking.endDate)
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/customers/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            const detail = await customersSchema.findOne({_id:id, hotelId}).lean();
            await mongo.close();
            return res.json({code: 200, data: detail})
        }, next);
    });

    router.post('/customers',async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'cusName', 'identityCard', 'phoneNumber')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            const passwordHashed = await bcrypt.hashSync(body.identityCard, constant.SALT);
            const account = new accountsSchema({username: body.identityCard, password: passwordHashed, role: "customer"});
            const accSaved = await account.save();
            const instance = new customersSchema({...payload, accId: accSaved._id, hotelId});
            const saved = await instance.save();
            await mongo.close();
            return res.json({code: 200, data: saved})
        }, next);
    });

    router.put('/customers/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const updated = await customersSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: updated})
        }, next);
    });

    router.delete('/customers/:id',employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const deleted = await customersSchema.findById(id);
            if(!deleted){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await deleted.remove();
            await mongo.close();
            return res.json({code: 200, data: deleted})
        }, next);
    });

    router.post('/customers/check-in', async (req, res, next) => {
        return await tryCatch(async () => {
            const beginOfDay = new Date();
            beginOfDay.setHours(0, 0, 0, 0);
            let queryDay = {};
            queryDay['createAt'] = {
                "$gte": beginOfDay
            }
            var upload = multer({
                storage: multer.memoryStorage()
            }).single('image')
            await upload(req, res, async function(err) {
                const file = req.file;
                const buffer = file.buffer
                const url = 'https://api.fpt.ai/vision/idr/vnm' || '';
                const formData = new FormData();
                formData.append('image',buffer, 'image');
                const config = {
                    headers: {
                        'content-type': 'multipart/form-data',
                        'api-key': 'tJkcuq0NN69U9Wc9BrYjoC2u08fsJpPa' || '',
                        ...formData.getHeaders()
                    }
                }
                let result = await axios.post(url,formData,config).catch(e => {
                    console.log('Failed call API FPT AI >>> ', e)
                    return res.json({code: 204, message: "Không tìm thấy thông tin"});
                });
                if(result && result.data.errorCode == 0){
                    const identityCard = result.data.data[0].id;
                    if(!identityCard){
                        return res.json({code: 500, message: "Lỗi, vui lòng thử lại"})
                    }
                    await mongo.open();
                    const now = (new Date()).toJSON().split('T')[0];
                    let listChecking = await bookingSchema.find(queryDay).populate('cusId').populate({
                        path: 'roomId',
                        populate: [{
                            path: 'hotelId'
                        }, {
                            path: 'roomTypeId'
                        }]
                    }).lean();
                    listChecking = listChecking.filter(item => item.cusId.identityCard == identityCard);
                    if(listChecking.length < 0){
                        return res.json({code: 204, message: "Không tìm thấy thông tin"});
                    }
                    const isBooking = listChecking.find(c => ((new Date(c.startDate)).toJSON().split('T')[0] == now))
                    if(!isBooking){
                        return res.json({code: 204, message: "Không tìm thấy thông tin"});
                    }
                    const cusId = isBooking.cusId._id;
                    const roomId = isBooking.roomId
                    const checkIn = new checkInSchema({cusId, roomId, booking: isBooking._id})
                    await checkIn.save()


                    const qr_code = await utils.generateQRCode({ cusName: isBooking.cusId.cusName, phoneNumber: isBooking.cusId.phoneNumber, roomNo: isBooking.roomId.roomNo, roomId: isBooking.roomId._id, bookingId: isBooking._id  })
                    isBooking.qrCode = qr_code;

                    return res.json({code: 200, data: isBooking})
                }
                return res.json({code: 500, message: "Lỗi, vui lòng thử lại"})
            })
        }, next)
    })

    router.get('/customers-check-in', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let q = req.query || {};
            const beginOfDay = new Date(q.day);
            beginOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(q.day);
            endOfDay.setHours(23, 59, 59, 999);

            let queryDay = {};
            queryDay['createAt'] = {
                "$gte": beginOfDay,
                "$lt": endOfDay
            }
            delete q.day;

            await mongo.open();
            let cunstomers = await checkInSchema.find(queryDay).populate('cusId').populate('roomId').lean();
            if (req.headers.hotelid) {
                cunstomers = cunstomers.filter(item => item.roomId.hotelId == req.headers.hotelid)
            }
            await mongo.close();
            return res.json({code: 200, data: cunstomers})
        }, next);
    });

    router.post('/customers-check-out',async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            await mongo.open();
            const infor = await bookingSchema.findById(body.bookingId).populate('cusId').populate('roomId').populate('order').lean();
            const checkIn = await checkInSchema.findOne({booking: body.bookingId});
            checkIn['active'] = false;
            console.log(checkIn)
            checkIn.save();
            await mongo.close();
            return res.json({code: 200, data: infor})
        }, next);
    });
};

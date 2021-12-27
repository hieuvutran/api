const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const hotelsSchema = require('../schemas/hotels.schema');
const mongo = require('../db');
const bcrypt = require('bcrypt');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/public-hotels',async (req, res, next) => {
        return await tryCatch(async () => {
            await mongo.open();
            const list = await hotelsSchema.find().populate('managerAcc').lean();
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });
    router.get('/hotels', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            if(req.user.role != 'admin'){
                query['managerAcc'] = req.user ? req.user.id : null;
            }
            await mongo.open();
            const list = await hotelsSchema.find(query).populate('managerAcc').lean();
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/hotels/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotel = await hotelsSchema.findById(id).lean();
            await mongo.close();
            return res.json({code: 200, data: hotel})
        }, next);
    });

    router.post('/hotels',employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'hotelName', 'managerAcc')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const hotel = new hotelsSchema(payload);
            const hotelSaves = await hotel.save();
            await mongo.close();
            return res.json({code: 200, data: hotelSaves})
        }, next);
    });

    router.put('/hotels/:id',employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const hotelUpdated = await hotelsSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: hotelUpdated})
        }, next);
    });

    router.delete('/hotels/:id',employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotel = await hotelsSchema.findById(id);
            if(!hotel){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await hotel.remove();
            await mongo.close();
            return res.json({code: 200, data: hotel})
        }, next);
    });
};
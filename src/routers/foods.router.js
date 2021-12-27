const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const foodsSchema = require('../schemas/foods.schema');
const mongo = require('../db');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/foods',async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            if(req.headers.hotelid){
                query['hotelId'] = req.headers.hotelid || null;
            }
            const list = await foodsSchema.find(query).lean();
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/foods/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            const detail = await foodsSchema.findOne({_id:id, hotelId}).lean();
            await mongo.close();
            return res.json({code: 200, data: detail})
        }, next);
    });

    router.post('/foods', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'foodName', 'foodType', 'unitPrice', 'quantity')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            const instance = new foodsSchema({...payload, hotelId});
            const saved = await instance.save();
            await mongo.close();
            return res.json({code: 200, data: saved})
        }, next);
    });

    router.put('/foods/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const updated = await foodsSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: updated})
        }, next);
    });

    router.delete('/foods/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const deleted = await foodsSchema.findById(id);
            if(!deleted){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await deleted.remove();
            await mongo.close();
            return res.json({code: 200, data: deleted})
        }, next);
    });
};
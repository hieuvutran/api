const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const eximHistorySchema = require('../schemas/exim-history.schema');
const foodsSchema = require('../schemas/foods.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/exim-history', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            let list = await eximHistorySchema.find(query).populate('productId').populate('createdBy').lean();
            if(list.length > 0){
                list = list.map(e => {
                    if(!e.productId){
                        return e;
                    }
                    if(e.type == 'furniture'){
                        e['productId']['name'] = e.productId.furName
                        return e;
                    }
                    e['productId']['name'] = e.productId.foodName
                    return e;
                })
            }
            await mongo.close()
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/exim-history/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            let detail = await eximHistorySchema.findById(id).populate('productId').populate('createdBy').lean();
            if(detail){
                if(detail.type == 'furniture'){
                    detail['productId']['name'] = detail.productId.furName
                }else{
                    detail['productId']['name'] = detail.productId.foodName
                }
            }
            await mongo.close();
            return res.json({code: 200, data: detail})
        }, next);
    });

    router.post('/exim-history', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'productId', 'type', 'quantity')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body;
            await mongo.open();
            if(body.type == 'foods'){
                const foodId = body.productId;
                const food = await foodsSchema.findById(foodId).lean();
                let quantity = Number(food.quantity) + Number(body.quantity);
                if(food){
                    await foodsSchema.findByIdAndUpdate(foodId, {...food, quantity: quantity});
                }
            }
            const instance = new eximHistorySchema(payload);
            const saved = await instance.save();
            await mongo.close();
            return res.json({code: 200, data: saved})
        }, next);
    });

    router.put('/exim-history/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body;
            await mongo.open();
            if(body.type && body.type == 'foods'){
                const foodId = body.productId;
                const food = await foodsSchema.findById(foodId).lean();
                let quantity = Number(food.quantity) + Number(body.quantity);
                if(food){
                    await foodsSchema.findByIdAndUpdate(foodId, {...food, quantity: quantity});
                }
            }
            const updated = await eximHistorySchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: updated})
        }, next);
    });

    router.delete('/exim-history/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const result = await eximHistorySchema.findById(id);
            if(!result){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await result.remove();
            await mongo.close();
            return res.json({code: 200, data: result})
        }, next);
    });
};
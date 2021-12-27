const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const fursSchema = require('../schemas/furniture.schema');
const mongo = require('../db');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/furnitures', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            let list = await fursSchema.find(query).populate('roomId').populate('furnitureTypeId').lean();
            if (req.headers.hotelid) {
                list = list.filter(item => item.hotelId == req.headers.hotelid)
            }
            await mongo.close();
            list = await list.map(async e => {
                if(e.qrCode) return e;
                let qr_code = await utils.generateQRCode({id: e._id});
                return {...e, qrCode: qr_code}
            })
            data = await Promise.all(list);
            return res.json({code: 200, data})
        }, next);
    });

    router.get('/furnitures/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const hotelId = req.headers.hotelid || null;
            let type = await fursSchema.findOne({_id:id }).populate('roomId').populate('furnitureTypeId').lean();
            await mongo.close();
            if(type){
                return res.json({code: 200, data: type})
            }
            let qr_code = await utils.generateQRCode({id: type._id});
            return res.json({code: 200, data: {...type, qrCode: qr_code}})
        }, next);
    });

    router.post('/furnitures', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const hotelId = req.headers.hotelid || null;
            const body = req.body;
            body.hotelId = hotelId;
            if(!utils.isRequired(body, 'furName', 'furnitureTypeId')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            const instance = new fursSchema({...payload});
            const saved = await instance.save();
            await mongo.close();
            let qr_code = await utils.generateQRCode({furId: saved._id});
            let data = saved;
            data.qrCode = qr_code;
            await fursSchema.findByIdAndUpdate(saved._id, {...saved, qrCode: qr_code})
            return res.json({code: 200, data})
        }, next);
    });

    router.put('/furnitures/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            const payload = body
            await mongo.open();
            let detail = await fursSchema.findById(id).lean();
            let detailJSON = JSON.parse(JSON.stringify(detail));
            let updated;
            let old = detailJSON.quantity ? detailJSON.quantity : 0;
            let quantity = old;
            if(payload.quantity){
                if(payload.isExport){
                    quantity = old - 1;
                    payload['updatedAt'] = Date.now()
                }else{
                    quantity = old +1;
                    payload['createdAt'] = Date.now()
                }
            }
            if(quantity < 0){
                throw new ValidationError("Không thể thực hiện", 400)
            }
            payload['quantity'] = quantity;
            updated = await fursSchema.findByIdAndUpdate(id, {...detailJSON,...payload, }, {new: true});
            await mongo.close();
            let updatedJSON = JSON.parse(JSON.stringify(updated));
            if(updatedJSON.qrCode){
                return res.json({code: 200, data: updatedJSON})
            }
            let qr_code = await utils.generateQRCode({id: updatedJSON._id});
            return res.json({code: 200, data: {...updatedJSON, qrCode: qr_code}})
        }, next);
    });

    router.delete('/furnitures/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const result = await fursSchema.findById(id);
            if(!result){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await result.remove();
            await mongo.close();
            return res.json({code: 200, data: result})
        }, next);
    });
};
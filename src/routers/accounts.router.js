const utils = require('../utils');
const {tryCatch} = require('../utils');
const ValidationError = require('../utils').ValidationError;
const accountsSchema = require('../schemas/accounts.schema');
const mongo = require('../db');
const bcrypt = require('bcrypt');
const constant = require('../constant/constant');
const {employee, manager, admin} = require('../routers/authorization');

module.exports = function(router){
    router.get('/accounts',async (req, res, next) => {
        return await tryCatch(async () => {
            let query = req.query || {};
            await mongo.open();
            const list = await accountsSchema.find(query).select('-password').lean();
            await mongo.close();
            return res.json({code: 200, data: list})
        }, next);
    });

    router.get('/accounts/:id',async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const account = await accountsSchema.findById(id).select('-password').lean();
            await mongo.close();
            return res.json({code: 200, data: account})
        }, next);
    });

    router.post('/accounts', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            if(!utils.isRequired(body, 'username', 'password', 'role')){
                throw new ValidationError("[payload] không hợp lệ", 400)
            }
            const passwordHashed = await bcrypt.hashSync(body.password, constant.SALT);
            const payload = {
                ...body,
                password: passwordHashed
            }
            await mongo.open();
            const isExists = await accountsSchema.findOne({username: body.username}).lean();
            if(isExists) throw new ValidationError("[username] đã tồn tại", 400)
            const account = new accountsSchema(payload);
            const accSaves = await account.save();
            await mongo.close();
            delete accSaves.password;
            return res.json({code: 200, data: accSaves})
        }, next);
    });

    router.put('/accounts/:id', employee,async (req, res, next) => {
        return await tryCatch(async () => {
            const body = req.body;
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            if(body.password){
                delete body.password;
            }
            const payload = body
            await mongo.open();
            const accountUpdated = await accountsSchema.findByIdAndUpdate(id, payload, {new: true});
            await mongo.close();
            return res.json({code: 200, data: accountUpdated})
        }, next);
    });

    router.delete('/accounts/:id',employee, async (req, res, next) => {
        return await tryCatch(async () => {
            const id = req.params.id;
            if(!id){
                throw new ValidationError("[id] không hợp lệ", 400)
            }
            await mongo.open();
            const account = await accountsSchema.findById(id);
            if(!account){
                throw new ValidationError("[id] không hợp lệ", 404)
            }
            await account.remove();
            await mongo.close();
            return res.json({code: 200, data: account})
        }, next);
    });
};
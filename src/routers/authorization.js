const jwt = require('jsonwebtoken');
const { SECRET_KEY, PUBLIC_ENDPOINT, ROLE_ENUM } = require('../constant/constant');
const {ValidationError} = require('../utils');
const accountsSchema = require('../schemas/accounts.schema');
const employeesSchema = require("../schemas/employee.schema");
const customersSchema = require("../schemas/customers.schema");
const mongo = require('../db');
const utils = require('../utils');

module.exports.publicApi = async (req, res, next) => {
    const url = req.originalUrl;
    const isPublic = Object.values(PUBLIC_ENDPOINT).indexOf(url);
    if(isPublic < 0){
        req.isPublic = false;
    }else{
        req.isPublic = true;
    }
    next()
}

module.exports.authenticate = async (req, res, next) => {
    try {
        if(req.isPublic || req.method == 'GET'){
            next();
            return;
        }
        if(!req.headers || !req.headers.authorization){
            return res.json({code: 403, message: "Token không hợp lệ"});
        }
        const accId = req.headers.authorization;
        if(!accId) throw new ValidationError("Lỗi xác thực", 403);
        await mongo.open();
        const account = await accountsSchema.findById(accId).lean();
        await mongo.close();
        if(!account){
            return res.json({code: 403, message: "Lỗi xác thực"});
        }
        const emp = await employeesSchema.findOne({ accId: accId }).lean();
        if(emp){
            req.user = {id: accId, role: account.role, emp: emp._id};
        }else{
            const cus = customersSchema.findOne({ accId: accId }).lean();
            req.user = {id: accId, role: "CUSTOMER", cus: cus._id};
        }
        next();
    } catch (error) {
        next(error);
    }
}

const handleAuthorization = async (req) => {
    if(!req.headers || !req.headers.authorization){
        throw new ValidationError("Token không hợp lệ",403);
    }
    const accId = req.headers.authorization;
    if(!accId) throw new ValidationError("Lỗi xác thực", 403);
    await mongo.open();
    const account = await accountsSchema.findById(accId).lean();
    await mongo.close();
    if(!account){
        throw new ValidationError("Lỗi xác thực",403);
    }
    const emp = await employeesSchema.findOne({ accId: accId }).lean();
    if(emp){
        return {id: accId, role: account.role, emp: emp._id, ...account};
    }else{
        const cus = customersSchema.findOne({ accId: accId }).lean();
        return {id: accId, role: "CUSTOMER", cus: cus._id, ...account};
    }
}

module.exports.employee = async (req, res, next) => {
    try {
        const authorizedInfo = await handleAuthorization(req)
        switch (authorizedInfo.role) {
            case ROLE_ENUM.employee:
            case ROLE_ENUM.manager:
            case ROLE_ENUM.admin:
                req.user = authorizedInfo;
                next();
                return;
        }
        throw new ValidationError("Bạn không có quyền nhân viên", 403)
    } catch (error) {
        next(error);
    }
}

module.exports.manager = async (req, res, next) => {
    try {
        const authorizedInfo = await handleAuthorization(req)
        switch (authorizedInfo.role) {
            case ROLE_ENUM.manager:
            case ROLE_ENUM.admin:
                req.user = authorizedInfo;
                next();
                return;
        }
        throw new ValidationError("Bạn không có quyền quản lý", 403)
    } catch (error) {
        next(error);
    }
}

module.exports.admin = async (req, res, next) => {
    try {
        const authorizedInfo = await handleAuthorization(req)
        if(ROLE_ENUM.admin == authorizedInfo.role){
            req.user = authorizedInfo;
            next();
        }else{
            throw new ValidationError("Bạn không có quyền admin", 403)
        }
    } catch (error) {
        next(error);
    }
}
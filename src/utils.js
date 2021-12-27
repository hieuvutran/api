const qrCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('./constant/constant');

module.exports.isRequired = (objectTarget, ...fields) => {
    for(const ele of fields){
        if(!objectTarget.hasOwnProperty(ele) || objectTarget[ele] === null || typeof(objectTarget[ele]) === 'undefined'){
            return false;
        }
    }
    return true;
}

class ValidationError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

module.exports.tryCatch = async (func, next) => {
    try {
        await func();
    } catch (error) {
        next(error);
    }
}

module.exports.ValidationError = ValidationError;

module.exports.generateQRCode = async (payload) => {
    return await qrCode.toDataURL(typeof payload !== 'string' ? JSON.stringify(payload) : payload).catch(err => '');
}

module.exports.generateToken = async (payload, expiresIn = 3600) => {
    const token = await jwt.sign(payload, SECRET_KEY, { expiresIn });
    return token;
}

module.exports.verifyToken = async (token) => {
    try {
        const decodedToken = jwt.verify(token, SECRET_KEY);
        return decodedToken;
    } catch (error) {
        throw new Error(error.message)
    }
}
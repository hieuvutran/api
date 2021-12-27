module.exports.ROLE_ENUM = {
    customer: "customer",
    employee: "employee",
    manager: "manager",
    admin: "admin"
}
module.exports.SALT = 12;
module.exports.SECRET_KEY = 'secret_key@!'

module.exports.BOOKING_STATUS_ENUM = {
    success: "thành công",
    failed: "thất bại",
    cancel: "hủy"
}

module.exports.ORDER_STATUS_ENUM = {
    success: "thành công",
    failed: "thất bại",
    cancel: "hủy"
}

module.exports.FOODS_TYPE_ENUM = {
    drink: "nước uống",
    food: "thức ăn"
}

module.exports.FOODS_STATUS_ENUM = {
    success: "thành công",
    failed: "thất bại",
    cancel: "hủy"
}

module.exports.PUBLIC_ENDPOINT = {
    AUTH_LOGIN: "/auth/login",
    AUTH_REFRESH_TOKEN: "/auth/refresh-token",
    CUSTOMER_CHECK_IN: "/customers/check-in",
    BOOKINGS: "/booking",
    ACCOUNTS: "/accounts",
    DETECT_IMAGE: "/detect-image"
}
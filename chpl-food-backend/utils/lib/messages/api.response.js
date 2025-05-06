const status = {
    OK: 200,
    CREATED: 201,
    NotModified: 304,
    BadRequest: 400,
    Unauthorized: 401,
    NotFound: 404,
    Forbidden: 403,
    NotAcceptable: 406,
    Conflict: 409,
    InternalServerError: 500,
};
const messages = {
    succ_login: 'Logged in successfully',
    err_login_failed: 'Login failed',
};

module.exports = {
    messages,
    status,
};

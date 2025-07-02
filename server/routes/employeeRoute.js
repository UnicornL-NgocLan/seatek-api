const express = require('express')
const router = express.Router()
const { rateLimit } = require('express-rate-limit')
const {
    authenticateEmployeeKey,
} = require('../middlewares/checkForEmployeeApiKey')
const employeeCtrl = require('../controllers/employee')
const odooAuthorize = require('../middlewares/authorizeOdoo')

const limiter = rateLimit({
    windowMs: 60 * 1000, // 2 minutes
    limit: 15, // Limit each IP to 25 requests per `window` (here, per 1 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: true, // Disable the `X-RateLimit-*` headers.
    handler: function (req, res) {
        res.status(429).send({
            status: 500,
            message: 'Quá nhiều yêu cầu được gửi! Vui lòng thử lại sau ít phút',
        })
    },
    validate: {
        xForwardedForHeader: false,
        default: true,
    },
})

router.get(
    '/get-employee-birthday-list',
    limiter,
    authenticateEmployeeKey,
    employeeCtrl.getEmployeeBirthdayList
)
router.get(
    '/get-employee-change-by-month',
    limiter,
    authenticateEmployeeKey,
    employeeCtrl.getEmployeeChangeByMonth
)
router.patch(
    '/update-employee-partner-list',
    limiter,
    authenticateEmployeeKey,
    odooAuthorize,
    employeeCtrl.updateContactBasedOnEmployeeStatus
)
router.post(
    '/process-employee-inter-database',
    limiter,
    authenticateEmployeeKey,
    odooAuthorize,
    employeeCtrl.processCaseEmployeeInterDatabase
)

module.exports = router

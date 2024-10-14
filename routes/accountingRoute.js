const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const {authenticateKey} = require("../middlewares/checkForApiKey");
const accountingDataCtrl = require("../controllers/accounting")


const limiter = rateLimit({
	windowMs: 60 * 1000, // 2 minutes
	limit: 15, // Limit each IP to 25 requests per `window` (here, per 1 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: true, // Disable the `X-RateLimit-*` headers.
	handler: function (req, res) {
    res.status(429).send({
        status: 500,
        message: 'Quá nhiều yêu cầu được gửi! Vui lòng thử lại sau ít phút',
    });
    },
})

router.get("/calculate-accounting-report-lines",limiter,authenticateKey,accountingDataCtrl.calculateAccountingReportLine);

module.exports = router
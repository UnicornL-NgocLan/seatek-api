const Odoo = require('odoo-xmlrpc')

const odooAuthorize = async (req, res, next) => {
    try {
        const isTest = req.query.is_test === 'true'
        const odoo = new Odoo({
            url: isTest ? process.env.ODOO_TEST_HOST : process.env.ODOO_HOST,
            db: isTest
                ? process.env.ODOO_TEST_DATABASE
                : process.env.ODOO_DATABASE,
            username: process.env.ODOO_USERNAME,
            password: process.env.ODOO_PASSWORD,
        })

        const odoo_retail = new Odoo({
            url: isTest
                ? process.env.ODOO_TEST_RETAIL_HOST
                : process.env.ODOO_RETAIL_HOST,
            db: isTest
                ? process.env.ODOO_TEST_RETAIL_DATABASE
                : process.env.ODOO_RETAIL_DATABASE,
            username: process.env.ODOO_RETAIL_USERNAME,
            password: process.env.ODOO_RETAIL_PASSWORD,
        })

        const odoo_pos_tool = new Odoo({
            url: isTest ? process.env.ODOO_TEST_HOST : process.env.ODOO_HOST,
            db: isTest
                ? process.env.ODOO_TEST_DATABASE
                : process.env.ODOO_DATABASE,
            username: process.env.ODOO_POS_TOOL_USERNAME,
            password: process.env.ODOO_POS_TOOL_PASSWORD,
        })

        const odoo_retail_pos_tool = new Odoo({
            url: isTest
                ? process.env.ODOO_TEST_RETAIL_HOST
                : process.env.ODOO_RETAIL_HOST,
            db: isTest
                ? process.env.ODOO_TEST_RETAIL_DATABASE
                : process.env.ODOO_RETAIL_DATABASE,
            username: process.env.ODOO_RETAIL_POS_TOOL_USERNAME,
            password: process.env.ODOO_POS_TOOL_PASSWORD,
        })

        const connectToOdoo = (odooInstance) =>
            new Promise((resolve, reject) => {
                odooInstance.connect((err) => {
                    if (err) return reject(err)
                    return resolve(odooInstance)
                })
            })
        const [odoo1, odooRetail, odooPosTool, odooRetailPosTool] =
            await Promise.all([
                connectToOdoo(odoo),
                connectToOdoo(odoo_retail),
                connectToOdoo(odoo_pos_tool),
                connectToOdoo(odoo_retail_pos_tool),
            ])
        req.odoo = odoo1
        req.odoo_retail = odooRetail
        req.odoo_pos_tool = odooPosTool
        req.odoo_retail_pos_tool = odooRetailPosTool
        return next()
    } catch (err) {
        res.status(500).json({ msg: err.message })
    }
}

module.exports = odooAuthorize

const Odoo = require('odoo-xmlrpc')

const odooAuthorize = async (req, res, next) => {
    try {
        const odoo = new Odoo({
            url: process.env.ODOO_HOST,
            db: process.env.ODOO_DATABASE,
            username: process.env.ODOO_USERNAME,
            password: process.env.ODOO_PASSWORD,
        })

        const odoo_retail = new Odoo({
            url: process.env.ODOO_RETAIL_HOST,
            db: process.env.ODOO_RETAIL_DATABASE,
            username: process.env.ODOO_RETAIL_USERNAME,
            password: process.env.ODOO_RETAIL_PASSWORD,
        })

        const odoo_pos_tool = new Odoo({
            url: process.env.ODOO_RETAIL_HOST,
            db: process.env.ODOO_RETAIL_DATABASE,
            username: process.env.ODOO_POS_TOOL_USERNAME,
            password: process.env.ODOO_POS_TOOL_PASSWORD,
        })

        const connectToOdoo = (odooInstance) =>
            new Promise((resolve, reject) => {
                odooInstance.connect((err) => {
                    if (err) return reject(err)
                    return resolve(odooInstance)
                })
            })
        const [odoo1, odooRetail, odooPosTool] = await Promise.all([
            connectToOdoo(odoo),
            connectToOdoo(odoo_retail),
            connectToOdoo(odoo_pos_tool),
        ])
        req.odoo = odoo1
        req.odoo_retail = odooRetail
        req.odoo_pos_tool = odooPosTool
        return next()
    } catch (err) {
        res.status(500).json({ msg: err.message })
    }
}

module.exports = odooAuthorize

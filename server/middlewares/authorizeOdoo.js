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

        const connectToOdoo = (odooInstance) =>
            new Promise((resolve, reject) => {
                odooInstance.connect((err) => {
                    if (err) return reject(err)
                    return resolve(odooInstance)
                })
            })
        const [odoo1, odooRetail] = await Promise.all([
            connectToOdoo(odoo),
            connectToOdoo(odoo_retail),
        ])
        req.odoo = odoo1
        req.odoo_retail = odooRetail
        return next()
    } catch (err) {
        res.status(500).json({ msg: err.message })
    }
}

module.exports = odooAuthorize

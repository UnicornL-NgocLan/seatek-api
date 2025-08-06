const pdfParse = require('pdf-parse')
const { extractPdfImageFromOCR } = require('../utils/ocrProcess.js')
const fs = require('fs')
const puppeteer = require('puppeteer')

const metabaseTodaySaleUrl = process.env.TODAY_SALE_METABASE_DASHBOARD

const fileProcessCtrl = {
    extractTextFromPdf: async (req, res) => {
        try {
            if (!req.file) return res.status(400).send('No file uploaded!')
            let result = ''
            // Extract text from PDF buffer
            const buffer = fs.readFileSync(req.file.path)
            const data = await pdfParse(buffer)
            if (data.text.trim()) {
                result = data.text
            } else {
                result = await extractPdfImageFromOCR(buffer)
            }
            // Send extracted text as response
            res.send({
                extractedText: result,
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        } finally {
            if (req.file) {
                fs.unlink(req.file.path, (err) => {
                    if (err)
                        console.error('Failed to delete uploaded file:', err)
                    else console.log('Temporary file deleted.')
                })
            }
        }
    },

    exportPdfFromMetabase: async (req, res) => {
        const { code } = req.query
        let myRespectiveUrl = ''

        switch (code) {
            case 'todaysale':
                myRespectiveUrl = metabaseTodaySaleUrl
                break
            default:
                return res.status(400).send('Invalid code')
        }

        let browser
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            })

            const page = await browser.newPage()
            await page.goto(myRespectiveUrl, { waitUntil: 'networkidle0' })

            await new Promise((resolve) => setTimeout(resolve, 2000))

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                landscape: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                },
            })

            await browser.close()

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="dashboard.pdf"',
                'Content-Length': pdfBuffer.length,
            })

            return res.end(pdfBuffer) // <-- Fix chỗ này
        } catch (error) {
            if (browser) await browser.close()
            console.error('Lỗi khi tạo PDF:', error)
            return res.status(500).send('Lỗi khi tạo PDF')
        }
    },
}

module.exports = fileProcessCtrl

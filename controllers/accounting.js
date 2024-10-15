const Pool = require('pg').Pool;
const dateIsValid = require("../utils/dateValidator")
const {calculateDUNO,calculateDUCO,calculatePSCO,calculatePSNO,calculatePSDU,calculateDuNoByPartner,calculateDuCoByPartner} = require("../utils/calculateValueForAccountingReport")

// Database connection configuration
const dbConfig = {
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	host: process.env.PGHOST,
	port: process.env.PGPORT,
	database: process.env.PGDATABASE,
};

// Create a new PostgreSQL client
const pool = new Pool(dbConfig);


const accountingDataCtrl = {
    calculateAccountingReportLine: async (req,res) => {
        try {
            // const {companyId} = req.body;
            const {companyId, reportType,date} = req.query;
            if(!companyId || !reportType || !date) return res.status(400).json({msg:"Vui lòng cung cấp đầy đủ thông tin"})
            if(!Number.isInteger(parseInt(companyId)) || companyId <= 0) return res.status(400).json({msg:"Id của công ty phải là số nguyên dương"});
            if(typeof reportType !== 'string') return res.status(400).json({msg:"Kiểu của báo cáo phải là kiểu chuỗi"});
            if(typeof reportType !== 'string' || !dateIsValid(date))  return res.status(400).json({msg:"Kiểu ngày phải là dạng YYYY/MM/DD"});

            const loopLimit = 1000;

            // Lay cac vn_report_formula cho vn_report_line
            const query = `
                select 
                    vrf.id,
                    vrf.type, 
                    vrf.code, 
                    vrf.account, 
                    vrf.ctp_account, 
                    vrf.vn_report_line_id, 
                    vrc.method, 
                    vrf.vn_report_line_id_parent
                from vn_report_formula vrf
                left join vn_report_code vrc on vrc.id = vrf.code
                join vn_report_line vrl on vrl.id = vrf.vn_report_line_id
                where vrf.company_id = $1
                and vrl.report = $2
            `

            const preparedQuery = {
                text: query,
                values: [companyId,reportType]
            };

            const vnReportFormulaLines = await pool.query(preparedQuery);
            // Lay nhung vn_report_formula thuoc vn_report_line dang chi tiet
            let processedReportFormulaForDetail = [...vnReportFormulaLines.rows].filter(i => !i.vn_report_line_id_parent && i.code);

            // Tính giá trị cho các dòng vn_report_formula cho cho vn_report_line dạng chi tiết
            for (const line of vnReportFormulaLines.rows){
                let value = 0;
                const plusOrMinus = line.type === 'plus' ? 1 : -1;
                switch(line.method){
                    case 'du_no':
                        const newData = await calculateDUNO(pool,companyId,line.account,date) * plusOrMinus;
                        value = newData;
                        break;
                    case 'du_co':
                        const newData1 = await calculateDUCO(pool,companyId,line.account,date) * plusOrMinus;
                        value = newData1;
                        break;
                    case 'phat_sinh_co':
                        const newData2 = await calculatePSCO(pool,companyId,line.account,date) * plusOrMinus;
                        value = newData2;
                        break;
                    case 'phat_sinh_no':
                        const newData3 = await calculatePSNO(pool,companyId,line.account,date) * plusOrMinus;
                        value = newData3;
                        break;
                    case 'phat_sinh_du':
                        const newData4 = await calculatePSDU(pool,companyId,line.account,line.ctp_account,date) * plusOrMinus;
                        value = newData4;
                        break;
                    case 'du_no_doi_tuong':
                        const newData5 = await calculateDuNoByPartner(pool,companyId,line.account,date) * plusOrMinus;
                        value = newData5;
                        break;
                    case 'du_co_doi_tuong':
                        const newData6 =  await calculateDuCoByPartner(pool,companyId,line.account,date) * plusOrMinus;
                        value = newData6;
                        break;
                    default:
                        value = 0;
                        break;
                }
                processedReportFormulaForDetail = [...processedReportFormulaForDetail].map(i => i.id === line.id ? {...i,value} : i)
            }
            // Lay tat ca cac vn_report_line
            const queryForReportLineDetail = `
                select 
                    vrl.id,
                    vrl.type,
                    vrl.stt
                from vn_report_line vrl
                where vrl.company_id = $1
                and vrl.report = $2
            `
            const preparedQuery2 = {
                text: queryForReportLineDetail,
                values: [companyId,reportType]
            };

            const reportLineDetail = await pool.query(preparedQuery2);
            // Lay nhung vn_report_line dang chi tiet
            let processedReportLineDetail = [...reportLineDetail.rows].filter(i => i.type === 'detail');
            // Tinh gia tri cho cac vn_report_line dang chi tiet
            for (const line of reportLineDetail.rows){
                let value = 0;
                const respectiveFormulaLines = [...processedReportFormulaForDetail].filter(i => i.vn_report_line_id === line.id);
                for (const formulaLine of respectiveFormulaLines){
                    if(formulaLine.value !== undefined){
                        value += formulaLine.value;
                    }
                }
                processedReportLineDetail = [...processedReportLineDetail].map(i => i.id === line.id ? {...i,value} : i)
            }
            // Tinh gia tri cho cac vn_report_line dang tong hop
            let processedReportLineAggregate = [...reportLineDetail.rows].filter(i => i.type === 'synthetic');
            //Chay vong lap de tinh gia tri nhung vn_report_line dang tong hop, ngung vong lap khi cac vn_report_line
            // dang tong hop da co gia tri

            // So lan lap -> Trong truong hop xay ra tinh huong lap vo han, dua vao so lan lap de thoat khoi vong lap
            let loopTime = 0;
            while(![...processedReportLineAggregate].every(i => i.value !== undefined)){
                for (const line of processedReportLineAggregate){
                    // Neu report_vn_line nao da co gia tri thi bo qua
                    if(line.value) continue;
                    // Lay danh sach cac formula line thuoc report_vn_line dang xet
                    let respectiveFormulaLines = [...vnReportFormulaLines.rows].filter(i => i.vn_report_line_id === line.id);
                    let totalValue = 0;
                    let allHasValue = true;

                    // Nếu như line nào mà không có cấu hình công thức thì mặc định giá trị = 0
                    if (respectiveFormulaLines.length === 0){
                        processedReportLineAggregate = [...processedReportLineAggregate].map(i => i.id === line.id ? {...i,value:totalValue} : i);
                    }
                    // Chay vong lap de tinh gia tri cua tung dong

                    for(const formulaLine of respectiveFormulaLines){
                        // lay report_line dc tro den trong formula line dang xet
                        const reportLine = [...processedReportLineAggregate,...processedReportLineDetail].find(i => i.id === formulaLine.vn_report_line_id_parent);
                        if(reportLine && reportLine.value !== undefined){
                            totalValue += reportLine.value;
                        } else {
                            allHasValue = false;
                        }
                    }
                    if(!allHasValue) continue;
                    processedReportLineAggregate = [...processedReportLineAggregate].map(i => i.id === line.id ? {...i,value:totalValue} : i);
                }
                // Neu so lan lap cham nguong gioi han, vong lap bi pha huy
                loopTime += 1;
                if(loopTime >= loopLimit) break;
            }

            const finalResult = [...processedReportLineAggregate,...processedReportLineDetail].sort((a,b) => a.id - b.id);

            res.status(200).json({data:finalResult})
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }
}

module.exports = accountingDataCtrl;
const Pool = require('pg').Pool;
const _ = require('lodash');
const dateIsValid = require("../utils/dateValidator")
const {getEmployeeChangeByCompany,getChangeQuantityByCompany,getTotalEmployeeByCompany} = require("../utils/getEmployeeChangeByCompany");

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


const employeeCtrl = {
    getEmployeeBirthdayList: async (req,res) => {
        try {
            const {month} = req.query;
            if(!month) return res.status(400).json({msg:"Vui lòng cung cấp đầy đủ thông tin"})
            if (!_.isInteger(Number(month))) return res.status(400).json({msg:"Dữ liệu phải là số nguyên"});
            if(month < 1 || month > 12) return res.status(400).json({msg:"Tháng phải đúng khoảng cho phép"});

            const query = `
                select                     
                    hemc.s_identification_id as ma_sc,                     
                    he.name as ho_ten,                     
                    hd.name as phong_ban,                     
                    rc.name as cong_ty,                     
                    hj.name as chuc_vu,                     
                    hemc.joining_date as ngay_nhan_viec,                     
                    case when he.gender = 'male' then 'Nam' else 'Nữ' END as gioi_tinh,                     	
                    he.birthday as ngay_sinh,                     
                    he.acc_number as so_tai_khoan,                     
                    he.acc_holder_name as chu_tai_khoan,                     
                    rb.name as ten_ngan_hang,                     
                    hemc.company_id as company_id                 
                from                      
                    hr_employee_multi_company hemc                 
                join hr_employee he on hemc.name = he.id                 
                left join hr_department hd on hd.id = hemc.department_id                 
                join res_company rc on rc.id = hemc.company_id                 
                left join hr_job hj on hj.id = hemc.job_id                 
                left join res_bank rb on rb.id = he.bank_id                 
                where                      
                    hemc.primary_company is true                     
                    and hemc.active is true                     
                    and hemc.employee_current_status != 'resigned'                     
                    and EXTRACT(MONTH FROM he.birthday::DATE) = $1
            `

            const preparedQuery = {
                text: query,
                values: [month]
            };

            const data = await pool.query(preparedQuery);

            res.status(200).json({data: data.rows})
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getEmployeeChangeByMonth: async (req,res) => {
        try {
            const {month,year,toDate} = req.query;
            if(!month || !year) return res.status(400).json({msg:"Dữ diệu phải cung cấp đầy đủ"})
            if (!_.isInteger(Number(month)) || !_.isInteger(Number(year))) return res.status(400).json({msg:"Các dữ liệu phải là số nguyên"});
            if (month > 12 || month <1) return res.status(400).json({msg:"Dữ liệu tháng phải hợp lệ"});
            if(!dateIsValid(toDate)) return res.status(400).json({msg:"Kiểu ngày phải là YYYY-MM-DD"})

            const query = `
                select                     
                    id           
                from                      
                    res_company
                where                      
                    active = true
                    and parent_id is not null
                    
            `

            const preparedQuery = {
                text: query,
            };

            const {rows:companyList} = await pool.query(preparedQuery);
            const apiLanes = [...companyList].map(async(com)=>{
                return getEmployeeChangeByCompany(pool,com.id)
            });

            const apiLanes2 = [...companyList].map(async(com)=>{
                return getChangeQuantityByCompany(pool,com.id,month,year,toDate)
            });

            const apiLanes3 = [...companyList].map(async(com)=>{
                return getTotalEmployeeByCompany(pool,com.id,toDate)
            });

            const result = await Promise.all(apiLanes);
            const result2 = await Promise.all(apiLanes2);
            const result3 = await Promise.all(apiLanes3);

            res.status(200).json({data:{employeeDetail:result,changeQuantity:result2,totalEmployee:result3}})
        } catch (error) {
            res.status(500).json({ msg: error.message }); 
        }
    }
}

module.exports = employeeCtrl;
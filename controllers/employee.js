const Pool = require('pg').Pool;
const dateIsValid = require("../utils/dateValidator");


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

const employeeDataCtrl = {
    getEmployeeBirthdayList: async(req,res) => {
        try {
            const {month} = req.query;
            if(!Number.isInteger(parseInt(month))) return res.status(400).json({msg:"Kiểu dữ liệu tháng phải là số nguyên"});
            if(month <1 || month > 12) return res.status(400).json({msg:"Giá trị phải từ 1 đến 12"});

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

            const employeeBirthdayList = await pool.query(preparedQuery);
            
            const groupBykey = 'company_id'
            const groupByList = employeeBirthdayList.rows.reduce((rv, x)=>{
                (rv[x[groupBykey]] = rv[x[groupBykey]] || []).push(x);
                return rv;
            },{})
            res.status(200).json({data:groupByList})
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }
}

module.exports = employeeDataCtrl;
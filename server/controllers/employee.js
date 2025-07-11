const Pool = require('pg').Pool
const _ = require('lodash')
const dateIsValid = require('../utils/dateValidator')
const {
    getEmployeeChangeByCompany,
    getChangeQuantityByCompany,
    getTotalEmployeeByCompany,
    getEmployeeData,
    addCompaniesToEmployee,
    createHrEmployee,
    hangeChangeUserCompany,
    getHrEmployeeMultiCompany,
    updateHrEmployeeMultiCompany,
} = require('../utils/getEmployeeChangeByCompany')
const checkIfEmployeeWorkingOrNot = require('../utils/checkIfEmployeeInorOut')

// Database connection configuration
const dbConfig = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
}

const dbRetailConfig = {
    user: process.env.PGUSER_RETAIL,
    password: process.env.PGPASSWORD_RETAIL,
    host: process.env.PGHOST_RETAIL,
    port: process.env.PGPORT_RETAIL,
    database: process.env.PGDATABASE_RETAIL,
}

// Create a new PostgreSQL client
const pool = new Pool(dbConfig)
const retailPool = new Pool(dbRetailConfig)

const employeeCtrl = {
    getEmployeeBirthdayList: async (req, res) => {
        try {
            const { month } = req.query
            if (!month)
                return res
                    .status(400)
                    .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
            if (!_.isInteger(Number(month)))
                return res
                    .status(400)
                    .json({ msg: 'Dữ liệu phải là số nguyên' })
            if (month < 1 || month > 12)
                return res
                    .status(400)
                    .json({ msg: 'Tháng phải đúng khoảng cho phép' })

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
                    and hemc.company_id != 30
            `
            const queryRetail = `
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
                    and hemc.company_id = 30
            `

            const preparedQuery = {
                text: query,
                values: [month],
            }

            const preparedQueryRetail = {
                text: queryRetail,
                values: [month],
            }

            const data = await pool.query(preparedQuery)
            const data2 = await retailPool.query(preparedQueryRetail)
            res.status(200).json({
                data: [...data.rows, ...data2.rows],
                retailData: data2.rows,
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    },

    getEmployeeChangeByMonth: async (req, res) => {
        try {
            const { month, year, toDate } = req.query
            if (!month || !year)
                return res
                    .status(400)
                    .json({ msg: 'Dữ diệu phải cung cấp đầy đủ' })
            if (!_.isInteger(Number(month)) || !_.isInteger(Number(year)))
                return res
                    .status(400)
                    .json({ msg: 'Các dữ liệu phải là số nguyên' })
            if (month > 12 || month < 1)
                return res
                    .status(400)
                    .json({ msg: 'Dữ liệu tháng phải hợp lệ' })
            if (!dateIsValid(toDate))
                return res
                    .status(400)
                    .json({ msg: 'Kiểu ngày phải là YYYY-MM-DD' })

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
            }

            const { rows: companyList } = await pool.query(preparedQuery)
            const apiLanes = [...companyList]
                .filter((i) => i.id !== 30)
                .map(async (com) => {
                    return getEmployeeChangeByCompany(pool, com.id)
                })

            const apiLanes4 = [...companyList]
                .filter((i) => i.id === 30)
                .map(async (com) => {
                    return getEmployeeChangeByCompany(retailPool, com.id)
                })

            const apiLanes2 = [...companyList]
                .filter((i) => i.id !== 30)
                .map(async (com) => {
                    return getChangeQuantityByCompany(
                        pool,
                        com.id,
                        month,
                        year,
                        toDate
                    )
                })

            const apiLanes5 = [...companyList]
                .filter((i) => i.id === 30)
                .map(async (com) => {
                    return getChangeQuantityByCompany(
                        retailPool,
                        com.id,
                        month,
                        year,
                        toDate
                    )
                })

            const apiLanes3 = [...companyList]
                .filter((i) => i.id !== 30)
                .map(async (com) => {
                    return getTotalEmployeeByCompany(pool, com.id, toDate)
                })

            const apiLanes6 = [...companyList]
                .filter((i) => i.id === 30)
                .map(async (com) => {
                    return getTotalEmployeeByCompany(retailPool, com.id, toDate)
                })

            const result = await Promise.all(apiLanes)
            const result2 = await Promise.all(apiLanes2)
            const result3 = await Promise.all(apiLanes3)

            const result4 = await Promise.all(apiLanes4)
            const result5 = await Promise.all(apiLanes5)
            const result6 = await Promise.all(apiLanes6)

            res.status(200).json({
                data: {
                    employeeDetail: [...result, ...result4],
                    changeQuantity: [...result2, ...result5],
                    totalEmployee: [...result3, ...result6],
                },
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    },

    updateContactBasedOnEmployeeStatus: async (req, res) => {
        try {
            const odoo = req.odoo
            const odoo_retail = req.odoo_retail

            // const [employeeDataRetail, employeeDataRemaining] =
            //     await Promise.all([
            //         getNumberOfEmployees(odoo_retail, true),
            //         getNumberOfEmployees(odoo, false),
            //     ])

            // const companyList = [9]
            // const priceListOfCompanies = [{ company_id: 9, priceList: 509 }]

            // for (const companyId of companyList) {
            //     const partnerList = await getEmployeeCustomerPartner(
            //         odoo,
            //         companyId
            //     )
            //     const [toDeActivate, toActivate, toAddNew] =
            //         checkIfEmployeeWorkingOrNot(
            //             [...employeeDataRetail, ...employeeDataRemaining],
            //             partnerList
            //         )
            //     const listToDeActivate = toDeActivate.map((i) => {
            //         return changeEmployeeStatus(odoo, false, i.id)
            //     })

            //     const listToActivate = toActivate.map((i) => {
            //         return changeEmployeeStatus(odoo, true, i.id)
            //     })

            //     // const listToCreateNewParner = toAddNew.map((i) =>
            //     //     createNewRespartner(odoo, {
            //     //         name: i.name[1],
            //     //         sea_business_code: `SeaGroup_${i.id}_${i.s_identification_id}`,
            //     //         ref: i.s_identification_id,
            //     //         customer: true,
            //     //         mark_as_todo: true,
            //     //         pricelist_id: priceListOfCompanies.find(
            //     //             (item) => item.company_id === companyId
            //     //         )?.priceList,
            //     //         custom_type_id: 3,
            //     //     })
            //     // )

            //     await Promise.all([...listToDeActivate, ...listToActivate])
            // }

            res.status(200).json({
                msg: 'Đã cập nhật thành công',
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    },

    processCaseEmployeeInterDatabase: async (req, res) => {
        try {
            const { current_employee_id, isRetailCurrentDB, currentDBName } =
                req.body
            if (
                !currentDBName ||
                !['opensea12pro', 'opensea12retail'].includes(currentDBName)
            )
                return res.status(403).json({
                    error: true,
                    msg: 'Đảm bảo cung cấp đúng tên database hợp lệ',
                })
            if (!current_employee_id)
                return res.status(400).json({
                    error: true,
                    msg: 'Hãy cung cấp ID của nhân viên',
                })
            if (typeof isRetailCurrentDB !== 'boolean')
                return res.status(400).json({
                    error: true,
                    msg: 'Hãy xác định database hiện tại có phải Retail',
                })

            const odoo = req.odoo
            const odoo_retail = req.odoo_retail
            const [currentDomain, counterpartDomain] = isRetailCurrentDB
                ? [odoo_retail, odoo]
                : [odoo, odoo_retail]
            const hr_tool_id = isRetailCurrentDB ? 1861 : 1864

            // Get current employee data
            const currentEmployee = await getEmployeeData(
                currentDomain,
                current_employee_id,
                null
            )
            if (!currentEmployee.length)
                return res.status(400).json({
                    error: true,
                    msg: 'Nhân viên không tìm thấy ở database hiện tại!',
                })
            const emp = currentEmployee[0]

            // Check if user already exists in the counterpart DB
            const counterpartResult = await getEmployeeData(
                counterpartDomain,
                current_employee_id,
                emp
            )

            // Helper to sync multi-company info
            const syncMultiCompany = async (
                sourceDomain,
                targetDomain,
                sourceId,
                targetId
            ) => {
                const [sourceList, targetList] = await Promise.all([
                    getHrEmployeeMultiCompany(sourceDomain, sourceId),
                    getHrEmployeeMultiCompany(targetDomain, targetId),
                ])
                for (const targetMulti of targetList) {
                    const match = sourceList.find(
                        (i) =>
                            i.s_identification_id ===
                                targetMulti.s_identification_id &&
                            i.company_id[0] === targetMulti.company_id[0]
                    )
                    if (match) {
                        await hangeChangeUserCompany(
                            targetDomain,
                            1,
                            hr_tool_id
                        )
                        await updateHrEmployeeMultiCompany(
                            targetDomain,
                            targetMulti.id,
                            {
                                primary_company: match.primary_company,
                                joining_date: match.joining_date,
                                resignation_date: match.resignation_date,
                                employee_current_status:
                                    match.employee_current_status,
                            }
                        )
                    }
                }
            }

            if (counterpartResult.length > 0) {
                // Update companies for existing employee in counterpart DB
                await addCompaniesToEmployee(
                    counterpartDomain,
                    counterpartResult[0].id,
                    [...emp.sea_company_ids]
                )
                await syncMultiCompany(
                    currentDomain,
                    counterpartDomain,
                    current_employee_id,
                    counterpartResult[0].id
                )
            } else {
                // Prepare employee data for creation
                const {
                    name,
                    company_id,
                    s_identification_id,
                    country_id,
                    birthday,
                    place_of_birth,
                    country_of_birth,
                    main_phone_number,
                    sea_permanent_addr,
                    permanent_country_id,
                    permanent_city_id,
                    permanent_district_id,
                    sea_temp_addr,
                    temporary_country_id,
                    temporary_city_id,
                    temporary_district_id,
                    identification_id,
                    sea_id_issue_date,
                    id_issue_place,
                    id_expiry_date,
                    passport_id,
                    gender,
                    marital,
                    study_field,
                    seagroup_join_date,
                    sea_company_ids,
                } = emp
                const myEmployeeData = {
                    name,
                    company_id: company_id[0],
                    s_identification_id,
                    country_id: country_id[0],
                    birthday,
                    place_of_birth,
                    country_of_birth: country_of_birth[0],
                    main_phone_number,
                    sea_permanent_addr,
                    permanent_country_id: permanent_country_id[0],
                    permanent_city_id: permanent_city_id[0],
                    permanent_district_id: permanent_district_id[0],
                    sea_temp_addr,
                    temporary_country_id: temporary_country_id[0],
                    temporary_city_id: temporary_city_id[0],
                    temporary_district_id: temporary_district_id[0],
                    identification_id,
                    sea_id_issue_date,
                    id_issue_place: id_issue_place[0],
                    id_expiry_date,
                    passport_id,
                    gender,
                    marital,
                    study_field,
                    seagroup_join_date,
                }

                await hangeChangeUserCompany(
                    counterpartDomain,
                    company_id[0],
                    hr_tool_id
                )
                const newEmployeeId = await createHrEmployee(
                    counterpartDomain,
                    myEmployeeData
                )

                await hangeChangeUserCompany(counterpartDomain, 1, hr_tool_id)
                // Add companies to new employee (excluding main company)
                const currentWorkingCompany = sea_company_ids.filter(
                    (i) => i !== company_id[0]
                )
                if (currentWorkingCompany.length > 0) {
                    await addCompaniesToEmployee(
                        counterpartDomain,
                        newEmployeeId,
                        currentWorkingCompany
                    )
                }
                await syncMultiCompany(
                    currentDomain,
                    counterpartDomain,
                    current_employee_id,
                    newEmployeeId
                )
            }
            res.status(200).json({ success: true, msg: 'Đã xử lý thành công!' })
        } catch (error) {
            res.status(500).json({ error: true, msg: error.message })
        }
    },
}

module.exports = employeeCtrl

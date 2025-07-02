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
            const { current_employee_id, isRetailCurrentDB, listCompanyAdded } =
                req.body

            if (!current_employee_id)
                return res
                    .status(400)
                    .json({ error: true, msg: 'Hãy cung cấp id của nhân viên' })
            if (isRetailCurrentDB === undefined)
                return res.status(400).json({
                    error: true,
                    msg: 'Hãy xác định database hiện tại có phải Retail',
                })
            if (listCompanyAdded === undefined)
                return res.status(400).json({
                    error: true,
                    msg: 'Vui lòng cung cấp danh sách công ty được thêm vào',
                })
            const odoo = req.odoo
            const odoo_retail = req.odoo_retail

            // Mục đích kiểm tra xem nhân viên đó đã được tạo trước khi tách database chưa?
            let isUserAlreadyExisted = false

            let domainTogetCounterpartEmployee = isRetailCurrentDB
                ? odoo
                : odoo_retail

            let domainTogetCurrentEmployee = isRetailCurrentDB
                ? odoo_retail
                : odoo

            const currentEmployee = await getEmployeeData(
                domainTogetCurrentEmployee,
                current_employee_id,
                null
            )

            if (currentEmployee.length === 0)
                return res.status(400).json({
                    error: true,
                    msg: 'Nhân viên không tìm thấy ở database hiện tại!',
                })
            // Kiểm tra xem user đã có ở database còn lại ?
            const result = await getEmployeeData(
                domainTogetCounterpartEmployee,
                current_employee_id,
                currentEmployee[0]
            )

            isUserAlreadyExisted = result.length === 0 ? false : true
            if (isUserAlreadyExisted) {
                // Nếu nhân viên đã có ở database còn lại thì sẽ cập nhật lại thông tin
                let myNewCompanyList = [
                    ...result[0].sea_company_ids,
                    ...listCompanyAdded,
                ]
                await addCompaniesToEmployee(
                    domainTogetCounterpartEmployee,
                    result[0].id,
                    myNewCompanyList
                )
            } else {
                // Nếu nhân viên chưa có ở database còn lại thì sẽ tạo mới
                const myEmployeeData = {
                    name: currentEmployee[0].name,
                    company_id: currentEmployee[0].company_id[0],
                    s_identification_id: currentEmployee[0].s_identification_id,
                    country_id: currentEmployee[0].country_id[0],
                    birthday: currentEmployee[0].birthday,
                    place_of_birth: currentEmployee[0].place_of_birth,
                    country_of_birth: currentEmployee[0].country_of_birth[0],
                    main_phone_number: currentEmployee[0].main_phone_number,
                    sea_permanent_addr: currentEmployee[0].sea_permanent_addr,
                    permanent_country_id:
                        currentEmployee[0].permanent_country_id[0],
                    permanent_city_id: currentEmployee[0].permanent_city_id[0],
                    permanent_district_id:
                        currentEmployee[0].permanent_district_id[0],
                    sea_temp_addr: currentEmployee[0].sea_temp_addr,
                    temporary_country_id:
                        currentEmployee[0].temporary_country_id[0],
                    temporary_city_id: currentEmployee[0].temporary_city_id[0],
                    temporary_district_id:
                        currentEmployee[0].temporary_district_id[0],
                    identification_id: currentEmployee[0].identification_id,
                    sea_id_issue_date: currentEmployee[0].sea_id_issue_date,
                    id_issue_place: currentEmployee[0].id_issue_place[0],
                    id_expiry_date: currentEmployee[0].id_expiry_date,
                    passport_id: currentEmployee[0].passport_id,
                    gender: currentEmployee[0].gender,
                    marital: currentEmployee[0].marital,
                    study_field: currentEmployee[0].study_field,
                    seagroup_join_date: currentEmployee[0].seagroup_join_date,
                }

                const hr_tool_id = isRetailCurrentDB ? 1810 : 1798
                await hangeChangeUserCompany(
                    domainTogetCounterpartEmployee,
                    currentEmployee[0].company_id[0],
                    hr_tool_id
                )

                // Tạo mới nhân viên ở database còn lại
                const newEmployeeId = await createHrEmployee(
                    domainTogetCounterpartEmployee,
                    myEmployeeData
                )

                // Thêm công ty vào nhân viên

                const currentWorkingCompany =
                    currentEmployee[0].sea_company_ids.filter(
                        (i) => i !== currentEmployee[0].company_id[0]
                    )

                await addCompaniesToEmployee(
                    domainTogetCounterpartEmployee,
                    newEmployeeId,
                    currentWorkingCompany
                )

                const employeeMultiList = await getHrEmployeeMultiCompany(
                    domainTogetCurrentEmployee,
                    current_employee_id
                )

                const counterEmployeeMultiList =
                    await getHrEmployeeMultiCompany(
                        domainTogetCounterpartEmployee,
                        newEmployeeId
                    )

                // Cập nhật lại thông tin của nhân viên đa công ty
                for (const employeeMulti of counterEmployeeMultiList) {
                    const currentEmployeeMulti = employeeMultiList.find(
                        (i) =>
                            i.s_identification_id ===
                                employeeMulti.s_identification_id &&
                            i.company_id[0] === employeeMulti.company_id[0]
                    )

                    await hangeChangeUserCompany(
                        domainTogetCounterpartEmployee,
                        1,
                        hr_tool_id
                    )

                    await updateHrEmployeeMultiCompany(
                        domainTogetCounterpartEmployee,
                        employeeMulti.id,
                        {
                            primary_company:
                                currentEmployeeMulti.primary_company,
                            joining_date: currentEmployeeMulti.joining_date,
                            resignation_date:
                                currentEmployeeMulti.resignation_date,
                            employee_current_status:
                                currentEmployeeMulti.employee_current_status,
                        }
                    )
                }
            }
            res.status(200).json({
                sucess: true,
                msg: 'Đã xử lý thành công!',
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    },
}

module.exports = employeeCtrl

const getEmployeeChangeByCompany = async (pool, companyId) => {
    try {
        const query = `
                WITH first_official_contract_of_seagroup AS (
                    SELECT DISTINCT ON (employee_id) 
                        employee_id, 
                        date_start AS ngay_chinh_thuc_gia_nhap_sc
                    FROM hr_contract
                    WHERE contract_category = 'contract'
                        AND type_id = 1
                        AND state NOT IN ('draft')
                    ORDER BY employee_id, date_start
                ),

                first_official_contract_by_company AS (
                    SELECT DISTINCT ON (employee_id) 
                        employee_id, 
                        date_start AS ngay_vao_cty_chinh_thuc
                    FROM hr_contract
                    WHERE contract_category = 'contract'
                        AND type_id = 1
                        AND state NOT IN ('draft')
                        AND company_id = $1
                    ORDER BY employee_id, date_start
                ),

                latest_official_contract_by_company AS (
                    SELECT DISTINCT ON (employee_id) 
                        employee_id, 
                        id,
                        date_start AS ngay_ky_hop_dong_gan_nhat
                    FROM hr_contract
                    WHERE contract_category = 'contract'
                        AND type_id = 1
                        AND state NOT IN ('draft')
                        AND company_id = $2
                    ORDER BY employee_id, date_start DESC
                ),

                type_of_latest_contract_by_company AS (
                    SELECT
                        hc.employee_id,
                        hc.name, 	
                        hc.contract_period_id,
                        hc.date_start,
                        hc.date_end
                    FROM hr_contract hc
                    JOIN latest_official_contract_by_company loc 
                        ON loc.employee_id = hc.employee_id AND loc.id = hc.id
                )

                SELECT 
                    a.s_identification_id as s_identification_id,
                    he.name as ten_nv,
                    case when he.gender = 'male' then 'Nam' else 'Nữ' end as gioi_tinh,
                    he.birthday as ngay_sinh,
                    hj.name as chuc_vu,
                    a.job_title as cong_viec_dam_nhan,
                    he.social_insurance_number as so_so_bao_hiem,
                    he.health_insurance_number as ma_the_hiem_y_te,
                    he.tax_tncn_code as ma_so_thue,
                    he.number_of_dependents as so_nguoi_phu_thuoc,
                    he.identification_id as so_cccd,
                    he.sea_id_issue_date as ngay_cap,
                    riip.name as noi_cap,
                    a.seagroup_join_date as ngay_vao_seagroup_tv,
                    fcs.ngay_chinh_thuc_gia_nhap_sc as ngay_vao_seagroup_ct,
                    a.joining_date as ngay_vao_cty_thu_viec,
                    foc.ngay_vao_cty_chinh_thuc as ngay_vao_cty_chinh_thuc,
                    EXTRACT('YEAR' FROM age(a.seagroup_join_date)) as tham_nien_nam,
                    EXTRACT('MONTH' FROM age(a.seagroup_join_date)) as tham_nien_thang,
                    EXTRACT('DAY' FROM age(a.seagroup_join_date)) as tham_nien_ngay,
                    hcp.name as loai_hd,
                    tloc.name as so_hd,
                    tloc.date_start as ngay_ky_hop_dong,
                    tloc.date_end as ngay_het_han_hop_dong,
                    case when a.employee_current_status = 'working' then 'Đang làm việc' else case when a.employee_current_status = 'leaving' then 'Nghỉ không lương' else case when a.employee_current_status = 'maternity_leave'then 'Nghỉ thai sản' else case when a.employee_current_status = 'sick_leave' then 'Nghỉ bệnh' else 'Nghỉ việc' end end end end as tinh_trang_lam_viec,
                    a.resignation_date as nghi_tu_ngay,
                    a.leaving_to_date as den_ngay,
                    concat(he.sea_permanent_addr,', ',rd.name,', ',rcs.name,', ',rc.name) as dia_chi_thuong_tru,
                    concat(he.sea_temp_addr,', ',rd2.name,', ',rcs2.name,', ',rc2.name) as dia_chi_tam_tru,
                    coalesce(he.mobile_phone,he.main_phone_number) as  dien_thoai_di_dong,
                    he.sea_personal_email as email_ca_nhan,
                    he.work_email as email_cong_ty,
                    a.company_id as company_id,
                    a.department_id
                FROM 
                    hr_employee_multi_company a 
                    join hr_employee he on he.id = a.name
                    left join hr_job hj on hj.id = a.job_id
                    join res_district rd on rd.id = he.permanent_district_id
                    join res_country_state rcs on rcs.id = he.permanent_city_id
                    join res_country rc on rc.id = he.permanent_country_id
                    join res_district rd2 on rd2.id = he.temporary_district_id
                    join res_country_state rcs2 on rcs2.id = he.temporary_city_id
                    join res_country rc2 on rc2.id = he.temporary_country_id
                    left join first_official_contract_of_seagroup fcs on fcs.employee_id = he.id
                    left join first_official_contract_by_company foc on foc.employee_id = he.id
                    left join latest_official_contract_by_company loc on loc.employee_id = he.id
                    left join type_of_latest_contract_by_company tloc on tloc.employee_id = he.id
                    left join hr_contract_period hcp on hcp.id = tloc.contract_period_id
                    left join res_id_issue_place riip on riip.id = he.id_issue_place
                WHERE 
                    a.active = true 
                    and a.primary_company = true 
                    and a.company_id = $3
                    and a.employee_current_status != 'resigned'
            `

        const preparedQuery = {
            text: query,
            values: [companyId, companyId, companyId],
        }

        const data = await pool.query(preparedQuery)
        return data.rows
    } catch (error) {
        throw Error(error.message)
    }
}

const getChangeQuantityByCompany = async (
    pool,
    companyId,
    month,
    year,
    toDate
) => {
    try {
        const query = `
            SELECT 
                'tang' as title,
                a.company_id,
                he.name,
                a.joining_date as date,
                a.leaving_to_date as to_date
            FROM 
                hr_employee_multi_company a 
            JOIN
                hr_employee he on he.id = a.name
            WHERE 
                a.active = true 
                and a.company_id = $1
                and a.employee_current_status != 'resigned' 
                and a.joining_date is not null 
                and EXTRACT(MONTH FROM a.joining_date) = $2
                and EXTRACT(YEAR FROM a.joining_date) = $3
                and a.primary_company = true
            UNION ALL

            SELECT 
                'giam' as title,
                a.company_id,
                he.name,
                a.resignation_date as date,
                a.leaving_to_date as to_date
            FROM 
                hr_employee_multi_company a 
            JOIN
                hr_employee he on he.id = a.name
            WHERE 
                a.active = true 
                and a.company_id = $4
                and a.employee_current_status = 'resigned' 
                and a.resignation_date is not null 
                and EXTRACT(MONTH FROM a.resignation_date) = $5
                and EXTRACT(YEAR FROM a.resignation_date) = $6
                and a.primary_company = true
            UNION ALL

            SELECT 
                'nghi_om_dau' as title,
                a.company_id,
                he.name,
                a.resignation_date as date,
                a.leaving_to_date as to_date
            FROM 
                hr_employee_multi_company a 
            JOIN
                hr_employee he on he.id = a.name
            WHERE 
                a.active = true 
                and a.company_id = $7
                and a.employee_current_status = 'sick_leave' 
                and a.resignation_date is not null
                and a.resignation_date <= $8
                and a.primary_company = true
            UNION ALL

            SELECT 
                'nghi_thai_san' as title,
                a.company_id,
                he.name,
                a.resignation_date as date,
                a.leaving_to_date as to_date
            FROM 
                hr_employee_multi_company a
            JOIN
                hr_employee he on he.id = a.name 
            WHERE 
                a.active = true 
                and a.company_id = $9
                and a.employee_current_status = 'maternity_leave' 
                and a.resignation_date is not null
                and a.resignation_date <= $10
                and a.primary_company = true

            UNION ALL

            SELECT 
                'nghi_khong_luong' as title,
                a.company_id,
                he.name,
                a.resignation_date as date,
                a.leaving_to_date as to_date
            FROM 
                hr_employee_multi_company a
            JOIN
                hr_employee he on he.id = a.name 
            WHERE 
                a.active = true 
                and a.company_id = $11
                and a.primary_company = true
                and a.employee_current_status = 'leaving' 
                and a.resignation_date is not null 
                and a.resignation_date <= $12
        `

        const preparedQuery = {
            text: query,
            values: [
                companyId,
                month,
                year,
                companyId,
                month,
                year,
                companyId,
                toDate,
                companyId,
                toDate,
                companyId,
                toDate,
            ],
        }

        const { rows: result } = await pool.query(preparedQuery)
        return result
    } catch (error) {
        throw Error(error.message)
    }
}

const getTotalEmployeeByCompany = async (pool, companyId, toDate) => {
    try {
        const query = `
            SELECT 
                company_id,
                count(id) as SL
            FROM 
                hr_employee_multi_company a
            WHERE
                (a.active = true
                and company_id = $1
                and employee_current_status is not null
                and employee_current_status != 'resigned'
                and a.joining_date is not null
                and a.joining_date <= $2
                and a.primary_company = true
                )
                or
                (a.active = true
                and company_id = $3
                and employee_current_status is not null
                and employee_current_status != 'resigned'
                and a.joining_date is null
                and a.primary_company = true
                )
            GROUP BY company_id
        `

        const preparedQuery = {
            text: query,
            values: [companyId, toDate, companyId],
        }

        const { rows: result } = await pool.query(preparedQuery)
        return result
    } catch (error) {
        throw Error(error.message)
    }
}

module.exports = {
    getEmployeeChangeByCompany,
    getChangeQuantityByCompany,
    getTotalEmployeeByCompany,
}

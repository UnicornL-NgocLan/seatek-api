const calculateDUNO = async (pool,companyId,accountId,date) => {
    try {
        const query = `
                select 
                    sum(aml.debit) - sum(aml.credit) as du_no
                from account_move_line aml
                join account_move am on am.id = aml.move_id
                where 
                    aml.account_id = $1
                    and am.state = 'posted' 
                    and aml.company_id = $2
                    and aml.date <= $3
                group by aml.account_id
            `

            const preparedQuery = {
                text: query,
                values: [accountId,companyId,date]
            };
            const data = await pool.query(preparedQuery);
            const data1 = await pool.query('select dual_account from account_account where id = $1',[accountId]);
            
            if(data.rows.length === 0) return 0;
            if(data1.rows[0]['dual_account']){
                if(data.rows[0]["du_no"] <= 0){
                    return 0;
                } else {
                    return data.rows[0]["du_no"];
                }
            } else {
                return data.rows[0]["du_no"];
            }
    } catch (error) {
        throw Error(error.message)
    }
}

const calculateDUCO = async (pool,companyId,accountId,date) => {
    try {
        const query = `
                select 
                    sum(aml.credit) - sum(aml.debit) as du_co
                from account_move_line aml
                join account_move am on am.id = aml.move_id
                where 
                    aml.account_id = $1
                    and am.state = 'posted' 
                    and aml.company_id = $2
                    and aml.date <= $3
                group by aml.account_id
            `

            const preparedQuery = {
                text: query,
                values: [accountId,companyId,date]
            };
            const data = await pool.query(preparedQuery);
            const data1 = await pool.query('select dual_account from account_account where id = $1',[accountId]);
            
            if(data.rows.length === 0) return 0;

            if(data1.rows[0]['dual_account']){
                if(data.rows[0]["du_co"] <= 0){
                    return 0;
                } else {
                    return data.rows[0]["du_co"];
                }
            } else {
                return data.rows[0]["du_co"];
            }
    } catch (error) {
        throw Error(error.message)
    }
}

const calculatePSCO = async (pool,companyId,accountId,date) => {
    try {
        const query = `
                select 
                    sum(aml.credit) as ps_co
                from account_move_line aml
                join account_move am on am.id = aml.move_id
                where 
                    aml.account_id = $1
                    and am.state = 'posted' 
                    and aml.company_id = $2
                    and aml.date <= $3
                group by aml.account_id
            `

            const preparedQuery = {
                text: query,
                values: [accountId,companyId,date]
            };
            const data = await pool.query(preparedQuery);
            
            if(data.rows.length === 0) return 0;

            return data.rows[0]["ps_co"];
    } catch (error) {
        throw Error(error.message)
    }
}

const calculatePSNO = async (pool,companyId,accountId,date) => {
    try {
        const query = `
                select 
                    sum(aml.debit) as ps_no
                from account_move_line aml
                join account_move am on am.id = aml.move_id
                where 
                    aml.account_id = $1
                    and am.state = 'posted' 
                    and aml.company_id = $2
                    and aml.date <= $3
                group by aml.account_id
            `

            const preparedQuery = {
                text: query,
                values: [accountId,companyId,date]
            };
            const data = await pool.query(preparedQuery);
            
            if(data.rows.length === 0) return 0;

            return data.rows[0]["ps_no"];
    } catch (error) {
        throw Error(error.message)
    }
}

const calculatePSDU = async (pool,companyId,accountId,cta,date) => {
    try {
        const query = `
                select 
                    sum(amlc.countered_amt) as ps_du
                from account_move_line_ctp amlc
                join account_move am on am.id = amlc.move_id
                where 
                    amlc.dr_account_id = $1
                    and amlc.cr_account_id = $2
                    and am.state = 'posted' 
                    and am.company_id = $3
                    and am.date <= $4
                group by amlc.dr_account_id
            `

            const preparedQuery = {
                text: query,
                values: [accountId,cta,companyId,date]
            };
            const data = await pool.query(preparedQuery);
            
            if(data.rows.length === 0) return 0;

            return data.rows[0]["ps_du"];
    } catch (error) {
        throw Error(error.message)
    }
}

const calculateDuNoByPartner = async (pool,companyId,accountId,date) => {
    try {
        const query = `
                with result as (
                    select 
                        case 
                            when aa.dual_account is TRUE and sum(aml.debit) - sum(aml.credit) <= 0 then 0
                            else sum(aml.debit) - sum(aml.credit)
                        end as du_no_by_dt,
                        aml.account_id as account_id
                    from account_move_line aml
                    join account_move am on am.id = aml.move_id
                    join account_account aa on aa.id = aml.account_id
                    where 
                        aml.account_id = $1
                        and am.state = 'posted'
                        and aml.company_id = $2
                        and aml.date <= $3
                    group by aa.dual_account,aml.account_id, aml.partner_id
                )

                select 
                    sum(res.du_no_by_dt) as du_no_by_dt_off
                from result res
                group by res.account_id
            `

            const preparedQuery = {
                text: query,
                values: [accountId,companyId,date]
            };
            const data = await pool.query(preparedQuery);
            
            if(data.rows.length === 0) return 0;


            return data.rows[0]["du_no_by_dt_off"];
    } catch (error) {
        throw Error(error.message)
    }
} 

const calculateDuCoByPartner = async (pool,companyId,accountId,date) => {
    try {
        const query = `
                with result as (
                    select 
                        case 
                            when aa.dual_account is TRUE and sum(aml.credit) - sum(aml.debit) <= 0 then 0
                            else sum(aml.credit) - sum(aml.debit)
                        end as du_co_by_dt,
                        aml.account_id as account_id
                    from account_move_line aml
                    join account_move am on am.id = aml.move_id
                    join account_account aa on aa.id = aml.account_id
                    where 
                        aml.account_id = $1
                        and am.state = 'posted'
                        and aml.company_id = $2
                        and aml.date <= $3
                    group by aa.dual_account,aml.account_id, aml.partner_id
                )

                select 
                    sum(res.du_co_by_dt) as du_co_by_dt_off
                from result res
                group by res.account_id
            `

            const preparedQuery = {
                text: query,
                values: [accountId,companyId,date]
            };
            const data = await pool.query(preparedQuery);
            
            if(data.rows.length === 0) return 0;


            return data.rows[0]["du_co_by_dt_off"];
    } catch (error) {
        throw Error(error.message)
    }
} 



module.exports = {calculateDUNO,calculateDUCO,calculatePSCO,calculatePSNO,calculatePSDU,calculateDuNoByPartner,calculateDuCoByPartner}
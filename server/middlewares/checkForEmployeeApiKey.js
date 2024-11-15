const authenticateEmployeeKey = async (req, res, next) => {
    try {
        const request_key = req.headers?.authorization;
        if(!request_key) return res.status(401).json({msg:"Bạn không có quyền truy cập"});

        const arr = request_key.split(" ");
        if(arr.length === 0) return res.status(401).json({msg:"Bạn không có quyền truy cập"}); 
        if(!arr[1] || arr[1] !== process.env.EMPLOYEE_API_KEY) return res.status(401).json({msg:"Bạn không có quyền truy cập"})
        next();
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

module.exports = {authenticateEmployeeKey}
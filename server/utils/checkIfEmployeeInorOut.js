const checkIfEmployeeWorkingOrNot = (
    employeeList,
    partnerList,
    familyGroup
) => {
    let partnersToDeactivate = []
    let partnersToActivate = []

    for (let i = 0; i < partnerList.length; i++) {
        const employeeId = partnerList[i].sea_business_code.split('_')
        if (employeeId.length === 3) {
            const isItInEmployeeList = employeeList.find(
                (item) => item.name[0].toString() === employeeId[1].toString()
            )

            // Kiểm tra xem nhân viên này đã nghỉ việc chưa? (Có partner mà không tìm employee đang làm việc)
            if (!isItInEmployeeList) {
                // Kiểm tra xem partner đó có thuộc group familiy không? Nếu có thì cần phải chuyển vào group deactive
                if (partnerList[i].group_ids.includes(familyGroup)) {
                    partnersToDeactivate.push(partnerList[i])
                }
            } else {
                // Nếu như partner đó không thuộc group gia đình seacorp thì cho vào group toActivate để add vào lại
                if (!partnerList[i].group_ids.includes(familyGroup)) {
                    partnersToActivate.push(partnerList[i])
                }
            }
        }
    }

    const partnerCodeSet = new Set(
        partnerList
            .map((item) => {
                const employeeId = item.sea_business_code.split('_')
                return employeeId.length === 3 ? employeeId[1].toString() : null
            })
            .filter(Boolean)
    )

    const partnersToAdd = employeeList.filter(
        (i) => !partnerCodeSet.has(i.name[0].toString())
    )

    return [partnersToDeactivate, partnersToActivate, partnersToAdd]
}

const checkIfEmployeeWorkingOrNotRetailVersion = (
    employeeList,
    partnerList,
    familyGroup,
    employeeCreatedToday
) => {
    let partnersToDeactivate = []
    let partnersToActivate = []

    for (let i = 0; i < partnerList.length; i++) {
        const employeeId = partnerList[i].sea_business_code.split('_')
        if (employeeId.length === 3) {
            const isItInEmployeeList = employeeList.find(
                (item) => item.name[0].toString() === employeeId[1].toString()
            )

            // Kiểm tra xem nhân viên này đã nghỉ việc chưa? (Có partner mà không tìm employee đang làm việc)
            if (!isItInEmployeeList) {
                // Kiểm tra xem partner đó có thuộc group familiy không? Nếu có thì cần phải chuyển vào group deactive
                if (partnerList[i].group_ids.includes(familyGroup)) {
                    partnersToDeactivate.push(partnerList[i])
                }
            } else {
                // Nếu như partner đó không thuộc group gia đình seacorp thì cho vào group toActivate để add vào lại
                if (!partnerList[i].group_ids.includes(familyGroup)) {
                    partnersToActivate.push(partnerList[i])
                }
            }
        }
    }

    const partnerCodeSet = new Set(
        partnerList
            .map((item) => {
                const employeeId = item.sea_business_code.split('_')
                return employeeId.length === 3 ? employeeId[1].toString() : null
            })
            .filter(Boolean)
    )

    const partnersToAdd = employeeCreatedToday.filter(
        (i) => !partnerCodeSet.has(i.name[0].toString())
    )

    return [partnersToDeactivate, partnersToActivate, partnersToAdd]
}

module.exports = {
    checkIfEmployeeWorkingOrNot,
    checkIfEmployeeWorkingOrNotRetailVersion,
}

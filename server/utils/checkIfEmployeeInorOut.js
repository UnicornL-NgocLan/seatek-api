const checkIfEmployeeWorkingOrNot = (employeeList, partnerList) => {
    let partnersToDeactivate = []
    let partnersToActivate = []

    for (let i = 0; i < partnerList.length; i++) {
        const employeeId = partnerList[i].sea_business_code.split('_')
        if (employeeId.length === 3) {
            const isItInEmployeeList = employeeList.find(
                (item) => item.name[0].toString() === employeeId[1].toString()
            )
            if (!isItInEmployeeList) {
                if (partnerList[i].active) {
                    partnersToDeactivate.push(partnerList[i])
                }
            } else {
                if (!partnerList[i].active) {
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

module.exports = checkIfEmployeeWorkingOrNot

const getCounterpartItem = (
    currentSource,
    counterPartSource,
    currentItemId
) => {
    if (!currentItemId) return currentItemId

    let finalIdToUpdate
    // Lấy quận hiện tại
    let itemOfCurrentSource = currentSource.find((d) => d.id === currentItemId)
    // Lấy quận ở tên miền kia với cùng id
    const counterpartItem = counterPartSource.find(
        (d) => d.id === itemOfCurrentSource?.id
    )

    // Nếu giống tên thì lấy nó
    if (counterpartItem && counterpartItem.name === itemOfCurrentSource.name) {
        finalIdToUpdate = counterpartItem.id
    } else if (
        (counterpartItem &&
            counterpartItem.name !== itemOfCurrentSource.name) ||
        !counterpartItem
    ) {
        // Nếu như cùng id nhưng khác tên thì tìm record cùng tên
        finalIdToUpdate = counterPartSource.find(
            (d) => d.name === itemOfCurrentSource.name
        )?.id
    }

    return finalIdToUpdate
}

module.exports = { getCounterpartItem }

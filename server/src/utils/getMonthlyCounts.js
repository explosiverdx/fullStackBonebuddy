const getMonthlyCounts = async (model, dateField, year, match = {}) => {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const data = await model.aggregate([
        {
            $match: {
                [dateField]: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                },
                ...match,
            },
        },
        {
            $group: {
                _id: { $month: `$${dateField}` },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    const monthlyData = Array.from({ length: 12 }, (_, i) => 0);
    data.forEach((item) => {
        monthlyData[item._id - 1] = item.count;
    });
    return monthlyData;
};

export { getMonthlyCounts };

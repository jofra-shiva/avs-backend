const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Production = require('../models/Production');

// @desc    Get turnover analytics
// @route   GET /api/turnover/analytics
// @access  Private
const getTurnoverAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, type, year, month, date } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (date) {
      query.date = date;
    }

    // 1. Fetch relevant data
    const sales = await Sale.find(query);
    const expenses = await Expense.find(query);
    const production = await Production.find(query);

    // 2. Calculate Financials
    const totalIncome = sales.reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // 3. Simple Mock of Comparison (MoM)
    // In a real app we'd fetch previous period too
    const currentMonthIncome = totalIncome;
    const prevMonthIncome = totalIncome * 0.85; // Placeholder mock
    const incomeGrowthPercent = prevMonthIncome > 0 ? Math.round(((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100) : 100;

    const totalProduction = production.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const prevMonthProduction = totalProduction * 0.92; // Placeholder mock
    const prodGrowthPercent = prevMonthProduction > 0 ? Math.round(((totalProduction - prevMonthProduction) / prevMonthProduction) * 100) : 100;

    // 4. Charts Data
    // Sales by Size
    const sizeMap = sales.reduce((acc, sale) => {
      (sale.saleItems || []).forEach(item => {
        const size = item.size || 'Unknown';
        acc[size] = (acc[size] || 0) + (item.qty || item.quantity || 0);
      });
      return acc;
    }, {});
    const salesSizeChart = Object.keys(sizeMap).map(name => ({ name, SalesQty: sizeMap[name] }));

    // Production by Size
    const pSizeMap = production.reduce((acc, p) => {
      const size = p.size || 'Unknown';
      acc[size] = (acc[size] || 0) + (p.quantity || 0);
      return acc;
    }, {});
    const prodSizeChart = Object.keys(pSizeMap).map(name => ({ name, ProdQty: pSizeMap[name] }));

    // Monthly Area Chart (Mockup of current period)
    const monthlyIncomeChart = [
       { name: 'Week 1', Income: totalIncome * 0.2 },
       { name: 'Week 2', Income: totalIncome * 0.3 },
       { name: 'Week 3', Income: totalIncome * 0.15 },
       { name: 'Week 4', Income: totalIncome * 0.35 },
    ];

    res.json({
      financials: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        incomeGrowthPercent,
        currentMonthIncome,
        prevMonthIncome
      },
      production: {
        totalProduction,
        currentMonthProduction: totalProduction,
        prevMonthProduction,
        prodGrowthPercent
      },
      charts: {
        salesSizeChart,
        prodSizeChart,
        monthlyIncomeChart
      }
    });

  } catch (error) {
    console.error('Turnover Controller Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTurnoverAnalytics
};

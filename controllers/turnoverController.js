const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Production = require('../models/Production');
const Product = require('../models/Product');

exports.getAnalytics = async (req, res) => {
  try {
    let { startDate, endDate, type, month, year, date } = req.query;
    
    // Auto-generate date range based on 'type' if provided
    if (type) {
      const now = new Date();
      if (type === 'daily') {
        const d = date || startDate || now.toISOString().split('T')[0];
        startDate = d;
        endDate = d;
      } else if (type === 'monthly') {
        const y = year || now.getFullYear();
        const m = month || (now.getMonth() + 1);
        startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else if (type === 'yearly') {
        const y = year || now.getFullYear();
        startDate = `${y}-01-01`;
        endDate = `${y}-12-31`;
      }
    }

    const salesAll = await Sale.find({}).lean();
    const expensesAll = await Expense.find({}).lean();
    const productionsAll = await Production.find({}).lean();
    
    const parseDbDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
           const y = dObj.getFullYear();
           const m = String(dObj.getMonth() + 1).padStart(2, '0');
           const d = String(dObj.getDate()).padStart(2, '0');
           return `${y}-${m}-${d}`;
        }
        if (dateStr.includes(',')) {
          const cleanDate = dateStr.split(',')[0].trim(); 
          const parts = cleanDate.split('-');
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return null;
      } catch (e) { return null; }
    };

    const isWithinRange = (dateStr, start, end) => {
      if (!start && !end) return true;
      const d = parseDbDate(dateStr);
      if (!d) return false;
      return d >= start && d <= end;
    };

    const getMonthStr = (date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalProductionQty = 0;

    let currentPeriodIncome = 0;
    let prevPeriodIncome = 0;
    let currentPeriodProd = 0;
    let prevPeriodProd = 0;

    const monthlyIncomeData = {};
    const monthlyProductionData = {};
    const expenseCategoryMap = {};
    const salesSizeDataMap = {};
    const productionSizeDataMap = {};
    const fullTrendIncomeData = {};

    const now = new Date();
    const contextDate = (type === 'monthly' && month && year) ? new Date(year, month - 1, 1) : now;
    const contextMonthStr = getMonthStr(contextDate);
    const prevContextDate = new Date(contextDate.getFullYear(), contextDate.getMonth() - 1, 1);
    const prevContextMonthStr = getMonthStr(prevContextDate);

    // Padding for charts (last 12 months)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(contextDate.getFullYear(), contextDate.getMonth() - i, 1);
      const mStr = getMonthStr(d);
      fullTrendIncomeData[mStr] = 0;
      monthlyProductionData[mStr] = 0;
    }

    salesAll.forEach(sale => {
      let d = parseDbDate(sale.date);
      let mStr = d ? getMonthStr(d) : "History";
      const amt = Number(sale.totalAmount || 0);

      if (fullTrendIncomeData[mStr] !== undefined) fullTrendIncomeData[mStr] += amt;
      else if (mStr !== "History") fullTrendIncomeData[mStr] = amt;

      if (mStr === contextMonthStr) currentPeriodIncome += amt;
      if (mStr === prevContextMonthStr) prevPeriodIncome += amt;

      if (isWithinRange(sale.date, startDate, endDate)) {
        totalIncome += amt;
        if (!monthlyIncomeData[mStr]) monthlyIncomeData[mStr] = 0;
        monthlyIncomeData[mStr] += amt;
        if (sale.saleItems) {
          sale.saleItems.forEach(item => {
            if (item.size) {
              salesSizeDataMap[item.size] = (salesSizeDataMap[item.size] || 0) + Number(item.qty || 0);
            }
          });
        }
      }
    });

    expensesAll.forEach(exp => {
      if (isWithinRange(exp.date, startDate, endDate)) {
        const amt = Number(exp.amount || 0);
        totalExpenses += amt;
        const cat = exp.category || 'Other';
        expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + amt;
      }
    });

    productionsAll.forEach(prod => {
      const d = parseDbDate(prod.date);
      if (!d) return;
      const mStr = getMonthStr(d);
      const qty = Number(prod.quantity || 0);

      if (mStr === contextMonthStr) currentPeriodProd += qty;
      if (mStr === prevContextMonthStr) prevPeriodProd += qty;

      if (isWithinRange(prod.date, startDate, endDate)) {
        totalProductionQty += qty;
        if (monthlyProductionData[mStr] !== undefined) monthlyProductionData[mStr] += qty;
        else monthlyProductionData[mStr] = qty;
        if (prod.size) {
          productionSizeDataMap[prod.size] = (productionSizeDataMap[prod.size] || 0) + qty;
        }
      }
    });

    const formatChartLabel = m => m.includes('-') ? m.split('-')[1] + '/' + m.split('-')[0].substring(2) : m;

    const fullMonthlyChart = Object.keys(fullTrendIncomeData).sort().map(m => ({
      name: formatChartLabel(m), Income: fullTrendIncomeData[m]
    }));

    const monthlyProductionChart = Object.keys(monthlyProductionData).sort().map(m => ({
      name: formatChartLabel(m), Production: monthlyProductionData[m]
    }));

    res.json({
      financials: {
        totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses,
        currentMonthIncome: currentPeriodIncome, prevMonthIncome: prevPeriodIncome,
        incomeGrowthPercent: prevPeriodIncome ? (((currentPeriodIncome - prevPeriodIncome) / prevPeriodIncome) * 100).toFixed(1) : (currentPeriodIncome ? 100 : 0)
      },
      production: {
        totalProductionQty, currentMonthProduction: currentPeriodProd, prevMonthProduction: prevPeriodProd,
        prodGrowthPercent: prevPeriodProd ? (((currentPeriodProd - prevPeriodProd) / prevPeriodProd) * 100).toFixed(1) : (currentPeriodProd ? 100 : 0)
      },
      charts: {
        fullMonthlyChart, monthlyProductionChart,
        salesSizeChart: Object.keys(salesSizeDataMap).map(s => ({ name: s, SalesQty: salesSizeDataMap[s] })),
        prodSizeChart: Object.keys(productionSizeDataMap).map(s => ({ name: s, ProdQty: productionSizeDataMap[s] })),
        expenseCatChart: Object.keys(expenseCategoryMap).map(cat => ({ name: cat, Amount: expenseCategoryMap[cat] })).sort((a,b) => b.Amount - a.Amount)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving analytics summary', error: error.message });
  }
};

// Alias for compatibility with routes
exports.getTurnoverSummary = exports.getAnalytics;

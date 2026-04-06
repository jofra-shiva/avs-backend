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

    const salesAll = await Sale.find({});
    const expensesAll = await Expense.find({});
    const productionsAll = await Production.find({});
    const productsAll = await Product.find({});

    const parseDbDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        if (dateStr.includes(',')) {
          const cleanDate = dateStr.split(',')[0].trim(); 
          const [day, month, year] = cleanDate.split('-');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else if (parts[2] && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    const isWithinRange = (dateStr, start, end) => {
      if (!start && !end) return true;
      if (!dateStr) return false;
      if (start === end && start) {
        const [y, m, d] = start.split('-');
        const targetPrefix = `${d}-${m}-${y}`;
        if (dateStr.startsWith(targetPrefix)) return true;
      }
      const d = parseDbDate(dateStr); 
      if (!d) return false;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    };

    const sales = salesAll.filter(s => isWithinRange(s.date, startDate, endDate));
    const expenses = expensesAll.filter(e => isWithinRange(e.date, startDate, endDate));
    const productions = productionsAll.filter(p => isWithinRange(p.date, startDate, endDate));

    const now = new Date();
    let totalIncome = 0;
    let totalExpenses = 0;
    let currentMonthIncome = 0;
    let prevMonthIncome = 0;
    let totalProductionQty = 0;
    let currentMonthProduction = 0;
    let prevMonthProduction = 0;

    const monthlyIncomeData = {};
    const monthlyProductionData = {};
    const salesSizeDataMap = {};
    const expenseCategoryMap = {};

    const getMonthStr = (d) => {
      if (typeof d === 'string') return d.substring(0, 7);
      const date = new Date(d);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    let contextMonthStr = getMonthStr(now);
    if (startDate && startDate.length >= 7) {
      contextMonthStr = startDate.substring(0, 7);
    }
    
    const contextParts = contextMonthStr.split('-');
    const contextDate = new Date(parseInt(contextParts[0]), parseInt(contextParts[1]) - 1, 1);
    const prevContextDate = new Date(contextDate.getFullYear(), contextDate.getMonth() - 1, 1);
    const prevContextMonthStr = getMonthStr(prevContextDate);

    salesAll.forEach(sale => {
      const d = parseDbDate(sale.date);
      if (!d) return;
      const mStr = getMonthStr(d);
      const amt = Number(sale.totalAmount || 0);
      if (mStr === contextMonthStr) currentMonthIncome += amt;
      if (mStr === prevContextMonthStr) prevMonthIncome += amt;
      if (isWithinRange(sale.date, startDate, endDate)) {
        totalIncome += amt;
        if (!monthlyIncomeData[mStr]) monthlyIncomeData[mStr] = 0;
        monthlyIncomeData[mStr] += amt;
        if (sale.saleItems && sale.saleItems.length > 0) {
          sale.saleItems.forEach(item => {
            if (item.size) {
              if (!salesSizeDataMap[item.size]) salesSizeDataMap[item.size] = 0;
              salesSizeDataMap[item.size] += (Number(item.qty) || 0);
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
        if (!expenseCategoryMap[cat]) expenseCategoryMap[cat] = 0;
        expenseCategoryMap[cat] += amt;
      }
    });

    productionsAll.forEach(prod => {
      const d = parseDbDate(prod.date);
      if (!d) return;
      const mStr = getMonthStr(d);
      const qty = Number(prod.quantity || 0);
      if (mStr === contextMonthStr) currentMonthProduction += qty;
      if (mStr === prevContextMonthStr) prevMonthProduction += qty;
      if (isWithinRange(prod.date, startDate, endDate)) {
        totalProductionQty += qty;
        if (!monthlyProductionData[mStr]) monthlyProductionData[mStr] = 0;
        monthlyProductionData[mStr] += qty;
      }
    });

    const monthlyIncomeChart = Object.keys(monthlyIncomeData).sort().map(month => ({
      name: month,
      Income: monthlyIncomeData[month]
    }));

    const monthlyProductionChart = Object.keys(monthlyProductionData).sort().map(m => ({ 
      name: m, 
      Production: monthlyProductionData[m] 
    }));

    const salesSizeChart = Object.keys(salesSizeDataMap).map(size => ({
      name: size,
      SalesQty: salesSizeDataMap[size]
    }));

    const stockSizeDataMap = {};
    productsAll.forEach(p => {
      if (p.size) {
        if (!stockSizeDataMap[p.size]) stockSizeDataMap[p.size] = 0;
        stockSizeDataMap[p.size] += (p.stock || 0);
      }
    });

    const prodSizeChart = Object.keys(stockSizeDataMap).map(size => ({
      name: size,
      ProdQty: stockSizeDataMap[size]
    }));

    let currentPeriodIncome = totalIncome;
    let prevPeriodIncome = 0;
    let currentPeriodProd = totalProductionQty;
    let prevPeriodProd = 0;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end - start;
      const pStart = new Date(start);
      const pEnd = new Date(end);
      if (startDate === endDate) {
        pStart.setDate(start.getDate() - 1);
        pEnd.setDate(end.getDate() - 1);
      } else {
        pStart.setTime(start.getTime() - diff - 86400000);
        pEnd.setTime(end.getTime() - diff - 86400000);
      }
      const cs = pStart.toISOString().split('T')[0];
      const ce = pEnd.toISOString().split('T')[0];
      salesAll.forEach(s => { if (isWithinRange(s.date, cs, ce)) prevPeriodIncome += Number(s.totalAmount || 0); });
      productionsAll.forEach(p => { if (isWithinRange(p.date, cs, ce)) prevPeriodProd += Number(p.quantity || 0); });
    }

    res.status(200).json({
      financials: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        currentMonthIncome: currentPeriodIncome,
        prevMonthIncome: prevPeriodIncome,
        incomeGrowthPercent: prevPeriodIncome ? (((currentPeriodIncome - prevPeriodIncome) / prevPeriodIncome) * 100).toFixed(1) : (currentPeriodIncome ? 100 : 0)
      },
      production: {
        totalProductionQty,
        currentMonthProduction: currentPeriodProd,
        prevMonthProduction: prevPeriodProd,
        prodGrowthPercent: prevPeriodProd ? (((currentPeriodProd - prevPeriodProd) / prevPeriodProd) * 100).toFixed(1) : (currentPeriodProd ? 100 : 0)
      },
      charts: {
        monthlyIncomeChart,
        monthlyProductionChart,
        salesSizeChart,
        prodSizeChart,
        expenseCatChart: Object.keys(expenseCategoryMap).map(cat => ({
          name: cat,
          Amount: expenseCategoryMap[cat]
        })).sort((a, b) => b.Amount - a.Amount)
      },
      recentData: {
        sales: sales.sort((a,b) => new Date(parseDbDate(b.date)) - new Date(parseDbDate(a.date))).slice(0, 50),
        productions: productions.sort((a,b) => new Date(parseDbDate(b.date)) - new Date(parseDbDate(a.date))).slice(0, 50),
        expenses: expenses.sort((a,b) => new Date(parseDbDate(b.date)) - new Date(parseDbDate(a.date))).slice(0, 50)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving analytics summary', error: error.message });
  }
};

// @desc    Get Turnover Summary
// @route   GET /api/turnover?type=monthly&month=3&year=2026
exports.getTurnoverSummary = async (req, res) => {
  try {
    const { type, date, month, year } = req.query;

    if (!type) return res.status(400).json({ message: "Filter 'type' is required (daily, monthly, yearly, all)" });
    
    let filterStart, filterEnd;
    const now = new Date();
    
    if (type === 'daily') {
      if (!date) return res.status(400).json({ message: "Query parameter 'date' (YYYY-MM-DD) is required for type=daily" });
      filterStart = date;
      filterEnd = date;
    } else if (type === 'monthly') {
      if (!month || !year) return res.status(400).json({ message: "Parameters 'month' and 'year' are required for type=monthly" });
      filterStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      filterEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (type === 'yearly') {
      if (!year) return res.status(400).json({ message: "Parameter 'year' is required for type=yearly" });
      filterStart = `${year}-01-01`;
      filterEnd = `${year}-12-31`;
    } else if (type !== 'all') {
      return res.status(400).json({ message: "Invalid filter type. Choose: daily, monthly, yearly, all" });
    }

    const salesAll = await Sale.find({});
    const expensesAll = await Expense.find({});

    const parseDateForFilter = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes(',')) {
        const [day, month, yearPart] = dateStr.split(',')[0].trim().split('-');
        return `${yearPart}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        if (parts[2] && parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return null;
    };

    const isMatch = (dbDate, start, end) => {
      if (type === 'all') return true;
      const d = parseDateForFilter(dbDate);
      if (!d) return false;
      return d >= start && d <= end;
    };

    let totalIncome = 0;
    let totalExpenses = 0;

    salesAll.forEach(s => {
      if (isMatch(s.date, filterStart, filterEnd)) {
        totalIncome += Number(s.totalAmount || 0);
      }
    });

    expensesAll.forEach(e => {
      if (isMatch(e.date, filterStart, filterEnd)) {
        totalExpenses += Number(e.amount || 0);
      }
    });

    res.status(200).json({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    });

  } catch (error) {
    res.status(500).json({ message: "Error calculating turnover", error: error.message });
  }
};

const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Production = require('../models/Production');
<<<<<<< HEAD
const Product = require('../models/Product');

exports.getAnalytics = async (req, res) => {
  try {
    let { startDate, endDate, type, month, year, date } = req.query;
    
    // Auto-generate date range based on 'type' if provided (matches user spec)
    if (type) {
      const now = new Date();
      if (type === 'daily') {
        // PRIORITIZE 'date' parameter, then startDate, then current local date
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

    // Fetch all for current calculations
    const salesAll = await Sale.find({});
    const expensesAll = await Expense.find({});
    const productionsAll = await Production.find({});
    const productsAll = await Product.find({});

    const parseDbDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        // Sales format: "27-03-2026, 09:30 am"
        if (dateStr.includes(',')) {
          const cleanDate = dateStr.split(',')[0].trim(); 
          const [day, month, year] = cleanDate.split('-');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Expense/Production format: "2026-02-20" or "2026-2-20"
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts[0].length === 4) { // YYYY-MM-DD
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else if (parts[2] && parts[2].length === 4) { // DD-MM-YYYY
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    const isWithinRange = (dateStr, start, end) => {
      if (!start && !end) return true; // All Time
      if (!dateStr) return false;

      // Handle "Daily" specifically for exact string prefix match (Reliable for Sale: "DD-MM-YYYY, ...")
      if (start === end && start) {
        // start is "YYYY-MM-DD"
        const [y, m, d] = start.split('-');
        const targetPrefix = `${d}-${m}-${y}`; // "DD-MM-YYYY"
        if (dateStr.startsWith(targetPrefix)) return true;
        // Fallback to standard check
      }

      const d = parseDbDate(dateStr); 
      if (!d) return false;
      
      if (start && d < start) return false;
      if (end && d > end) return false;
      
      return true;
    };

    // Filter by date range if provided
    const sales = salesAll.filter(s => isWithinRange(s.date, startDate, endDate));
    const expenses = expensesAll.filter(e => isWithinRange(e.date, startDate, endDate));
    const productions = productionsAll.filter(p => isWithinRange(p.date, startDate, endDate));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Calculate aggregations
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
    const prodSizeDataMap = {};

    // Helper to get month-over-month context
    const getMonthStr = (d) => {
      if (typeof d === 'string') return d.substring(0, 7); // Already YYYY-MM
      const date = new Date(d);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    // Determine the context for "Current Month" and "Previous Month"
    // If startDate is "2026-04-01", context is "2026-04"
    let contextMonthStr = getMonthStr(now);
    if (startDate && startDate.length >= 7) {
      contextMonthStr = startDate.substring(0, 7);
    }
    
    const contextParts = contextMonthStr.split('-');
    const contextDate = new Date(parseInt(contextParts[0]), parseInt(contextParts[1]) - 1, 1);
    const prevContextDate = new Date(contextDate.getFullYear(), contextDate.getMonth() - 1, 1);
    const prevContextMonthStr = getMonthStr(prevContextDate);

    // Process Sales (Always search ALL for MoM context, or use current filtered if it covers it)
    salesAll.forEach(sale => {
      const d = parseDbDate(sale.date);
      if (!d) return;

      const mStr = getMonthStr(d);
      const amt = Number(sale.totalAmount || 0);

      if (mStr === contextMonthStr) currentMonthIncome += amt;
      if (mStr === prevContextMonthStr) prevMonthIncome += amt;
      
      // But only add to specific chart and total if it's within the requested filter range
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

    // Process Expenses
    const expenseCategoryMap = {};
    expensesAll.forEach(exp => {
      if (isWithinRange(exp.date, startDate, endDate)) {
        const amt = Number(exp.amount || 0);
        totalExpenses += amt;

        const cat = exp.category || 'Other';
        if (!expenseCategoryMap[cat]) expenseCategoryMap[cat] = 0;
        expenseCategoryMap[cat] += amt;
      }
    });

    // Process Production
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

        if (prod.size) {
          if (!prodSizeDataMap[prod.size]) prodSizeDataMap[prod.size] = 0;
          prodSizeDataMap[prod.size] += qty;
        }
      }
    });

    // Format Data for Recharts
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

    // 3. Stock Distribution by Size
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

    // 4. Calculate Comparison Data (Dynamic based on filter duration)
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
        // Daily: Prev is Yesterday
        pStart.setDate(start.getDate() - 1);
        pEnd.setDate(end.getDate() - 1);
      } else {
        // Range: Shift by same duration
        pStart.setTime(start.getTime() - diff - 86400000);
        pEnd.setTime(end.getTime() - diff - 86400000);
      }

      const cs = pStart.toISOString().split('T')[0];
      const ce = pEnd.toISOString().split('T')[0];

      salesAll.forEach(s => { if (isWithinRange(s.date, cs, ce)) prevPeriodIncome += Number(s.totalAmount || 0); });
      productionsAll.forEach(p => { if (isWithinRange(p.date, cs, ce)) prevPeriodProd += Number(p.quantity || 0); });
    }

    res.status(200).json({
=======

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
>>>>>>> 9a2c2f56d86f12dfc80c527d3013ce8c50eaa58a
      financials: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
<<<<<<< HEAD
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
// @desc    Get Turnover Summary (New Unified API matching formal spec)
// @route   GET /api/turnover?type=monthly&month=3&year=2026
exports.getTurnoverSummary = async (req, res) => {
  try {
    const { type, date, month, year } = req.query;

    // 1. Validation
    if (!type) return res.status(400).json({ message: "Filter 'type' is required (daily, monthly, yearly, all)" });
    
    let filterStart, filterEnd;
    const now = new Date();
    
    if (type === 'daily') {
      if (!date) return res.status(400).json({ message: "Query parameter 'date' (YYYY-MM-DD) is required for type=daily" });
      filterStart = date;
      filterEnd = date;
    } else if (type === 'monthly') {
      if (!month || !year) return res.status(400).json({ message: "Parameters 'month' (1-12) and 'year' are required for type=monthly" });
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

    // 2. Data Fetching & Calculation (Mapping Sale as Income)
    const salesAll = await Sale.find({});
    const expensesAll = await Expense.find({});

    const parseDateForFilter = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes(',')) {
        const [dM, y] = dateStr.split(',')[0].trim().split('-');
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

    // 3. Response JSON
    res.status(200).json({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    });

  } catch (error) {
    res.status(500).json({ message: "Error calculating turnover", error: error.message });
  }
};
=======
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
>>>>>>> 9a2c2f56d86f12dfc80c527d3013ce8c50eaa58a

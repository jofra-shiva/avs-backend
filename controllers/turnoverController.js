const Turnover = require('../models/Turnover');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Production = require('../models/Production');
const Product = require('../models/Product');

// Get all manual turnover records
exports.getManualTurnovers = async (req, res) => {
  try {
    const turnovers = await Turnover.find({}).sort({ date: -1 });
    res.json(turnovers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching turnover records', error: error.message });
  }
};

// Create a manual turnover record
exports.createTurnover = async (req, res) => {
  try {
    const { date, amount, category, notes } = req.body;
    const turnover = await Turnover.create({
      date: date || new Date(),
      amount: Number(amount),
      category: category || 'General Sales',
      notes: notes || ''
    });
    res.status(201).json(turnover);
  } catch (error) {
    res.status(400).json({ message: 'Error creating turnover record', error: error.message });
  }
};

// Update a turnover record
exports.updateTurnover = async (req, res) => {
  try {
    const turnover = await Turnover.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!turnover) return res.status(404).json({ message: 'Record not found' });
    res.json(turnover);
  } catch (error) {
    res.status(400).json({ message: 'Error updating record', error: error.message });
  }
};

// Delete a turnover record
exports.deleteTurnover = async (req, res) => {
  try {
    const turnover = await Turnover.findByIdAndDelete(req.params.id);
    if (!turnover) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting record', error: error.message });
  }
};

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
    const manualTurnovers = await Turnover.find({}).lean();
    
    const parseDbDate = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
      try {
        const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;

        const ymdMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;

        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
           const y = dObj.getFullYear();
           const m = String(dObj.getMonth() + 1).padStart(2, '0');
           const d = String(dObj.getDate()).padStart(2, '0');
           return `${y}-${m}-${d}`;
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
      let d;
      if (date instanceof Date) d = date;
      else {
        const parsed = parseDbDate(date);
        d = parsed ? new Date(parsed) : new Date(date);
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalProductionQty = 0;

    let currentPeriodIncome = 0;
    let prevPeriodIncome = 0;

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

    const contextYear = contextDate.getFullYear();
    for (let i = 0; i < 12; i++) {
      const d = new Date(contextYear, i, 1);
      const mStr = getMonthStr(d);
      fullTrendIncomeData[mStr] = 0;
      monthlyProductionData[mStr] = 0;
    }

    // Process Sales (Calculated Turnover)
    salesAll.forEach(sale => {
      let d = parseDbDate(sale.date);
      let mStr = d ? getMonthStr(d) : "History";
      const amt = Number(sale.totalAmount || 0);

      if (fullTrendIncomeData[mStr] !== undefined) fullTrendIncomeData[mStr] += amt;
      if (mStr === contextMonthStr) currentPeriodIncome += amt;
      if (mStr === prevContextMonthStr) prevPeriodIncome += amt;

      if (isWithinRange(sale.date, startDate, endDate)) {
        totalIncome += amt;
        if (sale.saleItems) {
          sale.saleItems.forEach(item => {
            if (item.size) {
              salesSizeDataMap[item.size] = (salesSizeDataMap[item.size] || 0) + Number(item.qty || 0);
            }
          });
        }
      }
    });

    // Process Manual Turnovers (Explicit Turnover records)
    manualTurnovers.forEach(t => {
      let d = parseDbDate(t.date);
      let mStr = d ? getMonthStr(d) : "History";
      const amt = Number(t.amount || 0);

      if (fullTrendIncomeData[mStr] !== undefined) fullTrendIncomeData[mStr] += amt;
      if (mStr === contextMonthStr) currentPeriodIncome += amt;
      if (mStr === prevContextMonthStr) prevPeriodIncome += amt;

      if (isWithinRange(t.date, startDate, endDate)) {
        totalIncome += amt;
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

      if (isWithinRange(prod.date, startDate, endDate)) {
        totalProductionQty += qty;
        if (monthlyProductionData[mStr] !== undefined) monthlyProductionData[mStr] += qty;
        if (prod.size) {
          productionSizeDataMap[prod.size] = (productionSizeDataMap[prod.size] || 0) + qty;
        }
      }
    });

    const formatChartLabel = m => {
      const [year, month] = m.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'short' });
    };

    const fullMonthlyChart = Object.keys(fullTrendIncomeData).sort().map(m => ({
      name: formatChartLabel(m), Income: fullTrendIncomeData[m]
    }));

    res.json({
      financials: {
        totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses,
        currentMonthIncome: currentPeriodIncome, prevMonthIncome: prevPeriodIncome,
        incomeGrowthPercent: prevPeriodIncome ? (((currentPeriodIncome - prevPeriodIncome) / prevPeriodIncome) * 100).toFixed(1) : (currentPeriodIncome ? 100 : 0)
      },
      charts: {
        fullMonthlyChart,
        salesSizeChart: Object.keys(salesSizeDataMap).map(s => ({ name: s, SalesQty: salesSizeDataMap[s] })),
        prodSizeChart: Object.keys(productionSizeDataMap).map(s => ({ name: s, ProdQty: productionSizeDataMap[s] })),
        expenseCatChart: Object.keys(expenseCategoryMap).map(cat => ({ name: cat, Amount: expenseCategoryMap[cat] })).sort((a,b) => b.Amount - a.Amount)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving analytics summary', error: error.message });
  }
};

exports.getTurnoverSummary = exports.getAnalytics;

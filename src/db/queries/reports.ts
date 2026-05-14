import { dbClient } from '../client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export async function getMonthlyReport(monthDate: Date = new Date()) {
  const startDateStr = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfMonth(monthDate), 'yyyy-MM-dd');

  // get all days in the month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate)
  }).map(d => format(d, 'yyyy-MM-dd'));

  // Get sales per day
  const salesQuery = `
    SELECT invoice_date as date, 
           SUM(total_amount) as total_sales,
           SUM(paid_amount) as paid_amount,
           SUM(debt_amount) as debt_amount
    FROM invoices 
    WHERE invoice_date BETWEEN ? AND ? AND status != 'cancelled'
    GROUP BY invoice_date
  `;
  const salesResult = await dbClient.query(salesQuery, [startDateStr, endDateStr]);

  // Get expenses per day
  const expensesQuery = `
    SELECT expense_date as date, 
           SUM(amount) as total_expenses
    FROM expenses 
    WHERE expense_date BETWEEN ? AND ?
    GROUP BY expense_date
  `;
  const expResult = await dbClient.query(expensesQuery, [startDateStr, endDateStr]);

  // Map to a dictionary for fast lookup
  const salesMap: Record<string, any> = {};
  salesResult.forEach(s => { salesMap[s.date] = s; });

  const expMap: Record<string, any> = {};
  expResult.forEach(e => { expMap[e.date] = e; });

  const dailyReport = daysInMonth.map(dateStr => {
    const s = salesMap[dateStr] || { total_sales: 0, paid_amount: 0, debt_amount: 0 };
    const e = expMap[dateStr] || { total_expenses: 0 };
    return {
      date: dateStr,
      sales: s.total_sales,
      paid_sales: s.paid_amount,
      debt_sales: s.debt_amount,
      expenses: e.total_expenses,
      netProfit: s.total_sales - e.total_expenses
    };
  });

  const totals = dailyReport.reduce((acc, curr) => ({
    sales: acc.sales + curr.sales,
    paid_sales: acc.paid_sales + curr.paid_sales,
    debt_sales: acc.debt_sales + curr.debt_sales,
    expenses: acc.expenses + curr.expenses,
    netProfit: acc.netProfit + curr.netProfit,
  }), { sales: 0, paid_sales: 0, debt_sales: 0, expenses: 0, netProfit: 0 });

  return { dailyReport: dailyReport.reverse(), totals }; // reverse so newest is on top
}

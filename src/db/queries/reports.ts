import { dbClient } from '../client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export async function getComprehensiveMonthlyReport(monthDate: Date = new Date()) {
  const startDateStr = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfMonth(monthDate), 'yyyy-MM-dd');

  // get all days in the month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate)
  }).map(d => format(d, 'yyyy-MM-dd'));

  // 1. Get daily sales
  const salesQuery = `
    SELECT invoice_date as date, 
           SUM(total_amount) as total_sales,
           SUM(paid_amount) as paid_amount,
           SUM(discount_amount) as discount_amount
    FROM invoices 
    WHERE invoice_date BETWEEN ? AND ? AND status != 'cancelled'
    GROUP BY invoice_date
  `;
  const salesResult = await dbClient.query(salesQuery, [startDateStr, endDateStr]);

  // 2. Get daily expenses
  const expensesQuery = `
    SELECT expense_date as date, 
           SUM(amount) as total_expenses
    FROM expenses 
    WHERE expense_date BETWEEN ? AND ?
    GROUP BY expense_date
  `;
  const expResult = await dbClient.query(expensesQuery, [startDateStr, endDateStr]);

  // 3. Sales By Category
  const salesByCategoryQuery = `
    SELECT c.name as category, SUM(ii.total_price) as total
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    JOIN products p ON ii.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.invoice_date BETWEEN ? AND ? AND i.status != 'cancelled'
    GROUP BY c.name
    ORDER BY total DESC
  `;
  const salesByCategory = await dbClient.query(salesByCategoryQuery, [startDateStr, endDateStr]);

  // 4. Top Products
  const topProductsQuery = `
    SELECT p.name, SUM(ii.quantity) as qty, SUM(ii.total_price) as total
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    JOIN products p ON ii.product_id = p.id
    WHERE i.invoice_date BETWEEN ? AND ? AND i.status != 'cancelled'
    GROUP BY p.id
    ORDER BY total DESC
    LIMIT 10
  `;
  const topProducts = await dbClient.query(topProductsQuery, [startDateStr, endDateStr]);

  // 5. Expenses By Category
  const expensesByCategoryQuery = `
    SELECT ec.name as category, SUM(e.amount) as total
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.expense_date BETWEEN ? AND ?
    GROUP BY ec.name
    ORDER BY total DESC
  `;
  const expensesByCategory = await dbClient.query(expensesByCategoryQuery, [startDateStr, endDateStr]);

  // Map to a dictionary for fast lookup
  const salesMap: Record<string, any> = {};
  salesResult.forEach(s => { salesMap[s.date] = s; });

  const expMap: Record<string, any> = {};
  expResult.forEach(e => { expMap[e.date] = e; });

  const dailyReport = daysInMonth.map(dateStr => {
    const s = salesMap[dateStr] || { total_sales: 0, paid_amount: 0, discount_amount: 0 };
    const e = expMap[dateStr] || { total_expenses: 0 };
    return {
      date: dateStr,
      sales: s.total_sales,
      paid_sales: s.paid_amount,
      discount: s.discount_amount,
      expenses: e.total_expenses,
      netProfit: s.total_sales - e.total_expenses
    };
  });

  const totals = dailyReport.reduce((acc, curr) => ({
    sales: acc.sales + curr.sales,
    paid_sales: acc.paid_sales + curr.paid_sales,
    expenses: acc.expenses + curr.expenses,
    netProfit: acc.netProfit + curr.netProfit,
    discount: acc.discount + curr.discount,
  }), { sales: 0, paid_sales: 0, expenses: 0, netProfit: 0, discount: 0 });

  return { 
    dailyReport: dailyReport.reverse(), 
    totals,
    salesByCategory,
    topProducts,
    expensesByCategory
  };
}

const { pool } = require('../config/database');

// Get investment packages
const getPackages = async (req, res) => {
    try {
        const [packages] = await pool.execute(
            `SELECT * FROM investment_packages WHERE is_active = TRUE ORDER BY min_investment ASC`
        );

        res.json({
            success: true,
            data: packages
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investment packages'
        });
    }
};

// Get user's investments
const getUserInvestments = async (req, res) => {
    try {
        const [investments] = await pool.execute(
            `SELECT ui.*,
                    ip.package_name,
                    ip.return_multiplier,
                    ip.daily_yield_rate,
                    ip.min_investment as package_min_investment,
                    ip.max_investment as package_max_investment,
                    COALESCE(ps.paid_amount, 0) as paid_amount,
                    COALESCE(ps.remaining_amount, ui.investment_amount) as remaining_amount,
                    CASE 
                        WHEN ui.status = 'active' THEN ui.current_value
                        ELSE ui.investment_amount
                    END as display_value
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
             WHERE ui.user_id = ?
             ORDER BY ui.created_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: investments
        });
    } catch (error) {
        console.error('Error fetching investments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investments'
        });
    }
};

// Get investment stats summary
const getInvestmentStats = async (req, res) => {
    try {
        const [stats] = await pool.execute(
            `SELECT
                -- Total invested from confirmed payments
                COALESCE((
                    SELECT SUM(amount) 
                    FROM payment_transactions pt 
                    WHERE pt.user_id = ? 
                    AND pt.status = 'confirmed'
                ), 0) as total_invested,
                
                -- Only count active investments
                COUNT(CASE WHEN ui.status = 'active' THEN 1 END) as active_investments,
                
                -- Only sum expected returns for active investments
                COALESCE(SUM(CASE WHEN ui.status = 'active' THEN ui.expected_return ELSE 0 END), 0) as total_returns,
                
                -- Sum current value only for active investments
                COALESCE(SUM(CASE WHEN ui.status = 'active' THEN ui.current_value ELSE 0 END), 0) as current_value,
                
                -- Total paid from confirmed payments
                COALESCE((
                    SELECT SUM(amount) 
                    FROM payment_transactions pt 
                    WHERE pt.user_id = ? 
                    AND pt.status = 'confirmed'
                ), 0) as total_paid
             FROM user_investments ui
             WHERE ui.user_id = ?`,
            [req.user.id, req.user.id, req.user.id]
        );

        res.json({
            success: true,
            data: {
                summary: stats[0]
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investment statistics'
        });
    }
};

// Get single investment details
const getInvestmentById = async (req, res) => {
    try {
        const [investments] = await pool.execute(
            `SELECT ui.*,
                    ip.package_name,
                    ip.return_multiplier,
                    ip.daily_yield_rate,
                    ip.min_investment as package_min_investment,
                    ip.max_investment as package_max_investment,
                    COALESCE(ps.paid_amount, 0) as paid_amount,
                    COALESCE(ps.remaining_amount, ui.investment_amount) as remaining_amount,
                    ps.due_date,
                    ps.status as payment_status,
                    CASE 
                        WHEN ui.status = 'active' THEN ui.current_value
                        ELSE ui.investment_amount
                    END as display_value
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
             WHERE ui.id = ? AND ui.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (investments.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Investment not found'
            });
        }

        // Add min_investment from package to the response
        const investment = investments[0];
        investment.min_investment = investment.package_min_investment;
        investment.max_investment = investment.package_max_investment;

        res.json({
            success: true,
            data: investment
        });
    } catch (error) {
        console.error('Error fetching investment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investment details'
        });
    }
};

// Create new investment with flexible payment option
const createInvestment = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { package_id, investment_amount } = req.body;
        const user_id = req.user.id;

        await connection.beginTransaction();

        // Get package details
        const [packages] = await connection.execute(
            `SELECT * FROM investment_packages WHERE id = ? AND is_active = TRUE`,
            [package_id]
        );

        if (packages.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Investment package not found'
            });
        }

        const pkg = packages[0];

        // Validate amount - minimum $50, maximum package max
        if (investment_amount < 500) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Minimum payment is $500'
            });
        }
        
        if (investment_amount > pkg.max_investment) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: `Maximum investment amount is $${pkg.max_investment}`
            });
        }

        // Calculate expected return (full amount * multiplier)
        const expected_return = investment_amount * pkg.return_multiplier;

        // FIXED: Removed min_investment from INSERT since column doesn't exist
        // We'll get it from the package when needed
        const [result] = await connection.execute(
            `INSERT INTO user_investments 
             (user_id, package_id, investment_amount, expected_return, status, payment_deadline, current_value)
             VALUES (?, ?, ?, ?, 'pending_payment', DATE_ADD(NOW(), INTERVAL 14 DAY), ?)`,
            [user_id, package_id, investment_amount, expected_return, investment_amount]
        );
        
        const investment_id = result.insertId;

        // Create payment schedule with total required = investment_amount
        await connection.execute(
            `INSERT INTO payment_schedule
             (user_id, investment_id, due_date, total_required, remaining_amount)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY), ?, ?)`,
            [user_id, investment_id, investment_amount, investment_amount]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            data: {
                id: investment_id,
                message: 'Investment created successfully',
                note: `Minimum investment to start yielding: $${pkg.min_investment}`
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating investment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create investment'
        });
    } finally {
        connection.release();
    }
};

// Update investment status based on total paid
const updateInvestmentStatus = async (investmentId) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get total paid from confirmed payments
        const [payments] = await connection.execute(
            `SELECT SUM(amount) as total_paid 
             FROM payment_transactions 
             WHERE investment_id = ? AND status = 'confirmed'`,
            [investmentId]
        );
        
        const totalPaid = payments[0].total_paid || 0;
        
        // Get investment and package details
        const [investments] = await connection.execute(
            `SELECT ui.*, ip.min_investment 
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             WHERE ui.id = ?`,
            [investmentId]
        );
        
        if (investments.length > 0) {
            const investment = investments[0];
            
            // Check if minimum investment reached and investment is not already active
            if (totalPaid >= investment.min_investment && investment.status === 'pending_payment') {
                // Activate investment - start yielding
                await connection.execute(
                    `UPDATE user_investments 
                     SET status = 'active', 
                         yield_start_date = NOW(),
                         current_value = ?
                     WHERE id = ?`,
                    [totalPaid, investmentId]
                );
                
                console.log(`💰 Investment ${investmentId} ACTIVATED! Minimum investment $${investment.min_investment} reached with $${totalPaid}`);
            }
            
            // Update current value if active
            if (investment.status === 'active') {
                // Calculate yield based on daily rate and days since activation
                await connection.execute(
                    `UPDATE user_investments ui
                     JOIN investment_packages ip ON ui.package_id = ip.id
                     SET ui.current_value = ui.investment_amount * 
                         POWER(1 + (ip.daily_yield_rate/100), 
                         DATEDIFF(NOW(), ui.yield_start_date))
                     WHERE ui.id = ? AND ui.status = 'active'`,
                    [investmentId]
                );
            }
        }
        
        await connection.commit();
        
    } catch (error) {
        await connection.rollback();
        console.error('Error updating investment status:', error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getPackages,
    getUserInvestments,
    getInvestmentStats,
    getInvestmentById,
    createInvestment,
    updateInvestmentStatus
};

// Get yield history for an investment
const getYieldHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First verify the investment belongs to the user
    const [investments] = await pool.execute(
      `SELECT ui.*, ip.daily_yield_rate 
       FROM user_investments ui
       JOIN investment_packages ip ON ui.package_id = ip.id
       WHERE ui.id = ? AND ui.user_id = ? AND ui.status = 'active'`,
      [id, userId]
    );

    if (investments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Active investment not found'
      });
    }

    const investment = investments[0];
    const dailyRate = investment.daily_yield_rate / 100;
    const startDate = new Date(investment.yield_start_date);
    const today = new Date();
    const daysActive = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    const history = [];
    let currentValue = parseFloat(investment.investment_amount);
    
    for (let day = 1; day <= Math.min(daysActive, 180); day++) {
      const dailyYield = currentValue * dailyRate;
      const endValue = currentValue + dailyYield;
      
      history.push({
        day: day,
        date: new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000).toISOString(),
        startValue: currentValue,
        yieldEarned: dailyYield,
        endValue: endValue
      });
      
      currentValue = endValue;
    }
    
    const totalYield = history.reduce((sum, h) => sum + h.yieldEarned, 0);
    
    res.json({
      success: true,
      data: {
        history,
        totalYield,
        currentValue: currentValue,
        daysActive
      }
    });
  } catch (error) {
    console.error('Error fetching yield history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch yield history'
    });
  }
};

module.exports.getYieldHistory = getYieldHistory;

// Get yield history for an investment
const getYieldHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify investment belongs to user
    const [investments] = await pool.execute(
      `SELECT ui.*, ip.daily_yield_rate, ip.package_name
       FROM user_investments ui
       JOIN investment_packages ip ON ui.package_id = ip.id
       WHERE ui.id = ? AND ui.user_id = ?`,
      [id, userId]
    );

    if (investments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }

    const investment = investments[0];
    
    // If investment is not active, return empty history
    if (investment.status !== 'active') {
      return res.json({
        success: true,
        data: {
          history: [],
          totalYield: 0,
          currentValue: parseFloat(investment.investment_amount),
          daysActive: 0,
          message: 'Investment not yet active - yields start when minimum investment is reached'
        }
      });
    }

    const dailyRate = parseFloat(investment.daily_yield_rate) / 100;
    const startDate = new Date(investment.yield_start_date);
    const today = new Date();
    const daysActive = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    const history = [];
    let currentValue = parseFloat(investment.investment_amount);
    const maxDays = Math.min(daysActive, 180);
    
    for (let day = 1; day <= maxDays; day++) {
      const dailyYield = currentValue * dailyRate;
      const endValue = currentValue + dailyYield;
      
      history.push({
        day: day,
        date: new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000).toISOString(),
        startValue: currentValue,
        yieldEarned: dailyYield,
        endValue: endValue
      });
      
      currentValue = endValue;
    }
    
    const totalYield = history.reduce((sum, h) => sum + h.yieldEarned, 0);
    
    res.json({
      success: true,
      data: {
        history,
        totalYield,
        currentValue: currentValue,
        daysActive,
        dailyRate: investment.daily_yield_rate
      }
    });
  } catch (error) {
    console.error('Error fetching yield history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch yield history'
    });
  }
};

module.exports.getYieldHistory = getYieldHistory;

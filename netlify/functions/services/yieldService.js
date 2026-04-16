const { pool } = require('../config/database');

class YieldService {
    constructor() {
        this.yieldPeriodDays = 180; // 6 months
    }

    calculateCurrentValue(initialAmount, daysPassed, totalYieldPercent) {
        const dailyRate = Math.pow(1 + (totalYieldPercent / 100), 1 / this.yieldPeriodDays) - 1;
        let currentValue = initialAmount;
        for (let i = 0; i < daysPassed; i++) {
            currentValue = currentValue * (1 + dailyRate);
        }
        return Math.round(currentValue * 100) / 100;
    }

    async updateAllYields() {
        try {
            const [investments] = await pool.execute(
                `SELECT ui.*, ip.yield_rate 
                 FROM user_investments ui
                 JOIN investment_packages ip ON ui.package_id = ip.id
                 WHERE ui.status = 'active' 
                 AND ui.yield_start_date IS NOT NULL`
            );

            console.log(`Updating yields for ${investments.length} active investments`);

            for (const investment of investments) {
                const startDate = new Date(investment.yield_start_date);
                const today = new Date();
                const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                
                if (daysPassed >= 1) {
                    let currentValue;
                    
                    if (investment.yield_rate === 100) {
                        const progress = Math.min(daysPassed, this.yieldPeriodDays) / this.yieldPeriodDays;
                        currentValue = investment.investment_amount * (1 + progress);
                    } else if (investment.yield_rate === 200) {
                        const progress = Math.min(daysPassed, this.yieldPeriodDays) / this.yieldPeriodDays;
                        currentValue = investment.investment_amount * (1 + (progress * 2));
                    } else {
                        currentValue = this.calculateCurrentValue(
                            parseFloat(investment.investment_amount),
                            Math.min(daysPassed, this.yieldPeriodDays),
                            parseFloat(investment.yield_rate)
                        );
                    }
                    
                    currentValue = Math.round(currentValue * 100) / 100;

                    await pool.execute(
                        `UPDATE user_investments 
                         SET current_value = ? 
                         WHERE id = ?`,
                        [currentValue, investment.id]
                    );
                }
            }

            const [completed] = await pool.execute(
                `UPDATE user_investments 
                 SET status = 'completed' 
                 WHERE status = 'active' 
                 AND DATE_ADD(yield_start_date, INTERVAL ? DAY) <= NOW()`,
                [this.yieldPeriodDays]
            );

            return {
                updated: investments.length,
                completed: completed.affectedRows
            };

        } catch (error) {
            console.error('Error updating yields:', error.message);
            return { updated: 0, completed: 0 };
        }
    }
}

module.exports = YieldService;

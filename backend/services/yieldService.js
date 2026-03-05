const pool = require('../config/database');

class YieldService {
    constructor() {
        this.yieldPeriodDays = 180; // 6 months = 180 days
    }

    // Calculate daily yield rate based on total yield percentage
    getDailyRate(totalYieldPercent) {
        // Formula: (1 + dailyRate)^180 = 1 + (totalYieldPercent/100)
        // dailyRate = (1 + totalYieldPercent/100)^(1/180) - 1
        return Math.pow(1 + (totalYieldPercent / 100), 1 / this.yieldPeriodDays) - 1;
    }

    // Calculate current value based on days passed and yield rate
    calculateCurrentValue(initialAmount, daysPassed, totalYieldPercent) {
        const dailyRate = this.getDailyRate(totalYieldPercent);
        // Compound interest: A = P(1 + r)^t
        let currentValue = initialAmount;
        for (let i = 0; i < daysPassed; i++) {
            currentValue = currentValue * (1 + dailyRate);
        }
        return Math.round(currentValue * 100) / 100;
    }

    // Calculate final value after 180 days
    calculateFinalValue(initialAmount, totalYieldPercent) {
        return this.calculateCurrentValue(initialAmount, this.yieldPeriodDays, totalYieldPercent);
    }

    // Get yield progress for an investment
    async getYieldProgress(investmentId) {
        try {
            const [investment] = await pool.execute(
                `SELECT ui.*, ip.yield_rate 
                 FROM user_investments ui
                 JOIN investment_packages ip ON ui.package_id = ip.id
                 WHERE ui.id = ?`,
                [investmentId]
            );

            if (investment.length === 0) {
                throw new Error('Investment not found');
            }

            const inv = investment[0];
            
            if (!inv.yield_start_date || inv.status !== 'active') {
                return {
                    isActive: false,
                    status: inv.status,
                    message: 'Investment is not actively yielding'
                };
            }

            const startDate = new Date(inv.yield_start_date);
            const today = new Date();
            const maturityDate = new Date(startDate);
            maturityDate.setDate(maturityDate.getDate() + this.yieldPeriodDays);
            
            // Calculate days passed
            const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            
            // Cap at 180 days
            const effectiveDays = Math.min(daysPassed, this.yieldPeriodDays);
            
            // Calculate current value based on package yield rate
            const currentValue = this.calculateCurrentValue(
                parseFloat(inv.investment_amount), 
                effectiveDays,
                parseFloat(inv.yield_rate)
            );
            
            const finalValue = this.calculateFinalValue(
                parseFloat(inv.investment_amount),
                parseFloat(inv.yield_rate)
            );
            
            // Calculate progress percentage
            const progressPercentage = (effectiveDays / this.yieldPeriodDays) * 100;
            
            return {
                investmentId: investmentId,
                isActive: true,
                startDate: inv.yield_start_date,
                maturityDate: maturityDate,
                daysPassed: effectiveDays,
                daysRemaining: this.yieldPeriodDays - effectiveDays,
                initialAmount: parseFloat(inv.investment_amount),
                currentValue: currentValue,
                finalValue: finalValue,
                yieldRate: parseFloat(inv.yield_rate),
                profit: currentValue - parseFloat(inv.investment_amount),
                finalProfit: finalValue - parseFloat(inv.investment_amount),
                progressPercentage: progressPercentage,
                isMatured: effectiveDays >= this.yieldPeriodDays
            };

        } catch (error) {
            console.error('Error getting yield progress:', error.message);
            throw error;
        }
    }

    // Get full projection for an investment amount
    getProjection(initialAmount, yieldRate) {
        const projection = [];
        const dailyRate = this.getDailyRate(yieldRate);
        let currentValue = parseFloat(initialAmount);
        
        for (let day = 1; day <= this.yieldPeriodDays; day++) {
            currentValue = currentValue * (1 + dailyRate);
            projection.push({
                day: day,
                value: Math.round(currentValue * 100) / 100,
                growth: Math.round((currentValue - initialAmount) * 100) / 100,
                growthPercentage: Math.round(((currentValue - initialAmount) / initialAmount) * 10000) / 100
            });
        }
        
        return projection;
    }

    // Update all active investments
    async updateAllYields() {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get all active investments with their package yield rates
            const [investments] = await connection.execute(
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
                    const currentValue = this.calculateCurrentValue(
                        parseFloat(investment.investment_amount),
                        Math.min(daysPassed, this.yieldPeriodDays),
                        parseFloat(investment.yield_rate)
                    );

                    await connection.execute(
                        `UPDATE user_investments 
                         SET current_value = ? 
                         WHERE id = ?`,
                        [currentValue, investment.id]
                    );

                    // Track yield
                    const dayToTrack = Math.min(daysPassed, this.yieldPeriodDays);
                    const [existing] = await connection.execute(
                        `SELECT id FROM yield_tracking 
                         WHERE investment_id = ? AND day_number = ?`,
                        [investment.id, dayToTrack]
                    );

                    if (existing.length === 0) {
                        await connection.execute(
                            `INSERT INTO yield_tracking 
                             (investment_id, day_number, value_on_day) 
                             VALUES (?, ?, ?)`,
                            [investment.id, dayToTrack, currentValue]
                        );
                    }
                }
            }

            // Check for completed investments (matured)
            const [completed] = await connection.execute(
                `UPDATE user_investments 
                 SET status = 'completed' 
                 WHERE status = 'active' 
                 AND DATE_ADD(yield_start_date, INTERVAL ? DAY) <= NOW()`,
                [this.yieldPeriodDays]
            );

            if (completed.affectedRows > 0) {
                console.log(`${completed.affectedRows} investments have completed their yield period`);
            }

            await connection.commit();

            return {
                updated: investments.length,
                completed: completed.affectedRows
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error updating yields:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // Calculate days until completion
    getDaysUntilCompletion(maturityDate) {
        const today = new Date();
        const maturity = new Date(maturityDate);
        const diffTime = maturity - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
}

module.exports = YieldService;

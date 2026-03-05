-- Update investment_packages table with new yield rates
ALTER TABLE investment_packages 
ADD COLUMN yield_rate DECIMAL(5,2) DEFAULT 100.0 AFTER return_multiplier;

-- Set Platinum to 200% yield
UPDATE investment_packages 
SET yield_rate = 100.0 WHERE package_name != 'Platinum';
UPDATE investment_packages 
SET yield_rate = 200.0 WHERE package_name = 'Platinum';

-- Remove payment_deadline from user_investments
ALTER TABLE user_investments 
DROP COLUMN payment_deadline;

-- Update status options
ALTER TABLE user_investments 
MODIFY COLUMN status ENUM('pending_payment', 'active', 'completed', 'withdrawn', 'defaulted') DEFAULT 'pending_payment';

-- Update payment_schedule table (simplify)
ALTER TABLE payment_schedule 
DROP COLUMN due_date,
DROP COLUMN status,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add minimum investment requirement
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('minimum_investment', '1000', 'Minimum investment amount required');

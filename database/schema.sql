-- PrimeStone Investment Database Schema
-- Created for authorized security testing lab only

CREATE DATABASE IF NOT EXISTS primestone_db;
USE primestone_db;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- User wallet addresses (for receiving withdrawals)
CREATE TABLE user_wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    chain ENUM('TRC20', 'BEP20') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_wallets (user_id, chain)
);

-- Investment packages
CREATE TABLE investment_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_name VARCHAR(100) NOT NULL,
    min_investment DECIMAL(15,2) NOT NULL,
    max_investment DECIMAL(15,2) NOT NULL,
    return_multiplier DECIMAL(5,2) NOT NULL DEFAULT 3.0,
    daily_yield_rate DECIMAL(5,2) DEFAULT 6.67,
    duration_days INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    color_class VARCHAR(50) DEFAULT 'blue',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_packages_active (is_active)
);

-- Insert default packages
INSERT INTO investment_packages (package_name, min_investment, max_investment, description, color_class) VALUES
('Bronze', 1000, 3000, 'Start your investment journey', 'bronze'),
('Silver', 2000, 6000, 'Grow your wealth steadily', 'silver'),
('Gold', 4000, 12000, 'Premium returns', 'gold'),
('Platinum', 8000, 24000, 'Elite investment tier', 'platinum');

-- User investments
CREATE TABLE user_investments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    investment_amount DECIMAL(15,2) NOT NULL,
    expected_return DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) DEFAULT 0,
    status ENUM('pending_payment', 'active', 'matured', 'withdrawn', 'defaulted') DEFAULT 'pending_payment',
    payment_deadline TIMESTAMP NULL,
    yield_start_date TIMESTAMP NULL,
    maturity_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_date TIMESTAMP NULL,
    fee_paid BOOLEAN DEFAULT FALSE,
    fee_payment_id INT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES investment_packages(id),
    INDEX idx_user_investments (user_id, status),
    INDEX idx_deadline (payment_deadline)
);

-- Payment schedule (for installment payments)
CREATE TABLE payment_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    investment_id INT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    minimum_payment DECIMAL(15,2) DEFAULT 50.00,
    total_required DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'partial', 'completed', 'overdue') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_payment_date TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (investment_id) REFERENCES user_investments(id),
    INDEX idx_schedule_status (status, due_date)
);

-- Company wallet addresses for receiving payments
CREATE TABLE company_wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chain ENUM('TRC20', 'BEP20') UNIQUE NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    token_contract VARCHAR(255) NOT NULL, -- USDT contract address
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert your company wallet addresses with token contracts
INSERT INTO company_wallets (chain, wallet_address, token_contract, description) VALUES
('TRC20', 'TGE4YbwSAcyYtkb9USJWKeXEjFNUstE584', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'Main TRC20 USDT wallet'),
('BEP20', '0x626Cf0750f44FEa35E1e295082fe80D0F6E9234a', '0x55d398326f99059fF775485246999027B3197955', 'Main BEP20 USDT wallet');

-- Payment transactions (for investment payments)
CREATE TABLE payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    investment_id INT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_type ENUM('investment', 'withdrawal_fee') NOT NULL,
    payment_method ENUM('TRC20', 'BEP20') NOT NULL,
    company_wallet_id INT NOT NULL,
    token_contract VARCHAR(255) NOT NULL,
    user_transaction_hash VARCHAR(255),
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    confirmations INT DEFAULT 0,
    status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmation_date TIMESTAMP NULL,
    verified_by_admin BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    blockchain_data JSON, -- Store full blockchain response
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (investment_id) REFERENCES user_investments(id),
    FOREIGN KEY (company_wallet_id) REFERENCES company_wallets(id),
    INDEX idx_transaction_status (status),
    INDEX idx_user_transactions (user_id, payment_date),
    INDEX idx_transaction_hash (user_transaction_hash)
);

-- Withdrawal fee payments (separate $500 fee)
CREATE TABLE fee_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    investment_id INT NOT NULL,
    amount DECIMAL(15,2) DEFAULT 500.00,
    payment_method ENUM('TRC20', 'BEP20') NOT NULL,
    company_wallet_id INT NOT NULL,
    token_contract VARCHAR(255) NOT NULL,
    user_transaction_hash VARCHAR(255),
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    confirmations INT DEFAULT 0,
    status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmation_date TIMESTAMP NULL,
    verified_by_admin BOOLEAN DEFAULT FALSE,
    blockchain_data JSON,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (investment_id) REFERENCES user_investments(id),
    FOREIGN KEY (company_wallet_id) REFERENCES company_wallets(id),
    INDEX idx_fee_status (status),
    UNIQUE KEY unique_investment_fee (investment_id),
    INDEX idx_fee_hash (user_transaction_hash)
);

-- Withdrawal requests
CREATE TABLE withdrawal_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    investment_id INT NOT NULL,
    fee_payment_id INT NOT NULL,
    requested_amount DECIMAL(15,2) NOT NULL,
    user_wallet_address VARCHAR(255) NOT NULL,
    user_wallet_chain ENUM('TRC20', 'BEP20') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by INT NULL,
    company_transaction_hash VARCHAR(255),
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (investment_id) REFERENCES user_investments(id),
    FOREIGN KEY (fee_payment_id) REFERENCES fee_payments(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_withdrawal_status (status)
);

-- Yield tracking (daily value updates)
CREATE TABLE yield_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    investment_id INT NOT NULL,
    day_number INT NOT NULL,
    value_on_day DECIMAL(15,2) NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investment_id) REFERENCES user_investments(id),
    UNIQUE KEY unique_investment_day (investment_id, day_number)
);

-- Blockchain verification log
CREATE TABLE blockchain_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_hash VARCHAR(255) NOT NULL,
    chain ENUM('TRC20', 'BEP20') NOT NULL,
    verification_type ENUM('payment', 'fee') NOT NULL,
    related_id INT, -- payment_transactions.id or fee_payments.id
    api_response TEXT,
    status ENUM('success', 'failed') NOT NULL,
    error_message TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verification_hash (transaction_hash)
);

-- Admin actions log
CREATE TABLE admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_admin_logs (admin_id, created_at)
);

-- API keys storage (encrypted)
CREATE TABLE api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service VARCHAR(100) UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    endpoint VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Store your API keys
INSERT INTO api_keys (service, api_key, endpoint) VALUES
('TRONGRID', '3c007310-e8bb-4deb-9184-605e5afc11bf', 'https://api.trongrid.io'),
('BSCSCAN', 'GJV951QFBDEND37QMPNF3KUZ1UMJEC3CYU', 'https://api.bscscan.com/api');

-- System settings
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('withdrawal_fee', '500', 'Fee required before withdrawal'),
('min_payment', '50', 'Minimum installment payment'),
('payment_deadline_days', '14', 'Days to complete payment'),
('yield_duration_days', '30', 'Days for investment to mature'),
('return_multiplier', '3.0', 'Investment return multiplier'),
('admin_email', 'admin@primestone.com', 'Admin notification email'),
('required_confirmations', '12', 'Required blockchain confirmations'),
('trc20_usdt_contract', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'TRC20 USDT Contract'),
('bep20_usdt_contract', '0x55d398326f99059fF775485246999027B3197955', 'BEP20 USDT Contract');

-- Create default admin user (password: Admin@123 - change immediately)
-- Hash: $2a$10$YourHashedPasswordHere
INSERT INTO users (username, email, password_hash, role, email_verified) VALUES
('admin', 'admin@primestone.com', '$2a$10$YourHashedPasswordHere', 'admin', TRUE);

-- Create indexes for performance
CREATE INDEX idx_payment_transactions_hash ON payment_transactions(user_transaction_hash);
CREATE INDEX idx_fee_payments_hash ON fee_payments(user_transaction_hash);
CREATE INDEX idx_withdrawal_requests_user ON withdrawal_requests(user_id, status);
CREATE INDEX idx_investments_maturity ON user_investments(maturity_date, status);
CREATE INDEX idx_blockchain_verifications ON blockchain_verifications(transaction_hash, chain);

-- Event to check expired investments (runs daily)
DELIMITER $$
CREATE EVENT IF NOT EXISTS check_expired_investments
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '00:00:00')
DO
BEGIN
    -- Mark investments as defaulted if payment deadline passed + 14 days
    UPDATE user_investments ui
    JOIN payment_schedule ps ON ui.id = ps.investment_id
    SET ui.status = 'defaulted',
        ps.status = 'overdue'
    WHERE ui.status = 'pending_payment'
    AND ps.due_date < DATE_SUB(NOW(), INTERVAL 14 DAY)
    AND ps.status IN ('pending', 'partial');
END$$
DELIMITER ;

-- Event to update daily yields
DELIMITER $$
CREATE EVENT IF NOT EXISTS update_daily_yields
ON SCHEDULE EVERY 6 HOUR
DO
BEGIN
    -- Update current values for active investments
    UPDATE user_investments
    SET current_value = investment_amount * POWER(1 + (SELECT daily_yield_rate/100 FROM investment_packages WHERE id = package_id), 
        DATEDIFF(NOW(), yield_start_date))
    WHERE status = 'active'
    AND yield_start_date IS NOT NULL
    AND maturity_date > NOW();
    
    -- Mark as matured
    UPDATE user_investments
    SET status = 'matured'
    WHERE status = 'active'
    AND maturity_date <= NOW();
END$$
DELIMITER ;

-- Add foreign key for fee_payment_id after both tables exist
ALTER TABLE user_investments
ADD CONSTRAINT fk_fee_payment
FOREIGN KEY (fee_payment_id) REFERENCES fee_payments(id);

-- Create view for investment summary
CREATE VIEW investment_summary AS
SELECT 
    ui.id,
    u.username,
    u.email,
    ip.package_name,
    ui.investment_amount,
    ui.expected_return,
    ui.current_value,
    ui.status,
    ui.payment_deadline,
    ui.yield_start_date,
    ui.maturity_date,
    ps.paid_amount,
    ps.remaining_amount,
    DATEDIFF(ui.payment_deadline, NOW()) as days_remaining,
    CASE 
        WHEN ui.status = 'matured' AND ui.fee_paid = FALSE THEN 'Fee Required'
        WHEN ui.status = 'matured' AND ui.fee_paid = TRUE THEN 'Ready for Withdrawal'
        ELSE ui.status
    END as withdrawal_status
FROM user_investments ui
JOIN users u ON ui.user_id = u.id
JOIN investment_packages ip ON ui.package_id = ip.id
LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id;

-- Create view for admin dashboard
CREATE VIEW admin_dashboard AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as new_users_7d,
    COUNT(DISTINCT ui.id) as total_investments,
    SUM(CASE WHEN ui.status = 'active' THEN ui.investment_amount ELSE 0 END) as active_investments_total,
    COUNT(DISTINCT CASE WHEN wr.status = 'pending' THEN wr.id END) as pending_withdrawals,
    COUNT(DISTINCT CASE WHEN fp.status = 'pending' THEN fp.id END) as pending_fee_payments,
    SUM(CASE WHEN pt.status = 'confirmed' THEN pt.amount ELSE 0 END) as total_received_payments
FROM users u
LEFT JOIN user_investments ui ON u.id = ui.user_id
LEFT JOIN withdrawal_requests wr ON ui.id = wr.investment_id
LEFT JOIN fee_payments fp ON ui.id = fp.investment_id
LEFT JOIN payment_transactions pt ON u.id = pt.user_id;

-- Stored procedure to process fee payment
DELIMITER $$
CREATE PROCEDURE process_fee_payment(
    IN p_user_id INT,
    IN p_investment_id INT,
    IN p_transaction_hash VARCHAR(255),
    IN p_from_address VARCHAR(255),
    IN p_payment_method ENUM('TRC20', 'BEP20')
)
BEGIN
    DECLARE v_company_wallet_id INT;
    DECLARE v_token_contract VARCHAR(255);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Get company wallet ID and token contract
    SELECT id, token_contract INTO v_company_wallet_id, v_token_contract
    FROM company_wallets 
    WHERE chain = p_payment_method 
    AND is_active = TRUE 
    LIMIT 1;
    
    -- Insert fee payment record
    INSERT INTO fee_payments 
        (user_id, investment_id, amount, payment_method, company_wallet_id, 
         token_contract, user_transaction_hash, from_address, status)
    VALUES 
        (p_user_id, p_investment_id, 500.00, p_payment_method, v_company_wallet_id,
         v_token_contract, p_transaction_hash, p_from_address, 'pending');
    
    -- Update investment record
    UPDATE user_investments 
    SET fee_paid = FALSE,
        fee_payment_id = LAST_INSERT_ID()
    WHERE id = p_investment_id 
    AND user_id = p_user_id;
    
    COMMIT;
END$$
DELIMITER ;

-- Stored procedure to confirm payment (called by verification service)
DELIMITER $$
CREATE PROCEDURE confirm_payment(
    IN p_transaction_hash VARCHAR(255),
    IN p_confirmations INT,
    IN p_chain ENUM('TRC20', 'BEP20')
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update payment transaction if exists
    UPDATE payment_transactions
    SET status = 'confirmed',
        confirmation_date = NOW(),
        confirmations = p_confirmations
    WHERE user_transaction_hash = p_transaction_hash
    AND payment_method = p_chain;
    
    -- Update fee payment if exists
    UPDATE fee_payments
    SET status = 'confirmed',
        confirmation_date = NOW(),
        confirmations = p_confirmations
    WHERE user_transaction_hash = p_transaction_hash
    AND payment_method = p_chain;
    
    -- Update investment payment schedule if this is an investment payment
    UPDATE payment_schedule ps
    JOIN payment_transactions pt ON ps.investment_id = pt.investment_id
    SET ps.paid_amount = ps.paid_amount + pt.amount,
        ps.remaining_amount = ps.remaining_amount - pt.amount,
        ps.last_payment_date = NOW(),
        ps.status = CASE 
            WHEN (ps.paid_amount + pt.amount) >= ps.total_required THEN 'completed'
            ELSE 'partial'
        END
    WHERE pt.user_transaction_hash = p_transaction_hash
    AND pt.payment_type = 'investment';
    
    -- If investment is fully paid, activate it
    UPDATE user_investments ui
    JOIN payment_schedule ps ON ui.id = ps.investment_id
    SET ui.status = 'active',
        ui.yield_start_date = NOW(),
        ui.maturity_date = DATE_ADD(NOW(), INTERVAL 30 DAY)
    WHERE ps.status = 'completed'
    AND ui.status = 'pending_payment';
    
    COMMIT;
END$$
DELIMITER ;

-- Stored procedure to approve withdrawal
DELIMITER $$
CREATE PROCEDURE approve_withdrawal(
    IN p_request_id INT,
    IN p_admin_id INT,
    IN p_company_tx_hash VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update withdrawal request
    UPDATE withdrawal_requests
    SET status = 'approved',
        approved_at = NOW(),
        approved_by = p_admin_id,
        company_transaction_hash = p_company_tx_hash
    WHERE id = p_request_id;
    
    -- Update investment
    UPDATE user_investments ui
    JOIN withdrawal_requests wr ON ui.id = wr.investment_id
    SET ui.status = 'withdrawn'
    WHERE wr.id = p_request_id;
    
    COMMIT;
END$$
DELIMITER ;

-- Create backup table for audit
CREATE TABLE audit_log LIKE payment_transactions;
ALTER TABLE audit_log ADD COLUMN audit_action VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Trigger to audit payment confirmations
DELIMITER $$
CREATE TRIGGER after_payment_confirmation
AFTER UPDATE ON payment_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        INSERT INTO audit_log SELECT *, 'CONFIRMED', NOW() FROM payment_transactions WHERE id = NEW.id;
    END IF;
END$$
DELIMITER ;

-- Trigger to audit fee confirmations
DELIMITER $$
CREATE TRIGGER after_fee_confirmation
AFTER UPDATE ON fee_payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        INSERT INTO audit_log (id, user_id, amount, payment_type, payment_method, 
                               user_transaction_hash, status, confirmations, 
                               payment_date, confirmation_date, audit_action, audit_timestamp)
        SELECT NEW.id, NEW.user_id, NEW.amount, 'withdrawal_fee', NEW.payment_method,
               NEW.user_transaction_hash, NEW.status, NEW.confirmations,
               NEW.payment_date, NEW.confirmation_date, 'FEE_CONFIRMED', NOW();
    END IF;
END$$
DELIMITER ;

-- Create test user (for lab environment only)
-- Password: Test@123 (hash would be generated by application)
INSERT INTO users (username, email, password_hash, email_verified) VALUES
('testuser', 'test@primestone.com', '$2a$10$YourTestHashHere', TRUE);

-- Seed historical prices for Swiggy (comp_1)
INSERT INTO company_historical_prices (company_id, price_date, price_value) VALUES
('comp_1', '2023-01-01', 350),
('comp_1', '2023-03-15', 380),
('comp_1', '2023-06-01', 420),
('comp_1', '2023-09-10', 410),
('comp_1', '2023-12-01', 450),
('comp_1', '2024-02-20', 480),
('comp_1', '2024-05-15', 520);

-- Seed historical prices for Groww (comp_2)
INSERT INTO company_historical_prices (company_id, price_date, price_value) VALUES
('comp_2', '2023-02-01', 1100),
('comp_2', '2023-05-10', 1150),
('comp_2', '2023-08-15', 1250),
('comp_2', '2023-11-01', 1200),
('comp_2', '2024-01-20', 1300),
('comp_2', '2024-04-01', 1450);

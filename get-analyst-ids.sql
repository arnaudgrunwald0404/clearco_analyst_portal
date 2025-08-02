-- Get actual analyst IDs from the database
-- Run this first to see what analyst IDs are available

SELECT 
  id,
  "firstName",
  "lastName",
  company
FROM analysts 
LIMIT 10; 
export const CarsQueries = {
  // Find all cars with user info
  findAll: `
        SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
        FROM cars c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE 1=1
    `,

  // Count query
  count: `
        SELECT COUNT(*) as total 
        FROM cars c
        WHERE 1=1
    `,

  // Find by ID
  findById: `
        SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
        FROM cars c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
    `,

  // Find by user ID
  findByUserId: `
        SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
        FROM cars c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
    `,

  // Find by license plate
  findByLicensePlate: `
        SELECT * FROM cars 
        WHERE license_plate = $1
    `,

  // Create car
  create: `
        INSERT INTO cars (id, user_id, brand, model, year, color, license_plate)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `,

  // Update car (base query, will be built dynamically)
  updateBase: `
        UPDATE cars SET updated_at = CURRENT_TIMESTAMP
    `,

  // Delete car
  delete: `
        DELETE FROM cars 
        WHERE id = $1
    `,

  // Delete by user ID
  deleteByUserId: `
        DELETE FROM cars 
        WHERE user_id = $1
    `,

  // Get statistics by user
  getStatsByUser: `
        SELECT 
        COUNT(*) as total_cars,
        COUNT(CASE WHEN is_available = true THEN 1 END) as available_cars,
        COUNT(DISTINCT brand) as unique_brands,
        MIN(year) as oldest_car_year,
        MAX(year) as newest_car_year
        FROM cars
        WHERE user_id = $1
    `,

  // Search with user details
  search: `
        SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
        FROM cars c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE 
        c.brand ILIKE $1 OR 
        c.model ILIKE $1 OR 
        c.color ILIKE $1 OR
        c.license_plate ILIKE $1 OR
        u.name ILIKE $1
        ORDER BY c.created_at DESC
    `,

  // Bulk insert
  bulkInsert: `
        INSERT INTO cars (id, user_id, brand, model, year, color, license_plate)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `,

  // Transfer car ownership
  transferOwnership: `
        UPDATE cars 
        SET user_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING *
    `,

  // Verify car ownership
  verifyOwnership: `
        SELECT id FROM cars
        WHERE id = $1 AND user_id = $2
    `,

  // Count cars by user
  countByUser: `
        SELECT COUNT(*) as count FROM cars
        WHERE user_id = $1
    `,
};

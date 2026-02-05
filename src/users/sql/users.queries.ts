export const UsersQueries = {
    // Find all users with filters
    findAll: `
        SELECT * FROM users 
        WHERE 1=1
    `,

    // Count query
    count: `
        SELECT COUNT(*) as total FROM users
        WHERE 1=1
    `,

    // Find by ID
    findById: `
        SELECT * FROM users 
        WHERE id = $1
    `,

    // Find by email
    findByEmail: `
        SELECT * FROM users 
        WHERE email = $1
    `,

    // Create user
    create: `
        INSERT INTO users (id, email, name, age)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `,

    // Update user (base query, will be built dynamically)
    updateBase: `
        UPDATE users SET updated_at = CURRENT_TIMESTAMP
    `,

    // Delete user
    delete: `
        DELETE FROM users 
        WHERE id = $1
    `,

    // Check if email exists for another user
    emailExistsForOtherUser: `
        SELECT id FROM users 
        WHERE email = $1 AND id != $2
    `,

    // Find users with car count
    findWithCarCount: `
        SELECT 
        u.*,
        COUNT(c.id) as car_count
        FROM users u
        LEFT JOIN cars c ON u.id = c.user_id
        GROUP BY u.id
    `,

    // Find user with all cars
    findByIdWithCars: `
        SELECT 
        u.id as user_id,
        u.email,
        u.name,
        u.age,
        u.is_active,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,
        json_agg(
            json_build_object(
                'id', c.id,
                'brand', c.brand,
                'model', c.model,
                'year', c.year,
                'color', c.color,
                'license_plate', c.license_plate,
                'is_available', c.is_available,
                'created_at', c.created_at,
                'updated_at', c.updated_at
            ) ORDER BY c.created_at DESC
        ) FILTER (WHERE c.id IS NOT NULL) as cars
        FROM users u
        LEFT JOIN cars c ON u.id = c.user_id
        WHERE u.id = $1
        GROUP BY u.id
    `,
};
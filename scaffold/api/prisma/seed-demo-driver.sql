-- ============================================
-- DEMO DRIVER SEED
-- Run this SQL to create a demo driver
-- ============================================

-- First, get a valid store ID
DO $$
DECLARE
    v_store_id UUID;
BEGIN
    -- Get the first active store
    SELECT id INTO v_store_id FROM stores WHERE "isActive" = true LIMIT 1;
    
    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'No active store found. Please create a store first.';
    END IF;

    -- Check if demo driver already exists
    IF EXISTS (SELECT 1 FROM drivers WHERE phone = '(555) 0100' AND "storeId" = v_store_id) THEN
        RAISE NOTICE 'Demo driver already exists for this store';
        
        -- Update the existing driver to ensure it's active
        UPDATE drivers 
        SET 
            "isActive" = true,
            status = 'ONLINE',
            pin = '$2b$10$gtOhk7s1TivGpok/zBUxeOyGSO.l9GHEnI3n2vUfwD8.7zPCiPdRS',
            "perDeliveryRate" = 5.00
        WHERE phone = '(555) 0100' AND "storeId" = v_store_id;
        
        RAISE NOTICE 'Demo driver updated successfully!';
    ELSE
        -- Insert demo driver
        INSERT INTO drivers (
            id,
            "storeId",
            name,
            phone,
            email,
            "vehicleType",
            "licensePlate",
            pin,
            status,
            "isContractor",
            "perDeliveryRate",
            "isActive",
            "createdAt",
            "currentLocation"
        ) VALUES (
            'demo-driver-001',
            v_store_id,
            'Demo Driver',
            '(555) 0100',
            'demo@freshpizza.com',
            'Car',
            'DEMO-01',
            '$2b$10$gtOhk7s1TivGpok/zBUxeOyGSO.l9GHEnI3n2vUfwD8.7zPCiPdRS',
            'ONLINE',
            true,
            5.00,
            true,
            NOW(),
            '{"lat": 39.2037, "lng": -76.8610, "timestamp": "' || NOW()::text || '"}'::jsonb
        );
        
        RAISE NOTICE 'Demo driver created successfully!';
    END IF;
    
    -- Display the driver info
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEMO DRIVER CREDENTIALS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Driver ID: demo-driver-001';
    RAISE NOTICE 'Name: Demo Driver';
    RAISE NOTICE 'PIN: 1234';
    RAISE NOTICE 'Phone: (555) 0100';
    RAISE NOTICE 'Store ID: %', v_store_id;
    RAISE NOTICE '========================================';
    
END $$;

-- Verify the driver was created
SELECT 
    id,
    name,
    phone,
    email,
    "vehicleType",
    "licensePlate",
    status,
    "isActive",
    "perDeliveryRate",
    "storeId",
    "createdAt"
FROM drivers 
WHERE id = 'demo-driver-001';

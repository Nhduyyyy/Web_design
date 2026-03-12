-- Add missing seat types to the seat_type enum
-- This migration adds couple, wheelchair, aisle, and stage seat types

-- First, let's check if the seat_type enum exists and create it if it doesn't
DO $$ 
BEGIN
    -- Create seat_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_type') THEN
        CREATE TYPE seat_type AS ENUM ('standard', 'vip', 'balcony', 'box');
    END IF;
END $$;

-- Add new seat types to the existing enum
ALTER TYPE seat_type ADD VALUE IF NOT EXISTS 'couple';
ALTER TYPE seat_type ADD VALUE IF NOT EXISTS 'wheelchair';
ALTER TYPE seat_type ADD VALUE IF NOT EXISTS 'aisle';
ALTER TYPE seat_type ADD VALUE IF NOT EXISTS 'stage';

-- Update any existing seats that might have been mapped incorrectly
-- This is optional and can be commented out if not needed
-- UPDATE public.seats SET seat_type = 'couple' WHERE seat_type = 'vip' AND seat_label LIKE '%couple%';
-- UPDATE public.seats SET seat_type = 'wheelchair' WHERE is_wheelchair_accessible = true;
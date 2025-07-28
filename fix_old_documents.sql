-- Fix old documents that don't have proper file_path
-- Execute this SQL in your Supabase SQL Editor

-- Check current state of documents
SELECT id, title, file_path, type, created_at 
FROM public.documents 
WHERE file_path IS NULL OR file_path = '' 
ORDER BY created_at DESC;

-- Update old documents with placeholder file paths
-- This will make them show up in the list, even if preview doesn't work
UPDATE public.documents 
SET 
    file_path = CASE 
        WHEN file_path IS NULL OR file_path = '' 
        THEN '/placeholder/' || title 
        ELSE file_path 
    END,
    type = CASE 
        WHEN type IS NULL OR type = '' 
        THEN 'application/pdf' 
        ELSE type 
    END,
    category = CASE 
        WHEN category IS NULL OR category = '' 
        THEN 'Overkomst' 
        ELSE category 
    END,
    updated_at = NOW()
WHERE file_path IS NULL OR file_path = '';

-- Check results
SELECT id, title, file_path, type, category, created_at 
FROM public.documents 
ORDER BY created_at DESC 
LIMIT 10;

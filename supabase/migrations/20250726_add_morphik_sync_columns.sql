-- Add Morphik sync tracking columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS morphik_id TEXT,
ADD COLUMN IF NOT EXISTS morphik_sync_status TEXT CHECK (morphik_sync_status IN ('pending', 'syncing', 'synced', 'failed')),
ADD COLUMN IF NOT EXISTS morphik_sync_error TEXT,
ADD COLUMN IF NOT EXISTS morphik_synced_at TIMESTAMP WITH TIME ZONE;

-- Create index for morphik_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_morphik_id ON documents(morphik_id) WHERE morphik_id IS NOT NULL;

-- Create index for sync status to easily find documents that need syncing
CREATE INDEX IF NOT EXISTS idx_documents_morphik_sync_status ON documents(morphik_sync_status) WHERE morphik_sync_status IS NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN documents.morphik_id IS 'Document ID in Morphik AI system';
COMMENT ON COLUMN documents.morphik_sync_status IS 'Current sync status with Morphik';
COMMENT ON COLUMN documents.morphik_sync_error IS 'Error message if sync failed';
COMMENT ON COLUMN documents.morphik_synced_at IS 'Timestamp of last successful sync';

-- Create a function to automatically set morphik_sync_status to 'pending' for new documents
CREATE OR REPLACE FUNCTION set_morphik_sync_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set to pending if Morphik sync is enabled (check via app config)
  -- This is a placeholder - actual logic would check app configuration
  IF NEW.morphik_sync_status IS NULL THEN
    NEW.morphik_sync_status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new documents
DROP TRIGGER IF EXISTS set_morphik_sync_pending_trigger ON documents;
CREATE TRIGGER set_morphik_sync_pending_trigger
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION set_morphik_sync_pending();
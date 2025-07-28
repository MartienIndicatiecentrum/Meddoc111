-- Fix for trigger conflict: update_clients_updated_at already exists
-- This script will safely handle the trigger conflict

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;

-- Create or replace the function (this is safe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Now create the trigger (this will work now)
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Also fix the other triggers that might have the same issue
DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON public.client_emergency_contacts;
CREATE TRIGGER update_emergency_contacts_updated_at 
    BEFORE UPDATE ON public.client_emergency_contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_info_updated_at ON public.client_medical_info;
CREATE TRIGGER update_medical_info_updated_at 
    BEFORE UPDATE ON public.client_medical_info 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_taken_updated_at ON public.taken;
CREATE TRIGGER update_taken_updated_at 
    BEFORE UPDATE ON public.taken 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_logboek_updated_at ON public.logboek;
CREATE TRIGGER update_logboek_updated_at 
    BEFORE UPDATE ON public.logboek 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Trigger conflict resolved successfully!' as status; 
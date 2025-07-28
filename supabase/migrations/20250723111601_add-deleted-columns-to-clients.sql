-- Migration: add deleted_at (timestamp) en verwijderd (boolean) aan clients
ALTER TABLE clients
ADD COLUMN deleted_at timestamp NULL,
ADD COLUMN verwijderd boolean NOT NULL DEFAULT false;

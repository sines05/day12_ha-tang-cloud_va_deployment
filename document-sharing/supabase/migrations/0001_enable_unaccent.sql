-- This migration enables the 'unaccent' extension, which is required for
-- accent-insensitive searches used in various functions like 'search_documents_json'
-- and 'get_reviews_by_lecturer'.
-- The 'IF NOT EXISTS' clause ensures that this command can be run multiple
-- times without causing an error.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

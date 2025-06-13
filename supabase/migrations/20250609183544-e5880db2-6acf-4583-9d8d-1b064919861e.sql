
-- Add a column to store extracted text content from PDFs
ALTER TABLE public.documents 
ADD COLUMN extracted_content TEXT;

-- Add a column to store AI analysis of the document
ALTER TABLE public.documents 
ADD COLUMN ai_analysis JSONB;

-- Add an index on extracted_content for better search performance
CREATE INDEX IF NOT EXISTS idx_documents_extracted_content 
ON public.documents USING gin(to_tsvector('english', extracted_content));

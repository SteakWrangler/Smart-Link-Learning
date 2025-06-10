-- Add processing status and error tracking to documents table
ALTER TABLE public.documents 
ADD COLUMN processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE public.documents 
ADD COLUMN processing_error TEXT;

-- Add index for processing status
CREATE INDEX IF NOT EXISTS idx_documents_processing_status 
ON public.documents (processing_status);

-- Update existing documents to have 'completed' status if they have extracted content
UPDATE public.documents 
SET processing_status = 'completed' 
WHERE extracted_content IS NOT NULL AND extracted_content != '';

-- Update existing documents to have 'failed' status if they are PDFs without content
UPDATE public.documents 
SET processing_status = 'failed', 
    processing_error = 'Document processing failed - no extractable content found' 
WHERE file_type = 'application/pdf' 
  AND (extracted_content IS NULL OR extracted_content = '') 
  AND processing_status = 'pending'; 
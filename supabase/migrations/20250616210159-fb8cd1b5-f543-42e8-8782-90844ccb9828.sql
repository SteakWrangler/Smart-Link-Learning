
-- Check if policies exist and create only the missing ones
DO $$
BEGIN
    -- Create policy to allow authenticated users to upload files (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload documents'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' 
          AND auth.role() = 'authenticated'
        );
    END IF;

    -- Create policy to allow users to view documents (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to view documents'
    ) THEN
        CREATE POLICY "Allow users to view documents" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documents'
        );
    END IF;

    -- Create policy to allow users to delete their own documents (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to delete their own documents'
    ) THEN
        CREATE POLICY "Allow users to delete their own documents" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Create policy to allow users to update their own documents (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to update their own documents'
    ) THEN
        CREATE POLICY "Allow users to update their own documents" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

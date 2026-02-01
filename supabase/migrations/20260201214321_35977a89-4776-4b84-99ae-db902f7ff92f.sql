-- Add UPDATE policy for analysis_results table
CREATE POLICY "Users can update their own analysis results" 
ON public.analysis_results 
FOR UPDATE 
USING (user_id = auth.uid());

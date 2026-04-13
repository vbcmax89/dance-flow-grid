
-- Create eventi table
CREATE TABLE public.eventi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.eventi ENABLE ROW LEVEL SECURITY;

-- RLS policies for eventi
CREATE POLICY "Anyone can read events" ON public.eventi FOR SELECT USING (true);
CREATE POLICY "Anyone can insert events" ON public.eventi FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.eventi FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events" ON public.eventi FOR DELETE USING (true);

-- Add evento_id to stages (nullable for backward compat)
ALTER TABLE public.stages ADD COLUMN evento_id UUID REFERENCES public.eventi(id) ON DELETE SET NULL;

-- Trigger for updated_at on eventi
CREATE TRIGGER update_eventi_updated_at
BEFORE UPDATE ON public.eventi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('event-assets', 'event-assets', true);

-- Storage policies
CREATE POLICY "Anyone can view event assets" ON storage.objects FOR SELECT USING (bucket_id = 'event-assets');
CREATE POLICY "Anyone can upload event assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-assets');
CREATE POLICY "Anyone can update event assets" ON storage.objects FOR UPDATE USING (bucket_id = 'event-assets');
CREATE POLICY "Anyone can delete event assets" ON storage.objects FOR DELETE USING (bucket_id = 'event-assets');

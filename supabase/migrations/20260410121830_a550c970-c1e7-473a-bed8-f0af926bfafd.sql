
-- Create rooms table
CREATE TABLE public.sale (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create levels table
CREATE TABLE public.livelli (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create days table
CREATE TABLE public.giorni (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stages table
CREATE TABLE public.stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id UUID NOT NULL REFERENCES public.sale(id) ON DELETE CASCADE,
  giorno_id UUID NOT NULL REFERENCES public.giorni(id) ON DELETE CASCADE,
  livello_id UUID REFERENCES public.livelli(id) ON DELETE SET NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.sale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livelli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giorni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Anyone can read rooms" ON public.sale FOR SELECT USING (true);
CREATE POLICY "Anyone can read levels" ON public.livelli FOR SELECT USING (true);
CREATE POLICY "Anyone can read days" ON public.giorni FOR SELECT USING (true);
CREATE POLICY "Anyone can read stages" ON public.stages FOR SELECT USING (true);

-- Full write access (admin protection at app level)
CREATE POLICY "Anyone can insert rooms" ON public.sale FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.sale FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete rooms" ON public.sale FOR DELETE USING (true);

CREATE POLICY "Anyone can insert levels" ON public.livelli FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update levels" ON public.livelli FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete levels" ON public.livelli FOR DELETE USING (true);

CREATE POLICY "Anyone can insert days" ON public.giorni FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update days" ON public.giorni FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete days" ON public.giorni FOR DELETE USING (true);

CREATE POLICY "Anyone can insert stages" ON public.stages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stages" ON public.stages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete stages" ON public.stages FOR DELETE USING (true);

-- Timestamp trigger for stages
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stages_updated_at
  BEFORE UPDATE ON public.stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

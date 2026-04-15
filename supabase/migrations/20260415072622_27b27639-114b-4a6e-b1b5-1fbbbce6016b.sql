
ALTER TABLE public.sale ADD COLUMN evento_id uuid REFERENCES public.eventi(id) ON DELETE CASCADE;
ALTER TABLE public.livelli ADD COLUMN evento_id uuid REFERENCES public.eventi(id) ON DELETE CASCADE;
ALTER TABLE public.giorni ADD COLUMN evento_id uuid REFERENCES public.eventi(id) ON DELETE CASCADE;

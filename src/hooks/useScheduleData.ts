import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEventi() {
  return useQuery({
    queryKey: ["eventi"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eventi").select("*").order("start_date");
      if (error) throw error;
      return data;
    },
  });
}

export function useEvento(id: string | undefined) {
  return useQuery({
    queryKey: ["eventi", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("eventi").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSale(eventoId?: string) {
  return useQuery({
    queryKey: ["sale", eventoId],
    queryFn: async () => {
      let query = supabase.from("sale").select("*").order("display_order");
      if (eventoId) query = query.eq("evento_id", eventoId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useLivelli(eventoId?: string) {
  return useQuery({
    queryKey: ["livelli", eventoId],
    queryFn: async () => {
      let query = supabase.from("livelli").select("*").order("display_order");
      if (eventoId) query = query.eq("evento_id", eventoId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useGiorni(eventoId?: string) {
  return useQuery({
    queryKey: ["giorni", eventoId],
    queryFn: async () => {
      let query = supabase.from("giorni").select("*").order("display_order");
      if (eventoId) query = query.eq("evento_id", eventoId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useStages(eventoId?: string) {
  return useQuery({
    queryKey: ["stages", eventoId],
    queryFn: async () => {
      let query = supabase
        .from("stages")
        .select("*, sale(*), giorni(*), livelli(*)")
        .order("start_time");
      if (eventoId) query = query.eq("evento_id", eventoId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

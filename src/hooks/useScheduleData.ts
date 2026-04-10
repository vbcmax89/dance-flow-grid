import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSale() {
  return useQuery({
    queryKey: ["sale"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sale").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useLivelli() {
  return useQuery({
    queryKey: ["livelli"],
    queryFn: async () => {
      const { data, error } = await supabase.from("livelli").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useGiorni() {
  return useQuery({
    queryKey: ["giorni"],
    queryFn: async () => {
      const { data, error } = await supabase.from("giorni").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useStages() {
  return useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*, sale(*), giorni(*), livelli(*)")
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });
}

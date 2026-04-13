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

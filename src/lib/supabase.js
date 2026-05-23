import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? "https://urolqcerirouztkpelld.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyb2xxY2VyaXJvdXp0a3BlbGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTgyNzUsImV4cCI6MjA5MzY5NDI3NX0.xracjkBKOZ5yKyhBzk1hqkTfv7QRLHtvKTytNcoHVdo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

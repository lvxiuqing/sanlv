import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = 'https://etzwrlqkufgqzjpnyjcq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0endybHFrdWZncXpqcG55amNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzEyNDAsImV4cCI6MjA3NTI0NzI0MH0.ux4utt8Z9yNC7K6WHrR9qElmuPiWSk27uxYEm5d1lsg'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseKey)


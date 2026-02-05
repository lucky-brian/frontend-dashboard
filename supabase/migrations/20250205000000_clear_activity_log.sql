-- ล้างข้อมูลใน activity_log เท่านั้น (ใช้เมื่อจะเริ่มใช้ระบบใหม่)
-- วิธีรัน: เปิด Supabase Dashboard → SQL Editor → paste ด้านล่าง → Run
-- หรือ: npx supabase db execute --file supabase/migrations/20250205000000_clear_activity_log.sql

TRUNCATE TABLE activity_log;

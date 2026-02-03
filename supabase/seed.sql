-- ข้อมูลเริ่มต้นให้ตรงกับ lib/constants.ts
-- รันหลัง migrations (ใน Supabase SQL Editor หรือ supabase db reset)

-- สมาชิกทีม
INSERT INTO frontend_member (name) VALUES
  ('Phurin'),
  ('Supphawit'),
  ('Phitipong'),
  ('Montra')
ON CONFLICT (name) DO NOTHING;

-- หัวข้อ convention
INSERT INTO topic_convention_option (title, type, sort_order) VALUES
  ('Commit Message', 'convention', 1),
  ('Branch Naming', 'convention', 2),
  ('Dev Testing', 'convention', 3),
  ('Delivery', 'delivery', 4)
ON CONFLICT (title) DO NOTHING;

-- convention_rules
INSERT INTO convention_rules (topic_id, rule_text, sort_order)
SELECT t.id, v.rule_text, v.ord
FROM (VALUES
  ('Commit Message', 'ระบุ type ของ commit ไม่ถูกต้อง', 1),
  ('Commit Message', 'ไม่ระบุ type หรือ message ของ commit', 2),
  ('Branch Naming', 'ตั้งชื่อ branch ไม่ตรงตาม standard', 1),
  ('Branch Naming', 'เปิด Merge Request ที่มีเนื้อหาจาก Task อื่น (ถ้าเล็กน้อยอนุโรมตามดุลพินิจ)', 2),
  ('Dev Testing', 'ส่ง parent การ์ดให้ review โดยที่ไม่ส่งหลักฐานประกอบการทดสอบ', 1),
  ('Delivery', 'ปิด Task ภายใน sprint ไม่ได้', 1),
  ('Delivery', 'ปิด merge request ภายในวันไม่ได้', 2)
) AS v(topic_title, rule_text, ord)
JOIN topic_convention_option t ON t.title = v.topic_title
ON CONFLICT (topic_id, rule_text) DO NOTHING;

-- action_rules (ตัวเลือกที่ user เลือกตอน log)
INSERT INTO action_rules (topic_id, label, value, sort_order)
SELECT t.id, v.label, v.value, v.ord
FROM (VALUES
  ('Commit Message', 'ระบุ type ของ commit ไม่ถูกต้อง', 'ระบุ type ของ commit ไม่ถูกต้อง', 1),
  ('Commit Message', 'ไม่ระบุ type หรือ message ของ commit', 'ไม่ระบุ type หรือ message ของ commit', 2),
  ('Branch Naming', 'ตั้งชื่อ branch ไม่ตรงตาม standard', 'ตั้งชื่อ branch ไม่ตรงตาม standard', 1),
  ('Branch Naming', 'เปิด Merge Request ที่มีเนื้อหาจาก Task อื่น (ถ้าเล็กน้อยอนุโรมตามดุลพินิจ)', 'เปิด Merge Request ที่มีเนื้อหาจาก Task อื่น (ถ้าเล็กน้อยอนุโรมตามดุลพินิจ)', 2),
  ('Dev Testing', 'ส่ง parent การ์ดให้ review โดยที่ไม่ส่งหลักฐานประกอบการทดสอบ', 'ส่ง parent การ์ดให้ review โดยที่ไม่ส่งหลักฐานประกอบการทดสอบ', 1),
  ('Delivery', 'ปิด Task ภายใน sprint ไม่ได้', 'ปิด Task ภายใน sprint ไม่ได้', 1),
  ('Delivery', 'ปิด merge request ภายในวันไม่ได้', 'ปิด merge request ภายในวันไม่ได้', 2)
) AS v(topic_title, label, value, ord)
JOIN topic_convention_option t ON t.title = v.topic_title
ON CONFLICT (topic_id, value) DO NOTHING;

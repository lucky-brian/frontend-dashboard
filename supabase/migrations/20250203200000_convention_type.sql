-- ============================================================
-- ตาราง convention_type สำหรับเก็บประเภทหัวข้อ (convention, delivery, ...)
-- สามารถเพิ่ม type ใหม่ได้จาก Setting Convention
-- ============================================================

CREATE TABLE convention_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_convention_type_sort_order ON convention_type(sort_order);
COMMENT ON TABLE convention_type IS 'ประเภทหัวข้อ convention (convention, delivery, ...) สามารถเพิ่ม type ใหม่ได้จาก Setting';

-- Seed ค่าเริ่มต้น (ใช้ UUID คงที่เพื่ออ้างอิงใน migration)
INSERT INTO convention_type (id, value, label, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'convention', 'Convention', 0),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'delivery', 'Delivery', 1);

-- เปลี่ยน topic_convention_option จาก type TEXT เป็น type_id UUID
ALTER TABLE topic_convention_option ADD COLUMN type_id UUID REFERENCES convention_type(id);
UPDATE topic_convention_option SET type_id = (SELECT id FROM convention_type WHERE value = topic_convention_option.type);
ALTER TABLE topic_convention_option ALTER COLUMN type_id SET NOT NULL;
DROP INDEX IF EXISTS idx_topic_convention_option_type;
ALTER TABLE topic_convention_option DROP CONSTRAINT IF EXISTS topic_convention_option_type_check;
ALTER TABLE topic_convention_option DROP COLUMN type;
CREATE INDEX idx_topic_convention_option_type_id ON topic_convention_option(type_id);

-- ยกเลิก CHECK บน convention_logs.type เพื่อให้ใส่ type ใหม่ที่เพิ่มจาก convention_type ได้
ALTER TABLE convention_logs DROP CONSTRAINT IF EXISTS convention_logs_type_check;

-- Trigger อัปเดต updated_at
CREATE TRIGGER tr_convention_type_updated_at
  BEFORE UPDATE ON convention_type
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

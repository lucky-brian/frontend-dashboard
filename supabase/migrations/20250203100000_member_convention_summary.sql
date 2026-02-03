-- ============================================================
-- ตารางสรุปจำนวนครั้งที่ผิดกฎ Convention ต่อสมาชิก
-- อัปเดตด้วย trigger เมื่อมี INSERT ใน convention_logs
-- ใช้สำหรับแสดง Summary โดยไม่ต้อง query convention_logs โดยตรง
-- ============================================================

CREATE TABLE member_convention_summary (
  member_id UUID PRIMARY KEY REFERENCES frontend_member(id) ON DELETE CASCADE,
  violation_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_convention_summary_violation_count ON member_convention_summary(violation_count DESC);
COMMENT ON TABLE member_convention_summary IS 'สรุปจำนวนครั้งที่ผิดกฎ Convention ต่อสมาชิก (อัปเดตด้วย trigger)';

-- Backfill จาก convention_logs ที่มีอยู่แล้ว
INSERT INTO member_convention_summary (member_id, violation_count, updated_at)
SELECT member_id, COUNT(*)::INT, COALESCE(MAX(created_at), now())
FROM convention_logs
GROUP BY member_id
ON CONFLICT (member_id) DO UPDATE SET
  violation_count = EXCLUDED.violation_count,
  updated_at = EXCLUDED.updated_at;

-- Trigger: เมื่อมีการ INSERT convention_logs ให้เพิ่ม violation_count ของ member นั้น
CREATE OR REPLACE FUNCTION increment_member_convention_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO member_convention_summary (member_id, violation_count, updated_at)
  VALUES (NEW.member_id, 1, now())
  ON CONFLICT (member_id) DO UPDATE SET
    violation_count = member_convention_summary.violation_count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_convention_logs_after_insert
  AFTER INSERT ON convention_logs
  FOR EACH ROW EXECUTE FUNCTION increment_member_convention_summary();

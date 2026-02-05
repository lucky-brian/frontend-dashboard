-- เก็บชื่อผู้สร้าง convention log (คนที่ login)
ALTER TABLE convention_logs
  ADD COLUMN IF NOT EXISTS created_by TEXT;

COMMENT ON COLUMN convention_logs.created_by IS 'ชื่อผู้บันทึก log (จากผู้ที่ login)';

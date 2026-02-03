-- เมื่อลบ convention_logs ให้ลด violation_count ใน member_convention_summary

CREATE OR REPLACE FUNCTION decrement_member_convention_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE member_convention_summary
  SET violation_count = GREATEST(0, violation_count - 1),
      updated_at = now()
  WHERE member_id = OLD.member_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_convention_logs_after_delete
  AFTER DELETE ON convention_logs
  FOR EACH ROW EXECUTE FUNCTION decrement_member_convention_summary();

-- ============================================================
-- Initial schema: frontend_member, topic_convention_option,
-- convention_rules, action_rules, convention_logs
-- รองรับการเพิ่ม convention ในอนาคต
-- ============================================================

-- 1. สมาชิกทีม Frontend
CREATE TABLE frontend_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE frontend_member IS 'สมาชิกทีมที่ถูกบันทึก convention log';

-- 2. หัวข้อ Convention (Commit Message, Branch Naming, Delivery, ...)
-- type = 'convention' | 'delivery' เพื่อแยกกลุ่ม
CREATE TABLE topic_convention_option (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('convention', 'delivery')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_topic_convention_option_type ON topic_convention_option(type);
COMMENT ON TABLE topic_convention_option IS 'หัวข้อ convention แต่ละประเภท รองรับการเพิ่มหัวข้อใหม่ในอนาคต';

-- 3. กฎภายใต้แต่ละหัวข้อ (สำหรับแสดงใน Convention Rules)
CREATE TABLE convention_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topic_convention_option(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_convention_rules_topic_id ON convention_rules(topic_id);
CREATE UNIQUE INDEX idx_convention_rules_topic_rule ON convention_rules(topic_id, rule_text);
COMMENT ON TABLE convention_rules IS 'ข้อความกฎแต่ละข้อภายใต้ topic นำไปแสดงใน Convention Rules';

-- 4. ตัวเลือก Action ที่ user เลือกเวลา log (ทำผิดข้อไหน)
CREATE TABLE action_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topic_convention_option(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_rules_topic_id ON action_rules(topic_id);
CREATE UNIQUE INDEX idx_action_rules_topic_value ON action_rules(topic_id, value);
COMMENT ON TABLE action_rules IS 'ตัวเลือกข้อผิดที่เลือกได้ตอนบันทึก log ผูกกับ topic';

-- 5. บันทึก Convention Log แต่ละครั้ง
CREATE TABLE convention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL,
  member_id UUID NOT NULL REFERENCES frontend_member(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('convention', 'delivery')),
  topic_id UUID NOT NULL REFERENCES topic_convention_option(id) ON DELETE RESTRICT,
  action_rule_id UUID NOT NULL REFERENCES action_rules(id) ON DELETE RESTRICT,
  sprint TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_convention_logs_log_date ON convention_logs(log_date);
CREATE INDEX idx_convention_logs_member_id ON convention_logs(member_id);
CREATE INDEX idx_convention_logs_topic_id ON convention_logs(topic_id);
COMMENT ON TABLE convention_logs IS 'บันทึกแต่ละครั้งที่ลดคะแนน (redux point)';

-- Trigger: อัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_frontend_member_updated_at
  BEFORE UPDATE ON frontend_member
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_topic_convention_option_updated_at
  BEFORE UPDATE ON topic_convention_option
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_convention_rules_updated_at
  BEFORE UPDATE ON convention_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_action_rules_updated_at
  BEFORE UPDATE ON action_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

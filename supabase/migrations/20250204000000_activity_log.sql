-- ============================================================
-- Activity / Audit log: ใครทำอะไร เมื่อไหร่
-- ============================================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action_type ON activity_log(action_type);

COMMENT ON TABLE activity_log IS 'บันทึกการกระทำในระบบ (ใคร ทำอะไร เมื่อไหร่)';

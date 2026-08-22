CREATE INDEX IF NOT EXISTS "bilibili_history_user_view_at_id_idx" ON "bilibili_history" USING btree ("user_id","view_at" DESC NULLS LAST,"id" DESC NULLS LAST);

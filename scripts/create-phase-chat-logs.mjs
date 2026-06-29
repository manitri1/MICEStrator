import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "phase_chat_logs" (
      "id"           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "event_id"     uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
      "phase_number" integer NOT NULL,
      "messages"     jsonb NOT NULL,
      "updated_at"   timestamp DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "phase_chat_logs_event_phase_uidx"
      ON "phase_chat_logs"("event_id", "phase_number");
  `)
  console.log('phase_chat_logs 테이블 생성 완료')
} finally {
  await pool.end()
}

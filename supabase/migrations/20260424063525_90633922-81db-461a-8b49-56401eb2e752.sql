-- Expand decision_threads with richer extraction fields
ALTER TABLE public.decision_threads
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS tradeoffs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS contributors JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS revisit_trigger TEXT,
  ADD COLUMN IF NOT EXISTS revisit_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clarity_score NUMERIC,
  ADD COLUMN IF NOT EXISTS consensus_score NUMERIC,
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC,
  ADD COLUMN IF NOT EXISTS reversibility_score NUMERIC,
  ADD COLUMN IF NOT EXISTS risk_level TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS conflicts JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Q&A table
CREATE TABLE IF NOT EXISTS public.decision_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.decision_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_decision_questions_thread ON public.decision_questions(thread_id);
ALTER TABLE public.decision_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view questions on own threads"
  ON public.decision_questions FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.decision_threads t WHERE t.id = thread_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "Users insert questions on own threads"
  ON public.decision_questions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.decision_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users delete own questions"
  ON public.decision_questions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Timeline events
CREATE TABLE IF NOT EXISTS public.decision_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.decision_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  detail TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_decision_events_thread ON public.decision_events(thread_id, occurred_at);
ALTER TABLE public.decision_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view events on own threads"
  ON public.decision_events FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.decision_threads t WHERE t.id = thread_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "Users insert events on own threads"
  ON public.decision_events FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.decision_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users delete events on own threads"
  ON public.decision_events FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.decision_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );
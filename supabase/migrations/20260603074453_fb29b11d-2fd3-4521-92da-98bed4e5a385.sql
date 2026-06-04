
-- USERS
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users public read" ON public.users FOR SELECT USING (true);
CREATE POLICY "users public insert" ON public.users FOR INSERT WITH CHECK (true);

-- BATTLES
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  num_rounds INT NOT NULL DEFAULT 3 CHECK (num_rounds >= 1 AND num_rounds <= 20),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.battles TO anon, authenticated;
GRANT ALL ON public.battles TO service_role;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battles public read" ON public.battles FOR SELECT USING (true);

-- PARTICIPANTS
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position SMALLINT NOT NULL CHECK (position IN (1,2)),
  UNIQUE (battle_id, position)
);
GRANT SELECT ON public.participants TO anon, authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants public read" ON public.participants FOR SELECT USING (true);
CREATE INDEX participants_battle_idx ON public.participants(battle_id);

-- VOTES
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number >= 1),
  score INT NOT NULL CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, battle_id, round_number, participant_id)
);
GRANT SELECT, INSERT ON public.votes TO anon, authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes public read" ON public.votes FOR SELECT USING (true);
CREATE POLICY "votes public insert" ON public.votes FOR INSERT WITH CHECK (true);
CREATE INDEX votes_battle_idx ON public.votes(battle_id);
CREATE INDEX votes_user_battle_idx ON public.votes(user_id, battle_id);

-- Only one active battle at a time
CREATE UNIQUE INDEX one_active_battle ON public.battles ((is_active)) WHERE is_active = true;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;

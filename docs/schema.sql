-- Production reference schema, PostgreSQL. Browser MVP uses a versioned JSON save.
BEGIN;
CREATE TABLE accounts (id UUID PRIMARY KEY, auth_subject TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE wallets (account_id UUID PRIMARY KEY REFERENCES accounts(id), zeny BIGINT NOT NULL DEFAULT 0 CHECK (zeny>=0), revision BIGINT NOT NULL DEFAULT 0);
CREATE TABLE jobs (id TEXT PRIMARY KEY, name_uk TEXT NOT NULL, tier SMALLINT NOT NULL CHECK(tier BETWEEN 0 AND 2));
CREATE TABLE job_edges (from_job TEXT REFERENCES jobs(id), to_job TEXT REFERENCES jobs(id), required_job_level INT NOT NULL CHECK(required_job_level>0), PRIMARY KEY(from_job,to_job));
CREATE TABLE heroes (
 id UUID PRIMARY KEY, account_id UUID NOT NULL REFERENCES accounts(id), name TEXT NOT NULL,
 job_id TEXT NOT NULL REFERENCES jobs(id), base_level INT NOT NULL DEFAULT 1 CHECK(base_level BETWEEN 1 AND 99),
 job_level INT NOT NULL DEFAULT 1 CHECK(job_level BETWEEN 1 AND 50), base_xp BIGINT NOT NULL DEFAULT 0 CHECK(base_xp>=0), job_xp BIGINT NOT NULL DEFAULT 0 CHECK(job_xp>=0),
 str INT NOT NULL DEFAULT 4 CHECK(str BETWEEN 1 AND 999), agi INT NOT NULL DEFAULT 4 CHECK(agi BETWEEN 1 AND 999),
 vit INT NOT NULL DEFAULT 4 CHECK(vit BETWEEN 1 AND 999), int_stat INT NOT NULL DEFAULT 4 CHECK(int_stat BETWEEN 1 AND 999),
 dex INT NOT NULL DEFAULT 4 CHECK(dex BETWEEN 1 AND 999), luk INT NOT NULL DEFAULT 4 CHECK(luk BETWEEN 1 AND 999),
 stat_points INT NOT NULL DEFAULT 5 CHECK(stat_points>=0), skill_points INT NOT NULL DEFAULT 0 CHECK(skill_points>=0),
 hp INT NOT NULL CHECK(hp>=0), sp INT NOT NULL CHECK(sp>=0), revision BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX heroes_account ON heroes(account_id);
CREATE TABLE party_slots (account_id UUID REFERENCES accounts(id), slot SMALLINT CHECK(slot BETWEEN 0 AND 5), hero_id UUID NOT NULL UNIQUE REFERENCES heroes(id), is_leader BOOLEAN NOT NULL DEFAULT false, PRIMARY KEY(account_id,slot));
CREATE UNIQUE INDEX one_leader ON party_slots(account_id) WHERE is_leader;
-- Service validates hero ownership and membership in every transaction.
CREATE TABLE skills (id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES jobs(id), name_uk TEXT NOT NULL, max_rank INT NOT NULL, sp_cost INT NOT NULL, cooldown_ms INT NOT NULL, config JSONB NOT NULL DEFAULT '{}');
CREATE TABLE skill_edges (skill_id TEXT REFERENCES skills(id), requires_skill_id TEXT REFERENCES skills(id), required_rank INT NOT NULL, PRIMARY KEY(skill_id,requires_skill_id));
CREATE TABLE hero_skills (hero_id UUID REFERENCES heroes(id), skill_id TEXT REFERENCES skills(id), rank INT NOT NULL CHECK(rank>0), PRIMARY KEY(hero_id,skill_id));
CREATE TABLE regions (id TEXT PRIMARY KEY, name_uk TEXT NOT NULL, min_level INT NOT NULL, max_level INT NOT NULL, navigation_version INT NOT NULL DEFAULT 1);
CREATE TABLE monsters (id TEXT PRIMARY KEY, region_id TEXT REFERENCES regions(id), name_uk TEXT NOT NULL, level INT NOT NULL, hp INT NOT NULL, atk INT NOT NULL, def INT NOT NULL, hit INT NOT NULL, flee INT NOT NULL, element TEXT NOT NULL, race TEXT NOT NULL, size TEXT NOT NULL, boss BOOLEAN NOT NULL DEFAULT false, ai JSONB NOT NULL);
CREATE TABLE item_templates (id TEXT PRIMARY KEY, name_uk TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('weapon','armor','card','consumable','material')), weight INT NOT NULL CHECK(weight>=0), sockets INT NOT NULL DEFAULT 0 CHECK(sockets>=0), effects JSONB NOT NULL DEFAULT '{}', tradable BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE drop_table (monster_id TEXT REFERENCES monsters(id), item_id TEXT REFERENCES item_templates(id), chance_ppm INT CHECK(chance_ppm BETWEEN 0 AND 1000000), min_qty INT NOT NULL DEFAULT 1 CHECK(min_qty>0), max_qty INT NOT NULL DEFAULT 1, CHECK(max_qty>=min_qty), PRIMARY KEY(monster_id,item_id));
CREATE TABLE inventory_instances (id UUID PRIMARY KEY, account_id UUID NOT NULL REFERENCES accounts(id), template_id TEXT NOT NULL REFERENCES item_templates(id), quantity INT NOT NULL CHECK(quantity>0), bound BOOLEAN NOT NULL DEFAULT false, revision BIGINT NOT NULL DEFAULT 0);
CREATE INDEX inventory_owner ON inventory_instances(account_id);
CREATE TABLE equipment (hero_id UUID REFERENCES heroes(id), slot TEXT CHECK(slot IN ('weapon','armor','head','accessory')), item_instance_id UUID NOT NULL UNIQUE REFERENCES inventory_instances(id), PRIMARY KEY(hero_id,slot));
CREATE TABLE socketed_cards (gear_instance_id UUID REFERENCES inventory_instances(id), socket_index SMALLINT CHECK(socket_index>=0), card_template_id TEXT NOT NULL REFERENCES item_templates(id), PRIMARY KEY(gear_instance_id,socket_index));
CREATE TABLE quests (id TEXT PRIMARY KEY, kind TEXT CHECK(kind IN ('story','daily','town','guild')), name_uk TEXT NOT NULL, dialogue_uk TEXT NOT NULL, objectives JSONB NOT NULL, rewards JSONB NOT NULL, prerequisite_id TEXT REFERENCES quests(id));
CREATE TABLE quest_progress (account_id UUID REFERENCES accounts(id), quest_id TEXT REFERENCES quests(id), period_key TEXT NOT NULL DEFAULT 'once', progress JSONB NOT NULL DEFAULT '{}', claimed_at TIMESTAMPTZ, PRIMARY KEY(account_id,quest_id,period_key));
CREATE TABLE market_listings (id UUID PRIMARY KEY, seller_id UUID NOT NULL REFERENCES accounts(id), item_instance_id UUID NOT NULL UNIQUE REFERENCES inventory_instances(id), quantity INT NOT NULL CHECK(quantity>0), unit_price BIGINT NOT NULL CHECK(unit_price>0), status TEXT NOT NULL CHECK(status IN ('active','sold','cancelled')), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE ledger (id UUID PRIMARY KEY, account_id UUID NOT NULL REFERENCES accounts(id), delta BIGINT NOT NULL, reason TEXT NOT NULL, operation_id UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(account_id,operation_id));
CREATE TABLE idempotency (account_id UUID REFERENCES accounts(id), operation_id UUID, request_hash TEXT NOT NULL, response JSONB NOT NULL, PRIMARY KEY(account_id,operation_id));
CREATE TABLE offline_sessions (id UUID PRIMARY KEY, account_id UUID NOT NULL REFERENCES accounts(id), region_id TEXT REFERENCES regions(id), started_at TIMESTAMPTZ NOT NULL, settled_at TIMESTAMPTZ, rules_version INT NOT NULL, squad_snapshot JSONB NOT NULL);
CREATE UNIQUE INDEX one_open_offline_session ON offline_sessions(account_id) WHERE settled_at IS NULL;
COMMIT;

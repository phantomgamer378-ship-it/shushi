# ADR-0002: Database Engine, Connection Pooling, and Migration Strategy

## Status
Accepted

## Context
EventFlow relies on PostgreSQL for strict ACID compliance, transactional integrity during ticket check-in, and Row-Level Security (RLS). The production infrastructure uses Supabase PostgreSQL in the `ap-south-1` (Mumbai, India) region.

FastAPI operates an asynchronous event loop (using `asyncpg`), opening many concurrent connections. Supabase provides Supavisor (connection pooler) on port 6543 (transaction mode) and direct PostgreSQL access on port 5432 (session mode).

Database schema migrations must be strictly version-controlled and reproducible across environments. `create_all()` is unacceptable in production because it cannot handle schema evolutions, column migrations, index modifications, or data backfills.

## Decision
1. **Database Platform**: Supabase PostgreSQL 17 in `ap-south-1` (AWS Mumbai).
2. **Connection Routing**:
   - Runtime web application and background workers connect to the **Supavisor Transaction Pooler** (`aws-1-ap-south-1.pooler.supabase.com:6543`) using `postgresql+asyncpg://`.
   - Schema migrations (Alembic) and administrative CLI operations connect to the **Direct Host** (`db.jkchyjghuaiyulxqzobl.supabase.co:5432`) using session mode.
3. **Migration Tooling**: Alembic is the sole mechanism for database DDL changes. `create_all()` is strictly forbidden in application startup code.
4. **Connection Pool Configuration**:
   - Connection pool size: 20 per container instance.
   - Max overflow: 10.
   - Pool recycle: 1800 seconds (30 minutes) to prevent stale connections through firewalls/proxies.
   - Connection pre-ping enabled (`pool_pre_ping=True`) to handle terminated idle sockets gracefully.

## Consequences
### Positive
- Prevents database connection exhaustion under burst loads (e.g., ticket scan surges at event doors).
- Safe, zero-downtime, reviewable schema evolution via Alembic revision scripts.
- Consistent latency for Indian attendees and staff due to Mumbai regional proximity.

### Negative / Trade-offs
- In transaction pooling mode, prepared statements across transactions and session-level locks (`pg_advisory_lock`) are not supported across pooled connections. Application code must use standard transaction-bound locks (`SELECT ... FOR UPDATE`).

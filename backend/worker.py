import asyncio
import logging
from app.core.logging import setup_logging
from app.core.database import AsyncSessionLocal
from app.domains.email.service import EmailOutboxService

setup_logging()
logger = logging.getLogger("eventflow.worker_runner")

POLL_INTERVAL_SECONDS = 5


async def run_worker():
    """Background worker daemon continuously polling and processing email outbox jobs."""
    logger.info("Starting EventFlow Background Outbox Worker...")
    while True:
        try:
            async with AsyncSessionLocal() as session:
                service = EmailOutboxService(session)
                processed = await service.process_pending_batch(batch_size=10)
                if processed > 0:
                    logger.info("Processed %d outbox job(s)", processed)
        except Exception as e:
            logger.error("Error in outbox worker loop: %s", str(e))

        await asyncio.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run_worker())

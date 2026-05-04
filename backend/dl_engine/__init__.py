# DL Engine — loads and exposes the inference pipeline
from dl_engine.dl_pipeline import DLScoringPipeline

_pipeline: DLScoringPipeline | None = None


def get_dl_pipeline() -> DLScoringPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = DLScoringPipeline()
    return _pipeline


async def load_dl_pipeline():
    """Called on FastAPI startup."""
    pipeline = get_dl_pipeline()
    await pipeline.load()
    return pipeline
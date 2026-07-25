from fastapi import APIRouter
from pydantic import BaseModel

from ..neural import brain_io

router = APIRouter(prefix="/api")


class SaveBrainBody(BaseModel):
    name: str = ""


def build_router(engine):
    @router.get("/brains")
    def list_brains():
        return {"brains": brain_io.list_brains()}

    @router.post("/brains")
    def save_brain(body: SaveBrainBody):
        return engine.save_current_best(body.name)

    @router.delete("/brains/{brain_id}")
    def delete_brain(brain_id: str):
        return {"deleted": brain_io.delete_brain(brain_id)}

    @router.get("/track")
    def get_track():
        return engine.track.to_dict()

    @router.get("/state")
    def get_state():
        return engine.snapshot()

    return router

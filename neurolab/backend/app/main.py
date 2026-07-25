import asyncio
import contextlib

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import build_router
from .engine import Engine

app = FastAPI(title="NeuroLab")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = Engine()
app.include_router(build_router(engine))

_task = None


@app.on_event("startup")
async def _startup():
    global _task
    _task = asyncio.create_task(engine.run())


@app.on_event("shutdown")
async def _shutdown():
    if _task:
        _task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await _task


@app.get("/health")
def health():
    return {"ok": True, "generation": engine.generation}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    engine.add_client(ws)
    # send the track right away so the client can draw before the first frame
    await ws.send_json({"type": "track", **engine.track.to_dict()})
    try:
        while True:
            msg = await ws.receive_json()
            try:
                engine.handle_command(msg)
            except Exception as exc:
                await ws.send_json({"type": "error", "message": str(exc)})
    except WebSocketDisconnect:
        pass
    finally:
        engine.remove_client(ws)

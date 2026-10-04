from app.routers.auth import router as auth_router
from app.routers.logs import router as logs_router
from app.routers.threats import router as threats_router
from app.routers.incidents import router as incidents_router
from app.routers.playbooks import router as playbooks_router
from app.routers.ai import router as ai_router
from app.routers.maturity import router as maturity_router
from app.routers.simulations import router as simulations_router
from app.routers.splunk import router as splunk_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "logs_router",
    "threats_router",
    "incidents_router",
    "playbooks_router",
    "ai_router",
    "maturity_router",
    "simulations_router",
    "splunk_router",
    "dashboard_router",
]

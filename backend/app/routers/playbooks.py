from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.playbook import Playbook
from app.schemas.playbook import (
    PlaybookResponse, PlaybookExecutionRequest, PlaybookExecutionResponse
)
from app.playbooks.engine import execute_playbook_simulation, DEFAULT_PLAYBOOKS

router = APIRouter(prefix="/playbooks", tags=["Response Playbooks"])

@router.get("", response_model=List[PlaybookResponse])
def get_playbooks(db: Session = Depends(get_db)):
    playbooks = db.query(Playbook).all()
    if not playbooks:
        # Return default playbooks
        return [PlaybookResponse(id=idx+1, **p) for idx, p in enumerate(DEFAULT_PLAYBOOKS)]
    return playbooks

@router.get("/{playbook_id}", response_model=PlaybookResponse)
def get_playbook(playbook_id: str, db: Session = Depends(get_db)):
    playbook = None
    if playbook_id.isdigit():
        playbook = db.query(Playbook).filter(Playbook.id == int(playbook_id)).first()
    if not playbook:
        playbook = db.query(Playbook).filter(Playbook.playbook_id == playbook_id).first()

    if not playbook:
        # Check default playbooks
        pb_dict = next((p for p in DEFAULT_PLAYBOOKS if p["playbook_id"] == playbook_id), None)
        if pb_dict:
            return PlaybookResponse(id=1, **pb_dict)
        raise HTTPException(status_code=404, detail=f"Playbook {playbook_id} not found")
    return playbook

@router.post("/{playbook_id}/execute", response_model=PlaybookExecutionResponse)
def execute_playbook(playbook_id: str, req: PlaybookExecutionRequest, db: Session = Depends(get_db)):
    """Executes a playbook through all 6 SOAR phases in simulation mode."""
    res = execute_playbook_simulation(
        db=db,
        playbook_id=playbook_id,
        incident_id=req.incident_id,
        target_asset=req.target_asset
    )
    return res

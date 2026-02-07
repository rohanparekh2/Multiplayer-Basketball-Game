from dataclasses import dataclass
from typing import Optional
from app.models.shot_archetypes import ShotArchetype, ShotZone, ContestLevel


@dataclass
class ShotRecord:
    """Record of a shot attempt for history tracking."""
    archetype: ShotArchetype
    subtype: str
    zone: ShotZone
    contest_level: ContestLevel
    made: bool
    points: int  # 2 or 3
    turn_number: int  # Which turn in the game


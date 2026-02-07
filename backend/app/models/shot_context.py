from dataclasses import dataclass
from app.models.shot_archetypes import ShotArchetype, ShotZone, ContestLevel, DribbleState


@dataclass
class ShotContext:
    """Represents the full context of a shot attempt."""
    archetype: ShotArchetype  # RIM, PAINT, MIDRANGE, THREE, DEEP
    subtype: str  # "layup", "dunk", "floater", etc.
    zone: ShotZone  # CORNER, WING, TOP, PAINT, RESTRICTED
    contest_level: ContestLevel  # OPEN, LIGHT, HEAVY
    dribble_state: DribbleState  # CATCH_AND_SHOOT, OFF_DRIBBLE
    distance_feet: float = 0.0  # Optional: actual distance


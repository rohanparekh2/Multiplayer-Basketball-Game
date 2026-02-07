from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
from app.models.shot_archetypes import ShotZone, ContestLevel


class DefensePersonality(str, Enum):
    """Enum representing defense personality/scheme."""
    DROP_BIG = "drop_big"
    SWITCH_EVERYTHING = "switch_everything"
    NO_MIDDLE = "no_middle"
    DARE_YOU_TO_SHOOT = "dare_you_to_shoot"


@dataclass
class DefenseState:
    """Represents the adaptive defense state."""
    # PRIMARY: Contest distribution by zone (drives shot outcomes)
    contest_distribution: Dict[ShotZone, ContestLevel]  # {CORNER: LIGHT, WING: HEAVY, ...}
    
    # Help behavior
    help_frequency: float  # 0.0-1.0 (chance of help)
    help_zones: List[ShotZone]  # Which zones help comes from
    
    # Foul tendency
    foul_rate: float  # 0.0-1.0 (chance of fouling on contest)
    
    # Optional personality/scheme
    personality: Optional[DefensePersonality] = None  # DROP_BIG, SWITCH_EVERYTHING, etc.


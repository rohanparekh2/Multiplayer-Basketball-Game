from pydantic import BaseModel
from typing import Optional
from app.models.offense import ShotType
from app.models.defense import DefenseType
from app.models.shot_archetypes import ShotArchetype, ShotZone, ContestLevel, DribbleState


class PlayerSchema(BaseModel):
    """Player schema for API."""
    name: str
    score: int = 0
    
    class Config:
        from_attributes = True


class GameCreate(BaseModel):
    """Schema for creating a new game."""
    player_one_name: str = "Player 1"
    player_two_name: str = "Player 2"


class ShotRequest(BaseModel):
    """Schema for shot selection. Supports both legacy and new formats."""
    # Legacy format (backward compatible)
    shot_type: Optional[ShotType] = None
    # New format
    archetype: Optional[ShotArchetype] = None
    subtype: Optional[str] = None  # If None, use default for archetype
    zone: Optional[ShotZone] = None
    contest_level: Optional[ContestLevel] = None  # Auto-set by defense if None
    dribble_state: Optional[DribbleState] = None


class DefenseRequest(BaseModel):
    """Schema for defense selection."""
    defense_type: DefenseType


class PowerRequest(BaseModel):
    """Schema for power selection. Now supports timing data."""
    power: int
    # Timing data from frontend timing meter
    timing_grade: Optional[str] = None  # "PERFECT", "GOOD", "MISS"
    timing_error: Optional[float] = None  # 0.0 to 1.0


class ShotRecordSchema(BaseModel):
    """Schema for shot record."""
    archetype: str
    subtype: str
    zone: str
    contest_level: str
    made: bool
    points: int
    turn_number: int
    
    class Config:
        from_attributes = True


class DefenseStateSchema(BaseModel):
    """Schema for defense state."""
    contest_distribution: dict[str, str] = {}
    help_frequency: float = 0.5
    foul_rate: float = 0.1
    
    class Config:
        from_attributes = True


class GameStateResponse(BaseModel):
    """Schema for game state response."""
    room_id: str
    player_one: PlayerSchema
    player_two: PlayerSchema
    current_offensive_player: str
    current_defensive_player: str
    state: str
    shot_type: Optional[ShotType] = None
    defense_type: Optional[DefenseType] = None
    power: Optional[int] = None
    shot_result: Optional[bool] = None
    animation_finished: bool
    game_over: bool
    winner: Optional[PlayerSchema] = None
    shot_history: list[ShotRecordSchema] = []
    defense_state: Optional[DefenseStateSchema] = None


class GameResponse(BaseModel):
    """Schema for game response."""
    room_id: str
    message: str
    game_state: GameStateResponse


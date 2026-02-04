from pydantic import BaseModel
from typing import Optional
from app.models.offense import ShotType
from app.models.defense import DefenseType


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
    """Schema for shot selection."""
    shot_type: ShotType


class DefenseRequest(BaseModel):
    """Schema for defense selection."""
    defense_type: DefenseType


class PowerRequest(BaseModel):
    """Schema for power selection."""
    power: int


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


class GameResponse(BaseModel):
    """Schema for game response."""
    room_id: str
    message: str
    game_state: GameStateResponse


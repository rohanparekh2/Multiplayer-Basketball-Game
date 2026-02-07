from dataclasses import dataclass, field
from typing import Optional, List
from enum import Enum
from app.models.player import Player
from app.models.offense import ShotType
from app.models.defense import DefenseType
from app.models.shot_record import ShotRecord
from app.models.defense_state import DefenseState


class GameState(str, Enum):
    """Game state enum."""
    WAITING_FOR_SHOT = "waiting_for_shot"
    WAITING_FOR_DEFENSE = "waiting_for_defense"
    WAITING_FOR_POWER = "waiting_for_power"
    ANIMATING = "animating"
    SHOT_RESULT = "shot_result"
    GAME_OVER = "game_over"


@dataclass
class Game:
    """Represents a game instance with two players."""
    player_one: Player
    player_two: Player
    current_offensive_player: Player = field(init=False)
    current_defensive_player: Player = field(init=False)
    state: str = GameState.WAITING_FOR_SHOT.value
    shot_type: Optional[ShotType] = None
    defense_type: Optional[DefenseType] = None
    power: Optional[int] = None
    shot_result: Optional[bool] = None
    animation_finished: bool = False
    room_id: str = ""
    shot_history: List[ShotRecord] = field(default_factory=list)  # Last 10-20 shots across both players
    defense_state: Optional[DefenseState] = None
    
    def __post_init__(self):
        """Initialize current players."""
        self.current_offensive_player = self.player_one
        self.current_defensive_player = self.player_two
    
    def swap_players(self) -> None:
        """Swaps offensive and defensive players."""
        self.current_offensive_player, self.current_defensive_player = (
            self.current_defensive_player,
            self.current_offensive_player
        )
    
    def reset_turn(self) -> None:
        """Resets turn variables for next shot."""
        self.shot_type = None
        self.defense_type = None
        self.power = None
        self.shot_result = None
        self.animation_finished = False
        self.state = GameState.WAITING_FOR_SHOT.value
        self.swap_players()
    
    def is_game_over(self) -> bool:
        """Checks if game is over (first to 10 points wins)."""
        return (
            self.player_one.score >= 10 or 
            self.player_two.score >= 10
        )
    
    def get_winner(self) -> Optional[Player]:
        """Returns the winning player if game is over."""
        if not self.is_game_over():
            return None
        return self.player_one if self.player_one.score > self.player_two.score else self.player_two


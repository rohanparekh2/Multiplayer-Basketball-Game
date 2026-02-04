from typing import Dict, Optional
from app.models.game import Game, GameState
from app.models.player import Player
from app.models.offense import Offense, ShotType
from app.models.defense import Defense, DefenseType
import uuid


class GameService:
    """Service for managing game instances and game logic."""
    
    def __init__(self):
        # In-memory storage for games (in production, use database)
        self.games: Dict[str, Game] = {}
    
    def create_game(self, player_one_name: str, player_two_name: str) -> str:
        """Creates a new game and returns room_id."""
        room_id = str(uuid.uuid4())
        player_one = Player(name=player_one_name)
        player_two = Player(name=player_two_name)
        
        game = Game(player_one=player_one, player_two=player_two, room_id=room_id)
        self.games[room_id] = game
        return room_id
    
    def get_game(self, room_id: str) -> Optional[Game]:
        """Retrieves a game by room_id."""
        return self.games.get(room_id)
    
    def select_shot(self, room_id: str, shot_type: ShotType) -> bool:
        """Handles shot selection."""
        game = self.get_game(room_id)
        if not game or game.state != GameState.WAITING_FOR_SHOT.value:
            return False
        
        game.shot_type = shot_type
        game.state = GameState.WAITING_FOR_DEFENSE.value
        return True
    
    def select_defense(self, room_id: str, defense_type: DefenseType) -> bool:
        """Handles defense selection."""
        game = self.get_game(room_id)
        if not game or game.state != GameState.WAITING_FOR_DEFENSE.value:
            return False
        
        game.defense_type = defense_type
        game.state = GameState.WAITING_FOR_POWER.value
        return True
    
    def select_power(self, room_id: str, power: int) -> bool:
        """Handles power selection and calculates shot result."""
        game = self.get_game(room_id)
        if not game or game.state != GameState.WAITING_FOR_POWER.value:
            return False
        
        if not game.shot_type or not game.defense_type:
            return False
        
        game.power = power
        game.state = GameState.ANIMATING.value
        
        # Calculate shot result
        offense = Offense()
        offense.select_shot(game.shot_type)
        defense = Defense(game.defense_type)
        offense.calculate_shot_percentage(power, defense)
        
        game.shot_result = offense.determine_shot_result(
            game.current_offensive_player,
            game.shot_type,
            defense
        )
        
        return True
    
    def finish_animation(self, room_id: str) -> bool:
        """Marks animation as finished."""
        game = self.get_game(room_id)
        if not game:
            return False
        
        game.animation_finished = True
        game.state = GameState.SHOT_RESULT.value
        return True
    
    def next_turn(self, room_id: str) -> bool:
        """Moves to next turn."""
        game = self.get_game(room_id)
        if not game or game.state != GameState.SHOT_RESULT.value:
            return False
        
        if game.is_game_over():
            game.state = GameState.GAME_OVER.value
        else:
            game.reset_turn()
        
        return True
    
    def delete_game(self, room_id: str) -> bool:
        """Deletes a game."""
        if room_id in self.games:
            del self.games[room_id]
            return True
        return False


# Singleton instance
game_service = GameService()


from typing import Dict, Optional
from app.models.game import Game, GameState
from app.models.player import Player
from app.models.offense import Offense, ShotType
from app.models.defense import Defense, DefenseType
from app.models.shot_record import ShotRecord
from app.models.shot_context import ShotContext
from app.models.shot_archetypes import ShotArchetype, ShotZone, ContestLevel, DribbleState
from app.models.defense_state import DefenseState
from app.services.defense_ai_service import DefenseAIService
import uuid


class GameService:
    """Service for managing game instances and game logic."""
    
    def __init__(self):
        # In-memory storage for games (in production, use database)
        self.games: Dict[str, Game] = {}
        self.defense_ai = DefenseAIService()
    
    def create_game(self, player_one_name: str, player_two_name: str) -> str:
        """Creates a new game and returns room_id."""
        room_id = str(uuid.uuid4())
        player_one = Player(name=player_one_name)
        player_two = Player(name=player_two_name)
        
        game = Game(player_one=player_one, player_two=player_two, room_id=room_id)
        # Initialize default defense state
        game.defense_state = self.defense_ai._get_default_defense()
        self.games[room_id] = game
        return room_id
    
    def get_game(self, room_id: str) -> Optional[Game]:
        """Retrieves a game by room_id."""
        return self.games.get(room_id)
    
    def select_shot(self, room_id: str, shot_type: ShotType) -> bool:
        """Handles shot selection."""
        game = self.get_game(room_id)
        if not game:
            print(f"❌ select_shot: Game not found for room_id: {room_id}")
            return False
        
        if game.state != GameState.WAITING_FOR_SHOT.value:
            print(f"❌ select_shot: Invalid state. Expected WAITING_FOR_SHOT, got: {game.state}")
            return False
        
        game.shot_type = shot_type
        game.state = GameState.WAITING_FOR_DEFENSE.value
        print(f"✅ select_shot: Shot selected successfully. New state: {game.state}")
        return True
    
    def select_defense(self, room_id: str, defense_type: DefenseType) -> bool:
        """Handles defense selection."""
        game = self.get_game(room_id)
        if not game or game.state != GameState.WAITING_FOR_DEFENSE.value:
            return False
        
        game.defense_type = defense_type
        game.state = GameState.WAITING_FOR_POWER.value
        return True
    
    def select_power(
        self, 
        room_id: str, 
        power: int,
        timing_grade: str | None = None,
        timing_error: float | None = None
    ) -> bool:
        """Handles power selection and calculates shot result using new probability system.
        
        Now supports timing data from frontend timing meter.
        """
        game = self.get_game(room_id)
        if not game or game.state != GameState.WAITING_FOR_POWER.value:
            return False
        
        if not game.shot_type or not game.defense_type:
            return False
        
        game.power = power
        game.state = GameState.ANIMATING.value
        
        # Map legacy ShotType to new ShotContext
        shot_context = self._create_shot_context_from_legacy(
            game.shot_type,
            game.defense_type,
            game.defense_state
        )
        
        # Use new probability system
        offense = Offense()
        if game.defense_state is None:
            game.defense_state = self.defense_ai._get_default_defense()
        
        # Calculate make percentage using new system
        make_probability = offense.calculate_make_percentage(
            shot_context,
            game.current_offensive_player,
            game.defense_state
        )
        
        # Apply timing modifier if provided (from frontend timing meter)
        timing_modifier = 0.0
        if timing_grade and timing_error is not None:
            timing_modifier = self._get_timing_modifier(timing_grade, timing_error)
        
        # Apply power modifier (legacy fallback, smaller impact if timing is provided)
        if timing_grade:
            # If timing is provided, power modifier is minimal (just for backward compatibility)
            power_modifier = (power - 50) / 100.0 * 0.03  # ±1.5% max when timing is used
        else:
            # Legacy behavior: power affects percentage more when no timing
            power_modifier = (power - 50) / 100.0 * 0.15  # ±6% max
        
        adjusted_probability = make_probability + timing_modifier + power_modifier
        adjusted_probability = max(0.01, min(0.99, adjusted_probability))
        
        # Determine shot result
        import random
        game.shot_result = random.random() < adjusted_probability
        
        # NOTE: Score update moved to finish_animation() so it only updates after shot_result is shown
        # Do NOT update score here - it will be updated when animation finishes
        
        # Track shot history after result is determined
        self._record_shot_with_context(game, shot_context, game.shot_result)
        
        # Update defense state based on new shot history
        game.defense_state = self.defense_ai.update_defense_state(
            game,
            game.shot_history
        )
        
        return True
    
    def _get_timing_modifier(self, timing_grade: str, timing_error: float) -> float:
        """Calculate timing modifier based on grade and error.
        
        Args:
            timing_grade: "PERFECT", "GOOD", or "MISS"
            timing_error: 0.0 (perfect center) to 1.0 (maximum error)
        
        Returns:
            Modifier to add to base probability
        """
        # Base modifiers
        TIMING_MODIFIERS = {
            "PERFECT": +0.10,  # +10% for perfect timing
            "GOOD": +0.03,     # +3% for good timing
            "MISS": -0.08,     # -8% for missed timing
        }
        
        base_modifier = TIMING_MODIFIERS.get(timing_grade, 0.0)
        
        # Error reduces modifier effectiveness
        # error = 0 → full modifier
        # error = 1 → modifier reduced by 30%
        ERROR_SCALE = 0.3
        error_penalty = base_modifier * ERROR_SCALE * timing_error
        
        # For PERFECT/GOOD, error reduces bonus
        # For MISS, error increases penalty
        if timing_grade == "MISS":
            return base_modifier - error_penalty  # More error = more penalty
        else:
            return base_modifier - error_penalty  # More error = less bonus
    
    def _create_shot_context_from_legacy(
        self,
        shot_type: ShotType,
        defense_type: DefenseType,
        defense_state: Optional[DefenseState]
    ) -> ShotContext:
        """Create ShotContext from legacy ShotType and DefenseType."""
        # Map ShotType to ShotArchetype
        archetype_map = {
            ShotType.LAYUP: ShotArchetype.RIM,
            ShotType.MIDRANGE: ShotArchetype.MIDRANGE,
            ShotType.THREE_POINTER: ShotArchetype.THREE,
            ShotType.HALF_COURT: ShotArchetype.DEEP,
        }
        
        archetype = archetype_map.get(shot_type, ShotArchetype.MIDRANGE)
        
        # Default subtype based on archetype
        from app.models.shot_archetypes import DEFAULT_SUBTYPES
        subtype = DEFAULT_SUBTYPES.get(archetype, "catch_shoot")
        
        # Default zone (WING for most shots)
        zone = ShotZone.WING
        
        # Determine contest level from defense_type and defense_state
        if defense_state:
            contest_level = defense_state.contest_distribution.get(zone, ContestLevel.LIGHT)
        else:
            # Map DefenseType to ContestLevel
            contest_map = {
                DefenseType.BLOCK: ContestLevel.HEAVY,
                DefenseType.CONTEST: ContestLevel.HEAVY,
                DefenseType.STEAL: ContestLevel.LIGHT,
                DefenseType.DEFAULT: ContestLevel.OPEN,
            }
            contest_level = contest_map.get(defense_type, ContestLevel.LIGHT)
        
        # Default dribble state
        dribble_state = DribbleState.CATCH_AND_SHOOT
        
        return ShotContext(
            archetype=archetype,
            subtype=subtype,
            zone=zone,
            contest_level=contest_level,
            dribble_state=dribble_state
        )
    
    def _record_shot_with_context(
        self,
        game: Game,
        shot_context: ShotContext,
        made: bool
    ) -> None:
        """Record a shot in history using ShotContext."""
        points = 2 if shot_context.archetype in [ShotArchetype.RIM, ShotArchetype.PAINT, ShotArchetype.MIDRANGE] else 3
        turn_number = len(game.shot_history) + 1
        
        shot_record = ShotRecord(
            archetype=shot_context.archetype,
            subtype=shot_context.subtype,
            zone=shot_context.zone,
            contest_level=shot_context.contest_level,
            made=made,
            points=points,
            turn_number=turn_number
        )
        
        # Add to player history
        game.current_offensive_player.add_shot_record(shot_record)
        
        # Add to game history (keep last 20)
        game.shot_history.append(shot_record)
        if len(game.shot_history) > 20:
            game.shot_history = game.shot_history[-20:]
    
    def _record_shot(self, game: Game, shot_type: ShotType, made: bool) -> None:
        """Record a shot in history for both player and game."""
        # Map legacy ShotType to new system for history
        archetype_map = {
            ShotType.LAYUP: ShotArchetype.RIM,
            ShotType.MIDRANGE: ShotArchetype.MIDRANGE,
            ShotType.THREE_POINTER: ShotArchetype.THREE,
            ShotType.HALF_COURT: ShotArchetype.DEEP,
        }
        
        archetype = archetype_map.get(shot_type, ShotArchetype.MIDRANGE)
        subtype = "layup" if shot_type == ShotType.LAYUP else "catch_shoot"
        zone = ShotZone.WING  # Default zone for legacy shots
        contest_level = ContestLevel.LIGHT  # Default contest
        
        # Determine contest level from defense state if available
        if game.defense_state:
            contest_level = game.defense_state.contest_distribution.get(zone, ContestLevel.LIGHT)
        
        points = 2 if shot_type in [ShotType.LAYUP, ShotType.MIDRANGE] else 3
        turn_number = len(game.shot_history) + 1
        
        shot_record = ShotRecord(
            archetype=archetype,
            subtype=subtype,
            zone=zone,
            contest_level=contest_level,
            made=made,
            points=points,
            turn_number=turn_number
        )
        
        # Add to player history
        game.current_offensive_player.add_shot_record(shot_record)
        
        # Add to game history (keep last 20)
        game.shot_history.append(shot_record)
        if len(game.shot_history) > 20:
            game.shot_history = game.shot_history[-20:]
    
    def finish_animation(self, room_id: str) -> bool:
        """Marks animation as finished and updates score if shot was made."""
        game = self.get_game(room_id)
        if not game:
            return False
        
        # Only process if we're in ANIMATING state (prevent duplicate calls)
        if game.state != GameState.ANIMATING.value:
            print(f"⚠️ finish_animation called but state is {game.state}, not ANIMATING. Ignoring.")
            return False
        
        # Update player score if shot was made (only after animation finishes, when shot_result is shown)
        if game.shot_result and game.shot_type and game.defense_type:
            # Recreate shot context to determine points based on archetype
            shot_context = self._create_shot_context_from_legacy(
                game.shot_type,
                game.defense_type,
                game.defense_state
            )
            # Determine points based on archetype
            points = 2 if shot_context.archetype in [ShotArchetype.RIM, ShotArchetype.PAINT, ShotArchetype.MIDRANGE] else 3
            if points == 2:
                game.current_offensive_player.two_pointer()
            else:
                game.current_offensive_player.three_pointer()
        
        game.animation_finished = True
        game.state = GameState.SHOT_RESULT.value
        return True
    
    def next_turn(self, room_id: str) -> bool:
        """Moves to next turn."""
        game = self.get_game(room_id)
        if not game:
            return False
        
        # Only allow next_turn if we're in SHOT_RESULT state
        if game.state != GameState.SHOT_RESULT.value:
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


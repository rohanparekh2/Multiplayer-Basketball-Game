from typing import List
from app.models.game import Game
from app.models.shot_record import ShotRecord
from app.models.defense_state import DefenseState, DefensePersonality
from app.models.shot_archetypes import ShotZone, ContestLevel, ShotArchetype


class DefenseAIService:
    """Rule-based defense coordinator that adapts to player tendencies."""
    
    def update_defense_state(
        self,
        game: Game,
        shot_history: List[ShotRecord]
    ) -> DefenseState:
        """
        Analyze tendencies and update defense state.
        Primary output: contest_distribution (Dict[ShotZone, ContestLevel)
        """
        if not shot_history:
            # Default balanced defense
            return self._get_default_defense()
        
        # Analyze last 10 shots
        recent_shots = shot_history[-10:] if len(shot_history) >= 10 else shot_history
        
        # Calculate shot rates by archetype
        three_rate = self._calculate_shot_rate(recent_shots, ShotArchetype.THREE)
        rim_rate = self._calculate_shot_rate(recent_shots, ShotArchetype.RIM)
        midrange_rate = self._calculate_shot_rate(recent_shots, ShotArchetype.MIDRANGE)
        paint_rate = self._calculate_shot_rate(recent_shots, ShotArchetype.PAINT)
        
        # Adjust defense - PRIMARY: contest_distribution
        if three_rate > 0.5:
            # User spams three-pointers - pressure perimeter
            return DefenseState(
                contest_distribution={
                    ShotZone.CORNER: ContestLevel.HEAVY,
                    ShotZone.WING: ContestLevel.HEAVY,
                    ShotZone.TOP: ContestLevel.HEAVY,
                    ShotZone.PAINT: ContestLevel.LIGHT,
                    ShotZone.RESTRICTED: ContestLevel.OPEN,
                },
                help_frequency=0.3,  # Less help needed if perimeter is covered
                help_zones=[ShotZone.PAINT],  # Help from paint
                foul_rate=0.1,
                personality=DefensePersonality.SWITCH_EVERYTHING,
            )
        elif rim_rate > 0.5 or paint_rate > 0.4:
            # User spams rim/paint - collapse inside
            return DefenseState(
                contest_distribution={
                    ShotZone.CORNER: ContestLevel.LIGHT,
                    ShotZone.WING: ContestLevel.LIGHT,
                    ShotZone.TOP: ContestLevel.LIGHT,
                    ShotZone.PAINT: ContestLevel.HEAVY,
                    ShotZone.RESTRICTED: ContestLevel.HEAVY,
                },
                help_frequency=0.7,  # More help needed at rim
                help_zones=[ShotZone.PAINT, ShotZone.RESTRICTED],
                foul_rate=0.2,  # Higher foul rate at rim
                personality=DefensePersonality.DROP_BIG,
            )
        elif midrange_rate > 0.4:
            # User prefers midrange - no middle defense
            return DefenseState(
                contest_distribution={
                    ShotZone.CORNER: ContestLevel.LIGHT,
                    ShotZone.WING: ContestLevel.HEAVY,
                    ShotZone.TOP: ContestLevel.HEAVY,
                    ShotZone.PAINT: ContestLevel.HEAVY,
                    ShotZone.RESTRICTED: ContestLevel.LIGHT,
                },
                help_frequency=0.5,
                help_zones=[ShotZone.RESTRICTED],
                foul_rate=0.15,
                personality=DefensePersonality.NO_MIDDLE,
            )
        else:
            # Balanced approach - dare them to shoot
            return DefenseState(
                contest_distribution={
                    ShotZone.CORNER: ContestLevel.LIGHT,
                    ShotZone.WING: ContestLevel.LIGHT,
                    ShotZone.TOP: ContestLevel.LIGHT,
                    ShotZone.PAINT: ContestLevel.LIGHT,
                    ShotZone.RESTRICTED: ContestLevel.LIGHT,
                },
                help_frequency=0.4,
                help_zones=[ShotZone.PAINT],
                foul_rate=0.1,
                personality=DefensePersonality.DARE_YOU_TO_SHOOT,
            )
    
    def _calculate_shot_rate(self, shots: List[ShotRecord], archetype: ShotArchetype) -> float:
        """Calculate the rate of shots of a given archetype."""
        if not shots:
            return 0.0
        count = sum(1 for s in shots if s.archetype == archetype)
        return count / len(shots)
    
    def _get_default_defense(self) -> DefenseState:
        """Return default balanced defense state."""
        return DefenseState(
            contest_distribution={
                ShotZone.CORNER: ContestLevel.LIGHT,
                ShotZone.WING: ContestLevel.LIGHT,
                ShotZone.TOP: ContestLevel.LIGHT,
                ShotZone.PAINT: ContestLevel.LIGHT,
                ShotZone.RESTRICTED: ContestLevel.LIGHT,
            },
            help_frequency=0.5,
            help_zones=[ShotZone.PAINT],
            foul_rate=0.1,
            personality=None,
        )


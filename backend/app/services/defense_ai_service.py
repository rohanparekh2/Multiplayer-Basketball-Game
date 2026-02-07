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
            defense_state = DefenseState(
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
            defense_state.summary = self._calculate_summary(defense_state)
            return defense_state
        elif rim_rate > 0.5 or paint_rate > 0.4:
            # User spams rim/paint - collapse inside
            defense_state = DefenseState(
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
            defense_state.summary = self._calculate_summary(defense_state)
            return defense_state
        elif midrange_rate > 0.4:
            # User prefers midrange - no middle defense
            defense_state = DefenseState(
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
            defense_state.summary = self._calculate_summary(defense_state)
            return defense_state
        else:
            # Balanced approach - dare them to shoot
            defense_state = DefenseState(
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
            defense_state.summary = self._calculate_summary(defense_state)
            return defense_state
    
    def _calculate_shot_rate(self, shots: List[ShotRecord], archetype: ShotArchetype) -> float:
        """Calculate the rate of shots of a given archetype."""
        if not shots:
            return 0.0
        count = sum(1 for s in shots if s.archetype == archetype)
        return count / len(shots)
    
    def _get_default_defense(self) -> DefenseState:
        """Return default balanced defense state."""
        defense_state = DefenseState(
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
        defense_state.summary = self._calculate_summary(defense_state)
        return defense_state
    
    def _calculate_summary(self, defense_state: DefenseState) -> dict:
        """Calculate summary metrics for UI display."""
        contest_dist = defense_state.contest_distribution
        
        # Calculate perimeter pressure (average of CORNER, WING, TOP)
        perimeter_zones = [ShotZone.CORNER, ShotZone.WING, ShotZone.TOP]
        perimeter_contests = [contest_dist.get(zone, ContestLevel.LIGHT) for zone in perimeter_zones]
        perimeter_scores = {
            ContestLevel.OPEN: 0.0,
            ContestLevel.LIGHT: 0.33,
            ContestLevel.HEAVY: 1.0,
        }
        perimeter_pressure = sum(perimeter_scores.get(level, 0.0) for level in perimeter_contests) / len(perimeter_zones)
        
        # Calculate rim protection (average of PAINT, RESTRICTED)
        rim_zones = [ShotZone.PAINT, ShotZone.RESTRICTED]
        rim_contests = [contest_dist.get(zone, ContestLevel.LIGHT) for zone in rim_zones]
        rim_scores = {
            ContestLevel.OPEN: 0.0,
            ContestLevel.LIGHT: 0.33,
            ContestLevel.HEAVY: 1.0,
        }
        rim_protection = sum(rim_scores.get(level, 0.0) for level in rim_contests) / len(rim_zones)
        
        # Map personality to scheme string
        scheme_map = {
            DefensePersonality.SWITCH_EVERYTHING: "SWITCH",
            DefensePersonality.DROP_BIG: "DROP",
            DefensePersonality.NO_MIDDLE: "NO_MIDDLE",
            DefensePersonality.DARE_YOU_TO_SHOOT: "DARE",
        }
        scheme = scheme_map.get(defense_state.personality, "BALANCED")
        
        return {
            "perimeter_pressure": round(perimeter_pressure, 2),
            "rim_protection": round(rim_protection, 2),
            "scheme": scheme,
        }


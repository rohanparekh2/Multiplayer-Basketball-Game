"""Service for shot calculation logic (can be extended for AI later)."""
from app.models.offense import Offense, ShotType
from app.models.defense import Defense, DefenseType


class ShotCalculationService:
    """Service for calculating shot probabilities and results."""
    
    @staticmethod
    def calculate_make_percentage(
        shot_type: ShotType,
        power: int,
        defense_type: DefenseType
    ) -> float:
        """Calculates the make percentage for a shot."""
        offense = Offense()
        offense.select_shot(shot_type)
        defense = Defense(defense_type)
        offense.calculate_shot_percentage(power, defense)
        return offense.make_percentage
    
    @staticmethod
    def determine_shot_result(
        shot_type: ShotType,
        power: int,
        defense_type: DefenseType,
        player: "Player"
    ) -> bool:
        """Determines if a shot is made."""
        offense = Offense()
        offense.select_shot(shot_type)
        defense = Defense(defense_type)
        offense.calculate_shot_percentage(power, defense)
        return offense.determine_shot_result(player, shot_type, defense)


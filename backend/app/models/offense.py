from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.defense import Defense


class ShotType(str, Enum):
    """Enum representing different shot types."""
    DEFAULT = "default"
    LAYUP = "layup"
    MIDRANGE = "midrange"
    THREE_POINTER = "three_pointer"
    HALF_COURT = "half_court"


class Offense:
    """Handles offensive shot calculations and probability."""
    
    # Constants
    MIN_POWER = 10
    MAX_POWER = 90
    POWER_BONUS = 10
    OPTIMAL_PERCENTAGE = 100
    MINIMUM_PERCENTAGE = 0
    
    def __init__(self):
        self.make_percentage: float = 0.0
    
    def select_shot(self, shot_type: ShotType) -> None:
        """Selects shot type and sets initial make percentage."""
        if shot_type == ShotType.LAYUP:
            self.make_percentage = 85.0
        elif shot_type == ShotType.MIDRANGE:
            self.make_percentage = 55.0
        elif shot_type == ShotType.THREE_POINTER:
            self.make_percentage = 35.0
        elif shot_type == ShotType.HALF_COURT:
            self.make_percentage = 10.0
        else:
            self.make_percentage = 0.0
    
    def calculate_shot_percentage(self, power: int, defense: "Defense") -> None:
        """Calculates shot percentage taking power and defense into account."""
        # If power is too high or low, shot cannot be made
        if power < self.MIN_POWER or power > self.MAX_POWER:
            self.make_percentage = 0.0
            return
        
        # Equation that takes power into account
        new_percentage = power + self.make_percentage + defense.get_adjusted_shot_percentage()
        
        if new_percentage > self.OPTIMAL_PERCENTAGE:
            new_percentage = self.OPTIMAL_PERCENTAGE - (new_percentage - self.OPTIMAL_PERCENTAGE)
        
        self.make_percentage = (
            self.make_percentage * (new_percentage / self.OPTIMAL_PERCENTAGE)
        ) + self.POWER_BONUS
    
    def determine_shot_result(
        self, 
        current_player: "Player", 
        shot_type: ShotType, 
        defense: "Defense"
    ) -> bool:
        """Determines if shot was made using randomization."""
        import random
        
        random_percentage = random.uniform(self.MINIMUM_PERCENTAGE, self.OPTIMAL_PERCENTAGE)
        
        if random_percentage > self.make_percentage or random_percentage <= defense.get_turnover_percentage():
            return False
        
        self._adjust_score(current_player, shot_type)
        return True
    
    def _adjust_score(self, current_player: "Player", shot_type: ShotType) -> None:
        """Adjusts player score based on shot type."""
        if shot_type in [ShotType.LAYUP, ShotType.MIDRANGE]:
            current_player.two_pointer()
        else:
            current_player.three_pointer()


from enum import Enum


class DefenseType(str, Enum):
    """Enum representing different defense types."""
    DEFAULT = "default"
    BLOCK = "block"
    STEAL = "steal"
    CONTEST = "contest"


class Defense:
    """Handles defensive calculations and adjustments."""
    
    def __init__(self, defense_type: DefenseType = DefenseType.DEFAULT):
        self.turnover_percentage: int = 0
        self.adjusted_shot_percentage: int = 0
        if defense_type != DefenseType.DEFAULT:
            self.select_defense(defense_type)
    
    def select_defense(self, defense_type: DefenseType) -> None:
        """Selects defense type and calculates adjustments."""
        if defense_type == DefenseType.BLOCK:
            self.turnover_percentage = 25
            self.adjusted_shot_percentage = 5
        elif defense_type == DefenseType.STEAL:
            self.turnover_percentage = 15
            self.adjusted_shot_percentage = 4
        elif defense_type == DefenseType.CONTEST:
            self.adjusted_shot_percentage = -8
        else:
            self.turnover_percentage = 0
            self.adjusted_shot_percentage = 0
    
    def get_adjusted_shot_percentage(self) -> int:
        """Returns the adjusted shot percentage modifier."""
        return self.adjusted_shot_percentage
    
    def get_turnover_percentage(self) -> int:
        """Returns the turnover percentage."""
        return self.turnover_percentage


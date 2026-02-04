from dataclasses import dataclass
from typing import Optional


@dataclass
class Player:
    """Represents a player in the basketball game."""
    name: str
    score: int = 0
    
    def two_pointer(self) -> None:
        """Adds 2 points to the player's score."""
        self.score += 2
    
    def three_pointer(self) -> None:
        """Adds 3 points to the player's score."""
        self.score += 3
    
    def __eq__(self, other: object) -> bool:
        """Checks if two players are equal by name."""
        if not isinstance(other, Player):
            return False
        return self.name == other.name


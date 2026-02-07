from dataclasses import dataclass, field
from typing import List, Dict
from app.models.shot_record import ShotRecord


@dataclass
class Player:
    """Represents a player in the basketball game."""
    name: str
    score: int = 0
    shot_history: List[ShotRecord] = field(default_factory=list)  # Source of truth
    
    def two_pointer(self) -> None:
        """Adds 2 points to the player's score."""
        self.score += 2
    
    def three_pointer(self) -> None:
        """Adds 3 points to the player's score."""
        self.score += 3
    
    def get_fatigue(self) -> int:
        """Compute fatigue from shot history."""
        # Increment per shot, cap at 10
        return min(10, len(self.shot_history) * 0.5)
    
    def get_hot_streak(self) -> int:
        """Compute hot streak from last 3-5 shots."""
        if len(self.shot_history) < 3:
            return 0
        
        last_3 = [s.made for s in self.shot_history[-3:]]
        if sum(last_3) >= 2:
            return 1
        
        if len(self.shot_history) >= 5:
            last_5 = [s.made for s in self.shot_history[-5:]]
            if sum(last_5) <= 1:  # 4+ misses
                return -1
        
        return 0
    
    def get_shot_chart(self) -> Dict[str, int]:
        """Compute shot chart from history."""
        from collections import Counter
        return dict(Counter([s.archetype.value for s in self.shot_history]))
    
    def add_shot_record(self, record: ShotRecord) -> None:
        """Add a shot record and keep only last 20."""
        self.shot_history.append(record)
        if len(self.shot_history) > 20:
            self.shot_history = self.shot_history[-20:]
    
    def __eq__(self, other: object) -> bool:
        """Checks if two players are equal by name."""
        if not isinstance(other, Player):
            return False
        return self.name == other.name


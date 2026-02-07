from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.defense import Defense
    from app.models.player import Player
    from app.models.shot_context import ShotContext
    from app.models.defense_state import DefenseState
    from app.models.shot_archetypes import ShotArchetype, ContestLevel, DribbleState


class ShotType(str, Enum):
    """Enum representing different shot types (legacy, for backward compatibility)."""
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
    
    # Baseline percentages by archetype
    BASELINE_PERCENTAGES = {
        "rim": 0.62,
        "paint": 0.48,
        "midrange": 0.42,
        "three": 0.36,
        "deep": 0.18,
        "heave": 0.05,
    }
    
    def __init__(self):
        self.make_percentage: float = 0.0
    
    def select_shot(self, shot_type: ShotType) -> None:
        """Selects shot type and sets initial make percentage (legacy method)."""
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
        """Calculates shot percentage taking power and defense into account (legacy method)."""
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
    
    def calculate_make_percentage(
        self,
        context: "ShotContext",
        player: "Player",
        defense_state: "DefenseState"
    ) -> float:
        """
        Calculate make percentage using separated 'get good look' vs 'make given look' model.
        
        p_make = p_get_good_look * p_make_open + (1 - p_get_good_look) * p_make_contested
        """
        # Step 1: Probability of getting a good look (depends on defense + dribble + skill)
        p_get_good_look = self._calculate_look_quality(
            context.zone,
            context.dribble_state,
            defense_state,
            player_skill=1.0  # Can vary by player later
        )
        
        # Step 2: Probability of making if open (depends on archetype + player + fatigue + streak)
        p_make_open = self._calculate_make_if_open(
            context.archetype,
            context.subtype,
            player,
            context.dribble_state
        )
        
        # Step 3: Probability of making if contested (lower than open)
        p_make_contested = self._calculate_make_if_contested(
            context.archetype,
            context.subtype,
            context.contest_level,
            player
        )
        
        # Step 4: Combine
        p_make = (
            p_get_good_look * p_make_open +
            (1 - p_get_good_look) * p_make_contested
        )
        
        return max(0.01, min(0.99, p_make))
    
    def _calculate_look_quality(
        self,
        zone: "ShotZone",
        dribble_state: "DribbleState",
        defense_state: "DefenseState",
        player_skill: float
    ) -> float:
        """Probability defense gives you a good look."""
        from app.models.shot_archetypes import ContestLevel, DribbleState
        
        base_contest = defense_state.contest_distribution.get(zone, ContestLevel.OPEN)
        
        # CATCH_AND_SHOOT easier to get open than OFF_DRIBBLE
        if dribble_state == DribbleState.CATCH_AND_SHOOT:
            open_chance = 0.6  # Higher chance of open
        else:
            open_chance = 0.4  # Lower chance of open
        
        # Adjust by contest level
        if base_contest == ContestLevel.OPEN:
            return min(1.0, open_chance * 1.2 * player_skill)  # Boost if defense is giving space
        elif base_contest == ContestLevel.LIGHT:
            return min(1.0, open_chance * 0.8 * player_skill)
        else:  # HEAVY
            return min(1.0, open_chance * 0.4 * player_skill)
    
    def _calculate_make_if_open(
        self,
        archetype: "ShotArchetype",
        subtype: str,
        player: "Player",
        dribble_state: "DribbleState"
    ) -> float:
        """Base make % if shot is open."""
        from app.models.shot_archetypes import DribbleState
        
        base = self._get_base_percentage(archetype, subtype)
        fatigue_penalty = -0.01 * player.get_fatigue()
        hot_streak_bonus = self._get_hot_streak_bonus(player)
        dribble_modifier = self._get_dribble_modifier(dribble_state)
        
        return max(0.01, min(0.99, base + fatigue_penalty + hot_streak_bonus + dribble_modifier))
    
    def _calculate_make_if_contested(
        self,
        archetype: "ShotArchetype",
        subtype: str,
        contest_level: "ContestLevel",
        player: "Player"
    ) -> float:
        """Make % if shot is contested (always lower than open)."""
        from app.models.shot_archetypes import ContestLevel, DribbleState
        
        p_open = self._calculate_make_if_open(archetype, subtype, player, DribbleState.CATCH_AND_SHOOT)
        
        # Contest penalties
        if contest_level == ContestLevel.LIGHT:
            return p_open * 0.85  # 15% reduction
        elif contest_level == ContestLevel.HEAVY:
            return p_open * 0.70  # 30% reduction
        else:
            return p_open
    
    def _get_base_percentage(self, archetype: "ShotArchetype", subtype: str) -> float:
        """Get baseline percentage for archetype/subtype."""
        archetype_key = archetype.value.lower()
        base = self.BASELINE_PERCENTAGES.get(archetype_key, 0.35)
        
        # Subtype modifiers (subtle adjustments)
        subtype_modifiers = {
            "dunk": 0.05,  # Slightly higher than layup
            "floater": -0.03,  # Slightly lower than layup
            "hook": 0.02,
            "fade": -0.04,
            "off_dribble": -0.05,  # Harder than catch and shoot
            "heave": -0.13,  # Much lower
        }
        
        modifier = subtype_modifiers.get(subtype, 0.0)
        return max(0.01, min(0.99, base + modifier))
    
    def _get_hot_streak_bonus(self, player: "Player") -> float:
        """Get hot streak bonus/penalty."""
        streak = player.get_hot_streak()
        if streak > 0:
            return 0.03  # +3% when hot
        elif streak < 0:
            return -0.03  # -3% when cold
        return 0.0
    
    def _get_dribble_modifier(self, dribble_state: "DribbleState") -> float:
        """Get modifier based on dribble state."""
        from app.models.shot_archetypes import DribbleState
        
        if dribble_state == DribbleState.CATCH_AND_SHOOT:
            return 0.02  # Slightly easier
        else:
            return -0.02  # Slightly harder
    
    def determine_shot_result(
        self, 
        current_player: "Player", 
        shot_type: ShotType, 
        defense: "Defense"
    ) -> bool:
        """Determines if shot was made using randomization (legacy method)."""
        import random
        
        random_percentage = random.uniform(self.MINIMUM_PERCENTAGE, self.OPTIMAL_PERCENTAGE)
        
        if random_percentage > self.make_percentage or random_percentage <= defense.get_turnover_percentage():
            return False
        
        self._adjust_score(current_player, shot_type)
        return True
    
    def determine_shot_result_from_context(
        self,
        context: "ShotContext",
        player: "Player",
        defense_state: "DefenseState"
    ) -> bool:
        """Determines if shot was made using new probability model."""
        import random
        
        p_make = self.calculate_make_percentage(context, player, defense_state)
        random_value = random.random()
        
        made = random_value < p_make
        
        if made:
            # Adjust score based on archetype
            if context.archetype.value in ["rim", "paint", "midrange"]:
                player.two_pointer()
            else:
                player.three_pointer()
        
        return made
    
    def _adjust_score(self, current_player: "Player", shot_type: ShotType) -> None:
        """Adjusts player score based on shot type."""
        if shot_type in [ShotType.LAYUP, ShotType.MIDRANGE]:
            current_player.two_pointer()
        else:
            current_player.three_pointer()


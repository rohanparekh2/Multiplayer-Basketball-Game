import hashlib
import json
import time
from typing import Dict, Tuple, Optional
from dataclasses import dataclass, asdict
from app.models.game import Game
from app.models.shot_archetypes import ShotArchetype, ShotZone
from app.models.offense import Offense
from app.models.shot_context import ShotContext
from app.models.shot_archetypes import DribbleState, ContestLevel


@dataclass
class CoachAdvice:
    """Structured advice from the AI coach."""
    recommended_shot: Dict[str, str]  # {archetype, subtype, zone}
    advice_text: str
    reasoning: str
    expected_points: float
    challenge: Optional[str] = None


class CoachAIService:
    """LLM-powered coach that provides strategic advice."""
    
    COACH_SYSTEM_PROMPT = """You are a basketball coach analyzing a player's performance. 
Given shot history, defense state, and game situation, provide:
1. Recommended next shot (archetype, subtype, zone)
2. Brief explanation (1-2 sentences)
3. Reasoning that MUST explain:
   - Expected points (probability * points)
   - Why this shot is open/better than alternatives
   - Defense tendencies (e.g., "they're over-helping, corner is open 72%")
4. Optional challenge

IMPORTANT: Your reasoning must be consistent with the expected points calculation.
If you recommend a corner 3, explain why it has higher expected value than other options.

Return JSON: {"recommended_shot": {"archetype": "...", "subtype": "...", "zone": "..."}, "advice_text": "...", "reasoning": "...", "challenge": "..."}"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize coach service.
        If api_key is None, will use rule-based fallback (no LLM calls).
        """
        self.api_key = api_key
        self._cache: Dict[str, Tuple[CoachAdvice, float]] = {}  # hash -> (advice, timestamp)
        self._cache_ttl = 30.0  # seconds
        self._use_llm = api_key is not None
        
        if self._use_llm:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=api_key)
            except ImportError:
                print("Warning: OpenAI not installed. Coach will use rule-based fallback.")
                self._use_llm = False
    
    def _compute_state_hash(self, game_state: Dict) -> str:
        """Compute hash from meaningful game state changes."""
        # Extract only meaningful fields
        state_snapshot = {
            "last_10_shots": [
                {
                    "archetype": s.get("archetype"),
                    "made": s.get("made"),
                    "zone": s.get("zone"),
                }
                for s in game_state.get("shot_history", [])[-10:]
            ],
            "defense_scheme": game_state.get("defense_state", {}).get("contest_distribution", {}),
            "score": {
                "p1": game_state.get("player_one", {}).get("score", 0),
                "p2": game_state.get("player_two", {}).get("score", 0),
            },
            "turn_number": len(game_state.get("shot_history", [])),
        }
        
        state_json = json.dumps(state_snapshot, sort_keys=True)
        return hashlib.sha256(state_json.encode()).hexdigest()
    
    def _build_prompt(self, game_state: Dict) -> str:
        """Build prompt for LLM from game state."""
        shot_history = game_state.get("shot_history", [])[-10:]
        defense_state = game_state.get("defense_state", {})
        score = game_state.get("player_one", {}).get("score", 0), game_state.get("player_two", {}).get("score", 0)
        
        prompt = f"""Game Situation:
- Score: Player 1: {score[0]}, Player 2: {score[1]}
- Last 10 shots: {len(shot_history)} shots recorded
- Defense scheme: {defense_state.get('contest_distribution', {})}

Shot History (last 10):
"""
        for i, shot in enumerate(shot_history[-10:], 1):
            made = "Made" if shot.get("made") else "Missed"
            prompt += f"{i}. {shot.get('archetype', 'unknown')} from {shot.get('zone', 'unknown')} - {made}\n"
        
        prompt += "\nAnalyze the situation and recommend the best next shot with reasoning."
        
        return prompt
    
    def _calculate_expected_points(
        self,
        recommended_shot: Dict[str, str],
        game_state: Dict
    ) -> float:
        """Calculate expected points for recommended shot."""
        # This is a simplified calculation - in production, use the full Offense model
        archetype = recommended_shot.get("archetype", "midrange")
        zone = recommended_shot.get("zone", "wing")
        
        # Get baseline probabilities
        baseline = {
            "rim": 0.62,
            "paint": 0.48,
            "midrange": 0.42,
            "three": 0.36,
            "deep": 0.18,
        }
        
        probability = baseline.get(archetype, 0.35)
        points = 3 if archetype in ["three", "deep"] else 2
        
        # Adjust for defense (simplified)
        defense_state = game_state.get("defense_state", {})
        contest_dist = defense_state.get("contest_distribution", {})
        contest = contest_dist.get(zone, "light")
        
        if contest == "heavy":
            probability *= 0.70
        elif contest == "light":
            probability *= 0.85
        
        return probability * points
    
    def _get_rule_based_advice(self, game_state: Dict) -> CoachAdvice:
        """Fallback rule-based advice when LLM is not available."""
        shot_history = game_state.get("shot_history", [])
        defense_state = game_state.get("defense_state", {})
        contest_dist = defense_state.get("contest_distribution", {})
        
        # Find the most open zone
        open_zones = [zone for zone, contest in contest_dist.items() if contest == "open"]
        if not open_zones:
            open_zones = [zone for zone, contest in contest_dist.items() if contest == "light"]
        
        if open_zones:
            recommended_zone = open_zones[0]
            # Recommend three if corner/wing is open, rim if restricted is open
            if recommended_zone in ["corner", "wing"]:
                archetype = "three"
                subtype = "wing_catch"
                points = 3
            else:
                archetype = "rim"
                subtype = "layup"
                points = 2
        else:
            # Default recommendation
            archetype = "midrange"
            subtype = "catch_shoot"
            recommended_zone = "wing"
            points = 2
        
        probability = 0.42 if archetype == "midrange" else (0.36 if archetype == "three" else 0.62)
        expected_points = probability * points
        
        return CoachAdvice(
            recommended_shot={
                "archetype": archetype,
                "subtype": subtype,
                "zone": recommended_zone,
            },
            advice_text=f"Take a {archetype} shot from the {recommended_zone}.",
            reasoning=f"The {recommended_zone} zone appears to be the most open based on defense tendencies. Expected points: {expected_points:.2f}.",
            expected_points=expected_points,
        )
    
    def get_advice(self, game_state: Dict) -> CoachAdvice:
        """Get coach advice for current game state."""
        state_hash = self._compute_state_hash(game_state)
        current_time = time.time()
        
        # Check cache
        if state_hash in self._cache:
            cached_advice, cached_time = self._cache[state_hash]
            if current_time - cached_time < self._cache_ttl:
                return cached_advice
        
        # Cache miss or expired
        if self._use_llm:
            try:
                prompt = self._build_prompt(game_state)
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": self.COACH_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                )
                
                advice_dict = json.loads(response.choices[0].message.content)
                
                # Calculate expected_points
                expected_points = self._calculate_expected_points(
                    advice_dict.get("recommended_shot", {}),
                    game_state
                )
                
                advice = CoachAdvice(
                    recommended_shot=advice_dict.get("recommended_shot", {}),
                    advice_text=advice_dict.get("advice_text", ""),
                    reasoning=advice_dict.get("reasoning", ""),
                    expected_points=expected_points,
                    challenge=advice_dict.get("challenge"),
                )
            except Exception as e:
                print(f"Error calling LLM: {e}. Falling back to rule-based advice.")
                advice = self._get_rule_based_advice(game_state)
        else:
            # Use rule-based fallback
            advice = self._get_rule_based_advice(game_state)
        
        # Cache it
        self._cache[state_hash] = (advice, current_time)
        
        # Clean old cache entries
        self._clean_cache(current_time)
        
        return advice
    
    def _clean_cache(self, current_time: float) -> None:
        """Remove expired cache entries."""
        expired_keys = [
            key for key, (_, timestamp) in self._cache.items()
            if current_time - timestamp >= self._cache_ttl
        ]
        for key in expired_keys:
            del self._cache[key]


# Singleton instance (will be initialized with API key from env)
coach_ai_service: Optional[CoachAIService] = None


def get_coach_service() -> CoachAIService:
    """Get or create coach service instance."""
    global coach_ai_service
    if coach_ai_service is None:
        import os
        api_key = os.getenv("OPENAI_API_KEY")
        coach_ai_service = CoachAIService(api_key=api_key)
    return coach_ai_service


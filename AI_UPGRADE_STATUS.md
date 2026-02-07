# AI Upgrade Implementation Status

## ✅ What WAS Implemented (Backend)

### 1. Data Models (Complete)
- ✅ `ShotArchetype`, `ShotZone`, `ContestLevel`, `DribbleState` enums
- ✅ `ShotContext` dataclass (archetype, subtype, zone, contest, dribble state)
- ✅ `ShotRecord` for history tracking
- ✅ `DefenseState` with contest_distribution as primary lever
- ✅ Extended `Player` with `shot_history` and helper methods (`get_fatigue()`, `get_hot_streak()`, `get_shot_chart()`)
- ✅ Extended `Game` with `shot_history` and `defense_state`

### 2. Probability Algorithm (Implemented but NOT USED)
- ✅ `Offense.calculate_make_percentage()` - NEW method with separated "get good look" vs "make given look"
- ✅ Baseline percentages by archetype (RIM: 0.62, PAINT: 0.48, MIDRANGE: 0.42, THREE: 0.36, DEEP: 0.18)
- ✅ Modifiers for fatigue, hot streak, contest level, dribble state
- ❌ **NOT USED**: `game_service.py` still uses legacy `Offense.select_shot()` and `Offense.calculate_shot_percentage()`

### 3. Defense AI (Implemented but NOT VISIBLE)
- ✅ `DefenseAIService` - Rule-based defense coordinator
- ✅ Adapts based on shot tendencies (three-heavy → pressure perimeter, rim-heavy → collapse inside)
- ✅ Updates `defense_state.contest_distribution` after each shot
- ❌ **NOT VISIBLE**: No UI showing defense state or adaptive behavior

### 4. Coach AI (Implemented but MAYBE NOT VISIBLE)
- ✅ `CoachAIService` with LLM integration (OpenAI) + rule-based fallback
- ✅ Hash-based caching (only calls LLM when state meaningfully changes)
- ✅ API endpoint: `GET /api/game/{room_id}/coach-advice`
- ✅ Computes `expected_points` for recommended shots
- ⚠️ **VISIBILITY ISSUE**: CoachPanel positioned at `top-[420px]` - might be off-screen

### 5. Player Tracking (Implemented)
- ✅ Shot history tracking in `game_service._record_shot()`
- ✅ Fatigue, hot streak, shot chart computed from history (not stored)
- ❌ **NOT VISIBLE**: No UI showing shot history, fatigue, or hot streak

## ✅ What WAS Implemented (Frontend)

### 1. Types (Complete)
- ✅ `ShotArchetype`, `ShotZone`, `ContestLevel`, `DribbleState` enums added to `game.ts`

### 2. Shot Selection UI (Partially Implemented)
- ✅ `ShotMeter` component showing probability and expected points
- ✅ Updated `ShotSelection` with quick picks (4 buttons: Rim, Midrange, Three, Deep)
- ✅ Shows expected points for each shot
- ❌ **NOT FUNCTIONAL**: Still uses legacy `ShotType` enum, not new `ShotArchetype` system
- ❌ **NOT FUNCTIONAL**: Subtypes defined but not clickable (just a TODO)

### 3. Coach Panel (Implemented but MAYBE NOT VISIBLE)
- ✅ `CoachPanel` component created
- ✅ Fetches advice from `/api/game/{room_id}/coach-advice`
- ✅ Shows advice text, expected points, reasoning, recommended shot button
- ⚠️ **VISIBILITY ISSUE**: Positioned at `top-[420px]` in `GameUI.tsx` - might be off-screen or hidden
- ❌ **NOT FUNCTIONAL**: "Take recommended shot" button only logs to console, doesn't actually select shot

### 4. API Integration (Complete)
- ✅ `gameApi.getCoachAdvice()` method added

## ❌ What's MISSING or NOT WORKING

### 1. New Probability System Not Used
- The new `calculate_make_percentage()` exists but `game_service.select_power()` still uses:
  - `Offense.select_shot()` (legacy)
  - `Offense.calculate_shot_percentage()` (legacy)
  - `Offense.determine_shot_result()` (legacy)

### 2. Shot Selection Still Uses Legacy System
- Frontend still sends `ShotType` (LAYUP, MIDRANGE, THREE_POINTER, HALF_COURT)
- Backend still processes `ShotType`, not `ShotArchetype` + `subtype` + `zone`
- Subtypes are defined but not selectable

### 3. Coach Panel Visibility
- Positioned at `top-[420px]` which might be:
  - Off-screen on smaller viewports
  - Hidden behind other elements
  - Not visible due to z-index issues

### 4. No UI for New Features
- No shot history visualization
- No fatigue/hot streak indicators
- No defense state display
- No shot chart

### 5. Coach Panel Button Not Functional
- "Take recommended shot" button only logs to console
- Doesn't actually call `selectShot()` with the recommended shot

## 🔧 What Needs to Be Fixed

1. **Make CoachPanel Visible**: Fix positioning or move to a visible location
2. **Integrate New Probability System**: Update `game_service.select_power()` to use `calculate_make_percentage()` with `ShotContext`
3. **Make Subtypes Functional**: Allow users to select subtypes when clicking an archetype
4. **Fix Coach Panel Button**: Make "Take recommended shot" actually select the shot
5. **Add UI for New Features**: Show shot history, fatigue, hot streak, defense state


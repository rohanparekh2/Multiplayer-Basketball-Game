from enum import Enum


class ShotArchetype(str, Enum):
    """Enum representing shot archetypes."""
    RIM = "rim"
    PAINT = "paint"
    MIDRANGE = "midrange"
    THREE = "three"
    DEEP = "deep"


class ShotZone(str, Enum):
    """Enum representing court zones."""
    CORNER = "corner"
    WING = "wing"
    TOP = "top"
    PAINT = "paint"
    RESTRICTED = "restricted"


class ContestLevel(str, Enum):
    """Enum representing contest levels."""
    OPEN = "open"
    LIGHT = "light"
    HEAVY = "heavy"


class DribbleState(str, Enum):
    """Enum representing dribble state."""
    CATCH_AND_SHOOT = "catch_and_shoot"
    OFF_DRIBBLE = "off_dribble"


# Shot subtype mappings
SHOT_SUBTYPES = {
    ShotArchetype.RIM: ["layup", "dunk", "floater"],
    ShotArchetype.PAINT: ["hook", "short_jumper"],
    ShotArchetype.MIDRANGE: ["pullup", "catch_shoot", "fade"],
    ShotArchetype.THREE: [
        "corner_catch", "wing_catch", "top_catch",
        "corner_off_dribble", "wing_off_dribble", "top_off_dribble"
    ],
    ShotArchetype.DEEP: ["logo", "heave"],
}

# Default subtypes for each archetype
DEFAULT_SUBTYPES = {
    ShotArchetype.RIM: "layup",
    ShotArchetype.PAINT: "short_jumper",
    ShotArchetype.MIDRANGE: "catch_shoot",
    ShotArchetype.THREE: "wing_catch",
    ShotArchetype.DEEP: "logo",
}


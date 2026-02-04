from fastapi import APIRouter, HTTPException
from app.services.game_service import game_service
from app.websocket.game_handler import manager
from app.schemas.game import (
    GameCreate,
    GameStateResponse,
    ShotRequest,
    DefenseRequest,
    PowerRequest,
    PlayerSchema
)
from app.models.game import Game

router = APIRouter()


def game_to_response(game: Game) -> GameStateResponse:
    """Converts Game model to response schema."""
    return GameStateResponse(
        room_id=game.room_id,
        player_one=PlayerSchema(name=game.player_one.name, score=game.player_one.score),
        player_two=PlayerSchema(name=game.player_two.name, score=game.player_two.score),
        current_offensive_player=game.current_offensive_player.name,
        current_defensive_player=game.current_defensive_player.name,
        state=game.state,
        shot_type=game.shot_type,
        defense_type=game.defense_type,
        power=game.power,
        shot_result=game.shot_result,
        animation_finished=game.animation_finished,
        game_over=game.is_game_over(),
        winner=PlayerSchema(name=winner.name, score=winner.score) if (winner := game.get_winner()) else None
    )


@router.post("/create", response_model=GameStateResponse)
async def create_game(game_create: GameCreate):
    """Creates a new game."""
    room_id = game_service.create_game(
        game_create.player_one_name,
        game_create.player_two_name
    )
    game = game_service.get_game(room_id)
    if not game:
        raise HTTPException(status_code=500, detail="Failed to create game")
    return game_to_response(game)


@router.get("/{room_id}", response_model=GameStateResponse)
async def get_game_state(room_id: str):
    """Gets current game state."""
    game = game_service.get_game(room_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game_to_response(game)


@router.post("/{room_id}/shot")
async def select_shot(room_id: str, shot_request: ShotRequest):
    """Selects a shot type."""
    success = game_service.select_shot(room_id, shot_request.shot_type)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid shot selection")
    game = game_service.get_game(room_id)
    game_state = game_to_response(game)
    # Broadcast update via WebSocket
    await manager.broadcast_to_room(room_id, {
        "type": "game_state",
        "data": game_state.model_dump()
    })
    return {"message": "Shot selected", "game_state": game_state}


@router.post("/{room_id}/defense")
async def select_defense(room_id: str, defense_request: DefenseRequest):
    """Selects a defense type."""
    success = game_service.select_defense(room_id, defense_request.defense_type)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid defense selection")
    game = game_service.get_game(room_id)
    game_state = game_to_response(game)
    # Broadcast update via WebSocket
    await manager.broadcast_to_room(room_id, {
        "type": "game_state",
        "data": game_state.model_dump()
    })
    return {"message": "Defense selected", "game_state": game_state}


@router.post("/{room_id}/power")
async def select_power(room_id: str, power_request: PowerRequest):
    """Selects power and calculates shot result."""
    success = game_service.select_power(room_id, power_request.power)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid power selection")
    game = game_service.get_game(room_id)
    game_state = game_to_response(game)
    # Broadcast update via WebSocket
    await manager.broadcast_to_room(room_id, {
        "type": "game_state",
        "data": game_state.model_dump()
    })
    return {"message": "Power selected, shot calculated", "game_state": game_state}


@router.post("/{room_id}/animation-finished")
async def finish_animation(room_id: str):
    """Marks animation as finished."""
    success = game_service.finish_animation(room_id)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid state")
    game = game_service.get_game(room_id)
    game_state = game_to_response(game)
    # Broadcast update via WebSocket
    await manager.broadcast_to_room(room_id, {
        "type": "game_state",
        "data": game_state.model_dump()
    })
    return {"message": "Animation finished", "game_state": game_state}


@router.post("/{room_id}/next-turn")
async def next_turn(room_id: str):
    """Moves to next turn."""
    success = game_service.next_turn(room_id)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid state")
    game = game_service.get_game(room_id)
    game_state = game_to_response(game)
    # Broadcast update via WebSocket
    await manager.broadcast_to_room(room_id, {
        "type": "game_state",
        "data": game_state.model_dump()
    })
    return {"message": "Next turn", "game_state": game_state}


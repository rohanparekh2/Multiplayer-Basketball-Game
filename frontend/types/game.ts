export enum ShotType {
  DEFAULT = 'default',
  LAYUP = 'layup',
  MIDRANGE = 'midrange',
  THREE_POINTER = 'three_pointer',
  HALF_COURT = 'half_court',
}

export enum ShotArchetype {
  RIM = 'rim',
  PAINT = 'paint',
  MIDRANGE = 'midrange',
  THREE = 'three',
  DEEP = 'deep',
}

export enum ShotZone {
  CORNER = 'corner',
  WING = 'wing',
  TOP = 'top',
  PAINT = 'paint',
  RESTRICTED = 'restricted',
}

export enum ContestLevel {
  OPEN = 'open',
  LIGHT = 'light',
  HEAVY = 'heavy',
}

export enum DribbleState {
  CATCH_AND_SHOOT = 'catch_and_shoot',
  OFF_DRIBBLE = 'off_dribble',
}

export enum DefenseType {
  DEFAULT = 'default',
  BLOCK = 'block',
  STEAL = 'steal',
  CONTEST = 'contest',
}

export enum GameState {
  WAITING_FOR_SHOT = 'waiting_for_shot',
  WAITING_FOR_DEFENSE = 'waiting_for_defense',
  WAITING_FOR_POWER = 'waiting_for_power',
  ANIMATING = 'animating',
  SHOT_RESULT = 'shot_result',
  GAME_OVER = 'game_over',
}

export interface Player {
  name: string
  score: number
}

export interface ShotRecord {
  archetype: string
  subtype: string
  zone: string
  contest_level: string
  made: boolean
  points: number
  turn_number: number
}

export interface DefenseState {
  contest_distribution: Record<string, string>
  help_frequency: number
  foul_rate: number
}

export interface GameStateResponse {
  room_id: string
  player_one: Player
  player_two: Player
  current_offensive_player: string
  current_defensive_player: string
  state: string
  shot_type: ShotType | null
  defense_type: DefenseType | null
  power: number | null
  shot_result: boolean | null
  animation_finished: boolean
  game_over: boolean
  winner: Player | null
  shot_history?: ShotRecord[]
  defense_state?: DefenseState | null
}


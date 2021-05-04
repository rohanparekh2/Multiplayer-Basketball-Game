#pragma once

#include "offense.h"
#include "player.h"
#include <string>
namespace basketball {

class GameLoop {
public:
  /**
   * Creates new Game Display Object
   */
  GameLoop();

  /**
   * Creates new Game Display Object that takes in players
   * @param player_one The first player that gets to take a shot
   * @param player_two The second player that gets to take a shot
   */
  GameLoop(Player &player_one, Player &player_two);

  /**
   * Draws the text and power meter on the screen
   */
  void Draw();

  /**
   * When the game is over, this checks who has won the game
   * @param player_one The first player
   * @param player_two The second player
   * @return Player with the highest score
   */
  Player DetermineWinner(Player &player_one, Player &player_two) const;

  /**
   * Checks to see if the player has taken a shot yet
   */
  void CheckShotSelection();

  /**
   * Checks to see if the player has chosen a power yet
   */
  void CreatePowerMeter();

  /**
   * Calculates power based on the position of the meter
   * @return The power of the current shot
   */
  size_t CalculatePower() const;

  /**
   * Determines the shot taken based on the key that is pushed
   * @param shot_type Type of shit taken by player
   */
  void ChooseShotType(Offense::ShotType shot_type);

  /**
   * Chooses the power based on keys and finds the shot result
   */
  void CheckShotResult();

  /**
   * Changes boolean that checks if it is the next player's turn
   * @param next Boolean that checks whose turn it is
   */
  void SetNextPlayer(bool next);

  /**
 * Changes bar height of the power b ar
 * @param currentBarHeight height of the power bar
 */
  void SetCurrentBarHeight(size_t currentBarHeight);

  void ChangeBallPosition(ci::Rectf current_position, bool shot_result);

  Offense::ShotType GetShot() const;

  size_t GetPower() const;
private:
  Player player_one_;
  Player player_two_;
  Offense::ShotType shot_;
  Offense offense_;
  size_t power_;
  size_t kStartingWidth = 500;
  size_t kEndingWidth = 550;
  size_t kStartingHeight = 400;
  size_t kEndingHeight = 200;
  size_t current_bar_height_;
  int change_in_power_;
  bool result_;
  bool next_player_;
  ci::Rectf current_position_;
  bool animation_finished_;
  ci::Color kTextColor = "white";
  ci::Color kButtonColor = "blue";
};

} // namespace basketball
#pragma once

#include <string>
#include "player.h"
#include "offense.h"
namespace basketball {

class GameDisplay {
public:
 GameDisplay();

 GameDisplay(Player& player_one, Player& player_two);

 void Update();

  Player DetermineWinner(Player& player_one, Player& player_two) const;

  void CheckShotSelection();

  void CreatePowerMeter();

  size_t CalculatePower() const;

  Offense::ShotType GetShot() const;

  void SetShot(Offense::ShotType s);
private:
  Player player_one_;
  Player player_two_;
  Offense::ShotType shot_;
  Offense offense_;
  size_t power_;
  size_t kStartingWidth = 400;
  size_t kEndingWidth = 425;
  size_t kStartingHeight = 400;
  size_t kEndingHeight = 500;
  size_t current_bar_height_;

};

} // namespace basketball

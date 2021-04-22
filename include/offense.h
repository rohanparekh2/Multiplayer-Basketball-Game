#pragma once

#include "cinder/gl/gl.h"
#include "player.h"
#include <string>

namespace basketball {

class Offense {
public:
  /**
   * Creates an Offense Object.
   */
  Offense();

  /**
   * Selects shot and calculates initial percentage
   * @param user_input Input decided by user through keys
   */
  void SelectShot(std::string &user_input);
  /**
   * Calculates Probability of a Certain Shot Being Made when power is taken
   * into account
   * @param power Power of the shot determined by the power meter
   */
  void CalculateShotPercentage(double power);
  /**
   * Uses randomization to check if the player made the shot or not
   * @param current_player The player taking the shot
   *  @param user_input Type of shot being taken
   *  @return bool that represents if the shot was made or not
   */
  bool DetermineShotResult(Player &current_player,
                           std::string &user_input) const;
  /**
   * Gets the percentage that a shot is made
   *  @return double that represents the chance that the shot is made
   */
  double GetMakePercentage() const;

private:
  double make_percentage_;
  size_t kMinPower = 10;
  size_t kMaxPower = 90;
  size_t kPowerBonus = 10;
  size_t kOptimalPercentage = 100;
  size_t kMinimumPercentage = 0;
};

} // namespace basketball

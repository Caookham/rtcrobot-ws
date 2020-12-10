#ifndef RTCROBOT_CONTROLLER_H
#define RTCROBOT_CONTROLLER_H

#include <ros/ros.h>
#include <tf/transform_listener.h>
#include <geometry_msgs/Twist.h>
#include <nav_msgs/Path.h>

class BaseController
{
public:
  explicit BaseController(ros::NodeHandle& nh);

  /**
   * @brief Implements something loosely based on "A Smooth Control Law for
   * Graceful Motion of Differential Wheeled Mobile Robots in 2D Environments"
   * by Park and Kuipers, ICRA 2011
   * @returns true if base has reached goal.
   */
  bool approach(const geometry_msgs::PoseStamped& target);

  bool backup(float distance, bool turn);

  bool goStraight(double linearvelocity);


  /**
   * @brief Get the last command sent
   */
  bool getCommand(geometry_msgs::Twist& command);

  /** @brief send stop command to robot base */
  void stop();

  /** @brief send reset command to robot base */
  void reset();

private:
  ros::Publisher cmd_vel_pub_;  // Publisher of commands

  tf::TransformListener listener_;
  geometry_msgs::Twist command_;

  /*
   * Parameters for approach controller
   */
  double k1_;  // ratio in change of theta to rate of change in r
  double k2_;  // speed at which we converge to slow system
  double min_velocity_;
  double max_velocity_;
  double max_angular_velocity_;
  double beta_;  // how fast velocity drops as k increases
  double lambda_;  // ??
  double dist_;  // used to create the tracking line

  /*
   * Parameters for backup controller
   */
  geometry_msgs::PoseStamped start_;
  bool ready_;
  bool turning_;
};

#endif  // FETCH_AUTO_DOCK_CONTROLLER_H

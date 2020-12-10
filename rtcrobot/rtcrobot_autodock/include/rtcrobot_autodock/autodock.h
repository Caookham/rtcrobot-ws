#ifndef RTCROBOT_AUTO_DOCK_H
#define RTCROBOT_AUTO_DOCK_H

// Custom Includes.
#include <rtcrobot_autodock/controller.h>
#include <rtcrobot_autodock/perception.h>
#include <rtcrobot_services/DockingState.h>
#include <rtcrobot_msgs/RobotState.h>

// ROS Includes.
#include <ros/ros.h>
#include <actionlib/server/simple_action_server.h>
#include <actionlib/client/simple_action_client.h>
#include <tf/transform_broadcaster.h>
#include <tf/transform_listener.h>
#include <sensor_msgs/BatteryState.h>

// RTCRobot Includes.
#include <rtcrobot_msgs/DockState.h> 
#include <rtcrobot_actions/DockAction.h>
#include <rtcrobot_actions/UnDockAction.h>
#include <rtcrobot_services/DockPose.h>

class AutoDocking
{
  //typedef actionlib::SimpleActionClient<fetch_driver_msgs::DisableChargingAction> charge_lockout_client_t;
  typedef actionlib::SimpleActionServer<rtcrobot_actions::DockAction> dock_server_t;
  typedef actionlib::SimpleActionServer<rtcrobot_actions::UnDockAction> undock_server_t;

public:
  /**
   * @brief Autodocking constructor. Object builds action servers for docking and undocking.
   */
  AutoDocking();

  ~AutoDocking();

  void spin(void);

private:
  void batteryCallback(const sensor_msgs::BatteryState::ConstPtr& battery);
  void stateCallback(const rtcrobot_msgs::RobotState::ConstPtr& state);
  /**
   * @brief Method to update the robot charge state.
   * @param state Robot state message to extract charge state from.
   */
  //bool stateCallback(rtcrobot_services::DockingState::Request &req, rtcrobot_services::DockingState::Response &res);

  /**
   * @brief Method to execute the docking behavior.
   * @param goal Initial pose estimate of the dock.
   */
  void dockCallback(const rtcrobot_actions::DockGoalConstPtr& goal);
  void undockCallback(const rtcrobot_actions::UnDockGoalConstPtr& goal);
  /**
   * @brief Method that checks success or failure of docking.
   * @param result Dock result message used to set the dock action server state.
   * @return True if we have neither succeeded nor failed to dock.
   */
  bool continueDocking(rtcrobot_actions::DockResult& result);
  bool isPose(rtcrobot_actions::DockResult& result);

  /**
   * @brief Method to see if the robot seems to be docked but not charging.
   *        If the robot does seem to be docked and not charging, try will 
   *        timeout and set abort condition. 
   */
  void checkDockChargingConditions();

  /**
   * @brief Method to execute the undocking behavior.
   * @param goal Docking control action for rotating off of the goal.
   */
  //void undockCallback(const fetch_auto_dock_msgs::UndockGoalConstPtr& goal);

  /**
   * @brief Method sets the docking deadline and number of retries.
   */
  void initDockTimeout();

  /**
   * @brief Method checks to see if we have run out of time or retries.
   * @return True if we are out of time or tries.
   */
  bool isDockingTimedOut();

  /**
   * @brief Method to back the robot up under the abort conditon.
   *        Once complete, the method resets the abort flag.
   *        Robot will backup slightly, straighten out, backup a good distance,
   *        and then reorient. Method is blocking.
   * @param r Rate object to control execution loop.
   */
  void executeBackupSequence(ros::Rate& r);

  /**
   * @brief Method to compute the distance the robot should backup when attemping a docking
   *        correction. Method uses a number of state variables in the class to compute
   *        distance. TODO(enhancement): Should these be parameterized instead? 
   * @return Distance for robot to backup in meters.
   */
  double backupDistance();

  /**
   * @brief Method to check approach abort conditions. If we are close to the dock
   *        but the robot is too far off side-to-side or at a bad angle, it should
   *        abort. Method also returns through the parameter the orientation of the
   *        dock wrt the robot for use in correction behaviors.
   * @param dock_yaw Yaw angle of the dock wrt the robot in radians.
   * @return True if the robot should abort the approach.
   */
  bool isApproachBad(double & dock_yaw);

  /**
   * @brief Method to disable the charger for a finite amount of time.
   * @param seconds Number of seconds to disable the charger for. Maximum 
   *                number of seconds is 255. Zero seconds enables the charger.
   * @return True if the number of seconds is valid and the lockout request was 
   *         successful.
   */
  bool lockoutCharger(unsigned seconds);

  bool getdockCallback(rtcrobot_services::DockPose::Request  &req,
         rtcrobot_services::DockPose::Response &res);

  

  // Configuration Constants.
  int NUM_OF_RETRIES_;                        // Number of times the robot gets to attempt
                                              // docking before failing.
  double DOCK_CONNECTOR_CLEARANCE_DISTANCE_;  // The amount to back off in order to clear the
                                              // dock connector.
  double DOCKED_DISTANCE_THRESHOLD_;          // Threshold distance that indicates that the
                                              // robot might be docked.
  double DOCKED_ERRORS_XY_;
  double DOCKED_ERRORS_ANGLE_;
  // Nodes and servers.
  ros::NodeHandle nh_;
  dock_server_t dock_;                        // Action server to manage docking.
  undock_server_t undock_;                    // Action server to manage undocking.
  //charge_lockout_client_t charge_lockout_;    // Action client to request charger lockouts.

  ros::ServiceServer srv_detect_;

  // Helper objects.
  BaseController controller_;  // Drives the robot during docking and undocking phases.
  DockPerception perception_;  // Used to detect dock pose.

  // Subscribe to robot_state, determine if charging
  ros::Subscriber state_;
  ros::Subscriber battery_;
  ros::Publisher dock_pub_;
  tf::TransformBroadcaster odom_broadcaster;
  bool  charging_;
  int   dock_type_;
  float distance_;

  // Failure detection
  double abort_distance_;    // Distance below which to check abort criteria.
  double abort_threshold_;   // Y-offset that triggers abort.
  double abort_angle_;       // Angle offset that triggers abort.
  double correction_angle_;  // Yaw correction angle the robot should use to line up with the dock.
  double backup_limit_;      // Maximum distance the robot will backup when trying to retry.
                             // Based on range of initial dock pose estimate.
  bool   aborting_;          // If the robot realizes it won't be sucessful, it needs to abort.
  int    num_of_retries_;    // The number of times the robot gets to abort before failing.
                             // This variable will count down.
  double docked_distance_;
  bool cancel_docking_;      // Signal that docking has failed and the action server should abort the goal.
  bool gostraight_;
  ros::Time deadline_docking_;       // Time when the docking times out.
  ros::Time deadline_not_charging_;  // Time when robot gives up on the charge state and retries docking.
  bool charging_timeout_set_;        // Flag to indicate if the deadline_not_charging has been set.

  rtcrobot_msgs::DockState rb_state_;

  ros::Publisher debug_pose_;
  ros::Publisher robot_state_;
  geometry_msgs::PoseStamped pose_front_dock_, sv_pose_;
  bool sv_getpose;
};

#endif  // RTCROBOT_AUTO_DOCK_H

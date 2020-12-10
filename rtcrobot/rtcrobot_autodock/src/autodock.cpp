#include <rtcrobot_autodock/autodock.h>

// STL Includes.
#include <math.h>
#include <algorithm>

// ROS Includes.
#include <angles/angles.h>

AutoDocking::AutoDocking() :
  dock_(nh_, "dock", boost::bind(&AutoDocking::dockCallback, this, _1), false),
  undock_(nh_, "undock", boost::bind(&AutoDocking::undockCallback, this, _1), false),
  //charge_lockout_("charge_lockout", true),
  controller_(nh_),
  perception_(nh_),
  //aborting_(false),
  //num_of_retries_(NUM_OF_RETRIES_)
  docked_distance_(0.65),
  backup_limit_(0.5),
  cancel_docking_(true),
  charging_(false),
  dock_type_(0),
  distance_(0.65),
  gostraight_(false),
  rb_state_(rtcrobot_msgs::DockState())
  //charging_timeout_set_(false)
{
  // Load ros parameters
  ros::NodeHandle pnh("~");
  pnh.param("abort_distance",                    abort_distance_,                    0.40);
  pnh.param("abort_threshold",                   abort_threshold_,                   0.025);
  pnh.param("abort_angle",                       abort_angle_,                       5.0*(M_PI/180.0)),
  pnh.param("num_of_retries",                    NUM_OF_RETRIES_,                    5);
  pnh.param("dock_connector_clearance_distance", DOCK_CONNECTOR_CLEARANCE_DISTANCE_, 0.2);
  pnh.param("docked_distance_threshold",         DOCKED_DISTANCE_THRESHOLD_,         1.2);
  pnh.param("docked_errors_xy",                  DOCKED_ERRORS_XY_,                  0.01);
  pnh.param("docked_errors_angle",               DOCKED_ERRORS_ANGLE_,               0.2*(M_PI/180.0));

  // Subscribe to robot state
  state_ = nh_.subscribe<rtcrobot_msgs::RobotState>("rtcrobot/state",
                                                         1,
                                                         boost::bind(&AutoDocking::stateCallback, this, _1));
  battery_ = nh_.subscribe<sensor_msgs::BatteryState>("rtcrobot/battery",
                                                         1,
                                                         boost::bind(&AutoDocking::batteryCallback, this, _1));
  dock_pub_ = nh_.advertise<rtcrobot_msgs::DockState>("rtcrobot/dockstate", 50, true);
  //Service
  srv_detect_ = nh_.advertiseService("get_dock", &AutoDocking::getdockCallback,this);

  // Start action server thread
  dock_.start();
  
  undock_.start();
}

AutoDocking::~AutoDocking()
{
}

bool AutoDocking::getdockCallback(rtcrobot_services::DockPose::Request  &req,
         rtcrobot_services::DockPose::Response &res)
{
  ROS_INFO("dock pose services call");
  ros::Publisher detect_pose = nh_.advertise<geometry_msgs::PoseStamped>("dockdetect_pose", 10,true);;
  DockPerception perception(nh_);
  tf::TransformListener listener;
  // Object for controlling loop rate.
  ros::Rate r(10.0);
  perception.stop();
  // Start perception
  perception.start();


  // Get initial dock pose.
  geometry_msgs::PoseStamped pose_front_dock = geometry_msgs::PoseStamped();
  ros::Time sv_time = ros::Time::now(); 
  
  while (!perception.getPose(pose_front_dock, "map") && ros::Time::now() < sv_time + ros::Duration(2.0))
  {
    // Wait for perception to get its first pose estimate.
    //if (!continueDocking(result))
    //{
      //ROS_INFO("Docking failed: Initial dock not found.");
      //break;
    //}
    ros::spinOnce();
    r.sleep();
  }
  if(ros::Time::now() < sv_time + ros::Duration(2.0))
  {
    ROS_INFO("DOCK FOUND");
    double dock_yaw = angles::normalize_angle(tf::getYaw(pose_front_dock.pose.orientation));
    res.x = pose_front_dock.pose.position.x;
    res.y = pose_front_dock.pose.position.y;
    res.theta = dock_yaw;
    
    detect_pose.publish(pose_front_dock);
  }
  perception.stop();
  return true;
}


void AutoDocking::batteryCallback(const sensor_msgs::BatteryState::ConstPtr& battery)
{
  charging_ = (battery->current > 0.0);
}

void AutoDocking::stateCallback(const rtcrobot_msgs::RobotState::ConstPtr& state)
{
  charging_ = (state->code == state->CHARGING);
}


void AutoDocking::dockCallback(const rtcrobot_actions::DockGoalConstPtr& goal)
{
  rtcrobot_actions::DockFeedback feedback;
  rtcrobot_actions::DockResult result;
  gostraight_ = true;

  dock_type_ = goal-> dock_type;

  ROS_INFO("type: %d",dock_type_);
  // Reset flags.
  result.docked = false;
  aborting_ = false;
  charging_timeout_set_ = false;
  cancel_docking_ = false;

  // Object for controlling loop rate.
  ros::Rate r(10.0);
  perception_.stop();
  // Start perception
  perception_.start();

  // For timeout calculation
  initDockTimeout();

  // Get initial dock pose.
  pose_front_dock_ = geometry_msgs::PoseStamped();
  while (!perception_.getPose(pose_front_dock_, "base_footprint"))
  {
    
    // Wait for perception to get its first pose estimate.
    //if (!continueDocking(result))
    //{
      //ROS_INFO("Docking failed: Initial dock not found.");
      //break;
    //}
    r.sleep();
  }

  //Publish dock state
  rb_state_.status = rb_state_.DOCKING;

  //pose_front_dock_ = dock_pose_base_link;
  debug_pose_ = nh_.advertise<geometry_msgs::PoseStamped>("dock_pose", 10);
  double dock_yaw = angles::normalize_angle(tf::getYaw(pose_front_dock_.pose.orientation));
  pose_front_dock_.pose.position.x -= docked_distance_*cos(dock_yaw);
  pose_front_dock_.pose.position.y -= docked_distance_*sin(dock_yaw);
  feedback.dock_pose = pose_front_dock_;
  debug_pose_.publish(pose_front_dock_);
  dock_.publishFeedback(feedback);
  r.sleep();  // Sleep the rate control object.

  //Backup
  /*ros::Time deadline_backup = ros::Time::now() + ros::Duration(5.0); 
  while((!controller_.backup(pose_front_dock_, backup_limit_) && 
          ros::Time::now() < deadline_backup) &&
          ros::ok())
  {
    perception_.getPose(pose_front_dock_, "base_footprint");
    double dock_yaw = angles::normalize_angle(tf::getYaw(pose_front_dock_.pose.orientation));
    pose_front_dock_.pose.position.x -= docked_distance_*cos(dock_yaw);
    pose_front_dock_.pose.position.y -= docked_distance_*sin(dock_yaw);
    feedback.dock_pose = pose_front_dock_;
    dock_.publishFeedback(feedback);
    debug_pose_.publish(pose_front_dock_);
    r.sleep();  // Sleep the rate control object.
  }*/

  // Preorient the robot.
  ROS_INFO("Yaw: %f",dock_yaw);
  if (!std::isfinite(dock_yaw))
  {
    ROS_ERROR_STREAM_NAMED("auto_dock", "Dock yaw is invalid.");
    cancel_docking_ = true;
  }
  else if (ros::ok() && continueDocking(result) && !isPose(result))
  {
    controller_.reset();
    // Preorient the robot towards the dock.
    while (
           !controller_.approach(pose_front_dock_) && 
           continueDocking(result)             &&
           !isPose(result)          &&
           ros::ok()
           )
    {
      perception_.getPose(pose_front_dock_, "base_footprint");
      double dock_yaw = angles::normalize_angle(tf::getYaw(pose_front_dock_.pose.orientation));
      pose_front_dock_.pose.position.x -= docked_distance_*cos(dock_yaw);
      pose_front_dock_.pose.position.y -= docked_distance_*sin(dock_yaw);
      feedback.dock_pose = pose_front_dock_;
      dock_.publishFeedback(feedback);
      debug_pose_.publish(pose_front_dock_);
      //Publish dock state
      rb_state_.status = rb_state_.DOCKING;
      r.sleep();  // Sleep the rate control object.
    }
  }

  ROS_INFO("GO STRAIGHT");
  
  if(gostraight_)
  {
    switch(dock_type_)
    {
      case 0: //NORMAL
      {
        //Publish dock state
        rb_state_.status = rb_state_.DOCKED;
        break;
      }
      case 1: //CHARGER
      {
        while(continueDocking(result) &&
            ros::ok())
        {
          controller_.goStraight(0.01);
          //Publish dock state
          rb_state_.status = rb_state_.DOCKING;
          r.sleep();  // Sleep the rate control object.
          ROS_INFO("RUNNING");
        }
        //Publish dock state
        rb_state_.status = rb_state_.DOCKED;
      }
      default:
      {
      }
    }
  }

  
  ROS_INFO("FINISHED");
  dock_.setSucceeded(result);
  
  // Make sure we stop things before we are done.
  controller_.stop();
  perception_.stop();
}

void AutoDocking::undockCallback(const rtcrobot_actions::UnDockGoalConstPtr& goal)
{
  rtcrobot_actions::UnDockFeedback feedback;
  rtcrobot_actions::UnDockResult result;
  result.undocked = false;

  ros::Time deadline_backup = ros::Time::now() + ros::Duration(5.0); 

  // Object for controlling loop rate.
  ros::Rate r(10.0);
  while(!controller_.backup(0.5, false))
  {
    //Publish dock state
    rb_state_.status = rb_state_.UNDOCKING;
    r.sleep();
    ROS_INFO("Backing up");
  }
  //Publish dock state
  rb_state_.status = rb_state_.UNDOCK;
  ROS_INFO("Finished");
  undock_.setSucceeded(result);
}

bool AutoDocking::isPose(rtcrobot_actions::DockResult& result)
{
  // Grab the dock pose in the base_link so we can evaluate it wrt the robot.
  double dock_yaw = angles::normalize_angle(tf::getYaw(pose_front_dock_.pose.orientation));
  //ROS_INFO("x: %f, y: %f, yaw: %f", pose_front_dock_.pose.position.x, pose_front_dock_.pose.position.y, dock_yaw);
  if(abs(pose_front_dock_.pose.position.x) <= DOCKED_ERRORS_XY_ && abs(pose_front_dock_.pose.position.y) <= DOCKED_ERRORS_XY_ && abs(dock_yaw)<=DOCKED_ERRORS_ANGLE_)
  {
    result.docked = true;
    //dock_.setSucceeded(result);
    ROS_INFO("Docked");
    return true;
  }
  return false;
}

/**
 * @brief Method that checks success or failure of docking.
 * @param result Dock result message used to set the dock action server state.
 * @return True if we have neither succeeded nor failed to dock.
 */
bool AutoDocking::continueDocking(rtcrobot_actions::DockResult& result)
{
  double dock_yaw = angles::normalize_angle(tf::getYaw(pose_front_dock_.pose.orientation));
  //ROS_INFO("x: %f, y: %f, yaw: %f", pose_front_dock_.pose.position.x, pose_front_dock_.pose.position.y, dock_yaw);
  // If charging, stop and return success.
  if(charging_)
  {
    result.docked = true;
    dock_.setSucceeded(result);
    ROS_INFO("CHARGING");
    return false;
  }

  else if(abs(pose_front_dock_.pose.position.x) > 2.2 || abs(pose_front_dock_.pose.position.y) > 2.6 || abs(dock_yaw) > 1.0)
  {
    result.docked = false;
    gostraight_ = false;
    rb_state_.status = rb_state_.UNDOCK;
    dock_pub_.publish(rb_state_);
    dock_.setAborted(result);
    ROS_WARN("Docking failed: lost pose dock");
    return false;
  }

  // Timeout on time or retries.
  else if (isDockingTimedOut() || cancel_docking_)
  {
    dock_.setAborted(result);
    gostraight_ = false;
    rb_state_.status = rb_state_.UNDOCK;
    dock_pub_.publish(rb_state_);
    ROS_WARN("Docking failed: timed out");
    return false;
  }
  // Something is stopping us.
  else if (dock_.isPreemptRequested())
  {
    dock_.setPreempted(result);
    gostraight_ = false;
    ROS_WARN("Docking failure: preempted");
    return false;
  }

  return true;
}

/**
 * @brief Method sets the docking deadline and number of retries.
 */
void AutoDocking::initDockTimeout()
{
  deadline_docking_ = ros::Time::now() + ros::Duration(60.0);
  num_of_retries_ = NUM_OF_RETRIES_;
}

/**
 * @brief Method checks to see if we have run out of time or retries.
 * @return True if we are out of time or tries.
 */
bool AutoDocking::isDockingTimedOut()
{
  // Have we exceeded our deadline or tries?
  if (ros::Time::now() > deadline_docking_ || !num_of_retries_)
  {
    ROS_INFO("TIMEOUT");
    return true;
  }
  return false;
}

/**
 * @brief Method to check approach abort conditions. If we are close to the dock
 *        but the robot is too far off side-to-side or at a bad angle, it should
 *        abort. Method also returns through the parameter the orientation of the
 *        dock wrt the robot for use in correction behaviors.
 * @param dock_yaw Yaw angle of the dock wrt the robot in radians.
 * @return True if the robot should abort the approach.
 */
bool AutoDocking::isApproachBad(double & dock_yaw)
{
  // Grab the dock pose in the base_link so we can evaluate it wrt the robot.
  geometry_msgs::PoseStamped dock_pose_base_link;
  perception_.getPose(dock_pose_base_link, "base_link");

  dock_yaw = angles::normalize_angle(tf::getYaw(dock_pose_base_link.pose.orientation));

  // If we are close to the dock but not quite docked, check other approach parameters.
  if (dock_pose_base_link.pose.position.x < abort_distance_ &&
      dock_pose_base_link.pose.position.x > DOCKED_DISTANCE_THRESHOLD_
      )
  {
    // Check to see if we are too far side-to-side or at a bad angle.
    if (fabs(dock_pose_base_link.pose.position.y)              > abort_threshold_ ||
        fabs(dock_yaw)                                         > abort_angle_
       )
    {
      // Things are bad, abort.
      return true;
    }
    return true;
  }
  // Everything is ok.
  return false;
}

void AutoDocking::spin()
{
  ros::Rate r(10.0);
  while(ros::ok())
  {
    //if(sv_getpose)
    //{
    //  sv_pose_
    //  getdock()
    //}
    dock_pub_.publish(rb_state_);
    r.sleep();
    ros::spinOnce();
  }
}

int main(int argc, char** argv)
{
  ros::init(argc, argv, "auto_dock");
  AutoDocking auto_dock;
  auto_dock.spin();
  ros::spin();
  return 0;
}

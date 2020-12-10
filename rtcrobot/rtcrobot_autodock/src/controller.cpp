#include <rtcrobot_autodock/controller.h>

#include <angles/angles.h>

#include <tf/transform_listener.h>

#include <algorithm>
#include <list>
#include <vector>
#include <cmath>

BaseController::BaseController(ros::NodeHandle& nh)
{
  // Create publishers
  cmd_vel_pub_ = nh.advertise<geometry_msgs::Twist>("cmd_vel", 10);

  // TODO(enhancement): these should be loaded from ROS params
  k1_ = 2;
  k2_ = 0.5;
  min_velocity_ = 0.01;
  max_velocity_ = 0.1;
  max_angular_velocity_ = 0.1;
  beta_ = 0.1;
  lambda_ = 0.1;
  turning_ = false;
}

bool BaseController::approach(const geometry_msgs::PoseStamped& target)
{
  // Transform pose by -dist_ in the X direction of the dock
  geometry_msgs::PoseStamped pose = target;
  {
    float euclidean_distance = sqrt(pow(pose.pose.position.x, 2) + pow(pose.pose.position.y, 2));
    float steering_angle = atan2(pose.pose.position.y, pose.pose.position.x);

    float angular_vel = 0.2 * steering_angle;
    float linear_vel = 0.15 * euclidean_distance;
    if(!turning_){
      if(angular_vel > max_angular_velocity_) angular_vel = max_angular_velocity_;
      if(angular_vel < -max_angular_velocity_) angular_vel = -max_angular_velocity_;
      if(linear_vel > max_velocity_) linear_vel = max_velocity_;
      if(linear_vel < min_velocity_) linear_vel = min_velocity_;
      if(abs(pose.pose.position.y) < 0.002) 
      {
        double dock_yaw = angles::normalize_angle(tf::getYaw(pose.pose.orientation));
        if(dock_yaw > 0.0005)
        {
          angular_vel = max_angular_velocity_;
        }
        else if(dock_yaw < -0.0005)
        {
          angular_vel = -max_angular_velocity_;
        }
      else
      {
        angular_vel = 0.0;
      }
      }

      if(pose.pose.position.x < 0.005) 
      {
        linear_vel =0.0;
        turning_ = true;
      }
    }
    else
    {
      if(pose.pose.position.x >0.02) 
      {
        turning_ = false;
      }
      double dock_yaw = angles::normalize_angle(tf::getYaw(pose.pose.orientation));
      //ROS_INFO("yaw: %f", dock_yaw);
      linear_vel = 0.0;
      double ang_vel = 1.0 * dock_yaw;
      if(dock_yaw > 0.0005)
      {
        angular_vel = (ang_vel > 0.05)? 0.05: ang_vel;
      }
      else if(dock_yaw < -0.0005)
      {
        angular_vel = (ang_vel < -0.05)? -0.05: ang_vel;
      }
      else
      {
        angular_vel = 0.0;
      }
    }

    if(euclidean_distance <2.0)
    {
      command_.linear.x = linear_vel;
      command_.angular.z = angular_vel;
      ROS_ERROR("%f", command_.angular.z);
      cmd_vel_pub_.publish(command_);
    }
    
    //cmd_vel_pub_.publish(command_);
    //ROS_INFO("angular_vel: %f, linear_vel: %f", angular_vel, linear_vel);
  }


  return false;
}

bool BaseController::backup(float distance, bool turn)
{
  // Transform pose by -dist_ in the X direction of the dock
  /*geometry_msgs::PoseStamped pose = target;
  {
    float euclidean_distance = sqrt(pow(pose.pose.position.x, 2) + pow(pose.pose.position.y, 2));
    float steering_angle = atan2(pose.pose.position.y, pose.pose.position.x);
    if(euclidean_distance < backup_dist)
    {
      command_.linear.x = -0.05;
      command_.angular.z = 0;
      cmd_vel_pub_.publish(command_);
      return false;
    }

    command_ = geometry_msgs::Twist();
    cmd_vel_pub_.publish(command_);
    
    //cmd_vel_pub_.publish(command_);
    ROS_INFO("euclidean_distance: %f", euclidean_distance);
  }*/

  // If the inputs are invalid then don't backup.
  if (!std::isfinite(distance))
  {
    ROS_ERROR_STREAM_NAMED("controller", "Backup parameters are not valid.");
    stop();
    ROS_INFO("Backup parameters are not valid.");
    return true; 
  }

  // Get current base pose in odom
  geometry_msgs::PoseStamped pose;
  pose.header.frame_id = "base_footprint";
  pose.pose.orientation.w = 1.0;

  try
  {
    listener_.waitForTransform("odom_comb",
                               pose.header.frame_id,
                               pose.header.stamp,
                               ros::Duration(0.1));
    listener_.transformPose("odom_comb", pose, pose);
  }
  catch (tf::TransformException const &ex)
  {
    ROS_WARN_STREAM_THROTTLE(1.0, "Couldn't get transform from base_link to odom");
    stop();
    return true;
  }

  // If just getting started, stow starting pose
  if (!ready_)
  {
    start_ = pose;
    turning_ = false;
    ready_ = true;
  }
  float euclidean_distance = sqrt(pow(pose.pose.position.x - start_.pose.position.x, 2) + pow(pose.pose.position.y - start_.pose.position.y, 2));
  ROS_INFO("euclidean_distance: %f", euclidean_distance);

  if(distance > euclidean_distance)
  {
    command_ = geometry_msgs::Twist();
    command_.linear.x = -max_velocity_;
    cmd_vel_pub_.publish(command_);
    return false;
  }
  stop();
  return true;
}

bool BaseController::goStraight(double linearvelocity)
{
  if(linearvelocity <= 0.0)
    {
      return false;
    }
  command_ = geometry_msgs::Twist();
  command_.linear.x = linearvelocity;
  cmd_vel_pub_.publish(command_);
  return true;
}

bool BaseController::getCommand(geometry_msgs::Twist& command)
{
  command = command_;
  return true;
}

void BaseController::reset()
{
  turning_ = false;
  ready_ = false;
}

void BaseController::stop()
{
  command_ = geometry_msgs::Twist();
  cmd_vel_pub_.publish(command_);

  // Reset the backup controller
  ready_ = false;
  turning_ = false;

  // Reset the approach controller
  dist_ = 0.5;
}

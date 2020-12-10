#!/usr/bin/env python

import math
import rospy
import roslib
import rospkg
import actionlib
import tf 
from tf import TransformListener
import std_srvs.srv
from nav_msgs.msg import Odometry
import time
from geometry_msgs.msg import Pose, Point, Quaternion, PoseStamped
from std_msgs.msg import String, Float32, Empty
from tf.transformations import euler_from_quaternion, quaternion_from_euler


class RobotPose(object):
    def __init__(self):
        rospy.init_node("robot_pose_publisher")
        self.listener = tf.TransformListener()
        self.pose_pub_ = rospy.Publisher('/rtcrobot/pose', PoseStamped, queue_size=1)
        self.map_frame_ = '/map'
        #self.listener.waitForTransform('/map', '/base_footprint', rospy.Time.now(),rospy.Duration(1.0))
    
    def spin(self):
        r = rospy.Rate(10)
        while not rospy.is_shutdown():
            try:
                (trans,rot) = self.listener.lookupTransform(self.map_frame_, '/base_footprint', rospy.Time(0))
                #print(trans)
                #print(rot)
                pose_stamped = PoseStamped()
                pose_stamped.header.frame_id = self.map_frame_
                pose_stamped.header.stamp = rospy.Time.now()

                pose_stamped.pose.position.x = trans[0]
                pose_stamped.pose.position.y = trans[1]
                pose_stamped.pose.position.z = trans[2]
                pose_stamped.pose.orientation.x = rot[0]
                pose_stamped.pose.orientation.y = rot[1]
                pose_stamped.pose.orientation.z = rot[2]
                pose_stamped.pose.orientation.w = rot[3]
                self.pose_pub_.publish(pose_stamped)
		(roll,pitch,yaw) = euler_from_quaternion(rot)
		rospy.loginfo("x: %f, y: %f, yaw: %f", pose_stamped.pose.position.x, pose_stamped.pose.position.y, yaw)
            except (tf.LookupException, tf.ConnectivityException, tf.ExtrapolationException):
                continue
            r.sleep()

#############################################################################
#############################################################################
if __name__ == '__main__':
    """ main """
    try:
        robotpose = RobotPose()
        robotpose.spin()
    except rospy.ROSInterruptException:
        pass

#!/usr/bin/env python

import rospy
import roslib
roslib.load_manifest('rtcrobot_driver')
from math import sin, cos, pi

from rtcrobot_msgs.msg import RobotMode
from nav_msgs.msg import Odometry
from tf.broadcaster import TransformBroadcaster


from dynamic_reconfigure.server import Server
from rtcrobot_driver.cfg import TFDiffConfig

#############################################################################
class DiffTf:
#############################################################################

    #############################################################################
    def __init__(self):
    #############################################################################
        rospy.init_node("switch_dom")
        self.nodename = rospy.get_name()
        rospy.loginfo("-I- %s started" % self.nodename)
	
        
        #### parameters #######
        
        self.mapping_frame_id = rospy.get_param('~mapping_frame_id','odom_mapping') # the name of the base frame of the robot
        self.nav_frame_id = rospy.get_param('~nav_frame_id','odom_nav') # the name of the base frame of the robot
        self.odom_frame_id = rospy.get_param('~odom_frame_id', 'odom_comb') # the name of the odometry reference frame
 
        self.odomPub = rospy.Publisher("odom_comb", Odometry, queue_size=10)
        self.odomBroadcaster = TransformBroadcaster()
        self.__mode = RobotMode.STARTING
        self.mode_sub_ = rospy.Subscriber('robot_mode', RobotMode, self.mode_callback)

        self.frame_id = self.nav_frame_id
        self.update()

    
    #############################################################################
    def spin(self):
    #############################################################################
        r = rospy.Rate(1000)
        while not rospy.is_shutdown():
            self.update()
            r.sleep()
       
    #############################################################################
    def mode_callback(self, msg):
    #############################################################################
        if msg.code == RobotMode.MAPPING:
            self.frame_id = self.mapping_frame_id
            print 'mapping'
        else:
            self.frame_id = self.nav_frame_id
            print msg.code
        pass

    #############################################################################
    def update(self):
    #############################################################################    
        # publish the odom information
        
        self.odomBroadcaster.sendTransform(
            (0, 0, 0),
            (0.0, 0.0, 0.0, 1.0),
            rospy.Time.now(),
            self.odom_frame_id,
            self.frame_id
            )

#############################################################################
#############################################################################
if __name__ == '__main__':
    """ main """
    try:
        diffTf = DiffTf()
        diffTf.spin()
    except rospy.ROSInterruptException:
        pass

#!/usr/bin/env python

import rospy
import roslaunch
from rtcrobot_msgs.msg import RobotMode

class RunNode(object):
    def __init__(self):
        rospy.init_node("runnode")
        self.mode_ = None
        self.process = None

        #!Start a node
        #node = roslaunch.core.Node('rtcrobot_base', 'robotpose.py')
        #launch = roslaunch.scriptapi.ROSLaunch()
        #launch.start()

        #self.process = launch.launch(node)
        #print self.process.is_alive()
        #self.process.stop()

        #!Start a launch file
        self.uuid = roslaunch.rlutil.get_or_generate_uuid(None, False)
        roslaunch.configure_logging(self.uuid)
        #launch = roslaunch.parent.ROSLaunchParent(uuid, ["/home/haier/catkin_ws/src/testapi/launch/test_node.launch"])
        #launch.start()
        #rospy.loginfo("started")

        #rospy.sleep(3)
        # 3 seconds later
        #launch.shutdown()
        self.mode_sub_ = rospy.Subscriber('robot_mode', RobotMode, self.mode_callback)

    def spin(self):
        r = rospy.Rate(10)

        while not rospy.is_shutdown():
            if self.mode_ == RobotMode.MAPPING:
                if self.process == None:
                    try:
                        launch = roslaunch.parent.ROSLaunchParent(self.uuid, ["/home/robot02/robot_ws/src/rtcrobot/rtcrobot_navigation/launch/cartographer.launch"])
                        launch.start()
                        self.process = launch
                    except:
                        rospy.logerr('Cannot run launch file')
            elif self.process != None:
                self.process.shutdown()
                self.process = None
            r.sleep()

    def mode_callback(self, msg):
        self.mode_ = msg.code
        pass

    

#############################################################################
#############################################################################
if __name__ == '__main__':
    """ main """
    try:
        runnode = RunNode()
        runnode.spin()
    except rospy.ROSInterruptException:
        pass

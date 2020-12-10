#!/usr/bin/env python

import rospy

import rospy
import rospkg
import yaml
import dynamic_reconfigure.client
from rtcrobot_msgs.msg import light

def callback(config):
    rospy.loginfo("""Config set to {state}""")


def callback1(data):
	print data
	file_path=rospkg.RosPack().get_path('rtcrobot_navigation')+"/config/system.yaml"
        with open(file_path) as f:  # load file yaml
            doc = yaml.load(f)
	value= doc['light']['state']['EMERGENCY'] 
	client.update_configuration({"state":value})



if __name__ == "__main__":
    rospy.init_node("dynamic_client")
    client = dynamic_reconfigure.client.Client("control_light", timeout=30)
    rospy.Subscriber("web_control_light",light,callback1)
  

    r = rospy.Rate(0.1)
    x = 0
    b = False
    while not rospy.is_shutdown():
      
        r.sleep()

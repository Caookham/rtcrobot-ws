#! /usr/bin/env python
import rospy
import rtcrobot_webinterface.handle as handle

if __name__ == '__main__':
    """ main """
    try:
        s =handle.sound_control()
        s.spin()
    except rospy.ROSInterruptException:
        pass
    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')
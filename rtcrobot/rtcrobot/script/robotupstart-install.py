#!/usr/bin/env python
import robot_upstart  

j = robot_upstart.Job('rtcrobot')
j.add(package="rtcrobot_webinterface", filename="launch/webserver.launch")
#j.add(package="rtcrobot_base", filename="launch/rtcrobot_common.launch")
j.install()

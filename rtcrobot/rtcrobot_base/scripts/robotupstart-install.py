#!/usr/bin/env python
import robot_upstart  

j = robot_upstart.Job('rtcrobot', master_uri='http://192.168.5.10:11311')
j.symlink = True

#j.add(package="rtcrobot_webinterface", filename="launch/webserver.launch")
j.add(package="rtcrobot_base", filename="launch/rtcrobot_common.launch")
j.install()

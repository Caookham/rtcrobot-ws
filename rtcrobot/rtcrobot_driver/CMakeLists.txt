cmake_minimum_required(VERSION 2.8.3)
project(rtcrobot_driver)

find_package(catkin REQUIRED COMPONENTS
  actionlib_msgs
  diagnostic_msgs
  dynamic_reconfigure
  geometry_msgs
  #mir_actions
  #mir_msgs
  move_base_msgs
  nav_msgs
  rosgraph_msgs
  roslaunch
  rospy
  rospy_message_converter
  sensor_msgs
  std_msgs
  tf
  visualization_msgs
)

catkin_python_setup()

###################################
## catkin specific configuration ##
###################################

#add dynamic reconfigure api
#find_package(catkin REQUIRED dynamic_reconfigure)
generate_dynamic_reconfigure_options(
  cfg/TFDiff.cfg
  cfg/Light_.cfg

  #...
)

# make sure configure headers are built before any node using them
# add_dependencies(example_node ${PROJECT_NAME}_gencfg)

catkin_package(
  CATKIN_DEPENDS
    actionlib_msgs
    diagnostic_msgs
    dynamic_reconfigure
    geometry_msgs
    #mir_actions
    #mir_msgs
    move_base_msgs
    nav_msgs
    rosgraph_msgs
    rospy_message_converter
    sensor_msgs
    std_msgs
    tf
    visualization_msgs
)

#############
## Install ##
#############

catkin_install_python(PROGRAMS
  nodes/rtcrobot_bridge.py
  nodes/tf_remove_child_frames.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION})

# Mark other files for installation (e.g. launch and bag files, etc.)
install(DIRECTORY
  launch
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}
)

#############
## Testing ##
#############

roslaunch_add_file_check(launch)

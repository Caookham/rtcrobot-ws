#Robot State constants
int8 STARTING       = 1   #Ready for job
int8 READY    		= 2   #Ready for job
int8 EMERGENCY 		= 3   #Emergency stop
int8 MOVING 		= 4   #Drives to destination
int8 CALCULATING 	= 5   #Planning/Calculating
int8 MANUAL 		= 6   #Manual drives joystick
int8 MAPPING 		= 7   #Mapping
int8 CHARGING 		= 8   #Charging: Charging station
int8 WAIT_RESPONSE 	= 9   #Waiting for user's response
int8 MISSION_PAUSE	= 10  #Mission pause
int8 HARDWARE_ERROR	= 11  #General error (Hardware, localization,...)
int8 SHUTDOWN		= 12  #Shutdown robot
int8 DOCK           	= 13  #Dock

#Move sub-code constants
int8 NORMAL    		= 0 #Normal moving
int8 IGNORING_OBSTACLES	= 1 #Ignoring obstacles
int8 NO_LOCALIZATION	= 2 #Drives to destination using encoder 
int8 GOAL		        = 3 #Goal/Path blocked

#Dock sub-code constants
#int8 NORMAL    		= 0 #Normal 
int8 UNDOCKING		= 1 #Undock
int8 DOCKING    	= 2 #Docking to dock (moving)
int8 DOCKED     	= 3 #Docked in front of dock
int8 APPROACHED		= 4 #Approached to dock

# state's code
int8 code

# state's sub-code
int8 subcode


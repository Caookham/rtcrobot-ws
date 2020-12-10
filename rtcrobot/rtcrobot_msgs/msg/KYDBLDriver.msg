# Fault flags constants
uint8 FLAULT_FLAGS_OVERHEAT                  = 1
uint8 FLAULT_FLAGS_OVERVOLTAGE               = 2
uint8 FLAULT_FLAGS_UNDERVOLTAGR              = 4
uint8 FLAULT_FLAGS_SHORTCIRCUIT              = 8
uint8 FLAULT_FLAGS_EMERGENCYSTOP             = 16
uint8 FLAULT_FLAGS_SEPEXEXCITATION           = 32
uint8 FLAULT_FLAGS_MOSFETFAILURE             = 64
uint8 FLAULT_FLAGS_STARTUPCONFIGURATIONFAULT = 128

# Status flags constants
uint8 STATUS_SERIALMODE     = 1
uint8 STATUS_PULSEMODE      = 2
uint8 STATUS_ANALOGMODE     = 4
uint8 STATUS_POWERSTAGEOFF  = 8
uint8 STATUS_STALLDETECTED  = 16
uint8 STATUS_ATLIMIT        = 32
uint8 STATUS_UNUSED         = 64
uint8 STATUS_MICROBASIC     = 128

# Type
string Type = "KYDBL48302E"

# Encoder Counter Absolute
int32[] Encoder

# BrushLess Motor Speed in RPM
int16[] HallRPM

# Encoder Motor Speed in RPM
int16[] EncoderRPM

# Fault Flags
int8 FaultFlags

# Status Flags
int8 StatusFlags

# IMPORTANT: You should never have to generate this message yourself.


# Sound identifiers that have special meaning
int8 ALL = -1 # Only legal with PLAY_STOP
int8 PLAY_FILE = -2
int8 SAY = -3

int8 sound # Selects which sound to play (see above)

# Commands
int8 PLAY_STOP = 0 # Stop this sound from playing
int8 PLAY_ONCE = 1 # Play the sound once
int8 PLAY_START = 2 # Play the sound in a loop until a stop request occurs

int8 command # Indicates what to do with the sound

# Volume at which to play the sound, with 0 as mute and 1.0 as 100%.
float32 volume

string arg # file name or text to say

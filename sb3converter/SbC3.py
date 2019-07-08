# Sb3 to Sb2 Converter 
# Version 0.2.0

import argparse, logging
import audioop, io, wave
import json, hashlib, zipfile

# Configure the logger for the converter
logging.basicConfig(format="%(levelname)s: %(message)s", level=30)
log = logging.getLogger()

# Maps sb3 opcodes and parameters to sb2 blockcodes
specmap2 = {"motion_movesteps": ["forward:", [["input", "STEPS"]]], "motion_turnright": ["turnRight:", [["input", "DEGREES"]]], "motion_turnleft": ["turnLeft:", [["input", "DEGREES"]]], "motion_pointindirection": ["heading:", [["input", "DIRECTION"]]], "motion_pointtowards": ["pointTowards:", [["input", "TOWARDS"]]], "motion_gotoxy": ["gotoX:y:", [["input", "X"], ["input", "Y"]]], "motion_goto": ["gotoSpriteOrMouse:", [["input", "TO"]]], "motion_glidesecstoxy": ["glideSecs:toX:y:elapsed:from:", [["input", "SECS"], ["input", "X"], ["input", "Y"]]], "motion_changexby": ["changeXposBy:", [["input", "DX"]]], "motion_setx": ["xpos:", [["input", "X"]]], "motion_changeyby": ["changeYposBy:", [["input", "DY"]]], "motion_sety": ["ypos:", [["input", "Y"]]], "motion_ifonedgebounce": ["bounceOffEdge", []], "motion_setrotationstyle": ["setRotationStyle", [["field", "STYLE"]]], "motion_xposition": ["xpos", []], "motion_yposition": ["ypos", []], "motion_direction": ["heading", []], "motion_scroll_right": ["scrollRight", [["input", "DISTANCE"]]], "motion_scroll_up": ["scrollUp", [["input", "DISTANCE"]]], "motion_align_scene": ["scrollAlign", [["field", "ALIGNMENT"]]], "motion_xscroll": ["xScroll", []], "motion_yscroll": ["yScroll", []], "looks_sayforsecs": ["say:duration:elapsed:from:", [["input", "MESSAGE"], ["input", "SECS"]]], "looks_say": ["say:", [["input", "MESSAGE"]]], "looks_thinkforsecs": ["think:duration:elapsed:from:", [["input", "MESSAGE"], ["input", "SECS"]]], "looks_think": ["think:", [["input", "MESSAGE"]]], "looks_show": ["show", []], "looks_hide": ["hide", []], "looks_hideallsprites": ["hideAll", []], "looks_switchcostumeto": ["lookLike:", [["input", "COSTUME"]]], "looks_nextcostume": ["nextCostume", []], "looks_switchbackdropto": ["startScene", [["input", "BACKDROP"]]], "looks_changeeffectby": ["changeGraphicEffect:by:", [["field", "EFFECT"], ["input", "CHANGE"]]], "looks_seteffectto": ["setGraphicEffect:to:", [["field", "EFFECT"], ["input", "VALUE"]]], "looks_cleargraphiceffects": ["filterReset", []], "looks_changesizeby": ["changeSizeBy:", [["input", "CHANGE"]]], "looks_setsizeto": ["setSizeTo:", [["input", "SIZE"]]], "looks_changestretchby": ["changeStretchBy:", [["input", "CHANGE"]]], "looks_setstretchto": ["setStretchTo:", [["input", "STRETCH"]]], "looks_gotofrontback": ["comeToFront", []], "looks_goforwardbackwardlayers": ["goBackByLayers:", [["input", "NUM"]]], "looks_costumenumbername": ["costumeName", []], "looks_backdropnumbername": ["backgroundIndex", []], "looks_size": ["scale", []], "looks_switchbackdroptoandwait": ["startSceneAndWait", [["input", "BACKDROP"]]], "looks_nextbackdrop": ["nextScene", []], "sound_play": ["playSound:", [["input", "SOUND_MENU"]]], "sound_playuntildone": ["doPlaySoundAndWait", [["input", "SOUND_MENU"]]], "sound_stopallsounds": ["stopAllSounds", []], "music_playDrumForBeats": ["playDrum", [["input", "DRUM"], ["input", "BEATS"]]], "music_midiPlayDrumForBeats": ["drum:duration:elapsed:from:", [["input", "DRUM"], ["input", "BEATS"]]], "music_restForBeats": ["rest:elapsed:from:", [["input", "BEATS"]]], "music_playNoteForBeats": ["noteOn:duration:elapsed:from:", [["input", "NOTE"], ["input", "BEATS"]]], "music_setInstrument": ["instrument:", [["input", "INSTRUMENT"]]], "music_midiSetInstrument": ["midiInstrument:", [["input", "INSTRUMENT"]]], "sound_changevolumeby": ["changeVolumeBy:", [["input", "VOLUME"]]], "sound_setvolumeto": ["setVolumeTo:", [["input", "VOLUME"]]], "sound_volume": ["volume", []], "music_changeTempo": ["changeTempoBy:", [["input", "TEMPO"]]], "music_setTempo": ["setTempoTo:", [["input", "TEMPO"]]], "music_getTempo": ["tempo", []], "pen_clear": ["clearPenTrails", []], "pen_stamp": ["stampCostume", []], "pen_penDown": ["putPenDown", []], "pen_penUp": ["putPenUp", []], "pen_setPenColorToColor": ["penColor:", [["input", "COLOR"]]], "pen_changePenHueBy": ["changePenHueBy:", [["input", "HUE"]]], "pen_setPenHueToNumber": ["setPenHueTo:", [["input", "HUE"]]], "pen_changePenShadeBy": ["changePenShadeBy:", [["input", "SHADE"]]], "pen_setPenShadeToNumber": ["setPenShadeTo:", [["input", "SHADE"]]], "pen_changePenSizeBy": ["changePenSizeBy:", [["input", "SIZE"]]], "pen_setPenSizeTo": ["penSize:", [["input", "SIZE"]]], "videoSensing_videoOn": ["senseVideoMotion", [["input", "ATTRIBUTE"], ["input", "SUBJECT"]]], "event_whenflagclicked": ["whenGreenFlag", []], "event_whenkeypressed": ["whenKeyPressed", [["field", "KEY_OPTION"]]], "event_whenthisspriteclicked": ["whenClicked", []], "event_whenbackdropswitchesto": ["whenSceneStarts", [["field", "BACKDROP"]]], "event_whenbroadcastreceived": ["whenIReceive", [["field", "BROADCAST_OPTION"]]], "event_broadcast": ["broadcast:", [["input", "BROADCAST_INPUT"]]], "event_broadcastandwait": ["doBroadcastAndWait", [["input", "BROADCAST_INPUT"]]], "control_wait": ["wait:elapsed:from:", [["input", "DURATION"]]], "control_repeat": ["doRepeat", [["input", "TIMES"], ["input", "SUBSTACK"]]], "control_forever": ["doForever", [["input", "SUBSTACK"]]], "control_if": ["doIf", [["input", "CONDITION"], ["input", "SUBSTACK"]]], "control_if_else": ["doIfElse", [["input", "CONDITION"], ["input", "SUBSTACK"], ["input", "SUBSTACK2"]]], "control_wait_until": ["doWaitUntil", [["input", "CONDITION"]]], "control_repeat_until": ["doUntil", [["input", "CONDITION"], ["input", "SUBSTACK"]]], "control_while": ["doWhile", [["input", "CONDITION"], ["input", "SUBSTACK"]]], "control_for_each": ["doForLoop", [["field", "VARIABLE"], ["input", "VALUE"], ["input", "SUBSTACK"]]], "control_stop": ["stopScripts", [["field", "STOP_OPTION"]]], "control_start_as_clone": ["whenCloned", []], "control_create_clone_of": ["createCloneOf", [["input", "CLONE_OPTION"]]], "control_delete_this_clone": ["deleteClone", []], "control_get_counter": ["COUNT", []], "control_incr_counter": ["INCR_COUNT", []], "control_clear_counter": ["CLR_COUNT", []], "control_all_at_once": ["warpSpeed", [["input", "SUBSTACK"]]], "sensing_touchingobject": ["touching:", [["input", "TOUCHINGOBJECTMENU"]]], "sensing_touchingcolor": ["touchingColor:", [["input", "COLOR"]]], "sensing_coloristouchingcolor": ["color:sees:", [["input", "COLOR"], ["input", "COLOR2"]]], "sensing_distanceto": ["distanceTo:", [["input", "DISTANCETOMENU"]]], "sensing_askandwait": ["doAsk", [["input", "QUESTION"]]], "sensing_answer": ["answer", []], "sensing_keypressed": ["keyPressed:", [["input", "KEY_OPTION"]]], "sensing_mousedown": ["mousePressed", []], "sensing_mousex": ["mouseX", []], "sensing_mousey": ["mouseY", []], "sensing_loudness": ["soundLevel", []], "sensing_loud": ["isLoud", []], "videoSensing_videoToggle": ["setVideoState", [["input", "VIDEO_STATE"]]], "videoSensing_setVideoTransparency": ["setVideoTransparency", [["input", "TRANSPARENCY"]]], "sensing_timer": ["timer", []], "sensing_resettimer": ["timerReset", []], "sensing_of": ["getAttribute:of:", [["field", "PROPERTY"], ["input", "OBJECT"]]], "sensing_current": ["timeAndDate", [["field", "CURRENTMENU"]]], "sensing_dayssince2000": ["timestamp", []], "sensing_username": ["getUserName", []], "sensing_userid": ["getUserId", []], "operator_add": ["+", [["input", "NUM1"], ["input", "NUM2"]]], "operator_subtract": ["-", [["input", "NUM1"], ["input", "NUM2"]]], "operator_multiply": ["*", [["input", "NUM1"], ["input", "NUM2"]]], "operator_divide": ["/", [["input", "NUM1"], ["input", "NUM2"]]], "operator_random": ["randomFrom:to:", [["input", "FROM"], ["input", "TO"]]], "operator_lt": ["<", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_equals": ["=", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_gt": [">", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_and": ["&", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_or": ["|", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_not": ["not", [["input", "OPERAND"]]], "operator_join": ["concatenate:with:", [["input", "STRING1"], ["input", "STRING2"]]], "operator_letter_of": ["letter:of:", [["input", "LETTER"], ["input", "STRING"]]], "operator_length": ["stringLength:", [["input", "STRING"]]], "operator_mod": ["%", [["input", "NUM1"], ["input", "NUM2"]]], "operator_round": ["rounded", [["input", "NUM"]]], "operator_mathop": ["computeFunction:of:", [["field", "OPERATOR"], ["input", "NUM"]]], "data_variable": ["getVar:", [["field", "VARIABLE"]]], "data_setvariableto": ["setVar:to:", [["field", "VARIABLE"], ["input", "VALUE"]]], "data_changevariableby": ["changeVar:by:", [["field", "VARIABLE"], ["input", "VALUE"]]], "data_showvariable": ["showVariable:", [["field", "VARIABLE"]]], "data_hidevariable": ["hideVariable:", [["field", "VARIABLE"]]], "data_listcontents": ["contentsOfList:", [["field", "LIST"]]], "data_addtolist": ["append:toList:", [["input", "ITEM"], ["field", "LIST"]]], "data_deleteoflist": ["deleteLine:ofList:", [["input", "INDEX"], ["field", "LIST"]]], "data_insertatlist": ["insert:at:ofList:", [["input", "ITEM"], ["input", "INDEX"], ["field", "LIST"]]], "data_replaceitemoflist": ["setLine:ofList:to:", [["input", "INDEX"], ["field", "LIST"], ["input", "ITEM"]]], "data_itemoflist": ["getLine:ofList:", [["input", "INDEX"], ["field", "LIST"]]], "data_lengthoflist": ["lineCountOfList:", [["field", "LIST"]]], "data_listcontainsitem": ["list:contains:", [["field", "LIST"], ["input", "ITEM"]]], "data_showlist": ["showList:", [["field", "LIST"]]], "data_hidelist": ["hideList:", [["field", "LIST"]]], "procedures_definition": ["procDef", []], "argument_reporter_string_number": ["getParam", [["field", "VALUE"]]], "procedures_call": ["call", []], "wedo2_motorOnFor": ["LEGO WeDo 2.0.motorOnFor", [["input", "MOTOR_ID"], ["input", "DURATION"]]], "wedo2_motorOn": ["LEGO WeDo 2.0.motorOn", [["input", "MOTOR_ID"]]], "wedo2_motorOff": ["LEGO WeDo 2.0.motorOff", [["input", "MOTOR_ID"]]], "wedo2_startMotorPower": ["LEGO WeDo 2.0.startMotorPower", [["input", "MOTOR_ID"], ["input", "POWER"]]], "wedo2_setMotorDirection": ["LEGO WeDo 2.0.setMotorDirection", [["input", "MOTOR_ID"], ["input", "MOTOR_DIRECTION"]]], "wedo2_setLightHue": ["LEGO WeDo 2.0.setLED", [["input", "HUE"]]], "wedo2_playNoteFor": ["LEGO WeDo 2.0.playNote", [["input", "NOTE"], ["input", "DURATION"]]], "wedo2_whenDistance": ["LEGO WeDo 2.0.whenDistance", [["input", "OP"], ["input", "REFERENCE"]]], "wedo2_whenTilted": ["LEGO WeDo 2.0.whenTilted", [["input", "TILT_DIRECTION_ANY"]]], "wedo2_getDistance": ["LEGO WeDo 2.0.getDistance", []], "wedo2_isTilted": ["LEGO WeDo 2.0.isTilted", [["input", "TILT_DIRECTION_ANY"]]], "wedo2_getTiltAngle": ["LEGO WeDo 2.0.getTilt", [["input", "TILT_DIRECTION"]]], "event_whengreaterthan": ["whenSensorGreaterThan", [["field", "WHENGREATERTHANMENU"], ["input", "VALUE"]]]}

def main(sb3_path, sb2_path, overwrite=True, optimize=False, debug=False):
    """Automatically converts a sb3 file and saves it in sb2 format.
    
    sb3_path -- the path to the .sb3 file
    sb2_path -- the save path for the .sb2 file
    specmap_path -- change the load path for the sb3 to sb2 specmap
    overwrite -- allow overwriting existing files
    debug -- save a debug to project.json if overwrite is enabled
    optimize -- try to convert strings to numbers"""
    overwrite=True
    # Open files to read and write from
    sbf = SbFiles(sb3_path, sb2_path, overwrite, debug)

    # Verify they loaded
    if sbf.sb3_file and sbf.sb2_file:
        if sbf.json_path == "project.json":
            # Load the sb3 project json
            sb3 = sbf.getSb3()

            # Make sure everything loaded correctly
            if sb3:
                # Get the convertor object
                project = Converter(sb3, specmap2)

                # Set optimizations
                project.numberOpt = optimize
                project.spaceOpt = optimize

                # Convert the project
                sb2, filemap = project.convert()

                # Save the project
                sbf.saveSb2(sb2, filemap)

                # Close all the files
                sbf.close()
            else:
                log.critical("Failed to load sb3 project json.")
                sbf.close()
        elif sbf.json_path == "sprite.json":
            # Load the sb3 target json
            sb3 = sbf.getSb3()

            if sb3:
                # Get the convertor object
                sprite = Converter(None, specmap2)

                # Set optimizations
                sprite.numberOpt = optimize
                sprite.spaceOpt = optimize

                # Convert the sprite
                sb2 = sprite.parseTarget(sb3)
                filemap = sprite.filemap

                # Save the sprite
                sbf.saveSb2(sb2, filemap)

                # Close all files
                sbf.close()
            else:
                log.critical("Failed to load sb3 sprite json.")
                sbf.close()
        else:
            log.error("Invalid json path.")
            sbf.close()
    else:
        log.critical("Failed to load sb3 and sb2 files.")
        sbf.close()

class SbFiles:
    supportedRates = [44100, 22050, 11025, 5512] # Sound rates supported by flash

    sb3_file = None # Holds the sb3 file
    sb2_file = None # Holds the sb2 file

    sb3_path = "" # Holds the path to the sb3 file
    sb2_path = "" # Holds the path to the sb2 file
    json_path = "project.json" # Holds the path to the json

    overwrite = False # Whether files may be overwritten
    debug = False # Whether to save a debug json

    def __init__(self, sb3_path, sb2_path="", overwrite=False, debug=False):
        """Opens the sb3 and sb2 files in preperation of use"""
        self.sb3_path = sb3_path
        self.sb2_path = sb2_path

        try:
            self.sb3_file = zipfile.ZipFile(sb3_path, "r")

            # Figure out if the sb3 is a project or sprite
            ext = sb3_path.split(".")[-1]
            files = self.sb3_file.namelist()
            if ext == "sb3":
                self.json_path = "project.json"
                if not "project.json" in files and "sprite.json" in files:
                    self.json_path = "sprite.json"
                    log.warning("File '%s' has a sb3 extension but appears to be a sprite." % sb3_path)
            elif ext == "sprite3":
                self.json_path = "sprite.json"
                if not "sprite.json" in files and "project.json" in files:
                    self.json_path = "project.json"
                    log.warning("File '%s' has a sprite3 extension but appears to be a project." % sb3_path)
            else:
                self.json_path = "project.json"
                if not "project.json" in files and "sprite.json" in files:
                    self.json_path = "sprite.json"

            # Get a save path if not set
            if not sb2_path:
                if self.json_path == "project.json":
                    sb2_path = sb3_path.split(".")
                    sb2_path[-1] = "sb2"
                    self.sb2_path = '.'.join(sb2_path)
                else:
                    sb2_path = sb3_path.split(".")
                    sb2_path[-1] = "sprite2"
                    self.sb2_path = '.'.join(sb2_path)

            # Create the save file
            if overwrite:
                self.sb2_file = zipfile.ZipFile(self.sb2_path, "w")
            else:
                self.sb2_file = zipfile.ZipFile(self.sb2_path, "x")
        except FileExistsError:
            log.warning("File '%s' already exists. Delete or rename it and try again." % sb2_path)
        except FileNotFoundError:
            log.warning("File '%s' not found." % sb3_path)
        except zipfile.BadZipFile:
            log.warning("File '%s' is not a valid zip file." % sb3_path)
        except:
            log.error("Unkown error opening file '%s' or '%s'." % (sb2_path, sb3_path), exc_info=True)

        self.overwrite = overwrite
        self.debug = debug

    def getSb3(self):
        """Return the parsed project json from the sb3 file."""
        try:
            sb3_json = self.sb3_file.read(self.json_path)
            sb3 = json.loads(sb3_json)
            return sb3
        except KeyError:
            log.warning("Failed to find json '%s' in '%s'.", self.json_path, self.sb3_path)
            return False
        except json.decoder.JSONDecodeError:
            log.warning("File '%s/%s' is not a valid json file.", self.sb3_path, self.json_path)
            return False
        except:
            log.error("Unkown error reading '%s'.", self.sb3_path, exc_info=True)
        return False

    def saveSb2(self, sb2, filemap):
        """Create and save a sb2 zip from the converted project and sb3 zip."""
        sb2_jfile = None

        # Save the results
        try:
            # Process all sounds
            for s in filemap[0]:
                log.debug("Processing sound '%s'.", s)

                # Get the sb3 asset
                asset = filemap[0][s]
                name = asset[0]["name"]
                format = asset[0]["dataFormat"]
                md5ext = asset[0]["md5ext"]
                md5 = asset[0]["assetId"]

                # Get the sb2 asset
                data = self.sb3_file.read(md5ext)
                assetId = asset[1]["soundID"]

                if format == "wav":
                    # 
                    try:
                        data = self.processWave(data, asset[1])
                        md5 = hashlib.md5(data).hexdigest()
                    except wave.Error:
                        log.warning("Failed to convert wav sound '%s'." %asset[0]["name"], exc_info=True)
                    except:
                        log.error("Unkown error converting sound '%s'." %asset[0]["assetId"], exc_info=True)
                elif format == "mp3":
                    log.warning("Sound conversion for mp3 '%s' not supported." %asset[0]["name"])
                    continue
                else:
                    log.warning("Unrecognized sound format '%s'." %format)

                # Save the sb2 asset
                asset[1]["md5"] = md5 + "." + format
                fileName2 = str(assetId) + "." + format
                self.sb2_file.writestr(fileName2, data)
            
            # Process all costumes
            for c in filemap[1]:
                log.debug("Processing costume '%s'.", c)

                # Get the sb3 asset
                asset = filemap[1][c]
                assetId = asset[0]["assetId"]
                name = asset[0]["name"]
                format = asset[0]["dataFormat"]
                md5ext = asset[0]["md5ext"]

                # Load the sb3 asset
                assetData = self.sb3_file.read(md5ext)
                    

                # Check the format
                if format == "png":
                    pass
                elif format == "svg":
                    pass # TODO svg repair
                else:
                    log.warning("Unrecognized file format '%s'" % format)

                # Check the file md5
                md5 = hashlib.md5(assetData).hexdigest()
                if md5 != assetId:
                    if assetId == asset[0]["assetId"]:
                        log.warning("The md5 for %s '%s' is invalid.", format, name)
                    else:
                        log.error("The md5 for asset '%s' is invalid.", group[id][0]["assetId"])
                
                # Save sb2 assetId info
                assetId2 = asset[1]["baseLayerID"]
                asset[1]["baseLayerMD5"] = assetId + "." + format

                # Save the sb2 asset
                fileName2 = str(assetId2) + "." + format
                self.sb2_file.writestr(fileName2, assetData)

            # Get the sb2 json string
            sb2_json = json.dumps(sb2, indent=4, separators=(',', ': '))

            if self.debug and self.overwrite:
                # Save a copy of the json
                sb2_jfile = open(self.json_path, "w")
                sb2_jfile.write(sb2_json)
                print("Saved debug to '%s'." % self.json_path)
            
            # Save the sb2 json
            self.sb2_file.writestr(self.json_path, sb2_json)

            print("Saved to '%s'" % self.sb2_path)
            return True
        except:
            log.error("Unkown error saving to '%s'.", sb2_path, exc_info=True)
            return False
        finally:
            if sb2_jfile: sb2_jfile.close()
            elif debug: print("Did not save debug json to '%s'." % self.json_path)

    def close(self):
        """Close all open files"""
        if self.sb3_file: self.sb3_file.close()
        if self.sb2_file: self.sb2_file.close()

    # TODO Maybe just get actual sound rate?
    def processWave(self, data, asset):
        if asset["format"] == "adpcm":
            log.warning("Sound rate verification for adpcm wav '%s' not supported." % asset["soundName"])
            return data

        # Read the sound with wave
        data = io.BytesIO(data)
        wav = wave.open(data, "rb")

        # Get info about the sound
        channels = wav.getnchannels()
        width = wav.getsampwidth()
        rate = wav.getframerate() # TODO These don't match json?
        sampleCount = wav.getnframes()

        # Resample and monofy the sound
        changed = False
        sound = wav.readframes(sampleCount)
        if channels > 1:
            log.debug("Monofying sound '%s'" %asset["md5"])
            sound = audioop.tomono(sound, width, 1, 1)
            changed = True
        if not rate in self.supportedRates:
            log.debug("Resamping sound '%s'" %asset["md5"])
            # Find the highest supported rate TODO Is this the best way?
            newRate = self.supportedRates[-1]
            for r in self.supportedRates:
                if rate > r:
                    newRate = r
                    break

            # Resample the sound
            sound = audioop.ratecv(sound, width, 1, rate, newRate, None)[0]
            rate = newRate
            changed = True
        
        if changed:
            # Get the wav data
            data = io.BytesIO()
            wav = wave.open(data, "wb")
            wav.setnchannels(1)
            wav.setframerate(rate)
            wav.setsampwidth(width)
            wav.writeframes(sound)

        # Save framerate and sampleCount
        data.seek(0)
        wav = wave.open(data, "rb")
        asset["rate"] = wav.getframerate()
        asset["sampleCount"] = wav.getnframes()

        data.seek(0)
        return data.read()

class Converter:
    """Class for converting a sb3 project json to the sb2 format"""

    sb3 = {} # The sb3 project json
    sb2 = {} # The sb2 project json

    specmap2 = {} # A specmap for sb3 to sb2
    filemap = [{}, {}] # List of sb3 files and their sb2 names

    sprites = [] # Holds the children of the stage
    blockIds = [] # Temporarily holds blockIds for anchoring comments

    # TODO Make space adjustable based on version made in
    spaceX = 1.5 # Size adjustment factor
    spaceY = 2.2 # Works best for projects spaced in sb2

    # TODO Create more optimizations
    numberOpt = False # Try to convert all strings to numbers
    spaceOpt = False # TODO Remove contents of hidden list monitors?

    staticFields = ["sensing_current", # Some fields are all caps for some reason
        "looks_changeeffectby", "looks_seteffectto"] # TODO Add more

    rotationStyles = {"all around": "normal", "left-right":"leftRight", 
                "don't rotate": "none"} # A key for sb3 rotation styles to sb2

    monitorModes = {"default": 1, "large": 2, "slider": 3}

    monitorOpcodes = {
        "sensing_answer": "answer",
        "motion_direction": "heading",
        "looks_size": "scale",
        "sensing_loudness": "soundLevel",
        "music_getTempo": "tempo", 
        "sensing_current": "timeAndDate",
        "sensing_timer": "timer",
        "sound_volume": "volume",
        "motion_xposition": "xpos", 
        "motion_yposition": "ypos"
    }

    monitorColors = {
        "motion": 4877524, "looks": 9065943,
        "sound": 12272323, "music": 12272323,
        "data": 15629590, "sensing": 2926050
    }

    extensions = { # Holds conversion data for extensions
        "wedo2": {"extensionName": "LEGO WeDo 2.0"}
    }

    def __init__(self, project, specmap2):
        """Sets the sb3 project and specmap for the convertor."""
        self.sb3 = project
        self.specmap2 = specmap2
    
    def convert(self):
        """Convert the loaded sb3 project to sb2 format"""
        # Parse all monitors which go with sprites
        self.monitors = {}
        for monitor in self.sb3["monitors"]:
            monitor2 = self.parseMonitor(monitor)
            if monitor2:
                self.monitors[monitor["id"]] = monitor2

        # Parse each target(sprite)
        sprites = {}
        for target in self.sb3["targets"]:
            object = self.parseTarget(target)
            if object["objName"] == "Stage":
                self.sb2 = object
            else:
                sprites[target["layerOrder"]] = object
        
        # Order the sprites correctly
        for l in sorted(sprites):
            self.sprites.append(sprites[l])

        # Add the sprites and monitors to the stage
        self.sb2["children"] = self.sprites + list(self.monitors.values())

        # Add info about this converter and project
        self.sb2["info"] = {
                "userAgent": "sb3tosb2 imfh",
                "flashVersion": "",
                "scriptCount": 0, # TODO Script count
                "videoOn": False,
                "spriteCount": len(self.sprites),
                "swfVersion": ""
        }

        # Add extension information
        extensions = []
        for e in self.sb3["extensions"]:
            if e in self.extensions:
                extensions.append(self.extensions[e])
        if extensions:
            self.sb2["info"]["savedExtensions"] = extensions
    
        return self.sb2, self.filemap

    def parseTarget(self, target):
        """Parses a sb3 target into a sb2 sprite"""
        # Holds the empty target
        sprite = {"objName": target["name"]}

        # Get variables
        variables = []
        for v in target["variables"]:
            vari = target["variables"][v]

            if len(vari) == 3 and vari[2]:
                isCloud = True
            else:
                isCloud = False

            value = vari[1]
            value = self.specialNumber(value, self.numberOpt)
            
            variables.append({
                "name": vari[0],
                "value": value,
                "isPersistent": isCloud
            })
        if variables:
            sprite["variables"] = variables

        # Get lists
        lists = []
        for l in target["lists"]:
            lst = target["lists"][l]

            # Get the monitor related to this list
            if l in self.monitors:
                monitor = self.monitors[l]
            else:
                monitor = None

            # Convert special values and possibly optimize all numbers
            for i in range(0, len(lst[1])):
                lst[1][i] = self.specialNumber(lst[1][i], self.numberOpt)

            lists.append({
                "listName": lst[0],
                "contents": lst[1],
                "isPersistent": False,
                "x": monitor and monitor["x"] or 5,
                "y": monitor and monitor["y"] or 5,
                "width": monitor and monitor["width"] or 104,
                "height": monitor and monitor["height"] or 204,
                "visible": monitor and monitor["visible"] or False
            })
        if lists:
            sprite["lists"] = lists

        # Get scripts
        self.blockIds = [] # Holds blocks for comment anchoring
        scripts = []
        for b in target["blocks"]:
            block = target["blocks"][b]
            if type(block) == dict:
                if block["topLevel"]:
                    script = self.parseScript(b, target["blocks"])
                    scripts.append(script)
            elif type(block) == list:
                # Handle reporter values not in a block
                script = [
                    round(block[3] / self.spaceX),
                    round(block[4] / self.spaceY),
                    []
                ]

                if block[0] == 12: # Variable reporter
                    script[2].append(["readVariable", block[1]]) # TODO check for hacked blocks
                elif block[0] == 13: # List reporter
                    script[2].append(["contentsOfList:", block[1]])
                
                scripts.append(script)
                self.blockIds.append(b)
                
        if scripts:
            sprite["scripts"] = scripts

        # Get script comments
        comments = []
        for c in target["comments"]:
            comment = target["comments"][c]
            if comment["blockId"] in self.blockIds:
                blockIndex = self.blockIds.index(comment["blockId"])
            else:
                blockIndex = -1
            if comment["x"] == None:
                comment["x"] = 0
            if comment["y"] == None:
                comment["y"] = 0
            comments.append([
                round(comment["x"] / self.spaceX),
                round(comment["y"] / self.spaceY),
                round(comment["width"] / self.spaceX),
                round(comment["height"] / self.spaceY),
                not comment["minimized"],
                blockIndex,
                comment["text"]
            ])
        if comments:
            sprite["scriptComments"] = comments

        # Get sounds
        sounds = []
        for sound in target["sounds"]:
            if sound["assetId"] in self.filemap[0]:
                sound2 = self.filemap[0][sound["assetId"]][1]
            else:
                sound2 = {
                    "soundName": sound["name"],
                    "soundID": len(self.filemap[0]),
                    "md5": sound["md5ext"],
                    "sampleCount": sound["sampleCount"],
                    "rate": sound["rate"],
                    "format": "format" in sound and sound["format"] or ""
                }
                self.filemap[0][sound["assetId"]] = [sound, sound2]
            sounds.append(sound2)
        if sounds:
            sprite["sounds"] = sounds

        # Get costumes
        costumes = []
        for costume in target["costumes"]:
            if costume["assetId"] in self.filemap[1]:
                costume2 = self.filemap[1][costume["assetId"]][1]
            else:
                costume2 = {
                    "costumeName": costume["name"],
                    "baseLayerID": len(self.filemap[1]),
                    "BaseLayerMD5": costume["md5ext"],
                    "rotationCenterX": costume["rotationCenterX"],
                    "rotationCenterY": costume["rotationCenterY"]
                }
                if "bitmapResolution" in costume:
                    costume2["bitmapResolution"] = costume["bitmapResolution"]
                self.filemap[1][costume["assetId"]] = [costume, costume2]
            costumes.append(costume2)
        sprite["costumes"] = costumes

        # Get other attributes
        sprite["currentCostumeIndex"] = target["currentCostume"]
        
        if not target["isStage"]:
            sprite["scratchX"] = target["x"]
            sprite["scratchY"] = target["y"]
            sprite["scale"] = round(target["size"] / 100)
            sprite["direction"] = target["direction"]
            if target["rotationStyle"] in self.rotationStyles:
                sprite["rotationStyle"] = self.rotationStyles[target["rotationStyle"]]
            else:
                sprite["rotationStyle"] = target["rotationStyle"]
            sprite["isDraggable"] = target["draggable"]
            sprite["indexInLibrary"] = len(self.sprites) + 1
            sprite["visible"] = target["visible"]
            sprite["spriteInfo"] = {} # Always blank
        else:
            sprite["penLayerMD5"] = "" # TODO Is there a pen MD5 in sb3?
            sprite["penLayerID"] = ""
            sprite["tempoBPM"] = target["tempo"]
            sprite["videoAlpha"] = round((100 - target["videoTransparency"]) / 100, 2)
        
        log.info("Parsed sprite '%s'" %target["name"])

        return sprite

    def parseScript(self, id, blocks):
        """Converts a sb3 script to a sb2 script."""

        # The parsed script to be returned
        script = []
        
        # Holds the sb2 block being parsed
        current = []
        
        # Holds the list which parsed blocks are added to
        chain = []
        
        # Initialize the queue
        self.queue = [[id, chain, True]]

        # Get the position of the script
        script.append(round(blocks[id]["x"] / self.spaceX))
        script.append(round(blocks[id]["y"] / self.spaceY))
        
        # Add the chain to the script
        script.append(chain)

        while self.queue:
            # Get the next block to be parsed
            next = self.queue.pop(0)
            blockId = next[0]
            if next[2]:
                # It's a stack
                current = []
                chain = next[1]
            else:
                # It's just a block
                current = next[1]
                chain = False


            # Save the id for comment anchoring
            self.blockIds.append(blockId)

            # Get the sb3 block
            block3 = blocks[blockId]

            # Get the 3.0 opcode
            opcode = block3["opcode"]

            # Get the specmap for the block, handle custom blocks
            argmap = None
            if opcode == "procedures_definition":
                # Handle custom block definition
                value = block3["inputs"]["custom_block"][1]
                value = blocks[value]["mutation"]
                current.append("procDef")
                current.append(value["proccode"])
                current.append(json.loads(value["argumentnames"]))
                current.append(json.loads(value["argumentdefaults"]))
                if value["warp"] == "true" or value["warp"] == True:
                    current.append(True)
                elif value["warp"] == "false" or value["warp"] == False:
                    current.append(False)
            elif opcode == "procedures_call":
                # Handle custom block call
                value = block3["mutation"]
                current.append("call")
                current.append(value["proccode"])

                # Create a custom argument map
                argmap = []
                for arg in json.loads(value["argumentids"]):
                    argmap.append(["input",arg])
            elif opcode == "argument_reporter_string_number":
                # Handle custom block string/number reporter
                current.append("getParam")
                current.append(block3["fields"]["VALUE"][0])
                current.append("r")
            elif opcode == "argument_reporter_boolean":
                # Handle custom block boolean reporter
                current.append("getParam")
                current.append(block3["fields"]["VALUE"][0])
                current.append("b")
            # Handle some sb3 exclusive workarounds
            elif opcode == "looks_gotofrontback":
                # Handle the new front/back argument
                if block3["fields"]["FRONT_BACK"][0] == "back":
                    current.append("goBackByLayers:")
                    current.append(999)
                else:
                    current.append("comeToFront")
            elif opcode == "looks_goforwardbackwardlayers":
                # Handle the new fowards/back argument
                current.append("goBackByLayers:")
                try:
                    if block3["fields"]["FORWARD_BACKWARD"][0] == "foward":
                        current.append(int(block3["inputs"]["NUM"][1][1]) * -1)
                    else:
                        current.append(block3["inputs"]["NUM"][1][1])
                except:
                    current.append(block3["inputs"]["NUM"][1][1])
            elif opcode == "looks_costumenumbername":
                if block3["fields"]["NUMBER_NAME"][0] == "name":
                    current.append("costumeName") # Undefined block
                else:
                    current.append("costumeIndex")
            elif opcode == "looks_backdropnumbername":
                if block3["fields"]["NUMBER_NAME"][0] == "number":
                    current.append("backgroundIndex")
                else:
                    current.append("sceneName")
            elif opcode == "data_deletealloflist":
                current.append("deleteLine:ofList:")
                current.append("all")
                current.append(block3["fields"]["LIST"][0])
            elif opcode in self.specmap2:
                # Get the sb2 block id
                current.append(self.specmap2[opcode][0])

                # Get the block's argmap
                argmap = self.specmap2[opcode][1]
            else:
                # It's probably a Scratch 3 block that this can't convert
                current.append(opcode)

                # Make a custom argmap for it
                argmap = []
                for field in block3["fields"]:
                    argmap.append(["field",field])
                for input in block3["inputs"]:
                    argmap.append(["input",input])

            if argmap != None:
                # Arguments in the queue counter
                self.q = 0

                # Parse each parameter
                for arg in argmap:
                    if arg[0] == "field":
                        # Get the sb3 field argument
                        value = block3["fields"][arg[1]][0]

                        # Some fields are all caps for some reason
                        if opcode in self.staticFields:
                            value = value.lower()
                    elif arg[0] == "input":
                        if arg[1] in block3["inputs"]:
                            try:
                                # Get the sb3 input argument
                                value = self.parseInput(block3, arg[1], blocks)
                            except:
                                log.error("Argument parsing problem.", exc_info=True)
                                value = block3["inputs"][arg[1]]
                        else:
                            value = None # Empty substacks not always stored?

                    # Add the parsed parameter to the block
                    current.append(value)
            
            # Add the block to the script
            if chain != False:
                chain.append(current)
            
            # Add the next block to the queue
            if block3["next"]:
                self.queue.append([block3["next"], chain, True])
        
        return script

    def parseInput(self, block, inp, blocks):
        # Get the input from the block
        value = block["inputs"][inp]

        # Handle possible block input
        if value[0] == 1: # Wrapper; block or value
            if type(value[1]) == list:
                value = value[1]
            else:
                value = [2, value[1]]
        elif value[0] == 3: # Block covering a value
            value = [2, value[1]]
        if value[0] == 2: # Block
            value = value[1]

            if type(value) != list: # Make sure it's not a variable
                if value in blocks:
                    id = value
                    if blocks[id]["shadow"] and inp in blocks[id]["fields"]:
                        # It's probably be a menu
                        value = blocks[id]["fields"][inp][0]
                    elif inp in ["SUBSTACK", "SUBSTACK2"]:
                        value = []
                        self.queue.insert(self.q, [id, value, False])
                        self.q += 1
                    else:
                        value = []
                        self.queue.insert(self.q, [id, value, False])
                        self.q += 1
                elif value == None:
                    # Blank value in bool input is null in sb3 but false in sb2
                    if not inp in ["SUBSTACK", "SUBSTACK2"]:
                        value = False
                else:
                    log.warning("Invalid block id: 's'" %value)

                return value

        # Handle number values
        if value[0] == 4: # Float value
            value = value[1]
        elif value[0] == 5: # UFloat value
            value = value[1]
        elif value[0] == 6: # UInteger value
            value = value[1]
        elif value[0] == 7: # Integer value
            value = value[1]
        elif value[0] == 8: # Float angle value
            value = value[1]
        elif value[0] == 9: # Hex color value
            try:
                value = int(value[1].strip("#"), 16)
            except ValueError:
                log.warning("Unable to convert hex: '%s'" %value[1])
                value = value[1]
        else:
            # Handle other values
            if value[0] == 10: # String value
                value = value[1]
            elif value[0] == 11: # Broadcast value
                value = value[1]
            elif value[0] == 12: # Variable reporter
                self.blockIds.append(None) # TODO Calculate variable block id
                value = ["readVariable", value[1]]
            elif value[0] == 13: # List reporter
                self.blockIds.append(None)
                value = ["contentsOfList:", value[1]]
            else:
                log.warning("Invalid value type: '%s'" %value[1])

            return value
        
        # It's a number, try to convert it to one
        value = self.specialNumber(value, True)

        return value

    def specialNumber(self, value, toNumber=True):
        """Converts special strings to numbers."""
        if value == "Infinity":
            value = float("Inf")
        elif value == "-Infinity":
            value = float("-Inf")
        elif value == "NaN":
            value = float("NaN")
        elif toNumber:
            try:
                value = float(value)
                if value == int(value):
                    value = int(value)
            except ValueError:
                pass # Normal
        return value

    def parseMonitor(self, monitor):
        """Parse a sb3 monitor into an sb2 monitor."""
        param = ""
        if monitor["opcode"] == "data_variable":
            cmd = "getVar:"
            param = monitor["params"]["VARIABLE"]
            color = self.monitorColors["data"]
        elif monitor["opcode"] == "data_listcontents":
            return {
                "listName": monitor["params"]["LIST"],
                "contents": ("value" in monitor and monitor["value"] or []),
                "isPersistent": False,
                "x": monitor["x"],
                "y": monitor["y"],
                "width": monitor["width"],
                "height": monitor["height"],
                "visible": monitor["visible"]
            }
        elif monitor["opcode"] == "looks_costumenumbername":
            if monitor["params"]["NUMBER_NAME"] == "number":
                cmd = "costumeIndex"
                color = self.monitorColors["looks"]
            elif monitor["params"]["NUMBER_NAME"] == "name":
                log.warning("Monitor costume name not supported.")
        elif monitor["opcode"] == "looks_backdropnumbername":
            if monitor["params"]["NUMBER_NAME"] == "number":
                cmd = "backgroundIndex"
            elif monitor["params"]["NUMBER_NAME"] == "name":
                cmd = "sceneName"
            color = self.monitorColors["looks"]
        elif monitor["opcode"] == "sensing_current":
            cmd = "timeAndDate"
            param = monitor["params"]["CURRENTMENU"].lower()
            color = self.monitorColors["sensing"]
        elif monitor["opcode"] in self.monitorOpcodes:
            cmd = self.monitorOpcodes[monitor["opcode"]]
            color = self.monitorColors[monitor["opcode"].split("_")[0]]
        else:
            log.warning("Unkown monitor '%s'" % monitor["opcode"])
            return None # TODO Here
        
        if monitor["spriteName"]:
            label = monitor["spriteName"] + ": " + param
        else:
            label = param
        
        return {
            "target": monitor["spriteName"] or "Stage",
            "cmd": cmd,
            "param": param or None,
            "color": color,
            "label": label,
            "mode": self.monitorModes[monitor["mode"]],
            "sliderMin": ("min" in monitor and monitor["min"] or 0),
            "sliderMax": ("max" in monitor and monitor["max"] or 100),
            "isDiscrete": True,
            "x": monitor["x"],
            "y": monitor["y"],
            "visible": monitor["visible"]
        }

# Run the program if not imported as a module
if __name__ == "__main__":
    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("sb3_path", help="path to the .sb3 or .sprite3 project/sprite, defaults to './project.sb3'", nargs="?", default="./project.sb3")
    parser.add_argument("sb2_path", help="path to the .sb2 or .sprite2 project/sprite, default generated from sb3_path", nargs="?", default="")
    parser.add_argument("-w", "--overwrite", help="overwrite existing files at the sb2 destination", action="store_true")
    parser.add_argument("-d", "--debug", help="save a debug json to './project.json' or './sprite.json' when overwrite is enabled", action="store_true")
    parser.add_argument("-v", "--verbosity", help="controls printed verbosity", action="count", default=0)
    parser.add_argument("-o", "--optimize", help="try to convert all strings to numbers", action="store_true")
    args = parser.parse_args()
    
    # A bit more parsing
    sb3_path = args.sb3_path
    sb2_path = args.sb2_path
    overwrite = args.overwrite
    debug = args.debug
    verbosity = args.verbosity
    optimize = args.optimize

    # Get the verbosity level
    if verbosity == 0:
        verbosity = 30
    elif verbosity == 1:
        verbosity = 20
    elif verbosity == 2:
        verbosity = 10
    elif verbosity >= 3:
        verbosity = 0

    # Configure the logger verbosity
    log.level = verbosity

    # Run the converter with these arguments
    main(sb3_path, sb2_path, overwrite, optimize, debug)

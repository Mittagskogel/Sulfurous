const util = require('util');


fileref = {};
var baseLayerIDC = 0;
var baseLayerIDS = 0;

monitorModes = { "default": 1, "large": 2, "slider": 3 }

//# Maps sb3 opcodes and parameters to sb2 blockcodes
specmap2 = { "motion_movesteps": ["forward:", [["input", "STEPS"]]], "motion_turnright": ["turnRight:", [["input", "DEGREES"]]], "motion_turnleft": ["turnLeft:", [["input", "DEGREES"]]], "motion_pointindirection": ["heading:", [["input", "DIRECTION"]]], "motion_pointtowards": ["pointTowards:", [["input", "TOWARDS"]]], "motion_gotoxy": ["gotoX:y:", [["input", "X"], ["input", "Y"]]], "motion_goto": ["gotoSpriteOrMouse:", [["input", "TO"]]], "motion_glidesecstoxy": ["glideSecs:toX:y:elapsed:from:", [["input", "SECS"], ["input", "X"], ["input", "Y"]]], "motion_changexby": ["changeXposBy:", [["input", "DX"]]], "motion_setx": ["xpos:", [["input", "X"]]], "motion_changeyby": ["changeYposBy:", [["input", "DY"]]], "motion_sety": ["ypos:", [["input", "Y"]]], "motion_ifonedgebounce": ["bounceOffEdge", []], "motion_setrotationstyle": ["setRotationStyle", [["field", "STYLE"]]], "motion_xposition": ["xpos", []], "motion_yposition": ["ypos", []], "motion_direction": ["heading", []], "motion_scroll_right": ["scrollRight", [["input", "DISTANCE"]]], "motion_scroll_up": ["scrollUp", [["input", "DISTANCE"]]], "motion_align_scene": ["scrollAlign", [["field", "ALIGNMENT"]]], "motion_xscroll": ["xScroll", []], "motion_yscroll": ["yScroll", []], "looks_sayforsecs": ["say:duration:elapsed:from:", [["input", "MESSAGE"], ["input", "SECS"]]], "looks_say": ["say:", [["input", "MESSAGE"]]], "looks_thinkforsecs": ["think:duration:elapsed:from:", [["input", "MESSAGE"], ["input", "SECS"]]], "looks_think": ["think:", [["input", "MESSAGE"]]], "looks_show": ["show", []], "looks_hide": ["hide", []], "looks_hideallsprites": ["hideAll", []], "looks_switchcostumeto": ["lookLike:", [["input", "COSTUME"]]], "looks_nextcostume": ["nextCostume", []], "looks_switchbackdropto": ["startScene", [["input", "BACKDROP"]]], "looks_changeeffectby": ["changeGraphicEffect:by:", [["field", "EFFECT"], ["input", "CHANGE"]]], "looks_seteffectto": ["setGraphicEffect:to:", [["field", "EFFECT"], ["input", "VALUE"]]], "looks_cleargraphiceffects": ["filterReset", []], "looks_changesizeby": ["changeSizeBy:", [["input", "CHANGE"]]], "looks_setsizeto": ["setSizeTo:", [["input", "SIZE"]]], "looks_changestretchby": ["changeStretchBy:", [["input", "CHANGE"]]], "looks_setstretchto": ["setStretchTo:", [["input", "STRETCH"]]], "looks_gotofrontback": ["comeToFront", []], "looks_goforwardbackwardlayers": ["goBackByLayers:", [["input", "NUM"]]], "looks_costumenumbername": ["costumeName", []], "looks_backdropnumbername": ["backgroundIndex", []], "looks_size": ["scale", []], "looks_switchbackdroptoandwait": ["startSceneAndWait", [["input", "BACKDROP"]]], "looks_nextbackdrop": ["nextScene", []], "sound_play": ["playSound:", [["input", "SOUND_MENU"]]], "sound_playuntildone": ["doPlaySoundAndWait", [["input", "SOUND_MENU"]]], "sound_stopallsounds": ["stopAllSounds", []], "music_playDrumForBeats": ["playDrum", [["input", "DRUM"], ["input", "BEATS"]]], "music_midiPlayDrumForBeats": ["drum:duration:elapsed:from:", [["input", "DRUM"], ["input", "BEATS"]]], "music_restForBeats": ["rest:elapsed:from:", [["input", "BEATS"]]], "music_playNoteForBeats": ["noteOn:duration:elapsed:from:", [["input", "NOTE"], ["input", "BEATS"]]], "music_setInstrument": ["instrument:", [["input", "INSTRUMENT"]]], "music_midiSetInstrument": ["midiInstrument:", [["input", "INSTRUMENT"]]], "sound_changevolumeby": ["changeVolumeBy:", [["input", "VOLUME"]]], "sound_setvolumeto": ["setVolumeTo:", [["input", "VOLUME"]]], "sound_volume": ["volume", []], "music_changeTempo": ["changeTempoBy:", [["input", "TEMPO"]]], "music_setTempo": ["setTempoTo:", [["input", "TEMPO"]]], "music_getTempo": ["tempo", []], "pen_clear": ["clearPenTrails", []], "pen_stamp": ["stampCostume", []], "pen_penDown": ["putPenDown", []], "pen_penUp": ["putPenUp", []], "pen_setPenColorToColor": ["penColor:", [["input", "COLOR"]]], "pen_changePenHueBy": ["changePenHueBy:", [["input", "HUE"]]], "pen_setPenHueToNumber": ["setPenHueTo:", [["input", "HUE"]]], "pen_changePenShadeBy": ["changePenShadeBy:", [["input", "SHADE"]]], "pen_setPenShadeToNumber": ["setPenShadeTo:", [["input", "SHADE"]]], "pen_changePenSizeBy": ["changePenSizeBy:", [["input", "SIZE"]]], "pen_setPenSizeTo": ["penSize:", [["input", "SIZE"]]], "videoSensing_videoOn": ["senseVideoMotion", [["input", "ATTRIBUTE"], ["input", "SUBJECT"]]], "event_whenflagclicked": ["whenGreenFlag", []], "event_whenkeypressed": ["whenKeyPressed", [["field", "KEY_OPTION"]]], "event_whenthisspriteclicked": ["whenClicked", []], "event_whenbackdropswitchesto": ["whenSceneStarts", [["field", "BACKDROP"]]], "event_whenbroadcastreceived": ["whenIReceive", [["field", "BROADCAST_OPTION"]]], "event_broadcast": ["broadcast:", [["input", "BROADCAST_INPUT"]]], "event_broadcastandwait": ["doBroadcastAndWait", [["input", "BROADCAST_INPUT"]]], "control_wait": ["wait:elapsed:from:", [["input", "DURATION"]]], "control_repeat": ["doRepeat", [["input", "TIMES"], ["input", "SUBSTACK"]]], "control_forever": ["doForever", [["input", "SUBSTACK"]]], "control_if": ["doIf", [["input", "CONDITION"], ["input", "SUBSTACK"]]], "control_if_else": ["doIfElse", [["input", "CONDITION"], ["input", "SUBSTACK"], ["input", "SUBSTACK2"]]], "control_wait_until": ["doWaitUntil", [["input", "CONDITION"]]], "control_repeat_until": ["doUntil", [["input", "CONDITION"], ["input", "SUBSTACK"]]], "control_while": ["doWhile", [["input", "CONDITION"], ["input", "SUBSTACK"]]], "control_for_each": ["doForLoop", [["field", "VARIABLE"], ["input", "VALUE"], ["input", "SUBSTACK"]]], "control_stop": ["stopScripts", [["field", "STOP_OPTION"]]], "control_start_as_clone": ["whenCloned", []], "control_create_clone_of": ["createCloneOf", [["input", "CLONE_OPTION"]]], "control_delete_this_clone": ["deleteClone", []], "control_get_counter": ["COUNT", []], "control_incr_counter": ["INCR_COUNT", []], "control_clear_counter": ["CLR_COUNT", []], "control_all_at_once": ["warpSpeed", [["input", "SUBSTACK"]]], "sensing_touchingobject": ["touching:", [["input", "TOUCHINGOBJECTMENU"]]], "sensing_touchingcolor": ["touchingColor:", [["input", "COLOR"]]], "sensing_coloristouchingcolor": ["color:sees:", [["input", "COLOR"], ["input", "COLOR2"]]], "sensing_distanceto": ["distanceTo:", [["input", "DISTANCETOMENU"]]], "sensing_askandwait": ["doAsk", [["input", "QUESTION"]]], "sensing_answer": ["answer", []], "sensing_keypressed": ["keyPressed:", [["input", "KEY_OPTION"]]], "sensing_mousedown": ["mousePressed", []], "sensing_mousex": ["mouseX", []], "sensing_mousey": ["mouseY", []], "sensing_loudness": ["soundLevel", []], "sensing_loud": ["isLoud", []], "videoSensing_videoToggle": ["setVideoState", [["input", "VIDEO_STATE"]]], "videoSensing_setVideoTransparency": ["setVideoTransparency", [["input", "TRANSPARENCY"]]], "sensing_timer": ["timer", []], "sensing_resettimer": ["timerReset", []], "sensing_of": ["getAttribute:of:", [["field", "PROPERTY"], ["input", "OBJECT"]]], "sensing_current": ["timeAndDate", [["field", "CURRENTMENU"]]], "sensing_dayssince2000": ["timestamp", []], "sensing_username": ["getUserName", []], "sensing_userid": ["getUserId", []], "operator_add": ["+", [["input", "NUM1"], ["input", "NUM2"]]], "operator_subtract": ["-", [["input", "NUM1"], ["input", "NUM2"]]], "operator_multiply": ["*", [["input", "NUM1"], ["input", "NUM2"]]], "operator_divide": ["/", [["input", "NUM1"], ["input", "NUM2"]]], "operator_random": ["randomFrom:to:", [["input", "FROM"], ["input", "TO"]]], "operator_lt": ["<", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_equals": ["=", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_gt": [">", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_and": ["&", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_or": ["|", [["input", "OPERAND1"], ["input", "OPERAND2"]]], "operator_not": ["not", [["input", "OPERAND"]]], "operator_join": ["concatenate:with:", [["input", "STRING1"], ["input", "STRING2"]]], "operator_letter_of": ["letter:of:", [["input", "LETTER"], ["input", "STRING"]]], "operator_length": ["stringLength:", [["input", "STRING"]]], "operator_mod": ["%", [["input", "NUM1"], ["input", "NUM2"]]], "operator_round": ["rounded", [["input", "NUM"]]], "operator_mathop": ["computeFunction:of:", [["field", "OPERATOR"], ["input", "NUM"]]], "data_variable": ["getVar:", [["field", "VARIABLE"]]], "data_setvariableto": ["setVar:to:", [["field", "VARIABLE"], ["input", "VALUE"]]], "data_changevariableby": ["changeVar:by:", [["field", "VARIABLE"], ["input", "VALUE"]]], "data_showvariable": ["showVariable:", [["field", "VARIABLE"]]], "data_hidevariable": ["hideVariable:", [["field", "VARIABLE"]]], "data_listcontents": ["contentsOfList:", [["field", "LIST"]]], "data_addtolist": ["append:toList:", [["input", "ITEM"], ["field", "LIST"]]], "data_deleteoflist": ["deleteLine:ofList:", [["input", "INDEX"], ["field", "LIST"]]], "data_insertatlist": ["insert:at:ofList:", [["input", "ITEM"], ["input", "INDEX"], ["field", "LIST"]]], "data_replaceitemoflist": ["setLine:ofList:to:", [["input", "INDEX"], ["field", "LIST"], ["input", "ITEM"]]], "data_itemoflist": ["getLine:ofList:", [["input", "INDEX"], ["field", "LIST"]]], "data_lengthoflist": ["lineCountOfList:", [["field", "LIST"]]], "data_listcontainsitem": ["list:contains:", [["field", "LIST"], ["input", "ITEM"]]], "data_showlist": ["showList:", [["field", "LIST"]]], "data_hidelist": ["hideList:", [["field", "LIST"]]], "procedures_definition": ["procDef", []], "argument_reporter_string_number": ["getParam", [["field", "VALUE"]]], "procedures_call": ["call", []], "wedo2_motorOnFor": ["LEGO WeDo 2.0.motorOnFor", [["input", "MOTOR_ID"], ["input", "DURATION"]]], "wedo2_motorOn": ["LEGO WeDo 2.0.motorOn", [["input", "MOTOR_ID"]]], "wedo2_motorOff": ["LEGO WeDo 2.0.motorOff", [["input", "MOTOR_ID"]]], "wedo2_startMotorPower": ["LEGO WeDo 2.0.startMotorPower", [["input", "MOTOR_ID"], ["input", "POWER"]]], "wedo2_setMotorDirection": ["LEGO WeDo 2.0.setMotorDirection", [["input", "MOTOR_ID"], ["input", "MOTOR_DIRECTION"]]], "wedo2_setLightHue": ["LEGO WeDo 2.0.setLED", [["input", "HUE"]]], "wedo2_playNoteFor": ["LEGO WeDo 2.0.playNote", [["input", "NOTE"], ["input", "DURATION"]]], "wedo2_whenDistance": ["LEGO WeDo 2.0.whenDistance", [["input", "OP"], ["input", "REFERENCE"]]], "wedo2_whenTilted": ["LEGO WeDo 2.0.whenTilted", [["input", "TILT_DIRECTION_ANY"]]], "wedo2_getDistance": ["LEGO WeDo 2.0.getDistance", []], "wedo2_isTilted": ["LEGO WeDo 2.0.isTilted", [["input", "TILT_DIRECTION_ANY"]]], "wedo2_getTiltAngle": ["LEGO WeDo 2.0.getTilt", [["input", "TILT_DIRECTION"]]], "event_whengreaterthan": ["whenSensorGreaterThan", [["field", "WHENGREATERTHANMENU"], ["input", "VALUE"]]] }

rotationStyles = {
    "all around": "normal", "left-right": "leftRight",
    "don't rotate": "none"
} //# A key for sb3 rotation styles to sb2

staticFields = ["sensing_current", //# Some fields are all caps for some reason
    "looks_changeeffectby", "looks_seteffectto"] //# TODO Add more


//# TODO Make space adjustable based on version made in
var spaceX = 1.5 //# Size adjustment factor
var spaceY = 2.2 //# Works best for projects spaced in sb2


monitorColors = {
    "motion": 4877524, "looks": 9065943,
    "sound": 12272323, "music": 12272323,
    "data": 15629590, "sensing": 2926050
}

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

rotationStyles = {
    "all around": "normal", "left-right": "leftRight",
    "don't rotate": "none"
} //# A key for sb3 rotation styles to sb2


exports.convert = function (sb3, filemap) {
    //Convert the loaded sb3 project to sb2 format
    // Parse all monitors which go with sprites
    sb2 = {};



    monitors = {}
    sb3.monitors.forEach(monitor => {


        monitor2 = parseMonitor(monitor)

        if (monitor2) {
            monitors[monitor["id"]] = monitor2
        }
    });




    // Parse each target(sprite)
    let sprites = []

    sb3.targets.forEach(target => {
        object = parseTarget(target, filemap)



        if (object["objName"] == "Stage") {
            sb2 = object

        } else {

            sprites.push(object)


        }
    });





    // Order the sprites correctly
    sprites.sort();



    //console.log(sprites);





    sb2.children = [];


    // Add the sprites to the stage
    Object.keys(sprites).forEach(sprite => {
        sb2.children.push(sprites[sprite]);
    });

    //Add monitors to the stage
    Object.keys(monitors).forEach(monitor => {
        sb2.children.push(monitors[monitor]);
    });





    // Add info about this converter and project
    sb2["info"] = {
        "userAgent": "sb3tosb2 imfh",
        "flashVersion": "",
        "scriptCount": 0, //# TODO Script count
        "videoOn": false,
        "spriteCount": sprites.length,
        "swfVersion": ""
    }
    return [sb2, fileref]

}



parseMonitor = function (monitor) {




    //Parse a sb3 monitor into an sb2 monitor.
    param = ""
    if (monitor["opcode"] == "data_variable") {
        cmd = "getVar:";
        param = monitor["params"]["VARIABLE"];
        color = monitorColors["data"]
    } else if (monitor["opcode"] == "data_listcontents") {

        return {
            "listName": monitor["params"]["LIST"],
            "contents": monitor.value,
            "isPersistent": false,
            "x": monitor["x"],
            "y": monitor["y"],
            "width": monitor["width"],
            "height": monitor["height"],
            "visible": monitor["visible"]
        }
    }
    else if (monitor["opcode"] == "looks_costumenumbername") {
        if (monitor["params"]["NUMBER_NAME"] == "number") {
            cmd = "costumeIndex"
            color = monitorColors["looks"]
        } else if (monitor["params"]["NUMBER_NAME"] == "name") {
            console.warning("Monitor costume name not supported.")
        }
    } else if (monitor["opcode"] == "looks_backdropnumbername") {
        if (monitor["params"]["NUMBER_NAME"] == "number") {
            cmd = "backgroundIndex"
        } else if (monitor["params"]["NUMBER_NAME"] == "name") {
            cmd = "sceneName"
            color = monitorColors["looks"]
        }
    } else if (monitor["opcode"] == "sensing_current") {
        cmd = "timeAndDate"
        param = monitor["params"]["CURRENTMENU"].lower()
        color = monitorColors["sensing"]
    } else if (monitor["opcode"] in monitorOpcodes) {
        cmd = monitorOpcodes[monitor["opcode"]]
        color = monitorColors[monitor["opcode"].split("_")[0]]
    } else {

        console.warn("Unkown monitor '%s'", monitor["opcode"])
        return undefined // TODO Here
    }
    if (monitor["spriteName"]) {
        label = monitor["spriteName"] + ": " + param
    } else {
        label = param
    }

    if (monitor["spriteName"] != null) {
        target = monitor["spriteName"];
    } else {
        target = "Stage";
    }
    // ("min" in monitor and monitor["min"] or 0)
    //("max" in monitor and monitor["max"] or 100)
    return {

        "target": target,


        "cmd": cmd,
        "param": param,
        "color": color,
        "label": label,
        "mode": monitorModes[monitor["mode"]],
        "sliderMin": monitor.sliderMin,
        "sliderMax": monitor.sliderMax,
        "isDiscrete": true,
        "x": monitor["x"],
        "y": monitor["y"],
        "visible": monitor["visible"]
    }
}

parseTarget = function (target, filemap) {
    //Parses a sb3 target into a sb2 sprite
    // Holds the empty target

    sprites = [] //# Holds the children of the stage




    sprite = { "objName": target["name"] }

    // Get variables
    variables = []
    for (v in target["variables"]) {
        var vari = target["variables"][v]

        if (vari.length == 3 && vari[2]) {
            isCloud = true
        } else {
            isCloud = false
        }
        value = vari[1]
        value = specialNumber(value, false)

        variables.push({
            "name": vari[0],
            "value": value,
            "isPersistent": isCloud
        })


    }
    if (variables.length != 0) {
        sprite["variables"] = variables
    }
    //# Get lists
    lists = []
    for (l in target["lists"]) {
        lst = target["lists"][l]

        //# Get the monitor related to this list
        if (l in monitors) {
            monitor = monitors[l]
        } else {
            monitor = undefined
        }



        // # Convert special values and possibly optimize all numbers
        for (var i = 0; lst[1].length; i++) {
            lst[1][i] = specialNumber(lst[1][i], false)
        }
        lists.push({
            "listName": lst[0],
            "contents": lst[1],
            "isPersistent": false,
            "x": monitor && monitor["x"] || 5,
            "y": monitor && monitor["y"] || 5,
            "width": monitor && monitor["width"] || 104,
            "height": monitor && monitor["height"] || 204,
            "visible": monitor && monitor["visible"] || false
        })

    }

    if (lists.length != 0) {
        sprite["lists"] = lists
    }


    //# Get scripts
    blockIds = [] //# Holds blocks for comment anchoring
    scripts = []
    Object.keys(target["blocks"]).forEach(b => {
        block = target["blocks"][b]



        if (typeof (block) == "object") {
            if (block["topLevel"]) {

                script = parseScript(b, target["blocks"])
                scripts.push(script)

            }
        } else if (Array.isArray(block)) {
            //# Handle reporter values not in a block
            script = [
                Math.round(block[3] / spaceX),
                Math.round(block[4] / spaceY),
                []
            ]

            if (block[0] == 12) { //# Variable reporter
                script[2].push(["readVariable", block[1]]) //# TODO check for hacked blocks
            } else if (block[0] == 13) { //# List reporter
                script[2].push(["contentsOfList:", block[1]])
            }
            scripts.push(script)
            blockIds.push(b)
        }
    });



    if (scripts.length != 0) {
        sprite["scripts"] = scripts
    }
    // Get script comments
    comments = []
    for (c in target["comments"]) {
        comment = target["comments"][c]
        if (comment["blockId"] in blockIds) {
            blockIndex = blockIds.index(comment["blockId"])
        } else {
            blockIndex = -1;
            if (comment["x"] == undefined) {
                comment["x"] = 0
            }
            if (comment["y"] == undefined) {
                comment["y"] = 0
            }
            comments.push([
                Math.round(comment["x"] / spaceX),
                Math.round(comment["y"] / spaceY),
                Math.round(comment["width"] / spaceX),
                Math.round(comment["height"] / spaceY),
                !comment["minimized"],
                blockIndex,
                comment["text"]
            ])
        }
    }
    if (comments.length != 0) {
        sprite["scriptComments"] = comments
    }
    // Get sounds
    sounds = []

    if (target.sounds != 'undefined') {
        target.sounds.forEach(sound => {



            if (sound["assetId"] in filemap[0]) {
                sound2 = filemap[0][sound["assetId"]][1]
            } else {
                sound2 = {
                    "soundName": sound["name"],
                    "soundID": baseLayerIDS,
                    "md5": sound["md5ext"],
                    "sampleCount": sound["sampleCount"],
                    "rate": sound["rate"],
                    "format": ""
                }
                fileref[sound["md5ext"]] = baseLayerIDS;
                baseLayerIDS++;
                filemap[0][sound["assetId"]] = [sound, sound2]
            }
            sounds.push(sound2)
        });
        sprite["sounds"] = sounds
    }






    // Get costumes
    costumes = []

    if (target.costumes != 'undefined') {

        target.costumes.forEach(costume => {

            if (costume["assetId"] in filemap[1]) {
                costume2 = filemap[1][costume["assetId"]][1]
            } else {

                costume2 = {
                    "costumeName": costume["name"],
                    "baseLayerID": baseLayerIDC,
                    "baseLayerMD5": costume["md5ext"],
                    "rotationCenterX": costume["rotationCenterX"],
                    "rotationCenterY": costume["rotationCenterY"]
                }
                fileref[costume["md5ext"]] = baseLayerIDC;
                baseLayerIDC++;
                if (Object.keys(costume).includes("bitmapResolution")) {
                    costume2["bitmapResolution"] = costume["bitmapResolution"]
                    filemap[1][costume["assetId"]] = [costume, costume2]
                }
            }
            costumes.push(costume2)
        });
        sprite["costumes"] = costumes
    }


    // Get other attributes
    sprite["currentCostumeIndex"] = target["currentCostume"]

    if (!target["isStage"]) {
        sprite["scratchX"] = target["x"]
        sprite["scratchY"] = target["y"]
        sprite["scale"] = Math.round(target["size"] / 100)
        sprite["direction"] = target["direction"]
        if (target["rotationStyle"] in rotationStyles) {
            sprite["rotationStyle"] = rotationStyles[target["rotationStyle"]]
        } else {
            sprite["rotationStyle"] = target["rotationStyle"]
        }
        sprite["isDraggable"] = target["draggable"]
        sprite["indexInLibrary"] = sprites.length + 1
        sprite["visible"] = target["visible"]
        sprite["spriteInfo"] = {} //# Always blank
    } else {
        sprite["penLayerMD5"] = "" //# TODO Is there a pen MD5 in sb3?
        sprite["penLayerID"] = ""
        sprite["tempoBPM"] = target["tempo"]
        sprite["videoAlpha"] = ((100 - target["videoTransparency"]) / 100)
    }
    //  console.log("Parsed sprite '%s'" % target["name"])

    return sprite
}

specialNumber = function (value, toNumber = true) {
    //Converts special strings to numbers.
    if (value == "Infinity") {
        value = float("Inf")
    } else if (value == "-Infinity") {
        value = float("-Inf")
    } else if (value == "NaN") {
        value = float("NaN")
    } else if (toNumber) {
        try {
            value = float(value)
            if (value == int(value)) {
                value = int(value)
            }
        } catch (ValueError) {
            // pass # Normal
        }
    }
    return value
}

parseScript = function (id, blocks) {
    //Converts a sb3 script to a sb2 script."""

    // The parsed script to be returned
    var script = []

    // Holds the sb2 block being parsed
    var current = []

    // Holds the list which parsed blocks are added to
    var chain = []

    // Initialize the queue
    let queue = [[id, chain, true]]
    //console.log(queue);
    // Get the position of the script
    script.push(Math.round(blocks[id]["x"] / spaceX))
    script.push(Math.round(blocks[id]["y"] / spaceY))

    // Add the chain to the script
    script.push(chain)

    while (queue.length != 0) {
        // Get the next block to be parsed
        let next = queue.pop(0)



        blockId = next[0]

        if (next[2]) {
            // It's a stack
            current = []
            chain = next[1]
        } else {
            // It's just a block
            current = next[1]
            chain = false

        }

        // Save the id for comment anchoring
        blockIds.push(blockId)

        // Get the sb3 block
        block3 = blocks[blockId]

        // Get the 3.0 opcode
        opcode = block3["opcode"]

        // Get the specmap for the block, handle custom blocks
        argmap = undefined
        if (opcode == "procedures_definition") {
            // Handle custom block definition
            value = block3["inputs"]["custom_block"][1]
            value = blocks[value]["mutation"]
            current.push("procDef")
            current.push(value["proccode"])
            current.push(value["argumentnames"])
            current.push(value["argumentdefaults"])
            if (value["warp"] == "true" || value["warp"] == true) {
                current.push(true)
            } else if (value["warp"] == "false" || value["warp"] == false) {
                current.push(false)
            }
        } else if (opcode == "procedures_call") {
            // Handle custom block call
            value = block3["mutation"]
            current.push("call")
            current.push(value["proccode"])

            // Create a custom argument map
            argmap = []
            for (arg in value["argumentids"]) {
                argmap.push(["input", arg])
            }

        } else if (opcode == "argument_reporter_string_number") {
            // Handle custom block string/number reporter
            current.push("getParam")
            current.push(block3["fields"]["VALUE"][0])
            current.push("r")
        } else if (opcode == "argument_reporter_boolean") {
            // Handle custom block boolean reporter
            current.push("getParam")
            current.push(block3["fields"]["VALUE"][0])
            current.push("b")
            // Handle some sb3 exclusive workarounds
        } else if (opcode == "looks_gotofrontback") {
            // Handle the new front/back argument
            if (block3["fields"]["FRONT_BACK"][0] == "back") {
                current.push("goBackByLayers:")
                current.push(999)
            } else {
                current.push("comeToFront")
            }
        } else if (opcode == "looks_goforwardbackwardlayers") {

            //  console.log(block3)


            // Handle the new fowards/back argument
            current.push("goBackByLayers:")
            try {
                if (block3["fields"]["FORWARD_BACKWARD"][0] == "foward") {
                    current.push(int(block3["inputs"]["NUM"][1][1]) * -1)
                } else {
                    current.push(block3["inputs"]["NUM"][1][1])
                }
            } catch{

                current.push(block3["inputs"]["NUM"][1][1])
            }


        } else if (opcode == "looks_costumenumbername") {
            if (block3["fields"]["NUMBER_NAME"][0] == "name") {
                current.push("costumeName") //# Undefined block
            } else {
                current.push("costumeIndex")
            }
        } else if (opcode == "looks_backdropnumbername") {
            if (block3["fields"]["NUMBER_NAME"][0] == "number") {
                current.push("backgroundIndex")
            } else {
                current.push("sceneName")
            }
        } else if (opcode == "data_deletealloflist") {
            current.push("deleteLine:ofList:")
            current.push("all")
            current.push(block3["fields"]["LIST"][0])
        } else if (opcode in specmap2) {
            // Get the sb2 block id
            current.push(specmap2[opcode][0])

           

           
            // Get the block's argmap
            argmap = specmap2[opcode][1]
        } else {
            // It's probably a Scratch 3 block that this can't convert
            current.push(opcode)

            // Make a custom argmap for it
            argmap = []
            for (field in block3["fields"]) {
                argmap.push(["field", field])
            }
            for (input in block3["inputs"]) {
                argmap.push(["input", input])
            }
        }


        //console.log(current)


        if (argmap != undefined) {
            // Arguments in the queue counter
            q = 0
            //console.log(argmap);
            // Parse each parameter

            for (arg in argmap) {
                let value;


                arg = argmap[arg]

                //console.log("arg "+arg);
                if (arg[0] == "field") {
                    // Get the sb3 field argument
                    value = block3["fields"][arg[1]][0]

                    // Some fields are all caps for some reason
                    if (opcode in staticFields) {
                        value = value.lower()
                    }
                } else if (arg[0] == "input") {

                    if (arg[1] in block3["inputs"]) {
                        try {

                           

                            // Get the sb3 input argument
                            value = parseInput(block3, arg[1], blocks, queue, q)
                            //console.log(value)
                            
                           

                        } catch{
                            console.error("Argument parsing problem.", exc_info = true)
                            value = block3["inputs"][arg[1]]
                        }
                    } else {
                        value = undefined // Empty substacks not always stored?
                    }
                }
                // Add the parsed parameter to the block



                current.push(value)

            }
        }



        // Add the block to the script
        if (chain != []) {
            
            chain.push(current)

        }



        if (chain == false) {
            chain = []
            chain.push(current)
           
        }
       // console.log(chain[1][0])
        
            
    
        //console.log(block3["next"]);

        // Add the next block to the queue
        if (block3["next"] != null) {

            queue.push([block3["next"], chain, true])

        }

    }

    // console.log(util.inspect(script, false, null, true /* enable colors */))

    if (queue != []) {
        script.push(queue);
        //console.log(chain)
     //   console.log(script)
    }

    script.pop([script.length - 1])

     //console.log(script);

    //process.kill();




    return script


}




parseInput = function (block, inp, blocks, queue, q) {
    //# Get the input from the block
    var value;

    //if(inp != "CONDITION"){
    //     return;
    // }


    value = block["inputs"][inp]


    //console.log(value)



    //# Handle possible block input
    if (value[0] == 1) { //# Wrapper; block or value

        if (Array.isArray(value[1])) {
            value = value[1]
        } else {
            value = [2, value[1]]
        }
    } else if (value[0] == 3) { //# Block covering a value

        value = [2, value[1]]
    }

    //process.stdout.write("Value1: ")
    //console.log(value);



    if (value[0] == 2) { //# Block
        value = value[1]

        //  process.stdout.write("Value2: ")
        //console.log(value);

        if (!Array.isArray(value)) { //# Make sure it's not a variable
            if (value in blocks) {

                id = value

                //process.stdout.write("Value3: ")
                //console.log(inp);

                if (blocks[id]["shadow"] && inp in blocks[id]["fields"]) {

                    //# It's probably be a menu
                    value = blocks[id]["fields"][inp][0]
                } else if (inp in ["SUBSTACK", "SUBSTACK2"]) {

                    value = []
                    queue.splice(q, 0, [id, value, true])
                    q += 1
                } else {

                    value = []


                    queue.splice(q, 0, [id, value, false])
                    
                    //   console.log("alive");
                    q += 1
                }


            } else if (value == undefined) {
                //# Blank value in bool input is null in sb3 but false in sb2
                if (!inp in ["SUBSTACK", "SUBSTACK2"]) {
                    value = false
                }
            } else {
                console.warning("Invalid block id: 's'" % value)
            }
            
            return value

        }
    }

    //console.log("tessssssssssss");
    //# Handle number values
    if (value[0] == 4) { //# Float value
        value = value[1]
        // console.log(value);
    } else if (value[0] == 5) { // # UFloat value
        value = value[1]
    } else if (value[0] == 6) { //# UInteger value
        value = value[1]
    } else if (value[0] == 7) { //# Integer value
        value = value[1]
    } else if (value[0] == 8) { //# Float angle value
        value = value[1]
    } else if (value[0] == 9) { //# Hex color value
        try {
            value = int(value[1].strip("#"), 16)
        } catch (ValueError) {
            console.warning("Unable to convert hex: '%s'" % value[1])
            value = value[1]
        }
    } else {
        //# Handle other values
        if (value[0] == 10) { //# String value
            value = value[1]
        } else if (value[0] == 11) { //# Broadcast value
            value = value[1]
        } else if (value[0] == 12) { //# Variable reporter

            blockIds.push(undefined) //# TODO Calculate variable block id
            value = ["readVariable", value[1]]

        } else if (value[0] == 13) { //# List reporter
            blockIds.push(undefined)
            value = ["contentsOfList:", value[1]]
        } else {
            console.warning("Invalid value type: '%s'" % value[1])
        }


        return value
    }
    //# It's a number, try to convert it to one
    value = specialNumber(value, true)





    return value
}
/*
    Philip Picej , Alexander Pichler aka FRALEX
    2019 
    hours wasted: 60 (collaboratively)
*/

// imports
const specMap = require("./specMap").specMap;
const fs = require("fs");

var sb2Out = {}; // resulting sb2 JSON

const varModes = {
    'default': 1,
    'large': 2,
    'slider': 3
}

const rotationStyles = {
    'all around': 'normal',
    'left-right': 'leftRight',
    'don\'t rotate': 'none'
}

const monitorColors = {
    'motion': 4877524,
    'looks': 9065943,
    'sound': 12272323,
    'music': 12272323,
    'sensing': 2926050,
    'data': 15629590
}

var costumeList = {};
var soundList = {};

exports.convert = function (sb3File, fileMap) {
    init_attr(sb3File.targets);
    fileMap = parseMap(sb3File.targets);

    var parsedContent = parseContent(sb3File);

    // console.log(JSON.stringify(parsedContent, null, 2));
    return [parsedContent, fileMap];
}

function init_attr(targets) {
    sb2Out = {
        "objName": "",
        "scripts": [],
        "variables": [],
        "lists": [],
        "sounds": [],
        "costumes": [],
        "scriptComments": [],
        "currentCostumeIndex": 0,

        "tempoBPM": 60,
        "videoAlpha": 0.5,
        "penLayerMD5": "",
        "info": {},

        "children": []
    };
}

function parseMap(targets) {
    var out = {};

    targets.forEach(target => {
        target.costumes.forEach(costume => {
            if (costumeList[costume.assetId] == null)
                costumeList[costume.assetId] = Object.keys(costumeList).length;

            out[costume.md5ext] = costumeList[costume.assetId] + "." + costume.dataFormat;
        });

        target.sounds.forEach(sound => {
            if (soundList[sound.assetId] == null)
                soundList[sound.assetId] = Object.keys(soundList).length;

            out[sound.md5ext] = soundList[sound.assetId] + "." + sound.dataFormat;
        });
    });
    return out;
}

function parseContent(sb3File) {
    var targets = sb3File.targets;
    var monitors = sb3File.monitors;
    var meta = sb3File.meta;

    var temp_startTime = process.hrtime();
    var startTime = temp_startTime[0] * Math.pow(10, 9) + temp_startTime[1];

    targets.forEach(target => {
        if (target.isStage) {
            sb2Out.info = {
                "userAgent": meta.agent,
                "videoOn": target.videoState == "on",
                "scriptCount": 0,
                "spriteCount": targets.length - 1
            };
        } else {
            // std values for child
            sb2Out.children.push({
                "objName": "",
                "scripts": [],
                "variables": [],
                "lists": [],
                "sounds": [],
                "costumes": [],
                "scriptComments": [],
                "currentCostumeIndex": 0,

                "scratchX": 0,
                "scratchY": 0,
                "scale": 1,
                "direction": 90,
                "rotationStyle": "normal",
                "isDraggable": false,
                "indexInLibrary": 0,
                "visible": true,
                "spriteInfo": {},
            });
        }

        // last element in children array
        var lastChild = sb2Out.children[sb2Out.children.length - 1];

        // Object Name
        target.isStage ? sb2Out.objName = target.name : lastChild.objName = target.name;

        //  Variables
        var temp_variables = [];
        Object.keys(target.variables).forEach(variable => {
            // variable[name] = value
            temp_variables.push({
                "name": target.variables[variable][0],
                "value": target.variables[variable][1],
                "isPersistent": target.variables[variable].length >= 3
            });
        });
        target.isStage ? sb2Out.variables = temp_variables : lastChild.variables = temp_variables;

        // Lists
        var temp_lists = [];
        monitors.forEach(monitor => {
            Object.keys(target.lists).forEach(list => {
                if (monitor.id != list)
                    return;

                temp_lists.push({
                    "listName": target.lists[list][0],
                    "contents": target.lists[list][1],
                    "isPersistent": false,
                    "x": monitor.x,
                    "y": monitor.y,
                    "width": monitor.width == 0 ? 100 : monitor.width,
                    "height": monitor.height == 0 ? 200 : monitor.height,
                    "visible": monitor.visible
                });
            });
        });
        target.isStage ? sb2Out.lists = temp_lists : lastChild.lists = temp_lists;

        // Sounds
        var temp_sounds = [];
        target.sounds.forEach(sound => {
            temp_sounds.push({
                "soundName": sound.name,
                "soundID": soundList[sound.assetId],
                "md5": sound.md5ext,
                "sampleCount": sound.sampleCount,
                "rate": sound.rate, // needs to be reworked (change wav file)
                "format": sound.format
            });
        });
        target.isStage ? sb2Out.sounds = temp_sounds : lastChild.sounds = temp_sounds;

        // Costumes
        var temp_costumes = [];
        target.costumes.forEach(costume => {
            temp_costumes.push({
                "costumeName": costume.name,
                "baseLayerID": costumeList[costume.assetId],
                "baseLayerMD5": costume.md5ext,
                "rotationCenterX": costume.rotationCenterX,
                "rotationCenterY": costume.rotationCenterY,
                "bitmapResolution": costume.dataFormat == "svg" ? 1 : costume.bitmapResolution
            });
        });
        target.isStage ? sb2Out.costumes = temp_costumes : lastChild.costumes = temp_costumes;

        // Script Comments
        var temp_scriptComments = [];
        if (target.comments) {
            Object.keys(target.comments).forEach(comment_id => {
                comment_content = target.comments[comment_id];
                temp_scriptComments.push(
                    [
                        parseFloat((comment_content.x / 1.5).toFixed(6)),
                        parseFloat((comment_content.y / 1.8).toFixed(6)),
                        comment_content.width,
                        comment_content.height, !comment_content.minimized, -1,
                        comment_content.text
                    ]
                );
            });
        }
        target.isStage ? sb2Out.scriptComments = temp_scriptComments : lastChild.scriptComments = temp_scriptComments;

        // Current Costume Index
        target.isStage ? sb2Out.currentCostumeIndex = target.currentCostume : lastChild.currentCostumeIndex = target.currentCostume;


        if (target.isStage) {
            // Tempo BPM
            sb2Out.tempoBPM = target.tempo;

            // Video Alpha
            sb2Out.videoAlpha = target.videoTransparency / 100;

            // Scripts
            sb2Out.scripts = parseScripts(target.blocks);

        } else {
            // Additional info for children only
            lastChild.scratchX = target.x;
            lastChild.scratchY = target.y;
            lastChild.scale = parseFloat((target.size / 100).toFixed(6));
            lastChild.direction = target.direction;
            lastChild.rotationStyle = rotationStyles[target.rotationStyle];
            lastChild.isDraggable = target.draggable;
            lastChild.indexInLibrary = target.layerOrder;
            lastChild.visible = target.visible;
            lastChild.spriteInfo = {};

            // Scripts
            lastChild.scripts = parseScripts(target.blocks);
        }
    });

    // Monitor Info
    monitors.forEach(monitor => {
        var sMin = monitor["sliderMin"];
        var sMax = monitor["sliderMax"];

        var param = monitor.params[Object.keys(monitor.params)[0]];

        if (monitor.opcode == "data_listcontents") {
            sb2Out.children.push({
                "listName": monitor.params["LIST"],
                "contents": monitor["value"],
                "isPersistent": false,
                "x": monitor["x"],
                "y": monitor["y"],
                "width": monitor["width"],
                "height": monitor["height"],
                "visible": monitor["visible"]
            });
        } else {
            sb2Out.children.push({
                "target": monitor["spriteName"] == null ? "Stage" : monitor["spriteName"],
                "cmd": monitor.opcode == "data_variable" ? "getVar:" : specMap[monitor.opcode][0],
                "param": param != null ? param.toLowerCase() : param,
                "color": monitorColors[monitor.opcode.split("_")[0]],
                "label": "",
                "mode": varModes[monitor["mode"]],
                "sliderMin": sMin,
                "sliderMax": sMax,
                "isDiscrete": !(String(sMin).includes(".") && String(sMax).includes(".")),
                "x": monitor["x"],
                "y": monitor["y"],
                "visible": monitor["visible"]
            });
        }
    });

    // Log Processing Time
    var temp_endTime = process.hrtime();
    var endTime = temp_endTime[0] * Math.pow(10, 9) + temp_endTime[1];
    console.log("Converter Processing Time: " + ((endTime - startTime) / Math.pow(10, 6)).toFixed(3) + "ms");

    return sb2Out;
}

function solve_all(block, isInput) {
    if (isInput) {
        if (Array.isArray(block[1])) {
            if (block[1][0] == 12) {
                return ["readVariable", block[1][1]];
            } else if (block[1][0] >= 4 && block[1][0] <= 8) {
                var val = parseFloat(block[1][1]);
                return val % 1 == 0 ? val | 0 : val;
            } else if (block[1][0] == 9) {
                return parseInt(block[1][1].toString().substr(1, block[1][1].length - 1), 16);
            } else {
                return block[1][1];
            }
        } else {
            return block[1];
        }
    } else {
        return block[0];
    }
}

function parseScripts(blockList) {
    if (Object.keys(blockList).length == 0)
        return [];

    var topLevelBlocks = Object.keys(blockList).filter(block => blockList[block].topLevel);
    var out = [];

    topLevelBlocks.forEach(block => {
        sb2Out.info.scriptCount += 1;
        out.push(please_work(block, blockList));
    });

    return out;
}

function please_work(blockID, blockList) {
    var solvedBlocks = {};
    var queue = [];

    queue.push(blockID);

    while (queue.length != 0) {
        var solvedBlock = solveBlock(blockList[queue[0]], blockList);

        solvedBlock[1].forEach(element => {
            queue.push(element);
        });

        solvedBlocks[queue[0]] = solvedBlock[0];

        if (blockList[queue[0]].next == null) {
            // may get used later
        } else {
            queue.push(blockList[queue[0]].next);
        }
        queue.shift();
    }

    var out = solveScript(blockID, solvedBlocks, blockList);
    return out;
}

// structure for issue list: 
// code in sb2 (py version): issue in sb2 (own version)

// __fixed (presumably)__
// goBackByLayers: opcode, val (int); no third element
// playDrum: third val zero (should be 0.25)
// rest:elapsed:from: second val zero (should be 0.25)
// noteOn:duration:elapsed:from: third val zero (should be 0.5)
// penColor: wrong color code format (HEX -> DEC)
// deleteClone: should be in brackets
// wait:elapsed:from: second element needs to be int
// scriptComments are empty
// lists need to be at bottom as well

// __may (not) be working__
// deleteLine:ofList:
// insert:at:ofList:
// setLine:ofList:to:
// stringLength: may need "r" as third element
// letter:of: may need "r" as third element
// say:duration:elapsed:from: may need "r" as third element

// __not fixed__
// procDef is wrong
// append:toList: parameter may be in wrong order
// deleteLine:ofList: parameter may be in wrong order
// insert:at:ofList: parameter may be in wrong order
// setLine:ofList:to: parameter may be in wrong order
// 

var edgeCases1 = ["xpos", "ypos", "comeToFront"];
//var edgeCases2 = ["changeSizeBy:", "gotoX:y:", "changeGraphicEffect:By:", "changeVar:By:", "changeYposBy:", "doIf", "createCloneOf"];

function solveBlock(block, blockList) {
    var out = [];
    var blocks = [];

    if (specMap[block.opcode] == undefined) {
        console.log("Undefined: " + block.opcode + "\n");
    }

    if (specMap[block.opcode] != null && specMap[block.opcode][0] != "") {
        //console.log("opcode: " + specMap[block.opcode][0]);

        if (edgeCases1.includes(specMap[block.opcode][0])) {
            out.push([specMap[block.opcode][0]]);
        } else {
            out.push(specMap[block.opcode][0]);
        }
    }

    // Fields
    if (Object.keys(block.fields) != 0) {
        Object.keys(block.fields).forEach(field => {
            var fieldValue = solve_all(block.fields[field], false);

            //console.log("FieldValue: " + fieldValue);


            if (field != "FRONT_BACK" && field != "FORWARD_BACKWARD") {
                out.push(fieldValue);
            }

            if (fieldValue in blockList) {
                blocks.push(fieldValue);
            }

            if (block.opcode == "argument_reporter_string_number") {
                out.push("r");
            }


        });
    }

    // Inputs
    if (Object.keys(block.inputs) != 0) {
        Object.keys(block.inputs).forEach(input => {
            var inputValue = solve_all(block.inputs[input], true);

            // console.log("InputValue: " + inputValue);

            // doesn't make a difference but I'm too scared to delete it
            //if (input == "CONDITION")
            //out.push();

            out.push(inputValue);


            if (inputValue in blockList) {
                blocks.push(inputValue);
            }

            if (block.opcode == "data_addtolist" || block.opcode == "data_deleteoflist") {
                [out[1], out[out.length - 1]] = [out[out.length - 1], out[1]];
            }

            if (block.opcode == "data_insertatlist" && out.length > 3) {
                [out[1], out[2], out[3]] = [out[2], out[3], out[1]];
            }

            if (block.opcode == "data_replaceitemoflist" && out.length > 3) {
                //console.log(out);
                //console.log("_ _ _ _ _ _ _ _");
                [out[1], out[2]] = [out[2], out[1]];
                //console.log(out);
                //console.log("_______________");
            }

        });
    }

    if (out.length == 1 && out != "deleteClone") {
        out = out[0];
    }

    /*
        if (specMap[block.opcode] != null && specMap[block.opcode][0] != "") {
            if (edgeCases2.includes(specMap[block.opcode][0])) {
                //console.log(block);
                if (specMap[block.opcode][0] == "gotoX:y:" && block.inputs.X.length > 2 && block.inputs.Y.length > 2) {
                    return [[out], blocks];
                } else {
                    return [out, blocks];
                }
            } else {
                return [out, blocks];
            }
        } else {
            return [out, blocks];
        }
    */

    return [out, blocks];

}

function solveScript(blockID, solvedBlocks, blockList) {
    var topID = blockID;
    var out = [];

    Object.keys(solvedBlocks).reverse().forEach(block => {
        if (Array.isArray(solvedBlocks[block])) {
            for (let index = 0; index < solvedBlocks[block].length; index++) {
                var element = solvedBlocks[block][index];

                if (element in solvedBlocks) {
                    var stack = [];
                    var currentBlock = solvedBlocks[block][index];
                    var ind = 0;

                    while (true) {
                        ind++;
                        stack.push(solvedBlocks[currentBlock]);

                        if (blockList[currentBlock].next == null) {
                            break;
                        } else {
                            currentBlock = blockList[currentBlock].next;
                        }
                    }

                    if (!Array.isArray(stack[0]) || ind == 1) {
                        stack = stack[0];
                    }

                    solvedBlocks[block][index] = stack;

                    /*
                    if (edgeCases2.includes(solvedBlocks[block][0])) {

                        var temp = solvedBlocks[block];
                        if (temp[0] == "gotoX:y:") {

                            
                            if (block != blockList[blockList[block].parent].next) {
                                solvedBlocks[block] = [solvedBlocks[block]];
                            }
                            
                            if (Array.isArray(temp[1]) && Array.isArray(temp[2])) {
                                tempArr.forEach(block2 => {
                                    if (block == blockList[block2].parent) {
                                        solvedBlocks[block] = [solvedBlocks[block]];
                                        tempArr.pop(blockList[block2].parent);
                                        tempArr.pop(block2);
                                        tempArr.pop(block);
                                    }
                                });
                            }

                            //console.log(block != blockList[blockList[block].parent].next);
                        } else if (temp[0] == "changeSizeBy:") {
                            solvedBlocks[block] = [[solvedBlocks[block]]];

                        } else {
                            solvedBlocks[block] = [solvedBlocks[block]];
                        }
                    }
                    */

                }
            }
        }
    });

    while (true) {

        var edgeCaseOps1 = ["doUntil", "doForever", "doRepeat", "doIf"];
        var edgeCaseOps2 = ["gotoX:y:", "changeSizeBy:", "changeGraphicEffect:by:", "changeVar:by:", "changeYposBy:", "changeXposBy:", "createCloneOf", "lookLike:"];

        //console.log(solvedBlocks[blockID]);
        if (!Array.isArray(solvedBlocks[blockID])) {
            out.push([solvedBlocks[blockID]]);
        } else {
            out.push(solvedBlocks[blockID]);
        }

        var sb3code = blockList[blockID].opcode;
        if (specMap[sb3code] != null) {


            var sb2code = specMap[sb3code][0];

            if (edgeCaseOps1.includes(sb2code)) {
                //console.log(JSON.stringify(out[out.length - 1], null, 2));
                //console.log("\n");

                for (var i = 0; i < out[out.length - 1].length; i++) {
                    var temp = out[out.length - 1][i];

                    console.log(temp);
                    if (edgeCaseOps1.includes(temp[0])) {
                        out[out.length - 1][i] = [out[out.length - 1][i]];
                    }

                    temp = out[out.length - 1][i];

                    // special case for changeVar:by:
                    for (var j = 0; j < temp.length; j++) {
                        if (Array.isArray(temp[j])) {
                            for (var k = 0; k < temp[j].length; k++) {
                                if (Array.isArray(temp[j][k])) {
                                    if (edgeCaseOps2.includes(temp[j][k][0])) {
                                        out[out.length - 1][i][j][k] = [out[out.length - 1][i][j][k]];
                                    }
                                }
                            }
                        }
                    }

                    if (edgeCaseOps2.includes(out[out.length - 1][i][0])) {
                        out[out.length - 1][i] = [out[out.length - 1][i]];
                    }
                }
            }
        }


        //console.log(sb2code);

        /*
        if (sb2code == "doUntil") {
            console.log("doUntil");
            for (var i = 0; i < out[out.length - 1].length; i++) {
                if (out[out.length - 1][i][0] == "gotoX:y:") {
                    out[out.length - 1][i] = [out[out.length - 1][i]];
                }

                if (out[out.length - 1][i][0] == "changeVar:by:") {
                    console.log("changeVar");

                    out[out.length - 1][i] = [out[out.length - 1][i]];
                }
            }
        } if (sb2code == "doForever") {
            for (var i = 0; i < out[out.length - 1].length; i++) {
                if (out[out.length - 1][i][0] == "changeSizeBy:") {
                    out[out.length - 1][i] = [out[out.length - 1][i]];
                }
            }
        } if (sb2code == "doRepeat") {
            for (var i = 0; i < out[out.length - 1].length; i++) {
                if (out[out.length - 1][i][0] == "changeGraphicEffect:by:") {
                    out[out.length - 1][i] = [out[out.length - 1][i]];
                }
            }
        } if (sb2code == "doUntil") {
            for (var i = 0; i < out[out.length - 1].length; i++) {
                if (out[out.length - 1][i][0] == "changeVar:by:") {
                    out[out.length - 1][i] = [out[out.length - 1][i]];
                }
            }
        }
        */

        /*
        if (edgeCases2.includes(sb2code)) {
            var temp = solvedBlocks[blockID];
            console.log(temp);
            if (temp[0] == "gotoX:y:") {

                console.log(blockList[blockID]);

                if (blockID != blockList[blockList[blockID].parent].next) {
                    out[out.length - 1] = [out[out.length - 1]];
                } else if (blockList[blockList[blockID].parent].opcode == "control_repeat_until") {
                    out[out.length - 1][2] = [out[out.length - 1][2]];
                }

            } else if (temp[0] == "changeSizeBy:") {
                solvedBlocks[blockID] = [[solvedBlocks[blockID]]];

            } else {
                solvedBlocks[blockID] = [solvedBlocks[blockID]];
            }
        }
        */

        //console.log(blockList[blockID].parent);

        /*
        if (edgeCases2.includes(solvedBlocks[blockID][0])) {
            var temp = solvedBlocks[blockID];

            if (temp[0] == "gotoX:y:") {
                console.log("____2____");
                console.log(temp);

                if (blockID != blockList[blockList[blockID].parent].next) {
                    out[out.length - 1] = [out[out.length - 1]];

                }
            }
        }
        */

        if (blockList[blockID].next != null) {
            blockID = blockList[blockID].next;
        } else {
            break;
        }
    }

    out = [parseFloat((blockList[topID].x / 1.5).toFixed(6)), parseFloat((blockList[topID].y / 1.8).toFixed(6)), out];

    return out;
}
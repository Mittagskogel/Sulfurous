#!/bin/bash
while true
do
    #echo "CHECKING FOR WORK..."
    for entry in ./sb3/*.sb3; do
        if [ "$entry" != "./sb3/*.sb3" ]
        then
            sb3name="$(cut -d'/' -f3 <<<"$entry")"
            sb2name="./sb2/$(cut -d'.' -f1 <<<"$sb3name").sb2"
            echo "WORK: $sb3name"
            echo "$sb2name"
            python3 ./src/sb3tosb2.py "$entry" "$sb2name"
            mv "$entry" "./sb3/converted/$sb3name"
        fi
        #echo "NO WORK"
    done
	sleep 1
done
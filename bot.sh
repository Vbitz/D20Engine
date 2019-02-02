#!/bin/bash

set -eo xtrace

while :
do
  echo "[bot.sh] Updating Bot"
  
  git pull

  # Not strictly needed but is cleaner for error handling.
  yarn run compile

  if yarn run main bot; then
    echo "[bot.sh] Exited Normally: Updating in 10 seconds"
    sleep 10
  else
    echo "[bot.sh] Bot failed. Exiting."
    exit 0
  fi
done
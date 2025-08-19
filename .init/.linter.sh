#!/bin/bash
cd /home/kavia/workspace/code-generation/virtual-sticky-notes-organizer-7791/sticky_notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


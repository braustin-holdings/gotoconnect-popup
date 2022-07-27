#!/usr/bin/env bash
eval "echo \"$(cat envVars.js)\"" > envVars.js
cat envVars.js

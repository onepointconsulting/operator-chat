@echo off
start cmd /k "yarn start"
timeout /t 2
start cmd /k "yarn client"
start cmd /k "yarn operator" 
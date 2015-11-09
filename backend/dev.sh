#!/bin/bash

# Run tmux/vim

SESSIONNAME="tripwecan"
tmux has-session -t $SESSIONNAME &> /dev/null

if [ $? != 0 ]
then
	tmux new-session -d -s $SESSIONNAME "vim"
	tmux split-window -v -p 25
	tmux split-window -h -p 50 "nodemon app.js"
fi

tmux attach -t $SESSIONNAME


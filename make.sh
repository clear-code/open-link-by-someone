#!/bin/sh

appname=open-link-by-someone

cp buildscript/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh


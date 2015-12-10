#!/bin/sh

appname=open-link-by-someone

cp makexpi/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh


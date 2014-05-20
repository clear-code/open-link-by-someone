setlocal
set appname=open-link-by-someone

copy buildscript\makexpi.sh .\
bash makexpi.sh -n %appname% -o
del makexpi.sh
endlocal

setlocal
set appname=open-link-by-someone

copy makexpi\makexpi.sh .\
bash makexpi.sh -n %appname% -o
del makexpi.sh
endlocal

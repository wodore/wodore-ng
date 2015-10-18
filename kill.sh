#~/bin/sh
for port in 8080 8081 58350; do
    ID=$(fuser $port/tcp | awk 'NF{print $NF; exit}')
    if [ ! "$ID" = "" ]; then 
        echo "Kill $ID, which used port $port."
        kill $ID
    else
        echo "Port $port is clean."
    fi
done


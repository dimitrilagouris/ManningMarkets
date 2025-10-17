
set -e

REQ_FILE="requirements.txt"


if [ ! -f "$REQ_FILE" ]; then
    echo "ELEC3609 Requirements" > "$REQ_FILE"
fi


python3 -m pip install "$@"


for pkg in "$@"; do
    line=$(python3 -m pip freeze | grep -i "^$pkg==" || true)
    if [ -n "$line" ] && ! grep -i -q "^$pkg==" "$REQ_FILE"; then
        echo "$line" >> "$REQ_FILE"
    fi
done

echo "Installed $* and updated $REQ_FILE"

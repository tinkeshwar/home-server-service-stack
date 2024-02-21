#!/bin/bash
ZONE=""
TOKEN=""
DNS_RECORD_ID=""

API_URL="https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/$DNS_RECORD_ID"
LOG_FILE="ip_log.txt"

# Function to get current public IP
get_public_ip() {
    curl -s https://ipinfo.io/ip
}

# Function to send PUT request to API
send_put_request() {
    local ip=$1
    curl --location --request PUT "$API_URL" \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $TOKEN" \
    --data '{
        "content": "'"$ip"'",
        "name": "home.tinkeshwar.com",
        "type": "A"
    }'
}

# Check if log file exists
if [ ! -f $LOG_FILE ]; then
    touch $LOG_FILE
fi

# Get the current public IP
current_ip=$(get_public_ip)

# Get the last recorded IP from the log file
last_ip=$(cat $LOG_FILE)

# Compare IPs
if [ "$current_ip" != "$last_ip" ]; then
    echo "IP changed from $last_ip to $current_ip"

    # Call API to update IP
    send_put_request "$current_ip"

    # Update the log file
    echo $current_ip > $LOG_FILE
else
    echo "IP unchanged: $current_ip"
fi
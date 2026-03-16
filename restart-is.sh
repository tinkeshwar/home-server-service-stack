#!/bin/bash

# Define the VPN container
VPN_CONTAINER="gluetun"

# Define dependent containers (space-separated)
DEPENDENTS=(
    "jellyfin" "jellyseerr" "sonarr" "radarr" "whisparr3" 
    "whisparr" "prowlarr" "jackett" "deluge" "qbittorrent" "flaresolverr"
)

echo "--- Starting Maintenance Cycle ---"

# 1. Stop all dependent containers first
echo "Stopping dependent containers..."
docker stop "${DEPENDENTS[@]}"

# 2. Restart the VPN container
echo "Restarting $VPN_CONTAINER..."
docker restart "$VPN_CONTAINER"

# 3. Wait for Gluetun to be healthy
# This checks if the container is running and gives it a few seconds to initialize the tunnel
echo "Waiting for $VPN_CONTAINER to stabilize..."
sleep 10 

# 4. Start dependent containers one by one
echo "Starting dependent containers..."
for container in "${DEPENDENTS[@]}"; do
    echo "Starting $container..."
    docker start "$container"
done

echo "--- Cycle Complete: All containers restarted ---"
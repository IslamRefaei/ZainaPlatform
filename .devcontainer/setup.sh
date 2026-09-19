#!/bin/bash
set -e

echo "Installing PostgreSQL..."
sudo DEBIAN_FRONTEND=noninteractive apt-get update -q
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q postgresql postgresql-client

echo "Starting PostgreSQL..."
sudo service postgresql start

echo "Creating database..."
sudo -u postgres psql -c "CREATE USER vscode WITH SUPERUSER PASSWORD 'zainarocks';"
sudo -u postgres psql -c "CREATE DATABASE zainaplatform OWNER vscode;"

echo "Installing EF Core tools..."
dotnet tool install --global dotnet-ef
echo 'export PATH=$PATH:$HOME/.dotnet/tools' >> ~/.bashrc

echo "ZainaPlatform dev environment ready ✓"

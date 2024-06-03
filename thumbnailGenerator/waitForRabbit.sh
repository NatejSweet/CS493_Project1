#!/bin/bash

until nc -z  $RABBITMQ_HOST 5672; do
  echo "$(date) - waiting for RabbitMQ server at $RABBITMQ_HOST:5672..."
  sleep 5
done
echo "$(date) - connected successfully to RabbitMQ server at $RABBITMQ_HOST:5672"
# Start service
node ./thumbnailGenerator.js
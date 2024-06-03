status "Running tests\n"
status "Creating Account\n"
curl -v -X POST \
    -H 'Content-Type: application/json' \
    -d '{"email": "test@example.com", "password": "testpassword", "name": "test"}' \
    http://localhost:8000/users

status "Logging in\n"
response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -d '{"email": "test@example.com", "password": "testpassword"}' \
    http://localhost:8000/users/login)

echo "Response: $response"

TOKEN=$(echo $response | jq -r '.token')
echo "Token: $TOKEN"
if [ -n "$TOKEN" ]; then
    echo "Login successful\n"
else
    echo "Login failed\n"
fi

echo "Uploading image\n"
curl -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -F "businessId=1" \
    -F "caption=Your caption" \
    -F "photo=@$(pwd)/Kragmaer_Map.png" \
    http://localhost:8000/photos

echo "Waiting for thumbnail generator to process image\n"
sleep 10;

echo "Downloading  JPG image\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/photos/1.jpg > test.jpg

echo "Downloading  PNG image\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/photos/1.png > test.png

echo "Downloading  JPG image\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/media/thumbs/1.jpg > test1.jpg

echo "Downloading  PNG image\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/media/thumbs/1.png > test1.png

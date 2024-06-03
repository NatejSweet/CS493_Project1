#!/bin/sh

status() {
    printf "\n=====================================================\n"
    printf "%s\n" "$1"
    printf -- "-----------------------------------------------------\n"
}

# status "Purging old data"
# curl -X DELETE http://localhost:8000/businesses/0
# curl -X DELETE http://localhost:8000/businesses/1
# curl -X DELETE http://localhost:8000/businesses/2
# curl -X DELETE http://localhost:8000/businesses/3
# curl -X DELETE http://localhost:8000/reviews/0
# curl -X DELETE http://localhost:8000/reviews/1
# curl -X DELETE http://localhost:8000/reviews/2
# curl -X DELETE http://localhost:8000/reviews/3
# curl -X DELETE http://localhost:8000/photos/0
# curl -X DELETE http://localhost:8000/photos/1
# curl -X DELETE http://localhost:8000/photos/2
# curl -X DELETE http://localhost:8000/photos/3

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
    
status "Getting user by id(1), should return the user we just created"
curl http://localhost:8000/users/1 

status 'POST a new business should return success' 
curl -v POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name": "New Business", "address": "123 Main St", "city": "Veneta", "state":"Oregon", "zip":"97487", "phone": "123-456-7890", "category":" ", "subCategory":" "}' \
    http://localhost:8000/businesses

status 'POST an impropper business should return invalid business'
curl -v POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name": "New Business", "address": "123 Main St", "city": "Veneta", "state":"Oregon", "zip":"97487"}' \
    http://localhost:8000/businesses/

status 'PUT an existing/modified business should return success'
curl -X PUT \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name": "New Business", "address": "123 Main St", "city": "Veneta", "state":"Oregon", "zip":"97487", "phone": "123-456-7890",  "category":" ", "subCategory":" "}' \
    http://localhost:8000/businesses/1
printf "\n"

status 'PUT an existing business with bad data should return bad request'
curl -X PUT \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name": "New Business", "address": "123 Main St", "city": "Veneta", "state":"Oregon", "zip":"97487"}' \
    http://localhost:8000/businesses/1

status 'GET all businesses should return a business'
curl -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/businesses
printf "\n"

status 'GET a business by id should return the previosly created business'
curl -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/businesses/1
printf "\n"

status 'POST a new review should return success'
curl -v POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"businessId": 1, "rating": 5, "cost": 4, "writtenReview": "Great business"}' \
    http://localhost:8000/reviews

status 'POST an impropper review should return bad request'
curl -v POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"businessId": 1,  "rating": 5, "cost": 4}' \
    http://localhost:8000/reviews

status 'PUT an existing review should return success'
curl -X PUT \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"businessId": 1, "rating": 5, "cost": 4, "writtenReview": "Great business"}' \
    http://localhost:8000/reviews/1
printf "\n"

status 'PUT an existing review with bad data should return invalid review'
curl -X PUT \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"businessId": 1, "rating": 5, "cost": 4}' \
    http://localhost:8000/reviews/1


status 'GET a users reviews by their id should return at least one review'
curl -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/users/1/reviews
printf "\n"



status 'POST a new photo should return success'
curl -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -F "businessId=1" \
    -F "caption=Your caption" \
    -F "photo=@$(pwd)/Kragmaer_Map.png" \
    http://localhost:8000/photos

status 'POST an impropper photo should return bad request'
curl -X POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"businessId": 1, "photo": "photoURL"}' \
    http://localhost:8000/photos


status 'GET all businesses owned by a user by id should return at least one business'
curl     -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/users/1/businesses
printf "\n"

status 'GET all reviews for a business by id should return at least one review'
curl     -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/businesses/1/reviews
printf "\n"

status "Downloading JPG image\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/photos/1.jpg > testphoto.jpg

status "Downloading PNG image\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/photos/1.png > testphoto.png

status "Downloading  JPG thumbnail\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/media/thumbs/1.jpg > testthumb.jpg

status "Downloading  PNG thumbnail\n"
curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/media/thumbs/1.png > testthumb.png

#These are commented out because they return an image buffer which floods the commandline, not allowing for previous tests to be looked at

# status 'GET all photos for a business by id should return at least one photo'
# curl     -H 'Content-Type: application/json' \
#     -H "Authorization: Bearer $TOKEN" \
#     http://localhost:8000/businesses/1/photos

# status 'GET all photos for a user by id should return at least one photo'
# curl     -H 'Content-Type: application/json' \
#     -H "Authorization: Bearer $TOKEN" \
#     http://localhost:8000/users/1/photos
# printf "\n"

status 'DELETE a business should return no content'
curl -X DELETE \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/businesses/1

status 'DELETE a review should return no content'
curl -X DELETE \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/reviews/1

status 'DELETE a photo should return no content'
curl -X  DELETE \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/photos/1
printf "\n"

printf "\n"
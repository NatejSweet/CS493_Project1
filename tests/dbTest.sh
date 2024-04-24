echo 'POST a new business should return success'
curl -X POST \
    -H 'Content-Type: application/json' \
    -d '{"name": "New Business", "address": "123 Main St", "city": "Veneta", "state":"Oregon", "zip":"97487", "phone": "123-456-7890"}' \
    http://localhost:8000/businesses

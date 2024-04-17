# Backend API calls

## Creating a Business

    Request:
        POST at '/Businesses'
        data: JSON:
            Required: Name, address, city, state, zip, phone,
            Optional: category, subcategory
    Responses:
        400 - Invalid Business
        201 - Business Created

## Updating a Business

    Request:
        POST at '/Businesses'
        data: JSON:
            Required: Name, address, city, state, zip, phone,
            Optional: category, subcategory
    Responses:
        400 - Invalid Business
        201 - Business Updated

## Deleting a Business

    Request:
        DELETE at '/business/:id'
        data: none
    Responses:
        204 - Business Deleted
        400 - Access Denied(not implimented)

## Viewing all Businesses

    Request:
        GET at '/businesses'
        data: none
    Responses:
        200 - JSON
            {Businesses: paginatedBusinesses}

## Viewing a Business

    Request:
        GET at '/business/:id'
        data: none
    Responses:
        200 - JSON
            {business: business}

## Creating a Review

    Request:
        POST at '/reviews'
        data: JSON
            Required: BusinessId, UserId, rating, cost, writtenReview
    Responses:
        201 - Review Created
        400 - Invalid Review

## Updating a Review

    Request:
        PUT at '/reviews/:id'
        data: JSON
            Required: BusinessId, UserId, rating, cost, writtenReview
    Responses:
        201 - Review Updated
        400 - Invalid Review

## Deleting a Review

    Request:
        DELETE at '/reviews/:id
        data: none
    Responses:
            204 - Review Deleted
            400 - Access Denied(not implimented)

## Getting a Users Reviews

    Request:
        GET at '/users/:id/reviews'
        data: none
    Responses:
        200 - JSON
            {reviews: paginatedReviews}

## Creating a Photo

    Request:
        POST at '/photos'
        data: JSON
            Required: businessId, UserId, photo, caption
    Responses:
        201 - Photo Created
        400 - Invalid Photo

## Deleting a Photo

    Request:
        DELETE at '/photos/:id'
        data: none
    Responses:
        204 - Photo Deleted
        400 - Access Denied(not implimented)

## Getting a users Businesses

    Request:
        GET at '/users/:id/businesses'
        data: none
    Responses:
        200 - JSON
            {businesses: paginatedBusinesses}

## Getting a users Photos

    Request:
        GET at '/users/:id/photos'
        data: none
    Responses:
        200 - JSON
            {photos: paginatedPhotos}

## Getting a Businesses' Reviews

    Request:
        GET at '/businesses/:id/reviews"
        data: none
    Responses:
        200 - JSON
            {reviews: paginatedReviews}

## Getting a Businesses Photos

    Request:
        GET at '/businesses/:id/photos
        data: none
    Responses:
        200 - JSON
            {photos: paginatedPhotos}

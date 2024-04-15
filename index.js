const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const port = process.env.PORT;

app.use(express.static("public"));
app.use(express.json());
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const businessDefiner = {
  name: 1,
  address: 1,
  city: 1,
  state: 1,
  zip: 1,
  phone: 1,
  category: 0,
  subCategory: 0,
};

const imageDefiner = {
  businessId: 1,
  userId: 1,
  photo: 1,
  caption: 1,
};

const reviewDefiner = {
  businessId: 1,
  userId: 1,
  rating: 1,
  cost: 1,
  writtenReview: 1,
};

function validateBusiness(business) {
  for (let key in businessDefiner) {
    if (business[key] == null && businessDefiner[key]) {
      return false;
    }
  }
  return true;
}

function validateImage(image) {
  for (let key in imageDefiner) {
    if (image[key] == null && imageDefiner[key]) {
      return false;
    }
  }
  return true;
}

function validateReview(review) {
  for (let key in reviewDefiner) {
    if (review[key] == null && reviewDefiner[key]) {
      return false;
    }
  }
  return true;
}

function pageinate(pageNumber, pageSize, array) {
  return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}

const businesses = [];
const reviews = [];
const photos = [];
app.post("/businesses", (req, res) => {
  //creating a business
  let business = {
    name: req.body.name,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    phone: req.body.phone,
    category: req.body.category,
    subCategory: req.body.subCategory,
  };
  if (!validateBusiness(business)) {
    res.status(400).send("Invalid business");
  } else {
    businesses.push(business);
    //create in database
    res.status(201).send("Business created");
  }
});
app.put("/businesses/:Id", (req, res) => {
  let id = req.params.Id;
  //updating a business
  let business = {
    name: req.body.name,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    phone: req.body.phone,
    category: req.body.category,
    subCategory: req.body.subCategory,
  };
  //update in database
  if (!validateBusiness(business)) {
    res.status(400).send("Invalid business");
  } else {
    businesses[id] = business;
    res.status(200).send("Business updated");
  }
});

app.delete("/businesses/:Id", (req, res) => {
  //deleting a business
  //check user Id is owner of business
  //delete in database
  let businessId = req.params.Id;
  businesses[businessId] = null;
  res.status(204).send("Business deleted");
});

app.get("/businesses", (req, res) => {
  let filters = req.query.filters;
  //get all businesses in filters
  //get from database
  let pageinatedBusinesses = pageinate(1, 10, businesses);
  res.status(200).send({ businesses: pageinatedBusinesses });
});

app.get("/businesses/:Id", (req, res) => {
  let Id = req.params.Id;
  //get business with Id
  //get from database
  res.status(200).send({ business: businesses[Id] });
});

app.post("/reviews", (req, res) => {
  //creating a review
  let review = {
    businessId: req.body.businessId,
    userId: req.body.userId,
    rating: req.body.rating,
    cost: req.body.cost,
    writtenReview: req.body.writtenReview,
  };
  if (!validateReview(review)) {
    res.status(400).send("Invalid review");
  } else {
    //create in database
    reviews.push(review);
    res.status(201).send("Review created");
  }
});

app.put("/reviews/:Id", (req, res) => {
  let id = req.params.Id;
  //updating a review
  let review = {
    businessId: req.body.businessId,
    userId: req.body.userId,
    rating: req.body.rating,
    cost: req.body.cost,
    writtenReview: req.body.writtenReview,
  };
  if (!validateReview(review)) {
    res.status(400).send("Invalid review");
  } else {
    //update in database
    reviews[id] = review;
    res.status(200).send("Review updated");
  }
});

app.delete("/reviews/:Id", (req, res) => {
  //deleting a review
  let reviewId = req.params.Id;
  let userId = req.body.userId; //probably need to be stored in session
  //check user Id is owner of review
  //delete in database
  reviews[reviewId] = null;
  res.status(204).send("Review deleted");
});

app.get("/users/:Id/reviews", (req, res) => {
  let userId = req.params.Id;
  //get all reviews for user
  //get from database
  let paginatedReviews = pageinate(1, 10, reviews);
  res.status(200).send({ reviews: paginatedReviews });
});

app.post("/photos", (req, res) => {
  //creating a photo
  let photo = {
    businessId: req.body.businessId,
    userId: req.body.userId,
    photo: req.body.photo,
    caption: req.body.caption,
  };

  if (!validateImage(photo)) {
    res.status(400).send("Invalid photo");
  } else {
    //create in database
    photos.push(photo);
    res.status(201).send("Photo created");
  }
});

app.delete("/photos/:Id", (req, res) => {
  //deleting a photo
  let photoId = req.params.Id;
  let userId = req.body.userId; //probably need to be stored in session
  //check user Id is owner of photo
  //delete in database
  photos[photoId] = null;
  res.status(204).send("Photo deleted");
});

app.get("/users/:Id/businesses", (req, res) => {
  //get a users businesses
  let userId = req.params.Id;
  //get all businesses for user
  //get from database
  let businesses = [
    //dummy data since a request like this requires database like searching
    {
      Id: 1,
      name: "business1",
      address: "1234 street",
      city: "city1",
      state: "state1",
      zip: "12345",
      phone: "123-456-7890",
      category: "category1",
      subCategory: "subCategory1",
      link: "/businesses/1",
    },
  ];
  businesses = pageinate(1, 10, businesses);
  res.status(200).send({ businesses: businesses });
});

app.get("/users/:Id/photos", (req, res) => {
  let userId = req.params.Id;
  //get all photos for user
  //get from database
  let photos = [
    //dummy data since a request like this requires database like searching
    {
      Id: 1,
      businessId: 1,
      businessLink: "/businesses/1",
      userId: 1,
      photo: "photo.jpg",
      caption: "caption",
    },
  ];
  photos = pageinate(1, 10, photos);
  res.status(200).send({ photos: photos });
});

app.get("/businesses/:Id/reviews", (req, res) => {
  let businessId = req.params.Id;
  //get all reviews for business
  //get from database
  let reviews = [
    //dummy data since a request like this requires database like searching
    {
      Id: 1,
      businessId: 1,
      userId: 1,
      rating: 5,
      cost: 3,
      writtenReview: "Great place",
    },
  ];
  reviews = pageinate(1, 10, reviews);
  res.status(200).send({ reviews: reviews });
});

app.get("/businesses/:Id/photos", (req, res) => {
  let businessId = req.params.Id;
  //get all photos for business
  //get from database
  let photos = [
    //dummy data since a request like this requires database like searching
    {
      Id: 1,
      businessId: 1,
      userId: 1,
      photo: "photo.jpg",
      caption: "caption",
    },
  ];
  photos = pageinate(1, 10, photos);
  res.status(200).send({ photos: photos });
});

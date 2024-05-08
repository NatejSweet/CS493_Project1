//app
const express = require("express");
const app = express();
//env
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const port = process.env.PORT;
//db
const mysql = require("mysql2/promise");
const mysqlHost = process.env.MYSQL_HOST || "localhost";
const mysqlPort = process.env.MYSQL_PORT || "3306";
const mysqlDB = process.env.MYSQL_DATABASE;
const mysqlUser = process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQL_PASSWORD;
const maxMySQLConnections = 10;
const mysqlPool = mysql.createPool({
  connectionLimit: maxMySQLConnections,
  host: mysqlHost,
  port: mysqlPort,
  database: mysqlDB,
  user: mysqlUser,
  password: mysqlPassword,
});
module.exports = mysqlPool;
//session/token
const jwt = require("jsonwebtoken");
//password ecryption
const bcrypt = require("bcrypt");
const saltRounds = 10;
//app use
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
  id: 1,
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

app.post("/users", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let name = req.body.name;
  try {
    let [rows, fields] = await mysqlPool.query(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );
    if (rows.length > 0) {
      res.status(409).send("Email already exists");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          res.status(500).send("Failed to hash password");
        } else {
          try {
            let [result] = await mysqlPool.query(
              "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
              [email, hash, name]
            );
            let userId = result.insertId;
            let token = jwt.sign({ userId: userId }, process.env.JWT_SECRET);
            res.status(201).send({ token: token });
          } catch (err) {
            console.error(err);
            res.status(500).send("Failed to insert user into database");
          }
        }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to query database");
  }
});

app.post("/users/login", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  await mysqlPool.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, rows) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else if (rows.length == 0) {
        res.status(401).send("Invalid email");
      } else {
        let user = rows[0];
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            res.status(500).send("Internal server error");
          } else if (result) {
            let token = jwt.sign({ userId: user.Id }, process.env.JWT_SECRET);
            res.status(200).send({ token: token });
          } else {
            res.status(401).send("Invalid password");
          }
        });
      }
    }
  );
});

app.get("/users/:Id", (req, res) => {
  let userId = req.headers.authorization.userId;
  mysqlPool.query(
    "SELECT name, email FROM users WHERE Id = ?",
    [userId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else if (results.length == 0) {
        res.status(404).send("User not found");
      } else {
        res.status(200).send({ user: results[0] });
      }
    }
  );
});

app.post("/businesses", (req, res) => {
  let userId = req.headers.authorization.userId;
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
    mysqlPool.query(
      "INSERT INTO businesses (name, address, city, state, zip, phone, category, subCategory, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        business.name,
        business.address,
        business.city,
        business.state,
        business.zip,
        business.phone,
        business.category,
        business.subCategory,
        userId,
      ],
      (err, result) => {
        if (err) {
          console.error("Failed to insert business:", err);
          res.status(500).send("Failed to create business");
        } else {
          console.log("Business created:", result);
          res.status(201).send("Business created\n");
        }
      }
    );
  }
});
app.put("/businesses/:Id", (req, res) => {
  let id = req.headers.authorization.userId;
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
    mysqlPool.query(
      "UPDATE businesses SET name = ?, address = ?, city = ?, state = ?, zip = ?, phone = ?, category = ?, subCategory = ? WHERE Id = ? AND userId = ?",
      [
        business.name,
        business.address,
        business.city,
        business.state,
        business.zip,
        business.phone,
        business.category,
        business.subCategory,
        id,
        userId,
      ],
      (err, result) => {
        if (err) {
          res.status(500).send("Internal server error");
        } else if (result.affectedRows == 0) {
          res.status(403).send("Forbidden"); //not owner
        }
        res.status(200).send("Business updated"); //is owner
      }
    );
  }
});

app.delete("/businesses/:Id", (req, res) => {
  const userId = req.headers.authorization.userId;
  let businessId = req.params.Id;
  mysqlPool(
    "DELETE FROM businesses WHERE Id = ? AND userId = ?",
    [businessId, userId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else if (results.affectedRows == 0) {
        res.status(403).send("Forbidden"); //not owner
      } else {
        res.status(204).send("Business deleted");
      }
    }
  );
});

app.get("/businesses", (req, res) => {
  // let filters = req.query.filters; //This might inlude the page to help paginate
  mysqlPool.query("SELECT name, id FROM businesses", (err, results) => {
    if (err) {
      res.status(500).send("Internal server error");
    } else {
      if (results.length == 0) {
        res.status(404).send("No businesses found");
      }
      let pageinatedBusinesses = pageinate(1, 10, results);
      res.status(200).send({ businesses: pageinatedBusinesses });
    }
  });
});

app.get("/businesses/:Id", (req, res) => {
  let Id = req.params.Id;
  mysqlPool.query(
    "SELECT * FROM businesses WHERE Id = ?",
    [Id],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else if (results.length == 0) {
        res.status(404).send("Business not found");
      }
      res.status(200).send({ business: results });
    }
  );
});

app.post("/reviews", (req, res) => {
  //creating a review
  let review = {
    id: -1,
    businessId: req.body.businessId,
    userId: req.body.userId,
    rating: req.body.rating,
    cost: req.body.cost,
    writtenReview: req.body.writtenReview,
  };
  if (!validateReview(review)) {
    res.status(400).send("Invalid review");
  } else {
    mysqlPool.query(
      "UPDATE reviews SET rating = ?, cost = ?, writtenReview = ? WHERE Id = ? AND userId = ?",
      [review.rating, review.cost, review.writtenReview, review.id, userId],
      (err, result) => {
        if (err) {
          res.status(500).send("Internal server error");
        } else {
          res.status(200).send("Review updated"); //success
        }
      }
    );
  }
});

app.put("/reviews/:Id", (req, res) => {
  let userId = req.headers.authorization.userId;
  //updating a review
  let review = {
    id: req.body.Id,
    businessId: req.body.businessId,
    userId: req.body.userId,
    rating: req.body.rating,
    cost: req.body.cost,
    writtenReview: req.body.writtenReview,
  };
  if (!validateReview(review)) {
    res.status(400).send("Invalid review");
  } else {
    mysqlPool.query(
      "UPDATE reviews SET rating = ?, cost = ?, writtenReview = ? WHERE Id = ? AND userId = ?",
      [review.rating, review.cost, review.writtenReview, review.id, userId],
      (err, result) => {
        if (err) {
          res.status(500).send("Internal server error");
        } else if (result.affectedRows == 0) {
          res.status(403).send("Forbidden"); //not owner
        } else {
          res.status(200).send("Review updated"); //success
        }
      }
    );
  }
});

app.delete("/reviews/:Id", (req, res) => {
  let userId = req.headers.authorization.userId;
  //deleting a review
  let reviewId = req.params.Id;
  mysqlPool.query(
    "DELETE FROM reviews WHERE Id = ? AND userId = ?",
    [reviewId, userId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else if (results.affectedRows == 0) {
        res.status(403).send("Forbidden"); //not owner
      } else {
        res.status(204).send("Review deleted");
      }
    }
  );
});

app.get("/users/:Id/reviews", (req, res) => {
  let userId = req.headers.authorization.userId;
  mysqlPool.query(
    "SELECT * FROM reviews WHERE userId = ?",
    [userId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      }
      let paginatedReviews = pageinate(1, 10, results);
      res.status(200).send({ reviews: paginatedReviews });
    }
  );
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
    mysqlPool.query(
      "INSERT INTO photos (businessId, userId, photo, caption) VALUES (?, ?, ?, ?)",
      [photo.businessId, photo.userId, photo.photo, photo.caption],
      (err, result) => {
        if (err) {
          res.status(500).send("Internal server error");
        } else if (result.affectedRows == 0) {
          res.status(500).send("Internal server error"); //no rows affected
        } else {
          res.status(201).send("Photo created");
        }
      }
    );
  }
});

app.delete("/photos/:Id", (req, res) => {
  let photoId = req.params.Id;
  let userId = req.headers.authorization.userId;
  mysqlPool.query(
    "DELETE FROM photos WHERE Id = ? AND userId = ?",
    [photoId, userId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else if (results.affectedRows == 0) {
        res.status(403).send("Forbidden"); //not owner
      } else {
        res.status(204).send("Photo deleted");
      }
    }
  );
});

app.get("/users/:Id/businesses", (req, res) => {
  //get a users businesses
  let userId = req.headers.authorization.userId;
  mysqlPool.query(
    "SELECT * FROM businesses WHERE userId = ?",
    [userId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else {
        let pageinatedBusinesses = pageinate(1, 10, results);
        res.status(200).send({ businesses: pageinatedBusinesses });
      }
    }
  );
});

app.get("/users/:Id/photos", (req, res) => {
  let userId = req.headers.authorization.userId;
  mysqlPool.query(
    "SELECT * FROM photos WHERE userId = ?",
    [userId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else {
        let paginatedPhotos = pageinate(1, 10, results);
        res.status(200).send({ photos: paginatedPhotos });
      }
    }
  );
});

app.get("/businesses/:Id/reviews", (req, res) => {
  let businessId = req.params.Id;
  mysqlPool.query(
    "SELECT * FROM reviews WHERE businessId = ?",
    [businessId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else {
        let paginatedReviews = pageinate(1, 10, results);
        res.status(200).send({ reviews: paginatedReviews });
      }
    }
  );
});

app.get("/businesses/:id/photos", (req, res) => {
  let businessId = req.params.Id;
  mysqlPool.query(
    "SELECT * FROM photos WHERE businessId = ?",
    [businessId],
    (err, results) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else {
        let paginatedPhotos = pageinate(1, 10, results);
        res.status(200).send({ photos: paginatedPhotos });
      }
    }
  );
  photos = pageinate(1, 10, photos);
  res.status(200).send({ photos: photos });
});

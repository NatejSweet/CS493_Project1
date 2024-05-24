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
// module.exports = mysqlPool;
//session/token
const jwt = require("jsonwebtoken");
//password ecryption
const bcrypt = require("bcrypt");
const saltRounds = 10;
//Image handling (multer, sharp)
const multer = require("multer");
const upload = multer();
const sharp = require("sharp");
//database init
const initDb = async () => {
  const sqlQueries = [
    "CREATE DATABASE IF NOT EXISTS my_database;",
    "USE my_database;",
    "DROP TABLE IF EXISTS `users`;",
    "DROP TABLE IF EXISTS `businesses`;",
    "DROP TABLE IF EXISTS `reviews`;",
    "DROP TABLE IF EXISTS `photos`;",
    `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`password\` varchar(255) NOT NULL,
      \`isAdmin\` BOOLEAN NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`,
    `CREATE TABLE IF NOT EXISTS \`businesses\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`ownerId\` int(11) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`address\` varchar(255) NOT NULL,
      \`city\` varchar(255) NOT NULL,
      \`state\` varchar(255) NOT NULL,
      \`zip\` varchar(255) NOT NULL,
      \`phone\` varchar(255) NOT NULL,
      \`category\` varchar(255) NOT NULL,
      \`subCategory\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`,
    `CREATE TABLE IF NOT EXISTS \`reviews\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`businessId\` int(11) NOT NULL,
      \`userId\` int(11) NOT NULL,
      \`rating\` int(1) NOT NULL,
      \`cost\` int(1) NOT NULL,
      \`writtenReview\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`,
    `CREATE TABLE IF NOT EXISTS \`photos\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`businessId\` int(11) NOT NULL,
      \`userId\` int(11) NOT NULL,
      \`photo\` MEDIUMBLOB NOT NULL,
      \`caption\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`,
  ];

  for (let query of sqlQueries) {
    try {
      await mysqlPool.query(query);
      console.log("another init query");
    } catch (err) {
      console.error(`Failed to execute query: ${query}`);
      console.error(err);
    }
  }
};
let ranDb = false;
if (!ranDb) {
  setTimeout(() => {
    initDb();
  }, 2000);
  ranDb = true;
}

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

function getUserIdFromToken(authorization) {
  let token = authorization.split(" ")[1];
  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.userId;
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
  let [rows, fields] = await mysqlPool.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  if (rows.length == 0) {
    res.status(401).send("Invalid email");
  } else {
    let user = rows[0];
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        res.status(500).send("Internal server error");
      } else if (result) {
        let token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.status(200).send({ token: token });
      } else {
        res.status(401).send("Invalid password");
      }
    });
  }
});

app.get("/users/:id", async (req, res) => {
  let userId = req.params.id;
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let tokenUserId = getUserIdFromToken(req.headers.authorization);
  if (userId != tokenUserId) {
    res.status(403).send("Forbidden");
    return;
  }
  try {
    let [results] = await mysqlPool.query(
      "SELECT name, email FROM users WHERE id = ?",
      [userId]
    );
    if (results.length == 0) {
      res.status(404).send("User not found");
      return;
    } else {
      res.status(200).send({ user: results });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.post("/businesses", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let userId = getUserIdFromToken(req.headers.authorization);
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
    return;
  } else {
    try {
      let results = await mysqlPool.query(
        "INSERT INTO businesses (name, address, city, state, zip, phone, category, subCategory, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        ]
      );
      if (results.affectedRows == 0) {
        res.status(500).send("Internal server error");
      }
      res.status(201).send("Business created");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  }
});

app.put("/businesses/:Id", (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let id = req.params.Id;
  let userId = getUserIdFromToken(req.headers.authorization);
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
    return;
  } else {
    try {
      let result = mysqlPool.query(
        "UPDATE businesses SET name = ?, address = ?, city = ?, state = ?, zip = ?, phone = ?, category = ?, subCategory = ? WHERE Id = ? AND ownerId = ?",
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
        ]
      );
      if (result.affectedRows == 0) {
        res.status(403).send("Forbidden");
      }
      res.status(200).send("Business updated");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  }
});

app.delete("/businesses/:Id", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let userId = getUserIdFromToken(req.headers.authorization);
  let businessId = req.params.Id;
  try {
    let results = await mysqlPool.query(
      "DELETE FROM businesses WHERE Id = ? AND ownerId = ?",
      [businessId, userId]
    );
    if (results.affectedRows == 0) {
      res.status(403).send("Forbidden");
    }
    res.status(204).send("Business deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/businesses", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  // let filters = req.query.filters; //This might inlude the page to help paginate
  try {
    let [rows, fields] = await mysqlPool.query("SELECT * FROM businesses");
    if (rows.length == 0) {
      res.status(404).send("No businesses found");
    }
    let pageinatedBusinesses = pageinate(1, 10, rows);
    res.status(200).send({ businesses: pageinatedBusinesses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/businesses/:Id", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let Id = req.params.Id;
  try {
    let [rows, fields] = await mysqlPool.query(
      "SELECT * FROM businesses WHERE Id = ?",
      [Id]
    );
    if (rows.length == 0) {
      res.status(404).send("Business not found");
    }
    res.status(200).send({ business: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.post("/reviews", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  //creating a review
  let userId = getUserIdFromToken(req.headers.authorization);
  let review = {
    id: -1,
    businessId: req.body.businessId,
    rating: req.body.rating,
    cost: req.body.cost,
    writtenReview: req.body.writtenReview,
  };
  if (!validateReview(review)) {
    res.status(400).send("Invalid review");
    return;
  } else {
    try {
      let [result] = await mysqlPool.query(
        "INSERT INTO reviews (businessId, userId, rating, cost, writtenReview) VALUES (?, ?, ?, ?, ?)",
        [
          review.businessId,
          userId,
          review.rating,
          review.cost,
          review.writtenReview,
        ]
      );
      if (result.affectedRows == 0) {
        res.status(500).send("Internal server error");
      } else {
        res.status(200).send("Review Created"); //success
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  }
});

app.put("/reviews/:id", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let userId = getUserIdFromToken(req.headers.authorization);
  //updating a review
  let review = {
    id: req.params.id,
    businessId: req.body.businessId,
    rating: req.body.rating,
    cost: req.body.cost,
    writtenReview: req.body.writtenReview,
  };
  if (!validateReview(review)) {
    res.status(400).send("Invalid review");
    return;
  } else {
    try {
      let [results] = await mysqlPool.query(
        "UPDATE reviews SET rating = ?, cost = ?, writtenReview = ? WHERE Id = ? AND userId = ?",
        [review.rating, review.cost, review.writtenReview, review.id, userId]
      );
      if (results.affectedRows == 0) {
        res.status(403).send("Forbidden");
      } else {
        res.status(200).send("Review updated");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  }
});

app.delete("/reviews/:id", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let userId = getUserIdFromToken(req.headers.authorization);
  //deleting a review
  let reviewId = req.params.id;
  try {
    let results = await mysqlPool.query(
      "DELETE FROM reviews WHERE Id = ? AND userId = ?",
      [reviewId, userId]
    );
    if (results.affectedRows == 0) {
      res.status(403).send("Forbidden");
    } else {
      res.status(204).send("Review deleted");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/users/:id/reviews", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let userId = getUserIdFromToken(req.headers.authorization);
  if (userId != toeknUserId) {
    res.status(403).send("Forbidden");
    return;
  }
  try {
    let [results] = await mysqlPool.query(
      "SELECT * FROM reviews WHERE userId = ?",
      [userId]
    );
    if (results.length == 0) {
      res.status(404).send("No reviews found");
      return;
    }
    let paginatedReviews = pageinate(1, 10, results);
    res.status(200).send({ reviews: paginatedReviews });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.post("/photos", upload.single("photo"), async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  //creating a photo
  let userId = getUserIdFromToken(req.headers.authorization);
  let photoBuffer = req.file.buffer;
  if (photoBuffer == null || photoBuffer.length > 64 * 1024 * 1024) {
    res.status(400).send("Photo too large!");
    return;
  }
  let photo = {
    businessId: req.body.businessId,
    userId: userId,
    photo: photoBuffer,
    caption: req.body.caption,
  };
  if (!validateImage(photo)) {
    res.status(400).send("Invalid photo");
    return;
  } else {
    try {
      let [result] = await mysqlPool.query(
        "INSERT INTO photos (businessId, userId, photo, caption) VALUES (?, ?, ?, ?)",
        [photo.businessId, userId, photo.photo, photo.caption]
      );
      if (result.affectedRows == 0) {
        res.status(500).send("Internal server error");
      }
      res.status(201).send("Photo created");
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
      return;
    }
  }
});

app.get("/photos/:Id", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let userId = getUserIdFromToken(req.headers.authorization);
  if (userId == null) {
    res.status(403).send("Forbidden");
    return;
  }
  let photoId = req.params.Id.split(".")[0];
  let photoType = req.params.Id.split(".")[1];

  try {
    let [results] = await mysqlPool.query("SELECT * FROM photos WHERE Id = ?", [
      photoId,
    ]);
    if (results.length == 0) {
      res.status(404).send("Photo not found");
      return;
    }

    // Assuming the photo is stored in a 'photo' column as a binary data
    const photo = results[0].photo;

    // Set the appropriate headers
    res.setHeader("Content-Type", "image/" + photoType);
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + photoId + "." + photoType
    );

    // Send the photo as a file
    res.send(photo);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.delete("/photos/:Id", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let photoId = req.params.Id;
  let userId = req.headers.authorization.userId;
  try {
    let results = await mysqlPool.query(
      "DELETE FROM photos WHERE Id = ? AND userId = ?",
      [photoId, userId]
    );
    if (results.affectedRows == 0) {
      res.status(403).send("Forbidden");
    }
    res.status(204).send("Photo deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/users/:id/businesses", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  //get a users businesses
  let tokenUserId = getUserIdFromToken(req.headers.authorization);
  let userId = req.params.id;
  if (userId != tokenUserId) {
    res.status(403).send("Forbidden");
    return;
  }
  try {
    let [results] = await mysqlPool.query(
      "SELECT * FROM businesses WHERE ownerId = ?",
      [userId]
    );
    if (results.length == 0) {
      res.status(404).send("No businesses found");
      return;
    }
    let paginatedBusinesses = pageinate(1, 10, results);
    res.status(200).send({ businesses: paginatedBusinesses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/users/:id/photos", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let tokenUserId = getUserIdFromToken(req.headers.authorization);
  let userId = req.params.id;
  if (userId != tokenUserId) {
    res.status(403).send("Forbidden");
    return;
  }
  try {
    let [results] = await mysqlPool.query(
      "SELECT * FROM photos WHERE userId = ?",
      [userId]
    );
    if (results.length == 0) {
      res.status(404).send("No photos found");
      return;
    }
    let paginatedPhotos = pageinate(1, 10, results);
    res.status(200).send({ photos: paginatedPhotos });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/businesses/:id/reviews", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let businessId = req.params.id;
  try {
    let [results] = await mysqlPool.query(
      "SELECT * FROM reviews WHERE businessId = ?",
      [businessId]
    );
    if (results.length == 0) {
      res.status(404).send("No reviews found");
      return;
    }
    let paginatedReviews = pageinate(1, 10, results);
    res.status(200).send({ reviews: paginatedReviews });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.get("/businesses/:id/photos", async (req, res) => {
  if (req.headers.authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  let businessId = req.params.id;
  try {
    let [results] = await mysqlPool.query(
      "SELECT * FROM photos WHERE businessId = ?",
      [businessId]
    );
    if (results.length == 0) {
      res.status(404).send("No photos found");
      return;
    }
    let photos = pageinate(1, 10, results);
    res.status(200).send({ photos: photos });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

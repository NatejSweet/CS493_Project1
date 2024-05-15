CREATE DATABASE IF NOT EXISTS my_database;
USE my_database;

DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `businesses`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `images`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `isAdmin` BOOLEAN NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `businesses` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `ownerId` int(11) NOT NULL,
    `name` varchar(255) NOT NULL,
    `address` varchar(255) NOT NULL,
    `city` varchar(255) NOT NULL,
    `state` varchar(255) NOT NULL,
    `zip` varchar(255) NOT NULL,
    `phone` varchar(255) NOT NULL,
    `category` varchar(255) NOT NULL,
    `subCategory` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
    `businessId` int(11) NOT NULL,
    `userId` int(11) NOT NULL,
    `rating` int(1) NOT NULL,
    `cost` int(1) NOT NULL,
    `writtenReview` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

const imageDefiner = {
  businessId: 1,
  userId: 1,
  photo: 1,
  caption: 1,
};

CREATE TABLE IF NOT EXISTS `images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `photo`  VARCHAR(24) NOT NULL,
  `caption` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
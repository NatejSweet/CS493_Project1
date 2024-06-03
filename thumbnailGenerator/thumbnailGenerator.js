//env
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
//rabbitmq
const amqp = require("amqplib");
let rabbitmqHost = process.env.RABBITMQ_HOST;
let rabbitmqUser = process.env.RABBITMQ_DEFAULT_USER;
let rabbitmqPass = process.env.RABBITMQ_DEFAULT_PASS;
let rabbitmqUrl = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}`;
//mysql
const mysql = require("mysql2/promise");
const maxMySQLConnections = 10;
const mysqlPool = mysql.createPool({
  connectionLimit: maxMySQLConnections,
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
});

//size of
const sizeOf = require("image-size");
//sharp
const sharp = require("sharp");

async function getDownloadStreamById(id, retries = 5) {
  id = parseInt(id);
  const [result] = await mysqlPool.query(
    "SELECT photo FROM photos WHERE id = ?",
    [id]
  );
  if (!result[0] || !result[0].photo || !(result[0].photo instanceof Buffer)) {
    throw new Error(`No photo found with id ${id}`);
  }
  const photoBuffer = result[0].photo;
  // const dimensions = sizeOf(Buffer.concat([photoBuffer]));
  const thumbnailBuffer = await sharp(Buffer.concat([photoBuffer]))
    .resize(100, 100)
    .toBuffer();

  return thumbnailBuffer;
}

async function updateImageSizeById(thumbnailBuffer, id) {
  const thumbNailUpload = await mysqlPool.query(
    "INSERT INTO thumbnails (photoId, thumb) VALUES (?, ?)",
    [id, thumbnailBuffer]
  );
  let thumbnailId = thumbNailUpload[0].insertId;
  await mysqlPool.query("UPDATE photos SET thumbId = ? WHERE id = ?", [
    thumbnailId,
    id,
  ]);
}

async function getChannel() {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  return channel;
}
async function main() {
  try {
    const channel = await getChannel();
    await channel.assertQueue("images");
    channel.consume("images", async (message) => {
      if (message == null) {
        return;
      }
      const id = message.content.toString();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const thumbnailBuffer = await getDownloadStreamById(id);
      setTimeout(() => {
        channel.close();
      }, 500);
      await updateImageSizeById(thumbnailBuffer, id);
    });
  } catch (err) {
    console.error(err);
  }
}
main();

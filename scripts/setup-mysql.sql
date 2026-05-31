CREATE DATABASE IF NOT EXISTS anybid CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'anybid'@'localhost' IDENTIFIED BY 'anybid_secret';
GRANT ALL PRIVILEGES ON anybid.* TO 'anybid'@'localhost';
FLUSH PRIVILEGES;

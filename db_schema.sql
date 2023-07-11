
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

--create your tables with SQL commands here (watch out for slight syntactical differences with SQLite)

--Commented out the test/dummy data for table creation
-- CREATE TABLE IF NOT EXISTS testUsers (
--     test_user_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     test_name TEXT NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS testUserRecords (
--     test_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     test_record_value TEXT NOT NULL,
--     test_user_id  INT, --the user that the record belongs to
--     FOREIGN KEY (test_user_id) REFERENCES testUsers(test_user_id)
-- );

--Creates a table for blog settings (e.g. title): should store a single entry containing blog details
CREATE TABLE IF NOT EXISTS blog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) DEFAULT  "My Blog" NOT NULL,
    subtitle VARCHAR(500) DEFAULT "Welcome to my blog!",
    author VARCHAR(255) DEFAULT "Author" NOT NULL,
    datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP
);

--Creates a table to store the blog articles
CREATE TABLE IF NOT EXISTS articles(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    datetime_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    datetime_published DATETIME DEFAULT NULL,
    title VARCHAR(500) DEFAULT "My Article" NOT NULL,
    subtitle VARCHAR(500) DEFAULT "My Subtitle" NOT NULL,
    content TEXT DEFAULT "" NOT NULL,
    is_published BOOLEAN DEFAULT 0,
    likes INTEGER DEFAULT 0
);

--Creates a table to store the comments posted on a blog article --> link to article ID via Foreign Key
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) NOT NULL,
    comment VARCHAR(1000) NOT NULL,
    datetime_published DATETIME DEFAULT CURRENT_TIMESTAMP,
    article_id INTEGER NOT NULL,
    FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
);

--insert default data (if necessary here): insert 1 row of defaults into the blog table
INSERT INTO blog DEFAULT VALUES;

--Commented out the test/dummy data for insertions
-- INSERT INTO testUsers ("test_name") VALUES ("Simon Star");
-- INSERT INTO testUserRecords ("test_record_value", "test_user_id") VALUES( "Lorem ipsum dolor sit amet", 1); --try changing the test_user_id to a different number and you will get an error

COMMIT;
    

##  Coursework Template ##
### CM2040 Database Networks and the Web ###

#### Installation requirements ####

* NodeJS 
    - follow the install instructions at https://nodejs.org/en/
    - we recommend using the latest LTS version
* Sqlite3 
    - Windows users: follow instructions here https://www.sqlitetutorial.net/download-install-sqlite/
    - Mac users: it comes preinstalled
    - Linux users: use a package manager eg. apt install

To install all the node packages run ```npm install``` from the project directory

#### Help with node SQLite3 ####

A few aspects SQLite3 work a little differently to mySql but all of the key concepts are the same

Find the API documentation at:
https://github.com/TryGhost/node-sqlite3/wiki/API

Find node SQLite tutorials at:
https://www.sqlitetutorial.net/sqlite-nodejs/
This also a good resource to find examples and tutorials around SQLite queries


#### Using this template ####

This template sets you off in the right direction for your coursework. To get started:

Run ```npm run build-db``` to create the database (database.db)
Run ```npm run start``` to start serving the web app (Access via http://localhost:3000)

You can also run: 
```npm run clean-db``` to delete the database before rebuilding it for a fresh start

#### Added by Ophelia - notes on extra scripts ####
Run ```windows-os-build-db``` to create the database (database.db) on Windows systems
Run ```npm run windows-os-clean-db``` to clean the database on Windows systems
The script ```npm run build-css``` was used to output the public/output.css file from the Tailwind CSS input file.
The script ```npm run watch-css``` was used to watch the Tailwind CSS for changes to apply them continuously.


##### Next steps #####

* Explore the file structure and code
* Read all the comments
* Try accessing each of the routes via the browser - make sure you understand what they do
* Try creating ejs pages for each of the routes that retrieve and display the data
* Try enhancing the ```create-user-record``` page so that you can set the text in the record 
* Try adding new routes and pages to let the user create their own records

##### Creating database tables #####

* All database tables should created by modifying the db_schema.sql 
* This allows us to review and recreate your database simply by running ```npm run build-db```
* Do NOT create or alter database tables through other means


#### Preparing for submission ####

Make a copy of this folder
In your copy, delete the following files and folders:
    * node_modules
    * .git (the hidden folder with your git repository)
    * database.db (your database)

Make sure that your package.json file includes all of the dependencies for your project NB. you need to use the ```--save``` tag each time you use npm to install a dependency

#### Getting started with my project ####

Edit this section to include any settings that should be adjusted in configuration files and concise instructions for how to access the reader and author pages once the app is running.

NB. we will ONLY run ```npm install```, ```npm run build-db```, and ```npm run start``` . We will NOT install additional packages to run your code and will NOT run additional build scripts. Be careful with any additional node dependencies that you use.

#### How to run the app ####
1. Run script ```npm start```
2. Website should be available at `localhost:3000\` with the 'Welcome' Page allowing user to choose between the 'author' and the 'reader' sections
3. Navigate to `localhost:3000\author` to access the Author homepage
4. Navigate to `localhost:3000\reader` to access the Reader homepage

# deal-steal
Web service for comparing online sales offers in terms of quality and affordability relative to other offers.

## Usage

You must first have the MongoDB daemon running. After [installing MongoDB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/), start the daemon (on Ubuntu 18.04 this is done via `$sudo service mongod start`). The application will write to the "dealsteal" database, creating one if it doesn't already exist.

Next, simply run `$./app.js` in the current directory. The server runs on port 3001 by default. You must have `node` installed to run the server. You must also have `npm` installed to satisfy project dependencies (install using `$npm install` in the project root directory).

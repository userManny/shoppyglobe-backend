# ShoppyGlobe Backend API

This project is the backend API for the ShoppyGlobe e-commerce application.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Thunder Client

## API Routes

### Products

GET /products

GET /products/:id

### Authentication

POST /register

POST /login

### Cart

POST /cart

PUT /cart/:id

DELETE /cart/:id

Cart routes require JWT authentication.

## Database

MongoDB Atlas is used to store:

- Products
- Users
- Cart items

## Running the Project

Install dependencies:

npm install

Start the server:

node server.js

The server runs at:

http://localhost:3000
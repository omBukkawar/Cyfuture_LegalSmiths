# Backend Server (Node.js / Express)

This file implements the backend server for the Legal Contract and Case Management system using Node.js, Express, MongoDB, and MySQL. It provides the following functionalities:

- User Authentication

Registration and login using MySQL with password hashing via bcrypt.

- Contract Management

  Upload, store, and retrieve contracts in MongoDB Atlas.

- Case Management

Upload, store, and retrieve legal case files.

- File Uploads

Supports file uploads using Multer with in-memory storage.

- CORS Support

Allows cross-origin requests from frontend applications.

## Server

Runs on http://localhost:5000.

## Collections in MongoDB:

contracts – Stores uploaded contract files.

cases – Stores uploaded case files.

summaries – Stores summaries or notes.

## Technologies & Libraries Used:

Node.js, Express, MySQL2, Mongoose, bcrypt, Multer, CORS

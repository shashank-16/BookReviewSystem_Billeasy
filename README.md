# Book Review System API

A RESTful API for managing books and reviews, built with Node.js, Express, and PostgreSQL.

## Table of Contents
- [Features](#features)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Books](#books)
  - [Reviews](#reviews)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)

## Features
- User authentication with JWT
- CRUD operations for books
- Add, update, and delete reviews
- Search functionality
- Pagination
- Input validation

## API Endpoints

### Authentication

#### Register a New User
- **Endpoint**: `POST /api/signup`
- **Request Body**:
  ```json
  {
    "username": "string (3-30 chars, required)",
    "email": "string (valid email, required)",
    "password": "string (min 6 chars, required)"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/signup \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
  ```

#### User Login
- **Endpoint**: `POST /api/login`
- **Request Body**:
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response**:
  ```json
  {
    "token": "JWT_TOKEN"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  ```
  - Save the returned token for authenticated requests

### Books

#### Get All Books
- **Endpoint**: `GET /api/books`
- **Query Parameters**:
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)
  - `author`: string (optional, filter by author)
  - `genre`: string (optional, filter by genre)
- **cURL Example**:
  ```bash
  # Get first page with 10 books
  curl 'http://localhost:3000/api/books?page=1&limit=10'
  
  # Filter by author
  curl 'http://localhost:3000/api/books?author=J.K. Rowling'
  ```

#### Search Books
- **Endpoint**: `GET /api/books/search`
- **Query Parameters**:
  - `query`: string (required, search term)
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)
- **cURL Example**:
  ```bash
  curl 'http://localhost:3000/api/books/search?query=harry+potter&page=1&limit=5'
  ```

#### Get Book by ID
- **Endpoint**: `GET /api/books/:id`
- **URL Parameters**:
  - `id`: string (required, book ID)
- **cURL Example**:
  ```bash
  curl 'http://localhost:3000/api/books/123e4567-e89b-12d3-a456-426614174000'
  ```

#### Add a New Book (Protected)
- **Endpoint**: `POST /api/books`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "title": "string (required)",
    "author": "string (required)",
    "genre": "string (optional)"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/books \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"title":"The Great Gatsby","author":"F. Scott Fitzgerald","genre":"Classic"}'
  ```

### Reviews

#### Add Review to Book (Protected)
- **Endpoint**: `POST /api/books/:id/reviews`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
- **URL Parameters**:
  - `id`: string (required, book ID)
- **Request Body**:
  ```json
  {
    "review_text": "string (required)",
    "rating": "number (required, 1-5)"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/books/123e4567-e89b-12d3-a456-426614174000/reviews \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"review_text":"This book was amazing!","rating":5}'
  ```

#### Update Review (Protected)
- **Endpoint**: `PUT /api/reviews/:id`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
- **URL Parameters**:
  - `id`: string (required, review ID)
- **Request Body**:
  ```json
  {
    "review_text": "string (optional)",
    "rating": "number (optional, 1-5)"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X PUT http://localhost:3000/api/reviews/456f7890-e89b-12d3-a456-426614175000 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"review_text":"Updated review text","rating":4}'
  ```

#### Delete Review (Protected)
- **Endpoint**: `DELETE /api/reviews/:id`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
- **URL Parameters**:
  - `id`: string (required, review ID)
- **cURL Example**:
  ```bash
  curl -X DELETE http://localhost:3000/api/reviews/456f7890-e89b-12d3-a456-426614175000 \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

## Response Format
All successful responses follow this format:
```json
{
  "data": "response data or array",
  "pagination": {
    "current_page": "number",
    "total_pages": "number",
    "total_items": "number",
    "items_per_page": "number"
  }
}
```

## Error Handling
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Swagger Documentation
- `http://localhost:3000/api-docs`  

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the database migrations Sql:
   ```bash
   psql -U postgres -d bookreview -f config/databaseMigration.sql
   ```
4. Set up environment variables (see .env.example)
5. Start the server:
   ```bash
   npm start
   ```

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## Running the Application
- Development: `npm run dev`
- Production: `npm start`

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

## Database Schema
```
 ┌────────────┐        1           N        ┌────────────┐
 │   users    │────────────────────────────▶│   reviews  │
 └────────────┘                             └────────────┘
     ▲     ▲                                     ▲
     │     │                                     │
     │     └──────────────────────┐              │
     │                            │              │
     │      created_by            │              │
     │                            ▼              │
 ┌────────────┐        1           N        ┌────────────┐
 │   books    │────────────────────────────▶│   reviews  │
 └────────────┘                             └────────────┘

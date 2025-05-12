Simple in-memory CRUD API with horizontal scaling support.

## Features

Basic CRUD operations  
Cluster mode for horizontal scaling  
Test scenarios included

## Installation

1. Clone repo:
```bash
git clone https://github.com/your-repo.git
cd crud-api

```
API Endpoints
```
GET	/api/users	            Get all users
GET	/api/users/{userId}	    Get specific user
POST	/api/users	            Create new user
PUT	/api/users/{userId}	    Update user
DELETE	/api/users/{userId}	    Delete user
```
User Structure
```typescript
interface UserEntity {
  id: string;         // UUID v4
  username: string;
  age: number;
  hobbies: string[];
}
```
npm commands
Run clustered mode (load balanced):
```
npm run start:multi
```
Run dev mode:
```
npm run start:dev
```
Build and run prod build:
```
npm run start:prod
```
Run tests:
```
npm run test
```

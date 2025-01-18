# Ancestree Backend

## Overview

This is the backend repository for Ancestree, a family connection platform designed to help users explore and document their family history.

## Tech Stack

- **Language**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Testing**: Jest

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MongoDB

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Newiie/ancestree-se.git
cd ancestree-se
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=your_aws_region 
AWS_SECRET_ACCESS_KEY=your_secret_access_key
MONGODB_URI=your_mongodb_connection_string
PORT=3001
SECRET=your_jwt_secret
TEST_MONGODB_URI=your_mongodb_connection_string
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

## Available Scripts

- `npm start`: Run the production server
- `npm run dev`: Run the development server with hot reloading
- `npm test`: Run test suite
- `npm run lint`: Run linter

## API Endpoints

- `/api/users`: User management routes
- `/api/login`: Authentication routes
- `/api/trees`: Family tree management routes
- `/api/person`: Person-related routes
- `/api/records`: Records management routes
- `/api/updates`: Update-related routes

## Testing

Run the test suite using:

```bash
npm test
```

## Deployment

Recommended deployment platforms:
- Heroku
- DigitalOcean
- Render
- AWS Elastic Beanstalk

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License.

## Contact

Support: support@ancestree.com
Project Link: [https://github.com/your-username/ancestree-se](https://github.com/your-username/ancestree-se)

---

Developed with ❤️ by the Ancestree Team
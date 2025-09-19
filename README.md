# Employee Management System

A comprehensive Employee Records and Leave Management System with Role-Based Access Control (RBAC) built with Node.js, Express, and MongoDB.

## Features

- **Role-Based Access Control** (Super Admin, HR Manager, Employee)
- **Employee Management** (CRUD operations, department management)
- **Leave Management** (Apply, approve, reject, cancel leaves)
- **Reporting System** (Leave summaries, department reports, activity logs)
- **JWT Authentication** with refresh tokens
- **Security Features** (Rate limiting, input sanitization, CORS)
- **Activity Logging** for audit trails

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Mongo Sanitize
- **Validation**: Joi
- **Password Hashing**: bcryptjs

## Project Structure

```
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── employeeController.js # Employee management
│   ├── leaveController.js    # Leave management
│   └── reportController.js   # Reports and analytics
├── middleware/
│   ├── auth.js              # Authentication & authorization
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Request validation schemas
├── models/
│   ├── ActivityLog.js       # Activity logging model
│   ├── Leave.js            # Leave request model
│   └── User.js             # User/Employee model
├── routes/
│   ├── authRoutes.js       # Authentication routes
│   ├── employeeRoutes.js   # Employee routes
│   ├── leaveRoutes.js      # Leave routes
│   └── reportRoutes.js     # Report routes
├── utils/
│   ├── activityLogger.js   # Activity logging utility
│   ├── jwtUtils.js         # JWT helper functions
│   └── seedData.js         # Database seeding
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
└── server.js             # Application entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-management-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   HOST=0.0.0.0
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/empManagementDB
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
   JWT_REFRESH_EXPIRE=30d
   SUPER_ADMIN_EMAIL=admin@gmail.com
   SUPER_ADMIN_PASSWORD=Admin1234
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Access the API**
   - Server runs on: `http://localhost:5000`
   - Health check: `GET http://localhost:5000/api/health`

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/login` | Public | User login |
| POST | `/refresh-token` | Public | Refresh JWT token |
| POST | `/register` | Super Admin | Register new user |
| POST | `/logout` | Authenticated | User logout |
| GET | `/profile` | Authenticated | Get user profile |

### Employee Routes (`/api/employees`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | HR Manager, Super Admin | Get all employees |
| GET | `/departments` | Authenticated | Get departments list |
| GET | `/:id` | Self, HR Manager, Super Admin | Get employee details |
| PUT | `/:id` | HR Manager, Super Admin | Update employee |
| PATCH | `/:id/deactivate` | HR Manager, Super Admin | Deactivate employee |
| PATCH | `/:id/activate` | HR Manager, Super Admin | Activate employee |

### Leave Routes (`/api/leaves`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Employee | Create leave request |
| GET | `/` | Authenticated | Get leaves (role-filtered) |
| GET | `/balance` | Employee | Get leave balance |
| GET | `/:id` | Authenticated | Get leave details |
| PATCH | `/:id/status` | HR Manager, Super Admin | Approve/reject leave |
| PATCH | `/:id/cancel` | Employee | Cancel leave request |

### Report Routes (`/api/reports`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/leave-summary` | HR Manager, Super Admin | Leave summary report |
| GET | `/department-report` | HR Manager, Super Admin | Department-wise report |
| GET | `/employee/:employeeId/leaves` | HR Manager, Super Admin | Employee leave history |
| GET | `/activity-logs` | HR Manager, Super Admin | System activity logs |

## User Roles & Permissions

### Super Admin
- Full system access
- User management (create, update, deactivate)
- All employee and leave operations
- Access to all reports and logs

### HR Manager
- Employee management (view, update, deactivate)
- Leave approval/rejection
- Access to reports and analytics
- Department management

### Employee
- View own profile and update basic info
- Apply for leaves
- View own leave history and balance
- Cancel own pending leaves

## Request/Response Examples

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "Admin1234"
}
```

### Create Leave Request
```bash
POST /api/leaves
Authorization: Bearer <token>
Content-Type: application/json

{
  "leaveType": "CASUAL",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "reason": "Personal work"
}
```

### Approve Leave
```bash
PATCH /api/leaves/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "approvalComment": "Approved for personal work"
}
```

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Security Features

- **JWT Authentication** with access and refresh tokens
- **Rate Limiting** (100 requests per 15 minutes per IP)
- **Input Sanitization** against NoSQL injection
- **CORS** enabled for cross-origin requests
- **Helmet** for security headers
- **Password Hashing** using bcryptjs
- **Request Validation** using Joi schemas

## Database Models

### User Model
- Personal information (name, email, phone)
- Role-based access (SUPER_ADMIN, HR_MANAGER, EMPLOYEE)
- Department and designation
- Manager relationship
- Account status (ACTIVE/INACTIVE)

### Leave Model
- Leave types (CASUAL, SICK, EARNED)
- Date range and duration
- Approval workflow
- Status tracking (PENDING, APPROVED, REJECTED, CANCELLED)

### Activity Log Model
- User actions tracking
- Timestamp and IP logging
- Audit trail for compliance

## Development

### Available Scripts
- `npm start` - Start the server with nodemon
- `npm run dev` - Development mode with auto-restart
- `npm test` - Run tests (not implemented)

### Environment Variables
All environment variables are documented in `.env.example`. Never commit the actual `.env` file to version control.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see package.json for details

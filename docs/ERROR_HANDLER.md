# Enhanced Global Error Handler Documentation

## Overview

The enhanced global error handler provides human-readable error messages for common database and application errors, particularly focusing on Prisma ORM errors. It converts technical error codes into user-friendly messages and provides appropriate HTTP status codes.

## Features

- ✅ **Prisma Error Handling**: Comprehensive coverage of all major Prisma error codes
- ✅ **Human-Readable Messages**: Technical errors converted to user-friendly messages
- ✅ **Proper HTTP Status Codes**: Each error type gets the appropriate status code
- ✅ **Development Support**: Error details included in development mode
- ✅ **Security**: Sensitive information hidden in production
- ✅ **Authentication Errors**: JWT and token-related error handling
- ✅ **Validation Errors**: Zod and other validation error support
- ✅ **File Upload Errors**: Multer error handling

## Supported Error Types

### Prisma Database Errors

| Error Code | Status Code | User Message                                                                      | Description                          |
| ---------- | ----------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| P2002      | 409         | "Duplicate entry. The {field} already exists."                                    | Unique constraint violation          |
| P2003      | 400         | "Invalid reference. The referenced record does not exist."                        | Foreign key constraint failed        |
| P2001      | 404         | "Record not found. The requested resource does not exist."                        | Record not found                     |
| P2025      | 404         | "Record not found. The operation failed because required records were not found." | Operation depends on missing records |
| P2011      | 400         | "Required field is missing. Please provide all required information."             | Null constraint violation            |
| P2012      | 400         | "Missing required value. Please check your input data."                           | Missing required value               |
| P2013      | 400         | "Missing required argument. Please provide all necessary fields."                 | Missing required argument            |
| P2014      | 400         | "Cannot delete record due to related data. Please remove related records first."  | Required relation would be violated  |
| P2034      | 409         | "Transaction failed due to a conflict. Please try again."                         | Transaction conflict or deadlock     |

### Authentication Errors

| Error Type        | Status Code | User Message                                             |
| ----------------- | ----------- | -------------------------------------------------------- |
| JsonWebTokenError | 401         | "Invalid authentication token. Please log in again."     |
| TokenExpiredError | 401         | "Authentication token has expired. Please log in again." |

### Validation Errors

| Error Type                  | Status Code | User Message                                                    |
| --------------------------- | ----------- | --------------------------------------------------------------- |
| ZodError                    | 400         | "Validation failed. Please check your input data."              |
| PrismaClientValidationError | 400         | "Invalid data provided. Please check your input and try again." |

### File Upload Errors

| Error Code      | Status Code | User Message                                    |
| --------------- | ----------- | ----------------------------------------------- |
| LIMIT_FILE_SIZE | 400         | "File too large. Please upload a smaller file." |

## Usage Examples

### In Route Handlers

```typescript
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.create({
      data: req.body,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    // The global error handler will automatically convert Prisma errors
    // into human-readable messages with appropriate status codes
    next(error);
  }
};
```

### Error Response Format

#### Development Mode

```json
{
  "success": false,
  "message": "Duplicate entry. The email already exists.",
  "error": {
    "type": "DatabaseError",
    "code": "P2002",
    "meta": {
      "target": ["email"]
    }
  }
}
```

#### Production Mode

```json
{
  "success": false,
  "message": "Duplicate entry. The email already exists."
}
```

## Configuration

### Environment Variables

The error handler behavior changes based on the `NODE_ENV` environment variable:

- **Development**: Includes detailed error information in the response
- **Production**: Hides sensitive error details for security

### Custom Error Types

To add support for custom error types, extend the global error handler:

```typescript
// Add this to your globalErrorHandler.ts

// Handle custom application errors
else if (err.name === 'CustomBusinessLogicError') {
  statusCode = StatusCodes.BAD_REQUEST;
  message = `Business rule violation: ${err.message}`;
  errorDetails = {
    type: 'BusinessLogicError',
    rule: err.rule
  };
}
```

## Best Practices

1. **Always Use Next()**: Always pass errors to the global error handler using `next(error)`
2. **Don't Catch and Ignore**: Let the global error handler process all errors
3. **Log Errors**: The handler logs errors in development mode automatically
4. **Monitor Production**: Set up error monitoring in production to catch issues
5. **Test Error Scenarios**: Test different error conditions to ensure proper handling

## Error Code Reference

For a complete list of Prisma error codes, refer to the [Prisma Error Reference](https://www.prisma.io/docs/orm/reference/error-reference).

## Testing

To test the error handler, you can simulate different error conditions:

```typescript
// Test unique constraint violation
const duplicateEmailError = new PrismaClientKnownRequestError("Unique constraint failed", {
  code: "P2002",
  clientVersion: "6.17.1",
  meta: { target: ["email"] },
});

// Test record not found
const notFoundError = new PrismaClientKnownRequestError("Record not found", {
  code: "P2025",
  clientVersion: "6.17.1",
  meta: { cause: "Record to delete does not exist" },
});
```

## Migration from Previous Error Handler

The enhanced error handler is backward compatible. Simply replace your existing global error handler with the new implementation. All existing error handling will continue to work, but you'll get improved error messages and status codes automatically.

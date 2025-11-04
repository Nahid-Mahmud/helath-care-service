import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientInitializationError,
} from "@prisma/client/runtime/library";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "Something went wrong!";
  let errorDetails = err;

  // Handle Prisma Client Known Request Errors
  if (err instanceof PrismaClientKnownRequestError) {
    const { code, meta } = err;

    switch (code) {
      case "P2002":
        statusCode = StatusCodes.CONFLICT;
        message = `Duplicate entry. The ${meta?.target || "field"} already exists.`;
        break;
      case "P2003":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Invalid reference. The referenced record does not exist.`;
        break;
      case "P2004":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Database constraint violation occurred.`;
        break;
      case "P2001":
        statusCode = StatusCodes.NOT_FOUND;
        message = `Record not found. The requested resource does not exist.`;
        break;
      case "P2025":
        statusCode = StatusCodes.NOT_FOUND;
        message = `Record not found. The operation failed because required records were not found.`;
        break;
      case "P2011":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Required field is missing. Please provide all required information.`;
        break;
      case "P2012":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Missing required value. Please check your input data.`;
        break;
      case "P2013":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Missing required argument. Please provide all necessary fields.`;
        break;
      case "P2014":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Cannot delete record due to related data. Please remove related records first.`;
        break;
      case "P2015":
        statusCode = StatusCodes.NOT_FOUND;
        message = `Related record not found. The referenced data does not exist.`;
        break;
      case "P2016":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Query interpretation error. Please check your request format.`;
        break;
      case "P2017":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Records are not properly connected. Please establish the required relationships.`;
        break;
      case "P2018":
        statusCode = StatusCodes.NOT_FOUND;
        message = `Required connected records were not found.`;
        break;
      case "P2019":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Input error. Please check your data format.`;
        break;
      case "P2020":
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Value is out of range for the specified type.`;
        break;
      case "P2021":
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = `Database table does not exist. Please contact support.`;
        break;
      case "P2022":
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = `Database column does not exist. Please contact support.`;
        break;
      case "P2024":
        statusCode = StatusCodes.SERVICE_UNAVAILABLE;
        message = `Database connection timeout. Please try again later.`;
        break;
      case "P2034":
        statusCode = StatusCodes.CONFLICT;
        message = `Transaction failed due to a conflict. Please try again.`;
        break;
      default:
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Database operation failed: ${err.message}`;
    }

    errorDetails = {
      type: "DatabaseError",
      code,
      meta,
    };
  }

  // Handle Prisma Client Validation Errors
  else if (err instanceof PrismaClientValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid data provided. Please check your input and try again.`;
    errorDetails = {
      type: "ValidationError",
      details: err.message,
    };
  }

  // Handle Prisma Client Unknown Request Errors
  else if (err instanceof PrismaClientUnknownRequestError) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = `An unexpected database error occurred. Please try again or contact support.`;
    errorDetails = {
      type: "UnknownDatabaseError",
      details: err.message,
    };
  }

  // Handle Prisma Client Initialization Errors
  else if (err instanceof PrismaClientInitializationError) {
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    message = `Database connection failed. Please try again later.`;
    errorDetails = {
      type: "DatabaseConnectionError",
      code: err.errorCode,
    };
  }

  // Handle JWT Errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = `Invalid authentication token. Please log in again.`;
    errorDetails = {
      type: "AuthenticationError",
    };
  }

  // Handle JWT Expired Errors
  else if (err.name === "TokenExpiredError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = `Authentication token has expired. Please log in again.`;
    errorDetails = {
      type: "AuthenticationError",
    };
  }

  // Handle Validation Errors (like Zod validation)
  else if (err.name === "ZodError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Validation failed. Please check your input data.`;
    errorDetails = {
      type: "ValidationError",
      issues: err.issues,
    };
  }

  // Handle Multer Errors (File Upload)
  else if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `File too large. Please upload a smaller file.`;
    errorDetails = {
      type: "FileUploadError",
    };
  }

  // Handle other common HTTP errors
  else if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status;
    message = err.message || "An error occurred";
    errorDetails = {
      type: "HTTPError",
    };
  }

  // Log the error for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  res.status(statusCode).json({
    success,
    message,
    ...(process.env.NODE_ENV === "development" && { error: errorDetails }),
  });
};

export default globalErrorHandler;

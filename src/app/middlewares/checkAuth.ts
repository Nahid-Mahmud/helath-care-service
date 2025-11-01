import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { UserRole, UserStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import AppError from "../errorHelpers/AppError";

import envVariables from "../../config/env";
import { verifyJwtToken } from "../utils/jwt";

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Access token is required");
      }
      const verifiedToken = verifyJwtToken(accessToken, envVariables.JWT.ACCESS_TOKEN_JWT_SECRET);

      const isUserExist = await prisma.user.findUnique({ where: { email: verifiedToken.email } });

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
      }
      if (isUserExist.status === UserStatus.INACTIVE || isUserExist.status === UserStatus.DELETED) {
        throw new AppError(StatusCodes.BAD_REQUEST, `User is ${isUserExist.status}`);
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to access this resource");
      }

      req.user = verifiedToken;

      next();
    } catch (error) {
      next(error);
    }
  };

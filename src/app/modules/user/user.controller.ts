import { Request, Response } from "express";

import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";

const CreateUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await UserService.CreateUser(payload);

  sendResponse(res, {
    success: true,
    message: "User created successfully",
    data: result ?? null,
    statusCode: StatusCodes.CREATED,
  });
});

export const UserController = {
  CreateUser,
};

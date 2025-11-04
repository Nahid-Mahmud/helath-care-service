import prisma from "../../../config/prisma";
import { Prisma } from "@prisma/client";

const CreateUser = async (payload: Prisma.UserCreateInput) => {
  const res = await prisma.user.create({
    data: payload,
  });
  return res;
};

export const UserService = {
  CreateUser,
};

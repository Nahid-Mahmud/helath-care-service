import prisma from "../../../config/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const CreatePatient = async (payload: Prisma.PatientCreateInput & Prisma.UserCreateInput) => {
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const res = await prisma.$transaction(async (tnx) => {
    /*
     * Create User and Patient records within a transaction
     * If any of the creates fail, the transaction will be rolled back
     */

    await tnx.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
      },
    });

    await tnx.patient.create({
      data: {
        name: payload.name,
        email: payload.email,
      },
    });
  });
  return res;
};

export const UserService = {
  CreatePatient,
};

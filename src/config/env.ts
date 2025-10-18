import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

interface EnvVariables {
  NODE_ENV: "development" | "production";
  PORT: string;
  DATABASE_URL: string;
}

const loadEnvVariable = (): EnvVariables => {
  const requiredEnvVariables = ["NODE_ENV", "PORT", "DATABASE_URL"];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
  };
};

const envVariables = loadEnvVariable();
export default envVariables;

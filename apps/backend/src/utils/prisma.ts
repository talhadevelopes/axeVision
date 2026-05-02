import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "../generated/prisma/client";

export const prisma = new PrismaClient();
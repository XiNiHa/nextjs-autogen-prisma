import { PrismaClient } from "@prisma/client";
import { DMMFClass } from "@prisma/client/runtime";
import { NextApiRequest, NextApiResponse } from "next";
import { getDatabaseName } from "utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient();

  // read prisma DMMF
  const dmmf = (prisma as any)._baseDmmf as DMMFClass;
  const models = dmmf.datamodel.models.map((model) => getDatabaseName(model.name));

  return res.status(200).json(models);
}

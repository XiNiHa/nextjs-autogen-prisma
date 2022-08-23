import { PrismaClient } from "@prisma/client";
import { DMMFClass } from "@prisma/client/runtime";
import { NextApiRequest, NextApiResponse } from "next";
import { getDatabaseName } from "utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient();
  const table = req.query.table as string;

  // read prisma DMMF
  const dmmf = (prisma as any)._baseDmmf as DMMFClass;
  const modelMap = new Map(dmmf.datamodel.models.map(({ name, fields }) => [getDatabaseName(name), fields]));

  // if model or operations is not found, return 404
  if (!modelMap.has(table)) {
    console.log(`got ${table}, model: ${!!modelMap.has(table)}`);
    return res.status(404).end();
  }

  return res.status(200).json(modelMap.get(table));
}

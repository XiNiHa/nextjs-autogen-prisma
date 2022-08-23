import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { DMMFClass } from "@prisma/client/runtime";
import { Method } from "axios";

function getDatabaseName(name: string) {
  return `${name[0].toLowerCase()}${name.slice(1)}`;
}

type Action =
  | "findUnique"
  | "findFirst"
  | "findMany"
  | "create"
  | "createMany"
  | "delete"
  | "update"
  | "deleteMany"
  | "updateMany"
  | "upsert"
  | "aggregate"
  | "groupBy";

export default async function makeAPIFromPrismaModel(req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient();
  // read prisma DMMF
  const dmmf = (prisma as any)._baseDmmf as DMMFClass;

  // table : database table name
  // action : findFirst, findMany, create, update, delete...
  const [table, action] = req.query.custom as [string, Action];

  // read prisma model
  const modelMap = new Map(dmmf.datamodel.models.map(({ name, fields }) => [getDatabaseName(name), fields]));

  // if model or operations is not found, return 404
  if (!modelMap.has(table)) {
    console.log(`got ${table}, model: ${!!modelMap.has(table)}`);
    return res.status(404).end();
  }

  // get db operations (findFirst, findMany, create, update, delete...)
  const _operations = dmmf.mappings.modelOperations.find((_m) => getDatabaseName(_m.model) === table);
  const operations = Object.keys(_operations || {}).filter((_k) => !["model", "plural"].includes(_k));

  // if not valid action, just return 404
  if (!operations.includes(action)) {
    return res.status(404).end();
  }

  function prismaAction(method: Method, status: 200 | 201 | 202 | 203 | 204 | 205 | 206) {
    if (req.method !== method) return res.status(405).end();

    // @ts-ignore
    const response = await prisma[table][prismaAction](req.body);
    return res.status(status).json(response);
  }

  // do some logic with action
  switch (action) {
    // create action, must have data field
    case "create":
      return prismaAction("POST", 201);
    // find one Action, must have where field
    case "findUnique":
    case "findFirst":
      return prismaAction("POST", 200);
    // update action, must have where and data field
    case "update":
      return prismaAction("PUT", 205);
    // delete action, must have where field
    case "delete":
      return prismaAction("DELETE", 204);

    // --- many action ---

    // create many action, data must be array
    case "createMany":
      return prismaAction("POST", 201);
    // findmany action, must have where field
    case "findMany":
      return prismaAction("POST", 200);
    // deletemany action, must have where, data field
    case "updateMany":
      return prismaAction("PUT", 205);
    // deletemany action, must have where, data field
    case "deleteMany":
      return prismaAction("DELETE", 204);
    default: {
      return res.status(405).end();
    }
  }
}

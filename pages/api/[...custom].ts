import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";
import { Method } from "axios";

function getDatabaseName(name: string) {
  return `${name[0].toLowerCase()}${name.slice(1)}`;
}

const Tables = Object.values(Prisma.ModelName).map(getDatabaseName);
type Tables = Uncapitalize<Prisma.ModelName>;
type NonRawAction<T extends string> = T extends `${string}Raw` ? never : T;
type Action = Prisma.PrismaAction extends Prisma.PrismaAction ? NonRawAction<Prisma.PrismaAction> : never;

export default async function makeAPIFromPrismaModel(req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient();

  // table : database table name
  // action : findFirst, findMany, create, update, delete...
  const [table, action] = req.query.custom as [Tables, Action];

  // if the requested table is not found, return 404
  if (!Tables.includes(table)) {
    console.log(`got ${table}, possible options: ${Tables.join(",")}`);
    return res.status(404).end();
  }

  // if not valid action, just return 404
  if (!Object.keys(prisma[table]).includes(action)) {
    return res.status(404).end();
  }

  async function query(method: Method, status: 200 | 201 | 202 | 203 | 204 | 205 | 206) {
    if (req.method !== method) return res.status(405).end();
    const actionFn: (p: any) => any = prisma[table][action];
    const response = await actionFn(req.body);
    return res.status(status).json(response);
  }

  // do some logic with action
  switch (action) {
    // create action, must have data field
    case "create":
      return query("POST", 201);
    // find one Action, must have where field
    case "findUnique":
    case "findFirst":
      return query("POST", 200);
    // update action, must have where and data field
    case "update":
      return query("PUT", 205);
    // delete action, must have where field
    case "delete":
      return query("DELETE", 204);

    // --- many action ---

    // create many action, data must be array
    case "createMany":
      return query("POST", 201);
    // findmany action, must have where field
    case "findMany":
      return query("POST", 200);
    // deletemany action, must have where, data field
    case "updateMany":
      return query("PUT", 205);
    // deletemany action, must have where, data field
    case "deleteMany":
      return query("DELETE", 204);
    default: {
      return res.status(405).end();
    }
  }
}

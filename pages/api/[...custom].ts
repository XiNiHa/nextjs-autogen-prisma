import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { DMMFClass } from "@prisma/client/runtime";

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
  // target : nullable, target to action (example: tokenId)
  const [table, action, target] = req.query.custom as [string, Action, string?];

  // read prisma model
  const modelMap = new Map(dmmf.datamodel.models.map(({ name, fields }) => [getDatabaseName(name), fields]));

  // if model or operations is not found, return 404
  if (!modelMap.has(table)) {
    console.log(`got ${table}, model: ${!!modelMap.has(table)}`);
    return res.status(404).end();
  }

  // get db model
  const model = modelMap.get(table)?.filter((_k) => !_k.isGenerated);
  // get db operations (findFirst, findMany, create, update, delete...)
  const _operations = dmmf.mappings.modelOperations.find((_m) => getDatabaseName(_m.model) === table);
  const operations = Object.keys(_operations || {}).filter((_k) => !["model", "plural"].includes(_k));

  // if not valid action, just return 404
  if (!operations.includes(action)) {
    return res.status(404).end();
  }

  console.log(model);

  const pk = model!.find((f) => f.isId)?.name;

  // do some logic with action
  switch (action) {
    // create action, must have data field
    case "create": {
      if (req.method !== "POST") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action](req.body);
      return res.status(200).json(response);
    }
    // find one Action, must have where field
    case "findUnique":
    case "findFirst": {
      if (!target) return res.status(404).end();
      if (req.method !== "POST") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action](req.body);
      return res.status(200).json(response);
    }
    // update action, must have where and data field
    case "update": {
      if (!target) return res.status(404).end();
      if (req.method !== "PUT") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action]();
      return res.status(201).json(response);
    }
    case "delete": {
      if (!target) return res.status(404).end();
      if (req.method !== "DELETE") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action](req.body);
      return res.status(200).json(response);
    }
    case "createMany": {
      if (req.method !== "POST") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action](req.body);
      return res.status(201).json(response);
    }
    case "findMany": {
      if (req.method !== "POST") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action](req.body);
      return res.status(201).json(response);
    }
    case "updateMany": {
      if (req.method !== "PUT") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action](req.body);
      return res.status(200).json(response);
    }
    case "deleteMany": {
      if (req.method !== "DELETE") return res.status(405).end();

      // @ts-ignore
      const response = await prisma[table][action](req.body);
      return res.status(200).json(response);
    }
    default: {
      return res.status(405).end();
    }
  }

  return res.status(200).end("Hello SCVSoft!!!");
}

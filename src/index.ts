import dotenv from "dotenv";
import http from "node:http";
import { CustomError } from "./helpers";
import { validate, v4 } from "uuid";
import { UUID } from "node:crypto";

const { parsed: envs } = dotenv.config();
const PORT = envs?.["PORT"];

console.log(PORT);

const server = http.createServer();

type ResponseType = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};
server.listen(PORT, () => {
  console.log(`Server running on ${PORT} port.`);
});

const notFoundRes = (res: ResponseType) => {
  res.writeHead(404, "Not found").write("Requested url not found.");

  res.end();
};

const successRes = (res: ResponseType, msg: string, code = 200) => {
  res.writeHead(code, "Success").write(msg);

  res.end();
};

const internalErrorRes = (res: ResponseType, msg = "Error occurred") => {
  res.writeHead(500, "Internal server error").write(msg);
};

const requiredFields: Array<keyof UserEntity> = ["username", "age", "hobbies"];

const isKeyIsValidField = (key: unknown): key is keyof UserEntity =>
  requiredFields.includes(key as keyof UserEntity);

type UserEntity = {
  id: string | UUID;
  username: Required<string>;
  age: Required<number>;
  hobbies: Required<string[]>;
};

const users: UserEntity[] = [];

const checkUserUuid = (id: string) => {
  if (validate(id)) return;

  throw new CustomError({
    message: "User ID is not valid UUID.",
    code: 400,
  });
};

const parseRequestBody = async (req: http.IncomingMessage) => {
  const body: UserEntity | null = await new Promise((res, rej) => {
    let body = "";

    req
      .on("data", (chunk: Buffer) => {
        body += chunk.toString();
      })
      .on("end", () => {
        try {
          res(JSON.parse(body));
        } catch (e) {
          let message = "";
          if (e instanceof Error) message = e.message;

          rej(
            new CustomError({
              message: `Error while parsing request body. ${message}`,
              code: 400,
            })
          );
        }
      });
  });

  if (!body)
    throw new CustomError({
      message: `Error while parsing request body.`,
      code: 400,
    });

  return body;
};

const checkIfUserExists = (userId: string | UUID) => {
  const user = users.find(({ id }) => id === userId);

  if (!user) {
    throw new CustomError({
      message: `User with ${userId} UUID not found.`,
      code: 404,
    });
  }

  return user;
};

server.on("request", async (req, res) => {
  const { url } = req;

  try {
    if (!url)
      throw new CustomError({
        message: "No api endpoint specified.",
        code: 404,
      });

    const [_, path, userId] = url.split("/").filter(Boolean);

    const { method } = req;

    switch (method) {
      case "GET": {
        if (path !== "users")
          throw new CustomError({
            message: "Endpoint not found.",
            code: 404,
          });

        if (!userId) {
          successRes(res, JSON.stringify(users));

          return;
        }

        checkUserUuid(userId);

        const user = checkIfUserExists(userId);

        successRes(res, JSON.stringify(user));

        break;
      }

      case "POST": {
        const body = await parseRequestBody(req);

        const missedFields: string[] = [];

        requiredFields.forEach((field) => {
          if (!body[field as keyof UserEntity]) missedFields.push(field);
        });

        if (missedFields.length)
          throw new CustomError({
            message: `Missed required field${
              missedFields.length > 1 ? "s" : ""
            } ${missedFields.map((field) => `"${field}"`).join(", ")}!`,
            code: 400,
          });

        const user = { ...body, id: v4() };

        users.push(user);

        successRes(res, JSON.stringify(user), 201);

        break;
      }
      case "PUT": {
        if (!userId)
          throw new CustomError({ code: 400, message: "No uuid specified" });
        const body = await parseRequestBody(req);

        checkUserUuid(userId);

        const user = checkIfUserExists(userId);

        Object.entries(body).forEach(([key, value]) => {
          if (key === "id") return;

          if (isKeyIsValidField(key)) user[key] = value as never;
        });

        const spliceIndex = users.findIndex(({ id }) => id === user.id);

        users.splice(spliceIndex, 1, user);

        successRes(res, JSON.stringify(user));
      }

      case "DELETE": {
        if (!userId)
          throw new CustomError({ code: 400, message: "No uuid specified" });

        checkUserUuid(userId);

        const user = checkIfUserExists(userId);

        const spliceIndex = users.findIndex(({ id }) => id === user.id);

        users.splice(spliceIndex);

        successRes(res, JSON.stringify(user), 204);

        break;
      }
      default:
        break;
    }
  } catch (e) {
    if (res.headersSent) {
      console.warn(e);

      return;
    }

    if (e instanceof CustomError) {
      res.writeHead(e.code || 500, e.message).write(e.message);
    } else {
      console.log(e);
      internalErrorRes(res);
    }
  } finally {
    res.end();
  }
});

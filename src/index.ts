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

const requiredFields = ["username", "age", "hobbies"];

type UserEntity = {
  id: string | UUID;
  username: Required<string>;
  age: Required<number>;
  hobbies: Required<string[]>;
};

const users: UserEntity[] = [];

const parseRequestBody = async (
  req: http.IncomingMessage
): Promise<UserEntity | null> => {
  return new Promise((res, rej) => {
    let body = "";

    req
      .on("data", (chunk: Buffer) => {
        body += chunk.toString();
      })
      .on("end", () => {
        try {
          res(JSON.parse(body));
        } catch (e) {
          console.warn(e);
          rej("Error on body parse");
        }
      })
      .on("error", () => rej());
  });
};

server.on("request", async (req, res) => {
  const { url } = req;

  try {
    if (!url)
      throw new CustomError({
        message: "No api endpoint specified.",
        code: 404,
      });

    const [api, path, rest] = url.split("/").filter(Boolean);

    if (!api)
      throw new CustomError({
        message: "No api endpoint specified.",
        code: 404,
      });

    const { method } = req;
    console.log(api, path, rest, method);

    switch (method) {
      case "GET": {
        if (path !== "users")
          throw new CustomError({
            message: "Endpoint not found.",
            code: 404,
          });

        if (!rest) {
          successRes(res, JSON.stringify(users));

          return;
        }

        if (!validate(rest)) {
          throw new CustomError({
            message: "User ID is not valid UUID.",
            code: 400,
          });
        }

        const user = users.find(({ id }) => rest === id);

        if (!user) {
          throw new CustomError({
            message: `User with ${rest} UUID not found.`,
            code: 404,
          });
        }

        successRes(res, JSON.stringify(user));

        break;
      }
      case "POST": {
        const body = await parseRequestBody(req);

        if (!body)
          throw new CustomError({
            message: "Error while parsing request body",
            code: 400,
          });

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
      }
    }
    // successRes(res, "YEAH");
  } catch (e) {
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

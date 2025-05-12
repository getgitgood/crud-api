import dotenv from "dotenv";
import http from "node:http";
import {
  checkIfUserExists,
  checkUserUuid,
  CustomError,
  isKeyIsValidField,
  parseRequestBody,
  requiredFields,
  sendResponse,
} from "./helpers";
import { v4 } from "uuid";

const { parsed: envs } = dotenv.config();
const PORT = envs?.["PORT"];

const server = http.createServer();

server.listen(PORT, () => {
  console.log(`Server running on ${PORT} port.`);
});

const users: UserEntity[] = [];

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

    if (path !== "users")
      throw new CustomError({
        message: "Endpoint not found.",
        code: 404,
      });
    switch (method) {
      case "GET": {
        if (!userId) {
          sendResponse(res, JSON.stringify(users));

          return;
        }

        checkUserUuid(userId);

        const user = checkIfUserExists(users, userId);

        sendResponse(res, JSON.stringify(user));

        break;
      }

      case "POST": {
        const body = await parseRequestBody(req);

        const missedFields: string[] = [];

        requiredFields.forEach((field) => {
          if (!body[field as keyof UserEntity]) missedFields.push(field);
        });

        if (missedFields.length) {
          const message = `Missed required field${
            missedFields.length > 1 ? "s" : ""
          } ${missedFields.map((field) => `"${field}"`).join(", ")}!`;

          throw new CustomError({ message, code: 400 });
        }

        const user = { ...body, id: v4() };

        users.push(user);

        sendResponse(res, JSON.stringify(user), 201);

        break;
      }

      case "PUT": {
        if (!userId)
          throw new CustomError({ code: 400, message: "No uuid specified" });

        const body = await parseRequestBody(req);

        checkUserUuid(userId);

        const user = checkIfUserExists(users, userId);

        Object.entries(body).forEach(([key, value]) => {
          if (key === "id") return;

          if (isKeyIsValidField(key)) user[key] = value as never;
        });

        const spliceIndex = users.findIndex(({ id }) => id === user.id);

        users.splice(spliceIndex, 1, user);

        sendResponse(res, JSON.stringify(user));

        break;
      }

      case "DELETE": {
        if (!userId)
          throw new CustomError({ code: 400, message: "No uuid specified" });

        checkUserUuid(userId);

        const user = checkIfUserExists(users, userId);

        const spliceIndex = users.findIndex(({ id }) => id === user.id);

        users.splice(spliceIndex);

        sendResponse(res, JSON.stringify(user), 204);

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

    if (e instanceof Error && "code" in e) {
      sendResponse(
        res,
        e.message,
        (e.code as number) || 500,
        "Internal Server Error"
      );
    }
  } finally {
    res.end();
  }
});

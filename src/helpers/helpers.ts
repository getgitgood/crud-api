import http from "node:http";
import { CustomError } from "./index";
import { UUID } from "node:crypto";
import { validate } from "uuid";

export const requiredFields: Array<keyof UserEntity> = [
  "username",
  "age",
  "hobbies",
];

export const isKeyIsValidField = (key: unknown): key is keyof UserEntity =>
  requiredFields.includes(key as keyof UserEntity);

export const parseRequestBody = async (req: http.IncomingMessage) => {
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

export const checkIfUserExists = (
  users: UserEntity[],
  userId: string | UUID
) => {
  const user = users.find(({ id }) => id === userId);

  if (!user) {
    throw new CustomError({
      message: `User with ${userId} UUID not found.`,
      code: 404,
    });
  }

  return user;
};

export const checkUserUuid = (id: string) => {
  if (validate(id)) return;

  throw new CustomError({
    message: "User ID is not valid UUID.",
    code: 400,
  });
};

export const sendResponse = (
  res: HttpResponseType,
  msg: string,
  code = 200,
  header = "Success"
) => {
  res
    .writeHead(code, header, { "Content-Type": "application/json" })
    .write(msg);
};

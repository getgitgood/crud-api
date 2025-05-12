import { parseRequestBody } from "../helpers";
import { server } from "../index";
import http from "node:http";

const baseEndpoint = "http://localhost:4000/api/users";
const commonReqConfig = {
  hostname: "localhost",
  port: 4000,
  path: "/api/users",
};

describe("Api testing", () => {
  let createdUserId: string;

  afterAll(() => {
    server.close();
  });

  test("GET request to /api/users returns empty array initially", (done) => {
    const req = http.get(baseEndpoint, async (res) => {
      const data = await parseRequestBody(res);

      expect(res.statusCode).toBe(200);
      expect(data).toEqual([]);
      done();
    });

    req.on("error", done);
  });

  test("POST request to /api/users creates new user", (done) => {
    const postData = JSON.stringify({
      username: "testuser",
      age: 33,
      hobbies: ["testing"],
    });

    const req = http.request(
      { ...commonReqConfig, method: "POST" },
      async (res) => {
        const user = await parseRequestBody(res);

        expect(res.statusCode).toBe(201);
        expect(user.username).toBe("testuser");
        createdUserId = user.id;
        done();
      }
    );
    req.write(postData);
    req.on("error", done);
    req.end();
  });

  test("GET request to /api/users/{id} returns created user", (done) => {
    const req = http.get(`${baseEndpoint}/${createdUserId}`, async (res) => {
      const user = await parseRequestBody(res);

      expect(res.statusCode).toBe(200);
      expect(user.id).toBe(createdUserId);
      done();
    });

    req.on("error", done);
  });

  test("PUT request to /api/users/{id} update existing user", (done) => {
    const postData = JSON.stringify({
      username: "updateduser",
      age: 27,
      hobbies: ["skating"],
    });

    const req = http.request(
      {
        ...commonReqConfig,
        path: `/api/users/${createdUserId}/`,
        method: "PUT",
      },
      async (res) => {
        expect(res.statusCode).toBe(200);

        const user = await parseRequestBody(res);
        expect(user.username).toBe("updateduser");
        expect(user.age).toBe(27);

        createdUserId = user.id;
        done();
      }
    );
    req.write(postData);
    req.on("error", done);
    req.end();
  });

  test("DELETE request to /api/users/{id} delete existing user", (done) => {
    const req = http.request(
      {
        ...commonReqConfig,
        path: `/api/users/${createdUserId}/`,
        method: "DELETE",
      },
      async (res) => {
        expect(res.statusCode).toBe(204);
      }
    );
    const getReq = http.get(baseEndpoint, async (res) => {
      const data = await parseRequestBody(res);
      expect(res.statusCode).toBe(200);
      expect(data).toEqual([]);
      done();
    });

    req.on("error", done);
    req.end();

    getReq.on("error", done);
    getReq.end();
  });
});

type HttpResponseType = import("http").ServerResponse<
  import("http").IncomingMessage
> & {
  req: import("http").IncomingMessage;
};

type UserEntity = {
  id: string | UUID;
  username: Required<string>;
  age: Required<number>;
  hobbies: Required<string[]>;
};

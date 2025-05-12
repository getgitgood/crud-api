interface CustomErrorParams {
  code?: number;
  message: string;
}

export class CustomError extends Error implements CustomErrorParams {
  public code?: number;

  constructor({ code, message, ...params }: CustomErrorParams) {
    super(message);
    this.code = code;
  }
}

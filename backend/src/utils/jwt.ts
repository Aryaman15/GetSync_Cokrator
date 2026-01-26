import { UserDocument } from "../models/user.model"
import type { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { config } from "../config/app.config";
export type AccessTPayload={
    userId:UserDocument["_id"];
};

type SignOptsAndSecret=SignOptions & {
    secret: string;
};

const defaults: SignOptions={
    audience:["user"],
};

export const accessTokenSignOptions: SignOptsAndSecret={
    expiresIn:config.JWT_EXPIRES_IN as StringValue,
    secret:config.JWT_SECRET,
}

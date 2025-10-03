import type { Buffer } from "node:buffer";

import jwt from "jsonwebtoken";

import type { TokenPayLoad } from "~/models/requests/users.requests";

export function signToken({
  payload,
  privateKey,
  options = { algorithm: "HS256" },
}: {
  payload: string | object | Buffer;
  privateKey: string;
  options?: jwt.SignOptions;
}) {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err)
        throw reject(err);
      resolve(token as string);
    });
  });
}

export function verifyToken({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) {
  return new Promise<TokenPayLoad>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error)
        throw reject(error);
      resolve(decoded as TokenPayLoad);
    });
  });
}

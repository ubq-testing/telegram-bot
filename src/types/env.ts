import { Type as T } from "@sinclair/typebox";
import { StaticDecode } from "@sinclair/typebox";
import "dotenv/config";
import { StandardValidator } from "typebox-validators";

export const envSchema = T.Object({
    TG_BOT_TOKEN: T.String(),
});

export const envValidator = new StandardValidator(envSchema);

export type Env = StaticDecode<typeof envSchema>;

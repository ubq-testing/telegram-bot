import { Bot, Context } from "grammy";

export class BotHandler {
    bot: Bot;
    ctx: Context | null = null;

    constructor() {
        const token = process.env.TG_BOT_TOKEN;
        if(!token) {
            throw new Error("TG_BOT_TOKEN is not set in the environment variables.");
        }
        this.bot = new Bot(token);
    }

    start() {
        this.bot.start();
    }

    addCommand(command: string, handler: (ctx: Context) => void) {
        this.bot.command(command, handler);
    }

    addMiddleware(middleware: (ctx: Context, next: () => Promise<void>) => void) {
        this.bot.use((ctx, next) => {
            this.ctx = this.createHandler(ctx, "");
            middleware(this.ctx, next);
        });
    }

    createHandler(ctx: Context, fnName: CtxFunctions) {
        return new Proxy(ctx, {
            get: (target, prop, receiver) => {
                if(prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                return () => {
                    console.log(`Method ${fnName}.${prop.toString()} not implemented.`);
                };
            }
        });
    }
}

type CtxFunctions<T = Context> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? K : never;
}[keyof T];
import { Bot, Context } from "https://deno.land/x/grammy@v1.34.0/mod.ts";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

// Типы данных
type Topic = { [id: string]: { id: string; createdAt: Date; title: string; meetingId: string } };
type UserMeeting = { [id: string]: { userId: string; meetingId: string } };
type Meeting = {
    [id: string]: {
        createdAt: Date;
        title: string;
        date: Date;
        place: string;
        meetings: Array<UserMeeting>;
        topics: Array<Topic>;
    };
};

type User = {
    name: string;
    age: number;
    city: string;
    telegramId: string;
    telegramUsername: string;
    networkingPoints: number;
    meetings: Array<Meeting>;
};

// Состояния пользователя
enum UserState {
    REGISTRATION_INPUT_NAME,
    REGISTRATION_INPUT_AGE,
    REGISTRATION_INPUT_CITY,
}

const users: Record<string, User> = {}; // Хранение всех зарегистрированных пользователей
const states: Record<string, UserState> = {}; // Состояния пользователей

// Обработчики состояний
const stateHandlers: Record<UserState, (ctx: Context) => Promise<void>> = {
    [UserState.REGISTRATION_INPUT_NAME]: async (ctx) => {
        const name = ctx.message?.text;
        const tgId = ctx.from?.id.toString();

        if (tgId && name && name.length < 64) {
            if (!users[tgId]) {
                users[tgId] = {
                    name: "",
                    age: 0,
                    city: "",
                    telegramId: tgId,
                    telegramUsername: ctx.from?.username || "Аноним",
                    networkingPoints: 0,
                    meetings: [],
                };
            }

            users[tgId].name = name;
            states[tgId] = UserState.REGISTRATION_INPUT_CITY;
            await ctx.reply("Отлично! Теперь введите ваш город.");
        } else {
            await ctx.reply("Пожалуйста, введите корректное имя и фамилию (до 64 символов).");
        }
    },

    [UserState.REGISTRATION_INPUT_CITY]: async (ctx) => {
        const city = ctx.message?.text;
        const tgId = ctx.from?.id.toString();

        if (tgId && city && city.length < 64) {
            users[tgId].city = city;
            states[tgId] = UserState.REGISTRATION_INPUT_AGE;
            await ctx.reply("Отлично! Теперь введите ваш возраст.");
        } else {
            await ctx.reply("Пожалуйста, введите корректный город (до 64 символов).");
        }
    },

    [UserState.REGISTRATION_INPUT_AGE]: async (ctx) => {
        const ageText = ctx.message?.text;
        const tgId = ctx.from?.id.toString();
        const age = Number(ageText);

        if (tgId && !isNaN(age) && age > 0) {
            users[tgId].age = age;
            await ctx.reply("Спасибо за регистрацию! Ваши данные сохранены.");
        } else {
            await ctx.reply("Пожалуйста, введите корректный возраст (положительное число).");
        }
    },
};

// Основная логика обработки сообщений
const handleMessage = async (ctx: Context) => {
    const tgId = ctx.from?.id.toString();
    if (!tgId) return;

    console.log(`Обработка сообщения от пользователя ${tgId}`);

    const currentState = states[tgId];
    console.log(`Текущее состояние пользователя: ${currentState}`);

    const handler = stateHandlers[currentState];
    if (handler) {
        console.log(`Вызов обработчика для состояния: ${currentState}`);
        await handler(ctx);
    } else {
        console.log("Состояние не определено. Запрос на /start.");
        await ctx.reply("Пожалуйста, начните с команды /start.");
    }
};

// Команды для регистрации
bot.command("start", (ctx) => {
    ctx.reply("Добро пожаловать! Чтобы начать регистрацию, введите /register.");
});

bot.command("register", (ctx) => {
    const tgId = ctx.from?.id.toString();
    if (tgId) {
        states[tgId] = UserState.REGISTRATION_INPUT_NAME;

        // Инициализация пользователя
        users[tgId] = {
            name: "",
            age: 0,
            city: "",
            telegramId: tgId,
            telegramUsername: ctx.from?.username || "Аноним",
            networkingPoints: 0,
            meetings: [],
        };

        ctx.reply("Как вас зовут?");
    }
});

// Обработка сообщений
bot.on("message", handleMessage);

// Запуск бота
bot.start();
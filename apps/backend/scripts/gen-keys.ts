/** Генерация production-пары JWT-ключей. Вывести в env или файлы: pnpm tsx scripts/gen-keys.ts */
import { exportKeyPair } from "../src/auth/keys.ts";

const { privatePem, publicPem } = await exportKeyPair();
console.log("# JWT_PRIVATE_KEY_PEM (положить в env, экранировав переводы строк при необходимости):\n");
console.log(privatePem);
console.log("\n# JWT_PUBLIC_KEY_PEM:\n");
console.log(publicPem);

import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export type RegisterUserResult =
  | { data: string }
  | { error: string };

export async function registerUser(
  input: RegisterUserInput
): Promise<RegisterUserResult> {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    return { error: 'email sudah terdaftar' };
  }

  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  try {
    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    return { data: 'Ok' };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return { error: 'email sudah terdaftar' };
    }
    throw error;
  }
}

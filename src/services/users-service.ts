import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export type RegisterUserResult =
  | { data: string }
  | { error: string };

export interface LoginUserInput {
  email: string;
  password: string;
}

export type LoginUserResult =
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

export async function loginUser(
  input: LoginUserInput
): Promise<LoginUserResult> {
  const userList = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (userList.length === 0) {
    return { error: 'email atau password salah' };
  }

  const user = userList[0];

  const isValidPassword = await Bun.password.verify(
    input.password,
    user.password
  );

  if (!isValidPassword) {
    return { error: 'email atau password salah' };
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { data: token };
}

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

export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  createdAt: Date | null;
}

export type GetCurrentUserResult =
  | { data: UserProfileResponse }
  | { error: string };

export type LogoutUserResult =
  | { data: string }
  | { error: string };

/**
 * Mendaftarkan pengguna baru (Registrasi).
 * Fungsi ini akan mengecek apakah email sudah terdaftar. 
 * Jika belum, akan melakukan hashing pada password menggunakan bcrypt, 
 * kemudian menyimpan data pengguna baru ke database.
 * 
 * @param input Data pengguna yang berisi name, email, dan password.
 * @returns Response berupa string 'Ok' jika berhasil, atau pesan error jika email sudah terdaftar.
 */
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

/**
 * Melakukan proses otentikasi/login pengguna.
 * Fungsi ini akan mencari pengguna berdasarkan email, 
 * lalu memverifikasi kecocokan password menggunakan bcrypt.
 * Jika valid, akan membuat token sesi (UUID) baru, menyimpannya ke database, dan mengembalikan token tersebut.
 * 
 * @param input Data login yang berisi email dan password.
 * @returns Response berupa token string UUID jika berhasil, atau pesan error jika kredensial salah.
 */
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

/**
 * Mengambil profil pengguna yang saat ini sedang login.
 * Fungsi ini akan mencari session berdasarkan token yang diberikan, 
 * lalu mengambil data profil (tanpa password) dari pengguna yang memiliki sesi tersebut.
 * 
 * @param token Token sesi berformat UUID.
 * @returns Response berupa data profil pengguna (UserProfileResponse) atau error 'unauthorized' jika token tidak valid/ditemukan.
 */
export async function getCurrentUser(
  token: string
): Promise<GetCurrentUserResult> {
  if (!token) {
    return { error: 'unauthorized' };
  }

  const sessionList = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (sessionList.length === 0) {
    return { error: 'unauthorized' };
  }

  const session = sessionList[0];

  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (userList.length === 0) {
    return { error: 'unauthorized' };
  }

  return { data: userList[0] };
}

/**
 * Mengakhiri sesi pengguna aktif (Logout).
 * Fungsi ini akan menghapus/menghancurkan rekaman sesi berdasarkan token dari database.
 * 
 * @param token Token sesi yang akan dihapus.
 * @returns Response 'OK' jika berhasil dihapus, atau 'unauthorized' jika token tidak ada di database.
 */
export async function logoutUser(
  token: string
): Promise<LogoutUserResult> {
  if (!token) {
    return { error: 'unauthorized' };
  }

  const [result] = await db.delete(sessions).where(eq(sessions.token, token));

  if (result.affectedRows === 0) {
    return { error: 'unauthorized' };
  }

  return { data: 'OK' };
}

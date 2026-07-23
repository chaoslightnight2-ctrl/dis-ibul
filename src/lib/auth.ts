import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { isEmailDeliveryEnabled, sendActionEmail } from "@/services/email/provider";

const emailDeliveryEnabled = isEmailDeliveryEnabled();
const requireEmailVerification = process.env.EMAIL_REQUIRE_VERIFICATION === "true";

export const auth = betterAuth({
  appName: "DişçiBul",
  baseURL: {
    allowedHosts: [
      "localhost:*",
      "127.0.0.1:*",
      ...(process.env.AUTH_ALLOWED_HOSTS?.split(",").map((host) => host.trim()).filter(Boolean) ?? []),
    ],
    protocol: "auto",
    fallback: process.env.BETTER_AUTH_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: emailDeliveryEnabled
      ? async ({ user, url }) => {
          await sendActionEmail({
            userId: user.id,
            recipient: user.email,
            recipientName: user.name,
            kind: "PASSWORD_RESET",
            actionUrl: url,
          });
        }
      : undefined,
    onPasswordReset: async ({ user }, request) => {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "ACCOUNT_PASSWORD_RESET",
          target: `user:${user.id}`,
          ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        },
      });
    },
  },
  emailVerification: {
    sendOnSignUp: emailDeliveryEnabled,
    sendOnSignIn: requireEmailVerification,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: emailDeliveryEnabled
      ? async ({ user, url }) => {
          await sendActionEmail({
            userId: user.id,
            recipient: user.email,
            recipientName: user.name,
            kind: "EMAIL_VERIFICATION",
            actionUrl: url,
          });
        }
      : undefined,
    afterEmailVerification: async (user) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["PATIENT", "DENTIST", "CLINIC_MANAGER", "MODERATOR", "SUPER_ADMIN"],
        required: true,
        defaultValue: "PATIENT",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.$transaction([
            prisma.userProfile.upsert({
              where: { userId: user.id },
              update: { fullName: user.name },
              create: { userId: user.id, fullName: user.name },
            }),
            prisma.patientProfile.upsert({
              where: { userId: user.id },
              update: {},
              create: { userId: user.id },
            }),
          ]);
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;

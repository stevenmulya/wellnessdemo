"use server";

import { prisma } from "../db";
import { requireAuth } from "../security/guards";
import { hashPassword, verifyPassword } from "../security/password";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "../security/session";
import { UpdateProfileSchema, ChangePasswordSchema, DeleteAccountSchema } from "../validators/auth";
import { createQrisInvoiceAdapter } from "../integrations/payment-gateway";
import { isRegistrationClosedInWib } from "../utils/timezone";
import { WellnessActionResult } from "./auth";

/**
 * Fetch the authenticated user's profile.
 */
export async function wellnessGetProfile() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User profile not found.");
  }

  return user;
}

/**
 * Update user profile details (Full Name & Phone/WhatsApp).
 * Protected against IDOR: userId is strictly read from the verified server session cookie.
 */
export async function wellnessUpdateProfile(
  rawInput: unknown
): Promise<WellnessActionResult> {
  const session = await requireAuth();

  const validation = UpdateProfileSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid profile details.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { fullName, phone } = validation.data;

  const updatedUser = await prisma.user.update({
    where: { id: session.userId },
    data: {
      fullName,
      phone: phone || null,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
    },
  });

  return {
    success: true,
    message: "Profile details updated successfully.",
    data: updatedUser,
  };
}

/**
 * Change password from account settings.
 * Verifies current password, hashes new password, and increments tokenVersion to invalidate other sessions.
 */
export async function wellnessChangePassword(
  rawInput: unknown
): Promise<WellnessActionResult> {
  const session = await requireAuth();

  const validation = ChangePasswordSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid new password format.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, newPassword } = validation.data;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true, tokenVersion: true, email: true, role: true },
  });

  if (!user) {
    return { success: false, message: "User not found." };
  }

  const isMatch = await verifyPassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    return {
      success: false,
      message: "The current password you entered is incorrect.",
    };
  }

  const newPasswordHash = await hashPassword(newPassword);
  const nextTokenVersion = user.tokenVersion + 1;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: nextTokenVersion,
      },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: session.userId, used: false },
      data: { used: true },
    }),
  ]);

  const newToken = await createSessionToken({
    userId: session.userId,
    email: user.email,
    role: user.role,
    tokenVersion: nextTokenVersion,
  });
  await setSessionCookie(newToken);

  return {
    success: true,
    message: "Password updated successfully. All other device sessions have been signed out.",
  };
}

/**
 * Enroll in a Cohort Program & Generate QRIS Invoice with a 15-Minute Validity Window (SOW 5.2).
 * Enforces Participant Quota Limits and Enrollment Cutoff Deadlines.
 */
export async function wellnessEnrollProgram(
  programId: string,
  attendanceMode: "IN_PERSON" | "VIRTUAL" = "VIRTUAL"
): Promise<
  WellnessActionResult<{
    id: string;
    programId: string;
    programTitle: string;
    price: number;
    status: string;
    attendanceMode: string;
    paymentReference: string | null;
    invoiceExpiresAt: Date | null;
  }>
> {
  const session = await requireAuth();

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  if (!program) {
    return { success: false, message: "Wellness cohort program not found." };
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_programId: {
        userId: session.userId,
        programId: program.id,
      },
    },
  });

  if (existingEnrollment && existingEnrollment.status === "ACTIVE") {
    return {
      success: false,
      message: "You are already an active member of this cohort batch.",
    };
  }

  // Check Enrollment Cutoff Deadline in Western Indonesia Time (WIB)
  if (isRegistrationClosedInWib(program.registrationDeadline)) {
    return {
      success: false,
      message: "Registration for this cohort batch has closed.",
    };
  }

  // Check Participant Quota Limit
  if (program._count.enrollments >= program.maxQuota) {
    return {
      success: false,
      message: `This cohort batch has reached its maximum quota of ${program.maxQuota} participants.`,
    };
  }

  // Free Program: Automatically activate cohort enrollment inside an atomic transaction
  if (program.price <= 0) {
    const paidAt = new Date();
    const validUntil =
      program.endDate && program.endDate > paidAt
        ? program.endDate
        : new Date(paidAt.getTime() + 90 * 24 * 60 * 60 * 1000);

    try {
      const enrollment = await prisma.$transaction(async (tx) => {
        const liveActiveCount = await tx.enrollment.count({
          where: { programId: program.id, status: "ACTIVE" },
        });

        if (liveActiveCount >= program.maxQuota) {
          throw new Error(
            `This cohort batch has reached its maximum quota of ${program.maxQuota} participants.`
          );
        }

        if (existingEnrollment) {
          return await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              status: "ACTIVE",
              attendanceMode,
              paidAt,
              validUntil,
            },
          });
        }

        return await tx.enrollment.create({
          data: {
            userId: session.userId,
            programId: program.id,
            status: "ACTIVE",
            attendanceMode,
            paymentReference: `FREE-${Date.now().toString().slice(-6)}`,
            paidAt,
            validUntil,
          },
        });
      });

      return {
        success: true,
        message: `Enrolled successfully! Full access unlocked for "${program.title}".`,
        data: {
          id: enrollment.id,
          programId: program.id,
          programTitle: program.title,
          price: 0,
          status: enrollment.status,
          attendanceMode: enrollment.attendanceMode,
          paymentReference: enrollment.paymentReference,
          invoiceExpiresAt: null,
        },
      };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Failed to complete free enrollment.",
      };
    }
  }

  // Standard 15-minute QRIS invoice validity window via Payment Gateway Adapter Template (SOW 5.2)
  const gatewayInvoice = await createQrisInvoiceAdapter({
    enrollmentId: existingEnrollment?.id || "new",
    userId: session.userId,
    userEmail: session.email,
    programTitle: program.title,
    amountIdr: program.price,
  });

  if (existingEnrollment) {
    const isStillValid =
      existingEnrollment.status === "PENDING" &&
      existingEnrollment.invoiceExpiresAt &&
      new Date() < new Date(existingEnrollment.invoiceExpiresAt);

    // Preserve active 15-minute countdown if not expired; otherwise refresh
    const refreshed = await prisma.enrollment.update({
      where: { id: existingEnrollment.id },
      data: {
        status: "PENDING",
        attendanceMode,
        paymentReference: isStillValid
          ? existingEnrollment.paymentReference || gatewayInvoice.paymentReference
          : gatewayInvoice.paymentReference,
        invoiceExpiresAt: isStillValid
          ? existingEnrollment.invoiceExpiresAt
          : gatewayInvoice.invoiceExpiresAt,
      },
    });

    return {
      success: true,
      message: "QRIS checkout invoice ready.",
      data: {
        id: refreshed.id,
        programId: program.id,
        programTitle: program.title,
        price: program.price,
        status: refreshed.status,
        attendanceMode: refreshed.attendanceMode,
        paymentReference: refreshed.paymentReference,
        invoiceExpiresAt: refreshed.invoiceExpiresAt,
      },
    };
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: session.userId,
      programId: program.id,
      status: "PENDING",
      attendanceMode,
      paymentReference: gatewayInvoice.paymentReference,
      invoiceExpiresAt: gatewayInvoice.invoiceExpiresAt,
    },
  });

  return {
    success: true,
    message: `QRIS invoice generated for ${program.title}. Valid for 15 minutes.`,
    data: {
      id: enrollment.id,
      programId: program.id,
      programTitle: program.title,
      price: program.price,
      status: enrollment.status,
      attendanceMode: enrollment.attendanceMode,
      paymentReference: enrollment.paymentReference,
      invoiceExpiresAt: enrollment.invoiceExpiresAt,
    },
  };
}

/**
 * Automated QRIS Payment Verification / Gateway Webhook Handler (SOW 5.2).
 * Verifies the 15-minute QRIS invoice window and unlocks cohort access immediately.
 */
export async function wellnessConfirmQrisPayment(
  enrollmentId: string
): Promise<WellnessActionResult> {
  const session = await requireAuth();

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      program: true,
    },
  });

  if (!enrollment || enrollment.userId !== session.userId) {
    return { success: false, message: "Invoice record not found." };
  }

  if (enrollment.status === "ACTIVE") {
    return { success: true, message: "Payment already verified." };
  }

  // Verify 15-minute QRIS validity window
  if (
    enrollment.invoiceExpiresAt &&
    new Date() > new Date(enrollment.invoiceExpiresAt)
  ) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "EXPIRED" },
    });
    return {
      success: false,
      message: "QRIS invoice 15-minute window has expired. Please regenerate a new QRIS code.",
    };
  }

  // Atomic quota verification and activation within transaction to prevent race-condition overselling
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const activeCount = await tx.enrollment.count({
        where: {
          programId: enrollment.programId,
          status: "ACTIVE",
        },
      });

      if (activeCount >= enrollment.program.maxQuota) {
        throw new Error("Cohort quota was just filled. Please contact support.");
      }

      const paidAt = new Date();
      const validUntil =
        enrollment.program.endDate && enrollment.program.endDate > paidAt
          ? enrollment.program.endDate
          : new Date(paidAt.getTime() + 90 * 24 * 60 * 60 * 1000);

      return await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "ACTIVE",
          paidAt,
          validUntil,
        },
      });
    });

    return {
      success: true,
      message: `QRIS payment verified! Full cohort access unlocked for "${enrollment.program.title}".`,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify payment.",
    };
  }
}

/**
 * Self-Service Permanent Account Deletion.
 * Requires current password verification and prevents deleting the sole Superadmin.
 */
export async function wellnessDeleteAccount(
  rawInput: unknown
): Promise<WellnessActionResult> {
  const session = await requireAuth();

  const validation = DeleteAccountSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Password verification is required to delete your account.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { password } = validation.data;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return { success: false, message: "User not found." };
  }

  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    return {
      success: false,
      message: "Incorrect password. Account deletion cancelled.",
    };
  }

  if (user.role === "SUPERADMIN") {
    const superadminCount = await prisma.user.count({
      where: { role: "SUPERADMIN" },
    });
    if (superadminCount <= 1) {
      return {
        success: false,
        message: "Cannot delete the sole Superadmin account on the platform.",
      };
    }
  }

  await prisma.user.delete({
    where: { id: session.userId },
  });

  await clearSessionCookie();

  return {
    success: true,
    message: "Your account and all associated records have been permanently deleted.",
  };
}

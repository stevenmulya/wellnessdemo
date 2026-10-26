"use server";

import crypto from "crypto";
import { prisma } from "../db";
import { requireSuperadmin } from "../security/guards";
import { hashPassword } from "../security/password";
import { WellnessActionResult } from "./auth";

/**
 * Superadmin: Retrieve directory of all users and their cohort enrollments.
 */
export async function wellnessAdminGetUsers(searchQuery?: string) {
  await requireSuperadmin();

  const whereClause = searchQuery
    ? {
        OR: [
          { email: { contains: searchQuery } },
          { fullName: { contains: searchQuery } },
          { phone: { contains: searchQuery } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      enrollments: {
        select: {
          id: true,
          status: true,
          paymentReference: true,
          paidAt: true,
          validUntil: true,
          program: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
}

/**
 * Superadmin: Update User Role (USER <-> SUPERADMIN).
 * Protected against accidental self-demotion.
 */
export async function wellnessAdminUpdateUserRole(
  targetUserId: string,
  newRole: "USER" | "SUPERADMIN"
): Promise<WellnessActionResult> {
  const currentAdmin = await requireSuperadmin();

  if (targetUserId === currentAdmin.userId && newRole !== "SUPERADMIN") {
    return {
      success: false,
      message: "You cannot demote your own Superadmin role.",
    };
  }

  if (newRole === "USER") {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (targetUser?.role === "SUPERADMIN") {
      const superadminCount = await prisma.user.count({ where: { role: "SUPERADMIN" } });
      if (superadminCount <= 1) {
        return {
          success: false,
          message: "Cannot demote the last remaining Superadmin on the platform.",
        };
      }
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: newRole,
      tokenVersion: { increment: 1 },
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return {
    success: true,
    message: `Role for ${updatedUser.fullName} updated to ${newRole}.`,
    data: updatedUser,
  };
}

/**
 * Superadmin: Update Account Status (ACTIVE <-> SUSPENDED).
 * Automatically increments tokenVersion to immediately revoke active sessions.
 */
export async function wellnessAdminUpdateUserStatus(
  targetUserId: string,
  newStatus: "ACTIVE" | "SUSPENDED"
): Promise<WellnessActionResult> {
  const currentAdmin = await requireSuperadmin();

  if (targetUserId === currentAdmin.userId && newStatus === "SUSPENDED") {
    return {
      success: false,
      message: "You cannot suspend your own Superadmin account.",
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      status: newStatus,
      tokenVersion: { increment: 1 },
    },
    select: { id: true, email: true, fullName: true, status: true },
  });

  return {
    success: true,
    message: `Account status for ${updatedUser.fullName} updated to ${newStatus}.`,
    data: updatedUser,
  };
}

/**
 * Superadmin: Manual Payment Verification & Cohort Activation.
 */
export async function wellnessAdminApprovePayment(
  enrollmentId: string
): Promise<WellnessActionResult> {
  await requireSuperadmin();

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { program: true, user: true },
  });

  if (!enrollment) {
    return { success: false, message: "Enrollment record not found." };
  }

  if (enrollment.status === "ACTIVE") {
    return { success: true, message: "Enrollment is already active.", data: enrollment };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Verify cohort quota atomically before activating
      const activeCount = await tx.enrollment.count({
        where: {
          programId: enrollment.programId,
          status: "ACTIVE",
        },
      });

      if (activeCount >= enrollment.program.maxQuota) {
        throw new Error(
          `Cannot approve: Cohort "${enrollment.program.title}" has reached its maximum quota of ${enrollment.program.maxQuota} participants.`
        );
      }

      const paidAt = new Date();
      const validUntil =
        enrollment.program.endDate && enrollment.program.endDate > paidAt
          ? enrollment.program.endDate
          : new Date(paidAt.getTime() + 90 * 24 * 60 * 60 * 1000);

      return await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "ACTIVE",
          paidAt,
          validUntil,
        },
      });
    });

    return {
      success: true,
      message: `Payment for "${enrollment.program.title}" (${enrollment.user.fullName}) approved (Status: ACTIVE).`,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to approve payment.",
    };
  }
}

/**
 * Superadmin: Permanently Delete User Account.
 */
export async function wellnessAdminDeleteUser(
  targetUserId: string
): Promise<WellnessActionResult> {
  const currentAdmin = await requireSuperadmin();

  if (targetUserId === currentAdmin.userId) {
    return {
      success: false,
      message: "You cannot delete your own account from the Admin Console.",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  if (targetUser.role === "SUPERADMIN") {
    const superadminCount = await prisma.user.count({
      where: { role: "SUPERADMIN" },
    });
    if (superadminCount <= 1) {
      return {
        success: false,
        message: "Cannot delete the last remaining Superadmin on the platform.",
      };
    }
  }

  await prisma.user.delete({
    where: { id: targetUserId },
  });

  return {
    success: true,
    message: `Account ${targetUser.fullName} (${targetUser.email}) has been permanently deleted.`,
  };
}

/**
 * Superadmin: Force Reset User Password (Generates Temporary Password).
 */
export async function wellnessAdminResetUserPassword(
  targetUserId: string
): Promise<WellnessActionResult<{ temporaryPassword: string }>> {
  await requireSuperadmin();

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    return { success: false, message: "User not found." };
  }

  const tempPassword = `Temp${crypto.randomBytes(3).toString("hex").toUpperCase()}9!`;
  const passwordHash = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  return {
    success: true,
    message: `Password for ${user.fullName} has been reset. Share this temporary password with the member:`,
    data: { temporaryPassword: tempPassword },
  };
}

"use server";

import { prisma } from "../db";
import { requireSuperadmin } from "../security/guards";
import { WellnessActionResult } from "./auth";

export interface MasterDataPayload {
  coaches: Array<{ id: string; name: string; title: string }>;
  targetAudiences: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export async function wellnessGetMasterData(): Promise<{
  success: boolean;
  data: MasterDataPayload;
}> {
  try {
    const [coaches, targetAudiences, categories] = await Promise.all([
      prisma.masterCoach.findMany({ orderBy: { name: "asc" } }),
      prisma.masterTargetAudience.findMany({ orderBy: { name: "asc" } }),
      prisma.masterCategory.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      success: true,
      data: { coaches, targetAudiences, categories },
    };
  } catch (error) {
    console.error("Failed to fetch master data:", error);
    return {
      success: false,
      data: { coaches: [], targetAudiences: [], categories: [] },
    };
  }
}

export async function wellnessCreateMasterCoach(input: {
  name: string;
  title: string;
}): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = input.name?.trim();
  const title = input.title?.trim();

  if (!name || name.length < 2) {
    return { success: false, message: "Coach name must be at least 2 characters." };
  }
  if (!title || title.length < 2) {
    return { success: false, message: "Coach title must be at least 2 characters." };
  }

  const coach = await prisma.masterCoach.create({
    data: { name, title },
  });

  return { success: true, message: `Coach "${coach.name}" added.`, data: coach };
}

export async function wellnessDeleteMasterCoach(id: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  await prisma.masterCoach.delete({ where: { id } });
  return { success: true, message: "Coach deleted." };
}

export async function wellnessCreateMasterTargetAudience(nameInput: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = nameInput?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Target audience must be at least 2 characters." };
  }

  const existing = await prisma.masterTargetAudience.findUnique({ where: { name } });
  if (existing) {
    return { success: false, message: `Target audience "${name}" already exists.` };
  }

  const item = await prisma.masterTargetAudience.create({
    data: { name },
  });

  return { success: true, message: `Target audience "${item.name}" added.`, data: item };
}

export async function wellnessDeleteMasterTargetAudience(id: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  await prisma.masterTargetAudience.delete({ where: { id } });
  return { success: true, message: "Target audience removed." };
}

export async function wellnessCreateMasterCategory(nameInput: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = nameInput?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Category name must be at least 2 characters." };
  }

  const existing = await prisma.masterCategory.findUnique({ where: { name } });
  if (existing) {
    return { success: false, message: `Category "${name}" already exists.` };
  }

  const item = await prisma.masterCategory.create({
    data: { name },
  });

  return { success: true, message: `Category "${item.name}" added.`, data: item };
}

export async function wellnessDeleteMasterCategory(id: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  await prisma.masterCategory.delete({ where: { id } });
  return { success: true, message: "Category removed." };
}

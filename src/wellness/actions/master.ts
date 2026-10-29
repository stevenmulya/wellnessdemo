"use server";

import { prisma } from "../db";
import { requireSuperadmin } from "../security/guards";
import { WellnessActionResult } from "./auth";

export interface MasterDataPayload {
  coaches: Array<{ id: string; name: string; title: string }>;
  targetAudiences: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  equipment: Array<{ id: string; name: string }>;
  dailyCommitments: Array<{ id: string; name: string }>;
}

export async function wellnessGetMasterData(): Promise<{
  success: boolean;
  data: MasterDataPayload;
}> {
  try {
    let [coaches, targetAudiences, categories, equipment, dailyCommitments] =
      await Promise.all([
        prisma.masterCoach.findMany({ orderBy: { name: "asc" } }),
        prisma.masterTargetAudience.findMany({ orderBy: { name: "asc" } }),
        prisma.masterCategory.findMany({ orderBy: { name: "asc" } }),
        prisma.masterEquipment.findMany({ orderBy: { name: "asc" } }),
        prisma.masterDailyCommitment.findMany({ orderBy: { name: "asc" } }),
      ]);

    // Auto-seed defaults if equipment table is empty
    if (equipment.length === 0) {
      const defaultEquipments = [
        "No Equipment",
        "Yoga Mat",
        "Resistance Bands",
        "Light Dumbbells",
        "Pilates Foam Roller",
        "Pilates Ball",
      ];
      for (const name of defaultEquipments) {
        await prisma.masterEquipment.create({ data: { name } });
      }
      equipment = await prisma.masterEquipment.findMany({ orderBy: { name: "asc" } });
    }

    // Auto-seed defaults if daily commitments table is empty
    if (dailyCommitments.length === 0) {
      const defaultCommitments = [
        "10 - 15 Mins / Day",
        "15 - 20 Mins / Day",
        "20 - 30 Mins / Day",
        "30 - 45 Mins / Day",
        "45 - 60 Mins / Day",
      ];
      for (const name of defaultCommitments) {
        await prisma.masterDailyCommitment.create({ data: { name } });
      }
      dailyCommitments = await prisma.masterDailyCommitment.findMany({
        orderBy: { name: "asc" },
      });
    }

    return {
      success: true,
      data: { coaches, targetAudiences, categories, equipment, dailyCommitments },
    };
  } catch (error) {
    console.error("Failed to fetch master data:", error);
    return {
      success: false,
      data: {
        coaches: [],
        targetAudiences: [],
        categories: [],
        equipment: [],
        dailyCommitments: [],
      },
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

export async function wellnessUpdateMasterCoach(input: {
  id: string;
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

  const coach = await prisma.masterCoach.update({
    where: { id: input.id },
    data: { name, title },
  });

  return { success: true, message: `Coach "${coach.name}" updated.`, data: coach };
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

export async function wellnessUpdateMasterTargetAudience(input: {
  id: string;
  name: string;
}): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Target audience must be at least 2 characters." };
  }

  const item = await prisma.masterTargetAudience.update({
    where: { id: input.id },
    data: { name },
  });

  return { success: true, message: `Target audience "${item.name}" updated.`, data: item };
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

export async function wellnessUpdateMasterCategory(input: {
  id: string;
  name: string;
}): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Category name must be at least 2 characters." };
  }

  const item = await prisma.masterCategory.update({
    where: { id: input.id },
    data: { name },
  });

  return { success: true, message: `Category "${item.name}" updated.`, data: item };
}

// ============================================================================
// MASTER EQUIPMENT CRUD
// ============================================================================

export async function wellnessCreateMasterEquipment(nameInput: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = nameInput?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Equipment name must be at least 2 characters." };
  }

  const existing = await prisma.masterEquipment.findUnique({ where: { name } });
  if (existing) {
    return { success: false, message: `Equipment "${name}" already exists.` };
  }

  const item = await prisma.masterEquipment.create({
    data: { name },
  });

  return { success: true, message: `Equipment "${item.name}" added.`, data: item };
}

export async function wellnessDeleteMasterEquipment(id: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  await prisma.masterEquipment.delete({ where: { id } });
  return { success: true, message: "Equipment removed." };
}

export async function wellnessUpdateMasterEquipment(input: {
  id: string;
  name: string;
}): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Equipment name must be at least 2 characters." };
  }

  const item = await prisma.masterEquipment.update({
    where: { id: input.id },
    data: { name },
  });

  return { success: true, message: `Equipment "${item.name}" updated.`, data: item };
}

// ============================================================================
// MASTER DAILY COMMITMENT CRUD
// ============================================================================

export async function wellnessCreateMasterDailyCommitment(nameInput: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = nameInput?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Time commitment must be at least 2 characters." };
  }

  const existing = await prisma.masterDailyCommitment.findUnique({ where: { name } });
  if (existing) {
    return { success: false, message: `Daily commitment "${name}" already exists.` };
  }

  const item = await prisma.masterDailyCommitment.create({
    data: { name },
  });

  return { success: true, message: `Daily commitment "${item.name}" added.`, data: item };
}

export async function wellnessDeleteMasterDailyCommitment(id: string): Promise<WellnessActionResult> {
  await requireSuperadmin();
  await prisma.masterDailyCommitment.delete({ where: { id } });
  return { success: true, message: "Daily commitment removed." };
}

export async function wellnessUpdateMasterDailyCommitment(input: {
  id: string;
  name: string;
}): Promise<WellnessActionResult> {
  await requireSuperadmin();
  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { success: false, message: "Time commitment must be at least 2 characters." };
  }

  const item = await prisma.masterDailyCommitment.update({
    where: { id: input.id },
    data: { name },
  });

  return { success: true, message: `Daily commitment "${item.name}" updated.`, data: item };
}

import { prisma } from "@/lib/prisma";

/** Words that tie a Mercav Empleos posting to community life. Matched case-insensitively in title or description. */
export const COMMUNITY_JOB_TERMS = [
  "kosher",
  "kasher",
  "mashgiaj",
  "mashgiach",
  "shojet",
  "kashrut",
  "judaica",
  "sinagoga",
  "kehilá",
  "kehila",
  "comunidad judía",
  "comunidad judia",
  "hebreo",
  "morá",
  "jazán",
  "shabat",
];

export async function listCommunityJobs(take = 30) {
  return prisma.jobPost.findMany({
    where: {
      isActive: true,
      isUnderReview: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      AND: [
        {
          OR: COMMUNITY_JOB_TERMS.flatMap((term) => [
            { title: { contains: term, mode: "insensitive" as const } },
            { description: { contains: term, mode: "insensitive" as const } },
          ]),
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      city: true,
      country: true,
      workMode: true,
      employmentType: true,
      createdAt: true,
      company: { select: { name: true } },
    },
  });
}

import { Prisma } from "@prisma/client";

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    profile: {
      include: {
        experiences: true;
        educations: true;
        skills: true;
        languages: true;
        certifications: true;
        portfolioItems: true;
      }
    }
  }
}>;

export function calculateProfileCompleteness(user: UserWithRelations): number {
  let score = 0;
  
  if (user.avatar) score += 10;
  if (user.name) score += 5;
  if (user.username) score += 5;
  if (user.bio) score += 10;
  if (user.location && user.country) score += 5;
  if (user.coverImage) score += 5;
  
  if (user.profile) {
    if (user.profile.availabilityStatus) score += 5;
    if (user.profile.experiences.length > 0) score += 15;
    if (user.profile.educations.length > 0) score += 10;
    if (user.profile.skills.length >= 3) score += 10;
    if (user.profile.languages.length > 0) score += 5;
    if (user.profile.certifications.length > 0) score += 5;
    if (user.profile.portfolioItems.length > 0) score += 10;
  }
  
  return Math.min(score, 100);
}
// creado por Patodev y Invertilo

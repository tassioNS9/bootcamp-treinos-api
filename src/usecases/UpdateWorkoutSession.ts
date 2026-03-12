import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  workoutSessionId: string;
  completedAt: string;
}

interface OutputDto {
  id: string;
  startedAt: string;
  completedAt: string;
}

export class UpdateWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: dto.workoutPlanId,
      },
      include: {
        workoutDays: {
          where: {
            id: dto.workoutDayId,
          },
          include: {
            sessions: {
              where: {
                id: dto.workoutSessionId,
              },
            },
          },
        },
      },
    });

    if (!workoutPlan || workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout plan not found");
    }

    const workoutDay = workoutPlan.workoutDays[0];

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    const workoutSession = workoutDay.sessions[0];

    if (!workoutSession) {
      throw new NotFoundError("Workout session not found");
    }

    const completedAtDate = new Date(dto.completedAt);

    const updatedSession = await prisma.workoutSession.update({
      where: {
        id: workoutSession.id,
      },
      data: {
        completedAt: completedAtDate,
      },
    });

    return {
      id: updatedSession.id,
      startedAt: updatedSession.startedAt.toISOString(),
      completedAt:
        updatedSession.completedAt?.toISOString() ??
        completedAtDate.toISOString(),
    };
  }
}

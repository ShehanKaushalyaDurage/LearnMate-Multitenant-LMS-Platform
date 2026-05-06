/**
 * LearnHub — Exams Service
 *
 * Exam lifecycle: create → add questions → publish → students attempt → auto-grade (MCQ) or manual grade.
 * Supports two exam types: ONLINE_MCQ and MANUAL.
 */
import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type {
    CreateExamDto,
    UpdateExamDto,
    UpdateExamStatusDto,
    ExamQueryDto,
    CreateQuestionDto,
    UpdateQuestionDto,
    SubmitAttemptDto,
    ManualResultDto,
} from './dto/index.js';

const EXAM_SELECT = {
    id: true,
    batchId: true,
    title: true,
    type: true,
    date: true,
    durationMinutes: true,
    maxMarks: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class ExamsService {
    private readonly logger = new Logger(ExamsService.name);

    // ================================================================
    // EXAM CRUD
    // ================================================================

    async createExam(prisma: PrismaClient, dto: CreateExamDto) {
        const batch = await prisma.batch.findUnique({ where: { id: dto.batchId } });
        if (!batch) throw new NotFoundException(`Batch "${dto.batchId}" not found`);

        const exam = await prisma.exam.create({
            data: {
                batchId: dto.batchId,
                title: dto.title,
                type: dto.type,
                date: dto.date ? new Date(dto.date) : undefined,
                durationMinutes: dto.durationMinutes,
                maxMarks: dto.maxMarks,
            },
            select: { ...EXAM_SELECT, batch: { select: { id: true, name: true } } },
        });

        this.logger.log(`✅ Created exam: ${exam.title} (${dto.type})`);
        return exam;
    }

    async getExams(prisma: PrismaClient, query: ExamQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (query.batchId) where.batchId = query.batchId;
        if (query.type) where.type = query.type;
        if (query.status) where.status = query.status;

        const [exams, total] = await Promise.all([
            prisma.exam.findMany({
                where,
                select: {
                    ...EXAM_SELECT,
                    batch: { select: { id: true, name: true } },
                    _count: { select: { questions: true, attempts: true, manualResults: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.exam.count({ where }),
        ]);

        return {
            data: exams,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getExamById(prisma: PrismaClient, id: string) {
        const exam = await prisma.exam.findUnique({
            where: { id },
            select: {
                ...EXAM_SELECT,
                batch: { select: { id: true, name: true, course: { select: { id: true, title: true } } } },
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        optionA: true,
                        optionB: true,
                        optionC: true,
                        optionD: true,
                        correctOption: true,
                        marks: true,
                    },
                },
                _count: { select: { questions: true, attempts: true, manualResults: true } },
            },
        });
        if (!exam) throw new NotFoundException(`Exam "${id}" not found`);
        return exam;
    }

    async updateExam(prisma: PrismaClient, id: string, dto: UpdateExamDto) {
        const exam = await prisma.exam.findUnique({ where: { id } });
        if (!exam) throw new NotFoundException(`Exam "${id}" not found`);
        if (exam.status !== 'DRAFT') {
            throw new BadRequestException('Can only edit exams in DRAFT status');
        }

        const data: Record<string, unknown> = {};
        if (dto.title !== undefined) data.title = dto.title;
        if (dto.date !== undefined) data.date = new Date(dto.date);
        if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
        if (dto.maxMarks !== undefined) data.maxMarks = dto.maxMarks;

        return prisma.exam.update({ where: { id }, data, select: EXAM_SELECT });
    }

    async updateExamStatus(prisma: PrismaClient, id: string, dto: UpdateExamStatusDto) {
        const exam = await prisma.exam.findUnique({ where: { id } });
        if (!exam) throw new NotFoundException(`Exam "${id}" not found`);

        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
            DRAFT: ['PUBLISHED'],
            PUBLISHED: ['IN_PROGRESS', 'COMPLETED'],
            IN_PROGRESS: ['COMPLETED'],
            COMPLETED: [],
        };

        if (!validTransitions[exam.status]?.includes(dto.status)) {
            throw new BadRequestException(`Cannot transition from ${exam.status} to ${dto.status}`);
        }

        const updated = await prisma.exam.update({
            where: { id },
            data: { status: dto.status },
            select: EXAM_SELECT,
        });

        this.logger.log(`🔄 Exam ${exam.title} status: ${exam.status} → ${dto.status}`);
        return updated;
    }

    // ================================================================
    // MCQ QUESTIONS
    // ================================================================

    async addQuestion(prisma: PrismaClient, examId: string, dto: CreateQuestionDto) {
        const exam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) throw new NotFoundException(`Exam "${examId}" not found`);
        if (exam.status !== 'DRAFT') {
            throw new BadRequestException('Can only add questions to DRAFT exams');
        }
        if (exam.type !== 'ONLINE_MCQ') {
            throw new BadRequestException('Questions can only be added to ONLINE_MCQ exams');
        }

        return prisma.examQuestion.create({
            data: {
                examId,
                questionText: dto.questionText,
                optionA: dto.optionA,
                optionB: dto.optionB,
                optionC: dto.optionC,
                optionD: dto.optionD,
                correctOption: dto.correctOption,
                marks: dto.marks ?? 1,
            },
            select: {
                id: true,
                questionText: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctOption: true,
                marks: true,
            },
        });
    }

    async updateQuestion(prisma: PrismaClient, questionId: string, dto: UpdateQuestionDto) {
        const question = await prisma.examQuestion.findUnique({
            where: { id: questionId },
            include: { exam: { select: { status: true } } },
        });
        if (!question) throw new NotFoundException(`Question "${questionId}" not found`);
        if (question.exam.status !== 'DRAFT') {
            throw new BadRequestException('Can only edit questions for DRAFT exams');
        }

        return prisma.examQuestion.update({
            where: { id: questionId },
            data: dto,
            select: {
                id: true,
                questionText: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctOption: true,
                marks: true,
            },
        });
    }

    async deleteQuestion(prisma: PrismaClient, questionId: string) {
        const question = await prisma.examQuestion.findUnique({
            where: { id: questionId },
            include: { exam: { select: { status: true } } },
        });
        if (!question) throw new NotFoundException(`Question "${questionId}" not found`);
        if (question.exam.status !== 'DRAFT') {
            throw new BadRequestException('Can only delete questions from DRAFT exams');
        }

        await prisma.examQuestion.delete({ where: { id: questionId } });
        return { message: 'Question deleted' };
    }

    // ================================================================
    // STUDENT ATTEMPTS (ONLINE MCQ)
    // ================================================================

    async startAttempt(prisma: PrismaClient, examId: string, studentId: string) {
        const exam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) throw new NotFoundException(`Exam "${examId}" not found`);
        if (exam.type !== 'ONLINE_MCQ') {
            throw new BadRequestException('Only ONLINE_MCQ exams can be attempted');
        }
        if (exam.status !== 'PUBLISHED' && exam.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Exam is not available for attempts');
        }

        // Check for existing attempt
        const existing = await prisma.examAttempt.findUnique({
            where: { examId_studentId: { examId, studentId } },
        });
        if (existing) throw new ConflictException('You have already started this exam');

        const attempt = await prisma.examAttempt.create({
            data: { examId, studentId },
            select: {
                id: true,
                startedAt: true,
                exam: {
                    select: {
                        id: true,
                        title: true,
                        durationMinutes: true,
                        questions: {
                            select: {
                                id: true,
                                questionText: true,
                                optionA: true,
                                optionB: true,
                                optionC: true,
                                optionD: true,
                                marks: true,
                                // NOTE: correctOption is NOT returned to the student
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(`📝 Student ${studentId} started exam ${examId}`);
        return attempt;
    }

    async submitAttempt(prisma: PrismaClient, attemptId: string, dto: SubmitAttemptDto) {
        const attempt = await prisma.examAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    include: { questions: true },
                },
            },
        });
        if (!attempt) throw new NotFoundException(`Attempt "${attemptId}" not found`);
        if (attempt.submittedAt) throw new BadRequestException('This attempt has already been submitted');

        // Build a question lookup
        const questionMap = new Map(
            attempt.exam.questions.map((q) => [q.id, q]),
        );

        // Score each answer
        let totalMarks = 0;
        const answerData = dto.answers.map((ans) => {
            const question = questionMap.get(ans.questionId);
            if (!question) throw new BadRequestException(`Question "${ans.questionId}" not found in this exam`);

            const isCorrect = ans.selectedOption === question.correctOption;
            if (isCorrect) totalMarks += question.marks;

            return {
                attemptId,
                questionId: ans.questionId,
                selectedOption: ans.selectedOption,
                isCorrect,
            };
        });

        const percentage = attempt.exam.maxMarks > 0
            ? Number(((totalMarks / attempt.exam.maxMarks) * 100).toFixed(2))
            : 0;

        // Save answers + update attempt in a transaction
        const result = await prisma.$transaction(async (tx: any) => {
            // Create all answers
            await tx.examAnswer.createMany({ data: answerData });

            // Update attempt with results
            return tx.examAttempt.update({
                where: { id: attemptId },
                data: {
                    submittedAt: new Date(),
                    totalMarks,
                    percentage,
                },
                select: {
                    id: true,
                    startedAt: true,
                    submittedAt: true,
                    totalMarks: true,
                    percentage: true,
                },
            });
        });

        this.logger.log(`✅ Attempt ${attemptId} submitted: ${totalMarks}/${attempt.exam.maxMarks} (${percentage}%)`);
        return result;
    }

    // ================================================================
    // MANUAL RESULTS
    // ================================================================

    async enterManualResult(prisma: PrismaClient, examId: string, dto: ManualResultDto, teacherId: string) {
        const exam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) throw new NotFoundException(`Exam "${examId}" not found`);
        if (exam.type !== 'MANUAL') {
            throw new BadRequestException('Manual results can only be entered for MANUAL exams');
        }

        if (dto.marksObtained > exam.maxMarks) {
            throw new BadRequestException(`Marks cannot exceed ${exam.maxMarks}`);
        }

        // Upsert for re-entry
        const result = await prisma.manualResult.upsert({
            where: {
                examId_studentId: { examId, studentId: dto.studentId },
            },
            create: {
                examId,
                studentId: dto.studentId,
                marksObtained: dto.marksObtained,
                remarks: dto.remarks,
                enteredBy: teacherId,
            },
            update: {
                marksObtained: dto.marksObtained,
                remarks: dto.remarks,
                enteredBy: teacherId,
            },
            select: {
                id: true,
                marksObtained: true,
                remarks: true,
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        this.logger.log(`📝 Manual result: student ${dto.studentId} → ${dto.marksObtained}/${exam.maxMarks}`);
        return result;
    }

    async getExamResults(prisma: PrismaClient, examId: string) {
        const exam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) throw new NotFoundException(`Exam "${examId}" not found`);

        if (exam.type === 'ONLINE_MCQ') {
            const attempts = await prisma.examAttempt.findMany({
                where: { examId },
                select: {
                    id: true,
                    startedAt: true,
                    submittedAt: true,
                    totalMarks: true,
                    percentage: true,
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { totalMarks: 'desc' },
            });
            return { exam: { id: exam.id, title: exam.title, type: exam.type, maxMarks: exam.maxMarks }, results: attempts };
        } else {
            const results = await prisma.manualResult.findMany({
                where: { examId },
                select: {
                    id: true,
                    marksObtained: true,
                    remarks: true,
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    teacher: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { marksObtained: 'desc' },
            });
            return { exam: { id: exam.id, title: exam.title, type: exam.type, maxMarks: exam.maxMarks }, results };
        }
    }

    async getStudentResults(prisma: any, studentId: string) {
        // Fetch both online attempts and manual results for a consolidated timeline
        const [attempts, manualResults] = await Promise.all([
            prisma.examAttempt.findMany({
                where: { studentId, submittedAt: { not: null } },
                include: { exam: { select: { id: true, title: true, type: true, maxMarks: true } } },
                orderBy: { submittedAt: 'desc' },
            }),
            prisma.manualResult.findMany({
                where: { studentId },
                include: { exam: { select: { id: true, title: true, type: true, maxMarks: true } } },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        const online = (attempts as any[]).map((a) => ({
            id: a.id,
            examTitle: a.exam.title,
            examType: a.exam.type,
            marksObtained: a.totalMarks,
            maxMarks: a.exam.maxMarks,
            percentage: a.percentage,
            date: a.submittedAt,
        }));

        const manual = (manualResults as any[]).map((m) => ({
            id: m.id,
            examTitle: m.exam.title,
            examType: m.exam.type,
            marksObtained: m.marksObtained,
            maxMarks: m.exam.maxMarks,
            percentage: (Number(m.marksObtained) / Number(m.exam.maxMarks)) * 100,
            date: m.createdAt,
            remarks: m.remarks,
        }));

        return [...online, ...manual].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }
}

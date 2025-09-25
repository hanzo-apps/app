import { z } from 'zod';
import { secureApiHandler, apiResponse, apiError } from '@/lib/security/api-wrapper';
import { schemas } from '@/lib/security/input-validation';

// Define validation schemas for this endpoint
const createProjectSchema = z.object({
  name: schemas.projectName,
  description: z.string().min(1).max(500).optional(),
  isPrivate: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'created', 'updated']).default('created'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/projects/secure - List projects with security
export const GET = secureApiHandler(
  async ({ query, user, ip }) => {
    console.log(`User ${user?.id || 'anonymous'} from ${ip} requesting projects`);

    // Simulate database query with proper parameterization
    const projects = [
      {
        id: '1',
        name: 'Project Alpha',
        created: new Date().toISOString(),
        owner: user?.id || 'public',
      },
    ];

    // Apply pagination
    const start = (query.page - 1) * query.limit;
    const paginatedProjects = projects.slice(start, start + query.limit);

    return apiResponse({
      projects: paginatedProjects,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: projects.length,
        pages: Math.ceil(projects.length / query.limit),
      },
    });
  },
  {
    querySchema,
    rateLimit: 'api',
    ddosProtection: 'standard',
    requireAuth: false, // Public endpoint but with rate limiting
    logRequests: true,
  }
);

// POST /api/projects/secure - Create project with full security
export const POST = secureApiHandler(
  async ({ body, user, ip }) => {
    console.log(`User ${user?.id} from ${ip} creating project: ${body.name}`);

    // Validate project name doesn't already exist
    // This would be a real database check with proper sanitization
    const existingProject = false; // await db.project.findUnique({ where: { name: body.name } });

    if (existingProject) {
      return apiError('Project with this name already exists', 409);
    }

    // Create project with sanitized data
    const newProject = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || '',
      isPrivate: body.isPrivate,
      tags: body.tags || [],
      owner: user?.id,
      created: new Date().toISOString(),
    };

    // In production, save to database with parameterized queries
    // await db.project.create({ data: newProject });

    return apiResponse(newProject, 201);
  },
  {
    bodySchema: createProjectSchema,
    rateLimit: 'api',
    ddosProtection: 'strict',
    requireAuth: true,
    logRequests: true,
    logErrors: true,
  }
);

// DELETE /api/projects/secure - Delete with authorization check
export const DELETE = secureApiHandler(
  async ({ request, user, ip }) => {
    const projectId = request.nextUrl.searchParams.get('id');

    if (!projectId || !projectId.match(/^[a-f0-9-]{36}$/)) {
      return apiError('Invalid project ID', 400);
    }

    console.log(`User ${user?.id} from ${ip} deleting project: ${projectId}`);

    // Check ownership (would be a real database query)
    const project = { id: projectId, owner: user?.id }; // Mock data

    if (project.owner !== user?.id) {
      return apiError('Unauthorized to delete this project', 403);
    }

    // Delete project
    // await db.project.delete({ where: { id: projectId } });

    return apiResponse({ deleted: true, id: projectId });
  },
  {
    rateLimit: 'api',
    ddosProtection: 'strict',
    requireAuth: true,
    requireAdmin: false,
    logRequests: true,
    logErrors: true,
  }
);
import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import { validateRequest, commonSchemas } from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();
const teamController = new TeamController();

// Apply authentication and organization validation to all team routes
router.use(authenticateToken);
router.use(requireOrganization);

// Team validation schemas
const teamSchemas = {
  memberUpdate: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: Joi.object({
      role: Joi.string().valid('owner', 'admin', 'editor', 'viewer').optional(),
      status: Joi.string().valid('active', 'inactive', 'suspended').optional()
    })
  },

  invitation: {
    body: Joi.object({
      email: commonSchemas.email,
      role: Joi.string().valid('owner', 'admin', 'editor', 'viewer').required(),
      message: Joi.string().max(500).allow('').optional()
    })
  },

  pagination: {
    query: Joi.object({
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
      search: Joi.string().max(100).allow('').optional(),
      role: Joi.string().valid('', 'owner', 'admin', 'editor', 'viewer').allow('').optional(),
      status: Joi.string().valid('', 'pending', 'accepted', 'expired', 'cancelled').allow('').optional()
    })
  },

  activity: {
    query: Joi.object({
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
      userId: Joi.string().uuid().optional(),
      action: Joi.string().max(100).allow('').optional(),
      dateFrom: Joi.date().iso().optional(),
      dateTo: Joi.date().iso().optional()
    })
  },

  memberId: {
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  },

  invitationId: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    })
  }
};

// Team member management routes
router.get('/members', 
  validateRequest(teamSchemas.pagination), 
  teamController.getMembers
);

router.put('/members/:id', 
  validateRequest(teamSchemas.memberUpdate), 
  teamController.updateMember
);

router.delete('/members/:id', 
  validateRequest(teamSchemas.memberId), 
  teamController.removeMember
);

// Role management routes
router.get('/roles', teamController.getRoles);

// Invitation management routes
router.get('/invitations', 
  validateRequest(teamSchemas.pagination), 
  teamController.getInvitations
);

router.post('/invitations', 
  validateRequest(teamSchemas.invitation), 
  teamController.sendInvitation
);

router.post('/invitations/:id/resend', 
  validateRequest(teamSchemas.invitationId), 
  teamController.resendInvitation
);

router.delete('/invitations/:id', 
  validateRequest(teamSchemas.invitationId), 
  teamController.cancelInvitation
);

// Activity logs route
router.get('/activity', 
  validateRequest(teamSchemas.activity), 
  teamController.getActivity
);

export default router;
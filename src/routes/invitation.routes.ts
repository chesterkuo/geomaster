import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();
const teamController = new TeamController();

// Public invitation validation schemas
const invitationSchemas = {
  token: {
    params: Joi.object({
      token: Joi.string().required()
    })
  },

  acceptInvitation: {
    params: Joi.object({
      token: Joi.string().required()
    }),
    body: Joi.object({
      fullName: Joi.string().min(2).max(100).required(),
      password: Joi.string().min(6).max(128).required()
    })
  }
};

// Public invitation routes (no authentication required)
router.get('/:token', 
  validateRequest(invitationSchemas.token), 
  teamController.getInvitationByToken
);

router.post('/:token/accept', 
  validateRequest(invitationSchemas.acceptInvitation), 
  teamController.acceptInvitation
);

export default router;
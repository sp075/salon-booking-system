const { OwnerProfile, User, OwnerService, Service, Review } = require('../models');
const slotService = require('../services/slotService');

/**
 * Browse salon owners with optional service filter.
 * GET /customer/owners?service=Haircut
 */
async function browseOwners(req, res, next) {
  try {
    const { service } = req.query;

    const includeOptions = [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName'],
      },
      {
        model: OwnerService,
        as: 'ownerServices',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name', 'defaultPrice'],
          },
        ],
      },
    ];

    let owners;

    if (service) {
      // Filter owners that have the specified service
      owners = await OwnerProfile.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName'],
          },
          {
            model: OwnerService,
            as: 'ownerServices',
            required: true,
            include: [
              {
                model: Service,
                as: 'service',
                attributes: ['id', 'name', 'defaultPrice'],
                where: { name: service },
              },
            ],
          },
        ],
      });
    } else {
      owners = await OwnerProfile.findAll({
        include: includeOptions,
      });
    }

    res.json({ success: true, data: owners });
  } catch (err) {
    next(err);
  }
}

/**
 * Get detailed information about a specific owner.
 * GET /customer/owners/:id
 */
async function getOwnerDetail(req, res, next) {
  try {
    const ownerProfile = await OwnerProfile.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'mobile'],
        },
        {
          model: OwnerService,
          as: 'ownerServices',
          include: [
            {
              model: Service,
              as: 'service',
              attributes: ['id', 'name', 'defaultPrice', 'durationMinutes'],
            },
          ],
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['firstName', 'lastName'],
            },
          ],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!ownerProfile) {
      const error = new Error('Owner profile not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, data: ownerProfile });
  } catch (err) {
    next(err);
  }
}

/**
 * Get available time slots for an owner on a specific date.
 * GET /customer/owners/:id/slots?date=2024-01-15&services=1,2
 */
async function getAvailableSlots(req, res, next) {
  try {
    const ownerProfileId = req.params.id;
    const { date, services } = req.query;

    if (!date) {
      const error = new Error('Date query parameter is required');
      error.statusCode = 400;
      throw error;
    }

    // Parse comma-separated service IDs to array of integers
    const serviceIds = services
      ? services.split(',').map((id) => parseInt(id.trim(), 10))
      : [];

    const availableSlots = await slotService.getAvailableSlots(ownerProfileId, date, serviceIds);

    res.json({ success: true, data: availableSlots });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  browseOwners,
  getOwnerDetail,
  getAvailableSlots,
};

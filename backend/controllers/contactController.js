const db = require('../models');
const { Op } = require('sequelize');
const { supportQueue } = require('../config/queue');
const constants = require('../utils/constants');
const transporter = require('../config/email');

// Submit contact message (public)
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message, category = 'general', priority = 'medium' } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: 'Name, email, subject, and message are required'
      });
    }

    // Validate category
    const validCategories = ['general', 'technical', 'billing', 'feature-request', 'bug-report', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.INVALID_CATEGORY
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.INVALID_PRIORITY
      });
    }

    // Get user if authenticated
    const userId = req.user?.id || null;

    // Collect metadata
    const metadata = {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      referer: req.get('referer'),
      timestamp: new Date().toISOString()
    };

    // Create contact message
    const contact = await db.Contact.create({
      userId,
      name,
      email,
      subject,
      message,
      category,
      priority,
      status: 'pending',
      metadata
    });

    // Add to support queue for processing
    if (supportQueue) {
      await supportQueue.add('process-contact', {
        contactId: contact.id,
        priority: priority === 'urgent' ? 1 : priority === 'high' ? 2 : priority === 'medium' ? 3 : 4
      }, {
        priority: priority === 'urgent' ? 1 : priority === 'high' ? 2 : priority === 'medium' ? 3 : 4
      });
    }

    // Send confirmation email to user
    try {
      await transporter.sendMail({
        from: constants.EMAIL.DEFAULT_FROM,
        to: email,
        subject: `Contact Received - ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Thank you for contacting ${constants.APP_NAME}!</h2>
            <p>Hi ${name},</p>
            <p>We have received your message and our support team will get back to you as soon as possible.</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Priority:</strong> ${priority}</p>
              <p><strong>Ticket ID:</strong> ${contact.id}</p>
            </div>
            <p>Your message:</p>
            <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
              ${message.replace(/\n/g, '<br>')}
            </p>
            <p>We typically respond within 24-48 hours. For urgent matters, please expect a faster response.</p>
            <p>Best regards,<br>The ${constants.APP_NAME} Support Team</p>
          </div>
        `,
        text: `Thank you for contacting ${constants.APP_NAME}!\n\nWe have received your message and will respond soon.\n\nSubject: ${subject}\nCategory: ${category}\nTicket ID: ${contact.id}\n\nYour message:\n${message}`
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(constants.HTTP_STATUS.CREATED).json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.CONTACT_SUBMITTED,
      [constants.RESPONSE_KEYS.DATA]: {
        contact: {
          id: contact.id,
          subject: contact.subject,
          category: contact.category,
          priority: contact.priority,
          status: contact.status,
          createdAt: contact.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's contact messages (authenticated)
exports.getMyContacts = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.AUTH_REQUIRED
      });
    }

    const { page = 1, limit = 20, status, category } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      [Op.or]: [
        { userId: req.user.id },
        { email: req.user.email }
      ]
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const { count, rows } = await db.Contact.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: db.User,
          as: 'assignedSupport',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.User,
          as: 'responder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.DATA]: {
        contacts: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single contact message (authenticated - own or admin)
exports.getContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await db.Contact.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.User,
          as: 'assignedSupport',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.User,
          as: 'responder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!contact) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.CONTACT_NOT_FOUND
      });
    }

    // Check access - user can only see their own, admin can see all
    const isOwner = contact.userId && req.user && String(contact.userId) === String(req.user.id);
    const isEmailMatch = contact.email === req.user?.email;
    const isAdmin = req.user?.role === constants.USER_ROLES.ADMIN;

    if (!isOwner && !isEmailMatch && !isAdmin) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.ACCESS_DENIED
      });
    }

    res.json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.DATA]: {
        contact
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all contact messages
exports.getAllContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, category, priority, assignedTo } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const { count, rows } = await db.Contact.findAndCountAll({
      where,
      order: [
        ['priority', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.User,
          as: 'assignedSupport',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.User,
          as: 'responder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.DATA]: {
        contacts: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        },
        stats: {
          pending: await db.Contact.count({ where: { status: 'pending' } }),
          inProgress: await db.Contact.count({ where: { status: 'in-progress' } }),
          resolved: await db.Contact.count({ where: { status: 'resolved' } }),
          closed: await db.Contact.count({ where: { status: 'closed' } })
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update contact status/assign/respond
exports.updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, response, priority } = req.body;

    const contact = await db.Contact.findByPk(id);

    if (!contact) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.CONTACT_NOT_FOUND
      });
    }

    const updateData = {};

    if (status) {
      const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
          [constants.RESPONSE_KEYS.SUCCESS]: false,
          [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.INVALID_STATUS
        });
      }
      updateData.status = status;
    }

    if (assignedTo !== undefined) {
      if (assignedTo) {
        const assignee = await db.User.findByPk(assignedTo);
        if (!assignee || assignee.role !== constants.USER_ROLES.ADMIN) {
          return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
            [constants.RESPONSE_KEYS.SUCCESS]: false,
            [constants.RESPONSE_KEYS.MESSAGE]: 'Invalid assignee. Only admins can be assigned.'
          });
        }
      }
      updateData.assignedTo = assignedTo || null;
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
          [constants.RESPONSE_KEYS.SUCCESS]: false,
          [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.INVALID_PRIORITY
        });
      }
      updateData.priority = priority;
    }

    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = req.user.id;
      updateData.status = 'resolved';

      // Send response email to user
      try {
        await transporter.sendMail({
          from: constants.EMAIL.DEFAULT_FROM,
          to: contact.email,
          subject: `Re: ${contact.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Response from ${constants.APP_NAME} Support</h2>
              <p>Hi ${contact.name},</p>
              <p>Thank you for contacting us. Here is our response to your inquiry:</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
                ${response.replace(/\n/g, '<br>')}
              </div>
              <p><strong>Original Message:</strong></p>
              <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 8px;">
                <p><strong>Subject:</strong> ${contact.subject}</p>
                <p>${contact.message.replace(/\n/g, '<br>')}</p>
              </div>
              <p>If you have any further questions, please don't hesitate to reply to this email.</p>
              <p>Best regards,<br>The ${constants.APP_NAME} Support Team</p>
            </div>
          `,
          text: `Response from ${constants.APP_NAME} Support\n\n${response}\n\nOriginal Message:\nSubject: ${contact.subject}\n${contact.message}`
        });
      } catch (emailError) {
        console.error('Failed to send response email:', emailError);
      }
    }

    await contact.update(updateData);

    res.json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.CONTACT_UPDATED,
      [constants.RESPONSE_KEYS.DATA]: {
        contact
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete contact message
exports.deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await db.Contact.findByPk(id);

    if (!contact) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.CONTACT_NOT_FOUND
      });
    }

    await contact.destroy();

    res.json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.CONTACT_DELETED
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get support dashboard stats
exports.getSupportStats = async (req, res, next) => {
  try {
    const stats = {
      total: await db.Contact.count(),
      pending: await db.Contact.count({ where: { status: 'pending' } }),
      inProgress: await db.Contact.count({ where: { status: 'in-progress' } }),
      resolved: await db.Contact.count({ where: { status: 'resolved' } }),
      closed: await db.Contact.count({ where: { status: 'closed' } }),
      byCategory: {
        general: await db.Contact.count({ where: { category: 'general' } }),
        technical: await db.Contact.count({ where: { category: 'technical' } }),
        billing: await db.Contact.count({ where: { category: 'billing' } }),
        'feature-request': await db.Contact.count({ where: { category: 'feature-request' } }),
        'bug-report': await db.Contact.count({ where: { category: 'bug-report' } }),
        other: await db.Contact.count({ where: { category: 'other' } })
      },
      byPriority: {
        low: await db.Contact.count({ where: { priority: 'low' } }),
        medium: await db.Contact.count({ where: { priority: 'medium' } }),
        high: await db.Contact.count({ where: { priority: 'high' } }),
        urgent: await db.Contact.count({ where: { priority: 'urgent' } })
      },
      averageResponseTime: null, // Can be calculated from respondedAt - createdAt
      unassigned: await db.Contact.count({ where: { assignedTo: null, status: { [Op.ne]: 'closed' } } })
    };

    res.json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.DATA]: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};


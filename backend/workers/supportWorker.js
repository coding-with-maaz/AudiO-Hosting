const { supportQueue } = require('../config/queue');
const db = require('../models');
const transporter = require('../config/email');
const constants = require('../utils/constants');

// Process contact messages in queue
supportQueue.process('process-contact', async (job) => {
  try {
    const { contactId } = job.data;

    const contact = await db.Contact.findByPk(contactId, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    // Notify support team via email
    const supportEmail = process.env.SUPPORT_EMAIL || constants.EMAIL.DEFAULT_FROM;
    
    try {
      await transporter.sendMail({
        from: constants.EMAIL.DEFAULT_FROM,
        to: supportEmail,
        subject: `[${contact.priority.toUpperCase()}] New Support Ticket: ${contact.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">New Support Ticket Received</h2>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p><strong>Ticket ID:</strong> ${contact.id}</p>
              <p><strong>From:</strong> ${contact.name} (${contact.email})</p>
              <p><strong>Subject:</strong> ${contact.subject}</p>
              <p><strong>Category:</strong> ${contact.category}</p>
              <p><strong>Priority:</strong> <span style="color: ${contact.priority === 'urgent' ? '#dc3545' : contact.priority === 'high' ? '#fd7e14' : contact.priority === 'medium' ? '#ffc107' : '#28a745'}">${contact.priority.toUpperCase()}</span></p>
              <p><strong>Status:</strong> ${contact.status}</p>
              ${contact.userId ? `<p><strong>User ID:</strong> ${contact.userId}</p>` : ''}
            </div>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
              ${contact.message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px;">
              <a href="${process.env.ADMIN_URL || constants.URLS.DEFAULT_BACKEND}/api/support/${contact.id}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                View Ticket
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This is an automated notification from ${constants.APP_NAME} Support System.
            </p>
          </div>
        `,
        text: `New Support Ticket Received\n\nTicket ID: ${contact.id}\nFrom: ${contact.name} (${contact.email})\nSubject: ${contact.subject}\nCategory: ${contact.category}\nPriority: ${contact.priority}\n\nMessage:\n${contact.message}`
      });
    } catch (emailError) {
      console.error('Failed to send support team notification:', emailError);
      // Don't fail the job if email fails
    }

    // Auto-assign based on priority (if configured)
    if (contact.priority === 'urgent' && process.env.AUTO_ASSIGN_URGENT === 'true') {
      // Find available admin to assign
      const admin = await db.User.findOne({
        where: {
          role: constants.USER_ROLES.ADMIN,
          isActive: true
        },
        order: [
          // Could add logic to assign to admin with least open tickets
          ['createdAt', 'ASC']
        ]
      });

      if (admin) {
        await contact.update({
          assignedTo: admin.id,
          status: 'in-progress'
        });
      }
    }

    return {
      success: true,
      contactId: contact.id,
      notified: true
    };
  } catch (error) {
    console.error('Support worker error:', error);
    throw error;
  }
});

// Handle completed jobs
supportQueue.on('completed', (job, result) => {
  console.log(`Support job ${job.id} completed:`, result);
});

// Handle failed jobs
supportQueue.on('failed', (job, error) => {
  console.error(`Support job ${job.id} failed:`, error);
});

module.exports = supportQueue;


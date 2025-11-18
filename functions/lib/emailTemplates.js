"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmailTemplate = buildEmailTemplate;
const BRAND = {
    gradient: 'linear-gradient(135deg, #FF6B9D, #00D9FF)',
    headerBg: '#0F0F23',
    accent: '#FF6B9D',
    successGradient: 'linear-gradient(135deg, #10B981, #34D399)',
    dangerGradient: 'linear-gradient(135deg, #EF4444, #F87171)',
    textDark: '#0f172a',
    textLight: '#ffffff',
};
const ROLE_MESSAGES = {
    student: {
        title: 'Welcome, Student!',
        body: 'Join CSR projects, build your portfolio, and make an impact while learning.',
        cta: 'Browse CSR Projects',
        ctaLink: '/projects',
    },
    ngo: {
        title: 'Welcome, NGO Partner!',
        body: "Post projects, manage volunteers, and track your organization's impact.",
        cta: 'Create Your First Project',
        ctaLink: '/create-submission?type=project',
    },
    admin: {
        title: 'Welcome, Admin!',
        body: 'Manage the platform, moderate content, and ensure quality.',
        cta: 'Go to Admin Panel',
        ctaLink: '/dashboard',
    },
    volunteer: {
        title: 'Welcome, Volunteer!',
        body: 'Find volunteer opportunities and make a difference in your community.',
        cta: 'Explore Opportunities',
        ctaLink: '/projects',
    },
};
function wrapEmail(body, heading) {
    return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;background:#f8fafc;">
    ${heading ? `<div style="background:${BRAND.gradient};padding:30px 20px;text-align:center;"><h1 style="color:${BRAND.textLight};margin:0;font-size:28px;">${heading}</h1></div>` : ''}
    <div style="background:#ffffff;padding:30px 24px;color:${BRAND.textDark};line-height:1.6;font-size:16px;">
      ${body}
    </div>
    <div style="background:${BRAND.headerBg};color:${BRAND.textLight};padding:20px;text-align:center;font-size:14px;">
      <p style="margin:0;">— The Wasillah Team</p>
    </div>
  </div>
`.trim();
}
function primaryButton(label, href) {
    return `<p style="text-align:center;margin:24px 0;"><a href="${href}" style="display:inline-block;background:${BRAND.accent};color:${BRAND.textLight};padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">${label}</a></p>`;
}
function buildEmailTemplate(input) {
    switch (input.type) {
        case 'verification': {
            const subject = 'Verify your Wasilah account';
            const html = wrapEmail(`
        <p>Hello${input.name ? ` ${input.name}` : ''},</p>
        <p>Thanks for joining Wasilah. Please verify your email to finish setting up your account.</p>
        ${primaryButton('Verify Email', input.link)}
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;color:#334155">${input.link}</p>
      `, 'Verify your email');
            return { subject, html };
        }
        case 'forgot-password': {
            const subject = 'Reset your Wasilah password';
            const html = wrapEmail(`
        <p>Hello${input.name ? ` ${input.name}` : ''},</p>
        <p>You requested a password reset for your Wasilah account.</p>
        ${primaryButton('Reset Password', input.link)}
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;color:#334155">${input.link}</p>
      `, 'Reset your password');
            return { subject, html };
        }
        case 'welcome': {
            const roleContent = ROLE_MESSAGES[input.role || 'volunteer'];
            const subject = `Welcome to Wasilah, ${input.name}!`;
            const html = wrapEmail(`
        <p>Hi <strong>${input.name}</strong>,</p>
        <p>${roleContent.body}</p>
        ${primaryButton(roleContent.cta, roleContent.ctaLink)}
      `, roleContent.title);
            return { subject, html };
        }
        case 'project-submission': {
            const typeLabel = input.submissionType === 'event' ? 'Event' : 'Project';
            const subject = `${typeLabel} Submission Received: ${input.projectName}`;
            const html = wrapEmail(`
        <p>Hi <strong>${input.name}</strong>,</p>
        <p>Your submission "<strong>${input.projectName}</strong>" has been received and is under review.</p>
        <p>You'll be notified once it's approved.</p>
      `, `${typeLabel} Submitted`);
            return { subject, html };
        }
        case 'project-approval': {
            const typeLabel = input.submissionType === 'event' ? 'event' : 'project';
            const subject = `Great News! Your ${typeLabel} "${input.projectName}" has been approved`;
            const html = wrapEmail(`
        <p>Hi <strong>${input.name}</strong>,</p>
        <p>Great news! Your ${typeLabel} "<strong>${input.projectName}</strong>" has been approved.</p>
        <p>Thank you for contributing to Wasilah. Your ${typeLabel} is now live and visible to the community.</p>
      `, '🎉 Approved!');
            return { subject, html };
        }
        case 'reminder': {
            const subject = `Reminder: ${input.projectName}`;
            const html = wrapEmail(`
        <p>Hi <strong>${input.name}</strong>,</p>
        <p>This is your reminder for <strong>${input.projectName}</strong>:</p>
        <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:20px;margin:24px 0;border-radius:8px;color:#78350F;">
          ${input.message}
        </div>
      `, '⏰ Reminder');
            return { subject, html };
        }
        case 'volunteer-confirmation': {
            const subject = 'Thank you for volunteering with Wasilah!';
            const html = wrapEmail(`
        <p>Hi <strong>${input.name}</strong>,</p>
        <p>Thank you for volunteering with Wasilah! Your response has been recorded and we'll get back to you very soon.</p>
      `, '💌 Thank You!');
            return { subject, html };
        }
        case 'edit-request-submitted': {
            const subject = `Edit Request Received: ${input.submissionTitle}`;
            const html = wrapEmail(`
        <p>Hi <strong>${input.name}</strong>,</p>
        <p>Your edit request for the ${input.submissionType} "<strong>${input.submissionTitle}</strong>" has been submitted and is under review.</p>
      `, 'Edit Request Submitted');
            return { subject, html };
        }
        case 'edit-request-status': {
            const isApproved = input.status === 'approved';
            const subject = `Edit Request ${isApproved ? 'Approved' : 'Update'}: ${input.submissionTitle}`;
            const html = wrapEmail(`
        <p>Hi <strong>${input.name}</strong>,</p>
        ${isApproved
                ? `<p>Great news! Your edit request for the ${input.submissionType} "<strong>${input.submissionTitle}</strong>" has been approved.</p>`
                : `<p>We've reviewed your edit request for the ${input.submissionType} "<strong>${input.submissionTitle}</strong>" but cannot approve it at this time.</p>
               ${input.rejectionReason
                    ? `<div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:16px;margin:20px 0;border-radius:4px;color:#991B1B;">
                        <strong>Reason:</strong> ${input.rejectionReason}
                      </div>`
                    : ''}`}
      `, isApproved ? '✅ Edit Request Approved!' : 'Edit Request Update');
            return { subject, html };
        }
        case 'notification': {
            const subject = input.title;
            const html = wrapEmail(`
        <p>${input.body}</p>
        ${input.ctaLabel && input.ctaUrl ? primaryButton(input.ctaLabel, input.ctaUrl) : ''}
      `, 'Notification');
            return { subject, html };
        }
        default:
            throw new Error(`Unsupported template type: ${input.type}`);
    }
}
//# sourceMappingURL=emailTemplates.js.map
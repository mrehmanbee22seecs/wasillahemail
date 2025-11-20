/**
 * Email Automation Service
 * Handles automated email workflows, sequences, and triggers
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  EmailWorkflow,
  WorkflowTrigger,
  EmailTemplate,
  EmailSubscriber,
  TemplateRenderData,
  EmailSendResult,
} from '../types/email';
import { sendNotificationTemplate } from './resendEmailService';

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Create a new email workflow
 */
export async function createWorkflow(workflowData: Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'email_workflows'), {
      ...workflowData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        triggered: 0,
        completed: 0,
        failed: 0,
      },
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }
}

/**
 * Get all workflows
 */
export async function getAllWorkflows(): Promise<EmailWorkflow[]> {
  try {
    const workflowsRef = collection(db, 'email_workflows');
    const snapshot = await getDocs(workflowsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as EmailWorkflow));
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return [];
  }
}

/**
 * Get workflow by trigger type
 */
export async function getWorkflowByTrigger(trigger: WorkflowTrigger): Promise<EmailWorkflow | null> {
  try {
    const workflowsRef = collection(db, 'email_workflows');
    const q = query(
      workflowsRef,
      where('trigger', '==', trigger),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as EmailWorkflow;
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return null;
  }
}

/**
 * Update workflow
 */
export async function updateWorkflow(workflowId: string, updates: Partial<EmailWorkflow>): Promise<void> {
  try {
    const workflowRef = doc(db, 'email_workflows', workflowId);
    await updateDoc(workflowRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    throw error;
  }
}

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

/**
 * Trigger workflow execution
 */
export async function triggerWorkflow(
  trigger: WorkflowTrigger,
  recipientEmail: string,
  data: TemplateRenderData
): Promise<void> {
  try {
    const workflow = await getWorkflowByTrigger(trigger);
    if (!workflow) {
      console.log(`No active workflow found for trigger: ${trigger}`);
      return;
    }
    
    // Execute workflow actions
    for (const action of workflow.actions) {
      if (action.type === 'send_email' && action.config.templateId) {
        await sendTemplateEmail(action.config.templateId, recipientEmail, data);
      } else if (action.type === 'wait' && action.config.delayInHours) {
        // Schedule delayed action (requires Cloud Functions for production)
        console.log(`Would wait ${action.config.delayInHours} hours before next action`);
      }
    }
    
    // Update workflow stats
    await updateDoc(doc(db, 'email_workflows', workflow.id), {
      'stats.triggered': workflow.stats.triggered + 1,
      'stats.completed': workflow.stats.completed + 1,
    });
  } catch (error) {
    console.error('Error triggering workflow:', error);
    throw error;
  }
}

// ============================================================================
// AUTOMATED SEQUENCES
// ============================================================================

/**
 * Send welcome email sequence
 */
export async function sendWelcomeSequence(
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  try {
    const data: TemplateRenderData = {
      name: userName,
      email: userEmail,
      link: `${window.location.origin}/dashboard`,
    };
    
    await triggerWorkflow('user_signup', userEmail, data);
  } catch (error) {
    console.error('Error sending welcome sequence:', error);
    throw error;
  }
}

/**
 * Send project update emails
 */
export async function sendProjectUpdateEmail(
  recipientEmail: string,
  recipientName: string,
  projectTitle: string,
  status: 'submitted' | 'approved' | 'rejected',
  message?: string
): Promise<void> {
  try {
    const trigger: WorkflowTrigger = 
      status === 'submitted' ? 'project_submission' :
      status === 'approved' ? 'project_approval' :
      'project_rejection';
    
    const data: TemplateRenderData = {
      name: recipientName,
      email: recipientEmail,
      projectTitle,
      status,
      message: message || '',
      link: `${window.location.origin}/dashboard`,
    };
    
    await triggerWorkflow(trigger, recipientEmail, data);
  } catch (error) {
    console.error('Error sending project update:', error);
    throw error;
  }
}

/**
 * Send event reminder emails
 */
export async function sendEventReminder(
  recipientEmail: string,
  recipientName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  hoursBeforeEvent: number
): Promise<void> {
  try {
    const data: TemplateRenderData = {
      name: recipientName,
      email: recipientEmail,
      eventTitle,
      date: eventDate,
      time: eventTime,
      link: `${window.location.origin}/events`,
    };
    
    await triggerWorkflow('event_reminder', recipientEmail, data);
  } catch (error) {
    console.error('Error sending event reminder:', error);
    throw error;
  }
}

/**
 * Send achievement notification
 */
export async function sendAchievementEmail(
  recipientEmail: string,
  recipientName: string,
  achievementTitle: string,
  achievementDescription: string
): Promise<void> {
  try {
    const data: TemplateRenderData = {
      name: recipientName,
      email: recipientEmail,
      message: `${achievementTitle}: ${achievementDescription}`,
      link: `${window.location.origin}/profile`,
    };
    
    await triggerWorkflow('achievement_earned', recipientEmail, data);
  } catch (error) {
    console.error('Error sending achievement email:', error);
    throw error;
  }
}

/**
 * Send weekly digest to all active subscribers
 */
export async function sendWeeklyDigest(): Promise<void> {
  try {
    const subscribersRef = collection(db, 'email_subscribers');
    const q = query(
      subscribersRef,
      where('status', '==', 'subscribed'),
      where('preferences.weeklyDigest', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    for (const subscriberDoc of snapshot.docs) {
      const subscriber = subscriberDoc.data() as EmailSubscriber;
      
      const data: TemplateRenderData = {
        name: subscriber.name || 'Friend',
        email: subscriber.email,
        link: `${window.location.origin}/projects`,
      };
      
      await triggerWorkflow('weekly_digest', subscriber.email, data);
    }
    
    console.log(`Weekly digest sent to ${snapshot.docs.length} subscribers`);
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    throw error;
  }
}

// ============================================================================
// TEMPLATE RENDERING
// ============================================================================

/**
 * Render template with data
 */
export function renderTemplate(templateContent: string, data: TemplateRenderData): string {
  let rendered = templateContent;
  
  // Replace all variables
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key] || '';
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return rendered;
}

/**
 * Send email using template
 */
async function sendTemplateEmail(
  templateId: string,
  recipientEmail: string,
  data: TemplateRenderData
): Promise<EmailSendResult> {
  try {
    // Get template
    const templateRef = doc(db, 'email_templates', templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const template = templateSnap.data() as EmailTemplate;
    
    // Render template
    const subject = renderTemplate(template.subject, data);
    const html = renderTemplate(template.htmlContent, data);
    const text = renderTemplate(template.textContent, data);
    
    // Send email
    const result = await sendNotificationTemplate({
      email: recipientEmail,
      title: subject,
      body: text,
      ctaLabel: data.link ? 'View Details' : undefined,
      ctaUrl: data.link,
    });
    
    // Update template usage count
    await updateDoc(templateRef, {
      usageCount: template.usageCount + 1,
    });
    
    // Log email
    await addDoc(collection(db, 'email_logs'), {
      templateId,
      recipientEmail,
      subject,
      eventType: result.success ? 'sent' : 'failed',
      eventTimestamp: serverTimestamp(),
      errorMessage: result.error,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending template email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// DEFAULT WORKFLOWS
// ============================================================================

/**
 * Initialize default workflows
 */
export async function initializeDefaultWorkflows(adminUserId: string): Promise<void> {
  try {
    const defaultWorkflows: Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'stats'>[] = [
      {
        name: 'Welcome Sequence',
        description: 'Three-email welcome sequence for new users',
        trigger: 'user_signup',
        isActive: true,
        actions: [
          {
            id: 'welcome-1',
            type: 'send_email',
            config: { templateId: 'welcome-email' },
            nextActionId: 'wait-1',
          },
          {
            id: 'wait-1',
            type: 'wait',
            config: { delayInHours: 72 },
            nextActionId: 'welcome-2',
          },
          {
            id: 'welcome-2',
            type: 'send_email',
            config: { templateId: 'getting-started' },
            nextActionId: 'wait-2',
          },
          {
            id: 'wait-2',
            type: 'wait',
            config: { delayInHours: 96 },
            nextActionId: 'welcome-3',
          },
          {
            id: 'welcome-3',
            type: 'send_email',
            config: { templateId: 'platform-guide' },
          },
        ],
        createdBy: adminUserId,
      },
      {
        name: 'Project Submission Confirmation',
        description: 'Immediate confirmation when project is submitted',
        trigger: 'project_submission',
        isActive: true,
        actions: [
          {
            id: 'confirm-submission',
            type: 'send_email',
            config: { templateId: 'project-submission' },
          },
        ],
        createdBy: adminUserId,
      },
      {
        name: 'Event Reminder Sequence',
        description: 'Reminders 24h and 1h before event',
        trigger: 'event_reminder',
        isActive: true,
        actions: [
          {
            id: 'reminder-24h',
            type: 'send_email',
            config: { templateId: 'event-reminder-24h' },
            nextActionId: 'wait-23h',
          },
          {
            id: 'wait-23h',
            type: 'wait',
            config: { delayInHours: 23 },
            nextActionId: 'reminder-1h',
          },
          {
            id: 'reminder-1h',
            type: 'send_email',
            config: { templateId: 'event-reminder-1h' },
          },
        ],
        createdBy: adminUserId,
      },
    ];
    
    for (const workflow of defaultWorkflows) {
      await createWorkflow(workflow);
    }
    
    console.log('Default workflows initialized');
  } catch (error) {
    console.error('Error initializing default workflows:', error);
    throw error;
  }
}

export default {
  createWorkflow,
  getAllWorkflows,
  getWorkflowByTrigger,
  updateWorkflow,
  triggerWorkflow,
  sendWelcomeSequence,
  sendProjectUpdateEmail,
  sendEventReminder,
  sendAchievementEmail,
  sendWeeklyDigest,
  renderTemplate,
  initializeDefaultWorkflows,
};

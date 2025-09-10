// Email service placeholder for status update notifications
// In production, integrate with your preferred email service

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text: string
}

export interface StatusUpdateEmailData {
  customerName: string
  customerEmail: string
  requestId: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
  pickupDate: string
  pickupTime: string
  totalCost: number
  specialInstructions?: string
}

// Generate email templates
export function generateStatusUpdateEmail(data: StatusUpdateEmailData): EmailTemplate {
  const statusMessages = {
    pending: 'Your laundry request has been received and is being reviewed.',
    confirmed: 'Your laundry request has been confirmed! We will pick up your items as scheduled.',
    in_progress: 'Your laundry is currently being processed.',
    completed: 'Your laundry is ready for delivery! We will contact you shortly to arrange delivery.'
  }

  const statusColors = {
    pending: '#f59e0b', // yellow
    confirmed: '#3b82f6', // blue
    in_progress: '#8b5cf6', // purple
    completed: '#10b981' // green
  }

  const subject = `Laundry Service Update - Request #${data.requestId.slice(0, 8)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Laundry Service</h1>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.customerName}!</h2>
        
        <div style="background: ${statusColors[data.status]}; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; font-size: 18px;">Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1).replace('_', ' ')}</h3>
        </div>
        
        <p style="font-size: 16px; margin: 20px 0;">${statusMessages[data.status]}</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #374151;">Request Details:</h4>
          <p><strong>Request ID:</strong> ${data.requestId}</p>
          <p><strong>Pickup Date:</strong> ${new Date(data.pickupDate).toLocaleDateString()}</p>
          <p><strong>Pickup Time:</strong> ${data.pickupTime}</p>
          <p><strong>Total Cost:</strong> $${data.totalCost.toFixed(2)}</p>
          ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${data.specialInstructions}</p>` : ''}
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Thank you for choosing our laundry service!</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hello ${data.customerName}!

${statusMessages[data.status]}

Request Details:
- Request ID: ${data.requestId}
- Pickup Date: ${new Date(data.pickupDate).toLocaleDateString()}
- Pickup Time: ${data.pickupTime}
- Total Cost: $${data.totalCost.toFixed(2)}
${data.specialInstructions ? `- Special Instructions: ${data.specialInstructions}` : ''}

If you have any questions, please don't hesitate to contact us.
Thank you for choosing our laundry service!
  `

  return {
    to: data.customerEmail,
    subject,
    html,
    text
  }
}

// Placeholder email sending function
export async function sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // This is a placeholder implementation
  // In production, integrate with your email service:
  
  console.log('📧 Email would be sent:', {
    to: template.to,
    subject: template.subject,
    // Don't log the full content in production
    contentLength: template.html.length
  })

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simulate success/failure (90% success rate for demo)
  const success = Math.random() > 0.1
  
  if (success) {
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  } else {
    return {
      success: false,
      error: 'Email service temporarily unavailable'
    }
  }

  // Production integrations examples:
  
  // SendGrid:
  // const sgMail = require('@sendgrid/mail')
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  // const result = await sgMail.send(template)
  // return { success: true, messageId: result[0].headers['x-message-id'] }
  
  // AWS SES:
  // const AWS = require('aws-sdk')
  // const ses = new AWS.SES({ region: 'us-east-1' })
  // const result = await ses.sendEmail({
  //   Source: 'noreply@yourdomain.com',
  //   Destination: { ToAddresses: [template.to] },
  //   Message: {
  //     Subject: { Data: template.subject },
  //     Body: { Html: { Data: template.html }, Text: { Data: template.text } }
  //   }
  // }).promise()
  // return { success: true, messageId: result.MessageId }
  
  // Mailgun:
  // const mailgun = require('mailgun-js')({
  //   apiKey: process.env.MAILGUN_API_KEY,
  //   domain: process.env.MAILGUN_DOMAIN
  // })
  // const result = await mailgun.messages().send({
  //   from: 'noreply@yourdomain.com',
  //   to: template.to,
  //   subject: template.subject,
  //   html: template.html,
  //   text: template.text
  // })
  // return { success: true, messageId: result.id }
}

// Convenience function for status updates
export async function sendStatusUpdateEmail(data: StatusUpdateEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = generateStatusUpdateEmail(data)
  return await sendEmail(template)
}
